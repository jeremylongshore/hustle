import { NextResponse } from 'next/server';
import { emailHealth } from '@/lib/email-health';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Functional email readiness. SMTP verification never submits a message. */
export async function GET() {
  const result = await emailHealth();
  return NextResponse.json(result, {
    status: result.status === 'pass' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
