# Hustle Stripe Pricing & Workspace Mapping - Design Document

**Document Type**: Planning - Design
**Phase**: Phase 5 - Customer Workspaces, Stripe Billing, and Go-Live Guardrails
**Task**: Task 2 - Stripe Product & Pricing Model - System Design
**Status**: APPROVED
**Created**: 2025-11-16

---

## Overview

This document defines how Hustle workspaces map to Stripe products and prices, subscription lifecycle integration, and the role of Stripe as the billing source of truth. This design enables workspace-based billing with clear plan tiers and usage limits.

---

## Pricing Tiers & Plan Features

### **Plan Comparison Table**

| Feature | Free Trial | Starter | Plus | Pro |
|---------|-----------|---------|------|-----|
| **Price** | $0 | $9/mo | $19/mo | $39/mo |
| **Duration** | 14 days | Monthly | Monthly | Monthly |
| **Max Players** | 2 | 5 | 15 | Unlimited |
| **Max Games/Month** | 10 | 50 | 200 | Unlimited |
| **Game Verification** | ✅ | ✅ | ✅ | ✅ |
| **Basic Stats** | ✅ | ✅ | ✅ | ✅ |
| **Advanced Analytics** | ❌ | ❌ | ✅ | ✅ |
| **Export Reports** | ❌ | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ❌ | ✅ |
| **Storage (Photos/Videos)** | 100MB | 500MB | 2GB | 10GB |

---

## Stripe Product & Price Structure

### **Product Setup in Stripe Dashboard**

**Product 1: Hustle Starter Plan**
- **Name**: Hustle Starter
- **Description**: Perfect for families tracking 1-5 youth soccer players
- **Price ID**: `price_starter_monthly` (placeholder - set after Stripe creation)
- **Amount**: $9.00 USD
- **Billing Period**: Monthly (recurring)
- **Currency**: USD

**Product 2: Hustle Plus Plan**
- **Name**: Hustle Plus
- **Description**: For larger families or part-time coaches tracking up to 15 players
- **Price ID**: `price_plus_monthly` (placeholder)
- **Amount**: $19.00 USD
- **Billing Period**: Monthly (recurring)
- **Currency**: USD

**Product 3: Hustle Pro Plan**
- **Name**: Hustle Pro
- **Description**: Unlimited players and games for full-time coaches and clubs
- **Price ID**: `price_pro_monthly` (placeholder)
- **Amount**: $39.00 USD
- **Billing Period**: Monthly (recurring)
- **Currency**: USD

**Note**: Free trial is NOT a Stripe product - it's a workspace status managed in Firestore.

---

## Workspace Plan ↔ Stripe Price Mapping

### **Configuration (Environment Variables)**

Store Stripe price IDs in environment variables for easy updates:

```bash
# .env (local development - uses Stripe test mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_STARTER="price_test_starter_xxx"
STRIPE_PRICE_ID_PLUS="price_test_plus_xxx"
STRIPE_PRICE_ID_PRO="price_test_pro_xxx"

# Production (Secret Manager)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_STARTER="price_live_starter_xxx"
STRIPE_PRICE_ID_PLUS="price_live_plus_xxx"
STRIPE_PRICE_ID_PRO="price_live_pro_xxx"
```

### **Mapping Function**

**Code**: `src/lib/stripe/plan-mapping.ts`

```typescript
import { WorkspacePlan } from '@/types/firestore';

/**
 * Map workspace plan to Stripe price ID
 */
export function getPriceIdForPlan(plan: WorkspacePlan): string {
  const priceIds = {
    free: null, // Free trial has no Stripe price
    starter: process.env.STRIPE_PRICE_ID_STARTER!,
    plus: process.env.STRIPE_PRICE_ID_PLUS!,
    pro: process.env.STRIPE_PRICE_ID_PRO!,
  };

  const priceId = priceIds[plan];
  if (!priceId) {
    throw new Error(`No Stripe price ID for plan: ${plan}`);
  }

  return priceId;
}

/**
 * Map Stripe price ID to workspace plan
 */
export function getPlanForPriceId(priceId: string): WorkspacePlan {
  const plans: Record<string, WorkspacePlan> = {
    [process.env.STRIPE_PRICE_ID_STARTER!]: 'starter',
    [process.env.STRIPE_PRICE_ID_PLUS!]: 'plus',
    [process.env.STRIPE_PRICE_ID_PRO!]: 'pro',
  };

  const plan = plans[priceId];
  if (!plan) {
    throw new Error(`Unknown Stripe price ID: ${priceId}`);
  }

  return plan;
}

/**
 * Get plan limits for enforcement
 */
export function getPlanLimits(plan: WorkspacePlan) {
  const limits = {
    free: {
      maxPlayers: 2,
      maxGamesPerMonth: 10,
      storageMB: 100,
    },
    starter: {
      maxPlayers: 5,
      maxGamesPerMonth: 50,
      storageMB: 500,
    },
    plus: {
      maxPlayers: 15,
      maxGamesPerMonth: 200,
      storageMB: 2048, // 2GB
    },
    pro: {
      maxPlayers: 9999, // Effectively unlimited
      maxGamesPerMonth: 9999, // Effectively unlimited
      storageMB: 10240, // 10GB
    },
  };

  return limits[plan];
}
```

---

## Subscription Lifecycle Integration

### **Workspace Creation Flow**

**Scenario 1: Free Trial (Default)**

```mermaid
User Signs Up
    ↓
Create Firebase Auth Account
    ↓
Create User Document (/users/{userId})
    ↓
Create Free Trial Workspace
    - plan: 'free'
    - status: 'trial'
    - billing.currentPeriodEnd: +14 days
    - billing.stripeCustomerId: null
    - billing.stripeSubscriptionId: null
    ↓
User Document Updated
    - defaultWorkspaceId = workspace.id
    - ownedWorkspaces = [workspace.id]
    ↓
User Can Use App (14-day trial)
```

**Scenario 2: Paid Plan from Start** (future - not implemented in Task 3)

```mermaid
User Signs Up
    ↓
Create Firebase Auth Account
    ↓
Create User Document
    ↓
Create Trial Workspace (temporary)
    ↓
Redirect to Stripe Checkout
    ↓
User Completes Payment
    ↓
Stripe Webhook: checkout.session.completed
    ↓
Update Workspace:
    - plan: 'starter'|'plus'|'pro'
    - status: 'active'
    - billing.stripeCustomerId
    - billing.stripeSubscriptionId
    - billing.currentPeriodEnd
```

---

### **Stripe Checkout Session Creation**

**API Endpoint**: `POST /api/billing/create-checkout-session`

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
  "sessionUrl": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**Implementation** (Task 3):
```typescript
import Stripe from 'stripe';
import { getWorkspaceById, updateWorkspaceBilling } from '@/lib/firebase/services/workspaces';

export async function POST(request: Request) {
  const session = await auth(); // Firebase session
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId, priceId } = await request.json();

  // Verify workspace ownership
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace || workspace.ownerUserId !== session.user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Create or retrieve Stripe customer
  let customerId = workspace.billing.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: {
        workspaceId,
        userId: session.user.id,
      },
    });
    customerId = customer.id;

    // Save customer ID immediately
    await updateWorkspaceBilling(workspaceId, {
      stripeCustomerId: customerId,
    });
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_WEBSITE_DOMAIN}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_WEBSITE_DOMAIN}/dashboard?checkout=canceled`,
    metadata: {
      workspaceId,
    },
  });

  return Response.json({ sessionUrl: checkoutSession.url });
}
```

---

### **Stripe Webhook Event Handling**

**API Endpoint**: `POST /api/billing/webhook`

**Webhook Events to Handle**:

#### **1. `checkout.session.completed`**

**When**: User completes payment for first subscription

**Action**:
```typescript
const session = event.data.object as Stripe.Checkout.Session;
const workspaceId = session.metadata.workspaceId;
const customerId = session.customer as string;
const subscriptionId = session.subscription as string;

// Fetch subscription details
const subscription = await stripe.subscriptions.retrieve(subscriptionId);
const priceId = subscription.items.data[0].price.id;
const plan = getPlanForPriceId(priceId);

// Update workspace
await updateWorkspace(workspaceId, {
  plan,
  status: 'active',
});

await updateWorkspaceBilling(workspaceId, {
  stripeCustomerId: customerId,
  stripeSubscriptionId: subscriptionId,
  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
});
```

---

#### **2. `customer.subscription.updated`**

**When**: Subscription changes (upgrade, downgrade, renewal)

**Action**:
```typescript
const subscription = event.data.object as Stripe.Subscription;
const customerId = subscription.customer as string;

// Find workspace by Stripe customer ID
const workspace = await getWorkspaceByStripeCustomerId(customerId);
if (!workspace) {
  console.error('Workspace not found for customer:', customerId);
  return;
}

const priceId = subscription.items.data[0].price.id;
const plan = getPlanForPriceId(priceId);
const status = mapStripeStatusToWorkspaceStatus(subscription.status);

// Update workspace
await updateWorkspace(workspace.id, { plan, status });
await updateWorkspaceBilling(workspace.id, {
  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
});
```

---

#### **3. `customer.subscription.deleted`**

**When**: Subscription canceled (immediate or end of period)

**Action**:
```typescript
const subscription = event.data.object as Stripe.Subscription;
const customerId = subscription.customer as string;

const workspace = await getWorkspaceByStripeCustomerId(customerId);
if (!workspace) return;

// Mark workspace as canceled
await updateWorkspaceStatus(workspace.id, 'canceled');

// Keep access until current_period_end
await updateWorkspaceBilling(workspace.id, {
  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
});
```

---

#### **4. `invoice.payment_failed`**

**When**: Payment fails (card declined, insufficient funds)

**Action**:
```typescript
const invoice = event.data.object as Stripe.Invoice;
const customerId = invoice.customer as string;

const workspace = await getWorkspaceByStripeCustomerId(customerId);
if (!workspace) return;

// Move to past_due status (grace period)
await updateWorkspaceStatus(workspace.id, 'past_due');

// Optionally: Send email notification to user
```

---

#### **5. `invoice.payment_succeeded`**

**When**: Payment succeeds (renewal or retry after failure)

**Action**:
```typescript
const invoice = event.data.object as Stripe.Invoice;
const customerId = invoice.customer as string;
const subscriptionId = invoice.subscription as string;

const workspace = await getWorkspaceByStripeCustomerId(customerId);
if (!workspace) return;

// Restore to active status
await updateWorkspaceStatus(workspace.id, 'active');

// Update renewal date
const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
await updateWorkspaceBilling(workspace.id, {
  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
});
```

---

## Stripe Status ↔ Workspace Status Mapping

**Mapping Function**:

```typescript
import type { WorkspaceStatus } from '@/types/firestore';
import type Stripe from 'stripe';

export function mapStripeStatusToWorkspaceStatus(
  stripeStatus: Stripe.Subscription.Status
): WorkspaceStatus {
  const statusMap: Record<Stripe.Subscription.Status, WorkspaceStatus> = {
    active: 'active',
    trialing: 'trial', // Should not happen (we manage trials in Firestore)
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'suspended',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
    paused: 'suspended', // Stripe Billing pause feature
  };

  return statusMap[stripeStatus] || 'suspended';
}
```

---

## Cancellation & Failed Payment Behavior

### **Cancellation Flow**

**User-Initiated Cancel**:
```typescript
// User clicks "Cancel Subscription" in settings
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

await stripe.subscriptions.update(workspace.billing.stripeSubscriptionId!, {
  cancel_at_period_end: true, // Keep access until renewal date
});

// Webhook: customer.subscription.updated (with cancel_at_period_end=true)
await updateWorkspaceStatus(workspace.id, 'canceled');
// Access continues until current_period_end
```

**What Happens**:
1. User retains access until `current_period_end`
2. Workspace status: `canceled`
3. No further charges
4. After `current_period_end`:
   - Webhook: `customer.subscription.deleted`
   - Workspace status remains `canceled`
   - User can no longer log games or create players
   - Data retained for 90 days (soft delete policy)

---

### **Failed Payment Flow**

**Payment Failure**:
```mermaid
Payment Fails (card declined)
    ↓
Webhook: invoice.payment_failed
    ↓
Workspace Status: past_due
    ↓
User Notified via Email
    ↓
Grace Period (7 days)
    ↓
Stripe Retries Payment (automatic)
    ↓
If Success:
    Webhook: invoice.payment_succeeded
    Workspace Status: active
    ↓
If All Retries Fail:
    Webhook: customer.subscription.deleted
    Workspace Status: canceled
```

**Grace Period Behavior**:
- **Days 0-7**: Status = `past_due`, full access (read/write)
- **After 7 days**: Stripe cancels subscription → Status = `canceled`, read-only access

---

## Role of Stripe in Stack

### **Stripe = Billing Source of Truth**

**Stripe Owns**:
- Customer records (`stripe.customers`)
- Subscription records (`stripe.subscriptions`)
- Payment methods (`stripe.paymentMethods`)
- Invoice history (`stripe.invoices`)
- Payment retry logic
- Subscription lifecycle (active → past_due → canceled)

**Firestore Owns**:
- User profile data
- Workspace metadata (name, ownerUserId)
- Player and game data
- Usage counters (denormalized)

**Firestore Mirrors** (denormalized from Stripe):
- `workspace.billing.stripeCustomerId`
- `workspace.billing.stripeSubscriptionId`
- `workspace.billing.currentPeriodEnd`
- `workspace.plan` (derived from Stripe price ID)
- `workspace.status` (derived from Stripe subscription status)

**Why Denormalize?**
- **Performance**: Check plan limits without Stripe API call on every request
- **Offline Capability**: Frontend can show plan/status without network call
- **Audit Trail**: Workspace status history preserved in Firestore

**Sync Strategy**:
- Stripe webhooks update Firestore (webhook → Firestore write)
- Firestore NEVER writes to Stripe (except checkout session creation)
- If data conflicts: Stripe wins (use webhook to re-sync)

---

## Edge Cases & Error Handling

### **Edge Case 1: Webhook Fails to Deliver**

**Problem**: Stripe sends webhook, but our endpoint is down or times out.

**Solution**:
- Stripe retries webhooks automatically (up to 3 days)
- Log all webhook events to Cloud Logging
- Manual re-sync endpoint: `POST /api/billing/sync-from-stripe`
  - Fetches current subscription status from Stripe API
  - Updates Firestore to match

---

### **Edge Case 2: User Subscribes Before Workspace Created**

**Problem**: Race condition - Stripe webhook arrives before workspace document exists.

**Solution**:
- Checkout session creation REQUIRES existing workspace ID
- Workspace MUST exist before Stripe checkout link is shown
- Webhook handler checks workspace existence, retries if not found (max 3 times)

---

### **Edge Case 3: User Changes Payment Method**

**Problem**: User updates credit card in Stripe Customer Portal.

**Solution**:
- No action needed in Firestore
- Stripe handles payment method updates
- Next invoice uses new payment method automatically

---

### **Edge Case 4: Refund Requested**

**Problem**: User requests refund for current billing period.

**Solution**:
- Process refund in Stripe Dashboard manually
- Webhook: `charge.refunded`
- Optionally: Mark workspace as `canceled` or leave as `active` (business decision)
- Document refund policy in Terms of Service

---

## Subscription Pricing Strategy

### **Monthly Recurring Billing**

- All plans billed monthly on subscription start date anniversary
- Example: Subscribe on Jan 15 → Next bill on Feb 15

### **No Annual Plans (Phase 5)**

- Annual plans deferred to Phase 6
- Reason: Simplify initial implementation
- Future: Add annual plans with 2-month discount (e.g., $108/year for Starter vs $108 monthly)

### **No Metered Billing (Phase 5)**

- Usage-based pricing (per-game charges) deferred to Phase 6
- Reason: Complexity of metered billing + invoice reconciliation
- Current: Fixed monthly price regardless of usage (within plan limits)

### **No Free Forever Plan**

- Free tier is 14-day trial only
- After trial: User must subscribe or lose write access
- Read-only access for 30 days after trial expiration (grace period for data export)

---

## Customer Portal Integration (Future - Phase 6)

**Stripe Customer Portal**:
- Allows users to:
  - Update payment method
  - View invoice history
  - Cancel subscription
  - Update billing address

**Implementation** (Phase 6):
```typescript
const portalSession = await stripe.billingPortal.sessions.create({
  customer: workspace.billing.stripeCustomerId!,
  return_url: `${process.env.NEXT_PUBLIC_WEBSITE_DOMAIN}/dashboard/settings`,
});

// Redirect user to portalSession.url
```

**Not Included in Phase 5**: Manual payment method updates only (contact support).

---

## Testing Strategy

### **Stripe Test Mode**

**Environment**:
- Use Stripe test API keys (`sk_test_...`)
- Use test price IDs (`price_test_...`)
- Test mode has separate customers/subscriptions from production

**Test Cards**:
```bash
# Successful payment
4242 4242 4242 4242  (any future expiry, any CVC)

# Payment requires authentication (3D Secure)
4000 0025 0000 3155

# Card declined
4000 0000 0000 9995

# Insufficient funds
4000 0000 0000 9995
```

**Webhook Testing**:
```bash
# Use Stripe CLI to forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/billing/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
```

---

## Migration Path from Free Trial

**Scenario**: User finishes 14-day trial, wants to subscribe.

**Flow**:
1. User clicks "Upgrade" button in dashboard
2. Frontend calls `POST /api/billing/create-checkout-session`
   - `workspaceId`: User's current workspace
   - `priceId`: Selected plan (starter/plus/pro)
3. User redirected to Stripe Checkout
4. User enters payment info and completes
5. Webhook: `checkout.session.completed`
   - Workspace plan: `free` → `starter`
   - Workspace status: `trial` → `active`
   - Billing fields populated
6. User redirected to dashboard with success message

**Data Preservation**:
- All players and games created during trial are retained
- Usage counters continue from current values
- Workspace ID remains unchanged

---

## Success Criteria

- [ ] Pricing tiers defined (Free, Starter, Plus, Pro)
- [ ] Plan limits documented (max players, max games)
- [ ] Stripe product/price structure defined
- [ ] Workspace plan ↔ Stripe price mapping designed
- [ ] Subscription lifecycle flows documented
- [ ] Webhook event handlers designed
- [ ] Status mapping (Stripe ↔ Workspace) defined
- [ ] Cancellation and failed payment flows documented
- [ ] Edge cases identified and solutions designed
- [ ] Testing strategy outlined

---

**Status**: APPROVED for implementation
**Next Step**: Task 3 - Implement Stripe checkout and webhook integration

---

**Timestamp**: 2025-11-16
