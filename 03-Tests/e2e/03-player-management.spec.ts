import { verifyRegisteredUser } from './fixture-auth';
import { fillAthleteForm, submitAthleteForm } from './fixture-athlete';
import { test, expect, type Page } from '@playwright/test';

// Helper function to login
async function login(page: Page) {
  const timestamp = Date.now();
  const testEmail = `playertest${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  await page.goto('/register');
  await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
  await page.fill('input[name="firstName"]', 'Player');
  await page.fill('input[name="lastName"]', 'Test');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]:not([name="confirmPassword"])', testPassword);
  await page.fill('input[name="confirmPassword"]', testPassword);
  await page.click('button[type="submit"]');

  // Wait for redirect to login page
  await page.waitForURL(/\/verify-email/, { timeout: 60000 });
  await verifyRegisteredUser(page, testEmail);

  // Login
  await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
  await page.fill('input[type="email"], input[type="email"]', testEmail);
  await page.fill('input[type="password"]:not([name="confirmPassword"]), input[type="password"]', testPassword);
  await page.click('button[type="submit"]');

  // Wait for dashboard redirect (confirms login + session established)
  await page.waitForURL(/\/dashboard/, { timeout: 90000 });

  // Wait for session to be fully established
  await expect(page.getByRole('button', { name: 'Sign Out', exact: true })).toBeVisible();

  return { email: testEmail, password: testPassword };
}


async function addAthlete(page: Page, name: string, dateOfBirth?: string) {
  await page.goto('/dashboard/add-athlete');
  const fullName = await fillAthleteForm(page, name, { dateOfBirth });
  const player = await submitAthleteForm(page);
  await expect(page.getByRole('heading', { name: fullName, exact: true })).toBeVisible();
  return player;
}

test.describe('Player Management', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should show add athlete form', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/add-athlete');
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="dateOfBirth"]')).toBeVisible();
    await expect(page.locator('select[name="position"]')).toBeVisible();
  });

  test('should add a new player successfully', async ({ page }) => {
    await login(page);
    await addAthlete(page, `Test Player ${Date.now()}`);
  });

  test('should validate required fields', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/add-athlete');
    await page.getByRole('button', { name: 'Add Athlete', exact: true }).click();
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Position is required')).toBeVisible();
    await expect(page).toHaveURL(/add-athlete$/);
  });

  test('should handle special characters in names', async ({ page }) => {
    await login(page);
    await addAthlete(page, "Alex O'Brien-Smith");
  });

  test('should display list of players', async ({ page }) => {
    await login(page);
    const player = await addAthlete(page, `List Player ${Date.now()}`);
    await page.reload();
    await expect(page.getByRole('heading', { name: player.name, exact: true })).toBeVisible();
  });

  test('should show player details', async ({ page }) => {
    await login(page);
    const player = await addAthlete(page, `Detail Test ${Date.now()}`);
    await page.locator(`a[href="/dashboard/athletes/${player.id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/athletes/${player.id}$`));
    await expect(page.getByRole('heading', { name: player.name, exact: true })).toBeVisible();
  });

  test('should not allow XSS in player names', async ({ page }) => {
    await login(page);
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => { dialogs.push(dialog.message()); await dialog.dismiss(); });
    const payload = '<script>alert("XSS")</script>';
    const player = await addAthlete(page, payload);
    await page.locator(`a[href="/dashboard/athletes/${player.id}"]`).click();
    await expect(page.getByRole('heading', { name: player.name, exact: true })).toBeVisible();
    expect(dialogs).toEqual([]);
    await expect(page.locator('script').filter({ hasText: 'alert("XSS")' })).toHaveCount(0);
  });

  test('should only show players belonging to authenticated user', async ({ page, browser }) => {
    await login(page);
    const player = await addAthlete(page, `User One ${Date.now()}`);
    const other = await browser.newContext({ baseURL: new URL(page.url()).origin, storageState: { cookies: [], origins: [] } });
    try {
      const page2 = await other.newPage();
      await login(page2);
      await page2.goto('/dashboard/athletes');
      await expect(page2.getByText('No athletes yet')).toBeVisible();
      await expect(page2.getByRole('heading', { name: player.name, exact: true })).toHaveCount(0);
      const response = await page2.request.get('/api/players');
      expect(response.ok()).toBe(true);
      expect((await response.json()).players.some((entry: { id: string }) => entry.id === player.id)).toBe(false);
    } finally {
      await other.close();
    }
  });

  test('should handle very long player names', async ({ page }) => {
    await login(page);
    await addAthlete(page, 'A'.repeat(90) + ' Fixture');
  });

  test('should handle future birthdates', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/add-athlete');
    await fillAthleteForm(page, 'Future Kid', { dateOfBirth: '2999-01-01' });
    await page.getByRole('button', { name: 'Add Athlete', exact: true }).click();
    await expect(page.getByText(/date of birth.*future/i)).toBeVisible();
    await expect(page).toHaveURL(/add-athlete$/);
  });

  test('should handle very old birthdates', async ({ page }) => {
    await login(page);
    await addAthlete(page, 'Old Kid', '1924-01-01');
  });
});
