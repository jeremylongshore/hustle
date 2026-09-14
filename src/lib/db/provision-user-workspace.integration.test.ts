import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq, sql } from "drizzle-orm";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import { users, verificationTokens } from "@/lib/db/schema/auth";
import { workspaces, workspaceMembers } from "@/lib/db/schema/workspaces";

const now = new Date("2026-09-13T20:00:00Z");
const trialMs = 14 * 86400_000;

describe("transactional registration and workspace recovery", () => {
  let testDb: TestDB;
  let close: () => void;
  let provision: typeof import("./provision-user-workspace");

  beforeEach(async () => {
    vi.resetModules();
    ({ db: testDb, close } = makeTestDb());
    mockDbModule(testDb);
    provision = await import("./provision-user-workspace");
  });
  afterEach(() => { close(); vi.doUnmock("@/lib/db"); });

  function orphan(createdAt: Date | null = now) {
    return testDb.insert(users).values({ email: crypto.randomUUID() + "@example.com", createdAt })
      .returning().get();
  }
  function registration() {
    return provision.registerUserWithWorkspace({
      email: "registration@example.com", name: "Parent", passwordHash: "fixture-hash",
      token: "fixture-token", tokenExpiresAt: new Date(now.getTime() + 86400_000),
    }, now);
  }

  it("commits user, free trial, owner membership, pointer and token together", () => {
    const result = registration();
    const user = testDb.select().from(users).get()!;
    const ws = testDb.select().from(workspaces).get()!;
    expect(user.defaultWorkspaceId).toBe(result.workspaceId);
    expect(user.emailVerified).toBeNull();
    expect(ws).toMatchObject({ ownerUserId: result.userId, plan: "free", status: "trial",
      usagePlayerCount: 0, usageGamesThisMonth: 0, billingStripeSubscriptionId: null });
    expect(ws.trialEndsAt?.getTime()).toBe(now.getTime() + trialMs);
    expect(ws.billingCurrentPeriodEnd).toEqual(ws.trialEndsAt);
    expect(testDb.select().from(workspaceMembers).get()).toMatchObject({
      workspaceId: ws.id, userId: user.id, role: "owner", addedBy: user.id,
    });
    expect(testDb.select().from(verificationTokens).all()).toHaveLength(1);
  });

  it("rejects duplicate delivery without creating a second tenant or token", () => {
    registration();
    expect(registration).toThrow(provision.RegistrationConflictError);
    for (const table of [users, workspaces, workspaceMembers, verificationTokens]) {
      expect(testDb.select().from(table).all()).toHaveLength(1);
    }
  });

  it("rolls back every row if verification-token persistence fails", () => {
    testDb.run(sql`CREATE TRIGGER reject_token BEFORE INSERT ON verificationToken
      BEGIN SELECT RAISE(ABORT, 'fixture token storage unavailable'); END`);
    expect(registration).toThrow();
    for (const table of [users, workspaces, workspaceMembers, verificationTokens]) {
      expect(testDb.select().from(table).all()).toHaveLength(0);
    }
  });

  it("repairs an orphan exactly once without restarting an expired trial", () => {
    const original = new Date(now.getTime() - 30 * 86400_000);
    const user = orphan(original);
    const first = provision.ensureDefaultWorkspaceForUser(user.id, now);
    const second = provision.ensureDefaultWorkspaceForUser(user.id, new Date(now.getTime() + trialMs));
    expect(second).toEqual({ workspaceId: first.workspaceId, outcome: "existing" });
    expect(testDb.select().from(workspaces).all()).toHaveLength(1);
    expect(testDb.select().from(workspaces).get()!.trialEndsAt?.getTime())
      .toBe(original.getTime() + trialMs);
  });

  it.each(["active", "past_due", "canceled", "suspended", "deleted"] as const)(
    "restores an owned %s tenant without changing paid state or usage", (status) => {
      const user = orphan();
      const ws = testDb.insert(workspaces).values({ ownerUserId: user.id, name: "Existing",
        plan: "plus", status, billingStripeSubscriptionId: "sub_fixture", usagePlayerCount: 4,
        trialEndsAt: new Date("2025-01-01T00:00:00Z") }).returning().get();
      expect(provision.ensureDefaultWorkspaceForUser(user.id, now))
        .toEqual({ workspaceId: ws.id, outcome: "linked" });
      expect(testDb.select().from(workspaces).get()).toEqual(ws);
      expect(testDb.select().from(workspaceMembers).get()!.role).toBe("owner");
    },
  );

  it("links the sole membership without promoting a collaborator to owner", () => {
    const owner = orphan(); const member = orphan();
    const ws = testDb.insert(workspaces).values({ ownerUserId: owner.id, name: "Team" }).returning().get();
    testDb.insert(workspaceMembers).values({ workspaceId: ws.id, userId: member.id,
      email: member.email, role: "viewer", addedBy: owner.id }).run();
    provision.ensureDefaultWorkspaceForUser(member.id, now);
    expect(testDb.select().from(workspaceMembers).get()!.role).toBe("viewer");
    expect(testDb.select().from(workspaces).all()).toHaveLength(1);
  });

  it("repairs a missing owner membership behind an existing valid default exactly once", () => {
    const user = orphan();
    const ws = testDb.insert(workspaces).values({ ownerUserId: user.id, name: "Paid",
      plan: "plus", status: "active", billingStripeSubscriptionId: "sub_fixture" }).returning().get();
    testDb.update(users).set({ defaultWorkspaceId: ws.id }).where(eq(users.id, user.id)).run();
    provision.ensureDefaultWorkspaceForUser(user.id, now);
    provision.ensureDefaultWorkspaceForUser(user.id, now);
    expect(testDb.select().from(workspaceMembers).all()).toHaveLength(1);
    expect(testDb.select().from(workspaceMembers).get()!.role).toBe("owner");
    expect(testDb.select().from(workspaces).get()).toEqual(ws);
  });

  it("preserves an existing membership role even when the user owns the default workspace", () => {
    const user = orphan();
    const ws = testDb.insert(workspaces).values({ ownerUserId: user.id, name: "Existing" }).returning().get();
    testDb.insert(workspaceMembers).values({ workspaceId: ws.id, userId: user.id,
      email: user.email, role: "admin", addedBy: user.id }).run();
    testDb.update(users).set({ defaultWorkspaceId: ws.id }).where(eq(users.id, user.id)).run();
    provision.ensureDefaultWorkspaceForUser(user.id, now);
    expect(testDb.select().from(workspaceMembers).get()!.role).toBe("admin");
  });

  it("refuses ambiguous owned workspaces instead of selecting or creating one", () => {
    const user = orphan();
    testDb.insert(workspaces).values([{ ownerUserId: user.id, name: "First" },
      { ownerUserId: user.id, name: "Second" }]).run();
    expect(() => provision.ensureDefaultWorkspaceForUser(user.id, now))
      .toThrow("WORKSPACE_PROVISION_AMBIGUOUS");
    expect(testDb.select().from(users).get()!.defaultWorkspaceId).toBeNull();
    expect(testDb.select().from(workspaces).all()).toHaveLength(2);
  });

  it("refuses a pointer into another tenant or a missing tenant", () => {
    const owner = orphan(); const user = orphan();
    const ws = testDb.insert(workspaces).values({ ownerUserId: owner.id, name: "Private" }).returning().get();
    for (const id of [ws.id, "missing-workspace"]) {
      testDb.update(users).set({ defaultWorkspaceId: id }).where(eq(users.id, user.id)).run();
      expect(() => provision.ensureDefaultWorkspaceForUser(user.id, now))
        .toThrow("WORKSPACE_PROVISION_INVALID_DEFAULT");
    }
    expect(testDb.select().from(workspaces).all()).toHaveLength(1);
  });

  it.each([null, new Date(now.getTime() + 86400_000)])("refuses unknown or future signup time %s", (date) => {
    const user = orphan(date);
    expect(() => provision.ensureDefaultWorkspaceForUser(user.id, now))
      .toThrow("WORKSPACE_PROVISION_REGISTRATION_DATE_INVALID");
    expect(testDb.select().from(workspaces).all()).toHaveLength(0);
  });
});
