# Hustle — Reboot Vision (2026-09)

**Status:** Current. This document is the product north star.
**Supersedes:** everything in `262-MS-archive/` (the PRDs, roadmaps, and go-live plans written before the reboot).
**Companion docs:** 281 (roadmap) · 282 (monetization) · 283 (App Store / Play pathway)

---

## 1. One line

**Hustle is where a youth soccer player's training, games, and open gym time live — owned by the parent, built for the athlete.**

## 2. Who it is for

| Role | What they want | Relationship to Hustle |
|---|---|---|
| **Parent / guardian** | Proof of progress, one place for the schedule, a safe way to find extra training | **Account owner and payer.** Owns the child's data. |
| **Athlete (13–18)** | Log workouts and games fast, see themselves improve | Primary daily user and the data subject. Acts inside the parent's workspace. |
| **Host** (gym, trainer, club, facility) | Fill open gym sessions, get paid, less admin | New role, introduced by Open Gym. Supplies sessions. |
| **Coach** | Verify stats, see who is putting in the work | Later. Co-signs games and gets roster views. |

## 3. Where we actually are (verified 2026-09-18)

The web app is live at hustlestats.io. It runs self-hosted on the VPS: Next.js, NextAuth v5, Drizzle on SQLite, and Claude for the AI features. Health is green, and SMTP mail is restored as of PR #50.

**Working today:** auth (register, verify, reset, PIN), athletes, game logging and stats, and the full Dream Gym (workouts, cardio, mental and breathing, Fuel Station meals, biometrics, assessments, schedule, progress). The AI recommendations work too. So does Stripe billing, with checkout, portal, webhooks, and plan enforcement, but it is **switched off** (`BILLING_ENABLED=false`).

**Not there:**
- no mobile app (the Firebase-bound Expo app is archived in `99-Archive/mobile`)
- no open gym
- verification is a single self-PIN rather than a parent-plus-coach co-sign
- the repo carries dead weight from abandoned side projects: `nwsl/`, the ADK crawler, `tmp/`, `functions/`

## 4. The four pillars

1. **Track.** Games and stats that someone other than the athlete can vouch for, via a parent or coach co-sign.
2. **Train.** Dream Gym is the daily habit loop. It is already built, so it needs polish rather than new scope.
3. **Open Gym.** Find, book, and check into drop-in sessions near you. Attendance flows straight into the athlete's training log. This is the new growth and revenue engine (§5).
4. **Pocket.** Native iOS and Android apps, preceded by an installable PWA. Parents live on their phones, and check-in at the door needs a phone.

## 5. Open Gym — drop-in sessions

### The idea
Hosts post drop-in sessions: futsal open gym, speed and agility, finishing clinics, goalkeeper nights. Each session has a time, place, capacity, age band, skill level, and price. Parents discover sessions nearby, book and pay, and sign the waiver once. The athlete checks in at the door with a QR code. That attendance shows up automatically in Dream Gym as a logged session, with duration and type.

### Why it matters
- **Retention loop.** Booking leads to attendance, which is logged automatically, which shows as progress, which drives the next booking. Logging stops being a chore.
- **Growth loop.** Every host brings its own parents. Hosts share their session links, and each link is a Hustle signup.
- **Money that is not subject to app-store commission.** Booking a real-world session counts as a physical service, so it can go through Stripe even inside the iOS and Android apps. See 282 and 283.

### Core objects
`host` (a business or individual, onboarded to Stripe Connect) → `venue` (address, geo) → `session` (a time slot with capacity, price, age band, level, and an optional recurrence) → `booking` (parent, athlete, payment, status) → `check_in` (QR scan with a timestamp, which writes a Dream Gym log).

### Trust and safety (non-negotiable because the users are minors)
- Only a **parent** can book or pay. Athletes can browse and request a session, and the parent approves it.
- Waivers are signed digitally by the parent, per host, and stored with the booking.
- Hosts are verified: Stripe Connect KYC, plus a stated proof of liability insurance, plus manual approval while supply is small.
- No direct host-to-athlete messaging. Messages go to the parent.
- A session's exact address is visible only after booking. Browsing shows the neighborhood and distance.

### Launch shape
Launch in **one metro** with 5–10 hosts recruited by hand. Supply comes first, because a marketplace with no sessions is dead on arrival. Expand only after bookings repeat.

## 6. What we are deliberately **not** doing

- **Social feed or the "TikTok of youth soccer" recruiting feed.** It carries high moderation and child-safety cost. Revisit after product-market fit.
- **Multi-sport.** We stay soccer-first. The Open Gym data model stays sport-agnostic, so this remains an option later.
- **Agent platforms** (Vertex/ADK "Scout agent," A2A). These are abandoned. AI stays as focused Claude features inside the product.
- **The NWSL video pipeline.** It gets extracted from this repo.

## 7. How we will know it is working

| Metric | Target by end of first Open Gym metro season |
|---|---|
| Weekly active athletes (log ≥1 thing/week) | 40% of activated athletes |
| Free → Family conversion | ≥5% |
| Open Gym repeat-booking rate (parent books again within 30 days) | ≥35% |
| Active hosts with ≥4 sessions/month | 10 |
| Crash-free sessions (mobile) | ≥99.5% |

## 8. Principles

- **The parent owns the data.** That means export and delete at any time, in-app and on the web.
- **Web first, stores second.** Every feature ships on the web and the PWA before it is native.
- **One source of truth.** The API serves both web and mobile, with no second backend.
- **Honest docs.** When the code changes, the doc changes in the same PR, or the doc goes to the archive.
