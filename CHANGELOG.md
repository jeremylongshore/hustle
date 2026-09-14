# Changelog

All notable changes to the Hustle project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed — application email transport, 2026-09-13

- Route verification, password reset and notification mail through the existing
  approved MXroute SMTP sender. Remove the empty Resend dependency and the
  hardcoded onboarding sender; preserve application return shapes and tokens.
- Require validated TLS and bounded transport timeouts, expose sanitized
  failures, and avoid retrying ambiguous SMTP submissions automatically.
- Add a no-send authentication readiness endpoint with a sixty-second bounded
  cache, separate from process liveness. Deployment smoke verifies this signal;
  missing email configuration now produces an honest degraded health response.
- Add unit, fake-clock, SQLite route and real local TLS SMTP fixture regressions.
  Document deployment, protected backups, limits of no-send verification and
  rollback in [the email runbook](000-docs/6784-OD-RUNB-smtp-email-operations.md).
- Make production billing mode explicit and pass the complete Stripe variable
  set through Compose. This prevents `/api/healthz` liveness from concealing an
  implicitly enabled but unconfigured billing subsystem; billing remains
  deliberately disabled until its private credentials are provisioned.

### Reliability — 2026-09-13

- Complete the Auth.js request-guard migration, accepting verified encrypted
  sessions and rejecting forged/expired cookies. Preserve in-app return paths.
- Recover the login form after a 15-second deadline or network error; the old
  fake-clock test fails and the repaired behavior passes. Remove the redundant
  post-login refresh that could later remount a dashboard form and discard input.
- Restore transactional account/workspace provisioning and preserve original
  trial and billing state when reconciling migrated orphan accounts.
- Restore the declared Playwright dependency and real local Auth.js/SQLite
  browser fixtures, with token verification, isolated state, fail-closed builds
  and private artifacts excluded from container images. Retain existing user
  journey assertions while correcting obsolete form selectors.
- Keep E2E SQLite writes outside the watched Next.js source tree, wait for client
  route transitions before entering game data, and remove guarded temp databases
  during global teardown. The final production-built Chromium replay passes all
  87 scenarios sequentially with retries disabled.
- Restore the previously empty integration lane with 16 transactional SQLite
  provisioning cases and make it blocking in CI. Type checking, unit tests and
  Chromium E2E are blocking again; the separately classified unit lane passes
  858 tests.
- Scope Tailwind v4 source discovery to `src/`, exclude runtime upload paths from
  Turbopack file tracing, and preserve Next's framework-controlled dynamic-render
  exceptions through application authentication catches.
- Record demonstrated migration failures, regression evidence and verification
  boundaries in [the browser incident report](000-docs/6785-AA-INC-auth-migration-browser-regressions.md).

### Security — 2026-09-13

- Complete the September 7 credential-scrub repair from PR #49: remove the
  remaining Resend literals from three historical documents, preserving the
  prior repair's adjacent NextAuth and archived Groq redactions.
- Add a blocking, secret-safe Resend scan to CI, pre-merge validation and the
  deployment build gate. The scan includes tracked documentation and archives;
  13 hermetic regressions cover detection, staged-content integrity and errors.
- Exclude private dotenv files from Docker build contexts, including nested
  archives; preserve public `.env.example` templates. A real scratch-image
  regression proves the old context included private files and the repair excludes them.
- Isolate game-query unit tests from the CI job-wide E2E flag and explicitly
  cover enabled-mode verification. The old two failures reproduce; all 822
  application unit tests pass after the correction.
- Record why the earlier repair did not reach main, independently verified
  rejection of both reported keys, and the separate empty production email
  configuration in [the incident report](000-docs/6783-AA-INC-resend-secret-exposure.md).
  Historical Git objects remain; credential rejection does not prove past misuse
  did not occur. Application email delivery is not claimed restored by this scrub.


### Added
- **ADK Documentation Crawler Pipeline**: Production-grade infrastructure for crawling Google ADK docs
  - Complete Python package in `tools/adk_docs_crawler/` with 8 modules
  - Respects robots.txt, rate limiting (500ms between requests)
  - Generates RAG-ready chunks (1500 tokens max, 150 token overlap)
  - GCS upload with structured paths for Vertex AI consumption
  - Makefile targets: `crawl-adk-docs`, `crawl-adk-docs-local`, `setup-crawler`
  - GitHub Actions workflow for automated weekly crawls
  - Successfully crawled 118 pages, generated 2,568 chunks
  - Documentation: `000-docs/6781-AT-ARCH-adk-docs-crawl-pipeline.md`
- **Strategic Planning Documentation**:
  - `249-AA-STRT-cto-critical-path-scout-agent-rag.md` - CTO strategy with CoT reasoning
  - `250-LS-STAT-adk-crawler-execution-complete.md` - Crawler execution summary
  - `251-PP-PLAN-hustle-go-live-roadmap.md` - Production launch roadmap
- **QA Automation Infrastructure**: 5 GitHub issue templates for structured bug reporting and feedback
  - QA Bug Report template with severity levels and structured fields
  - QA UX Feedback template for usability improvements
  - QA Question template for onboarding gaps
  - QA Data/Stats Issue template for data integrity problems
  - QA Feature Idea template for enhancement requests
- **Synthetic QA Harness Implementation**: **COMPLETE** - Browser-based E2E testing harness for fake human validation
  - `252-PP-PLAN-synthetic-qa-harness-implementation.md` - Implementation plan and execution log
  - **Staging Seed Script**: `05-Scripts/seed-staging.ts` creates stable test data in Firebase
    - Demo parent account with 2 players (Attacking Midfielder + Goalkeeper)
    - 2 demo games with position-specific stats
    - Idempotent (deletes/rebuilds accounts)
  - **GitHub Actions Workflow**: `.github/workflows/synthetic-qa.yml` runs smoke tests on PRs
    - Triggers on `workflow_dispatch`, `pull_request`, `push` to main
    - Seeds staging, runs smoke suite, uploads artifacts
    - Comments on PR with pass/fail status
  - **Smoke Subset**: `npm run qa:e2e:smoke` for fast feedback (2 test files)
  - **Human QA Test Guide**: `253-OD-GUID-human-qa-test-guide.md` with 5 critical user journeys
  - **npm Scripts Added**:
    - `qa:e2e` - Run all E2E tests (Chromium only)
    - `qa:e2e:smoke` - Run smoke subset (fastest feedback)
    - `qa:seed:staging` - Seed Firebase with stable test data
  - **Blockers Documented**: Missing Firebase secrets for CI (9 secrets required)
- **Appauditmini**: Quick reference slash command (`/appauditmini`) generating 1-2 page architecture cheat sheets
- **Documentation**:
  - `249-RM-REFC-appauditmini-quick-reference.md` - MVP customer journey and architecture quick reference
  - `250-PP-PLAN-agentic-qa-automation-workflow.md` - Comprehensive plan for Vertex AI agent-driven QA automation
  - `251-AA-AUDT-cto-critical-issues.md` - CTO-level critical issues audit (corrected: migration Phases 1-3 complete)
- **Intent Solutions IO Branding**:
  - Downloaded 3 generated logos (Category Creator Emblem variants) to `000-docs/logos/`
  - Imagen 3 generation with `block_only_high` safety filter
  - `BLOCKED_PROMPTS.md` documenting why 3 logo prompts failed safety filter

### Changed
- Updated NWSL logo generation script to use Imagen 3 (`imagegeneration@006`) instead of Imagen 4
- Lowered safety filter from `block_some` to `block_only_high` for logo generation

---

## [1.0.0] - 2025-11-18

### 🎉 Initial Public Release

First public release of Hustle - Youth Soccer Statistics Tracking Platform. This release marks the completion of the Firebase migration, production infrastructure setup, and comprehensive feature enrichment.

### 🎯 Project Focus

Hustle demonstrates production-grade cloud infrastructure and AI agent orchestration:
- **Firebase Full Stack**: Authentication, Firestore, Cloud Functions, Hosting
- **Vertex AI A2A Protocol**: Multi-agent system with 5 specialized agents
- **Modern DevOps**: GitHub Actions with WIF, Terraform IaC, comprehensive CI/CD
- **Production Ready**: Monitoring, observability, security rules, COPPA compliance

### ✨ Major Features

#### Player Profile Enrichment
- **13 Specialized Soccer Positions**: GK, CB, RB, LB, RWB, LWB, DM, CM, AM, RW, LW, ST, CF
- **Gender Selection**: Required male/female field with validation
- **56 U.S. Youth Soccer Leagues**: ECNL Girls/Boys, MLS Next, USYS, NPL, USSSA, Rush Soccer, Surf Soccer, and more
- **Custom League Support**: "Other" option with free-text input for regional leagues
- **Position Intelligence**: Primary position selection + up to 3 secondary positions
- **Backward Compatibility**: Legacy `position` field preserved during migration

#### Firebase Migration Complete (Phases 1-3)
- **Phase 1: Authentication & Observability**
  - Migrated from NextAuth v5 to Firebase Authentication
  - Removed Sentry, normalized to Firebase/GCP observability
  - Google Cloud Logging with structured JSON logs
  - Firebase Performance Monitoring with custom traces

- **Phase 2: Database Migration**
  - Completely decommissioned PostgreSQL and Prisma
  - Migrated to Firestore with hierarchical collections
  - Security rules enforcing parent-child ownership
  - Composite indexes for query optimization

- **Phase 3: Monitoring & Observability**
  - GCP Cloud Monitoring setup with custom dashboards
  - Error reporting and alerting infrastructure
  - Cloud Logging integration with log-based metrics
  - Firebase Performance SDK enabled

#### Vertex AI Agent System (A2A Protocol)
- **5 Specialized Agents**:
  - Operations Manager (root orchestrator)
  - Validation Agent (data quality)
  - User Creation Agent (provisioning workflows)
  - Onboarding Agent (new user experience)
  - Analytics Agent (performance metrics)
- Agent-to-Agent communication via Cloud Functions
- Vertex AI Memory Bank for session persistence
- Comprehensive smoke tests with telemetry validation

#### Billing & Workspace Management (Phases 5-6)
- **Stripe Integration**: Checkout, webhooks, Customer Portal
- **Plan Enforcement**: Free, Pro, Team tiers with usage limits
- **Subscription Lifecycle**: Ledger system with event replay
- **Plan Limit Warnings**: Usage indicators and soft warnings
- **Workspace Status Enforcement**: Active, suspended, canceled states
- **Collaboration**: Role-based access control for teams

#### Storage & Media
- Firebase Storage integration for player photo uploads
- Secure upload with Firebase Admin SDK
- Storage quotas per workspace plan

### 🛠️ Infrastructure & DevOps

#### CI/CD Pipelines
- GitHub Actions with Workload Identity Federation (WIF)
- Firebase Hosting + Cloud Functions deployment
- Vertex AI agent deployment automation
- Cloud Run staging environment
- Manual production deployment workflow with "DEPLOY" confirmation

#### Testing
- Vitest unit tests with coverage reporting
- Playwright E2E tests (auth, dashboard, player flows)
- Vertex AI smoke tests with telemetry validation
- Test results archival in `03-Tests/`

#### Documentation
- **244+ Documentation Files** in `000-docs/`
- Document Filing System v2.0 (NNN-CC-ABCD-description.ext)
- Comprehensive `CLAUDE.md` for AI assistant guidance
- `AGENTS.md` with repository coding standards
- Production deployment runbook
- After Action Reports (AARs) for all major phases

### 🎨 User Experience

#### Dashboard Improvements
- Mobile-responsive design with Tailwind CSS
- Real-time Firestore synchronization
- Position-specific statistics tracking
- Workspace health monitoring
- Billing portal access

#### Forms & Validation
- Zod schema validation for all user inputs
- Conditional league input (shows text field when "Other" selected)
- Position validation (prevents primary position in secondary list)
- Client-side and server-side validation layers

### 🔒 Security & Compliance

- **COPPA Compliance**: Parent/guardian verification required
- **Firestore Security Rules**: Enforced data ownership
- **Firebase Auth**: Email/password with verification required
- **Secrets Management**: GitHub Secrets + Google Secret Manager
- **No Service Account Keys**: WIF for all GitHub Actions

### 📊 Technology Stack

**Frontend:**
- Next.js 15.5 with App Router and React Server Components
- React 19.1 with TypeScript 5.x
- Tailwind CSS with shadcn/ui components
- Turbopack bundling

**Backend:**
- Firebase Cloud Functions (Node.js 20)
- Firestore NoSQL database with hierarchical collections
- Firebase Authentication
- Firebase Storage

**AI/ML:**
- Vertex AI Agent Engine
- Google Agent-to-Agent (A2A) Protocol
- Google ADK (Agent Development Kit)
- Vertex AI Memory Bank

**DevOps:**
- GitHub Actions CI/CD
- Workload Identity Federation (WIF)
- Terraform infrastructure (modules for multi-project)
- Firebase Hosting + Cloud Run

**Monitoring:**
- Google Cloud Logging
- Firebase Performance Monitoring
- Cloud Monitoring with custom dashboards
- Error Reporting

### 📝 Repository Enhancements

#### Professional GitHub Presence
- **README.md**: Comprehensive overview with 9+ sections, 3 Mermaid diagrams
- **GitHub Pages**: Custom HTML site with responsive design
- **Badges**: 6 shields.io badges (Next.js, Firebase, Vertex AI, TypeScript, Firestore, License)
- **Topics**: 10 repository tags (youth-soccer, firebase, vertex-ai, nextjs, typescript, etc.)
- **Description**: Professional tagline
- **Homepage**: https://jeremylongshore.github.io/hustle/

#### Documentation Architecture
- Flat numbered filing system (000-docs/)
- Mermaid diagrams for system architecture, data models, CI/CD
- Deployment runbooks and troubleshooting guides
- Phase-by-phase migration After Action Reports (AARs)

### 🗓️ Deprecated

- ❌ NextAuth v5 (replaced with Firebase Auth)
- ❌ PostgreSQL database (replaced with Firestore)
- ❌ Prisma ORM (replaced with Firebase Admin SDK)
- ❌ Sentry error tracking (replaced with GCP Error Reporting)
- ❌ Cloud SQL (replaced with Firestore)

### 🔧 Migration Notes

For users upgrading from legacy PostgreSQL version:
1. Run migration script: `npx tsx 05-Scripts/migration/migrate-to-firestore.ts`
2. Verify data in Firestore Console
3. Test authentication flows (registration, login, email verification)
4. Archive legacy Prisma schema and migrations

### 📦 Release Assets

- Source code: `hustle-v1.0.0.tar.gz`
- Documentation: 244+ files in `000-docs/`
- Firebase configuration: `firebase.json`, `firestore.rules`, `firestore.indexes.json`
- CI/CD workflows: 9 GitHub Actions workflows
- Terraform modules: Multi-project GCP infrastructure

### 🙏 Acknowledgments

Built with:
- **Firebase**: Hosting, Authentication, Firestore, Cloud Functions, Performance Monitoring
- **Vertex AI**: Agent Engine, A2A Protocol, Memory Bank
- **Google Cloud Platform**: Logging, Monitoring, Error Reporting, Secret Manager
- **Next.js**: React framework with App Router and Server Components
- **shadcn/ui**: Beautiful, accessible component library

### 🔗 Links

- **Live Dashboard**: https://hustlestats.io
- **GitHub Pages**: https://jeremylongshore.github.io/hustle/
- **Repository**: https://github.com/jeremylongshore/hustle
- **Architecture Guide**: [CLAUDE.md](./CLAUDE.md)
- **Developer Docs**: [AGENTS.md](./AGENTS.md)

---

## [Unreleased]

### Planned Features
- Additional soccer positions (futsal, beach soccer variants)
- Advanced analytics and trend visualization
- Team-level statistics aggregation
- Coach dashboard with multi-player views
- Export to PDF reports
- Mobile app (React Native)

---

**Full Changelog**: https://github.com/jeremylongshore/hustle/commits/v1.0.0
