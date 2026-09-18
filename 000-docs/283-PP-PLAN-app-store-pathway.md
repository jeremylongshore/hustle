# Hustle — App Store & Google Play Pathway (2026-09)

**Status:** Current plan. Roadmap: 281 (PWA in P3, native apps in P6) · Money: 282 §5 · Safety: 285
**Caveat:** store policies and minor-safety laws are moving fast in 2026. **Re-verify every policy line below against the live Apple App Review Guidelines and Google Play policy at submission time.**

---

## 1. Decision: PWA first, then an Expo native app

| Option | Verdict | Why |
|---|---|---|
| **PWA** (installable Next.js) | ✅ **Ships in P3** | Near-free. Gives web push, an install prompt, and offline stat entry. It won't appear in the stores |
| Capacitor/WebView wrapper around the site | ❌ | Apple 4.2 (minimum functionality) rejects repackaged websites, and our Next.js app is server-rendered |
| Revive `99-Archive/mobile` | ❌ | It is fully bound to Firebase, and GCP has been torn down |
| **New Expo (React Native) app on the existing API** | ✅ **P6** | A real native app. It reuses screens and navigation from the archive (Expo Router, NativeWind, React Query), and EAS Build/Submit signs both platforms without a Mac |

**One backend.** The Expo app calls the same `/api/*` routes. The API needs these additions:
- A mobile auth endpoint that issues short-lived access tokens plus refresh tokens.
- Bearer-token support in the route guards.
- An Expo push-token table.
- A resumable video upload endpoint (P4).

## 2. Prerequisites (start now; some have long lead times)

- [ ] **D-U-N-S number** for Intent Solutions LLC. It is free but takes days to weeks, and both stores require it for an organization account.
- [ ] **Apple Developer Program**, organization enrollment ($99/yr), plus the **Small Business Program** (15% commission).
- [ ] **Google Play Console** organization account ($25 once). New *personal* accounts must pass a 12-tester, 14-day closed test first; organization accounts skip that gate.
- [ ] A RevenueCat account, with Family products created in App Store Connect and the Play Console.
- [ ] Support URL, privacy policy URL (`/privacy` already exists), and marketing URL.

## 3. Compliance checklist (the usual rejection reasons, plus minors)

- [ ] **Account deletion inside the app** (Apple 5.1.1(v)), plus a web deletion URL for Play's Data safety form.
- [ ] **Age signals:** integrate the **Apple Declared Age Range API** and the **Google Play Age Signals API**, and handle every response state. This is driven by the state App Store Accountability Acts (UT and LA in 2027; TX is currently enjoined). **Verify the current deadlines at build time** (285 §2).
- [ ] **Audience:** positioned for parents and teens. Don't enrol in Apple's Kids Category or Google's Designed for Families. COPPA still applies to any under-13 data, and teen protections apply (285).
- [ ] **User-generated content (Apple 1.2):** content filtering and moderation, report, block, and published contact info. **The recruiting reel pipeline must already have these before submission.**
- [ ] **No private adult-to-minor messaging.** Recruiter contact is routed to the parent (281 P4). Tell the reviewer this in the review notes.
- [ ] **Privacy label and Data safety declarations:** health and fitness data, photos and videos, contact info, coarse location (optional). No tracking, no ATT prompt, no ad SDKs.
- [ ] **Billing:** Family is sold through IAP in the app (RevenueCat). A US link-out to web checkout only if the current rules allow it (282 §5).
- [ ] **Sign in with Apple:** only required if we add third-party social login (4.8). Email/password alone does not trigger it.
- [ ] **HealthKit / Health Connect:** not in v1. Adding them brings extra review.
- [ ] **Demo accounts for review:** a parent with an athlete, a verified-recruiter account, and seeded stats and a seeded reel.
- [ ] **Age rating:** answer the updated questionnaire (Apple's new 13+/16+/18+ bands). UGC video with parent-gated visibility probably lands at 13+. Confirm this.

## 4. Build and release (P6, about 8 weeks)

| Week | Step |
|---|---|
| 1 | Expo project scaffold. Token auth API. EAS project with SOPS-managed secrets |
| 2–4 | Track (games, practice, co-sign), Train (plans, guided sessions, rest timer), Plan (calendar and push) |
| 4–6 | Get Seen (profile, reel upload with moderation, parent approvals), Compete (badges, challenges) |
| 6 | RevenueCat IAP, age-signals APIs, deletion flow, crash reporting, offline queue |
| 6–7 | **TestFlight** internal, then external (needs Beta App Review). **Play** internal testing, then closed testing |
| 7–8 | Store listings and screenshots (6.9" and 6.5" iPhone, plus iPad if supported; Play phone and tablets). Submit |
| 8+ | Phased release on iOS. Staged rollout on Play (10% → 50% → 100%) |

**CI:** a GitHub Actions workflow runs `eas build` and `eas submit` on version tags, with secrets from SOPS, following the estate standard.

## 5. Listing draft

- **Name:** Hustle — Soccer Training & Recruiting
- **Subtitle (iOS, 30 chars max):** "Train. Track. Get Recruited."
- **Hook:** "Your whole soccer life in one app — workouts, games, calendar, and a verified highlight profile college coaches trust. Parent-controlled. Never sold."

## 6. After launch

- Keep crash-free sessions at 99.5% or better before any marketing push.
- Reply to reviews within 48 hours.
- Build a force-upgrade endpoint before v1.0 so old API contracts can be retired.
