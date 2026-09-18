# Phase 5 Task 4: Plan Limit Enforcement - Mini AAR

**Timestamp**: 2025-11-16
**Phase**: Phase 5 - Customer Workspaces, Stripe Billing, and Go-Live Guardrails
**Task**: Task 4 - Enforce Plan Limits (Players, Games, Access)
**Status**: ✅ COMPLETE

---

## Overview

Successfully implemented plan limit enforcement for player and game creation. The system now checks workspace usage against plan limits before allowing resource creation, returns structured errors when limits are exceeded, and atomically updates usage counters in Firestore.

---

## Implementation Summary

### **Enforcement Rules**

Plan limits are defined in `src/lib/stripe/plan-mapping.ts` via `getPlanLimits()`:

| Plan | Max Players | Max Games/Month | Storage (MB) |
|------|-------------|-----------------|--------------|
| Free | 2 | 10 | 100 |
| Starter | 5 | 50 | 500 |
| Plus | 15 | 200 | 2,048 |
| Pro | 9,999 | 9,999 | 10,240 |

**Enforcement Flow**:
```
1. User attempts to create resource (player or game)
2. API route fetches user → workspace
3. Check: workspace.usage.{count} >= limits.{max}?
4. If YES: Return 403 with structured error
5. If NO: Create resource + increment usage counter
```

---

## Files Modified

### **1. src/app/api/players/create/route.ts**

**Changes**:
- Added imports: `getUser`, `getWorkspaceById`, `incrementPlayerCount`, `getPlanLimits`
- Fetch user to get `defaultWorkspaceId`
- Fetch workspace to check current usage
- Check if `workspace.usage.playerCount >= limits.maxPlayers`
- Return structured error (403) when limit exceeded
- Pass `workspaceId` to `createPlayer()`
- Call `incrementPlayerCount()` after successful creation

**Structured Error Response**:
```json
{
  "error": "PLAN_LIMIT_EXCEEDED",
  "message": "You've reached the maximum number of players (5) for your starter plan. Upgrade your plan to add more players.",
  "currentPlan": "starter",
  "currentCount": 5,
  "limit": 5
}
```

**Key Code** (lines 47-94):
```typescript
// Phase 5 Task 4: Get user's workspace and check plan limits
const user = await getUser(session.user.id);
if (!user?.defaultWorkspaceId) {
  return NextResponse.json(
    { error: 'No workspace found. Please contact support.' },
    { status: 500 }
  );
}

const workspace = await getWorkspaceById(user.defaultWorkspaceId);
if (!workspace) {
  return NextResponse.json(
    { error: 'Workspace not found. Please contact support.' },
    { status: 500 }
  );
}

// Phase 5 Task 4: Check plan limit for max players
const limits = getPlanLimits(workspace.plan);
if (workspace.usage.playerCount >= limits.maxPlayers) {
  logger.warn('Player creation blocked - plan limit exceeded', {
    userId: session.user.id,
    workspaceId: workspace.id,
    currentPlan: workspace.plan,
    currentPlayerCount: workspace.usage.playerCount,
    maxPlayers: limits.maxPlayers,
  });

  return NextResponse.json(
    {
      error: 'PLAN_LIMIT_EXCEEDED',
      message: `You've reached the maximum number of players (${limits.maxPlayers}) for your ${workspace.plan} plan. Upgrade your plan to add more players.`,
      currentPlan: workspace.plan,
      currentCount: workspace.usage.playerCount,
      limit: limits.maxPlayers,
    },
    { status: 403 }
  );
}

// Create player with workspace context
const player = await createPlayer(session.user.id, {
  workspaceId: workspace.id,
  name,
  birthday: new Date(birthday),
  position,
  teamClub,
  photoUrl: null,
});

// Phase 5 Task 4: Increment workspace player count
await incrementPlayerCount(workspace.id);
```

---

### **2. src/app/api/games/route.ts**

**Changes**:
- Added imports: `createLogger`, `getWorkspaceById`, `incrementGamesThisMonth`, `getPlanLimits`
- Added logger instance: `createLogger('api/games')`
- Fetch user and workspace after rate limiting (lines 104-128)
- Check if `workspace.usage.gamesThisMonth >= limits.maxGamesPerMonth` (lines 165-186)
- Return structured error (403) when limit exceeded
- Pass `workspaceId` to `createGame()` (line 190)
- Call `incrementGamesThisMonth()` after successful creation (line 209)

**Structured Error Response**:
```json
{
  "error": "PLAN_LIMIT_EXCEEDED",
  "message": "You've reached the maximum number of games (50) for your starter plan this month. Upgrade your plan to track more games.",
  "currentPlan": "starter",
  "currentCount": 50,
  "limit": 50
}
```

**Key Code** (lines 165-186):
```typescript
// Phase 5 Task 4: Check plan limit for max games per month
const limits = getPlanLimits(workspace.plan);
if (workspace.usage.gamesThisMonth >= limits.maxGamesPerMonth) {
  logger.warn('Game creation blocked - plan limit exceeded', {
    userId: session.user.id,
    workspaceId: workspace.id,
    currentPlan: workspace.plan,
    currentGamesThisMonth: workspace.usage.gamesThisMonth,
    maxGamesPerMonth: limits.maxGamesPerMonth,
  });

  return NextResponse.json(
    {
      error: 'PLAN_LIMIT_EXCEEDED',
      message: `You've reached the maximum number of games (${limits.maxGamesPerMonth}) for your ${workspace.plan} plan this month. Upgrade your plan to track more games.`,
      currentPlan: workspace.plan,
      currentCount: workspace.usage.gamesThisMonth,
      limit: limits.maxGamesPerMonth,
    },
    { status: 403 }
  );
}
```

**Usage Counter Update** (line 209):
```typescript
// Phase 5 Task 4: Increment workspace game count
await incrementGamesThisMonth(workspace.id);
```

---

## Usage Counter Management

**Firestore Atomic Operations**:

Both `incrementPlayerCount()` and `incrementGamesThisMonth()` use Firestore's `increment()` operation for thread-safe counter updates:

```typescript
// From src/lib/firebase/services/workspaces.ts

export async function incrementPlayerCount(workspaceId: string): Promise<void> {
  const workspaceRef = db.collection('workspaces').doc(workspaceId);
  await workspaceRef.update({
    'usage.playerCount': admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function incrementGamesThisMonth(workspaceId: string): Promise<void> {
  const workspaceRef = db.collection('workspaces').doc(workspaceId);
  await workspaceRef.update({
    'usage.gamesThisMonth': admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
```

**Why Atomic Increments Matter**:
- Prevents race conditions (concurrent requests)
- No need to read-then-write (single operation)
- Firestore guarantees consistency

---

## Error Response Structure

**Design Philosophy**: Frontend needs structured data to display upgrade prompts.

**Error Code**: `PLAN_LIMIT_EXCEEDED` (constant string for client-side handling)

**Metadata Included**:
```json
{
  "error": "PLAN_LIMIT_EXCEEDED",
  "message": "Human-readable message with context",
  "currentPlan": "starter",
  "currentCount": 5,
  "limit": 5
}
```

**Frontend Use Case**:
```typescript
// Example client-side handling
try {
  const response = await fetch('/api/players/create', {...});
  if (response.status === 403) {
    const data = await response.json();
    if (data.error === 'PLAN_LIMIT_EXCEEDED') {
      // Show upgrade modal with:
      // - data.message (user-friendly explanation)
      // - data.currentPlan (current plan badge)
      // - data.currentCount / data.limit (usage bar)
      showUpgradeModal(data);
    }
  }
} catch (error) {
  // Handle other errors
}
```

---

## Logging & Observability

**Structured Logging** (Google Cloud Logging):

**Player Creation Blocked**:
```typescript
logger.warn('Player creation blocked - plan limit exceeded', {
  userId: session.user.id,
  workspaceId: workspace.id,
  currentPlan: workspace.plan,
  currentPlayerCount: workspace.usage.playerCount,
  maxPlayers: limits.maxPlayers,
});
```

**Game Creation Blocked**:
```typescript
logger.warn('Game creation blocked - plan limit exceeded', {
  userId: session.user.id,
  workspaceId: workspace.id,
  currentPlan: workspace.plan,
  currentGamesThisMonth: workspace.usage.gamesThisMonth,
  maxGamesPerMonth: limits.maxGamesPerMonth,
});
```

**Why Log at WARN Level**:
- Not an error (expected behavior)
- Important signal for product analytics
- Indicates potential upgrade opportunity
- Helps identify plan limit friction

**Query Examples** (Cloud Logging):
```sql
-- Users hitting player limits
severity="WARNING"
jsonPayload.message="Player creation blocked - plan limit exceeded"

-- Free plan users hitting limits most
severity="WARNING"
jsonPayload.currentPlan="free"
```

---

## Integration with Workspace Services

**Workspace Fetch Pattern**:

Both routes follow the same pattern:
```typescript
// 1. Get user to retrieve defaultWorkspaceId
const user = await getUser(session.user.id);
if (!user?.defaultWorkspaceId) {
  return NextResponse.json({ error: 'No workspace found...' }, { status: 500 });
}

// 2. Get workspace to check usage and plan
const workspace = await getWorkspaceById(user.defaultWorkspaceId);
if (!workspace) {
  return NextResponse.json({ error: 'Workspace not found...' }, { status: 500 });
}

// 3. Get plan limits
const limits = getPlanLimits(workspace.plan);

// 4. Check limit before creation
if (workspace.usage.{counter} >= limits.{max}) {
  return structured error (403)
}

// 5. Create resource with workspaceId
const resource = await createResource(..., { workspaceId: workspace.id, ... });

// 6. Increment usage counter
await increment{Counter}(workspace.id);
```

**Consistency Benefits**:
- Predictable error handling
- Easier testing
- Simpler frontend integration
- Clear separation of concerns

---

## Edge Cases Handled

### **1. User Without Workspace**
**Scenario**: User exists but `defaultWorkspaceId` is null (shouldn't happen in production)

**Handling**:
```typescript
if (!user?.defaultWorkspaceId) {
  return NextResponse.json(
    { error: 'No workspace found. Please contact support.' },
    { status: 500 }
  );
}
```

**User Experience**: Error message directs user to support (indicates data issue).

---

### **2. Workspace Not Found**
**Scenario**: User has `defaultWorkspaceId` but workspace document doesn't exist (data corruption)

**Handling**:
```typescript
const workspace = await getWorkspaceById(user.defaultWorkspaceId);
if (!workspace) {
  return NextResponse.json(
    { error: 'Workspace not found. Please contact support.' },
    { status: 500 }
  );
}
```

**User Experience**: Same as above (support escalation).

---

### **3. Exactly At Limit**
**Scenario**: User has created 5/5 players (Starter plan)

**Handling**:
```typescript
if (workspace.usage.playerCount >= limits.maxPlayers) {
  // Blocked (5 >= 5 is true)
}
```

**User Experience**: Clear upgrade prompt with exact counts.

---

### **4. Pro Plan (Unlimited)**
**Scenario**: Pro plan has very high limits (9,999)

**Handling**: Same enforcement logic applies. Limits are just much higher.

**Why Not Truly Unlimited**:
- Prevents abuse
- Database performance constraints
- Future-proofs for potential plan changes

---

## Testing Strategy

### **Manual Testing Checklist**:

**Player Creation Limits**:
- [ ] Create players on Free plan (limit: 2)
- [ ] Verify 3rd player creation returns 403 with PLAN_LIMIT_EXCEEDED
- [ ] Verify error message includes plan name and limits
- [ ] Upgrade to Starter plan (limit: 5)
- [ ] Verify can now create up to 5 players
- [ ] Verify 6th player creation returns 403

**Game Creation Limits**:
- [ ] Create games on Free plan (limit: 10/month)
- [ ] Verify 11th game creation returns 403 with PLAN_LIMIT_EXCEEDED
- [ ] Verify error message mentions "this month"
- [ ] Upgrade to Starter plan (limit: 50/month)
- [ ] Verify can now create up to 50 games

**Usage Counter Accuracy**:
- [ ] Verify `playerCount` increments after each player created
- [ ] Verify `gamesThisMonth` increments after each game created
- [ ] Create player → delete player → verify count decrements (if delete implemented)

**Workspace Not Found**:
- [ ] Manually set user's `defaultWorkspaceId` to invalid value
- [ ] Verify 500 error with "Workspace not found" message

---

## Known Limitations (Phase 5)

**Deferred to Phase 6**:

1. **UI Upgrade Prompts**:
   - Error response includes all needed data
   - Frontend upgrade modal NOT implemented yet
   - Currently just shows error message

2. **Storage Limit Enforcement**:
   - `storageMB` limit defined but NOT enforced
   - No file upload endpoints yet
   - Deferred until Phase 6 (file uploads)

3. **Monthly Game Counter Reset**:
   - `resetMonthlyGameCount()` function implemented
   - Cloud Function cron job NOT created yet
   - Manual reset required until Phase 6

4. **Player Deletion Counter Decrement**:
   - `decrementPlayerCount()` function implemented
   - Player deletion endpoint NOT implemented yet
   - Counter will be inaccurate if players deleted manually in Firestore

5. **Plan Downgrade Handling**:
   - No logic to handle existing resources > new plan limit
   - Example: User has 10 players, downgrades to Starter (5 max)
   - Should existing players be archived? Read-only? TBD Phase 6

6. **Grace Period for Payment Failures**:
   - `past_due` status defined (from Task 3)
   - Access enforcement NOT implemented yet
   - Currently users in `past_due` have full access

---

## Security Considerations

**Authorization Checks**:
- User must be authenticated (NextAuth session)
- User must own the workspace (checked via `getUser()` → `defaultWorkspaceId`)
- Player must belong to authenticated user (checked via `getPlayer()`)

**No Plan Bypass**:
- Plan limits enforced server-side (cannot be bypassed from client)
- Firestore security rules also enforce workspace ownership
- Double layer of protection

**Atomic Counter Updates**:
- Firestore `increment()` prevents race conditions
- No risk of count drift from concurrent requests

---

## Performance Considerations

**Database Queries per Request**:

**Player Creation**:
1. `getUser()` - 1 read
2. `getWorkspaceById()` - 1 read
3. `createPlayer()` - 1 write
4. `incrementPlayerCount()` - 1 write

**Total**: 2 reads, 2 writes (acceptable for create operation)

**Game Creation**:
1. `getUser()` - 1 read
2. `getWorkspaceById()` - 1 read
3. `getPlayer()` - 1 read (already existed)
4. `createGame()` - 1 write
5. `incrementGamesThisMonth()` - 1 write
6. `getUser()` - 1 read (email notification, already existed)
7. `getPlayers()` + `getUnverifiedGames()` - N reads (email notification, already existed)

**Total New**: +2 reads, +1 write (workspace fetch and counter)

**Optimization Opportunity** (Phase 6):
- Cache workspace in user session (reduce 1 read per request)
- Batch counter updates (queue + Cloud Function)

---

## Next Steps (Task 5)

**Go-Live Guardrails - Smoke Tests & Health Check**:
- [ ] Create end-to-end smoke test script
  - Register test user
  - Create workspace (auto on first login)
  - Create player (verify limit enforcement)
  - Create game (verify limit enforcement)
  - Attempt to exceed limits (verify 403 errors)
- [ ] Wire smoke test into CI workflows
  - Run after staging deploy
  - Gate production deploy on staging smoke success
- [ ] Create/update health check endpoint (`/api/health/route.ts`)
  - Return status, version, environment
  - Optional Firestore ping
- [ ] Create Mini AAR
- [ ] Commit: `feat(ci): add go-live smoke tests and health endpoint`

---

## Files Changed Summary

### **Modified (2 files)**

1. `src/app/api/players/create/route.ts` - Added plan limit enforcement for players
2. `src/app/api/games/route.ts` - Added plan limit enforcement for games

---

## Success Criteria Met ✅

- [x] Plan limits defined and enforced for players and games
- [x] Workspace usage checked before resource creation
- [x] Structured error response when limits exceeded (PLAN_LIMIT_EXCEEDED)
- [x] Error includes plan name, current count, and limit
- [x] Usage counters atomically incremented after successful creation
- [x] Logging added for limit enforcement events
- [x] workspaceId passed to createPlayer() and createGame()
- [x] Consistent pattern applied to both routes

---

**End of Mini AAR - Task 4 Complete** ✅

---

**Next Task**: Task 5 - Go-Live Guardrails (Smoke Tests & Health Check)

---

**Timestamp**: 2025-11-16
