'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type {
  DreamGymGoal,
  DreamGymIntensity,
  DreamGymEquipment,
  DreamGymDayType,
  DreamGymSchedule,
  SoccerPositionCode,
  Player,
} from '@/types/domain';

const EQUIPMENT_OPTIONS: { value: DreamGymEquipment; label: string }[] = [
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'bands', label: 'Resistance Bands' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'bench', label: 'Workout Bench' },
  { value: 'pull_up_bar', label: 'Pull-up Bar' },
  { value: 'cable', label: 'Cable Machine' },
  { value: 'jump_rope', label: 'Jump Rope' },
  { value: 'foam_roller', label: 'Foam Roller' },
  { value: 'medicine_ball', label: 'Medicine Ball' },
];

const GOAL_OPTIONS: { value: DreamGymGoal; label: string; description: string }[] = [
  { value: 'fat_loss', label: 'Fat Loss', description: 'Shed extra weight while building lean muscle' },
  { value: 'muscle_build', label: 'Build Muscle', description: 'Increase strength and muscle mass' },
  { value: 'core', label: 'Core Strength', description: 'Develop a strong, stable core' },
  { value: 'leg_power', label: 'Leg Power', description: 'Build explosive leg strength for sprinting and jumping' },
  { value: 'soccer_offday', label: 'Soccer Off-Day', description: 'Light recovery workouts for non-practice days' },
];

const INTENSITY_OPTIONS: { value: DreamGymIntensity; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Easy workouts, focus on form and recovery' },
  { value: 'normal', label: 'Normal', description: 'Balanced intensity for steady progress' },
  { value: 'beast_mode', label: 'Beast Mode', description: 'Maximum intensity for serious gains' },
];

const DAY_TYPE_OPTIONS: { value: DreamGymDayType; label: string }[] = [
  { value: 'off', label: 'Off Day' },
  { value: 'practice_light', label: 'Light Practice' },
  { value: 'practice_medium', label: 'Medium Practice' },
  { value: 'practice_hard', label: 'Hard Practice' },
  { value: 'game', label: 'Game Day' },
  { value: 'tournament', label: 'Tournament' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

interface OnboardingState {
  hasGymAccess: boolean;
  hasHomeEquipment: boolean;
  equipmentTags: DreamGymEquipment[];
  goals: DreamGymGoal[];
  intensity: DreamGymIntensity;
  schedule: DreamGymSchedule;
}

export default function DreamGymOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);

  const [state, setState] = useState<OnboardingState>({
    hasGymAccess: false,
    hasHomeEquipment: false,
    equipmentTags: [],
    goals: [],
    intensity: 'normal',
    schedule: {
      monday: 'off',
      tuesday: 'off',
      wednesday: 'off',
      thursday: 'off',
      friday: 'off',
      saturday: 'off',
      sunday: 'off',
    },
  });

  useEffect(() => {
    async function fetchPlayer() {
      if (!playerId) {
        router.push('/dashboard/dream-gym');
        return;
      }

      try {
        const res = await fetch(`/api/players/${playerId}`);
        if (!res.ok) throw new Error('Player not found');
        const data = await res.json();
        setPlayer(data.player);
      } catch (error) {
        console.error('Error fetching player:', error);
        router.push('/dashboard/dream-gym');
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [playerId, router]);

  function toggleEquipment(equipment: DreamGymEquipment) {
    setState((prev) => ({
      ...prev,
      equipmentTags: prev.equipmentTags.includes(equipment)
        ? prev.equipmentTags.filter((e) => e !== equipment)
        : [...prev.equipmentTags, equipment],
    }));
  }

  function toggleGoal(goal: DreamGymGoal) {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : prev.goals.length < 3
        ? [...prev.goals, goal]
        : prev.goals,
    }));
  }

  function updateSchedule(day: keyof DreamGymSchedule, value: DreamGymDayType) {
    setState((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [day]: value },
    }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return true; // No requirements for step 1
      case 2:
        return state.goals.length > 0;
      case 3:
        return true; // Schedule defaults are fine
      default:
        return false;
    }
  }

  async function handleSubmit() {
    if (!playerId || !player) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/players/${playerId}/dream-gym`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            hasGymAccess: state.hasGymAccess,
            hasHomeEquipment: state.hasHomeEquipment,
            equipmentTags: state.equipmentTags,
            goals: state.goals,
            intensity: state.intensity,
            sport: 'soccer',
            position: player.primaryPosition as SoccerPositionCode,
            onboardingComplete: true,
          },
          schedule: state.schedule,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save Dream Gym profile');
      }

      router.push(`/dashboard/dream-gym?playerId=${playerId}`);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!player) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/dashboard/dream-gym?playerId=${playerId}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dream Gym
      </Link>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s < step
                  ? 'bg-zinc-900 text-white'
                  : s === step
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-200 text-zinc-500'
              }`}
            >
              {s < step ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-24 sm:w-32 h-1 mx-2 ${
                  s < step ? 'bg-zinc-900' : 'bg-zinc-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Gym Access & Equipment */}
      {step === 1 && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle>Gym Access & Equipment</CardTitle>
            <p className="text-sm text-zinc-600">
              Tell us about your training environment for {player.name}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gym Access */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-3">
                Does {player.name} have access to a gym?
              </label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={state.hasGymAccess ? 'default' : 'outline'}
                  onClick={() => setState((prev) => ({ ...prev, hasGymAccess: true }))}
                  className={state.hasGymAccess ? 'bg-zinc-900 hover:bg-zinc-800' : ''}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={!state.hasGymAccess ? 'default' : 'outline'}
                  onClick={() => setState((prev) => ({ ...prev, hasGymAccess: false }))}
                  className={!state.hasGymAccess ? 'bg-zinc-900 hover:bg-zinc-800' : ''}
                >
                  No, Home Only
                </Button>
              </div>
            </div>

            {/* Home Equipment */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-3">
                Any equipment at home?
              </label>
              <div className="flex gap-4 mb-4">
                <Button
                  type="button"
                  variant={state.hasHomeEquipment ? 'default' : 'outline'}
                  onClick={() => setState((prev) => ({ ...prev, hasHomeEquipment: true }))}
                  className={state.hasHomeEquipment ? 'bg-zinc-900 hover:bg-zinc-800' : ''}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={!state.hasHomeEquipment ? 'default' : 'outline'}
                  onClick={() => setState((prev) => ({ ...prev, hasHomeEquipment: false }))}
                  className={!state.hasHomeEquipment ? 'bg-zinc-900 hover:bg-zinc-800' : ''}
                >
                  No Equipment
                </Button>
              </div>

              {/* Equipment Selection */}
              {state.hasHomeEquipment && (
                <div className="grid grid-cols-2 gap-2">
                  {EQUIPMENT_OPTIONS.map((equipment) => (
                    <label
                      key={equipment.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        state.equipmentTags.includes(equipment.value)
                          ? 'border-zinc-900 bg-zinc-50'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={state.equipmentTags.includes(equipment.value)}
                        onChange={() => toggleEquipment(equipment.value)}
                        className="w-4 h-4 text-zinc-900 focus:ring-zinc-900 rounded"
                      />
                      <span className="text-sm">{equipment.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="bg-zinc-900 hover:bg-zinc-800 gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Goals & Intensity */}
      {step === 2 && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle>Goals & Intensity</CardTitle>
            <p className="text-sm text-zinc-600">
              What does {player.name} want to achieve?
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Goals */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-3">
                Training Goals (select up to 3)
              </label>
              <div className="space-y-2">
                {GOAL_OPTIONS.map((goal) => (
                  <label
                    key={goal.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      state.goals.includes(goal.value)
                        ? 'border-zinc-900 bg-zinc-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    } ${
                      state.goals.length >= 3 && !state.goals.includes(goal.value)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={state.goals.includes(goal.value)}
                      onChange={() => toggleGoal(goal.value)}
                      disabled={state.goals.length >= 3 && !state.goals.includes(goal.value)}
                      className="w-4 h-4 mt-0.5 text-zinc-900 focus:ring-zinc-900 rounded"
                    />
                    <div>
                      <span className="font-medium text-sm">{goal.label}</span>
                      <p className="text-xs text-zinc-500 mt-0.5">{goal.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {state.goals.length === 0 && (
                <p className="text-sm text-red-500 mt-2">Please select at least one goal</p>
              )}
            </div>

            {/* Intensity */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-3">
                Workout Intensity
              </label>
              <div className="space-y-2">
                {INTENSITY_OPTIONS.map((intensity) => (
                  <label
                    key={intensity.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      state.intensity === intensity.value
                        ? 'border-zinc-900 bg-zinc-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="intensity"
                      checked={state.intensity === intensity.value}
                      onChange={() => setState((prev) => ({ ...prev, intensity: intensity.value }))}
                      className="w-4 h-4 mt-0.5 text-zinc-900 focus:ring-zinc-900"
                    />
                    <div>
                      <span className="font-medium text-sm">{intensity.label}</span>
                      <p className="text-xs text-zinc-500 mt-0.5">{intensity.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceed()}
                className="bg-zinc-900 hover:bg-zinc-800 gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Weekly Schedule */}
      {step === 3 && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <p className="text-sm text-zinc-600">
              What does a typical week look like for {player.name}?
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-zinc-500 mb-4">
              This helps us plan workouts around practice and game days.
            </p>

            {DAYS.map((day) => (
              <div key={day} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                <span className="font-medium capitalize">{day}</span>
                <select
                  value={state.schedule[day]}
                  onChange={(e) => updateSchedule(day, e.target.value as DreamGymDayType)}
                  className="px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
                >
                  {DAY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !canProceed()}
                className="bg-zinc-900 hover:bg-zinc-800 gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
