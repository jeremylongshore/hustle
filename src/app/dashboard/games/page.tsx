'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  Trophy,
  TrendingUp,
  Target,
  Filter,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ResultBadge } from '@/components/ui/result-badge';
import { StatCard } from '@/components/ui/stat-card';
import { staggerContainer, staggerItem } from '@/lib/animation';
import { cn } from '@/lib/utils';

interface PlayerData {
  id: string;
  name: string;
}

interface GameData {
  id: string;
  date: string;
  opponent: string;
  result: 'Win' | 'Loss' | 'Draw';
  finalScore?: string;
  goals: number;
  assists: number;
  minutesPlayed: number;
  verified?: boolean;
  verifications?: { id: string; signerRole: 'parent' | 'coach'; signerName: string }[];
  player?: { name: string; position: string };
}

function verifiedLabel(v: NonNullable<GameData['verifications']>): string {
  return v.map((s) => `${s.signerName} (${s.signerRole === 'coach' ? 'Coach' : 'Parent'})`).join(' · ');
}

type FilterResult = 'all' | 'Win' | 'Loss' | 'Draw';
type FilterAthlete = 'all' | string;

export default function GamesPage() {
  const [resultFilter, setResultFilter] = useState<FilterResult>('all');
  const [athleteFilter, setAthleteFilter] = useState<FilterAthlete>('all');
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [allGames, setAllGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const pRes = await fetch('/api/players');
        const pData = pRes.ok ? await pRes.json() : { players: [] };
        const fetchedPlayers: PlayerData[] = pData.players ?? [];
        setPlayers(fetchedPlayers);

        const gamesPromises = fetchedPlayers.map(async (p) => {
          const res = await fetch(`/api/games?playerId=${p.id}`);
          if (!res.ok) return [];
          const data = await res.json();
          return ((data.games ?? []) as GameData[]).map((g) => ({
            ...g,
            _playerId: p.id,
            _playerName: p.name,
          }));
        });
        const gamesArrays = await Promise.all(gamesPromises);
        setAllGames(gamesArrays.flat());
      } catch (err) {
        console.error('Failed to load games:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = allGames.filter((g) => {
    if (resultFilter !== 'all' && g.result !== resultFilter) return false;
    if (athleteFilter !== 'all' && g.player?.name !== athleteFilter) return false;
    return true;
  });

  const wins = allGames.filter((g) => g.result === 'Win').length;
  const losses = allGames.filter((g) => g.result === 'Loss').length;
  const draws = allGames.filter((g) => g.result === 'Draw').length;
  const totalGoals = allGames.reduce((s, g) => s + g.goals, 0);
  const winRate = allGames.length > 0 ? Math.round((wins / allGames.length) * 100) : 0;

  const sortedGames = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-2xl font-semibold text-zinc-900">Games</h2>
          <p className="font-body text-sm text-zinc-500 mt-0.5">
            {allGames.length} game{allGames.length !== 1 ? 's' : ''} across {players.length} athlete{players.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/log-game">
          <motion.span
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 bg-zinc-900 text-white font-display font-semibold text-sm px-4 py-2.5 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <Plus size={16} />
            Log Game
          </motion.span>
        </Link>
      </motion.div>

      {/* Summary stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Games"
          value={allGames.length}
          icon={<Trophy size={18} />}
          accent
        />
        <StatCard
          label="Win Rate"
          value={allGames.length > 0 ? `${winRate}%` : '—'}
          trend={wins > 0 ? { value: wins, direction: 'up', suffix: 'wins' } : undefined}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Total Goals"
          value={totalGoals}
          icon={<Target size={18} />}
        />
        <StatCard
          label="W / D / L"
          value={allGames.length > 0 ? `${wins}–${draws}–${losses}` : '—'}
        />
      </motion.div>

      {/* Filters */}
      {allGames.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-zinc-400" />
            <span className="font-body text-sm text-zinc-500">Filter:</span>
          </div>

          {/* Result filter */}
          <div className="flex items-center gap-1.5">
            {(['all', 'Win', 'Loss', 'Draw'] as FilterResult[]).map((r) => (
              <button
                key={r}
                onClick={() => setResultFilter(r)}
                className={cn(
                  'px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors',
                  resultFilter === r
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100'
                )}
              >
                {r === 'all' ? 'All' : r + 's'}
              </button>
            ))}
          </div>

          {/* Athlete filter */}
          <div className="relative">
            <select
              value={athleteFilter}
              onChange={(e) => setAthleteFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-zinc-200 rounded-full font-body text-xs font-medium text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option value="all">All Athletes</option>
              {players.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
          </div>

          {(resultFilter !== 'all' || athleteFilter !== 'all') && (
            <button
              onClick={() => { setResultFilter('all'); setAthleteFilter('all'); }}
              className="font-body text-xs text-amber-600 hover:text-amber-700 transition-colors"
            >
              Clear filters
            </button>
          )}
        </motion.div>
      )}

      {/* Games table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Table header */}
        {sortedGames.length > 0 && (
          <div className="hidden sm:grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-zinc-100 bg-zinc-50/60">
            {['Date', 'Opponent', 'Athlete', 'Score', 'Stats', 'Result'].map((h) => (
              <span key={h} className="font-body text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {h}
              </span>
            ))}
          </div>
        )}

        {sortedGames.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">⚽</div>
            <p className="font-display text-base font-semibold text-zinc-900 mb-1">
              No games found
            </p>
            <p className="font-body text-sm text-zinc-500">
              {resultFilter !== 'all' || athleteFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Log your first game to get started.'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {sortedGames.map((game) => {
              const scoreparts = game.finalScore?.split('-') ?? [];
              const homeScore = scoreparts[0] ?? '0';
              const awayScore = scoreparts[1] ?? '0';

              return (
                <motion.div
                  key={game.id}
                  variants={staggerItem}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_1.5fr_1fr_1fr_1fr] gap-3 sm:gap-4 px-5 py-4 border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60 transition-colors"
                >
                  {/* Date */}
                  <div>
                    <p className="font-body text-sm font-medium text-zinc-800">
                      {format(new Date(game.date), 'MMM d, yyyy')}
                    </p>
                    <p className="font-body text-xs text-zinc-400 sm:hidden">
                      vs {game.opponent}
                    </p>
                  </div>

                  {/* Opponent */}
                  <p className="hidden sm:block font-body text-sm text-zinc-800">
                    vs {game.opponent}
                  </p>

                  {/* Athlete */}
                  <p className="font-body text-sm text-zinc-600 sm:block">
                    <span className="sm:hidden font-medium">Athlete: </span>
                    {game.player?.name ?? ''}
                  </p>

                  {/* Score */}
                  <p className="font-display text-sm font-semibold text-zinc-900">
                    <span className="sm:hidden text-zinc-400 font-body font-normal">Score: </span>
                    {homeScore}–{awayScore}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-2 text-xs font-body text-zinc-500">
                    <span>
                      <strong className="text-zinc-700">{game.goals}</strong>G
                    </span>
                    <span>
                      <strong className="text-zinc-700">{game.assists}</strong>A
                    </span>
                    <span>
                      <strong className="text-zinc-700">{game.minutesPlayed}</strong>′
                    </span>
                  </div>

                  {/* Result */}
                  <div className="flex items-center gap-2">
                    <ResultBadge result={game.result} size="sm" />
                    {game.verified === false && (
                      <span className="hidden sm:block font-body text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">
                        unverified
                      </span>
                    )}
                    {game.verifications && game.verifications.length > 0 && (
                      <span
                        className="hidden sm:block font-body text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full"
                        title={`Verified by ${verifiedLabel(game.verifications)}`}
                      >
                        Verified by {verifiedLabel(game.verifications)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Count */}
      {sortedGames.length > 0 && sortedGames.length !== allGames.length && (
        <p className="font-body text-xs text-zinc-400 text-center">
          Showing {sortedGames.length} of {allGames.length} games
        </p>
      )}
    </div>
  );
}
