# Hustle Workspace Health Dashboard Canonical Reference

**Document Type**: Reference (REF)
**Number**: 6771 (Canonical Reference Series)
**Phase**: Phase 7 - Customer Experience & Revenue Stabilization
**Created**: 2025-11-16
**Last Updated**: 2025-11-16
**Owner**: Platform Team

---

## Overview

The **Workspace Health Dashboard** provides customers with a comprehensive view of their workspace status, billing information, usage metrics, and sync status. This customer-facing interface enables users to monitor their account health, identify issues, and take corrective actions without contacting support.

**Purpose**: Transparency and self-service diagnostics for workspace health

**Location**: `/dashboard/health`

---

## Full Data Model

### WorkspaceHealthData Interface

```typescript
interface WorkspaceHealthData {
  workspace: {
    id: string;
    status: WorkspaceStatus;
    plan: WorkspacePlan;
    currentPeriodEnd: string | null; // ISO date string
    nextBillingAction: 'none' | 'update_payment' | 'reactivate' | 'contact_support';
    usage: {
      players: number;
      games: number;
      pendingVerifications: number;
    };
    sync: {
      stripeLastSyncAt: string | null; // ISO date string
      firestoreLastUpdateAt: string; // ISO date string
    };
    emailVerified: boolean;
  };
}
```

---

## Data Sources (Source of Truth)

### 1. Workspace ID

**Source**: Firestore `/workspaces/{workspaceId}`

**Field**: Document ID

**Type**: `string`

**Description**: Unique identifier for workspace document

**Use Case**: Links to workspace document in Firestore Console

---

### 2. Workspace Status

**Source**: Firestore `/workspaces/{workspaceId}/status`

**Field**: `status`

**Type**: `'active' | 'trial' | 'past_due' | 'canceled' | 'suspended' | 'deleted'`

**Description**: Current lifecycle status of workspace

**Updated By**:
- Stripe webhook (`customer.subscription.updated`, `customer.subscription.deleted`)
- Admin operations (suspend, delete)
- Onboarding flow (trial → active)

**Enforcement**: See `000-docs/6768-REF-hustle-workspace-status-enforcement.md`

---

### 3. Workspace Plan

**Source**: Firestore `/workspaces/{workspaceId}/plan`

**Field**: `plan`

**Type**: `'free' | 'starter' | 'plus' | 'pro'`

**Description**: Current subscription tier

**Updated By**:
- Stripe webhook (`checkout.session.completed`, `customer.subscription.updated`)
- Plan upgrade/downgrade flow (Phase 7 Task 3)

**Mapping**: See `000-docs/6769-REF-hustle-runtime-and-billing-canonical.md` (Plan Limits table)

---

### 4. Current Period End

**Source**: Firestore `/workspaces/{workspaceId}/billing/currentPeriodEnd`

**Field**: `billing.currentPeriodEnd`

**Type**: `Timestamp | null`

**Description**: Billing cycle end date (grace period boundary for canceled workspaces)

**Updated By**:
- Stripe webhook (`customer.subscription.updated`, `invoice.payment_succeeded`)

**Format**: ISO 8601 date string (e.g., `2025-12-15T00:00:00Z`)

**Null Value**: No Stripe subscription (free/trial plan)

---

### 5. Next Billing Action

**Source**: Calculated from `workspace.status`

**Field**: Computed

**Type**: `'none' | 'update_payment' | 'reactivate' | 'contact_support'`

**Description**: Recommended action for user based on current status

**Logic**:
```typescript
function getNextBillingAction(status: WorkspaceStatus): string {
  switch (status) {
    case 'active':
    case 'trial':
      return 'none';
    case 'past_due':
      return 'update_payment';
    case 'canceled':
      return 'reactivate';
    case 'suspended':
    case 'deleted':
      return 'contact_support';
    default:
      return 'none';
  }
}
```

---

### 6. Usage: Players

**Source**: Firestore `/workspaces/{workspaceId}/usage/playerCount`

**Field**: `usage.playerCount`

**Type**: `number`

**Description**: Total active players in workspace (denormalized counter)

**Updated By**:
- `/api/players/create` (increment)
- `/api/players/delete` (decrement)

**Validation**: Checked against plan limits before player creation

**Accuracy**: Denormalized for performance (may drift if operations fail mid-transaction)

---

### 7. Usage: Games This Month

**Source**: Firestore `/workspaces/{workspaceId}/usage/gamesThisMonth`

**Field**: `usage.gamesThisMonth`

**Type**: `number`

**Description**: Total games logged this billing cycle (denormalized counter)

**Updated By**:
- `/api/games` (increment on creation)
- Scheduled Cloud Function (reset monthly)

**Reset Frequency**: Monthly (on billing cycle start)

**Validation**: Checked against plan limits before game creation

---

### 8. Usage: Pending Verifications

**Source**: Firestore subcollection query

**Collection**: `/users/{userId}/players/{playerId}/games/{gameId}`

**Query**: `where('verified', '==', false).count()`

**Type**: `number`

**Description**: Total unverified games across all players (requires parent verification)

**Updated By**:
- `/api/games` (creates unverified game by default)
- Verification flow (sets `verified: true`)

**Aggregation**: Counted across all players in workspace (collection group query via Admin SDK)

**Performance**: Cached for 1 minute to reduce query load

---

### 9. Sync: Stripe Last Sync At

**Source**: Stripe API

**Method**: `stripe.subscriptions.list({ customer: customerId })`

**Field**: `subscription.created` (timestamp)

**Type**: `string | null` (ISO date string)

**Description**: When Stripe subscription was created (proxy for last sync)

**Null Value**: No Stripe customer (free/trial plan)

**Purpose**: Detect billing sync issues (compare with Firestore `updatedAt`)

---

### 10. Sync: Firestore Last Update At

**Source**: Firestore `/workspaces/{workspaceId}/updatedAt`

**Field**: `updatedAt`

**Type**: `Timestamp`

**Description**: When workspace document was last updated

**Updated By**: All workspace update operations (auto-set via `serverTimestamp()`)

**Format**: ISO 8601 date string

**Purpose**: Detect billing sync issues (compare with Stripe timestamp)

---

### 11. Email Verified

**Source**: Firebase Authentication

**Method**: `getDashboardUser().emailVerified`

**Type**: `boolean`

**Description**: Whether user's email address is verified

**Updated By**:
- Email verification flow (`/verify-email`)
- Firebase Auth (`sendEmailVerification()`)

**Purpose**: Identify users who haven't verified email (may affect account recovery)

---

## Stripe/Firestore Sync Validation Logic

### Sync Health Indicator

**Purpose**: Detect if Stripe and Firestore are out of sync (webhook processing delays or failures)

**Algorithm**:
```typescript
function getSyncHealth(stripeLastSync: string | null, firestoreLastUpdate: string): SyncHealth {
  // No Stripe customer = N/A (free plan)
  if (!stripeLastSync) {
    return 'N/A';
  }

  // Calculate time difference in minutes
  const diffMinutes = Math.abs(
    new Date(firestoreLastUpdate).getTime() - new Date(stripeLastSync).getTime()
  ) / (1000 * 60);

  // Healthy: Within 5 minutes
  if (diffMinutes < 5) {
    return 'healthy';
  }

  // Warning: 5-60 minutes
  if (diffMinutes < 60) {
    return 'delayed';
  }

  // Error: More than 1 hour
  return 'out_of_sync';
}
```

**UI Display**:
- **Healthy**: ✓ Green badge "Billing sync healthy"
- **Delayed**: ⚠ Yellow badge "Billing sync delayed (X minutes)"
- **Out of Sync**: ⚠ Red badge "Billing sync issue (contact support)"
- **N/A**: ℹ️ Gray badge "No Stripe subscription (free plan)"

### Sync Issue Root Causes

**Possible Causes**:
1. **Webhook delivery failure**: Stripe sent event but Cloud Run was down
2. **Webhook processing error**: Cloud Run received event but handler threw error
3. **Firestore write failure**: Handler ran but Firestore update failed
4. **Subscription created outside app**: Stripe subscription created manually in Dashboard

**Diagnosis Steps** (see Troubleshooting Flow below)

---

## Troubleshooting Flow

### Issue: Status shows "Past Due" but user claims payment succeeded

**Diagnosis Steps**:

1. **Check Stripe Dashboard**:
   - Go to: https://dashboard.stripe.com/customers/{customerId}
   - Verify: Subscription status is "Active"
   - Check: Recent invoices show payment succeeded
   - Result: If Stripe shows "Active" but Firestore shows "Past Due", webhook sync issue

2. **Check webhook events**:
   - Go to: Developers → Events → Filter by customer ID
   - Find: `invoice.payment_succeeded` event
   - Check: Event was sent successfully (200 OK response)
   - Result: If event failed (4xx/5xx), webhook delivery issue

3. **Check Cloud Logging**:
   ```bash
   gcloud logging read 'resource.type="cloud_run_revision"
     severity>=ERROR
     jsonPayload.path="/api/billing/webhook"'
     --limit=50 --format=json
   ```
   - Look for: Errors related to `invoice.payment_succeeded`
   - Result: If errors found, webhook processing issue

4. **Manual Resync** (if needed):
   - Option 1: Trigger webhook retry in Stripe Dashboard
   - Option 2: Manually update Firestore workspace status (admin operation)
   - Option 3: Contact support to investigate

**Expected Resolution Time**: 5-10 minutes (webhook retry) or immediate (manual update)

---

### Issue: Sync status shows "out_of_sync"

**Diagnosis Steps**:

1. **Check timestamp difference**:
   - Stripe Last Sync: `2025-11-15T10:00:00Z`
   - Firestore Last Update: `2025-11-15T08:00:00Z`
   - Difference: 2 hours (exceeds 1 hour threshold)

2. **Check recent Stripe events**:
   - Go to: Developers → Events → Last 24 hours
   - Look for: `customer.subscription.updated` events
   - Check: Were events sent successfully?

3. **Check webhook endpoint health**:
   - Go to: Cloud Run → hustle-production → Logs
   - Filter: `jsonPayload.path="/api/billing/webhook"`
   - Check: Are webhooks being received and processed?

4. **Verify webhook secret**:
   - Check: `STRIPE_WEBHOOK_SECRET` env var matches Stripe Dashboard
   - Result: If mismatch, webhooks will fail signature verification

5. **Manual Fix**:
   - Trigger `customer.subscription.updated` webhook manually
   - OR update `workspace.updatedAt` via Firestore Console (temporary fix)

**Expected Resolution Time**: Immediate (manual fix) or 1-2 hours (webhook backlog clears)

---

### Issue: Pending verifications count seems incorrect

**Diagnosis Steps**:

1. **Verify count manually**:
   - Go to: Firestore Console → `/users/{userId}/players`
   - For each player: Count games where `verified == false`
   - Sum: Should match health dashboard count

2. **Check collection group query**:
   ```typescript
   const unverifiedGames = await adminDb
     .collectionGroup('games')
     .where('verified', '==', false)
     .count()
     .get();
   ```
   - Result: Should match manual count

3. **Check for orphaned games**:
   - Games created without `workspaceId` field (old data)
   - Games where player was deleted but games remain

4. **Fix orphaned games**:
   - Run cleanup script (Phase 8: Data Integrity)
   - OR manually delete orphaned games via Firestore Console

**Expected Resolution Time**: Immediate (manual cleanup) or 1-2 hours (automated cleanup script)

---

### Issue: Email verified status incorrect

**Diagnosis Steps**:

1. **Check Firebase Auth**:
   - Go to: Firebase Console → Authentication → Users
   - Find user by email
   - Check: "Email verified" column

2. **Check user object in code**:
   ```typescript
   const user = await getDashboardUser();
   console.log('Email verified:', user.emailVerified);
   ```

3. **Resend verification email** (if needed):
   - User clicks "Resend verification email"
   - OR admin manually marks email as verified in Firebase Console

**Expected Resolution Time**: Immediate (manual update) or 1-5 minutes (user clicks email link)

---

## Component Architecture

### Server-Side Loader

**File**: `src/lib/dashboard/health.ts`

**Function**: `getWorkspaceHealth(): Promise<WorkspaceHealthData | null>`

**Authentication**: Firebase Admin Auth via `getDashboardUser()`

**Data Sources**:
1. Firestore Admin SDK (workspace document)
2. Firestore Admin SDK (count queries for pending verifications)
3. Stripe API (subscription list)
4. Firebase Auth (email verified)

**Error Handling**:
- Returns `null` if user not authenticated
- Throws if workspace not found
- Logs errors but returns default values for optional fields (e.g., pending verifications)

**Caching**: None (fresh data on every request)

**Performance**: ~200-500ms (depends on Stripe API latency)

---

### Client-Side Component

**File**: `src/components/dashboard/health-summary.tsx`

**Component**: `HealthSummary({ data }: { data: WorkspaceHealthData })`

**Rendering**: Client-side React component (marked with `'use client'`)

**Layout**: Stacked cards (4 sections):
1. **Status & Plan**: Status badge, plan tier, email verification, next action
2. **Billing Information**: Current period end, days until renewal, "Manage Billing" button
3. **Usage Metrics**: Players count, games count, pending verifications count
4. **Sync Status**: Stripe last sync, Firestore last update, sync health indicator

**Styling**: Tailwind CSS (minimal, functional design)

**Interactivity**:
- "Manage Billing" button redirects to Stripe Customer Portal (Phase 7 Task 1)
- Sync health indicator shows color-coded badges
- Pending verifications count shows warning icon if >0

---

### Page Component

**File**: `src/app/dashboard/health/page.tsx`

**Type**: Next.js App Router page (server component)

**Flow**:
1. Call `getWorkspaceHealth()` (server-side)
2. If `null`, redirect to `/login`
3. Render `HealthSummary` component with health data

**Metadata**:
- Title: "Workspace Health | Hustle"
- Description: "View workspace status, billing, and usage information"

---

## Security Considerations

### Authentication

**Requirement**: User must be authenticated to access `/dashboard/health`

**Enforcement**: `getDashboardUser()` returns `null` if no session → redirect to `/login`

**Authorization**: Users can only see their own workspace health (no admin view)

---

### Data Privacy

**PII Fields**:
- Email verification status (user's email)
- Stripe customer ID (not displayed, used internally)

**Access Control**:
- Health data scoped to authenticated user's `defaultWorkspaceId`
- No cross-workspace queries allowed

**Logging**:
- Errors logged with workspace ID (no email or PII)
- Stripe API calls logged with customer ID (no card data)

---

### API Rate Limits

**Stripe API**:
- `subscriptions.list()` called once per page load
- Rate limit: 100 requests/second (well below limit)

**Firestore Queries**:
- Workspace read: 1 document read
- Pending verifications: Collection group query (1 query per player)
- Rate limit: No practical limit for dashboard use case

**Optimization**: Add caching if page load exceeds 1 second

---

## Testing Scenarios

### Test Case 1: Active Workspace

**Input**:
- `workspace.status`: `'active'`
- `workspace.plan`: `'pro'`
- `usage.players`: 5
- `usage.games`: 12
- `usage.pendingVerifications`: 0
- `sync.stripeLastSyncAt`: 2 minutes ago
- `emailVerified`: `true`

**Expected Output**:
- Status badge: Green "Active"
- Next billing action: "None"
- "Manage Billing" button visible
- Sync health: Green "Billing sync healthy"
- Pending verifications: 0 (no warning icon)

---

### Test Case 2: Past Due Workspace

**Input**:
- `workspace.status`: `'past_due'`
- `workspace.plan`: `'starter'`
- `currentPeriodEnd`: 5 days in future
- `usage.pendingVerifications`: 3

**Expected Output**:
- Status badge: Yellow "Past Due"
- Next billing action: "Update Payment"
- "Manage Billing" button text: "Update Payment Method"
- Days until renewal: 5
- Pending verifications: 3 (warning icon shown)

---

### Test Case 3: Canceled Workspace (Grace Period)

**Input**:
- `workspace.status`: `'canceled'`
- `currentPeriodEnd`: 10 days in future

**Expected Output**:
- Status badge: Red "Canceled"
- Next billing action: "Reactivate"
- "Manage Billing" button text: "Reactivate Subscription"
- Days until renewal: 10 (grace period countdown)

---

### Test Case 4: Suspended Workspace

**Input**:
- `workspace.status`: `'suspended'`

**Expected Output**:
- Status badge: Red "Suspended"
- Next billing action: "Contact Support"
- "Manage Billing" button visible (but portal won't allow changes)

---

### Test Case 5: Trial Workspace (No Stripe)

**Input**:
- `workspace.status`: `'trial'`
- `sync.stripeLastSyncAt`: `null`

**Expected Output**:
- Status badge: Blue "Trial"
- Sync health: Gray "No Stripe subscription (free plan)"
- "Manage Billing" button: "Manage Billing" (redirects to portal or upgrade page)

---

### Test Case 6: Sync Issue (Out of Sync)

**Input**:
- `sync.stripeLastSyncAt`: 3 hours ago
- `sync.firestoreLastUpdateAt`: Now

**Expected Output**:
- Sync health: Red "Billing sync issue (contact support)"

---

## Performance Metrics

### Page Load Time

**Target**: < 1 second (p95)

**Components**:
- Firestore workspace read: ~50ms
- Pending verifications count: ~100-200ms (depends on player count)
- Stripe API call: ~100-300ms
- React rendering: ~50ms

**Total**: ~300-600ms (acceptable for dashboard page)

---

### Query Optimization

**Denormalized Fields**:
- `usage.playerCount`: Avoids counting players subcollection
- `usage.gamesThisMonth`: Avoids counting games subcollections

**Collection Group Query**:
- `countPendingVerifications()`: Uses `.count()` aggregation (server-side count, not document read)

**Future Optimization**:
- Cache pending verifications count for 5 minutes (reduces query load)
- Use Firestore triggers to update denormalized count (avoid collection group query)

---

## Known Limitations

### Phase 7 Task 2 Scope

**Included**:
- ✅ Status and plan display
- ✅ Billing information and next action
- ✅ Usage metrics (players, games, pending verifications)
- ✅ Sync status validation
- ✅ Email verification status
- ✅ "Manage Billing" button integration

**Deferred to Future Phases**:
- ❌ Plan limit visualization (e.g., progress bars for max players)
- ❌ Historical usage charts (games per month over time)
- ❌ Notification preferences (email alerts for billing issues)
- ❌ Multi-workspace selector (current: shows default workspace only)
- ❌ Admin view (support team workspace health dashboard)

---

### Current Gaps

1. **No Real-Time Updates**: Page must be refreshed to see latest data
   - **Mitigation**: Phase 8 will add Firestore real-time listeners

2. **No Plan Limit Warnings**: Doesn't show "approaching max players" warnings
   - **Mitigation**: Phase 7 Task 3 will add limit warnings to player creation flow

3. **No Usage History**: Only shows current month's game count
   - **Mitigation**: Phase 8 will add historical usage charts

4. **No Stripe Webhook Status**: Doesn't show recent webhook success/failure rate
   - **Mitigation**: Phase 7 Task 4 will add webhook monitoring dashboard

---

## Related Documentation

### Canonical References (6767 Series)
- **6767**: `000-docs/6767-REF-hustle-monitoring-and-alerting.md` (Monitoring setup)
- **6768**: `000-docs/6768-REF-hustle-workspace-status-enforcement.md` (Status enforcement)
- **6769**: `000-docs/6769-REF-hustle-runtime-and-billing-canonical.md` (Runtime & billing)
- **6770**: `000-docs/6770-REF-hustle-customer-portal.md` (Customer Portal)
- **6771**: This document (Workspace Health)

### Phase 7 (Customer Experience & Revenue Stabilization)
- Task 1: Customer Portal integration (6770-REF)
- Task 2: Workspace Health Dashboard (this task)
- Task 3: Self-service plan changes (pending)
- Task 4: Improved webhook handling (pending)

### Code References
- **Health Loader**: `src/lib/dashboard/health.ts`
- **Health Page**: `src/app/dashboard/health/page.tsx`
- **Health Component**: `src/components/dashboard/health-summary.tsx`
- **Tests**: `tests/dashboard/health.test.ts`

---

**Document Version**: 1.0
**Last Reviewed**: 2025-11-16
**Next Review**: 2026-01-16 (quarterly)
**Maintainer**: Platform Team
**Change Log**:
- 2025-11-16: Initial version (Phase 7 Task 2)
