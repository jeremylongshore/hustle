# Billing Support Runbook

**Type**: Runbook (Service/Operations)
**Phase**: 7 Task 6
**Created**: 2025-11-16
**Audience**: Support staff, operators, non-engineers
**Status**: Active

---

## Purpose

This runbook provides step-by-step procedures for common billing and workspace support scenarios. It's designed for **non-technical support staff** who need to help customers with billing issues.

**Prerequisites**:
- Access to Stripe Dashboard
- Access to Firestore Console (read-only recommended)
- Access to Cloud Run logs (for debugging)

---

## Table of Contents

1. [Common Scenarios](#common-scenarios)
2. [Tools & Access](#tools--access)
3. [Do's and Don'ts](#dos-and-donts)
4. [Escalation Guidelines](#escalation-guidelines)
5. [Quick Reference](#quick-reference)

---

## Common Scenarios

### Scenario 1: Customer Can't Add More Players

**Symptoms**:
- User reports "Player limit reached" error
- Can't click "Add Athlete" button
- Error message mentions plan upgrade

**Steps to Diagnose**:

1. **Get Customer Information**
   - Ask for: Email address OR workspace ID
   - Confirm: User is logged in and can access dashboard

2. **Check Firestore**
   - Open [Firestore Console](https://console.firebase.google.com/)
   - Navigate to `workspaces` collection
   - Find workspace by searching users collection for email:
     - Go to `users` collection
     - Search for user by email
     - Note the `defaultWorkspaceId` field
   - Open that workspace document

3. **Verify Plan and Usage**
   - Check `plan` field (free, starter, plus, or pro)
   - Check `usage.playerCount` field
   - Compare to limits from table below:

     | Plan | Player Limit |
     |------|--------------|
     | free | 2 |
     | starter | 5 |
     | plus | 15 |
     | pro | 9999 (unlimited) |

4. **Check Workspace Status**
   - Check `status` field
   - Must be `active`, `trial`, `past_due`, or `canceled` to add players
   - If `suspended` or `deleted`, user cannot add players (escalate to engineering)

**Resolution Paths**:

**A. User is at Hard Limit**:
- Confirm: `usage.playerCount >= plan limit`
- **Action**: Tell customer they need to upgrade
- **Script**:
  > "You're currently on the [PLAN] plan which allows [X] players. You have [X] players already. To add more, you'll need to upgrade to [NEXT_PLAN] which allows [Y] players. You can upgrade at Dashboard → Billing → Change Plan."

**B. User Has Room But Getting Error**:
- Confirm: `usage.playerCount < plan limit`
- **Action**: This is a bug - escalate to engineering
- **Provide**: Workspace ID, current usage, plan, error screenshot

**C. User Recently Upgraded But Still Blocked**:
- Check Stripe Dashboard for subscription status
- Check `workspace.plan` is updated
- If plan not updated after 5+ minutes: Escalate (webhook may have failed)

---

### Scenario 2: Customer Card Failed and Lost Access

**Symptoms**:
- User reports can't log games
- Error message about payment or subscription
- "Account suspended" or similar message

**Steps to Diagnose**:

1. **Locate Customer in Stripe**
   - Open [Stripe Dashboard](https://dashboard.stripe.com/customers)
   - Search by email address
   - Click into customer record

2. **Check Subscription Status**
   - Go to Subscriptions tab
   - Check status badge:
     - `Past due` = grace period (still has access for 7 days)
     - `Unpaid` = grace period expired, suspended
     - `Canceled` = subscription ended

3. **Check Firestore Workspace Status**
   - Find workspace via user email (as in Scenario 1)
   - Check `workspace.status` field
   - Should match Stripe status:
     - Stripe `Past due` → Firestore `past_due`
     - Stripe `Unpaid` → Firestore `suspended`

4. **Check Last Payment Attempt**
   - In Stripe customer record, go to Invoices tab
   - Find most recent invoice
   - Check "Payment" column for failure reason

**Resolution Paths**:

**A. Payment Failed, Still in Grace Period**:
- Confirm: `workspace.status = past_due`
- Confirm: Stripe subscription = "Past due"
- **Action**: Customer still has access, needs to update payment method
- **Script**:
  > "Your recent payment failed, but you still have access for 7 days. Please update your payment method at Dashboard → Billing → Manage Billing. This will open Stripe's secure payment portal where you can add a new card."

**B. Grace Period Expired, Account Suspended**:
- Confirm: `workspace.status = suspended`
- Confirm: Stripe subscription = "Unpaid"
- **Action**: Customer must update payment method to restore access
- **Script**:
  > "Your payment failed and the grace period has expired. Your account is temporarily suspended. To restore access, please go to Dashboard → Billing → Manage Billing and update your payment method. Once payment is successful, access will be restored within minutes."

**C. Subscription Canceled**:
- Confirm: `workspace.status = canceled`
- Confirm: Stripe subscription = "Canceled"
- **Action**: Customer needs to re-subscribe
- **Script**:
  > "Your subscription was canceled. To reactivate, please go to Dashboard → Billing → Change Plan and select a plan. You'll be charged immediately and access will be restored."

---

### Scenario 3: Customer Upgraded/Downgraded But UI Shows Old Plan

**Symptoms**:
- User says they upgraded but still see old plan name
- Old plan limits still apply
- Billing page shows incorrect plan

**Steps to Diagnose**:

1. **Check Latest Stripe Subscription**
   - Open Stripe Dashboard → Customers
   - Find customer by email
   - Go to Subscriptions tab
   - Check current subscription:
     - Price ID (matches plan from table below)
     - Status (should be "Active")
     - Current period dates

   | Price ID | Plan |
   |----------|------|
   | price_STARTER... | Starter ($9) |
   | price_PLUS... | Plus ($19) |
   | price_PRO... | Pro ($39) |

2. **Check Firestore Workspace**
   - Find workspace document
   - Check `plan` field - should match Stripe subscription
   - Check `billing.stripeSubscriptionId` - should match Stripe subscription ID
   - Check `updatedAt` timestamp - should be recent

3. **Check Webhook Delivery**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Find your webhook endpoint
   - Check recent events for `customer.subscription.updated`
   - If event status is "Failed", webhook didn't process correctly

**Resolution Paths**:

**A. Webhook Pending (< 5 minutes since change)**:
- Confirm: Recent subscription update in Stripe
- Confirm: No failed webhook events
- **Action**: Wait 2-5 minutes, refresh browser
- **Script**:
  > "Your plan change is processing. Please wait 2-3 minutes and refresh your browser. If it's still not updated after 5 minutes, contact us again."

**B. Webhook Failed (> 5 minutes, failed event)**:
- Confirm: Failed webhook in Stripe Dashboard
- **Action**: Escalate to engineering
- **Provide**: Stripe event ID, workspace ID, timestamp

**C. Firestore Not Updated (webhook succeeded but no update)**:
- Confirm: Webhook delivered successfully
- Confirm: `workspace.plan` doesn't match Stripe
- **Action**: Escalate to engineering (data inconsistency)
- **Provide**: Workspace ID, expected plan, actual plan

---

### Scenario 4: Customer Wants Refund or Manual Credit

**Symptoms**:
- User requests refund for recent charge
- User wants credit for unused time
- User was charged incorrectly

**Important**: This is a **policy decision**, not a technical issue.

**Steps**:

1. **Understand the Request**
   - When was user charged?
   - Why do they want a refund? (e.g., didn't use service, charged wrong amount)
   - What outcome do they want? (full refund, partial credit, etc.)

2. **Check Stripe Invoice**
   - Find customer in Stripe
   - Go to Invoices tab
   - Find the invoice in question
   - Note: Amount, date, items, status

3. **Issue Refund (If Approved)**
   - In Stripe invoice view, click "Refund"
   - Select full or partial refund
   - Add internal note explaining reason
   - Click "Refund"

4. **Important Notes**:
   - **Refund does NOT change Firestore automatically**
   - Customer will still have access until period end (or until subscription canceled)
   - If you want to also downgrade/cancel, do that separately

**Policy Guidance** (consult your team's policy):
- Refunds within 7 days: Usually approved
- Refunds after 7 days: Case-by-case
- Partial refunds (pro-rated): Approved for downgrades
- Full refunds + keep access: Generally not approved

**Script Template**:
> "I've issued a [FULL/PARTIAL] refund of $[AMOUNT] to your original payment method. You should see it in 5-10 business days. Your subscription will [remain active until PERIOD_END / be canceled immediately / etc.]"

---

## Tools & Access

### Stripe Dashboard

**URL**: https://dashboard.stripe.com/

**Key Sections**:
- **Customers**: Search by email, view subscriptions, invoices
- **Subscriptions**: Active/canceled subscriptions
- **Invoices**: Payment history, refund actions
- **Developers → Webhooks**: Delivery status, failed events

**Common Actions**:
- Issue refund: Invoices → Select invoice → Refund
- Cancel subscription: Customer → Subscriptions → Cancel subscription
- Update customer email: Customer → Details → Edit

---

### Firestore Console

**URL**: https://console.firebase.google.com/project/hustleapp-production/firestore

**Key Collections**:
- **`users`**: User profiles, email, defaultWorkspaceId
- **`workspaces`**: Billing, plan, status, usage counters

**How to Find Workspace**:
1. Go to `users` collection
2. Search documents (email or userId)
3. Click on user document
4. Note `defaultWorkspaceId` field value
5. Go to `workspaces` collection
6. Enter workspace ID in search box

**Read-Only Access Recommended**: To prevent accidental changes

---

### Cloud Run Logs

**URL**: https://console.cloud.google.com/run/detail/us-central1/hustle-staging/logs

**When to Check Logs**:
- Webhook processing errors
- Unexpected API failures
- Debugging data inconsistencies

**How to Search Logs**:
- Filter by time range (e.g., last 1 hour)
- Search for: `workspaceId`, `stripeCustomerId`, `webhook`, `error`
- Look for red error entries

---

## Do's and Don'ts

### ✅ DO

**Use Stripe Dashboard for Billing Changes**:
- Issue refunds
- Cancel subscriptions
- Update customer payment methods (via Customer Portal)

**Use Firestore Console for Verification**:
- Check plan and status
- Verify usage counters
- Confirm workspace relationships

**Document Everything**:
- Note workspace ID in support ticket
- Screenshot relevant Stripe/Firestore data
- Record actions taken (refund amount, date, reason)

**Follow Escalation Path**:
- Know when to escalate to engineering
- Provide complete context when escalating
- Don't make promises you can't keep

---

### ❌ DON'T

**Don't Manually Edit Firestore Billing Fields**:
- Don't change `workspace.plan` directly
- Don't change `workspace.billing.*` fields
- Exception: Only if following documented recovery procedure from engineering

**Don't Change Plan Limits Per Customer**:
- Limits are system-wide, not per-workspace
- If a customer needs custom limits, escalate to product team

**Don't Make Promises About Webhook Timing**:
- Don't say "it will update in exactly 2 minutes"
- Use "typically within 5 minutes" instead
- Webhooks can be delayed by Stripe, not our fault

**Don't Skip Verification Steps**:
- Always check both Stripe AND Firestore
- Don't assume they match - verify
- Data inconsistencies are bugs worth escalating

---

## Escalation Guidelines

### When to Escalate to Engineering

**Immediate Escalation (Severity 1)**:
- Widespread payment failures (multiple customers affected)
- Stripe webhook endpoint completely down
- Data loss (workspace deleted, billing info missing)
- Security issue (unauthorized access, payment info leak)

**Standard Escalation (Severity 2)**:
- Individual customer: Plan not syncing after 10+ minutes
- Webhook event failed 3+ times
- Usage counter clearly wrong (e.g., shows 100 players but user only has 5)
- Customer charged incorrect amount (not just refund request)

**Low Priority Escalation (Severity 3)**:
- Feature request (e.g., "can you add custom plan for me?")
- UI confusion (customer doesn't understand interface)
- Documentation request (help text unclear)

### What to Include When Escalating

**Minimum Required Info**:
1. Workspace ID (from Firestore)
2. User email
3. Stripe customer ID (from Stripe Dashboard)
4. Description of issue
5. Steps already taken

**Helpful Additional Info**:
1. Stripe subscription ID
2. Firestore workspace document screenshot
3. Error message screenshot (from user)
4. Timestamp when issue occurred
5. Any relevant Stripe event IDs

**Template for Escalation**:
```
Subject: [SEVERITY] Billing Issue - Plan Not Syncing

Workspace ID: workspace_12345
User Email: user@example.com
Stripe Customer ID: cus_ABC123
Issue: User upgraded to Plus 15 minutes ago but workspace still shows Starter
Steps Taken: Verified Stripe shows active Plus subscription, checked Firestore shows Starter plan
Webhooks: checked - last webhook was 2 hours ago for different customer
Screenshots: attached
```

---

## Quick Reference

### Plan Limits Table

| Plan | Price | Players | Games/Month | Storage |
|------|-------|---------|-------------|---------|
| Free | $0 | 2 | 10 | 100 MB |
| Starter | $9 | 5 | 50 | 500 MB |
| Plus | $19 | 15 | 200 | 2 GB |
| Pro | $39 | 9999* | 9999* | 10 GB |

*Effectively unlimited

### Status → Access Mapping

| Status | Can Login? | Can Add Players? | Can Log Games? |
|--------|-----------|------------------|----------------|
| trial | Yes | Yes (within limits) | Yes |
| active | Yes | Yes (within limits) | Yes |
| past_due | Yes | Yes (within limits) | Yes |
| canceled | Yes | Yes (within limits) | Yes (until period end) |
| suspended | Yes | No | No |
| deleted | No | No | No |

### Stripe Status → Workspace Status

| Stripe Subscription Status | Workspace Status |
|---------------------------|------------------|
| Active | active |
| Trialing | trial |
| Past due | past_due |
| Canceled | canceled |
| Unpaid | suspended |
| Incomplete | past_due |
| Incomplete expired | canceled |

### Common Error Codes

| Error Code | Meaning | User Action |
|------------|---------|-------------|
| PLAN_LIMIT_EXCEEDED | Hit player or game limit | Upgrade plan |
| WORKSPACE_BLOCKED | Status is suspended/deleted | Contact support |
| BILLING_DISABLED | Billing temporarily disabled | Wait, contact support |
| PAYMENT_FAILED | Card declined or expired | Update payment method |

### Customer Portal Links

**How Customers Access**:
- Dashboard → Billing → "Manage Billing" button
- Opens Stripe Customer Portal in new tab

**What Customers Can Do**:
- Update payment method (add/remove cards)
- View invoice history
- Download invoice PDFs
- Cancel subscription

**What Customers Cannot Do**:
- Change plan tier (must use "Change Plan" page instead)
- Get refunds (must contact support)
- See usage/limits (those are on billing dashboard)

---

## Appendix: Sample Scripts

### Script A: Customer Hit Player Limit (Needs Upgrade)

> "Hi [NAME], thanks for reaching out! I can see you're currently on the **[PLAN]** plan which allows **[X]** players. You currently have **[Y]** players. To add more athletes, you'll need to upgrade to the **[NEXT_PLAN]** plan which allows **[Z]** players for **$[PRICE]/month**. You can upgrade anytime at Dashboard → Billing → Change Plan. Let me know if you have any questions!"

### Script B: Payment Failed (Grace Period)

> "Hi [NAME], I see your recent payment failed on [DATE]. Don't worry - you still have full access for the next 7 days while we retry your payment. Please update your payment method as soon as possible at Dashboard → Billing → Manage Billing. This will open Stripe's secure payment portal. If you need help, let me know!"

### Script C: Payment Failed (Access Suspended)

> "Hi [NAME], your payment failed on [DATE] and the grace period has expired. Your account is temporarily suspended, which means you can view your data but can't add new games or players. To restore access, please update your payment method at Dashboard → Billing → Manage Billing. Once payment is processed, your account will be reactivated within minutes."

### Script D: Plan Not Syncing (Escalating)

> "Hi [NAME], I can see you upgraded to [PLAN] in Stripe, but our system hasn't synced yet. This should happen automatically within 5 minutes, but it's been [X] minutes. I'm escalating this to our engineering team to investigate. We'll have this resolved within 24 hours and will follow up with you. Your payment went through successfully - this is just a sync issue on our end. Thanks for your patience!"

---

**Runbook Version**: 1.0
**Last Updated**: 2025-11-16
**Maintained By**: Support Team + Engineering
**Questions?**: Contact #support-help on Slack or email support-ops@hustle.com
