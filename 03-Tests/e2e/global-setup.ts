/** Local Auth.js/SQLite fixtures. No provider email or production data. */
import { chromium, expect, type FullConfig, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { verifyRegisteredUser } from './fixture-auth';

export const E2E_TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'e2e-hustle-test@example.com',
  password: process.env.E2E_TEST_PASSWORD || 'E2ETestPassword123!',
  firstName: 'E2E',
  lastName: 'Tester',
};

async function globalSetup(config: FullConfig) {
  const baseURL = String(config.projects[0].use.baseURL || 'http://localhost:4000');
  if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) {
    throw new Error('Fixture setup refuses a nonlocal application');
  }
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${baseURL}/login`);
    const registration = await page.request.post(`${baseURL}/api/auth/register`, {
      data: {email: E2E_TEST_USER.email, password: E2E_TEST_USER.password, name: 'E2E Tester'},
    });
    expect(registration.ok(), 'isolated fixture registration must succeed').toBeTruthy();
    await verifyRegisteredUser(page, E2E_TEST_USER.email);
    await fillInputRobust(page, 'input[type="email"]', E2E_TEST_USER.email);
    await fillInputRobust(page, 'input[type="password"]', E2E_TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, {timeout: 30000});
    await ensureTestAthlete(page, baseURL);
    const authFile = path.join(process.env.HUSTLE_E2E_RUN_DIR!, 'user.json');
    fs.mkdirSync(path.dirname(authFile), {recursive: true, mode: 0o700});
    await context.storageState({path: authFile});
    console.log('E2E fixture: registration, real token verification and browser login passed');
  } finally {
    await browser.close();
  }
}

async function fillInputRobust(page: Page, selector: string, value: string): Promise<void> {
  const input = page.locator(selector);

  // Wait for input to be visible
  await input.waitFor({ state: 'visible', timeout: 10000 });

  // Clear and focus
  await input.click();
  await input.clear();

  // Try fill() first (works for most inputs)
  await input.fill(value);

  // Verify the value was set
  const actualValue = await input.inputValue();
  if (actualValue !== value) {
    // Fallback to pressSequentially for stubborn React inputs
    await input.clear();
    await input.pressSequentially(value, { delay: 30 });
  }

  // Small delay for React state
  await page.waitForTimeout(100);
}

async function ensureTestAthlete(page: Page, baseURL: string): Promise<void> {
  const response = await page.request.post(`${baseURL}/api/players/create`, {
    data: {
      name: 'E2E Test Athlete', birthday: '2012-06-15', gender: 'male',
      primaryPosition: 'CM', teamClub: 'E2E Test FC', leagueCode: 'local_travel',
    },
  });
  expect(response.ok(), 'authenticated fixture player creation must succeed').toBeTruthy();
  await page.goto(`${baseURL}/dashboard/athletes`);
  await expect(page.getByText('E2E Test Athlete', { exact: true })).toBeVisible();
}

export default globalSetup;
