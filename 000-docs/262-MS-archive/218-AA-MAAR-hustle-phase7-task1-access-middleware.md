# Phase 7 Task 1: Access Check Middleware (Global Gatekeeper) - Mini AAR

**Timestamp**: 2025-11-16
**Phase**: Phase 7 - Access Enforcement & Subscription Compliance
**Task**: Task 1 - Global Access Enforcement Middleware
**Status**: ✅ COMPLETE

---

## Overview

Implemented global session validation middleware and workspace access control utilities to enforce subscription compliance across all API routes.

---

## Implementation Summary

### **Components Created**

1. **Session Validation Middleware** - `src/middleware.ts`
2. **Access Control Utilities** - `src/lib/firebase/access-control.ts`

---

## Middleware Architecture

### **Why Two-Layer Approach?**

**Layer 1: Edge Middleware (Session Validation)**
- Runs on Next.js Edge runtime
- Validates session cookie exists
- Returns 401 Unauthorized if no session
- Fast, lightweight check

**Layer 2: API Route Enforcement (Workspace Status)**
- Runs in Node.js runtime (API routes)
- Uses Firebase Admin SDK
- Checks workspace subscription status
- Returns 403 Forbidden if access denied

**Why Not Full Enforcement in Middleware?**
- Next.js middleware runs on Edge runtime (no Node.js APIs)
- Firebase Admin SDK requires Node.js runtime
- Firestore queries need Admin SDK (Edge can't access)

**Solution:**
- Middleware validates session
- API routes call `requireWorkspaceWriteAccess()` before mutations
- API routes call `requireWorkspaceReadAccess()` for sensitive reads

---

## Session Validation Middleware

**File**: `src/middleware.ts`

### **Public Routes (Skip Validation)**

```typescript
const publicRoutes = [
  '/api/health',
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/callback',
  '/api/auth/signout',
];
```

### **Protected Routes (Require Session)**

All other `/api/*` routes require:
- `__session` cookie (Firebase ID token), OR
- `firebase-auth-token` cookie (fallback)

### **Enforcement Logic**

```typescript
if (pathname.startsWith('/api/')) {
  const sessionCookie =
    request.cookies.get('__session')?.value ||
    request.cookies.get('firebase-auth-token')?.value;

  if (!sessionCookie) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication required. Please sign in.' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}
```

### **Matcher Configuration**

```typescript
export const config = {
  matcher: ['/api/:path*'],
};
```

---

## Access Control Utilities

**File**: `src/lib/firebase/access-control.ts`

### **Access Rules Matrix**

| Status      | Read Access | Write Access |
|-------------|-------------|--------------|
| `active`    | ✅ Allow    | ✅ Allow     |
| `trial`     | ✅ Allow    | ✅ Allow     |
| `past_due`  | ✅ Allow    | ❌ Block     |
| `canceled`  | ❌ Block    | ❌ Block     |
| `suspended` | ❌ Block    | ❌ Block     |
| `deleted`   | ❌ Block    | ❌ Block     |

### **Core Functions**

**1. checkWorkspaceAccess()**

```typescript
const accessCheck = await checkWorkspaceAccess(workspaceId, isWriteOperation);

if (!accessCheck.allowed) {
  // Access denied
  console.warn(`Access denied: ${accessCheck.reason}`);
}
```

**2. requireWorkspaceWriteAccess()**

```typescript
// Use at start of POST/PUT/DELETE API routes
await requireWorkspaceWriteAccess(workspaceId);

// If access denied, throws WorkspaceAccessError (403)
```

**3. requireWorkspaceReadAccess()**

```typescript
// Use at start of GET API routes (for sensitive data)
await requireWorkspaceReadAccess(workspaceId);

// If access denied, throws WorkspaceAccessError (403)
```

### **Custom Error Class**

```typescript
class WorkspaceAccessError extends Error {
  code: string;           // 'SUBSCRIPTION_CANCELED', 'PAYMENT_PAST_DUE', etc.
  status: string;         // Workspace status ('canceled', 'past_due', etc.)
  httpStatus: number;     // 403 Forbidden

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      status: this.status,
    };
  }
}
```

### **User-Friendly Error Messages**

| Error Code               | Message                                                              |
|--------------------------|----------------------------------------------------------------------|
| `PAYMENT_PAST_DUE`       | Your payment is past due. Please update your payment method...       |
| `SUBSCRIPTION_CANCELED`  | Your subscription has been canceled. Please reactivate...            |
| `ACCOUNT_SUSPENDED`      | Your account has been suspended. Please contact support...           |
| `WORKSPACE_DELETED`      | This workspace has been deleted and is no longer accessible.         |

---

## Usage Example

**API Route with Access Enforcement:**

```typescript
// src/app/api/players/create/route.ts

import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { getUserByUid } from '@/lib/firebase/services/users';
import { requireWorkspaceWriteAccess, WorkspaceAccessError } from '@/lib/firebase/access-control';
import { createPlayer } from '@/lib/firebase/services/players';

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const dashboardUser = await getDashboardUser();
    if (!dashboardUser) {
      return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 2. Get user's workspace
    const user = await getUserByUid(dashboardUser.uid);
    const workspaceId = user.defaultWorkspaceId;

    // 3. Enforce workspace write access (Phase 7)
    await requireWorkspaceWriteAccess(workspaceId);

    // 4. If we get here, access is allowed - proceed with creation
    const body = await request.json();
    const player = await createPlayer(user.id, { workspaceId, ...body });

    return Response.json({ success: true, player }, { status: 200 });
  } catch (error: any) {
    // Handle workspace access errors
    if (error instanceof WorkspaceAccessError) {
      return Response.json(error.toJSON(), { status: error.httpStatus });
    }

    // Other errors
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

---

## Error Response Format

**Subscription Canceled Example:**

```json
{
  "error": "SUBSCRIPTION_CANCELED",
  "message": "Your subscription has been canceled. Please reactivate your subscription to continue.",
  "status": "canceled"
}
```

**Payment Past Due Example:**

```json
{
  "error": "PAYMENT_PAST_DUE",
  "message": "Your payment is past due. Please update your payment method to continue creating content.",
  "status": "past_due"
}
```

---

## Logging

**Middleware Logs:**

```
[MIDDLEWARE] Unauthorized access attempt: /api/players/create
```

**Access Control Logs:**

```
[ACCESS CONTROL] Access denied: workspace=ws_abc123, status=canceled, operation=write
```

---

## Next Steps (Task 2)

- Create React hook `useWorkspaceAccess()` for client-side enforcement
- Implement UI redirect to `/billing` when subscription inactive
- Add top-banner warning when trial nearing end

---

## Files Created

1. `src/middleware.ts` - Session validation middleware
2. `src/lib/firebase/access-control.ts` - Workspace access utilities
3. `000-docs/218-AA-MAAR-hustle-phase7-task1-access-middleware.md` - This AAR

---

## Success Criteria Met ✅

- [x] Middleware validates session on all API routes
- [x] Public routes excluded (health check, auth endpoints)
- [x] Access control utilities created
- [x] Workspace status enforcement rules defined
- [x] Helper functions for API route integration
- [x] Custom error class with structured responses
- [x] User-friendly error messages
- [x] Logging for access denials
- [x] Documentation complete

---

**End of Mini AAR - Task 1 Complete** ✅

---

**Timestamp**: 2025-11-16
