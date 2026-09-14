import { expect, type Page } from '@playwright/test';

interface AthleteOptions {
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  position?: string;
  teamName?: string;
  league?: string;
}

/** Fill the current AthleteForm through its real, named browser controls. */
export async function fillAthleteForm(page: Page, name: string, options: AthleteOptions = {}) {
  const parts = name.trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts.pop()! : 'Fixture';
  const firstName = parts.join(' ');
  // Next's client navigation can briefly retain the outgoing form while the
  // destination mounts. Target the user-visible controls so the fixture is
  // deterministic across that transition instead of depending on DOM order.
  await page.locator('input[name="firstName"]:visible').fill(firstName);
  await page.locator('input[name="lastName"]:visible').fill(lastName);
  await page.locator('input[name="dateOfBirth"]:visible').fill(options.dateOfBirth ?? '2010-06-15');
  await page.locator('select[name="gender"]:visible').selectOption(options.gender ?? 'male');
  await page.locator('select[name="position"]:visible').selectOption(options.position ?? 'CB');
  await page.locator('input[name="teamName"]:visible').fill(options.teamName ?? 'Elite FC');
  await page.locator('select[name="league"]:visible').selectOption(options.league ?? 'Club League');
  return `${firstName} ${lastName}`;
}

/** Assert the real persistence response and the current post-submit destination. */
export async function submitAthleteForm(page: Page): Promise<{ id: string; name: string }> {
  const [response] = await Promise.all([
    page.waitForResponse((res) => new URL(res.url()).pathname === '/api/players/create' && res.request().method() === 'POST'),
    page.getByRole('button', { name: 'Add Athlete', exact: true }).click(),
  ]);
  expect(response.ok(), `Athlete creation HTTP ${response.status()}`).toBe(true);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.player.id).toEqual(expect.any(String));
  await expect(page).toHaveURL(/\/dashboard\/athletes\/?$/);
  return { id: body.player.id, name: body.player.name };
}
