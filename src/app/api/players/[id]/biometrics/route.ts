import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/db/queries/players';
import {
  createBiometricsLogAdmin,
  getBiometricsLogsAdmin,
  getBiometricsTrendsAdmin,
} from '@/lib/db/queries/biometrics';
import { biometricsLogCreateSchema, biometricsLogQuerySchema, biometricsSources } from '@/lib/validations/biometrics-schema';
import type { BiometricsSource } from '@/types/domain';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/players/[id]/biometrics');

/**
 * GET /api/players/[id]/biometrics - List biometrics logs
 * Supports pagination, filtering by source/date range, and trends
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
    const includeTrends = url.searchParams.get('includeTrends') === 'true';
    const sourceParam = url.searchParams.get('source');

    const queryParams = {
      source: sourceParam ? (sourceParam as BiometricsSource) : undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    };

    // Validate source if provided
    if (queryParams.source && !biometricsSources.includes(queryParams.source)) {
      return NextResponse.json(
        { error: 'Invalid source parameter' },
        { status: 400 }
      );
    }

    // Validate query params
    const validationResult = biometricsLogQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const options = {
      source: queryParams.source,
      startDate: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
      endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
      limit: queryParams.limit,
      cursor: queryParams.cursor,
    };


    const { logs, nextCursor } = await getBiometricsLogsAdmin(
      session.user.id,
      playerId,
      options
    );


    // Optionally include trend data
    let trends = null;
    if (includeTrends) {
      trends = await getBiometricsTrendsAdmin(
        session.user.id,
        playerId,
        {
          startDate: options.startDate,
          endDate: options.endDate,
          limit: 30,
        }
      );
    }

    return NextResponse.json({
      success: true,
      logs,
      nextCursor,
      trends,
    });
  } catch (error) {
    logger.error('Error fetching biometrics logs', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch biometrics logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players/[id]/biometrics - Create biometrics log
 * Records health metrics (heart rate, sleep, activity)
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
    const validationResult = biometricsLogCreateSchema.safeParse({
      ...body,
      playerId, // Inject from URL
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid biometrics data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }


    const biometricsLog = await createBiometricsLogAdmin(
      session.user.id,
      playerId,
      validationResult.data
    );


    return NextResponse.json({
      success: true,
      biometricsLog,
    });
  } catch (error) {
    logger.error('Error creating biometrics log', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create biometrics log' },
      { status: 500 }
    );
  }
}
