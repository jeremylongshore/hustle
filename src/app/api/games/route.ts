import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import { gameSchema } from '@/lib/validations/game-schema'
import { sendEmail } from '@/lib/email'
import { resolveAppOrigin } from '@/lib/app-origin'
import { emailTemplates } from '@/lib/email-templates'
import { getPlayerAdmin, getPlayersAdmin } from '@/lib/db/queries/players'
import { getAllGamesForPlayerAdmin, createGameAdmin, getUnverifiedGamesAdmin } from '@/lib/db/queries/games'
import { getUserProfileAdmin } from '@/lib/db/queries/users'
import { getWorkspaceByIdAdmin, incrementWorkspaceGamesThisMonthAdmin } from '@/lib/db/queries/workspaces'
import { getPlanLimits } from '@/lib/stripe/plan-mapping'
import { WorkspaceAccessError } from '@/lib/workspaces/errors'
import { assertWorkspaceActive } from '@/lib/workspaces/enforce'

const logger = createLogger('api/games');

// Simple in-memory rate limiting (production: use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

// GET /api/games?playerId=xxx - Get all games for a player
export async function GET(request: NextRequest) {
  try {
    const session = await auth(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be logged in to access games.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams
    const playerId = searchParams.get('playerId')

    if (!playerId) {
      return NextResponse.json({
        error: 'MISSING_PLAYER_ID',
        message: 'Player ID is required to fetch games.'
      }, { status: 400 })
    }

    // Verify player exists and belongs to authenticated user (Admin SDK)
    const player = await getPlayerAdmin(session.user.id, playerId);

    if (!player) {
      return NextResponse.json({
        error: 'PLAYER_NOT_FOUND',
        message: 'Player not found.'
      }, { status: 404 })
    }

    // Get all games for this player from Firestore (Admin SDK)
    const games = await getAllGamesForPlayerAdmin(session.user.id, playerId);

    // Format response to match Prisma structure (include player info)
    const gamesWithPlayer = games.map((game) => ({
      ...game,
      player: {
        name: player.name,
        position: player.position
      }
    }));

    return NextResponse.json({ games: gamesWithPlayer })
  } catch (error) {
    logger.error('Error fetching games', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({
      error: 'GAMES_FETCH_FAILED',
      message: 'Failed to fetch games. Please try again.'
    }, { status: 500 })
  }
}

// POST /api/games - Create a new game log
export async function POST(request: NextRequest) {
  try {
    const session = await auth(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be logged in to create games.' },
        { status: 401 }
      );
    }

    // Rate limiting check
    const userId = session.user.id;
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= RATE_LIMIT_MAX) {
          return NextResponse.json(
            { error: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        }
        userLimit.count++;
      } else {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // Phase 5 Task 4: Get user's workspace and check plan limits (Admin SDK)
    const user = await getUserProfileAdmin(session.user.id);
    if (!user?.defaultWorkspaceId) {
      logger.error('User has no default workspace', undefined, {
        userId: session.user.id,
      });

      return NextResponse.json(
        { error: 'WORKSPACE_NOT_FOUND', message: 'No workspace found. Please contact support.' },
        { status: 500 }
      );
    }

    const workspace = await getWorkspaceByIdAdmin(user.defaultWorkspaceId);
    if (!workspace) {
      logger.error('Workspace not found', undefined, {
        userId: session.user.id,
        workspaceId: user.defaultWorkspaceId,
      });

      return NextResponse.json(
        { error: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found. Please contact support.' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Handle finalScore format (e.g., "3-2") and convert to yourScore/opponentScore
    if (body.finalScore && typeof body.finalScore === 'string' && !body.yourScore) {
      const scores = body.finalScore.split('-');
      if (scores.length === 2) {
        body.yourScore = parseInt(scores[0]);
        body.opponentScore = parseInt(scores[1]);
      }
    }

    // Server-side Zod validation
    const validationResult = gameSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          message: 'Please check the form fields and try again.',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verify player exists AND belongs to authenticated user (Admin SDK)
    const player = await getPlayerAdmin(session.user.id, validatedData.playerId);

    if (!player) {
      return NextResponse.json({
        error: 'PLAYER_NOT_FOUND',
        message: 'Player not found.'
      }, { status: 404 });
    }

    // Phase 6 Task 5: Enforce workspace active/trial status (blocks past_due, canceled, suspended, deleted)
    try {
      assertWorkspaceActive(workspace);
    } catch (error) {
      if (error instanceof WorkspaceAccessError) {
        logger.warn('Game creation blocked - subscription inactive', {
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

    // Phase 5 Task 4: Check plan limit for max games per month
    const limits = getPlanLimits(workspace.plan);
    if (workspace.usage.gamesThisMonth >= limits.maxGamesPerMonth) {
      logger.warn('Game creation blocked - plan limit exceeded', {
        userId: session.user.id,
        workspaceId: workspace.id,
        currentPlan: workspace.plan,
        currentGamesThisMonth: workspace.usage.gamesThisMonth,
        maxGamesPerMonth: limits.maxGamesPerMonth,
      });

      return NextResponse.json(
        {
          error: 'PLAN_LIMIT_EXCEEDED',
          message: `You've reached the maximum number of games (${limits.maxGamesPerMonth}) for your ${workspace.plan} plan this month. Upgrade your plan to track more games.`,
          currentPlan: workspace.plan,
          currentCount: workspace.usage.gamesThisMonth,
          limit: limits.maxGamesPerMonth,
        },
        { status: 403 }
      );
    }

    // Create game log with defensive stats (Admin SDK)
    const game = await createGameAdmin(session.user.id, validatedData.playerId, {
      workspaceId: workspace.id,  // Phase 5: Link to workspace
      date: new Date(validatedData.date),
      opponent: validatedData.opponent,
      result: validatedData.result,
      finalScore: `${validatedData.yourScore}-${validatedData.opponentScore}`,
      minutesPlayed: validatedData.minutesPlayed,
      goals: validatedData.goals,
      assists: validatedData.assists,
      tackles: validatedData.tackles,
      interceptions: validatedData.interceptions,
      clearances: validatedData.clearances,
      blocks: validatedData.blocks,
      aerialDuelsWon: validatedData.aerialDuelsWon,
      saves: validatedData.saves,
      goalsAgainst: validatedData.goalsAgainst,
      cleanSheet: validatedData.cleanSheet,
    });

    // Phase 5 Task 4: Increment workspace game count (Admin SDK)
    await incrementWorkspaceGamesThisMonthAdmin(workspace.id);

    // Send verification email notification to parent
    try {
      const parentUser = await getUserProfileAdmin(session.user.id);

      // Count all unverified games for this user across all players (Admin SDK)
      const allPlayers = await getPlayersAdmin(session.user.id);
      let totalPendingCount = 0;
      for (const p of allPlayers) {
        const unverified = await getUnverifiedGamesAdmin(session.user.id, p.id);
        totalPendingCount += unverified.length;
      }

      if (parentUser?.email) {
        const baseUrl = resolveAppOrigin();

        const verifyUrl = `${baseUrl}/verify?playerId=${encodeURIComponent(validatedData.playerId)}`;

        const emailTemplate = emailTemplates.gameVerificationRequest({
          parentName: parentUser.firstName ?? 'Parent',
          playerName: player.name,
          opponent: validatedData.opponent,
          result: validatedData.result,
          finalScore: `${validatedData.yourScore}-${validatedData.opponentScore}`,
          minutesPlayed: validatedData.minutesPlayed,
          verifyUrl,
          pendingCount: totalPendingCount
        });

        await sendEmail({
          to: parentUser.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        });
      }
    } catch (notificationError) {
      logger.error('Failed to send verification email', notificationError instanceof Error ? notificationError : new Error(String(notificationError)));
      // Non-blocking: continue even if email fails
    }

    // Format response to match Prisma structure
    const gameWithPlayer = {
      ...game,
      player: {
        name: player.name,
        position: player.position
      }
    };

    return NextResponse.json({
      success: true,
      game: gameWithPlayer
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating game', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: 'GAME_CREATE_FAILED',
      message: 'Failed to create game. Please try again.'
    }, { status: 500 });
  }
}
