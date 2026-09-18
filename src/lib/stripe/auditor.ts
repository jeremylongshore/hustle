/**
 * Billing Consistency Auditor
 *
 * Phase 4.5 migration: workspace lookups moved off Firestore onto Drizzle.
 * Public function signatures unchanged.
 *
 * Cross-checks workspace billing data against Stripe to detect drift, then
 * auto-applies simple status/plan corrections via enforceWorkspacePlan().
 *
 * Usage:
 * ```typescript
 * import { auditWorkspaceBilling } from '@/lib/stripe/auditor';
 *
 * const report = await auditWorkspaceBilling(workspaceId);
 * if (report.drift) {
 *   console.log('Drift detected:', report.driftReasons);
 *   console.log('Recommended fix:', report.recommendedFix);
 * }
 * ```
 */

import { isNotNull } from "drizzle-orm";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema/workspaces";
import { getWorkspaceByIdAdmin } from "@/lib/db/queries/workspaces";
import type { WorkspacePlan, WorkspaceStatus } from "@/types/domain";
import {
  getPlanForPriceId,
  mapStripeStatusToWorkspaceStatus,
} from "@/lib/stripe/plan-mapping";
import { recordBillingEvent } from "@/lib/stripe/ledger";
import { enforceWorkspacePlan } from "@/lib/stripe/plan-enforcement";

/**
 * Audit Report
 */
export interface BillingAuditReport {
  workspaceId: string;

  // Local (Drizzle) state
  localStatus: WorkspaceStatus;
  localPlan: WorkspacePlan;
  localStripeCustomerId: string | null;
  localStripeSubscriptionId: string | null;

  // Stripe state (null if no subscription)
  stripeStatus: Stripe.Subscription.Status | null;
  stripePlan: WorkspacePlan | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Date | null;

  // Drift detection
  drift: boolean;
  driftReasons: string[];

  // Recommended action
  recommendedFix: "run_event_replay" | "manual_stripe_review" | null;

  // Audit metadata
  auditedAt: Date;
}

/**
 * Audit a single workspace's Stripe ↔ local billing consistency.
 *
 * @param workspaceId - Workspace ID
 * @returns Audit report with drift detection
 * @throws Error if workspace not found or Stripe API fails
 */
export async function auditWorkspaceBilling(
  workspaceId: string
): Promise<BillingAuditReport> {
  // 1. Fetch workspace
  const workspace = await getWorkspaceByIdAdmin(workspaceId);
  if (!workspace) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  const report: BillingAuditReport = {
    workspaceId,
    localStatus: workspace.status,
    localPlan: workspace.plan,
    localStripeCustomerId: workspace.billing.stripeCustomerId,
    localStripeSubscriptionId: workspace.billing.stripeSubscriptionId,
    stripeStatus: null,
    stripePlan: null,
    stripePriceId: null,
    stripeCurrentPeriodEnd: null,
    drift: false,
    driftReasons: [],
    recommendedFix: null,
    auditedAt: new Date(),
  };

  // 2. No Stripe subscription on file?
  if (!workspace.billing.stripeSubscriptionId) {
    if (workspace.plan === "free") {
      return report; // correct state — free plans have no subscription
    }

    report.drift = true;
    report.driftReasons.push(
      `Workspace is on ${workspace.plan} plan but has no Stripe subscription ID`
    );
    report.recommendedFix = "manual_stripe_review";
    return report;
  }

  // 3. Fetch Stripe subscription
  let subscription: Stripe.Subscription;
  try {
    subscription = await getStripeClient().subscriptions.retrieve(
      workspace.billing.stripeSubscriptionId
    );
  } catch {
    report.drift = true;
    report.driftReasons.push(
      `Stripe subscription ${workspace.billing.stripeSubscriptionId} not found (may be deleted)`
    );
    report.recommendedFix = "manual_stripe_review";
    return report;
  }

  // 4. Extract Stripe state
  report.stripeStatus = subscription.status;
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  report.stripeCurrentPeriodEnd = new Date(periodEnd * 1000);

  const priceId = subscription.items.data[0]?.price?.id || null;
  report.stripePriceId = priceId;

  if (priceId) {
    try {
      report.stripePlan = getPlanForPriceId(priceId);
    } catch {
      report.drift = true;
      report.driftReasons.push(`Unknown Stripe price ID: ${priceId}`);
      report.recommendedFix = "manual_stripe_review";
    }
  }

  // 5. Drift detection
  const expectedLocalStatus = mapStripeStatusToWorkspaceStatus(subscription.status);
  if (workspace.status !== expectedLocalStatus) {
    report.drift = true;
    report.driftReasons.push(
      `Status mismatch: local=${workspace.status}, Stripe=${subscription.status} (expected ${expectedLocalStatus})`
    );
  }

  if (report.stripePlan && workspace.plan !== report.stripePlan) {
    report.drift = true;
    report.driftReasons.push(
      `Plan mismatch: local=${workspace.plan}, Stripe=${report.stripePlan}`
    );
  }

  if (subscription.status === "active" && workspace.status === "canceled") {
    report.drift = true;
    report.driftReasons.push(
      "Stripe subscription is active but workspace is canceled"
    );
  }

  if (subscription.status === "canceled" && workspace.status === "active") {
    report.drift = true;
    report.driftReasons.push(
      "Stripe subscription is canceled but workspace is active"
    );
  }

  if (subscription.status === "active" && workspace.status === "suspended") {
    report.drift = true;
    report.driftReasons.push(
      "Stripe subscription is active but workspace is suspended"
    );
  }

  if (
    workspace.status === "suspended" &&
    subscription.status !== "past_due" &&
    subscription.status !== "unpaid"
  ) {
    report.drift = true;
    report.driftReasons.push(
      `Workspace suspended but Stripe status is ${subscription.status} (expected past_due or unpaid)`
    );
  }

  // 6. Recommend + apply fix
  if (report.drift) {
    const hasOnlyStatusOrPlanDrift = report.driftReasons.every(
      (reason) =>
        reason.includes("Status mismatch") || reason.includes("Plan mismatch")
    );

    if (hasOnlyStatusOrPlanDrift) {
      report.recommendedFix = "run_event_replay";
    } else {
      report.recommendedFix = "manual_stripe_review";
    }

    if (
      report.recommendedFix === "run_event_replay" &&
      report.stripePriceId &&
      report.stripeStatus
    ) {
      await enforceWorkspacePlan(workspaceId, {
        stripePriceId: report.stripePriceId,
        stripeStatus: report.stripeStatus,
        source: "auditor",
        stripeEventId: null,
      });
    }

    await recordBillingEvent(workspaceId, {
      type: "drift_detected",
      stripeEventId: null,
      statusBefore: workspace.status,
      statusAfter: report.stripeStatus
        ? mapStripeStatusToWorkspaceStatus(report.stripeStatus)
        : null,
      planBefore: workspace.plan,
      planAfter: report.stripePlan,
      source: "auditor",
      note: `Drift detected: ${report.driftReasons.join("; ")}. Recommended fix: ${report.recommendedFix}${report.recommendedFix === "run_event_replay" ? " (auto-applied via enforcement)" : ""}`,
    });
  }

  return report;
}

/**
 * Audit every workspace with a Stripe subscription. Returns only those
 * that exhibit drift.
 */
export async function auditAllWorkspaces(): Promise<BillingAuditReport[]> {
  const rows = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(isNotNull(workspaces.billingStripeSubscriptionId));

  const reports: BillingAuditReport[] = [];
  for (const { id } of rows) {
    try {
      const report = await auditWorkspaceBilling(id);
      if (report.drift) {
        reports.push(report);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`Failed to audit workspace ${id}:`, msg);
    }
  }

  return reports;
}
