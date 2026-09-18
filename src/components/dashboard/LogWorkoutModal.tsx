'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { WorkoutExerciseLog } from '@/types/domain';

interface LogWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkoutLogged: () => void;
  playerId: string;
}

export function LogWorkoutModal({
  isOpen,
  onClose,
  onWorkoutLogged,
  playerId,
}: LogWorkoutModalProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [exercises, setExercises] = useState<Partial<WorkoutExerciseLog>[]>([
    { exerciseName: '', targetSets: 3, targetReps: '8-12', sets: [] },
  ]);
  const [loading, setLoading] = useState(false);

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { exerciseName: '', targetSets: 3, targetReps: '8-12', sets: [] },
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises);
  };

  const handleExerciseChange = (
    index: number,
    field: keyof WorkoutExerciseLog,
    value: string
  ) => {
    const newExercises = [...exercises];
    (newExercises[index] as any)[field] = value;
    setExercises(newExercises);
  };

  const handleSubmit = async () => {
    setLoading(true);

    const now = new Date().toISOString();
    const workoutPayload = {
      title,
      duration: Number(duration),
      type: 'custom',
      date: now,
      exercises: exercises.map((ex) => ({
        exerciseId: ex.exerciseName?.toLowerCase().replace(/\s+/g, '-') || 'exercise',
        exerciseName: ex.exerciseName || '',
        targetSets: Number(ex.targetSets) || 3,
        targetReps: ex.targetReps || '8-12',
        sets: Array.from({ length: Number(ex.targetSets) || 3 }, (_, i) => ({
          setNumber: i + 1,
          reps: parseInt(String(ex.targetReps || '8').replace(/\D.*$/, '')) || 8,
          weight: null,
          completed: true,
          notes: null,
        })),
        notes: null,
      })),
    };

    try {
      const response = await fetch(`/api/players/${playerId}/dream-gym/workout-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutPayload),
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to save workout');
      }

      onWorkoutLogged();
      onClose();
    } catch (error) {
      console.error("Failed to log workout:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Log a New Workout</DialogTitle>
          <DialogDescription>
            Record your workout details below. This will be saved to your workout
            history.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Workout Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Morning Run, Strength Training"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Duration (min)
            </Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 60"
            />
          </div>
          <div className="col-span-4">
            <Label>Exercises</Label>
            <div className="space-y-4 mt-2">
              {exercises.map((exercise, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-zinc-50 rounded-lg">
                  <Input
                    value={exercise.exerciseName}
                    onChange={(e) =>
                      handleExerciseChange(index, 'exerciseName', e.target.value)
                    }
                    placeholder="Exercise Name (e.g., Bench Press)"
                    className="flex-grow"
                  />
                  <Input
                    value={exercise.targetSets?.toString()}
                    onChange={(e) =>
                      handleExerciseChange(index, 'targetSets', e.target.value)
                    }
                    type="number"
                    placeholder="Sets"
                    className="w-20"
                  />
                  <Input
                    value={exercise.targetReps}
                    onChange={(e) =>
                      handleExerciseChange(index, 'targetReps', e.target.value)
                    }
                    placeholder="Reps"
                    className="w-24"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveExercise(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddExercise}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Workout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
