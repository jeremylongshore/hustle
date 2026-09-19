# Hustle — Parent Consent and Athlete Accounts (Design)

**Status:** DRAFT for counsel review. **Do not build the consent flow until counsel signs off on §9.**
**Bead:** `hustle-4dc.6` (P1, epic #53)
**Inputs:** 280 (vision) · 281 (roadmap P1) · 285 (minor-safety compliance research, not legal advice) · 286 (operator audit)
**Date:** 2026-09-19

---

## 1. Problem

Hustle is used by families with athletes aged roughly 10–18. Today:

- A **parent registers** with email and password. Email verification is mandatory.
- **Athletes are records, not logins.** A `player` row belongs to the parent's `user`.
- **Registration records no consent at all.** The `user` table has `agreedToTerms`, `agreedToPrivacy`, `isParentGuardian`, `termsAgreedAt` and `privacyAgreedAt` columns (`src/lib/db/schema/auth.ts:24-28`). Nothing writes them, and the form (`src/app/(public)/register/page.tsx`) has no terms or guardian checkbox.
- **Athlete data goes to Anthropic (Claude) for AI features** with no separate consent, including for under-13s. The amended COPPA Rule treats this as disclosure to a third party (285 §1).
- **The vision needs athletes as daily users** (280 §3). That means athlete logins, which don't exist yet.

This design adds three things:
1. A record of who consented to what, when, and under which policy version.
2. An age model driven by the athlete's birthday.
3. Parent-controlled athlete sub-accounts.

It keeps the parent as the single account holder.

## 2. Principles

1. **The parent is the account holder** and makes every consent decision. Athletes never consent for themselves.
2. **Fail closed.** No consent record means the feature is off: AI, athlete login, and anything visible outside the family.
3. **Consent is specific, versioned, and revocable.** One record per purpose, tied to the exact policy text version shown. Revoking takes effect immediately.
4. **High-privacy defaults for every minor**, whatever their state (California AADC direction, 285 §2).
5. **Collect less.** Nothing asks for an athlete email, phone, or school address.

## 3. Actors

| Actor | Login? | Who creates it | Can do |
|---|---|---|---|
| **Parent / guardian** | Yes (email + password, verified) | Self-registration | Everything for their athletes; all consent decisions |
| **Athlete** | Optional, **13+ only** in v1 | Parent, via a one-time invite | Log their own training, games, and meals; see their own stats. Can't change visibility, contact, consent, or billing |
| **Coach** | No full account in P1 | Parent, via a per-game co-sign link (`hustle-4dc.9`) | Co-sign specific games only |
| **Recruiter** | P4 | — | Out of scope here |

## 4. Age model

- **The age source is `player.birthday`**, which is already required.
- **The age band is computed at runtime**, never stored, so it moves as the athlete ages:
  - `under13`
  - `13to15`
  - `16to17`
  - `adult` (18+)
- **The parent attests they are 18+ and the athlete's parent or legal guardian** at registration. This is recorded (see §5).
- **The account holder's age isn't verified** beyond that attestation, plus the payment card once billing is on. The app-store age signals (Apple Declared Age Range, Google Play Age Signals) apply to the native apps in P6 (283 §3).
- **When an athlete turns 18**, the parent gets a prompt to hand over or keep the profile. In v1 nothing changes automatically.

## 5. Consent records

A new table, `consent`, has one row per grant:

| Column | Notes |
|---|---|
| `id` | uuid |
| `parentUserId` | The consenting parent (`user.id`) |
| `playerId` | Nullable. Null for account-level consents |
| `purpose` | Enum (below) |
| `policyVersion` | For example `privacy-2026-10-01`. The exact text shown is in the repo |
| `method` | `checkbox`, `card-verification`, or others per counsel (§9) |
| `grantedAt` / `revokedAt` | Timestamps. Revoking sets `revokedAt`; rows are never deleted while the account exists |
| `evidence` | JSON: user agent, IP hash, and the card-check reference if used |

**Purposes:**

| Purpose | Scope | Required for | Default |
|---|---|---|---|
| `terms` | Account | Using Hustle at all | Collected at signup |
| `privacy` | Account | Using Hustle at all | Collected at signup |
| `guardian_attestation` | Account | Creating any athlete | Collected at signup |
| `athlete_profile` | Per athlete | Storing the athlete's data | Collected when adding the athlete |
| `ai_processing` | Per athlete | Sending the athlete's data to the Claude API | **Off.** Explicit opt-in |
| `athlete_login` | Per athlete (13+) | The athlete having their own login | Off |
| `coach_cosign` | Per athlete | Sending co-sign links to coaches (`hustle-4dc.9`) | Off |
| `public_profile` | Per athlete | P4 recruiting visibility | Off (future) |

**Enforcement lives in the query layer**, next to the ownership guard from #66:
- `assertConsent(parentUserId, playerId, purpose)` runs before any AI call and before creating an athlete login.
- AI routes check `ai_processing` for **every** athlete whose data goes into the prompt.

## 6. Flows

### 6.1 Registration (changes an existing flow)
The form adds three required checkboxes, each linked to the current text:
1. "I agree to the Terms"
2. "I have read the Privacy Policy"
3. "I am 18 or older and the parent or legal guardian of any athlete I add"

The server writes three `consent` rows plus the legacy `user` columns, in the same transaction as account creation (`registerUserWithWorkspace`). Registration is refused unless all three are present.

**Backfill for existing accounts:** on the next sign-in they see a one-time interstitial asking for the same three consents. Until they accept, they can't reach the dashboard. As of 2026-09-19 there is one account (the owner), so the backfill is trivial.

### 6.2 Adding an athlete
1. The parent enters the athlete's details, including birthday, and the app shows the age band.
2. **Consent screen**, with text that depends on the age band:
   - `athlete_profile`: required to save.
   - `ai_processing`: optional, unticked. Plain-language disclosure: "Workout, game and wellness data you log for {name} will be sent to Anthropic's Claude API to generate training suggestions. It is not used to train models." **Counsel must confirm this wording** and the vendor terms.
   - Under 13: the `ai_processing` toggle requires the verifiable parental consent method from §9 Q1. Until counsel picks one, **AI is unavailable for under-13 athletes**.
3. Consent rows are written in the same transaction as the `player` row.

### 6.3 Athlete login (13+ only, v1)
1. The parent opens the athlete's page and clicks "Give {name} their own login", which records `athlete_login` consent.
2. The app generates a one-time invite link, valid 72 hours. The parent sends it however they like; we never collect the athlete's email.
3. The athlete sets a username and password. We create an `athleteAccount` row: `id`, `playerId`, `parentUserId`, `username`, `passwordHash`, `createdAt`, `disabledAt`.
4. **The athlete session is scoped to one `playerId`.** The JWT carries `role: "athlete"`, `playerId`, and `parentUserId`. The ownership guard gets a sibling, `assertAthleteScope(session, playerId)`. Athlete sessions:
   - can't reach billing, settings, consent, visibility, contact, other athletes, or admin routes
   - aren't counted for plan limits as a separate user
5. The parent can disable the login or reset its password at any time. Revoking `athlete_login` consent disables it immediately; the JWT is checked against `disabledAt` on each request.

### 6.4 Revocation and deletion
- **Revoking a consent:** the feature stops immediately.
  - Revoking `ai_processing` also stops future AI calls. It doesn't erase past AI outputs stored as recommendations; the parent can delete those.
- **Deleting an athlete** removes the player row, all logs and uploads (`hustle-4dc.8`), and the athlete login. The consent rows stay until the parent account is deleted, as the record of what was agreed.
- **Deleting the parent account** removes everything within 30 days (`hustle-4dc.8`).

## 7. Defaults for minors
The same defaults apply everywhere, regardless of state:
- Profiles are private, and there is no public or recruiter visibility until P4 with `public_profile` consent.
- No messaging to or from athletes.
- AI is off until the parent opts in.
- No streak-guilt notifications, and no nudges between 10 pm and 6 am local time (California AADC direction).
- Leaderboards (P5) are opt-in and within invited groups only.

## 8. Code touchpoints (for the build bead after sign-off)

| Area | Change |
|---|---|
| `src/lib/db/schema/` | New `consent` and `athleteAccount` tables; migration `0005` |
| `src/lib/db/provision-user-workspace.ts` | Write consent rows inside the registration transaction |
| `src/app/api/auth/register` + register page | Three required checkboxes, and refuse without them |
| `src/lib/db/queries/ownership.ts` | `assertConsent`, `assertAthleteScope` |
| `src/lib/ai/*`, `src/app/api/ai/*`, `dream-gym/ai-strategy` | Check `ai_processing` before any Claude call |
| `src/auth.ts` | A second Credentials provider (athlete username), plus a role claim in the JWT |
| `src/proxy.ts` | Athlete sessions can only reach athlete-safe routes |
| Dashboard | Consent screens, athlete-login management, and the consent history view (part of parent controls, `hustle-4dc.7`) |
| Tests | Consent refused leads to 403 on AI routes; an athlete session can't reach another athlete, billing, or settings; registration without consents returns 400; revocation is immediate |

## 9. Questions for counsel (blocking)

1. **Verifiable parental consent for under-13 AI processing.** Which FTC-recognized method is enough?
   - Candidates: a card verification (Stripe SetupIntent, no charge), government ID check, or a signed form.
   - Is "email plus" enough, given the data is disclosed to a third party (Anthropic)?
2. **Is the parent-held-account model sufficient** for 13–17-year-olds using their own login, or does any state (California, Utah, Texas, Louisiana) require more at app or account creation for the web product? This is separate from the app-store age-signal laws in 283.
3. **Anthropic as processor.** Do Anthropic's commercial terms (no training on API data) count as adequate "service provider" terms under the amended COPPA Rule's third-party disclosure requirements? What must the privacy policy name?
4. **The AI disclosure wording** in §6.2. Is it accurate and sufficient?
5. **Retention.** Is keeping consent records for the account's lifetime right? What retention period applies to deleted-account data held in backups (30-day immutable B2 copies)?
6. **Coach co-sign links** (`hustle-4dc.9`). Does sending a coach a link to a minor's single game stat require anything beyond `coach_cosign` consent from the parent?
7. **Age-18 handover.** Any obligation when an athlete turns 18 while the parent holds the account?

## 10. Out of scope
- The recruiter, public-profile, and video pipeline (P4).
- Native-app age-signal APIs (P6, doc 283).
- MFA for parents, which is a separate security item.
- Multi-guardian households (a second parent on one family). Handle this later through workspace members.

## 11. Rollout
1. Counsel reviews §5–§9 and answers §9. **This is the owner action.**
2. Update this doc with the answers, and move its status to APPROVED.
3. Build in this order:
   - registration consents and backfill
   - `consent` table and `assertConsent`
   - AI gating
   - athlete logins
4. Update the privacy policy and terms (`hustle-4dc.11`) in the same release as the new consent text versions.
