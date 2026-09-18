/**
 * GET /api/health Tests
 *
 * Verifies health check behavior in non-production (DB check skipped) and
 * production (DB check exercised). The DB layer is the in-memory SQLite
 * harness from test-utils so the `select 1` ping really runs.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";

let testDb: TestDB;
let closeDb: () => void;

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  const { db, close } = makeTestDb();
  testDb = db;
  closeDb = close;
  mockDbModule(testDb);
  vi.resetModules();
  setEnv({ SMTP_HOST: 'smtp.example.invalid', SMTP_USER: 'fixture@example.invalid',
    SMTP_PASS: 'fixture-password', SMTP_PORT: '465', SMTP_SECURE: 'true',
    EMAIL_FROM: 'fixture@example.invalid' });
});

afterEach(() => {
  closeDb();
  process.env = { ...ORIGINAL_ENV };
});

function setEnv(env: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe("GET /api/health", () => {
  it("returns 200 healthy in development without DB ping", async () => {
    setEnv({
      NODE_ENV: "development",
      BILLING_ENABLED: "false",
    });
    const { GET } = await import("./route");
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("skipped");
  });

  it("returns 200 healthy in production with DB ping success", async () => {
    setEnv({
      NODE_ENV: "production",
      STRIPE_SECRET_KEY: "sk_test",
      EMAIL_FROM: "from@example.com",
    });
    const { GET } = await import("./route");
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("pass");
    expect(typeof body.checks.database.responseTime).toBe("number");
  });

  it("returns 503 unhealthy when STRIPE_SECRET_KEY missing and billing enabled", async () => {
    setEnv({
      NODE_ENV: "production",
      STRIPE_SECRET_KEY: undefined,
      BILLING_ENABLED: "true",
    });
    const { GET } = await import("./route");
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.environment.missing).toContain("STRIPE_SECRET_KEY");
  });

  it("does not require STRIPE_SECRET_KEY when billing disabled", async () => {
    setEnv({
      NODE_ENV: "production",
      STRIPE_SECRET_KEY: undefined,
      BILLING_ENABLED: "false",
    });
    const { GET } = await import("./route");
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("healthy");
  });

  it("does not label missing email configuration as healthy", async () => {
    setEnv({ NODE_ENV: "development", BILLING_ENABLED: "false", SMTP_PASS: undefined });
    const { GET } = await import("./route");
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.email.missing).toEqual(["SMTP_PASS"]);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("response shape includes version + service + latencyMs", async () => {
    setEnv({ NODE_ENV: "development", BILLING_ENABLED: "false" });
    const { GET } = await import("./route");
    const body = await (await GET()).json();
    expect(body.service).toBe("hustle-api");
    expect(typeof body.version).toBe("string");
    expect(typeof body.latencyMs).toBe("number");
  });
});
