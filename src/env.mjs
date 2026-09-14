import { z } from 'zod';

/**
 * Environment Variables Validation
 *
 * Validates all required environment variables at build/runtime.
 * Prevents deployment with missing or invalid configuration.
 */

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Optional: Sentry (error tracking)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  // Optional: Email/Mailer
  MAILER_KEY: z.string().optional(),
  MAILER_FROM: z.string().email().optional(),

  // SMTP is validated at the email boundary; builds do not need credentials.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Optional: File Upload
  UPLOAD_MAX_SIZE: z.string().optional(),

  // Optional: Rate Limiting
  RATE_LIMIT_MAX: z.string().optional(),
  RATE_LIMIT_WINDOW: z.string().optional(),

  // Optional: App Version
  APP_VERSION: z.string().optional(),
});

// Validate environment variables
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('L Invalid environment variables:');
  console.error(JSON.stringify(env.error.flatten().fieldErrors, null, 2));
  throw new Error('Invalid environment variables');
}

// Export validated env
export const validateEnv = env.data;

// Type-safe env access
export default validateEnv;
