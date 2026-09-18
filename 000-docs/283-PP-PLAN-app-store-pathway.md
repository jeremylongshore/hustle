# Hustle — App Store and Google Play Pathway (2026-09)

**Status:** Current plan. Roadmap: 281 (PWA in P3, native apps in P4) · Money: 282 §4
**Caveat:** store policies change. **Re-verify every policy line below against the live Apple App Review Guidelines and Google Play policy at submission time.**

---

## 1. Decision: PWA now, Expo native app for the stores

| Option | Verdict | Why |
|---|---|---|
| **PWA** (installable Next.js) | ✅ **Ship in P3** | Almost free. It covers Open Gym QR check-in at the door and web push. It is not in the stores |
| Capacitor/WebView wrapper of the site | ❌ | Apple guideline 4.2 (minimum functionality) rejects repackaged websites. Our Next.js app is server-rendered and does not export statically. It would be a fragile hybrid |
| Revive `99-Archive/mobile` as-is | ❌ | It is fully bound to Firebase Auth and Firestore, and GCP is torn down |
| **New Expo (React Native) app on the existing API** | ✅ **P4** | A real native app. It reuses screens, navigation, and styling from the archive (Expo Router, NativeWind, React Query). EAS Build and Submit sign both platforms without a Mac |

**Architecture:** one backend. The Expo app calls the same `/api/*` routes as the web app.

**Required API work:**
- a mobile auth endpoint that issues short-lived access tokens plus refresh tokens, with the session model shared with NextAuth
- bearer-token support in the route guards
- an Expo push token table

## 2. Prerequisites (start now, because they have lead times)

- [ ] **D-U-N-S number** for Intent Solutions LLC. It is free but takes days to weeks, and both stores need it for an organization account.
- [ ] **Apple Developer Program**, organization enrollment ($99/yr).
- [ ] **Google Play Console**, organization account ($25 one-time). Google requires new *personal* accounts to run a closed test with at least 12 testers for 14 days before production. **An organization account avoids that gate.**
- [ ] Apple **Small Business Program** enrollment, for 15% commission.
- [ ] Support URL, privacy policy URL (`/privacy` exists), and a marketing URL.
- [ ] RevenueCat account, with products created in App Store Connect and in the Play Console.

## 3. Compliance checklist (the usual rejection causes)

- [ ] **Account deletion inside the app** (Apple 5.1.1(v)), plus a **web deletion URL** in the Play Data safety form.
- [ ] **Audience = parents.** Do not list in the Kids category or Google's Designed for Families program. The parent is the account holder, and athletes act within the parent's workspace. **COPPA still applies** to data about children: verifiable parental consent, data minimization, no third-party ad SDKs. Honor the amended COPPA Rule.
- [ ] **Privacy nutrition label** (Apple) and **Data safety** (Google): declare health and fitness data, location (coarse, used for Open Gym search), and contact info. **No tracking, and no ATT prompt.**
- [ ] **Digital subscriptions through IAP.** Open Gym bookings through Stripe, because they are physical services (282 §4). The reviewer notes must explain this split.
- [ ] **Sign in with Apple** is required *only if* we add third-party social login (4.8). Email and password alone does not trigger it.
- [ ] **Location:** foreground only, with a clear purpose string. **No background location.**
- [ ] **Health data:** do not integrate HealthKit or Health Connect in v1. That avoids extra review. Add it later.
- [ ] **A demo account with seeded data** for reviewers, covering a parent with an athlete and a bookable Open Gym session.
- [ ] Age rating questionnaire: user-generated content is limited, and there is no open chat. The expected rating is 4+ or 9+ on Apple and Everyone on Google, but confirm it.

## 4. Build and release steps

| Week | Step |
|---|---|
| 1 | Expo project (`apps/mobile` or a separate repo; decide in P4 kickoff). Auth token API. EAS project. SOPS-managed EAS secrets |
| 2–4 | Screens: auth, athletes, Dream Gym logging, game logging |
| 4–6 | Open Gym: browse (map/list), booking via Stripe PaymentSheet, waiver, QR check-in. Push notifications through Expo |
| 6 | RevenueCat IAP for Family. Deletion flow. Crash reporting |
| 6–7 | **TestFlight** internal, then external beta (external beta needs Beta App Review). **Play internal testing**, then closed testing |
| 7–8 | Store listings: screenshots (6.9" and 6.5" iPhone, and 13" iPad if the app supports iPad; Play phone and 7"/10" tablet), icon, description, keywords. Submit |
| 8+ | Review. Staged rollout on Play (10% → 50% → 100%) and phased release on iOS |

**CI:** a GitHub Actions job runs `eas build` and `eas submit` on version tags, and the secrets come from SOPS. This matches the estate standard.

## 5. Store-listing positioning (draft)

- **Name:** Hustle — Soccer Training & Stats
- **Subtitle (iOS, 30 chars):** "Train. Track. Find Open Gym."
- **Hook:** "Every game, every workout, every open gym — one place, owned by you, not the club."

## 6. Post-launch

- Crash-free rate at ≥99.5% before any marketing push.
- Answer review replies within 48 hours.
- Ship the app-version force-upgrade endpoint before v1.0, so we can deprecate old API contracts.
