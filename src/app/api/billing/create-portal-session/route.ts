/**
 * Stripe Customer Portal Session API
 *
 * POST /api/billing/create-portal-session
 *
 * Creates a Stripe Customer Portal session for self-service billing management.
 * Phase 4.5 migration: workspace + user lookups moved off Firestore onto Drizzle.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authWithProfile } from '@/lib/auth';
import { getUserProfileAdmin } from '@/lib/db/queries/users';
import { getWorkspaceByIdAdmin } from '@/lib/db/queries/workspaces';
import {
  createCustomerPortalSession,
  getDefaultReturnUrl,
  isValidStripeCustomerId,
} from '@/lib/stripe/customer-portal';
import { createLogger } from '@/lib/logger';
import { serverError, isStripeCardError } from '@/lib/api/errors';

const logger = createLogger('api/billing/create-portal-session');

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const dashboardUser = await authWithProfile();

    if (!dashboardUser) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get user profile to find default workspace
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

    // 3. Get workspace
    const workspace = await getWorkspaceByIdAdmin(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
        { status: 404 }
      );
    }

    const stripeCustomerId = workspace.billing?.stripeCustomerId;
    if (!stripeCustomerId) {
      return NextResponse.json(
        {
          error: 'NO_STRIPE_CUSTOMER',
          message: 'No Stripe customer found. Please upgrade to a paid plan first.',
        },
        { status: 400 }
      );
    }

    if (!isValidStripeCustomerId(stripeCustomerId)) {
      logger.error('Invalid Stripe customer ID: ' + stripeCustomerId);
      return NextResponse.json(
        { error: 'INVALID_CUSTOMER_ID', message: 'Invalid customer ID format' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const returnUrl = body.returnUrl || getDefaultReturnUrl();

    const portalSession = await createCustomerPortalSession(stripeCustomerId, returnUrl);

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(
      '/api/billing/create-portal-session error: ' + msg,
      error instanceof Error ? error : new Error(msg)
    );

    const errType = (error as { type?: string }).type;
    if (errType) {
      return NextResponse.json(
        {
          error: 'STRIPE_ERROR',
          message: isStripeCardError(error) ? error.message : 'Billing is temporarily unavailable. Please try again.',
          type: errType,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
