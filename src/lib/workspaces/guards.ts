/**
 * Workspace Status Guards
 *
 * Granular assertion helpers per workspace state, for use at the start of
 * API routes that need to enforce subscription compliance.
 *
 * Phase 4.5 migration: workspace lookup moved off Firestore onto Drizzle;
 * WorkspaceAccessError relocated from src/lib/firebase/access-control to
 * src/lib/workspaces/errors.
 */

import { getWorkspaceByIdAdmin } from "@/lib/db/queries/workspaces";
import type { WorkspaceStatus } from "@/types/domain";
import { WorkspaceAccessError } from "@/lib/workspaces/errors";

/**
 * Compact view of a workspace's status-relevant fields, hydrated from the
 * Drizzle workspace row.
 */
interface WorkspaceStatusCheck {
  id: string;
  status: WorkspaceStatus;
  plan: string;
  trialEndsAt?: Date | null;
  currentPeriodEnd?: Date | null;
}

/**
 * Assert workspace is active OR trial (full write access).
 * Blocks: past_due, canceled, suspended, deleted.
 */
export async function assertWorkspaceActiveOrTrial(workspaceId: string): Promise<void> {
  const workspace = await getWorkspaceStatus(workspaceId);

  if (workspace.status !== "active" && workspace.status !== "trial") {
    throw new WorkspaceAccessError(
      getStatusErrorCode(workspace.status),
      workspace.status
    );
  }

  if (workspace.status === "trial" && workspace.trialEndsAt) {
    const now = new Date();
    if (now > workspace.trialEndsAt) {
      throw new WorkspaceAccessError("TRIAL_EXPIRED", "trial");
    }
  }
}

/**
 * Assert workspace is NOT canceled/suspended/deleted (grace period allowed).
 * Allows: active, trial, past_due.
 */
export async function assertWorkspaceNotTerminated(workspaceId: string): Promise<void> {
  const workspace = await getWorkspaceStatus(workspaceId);

  const terminated: WorkspaceStatus[] = ["canceled", "suspended", "deleted"];
  if (terminated.includes(workspace.status)) {
    throw new WorkspaceAccessError(
      getStatusErrorCode(workspace.status),
      workspace.status
    );
  }
}

/**
 * Assert workspace is NOT past_due (payment required).
 * Allows: active, trial.
 */
export async function assertWorkspacePaymentCurrent(workspaceId: string): Promise<void> {
  const workspace = await getWorkspaceStatus(workspaceId);

  const paymentRequired: WorkspaceStatus[] = [
    "past_due",
    "canceled",
    "suspended",
    "deleted",
  ];
  if (paymentRequired.includes(workspace.status)) {
    throw new WorkspaceAccessError(
      getStatusErrorCode(workspace.status),
      workspace.status
    );
  }
}

/**
 * Get workspace status information, normalised for guard checks.
 */
async function getWorkspaceStatus(workspaceId: string): Promise<WorkspaceStatusCheck> {
  const ws = await getWorkspaceByIdAdmin(workspaceId);
  if (!ws) {
    throw new WorkspaceAccessError("WORKSPACE_NOT_FOUND", "unknown");
  }

  return {
    id: ws.id,
    status: ws.status,
    plan: ws.plan,
    trialEndsAt: ws.trialEndsAt ?? null,
    currentPeriodEnd: ws.billing?.currentPeriodEnd ?? null,
  };
}

function getStatusErrorCode(status: WorkspaceStatus): string {
  switch (status) {
    case "past_due":
      return "PAYMENT_PAST_DUE";
    case "canceled":
      return "SUBSCRIPTION_CANCELED";
    case "suspended":
      return "ACCOUNT_SUSPENDED";
    case "deleted":
      return "WORKSPACE_DELETED";
    case "trial":
      return "TRIAL_EXPIRED";
    default:
      return "ACCESS_DENIED";
  }
}

/**
 * Check if workspace status allows write operations (non-throwing).
 */
export function canWriteWithStatus(status: WorkspaceStatus): boolean {
  return status === "active" || status === "trial";
}

/**
 * Check if workspace status allows read operations (non-throwing).
 */
export function canReadWithStatus(status: WorkspaceStatus): boolean {
  return status === "active" || status === "trial" || status === "past_due";
}

/**
 * Get user-friendly upgrade prompt based on workspace status.
 */
export function getUpgradePrompt(status: WorkspaceStatus): string {
  switch (status) {
    case "past_due":
      return "Your payment is past due. Please update your payment method to continue creating content.";
    case "canceled":
      return "Your subscription has been canceled. Reactivate your subscription to continue using Hustle.";
    case "suspended":
      return "Your account has been suspended. Please contact support to resolve this issue.";
    case "deleted":
      return "This workspace has been deleted and is no longer accessible.";
    case "trial":
      return "Your trial has expired. Upgrade to a paid plan to continue using Hustle.";
    default:
      return "Upgrade your subscription to access this feature.";
  }
}
