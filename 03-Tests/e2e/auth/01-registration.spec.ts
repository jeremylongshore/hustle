import { test, expect } from '@playwright/test'

/**
 * Registration Flow E2E Tests
 *
 * Tests the complete user registration workflow:
 * 1. Navigate to registration page
 * 2. Fill out registration form
 * 3. Submit form
 * 4. Verify success message
 * 5. Verify redirect to login page
 */

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to registration page
    await page.goto('/register')
  })

  test('should display registration page correctly', async ({ page }) => {
    // Should display all form fields
    await expect(page.locator('input#firstName')).toBeVisible()
    await expect(page.locator('input#lastName')).toBeVisible()
    await expect(page.locator('input#email')).toBeVisible()
    await expect(page.locator('input#password')).toBeVisible()

    // Should display submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should stay on registration page (HTML5 validation)
    await expect(page).toHaveURL('/register')
  })

  test('should validate email format', async ({ page }) => {
    // Fill form with invalid email
    await page.fill('input#firstName', 'John')
    await page.fill('input#lastName', 'Doe')
    await page.fill('input#email', 'invalid-email')
    await page.fill('input#password', 'SecurePass123!')

    // Try to submit
    await page.click('button[type="submit"]')

    // HTML5 validation should prevent submission
    await expect(page).toHaveURL('/register')
  })

  test('should register new user successfully', async ({ page }) => {
    // Generate unique email for this test run
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@example.com`

    // Fill registration form
    await page.fill('input#firstName', 'E2E')
    await page.fill('input#lastName', 'Test')
    await page.fill('input#email', testEmail)
    await page.fill('input#confirmPassword', 'TestPassword123!')
    await page.fill('input#password', 'TestPassword123!')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to login page (registration successful)
    await expect(page).toHaveURL(/\/verify-email/, { timeout: 10000 })
  })

  test('should show error for duplicate email', async ({ page }) => {
    // Use unique timestamp to avoid conflicts with previous test runs
    const timestamp = Date.now()
    const testEmail = `duplicate-${timestamp}@example.com`

    // First registration
    await page.fill('input#firstName', 'First')
    await page.fill('input#lastName', 'User')
    await page.fill('input#email', testEmail)
    await page.fill('input#confirmPassword', 'Password123!')
    await page.fill('input#password', 'Password123!')
    await page.click('button[type="submit"]')

    // Wait for first registration to complete - in E2E mode may go to dashboard due to auto-verify bypass
    await expect(page).toHaveURL(/\/verify-email/, { timeout: 10000 })

    // Try to register again with same email
    await page.goto('/register')
    await page.fill('input#firstName', 'Second')
    await page.fill('input#lastName', 'User')
    await page.fill('input#email', testEmail)
    await page.fill('input#confirmPassword', 'Password456!')
    await page.fill('input#password', 'Password456!')
    await page.click('button[type="submit"]')

    // Should show error about email already existing
    const errorMessage = page.locator('text=/already.*exist|email.*taken|already.*registered/i')
    await expect(errorMessage).toBeVisible({ timeout: 10000 })
  })

  test('should have link to login page', async ({ page }) => {
    // Should have "Already have account? Login" link
    const loginLink = page.getByRole('link', { name: 'Sign in', exact: true })
    await expect(loginLink).toBeVisible()

    // Clicking should navigate to login
    await loginLink.click()
    await expect(page).toHaveURL('/login')
  })
})
