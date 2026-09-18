import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import bcrypt from 'bcrypt'
import { getUserProfileAdmin } from '@/lib/db/queries/users'
import { getGameAdmin, verifyGameAdmin } from '@/lib/db/queries/games'
import { getPlayerAdmin } from '@/lib/db/queries/players'
import { createLogger } from '@/lib/logger'
import { consumeRateLimit, rateLimitResponseInit, RATE_LIMITS } from '@/lib/rate-limit'

const logger = createLogger('api/verify')

// POST /api/verify - Verify a game log
export async function POST(request: NextRequest) {
  console.log('[Verify API] Request received')

  try {
    const session = await auth(request);
    console.log('[Verify API] Session:', session?.user?.id ? 'authenticated' : 'not authenticated')

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json()
    const { gameId, playerId, pin } = body
    console.log('[Verify API] Request body:', { gameId, playerId, pinLength: pin?.length })

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
    console.log('[Verify API] Fetching game...')
    const game = await getGameAdmin(session.user.id, playerId, gameId);

    if (!game) {
      console.log('[Verify API] Game not found')
      return NextResponse.json({
        error: 'Game not found'
      }, { status: 404 })
    }
    console.log('[Verify API] Game found:', game.id)

    // Check if already verified
    if (game.verified) {
      return NextResponse.json({
        error: 'Game already verified'
      }, { status: 400 })
    }

    // Prevent verification if older than 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    if (game.date < fourteenDaysAgo) {
      return NextResponse.json({
        error: 'Games older than 14 days cannot be verified'
      }, { status: 400 })
    }

    // Verify player exists using Admin SDK
    console.log('[Verify API] Fetching player...')
    const player = await getPlayerAdmin(session.user.id, playerId);

    if (!player) {
      console.log('[Verify API] Player not found')
      return NextResponse.json({
        error: 'Forbidden - Not your player'
      }, { status: 403 })
    }
    console.log('[Verify API] Player found:', player.name)

    // Get user profile using Admin SDK
    console.log('[Verify API] Fetching user profile...')
    const user = await getUserProfileAdmin(session.user.id);

    if (!user?.verificationPinHash) {
      console.log('[Verify API] No PIN hash found')
      return NextResponse.json({
        error: 'Verification PIN not set. Please set up your PIN in settings.'
      }, { status: 400 })
    }
    console.log('[Verify API] User has PIN hash')

    // Cap PIN guesses per user: PINs are short, so brute force is the main risk.
    const limit = consumeRateLimit(RATE_LIMITS.pinByUser, session.user.id);
    if (!limit.allowed) {
      const r = rateLimitResponseInit(limit);
      return NextResponse.json(r.body, r.init);
    }

    // Verify PIN
    console.log('[Verify API] Comparing PIN...')
    const isValidPin = await bcrypt.compare(pin, user.verificationPinHash)
    console.log('[Verify API] PIN valid:', isValidPin)

    if (!isValidPin) {
      return NextResponse.json({
        error: 'Invalid verification PIN'
      }, { status: 401 })
    }

    // Update game to verified using Admin SDK
    console.log('[Verify API] Verifying game...')
    await verifyGameAdmin(session.user.id, playerId, gameId);
    console.log('[Verify API] Game verified successfully')

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
      game: gameWithPlayer
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error: ' + errorMessage, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({
      error: `Failed to verify game: ${errorMessage}`
    }, { status: 500 })
  }
}
