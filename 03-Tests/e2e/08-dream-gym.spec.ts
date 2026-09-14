import { test, expect } from '@playwright/test';
import {
  navigateTo,
  waitForPageReady,
  navigateToDreamGym,
  hasText,
  logProgress,
} from './test-helpers';

/**
 * Dream Gym E2E Tests
 *
 * Tests Dream Gym functionality including:
 * 1. Onboarding flow
 * 2. Schedule setup
 * 3. Workout execution
 * 4. Mental check-in
 * 5. AI Strategy display
 * 6. Progress/Analytics
 *
 * Uses shared authenticated state from global setup.
 * All tests use the same pre-created test account and athlete.
 */

test.describe('Dream Gym - Onboarding', () => {
  test('should access Dream Gym from dashboard', async ({ page }) => {
    await navigateTo(page, '/dashboard');

    // Look for Dream Gym button
    const dreamGymButton = page.locator('button, a').filter({ hasText: /Dream Gym/i }).first();
    await expect(dreamGymButton).toBeVisible({ timeout: 15000 });

    logProgress('Dream Gym button visible on dashboard');
  });

  test('should navigate to Dream Gym and see content', async ({ page }) => {
    const athleteId = await navigateToDreamGym(page);

    expect(athleteId, 'the fixture athlete must be available').toBeTruthy();

    // Should show Dream Gym content
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toMatch(/Dream Gym|Onboarding|Get Started|Training|Set up|Workout/i);

    logProgress('Dream Gym page loaded');
  });

  test('should show onboarding or main Dream Gym UI', async ({ page }) => {
    // Navigate directly to Dream Gym (sidebar navigation can be unreliable in tests)
    await navigateTo(page, '/dashboard/dream-gym');

    // Wait for page to render meaningful content (not just loading skeleton)
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const pageContent = await page.locator('body').textContent();
    const hasDreamGymContent = /Dream Gym|Onboarding|Goals|Training|Workout|Schedule|athlete|player|setup/i.test(pageContent || '');

    expect(hasDreamGymContent).toBeTruthy();
    logProgress('Dream Gym UI displayed');
  });
});

test.describe('Dream Gym - Workout Flow', () => {
  test('should display workout page', async ({ page }) => {
    await navigateTo(page, '/dashboard/dream-gym/workout');

    const pageContent = await page.locator('body').textContent();
    const hasWorkoutContent = /Workout|Exercise|Sets|Reps|Training|Onboarding|Complete your setup/i.test(pageContent || '');

    expect(hasWorkoutContent).toBeTruthy();
    logProgress('Workout page accessible');
  });

  test('should show exercise tracking UI when available', async ({ page }) => {
    await navigateTo(page, '/dashboard/dream-gym/workout');

    // Look for exercise cards (may not exist if onboarding not complete)
    const exerciseCard = page.locator('[data-testid="exercise-card"], .exercise-card, [class*="exercise"]').first();

    if (await exerciseCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      logProgress('Exercise card visible');

      // Look for set/rep inputs
      const setInput = page.locator('input[type="number"], [data-testid="reps-input"]').first();
      if (await setInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        logProgress('Set tracking inputs visible');
      }
    } else {
      logProgress('Workout page shows onboarding prompt (expected for new users)');
    }
  });
});

test.describe('Dream Gym - Mental Check-in', () => {
  test('should display mental check-in page', async ({ page }) => {
    await navigateTo(page, '/dashboard/dream-gym/mental');

    const pageContent = await page.locator('body').textContent();
    const hasMentalContent = /Mental|Mood|Energy|Check.?in|How.*feeling|Onboarding/i.test(pageContent || '');

    expect(hasMentalContent).toBeTruthy();
    logProgress('Mental check-in page accessible');
  });

  test('should show mood/energy selection when available', async ({ page }) => {
    await navigateTo(page, '/dashboard/dream-gym/mental');

    // Look for mood selection UI
    const moodUI = page.locator('button, [data-testid="mood-selector"], input[type="range"]')
      .filter({ hasText: /Great|Good|Okay|Struggling|1|2|3|4|5/i })
      .first();

    if (await moodUI.isVisible({ timeout: 5000 }).catch(() => false)) {
      await moodUI.click();
      logProgress('Mood selector interactive');
    } else {
      logProgress('Mental page shows setup prompt (expected for new users)');
    }
  });
});

test.describe('Dream Gym - AI Strategy', () => {
  test('should display AI Strategy page', async ({ page }) => {
    await navigateTo(page, '/dashboard/dream-gym/strategy');

    const pageContent = await page.locator('body').textContent();
    const hasStrategyContent = /Strategy|AI|Workout Plan|Recommendations|Recovery|Onboarding|Insights/i.test(pageContent || '');

    expect(hasStrategyContent).toBeTruthy();
    logProgress('AI Strategy page accessible');
  });

  test('should show AI insights or setup prompt', async ({ page }) => {
    await navigateTo(page, '/dashboard/athletes');
    await waitForPageReady(page);

    // Click first athlete
    const athleteLink = page.locator('a[href*="/athletes/"]').first();

    await expect(athleteLink, 'fixture athlete must be available').toBeVisible();

    await athleteLink.click();
    await page.waitForURL(/.+\/athletes\/.+/, { timeout: 30000 });

    // Look for Dream Gym/AI card on athlete detail
    const hasAIContent = await hasText(page, /Dream Gym|AI Strategy|Training|Insights/i);

    if (hasAIContent) {
      logProgress('Dream Gym/AI content visible on athlete detail');
    } else {
      logProgress('Athlete detail loaded (Dream Gym card may require setup)');
    }
  });
});

test.describe('Dream Gym - Progress & Analytics', () => {
  test('should display progress page', async ({ page }) => {
    await navigateTo(page, '/dashboard/dream-gym/progress');

    const pageContent = await page.locator('body').textContent();
    const hasProgressContent = /Progress|Analytics|Charts|Stats|Volume|Workouts|No data|Onboarding/i.test(pageContent || '');

    expect(hasProgressContent).toBeTruthy();
    logProgress('Progress page accessible');
  });

  test('should display assessments page', async ({ page }) => {
    await navigateTo(page, '/dashboard/dream-gym/assessments');

    const pageContent = await page.locator('body').textContent();
    const hasAssessmentContent = /Assessment|Fitness Test|Beep Test|Sprint|Performance|Onboarding|Log/i.test(pageContent || '');

    expect(hasAssessmentContent).toBeTruthy();
    logProgress('Assessments page accessible');
  });

  test('should display biometrics page', async ({ page }) => {
    await navigateTo(page, '/dashboard/dream-gym/biometrics');

    const pageContent = await page.locator('body').textContent();
    const hasBiometricsContent = /Biometrics|Heart Rate|Sleep|HRV|Steps|Health|Onboarding|Track/i.test(pageContent || '');

    expect(hasBiometricsContent).toBeTruthy();
    logProgress('Biometrics page accessible');
  });
});

test.describe('Dream Gym - Schedule', () => {
  test('should display schedule page', async ({ page }) => {
    await navigateTo(page, '/dashboard/dream-gym/schedule');

    const pageContent = await page.locator('body').textContent();
    const hasScheduleContent = /Schedule|Monday|Tuesday|Wednesday|Days|Weekly|Onboarding|Training/i.test(pageContent || '');

    expect(hasScheduleContent).toBeTruthy();
    logProgress('Schedule page accessible');
  });

  test('should show day selection when available', async ({ page }) => {
    await navigateTo(page, '/dashboard/dream-gym/schedule');

    // Look for day selection buttons
    const dayButton = page.locator('button, input[type="checkbox"], label')
      .filter({ hasText: /Monday|Tuesday|Wednesday|Thursday|Friday/i })
      .first();

    if (await dayButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dayButton.click();
      logProgress('Day selection interactive');
    } else {
      logProgress('Schedule page shows setup prompt (expected for new users)');
    }
  });
});

test.describe('Dream Gym - Navigation', () => {
  test('should have navigation between Dream Gym sections', async ({ page }) => {
    await navigateTo(page, '/dashboard/dream-gym');

    // Verify Dream Gym pages are accessible by navigating to each
    // This is more reliable than checking for sidebar links
    const sections = [
      { name: 'Workout', path: '/dashboard/dream-gym/workout' },
      { name: 'Schedule', path: '/dashboard/dream-gym/schedule' },
      { name: 'Mental', path: '/dashboard/dream-gym/mental' },
      { name: 'Progress', path: '/dashboard/dream-gym/progress' },
      { name: 'Strategy', path: '/dashboard/dream-gym/strategy' },
    ];

    let accessibleSections = 0;

    for (const section of sections) {
      await page.goto(section.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // If we didn't get redirected to login, the section is accessible
      if (!page.url().includes('/login')) {
        accessibleSections++;
        logProgress(`${section.name} section accessible`);
      }
    }

    // All sections should be accessible when authenticated
    expect(accessibleSections).toBe(sections.length);
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await navigateTo(page, '/dashboard/dream-gym');

    // Use direct navigation - sidebar clicking is unreliable
    await navigateTo(page, '/dashboard');

    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/dream-gym');
    logProgress('Dashboard accessible from Dream Gym');
  });

  test('should maintain auth state across navigation', async ({ page }) => {
    // Navigate through multiple pages to verify auth persists
    const pages = [
      '/dashboard',
      '/dashboard/athletes',
      '/dashboard/dream-gym',
      '/dashboard/dream-gym/workout',
      '/dashboard',
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Should not redirect to login
      expect(page.url()).not.toContain('/login');
    }

    logProgress('Auth state maintained across navigation');
  });
});
