# Phase 7 Task 2: UI Enforcement Hooks (Client Gatekeeper) - Mini AAR

**Timestamp**: 2025-11-16
**Phase**: Phase 7 - Access Enforcement & Subscription Compliance
**Task**: Task 2 - UI Enforcement Hooks (Client Gatekeeper)
**Status**: ✅ COMPLETE

---

## Overview

Created React hook `useWorkspaceAccess()` for client-side subscription enforcement and trial warning banner component for dashboard integration.

---

## Implementation Summary

### **Components Created**

1. **useWorkspaceAccess Hook** - `src/hooks/useWorkspaceAccess.ts`
2. **Current Workspace API** - `src/app/api/workspace/current/route.ts`
3. **Trial Warning Banner** - `src/components/TrialWarningBanner.tsx`

---

## useWorkspaceAccess Hook

**File**: `src/hooks/useWorkspaceAccess.ts`

### **Purpose**

Client-side React hook that:
- Fetches workspace subscription data
- Computes access permissions
- Redirects to `/billing` if subscription inactive
- Shows trial warning if expiring soon

### **Return Values**

```typescript
interface WorkspaceAccess {
  // Loading states
  loading: boolean;
  error: string | null;

  // Workspace data
  workspaceId: string | null;
  plan: string | null;
  status: WorkspaceStatus | null;

  // Access permissions
  canRead: boolean;
  canWrite: boolean;
  canCreatePlayers: boolean;
  canCreateGames: boolean;
  canUpload: boolean;

  // Billing info
  isActive: boolean;
  isTrial: boolean;
  isPastDue: boolean;
  isCanceled: boolean;
  isSuspended: boolean;
  currentPeriodEnd: Date | null;

  // Trial warnings
  trialEndsIn: number | null;        // Days until trial ends
  showTrialWarning: boolean;         // True if trial ends in <= 3 days

  // Actions
  refresh: () => Promise<void>;
}
```

### **Access Rules (Client-Side Mirror)**

Mirrors server-side rules from `access-control.ts`:

| Status      | canRead | canWrite |
|-------------|---------|----------|
| `active`    | ✅      | ✅       |
| `trial`     | ✅      | ✅       |
| `past_due`  | ✅      | ❌       |
| `canceled`  | ❌      | ❌       |
| `suspended` | ❌      | ❌       |
| `deleted`   | ❌      | ❌       |

### **Usage Example 1: Paywall Check**

```typescript
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { PaywallNotice } from '@/components/PaywallNotice';

function PlayerList() {
  const access = useWorkspaceAccess();

  if (access.loading) {
    return <LoadingSpinner />;
  }

  if (!access.canCreatePlayers) {
    return (
      <PaywallNotice
        feature="Player Management"
        currentPlan={access.plan || 'free'}
      />
    );
  }

  return <PlayerTable />;
}
```

### **Usage Example 2: Conditional UI**

```typescript
function Dashboard() {
  const access = useWorkspaceAccess();

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Show upgrade prompt if trial */}
      {access.isTrial && (
        <div className="bg-blue-50 p-4 rounded">
          <p>Trial ends in {access.trialEndsIn} days</p>
          <Link href="/billing">Upgrade Now</Link>
        </div>
      )}

      {/* Disable "Add Player" button if no write access */}
      <button disabled={!access.canCreatePlayers}>
        Add Player
      </button>
    </div>
  );
}
```

### **Usage Example 3: Auto-Redirect to Billing**

```typescript
function SettingsPage() {
  // Redirect to /billing if subscription canceled
  const access = useWorkspaceAccess({ redirectOnInactive: true });

  // If subscription active, show settings
  return <SettingsForm />;
}
```

---

## Current Workspace API

**File**: `src/app/api/workspace/current/route.ts`

### **Endpoint**

```
GET /api/workspace/current
```

### **Purpose**

Returns current user's default workspace data for client-side access checks.

### **Response (Success)**

```json
{
  "success": true,
  "workspace": {
    "id": "ws_abc123",
    "name": "Johnson Family Stats",
    "plan": "starter",
    "status": "active",
    "billing": {
      "currentPeriodEnd": "2025-12-16T00:00:00.000Z"
    },
    "usage": {
      "playerCount": 3,
      "gamesThisMonth": 12,
      "storageUsedMB": 45
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-11-16T00:00:00.000Z"
  }
}
```

### **Security**

- ✅ Requires authentication (middleware enforced)
- ✅ Only exposes client-safe fields
- ❌ Does NOT expose Stripe customer ID
- ❌ Does NOT expose Stripe subscription ID

### **Error Responses**

**401 Unauthorized:**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

**404 No Workspace:**
```json
{
  "error": "NO_WORKSPACE",
  "message": "User has no default workspace"
}
```

---

## Trial Warning Banner

**File**: `src/components/TrialWarningBanner.tsx`

### **Purpose**

Top-banner component that warns users when their trial is expiring soon.

### **Display Logic**

- Show if: `isTrial && trialEndsIn <= 3 days`
- Hide if: Loading, error, not trial, or dismissed

### **Urgency Levels**

| Days Remaining | Background | Message                            |
|----------------|------------|------------------------------------|
| 0              | Red        | "Your trial expires today!"        |
| 1              | Red        | "Your trial expires tomorrow!"     |
| 2-3            | Yellow     | "Your trial expires in X days"     |

### **UI Features**

- Sticky top position (`sticky top-0 z-50`)
- Warning icon (red for urgent, yellow for caution)
- "Upgrade Now" CTA button (links to `/billing`)
- Dismiss button (hides banner for session)

### **Example Appearance**

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Your trial expires in 2 days                           │
│     Upgrade now to continue tracking your player stats...  │
│                                           [Upgrade Now] [✕] │
└─────────────────────────────────────────────────────────────┘
```

### **Integration (Dashboard Layout)**

```typescript
// src/app/dashboard/layout.tsx

import { TrialWarningBanner } from '@/components/TrialWarningBanner';

export default function DashboardLayout({ children }) {
  return (
    <div>
      <TrialWarningBanner />
      <Header />
      <main>{children}</main>
    </div>
  );
}
```

---

## Trial Days Calculation

**Algorithm:**

```typescript
function calculateTrialDaysRemaining(currentPeriodEnd: string | null): number | null {
  if (!currentPeriodEnd) return null;

  const endDate = new Date(currentPeriodEnd);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}
```

**Why `Math.ceil()`?**
- User-friendly: "1 day left" is better than "0.8 days left"
- Urgency: Shows "0 days" only on expiration day

---

## Client-Server Consistency

**Server-Side** (API routes):
- Uses `requireWorkspaceWriteAccess()` (Task 1)
- Blocks requests with 403 Forbidden
- Returns structured error codes

**Client-Side** (React hooks):
- Uses `useWorkspaceAccess()`
- Hides UI elements before user tries
- Redirects to `/billing` when needed

**Why Both?**
- Server-side: Security enforcement (cannot be bypassed)
- Client-side: Better UX (no failed requests, clear messaging)

---

## Next Steps (Task 3)

- Create `PaywallNotice` component for locked features
- Integrate paywall into player creation, game creation, analytics
- Add upgrade CTAs to locked features

---

## Files Created

1. `src/hooks/useWorkspaceAccess.ts` - Client-side access hook
2. `src/app/api/workspace/current/route.ts` - Workspace data API
3. `src/components/TrialWarningBanner.tsx` - Trial expiration banner
4. `000-docs/219-AA-MAAR-hustle-phase7-task2-ui-access-hooks.md` - This AAR

---

## Success Criteria Met ✅

- [x] React hook created (`useWorkspaceAccess`)
- [x] Hook fetches workspace data from API
- [x] Hook computes access permissions (canCreatePlayers, canCreateGames, etc.)
- [x] Hook supports auto-redirect to `/billing`
- [x] Trial warning logic implemented (showTrialWarning when <= 3 days)
- [x] Trial days calculation accurate
- [x] Trial warning banner component created
- [x] Banner shows urgency levels (red/yellow)
- [x] Banner dismissible by user
- [x] Current workspace API endpoint created
- [x] API endpoint secured (auth required)
- [x] Client-safe fields only (no Stripe IDs exposed)
- [x] Documentation complete

---

**End of Mini AAR - Task 2 Complete** ✅

---

**Timestamp**: 2025-11-16
