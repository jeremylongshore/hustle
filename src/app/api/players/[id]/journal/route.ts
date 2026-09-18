import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/db/queries/players';
import {
  createJournalEntryAdmin,
  getJournalEntriesAdmin,
} from '@/lib/db/queries/journal';
import { journalEntryCreateSchema, journalEntryQuerySchema } from '@/lib/validations/journal-schema';
import type { JournalContext, JournalMoodTag } from '@/types/domain';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/players/[id]/journal');

/**
 * GET /api/players/[id]/journal - List journal entries
 * Supports pagination and filtering by context/mood/date
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
      context: (url.searchParams.get('context') as JournalContext) || undefined,
      moodTag: (url.searchParams.get('moodTag') as JournalMoodTag) || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    };

    // Validate query params
    const validationResult = journalEntryQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const options = {
      context: queryParams.context,
      moodTag: queryParams.moodTag,
      startDate: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
      endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
      limit: queryParams.limit,
      cursor: queryParams.cursor,
    };

    const { entries, nextCursor } = await getJournalEntriesAdmin(
      session.user.id,
      playerId,
      options
    );

    return NextResponse.json({
      success: true,
      entries,
      nextCursor,
    });
  } catch (error) {
    logger.error('Error fetching journal entries', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch journal entries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players/[id]/journal - Create journal entry
 * Records a new journal entry from any touchpoint
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
    const validationResult = journalEntryCreateSchema.safeParse({
      ...body,
      playerId, // Inject from URL
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid journal entry data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const entry = await createJournalEntryAdmin(
      session.user.id,
      playerId,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      entry,
    });
  } catch (error) {
    logger.error('Error creating journal entry', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create journal entry' },
      { status: 500 }
    );
  }
}
