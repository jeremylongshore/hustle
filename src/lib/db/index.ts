import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as authSchema from "./schema/auth";
import * as playersSchema from "./schema/players";
import * as gamesSchema from "./schema/games";
import * as workspacesSchema from "./schema/workspaces";
import * as waitlistSchema from "./schema/waitlist";
import * as workspaceInvitesSchema from "./schema/workspace-invites";
import * as workoutLogsSchema from "./schema/workout-logs";
import * as assessmentsSchema from "./schema/assessments";
import * as biometricsSchema from "./schema/biometrics";
import * as cardioLogsSchema from "./schema/cardio-logs";
import * as practiceLogsSchema from "./schema/practice-logs";
import * as journalSchema from "./schema/journal";
import * as mealLogsSchema from "./schema/meal-logs";
import * as dreamGymSchema from "./schema/dream-gym";
import * as scheduleEventsSchema from "./schema/schedule-events";
import * as billingSchema from "./schema/billing";
import * as rateLimitsSchema from "./schema/rate-limits";
import * as gameVerificationsSchema from "./schema/game-verifications";

const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), "data/hustle.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
// Wait (up to 10s) instead of failing with SQLITE_BUSY when another connection
// holds the lock. next build runs several workers that each import this module
// and run migrations against the same file; without this they collide with
// "database is locked" (CI failure on PR #70). Also protects concurrent
// writers at runtime.
sqlite.pragma("busy_timeout = 10000");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, {
  schema: {
    ...authSchema,
    ...playersSchema,
    ...gamesSchema,
    ...workspacesSchema,
    ...waitlistSchema,
    ...workspaceInvitesSchema,
    ...workoutLogsSchema,
    ...assessmentsSchema,
    ...biometricsSchema,
    ...cardioLogsSchema,
    ...practiceLogsSchema,
    ...journalSchema,
    ...mealLogsSchema,
    ...dreamGymSchema,
    ...scheduleEventsSchema,
    ...billingSchema,
    ...rateLimitsSchema,
    ...gameVerificationsSchema,
  },
});
export type DB = typeof db;

// Run migrations on first import. Idempotent — drizzle tracks applied
// migrations in the __drizzle_migrations table.
const migrationsFolder = path.resolve(process.cwd(), "drizzle");
if (fs.existsSync(migrationsFolder)) {
  try {
    migrate(db, { migrationsFolder });
  } catch (err) {
    console.error("[db] migration error:", err);
  }
}
