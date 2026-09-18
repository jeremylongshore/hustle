'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Shield, Goal, Users } from 'lucide-react';
import type { SoccerPositionCode } from '@/types/domain';

interface GameWithPlayer {
  id: string;
  goals: number;
  assists: number;
  minutesPlayed: number;
  result: 'Win' | 'Loss' | 'Draw';
  tackles?: number | null;
  interceptions?: number | null;
  saves?: number | null;
  cleanSheet?: boolean | null;
  player: {
    id: string;
    name: string;
    position: string;
  };
}

interface PositionAnalysisProps {
  games: GameWithPlayer[];
}

// Position category mapping
const POSITION_CATEGORIES: Record<string, { label: string; positions: string[]; icon: typeof Target }> = {
  attack: {
    label: 'Attack',
    positions: ['ST', 'CF', 'RW', 'LW', 'AM'],
    icon: Target,
  },
  midfield: {
    label: 'Midfield',
    positions: ['CM', 'DM', 'AM', 'RW', 'LW'],
    icon: Users,
  },
  defense: {
    label: 'Defense',
    positions: ['CB', 'RB', 'LB', 'RWB', 'LWB', 'DM'],
    icon: Shield,
  },
  goalkeeper: {
    label: 'Goalkeeper',
    positions: ['GK'],
    icon: Goal,
  },
};

// Full position names
const POSITION_NAMES: Record<string, string> = {
  GK: 'Goalkeeper',
  CB: 'Center Back',
  RB: 'Right Back',
  LB: 'Left Back',
  RWB: 'Right Wing Back',
  LWB: 'Left Wing Back',
  DM: 'Defensive Midfielder',
  CM: 'Central Midfielder',
  AM: 'Attacking Midfielder',
  RW: 'Right Winger',
  LW: 'Left Winger',
  ST: 'Striker',
  CF: 'Center Forward',
};

function getPositionCategory(position: string): string {
  if (position === 'GK') return 'goalkeeper';
  if (['ST', 'CF'].includes(position)) return 'attack';
  if (['CB', 'RB', 'LB', 'RWB', 'LWB'].includes(position)) return 'defense';
  return 'midfield';
}

export function PositionAnalysis({ games }: PositionAnalysisProps) {
  if (games.length === 0) {
    return (
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="text-lg">Position Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-12 w-12 text-zinc-300 mb-4" />
            <p className="text-sm text-zinc-500">
              Log games to see position-specific stats
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group games by player position
  const positionStats: Record<
    string,
    {
      games: number;
      goals: number;
      assists: number;
      wins: number;
      minutes: number;
      tackles: number;
      interceptions: number;
      saves: number;
      cleanSheets: number;
    }
  > = {};

  games.forEach((game) => {
    const position = game.player.position;
    if (!positionStats[position]) {
      positionStats[position] = {
        games: 0,
        goals: 0,
        assists: 0,
        wins: 0,
        minutes: 0,
        tackles: 0,
        interceptions: 0,
        saves: 0,
        cleanSheets: 0,
      };
    }

    positionStats[position].games++;
    positionStats[position].goals += game.goals;
    positionStats[position].assists += game.assists;
    positionStats[position].minutes += game.minutesPlayed;
    if (game.result === 'Win') positionStats[position].wins++;
    if (game.tackles) positionStats[position].tackles += game.tackles;
    if (game.interceptions) positionStats[position].interceptions += game.interceptions;
    if (game.saves) positionStats[position].saves += game.saves;
    if (game.cleanSheet) positionStats[position].cleanSheets++;
  });

  // Sort positions by number of games
  const sortedPositions = Object.entries(positionStats).sort(
    ([, a], [, b]) => b.games - a.games
  );

  // Find the primary position (most games)
  const [primaryPosition, primaryStats] = sortedPositions[0] || ['', null];
  const category = primaryPosition ? getPositionCategory(primaryPosition) : 'midfield';
  const categoryInfo = POSITION_CATEGORIES[category];

  return (
    <Card className="border-zinc-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Position Analysis</CardTitle>
          {primaryPosition && (
            <span className="text-xs font-medium px-2 py-1 bg-zinc-100 text-zinc-700 rounded-full">
              Primary: {primaryPosition}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Position breakdown */}
        <div className="space-y-3 mb-6">
          {sortedPositions.map(([position, stats]) => {
            const posCategory = getPositionCategory(position);
            const winRate = stats.games > 0 ? ((stats.wins / stats.games) * 100).toFixed(0) : '0';
            const goalsPerGame = stats.games > 0 ? (stats.goals / stats.games).toFixed(1) : '0';
            const assistsPerGame = stats.games > 0 ? (stats.assists / stats.games).toFixed(1) : '0';

            // Bar width based on game proportion
            const maxGames = sortedPositions[0][1].games;
            const barWidth = (stats.games / maxGames) * 100;

            return (
              <div key={position} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900">
                      {POSITION_NAMES[position] || position}
                    </span>
                    <span className="text-xs text-zinc-500">({position})</span>
                  </div>
                  <span className="text-xs text-zinc-600">{stats.games} games</span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      posCategory === 'attack'
                        ? 'bg-red-500'
                        : posCategory === 'midfield'
                        ? 'bg-blue-500'
                        : posCategory === 'defense'
                        ? 'bg-green-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                {/* Position-specific stats */}
                <div className="flex gap-4 text-xs text-zinc-600">
                  <span>{winRate}% win rate</span>
                  {posCategory === 'goalkeeper' ? (
                    <>
                      <span>{stats.saves} saves</span>
                      <span>{stats.cleanSheets} clean sheets</span>
                    </>
                  ) : posCategory === 'defense' ? (
                    <>
                      <span>{stats.tackles} tackles</span>
                      <span>{stats.interceptions} interceptions</span>
                    </>
                  ) : (
                    <>
                      <span>{goalsPerGame} goals/game</span>
                      <span>{assistsPerGame} assists/game</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Category Legend */}
        <div className="pt-4 border-t border-zinc-200">
          <p className="text-xs text-zinc-500 mb-2">Position Categories</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-zinc-600">Attack</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-zinc-600">Midfield</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-zinc-600">Defense</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-500 rounded" />
              <span className="text-zinc-600">Goalkeeper</span>
            </div>
          </div>
        </div>

        {/* Primary Position Insight */}
        {primaryStats && primaryStats.games >= 3 && (
          <div className="mt-4 p-3 bg-zinc-50 rounded-lg">
            <p className="text-xs text-zinc-700">
              <span className="font-medium">Insight:</span> Most games played as{' '}
              <span className="font-medium">{POSITION_NAMES[primaryPosition] || primaryPosition}</span>
              {' '}with a {((primaryStats.wins / primaryStats.games) * 100).toFixed(0)}% win rate
              {primaryStats.goals > 0 && ` and ${primaryStats.goals} goals`}
              {primaryStats.assists > 0 && `, ${primaryStats.assists} assists`}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
