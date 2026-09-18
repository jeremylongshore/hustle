'use client';

import { useState, useCallback } from 'react';
import { SetTracker } from './SetTracker';
import type { WorkoutExerciseLog, WorkoutSetLog, WorkoutExercise } from '@/types/domain';

interface WorkoutLoggerProps {
  exercise: WorkoutExercise;
  onComplete: (exerciseLog: WorkoutExerciseLog) => void;
  disabled?: boolean;
}

/**
 * WorkoutLogger - Full exercise logging form with multiple sets
 *
 * Manages set tracking for a single exercise within a workout
 */
export function WorkoutLogger({
  exercise,
  onComplete,
  disabled = false,
}: WorkoutLoggerProps) {
  const [sets, setSets] = useState<WorkoutSetLog[]>([]);
  const [notes, setNotes] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSetComplete = useCallback((set: WorkoutSetLog) => {
    setSets((prev) => {
      const existing = prev.findIndex((s) => s.setNumber === set.setNumber);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = set;
        return updated;
      }
      return [...prev, set];
    });
  }, []);

  const handleFinishExercise = useCallback(() => {
    const exerciseLog: WorkoutExerciseLog = {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      targetSets: exercise.sets,
      targetReps: exercise.reps,
      sets,
      notes: notes || null,
    };
    onComplete(exerciseLog);
  }, [exercise, sets, notes, onComplete]);

  const completedSets = sets.filter((s) => s.completed).length;
  const allComplete = completedSets === exercise.sets;

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Exercise Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">{exercise.name}</span>
          <span className="text-sm text-gray-500">
            {exercise.sets} x {exercise.reps}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${
            allComplete ? 'text-green-600' : 'text-gray-500'
          }`}>
            {completedSets}/{exercise.sets} sets
          </span>
          <span className="text-gray-400">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* Sets Section */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Set Trackers */}
          {Array.from({ length: exercise.sets }, (_, i) => i + 1).map((setNum) => (
            <SetTracker
              key={setNum}
              setNumber={setNum}
              targetReps={exercise.reps}
              onComplete={handleSetComplete}
              disabled={disabled}
            />
          ))}

          {/* Exercise Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exercise Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={disabled}
              placeholder="How did this exercise feel? Any adjustments for next time?"
              className="w-full px-3 py-2 border rounded-md text-sm resize-none disabled:bg-gray-100"
              rows={2}
            />
          </div>

          {/* Complete Exercise Button */}
          <button
            type="button"
            onClick={handleFinishExercise}
            disabled={disabled || !allComplete}
            className={`w-full py-2 rounded-md font-medium transition-colors ${
              allComplete
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {allComplete ? 'Complete Exercise ✓' : `Complete all ${exercise.sets} sets first`}
          </button>
        </div>
      )}
    </div>
  );
}

export default WorkoutLogger;
