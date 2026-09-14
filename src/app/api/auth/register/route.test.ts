import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import { users, verificationTokens } from "@/lib/db/schema/auth";
import { workspaces, workspaceMembers } from "@/lib/db/schema/workspaces";

describe("registration HTTP persistence", () => {
  let testDb: TestDB;
  let close: () => void;
  let route: typeof import("./route");
  const send = vi.fn().mockResolvedValue(undefined);
  beforeEach(async () => {
    vi.resetModules(); send.mockReset().mockResolvedValue(undefined);
    ({ db: testDb, close } = makeTestDb()); mockDbModule(testDb);
    vi.doMock("@/lib/resend", () => ({ sendVerificationEmail: send }));
    route = process.env.HUSTLE_TEST_REGISTER_FIXTURE
      ? await import(process.env.HUSTLE_TEST_REGISTER_FIXTURE)
      : await import("./route");
  });
  afterEach(() => { close(); vi.doUnmock("@/lib/db"); vi.doUnmock("@/lib/resend"); });
  function request() {
    return new NextRequest("https://hustlestats.io/api/auth/register", { method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "Parent@Example.com", password: "fixture-password", name: "Parent" }) });
  }

  it("returns a user whose workspace exists before sending verification mail", async () => {
    send.mockImplementationOnce(async () => {
      expect(testDb.select().from(users).get()!.defaultWorkspaceId).toBeTruthy();
      expect(testDb.select().from(workspaces).all()).toHaveLength(1);
    });
    const response = await route.POST(request());
    expect(response.status).toBe(200);
    const result = await response.json();
    const user = testDb.select().from(users).get()!;
    expect(result.userId).toBe(user.id);
    expect(user.defaultWorkspaceId).toBeTruthy();
    expect(testDb.select().from(workspaceMembers).get()!.userId).toBe(user.id);
    expect(testDb.select().from(verificationTokens).all()).toHaveLength(1);
    expect(send).toHaveBeenCalledOnce();
  });

  it("duplicate concurrent registrations yield one account and a conflict", async () => {
    const responses = await Promise.all([route.POST(request()), route.POST(request())]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(testDb.select().from(users).all()).toHaveLength(1);
    expect(testDb.select().from(workspaces).all()).toHaveLength(1);
    expect(send).toHaveBeenCalledOnce();
  });

  it("mail failure leaves complete account provisioning available for resend", async () => {
    send.mockRejectedValueOnce(new Error("fixture transport unavailable"));
    expect((await route.POST(request())).status).toBe(200);
    expect(testDb.select().from(users).get()!.defaultWorkspaceId).toBeTruthy();
    expect(testDb.select().from(verificationTokens).all()).toHaveLength(1);
  });
});
