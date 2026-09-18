/**
 * Stripe Plan Mapping Utilities
 *
 * Maps workspace plans to Stripe price IDs and vice versa.
 * Provides plan limit enforcement data.
 */

import type { WorkspacePlan, WorkspaceStatus } from '@/types/domain';
import type Stripe from 'stripe';

/**
 * Get Stripe price ID for a workspace plan
 *
 * @param plan - Workspace plan tier
 * @returns Stripe price ID
 * @throws Error if no price ID configured for plan
 */
export function getPriceIdForPlan(plan: WorkspacePlan): string {
  const priceIds: Record<Exclude<WorkspacePlan, 'free'>, string> = {
    starter: process.env.STRIPE_PRICE_ID_STARTER!,
    plus: process.env.STRIPE_PRICE_ID_PLUS!,
    pro: process.env.STRIPE_PRICE_ID_PRO!,
  };

  if (plan === 'free') {
    throw new Error('Free trial plan has no Stripe price ID');
  }

  const priceId = priceIds[plan];
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for plan: ${plan}`);
  }

  return priceId;
}

/**
 * Get workspace plan from Stripe price ID
 *
 * @param priceId - Stripe price ID
 * @returns Workspace plan tier
 * @throws Error if price ID is unknown
 */
export function getPlanForPriceId(priceId: string): WorkspacePlan {
  const plans: Record<string, WorkspacePlan> = {
    [process.env.STRIPE_PRICE_ID_STARTER!]: 'starter',
    [process.env.STRIPE_PRICE_ID_PLUS!]: 'plus',
    [process.env.STRIPE_PRICE_ID_PRO!]: 'pro',
  };

  const plan = plans[priceId];
  if (!plan) {
    throw new Error(`Unknown Stripe price ID: ${priceId}`);
  }

  return plan;
}

/**
 * Get plan limits for enforcement
 *
 * @param plan - Workspace plan tier
 * @returns Plan limits object
 */
export function getPlanLimits(plan: WorkspacePlan) {
  const limits = {
    free: {
      maxPlayers: 2,
      maxGamesPerMonth: 10,
      storageMB: 100,
    },
    starter: {
      maxPlayers: 5,
      maxGamesPerMonth: 50,
      storageMB: 500,
    },
    plus: {
      maxPlayers: 15,
      maxGamesPerMonth: 200,
      storageMB: 2048, // 2GB
    },
    pro: {
      maxPlayers: 9999, // Effectively unlimited
      maxGamesPerMonth: 9999, // Effectively unlimited
      storageMB: 10240, // 10GB
    },
  };

  return limits[plan];
}

/**
 * Map Stripe subscription status to workspace status
 *
 * @param stripeStatus - Stripe subscription status
 * @returns Workspace status
 */
export function mapStripeStatusToWorkspaceStatus(
  stripeStatus: Stripe.Subscription.Status
): WorkspaceStatus {
  const statusMap: Record<Stripe.Subscription.Status, WorkspaceStatus> = {
    active: 'active',
    trialing: 'trial', // Should not happen (we manage trials in Firestore)
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'suspended',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
    paused: 'suspended', // Stripe Billing pause feature
  };

  return statusMap[stripeStatus] || 'suspended';
}

/**
 * Get friendly plan name for display
 *
 * @param plan - Workspace plan tier
 * @returns Human-readable plan name
 */
export function getPlanDisplayName(plan: WorkspacePlan): string {
  const names = {
    free: 'Free Trial',
    starter: 'Starter',
    plus: 'Plus',
    pro: 'Pro',
  };

  return names[plan];
}

/**
 * Get plan monthly price for display
 *
 * @param plan - Workspace plan tier
 * @returns Monthly price in USD
 */
export function getPlanPrice(plan: WorkspacePlan): number {
  const prices = {
    free: 0,
    starter: 9,
    plus: 19,
    pro: 39,
  };

  return prices[plan];
}

/**
 * Check if plan has feature
 *
 * @param plan - Workspace plan tier
 * @param feature - Feature name
 * @returns true if plan includes feature
 */
export function planHasFeature(plan: WorkspacePlan, feature: string): boolean {
  const features: Record<WorkspacePlan, string[]> = {
    free: ['game_verification', 'basic_stats'],
    starter: ['game_verification', 'basic_stats'],
    plus: ['game_verification', 'basic_stats', 'advanced_analytics'],
    pro: [
      'game_verification',
      'basic_stats',
      'advanced_analytics',
      'export_reports',
      'priority_support',
    ],
  };

  return features[plan].includes(feature);
}
