import { expect, type Page } from '@playwright/test';

interface GameOptions {
  athleteId: string;
  opponent: string;
  teamScore?: number;
  opponentScore?: number;
  goals?: number;
  assists?: number;
  date?: string;
  position?: string;
}

/** Use actual form controls; result is derived by the application from the two scores. */
export async function fillGameForm(page: Page, values: GameOptions) {
  // Next can briefly keep two route trees mounted during a client transition.
  // Wait for the transition tree to detach before entering uncontrolled form
  // values; otherwise a locator can fill the outgoing tree and later resolve
  // against a fresh, empty control in the settled tree.
  await page.waitForLoadState('networkidle');
  // A client-side Next navigation can satisfy the document load-state check
  // while Framer Motion is still retaining the previous route tree. Wait for
  // the destination form's entrance/exit animations before writing values so
  // a late route-tree replacement cannot discard real user input.
  await page.locator('form').evaluate(async (form) => {
    const animations = form.getAnimations({ subtree: true });
    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  });
  await expect(page.locator('select[name="athleteId"]')).toHaveCount(1);
  const athlete = page.locator('select[name="athleteId"]:visible');
  const opponent = page.locator('input[name="opponent"]:visible');
  const position = page.locator('select[name="position"]:visible');
  const selectedPosition = values.position ?? 'CB';
  await expect(page.locator(`select[name="athleteId"]:visible option[value="${values.athleteId}"]`)).toBeAttached();
  // Athlete selection can update the effective default position and its
  // positional-stat section. Complete that update before choosing an explicit
  // position so React Hook Form does not replace the just-selected value.
  await athlete.selectOption(values.athleteId);
  await expect(athlete).toHaveValue(values.athleteId);
  await position.selectOption(selectedPosition);
  await expect(position).toHaveValue(selectedPosition);
  if (selectedPosition === 'GK') await expect(page.locator('#saves:visible')).toBeAttached();
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(selectedPosition)) {
    await expect(page.locator('#tackles:visible')).toBeAttached();
  }
  await page.locator('input[name="date"]:visible').fill(values.date ?? new Date().toISOString().slice(0, 10));
  await opponent.fill(values.opponent);
  await expect(opponent).toHaveValue(values.opponent);
  await page.locator('input[name="teamScore"]:visible').fill(String(values.teamScore ?? 3));
  await page.locator('input[name="opponentScore"]:visible').fill(String(values.opponentScore ?? 1));
  await page.locator('input[name="minutesPlayed"]:visible').fill('90');
  await expect(position).toHaveValue(selectedPosition);
  await expect(athlete).toHaveValue(values.athleteId);
  for (const [label, count] of [['Goals', values.goals ?? 0], ['Assists', values.assists ?? 0]] as const) {
    for (let index = 0; index < count; index++) await page.getByRole('button', { name: `Increase ${label}`, exact: true }).click();
  }
}

export async function submitGameForm(page: Page) {
  const [response] = await Promise.all([
    page.waitForResponse((res) => new URL(res.url()).pathname === '/api/games' && res.request().method() === 'POST'),
    page.getByRole('button', { name: 'Save Game', exact: true }).click(),
  ]);
  expect(response.ok(), `Game submission HTTP ${response.status()}`).toBe(true);
  const body = await response.json();
  expect(body.success).toBe(true);
  await expect(page).toHaveURL(/\/dashboard\/games\/?$/);
  return body;
}
