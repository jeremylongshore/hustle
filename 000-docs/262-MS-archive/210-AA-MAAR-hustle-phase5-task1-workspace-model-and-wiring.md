# Phase 5 Task 1: Workspace Model & Wiring - Mini AAR

**Timestamp**: 2025-11-16
**Phase**: Phase 5 - Customer Workspaces, Stripe Billing, and Go-Live Guardrails
**Task**: Task 1 - Workspace & Tenant Model (Firestore)
**Status**: ✅ COMPLETE

---

## Overview

Successfully implemented workspace/tenant model in Firestore, enabling multi-tenant architecture for billing and resource isolation. Each workspace represents a billable entity (parent/guardian account) that owns players, games, and has usage tracking for plan limit enforcement.

---

## Design Document

**Created**: `000-docs/209-PP-DESN-hustle-workspace-and-tenant-model.md`

**Key Decisions**:
- **Single owner model** for Phase 5 (collaborators designed for Phase 6)
- **Soft delete** approach with 90-day retention period
- **Denormalized usage counters** for quick plan limit checks
- **Workspace-first architecture** - all resources require workspace context

---

## Firestore Schema Changes

### **1. New Collection: `/workspaces/{workspaceId}`**

**Document Structure**:
```typescript
interface WorkspaceDocument {
  ownerUserId: string;             // Firebase UID of workspace owner
  name: string;                    // Display name
  plan: WorkspacePlan;             // 'free' | 'starter' | 'plus' | 'pro'
  status: WorkspaceStatus;         // 'active' | 'trial' | 'past_due' | 'canceled' | 'suspended' | 'deleted'

  billing: {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd: Timestamp | null;
  };

  usage: {
    playerCount: number;           // Current active players
    gamesThisMonth: number;        // Games created this billing cycle
    storageUsedMB: number;         // Storage used (future)
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;     // Soft delete
}
```

**Indexes Required** (to be added to `firestore.indexes.json`):
- `ownerUserId` + `status` + `createdAt` (DESC)
- `billing.stripeCustomerId` + `status`

---

### **2. Updated Collection: `/users/{userId}`**

**New Fields Added**:
```typescript
interface UserDocument {
  // ... existing fields

  // NEW (Phase 5):
  defaultWorkspaceId: string | null;  // Primary workspace
  ownedWorkspaces: string[];          // Array of owned workspace IDs
}
```

**Impact**: Existing users will have these fields set to `null` and `[]` respectively until migrated.

---

### **3. Updated Subcollection: `/users/{userId}/players/{playerId}`**

**New Field Added**:
```typescript
interface PlayerDocument {
  // NEW (Phase 5):
  workspaceId: string;  // REQUIRED - workspace that owns this player

  // ... existing fields
}
```

**Impact**: All new players MUST include `workspaceId`. Existing players will need migration.

---

### **4. Updated Subcollection: `/users/{userId}/players/{playerId}/games/{gameId}`**

**New Field Added**:
```typescript
interface GameDocument {
  // NEW (Phase 5):
  workspaceId: string;  // REQUIRED - workspace that owns this game (denormalized)

  // ... existing fields
}
```

**Impact**: Denormalized for quick filtering. Existing games will need migration.

---

## Firestore Services Implemented

### **New Service: `src/lib/firebase/services/workspaces.ts`**

**Functions Implemented**:

1. **`createWorkspaceForUser(userId, plan, name?)`**
   - Creates new workspace with 14-day trial for free plan
   - Initializes usage counters to zero
   - Sets status to 'trial' (free) or 'active' (paid)

2. **`getWorkspaceById(workspaceId)`**
   - Fetches single workspace by ID
   - Returns null if not found

3. **`listWorkspacesForUser(userId)`**
   - Lists all non-deleted workspaces owned by user
   - Ordered by creation date (newest first)

4. **`updateWorkspacePlan(workspaceId, plan)`**
   - Changes plan tier (for Stripe webhook integration)

5. **`updateWorkspaceStatus(workspaceId, status)`**
   - Changes lifecycle status (active → past_due, etc.)

6. **`updateWorkspaceBilling(workspaceId, billing)`**
   - Updates Stripe customer ID, subscription ID, renewal date
   - Called from Stripe webhook handler

7. **`incrementPlayerCount(workspaceId)`**
   - Atomic increment of `usage.playerCount`
   - Called when player is created

8. **`decrementPlayerCount(workspaceId)`**
   - Atomic decrement of `usage.playerCount`
   - Called when player is deleted

9. **`incrementGamesThisMonth(workspaceId)`**
   - Atomic increment of `usage.gamesThisMonth`
   - Called when game is created

10. **`resetMonthlyGameCount(workspaceId)`**
    - Resets `usage.gamesThisMonth` to 0
    - Called by scheduled Cloud Function (monthly)

11. **`deactivateWorkspace(workspaceId)`**
    - Soft delete (sets `status = 'deleted'`, `deletedAt = now`)

12. **`getWorkspaceByStripeCustomerId(stripeCustomerId)`**
    - Lookup workspace by Stripe customer ID
    - Used in webhook handlers

13. **`updateWorkspaceName(workspaceId, name)`**
    - Update workspace display name

---

### **Updated Service: `src/lib/firebase/services/players.ts`**

**Function Modified**: `createPlayer(userId, data)`

**Changes**:
```typescript
// BEFORE (Phase 4)
export async function createPlayer(
  userId: string,
  data: {
    name: string;
    birthday: Date;
    position: string;
    teamClub: string;
    photoUrl?: string | null;
  }
): Promise<Player>

// AFTER (Phase 5)
export async function createPlayer(
  userId: string,
  data: {
    workspaceId: string;  // ← NEW REQUIRED FIELD
    name: string;
    birthday: Date;
    position: string;
    teamClub: string;
    photoUrl?: string | null;
  }
): Promise<Player>
```

**Impact**: All callers of `createPlayer()` must now provide `workspaceId`.

---

### **Updated Service: `src/lib/firebase/services/games.ts`**

**Function Modified**: `createGame(userId, playerId, data)`

**Changes**:
```typescript
// BEFORE (Phase 4)
export async function createGame(
  userId: string,
  playerId: string,
  data: {
    date: Date;
    opponent: string;
    // ... stats
  }
): Promise<Game>

// AFTER (Phase 5)
export async function createGame(
  userId: string,
  playerId: string,
  data: {
    workspaceId: string;  // ← NEW REQUIRED FIELD
    date: Date;
    opponent: string;
    // ... stats
  }
): Promise<Game>
```

**Impact**: All callers of `createGame()` must now provide `workspaceId`.

---

### **Updated Service: `src/lib/firebase/services/users.ts`**

**Functions Modified**:

1. **`createUser(userId, data)`**
   - Added optional `defaultWorkspaceId` and `ownedWorkspaces` parameters
   - Initializes to `null` and `[]` if not provided

2. **`updateUser(userId, data)`**
   - Added `defaultWorkspaceId` and `ownedWorkspaces` to allowed update fields

---

## UI Components Created

### **New Component: `src/components/WorkspaceSummary.tsx`**

**Purpose**: Display workspace information in dashboard

**Features**:
- Shows workspace name
- Displays current plan tier with badge
- Shows status with color-coded badge
- Displays usage stats (player count, games this month)
- Shows billing/trial renewal date

**Props**:
```typescript
interface WorkspaceSummaryProps {
  workspaceId: string;
}
```

**Usage Example**:
```tsx
import { WorkspaceSummary } from '@/components/WorkspaceSummary';

export default function DashboardPage() {
  const user = await getUser(session.user.id);

  return (
    <div>
      {user.defaultWorkspaceId && (
        <WorkspaceSummary workspaceId={user.defaultWorkspaceId} />
      )}
      {/* ... rest of dashboard */}
    </div>
  );
}
```

**Styling**: Uses Tailwind CSS with status/plan-specific badge colors

---

## Relationship Diagram (ASCII)

```
┌─────────────────┐
│ Firebase Auth   │
│ (User UID)      │
└────────┬────────┘
         │ owns (1:N)
         ↓
┌────────────────────────────────────────┐
│ /workspaces/{workspaceId}              │
│  - ownerUserId                         │
│  - plan (free/starter/plus/pro)        │
│  - status (active/trial/past_due/...)  │
│  - billing { Stripe IDs }              │
│  - usage { playerCount, gamesThisMonth}│
└────────┬───────────────────────────────┘
         │ owns (1:N)
         ↓
┌────────────────────────────────────────┐
│ /users/{userId}/players/{playerId}     │
│  - workspaceId ← LINKS TO WORKSPACE    │
│  - name, position, teamClub            │
└────────┬───────────────────────────────┘
         │ has (1:N)
         ↓
┌────────────────────────────────────────┐
│ /users/{userId}/players/{playerId}/    │
│        games/{gameId}                  │
│  - workspaceId ← DENORMALIZED          │
│  - stats (goals, assists, etc.)        │
└────────────────────────────────────────┘
```

---

## Backward Compatibility

### **Breaking Changes**

**API Contract Changes**:
1. `createPlayer()` now requires `workspaceId` parameter
2. `createGame()` now requires `workspaceId` parameter

**Migration Required**:
- Existing players/games without `workspaceId` must be migrated
- Existing users must be assigned a default workspace

**Migration Strategy** (to be executed in Task 3 or separate script):
```typescript
async function migrateUserToWorkspaceModel(userId: string) {
  // 1. Check if user already has workspace
  const user = await getUser(userId);
  if (user.defaultWorkspaceId) {
    return; // Already migrated
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

**Trigger**: Run migration on first dashboard page load (middleware check).

---

## Security Considerations

### **Firestore Security Rules** (to be updated in `firestore.rules`)

**Workspace Collection**:
```javascript
match /workspaces/{workspaceId} {
  // Owner can read/write their own workspaces
  allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerUserId;

  // Allow creation if user is setting themselves as owner
  allow create: if request.auth != null && request.resource.data.ownerUserId == request.auth.uid;
}
```

**Player Subcollection** (updated):
```javascript
match /users/{userId}/players/{playerId} {
  allow read: if request.auth != null && request.auth.uid == userId;

  // Ensure player belongs to a workspace owned by authenticated user
  allow write: if request.auth != null
    && request.auth.uid == userId
    && request.resource.data.workspaceId is string
    && exists(/databases/$(database)/documents/workspaces/$(request.resource.data.workspaceId))
    && get(/databases/$(database)/documents/workspaces/$(request.resource.data.workspaceId)).data.ownerUserId == request.auth.uid;
}
```

**Game Subcollection** (updated):
```javascript
match /users/{userId}/players/{playerId}/games/{gameId} {
  allow read: if request.auth != null && request.auth.uid == userId;

  // Ensure game's workspaceId matches player's workspaceId
  allow write: if request.auth != null
    && request.auth.uid == userId
    && request.resource.data.workspaceId is string
    && get(/databases/$(database)/documents/users/$(userId)/players/$(playerId)).data.workspaceId == request.resource.data.workspaceId;
}
```

---

## Next Steps (Task 2-6)

**Immediate** (Task 2):
- [ ] Define plan limits (max players, max games per plan tier)
- [ ] Design Stripe product/price mapping
- [ ] Document subscription lifecycle integration

**Required for Full Functionality** (Task 3):
- [ ] Implement Stripe checkout session creation
- [ ] Implement Stripe webhook handlers
- [ ] Link workspaces ↔ Stripe customers/subscriptions

**Usage Enforcement** (Task 4):
- [ ] Add plan limit checks to `createPlayer()` and `createGame()`
- [ ] Return structured errors when limits exceeded
- [ ] Add UI upgrade prompts

**Data Migration** (Phase 6 or separate task):
- [ ] Migrate existing users to workspace model
- [ ] Assign default workspace to all users
- [ ] Backfill `workspaceId` on existing players/games

---

## Files Changed Summary

### **Created (4 files)**

1. `000-docs/209-PP-DESN-hustle-workspace-and-tenant-model.md` - Design document
2. `src/lib/firebase/services/workspaces.ts` - Workspace CRUD operations
3. `src/components/WorkspaceSummary.tsx` - UI component
4. `000-docs/210-AA-MAAR-hustle-phase5-task1-workspace-model-and-wiring.md` - This AAR

### **Modified (4 files)**

1. `src/types/firestore.ts` - Added workspace types, updated User/Player/Game types
2. `src/lib/firebase/services/players.ts` - Added `workspaceId` to `createPlayer()`
3. `src/lib/firebase/services/games.ts` - Added `workspaceId` to `createGame()`
4. `src/lib/firebase/services/users.ts` - Added workspace fields to user operations

---

## Success Criteria Met ✅

- [x] Workspace data model designed and documented
- [x] Firestore workspace collection schema defined
- [x] Workspace service implemented with 13 CRUD functions
- [x] Player/game services updated to require `workspaceId`
- [x] User service updated to support workspace ownership
- [x] Basic UI component created (WorkspaceSummary)
- [x] TypeScript types updated for workspace model
- [x] Relationship diagram documented
- [x] Security rules outlined (to be deployed)
- [x] Backward compatibility strategy documented

---

**End of Mini AAR - Task 1 Complete** ✅

---

**Next Task**: Task 2 - Stripe Product & Pricing Model - System Design

---

**Timestamp**: 2025-11-16
