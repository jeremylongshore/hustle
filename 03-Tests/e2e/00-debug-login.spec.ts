import { verifyRegisteredUser } from './fixture-auth';
import { test, expect } from '@playwright/test';

/**
 * Debug test to understand login flow failures
 */
test.describe('Debug Login Flow', () => {
  test('should debug registration and login', async ({ page }, testInfo) => {
    const timestamp = Date.now();
    const testEmail = `debug${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    // Capture console logs
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type()}]:`, msg.text());
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR]:`, error.message);
    });

    // Record only category and path, never session headers or response bodies.
    page.on('response', response => {
      const url = new URL(response.url());
      if (url.pathname.startsWith('/api/')) console.log(`[API] ${response.status()} ${url.pathname}`);
    });

    // STEP 1: Register
    console.log('=== STEP 1: REGISTER ===');
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
    console.log('✓ On register page');

    await page.fill('input[name="firstName"]', 'Debug');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]:not([name="confirmPassword"])', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    console.log('✓ Form filled');

    await page.click('button[type="submit"]');
    console.log('✓ Submit clicked');

    // Wait and check where we end up
    await page.waitForTimeout(3000);
    console.log(`After registration URL: ${page.url()}`);

    // STEP 2: Login
    console.log('=== STEP 2: LOGIN ===');
    await page.waitForURL(/\/verify-email/);
    await verifyRegisteredUser(page, testEmail);
    await expect(page).toHaveURL(/login/);
    console.log('✓ On login page');

    await page.fill('input[type="email"], input[type="email"]', testEmail);
    await page.fill('input[type="password"]:not([name="confirmPassword"]), input[type="password"]', testPassword);
    console.log('✓ Credentials filled');

    // Take screenshot before submit
    await page.screenshot({ path: testInfo.outputPath('debug-before-login.png') });

    await page.click('button[type="submit"]');
    console.log('✓ Login submit clicked');

    // Wait for any response
    await page.waitForTimeout(5000);

    // Take screenshot after
    await page.screenshot({ path: testInfo.outputPath('debug-after-login.png') });

    const finalUrl = page.url();
    console.log(`Final URL after login: ${finalUrl}`);

    await expect(page).toHaveURL(/dashboard/);
  });
});
