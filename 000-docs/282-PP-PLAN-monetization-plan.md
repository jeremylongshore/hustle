# Hustle — Monetization Plan (2026-09)

**Status:** current proposal. Related docs: vision 280 · roadmap 281 (P2) · stores 283 · competition 284 · safety 285.
**Note:** revenue figures are **illustrative arithmetic, not forecasts.**

---

## 1. Positioning on price

The market charges families in one of two ways (284):
- **Predatory:** NCSA at $2k–$6k+, with opaque pricing and sales calls.
- **Fragmented:** $10–20/mo *per app*, times 4–6 apps.

Hustle's pitch: **one transparent family price that replaces the stack.** There are no sales calls, and recruiting is never used as a guilt lever.

## 2. Tiers

**What's in the code today** (`src/lib/stripe/plan-mapping.ts`): Free $0 · Starter $9 · Plus $19 · Pro $39, split by athlete count. That's the wrong shape for families.

**Proposed:**

| Tier | Price | Includes |
|---|---|---|
| **Free** | $0 | • 1 athlete<br>• Game and practice logging<br>• Co-signed stats<br>• Calendar<br>• Basic Dream Gym logging<br>• **Basic recruiting profile:** verified stats plus one reel link |
| **Family** | **$9.99/mo or $79.99/yr** | • Up to 4 athletes<br>• **AI gym and training plans** (adaptive, with progression and the muscle map)<br>• Full recruiting hub: unlimited clips, direct upload, "recruiter viewed" alerts, reel guidance<br>• Challenges and badges<br>• Season report export<br>• Calendar sync |
| **Club** (P5+) | ~$299–$499 per team per year | • Coach dashboards<br>• Roster co-sign<br>• Team challenges<br>• Positioned below Hudl Bronze ($400/yr), which is video-only |

- **Benchmarks** (284): single-purpose youth apps cost $5–$20/mo. The researched sweet spot for a family all-in-one is $9.99–$14.99. Starting at **$9.99** undercuts a multi-app stack by 2–3×. $79.99/yr is 33% off monthly.
- **Trial:** 14-day Family trial. On the web, no card is needed.
- **Keep recruiting basics free:** a kid shouldn't need a paid plan to be seen. This is the honest wedge against NCSA.
- **AI cost control:** AI plans are Family-only, with per-athlete daily caps. Use a small model for tips and a larger one for weekly plans.

## 3. College recruiters: free, on purpose

- **Adoption:** recruiters don't log into paywalled databases (284). A free, useful portal is what brings them.
- **NCAA rules:** when an institution *pays* for information about prospects, "recruiting/scouting service" rules come into play. Those rules can require approval from the NCAA Enforcement Certification and Approvals Group (ECAG), the NCAA unit that approves scouting services. Keeping recruiter access free avoids that until counsel confirms the position (285).
- **Later, only after a legal read:** recruiter-side premium features such as CRM export, board tools, or bulk film.

## 4. Other revenue (later, optional)

- **Club partnerships** (the SportsRecruits pattern): bundle Family at a discount through clubs and leagues. This is a distribution play as much as a revenue one.
- **Integrations, not hardware:** affiliate or partner deals with Trace, Veo, or PlayerMaker, but only if they're transparent to families.
- **Never:** selling data, ads aimed at minors, or paid recruiting advisors.

## 5. Where payments happen (the app-store rules)

Everything Hustle sells is **digital**, so inside the iOS and Android apps it goes through store billing: Apple IAP and Google Play Billing.

| Channel | Billing | Hustle keeps (approx.) |
|---|---|---|
| Web (primary) | Stripe | ~96–97% (2.9% + 30¢) |
| iOS / Android in-app | IAP via **RevenueCat**, which syncs the same `workspace.plan` | 85%, via the Apple Small Business Program and Google's 15% rate for subscriptions |
| US in-app link-out to web checkout | Stripe | Allowed after the 2025 Epic rulings. **Re-verify both stores' current rules at submission** |

## 6. Unit economics (per paying family per month, rough)

| Item | Estimate |
|---|---|
| Revenue (annual plan) | ~$6.67 |
| Stripe | ~$0.20 |
| Claude (plans + tips, capped) | $0.10–$0.50 |
| Video storage and transcode (Family with uploads) | $0.10–$0.40. Keep reels short, and link-ins cost nothing |
| Moderation (per video minute) | Low cents. Budget it once Hive pricing is known |
| Hosting | ~$0 marginal (the VPS is already paid for) |

Gross margin on web Family is **roughly 85–90%**.

**Illustrative:** 1,000 families at ~$80/yr is ~$80k ARR. 5,000 families is ~$400k ARR.

## 7. Must be true before charging (P2 gate)

- [ ] Stripe live keys and price IDs in `.env.sops`, and `BILLING_ENABLED=true`
- [ ] A single plan-limit source of truth (281 P0)
- [ ] Stripe Tax on, and a CPA review of sales tax on digital subscriptions
- [ ] ToS, refund/cancellation policy, and privacy policy reviewed by counsel (minors: 285)
- [ ] Dunning and trial-ending emails sent over SMTP, and tested
