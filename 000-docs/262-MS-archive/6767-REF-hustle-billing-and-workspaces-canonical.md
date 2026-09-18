# Billing & Workspaces Canonical Reference

**Type**: Canonical Reference
**Phase**: 7 Task 6
**Created**: 2025-11-16
**Status**: Authoritative Source of Truth

---

## Purpose

This document is the **single source of truth** for all billing and workspace behavior in the Hustle application. It documents the workspace model, plan tiers, Stripe integration, enforcement logic, and operational procedures.

**Target Audience**: Engineers, support staff, operators, and future maintainers.

---

## Table of Contents

1. [Workspace Model](#workspace-model)
2. [Plan Tiers & Limits](#plan-tiers--limits)
3. [Workspace Status Lifecycle](#workspace-status-lifecycle)
4. [Stripe Integration](#stripe-integration)
5. [Plan Limit Enforcement](#plan-limit-enforcement)
6. [User-Workspace Relationships](#user-workspace-relationships)
7. [Operational Procedures](#operational-procedures)
8. [Environment Configuration](#environment-configuration)

---

## Workspace Model

### Firestore Collection Structure

**Primary Collection**: `/workspaces/{workspaceId}`

A **workspace** represents a billable tenant (typically a parent/guardian account managing multiple child player profiles).

### Workspace Document Schema

```typescript
interface WorkspaceDocument {
  // Identity
  ownerUserId: string;        // Firebase UID of workspace owner
  name: string;               // Display name (e.g., "Johnson Family Stats")

  // Plan & Status
  plan: WorkspacePlan;        // Current subscription tier
  status: WorkspaceStatus;    // Lifecycle status

  // Collaborators (Phase 6 Task 6)
  members: WorkspaceMember[]; // Team members with role-based access

  // Billing Integration
  billing: {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd: Timestamp | null;
    lastPaymentFailed?: Timestamp;        // Set by webhook when payment fails
    canceledAt?: Timestamp;                // Set by webhook when subscription canceled
    subscriptionStatus?: string;           // Stripe subscription status (for debugging)
  };

  // Usage Tracking (denormalized for quick limit checks)
  usage: {
    playerCount: number;        // Current active players
    gamesThisMonth: number;     // Games created this billing cycle
    storageUsedMB: number;      // Storage used (photos, videos)
  };

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;  // Soft delete timestamp
}
```

### Workspace Member Schema

```typescript
interface WorkspaceMember {
  userId: string;              // Firebase UID
  email: string;               // User email
  role: WorkspaceMemberRole;   // 'owner' | 'admin' | 'member' | 'viewer'
  addedAt: Timestamp;          // When member was added
  addedBy: string;             // Firebase UID of inviter
}
```

**Role Permissions**:
- `owner`: Full access, billing, can delete workspace
- `admin`: Full access to players/games, can invite members
- `member`: Can view/edit players/games
- `viewer`: Read-only access

---

## Plan Tiers & Limits

### Available Plans

| Plan    | Price/Month | Players | Games/Month | Storage | Features |
|---------|-------------|---------|-------------|---------|----------|
| Free    | $0          | 2       | 10          | 100 MB  | Basic stats, game verification |
| Starter | $9          | 5       | 50          | 500 MB  | Basic stats, game verification |
| Plus    | $19         | 15      | 200         | 2 GB    | Basic stats, game verification, advanced analytics |
| Pro     | $39         | 9999*   | 9999*       | 10 GB   | All features, export reports, priority support |

**\* Effectively unlimited** - Pro plan has very high limits (9999) to avoid enforcement for most users.

### Plan Limit Enforcement

**Hard Enforcement**: API returns `403 PLAN_LIMIT_EXCEEDED` when limit reached
- Applied at: Player creation, game logging
- Error format:
  ```json
  {
    "error": "PLAN_LIMIT_EXCEEDED",
    "message": "Player limit reached. Upgrade your plan to add more players.",
    "plan": "starter",
    "limit": 5,
    "current": 5
  }
  ```

**Soft Warnings**: UI displays informational banners (Phase 7 Task 5)
- Dashboard: Yellow/red banners above stats cards
- Billing page: Color-coded usage indicators
- Thresholds:
  - **ok** (green): < 70% of limit
  - **warning** (yellow): 70-99% of limit
  - **critical** (red): ≥ 100% of limit

### Plan Feature Flags

**Feature Availability**:
```typescript
{
  free: ['game_verification', 'basic_stats'],
  starter: ['game_verification', 'basic_stats'],
  plus: ['game_verification', 'basic_stats', 'advanced_analytics'],
  pro: [
    'game_verification',
    'basic_stats',
    'advanced_analytics',
    'export_reports',
    'priority_support',
  ],
}
```

**Usage**:
```typescript
import { planHasFeature } from '@/lib/stripe/plan-mapping';

if (planHasFeature(workspace.plan, 'export_reports')) {
  // Show export button
}
```

---

## Workspace Status Lifecycle

### All Workspace Status Values

| Status     | Meaning | Access Level | Billing State |
|------------|---------|--------------|---------------|
| `trial`    | Free trial period (14 days) | Full access | No Stripe subscription |
| `active`   | Workspace active, subscription in good standing | Full access | Stripe subscription active |
| `past_due` | Payment failed, grace period | Full access (7-day grace) | Stripe subscription past_due |
| `canceled` | Subscription canceled, accessible until period end | Full access until period end | Stripe subscription canceled |
| `suspended`| Access restricted (payment issues, TOS violation) | Read-only | Stripe subscription unpaid/paused |
| `deleted`  | Soft deleted, no longer accessible | No access | Subscription ended |

### Status Transitions

**Normal Flow**:
```
trial → active → canceled → deleted
  ↓       ↓          ↑
  ↓   past_due -----+
  ↓       ↓
  ↓   suspended
  ↓       ↓
  +----deleted
```

**Status Change Triggers**:

1. **trial → active**
   - Trigger: Checkout session completed
   - Webhook: `checkout.session.completed`
   - Action: Update plan + status + billing fields

2. **active → past_due**
   - Trigger: Payment failed
   - Webhook: `invoice.payment_failed`
   - Action: Update status, send payment failed email
   - Grace period: 7 days (Stripe default)

3. **past_due → active**
   - Trigger: Payment succeeded
   - Webhook: `invoice.payment_succeeded`
   - Action: Update status back to active

4. **active → canceled**
   - Trigger: Subscription canceled (via portal or Stripe)
   - Webhook: `customer.subscription.deleted` OR `customer.subscription.updated`
   - Action: Update status, send cancellation email
   - Access: User retains access until currentPeriodEnd

5. **past_due → suspended**
   - Trigger: Grace period expires, Stripe marks subscription as unpaid
   - Webhook: `customer.subscription.updated` (status = unpaid)
   - Action: Update status, restrict access

6. **any → deleted**
   - Trigger: User deletes workspace OR admin intervention
   - Action: Set deletedAt timestamp, block all access

### Status Effects on Features

**Read Access**:
- `trial`, `active`, `past_due`, `canceled`: Yes
- `suspended`: Read-only (cannot create/edit)
- `deleted`: No access

**Write Access** (create players, log games):
- `trial`, `active`, `past_due`, `canceled`: Yes (subject to plan limits)
- `suspended`, `deleted`: No

**Billing Portal Access**:
- `trial`: No (no Stripe customer yet)
- `active`, `past_due`, `canceled`, `suspended`: Yes
- `deleted`: No

---

## Stripe Integration

### Stripe Price IDs (Environment Variables)

**Required Environment Variables**:
```bash
STRIPE_SECRET_KEY="sk_test_..."           # Stripe API secret key
STRIPE_WEBHOOK_SECRET="whsec_..."         # Webhook signing secret
STRIPE_PRICE_ID_STARTER="price_..."       # $9/month
STRIPE_PRICE_ID_PLUS="price_..."          # $19/month
STRIPE_PRICE_ID_PRO="price_..."           # $39/month
```

**Price ID Mapping**:
```typescript
{
  'starter': process.env.STRIPE_PRICE_ID_STARTER,
  'plus':    process.env.STRIPE_PRICE_ID_PLUS,
  'pro':     process.env.STRIPE_PRICE_ID_PRO,
}
```

### Checkout Flow

**New Subscription Checkout**:
1. User clicks "Upgrade Plan" on billing page
2. Frontend calls `/api/billing/checkout` with `priceId` and `workspaceId`
3. Backend creates Stripe Checkout Session:
   - Mode: `subscription`
   - Customer: Existing or new Stripe customer
   - Metadata: `{ workspaceId, userId }`
   - Success URL: `/dashboard/billing?success=true`
   - Cancel URL: `/dashboard/billing?canceled=true`
4. User completes payment on Stripe Checkout page
5. Webhook `checkout.session.completed` triggers
6. Backend updates workspace: plan, status, billing fields

**Plan Change Checkout** (Phase 7 Task 3):
1. User selects new plan on `/dashboard/billing/change-plan`
2. Backend calculates proration preview
3. User confirms plan change
4. Backend creates Stripe Checkout Session with updated price
5. Webhook updates workspace plan and billing

### Webhook Event Handling

**Webhook Endpoint**: `/api/webhooks/stripe`

**Handled Events**:

| Event | Action | Workspace Update | Email |
|-------|--------|------------------|-------|
| `checkout.session.completed` | New subscription created | plan, status (trial→active), billing.* | Welcome email |
| `customer.subscription.updated` | Subscription status changed | status (mapped from Stripe), billing.subscriptionStatus | Cancellation email (if canceled) |
| `customer.subscription.deleted` | Subscription ended | status (→canceled), billing.canceledAt | Subscription canceled email |
| `invoice.payment_failed` | Payment failed | status (→past_due), billing.lastPaymentFailed | Payment failed email |
| `invoice.payment_succeeded` | Payment succeeded | status (→active if was past_due) | Payment success email (if recovering) |

**Stripe Status → Workspace Status Mapping**:
```typescript
{
  active: 'active',
  trialing: 'trial',           // Should not happen (we manage trials)
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'suspended',
  incomplete: 'past_due',
  incomplete_expired: 'canceled',
  paused: 'suspended',
}
```

**Webhook Signature Verification**:
- Every webhook request is verified using `stripe.webhooks.constructEvent()`
- Invalid signatures return `400 Bad Request`
- Prevents replay attacks and unauthorized requests

### Billing Portal Integration (Phase 7 Task 4)

**Portal Session Creation**: `/api/billing/portal`
- Creates Stripe Customer Portal session
- Returns session URL for redirect
- User can: Update payment method, view invoices, cancel subscription

**Portal Configuration** (in Stripe Dashboard):
- Features enabled: Update payment method, cancel subscription, view invoices
- Return URL: `${NEXTAUTH_URL}/dashboard/billing`

**Invoice History**: `/api/billing/invoices`
- Fetches last 5 invoices for workspace
- Displays on billing page with status, amount, PDF link

---

## Plan Limit Enforcement

### Enforcement Points

**Player Creation** (`POST /api/players`):
```typescript
const limits = getPlanLimits(workspace.plan);
if (workspace.usage.playerCount >= limits.maxPlayers) {
  return NextResponse.json({
    error: 'PLAN_LIMIT_EXCEEDED',
    message: 'Player limit reached. Upgrade your plan to add more players.',
    plan: workspace.plan,
    limit: limits.maxPlayers,
    current: workspace.usage.playerCount,
  }, { status: 403 });
}
```

**Game Creation** (`POST /api/games`):
```typescript
const limits = getPlanLimits(workspace.plan);
if (workspace.usage.gamesThisMonth >= limits.maxGamesPerMonth) {
  return NextResponse.json({
    error: 'PLAN_LIMIT_EXCEEDED',
    message: 'Monthly games limit reached. Upgrade your plan to continue adding games.',
    plan: workspace.plan,
    limit: limits.maxGamesPerMonth,
    current: workspace.usage.gamesThisMonth,
  }, { status: 403 });
}
```

**Enforcement Logic**:
- Hard block: API returns 403
- User receives clear error message
- UI suggests upgrade path
- Existing data remains accessible (read-only for games/players over limit)

### Usage Counter Management

**Increment Triggers**:
- Player created: `workspace.usage.playerCount++`
- Game created: `workspace.usage.gamesThisMonth++`
- File uploaded: `workspace.usage.storageUsedMB += fileSizeMB`

**Decrement Triggers**:
- Player deleted: `workspace.usage.playerCount--`

**Monthly Reset** (gamesThisMonth):
- Cloud Function runs on 1st of each month
- Sets `usage.gamesThisMonth = 0` for all workspaces
- Scheduled via Cloud Scheduler

**Counter Drift Prevention**:
- Counters are denormalized for performance
- Periodic audit script can recount from actual player/game documents
- Manual fix: Admin can update counters via Firestore console

---

## User-Workspace Relationships

### User Document Fields

```typescript
interface UserDocument {
  // Workspace Ownership (Phase 5)
  defaultWorkspaceId: string | null;  // Primary workspace for this user
  ownedWorkspaces: string[];          // Array of workspace IDs where user is owner

  // Other fields...
}
```

**Relationship Rules**:
- Each user has exactly one `defaultWorkspaceId` (set on first workspace creation)
- User can own multiple workspaces via `ownedWorkspaces[]`
- User can be a member of workspaces they don't own (via `workspace.members[]`)

**Workspace Creation**:
1. User registers → User document created
2. First login → Workspace created automatically (plan = free, status = trial)
3. Workspace ID added to `user.defaultWorkspaceId` and `user.ownedWorkspaces[]`
4. User added to `workspace.members[]` as owner

**Workspace Switching** (if multi-workspace):
- User selects workspace from dropdown
- Frontend updates active workspace context
- All API calls use selected `workspaceId`

---

## Operational Procedures

### Local Development

**Run Stripe Webhook Tests Locally**:
```bash
# Terminal 1: Run local dev server
npm run dev

# Terminal 2: Start Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

**View Webhook Logs**:
- Stripe CLI shows webhook delivery status
- Next.js console shows handler execution logs
- Check Firestore for workspace updates

### Smoke Tests

**Run Smoke Tests**:
```bash
SMOKE_TEST_URL=https://hustle-staging-xxx.run.app npm run smoke-test
```

**Smoke Test Coverage**:
- Health check endpoint
- Authentication flow
- Workspace creation
- Plan upgrade flow (mocked Stripe)

### Known Caveats

**External Dependencies**:
- Stripe test mode required for local development
- Webhook secret must match Stripe CLI or production endpoint
- Firebase Admin SDK requires service account credentials

**Counter Drift**:
- Usage counters may drift if operations fail partway
- Example: Player created but counter increment fails
- Fix: Run audit script or manually correct in Firestore

**Webhook Retry**:
- Stripe retries failed webhooks up to 3 days
- Check Stripe Dashboard → Developers → Webhooks for failed deliveries
- Manually retry from Stripe Dashboard if needed

---

## Environment Configuration

### Required Environment Variables

**Billing & Stripe**:
```bash
STRIPE_SECRET_KEY="sk_test_..." # Or sk_live for production
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_STARTER="price_..."
STRIPE_PRICE_ID_PLUS="price_..."
STRIPE_PRICE_ID_PRO="price_..."
BILLING_ENABLED="true" # Feature switch (Phase 7 Task 6)
```

**Firebase**:
```bash
# Server-side (Admin SDK)
FIREBASE_PROJECT_ID="hustleapp-production"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@hustleapp-production.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Client-side (public)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyD..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="hustleapp-production.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="hustleapp-production"
# ... other Firebase config
```

**App URLs**:
```bash
NEXTAUTH_URL="https://yourdomain.com" # Or http://localhost:3000 for local
NODE_ENV="production" # Or development
```

**Email**:
```bash
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM="Hustle <noreply@yourdomain.com>"
```

### Billing Feature Switch (Phase 7 Task 6)

**Purpose**: Disable Stripe operations without code changes (safety kill-switch)

**Environment Variable**: `BILLING_ENABLED=true | false`

**Behavior When Disabled (`false`)**:
- Checkout API: Returns 503 with error message
- Billing Portal API: Returns 503 with error message
- Invoice API: Returns 503 with error message
- Plan limits: NOT affected (enforcement still works)
- Existing subscriptions: NOT affected
- UI: Shows "Billing temporarily disabled for maintenance"

**Use Cases**:
- Stripe API outage
- Maintenance window
- Testing without triggering Stripe
- Demo mode

**CI Check**: Production deploys fail if `BILLING_ENABLED=true` but required Stripe env vars are missing

---

## API Reference

### Core Billing Endpoints

**Checkout Session** (`POST /api/billing/checkout`):
- Creates Stripe Checkout Session
- Body: `{ priceId, workspaceId }`
- Returns: `{ url: "https://checkout.stripe.com/..." }`

**Billing Portal** (`POST /api/billing/portal`):
- Creates Stripe Customer Portal session
- Body: `{ workspaceId }`
- Returns: `{ url: "https://billing.stripe.com/..." }`

**Invoice List** (`GET /api/billing/invoices?workspaceId=xxx`):
- Fetches recent invoices
- Returns: Array of invoice objects

**Plan Change** (`POST /api/billing/change-plan`):
- Initiates plan upgrade/downgrade
- Body: `{ newPlan, workspaceId }`
- Returns: Checkout session URL or immediate update

**Proration Preview** (`POST /api/billing/proration`):
- Calculates proration for plan change
- Body: `{ newPlan, workspaceId }`
- Returns: `{ amountDue, proratedAmount, immediateCharge }`

### Webhook Endpoint

**Stripe Webhooks** (`POST /api/webhooks/stripe`):
- Receives Stripe events
- Signature verification required
- Handles: checkout, subscription updates, invoice events

---

## Troubleshooting

### Common Issues

**"Workspace not found"**:
- Check `user.defaultWorkspaceId` is set
- Verify workspace document exists in Firestore
- Check workspace.deletedAt is null

**"Plan limit exceeded" but user just upgraded**:
- Check workspace.plan is updated
- Verify webhook was processed (check logs)
- Manually trigger webhook retry from Stripe Dashboard

**Webhook delivery failures**:
- Check STRIPE_WEBHOOK_SECRET matches
- Verify endpoint is accessible (not behind auth)
- Check Next.js logs for errors
- Retry from Stripe Dashboard

**Usage counters incorrect**:
- Run audit script to recount
- Manually update in Firestore if needed
- Check for partial operation failures in logs

---

## References

**Related Documentation**:
- Phase 7 Task 3: Plan changes (`000-docs/6772-REF-hustle-plan-change-flow.md`)
- Phase 7 Task 4: Billing portal (`000-docs/6773-REF-hustle-billing-portal-and-invoices.md`)
- Phase 7 Task 5: Plan limit warnings (`000-docs/6774-REF-hustle-plan-limit-warnings.md`)
- Phase 6 Task 1: Workspace enforcement (`000-docs/XXX-REF-workspace-enforcement.md`)

**Code Locations**:
- Workspace types: `src/types/firestore.ts`
- Plan mapping: `src/lib/stripe/plan-mapping.ts`
- Plan limits: `src/lib/billing/plan-limits.ts`
- Webhook handler: `src/app/api/webhooks/stripe/route.ts`
- Billing API: `src/app/api/billing/`

---

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Authoritative Status**: Yes - This is the canonical reference
**Maintained By**: Engineering Team
