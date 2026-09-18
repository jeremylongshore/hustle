# Hustle — Finish Roadmap (2026-09 reboot)

**Status:** Current plan.
**Related docs:** vision 280 · money 282 · stores 283 · competition 284 · safety 285.
**Tracking:** one beads epic per phase, one GitHub issue per phase, mirrored with `bd-sync`.

The estimates assume one builder working with Claude. They are ranges, not promises. **Each phase has an exit gate, and we don't start the next phase until the gate is met.**

```
P0 Reset ─▶ P1 Safety foundation + Track ─▶ P2 Web money ─▶ P3 Train + Plan + PWA ─▶ P4 Get Seen ─▶ P5 Compete ─▶ P6 Native apps
 1–2 wk       3–4 wk                          ~2 wk          4–6 wk                   6–8 wk          3–4 wk        6–8 wk
```

Why this order:
- **Safety comes before any public or social feature.** Money comes before expensive features.
- **Train** builds on code we already have.
- **Get Seen** carries the heaviest compliance load (video moderation, recruiter verification, the NCAA question), so it goes after the foundation is solid.
- **Native apps** wrap a finished product.

---

## P0 — Reset the repo (1–2 weeks)

- [ ] Extract `nwsl/` (389 files, an unrelated video pipeline) into its own repo, or delete it.
- [ ] Delete `tmp/`, `tools/adk_docs_crawler`, `functions/`, and `docs/`, plus the machine-local `google-adk-reference` symlink and the stray untracked `mobile/` directory.
- [ ] Delete the orphaned `src/app/games/` routes and the dead `src/lib/prisma.ts` stub. Rename `src/types/firestore.ts` to domain types.
- [ ] Reconcile the two plan-limit sources: `billing/plan-limits.ts` and `stripe/plan-mapping.ts`.
- [ ] Fix the Release workflow. It fails on every push because there is no `v*` tag.
- [ ] `npm audit`: resolve or waive the 4 critical and 13 high findings, with written reasons.
- [ ] Confirm `/data/hustle.db` is in the VPS borg backup, and **prove a restore**.
- [ ] Move rate limiting from the in-memory `Map` to SQLite.

**Exit gate:** CI and Release are green, audit highs are cleared, a restore has been proven, and the tree contains only shipping code.

## P1 — Safety foundation and Track (3–4 weeks)

Items come from the 285 MUST list.
- [ ] **Age gate and parental consent flow:**
  - The parent creates the account.
  - Athlete sub-accounts require parent consent.
  - Under-13 users are handled under the amended COPPA Rule, with a separate consent for sending data to AI.
- [ ] **Parent controls:** visibility settings, contact approval, an activity summary, and an audit log.
- [ ] **Account deletion and data export** (CSV/PDF season report), available in the UI.
- [ ] **Co-signed stats:** replace `games.verified: boolean` with signer, role, and timestamp. Coaches are invited by link. Show "Verified by Coach X".
- [ ] Practice logging polish, and a mobile-responsive pass on every dashboard page.
- [ ] Privacy policy and ToS rewritten, with **counsel review booked**.

**Exit gate:** 5 real families have used it for 2 weeks, and counsel has reviewed the consent flow.

## P2 — Web monetization (~2 weeks)

- [ ] Tiers become **Free / Family** (282). Update `plan-mapping.ts`, the pricing page, and the paywall.
- [ ] Stripe live keys in `.env.sops`, `BILLING_ENABLED=true`, Stripe Tax on, published refund policy.
- [ ] Billing E2E on Stripe test clocks: trial → convert → failed payment → dunning → cancel.

**Exit gate:** the first real paid subscription, with a clean replay audit.

## P3 — Train and Plan, plus the PWA (4–6 weeks)

- [ ] **AI gym plans (the openGym blueprint, our own code):**
  - onboarding questions → a week of routines
  - progression rules (linear, double progression, timed holds)
  - estimated 1RM and PR detection
  - a muscle map covering balance, fatigue, and detraining
  - an **AI coach that proposes changes with evidence**, which the user approves or undoes
  - soccer-specific templates (in-season vs. off-season, position) and age-appropriate load caps
- [ ] Exercise library: MIT-licensed ExerciseDB text plus our own or licensed media. **No disputed animations.**
- [ ] **Calendar:** one view across games, practices, workouts, and events. ICS feed and Google/Apple sync. Game-day awareness (taper, fuel, reminders).
- [ ] **PWA:** manifest, service worker, install prompt, web push, and an **offline stat-entry queue** for tournaments with bad connectivity.

**Exit gate:** 60% of active athletes follow a generated plan for 3 or more weeks.

## P4 — Get Seen: the recruiting and highlight hub (6–8 weeks)

- [ ] **Recruiting profile:**
  - co-signed stats, position, grad year, academics (optional), and the reel
  - link-ins from Hudl, Trace, Veo, and YouTube, plus direct upload
- [ ] **Video pipeline:** upload → transcode → **moderation** (Hive or similar) → **CSAM hash-matching and the NCMEC reporting runbook** → publish. Report and block tools. Encrypted storage.
- [ ] **Visibility:** parent-approved. Choose private, verified recruiters only, or a public link. No address, school location, or contact info in public view.
- [ ] **Verified recruiter accounts:** check the .edu domain against the program's staff directory, with manual review. Free.
- [ ] **Contact:** recruiters message the **parent's inbox**, and the athlete sees messages only after parent approval. There is never private adult-to-minor messaging.
- [ ] Honest engagement signals: "Coach X (University) viewed your film", with no inflated counts.
- [ ] Reel guidance by position, and an AI highlight trim assist later.
- [ ] **Decision gate: get a legal read on the NCAA "recruiting/scouting service" rules** before any recruiter-side paid feature (285).

**Exit gate:** 25 verified recruiters, and 100 profiles published with parent approval.

## P5 — Compete (3–4 weeks)

- [ ] Personal bests, streaks, and **effort badges**, which reward consistency and improvement rather than raw talent.
- [ ] Invite-only team or group challenges, which a coach or parent approves.
- [ ] Age-banded leaderboards, **opt-in, within invited groups only**, with the formula visible.
- [ ] A parent toggle to hide boards. Overtraining nudges (too many sessions in a week).

**Exit gate:** challenge participants retain at 30 days better than non-participants.

## P6 — Native apps (6–8 weeks)

283 has the details. It is a new Expo app on the same API, with RevenueCat for in-app purchases, the age-signals APIs, the UGC moderation carried over, and a staged rollout.

**Exit gate:** live in both stores with ≥99.5% crash-free sessions.

---

## Risks

| Risk | Mitigation |
|---|---|
| A child-safety incident (contact or video) | P1 foundation first, parent-routed contact, moderation plus the NCMEC runbook, and an incident runbook |
| An empty recruiter side | Free access for verified recruiters, plus outreach to college programs in 1–2 regions. Profiles are useful to families even without recruiter logins, because they can share the link themselves |
| NCAA rules on scouting services | Legal read before monetizing the recruiter side. The default is free |
| Too big for one builder | Phase gates. P5 can slip without hurting the core |
| SQLite on a single node | Fine up to thousands of users. P0 proves the restore. Video lives in object storage, not the database |
