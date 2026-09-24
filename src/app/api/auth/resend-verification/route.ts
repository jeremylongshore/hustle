/**
 * POST /api/auth/resend-verification
 *
 * Resends a verification email if a user with that email exists AND is not
 * already verified. Anti-enumeration response shape.
 *
 * Phase 4.5 migration: replaces firebase-admin auth.getUserByEmail +
 * generateEmailVerificationLink + Firestore user-doc lookup with Drizzle.
 */
import { consumeRateLimit, clientIp, rateLimitResponseInit, RATE_LIMITS } from '@/lib/rate-limit'

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schema/auth';
import { sendEmail } from '@/lib/email';
import { emailConfiguration } from '@/lib/smtp';
import { emailTemplates } from '@/lib/email-templates';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/auth/resend-verification');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function appOrigin(req: NextRequest): string {
  const direct =
    process.env.WEBSITE_URL ||
    process.env.NEXT_PUBLIC_WEBSITE_DOMAIN ||
    process.env.APP_ORIGIN ||
    new URL(req.url).origin;
  return direct.startsWith('http://') || direct.startsWith('https://')
    ? direct
    : `https://${direct}`;
}

export async function POST(request: NextRequest) {
  const limit = consumeRateLimit(RATE_LIMITS.verificationEmailByIp, clientIp(request.headers));
  if (!limit.allowed) {
    const r = rateLimitResponseInit(limit);
    return NextResponse.json(r.body, r.init);
  }
  const { email } = await request.json().catch(() => ({ email: '' }));

  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: 'Please enter a valid email address.' },
      { status: 400 }
    );
  }

  if (!emailConfiguration().configured) {
    return NextResponse.json(
      { success: false, error: 'Email service is not configured. Please contact support.' },
      { status: 503 }
    );
  }

  const normalized = email.toLowerCase().trim();
  const websiteOrigin = appOrigin(request);

  try {
    const user = await db.query.users.findFirst({ where: eq(users.email, normalized) });

    // Anti-enumeration: always return the same shape regardless of user existence.
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    await db.insert(verificationTokens).values({
      identifier: normalized,
      token,
      expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });

    const verificationUrl = `${websiteOrigin}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalized)}`;
    const firstName = user.firstName || user.name?.split(' ')[0] || 'there';

    const template = emailTemplates.emailVerification(firstName, verificationUrl);
    const result = await sendEmail({
      to: normalized,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a verification link has been sent.',
    });
  } catch (error) {
    logger.error('Failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to send verification email. Please try again.' },
      { status: 500 }
    );
  }
}
