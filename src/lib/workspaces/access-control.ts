/**
 * Workspace Access Control
 *
 * Phase 6 Task 6: Collaborators & Team Access
 *
 * Role-based permission system for workspace collaborators.
 */

import type { Workspace, WorkspaceMemberRole } from '@/types/domain';
import { createLogger } from '@/lib/logger';

const logger = createLogger('workspaces/access-control');

/**
 * Permission Actions
 *
 * Defines actions that can be performed on workspaces.
 */
export type WorkspacePermission =
  // Workspace Management
  | 'workspace:view'         // View workspace settings
  | 'workspace:edit'         // Edit workspace name/settings
  | 'workspace:delete'       // Delete workspace
  | 'workspace:billing'      // Manage billing and subscription
  // Member Management
  | 'members:view'           // View member list
  | 'members:invite'         // Invite new members
  | 'members:remove'         // Remove members
  | 'members:changeRole'     // Change member roles
  // Player Management
  | 'players:view'           // View players
  | 'players:create'         // Create new players
  | 'players:edit'           // Edit player details
  | 'players:delete'         // Delete players
  // Game Management
  | 'games:view'             // View games
  | 'games:create'           // Create new games
  | 'games:edit'             // Edit game details
  | 'games:delete'           // Delete games
  | 'games:verify';          // Verify games

/**
 * Role Permissions Matrix
 *
 * Defines which permissions each role has.
 */
const ROLE_PERMISSIONS: Record<WorkspaceMemberRole, WorkspacePermission[]> = {
  owner: [
    // Workspace Management
    'workspace:view',
    'workspace:edit',
    'workspace:delete',
    'workspace:billing',
    // Member Management
    'members:view',
    'members:invite',
    'members:remove',
    'members:changeRole',
    // Player Management
    'players:view',
    'players:create',
    'players:edit',
    'players:delete',
    // Game Management
    'games:view',
    'games:create',
    'games:edit',
    'games:delete',
    'games:verify',
  ],
  admin: [
    // Workspace Management
    'workspace:view',
    'workspace:edit',
    // Member Management
    'members:view',
    'members:invite',
    'members:remove',
    // Player Management
    'players:view',
    'players:create',
    'players:edit',
    'players:delete',
    // Game Management
    'games:view',
    'games:create',
    'games:edit',
    'games:delete',
    'games:verify',
  ],
  member: [
    // Workspace Management
    'workspace:view',
    // Member Management
    'members:view',
    // Player Management
    'players:view',
    'players:create',
    'players:edit',
    // Game Management
    'games:view',
    'games:create',
    'games:edit',
    'games:verify',
  ],
  viewer: [
    // Workspace Management
    'workspace:view',
    // Member Management
    'members:view',
    // Player Management
    'players:view',
    // Game Management
    'games:view',
  ],
};

/**
 * Check if user has permission for an action on a workspace
 *
 * @param workspace - Workspace to check
 * @param userId - User Firebase UID
 * @param permission - Permission to check
 * @returns True if user has permission
 */
export function hasWorkspacePermission(
  workspace: Workspace,
  userId: string,
  permission: WorkspacePermission
): boolean {
  // Owner always has all permissions
  if (workspace.ownerUserId === userId) {
    return true;
  }

  // Find user in members array
  const member = workspace.members.find((m) => m.userId === userId);
  if (!member) {
    logger.warn('User not a member of workspace', {
      workspaceId: workspace.id,
      userId,
      permission,
    });
    return false;
  }

  // Check if role has permission
  const rolePermissions = ROLE_PERMISSIONS[member.role];
  const hasPermission = rolePermissions.includes(permission);

  if (!hasPermission) {
    logger.warn('User lacks permission', {
      workspaceId: workspace.id,
      userId,
      role: member.role,
      permission,
    });
  }

  return hasPermission;
}

/**
 * Assert user has permission (throws error if not)
 *
 * @param workspace - Workspace to check
 * @param userId - User Firebase UID
 * @param permission - Permission to check
 * @throws Error if user lacks permission
 */
export function assertWorkspacePermission(
  workspace: Workspace,
  userId: string,
  permission: WorkspacePermission
): void {
  if (!hasWorkspacePermission(workspace, userId, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Get user's role in workspace
 *
 * @param workspace - Workspace to check
 * @param userId - User Firebase UID
 * @returns User's role or null if not a member
 */
export function getUserRole(workspace: Workspace, userId: string): WorkspaceMemberRole | null {
  // Owner role
  if (workspace.ownerUserId === userId) {
    return 'owner';
  }

  // Member role
  const member = workspace.members.find((m) => m.userId === userId);
  return member?.role || null;
}

/**
 * Check if user is a member of workspace (any role)
 *
 * @param workspace - Workspace to check
 * @param userId - User Firebase UID
 * @returns True if user is owner or member
 */
export function isWorkspaceMember(workspace: Workspace, userId: string): boolean {
  return workspace.ownerUserId === userId || workspace.members.some((m) => m.userId === userId);
}

/**
 * Check if user can manage another member (based on roles)
 *
 * Rules:
 * - Owners can manage all members
 * - Admins can manage members and viewers
 * - Members and viewers cannot manage anyone
 *
 * @param managerRole - Role of user performing action
 * @param targetRole - Role of user being managed
 * @returns True if manager can manage target
 */
export function canManageMember(
  managerRole: WorkspaceMemberRole,
  targetRole: WorkspaceMemberRole
): boolean {
  if (managerRole === 'owner') {
    return true; // Owners can manage everyone
  }

  if (managerRole === 'admin') {
    // Admins can manage members and viewers (not other admins or owner)
    return targetRole === 'member' || targetRole === 'viewer';
  }

  // Members and viewers cannot manage anyone
  return false;
}
