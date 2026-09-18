import { defineConfig, devices } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

// Browser fixtures always use a private local database, never production data.
const runtimeRoot = path.resolve('03-Tests/e2e/.runtime');
fs.mkdirSync(runtimeRoot, { recursive: true, mode: 0o700 });
const runDirectory = process.env.HUSTLE_E2E_RUN_DIR || fs.mkdtempSync(path.join(runtimeRoot, 'run-'));
if (!path.resolve(runDirectory).startsWith(runtimeRoot + path.sep)) {
  throw new Error('E2E runtime must be below the private fixture directory');
}
process.env.HUSTLE_E2E_RUN_DIR = runDirectory;
// Keep the frequently-written SQLite files outside Next/Turbopack's watched tree.
// A database write beneath the project can trigger a development rebuild and reset
// a form between Playwright actions, making sequential lifecycle tests unreliable.
const databaseDirectory = process.env.HUSTLE_E2E_DATABASE_DIR
  || fs.mkdtempSync(path.join(os.tmpdir(), 'hustle-e2e-db-'));
const resolvedDatabaseDirectory = path.resolve(databaseDirectory);
if (
  path.dirname(resolvedDatabaseDirectory) !== path.resolve(os.tmpdir())
  || !path.basename(resolvedDatabaseDirectory).startsWith('hustle-e2e-db-')
) {
  throw new Error('E2E database directory must be a private Hustle directory below the OS temp directory');
}
fs.chmodSync(resolvedDatabaseDirectory, 0o700);
process.env.HUSTLE_E2E_DATABASE_DIR = resolvedDatabaseDirectory;
process.env.DATABASE_PATH = path.join(resolvedDatabaseDirectory, 'hustle.db');
process.env.AUTH_SECRET ||= crypto.randomBytes(32).toString('hex');
process.env.APP_ORIGIN = 'http://localhost:4000';
process.env.AUTH_URL = process.env.APP_ORIGIN;
process.env.NEXTAUTH_URL = process.env.APP_ORIGIN;
// Fixtures verify tokens locally; no developer-shell mail credentials are inherited.
for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM', 'RESEND_API_KEY']) process.env[key] = '';
process.env.NEXT_PUBLIC_E2E_TEST_MODE = 'true';
// The suite signs in/registers many times from one IP; loosen (never disable) API rate limits.
process.env.RATE_LIMIT_SCALE = '1000';
// Initialize once before Next's parallel build workers import the database.
// Every subsequent config/worker read sees Drizzle's completed migration journal.
const fixtureDatabase = new Database(process.env.DATABASE_PATH);
try {
  fixtureDatabase.pragma('journal_mode = WAL');
  fixtureDatabase.pragma('foreign_keys = ON');
  migrate(drizzle(fixtureDatabase), { migrationsFolder: path.resolve('drizzle') });
} finally {
  fixtureDatabase.close();
}


/**
 * Playwright Configuration for Hustle App
 *
 * Tests authentication, player management, game logging, and dashboard functionality
 *
 * Optimizations:
 * - Extended timeouts for browser operations (cold starts, rate limiting)
 * - Retries for flaky network conditions
 * - Global setup for authenticated state reuse
 */
export default defineConfig({
  testDir: './03-Tests/e2e',
  outputDir: path.join(runDirectory, 'artifacts'),

  // Exclude setup files from test discovery
  testIgnore: ['**/global-setup.ts', '**/global-teardown.ts', '**/test-helpers.ts'],

  // Maximum time one test can run (2 minutes - browser operations can be slow)
  timeout: 120 * 1000,

  // Expect timeout for assertions (10s for slow renders)
  expect: {
    timeout: 10000,
    // Visual regression testing configuration
    toHaveScreenshot: {
      // Allow 0.2% pixel difference (handles anti-aliasing, font rendering)
      maxDiffPixelRatio: 0.002,
      // Threshold for individual pixel color difference (0-1)
      threshold: 0.2,
    },
  },

  // Snapshot directory for visual regression screenshots
  snapshotDir: './03-Tests/snapshots',
  // Snapshot file naming pattern
  snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}-{projectName}/{arg}{ext}',

  // Run tests in files sequentially for stable browser operations
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests (helps with flaky browser operations)
  retries: process.env.CI ? 2 : 1,

  // Use single worker for more stable browser operations
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: path.join(runDirectory, 'report') }],
    ['list'], // Console output
    ['json', { outputFile: path.join(runDirectory, 'results.json') }]
  ],

  // Global setup - creates authenticated state before all tests
  globalSetup: require.resolve('./03-Tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./03-Tests/e2e/global-teardown.ts'),

  use: {
    // Base URL for testing
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1280, height: 720 },

    // Extended timeouts for browser operations
    actionTimeout: 30 * 1000,
    navigationTimeout: 60 * 1000,

    // Storage state for authenticated tests (created by global setup)
    storageState: path.join(runDirectory, 'user.json'),
  },

  // Configure projects for major browsers
  projects: [
    // Main test project - Chromium
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // WebKit/Safari
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Microsoft Edge
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },

    // Google Chrome
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  // Run production server for E2E tests (avoids Turbopack body consumption bugs)
  webServer: {
    // In CI: Build first, copy static files, then start standalone server
    // Standalone mode requires copying .next/static and public to the standalone dir
    // Locally: Use dev server for faster iteration
    // IMPORTANT: NEXT_PUBLIC_E2E_TEST_MODE must be set during BOTH build AND runtime
    // - Build time: inlines into client-side code
    // - Runtime: server-side getDashboardUser() checks this to read fixture profiles
    command: process.env.CI
      ? 'npm run build && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public && cp -r drizzle .next/standalone/drizzle && PORT=4000 HOSTNAME=0.0.0.0 node .next/standalone/server.js'
      : 'NEXT_PUBLIC_E2E_TEST_MODE=true npm run dev -- -H 0.0.0.0 -p 4000',
    url: 'http://localhost:4000',
    reuseExistingServer: false, // The server must own this run's fixture database.
    timeout: 300 * 1000, // 5 minutes for build + start in CI
  },
});
