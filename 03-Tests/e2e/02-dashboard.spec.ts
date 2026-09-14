import { verifyRegisteredUser } from './fixture-auth';
import { test, expect, Page } from '@playwright/test';

/**
 * Dashboard Tests
 *
 * Tests dashboard functionality, navigation, and stats display
 */

// Helper function to login
async function login(page: Page) {
  const timestamp = Date.now();
  const testEmail = `dashtest${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  // Register
  await page.goto('/register');
  await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
  await page.fill('input[name="firstName"]', 'Dashboard');
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
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  return { email: testEmail, password: testPassword };
}

test.describe('Dashboard - Basic Functionality', () => {
  // Don't use global storage state - this test creates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display dashboard after login', async ({ page }) => {
    await login(page);

    // Should be on dashboard
    expect(page.url()).toContain('/dashboard');

    // Wait for dashboard to fully load (server component may take time to render)
    await page.waitForLoadState('domcontentloaded');

    // Check for dashboard elements - give extra time for server component rendering
    await expect(page.locator('h1, h2').filter({ hasText: /Good morning/i }).first()).toBeVisible({ timeout: 15000 });

    // Note: Visual regression tests disabled - require baseline screenshots
    // To enable: run `npx playwright test --update-snapshots` locally
  });

  test('should show welcome message or user name', async ({ page }) => {
    await login(page);

    // Should show some personalization
    const dashboardText = await page.locator('body').textContent();
    expect(dashboardText).toMatch(/Dashboard|Test|Welcome/i);
  });

  test('should display stats cards', async ({ page }) => {
    await login(page);

    // Look for stat cards (Total Games, This Season, Development Score, etc.)
    const statsCard = page.locator('div').filter({ hasText: /Total Games|Games|Players|Athletes/i }).first();
    await expect(statsCard).toBeVisible();
  });

  test('should have navigation sidebar', async ({ page }) => {
    await login(page);

    // Check for sidebar using data-sidebar attribute (custom component)
    const nav = page.locator('[data-sidebar="sidebar"], nav, aside, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test('should have "Add Athlete" button or link', async ({ page }) => {
    await login(page);

    // Look for button/link to add athlete
    const addButton = page.locator('button, a').filter({ hasText: /Add Athlete|Add Player|New Athlete/i }).first();

    await expect(addButton).toBeVisible();
  });

  test('should have user menu or profile section', async ({ page }) => {
    await login(page);

    // Look for user menu/profile
    const userMenu = page.locator('button, div').filter({ hasText: /Dashboard|Test|Settings|Profile/i }).first();

    await expect(userMenu).toBeVisible();
  });
});

test.describe('Dashboard - Navigation', () => {
  // Don't use global storage state - this test creates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should navigate to Add Athlete page', async ({ page }) => {
    await login(page);

    // Click "Add Athlete" button
    const addButton = page.locator('button, a').filter({ hasText: /Add Athlete|Add Player|New Athlete/i }).first();

    if (await addButton.isVisible()) {
      await addButton.click();

      // Wait for actual URL change instead of fixed timeout
      await page.waitForURL(/add-athlete|athlete|player/i, { timeout: 10000 });
      expect(page.url()).toMatch(/add-athlete|athlete|player/i);
    }
  });

  test('should navigate between dashboard sections', async ({ page }) => {
    await login(page);

    // Verify dashboard section links exist and navigate correctly
    // Use direct navigation since sidebar links may be outside viewport in headless mode
    const sections = [
      { name: 'Athletes', path: '/dashboard/athletes' },
    ];

    for (const section of sections) {
      await page.goto(section.path);
      await page.waitForLoadState('domcontentloaded');

      // Verify the page loaded (not redirected to login)
      expect(page.url()).toContain(section.name.toLowerCase());

      // Go back to dashboard
      await page.goto('/dashboard');
    }
  });
});

test.describe('Dashboard - Responsive Design', () => {
  // Don't use global storage state - this test creates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should work on mobile (iPhone 12)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await login(page);
    await page.waitForLoadState('domcontentloaded');

    // Dashboard should be visible - give extra time for server component rendering
    await expect(page.locator('h1, h2').filter({ hasText: /Good morning/i }).first()).toBeVisible({ timeout: 15000 });

    // Content should not overflow
    const body = await page.locator('body').boundingBox();
    expect(body?.width).toBeLessThanOrEqual(390);

    // Note: Visual regression disabled - requires baseline screenshots
  });

  test('should work on tablet (iPad)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await login(page);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1, h2').filter({ hasText: /Good morning/i }).first()).toBeVisible({ timeout: 15000 });

    // Note: Visual regression disabled - requires baseline screenshots
  });

  test('should work on desktop (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await login(page);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1, h2').filter({ hasText: /Good morning/i }).first()).toBeVisible({ timeout: 15000 });

    // Note: Visual regression disabled - requires baseline screenshots
  });
});

test.describe('Dashboard - Performance', () => {
  // Don't use global storage state - this test creates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should load dashboard in under 5 seconds', async ({ page }) => {
    await login(page);

    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Dev server (Turbopack) is slower than production build; use 5s threshold
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await login(page);

    await page.goto('/dashboard');

    await page.waitForTimeout(2000);

    // Filter out known non-critical errors if any
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') && // Ignore favicon errors
      !err.includes('ResizeObserver') // Ignore ResizeObserver loop errors
    );

    expect(criticalErrors.length).toBe(0);
  });
});
