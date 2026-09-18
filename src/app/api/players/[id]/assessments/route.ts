import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { getPlayerAdmin } from '@/lib/db/queries/players';
import {
  createAssessmentAdmin,
  getAssessmentsAdmin,
  getAssessmentSummaryAdmin,
} from '@/lib/db/queries/assessments';
import {
  fitnessAssessmentCreateSchema,
  fitnessAssessmentQuerySchema,
  fitnessTestTypes,
  fitnessTestMetadata,
  validateAssessmentValue,
} from '@/lib/validations/assessment-schema';
import type { FitnessTestType } from '@/types/domain';

const logger = createLogger('api/players/[id]/assessments');

/**
 * GET /api/players/[id]/assessments - List fitness assessments
 * Supports pagination, filtering by test type/date range, and summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId } = await params;

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const includeSummary = url.searchParams.get('includeSummary') === 'true';
    const includeMetadata = url.searchParams.get('includeMetadata') === 'true';

    const queryParams = {
      testType: (url.searchParams.get('testType') as FitnessTestType) || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    };

    // Validate test type if provided
    if (queryParams.testType && !fitnessTestTypes.includes(queryParams.testType)) {
      return NextResponse.json(
        { error: 'Invalid test type parameter' },
        { status: 400 }
      );
    }

    // Validate query params
    const validationResult = fitnessAssessmentQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const options = {
      testType: queryParams.testType,
      startDate: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
      endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
      limit: queryParams.limit,
      cursor: queryParams.cursor,
    };

    const { assessments, nextCursor } = await getAssessmentsAdmin(
      session.user.id,
      playerId,
      options
    );

    // Optionally include summary data
    let summary = null;
    if (includeSummary) {
      summary = await getAssessmentSummaryAdmin(session.user.id, playerId);
    }

    return NextResponse.json({
      success: true,
      assessments,
      nextCursor,
      summary,
      metadata: includeMetadata ? fitnessTestMetadata : undefined,
    });
  } catch (error) {
    logger.error('Error fetching assessments', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players/[id]/assessments - Create fitness assessment
 * Records a fitness test result
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId } = await params;
    const body = await request.json();

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Validate request body
    const validationResult = fitnessAssessmentCreateSchema.safeParse({
      ...body,
      playerId, // Inject from URL
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid assessment data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Validate value against test type constraints
    const { testType, value } = validationResult.data;
    const valueValidation = validateAssessmentValue(testType, value);
    if (!valueValidation.valid) {
      return NextResponse.json(
        { error: valueValidation.message },
        { status: 400 }
      );
    }

    const assessment = await createAssessmentAdmin(
      session.user.id,
      playerId,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      assessment,
    });
  } catch (error) {
    logger.error('Error creating assessment', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}
