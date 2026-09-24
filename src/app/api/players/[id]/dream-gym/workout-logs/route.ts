import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { getPlayerAdmin } from '@/lib/db/queries/players';
import {
  createWorkoutLogAdmin,
  getWorkoutLogsAdmin,
} from '@/lib/db/queries/workout-logs';
import { workoutLogCreateSchema, workoutLogQuerySchema } from '@/lib/validations/workout-log-schema';
import type { WorkoutLogType } from '@/types/domain';

const logger = createLogger('api/players/[id]/dream-gym/workout-logs');

/**
 * GET /api/players/[id]/dream-gym/workout-logs - List workout logs
 * Supports pagination and filtering by type/date range
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

    // Parse query params - convert null to undefined for Zod validation
    const url = new URL(request.url);
    const typeParam = url.searchParams.get('type');
    const queryParams = {
      type: typeParam ? (typeParam as WorkoutLogType) : undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    };

    // Validate query params
    const validationResult = workoutLogQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const options = {
      type: queryParams.type,
      startDate: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
      endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
      limit: queryParams.limit,
      cursor: queryParams.cursor,
    };


    const { logs, nextCursor } = await getWorkoutLogsAdmin(
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
    logger.error('Error fetching workout logs', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch workout logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players/[id]/dream-gym/workout-logs - Create workout log
 * Records a completed workout with reps/sets/weight data
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
    const dataToValidate = {
      ...body,
      playerId, // Inject from URL
    };


    const validationResult = workoutLogCreateSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
      logger.error('[WORKOUT-LOG-CREATE] Validation failed', new Error(JSON.stringify(validationResult.error.flatten())));
      return NextResponse.json(
        { error: 'Invalid workout log data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }


    const workoutLog = await createWorkoutLogAdmin(
      session.user.id,
      playerId,
      validationResult.data
    );


    return NextResponse.json({
      success: true,
      workoutLog,
    });
  } catch (error) {
    logger.error('Error creating workout log', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create workout log' },
      { status: 500 }
    );
  }
}
