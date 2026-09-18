/**
 * Workspace Status Enforcement Tests
 *
 * Asserts assertWorkspaceActive() throws the right WorkspaceAccessError
 * for each disabled status. No DB needed — this is pure logic.
 */

import { describe, it, expect, vi } from "vitest";
import {
  assertWorkspaceActive,
  getNextStep,
  getStatusErrorMessage,
  isWorkspaceWritable,
  isWorkspaceReadable,
} from "./enforce";
import { WorkspaceAccessError } from "@/lib/workspaces/errors";
import type { Workspace, WorkspaceStatus } from "@/types/domain";

function createTestWorkspace(status: WorkspaceStatus): Workspace {
  return {
    id: "test-workspace-id",
    ownerUserId: "test-user-id",
    name: "Test Workspace",
    plan: "starter",
    status,
    members: [],
    billing: {
      stripeCustomerId: "cus_test123",
      stripeSubscriptionId: "sub_test123",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    usage: {
      playerCount: 5,
      gamesThisMonth: 10,
      storageUsedMB: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as Workspace;
}

describe("assertWorkspaceActive", () => {
  it("rejects expired, exact-deadline and invalid trial dates", () => {
    const now = new Date("2026-09-13T20:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      for (const date of [new Date(now.getTime() - 1), now, new Date("invalid")]) {
        expect(() => assertWorkspaceActive({ ...createTestWorkspace("trial"), trialEndsAt: date }))
          .toThrow(expect.objectContaining({ code: "TRIAL_EXPIRED", httpStatus: 403 }));
      }
      expect(() => assertWorkspaceActive({ ...createTestWorkspace("trial"),
        trialEndsAt: new Date(now.getTime() + 1) })).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });

  it("preserves legacy null trial deadlines and ignores trial dates for paid active workspaces", () => {
    expect(() => assertWorkspaceActive({ ...createTestWorkspace("trial"), trialEndsAt: null }))
      .not.toThrow();
    expect(() => assertWorkspaceActive({ ...createTestWorkspace("active"),
      trialEndsAt: new Date("2000-01-01T00:00:00Z") })).not.toThrow();
  });

  it.each(["active", "trial"] as WorkspaceStatus[])(
    "allows %s",
    (status) => {
      expect(() => assertWorkspaceActive(createTestWorkspace(status))).not.toThrow();
    }
  );

  it("throws PAYMENT_PAST_DUE for past_due", () => {
    try {
      assertWorkspaceActive(createTestWorkspace("past_due"));
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(WorkspaceAccessError);
      expect((e as WorkspaceAccessError).code).toBe("PAYMENT_PAST_DUE");
      expect((e as WorkspaceAccessError).httpStatus).toBe(403);
    }
  });

  it("throws SUBSCRIPTION_CANCELED for canceled", () => {
    try {
      assertWorkspaceActive(createTestWorkspace("canceled"));
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as WorkspaceAccessError).code).toBe("SUBSCRIPTION_CANCELED");
    }
  });

  it("throws ACCOUNT_SUSPENDED for suspended", () => {
    try {
      assertWorkspaceActive(createTestWorkspace("suspended"));
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as WorkspaceAccessError).code).toBe("ACCOUNT_SUSPENDED");
    }
  });

  it("throws WORKSPACE_DELETED for deleted", () => {
    try {
      assertWorkspaceActive(createTestWorkspace("deleted"));
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as WorkspaceAccessError).code).toBe("WORKSPACE_DELETED");
    }
  });

  it("throws INVALID_WORKSPACE_STATUS for unknown status", () => {
    const bad = createTestWorkspace("rugpulled" as WorkspaceStatus);
    try {
      assertWorkspaceActive(bad);
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as WorkspaceAccessError).code).toBe("INVALID_WORKSPACE_STATUS");
    }
  });
});

describe("getNextStep", () => {
  it("returns null for active/trial", () => {
    expect(getNextStep("active")).toBeNull();
    expect(getNextStep("trial")).toBeNull();
  });
  it("returns update_payment for past_due", () => {
    expect(getNextStep("past_due")).toBe("update_payment");
  });
  it("returns upgrade for canceled", () => {
    expect(getNextStep("canceled")).toBe("upgrade");
  });
  it("returns contact_support for suspended/deleted", () => {
    expect(getNextStep("suspended")).toBe("contact_support");
    expect(getNextStep("deleted")).toBe("contact_support");
  });
});

describe("getStatusErrorMessage", () => {
  it("returns a non-empty string for every known status", () => {
    const statuses: WorkspaceStatus[] = [
      "active",
      "trial",
      "past_due",
      "canceled",
      "suspended",
      "deleted",
    ];
    for (const s of statuses) {
      expect(getStatusErrorMessage(s)).toMatch(/.+/);
    }
  });
});

describe("isWorkspaceWritable / isWorkspaceReadable", () => {
  it("only active + trial are writable", () => {
    expect(isWorkspaceWritable("active")).toBe(true);
    expect(isWorkspaceWritable("trial")).toBe(true);
    expect(isWorkspaceWritable("past_due")).toBe(false);
    expect(isWorkspaceWritable("canceled")).toBe(false);
    expect(isWorkspaceWritable("suspended")).toBe(false);
    expect(isWorkspaceWritable("deleted")).toBe(false);
  });

  it("past_due also readable; canceled/suspended/deleted are not", () => {
    expect(isWorkspaceReadable("active")).toBe(true);
    expect(isWorkspaceReadable("trial")).toBe(true);
    expect(isWorkspaceReadable("past_due")).toBe(true);
    expect(isWorkspaceReadable("canceled")).toBe(false);
    expect(isWorkspaceReadable("suspended")).toBe(false);
    expect(isWorkspaceReadable("deleted")).toBe(false);
  });
});
