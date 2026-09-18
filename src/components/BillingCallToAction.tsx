/**
 * Billing Call-To-Action Component
 *
 * Phase 6 Task 1: Frontend integration for workspace status errors
 *
 * Shows upgrade prompts when API routes return workspace access errors.
 * Different variants for different workspace statuses.
 */

'use client';

import Link from 'next/link';
import type { WorkspaceStatus } from '@/types/domain';

interface BillingCallToActionProps {
  /**
   * Workspace status that triggered the error
   */
  status: WorkspaceStatus;

  /**
   * Error code from API response (e.g., "PAYMENT_PAST_DUE")
   */
  errorCode?: string;

  /**
   * Custom message (optional, overrides default)
   */
  message?: string;

  /**
   * Feature that was blocked (e.g., "create players")
   */
  blockedFeature?: string;

  /**
   * Layout variant
   */
  variant?: 'banner' | 'card' | 'inline';
}

/**
 * Billing Call-To-Action Component
 *
 * @example
 * ```tsx
 * // API error handler
 * if (error.code === 'PAYMENT_PAST_DUE') {
 *   return <BillingCallToAction status="past_due" blockedFeature="create players" />;
 * }
 *
 * // Grace period banner
 * <BillingCallToAction status="past_due" variant="banner" />
 *
 * // Inline prompt
 * <BillingCallToAction status="canceled" variant="inline" />
 * ```
 */
export function BillingCallToAction({
  status,
  errorCode,
  message,
  blockedFeature,
  variant = 'card',
}: BillingCallToActionProps) {
  const content = getStatusContent(status, errorCode, message, blockedFeature);

  if (variant === 'banner') {
    return (
      <div className={`w-full px-4 py-3 ${content.bgColor} ${content.textColor}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{content.icon}</span>
            <div>
              <p className="font-semibold">{content.title}</p>
              <p className="text-sm opacity-90">{content.message}</p>
            </div>
          </div>

          <Link
            href={content.ctaLink}
            className="bg-white text-gray-900 px-4 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors"
          >
            {content.ctaText}
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{content.icon}</span>
        <span className="text-gray-700">{content.message}</span>
        <Link href={content.ctaLink} className="text-blue-600 hover:text-blue-700 underline font-medium">
          {content.ctaText}
        </Link>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className={`rounded-lg border-2 p-6 ${content.borderColor} bg-white`}>
      <div className="flex items-start gap-4">
        <div className="text-3xl">{content.icon}</div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{content.title}</h3>
          <p className="text-gray-600 mb-4">{content.message}</p>

          {blockedFeature && (
            <p className="text-sm text-gray-500 mb-4">
              You attempted to <strong>{blockedFeature}</strong>, but your current subscription status does not allow this action.
            </p>
          )}

          <Link
            href={content.ctaLink}
            className={`inline-block px-6 py-3 rounded-md font-semibold transition-colors ${content.buttonColor}`}
          >
            {content.ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Get status-specific content
 */
function getStatusContent(
  status: WorkspaceStatus,
  errorCode?: string,
  customMessage?: string,
  blockedFeature?: string
) {
  switch (status) {
    case 'past_due':
      return {
        icon: '⚠️',
        title: 'Payment Past Due',
        message: customMessage || 'Your payment method was declined. Please update it to avoid service interruption.',
        ctaText: 'Update Payment Method',
        ctaLink: '/dashboard/settings/billing',
        bgColor: 'bg-yellow-500',
        textColor: 'text-white',
        borderColor: 'border-yellow-500',
        buttonColor: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      };

    case 'canceled':
      return {
        icon: '🚫',
        title: 'Subscription Canceled',
        message: customMessage || 'Your subscription has been canceled. Reactivate to continue using Hustle.',
        ctaText: 'Reactivate Subscription',
        ctaLink: '/dashboard/settings/billing',
        bgColor: 'bg-red-600',
        textColor: 'text-white',
        borderColor: 'border-red-500',
        buttonColor: 'bg-red-600 hover:bg-red-700 text-white',
      };

    case 'suspended':
      return {
        icon: '⛔',
        title: 'Account Suspended',
        message: customMessage || 'Your account has been suspended. Please contact support for assistance.',
        ctaText: 'Contact Support',
        ctaLink: '/support',
        bgColor: 'bg-red-700',
        textColor: 'text-white',
        borderColor: 'border-red-600',
        buttonColor: 'bg-red-700 hover:bg-red-800 text-white',
      };

    case 'deleted':
      return {
        icon: '🗑️',
        title: 'Workspace Deleted',
        message: customMessage || 'This workspace has been deleted and is no longer accessible.',
        ctaText: 'Create New Workspace',
        ctaLink: '/dashboard/workspaces/new',
        bgColor: 'bg-gray-600',
        textColor: 'text-white',
        borderColor: 'border-gray-500',
        buttonColor: 'bg-gray-700 hover:bg-gray-800 text-white',
      };

    case 'trial':
      return {
        icon: '⏰',
        title: 'Trial Expired',
        message: customMessage || 'Your trial has expired. Upgrade to a paid plan to continue using Hustle.',
        ctaText: 'Upgrade Now',
        ctaLink: '/billing/plans',
        bgColor: 'bg-blue-600',
        textColor: 'text-white',
        borderColor: 'border-blue-500',
        buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      };

    default:
      return {
        icon: '🔒',
        title: 'Access Restricted',
        message: customMessage || 'Your current subscription does not allow this action. Please upgrade your plan.',
        ctaText: 'View Plans',
        ctaLink: '/billing/plans',
        bgColor: 'bg-gray-600',
        textColor: 'text-white',
        borderColor: 'border-gray-500',
        buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      };
  }
}

/**
 * Grace Period Banner (Past Due Status)
 *
 * Shows at top of dashboard when payment is past due.
 * Allows reads but blocks writes.
 *
 * @example
 * ```tsx
 * // In dashboard layout
 * {access.isPastDue && <GracePeriodBanner />}
 * ```
 */
export function GracePeriodBanner() {
  return (
    <BillingCallToAction
      status="past_due"
      variant="banner"
      message="Your payment is overdue. You can still view existing data, but creating new content is disabled until you update your payment method."
    />
  );
}

/**
 * Canceled Subscription Banner
 *
 * Shows when subscription is canceled (no access).
 *
 * @example
 * ```tsx
 * // In dashboard layout
 * {access.isCanceled && <CanceledSubscriptionBanner />}
 * ```
 */
export function CanceledSubscriptionBanner() {
  return (
    <BillingCallToAction
      status="canceled"
      variant="banner"
      message="Your subscription has been canceled. Reactivate to continue tracking your players' stats."
    />
  );
}
