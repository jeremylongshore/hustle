/**
 * Query-layer ownership guard.
 *
 * Every athlete-scoped query function calls assertPlayerOwnedBy() before it
 * reads or writes, so ownership is enforced where the data is touched rather
 * than only in each route handler. Before this, most query functions took a
 * userId argument and ignored it, and a single route that forgot its
 * getPlayerAdmin() check became a cross-family data read (the debug routes
 * removed in #62 were exactly that).
 */

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema/players";

export class PlayerAccessError extends Error {
  readonly code = "PLAYER_NOT_OWNED";

  constructor() {
    // Deliberately says nothing about whether the player exists.
    super("Player not found for this account");
    this.name = "PlayerAccessError";
  }
}

/** Throws PlayerAccessError unless `playerId` belongs to `userId`. */
export async function assertPlayerOwnedBy(userId: string, playerId: string): Promise<void> {
  if (!userId || !playerId) throw new PlayerAccessError();
  const row = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.id, playerId), eq(players.userId, userId)))
    .get();
  if (!row) throw new PlayerAccessError();
}

/** Throws PlayerAccessError unless every id in `playerIds` belongs to `userId`. */
export async function assertPlayersOwnedBy(userId: string, playerIds: readonly string[]): Promise<void> {
  const unique = [...new Set(playerIds)];
  if (unique.length === 0) return;
  if (!userId) throw new PlayerAccessError();
  const rows = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.userId, userId), inArray(players.id, unique)))
    .all();
  if (rows.length !== unique.length) throw new PlayerAccessError();
}

export function isPlayerAccessError(error: unknown): error is PlayerAccessError {
  return error instanceof PlayerAccessError;
}
