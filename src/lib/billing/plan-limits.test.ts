/**
 * Plan Limits Utility Tests
 *
 * Tests for evaluatePlanLimits, getLimitStateColor, and helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  evaluatePlanLimits,
  getLimitStateColor,
  formatLimit,
  getLimitWarningMessage,
  type PlanLimits,
} from '@/lib/billing/plan-limits';
import type { Workspace } from '@/types/domain';
import { getPlanLimits } from '@/lib/stripe/plan-mapping';

/**
 * Helper to create a mock workspace
 */
function createMockWorkspace(
  plan: 'free' | 'starter' | 'plus' | 'pro',
  playerCount: number,
  gamesThisMonth: number
): Workspace {
  return {
    id: 'test-workspace',
    ownerUserId: 'test-user',
    name: 'Test Workspace',
    plan,
    status: 'active',
    billing: {
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    },
    members: [],
    usage: {
      playerCount,
      gamesThisMonth,
      storageUsedMB: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

describe('evaluatePlanLimits', () => {
  describe('Free Plan', () => {
    it('should return ok state when under 70% of limits', () => {
      const workspace = createMockWorkspace('free', 1, 6); // 1/2 players (50%), 6/10 games (60%)
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('ok');
      expect(limits.games.state).toBe('ok');
      expect(limits.player.limit).toBe(2);
      expect(limits.games.limit).toBe(10);
    });

    it('should return warning state when at 70% of limit', () => {
      const workspace = createMockWorkspace('free', 1, 8); // 1/2 players (50%), 8/10 games (80%)
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('ok');
      expect(limits.games.state).toBe('warning');
    });

    it('should return critical state when at or above 100% of limit', () => {
      const workspace = createMockWorkspace('free', 2, 10); // 2/2 players, 10/10 games
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('critical');
      expect(limits.games.state).toBe('critical');
    });

    it('should return critical state when over limit', () => {
      const workspace = createMockWorkspace('free', 3, 12); // 3/2 players, 12/10 games
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('critical');
      expect(limits.games.state).toBe('critical');
    });
  });

  describe('Starter Plan', () => {
    it('should use correct limits (5 players, 50 games)', () => {
      const workspace = createMockWorkspace('starter', 2, 25);
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.limit).toBe(5);
      expect(limits.games.limit).toBe(50);
      expect(limits.player.state).toBe('ok'); // 2/5 = 40%
      expect(limits.games.state).toBe('ok'); // 25/50 = 50%
    });

    it('should return warning at 70% threshold', () => {
      const workspace = createMockWorkspace('starter', 4, 35); // 4/5 = 80%, 35/50 = 70%
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('warning');
      expect(limits.games.state).toBe('warning');
    });
  });

  describe('Plus Plan', () => {
    it('should use correct limits (15 players, 200 games)', () => {
      const workspace = createMockWorkspace('plus', 8, 100);
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.limit).toBe(15);
      expect(limits.games.limit).toBe(200);
      expect(limits.player.state).toBe('ok'); // 8/15 = 53%
      expect(limits.games.state).toBe('ok'); // 100/200 = 50%
    });

    it('should return warning between 70-99%', () => {
      const workspace = createMockWorkspace('plus', 12, 150); // 12/15 = 80%, 150/200 = 75%
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('warning');
      expect(limits.games.state).toBe('warning');
    });

    it('should return critical at 100%', () => {
      const workspace = createMockWorkspace('plus', 15, 200);
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('critical');
      expect(limits.games.state).toBe('critical');
    });
  });

  describe('Pro Plan', () => {
    it('should return ok state for high usage (effectively unlimited)', () => {
      const workspace = createMockWorkspace('pro', 100, 1000);
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('ok'); // 100/9999 = 1%
      expect(limits.games.state).toBe('ok'); // 1000/9999 = 10%
      expect(limits.player.limit).toBe(9999);
      expect(limits.games.limit).toBe(9999);
    });

    it('should return ok even with zero usage', () => {
      const workspace = createMockWorkspace('pro', 0, 0);
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('ok');
      expect(limits.games.state).toBe('ok');
    });

    it('should require extreme usage to reach warning state', () => {
      const workspace = createMockWorkspace('pro', 7000, 7000); // 70% of 9999
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('warning');
      expect(limits.games.state).toBe('warning');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing usage data', () => {
      const workspace = createMockWorkspace('free', 0, 0);
      workspace.usage = {} as any; // Empty usage object
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.used).toBe(0);
      expect(limits.games.used).toBe(0);
      expect(limits.player.state).toBe('ok');
      expect(limits.games.state).toBe('ok');
    });

    it('should handle invalid plan (defaults to free)', () => {
      const workspace = createMockWorkspace('free', 0, 0);
      workspace.plan = 'invalid' as any;
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.limit).toBe(2);
      expect(limits.games.limit).toBe(10);
    });

    it('should handle exact 70% threshold (should be warning)', () => {
      const workspace = createMockWorkspace('plus', 11, 140); // 11/15 = 73%, 140/200 = 70%
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('warning');
      expect(limits.games.state).toBe('warning');
    });

    it('should handle 69% threshold (should be ok)', () => {
      const workspace = createMockWorkspace('plus', 10, 138); // 10/15 = 67%, 138/200 = 69%
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('ok');
      expect(limits.games.state).toBe('ok');
    });

    it('should handle 99% threshold (should be warning)', () => {
      const workspace = createMockWorkspace('plus', 14, 198); // 14/15 = 93%, 198/200 = 99%
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('warning');
      expect(limits.games.state).toBe('warning');
    });
  });
});

describe('getLimitStateColor', () => {
  it('should return green for ok state', () => {
    expect(getLimitStateColor('ok')).toBe('green');
  });

  it('should return yellow for warning state', () => {
    expect(getLimitStateColor('warning')).toBe('yellow');
  });

  it('should return red for critical state', () => {
    expect(getLimitStateColor('critical')).toBe('red');
  });

  it('should default to green for invalid state', () => {
    expect(getLimitStateColor('invalid' as any)).toBe('green');
  });
});

describe('formatLimit', () => {
  it('should return infinity symbol for Infinity', () => {
    expect(formatLimit(Infinity)).toBe('∞');
  });

  it('should return string number for finite values', () => {
    expect(formatLimit(1)).toBe('1');
    expect(formatLimit(10)).toBe('10');
    expect(formatLimit(200)).toBe('200');
  });

  it('should handle zero', () => {
    expect(formatLimit(0)).toBe('0');
  });
});

describe('getLimitWarningMessage', () => {
  describe('Player Warnings', () => {
    it('should return null for ok state', () => {
      expect(getLimitWarningMessage('player', 'ok')).toBeNull();
    });

    it('should return warning message for warning state', () => {
      const message = getLimitWarningMessage('player', 'warning');
      expect(message).toBe('You are approaching your player limit.');
    });

    it('should return critical message for critical state', () => {
      const message = getLimitWarningMessage('player', 'critical');
      expect(message).toBe('Player limit reached. Upgrade your plan to continue adding athletes.');
    });
  });

  describe('Games Warnings', () => {
    it('should return null for ok state', () => {
      expect(getLimitWarningMessage('games', 'ok')).toBeNull();
    });

    it('should return warning message for warning state', () => {
      const message = getLimitWarningMessage('games', 'warning');
      expect(message).toBe('You are nearing your monthly games limit.');
    });

    it('should return critical message for critical state', () => {
      const message = getLimitWarningMessage('games', 'critical');
      expect(message).toBe('Monthly games limit reached. Upgrade your plan to continue adding games.');
    });
  });
});

describe('State Thresholds (Integration)', () => {
  it('should correctly categorize all plans at key percentages', () => {
    type TestPlan = 'free' | 'starter' | 'plus' | 'pro';
    const testCases: Array<{ plan: TestPlan, players: number, games: number, expectedPlayer: string, expectedGames: string }> = [
      { plan: 'free', players: 1, games: 6, expectedPlayer: 'ok', expectedGames: 'ok' }, // 50%, 60%
      { plan: 'free', players: 2, games: 8, expectedPlayer: 'critical', expectedGames: 'warning' }, // 100%, 80%
      { plan: 'starter', players: 3, games: 35, expectedPlayer: 'ok', expectedGames: 'warning' }, // 60%, 70%
      { plan: 'plus', players: 11, games: 140, expectedPlayer: 'warning', expectedGames: 'warning' }, // 73%, 70%
      { plan: 'plus', players: 15, games: 200, expectedPlayer: 'critical', expectedGames: 'critical' }, // 100%, 100%
      { plan: 'pro', players: 100, games: 1000, expectedPlayer: 'ok', expectedGames: 'ok' }, // ~1%, ~10% (effectively unlimited)
    ];

    testCases.forEach(({ plan, players, games, expectedPlayer, expectedGames }) => {
      const workspace = createMockWorkspace(plan, players, games);
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe(expectedPlayer);
      expect(limits.games.state).toBe(expectedGames);
    });
  });
});

describe('single source of truth with enforcement', () => {
  it.each(['free', 'starter', 'plus', 'pro'] as const)(
    'reports the same %s limits that the write routes enforce',
    (plan) => {
      const enforced = getPlanLimits(plan);
      const shown = evaluatePlanLimits(createMockWorkspace(plan, 0, 0));
      expect(shown.player.limit).toBe(enforced.maxPlayers);
      expect(shown.games.limit).toBe(enforced.maxGamesPerMonth);
    }
  );
});
