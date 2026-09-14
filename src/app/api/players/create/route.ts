import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isPastOrTodayDate } from '@/lib/validations/athlete-date';
import { createLogger } from '@/lib/logger';
import { createPlayerAdmin } from '@/lib/db/queries/players';
import { getUserProfileAdmin } from '@/lib/db/queries/users';
import {
  getWorkspaceByIdAdmin,
  incrementWorkspacePlayerCountAdmin,
} from '@/lib/db/queries/workspaces';
import { getPlanLimits } from '@/lib/stripe/plan-mapping';
import { WorkspaceAccessError } from '@/lib/workspaces/errors';
import { assertWorkspaceActive } from '@/lib/workspaces/enforce';

const logger = createLogger('api/players/create');

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // CRITICAL: Read body FIRST, before any async operations that call cookies()/headers()
    // In Next.js 15 + Turbopack, calling cookies() can interfere with the request stream
    let body;
    let rawBody = '';
    try {
      rawBody = await request.text();
      body = JSON.parse(rawBody);
    } catch (parseError) {
      logger.error('Failed to parse request body', parseError instanceof Error ? parseError : new Error(String(parseError)), {
        contentType: request.headers.get('content-type'),
        contentLength: request.headers.get('content-length'),
        rawBodyLength: rawBody.length,
        rawBodyPreview: rawBody.slice(0, 500),
      });
      return NextResponse.json(
        { error: 'INVALID_REQUEST_BODY', message: 'Invalid request body. Please check the form data and try again.' },
        { status: 400 }
      );
    }

    // Get authenticated user from Firebase session (calls cookies() internally)
    const session = await auth(request);

    if (!session?.user?.id) {
      logger.warn('Unauthorized player creation attempt', {
        path: request.nextUrl.pathname,
        method: request.method,
      });

      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be logged in to create a player.' },
        { status: 401 }
      );
    }
    const { name, birthday, primaryPosition, teamClub, gender, secondaryPositions, positionNote, leagueCode, leagueOtherName } = body;

    // Validate required fields (primaryPosition is the field name from the form schema)
    if (!name || !birthday || !primaryPosition || !teamClub || !gender || !leagueCode) {
      logger.warn('Invalid player creation request - missing fields', {
        userId: session.user.id,
        providedFields: {
          name: !!name,
          birthday: !!birthday,
          primaryPosition: !!primaryPosition,
          teamClub: !!teamClub,
          gender: !!gender,
          leagueCode: !!leagueCode,
        },
      });

      return NextResponse.json(
        { error: 'MISSING_REQUIRED_FIELDS', message: 'Please fill in all required fields: name, birthday, position, team/club, gender, and league.' },
        { status: 400 }
      );
    }

    if (!isPastOrTodayDate(birthday)) {
      return NextResponse.json(
        { error: 'INVALID_BIRTHDAY', message: 'Date of birth must be a valid date and cannot be in the future.' },
        { status: 400 }
      );
    }

    // Phase 5 Task 4: Get user's workspace and check plan limits.
    // (Phase 4.5: Firebase-backed fallback provisioning removed — user
    // provisioning now happens in the NextAuth register flow.)
    const user = await getUserProfileAdmin(session.user.id);

    if (!user?.defaultWorkspaceId) {
      logger.error(`User has no default workspace: ${session.user.id}`);
      return NextResponse.json(
        { error: 'WORKSPACE_NOT_FOUND', message: 'No workspace found. Please try logging out and back in, or contact support.' },
        { status: 500 }
      );
    }

    const workspace = await getWorkspaceByIdAdmin(user.defaultWorkspaceId);
    if (!workspace) {
      logger.error(`Workspace not found: userId=${session.user.id}, workspaceId=${user.defaultWorkspaceId}`);

      return NextResponse.json(
        { error: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found. Please contact support.' },
        { status: 500 }
      );
    }

    // Phase 6 Task 5: Enforce workspace active/trial status (blocks past_due, canceled, suspended, deleted)
    try {
      assertWorkspaceActive(workspace);
    } catch (error) {
      if (error instanceof WorkspaceAccessError) {
        logger.warn('Player creation blocked - subscription inactive', {
          userId: session.user.id,
          workspaceId: workspace.id,
          workspaceStatus: error.status,
          reason: error.code,
        });

        return NextResponse.json(
          error.toJSON(),
          { status: error.httpStatus }
        );
      }
      throw error; // Re-throw if not workspace access error
    }

    // Phase 5 Task 4: Check plan limit for max players
    const limits = getPlanLimits(workspace.plan);
    if (workspace.usage.playerCount >= limits.maxPlayers) {
      logger.warn('Player creation blocked - plan limit exceeded', {
        userId: session.user.id,
        workspaceId: workspace.id,
        currentPlan: workspace.plan,
        currentPlayerCount: workspace.usage.playerCount,
        maxPlayers: limits.maxPlayers,
      });

      return NextResponse.json(
        {
          error: 'PLAN_LIMIT_EXCEEDED',
          message: `You've reached the maximum number of players (${limits.maxPlayers}) for your ${workspace.plan} plan. Upgrade your plan to add more players.`,
          currentPlan: workspace.plan,
          currentCount: workspace.usage.playerCount,
          limit: limits.maxPlayers,
        },
        { status: 403 }
      );
    }

    // Create player with workspace context (Admin SDK - bypasses security rules)
    const player = await createPlayerAdmin(session.user.id, {
      workspaceId: workspace.id,  // Phase 5: Link to workspace
      name,
      birthday: new Date(birthday),
      gender,
      primaryPosition,
      secondaryPositions: secondaryPositions || [],
      positionNote: positionNote || null,
      leagueCode,
      leagueOtherName: leagueOtherName || null,
      teamClub,
      photoUrl: null,
    });

    // Phase 5 Task 4: Increment workspace player count (Admin SDK)
    await incrementWorkspacePlayerCountAdmin(workspace.id);

    const duration = Date.now() - startTime;

    logger.info('Player created successfully', {
      userId: session.user.id,
      playerId: player.id,
      playerName: name,
      position: primaryPosition,
      duration,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      player,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(
      'Failed to create player',
      error instanceof Error ? error : new Error(String(error)),
      {
        duration,
        statusCode: 500,
        path: request.nextUrl.pathname,
      }
    );

    return NextResponse.json(
      { error: 'PLAYER_CREATE_FAILED', message: 'Failed to create player. Please try again.' },
      { status: 500 }
    );
  }
}
