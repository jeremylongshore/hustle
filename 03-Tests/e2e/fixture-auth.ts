import { expect, type Page } from '@playwright/test';
import Database from 'better-sqlite3';
import os from 'node:os';
import path from 'node:path';

/** Read the email token from this run's local fixture, then use the real API. */
export async function verifyRegisteredUser(page: Page, email: string) {
  const databasePath = process.env.DATABASE_PATH;
  const databaseDirectory = process.env.HUSTLE_E2E_DATABASE_DIR;
  const url = new URL(page.url());
  const resolvedDirectory = databaseDirectory ? path.resolve(databaseDirectory) : '';
  if (!databasePath || !resolvedDirectory
      || path.dirname(resolvedDirectory) !== path.resolve(os.tmpdir())
      || !path.basename(resolvedDirectory).startsWith('hustle-e2e-db-')
      || path.dirname(path.resolve(databasePath)) !== resolvedDirectory ||
      !['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw new Error('Email fixtures require the isolated local E2E database');
  }
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  let token: { token: string } | undefined;
  try {
    token = database.prepare('SELECT token FROM verificationToken WHERE identifier = ? ORDER BY expires DESC LIMIT 1').get(email) as { token: string } | undefined;
  } finally {
    database.close();
  }
  expect(token, 'registration must persist a real verification token').toBeTruthy();
  const response = await page.request.post(new URL('/api/auth/verify-email', url).href, {
    data: { email, token: token!.token },
  });
  expect(response.ok(), 'the actual verification endpoint must accept the fixture token').toBeTruthy();
  expect(await response.json()).toMatchObject({ ok: true });
  await page.goto(new URL('/login', url).href);
}
