# Phase 6 Task 3: Email Notifications - Mini AAR

**Timestamp**: 2025-11-16
**Phase**: Phase 6 - Customer Success & Growth
**Task**: Task 3 - Email notifications (trial and billing)
**Status**: ✅ COMPLETE

---

## Overview

Implemented automated email notifications for trial expiration and billing events. Users now receive proactive reminders for trial ending, payment failures, and subscription cancellations.

---

## Implementation Summary

### **Components Created**

1. **Email Templates** (3 new templates added)
2. **Stripe Webhook Handler** (NEW)
3. **Scheduled Trial Reminder Function** (NEW)

### **Email Service** (Existing)

- **Provider**: Resend
- **Configuration**: Already set up from previous phases
- **Location**: `src/lib/email.ts` and `functions/src/email-service.ts`

---

## New Email Templates

**Files**:
- `src/lib/email-templates.ts` (main app)
- `functions/src/email-templates.ts` (Cloud Functions)

### **1. Trial Ending Soon**

**Template**: `emailTemplates.trialEndingSoon()`

**Trigger**: Scheduled Cloud Function (daily at 9:00 AM UTC)

**Parameters**:
```typescript
{
  name: string;
  daysRemaining: number;  // Always 3 for initial implementation
  upgradeUrl: string;     // Link to billing plans page
}
```

**Subject**: `Your Hustle trial expires in 3 days`

**Content**:
- Countdown alert with exact expiration date
- List of features that will be lost
- Plan comparison (Starter, Plus, Pro)
- Upgrade CTA button

**Visual Example**:
```
┌──────────────────────────────────────────────┐
│ Hi User, your trial is ending soon          │
│                                              │
│ Your Hustle trial will expire in 3 days.    │
│                                              │
│ ⚠️ Trial expires: November 19, 2025         │
│                                              │
│ After your trial ends, you'll lose access:  │
│ • Player profiles and game tracking         │
│ • Performance analytics and trends          │
│ • Verified stats for recruiters             │
│ • All historical data                       │
│                                              │
│ [Upgrade to Continue]                        │
│                                              │
│ Choose your plan:                            │
│ • Starter ($9/month) - Individual athletes  │
│ • Plus ($19/month) - Multiple players       │
│ • Pro ($39/month) - Teams and coaches       │
└──────────────────────────────────────────────┘
```

### **2. Payment Failed**

**Template**: `emailTemplates.paymentFailed()`

**Trigger**: Stripe webhook `invoice.payment_failed`

**Parameters**:
```typescript
{
  name: string;
  planName: string;              // "starter", "plus", "pro"
  amount: number;                // Amount in cents (e.g., 1900 = $19.00)
  paymentMethodLast4?: string;   // Last 4 digits of card
  updatePaymentUrl: string;      // Link to billing settings
  invoiceUrl?: string;           // Stripe hosted invoice URL
}
```

**Subject**: `Payment failed - Action required`

**Content**:
- Payment details (plan, amount, attempted date)
- Payment method last 4 digits
- Grace period warning
- Common failure reasons
- Update payment method CTA

**Visual Example**:
```
┌──────────────────────────────────────────────┐
│ Hi User, your payment failed                │
│                                              │
│ We couldn't process your payment for the    │
│ plus plan.                                   │
│                                              │
│ Payment Details                              │
│ • Plan: plus                                 │
│ • Amount: $19.00                             │
│ • Payment method ending in: 4242             │
│ • Attempted: November 16, 2025               │
│                                              │
│ ⚠️ Update your payment method now to avoid  │
│    service interruption                      │
│                                              │
│ You can still view existing data, but       │
│ creating new content is disabled.            │
│                                              │
│ [Update Payment Method]                      │
│                                              │
│ Common reasons:                              │
│ • Expired or canceled credit card           │
│ • Insufficient funds                         │
│ • Bank declined the transaction             │
│ • Incorrect billing address                 │
└──────────────────────────────────────────────┘
```

### **3. Subscription Canceled**

**Template**: `emailTemplates.subscriptionCanceled()`

**Trigger**: Stripe webhook `customer.subscription.deleted` or `customer.subscription.updated` (status change to canceled)

**Parameters**:
```typescript
{
  name: string;
  planName: string;
  cancellationDate: string;  // Formatted date
  reactivateUrl: string;     // Link to billing settings
}
```

**Subject**: `Your Hustle subscription has been canceled`

**Content**:
- Cancellation confirmation
- List of lost access
- Data retention policy (90 days)
- Reactivation CTA
- Feedback request

**Visual Example**:
```
┌──────────────────────────────────────────────┐
│ Hi User, your subscription is canceled      │
│                                              │
│ Your plus subscription has been canceled    │
│ as of November 16, 2025.                     │
│                                              │
│ ⚠️ You no longer have access to:            │
│    • Create new player profiles             │
│    • Log new game statistics                │
│    • View performance analytics             │
│    • Generate verified reports              │
│                                              │
│ Your historical data is safe and will be    │
│ retained for 90 days. Reactivate within     │
│ this period to restore all your data.       │
│                                              │
│ [Reactivate Subscription]                    │
│                                              │
│ We're sorry to see you go! If there's       │
│ anything we could do better, please reply.   │
└──────────────────────────────────────────────┘
```

---

## Stripe Webhook Handler

**File**: `src/app/api/webhooks/stripe/route.ts`

### **Purpose**

Receives Stripe webhook events and triggers appropriate actions (email notifications + workspace status updates).

### **Endpoint**

```
POST /api/webhooks/stripe
```

### **Webhook Secret Verification**

```typescript
const signature = headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
```

**Security**:
- Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`
- Rejects requests with invalid signatures (prevents spoofing)
- Logs all webhook events for audit trail

### **Supported Events**

#### **1. `invoice.payment_failed`**

**Flow**:
```
Stripe sends webhook
  ↓
Find workspace by stripeCustomerId
  ↓
Find workspace owner user
  ↓
Get payment method details (last4)
  ↓
Send payment failed email
  ↓
Update workspace: status='past_due'
```

**Workspace Updates**:
```typescript
await adminDb.collection('workspaces').doc(workspaceId).update({
  status: 'past_due',
  'billing.lastPaymentFailed': new Date(),
  updatedAt: new Date(),
});
```

#### **2. `customer.subscription.deleted`**

**Flow**:
```
Stripe sends webhook (user canceled in portal)
  ↓
Find workspace by stripeCustomerId
  ↓
Find workspace owner user
  ↓
Send subscription canceled email
  ↓
Update workspace: status='canceled'
```

**Workspace Updates**:
```typescript
await adminDb.collection('workspaces').doc(workspaceId).update({
  status: 'canceled',
  'billing.canceledAt': new Date(),
  updatedAt: new Date(),
});
```

#### **3. `customer.subscription.updated`**

**Flow**:
```
Stripe sends webhook (status change)
  ↓
Find workspace by stripeCustomerId
  ↓
Map Stripe status to workspace status
  ↓
Update workspace status
  ↓
If status changed to canceled → Send cancellation email
```

**Status Mapping**:
```typescript
Stripe Status       →  Workspace Status
'active'           →  'active'
'trialing'         →  'trial'
'past_due'         →  'past_due'
'canceled'         →  'canceled'
'unpaid'           →  'canceled'
```

**Workspace Updates**:
```typescript
await adminDb.collection('workspaces').doc(workspaceId).update({
  status: newStatus,
  'billing.subscriptionStatus': subscription.status,
  updatedAt: new Date(),
});
```

---

## Scheduled Trial Reminder Function

**File**: `functions/src/index.ts`

**Function Name**: `sendTrialReminders`

**Schedule**: Every day at 9:00 AM UTC

**Cron Expression**: `0 9 * * *`

### **Purpose**

Checks for trials expiring in 3 days and sends reminder emails.

### **Implementation**

```typescript
export const sendTrialReminders = functions
  .region('us-central1')
  .pubsub.schedule('0 9 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    // Calculate date range (3 days from now)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(0, 0, 0, 0);

    const fourDaysFromNow = new Date();
    fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);
    fourDaysFromNow.setHours(0, 0, 0, 0);

    // Query workspaces
    const workspaces = await db
      .collection('workspaces')
      .where('status', '==', 'trial')
      .where('trialEndsAt', '>=', Timestamp.fromDate(threeDaysFromNow))
      .where('trialEndsAt', '<', Timestamp.fromDate(fourDaysFromNow))
      .get();

    // Send emails to workspace owners
    for (const workspaceDoc of workspaces.docs) {
      const userData = await getUserForWorkspace(workspaceDoc.id);
      await sendTrialEndingEmail(userData);
    }

    return {
      success: true,
      workspacesChecked: workspaces.size,
      emailsSent,
      emailsFailed,
    };
  });
```

### **Query Logic**

**Date Range Calculation**:
- Today: November 16, 2025
- 3 days from now: November 19, 2025 (00:00:00)
- 4 days from now: November 20, 2025 (00:00:00)

**Firestore Query**:
```
WHERE status == 'trial'
AND trialEndsAt >= November 19, 2025 00:00:00
AND trialEndsAt < November 20, 2025 00:00:00
```

**Result**: Finds all trials expiring on November 19, 2025 (exactly 3 days out)

### **Error Handling**

**Workspace-Level Errors** (non-blocking):
- No user found for workspace → Skip, log warning
- User has no email → Skip, log warning
- Email send fails → Log error, continue with next workspace

**Fatal Errors** (blocking):
- Firestore query fails → Throw error, Cloud Scheduler will retry
- Firebase Admin initialization fails → Throw error, Cloud Scheduler will retry

### **Logging**

**Start**:
```
[TrialReminders] Starting daily trial reminder check
```

**Query Result**:
```
[TrialReminders] Found 12 workspaces with trials ending in 3 days
```

**Per-Email**:
```
[TrialReminders] Sent reminder to user@example.com (workspace: abc123)
```

**Completion**:
```
[TrialReminders] Complete. Sent: 10, Failed: 2
```

---

## Email Flow Examples

### **Example 1: Trial Ending Soon (Scheduled)**

**Scenario**: User trial expires in 3 days

**Flow**:
```
9:00 AM UTC - Scheduled function runs
  ↓
Query Firestore: status='trial', trialEndsAt in 3 days
  ↓
Find workspace: trial-workspace-123
  ↓
Find owner: user@example.com
  ↓
Send trial ending email with 3-day countdown
  ↓
User clicks "Upgrade to Continue"
  ↓
Redirect to /billing/plans
  ↓
User selects Plus plan ($19/month)
  ↓
Stripe checkout session
  ↓
Payment succeeds
  ↓
Webhook: checkout.session.completed
  ↓
Update workspace: status='active', plan='plus'
```

### **Example 2: Payment Failed (Webhook-Triggered)**

**Scenario**: Stripe attempts to charge user, payment fails

**Flow**:
```
Stripe attempts to charge $19.00
  ↓
Payment declined by bank
  ↓
Stripe webhook: invoice.payment_failed
  ↓
POST /api/webhooks/stripe
  ↓
Verify signature ✅
  ↓
Find workspace by stripeCustomerId
  ↓
Find owner: user@example.com
  ↓
Get payment method: **** 4242
  ↓
Send payment failed email
  ↓
Update workspace: status='past_due'
  ↓
User logs in, sees yellow "Past Due" banner
  ↓
User clicks "Update Payment Method"
  ↓
Redirect to Stripe Customer Portal
  ↓
User updates credit card
  ↓
Stripe retries invoice
  ↓
Payment succeeds
  ↓
Webhook: invoice.payment_succeeded
  ↓
Update workspace: status='active'
```

### **Example 3: Subscription Canceled (User-Initiated)**

**Scenario**: User cancels subscription via Stripe portal

**Flow**:
```
User visits /dashboard/settings/billing
  ↓
User clicks "Manage Subscription"
  ↓
Redirect to Stripe Customer Portal
  ↓
User clicks "Cancel subscription"
  ↓
Stripe processes cancellation
  ↓
Stripe webhook: customer.subscription.deleted
  ↓
POST /api/webhooks/stripe
  ↓
Verify signature ✅
  ↓
Find workspace by stripeCustomerId
  ↓
Find owner: user@example.com
  ↓
Send subscription canceled email
  ↓
Update workspace: status='canceled'
  ↓
User returns to app
  ↓
Dashboard shows red "Canceled" banner
  ↓
All write operations blocked
  ↓
User sees "Reactivate Subscription" CTA
```

---

## Webhook Configuration (Stripe Dashboard)

### **Required Webhooks**

**Endpoint**: `https://hustleapp-production.web.app/api/webhooks/stripe`

**Events to Listen For**:
1. `checkout.session.completed` (existing - handles initial subscription)
2. `invoice.payment_failed` (NEW - triggers payment failed email)
3. `customer.subscription.deleted` (NEW - triggers cancellation email)
4. `customer.subscription.updated` (NEW - updates workspace status)
5. `invoice.payment_succeeded` (optional - updates workspace to active after retry)

### **Webhook Secret**

**Environment Variable**: `STRIPE_WEBHOOK_SECRET`

**Get from**: Stripe Dashboard → Webhooks → Click webhook → Signing secret

**Format**: `whsec_...`

**Security**: Used to verify webhook signatures and prevent spoofing

---

## Environment Variables Required

### **Existing (Already Set)**

```bash
# Resend (email provider)
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM="Hustle <noreply@hustleapp.com>"

# Stripe
STRIPE_SECRET_KEY="sk_live_xxxxx"

# App URLs
NEXTAUTH_URL="https://hustleapp-production.web.app"
```

### **New (Must Add)**

```bash
# Stripe webhook verification
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
```

---

## Testing

### **Test Trial Reminder Function (Manual Trigger)**

```bash
# Manually invoke Cloud Function
firebase functions:shell

# In shell:
> sendTrialReminders()
```

**Expected Output**:
```
[TrialReminders] Starting daily trial reminder check
[TrialReminders] Found 2 workspaces with trials ending in 3 days
[TrialReminders] Sent reminder to user1@example.com (workspace: ws1)
[TrialReminders] Sent reminder to user2@example.com (workspace: ws2)
[TrialReminders] Complete. Sent: 2, Failed: 0
```

### **Test Webhook Handler (Stripe CLI)**

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
stripe trigger customer.subscription.updated
```

**Expected Logs**:
```
[Stripe Webhook] Webhook received: invoice.payment_failed
[Stripe Webhook] Handling payment failed for invoice: in_xxxxx
[Stripe Webhook] Payment failed email sent to user@example.com
[Stripe Webhook] Workspace status updated to past_due
```

### **Test Email Templates**

```bash
# Send test trial reminder email
npx tsx scripts/test-email.ts trialReminder user@example.com

# Send test payment failed email
npx tsx scripts/test-email.ts paymentFailed user@example.com

# Send test subscription canceled email
npx tsx scripts/test-email.ts subscriptionCanceled user@example.com
```

---

## Deployment

### **1. Deploy Cloud Functions**

```bash
firebase deploy --only functions:sendTrialReminders
```

**Verify**:
```bash
firebase functions:log --only sendTrialReminders --limit 50
```

### **2. Configure Stripe Webhooks**

**Steps**:
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://hustleapp-production.web.app/api/webhooks/stripe`
3. Select events: `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`
4. Copy signing secret
5. Add to Firebase environment: `firebase functions:config:set stripe.webhook_secret="whsec_xxxxx"`

**Verify**:
```bash
# Send test event from Stripe Dashboard
stripe trigger invoice.payment_failed

# Check logs
firebase functions:log --limit 10
```

### **3. Deploy Next.js App**

```bash
npm run build
firebase deploy --only hosting
```

---

## Monitoring

### **Cloud Function Execution**

```bash
# View execution logs
firebase functions:log --only sendTrialReminders --limit 100

# Check execution history
# Go to: Firebase Console → Functions → sendTrialReminders → Logs
```

### **Webhook Delivery**

```bash
# Check Stripe webhook logs
# Go to: Stripe Dashboard → Webhooks → [Your endpoint] → Event logs

# Look for:
# - Successful deliveries (200 OK)
# - Failed deliveries (retries)
# - Signature verification errors
```

### **Email Delivery**

```bash
# Check Resend dashboard
# Go to: Resend Dashboard → Logs

# Filter by:
# - Subject: "trial expires", "payment failed", "subscription canceled"
# - Status: Delivered, Bounced, Failed
```

---

## Implementation Benefits

### **1. Proactive Communication**

Users receive timely notifications before issues escalate:
- 3-day trial warning → Gives time to upgrade
- Payment failed alert → Immediate action possible
- Cancellation confirmation → Opportunity to win back

### **2. Reduced Support Load**

Self-service email notifications reduce support tickets:
- Payment issues: Users can fix themselves via Stripe portal
- Trial expiration: Clear upgrade path provided
- Cancellation: Auto-confirmation, no need to contact support

### **3. Improved Conversion**

Trial reminder emails drive upgrades:
- 3-day warning creates urgency
- Plan comparison in email aids decision
- Direct CTA to billing plans page

### **4. Automated Workflow**

No manual intervention required:
- Scheduled function runs daily automatically
- Webhooks trigger emails in real-time
- Workspace status updates automatically

### **5. Audit Trail**

Complete logging for debugging:
- Cloud Function logs show all scheduled runs
- Webhook logs show all Stripe events
- Email provider logs show delivery status

---

## Next Steps (Task 4)

- Implement monitoring and alerting for trial/billing emails
- Add Cloud Monitoring uptime checks on `/api/health`
- Standardize log fields for key events
- Set up alerts for failed email deliveries

---

## Files Created

1. `src/app/api/webhooks/stripe/route.ts` - Stripe webhook handler
2. `000-docs/227-AA-MAAR-hustle-phase6-task3-email-notifications.md` - This AAR

---

## Files Modified

1. `src/lib/email-templates.ts` - Added 3 new email templates
2. `functions/src/email-templates.ts` - Added 3 new email templates (synced)
3. `functions/src/index.ts` - Added scheduled trial reminder function

---

## Success Criteria Met ✅

- [x] Trial ending soon email template created
- [x] Payment failed email template created
- [x] Subscription canceled email template created
- [x] Stripe webhook handler created
- [x] Webhook signature verification implemented
- [x] `invoice.payment_failed` event handler
- [x] `customer.subscription.deleted` event handler
- [x] `customer.subscription.updated` event handler
- [x] Scheduled trial reminder function created
- [x] Daily cron schedule configured (9:00 AM UTC)
- [x] Firestore query for trials expiring in 3 days
- [x] Email sending integration with Resend
- [x] Error handling and logging
- [x] Workspace status updates on webhook events
- [x] Testing procedures documented
- [x] Deployment instructions provided

---

**End of Mini AAR - Task 3 Complete** ✅

---

**Timestamp**: 2025-11-16
