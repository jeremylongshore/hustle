import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { players } from "./players";
import type {
  DreamGymProfile,
  DreamGymSchedule,
  DreamGymEvent,
  DreamGymMentalCheckIn,
} from "@/types/domain";

/**
 * Dream Gym table — was Firestore subcollection
 * /users/{userId}/players/{playerId}/dreamGym/{profile} (singleton)
 *
 * In Firestore each player had ONE dreamGym doc keyed by the literal "profile".
 * In SQLite we enforce the same one-per-player invariant with a UNIQUE constraint
 * on playerId.
 *
 * Complex shapes (profile, schedule, events, mental, weeklyGrid) stay as JSON
 * blobs because their structure is heterogeneous and only ever read/written
 * whole-document. Splitting them out would add joins for zero query benefit.
 */
export const dreamGym = sqliteTable("dreamGym", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  playerId: text("playerId")
    .notNull()
    .unique()
    .references(() => players.id, { onDelete: "cascade" }),

  profile: text("profile", { mode: "json" }).$type<DreamGymProfile>().notNull(),
  schedule: text("schedule", { mode: "json" }).$type<DreamGymSchedule>().notNull(),

  // Embedded arrays — DreamGym is a singleton-per-player doc in Firestore terms
  events: text("events", { mode: "json" }).$type<DreamGymEvent[]>().notNull().default(
    [] as unknown as DreamGymEvent[]
  ),

  mentalCheckIns: text("mentalCheckIns", { mode: "json" })
    .$type<DreamGymMentalCheckIn[]>()
    .notNull()
    .default([] as unknown as DreamGymMentalCheckIn[]),
  mentalFavoriteTips: text("mentalFavoriteTips", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([] as unknown as string[]),
  mentalLastCheckIn: integer("mentalLastCheckIn", { mode: "timestamp_ms" }),

  // Free-form weekly grid (slot-keyed schedule)
  weeklyGrid: text("weeklyGrid", { mode: "json" }).$type<
    Record<string, Record<string, string | null>>
  >(),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
