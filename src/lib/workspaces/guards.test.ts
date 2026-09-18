/**
 * Workspace Status Guards Tests
 *
 * In-memory SQLite harness — guards.ts now reads via Drizzle.
 *
 * Covers:
 *  - canWriteWithStatus / canReadWithStatus (pure)
 *  - getUpgradePrompt (pure)
 *  - assertWorkspaceActiveOrTrial / NotTerminated / PaymentCurrent (DB-backed)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import * as authSchema from "@/lib/db/schema/auth";
import * as workspacesSchema from "@/lib/db/schema/workspaces";
import type { WorkspaceStatus } from "@/types/domain";
import { WorkspaceAccessError } from "@/lib/workspaces/errors";

let testDb: TestDB;
let closeDb: () => void;
const USER_ID = "user-guards";
const WORKSPACE_ID = "ws-guards";

async function seed(status: WorkspaceStatus, trialEndsAt?: Date | null) {
  const now = new Date();
  await testDb.delete(workspacesSchema.workspaces);
  await testDb.delete(authSchema.users);
  await testDb.insert(authSchema.users).values({
    id: USER_ID,
    email: "u@example.com",
    name: "U",
    emailVerified: now,
    createdAt: now,
    updatedAt: now,
  });
  await testDb.insert(workspacesSchema.workspaces).values({
    id: WORKSPACE_ID,
    ownerUserId: USER_ID,
    name: "Test WS",
    plan: "starter",
    status,
    trialEndsAt: trialEndsAt ?? null,
    createdAt: now,
    updatedAt: now,
  });
}

beforeEach(async () => {
  const { db, close } = makeTestDb();
  testDb = db;
  closeDb = close;
  mockDbModule(testDb);
  vi.clearAllMocks();
});

afterEach(() => {
  closeDb();
  vi.resetModules();
});

describe("canWriteWithStatus / canReadWithStatus", () => {
  it("writes allowed only for active + trial", async () => {
    const { canWriteWithStatus } = await import("./guards");
    expect(canWriteWithStatus("active")).toBe(true);
    expect(canWriteWithStatus("trial")).toBe(true);
    expect(canWriteWithStatus("past_due")).toBe(false);
    expect(canWriteWithStatus("canceled")).toBe(false);
    expect(canWriteWithStatus("suspended")).toBe(false);
    expect(canWriteWithStatus("deleted")).toBe(false);
  });

  it("reads allowed for active, trial, past_due", async () => {
    const { canReadWithStatus } = await import("./guards");
    expect(canReadWithStatus("active")).toBe(true);
    expect(canReadWithStatus("trial")).toBe(true);
    expect(canReadWithStatus("past_due")).toBe(true);
    expect(canReadWithStatus("canceled")).toBe(false);
    expect(canReadWithStatus("suspended")).toBe(false);
    expect(canReadWithStatus("deleted")).toBe(false);
  });
});

describe("getUpgradePrompt", () => {
  it("returns a non-empty string for every known status", async () => {
    const { getUpgradePrompt } = await import("./guards");
    for (const s of [
      "active",
      "trial",
      "past_due",
      "canceled",
      "suspended",
      "deleted",
    ] as WorkspaceStatus[]) {
      expect(getUpgradePrompt(s)).toMatch(/.+/);
    }
  });
});

describe("assertWorkspaceActiveOrTrial", () => {
  it("allows active", async () => {
    await seed("active");
    const { assertWorkspaceActiveOrTrial } = await import("./guards");
    await expect(assertWorkspaceActiveOrTrial(WORKSPACE_ID)).resolves.not.toThrow();
  });

  it("allows trial when trial not expired", async () => {
    await seed("trial", new Date(Date.now() + 24 * 60 * 60 * 1000));
    const { assertWorkspaceActiveOrTrial } = await import("./guards");
    await expect(assertWorkspaceActiveOrTrial(WORKSPACE_ID)).resolves.not.toThrow();
  });

  it("throws TRIAL_EXPIRED when trial expired", async () => {
    await seed("trial", new Date(Date.now() - 24 * 60 * 60 * 1000));
    const { assertWorkspaceActiveOrTrial } = await import("./guards");
    await expect(assertWorkspaceActiveOrTrial(WORKSPACE_ID)).rejects.toMatchObject({
      code: "TRIAL_EXPIRED",
    });
  });

  it("throws PAYMENT_PAST_DUE for past_due", async () => {
    await seed("past_due");
    const { assertWorkspaceActiveOrTrial } = await import("./guards");
    await expect(assertWorkspaceActiveOrTrial(WORKSPACE_ID)).rejects.toMatchObject({
      code: "PAYMENT_PAST_DUE",
      httpStatus: 403,
    });
  });

  it.each([
    ["canceled", "SUBSCRIPTION_CANCELED"],
    ["suspended", "ACCOUNT_SUSPENDED"],
    ["deleted", "WORKSPACE_DELETED"],
  ] as Array<[WorkspaceStatus, string]>)("throws %s code for status %s", async (status, code) => {
    await seed(status);
    const { assertWorkspaceActiveOrTrial } = await import("./guards");
    await expect(assertWorkspaceActiveOrTrial(WORKSPACE_ID)).rejects.toMatchObject({ code });
  });

  it("throws WORKSPACE_NOT_FOUND when workspace missing", async () => {
    const { assertWorkspaceActiveOrTrial } = await import("./guards");
    await expect(assertWorkspaceActiveOrTrial("nope")).rejects.toMatchObject({
      code: "WORKSPACE_NOT_FOUND",
    });
  });

  it("throws WorkspaceAccessError instance (so callers can branch on it)", async () => {
    await seed("canceled");
    const { assertWorkspaceActiveOrTrial } = await import("./guards");
    try {
      await assertWorkspaceActiveOrTrial(WORKSPACE_ID);
      throw new Error("should not reach");
    } catch (e) {
      // resetModules() between tests reloads the class identity, so check
      // by name instead of instanceof.
      expect((e as Error).name).toBe("WorkspaceAccessError");
      expect((e as { code: string }).code).toBe("SUBSCRIPTION_CANCELED");
    }
  });
});

describe("assertWorkspaceNotTerminated", () => {
  it.each(["active", "trial", "past_due"] as WorkspaceStatus[])(
    "allows %s",
    async (status) => {
      await seed(status);
      const { assertWorkspaceNotTerminated } = await import("./guards");
      await expect(assertWorkspaceNotTerminated(WORKSPACE_ID)).resolves.not.toThrow();
    }
  );

  it.each(["canceled", "suspended", "deleted"] as WorkspaceStatus[])(
    "throws for %s",
    async (status) => {
      await seed(status);
      const { assertWorkspaceNotTerminated } = await import("./guards");
      await expect(assertWorkspaceNotTerminated(WORKSPACE_ID)).rejects.toMatchObject({
        httpStatus: 403,
      });
    }
  );
});

describe("assertWorkspacePaymentCurrent", () => {
  it.each(["active", "trial"] as WorkspaceStatus[])("allows %s", async (status) => {
    await seed(status);
    const { assertWorkspacePaymentCurrent } = await import("./guards");
    await expect(assertWorkspacePaymentCurrent(WORKSPACE_ID)).resolves.not.toThrow();
  });

  it.each(["past_due", "canceled", "suspended", "deleted"] as WorkspaceStatus[])(
    "throws for %s",
    async (status) => {
      await seed(status);
      const { assertWorkspacePaymentCurrent } = await import("./guards");
      await expect(assertWorkspacePaymentCurrent(WORKSPACE_ID)).rejects.toMatchObject({
        httpStatus: 403,
      });
    }
  );
});

// Reference the imported helper symbol so the bundler keeps the dep above.
void eq;
