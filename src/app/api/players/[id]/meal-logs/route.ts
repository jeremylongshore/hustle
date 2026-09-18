import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/db/queries/players';
import { createMealLogAdmin, getMealLogsAdmin } from '@/lib/db/queries/meal-logs';
import { mealLogCreateSchema, mealLogQuerySchema } from '@/lib/validations/meal-log-schema';
import type { MealType } from '@/types/domain';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/players/[id]/meal-logs');

/**
 * GET /api/players/[id]/meal-logs - List meal logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: playerId } = await params;
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const queryParams = {
      mealType: (url.searchParams.get('mealType') as MealType) || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      limit: url.searchParams.get('limit') || undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    };

    const validationResult = mealLogQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { mealType, startDate, endDate, limit, cursor } = validationResult.data;
    const { logs, nextCursor } = await getMealLogsAdmin(session.user.id, playerId, {
      mealType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      cursor,
    });

    return NextResponse.json({ success: true, logs, nextCursor });
  } catch (error) {
    logger.error('Error fetching meal logs', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to fetch meal logs' }, { status: 500 });
  }
}

/**
 * POST /api/players/[id]/meal-logs - Create meal log
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: playerId } = await params;
    const body = await request.json();

    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const validationResult = mealLogCreateSchema.safeParse({ ...body, playerId });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid meal log data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const mealLog = await createMealLogAdmin(session.user.id, playerId, validationResult.data);
    return NextResponse.json({ success: true, mealLog });
  } catch (error) {
    logger.error('Error creating meal log', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to create meal log' }, { status: 500 });
  }
}
