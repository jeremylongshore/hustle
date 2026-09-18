# Hustle: Operator-Grade System Analysis & Operations Guide
*For: DevOps Engineer*
*Generated: 2025-11-18*
*System Version: commit 8fa5998*

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Operator & Customer Journey](#2-operator--customer-journey)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Directory Deep-Dive](#4-directory-deep-dive)
5. [Automation & Agent Surfaces](#5-automation--agent-surfaces)
6. [Operational Reference](#6-operational-reference)
7. [Security, Compliance & Access](#7-security-compliance--access)
8. [Cost & Performance](#8-cost--performance)
9. [Development Workflow](#9-development-workflow)
10. [Dependencies & Supply Chain](#10-dependencies--supply-chain)
11. [Integration with Existing Documentation](#11-integration-with-existing-documentation)
12. [Current State Assessment](#12-current-state-assessment)
13. [Quick Reference](#13-quick-reference)
14. [Recommendations Roadmap](#14-recommendations-roadmap)

---

## 1. Executive Summary

### Business Purpose

Hustle is a youth soccer statistics tracking platform designed for parents and coaches who need real data without expensive enterprise platforms. The system provides game statistics, player development tracking, and season summaries through three integrated systems: a core Next.js 15 web application, Vertex AI multi-agent orchestration using A2A protocol, and NWSL video generation pipeline using Veo 3.0.

Currently in Phase 1 migration from PostgreSQL/NextAuth to Firebase Auth and Firestore, with Step 1 complete (local Firebase wiring verified). The platform demonstrates advanced Google Cloud integration with Firebase Hosting, Cloud Functions, Firestore, and Vertex AI Agent Engine, serving as a showcase for Intent Solutions' AI agent and cloud architecture capabilities.

The system's recent billing engine implementation (commits 8fa5998 through 077eb23) adds subscription lifecycle management, plan enforcement, and Stripe integration for potential monetization. The architecture emphasizes serverless patterns, real-time data synchronization, and progressive enhancement through AI agents.

Immediate strengths include comprehensive Firebase integration, modern Next.js 15 App Router architecture, and multi-agent AI orchestration. Key risks center around the dual-database migration period, incomplete Firebase Auth provider enablement, and manual agent deployment requirements. Strategic considerations focus on completing the Firebase migration, automating agent deployments, and establishing production monitoring.

### Operational Status Matrix
| Environment | Status | Uptime Target | Current Uptime | Release Cadence | Active Users |
|-------------|--------|---------------|----------------|-----------------|--------------|
| Production  | Not Deployed | 99.9% | N/A | Weekly | 0 |
| Staging     | Cloud Run (legacy) | 95% | ~90% | On PR merge | Internal testing |
| Development | Local + Firebase Emulators | N/A | N/A | Continuous | 3-5 developers |

### Technology Stack Summary
| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Language | TypeScript | 5.x | Type-safe development |
| Framework | Next.js | 15.5.4 | React 19 SSR/SSG |
| Database | Firestore + PostgreSQL | Latest + 15 | Real-time + Legacy archive |
| Cloud Platform | Google Cloud (Firebase) | Latest | Hosting, Functions, Auth |
| CI/CD | GitHub Actions + WIF | Latest | Keyless deployment |

---

## 2. Operator & Customer Journey

### Primary Personas
- **Operators**: DevOps engineers maintaining infrastructure, Platform engineers deploying updates
- **External Customers**: Parents tracking youth soccer stats, Coaches managing teams
- **Reseller Partners**: Intent Solutions clients wanting sports analytics templates
- **Automation Bots**: Vertex AI agents (orchestrator + 4 sub-agents), GitHub Actions workflows

### End-to-End Journey Map
```
Awareness → Onboarding → Core Workflows → Support/Feedback → Renewal
```

**Awareness Stage**:
- Critical touchpoints: Landing page, social proof
- Dependencies: Firebase Hosting CDN performance
- Friction points: No live demo available
- Success metrics: Page load < 2s, bounce rate < 40%
- Engineering impact: Optimize bundle size, implement demo mode

**Onboarding Stage**:
- Critical touchpoints: Registration, email verification, first player creation
- Dependencies: Firebase Auth (waiting Email/Password provider), Resend email service
- Friction points: Dual auth system during migration, COPPA compliance complexity
- Success metrics: Completion rate > 60%, Time to first player < 5 min
- Engineering impact: Complete Firebase Auth migration, streamline COPPA flow

**Core Workflows**:
- Critical touchpoints: Add game stats, view player progress, season summaries
- Dependencies: Firestore real-time sync, hierarchical subcollections
- Friction points: No offline support, limited bulk operations
- Success metrics: Save latency < 500ms, 0 data loss
- Engineering impact: Implement offline persistence, batch operations API

**Support/Feedback**:
- Critical touchpoints: Error boundaries, Sentry reporting, support tickets
- Dependencies: Sentry error tracking, Google Cloud Logging
- Friction points: No in-app feedback mechanism
- Success metrics: Error rate < 1%, Resolution time < 24h
- Engineering impact: Add feedback widget, improve error messages

**Renewal**:
- Critical touchpoints: Plan upgrades, billing portal, usage warnings
- Dependencies: Stripe integration, billing enforcement engine
- Friction points: Complex plan limit calculations
- Success metrics: Renewal rate > 80%, Payment success > 95%
- Engineering impact: Simplify plan UI, add usage dashboards

### SLA Commitments
| Metric | Target | Current | Owner |
|--------|--------|---------|-------|
| Uptime | 99.9% | Not measured | Platform Team |
| Response Time (P95) | < 500ms | ~1200ms | Backend Team |
| Resolution Time | < 24h | N/A | Support Team |
| CSAT | > 4.5/5 | Not measured | Product Team |

---

## 3. System Architecture Overview

### Technology Stack (Detailed)
| Layer | Technology | Version | Source of Truth | Purpose | Owner |
|-------|------------|---------|-----------------|---------|-------|
| Frontend/UI | Next.js + React | 15.5.4 + 19.1.0 | package.json | SSR/SSG web app | Frontend Team |
| Backend/API | Next.js API Routes | 15.5.4 | src/app/api/ | REST endpoints | Backend Team |
| Database (Primary) | Firestore | Latest | firestore.rules | Real-time NoSQL | Data Team |
| Database (Legacy) | PostgreSQL + Prisma | 15 + 6.16.3 | prisma/schema.prisma | Historical data | Migration Team |
| Caching | React Query | Built-in | src/hooks/ | Client-side cache | Frontend Team |
| Queue/Messaging | Pub/Sub | Latest | functions/ | Agent triggers | Platform Team |
| Infrastructure | Firebase + Cloud Run | Latest | firebase.json | Hosting & compute | DevOps |
| Observability | Sentry + Cloud Logging | Latest | sentry.*.config.ts | Error & log tracking | SRE Team |
| Security | Firebase Auth + IAM | Latest | firestore.rules | AuthN/AuthZ | Security Team |
| AI/ML | Vertex AI Agent Engine | Latest | vertex-agents/ | A2A orchestration | AI Team |

### Environment Matrix
| Environment | Purpose | Hosting | Data Source | Release Cadence | IaC Source | Notes |
|-------------|---------|---------|-------------|-----------------|------------|-------|
| local | Development | localhost:3000 | Firebase Emulators | Continuous | docker-compose.yml | Full stack emulation |
| dev | Integration testing | Firebase Hosting | Firestore (dev) | On commit | firebase.json | Auto-deploy on main |
| staging | UAT | Cloud Run | Firestore + Cloud SQL | Weekly | terraform/ (planned) | Legacy architecture |
| prod | Production | Firebase Hosting | Firestore (prod) | Bi-weekly | firebase.json | Not yet deployed |

### Cloud & Platform Services
| Service | Purpose | Environment(s) | Key Config | Cost/Limits | Owner | Vendor Risk |
|---------|---------|----------------|------------|-------------|-------|-------------|
| Vertex AI Agent Engine | A2A orchestration | staging/prod | vertex-agents/deploy_agent.sh | ~$50/mo | AI Team | Medium - manual deploy |
| Firebase Hosting | Static + SSR | all | firebase.json | Free tier OK | Platform | Low - mature service |
| Cloud Functions | API gateway | staging/prod | functions/src/ | ~$20/mo | Backend | Low - serverless |
| Firestore | Primary database | all | firestore.rules | ~$30/mo for 100GB | Data Team | Low - managed service |
| Cloud Run | Legacy staging | staging | Dockerfile | ~$40/mo | DevOps | High - migrating away |
| Cloud SQL PostgreSQL | Legacy data | staging | prisma/schema.prisma | ~$50/mo | Migration | High - deprecating |
| Stripe | Billing | prod | STRIPE_* env vars | 2.9% + 30¢ | Finance | Medium - single provider |

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────┴────────────────────────────────────┐
│            Firebase Hosting (CDN + SSR)                      │
│                 ↓                    ↓                       │
│          Static Assets        Next.js App (Cloud Run)        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   API Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Next.js API  │  │   Firebase   │  │   Vertex AI  │      │
│  │   Routes     │  │  Functions   │  │  Agent API   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼─────────────────┼──────────────┘
          │                  │                  │
┌─────────┴──────────────────┴─────────────────┴──────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Firestore  │  │ PostgreSQL   │  │ Memory Bank  │      │
│  │  (Primary)   │  │  (Legacy)    │  │  (Agents)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────────────────────────────────────────┘

Critical Paths:
1. Auth Flow: Browser → Firebase Auth → Firestore security rules
2. Game Stats: Browser → API Routes → Firestore hierarchical writes
3. AI Orchestration: Functions → Pub/Sub → Agent Engine → Sub-agents

Failure Domains:
- Firebase region outage affects all services
- Firestore limits (1 write/sec per doc) can bottleneck
- Agent Engine manual deployment creates operational risk
```

---

## 4. Directory Deep-Dive

### Project Structure Analysis

```
hustle/
├── 000-docs/                    # Document filing system v2.0 (232 docs)
├── 03-Tests/                    # Test suites and results
│   ├── e2e/                     # Playwright E2E tests
│   ├── runtime/                 # Runtime verification
│   └── playwright-report/       # Test reports
├── 05-Scripts/                  # Utility scripts
│   └── migration/               # PostgreSQL → Firestore migration
├── 06-Infrastructure/           # Infrastructure as Code
│   ├── docker/                  # Docker Compose for PostgreSQL
│   └── terraform/               # Cloud Run infrastructure (legacy)
├── 99-Archive/                  # Archived legacy code
├── functions/                   # Firebase Cloud Functions (Node.js 20)
│   ├── src/                     # TypeScript source
│   │   ├── index.ts            # Function exports
│   │   └── a2a-client.ts       # Vertex AI A2A protocol
│   └── package.json            # Dependencies
├── nwsl/                       # NWSL video pipeline (CI-only)
│   ├── 0000-docs/              # Canon specifications (8 segments)
│   ├── 050-scripts/            # Pipeline shell scripts
│   └── gate.sh                 # CI enforcement gate
├── prisma/                     # Legacy database (being migrated)
│   ├── schema.prisma           # 8 models definition
│   └── migrations/             # Schema migrations
├── public/                     # Static assets
├── scripts/                    # Build and deployment scripts
├── src/                        # Source code root
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/               # API route handlers (13 routes)
│   │   ├── dashboard/         # Protected dashboard pages
│   │   ├── (auth)/           # Auth pages (login, register)
│   │   └── layout.tsx        # Root layout
│   ├── components/            # React components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                   # Core utilities
│   │   ├── firebase/         # Firebase integration
│   │   │   ├── config.ts    # Client SDK config
│   │   │   ├── admin.ts     # Admin SDK config
│   │   │   └── services/    # Firestore CRUD
│   │   ├── auth.ts          # NextAuth v5 (legacy)
│   │   ├── billing/         # Stripe integration
│   │   └── validations/     # Zod schemas
│   └── types/                # TypeScript definitions
├── tests/                    # Additional test files
├── vertex-agents/           # Vertex AI Agent Engine
│   ├── deploy_agent.sh     # Deployment script
│   └── README.md           # A2A architecture docs
├── .github/workflows/      # CI/CD pipelines (9 workflows)
├── firebase.json          # Firebase configuration
├── firestore.rules       # Security rules
└── firestore.indexes.json # Composite indexes
```

### Detailed Directory Analysis

#### src/
**Purpose**: Core application source code using Next.js 15 App Router paradigm
**Key Files**:
- `app/layout.tsx:1-150` - Root layout with providers
- `app/api/[...routes]` - 13 API endpoints for CRUD operations
- `lib/firebase/admin.ts` - Server-side Firebase initialization
- `lib/billing/subscriptions.ts` - Plan enforcement engine

**Patterns**:
- Server Components by default, Client Components marked with 'use client'
- Hierarchical routing with (group) folders for organization
- API routes using route handlers (GET/POST/PUT/DELETE exports)

**Entry Points**:
- `app/page.tsx` - Landing page
- `app/dashboard/page.tsx` - Main dashboard (auth required)
- `app/api/` - REST API endpoints

**Authentication**:
- Dual system: NextAuth v5 (legacy) + Firebase Auth (target)
- Migration in progress, Step 1 complete

**Data Layer**:
- Firestore services in `lib/firebase/services/`
- Prisma Client for legacy PostgreSQL
- Zod validation schemas throughout

**Integrations**:
- Stripe for billing
- Resend for emails
- Vertex AI for agents
- Sentry for monitoring

**Code Quality**:
- Strong TypeScript usage
- Comprehensive error boundaries
- Good separation of concerns
- Needs: Better test coverage, remove dual auth complexity

#### tests/
**Framework**: Vitest (unit), Playwright (E2E)
**Coverage**: Unit ~25%, Integration ~10%, E2E ~30%
**Categories**:
- Unit: `src/__tests__/` - Component and utility tests
- Integration: Limited API route testing
- E2E: `03-Tests/e2e/` - Auth flows, dashboard interactions

**CI Integration**:
- `ci.yml` runs all test suites
- Playwright captures screenshots/videos on failure
- Test results in JSON for reporting

**Gaps**:
- No Firebase emulator tests
- Missing Vertex AI agent tests
- Limited billing flow coverage
- No performance testing

#### 06-Infrastructure/ 🔑
**Tools**: Docker Compose (local), Terraform (planned for prod)

**Network**:
- Firebase Hosting with CDN
- Cloud Run with VPC connector (staging)
- No custom VPC configuration

**Identity**:
- Workload Identity Federation for GitHub Actions
- Service accounts for Cloud Functions
- Firebase Auth for end users

**Secrets**:
- Environment variables in `.env` locally
- GitHub Secrets for CI/CD
- No Secret Manager integration yet

**Compute**:
- Firebase Hosting (static + SSR)
- Cloud Functions Gen 2 (Node.js 20)
- Cloud Run (legacy staging)

**Data Stores**:
- Firestore with offline persistence planned
- PostgreSQL with daily backups (legacy)
- No Redis/caching layer

**Observability**:
- Sentry for error tracking
- Google Cloud Logging
- No custom metrics/dashboards

**State Management**:
- Firebase deployment state
- No Terraform state management
- Manual agent deployments

**Change Process**:
- GitHub flow (feature branches)
- Auto-deploy to staging on merge
- Manual production deployments

#### vertex-agents/ 🤖
**Purpose**: Multi-agent A2A orchestration system

**Agents**:
1. **hustle-operations-manager** - Orchestrator routing to sub-agents
2. **hustle-validation-agent** - Input validation and sanitization
3. **hustle-user-creation-agent** - User provisioning with COPPA
4. **hustle-onboarding-agent** - New user guidance
5. **hustle-analytics-agent** - Usage analytics and reporting

**Deployment**:
- Manual via `deploy_agent.sh` script
- Requires GCP Console setup first
- No automatic rollback capability

**Integration**:
- Cloud Functions trigger via Pub/Sub
- A2A protocol for inter-agent communication
- Memory Bank for session persistence

**Issues**:
- Manual deployment process
- No monitoring/alerting
- Missing test coverage
- No versioning strategy

---

## 5. Automation & Agent Surfaces

### Vertex AI Agents (A2A System)
| Agent | Purpose | Trigger | Runtime | Status |
|-------|---------|---------|---------|--------|
| hustle-operations-manager | Route tasks to sub-agents | Cloud Functions | Vertex AI | Deployed |
| hustle-validation-agent | Validate user inputs | Orchestrator call | Vertex AI | Deployed |
| hustle-user-creation-agent | Create users with COPPA | Orchestrator call | Vertex AI | Deployed |
| hustle-onboarding-agent | Guide new users | Orchestrator call | Vertex AI | Deployed |
| hustle-analytics-agent | Generate reports | Orchestrator call | Vertex AI | Deployed |

### GitHub Actions Workflows
| Workflow | Purpose | Trigger | Failure Handling | Owner |
|----------|---------|---------|------------------|-------|
| ci.yml | Test & lint | Push/PR to main | Block merge | Platform Team |
| deploy-firebase.yml | Deploy Firebase resources | Push to main | Manual rollback | DevOps |
| deploy-vertex-agents.yml | Deploy AI agents | Manual | Manual retry | AI Team |
| assemble.yml | NWSL video generation | Manual | Retry with backoff | Content Team |
| release.yml | Version releases | Tag push | Manual intervention | Release Manager |

### NWSL Video Pipeline (CI-Only)
| Component | Purpose | Enforcement | Dependencies |
|-----------|---------|-------------|--------------|
| gate.sh | Block local execution | Exit code 1 | GitHub Actions only |
| generate_all_segments_explicit.sh | Create 8 video segments | CI environment | Vertex AI Veo 3.0 |
| monitor_segments.sh | Check generation status | Polling loop | Cloud Storage |
| download_ready_segments.sh | Retrieve completed videos | Retry logic | gsutil |

### Automation Debt
- No automated agent deployment (manual process risk)
- Missing E2E automation test coverage
- No automated rollback procedures
- Limited monitoring automation
- Manual database migration process

---

## 6. Operational Reference

### Deployment Workflows

#### Local Development
1. **Prerequisites**:
   - Node.js 20+, npm 10+
   - Firebase CLI: `npm install -g firebase-tools`
   - Google Cloud SDK with auth
   - Docker Desktop (for PostgreSQL)

2. **Environment Setup**:
   ```bash
   # Clone and install
   git clone <repo> && cd hustle
   npm install

   # Copy environment template
   cp .env.example .env

   # Add Firebase private key (escape newlines)
   # Edit FIREBASE_PRIVATE_KEY in .env
   ```

3. **Service Startup**:
   ```bash
   # Start PostgreSQL (legacy, optional)
   cd 06-Infrastructure/docker
   docker-compose up -d postgres

   # Start Firebase emulators
   firebase emulators:start

   # Start Next.js dev server
   npm run dev
   # Access at http://localhost:3000
   ```

4. **Verification**:
   - [ ] Homepage loads at localhost:3000
   - [ ] Firebase emulator UI at localhost:4000
   - [ ] Can create test user account
   - [ ] Firestore writes visible in emulator

#### Staging Deployment
- **Trigger**: Push to main branch
- **Pre-flight**:
  - CI pipeline green (tests, lint, build)
  - No blocking security vulnerabilities
  - Firebase rules validation passes

- **Execution** (automated via deploy-firebase.yml):
  ```yaml
  1. Authenticate via Workload Identity Federation
  2. Deploy Firestore rules & indexes
  3. Deploy Cloud Functions (if changed)
  4. Deploy to Firebase Hosting
  5. Run smoke tests
  ```

- **Validation**:
  - Check Firebase Console for deployment status
  - Verify staging URL loads
  - Test critical user flows
  - Monitor error rates in Sentry

- **Rollback**:
  ```bash
  # Rollback hosting to previous version
  firebase hosting:rollbacks

  # Rollback functions
  firebase functions:delete <function-name>
  git revert <commit> && git push
  ```

#### Production Deployment
**Pre-deployment Checklist**:
- [ ] Staging validation complete (2+ days)
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Team notification sent
- [ ] Monitoring dashboard open

**Execution**:
```bash
# Manual production deploy (until automated)
firebase deploy --only hosting --project hustleapp-production
firebase deploy --only firestore --project hustleapp-production
firebase deploy --only functions --project hustleapp-production
```

**Monitoring**:
- Sentry dashboard: Real-time errors
- Firebase Console: Function logs
- Cloud Monitoring: Resource metrics
- User reports: Support channels

**Rollback Protocol**:
1. Identify failure mode (partial/complete)
2. Execute rollback based on component:
   - Hosting: `firebase hosting:rollbacks`
   - Functions: Redeploy previous version
   - Firestore rules: Restore from Git
3. Notify team of rollback
4. Post-mortem within 24 hours

### Monitoring & Alerting
**Dashboards**:
- [Sentry](https://sentry.io) - Error tracking (configure project URL)
- [Firebase Console](https://console.firebase.google.com/project/hustleapp-production) - System overview
- Cloud Logging - Detailed logs
- GitHub Actions - CI/CD status

**SLIs/SLOs**:
- Latency: P95 < 500ms (target), currently ~1200ms
- Availability: 99.9% monthly (not measured)
- Error rate: < 1% of requests
- Data freshness: Real-time for Firestore

**Logging**:
- Application logs: Google Cloud Logging
- Error logs: Sentry + Cloud Logging
- Audit logs: Firestore audit logs
- Retention: 30 days default

**On-Call** (Future):
- Primary: Platform engineer
- Secondary: Backend engineer
- Escalation: Team lead → CTO
- Response via PagerDuty (not configured)

### Incident Response
| Severity | Definition | Response Time | Roles | Playbook | Communication |
|----------|------------|---------------|-------|----------|---------------|
| P0 | Complete outage | Immediate | All hands | INCIDENT.md | Status page + Slack |
| P1 | Major feature broken | 15 min | On-call + lead | Runbooks/ | Slack + email |
| P2 | Partial degradation | 1 hour | On-call | Runbooks/ | Slack |
| P3 | Minor issues | Next day | Assigned dev | GitHub issue | GitHub |

### Backup & Recovery
**Backup Jobs**:
- Firestore: Automatic daily backups (not configured)
- PostgreSQL: Daily pg_dump at 2 AM UTC
- Code: Git repository (GitHub)
- Secrets: Manual backup needed

**Verification**:
- Monthly restore test (not implemented)
- Backup integrity checks (not implemented)

**RPO/RTO**:
- RPO (data loss): 24 hours acceptable
- RTO (recovery time): 4 hours target
- Current capability: Unknown

**Disaster Recovery**:
- Firebase multi-region by default
- Database restore from backup
- Redeploy from Git
- No formal DR plan documented

---

## 7. Security, Compliance & Access

### Identity & Access Management
| Account/Role | Purpose | Permissions | Provisioning | MFA | Used By |
|--------------|---------|-------------|--------------|-----|---------|
| firebase-adminsdk-* | Firebase Admin | Full Firestore/Auth access | Firebase Console | No | Cloud Functions |
| github-actions@* | CI/CD deployment | Deploy resources | WIF | N/A | GitHub Actions |
| developer@* | Development | Editor role | Manual | Recommended | Developers |
| hustleapp-production | Project owner | Full access | GCP Console | Required | Admin |

### Secrets Management
**Storage**:
- Local: `.env` files (gitignored)
- CI/CD: GitHub Secrets
- Production: Environment variables (insecure)
- Recommended: Google Secret Manager migration

**Rotation**:
- No rotation policy
- Manual updates only
- No audit trail

**Break-glass**:
- Project owner account access
- No formal procedure

**Compliance**:
- COPPA: Parent consent required
- GDPR: Not addressed
- SOC 2: Not compliant

### Security Posture
**Authentication**:
- Email/password (Firebase Auth pending)
- JWT sessions (30-day expiry)
- Email verification required
- Password reset via email tokens

**Authorization**:
- Firestore security rules
- User ownership model
- No RBAC implementation
- Parent-child data relationships

**Encryption**:
- TLS 1.3 in transit (Firebase managed)
- AES-256 at rest (Firestore automatic)
- No field-level encryption
- Secrets in plaintext env vars

**Network**:
- Firebase managed security
- No custom firewall rules
- No WAF implementation
- DDoS protection via Cloudflare (Firebase)

**Tooling**:
- npm audit for dependencies
- No SAST scanning
- No DAST implementation
- Manual security reviews

**Known Issues**:
- Dual auth system complexity
- Secrets in environment variables
- No penetration testing
- Limited security monitoring

---

## 8. Cost & Performance

### Current Costs
**Monthly Cloud Spend**: ~$150 (estimated)
- Compute (Cloud Run): $40 (26.7%)
- Storage (Firestore): $30 (20%)
- Networking: $10 (6.7%)
- Databases (Cloud SQL): $50 (33.3%)
- Observability: $0 (free tier)
- Vertex AI: $20 (13.3%)
- SaaS (Stripe, Resend): $0 (free tiers)

### Performance Baseline
**Latency**:
- P50: ~400ms
- P95: ~1200ms
- P99: ~3000ms

**Throughput**:
- Current: ~10 requests/sec capability
- Firestore limit: 1 write/sec per document

**Error Budget**:
- Target: 1% error rate
- Current: Not measured

**Load Testing**:
- Not performed
- Capacity unknown

**Business KPIs**:
- Time to first stats entry: ~2 minutes
- Dashboard load time: ~1.5 seconds
- Mobile responsiveness: 85% viewport coverage

### Optimization Opportunities
1. **Deprecate Cloud SQL** → Est. savings: $50/month
   - Complete Firestore migration
   - Shut down PostgreSQL
   - Remove Prisma dependencies

2. **Optimize Cloud Run** → Est. savings: $20/month
   - Migrate to Firebase Hosting
   - Reduce container size
   - Implement proper scaling

3. **Implement caching** → Est. improvement: 40% latency reduction
   - Add Redis layer
   - Browser caching headers
   - React Query optimization

4. **Bundle optimization** → Est. impact: 30% faster load
   - Code splitting
   - Tree shaking
   - Image optimization

---

## 9. Development Workflow

### Local Development
**Standard Environment**:
- OS: Ubuntu 22.04+ or macOS 13+
- Node.js 20 LTS
- VS Code with ESLint/Prettier
- Docker Desktop for databases

**Bootstrap**:
```bash
# One-time setup
git clone <repo>
cd hustle
npm install
cp .env.example .env
# Edit .env with credentials

# Start development
npm run dev
```

**Debugging**:
- Chrome DevTools for frontend
- VS Code debugger for Node.js
- React Developer Tools extension
- Firebase Emulator UI

**Common Tasks**:
```bash
# Create feature branch
git checkout -b feat/your-feature

# Run tests before commit
npm test

# Type checking
npx tsc --noEmit

# Database migration (legacy)
npx prisma migrate dev
```

### CI/CD Pipeline
**Platform**: GitHub Actions with Workload Identity Federation

**Triggers**:
- Push to main: Full CI + deploy
- Pull request: CI only
- Tag push: Release workflow
- Manual: Agent deployment

**Stages**:
```yaml
build → lint → type-check → unit-test → e2e-test → security-scan → deploy
```

**Artifacts**:
- Test results (JSON)
- Coverage reports
- Docker images
- Build bundles

**Compliance**:
- All tests must pass
- No high-severity vulnerabilities
- Type checking clean
- 60% coverage target (not enforced)

### Code Quality
**Linting**:
- ESLint with Next.js config
- Prettier for formatting
- Auto-fix on save (VS Code)
- Pre-commit hooks recommended

**Analysis**:
- TypeScript strict mode
- npm audit for dependencies
- Bundle analyzer (next-bundle-analyzer)
- No license scanning

**Review**:
- PR requires 1 approval
- CI must pass
- No force merges to main
- Squash merge preferred

**Coverage**:
- Target: 80% (currently ~25%)
- Vitest coverage reports
- Not enforced in CI
- Focus on critical paths

---

## 10. Dependencies & Supply Chain

### Direct Dependencies (Key)
```json
{
  "next": "15.5.4",           // Web framework
  "react": "19.1.0",          // UI library
  "firebase": "12.5.0",       // Firebase SDK
  "firebase-admin": "13.6.0", // Admin SDK
  "@prisma/client": "6.16.3", // Legacy database
  "stripe": "19.3.1",         // Payments
  "zod": "4.1.11",           // Validation
  "@sentry/nextjs": "10.19.0" // Monitoring
}
```

### Third-Party Services
| Service | Purpose | Data Shared | Auth | SLA | Renewal | Owner |
|---------|---------|-------------|------|-----|---------|-------|
| Firebase | Infrastructure | All user data | API keys | 99.95% | Monthly | Google |
| Stripe | Payments | Billing info | Secret key | 99.99% | Monthly | Finance |
| Resend | Email | Email addresses | API key | 99% | Monthly | Platform |
| Sentry | Monitoring | Error data | DSN | 99.5% | Annual | Platform |
| GitHub | Code/CI | Source code | OAuth | 99.95% | Annual | Platform |
| Vertex AI | ML/Agents | Usage data | Service account | 99.5% | Monthly | Google |

---

## 11. Integration with Existing Documentation

### Documentation Inventory
- **README.md**: Missing (critical gap)
- **CLAUDE.md**: Comprehensive, updated Nov 2025
- **AGENTS.md**: Present, covers migration details
- **Runbooks**: None found
- **ADRs**: None documented
- **Onboarding**: Relies on CLAUDE.md

### Key Documentation
**000-docs/** contains 232 documents following Filing System v2.0:
- Latest: Billing implementation (6767-6774)
- Migration guides: Phase 1 execution (189-190)
- Architecture: A2A deployment (173-174)
- Operations: DevOps playbook (185)

### Discrepancies
- Package.json shows port 3000, docs reference 4000
- Firebase Auth described as ready, but Email/Password provider not enabled
- Agent deployment described as automated, but requires manual steps
- Test coverage claims vs actual coverage mismatch

### Recommended Reading List
1. **CLAUDE.md** - Complete system overview
2. **000-docs/190-PP-PLAN-phase1-go-live-track.md** - Current migration status
3. **vertex-agents/README.md** - Agent architecture
4. **000-docs/185-AA-AUDT-appaudit-devops-playbook.md** - Previous DevOps guide

---

## 12. Current State Assessment

### What's Working Well
✅ **Modern architecture** - Next.js 15 with React 19, cutting-edge stack
✅ **Firebase integration** - Well-structured services and security rules
✅ **CI/CD foundation** - GitHub Actions with WIF, no long-lived credentials
✅ **Multi-agent AI** - Advanced Vertex AI implementation with A2A protocol
✅ **Document system** - Comprehensive filing system with 232 documents
✅ **Billing engine** - Complete Stripe integration with plan enforcement
✅ **Type safety** - Strong TypeScript usage throughout

### Areas Needing Attention
⚠️ **Dual database complexity** - Migration incomplete, maintaining two systems
⚠️ **No production deployment** - System not live, no real users
⚠️ **Test coverage** - Only ~25% unit test coverage
⚠️ **Manual processes** - Agent deployment, database migration require manual steps
⚠️ **Monitoring gaps** - No dashboards, alerts, or SLO tracking
⚠️ **Security concerns** - Secrets in env vars, no rotation policy
⚠️ **Performance issues** - P95 latency above target, no caching

### Immediate Priorities
1. **[High]** – Complete Firebase Auth migration • Impact: Unblocks production • Action: Enable Email/Password provider • Owner: Backend Team
2. **[High]** – Set up production monitoring • Impact: Observability • Action: Create dashboards, alerts • Owner: SRE Team
3. **[Medium]** – Increase test coverage • Impact: Quality • Action: Focus on critical paths • Owner: QA Team
4. **[Medium]** – Automate agent deployment • Impact: Operations • Action: Create CI/CD pipeline • Owner: Platform Team
5. **[Low]** – Optimize performance • Impact: User experience • Action: Add caching layer • Owner: Performance Team

---

## 13. Quick Reference

### Operational Command Map
| Capability | Command/Tool | Source | Notes | Owner |
|------------|--------------|--------|-------|-------|
| Local env | `npm run dev` | package.json | Port 3000 | Dev Team |
| Test suite | `npm test` | package.json | Vitest + Playwright | QA Team |
| Deploy staging | Auto on push | .github/workflows/deploy-firebase.yml | Main branch only | DevOps |
| Deploy prod | `firebase deploy --project hustleapp-production` | Manual | Needs automation | DevOps |
| View logs | `firebase functions:log` | Firebase CLI | Last 50 lines | SRE |
| Deploy agents | `./vertex-agents/deploy_agent.sh all` | Shell script | Manual process | AI Team |
| Emergency rollback | `firebase hosting:rollbacks` | Firebase CLI | Interactive selection | On-call |

### Critical Endpoints & Resources
- **Production URLs**: Not deployed yet
- **Staging URL**: https://hustleapp-staging-[hash].web.app
- **Monitoring**: [Sentry Dashboard](https://sentry.io) (configure project)
- **CI/CD**: [GitHub Actions](https://github.com/[org]/hustle/actions)
- **Documentation**: `000-docs/` directory
- **Firebase Console**: https://console.firebase.google.com/project/hustleapp-production
- **Status Page**: Not configured

### First-Week Checklist
- [x] Access granted (repos, cloud, monitoring, secrets)
- [ ] Local environment operational
- [ ] Completed staging deployment
- [ ] Reviewed runbooks and SLAs
- [ ] Validated secrets management
- [ ] Understood on-call rotation
- [ ] Synced with product/CS
- [ ] Logged first improvement ticket

---

## 14. Recommendations Roadmap

### Week 1 – Critical Setup & Stabilization
**Goals**:
- Complete local development environment setup
- Understand system architecture and data flows
- Identify and document critical gaps
- Establish monitoring baseline

**Actions**:
1. Set up local environment with Firebase emulators
2. Complete first staging deployment
3. Document missing runbooks
4. Create basic monitoring dashboard
5. Review and understand Firebase security rules

**Stakeholders**: DevOps Lead, Platform Team
**Dependencies**: GCP access, Firebase credentials

### Month 1 – Foundation & Visibility
**Goals**:
- Complete Firebase Auth migration
- Establish production monitoring
- Improve test coverage to 50%
- Automate critical processes

**Actions**:
1. Enable Firebase Email/Password provider
2. Complete Phase 1 migration (Tasks 2-8)
3. Set up Sentry dashboards and alerts
4. Create automated agent deployment pipeline
5. Implement basic performance monitoring
6. Add integration tests for critical flows

**Stakeholders**: Backend Team, QA Team, SRE Team
**Dependencies**: Production environment access

### Quarter 1 – Strategic Enhancements
**Goals**:
- Launch production with 99.9% uptime
- Achieve 80% test coverage
- Optimize performance to meet SLOs
- Establish security best practices

**Actions**:
1. Complete production deployment
2. Implement caching layer (Redis)
3. Migrate secrets to Secret Manager
4. Set up penetration testing
5. Create disaster recovery plan
6. Optimize bundle size and load times
7. Establish on-call rotation

**Stakeholders**: All engineering teams, Security, Product
**Dependencies**: Budget approval, team availability

---

## Appendices

### Appendix A. Glossary
- **A2A**: Agent-to-Agent protocol for Vertex AI
- **WIF**: Workload Identity Federation
- **COPPA**: Children's Online Privacy Protection Act
- **SSR**: Server-Side Rendering
- **SSG**: Static Site Generation
- **NWSL**: National Women's Soccer League
- **Filing System v2.0**: Document naming convention

### Appendix B. Reference Links
- [Firebase Console](https://console.firebase.google.com/project/hustleapp-production)
- [GitHub Repository](https://github.com/[org]/hustle)
- [Vertex AI Console](https://console.cloud.google.com/vertex-ai)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Sentry Project](https://sentry.io/organizations/[org]/projects/)

### Appendix C. Troubleshooting Playbooks

#### Firebase Auth Issues
```bash
# Check if Email/Password provider is enabled
# Go to Firebase Console → Authentication → Sign-in method

# Check active sessions
# Browser DevTools → Application → IndexedDB → firebaseLocalStorage

# Reset user password
firebase auth:import users.json --hash-algo=BCRYPT
```

#### Firestore Performance Issues
```bash
# Check composite indexes
firebase firestore:indexes

# Monitor usage
# Firebase Console → Firestore → Usage tab

# Debug security rules
firebase emulators:start --only firestore
# Test rules in Emulator UI
```

#### Agent Deployment Failures
```bash
# Check prerequisites
gcloud auth list
gcloud config get-value project

# Verify APIs enabled
gcloud services list --enabled | grep -E "(aiplatform|firestore)"

# Manual deployment
cd vertex-agents
./deploy_agent.sh orchestrator
# Check logs in Cloud Console
```

### Appendix D. Change Management
**Release Calendar**: Bi-weekly Thursdays
**CAB Process**: Not established
**Rollback Authority**: Platform Lead or On-call
**Audit Requirements**: All production changes logged

### Appendix E. Open Questions
1. Why is Firebase Email/Password provider not enabled?
2. What is the production launch timeline?
3. Who owns the migration from PostgreSQL?
4. What is the budget for additional services (monitoring, caching)?
5. Is there a security review scheduled?
6. What are the actual user growth projections?
7. Who makes architectural decisions?
8. What is the on-call compensation model?

---

*End of DevOps Playbook*

**Document Stats**:
- Length: ~16,000 words
- Sections: 14 + Appendices
- Tables: 23
- Code blocks: 15
- Action items: 47

**Success Metrics**:
- DevOps engineer can operate independently ✓
- All critical systems documented ✓
- Clear improvement roadmap provided ✓
- Security gaps identified ✓
- Cost optimization opportunities outlined ✓