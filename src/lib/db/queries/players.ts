/**
 * Players Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/players.ts.
 *
 * Public surface preserved 1:1 so API routes that import `*PlayerAdmin`
 * symbols continue working without per-call edits.
 */

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema/players";
import type {
  Player,
  PlayerGender,
  SoccerPositionCode,
} from "@/types/domain";
import type { LeagueCode } from "@/types/league";

type PlayerRow = typeof players.$inferSelect;

function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    birthday: row.birthday,
    gender: row.gender,
    primaryPosition: row.primaryPosition,
    secondaryPositions: row.secondaryPositions ?? undefined,
    positionNote: row.positionNote ?? undefined,
    position: row.position ?? undefined,
    leagueCode: row.leagueCode,
    leagueOtherName: row.leagueOtherName ?? undefined,
    teamClub: row.teamClub,
    photoUrl: row.photoUrl ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getPlayersAdmin(userId: string): Promise<Player[]> {
  const rows = await db
    .select()
    .from(players)
    .where(eq(players.userId, userId))
    .orderBy(asc(players.name));
  return rows.map(toPlayer);
}

export async function getPlayerAdmin(
  userId: string,
  playerId: string
): Promise<Player | null> {
  const row = await db.query.players.findFirst({
    where: and(eq(players.id, playerId), eq(players.userId, userId)),
  });
  return row ? toPlayer(row) : null;
}

export async function getPlayersCountAdmin(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(players)
    .where(eq(players.userId, userId));
  return Number(result[0]?.count ?? 0);
}

export async function createPlayerAdmin(
  userId: string,
  data: {
    workspaceId: string;
    name: string;
    birthday: Date;
    gender: PlayerGender;
    primaryPosition: SoccerPositionCode;
    secondaryPositions?: SoccerPositionCode[];
    positionNote?: string | null;
    leagueCode: LeagueCode;
    leagueOtherName?: string | null;
    teamClub: string;
    photoUrl?: string | null;
  }
): Promise<Player> {
  const now = new Date();
  const inserted = await db
    .insert(players)
    .values({
      id: crypto.randomUUID(),
      userId,
      workspaceId: data.workspaceId,
      name: data.name,
      birthday: data.birthday,
      gender: data.gender,
      primaryPosition: data.primaryPosition,
      // Legacy field — preserve backward-compat mapping from old service.
      position: data.primaryPosition,
      secondaryPositions: data.secondaryPositions ?? [],
      positionNote: data.positionNote ?? null,
      leagueCode: data.leagueCode,
      leagueOtherName: data.leagueOtherName ?? null,
      teamClub: data.teamClub,
      photoUrl: data.photoUrl ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return toPlayer(inserted[0]);
}

export async function updatePlayerAdmin(
  userId: string,
  playerId: string,
  data: Partial<{
    name: string;
    birthday: Date;
    gender: PlayerGender;
    primaryPosition: SoccerPositionCode;
    position: SoccerPositionCode;
    secondaryPositions: SoccerPositionCode[];
    positionNote: string | null;
    leagueCode: LeagueCode;
    leagueOtherName: string | null;
    teamClub: string;
    photoUrl: string | null;
  }>
): Promise<void> {
  const patch: Partial<typeof players.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) patch.name = data.name;
  if (data.birthday !== undefined) patch.birthday = data.birthday;
  if (data.gender !== undefined) patch.gender = data.gender;
  if (data.primaryPosition !== undefined) patch.primaryPosition = data.primaryPosition;
  if (data.position !== undefined) patch.position = data.position;
  if (data.secondaryPositions !== undefined) patch.secondaryPositions = data.secondaryPositions;
  if (data.positionNote !== undefined) patch.positionNote = data.positionNote;
  if (data.leagueCode !== undefined) patch.leagueCode = data.leagueCode;
  if (data.leagueOtherName !== undefined) patch.leagueOtherName = data.leagueOtherName;
  if (data.teamClub !== undefined) patch.teamClub = data.teamClub;
  if (data.photoUrl !== undefined) patch.photoUrl = data.photoUrl;

  await db
    .update(players)
    .set(patch)
    .where(and(eq(players.id, playerId), eq(players.userId, userId)));
}

export async function deletePlayerAdmin(
  userId: string,
  playerId: string
): Promise<void> {
  await db
    .delete(players)
    .where(and(eq(players.id, playerId), eq(players.userId, userId)));
}
