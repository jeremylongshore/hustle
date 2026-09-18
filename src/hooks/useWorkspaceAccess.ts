/**
 * Workspace Access Hook
 *
 * Phase 7: Client-Side Access Control
 *
 * React hook for checking workspace subscription status and enforcing
 * access rules on the client side (in addition to server-side enforcement).
 *
 * Features:
 * - Fetches workspace data
 * - Computes access permissions (canCreatePlayers, canCreateGames, etc.)
 * - Redirects to /billing if subscription inactive
 * - Shows top-banner warning if trial nearing end
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkspaceStatus } from '@/types/domain';

/**
 * Workspace access permissions
 */
export interface WorkspaceAccess {
  // Loading states
  loading: boolean;
  error: string | null;

  // Workspace data
  workspaceId: string | null;
  plan: string | null;
  status: WorkspaceStatus | null;

  // Access permissions
  canRead: boolean;
  canWrite: boolean;
  canCreatePlayers: boolean;
  canCreateGames: boolean;
  canUpload: boolean;

  // Billing info
  isActive: boolean;
  isTrial: boolean;
  isPastDue: boolean;
  isCanceled: boolean;
  isSuspended: boolean;
  currentPeriodEnd: Date | null;

  // Trial warnings
  trialEndsIn: number | null; // Days until trial ends
  showTrialWarning: boolean; // True if trial ends in <= 3 days

  // Actions
  refresh: () => Promise<void>;
}

/**
 * Access rules by workspace status
 */
const ACCESS_RULES: Record<WorkspaceStatus, { read: boolean; write: boolean }> = {
  active: { read: true, write: true },
  trial: { read: true, write: true },
  past_due: { read: true, write: false }, // Grace period: reads only
  canceled: { read: false, write: false }, // No access after cancellation
  suspended: { read: false, write: false }, // Account issues, no access
  deleted: { read: false, write: false }, // Soft-deleted, no access
};

/**
 * useWorkspaceAccess Hook
 *
 * Fetches workspace data and computes access permissions.
 * Redirects to /billing if subscription is inactive (canceled/suspended).
 *
 * @param options - Hook configuration
 * @returns Workspace access state and permissions
 *
 * @example
 * ```tsx
 * function PlayerList() {
 *   const access = useWorkspaceAccess();
 *
 *   if (access.loading) return <LoadingSpinner />;
 *   if (access.error) return <ErrorMessage message={access.error} />;
 *
 *   if (!access.canCreatePlayers) {
 *     return <PaywallNotice feature="Player Management" />;
 *   }
 *
 *   return <PlayerTable />;
 * }
 * ```
 */
export function useWorkspaceAccess(options?: {
  /**
   * Redirect to /billing if subscription inactive
   * Default: false
   */
  redirectOnInactive?: boolean;
}): WorkspaceAccess {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  /**
   * Fetch workspace data from API
   */
  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/workspace/current');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch workspace');
      }

      const data = await response.json();
      setWorkspaceData(data.workspace);

      // Redirect if subscription inactive and option enabled
      if (options?.redirectOnInactive) {
        const status = data.workspace.status as WorkspaceStatus;
        if (status === 'canceled' || status === 'suspended' || status === 'deleted') {
          router.push('/billing');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load workspace');
      console.error('[useWorkspaceAccess] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate days until trial ends
   */
  const calculateTrialDaysRemaining = (currentPeriodEnd: string | null): number | null => {
    if (!currentPeriodEnd) return null;

    const endDate = new Date(currentPeriodEnd);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  // Fetch workspace on mount
  useEffect(() => {
    fetchWorkspace();
  }, []);

  // Compute access permissions
  if (!workspaceData || loading) {
    return {
      loading: true,
      error: null,
      workspaceId: null,
      plan: null,
      status: null,
      canRead: false,
      canWrite: false,
      canCreatePlayers: false,
      canCreateGames: false,
      canUpload: false,
      isActive: false,
      isTrial: false,
      isPastDue: false,
      isCanceled: false,
      isSuspended: false,
      currentPeriodEnd: null,
      trialEndsIn: null,
      showTrialWarning: false,
      refresh: fetchWorkspace,
    };
  }

  const status = workspaceData.status as WorkspaceStatus;
  const rules = ACCESS_RULES[status] || { read: false, write: false };
  const currentPeriodEnd = workspaceData.billing?.currentPeriodEnd
    ? new Date(workspaceData.billing.currentPeriodEnd)
    : null;
  const trialEndsIn =
    status === 'trial' ? calculateTrialDaysRemaining(workspaceData.billing?.currentPeriodEnd) : null;

  return {
    loading: false,
    error,
    workspaceId: workspaceData.id,
    plan: workspaceData.plan,
    status,

    // Access permissions
    canRead: rules.read,
    canWrite: rules.write,
    canCreatePlayers: rules.write,
    canCreateGames: rules.write,
    canUpload: rules.write,

    // Status checks
    isActive: status === 'active',
    isTrial: status === 'trial',
    isPastDue: status === 'past_due',
    isCanceled: status === 'canceled',
    isSuspended: status === 'suspended',

    // Billing info
    currentPeriodEnd,
    trialEndsIn,
    showTrialWarning: trialEndsIn !== null && trialEndsIn <= 3,

    // Actions
    refresh: fetchWorkspace,
  };
}
