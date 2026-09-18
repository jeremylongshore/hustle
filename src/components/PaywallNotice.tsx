/**
 * Paywall Notice Component
 *
 * Phase 7: Access Enforcement UI
 *
 * Displays when user hits a plan limit or tries to access a locked feature.
 * Includes upgrade button and clear messaging about what plan is needed.
 */

'use client';

import Link from 'next/link';
import { WorkspacePlan } from '@/types/domain';

interface PaywallNoticeProps {
  /**
   * Feature name that is locked
   * Examples: "Player Management", "Advanced Analytics", "File Uploads"
   */
  feature: string;

  /**
   * Current workspace plan
   */
  currentPlan: WorkspacePlan;

  /**
   * Recommended plan to unlock this feature
   * Default: 'plus'
   */
  requiredPlan?: 'starter' | 'plus' | 'pro';

  /**
   * Optional custom message (overrides default)
   */
  message?: string;

  /**
   * Additional details or benefits list
   */
  benefits?: string[];

  /**
   * Custom className for styling
   */
  className?: string;
}

/**
 * Plan display names
 */
const PLAN_NAMES: Record<string, string> = {
  free: 'Free Trial',
  starter: 'Starter',
  plus: 'Plus',
  pro: 'Pro',
};

/**
 * Plan pricing
 */
const PLAN_PRICING: Record<string, string> = {
  starter: '$9/month',
  plus: '$19/month',
  pro: '$39/month',
};

/**
 * PaywallNotice Component
 *
 * Shows when user tries to access a feature beyond their plan limits.
 *
 * @example
 * ```tsx
 * // In player creation page
 * if (!access.canCreatePlayers) {
 *   return (
 *     <PaywallNotice
 *       feature="Player Management"
 *       currentPlan={access.plan || 'free'}
 *       requiredPlan="plus"
 *       benefits={[
 *         'Create up to 15 players',
 *         'Track 200 games per month',
 *         'Advanced statistics',
 *       ]}
 *     />
 *   );
 * }
 * ```
 */
export function PaywallNotice({
  feature,
  currentPlan,
  requiredPlan = 'plus',
  message,
  benefits,
  className = '',
}: PaywallNoticeProps) {
  const currentPlanName = PLAN_NAMES[currentPlan] || 'Free Trial';
  const requiredPlanName = PLAN_NAMES[requiredPlan] || 'Plus';
  const requiredPlanPrice = PLAN_PRICING[requiredPlan] || '$19/month';

  const defaultMessage = `${feature} is not available on the ${currentPlanName} plan. Upgrade to ${requiredPlanName} to unlock this feature.`;

  return (
    <div
      className={`max-w-2xl mx-auto mt-8 bg-white border-2 border-gray-200 rounded-lg shadow-sm p-8 ${className}`}
    >
      {/* Lock Icon */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-100 rounded-full p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
        {feature} Locked
      </h2>

      {/* Message */}
      <p className="text-center text-gray-600 mb-6">{message || defaultMessage}</p>

      {/* Benefits (if provided) */}
      {benefits && benefits.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <p className="font-semibold text-blue-900 mb-2">
            Unlock with {requiredPlanName}:
          </p>
          <ul className="space-y-1">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start text-blue-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Current Plan Badge */}
      <div className="text-center mb-4">
        <span className="inline-block bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
          Current Plan: {currentPlanName}
        </span>
      </div>

      {/* Upgrade CTA */}
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/billing"
          className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-center"
        >
          Upgrade to {requiredPlanName} ({requiredPlanPrice})
        </Link>

        <Link
          href="/billing"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View all plans →
        </Link>
      </div>
    </div>
  );
}

/**
 * Compact Paywall Notice (Inline)
 *
 * Smaller version for embedding in existing pages without full takeover.
 */
export function PaywallNoticeInline({
  feature,
  currentPlan,
  requiredPlan = 'plus',
  className = '',
}: Omit<PaywallNoticeProps, 'message' | 'benefits'>) {
  const currentPlanName = PLAN_NAMES[currentPlan] || 'Free Trial';
  const requiredPlanName = PLAN_NAMES[requiredPlan] || 'Plus';

  return (
    <div
      className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="bg-white rounded-full p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-blue-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900">
            {feature} requires {requiredPlanName}
          </p>
          <p className="text-sm text-gray-600">
            You're currently on {currentPlanName}
          </p>
        </div>
      </div>

      <Link
        href="/billing"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition-colors whitespace-nowrap"
      >
        Upgrade
      </Link>
    </div>
  );
}
