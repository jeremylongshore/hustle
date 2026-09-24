/**
 * Practice Logs Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/practice-logs.ts.
 */

import { and, desc, eq, gte, lte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { practiceLogs } from "@/lib/db/schema/practice-logs";
import type {
  PracticeLog,
  PracticeType,
  PracticeFocusArea,
} from "@/types/domain";
import type {
  PracticeLogCreateInput,
  PracticeLogUpdateInput,
} from "@/lib/validations/practice-log-schema";
import { assertPlayerOwnedBy } from "@/lib/db/queries/ownership";

type PracticeLogRow = typeof practiceLogs.$inferSelect;

function toPracticeLog(row: PracticeLogRow): PracticeLog {
  return {
    id: row.id,
    playerId: row.playerId,
    date: row.date,
    practiceType: row.practiceType,
    durationMinutes: row.durationMinutes,
    focusAreas: row.focusAreas,
    teamName: row.teamName,
    location: row.location,
    drillsCompleted: row.drillsCompleted,
    intensity: row.intensity as 1 | 2 | 3 | 4 | 5 | null,
    enjoyment: row.enjoyment as 1 | 2 | 3 | 4 | 5 | null,
    improvement: row.improvement,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createPracticeLogAdmin(
  userId: string,
  playerId: string,
  data: PracticeLogCreateInput
): Promise<PracticeLog> {
  await assertPlayerOwnedBy(userId, playerId);
  const now = new Date();
  const inserted = await db
    .insert(practiceLogs)
    .values({
      id: crypto.randomUUID(),
      playerId,
      date: new Date(data.date),
      practiceType: data.practiceType as PracticeType,
      durationMinutes: data.durationMinutes,
      focusAreas: data.focusAreas as PracticeFocusArea[],
      teamName: data.teamName ?? null,
      location: data.location ?? null,
      drillsCompleted: data.drillsCompleted ?? null,
      intensity: data.intensity ?? null,
      enjoyment: data.enjoyment ?? null,
      improvement: data.improvement ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toPracticeLog(inserted[0]);
}

export async function getPracticeLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<PracticeLog | null> {
  await assertPlayerOwnedBy(userId, playerId);
  const row = await db.query.practiceLogs.findFirst({
    where: and(eq(practiceLogs.id, logId), eq(practiceLogs.playerId, playerId)),
  });
  return row ? toPracticeLog(row) : null;
}

export async function getPracticeLogsAdmin(
  userId: string,
  playerId: string,
  options?: {
    practiceType?: PracticeType;
    focusArea?: PracticeFocusArea;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ logs: PracticeLog[]; nextCursor: string | null }> {
  await assertPlayerOwnedBy(userId, playerId);
  const limit = options?.limit ?? 20;
  const conditions = [eq(practiceLogs.playerId, playerId)];
  if (options?.practiceType) conditions.push(eq(practiceLogs.practiceType, options.practiceType));
  if (options?.startDate) conditions.push(gte(practiceLogs.date, options.startDate));
  if (options?.endDate) conditions.push(lte(practiceLogs.date, options.endDate));

  if (options?.cursor) {
    const cursorRow = await db.query.practiceLogs.findFirst({
      where: eq(practiceLogs.id, options.cursor),
    });
    if (cursorRow) conditions.push(lt(practiceLogs.date, cursorRow.date));
  }

  // focusArea is array-contains; SQLite JSON1 has the json_each function but
  // the easier portable filter is post-fetch.
  const queryRows = await db
    .select()
    .from(practiceLogs)
    .where(and(...conditions))
    .orderBy(desc(practiceLogs.date), desc(practiceLogs.id))
    .limit((limit + 1) * (options?.focusArea ? 5 : 1));

  let filtered = queryRows;
  if (options?.focusArea) {
    filtered = queryRows.filter((r) => r.focusAreas.includes(options.focusArea!));
  }

  const pageRows = filtered.slice(0, limit);
  const hasNextPage = filtered.length > limit;
  return {
    logs: pageRows.map(toPracticeLog),
    nextCursor: hasNextPage ? pageRows[pageRows.length - 1]?.id ?? null : null,
  };
}

export async function updatePracticeLogAdmin(
  userId: string,
  playerId: string,
  logId: string,
  data: PracticeLogUpdateInput
): Promise<PracticeLog> {
  await assertPlayerOwnedBy(userId, playerId);
  const patch: Partial<typeof practiceLogs.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.date !== undefined) patch.date = new Date(data.date);
  if (data.practiceType !== undefined) patch.practiceType = data.practiceType as PracticeType;
  if (data.durationMinutes !== undefined) patch.durationMinutes = data.durationMinutes;
  if (data.focusAreas !== undefined) patch.focusAreas = data.focusAreas as PracticeFocusArea[];
  if (data.teamName !== undefined) patch.teamName = data.teamName;
  if (data.location !== undefined) patch.location = data.location;
  if (data.drillsCompleted !== undefined) patch.drillsCompleted = data.drillsCompleted;
  if (data.intensity !== undefined) patch.intensity = data.intensity;
  if (data.enjoyment !== undefined) patch.enjoyment = data.enjoyment;
  if (data.improvement !== undefined) patch.improvement = data.improvement;
  if (data.notes !== undefined) patch.notes = data.notes;

  const updated = await db
    .update(practiceLogs)
    .set(patch)
    .where(and(eq(practiceLogs.id, logId), eq(practiceLogs.playerId, playerId)))
    .returning();

  if (updated.length === 0) {
    throw new Error(`Failed to update practice log: not found (id=${logId})`);
  }
  return toPracticeLog(updated[0]);
}

export async function deletePracticeLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<void> {
  await assertPlayerOwnedBy(userId, playerId);
  await db
    .delete(practiceLogs)
    .where(and(eq(practiceLogs.id, logId), eq(practiceLogs.playerId, playerId)));
}

export async function getPracticeStatsAdmin(
  userId: string,
  playerId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  totalPractices: number;
  totalDuration: number;
  avgDuration: number;
  practicesByType: Record<PracticeType, number>;
  focusAreaFrequency: Record<PracticeFocusArea, number>;
  avgIntensity: number;
  avgEnjoyment: number;
}> {
  await assertPlayerOwnedBy(userId, playerId);
  const conditions = [eq(practiceLogs.playerId, playerId)];
  if (options?.startDate) conditions.push(gte(practiceLogs.date, options.startDate));
  if (options?.endDate) conditions.push(lte(practiceLogs.date, options.endDate));

  const rows = await db
    .select()
    .from(practiceLogs)
    .where(and(...conditions))
    .orderBy(desc(practiceLogs.date));

  const stats = {
    totalPractices: rows.length,
    totalDuration: 0,
    avgDuration: 0,
    practicesByType: {} as Record<PracticeType, number>,
    focusAreaFrequency: {} as Record<PracticeFocusArea, number>,
    avgIntensity: 0,
    avgEnjoyment: 0,
  };

  let intensitySum = 0;
  let intensityCount = 0;
  let enjoymentSum = 0;
  let enjoymentCount = 0;

  for (const row of rows) {
    stats.totalDuration += row.durationMinutes;
    stats.practicesByType[row.practiceType] = (stats.practicesByType[row.practiceType] ?? 0) + 1;
    for (const area of row.focusAreas) {
      stats.focusAreaFrequency[area] = (stats.focusAreaFrequency[area] ?? 0) + 1;
    }
    if (row.intensity) {
      intensitySum += row.intensity;
      intensityCount++;
    }
    if (row.enjoyment) {
      enjoymentSum += row.enjoyment;
      enjoymentCount++;
    }
  }

  stats.avgDuration = rows.length > 0 ? Math.round(stats.totalDuration / rows.length) : 0;
  stats.avgIntensity = intensityCount > 0 ? Number((intensitySum / intensityCount).toFixed(1)) : 0;
  stats.avgEnjoyment = enjoymentCount > 0 ? Number((enjoymentSum / enjoymentCount).toFixed(1)) : 0;

  return stats;
}

void sql;
