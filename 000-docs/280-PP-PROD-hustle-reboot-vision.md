# Hustle — Reboot Vision (2026-09)

**Status:** Current. This is the product north star.
**Supersedes:** everything in `262-MS-archive/`.
**Companion docs:**
- 281 roadmap
- 282 monetization
- 283 App Store / Play pathway
- 284 competitive landscape
- 285 minor-safety compliance

---

## 1. One line

**Hustle is the one-stop shop for the youth soccer athlete.** It covers:
- training, practice, games and stats
- AI gym plans
- the calendar
- a safe place to compete
- a highlight hub that college recruiters actually use

The parent owns the account. The athlete owns their progress. There is **no predatory upsell**.

## 2. Why this wins (from 284)

Families juggle 4–6 apps today, and **no competitor covers the whole list**:

| Area | Tools families use now |
|---|---|
| Training | Techne, Beast Mode |
| Gym | Fitbod, Volt |
| Calendar | TeamSnap |
| Game video | Trace, Veo, Hudl |
| Recruiting | NCSA, SportsRecruits, FieldLevel |

The closest competitors each miss 2–3 of those pillars. The recruiting market runs on distrust: NCSA charges $2k–$6k+ behind sales calls, and Hudl moved youth teams to a $400/yr minimum. Most platforms take stats on the athlete's word, give parents no real control, and leave kids exposed on public profiles. **Our moat is trust.** That means verified stats, parent control, transparent pricing, and a safe design.

## 3. Who it is for

| Role | Wants | In Hustle |
|---|---|---|
| **Athlete (13–18)** | Train smarter, see progress, compete, get seen by colleges | Daily user; acts inside the parent's workspace |
| **Parent / guardian** | One place for everything, safety, a real shot at college | Account owner and payer. Approves visibility and contact |
| **Club / HS coach** | Verify stats, see who's putting in work | Co-signs games (free, invited by link) |
| **College recruiter** | Verified stats plus a short reel, filtered by position and grad year | **Free** verified-recruiter portal (see 282 §3 for why free) |

## 4. The pillars

| Pillar | What it is | State today |
|---|---|---|
| **Track** | Games, practices, and stats, **co-signed by a parent or coach** ("Verified by Coach X") | Game and practice logging work. Co-sign is a boolean, so it needs the real model |
| **Train** | AI gym and training plans that adapt to logged work, soccer-specific, age-appropriate. Built on the openGym blueprint (below) | Dream Gym logging works, and Claude gives recommendations. It still needs adaptive plans, progression, and a muscle map |
| **Plan** | One calendar for games, practices, workouts, and recruiting events; syncs to Apple/Google Calendar; game-day aware (taper, fuel) | The schedule exists but has no sync |
| **Compete** | Safe competition: personal bests, streaks, effort badges, **invite-only** team challenges, age-banded boards. No public national rankings | Not built |
| **Get Seen** | Recruiting profile with verified stats and a 2–3 minute highlight reel, links to Hudl, Trace, Veo, or YouTube, parent-approved visibility, and honest "Coach X viewed your film" alerts | Not built |
| **Safety (the foundation)** | Parent controls, consent, no private adult-to-minor messaging, moderation, data never sold | Partial. 285 is the checklist |

## 5. openGym — what we take and what we don't

The "Open Gym" project is `DuarteSantos8/openGym`: about 1k stars, AGPL-3.0, active September 2026.
- It **collects no money**: no subscription, no ads, no payment code.
- It is a single-user, self-hosted gym tracker that stores data as JSON files.

What we do with it:
- **Don't embed its code.** The AGPL license would force us to open-source Hustle.
- **Don't run it as our backend.** It isn't multi-tenant.
- **Don't ship its exercise animations.** Their ownership is disputed, according to its own README.
- **Do rebuild its best ideas in Hustle's own code:**
  - progression rules: linear, or double progression through a rep range
  - a muscle map showing balance, fatigue, and detraining
  - estimated 1RM and PR detection
  - guided sessions with rest timers
  - an **AI coach that proposes plan changes with evidence, which the user approves or undoes**
- **Exercise content:** the MIT-licensed text from ExerciseDB v1 is usable. Media must be our own or properly licensed, and ideally soccer-specific.

## 6. Out of scope (for now)

- Public social feed, DMs between athletes, or national public leaderboards (safety cost).
- Multi-sport. We stay soccer-first, with a data model that can generalize.
- Our own camera or sensor hardware. We **integrate** with Trace, Veo, Hudl, and PlayerMaker exports instead.
- Paid recruiting "advisors" or consulting. That is the NCSA model we are positioned against.
- The NWSL video pipeline, ADK agents, and Vertex (extracted or abandoned).

## 7. Success metrics (first 12 months after P2)

| Metric | Target |
|---|---|
| Weekly active athletes (≥1 log per week) | 40% of activated athletes |
| Free → Family conversion | ≥5% |
| Games with a coach or parent co-sign | ≥50% |
| Recruiting profiles with a reel and verified stats | ≥30% of athletes in grades 10–12 |
| Verified college recruiters active per month | 100, growing |
| Safety incidents escalated | 0 unhandled; 100% triaged within 24 hours |

## 8. Principles

- **The parent owns the data:** export and delete anytime, and **we never sell it**.
- **Verified beats volume.** One co-signed stat is worth more than ten self-reported ones.
- **Compete against yourself first.** Rankings are opt-in, age-banded, and within invited groups.
- **Web first, stores second.** There is one API behind web and mobile.
- **Honest docs:** the code and the doc change in the same PR.
