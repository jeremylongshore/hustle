import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/db/queries/players';
import {
  createCardioLogAdmin,
  getCardioLogsAdmin,
} from '@/lib/db/queries/cardio-logs';
import { cardioLogCreateSchema, cardioLogQuerySchema } from '@/lib/validations/cardio-log-schema';
import type { CardioActivityType } from '@/types/domain';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/players/[id]/cardio-logs');

/**
 * GET /api/players/[id]/cardio-logs - List cardio logs
 * Supports pagination and filtering by activity type/date range
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
      activityType: (url.searchParams.get('activityType') as CardioActivityType) || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    };

    // Validate query params
    const validationResult = cardioLogQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const options = {
      activityType: queryParams.activityType,
      startDate: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
      endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
      limit: queryParams.limit,
      cursor: queryParams.cursor,
    };

    const { logs, nextCursor } = await getCardioLogsAdmin(
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
    logger.error('Error fetching cardio logs', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch cardio logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players/[id]/cardio-logs - Create cardio log
 * Records a run/cardio activity with distance and duration
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
    const validationResult = cardioLogCreateSchema.safeParse({
      ...body,
      playerId, // Inject from URL
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid cardio log data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const cardioLog = await createCardioLogAdmin(
      session.user.id,
      playerId,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      cardioLog,
    });
  } catch (error) {
    logger.error('Error creating cardio log', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create cardio log' },
      { status: 500 }
    );
  }
}
