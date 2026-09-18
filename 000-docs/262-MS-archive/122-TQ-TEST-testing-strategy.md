# HUSTLE™ Comprehensive Testing Strategy

**Document Type:** Testing Strategy & Implementation Guide
**Status:** Active
**Last Updated:** 2025-10-08
**Version:** 1.0.0
**Purpose:** Autonomous testing framework for production readiness

---

## Executive Summary

This document defines a **comprehensive, autonomous testing framework** using 100% open-source tools that verify HUSTLE™ works correctly across all layers:

- ✅ Unit Tests (functions, utilities, components)
- ✅ Integration Tests (API routes, database operations)
- ✅ End-to-End Tests (user workflows, authentication)
- ✅ Performance Tests (page load, API response times)
- ✅ Accessibility Tests (WCAG 2.1 AA compliance)
- ✅ Security Tests (vulnerability scanning, auth flows)

**Goal:** Run one command (`npm test`) and get complete confidence that everything works.

---

## Testing Pyramid

```
           /\
          /  \
         / E2E \          <- 10% (Playwright)
        /--------\
       /          \
      / Integration \     <- 30% (Vitest + Supertest)
     /--------------\
    /                \
   /   Unit Tests     \   <- 60% (Vitest + RTL)
  /--------------------\
```

### Why This Distribution?

- **60% Unit Tests:** Fast, isolated, catch bugs early
- **30% Integration Tests:** Verify API routes and database work together
- **10% E2E Tests:** Verify critical user workflows work end-to-end

---

## Technology Stack (2025 Best Practices)

### Core Testing Frameworks

| Tool | Purpose | Why Chosen |
|------|---------|------------|
| **Vitest** | Unit & Integration Tests | 10x faster than Jest, native ESM support, perfect for Next.js 15 |
| **Playwright** | End-to-End Tests | Cross-browser, official Next.js recommendation, auto-wait for elements |
| **React Testing Library** | Component Tests | User-centric testing, simulates real user interactions |
| **@testing-library/user-event** | User Interactions | Simulates real keyboard/mouse events |

### Specialized Testing Tools

| Tool | Purpose | Why Chosen |
|------|---------|------------|
| **@axe-core/playwright** | Accessibility Testing | Finds 57% of WCAG issues automatically, used by Lighthouse |
| **Lighthouse CI** | Performance Testing | Audits performance, SEO, PWA, used by Google |
| **Supertest** | API Testing | HTTP assertions for Next.js API routes |
| **MSW (Mock Service Worker)** | API Mocking | Mock external APIs (Resend, etc.) |
| **npm audit** | Security Scanning | Find vulnerable dependencies |
| **@prisma/client** | Database Testing | Test database queries with test database |

---

## Installation & Setup

### Step 1: Install Core Dependencies

```bash
# Core testing frameworks
npm install -D vitest @vitejs/plugin-react jsdom
npm install -D @testing-library/react @testing-library/dom @testing-library/user-event
npm install -D @playwright/test
npm install -D vite-tsconfig-paths

# API testing
npm install -D supertest @types/supertest

# Accessibility testing
npm install -D @axe-core/playwright

# Mocking
npm install -D msw@latest

# Test utilities
npm install -D dotenv-cli cross-env
```

### Step 2: Initialize Playwright

```bash
npx playwright install --with-deps
```

This installs Chromium, Firefox, and WebKit browsers for cross-browser testing.

### Step 3: Create Configuration Files

#### `vitest.config.mts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'e2e/',
        '**/*.config.*',
        '**/*.d.ts',
        'coverage/',
      ],
    },
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### `vitest.setup.ts`

```typescript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with React Testing Library matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))
```

#### `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run dev server before tests
  webServer: {
    command: 'npm run dev -- -p 4000',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Step 4: Create Test Database

#### `prisma/schema.test.prisma`

```prisma
// Copy of main schema but with test database URL
// Use environment variable: DATABASE_URL_TEST
```

#### `.env.test`

```bash
DATABASE_URL="postgresql://hustle_admin:PASSWORD@localhost:5432/hustle_test"
NEXTAUTH_SECRET="test-secret-for-testing-only"
NEXTAUTH_URL="http://localhost:4000"
RESEND_API_KEY="test-key"
EMAIL_FROM="HUSTLE <test@example.com>"
NODE_ENV=test
```

### Step 5: Update package.json Scripts

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.mts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:a11y": "playwright test --grep @a11y",
    "test:perf": "playwright test --grep @perf",
    "test:security": "npm audit --audit-level=moderate",
    "test:all": "npm run test:security && npm run test:unit && npm run test:integration && npm run test:e2e && npm run test:a11y",
    "test:ci": "dotenv -e .env.test -- npm run test:all"
  }
}
```

---

## Test Examples

### 1. Unit Tests (Vitest + React Testing Library)

#### `src/lib/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { calculateAge } from './utils'

describe('calculateAge', () => {
  it('calculates age correctly for birthday this year', () => {
    const birthdate = new Date('2010-01-15')
    const today = new Date('2025-10-08')
    expect(calculateAge(birthdate, today)).toBe(15)
  })

  it('calculates age correctly for birthday not yet occurred', () => {
    const birthdate = new Date('2010-12-25')
    const today = new Date('2025-10-08')
    expect(calculateAge(birthdate, today)).toBe(14)
  })

  it('handles edge case of birthday today', () => {
    const birthdate = new Date('2010-10-08')
    const today = new Date('2025-10-08')
    expect(calculateAge(birthdate, today)).toBe(15)
  })
})
```

#### `src/components/ui/button.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders disabled button', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### 2. Integration Tests (API Routes)

#### `src/app/api/auth/register/route.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { POST } from './route'
import { prisma } from '@/lib/prisma'

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    // Clear test database
    await prisma.user.deleteMany()
  })

  afterEach(async () => {
    await prisma.user.deleteMany()
  })

  it('creates new user successfully', async () => {
    const request = new Request('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        password: 'SecurePass123!',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toContain('registered successfully')

    // Verify user created in database
    const user = await prisma.user.findUnique({
      where: { email: 'john@example.com' },
    })
    expect(user).toBeDefined()
    expect(user?.firstName).toBe('John')
    expect(user?.emailVerified).toBeNull() // Not verified yet
  })

  it('rejects duplicate email', async () => {
    // Create existing user
    await prisma.user.create({
      data: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '555-5678',
        password: 'hashed_password',
      },
    })

    const request = new Request('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        email: 'jane@example.com', // Duplicate
        phone: '555-1234',
        password: 'SecurePass123!',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toContain('already exists')
  })

  it('validates required fields', async () => {
    const request = new Request('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'John',
        // Missing lastName, email, phone, password
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('validates email format', async () => {
    const request = new Request('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email', // Invalid format
        phone: '555-1234',
        password: 'SecurePass123!',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('hashes password before storing', async () => {
    const password = 'SecurePass123!'
    const request = new Request('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        password,
      }),
    })

    await POST(request)

    const user = await prisma.user.findUnique({
      where: { email: 'john@example.com' },
    })

    // Password should be hashed, not plain text
    expect(user?.password).not.toBe(password)
    expect(user?.password).toContain('$2b$') // bcrypt hash prefix
  })
})
```

### 3. End-to-End Tests (Playwright)

#### `e2e/auth/registration.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'

test.describe('User Registration Flow', () => {
  test.beforeEach(async () => {
    // Clear test database
    await prisma.user.deleteMany()
  })

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/')

    // Navigate to registration
    await page.click('text=Create Account')
    await expect(page).toHaveURL('/register')

    // Fill registration form
    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="phone"]', '555-1234')
    await page.fill('input[name="password"]', 'SecurePass123!')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to login with success message
    await expect(page).toHaveURL('/login?registered=true')
    await expect(page.locator('text=/check your email/i')).toBeVisible()
  })

  test('should show error for duplicate email', async ({ page }) => {
    // Create existing user
    await prisma.user.create({
      data: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'existing@example.com',
        phone: '555-5678',
        password: '$2b$10$hashedpassword',
      },
    })

    await page.goto('/register')

    // Try to register with existing email
    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[name="email"]', 'existing@example.com')
    await page.fill('input[name="phone"]', '555-1234')
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=/already exists/i')).toBeVisible()
  })

  test('should validate form fields', async ({ page }) => {
    await page.goto('/register')

    // Submit empty form
    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page.locator('text=/required/i')).toHaveCount(5)
  })
})
```

#### `e2e/auth/login.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

test.describe('User Login Flow', () => {
  test.beforeEach(async () => {
    // Create verified test user
    await prisma.user.deleteMany()
    await prisma.user.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        password: await bcrypt.hash('SecurePass123!', 10),
        emailVerified: new Date(),
      },
    })
  })

  test('should login verified user successfully', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=/welcome/i')).toBeVisible()
  })

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'WrongPassword!')
    await page.click('button[type="submit"]')

    // Should show error
    await expect(page.locator('text=/invalid email or password/i')).toBeVisible()
  })

  test('should reject unverified user', async ({ page }) => {
    // Create unverified user
    await prisma.user.create({
      data: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '555-5678',
        password: await bcrypt.hash('SecurePass123!', 10),
        emailVerified: null, // Not verified
      },
    })

    await page.goto('/login')

    await page.fill('input[name="email"]', 'jane@example.com')
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')

    // Should show verification error
    await expect(page.locator('text=/verify your email/i')).toBeVisible()
  })
})
```

#### `e2e/dashboard/player-management.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

test.describe('Player Management', () => {
  let userId: string

  test.beforeEach(async ({ page }) => {
    // Create and login as test user
    await prisma.user.deleteMany()
    const user = await prisma.user.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        password: await bcrypt.hash('SecurePass123!', 10),
        emailVerified: new Date(),
      },
    })
    userId = user.id

    // Login
    await page.goto('/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create new player', async ({ page }) => {
    await page.click('text=/add player/i')

    await page.fill('input[name="name"]', 'Alex Doe')
    await page.fill('input[name="birthday"]', '2010-05-15')
    await page.selectOption('select[name="position"]', 'Forward')
    await page.fill('input[name="teamClub"]', 'United FC')
    await page.click('button[type="submit"]')

    // Should show success message
    await expect(page.locator('text=/player added successfully/i')).toBeVisible()

    // Verify player in database
    const player = await prisma.player.findFirst({
      where: { parentId: userId },
    })
    expect(player).toBeDefined()
    expect(player?.name).toBe('Alex Doe')
  })

  test('should display player list', async ({ page }) => {
    // Create test players
    await prisma.player.createMany({
      data: [
        {
          name: 'Alex Doe',
          birthday: new Date('2010-05-15'),
          position: 'Forward',
          teamClub: 'United FC',
          parentId: userId,
        },
        {
          name: 'Sam Doe',
          birthday: new Date('2012-08-20'),
          position: 'Midfielder',
          teamClub: 'City FC',
          parentId: userId,
        },
      ],
    })

    await page.reload()

    // Should show both players
    await expect(page.locator('text=Alex Doe')).toBeVisible()
    await expect(page.locator('text=Sam Doe')).toBeVisible()
  })
})
```

### 4. Accessibility Tests (axe-core + Playwright)

#### `e2e/a11y/accessibility.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests @a11y', () => {
  test('should not have accessibility violations on landing page', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should not have accessibility violations on login page', async ({ page }) => {
    await page.goto('/login')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should not have accessibility violations on registration page', async ({ page }) => {
    await page.goto('/register')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/register')

    // All form inputs should have associated labels
    const emailInput = page.locator('input[name="email"]')
    const label = await emailInput.evaluate((el) => {
      const id = el.id
      return document.querySelector(`label[for="${id}"]`)?.textContent
    })

    expect(label).toBeTruthy()
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents()

    // Should have at least one h1
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThan(0)
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze()

    const contrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    )

    expect(contrastViolations).toEqual([])
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login')

    // Tab through form
    await page.keyboard.press('Tab') // Email field
    await expect(page.locator('input[name="email"]')).toBeFocused()

    await page.keyboard.press('Tab') // Password field
    await expect(page.locator('input[name="password"]')).toBeFocused()

    await page.keyboard.press('Tab') // Submit button
    await expect(page.locator('button[type="submit"]')).toBeFocused()
  })
})
```

### 5. Performance Tests (Lighthouse)

#### `e2e/performance/lighthouse.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { playAudit } from 'playwright-lighthouse'

test.describe('Performance Tests @perf', () => {
  test('should meet performance benchmarks on landing page', async ({ page }) => {
    await page.goto('/')

    await playAudit({
      page,
      thresholds: {
        performance: 80,
        accessibility: 90,
        'best-practices': 80,
        seo: 80,
      },
      port: 9222,
    })
  })

  test('should load dashboard quickly', async ({ page }) => {
    // Login first (setup code omitted for brevity)

    const startTime = Date.now()
    await page.goto('/dashboard')
    const loadTime = Date.now() - startTime

    // Dashboard should load in under 2 seconds
    expect(loadTime).toBeLessThan(2000)
  })

  test('should have fast API response times', async ({ page }) => {
    const startTime = Date.now()
    const response = await page.request.get('/api/healthcheck')
    const responseTime = Date.now() - startTime

    expect(response.ok()).toBeTruthy()
    expect(responseTime).toBeLessThan(500) // Under 500ms
  })
})
```

### 6. Security Tests

#### `tests/security/auth-security.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import bcrypt from 'bcrypt'

describe('Authentication Security', () => {
  it('should hash passwords with bcrypt', async () => {
    const password = 'SecurePass123!'
    const hash = await bcrypt.hash(password, 10)

    expect(hash).not.toBe(password)
    expect(hash).toContain('$2b$10$') // bcrypt format
  })

  it('should verify passwords correctly', async () => {
    const password = 'SecurePass123!'
    const hash = await bcrypt.hash(password, 10)

    const isValid = await bcrypt.compare(password, hash)
    expect(isValid).toBe(true)

    const isInvalid = await bcrypt.compare('WrongPassword', hash)
    expect(isInvalid).toBe(false)
  })

  it('should generate cryptographically secure tokens', () => {
    const token1 = crypto.randomBytes(32).toString('hex')
    const token2 = crypto.randomBytes(32).toString('hex')

    // Should be 64 characters (32 bytes * 2 for hex)
    expect(token1).toHaveLength(64)
    expect(token2).toHaveLength(64)

    // Should be unique
    expect(token1).not.toBe(token2)
  })
})
```

---

## Coverage Targets

### Minimum Coverage Requirements

| Metric | Target | Critical Paths |
|--------|--------|----------------|
| **Line Coverage** | 80% | Authentication, API routes |
| **Branch Coverage** | 75% | Error handling, validation |
| **Function Coverage** | 85% | All exported functions |
| **Statement Coverage** | 80% | Business logic |

### Critical Paths (Must Have 100% Coverage)

1. **Authentication:**
   - Registration flow
   - Login flow
   - Email verification
   - Password reset

2. **API Routes:**
   - /api/auth/register
   - /api/auth/[...nextauth]
   - /api/players/*
   - /api/games/*

3. **Security:**
   - Password hashing
   - Token generation
   - Session management
   - Input validation

---

## Autonomous Testing Commands

### Run All Tests

```bash
npm run test:all
```

This runs:
1. ✅ Security scan (npm audit)
2. ✅ Unit tests (Vitest)
3. ✅ Integration tests (Vitest)
4. ✅ E2E tests (Playwright)
5. ✅ Accessibility tests (axe-core)

### Run Specific Test Suites

```bash
# Unit tests only (fast)
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# E2E tests with UI (interactive)
npm run test:e2e:ui

# Accessibility tests only
npm run test:a11y

# Performance tests only
npm run test:perf

# Security scan only
npm run test:security
```

### Watch Mode (Development)

```bash
# Auto-run tests on file changes
npm run test:watch
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report in browser
open coverage/index.html
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: hustle_admin
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: hustle_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://hustle_admin:test_password@localhost:5432/hustle_test

      - name: Run security scan
        run: npm run test:security

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://hustle_admin:test_password@localhost:5432/hustle_test

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://hustle_admin:test_password@localhost:5432/hustle_test

      - name: Run accessibility tests
        run: npm run test:a11y

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Test Data Management

### Test Database Setup

```bash
# Create test database
createdb -U postgres hustle_test

# Run migrations on test database
DATABASE_URL="postgresql://hustle_admin:PASSWORD@localhost:5432/hustle_test" npx prisma migrate deploy

# Seed test data (optional)
DATABASE_URL="postgresql://hustle_admin:PASSWORD@localhost:5432/hustle_test" npx prisma db seed
```

### Test Fixtures

Create `tests/fixtures/users.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export const createTestUser = async (overrides = {}) => {
  return await prisma.user.create({
    data: {
      firstName: 'Test',
      lastName: 'User',
      email: `test-${Date.now()}@example.com`,
      phone: '555-0000',
      password: await bcrypt.hash('TestPassword123!', 10),
      emailVerified: new Date(),
      ...overrides,
    },
  })
}

export const createTestPlayer = async (userId: string, overrides = {}) => {
  return await prisma.player.create({
    data: {
      name: 'Test Player',
      birthday: new Date('2010-01-15'),
      position: 'Forward',
      teamClub: 'Test FC',
      parentId: userId,
      ...overrides,
    },
  })
}
```

---

## Mocking External Services

### Mock Resend Email Service

Create `tests/mocks/resend.ts`:

```typescript
import { http, HttpResponse } from 'msw'

export const resendHandlers = [
  http.post('https://api.resend.com/emails', async () => {
    return HttpResponse.json({
      id: 'mock-email-id',
      from: 'HUSTLE <noreply@intentsolutions.io>',
      to: ['user@example.com'],
      created_at: new Date().toISOString(),
    })
  }),
]
```

### Setup MSW in Tests

Create `vitest.setup.ts`:

```typescript
import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { resendHandlers } from './tests/mocks/resend'

const server = setupServer(...resendHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

## Test Reporting

### Generate Test Reports

```bash
# HTML coverage report
npm run test:coverage
open coverage/index.html

# Playwright HTML report
npm run test:e2e
npx playwright show-report

# JUnit XML (for CI)
npm run test -- --reporter=junit --outputFile=test-results.xml
```

### Key Metrics to Track

1. **Test Count:**
   - Total tests: 100+
   - Unit tests: 60+
   - Integration tests: 30+
   - E2E tests: 10+

2. **Coverage:**
   - Line coverage: >80%
   - Branch coverage: >75%
   - Function coverage: >85%

3. **Performance:**
   - Test execution time: <5 minutes (all tests)
   - E2E test time: <2 minutes
   - Unit test time: <30 seconds

4. **Reliability:**
   - Flaky test rate: <1%
   - Pass rate: >99%

---

## Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All tests passing (`npm run test:all`)
- [ ] Code coverage >80%
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Accessibility tests passing (WCAG 2.1 AA)
- [ ] Performance benchmarks met (Lighthouse >80)
- [ ] Cross-browser tests passing (Chrome, Firefox, Safari)
- [ ] Mobile tests passing (iOS, Android)
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Backup and rollback procedures tested

---

## Troubleshooting

### Common Issues

**Issue:** Tests fail with database connection errors

**Solution:**
```bash
# Ensure test database exists
createdb -U postgres hustle_test

# Run migrations
DATABASE_URL="postgresql://hustle_admin:PASSWORD@localhost:5432/hustle_test" npx prisma migrate deploy
```

**Issue:** Playwright tests timeout

**Solution:**
```bash
# Increase timeout in playwright.config.ts
use: {
  timeout: 30000, // 30 seconds
}
```

**Issue:** Port 4000 already in use

**Solution:**
```bash
# Kill existing process
lsof -ti:4000 | xargs kill -9

# Or use different port
npm run dev -- -p 4001
```

**Issue:** Coverage not generated

**Solution:**
```bash
# Install coverage provider
npm install -D @vitest/coverage-v8
```

---

## Next Steps After Testing

Once all tests pass:

1. **Review Coverage Report**
   - Identify untested code
   - Add tests for critical paths
   - Aim for 80%+ coverage

2. **Set Up CI/CD**
   - Implement GitHub Actions workflow
   - Add pre-commit hooks (Husky)
   - Automate deployment on test pass

3. **Monitor in Production**
   - Set up error tracking (Sentry)
   - Add performance monitoring (Vercel Analytics)
   - Configure uptime monitoring (UptimeRobot)

4. **Continuous Improvement**
   - Add tests for new features
   - Refactor tests as code evolves
   - Keep dependencies updated

---

**Testing is not a one-time task. It's a continuous process that ensures HUSTLE™ works reliably for every user, every time.**

---

**Document Status:** Living document, updated as testing strategy evolves
**Last Review:** 2025-10-08
**Next Review:** 2025-11-08 (monthly)
**Maintained By:** Engineering Team
**Contact:** jeremy@intentsolutions.io

---

*100% Open-Source Testing Stack*
*Autonomous Testing Framework*
*Production-Ready Quality Assurance*
