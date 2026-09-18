# Phase 5 Task 3: Stripe Checkout & Webhooks - Mini AAR

**Timestamp**: 2025-11-16
**Phase**: Phase 5 - Customer Workspaces, Stripe Billing, and Go-Live Guardrails
**Task**: Task 3 - Stripe Integration - Checkout, Webhooks, Workspace Sync
**Status**: ✅ COMPLETE

---

## Overview

Successfully implemented core Stripe billing integration for Hustle workspaces. Created checkout session API, comprehensive webhook handler for 5 subscription lifecycle events, plan mapping utilities, and UI components. Stripe is now the billing source of truth with Firestore as a denormalized mirror for performance.

---

## Implementation Summary

### **Components Created**

1. **Plan Mapping Utilities** - `src/lib/stripe/plan-mapping.ts`
2. **Checkout Session API** - `src/app/api/billing/create-checkout-session/route.ts`
3. **Webhook Handler API** - `src/app/api/billing/webhook/route.ts`
4. **Upgrade Button Component** - `src/components/UpgradeButton.tsx`
5. **Environment Variables** - Updated `.env.example`

---

## Plan Mapping Utilities

**File**: `src/lib/stripe/plan-mapping.ts`

**Functions Implemented**:

1. **`getPriceIdForPlan(plan)`**
   - Maps workspace plan → Stripe price ID
   - Throws error for 'free' plan (no Stripe price)
   - Validates price ID exists in environment variables

2. **`getPlanForPriceId(priceId)`**
   - Maps Stripe price ID → workspace plan
   - Throws error for unknown price IDs

3. **`getPlanLimits(plan)`**
   - Returns plan limits object:
     - `maxPlayers`, `maxGamesPerMonth`, `storageMB`
   - Used for enforcement in Task 4

4. **`mapStripeStatusToWorkspaceStatus(stripeStatus)`**
   - Maps Stripe subscription status → workspace status
   - Handles 8 Stripe statuses: active, trialing, past_due, canceled, unpaid, incomplete, incomplete_expired, paused

5. **`getPlanDisplayName(plan)`**
   - Returns human-readable plan name (e.g., "Starter", "Plus", "Pro")

6. **`getPlanPrice(plan)`**
   - Returns monthly price in USD (0, 9, 19, 39)

7. **`planHasFeature(plan, feature)`**
   - Checks if plan includes a specific feature
   - Features: game_verification, basic_stats, advanced_analytics, export_reports, priority_support

---

## Checkout Session API

**Endpoint**: `POST /api/billing/create-checkout-session`

**File**: `src/app/api/billing/create-checkout-session/route.ts`

**Request Body**:
```json
{
  "workspaceId": "ws_abc123",
  "priceId": "price_starter_monthly"
}
```

**Response**:
```json
{
  "sessionUrl": "https://checkout.stripe.com/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

**Flow**:
1. Authenticate user (Firebase session)
2. Validate request body (Zod schema)
3. Verify workspace ownership (user must own workspace)
4. Create or retrieve Stripe customer
   - Save `stripeCustomerId` to workspace immediately
5. Create Stripe Checkout Session
   - Mode: 'subscription'
   - Success URL: `/dashboard?checkout=success`
   - Cancel URL: `/dashboard?checkout=canceled`
   - Metadata: `workspaceId`, `userId`
   - Features: Promo codes enabled, auto-collect billing address
6. Return checkout URL to frontend

**Error Handling**:
- 401 Unauthorized (no session)
- 400 Bad Request (invalid request body)
- 404 Not Found (workspace not found)
- 403 Forbidden (user doesn't own workspace)
- 400 Stripe Card Error
- 400 Stripe Invalid Request Error
- 500 Internal Server Error

---

## Webhook Handler API

**Endpoint**: `POST /api/billing/webhook`

**File**: `src/app/api/billing/webhook/route.ts`

**Security**:
- Verifies Stripe webhook signature using `STRIPE_WEBHOOK_SECRET`
- Rejects requests with invalid or missing signatures
- Uses raw body for signature verification (Next.js requirement)

**Events Handled** (5 total):

### **1. `checkout.session.completed`**

**Trigger**: User completes first payment

**Actions**:
1. Extract `workspaceId` from session metadata
2. Get `customerId` and `subscriptionId` from session
3. Fetch subscription details from Stripe API
4. Map price ID → workspace plan
5. Map Stripe status → workspace status
6. Update workspace: `plan`, `status`
7. Update billing: `stripeCustomerId`, `stripeSubscriptionId`, `currentPeriodEnd`

**Code Highlight**:
```typescript
const subscription = await stripe.subscriptions.retrieve(subscriptionId);
const priceId = subscription.items.data[0].price.id;
const plan = getPlanForPriceId(priceId);
const status = mapStripeStatusToWorkspaceStatus(subscription.status);

await updateWorkspace(workspaceId, { plan, status });
await updateWorkspaceBilling(workspaceId, {
  stripeCustomerId: customerId,
  stripeSubscriptionId: subscriptionId,
  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
});
```

---

### **2. `customer.subscription.updated`**

**Trigger**: Subscription changes (upgrade, downgrade, renewal, status change)

**Actions**:
1. Find workspace by `stripeCustomerId`
2. Map price ID → plan
3. Map Stripe status → workspace status
4. Update workspace: `plan`, `status`
5. Update billing: `currentPeriodEnd`

**Use Cases**:
- User upgrades Starter → Plus
- User downgrades Pro → Starter
- Subscription auto-renewed (status remains active, period end updates)
- Subscription moved to past_due (payment failed)

---

### **3. `customer.subscription.deleted`**

**Trigger**: Subscription canceled (immediate or at period end)

**Actions**:
1. Find workspace by `stripeCustomerId`
2. Update workspace status: `canceled`
3. Keep `currentPeriodEnd` for grace period access

**User Experience**:
- If `cancel_at_period_end=true`: User retains access until `currentPeriodEnd`
- After `currentPeriodEnd`: Workspace becomes read-only (enforced in Task 4)

---

### **4. `invoice.payment_failed`**

**Trigger**: Payment fails (card declined, insufficient funds, expired card)

**Actions**:
1. Find workspace by `stripeCustomerId`
2. Update workspace status: `past_due`
3. User gets 7-day grace period with full access
4. TODO: Send email notification (deferred to Phase 6)

**Stripe Behavior**:
- Stripe auto-retries payment (up to 4 attempts over 7 days)
- If all retries fail: Subscription canceled → `customer.subscription.deleted` event

---

### **5. `invoice.payment_succeeded`**

**Trigger**: Payment succeeds (renewal or retry after failure)

**Actions**:
1. Find workspace by `stripeCustomerId`
2. Update workspace status: `active`
3. Update billing: `currentPeriodEnd` (from subscription)

**Use Cases**:
- Monthly renewal successful
- Payment retry succeeds after initial failure (status: past_due → active)

---

## Webhook Logging

**Console Logging** (for debugging):
```typescript
console.log(`Stripe webhook received: ${event.type}`, {
  eventId: event.id,
  created: new Date(event.created * 1000).toISOString(),
});

console.log('Checkout completed:', {
  workspaceId,
  plan,
  status,
  subscriptionId,
});
```

**Production**: Logs sent to Google Cloud Logging via Next.js stdout.

**Missing Workspace Handling**:
- Logs error if workspace not found for customer ID
- Returns 200 (acknowledged) to Stripe to prevent retries
- Admin can manually re-sync using `/api/billing/sync-from-stripe` (TODO: Task 6)

---

## UI Components

### **UpgradeButton Component**

**File**: `src/components/UpgradeButton.tsx`

**Props**:
```typescript
interface UpgradeButtonProps {
  workspaceId: string;
  currentPlan: WorkspacePlan;
  targetPlan: 'starter' | 'plus' | 'pro';
  priceId: string;
  className?: string;
}
```

**Features**:
- Loading state with spinner
- Error display
- Disabled state for current plan
- "Upgrade" vs "Downgrade" button text
- Calls checkout session API
- Redirects to Stripe Checkout on success

**Usage Example**:
```tsx
import { UpgradeButton } from '@/components/UpgradeButton';

<UpgradeButton
  workspaceId={workspace.id}
  currentPlan={workspace.plan}
  targetPlan="plus"
  priceId={process.env.STRIPE_PRICE_ID_PLUS!}
/>
```

---

## Environment Variables

**Updated**: `.env.example`

**Added Variables**:
```bash
# Stripe Billing (Phase 5)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Stripe Price IDs (set after product creation)
STRIPE_PRICE_ID_STARTER="price_test_starter_placeholder"
STRIPE_PRICE_ID_PLUS="price_test_plus_placeholder"
STRIPE_PRICE_ID_PRO="price_test_pro_placeholder"
```

**Secret Manager** (for production):
- Store all 5 variables in Google Cloud Secret Manager
- Map in Cloud Run deployment: `--set-secrets "STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest"`

---

## Stripe SDK Installation

**Package**: `stripe@latest`

**Installed**: Version compatible with API version `2025-01-27.acacia`

**Command**:
```bash
npm install stripe
```

**Usage**:
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});
```

---

## Subscription Lifecycle Flow (End-to-End)

### **Scenario: User Upgrades from Free Trial to Starter**

**Step 1: User Clicks "Upgrade"**
```
User clicks UpgradeButton component
    ↓
Frontend calls: POST /api/billing/create-checkout-session
    {
      "workspaceId": "ws_abc123",
      "priceId": "price_starter_monthly"
    }
```

**Step 2: Checkout Session Created**
```
API verifies workspace ownership
    ↓
Creates Stripe customer (if not exists)
    ↓
Saves stripeCustomerId to workspace
    ↓
Creates Stripe Checkout Session
    ↓
Returns sessionUrl to frontend
```

**Step 3: User Redirected to Stripe**
```
Frontend: window.location.href = sessionUrl
    ↓
User enters payment info on Stripe Checkout page
    ↓
User completes payment
```

**Step 4: Stripe Sends Webhook**
```
Stripe: POST /api/billing/webhook
    Event: checkout.session.completed
    ↓
Webhook handler verifies signature
    ↓
Extracts workspaceId from metadata
    ↓
Fetches subscription from Stripe API
    ↓
Updates workspace:
      plan: 'free' → 'starter'
      status: 'trial' → 'active'
    ↓
Updates billing:
      stripeSubscriptionId
      currentPeriodEnd (30 days from now)
```

**Step 5: User Returned to App**
```
Stripe redirects: /dashboard?checkout=success
    ↓
Dashboard shows success message
    ↓
Workspace plan updated (visible in UI)
    ↓
User has full Starter plan access (5 players, 50 games/month)
```

---

## Testing Strategy

### **Local Testing with Stripe CLI**

**Install Stripe CLI**:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login
```

**Forward Webhooks to Localhost**:
```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

**Trigger Test Events**:
```bash
# Test checkout completed
stripe trigger checkout.session.completed

# Test payment failed
stripe trigger invoice.payment_failed

# Test payment succeeded
stripe trigger invoice.payment_succeeded

# Test subscription updated
stripe trigger customer.subscription.updated
```

**Webhook Secret**:
- Stripe CLI outputs webhook secret: `whsec_...`
- Copy to `.env.local`: `STRIPE_WEBHOOK_SECRET="whsec_..."`

---

### **Test Cards (Stripe Test Mode)**

**Successful Payment**:
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

**Payment Declined**:
```
Card: 4000 0000 0000 9995
```

**Requires 3D Secure Authentication**:
```
Card: 4000 0025 0000 3155
```

**Insufficient Funds**:
```
Card: 4000 0000 0000 9995
```

---

## Error Handling & Edge Cases

### **Edge Case 1: Webhook Before Workspace Exists**

**Problem**: Race condition - webhook arrives before workspace document created.

**Current Handling**:
- Logs error: "Workspace not found for customer: ..."
- Returns 200 to Stripe (acknowledged)
- Stripe will NOT retry (200 response)

**Future Fix** (Task 6):
- Retry logic with exponential backoff (max 3 attempts)
- Manual re-sync endpoint: `POST /api/billing/sync-from-stripe`

---

### **Edge Case 2: Multiple Subscriptions for Same Workspace**

**Problem**: User creates multiple subscriptions for same workspace.

**Current Handling**:
- Latest subscription wins (overwrites `stripeSubscriptionId`)
- Old subscription remains active in Stripe (orphaned)

**Prevention**:
- Checkout session creation checks for existing subscription
- If exists: Cancel old subscription before creating new (TODO: Task 6)

---

### **Edge Case 3: Webhook Signature Verification Fails**

**Problem**: Invalid signature (man-in-the-middle attack or misconfigured secret).

**Current Handling**:
- Returns 400 Bad Request
- Logs error: "Webhook signature verification failed"
- Stripe retries webhook (up to 3 days)

**Fix**:
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Use Stripe CLI webhook secret for local testing

---

## Security Considerations

### **Webhook Signature Verification**

**Implementation**:
```typescript
const event = stripe.webhooks.constructEvent(
  body,  // Raw request body
  signature,  // Stripe-Signature header
  webhookSecret
);
```

**Why Important**:
- Prevents spoofed webhook requests
- Ensures webhook came from Stripe
- Required for production

---

### **Secrets Management**

**Development** (`.env.local`):
- Stripe test keys
- Webhook secret from Stripe CLI

**Production** (Secret Manager):
- Stripe live keys
- Webhook secret from Stripe Dashboard
- Injected into Cloud Run via `--set-secrets`

**NEVER Commit**:
- `.env.local` (in `.gitignore`)
- Stripe secret keys to Git

---

## Known Limitations (Phase 5)

**Deferred to Phase 6**:
1. **Email Notifications**: Payment failed, subscription canceled
2. **Customer Portal**: Self-service payment method updates
3. **Promo Codes Management**: Admin dashboard for creating coupons
4. **Subscription Re-sync Endpoint**: Manual Stripe → Firestore sync
5. **Orphaned Subscription Cleanup**: Cancel old subscriptions before creating new
6. **Invoice History**: Display past invoices in dashboard
7. **Plan Change Preview**: Show proration before upgrade/downgrade

---

## Next Steps (Task 4)

**Plan Limit Enforcement**:
- [ ] Add limit checks to `createPlayer()` function
- [ ] Add limit checks to `createGame()` function
- [ ] Return structured error when limit exceeded
- [ ] Add UI upgrade prompts when limit hit

**Usage Counter Updates**:
- [ ] Call `incrementPlayerCount()` after player created
- [ ] Call `decrementPlayerCount()` after player deleted
- [ ] Call `incrementGamesThisMonth()` after game created
- [ ] Implement monthly reset Cloud Function (cron job)

---

## Files Changed Summary

### **Created (5 files)**

1. `src/lib/stripe/plan-mapping.ts` - Plan mapping utilities (7 functions)
2. `src/app/api/billing/create-checkout-session/route.ts` - Checkout API
3. `src/app/api/billing/webhook/route.ts` - Webhook handler (5 events)
4. `src/components/UpgradeButton.tsx` - UI upgrade button
5. `000-docs/213-AA-MAAR-hustle-phase5-task3-stripe-checkout-and-webhooks.md` - This AAR

### **Modified (2 files)**

1. `.env.example` - Added Stripe environment variables
2. `package.json` - Added `stripe` dependency (via npm install)

---

## Success Criteria Met ✅

- [x] Stripe SDK installed and configured
- [x] Plan mapping utilities implemented (7 functions)
- [x] Checkout session creation API endpoint
- [x] Webhook handler with 5 event types
- [x] Webhook signature verification
- [x] Workspace ↔ Stripe synchronization
- [x] Error handling for common scenarios
- [x] Environment variables configured
- [x] UI upgrade button component
- [x] Testing strategy documented (Stripe CLI + test cards)
- [x] Security considerations addressed

---

**End of Mini AAR - Task 3 Complete** ✅

---

**Next Task**: Task 4 - Enforce Plan Limits (Players, Games, Access)

---

**Timestamp**: 2025-11-16
