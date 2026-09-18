import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Fixed-window rate-limit counters (see src/lib/rate-limit.ts).
 *
 * One row per limiter key, e.g. "login:email:<sha256>" or "games:user:<id>".
 * Stored in SQLite so counters survive deploys/restarts; the app runs as a
 * single container, so one SQLite file is a consistent shared store.
 */
export const rateLimits = sqliteTable("rateLimit", {
  key: text("key").primaryKey(),
  windowStart: integer("windowStart").notNull(), // epoch ms
  count: integer("count").notNull(),
});
