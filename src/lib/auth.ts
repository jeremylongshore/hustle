/**
 * Server-Side Authentication (Auth.js v5 + SQLite/Drizzle)
 *
 * Phase 3.2 cutover: this module previously verified Firebase __session cookies
 * via firebase-admin. It now reads the NextAuth JWT session set by the
 * Credentials provider in src/auth.ts. The public function names + return
 * shapes are preserved so dashboard pages + API routes that already import
 * `auth()`, `authWithProfile()`, and `requireAuth()` continue to work without
 * changes.
 *
 * - `auth()`            – lightweight session check for API routes
 * - `authWithProfile()` – session + SQLite user profile for dashboard pages
 * - `requireAuth()`     – throws if unauthenticated or email unverified
 *
 * Notes:
 * - Email-verified gate: the Credentials provider's authorize() callback in
 *   src/auth.ts already rejects sign-in for users without emailVerified, so
 *   any active NextAuth session by definition represents a verified user. We
 *   still consult the DB row in authWithProfile() and reflect the actual
 *   timestamp for forensics.
 * - The legacy DashboardUser shape exposes `firstName`/`lastName` strings —
 *   we synthesize them by splitting the `name` field on the user row. When
 *   Phase 4 schemas a richer profile table these fields will read from the
 *   real columns.
 */
import { auth as nextAuth } from "@/auth";
import { eq } from "drizzle-orm";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { isE2ETestMode } from "@/lib/e2e";

export interface Session {
  user: {
    id: string;
    email: string | null;
    emailVerified: boolean;
  };
}

export interface DashboardUser {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
}

/**
 * Lightweight session check — no DB read.
 * Returns null when there is no active session.
 *
 * NOTE: NextAuth's `auth()` helper reads request context from cookies()
 * internally, so we no longer need to thread NextRequest through. The
 * optional parameter is preserved for source compatibility with the
 * Firebase-era signature but is ignored — every caller that passed it was
 * a server-side route handler that already runs inside the same request
 * scope.
 */
export async function auth(_request?: unknown): Promise<Session | null> {
  try {
    const session = await nextAuth();
    if (!session?.user?.id) return null;
    return {
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
        // If a session exists, the Credentials authorize() gate already
        // verified emailVerified at sign-in time.
        emailVerified: true,
      },
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] session check error:", error);
    return null;
  }
}

/**
 * Session + user-row read for dashboard pages.
 * Returns null when not authenticated OR the user row has been deleted.
 */
export async function authWithProfile(_request?: unknown): Promise<DashboardUser | null> {
  try {
    const session = await nextAuth();
    const uid = session?.user?.id;
    if (!uid) return null;

    const row = await db.query.users.findFirst({ where: eq(users.id, uid) });
    if (!row) {
      console.error(`[authWithProfile] no user row for id=${uid}`);
      return null;
    }

    const parts = (row.name ?? "").trim().split(/\s+/);
    const firstName = parts[0] || undefined;
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;

    const emailVerified = isE2ETestMode() ? true : Boolean(row.emailVerified);

    return {
      uid: row.id,
      email: row.email ?? null,
      firstName,
      lastName,
      emailVerified,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[authWithProfile] error:", error);
    return null;
  }
}

/**
 * Require an authenticated, email-verified user. Throws otherwise.
 */
export async function requireAuth(): Promise<DashboardUser> {
  const user = await authWithProfile();
  if (!user) {
    throw new Error("Unauthorized: No valid session");
  }
  if (!user.emailVerified) {
    throw new Error("Unauthorized: Email not verified");
  }
  return user;
}
