import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import bcrypt from 'bcrypt'
import { getUserProfileAdmin } from '@/lib/db/queries/users'
import { getGameAdmin, verifyGameAdmin, AlreadyVerifiedError } from '@/lib/db/queries/games'
import { getPlayerAdmin } from '@/lib/db/queries/players'
import { createLogger } from '@/lib/logger'
import { consumeRateLimit, rateLimitResponseInit, RATE_LIMITS } from '@/lib/rate-limit'

const logger = createLogger('api/verify')

// POST /api/verify - Verify a game log
export async function POST(request: NextRequest) {

  try {
    const session = await auth(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json()
    const { gameId, playerId, pin } = body

    if (!gameId) {
      return NextResponse.json({
        error: 'Missing gameId'
      }, { status: 400 })
    }

    if (!playerId) {
      return NextResponse.json({
        error: 'Missing playerId'
      }, { status: 400 })
    }

    if (!pin) {
      return NextResponse.json({
        error: 'Missing verification PIN'
      }, { status: 400 })
    }

    // Get game from Firestore using Admin SDK
    const game = await getGameAdmin(session.user.id, playerId, gameId);

    if (!game) {
      return NextResponse.json({
        error: 'Game not found'
      }, { status: 404 })
    }

    // "Already verified" is decided per signer by verifyGameAdmin (a coach may have
    // signed first; the parent can still add their own signature).

    // Prevent verification if older than 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    if (game.date < fourteenDaysAgo) {
      return NextResponse.json({
        error: 'Games older than 14 days cannot be verified'
      }, { status: 400 })
    }

    // Verify player exists using Admin SDK
    const player = await getPlayerAdmin(session.user.id, playerId);

    if (!player) {
      return NextResponse.json({
        error: 'Forbidden - Not your player'
      }, { status: 403 })
    }

    // Get user profile using Admin SDK
    const user = await getUserProfileAdmin(session.user.id);

    if (!user?.verificationPinHash) {
      return NextResponse.json({
        error: 'Verification PIN not set. Please set up your PIN in settings.'
      }, { status: 400 })
    }

    // Cap PIN guesses per user: PINs are short, so brute force is the main risk.
    const limit = consumeRateLimit(RATE_LIMITS.pinByUser, session.user.id);
    if (!limit.allowed) {
      const r = rateLimitResponseInit(limit);
      return NextResponse.json(r.body, r.init);
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, user.verificationPinHash)

    if (!isValidPin) {
      return NextResponse.json({
        error: 'Invalid verification PIN'
      }, { status: 401 })
    }

    // Record the parent's co-signature (gameVerification row + games.verified flag)
    let verification
    try {
      verification = await verifyGameAdmin(session.user.id, playerId, gameId);
    } catch (err) {
      if (err instanceof AlreadyVerifiedError) {
        return NextResponse.json({ error: 'Game already verified' }, { status: 400 })
      }
      throw err
    }

    // Get updated game for response
    const verifiedGame = await getGameAdmin(session.user.id, playerId, gameId);

    // Format response
    const gameWithPlayer = {
      ...verifiedGame,
      player: {
        name: player.name,
        position: player.primaryPosition
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Game verified successfully',
      game: gameWithPlayer,
      verification
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error: ' + errorMessage, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({
      error: 'Failed to verify game'
    }, { status: 500 })
  }
}
