/**
 * Billing Invoices API Route
 *
 * GET /api/billing/invoices
 *
 * Returns recent invoices for the authenticated user's workspace.
 * Phase 4.5 migration: workspace + user lookups moved off Firestore onto Drizzle.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authWithProfile } from '@/lib/auth';
import { getUserProfileAdmin } from '@/lib/db/queries/users';
import { getWorkspaceByIdAdmin } from '@/lib/db/queries/workspaces';
import { listRecentInvoices } from '@/lib/stripe/billing-portal';
import { createLogger } from '@/lib/logger';
import { serverError, isStripeCardError } from '@/lib/api/errors';

const logger = createLogger('api/billing/invoices');

export async function GET(request: NextRequest) {
  try {
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

    const dashboardUser = await authWithProfile();
    if (!dashboardUser) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

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

    const workspace = await getWorkspaceByIdAdmin(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
        { status: 404 }
      );
    }

    const blockedStatuses = ['canceled', 'suspended', 'deleted'];
    if (blockedStatuses.includes(workspace.status)) {
      return NextResponse.json(
        {
          error: 'BILLING_INACCESSIBLE',
          reason: 'workspace_status',
          status: workspace.status,
          message: `Billing history not accessible for ${workspace.status} workspaces.`,
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    let invoices;
    try {
      invoices = await listRecentInvoices(workspace.id, limit);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(
        'Invoice list retrieval failed: ' + msg,
        error instanceof Error ? error : new Error(msg)
      );
      return NextResponse.json(
        {
          error: 'INVOICE_LIST_FAILED',
          message: 'Unable to retrieve invoice history.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoices });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(
      '/api/billing/invoices error: ' + msg,
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
      { error: 'INTERNAL_ERROR', message: 'Failed to process invoice request' },
      { status: 500 }
    );
  }
}
