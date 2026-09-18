# Plan Limit Warnings & Usage Indicators Reference

**Type**: Reference
**Phase**: 7 Task 5
**Created**: 2025-11-16
**Component**: Billing & Usage Monitoring
**Status**: Complete

---

## Overview

This document provides a reference for the plan limit warning system and usage indicators implemented in Phase 7 Task 5. This system provides users with clear visibility into how close they are to plan limits and displays warning banners BEFORE hitting enforcement.

## Purpose

- **Inform users** about their current usage relative to plan limits
- **Prevent surprises** by showing warnings before limits are reached
- **Encourage upgrades** through clear visibility of limits
- **Non-blocking** - purely informational, no enforcement or redirects

---

## Plan Limits Matrix

### Plan Tier Definitions

| Plan    | Player Limit | Games/Month Limit | Price   |
|---------|-------------|-------------------|---------|
| Free    | 1           | 5                 | $0      |
| Starter | 3           | 20                | $9      |
| Pro     | 10          | 200               | $29     |
| Elite   | ∞           | ∞                 | $79     |

### State Threshold Definitions

Plan limits are evaluated using three states based on usage percentage:

| State    | Threshold   | UI Treatment        | Meaning                          |
|----------|------------|---------------------|----------------------------------|
| `ok`     | < 70%      | Green indicator     | Normal operation, ample headroom |
| `warning`| 70-99%     | Yellow banner/dot   | Approaching limit, consider upgrade |
| `critical`| ≥ 100%    | Red banner/dot      | Limit reached, upgrade required |

**Calculation Formula:**
```typescript
percentage = used / limit

if (percentage >= 1.0) → critical
else if (percentage >= 0.7) → warning
else → ok
```

**Special Cases:**
- **Elite plan**: Always returns `ok` (infinite limits)
- **Zero limit**: If limit is 0, any usage > 0 is `critical`
- **Missing data**: Defaults to 0 usage (state = `ok`)

---

## Implementation Architecture

### Core Utility: `plan-limits.ts`

**Location**: `src/lib/billing/plan-limits.ts`

#### Main Function: `evaluatePlanLimits(workspace)`

**Input**: Workspace object with plan and usage fields
**Output**: PlanLimits object with state for players and games

```typescript
interface PlanLimits {
  player: {
    used: number;        // Current player count
    limit: number;       // Plan's player limit
    state: LimitState;   // 'ok' | 'warning' | 'critical'
  };
  games: {
    used: number;        // Games logged this month
    limit: number;       // Plan's monthly game limit
    state: LimitState;   // 'ok' | 'warning' | 'critical'
  };
}
```

**Usage Example**:
```typescript
import { evaluatePlanLimits } from '@/lib/billing/plan-limits';

const workspace = await getWorkspaceById(workspaceId);
const limits = evaluatePlanLimits(workspace);

if (limits.player.state === 'critical') {
  // Show critical warning for players
}
```

#### Helper Functions

1. **`getLimitStateColor(state)`**
   - Maps state to UI color
   - Returns: `'green'` | `'yellow'` | `'red'`

2. **`formatLimit(limit)`**
   - Formats limit for display
   - Infinity → `'∞'`
   - Finite number → string representation

3. **`getLimitWarningMessage(resourceType, state)`**
   - Returns user-friendly warning message
   - `resourceType`: `'player'` | `'games'`
   - Returns `null` for `ok` state
   - Returns context-specific message for `warning` or `critical`

---

## UI Integration

### Dashboard Page (`/dashboard`)

**Warnings Display**: Banners shown above stats cards

**Implementation**:
```typescript
// Server component fetches workspace and evaluates limits
const limits = evaluatePlanLimits(workspace);

// Conditional rendering in JSX
{limits && (
  <>
    {limits.player.state !== 'ok' && (
      <div className={warningClass}>
        <AlertTriangle />
        <p>{getLimitWarningMessage('player', limits.player.state)}</p>
        <Link href="/dashboard/billing/change-plan">Upgrade Plan</Link>
      </div>
    )}
    {/* Similar for games */}
  </>
)}
```

**Warning Banner Features**:
- **Yellow background** for `warning` state
- **Red background** for `critical` state
- **AlertTriangle icon** for visual emphasis
- **Usage counter** (e.g., "1 of 3 players used")
- **Upgrade link** to plan change page

### Billing Page (`/dashboard/billing`)

**Plan Usage Overview Card**: Displays current usage with color-coded indicators

**Features**:
- **Resource indicators**: Players and Games This Month
- **Color-coded dots**: Green/Yellow/Red based on state
- **Usage counters**: "X of Y used" (shows ∞ for elite)
- **Upgrade note**: Shown when any resource is `critical`

**Implementation**:
```typescript
// Server component evaluates limits
const limits = evaluatePlanLimits(workspace);

// Render usage overview
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${stateColor}`} />
      <div>
        <p>Players</p>
        <p>{limits.player.used} of {formatLimit(limits.player.limit)} used</p>
      </div>
    </div>
    {limits.player.state === 'critical' && (
      <p className="text-xs text-red-600">Limit reached</p>
    )}
  </div>
  {/* Similar for games */}
</div>
```

---

## Testing Strategy

### Test Coverage

**Location**: `src/lib/billing/plan-limits.test.ts`

**Test Suites**:
1. **evaluatePlanLimits** - 16 tests
   - Correct limits for each plan
   - State thresholds (ok, warning, critical)
   - Edge cases (missing data, invalid plan, zero limits)
2. **getLimitStateColor** - 4 tests
3. **formatLimit** - 3 tests
4. **getLimitWarningMessage** - 6 tests
5. **Integration tests** - 1 test (multiple scenarios)

**Total**: 30 tests

### Key Test Scenarios

```typescript
// Free plan at limit
createMockWorkspace('free', 1, 5); // critical for both

// Starter plan warning threshold
createMockWorkspace('starter', 3, 14); // critical player, warning games

// Pro plan approaching limit
createMockWorkspace('pro', 8, 150); // warning for both

// Elite plan always ok
createMockWorkspace('elite', 999, 9999); // ok for both
```

### Running Tests

```bash
# Run plan-limits tests only
npx vitest run src/lib/billing/plan-limits.test.ts

# Run all billing tests
npx vitest run src/lib/billing/

# Run with coverage
npx vitest run --coverage src/lib/billing/plan-limits.test.ts
```

---

## User Experience Flow

### Normal Usage (< 70% of limit)

1. User logs games and adds players
2. Dashboard shows no warnings
3. Billing page shows green dots for both resources
4. User continues normal operation

### Approaching Limit (70-99%)

1. User reaches 70% of player or game limit
2. **Dashboard**: Yellow warning banner appears above stats
   - "You are approaching your player limit."
   - Shows usage counter: "2 of 3 players used"
   - Provides "Upgrade Plan" link
3. **Billing page**: Yellow dot appears in usage overview
4. User is gently encouraged to upgrade

### At Limit (100%+)

1. User reaches or exceeds limit
2. **Dashboard**: Red critical banner appears
   - "Player limit reached. Upgrade your plan to continue adding athletes."
   - Shows usage counter: "3 of 3 players used"
   - Provides "Upgrade Plan" link
3. **Billing page**: Red dot + "Limit reached" text
   - Upgrade note shown at bottom of card
4. User sees clear call to action to upgrade

**Important**: This is **informational only** - no blocking or enforcement at this stage.

---

## State Matrix Examples

### Free Plan Scenarios

| Players | Games | Player State | Games State | Dashboard Banner |
|---------|-------|--------------|-------------|------------------|
| 0       | 0     | ok (0%)      | ok (0%)     | None             |
| 0       | 3     | ok (0%)      | ok (60%)    | None             |
| 0       | 4     | ok (0%)      | warning (80%)| Yellow (games)  |
| 1       | 5     | critical (100%)| critical (100%)| Red (both)    |

### Starter Plan Scenarios

| Players | Games | Player State | Games State | Dashboard Banner |
|---------|-------|--------------|-------------|------------------|
| 1       | 10    | ok (33%)     | ok (50%)    | None             |
| 2       | 14    | ok (67%)     | warning (70%)| Yellow (games)  |
| 3       | 20    | critical (100%)| critical (100%)| Red (both)    |

### Pro Plan Scenarios

| Players | Games | Player State | Games State | Dashboard Banner |
|---------|-------|--------------|-------------|------------------|
| 5       | 100   | ok (50%)     | ok (50%)    | None             |
| 7       | 140   | warning (70%)| warning (70%)| Yellow (both)   |
| 10      | 200   | critical (100%)| critical (100%)| Red (both)    |

### Elite Plan

| Players | Games | Player State | Games State | Dashboard Banner |
|---------|-------|--------------|-------------|------------------|
| Any     | Any   | ok (∞)       | ok (∞)      | None             |

---

## Integration Points

### Data Sources

1. **Workspace Document** (Firestore)
   - `workspace.plan` - Current plan tier
   - `workspace.usage.playerCount` - Total players
   - `workspace.usage.gamesThisMonth` - Games logged this month

2. **Server Loaders**
   - Dashboard page: Fetches workspace, evaluates limits
   - Billing page: Fetches workspace, evaluates limits

### No New API Routes

This feature uses existing data fetching patterns:
- Server components fetch workspace via `adminDb`
- No new API endpoints required
- No client-side data fetching

---

## Future Enhancements (Out of Scope for Task 5)

### Phase 8 Potential Additions

1. **Usage Charts**: Visual progress bars or graphs
2. **Historical Trends**: Usage over time
3. **Predictive Warnings**: "At current rate, you'll reach limit in X days"
4. **Email Notifications**: Alert users when approaching limits
5. **Grace Period**: Allow slight overages with time-limited warnings

### Not Implemented

- **Hard Enforcement**: Blocking operations when limit reached (handled in other phases)
- **Automatic Upgrades**: Suggesting specific plans based on usage
- **Custom Alerts**: User-configurable warning thresholds
- **Storage Limits**: File/media storage tracking (Phase 6 Task 5)

---

## Troubleshooting

### Common Issues

**Issue**: Warning not showing despite being at limit
- **Check**: Workspace usage counters are updated correctly
- **Verify**: `workspace.usage.playerCount` and `gamesThisMonth` in Firestore
- **Debug**: Console log `limits` object in server component

**Issue**: Elite plan showing warnings
- **Root Cause**: Should never happen (elite limits are Infinity)
- **Check**: `workspace.plan === 'elite'`
- **Fix**: Verify plan update logic in plan change flow

**Issue**: Colors not displaying correctly
- **Check**: Tailwind classes are valid
- **Verify**: `getLimitStateColor()` returns correct color
- **Fix**: Ensure conditional className logic is correct

### Debugging

```typescript
// Add to server component
console.log('Workspace:', workspace.id, workspace.plan);
console.log('Usage:', workspace.usage);
console.log('Limits:', limits);
```

---

## Related Documentation

- **Phase 7 Task 3**: `6772-REF-hustle-plan-change-flow.md` - Self-service plan changes
- **Phase 7 Task 4**: `6773-REF-hustle-billing-portal-and-invoices.md` - Billing management
- **Phase 6 Task 1**: `000-docs/XXX-REF-workspace-enforcement.md` - Hard enforcement logic
- **CLAUDE.md**: Project-level documentation

---

## Changelog

### 2025-11-16 - Initial Implementation
- Created `plan-limits.ts` utility
- Added warning banners to dashboard
- Added usage indicators to billing page
- Wrote comprehensive test suite (30 tests)
- Documented threshold logic and UI patterns

---

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Author**: Claude (Phase 7 Task 5)
