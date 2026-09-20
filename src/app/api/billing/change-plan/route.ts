/**
 * Plan Change API Route
 *
 * POST /api/billing/change-plan
 *
 * Creates a Stripe Checkout session for plan upgrades/downgrades.
 * Phase 4.5 migration: workspace + user lookups moved off Firestore onto Drizzle.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authWithProfile } from '@/lib/auth';
import { getUserProfileAdmin } from '@/lib/db/queries/users';
import { getWorkspaceByIdAdmin } from '@/lib/db/queries/workspaces';
import {
  validatePlanChangeEligibility,
  buildCheckoutSession,
  getProrationPreview,
} from '@/lib/billing/plan-change';
import { getPlanForPriceId } from '@/lib/stripe/plan-mapping';
import { createLogger } from '@/lib/logger';
import { serverError, isStripeCardError } from '@/lib/api/errors';

const logger = createLogger('api/billing/change-plan');

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { targetPriceId } = body;

    if (!targetPriceId || typeof targetPriceId !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'targetPriceId is required' },
        { status: 400 }
      );
    }

    try {
      getPlanForPriceId(targetPriceId);
    } catch {
      return NextResponse.json(
        { error: 'INVALID_PRICE_ID', message: 'Unknown Stripe price ID' },
        { status: 400 }
      );
    }

    const eligibility = validatePlanChangeEligibility(workspace);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: 'NOT_ELIGIBLE',
          message: eligibility.reason || 'Workspace not eligible for plan change',
        },
        { status: 403 }
      );
    }

    let prorationPreview;
    try {
      prorationPreview = await getProrationPreview(workspace, targetPriceId);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(
        'Plan change proration preview failed: ' + msg,
        error instanceof Error ? error : new Error(msg)
      );
      return NextResponse.json(
        {
          error: 'PRORATION_FAILED',
          message: 'Failed to calculate proration. Please try again.',
        },
        { status: 500 }
      );
    }

    let checkoutUrl;
    try {
      checkoutUrl = await buildCheckoutSession(workspace, targetPriceId);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(
        'Plan change checkout session failed: ' + msg,
        error instanceof Error ? error : new Error(msg)
      );
      return NextResponse.json(
        {
          error: 'CHECKOUT_FAILED',
          message: 'Failed to create checkout session. Please try again.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: checkoutUrl,
      preview: {
        amountDue: prorationPreview.amountDue,
        currentPeriodEnd: prorationPreview.currentPeriodEnd.toISOString(),
        proratedAmount: prorationPreview.proratedAmount,
        immediateCharge: prorationPreview.immediateCharge,
        currencyCode: prorationPreview.currencyCode,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(
      '/api/billing/change-plan error: ' + msg,
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
      { error: 'INTERNAL_ERROR', message: 'Failed to process plan change request' },
      { status: 500 }
    );
  }
}
