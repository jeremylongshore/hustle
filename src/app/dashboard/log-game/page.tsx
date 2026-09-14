'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronDown, Loader2, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { POSITIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { isPastOrTodayDate } from '@/lib/validations/athlete-date';

interface PlayerData {
  id: string;
  name: string;
  teamClub?: string;
  primaryPosition?: string;
  position?: string;
}

// ─── Schema ──────────────────────────────────────────────────
const num = (min: number, max: number, msg?: string) =>
  z.preprocess((v) => Number(v), msg ? z.number({ message: msg }).min(min).max(max) : z.number().min(min).max(max));

const gameSchema = z.object({
  athleteId: z.string().min(1, 'Please select an athlete'),
  date: z.string().min(1, 'Date is required').refine(isPastOrTodayDate, 'Game date cannot be in the future'),
  opponent: z.string().min(2, 'Opponent name is required').max(60),
  teamScore: num(0, 30),
  opponentScore: num(0, 30),
  position: z.string().optional(),
  goals: num(0, 20),
  assists: num(0, 20),
  shots: num(0, 30),
  minutesPlayed: num(1, 120, 'At least 1 minute'),
  yellowCards: num(0, 2),
  redCards: num(0, 1),
  notes: z.string().max(300).optional(),
  saves: num(0, 50),
  goalsAgainst: num(0, 20),
  cleanSheet: z.boolean(),
  tackles: num(0, 50),
  interceptions: num(0, 30),
  clearances: num(0, 50),
  blocks: num(0, 20),
  aerialDuelsWon: num(0, 30),
});

// Zod v4: coerce/preprocess outputs are typed as unknown; define types manually
type GameFormValues = {
  athleteId: string;
  date: string;
  opponent: string;
  teamScore: number;
  opponentScore: number;
  position?: string;
  goals: number;
  assists: number;
  shots: number;
  minutesPlayed: number;
  yellowCards: number;
  redCards: number;
  notes?: string;
  saves: number;
  goalsAgainst: number;
  cleanSheet: boolean;
  tackles: number;
  interceptions: number;
  clearances: number;
  blocks: number;
  aerialDuelsWon: number;
};

// ─── Helpers ─────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="font-body text-xs text-red-500 mt-1"
    >
      {msg}
    </motion.p>
  );
}

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-zinc-400 transition-colors';
const selectCls =
  'w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 appearance-none transition-colors';

// Number stepper component
function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-0 rounded-xl border border-zinc-200 overflow-hidden bg-white">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="px-3 py-3 hover:bg-zinc-50 transition-colors disabled:opacity-30"
      >
        <Minus size={14} className="text-zinc-600" />
      </button>
      <span className="flex-1 text-center font-display font-semibold text-zinc-900 text-base py-3 min-w-[2.5rem]">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="px-3 py-3 hover:bg-zinc-50 transition-colors disabled:opacity-30"
      >
        <Plus size={14} className="text-zinc-600" />
      </button>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────
export default function LogGamePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Stepper state (controlled separately for UX)
  const [goals, setGoals] = useState(0);
  const [assists, setAssists] = useState(0);
  const [shots, setShots] = useState(0);
  const [yellowCards, setYellowCards] = useState(0);
  const [redCards, setRedCards] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadPlayers() {
      try {
        const res = await fetch('/api/players');
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.players ?? []);
        }
      } catch (err) {
        console.error('Failed to load players:', err);
      } finally {
        setLoadingPlayers(false);
      }
    }
    loadPlayers();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GameFormValues>({
    resolver: zodResolver(gameSchema) as Resolver<GameFormValues>,
    defaultValues: {
      date: today,
      teamScore: 0,
      opponentScore: 0,
      minutesPlayed: 90,
      goals: 0,
      assists: 0,
      shots: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0, goalsAgainst: 0, cleanSheet: false,
      tackles: 0, interceptions: 0, clearances: 0, blocks: 0, aerialDuelsWon: 0,
    },
  });

  const selectedAthleteId = watch('athleteId');
  const selectedAthlete = players.find((player) => player.id === selectedAthleteId);
  const selectedPosition = watch('position') || selectedAthlete?.primaryPosition || selectedAthlete?.position;
  const isGoalkeeper = selectedPosition === 'GK' || selectedPosition === 'Goalkeeper';
  const isDefender = ['CB', 'LB', 'RB', 'LWB', 'RWB', 'Defender'].includes(selectedPosition ?? '');

  const syncStepper = (
    field: 'goals' | 'assists' | 'shots' | 'yellowCards' | 'redCards',
    setter: (v: number) => void,
    val: number
  ) => {
    setter(val);
    setValue(field, val, { shouldValidate: true });
  };

  const onSubmit = async (data: GameFormValues) => {
    setSubmitting(true);
    setSubmitError(null);

    const finalData = { ...data, goals, assists, shots, yellowCards, redCards };

    // Determine result from scores
    let result: 'Win' | 'Loss' | 'Draw' = 'Draw';
    if (finalData.teamScore > finalData.opponentScore) result = 'Win';
    else if (finalData.teamScore < finalData.opponentScore) result = 'Loss';

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: finalData.athleteId,
          date: finalData.date,
          opponent: finalData.opponent,
          result,
          yourScore: finalData.teamScore,
          opponentScore: finalData.opponentScore,
          minutesPlayed: finalData.minutesPlayed,
          goals: finalData.goals,
          assists: finalData.assists,
          tackles: isDefender ? finalData.tackles : 0,
          interceptions: isDefender ? finalData.interceptions : 0,
          clearances: isDefender ? finalData.clearances : 0,
          blocks: isDefender ? finalData.blocks : 0,
          aerialDuelsWon: isDefender ? finalData.aerialDuelsWon : 0,
          saves: isGoalkeeper ? finalData.saves : 0,
          goalsAgainst: isGoalkeeper ? finalData.goalsAgainst : 0,
          cleanSheet: isGoalkeeper && finalData.cleanSheet,
        }),
      });

      if (res.ok) {
        router.push('/dashboard/games');
      } else {
        const errData = await res.json().catch(() => ({}));
        setSubmitError(errData.message ?? 'Failed to save game. Please try again.');
        setSubmitting(false);
      }
    } catch {
      setSubmitError('Failed to save game. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/dashboard/games"
            className="inline-flex items-center gap-1.5 font-body text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-4"
          >
            <ChevronLeft size={15} />
            Games
          </Link>
          <h2 className="font-display text-2xl font-semibold text-zinc-900">
            Log a Game
          </h2>
          <p className="font-body text-sm text-zinc-500 mt-0.5">
            Record a game result and performance stats.
          </p>
        </motion.div>

        {/* Section: Who played */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
        >
          <p className="font-display text-sm font-semibold text-zinc-700">
            Who played?
          </p>

          <div>
            <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
              Athlete <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                {...register('athleteId')}
                className={cn(selectCls, errors.athleteId && 'border-red-300')}
                disabled={loadingPlayers}
              >
                <option value="">
                  {loadingPlayers ? 'Loading athletes...' : 'Select athlete'}
                </option>
                {players.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.teamClub ? ` — ${a.teamClub}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
            <FieldError msg={errors.athleteId?.message} />
            {!loadingPlayers && players.length === 0 && (
              <p className="font-body text-xs text-amber-600 mt-1">
                No athletes found.{' '}
                <Link href="/dashboard/add-athlete" className="underline">
                  Add one first
                </Link>.
              </p>
            )}
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
              Position Played
            </label>
            <div className="relative">
              <select {...register('position')} className={selectCls}>
                <option value="">Same as usual</option>
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} ({p.value})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* Section: Match info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
        >
          <p className="font-display text-sm font-semibold text-zinc-700">
            Match Info
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                {...register('date')}
                className={cn(inputCls, errors.date && 'border-red-300')}
                max={today}
              />
              <FieldError msg={errors.date?.message} />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
                Opponent <span className="text-red-400">*</span>
              </label>
              <input
                {...register('opponent')}
                className={cn(inputCls, errors.opponent && 'border-red-300')}
                placeholder="River City FC"
              />
              <FieldError msg={errors.opponent?.message} />
            </div>
          </div>

          {/* Score */}
          <div>
            <label className="block font-body text-sm font-medium text-zinc-700 mb-2">
              Final Score <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-body text-xs text-zinc-500 mb-1 text-center">Us</p>
                <input
                  type="number"
                  {...register('teamScore')}
                  className={cn(inputCls, 'text-center text-xl font-display font-semibold', errors.teamScore && 'border-red-300')}
                  min={0}
                  max={30}
                />
              </div>
              <span className="font-display text-2xl font-semibold text-zinc-400 mt-4">–</span>
              <div className="flex-1">
                <p className="font-body text-xs text-zinc-500 mb-1 text-center">Them</p>
                <input
                  type="number"
                  {...register('opponentScore')}
                  className={cn(inputCls, 'text-center text-xl font-display font-semibold', errors.opponentScore && 'border-red-300')}
                  min={0}
                  max={30}
                />
              </div>
            </div>
            {(errors.teamScore || errors.opponentScore) && (
              <FieldError msg="Both scores are required" />
            )}
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
              Minutes Played <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              {...register('minutesPlayed')}
              className={cn(inputCls, errors.minutesPlayed && 'border-red-300')}
              min={1}
              max={120}
              placeholder="90"
            />
            <FieldError msg={errors.minutesPlayed?.message} />
          </div>
        </motion.div>

        {/* Section: Performance stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.11 }}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-5"
        >
          <p className="font-display text-sm font-semibold text-zinc-700">
            Performance Stats
          </p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Goals', val: goals, setter: setGoals, field: 'goals' as const },
              { label: 'Assists', val: assists, setter: setAssists, field: 'assists' as const },
              { label: 'Shots', val: shots, setter: setShots, field: 'shots' as const, max: 30 },
            ].map(({ label, val, setter, field, max }) => (
              <div key={label} className="text-center">
                <label className="block font-body text-sm font-medium text-zinc-700 mb-2">
                  {label}
                </label>
                <Stepper
                  label={label}
                  value={val}
                  onChange={(v) => syncStepper(field, setter, v)}
                  max={max ?? 20}
                />
              </div>
            ))}
          </div>

          {isGoalkeeper && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="saves" className="font-body text-sm">Saves</label>
                <input id="saves" type="number" {...register('saves')} min={0} max={50} className={inputCls} />
                <FieldError msg={errors.saves?.message} />
              </div>
              <div>
                <label htmlFor="goalsAgainst" className="font-body text-sm">Goals Against</label>
                <input id="goalsAgainst" type="number" {...register('goalsAgainst')} min={0} max={20} className={inputCls} />
                <FieldError msg={errors.goalsAgainst?.message} />
              </div>
              <label className="font-body text-sm flex items-center gap-2">
                <input id="cleanSheet" type="checkbox" {...register('cleanSheet')} /> Clean Sheet
              </label>
            </div>
          )}
          {isDefender && (
            <div className="grid grid-cols-2 gap-4">
              {([
                ['tackles', 'Tackles', 50], ['interceptions', 'Interceptions', 30],
                ['clearances', 'Clearances', 50], ['blocks', 'Blocks', 20],
                ['aerialDuelsWon', 'Aerial Duels Won', 30],
              ] as const).map(([field, label, max]) => (
                <div key={field}>
                  <label htmlFor={field} className="font-body text-sm">{label}</label>
                  <input id={field} type="number" {...register(field)} min={0} max={max} className={inputCls} />
                  <FieldError msg={errors[field]?.message} />
                </div>
              ))}
            </div>
          )}

          {/* Cards */}
          <div className="pt-4 border-t border-zinc-100">
            <p className="font-body text-sm font-medium text-zinc-700 mb-3">Cards</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-6 bg-yellow-400 rounded-sm shadow-sm" />
                  <label className="font-body text-sm font-medium text-zinc-700">
                    Yellow Cards
                  </label>
                </div>
                <Stepper
                  label="Yellow Cards"
                  value={yellowCards}
                  onChange={(v) => syncStepper('yellowCards', setYellowCards, v)}
                  max={2}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-6 bg-red-500 rounded-sm shadow-sm" />
                  <label className="font-body text-sm font-medium text-zinc-700">
                    Red Cards
                  </label>
                </div>
                <Stepper
                  label="Red Cards"
                  value={redCards}
                  onChange={(v) => syncStepper('redCards', setRedCards, v)}
                  max={1}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section: Notes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.14 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <label className="block font-display text-sm font-semibold text-zinc-700 mb-3">
            Notes <span className="font-body font-normal text-zinc-400">(optional)</span>
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Any observations about the game, coaching notes, areas to improve..."
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-zinc-400 resize-none transition-colors"
          />
          <FieldError msg={errors.notes?.message} />
        </motion.div>

        {/* Error */}
        {submitError && (
          <div className="bg-red-50 text-red-600 font-body text-sm p-3 rounded-xl">
            {submitError}
          </div>
        )}

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.17 }}
          className="flex gap-3 pb-8"
        >
          <Link href="/dashboard/games" className="flex-1">
            <span className="block text-center py-3 rounded-full border-2 border-zinc-200 font-display font-semibold text-sm text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-colors">
              Cancel
            </span>
          </Link>
          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 rounded-full font-display font-semibold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-60"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            Save Game
          </motion.button>
        </motion.div>
      </div>
    </form>
  );
}
