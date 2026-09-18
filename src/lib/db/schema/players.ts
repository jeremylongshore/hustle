import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import { workspaces } from "./workspaces";
import type { PlayerGender, SoccerPositionCode } from "@/types/domain";
import type { LeagueCode } from "@/types/league";

export const players = sqliteTable("player", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: text("workspaceId").references(() => workspaces.id, {
    onDelete: "set null",
  }),

  name: text("name").notNull(),
  birthday: integer("birthday", { mode: "timestamp_ms" }).notNull(),
  gender: text("gender").$type<PlayerGender>().notNull(),

  primaryPosition: text("primaryPosition").$type<SoccerPositionCode>().notNull(),
  // Display-only array — store as JSON
  secondaryPositions: text("secondaryPositions", { mode: "json" }).$type<
    SoccerPositionCode[]
  >(),
  positionNote: text("positionNote"),
  // Legacy field for backward compat per firestore.ts:178
  position: text("position"),

  leagueCode: text("leagueCode").$type<LeagueCode>().notNull(),
  leagueOtherName: text("leagueOtherName"),

  teamClub: text("teamClub").notNull(),
  photoUrl: text("photoUrl"),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
