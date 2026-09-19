/**
 * Cardio Logs Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/cardio-logs.ts.
 */

import { and, desc, eq, gte, lte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { cardioLogs } from "@/lib/db/schema/cardio-logs";
import type {
  CardioLog,
  CardioActivityType,
} from "@/types/domain";
import type {
  CardioLogCreateInput,
  CardioLogUpdateInput,
} from "@/lib/validations/cardio-log-schema";
import { calculatePace } from "@/lib/validations/cardio-log-schema";
import { assertPlayerOwnedBy } from "@/lib/db/queries/ownership";

type CardioLogRow = typeof cardioLogs.$inferSelect;

function toCardioLog(row: CardioLogRow): CardioLog {
  return {
    id: row.id,
    playerId: row.playerId,
    date: row.date,
    activityType: row.activityType,
    distanceMiles: row.distanceMiles,
    durationMinutes: row.durationMinutes,
    avgPacePerMile: row.avgPacePerMile,
    calories: row.calories,
    avgHeartRate: row.avgHeartRate,
    maxHeartRate: row.maxHeartRate,
    location: row.location,
    weather: row.weather,
    notes: row.notes,
    perceivedEffort: row.perceivedEffort as 1 | 2 | 3 | 4 | 5 | null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createCardioLogAdmin(
  userId: string,
  playerId: string,
  data: CardioLogCreateInput
): Promise<CardioLog> {
  await assertPlayerOwnedBy(userId, playerId);
  const now = new Date();
  const avgPacePerMile =
    data.avgPacePerMile ?? calculatePace(data.distanceMiles, data.durationMinutes);

  const inserted = await db
    .insert(cardioLogs)
    .values({
      id: crypto.randomUUID(),
      playerId,
      date: new Date(data.date),
      activityType: data.activityType as CardioActivityType,
      distanceMiles: data.distanceMiles,
      durationMinutes: data.durationMinutes,
      avgPacePerMile,
      calories: data.calories ?? null,
      avgHeartRate: data.avgHeartRate ?? null,
      maxHeartRate: data.maxHeartRate ?? null,
      location: data.location ?? null,
      weather: data.weather ?? null,
      notes: data.notes ?? null,
      perceivedEffort: data.perceivedEffort ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toCardioLog(inserted[0]);
}

export async function getCardioLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<CardioLog | null> {
  await assertPlayerOwnedBy(userId, playerId);
  const row = await db.query.cardioLogs.findFirst({
    where: and(eq(cardioLogs.id, logId), eq(cardioLogs.playerId, playerId)),
  });
  return row ? toCardioLog(row) : null;
}

export async function getCardioLogsAdmin(
  userId: string,
  playerId: string,
  options?: {
    activityType?: CardioActivityType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ logs: CardioLog[]; nextCursor: string | null }> {
  await assertPlayerOwnedBy(userId, playerId);
  const limit = options?.limit ?? 20;
  const conditions = [eq(cardioLogs.playerId, playerId)];
  if (options?.activityType) conditions.push(eq(cardioLogs.activityType, options.activityType));
  if (options?.startDate) conditions.push(gte(cardioLogs.date, options.startDate));
  if (options?.endDate) conditions.push(lte(cardioLogs.date, options.endDate));

  if (options?.cursor) {
    const cursorRow = await db.query.cardioLogs.findFirst({
      where: eq(cardioLogs.id, options.cursor),
    });
    if (cursorRow) conditions.push(lt(cardioLogs.date, cursorRow.date));
  }

  const rows = await db
    .select()
    .from(cardioLogs)
    .where(and(...conditions))
    .orderBy(desc(cardioLogs.date), desc(cardioLogs.id))
    .limit(limit + 1);

  const hasNextPage = rows.length > limit;
  const pageRows = rows.slice(0, limit);
  return {
    logs: pageRows.map(toCardioLog),
    nextCursor: hasNextPage ? pageRows[pageRows.length - 1]?.id ?? null : null,
  };
}

export async function updateCardioLogAdmin(
  userId: string,
  playerId: string,
  logId: string,
  data: CardioLogUpdateInput
): Promise<CardioLog> {
  await assertPlayerOwnedBy(userId, playerId);
  const patch: Partial<typeof cardioLogs.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.date !== undefined) patch.date = new Date(data.date);
  if (data.activityType !== undefined) patch.activityType = data.activityType as CardioActivityType;
  if (data.distanceMiles !== undefined) patch.distanceMiles = data.distanceMiles;
  if (data.durationMinutes !== undefined) patch.durationMinutes = data.durationMinutes;
  if (data.calories !== undefined) patch.calories = data.calories;
  if (data.avgHeartRate !== undefined) patch.avgHeartRate = data.avgHeartRate;
  if (data.maxHeartRate !== undefined) patch.maxHeartRate = data.maxHeartRate;
  if (data.location !== undefined) patch.location = data.location;
  if (data.weather !== undefined) patch.weather = data.weather;
  if (data.notes !== undefined) patch.notes = data.notes;
  if (data.perceivedEffort !== undefined) patch.perceivedEffort = data.perceivedEffort;

  // Recalculate pace if distance or duration changed
  if (data.distanceMiles !== undefined || data.durationMinutes !== undefined) {
    const existing = await db.query.cardioLogs.findFirst({
      where: eq(cardioLogs.id, logId),
    });
    if (existing) {
      const distance = data.distanceMiles ?? existing.distanceMiles;
      const duration = data.durationMinutes ?? existing.durationMinutes;
      patch.avgPacePerMile = calculatePace(distance, duration);
    }
  } else if (data.avgPacePerMile !== undefined) {
    patch.avgPacePerMile = data.avgPacePerMile;
  }

  const updated = await db
    .update(cardioLogs)
    .set(patch)
    .where(and(eq(cardioLogs.id, logId), eq(cardioLogs.playerId, playerId)))
    .returning();

  if (updated.length === 0) {
    throw new Error(`Failed to update cardio log: not found (id=${logId})`);
  }
  return toCardioLog(updated[0]);
}

export async function deleteCardioLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<void> {
  await assertPlayerOwnedBy(userId, playerId);
  await db
    .delete(cardioLogs)
    .where(and(eq(cardioLogs.id, logId), eq(cardioLogs.playerId, playerId)));
}

export async function getCardioStatsAdmin(
  userId: string,
  playerId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  totalRuns: number;
  totalMiles: number;
  totalDuration: number;
  avgPacePerMile: string;
  runsByType: Record<CardioActivityType, number>;
  longestRun: number;
  fastestPace: string;
}> {
  await assertPlayerOwnedBy(userId, playerId);
  const conditions = [eq(cardioLogs.playerId, playerId)];
  if (options?.startDate) conditions.push(gte(cardioLogs.date, options.startDate));
  if (options?.endDate) conditions.push(lte(cardioLogs.date, options.endDate));

  const rows = await db
    .select()
    .from(cardioLogs)
    .where(and(...conditions))
    .orderBy(desc(cardioLogs.date));

  const stats = {
    totalRuns: rows.length,
    totalMiles: 0,
    totalDuration: 0,
    avgPacePerMile: "0:00",
    runsByType: {} as Record<CardioActivityType, number>,
    longestRun: 0,
    fastestPace: "99:99",
  };

  let fastestPaceMinutes = Infinity;

  for (const row of rows) {
    stats.totalMiles += row.distanceMiles;
    stats.totalDuration += row.durationMinutes;
    stats.runsByType[row.activityType] = (stats.runsByType[row.activityType] ?? 0) + 1;
    if (row.distanceMiles > stats.longestRun) stats.longestRun = row.distanceMiles;
    if (row.distanceMiles > 0) {
      const paceMinutes = row.durationMinutes / row.distanceMiles;
      if (paceMinutes < fastestPaceMinutes) fastestPaceMinutes = paceMinutes;
    }
  }

  if (stats.totalMiles > 0) {
    stats.avgPacePerMile = calculatePace(stats.totalMiles, stats.totalDuration);
  }
  if (fastestPaceMinutes < Infinity) {
    const mins = Math.floor(fastestPaceMinutes);
    const secs = Math.round((fastestPaceMinutes - mins) * 60);
    stats.fastestPace = `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return stats;
}
