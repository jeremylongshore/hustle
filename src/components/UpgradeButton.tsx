'use client';

/**
 * Upgrade Button Component
 *
 * Initiates Stripe checkout for workspace plan upgrade.
 * Phase 5 Task 3: Stripe Integration
 */

import { useState } from 'react';
import type { WorkspacePlan } from '@/types/domain';

interface UpgradeButtonProps {
  workspaceId: string;
  currentPlan: WorkspacePlan;
  targetPlan: 'starter' | 'plus' | 'pro';
  priceId: string;
  className?: string;
}

export function UpgradeButton({
  workspaceId,
  currentPlan,
  targetPlan,
  priceId,
  className = '',
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call checkout session creation API
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          priceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionUrl } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = sessionUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
      setLoading(false);
    }
  };

  const planNames = {
    starter: 'Starter',
    plus: 'Plus',
    pro: 'Pro',
  };

  const planPrices = {
    starter: '$9/mo',
    plus: '$19/mo',
    pro: '$39/mo',
  };

  const isCurrentPlan = currentPlan === targetPlan;
  const isDowngrade = (currentPlan === 'pro' && targetPlan !== 'pro') ||
                      (currentPlan === 'plus' && targetPlan === 'starter');

  return (
    <div>
      <button
        onClick={handleUpgrade}
        disabled={loading || isCurrentPlan}
        className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          isCurrentPlan
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
        } ${className}`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </span>
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : (
          `${isDowngrade ? 'Downgrade' : 'Upgrade'} to ${planNames[targetPlan]} ${planPrices[targetPlan]}`
        )}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
