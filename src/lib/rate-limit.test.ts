import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import { rateLimits } from "@/lib/db/schema/rate-limits";

describe("consumeRateLimit (SQLite fixed window)", () => {
  let testDb: TestDB;
  let close: () => void;
  let rl: typeof import("./rate-limit");
  const rule = { name: "test:rule", max: 3, windowMs: 60_000 };
  const t0 = 1_800_000_000_000;

  beforeEach(async () => {
    vi.resetModules();
    ({ db: testDb, close } = makeTestDb());
    mockDbModule(testDb);
    rl = await import("./rate-limit");
  });
  afterEach(() => { close(); vi.doUnmock("@/lib/db"); });

  it("allows exactly max requests in a window, then blocks with a retry-after", () => {
    expect([1, 2, 3].map(() => rl.consumeRateLimit(rule, "a@example.com", t0).allowed))
      .toEqual([true, true, true]);
    const blocked = rl.consumeRateLimit(rule, "a@example.com", t0 + 20_000);
    expect(blocked).toEqual({ allowed: false, retryAfterMs: 40_000 });
  });

  it("starts a fresh window once the previous one has expired", () => {
    for (let i = 0; i < 4; i++) rl.consumeRateLimit(rule, "b@example.com", t0);
    expect(rl.consumeRateLimit(rule, "b@example.com", t0 + 60_000).allowed).toBe(true);
    const row = testDb.select().from(rateLimits).get()!;
    expect(row).toMatchObject({ count: 1, windowStart: t0 + 60_000 });
  });

  it("keeps identifiers and rules independent", () => {
    for (let i = 0; i < 3; i++) rl.consumeRateLimit(rule, "c@example.com", t0);
    expect(rl.consumeRateLimit(rule, "d@example.com", t0).allowed).toBe(true);
    expect(rl.consumeRateLimit({ ...rule, name: "other" }, "c@example.com", t0).allowed).toBe(true);
    expect(rl.consumeRateLimit(rule, "c@example.com", t0).allowed).toBe(false);
  });

  it("treats identifiers case-insensitively and never stores them in plaintext", () => {
    rl.consumeRateLimit(rule, "Parent@Example.com", t0);
    rl.consumeRateLimit(rule, "parent@example.com", t0);
    const rows = testDb.select().from(rateLimits).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(2);
    expect(rows[0].key).not.toContain("example.com");
  });
});

describe("clientIp", () => {
  it("uses the right-most X-Forwarded-For entry (the one the proxy appended)", async () => {
    const { clientIp } = await import("./rate-limit");
    expect(clientIp(new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("RATE_LIMIT_SCALE", () => {
  let close: () => void;
  afterEach(() => { close(); vi.doUnmock("@/lib/db"); delete process.env.RATE_LIMIT_SCALE; });

  it.each([["10", 30, true], ["0", 3, false], ["nonsense", 3, false]])(
    "scale %s allows %i requests before blocking",
    async (scale, allowedCount) => {
      vi.resetModules();
      let testDb: TestDB;
      ({ db: testDb, close } = makeTestDb());
      mockDbModule(testDb);
      process.env.RATE_LIMIT_SCALE = scale;
      const rl = await import("./rate-limit");
      const rule = { name: "scale", max: 3, windowMs: 60_000 };
      for (let i = 0; i < allowedCount; i++) expect(rl.consumeRateLimit(rule, "x", 1).allowed).toBe(true);
      expect(rl.consumeRateLimit(rule, "x", 1).allowed).toBe(false);
    },
  );
});
