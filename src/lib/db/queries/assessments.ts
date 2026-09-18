/**
 * Fitness Assessments Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/assessments.ts. Public surface
 * preserved (function names + signatures) so API routes don't need per-call
 * edits.
 */

import { and, desc, eq, gte, lte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessments } from "@/lib/db/schema/assessments";
import type {
  FitnessAssessment,
  FitnessTestType,
} from "@/types/domain";
import type {
  FitnessAssessmentCreateInput,
  FitnessAssessmentUpdateInput,
} from "@/lib/validations/assessment-schema";
import {
  fitnessTestTypes,
  fitnessTestMetadata,
  calculateImprovement,
} from "@/lib/validations/assessment-schema";

type AssessmentRow = typeof assessments.$inferSelect;

function toFitnessAssessment(row: AssessmentRow): FitnessAssessment {
  return {
    id: row.id,
    playerId: row.playerId,
    date: row.date,
    testType: row.testType,
    value: row.value,
    unit: row.unit,
    percentile: row.percentile,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createAssessmentAdmin(
  _userId: string,
  playerId: string,
  data: FitnessAssessmentCreateInput
): Promise<FitnessAssessment> {
  const now = new Date();
  const inserted = await db
    .insert(assessments)
    .values({
      id: crypto.randomUUID(),
      playerId,
      date: new Date(data.date),
      testType: data.testType as FitnessTestType,
      value: data.value,
      unit: data.unit,
      percentile: data.percentile ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toFitnessAssessment(inserted[0]);
}

export async function getAssessmentAdmin(
  _userId: string,
  playerId: string,
  assessmentId: string
): Promise<FitnessAssessment | null> {
  const row = await db.query.assessments.findFirst({
    where: and(eq(assessments.id, assessmentId), eq(assessments.playerId, playerId)),
  });
  return row ? toFitnessAssessment(row) : null;
}

export async function getAssessmentsAdmin(
  _userId: string,
  playerId: string,
  options?: {
    testType?: FitnessTestType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ assessments: FitnessAssessment[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 50;
  const conditions = [eq(assessments.playerId, playerId)];
  if (options?.testType) conditions.push(eq(assessments.testType, options.testType));
  if (options?.startDate) conditions.push(gte(assessments.date, options.startDate));
  if (options?.endDate) conditions.push(lte(assessments.date, options.endDate));

  if (options?.cursor) {
    const cursorRow = await db.query.assessments.findFirst({
      where: eq(assessments.id, options.cursor),
    });
    if (cursorRow) conditions.push(lt(assessments.date, cursorRow.date));
  }

  const rows = await db
    .select()
    .from(assessments)
    .where(and(...conditions))
    .orderBy(desc(assessments.date), desc(assessments.id))
    .limit(limit + 1);

  const hasNextPage = rows.length > limit;
  const pageRows = rows.slice(0, limit);
  return {
    assessments: pageRows.map(toFitnessAssessment),
    nextCursor: hasNextPage ? pageRows[pageRows.length - 1]?.id ?? null : null,
  };
}

export async function updateAssessmentAdmin(
  _userId: string,
  playerId: string,
  assessmentId: string,
  data: FitnessAssessmentUpdateInput
): Promise<FitnessAssessment> {
  const patch: Partial<typeof assessments.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.date !== undefined) patch.date = new Date(data.date);
  if (data.testType !== undefined) patch.testType = data.testType as FitnessTestType;
  if (data.value !== undefined) patch.value = data.value;
  if (data.unit !== undefined) patch.unit = data.unit;
  if (data.percentile !== undefined) patch.percentile = data.percentile;
  if (data.notes !== undefined) patch.notes = data.notes;

  const updated = await db
    .update(assessments)
    .set(patch)
    .where(and(eq(assessments.id, assessmentId), eq(assessments.playerId, playerId)))
    .returning();

  if (updated.length === 0) {
    throw new Error(`Failed to update assessment: not found (id=${assessmentId})`);
  }
  return toFitnessAssessment(updated[0]);
}

export async function deleteAssessmentAdmin(
  _userId: string,
  playerId: string,
  assessmentId: string
): Promise<void> {
  await db
    .delete(assessments)
    .where(and(eq(assessments.id, assessmentId), eq(assessments.playerId, playerId)));
}

export async function getLatestAssessmentsByTypeAdmin(
  _userId: string,
  playerId: string
): Promise<Record<FitnessTestType, FitnessAssessment | null>> {
  const result: Record<FitnessTestType, FitnessAssessment | null> = {} as Record<
    FitnessTestType,
    FitnessAssessment | null
  >;

  for (const testType of fitnessTestTypes) {
    const row = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.playerId, playerId),
        eq(assessments.testType, testType)
      ),
      orderBy: [desc(assessments.date)],
    });
    result[testType] = row ? toFitnessAssessment(row) : null;
  }

  return result;
}

export async function getAssessmentProgressAdmin(
  _userId: string,
  playerId: string,
  testType: FitnessTestType,
  options?: { limit?: number }
): Promise<{
  assessments: FitnessAssessment[];
  improvement: { improved: boolean; percentage: number | null } | null;
  metadata: (typeof fitnessTestMetadata)[FitnessTestType];
}> {
  const limit = options?.limit ?? 10;
  const rows = await db
    .select()
    .from(assessments)
    .where(
      and(eq(assessments.playerId, playerId), eq(assessments.testType, testType))
    )
    .orderBy(desc(assessments.date))
    .limit(limit);

  const list = rows.map(toFitnessAssessment);
  let improvement = null;
  if (list.length >= 2) {
    const latest = list[0];
    const earliest = list[list.length - 1];
    improvement = calculateImprovement(testType, earliest.value, latest.value);
  }

  return {
    assessments: list,
    improvement,
    metadata: fitnessTestMetadata[testType],
  };
}

export async function getAssessmentSummaryAdmin(
  userId: string,
  playerId: string
): Promise<{
  totalAssessments: number;
  testsTaken: FitnessTestType[];
  latestByType: Record<
    FitnessTestType,
    { value: number; date: Date; percentile: number | null } | null
  >;
}> {
  const allRows = await db
    .select()
    .from(assessments)
    .where(eq(assessments.playerId, playerId));

  const latestByType = await getLatestAssessmentsByTypeAdmin(userId, playerId);
  const testsTaken = Object.entries(latestByType)
    .filter(([, a]) => a !== null)
    .map(([t]) => t as FitnessTestType);

  const simplifiedLatest = {} as Record<
    FitnessTestType,
    { value: number; date: Date; percentile: number | null } | null
  >;
  for (const [testType, a] of Object.entries(latestByType)) {
    simplifiedLatest[testType as FitnessTestType] = a
      ? { value: a.value, date: a.date, percentile: a.percentile ?? null }
      : null;
  }

  return {
    totalAssessments: allRows.length,
    testsTaken,
    latestByType: simplifiedLatest,
  };
}
