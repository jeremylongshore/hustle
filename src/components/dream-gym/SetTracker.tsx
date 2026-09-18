'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { WorkoutSetLog } from '@/types/domain';

interface SetTrackerProps {
  setNumber: number;
  targetReps: string;
  initialWeight?: number | null;
  onComplete: (set: WorkoutSetLog) => void;
  onUpdate?: (set: WorkoutSetLog) => void;
  disabled?: boolean;
}

/**
 * SetTracker - Individual set input for reps and weight
 *
 * Allows tracking of reps completed, weight used, and completion status
 */
export function SetTracker({
  setNumber,
  targetReps,
  initialWeight,
  onComplete,
  onUpdate,
  disabled = false,
}: SetTrackerProps) {
  const [reps, setReps] = useState<number>(parseInt(targetReps) || 10);
  const [weight, setWeight] = useState<number | null>(initialWeight ?? null);
  const [completed, setCompleted] = useState(false);
  const [notes, setNotes] = useState('');

  const handleComplete = useCallback(() => {
    const set: WorkoutSetLog = {
      setNumber,
      reps,
      weight,
      completed: true,
      notes: notes || null,
    };
    setCompleted(true);
    onComplete(set);
  }, [setNumber, reps, weight, notes, onComplete]);

  // Track initial mount to avoid calling onUpdate on first render
  const isInitialMount = useRef(true);

  // Use effect to call onUpdate when values change (avoids stale state)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (onUpdate) {
      const set: WorkoutSetLog = {
        setNumber,
        reps,
        weight,
        completed,
        notes: notes || null,
      };
      onUpdate(set);
    }
  }, [reps, weight, notes, setNumber, completed, onUpdate]);

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
    }`}>
      {/* Set Number */}
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-sm">
        {setNumber}
      </div>

      {/* Reps Input */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">Reps</label>
        <input
          type="number"
          min={0}
          max={100}
          value={reps}
          onChange={(e) => setReps(parseInt(e.target.value) || 0)}
          disabled={disabled || completed}
          className="w-16 px-2 py-1 text-center border rounded-md text-sm disabled:bg-gray-100"
          aria-label={`Reps for set ${setNumber}`}
        />
        <span className="text-xs text-gray-400 mt-0.5">Target: {targetReps}</span>
      </div>

      {/* Weight Input */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">Weight (lbs)</label>
        <input
          type="number"
          min={0}
          max={1000}
          step={2.5}
          value={weight ?? ''}
          onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : null)}
          disabled={disabled || completed}
          placeholder="--"
          className="w-20 px-2 py-1 text-center border rounded-md text-sm disabled:bg-gray-100"
          aria-label={`Weight for set ${setNumber}`}
        />
      </div>

      {/* Notes (collapsed by default) */}
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={disabled || completed}
          placeholder="Notes (optional)"
          className="w-full px-2 py-1 text-sm border rounded-md disabled:bg-gray-100"
          aria-label={`Notes for set ${setNumber}`}
        />
      </div>

      {/* Complete Button */}
      <button
        type="button"
        onClick={handleComplete}
        disabled={disabled || completed}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          completed
            ? 'bg-green-500 text-white cursor-default'
            : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300'
        }`}
        aria-label={completed ? 'Set completed' : 'Complete set'}
      >
        {completed ? '✓' : 'Done'}
      </button>
    </div>
  );
}

export default SetTracker;
