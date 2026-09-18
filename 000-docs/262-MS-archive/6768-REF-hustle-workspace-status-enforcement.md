# Hustle Workspace Status Enforcement Reference

**Document Type**: Reference (REF)
**Phase**: Phase 6 - Customer Success & Growth
**Task**: Task 5 - Workspace Status Enforcement
**Created**: 2025-11-16
**Last Updated**: 2025-11-16
**Owner**: Backend / Security

---

## Overview

This document is the canonical reference for workspace status enforcement in the Hustle application. It defines which operations are allowed or blocked based on workspace subscription status.

**Enforcement Location**: `/src/lib/workspaces/enforce.ts`

---

## Workspace Status Matrix

### Status Definitions

| Status | Description | Allowed Actions | Blocked Actions |
|--------|-------------|-----------------|-----------------|
| **active** | Workspace in good standing with active subscription | All operations (read + write) | None |
| **trial** | Free trial period, full access | All operations (read + write) | None |
| **past_due** | Payment failed, grace period active | Read operations only | All write operations |
| **canceled** | Subscription canceled by user | None (redirect to billing) | All operations |
| **suspended** | Account suspended (TOS violation, fraud) | None (redirect to support) | All operations |
| **deleted** | Workspace soft-deleted | None (show deleted message) | All operations |

### Operation Matrix

| Operation | active | trial | past_due | canceled | suspended | deleted |
|-----------|--------|-------|----------|----------|-----------|---------|
| **Create player** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Update player** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Delete player** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Upload photo** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Log game** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **View dashboard** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View players** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View games** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Upgrade plan** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Update payment** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## Protected API Routes

### Player Routes (Write Operations)

All of these routes enforce `assertWorkspaceActive()`:

#### `/api/players/create` (POST)
- **Enforcement**: Phase 6 Task 5
- **Blocks**: past_due, canceled, suspended, deleted
- **Allows**: active, trial
- **Error Code**: `PAYMENT_PAST_DUE`, `SUBSCRIPTION_CANCELED`, `ACCOUNT_SUSPENDED`, `WORKSPACE_DELETED`

#### `/api/players/[id]` (PUT, DELETE)
- **Enforcement**: Phase 6 Task 5
- **Blocks**: past_due, canceled, suspended, deleted
- **Allows**: active, trial
- **Error Code**: Same as above

#### `/api/players/upload-photo` (POST)
- **Enforcement**: Phase 6 Task 5
- **Blocks**: past_due, canceled, suspended, deleted
- **Allows**: active, trial
- **Error Code**: Same as above

### Game Routes (Write Operations)

#### `/api/games` (POST)
- **Enforcement**: Phase 6 Task 5
- **Blocks**: past_due, canceled, suspended, deleted
- **Allows**: active, trial
- **Error Code**: Same as above

### Player Routes (Read Operations)

These routes do NOT enforce `assertWorkspaceActive()` (read-only):

#### `/api/players` (GET)
- **No enforcement**: Read-only access allowed for past_due
- **Note**: Canceled/suspended/deleted still blocked by auth layer

### Game Routes (Read Operations)

#### `/api/games` (GET)
- **No enforcement**: Read-only access allowed for past_due
- **Note**: Canceled/suspended/deleted still blocked by auth layer

### Billing Routes (Special Case)

Billing routes are **NOT ENFORCED** to allow users to fix billing issues:

#### `/api/billing/create-checkout-session` (POST)
- **No enforcement**: Users must be able to upgrade/reactivate
- **Reason**: Path to recovery for past_due/canceled accounts

#### `/api/billing/create-portal-session` (POST)
- **No enforcement**: Users must be able to update payment method
- **Reason**: Path to recovery for past_due accounts

#### `/api/billing/webhook` (POST)
- **No enforcement**: Stripe needs to update workspace status
- **Reason**: System integration, not user-initiated

---

## Error Response Format

When `assertWorkspaceActive()` blocks an operation, it throws `WorkspaceAccessError` with:

### HTTP Response

```
HTTP/1.1 403 Forbidden
Content-Type: application/json
```

### JSON Body

```json
{
  "error": "PAYMENT_PAST_DUE" | "SUBSCRIPTION_CANCELED" | "ACCOUNT_SUSPENDED" | "WORKSPACE_DELETED",
  "message": "User-friendly error message",
  "status": "past_due" | "canceled" | "suspended" | "deleted"
}
```

### Error Codes and Messages

| Error Code | Status | Message |
|-----------|--------|---------|
| `PAYMENT_PAST_DUE` | `past_due` | "Your payment is past due. Please update your payment method to continue." |
| `SUBSCRIPTION_CANCELED` | `canceled` | "Your subscription has been canceled. Please reactivate to continue." |
| `ACCOUNT_SUSPENDED` | `suspended` | "Your account has been suspended. Please contact support." |
| `WORKSPACE_DELETED` | `deleted` | "This workspace has been deleted and is no longer accessible." |

---

## Upgrade UX Guidelines

### Past Due Status

**User Experience:**
1. Dashboard shows warning banner: "Payment past due"
2. All write operations blocked with 403 error
3. Read-only access to existing data
4. CTA button: "Update Payment Method"

**Next Steps:**
- `nextStep`: `"update_payment"`
- Redirect to: `/api/billing/create-portal-session`
- User updates card → Status changes to `active`

**Code Example:**
```typescript
import { assertWorkspaceActive, getNextStep } from '@/lib/workspaces/enforce';

try {
  assertWorkspaceActive(workspace);
  // Proceed with operation
} catch (error) {
  if (error instanceof WorkspaceAccessError) {
    const nextStep = getNextStep(workspace.status);
    // Show UI: "Update Payment" button → nextStep === "update_payment"
  }
}
```

### Canceled Status

**User Experience:**
1. Dashboard shows error message: "Subscription canceled"
2. All operations blocked
3. CTA button: "Reactivate Subscription"

**Next Steps:**
- `nextStep`: `"upgrade"`
- Redirect to: `/api/billing/create-checkout-session`
- User resubscribes → Status changes to `active`

### Suspended Status

**User Experience:**
1. Dashboard shows error message: "Account suspended"
2. All operations blocked
3. CTA button: "Contact Support"

**Next Steps:**
- `nextStep`: `"contact_support"`
- Redirect to: Support email or chat
- Manual resolution by support team

### Deleted Status

**User Experience:**
1. Full-screen error message: "Workspace deleted"
2. All operations blocked (including billing)
3. No recovery option

**Next Steps:**
- `nextStep`: `"contact_support"`
- User must contact support for recovery (if possible)
- Typically irreversible

---

## Implementation Guide

### Adding Enforcement to New API Route

**Step 1: Import enforcement guard**
```typescript
import { assertWorkspaceActive } from '@/lib/workspaces/enforce';
import { WorkspaceAccessError } from '@/lib/firebase/access-control';
import { getUser } from '@/lib/firebase/services/users';
import { getWorkspaceById } from '@/lib/firebase/services/workspaces';
```

**Step 2: Load workspace**
```typescript
const user = await getUser(session.user.id);
if (!user?.defaultWorkspaceId) {
  return NextResponse.json(
    { error: 'No workspace found' },
    { status: 500 }
  );
}

const workspace = await getWorkspaceById(user.defaultWorkspaceId);
if (!workspace) {
  return NextResponse.json(
    { error: 'Workspace not found' },
    { status: 500 }
  );
}
```

**Step 3: Enforce status**
```typescript
try {
  assertWorkspaceActive(workspace);
} catch (error) {
  if (error instanceof WorkspaceAccessError) {
    return NextResponse.json(
      error.toJSON(),
      { status: error.httpStatus }
    );
  }
  throw error;
}
```

**Step 4: Proceed with operation**
```typescript
// If we get here, workspace is active or trial
// Safe to proceed with write operation
const result = await createPlayer(userId, data);
return NextResponse.json({ success: true, result });
```

---

## Client-Side Helpers

### Check if Workspace is Writable (Non-Throwing)

```typescript
import { isWorkspaceWritable } from '@/lib/workspaces/enforce';

// In React component
if (!isWorkspaceWritable(workspace.status)) {
  return <UpgradePrompt status={workspace.status} />;
}

return <CreatePlayerForm />;
```

### Check if Workspace is Readable (Non-Throwing)

```typescript
import { isWorkspaceReadable } from '@/lib/workspaces/enforce';

// In React component
if (!isWorkspaceReadable(workspace.status)) {
  return <WorkspaceDeletedMessage />;
}

return <DashboardView data={players} />;
```

### Get Next Step for User

```typescript
import { getNextStep } from '@/lib/workspaces/enforce';

const nextStep = getNextStep(workspace.status);

switch (nextStep) {
  case 'update_payment':
    return <UpdatePaymentButton />;
  case 'upgrade':
    return <ReactivateButton />;
  case 'contact_support':
    return <ContactSupportButton />;
  default:
    return null; // active or trial, no action needed
}
```

---

## Testing

### Unit Tests

**Location**: `/src/lib/workspaces/enforce.test.ts`

**Coverage**: 32 tests covering:
- ✅ All 6 status states (active, trial, past_due, canceled, suspended, deleted)
- ✅ Error code correctness
- ✅ Error message structure
- ✅ Helper functions (getNextStep, isWorkspaceWritable, isWorkspaceReadable)
- ✅ Integration scenarios

**Run Tests:**
```bash
npm run test:unit -- src/lib/workspaces/enforce.test.ts
```

### Manual Testing Checklist

- [ ] Create player with `active` workspace → Success
- [ ] Create player with `trial` workspace → Success
- [ ] Create player with `past_due` workspace → 403 error
- [ ] Create player with `canceled` workspace → 403 error
- [ ] Create player with `suspended` workspace → 403 error
- [ ] Create player with `deleted` workspace → 403 error
- [ ] View players with `past_due` workspace → Success (read-only)
- [ ] Upgrade from `past_due` via billing portal → Success
- [ ] Upgrade from `canceled` via checkout → Success

---

## Monitoring and Logging

### Enforcement Logs

Every enforcement check logs to console:

```typescript
// Successful check (console.log)
[WORKSPACE_ENFORCEMENT] {
  workspaceId: "ws_abc123",
  status: "active",
  plan: "starter"
}

// Blocked operation (console.warn)
[WORKSPACE_BLOCKED] {
  workspaceId: "ws_xyz789",
  status: "past_due"
}
```

### Metrics to Track

1. **Blocked Operations by Status**
   - Count of 403 errors by error code
   - Most common: `PAYMENT_PAST_DUE`

2. **Conversion from Blocked State**
   - % of `past_due` users who update payment
   - % of `canceled` users who reactivate

3. **Average Time in Grace Period**
   - Days in `past_due` before upgrade or cancellation

### Cloud Logging Queries

**Find all workspace blocks:**
```
resource.type="cloud_run_revision"
jsonPayload.message="WORKSPACE_BLOCKED"
```

**Count by status:**
```
resource.type="cloud_run_revision"
jsonPayload.message="WORKSPACE_BLOCKED"
| stats count() by jsonPayload.status
```

---

## Troubleshooting

### Issue: User can't create player despite active subscription

**Diagnosis:**
1. Check workspace status in Firestore: `workspaces/{workspaceId}`
2. Verify `status` field is `active` or `trial`
3. Check Stripe subscription status
4. Check webhook logs for sync issues

**Resolution:**
- If Stripe shows active but Firestore shows past_due, trigger webhook manually
- If subscription truly past due, user must update payment

### Issue: False positives on past_due status

**Diagnosis:**
1. Check `billing.currentPeriodEnd` timestamp
2. Verify Stripe invoice payment status
3. Check webhook delivery logs

**Resolution:**
- Re-sync from Stripe: `await updateWorkspaceFromStripeSubscription(workspaceId)`

### Issue: User stuck in suspended state

**Diagnosis:**
1. Check suspension reason (manual review needed)
2. Verify with support team

**Resolution:**
- Manual status update by admin after issue resolved
- Update Firestore: `workspaces/{workspaceId}` → `status: 'active'`

---

## Related Documentation

- **Phase 6 Task 4**: `6767-REF-hustle-monitoring-and-alerting.md` (Monitoring setup)
- **Phase 6 Task 5 MAAR**: `219-AA-MAAR-hustle-phase6-task5-workspace-status-enforcement.md`
- **Workspace Guards**: `/src/lib/workspaces/guards.ts` (Legacy guards)
- **Access Control**: `/src/lib/firebase/access-control.ts` (WorkspaceAccessError class)
- **Plan Mapping**: `/src/lib/stripe/plan-mapping.ts` (Status mapping from Stripe)

---

**Document Version**: 1.0
**Last Reviewed**: 2025-11-16
**Next Review**: 2025-12-16
**Owner**: Backend Team
