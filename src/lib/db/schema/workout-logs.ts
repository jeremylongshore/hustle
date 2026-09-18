import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { players } from "./players";
import type {
  WorkoutLogType,
  WorkoutExerciseLog,
} from "@/types/domain";

/**
 * Workout log table — was Firestore subcollection
 * /users/{userId}/players/{playerId}/workoutLogs/{logId}
 *
 * playerId is the FK; userId is reachable through players.userId.
 */
export const workoutLogs = sqliteTable("workoutLog", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  playerId: text("playerId")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),

  workoutId: text("workoutId"),
  date: integer("date", { mode: "timestamp_ms" }).notNull(),
  type: text("type").$type<WorkoutLogType>().notNull(),
  title: text("title").notNull(),
  duration: integer("duration").notNull(), // minutes

  // Stored as JSON — array of WorkoutExerciseLog
  exercises: text("exercises", { mode: "json" })
    .$type<WorkoutExerciseLog[]>()
    .notNull(),

  totalVolume: integer("totalVolume"),
  completedAt: integer("completedAt", { mode: "timestamp_ms" }).notNull(),
  journalEntryId: text("journalEntryId"),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
