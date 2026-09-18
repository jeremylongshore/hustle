# Hustle Runtime & Billing Canonical Reference

**Document Type**: Reference (REF)
**Number**: 6769 (Canonical Reference Series)
**Phase**: Phase 6 - Customer Success & Growth
**Created**: 2025-11-16
**Last Updated**: 2025-11-16
**Owner**: Platform Team

---

## Overview

Hustle uses **Firebase** (Authentication + Firestore) as its runtime data plane and **Stripe** for billing. **Workspaces** are the fundamental unit of tenancy and billing. Each workspace represents a billable customer (typically a parent/guardian account) and contains players, games, and usage data.

This document is the stable canonical reference for how runtime state and billing state interact.

---

## Data Plane Summary

### Where Users Live

**Collection**: `/users/{userId}`

**Key Fields**:
- `email` (string) - User email address
- `firstName`, `lastName` (string) - User profile
- `defaultWorkspaceId` (string) - Primary workspace for this user
- `ownedWorkspaces` (string[]) - Array of workspace IDs where user is owner
- `emailVerified` (boolean) - Managed by Firebase Auth
- `agreedToTerms`, `agreedToPrivacy`, `isParentGuardian` (boolean) - COPPA compliance
- `createdAt`, `updatedAt` (Timestamp)

**Authentication**: Managed by Firebase Authentication (email/password provider)

### Where Workspaces Live

**Collection**: `/workspaces/{workspaceId}`

**Key Fields**:
- `ownerUserId` (string) - Firebase UID of workspace owner
- `name` (string) - Display name (e.g., "Johnson Family Stats")
- `plan` (string) - Current subscription tier: `free` | `starter` | `plus` | `pro`
- `status` (string) - Lifecycle status: `active` | `trial` | `past_due` | `canceled` | `suspended` | `deleted`
- `members` (WorkspaceMember[]) - Team members with role-based access (Phase 6 Task 6 - future)
- `billing.stripeCustomerId` (string | null) - Stripe customer ID
- `billing.stripeSubscriptionId` (string | null) - Stripe subscription ID
- `billing.currentPeriodEnd` (Timestamp | null) - Current billing period end date
- `usage.playerCount` (number) - Current active players (denormalized)
- `usage.gamesThisMonth` (number) - Games created this billing cycle (denormalized)
- `usage.storageUsedMB` (number) - Storage used in MB (future - photos/videos)
- `createdAt`, `updatedAt`, `deletedAt` (Timestamp)

**Workspace ↔ Stripe Linkage**:
- `workspace.billing.stripeCustomerId` links to Stripe Customer
- `workspace.billing.stripeSubscriptionId` links to Stripe Subscription
- Stripe webhooks update `workspace.status` when subscription changes

### Where Players/Games Live

**Players Collection**: `/users/{userId}/players/{playerId}` (subcollection)

**Key Fields**:
- `workspaceId` (string) - Workspace that owns this player (denormalized for filtering)
- `name`, `birthday`, `position`, `teamClub` (player profile)
- `photoUrl` (string | null) - Profile photo URL
- `createdAt`, `updatedAt` (Timestamp)

**Games Collection**: `/users/{userId}/players/{playerId}/games/{gameId}` (nested subcollection)

**Key Fields**:
- `workspaceId` (string) - Workspace that owns this game (denormalized for filtering)
- `date`, `opponent`, `result`, `finalScore` (game metadata)
- `goals`, `assists`, `tackles`, `saves`, etc. (statistics)
- `verified` (boolean) - Parent verification status
- `createdAt`, `updatedAt` (Timestamp)

**Ownership Hierarchy**:
```
Workspace (billable unit)
  ↓
User (parent/guardian)
  ↓
Players (child profiles)
  ↓
Games (individual statistics)
```

---

## Workspace Status & Enforcement

**Full Reference**: See `000-docs/6768-REF-hustle-workspace-status-enforcement.md`

### Status Values

| Status | Description | Write Operations | Read Operations |
|--------|-------------|------------------|-----------------|
| `active` | Workspace in good standing with active subscription | ✅ Allowed | ✅ Allowed |
| `trial` | Free trial period, full access | ✅ Allowed | ✅ Allowed |
| `past_due` | Payment failed, grace period active | ❌ Blocked | ✅ Allowed |
| `canceled` | Subscription canceled by user | ❌ Blocked | ❌ Blocked |
| `suspended` | Account suspended (TOS violation, fraud) | ❌ Blocked | ❌ Blocked |
| `deleted` | Workspace soft-deleted | ❌ Blocked | ❌ Blocked |

### Write-Blocking Statuses

Write operations (create player, log game, upload photo, etc.) are **BLOCKED** for:
- `past_due` - Payment failed, user must update payment method
- `canceled` - Subscription canceled, user must reactivate
- `suspended` - Account suspended, user must contact support
- `deleted` - Workspace deleted, no recovery

### Error Response Shape

When enforcement blocks an operation, API returns:

```json
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "PAYMENT_PAST_DUE" | "SUBSCRIPTION_CANCELED" | "ACCOUNT_SUSPENDED" | "WORKSPACE_DELETED",
  "message": "User-friendly error message",
  "status": "past_due" | "canceled" | "suspended" | "deleted"
}
```

### Billing State Sync

**Stripe → Firestore Sync** (via webhooks):
- Stripe subscription status changes → Updates `workspace.status`
- Stripe subscription created → Creates `workspace.billing.*` fields
- Stripe payment failed → Sets `workspace.status = 'past_due'`
- Stripe subscription canceled → Sets `workspace.status = 'canceled'`

**Enforcement Point**: `src/lib/workspaces/enforce.ts` → `assertWorkspaceActive(workspace)`

---

## Billing Integration Summary

**Full Reference**: Phase 5 Task 3 Stripe Integration

### Canonical Mapping: Plan ↔ Stripe Price ID

| Workspace Plan | Monthly Price | Stripe Price ID Environment Variable |
|----------------|---------------|-------------------------------------|
| `free` | $0 | N/A (no Stripe subscription) |
| `starter` | $9/month | `STRIPE_PRICE_ID_STARTER` |
| `plus` | $19/month | `STRIPE_PRICE_ID_PLUS` |
| `pro` | $39/month | `STRIPE_PRICE_ID_PRO` |

**Note**: Actual price IDs are environment-specific (test vs. production)

**Code Location**: `src/lib/stripe/plan-mapping.ts`

### Plan Limits (Enforced at Runtime)

| Plan | Max Players | Max Games/Month | Storage (MB) |
|------|-------------|-----------------|--------------|
| `free` | 2 | 10 | 100 |
| `starter` | 5 | 50 | 500 |
| `plus` | 15 | 200 | 2,048 (2 GB) |
| `pro` | 9,999 (unlimited) | 9,999 (unlimited) | 10,240 (10 GB) |

**Enforcement**: Checked in `/api/players/create` and `/api/games` routes before operation

### Stripe Subscription Status → Workspace Status

**Mapping Table**:

| Stripe Status | Workspace Status | Notes |
|---------------|------------------|-------|
| `active` | `active` | Subscription active and paid |
| `trialing` | `trial` | Should not happen (trials managed in Firestore) |
| `past_due` | `past_due` | Payment failed, grace period |
| `canceled` | `canceled` | User canceled subscription |
| `unpaid` | `suspended` | Payment failure exceeded grace period |
| `incomplete` | `past_due` | Initial payment failed, grace period |
| `incomplete_expired` | `canceled` | Initial payment never completed |
| `paused` | `suspended` | Stripe Billing pause feature |

**Code Location**: `src/lib/stripe/plan-mapping.ts` → `mapStripeStatusToWorkspaceStatus()`

### Price ID → Plan (Reverse Mapping)

When Stripe webhook delivers a subscription event with a `priceId`, map it to workspace plan:

**Function**: `getPlanForPriceId(priceId)` → Returns `'starter'` | `'plus'` | `'pro'`

**Throws**: Error if price ID is unknown (prevents accidental plan changes)

---

## Operational Runbook

### "Customer says they can't add a player"

**Diagnosis Steps**:

1. **Check workspace status**:
   ```bash
   # In Firestore Console
   Collection: workspaces
   Document: {workspaceId}
   Field: status
   ```
   - If `active` or `trial`: Check plan limits (next step)
   - If `past_due`: User needs to update payment method
   - If `canceled`: User needs to reactivate subscription
   - If `suspended` or `deleted`: Escalate to support

2. **Check plan limits**:
   ```bash
   # In Firestore Console
   Field: plan (e.g., "starter")
   Field: usage.playerCount (e.g., 5)
   ```
   - Compare `usage.playerCount` to `maxPlayers` for plan (see table above)
   - If at limit: User needs to upgrade plan

3. **Check Stripe subscription status**:
   - Open Stripe Dashboard: https://dashboard.stripe.com/customers
   - Search by `workspace.billing.stripeCustomerId`
   - Verify subscription is active and payment method valid
   - If payment failed: User must update card in Stripe Customer Portal

4. **Resolution**:
   - If `past_due`: Direct user to "Update Payment" button (opens Stripe portal)
   - If at limit: Direct user to "Upgrade Plan" button (opens Stripe checkout)
   - If mismatch: Re-sync from Stripe (trigger webhook manually or wait)

### "Billing looks wrong"

**Diagnosis Steps**:

1. **Check Stripe subscription**:
   - Open: https://dashboard.stripe.com/subscriptions/{subscriptionId}
   - Verify: Status, plan/price ID, current period, payment method
   - Check: Recent invoices and payment attempts

2. **Check workspace billing fields**:
   ```bash
   # In Firestore Console
   workspace.billing.stripeCustomerId → Should match Stripe
   workspace.billing.stripeSubscriptionId → Should match Stripe
   workspace.billing.currentPeriodEnd → Should match Stripe subscription end date
   workspace.plan → Should match price ID mapping
   workspace.status → Should match subscription status mapping
   ```

3. **Identify mismatch**:
   - If Stripe shows `active` but Firestore shows `past_due`: Webhook sync issue
   - If plan doesn't match price ID: Manual override or webhook processing error
   - If `stripeCustomerId` is null but user says they paid: Subscription created outside app

4. **Re-run webhooks** (if sync issue detected):
   - **Option 1 (Manual)**: Trigger webhook event in Stripe Dashboard
     - Go to: Developers → Events → Find event (e.g., `customer.subscription.updated`)
     - Click: "Send test webhook"
   - **Option 2 (Code)**: Force re-sync from Stripe API (requires custom script)
   - **Option 3 (Admin)**: Manually update Firestore fields (last resort)

5. **Resolution**:
   - Most issues: Re-running webhook fixes automatically
   - Orphaned subscriptions: Link manually or cancel in Stripe
   - Data corruption: Restore from Firestore backup (if recent)

---

## Change Control

**Critical Rule**: Any changes to plans, limits, status semantics, or Stripe mappings **MUST** update:

1. **This document** (`6769-REF-hustle-runtime-and-billing-canonical.md`)
2. **Linked references**:
   - `6767-REF-hustle-monitoring-and-alerting.md` (if monitoring changes)
   - `6768-REF-hustle-workspace-status-enforcement.md` (if status logic changes)
3. **Phase 5/6 AARs** (if design decisions change):
   - Phase 5 Task 3: Stripe Integration
   - Phase 6 Task 5: Workspace Status Enforcement

**Change Process**:

1. **Propose Change**: Document in AAR or design doc
2. **Update Code**: Modify `src/lib/stripe/plan-mapping.ts` or enforcement logic
3. **Update Tests**: Ensure unit tests cover new behavior
4. **Update This Doc**: Add/modify canonical reference
5. **Deploy**: Staging → Verify → Production
6. **Notify**: Update team via Slack/email if user-facing

**Examples of Changes Requiring Updates**:
- Adding new plan tier (e.g., "enterprise")
- Changing plan limits (e.g., `starter` gets 10 players instead of 5)
- Adding new workspace status (e.g., "frozen" for compliance hold)
- Changing Stripe → Workspace status mapping (e.g., treat `unpaid` as `past_due` instead of `suspended`)
- Deprecating old price IDs (migration required)

---

## Related Documentation

### Canonical References (6767 Series)
- **6767**: `000-docs/6767-REF-hustle-monitoring-and-alerting.md` (Monitoring setup)
- **6768**: `000-docs/6768-REF-hustle-workspace-status-enforcement.md` (Status enforcement)
- **6769**: This document (Runtime & billing)

### Phase 5 (Workspace & Billing Foundation)
- Task 1: Workspace data model design
- Task 2: User ↔ Workspace linking
- Task 3: Stripe integration & webhooks
- Task 4: Plan limits enforcement

### Phase 6 (Customer Success & Guardrails)
- Task 1: Workspace status guards
- Task 4: Monitoring & alerting
- Task 5: Runtime status enforcement (MAAR: `000-docs/219-AA-MAAR-hustle-phase6-task5-workspace-status-enforcement.md`)
- Task 6: Production readiness validation (this phase)

### Code References
- **Stripe Mapping**: `src/lib/stripe/plan-mapping.ts`
- **Enforcement**: `src/lib/workspaces/enforce.ts`
- **Firestore Types**: `src/types/firestore.ts`
- **Webhook Handler**: `src/app/api/billing/webhook/route.ts`

---

**Document Version**: 1.0
**Last Reviewed**: 2025-11-16
**Next Review**: 2026-01-16 (quarterly)
**Maintainer**: Platform Team
**Change Log**:
- 2025-11-16: Initial version (Phase 6 Task 6)
