/**
 * Shared Test Utilities
 *
 * Reusable mock factories, helpers, and type-safe builders for all test files.
 * Import from '@/test-utils' in any test.
 */

import { vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { Workspace, WorkspacePlan, WorkspaceStatus } from '@/types/domain';
import type { Session, DashboardUser } from '@/lib/auth';

// ---------------------------------------------------------------------------
// NextRequest factory
// ---------------------------------------------------------------------------

interface MockRequestOptions {
  method?: string;
  body?: Record<string, unknown> | string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  url?: string;
}

export function createMockRequest(options: MockRequestOptions = {}): NextRequest {
  const {
    method = 'GET',
    body,
    headers = {},
    cookies = {},
    url = 'http://localhost:3000/api/test',
  } = options;

  const init: RequestInit & { headers: Record<string, string> } = {
    method,
    headers: { 'content-type': 'application/json', ...headers },
  };

  if (body && method !== 'GET') {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const req = new NextRequest(url, init);

  // Attach cookies
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }

  return req;
}

// ---------------------------------------------------------------------------
// Session / Auth factories
// ---------------------------------------------------------------------------

export function createMockSession(overrides: Partial<Session['user']> = {}): Session {
  return {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      emailVerified: true,
      ...overrides,
    },
  };
}

export function createMockDashboardUser(overrides: Partial<DashboardUser> = {}): DashboardUser {
  return {
    uid: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    emailVerified: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Workspace factory
// ---------------------------------------------------------------------------

interface WorkspaceOverrides {
  id?: string;
  ownerUserId?: string;
  name?: string;
  plan?: WorkspacePlan;
  status?: WorkspaceStatus;
  billing?: Partial<Workspace['billing']>;
  usage?: Partial<Workspace['usage']>;
  members?: Workspace['members'];
}

export function createMockWorkspace(overrides: WorkspaceOverrides = {}): Workspace {
  return {
    id: overrides.id ?? 'workspace-123',
    ownerUserId: overrides.ownerUserId ?? 'user-123',
    name: overrides.name ?? 'Test Workspace',
    plan: overrides.plan ?? 'starter',
    status: overrides.status ?? 'active',
    members: overrides.members ?? [
      {
        userId: overrides.ownerUserId ?? 'user-123',
        email: 'test@example.com',
        role: 'owner',
        addedAt: new Date('2025-01-01'),
        addedBy: overrides.ownerUserId ?? 'user-123',
      },
    ],
    billing: {
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
      currentPeriodEnd: new Date('2026-03-01'),
      ...overrides.billing,
    },
    usage: {
      playerCount: 2,
      gamesThisMonth: 5,
      storageUsedMB: 50,
      ...overrides.usage,
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Stripe mock factories
// ---------------------------------------------------------------------------

export function createMockStripeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_test123',
    customer: 'cus_test123',
    status: 'active',
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
    items: {
      data: [
        {
          id: 'si_test123',
          price: { id: 'price_starter_test' },
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        },
      ],
    },
    ...overrides,
  };
}

export function createMockStripeEvent(
  type: string,
  dataObject: Record<string, unknown>,
  overrides: Record<string, unknown> = {}
) {
  return {
    id: `evt_${type.replace(/\./g, '_')}_test`,
    type,
    created: Math.floor(Date.now() / 1000),
    data: { object: dataObject },
    ...overrides,
  };
}

export function createMockStripeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'in_test123',
    customer: 'cus_test123',
    subscription: 'sub_test123',
    amount_paid: 900,
    attempt_count: 1,
    parent: {
      subscription_details: {
        subscription: 'sub_test123',
      },
    },
    ...overrides,
  };
}

export function createMockCheckoutSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_test123',
    customer: 'cus_test123',
    subscription: 'sub_test123',
    metadata: { workspaceId: 'workspace-123', userId: 'user-123' },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Firestore mock helpers
// ---------------------------------------------------------------------------

export function createMockFirestoreDoc(data: Record<string, unknown> | null, id = 'doc-123') {
  return {
    exists: data !== null,
    id,
    data: () => data,
    ref: { id },
  };
}

/**
 * Creates a chainable Firestore query mock.
 * Usage: const q = createMockQuery(docs); q.where().orderBy().get() → { docs }
 */
export function createMockQuery(docs: Array<{ id: string; data: () => Record<string, unknown> }> = []) {
  const mock = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    startAfter: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      empty: docs.length === 0,
      docs,
      size: docs.length,
    }),
  };
  return mock;
}

// ---------------------------------------------------------------------------
// Stripe SDK mock factory (use with vi.hoisted)
// ---------------------------------------------------------------------------

export function createMockStripeClient() {
  return {
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
      update: vi.fn(),
      cancel: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
    invoices: {
      list: vi.fn(),
      createPreview: vi.fn(),
    },
    prices: {
      retrieve: vi.fn(),
    },
    events: {
      list: vi.fn(),
    },
  };
}

// ---------------------------------------------------------------------------
// Player / Game factories
// ---------------------------------------------------------------------------

export function createMockPlayer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'player-123',
    workspaceId: 'workspace-123',
    name: 'Test Player',
    birthday: new Date('2012-06-15'),
    gender: 'male',
    primaryPosition: 'CM',
    secondaryPositions: [],
    leagueCode: 'REC',
    teamClub: 'Test FC',
    photoUrl: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockGame(overrides: Record<string, unknown> = {}) {
  return {
    id: 'game-123',
    workspaceId: 'workspace-123',
    date: new Date('2025-06-15'),
    opponent: 'Rival FC',
    result: 'Win',
    finalScore: '3-1',
    minutesPlayed: 60,
    goals: 2,
    assists: 1,
    verified: false,
    verifiedAt: null,
    createdAt: new Date('2025-06-15'),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Environment variable helpers
// ---------------------------------------------------------------------------

export function withEnv(vars: Record<string, string | undefined>, fn: () => void | Promise<void>) {
  const originals: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(vars)) {
    originals[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  const restore = () => {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };

  const result = fn();
  if (result instanceof Promise) {
    return result.finally(restore);
  }
  restore();
}
