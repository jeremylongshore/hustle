/**
 * Workspace Access Control Tests (RBAC)
 *
 * Tests role-based permission enforcement for workspace collaborators:
 * - hasWorkspacePermission() for each role
 * - assertWorkspacePermission() throws on denied access
 * - getUserRole() resolves owner, members, and non-members
 * - isWorkspaceMember() checks for owner and member presence
 * - canManageMember() enforces role hierarchy rules
 */

import { vi } from 'vitest';

// Mock the logger so Cloud Logging is not initialized during tests
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import {
  hasWorkspacePermission,
  assertWorkspacePermission,
  getUserRole,
  isWorkspaceMember,
  canManageMember,
} from './access-control';
import type { WorkspacePermission } from './access-control';
import type { Workspace, WorkspaceMemberRole } from '@/types/domain';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: 'ws-test',
    ownerUserId: 'owner-uid',
    name: 'Test Workspace',
    plan: 'starter',
    status: 'active',
    members: [],
    billing: {
      stripeCustomerId: 'cus_test',
      stripeSubscriptionId: 'sub_test',
      currentPeriodEnd: new Date('2026-12-31'),
    },
    usage: { playerCount: 1, gamesThisMonth: 0, storageUsedMB: 0 },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function addMember(workspace: Workspace, userId: string, role: WorkspaceMemberRole): Workspace {
  return {
    ...workspace,
    members: [
      ...workspace.members,
      {
        userId,
        email: `${userId}@example.com`,
        role,
        addedAt: new Date('2025-01-01'),
        addedBy: 'owner-uid',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// hasWorkspacePermission - Owner
// ---------------------------------------------------------------------------

describe('hasWorkspacePermission() - owner', () => {
  const workspace = buildWorkspace();
  const OWNER_PERMISSIONS: WorkspacePermission[] = [
    'workspace:view', 'workspace:edit', 'workspace:delete', 'workspace:billing',
    'members:view', 'members:invite', 'members:remove', 'members:changeRole',
    'players:view', 'players:create', 'players:edit', 'players:delete',
    'games:view', 'games:create', 'games:edit', 'games:delete', 'games:verify',
  ];

  for (const permission of OWNER_PERMISSIONS) {
    it(`grants ${permission} to owner`, () => {
      expect(hasWorkspacePermission(workspace, 'owner-uid', permission)).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// hasWorkspacePermission - Admin
// ---------------------------------------------------------------------------

describe('hasWorkspacePermission() - admin', () => {
  let workspace: Workspace;

  beforeEach(() => {
    workspace = addMember(buildWorkspace(), 'admin-uid', 'admin');
  });

  it('grants workspace:view to admin', () => {
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'workspace:view')).toBe(true);
  });

  it('grants workspace:edit to admin', () => {
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'workspace:edit')).toBe(true);
  });

  it('denies workspace:delete to admin', () => {
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'workspace:delete')).toBe(false);
  });

  it('denies workspace:billing to admin', () => {
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'workspace:billing')).toBe(false);
  });

  it('grants members:view to admin', () => {
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'members:view')).toBe(true);
  });

  it('grants members:invite to admin', () => {
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'members:invite')).toBe(true);
  });

  it('grants members:remove to admin', () => {
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'members:remove')).toBe(true);
  });

  it('denies members:changeRole to admin', () => {
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'members:changeRole')).toBe(false);
  });

  it('grants all player permissions to admin', () => {
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'players:view')).toBe(true);
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'players:create')).toBe(true);
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'players:edit')).toBe(true);
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'players:delete')).toBe(true);
  });

  it('grants all game permissions to admin', () => {
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'games:view')).toBe(true);
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'games:create')).toBe(true);
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'games:edit')).toBe(true);
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'games:delete')).toBe(true);
    expect(hasWorkspacePermission(workspace, 'admin-uid', 'games:verify')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hasWorkspacePermission - Member
// ---------------------------------------------------------------------------

describe('hasWorkspacePermission() - member', () => {
  let workspace: Workspace;

  beforeEach(() => {
    workspace = addMember(buildWorkspace(), 'member-uid', 'member');
  });

  it('grants workspace:view to member', () => {
    expect(hasWorkspacePermission(workspace, 'member-uid', 'workspace:view')).toBe(true);
  });

  it('denies workspace:edit to member', () => {
    expect(hasWorkspacePermission(workspace, 'member-uid', 'workspace:edit')).toBe(false);
  });

  it('denies workspace:delete to member', () => {
    expect(hasWorkspacePermission(workspace, 'member-uid', 'workspace:delete')).toBe(false);
  });

  it('grants players:view, players:create, players:edit to member', () => {
    expect(hasWorkspacePermission(workspace, 'member-uid', 'players:view')).toBe(true);
    expect(hasWorkspacePermission(workspace, 'member-uid', 'players:create')).toBe(true);
    expect(hasWorkspacePermission(workspace, 'member-uid', 'players:edit')).toBe(true);
  });

  it('denies players:delete to member', () => {
    expect(hasWorkspacePermission(workspace, 'member-uid', 'players:delete')).toBe(false);
  });

  it('grants games:view, games:create, games:edit, games:verify to member', () => {
    expect(hasWorkspacePermission(workspace, 'member-uid', 'games:view')).toBe(true);
    expect(hasWorkspacePermission(workspace, 'member-uid', 'games:create')).toBe(true);
    expect(hasWorkspacePermission(workspace, 'member-uid', 'games:edit')).toBe(true);
    expect(hasWorkspacePermission(workspace, 'member-uid', 'games:verify')).toBe(true);
  });

  it('denies games:delete to member', () => {
    expect(hasWorkspacePermission(workspace, 'member-uid', 'games:delete')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasWorkspacePermission - Viewer
// ---------------------------------------------------------------------------

describe('hasWorkspacePermission() - viewer', () => {
  let workspace: Workspace;

  beforeEach(() => {
    workspace = addMember(buildWorkspace(), 'viewer-uid', 'viewer');
  });

  it('grants workspace:view to viewer', () => {
    expect(hasWorkspacePermission(workspace, 'viewer-uid', 'workspace:view')).toBe(true);
  });

  it('denies workspace:edit to viewer', () => {
    expect(hasWorkspacePermission(workspace, 'viewer-uid', 'workspace:edit')).toBe(false);
  });

  it('grants members:view to viewer', () => {
    expect(hasWorkspacePermission(workspace, 'viewer-uid', 'members:view')).toBe(true);
  });

  it('denies members:invite to viewer', () => {
    expect(hasWorkspacePermission(workspace, 'viewer-uid', 'members:invite')).toBe(false);
  });

  it('grants players:view to viewer', () => {
    expect(hasWorkspacePermission(workspace, 'viewer-uid', 'players:view')).toBe(true);
  });

  it('denies players:create to viewer', () => {
    expect(hasWorkspacePermission(workspace, 'viewer-uid', 'players:create')).toBe(false);
  });

  it('grants games:view to viewer', () => {
    expect(hasWorkspacePermission(workspace, 'viewer-uid', 'games:view')).toBe(true);
  });

  it('denies games:create to viewer', () => {
    expect(hasWorkspacePermission(workspace, 'viewer-uid', 'games:create')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasWorkspacePermission - Non-member
// ---------------------------------------------------------------------------

describe('hasWorkspacePermission() - non-member', () => {
  it('denies all permissions to a user not in the workspace', () => {
    const workspace = buildWorkspace();
    expect(hasWorkspacePermission(workspace, 'stranger-uid', 'workspace:view')).toBe(false);
    expect(hasWorkspacePermission(workspace, 'stranger-uid', 'players:view')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// assertWorkspacePermission
// ---------------------------------------------------------------------------

describe('assertWorkspacePermission()', () => {
  it('does not throw when user has the permission', () => {
    const workspace = buildWorkspace();
    expect(() =>
      assertWorkspacePermission(workspace, 'owner-uid', 'workspace:delete')
    ).not.toThrow();
  });

  it('throws Error when user lacks the permission', () => {
    const workspace = addMember(buildWorkspace(), 'viewer-uid', 'viewer');
    expect(() =>
      assertWorkspacePermission(workspace, 'viewer-uid', 'workspace:delete')
    ).toThrow(/Permission denied/);
  });

  it('error message includes the permission name', () => {
    const workspace = addMember(buildWorkspace(), 'viewer-uid', 'viewer');
    expect(() =>
      assertWorkspacePermission(workspace, 'viewer-uid', 'players:create')
    ).toThrow('players:create');
  });
});

// ---------------------------------------------------------------------------
// getUserRole
// ---------------------------------------------------------------------------

describe('getUserRole()', () => {
  it('returns "owner" for the workspace ownerUserId', () => {
    const workspace = buildWorkspace();
    expect(getUserRole(workspace, 'owner-uid')).toBe('owner');
  });

  it('returns the member role from the members array', () => {
    const workspace = addMember(buildWorkspace(), 'admin-uid', 'admin');
    expect(getUserRole(workspace, 'admin-uid')).toBe('admin');
  });

  it('returns "member" role for a member-role user', () => {
    const workspace = addMember(buildWorkspace(), 'member-uid', 'member');
    expect(getUserRole(workspace, 'member-uid')).toBe('member');
  });

  it('returns "viewer" role for a viewer-role user', () => {
    const workspace = addMember(buildWorkspace(), 'viewer-uid', 'viewer');
    expect(getUserRole(workspace, 'viewer-uid')).toBe('viewer');
  });

  it('returns null for a user not in the workspace', () => {
    const workspace = buildWorkspace();
    expect(getUserRole(workspace, 'stranger-uid')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isWorkspaceMember
// ---------------------------------------------------------------------------

describe('isWorkspaceMember()', () => {
  it('returns true for the workspace owner', () => {
    const workspace = buildWorkspace();
    expect(isWorkspaceMember(workspace, 'owner-uid')).toBe(true);
  });

  it('returns true for a user in the members array', () => {
    const workspace = addMember(buildWorkspace(), 'member-uid', 'member');
    expect(isWorkspaceMember(workspace, 'member-uid')).toBe(true);
  });

  it('returns false for a user not in the workspace', () => {
    const workspace = buildWorkspace();
    expect(isWorkspaceMember(workspace, 'stranger-uid')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canManageMember
// ---------------------------------------------------------------------------

describe('canManageMember()', () => {
  it('owner can manage owner', () => {
    expect(canManageMember('owner', 'owner')).toBe(true);
  });

  it('owner can manage admin', () => {
    expect(canManageMember('owner', 'admin')).toBe(true);
  });

  it('owner can manage member', () => {
    expect(canManageMember('owner', 'member')).toBe(true);
  });

  it('owner can manage viewer', () => {
    expect(canManageMember('owner', 'viewer')).toBe(true);
  });

  it('admin can manage member', () => {
    expect(canManageMember('admin', 'member')).toBe(true);
  });

  it('admin can manage viewer', () => {
    expect(canManageMember('admin', 'viewer')).toBe(true);
  });

  it('admin cannot manage another admin', () => {
    expect(canManageMember('admin', 'admin')).toBe(false);
  });

  it('admin cannot manage owner', () => {
    expect(canManageMember('admin', 'owner')).toBe(false);
  });

  it('member cannot manage anyone', () => {
    expect(canManageMember('member', 'viewer')).toBe(false);
    expect(canManageMember('member', 'member')).toBe(false);
    expect(canManageMember('member', 'admin')).toBe(false);
    expect(canManageMember('member', 'owner')).toBe(false);
  });

  it('viewer cannot manage anyone', () => {
    expect(canManageMember('viewer', 'viewer')).toBe(false);
    expect(canManageMember('viewer', 'member')).toBe(false);
    expect(canManageMember('viewer', 'admin')).toBe(false);
    expect(canManageMember('viewer', 'owner')).toBe(false);
  });
});
