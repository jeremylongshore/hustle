/**
 * Co-signed stats (bead hustle-4dc.9): parent PIN signatures become
 * gameVerification rows; the 0005 migration backfills existing verified games.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";
import { users } from "@/lib/db/schema/auth";
import { games } from "@/lib/db/schema/games";
import { gameVerifications } from "@/lib/db/schema/game-verifications";

describe("game co-signatures", () => {
  let testDb: TestDB;
  let close: () => void;
  let a: { userId: string; workspaceId: string; playerId: string };
  let b: { userId: string; workspaceId: string; playerId: string };
  let q: typeof import("./games");

  async function insertGame(owner: typeof a, verified = false) {
    const id = crypto.randomUUID();
    const now = new Date();
    await testDb.insert(games).values({
      id, playerId: owner.playerId, workspaceId: owner.workspaceId, date: now,
      opponent: "Rivals FC", result: "Win", finalScore: "2-1", minutesPlayed: 70,
      goals: 1, assists: 0, verified, verifiedAt: verified ? now : null, createdAt: now, updatedAt: now,
    } as never);
    return id;
  }

  beforeEach(async () => {
    vi.resetModules();
    ({ db: testDb, close } = makeTestDb());
    mockDbModule(testDb);
    a = await seedBaseHierarchy(testDb);
    b = await seedBaseHierarchy(testDb);
    await testDb.update(users).set({ firstName: "Dana", lastName: "Reyes" }).where(eq(users.id, a.userId));
    q = await import("./games");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("records a named parent signature and sets the verified flag", async () => {
    const gameId = await insertGame(a);
    const v = await q.verifyGameAdmin(a.userId, a.playerId, gameId);

    expect(v).toMatchObject({ signerRole: "parent", signerName: "Dana Reyes", method: "pin" });
    const game = await testDb.select().from(games).where(eq(games.id, gameId)).get();
    expect(game?.verified).toBe(true);
    expect(game?.verifiedAt).toBeInstanceOf(Date);
    const rows = await testDb.select().from(gameVerifications).where(eq(gameVerifications.gameId, gameId)).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].signerUserId).toBe(a.userId);
  });

  it("refuses a second parent signature on the same game", async () => {
    const gameId = await insertGame(a);
    await q.verifyGameAdmin(a.userId, a.playerId, gameId);
    await expect(q.verifyGameAdmin(a.userId, a.playerId, gameId)).rejects.toMatchObject({ code: "ALREADY_VERIFIED" });
    expect(await testDb.select().from(gameVerifications).all()).toHaveLength(1);
  });

  it("refuses another family signing or reading this athlete's games", async () => {
    const gameId = await insertGame(a);
    await expect(q.verifyGameAdmin(b.userId, a.playerId, gameId)).rejects.toMatchObject({ code: "PLAYER_NOT_OWNED" });
    await expect(q.getGameVerificationsAdmin(b.userId, a.playerId, [gameId])).rejects.toMatchObject({ code: "PLAYER_NOT_OWNED" });
    expect(await testDb.select().from(gameVerifications).all()).toHaveLength(0);
  });

  it("lists signatures per game and ignores game ids from another athlete", async () => {
    const mine = await insertGame(a);
    const theirs = await insertGame(b);
    await q.verifyGameAdmin(a.userId, a.playerId, mine);
    await q.verifyGameAdmin(b.userId, b.playerId, theirs);

    const map = await q.getGameVerificationsAdmin(a.userId, a.playerId, [mine, theirs]);
    expect([...map.keys()]).toEqual([mine]);
    expect(map.get(mine)?.[0].signerName).toBe("Dana Reyes");
  });

  it("deleting a game removes its signatures (cascade)", async () => {
    const gameId = await insertGame(a);
    await q.verifyGameAdmin(a.userId, a.playerId, gameId);
    await testDb.delete(games).where(eq(games.id, gameId));
    expect(await testDb.select().from(gameVerifications).all()).toHaveLength(0);
  });

  it("migration 0005 backfills one parent signature per already-verified game", async () => {
    const verified = await insertGame(a, true);
    await insertGame(a, false);

    const migration = fs.readFileSync(path.resolve(process.cwd(), "drizzle/0005_game_verifications.sql"), "utf8");
    const backfill = migration.slice(migration.indexOf("INSERT INTO `gameVerification`"));
    testDb.run(sql.raw(backfill));

    const rows = await testDb.select().from(gameVerifications).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ gameId: verified, signerRole: "parent", signerName: "Dana Reyes", method: "pin", signerUserId: a.userId });
  });
});
