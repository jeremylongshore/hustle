'use client';

import { useState, useMemo } from 'react';
import { WorkoutSummaryCard } from './WorkoutSummaryCard';
import type { WorkoutLog } from '@/types/domain';

interface WorkoutHistoryListProps {
  workouts: WorkoutLog[];
  onViewWorkout?: (workoutId: string) => void;
  onDeleteWorkout?: (workoutId: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

type FilterType = 'all' | 'strength' | 'conditioning' | 'core' | 'recovery' | 'custom';

// Filter types defined outside component for better performance
const FILTER_TYPES: FilterType[] = ['all', 'strength', 'conditioning', 'core', 'recovery', 'custom'];

/**
 * WorkoutHistoryList - Displays a filterable list of past workout logs
 *
 * Shows workout summaries with filtering by type and date range
 */
export function WorkoutHistoryList({
  workouts,
  onViewWorkout,
  onDeleteWorkout,
  loading = false,
  emptyMessage = 'No workouts logged yet. Complete a workout to see it here!',
}: WorkoutHistoryListProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const filteredWorkouts = useMemo(() => {
    let filtered = [...workouts];

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((w) => w.type === filterType);
    }

    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [workouts, filterType, sortOrder]);

  // Calculate stats
  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((sum, w) => sum + w.duration, 0);
  const totalVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-100 rounded-lg h-24"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {totalWorkouts > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalWorkouts}</div>
            <div className="text-xs text-blue-600/70">Workouts</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </div>
            <div className="text-xs text-green-600/70">Total Time</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {totalVolume > 1000
                ? `${(totalVolume / 1000).toFixed(1)}k`
                : totalVolume.toLocaleString()}
            </div>
            <div className="text-xs text-purple-600/70">Total Volume (lbs)</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {FILTER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors capitalize ${
                filterType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
          <span className="text-xs">{sortOrder === 'newest' ? '↓' : '↑'}</span>
        </button>
      </div>

      {/* Workout List */}
      {filteredWorkouts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkouts.map((workout) => (
            <WorkoutSummaryCard
              key={workout.id}
              workout={workout}
              onView={onViewWorkout ? () => onViewWorkout(workout.id) : undefined}
              onDelete={onDeleteWorkout ? () => onDeleteWorkout(workout.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default WorkoutHistoryList;
