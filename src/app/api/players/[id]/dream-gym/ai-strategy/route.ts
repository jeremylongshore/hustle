import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { getPlayerAdmin } from '@/lib/db/queries/players';
import { getDreamGymAdmin } from '@/lib/db/queries/dream-gym';
import { getWorkoutLogsAdmin } from '@/lib/db/queries/workout-logs';
import { getBiometricsTrendsAdmin } from '@/lib/db/queries/biometrics';
import type { Player, DreamGym, WorkoutLog } from '@/types/domain';
import type { BiometricsTrends } from '@/lib/db/queries/biometrics';
import {
  generateWorkoutStrategy,
  analyzeRecoveryStatus,
  suggestProgressions,
  type WorkoutStrategyInput,
} from '@/lib/ai/workout-strategy';

const logger = createLogger('api/players/[id]/dream-gym/ai-strategy');

/**
 * Shared helper to fetch common data for AI strategy endpoints
 */
async function fetchStrategyData(userId: string, playerId: string) {
  // Verify player belongs to user
  const player = await getPlayerAdmin(userId, playerId);
  if (!player) {
    return { error: 'Player not found', status: 404 };
  }

  // Get Dream Gym profile
  const dreamGym = await getDreamGymAdmin(userId, playerId);

  // Get recent workout logs (last 4 weeks)
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const { logs: workoutLogs } = await getWorkoutLogsAdmin(
    userId,
    playerId,
    { startDate: fourWeeksAgo, limit: 50 }
  );

  // Get biometrics trends
  let biometricsTrends: BiometricsTrends | null = null;
  try {
    biometricsTrends = await getBiometricsTrendsAdmin(
      userId,
      playerId,
      { startDate: fourWeeksAgo, limit: 30 }
    );
  } catch {
    // Biometrics may not exist
  }

  return { player, dreamGym, workoutLogs, biometricsTrends };
}

/**
 * Calculate recent mood from check-ins (always includes energy for strategy input)
 */
function calculateRecentMoodFull(checkIns: { mood: number; energy: string; soreness: string }[]) {
  const recentCheckIns = checkIns.slice(-7);
  if (recentCheckIns.length === 0) return undefined;

  const avgMood = recentCheckIns.reduce((sum, c) => sum + c.mood, 0) / recentCheckIns.length;

  const sorenessCounts: Record<string, number> = { low: 0, medium: 0, high: 0 };
  const energyCounts: Record<string, number> = { low: 0, ok: 0, high: 0 };

  for (const c of recentCheckIns) {
    if (c.soreness in sorenessCounts) sorenessCounts[c.soreness]++;
    if (c.energy in energyCounts) energyCounts[c.energy]++;
  }

  const avgSoreness = Object.entries(sorenessCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
  const avgEnergy = Object.entries(energyCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];

  return { avgMood, avgEnergy, avgSoreness };
}

/**
 * Calculate recent mood from check-ins (minimal for recovery analysis)
 */
function calculateRecentMoodMinimal(checkIns: { mood: number; soreness: string }[]) {
  const recentCheckIns = checkIns.slice(-7);
  if (recentCheckIns.length === 0) return undefined;

  const avgMood = recentCheckIns.reduce((sum, c) => sum + c.mood, 0) / recentCheckIns.length;
  const sorenessCounts: Record<string, number> = { low: 0, medium: 0, high: 0 };

  for (const c of recentCheckIns) {
    if (c.soreness in sorenessCounts) sorenessCounts[c.soreness]++;
  }
  const avgSoreness = Object.entries(sorenessCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];

  return { avgMood, avgSoreness };
}

/**
 * Calculate player age from birthday
 */
function calculateAge(birthday: Date | string | undefined): number | undefined {
  if (!birthday) return undefined;

  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Extract available days from schedule
 */
function getAvailableDays(schedule: DreamGym['schedule']): string[] {
  const availableDays: string[] = [];
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  for (const day of dayNames) {
    if (schedule[day] && schedule[day] !== 'off') {
      availableDays.push(day.charAt(0).toUpperCase() + day.slice(1));
    }
  }
  return availableDays;
}

/**
 * POST /api/players/[id]/dream-gym/ai-strategy
 * Generate an AI-powered workout strategy for the player
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

    const data = await fetchStrategyData(session.user.id, playerId);
    if ('error' in data) {
      return NextResponse.json({ error: data.error }, { status: data.status });
    }

    const { player, dreamGym, workoutLogs, biometricsTrends } = data;

    if (!dreamGym?.profile) {
      return NextResponse.json(
        { error: 'Dream Gym profile not found. Complete onboarding first.' },
        { status: 400 }
      );
    }

    // Get mental check-in data
    const checkIns = dreamGym?.mental?.checkIns || [];
    const recentMood = calculateRecentMoodFull(checkIns);

    // Build strategy input
    const strategyInput: WorkoutStrategyInput = {
      playerId,
      playerName: player.name,
      position: player.primaryPosition,
      goals: dreamGym.profile.goals || [],
      age: calculateAge(player.birthday),
      recentWorkouts: workoutLogs.map(log => ({
        date: new Date(log.completedAt),
        type: log.type,
        duration: log.duration,
        totalVolume: log.totalVolume ?? undefined,
        exercises: log.exercises.map(e => e.exerciseName),
      })),
      biometrics: biometricsTrends ? {
        avgRestingHeartRate: biometricsTrends.avgRestingHeartRate ?? undefined,
        avgHrv: biometricsTrends.avgHrv ?? undefined,
        avgSleepHours: biometricsTrends.avgSleepHours ?? undefined,
        avgSleepScore: biometricsTrends.avgSleepScore ?? undefined,
      } : undefined,
      recentMood,
      availableDays: getAvailableDays(dreamGym.schedule),
      hasGymAccess: dreamGym.profile.hasGymAccess,
    };

    // Generate AI strategy
    const strategy = await generateWorkoutStrategy(strategyInput);

    return NextResponse.json({
      success: true,
      strategy,
    });
  } catch (error) {
    logger.error('Error generating AI strategy', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to generate workout strategy' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/players/[id]/dream-gym/ai-strategy
 * Get recovery status analysis or progression suggestions
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
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'recovery';

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if (type === 'recovery') {
      const data = await fetchStrategyData(session.user.id, playerId);
      if ('error' in data) {
        return NextResponse.json({ error: data.error }, { status: data.status });
      }

      const { dreamGym, workoutLogs, biometricsTrends } = data;
      const checkIns = dreamGym?.mental?.checkIns || [];
      const recentMood = calculateRecentMoodMinimal(checkIns);

      const recovery = analyzeRecoveryStatus({
        recentWorkouts: workoutLogs.map(log => ({
          date: new Date(log.completedAt),
          duration: log.duration,
          totalVolume: log.totalVolume ?? undefined,
        })),
        biometrics: biometricsTrends ? {
          avgRestingHeartRate: biometricsTrends.avgRestingHeartRate ?? undefined,
          avgHrv: biometricsTrends.avgHrv ?? undefined,
          avgSleepScore: biometricsTrends.avgSleepScore ?? undefined,
        } : undefined,
        recentMood,
      });

      return NextResponse.json({
        success: true,
        recovery,
      });
    }

    if (type === 'progressions') {
      // Get workout history for progression analysis
      const { logs: workoutLogs } = await getWorkoutLogsAdmin(
        session.user.id,
        playerId,
        { limit: 50 }
      );

      // Flatten exercise data using flatMap
      const exerciseHistory = workoutLogs.flatMap(log =>
        log.exercises.flatMap(exercise =>
          exercise.sets
            .filter(set => set.completed)
            .map(set => ({
              exerciseName: exercise.exerciseName,
              sets: exercise.targetSets,
              reps: set.reps,
              weight: set.weight ?? undefined,
              date: new Date(log.completedAt),
            }))
        )
      );

      const progressions = suggestProgressions(exerciseHistory);

      return NextResponse.json({
        success: true,
        progressions,
      });
    }

    return NextResponse.json(
      { error: 'Invalid type parameter. Use "recovery" or "progressions".' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error analyzing data', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to analyze data' },
      { status: 500 }
    );
  }
}
