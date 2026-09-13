/**
 * POST /api/auth/resend-verification Tests
 *
 * In-memory SQLite harness; only sendEmail + email-templates are mocked.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import * as authSchema from "@/lib/db/schema/auth";

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  emailVerification: vi.fn(),
}));

vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/email-templates", () => ({
  emailTemplates: { emailVerification: mocks.emailVerification },
}));

let testDb: TestDB;
let closeDb: () => void;

const TEST_EMAIL = "user@example.com";

beforeEach(async () => {
  const { db, close } = makeTestDb();
  testDb = db;
  closeDb = close;
  mockDbModule(testDb);
  vi.clearAllMocks();

  vi.stubEnv('RESEND_API_KEY', undefined);
  vi.stubEnv('SMTP_HOST', 'smtp.example.invalid');
  vi.stubEnv('SMTP_PORT', '465');
  vi.stubEnv('SMTP_SECURE', 'true');
  vi.stubEnv('SMTP_USER', 'fixture@example.invalid');
  vi.stubEnv('SMTP_PASS', 'fixture-password');
  vi.stubEnv('EMAIL_FROM', 'fixture@example.invalid');

  mocks.emailVerification.mockReturnValue({
    subject: "Verify",
    html: "<p>Verify</p>",
    text: "Verify",
  });
  mocks.sendEmail.mockResolvedValue({ success: true });
});

afterEach(() => {
  closeDb();
  vi.unstubAllEnvs();
  vi.resetModules();
});

function buildReq(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/resend-verification", () => {
  it("rejects invalid email format", async () => {
    const { POST } = await import("./route");
    const res = await POST(buildReq({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 503 when email service is unconfigured", async () => {
    vi.stubEnv("SMTP_PASS", "");
    const { POST } = await import("./route");
    const res = await POST(buildReq({ email: TEST_EMAIL }));
    expect(res.status).toBe(503);
  });

  it("returns success for unknown user without leaking", async () => {
    const { POST } = await import("./route");
    const res = await POST(buildReq({ email: "nobody@example.com" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("returns success for already-verified user without resending", async () => {
    const now = new Date();
    await testDb.insert(authSchema.users).values({
      id: "u1",
      email: TEST_EMAIL,
      name: "Test",
      emailVerified: now,
      createdAt: now,
      updatedAt: now,
    });
    const { POST } = await import("./route");
    const res = await POST(buildReq({ email: TEST_EMAIL }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("issues a token and sends with SMTP configured and no Resend key", async () => {
    const now = new Date();
    await testDb.insert(authSchema.users).values({
      id: "u2",
      email: TEST_EMAIL,
      name: "Alice Doe",
      emailVerified: null,
      createdAt: now,
      updatedAt: now,
    });
    const { POST } = await import("./route");
    const res = await POST(buildReq({ email: TEST_EMAIL }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);

    const tok = await testDb.query.verificationTokens.findFirst({
      where: eq(authSchema.verificationTokens.identifier, TEST_EMAIL),
    });
    expect(tok).toBeDefined();
    expect(tok?.token.length).toBeGreaterThan(20);
  });

  it("surfaces sendEmail failure as 500", async () => {
    const now = new Date();
    await testDb.insert(authSchema.users).values({
      id: "u3",
      email: TEST_EMAIL,
      name: "User",
      emailVerified: null,
      createdAt: now,
      updatedAt: now,
    });
    mocks.sendEmail.mockResolvedValue({ success: false, error: "smtp down" });
    const { POST } = await import("./route");
    const res = await POST(buildReq({ email: TEST_EMAIL }));
    expect(res.status).toBe(500);
  });
});
