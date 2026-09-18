import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { players } from "./players";
import type { FitnessTestType, FitnessTestUnit } from "@/types/domain";

/**
 * Fitness assessment table — was Firestore subcollection
 * /users/{userId}/players/{playerId}/assessments/{assessmentId}
 *
 * Field names mirror FitnessAssessmentDocument exactly.
 */
export const assessments = sqliteTable("assessment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  playerId: text("playerId")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),

  date: integer("date", { mode: "timestamp_ms" }).notNull(),
  testType: text("testType").$type<FitnessTestType>().notNull(),
  value: real("value").notNull(),
  unit: text("unit").$type<FitnessTestUnit>().notNull(),
  percentile: real("percentile"),
  notes: text("notes"),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
