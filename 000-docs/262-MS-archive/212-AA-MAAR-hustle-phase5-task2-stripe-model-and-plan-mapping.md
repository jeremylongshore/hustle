# Phase 5 Task 2: Stripe Model & Plan Mapping - Mini AAR

**Timestamp**: 2025-11-16
**Phase**: Phase 5 - Customer Workspaces, Stripe Billing, and Go-Live Guardrails
**Task**: Task 2 - Stripe Product & Pricing Model - System Design
**Status**: ✅ COMPLETE

---

## Overview

Successfully designed comprehensive Stripe billing integration for Hustle workspaces. Defined 4 pricing tiers (Free Trial, Starter, Plus, Pro) with clear feature limits, mapped workspace plans to Stripe products/prices, and documented complete subscription lifecycle including checkout, webhooks, cancellations, and failed payments.

---

## Pricing Tiers Defined

### **Plan Summary**

| Plan | Price | Max Players | Max Games/Month | Storage |
|------|-------|-------------|-----------------|---------|
| **Free Trial** | $0 (14 days) | 2 | 10 | 100MB |
| **Starter** | $9/mo | 5 | 50 | 500MB |
| **Plus** | $19/mo | 15 | 200 | 2GB |
| **Pro** | $39/mo | Unlimited (9999) | Unlimited (9999) | 10GB |

**Key Features by Tier**:
- **All Plans**: Game verification, basic stats
- **Plus & Pro**: Advanced analytics
- **Pro Only**: Export reports, priority support

**Trial Strategy**:
- 14-day free trial (no credit card required)
- Full Starter plan features during trial
- Limits enforced: 2 players, 10 games max

---

## Stripe Product Structure

### **Products to Create in Stripe Dashboard**

**Product 1: Hustle Starter**
- Name: "Hustle Starter"
- Description: "Perfect for families tracking 1-5 youth soccer players"
- Price: $9.00 USD/month (recurring)
- Price ID Placeholder: `price_starter_monthly`

**Product 2: Hustle Plus**
- Name: "Hustle Plus"
- Description: "For larger families or part-time coaches tracking up to 15 players"
- Price: $19.00 USD/month (recurring)
- Price ID Placeholder: `price_plus_monthly`

**Product 3: Hustle Pro**
- Name: "Hustle Pro"
- Description: "Unlimited players and games for full-time coaches and clubs"
- Price: $39.00 USD/month (recurring)
- Price ID Placeholder: `price_pro_monthly`

**Note**: Actual price IDs will be set after Stripe product creation.

---

## Workspace Plan ↔ Stripe Mapping

### **Configuration Approach**

**Environment Variables** (to be added to `.env.example` and Secret Manager):

```bash
# Stripe API Keys
STRIPE_SECRET_KEY="sk_test_..."  # Test mode for development
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs (set after product creation)
STRIPE_PRICE_ID_STARTER="price_test_starter_xxx"
STRIPE_PRICE_ID_PLUS="price_test_plus_xxx"
STRIPE_PRICE_ID_PRO="price_test_pro_xxx"
```

### **Mapping Functions Designed**

**File**: `src/lib/stripe/plan-mapping.ts` (to be created in Task 3)

**Functions**:
1. `getPriceIdForPlan(plan)` - Workspace plan → Stripe price ID
2. `getPlanForPriceId(priceId)` - Stripe price ID → Workspace plan
3. `getPlanLimits(plan)` - Get max players/games for enforcement
4. `mapStripeStatusToWorkspaceStatus(status)` - Stripe subscription status → Workspace status

**Plan Limits** (for enforcement in Task 4):
```typescript
{
  free: { maxPlayers: 2, maxGamesPerMonth: 10, storageMB: 100 },
  starter: { maxPlayers: 5, maxGamesPerMonth: 50, storageMB: 500 },
  plus: { maxPlayers: 15, maxGamesPerMonth: 200, storageMB: 2048 },
  pro: { maxPlayers: 9999, maxGamesPerMonth: 9999, storageMB: 10240 }
}
```

---

## Subscription Lifecycle Integration

### **1. Workspace Creation (Free Trial)**

**Default Flow for New Users**:
```
User Signs Up (Firebase Auth)
    ↓
Create User Document
    ↓
Auto-Create Free Trial Workspace
    - plan: 'free'
    - status: 'trial'
    - billing.currentPeriodEnd: +14 days
    - billing.stripeCustomerId: null
    - billing.stripeSubscriptionId: null
    ↓
User Can Use App (14-day trial)
```

**No Credit Card Required**: Trial starts immediately without payment info.

---

### **2. Stripe Checkout Session Creation**

**API Endpoint**: `POST /api/billing/create-checkout-session` (Task 3)

**Request**:
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

**Process**:
1. Verify workspace ownership (authenticated user owns workspace)
2. Create or retrieve Stripe customer
3. Save `stripeCustomerId` to workspace immediately
4. Create Stripe Checkout Session
5. Return checkout URL to frontend
6. Redirect user to Stripe Checkout

---

### **3. Webhook Event Handling**

**API Endpoint**: `POST /api/billing/webhook` (Task 3)

**5 Key Events Documented**:

**Event 1: `checkout.session.completed`**
- Trigger: User completes first payment
- Action:
  - Update workspace: `plan = starter/plus/pro`, `status = active`
  - Save `stripeSubscriptionId` and `currentPeriodEnd`

**Event 2: `customer.subscription.updated`**
- Trigger: Plan change (upgrade/downgrade) or renewal
- Action:
  - Update workspace: `plan` and `status` from subscription
  - Update `currentPeriodEnd`

**Event 3: `customer.subscription.deleted`**
- Trigger: Subscription canceled (immediate or end-of-period)
- Action:
  - Update workspace: `status = canceled`
  - Keep `currentPeriodEnd` for grace period access

**Event 4: `invoice.payment_failed`**
- Trigger: Payment fails (card declined, insufficient funds)
- Action:
  - Update workspace: `status = past_due`
  - User gets 7-day grace period with full access
  - Optional: Send email notification

**Event 5: `invoice.payment_succeeded`**
- Trigger: Payment succeeds (renewal or retry after failure)
- Action:
  - Update workspace: `status = active`
  - Update `currentPeriodEnd` from subscription

---

## Stripe Status ↔ Workspace Status Mapping

**Mapping Table**:

| Stripe Subscription Status | Workspace Status | User Access |
|---------------------------|------------------|-------------|
| `active` | `active` | Full access |
| `trialing` | `trial` | Full access (14 days) |
| `past_due` | `past_due` | Full access (7-day grace) |
| `canceled` | `canceled` | Read-only (until period end) |
| `unpaid` | `suspended` | No access |
| `incomplete` | `past_due` | Limited access |
| `incomplete_expired` | `canceled` | No access |
| `paused` | `suspended` | No access |

**Firestore as Mirror**:
- Stripe = source of truth for billing
- Firestore = denormalized copy for performance
- Webhooks sync Stripe → Firestore
- If conflict: Stripe wins, re-sync from Stripe API

---

## Cancellation & Failed Payment Flows

### **User-Initiated Cancellation**

**Flow**:
```
User Clicks "Cancel Subscription"
    ↓
Call Stripe API:
    subscription.update({ cancel_at_period_end: true })
    ↓
Webhook: customer.subscription.updated
    ↓
Update Workspace:
    status = 'canceled'
    ↓
User Retains Access Until current_period_end
    ↓
After current_period_end:
    Webhook: customer.subscription.deleted
    ↓
Workspace Status: canceled (read-only)
    ↓
90-Day Retention Period (soft delete)
```

**Key Decision**: Access continues until paid-through date (`current_period_end`).

---

### **Payment Failure Flow**

**Flow**:
```
Payment Fails (card declined)
    ↓
Webhook: invoice.payment_failed
    ↓
Workspace Status: past_due
    ↓
User Notified via Email
    ↓
Grace Period (7 days, full access)
    ↓
Stripe Auto-Retries Payment
    ↓
If Success:
    Webhook: invoice.payment_succeeded
    Workspace Status: active
    ↓
If All Retries Fail (after 7 days):
    Webhook: customer.subscription.deleted
    Workspace Status: canceled
```

**Grace Period**: 7 days with full read/write access to allow payment method update.

---

## Role of Stripe in Tech Stack

### **Stripe Owns (Source of Truth)**

- Customer records
- Subscription records
- Payment methods
- Invoice history
- Payment retry logic
- Subscription lifecycle state machine

### **Firestore Owns**

- User profile data
- Workspace metadata (name, ownerUserId)
- Player and game data
- Usage counters (denormalized)

### **Firestore Mirrors (Denormalized from Stripe)**

- `workspace.billing.stripeCustomerId`
- `workspace.billing.stripeSubscriptionId`
- `workspace.billing.currentPeriodEnd`
- `workspace.plan` (derived from Stripe price ID)
- `workspace.status` (derived from Stripe subscription status)

**Why Denormalize?**
1. **Performance**: Check plan limits without Stripe API call on every request
2. **Offline**: Frontend can display plan/status without network
3. **Audit Trail**: Workspace status history preserved in Firestore

**Sync Strategy**:
- Stripe webhooks → Firestore writes (one-way sync)
- Firestore NEVER writes to Stripe (except checkout session creation)
- If data conflicts: Stripe wins, use `/api/billing/sync-from-stripe` to re-sync

---

## Edge Cases & Solutions

### **Edge Case 1: Webhook Delivery Failure**

**Problem**: Our endpoint is down when Stripe sends webhook.

**Solution**:
- Stripe auto-retries for 3 days
- Log all webhook events to Cloud Logging
- Manual re-sync endpoint: `POST /api/billing/sync-from-stripe`

### **Edge Case 2: Race Condition (Webhook Before Workspace)**

**Problem**: Webhook arrives before workspace document exists.

**Solution**:
- Checkout session REQUIRES existing workspace ID
- Webhook handler checks workspace existence, retries if not found (max 3 attempts)

### **Edge Case 3: User Updates Payment Method**

**Problem**: User changes credit card in Stripe.

**Solution**:
- No Firestore action needed
- Stripe handles payment method updates internally
- Next invoice uses new payment method automatically

### **Edge Case 4: Refund Request**

**Problem**: User requests refund.

**Solution**:
- Process refund manually in Stripe Dashboard
- Webhook: `charge.refunded`
- Business decision: Mark workspace as `canceled` or leave `active`
- Document refund policy in Terms of Service

---

## Pricing Strategy Decisions

### **Monthly Recurring Billing Only (Phase 5)**

- All plans billed monthly on subscription anniversary date
- Annual plans deferred to Phase 6
- Reason: Simplify initial implementation

### **No Metered Billing (Phase 5)**

- Usage-based pricing (per-game charges) deferred to Phase 6
- Current: Fixed monthly price regardless of usage (within limits)
- Reason: Complexity of metered billing + invoice reconciliation

### **No Free Forever Plan**

- Free tier = 14-day trial only
- After trial: User must subscribe or workspace becomes read-only
- 30-day read-only grace period for data export

---

## Testing Strategy

### **Stripe Test Mode**

**Environment**:
- Use test API keys (`sk_test_...`)
- Use test price IDs (`price_test_...`)
- Test mode isolated from production

**Test Cards** (Stripe provides):
```bash
# Successful payment
4242 4242 4242 4242

# Payment declined
4000 0000 0000 9995

# Requires 3D Secure authentication
4000 0025 0000 3155
```

**Webhook Testing**:
```bash
# Stripe CLI for local webhook forwarding
stripe listen --forward-to localhost:3000/api/billing/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
```

---

## Migration from Trial to Paid

**Scenario**: User completes 14-day trial, subscribes to Starter plan.

**Flow**:
1. User clicks "Upgrade" in dashboard
2. Call `POST /api/billing/create-checkout-session`
3. Redirect to Stripe Checkout
4. User enters payment and completes
5. Webhook: `checkout.session.completed`
   - Workspace: `plan = free` → `plan = starter`
   - Workspace: `status = trial` → `status = active`
   - Billing fields populated
6. User returns to dashboard with success message

**Data Preservation**:
- All trial data (players, games) retained
- Usage counters continue from current values
- Workspace ID unchanged

---

## Known TBDs (Phase 6)

**Deferred to Future Phases**:
1. **Annual Plans**: Discounted annual billing (e.g., 2 months free)
2. **Metered Billing**: Pay-per-game overage charges
3. **Customer Portal**: Self-service payment method updates
4. **Coupons/Discounts**: Promotional pricing (e.g., `LAUNCH50` for 50% off)
5. **Team Plans**: Multi-user workspaces with role-based permissions
6. **Enterprise Pricing**: Custom pricing for large clubs

---

## Files Created Summary

### **Created (2 files)**

1. `000-docs/211-PP-DESN-hustle-stripe-pricing-and-workspace-mapping.md` - Design document
2. `000-docs/212-AA-MAAR-hustle-phase5-task2-stripe-model-and-plan-mapping.md` - This AAR

### **No Code Changes**

Task 2 is design-only. Implementation happens in Task 3.

---

## Success Criteria Met ✅

- [x] Pricing tiers defined (Free, Starter, Plus, Pro)
- [x] Plan limits documented (max players: 2/5/15/unlimited, max games: 10/50/200/unlimited)
- [x] Stripe product structure defined (3 products, monthly recurring)
- [x] Workspace plan ↔ Stripe price mapping designed
- [x] Environment variable configuration designed
- [x] Subscription lifecycle flows documented (creation, checkout, webhooks)
- [x] 5 webhook event handlers designed
- [x] Status mapping (Stripe ↔ Workspace) defined
- [x] Cancellation flow documented (access until period end)
- [x] Failed payment flow documented (7-day grace period)
- [x] Edge cases identified with solutions
- [x] Testing strategy outlined (Stripe test mode + test cards)
- [x] Migration path from trial documented

---

**End of Mini AAR - Task 2 Complete** ✅

---

**Next Task**: Task 3 - Stripe Integration - Checkout, Webhooks, Workspace Sync

---

**Timestamp**: 2025-11-16
