/**
 * Workspace Health Dashboard Loader
 *
 * Server-side function to fetch workspace health data including:
 * - Workspace status and plan
 * - Billing information and next action
 * - Usage metrics (players, games, pending verifications)
 * - Sync status (Stripe ↔ local workspace row)
 * - Email verification status
 *
 * Phase 4.5 migration: Firestore reads replaced with the Drizzle query
 * modules. Public function signature unchanged.
 */

import { and, count, eq } from 'drizzle-orm';
import { getStripeClient } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { authWithProfile } from '@/lib/auth';
import { getUserProfileAdmin } from '@/lib/db/queries/users';
import { getWorkspaceByIdAdmin } from '@/lib/db/queries/workspaces';
import { players } from '@/lib/db/schema/players';
import { games } from '@/lib/db/schema/games';
import type { WorkspaceStatus, WorkspacePlan } from '@/types/domain';

export interface WorkspaceHealthData {
  workspace: {
    id: string;
    status: WorkspaceStatus;
    plan: WorkspacePlan;
    currentPeriodEnd: string | null;
    nextBillingAction: 'none' | 'update_payment' | 'reactivate' | 'contact_support';
    usage: {
      players: number;
      games: number;
      pendingVerifications: number;
    };
    sync: {
      stripeLastSyncAt: string | null;
      firestoreLastUpdateAt: string;
    };
    emailVerified: boolean;
  };
}

export async function getWorkspaceHealth(): Promise<WorkspaceHealthData | null> {
  const dashboardUser = await authWithProfile();
  if (!dashboardUser) {
    return null;
  }

  const user = await getUserProfileAdmin(dashboardUser.uid);
  if (!user) {
    throw new Error('User document not found');
  }

  const defaultWorkspaceId = user.defaultWorkspaceId;
  if (!defaultWorkspaceId) {
    throw new Error('User has no default workspace');
  }

  const workspace = await getWorkspaceByIdAdmin(defaultWorkspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  const playerCount = workspace.usage.playerCount;
  const gamesCount = workspace.usage.gamesThisMonth;
  const pendingVerifications = await countPendingVerifications(dashboardUser.uid);

  let stripeLastSyncAt: string | null = null;
  const stripeCustomerId = workspace.billing?.stripeCustomerId;
  if (stripeCustomerId) {
    try {
      const subscription = await getStripeClient().subscriptions.list({
        customer: stripeCustomerId,
        limit: 1,
        status: 'all',
      });
      if (subscription.data.length > 0) {
        stripeLastSyncAt = new Date(subscription.data[0].created * 1000).toISOString();
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Workspace Health] Failed to fetch Stripe subscription:', msg);
      // Don't throw — sync check is optional.
    }
  }

  const firestoreLastUpdateAt = workspace.updatedAt.toISOString();
  const nextBillingAction = getNextBillingAction(workspace.status);
  const emailVerified = dashboardUser.emailVerified || false;

  return {
    workspace: {
      id: workspace.id,
      status: workspace.status,
      plan: workspace.plan,
      currentPeriodEnd: workspace.billing.currentPeriodEnd
        ? workspace.billing.currentPeriodEnd.toISOString()
        : null,
      nextBillingAction,
      usage: {
        players: playerCount,
        games: gamesCount,
        pendingVerifications,
      },
      sync: {
        stripeLastSyncAt,
        // Field name preserved for callers; value comes from the workspace row's updatedAt.
        firestoreLastUpdateAt,
      },
      emailVerified,
    },
  };
}

async function countPendingVerifications(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(games)
      .innerJoin(players, eq(games.playerId, players.id))
      .where(and(eq(players.userId, userId), eq(games.verified, false)));
    return result[0]?.count ?? 0;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Workspace Health] Failed to count pending verifications:', msg);
    return 0;
  }
}

function getNextBillingAction(
  status: WorkspaceStatus
): 'none' | 'update_payment' | 'reactivate' | 'contact_support' {
  switch (status) {
    case 'active':
    case 'trial':
      return 'none';
    case 'past_due':
      return 'update_payment';
    case 'canceled':
      return 'reactivate';
    case 'suspended':
    case 'deleted':
      return 'contact_support';
    default:
      return 'none';
  }
}
