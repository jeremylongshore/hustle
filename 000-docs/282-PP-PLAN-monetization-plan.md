# Hustle — Monetization Plan (2026-09)

**Status:** Current proposal. Vision: 280 · Roadmap: 281 (P2 and P3) · Stores: 283
**Note:** all revenue figures are **illustrative arithmetic, not forecasts.** The assumptions are stated inline.

---

## 1. Revenue streams

| # | Stream | Who pays | When |
|---|---|---|---|
| 1 | **Family subscription** | Parent | P2 (web), P4 (in-app) |
| 2 | **Open Gym booking fees** | Parent (booking fee) and host (take rate) | P3 |
| 3 | **Host Pro** subscription | Host | P3 (late) |
| 4 | **Club / Team** seats | Club | P5 |

## 2. Subscription tiers — change from what is in code today

**Today** (`src/lib/stripe/plan-mapping.ts`): Free $0 · Starter $9 · Plus $19 · Pro $39. The tiers are split by athlete count, up to unlimited.

**The problem:** a family has 1–3 kids. Four tiers split by athlete count read like a SaaS price sheet for clubs, not a parent purchase, and the $39 tier has no family buyer.

**Proposed:**

| Tier | Price | Includes |
|---|---|---|
| **Free** | $0 | 1 athlete · game logging and basic stats · Dream Gym logging · Open Gym booking (booking fee applies) |
| **Family** | **$7.99/mo or $59.99/yr** (about 37% off) | Up to 4 athletes · full Dream Gym (plans, progress, assessments) · AI coach · parent and coach co-signed stats · season report export · **no Open Gym booking fee** |
| **Club** (P5) | Per-roster pricing, TBD | Coach dashboards, roster seats, team schedule |

- Offer a **14-day Family trial** at signup, with no card required on the web.
- Use the annual plan as the default presentation, because annual cuts churn in a seasonal sport.
- AI coach calls are gated to Family and capped per athlete per day. That keeps the Claude cost bounded (see §5).

## 3. Open Gym economics

- **Hosts set the price.** Drop-in youth sessions typically run $10–$25.
- **The platform take rate is 10%** of the session price, deducted from the host payout.
- **The parent pays a booking fee of $1.00** per booking. Family subscribers do not pay it, which is the upsell.
- **Payments go through Stripe Connect Express.** Hosts do their own KYC, and Stripe handles payouts and 1099-K reporting.

**Worked example** (a $15 session booked by a Free parent):

| | |
|---|---|
| Parent pays | $16.00 |
| Stripe processing (~2.9% + 30¢) | −$0.76 |
| Host receives (90% of $15) | $13.50 |
| **Hustle net** | **~$1.74** |

**Host Pro at $29/mo:** the take rate drops to 5%, and the host gets recurring sessions, waitlists, roster exports, and attendance analytics. At $15 a session, Pro saves the host $0.75 per booking, so it pays for itself at about 40 bookings a month.

**Launch incentive:** Hustle charges hosts no take rate for their first 90 days. We subsidize supply because supply is the bottleneck.

## 4. The app-store question (the part that decides the architecture)

| What is sold | iOS / Android in-app | Why |
|---|---|---|
| Family subscription (digital) | **Must offer store billing** (Apple IAP / Google Play Billing) when sold inside the app | Digital content and features consumed in the app |
| Open Gym booking (real-world service) | **Stripe is allowed** | Physical services consumed outside the app are exempt from IAP (Apple guideline 3.1.3(e) and 3.1.5; Google Play payments policy exemption for physical services) |

**Strategy:**
1. **The web is the primary checkout.** Stripe on the web keeps close to 100% of revenue after processing.
2. In the native apps, offer Family through **IAP via RevenueCat**. A RevenueCat webhook updates the same `workspace.plan`, so one entitlement works everywhere.
3. Enroll in the **Apple Small Business Program** and use Google's 15% subscription rate: **15% commission** while revenue is under $1M.
4. **US link-out:** after the 2025 *Epic v. Apple* injunction and the *Epic v. Google* remedies, US apps may link out to web checkout. **Verify the current rules for both stores at submission time**, because this area is still moving. If they allow it, show a "subscribe on the web" link for US users alongside IAP.

## 5. Cost side (per paying family, monthly, rough)

| Cost | Estimate | Note |
|---|---|---|
| Hosting | ~$0 marginal | The VPS is already paid for, and SQLite is fine at this scale |
| Claude (AI coach) | $0.10–$0.50 | Caps per athlete per day. Use a small or fast model for tips and a larger one for plans |
| Email (MXroute SMTP) | ~$0 | Flat plan |
| Stripe | 2.9% + 30¢ | On $7.99 that is about $0.53. Annual billing cuts it to about $0.17/mo |
| Store commission | 15% | IAP purchases only |

Gross margin on a web Family subscription is **above 85%**.

## 6. Illustrative targets (assumptions, not a forecast)

- 1,000 paying Family subscriptions at about $60/yr (a mix of annual and monthly) is about **$60k ARR**.
- 10 hosts × 40 bookings/mo × ~$1.75 net is about **$700/mo** in Open Gym revenue in the launch metro.

Open Gym's bigger value is **acquisition**: every booking brings a parent into the Family funnel.

**Direction to model:** Open Gym revenue grows with metros. The subscription grows with how well Open Gym and Dream Gym retain users.

## 7. Must be true before charging (P2 gate)

- [ ] Stripe live keys and price IDs in `.env.sops`, and `BILLING_ENABLED=true`.
- [ ] Plan-limit sources reconciled into one (281 P0).
- [ ] Stripe Tax on. A CPA confirms the sales-tax position on subscriptions and on platform fees for marketplace services.
- [ ] ToS, refund and cancellation policy, and privacy policy updated for minors' data (COPPA, parental consent). These have legal review.
- [ ] Dunning emails (failed payment, trial ending) sent over SMTP and tested.
