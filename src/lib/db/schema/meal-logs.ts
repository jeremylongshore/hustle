import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { players } from "./players";
import type { MealType } from "@/types/domain";

/**
 * Meal log table — was Firestore subcollection
 * /users/{userId}/players/{playerId}/mealLogs/{logId}
 *
 * Field names mirror MealLogDocument exactly.
 */
export const mealLogs = sqliteTable("mealLog", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  playerId: text("playerId")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),

  date: integer("date", { mode: "timestamp_ms" }).notNull(),
  mealType: text("mealType").$type<MealType>().notNull(),
  description: text("description").notNull(),

  calories: integer("calories"),
  protein: real("protein"),
  carbs: real("carbs"),
  fat: real("fat"),
  notes: text("notes"),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
