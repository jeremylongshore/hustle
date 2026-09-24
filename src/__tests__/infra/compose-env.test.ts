// @vitest-environment node
/**
 * Every environment variable the server reads must be passed into the container
 * by docker-compose.yml, or be listed below as deliberately optional.
 *
 * Why: compose uses an explicit `environment:` list, so a variable that is set in
 * /srv/hustle/.env but not listed there never reaches the app. HUSTLE_INTERNAL_TOKEN
 * was in exactly that state; trial reminders returned 401 nightly from 2026-09-14
 * until it was noticed on 2026-09-20.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..");

// Read by the code, intentionally NOT passed in production. Each needs a reason.
const OPTIONAL: Record<string, string> = {
  ANTHROPIC_API_KEY: "not configured in production; workout-strategy.ts checks for it and falls back, and claude.ts throws a typed error instead of calling out",
  APP_VERSION: "health route falls back to NEXT_PUBLIC_APP_VERSION, then a literal",
  NEXTAUTH_SECRET: "proxy.ts reads AUTH_SECRET first, which compose sets",
  RATE_LIMIT_SCALE: "multiplier that defaults to 1",
  STORAGE_ROOT: "defaults to /data/uploads, the volume compose mounts",
  WEBSITE_URL: "resend-verification falls back to APP_ORIGIN, which compose sets",
};

function composeEnvKeys(): Set<string> {
  const lines = readFileSync(join(ROOT, "docker-compose.yml"), "utf8").split("\n");
  const start = lines.findIndex((l) => /^\s{4}environment:\s*$/.test(l));
  expect(start, "docker-compose.yml has an app.environment block").toBeGreaterThan(-1);
  const keys = new Set<string>();
  for (const line of lines.slice(start + 1)) {
    if (/^\s{0,4}\S/.test(line)) break; // dedent = end of the block
    const m = /^\s{6}([A-Z][A-Z0-9_]*):/.exec(line);
    if (m) keys.add(m[1]);
  }
  return keys;
}

function serverEnvReads(dir = join(ROOT, "src"), found = new Map<string, string>()) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== "__tests__" && name !== "node_modules") serverEnvReads(path, found);
    } else if (/\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name)) {
      for (const m of readFileSync(path, "utf8").matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) {
        if (!m[1].startsWith("NEXT_PUBLIC_") && !found.has(m[1])) found.set(m[1], path.slice(ROOT.length + 1));
      }
    }
  }
  return found;
}

describe("docker-compose.yml passes the environment the server reads", () => {
  const passed = composeEnvKeys();
  const reads = serverEnvReads();

  it("passes the internal bearer token (the 2026-09 regression)", () => {
    expect(passed.has("HUSTLE_INTERNAL_TOKEN")).toBe(true);
  });

  it("passes a public origin to the Stripe return URLs, which otherwise fall back to localhost", () => {
    expect(passed.has("NEXTAUTH_URL")).toBe(true);
  });

  it("has no server env read that is neither passed nor declared optional", () => {
    const unaccounted = [...reads].filter(([k]) => !passed.has(k) && !(k in OPTIONAL)).map(([k, f]) => `${k} (${f})`);
    expect(unaccounted).toEqual([]);
  });

  it("keeps the optional list honest: nothing in it is actually passed or unused", () => {
    const stale = Object.keys(OPTIONAL).filter((k) => passed.has(k) || !reads.has(k));
    expect(stale).toEqual([]);
  });
});
