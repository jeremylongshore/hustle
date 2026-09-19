/**
 * Workout Logs Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/workout-logs.ts.
 *
 * Public surface (function names + signatures + return shapes) is preserved
 * 1:1 so API routes that import `*Admin` symbols continue working without
 * per-call edits — same pattern as the Phase 3 auth.ts cutover.
 *
 * The old Firestore subcollection /users/{userId}/players/{playerId}/workoutLogs
 * is now the `workoutLog` table keyed by playerId. The userId argument is kept
 * for source compatibility but the new query module does not need it for
 * lookups — playerId is unique across the system.
 */

import { and, asc, desc, eq, gte, lte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { workoutLogs } from "@/lib/db/schema/workout-logs";
import type {
  WorkoutLog,
  WorkoutLogType,
} from "@/types/domain";
import type {
  WorkoutLogCreateInput,
  WorkoutLogUpdateInput,
} from "@/lib/validations/workout-log-schema";
import { calculateTotalVolume } from "@/lib/validations/workout-log-schema";
import { assertPlayerOwnedBy } from "@/lib/db/queries/ownership";

type WorkoutLogRow = typeof workoutLogs.$inferSelect;

function toWorkoutLog(row: WorkoutLogRow): WorkoutLog {
  return {
    id: row.id,
    playerId: row.playerId,
    workoutId: row.workoutId,
    date: row.date,
    type: row.type,
    title: row.title,
    duration: row.duration,
    exercises: row.exercises,
    totalVolume: row.totalVolume,
    completedAt: row.completedAt,
    journalEntryId: row.journalEntryId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createWorkoutLogAdmin(
  userId: string,
  playerId: string,
  data: WorkoutLogCreateInput
): Promise<WorkoutLog> {
  await assertPlayerOwnedBy(userId, playerId);
  const totalVolume = calculateTotalVolume(data.exercises);
  const now = new Date();
  const id = crypto.randomUUID();

  const inserted = await db
    .insert(workoutLogs)
    .values({
      id,
      playerId,
      workoutId: data.workoutId ?? null,
      date: new Date(data.date),
      type: data.type as WorkoutLogType,
      title: data.title,
      duration: data.duration,
      exercises: data.exercises,
      totalVolume,
      completedAt: now,
      journalEntryId: data.journalEntryId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toWorkoutLog(inserted[0]);
}

export async function getWorkoutLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<WorkoutLog | null> {
  await assertPlayerOwnedBy(userId, playerId);
  const row = await db.query.workoutLogs.findFirst({
    where: and(eq(workoutLogs.id, logId), eq(workoutLogs.playerId, playerId)),
  });
  return row ? toWorkoutLog(row) : null;
}

export async function getWorkoutLogsAdmin(
  userId: string,
  playerId: string,
  options?: {
    type?: WorkoutLogType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ logs: WorkoutLog[]; nextCursor: string | null }> {
  await assertPlayerOwnedBy(userId, playerId);
  const limit = options?.limit ?? 20;
  const conditions = [eq(workoutLogs.playerId, playerId)];
  if (options?.type) conditions.push(eq(workoutLogs.type, options.type));
  if (options?.startDate) conditions.push(gte(workoutLogs.date, options.startDate));
  if (options?.endDate) conditions.push(lte(workoutLogs.date, options.endDate));

  // Cursor support: cursor is the previous-page's last id. We re-derive the
  // cursor row's date and fetch everything older. Tie-break on id to keep
  // pagination deterministic when two rows share a date.
  if (options?.cursor) {
    const cursorRow = await db.query.workoutLogs.findFirst({
      where: eq(workoutLogs.id, options.cursor),
    });
    if (cursorRow) {
      conditions.push(lt(workoutLogs.date, cursorRow.date));
    }
  }

  const rows = await db
    .select()
    .from(workoutLogs)
    .where(and(...conditions))
    .orderBy(desc(workoutLogs.date), desc(workoutLogs.id))
    .limit(limit + 1);

  const hasNextPage = rows.length > limit;
  const pageRows = rows.slice(0, limit);
  const logs = pageRows.map(toWorkoutLog);

  return {
    logs,
    nextCursor: hasNextPage ? pageRows[pageRows.length - 1]?.id ?? null : null,
  };
}

export async function updateWorkoutLogAdmin(
  userId: string,
  playerId: string,
  logId: string,
  data: WorkoutLogUpdateInput
): Promise<WorkoutLog> {
  await assertPlayerOwnedBy(userId, playerId);
  const patch: Partial<typeof workoutLogs.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.date !== undefined) patch.date = new Date(data.date);
  if (data.title !== undefined) patch.title = data.title;
  if (data.type !== undefined) patch.type = data.type as WorkoutLogType;
  if (data.duration !== undefined) patch.duration = data.duration;
  if (data.exercises !== undefined) {
    patch.exercises = data.exercises;
    patch.totalVolume = calculateTotalVolume(data.exercises);
  }
  if (data.journalEntryId !== undefined) patch.journalEntryId = data.journalEntryId;
  if (data.workoutId !== undefined) patch.workoutId = data.workoutId;

  const updated = await db
    .update(workoutLogs)
    .set(patch)
    .where(and(eq(workoutLogs.id, logId), eq(workoutLogs.playerId, playerId)))
    .returning();

  if (updated.length === 0) {
    throw new Error(`Failed to update workout log: not found (id=${logId})`);
  }
  return toWorkoutLog(updated[0]);
}

export async function deleteWorkoutLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<void> {
  await assertPlayerOwnedBy(userId, playerId);
  await db
    .delete(workoutLogs)
    .where(and(eq(workoutLogs.id, logId), eq(workoutLogs.playerId, playerId)));
}

export async function getWorkoutStatsAdmin(
  userId: string,
  playerId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  totalWorkouts: number;
  totalDuration: number;
  totalVolume: number;
  workoutsByType: Record<WorkoutLogType, number>;
  averageDuration: number;
}> {
  await assertPlayerOwnedBy(userId, playerId);
  const conditions = [eq(workoutLogs.playerId, playerId)];
  if (options?.startDate) conditions.push(gte(workoutLogs.date, options.startDate));
  if (options?.endDate) conditions.push(lte(workoutLogs.date, options.endDate));

  const rows = await db
    .select()
    .from(workoutLogs)
    .where(and(...conditions))
    .orderBy(asc(workoutLogs.date));

  const stats = {
    totalWorkouts: rows.length,
    totalDuration: 0,
    totalVolume: 0,
    workoutsByType: {} as Record<WorkoutLogType, number>,
    averageDuration: 0,
  };

  for (const row of rows) {
    stats.totalDuration += row.duration;
    stats.totalVolume += row.totalVolume ?? 0;
    stats.workoutsByType[row.type] = (stats.workoutsByType[row.type] ?? 0) + 1;
  }

  stats.averageDuration = rows.length > 0 ? stats.totalDuration / rows.length : 0;
  return stats;
}

// Suppress unused-imports warnings for utilities reserved for future use.
void sql;
