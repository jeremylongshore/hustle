/**
 * Journal Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/journal.ts.
 */

import { and, desc, eq, gte, lte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema/journal";
import type {
  JournalEntry,
  JournalContext,
  JournalMoodTag,
} from "@/types/domain";
import type {
  JournalEntryCreateInput,
  JournalEntryUpdateInput,
} from "@/lib/validations/journal-schema";

type JournalRow = typeof journalEntries.$inferSelect;

function toJournalEntry(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    playerId: row.playerId,
    date: row.date,
    content: row.content,
    context: row.context,
    moodTag: row.moodTag,
    energyTag: row.energyTag,
    linkedWorkoutId: row.linkedWorkoutId,
    linkedGameId: row.linkedGameId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createJournalEntryAdmin(
  _userId: string,
  playerId: string,
  data: JournalEntryCreateInput
): Promise<JournalEntry> {
  const now = new Date();
  const inserted = await db
    .insert(journalEntries)
    .values({
      id: crypto.randomUUID(),
      playerId,
      date: new Date(data.date),
      content: data.content,
      context: data.context as JournalContext,
      moodTag: data.moodTag ?? null,
      energyTag: data.energyTag ?? null,
      linkedWorkoutId: data.linkedWorkoutId ?? null,
      linkedGameId: data.linkedGameId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toJournalEntry(inserted[0]);
}

export async function getJournalEntryAdmin(
  _userId: string,
  playerId: string,
  entryId: string
): Promise<JournalEntry | null> {
  const row = await db.query.journalEntries.findFirst({
    where: and(eq(journalEntries.id, entryId), eq(journalEntries.playerId, playerId)),
  });
  return row ? toJournalEntry(row) : null;
}

export async function getJournalEntriesAdmin(
  _userId: string,
  playerId: string,
  options?: {
    context?: JournalContext;
    moodTag?: JournalMoodTag;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ entries: JournalEntry[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 20;
  const conditions = [eq(journalEntries.playerId, playerId)];
  if (options?.context) conditions.push(eq(journalEntries.context, options.context));
  if (options?.moodTag) conditions.push(eq(journalEntries.moodTag, options.moodTag));
  if (options?.startDate) conditions.push(gte(journalEntries.date, options.startDate));
  if (options?.endDate) conditions.push(lte(journalEntries.date, options.endDate));

  if (options?.cursor) {
    const cursorRow = await db.query.journalEntries.findFirst({
      where: eq(journalEntries.id, options.cursor),
    });
    if (cursorRow) conditions.push(lt(journalEntries.date, cursorRow.date));
  }

  const rows = await db
    .select()
    .from(journalEntries)
    .where(and(...conditions))
    .orderBy(desc(journalEntries.date), desc(journalEntries.id))
    .limit(limit + 1);

  const hasNextPage = rows.length > limit;
  const pageRows = rows.slice(0, limit);
  return {
    entries: pageRows.map(toJournalEntry),
    nextCursor: hasNextPage ? pageRows[pageRows.length - 1]?.id ?? null : null,
  };
}

export async function getRecentJournalEntriesAdmin(
  _userId: string,
  playerId: string,
  limit: number = 5
): Promise<JournalEntry[]> {
  const rows = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.playerId, playerId))
    .orderBy(desc(journalEntries.date))
    .limit(limit);

  return rows.map(toJournalEntry);
}

export async function updateJournalEntryAdmin(
  _userId: string,
  playerId: string,
  entryId: string,
  data: JournalEntryUpdateInput
): Promise<JournalEntry> {
  const patch: Partial<typeof journalEntries.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.date !== undefined) patch.date = new Date(data.date);
  if (data.content !== undefined) patch.content = data.content;
  if (data.context !== undefined) patch.context = data.context as JournalContext;
  if (data.moodTag !== undefined) patch.moodTag = data.moodTag;
  if (data.energyTag !== undefined) patch.energyTag = data.energyTag;
  if (data.linkedWorkoutId !== undefined) patch.linkedWorkoutId = data.linkedWorkoutId;
  if (data.linkedGameId !== undefined) patch.linkedGameId = data.linkedGameId;

  const updated = await db
    .update(journalEntries)
    .set(patch)
    .where(and(eq(journalEntries.id, entryId), eq(journalEntries.playerId, playerId)))
    .returning();

  if (updated.length === 0) {
    throw new Error(`Failed to update journal entry: not found (id=${entryId})`);
  }
  return toJournalEntry(updated[0]);
}

export async function deleteJournalEntryAdmin(
  _userId: string,
  playerId: string,
  entryId: string
): Promise<void> {
  await db
    .delete(journalEntries)
    .where(and(eq(journalEntries.id, entryId), eq(journalEntries.playerId, playerId)));
}

export async function getJournalEntriesByWorkoutAdmin(
  _userId: string,
  playerId: string,
  workoutId: string
): Promise<JournalEntry[]> {
  const rows = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.playerId, playerId),
        eq(journalEntries.linkedWorkoutId, workoutId)
      )
    );
  return rows.map(toJournalEntry);
}

export async function getJournalEntriesByGameAdmin(
  _userId: string,
  playerId: string,
  gameId: string
): Promise<JournalEntry[]> {
  const rows = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.playerId, playerId),
        eq(journalEntries.linkedGameId, gameId)
      )
    );
  return rows.map(toJournalEntry);
}
