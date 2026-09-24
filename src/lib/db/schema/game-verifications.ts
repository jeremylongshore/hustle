import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { games } from "./games";
import { users } from "./auth";

export type VerificationRole = "parent" | "coach";
export type VerificationMethod = "pin" | "link";

/**
 * Co-signatures on a game's stats (bead hustle-4dc.9). One row per signer, so a
 * game can be verified by the parent (PIN) and later by a coach (one-time link).
 * games.verified / verifiedAt stay as the denormalized "has at least one
 * signature" flag that existing counts and filters rely on.
 */
export const gameVerifications = sqliteTable(
  "gameVerification",
  {
    id: text("id").primaryKey(),
    gameId: text("gameId")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    signerRole: text("signerRole").$type<VerificationRole>().notNull(),
    /** Display name shown as "Verified by {signerName}". */
    signerName: text("signerName").notNull(),
    /** Set for parent signatures; null for coaches (no account). */
    signerUserId: text("signerUserId").references(() => users.id, { onDelete: "set null" }),
    method: text("method").$type<VerificationMethod>().notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    byGame: index("gameVerification_gameId_idx").on(t.gameId),
  }),
);
