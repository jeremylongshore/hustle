import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { players } from "./players";
import type {
  JournalContext,
  JournalMoodTag,
  JournalEnergyTag,
} from "@/types/domain";

/**
 * Journal entry table — was Firestore subcollection
 * /users/{userId}/players/{playerId}/journal/{entryId}
 *
 * Field names mirror JournalEntryDocument exactly.
 */
export const journalEntries = sqliteTable("journalEntry", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  playerId: text("playerId")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),

  date: integer("date", { mode: "timestamp_ms" }).notNull(),
  content: text("content").notNull(),
  context: text("context").$type<JournalContext>().notNull(),
  moodTag: text("moodTag").$type<JournalMoodTag>(),
  energyTag: text("energyTag").$type<JournalEnergyTag>(),
  linkedWorkoutId: text("linkedWorkoutId"),
  linkedGameId: text("linkedGameId"),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
