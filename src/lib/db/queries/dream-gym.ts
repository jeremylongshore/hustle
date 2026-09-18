/**
 * Dream Gym Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/dream-gym.ts.
 *
 * Dream Gym is a singleton-per-player record (in Firestore terms, doc id was
 * always literal "profile"). SQLite enforces that with a UNIQUE constraint on
 * playerId in dream-gym.ts. The synthetic id we return is the row's `id`,
 * but in practice callers don't depend on it.
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dreamGym } from "@/lib/db/schema/dream-gym";
import type {
  DreamGym,
  DreamGymProfile,
  DreamGymSchedule,
  DreamGymEvent,
  DreamGymMentalCheckIn,
  DreamGymEventClient,
  DreamGymMentalCheckInClient,
} from "@/types/domain";

type DreamGymRow = typeof dreamGym.$inferSelect;

function toDateMaybe(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  if (
    value &&
    typeof value === "object" &&
    "toDate" in (value as Record<string, unknown>) &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(String(value ?? Date.now()));
}

function toDreamGym(
  row: DreamGymRow
): DreamGym & { weeklyGrid?: Record<string, Record<string, string | null>> } {
  return {
    id: row.id,
    playerId: row.playerId,
    profile: row.profile,
    schedule: row.schedule,
    events: (row.events ?? []).map(
      (event: DreamGymEvent): DreamGymEventClient => ({
        ...event,
        date: toDateMaybe(event.date),
      })
    ),
    mental: {
      checkIns: (row.mentalCheckIns ?? []).map(
        (ci: DreamGymMentalCheckIn): DreamGymMentalCheckInClient => ({
          ...ci,
          date: toDateMaybe(ci.date),
        })
      ),
      favoriteTips: row.mentalFavoriteTips ?? [],
      lastCheckIn: row.mentalLastCheckIn ?? null,
    },
    weeklyGrid: row.weeklyGrid ?? {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getDreamGymAdmin(
  _userId: string,
  playerId: string
): Promise<
  | (DreamGym & { weeklyGrid?: Record<string, Record<string, string | null>> })
  | null
> {
  const row = await db.query.dreamGym.findFirst({
    where: eq(dreamGym.playerId, playerId),
  });
  return row ? toDreamGym(row) : null;
}

export async function upsertDreamGymAdmin(
  _userId: string,
  playerId: string,
  data: {
    profile: DreamGymProfile;
    schedule: DreamGymSchedule;
  }
): Promise<DreamGym> {
  const now = new Date();
  const existing = await db.query.dreamGym.findFirst({
    where: eq(dreamGym.playerId, playerId),
  });

  if (existing) {
    const updated = await db
      .update(dreamGym)
      .set({
        profile: data.profile,
        schedule: data.schedule,
        updatedAt: now,
      })
      .where(eq(dreamGym.playerId, playerId))
      .returning();
    return toDreamGym(updated[0]);
  }

  const inserted = await db
    .insert(dreamGym)
    .values({
      id: crypto.randomUUID(),
      playerId,
      profile: data.profile,
      schedule: data.schedule,
      events: [],
      mentalCheckIns: [],
      mentalFavoriteTips: [],
      mentalLastCheckIn: null,
      weeklyGrid: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return toDreamGym(inserted[0]);
}

export async function getMentalCheckInsAdmin(
  userId: string,
  playerId: string,
  limit: number = 30
): Promise<DreamGymMentalCheckInClient[]> {
  const dg = await getDreamGymAdmin(userId, playerId);
  if (!dg) return [];
  return dg.mental.checkIns.slice(-limit);
}

export async function getDreamGymEventsAdmin(
  userId: string,
  playerId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<DreamGymEventClient[]> {
  const dg = await getDreamGymAdmin(userId, playerId);
  if (!dg) return [];
  let events = dg.events;
  if (options?.startDate) events = events.filter((e) => e.date >= options.startDate!);
  if (options?.endDate) events = events.filter((e) => e.date <= options.endDate!);
  return events;
}

export async function addMentalCheckInAdmin(
  _userId: string,
  playerId: string,
  checkIn: Omit<DreamGymMentalCheckIn, "date">
): Promise<void> {
  const row = await db.query.dreamGym.findFirst({
    where: eq(dreamGym.playerId, playerId),
  });
  if (!row) throw new Error("Dream Gym profile not found");

  const now = new Date();
  const newCheckIn: DreamGymMentalCheckIn = {
    ...checkIn,
    date: now as unknown as DreamGymMentalCheckIn["date"],
  };
  const updatedCheckIns = [...(row.mentalCheckIns ?? []), newCheckIn].slice(-30);

  await db
    .update(dreamGym)
    .set({
      mentalCheckIns: updatedCheckIns,
      mentalLastCheckIn: now,
      updatedAt: now,
    })
    .where(eq(dreamGym.playerId, playerId));
}

export async function updateWeeklyGridAdmin(
  _userId: string,
  playerId: string,
  weeklyGrid: Record<string, Record<string, string | null>>
): Promise<void> {
  const now = new Date();
  const existing = await db.query.dreamGym.findFirst({
    where: eq(dreamGym.playerId, playerId),
  });

  if (existing) {
    await db
      .update(dreamGym)
      .set({ weeklyGrid, updatedAt: now })
      .where(eq(dreamGym.playerId, playerId));
    return;
  }

  // No existing record — match the Firestore set({ merge: true }) behaviour
  // by creating a minimal scaffold record. The profile/schedule columns are
  // NOT NULL, so we plant placeholder shells that callers can overwrite later
  // via upsertDreamGymAdmin.
  await db.insert(dreamGym).values({
    id: crypto.randomUUID(),
    playerId,
    profile: {
      hasGymAccess: false,
      hasHomeEquipment: false,
      equipmentTags: [],
      sport: "soccer",
      position: "CM",
      goals: [],
      intensity: "normal",
      onboardingComplete: false,
    } as DreamGymProfile,
    schedule: {
      monday: "off",
      tuesday: "off",
      wednesday: "off",
      thursday: "off",
      friday: "off",
      saturday: "off",
      sunday: "off",
    } as DreamGymSchedule,
    events: [],
    mentalCheckIns: [],
    mentalFavoriteTips: [],
    mentalLastCheckIn: null,
    weeklyGrid,
    createdAt: now,
    updatedAt: now,
  });
}

type DreamGymEventInputAdmin = Omit<DreamGymEvent, "id" | "date"> & {
  date: Date;
};

export async function addDreamGymEventAdmin(
  _userId: string,
  playerId: string,
  event: DreamGymEventInputAdmin
): Promise<string> {
  const row = await db.query.dreamGym.findFirst({
    where: eq(dreamGym.playerId, playerId),
  });
  if (!row) throw new Error("Dream Gym profile not found");

  const eventId = `event_${Date.now()}`;
  const newEvent: DreamGymEvent = {
    ...event,
    id: eventId,
    date: event.date as unknown as DreamGymEvent["date"],
  };
  const updatedEvents = [...(row.events ?? []), newEvent];

  await db
    .update(dreamGym)
    .set({ events: updatedEvents, updatedAt: new Date() })
    .where(eq(dreamGym.playerId, playerId));

  return eventId;
}

export async function removeDreamGymEventAdmin(
  _userId: string,
  playerId: string,
  eventId: string
): Promise<void> {
  const row = await db.query.dreamGym.findFirst({
    where: eq(dreamGym.playerId, playerId),
  });
  if (!row) throw new Error("Dream Gym profile not found");

  const updatedEvents = (row.events ?? []).filter((e: DreamGymEvent) => e.id !== eventId);
  await db
    .update(dreamGym)
    .set({ events: updatedEvents, updatedAt: new Date() })
    .where(eq(dreamGym.playerId, playerId));
}
