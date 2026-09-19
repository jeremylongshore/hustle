import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { scheduleEventUpdateSchema } from '@/lib/validations/schedule-event-schema';
import {
  getScheduleEventAdmin,
  updateScheduleEventAdmin,
  deleteScheduleEventAdmin,
} from '@/lib/db/queries/schedule-events';
import { isPlayerAccessError } from '@/lib/db/queries/ownership';

const logger = createLogger('api/schedule/[eventId]');

// GET /api/schedule/[eventId] - Get a single schedule event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;
    const event = await getScheduleEventAdmin(session.user.id, eventId);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    logger.error('Failed to fetch schedule event', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to fetch schedule event' }, { status: 500 });
  }
}

// PATCH /api/schedule/[eventId] - Update a schedule event
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;

    // Verify ownership
    const existing = await getScheduleEventAdmin(session.user.id, eventId);
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = scheduleEventUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const event = await updateScheduleEventAdmin(session.user.id, eventId, validationResult.data);

    logger.info('Schedule event updated', { userId: session.user.id, eventId });
    return NextResponse.json({ event });
  } catch (error) {
    if (isPlayerAccessError(error)) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    logger.error('Failed to update schedule event', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to update schedule event' }, { status: 500 });
  }
}

// DELETE /api/schedule/[eventId] - Delete a schedule event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;

    // Verify ownership
    const existing = await getScheduleEventAdmin(session.user.id, eventId);
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await deleteScheduleEventAdmin(session.user.id, eventId);

    logger.info('Schedule event deleted', { userId: session.user.id, eventId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete schedule event', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to delete schedule event' }, { status: 500 });
  }
}
