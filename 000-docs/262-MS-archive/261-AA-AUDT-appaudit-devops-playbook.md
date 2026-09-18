# Hustle: Operator-Grade System Analysis & Operations Guide
*For: DevOps Engineer*
*Generated: 2025-12-29*
*System Version: v1.0.0-131-gcca6eeb2*
*Auditor: Intent Solutions Senior Cloud Architect*

---

## Table of Contents
1. Executive Summary
2. Operator & Customer Journey
3. System Architecture Overview
4. Directory Deep-Dive
5. Automation & Agent Surfaces
6. Operational Reference
7. Security, Compliance & Access
8. Cost & Performance
9. Development Workflow
10. Dependencies & Supply Chain
11. Integration with Existing Documentation
12. Current State Assessment
13. Quick Reference
14. Recommendations Roadmap

---

## 1. Executive Summary

### Business Purpose

Hustle is a **youth soccer statistics tracking platform** designed to transform subjective athletic impressions into verified, recruiter-trusted performance records. The platform targets the competitive U.S. youth soccer market (ECNL, MLS Next, USYS, and 53 additional leagues) with approximately 3+ million registered youth players.

The system consolidates fragmented game data from coaches' notebooks, team apps, and parent spreadsheets into a single verified digital record. This creates an accountability layer where performance becomes transparent, removing politics from recruiting decisions. The platform tracks **13 specialized soccer positions** with position-specific statistics (goalkeeper saves, defender tackles, striker goals) enabling apples-to-apples comparisons.

**Current Operational Status**: Production-live at https://hustlestats.io with 57+ active users. The platform completed a major PostgreSQL-to-Firebase migration in November 2025, consolidating on Google's Firebase platform. Mobile app development is underway with React Native/Expo targeting Q1 2026 App Store submission.

**Technology Foundation**: Built on Next.js 15.5 with React 19 and TypeScript 5.x. The platform leverages Firebase for authentication (email/password with COPPA compliance), Firestore for real-time hierarchical data, and Firebase Hosting with Cloud Run for SSR. A 5-agent Vertex AI system using A2A protocol handles operations orchestration, though full RAG integration remains in development.

**Strategic Considerations**: The platform is **production-ready** for core functionality (player tracking, game logging, billing). Immediate priorities include: (1) hardening the Synthetic QA pipeline with proper CI secrets, (2) completing Vertex AI agent RAG integration, (3) mobile app App Store submission, and (4) addressing critical security vulnerabilities in dependency chain.

### Operational Status Matrix

| Environment | Status | Uptime Target | Current Uptime | Release Cadence | Active Users |
|-------------|--------|---------------|----------------|-----------------|--------------|
| Production | **Live** | 99.9% | ~99.5% (est.) | Weekly | 57+ |
| Staging | Active | 95% | ~98% | On PR merge | QA Team |
| Development | Active | N/A | N/A | Continuous | 3-5 devs |
| Mobile (Expo) | Development | N/A | N/A | Sprint-based | 2 devs |

### Technology Stack Summary

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Language | TypeScript | 5.x | Primary development language |
| Framework | Next.js | 15.5.4 | Full-stack React framework with App Router |
| UI | React | 19.1.0 | Component library with Server Components |
| Database | Firestore | Current | NoSQL real-time database |
| Auth | Firebase Auth | Current | Email/password authentication |
| Cloud Platform | Google Cloud | Current | Infrastructure foundation |
| CI/CD | GitHub Actions | Current | Automated deployment pipelines |
| Mobile | React Native/Expo | 54.0.29 | Cross-platform mobile app |
| AI/ML | Vertex AI Agent Engine | Current | A2A orchestrated agents |
| IaC | Terraform | 1.5+ | Multi-project infrastructure |
| Payments | Stripe | 19.3.1 | Subscription billing |

### Critical Risk Summary

| Risk | Severity | Status | Mitigation |
|------|----------|--------|------------|
| Next.js Critical CVE | **CRITICAL** | Open | Immediate upgrade to 15.5.8+ required |
| JWS HMAC Vulnerability | HIGH | Open | Dependency update required |
| CI Secrets Missing | HIGH | Blocking QA | Configure 9 GitHub secrets |
| Vertex AI Agents Not RAG-Integrated | MEDIUM | In Progress | ADK crawler complete, integration pending |
| Mobile App Store Submission | MEDIUM | Planned | Target Q1 2026 |

---

## 2. Operator & Customer Journey

### Primary Personas

**Operators (Primary)**
- Youth soccer parents (ages 30-50) managing 1-4 child athletes
- Technical comfort: Moderate (smartphone-first, desktop-capable)
- Usage pattern: 2-3x weekly during season, game day entry
- Pain points: Scattered data, coach politics, recruiter skepticism
- Value driver: Verified, shareable performance records

**External Customers (Athletes)**
- Youth soccer players (ages 10-18)
- Access: View-only through parent account (COPPA compliance)
- Usage: Review personal stats, track progress
- Future: Self-managed profiles at age 18

**Reseller Partners (Future)**
- Club/league administrators
- Bulk access for team-wide tracking
- White-label potential
- SaaS licensing model

**Automation Bots**
- Vertex AI orchestrator and sub-agents
- Scheduled Cloud Functions (trial reminders)
- Synthetic QA playwright bots
- CI/CD GitHub Actions runners

### End-to-End Journey Map

```
Discovery --> Registration --> Player Setup --> Game Logging --> Stats Review --> Sharing/Recruiting
```

**Stage 1: Discovery**
- Entry point: hustlestats.io landing page
- Value proposition: "Performance Data Recruiters Trust"
- Social proof: 56 leagues, 13 positions, verified stats
- Engineering touchpoints: CDN performance, SEO metadata, Core Web Vitals
- Success metric: < 2s LCP, > 3% conversion to registration
- Friction: None identified; landing page optimized

**Stage 2: Registration**
- Flow: Email/password with Firebase Auth
- COPPA gate: Parent/guardian checkbox + age verification
- Email verification: Required before dashboard access
- Engineering touchpoints: Auth service reliability, Resend email deliverability
- Success metric: > 95% email verification completion
- Friction: Email deliverability to school/work addresses

**Stage 3: Player Setup**
- Data model: `/users/{userId}/players/{playerId}` subcollection
- Required fields: Name, birthday, gender, primary position, league, team/club
- League selection: 56 predefined + "Other" free-text
- Position selection: 13 positions with primary + up to 3 secondary
- Engineering touchpoints: Firestore write performance, Zod validation
- Success metric: < 3 minutes to complete first player
- Friction: League selection can be overwhelming

**Stage 4: Game Logging**
- Data model: `/users/{userId}/players/{playerId}/games/{gameId}` nested subcollection
- Quick capture: Date, opponent, result, minutes played
- Position-specific stats:
  - Universal: Goals, assists
  - Defensive (CB, RB, LB, DM): Tackles, interceptions, clearances, blocks, aerials
  - Goalkeeper (GK): Saves, goals against, clean sheet
- Engineering touchpoints: Real-time sync, offline capability (mobile)
- Success metric: < 60 seconds per game entry
- Friction: Manual entry; no integration with game tracking apps

**Stage 5: Stats Review**
- Dashboard: Visual analytics with recharts
- Views: Per-player trends, position-specific insights
- Data: Real-time Firestore sync with optimistic updates
- Engineering touchpoints: Query optimization, component caching
- Success metric: Dashboard load < 1.5s
- Friction: Limited historical analysis; no season comparisons

**Stage 6: Sharing/Recruiting (Future)**
- Planned: Shareable player profiles with verification badges
- Planned: Export to PDF reports
- Planned: Recruiter access tiers with paid subscriptions
- Engineering touchpoints: Privacy controls, data portability, access tokens
- Friction: Not yet implemented

### SLA Commitments

| Metric | Target | Current | Measurement | Owner |
|--------|--------|---------|-------------|-------|
| Uptime (Production) | 99.9% | ~99.5% | Firebase Hosting metrics | DevOps |
| Dashboard Load (P95) | < 2s | ~1.5s | Firebase Performance | Frontend |
| API Response (P95) | < 500ms | ~300ms | Cloud Functions logs | Backend |
| Auth Success Rate | > 98% | ~99% | Firebase Auth console | Platform |
| Data Sync Latency | < 500ms | ~200ms | Firestore metrics | Platform |
| Email Deliverability | > 95% | ~92% | Resend dashboard | DevOps |
| CI Pipeline Success | > 90% | ~85% | GitHub Actions | DevOps |

---

## 3. System Architecture Overview

### Technology Stack (Detailed)

| Layer | Technology | Version | Source of Truth | Purpose | Owner |
|-------|------------|---------|-----------------|---------|-------|
| **Frontend/UI** | Next.js + React | 15.5.4 / 19.1.0 | package.json | SSR, App Router, Server Components | Frontend |
| **UI Components** | shadcn/ui + Radix | Various | components.json | Accessible component primitives | Frontend |
| **Styling** | Tailwind CSS | 3.4.18 | tailwind.config.ts | Utility-first CSS | Frontend |
| **Forms** | react-hook-form + Zod | 7.64.0 / 4.1.11 | package.json | Form handling + validation | Frontend |
| **State** | Zustand | 5.0.8 | package.json | Lightweight state management | Frontend |
| **Charts** | Recharts | 3.2.1 | package.json | Data visualization | Frontend |
| **Backend/API** | Next.js API Routes | 15.5.4 | src/app/api/ | REST endpoints | Backend |
| **Database** | Firestore | Current | Firebase Console | NoSQL hierarchical data | Platform |
| **Authentication** | Firebase Auth | Current | Firebase Console | Email/password provider | Platform |
| **Cloud Functions** | Node.js + Firebase Functions | 20 | functions/ | Serverless compute, triggers | Backend |
| **File Storage** | Firebase Storage | Current | Firebase Console | Player photos, media | Platform |
| **AI/ML** | Vertex AI Agent Engine | Current | vertex-agents/ | A2A orchestration | AI Team |
| **Email** | Resend | 6.1.2 | package.json | Transactional email | Platform |
| **Payments** | Stripe | 19.3.1 | package.json | Subscription billing | Billing |
| **Hosting (Static)** | Firebase Hosting | Current | firebase.json | CDN, static assets | DevOps |
| **Hosting (SSR)** | Cloud Run | Current | Dockerfile | Server-side rendering | DevOps |
| **Infrastructure** | Terraform | 1.5+ | 06-Infrastructure/terraform/ | IaC management | DevOps |
| **Observability** | Cloud Logging | Current | GCP Console | Centralized logs | DevOps |
| **Error Tracking** | Cloud Error Reporting | Current | GCP Console | Exception tracking | DevOps |
| **Performance** | Firebase Performance | Current | Firebase Console | Client performance | DevOps |
| **CI/CD** | GitHub Actions | Current | .github/workflows/ | Build, test, deploy | DevOps |
| **Testing (Unit)** | Vitest | 3.2.4 | vitest.config.mts | Unit tests | QA |
| **Testing (E2E)** | Playwright | 1.56.0 | playwright.config.ts | Browser automation | QA |
| **Mobile** | React Native + Expo | 0.81.5 / 54.0.29 | mobile/package.json | iOS/Android app | Mobile |

### Environment Matrix

| Environment | Purpose | Hosting | Database | Deploy Trigger | IaC | Notes |
|-------------|---------|---------|----------|----------------|-----|-------|
| **local** | Development | localhost:3000 | Emulators (optional) | N/A | N/A | `npm run dev` with Turbopack |
| **staging** | Pre-production | Cloud Run | Firestore (prod project) | Push to main | terraform/environments/staging | Auto-deploy on merge |
| **prod** | Live application | Firebase Hosting + Cloud Run | Firestore (prod) | Manual workflow | terraform/environments/prod | Requires "DEPLOY" confirmation |
| **mobile-dev** | Expo development | Expo Go | Firestore (prod) | N/A | N/A | `cd mobile && npm start` |

### Cloud & Platform Services (GCP Project: hustleapp-production)

| Service | Purpose | Monthly Cost Est. | Config Location | Owner | Vendor Lock-in |
|---------|---------|-------------------|-----------------|-------|----------------|
| Firebase Auth | User authentication | $0 (free tier) | Firebase Console | Platform | Low |
| Firestore | Primary database | $0-10 (free tier) | firestore.rules, firestore.indexes.json | Platform | Medium |
| Firebase Hosting | Static assets CDN | $0 (free tier) | firebase.json | DevOps | Low |
| Cloud Run | SSR runtime | $0-20 | Dockerfile | DevOps | Low |
| Firebase Storage | Player photos | $0-5 | Firebase Console | Platform | Medium |
| Cloud Functions | Serverless compute | $0-10 | functions/ | Backend | Medium |
| Vertex AI Agent Engine | AI orchestration | $0 (not active) | vertex-agents/ | AI Team | High |
| Cloud Logging | Observability | $0-25 | GCP Console | DevOps | Low |
| Cloud Error Reporting | Exception tracking | $0 | GCP Console | DevOps | Low |
| Secret Manager | Secrets storage | $0.06/secret/month | GCP Console | DevOps | Low |
| Resend | Email delivery | $0 (free tier) | RESEND_API_KEY | DevOps | Low |
| Stripe | Billing | 2.9% + $0.30/tx | STRIPE_SECRET_KEY | Billing | Low |

**Estimated Monthly Cost (Current Scale)**: $0-50/month (within free tiers)
**Estimated at 1,000 Users**: $50-150/month
**Estimated at 10,000 Users**: $200-500/month

### Architecture Diagram

```
                                  +-----------------+
                                  |    INTERNET     |
                                  +--------+--------+
                                           |
                    +----------------------+----------------------+
                    |                      |                      |
           +--------v--------+    +--------v--------+    +--------v--------+
           |  Firebase       |    |  Cloud CDN      |    |  Mobile Clients |
           |  Hosting        |    |  (Static Assets)|    |  (Expo/RN)      |
           |  hustlestats.io |    +--------+--------+    +--------+--------+
           +--------+--------+             |                      |
                    |                      |                      |
                    +----------------------+----------------------+
                                           |
                              +------------v-------------+
                              |      Cloud Run (SSR)     |
                              |   Next.js 15 Application |
                              | +----------------------+ |
                              | | Middleware           | |
                              | | - Auth cookie check  | |
                              | | - Route protection   | |
                              | +----------+-----------+ |
                              |            |             |
                              | +----------v-----------+ |
                              | | API Routes           | |
                              | | /api/auth/*          | |
                              | | /api/players/*       | |
                              | | /api/games/*         | |
                              | | /api/billing/*       | |
                              | | /api/workspace/*     | |
                              | +----------+-----------+ |
                              +------------+-------------+
                                           |
              +----------------------------+----------------------------+
              |                            |                            |
    +---------v---------+        +---------v---------+        +---------v---------+
    |   Firebase Auth   |        |    Firestore      |        |  Firebase Storage |
    |  (Email/Password) |        | (Hierarchical)    |        |  (Player Photos)  |
    +-------------------+        +-------------------+        +-------------------+
                                         |
              Collections:               |
              - /workspaces/{id}         |
              - /users/{userId}          |
                - /players/{playerId}    |
                  - /games/{gameId}      |
              - /waitlist/{email}        |
              - /workspace-invites/{id}  |
                                         |
              +----------------------------+
              |                            |
    +---------v---------+        +---------v---------+
    |  Cloud Functions  |        |   Stripe API      |
    | - orchestrator    |        | - Checkout        |
    | - sendWelcomeEmail|        | - Webhooks        |
    | - sendTrialRemind.|        | - Customer Portal |
    +---------+---------+        +-------------------+
              |
              | (A2A Protocol - Not Yet Active)
              |
    +---------v-----------------------------------------+
    |           Vertex AI Agent Engine                   |
    |  +---------------+  +---------------+             |
    |  | Orchestrator  |->| Validation    |             |
    |  | Agent         |  | Agent         |             |
    |  +-------+-------+  +---------------+             |
    |          |                                        |
    |  +-------+-------+  +---------------+             |
    |  | User Creation |  | Analytics     |             |
    |  | Agent         |  | Agent         |             |
    |  +---------------+  +---------------+             |
    |                                                   |
    |  +---------------+                                |
    |  | Onboarding    |                                |
    |  | Agent         |                                |
    |  +---------------+                                |
    +---------------------------------------------------+
```

### Data Flow Diagram

```
User Action Flow:
================

Browser/Mobile --> Middleware (Auth Check) --> API Route --> Firestore
                           |                        |
                           v                        v
                     Session Cookie           Admin SDK
                     (__session)              Server-Side

Registration Flow:
=================

1. User submits form --> /api/auth/register
2. Firebase Auth creates user
3. Firestore user document created
4. Cloud Function sendWelcomeEmail triggered
5. Email sent via Resend
6. User verifies email
7. Session cookie set
8. Dashboard access granted

Game Logging Flow:
=================

1. User clicks "Log Game" --> React form
2. Zod validation (client)
3. POST /api/games/[playerId]
4. Firestore write with Admin SDK
5. Usage counter incremented (workspace.usage.gamesThisMonth)
6. Real-time sync to all connected clients
7. UI optimistically updated

Billing Flow:
============

1. User clicks "Upgrade" --> /api/billing/create-checkout
2. Stripe Checkout Session created
3. User redirected to Stripe hosted page
4. Payment processed
5. Stripe Webhook --> /api/webhooks/stripe
6. Workspace plan/status updated
7. Ledger event recorded
```

---

## 4. Directory Deep-Dive

### Project Structure Analysis

```
/home/jeremy/000-projects/hustle/
├── .beads/                       # Task tracking (beads CLI)
├── .credentials/                 # Local dev credentials (gitignored)
├── .firebase/                    # Firebase CLI cache
├── .github/                      # GitHub configuration
│   ├── ISSUE_TEMPLATE/           # 5 QA issue templates
│   └── workflows/                # 17 GitHub Actions workflows
├── .next/                        # Next.js build output
├── 000-docs/                     # 294 documentation files (DFS v2.0)
│   └── logos/                    # Generated branding assets
├── 03-Tests/                     # Test infrastructure
│   ├── e2e/                      # 7 Playwright test files
│   ├── mocks/                    # Test doubles
│   ├── playwright-report/        # HTML test reports
│   ├── results/                  # Test artifacts
│   ├── runtime/                  # Runtime verification scripts
│   ├── scripts/                  # Test helper scripts
│   └── snapshots/                # Visual regression baselines
├── 05-Scripts/                   # Operational scripts
│   ├── deployment/               # Deploy helpers
│   ├── maintenance/              # Maintenance utilities
│   ├── migration/                # Data migration scripts
│   └── utilities/                # General utilities
├── 06-Infrastructure/            # Infrastructure code
│   ├── docker/                   # Dockerfiles
│   ├── security/                 # Security configurations
│   ├── terraform/                # Terraform modules
│   └── terraform-backup-*/       # Backup configs
├── 99-Archive/                   # Deprecated code (reference only)
│   ├── 20251115-nextauth-legacy/ # NextAuth v5 (removed)
│   ├── 20251118-prisma-legacy/   # Prisma/PostgreSQL (removed)
│   └── ...
├── docs/                         # GitHub Pages source
├── functions/                    # Firebase Cloud Functions
│   ├── lib/                      # Compiled output
│   └── src/                      # TypeScript source (7 files)
├── mobile/                       # React Native mobile app
│   ├── app/                      # Expo Router screens
│   ├── assets/                   # Images, fonts
│   └── src/                      # Shared components
├── nwsl/                         # NWSL content generation (side project)
├── public/                       # Static assets
│   └── uploads/                  # User uploads (local dev)
├── scripts/                      # Legacy scripts
├── src/                          # Main application source
│   ├── __tests__/                # Unit test utilities
│   ├── app/                      # Next.js App Router
│   ├── components/               # React components (20+ files)
│   ├── hooks/                    # React hooks (4 files)
│   ├── lib/                      # Business logic
│   ├── prompts/                  # AI prompt templates
│   ├── schema/                   # Zod schemas
│   └── types/                    # TypeScript types
├── test-results/                 # Playwright test results
├── tests/                        # Additional test files
├── tmp/                          # Temporary files
├── tools/                        # Developer tools
│   └── adk_docs_crawler/         # ADK documentation crawler
├── vertex-agents/                # Vertex AI agent definitions
│   ├── orchestrator/             # Main coordinator agent
│   ├── scout/                    # Scout agent
│   ├── scout-team/               # Multi-agent scout team
│   └── venv/                     # Python virtual environment
├── AGENTS.md                     # Repository coding standards
├── CHANGELOG.md                  # Version history
├── CLAUDE.md                     # AI assistant context
├── Dockerfile                    # Production Docker image
├── firebase.json                 # Firebase configuration
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore composite indexes
├── middleware.ts                 # Next.js edge middleware
├── package.json                  # Dependencies (v0.0.1)
├── playwright.config.ts          # E2E test configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── vitest.config.mts             # Unit test configuration
```

### Detailed Directory Analysis

#### src/app/ (Next.js App Router)
**Purpose**: Page routes, layouts, and API endpoints
**Key Files**:
- `layout.tsx` (line 1-27): Root layout with providers
- `page.tsx` (line 1-370): Landing page with hero, features, CTAs
- `globals.css`: Tailwind CSS imports

**Route Structure**:
```
/                       # Landing page (public)
/login                  # Firebase Auth login
/register               # User registration with COPPA
/forgot-password        # Password reset request
/reset-password         # Password reset handler
/verify-email           # Email verification handler
/privacy                # Privacy policy
/terms                  # Terms of service
/dashboard/             # Protected dashboard (requires auth)
  /[playerId]/          # Player detail views
  /settings/            # User settings
  /billing/             # Subscription management
/api/                   # 15+ API endpoints
  /auth/*               # Authentication endpoints
  /players/*            # Player CRUD
  /games/*              # Game statistics CRUD
  /billing/*            # Stripe integration
  /workspace/*          # Workspace management
  /webhooks/stripe      # Stripe webhook handler
  /health               # Health check
```

#### src/lib/ (Business Logic)
**Purpose**: Core business logic, Firebase integration, billing
**Key Modules**:

- **firebase/** (9 files): Firebase Admin SDK, client SDK, auth, services
  - `admin.ts`: Admin SDK initialization with credentials
  - `auth.ts`: Client-side Firebase Auth wrapper
  - `services/`: Firestore service layer (players, games, users)
  - `admin-services/`: Server-side Firestore operations
  - `access-control.ts`: Role-based access enforcement

- **stripe/** (8 files): Stripe billing integration
  - `auditor.ts`: Subscription audit trail
  - `billing-portal.ts`: Customer portal session creation
  - `ledger.ts`: Event sourcing for billing events
  - `plan-enforcement.ts`: Plan limit enforcement
  - `plan-mapping.ts`: Plan tier definitions

- **billing/** (4 files): Plan limits and feature switches
  - `plan-limits.ts`: Usage evaluation against plan caps
  - `plan-change.ts`: Plan upgrade/downgrade logic
  - `feature-switch.ts`: BILLING_ENABLED toggle

- **workspaces/** (4 files): Workspace access control
  - `access-control.ts`: Workspace membership checks
  - `enforce.ts`: Status-based enforcement
  - `guards.ts`: Route protection helpers

- **validations/** (2 files): Zod schemas for API validation

#### src/components/ (React Components)
**Purpose**: Reusable UI components
**Key Components**:
- `BillingCallToAction.tsx`: Upgrade prompts
- `PaywallNotice.tsx`: Limit reached messaging
- `TrialWarningBanner.tsx`: Trial expiration warnings
- `WorkspaceStatusBanners.tsx`: Status notifications
- `PlayerPhotoUpload.tsx`: Firebase Storage integration
- `ui/`: shadcn/ui component library

#### functions/src/ (Cloud Functions)
**Purpose**: Serverless backend for triggers and A2A gateway
**Key Functions**:
- `index.ts` (386 lines): Main exports
  - `orchestrator`: A2A gateway to Vertex AI agents
  - `sendWelcomeEmail`: Auth trigger for new users
  - `sendTrialReminders`: Scheduled daily at 9:00 UTC
  - `validationAgent`, `userCreationAgent`, `onboardingAgent`, `analyticsAgent`: Stub functions for future agent integration
- `a2a-client.ts`: Vertex AI A2A protocol client
- `email-service.ts`: Resend email wrapper
- `email-templates.ts`: HTML email templates
- `logger.ts`: Structured logging with severity levels

#### 06-Infrastructure/terraform/ (Infrastructure as Code)
**Purpose**: Multi-project GCP infrastructure provisioning
**Structure**:
```
terraform/
├── main.tf              # Root module orchestration (345 lines)
├── variables.tf         # Input variables
├── terraform.tfvars.example
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
├── modules/
│   ├── projects/        # GCP project creation
│   ├── vpc/             # VPC networking
│   ├── firebase/        # Firebase project setup
│   ├── firestore/       # Firestore configuration
│   ├── cloud-storage/   # GCS buckets
│   ├── bigquery/        # Analytics datasets
│   ├── cloud-sql/       # PostgreSQL (deprecated)
│   ├── cloud-run/       # Cloud Run services
│   ├── iam/             # IAM roles and bindings
│   ├── vertex-ai-agent/ # Agent Engine resources
│   └── vertex-ai-search/# Vertex AI Search datastore
└── schemas/
    └── bigquery/        # BigQuery table schemas
```

**Key Resources**:
- Multi-project architecture (frontend, data, 5 agent projects)
- VPC with private connectivity
- 3 GCS buckets (player-media, embeddings, reports)
- 3 BigQuery datasets (analytics, ml_features, agent_logs)
- Vertex AI agent with 3 tool endpoints (analyze-trends, suggest-drills, compare-stats)
- Comprehensive IAM bindings

#### vertex-agents/ (AI Agent System)
**Purpose**: Vertex AI Agent Engine definitions
**Architecture**:
```
vertex-agents/
├── README.md            # Agent system documentation
├── deploy_agent.sh      # Deployment script
├── test_a2a.sh          # A2A protocol testing
├── requirements.txt     # Python dependencies
├── orchestrator/        # Root coordinator
│   ├── config/
│   │   ├── agent.yaml   # Agent configuration
│   │   └── agent-card.json # A2A discovery
│   └── src/
│       └── orchestrator_agent.py
├── scout/               # Scout agent (intelligence gathering)
└── scout-team/          # Multi-agent scout team
```

**Agent System**:
- **Orchestrator (hustle-operations-manager)**: Routes requests to sub-agents
- **Validation Agent**: Input validation, duplicate checking
- **User Creation Agent**: User/player/game provisioning
- **Onboarding Agent**: Welcome emails, token generation
- **Analytics Agent**: Metrics tracking, event logging

**Current Status**: Agents defined but not fully integrated. Cloud Functions provide stubs. RAG integration pending (ADK docs crawler complete, embedding upload needed).

#### mobile/ (React Native App)
**Purpose**: iOS/Android mobile application
**Stack**: React Native 0.81.5, Expo 54.0.29, NativeWind (Tailwind for RN)
**Structure**:
```
mobile/
├── app/                 # Expo Router screens
├── src/
│   ├── components/      # RN components
│   ├── hooks/           # Custom hooks
│   └── lib/             # Business logic
├── assets/              # Images, fonts
└── package.json         # Mobile dependencies
```

**Key Features**:
- Offline-first with MMKV storage
- React Query for data fetching
- Zustand for state management
- Firebase Auth integration
- Planned: App Store submission Q1 2026

---

## 5. Automation & Agent Surfaces

### GitHub Actions Workflows (17 total)

| Workflow | Trigger | Purpose | Status |
|----------|---------|---------|--------|
| `ci.yml` | Push/PR to main | Lint, type-check, build, test, security audit | **Active** |
| `deploy-firebase.yml` | Push to main (paths) | Deploy Firestore rules, indexes, Functions, Hosting | **Active** |
| `deploy-prod.yml` | Manual ("DEPLOY" confirm) | Production deployment with health check | **Active** |
| `deploy-vertex-agents.yml` | Manual | Vertex AI agent deployment | **Active** |
| `synthetic-qa.yml` | Schedule (6:00 UTC daily), Manual, PR | E2E smoke tests with Playwright | **Blocked** (missing secrets) |
| `mobile-ci.yml` | PR to mobile/** | Mobile app CI (lint, type-check) | **Active** |
| `mobile-deploy.yml` | Manual | EAS Build submission | **Active** |
| `crawl-adk-docs.yml` | Schedule (weekly) | ADK documentation crawler | **Active** |
| `pages.yml` | Push to main | GitHub Pages deployment | **Active** |
| `release.yml` | Tag push | Release automation | **Active** |
| `auto-fix.yml` | PR | Auto-fix lint issues | **Active** |
| `assemble.yml` | PR | Assemble and validate | **Active** |
| `generate-logos.yml` | Manual | Imagen 3 logo generation | **Active** |
| `gemini-code-review.yml` | PR | AI code review | **Active** |
| `deploy.yml` | Push to main | Legacy deployment | **Deprecated** |
| `branch-protection.yml` | Push | Branch protection enforcement | **Active** |

### CI/CD Pipeline Flow

```
PR Created/Updated:
==================
1. ci.yml triggers
   - ESLint (npm run lint)
   - Type check (npx tsc --noEmit)
   - Build (npm run build)
   - Unit tests (npm run test:unit)
   - Playwright smoke (npm run smoke-test)
   - Security audit (npm audit)
2. Docker build test
3. Gemini code review

Merge to Main:
=============
1. ci.yml runs
2. deploy-firebase.yml triggers (if paths match)
   - Deploy Firestore rules
   - Deploy indexes
   - Deploy Functions
   - Deploy Hosting

Production Deploy:
=================
1. Manual trigger deploy-prod.yml
2. Confirm "DEPLOY" input
3. Build application
4. Deploy Firestore, Functions, Hosting
5. Health check (HTTP 200/301/302)
6. Deployment summary
```

### Cloud Functions (Scheduled)

| Function | Schedule | Purpose | Owner |
|----------|----------|---------|-------|
| `sendTrialReminders` | Daily 9:00 UTC | Trial expiration reminders (3-day warning) | Backend |

### n8n Workflows

**Status**: Not currently deployed. Future consideration for:
- Automated QA report generation
- Slack notifications for deployments
- Data pipeline orchestration
- Agent workflow automation

### MCP / Integration Gateways

**Status**: Not currently deployed. Planned integrations:
- Claude MCP for AI-assisted operations
- Slack MCP for team notifications
- Google Calendar for game scheduling

### Vertex AI Agent A2A Protocol

| Agent | Endpoint | Purpose | Status |
|-------|----------|---------|--------|
| hustle-operations-manager | orchestrator Cloud Function | Route and coordinate | **Stub** |
| hustle-validation-agent | validationAgent Cloud Function | Input validation | **Stub** |
| hustle-user-creation-agent | userCreationAgent Cloud Function | User provisioning | **Stub** |
| hustle-onboarding-agent | onboardingAgent Cloud Function | Welcome flow | **Stub** |
| hustle-analytics-agent | analyticsAgent Cloud Function | Metrics tracking | **Stub** |

**Current State**: Cloud Functions provide HTTP endpoint stubs. Vertex AI agents are defined in `vertex-agents/` but not deployed to Agent Engine. A2A client (`functions/src/a2a-client.ts`) is implemented but calls currently pass through to stubs.

---

## 6. Operational Reference

### Deployment Workflows

#### Local Development

**Prerequisites**:
- Node.js 20+ (use nvm: `nvm use 20`)
- npm 10+
- Firebase CLI: `npm install -g firebase-tools`
- Google Cloud account with access to hustleapp-production

**Environment Setup**:
```bash
# Clone repository
git clone https://github.com/jeremylongshore/hustle.git
cd hustle

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure .env.local with:
# - Firebase client config (already populated)
# - Firebase Admin SDK credentials (from Firebase Console)
# - Resend API key (from resend.com)
# - Stripe keys (from Stripe Dashboard)

# Optional: Firebase emulators
firebase emulators:start --only auth,firestore
```

**Service Startup**:
```bash
# Development server (Turbopack)
npm run dev
# Opens http://localhost:3000

# Type check (no emit)
npx tsc --noEmit

# Lint
npm run lint

# Unit tests (watch mode)
npm run test:watch

# E2E tests (headed, debug mode)
npm run test:e2e:debug
```

**Verification Checklist**:
- [ ] Landing page loads
- [ ] Registration flow works
- [ ] Login creates session cookie
- [ ] Dashboard loads with auth
- [ ] Player CRUD operations work
- [ ] Game logging saves to Firestore

#### Staging Deployment

**Trigger**: Push to main branch (automatic via `deploy-firebase.yml`)

**Pre-flight Checks**:
1. CI pipeline passes (ci.yml)
2. All unit tests green
3. E2E smoke tests pass
4. No TypeScript errors

**Pipeline Steps**:
1. Checkout code
2. Setup Node.js 20
3. npm ci
4. Authenticate via Workload Identity Federation
5. Deploy Firestore rules
6. Deploy Firestore indexes
7. Build and deploy Cloud Functions
8. Deploy Firebase Hosting

**Post-deployment Verification**:
```bash
# Check deployment status
firebase hosting:channel:list

# View function logs
firebase functions:log --limit=50

# Test staging URL
curl -s https://hustleapp-production.web.app/api/health
```

#### Production Deployment

**Trigger**: Manual workflow dispatch (`deploy-prod.yml`)

**Pre-deployment Checklist**:
- [ ] CI pipeline green on main
- [ ] Staging deployment verified
- [ ] Database migrations rehearsed (if any)
- [ ] Feature toggles reviewed
- [ ] Rollback plan documented
- [ ] Team notified in #deployments

**Execution**:
1. Navigate to Actions > "Deploy to Production"
2. Click "Run workflow"
3. Type "DEPLOY" in confirmation input
4. Click "Run workflow"

**Pipeline Steps**:
1. Checkout code
2. npm ci && npm run build
3. Authenticate via WIF
4. Deploy Firestore rules & indexes
5. Build & deploy Cloud Functions
6. Deploy Firebase Hosting
7. Wait 30s for propagation
8. Health check (HTTP 200/301/302)
9. Summary output

**Rollback Protocol**:
```bash
# Firestore rules (revert to previous commit)
git checkout HEAD~1 -- firestore.rules
firebase deploy --only firestore:rules

# Cloud Functions (redeploy previous version)
git checkout HEAD~1 -- functions/
cd functions && npm ci && npm run build && cd ..
firebase deploy --only functions

# Hosting (use Firebase Console rollback)
# Or redeploy previous commit
git checkout HEAD~1
npm ci && npm run build
firebase deploy --only hosting
```

### Monitoring & Alerting

**Dashboards**:
- **Firebase Console**: https://console.firebase.google.com/project/hustleapp-production
  - Auth > Users (user count, verification rate)
  - Firestore > Usage (reads, writes, deletes)
  - Hosting > Release History
  - Performance > Dashboard (Core Web Vitals)
- **GCP Console**: https://console.cloud.google.com/logs/query?project=hustleapp-production
  - Logging > Logs Explorer (structured logs)
  - Error Reporting > Dashboard
  - Cloud Functions > Dashboard

**SLIs/SLOs**:
| Indicator | Target | Measurement |
|-----------|--------|-------------|
| Availability | 99.9% | Firebase Hosting uptime |
| Latency (P95) | < 2s | Firebase Performance |
| Error Rate | < 1% | Cloud Error Reporting |
| Auth Success | > 98% | Firebase Auth metrics |

**Alerting** (Recommended - Not Yet Configured):
- Cloud Monitoring alert: Error rate > 5% over 5 minutes
- Cloud Monitoring alert: Latency P95 > 5s
- Email notification on Cloud Function failures
- Slack webhook on deployment failures

### Incident Response

| Severity | Definition | Response Time | Roles | Communication |
|----------|------------|---------------|-------|---------------|
| P0 | Complete outage (site unreachable) | Immediate | DevOps, CTO | Status page, Slack |
| P1 | Critical degradation (auth broken, data loss risk) | 15 minutes | DevOps, Backend | Slack, Email |
| P2 | Partial impact (slow performance, minor features broken) | 1 hour | Backend | Slack |
| P3 | Minor issues (cosmetic bugs, edge cases) | Next business day | Frontend | GitHub Issue |

**Incident Playbook (P0/P1)**:
1. **Acknowledge**: Claim incident in Slack
2. **Assess**: Check Firebase Console, GCP Logs, Error Reporting
3. **Communicate**: Post status update
4. **Mitigate**: Rollback if needed, apply hotfix
5. **Resolve**: Verify fix, update status
6. **Post-mortem**: Document within 24 hours

### Backup & Recovery

**Firestore Backups**:
```bash
# Manual export to GCS
gcloud firestore export gs://hustleapp-production-backups/$(date +%Y%m%d)

# Schedule via Cloud Scheduler (recommended)
gcloud scheduler jobs create http firestore-backup-daily \
  --schedule="0 3 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/hustleapp-production/databases/(default)/exportDocuments" \
  --http-method=POST \
  --oidc-service-account-email=firestore-backup-sa@hustleapp-production.iam.gserviceaccount.com
```

**Recovery Procedures**:
```bash
# Import from backup
gcloud firestore import gs://hustleapp-production-backups/20251229

# Point-in-time recovery (Firestore PITR - requires Pro plan)
# Configure in Firebase Console > Firestore > Settings
```

**RPO/RTO Targets**:
| Data Type | RPO | RTO | Backup Strategy |
|-----------|-----|-----|-----------------|
| User data | 24h | 4h | Daily GCS export |
| Player data | 24h | 4h | Daily GCS export |
| Game data | 24h | 4h | Daily GCS export |
| Auth state | 0 | 0 | Firebase Auth managed |
| Billing state | 0 | 0 | Stripe managed |

---

## 7. Security, Compliance & Access

### Identity & Access Management

| Account/Role | Purpose | Permissions | Provisioning | MFA | Used By |
|--------------|---------|-------------|--------------|-----|---------|
| Firebase Project Admin | Full Firebase access | roles/firebase.admin | Manual | Required | Core team |
| WIF Service Account | CI/CD deployments | Custom role (deploy) | Terraform | N/A | GitHub Actions |
| Cloud Functions SA | Runtime identity | roles/aiplatform.user, roles/datastore.user | Automatic | N/A | Functions |
| Firestore Client | End-user access | Security rules | Firebase Auth | Optional | Users |

**Workload Identity Federation (WIF)**:
- **Provider**: `projects/*/locations/global/workloadIdentityPools/github-actions/providers/github`
- **Service Account**: Stored in GitHub Secrets as `WIF_SERVICE_ACCOUNT`
- **Benefits**: No service account keys, short-lived tokens, audit trail
- **Configuration**: `secrets.WIF_PROVIDER`, `secrets.WIF_SERVICE_ACCOUNT`

### Secrets Management

**Storage Locations**:
| Secret Type | Location | Rotation Policy | Audit |
|-------------|----------|-----------------|-------|
| Firebase Admin Key | GitHub Secrets + .env.local | Annual | GitHub Audit Log |
| Stripe Keys | GitHub Secrets + .env.local | Annual | Stripe Dashboard |
| Resend API Key | GitHub Secrets + .env.local | Annual | Resend Dashboard |
| WIF Provider | GitHub Secrets | N/A | GCP IAM Audit |
| Smoke Test Creds | GitHub Secrets | On incident | GitHub Audit Log |

**GitHub Secrets Required**:
```
FIREBASE_PROJECT_ID        - hustleapp-production
FIREBASE_CLIENT_EMAIL      - Service account email
FIREBASE_PRIVATE_KEY       - Service account private key (multiline)
WIF_PROVIDER               - Workload Identity Provider
WIF_SERVICE_ACCOUNT        - WIF service account email
SMOKE_TEST_EMAIL           - E2E test user email
SMOKE_TEST_PASSWORD        - E2E test user password
SYNTHETIC_QA_BASE_URL      - Base URL for E2E tests
STRIPE_SECRET_KEY          - Stripe API key
```

**Break-glass Procedure**:
1. Access Firebase Console directly (bypassing CI/CD)
2. Generate temporary service account key
3. Deploy manually: `firebase deploy --token $(gcloud auth print-access-token)`
4. Rotate service account key after incident

### Security Posture

**Authentication**:
- Firebase Auth with email/password provider
- Email verification required for dashboard access
- Session cookies (`__session`, `firebase-auth-token`)
- Middleware protection for `/dashboard/*` and `/api/*` routes

**Authorization**:
- Firestore Security Rules enforce data ownership
- Users can only access own data (`isOwner(userId)`)
- Email verification required for write operations
- Workspace membership for team access (future)

**Firestore Security Rules**:
```javascript
// Key rules from firestore.rules
match /users/{userId} {
  allow read: if isOwner(userId);
  allow create: if isAuthenticated() && isOwner(userId);
  allow update: if isOwner(userId) && emailVerified();
  allow delete: if isOwner(userId); // COPPA compliance
}

match /users/{userId}/players/{playerId} {
  allow read: if isOwner(userId);
  allow write: if isOwner(userId) && emailVerified();
}
```

**Data Protection**:
- All data encrypted at rest (Google-managed)
- TLS 1.3 for data in transit
- No PII stored in logs
- COPPA-compliant parent/guardian verification

**Network Security**:
- Firebase Hosting on Google's CDN
- Cloud Run with default Anthos networking
- No public IP addresses for compute
- API rate limiting via Cloud Functions

**Known Vulnerabilities** (from npm audit):
| Package | Severity | Issue | Fix Available |
|---------|----------|-------|---------------|
| next | **CRITICAL** | Command injection via server-side middleware | Yes - upgrade |
| jws | HIGH | HMAC signature verification bypass | Yes - update |
| glob | HIGH | Command injection via CLI | Yes - fix |
| js-yaml | MODERATE | Prototype pollution | Yes - fix |

**Recommended Immediate Actions**:
1. Run `npm audit fix` to apply automatic fixes
2. Upgrade Next.js to 15.5.8+ to resolve critical CVE
3. Test thoroughly after dependency updates
4. Consider Snyk or Dependabot for continuous monitoring

### COPPA Compliance

**Implementation**:
- Parent/guardian checkbox on registration
- `isParentGuardian` field in user document
- `agreedToTerms`, `agreedToPrivacy` with timestamps
- Data deletion capability (Firestore cascade delete)
- No direct communication with minors
- No third-party ad tracking

**Audit Trail**:
- `termsAgreedAt`, `privacyAgreedAt` timestamps
- Firestore document history (via Cloud Logging)
- Stripe billing events for consent to charge

---

## 8. Cost & Performance

### Current Costs (Estimated Monthly)

**Google Cloud Platform**:
| Service | Current | Notes |
|---------|---------|-------|
| Firebase Auth | $0 | Free tier (50K MAU) |
| Firestore | $0-10 | Free tier (1GB storage, 50K reads/day) |
| Firebase Hosting | $0 | Free tier (10GB bandwidth) |
| Cloud Functions | $0-5 | Free tier (2M invocations) |
| Firebase Storage | $0-5 | Free tier (5GB) |
| Cloud Logging | $0-25 | First 50GB free |
| Cloud Run | $0-20 | Free tier (2M requests) |
| **GCP Subtotal** | **$0-65** | |

**Third-Party Services**:
| Service | Current | Notes |
|---------|---------|-------|
| Resend | $0 | Free tier (3K emails/month) |
| Stripe | Variable | 2.9% + $0.30 per transaction |
| GitHub Actions | $0 | Free tier (2K minutes/month) |
| **Third-Party Subtotal** | **$0-10** | |

**Total Estimated Monthly Cost**: **$0-75** at current scale (57 users)

### Projected Costs

| Scale | Monthly Est. | Assumptions |
|-------|--------------|-------------|
| 100 users | $50-100 | Within free tiers |
| 1,000 users | $150-300 | Firestore $50, Functions $50, Storage $50 |
| 10,000 users | $500-1,000 | Firestore $200, Functions $150, Storage $150 |
| 100,000 users | $3,000-5,000 | Production-grade infrastructure |

### Performance Baseline

**Current Metrics** (from Firebase Performance):
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP (Largest Contentful Paint) | ~1.5s | < 2.5s | **Good** |
| FID (First Input Delay) | ~50ms | < 100ms | **Good** |
| CLS (Cumulative Layout Shift) | ~0.05 | < 0.1 | **Good** |
| Dashboard Load (P95) | ~1.5s | < 2s | **Good** |
| API Response (P95) | ~300ms | < 500ms | **Good** |
| Firestore Query (P95) | ~200ms | < 500ms | **Good** |

**Load Testing** (Not Yet Performed):
- Recommended: k6 or Artillery for load testing
- Target: 100 concurrent users without degradation
- Test scenarios: Registration, game logging, dashboard load

### Optimization Opportunities

| Optimization | Est. Impact | Effort | Priority |
|--------------|-------------|--------|----------|
| Enable Firestore caching | -20% query latency | Low | Medium |
| Implement ISR for landing page | -50% TTFB | Medium | Medium |
| Optimize bundle splitting | -30% initial load | Medium | Medium |
| Edge caching for static assets | -40% global latency | Low | Low |
| Connection pooling for Functions | -30% cold starts | Medium | Medium |

---

## 9. Development Workflow

### Local Development

**Standard Environment**:
- macOS 14+ or Ubuntu 22.04+
- Node.js 20 LTS (via nvm)
- npm 10+
- VS Code with extensions: ESLint, Prettier, Tailwind CSS IntelliSense
- Git 2.40+

**Bootstrap Script**:
```bash
#!/bin/bash
# setup-dev.sh

# Install nvm if not present
if ! command -v nvm &> /dev/null; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  source ~/.nvm/nvm.sh
fi

# Install Node.js 20
nvm install 20
nvm use 20

# Install global tools
npm install -g firebase-tools

# Install project dependencies
npm ci

# Copy environment template
cp .env.example .env.local
echo "Edit .env.local with your credentials"

# Run type check
npx tsc --noEmit

echo "Development environment ready!"
echo "Run: npm run dev"
```

**Common Tasks**:
```bash
# Start development server
npm run dev

# Type check without build
npx tsc --noEmit

# Lint and auto-fix
npm run lint
npm run lint -- --fix

# Run all tests
npm test

# Run specific test file
npx vitest run src/lib/billing/plan-limits.test.ts
npx playwright test 03-Tests/e2e/01-authentication.spec.ts

# Build production bundle
npm run build

# Preview production build
npm run start
```

### CI/CD Pipeline

**Platform**: GitHub Actions

**Pipeline Stages**:
```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Checkout  │ → │    Build     │ → │    Test      │ → │   Deploy     │
│   Setup     │   │   Lint       │   │   Unit       │   │   Staging    │
│   Cache     │   │   TypeCheck  │   │   E2E        │   │   Prod       │
└─────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

**Triggers**:
| Branch/Event | Actions |
|--------------|---------|
| PR to main | ci.yml (lint, build, test) |
| Push to main | ci.yml + deploy-firebase.yml |
| Tag push | release.yml |
| Manual | deploy-prod.yml, synthetic-qa.yml |

**Artifacts**:
- Playwright HTML report (14 days retention)
- Test results on failure
- Docker image (ghcr.io)

### Code Quality

**Linting**:
- ESLint 9 with flat config (`eslint.config.mjs`)
- Next.js ESLint config (`eslint-config-next`)
- Rules: TypeScript strict, React hooks, import order

**Static Analysis**:
- TypeScript strict mode
- Zod runtime validation
- npm audit for security vulnerabilities

**Code Review**:
- PR required for main branch
- CI must pass
- Gemini code review (optional)
- Squash merge enforced

**Test Coverage**:
- Unit tests: Vitest with Testing Library
- E2E tests: Playwright (7 test files)
- Coverage target: 80% for critical paths
- Visual regression: Playwright snapshots

---

## 10. Dependencies & Supply Chain

### Direct Dependencies (package.json)

**Production Dependencies** (45 packages):
| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| next | 15.5.4 | React framework | **CRITICAL CVE** |
| react | 19.1.0 | UI library | Low |
| firebase | 12.5.0 | Client SDK | Low |
| firebase-admin | 13.6.0 | Server SDK | Medium (jws CVE) |
| stripe | 19.3.1 | Billing | Low |
| zod | 4.1.11 | Validation | Low |
| zustand | 5.0.8 | State management | Low |
| @radix-ui/* | Various | UI primitives | Low |
| recharts | 3.2.1 | Charts | Low |
| resend | 6.1.2 | Email | Low |
| tailwind-merge | 3.3.1 | CSS utilities | Low |

**Dev Dependencies** (24 packages):
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | 5.x | Type checking |
| vitest | 3.2.4 | Unit testing |
| @playwright/test | 1.56.0 | E2E testing |
| @testing-library/* | Various | Test utilities |
| tailwindcss | 3.4.18 | Styling |
| eslint | 9.x | Linting |

### Third-Party Services

| Service | Purpose | Data Shared | Auth Method | SLA | Contract | Owner |
|---------|---------|-------------|-------------|-----|----------|-------|
| Firebase Auth | Authentication | Email, password hash | API key | 99.95% | Firebase ToS | Platform |
| Firestore | Database | All app data | API key | 99.99% | Firebase ToS | Platform |
| Stripe | Billing | Email, payment info | API key | 99.9% | Stripe ToS | Billing |
| Resend | Email | Email addresses | API key | 99.9% | Resend ToS | DevOps |
| GitHub | Source control | Code | OAuth | 99.9% | GitHub ToS | DevOps |
| GCP | Infrastructure | Logs, metrics | WIF | 99.95% | GCP ToS | DevOps |

### Vulnerability Management

**Current Status** (npm audit):
```
found 4 vulnerabilities (1 moderate, 2 high, 1 critical)
```

**Action Plan**:
1. **Immediate**: Upgrade Next.js to 15.5.8+ (critical)
2. **This Week**: Run `npm audit fix` for automatic fixes
3. **Ongoing**: Enable Dependabot for automated PRs
4. **Monthly**: Manual dependency review

---

## 11. Integration with Existing Documentation

### Documentation Inventory

| Document | Location | Status | Last Updated |
|----------|----------|--------|--------------|
| README.md | /README.md | Current | Nov 2025 |
| CLAUDE.md | /CLAUDE.md | Current | Dec 2025 |
| AGENTS.md | /AGENTS.md | Current | Nov 2025 |
| CHANGELOG.md | /CHANGELOG.md | Current | Nov 2025 |
| 000-docs/ | /000-docs/ | 294 files | Ongoing |
| Vertex Agents README | /vertex-agents/README.md | Current | Nov 2025 |
| Mobile Setup | /000-docs/257-DR-GUID-mobile-app-setup-guide.md | Current | Dec 2025 |

### Key Reference Documents

**Architecture & Design**:
- `000-docs/034-AT-ADEC-system-architecture.md` - System architecture decisions
- `000-docs/254-AA-AUDT-appaudit-devops-playbook.md` - Previous DevOps audit
- `000-docs/256-AT-ARCH-react-native-offline-sync-strategy.md` - Mobile architecture

**Billing & Workspaces**:
- `000-docs/6767-REF-hustle-billing-and-workspaces-canonical.md` - Billing reference
- `000-docs/6770-REF-hustle-customer-portal.md` - Customer portal guide
- `000-docs/6772-REF-hustle-plan-change-flow.md` - Plan change flow

**Agent System**:
- `000-docs/6775-AA-AUDT-adk-compliance-gap-analysis.md` - ADK compliance gaps
- `000-docs/6781-AT-ARCH-adk-docs-crawl-pipeline.md` - Crawler architecture

**QA & Testing**:
- `000-docs/252-PP-PLAN-synthetic-qa-harness-implementation.md` - QA harness plan
- `000-docs/253-OD-GUID-human-qa-test-guide.md` - Manual QA guide

### Documentation Gaps

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| API documentation | Developer friction | Generate OpenAPI spec from routes |
| Runbook library | Incident response | Create incident playbooks |
| ADR log | Architecture decisions | Formalize decision records |
| Onboarding guide | New dev ramp-up | Create week-1 checklist |

### Recommended Reading Order (New DevOps Engineer)

1. **This document** - Comprehensive system overview
2. **CLAUDE.md** - Project context and commands
3. **AGENTS.md** - Coding standards
4. **README.md** - User-facing documentation
5. **000-docs/254-AA-AUDT-appaudit-devops-playbook.md** - Previous audit
6. **vertex-agents/README.md** - Agent system
7. **000-docs/252-PP-PLAN-synthetic-qa-harness-implementation.md** - QA infrastructure

---

## 12. Current State Assessment

### What's Working Well

**Infrastructure** (Score: 8/10):
- Workload Identity Federation eliminates key management risk
- Firebase platform provides managed reliability
- GitHub Actions pipelines are well-structured
- Terraform modules enable consistent provisioning
- Docker build produces slim, secure images

**Application** (Score: 7/10):
- Next.js 15 with App Router is modern and performant
- TypeScript strict mode catches errors early
- Zod validation provides runtime safety
- Firestore security rules enforce data ownership
- Billing integration with Stripe is comprehensive

**Testing** (Score: 6/10):
- Playwright E2E tests cover critical journeys
- Vitest unit tests for business logic
- Visual regression capability exists
- Synthetic QA workflow defined (pending secrets)

**Documentation** (Score: 8/10):
- 294 documents in 000-docs/
- CLAUDE.md provides excellent AI context
- Changelog is well-maintained
- Previous appaudit provides baseline

### Areas Needing Attention

**Security** (Urgency: CRITICAL):
- Next.js critical CVE requires immediate upgrade
- JWS vulnerability in multiple Google packages
- npm audit shows 4 vulnerabilities
- No security scanning in CI pipeline

**CI/CD** (Urgency: HIGH):
- Synthetic QA blocked by missing GitHub Secrets
- No automated security scanning (Snyk, Dependabot)
- E2E tests run on every PR (slow feedback)
- No staging environment separate from production

**Monitoring** (Urgency: MEDIUM):
- No alerting configured
- No SLO dashboards
- Error budget not tracked
- On-call rotation not established

**Agent System** (Urgency: MEDIUM):
- Vertex AI agents defined but not deployed
- RAG integration incomplete
- Cloud Functions are stubs
- A2A protocol not fully utilized

**Mobile** (Urgency: LOW):
- App Store submission pending
- Offline sync not fully implemented
- No CI/CD for mobile builds
- EAS Build not configured

### Immediate Priorities

| Priority | Issue | Impact | Action | Owner | Timeline |
|----------|-------|--------|--------|-------|----------|
| **1** | Next.js Critical CVE | Security breach risk | Upgrade to 15.5.8+ | DevOps | Immediate |
| **2** | npm audit vulnerabilities | Security risk | Run npm audit fix | DevOps | This week |
| **3** | Synthetic QA secrets | QA blocked | Configure 9 GitHub Secrets | DevOps | This week |
| **4** | Enable Dependabot | Supply chain security | Enable in repo settings | DevOps | This week |
| **5** | Alerting setup | Incident detection | Configure Cloud Monitoring alerts | DevOps | Week 2 |
| **6** | Vertex AI agent deployment | Feature completion | Deploy agents to Agent Engine | AI Team | Month 1 |
| **7** | Mobile App Store prep | Market reach | Complete submission checklist | Mobile | Q1 2026 |

---

## 13. Quick Reference

### Operational Command Map

| Capability | Command | Notes |
|------------|---------|-------|
| **Local Dev** | `npm run dev` | Turbopack on localhost:3000 |
| **Type Check** | `npx tsc --noEmit` | Non-blocking type validation |
| **Lint** | `npm run lint` | ESLint flat config |
| **Unit Tests** | `npm run test:unit` | Vitest |
| **E2E Tests** | `npm run test:e2e` | Playwright headless |
| **E2E Debug** | `npm run test:e2e:debug` | Playwright with inspector |
| **Build** | `npm run build` | Production Turbopack build |
| **Deploy Staging** | Push to main | Automatic via CI |
| **Deploy Prod** | Actions > Deploy to Production | Type "DEPLOY" |
| **View Logs** | `firebase functions:log` | Cloud Functions logs |
| **Firestore Export** | `gcloud firestore export gs://bucket/` | Manual backup |
| **Security Audit** | `npm audit` | Check vulnerabilities |
| **Mobile Dev** | `cd mobile && npm start` | Expo development |

### Critical Endpoints & Resources

**Production URLs**:
- **Web App**: https://hustlestats.io
- **Firebase Hosting**: https://hustleapp-production.web.app
- **Health Check**: https://hustlestats.io/api/health

**Staging URLs**:
- **Cloud Run**: (not configured separately)

**Consoles**:
- **Firebase**: https://console.firebase.google.com/project/hustleapp-production
- **GCP**: https://console.cloud.google.com/home/dashboard?project=hustleapp-production
- **GitHub**: https://github.com/jeremylongshore/hustle
- **Stripe**: https://dashboard.stripe.com
- **Resend**: https://resend.com/emails

**Documentation**:
- **GitHub Pages**: https://jeremylongshore.github.io/hustle/
- **Internal Docs**: /000-docs/ (294 files)

### First-Week Checklist (New DevOps Engineer)

**Day 1: Access & Environment**
- [ ] GitHub repository access (push to main)
- [ ] GCP project access (hustleapp-production)
- [ ] Firebase Console access
- [ ] Stripe Dashboard access (test mode)
- [ ] Local development environment running
- [ ] Run `npm run dev` successfully

**Day 2: Codebase Orientation**
- [ ] Read CLAUDE.md, AGENTS.md, README.md
- [ ] Read this appaudit document
- [ ] Explore src/ directory structure
- [ ] Review firestore.rules
- [ ] Review .github/workflows/

**Day 3: CI/CD Understanding**
- [ ] Trigger CI pipeline with test PR
- [ ] Review CI logs and artifacts
- [ ] Understand WIF authentication
- [ ] Review deploy-firebase.yml workflow

**Day 4: Testing & QA**
- [ ] Run unit tests locally
- [ ] Run E2E tests locally (debug mode)
- [ ] Review Playwright configuration
- [ ] Configure missing GitHub Secrets (with access)

**Day 5: Operations & Monitoring**
- [ ] Access Cloud Logging
- [ ] Review Firebase Performance dashboard
- [ ] Review Error Reporting
- [ ] Create first improvement ticket

---

## 14. Recommendations Roadmap

### Week 1 - Critical Security & Stabilization

**Goals**:
1. Resolve critical security vulnerabilities
2. Enable Synthetic QA pipeline
3. Establish baseline monitoring

**Tasks**:
| Task | Owner | Deliverable | Success Metric |
|------|-------|-------------|----------------|
| Upgrade Next.js to 15.5.8+ | DevOps | PR merged | npm audit clean |
| Run npm audit fix | DevOps | PR merged | 0 high/critical vulns |
| Configure 9 GitHub Secrets | DevOps | Secrets set | Synthetic QA runs |
| Enable Dependabot | DevOps | .github/dependabot.yml | PRs auto-created |
| Document current state | DevOps | Updated CHANGELOG | Team notified |

**Dependencies**: GitHub admin access, GCP access

### Month 1 - Foundation & Visibility

**Goals**:
1. Establish monitoring and alerting
2. Separate staging environment
3. Complete agent system MVP

**Tasks**:
| Task | Owner | Deliverable | Success Metric |
|------|-------|-------------|----------------|
| Configure Cloud Monitoring alerts | DevOps | 5 alert policies | Alerts firing |
| Create Grafana dashboard (optional) | DevOps | Dashboard URL | Team access |
| Create separate staging project | DevOps | hustleapp-staging | Deploys working |
| Deploy Vertex AI agents | AI Team | Agent endpoints | A2A protocol working |
| Implement Firestore backups | DevOps | Scheduled job | Daily exports |
| Create incident runbooks | DevOps | 3 runbooks | Published in 000-docs |

**Dependencies**: Budget approval for staging, AI team capacity

### Quarter 1 - Strategic Enhancements

**Goals**:
1. Mobile app in App Store
2. Full agent RAG integration
3. Performance optimization

**Tasks**:
| Task | Owner | Deliverable | Success Metric |
|------|-------|-------------|----------------|
| Mobile App Store submission | Mobile | App published | 100+ downloads |
| Agent RAG integration | AI Team | Agents using knowledge base | Query latency < 2s |
| Performance optimization | Frontend | Core Web Vitals green | LCP < 1.5s |
| Load testing | DevOps | k6 test suite | 100 concurrent users |
| API documentation | Backend | OpenAPI spec | Docs published |
| On-call rotation | DevOps | PagerDuty configured | Team coverage |

**Dependencies**: Mobile team capacity, AI team capacity

### System Health Score

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Security | 5/10 | 25% | 1.25 |
| Reliability | 7/10 | 20% | 1.40 |
| Performance | 8/10 | 15% | 1.20 |
| Observability | 5/10 | 15% | 0.75 |
| Documentation | 8/10 | 10% | 0.80 |
| CI/CD | 7/10 | 10% | 0.70 |
| Code Quality | 7/10 | 5% | 0.35 |
| **Total** | | 100% | **6.45/10** |

**Interpretation**: System is functional but has critical security gaps that require immediate attention. Once security issues are resolved, the score should improve to 7.5+/10.

---

## Appendices

### Appendix A. Glossary

| Term | Definition |
|------|------------|
| A2A | Agent-to-Agent protocol for Vertex AI multi-agent coordination |
| ADK | Google Agent Development Kit |
| COPPA | Children's Online Privacy Protection Act |
| DFS | Document Filing System v2.0 (NNN-CC-ABCD-desc.md naming) |
| E2E | End-to-end testing |
| ECNL | Elite Clubs National League (youth soccer) |
| MLS Next | Major League Soccer youth development pathway |
| RAG | Retrieval-Augmented Generation |
| SSR | Server-Side Rendering |
| USYS | US Youth Soccer |
| WIF | Workload Identity Federation |

### Appendix B. Reference Links

| Resource | URL |
|----------|-----|
| Firebase Console | https://console.firebase.google.com/project/hustleapp-production |
| GCP Console | https://console.cloud.google.com/home/dashboard?project=hustleapp-production |
| GitHub Repository | https://github.com/jeremylongshore/hustle |
| GitHub Actions | https://github.com/jeremylongshore/hustle/actions |
| Production App | https://hustlestats.io |
| GitHub Pages | https://jeremylongshore.github.io/hustle/ |
| Stripe Dashboard | https://dashboard.stripe.com |
| Resend Dashboard | https://resend.com/emails |
| Cloud Logging | https://console.cloud.google.com/logs/query?project=hustleapp-production |
| Error Reporting | https://console.cloud.google.com/errors?project=hustleapp-production |
| Firebase Performance | https://console.firebase.google.com/project/hustleapp-production/performance |

### Appendix C. Troubleshooting Playbooks

**Login Not Working**:
1. Check Firebase Auth console for user status
2. Verify email verification completed
3. Check Cloud Logging for auth errors
4. Test with fresh incognito browser
5. Clear cookies and retry

**Deployment Failed**:
1. Check GitHub Actions logs
2. Verify WIF secrets are configured
3. Check firebase deploy permissions
4. Verify build succeeds locally
5. Check Firebase Console for quota issues

**Data Not Syncing**:
1. Check Firestore security rules
2. Verify user is authenticated
3. Check browser console for errors
4. Verify network connectivity
5. Check Firestore console for write errors

**High Error Rate**:
1. Check Cloud Error Reporting
2. Identify error pattern
3. Check recent deployments
4. Review Cloud Function logs
5. Rollback if necessary

### Appendix D. Change Management

**Release Process**:
1. Create feature branch from main
2. Develop with local testing
3. Create PR with description
4. CI pipeline runs automatically
5. Code review and approval
6. Squash merge to main
7. Staging deployment (automatic)
8. Manual production deployment (if ready)

**CAB Process** (for production):
1. Document change in PR description
2. Include rollback plan
3. Notify team in Slack
4. Get approval from tech lead
5. Deploy during low-traffic window
6. Monitor for 30 minutes post-deploy

### Appendix E. Open Questions

| Question | Impact | Owner | Due Date |
|----------|--------|-------|----------|
| Separate staging GCP project? | Cost vs isolation trade-off | CTO | Week 2 |
| On-call rotation tool? | Incident response | DevOps | Month 1 |
| Mobile App Store timeline? | Revenue impact | Product | Q1 2026 |
| Agent Engine pricing? | Budget planning | Finance | Month 1 |
| Multi-region deployment? | Latency for global users | DevOps | Q2 2026 |

---

*Document ID: 261-AA-AUDT-appaudit-devops-playbook.md*
*Generated by Intent Solutions Senior Cloud Architect*
*Version: 2.0.0*
*Next Review: Q1 2026*
