# Hustle Plan Change Flow - Reference

**Document**: 6772-REF-hustle-plan-change-flow.md
**Created**: 2025-11-16
**Phase**: 7 Task 3 - Self-Service Plan Changes
**Status**: Active Reference

---

## Overview

This document provides a comprehensive reference for the self-service plan change system in Hustle. This feature enables customers to upgrade or downgrade their subscription plans directly from the dashboard, with automatic proration handling via Stripe Checkout.

### Purpose

Enable workspace owners to:
- View available subscription plans (Starter, Plus, Pro)
- Compare plan features, limits, and pricing
- Preview proration costs for mid-cycle plan changes
- Complete plan changes via Stripe Checkout
- Handle immediate upgrades and end-of-cycle downgrades

### Key Principles

1. **Stripe-Native**: Leverage Stripe Checkout for payment collection
2. **Automatic Proration**: Stripe handles all billing calculations
3. **Status-Based Access**: Validate workspace eligibility before allowing changes
4. **Transparent Pricing**: Show exact costs before checkout
5. **Graceful Failures**: Return structured JSON errors for all error cases

---

## System Architecture

### Component Hierarchy

```
/dashboard/billing/change-plan
  └─> Server Loader (Next.js Page)
      ├─> Authentication Check (getDashboardUser)
      ├─> Workspace Status Validation
      ├─> getAvailablePlans(workspace)
      └─> <PlanSelector /> Component
          ├─> Plan Cards (Grid Layout)
          ├─> Selection State Management
          ├─> POST /api/billing/change-plan
          └─> Stripe Checkout Redirect
```

### Data Flow

```
┌─────────────┐
│   User      │
│   Clicks    │
│   "Upgrade" │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  PlanSelector.tsx (Client)          │
│  - Sets selectedPlan state          │
│  - Shows proration notice           │
│  - Enables "Continue to Checkout"   │
└──────┬──────────────────────────────┘
       │
       │ POST /api/billing/change-plan
       │ { targetPriceId: "price_plus" }
       ▼
┌─────────────────────────────────────┐
│  API Route Handler                  │
│  1. Authenticate user               │
│  2. Get workspace from Firestore    │
│  3. Validate eligibility            │
│  4. Get proration preview (Stripe)  │
│  5. Build checkout session (Stripe) │
│  6. Return { url, preview }         │
└──────┬──────────────────────────────┘
       │
       │ { url: "https://checkout.stripe.com/..." }
       ▼
┌─────────────────────────────────────┐
│  PlanSelector.tsx (Client)          │
│  - Receives checkout URL            │
│  - Redirects: window.location.href  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Stripe Checkout                    │
│  - Collects payment if needed       │
│  - Updates subscription             │
│  - Redirects to success_url         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Stripe Webhook (existing)          │
│  - invoice.payment_succeeded        │
│  - customer.subscription.updated    │
│  - Syncs workspace in Firestore     │
└─────────────────────────────────────┘
```

---

## Core Functions

### `getAvailablePlans(workspace: Workspace): AvailablePlan[]`

**Location**: `src/lib/billing/plan-change.ts`

Returns all available plans with metadata for the current workspace.

**Input**:
```typescript
{
  id: "workspace-123",
  plan: "starter",
  status: "active",
  billing: {
    stripeCustomerId: "cus_...",
    stripeSubscriptionId: "sub_...",
    stripePriceId: "price_starter",
    // ...
  }
}
```

**Output**:
```typescript
[
  {
    plan: "starter",
    priceId: "price_starter",
    displayName: "Starter",
    monthlyPrice: 9,
    limits: {
      maxPlayers: 5,
      maxGamesPerMonth: 50,
      storageMB: 500
    },
    isCurrent: true,
    changeType: "current"
  },
  {
    plan: "plus",
    priceId: "price_plus",
    displayName: "Plus",
    monthlyPrice: 19,
    limits: {
      maxPlayers: 15,
      maxGamesPerMonth: 200,
      storageMB: 2048
    },
    isCurrent: false,
    changeType: "upgrade"
  },
  {
    plan: "pro",
    priceId: "price_pro",
    displayName: "Pro",
    monthlyPrice: 39,
    limits: {
      maxPlayers: 9999,
      maxGamesPerMonth: 9999,
      storageMB: 10240
    },
    isCurrent: false,
    changeType: "upgrade"
  }
]
```

**Logic**:
- Maps each plan to its Stripe price ID via `getPriceIdForPlan()`
- Compares monthly prices to classify as upgrade/downgrade
- Marks current plan via `workspace.plan` field
- Returns all plans sorted by price (low to high)

**Dependencies**:
- `src/lib/stripe/plan-mapping.ts`: Price ID lookup, limits, display names

---

### `validatePlanChangeEligibility(workspace: Workspace): { eligible: boolean; reason?: string }`

**Location**: `src/lib/billing/plan-change.ts`

Checks if workspace is allowed to change plans based on status.

**Rules**:

| Workspace Status | Eligible? | Reason |
|------------------|-----------|--------|
| `active`         | ✅ Yes     | Normal subscription |
| `past_due`       | ✅ Yes     | Payment will be collected in checkout |
| `trial`          | ❌ No      | No Stripe subscription yet |
| `canceled`       | ❌ No      | Must reactivate first |
| `suspended`      | ❌ No      | Contact support |
| `deleted`        | ❌ No      | No recovery possible |

**Example**:
```typescript
// Active workspace
validatePlanChangeEligibility(activeWorkspace)
// → { eligible: true }

// Canceled workspace
validatePlanChangeEligibility(canceledWorkspace)
// → { eligible: false, reason: "Subscription canceled. Please reactivate..." }
```

---

### `getProrationPreview(workspace: Workspace, targetPriceId: string): Promise<ProrationPreview>`

**Location**: `src/lib/billing/plan-change.ts`

Calculates proration preview using Stripe's `retrieveUpcoming` API.

**Stripe API Call**:
```typescript
const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
  customer: workspace.billing.stripeCustomerId,
  subscription: workspace.billing.stripeSubscriptionId,
  subscription_items: [
    {
      id: subscriptionItemId,
      price: targetPriceId,
    },
  ],
  subscription_proration_behavior: 'always_invoice',
});
```

**Response**:
```typescript
{
  amountDue: 1500,              // $15.00 (positive = charge, negative = credit)
  currentPeriodEnd: "2025-02-01T00:00:00.000Z",
  proratedAmount: 1500,         // Simplified: amount_due includes proration
  immediateCharge: true,        // true for upgrades, false for downgrades
  currencyCode: "USD"
}
```

**Upgrade Example** (Starter → Plus on Jan 15, period ends Feb 1):
- Current plan: $9/month
- New plan: $19/month
- Days remaining: 17/31
- Prorated charge: ~$5.48 (17/31 × $10 difference)
- User pays ~$5.48 now, then $19/month starting Feb 1

**Downgrade Example** (Plus → Starter on Jan 15):
- Current plan: $19/month
- New plan: $9/month
- Plan changes at period end (Feb 1)
- No immediate refund (credit applied to next invoice)
- User continues Plus access until Feb 1, then $9/month

**Error Handling**:
- Workspace has no subscription → Throw error
- Stripe API failure → Catch and rethrow with context

---

### `buildCheckoutSession(workspace: Workspace, targetPriceId: string): Promise<string>`

**Location**: `src/lib/billing/plan-change.ts`

Creates Stripe Checkout session for subscription update.

**Stripe API Call**:
```typescript
const session = await stripe.checkout.sessions.create({
  customer: workspace.billing.stripeCustomerId,
  mode: 'subscription',
  line_items: [
    {
      price: targetPriceId,
      quantity: 1,
    },
  ],
  success_url: `${baseUrl}/dashboard/settings/billing?plan_changed=true`,
  cancel_url: `${baseUrl}/dashboard/billing/change-plan?canceled=true`,
  metadata: {
    workspaceId: workspace.id,
    action: 'plan_change',
  },
  subscription_data: {
    metadata: {
      workspaceId: workspace.id,
    },
  },
  payment_method_collection: 'if_required',
});
```

**Parameters Explained**:
- **`customer`**: Links session to existing Stripe customer
- **`mode: 'subscription'`**: Updates existing subscription
- **`payment_method_collection: 'if_required'`**: Reuses existing payment method if valid, prompts if expired/missing
- **`metadata`**: Attaches workspace ID for webhook processing
- **`success_url`**: Redirect after successful checkout
- **`cancel_url`**: Redirect if user cancels

**Return Value**:
```typescript
"https://checkout.stripe.com/c/pay/cs_test_a1..."
```

**Error Handling**:
- No customer ID → Throw error
- No subscription ID → Throw error
- Stripe API failure → Catch and rethrow

---

## API Route

### `POST /api/billing/change-plan`

**Location**: `src/app/api/billing/change-plan/route.ts`

**Request**:
```json
{
  "targetPriceId": "price_plus"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1...",
  "preview": {
    "amountDue": 1500,
    "currentPeriodEnd": "2025-02-01T00:00:00.000Z",
    "proratedAmount": 1500,
    "immediateCharge": true,
    "currencyCode": "USD"
  }
}
```

**Error Responses**:

| Status | Error Code | Message | Cause |
|--------|------------|---------|-------|
| 401 | `UNAUTHORIZED` | Authentication required | Not logged in |
| 404 | `USER_NOT_FOUND` | User document not found | Firestore user missing |
| 404 | `NO_WORKSPACE` | User has no default workspace | No defaultWorkspaceId |
| 404 | `WORKSPACE_NOT_FOUND` | Workspace not found | Firestore workspace missing |
| 400 | `INVALID_REQUEST` | targetPriceId is required | Missing/invalid body |
| 400 | `INVALID_PRICE_ID` | Unknown Stripe price ID | Price ID not in mapping |
| 403 | `NOT_ELIGIBLE` | Workspace not eligible for plan change | Suspended/canceled/trial |
| 500 | `PRORATION_FAILED` | Failed to calculate proration | Stripe API error |
| 500 | `CHECKOUT_FAILED` | Failed to create checkout session | Stripe API error |
| 500 | `STRIPE_ERROR` | Stripe API error occurred | Stripe returned error |
| 500 | `INTERNAL_ERROR` | Failed to process plan change request | Unknown error |

**Flow**:
1. Authenticate user via `getDashboardUser()`
2. Get user document → extract `defaultWorkspaceId`
3. Get workspace document from Firestore
4. Parse `targetPriceId` from request body
5. Validate price ID via `getPlanForPriceId()`
6. Check eligibility via `validatePlanChangeEligibility()`
7. Get proration preview via `getProrationPreview()`
8. Build checkout session via `buildCheckoutSession()`
9. Return success response with URL and preview

---

## UI Components

### `<PlanSelector />`

**Location**: `src/components/billing/PlanSelector.tsx`

**Props**:
```typescript
{
  plans: AvailablePlan[];
  workspaceId: string;
}
```

**Features**:
- Grid layout (3 columns on desktop, 1 column on mobile)
- Current plan highlighted with blue background
- Selected plan highlighted with green border
- Plan comparison: price, limits, features
- Proration notices:
  - Upgrade: "You'll be charged a prorated amount..."
  - Downgrade: "Plan will change at end of billing cycle..."
- "Continue to Checkout" button
- Loading state with spinner
- Error message display

**State Management**:
```typescript
const [selectedPlan, setSelectedPlan] = useState<AvailablePlan | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**User Flow**:
1. User views plan grid
2. User clicks plan card (or "Upgrade"/"Downgrade" button)
3. Selected plan highlights green, proration notice appears
4. User clicks "Continue to Checkout"
5. Component calls POST /api/billing/change-plan
6. On success: Redirects to Stripe Checkout
7. On error: Shows error message

---

### `/dashboard/billing/change-plan`

**Location**: `src/app/dashboard/billing/change-plan/page.tsx`

**Server-Side Logic**:
```typescript
export default async function ChangePlanPage() {
  // 1. Authenticate
  const dashboardUser = await getDashboardUser();
  if (!dashboardUser) redirect('/login');

  // 2. Get workspace
  const workspace = /* fetch from Firestore */;
  if (!workspace) redirect('/dashboard');

  // 3. Handle blocked statuses
  if (workspace.status === 'suspended') {
    redirect('/dashboard/settings/billing?error=suspended');
  }
  if (workspace.status === 'canceled') {
    redirect('/dashboard/settings/billing?action=reactivate');
  }

  // 4. Get available plans
  const availablePlans = getAvailablePlans(workspace);

  // 5. Render
  return <PlanSelector plans={availablePlans} workspaceId={workspace.id} />;
}
```

**Special Cases**:
- **Trial workspaces**: Show notice that trial must be upgraded first
- **Past due workspaces**: Show notice that payment will be collected in checkout
- **Suspended workspaces**: Redirect to billing settings with error
- **Canceled workspaces**: Redirect to billing settings with reactivation prompt

---

## Stripe Integration

### Checkout Session

**Purpose**: Handle subscription updates with payment collection if needed.

**Key Fields**:
```typescript
{
  mode: 'subscription',           // Update subscription (not new)
  customer: 'cus_...',            // Existing customer
  line_items: [{ price: '...', quantity: 1 }],
  payment_method_collection: 'if_required',  // Reuse existing if valid
  success_url: '/dashboard/settings/billing?plan_changed=true',
  cancel_url: '/dashboard/billing/change-plan?canceled=true',
  metadata: {
    workspaceId: '...',
    action: 'plan_change'
  }
}
```

**Behavior**:
- **Upgrade**: Charges prorated amount immediately
- **Downgrade**: No immediate charge, schedules plan change for period end
- **Payment method**: Reuses existing if valid, prompts if expired
- **Subscription update**: Stripe updates subscription automatically after checkout

---

### Webhook Processing

**Events**:
1. `checkout.session.completed` - Checkout finished
2. `customer.subscription.updated` - Plan changed
3. `invoice.payment_succeeded` - Payment collected (upgrades)

**Firestore Sync** (handled by existing webhook):
```typescript
await adminDb.collection('workspaces').doc(workspaceId).update({
  plan: newPlan,                        // "plus"
  'billing.stripePriceId': newPriceId,  // "price_plus"
  'billing.lastSyncedAt': new Date(),
  updatedAt: new Date(),
});
```

**Note**: No new webhook logic needed - existing billing webhook handles all subscription updates.

---

## Testing

### Unit Tests

**Location**: `src/lib/billing/plan-change.test.ts`

**Coverage**:
- `getAvailablePlans()`: Plan listing, current plan marking, upgrade/downgrade classification
- `validatePlanChangeEligibility()`: All workspace statuses (active, past_due, canceled, etc.)
- `getProrationPreview()`: Upgrade/downgrade previews, Stripe API errors
- `buildCheckoutSession()`: Session creation, metadata, error handling
- Integration tests: Full plan change flow from eligibility check to checkout URL

**Test Approach**:
- Mock `@/lib/stripe/plan-mapping` to return test price IDs
- Mock Stripe API calls with vi.spyOn()
- Use factory function `createMockWorkspace()` for test data
- Verify all 6 workspace statuses
- Test both upgrade and downgrade scenarios

**Running Tests**:
```bash
npx vitest run src/lib/billing/plan-change.test.ts
```

---

## Proration Examples

### Example 1: Upgrade (Starter → Plus)

**Scenario**:
- Current plan: Starter ($9/month)
- Target plan: Plus ($19/month)
- Current period: Jan 1 - Jan 31 (31 days)
- Today: Jan 15 (17 days remaining)

**Calculation**:
1. Price difference: $19 - $9 = $10
2. Prorated days: 17/31 ≈ 0.548
3. Immediate charge: $10 × 0.548 ≈ $5.48
4. User pays $5.48 now
5. Next invoice (Feb 1): $19/month

**Preview Response**:
```json
{
  "amountDue": 548,
  "currentPeriodEnd": "2025-01-31T23:59:59Z",
  "proratedAmount": 548,
  "immediateCharge": true,
  "currencyCode": "USD"
}
```

---

### Example 2: Downgrade (Plus → Starter)

**Scenario**:
- Current plan: Plus ($19/month)
- Target plan: Starter ($9/month)
- Current period: Jan 1 - Jan 31
- Today: Jan 15

**Calculation**:
1. Plan change scheduled for Jan 31 (end of period)
2. No immediate refund
3. User keeps Plus access until Jan 31
4. Next invoice (Feb 1): $9/month

**Preview Response**:
```json
{
  "amountDue": 0,
  "currentPeriodEnd": "2025-01-31T23:59:59Z",
  "proratedAmount": 0,
  "immediateCharge": false,
  "currencyCode": "USD"
}
```

**Note**: Stripe may show negative `amountDue` if credit is applied, but no immediate refund is issued.

---

## Error Handling

### Client-Side Errors

**Display**:
```tsx
{error && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
    <p className="text-sm text-red-800">{error}</p>
  </div>
)}
```

**Example Errors**:
- "Failed to start plan change. Please try again."
- "This plan is not available for your workspace status."
- "An error occurred. Please contact support."

**Recovery**:
- User can try again (button re-enabled after error)
- Error message cleared on new plan selection
- No side effects (no Firestore writes on client errors)

---

### Server-Side Errors

**Structured Response**:
```json
{
  "error": "NOT_ELIGIBLE",
  "message": "Workspace not eligible for plan change"
}
```

**Error Codes**:
- `UNAUTHORIZED`: User not authenticated
- `USER_NOT_FOUND`: Firestore user missing
- `NO_WORKSPACE`: No default workspace
- `WORKSPACE_NOT_FOUND`: Workspace doesn't exist
- `INVALID_REQUEST`: Missing/invalid request body
- `INVALID_PRICE_ID`: Unknown Stripe price
- `NOT_ELIGIBLE`: Workspace status blocked (trial/canceled/suspended)
- `PRORATION_FAILED`: Stripe upcoming invoice failed
- `CHECKOUT_FAILED`: Stripe checkout session failed
- `STRIPE_ERROR`: Stripe API returned error
- `INTERNAL_ERROR`: Unknown server error

**Logging**:
```typescript
console.error('[API] Plan change proration preview failed:', error.message);
console.error('[Plan Change] Failed to get proration preview:', error.message);
```

**User-Facing Messages**:
- Always return user-friendly error messages
- Never expose internal error details
- Suggest next steps ("Please try again", "Contact support")

---

## Security Considerations

### Authentication

- All routes protected by `getDashboardUser()`
- No plan change access without valid Firebase Auth session
- Workspace ownership verified via `defaultWorkspaceId`

### Authorization

- Only workspace owner can change plans (default workspace restriction)
- No admin override (future feature)
- Stripe customer ID must match workspace

### Input Validation

- `targetPriceId` validated via `getPlanForPriceId()` (throws if unknown)
- Request body parsed with error handling
- All Stripe API calls wrapped in try/catch

### Stripe Security

- Checkout sessions created server-side only (no client Stripe API keys)
- Metadata includes `workspaceId` for webhook verification
- Payment method collection handled by Stripe (PCI compliance)
- No sensitive data in client responses

---

## Troubleshooting

### Issue: "No Stripe price ID configured for plan: starter"

**Cause**: Environment variables not set for Stripe price IDs

**Fix**:
1. Check `.env` file:
   ```bash
   STRIPE_PRICE_ID_STARTER=price_...
   STRIPE_PRICE_ID_PLUS=price_...
   STRIPE_PRICE_ID_PRO=price_...
   ```
2. Restart dev server: `npm run dev`

---

### Issue: Proration preview shows $0 for upgrade

**Cause**: Stripe subscription already at target plan

**Fix**:
1. Verify `workspace.plan` in Firestore matches Stripe subscription
2. Run manual sync via webhook replay
3. Check Stripe dashboard for actual subscription price

---

### Issue: Checkout redirects to cancel_url immediately

**Cause**: Stripe checkout session creation failed

**Debug**:
1. Check server logs for Stripe API errors
2. Verify `workspace.billing.stripeCustomerId` exists
3. Verify `workspace.billing.stripeSubscriptionId` exists
4. Check Stripe dashboard for customer/subscription status

**Fix**:
- If customer missing: Run initial subscription flow
- If subscription canceled: Reactivate via Customer Portal first

---

### Issue: Trial workspace can't change plans

**Expected Behavior**: Trial workspaces have no Stripe subscription yet

**User Flow**:
1. User sees notice: "Free trial has no Stripe subscription"
2. User clicks "View Billing Settings"
3. User subscribes to paid plan via existing checkout flow
4. After subscription active, user can change plans

---

### Issue: Plan change doesn't reflect in dashboard immediately

**Cause**: Webhook processing delay or Firestore sync lag

**Debug**:
1. Check Stripe webhook logs for `customer.subscription.updated`
2. Check Firestore `workspaces` collection for `updatedAt` timestamp
3. Verify `workspace.plan` and `workspace.billing.stripePriceId` updated

**Timeline**:
- Checkout completion: 0-5 seconds
- Webhook delivery: 1-30 seconds
- Firestore sync: 1-5 seconds
- **Total expected**: Up to 40 seconds

**User Guidance**: "Your plan change is processing. Please allow up to 1 minute for the update to appear."

---

## Future Enhancements

### Phase 7 Task 4: Usage-Based Alerts

- Show warnings when approaching plan limits
- Suggest upgrades when usage exceeds current plan
- Proactive plan change recommendations

### Admin Override

- Allow admins to change plans for any workspace
- Skip eligibility checks with audit logging
- Manual proration adjustments

### Custom Plans

- Support custom pricing for enterprise customers
- Price IDs not in standard mapping
- Custom limits and features

### Plan Comparison Table

- Side-by-side feature comparison
- Highlight differences between plans
- Show what user gains/loses on change

### Downgrade Protection

- Warn users if downgrade will disable features
- Show impact on existing players/games
- Require confirmation before downgrade

---

## Related Documentation

- **Phase 7 Task 1**: Customer Portal Integration (`6767-REF-hustle-customer-portal.md`)
- **Phase 7 Task 2**: Workspace Health Dashboard (`6771-REF-hustle-workspace-health.md`)
- **Stripe Plan Mapping**: `src/lib/stripe/plan-mapping.ts`
- **Workspace Enforcement**: `src/lib/workspaces/enforce.ts`
- **Firestore Schema**: `src/types/firestore.ts`

---

## Changelog

- **2025-11-16**: Initial reference documentation created (Phase 7 Task 3)

---

**End of Reference: 6772-REF-hustle-plan-change-flow.md**
