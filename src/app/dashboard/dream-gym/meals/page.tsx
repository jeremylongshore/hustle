'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Check,
  Loader2,
  Trash2,
  Utensils,
  Zap,
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarColor } from '@/lib/player-utils';
import type { MealLog, MealType } from '@/types/domain';

// ─── Types ────────────────────────────────────────────────────
interface PlayerOption {
  id: string;
  name: string;
}

// ─── Meal Type Config ─────────────────────────────────────────
const MEAL_TYPES: {
  id: MealType;
  label: string;
  emoji: string;
  gradient: string;
  ring: string;
  dot: string;
  tagBg: string;
  tagText: string;
  shortLabel: string;
}[] = [
  {
    id: 'breakfast',
    label: 'Breakfast',
    shortLabel: 'Breakfast',
    emoji: '🌅',
    gradient: 'from-amber-400 via-orange-400 to-yellow-400',
    ring: 'ring-amber-400',
    dot: 'bg-amber-400',
    tagBg: 'bg-amber-50',
    tagText: 'text-amber-700',
  },
  {
    id: 'pre_workout',
    label: 'Pre-Workout',
    shortLabel: 'Pre-WO',
    emoji: '⚡',
    gradient: 'from-yellow-400 via-amber-500 to-orange-500',
    ring: 'ring-yellow-400',
    dot: 'bg-yellow-400',
    tagBg: 'bg-yellow-50',
    tagText: 'text-yellow-700',
  },
  {
    id: 'lunch',
    label: 'Lunch',
    shortLabel: 'Lunch',
    emoji: '🥗',
    gradient: 'from-emerald-400 via-green-400 to-teal-400',
    ring: 'ring-emerald-400',
    dot: 'bg-emerald-400',
    tagBg: 'bg-emerald-50',
    tagText: 'text-emerald-700',
  },
  {
    id: 'post_workout',
    label: 'Post-Workout',
    shortLabel: 'Post-WO',
    emoji: '💪',
    gradient: 'from-red-400 via-rose-500 to-pink-500',
    ring: 'ring-red-400',
    dot: 'bg-red-400',
    tagBg: 'bg-red-50',
    tagText: 'text-red-700',
  },
  {
    id: 'dinner',
    label: 'Dinner',
    shortLabel: 'Dinner',
    emoji: '🌙',
    gradient: 'from-indigo-500 via-violet-500 to-purple-500',
    ring: 'ring-indigo-400',
    dot: 'bg-indigo-500',
    tagBg: 'bg-indigo-50',
    tagText: 'text-indigo-700',
  },
  {
    id: 'snack',
    label: 'Snack',
    shortLabel: 'Snack',
    emoji: '🍎',
    gradient: 'from-pink-400 via-rose-400 to-fuchsia-400',
    ring: 'ring-pink-400',
    dot: 'bg-pink-400',
    tagBg: 'bg-pink-50',
    tagText: 'text-pink-700',
  },
];

const MAIN_MEAL_IDS: MealType[] = ['breakfast', 'lunch', 'dinner'];

// ─── Sound ────────────────────────────────────────────────────
function playSound(type: 'save' | 'delete') {
  if (typeof window === 'undefined') return;
  try {
    type WinWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctx = (window as WinWithWebkit).webkitAudioContext ?? window.AudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    const t = ctx.currentTime;
    if (type === 'save') {
      osc.frequency.setValueAtTime(523.25, t);
      osc.frequency.setValueAtTime(659.25, t + 0.1);
      osc.frequency.setValueAtTime(783.99, t + 0.22);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t); osc.stop(t + 0.6);
    } else {
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(300, t + 0.1);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t); osc.stop(t + 0.25);
    }
  } catch { /* AudioContext blocked */ }
}

// ─── ConfettiBurst ────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#ec4899',
  '#8b5cf6', '#f97316', '#ef4444', '#06b6d4',
];

function ConfettiBurst({ active }: { active: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: 52 }, (_, i) => {
      const angle = (i * 137.508) % 360;
      const rad = (angle * Math.PI) / 180;
      const dist = 110 + (i % 5) * 48;
      return {
        id: i,
        x: (i * 1.94) % 100,
        dx: Math.cos(rad) * dist,
        dy: -Math.abs(Math.sin(rad) * dist) - 70,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: i % 3 === 2 ? (6 + (i % 4) * 2) * 2 : 6 + (i % 4) * 2,
        h: 6 + (i % 4) * 2,
        radius: i % 3 === 0 ? '50%' : '3px',
        rotate: angle * 4,
        dur: 1.1 + (i % 5) * 0.13,
        delay: (i % 9) * 0.035,
      };
    }), []
  );

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: '55%',
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            borderRadius: p.radius,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: p.dx,
            y: p.dy,
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0.4],
            rotate: p.rotate,
          }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ─── Macro Input ──────────────────────────────────────────────
function MacroInput({
  emoji,
  label,
  value,
  onChange,
  color,
}: {
  emoji: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-1 px-3 py-2 rounded-xl border bg-white', color)}>
      <span className="text-lg leading-none">{emoji}</span>
      <input
        type="number"
        min="0"
        max="9999"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="w-14 text-center text-sm font-semibold bg-transparent border-none outline-none text-zinc-900 placeholder:text-zinc-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="text-[10px] font-medium text-zinc-500">{label}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function MealsPage() {
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<MealType | null>(null);
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfetti, setConfetti] = useState(false);
  const [history, setHistory] = useState<MealLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Load players on mount
  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then((data) => {
        const list: PlayerOption[] = data.players ?? [];
        setPlayers(list);
        if (list.length === 1) setSelectedPlayerId(list[0].id);
      })
      .catch(() => null);
  }, []);

  const loadHistory = useCallback(async (playerId: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/players/${playerId}/meal-logs?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.logs ?? []);
      }
    } catch { /* non-blocking */ } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPlayerId) loadHistory(selectedPlayerId);
    else setHistory([]);
  }, [selectedPlayerId, loadHistory]);

  // Focus description field when meal type selected
  useEffect(() => {
    if (selectedType) {
      setTimeout(() => descRef.current?.focus(), 350);
    }
  }, [selectedType]);

  const todayEntries = useMemo(
    () => history.filter((e) => isToday(new Date(e.date))),
    [history]
  );

  const mainMealsToday = useMemo(
    () => todayEntries.filter((e) => MAIN_MEAL_IDS.includes(e.mealType)).length,
    [todayEntries]
  );

  const resetForm = () => {
    setDescription('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setNotes('');
  };

  const handleSave = async () => {
    if (!description.trim() || !selectedType || !selectedPlayerId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/players/${selectedPlayerId}/meal-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString(),
          mealType: selectedType,
          description: description.trim(),
          calories: calories ? parseInt(calories) : null,
          protein: protein ? parseFloat(protein) : null,
          carbs: carbs ? parseFloat(carbs) : null,
          fat: fat ? parseFloat(fat) : null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      playSound('save');
      setSaved(true);
      setConfetti(true);
      resetForm();
      setSelectedType(null);
      await loadHistory(selectedPlayerId);
      setTimeout(() => setSaved(false), 3000);
      setTimeout(() => setConfetti(false), 2500);
    } catch { /* non-blocking */ } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!selectedPlayerId) return;
    setDeletingId(logId);
    try {
      await fetch(`/api/players/${selectedPlayerId}/meal-logs/${logId}`, { method: 'DELETE' });
      playSound('delete');
      await loadHistory(selectedPlayerId);
    } catch { /* non-blocking */ } finally {
      setDeletingId(null);
    }
  };

  const getMealConfig = (type: MealType) => MEAL_TYPES.find((m) => m.id === type)!;

  const canSave = !!description.trim() && !!selectedType && !!selectedPlayerId;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto pb-12">
      <ConfettiBurst active={showConfetti} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/dashboard/dream-gym"
          className="inline-flex items-center gap-1.5 font-body text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-4"
        >
          <ChevronLeft size={16} />
          Dream Gym
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-zinc-900">Fuel Station</h1>
            <p className="font-body text-sm text-zinc-500">Track what powers your athlete</p>
          </div>
        </div>
      </motion.div>

      {/* Player selector */}
      {players.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <span className="font-body text-xs text-zinc-500">Logging for:</span>
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors',
                selectedPlayerId === p.id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              )}
            >
              <div className={cn('w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold', getAvatarColor(p.name))}>
                {getInitials(p.name).charAt(0)}
              </div>
              {p.name}
            </button>
          ))}
        </motion.div>
      )}

      {/* No player selected hint */}
      {!selectedPlayerId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 font-body text-sm text-amber-700"
        >
          Select an athlete above to start logging meals
        </motion.div>
      )}

      {/* Today's Fuel Score Banner */}
      <AnimatePresence>
        {selectedPlayerId && todayEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              'rounded-2xl p-4 flex items-center gap-4',
              mainMealsToday >= 3
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                : 'bg-white shadow-sm border border-zinc-100'
            )}
          >
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0',
              mainMealsToday >= 3 ? 'bg-white/20' : 'bg-emerald-50'
            )}>
              {mainMealsToday >= 3 ? '🏆' : '🍽️'}
            </div>
            <div className="flex-1">
              <p className={cn('font-display text-sm font-semibold', mainMealsToday >= 3 ? 'text-white' : 'text-zinc-900')}>
                {mainMealsToday >= 3 ? 'Fully Fueled Today!' : `Today's Fuel`}
              </p>
              <p className={cn('font-body text-xs', mainMealsToday >= 3 ? 'text-white/80' : 'text-zinc-500')}>
                {todayEntries.length} {todayEntries.length === 1 ? 'meal' : 'meals'} logged today
                {mainMealsToday >= 3 ? ' — all 3 main meals done ✓' : ''}
              </p>
            </div>
            {/* Dot indicators for main meals */}
            <div className="flex gap-1.5 shrink-0">
              {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((m) => {
                const logged = todayEntries.some((e) => e.mealType === m);
                const cfg = getMealConfig(m);
                return (
                  <div
                    key={m}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-all',
                      logged ? cfg.dot : mainMealsToday >= 3 ? 'bg-white/30' : 'bg-zinc-200'
                    )}
                    title={cfg.label}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meal Type Grid */}
      <AnimatePresence>
        {selectedPlayerId && !selectedType && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <p className="font-body text-sm font-medium text-zinc-600 mb-3">
              What are you logging?
            </p>
            <div className="grid grid-cols-3 gap-3">
              {MEAL_TYPES.map((meal, i) => {
                const loggedToday = todayEntries.some((e) => e.mealType === meal.id);
                return (
                  <motion.button
                    key={meal.id}
                    onClick={() => setSelectedType(meal.id)}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    className={cn(
                      'relative rounded-2xl p-4 flex flex-col items-center gap-2 overflow-hidden shadow-sm',
                      `bg-gradient-to-br ${meal.gradient}`
                    )}
                  >
                    {/* Logged today badge */}
                    {loggedToday && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-white/90 rounded-full flex items-center justify-center">
                        <Check size={9} className="text-emerald-500 stroke-[3]" />
                      </div>
                    )}
                    {/* Floating emoji */}
                    <motion.span
                      className="text-3xl leading-none"
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 2.4 + i * 0.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.3,
                      }}
                    >
                      {meal.emoji}
                    </motion.span>
                    <span className="font-display text-xs font-semibold text-white drop-shadow-sm">
                      {meal.shortLabel}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Form */}
      <AnimatePresence>
        {selectedType && selectedPlayerId && (
          <motion.div
            key="log-form"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Form header — gradient band matching the meal type */}
            {(() => {
              const cfg = getMealConfig(selectedType);
              return (
                <div className={cn('px-5 py-4 bg-gradient-to-r flex items-center justify-between', cfg.gradient)}>
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="text-2xl"
                      animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1 }}
                    >
                      {cfg.emoji}
                    </motion.span>
                    <span className="font-display text-base font-semibold text-white drop-shadow-sm">
                      {cfg.label}
                    </span>
                  </div>
                  <button
                    onClick={() => { setSelectedType(null); resetForm(); }}
                    className="text-white/80 hover:text-white font-body text-xs underline underline-offset-2 transition-colors"
                  >
                    Change
                  </button>
                </div>
              );
            })()}

            <div className="p-5 space-y-4">
              {/* Description */}
              <div>
                <label className="font-body text-xs font-medium text-zinc-500 mb-1.5 block">
                  What did you eat? <span className="text-red-400">*</span>
                </label>
                <textarea
                  ref={descRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Oatmeal with banana, eggs and toast, grilled chicken salad..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 placeholder:text-zinc-300 resize-none transition-colors"
                />
              </div>

              {/* Macros */}
              <div>
                <p className="font-body text-xs font-medium text-zinc-500 mb-2">
                  Quick macros <span className="text-zinc-400 font-normal">(optional)</span>
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <MacroInput emoji="🔥" label="kcal" value={calories} onChange={setCalories} color="border-orange-100" />
                  <MacroInput emoji="🥩" label="protein" value={protein} onChange={setProtein} color="border-red-100" />
                  <MacroInput emoji="🌾" label="carbs" value={carbs} onChange={setCarbs} color="border-amber-100" />
                  <MacroInput emoji="🥑" label="fat" value={fat} onChange={setFat} color="border-green-100" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-body text-xs font-medium text-zinc-500 mb-1.5 block">
                  Notes <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did you feel? Any context..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 placeholder:text-zinc-300 transition-colors"
                />
              </div>

              {/* Save button */}
              <motion.button
                onClick={handleSave}
                disabled={!canSave || saving}
                whileTap={canSave ? { scale: 0.98 } : {}}
                className={cn(
                  'w-full py-3.5 rounded-full font-display text-sm font-semibold transition-all flex items-center justify-center gap-2',
                  saved
                    ? 'bg-emerald-500 text-white'
                    : canSave
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                    : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                )}
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving…</>
                ) : saved ? (
                  <><Check size={16} className="stroke-[2.5]" /> Logged!</>
                ) : (
                  <><Zap size={15} /> Log This Meal</>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's Timeline */}
      <AnimatePresence>
        {selectedPlayerId && todayEntries.length > 0 && (
          <motion.div
            key="today-timeline"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl shadow-sm p-5"
          >
            <h3 className="font-display text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <span>Today&apos;s Meals</span>
              <span className="bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5 text-xs font-body font-medium">
                {todayEntries.length}
              </span>
            </h3>
            <div className="space-y-3">
              {todayEntries.map((entry, i) => {
                const cfg = getMealConfig(entry.mealType);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-1 shrink-0">
                      <div className={cn('w-3 h-3 rounded-full', cfg.dot)} />
                      {i < todayEntries.length - 1 && (
                        <div className="w-px h-full min-h-[20px] bg-zinc-100 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium font-body', cfg.tagBg, cfg.tagText)}>
                          {cfg.emoji} {cfg.label}
                        </span>
                        <span className="font-body text-[10px] text-zinc-400">
                          {format(new Date(entry.date), 'h:mm a')}
                        </span>
                        {entry.calories && (
                          <span className="font-body text-[10px] text-orange-500 font-medium">
                            🔥 {entry.calories} kcal
                          </span>
                        )}
                      </div>
                      <p className="font-body text-sm text-zinc-700 mt-0.5 truncate">{entry.description}</p>
                      {(entry.protein || entry.carbs || entry.fat) && (
                        <div className="flex gap-2 mt-1">
                          {entry.protein && <span className="font-body text-[10px] text-zinc-400">🥩 {entry.protein}g</span>}
                          {entry.carbs && <span className="font-body text-[10px] text-zinc-400">🌾 {entry.carbs}g</span>}
                          {entry.fat && <span className="font-body text-[10px] text-zinc-400">🥑 {entry.fat}g</span>}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="shrink-0 p-1.5 rounded-lg text-zinc-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      {deletingId === entry.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />
                      }
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {selectedPlayerId && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-sm p-5"
        >
          <h3 className="font-display text-sm font-semibold text-zinc-900 mb-4">Past Meals</h3>

          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-11 rounded-xl bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="font-body text-sm text-zinc-400 text-center py-6">
              No meals logged yet — fuel up!
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => {
                const cfg = getMealConfig(entry.mealType);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-50 group"
                  >
                    <span className="text-base shrink-0">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('font-body text-[10px] font-medium', cfg.tagText)}>
                          {cfg.label}
                        </span>
                        <span className="font-body text-[10px] text-zinc-400">·</span>
                        <span className="font-body text-xs text-zinc-600 truncate">
                          {entry.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-body text-[10px] text-zinc-400">
                          {format(new Date(entry.date), 'MMM d, yyyy')}
                        </span>
                        {entry.calories && (
                          <span className="font-body text-[10px] text-zinc-400">
                            · 🔥 {entry.calories} kcal
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="shrink-0 p-1.5 rounded-lg text-zinc-200 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {deletingId === entry.id
                        ? <Loader2 size={12} className="animate-spin text-zinc-400" />
                        : <Trash2 size={12} />
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
