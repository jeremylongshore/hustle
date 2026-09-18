import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * SQLite-backed fixed-window rate limiter.
 *
 * Why SQLite: the previous limiter was an in-memory Map inside one route, so it
 * reset on every deploy and protected nothing else. Hustle runs as a single
 * container with a single SQLite file, which makes one atomic UPSERT a correct
 * shared counter without adding Redis.
 */

export interface RateLimitRule {
  /** Namespace for the key, e.g. "login:email". */
  name: string;
  /** Maximum requests allowed per window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds until the current window resets (0 when allowed). */
  retryAfterMs: number;
}

export const RATE_LIMITS = {
  loginByEmail: { name: "login:email", max: 10, windowMs: 15 * 60_000 },
  loginByIp: { name: "login:ip", max: 30, windowMs: 15 * 60_000 },
  registerByIp: { name: "register:ip", max: 5, windowMs: 60 * 60_000 },
  passwordResetByEmail: { name: "reset:email", max: 5, windowMs: 60 * 60_000 },
  passwordResetByIp: { name: "reset:ip", max: 20, windowMs: 60 * 60_000 },
  verificationEmailByIp: { name: "verify-mail:ip", max: 10, windowMs: 60 * 60_000 },
  pinByUser: { name: "pin:user", max: 10, windowMs: 15 * 60_000 },
  gameCreateByUser: { name: "games:user", max: 10, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitRule>;

/** Hash identifiers so emails/IPs are not stored in plaintext. */
function hashIdentifier(identifier: string): string {
  return crypto.createHash("sha256").update(identifier.toLowerCase().trim()).digest("hex").slice(0, 32);
}

/**
 * Test-only headroom: E2E runs sign in and register dozens of times from one IP.
 * RATE_LIMIT_SCALE (server-only env, default 1) multiplies the max of
 * **per-IP rules only** (names ending in ":ip"). Per-user and per-email limits
 * stay exact, so E2E still exercises real blocking. Values of 1 or less and
 * non-numbers are ignored, so the setting can only loosen limits, never disable
 * them. Production does not set it.
 */
function effectiveMax(rule: RateLimitRule): number {
  if (!rule.name.endsWith(":ip")) return rule.max;
  const scale = Number(process.env.RATE_LIMIT_SCALE ?? "1");
  return Number.isFinite(scale) && scale > 1 ? Math.floor(rule.max * scale) : rule.max;
}

let lastPruneAt = 0;
const PRUNE_INTERVAL_MS = 10 * 60_000;
const PRUNE_AGE_MS = 24 * 60 * 60_000;

function pruneStale(now: number): void {
  if (now - lastPruneAt < PRUNE_INTERVAL_MS) return;
  lastPruneAt = now;
  db.run(sql`DELETE FROM rateLimit WHERE windowStart < ${now - PRUNE_AGE_MS}`);
}

/**
 * Count one request against `rule` for `identifier` and report whether it is allowed.
 * The increment and window roll-over happen in a single atomic statement.
 */
export function consumeRateLimit(
  rule: RateLimitRule,
  identifier: string,
  now: number = Date.now(),
): RateLimitResult {
  const key = `${rule.name}:${hashIdentifier(identifier)}`;
  const expired = now - rule.windowMs;

  const row = db.get<{ count: number; windowStart: number }>(sql`
    INSERT INTO rateLimit (key, windowStart, count) VALUES (${key}, ${now}, 1)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN rateLimit.windowStart <= ${expired} THEN 1 ELSE rateLimit.count + 1 END,
      windowStart = CASE WHEN rateLimit.windowStart <= ${expired} THEN ${now} ELSE rateLimit.windowStart END
    RETURNING count, windowStart
  `);

  pruneStale(now);

  if (row.count <= effectiveMax(rule)) {
    return { allowed: true, retryAfterMs: 0 };
  }
  return { allowed: false, retryAfterMs: Math.max(0, row.windowStart + rule.windowMs - now) };
}

/**
 * Client IP as seen by Caddy. Caddy (without trusted_proxies) replaces any
 * client-supplied X-Forwarded-For with the real peer address, and a proxy
 * appends rather than prepends, so the right-most entry is the trustworthy one.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Standard 429 body + Retry-After header value (seconds). */
export function rateLimitResponseInit(result: RateLimitResult) {
  return {
    body: {
      error: "RATE_LIMITED",
      message: "Too many attempts. Please wait a few minutes and try again.",
    },
    init: {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))) },
    },
  };
}
