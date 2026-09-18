import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/db/queries/players';
import {
  createPracticeLogAdmin,
  getPracticeLogsAdmin,
} from '@/lib/db/queries/practice-logs';
import { practiceLogCreateSchema, practiceLogQuerySchema } from '@/lib/validations/practice-log-schema';
import type { PracticeType, PracticeFocusArea } from '@/types/domain';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/players/[id]/practice-logs');

/**
 * GET /api/players/[id]/practice-logs - List practice logs
 * Supports pagination and filtering by practice type/focus area/date range
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
    const queryParams = {
      practiceType: (url.searchParams.get('practiceType') as PracticeType) || undefined,
      focusArea: (url.searchParams.get('focusArea') as PracticeFocusArea) || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    };

    // Validate query params
    const validationResult = practiceLogQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const options = {
      practiceType: queryParams.practiceType,
      focusArea: queryParams.focusArea,
      startDate: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
      endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
      limit: queryParams.limit,
      cursor: queryParams.cursor,
    };

    const { logs, nextCursor } = await getPracticeLogsAdmin(
      session.user.id,
      playerId,
      options
    );

    return NextResponse.json({
      success: true,
      logs,
      nextCursor,
    });
  } catch (error) {
    logger.error('Error fetching practice logs', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch practice logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players/[id]/practice-logs - Create practice log
 * Records a practice session with duration and focus areas
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
    const validationResult = practiceLogCreateSchema.safeParse({
      ...body,
      playerId, // Inject from URL
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid practice log data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const practiceLog = await createPracticeLogAdmin(
      session.user.id,
      playerId,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      practiceLog,
    });
  } catch (error) {
    logger.error('Error creating practice log', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create practice log' },
      { status: 500 }
    );
  }
}
