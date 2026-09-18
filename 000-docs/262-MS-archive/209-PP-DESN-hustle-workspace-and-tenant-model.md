# Hustle Workspace & Tenant Model - Design Document

**Document Type**: Planning - Design
**Phase**: Phase 5 - Customer Workspaces, Stripe Billing, and Go-Live Guardrails
**Task**: Task 1 - Workspace & Tenant Model (Firestore)
**Status**: APPROVED
**Created**: 2025-11-16

---

## Overview

This document defines the **workspace/tenant model** for Hustle, enabling paying customers to have isolated workspaces that own players, games, and billing relationships. A workspace represents a billable entity (typically a parent/guardian account) with configurable plan limits.

---

## Goals

1. Enable **multi-tenant architecture** where each workspace is an isolated billing entity
2. Support **workspace ownership** with clear owner → workspace → resources relationship
3. Allow **future collaborator model** (coaches, other guardians) without breaking current design
4. Integrate seamlessly with **Stripe billing** (workspace ↔ Stripe customer ↔ subscription)
5. Enforce **plan-based limits** (max players, max games) per workspace
6. Maintain **backward compatibility** with existing user/player/game data

---

## Data Model

### **Workspace Collection**

**Collection Path**: `/workspaces/{workspaceId}`

**Schema**:
```typescript
interface Workspace {
  id: string;                    // Auto-generated Firestore document ID
  ownerUserId: string;           // Firebase UID of owner (primary billing contact)
  name: string;                  // Workspace display name (e.g., "Johnson Family Stats")
  plan: WorkspacePlan;           // Current plan tier (free, starter, plus, pro)
  status: WorkspaceStatus;       // Workspace lifecycle status

  // Billing integration
  billing: {
    stripeCustomerId: string | null;        // Stripe customer ID
    stripeSubscriptionId: string | null;    // Stripe subscription ID
    currentPeriodEnd: Date | null;          // Subscription renewal date
  };

  // Usage tracking (denormalized for quick checks)
  usage: {
    playerCount: number;         // Current active players in workspace
    gamesThisMonth: number;      // Games created this billing cycle
    storageUsedMB: number;       // Storage used (photos, videos - future)
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;        // Soft delete timestamp
}

type WorkspacePlan = 'free' | 'starter' | 'plus' | 'pro';

type WorkspaceStatus =
  | 'active'           // Workspace active and in good standing
  | 'trial'            // Free trial period
  | 'past_due'         // Payment failed, grace period
  | 'canceled'         // Subscription canceled, still accessible until period end
  | 'suspended'        // Access restricted (payment issues, TOS violation)
  | 'deleted';         // Soft deleted, no longer accessible
```

**Indexes Required**:
```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "workspaces",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerUserId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "workspaces",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "billing.stripeCustomerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

### **Workspace Members (Future - Collaborators)**

**Collection Path**: `/workspaces/{workspaceId}/members/{userId}`

**Schema** (not implemented in Phase 5, designed for future):
```typescript
interface WorkspaceMember {
  userId: string;                // Firebase UID
  role: MemberRole;              // 'owner' | 'admin' | 'coach' | 'viewer'
  permissions: MemberPermissions;
  invitedBy: string;             // Firebase UID of inviter
  invitedAt: Date;
  acceptedAt: Date | null;
  status: 'pending' | 'active' | 'suspended' | 'removed';
}

type MemberRole = 'owner' | 'admin' | 'coach' | 'viewer';

interface MemberPermissions {
  canCreatePlayers: boolean;
  canEditPlayers: boolean;
  canDeletePlayers: boolean;
  canLogGames: boolean;
  canVerifyGames: boolean;
  canManageBilling: boolean;     // Owner only in Phase 5
  canInviteMembers: boolean;     // Owner/Admin only
}
```

**Phase 5 Decision**: Single owner only. Members collection designed but not implemented.

---

### **Updated User Model**

**Collection Path**: `/users/{userId}` (existing, modified)

**Schema Changes**:
```typescript
interface User {
  // ... existing fields (email, firstName, lastName, etc.)

  // NEW: Default workspace reference
  defaultWorkspaceId: string | null;  // Primary workspace for this user

  // NEW: Owned workspaces (denormalized for quick access)
  ownedWorkspaces: string[];          // Array of workspace IDs where user is owner

  // NEW: Member workspaces (future - collaborator access)
  memberWorkspaces?: string[];        // Workspaces where user is a member (not owner)
}
```

**Migration Strategy**: Existing users will have `defaultWorkspaceId` set to auto-created workspace on first login.

---

### **Updated Player Model**

**Collection Path**: `/users/{userId}/players/{playerId}` (existing, modified)

**Schema Changes**:
```typescript
interface Player {
  // ... existing fields (name, birthday, position, etc.)

  // NEW: Workspace ownership
  workspaceId: string;  // REQUIRED - workspace that owns this player

  // Existing parent reference maintained for backward compatibility
  parentId: string;     // Firebase UID (same as userId in path)
}
```

**Firestore Security Rule Update**:
```javascript
// Players must belong to a workspace owned by authenticated user
match /users/{userId}/players/{playerId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null
    && request.auth.uid == userId
    && request.resource.data.workspaceId is string
    && exists(/databases/$(database)/documents/workspaces/$(request.resource.data.workspaceId))
    && get(/databases/$(database)/documents/workspaces/$(request.resource.data.workspaceId)).data.ownerUserId == request.auth.uid;
}
```

---

### **Updated Game Model**

**Collection Path**: `/users/{userId}/players/{playerId}/games/{gameId}` (existing, modified)

**Schema Changes**:
```typescript
interface Game {
  // ... existing fields (date, opponent, result, stats, etc.)

  // NEW: Workspace ownership (denormalized for quick filtering)
  workspaceId: string;  // REQUIRED - workspace that owns this game

  // Existing player/parent references maintained
  playerId: string;     // Player ID (from path)
  parentId: string;     // Firebase UID (same as userId in path)
}
```

**Firestore Security Rule Update**:
```javascript
// Games must belong to workspace-owned players
match /users/{userId}/players/{playerId}/games/{gameId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null
    && request.auth.uid == userId
    && request.resource.data.workspaceId is string
    && get(/databases/$(database)/documents/users/$(userId)/players/$(playerId)).data.workspaceId == request.resource.data.workspaceId;
}
```

---

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         WORKSPACE MODEL                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Firebase Auth   │
│   (User UID)     │
└────────┬─────────┘
         │ owns (1:N)
         ↓
┌──────────────────────────────────────────────────────────────┐
│  /workspaces/{workspaceId}                                   │
│  ┌────────────────────────────────────────────────────┐      │
│  │ id: "ws_abc123"                                    │      │
│  │ ownerUserId: "firebase_uid_xyz"                    │      │
│  │ name: "Johnson Family Stats"                       │      │
│  │ plan: "starter"                                    │      │
│  │ status: "active"                                   │      │
│  │ billing: { stripeCustomerId, stripeSubscriptionId }│      │
│  │ usage: { playerCount: 3, gamesThisMonth: 12 }     │      │
│  └────────────────────────────────────────────────────┘      │
└──────────────────────┬───────────────────────────────────────┘
                       │ owns (1:N)
                       ↓
┌──────────────────────────────────────────────────────────────┐
│  /users/{userId}/players/{playerId}                          │
│  ┌────────────────────────────────────────────────────┐      │
│  │ id: "player_123"                                   │      │
│  │ workspaceId: "ws_abc123"  ← NEW                    │      │
│  │ parentId: "firebase_uid_xyz"                       │      │
│  │ name: "Alex Johnson"                               │      │
│  │ position: "midfielder"                             │      │
│  └────────────────────────────────────────────────────┘      │
└──────────────────────┬───────────────────────────────────────┘
                       │ has (1:N)
                       ↓
┌──────────────────────────────────────────────────────────────┐
│  /users/{userId}/players/{playerId}/games/{gameId}           │
│  ┌────────────────────────────────────────────────────┐      │
│  │ id: "game_456"                                     │      │
│  │ workspaceId: "ws_abc123"  ← NEW (denormalized)     │      │
│  │ playerId: "player_123"                             │      │
│  │ parentId: "firebase_uid_xyz"                       │      │
│  │ date: "2025-11-15"                                 │      │
│  │ opponent: "FC Tigers"                              │      │
│  │ goals: 2, assists: 1, ...                          │      │
│  └────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Stripe Customer │  ← Linked via billing.stripeCustomerId
│  + Subscription  │
└──────────────────┘
```

---

## Ownership Model

### **Phase 5: Single Owner**

- Each workspace has **exactly one owner** (`ownerUserId`)
- Owner is the **primary billing contact**
- Owner has **full control** over workspace:
  - Create/edit/delete players
  - Log and verify games
  - Manage billing and subscription
  - Delete workspace

### **Future: Collaborator Model** (Phase 6+)

- Owner can invite **members** to workspace
- Members have **role-based permissions**:
  - **Admin**: Full access except billing
  - **Coach**: Can log/verify games, view stats
  - **Viewer**: Read-only access to stats
- Invitations stored in `/workspaces/{id}/invitations/{email}`
- Accepted invitations create `/workspaces/{id}/members/{userId}` documents

---

## Lifecycle Management

### **Workspace Creation**

**Trigger**: User completes registration or first login (existing users)

**Flow**:
1. User signs up with Firebase Auth
2. User document created in `/users/{userId}`
3. **Auto-create default workspace**:
   ```typescript
   const workspace = {
     id: generateId(),
     ownerUserId: userId,
     name: `${user.firstName}'s Workspace`,
     plan: 'free',  // Start with free tier
     status: 'trial',  // 14-day trial
     billing: {
       stripeCustomerId: null,
       stripeSubscriptionId: null,
       currentPeriodEnd: addDays(new Date(), 14),  // Trial ends in 14 days
     },
     usage: {
       playerCount: 0,
       gamesThisMonth: 0,
       storageUsedMB: 0,
     },
     createdAt: new Date(),
     updatedAt: new Date(),
     deletedAt: null,
   };
   ```
4. Set `user.defaultWorkspaceId = workspace.id`
5. Set `user.ownedWorkspaces = [workspace.id]`

---

### **Workspace Updates**

**Plan Changes** (via Stripe webhook):
```typescript
// On customer.subscription.updated
await updateWorkspace(workspaceId, {
  plan: mapStripePriceToPlan(subscription.items.data[0].price.id),
  'billing.stripeSubscriptionId': subscription.id,
  'billing.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
  status: mapStripeStatusToWorkspaceStatus(subscription.status),
  updatedAt: new Date(),
});
```

**Status Transitions**:
```
trial → active (payment succeeded)
trial → past_due (payment failed)
active → past_due (payment failed)
past_due → active (payment recovered)
past_due → canceled (grace period expired)
active → canceled (user canceled)
canceled → deleted (retention period expired)
```

---

### **Soft Delete vs Hard Delete**

**Soft Delete** (Recommended):
- Set `workspace.deletedAt = new Date()`
- Set `workspace.status = 'deleted'`
- Keep data for **90 days** (retention period)
- Users can **request reactivation** within 90 days
- After 90 days: Run Cloud Function to **hard delete**

**Hard Delete** (Permanent):
- Delete workspace document
- Cascade delete all players and games in subcollections
- Cancel Stripe subscription
- **No recovery possible**

**Phase 5 Implementation**: Soft delete only. Hard delete deferred to Phase 6.

---

## Backward Compatibility

### **Existing User Migration**

**Problem**: Existing users have players/games without `workspaceId`.

**Solution**: Migration script run on first login (Phase 5 Task 1):

```typescript
async function migrateUserToWorkspaceModel(userId: string) {
  // 1. Check if user already has workspace
  const user = await getUser(userId);
  if (user.defaultWorkspaceId) {
    return;  // Already migrated
  }

  // 2. Create default workspace
  const workspace = await createWorkspaceForUser(userId, 'free');

  // 3. Update user document
  await updateUser(userId, {
    defaultWorkspaceId: workspace.id,
    ownedWorkspaces: [workspace.id],
  });

  // 4. Update all existing players
  const players = await getPlayers(userId);
  for (const player of players) {
    await updatePlayer(userId, player.id, {
      workspaceId: workspace.id,
    });

    // 5. Update all games for this player
    const games = await getGames(userId, player.id);
    for (const game of games) {
      await updateGame(userId, player.id, game.id, {
        workspaceId: workspace.id,
      });
    }
  }
}
```

**Trigger**: Server-side middleware on first dashboard page load.

---

## Implementation Checklist

### **Firestore Services** (`src/lib/firebase/services/workspaces.ts`)

- [ ] `createWorkspaceForUser(userId, plan)` - Create new workspace
- [ ] `getWorkspaceById(workspaceId)` - Fetch workspace by ID
- [ ] `listWorkspacesForUser(userId)` - Get all workspaces owned by user
- [ ] `updateWorkspacePlan(workspaceId, plan)` - Change plan tier
- [ ] `updateWorkspaceStatus(workspaceId, status)` - Change lifecycle status
- [ ] `incrementPlayerCount(workspaceId)` - Increment usage.playerCount
- [ ] `decrementPlayerCount(workspaceId)` - Decrement usage.playerCount
- [ ] `incrementGamesThisMonth(workspaceId)` - Increment usage.gamesThisMonth
- [ ] `resetMonthlyGameCount(workspaceId)` - Reset monthly counter (cron job)
- [ ] `deactivateWorkspace(workspaceId)` - Soft delete workspace

### **Updated Services**

- [ ] `players.ts` - Add `workspaceId` to create/update operations
- [ ] `games.ts` - Add `workspaceId` to create/update operations
- [ ] `users.ts` - Add workspace fields to user model

### **Security Rules** (`firestore.rules`)

- [ ] Update `/workspaces/{id}` rules (owner-only access)
- [ ] Update `/users/{userId}/players/{playerId}` rules (workspace validation)
- [ ] Update `/users/{userId}/players/{playerId}/games/{gameId}` rules (workspace validation)

### **UI Components**

- [ ] `WorkspaceSummary.tsx` - Display workspace name, plan, status
- [ ] Add to dashboard layout or settings page
- [ ] Show current usage (players, games) with limits

---

## Future Enhancements (Phase 6+)

1. **Multi-workspace support**: Users can own/belong to multiple workspaces
2. **Workspace switching**: UI to switch between workspaces
3. **Collaborator invitations**: Invite coaches, other guardians
4. **Role-based permissions**: Fine-grained access control
5. **Workspace transfer**: Change ownership
6. **Workspace analytics**: Usage trends, insights
7. **Team workspaces**: Coaches managing entire teams (not individual families)

---

## Success Criteria

- [ ] Workspace model implemented in Firestore
- [ ] All new players/games require workspace context
- [ ] Existing users auto-migrated to workspace model
- [ ] Backward compatibility maintained (no breaking changes)
- [ ] Security rules enforce workspace ownership
- [ ] UI displays workspace summary
- [ ] Ready for Stripe billing integration (Task 3)

---

**Status**: APPROVED for implementation
**Next Step**: Task 1 implementation (Firestore services + UI wiring)

---

**Timestamp**: 2025-11-16
