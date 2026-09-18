# Product Requirements Document (PRD)
## Youth Soccer Development Tracking App - LEAN MVP

**Version:** 2.0 (Ruthlessly Scoped)
**Last Updated:** October 3, 2025
**Document Owner:** Product Team
**Status:** Ready for Development

---

## 1. Introduction/Overview

### The One Critical Question
**Will parents and players consistently log game data if it creates a verified performance record?**

Everything else is noise. This MVP exists to answer that question with the minimum viable feature set.

### Problem Statement
Parents of serious youth soccer players (grades 8-12) invest thousands in development but have no standardized, verified way to track game performance for recruiting. Current solutions are either team-management tools (not player-focused) or basic stat trackers (no verification, no credibility).

### Solution
A dead-simple progressive web app where players log objective game stats, parents verify them with a PIN, and the result is a credible, exportable performance record. That's it.

### Long-term Vision (Post-MVP)
Once we prove the core loop works, we build the de facto platform: practice tracking, highlight uploads, TikTok-style content, coach portal, global comparisons. But first, we prove people will use the skateboard.

---

## 2. MVP Goal

**Validate that parents and players will consistently log and verify game statistics to build a credible performance record.**

Success Metric: 60% of users log 3+ games in their first 30 days with parent verification.

---

## 3. User Stories (MVP Only)

### Primary User: Parent

**Critical Path:**
- As a parent, I want to create an account and add my child's profile in under 2 minutes
- As a parent, I want to quickly log my child's game stats after each match (< 60 seconds)
- As a parent, I want to verify those stats with my PIN to make them official
- As a parent, I want to see my child's verified performance over the season in a simple dashboard
- As a parent, I want to export a clean PDF report to share with coaches

### Secondary User: Player (Via Parent Account)

- As a player, I want to see my stats improve over time
- As a player, I want a verified record I can be proud of

---

## 4. Functional Requirements

### 4.1 Parent Account & Player Profile

**FR-1:** The system must allow parent signup with email and password
**FR-2:** The system must require phone number during registration
**FR-3:** The system must allow parent to create ONE player profile: name, grade (8-12), primary position, team/club (free text)
**FR-4:** The system must generate unique parent verification PIN (4-6 digits)
**FR-5:** The system must allow parent to manage multiple player profiles (one per child)
**FR-6:** The system must include self-service password reset via email

### 4.2 Game Logging (The ONLY Log Type)

**FR-7:** The system must provide "Log Game" button prominently on dashboard
**FR-8:** The system must require these fields only:
- Date (auto-filled, editable)
- Opponent team name
- Result: Win, Loss, Tie
- Final score
- Minutes played

**FR-9:** The system must allow position-specific stat entry:
- **Universal:** Goals, Assists
- **Goalkeeper only:** Saves, Goals Against, Clean Sheet (yes/no)

**FR-10:** The system must save game log in "unverified" state
**FR-11:** The system must complete game entry in under 60 seconds (UX requirement)

### 4.3 Parent Verification System

**FR-12:** The system must send parent notification (email/push) when new game is logged
**FR-13:** The system must allow parent to view unverified game log
**FR-14:** The system must require parent PIN entry to verify stats
**FR-15:** The system must mark verified games with "Parent Verified" badge
**FR-16:** The system must prevent verification of games older than 14 days
**FR-17:** The system must allow parent to edit stats before verification (one-time only)

### 4.4 Player Dashboard

**FR-18:** The system must display verified stats summary:
- Total games played (verified only)
- Total goals, assists, saves (verified only)
- Goals per game average
- Assists per game average

**FR-19:** The system must show simple line chart of key stats over time (last 20 games)
**FR-20:** The system must display only verified games (unverified shown separately, faded)
**FR-21:** The system must show verification status clearly on each game entry

### 4.5 Season Report Export (The Hook)

**FR-22:** The system must provide prominent "Export Season Report" button on dashboard
**FR-23:** The system must generate PDF with:
- Player name, grade, position, team
- Season summary stats (verified games only)
- Game-by-game log with dates, opponents, stats
- "Parent Verified" badge/watermark on every page
- Clean, professional formatting suitable for coaches

**FR-24:** The system must allow parent to email PDF directly from app
**FR-25:** The system must allow parent to download PDF to device

### 4.6 Multi-Player Support (Multi-Child Families)

**FR-26:** The system must allow parent to add multiple player profiles
**FR-27:** The system must provide player switcher in navigation
**FR-28:** The system must show active player name prominently
**FR-29:** The system must keep each player's data completely separate

### 4.7 Data Management

**FR-30:** The system must sync all data to cloud (accessible across devices)
**FR-31:** The system must allow account deletion with 30-day grace period
**FR-32:** The system must permanently delete all data after grace period
**FR-33:** The system must be English-only with i18n-ready code structure

### 4.8 Progressive Web App (PWA)

**FR-34:** The system must function as installable PWA (Add to Home Screen)
**FR-35:** The system must work offline for game entry (sync when online)
**FR-36:** The system must launch full-screen when installed
**FR-37:** The system must be mobile-optimized (320px+ screens)

### 4.9 Onboarding

**FR-38:** The system must show 3-screen tooltip overlay on first login:
- Screen 1: "Log games here" (pointing to Log Game button)
- Screen 2: "Verify stats" (pointing to verification flow)
- Screen 3: "Export & share" (pointing to export button)

**FR-39:** The system must present blank dashboard on first login (no sample data)
**FR-40:** The system must make "Log Game" button the primary CTA

---

## 5. Non-Goals (Out of Scope for MVP)

**Everything else is Phase 2. No exceptions.**

**CUT FROM ORIGINAL PRD:**
- ❌ Practice logging
- ❌ Private training logging
- ❌ Individual skills tracking (juggling, drills, etc.)
- ❌ Emotional/mental state tracking
- ❌ Body soreness/injury tracking
- ❌ Fun moments/memories
- ❌ Weather tracking
- ❌ Coach accounts and coach verification
- ❌ Points, badges, streaks, gamification
- ❌ Global leaderboards and comparisons
- ❌ Percentile rankings
- ❌ Complex club branding (just free text field)
- ❌ Multiple parent/guardian accounts
- ❌ Privacy settings (parent sees everything)
- ❌ Video/photo uploads
- ❌ Social features
- ❌ In-app messaging
- ❌ Multi-language support
- ❌ Sample data in onboarding

**Phase 2 Roadmap (After MVP Validation):**
1. Coach Portal (verification + team view)
2. Practice/training logging
3. Highlight uploads + TikTok feed
4. Gamification + global comparison
5. Advanced recruiting features

---

## 6. Design Considerations

### 6.1 UX Principles
- **Speed above all:** Game entry in < 60 seconds
- **Mobile-first:** Thumb-friendly, large touch targets
- **Trust signals:** Verification badges prominent
- **Export polish:** PDF must look professional enough to email a coach

### 6.2 Key Screens
1. **Dashboard:** Big "Log Game" button, verified stats summary, recent games list, "Export Report" button
2. **Log Game Form:** Minimal fields, smart defaults, instant save
3. **Verification Flow:** Simple approve/edit screen with PIN
4. **Export Preview:** Show PDF before download/email

### 6.3 Visual Design
- Clean, professional (this is for recruiting, not entertainment)
- Primary color: Soccer green
- Verification badge: Gold/official looking
- Charts: Simple, readable, not flashy

---

## 7. Technical Considerations

### 7.1 Recommended Stack
- **Frontend:** Next.js + Tailwind CSS
- **Backend:** Supabase or Firebase (auth + database + storage)
- **PDF Generation:** react-pdf or jsPDF
- **Charts:** Recharts (simple, lightweight)
- **PWA:** Next.js PWA plugin

### 7.2 Data Model (Simplified)
```
Parent Account
├── email, phone, password_hash, pin_hash
└── Players[] (one-to-many)
    ├── name, grade, position, team
    └── Games[] (one-to-many)
        ├── date, opponent, result, score, minutes
        ├── goals, assists, saves, goals_against, clean_sheet
        ├── verified (boolean)
        └── verified_at (timestamp)
```

### 7.3 Performance Targets
- Initial load: < 2 seconds
- Game log save: < 500ms
- Dashboard render: < 1 second
- PDF generation: < 3 seconds

---

## 8. Success Metrics

### Primary Success Criteria (MVP Validation)
**The MVP is successful if:**
1. **60% of users log 3+ games in first 30 days**
2. **80% of logged games get parent verification within 48 hours**
3. **40% of parents export a season report within 60 days**
4. **30-day retention > 50%**

### Secondary Metrics
- Average time to log game: < 60 seconds
- Average games per active user per month: 6+
- Parent verification rate: > 75%
- PDF export rate: > 30%

### Failure Criteria (Pivot Signals)
- < 40% of users log even 1 game in first 30 days
- < 50% parent verification rate
- < 10% PDF export usage
- High churn due to "too simple/not enough features"

---

## 9. Open Questions - RESOLVED

**All scope decisions have been made. No ambiguity.**

### ✅ Resolved for MVP

**OQ-1: Multiple parent/guardian accounts?**
**NO.** One parent account owns all data. End of story.

**OQ-2: Account transition at 18?**
**Don't care yet.** This is a problem for a successful product, not an MVP.

**OQ-3: Privacy from parents?**
**Absolutely not.** Parent is the customer. They see everything.

**OQ-4: Coach accounts in MVP?**
**NO.** The "hook" is the exportable PDF. Coaches will ask for access later → Phase 2.

**OQ-5: Onboarding tutorial/sample data?**
**No sample data.** Simple 3-screen tooltip. Get to "Log Game" immediately.

**OQ-6: Position-specific drills?**
**Not logging drills.** Irrelevant.

**OQ-7: Shareable badges?**
**No badges at all.** Cut.

**OQ-8: Data deletion?**
**Parent deletes, all data goes.** 30-day grace period.

**OQ-9: Forgot password?**
**YES.** Non-negotiable basic requirement.

**OQ-10: Multiple languages?**
**English only.** i18n-ready code for Phase 2.

---

## 10. The Build Plan

### Week 1-2: Core Infrastructure
- Auth system (signup, login, password reset)
- Database setup (parent, player, game models)
- Basic dashboard shell

### Week 3-4: Game Logging & Verification
- Log game form
- Parent verification flow with PIN
- Verified/unverified badge system

### Week 5-6: Dashboard & Export
- Stats calculation and display
- Line charts for progress
- PDF generation and export

### Week 7: Polish & PWA
- Mobile optimization
- PWA setup and installation flow
- 3-screen onboarding tooltip

### Week 8: Beta Launch
- 50-100 parent testers
- Monitor: log rate, verification rate, export usage
- Iterate based on data

---

## 11. Why This MVP Will Work

### The Validation Loop is Crystal Clear
1. Parent signs up (friction test)
2. Parent logs games consistently (value test)
3. Parent verifies stats (trust test)
4. Parent exports PDF to coach (distribution test)

If this loop works, we have product-market fit. Then we build everything else.

### The "Coach Hook" is Genius
We don't build a coach portal. We make coaches *want* one. When a parent emails a beautiful, verified PDF to a coach, the coach will ask: "How can I get this for my whole team?" That's when we build the portal and charge for it.

### The Path to Unicorn is Clear
- **MVP:** Verified game tracking
- **Phase 2:** Coach portal (monetization starts)
- **Phase 3:** Practice/training logs + highlights
- **Phase 4:** TikTok feed + social + recruiting network
- **Exit:** The verified LinkedIn/TikTok for youth sports

---

**This is the skateboard. Let's build it and prove people will ride it.**

**End of PRD**
