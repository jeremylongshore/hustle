/**
 * POST /api/auth/forgot-password — accept { email }, generate a single-use
 * reset token (15-minute TTL), email the reset link via Resend.
 *
 * Anti-enumeration: always returns 200 OK regardless of whether the email
 * matches a user. Attackers can't probe for valid emails through this route.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema/auth";
import { sendPasswordResetEmail } from "@/lib/resend";
import { consumeRateLimit, clientIp, rateLimitResponseInit, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function appOrigin(req: NextRequest): string {
  return process.env.APP_ORIGIN
    ?? req.headers.get("origin")
    ?? `https://${req.headers.get("host")}`;
}

export async function POST(req: NextRequest) {
  const limit = consumeRateLimit(RATE_LIMITS.passwordResetByIp, clientIp(req.headers));
  if (!limit.allowed) {
    const r = rateLimitResponseInit(limit);
    return NextResponse.json(r.body, r.init);
  }
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "").toLowerCase().trim();
  if (!email) return NextResponse.json({ ok: true });
  // Per-email cap: over the limit we still answer ok (no account enumeration) but send nothing.
  if (!consumeRateLimit(RATE_LIMITS.passwordResetByEmail, email).allowed) {
    return NextResponse.json({ ok: true });
  }

  // Opportunistic cleanup of expired reset tokens.
  await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expires, new Date()));

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    // Anti-enumeration: same response shape regardless.
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString("base64url");
  await db.insert(passwordResetTokens).values({
    token,
    userId: user.id,
    expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  const resetLink = `${appOrigin(req)}/reset-password?token=${encodeURIComponent(token)}`;

  try {
    await sendPasswordResetEmail(email, resetLink);
  } catch (err) {
    console.error("[forgot-password] failed to send reset email:", err);
    // Still return 200 — failing to send doesn't reveal user existence.
  }

  return NextResponse.json({ ok: true });
}
