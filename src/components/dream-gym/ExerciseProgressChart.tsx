'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WorkoutLog } from '@/types/domain';

interface ExerciseProgressChartProps {
  workouts: WorkoutLog[];
  height?: number;
}

/**
 * ExerciseProgressChart - Track progress for individual exercises
 *
 * Select an exercise to see weight/rep progression over time
 */
export function ExerciseProgressChart({
  workouts,
  height = 280,
}: ExerciseProgressChartProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [metric, setMetric] = useState<'maxWeight' | 'totalReps' | 'avgWeight'>('maxWeight');

  // Extract unique exercises from all workouts
  const exercises = useMemo(() => {
    const exerciseMap = new Map<string, { id: string; name: string; count: number }>();

    workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        const existing = exerciseMap.get(exercise.exerciseId);
        if (existing) {
          existing.count += 1;
        } else {
          exerciseMap.set(exercise.exerciseId, {
            id: exercise.exerciseId,
            name: exercise.exerciseName,
            count: 1,
          });
        }
      });
    });

    // Sort by frequency (most common first)
    return Array.from(exerciseMap.values()).sort((a, b) => b.count - a.count);
  }, [workouts]);

  // Auto-select first exercise if none selected (useEffect for side effects)
  useEffect(() => {
    if (!selectedExercise && exercises.length > 0) {
      setSelectedExercise(exercises[0].id);
    }
  }, [exercises, selectedExercise]);

  // Get data for selected exercise
  const chartData = useMemo(() => {
    if (!selectedExercise) return [];

    // Track cumulative data for proper averaging
    const dataMap = new Map<string, {
      date: string;
      fullDate: Date;
      maxWeight: number;
      totalReps: number;
      totalWeight: number;
      weightedSets: number;
    }>();

    workouts.forEach((workout) => {
      const exercise = workout.exercises.find((e) => e.exerciseId === selectedExercise);
      if (!exercise) return;

      const date = new Date(workout.date);
      const dateKey = date.toISOString().split('T')[0];

      // Calculate metrics for this exercise instance
      let maxWeight = 0;
      let totalWeight = 0;
      let totalReps = 0;
      let weightedSets = 0;

      exercise.sets.forEach((set) => {
        if (set.completed) {
          totalReps += set.reps;
          if (set.weight) {
            maxWeight = Math.max(maxWeight, set.weight);
            totalWeight += set.weight;
            weightedSets += 1;
          }
        }
      });

      const existing = dataMap.get(dateKey);
      if (existing) {
        // Aggregate cumulative values for proper averaging
        existing.maxWeight = Math.max(existing.maxWeight, maxWeight);
        existing.totalReps += totalReps;
        existing.totalWeight += totalWeight;
        existing.weightedSets += weightedSets;
      } else {
        dataMap.set(dateKey, {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: date,
          maxWeight,
          totalReps,
          totalWeight,
          weightedSets,
        });
      }
    });

    // Convert to final format with calculated avgWeight
    return Array.from(dataMap.values())
      .map((entry) => ({
        date: entry.date,
        fullDate: entry.fullDate,
        maxWeight: entry.maxWeight,
        totalReps: entry.totalReps,
        avgWeight: entry.weightedSets > 0 ? Math.round(entry.totalWeight / entry.weightedSets) : 0,
      }))
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
  }, [workouts, selectedExercise]);

  // Calculate progress (first vs last entry)
  const progress = useMemo(() => {
    if (chartData.length < 2) return null;

    const first = chartData[0];
    const last = chartData[chartData.length - 1];

    const weightChange = last.maxWeight - first.maxWeight;
    const weightPercent = first.maxWeight > 0
      ? Math.round((weightChange / first.maxWeight) * 100)
      : 0;

    return {
      weightChange,
      weightPercent,
      sessions: chartData.length,
    };
  }, [chartData]);

  const metricConfig = {
    maxWeight: { label: 'Max Weight', unit: 'lbs', color: '#8b5cf6' },
    totalReps: { label: 'Total Reps', unit: 'reps', color: '#10b981' },
    avgWeight: { label: 'Avg Weight', unit: 'lbs', color: '#f59e0b' },
  };

  const currentMetric = metricConfig[metric];
  const selectedExerciseName = exercises.find((e) => e.id === selectedExercise)?.name || '';

  if (exercises.length === 0) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
        <p className="text-gray-500">Complete workouts to track exercise progress</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-gray-800 mb-3">Exercise Progress</h3>

        <div className="flex flex-wrap gap-3">
          {/* Exercise Selector */}
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="flex-1 min-w-[200px] text-sm border rounded-md px-3 py-1.5 bg-white"
          >
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name} ({exercise.count} sessions)
              </option>
            ))}
          </select>

          {/* Metric Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMetric(key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  metric === key
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {metricConfig[key].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      {progress && (
        <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-4 text-sm">
          <span className="text-gray-600">{selectedExerciseName}</span>
          <span className="text-gray-400">|</span>
          <span className={progress.weightChange >= 0 ? 'text-green-600' : 'text-red-600'}>
            {progress.weightChange >= 0 ? '+' : ''}
            {progress.weightChange} lbs ({progress.weightPercent >= 0 ? '+' : ''}
            {progress.weightPercent}%)
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{progress.sessions} sessions</span>
        </div>
      )}

      {/* Chart */}
      <div className="p-4">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            No data for selected exercise
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) =>
                  metric === 'totalReps' ? value : `${value}`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: unknown) => [
                  `${value} ${currentMetric.unit}`,
                  currentMetric.label,
                ]}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={currentMetric.color}
                strokeWidth={2}
                dot={{ fill: currentMetric.color, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default ExerciseProgressChart;
