/**
 * Stripe Event Replay Endpoint (Admin-Only)
 *
 * POST /api/admin/billing/replay-events
 *
 * Reprocesses recent Stripe events for a workspace to fix billing drift.
 * Fetches historical events from Stripe and re-runs the relevant logic.
 *
 * Phase 4.5 migration: workspace + user lookups moved off Firestore onto Drizzle.
 *
 * Security: admin-only. isAdmin() from @/lib/admin reads ADMIN_USER_IDS and fails
 * closed (unset or empty means nobody is an admin).
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe/client';
import { authWithProfile } from '@/lib/auth';
import {
  getWorkspaceByIdAdmin,
  getWorkspaceByStripeCustomerIdAdmin,
  updateWorkspaceBillingAdmin,
} from '@/lib/db/queries/workspaces';
import { enforceWorkspacePlan } from '@/lib/stripe/plan-enforcement';
import { createLogger } from '@/lib/logger';
import { isAdmin } from '@/lib/admin';

const logger = createLogger('api/admin/billing/replay-events');

interface ReplayReport {
  workspaceId: string;
  reprocessed: Array<{
    eventId: string;
    type: string;
    created: string;
  }>;
  skipped: Array<{
    eventId: string;
    type: string;
    reason: string;
  }>;
  updatedWorkspaceStatus: string;
  updatedPlan: string;
  lastStripeStatus: string | null;
  totalEventsRetrieved: number;
  totalReprocessed: number;
  totalSkipped: number;
}

export async function POST(request: NextRequest) {
  try {
    const user = await authWithProfile();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isAdmin(user.uid)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const workspace = await getWorkspaceByIdAdmin(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
        { status: 404 }
      );
    }

    if (!workspace.billing.stripeCustomerId) {
      return NextResponse.json(
        {
          error: 'NO_STRIPE_CUSTOMER',
          message: 'Workspace has no Stripe customer ID - nothing to replay',
        },
        { status: 400 }
      );
    }

    const report: ReplayReport = {
      workspaceId,
      reprocessed: [],
      skipped: [],
      updatedWorkspaceStatus: workspace.status,
      updatedPlan: workspace.plan,
      lastStripeStatus: null,
      totalEventsRetrieved: 0,
      totalReprocessed: 0,
      totalSkipped: 0,
    };

    const events = await getStripeClient().events.list({
      limit: 100,
      type: [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_failed',
        'invoice.payment_succeeded',
      ].join(',') as never,
    });

    const customerEvents = events.data.filter((event) => {
      const data = event.data.object as unknown as Record<string, unknown>;
      const meta = data.metadata as Record<string, string> | undefined;
      return (
        data.customer === workspace.billing.stripeCustomerId ||
        meta?.workspaceId === workspaceId
      );
    });

    report.totalEventsRetrieved = customerEvents.length;

    console.log('[Replay] Processing events:', {
      workspaceId,
      customerId: workspace.billing.stripeCustomerId,
      totalEvents: customerEvents.length,
    });

    const sortedEvents = customerEvents.sort((a, b) => a.created - b.created);

    for (const event of sortedEvents) {
      try {
        switch (event.type) {
          case 'checkout.session.completed':
            await replayCheckoutSessionCompleted(
              event.data.object as Stripe.Checkout.Session,
              workspaceId,
              event.id
            );
            report.reprocessed.push({
              eventId: event.id,
              type: event.type,
              created: new Date(event.created * 1000).toISOString(),
            });
            break;

          case 'customer.subscription.updated':
            await replaySubscriptionUpdated(
              event.data.object as Stripe.Subscription,
              workspace.billing.stripeCustomerId,
              event.id
            );
            report.reprocessed.push({
              eventId: event.id,
              type: event.type,
              created: new Date(event.created * 1000).toISOString(),
            });
            report.lastStripeStatus = (event.data.object as Stripe.Subscription).status;
            break;

          case 'customer.subscription.deleted':
            await replaySubscriptionDeleted(
              event.data.object as Stripe.Subscription,
              workspace.billing.stripeCustomerId,
              event.id
            );
            report.reprocessed.push({
              eventId: event.id,
              type: event.type,
              created: new Date(event.created * 1000).toISOString(),
            });
            report.lastStripeStatus = 'canceled';
            break;

          case 'invoice.payment_failed':
            await replayPaymentFailed(
              event.data.object as Stripe.Invoice,
              workspace.billing.stripeCustomerId,
              event.id
            );
            report.reprocessed.push({
              eventId: event.id,
              type: event.type,
              created: new Date(event.created * 1000).toISOString(),
            });
            break;

          case 'invoice.payment_succeeded':
            await replayPaymentSucceeded(
              event.data.object as Stripe.Invoice,
              workspace.billing.stripeCustomerId,
              event.id
            );
            report.reprocessed.push({
              eventId: event.id,
              type: event.type,
              created: new Date(event.created * 1000).toISOString(),
            });
            break;

          default:
            report.skipped.push({
              eventId: event.id,
              type: event.type,
              reason: 'Unsupported event type',
            });
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(
          `Error processing event ${event.id}: ` + msg,
          error instanceof Error ? error : new Error(msg)
        );
        report.skipped.push({
          eventId: event.id,
          type: event.type,
          reason: msg || 'Processing error',
        });
      }
    }

    // Refresh final workspace state
    const updated = await getWorkspaceByIdAdmin(workspaceId);
    if (updated) {
      report.updatedWorkspaceStatus = updated.status;
      report.updatedPlan = updated.plan;
    }
    report.totalReprocessed = report.reprocessed.length;
    report.totalSkipped = report.skipped.length;

    console.log('[Replay] Completed:', {
      workspaceId,
      reprocessed: report.totalReprocessed,
      skipped: report.totalSkipped,
      finalStatus: report.updatedWorkspaceStatus,
      finalPlan: report.updatedPlan,
    });

    return NextResponse.json(report);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(
      'Replay error',
      error instanceof Error ? error : new Error(msg)
    );
    return NextResponse.json(
      { error: 'REPLAY_FAILED', message: msg || 'Event replay failed' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Replay handlers — mirror the live webhook handlers but route through
// enforceWorkspacePlan with source='replay'.
// ---------------------------------------------------------------------------

async function replayCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  workspaceId: string,
  eventId: string
) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    console.warn('[Replay] No subscription ID in checkout session');
    return;
  }

  const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  await enforceWorkspacePlan(workspaceId, {
    stripePriceId: priceId,
    stripeStatus: subscription.status,
    source: 'replay',
    stripeEventId: eventId,
  });

  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  await updateWorkspaceBillingAdmin(workspaceId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd: new Date(periodEnd * 1000),
  });
}

async function replaySubscriptionUpdated(
  subscription: Stripe.Subscription,
  customerId: string,
  eventId: string
) {
  const workspace = await getWorkspaceByStripeCustomerIdAdmin(customerId);
  if (!workspace) {
    console.warn('[Replay] Workspace not found for customer:', customerId);
    return;
  }

  const priceId = subscription.items.data[0].price.id;

  await enforceWorkspacePlan(workspace.id, {
    stripePriceId: priceId,
    stripeStatus: subscription.status,
    source: 'replay',
    stripeEventId: eventId,
  });

  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  await updateWorkspaceBillingAdmin(workspace.id, {
    currentPeriodEnd: new Date(periodEnd * 1000),
  });
}

async function replaySubscriptionDeleted(
  subscription: Stripe.Subscription,
  customerId: string,
  eventId: string
) {
  const workspace = await getWorkspaceByStripeCustomerIdAdmin(customerId);
  if (!workspace) {
    console.warn('[Replay] Workspace not found for customer:', customerId);
    return;
  }

  const priceId = subscription.items.data[0].price.id;

  await enforceWorkspacePlan(workspace.id, {
    stripePriceId: priceId,
    stripeStatus: 'canceled',
    source: 'replay',
    stripeEventId: eventId,
  });

  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  await updateWorkspaceBillingAdmin(workspace.id, {
    currentPeriodEnd: new Date(periodEnd * 1000),
  });
}

async function replayPaymentFailed(
  invoice: Stripe.Invoice,
  customerId: string,
  eventId: string
) {
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;
  if (!subscriptionId) return;

  const workspace = await getWorkspaceByStripeCustomerIdAdmin(customerId);
  if (!workspace) {
    console.warn('[Replay] Workspace not found for customer:', customerId);
    return;
  }

  const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  await enforceWorkspacePlan(workspace.id, {
    stripePriceId: priceId,
    stripeStatus: 'past_due',
    source: 'replay',
    stripeEventId: eventId,
  });
}

async function replayPaymentSucceeded(
  invoice: Stripe.Invoice,
  customerId: string,
  eventId: string
) {
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;
  if (!subscriptionId) return;

  const workspace = await getWorkspaceByStripeCustomerIdAdmin(customerId);
  if (!workspace) {
    console.warn('[Replay] Workspace not found for customer:', customerId);
    return;
  }

  const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  await enforceWorkspacePlan(workspace.id, {
    stripePriceId: priceId,
    stripeStatus: 'active',
    source: 'replay',
    stripeEventId: eventId,
  });

  const renewalPeriodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  await updateWorkspaceBillingAdmin(workspace.id, {
    currentPeriodEnd: new Date(renewalPeriodEnd * 1000),
  });
}
