# Hustle v2.0 — Project Kickoff

## IMPORTANT: Read These Files First

Before doing ANYTHING, read these skill files in order:

1. `skills/AGENT.md` — Master project overview (READ THIS FIRST)
2. `skills/DESIGN-SYSTEM.md` — Warm amber color palette and UI patterns
3. `skills/AUTH.md` — Authentication patterns (CRITICAL - auth stability is the number one priority)

## Project Overview

We are rebuilding Hustle — a youth soccer performance tracking platform for parents and coaches. The previous version had persistent auth issues that caused random logouts. This rebuild prioritizes rock-solid authentication above all else.

- Domain: hustlestats.io
- App Name: Hustle (NOT HustleStats)

## Tech Stack

- Next.js 15 (App Router, Turbopack)
- TypeScript 5
- React 19
- Tailwind CSS 4
- shadcn/ui (Radix UI primitives)
- Firebase (Auth, Firestore, Storage)
- Framer Motion (all animations)
- Stripe (subscriptions)
- Zod + react-hook-form (validation)
- Lucide React (icons)
- Geist font (Google Fonts)

## Design System

- Theme: Warm Amber/Gold — NOT dark mode
- Background: Warm beige gradient (#F5EEDD to #EADBB8)
- Cards: White with subtle shadows
- Accent: Amber (#F59E0B)
- Primary buttons: Dark charcoal (#19191B)
- Border radius: 16px for cards, pill (rounded-full) for primary CTAs
- See skills/DESIGN-SYSTEM.md for complete color tokens and component patterns

## Assets Already Available

The following assets are already in the public folder:

public/animations/workout/ — 23 MP4 exercise videos
public/animations/soccer/ — 13 PNG soccer drill images
public/animations/recovery/ — breathing.json (Lottie)
public/videos/GOAL.mp4 — Hero section video (ball entering net)
public/images/tracks.jpg — Running track image
public/images/sport-path.jpg — Stadium/sports background for auth pages
public/images/og-image.jpg — Social share image

---

## Phase 1: Project Setup

### Step 1: Initialize Next.js 15 Project

Run this command:

npx create-next-app@latest hustle --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

### Step 2: Install Dependencies

Run these commands:

npm install class-variance-authority clsx tailwind-merge
npx shadcn@latest init
npm install firebase firebase-admin
npm install framer-motion
npm install react-hook-form @hookform/resolvers zod
npm install date-fns lucide-react
npm install recharts
npm install lottie-react

### Step 3: Configure Tailwind

Update tailwind.config.ts with the warm amber color palette from skills/DESIGN-SYSTEM.md

### Step 4: Set Up Folder Structure

Create this structure:

src/app/(public)/ — Landing, login, register pages
src/app/(public)/page.tsx — Landing page
src/app/(public)/login/page.tsx
src/app/(public)/register/page.tsx
src/app/(public)/reset-password/page.tsx
src/app/(public)/verify-email/page.tsx
src/app/dashboard/ — Protected routes
src/app/dashboard/layout.tsx — Sidebar + header
src/app/dashboard/page.tsx — Dashboard home
src/app/dashboard/athletes/
src/app/dashboard/games/
src/app/dashboard/dream-gym/
src/app/dashboard/analytics/
src/app/dashboard/settings/
src/app/dashboard/billing/
src/app/api/auth/set-session/route.ts
src/app/api/auth/logout/route.ts
src/components/ui/ — shadcn components
src/components/layout/ — Sidebar, Header
src/hooks/useAuth.ts
src/lib/firebase/client.ts
src/lib/firebase/admin.ts
src/lib/firebase/services/
src/types/

### Step 5: Set Up Firebase

Create src/lib/firebase/client.ts and src/lib/firebase/admin.ts following patterns in skills/AUTH.md

### Step 6: Create Environment Variables

Create .env.local with these variables:

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

---

## Phase 2: Authentication (CRITICAL)

WARNING: DO NOT proceed to Phase 3 until auth is 100 percent working and tested.

Read skills/AUTH.md completely before implementing.

### Auth Requirements

1. Google Sign-In (Primary) — One-click login
2. Email/Password (Secondary) — With email verification
3. Single session cookie — __session only, no fallbacks
4. Simple middleware — Just check cookie exists

### Auth Flow

1. User signs in (Google popup or email/password)
2. Get Firebase ID token
3. POST to /api/auth/set-session with token
4. Server creates session cookie (httpOnly, 14 days)
5. Redirect to /dashboard

### Files to Create for Auth

1. src/lib/firebase/client.ts — Client SDK init
2. src/lib/firebase/admin.ts — Admin SDK init
3. src/app/api/auth/set-session/route.ts — Create session cookie
4. src/app/api/auth/logout/route.ts — Clear session cookie
5. src/middleware.ts — Protect dashboard routes
6. src/hooks/useAuth.ts — Client-side auth state
7. src/app/(public)/login/page.tsx — Login page
8. src/app/(public)/register/page.tsx — Register page

### Auth Testing Checklist

Test ALL of these before moving on:

- Google Sign-In works
- Email/Password Sign-In works
- Session cookie is httpOnly
- Logout clears cookie
- Dashboard redirects to login when not authenticated
- Session persists after page refresh
- Session persists after browser restart
- No random logouts

---

## Phase 3: Core Layout

After auth works perfectly, build:

1. Dashboard Layout — Sidebar + header + main content area
2. Sidebar — Logo, nav items, logout button, collapsible
3. Header — Page title, user avatar
4. Page transitions — Framer Motion fade/slide

Read skills/ANIMATION.md for Framer Motion patterns.

---

## Phase 4: Landing Page

1. Hero Section — GOAL.mp4 video background with dark overlay
2. Headline — Bold typography over video
3. CTA Buttons — "Get Started Free" + "Watch Demo"
4. Features Section — What Hustle offers
5. Pricing Section — 4 tiers (Free, Starter, Plus, Pro)
6. Footer — Links, social, copyright

---

## Phase 5: Core Features

Build in this order:

1. Athletes CRUD (add, edit, delete, list)
2. Games logging
3. Dashboard overview with stats
4. Dream Gym modules (use skills/DREAM-GYM.md)

---

## Key Rules

### Always Do

- Read the relevant skill file before each task
- Use Framer Motion for ALL animations
- Follow the warm amber design system
- Test on mobile (responsive)
- Handle loading and error states
- Use TypeScript properly (no any types)

### Never Do

- Use complex auth patterns (keep it simple)
- Add fallback cookies
- Mix Firebase client and admin SDK in same file
- Use inline styles (use Tailwind)
- Skip mobile responsiveness
- Build features before auth works perfectly

---

## Skill File Reference

When working on specific tasks, read these skills first:

- Project setup: skills/AGENT.md
- Any UI component: skills/DESIGN-SYSTEM.md
- Auth implementation: skills/AUTH.md
- Sports components: skills/SPORTS-UI.md
- Animations: skills/ANIMATION.md
- Firebase/Firestore: skills/FIREBASE.md
- Dream Gym features: skills/DREAM-GYM.md

---

## START NOW

Begin with Phase 1: Project Setup.

1. First, read skills/AGENT.md completely
2. Then read skills/DESIGN-SYSTEM.md
3. Initialize the Next.js project
4. Install all dependencies
5. Set up the folder structure
6. Configure Tailwind with the design system colors

After setup is complete, move to Phase 2 (Auth) and read skills/AUTH.md before implementing.

Let's build Hustle v2.0!
