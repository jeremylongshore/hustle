/**
 * Schedule Events Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/schedule-events.ts.
 *
 * scheduleEvents lives at the user level (a family's athletes share a team
 * schedule). playerIds is a JSON list; filtering by player is done in JS to
 * stay portable.
 */

import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { scheduleEvents } from "@/lib/db/schema/schedule-events";
import type {
  ScheduleEvent,
  ScheduleEventType,
} from "@/types/domain";
import type {
  ScheduleEventCreateInput,
  ScheduleEventUpdateInput,
} from "@/lib/validations/schedule-event-schema";
import { assertPlayersOwnedBy } from "@/lib/db/queries/ownership";

type ScheduleEventRow = typeof scheduleEvents.$inferSelect;

function toScheduleEvent(row: ScheduleEventRow): ScheduleEvent {
  return {
    id: row.id,
    playerIds: row.playerIds,
    type: row.type,
    title: row.title,
    date: row.date,
    endDate: row.endDate,
    location: row.location,
    opponent: row.opponent,
    notes: row.notes,
    linkedGameId: row.linkedGameId,
    linkedGamePlayerId: row.linkedGamePlayerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createScheduleEventAdmin(
  userId: string,
  data: ScheduleEventCreateInput
): Promise<ScheduleEvent> {
  await assertPlayersOwnedBy(userId, data.playerIds ?? []);
  const now = new Date();
  const inserted = await db
    .insert(scheduleEvents)
    .values({
      id: crypto.randomUUID(),
      userId,
      playerIds: data.playerIds,
      type: data.type as ScheduleEventType,
      title: data.title,
      date: new Date(data.date),
      endDate: data.endDate ? new Date(data.endDate) : null,
      location: data.location ?? null,
      opponent: data.opponent ?? null,
      notes: data.notes ?? null,
      linkedGameId: null,
      linkedGamePlayerId: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return toScheduleEvent(inserted[0]);
}

export async function getScheduleEventAdmin(
  userId: string,
  eventId: string
): Promise<ScheduleEvent | null> {
  const row = await db.query.scheduleEvents.findFirst({
    where: and(eq(scheduleEvents.id, eventId), eq(scheduleEvents.userId, userId)),
  });
  return row ? toScheduleEvent(row) : null;
}

export async function getScheduleEventsAdmin(
  userId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    playerId?: string;
    type?: ScheduleEventType;
    limit?: number;
  }
): Promise<ScheduleEvent[]> {
  const conditions = [eq(scheduleEvents.userId, userId)];
  if (options?.startDate) conditions.push(gte(scheduleEvents.date, options.startDate));
  if (options?.endDate) conditions.push(lte(scheduleEvents.date, options.endDate));
  if (options?.type) conditions.push(eq(scheduleEvents.type, options.type));

  let rows = await db
    .select()
    .from(scheduleEvents)
    .where(and(...conditions))
    .orderBy(asc(scheduleEvents.date));

  if (options?.playerId) {
    rows = rows.filter((r) => r.playerIds.includes(options.playerId!));
  }
  if (options?.limit) {
    rows = rows.slice(0, options.limit);
  }

  return rows.map(toScheduleEvent);
}

export async function updateScheduleEventAdmin(
  userId: string,
  eventId: string,
  data: ScheduleEventUpdateInput
): Promise<ScheduleEvent> {
  const patch: Partial<typeof scheduleEvents.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.type !== undefined) patch.type = data.type as ScheduleEventType;
  if (data.title !== undefined) patch.title = data.title;
  if (data.date !== undefined) patch.date = new Date(data.date);
  if (data.endDate !== undefined) {
    patch.endDate = data.endDate ? new Date(data.endDate) : null;
  }
  if (data.location !== undefined) patch.location = data.location;
  if (data.opponent !== undefined) patch.opponent = data.opponent;
  if (data.notes !== undefined) patch.notes = data.notes;
  if (data.playerIds !== undefined) {
    await assertPlayersOwnedBy(userId, data.playerIds);
    patch.playerIds = data.playerIds;
  }

  const updated = await db
    .update(scheduleEvents)
    .set(patch)
    .where(and(eq(scheduleEvents.id, eventId), eq(scheduleEvents.userId, userId)))
    .returning();

  if (updated.length === 0) {
    throw new Error(`Failed to update schedule event: not found (id=${eventId})`);
  }
  return toScheduleEvent(updated[0]);
}

export async function deleteScheduleEventAdmin(
  userId: string,
  eventId: string
): Promise<void> {
  await db
    .delete(scheduleEvents)
    .where(and(eq(scheduleEvents.id, eventId), eq(scheduleEvents.userId, userId)));
}

export async function linkGameToScheduleEventAdmin(
  userId: string,
  eventId: string,
  gameId: string,
  playerId: string
): Promise<void> {
  await db
    .update(scheduleEvents)
    .set({
      linkedGameId: gameId,
      linkedGamePlayerId: playerId,
      updatedAt: new Date(),
    })
    .where(and(eq(scheduleEvents.id, eventId), eq(scheduleEvents.userId, userId)));
}
