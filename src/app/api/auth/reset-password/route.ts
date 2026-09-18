/**
 * POST /api/auth/reset-password — consume a reset token, hash + store the
 * new password. Returns 400 on invalid/expired token or password too short.
 *
 * The token is deleted regardless of success once consumed.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema/auth";
import { consumeRateLimit, clientIp, rateLimitResponseInit, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const limit = consumeRateLimit(RATE_LIMITS.passwordResetByIp, clientIp(req.headers));
  if (!limit.allowed) {
    const r = rateLimitResponseInit(limit);
    return NextResponse.json(r.body, r.init);
  }
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = String(body.token ?? "").trim();
  const password = String(body.password ?? "");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const row = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, token),
  });
  if (!row) {
    return NextResponse.json({ error: "Reset link is invalid or has already been used" }, { status: 400 });
  }
  if (row.expires < new Date()) {
    // Delete the expired token opportunistically and reject.
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return NextResponse.json({ error: "Reset link has expired. Request a new one." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

  return NextResponse.json({ ok: true });
}
