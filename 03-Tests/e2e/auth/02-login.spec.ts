import { test, expect } from '@playwright/test'

/**
 * Login Flow E2E Tests
 *
 * Tests the complete user login workflow:
 * 1. Navigate to login page
 * 2. Enter credentials
 * 3. Submit login form
 * 4. Verify successful login and redirect to dashboard
 * 5. Test error cases (wrong password, unverified email)
 */

test.describe('User Login Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.beforeEach(async ({ page }) => {
    // Navigate directly to login page
    await page.goto('/login')
  })

  test('should display login page correctly', async ({ page }) => {
    // Should display all form fields
    await expect(page.locator('input#email')).toBeVisible()
    await expect(page.locator('input#password')).toBeVisible()

    // Should display submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Should have "Forgot password?" link
    await expect(page.locator('text=/forgot.*password/i')).toBeVisible()

    // Should have "Create Account" link
    await expect(page.locator('text=/sign.*up/i')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should stay on login page (HTML5 validation)
    await expect(page).toHaveURL('/login')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Try to login with non-existent account
    await page.fill('input#email', 'nonexistent@example.com')
    await page.fill('input#password', 'WrongPassword123!')
    await page.click('button[type="submit"]')

    // Keep the public response generic so account existence is not disclosed.
    await expect(page.getByText('Invalid email or password.', { exact: true })).toBeVisible({ timeout: 10000 })

    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  // The actual credentials provider must reject an unverified fixture account.
  test('should reject an unverified email without disclosing account state', async ({ page }) => {
    // First, register a new user (which won't be verified)
    await page.goto('/register')

    const timestamp = Date.now()
    const testEmail = `unverified-${timestamp}@example.com`
    const testPassword = 'TestPassword123!'

    await page.fill('input#firstName', 'Unverified')
    await page.fill('input#lastName', 'User')
    await page.fill('input#email', testEmail)
    await page.fill('input#confirmPassword', testPassword)
    await page.fill('input#password', testPassword)
    await page.click('button[type="submit"]')

    // Wait for registration to complete (redirects to login)
    await expect(page).toHaveURL(/\/verify-email/, { timeout: 10000 })
    await page.goto('/login')

    // Now try to login with unverified account
    await page.fill('input#email', testEmail)
    await page.fill('input#password', testPassword)
    await page.click('button[type="submit"]')

    await expect(page.getByText('Invalid email or password.', { exact: true })).toBeVisible({ timeout: 10000 })

    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('should navigate to forgot password page', async ({ page }) => {
    // Click "Forgot password?" link
    await page.click('text=/forgot.*password/i')

    // Should navigate to forgot password page
    await expect(page).toHaveURL('/reset-password')
  })

  test('should navigate to registration page', async ({ page }) => {
    // Click "Create Account" link
    await page.click('text=/sign.*up/i')

    // Should navigate to registration page
    await expect(page).toHaveURL('/register')
  })

  test('should mask password input', async ({ page }) => {
    const passwordInput = page.locator('input#password')

    // Password field should have type="password"
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should handle form submission with Enter key', async ({ page }) => {
    // Fill in credentials
    await page.fill('input#email', 'test@example.com')
    await page.fill('input#password', 'TestPassword123!')

    // Press Enter in password field
    await page.locator('input#password').press('Enter')

    // Form should submit (even though credentials are wrong, it should try)
    // We'll get an error, but that proves the form submitted
    await expect(page.getByText('Invalid email or password.', { exact: true })).toBeVisible({ timeout: 10000 })
  })
})
