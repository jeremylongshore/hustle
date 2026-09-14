/**
 * Workspace Status Enforcement Layer
 *
 * Phase 6 Task 5: Hard enforcement of workspace status at runtime
 *
 * This is the SINGLE guard for all runtime workspace status checks.
 * Call this at the start of every protected API route after loading the workspace.
 *
 * Blocks all write operations for:
 * - past_due: Payment failed, grace period active
 * - canceled: Subscription canceled by user
 * - suspended: Account suspended (TOS violation, fraud, etc.)
 * - deleted: Workspace soft-deleted
 *
 * Allows:
 * - active: Full access
 * - trial: Full access during trial period
 */

import type { Workspace, WorkspaceStatus } from '@/types/firestore';
import { WorkspaceAccessError } from '@/lib/workspaces/errors';

/**
 * Assert workspace is active (not disabled by billing/status)
 *
 * This is the runtime enforcement gate for all protected operations.
 * Throws typed errors for each disabled status.
 *
 * @param workspace - Full workspace object (from Firestore)
 * @throws WorkspaceAccessError with specific code and message per status
 *
 * @example
 * ```typescript
 * const workspace = await getWorkspace(workspaceId);
 * assertWorkspaceActive(workspace); // Throws if disabled
 * // Proceed with protected operation
 * ```
 */
export function assertWorkspaceActive(workspace: Workspace): void {
  // Log enforcement check
  console.log('[WORKSPACE_ENFORCEMENT]', {
    workspaceId: workspace.id,
    status: workspace.status,
    plan: workspace.plan,
  });

  // Check for disabled statuses
  switch (workspace.status) {
    case 'past_due':
      console.warn('[WORKSPACE_BLOCKED]', {
        workspaceId: workspace.id,
        status: 'past_due',
      });
      throw new WorkspaceAccessError(
        'PAYMENT_PAST_DUE',
        workspace.status
      );

    case 'canceled':
      console.warn('[WORKSPACE_BLOCKED]', {
        workspaceId: workspace.id,
        status: 'canceled',
      });
      throw new WorkspaceAccessError(
        'SUBSCRIPTION_CANCELED',
        workspace.status
      );

    case 'suspended':
      console.warn('[WORKSPACE_BLOCKED]', {
        workspaceId: workspace.id,
        status: 'suspended',
      });
      throw new WorkspaceAccessError(
        'ACCOUNT_SUSPENDED',
        workspace.status
      );

    case 'deleted':
      console.warn('[WORKSPACE_BLOCKED]', {
        workspaceId: workspace.id,
        status: 'deleted',
      });
      throw new WorkspaceAccessError(
        'WORKSPACE_DELETED',
        workspace.status
      );

    case 'trial': {
      // Older orphan accounts keep their original trial deadline on recovery.
      // Status alone must not grant them indefinite write access.
      // A null deadline retains the existing guards.ts legacy policy.
      const deadline = workspace.trialEndsAt?.getTime();
      if (deadline !== undefined && (!Number.isFinite(deadline) || deadline <= Date.now())) {
        throw new WorkspaceAccessError('TRIAL_EXPIRED', workspace.status);
      }
      return;
    }
    case 'active':
      // Allowed statuses - no action needed
      return;

    default:
      // Unknown status - block by default (fail-safe)
      console.error('[WORKSPACE_ENFORCEMENT] Unknown status:', workspace.status);
      throw new WorkspaceAccessError(
        'INVALID_WORKSPACE_STATUS',
        workspace.status
      );
  }
}

/**
 * Get next step for user based on workspace status
 *
 * Returns actionable next step for client to display.
 *
 * @param status - Workspace status
 * @returns Next step code for client-side handling
 */
export function getNextStep(status: WorkspaceStatus): 'upgrade' | 'update_payment' | 'contact_support' | null {
  switch (status) {
    case 'past_due':
      return 'update_payment';
    case 'canceled':
      return 'upgrade';
    case 'suspended':
    case 'deleted':
      return 'contact_support';
    case 'active':
    case 'trial':
      return null;
    default:
      return 'contact_support';
  }
}

/**
 * Get human-readable error message for workspace status
 *
 * @param status - Workspace status
 * @returns User-friendly error message
 */
export function getStatusErrorMessage(status: WorkspaceStatus): string {
  switch (status) {
    case 'past_due':
      return 'Your payment is past due. Please update your payment method to continue.';
    case 'canceled':
      return 'Your subscription has been canceled. Please reactivate to continue.';
    case 'suspended':
      return 'Your account has been suspended. Please contact support.';
    case 'deleted':
      return 'This workspace has been deleted and is no longer accessible.';
    default:
      return 'Access denied. Please check your subscription status.';
  }
}

/**
 * Check if workspace status allows write operations (non-throwing version)
 *
 * This is a helper for client-side checks. For server-side enforcement,
 * use assertWorkspaceActive() which throws.
 *
 * @param status - Workspace status
 * @returns true if write operations allowed
 */
export function isWorkspaceWritable(status: WorkspaceStatus): boolean {
  return status === 'active' || status === 'trial';
}

/**
 * Check if workspace status allows read operations (non-throwing version)
 *
 * Read operations are allowed during grace periods (past_due).
 * Blocks canceled, suspended, deleted.
 *
 * @param status - Workspace status
 * @returns true if read operations allowed
 */
export function isWorkspaceReadable(status: WorkspaceStatus): boolean {
  return status === 'active' || status === 'trial' || status === 'past_due';
}
