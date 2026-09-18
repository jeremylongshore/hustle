'use client';

import type { WorkoutLog } from '@/types/domain';

interface WorkoutSummaryCardProps {
  workout: WorkoutLog;
  onView?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

const typeColors: Record<string, { bg: string; text: string; badge: string }> = {
  strength: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100' },
  conditioning: { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100' },
  core: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100' },
  recovery: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100' },
  custom: { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100' },
};

const typeIcons: Record<string, string> = {
  strength: '💪',
  conditioning: '🏃',
  core: '🎯',
  recovery: '🧘',
  custom: '⚡',
};

/**
 * WorkoutSummaryCard - Compact display of a single workout log
 *
 * Shows workout type, date, duration, exercise count, and volume
 */
export function WorkoutSummaryCard({
  workout,
  onView,
  onDelete,
  compact = false,
}: WorkoutSummaryCardProps) {
  const colors = typeColors[workout.type] || typeColors.custom;
  const icon = typeIcons[workout.type] || typeIcons.custom;

  const formattedDate = new Date(workout.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const exerciseCount = workout.exercises.length;
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg ${colors.bg} cursor-pointer hover:opacity-90 transition-opacity`}
        onClick={onView}
        role={onView ? 'button' : undefined}
        tabIndex={onView ? 0 : undefined}
        onKeyDown={onView ? (e) => e.key === 'Enter' && onView() : undefined}
      >
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${colors.text}`}>{workout.title}</div>
          <div className="text-xs text-gray-500">{formattedDate}</div>
        </div>
        <div className="text-sm text-gray-600">{workout.duration}m</div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border overflow-hidden ${colors.bg}`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className={`font-semibold ${colors.text}`}>{workout.title}</h3>
            <p className="text-sm text-gray-500">{formattedDate}</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors.badge} ${colors.text}`}>
          {workout.type}
        </span>
      </div>

      {/* Stats Row */}
      <div className="px-4 py-2 bg-white/50 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">⏱</span>
          <span className="text-gray-700">{workout.duration} min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">📋</span>
          <span className="text-gray-700">{exerciseCount} exercises</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">✓</span>
          <span className="text-gray-700">
            {completedSets}/{totalSets} sets
          </span>
        </div>
        {workout.totalVolume && workout.totalVolume > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">⚖</span>
            <span className="text-gray-700">
              {workout.totalVolume.toLocaleString()} lbs
            </span>
          </div>
        )}
      </div>

      {/* Exercise Preview */}
      <div className="px-4 py-2 bg-white/30">
        <div className="flex flex-wrap gap-1.5">
          {workout.exercises.slice(0, 4).map((exercise, idx) => (
            <span
              key={idx}
              className="text-xs bg-white/60 text-gray-600 px-2 py-0.5 rounded"
            >
              {exercise.exerciseName}
            </span>
          ))}
          {workout.exercises.length > 4 && (
            <span className="text-xs text-gray-500">
              +{workout.exercises.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {(onView || onDelete) && (
        <div className="px-4 py-2 bg-white border-t flex justify-end gap-2">
          {onView && (
            <button
              type="button"
              onClick={onView}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Details
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkoutSummaryCard;
