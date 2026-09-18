'use client';

import { useMemo } from 'react';
import type { WorkoutLog } from '@/types/domain';

interface WorkoutStatsCardsProps {
  workouts: WorkoutLog[];
}

interface StatCard {
  label: string;
  value: string | number;
  subtext?: string;
  icon: string;
  color: string;
  bgColor: string;
}

/**
 * WorkoutStatsCards - Summary statistics for workout history
 *
 * Displays key metrics: total workouts, volume, streak, most frequent exercise
 */
export function WorkoutStatsCards({ workouts }: WorkoutStatsCardsProps) {
  const stats = useMemo(() => {
    if (workouts.length === 0) {
      return {
        totalWorkouts: 0,
        totalVolume: 0,
        totalMinutes: 0,
        currentStreak: 0,
        bestStreak: 0,
        mostFrequentExercise: null as string | null,
        avgWorkoutsPerWeek: 0,
        favoriteWorkoutType: null as string | null,
      };
    }

    // Basic totals
    const totalVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    const totalMinutes = workouts.reduce((sum, w) => sum + w.duration, 0);

    // Calculate streaks
    const sortedDates = workouts
      .map((w) => new Date(w.date).toISOString().split('T')[0])
      .filter((date, i, arr) => arr.indexOf(date) === i) // unique dates
      .sort();

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 1;

    // Check if most recent workout was today or yesterday for current streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastWorkoutDate = sortedDates[sortedDates.length - 1];
    const streakActive = lastWorkoutDate === today || lastWorkoutDate === yesterday;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / 86400000);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);
    currentStreak = streakActive ? tempStreak : 0;

    // Most frequent exercise
    const exerciseCounts = new Map<string, number>();
    workouts.forEach((w) => {
      w.exercises.forEach((e) => {
        exerciseCounts.set(e.exerciseName, (exerciseCounts.get(e.exerciseName) || 0) + 1);
      });
    });
    const mostFrequentExercise = exerciseCounts.size > 0
      ? Array.from(exerciseCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    // Favorite workout type
    const typeCounts = new Map<string, number>();
    workouts.forEach((w) => {
      typeCounts.set(w.type, (typeCounts.get(w.type) || 0) + 1);
    });
    const favoriteWorkoutType = typeCounts.size > 0
      ? Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    // Avg workouts per week (based on date range)
    const firstDate = new Date(sortedDates[0]);
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const weekSpan = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (7 * 86400000)));
    const avgWorkoutsPerWeek = Math.round((workouts.length / weekSpan) * 10) / 10;

    return {
      totalWorkouts: workouts.length,
      totalVolume,
      totalMinutes,
      currentStreak,
      bestStreak,
      mostFrequentExercise,
      avgWorkoutsPerWeek,
      favoriteWorkoutType,
    };
  }, [workouts]);

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
    return volume.toLocaleString();
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const cards: StatCard[] = [
    {
      label: 'Total Workouts',
      value: stats.totalWorkouts,
      subtext: `${stats.avgWorkoutsPerWeek}/week avg`,
      icon: '💪',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Volume',
      value: `${formatVolume(stats.totalVolume)} lbs`,
      subtext: stats.totalWorkouts > 0
        ? `${formatVolume(Math.round(stats.totalVolume / stats.totalWorkouts))} avg/workout`
        : undefined,
      icon: '⚖️',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Training Time',
      value: formatTime(stats.totalMinutes),
      subtext: stats.totalWorkouts > 0
        ? `${Math.round(stats.totalMinutes / stats.totalWorkouts)}m avg`
        : undefined,
      icon: '⏱️',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Current Streak',
      value: `${stats.currentStreak} days`,
      subtext: stats.bestStreak > stats.currentStreak
        ? `Best: ${stats.bestStreak} days`
        : 'Personal best!',
      icon: '🔥',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  // Add most frequent exercise if available
  if (stats.mostFrequentExercise) {
    cards.push({
      label: 'Top Exercise',
      value: stats.mostFrequentExercise,
      subtext: stats.favoriteWorkoutType
        ? `Favorite: ${stats.favoriteWorkoutType}`
        : undefined,
      icon: '⭐',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    });
  }

  if (workouts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <span className="text-3xl block mb-2">📊</span>
        <p className="text-gray-600 font-medium">No workout stats yet</p>
        <p className="text-gray-500 text-sm mt-1">
          Complete your first workout to see your progress!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bgColor} rounded-lg p-4 transition-transform hover:scale-105`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{card.icon}</span>
            <span className="text-xs text-gray-600 font-medium">{card.label}</span>
          </div>
          <div className={`text-xl font-bold ${card.color} truncate`}>{card.value}</div>
          {card.subtext && (
            <div className="text-xs text-gray-500 mt-1 truncate">{card.subtext}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default WorkoutStatsCards;
