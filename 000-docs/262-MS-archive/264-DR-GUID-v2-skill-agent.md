# Hustle v2.0 — Agent Instructions

> **Read this file first before any task.** This is the master specification for rebuilding Hustle from scratch.

---

## 🎯 Project Overview

**Hustle** is a youth soccer performance tracking platform for parents, guardians, and coaches. It tracks athlete development through game statistics, training logs, physical development, mental wellness, and AI-generated training strategies.

**Domain:** hustlestats.io  
**App Name:** Hustle (not HustleStats)  
**Version:** 2.0 (complete rebuild)

---

## 🔴 Critical Priority: Auth Stability

The #1 reason for this rebuild is **auth instability** in v1. Auth must be:
- Simple (no complex fallback logic)
- Reliable (no random logouts)
- Tested (verify before moving on)

**Before building ANY feature, auth must work perfectly.**

Read `AUTH.md` skill before implementing any auth-related code.

---

## 👥 Target Users

- Parents/guardians of youth soccer players (ages 8-18)
- Youth soccer coaches
- COPPA compliant (parent owns child's data)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5, React 19 |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Google + Email/Password) |
| Storage | Firebase Storage |
| Payments | Stripe (subscriptions) |
| AI | Google Vertex AI |
| Email | Resend |
| Animations | Framer Motion |
| Forms | react-hook-form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Fonts | Geist Sans + Geist Mono |

---

## 🎨 Design System

**Theme:** Warm Amber/Gold — energetic, premium, modern sports-tech

Read `DESIGN-SYSTEM.md` before building any UI components.

**Key principles:**
- Light mode primary (warm beige backgrounds)
- Bold, impactful typography
- Rounded corners (8px base)
- Subtle shadows
- Progress rings for visual accents
- Framer Motion for all animations

---

## 📁 Project Structure

```
hustle/
├── public/
│   ├── animations/
│   │   ├── workout/          # 23 MP4 exercise videos
│   │   ├── soccer/           # 13 PNG soccer drill images
│   │   └── recovery/         # Lottie breathing animation
│   ├── videos/
│   │   └── GOAL.mp4          # Hero section video
│   └── images/
│       ├── tracks.jpg        # CTA background
│       ├── sport-path.jpg    # Auth page background
│       └── og-image.jpg      # Social share image
├── src/
│   ├── app/
│   │   ├── (public)/         # Landing, login, register, etc.
│   │   ├── dashboard/        # Protected routes
│   │   └── api/              # API routes
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── layout/           # Sidebar, Header
│   │   └── [feature]/        # Feature-specific components
│   ├── hooks/                # Custom React hooks
│   ├── lib/
│   │   ├── firebase/         # Firebase client + admin
│   │   └── utils/            # Utilities
│   └── types/                # TypeScript types
├── skills/                   # Claude skill files
│   ├── AGENT.md              # This file
│   ├── DESIGN-SYSTEM.md
│   ├── AUTH.md
│   ├── SPORTS-UI.md
│   ├── ANIMATION.md
│   ├── FIREBASE.md
│   └── DREAM-GYM.md
└── functions/                # Firebase Cloud Functions (separate project)
```

---

## 🔑 Auth Methods

| Method | Status |
|--------|--------|
| Google Sign-In | ✅ Primary (recommended) |
| Email/Password | ✅ Secondary |
| Apple Sign-In | ❌ Not supported |

**Auth Flow:**
1. User signs in (Google popup or email/password)
2. Firebase returns ID token
3. POST to `/api/auth/set-session` with token
4. Server sets `__session` httpOnly cookie (14 days)
5. Redirect to `/dashboard`

**Session Rules:**
- Single cookie: `__session` (no fallbacks)
- HttpOnly, Secure, SameSite=Lax
- 14-day expiry
- Middleware checks cookie exists, redirects to `/login` if not

---

## 💳 Pricing Tiers

| Plan | Price | Athletes | Games/mo | Storage | Features |
|------|-------|----------|----------|---------|----------|
| Free Trial | $0 | 2 | 10 | 100MB | Basic stats |
| Starter | $9 | 5 | 50 | 500MB | Basic stats |
| Plus | $19 | 15 | 200 | 2GB | + Advanced analytics |
| Pro | $39 | Unlimited | Unlimited | 10GB | + Export + Priority support |

---

## 📄 Key Pages

### Public
- `/` — Landing page (GOAL.mp4 hero video)
- `/login` — Sign in (Google + Email)
- `/register` — Sign up
- `/reset-password` — Password reset
- `/verify-email` — Email verification
- `/terms` — Terms of service

### Dashboard (Protected)
- `/dashboard` — Overview with stats cards
- `/dashboard/athletes` — Athlete list
- `/dashboard/athletes/[id]` — Athlete detail
- `/dashboard/add-athlete` — Add new athlete
- `/dashboard/games` — Games list
- `/dashboard/log-game` — Log new game
- `/dashboard/dream-gym` — Dream Gym hub
- `/dashboard/dream-gym/[module]` — Individual modules
- `/dashboard/analytics` — Performance analytics
- `/dashboard/settings` — Account settings
- `/dashboard/billing` — Subscription management

---

## 🏋️ Dream Gym Modules

| Module | Purpose | Animation Assets |
|--------|---------|------------------|
| Onboarding | Guided setup | — |
| Schedule | Training calendar | — |
| Workout | Strength & conditioning | 23 workout MP4s |
| Cardio | Endurance training | Running animations |
| Mental | Journal, mood, visualization | Breathing Lottie |
| Strategy | Game tactics | — |
| Progress | Track improvements | Charts |
| Biometrics | Height, weight, fitness | — |
| Assessments | Skills evaluation | — |
| Practices | Drill recommendations | 13 soccer PNGs |

---

## 📋 Skill Reference Guide

**Before building, read the relevant skill:**

| Task | Read First |
|------|------------|
| Any UI component | `DESIGN-SYSTEM.md` + `/mnt/skills/public/frontend-design/SKILL.md` |
| Auth (login, register, session) | `AUTH.md` |
| Sports components (stats, progress) | `SPORTS-UI.md` |
| Animations & transitions | `ANIMATION.md` |
| Firebase operations | `FIREBASE.md` |
| Dream Gym features | `DREAM-GYM.md` |

---

## ✅ Build Order (Recommended)

1. **Project setup** — Next.js 15 + Tailwind + shadcn/ui
2. **Design system** — Colors, fonts, base components
3. **Auth** — Google Sign-In + Email/Password (TEST THOROUGHLY)
4. **Layout** — Sidebar, header, dashboard shell
5. **Landing page** — Hero with GOAL.mp4
6. **Athletes CRUD** — Add, edit, delete, list
7. **Games logging** — Log games, view history
8. **Dream Gym** — Module by module
9. **Billing** — Stripe integration
10. **Analytics** — Charts and insights

---

## 🚫 Do NOT

- Use complex auth patterns (no AbortController, no fallback cookies)
- Mix client and server Firebase SDK in same file
- Skip TypeScript types
- Use inline styles (use Tailwind)
- Forget mobile responsiveness
- Build features before auth works

---

## ✨ Do

- Keep auth simple and tested
- Use Framer Motion for all animations
- Follow the warm amber design system
- Make it premium and polished
- Test on mobile
- Use the exercise/soccer animations for Dream Gym

---

*Hustle v2.0 — Let's build something incredible* 🚀
