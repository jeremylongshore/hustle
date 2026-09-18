# Hustle Billing Portal & Invoice History - Reference

**Document**: 6773-REF-hustle-billing-portal-and-invoices.md
**Created**: 2025-11-16
**Phase**: 7 Task 4 - Customer Billing Portal & Invoice History
**Status**: Active Reference

---

## Overview

Customer-facing billing management system with Stripe Customer Portal integration and invoice history display.

**Features**:
- One-click access to Stripe Customer Portal
- Recent invoice history (last 5 invoices)
- Workspace status-based access control
- Server-side data loading for security

---

## Architecture

### Server Utilities (`src/lib/stripe/billing-portal.ts`)

**1. `getOrCreateBillingPortalUrl(workspaceId, returnPath?): Promise<string>`**

Creates Stripe Customer Portal session and returns URL.

**Parameters**:
- `workspaceId` - Workspace ID to create portal for
- `returnPath` - Optional return URL (default: `/dashboard/billing`)

**Returns**: `https://billing.stripe.com/session/...`

**Throws**:
- Workspace not found
- No Stripe customer ID
- Stripe API errors

**Example**:
```typescript
const url = await getOrCreateBillingPortalUrl('ws-123', '/dashboard');
// Redirect user to Stripe-hosted portal
window.location.href = url;
```

---

**2. `listRecentInvoices(workspaceId, limit=5): Promise<InvoiceDTO[]>`**

Fetches recent invoices from Stripe.

**Returns**: Array of invoice DTOs
```typescript
{
  id: string;                // "in_abc123"
  hostedInvoiceUrl: string | null;  // Link to Stripe-hosted invoice
  status: string;            // "paid", "open", "draft", "void"
  amountPaid: number;        // Cents
  amountDue: number;         // Cents
  currency: string;          // "usd"
  created: number;           // Unix timestamp
  periodStart: number | null;
  periodEnd: number | null;
  planName: string | null;   // From line items
}
```

**Behavior**:
- Returns `[]` if no Stripe customer ID (trial workspaces)
- Throws if workspace not found
- Maps Stripe invoice format to simplified DTO

---

### API Routes

**POST `/api/billing/portal`**

Creates billing portal session.

**Request**:
```json
{
  "returnPath": "/dashboard/billing"  // Optional
}
```

**Response** (200):
```json
{
  "url": "https://billing.stripe.com/session/abc123"
}
```

**Errors**:
- 401: `UNAUTHORIZED` - Not authenticated
- 403: `BILLING_INACCESSIBLE` - Workspace status blocked
- 500: `BILLING_PORTAL_FAILED` - Stripe error

**Status Validation**:
| Status | Allowed? |
|--------|----------|
| active | ✅ Yes |
| trial | ✅ Yes |
| past_due | ✅ Yes |
| canceled | ❌ No |
| suspended | ❌ No |
| deleted | ❌ No |

---

**GET `/api/billing/invoices`**

Returns recent invoices.

**Query Params**:
- `limit` - Number of invoices (default: 5)

**Response** (200):
```json
{
  "invoices": [
    {
      "id": "in_abc123",
      "hostedInvoiceUrl": "https://invoice.stripe.com/...",
      "status": "paid",
      "amountPaid": 900,
      "amountDue": 0,
      "currency": "usd",
      "created": 1704067200,
      "periodStart": 1704067200,
      "periodEnd": 1706745600,
      "planName": "Starter Plan"
    }
  ]
}
```

**Errors**: Same as portal route

---

### UI Components

**Billing Page** (`src/app/dashboard/billing/page.tsx`)

Server component with sections:
1. Current Plan Summary
2. Manage Billing Button
3. Billing History Table

**Features**:
- Server-side invoice fetch (no client API calls)
- Status-specific messages (past_due warning, trial notice)
- Link to plan change page

---

**ManageBillingButton** (`src/components/billing/ManageBillingButton.tsx`)

Client component for portal access.

**Props**:
```typescript
{
  workspaceStatus: WorkspaceStatus;
  hasStripeCustomer: boolean;
}
```

**Behavior**:
- Calls `POST /api/billing/portal`
- Redirects to Stripe on success
- Shows error messages inline
- Disabled for canceled/suspended/deleted

---

**InvoiceTable** (`src/components/billing/InvoiceTable.tsx`)

Client component displaying invoice history.

**Props**:
```typescript
{
  invoices: InvoiceDTO[];
}
```

**Columns**:
- Date (periodEnd or created)
- Plan (from line items)
- Amount (paid or due)
- Status (badge with color coding)
- Invoice (link to Stripe hosted invoice)

---

## Stripe Integration

### Customer Portal

**Purpose**: Self-service billing management

**Features Users Can Access**:
- Update payment method
- View/download invoices
- Cancel subscription
- Resume subscription
- View subscription details

**Session Creation**:
```typescript
await stripe.billingPortal.sessions.create({
  customer: 'cus_abc123',
  return_url: 'https://app.com/dashboard/billing',
});
```

**Session Lifecycle**:
- Created server-side only (secure)
- Short-lived URL (expires in 30 minutes)
- No sensitive data in client code

---

### Invoice Retrieval

**Stripe API Call**:
```typescript
const invoices = await stripe.invoices.list({
  customer: 'cus_abc123',
  limit: 5,
});
```

**DTO Mapping**:
- Extract plan name from `lines.data[0].price.nickname`
- Fallback to `lines.data[0].description`
- Format timestamps to readable dates (client-side)
- Currency formatting via `Intl.NumberFormat`

---

## Status Matrix

| Workspace Status | Portal Access | Invoice Access | Behavior |
|------------------|---------------|----------------|----------|
| active | ✅ Allowed | ✅ Allowed | Full access |
| trial | ✅ Allowed | ✅ Allowed | No invoices yet (returns `[]`) |
| past_due | ✅ Allowed | ✅ Allowed | Warning shown, can update payment |
| canceled | ❌ Blocked | ❌ Blocked | Must reactivate first |
| suspended | ❌ Blocked | ❌ Blocked | Contact support |
| deleted | ❌ Blocked | ❌ Blocked | No recovery |

---

## Error Handling

### Client-Side

**Error Display**:
- Inline error message below button
- Red text with error details
- Clear on new action

**User-Friendly Messages**:
- "Billing portal not available for canceled workspaces"
- "Failed to open billing portal. Please try again."
- "Billing portal will be available after you upgrade to a paid plan"

---

### Server-Side

**Structured Responses**:
```json
{
  "error": "ERROR_CODE",
  "message": "User-friendly message",
  "reason": "workspace_status",  // Optional context
  "status": "canceled"  // Optional workspace status
}
```

**Logging**:
```typescript
console.error('[Billing Portal] Failed to create portal session:', {
  workspaceId,
  error: error.message,
});
```

---

## Testing

**Test Coverage**:
- Function existence (smoke tests)
- Error message structure
- API route auth requirements
- Status validation (403 for blocked statuses)
- DTO structure validation

**Run Tests**:
```bash
npx vitest run src/lib/stripe/billing-portal.test.ts
```

**9 tests passing** - Validates core functionality

---

## Local Development

### Stripe CLI (Invoice Testing)

**Generate Test Invoices**:
```bash
# Create test customer
stripe customers create --email test@example.com

# Create test subscription
stripe subscriptions create \
  --customer cus_test123 \
  --items[0][price]=price_starter

# List invoices
stripe invoices list --customer cus_test123 --limit 5
```

**Portal Testing**:
```bash
# Open portal directly
stripe billing-portal open --customer cus_test123
```

---

## Troubleshooting

### Issue: "No Stripe customer ID"

**Cause**: Trial workspace hasn't subscribed yet

**Fix**:
1. User must subscribe via checkout
2. Webhook syncs `stripeCustomerId` to workspace
3. Portal becomes accessible

---

### Issue: Portal URL doesn't open

**Cause**: Session expired (30-minute limit)

**Fix**: Click "Manage Billing" again to create new session

---

### Issue: Empty invoice list

**Cause**: Either:
1. Trial workspace (no invoices yet)
2. First billing cycle not complete

**Expected**: Empty table with "No billing history" message

---

## Related Documentation

- Phase 7 Task 3: Plan Change Flow (`6772-REF`)
- Phase 7 Task 1: Customer Portal (`6767-REF`)
- Stripe API: https://stripe.com/docs/api/customer_portal
- Firestore Schema: `src/types/firestore.ts`

---

**End of Reference: 6773-REF-hustle-billing-portal-and-invoices.md**
