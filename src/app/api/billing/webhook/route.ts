/**
 * Stripe Webhook Handler
 *
 * Phase 4.5 migration: all workspace reads/writes moved off Firestore onto
 * Drizzle. Added webhook event idempotency via the `webhookEvent` table so
 * duplicate Stripe deliveries no-op.
 *
 * Events handled:
 * - checkout.session.completed
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_failed
 * - invoice.payment_succeeded
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import {
  getWorkspaceByStripeCustomerIdAdmin,
  updateWorkspaceBillingAdmin,
} from "@/lib/db/queries/workspaces";
import {
  hasProcessedWebhookEvent,
  markWebhookEventProcessed,
  recordWebhookEventError,
  recordWebhookEventReceipt,
} from "@/lib/db/queries/stripe-billing";
import { enforceWorkspacePlan } from "@/lib/stripe/plan-enforcement";
import { createLogger } from "@/lib/logger";
import { serverError, isStripeCardError } from '@/lib/api/errors';

const logger = createLogger("api/billing/webhook");

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST handler for Stripe webhooks. Must use raw body for signature verification.
 */
export async function POST(request: NextRequest) {
  let event: Stripe.Event | null = null;

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      logger.error("Missing Stripe signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    try {
      event = getStripeClient().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(
        "Webhook signature verification failed: " + msg,
        err instanceof Error ? err : new Error(msg)
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Idempotency guard — drop duplicate deliveries silently.
    if (await hasProcessedWebhookEvent(event.id)) {
      console.log(`[Stripe webhook] duplicate event ${event.id} (${event.type}) — skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    await recordWebhookEventReceipt(event.id, event.type, body);

    console.log(`Stripe webhook received: ${event.type}`, {
      eventId: event.id,
      created: new Date(event.created * 1000).toISOString(),
    });

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
          event.id
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
          event.id
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
          event.id
        );
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice, event.id);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, event.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    await markWebhookEventProcessed(event.id);
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(
      "Webhook handler error",
      error instanceof Error ? error : new Error(msg)
    );
    const ev = event as Stripe.Event | null;
    if (ev) {
      try {
        await recordWebhookEventError(ev.id, msg);
      } catch {
        // best effort
      }
    }
    return NextResponse.json(
      { error: "WEBHOOK_PROCESSING_FAILED" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  eventId: string
) {
  const workspaceId = session.metadata?.workspaceId;

  if (!workspaceId) {
    logger.error("Missing workspaceId in checkout session metadata");
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    logger.error("No subscription ID in checkout session");
    return;
  }

  const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  console.log("Checkout completed:", {
    workspaceId,
    priceId,
    stripeStatus: subscription.status,
    subscriptionId,
  });

  await enforceWorkspacePlan(workspaceId, {
    stripePriceId: priceId,
    stripeStatus: subscription.status,
    source: "webhook",
    stripeEventId: eventId,
  });

  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  await updateWorkspaceBillingAdmin(workspaceId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd: new Date(periodEnd * 1000),
    subscriptionStatus: subscription.status,
  });
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  eventId: string
) {
  const customerId = subscription.customer as string;

  const workspace = await getWorkspaceByStripeCustomerIdAdmin(customerId);
  if (!workspace) {
    logger.error("Workspace not found for customer: " + customerId);
    return;
  }

  const priceId = subscription.items.data[0].price.id;

  console.log("Subscription updated:", {
    workspaceId: workspace.id,
    priceId,
    stripeStatus: subscription.status,
    subscriptionId: subscription.id,
  });

  await enforceWorkspacePlan(workspace.id, {
    stripePriceId: priceId,
    stripeStatus: subscription.status,
    source: "webhook",
    stripeEventId: eventId,
  });

  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  await updateWorkspaceBillingAdmin(workspace.id, {
    currentPeriodEnd: new Date(periodEnd * 1000),
    subscriptionStatus: subscription.status,
  });
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  eventId: string
) {
  const customerId = subscription.customer as string;

  const workspace = await getWorkspaceByStripeCustomerIdAdmin(customerId);
  if (!workspace) {
    logger.error("Workspace not found for customer: " + customerId);
    return;
  }

  const priceId = subscription.items.data[0].price.id;

  console.log("Subscription deleted:", {
    workspaceId: workspace.id,
    subscriptionId: subscription.id,
  });

  await enforceWorkspacePlan(workspace.id, {
    stripePriceId: priceId,
    stripeStatus: "canceled",
    source: "webhook",
    stripeEventId: eventId,
  });

  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  await updateWorkspaceBillingAdmin(workspace.id, {
    currentPeriodEnd: new Date(periodEnd * 1000),
    subscriptionStatus: "canceled",
    canceledAt: new Date(),
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

  if (!subscriptionId) {
    return; // one-time payment, ignore
  }

  const workspace = await getWorkspaceByStripeCustomerIdAdmin(customerId);
  if (!workspace) {
    logger.error("Workspace not found for customer: " + customerId);
    return;
  }

  console.log("Payment failed:", {
    workspaceId: workspace.id,
    invoiceId: invoice.id,
    attemptCount: invoice.attempt_count,
  });

  const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  await enforceWorkspacePlan(workspace.id, {
    stripePriceId: priceId,
    stripeStatus: "past_due",
    source: "webhook",
    stripeEventId: eventId,
  });

  await updateWorkspaceBillingAdmin(workspace.id, {
    lastPaymentFailedAt: new Date(),
    subscriptionStatus: "past_due",
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, eventId: string) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

  if (!subscriptionId) {
    return;
  }

  const workspace = await getWorkspaceByStripeCustomerIdAdmin(customerId);
  if (!workspace) {
    logger.error("Workspace not found for customer: " + customerId);
    return;
  }

  console.log("Payment succeeded:", {
    workspaceId: workspace.id,
    invoiceId: invoice.id,
    amount: invoice.amount_paid / 100,
  });

  const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  await enforceWorkspacePlan(workspace.id, {
    stripePriceId: priceId,
    stripeStatus: "active",
    source: "webhook",
    stripeEventId: eventId,
  });

  const renewalPeriodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  await updateWorkspaceBillingAdmin(workspace.id, {
    currentPeriodEnd: new Date(renewalPeriodEnd * 1000),
    subscriptionStatus: "active",
  });
}
