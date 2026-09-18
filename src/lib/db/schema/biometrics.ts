import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { players } from "./players";
import type { BiometricsSource } from "@/types/domain";

/**
 * Biometrics log table — was Firestore subcollection
 * /users/{userId}/players/{playerId}/biometrics/{logId}
 *
 * Field names mirror BiometricsLogDocument exactly.
 */
export const biometricsLogs = sqliteTable("biometricsLog", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  playerId: text("playerId")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),

  date: integer("date", { mode: "timestamp_ms" }).notNull(),

  // Heart rate metrics
  restingHeartRate: integer("restingHeartRate"),
  maxHeartRate: integer("maxHeartRate"),
  avgHeartRate: integer("avgHeartRate"),
  hrv: real("hrv"),

  // Sleep metrics
  sleepScore: integer("sleepScore"),
  sleepHours: real("sleepHours"),

  // Activity metrics
  steps: integer("steps"),
  activeMinutes: integer("activeMinutes"),

  source: text("source").$type<BiometricsSource>().notNull(),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
