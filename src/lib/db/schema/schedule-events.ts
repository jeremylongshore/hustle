import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import type { ScheduleEventType } from "@/types/domain";

/**
 * Schedule events table — was Firestore subcollection
 * /users/{userId}/scheduleEvents/{eventId}
 *
 * Stored at user level (a family's athletes share a team schedule), so the FK
 * is to users — NOT players. The playerIds JSON list is the many-to-many edge.
 *
 * Field names mirror ScheduleEventDocument exactly.
 */
export const scheduleEvents = sqliteTable("scheduleEvent", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  playerIds: text("playerIds", { mode: "json" }).$type<string[]>().notNull(),

  type: text("type").$type<ScheduleEventType>().notNull(),
  title: text("title").notNull(),
  date: integer("date", { mode: "timestamp_ms" }).notNull(),
  endDate: integer("endDate", { mode: "timestamp_ms" }),

  location: text("location"),
  opponent: text("opponent"),
  notes: text("notes"),

  linkedGameId: text("linkedGameId"),
  linkedGamePlayerId: text("linkedGamePlayerId"),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
