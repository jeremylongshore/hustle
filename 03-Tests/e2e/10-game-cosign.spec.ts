import { verifyRegisteredUser } from './fixture-auth';
import { fillAthleteForm, submitAthleteForm } from './fixture-athlete';
import { test, expect, type Page } from '@playwright/test';

/**
 * Parent co-signature on a game via PIN (bead hustle-4dc.9).
 * Set PIN → log game → wrong PIN refused → correct PIN signs →
 * games list shows the named signature → second parent signature refused.
 */
test.describe('Game co-signing', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  async function registerAndLogin(page: Page) {
    const email = `cosigntest${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    await page.goto('/register');
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
    await page.fill('input[name="firstName"]', 'Cosign');
    await page.fill('input[name="lastName"]', 'Parent');
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
  }

  test('a parent PIN signature is recorded with the signer and shown on the game', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/dashboard/add-athlete');
    await fillAthleteForm(page, `Cosign Athlete ${Date.now()}`, { position: 'ST' });
    const athlete = await submitAthleteForm(page);

    const pinRes = await page.request.patch('/api/account/pin', { data: { pin: '4826', confirmPin: '4826' } });
    expect(pinRes.status()).toBe(200);

    const gameRes = await page.request.post('/api/games', {
      data: {
        playerId: athlete.id, date: new Date().toISOString().slice(0, 10), opponent: 'Cosign FC',
        result: 'Win', yourScore: 2, opponentScore: 1, minutesPlayed: 80, goals: 1, assists: 1,
      },
    });
    expect(gameRes.status()).toBe(201);
    const gameId = (await gameRes.json()).game.id as string;

    const wrong = await page.request.post('/api/verify', { data: { gameId, playerId: athlete.id, pin: '0000' } });
    expect(wrong.status()).toBe(401);

    const ok = await page.request.post('/api/verify', { data: { gameId, playerId: athlete.id, pin: '4826' } });
    expect(ok.status()).toBe(200);
    const signed = await ok.json();
    expect(signed.verification).toMatchObject({ signerRole: 'parent', method: 'pin' });
    expect(signed.verification.signerName.length).toBeGreaterThan(0);

    const list = await (await page.request.get(`/api/games?playerId=${athlete.id}`)).json();
    const game = list.games.find((g: { id: string }) => g.id === gameId);
    expect(game.verified).toBe(true);
    expect(game.verifications).toHaveLength(1);
    expect(game.verifications[0].signerName).toBe(signed.verification.signerName);

    const again = await page.request.post('/api/verify', { data: { gameId, playerId: athlete.id, pin: '4826' } });
    expect(again.status()).toBe(400);
    expect((await again.json()).error).toBe('Game already verified');
  });
});
