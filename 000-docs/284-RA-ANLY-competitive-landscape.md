# Hustle — Competitive Landscape (2026-09)

**Status:** Research snapshot, 2026-09-18. Four parallel web-research passes: openGym, recruiting/highlights, training/stats, and minor safety (the safety pass is in 285).
**Caveat:** prices come from public pages and third-party reviews, and they change. Anything marked *(unverified)* needs a direct check before we quote it externally.

---

## 1. Bottom line

**Nobody is the one-stop shop for the youth soccer athlete.** No competitor covers training, gym plans, stats, calendar, recruiting, and safe competition in one product. The closest ones each miss two or three of those pillars. The recruiting market also has a **trust problem**: opaque pricing, upsell pressure, stats nobody verified, and weak parent controls. Hustle wins on **all-in-one plus trust.**

| Closest competitor | Training | Gym AI | Stats | Calendar | Recruiting | Missing |
|---|---|---|---|---|---|---|
| LevelUp Soccer (new, 2026) | ✅ AI | ❌ | ✅ | ❌ | ❌ | calendar, gym, recruiting |
| Sportlingo | ✅ AI practice plans | ❌ | ✅ | ✅ (team) | ❌ | recruiting, athlete-first design |
| Trace | ❌ | ❌ | ✅ (film) | ❌ | ✅ | training, gym, calendar |
| TeamSnap + Fitbod | ✅ (gym only) | ✅ | ~ | ✅ | ❌ | two apps, not soccer-specific |
| **Hustle (target)** | ✅ | ✅ | ✅ verified | ✅ | ✅ | none |

## 2. openGym (the "Open Gym" we meant)

- `DuarteSantos8/openGym`: about 1k stars (an older mirror has about 6.9k), **AGPL-3.0**, last push 2026-09-13. Stack: React 19 + Vite, with a dependency-light Node API that stores JSON files.
- **Money: none.** Per its README: "No account on someone else's server, no subscription, no ads."
- Single-user and self-hosted, so it can't serve as our multi-tenant backend. Its exercise animations have **disputed ownership** (its own README says so).
- **Use it as a design blueprint.** We rebuild these in our own code: progression rules, the muscle map, estimated 1RM, guided sessions, and an approve-or-undo AI coach (280 §5).
- Alternatives we looked at:
  - `wger` (6.9k stars, AGPL, free): nutrition-heavy, and its exercise data is CC-BY-SA, which is awkward in a closed app.
  - `Liftosaur` (AGPL, freemium): weightlifting-only.

## 3. Recruiting and highlights

| Platform | Athlete price | Coach side | Takeaway |
|---|---|---|---|
| **NCSA** | ~$2k–$6k+ packages, pricing only on a sales call | Free database | Biggest brand, and the most complaints: pressure sales, templated outreach, non-refundable |
| **SportsRecruits** | Free basic; ~$99–$299/yr *(unverified)* | Paid for colleges and clubs | Strong in soccer through club and league bundles (the partnership model is worth copying) |
| **Hudl** | Profiles free; teams from ~$400/yr (Bronze), $1,000 (Silver), $1,600 (Gold) | Free browsing | Owns video. Youth teams complain about the price jump from $99 to $400+, plus upload crashes |
| **FieldLevel** | Free; premium ~$99–$149/yr *(unverified)* | Free | Coach-fit matching is worth copying |
| **CaptainU / Stack** | Free-first | Paid coach plans | Freemium works |
| **FirstPoint USA** | Consultancy, thousands | — | The paid-advisor model we position against |
| **Trace / Veo / Pixellot** | Camera plus subscription | — | AI auto-highlights. **Integrate with them, don't compete** |

**What college coaches need** (per coach-facing guides):
- verified stats and context: position, grad year, starter status, GPA
- a **2–3 minute reel with the best play first**
- contact info through the right channel
- **free, low-friction access**

**Rule change that matters:** under the House settlement, NCAA D-I soccer rosters are **capped at 28** for men and women (effective July 1, 2025; [NCAA](https://www.ncaa.org/news/2025/6/23/media-center-di-board-of-directors-formally-adopts-changes-to-roster-limits.aspx)). Fewer spots means earlier, harder filtering, which makes verified data worth more.

**Gaps Hustle takes:**
1. Stats co-signed by a coach or parent
2. Parent-controlled visibility and contact
3. A free portal for verified recruiters
4. Honest view alerts, with no inflated "120 coaches viewed you"
5. Transparent pricing, with no sales calls
6. Reel guidance by position
7. Accepting Hudl, Trace, Veo, and YouTube links instead of locking film into our platform

## 4. Training, gym, stats, and team apps

| App | Category | Price | AI? | Note |
|---|---|---|---|---|
| Techne Futbol | Soccer drills | $9.99/mo; $279.99/yr tier | No | Leaderboards and streaks. Public boards are a safety risk |
| Beast Mode Soccer+ | Soccer drills | $19.99/mo | No | Pro-designed sessions |
| DribbleUp | Smart ball + app | $99 ball + $14.99/mo | Sensor feedback | Proves families pay ~$15/mo |
| Anytime Soccer | Drills | $4.98/mo | No | Budget tier |
| LevelUp Soccer, CoachFrank, Coach OS | AI soccer coaching | Not public *(unverified)* | ✅ | New in 2026. **Watch closely.** None of them has recruiting or a calendar |
| Fitbod | AI gym | $15.99/mo / $95.99/yr | ✅ | Best gym AI, but adult and not soccer-aware |
| Volt, TrainHeroic, Bridge Athletic, TeamBuildr | Strength and conditioning | Mostly coach- or team-priced *(unverified)* | Partial | Coach-driven, not athlete-first |
| AthlEAT | AI nutrition | Not public | ✅ | Calendar-aware fueling is a good idea to borrow |
| Onform | Video coaching | $19.99–$59.99/mo (coach) | Skeleton tracking | Private coach–athlete loop |
| TeamSnap | Team management | Free; ~$10–12/mo per team | No | Families' default calendar |
| GameChanger | Scorekeeping | Free + paid | No | Weak on soccer |
| PlayerMaker, Catapult, STATSports | Wearables | Hardware, enterprise pricing | No | **Import their exports** |

**Price benchmark:** single-purpose youth apps cost $5–$20/mo. A family all-in-one at **$9.99–$14.99/mo** is credible and undercuts a multi-app stack by 2–3×. See 282.

## 5. Table stakes (we must match all of these)

1. Game stat capture, fast, including offline
2. Practice logs
3. Personalized, age-appropriate strength plans
4. A calendar with push reminders and sync
5. Fuel/meal guidance tied to game days
6. A parent-managed account
7. Safe gamification (streaks, badges)
8. A recruiting profile with a reel and a stats summary
9. Video clips from uploads or links
10. Offline resilience

## 6. Where Hustle clearly wins

1. **True all-in-one**, built around the athlete's day: today's workout, the next game, what to eat, and a film link.
2. **Verified stats** (a coach or parent co-sign) behind the recruiting profile.
3. **Parent co-ownership.** Parents approve visibility and contact; the athlete keeps agency.
4. **Safe competition:** you vs. you first, then invite-only, age-banded challenges and effort badges. No national public rankings.
5. **AI that connects the domains:** training load changes the gym plan, which changes game-day fuel. The coach proposes, and the family approves.

## 7. Features to copy vs. avoid

**Copy:**
- club and league bundles (SportsRecruits)
- a freemium profile (CaptainU)
- coach-fit matching (FieldLevel)
- auto-highlights through integration (Trace, Veo)
- calendar-aware fueling (AthlEAT)
- the approve-or-undo AI coach (openGym)

**Avoid:**
- opaque pricing and sales calls (NCSA)
- sudden price hikes (Hudl)
- inflated view counts
- locking film into one platform
- public national leaderboards
- messaging that parents can't see

## Sources

- openGym: https://github.com/DuarteSantos8/openGym (verified via GitHub API 2026-09-18) · wger https://github.com/wger-project/wger · Liftosaur https://github.com/astashov/liftosaur
- NCAA roster limits: https://www.ncaa.org/news/2025/6/23/media-center-di-board-of-directors-formally-adopts-changes-to-roster-limits.aspx · https://www.soccerwire.com/soccer-blog/house-v-ncaa-settlement-college-soccer-coaches-prepare-for-paradigm-shift-in-recruiting/
- NCSA cost and complaints: https://www.nextcommit.ai/blog/ncsa-cost · https://www.trustpilot.com/review/www.ncsasports.org
- Platform comparisons: https://rawrecruit.io/resources/compare/best-recruiting-platforms · https://recruitplaybook.com/blog/ncsa-vs-sportsrecruits-vs-playbook · https://prephero.com/college-recruiting-websites-comparing-ncsa-berecruited-captainu
- Hudl pricing: https://www.hudl.com/pricing/club · SportsRecruits: https://sportsrecruits.com/athletes · FieldLevel: https://www.fieldlevel.com/ · FirstPoint: https://www.firstpointusa.com/our-service/firstpoint-costs/
- Training apps: https://a-champs.com/blogs/magazine/5-best-soccer-training-apps-2026 · https://youthsportscoaching.com/best-youth-sports-coaching-apps/ · https://www.thefuturesapp.com/news/the-best-sports-management-software-for-soccer-clubs-in-2026
- AI entrants: https://www.pr.com/press-release/970964 · https://apps.apple.com/us/app/coachfrank-soccer-training-ai/id6479705308 · https://athleat.app/
- Fitbod: https://fitbod.me/ · Onform pricing: https://onform.com/pricing/ · Trace: https://traceup.com/soccer/academy · TeamSnap: https://www.teamsnap.com/teams/sports/soccer
