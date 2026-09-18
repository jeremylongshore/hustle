# Changelog

All notable changes to Hustle will be documented in this file.

**Versioning:** Sequential increment (`v00.00.00` � `v00.00.01` � `v00.00.02`...)
See `VERSION.md` for complete versioning rules.

---

## [1.1.0] - 2025-10-12 - MVP Complete & Production Ready ✅

### 🎯 MVP Completion

**Product Features Complete**
- Player management UI (list, add, edit athletes)
- Game logging with position-specific stats (Forward, Midfielder, Defender, Goalkeeper)
- Verification system with PIN protection
- Email verification and password reset flows
- Comprehensive responsive dashboard

**Infrastructure Complete**
- Terraform GCS backend for state management
- Cloud SQL with automated backups and SSL
- Secret Manager for all sensitive configs
- Cloud Run production and staging environments
- Domain mapping for hustlestats.io

**CI/CD Pipeline**
- Automated lint, typecheck, and build checks
- Unit tests (Vitest) and E2E tests (Playwright)
- Staging deployment on PR
- Production deployment on merge to main
- Docker image validation

### 🏗️ Infrastructure

**Terraform Updates**
- GCS backend configuration (`hustle-tf-state` bucket)
- Cloud SQL: backups enabled, PITR, SSL required
- Secret Manager: DATABASE_URL, NEXTAUTH_SECRET, SENTRY_DSN, MAILER_KEY
- Cloud Run services: prod (`hustle-app`) and staging (`hustle-app-staging`)
- VPC connector for private Cloud SQL access
- Domain mapping for `hustlestats.io` and `www.hustlestats.io`

**Security Enhancements**
- All secrets in Google Secret Manager
- SSL/TLS required for database connections
- Automated backups with 30-day retention
- Point-in-time recovery enabled
- Environment variable validation with Zod

### 🎨 UI/UX Features

**Player Management**
- Athletes list page with cards and empty states
- Add athlete form with photo upload
- Edit athlete form with pre-filled data
- Delete athlete functionality with confirmation

**Game Logging**
- Universal stats: goals, assists, minutes played
- Position-specific stats:
  - Goalkeeper: saves, goals against, clean sheet
  - Defender: tackles, interceptions, clearances, blocks, aerial duels
- Responsive form with dynamic stat fields

**Verification**
- PIN-based game verification
- verificationPin field added to User model
- Verify API endpoint with PIN validation

### 🔐 Security

**Configuration**
- Prisma with `sslmode=require` for production
- Sentry configured with SENTRY_DSN
- Environment validation (`src/env.mjs`)
- Secret Manager IAM bindings for Cloud Run

### 🧪 Testing

**Unit Tests**
- Authentication tests (bcrypt, session guards)
- Players API validation tests

**E2E Tests**
- Login page and healthcheck
- Protected route redirects
- Form validation

### 📦 CI/CD

**Workflows Created**
- `ci.yml`: Lint, typecheck, build, test, security audit
- `deploy.yml`: Staging (PR) and production (main) deployments
- Docker image build and validation
- Automated health checks post-deployment

### 📊 Domain Configuration

**hustlestats.io**
- Production domain mapping configured
- www subdomain mapping
- SSL certificate auto-provisioning
- DNS instructions in Terraform outputs

### 📈 Metrics

- **Files Created**: 15+ (UI pages, API routes, tests, infrastructure)
- **Terraform Resources**: 20+ (Cloud Run, Cloud SQL, Secret Manager, VPC)
- **Test Coverage**: Unit + E2E tests for core flows
- **Deployment**: Fully automated CI/CD pipeline
- **Production Ready**: ✅ Complete

### 🚀 Deployment

```bash
# Terraform apply
cd 06-Infrastructure/terraform
terraform init
terraform apply

# Deploy to Cloud Run
gcloud run deploy hustle-app --source . --region us-central1

# Verify
curl https://hustlestats.io/api/healthcheck
```

### 📚 Documentation

All documentation updated:
- CHANGELOG.md (this file)
- Infrastructure Terraform files
- CI/CD workflow documentation
- Domain setup instructions

---

## [00.00.01] - 2025-10-08 - Legal Compliance & Documentation Release ✅

### ⚖️ Legal Compliance - LAUNCH READY

**COPPA-Compliant Legal Framework**
- Terms of Service page (`/terms`) with user eligibility requirements
- Privacy Policy page (`/privacy`) with comprehensive COPPA compliance notice
- Parental rights documentation (review, delete, modify child data)
- Automatic consent tracking in database (5 new fields)
- Registration form updated with legal consent notice
- Footer links to legal documents on all pages

**Database Schema Updates**
- `agreedToTerms` - Terms of Service acceptance flag
- `agreedToPrivacy` - Privacy Policy acceptance flag
- `isParentGuardian` - 18+ parent/guardian certification
- `termsAgreedAt` - Timestamp of Terms acceptance
- `privacyAgreedAt` - Timestamp of Privacy acceptance
- Registration API automatically sets all consent fields

**Legal Consent UX**
- Implicit consent via "Create Account" button click
- Legal notice below registration button with clickable links
- Opens Terms/Privacy in new tab for review
- Simplified UX - no checkboxes required per user feedback

### 📚 Documentation Excellence

**New DevOps & Architecture Guides** (4 comprehensive documents)
- `047-ref-devops-deployment-guide.md` - Complete deployment procedures
- `048-ref-devops-architecture.md` - Infrastructure architecture deep-dive
- `049-ref-devops-operations.md` - Production operations guide
- `050-ref-architecture-competitive-advantage.md` - Strategic advantages

**Testing Documentation**
- `TESTING-STRATEGY.md` - Comprehensive testing approach
- E2E test suite for authentication flows
- Unit tests for security functions
- Test results tracking and reporting

### 🔒 Security Enhancements

**Legal Compliance Security**
- All legal agreements timestamped for audit trail
- Parent/guardian certification required for registration
- COPPA compliance notices prominently displayed
- User consent properly tracked and retrievable

### 🏗️ Infrastructure Verification

**Production Cloud Setup Confirmed** ✅
- Google Cloud Project: `hustle-dev-202510`
- Cloud SQL PostgreSQL: `hustle-db` (RUNNABLE)
- Cloud Run Service: `hustle-app` (DEPLOYED)
- VPC Connector: `hustle-vpc-connector` (READY)
- Private database connection (10.240.0.3)
- Full data persistence with automatic backups

**Containerization**
- Docker multi-stage build optimized
- Next.js standalone output configured
- Prisma client included in container
- Production-ready deployment verified

### 🎨 UI/UX Improvements

**Landing Page**
- Added Terms of Service link to footer
- Added Privacy Policy link to footer
- Professional legal document pages with Back to Home navigation

**Registration Flow**
- Cleaner consent UX (no checkboxes)
- Contextual legal links
- Clear parent/guardian language

### 🧪 Testing Improvements

**Enhanced Test Coverage**
- E2E authentication flow tests
- Registration validation tests
- Login/logout flow tests
- Session persistence tests
- Security validation tests
- Playwright test reporting

### 📊 Metrics

- **Legal Pages Created**: 2 (Terms, Privacy)
- **Database Fields Added**: 5 (consent tracking)
- **Documentation Files**: +4 comprehensive guides
- **Code Quality**: Production-ready
- **Cloud Infrastructure**: Fully verified and operational
- **COPPA Compliance**: ✅ Complete

### 🎯 Launch Readiness

**Legal Requirements** ✅
- Terms of Service: Complete
- Privacy Policy: COPPA-compliant
- Consent mechanism: Functional
- Age verification: 18+ enforced

**Infrastructure Requirements** ✅
- Database: Cloud SQL PostgreSQL
- Application: Cloud Run containerized
- Networking: VPC private connection
- Backups: Automatic daily + point-in-time

**Next Steps**
- Custom domain setup (optional)
- Email service configuration for production
- Payment processing integration (future)
- Public launch announcement

---

## [00.00.00] - 2025-10-05 - Foundation Release <�

### <� Gate A Milestone - COMPLETE

This is our foundational release. Authentication works, infrastructure is solid, users can log in. Ready to build features on this base.

###  Added

**Authentication & Security**
- NextAuth v5 implementation with JWT strategy
- bcrypt password hashing (10 rounds)
- Complete user registration flow
- Secure login with credentials provider
- Server-side session protection
- Session-based API authorization (401/403 pattern)

**User Interface**
- Professional landing page with clear CTAs
- Parent/Guardian registration page
- Login page with password visibility toggle
- Dashboard with Kiranism framework integration
- Responsive sidebar with mobile detection
- "Add Athlete" navigation flow

**API Endpoints (All Secured)**
- `POST /api/auth/register` - User registration
- `GET /api/players` - Fetch user's players (filtered by session)
- `POST /api/players/create` - Create player profile
- `GET /api/games` - Fetch player games (ownership verified)
- `POST /api/games` - Log new game (ownership verified)
- `POST /api/verify` - Verify game stats (session-based)
- `POST /api/players/upload-photo` - Upload player photo (ownership verified)
- `GET /api/healthcheck` - Database health check

**Infrastructure**
- Google Cloud Run deployment
- Cloud SQL PostgreSQL database
- VPC networking with private connector
- Terraform infrastructure as code
- Docker multi-stage build optimization
- Prisma ORM with migrations

**Database Schema**
- Users table (NextAuth standard)
- Players table (athlete profiles)
- Games table (performance tracking)
- Accounts/Sessions (NextAuth)
- Complete foreign key relationships

**Developer Experience**
- Next.js 15.5.4 with Turbopack
- TypeScript strict mode
- shadcn/ui component library
- Comprehensive documentation in `01-Docs/`
- Directory standards compliance
- CLAUDE.md codebase guide

### = Changed

**Migration from SuperTokens to NextAuth v5**
- Replaced SuperTokens authentication
- Migrated to JWT-based sessions
- Adopted Kiranism dashboard starter
- Updated all API routes for NextAuth

### = Security

**Complete Security Audit Passed**
- All API endpoints require authentication
- User data filtered by session.user.id
- No client-provided user IDs accepted
- Proper 401 (Unauthorized) vs 403 (Forbidden) responses
- Password validation and hashing
- SQL injection protection via Prisma

### =� Documentation

**Created 28 Documentation Files:**
- PRDs (Product Requirements Documents)
- ADRs (Architecture Decision Records)
- AARs (After Action Reports)
- Bug analysis and fixes
- Security audit reports
- Deployment guides
- Testing guides

### >� Known Issues

- React hydration warning (non-blocking, cosmetic)
- Password reset not yet implemented
- Email verification pending

### <� Lessons Learned

**What Worked:**
- Systematic approach to authentication migration
- Comprehensive documentation for every change
- Security-first API design pattern
- TodoWrite task tracking

**What We'd Do Differently:**
- Full codebase audit before fixes (not after)
- Security audit before visible bugs
- Complete user flow mapping upfront

---

## Version Format

```
v00.00.00 � Initial release
v00.00.01 � First update (next release)
v00.00.02 � Second update
...
```

**Rule:** Every release increments by exactly `0.00.01` - no exceptions.

---

**Release Notes:** Each version includes:
- Features added
- Changes made
- Security updates
- Known issues
- Documentation updates

See `RELEASES.md` for the release process.

[00.00.00]: https://github.com/your-org/hustle/releases/tag/v00.00.00
