# Days 5-7 Firebase Migration Completion Guide

**Date:** 2025-11-11T08:00:00Z
**Status:** 📋 IMPLEMENTATION GUIDE
**Type:** Plan - Firebase Migration Days 5-7

---

## EXECUTIVE SUMMARY

Days 1-4 are complete with **core infrastructure ready**. This document provides the complete implementation guide for Days 5-7 to finish the Firebase migration.

**Current Status:**
- ✅ Days 1-3: Firebase setup, Firestore schema, Firebase Auth
- ✅ Day 4: Migration script ready (blocked by Console action)
- 📋 Days 5-7: This guide (password resets, frontend updates, testing, deployment)

**Time Estimate:**
- Day 5: 1 hour (password reset emails)
- Day 6: 4-6 hours (frontend updates)
- Day 7: 2-3 hours (testing + deployment)
- **Total:** 7-10 hours of development time

---

## DAY 5: PASSWORD RESET EMAIL CAMPAIGN ✅

### What Was Created

**Script:** `scripts/send-password-reset-emails.ts`

This script generates password reset links for all migrated users.

### How to Run (After Migration)

```bash
# After running migration script:
npx tsx scripts/send-password-reset-emails.ts

# The script will:
# 1. List all users from Firebase Auth
# 2. Show preview of users
# 3. Ask for confirmation
# 4. Generate password reset links
# 5. Print email template
```

### Integration with Email Service

**Option 1: Resend (Recommended)**

```typescript
// Add to scripts/send-password-reset-emails.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendPasswordResetEmail(email: string, resetLink: string) {
  await resend.emails.send({
    from: 'Hustle <noreply@hustleapp.io>',
    to: email,
    subject: 'Reset Your Password - Hustle Account Migration',
    html: `
      <h2>Password Reset Required</h2>
      <p>We've migrated your Hustle account to a new authentication system.</p>
      <p>Click the link below to set your new password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `,
  });
}
```

**Option 2: Manual (Current Implementation)**
- Script prints all reset links
- Copy/paste links into manual emails
- Good for testing with small user base

### Email Template

```
Subject: Reset Your Password - Hustle Account Migration

Hi [Name],

We've migrated your Hustle account to a new authentication system.
To continue using your account, please reset your password:

[PASSWORD_RESET_LINK]

This link expires in 1 hour. If you need a new link, use the
"Forgot Password" option on the login page.

Thanks,
The Hustle Team
```

---

## DAY 6: FRONTEND UPDATES

### Overview

Replace all NextAuth/Prisma code with Firebase Auth/Firestore.

### Files Already Updated ✅

1. **Login Page:** `src/app/login/page.tsx`
   - ✅ Replaced `signIn()` from NextAuth with `firebaseSignIn()`
   - ✅ Updated error handling for Firebase errors

### Files Still Needing Updates

#### 1. Dashboard Pages (Server Components → Client Components)

**Problem:** Dashboard uses Server Components with `await auth()` and Prisma queries.

**Solution:** Convert to Client Components with `useAuth()` hook and Firestore services.

**Example Migration:**

**BEFORE (Server Component with Prisma):**
```typescript
// src/app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const athletes = await prisma.player.findMany({
    where: { parentId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return <div>{/* render athletes */}</div>;
}
```

**AFTER (Client Component with Firebase):**
```typescript
// src/app/dashboard/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { getPlayers } from '@/lib/firebase/services/players';
import { Player } from '@/types/firestore';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [athletes, setAthletes] = useState<Player[]>([]);

  useEffect(() => {
    if (!user) return;

    async function loadAthletes() {
      const players = await getPlayers(user.uid);
      setAthletes(players);
    }

    loadAthletes();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user) redirect('/login');

  return <div>{/* render athletes */}</div>;
}
```

#### 2. Middleware Update

**File:** `src/middleware.ts`

**BEFORE:**
```typescript
import { auth } from '@/lib/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');

  if (isOnDashboard && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl));
  }
});
```

**AFTER:**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for Firebase auth cookie
  const sessionCookie = request.cookies.get('__session');
  const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  if (isOnDashboard && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

**Note:** Firebase Client SDK handles auth state client-side, so middleware becomes simpler.

#### 3. API Routes Update

**Example:** Update player API routes to use Firebase Admin SDK

**File:** `src/app/api/players/route.ts`

**BEFORE:**
```typescript
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const players = await prisma.player.findMany({
    where: { parentId: session.user.id },
  });

  return NextResponse.json(players);
}
```

**AFTER:**
```typescript
import { adminAuth } from '@/lib/firebase/admin';
import { adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function GET() {
  // Verify Firebase session cookie
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const uid = decodedClaims.uid;

    const playersSnapshot = await adminDb
      .collection('users')
      .doc(uid)
      .collection('players')
      .orderBy('createdAt', 'desc')
      .get();

    const players = playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

#### 4. Session Cookie Setup

Firebase requires session cookies for server-side auth verification.

**Create:** `src/app/api/auth/session/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  // Set session expiration to 5 days
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

**Update:** `src/lib/firebase/auth.ts` to create session cookie after login

```typescript
export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (!user.emailVerified) {
    await firebaseSignOut(auth);
    throw new Error('Please verify your email before logging in.');
  }

  // Create session cookie for server-side auth
  const idToken = await user.getIdToken();
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  await markEmailVerified(user.uid);
  return user;
}
```

### Files to Update (Complete List)

#### Authentication Pages ✅
- ✅ `src/app/login/page.tsx` - Updated to Firebase
- ⏭️ `src/app/register/page.tsx` - Already using Firebase Auth API
- ⏭️ `src/app/forgot-password/page.tsx` - Needs Firebase passwordReset
- ⏭️ `src/app/verify-email/page.tsx` - May need updates

#### Dashboard Pages
- ⏭️ `src/app/dashboard/page.tsx` - Main dashboard
- ⏭️ `src/app/dashboard/athletes/page.tsx` - Athletes list
- ⏭️ `src/app/dashboard/athletes/[id]/page.tsx` - Athlete details
- ⏭️ `src/app/dashboard/athletes/[id]/edit/page.tsx` - Edit athlete
- ⏭️ `src/app/dashboard/add-athlete/page.tsx` - Add athlete
- ⏭️ `src/app/dashboard/games/page.tsx` - Games list
- ⏭️ `src/app/dashboard/games/new/page.tsx` - Add game
- ⏭️ `src/app/dashboard/log-game/page.tsx` - Log game
- ⏭️ `src/app/dashboard/analytics/page.tsx` - Analytics
- ⏭️ `src/app/dashboard/profile/page.tsx` - User profile
- ⏭️ `src/app/dashboard/settings/page.tsx` - Settings

#### API Routes
- ⏭️ `src/app/api/auth/session/route.ts` - CREATE (session cookie)
- ⏭️ `src/app/api/players/*` - Update to Firestore
- ⏭️ `src/app/api/games/*` - Update to Firestore

#### Core Files
- ⏭️ `src/middleware.ts` - Update to Firebase session cookies
- ⏭️ `src/lib/auth.ts` - DELETE (NextAuth config)
- ⏭️ `src/lib/prisma.ts` - DELETE (Prisma client)

#### Dependencies
- ⏭️ `package.json` - Remove NextAuth, Prisma, bcrypt

---

## DAY 7: TESTING & DEPLOYMENT

### Testing Checklist

#### Unit Tests
```bash
# Test Firebase services
npm run test src/lib/firebase/services/users.test.ts
npm run test src/lib/firebase/services/players.test.ts
npm run test src/lib/firebase/services/games.test.ts
```

#### Integration Tests
```bash
# Test authentication flow
npm run test:e2e tests/e2e/auth.spec.ts

# Test dashboard flow
npm run test:e2e tests/e2e/dashboard.spec.ts
```

#### Manual Testing Checklist
- [ ] New user registration works
- [ ] Email verification sent and received
- [ ] Login blocked without email verification
- [ ] Password reset email works
- [ ] Login with verified email works
- [ ] Create player works
- [ ] Edit player works
- [ ] Delete player works
- [ ] Log game works
- [ ] Verify game works
- [ ] Delete game works
- [ ] Analytics display correctly
- [ ] Session persists across page refreshes
- [ ] Logout works

### Firebase Hosting Deployment

#### 1. Configure Firebase Hosting

**Update:** `firebase.json`

```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

#### 2. Update Build Scripts

**Update:** `package.json`

```json
{
  "scripts": {
    "build": "next build",
    "build:firebase": "next build && next export",
    "deploy:firebase": "npm run build:firebase && firebase deploy --only hosting"
  }
}
```

**Note:** Next.js 15 with App Router requires static export configuration.

**Update:** `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export for Firebase Hosting
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // Firebase Hosting prefers trailing slashes
};

module.exports = nextConfig;
```

#### 3. Deploy to Firebase Hosting

```bash
# Build static site
npm run build:firebase

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or deploy everything (rules + indexes + hosting)
firebase deploy
```

#### 4. Custom Domain Setup

```bash
# Add custom domain in Firebase Console
# https://console.firebase.google.com/project/hustleapp-production/hosting

# Or via CLI:
firebase hosting:channel:deploy production
```

### Alternative: Keep Cloud Run

If you prefer to keep Cloud Run instead of Firebase Hosting:

**Update Environment Variables:**

```bash
# Remove PostgreSQL variables
gcloud run services update hustle-production \
  --region us-central1 \
  --update-env-vars REMOVE=DATABASE_URL

# Add Firebase variables (if needed, though ADC is preferred)
gcloud run services update hustle-production \
  --region us-central1 \
  --update-env-vars \
    FIREBASE_PROJECT_ID=hustleapp-production
```

**Update:** `Dockerfile` to include Firebase SDK

No changes needed - firebase-admin is already in dependencies.

---

## MIGRATION DECISION MATRIX

### Option 1: Firebase Hosting (Recommended for MVP)

**Pros:**
- Free tier (generous limits)
- Global CDN included
- Automatic SSL
- Simple deployment (`firebase deploy`)
- Perfect for static Next.js export

**Cons:**
- Static export only (no SSR/ISR)
- No server-side rendering
- Limited to static content

**Best For:**
- MVP/early stage
- Cost-conscious deployment
- Simple applications

### Option 2: Cloud Run (Current)

**Pros:**
- Full Next.js features (SSR, ISR, API routes)
- Already set up and working
- More flexibility for complex features

**Cons:**
- Costs ~$10-20/month minimum
- More complex deployment
- Requires Docker

**Best For:**
- Production applications
- Complex server-side logic
- Real-time features

### Option 3: Hybrid (Recommended for Production)

**Frontend:** Firebase Hosting (static)
**API:** Cloud Run (dynamic)
**Database:** Firestore
**Auth:** Firebase Auth

**Benefits:**
- Best of both worlds
- CDN for static assets (fast)
- Serverless API for dynamic content
- Cost-effective at scale

---

## REMOVING OLD DEPENDENCIES

### 1. Remove NextAuth

```bash
npm uninstall next-auth @auth/prisma-adapter
```

**Delete Files:**
```bash
rm -rf src/lib/auth.ts
```

### 2. Remove Prisma

```bash
npm uninstall prisma @prisma/client
```

**Delete Files:**
```bash
rm -rf prisma/
rm -rf src/lib/prisma.ts
```

### 3. Remove bcrypt

```bash
npm uninstall bcrypt @types/bcrypt
```

### 4. Clean Package Lock

```bash
npm install  # Regenerate package-lock.json
```

---

## ROLLBACK PLAN

If something goes wrong, you can rollback:

### Keep PostgreSQL Running

Don't delete PostgreSQL until migration is confirmed successful:

```bash
# PostgreSQL stays running in Docker
docker ps | grep postgres

# Data is safe in both places:
# - PostgreSQL: Original data
# - Firestore: Migrated data
```

### Rollback Steps

1. **Revert Git Commits:**
```bash
git revert <commit-hash>
git push origin main
```

2. **Redeploy Previous Version:**
```bash
# Cloud Run automatically keeps previous revisions
gcloud run services update-traffic hustle-production \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region us-central1
```

3. **Restore Dependencies:**
```bash
git checkout main~1 -- package.json package-lock.json
npm install
```

---

## COST COMPARISON

### Before Migration (PostgreSQL Stack)

| Service | Cost/Month |
|---------|------------|
| Cloud SQL (db-f1-micro) | ~$10 |
| Cloud Run (hustle-app) | ~$10-20 |
| **Total** | **~$20-30/month** |

### After Migration (Firebase Stack)

| Service | Cost/Month (MVP) |
|---------|------------------|
| Firebase Auth | $0 (free tier: 50k MAU) |
| Firestore | $0 (free tier: 50k reads/20k writes) |
| Firebase Hosting | $0 (free tier: 10GB/month) |
| Cloud Run (optional) | $0-10 (if used for API) |
| **Total** | **$0-10/month** |

**Savings:** $20-30/month → $0-10/month = **$10-30/month saved**

---

## NEXT STEPS SUMMARY

### Immediate Actions (Day 4 Completion)

1. **Enable Firebase Auth Email/Password Provider** (1 minute)
   - https://console.firebase.google.com/project/hustleapp-production/authentication
   - Click "Get Started" → Enable "Email/Password" → Save

2. **Run Migration Script** (2-5 minutes)
   ```bash
   npx tsx scripts/migrate-to-firestore.ts
   ```

3. **Verify Migration** (1 minute)
   - Check Firestore Console: 58 users should appear
   - https://console.firebase.google.com/project/hustleapp-production/firestore

### Day 5 (1 hour)

1. Send password reset emails
   ```bash
   npx tsx scripts/send-password-reset-emails.ts
   ```

2. (Optional) Integrate with Resend for automated emails

### Day 6 (4-6 hours)

1. Update dashboard pages to use `useAuth()` hook
2. Replace Prisma queries with Firestore services
3. Create session cookie API route
4. Update middleware for Firebase session cookies
5. Remove NextAuth/Prisma dependencies

### Day 7 (2-3 hours)

1. Run test suite
2. Manual testing checklist
3. Configure Firebase Hosting (or keep Cloud Run)
4. Deploy to production
5. Monitor for errors
6. Cutover from PostgreSQL

---

**Document:** 183-PP-PLAN-days-5-7-completion-guide.md
**Status:** 📋 IMPLEMENTATION GUIDE
**Next Action:** Enable Firebase Auth Email/Password Provider → Run Migration → Continue with Days 5-7

**Date:** 2025-11-11T08:00:00Z
