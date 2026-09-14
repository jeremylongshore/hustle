/**
 * Login Behavior Tests
 *
 * These tests verify that the login page:
 * 1. Never hangs indefinitely (has proper timeout handling)
 * 2. Shows appropriate error messages for various failure modes
 * 3. Properly handles Auth.js request errors
 *
 * IMPORTANT: These tests help prevent P0 incidents where users see a "frozen" login page.
 */

import { test, expect } from '@playwright/test';
import { E2E_TEST_USER } from './global-setup';

test.describe('Login Behavior - Error Handling', () => {
  test('should show error for invalid credentials (not hang)', async ({ page }) => {
    await page.goto('/login');

    // Fill with known-bad credentials
    await page.fill('input[type="email"]', 'nonexistent-user-12345@test.invalid');
    await page.fill('input[type="password"]', 'definitely-wrong-password');

    // Click login
    await page.click('button[type="submit"]');

    // Should show an error within 35 seconds (not hang forever)
    // The credentials endpoint normally responds within 5s, but we allow extra time for slow networks
    const errorLocator = page.locator('[class*="red"], [class*="error"], [role="alert"]').first();
    await expect(errorLocator).toBeVisible({ timeout: 35000 });

    // The loading state should be cleared (button should be re-enabled)
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
  });

  test('should show error for empty email', async ({ page }) => {
    await page.goto('/login');

    // Only fill password
    await page.fill('input[type="password"]', 'somepassword');
    await page.click('button[type="submit"]');

    // HTML5 validation should trigger - email field should be focused
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();
  });

  test('should show error for empty password', async ({ page }) => {
    await page.goto('/login');

    // Only fill email
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // HTML5 validation should trigger - password field should be focused
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeFocused();
  });

  test('should not hang when the credentials endpoint is slow', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'fixture@example.com');
    await page.fill('input[type="password"]', 'fixture-password');
    let intercepted = false;
    await page.route('**/api/auth/callback/credentials**', async route => {
      intercepted = true;
      await new Promise(resolve => setTimeout(resolve, 20_000));
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    });
    await page.click('button[type="submit"]');
    await expect(page.getByText('Sign-in timed out. Please try again.')).toBeVisible({ timeout: 18_000 });
    expect(intercepted, 'the real Auth.js endpoint must have been delayed').toBe(true);
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

});

test.describe('Login Behavior - Success Path', () => {
  const email = process.env.SMOKE_TEST_EMAIL || E2E_TEST_USER.email;
  const password = process.env.SMOKE_TEST_PASSWORD || E2E_TEST_USER.password;

  test.use({ storageState: { cookies: [], origins: [] } });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', email!);
    await page.fill('input[type="password"]', password!);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard within 30 seconds
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });

    // Dashboard should contain authenticated content
    await expect(page.locator('body')).toContainText(/dashboard|athletes|welcome/i);
  });

  test('should maintain session after page reload', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', email!);
    await page.fill('input[type="password"]', password!);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/dashboard/, { timeout: 30000 });

    // Reload page
    await page.reload();

    // Should still be on dashboard (session persisted)
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });
});

test.describe('Login Page Console Errors', () => {
  test('should not have critical JavaScript errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known non-critical errors
        if (!text.includes('favicon') && !text.includes('404')) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Filter out Firebase-related initialization messages that aren't real errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('[Firebase]') && // Our own Firebase logging
        !err.includes('baseline-browser-mapping') // Dev warning
    );

    // Log but don't fail for Firebase config warnings (those are expected in dev)
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }

    // Only fail if there are critical errors that would break functionality
    const breakingErrors = criticalErrors.filter(
      (err) =>
        err.includes('CRITICAL') ||
        err.includes('Uncaught') ||
        err.includes('undefined is not') ||
        err.includes('Cannot read property')
    );

    expect(breakingErrors).toHaveLength(0);
  });

  test('should expose the configured Auth.js credentials provider', async ({ page }) => {
    const response = await page.request.get('/api/auth/providers');
    expect(response.ok()).toBe(true);
    expect(await response.json()).toMatchObject({ credentials: { type: 'credentials' } });
  });

});
