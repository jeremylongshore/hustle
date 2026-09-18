/**
 * POST /api/auth/send-password-reset
 *
 * Issues a single-use password-reset token (15-minute TTL) and emails the
 * reset link. Always returns ok regardless of user existence to avoid email
 * enumeration.
 *
 * Phase 4.5 migration: replaces firebase-admin auth.generatePasswordResetLink
 * with a Drizzle-backed token in `passwordResetToken`.
 */
import { consumeRateLimit, clientIp, rateLimitResponseInit, RATE_LIMITS } from '@/lib/rate-limit'

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { eq, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema/auth';
import { sendPasswordResetEmail } from '@/lib/resend';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function appOrigin(req: NextRequest): string {
  return (
    process.env.APP_ORIGIN ??
    process.env.NEXT_PUBLIC_APP_URL ??
    req.headers.get('origin') ??
    `https://${req.headers.get('host')}`
  );
}

export async function POST(req: NextRequest) {
  const limit = consumeRateLimit(RATE_LIMITS.passwordResetByIp, clientIp(req.headers));
  if (!limit.allowed) {
    const r = rateLimitResponseInit(limit);
    return NextResponse.json(r.body, r.init);
  }
  try {
    const { email } = (await req.json()) as { email: string };
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    // Opportunistic cleanup of expired reset tokens.
    await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expires, new Date()));

    const user = await db.query.users.findFirst({ where: eq(users.email, normalized) });
    if (!user) {
      // Anti-enumeration: same response regardless.
      return NextResponse.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    await db.insert(passwordResetTokens).values({
      token,
      userId: user.id,
      expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const link = `${appOrigin(req)}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail(normalized, link);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[send-password-reset]', err);
    // Don't leak whether the email exists — return ok regardless.
    return NextResponse.json({ ok: true });
  }
}
