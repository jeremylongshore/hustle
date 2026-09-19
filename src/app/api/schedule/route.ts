import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import {
  scheduleEventCreateSchema,
  scheduleEventQuerySchema,
} from '@/lib/validations/schedule-event-schema';
import {
  createScheduleEventAdmin,
  getScheduleEventsAdmin,
} from '@/lib/db/queries/schedule-events';
import { isPlayerAccessError } from '@/lib/db/queries/ownership';

const logger = createLogger('api/schedule');

// GET /api/schedule - List schedule events for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const queryResult = scheduleEventQuerySchema.safeParse({
      startDate: params.get('startDate') ?? undefined,
      endDate: params.get('endDate') ?? undefined,
      playerId: params.get('playerId') ?? undefined,
      type: params.get('type') ?? undefined,
      limit: params.get('limit') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const query = queryResult.data;

    const events = await getScheduleEventsAdmin(session.user.id, {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      playerId: query.playerId,
      type: query.type,
      limit: query.limit,
    });

    return NextResponse.json({ events });
  } catch (error) {
    logger.error('Failed to fetch schedule events', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to fetch schedule events' }, { status: 500 });
  }
}

// POST /api/schedule - Create a new schedule event
export async function POST(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = scheduleEventCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const event = await createScheduleEventAdmin(session.user.id, validationResult.data);

    logger.info('Schedule event created', { userId: session.user.id, eventId: event.id });
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (isPlayerAccessError(error)) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    logger.error('Failed to create schedule event', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to create schedule event' }, { status: 500 });
  }
}
