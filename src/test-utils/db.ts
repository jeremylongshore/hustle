/**
 * In-memory SQLite + Drizzle helper for query-module unit tests.
 *
 * Spawns a fresh better-sqlite3 `:memory:` database per call, runs every
 * committed migration in `drizzle/` against it, then mocks `@/lib/db` so the
 * subject-under-test imports the throwaway DB instead of the project-wide
 * default at data/hustle.db. Returns the drizzle handle so tests can seed
 * fixtures directly.
 *
 * Call this inside `beforeEach` for hermetic per-test isolation.
 */

import { vi } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import * as authSchema from "@/lib/db/schema/auth";
import * as playersSchema from "@/lib/db/schema/players";
import * as gamesSchema from "@/lib/db/schema/games";
import * as workspacesSchema from "@/lib/db/schema/workspaces";
import * as waitlistSchema from "@/lib/db/schema/waitlist";
import * as workspaceInvitesSchema from "@/lib/db/schema/workspace-invites";
import * as workoutLogsSchema from "@/lib/db/schema/workout-logs";
import * as assessmentsSchema from "@/lib/db/schema/assessments";
import * as biometricsSchema from "@/lib/db/schema/biometrics";
import * as cardioLogsSchema from "@/lib/db/schema/cardio-logs";
import * as practiceLogsSchema from "@/lib/db/schema/practice-logs";
import * as journalSchema from "@/lib/db/schema/journal";
import * as mealLogsSchema from "@/lib/db/schema/meal-logs";
import * as dreamGymSchema from "@/lib/db/schema/dream-gym";
import * as scheduleEventsSchema from "@/lib/db/schema/schedule-events";
import * as billingSchema from "@/lib/db/schema/billing";
import * as rateLimitsSchema from "@/lib/db/schema/rate-limits";
import * as gameVerificationsSchema from "@/lib/db/schema/game-verifications";

const schema = {
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
};

export type TestDB = ReturnType<typeof drizzle<typeof schema>>;

export function makeTestDb(): { db: TestDB; close: () => void } {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
  return {
    db,
    close: () => sqlite.close(),
  };
}

/**
 * Mocks the `@/lib/db` module's `db` export to point at a fresh in-memory
 * database. MUST be called BEFORE the module under test is imported (use
 * dynamic `await import()` after this call, or arrange with vi.hoisted).
 */
export function mockDbModule(testDb: TestDB) {
  vi.doMock("@/lib/db", () => ({ db: testDb }));
}

/**
 * Seed minimal required parents (user, workspace, player) so foreign-key
 * cascades in tests have something to anchor to. Returns the IDs created.
 */
export async function seedBaseHierarchy(db: TestDB): Promise<{
  userId: string;
  workspaceId: string;
  playerId: string;
}> {
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const playerId = crypto.randomUUID();
  const now = new Date();

  await db.insert(schema.users).values({
    id: userId,
    email: `test-${userId}@example.com`,
    name: "Test User",
    emailVerified: now,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.workspaces).values({
    id: workspaceId,
    ownerUserId: userId,
    name: "Test Workspace",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.players).values({
    id: playerId,
    userId,
    workspaceId,
    name: "Test Player",
    birthday: new Date("2012-06-15"),
    gender: "male",
    primaryPosition: "CM",
    leagueCode: "REC",
    teamClub: "Test FC",
    createdAt: now,
    updatedAt: now,
  });

  return { userId, workspaceId, playerId };
}
