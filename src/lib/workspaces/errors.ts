/**
 * Workspace Access Errors
 *
 * Custom error class for workspace access denials. Phase 4.5 migration:
 * previously lived in src/lib/firebase/access-control.ts; relocated here so
 * the workspace guard layer no longer depends on the Firebase package.
 *
 * Throws a typed error with a code, the offending workspace status, and an
 * HTTP status to surface verbatim in API route responses.
 */

import type { WorkspaceStatus } from "@/types/domain";

/**
 * Get user-friendly error message for access denial.
 */
export function getAccessDenialMessage(reason: string): string {
  switch (reason) {
    case "PAYMENT_PAST_DUE":
      return "Your payment is past due. Please update your payment method to continue creating content.";
    case "SUBSCRIPTION_CANCELED":
      return "Your subscription has been canceled. Please reactivate your subscription to continue.";
    case "ACCOUNT_SUSPENDED":
      return "Your account has been suspended. Please contact support for assistance.";
    case "WORKSPACE_DELETED":
      return "This workspace has been deleted and is no longer accessible.";
    case "WORKSPACE_NOT_FOUND":
      return "Workspace not found. Please contact support if you believe this is an error.";
    case "TRIAL_EXPIRED":
      return "Your trial has expired. Upgrade to a paid plan to continue using Hustle.";
    case "INVALID_WORKSPACE_STATUS":
      return "Workspace is in an invalid state. Please contact support.";
    default:
      return "Access denied. Please check your subscription status or contact support.";
  }
}

/**
 * Custom error for workspace access denials.
 *
 * Thrown when subscription status blocks access. Includes structured error
 * code and status for client handling.
 */
export class WorkspaceAccessError extends Error {
  public readonly code: string;
  public readonly status: string;
  public readonly httpStatus: number;

  constructor(code: string, status: string) {
    super(getAccessDenialMessage(code));
    this.name = "WorkspaceAccessError";
    this.code = code;
    this.status = status;
    this.httpStatus = 403;
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      status: this.status,
    };
  }
}

/**
 * Workspace access rules by status (kept for client-side checks).
 */
export const ACCESS_RULES: Record<WorkspaceStatus, { read: boolean; write: boolean }> = {
  active: { read: true, write: true },
  trial: { read: true, write: true },
  past_due: { read: true, write: false },
  canceled: { read: false, write: false },
  suspended: { read: false, write: false },
  deleted: { read: false, write: false },
};
