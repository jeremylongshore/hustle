/**
 * Health Check Endpoint
 *
 * Returns application health status, version, and environment.
 * Used by CI/CD pipelines, load balancers, and monitoring systems.
 *
 * Phase 4.5 migration: Firestore ping replaced with a Drizzle/SQLite
 * `select 1` round-trip. Critical env vars list dropped FIREBASE_* in
 * favour of DATABASE_PATH (effectively optional with a default).
 */

import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { createLogger } from '@/lib/logger';
import { emailConfiguration } from '@/lib/smtp';
import { withTimeout } from '@/lib/utils/timeout';

const logger = createLogger('api/health');

/** Public endpoint: report how many mail settings are missing, never their names. */
function maskedEmailConfig() {
  const { configured, transport, missing } = emailConfiguration();
  return { configured, transport, missingCount: missing.length };
}

export const dynamic = 'force-dynamic';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  service: string;
  checks: {
    database: {
      status: 'pass' | 'fail' | 'skipped';
      responseTime?: number;
      error?: string;
      reason?: string;
    };
    email: { configured: boolean; transport: 'smtp'; missingCount: number };
    environment: {
      status: 'pass' | 'fail';
      missingCount?: number;
    };
  };
  latencyMs: number;
}

export async function GET() {
  const startTime = Date.now();

  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    service: 'hustle-api',
    checks: {
      email: maskedEmailConfig(),
      database: {
        status: 'pass',
      },
      environment: {
        status: 'pass',
      },
    },
    latencyMs: 0,
  };

  // Check 1: SQLite database connectivity (production only)
  if (process.env.NODE_ENV === 'production') {
    try {
      const dbStart = Date.now();
      await withTimeout(
        Promise.resolve(db.run(sql`select 1`)),
        5000,
        'Database health ping'
      );
      const dbResponseTime = Date.now() - dbStart;

      result.checks.database = {
        status: 'pass',
        responseTime: dbResponseTime,
      };

      if (dbResponseTime > 1000) {
        result.status = 'degraded';
        logger.warn('Database health check slow', {
          responseTime: dbResponseTime,
          threshold: 1000,
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      // /api/health is public: report the failure, never the driver text.
      result.checks.database = {
        status: 'fail',
        error: 'unavailable',
      };
      result.status = 'unhealthy';
      logger.error(
        'Database health check failed',
        error instanceof Error ? error : new Error(msg)
      );
    }
  } else {
    result.checks.database = {
      status: 'skipped',
      reason: 'Database ping disabled in non-production environments',
    };
  }

  // Check 2: Required environment variables
  // Critical env vars — app won't function without these.
  const criticalEnvVars: string[] = [];

  if (process.env.BILLING_ENABLED !== 'false') {
    criticalEnvVars.push('STRIPE_SECRET_KEY');
  }

  // Email verification and password reset require a configured SMTP sender.

  const missingCritical = criticalEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingCritical.length > 0) {
    // Public endpoint: say how many settings are missing, not which ones.
    result.checks.environment = {
      status: 'fail',
      missingCount: missingCritical.length,
    };
    result.status = 'unhealthy';
    logger.error(`Missing critical environment variables: ${missingCritical.join(', ')}`);
  }

  if (!result.checks.email.configured && result.status !== 'unhealthy') {
    result.status = 'degraded';
  }

  result.latencyMs = Date.now() - startTime;

  const httpStatus = result.status === 'unhealthy' || !result.checks.email.configured ? 503 : 200;

  logger.info('Health check completed', {
    event: 'health_check',
    status: result.status,
    duration: result.latencyMs,
    databaseStatus: result.checks.database.status,
    databaseResponseTime: result.checks.database.responseTime,
    environmentStatus: result.checks.environment.status,
    timestamp: result.timestamp,
  });

  return NextResponse.json(result, { status: httpStatus, headers: { 'Cache-Control': 'no-store' } });
}
