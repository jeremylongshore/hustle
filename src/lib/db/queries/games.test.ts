/**
 * Unit tests for games query module (in-memory SQLite).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";

describe("games query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let userId: string;
  let workspaceId: string;
  let playerId: string;
  let qm: typeof import("./games");

  beforeEach(async () => {
    // CI also builds the E2E application in this job. Unit tests exercise
    // normal verification regardless of the surrounding job's E2E flag.
    vi.stubEnv("NEXT_PUBLIC_E2E_TEST_MODE", "false");
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);
    ({ userId, workspaceId, playerId } = await seedBaseHierarchy(testDb));
    qm = await import("./games");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
    vi.unstubAllEnvs();
  });

  it("create + get + verify lifecycle", async () => {
    const created = await qm.createGameAdmin(userId, playerId, {
      workspaceId,
      date: new Date("2026-05-01"),
      opponent: "Rival FC",
      result: "Win",
      finalScore: "3-1",
      minutesPlayed: 60,
      goals: 2,
      assists: 1,
    });

    expect(created.verified).toBe(false);

    const fetched = await qm.getGameAdmin(userId, playerId, created.id);
    expect(fetched?.goals).toBe(2);

    await qm.verifyGameAdmin(userId, playerId, created.id);
    const afterVerify = await qm.getGameAdmin(userId, playerId, created.id);
    expect(afterVerify?.verified).toBe(true);
    expect(afterVerify?.verifiedAt).toBeInstanceOf(Date);
  });

  it("aggregates: counts verified/unverified across user's players", async () => {
    const g1 = await qm.createGameAdmin(userId, playerId, {
      workspaceId,
      date: new Date("2026-05-01"),
      opponent: "A",
      result: "Win",
      finalScore: "1-0",
      minutesPlayed: 60,
    });
    const g2 = await qm.createGameAdmin(userId, playerId, {
      workspaceId,
      date: new Date("2026-05-02"),
      opponent: "B",
      result: "Loss",
      finalScore: "0-1",
      minutesPlayed: 60,
    });
    await qm.verifyGameAdmin(userId, playerId, g1.id);

    const verified = await qm.getVerifiedGamesCountAdmin(userId);
    const unverified = await qm.getUnverifiedGamesCountAdmin(userId);
    expect(verified).toBe(1);
    expect(unverified).toBe(1);

    const first = await qm.getFirstPendingGameAdmin(userId);
    expect(first?.playerId).toBe(playerId);
    expect(g2.id).toBeTruthy(); // anchor
  });

  it("getAllGames joins player info into the result", async () => {
    await qm.createGameAdmin(userId, playerId, {
      workspaceId,
      date: new Date("2026-05-01"),
      opponent: "X",
      result: "Win",
      finalScore: "1-0",
      minutesPlayed: 60,
    });

    const all = await qm.getAllGamesAdmin(userId);
    expect(all).toHaveLength(1);
    expect(all[0].player.id).toBe(playerId);
    expect(all[0].player.name).toBe("Test Player");
  });

  it("auto-verifies only when E2E mode is explicitly enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_E2E_TEST_MODE", "true");
    const created = await qm.createGameAdmin(userId, playerId, {
      workspaceId,
      date: new Date("2026-05-01"),
      opponent: "E2E fixture",
      result: "Win",
      finalScore: "1-0",
      minutesPlayed: 60,
    });

    expect(created.verified).toBe(true);
    const persisted = await qm.getGameAdmin(userId, playerId, created.id);
    expect(persisted?.verified).toBe(true);
    expect(persisted?.verifiedAt).toBeInstanceOf(Date);
    expect(await qm.getUnverifiedGamesCountAdmin(userId)).toBe(0);
  });
});
