/**
 * POST /api/auth/send-verification
 *
 * Generates a single-use email-verification token (24-hour TTL), persists it
 * in `verificationToken`, and emails the verification link via Resend.
 *
 * Phase 4.5 migration: replaces the firebase-admin auth.generateEmailVerificationLink
 * round-trip. The token shape + table match the existing /api/auth/register
 * route (see references therein).
 */
import { consumeRateLimit, clientIp, rateLimitResponseInit, RATE_LIMITS } from '@/lib/rate-limit'

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schema/auth';
import { sendVerificationEmail } from '@/lib/resend';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function appOrigin(req: NextRequest): string {
  return (
    process.env.APP_ORIGIN ??
    process.env.NEXT_PUBLIC_APP_URL ??
    req.headers.get('origin') ??
    `https://${req.headers.get('host')}`
  );
}

export async function POST(req: NextRequest) {
  const limit = consumeRateLimit(RATE_LIMITS.verificationEmailByIp, clientIp(req.headers));
  if (!limit.allowed) {
    const r = rateLimitResponseInit(limit);
    return NextResponse.json(r.body, r.init);
  }
  try {
    const body = (await req.json()) as { uid?: string; email?: string; firstName?: string };
    const email = String(body.email ?? '').toLowerCase().trim();
    const firstName = body.firstName ?? 'there';

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    // Confirm a user row exists for this email (anti-noise; still mint+send if so).
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      // Return ok to avoid email-enumeration. Logged below for ops visibility.
      console.warn(`[send-verification] no user row for ${email}`);
      return NextResponse.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });

    const link = `${appOrigin(req)}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    await sendVerificationEmail(email, firstName, link);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[send-verification]', detail);
    return NextResponse.json(
      { error: 'Failed to send verification email', detail },
      { status: 500 }
    );
  }
}
