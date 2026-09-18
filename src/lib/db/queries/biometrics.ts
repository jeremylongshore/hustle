/**
 * Biometrics Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/biometrics.ts.
 */

import { and, desc, eq, gte, lte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { biometricsLogs } from "@/lib/db/schema/biometrics";
import type {
  BiometricsLog,
  BiometricsSource,
} from "@/types/domain";
import type {
  BiometricsLogCreateInput,
  BiometricsLogUpdateInput,
} from "@/lib/validations/biometrics-schema";

export interface BiometricsTrends {
  avgRestingHeartRate: number | null;
  avgHrv: number | null;
  avgSleepScore: number | null;
  avgSleepHours: number | null;
  avgSteps: number | null;
  dataPoints: number;
}

type BiometricsRow = typeof biometricsLogs.$inferSelect;

function toBiometricsLog(row: BiometricsRow): BiometricsLog {
  return {
    id: row.id,
    playerId: row.playerId,
    date: row.date,
    restingHeartRate: row.restingHeartRate,
    maxHeartRate: row.maxHeartRate,
    avgHeartRate: row.avgHeartRate,
    hrv: row.hrv,
    sleepScore: row.sleepScore,
    sleepHours: row.sleepHours,
    steps: row.steps,
    activeMinutes: row.activeMinutes,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createBiometricsLogAdmin(
  _userId: string,
  playerId: string,
  data: BiometricsLogCreateInput
): Promise<BiometricsLog> {
  const now = new Date();
  const inserted = await db
    .insert(biometricsLogs)
    .values({
      id: crypto.randomUUID(),
      playerId,
      date: new Date(data.date),
      restingHeartRate: data.restingHeartRate ?? null,
      maxHeartRate: data.maxHeartRate ?? null,
      avgHeartRate: data.avgHeartRate ?? null,
      hrv: data.hrv ?? null,
      sleepScore: data.sleepScore ?? null,
      sleepHours: data.sleepHours ?? null,
      steps: data.steps ?? null,
      activeMinutes: data.activeMinutes ?? null,
      source: data.source as BiometricsSource,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toBiometricsLog(inserted[0]);
}

export async function getBiometricsLogAdmin(
  _userId: string,
  playerId: string,
  logId: string
): Promise<BiometricsLog | null> {
  const row = await db.query.biometricsLogs.findFirst({
    where: and(eq(biometricsLogs.id, logId), eq(biometricsLogs.playerId, playerId)),
  });
  return row ? toBiometricsLog(row) : null;
}

export async function getBiometricsLogsAdmin(
  _userId: string,
  playerId: string,
  options?: {
    source?: BiometricsSource;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ logs: BiometricsLog[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 30;
  const conditions = [eq(biometricsLogs.playerId, playerId)];
  if (options?.source) conditions.push(eq(biometricsLogs.source, options.source));
  if (options?.startDate) conditions.push(gte(biometricsLogs.date, options.startDate));
  if (options?.endDate) conditions.push(lte(biometricsLogs.date, options.endDate));

  if (options?.cursor) {
    const cursorRow = await db.query.biometricsLogs.findFirst({
      where: eq(biometricsLogs.id, options.cursor),
    });
    if (cursorRow) conditions.push(lt(biometricsLogs.date, cursorRow.date));
  }

  const rows = await db
    .select()
    .from(biometricsLogs)
    .where(and(...conditions))
    .orderBy(desc(biometricsLogs.date), desc(biometricsLogs.id))
    .limit(limit + 1);

  const hasNextPage = rows.length > limit;
  const pageRows = rows.slice(0, limit);
  return {
    logs: pageRows.map(toBiometricsLog),
    nextCursor: hasNextPage ? pageRows[pageRows.length - 1]?.id ?? null : null,
  };
}

export async function updateBiometricsLogAdmin(
  _userId: string,
  playerId: string,
  logId: string,
  data: BiometricsLogUpdateInput
): Promise<BiometricsLog> {
  const patch: Partial<typeof biometricsLogs.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.date !== undefined) patch.date = new Date(data.date);
  if (data.restingHeartRate !== undefined) patch.restingHeartRate = data.restingHeartRate;
  if (data.maxHeartRate !== undefined) patch.maxHeartRate = data.maxHeartRate;
  if (data.avgHeartRate !== undefined) patch.avgHeartRate = data.avgHeartRate;
  if (data.hrv !== undefined) patch.hrv = data.hrv;
  if (data.sleepScore !== undefined) patch.sleepScore = data.sleepScore;
  if (data.sleepHours !== undefined) patch.sleepHours = data.sleepHours;
  if (data.steps !== undefined) patch.steps = data.steps;
  if (data.activeMinutes !== undefined) patch.activeMinutes = data.activeMinutes;
  if (data.source !== undefined) patch.source = data.source as BiometricsSource;

  const updated = await db
    .update(biometricsLogs)
    .set(patch)
    .where(and(eq(biometricsLogs.id, logId), eq(biometricsLogs.playerId, playerId)))
    .returning();

  if (updated.length === 0) {
    throw new Error(`Failed to update biometrics log: not found (id=${logId})`);
  }
  return toBiometricsLog(updated[0]);
}

export async function deleteBiometricsLogAdmin(
  _userId: string,
  playerId: string,
  logId: string
): Promise<void> {
  await db
    .delete(biometricsLogs)
    .where(and(eq(biometricsLogs.id, logId), eq(biometricsLogs.playerId, playerId)));
}

export async function getBiometricsTrendsAdmin(
  _userId: string,
  playerId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<BiometricsTrends> {
  const limit = options?.limit ?? 30;
  const conditions = [eq(biometricsLogs.playerId, playerId)];
  if (options?.startDate) conditions.push(gte(biometricsLogs.date, options.startDate));
  if (options?.endDate) conditions.push(lte(biometricsLogs.date, options.endDate));

  const rows = await db
    .select()
    .from(biometricsLogs)
    .where(and(...conditions))
    .orderBy(desc(biometricsLogs.date))
    .limit(limit);

  if (rows.length === 0) {
    return {
      avgRestingHeartRate: null,
      avgHrv: null,
      avgSleepScore: null,
      avgSleepHours: null,
      avgSteps: null,
      dataPoints: 0,
    };
  }

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const rhr = rows.map((r) => r.restingHeartRate).filter((v): v is number => v != null);
  const hrv = rows.map((r) => r.hrv).filter((v): v is number => v != null);
  const ssc = rows.map((r) => r.sleepScore).filter((v): v is number => v != null);
  const shr = rows.map((r) => r.sleepHours).filter((v): v is number => v != null);
  const stp = rows.map((r) => r.steps).filter((v): v is number => v != null);

  const round = (v: number | null) => (v === null ? null : Math.round(v));
  const round1 = (v: number | null) => (v === null ? null : Math.round(v * 10) / 10);

  return {
    avgRestingHeartRate: round(avg(rhr)),
    avgHrv: round(avg(hrv)),
    avgSleepScore: round(avg(ssc)),
    avgSleepHours: round1(avg(shr)),
    avgSteps: round(avg(stp)),
    dataPoints: rows.length,
  };
}

export async function getBiometricsLogByDateAdmin(
  _userId: string,
  playerId: string,
  date: Date
): Promise<BiometricsLog | null> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const row = await db.query.biometricsLogs.findFirst({
    where: and(
      eq(biometricsLogs.playerId, playerId),
      gte(biometricsLogs.date, startOfDay),
      lte(biometricsLogs.date, endOfDay)
    ),
  });
  return row ? toBiometricsLog(row) : null;
}
