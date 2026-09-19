/**
 * Games Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/games.ts.
 *
 * Phase 4: games are no longer nested under players; the games table stores
 * playerId as a FK. The legacy `getAllGamesAdmin` aggregation across all
 * players for a user becomes a single join.
 */

import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { games } from "@/lib/db/schema/games";
import { players } from "@/lib/db/schema/players";
import type { Game, GameDocument } from "@/types/domain";
import { isE2ETestMode } from "@/lib/e2e";
import { assertPlayerOwnedBy } from "@/lib/db/queries/ownership";

type GameRow = typeof games.$inferSelect;

function toGame(row: GameRow): Game {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    date: row.date,
    opponent: row.opponent,
    result: row.result,
    finalScore: row.finalScore,
    minutesPlayed: row.minutesPlayed,
    gameName: row.gameName,
    gameLocation: row.gameLocation,
    gameLeagueCode: row.gameLeagueCode,
    gameLeagueOtherName: row.gameLeagueOtherName,
    performanceRating: row.performanceRating,
    emotionTags: row.emotionTags,
    goals: row.goals,
    assists: row.assists,
    tackles: row.tackles,
    interceptions: row.interceptions,
    clearances: row.clearances,
    blocks: row.blocks,
    aerialDuelsWon: row.aerialDuelsWon,
    saves: row.saves,
    goalsAgainst: row.goalsAgainst,
    cleanSheet: row.cleanSheet,
    verified: row.verified,
    verifiedAt: row.verifiedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as unknown as Game;
}

async function userPlayerIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.userId, userId));
  return rows.map((r) => r.id);
}

export async function getVerifiedGamesCountAdmin(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(games)
    .innerJoin(players, eq(games.playerId, players.id))
    .where(and(eq(players.userId, userId), eq(games.verified, true)));
  return Number(result[0]?.count ?? 0);
}

export async function getUnverifiedGamesCountAdmin(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(games)
    .innerJoin(players, eq(games.playerId, players.id))
    .where(and(eq(players.userId, userId), eq(games.verified, false)));
  return Number(result[0]?.count ?? 0);
}

export async function getSeasonGamesCountAdmin(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(games)
    .innerJoin(players, eq(games.playerId, players.id))
    .where(
      and(
        eq(players.userId, userId),
        eq(games.verified, true),
        gte(games.date, startDate),
        lte(games.date, endDate)
      )
    );
  return Number(result[0]?.count ?? 0);
}

export async function getFirstPendingGameAdmin(
  userId: string
): Promise<{ playerId: string } | null> {
  const rows = await db
    .select({ playerId: games.playerId, date: games.date })
    .from(games)
    .innerJoin(players, eq(games.playerId, players.id))
    .where(and(eq(players.userId, userId), eq(games.verified, false)))
    .orderBy(asc(games.date))
    .limit(1);

  if (rows.length === 0) return null;
  return { playerId: rows[0].playerId };
}

export async function getVerifiedGamesAdmin(
  userId: string,
  playerId: string
): Promise<Game[]> {
  await assertPlayerOwnedBy(userId, playerId);
  // Ownership check: confirm the player belongs to userId before serving games.
  const owner = await db.query.players.findFirst({
    where: and(eq(players.id, playerId), eq(players.userId, userId)),
  });
  if (!owner) return [];

  const rows = await db
    .select()
    .from(games)
    .where(and(eq(games.playerId, playerId), eq(games.verified, true)))
    .orderBy(desc(games.date));
  return rows.map(toGame);
}

export async function getUnverifiedGamesAdmin(
  userId: string,
  playerId: string
): Promise<Game[]> {
  await assertPlayerOwnedBy(userId, playerId);
  const owner = await db.query.players.findFirst({
    where: and(eq(players.id, playerId), eq(players.userId, userId)),
  });
  if (!owner) return [];

  const rows = await db
    .select()
    .from(games)
    .where(and(eq(games.playerId, playerId), eq(games.verified, false)))
    .orderBy(desc(games.date));
  return rows.map(toGame);
}

export async function getAllGamesForPlayerAdmin(
  userId: string,
  playerId: string
): Promise<Game[]> {
  await assertPlayerOwnedBy(userId, playerId);
  const owner = await db.query.players.findFirst({
    where: and(eq(players.id, playerId), eq(players.userId, userId)),
  });
  if (!owner) return [];

  const rows = await db
    .select()
    .from(games)
    .where(eq(games.playerId, playerId))
    .orderBy(desc(games.date));
  return rows.map(toGame);
}

export async function getAllGamesAdmin(
  userId: string
): Promise<
  Array<
    Game & { player: { id: string; name: string; position: string } }
  >
> {
  const rows = await db
    .select({
      game: games,
      playerName: players.name,
      playerPosition: players.position,
    })
    .from(games)
    .innerJoin(players, eq(games.playerId, players.id))
    .where(eq(players.userId, userId))
    .orderBy(desc(games.date));

  return rows.map(({ game, playerName, playerPosition }) => ({
    ...toGame(game),
    player: {
      id: game.playerId,
      name: playerName,
      position: playerPosition ?? "",
    },
  }));
}

export async function createGameAdmin(
  userId: string,
  playerId: string,
  data: {
    workspaceId: string;
    date: Date;
    opponent: string;
    result: "Win" | "Loss" | "Draw";
    finalScore: string;
    minutesPlayed: number;
    goals?: number;
    assists?: number | null;
    tackles?: number | null;
    interceptions?: number | null;
    clearances?: number | null;
    blocks?: number | null;
    aerialDuelsWon?: number | null;
    saves?: number | null;
    goalsAgainst?: number | null;
    cleanSheet?: boolean | null;
  }
): Promise<Game> {
  await assertPlayerOwnedBy(userId, playerId);
  const now = new Date();
  const isE2EMode = isE2ETestMode();

  const inserted = await db
    .insert(games)
    .values({
      id: crypto.randomUUID(),
      playerId,
      workspaceId: data.workspaceId,
      date: data.date,
      opponent: data.opponent,
      result: data.result,
      finalScore: data.finalScore,
      minutesPlayed: data.minutesPlayed,
      goals: data.goals ?? 0,
      assists: data.assists ?? 0,
      tackles: data.tackles ?? null,
      interceptions: data.interceptions ?? null,
      clearances: data.clearances ?? null,
      blocks: data.blocks ?? null,
      aerialDuelsWon: data.aerialDuelsWon ?? null,
      saves: data.saves ?? null,
      goalsAgainst: data.goalsAgainst ?? null,
      cleanSheet: data.cleanSheet ?? null,
      verified: isE2EMode,
      verifiedAt: isE2EMode ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toGame(inserted[0]);
}

export async function getGameAdmin(
  userId: string,
  playerId: string,
  gameId: string
): Promise<Game | null> {
  await assertPlayerOwnedBy(userId, playerId);
  const owner = await db.query.players.findFirst({
    where: and(eq(players.id, playerId), eq(players.userId, userId)),
  });
  if (!owner) return null;

  const row = await db.query.games.findFirst({
    where: and(eq(games.id, gameId), eq(games.playerId, playerId)),
  });
  return row ? toGame(row) : null;
}

export async function verifyGameAdmin(
  userId: string,
  playerId: string,
  gameId: string
): Promise<void> {
  await assertPlayerOwnedBy(userId, playerId);
  const now = new Date();
  await db
    .update(games)
    .set({ verified: true, verifiedAt: now, updatedAt: now })
    .where(and(eq(games.id, gameId), eq(games.playerId, playerId)));
}

// Suppress unused-imports lints
void userPlayerIds;
void asc;
export type { GameDocument };
