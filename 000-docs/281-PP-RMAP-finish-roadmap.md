# Hustle — Finish Roadmap (2026-09 reboot)

**Status:** Current plan. Vision: 280 · Money: 282 · Stores: 283
**Tracking:** one beads epic per phase. Each deliverable is a bead, and each phase gets a GitHub issue. The standard mirror setup in `bd-sync` applies.

The estimates assume one builder working with Claude. They are ranges, not promises. **Each phase has an exit gate, and we do not start the next phase until the gate is met.**

```
P0 Reset ──▶ P1 Core polish ──▶ P2 Web monetization ──▶ P3 Open Gym MVP ──▶ P4 Mobile ──▶ P5 Growth
 1–2 wk        2–3 wk              ~2 wk                  4–6 wk              6–8 wk       ongoing
                                                              └─ PWA ships inside P3 (check-in needs a phone)
```

---

## P0 — Reset the repo (1–2 weeks)

Goal: a repo a stranger could clone and trust.

- [ ] Extract `nwsl/` (389 files, unrelated video pipeline) to its own repo, or delete it.
- [ ] Delete the dead trees: `tmp/`, `tools/adk_docs_crawler`, `functions/`, `docs/` (a stray `index.html`), and the machine-local `google-adk-reference` symlink.
- [ ] Delete the orphaned `src/app/games/` routes, which duplicate `dashboard/games` outside the workspace guard. Also delete the dead `src/lib/prisma.ts` stub.
- [ ] Rename `src/types/firestore.ts` to domain types, touching about 90 importers. This is naming debt only.
- [ ] **Reconcile plan limits.** `src/lib/billing/plan-limits.ts` (UI, informational) and `src/lib/stripe/plan-mapping.ts` (enforced) must become one source.
- [ ] Fix the **Release workflow**. It fails on every main push because there is no `v*` tag, so `v0.0.0..HEAD` is an unknown revision. Seed a `v1.0.0` tag or guard the step.
- [ ] Work down `npm audit`: 32 findings, including 4 critical and 13 high.
- [ ] Confirm that the SQLite volume (`/data/hustle.db`) is in the VPS borg backup, and **prove a restore**.
- [ ] Move rate limiting from an in-memory `Map` to a SQLite-backed limiter. That is fine while we run a single node.
- [ ] Remove the stray untracked `mobile/` directory, which holds an Expo cache and a dead Firebase key.

**Exit gate:** CI and Release are green, audit criticals and highs are resolved or waived with written reasons, a restore has been tested, and the tree contains only code that ships.

## P1 — Core polish (2–3 weeks)

- [ ] **Parent and coach co-sign.** Replace the boolean `games.verified` with signer, role, and timestamp. Coaches get invited by link, not by account sprawl.
- [ ] Onboarding: signup, then the first athlete, then the first log, in under 2 minutes. Measure it.
- [ ] Mobile-responsive pass on every dashboard page, since this is the future PWA.
- [ ] Data export (CSV/PDF season report) and **account deletion** from the UI. Stores require deletion (283), and parents deserve export.
- [ ] Refresh the empty states, the landing page, and the pricing page to match 282.

**Exit gate:** 5 real families have used it for 2 weeks, and nothing is on fire.

## P2 — Web monetization (~2 weeks)

- [ ] Collapse the tiers to **Free / Family** (Club comes later), per 282. Update `plan-mapping.ts`, the landing page, and the paywall copy.
- [ ] Create the Stripe live products and prices, store the keys in `.env.sops`, and flip `BILLING_ENABLED=true`.
- [ ] Turn on Stripe Tax. Publish the refund and cancellation policy. Update the ToS and privacy policy (COPPA language, parent consent).
- [ ] Run the billing E2E against Stripe test clocks: trial, then conversion, then failed payment, then dunning, then cancellation.

**Exit gate:** the first real paid subscription, with a webhook replay audit showing it clean.

## P3 — Open Gym MVP (4–6 weeks)

- [ ] Schema: `host`, `venue`, `session`, `booking`, `check_in`, `waiver`, plus the Drizzle migrations.
- [ ] Host onboarding through **Stripe Connect Express**, plus a manual approval queue (an admin page).
- [ ] Host tools: create one-off or recurring sessions, capacity, waitlist, a roster for each session, cancel and refund.
- [ ] Parent flow: browse by distance, date, and age, then book, pay, and sign the waiver, then get the confirmation email over SMTP.
- [ ] Athlete-side "request to join," which the parent approves.
- [ ] QR check-in. The host scans the athlete's code, and that writes a Dream Gym log automatically.
- [ ] **PWA:** manifest, service worker, install prompt, and web push for reminders. This covers door check-in before native apps exist.
- [ ] Payouts, fee reporting, and a dispute runbook.
- [ ] Recruit 5–10 hosts by hand in the launch metro before public launch.

**Exit gate:** 50 paid bookings and a repeat-booking rate of at least 25%.

## P4 — Native apps (6–8 weeks)

Details are in 283.
- [ ] A new Expo app, built fresh and borrowing screens from `99-Archive/mobile`, pointed at the existing API with bearer-token auth.
- [ ] Scope: Dream Gym logging, game logging, the Open Gym browse, book, and check-in flow, push notifications, and account deletion.
- [ ] RevenueCat for Family IAP, mapped to the same workspace plan through a webhook.
- [ ] TestFlight and Play closed testing, then store review, then a staged rollout.

**Exit gate:** live in both stores and crash-free at ≥99.5%.

## P5 — Growth (ongoing)

Club and team accounts with roster seats · a second metro for Open Gym · host marketing tools · an exportable season or recruiting profile · deeper AI features (a workout plan built from logged data). Social and recruiting feeds stay out unless 280 §6 is revisited.

---

## Risks that could sink this

| Risk | Mitigation |
|---|---|
| Open Gym cold start (no hosts means no parents) | One metro, hosts recruited by hand, Hustle waives fees for the first 90 days |
| Child-safety incident at a host | Parent-only booking, verified hosts, waivers, no direct messaging, a written incident runbook |
| App-store rejection | No thin web wrapper. A real native app, a demo account, deletion in-app (283) |
| Solo-builder bandwidth | Phase gates. Nothing starts until the previous gate is met |
| SQLite single node | Fine to thousands of users. Tested restore in P0, with a Postgres migration path documented if needed |
