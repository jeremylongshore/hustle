import { test, expect } from '@playwright/test';
import { fillAthleteForm, submitAthleteForm } from './fixture-athlete';
import { E2E_TEST_USER } from './global-setup';

const email = process.env.SMOKE_TEST_EMAIL || E2E_TEST_USER.email;
const password = process.env.SMOKE_TEST_PASSWORD || E2E_TEST_USER.password;

test.describe('Real-World Auth Smoke', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should login, create athlete, reach Dream Gym, delete athlete, and logout', async ({ page, baseURL }) => {
    if (!process.env.SMOKE_TEST_EMAIL && !['localhost', '127.0.0.1'].includes(new URL(baseURL!).hostname)) {
      throw new Error('Fixture smoke credentials require a local application');
    }
    const athleteName = `Smoke Athlete ${Date.now()}`;
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/dashboard/add-athlete');
    await fillAthleteForm(page, athleteName, { dateOfBirth: '2012-01-01', position: 'GK', teamName: 'Hustle FC' });
    const player = await submitAthleteForm(page);
    await expect(page.getByRole('heading', { name: athleteName, exact: true })).toBeVisible();
    await page.goto(`/dashboard/dream-gym?playerId=${encodeURIComponent(player.id)}`);
    await expect(page.getByRole('heading', { name: 'AI-Powered Training' })).toBeVisible();
    const workoutLinks = page.locator('a[href="/dashboard/dream-gym/workout"]');
    await expect(workoutLinks.first()).toBeVisible();
    expect(await workoutLinks.count()).toBeGreaterThan(0);

    await page.goto(`/dashboard/athletes/${player.id}`);
    await expect(page.getByRole('heading', { name: athleteName, exact: true })).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    const [deleted] = await Promise.all([
      page.waitForResponse((res) => new URL(res.url()).pathname === `/api/players/${player.id}` && res.request().method() === 'DELETE'),
      page.getByRole('button', { name: 'Delete', exact: true }).click(),
    ]);
    expect(deleted.ok()).toBe(true);
    await expect(page).toHaveURL(/\/dashboard\/athletes\/?$/);
    await expect(page.getByRole('heading', { name: athleteName, exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
