/**
 * E2E Test Helpers
 *
 * Robust utilities for Playwright tests with Auth.js/React apps.
 */

import { Page, expect, Locator } from '@playwright/test';

/**
 * Robust input filling that handles React controlled inputs
 * Uses multiple strategies to ensure value is set correctly
 */
export async function fillInput(page: Page, selector: string, value: string): Promise<void> {
  const input = page.locator(selector);

  // Wait for input to be visible
  await expect(input).toBeVisible({ timeout: 10000 });

  // Click to focus
  await input.click();

  // Clear existing value
  await input.clear();

  // Try fill() first
  await input.fill(value);

  // Verify value was set
  const actualValue = await input.inputValue();

  if (actualValue !== value) {
    // Fallback: clear and use keyboard
    await input.clear();
    await input.pressSequentially(value, { delay: 20 });
  }

  // Give React time to process
  await page.waitForTimeout(100);
}

/**
 * Fill input using keyboard only (most reliable for React)
 */
export async function fillInputKeyboard(page: Page, selector: string, value: string): Promise<void> {
  const input = page.locator(selector);

  await expect(input).toBeVisible({ timeout: 10000 });
  await input.click();

  // Select all and delete
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Backspace');

  // Type character by character
  await input.pressSequentially(value, { delay: 30 });

  await page.waitForTimeout(100);
}

/**
 * Wait for page to be fully loaded and interactive
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');

  // Wait for any loading indicators to disappear
  const loadingIndicators = [
    'text=Loading',
    '[data-testid="loading"]',
    '.loading',
    '.spinner',
  ];

  for (const selector of loadingIndicators) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(element).toBeHidden({ timeout: 30000 });
    }
  }
}

/**
 * Navigate to a page and wait for it to be ready
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForPageReady(page);
}

/**
 * Click element with retry logic
 */
export async function clickWithRetry(
  locator: Locator,
  options: { force?: boolean; timeout?: number; retries?: number } = {}
): Promise<void> {
  const { force = false, timeout = 10000, retries = 3 } = options;

  for (let i = 0; i < retries; i++) {
    try {
      await locator.click({ force, timeout });
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await locator.page().waitForTimeout(1000);
    }
  }
}

/**
 * Wait for URL pattern with extended timeout
 */
export async function waitForUrlPattern(
  page: Page,
  pattern: RegExp,
  timeout: number = 60000
): Promise<void> {
  await page.waitForURL(pattern, { timeout, waitUntil: 'commit' });
}

/**
 * Check if element contains expected text
 */
export async function hasText(page: Page, pattern: RegExp): Promise<boolean> {
  const bodyText = await page.locator('body').textContent();
  return pattern.test(bodyText || '');
}

/**
 * Get authenticated page state (for debugging)
 */
export async function getAuthState(page: Page): Promise<{
  url: string;
  hasSessionCookie: boolean;
  bodyText: string;
}> {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => /^(?:__Secure-)?authjs\.session-token(?:\.\d+)?$/.test(c.name));

  return {
    url: page.url(),
    hasSessionCookie: !!sessionCookie,
    bodyText: (await page.locator('body').textContent() || '').slice(0, 500),
  };
}

/**
 * Navigate to Dream Gym with athlete
 */
export async function navigateToDreamGym(page: Page): Promise<string | null> {
  // Go to athletes list
  await navigateTo(page, '/dashboard/athletes');

  // Find first athlete
  const athleteLink = page.locator('a[href*="/athletes/"]').first();

  await expect(athleteLink, 'global setup must supply a persisted athlete').toBeVisible();

  // Get athlete ID from href
  const href = await athleteLink.getAttribute('href');
  const athleteId = href?.match(/athletes\/([^/]+)/)?.[1] || null;

  // Click to go to athlete detail
  await athleteLink.click();
  await waitForUrlPattern(page, /\/athletes\//);

  // Find Dream Gym link
  const dreamGymLink = page.locator('a[href*="dream-gym"]').first();

  if (await dreamGymLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Use JavaScript click to bypass viewport checks for sidebar elements in headless mode
    await dreamGymLink.evaluate(el => (el as HTMLElement).click());
    await waitForUrlPattern(page, /dream-gym/);
  } else {
    // Navigate directly
    await navigateTo(page, `/dashboard/dream-gym?playerId=${athleteId}`);
  }

  return athleteId;
}

/**
 * Gracefully skip test if condition not met
 */
export function skipIf(condition: boolean, message: string): void {
  if (condition) {
    console.log(`⚠ Skipping: ${message}`);
  }
}

/**
 * Log test progress
 */
export function logProgress(message: string): void {
  console.log(`✓ ${message}`);
}
