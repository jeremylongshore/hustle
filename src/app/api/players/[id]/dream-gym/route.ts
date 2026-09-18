import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { getPlayerAdmin } from '@/lib/db/queries/players';
import { getDreamGymAdmin, upsertDreamGymAdmin, updateWeeklyGridAdmin } from '@/lib/db/queries/dream-gym';
import type { DreamGymProfile, DreamGymSchedule } from '@/types/domain';

const logger = createLogger('api/players/[id]/dream-gym');

/**
 * GET /api/players/[id]/dream-gym - Get Dream Gym profile
 * Security: Verifies parent ownership via player ownership check
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

    // Verify player belongs to user (using Admin SDK)
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get Dream Gym profile (using Admin SDK)
    const dreamGym = await getDreamGymAdmin(session.user.id, playerId);

    return NextResponse.json({
      success: true,
      dreamGym
    });
  } catch (error) {
    logger.error('Error fetching Dream Gym', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch Dream Gym profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players/[id]/dream-gym - Create or update Dream Gym profile
 * Security: Verifies parent ownership via player ownership check
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

    // Validate required fields
    const { profile, schedule } = body as {
      profile: DreamGymProfile;
      schedule: DreamGymSchedule;
    };

    if (!profile || !schedule) {
      return NextResponse.json(
        { error: 'Missing required fields: profile and schedule' },
        { status: 400 }
      );
    }

    // Validate profile fields
    if (!profile.goals || profile.goals.length === 0) {
      return NextResponse.json(
        { error: 'At least one goal is required' },
        { status: 400 }
      );
    }

    if (!profile.intensity) {
      return NextResponse.json(
        { error: 'Intensity is required' },
        { status: 400 }
      );
    }

    // Verify player belongs to user (using Admin SDK)
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Create/update Dream Gym profile (using Admin SDK)
    const dreamGym = await upsertDreamGymAdmin(session.user.id, playerId, {
      profile,
      schedule,
    });

    return NextResponse.json({
      success: true,
      dreamGym
    });
  } catch (error) {
    logger.error('Error saving Dream Gym', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to save Dream Gym profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/players/[id]/dream-gym - Update weekly training grid
 */
export async function PATCH(
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
    const { weeklyGrid } = body as { weeklyGrid: Record<string, Record<string, string | null>> };

    if (!weeklyGrid || typeof weeklyGrid !== 'object') {
      return NextResponse.json({ error: 'weeklyGrid is required' }, { status: 400 });
    }

    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    await updateWeeklyGridAdmin(session.user.id, playerId, weeklyGrid);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating weekly grid', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to update weekly grid' }, { status: 500 });
  }
}
