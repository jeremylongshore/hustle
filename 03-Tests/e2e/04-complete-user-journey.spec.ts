import { verifyRegisteredUser } from './fixture-auth';
import { fillAthleteForm, submitAthleteForm } from './fixture-athlete';
import { fillGameForm, submitGameForm } from './fixture-game';
import { test, expect, type Page } from '@playwright/test';

// Helper function to register and login
async function registerAndLogin(page: Page) {
  const timestamp = Date.now();
  const testEmail = `journeytest${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  // Navigate to registration
  await page.goto('/register');
  await page.waitForSelector('button[type="submit"]', { timeout: 30000 });

  // Fill registration form
  await page.fill('input[name="firstName"]', 'Journey');
  await page.fill('input[name="lastName"]', 'Test');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]:not([name="confirmPassword"])', testPassword);
  await page.fill('input[name="confirmPassword"]', testPassword);

  // Submit registration and wait for redirect to login
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/verify-email/, { timeout: 60000 });
  await verifyRegisteredUser(page, testEmail);

  // Login (in real app would need email verification)
  await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
  await page.fill('input[type="email"], input[type="email"]', testEmail);
  await page.fill('input[type="password"]:not([name="confirmPassword"]), input[type="password"]', testPassword);
  await page.click('button[type="submit"]');

  // Wait for dashboard redirect (confirms login + provisioning completed)
  await page.waitForURL(/\/dashboard/, { timeout: 90000 });

  // Wait for session to be fully established (session cookie creation is async)
  await expect(page.getByRole('button', { name: 'Sign Out', exact: true })).toBeVisible();

  return { email: testEmail, password: testPassword };
}


async function prepareAthlete(page: Page, position = 'CB') {
  await registerAndLogin(page);
  await page.goto('/dashboard/add-athlete');
  const name = `Journey Athlete ${Date.now()}`;
  await fillAthleteForm(page, name, { position });
  const player = await submitAthleteForm(page);
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await page.locator(`a[href="/dashboard/athletes/${player.id}"]`).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await page.locator('a[href="/dashboard/log-game"]').first().click();
  await expect(page).toHaveURL(/log-game$/);
  return player;
}

function gamePayload(playerId: string, index = 1) {
  return { playerId, date: new Date().toISOString().slice(0, 10), opponent: `Fixture Opponent ${index}`,
    result: 'Win', yourScore: 1, opponentScore: 0, minutesPlayed: 90, goals: 0, assists: 0 };
}

test.describe('Complete User Journey', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should complete full MVP journey: Register → Add Athlete → Log Game → View Stats', async ({ page }) => {
    const player = await prepareAthlete(page);
    await fillGameForm(page, { athleteId: player.id, opponent: 'Rival United', goals: 1, assists: 1 });
    await page.getByLabel('Tackles', { exact: true }).fill('8');
    await page.getByLabel('Interceptions', { exact: true }).fill('4');
    await page.getByLabel('Clearances', { exact: true }).fill('12');
    const result = await submitGameForm(page);
    expect(result.game).toMatchObject({ goals: 1, assists: 1, tackles: 8, interceptions: 4, clearances: 12, finalScore: '3-1' });
    await expect(page.getByText('vs Rival United', { exact: true }).filter({ visible: true }).first()).toBeVisible();
    await page.goto(`/dashboard/athletes/${player.id}`);
    await expect(page.getByText('vs Rival United', { exact: true })).toBeVisible();
    await expect(page.getByText('3–1', { exact: true })).toBeVisible();
    await page.goto('/dashboard');
    const gamesCard = page.getByText('Games Played', { exact: true }).locator('../..');
    await expect(gamesCard.locator('p').filter({ hasText: /^1$/ })).toBeVisible();
    const games = await page.request.get(`/api/games?playerId=${player.id}`);
    expect(games.ok()).toBe(true);
    expect((await games.json()).games).toHaveLength(1);
  });

  test('should show different stats fields for goalkeeper', async ({ page }) => {
    const player = await prepareAthlete(page, 'GK');
    await fillGameForm(page, { athleteId: player.id, opponent: 'Striker FC', teamScore: 1, opponentScore: 0, position: 'GK' });
    await page.getByLabel('Saves', { exact: true }).fill('5');
    await page.getByLabel('Goals Against', { exact: true }).fill('0');
    await page.getByLabel('Clean Sheet', { exact: true }).check();
    await expect(page.getByLabel('Tackles', { exact: true })).toHaveCount(0);
    const result = await submitGameForm(page);
    expect(result.game).toMatchObject({ saves: 5, goalsAgainst: 0, cleanSheet: true, tackles: 0 });
  });

  test('should enforce result-score consistency', async ({ page }) => {
    const player = await prepareAthlete(page, 'CM');
    await fillGameForm(page, { athleteId: player.id, opponent: 'Validation Test', teamScore: 1, opponentScore: 3, position: 'CM' });
    const result = await submitGameForm(page);
    expect(result.game).toMatchObject({ result: 'Loss', finalScore: '1-3' });
    // Direct callers also cannot override the score-derived result with an inconsistent value.
    const invalid = await page.request.post('/api/games', { data: { ...gamePayload(player.id), result: 'Win', yourScore: 1, opponentScore: 3 } });
    expect(invalid.status()).toBe(400);
    expect((await invalid.json()).details.result).toEqual(expect.arrayContaining([expect.stringMatching(/does not match/i)]));
  });

  test('should prevent future game dates', async ({ page }) => {
    const player = await prepareAthlete(page, 'CM');
    await fillGameForm(page, { athleteId: player.id, opponent: 'Future Opponent', date: '2999-01-01', position: 'CM' });
    await page.getByRole('button', { name: 'Save Game', exact: true }).click();
    await expect(page.getByText('Game date cannot be in the future')).toBeVisible();
    await expect(page).toHaveURL(/log-game$/);
    const invalid = await page.request.post('/api/games', { data: { ...gamePayload(player.id), date: '2999-01-01' } });
    expect(invalid.status()).toBe(400);
    expect((await invalid.json()).details.date).toEqual(expect.arrayContaining([expect.stringMatching(/future/i)]));
  });

  test('should sanitize opponent name (XSS prevention)', async ({ page }) => {
    const player = await prepareAthlete(page, 'CDM');
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => { dialogs.push(dialog.message()); await dialog.dismiss(); });
    await fillGameForm(page, { athleteId: player.id, opponent: '<script>alert("XSS")</script>', position: 'CDM' });
    const [response] = await Promise.all([
      page.waitForResponse((res) => new URL(res.url()).pathname === '/api/games' && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Save Game', exact: true }).click(),
    ]);
    expect(response.status()).toBe(400);
    expect((await response.json()).details.opponent).toEqual(expect.arrayContaining([expect.stringMatching(/invalid characters/i)]));
    await expect(page.getByText('Please check the form fields and try again.')).toBeVisible();
    expect(dialogs).toEqual([]);
    const games = await page.request.get(`/api/games?playerId=${player.id}`);
    expect((await games.json()).games).toHaveLength(0);
  });

  test('should enforce rate limiting (10 requests/minute)', async ({ page }) => {
    const player = await prepareAthlete(page, 'RW');
    for (let index = 1; index <= 10; index++) {
      const response = await page.request.post('/api/games', { data: gamePayload(player.id, index) });
      expect(response.status(), `request ${index}`).toBe(201);
    }
    const blocked = await page.request.post('/api/games', { data: gamePayload(player.id, 11) });
    expect(blocked.status()).toBe(429);
    expect((await blocked.json()).error).toBe('RATE_LIMIT_EXCEEDED');
  });
});
