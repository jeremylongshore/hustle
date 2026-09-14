import { verifyRegisteredUser } from './fixture-auth';
import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 *
 * Tests user registration, login, logout, and session management
 */

test.describe('Authentication Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should load landing page successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title contains "Hustle"
    await expect(page).toHaveTitle(/Hustle/i);

    // Check landing page has main heading
    for (const title of ['Track.', 'Train.', 'Dominate.']) {
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    }
  });

  test('should show login page', async ({ page }) => {
    await page.goto('/login');

    // Check for email and password fields
    await expect(page.locator('input[type="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]:not([name="confirmPassword"]), input[type="password"]')).toBeVisible();

    // Check for submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for empty login form', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors or stay on login page
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill with invalid credentials
    await page.fill('input[type="email"], input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]:not([name="confirmPassword"]), input[type="password"]', 'wrongpassword');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(2000);

    // Should show error or stay on login page
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('should allow user registration', async ({ page }) => {
    await page.goto('/register');

    // Generate unique email for testing
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;

    // Fill registration form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]:not([name="confirmPassword"])', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

    // Submit registration
    await page.click('button[type="submit"]');

    // Wait for redirect or success message
    await page.waitForTimeout(3000);

    // Should redirect to login or dashboard
    const url = page.url();
    expect(url).toMatch(/\/verify-email/);
  });

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    // First, create a test account
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]:not([name="confirmPassword"])', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for registration to complete
    await page.waitForTimeout(2000);

    await page.waitForURL(/\/verify-email/);
    await verifyRegisteredUser(page, testEmail);

    await page.fill('input[type="email"], input[type="email"]', testEmail);
    await page.fill('input[type="password"]:not([name="confirmPassword"]), input[type="password"]', testPassword);

    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForTimeout(3000);

    // Should be on dashboard
    const url = page.url();
    expect(url).toContain('/dashboard');
  });

  test('should protect dashboard route when not authenticated', async ({ browser }) => {
    // Create a fresh context without any auth state
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    try {
      // Try to access dashboard without logging in
      await page.goto('/dashboard');

      // Wait for redirect to login
      await page.waitForURL(/\/login/, { timeout: 10000 });

      const url = page.url();
      expect(url).toContain('/login');
    } finally {
      await context.close();
    }
  });

  test('should allow logout', async ({ page }) => {
    // First login
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `logouttest${timestamp}@example.com`;

    await page.fill('input[name="firstName"]', 'Logout');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]:not([name="confirmPassword"])', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/verify-email/, { timeout: 10000 });
    await verifyRegisteredUser(page, testEmail);

    // If on login page, login again
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"], input[type="email"]', testEmail);
      await page.fill('input[type="password"]:not([name="confirmPassword"]), input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    }

    // Should be logged in
    expect(page.url()).toContain('/dashboard');

    await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should maintain session after page refresh', async ({ page }) => {
    // Login
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `sessiontest${timestamp}@example.com`;

    await page.fill('input[name="firstName"]', 'Session');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]:not([name="confirmPassword"])', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/verify-email/);
    await verifyRegisteredUser(page, testEmail);
    await page.fill('input[type="email"], input[type="email"]', testEmail);
    await page.fill('input[type="password"]:not([name="confirmPassword"]), input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Refresh page
    await page.reload();

    await page.waitForTimeout(1000);

    // Should still be on dashboard
    const url = page.url();
    expect(url).toContain('/dashboard');
  });
});

test.describe('Registration Validation', () => {

  test('should reject passwords below the documented eight-character minimum', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[type="email"]', 'test@example.com');

    const weakPasswords = ['123', 'abc', '1234567'];

    for (const weakPassword of weakPasswords) {
      await page.fill('input[type="password"]:not([name="confirmPassword"])', weakPassword);
      await page.fill('input[name="confirmPassword"]', weakPassword);
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      // Should show error or stay on registration page
      const url = page.url();
      expect(url).toContain('/register');
    }
  });

  test('should reject invalid email formats', async ({ page }) => {
    await page.goto('/register');

    const invalidEmails = [
      'notanemail',
      '@example.com',
      'test@',
      'test@example..com'
    ];

    for (const invalidEmail of invalidEmails) {
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[type="email"]', invalidEmail);
      await page.fill('input[type="password"]:not([name="confirmPassword"])', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      // Should show validation error or stay on page
      const url = page.url();
      expect(url).toContain('/register');
    }
  });

  test('should reject duplicate email registration', async ({ page }) => {
    const timestamp = Date.now();
    const duplicateEmail = `duplicate${timestamp}@example.com`;

    // Register first time
    await page.goto('/register');
    await page.fill('input[name="firstName"]', 'First');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[type="email"]', duplicateEmail);
    await page.fill('input[type="password"]:not([name="confirmPassword"])', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Try to register again with same email
    await page.goto('/register');
    await page.fill('input[name="firstName"]', 'Second');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[type="email"]', duplicateEmail);
    await page.fill('input[type="password"]:not([name="confirmPassword"])', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Should show error or stay on registration page
    const url = page.url();
    expect(url).toContain('/register');
  });
});
