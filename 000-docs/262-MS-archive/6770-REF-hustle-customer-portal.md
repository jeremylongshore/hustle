# Hustle Customer Portal Canonical Reference

**Document Type**: Reference (REF)
**Number**: 6770 (Canonical Reference Series)
**Phase**: Phase 7 - Customer Experience & Revenue Stabilization
**Created**: 2025-11-16
**Last Updated**: 2025-11-16
**Owner**: Platform Team

---

## Overview

The **Stripe Customer Portal** provides self-service billing management for Hustle customers. Users can update payment methods, view invoices, download receipts, cancel subscriptions, and resume canceled subscriptions without contacting support.

This integration leverages Stripe's hosted Customer Portal to handle all billing operations securely, reducing support burden and improving customer experience.

---

## Purpose of Customer Portal

### Customer Benefits
- **Self-Service**: Manage billing without support tickets
- **Secure**: All payment data handled by Stripe (PCI DSS compliant)
- **Transparent**: View full invoice history and upcoming charges
- **Flexible**: Cancel or resume subscriptions at any time
- **Convenient**: Update payment methods before they expire

### Business Benefits
- **Reduced Support Load**: Billing questions resolved without human intervention
- **Higher Retention**: Easy payment updates prevent involuntary churn
- **Compliance**: PCI DSS compliance handled by Stripe
- **Revenue Protection**: Automated dunning and payment retry logic
- **Audit Trail**: All billing changes logged in Stripe

---

## API Flow

### End-to-End Flow Diagram

```
┌──────────────┐
│    User      │
│  Dashboard   │
└──────┬───────┘
       │ 1. Click "Manage Billing"
       ▼
┌──────────────────────────────────┐
│  ManageBillingButton Component   │
│  (Client-side React)             │
└──────┬───────────────────────────┘
       │ 2. POST /api/billing/create-portal-session
       ▼
┌──────────────────────────────────┐
│  API Route Handler               │
│  src/app/api/billing/            │
│    create-portal-session/        │
└──────┬───────────────────────────┘
       │ 3. Authenticate user (Firebase Admin Auth)
       │ 4. Get workspace with Stripe customer ID
       │ 5. Validate customer ID format
       ▼
┌──────────────────────────────────┐
│  Customer Portal Helper          │
│  src/lib/stripe/customer-portal  │
└──────┬───────────────────────────┘
       │ 6. createCustomerPortalSession()
       ▼
┌──────────────────────────────────┐
│  Stripe API                      │
│  stripe.billingPortal.sessions   │
│    .create()                     │
└──────┬───────────────────────────┘
       │ 7. Return portal URL
       ▼
┌──────────────────────────────────┐
│  Client Redirect                 │
│  window.location.href = url      │
└──────┬───────────────────────────┘
       │ 8. User lands in Stripe Portal
       ▼
┌──────────────────────────────────┐
│  Stripe Customer Portal          │
│  (Hosted by Stripe)              │
│  - Update payment method         │
│  - View invoices                 │
│  - Cancel subscription           │
│  - Resume subscription           │
└──────┬───────────────────────────┘
       │ 9. User makes changes
       │ 10. Stripe sends webhook
       ▼
┌──────────────────────────────────┐
│  Stripe Webhook Handler          │
│  /api/billing/webhook            │
└──────┬───────────────────────────┘
       │ 11. Update workspace.status
       │ 12. Update workspace.billing.*
       ▼
┌──────────────────────────────────┐
│  Firestore Workspace Document    │
│  /workspaces/{workspaceId}       │
└──────────────────────────────────┘
```

---

## Component Details

### 1. ManageBillingButton Component

**Location**: `src/components/ManageBillingButton.tsx`

**Props**:
- `returnUrl` (optional): Custom return URL after portal session (default: `/dashboard/settings/billing`)
- `variant`: Button style: `'primary'` | `'secondary'` | `'link'`
- `className` (optional): Additional Tailwind classes
- `children` (optional): Button text (default: "Manage Billing")

**Behavior**:
1. On click: Makes POST request to `/api/billing/create-portal-session`
2. Receives portal URL in response: `{ success: true, url: "<portal_url>" }`
3. Redirects browser to portal URL: `window.location.href = url`
4. Shows loading spinner during API call
5. Displays error message if API fails

**Error Handling**:
- `NO_STRIPE_CUSTOMER`: "You need to upgrade to a paid plan first."
- Other errors: Generic "Failed to open billing portal" message

### 2. API Route Handler

**Location**: `src/app/api/billing/create-portal-session/route.ts`

**Authentication**: Firebase Admin Auth via `getDashboardUser()`

**Steps**:
1. **Authenticate**: Verify user session exists
2. **Get User**: Fetch user document from Firestore
3. **Get Workspace**: Fetch workspace via `defaultWorkspaceId`
4. **Validate Customer ID**: Check Stripe customer ID exists and format is valid (`cus_[a-zA-Z0-9]+`)
5. **Create Session**: Call `createCustomerPortalSession()` helper
6. **Return URL**: `{ success: true, url: portalSession.url }`

**Error Codes**:
- `401 UNAUTHORIZED`: User not authenticated
- `404 USER_NOT_FOUND`: User document missing
- `404 NO_WORKSPACE`: User has no default workspace
- `404 WORKSPACE_NOT_FOUND`: Workspace document missing
- `400 NO_STRIPE_CUSTOMER`: Workspace has no `billing.stripeCustomerId`
- `500 INVALID_CUSTOMER_ID`: Customer ID format invalid
- `500 STRIPE_ERROR`: Stripe API error

### 3. Customer Portal Helper

**Location**: `src/lib/stripe/customer-portal.ts`

**Functions**:

#### `createCustomerPortalSession(customerId, returnUrl)`

Creates Stripe Billing Portal session.

**Parameters**:
- `customerId` (string): Stripe customer ID (e.g., `cus_abc123`)
- `returnUrl` (string): URL to redirect after portal session

**Returns**: `Promise<Stripe.BillingPortal.Session>`

**Throws**: Error if Stripe API call fails

**Stripe API Call**:
```typescript
await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: returnUrl,
});
```

#### `getDefaultReturnUrl()`

Returns default return URL for portal session.

**Logic**:
```typescript
const baseUrl = process.env.NEXTAUTH_URL ||
                process.env.NEXT_PUBLIC_WEBSITE_DOMAIN ||
                'http://localhost:3000';
return `${baseUrl}/dashboard/settings/billing`;
```

#### `isValidStripeCustomerId(customerId)`

Validates Stripe customer ID format.

**Regex**: `/^cus_[a-zA-Z0-9]+$/`

**Returns**: `true` if valid, `false` otherwise

---

## Webhook Event Mapping

### Event: `customer.subscription.deleted`

**Triggered When**:
- User cancels subscription in Customer Portal
- User selects "Cancel immediately"
- OR subscription canceled at end of billing period

**Handler**: `handleSubscriptionDeleted()` in `src/app/api/billing/webhook/route.ts`

**Actions**:
1. Lookup workspace by `subscription.customer` (Stripe customer ID)
2. Update `workspace.status` to `'canceled'`
3. Preserve `workspace.billing.currentPeriodEnd` (grace period access)
4. Log cancellation event

**Firestore Updates**:
```typescript
await updateWorkspaceStatus(workspace.id, 'canceled');

await updateWorkspaceBilling(workspace.id, {
  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
});
```

**Grace Period Behavior**:
- Users retain read-only access until `currentPeriodEnd`
- Enforcement logic in `src/lib/workspaces/enforce.ts` allows reads for `status: 'canceled'` if `currentPeriodEnd` is in the future
- Write operations blocked immediately upon cancellation

### Event: `customer.subscription.updated`

**Triggered When**:
- User resumes canceled subscription
- User upgrades/downgrades plan
- Subscription renews automatically

**Handler**: `handleSubscriptionUpdated()` in `src/app/api/billing/webhook/route.ts`

**Actions**:
1. Lookup workspace by customer ID
2. Get new plan from `subscription.items.data[0].price.id`
3. Map Stripe status to workspace status via `mapStripeStatusToWorkspaceStatus()`
4. Update `workspace.plan` and `workspace.status`
5. Update `workspace.billing.currentPeriodEnd`

**Example: Resume Canceled Subscription**:
- Stripe status: `active`
- Workspace status: `active` (mapped)
- Workspace plan: Unchanged (same price ID)
- `currentPeriodEnd`: Updated to new period end

### Event: `payment_method.updated` (Implicit)

**Triggered When**: User updates payment method in Customer Portal

**No Direct Webhook**: Stripe does not send explicit webhook for payment method changes

**How to Detect**:
- Check `customer.updated` webhook (not currently handled)
- OR check `invoice.payment_succeeded` after failed payment (indicates new method worked)

**Current Behavior**: No action taken (payment method stored in Stripe, not Firestore)

**Future Enhancement**: Handle `customer.updated` to log payment method changes

### Event: `invoice.payment_failed`

**Triggered When**: Payment fails (card declined, insufficient funds)

**Handler**: `handlePaymentFailed()` in webhook handler

**Actions**:
1. Update `workspace.status` to `'past_due'`
2. User enters grace period (read-only access)
3. Write operations blocked (enforced by status guards)

**Retry Logic**: Stripe automatically retries payment per retry schedule

### Event: `invoice.payment_succeeded`

**Triggered When**: Payment succeeds (renewal or retry after failure)

**Handler**: `handlePaymentSucceeded()` in webhook handler

**Actions**:
1. Update `workspace.status` to `'active'`
2. Update `workspace.billing.currentPeriodEnd` to next period
3. Restore full access (read + write)

---

## Interaction with Workspace Status Enforcement

**Full Reference**: See `000-docs/6768-REF-hustle-workspace-status-enforcement.md`

### Status Flow After Cancellation

```
Active Subscription
       ↓
User Clicks "Cancel" in Portal
       ↓
Stripe → subscription.deleted webhook
       ↓
workspace.status = 'canceled'
       ↓
Read-only access until currentPeriodEnd
       ↓
After currentPeriodEnd expires
       ↓
No access (enforced by status guards)
```

### Enforcement Rules

**Canceled Status**:
- **Read Operations**: ✅ Allowed (until `currentPeriodEnd`)
- **Write Operations**: ❌ Blocked (immediately)

**Implementation**: `src/lib/workspaces/enforce.ts`

```typescript
export function assertWorkspaceActive(workspace: Workspace): void {
  if (workspace.status === 'canceled') {
    // Read-only access during grace period
    const now = new Date();
    const periodEnd = workspace.billing.currentPeriodEnd?.toDate();

    if (periodEnd && now < periodEnd) {
      // Grace period active - allow reads, block writes
      throw new WorkspaceAccessError(
        'SUBSCRIPTION_CANCELED',
        'Subscription canceled. Reactivate to continue.',
        'canceled'
      );
    } else {
      // Grace period expired - block all access
      throw new WorkspaceAccessError(
        'SUBSCRIPTION_EXPIRED',
        'Subscription expired. Reactivate to continue.',
        'canceled'
      );
    }
  }
}
```

### Resume Subscription Flow

```
Canceled Subscription
       ↓
User Clicks "Resume" in Portal
       ↓
Stripe → subscription.updated webhook
       ↓
workspace.status = 'active'
workspace.plan = <current plan>
workspace.billing.currentPeriodEnd = <new period>
       ↓
Full access restored
```

---

## Customer Portal Configuration

### Stripe Dashboard Settings

**Location**: Stripe Dashboard → Settings → Customer Portal

**Settings to Configure**:

1. **Business Information**
   - Business name: "Hustle"
   - Support email: `support@hustleapp.com`
   - Support URL: `https://hustleapp.com/support`

2. **Functionality**
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to view and download invoices
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to switch plans (optional)
   - ❌ Do NOT allow creating new subscriptions (use checkout instead)

3. **Cancellation Settings**
   - **Cancel immediately**: Enabled (customer can choose)
   - **Cancel at period end**: Enabled (default option)
   - **Cancellation reasons**: Enabled (collect feedback)
   - **Retention offers**: Disabled (for Phase 7; enable in Phase 8)

4. **Subscription Updates**
   - **Proration**: Enabled (charge/credit for mid-cycle changes)
   - **Upgrade immediately**: Enabled
   - **Downgrade at period end**: Enabled

5. **Invoice Settings**
   - **Invoice history**: Show all invoices
   - **Download receipts**: Enabled
   - **Payment method on invoices**: Show last 4 digits

### Return URL Configuration

**Default Return URL**: `/dashboard/settings/billing`

**Custom Return URLs** (per button):
- From billing page: `/dashboard/settings/billing` (default)
- From trial warning: `/dashboard/settings/billing?action=upgraded`
- From past_due notice: `/dashboard/settings/billing?action=payment_updated`

**Query Parameters** (future enhancement):
- `?action=upgraded`: Show success message after plan upgrade
- `?action=payment_updated`: Show success message after payment update
- `?action=canceled`: Show confirmation after cancellation

---

## Security Considerations

### Authentication

**API Route Protection**:
- All portal session creation requires Firebase Admin Auth
- `getDashboardUser()` validates session token
- Unauthorized requests return `401 UNAUTHORIZED`

**Customer ID Validation**:
- Format check: `cus_[a-zA-Z0-9]+`
- Prevents injection attacks
- Rejects invalid IDs with `500 INVALID_CUSTOMER_ID`

### Data Privacy

**PCI DSS Compliance**:
- Payment card data NEVER touches Hustle servers
- All payment data stored in Stripe (PCI Level 1 compliant)
- Hustle only stores Stripe customer/subscription IDs (not card data)

**Access Control**:
- Users can only access their own workspace billing
- Customer ID linked to workspace (1:1 relationship)
- Webhook events verified via Stripe signature

### Webhook Security

**Signature Verification**:
```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

**If Verification Fails**:
- Return `400 Invalid signature`
- Log error for investigation
- Do NOT process event

**Replay Attack Prevention**:
- Stripe includes timestamp in signature
- Events older than 5 minutes rejected automatically
- Event IDs logged for deduplication

---

## Testing Scenarios

### Test Case 1: Create Portal Session

**Steps**:
1. Login to dashboard as paying customer
2. Navigate to `/dashboard/settings/billing`
3. Click "Manage Subscription" button
4. Verify redirect to `billing_portal.stripe.com`
5. Verify return URL is `/dashboard/settings/billing`

**Expected Result**: Portal opens with customer's subscription details

### Test Case 2: Update Payment Method

**Steps**:
1. Open Customer Portal
2. Click "Update payment method"
3. Enter new card details
4. Save changes
5. Verify "Payment method updated" confirmation

**Expected Result**:
- Payment method updated in Stripe
- No webhook sent to Hustle
- Next invoice will use new payment method

### Test Case 3: Cancel Subscription (Immediate)

**Steps**:
1. Open Customer Portal
2. Click "Cancel subscription"
3. Select "Cancel immediately"
4. Confirm cancellation
5. Check webhook logs in Stripe Dashboard
6. Check workspace status in Firestore

**Expected Result**:
- Stripe sends `customer.subscription.deleted` webhook
- `workspace.status` = `'canceled'`
- `workspace.billing.currentPeriodEnd` preserved
- User has read-only access until `currentPeriodEnd`

### Test Case 4: Resume Canceled Subscription

**Steps**:
1. User with canceled subscription opens portal
2. Click "Resume subscription"
3. Confirm resumption
4. Check webhook logs
5. Check workspace status

**Expected Result**:
- Stripe sends `customer.subscription.updated` webhook
- `workspace.status` = `'active'`
- `workspace.billing.currentPeriodEnd` updated to new period
- Full access restored immediately

### Test Case 5: Grace Period Access

**Steps**:
1. Cancel subscription (immediate)
2. Verify `workspace.status` = `'canceled'`
3. Attempt to create new player (write operation)
4. Attempt to view players (read operation)
5. Wait until `currentPeriodEnd` expires
6. Attempt to view players again

**Expected Result**:
- Before expiry: Reads succeed, writes fail
- After expiry: Reads and writes fail

---

## Monitoring & Alerting

**Alert Policy**: Stripe Webhook Failures (see `000-docs/6767-REF-hustle-monitoring-and-alerting.md`)

**Key Metrics**:
- Portal session creation rate
- Cancellation rate (by reason)
- Resume rate (canceled → active)
- Payment method update rate
- Webhook processing latency

**Log Queries**:

```bash
# Portal session creation errors
gcloud logging read 'resource.type="cloud_run_revision"
  severity>=ERROR
  jsonPayload.path="/api/billing/create-portal-session"'
  --limit=50 --format=json

# Subscription cancellation events
gcloud logging read 'resource.type="cloud_run_revision"
  jsonPayload.message="Subscription deleted"'
  --limit=50 --format=json

# Webhook signature failures
gcloud logging read 'resource.type="cloud_run_revision"
  severity>=ERROR
  jsonPayload.message~"signature verification failed"'
  --limit=50 --format=json
```

---

## Known Limitations

### Phase 7 Task 1 Scope

**Included**:
- ✅ Portal session creation API
- ✅ UI button integration
- ✅ Webhook handling for cancellation
- ✅ Grace period access enforcement

**Deferred to Future Phases**:
- ❌ Cancellation reason analytics (Phase 8)
- ❌ Retention offers (Phase 8)
- ❌ Plan change automation (Phase 7 Task 3)
- ❌ Dunning emails (Phase 7 Task 2)
- ❌ `customer.updated` webhook handling (Phase 7 Task 4)

### Current Gaps

1. **No Email Notifications**: Users do not receive email when:
   - Subscription canceled
   - Payment method updated
   - Subscription resumed
   - **Mitigation**: Phase 7 Task 2 will add automated emails

2. **No Analytics on Cancellation Reasons**: Stripe collects reasons but not analyzed
   - **Mitigation**: Phase 8 will add analytics dashboard

3. **No Retention Offers**: No attempt to retain canceling customers
   - **Mitigation**: Phase 8 will add discount offers for cancellations

---

## Related Documentation

### Canonical References (6767 Series)
- **6767**: `000-docs/6767-REF-hustle-monitoring-and-alerting.md` (Monitoring setup)
- **6768**: `000-docs/6768-REF-hustle-workspace-status-enforcement.md` (Status enforcement)
- **6769**: `000-docs/6769-REF-hustle-runtime-and-billing-canonical.md` (Runtime & billing)
- **6770**: This document (Customer Portal)

### Phase 5 (Workspace & Billing Foundation)
- Task 3: Stripe integration & webhooks (webhook handler created)
- Task 4: Plan limits enforcement

### Phase 6 (Customer Success & Guardrails)
- Task 5: Runtime status enforcement (enforcement logic created)

### Phase 7 (Customer Experience & Revenue Stabilization)
- Task 1: Customer Portal integration (this task)
- Task 2: Dunning emails (pending)
- Task 3: Self-service plan changes (pending)
- Task 4: Improved webhook handling (pending)

### Code References
- **Portal Helper**: `src/lib/stripe/customer-portal.ts`
- **API Route**: `src/app/api/billing/create-portal-session/route.ts`
- **UI Component**: `src/components/ManageBillingButton.tsx`
- **Webhook Handler**: `src/app/api/billing/webhook/route.ts`
- **Enforcement**: `src/lib/workspaces/enforce.ts`

---

**Document Version**: 1.0
**Last Reviewed**: 2025-11-16
**Next Review**: 2026-01-16 (quarterly)
**Maintainer**: Platform Team
**Change Log**:
- 2025-11-16: Initial version (Phase 7 Task 1)
