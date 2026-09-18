/**
 * Meal Logs Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/meal-logs.ts.
 */

import { and, desc, eq, gte, lte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { mealLogs } from "@/lib/db/schema/meal-logs";
import type { MealLog, MealType } from "@/types/domain";
import type { MealLogCreateInput } from "@/lib/validations/meal-log-schema";

type MealLogRow = typeof mealLogs.$inferSelect;

function toMealLog(row: MealLogRow): MealLog {
  return {
    id: row.id,
    playerId: row.playerId,
    date: row.date,
    mealType: row.mealType,
    description: row.description,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createMealLogAdmin(
  _userId: string,
  playerId: string,
  data: MealLogCreateInput
): Promise<MealLog> {
  const now = new Date();
  const inserted = await db
    .insert(mealLogs)
    .values({
      id: crypto.randomUUID(),
      playerId,
      date: new Date(data.date),
      mealType: data.mealType as MealType,
      description: data.description,
      calories: data.calories ?? null,
      protein: data.protein ?? null,
      carbs: data.carbs ?? null,
      fat: data.fat ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return toMealLog(inserted[0]);
}

export async function getMealLogsAdmin(
  _userId: string,
  playerId: string,
  options?: {
    mealType?: MealType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ logs: MealLog[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 20;
  const conditions = [eq(mealLogs.playerId, playerId)];
  if (options?.mealType) conditions.push(eq(mealLogs.mealType, options.mealType));
  if (options?.startDate) conditions.push(gte(mealLogs.date, options.startDate));
  if (options?.endDate) conditions.push(lte(mealLogs.date, options.endDate));

  if (options?.cursor) {
    const cursorRow = await db.query.mealLogs.findFirst({
      where: eq(mealLogs.id, options.cursor),
    });
    if (cursorRow) conditions.push(lt(mealLogs.date, cursorRow.date));
  }

  const rows = await db
    .select()
    .from(mealLogs)
    .where(and(...conditions))
    .orderBy(desc(mealLogs.date), desc(mealLogs.id))
    .limit(limit + 1);

  const hasNextPage = rows.length > limit;
  const pageRows = rows.slice(0, limit);
  return {
    logs: pageRows.map(toMealLog),
    nextCursor: hasNextPage ? pageRows[pageRows.length - 1]?.id ?? null : null,
  };
}

export async function deleteMealLogAdmin(
  _userId: string,
  playerId: string,
  logId: string
): Promise<void> {
  await db
    .delete(mealLogs)
    .where(and(eq(mealLogs.id, logId), eq(mealLogs.playerId, playerId)));
}
