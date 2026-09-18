/**
 * Manage Billing Button
 *
 * Phase 7 Task 4: Customer Billing Portal & Invoice History
 *
 * Button that opens Stripe Customer Portal for self-service billing management.
 * Handles workspace status validation and displays appropriate messages.
 */

'use client';

import { useState } from 'react';
import type { WorkspaceStatus } from '@/types/domain';

interface ManageBillingButtonProps {
  workspaceStatus: WorkspaceStatus;
  hasStripeCustomer: boolean;
}

/**
 * ManageBillingButton Component
 *
 * Creates Stripe Customer Portal session and redirects user to Stripe-hosted portal.
 * Disabled for canceled, suspended, or deleted workspaces.
 */
export function ManageBillingButton({ workspaceStatus, hasStripeCustomer }: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if button should be disabled based on workspace status
  const blockedStatuses: WorkspaceStatus[] = ['canceled', 'suspended', 'deleted'];
  const isDisabled = blockedStatuses.includes(workspaceStatus);

  const handleClick = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create portal session
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnPath: '/dashboard/billing' }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (errorData.error === 'BILLING_INACCESSIBLE') {
          setError(`Billing portal not available for ${workspaceStatus} workspaces.`);
          return;
        }

        throw new Error(errorData.message || 'Failed to open billing portal');
      }

      const { url } = await response.json();

      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (err: any) {
      console.error('[ManageBillingButton] Error:', err);
      setError(err.message || 'Failed to open billing portal');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading || isDisabled}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            <span>Loading...</span>
          </span>
        ) : (
          'Manage Billing'
        )}
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}

      {/* Disabled State Messages */}
      {isDisabled && (
        <p className="text-gray-500 text-sm mt-2">
          {workspaceStatus === 'canceled' && 'Billing portal not available for canceled workspaces.'}
          {workspaceStatus === 'suspended' && 'Billing portal not available for suspended workspaces. Please contact support.'}
          {workspaceStatus === 'deleted' && 'Billing portal not available for deleted workspaces.'}
        </p>
      )}

      {/* Trial Message */}
      {!hasStripeCustomer && workspaceStatus === 'trial' && (
        <p className="text-gray-500 text-sm mt-2">
          Billing portal will be available after you upgrade to a paid plan.
        </p>
      )}
    </div>
  );
}
