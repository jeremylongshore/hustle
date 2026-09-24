import { verifyRegisteredUser } from './fixture-auth';
import { fillAthleteForm, submitAthleteForm } from './fixture-athlete';
import { test, expect, type Page } from '@playwright/test';

/**
 * Account export + deletion, end to end (bead hustle-4dc.8).
 * Register → add athlete → export contains the athlete → wrong password refused →
 * delete via Settings UI → signed out and the credentials no longer work.
 */
test.describe('Account export and deletion', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  async function registerAndLogin(page: Page) {
    const email = `deletetest${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    await page.goto('/register');
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
    await page.fill('input[name="firstName"]', 'Delete');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]:not([name="confirmPassword"])', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/verify-email/, { timeout: 60000 });
    await verifyRegisteredUser(page, email);
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 90000 });
    await expect(page.getByRole('button', { name: 'Sign Out', exact: true })).toBeVisible();
    return { email, password };
  }

  test('exports the family data, refuses a wrong password, then deletes everything', async ({ page }) => {
    const { email, password } = await registerAndLogin(page);

    await page.goto('/dashboard/add-athlete');
    const athleteName = `Delete Athlete ${Date.now()}`;
    await fillAthleteForm(page, athleteName, { position: 'CB' });
    const athlete = await submitAthleteForm(page);

    // Export contains the athlete and no secrets.
    const exported = await page.request.get('/api/account/export');
    expect(exported.status()).toBe(200);
    expect(exported.headers()['content-disposition']).toContain('hustle-export-');
    const data = await exported.json();
    expect(data.account.email).toBe(email);
    expect(data.athletes.map((a: { id: string }) => a.id)).toContain(athlete.id);
    expect(JSON.stringify(data)).not.toContain('passwordHash');

    // Wrong password and missing confirmation are refused; nothing is deleted.
    const wrong = await page.request.post('/api/account/delete', {
      data: { password: 'not-my-password', confirmation: 'DELETE' },
    });
    expect(wrong.status()).toBe(403);
    const unconfirmed = await page.request.post('/api/account/delete', {
      data: { password, confirmation: 'delete' },
    });
    expect(unconfirmed.status()).toBe(400);
    expect((await page.request.get(`/api/players/${athlete.id}`)).status()).toBe(200);

    // Settings shows the real signed-in parent (not demo data) and saves edits.
    await page.goto('/dashboard/settings');
    await expect(page.getByText(email)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('marcus@hustlefc.com')).toHaveCount(0);
    await page.getByLabel('First Name').fill('Renamed');
    await page.getByLabel('Phone').fill('+1 (555) 222-3333');
    await page.getByRole('button', { name: /Save Changes|Saving/ }).click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: 30000 });
    await page.reload();
    await expect(page.getByLabel('First Name')).toHaveValue('Renamed', { timeout: 30000 });
    await expect(page.getByLabel('Phone')).toHaveValue('+1 (555) 222-3333');

    // Delete through the real Settings UI.
    await page.goto('/dashboard/settings');
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByLabel('Your password').fill(password);
    await page.getByLabel('Type DELETE to confirm').fill('DELETE');
    await page.getByRole('button', { name: 'Yes, Delete Everything' }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/dashboard'), { timeout: 60000 });

    // The account is gone: signing in with the same credentials fails.
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page.getByText('Invalid email or password.')).toBeVisible({ timeout: 30000 });
  });
});
