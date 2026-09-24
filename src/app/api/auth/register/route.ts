import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { registerUserWithWorkspace, RegistrationConflictError } from "@/lib/db/provision-user-workspace";
import { sendVerificationEmail } from "@/lib/resend";
import { consumeRateLimit, clientIp, rateLimitResponseInit, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function appOrigin(req: NextRequest): string {
  return process.env.APP_ORIGIN
    ?? req.headers.get("origin")
    ?? `https://${req.headers.get("host")}`;
}

export async function POST(req: NextRequest) {
  const limit = consumeRateLimit(RATE_LIMITS.registerByIp, clientIp(req.headers));
  if (!limit.allowed) {
    const r = rateLimitResponseInit(limit);
    return NextResponse.json(r.body, r.init);
  }
  let body: { email?: string; password?: string; name?: string; firstName?: string; lastName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "").toLowerCase().trim();
  const password = String(body.password ?? "");
  const firstName = String(body.firstName ?? "").trim().slice(0, 60) || null;
  const lastName = String(body.lastName ?? "").trim().slice(0, 60) || null;
  // Keep the combined display name, but persist the parts too: /dashboard/settings
  // and /dashboard/profile read firstName/lastName (bead hustle-4dc.10).
  const name = String(body.name ?? "").trim() || [firstName, lastName].filter(Boolean).join(" ") || null;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(32).toString("base64url");
  let userId: string;
  try {
    ({ userId } = registerUserWithWorkspace({
      email, name, firstName, lastName, passwordHash, token,
      tokenExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    }));
  } catch (error) {
    if (error instanceof RegistrationConflictError) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    console.error("[register] account provisioning transaction failed");
    return NextResponse.json({ error: "Registration could not be completed" }, { status: 500 });
  }

  const verifyLink = `${appOrigin(req)}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  try {
    await sendVerificationEmail(email, name ?? "there", verifyLink);
  } catch (err) {
    console.error("[register] failed to send verification email:", err);
    // Don't fail the request — user exists; they can request resend.
  }

  return NextResponse.json({ ok: true, userId });
}
