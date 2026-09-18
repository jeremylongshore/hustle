# Human QA Test Guide - Hustle App
**Document:** 253-OD-GUID-human-qa-test-guide.md
**Date:** 2025-11-19
**Purpose:** Guide for human QA testers to validate critical user journeys
**Audience:** QA testers, product team, stakeholders

---

## Quick Start

**Staging URL:** https://staging.hustlestats.io (or http://localhost:4000 for local)

**Test Account Credentials:**
- **Email:** `demo-parent@hustle-qa.test`
- **Password:** `DemoParent123!`

**What You're Testing:**
This app helps parents/coaches track youth soccer player statistics. You'll be testing the core flows that parents use every day.

---

## What's Already Pre-Validated

Behind the scenes, our **Synthetic QA Harness** (automated "fake humans") already validates these flows on every code change:

1. ✅ Parent registration and login
2. ✅ Dashboard loads without errors
3. ✅ Creating new player profiles
4. ✅ Viewing player lists
5. ✅ Logging game statistics
6. ✅ Security (XSS prevention, rate limiting)

Your job as a **real human** is to:
- Validate the **user experience** (is it intuitive? confusing?)
- Find edge cases the automated tests might miss
- Report bugs, UX issues, and feature ideas using our GitHub templates

---

## Critical User Journeys to Test

### Journey 1: Parent Signup & Login (5 minutes)

**Starting Point:** Staging URL (logged out)

**Steps:**
1. Click "Sign Up" or "Register"
2. Fill in your email (use your real email or a test email)
3. Fill in password (minimum 8 characters, 1 uppercase, 1 number)
4. Check "I agree to Terms" and "I am a parent/guardian"
5. Submit registration
6. **Expected:** See confirmation message or redirect to dashboard
7. **If email verification required:** Check your email, click verification link
8. Log in with your credentials
9. **Expected:** Arrive at empty dashboard with "Add Athlete" button

**What to Look For:**
- Are form validation errors clear?
- Is the "I am a parent/guardian" checkbox easy to understand?
- Does the dashboard load quickly (<2 seconds)?

**Report Issues:**
- [QA Bug Report](../../.github/ISSUE_TEMPLATE/qa-bug-report.yml) - if something breaks
- [QA UX Feedback](../../.github/ISSUE_TEMPLATE/qa-ux-feedback.yml) - if something is confusing

---

### Journey 2: Create Player Profile (5 minutes)

**Starting Point:** Logged into dashboard

**Steps:**
1. Click "Add Athlete" or "Add Player" button
2. Fill in player details:
   - **Name:** "Test Player 1"
   - **Birthday:** Pick a date (e.g., 2010-06-15)
   - **Position:** Select "Attacking Midfielder" (should have 13 positions to choose from)
   - **League:** Select "ECNL Girls" (should have 40+ leagues to choose from)
   - **Team/Club:** "Test FC"
   - **Gender:** Select "Female" or "Male"
3. Submit the form
4. **Expected:** Redirected to dashboard or player list
5. **Expected:** See "Test Player 1" in your athletes list

**What to Look For:**
- Are there 13 soccer positions available? (GK, CB, RB, LB, RWB, LWB, DM, CM, AM, RW, LW, ST, CF)
- Are there 40+ youth soccer leagues? (ECNL, MLS Next, etc.)
- Can you select "Other" for league and type a custom league name?
- Are validation errors clear if you skip required fields?

**Report Issues:**
- [QA Bug Report](../../.github/ISSUE_TEMPLATE/qa-bug-report.yml) - if form breaks
- [QA Data/Stats Issue](../../.github/ISSUE_TEMPLATE/qa-data-issue.yml) - if wrong leagues/positions

---

### Journey 3: View Player Dashboard (3 minutes)

**Starting Point:** Player profile created

**Steps:**
1. From dashboard, click on "Test Player 1" (the player you just created)
2. **Expected:** See player detail page with:
   - Player name
   - Position/league info
   - Empty state message ("No games logged yet" or similar)
   - "Log a Game" button

**What to Look For:**
- Does the player detail page load quickly?
- Is it clear what you should do next?
- Are stats cards visible (even if empty)?

**Report Issues:**
- [QA UX Feedback](../../.github/ISSUE_TEMPLATE/qa-ux-feedback.yml) - if layout is confusing

---

### Journey 4: Log Game Statistics (7 minutes)

**Starting Point:** Player detail page

**Steps:**
1. Click "Log a Game" button
2. Fill in game details:
   - **Date:** Pick today or a recent date
   - **Opponent:** "Rival FC"
   - **Result:** Select "Win"
   - **Your Score:** 3
   - **Opponent Score:** 1
   - **Minutes Played:** 90
   - **Goals:** 1
   - **Assists:** 1
   - **Tackles:** 5 (for field players)
   - **Interceptions:** 3
   - **Clearances:** 2
3. Submit the form
4. **Expected:** Game appears in player history
5. **Expected:** Dashboard stats update (Total Games: 1)

**What to Look For:**
- Do stats fields match the player's position? (e.g., Goalkeepers should see "Saves" instead of "Assists")
- Is the form easy to fill out on mobile?
- Do validation errors prevent illogical data? (e.g., "Win" but losing score)

**Report Issues:**
- [QA Data/Stats Issue](../../.github/ISSUE_TEMPLATE/qa-data-issue.yml) - if stats are wrong or missing
- [QA Bug Report](../../.github/ISSUE_TEMPLATE/qa-bug-report.yml) - if form breaks

---

### Journey 5: Mobile Experience (5 minutes)

**Starting Point:** Any page (dashboard, player detail, etc.)

**Steps:**
1. Open the app on your phone (or resize browser to mobile width)
2. Navigate through:
   - Dashboard
   - Add Player form
   - Player detail page
   - Log Game form
3. **Expected:** No horizontal scrolling
4. **Expected:** Buttons are large enough to tap with a thumb
5. **Expected:** Forms are usable without zooming

**What to Look For:**
- Is the app usable on a small screen?
- Are buttons too small to tap?
- Does text overflow or get cut off?

**Report Issues:**
- [QA UX Feedback](../../.github/ISSUE_TEMPLATE/qa-ux-feedback.yml) - for mobile usability issues

---

## Feature Ideas & Questions

If you think "It would be great if..." or "I don't understand why...", report it!

- [QA Feature Idea](../../.github/ISSUE_TEMPLATE/qa-feature-idea.yml) - for enhancement requests
- [QA Question](../../.github/ISSUE_TEMPLATE/qa-question.yml) - for onboarding gaps

---

## Testing Cheat Sheet

### Test Account Credentials
- **Email:** `demo-parent@hustle-qa.test`
- **Password:** `DemoParent123!`

### Pre-Seeded Test Data
The staging environment has 2 demo players already created:
1. **Demo Player 1** - Attacking Midfielder, ECNL Girls, Demo FC
2. **Demo Player 2** - Goalkeeper, MLS Next, Keeper United

Both players have 1 game logged. You can use these to test "View Stats" without creating new data.

### Known Limitations (Not Bugs)
- **Stripe Billing:** Not yet implemented (Free plan only for now)
- **Workspace Collaboration:** Not yet implemented (single user only)
- **Email Verification:** May be disabled in staging for faster testing

---

## Reporting Issues

Use the appropriate GitHub issue template for your feedback:

| Issue Type | Template |
|------------|----------|
| Something is broken | [QA Bug Report](../../.github/ISSUE_TEMPLATE/qa-bug-report.yml) |
| Confusing/hard to use | [QA UX Feedback](../../.github/ISSUE_TEMPLATE/qa-ux-feedback.yml) |
| Wrong numbers/data | [QA Data/Stats Issue](../../.github/ISSUE_TEMPLATE/qa-data-issue.yml) |
| Feature idea | [QA Feature Idea](../../.github/ISSUE_TEMPLATE/qa-feature-idea.yml) |
| I don't understand | [QA Question](../../.github/ISSUE_TEMPLATE/qa-question.yml) |

**Pro Tip:** Include screenshots or screen recordings in your reports. A picture is worth a thousand words!

---

## Questions?

Contact the development team:
- GitHub: [Open an issue](https://github.com/jeremylongshore/hustle/issues/new/choose)
- Slack: #hustle-qa channel (if applicable)

---

**Last Updated:** 2025-11-19
**Version:** 1.0
**Maintained By:** DevOps Team
