/**
 * Plan Change Utilities
 *
 * Phase 7 Task 3: Self-Service Plan Changes
 *
 * Provides utilities for upgrading/downgrading workspace plans:
 * - Available plan listing
 * - Proration preview calculation
 * - Checkout session creation for plan changes
 */

import { getStripeClient } from '@/lib/stripe/client';
import type { Workspace, WorkspacePlan } from '@/types/domain';
import {
  getPriceIdForPlan,
  getPlanForPriceId,
  getPlanDisplayName,
  getPlanPrice,
  getPlanLimits,
} from '@/lib/stripe/plan-mapping';

/**
 * Available Plan Option
 */
export interface AvailablePlan {
  plan: WorkspacePlan;
  priceId: string;
  displayName: string;
  monthlyPrice: number;
  limits: {
    maxPlayers: number;
    maxGamesPerMonth: number;
    storageMB: number;
  };
  isCurrent: boolean;
  changeType: 'upgrade' | 'downgrade' | 'current';
}

/**
 * Proration Preview
 */
export interface ProrationPreview {
  amountDue: number; // Amount to charge/credit (in cents)
  currentPeriodEnd: Date;
  proratedAmount: number; // Prorated credit/charge (in cents)
  immediateCharge: boolean; // true if upgrade (charge now), false if downgrade (apply at period end)
  currencyCode: string;
}

/**
 * Get available plans for workspace
 *
 * Returns list of all plans with metadata, sorted by price (low to high).
 * Marks current plan and determines if each option is upgrade/downgrade.
 *
 * @param workspace - Current workspace
 * @returns Array of available plans
 */
export function getAvailablePlans(workspace: Workspace): AvailablePlan[] {
  const plans: WorkspacePlan[] = ['starter', 'plus', 'pro'];
  const currentPlan = workspace.plan;
  const currentPrice = getPlanPrice(currentPlan);

  return plans.map((plan) => {
    const planPrice = getPlanPrice(plan);
    const isCurrent = plan === currentPlan;

    let changeType: 'upgrade' | 'downgrade' | 'current';
    if (isCurrent) {
      changeType = 'current';
    } else if (planPrice > currentPrice) {
      changeType = 'upgrade';
    } else {
      changeType = 'downgrade';
    }

    return {
      plan,
      priceId: getPriceIdForPlan(plan),
      displayName: getPlanDisplayName(plan),
      monthlyPrice: planPrice,
      limits: getPlanLimits(plan),
      isCurrent,
      changeType,
    };
  });
}

/**
 * Get proration preview for plan change
 *
 * Uses Stripe's upcoming invoice API to calculate proration.
 * - Upgrades: Immediate charge (prorated amount for remainder of period)
 * - Downgrades: Credit applied at period end (no immediate refund)
 *
 * @param workspace - Current workspace
 * @param targetPriceId - Target Stripe price ID
 * @returns Proration preview
 * @throws Error if workspace has no Stripe subscription
 * @throws Error if Stripe API fails
 */
export async function getProrationPreview(
  workspace: Workspace,
  targetPriceId: string
): Promise<ProrationPreview> {
  const subscriptionId = workspace.billing.stripeSubscriptionId;

  if (!subscriptionId) {
    throw new Error('Workspace has no Stripe subscription');
  }

  try {
    // Fetch current subscription
    const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);

    // Get subscription item ID (first item in subscription)
    const subscriptionItemId = subscription.items.data[0].id;

    // Preview upcoming invoice with plan change
    const upcomingInvoice = await getStripeClient().invoices.createPreview({
      customer: subscription.customer as string,
      subscription: subscriptionId,
      subscription_details: {
        items: [
          {
            id: subscriptionItemId,
            price: targetPriceId,
          },
        ],
        proration_behavior: 'always_invoice', // Always show proration
      },
    });

    // Determine if upgrade or downgrade
    const currentPriceId = subscription.items.data[0].price.id;
    const currentPlan = getPlanForPriceId(currentPriceId);
    const targetPlan = getPlanForPriceId(targetPriceId);
    const currentPrice = getPlanPrice(currentPlan);
    const targetPrice = getPlanPrice(targetPlan);
    const isUpgrade = targetPrice > currentPrice;

    // Access current_period_end from subscription data
    const currentPeriodEndTimestamp = (subscription as unknown as { current_period_end: number }).current_period_end;

    return {
      amountDue: upcomingInvoice.amount_due,
      currentPeriodEnd: new Date(currentPeriodEndTimestamp * 1000),
      proratedAmount: upcomingInvoice.amount_due, // Simplified: amount_due includes proration
      immediateCharge: isUpgrade,
      currencyCode: upcomingInvoice.currency.toUpperCase(),
    };
  } catch (error: any) {
    console.error('[Plan Change] Failed to get proration preview:', error.message);
    throw new Error(`Failed to calculate proration: ${error.message}`);
  }
}

/**
 * Build Stripe Checkout session for plan change
 *
 * Creates a Stripe Checkout session for subscription update.
 * - Mode: 'subscription' (updates existing subscription)
 * - Payment method: Reuse existing payment method
 * - Proration: Automatic (Stripe handles billing)
 *
 * @param workspace - Current workspace
 * @param targetPriceId - Target Stripe price ID
 * @returns Checkout session URL
 * @throws Error if workspace has no Stripe subscription
 * @throws Error if Stripe API fails
 */
export async function buildCheckoutSession(
  workspace: Workspace,
  targetPriceId: string
): Promise<string> {
  const customerId = workspace.billing.stripeCustomerId;
  const subscriptionId = workspace.billing.stripeSubscriptionId;

  if (!customerId || !subscriptionId) {
    throw new Error('Workspace has no Stripe customer or subscription');
  }

  try {
    // Build success/cancel URLs
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_WEBSITE_DOMAIN ||
      'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard/settings/billing?plan_changed=true`;
    const cancelUrl = `${baseUrl}/dashboard/billing/change-plan?canceled=true`;

    // Create Checkout session for subscription update
    const session = await getStripeClient().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: targetPriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        workspaceId: workspace.id,
        action: 'plan_change',
      },
      // Update existing subscription
      subscription_data: {
        metadata: {
          workspaceId: workspace.id,
        },
      },
      // Reuse payment method from existing subscription
      payment_method_collection: 'if_required', // Only collect if needed
    });

    return session.url!;
  } catch (error: any) {
    console.error('[Plan Change] Failed to create checkout session:', error.message);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
}

/**
 * Validate workspace eligibility for plan change
 *
 * Rules:
 * - active: Eligible for all changes
 * - past_due: Eligible (must update payment first via checkout)
 * - canceled: Not eligible (must reactivate first)
 * - suspended: Not eligible (contact support)
 * - deleted: Not eligible (no recovery)
 * - trial: Not eligible (no Stripe subscription yet)
 *
 * @param workspace - Workspace to validate
 * @returns Object with eligibility and reason
 */
export function validatePlanChangeEligibility(workspace: Workspace): {
  eligible: boolean;
  reason?: string;
} {
  switch (workspace.status) {
    case 'active':
      return { eligible: true };

    case 'past_due':
      // Allow plan change, but payment will be required in checkout
      return { eligible: true };

    case 'canceled':
      return {
        eligible: false,
        reason: 'Subscription canceled. Please reactivate your subscription first.',
      };

    case 'suspended':
      return {
        eligible: false,
        reason: 'Account suspended. Please contact support.',
      };

    case 'deleted':
      return {
        eligible: false,
        reason: 'Workspace deleted. No recovery possible.',
      };

    case 'trial':
      return {
        eligible: false,
        reason: 'Free trial has no Stripe subscription. Please upgrade to a paid plan first.',
      };

    default:
      return {
        eligible: false,
        reason: 'Unknown workspace status. Please contact support.',
      };
  }
}
