/**
 * Unit tests for schedule-events query module (in-memory SQLite).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";

describe("schedule-events query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let userId: string;
  let playerId: string;
  let qm: typeof import("./schedule-events");

  beforeEach(async () => {
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);
    ({ userId, playerId } = await seedBaseHierarchy(testDb));
    qm = await import("./schedule-events");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("create + get + update + delete round trip", async () => {
    const created = await qm.createScheduleEventAdmin(userId, {
      playerIds: [playerId],
      type: "game",
      title: "Saturday game",
      date: new Date("2026-05-15").toISOString(),
    });
    expect(created.title).toBe("Saturday game");

    const fetched = await qm.getScheduleEventAdmin(userId, created.id);
    expect(fetched?.id).toBe(created.id);

    const updated = await qm.updateScheduleEventAdmin(userId, created.id, {
      title: "Tournament final",
      location: "Stadium",
    });
    expect(updated.title).toBe("Tournament final");
    expect(updated.location).toBe("Stadium");

    await qm.deleteScheduleEventAdmin(userId, created.id);
    const gone = await qm.getScheduleEventAdmin(userId, created.id);
    expect(gone).toBeNull();
  });

  it("filters by player id and date range", async () => {
    // A second athlete owned by the same parent (events may only reference the
    // caller's own athletes; see ownership.test.ts for the cross-family case).
    const { players } = await import("@/lib/db/schema/players");
    const [{ workspaceId }] = await testDb.select({ workspaceId: players.workspaceId }).from(players).all();
    const otherPlayerId = crypto.randomUUID();
    await testDb.insert(players).values({
      id: otherPlayerId, userId, workspaceId, name: "Sibling Player", birthday: new Date("2014-03-01"),
      gender: "female", primaryPosition: "ST", leagueCode: "REC", teamClub: "Test FC",
      createdAt: new Date(), updatedAt: new Date(),
    });
    await qm.createScheduleEventAdmin(userId, {
      playerIds: [playerId],
      type: "game",
      title: "May 10",
      date: new Date("2026-05-10").toISOString(),
    });
    await qm.createScheduleEventAdmin(userId, {
      playerIds: [otherPlayerId],
      type: "practice",
      title: "May 12 other",
      date: new Date("2026-05-12").toISOString(),
    });
    await qm.createScheduleEventAdmin(userId, {
      playerIds: [playerId],
      type: "game",
      title: "June 5",
      date: new Date("2026-06-05").toISOString(),
    });

    const mine = await qm.getScheduleEventsAdmin(userId, { playerId });
    expect(mine).toHaveLength(2);

    const may = await qm.getScheduleEventsAdmin(userId, {
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-05-31"),
    });
    expect(may).toHaveLength(2);
  });

  it("link game records the link", async () => {
    const ev = await qm.createScheduleEventAdmin(userId, {
      playerIds: [playerId],
      type: "game",
      title: "Game",
      date: new Date().toISOString(),
    });

    await qm.linkGameToScheduleEventAdmin(userId, ev.id, "game-xyz", playerId);
    const after = await qm.getScheduleEventAdmin(userId, ev.id);
    expect(after?.linkedGameId).toBe("game-xyz");
    expect(after?.linkedGamePlayerId).toBe(playerId);
  });
});
