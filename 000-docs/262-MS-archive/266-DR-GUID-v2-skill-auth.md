# Hustle Auth System

> **⚠️ CRITICAL: Auth stability is the #1 priority for this rebuild.**  
> Read this entire file before implementing any auth-related code.

---

## 🎯 Auth Philosophy

### What Went Wrong in v1
- Complex fallback cookie logic
- AbortController complexity in login flow
- Multiple session management paths
- Random logout issues

### What We Do in v2
- **ONE cookie**: `__session` (no fallbacks)
- **ONE flow**: Firebase → token → API → cookie → redirect
- **SIMPLE middleware**: cookie exists? yes → continue, no → redirect
- **NO complexity**: no AbortController, no fallback logic

---

## 🔑 Supported Auth Methods

| Method | Priority | Notes |
|--------|----------|-------|
| Google Sign-In | Primary | One-click, most reliable |
| Email/Password | Secondary | Requires email verification |
| Apple Sign-In | ❌ Disabled | Not supported |

---

## 🏗 Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client Side   │     │   API Route     │     │   Middleware    │
│                 │     │                 │     │                 │
│  Firebase Auth  │────▶│ /api/auth/      │────▶│  Check cookie   │
│  (Google/Email) │     │ set-session     │     │  Protect routes │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         │                      ▼                       │
         │              ┌───────────────┐               │
         │              │   __session   │               │
         │              │    cookie     │◀──────────────┘
         │              └───────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│   Firestore     │     │   Protected     │
│   User Profile  │     │   Dashboard     │
└─────────────────┘     └─────────────────┘
```

---

## 📁 File Structure

```
src/
├── app/
│   ├── (public)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify-email/page.tsx
│   └── api/
│       └── auth/
│           ├── set-session/route.ts    # Set cookie after login
│           ├── logout/route.ts         # Clear cookie
│           └── me/route.ts             # Get current user
├── lib/
│   └── firebase/
│       ├── client.ts                   # Client SDK init
│       ├── admin.ts                    # Admin SDK init
│       └── auth.ts                     # Auth helper functions
├── hooks/
│   └── useAuth.ts                      # Client-side auth state
└── middleware.ts                       # Route protection
```

---

## 🔧 Implementation

### 1. Firebase Client Setup

```typescript
// src/lib/firebase/client.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
```

### 2. Firebase Admin Setup

```typescript
// src/lib/firebase/admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const adminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

const app = getApps().length === 0 ? initializeApp(adminConfig) : getApps()[0];

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
```

### 3. Set Session API Route

```typescript
// src/app/api/auth/set-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

const COOKIE_NAME = '__session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days in seconds

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing ID token' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Create session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: COOKIE_MAX_AGE * 1000, // milliseconds
    });

    // Build response
    const response = NextResponse.json({ 
      success: true,
      uid: decodedToken.uid 
    });

    // Set cookie
    response.cookies.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Set session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 401 }
    );
  }
}
```

### 4. Logout API Route

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

const COOKIE_NAME = '__session';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the session cookie
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  });

  return response;
}
```

### 5. Middleware

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = '__session';

// Routes that don't require auth
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/verify-email',
  '/resend-verification',
  '/terms',
  '/privacy',
];

// Routes that start with these prefixes are public
const publicPrefixes = [
  '/api/auth/',
  '/_next/',
  '/favicon',
  '/images/',
  '/videos/',
  '/animations/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicPrefix = publicPrefixes.some(prefix => pathname.startsWith(prefix));

  if (isPublicRoute || isPublicPrefix) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    // No session, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists, allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 6. useAuth Hook

```typescript
// src/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setState({ user, loading: false, error: null });
      },
      (error) => {
        setState({ user: null, loading: false, error });
      }
    );

    return () => unsubscribe();
  }, []);

  return state;
}
```

---

## 🚀 Login Flows

### Google Sign-In

```typescript
// src/app/(public)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/client';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Sign in with Google
      const result = await signInWithPopup(auth, googleProvider);
      
      // 2. Get ID token
      const idToken = await result.user.getIdToken();
      
      // 3. Create session
      const response = await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      // 4. Redirect to dashboard
      router.push('/dashboard');

    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleGoogleSignIn} 
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

### Email/Password Sign-In

```typescript
const handleEmailSignIn = async (email: string, password: string) => {
  setLoading(true);
  setError(null);

  try {
    // 1. Sign in with email/password
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // 2. Check email verification
    if (!result.user.emailVerified) {
      setError('Please verify your email before signing in.');
      await auth.signOut();
      return;
    }
    
    // 3. Get ID token
    const idToken = await result.user.getIdToken();
    
    // 4. Create session
    const response = await fetch('/api/auth/set-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    // 5. Redirect to dashboard
    router.push('/dashboard');

  } catch (err: any) {
    console.error('Email sign-in error:', err);
    
    // Handle specific Firebase errors
    if (err.code === 'auth/invalid-credential') {
      setError('Invalid email or password.');
    } else if (err.code === 'auth/user-not-found') {
      setError('No account found with this email.');
    } else {
      setError('Failed to sign in. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
```

### Logout

```typescript
const handleLogout = async () => {
  try {
    // 1. Sign out from Firebase
    await auth.signOut();
    
    // 2. Clear session cookie
    await fetch('/api/auth/logout', { method: 'POST' });
    
    // 3. Redirect to login
    router.push('/login');
    
  } catch (err) {
    console.error('Logout error:', err);
  }
};
```

---

## 📝 Registration Flow

```typescript
const handleRegister = async (data: RegisterForm) => {
  setLoading(true);
  setError(null);

  try {
    // 1. Create user with email/password
    const result = await createUserWithEmailAndPassword(
      auth, 
      data.email, 
      data.password
    );

    // 2. Update profile with name
    await updateProfile(result.user, {
      displayName: `${data.firstName} ${data.lastName}`,
    });

    // 3. Send verification email
    await sendEmailVerification(result.user);

    // 4. Create user profile in Firestore
    await createUserProfile(result.user.uid, {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      isParentGuardian: data.isParentGuardian,
      createdAt: new Date(),
    });

    // 5. Sign out (user must verify email first)
    await auth.signOut();

    // 6. Redirect to verify email page
    router.push('/verify-email?email=' + encodeURIComponent(data.email));

  } catch (err: any) {
    console.error('Registration error:', err);
    
    if (err.code === 'auth/email-already-in-use') {
      setError('An account with this email already exists.');
    } else if (err.code === 'auth/weak-password') {
      setError('Password is too weak.');
    } else {
      setError('Failed to create account. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 🛡 Server-Side Auth Helpers

```typescript
// src/lib/firebase/auth.ts
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './admin';

const COOKIE_NAME = '__session';

// Get current user from session cookie (server-side)
export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie.value,
      true // Check if revoked
    );

    return decodedClaims;
  } catch (error) {
    return null;
  }
}

// Get user with profile data
export async function getCurrentUserWithProfile() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const profileDoc = await adminDb
    .collection('users')
    .doc(user.uid)
    .get();

  return {
    ...user,
    profile: profileDoc.exists ? profileDoc.data() : null,
  };
}

// Require auth or throw
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
```

---

## ✅ Auth Checklist

Before moving on to other features, verify:

- [ ] Google Sign-In works end-to-end
- [ ] Email/Password Sign-In works
- [ ] Email verification flow works
- [ ] Session cookie is set correctly
- [ ] Session cookie is httpOnly
- [ ] Logout clears the cookie
- [ ] Protected routes redirect to login
- [ ] Public routes don't require auth
- [ ] Middleware runs without errors
- [ ] No random logouts after page refresh
- [ ] No random logouts after closing/reopening browser
- [ ] Session persists for 14 days

---

## 🚫 Do NOT

- Add fallback cookie logic
- Use AbortController in auth flows
- Mix client and admin SDK in same file
- Store sensitive data in localStorage
- Skip email verification for email/password users
- Create multiple session cookies

---

## ✅ Do

- Keep the flow simple: Firebase → token → API → cookie → redirect
- Use httpOnly cookies only
- Handle all Firebase error codes gracefully
- Log auth errors for debugging
- Test auth thoroughly before moving on

---

*Simple auth = reliable auth* 🔐
