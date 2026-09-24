/**
 * Stripe Webhook Handler (notification side)
 *
 * Sends notification emails on subscription lifecycle events. Idempotent via
 * the `webhookEvent` table so duplicate Stripe deliveries are no-ops.
 *
 * Phase 4.5 migration: workspace + owner-user lookups moved off Firestore
 * onto Drizzle.
 *
 * - invoice.payment_failed         → payment-failed email; status → past_due
 * - customer.subscription.deleted  → subscription-canceled email; status → canceled
 * - customer.subscription.updated  → reflect Stripe status; cancel-email if newly canceled
 * - checkout.session.completed     → handled by /api/billing/webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import {
  getWorkspaceByStripeCustomerIdAdmin,
  updateWorkspaceBillingAdmin,
  updateWorkspaceStatusAdmin,
} from "@/lib/db/queries/workspaces";
import {
  getWorkspaceOwnerUser,
  hasProcessedWebhookEvent,
  markWebhookEventProcessed,
  recordWebhookEventError,
  recordWebhookEventReceipt,
} from "@/lib/db/queries/stripe-billing";
import { sendEmail } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { createLogger } from "@/lib/logger";
import { serverError, isStripeCardError } from '@/lib/api/errors';

const logger = createLogger("api/webhooks/stripe");

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  let event: Stripe.Event | null = null;

  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      logger.error("Missing Stripe signature header");
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    try {
      event = getStripeClient().webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(
        "Webhook signature verification failed",
        err instanceof Error ? err : new Error(msg)
      );
      return NextResponse.json(
        { error: 'INVALID_SIGNATURE' },
        { status: 400 }
      );
    }

    if (await hasProcessedWebhookEvent(event.id)) {
      logger.info(`Duplicate event ${event.id} — skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    await recordWebhookEventReceipt(event.id, event.type, body);

    logger.info(`Webhook received: ${event.type}`, {
      eventId: event.id,
      eventType: event.type,
    });

    switch (event.type) {
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "checkout.session.completed":
        logger.info("Checkout session completed — handled by /api/billing/webhook");
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    await markWebhookEventProcessed(event.id);
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(
      "Webhook processing error",
      error instanceof Error ? error : new Error(msg)
    );
    const ev = event as Stripe.Event | null;
    if (ev) {
      try {
        await recordWebhookEventError(ev.id, msg);
      } catch {
        // best-effort
      }
    }
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  logger.info("Handling payment failed", {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amount: invoice.amount_due,
  });

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  if (!customerId) {
    logger.warn("Invoice has no customer id");
    return;
  }

  const workspace = await getWorkspaceByStripeCustomerIdAdmin(customerId);
  if (!workspace) {
    logger.warn("No workspace found for Stripe customer", { customerId });
    return;
  }

  const owner = await getWorkspaceOwnerUser(workspace.id);
  if (!owner?.email) {
    logger.warn("Workspace owner has no email", { workspaceId: workspace.id });
    return;
  }

  // Extract payment method last4 if expanded
  let paymentMethodLast4: string | undefined;
  const invoicePaymentIntent = (invoice as unknown as {
    payment_intent?: Stripe.PaymentIntent | string | null;
  }).payment_intent;
  if (invoicePaymentIntent && typeof invoicePaymentIntent === "object") {
    const pi = invoicePaymentIntent as Stripe.PaymentIntent;
    if (pi.payment_method && typeof pi.payment_method === "object") {
      const pm = pi.payment_method as Stripe.PaymentMethod;
      if (pm.card) {
        paymentMethodLast4 = pm.card.last4;
      }
    }
  }

  const template = emailTemplates.paymentFailed({
    name: owner.firstName || "User",
    planName: workspace.plan || "unknown",
    amount: invoice.amount_due,
    paymentMethodLast4,
    updatePaymentUrl: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing`,
    invoiceUrl: invoice.hosted_invoice_url || undefined,
  });

  await sendEmail({
    to: owner.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  logger.info("Payment failed email sent", {
    userId: owner.id,
    workspaceId: workspace.id,
    email: owner.email,
  });

  await updateWorkspaceStatusAdmin(workspace.id, "past_due");
  await updateWorkspaceBillingAdmin(workspace.id, {
    lastPaymentFailedAt: new Date(),
    subscriptionStatus: "past_due",
  });

  logger.info("Workspace status updated to past_due", { workspaceId: workspace.id });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info("Handling subscription deleted", {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
  });

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) {
    logger.warn("Subscription has no customer id");
    return;
  }

  const workspace = await getWorkspaceByStripeCustomerIdAdmin(customerId);
  if (!workspace) {
    logger.warn("No workspace found for Stripe customer", { customerId });
    return;
  }

  const owner = await getWorkspaceOwnerUser(workspace.id);
  if (!owner?.email) {
    logger.warn("Workspace owner has no email", { workspaceId: workspace.id });
    return;
  }

  const template = emailTemplates.subscriptionCanceled({
    name: owner.firstName || "User",
    planName: workspace.plan || "unknown",
    cancellationDate: new Date().toLocaleDateString("en-US", { dateStyle: "long" }),
    reactivateUrl: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing`,
  });

  await sendEmail({
    to: owner.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  logger.info("Subscription canceled email sent", {
    userId: owner.id,
    workspaceId: workspace.id,
    email: owner.email,
  });

  await updateWorkspaceStatusAdmin(workspace.id, "canceled");
  await updateWorkspaceBillingAdmin(workspace.id, {
    canceledAt: new Date(),
    subscriptionStatus: "canceled",
  });

  logger.info("Workspace status updated to canceled", { workspaceId: workspace.id });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info("Handling subscription updated", {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
  });

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) {
    logger.warn("Subscription has no customer id");
    return;
  }

  const workspace = await getWorkspaceByStripeCustomerIdAdmin(customerId);
  if (!workspace) {
    logger.warn("No workspace found for Stripe customer", { customerId });
    return;
  }

  const previousStatus = workspace.status;
  let newStatus: "active" | "trial" | "past_due" | "canceled" = previousStatus as
    | "active"
    | "trial"
    | "past_due"
    | "canceled";

  switch (subscription.status) {
    case "active":
      newStatus = "active";
      break;
    case "trialing":
      newStatus = "trial";
      break;
    case "past_due":
      newStatus = "past_due";
      break;
    case "canceled":
    case "unpaid":
      newStatus = "canceled";
      break;
  }

  await updateWorkspaceStatusAdmin(workspace.id, newStatus);
  await updateWorkspaceBillingAdmin(workspace.id, {
    subscriptionStatus: subscription.status,
  });

  logger.info("Workspace status updated", {
    workspaceId: workspace.id,
    previousStatus,
    newStatus,
  });

  if (newStatus === "canceled" && previousStatus !== "canceled") {
    const owner = await getWorkspaceOwnerUser(workspace.id);
    if (owner?.email) {
      const template = emailTemplates.subscriptionCanceled({
        name: owner.firstName || "User",
        planName: workspace.plan || "unknown",
        cancellationDate: new Date().toLocaleDateString("en-US", { dateStyle: "long" }),
        reactivateUrl: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing`,
      });

      await sendEmail({
        to: owner.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info("Subscription canceled email sent (via subscription updated)", {
        userId: owner.id,
        workspaceId: workspace.id,
        email: owner.email,
      });
    }
  }
}
