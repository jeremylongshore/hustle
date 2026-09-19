/**
 * Account data export (parent-initiated, portability / COPPA parent review).
 *
 * Returns one JSON document with everything the account holds about the
 * parent and their athletes. Secrets and internal identifiers are omitted:
 * password hash, verification PIN hash, Stripe customer/subscription ids.
 * Every athlete-scoped table is read by the parent's own player ids, so the
 * export can never include another family's rows.
 */

import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { workspaces } from "@/lib/db/schema/workspaces";
import { players } from "@/lib/db/schema/players";
import { games } from "@/lib/db/schema/games";
import { practiceLogs } from "@/lib/db/schema/practice-logs";
import { workoutLogs } from "@/lib/db/schema/workout-logs";
import { cardioLogs } from "@/lib/db/schema/cardio-logs";
import { mealLogs } from "@/lib/db/schema/meal-logs";
import { biometricsLogs } from "@/lib/db/schema/biometrics";
import { journalEntries } from "@/lib/db/schema/journal";
import { assessments } from "@/lib/db/schema/assessments";
import { dreamGym } from "@/lib/db/schema/dream-gym";
import { scheduleEvents } from "@/lib/db/schema/schedule-events";

export const EXPORT_FORMAT_VERSION = 1;

const ATHLETE_TABLES = {
  games,
  practiceLogs,
  workoutLogs,
  cardioLogs,
  mealLogs,
  biometricsLogs,
  journalEntries,
  assessments,
  dreamGym,
} as const;

export async function buildAccountExport(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new Error("User not found");

  const {
    passwordHash: _passwordHash,
    verificationPinHash: _pinHash,
    ...account
  } = user;

  const ownedWorkspaces = (
    await db.select().from(workspaces).where(eq(workspaces.ownerUserId, userId)).all()
  ).map(({ billingStripeCustomerId: _c, billingStripeSubscriptionId: _s, ...w }) => w);

  const athletes = await db.select().from(players).where(eq(players.userId, userId)).all();
  const athleteIds = athletes.map((p) => p.id);

  const athleteData: Record<string, unknown[]> = {};
  for (const [name, table] of Object.entries(ATHLETE_TABLES)) {
    athleteData[name] =
      athleteIds.length === 0
        ? []
        : await db.select().from(table).where(inArray(table.playerId, athleteIds)).all();
  }

  const schedule = await db.select().from(scheduleEvents).where(eq(scheduleEvents.userId, userId)).all();

  return {
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    service: "Hustle (hustlestats.io)",
    account,
    workspaces: ownedWorkspaces,
    athletes,
    ...athleteData,
    scheduleEvents: schedule,
  };
}
