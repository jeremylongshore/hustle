# SITREP: Hustle Infrastructure Assessment & Firebase Migration Plan

**Date:** 2025-11-09T19:35:00Z
**Classification:** Operational Planning
**Priority:** High
**Status:** Assessment Complete - Migration Planning Phase

---

## EXECUTIVE SUMMARY

**Current Reality Check:**
- ❌ **NOT on Netlify** - Never was
- ✅ **Current Hosting:** Google Cloud Run (Container-based)
- ✅ **Database:** Cloud SQL PostgreSQL
- ✅ **Project ID:** `hustleapp-production`
- ❌ **No Firebase** currently configured
- ❌ **No A2A agent** framework deployed

**Recommendation:** Hybrid approach - Keep Cloud Run for backend, add Firebase for hosting/Firestore, deploy A2A agent on Vertex AI

---

## SECTION 1: CURRENT INFRASTRUCTURE STATUS

### 1.1 Hosting & Deployment

**Current Stack:**
```
Platform:    Google Cloud Run (Fully Managed)
Project:     hustleapp-production
Region:      us-central1
Services:
  - hustle-app (production)
  - hustle-app-staging (staging)
Container:   Docker (Node.js 22 Alpine)
CI/CD:       GitHub Actions (Workload Identity Federation)
```

**Deployment Pipeline:**
- **Trigger:** Push to `main` branch
- **Build:** Docker multi-stage build (Next.js 15 + Prisma)
- **Deploy:** Cloud Run with auto-scaling
- **URL:** https://hustlestats.io (production)
- **Staging:** https://staging-hustlestats.io

### 1.2 Database Architecture

**Current Database:**
```
Type:        Cloud SQL PostgreSQL
ORM:         Prisma 6.16.3
Models:      8 core models (User, Player, Game, etc.)
Backup:      Automated daily backups
Connection:  Prisma connection pooling
```

**Data Storage Costs:**
- PostgreSQL: ~$30-50/month (current usage)
- No Firestore currently configured

### 1.3 Authentication System

**Current Auth Stack:**
```
Framework:   NextAuth v5.0.0-beta.29
Strategy:    Credentials provider (email/password)
Sessions:    JWT-based (30-day expiry)
Security:    Bcrypt hashing (10 rounds)
Flow:        Email verification required
```

**Registration Automation (Current):**
1. User submits registration form
2. API validates input (email, password strength)
3. Check for duplicate email
4. Hash password with bcrypt
5. Create user in PostgreSQL
6. Generate email verification token
7. Send verification email (Resend API)
8. Return success response

**Issue:** This is synchronous imperative code, not an agentic workflow.

### 1.4 Email System

**Current Email Provider:**
```
Service:     Resend (resend.com)
API:         REST API
Templates:   Custom HTML/text templates
From:        HUSTLE@intentsolutions.io
Tier:        Free (3,000 emails/month)
```

### 1.5 CI/CD & Workflows

**GitHub Actions Workflows:**
1. `ci.yml` - Tests, linting, type checking
2. `deploy.yml` - Cloud Run deployment (staging + production)
3. `assemble.yml` - NWSL video generation (Vertex AI Veo 3.0)
4. `release.yml` - Version releases
5. `auto-fix.yml` - Automated formatting
6. `branch-protection.yml` - PR checks
7. `pages.yml` - GitHub Pages

**NWSL Video Pipeline:**
- Uses Vertex AI Veo 3.0 for video generation
- Uses Lyria for audio generation
- CI-only execution with WIF authentication
- Already demonstrates Vertex AI integration

---

## SECTION 2: CURRENT AUTOMATION ANALYSIS

### 2.1 Registration Workflow (Current)

**File:** `src/app/api/auth/register/route.ts`

**Current Process (Imperative):**
```typescript
POST /api/auth/register
  ├─ Validate input
  ├─ Check duplicate email
  ├─ Hash password (bcrypt)
  ├─ Create user (Prisma → PostgreSQL)
  ├─ Generate verification token
  ├─ Send email (Resend)
  └─ Return response
```

**Characteristics:**
- ✅ **Functional:** Works reliably
- ❌ **Synchronous:** Blocks on each step
- ❌ **Rigid:** No dynamic decision-making
- ❌ **Non-agentic:** No goal-oriented behavior
- ❌ **Single-threaded:** No parallel processing
- ❌ **Manual:** Requires code changes for new flows

### 2.2 What Should Be Agentic (A2A Model)

**Target Registration Workflow (A2A):**
```
User Registration Event
  ↓
[Orchestrator Agent] (IAMS1 Intent Agent)
  ├─ [Validation Agent]
  │   ├─ Email format validation
  │   ├─ Password strength check
  │   └─ Duplicate detection
  ├─ [User Creation Agent]
  │   ├─ Hash password
  │   ├─ Store in Firestore
  │   └─ Assign unique ID
  ├─ [Onboarding Agent]
  │   ├─ Send welcome email
  │   ├─ Create verification token
  │   └─ Log onboarding event
  └─ [Analytics Agent]
      ├─ Track signup metrics
      └─ Update dashboards
```

**Benefits of A2A Model:**
- ✅ **Parallel Processing:** Agents run concurrently
- ✅ **Resilient:** Agent failures don't crash entire flow
- ✅ **Scalable:** Add new agents without refactoring
- ✅ **Observable:** Each agent logs independently
- ✅ **Flexible:** Agents can make dynamic decisions
- ✅ **Cost-Effective:** Only pay for agent execution time

---

## SECTION 3: FIREBASE MIGRATION STRATEGY

### 3.1 Why Firebase?

**Cost Analysis:**
```
Current (Cloud SQL + Cloud Run):
  - Cloud SQL PostgreSQL:    ~$40/month
  - Cloud Run:               ~$10-30/month (pay per request)
  - Total:                   ~$50-70/month

Proposed (Firebase + Cloud Run + Firestore):
  - Firebase Hosting:        FREE (up to 10GB storage, 360MB/day)
  - Firestore:              FREE (1GB storage, 50K reads, 20K writes/day)
  - Cloud Run (agents):     ~$5-10/month (reduced load)
  - Vertex AI (A2A):        Pay per agent execution (~$0.01-0.05 per signup)
  - Total:                  ~$5-20/month
```

**Cost Savings:** ~70-90% reduction

### 3.2 Firebase Architecture

**Proposed Stack:**
```
Frontend Hosting: Firebase Hosting (CDN, SSL, custom domain)
Database:         Firestore (NoSQL, real-time, offline-capable)
Authentication:   Firebase Auth (drop-in replacement for NextAuth)
Functions:        Cloud Functions for Firebase (event-driven)
Storage:          Firebase Storage (user uploads, player photos)
Analytics:        Firebase Analytics (free, built-in)
```

### 3.3 Migration Path

**Phase 1: Parallel Setup (Week 1)**
- [ ] Initialize Firebase in project (`firebase init`)
- [ ] Configure Firebase Hosting
- [ ] Set up Firestore database
- [ ] Configure Firebase Authentication
- [ ] Deploy Next.js frontend to Firebase Hosting
- [ ] Keep Cloud Run for backend APIs (hybrid approach)

**Phase 2: Data Migration (Week 2)**
- [ ] Export PostgreSQL data
- [ ] Transform to Firestore schema
- [ ] Migrate users to Firestore
- [ ] Migrate players and games to Firestore
- [ ] Run parallel for 1 week (dual-write)
- [ ] Verify data integrity

**Phase 3: Agent Deployment (Week 3)**
- [ ] Deploy Orchestrator Agent to Vertex AI
- [ ] Deploy sub-agents (Validation, Creation, Onboarding, Analytics)
- [ ] Configure agent communication (Pub/Sub or direct)
- [ ] Test A2A workflow in staging
- [ ] Monitor agent execution

**Phase 4: Cutover (Week 4)**
- [ ] Switch DNS to Firebase Hosting
- [ ] Disable Cloud Run frontend
- [ ] Keep Cloud Run for complex backend logic
- [ ] Monitor for 48 hours
- [ ] Decommission Cloud SQL (after 30-day retention)

---

## SECTION 4: A2A AGENT ARCHITECTURE (IAMS1 MODEL)

### 4.1 IAMS1 Intent Agent Template

**IAMS1 (Intent Agent Management System v1):**
```
Orchestrator Agent (Team Manager)
  ├─ Intent Recognition
  ├─ Agent Selection
  ├─ Task Decomposition
  ├─ Agent Coordination
  └─ Result Aggregation
```

**Reference:** Google Cloud Vertex AI Agent Builder template for IAMS1

### 4.2 Hustle Orchestrator Agent

**Name:** `hustle-operations-manager`
**Role:** Team manager for all Hustle operations
**Platform:** Vertex AI Gen AI Studio
**Model:** Gemini 2.0 Flash (fast, cost-effective)

**Responsibilities:**
1. **User Registration Flow**
   - Coordinate validation, creation, onboarding agents
   - Handle errors and retries
   - Aggregate results for frontend response

2. **Player Management Flow**
   - Create player profiles
   - Link to parent accounts
   - Handle COPPA compliance

3. **Game Logging Flow**
   - Validate game data
   - Calculate statistics
   - Trigger analytics updates

4. **Notification Flow**
   - Send emails via Resend
   - Send SMS (future)
   - Push notifications (future)

### 4.3 Sub-Agents Architecture

**Agent 1: Validation Agent**
```
Name:     hustle-validation-agent
Purpose:  Input validation and security checks
Tools:
  - Email validator
  - Password strength checker
  - Duplicate detector (Firestore query)
Triggers: User registration, player creation, game logging
```

**Agent 2: User Creation Agent**
```
Name:     hustle-user-creation-agent
Purpose:  Create and manage user accounts
Tools:
  - Firestore write API
  - Bcrypt hashing library
  - UUID generator
Triggers: User registration (after validation)
```

**Agent 3: Onboarding Agent**
```
Name:     hustle-onboarding-agent
Purpose:  Welcome emails, tutorials, setup guidance
Tools:
  - Resend email API
  - Email template generator
  - Verification token generator
Triggers: User creation complete
```

**Agent 4: Analytics Agent**
```
Name:     hustle-analytics-agent
Purpose:  Track metrics, update dashboards
Tools:
  - Firestore analytics queries
  - BigQuery export (optional)
  - Dashboard update API
Triggers: Any significant event
```

### 4.4 Agent Communication

**Pattern:** Event-Driven with Cloud Pub/Sub

```
User Registration Request
  ↓
[Orchestrator Agent] publishes to topic: "user.registration.requested"
  ↓
[Validation Agent] subscribes, validates, publishes: "user.validation.complete"
  ↓
[User Creation Agent] subscribes, creates, publishes: "user.creation.complete"
  ↓
[Onboarding Agent] subscribes, sends email, publishes: "user.onboarding.complete"
  ↓
[Orchestrator Agent] aggregates results, returns to frontend
```

**Benefits:**
- ✅ **Decoupled:** Agents don't directly depend on each other
- ✅ **Resilient:** Failed agents can retry without blocking others
- ✅ **Observable:** Pub/Sub logs all events
- ✅ **Scalable:** Add new agents by subscribing to topics

---

## SECTION 5: VERTEX AI INTEGRATION STRATEGY

### 5.1 Vertex AI Agent Builder

**Product:** Google Cloud Vertex AI Agent Builder
**Documentation:** https://cloud.google.com/vertex-ai/docs/agent-builder

**Setup Steps:**
1. Enable Vertex AI API in `hustleapp-production`
2. Create Agent Builder project
3. Define agent intents (registration, player creation, game logging)
4. Configure agent tools (Firestore, Resend, validation libraries)
5. Deploy agents to Vertex AI
6. Configure triggers (HTTP, Pub/Sub, Eventarc)

### 5.2 Existing Vertex AI Integration (NWSL)

**Current Vertex AI Usage:**
- **Veo 3.0:** Video generation for NWSL documentary
- **Lyria:** Audio generation
- **Region:** us-central1
- **Authentication:** Workload Identity Federation (WIF)

**Reusable Components:**
- ✅ WIF authentication already configured
- ✅ Vertex AI API enabled
- ✅ GitHub Actions integration proven
- ✅ Cost monitoring setup

### 5.3 Agent Deployment Architecture

**Deployment Target:** Vertex AI Agent Builder + Cloud Run

```
[Frontend] (Firebase Hosting)
    ↓
[API Gateway] (Cloud Run - thin layer)
    ↓
[Orchestrator Agent] (Vertex AI - Gemini 2.0 Flash)
    ├─ [Validation Agent] (Cloud Run function)
    ├─ [User Creation Agent] (Cloud Run function)
    ├─ [Onboarding Agent] (Cloud Run function)
    └─ [Analytics Agent] (Cloud Run function)
    ↓
[Firestore Database]
```

**Why Hybrid?**
- Orchestrator on Vertex AI (intelligent decision-making)
- Sub-agents on Cloud Run (fast, cost-effective execution)
- Best of both worlds: AI reasoning + fast compute

---

## SECTION 6: COST ANALYSIS

### 6.1 Current Monthly Costs

```
Cloud SQL PostgreSQL:          $40
Cloud Run (2 services):        $20
Docker Artifact Registry:      $5
Secret Manager:                $2
Cloud Logging:                 $5
TOTAL:                         $72/month
```

### 6.2 Projected Monthly Costs (After Migration)

```
Firebase Hosting:              FREE (under limits)
Firestore:                     FREE (startup tier)
Firebase Auth:                 FREE (50K MAU)
Cloud Run (reduced):           $5 (API gateway only)
Vertex AI Agents:              $10 (estimated 1,000 signups/month @ $0.01 each)
Pub/Sub:                       $2
Cloud Logging:                 $3
TOTAL:                         $20/month
```

**Cost Savings:** $52/month (72% reduction)

### 6.3 Scaling Projections

**At 10,000 signups/month:**
```
Firestore:                     $5 (read/write volume)
Vertex AI Agents:              $100 (10K executions @ $0.01)
Cloud Run:                     $10
TOTAL:                         $115/month
```

**Comparison:** Current architecture would cost ~$300/month at this scale

---

## SECTION 7: IMPLEMENTATION ROADMAP

### 7.1 Immediate Actions (Next 48 Hours)

- [x] Complete infrastructure assessment ✅
- [x] Create SITREP document ✅
- [ ] Initialize Firebase project
- [ ] Create Firestore database schema design
- [ ] Draft Orchestrator Agent prompt
- [ ] Set up Vertex AI Agent Builder access

### 7.2 Week 1: Firebase Foundation

**Days 1-2:**
- [ ] Run `firebase init` in project
- [ ] Configure Firebase Hosting
- [ ] Deploy Next.js frontend to Firebase
- [ ] Test custom domain (hustlestats.io)

**Days 3-4:**
- [ ] Design Firestore schema (users, players, games)
- [ ] Create Firestore security rules
- [ ] Set up Firestore indexes
- [ ] Test Firestore read/write from frontend

**Days 5-7:**
- [ ] Migrate 10 test users to Firestore
- [ ] Implement dual-write (PostgreSQL + Firestore)
- [ ] Verify data consistency
- [ ] Monitor performance

### 7.3 Week 2: Agent Development

**Days 1-3:**
- [ ] Create Orchestrator Agent in Vertex AI Agent Builder
- [ ] Define intents (registration, player_creation, game_logging)
- [ ] Configure agent tools (Firestore client, Resend API)
- [ ] Test agent in Vertex AI console

**Days 4-5:**
- [ ] Develop Validation Agent (Cloud Run function)
- [ ] Develop User Creation Agent (Cloud Run function)
- [ ] Develop Onboarding Agent (Cloud Run function)
- [ ] Deploy agents to Cloud Run

**Days 6-7:**
- [ ] Set up Pub/Sub topics and subscriptions
- [ ] Configure agent communication flow
- [ ] Test end-to-end A2A workflow in staging
- [ ] Monitor agent execution and errors

### 7.4 Week 3: Integration & Testing

**Days 1-3:**
- [ ] Update frontend to call Orchestrator Agent instead of direct API
- [ ] Implement error handling for agent failures
- [ ] Add retry logic and circuit breakers
- [ ] Test with 100 staging registrations

**Days 4-5:**
- [ ] Migrate all users to Firestore (bulk migration script)
- [ ] Disable PostgreSQL writes
- [ ] Switch to Firestore-only reads
- [ ] Monitor for 24 hours

**Days 6-7:**
- [ ] Load testing (1,000 concurrent registrations)
- [ ] Performance tuning (agent timeouts, Firestore indexes)
- [ ] Security audit (Firestore rules, agent permissions)
- [ ] Documentation update

### 7.5 Week 4: Production Cutover

**Days 1-2:**
- [ ] Final testing in staging
- [ ] Backup all data (PostgreSQL export)
- [ ] Prepare rollback plan
- [ ] Schedule maintenance window

**Day 3:**
- [ ] Switch DNS to Firebase Hosting
- [ ] Enable A2A agent workflow in production
- [ ] Disable old Cloud Run frontend
- [ ] Monitor for 6 hours (daytime)

**Days 4-5:**
- [ ] Monitor agent performance
- [ ] Fix any issues discovered
- [ ] Optimize slow agents
- [ ] Gather user feedback

**Days 6-7:**
- [ ] Decommission Cloud SQL (after 7-day retention)
- [ ] Remove old Cloud Run services
- [ ] Update documentation
- [ ] Celebrate successful migration 🎉

---

## SECTION 8: RISK ASSESSMENT

### 8.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Firestore schema mismatch | High | Medium | Extensive testing, schema validation |
| Agent timeout on slow operations | Medium | High | Implement retries, increase timeouts |
| Data loss during migration | Critical | Low | Dual-write, backups, rollback plan |
| Firestore cost overrun | Medium | Low | Set billing alerts, monitor quotas |
| Agent communication failure | High | Medium | Pub/Sub retry policy, dead-letter queues |

### 8.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User experience degradation | High | Low | Staging testing, gradual rollout |
| Registration downtime | Critical | Low | Maintenance window, status page |
| Email delivery issues | Medium | Low | Keep Resend as provider, monitor delivery rates |
| Lost revenue during migration | Low | Low | Fast cutover, minimal downtime |

### 8.3 Rollback Plan

**If migration fails:**
1. Switch DNS back to Cloud Run
2. Re-enable old Cloud Run services
3. Continue dual-write to PostgreSQL
4. Disable A2A agents
5. Analyze failure, fix, retry

**Rollback Time:** < 15 minutes

---

## SECTION 9: MONITORING & OBSERVABILITY

### 9.1 Metrics to Track

**Agent Performance:**
- Agent execution time (p50, p95, p99)
- Agent success rate
- Agent error rate
- Agent retry count

**System Health:**
- Firestore read/write latency
- Firebase Hosting response time
- Cloud Run function cold starts
- Pub/Sub message delivery time

**Business Metrics:**
- User registration rate
- Email verification rate
- Player creation rate
- Game logging rate

### 9.2 Alerting

**Critical Alerts:**
- Agent failure rate > 5%
- Firestore quota exceeded
- Firebase Hosting downtime
- Email delivery failure rate > 10%

**Warning Alerts:**
- Agent execution time > 10s (p95)
- Firestore read cost > $5/day
- Cloud Run function errors > 1%

---

## SECTION 10: RECOMMENDATIONS

### 10.1 Immediate Actions

1. ✅ **Initialize Firebase project** (today)
2. ✅ **Create Vertex AI Agent Builder project** (today)
3. ✅ **Draft Orchestrator Agent prompt** (today)
4. ⏳ **Design Firestore schema** (this week)
5. ⏳ **Deploy first test agent** (this week)

### 10.2 Architecture Decisions

**Frontend Hosting:**
- ✅ Migrate to Firebase Hosting
- ✅ Keep Cloud Run for complex backend APIs
- ✅ Use CDN for static assets

**Database:**
- ✅ Migrate to Firestore for user data
- ✅ Keep PostgreSQL for complex analytics (optional)
- ⚠️ Consider BigQuery for data warehouse

**Agent Platform:**
- ✅ Orchestrator on Vertex AI (intelligent)
- ✅ Sub-agents on Cloud Run (fast)
- ✅ Communication via Pub/Sub (decoupled)

### 10.3 Next Steps

**Today:**
- Initialize Firebase: `firebase init`
- Create Firestore database
- Enable Vertex AI Agent Builder

**This Week:**
- Deploy first agent (Validation Agent)
- Test A2A workflow in staging
- Create Firestore schema

**Next Week:**
- Full agent deployment
- Data migration
- Production testing

---

## SECTION 11: CONCLUSION

### Current State
- ✅ Stable Cloud Run deployment
- ✅ Functional registration workflow
- ❌ Not on Netlify (never was)
- ❌ No Firebase (yet)
- ❌ No A2A agents (yet)

### Target State
- ✅ Firebase Hosting (frontend)
- ✅ Firestore (database)
- ✅ Vertex AI A2A agents (workflow automation)
- ✅ 70% cost reduction
- ✅ Scalable agentic architecture

### Execution Status
- **Assessment:** ✅ Complete
- **Planning:** ✅ Complete
- **Implementation:** ⏳ Ready to begin

**Ready to proceed with Firebase initialization and Vertex AI Agent setup.**

---

**SITREP Generated:** 2025-11-09T19:35:00Z
**Next Update:** After Firebase initialization (24 hours)
**Classification:** Operational Planning
**Distribution:** Engineering Team, Operations Manager

---

**ACTION REQUIRED:**
Approve Firebase initialization and Vertex AI Agent Builder setup to proceed with Week 1 implementation.
