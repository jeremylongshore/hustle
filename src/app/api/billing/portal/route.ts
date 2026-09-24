/**
 * Billing Portal API Route
 *
 * POST /api/billing/portal
 *
 * Creates a Stripe Customer Portal session for authenticated users.
 * Phase 4.5 migration: workspace + user lookups moved off Firestore onto Drizzle.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authWithProfile } from '@/lib/auth';
import { getUserProfileAdmin } from '@/lib/db/queries/users';
import { getWorkspaceByIdAdmin } from '@/lib/db/queries/workspaces';
import { getOrCreateBillingPortalUrl } from '@/lib/stripe/billing-portal';
import { createLogger } from '@/lib/logger';
import { serverError, isStripeCardError } from '@/lib/api/errors';

const logger = createLogger('api/billing/portal');

export async function POST(request: NextRequest) {
  try {
    // 0. Feature switch
    const billingEnabled = process.env.BILLING_ENABLED !== 'false';
    if (!billingEnabled) {
      return NextResponse.json(
        {
          error: 'BILLING_DISABLED',
          message: 'Billing is temporarily disabled. Please try again later.',
        },
        { status: 503 }
      );
    }

    // 1. Authenticate user
    const dashboardUser = await authWithProfile();
    if (!dashboardUser) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get user → default workspace
    const user = await getUserProfileAdmin(dashboardUser.uid);
    if (!user) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User document not found' },
        { status: 404 }
      );
    }

    const workspaceId = user.defaultWorkspaceId;
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'NO_WORKSPACE', message: 'User has no default workspace' },
        { status: 404 }
      );
    }

    // 3. Fetch workspace
    const workspace = await getWorkspaceByIdAdmin(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
        { status: 404 }
      );
    }

    // 4. Enforce status — allow active, past_due, trial; block canceled/suspended/deleted
    const blockedStatuses = ['canceled', 'suspended', 'deleted'];
    if (blockedStatuses.includes(workspace.status)) {
      return NextResponse.json(
        {
          error: 'BILLING_INACCESSIBLE',
          reason: 'workspace_status',
          status: workspace.status,
          message: `Billing portal not accessible for ${workspace.status} workspaces.`,
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const returnPath = body.returnPath || '/dashboard/billing';

    let url: string;
    try {
      url = await getOrCreateBillingPortalUrl(workspace.id, returnPath);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(
        'Billing portal session creation failed: ' + msg,
        error instanceof Error ? error : new Error(msg)
      );
      return NextResponse.json(
        {
          error: 'BILLING_PORTAL_FAILED',
          message: 'Unable to create billing portal session.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(
      '/api/billing/portal error: ' + msg,
      error instanceof Error ? error : new Error(msg)
    );

    const errType = (error as { type?: string }).type;
    if (errType) {
      return NextResponse.json(
        {
          error: 'STRIPE_ERROR',
          // Card errors are written by Stripe for the cardholder; everything else
          // is internal and must not reach the client (bead hustle-4dc.3).
          message: isStripeCardError(error) ? error.message : 'Billing is temporarily unavailable. Please try again.',
          type: errType,
        },
        { status: isStripeCardError(error) ? 400 : 500 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to process billing portal request' },
      { status: 500 }
    );
  }
}
