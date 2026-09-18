# Synthetic QA Harness - Implementation Plan
**Project:** Hustle
**Document:** 252-PP-PLAN-synthetic-qa-harness-implementation.md
**Date:** 2025-11-19
**Status:** 🔄 **PLANNING**
**Purpose:** Beat on the app with synthetic "fake humans" before unleashing real users or building fixer agents

---

## Executive Summary

This plan establishes a **two-layer testing strategy** for Hustle:

1. **Layer 1: Internal Synthetic QA** - Browser-based E2E tests that mimic real user clicks/forms (THIS PLAN)
2. **Layer 2: Issue-Fixer Agents** - Smart robots that call this test harness after applying code fixes (FUTURE)

**Critical Insight:** Build the test harness FIRST. The fixer agents will later use `npm run qa:e2e:smoke` as proof that "fake humans" are still happy after a code change.

**Current State:**
- ✅ 1,581 lines of Playwright E2E tests exist (7 test files)
- ✅ Comprehensive journey coverage (register → add athlete → log game → verify stats)
- ✅ Validation tests (XSS, rate limiting, result-score consistency)
- ✅ **GitHub Actions CI workflow** runs E2E tests on PRs/main
- ✅ **E2E Auth Fix** - Server-side email verification bypass in test mode
- ❌ **NO staging seed script** for stable test data
- ❌ Missing critical journeys (Stripe, workspace collaboration, password reset, mobile)

---

## E2E Auth & Session Fix (2025-12-27)

### Problem
E2E tests in CI were failing because:
1. Client-side `signIn()` bypassed email verification in E2E mode (`NEXT_PUBLIC_E2E_TEST_MODE=true`)
2. But server-side `getDashboardUser()` still checked `emailVerified` from the Firebase token
3. New test users have `email_verified: false`, so dashboard redirected back to login

### Solution
Updated `src/lib/firebase/admin-auth.ts` to also respect E2E test mode:

```typescript
// E2E test mode: bypass email verification for testing
const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
const emailVerified = isE2ETestMode ? true : (decodedToken.email_verified || false);
```

### Production Safety
- `NEXT_PUBLIC_E2E_TEST_MODE` is only set in CI workflow and Playwright config
- Production deployments do NOT set this variable
- Real email verification is enforced in production

---

## 1. Define "Human Journeys" First

### ✅ Already Covered (Existing Tests)

1. **Parent Signs Up → Creates Player → Logs Game**
   - File: `03-Tests/e2e/04-complete-user-journey.spec.ts`
   - Coverage: Registration, login, add athlete, log game, verify stats

2. **Position-Specific Stats (Goalkeeper vs Field Player)**
   - File: `03-Tests/e2e/04-complete-user-journey.spec.ts`
   - Coverage: Different stats fields based on position

3. **Data Validation & Security**
   - File: `03-Tests/e2e/04-complete-user-journey.spec.ts`
   - Coverage: Result-score consistency, future dates, XSS prevention, rate limiting

### ❌ Missing Critical Journeys (Need Implementation)

4. **Stripe Subscription Flow**
   - Parent upgrades from Free → Pro plan
   - Verify plan limits enforced (Pro allows 10 players vs Free 2)
   - Verify Stripe webhook updates Firestore subscription status
   - Verify billing portal access works

5. **Workspace Collaboration**
   - Parent invites coach to workspace
   - Coach receives invitation, accepts
   - Coach can view athletes, cannot delete
   - Parent can remove coach access

6. **Password Reset Flow**
   - User clicks "Forgot Password"
   - Enters email → receives reset link
   - Clicks link → sets new password
   - Logs in with new password

7. **Multi-Player Management**
   - Parent creates 3 players (different positions/leagues)
   - Switches between player dashboards
   - Logs games for each player
   - Verifies stats don't cross-contaminate

8. **Mobile Viewport - Dashboard Load**
   - Parent logs in on iPhone viewport (375x667)
   - Dashboard loads without horizontal scroll
   - Can tap "Add Athlete" button
   - Can navigate to player detail page

9. **Player Profile Enrichment**
   - Create player with position "Attacking Midfielder" (AM)
   - Select league "ECNL Girls" from dropdown
   - Select "Other" league → enter custom league "Local Rec League"
   - Verify position validation (primary position cannot be in secondary list)

10. **Billing Portal Access (Stripe Customer Portal)**
    - Parent clicks "Manage Billing"
    - Redirected to Stripe Customer Portal
    - Can view invoices, update payment method
    - Redirect back to Hustle dashboard works

---

## 2. E2E Harness Architecture (Playwright)

### Current Configuration (`playwright.config.ts`)

✅ **Already Configured:**
- Test directory: `./03-Tests/e2e`
- Base URL: `http://localhost:4000` (or `PLAYWRIGHT_BASE_URL`)
- Screenshots: `only-on-failure`
- Traces: `on-first-retry`
- Video: `retain-on-failure`
- Multiple browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- WebServer: Starts dev server automatically (`npm run dev -- -H 0.0.0.0 -p 4000`)

❌ **Missing:**
- Staging environment configuration
- Test data seed script
- Cleanup utilities
- Firebase Auth test helpers (currently uses manual form fills)

### Recommended Enhancements

#### A. Add Staging Environment Support

```typescript
// playwright.config.ts enhancement
export default defineConfig({
  // ...existing config

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ||
             process.env.CI
               ? 'https://staging.hustlestats.io'  // CI uses staging
               : 'http://localhost:4000',         // Local uses dev server

    // Add staging-specific context
    extraHTTPHeaders: {
      'X-Test-Environment': process.env.CI ? 'staging' : 'local'
    },
  },

  // Conditional webServer (only start for local, not staging)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev -- -H 0.0.0.0 -p 4000',
    url: 'http://localhost:4000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
```

#### B. Add Test Helpers for Firebase Auth

Create `03-Tests/helpers/auth.ts`:

```typescript
import { Page } from '@playwright/test';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Initialize Firebase (test config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function createTestUser(email: string, password: string) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function deleteTestUser(uid: string) {
  // Use Firebase Admin SDK via API endpoint
  // Requires /api/test/cleanup endpoint
}

export async function loginViaFirebase(page: Page, email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await userCredential.user.getIdToken();

  // Set auth cookie/localStorage for Playwright session
  await page.context().addCookies([{
    name: 'firebase-auth-token',
    value: idToken,
    domain: new URL(page.url()).hostname,
    path: '/',
  }]);
}
```

---

## 3. Staging Seed Script for Stable Test Data

### Problem
Current tests create random users (`journeytest${timestamp}@example.com`) which pollutes Firestore and has no cleanup.

### Solution
Create **fixed test accounts** that are seeded in staging and reset before each CI run.

### Implementation: `05-Scripts/seed-staging.ts`

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const auth = getAuth();

/**
 * Seed staging environment with stable test data
 */
async function seedStaging() {
  console.log('🌱 Seeding staging environment...');

  // 1. Create demo parent account
  const parentEmail = 'demo-parent@hustle-test.com';
  const parentPassword = 'DemoParent123!';

  try {
    // Delete if exists
    const existingUser = await auth.getUserByEmail(parentEmail).catch(() => null);
    if (existingUser) {
      await auth.deleteUser(existingUser.uid);
      console.log(`✓ Deleted existing user: ${parentEmail}`);
    }

    // Create fresh user
    const parentUser = await auth.createUser({
      email: parentEmail,
      password: parentPassword,
      emailVerified: true,
      displayName: 'Demo Parent',
    });

    console.log(`✓ Created demo parent: ${parentEmail}`);

    // 2. Create Firestore user document
    await db.collection('users').doc(parentUser.uid).set({
      email: parentEmail,
      firstName: 'Demo',
      lastName: 'Parent',
      agreedToTerms: true,
      agreedToPrivacy: true,
      isParentGuardian: true,
      createdAt: new Date(),
      workspace: {
        id: `demo-workspace-${parentUser.uid}`,
        plan: 'FREE',
        status: 'ACTIVE',
        playerLimit: 2,
      },
    });

    // 3. Create 2 demo players
    const player1Ref = await db.collection('users').doc(parentUser.uid).collection('players').add({
      name: 'Demo Player 1',
      birthday: '2010-06-15',
      primaryPosition: 'Attacking Midfielder',
      secondaryPositions: ['Central Midfielder'],
      league: 'ECNL Girls',
      teamClub: 'Demo FC',
      createdAt: new Date(),
    });

    const player2Ref = await db.collection('users').doc(parentUser.uid).collection('players').add({
      name: 'Demo Player 2',
      birthday: '2011-03-20',
      primaryPosition: 'Goalkeeper',
      secondaryPositions: [],
      league: 'MLS Next',
      teamClub: 'Keeper United',
      createdAt: new Date(),
    });

    console.log(`✓ Created 2 demo players`);

    // 4. Create demo games for each player
    await db.collection('users').doc(parentUser.uid)
      .collection('players').doc(player1Ref.id)
      .collection('games').add({
        date: new Date('2024-11-01'),
        opponent: 'Rival FC',
        result: 'Win',
        yourScore: 3,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
        assists: 2,
        tackles: 5,
        interceptions: 3,
        createdAt: new Date(),
      });

    console.log(`✓ Created demo game for Player 1`);

    console.log('✅ Staging seed complete!\n');
    console.log('Demo Credentials:');
    console.log(`  Email: ${parentEmail}`);
    console.log(`  Password: ${parentPassword}`);
    console.log(`  Player 1 ID: ${player1Ref.id}`);
    console.log(`  Player 2 ID: ${player2Ref.id}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedStaging();
```

### Usage

```bash
# Run before E2E tests in CI
export FIREBASE_SERVICE_ACCOUNT_KEY=$(cat path/to/service-account.json)
npx tsx 05-Scripts/seed-staging.ts
```

---

## 4. Missing Journey E2E Tests - Implementation

### Test 1: Stripe Subscription Flow

**File:** `03-Tests/e2e/06-stripe-subscription.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Stripe Subscription Flow', () => {
  test('should upgrade from Free to Pro plan and enforce limits', async ({ page }) => {
    // Login as demo parent (Free plan, 2 players max)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo-parent@hustle-test.com');
    await page.fill('input[type="password"]', 'DemoParent123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Verify current plan is Free
    await page.goto('/dashboard/billing');
    await expect(page.locator('text=/Free Plan|FREE/i')).toBeVisible();

    // Attempt to create 3rd player (should fail on Free plan)
    await page.goto('/dashboard/add-athlete');
    await page.fill('input[name="name"]', 'Third Player');
    await page.fill('input[name="birthday"]', '2012-01-01');
    await page.fill('input[name="teamClub"]', 'Test FC');
    await page.click('button[type="submit"]');

    // Should show plan limit error
    await expect(page.locator('text=/Plan limit|Upgrade to Pro/i')).toBeVisible();
    console.log('✓ Free plan enforced (2 player limit)');

    // Click "Upgrade to Pro"
    await page.click('button:has-text("Upgrade"), a:has-text("Upgrade")');
    await page.waitForTimeout(1000);

    // Should redirect to Stripe Checkout
    await expect(page.url()).toContain('checkout.stripe.com');
    console.log('✓ Redirected to Stripe Checkout');

    // TODO: Complete checkout flow (requires Stripe test mode webhook simulation)
    // For now, manually set plan to Pro via API

    // Verify Pro plan allows 10 players
    // (Test continues after webhook updates Firestore)
  });
});
```

### Test 2: Workspace Collaboration

**File:** `03-Tests/e2e/07-workspace-collaboration.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Workspace Collaboration', () => {
  test('should invite coach and verify role-based access', async ({ page, context }) => {
    // Parent logs in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo-parent@hustle-test.com');
    await page.fill('input[type="password"]', 'DemoParent123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Navigate to workspace settings
    await page.goto('/dashboard/workspace');

    // Click "Invite Member"
    await page.click('button:has-text("Invite"), button:has-text("Add Member")');

    // Fill coach email and role
    const coachEmail = `coach-${Date.now()}@hustle-test.com`;
    await page.fill('input[name="email"], input[placeholder*="email"]', coachEmail);
    await page.selectOption('select[name="role"]', 'COACH');
    await page.click('button[type="submit"]');

    // Verify invitation sent
    await expect(page.locator(`text=/${coachEmail}/i`)).toBeVisible();
    console.log(`✓ Coach invitation sent to ${coachEmail}`);

    // TODO: Coach accepts invitation and verifies read-only access
    // (Requires email simulation or invitation token extraction)
  });
});
```

### Test 3: Password Reset Flow

**File:** `03-Tests/e2e/08-password-reset.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow', () => {
  test('should reset password and login with new credentials', async ({ page }) => {
    await page.goto('/login');

    // Click "Forgot Password"
    await page.click('a:has-text("Forgot"), button:has-text("Forgot")');
    await page.waitForURL(/\/forgot-password/);

    // Enter email
    const testEmail = 'demo-parent@hustle-test.com';
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Verify confirmation message
    await expect(page.locator('text=/Check your email|Reset link sent/i')).toBeVisible();
    console.log(`✓ Password reset email sent to ${testEmail}`);

    // TODO: Extract reset token from email and complete flow
    // (Requires Firebase Auth test helper or email service integration)
  });
});
```

### Test 4: Mobile Viewport - Dashboard Load

**File:** `03-Tests/e2e/09-mobile-viewport.spec.ts`

```typescript
import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['iPhone 12'],
});

test.describe('Mobile Viewport - Dashboard', () => {
  test('should load dashboard without horizontal scroll on mobile', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo-parent@hustle-test.com');
    await page.fill('input[type="password"]', 'DemoParent123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Verify viewport width
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(390); // iPhone 12 width

    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(390);
    console.log('✓ No horizontal scroll on mobile dashboard');

    // Verify "Add Athlete" button is tappable
    const addButton = page.locator('button:has-text("Add Athlete"), a:has-text("Add Athlete")');
    await expect(addButton).toBeVisible();
    await addButton.click();
    await page.waitForURL(/\/add-athlete/);
    console.log('✓ Add Athlete button tappable on mobile');
  });
});
```

---

## 5. GitHub Actions Synthetic QA Workflow

### File: `.github/workflows/synthetic-qa.yml`

```yaml
name: Synthetic QA (Fake Humans)

on:
  workflow_dispatch: {}  # Manual trigger
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  e2e:
    name: E2E Tests (Synthetic QA)
    runs-on: ubuntu-latest

    env:
      PLAYWRIGHT_BASE_URL: https://staging.hustlestats.io
      NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
      FIREBASE_SERVICE_ACCOUNT_KEY: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_KEY }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Seed staging environment
        run: npx tsx 05-Scripts/seed-staging.ts

      - name: Run E2E synthetic QA tests
        run: npx playwright test --project=chromium

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: 03-Tests/playwright-report/
          retention-days: 30

      - name: Upload failure screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-screenshots
          path: 03-Tests/test-results/
          retention-days: 30

      - name: Comment PR with results
        if: github.event_name == 'pull_request' && failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ Synthetic QA failed! Fake humans are unhappy. Check artifacts for screenshots/traces.'
            })
```

### Add npm Scripts

Update `package.json`:

```json
{
  "scripts": {
    "qa:e2e": "playwright test",
    "qa:e2e:smoke": "playwright test 03-Tests/e2e/04-complete-user-journey.spec.ts --project=chromium",
    "qa:e2e:ui": "playwright test --ui",
    "qa:e2e:headed": "playwright test --headed",
    "qa:seed:staging": "tsx 05-Scripts/seed-staging.ts"
  }
}
```

---

## 6. Integration with Future Fixer Agents

### Phase 1: Test the App (THIS PLAN)

```
[Synthetic QA Workflow]
   ↓
[Seed Staging Data] → [Run E2E Tests] → [Screenshots/Traces on Failure]
   ↓                       ↓
[Fixed Test Accounts]  [Verify Journeys]
```

### Phase 2: Issue-Fixer Agents (FUTURE)

```
[Human QA] → [GitHub Issue Created]
                ↓
      [Fixer Agent Triggered]
                ↓
    [Agent Reads Issue + Code]
                ↓
     [Agent Writes Code Patch]
                ↓
   [Agent Runs: npm run qa:e2e:smoke]
                ↓
    ✅ PASS → Agent Opens PR
    ❌ FAIL → Agent Analyzes Traces → Retries
```

**Key Interface:** The fixer agents will call the same test harness we're building now. No new tests needed—just a simple command:

```bash
npm run qa:e2e:smoke
```

If that exits with code 0, the fake humans are happy. If it fails, the agent gets screenshots/traces to analyze.

---

## 7. Success Metrics

### Baseline (Before This Plan)
- ✅ 1,581 lines of E2E tests exist
- ❌ No CI automation
- ❌ No stable test data
- ❌ Tests pollute Firestore with random accounts

### Target (After This Plan)
- ✅ GitHub Actions runs E2E tests on every PR/push
- ✅ Staging environment has seeded test accounts (reset before each run)
- ✅ 10 critical user journeys covered:
  1. ✅ Parent signup → add athlete → log game (EXISTS)
  2. ✅ Position-specific stats (EXISTS)
  3. ✅ Data validation & security (EXISTS)
  4. ✅ Stripe subscription flow (NEW)
  5. ✅ Workspace collaboration (NEW)
  6. ✅ Password reset (NEW)
  7. ✅ Multi-player management (NEW)
  8. ✅ Mobile viewport (NEW)
  9. ✅ Player profile enrichment (NEW)
  10. ✅ Billing portal access (NEW)

- ✅ Failure artifacts saved (screenshots, traces, video)
- ✅ Simple command for fixer agents: `npm run qa:e2e:smoke`
- ✅ Test execution time < 5 minutes (Chromium only in CI)
- ✅ Flaky test rate < 5% (retries on CI)

---

## 8. Implementation Timeline

### Week 1: Foundation & Automation
- [ ] Day 1: Create staging seed script (`05-Scripts/seed-staging.ts`)
- [ ] Day 2: Add GitHub Actions workflow (`.github/workflows/synthetic-qa.yml`)
- [ ] Day 3: Test CI integration → seed → run existing tests → verify artifacts
- [ ] Day 4: Add Firebase Auth test helpers (`03-Tests/helpers/auth.ts`)
- [ ] Day 5: Document test data credentials in CI secrets

### Week 2: Missing Journey Tests
- [ ] Day 1: Stripe subscription flow test (`06-stripe-subscription.spec.ts`)
- [ ] Day 2: Workspace collaboration test (`07-workspace-collaboration.spec.ts`)
- [ ] Day 3: Password reset test (`08-password-reset.spec.ts`)
- [ ] Day 4: Mobile viewport test (`09-mobile-viewport.spec.ts`)
- [ ] Day 5: Player profile enrichment test (`10-player-enrichment.spec.ts`)

### Week 3: Refinement & Documentation
- [ ] Day 1: Optimize test execution time (parallel vs serial)
- [ ] Day 2: Add retry logic for flaky network requests
- [ ] Day 3: Update README with QA testing guide
- [ ] Day 4: Create troubleshooting runbook for CI failures
- [ ] Day 5: Add test coverage report to CI output

### Week 4: Production Hardening
- [ ] Day 1: Add smoke test subset for fast feedback (`qa:e2e:smoke`)
- [ ] Day 2: Test against production (read-only queries)
- [ ] Day 3: Add performance budgets (dashboard load < 2s)
- [ ] Day 4: Add accessibility tests (a11y violations)
- [ ] Day 5: Final validation → merge to main → enable branch protection

---

## 9. Cost & Resource Estimate

### Infrastructure
- **GitHub Actions**: ~10 minutes/run × 30 runs/day = 300 minutes/day (~$0.48/day free tier)
- **Staging Environment**: Firebase Hosting + Firestore (already exists, no added cost)
- **Playwright Browsers**: Included in GitHub Actions (free)

### Development Time
- **Week 1** (Foundation): 20 hours
- **Week 2** (Missing Tests): 20 hours
- **Week 3** (Refinement): 15 hours
- **Week 4** (Hardening): 15 hours
- **Total**: 70 hours (~2 weeks full-time)

### Ongoing Maintenance
- **Flaky Test Fixes**: ~2 hours/week
- **New Journey Tests**: ~4 hours/test (as features are added)
- **CI Monitoring**: ~1 hour/week

---

## 10. Risk Mitigation

### Risk: Flaky Tests
- **Mitigation**: Retry failed tests 2x in CI (`retries: 2`)
- **Mitigation**: Use explicit waits (`waitForURL`) instead of `waitForTimeout`
- **Mitigation**: Seed stable test data (not random timestamps)

### Risk: Staging Environment Downtime
- **Mitigation**: Run smoke tests against local dev server as fallback
- **Mitigation**: Add health check before E2E run (`/api/health`)

### Risk: Test Data Pollution
- **Mitigation**: Seed script DELETES existing test accounts before creating fresh ones
- **Mitigation**: Use dedicated test Firebase project (not production)

### Risk: Stripe Webhook Simulation
- **Mitigation**: Use Stripe Test Mode webhooks with ngrok/Firebase Functions emulator
- **Mitigation**: Alternatively, mock Stripe API responses in test environment

---

## 11. Next Steps (Immediate Actions)

1. **Create seed script** (`05-Scripts/seed-staging.ts`) - 4 hours
2. **Add GitHub Actions workflow** (`.github/workflows/synthetic-qa.yml`) - 2 hours
3. **Test CI integration** (push to branch, verify workflow runs) - 1 hour
4. **Document in CHANGELOG** - 30 minutes
5. **Create GitHub issue** for Week 2 work (missing journey tests) - 30 minutes

**Total Immediate Work**: ~8 hours

---

## 12. References

- **Existing Tests**: `03-Tests/e2e/*.spec.ts` (1,581 lines)
- **Playwright Config**: `playwright.config.ts`
- **QA Automation Plan**: `000-docs/250-PP-PLAN-agentic-qa-automation-workflow.md`
- **GitHub Issue Templates**: `.github/ISSUE_TEMPLATE/qa-*.yml`
- **Firebase Migration Docs**: `000-docs/236-AA-REPT-hustle-phase-1-auth-observability-migration.md`

---

**Document Status:** 🔄 **IN PROGRESS - AUTONOMOUS IMPLEMENTATION**
**Next Action:** Executing Step-by-Step Implementation Plan
**Owner:** Autonomous Agent (Claude Code)
**Started:** 2025-11-19 09:45 UTC

---

## IMPLEMENTATION LOG (Autonomous Execution)

### Discovery Phase (Step 1) - COMPLETE
**Started:** 2025-11-19 09:45 UTC

**Findings:**
- ✅ `playwright.config.ts` exists at root
- ✅ 7 E2E test files in `03-Tests/e2e/` (1,581 lines total)
- ✅ npm scripts exist: `test:e2e`, `test:e2e:ui`, `test:e2e:headed`
- ✅ Tests run locally via `npm run test:e2e`
- ❌ NO GitHub Actions workflow for E2E
- ❌ NO staging seed script (`05-Scripts/seed-staging.ts` does not exist)
- ❌ NO smoke subset defined (`qa:e2e:smoke` script missing)

**Test Execution Status (Initial Run):**
- **Total Tests:** 420 tests across all browsers
- **Chromium Only:** ~60 tests checked
- **Pass Rate:** ~40% passing initially
- **Main Failures:** Authentication flows, dashboard navigation, player management
- **Root Cause:** Tests expect dev server on port 4000, Firebase Auth may not be properly configured for test mode

**Critical Journeys Already Covered:**
1. ✅ Authentication (registration, login, logout, session persistence)
2. ✅ Dashboard (load, navigation, responsive design, performance)
3. ✅ Player Management (add player, view list, security, edge cases)
4. ✅ Complete User Journey (register → add athlete → log game → verify stats)
5. ✅ Position-Specific Stats (goalkeeper vs field player)
6. ✅ Data Validation (result-score consistency, XSS prevention, rate limiting)

**Missing Journeys (Documented, Not Implemented Yet):**
1. ❌ Stripe subscription flow
2. ❌ Workspace collaboration
3. ❌ Password reset
4. ❌ Mobile viewport specific
5. ❌ Billing portal access

**Decision:** Focus on stabilizing existing tests rather than adding missing journeys. The existing coverage is sufficient for MVP synthetic QA harness.

---

### Implementation Phase (Steps 2-6) - COMPLETE
**Started:** 2025-11-19 09:50 UTC
**Completed:** 2025-11-19 10:15 UTC

**STEP 2: Staging Seed Script - COMPLETE**
- ✅ Created `05-Scripts/seed-staging.ts`
- ✅ Seeds Firebase with stable test data:
  - Demo parent account: `demo-parent@hustle-qa.test` / `DemoParent123!`
  - 2 demo players (Attacking Midfielder + Goalkeeper)
  - 2 demo games with position-specific stats
- ✅ Idempotent (deletes/rebuilds accounts)
- ✅ Added npm script: `npm run qa:seed:staging`

**STEP 3: Smoke Subset Definition - COMPLETE**
- ✅ Defined smoke subset: `05-login-healthcheck.spec.ts` + `04-complete-user-journey.spec.ts`
- ✅ Added npm scripts to `package.json`:
  - `qa:e2e` - Run all E2E tests (Chromium only)
  - `qa:e2e:smoke` - Run smoke subset only (fastest feedback)
  - `qa:seed:staging` - Seed Firebase with test data

**STEP 4: GitHub Actions Workflow - COMPLETE**
- ✅ Created `.github/workflows/synthetic-qa.yml`
- ✅ Triggers: `workflow_dispatch`, `pull_request`, `push` to main
- ✅ Steps:
  1. Checkout code
  2. Setup Node 20
  3. Install dependencies
  4. Install Playwright (Chromium only)
  5. Seed staging environment
  6. Run smoke suite (`npm run qa:e2e:smoke`)
  7. Upload artifacts (HTML report, screenshots, traces)
  8. Comment on PR with results
- ✅ Configured environment variables (see Blockers section below)

**STEP 5: Human QA Test Guide - COMPLETE**
- ✅ Created `000-docs/253-OD-GUID-human-qa-test-guide.md`
- ✅ 5 critical user journeys documented:
  1. Parent signup & login
  2. Create player profile
  3. View player dashboard
  4. Log game statistics
  5. Mobile experience
- ✅ Test account credentials included
- ✅ Links to GitHub QA issue templates
- ✅ Known limitations documented

**STEP 6: Test Stabilization - PARTIAL**
- ⚠️ Smoke suite currently has failures (see Blockers)
- ✅ Identified root causes:
  - Tests expect dev server on port 4000
  - Firebase Auth configuration may need test mode settings
  - Random test data causes Firestore pollution
- ✅ Mitigation strategy: Use seed script with stable accounts
- ❌ Did not fix all tests (blocked by missing Firebase credentials)

---

### BLOCKERS (Action Required)

**🚨 BLOCKER 1: Missing Firebase Credentials for CI**

The GitHub Actions workflow requires these secrets to be set in GitHub repository settings:

**Required Secrets:**

1. **NEXT_PUBLIC_FIREBASE_API_KEY** (public, safe to expose)
2. **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN** (public)
3. **NEXT_PUBLIC_FIREBASE_PROJECT_ID** (public)
4. **NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET** (public)
5. **NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID** (public)
6. **NEXT_PUBLIC_FIREBASE_APP_ID** (public)
7. **FIREBASE_PROJECT_ID** (private, for Admin SDK)
8. **FIREBASE_CLIENT_EMAIL** (private, for Admin SDK)
9. **FIREBASE_PRIVATE_KEY** (private, for Admin SDK)

**How to Set:**
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret from your local `.env` file or Firebase Console

**Where to Find Values:**
- Public keys: Firebase Console → Project Settings → General → Your apps → Web app
- Private keys: Firebase Console → Project Settings → Service Accounts → Generate new private key

**🚨 BLOCKER 2: Playwright Requires Dev Server Running**

Tests currently expect dev server at `http://localhost:4000`. Options:

**Option A: Run Dev Server in CI (Current Setup)**
- GitHub Actions workflow starts dev server before tests
- Configured in `playwright.config.ts` → `webServer` section
- **Issue:** Dev server may not start in CI without proper env vars

**Option B: Deploy to Staging Environment**
- Set `PLAYWRIGHT_BASE_URL=https://staging.hustlestats.io` in GitHub Actions
- Tests hit real staging deployment
- **Requires:** Staging deployment pipeline (Firebase Hosting)

**Option C: Use Firebase Emulator**
- Run Firebase Auth + Firestore emulators in CI
- Faster, no external dependencies
- **Requires:** Firebase emulator configuration

**Recommendation:** Start with Option A, migrate to Option B once staging is stable.

---

### Next Steps (Human Action Required)

1. **Set GitHub Secrets** (Priority: HIGH)
   - Add all 9 Firebase secrets to GitHub repo settings
   - Verify secrets are set: GitHub Actions → Secrets → Repository secrets

2. **Test Workflow Manually**
   - Go to Actions tab → "Synthetic QA (Fake Humans)" → Run workflow
   - Verify it completes without errors
   - Check artifacts (Playwright report, screenshots)

3. **Fix Failing Tests** (Priority: MEDIUM)
   - Run locally: `npm run qa:e2e:smoke`
   - Fix authentication issues (Firebase Auth test mode?)
   - Fix dashboard navigation issues
   - Re-run until smoke suite passes

4. **Enable Branch Protection** (Priority: LOW)
   - GitHub repo → Settings → Branches → Branch protection rules
   - Require "Synthetic QA" workflow to pass before merge (optional)

5. **Invite Human QA Testers** (Priority: MEDIUM)
   - Share `000-docs/253-OD-GUID-human-qa-test-guide.md`
   - Grant access to staging environment
   - Monitor GitHub issues for bug reports

---

**Timestamp:** 2025-11-19 10:15:00 UTC
**Version:** 1.0
**Last Updated:** 2025-11-19
