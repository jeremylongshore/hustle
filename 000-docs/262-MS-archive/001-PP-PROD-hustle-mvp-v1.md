# Product Requirements Document (PRD)

## Youth Soccer Development Tracking App - MVP

**Version:** 1.0
**Last Updated:** October 3, 2025
**Document Owner:** Product Team
**Status:** Draft

-----

## 1. Introduction/Overview

### Problem Statement

Serious youth soccer players (grades 8-12) and their parents invest thousands of dollars in development but lack a comprehensive platform to track progress, verify achievements, and benchmark against peers globally. Parents with multiple soccer-playing children need one unified system. Current solutions either capture basic stats OR team management OR highlight sharing - but nothing ties it all together with verified data that builds credibility for recruiting while keeping the joy of the game central.

### Solution

A progressive web app (PWA) that enables youth soccer players to log detailed information about every practice, game, private training session, and individual workout. Parents own and control data for all their children, can verify stats for credibility, and coaches can co-verify for recruiting purposes. Players can see how they compare globally with verified stats, building toward the long-term vision: the de facto platform for soccer highlights, content sharing, and recruiting - a TikTok/Instagram hub specifically built for serious youth soccer development.

### Key Differentiator

Unlike stat-only trackers, this app captures the full picture: physical performance, mental state, training investment, injury patterns, weather impact, and the joy of the game - all in one place, parent-supervised, with verification systems that build trust for recruiting. The foundation for becoming the standard platform where soccer families share highlights, compare progress globally, and connect with opportunities.

### Long-term Vision (Post-MVP)

Become the "de facto highlight hub" - the TikTok of youth soccer where players share training content, verified highlights, and development journeys. Parents dropping serious cash on development want one platform that tracks everything, verifies achievements, and becomes the recruiting standard. Integration with Instagram/social sharing, AI performance analysis, and direct college coach access.

-----

## 2. Goals

1. **Enable comprehensive tracking:** Provide players a simple interface to log all soccer activities (practices, games, private training, individual work) with rich contextual data
1. **Support multiple children per family:** Allow parents managing multiple youth soccer players to track all their kids in one account
1. **Build trust through verification:** Create a PIN-based verification system (parent + coach) that adds credibility to stats for recruiting purposes
1. **Enable global comparison:** Let players see how they stack up against verified stats from peers worldwide, filtered by grade/age
1. **Support player development:** Help players and parents identify patterns in performance, emotion, physical condition, and training habits
1. **Build positive habits:** Create an engaging experience that motivates consistent logging through gamification and progress visualization
1. **Ensure data safety:** Give parents full ownership and control of all their children's data with secure authentication
1. **Lay foundation for highlight hub:** Build the data and user base that will support Phase 2's vision of becoming the standard platform for soccer content, highlights, and recruiting (TikTok/Instagram integration)
1. **Validate market fit:** Achieve 40% DAU and 5+ logs per user per week within first 3 months to prove concept before investing in video/social features

-----

## 3. User Stories

### Primary User: Youth Soccer Player (Grades 8-12)

**Core Logging:**

- As a player, I want to quickly log my practice session right after training, so I can capture details while they're fresh in my mind
- As a player, I want to record my game performance and stats, so I can track my progress over the season
- As a player, I want to log private training sessions separately from team practice, so I can see my investment in individual development
- As a player, I want to track how my body feels after activities, so I can prevent injuries and understand recovery patterns
- As a player, I want to capture fun moments from practices and games, so I remember why I love soccer

**Progress & Insights:**

- As a player, I want to see my total practice hours over time, so I can understand my commitment level
- As a player, I want to view my stats and performance trends, so I can see where I'm improving
- As a player, I want to earn points and badges for consistent logging, so I stay motivated to track my journey
- As a player, I want to see my emotional patterns, so I can understand what affects my mental game

### Secondary User: Parent/Guardian

**Oversight & Support:**

- As a parent, I want to create and control accounts for multiple children, so I can manage all my kids' soccer journeys in one place
- As a parent, I want to view all my child's training data, so I can monitor their workload and prevent overtraining
- As a parent, I want to see injury and soreness patterns, so I can get them proper treatment when needed
- As a parent, I want to track their emotional well-being over time, so I can provide support during tough periods
- As a parent, I want to add encouraging comments to their logs, so I can celebrate their progress
- As a parent, I want to verify my child's stats with a PIN, so recruiters and others trust the accuracy of the data
- As a parent, I want to export all their data, so I can share it with coaches or use it for recruiting later
- As a parent, I want to suggest corrections if my child logged something incorrectly, so the data stays accurate

### Tertiary User: Coach

**Verification & Support:**

- As a coach, I want to verify player stats with my PIN, so the data has credibility for recruiting purposes
- As a coach, I want to view my players' verified stats, so I can write accurate recommendations

-----

## 4. Functional Requirements

### 4.1 User Authentication & Account Management

**FR-1:** The system must allow parents to create an account using email and password
**FR-2:** The system must require parent to provide their phone number during registration
**FR-3:** The system must allow parents to create multiple player profiles for their children (support for families with multiple soccer players)
**FR-4:** The system must allow switching between player profiles from parent dashboard
**FR-4:** The system must collect player information: name, grade (8th-12th), primary position
**FR-5:** The system must allow players to select multiple leagues/divisions they participate in (multi-select)
**FR-6:** The system must allow players to specify club affiliation(s) with standardized national branding (Rush Soccer, Surf, Slammers, etc.)
**FR-7:** The system must allow parents to log in and access the app on behalf of their player(s)
**FR-5:** The system must allow parents to log in and access the app on behalf of their player
**FR-6:** The system must save player data to cloud storage accessible across devices
**FR-7:** The system must function as a Progressive Web App (PWA) that can be saved to device home screen

### 4.2 Player Profile Setup

**FR-8:** The system must allow selection of primary position with options: Goalkeeper, Defender, Midfielder, Forward
**FR-9:** The system must allow players to select multiple leagues/divisions they compete in (e.g., ECNL + ECNL RL, Club team + High School)
**FR-10:** The system must provide standardized league options via dropdown:

- ECNL (Elite Clubs National League)
- ECNL RL (Regional League)
- MLS Next
- NPL (National Premier League)
- UPSL (United Premier Soccer League)
- DA (Development Academy - if still active)
- High School Varsity
- High School JV
- ODP (Olympic Development Program)
- Club/Rec League
- Other (custom entry)
**FR-11:** The system must allow entry of club/team affiliation with standardized national club branding options:
- Major club networks: Rush Soccer, Surf Soccer, Slammers FC, Solar Soccer, Strikers FC, etc.
- Regional powerhouse clubs
- Local club (custom entry with auto-suggest)
**FR-12:** The system must research and maintain accurate branding/logos for nationwide club organizations
**FR-13:** The system must allow players to specify different teams for different leagues (e.g., "Rush ECNL U17" and "High School Varsity")
**FR-14:** The system must allow parents to edit player profile information at any time

### 4.3 Practice Session Logging

**FR-12:** The system must provide a "Log Practice" feature accessible from main dashboard
**FR-13:** The system must auto-populate current date and time (editable by user)
**FR-14:** The system must allow input of practice duration in minutes
**FR-15:** The system must allow input of practice location (free text)
**FR-16:** The system must provide weather selection via dropdown: Sunny, Cloudy, Rainy, Windy, Snow, with optional temperature input
**FR-17:** The system must allow auto-detection of weather based on location and time (optional feature)
**FR-18:** The system must provide text field for "What I worked on" with suggested drill tags
**FR-19:** The system must allow rating of "How did it feel?" on 1-5 scale
**FR-20:** The system must provide emotion tag selection: confident, frustrated, energized, tired, focused, distracted (multi-select)
**FR-21:** The system must include optional notes field for additional emotional context
**FR-22:** The system must provide specific drills practiced field with universal tag suggestions:

- #Passing
- #Dribbling
- #Shooting
- #Fitness
- #FirstTouch
- #Defending
- #Headers
- #Speed
- Custom tags allowed
**FR-23:** The system must provide body soreness checker with simple body diagram for tap-to-select body parts
**FR-24:** The system must allow severity rating (1-5) for each selected body part
**FR-25:** The system must include optional notes for body condition
**FR-26:** The system must provide "Most fun moment" fields for both individual and team experiences
**FR-27:** The system must save practice log and update player statistics

### 4.4 Game/Tournament Logging

**FR-28:** The system must provide "Log Game" feature accessible from main dashboard
**FR-29:** The system must allow input of tournament/game name
**FR-30:** The system must allow input of game location
**FR-31:** The system must allow selection of which league/team this game was for (dropdown from player's registered leagues/teams)
**FR-32:** The system must provide weather selection (same as practice)
**FR-33:** The system must allow input of opponent team name
**FR-34:** The system must allow optional input of opponent's league/club affiliation (with same standardized options)
**FR-35:** The system must allow selection of result: Win, Loss, Tie
**FR-36:** The system must allow input of final score
**FR-36:** The system must allow input of minutes played
**FR-37:** The system must provide stat inputs based on position:

- Universal: Goals, Assists, Tackles
- Goalkeeper-specific: Saves, Goals Against, Clean Sheet (yes/no)
**FR-38:** The system must allow "How did I play?" rating on 1-5 scale
**FR-39:** The system must provide emotional state tags: nervous, confident, locked in, overwhelmed, frustrated, clutch (multi-select)
**FR-40:** The system must include body soreness checker (same as practice)
**FR-41:** The system must provide "Most fun moment" fields (individual and team)
**FR-42:** The system must save game log and update player statistics

### 4.5 Private Training Session Logging

**FR-43:** The system must provide "Log Private Training" feature
**FR-44:** The system must allow input of date, time, and duration
**FR-45:** The system must allow input of location
**FR-46:** The system must allow input of trainer/coach name
**FR-47:** The system must provide weather selection (same as practice)
**FR-48:** The system must allow selection of focus areas: Technical, Tactical, Physical, Mental (multi-select)
**FR-49:** The system must provide text field for specific skills/drills covered
**FR-50:** The system must include "How did it feel?" rating and emotion tags (same as practice)
**FR-51:** The system must include body soreness checker
**FR-52:** The system must provide "Key takeaways/what I learned" text field
**FR-53:** The system must provide "Most fun moment" field
**FR-54:** The system must save private training log and update statistics

### 4.6 Individual Skills Tracking

**FR-55:** The system must provide "Log Juggling" feature with date and count input
**FR-56:** The system must track and display personal best juggling count
**FR-57:** The system must provide "Log Other Drill" feature for measurable solo activities
**FR-58:** The system must allow custom drill naming and metric tracking (e.g., sprint times, shooting accuracy)

### 4.7 Dashboard & Analytics

**FR-59:** The system must display total practice hours (weekly, monthly, all-time)
**FR-60:** The system must display total private training hours (weekly, monthly, all-time)
**FR-61:** The system must display total games played
**FR-62:** The system must display career stats totals: goals, assists, tackles, saves (position-specific)
**FR-63:** The system must display personal records (juggling best, total training hours milestone)
**FR-64:** The system must provide line chart showing practice hours over time
**FR-65:** The system must provide visual for stats totals and averages
**FR-66:** The system must display emotional patterns showing distribution of emotions logged
**FR-67:** The system must provide "Fun Moments Collection" gallery of player's favorite memories
**FR-68:** The system must display injury/soreness history tracker showing body parts and frequency
**FR-69:** The system must show current grade level and visual journey from 8th grade toward college

### 4.8 Gamification System

**FR-70:** The system must award points for logging activities:

- 5 points per practice logged
- 10 points per game logged
- 7 points per private training logged
- 3 points per individual skills session logged
**FR-71:** The system must display total points earned on dashboard
**FR-72:** The system must award badges for achievements (all badges are private to player/parent):
- "First Goal Logged"
- "100 Practice Hours"
- "30 Day Streak" (logging any activity for 30 consecutive days)
- "Century Club" (100 total logs)
- "Triple Threat" (log practice, game, and private training in one week)
- "Iron Player" (50 games logged)
**FR-73:** The system must display earned badges in player profile (visible only to player and parent)
**FR-74:** The system must show visual progress bar representing journey from current grade toward college

### 4.9 Stats Verification System

**FR-75:** The system must provide a "Verify Stats" feature for each game log entry
**FR-76:** The system must allow parents to verify stats by entering a PIN code
**FR-77:** The system must allow coaches to verify stats by entering their PIN code
**FR-78:** The system must generate unique verification PINs for parents and coaches
**FR-79:** The system must display "Verified" badge on game logs that have been verified by parent or coach
**FR-80:** The system must distinguish between parent-verified and coach-verified stats (different badge colors/icons)
**FR-81:** The system must prevent verification of stats more than 7 days old (encourages timely verification)
**FR-82:** The system must show verification status prominently in player profile and global stats comparison

### 4.10 Global Stats Comparison (Player Social Features)

**FR-83:** The system must provide "Global Stats" view showing aggregated player stats by age group/grade
**FR-84:** The system must display leaderboards for key metrics: total goals, assists, practice hours (filtered by grade level)
**FR-85:** The system must allow players to see anonymized stats from players worldwide (no personal info shared)
**FR-86:** The system must filter global comparisons to show only verified stats (parent or coach verified)
**FR-87:** The system must show player's percentile ranking within their grade level (e.g., "Top 15% in practice hours")
**FR-88:** The system must provide opt-in setting for players to include their stats in global comparisons
**FR-89:** The system must display "Trust Score" showing percentage of player's stats that are verified

### 4.11 Onboarding Experience

**FR-90:** The system must provide streamlined signup flow: email, password, phone number
**FR-91:** The system must collect basic player info during onboarding: name, grade, primary position
**FR-92:** The system must display 3-step tooltip tutorial highlighting main features:

- Step 1: "Log your activities here" (pointing to log buttons)
- Step 2: "Track your progress" (pointing to dashboard)
- Step 3: "Earn badges and see your journey" (pointing to gamification)
**FR-93:** The system must pre-populate dashboard with sample data for fictional player showing:
- Example practice logs with emotions and stats
- Sample game performance data
- Earned badges and progress visualization
- "This is sample data - start logging to see your real journey!" banner
**FR-94:** The system must provide "Clear Sample Data & Start Fresh" button on first login
**FR-95:** The system must include self-service "Forgot Password" flow with email reset link

### 4.12 Coach Access & Verification

**FR-90:** The system must allow players to invite coaches via email
**FR-91:** The system must allow coaches to create verification-only accounts (read + verify access, no data editing)
**FR-92:** The system must generate unique verification PIN for each coach
**FR-93:** The system must allow coaches to view stats for players who have invited them
**FR-94:** The system must allow coaches to verify or dispute player stats within 7 days of logging
**FR-95:** The system must send notification to parent if coach disputes a stat entry

### 4.12 Parent Access & Features

**FR-96:** The system must provide parent with full read access to all player data across all their children
**FR-97:** The system must allow parents to add comments to any player log entry
**FR-98:** The system must allow parents to suggest error corrections (flagging system, not direct editing)
**FR-99:** The system must provide export functionality to download all player data in CSV/JSON format
**FR-100:** The system must clearly mark parent comments as separate from player entries
**FR-101:** The system must prevent parents from directly editing or deleting player log entries
**FR-102:** The system must notify player when parent adds a comment (in-app notification)

### 4.14 Account Management & Data Deletion

**FR-103:** The system must provide account deletion feature in settings
**FR-104:** The system must warn users that deletion is permanent after 30-day grace period
**FR-105:** The system must soft-delete account data for 30 days, then permanently erase
**FR-106:** The system must send confirmation email when deletion is initiated
**FR-107:** The system must allow account recovery within 30-day grace period via email link
**FR-108:** The system must comply with GDPR/COPPA right to be forgotten requirements

### 4.15 Localization & Language

**FR-109:** The system must support English language only for MVP
**FR-110:** The system must be built with non-hard-coded text strings to enable future translation
**FR-111:** The system must use language key-value structure (JSON/i18n format) for all UI text

### 4.16 Data Management & Export

**FR-112:** The system must allow data export in CSV format for spreadsheet analysis
**FR-113:** The system must allow data export in JSON format for future app migration
**FR-114:** The system must include all log entries, stats, and metadata in exports
**FR-115:** The system must enable cloud sync so data is accessible from any device with login

-----

## 5. Non-Goals (Out of Scope for MVP)

**NG-1:** Multiple parent/guardian accounts per player - deferred to Phase 2 "Family System"
**NG-2:** Coach accounts and verification system - **PHASE 2 PRIORITY** (Coach Portal)
**NG-3:** Tiered privacy settings (hiding entries from parents) - deferred to Phase 2
**NG-4:** Position-specific drill content library - deferred to Phase 2
**NG-5:** Badge sharing to external platforms - deferred to Phase 2 (optional sharing)
**NG-6:** Pre-deletion data export wizard - deferred to Phase 2
**NG-7:** Multi-language support (Spanish, etc.) - deferred to Phase 2
**NG-8:** Video/photo uploads and highlight reels - **PHASE 2 PRIORITY** (foundation for "de facto highlight hub")
**NG-9:** AI-powered performance analysis - deferred to Phase 2
**NG-10:** Social feed/TikTok-style content platform - **PHASE 2 PRIORITY** (noted for long-term vision)
**NG-11:** Instagram/social media posting integration - **PHASE 2 PRIORITY**
**NG-12:** Full team management features - deferred to Phase 2
**NG-13:** Integration with league systems (ECNL, MLS Next, etc.) - deferred to Phase 2
**NG-14:** Advanced recruiting features and college coach access - deferred to Phase 2
**NG-15:** Payment processing or subscription features - free for MVP
**NG-16:** Native mobile apps (iOS/Android) - web app only for MVP, can migrate data later
**NG-17:** Automated weather detection - manual dropdown for MVP
**NG-18:** In-app messaging between users
**NG-19:** Calendar integration or practice reminders
**NG-20:** Live streaming or video recording features

**Phase 2 Strategic Priorities (Post-MVP):**

1. Coach Portal with verification system
1. Family/Guardian invite and permissions system
1. Highlight upload and sharing platform (become the standard for soccer content)
1. TikTok-style feed for soccer training content and highlights
1. Direct Instagram/social media posting integration
1. Advanced recruiting profile features
1. Position-specific content and drill libraries

-----

## 6. Design Considerations

### 6.1 User Experience Principles

- **Speed first:** Player should complete any log entry in under 2 minutes
- **Mobile-optimized:** All interfaces designed for thumb-friendly mobile input
- **Progressive disclosure:** Show required fields first, optional fields collapsed/expandable
- **Smart defaults:** Auto-fill date/time, remember commonly used locations/opponents
- **Visual feedback:** Immediate confirmation when data is saved, progress animations for stats updates

### 6.2 UI/UX Requirements

- **Home screen:** Quick-access buttons for "Log Practice", "Log Game", "Log Private Training", plus dashboard summary
- **Form design:** Large touch targets, minimal text input (favor dropdowns/selections), clear save/cancel actions
- **Body diagram:** Simple front/back view of human figure with tap-to-highlight body regions
- **Stats dashboard:** Card-based layout with key metrics, swipeable charts, "Fun Moments" carousel
- **Parent view:** Toggle switch to see "Parent View" with comment functionality clearly separated from player data

### 6.3 Visual Design

- **Color scheme:** Energetic but not overwhelming - primary soccer green, accent colors for different activity types
- **Typography:** Clean, highly readable sans-serif fonts optimized for mobile
- **Icons:** Intuitive icons for each log type (whistle for practice, trophy for game, dumbbell for training)
- **Badges:** Visual, collectible-style achievement badges with unlock animations

### 6.4 Progressive Web App (PWA) Requirements

- **Installable:** Must prompt users to "Add to Home Screen" after second visit
- **App-like:** Full-screen mode when launched from home screen icon
- **Offline-capable:** Allow log entry creation offline, sync when connection restored
- **Responsive:** Optimized for mobile (320px+) but functional on tablet/desktop

-----

## 7. Technical Considerations

### 7.1 Technology Stack Recommendations

- **Frontend:** React or Next.js with responsive design framework (Tailwind CSS)
- **Backend:** Firebase (Authentication, Firestore database, Cloud Functions) or Supabase for rapid MVP development
- **PWA:** Service workers for offline functionality and installability
- **Charts/Visualizations:** Recharts or Chart.js for dashboard analytics
- **State Management:** React Context or Zustand for client-side state

### 7.2 Data Model Considerations

- **Player Profile:** Single source of truth linked to parent account
- **Activity Logs:** Polymorphic design supporting Practice, Game, PrivateTraining, Skills with shared and specific fields
- **Stats Aggregation:** Pre-calculated totals updated on each log save (avoid real-time queries for performance)
- **Parent Comments:** Separate collection linked to specific log entries

### 7.3 Security & Privacy

- **COPPA Compliance:** Parent-controlled accounts for users under 13
- **Data Ownership:** Clear terms that parent owns all data until player turns 18
- **Authentication:** Secure password requirements, optional 2FA for parent accounts
- **Data Deletion:** Provide mechanism for complete account and data deletion

### 7.4 Performance Targets

- **Initial Load:** < 3 seconds on 3G connection
- **Log Save Time:** < 1 second from submit to confirmation
- **Dashboard Load:** < 2 seconds for 100+ log entries
- **Offline Capability:** Queue up to 20 entries for sync when online

### 7.6 Club Branding Research Requirements

**National Club Networks to Research:**

- Rush Soccer (nationwide presence, ~100+ clubs)
- Surf Soccer Club (California-based, national expansion)
- Slammers FC (California powerhouse)
- Solar Soccer Club (Texas-based, national presence)
- Strikers FC (multiple regions)
- Concorde Fire (Georgia/Southeast)
- PDA (Player Development Academy - NJ/East Coast)
- Crossfire Premier (Pacific Northwest)
- FC Dallas Youth (Texas)
- LA Galaxy Academy (California)
- Other regional powerhouses and DA/MLS Next academy affiliates

**Branding Requirements:**

- Collect official logos (with usage permissions where needed)
- Standardize club name formatting (e.g., "Rush Soccer" vs "Rush SC")
- Create auto-complete/search for club selection during profile setup
- Allow custom club entry if not in database
- Consider club color schemes for visual consistency in app

**Research Tasks:**

- Compile comprehensive list of top 50-100 nationwide youth soccer clubs
- Verify current league affiliations (ECNL, MLS Next, NPL, etc.)
- Track club rebranding or mergers (common in youth soccer)
- Build database of club aliases (what parents actually call them)
- **Data Export:** Ensure clean JSON export for migration to native apps
- **API Design:** Build backend as RESTful/GraphQL API ready for native app consumption
- **Schema Versioning:** Design database schema with version fields for future migrations

-----

## 8. Success Metrics

### 8.1 Engagement Metrics (Primary)

- **Daily Active Users (DAU):** Target 40% of registered users within 60 days
- **Average Logs Per User Per Week:** Target 5+ entries (combination of practices, games, training)
- **7-Day Retention:** Target 60% of users return within first week
- **30-Day Retention:** Target 40% of users still active after 30 days
- **Session Duration:** Average 5-8 minutes per session (indicates thoughtful logging)

### 8.2 Quality Metrics

- **Log Completion Rate:** >80% of started logs are completed and saved
- **Optional Field Usage:** >50% of logs include optional fields (emotions, fun moments, body check)
- **Parent Comment Rate:** >30% of player logs receive parent comment within 48 hours
- **Data Export Usage:** >20% of parents export data within first 90 days

### 8.3 Growth Metrics

- **User Acquisition:**
  - Week 1-4: 100 beta users (50 families)
  - Month 2-3: 500 active users (250 families)
  - Month 4-6: 2,000 active users (1,000 families)
- **Parent Invitation Acceptance:** >80% of parents complete account setup after receiving link
- **Word-of-Mouth:** >25% of new users report hearing about app from another family

### 8.4 Technical Metrics

- **Uptime:** 99.5% availability
- **Error Rate:** <1% of user actions result in error
- **Load Time:** 90% of page loads under 3 seconds
- **Offline Sync Success:** >95% of offline entries successfully sync when online

### 8.5 Success Criteria for Phase 2 Investment

MVP is considered successful and ready for native app development if:

1. DAU reaches 40% within 90 days
1. 30-day retention exceeds 35%
1. Average 5+ logs per user per week sustained for 4+ weeks
1. <5% user churn due to technical issues
1. Positive feedback from >70% of user surveys

-----

## 9. Open Questions

**OQ-1:** Should we allow multiple parent/guardian accounts to access the same player profile? (e.g., both mom and dad)
**OQ-2:** How do we handle account transition when player turns 18? Automatic transfer or manual process?
**OQ-3:** Do we need tiered privacy settings for what parents can see? (e.g., hide emotional notes from parents)
**OQ-4:** Should we build a coach invite system in MVP, or strictly parent-only access?
**OQ-5:** What's the onboarding flow? Should we include a tutorial or sample data to demonstrate value immediately?
**OQ-6:** Do we need position-specific drill suggestions, or start with universal drill tags?
**OQ-7:** Should gamification badges be private or shareable? (avoiding social comparison pressure)
**OQ-8:** What happens to data if parent account is deleted? Permanent deletion or transfer option?
**OQ-9:** Should we include a "Forgot Password" self-service flow or require email support for MVP?
**OQ-10:** Do we need to support multiple languages for MVP, or English-only initially?

-----

## 10. Appendix: User Flow Diagrams

### Parent Account Creation & Player Setup Flow

1. Parent visits app URL
1. Clicks "Get Started"
1. Enters email, phone, creates password
1. Verifies email via link
1. Creates player profile (name, grade, position, league, club)
1. Sees dashboard with "Log First Practice" prompt
1. Option to install PWA to home screen

### Player Logging a Practice Flow

1. Opens app from home screen
1. Taps "Log Practice" button
1. Confirms auto-filled date/time or edits
1. Enters duration (slider or number input)
1. Selects/enters location
1. Selects weather from dropdown
1. Types "What I worked on" with drill tag suggestions
1. Rates feeling (1-5 stars)
1. Selects emotion tags
1. Taps body diagram for soreness, rates severity
1. Writes fun moments (optional)
1. Taps "Save Practice"
1. Sees success animation + updated stats
1. Returns to dashboard

### Parent Viewing & Commenting Flow

1. Parent logs in
1. Sees player dashboard with all logs
1. Taps on specific practice log
1. Views all logged details
1. Taps "Add Comment" button
1. Writes encouraging note or suggestion
1. Saves comment
1. Player sees notification of new comment

-----

**End of PRD**
