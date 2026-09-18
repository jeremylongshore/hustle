# ADR-001: Migration from SuperTokens to NextAuth v5

**Date:** 2025-10-05
**Status:** ✅ Completed
**Decision Makers:** Jeremy Longshore, Claude Code

---

## Context

Hustle MVP was initially built with SuperTokens authentication but faced complexity in setup, configuration, and developer experience. The application needed a simpler, more maintainable authentication solution that integrated seamlessly with Next.js 15 App Router.

---

## Decision

Migrate from SuperTokens to NextAuth v5 (Auth.js) with the following implementation:

- **Auth Library:** NextAuth v5 beta (next-auth@5.0.0-beta.25)
- **Strategy:** JWT-based sessions with credentials provider
- **Session Storage:** In-memory JWT tokens (30-day expiry)
- **Password Security:** bcrypt hashing (10 rounds)
- **Database:** Prisma ORM with PostgreSQL for user storage

---

## Rationale

### Why NextAuth v5?

1. **Native Next.js Integration**
   - Built specifically for Next.js App Router
   - Server-side authentication with `await auth()`
   - No external infrastructure required

2. **Simpler Architecture**
   - No SuperTokens core server needed
   - No separate authentication API
   - Reduced deployment complexity

3. **Developer Experience**
   - Clear documentation for App Router
   - Built-in TypeScript support
   - Familiar patterns for Next.js developers

4. **Security Features**
   - JWT token-based sessions
   - bcrypt password hashing
   - Server-side session validation
   - Configurable session expiry

### Why NOT SuperTokens?

- Required external core server (docker-compose dependency)
- Complex configuration with App Router
- Callback-based session handling (`withSession`) felt outdated
- Additional infrastructure maintenance burden

---

## Implementation

### 1. Database Schema Changes

**Before (SuperTokens):**
```prisma
model User {
  id        String   @id @default(cuid())  // SuperTokens userId
  firstName String
  lastName  String
  email     String   @unique
  phone     String
  password  String   // SuperTokens managed
}
```

**After (NextAuth):**
```prisma
model User {
  id            String    @id @default(cuid())
  firstName     String
  lastName      String
  email         String    @unique
  emailVerified DateTime?
  phone         String
  password      String    // bcrypt hashed

  // NextAuth relations
  accounts      Account[]
  sessions      Session[]

  // App relations
  players       Player[]
}

// NextAuth tables
model Account { ... }
model Session { ... }
model VerificationToken { ... }
```

### 2. Authentication Flow

**Sign In:**
1. User submits email/password via `/login` page
2. Client calls `signIn('credentials', { email, password, redirect: false })`
3. NextAuth validates credentials against database
4. bcrypt compares password with stored hash
5. JWT token generated and stored in cookie
6. Redirect to `/dashboard`

**Session Protection:**
```typescript
// Server Component
import { auth } from '@/lib/auth';

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <div>{children}</div>;
}
```

**Logout:**
```typescript
// Server Action
'use server';
import { signOut } from '@/lib/auth';

export async function handleSignOut() {
  await signOut({ redirectTo: '/' });
}
```

### 3. Configuration

**File:** `/src/lib/auth.ts`

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
```

---

## UI Integration

### Kiranism Dashboard

Integrated Kiranism Next.js dashboard starter with NextAuth:

**Changes Made:**
- Removed all Clerk authentication code
- Created `app-sidebar-simple.tsx` without Clerk dependencies
- Updated `user-nav.tsx` to use NextAuth session
- Modified `header.tsx` to pass session data
- Created server-protected `dashboard/layout.tsx`

**Files:**
- `/src/app/dashboard/layout.tsx` - Server-side session check
- `/src/components/layout/app-sidebar-simple.tsx` - Sidebar without Clerk
- `/src/components/layout/user-nav.tsx` - User dropdown with NextAuth
- `/src/components/layout/header.tsx` - Header with session prop

---

## Trade-offs

### Advantages ✅

1. **Simplicity:** No external auth server required
2. **Performance:** JWT tokens, no database lookups per request
3. **Maintenance:** One less service to manage and deploy
4. **Developer Experience:** Clear, documented Next.js patterns
5. **Security:** Industry-standard JWT + bcrypt

### Disadvantages ❌

1. **Session Storage:** JWT tokens can't be invalidated before expiry
2. **Scalability:** All session data in JWT (size limits)
3. **Advanced Features:** No built-in email verification, 2FA
4. **Migration Cost:** Existing SuperTokens users need password reset

---

## Migration Steps Completed

- [x] Phase 1: Remove SuperTokens core configuration
- [x] Phase 2: Install NextAuth dependencies
- [x] Phase 3: Configure NextAuth with JWT strategy
- [x] Phase 4: Create login page with NextAuth signIn()
- [x] Phase 5: Create dashboard with session protection
- [x] Phase 6: Integrate Kiranism UI components
- [x] Phase 7: Update Prisma schema with NextAuth models
- [x] Phase 8: Test authentication flow

---

## Consequences

### Immediate

- ✅ Removed docker-compose SuperTokens service
- ✅ Simplified deployment (one less container)
- ✅ Cleaner Next.js App Router integration
- ✅ Server-side session protection working

### Future Considerations

1. **Email Verification:** Will need custom implementation or third-party service
2. **Password Reset:** Requires building custom flow with token generation
3. **OAuth Providers:** Can add Google, GitHub, etc. with NextAuth
4. **2FA:** Needs custom implementation or plugin

---

## Alternatives Considered

| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **SuperTokens** | Full-featured, managed sessions | Complex setup, extra infrastructure | ❌ Rejected |
| **NextAuth v5** | Next.js native, simple | Limited advanced features | ✅ Selected |
| **Clerk** | Complete auth platform | Vendor lock-in, cost | ❌ Too expensive |
| **Auth0** | Enterprise-grade | Complex, overkill for MVP | ❌ Overkill |
| **Custom Auth** | Full control | Security risks, time-consuming | ❌ Too risky |

---

## Validation

### Test Scenarios

1. ✅ User can sign in with valid credentials
2. ✅ Invalid credentials show error message
3. ✅ Dashboard redirects to /login when unauthenticated
4. ✅ Session persists across page refreshes
5. ✅ User can logout and session clears
6. ✅ Protected API routes check session

### Known Issues

1. **404 on /auth:** Fixed by updating `pages.signIn` from `/auth` to `/login`
2. **Empty passwords:** Database has 2 test users with empty passwords from SuperTokens migration

---

## References

- [NextAuth v5 Documentation](https://authjs.dev/getting-started/installation)
- [Next.js 15 App Router Auth Guide](https://nextjs.org/docs/app/building-your-application/authentication)
- [Kiranism Dashboard Starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)
- [Prisma NextAuth Adapter](https://authjs.dev/getting-started/adapters/prisma)

---

## Approval

**Approved By:** Jeremy Longshore
**Implementation Date:** 2025-10-05
**Status:** ✅ Production Ready

---

**Last Updated:** 2025-10-05
**Next Review:** 2025-11-05
