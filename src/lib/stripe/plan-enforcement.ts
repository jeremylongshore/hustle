/**
 * Workspace Plan Change Audit & Enforcement
 *
 * Unified enforcement engine for plan/status changes driven by Stripe.
 * Phase 4.5 migration: workspace lookup + update moved off Firestore onto
 * Drizzle/SQLite. Public function signature + return shape unchanged so the
 * Stripe webhook, replay route, and auditor keep working.
 *
 * Ensures workspace state always converges to the correct plan/status
 * regardless of webhook delivery order or duplication.
 *
 * Usage:
 * ```typescript
 * import { enforceWorkspacePlan } from '@/lib/stripe/plan-enforcement';
 *
 * await enforceWorkspacePlan(workspaceId, {
 *   stripePriceId: 'price_1234',
 *   stripeStatus: 'active',
 *   source: 'webhook',
 *   stripeEventId: 'evt_1234',
 * });
 * ```
 */

import {
  getWorkspaceByIdAdmin,
  updateWorkspacePlanAdmin,
  updateWorkspaceStatusAdmin,
} from "@/lib/db/queries/workspaces";
import type {
  WorkspacePlan,
  WorkspaceStatus,
} from "@/types/domain";
import {
  getPlanForPriceId,
  mapStripeStatusToWorkspaceStatus,
} from "@/lib/stripe/plan-mapping";
import { recordBillingEvent } from "@/lib/stripe/ledger";
import type { LedgerEventSource } from "@/lib/db/queries/stripe-billing";

/**
 * Enforcement input parameters
 */
export interface EnforcePlanInput {
  stripePriceId: string;
  stripeStatus: string; // Stripe subscription status (raw string)
  source: LedgerEventSource;
  stripeEventId: string | null;
}

/**
 * Enforcement result
 */
export interface EnforcePlanResult {
  workspaceId: string;
  planChanged: boolean;
  statusChanged: boolean;
  planBefore: WorkspacePlan | null;
  planAfter: WorkspacePlan | null;
  statusBefore: WorkspaceStatus | null;
  statusAfter: WorkspaceStatus | null;
  ledgerEventId: string;
}

const VALID_SOURCES: LedgerEventSource[] = [
  "webhook",
  "replay",
  "auditor",
  "manual",
  "enforcement",
];

/**
 * Enforce workspace plan and status based on Stripe data.
 *
 * Always converges to correct state regardless of webhook order.
 * NEVER modifies Stripe data — workspace row is source of truth for runtime
 * behavior; Stripe subscription is source of truth for billing.
 *
 * @param workspaceId - Workspace ID to enforce
 * @param input - Enforcement parameters
 * @returns Enforcement result with before/after state
 * @throws Error if workspace not found or validation fails
 */
export async function enforceWorkspacePlan(
  workspaceId: string,
  input: EnforcePlanInput
): Promise<EnforcePlanResult> {
  // 1. Validate inputs
  if (!workspaceId || typeof workspaceId !== "string") {
    throw new Error("Invalid workspaceId: must be non-empty string");
  }
  if (!input.stripePriceId || typeof input.stripePriceId !== "string") {
    throw new Error("Invalid stripePriceId: must be non-empty string");
  }
  if (!input.stripeStatus || typeof input.stripeStatus !== "string") {
    throw new Error("Invalid stripeStatus: must be non-empty string");
  }
  if (!input.source || !VALID_SOURCES.includes(input.source)) {
    throw new Error(
      `Invalid source: ${input.source}. Must be one of: ${VALID_SOURCES.join(", ")}`
    );
  }

  // 2. Fetch workspace
  const workspace = await getWorkspaceByIdAdmin(workspaceId);
  if (!workspace) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  // 3. Map Stripe → workspace types
  let targetPlan: WorkspacePlan;
  try {
    targetPlan = getPlanForPriceId(input.stripePriceId);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to map Stripe price ID to plan: ${msg}`);
  }

  let targetStatus: WorkspaceStatus;
  try {
    targetStatus = mapStripeStatusToWorkspaceStatus(input.stripeStatus as never);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to map Stripe status to workspace status: ${msg}`);
  }

  // 4. Detect deltas
  const planBefore = workspace.plan;
  const statusBefore = workspace.status;
  const planChanged = planBefore !== targetPlan;
  const statusChanged = statusBefore !== targetStatus;

  console.log("[Plan Enforcement]", {
    workspaceId,
    source: input.source,
    planBefore,
    targetPlan,
    planChanged,
    statusBefore,
    targetStatus,
    statusChanged,
  });

  // 5. Apply updates if anything changed
  if (planChanged || statusChanged) {
    try {
      if (planChanged) {
        await updateWorkspacePlanAdmin(workspaceId, targetPlan);
      }
      if (statusChanged) {
        await updateWorkspaceStatusAdmin(workspaceId, targetStatus);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update workspace: ${msg}`);
    }

    const ledgerEventId = await recordBillingEvent(workspaceId, {
      type: "plan_changed",
      stripeEventId: input.stripeEventId,
      statusBefore,
      statusAfter: statusChanged ? targetStatus : statusBefore,
      planBefore,
      planAfter: planChanged ? targetPlan : planBefore,
      source: input.source,
      note: `Plan enforcement: ${planChanged ? `${planBefore}→${targetPlan}` : "plan unchanged"}, ${statusChanged ? `${statusBefore}→${targetStatus}` : "status unchanged"}`,
    });

    console.log("[Plan Enforcement] Applied changes:", {
      workspaceId,
      planBefore,
      planAfter: targetPlan,
      statusBefore,
      statusAfter: targetStatus,
      ledgerEventId,
    });

    return {
      workspaceId,
      planChanged,
      statusChanged,
      planBefore,
      planAfter: targetPlan,
      statusBefore,
      statusAfter: targetStatus,
      ledgerEventId,
    };
  }

  // 6. No-op: record idempotent ledger entry
  const ledgerEventId = await recordBillingEvent(workspaceId, {
    type: "plan_changed",
    stripeEventId: input.stripeEventId,
    statusBefore,
    statusAfter: statusBefore,
    planBefore,
    planAfter: planBefore,
    source: input.source,
    note: "Plan enforcement: no changes (workspace already in sync with Stripe)",
  });

  console.log("[Plan Enforcement] No changes needed:", {
    workspaceId,
    plan: planBefore,
    status: statusBefore,
    ledgerEventId,
  });

  return {
    workspaceId,
    planChanged: false,
    statusChanged: false,
    planBefore,
    planAfter: planBefore,
    statusBefore,
    statusAfter: statusBefore,
    ledgerEventId,
  };
}

/**
 * Validate enforcement source.
 */
export function isValidEnforcementSource(source: string): source is LedgerEventSource {
  return VALID_SOURCES.includes(source as LedgerEventSource);
}
