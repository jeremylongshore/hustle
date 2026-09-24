/**
 * Account deletion + export, against an in-memory SQLite DB and a temp upload dir.
 * Two families are seeded; family A deletes/exports, family B must be untouched/absent.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";
import { users, verificationTokens, sessions } from "@/lib/db/schema/auth";
import { players } from "@/lib/db/schema/players";
import { workspaces, workspaceMembers } from "@/lib/db/schema/workspaces";
import { games } from "@/lib/db/schema/games";
import { biometricsLogs } from "@/lib/db/schema/biometrics";
import { waitlist } from "@/lib/db/schema/waitlist";

describe("account deletion and export", () => {
  let testDb: TestDB;
  let close: () => void;
  let a: { userId: string; workspaceId: string; playerId: string };
  let b: { userId: string; workspaceId: string; playerId: string };
  let storageRoot: string;

  const now = () => new Date();

  async function seedAthleteData(owner: typeof a) {
    await testDb.insert(games).values({
      id: crypto.randomUUID(), playerId: owner.playerId, workspaceId: owner.workspaceId,
      date: now(), opponent: "Rivals FC", result: "Win", finalScore: "2-1",
      minutesPlayed: 70, goals: 1, assists: 0, createdAt: now(), updatedAt: now(),
    } as never);
    await testDb.insert(biometricsLogs).values({
      id: crypto.randomUUID(), playerId: owner.playerId, date: now(),
      restingHeartRate: 55, source: "manual", createdAt: now(), updatedAt: now(),
    } as never);
    const dir = path.join(storageRoot, owner.userId, "players", owner.playerId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "photo.jpg"), "x");
  }

  beforeEach(async () => {
    vi.resetModules();
    ({ db: testDb, close } = makeTestDb());
    mockDbModule(testDb);
    storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hustle-uploads-"));
    process.env.STORAGE_ROOT = storageRoot;
    a = await seedBaseHierarchy(testDb);
    b = await seedBaseHierarchy(testDb);
    await seedAthleteData(a);
    await seedAthleteData(b);
    await testDb.update(users).set({ passwordHash: "secret-hash", verificationPinHash: "pin-hash" }).where(eq(users.id, a.userId));
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
    fs.rmSync(storageRoot, { recursive: true, force: true });
    delete process.env.STORAGE_ROOT;
  });

  it("deletes the user, athletes, athlete data, workspace, tokens, waitlist entry and uploads", async () => {
    const aUser = (await testDb.select().from(users).where(eq(users.id, a.userId)).get())!;
    await testDb.insert(verificationTokens).values({ identifier: aUser.email, token: "t1", expires: now() } as never);
    await testDb.insert(waitlist).values({ email: aUser.email } as never);
    await testDb.insert(sessions).values({ sessionToken: "s1", userId: a.userId, expires: now() });

    const { deleteAccount } = await import("./delete-account");
    const result = await deleteAccount(a.userId);

    expect(result).toMatchObject({ athletesDeleted: 1, workspacesDeleted: 1 });
    expect(result.emailHash).toMatch(/^[0-9a-f]{16}$/);
    expect(await testDb.select().from(users).where(eq(users.id, a.userId)).all()).toHaveLength(0);
    expect(await testDb.select().from(players).where(eq(players.userId, a.userId)).all()).toHaveLength(0);
    expect(await testDb.select().from(games).where(eq(games.playerId, a.playerId)).all()).toHaveLength(0);
    expect(await testDb.select().from(biometricsLogs).where(eq(biometricsLogs.playerId, a.playerId)).all()).toHaveLength(0);
    expect(await testDb.select().from(workspaces).where(eq(workspaces.id, a.workspaceId)).all()).toHaveLength(0);
    expect(await testDb.select().from(verificationTokens).all()).toHaveLength(0);
    expect(await testDb.select().from(waitlist).all()).toHaveLength(0);
    expect(await testDb.select().from(sessions).all()).toHaveLength(0);
    expect(fs.existsSync(path.join(storageRoot, a.userId))).toBe(false);
  });

  it("leaves the other family completely untouched", async () => {
    const { deleteAccount } = await import("./delete-account");
    await deleteAccount(a.userId);

    expect(await testDb.select().from(users).where(eq(users.id, b.userId)).all()).toHaveLength(1);
    expect(await testDb.select().from(games).where(eq(games.playerId, b.playerId)).all()).toHaveLength(1);
    expect(await testDb.select().from(biometricsLogs).where(eq(biometricsLogs.playerId, b.playerId)).all()).toHaveLength(1);
    expect(fs.existsSync(path.join(storageRoot, b.userId, "players", b.playerId, "photo.jpg"))).toBe(true);
  });

  it("re-attributes membership rows it added in another family's workspace instead of failing", async () => {
    // A (as a co-manager) added a coach to B's workspace: addedBy = A is NOT NULL / ON DELETE NO ACTION.
    const third = await seedBaseHierarchy(testDb);
    await testDb.insert(workspaceMembers).values({
      workspaceId: b.workspaceId, userId: third.userId, email: "coach@example.com", role: "viewer", addedAt: now(), addedBy: a.userId,
    } as never);

    const { deleteAccount } = await import("./delete-account");
    await deleteAccount(a.userId);

    const row = await testDb.select().from(workspaceMembers).where(eq(workspaceMembers.workspaceId, b.workspaceId)).get();
    expect(row?.addedBy).toBe(b.userId);
  });

  it("refuses while an owned workspace has a live Stripe subscription", async () => {
    await testDb.update(workspaces)
      .set({ billingStripeSubscriptionId: "sub_123", status: "active" })
      .where(eq(workspaces.id, a.workspaceId));

    const { deleteAccount } = await import("./delete-account");
    await expect(deleteAccount(a.userId)).rejects.toMatchObject({ code: "ACTIVE_SUBSCRIPTION" });
    expect(await testDb.select().from(users).where(eq(users.id, a.userId)).all()).toHaveLength(1);
  });

  it("exports the family's data without secrets or another family's rows", async () => {
    const { buildAccountExport } = await import("./export-account");
    const data = await buildAccountExport(a.userId);

    expect(data.formatVersion).toBe(1);
    expect(data.account.id).toBe(a.userId);
    expect(data.account).not.toHaveProperty("passwordHash");
    expect(data.account).not.toHaveProperty("verificationPinHash");
    expect(data.workspaces[0]).not.toHaveProperty("billingStripeCustomerId");
    expect(data.athletes.map((p) => p.id)).toEqual([a.playerId]);
    expect((data.games as { playerId: string }[]).map((g) => g.playerId)).toEqual([a.playerId]);
    expect((data.biometricsLogs as { playerId: string }[])).toHaveLength(1);
    expect(JSON.stringify(data)).not.toContain(b.playerId);
    expect(JSON.stringify(data)).not.toContain("secret-hash");
  });
});
