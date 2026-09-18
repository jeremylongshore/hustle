# HUSTLE Survey System: Complete DevOps Operations Guide

*Generated: 2025-10-08*
*System Version: 0.1.0*
*For: DevOps Team*

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Deployment Architecture](#deployment-architecture)
5. [Directory Structure Deep-Dive](#directory-structure-deep-dive)
6. [Database Operations](#database-operations)
7. [Email Service Integration](#email-service-integration)
8. [Deployment Workflows](#deployment-workflows)
9. [Environment Configuration](#environment-configuration)
10. [Monitoring & Observability](#monitoring--observability)
11. [Security & Access Management](#security--access-management)
12. [Development Workflow](#development-workflow)
13. [Dependencies & Supply Chain](#dependencies--supply-chain)
14. [Troubleshooting Guide](#troubleshooting-guide)
15. [Current State Assessment](#current-state-assessment)
16. [Quick Reference](#quick-reference)

---

## Executive Summary

The **HUSTLE Survey System** is a Next.js 15 application designed to collect structured research data from parents of high school athletes. The system presents a 68-question survey across 15 sections, stores responses in PostgreSQL, sends personalized thank you emails via Resend, and prepares data for AI-powered beta candidate analysis using Groq.

### Current State
- **Production Status**: Development/staging (not yet deployed to production)
- **Deployment**: Dual implementation
  - **Next.js standalone app**: Ready for deployment (not currently deployed)
  - **Astro integration**: Live at https://intentsolutions.io/survey/ (Netlify)
- **Database**: Shares PostgreSQL instance with main Hustle MVP app (`10.240.0.3:5432/hustle_mvp`)
- **Scale**: Single table (`survey_responses`), expecting ~100-500 initial responses

### Technology Foundation
- **Framework**: Next.js 15.5.4 with App Router and Turbopack
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 15 via Prisma ORM
- **Email**: Resend API for transactional emails
- **AI**: Groq SDK for future beta candidate analysis
- **Hosting**:
  - Netlify (Astro version, **currently live**)
  - Google Cloud Run (Next.js version, **ready but not deployed**)

### Key Architectural Decisions

**Why Dual Implementation?**
The survey exists in two forms:
1. **Astro static pages** (`/home/jeremy/projects/intent-solutions-landing/astro-site/src/pages/survey/`) - Currently deployed on Netlify at intentsolutions.io/survey
2. **Next.js app** (this repository) - API backend for data submission, email sending, future dynamic features

**Rationale**: The Astro version provides fast static page delivery for the survey form, while the Next.js app provides the API backend (`/api/survey/submit`) and will eventually host dynamic features like admin dashboards and AI analysis tools.

**Database Sharing**: Survey responses are stored in the same PostgreSQL database as the main Hustle MVP app to enable future integration of survey data with player profiles and beta testing coordination.

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HUSTLE Survey System                      │
└─────────────────────────────────────────────────────────────┘

┌────────────────┐         ┌─────────────────┐
│  Astro Survey  │────────▶│   Next.js API   │
│  (Netlify)     │  POST   │   (Not Deployed)│
│                │  Survey │                 │
│ /survey/1-15/  │  Data   │ /api/survey/    │
│ /thank-you/    │         │    /submit      │
└────────────────┘         └─────────────────┘
        │                           │
        │                           ├──────▶ PostgreSQL
        │                           │        (Shared DB)
        │                           │        survey_responses
        │                           │
        │                           └──────▶ Resend API
        │                                    (Thank You Emails)
        │
        └──────▶ Static Assets (Netlify CDN)


Data Flow:
1. User visits https://intentsolutions.io/survey
2. Completes 15-section survey (68 questions)
3. Frontend POSTs to /api/survey/submit (currently local dev)
4. API validates, stores in PostgreSQL
5. Sends thank you email via Resend
6. Redirects to /survey/thank-you with confirmation
```

### Component Relationships

| Component | Type | Status | Purpose |
|-----------|------|--------|---------|
| Astro Survey Pages | Static Site | **LIVE** (Netlify) | Survey form presentation |
| Next.js API | Backend API | Local Dev Only | Data submission, email, future admin |
| PostgreSQL | Database | Shared with Hustle MVP | Survey response storage |
| Resend | Email Service | Configured | Thank you email delivery |
| Groq | AI Service | Configured (unused) | Future beta candidate scoring |

---

## Technology Stack

### Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend Framework** | Next.js (App Router) | 15.5.4 | Server components, API routes, SSR |
| **Build Tool** | Turbopack | Built-in | Fast development builds |
| **Language** | TypeScript | 5.x | Type safety, better DX |
| **UI Styling** | Tailwind CSS | 4.0 | Utility-first CSS |
| **Database ORM** | Prisma Client | 6.16.3 | Type-safe database access |
| **Database** | PostgreSQL | 15 | Relational data storage |
| **Email Service** | Resend | 6.1.2 | Transactional email API |
| **AI Analysis** | Groq SDK | 0.33.0 | LLM-powered beta candidate scoring |
| **Form Validation** | React Hook Form + Zod | 7.64.0 + 4.1.12 | Client-side validation |
| **Password Hashing** | bcrypt | 6.0.0 | Secure password storage (future auth) |
| **Runtime** | Node.js | 20.x | JavaScript runtime |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| ESLint | 9.x | Code linting |
| TypeScript Compiler | 5.x | Type checking |
| tsx | 4.20.6 | TypeScript script execution |
| dotenv | 17.2.3 | Environment variable loading |

### External Services

| Service | Purpose | Environment | Key Config |
|---------|---------|-------------|------------|
| Resend | Email delivery | Production | API key in .env |
| PostgreSQL | Data persistence | Shared (10.240.0.3) | DATABASE_URL |
| Groq | AI analysis | Future use | GROQ_API_KEY |
| Netlify | Static hosting (Astro) | Production | Via intentsolutions.io |

---

## Deployment Architecture

### Current Deployment Status

**⚠️ IMPORTANT**: The survey system has a split deployment:

1. **Frontend (Astro) - LIVE**
   - Location: `/home/jeremy/projects/intent-solutions-landing/astro-site/src/pages/survey/`
   - Deployment: Netlify (https://intentsolutions.io)
   - Method: Git push to `main` → Auto-deploy via Netlify
   - Build: `bun run build` (Astro static site generation)

2. **Backend (Next.js API) - NOT DEPLOYED**
   - Location: This repository (`/home/jeremy/projects/hustle/08-Survey/survey-app/`)
   - Intended Deployment: Google Cloud Run (not yet configured)
   - Current Status: Local development only
   - API Endpoint: Would be `https://hustlesurvey.intentsolutions.io/api/survey/submit`

### Deployment Topology

```
Production (Netlify - LIVE):
┌──────────────────────────────────────┐
│ intentsolutions.io/survey/           │
│                                      │
│ ┌──────────────────────────────────┐│
│ │  Astro Static Pages (15 sections)││
│ │  - /survey/1/ through /survey/15/││
│ │  - /survey/thank-you/            ││
│ └──────────────────────────────────┘│
│                                      │
│  Build: bun run build               │
│  Deploy: git push main              │
│  CDN: Netlify Edge Network          │
└──────────────────────────────────────┘

Development (Local):
┌──────────────────────────────────────┐
│ Next.js App (localhost:3000)         │
│                                      │
│ ┌──────────────────────────────────┐│
│ │  API Routes                      ││
│ │  - /api/survey/submit (POST)     ││
│ │                                  ││
│ │  Email Service                   ││
│ │  - Resend integration            ││
│ │                                  ││
│ │  Database                        ││
│ │  - PostgreSQL (shared)           ││
│ └──────────────────────────────────┘│
└──────────────────────────────────────┘

Future Production (Not Yet Deployed):
┌──────────────────────────────────────┐
│ Google Cloud Run                     │
│ hustlesurvey.intentsolutions.io      │
│                                      │
│  Service: hustle-survey-api          │
│  Region: us-central1                 │
│  Min Instances: 0                    │
│  Max Instances: 10                   │
└──────────────────────────────────────┘
```

### Database Sharing Architecture

```
┌─────────────────────────────────────────┐
│  PostgreSQL Database (Shared)           │
│  Host: 10.240.0.3:5432                  │
│  Database: hustle_mvp                   │
│                                         │
│  ┌────────────────────────────────────┐│
│  │ Main Hustle App Tables             ││
│  │ - users                            ││
│  │ - players                          ││
│  │ - games                            ││
│  │ - accounts (NextAuth)              ││
│  │ - sessions (NextAuth)              ││
│  └────────────────────────────────────┘│
│                                         │
│  ┌────────────────────────────────────┐│
│  │ Survey System Tables               ││
│  │ - survey_responses                 ││
│  └────────────────────────────────────┘│
└─────────────────────────────────────────┘
         ▲                      ▲
         │                      │
    Hustle MVP              Survey API
    (Cloud Run)           (Local/Future)
```

---

## Directory Structure Deep-Dive

```
survey-app/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   └── survey/
│   │       └── submit/
│   │           └── route.ts  # POST /api/survey/submit
│   ├── survey/
│   │   ├── [section]/        # Dynamic survey sections (unused)
│   │   │   └── page.tsx
│   │   └── complete/
│   │       └── page.tsx      # Thank you page (unused - using Astro)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Landing page
├── lib/                      # Shared utilities
│   ├── email-templates.ts    # 🔑 Email HTML generation
│   ├── email.ts              # 🔑 Resend integration
│   ├── prisma.ts             # Prisma client singleton
│   ├── survey-data.ts        # Survey question definitions
│   └── survey-data-complete.ts # Complete 68-question dataset
├── prisma/
│   └── schema.prisma         # 🔑 Database schema
├── public/                   # Static assets
├── .env.local                # 🔐 Local environment variables
├── CLAUDE.md                 # AI assistant documentation
├── DEVOPS_GUIDE.md           # This file
├── README.md                 # Project overview
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies
├── prisma/schema.prisma      # Database schema
├── smoke-test.sh             # Integration test script
├── test-email-real.ts        # Email testing (uses real template)
├── test-groq.js              # Groq AI testing
├── test-resend.js            # Resend email testing
├── test-thank-you-email.js   # Old email test (deprecated)
├── tsconfig.json             # TypeScript configuration
└── tailwind.config.js        # Tailwind CSS configuration
```

### app/ - Next.js Application

**app/api/survey/submit/route.ts** - Primary API Endpoint

Purpose: Handles survey submission, database storage, and email sending

```typescript
POST /api/survey/submit
- Validates survey data (68 questions)
- Extracts demographics for indexed fields
- Stores in PostgreSQL (survey_responses table)
- Sends thank you email via Resend
- Returns: { success, submissionId, emailSent }
- Error handling: 409 for duplicate emails, 500 for server errors
```

Key Features:
- **Input validation**: Checks for required data structure
- **Demographic extraction**: Pulls key fields (email, numAthletes, grades, sports, etc.)
- **JSON storage**: All 68 responses stored in `responses` JSON field
- **Email integration**: Sends personalized thank you email
- **Duplicate prevention**: Unique constraint on email field

**app/survey/[section]/page.tsx** - Dynamic Survey Sections (Unused)

Status: **Not actively used** - survey is served by Astro static pages

Purpose: Originally designed for dynamic Next.js survey pages, but replaced by Astro implementation for better static performance.

**app/survey/complete/page.tsx** - Thank You Page (Unused)

Status: **Not actively used** - using Astro version at intentsolutions.io/survey/thank-you/

Contains: Full personal letter from Jeremy about building HUSTLE (same content as Astro version)

### lib/ - Shared Utilities

**lib/email-templates.ts** 🔑 **CRITICAL**

Purpose: Generates HTML and text email templates for thank you emails

Key Function: `generateThankYouEmail({ recipientName })`

Returns:
```typescript
{
  subject: "Thank You - HUSTLE™",
  html: "<full HTML email with inline styles>",
  text: "Plain text version"
}
```

Content: Complete personal letter from Jeremy including:
- 20+ years restaurant business story
- Trucking to AI technology pivot
- Google Cloud Startup Program
- Soccer dad passion and motivation
- HUSTLE vision and feature roadmap
- Beta testing details
- Contact information

Styling: Gray monochrome theme with professional formatting

**lib/email.ts** 🔑 **CRITICAL**

Purpose: Resend API integration for sending emails

Key Function: `sendThankYouEmail({ recipientEmail, recipientName })`

Features:
- Lazy-initialized Resend client
- Email validation
- Graceful degradation (warns if RESEND_API_KEY missing)
- Error handling and logging
- Tagging for tracking (campaign: survey-thank-you)

Configuration:
- FROM_EMAIL: `process.env.RESEND_FROM_EMAIL` (default: "HUSTLE <thankyou@intentsolutions.io>")
- Reply-to: jeremy@intentsolutions.io

**lib/prisma.ts**

Purpose: Prisma client singleton (prevents multiple instances in dev)

**lib/survey-data.ts**

Purpose: Survey structure definition (15 sections, question types, validation)

**lib/survey-data-complete.ts**

Purpose: Complete 68-question dataset with all options

### prisma/ - Database Schema

**schema.prisma** 🔑 **CRITICAL**

Database: PostgreSQL (provider: "postgresql")

Models:
1. **SurveyResponse** - Primary table

Fields:
- `id`: cuid (unique identifier)
- `email`: String @unique (prevents duplicates)
- `phone`: String? (optional)
- Demographics (extracted for querying):
  - `numAthletes`: Int?
  - `grades`: Json? (array)
  - `sports`: Json? (array)
  - `hoursPerWeek`: String?
  - `recruitmentStatus`: String?
  - `location`: String?
- `responses`: Json (all 68 survey answers)
- Progress:
  - `currentSection`: Int (default: 1)
  - `completed`: Boolean (default: false)
- AI Analysis (future):
  - `aiScore`: Float? (0-100 beta fit score)
  - `aiSummary`: String? (profile description)
  - `aiSegment`: String? (user type)
  - `betaPriority`: String? (HIGH/MEDIUM/LOW)
  - `aiStrengths`: Json?
  - `aiConcerns`: Json?
  - `aiRecommendations`: Json?
- Timestamps:
  - `submittedAt`: DateTime?
  - `analyzedAt`: DateTime?
  - `createdAt`: DateTime
  - `updatedAt`: DateTime

Indexes:
- email (unique constraint + index)
- completed (for filtering)
- betaPriority (for future prioritization)

### Test Scripts

**test-email-real.ts** ✅ **Use This**
- TypeScript test using actual lib/email-templates.ts
- Requires: `npx tsx test-email-real.ts`
- Sends to: jeremy@intentsolutions.io
- Uses: Full long personal letter

**test-thank-you-email.js** ❌ **Deprecated**
- Old inline template (short version)
- Don't use this one

**test-resend.js**
- Tests Resend API connectivity
- Sends simple test email

**test-groq.js**
- Tests Groq AI API connectivity
- For future beta candidate analysis

**smoke-test.sh**
- Integration test script
- Tests API endpoints

---

## Database Operations

### Connection Details

**Database**: PostgreSQL 15
**Host**: `10.240.0.3:5432`
**Database Name**: `hustle_mvp`
**User**: `hustle_admin`
**Connection String**: Set in `.env.local` as `DATABASE_URL`

**⚠️ Security Note**: Database password is hardcoded in .env.local. For production, use Google Secret Manager.

### Shared Database Architecture

The survey system shares the same PostgreSQL instance with the main Hustle MVP application but uses separate tables.

```
hustle_mvp database:
├── Hustle MVP Tables:
│   ├── users (NextAuth)
│   ├── accounts (NextAuth)
│   ├── sessions (NextAuth)
│   ├── verification_tokens (NextAuth)
│   ├── players
│   └── games
└── Survey System Tables:
    └── survey_responses (this app)
```

### Prisma Commands

**Generate Prisma Client** (after schema changes):
```bash
npx prisma generate
```

**Push Schema to Database** (development):
```bash
npx prisma db push
```

**Create Migration** (production):
```bash
npx prisma migrate dev --name description_here
npx prisma migrate deploy  # Apply in production
```

**Open Prisma Studio** (database GUI):
```bash
npx prisma studio
```

**Reset Database** (⚠️ **DELETES ALL DATA**):
```bash
npx prisma migrate reset
```

### Database Schema Management

**Current State**: Schema uses `db push` for development (no migrations created yet)

**Migration Strategy**:
1. Development: Use `db push` for rapid iteration
2. Production: Create proper migrations before deploying
3. Rollback: Keep migration history for rollback capability

**Schema Change Workflow**:
1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` (dev)
3. Run `npx prisma generate` (regenerate client)
4. Restart Next.js dev server (clear `.next` cache)
5. Test thoroughly
6. Create migration for production: `npx prisma migrate dev`

### Data Model: SurveyResponse

**Design Pattern**: Hybrid structure
- **Indexed fields** for common queries (email, numAthletes, completed, betaPriority)
- **JSON blob** for full survey data (all 68 responses)

**Rationale**:
- Fast queries on demographics
- Flexibility for survey structure changes
- Complete data preservation
- Support for future AI analysis

**Querying Examples**:

Get all completed surveys:
```typescript
const surveys = await prisma.surveyResponse.findMany({
  where: { completed: true }
});
```

Filter by beta priority:
```typescript
const highPriority = await prisma.surveyResponse.findMany({
  where: { betaPriority: "HIGH" },
  orderBy: { aiScore: 'desc' }
});
```

Access full survey responses:
```typescript
const response = await prisma.surveyResponse.findUnique({
  where: { email: 'user@example.com' }
});
// response.responses is JSON object with all 68 answers
```

### Backup & Recovery

**Current Backup Strategy**: ⚠️ **NOT CONFIGURED**

**Recommended**:
- Daily automated backups via Cloud SQL
- 7-day retention for point-in-time recovery
- Weekly full backups to Cloud Storage
- Monthly archives for compliance

**Manual Backup** (PostgreSQL):
```bash
pg_dump -h 10.240.0.3 -U hustle_admin -d hustle_mvp \
  -t survey_responses > survey_backup_$(date +%Y%m%d).sql
```

**Restore**:
```bash
psql -h 10.240.0.3 -U hustle_admin -d hustle_mvp < survey_backup_20251008.sql
```

---

## Email Service Integration

### Resend Configuration

**Service**: Resend (https://resend.com)
**Purpose**: Transactional thank you emails

**Configuration**:
- API Key: `RESEND_API_KEY` (in .env.local)
- From Address: `RESEND_FROM_EMAIL` = "HUSTLE <thankyou@intentsolutions.io>"
- Reply-To: jeremy@intentsolutions.io

**DNS Setup**: ✅ **Verified**
- Domain: intentsolutions.io
- DNS records configured for SPF, DKIM, DMARC
- Status: Verified in Resend dashboard

### Email Flow

```
Survey Submission
    ↓
API validates email address
    ↓
Check RESEND_API_KEY configured
    ↓
Generate email from template
    ↓
Send via Resend API
    ↓
Log result (success/failure)
    ↓
Continue with API response
(Email failure doesn't block submission)
```

### Email Template

**Location**: `lib/email-templates.ts`

**Content**: Full personal letter from Jeremy

**Sections**:
1. Opening thank you
2. Personal story (restaurant, trucking, AI pivot)
3. Google Cloud Startup Program
4. Soccer dad motivation
5. The problem (recruitment stats chaos)
6. The solution (HUSTLE vision)
7. Feature roadmap
8. Beta testing details
9. Contact information

**Styling**: Gray monochrome theme
- Header: Gradient background (#374151 to #1f2937)
- Body: Professional layout with cards
- Responsive: Mobile-optimized
- Accessibility: Semantic HTML, proper contrast

**Format**: Both HTML and plain text versions

### Testing Emails

**Recommended Method**:
```bash
npx tsx test-email-real.ts
```

This uses the actual email template from `lib/email-templates.ts` and sends to jeremy@intentsolutions.io.

**Output**:
- Email ID from Resend
- Delivery confirmation
- Link to view in Resend dashboard

**Troubleshooting**:
- Check `RESEND_API_KEY` is set in `.env.local`
- Verify `RESEND_FROM_EMAIL` uses verified domain
- Review Resend dashboard for delivery status

### Graceful Degradation

If Resend is not configured:
- API logs warning
- Survey submission still succeeds
- `emailSent: false` returned in response
- No exception thrown

This allows development without email configured.

---

## Deployment Workflows

### Current Deployment Status

**❌ Next.js API Backend**: Not deployed
**✅ Astro Frontend**: Live on Netlify

### Netlify Deployment (Astro Survey)

**Repository**: `/home/jeremy/projects/intent-solutions-landing/`
**Site**: https://intentsolutions.io
**Build Directory**: `astro-site/`

**Deployment Trigger**:
```bash
cd /home/jeremy/projects/intent-solutions-landing/astro-site
git add .
git commit -m "Update survey"
git push origin main
```

Netlify auto-deploys on push to `main`.

**Build Configuration** (`netlify.toml`):
```toml
[build]
  base = "astro-site"
  command = "bun run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  BUN_VERSION = "1.0.0"
```

**Manual Deploy**:
```bash
cd /home/jeremy/projects/intent-solutions-landing/astro-site
bun run build
netlify deploy --prod
```

**Deploy Time**: ~30-60 seconds
**CDN Propagation**: Immediate (Netlify Edge)

### Future: Google Cloud Run Deployment (Next.js API)

**⚠️ NOT YET CONFIGURED**

When ready to deploy, would follow this pattern:

**Create Deployment Workflow**:

`.github/workflows/deploy-survey-api.yml`:
```yaml
name: Deploy Survey API to Cloud Run

on:
  push:
    branches:
      - main
    paths:
      - '08-Survey/survey-app/**'

env:
  PROJECT_ID: hustle-dev-202510
  REGION: us-central1
  SERVICE_NAME: hustle-survey-api

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy hustle-survey-api \
            --source ./08-Survey/survey-app \
            --region=${{ env.REGION }} \
            --platform=managed \
            --allow-unauthenticated \
            --vpc-connector=hustle-vpc-connector \
            --service-account=hustle-cloudrun-sa@${{ env.PROJECT_ID }}.iam.gserviceaccount.com \
            --update-secrets="DATABASE_URL=database-url:latest,RESEND_API_KEY=resend-api-key:latest" \
            --set-env-vars="NEXTAUTH_URL=https://hustlesurvey.intentsolutions.io,NODE_ENV=production" \
            --max-instances=10 \
            --min-instances=0 \
            --memory=512Mi \
            --cpu=1 \
            --timeout=60 \
            --concurrency=80
```

**Required Secrets in Secret Manager**:
- `database-url`: PostgreSQL connection string
- `resend-api-key`: Resend API key
- `nextauth-secret`: NextAuth secret
- `groq-api-key`: Groq API key

**Domain Mapping**:
```bash
gcloud run services add-iam-policy-binding hustle-survey-api \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"

gcloud beta run domain-mappings create \
  --service=hustle-survey-api \
  --domain=hustlesurvey.intentsolutions.io \
  --region=us-central1
```

### Local Development

**Prerequisites**:
- Node.js 20+
- npm or bun
- PostgreSQL access (shared database)
- Resend API key (optional, for email testing)

**Setup**:
```bash
# Clone repository
cd /home/jeremy/projects/hustle/08-Survey/survey-app

# Install dependencies
npm install

# Create .env.local (copy from template)
cp .env.example .env.local
# Edit .env.local with actual values

# Generate Prisma client
npx prisma generate

# Push schema to database (if needed)
npx prisma db push

# Start development server
npm run dev
```

**Development Server**: http://localhost:3000

**API Endpoint**: http://localhost:3000/api/survey/submit

**Hot Reload**: Turbopack enables fast hot reload (<200ms)

### Testing Workflow

**Before Deployment**:

1. **Unit Tests**: (⚠️ Not yet implemented)
2. **Integration Tests**: Run smoke test
   ```bash
   ./smoke-test.sh
   ```
3. **Email Test**:
   ```bash
   npx tsx test-email-real.ts
   ```
4. **Database Test**:
   ```bash
   npx prisma studio
   # Verify schema and data
   ```
5. **Build Test**:
   ```bash
   npm run build
   npm start
   # Verify production build works
   ```

### Deployment Checklist

**Pre-Deployment**:
- [ ] All environment variables configured in Secret Manager
- [ ] Database migrations tested
- [ ] Email sending verified
- [ ] API endpoints tested
- [ ] Health check endpoint implemented
- [ ] Monitoring configured
- [ ] Rollback plan documented

**Deployment**:
- [ ] Push to main branch (triggers GitHub Actions)
- [ ] Monitor deployment logs
- [ ] Verify health check passes
- [ ] Test API endpoint in production
- [ ] Verify email sending works
- [ ] Check database connectivity

**Post-Deployment**:
- [ ] Monitor error rates
- [ ] Check email delivery rates
- [ ] Verify survey submissions working
- [ ] Review logs for issues

---

## Environment Configuration

### Environment Variables

**Required**:
```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
RESEND_API_KEY="re_xxxxx"
RESEND_FROM_EMAIL="HUSTLE <thankyou@intentsolutions.io>"
```

**Optional**:
```bash
GROQ_API_KEY="gsk_xxxxx"               # For future AI analysis
NEXTAUTH_SECRET="xxx"                   # For future authentication
NEXTAUTH_URL="https://your-domain.com"  # For future authentication
NODE_ENV="development"                  # Environment
NEXT_PUBLIC_SITE_URL="https://your-domain.com"  # Public URL
```

### Local Development (.env.local)

```bash
# Database (PostgreSQL - shared with Hustle MVP)
DATABASE_URL="postgresql://hustle_admin:PASSWORD@10.240.0.3:5432/hustle_mvp"

# Groq API (free tier)
GROQ_API_KEY="gsk_xxxxx"

# NextAuth (future use)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://hustlesurvey.intentsolutions.io"

# Node environment
NODE_ENV="development"

# Public URL
NEXT_PUBLIC_SITE_URL="https://hustlesurvey.intentsolutions.io"

# Resend Email Service
RESEND_API_KEY="re_xxxxx"
RESEND_FROM_EMAIL="HUSTLE <thankyou@intentsolutions.io>"
```

### Production Environment (Cloud Run)

**Set via Secret Manager**:
```bash
# Create secrets
gcloud secrets create resend-api-key --data-file=- <<< "re_xxxxx"
gcloud secrets create database-url --data-file=- <<< "postgresql://..."
gcloud secrets create nextauth-secret --data-file=- <<< "xxx"
gcloud secrets create groq-api-key --data-file=- <<< "gsk_xxx"
```

**Mount in Cloud Run**:
```bash
--update-secrets="
  DATABASE_URL=database-url:latest,
  RESEND_API_KEY=resend-api-key:latest,
  NEXTAUTH_SECRET=nextauth-secret:latest,
  GROQ_API_KEY=groq-api-key:latest
"
```

**Set via environment variables**:
```bash
--set-env-vars="
  NEXTAUTH_URL=https://hustlesurvey.intentsolutions.io,
  NODE_ENV=production,
  RESEND_FROM_EMAIL=HUSTLE <thankyou@intentsolutions.io>
"
```

### Security Best Practices

**Local Development**:
- ✅ Use `.env.local` (gitignored)
- ❌ Never commit `.env.local` to git
- ✅ Use `.env.example` as template (no real values)

**Production**:
- ✅ Store secrets in Google Secret Manager
- ✅ Use IAM for service account permissions
- ✅ Rotate secrets periodically
- ✅ Audit secret access

**Current Issues**:
- ⚠️ Database password hardcoded in .env.local
- ⚠️ Secrets committed to git history (need rotation)
- ⚠️ No secret rotation policy

---

## Monitoring & Observability

### Current State

**⚠️ NOT CONFIGURED**

No monitoring, logging, or alerting is currently set up.

### Recommended Monitoring Setup

**Google Cloud Operations** (when deployed to Cloud Run):

1. **Logging**:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision \
     AND resource.labels.service_name=hustle-survey-api" \
     --limit 50 --format json
   ```

2. **Metrics**:
   - Request count
   - Response latency (P50, P95, P99)
   - Error rate
   - Email delivery rate
   - Database connection pool usage

3. **Dashboards**:
   - API health dashboard
   - Email delivery dashboard
   - Database performance dashboard

4. **Alerts**:
   - Error rate > 5% (P1)
   - Response latency P95 > 5s (P2)
   - Email delivery failure > 10% (P2)
   - Database connection failures (P1)

### Application Logging

**Current Implementation**: Console logging

```typescript
console.log('[API] Survey submitted successfully:', surveyResponse.id);
console.error('[API] Survey submission error:', error);
console.warn('[API] Email service not configured');
```

**Recommended**: Structured logging with context

```typescript
import { logger } from './lib/logger';

logger.info('survey.submitted', {
  surveyId: response.id,
  email: response.email,
  hasEmail: !!emailSent
});
```

### Health Checks

**Current**: No health check endpoint

**Recommended** (`app/api/health/route.ts`):
```typescript
export async function GET() {
  // Test database
  const dbHealthy = await prisma.$queryRaw`SELECT 1`;

  // Test email (optional)
  const emailHealthy = isEmailConfigured();

  return Response.json({
    status: 'ok',
    database: dbHealthy ? 'connected' : 'disconnected',
    email: emailHealthy ? 'configured' : 'not configured',
    timestamp: new Date().toISOString()
  });
}
```

---

## Security & Access Management

### Authentication & Authorization

**Current State**: ⚠️ **NO AUTHENTICATION**

API endpoints are publicly accessible (intentional for survey submission).

**Future**: NextAuth integration for admin endpoints

### Secrets Management

**Local Development**:
- Secrets in `.env.local` (gitignored)
- ⚠️ Some secrets committed to git history

**Production** (when deployed):
- Google Secret Manager
- IAM-based access control
- Automatic secret rotation

### Network Security

**Database**:
- Private IP: 10.240.0.3 (VPC)
- No public exposure
- Connection via VPC connector (when deployed to Cloud Run)

**API**:
- HTTPS only (enforced by Cloud Run)
- CORS configured for intentsolutions.io

### Data Security

**PII Storage**:
- Email addresses (required for beta testing invitations)
- Phone numbers (optional)
- Survey responses (may contain personal info)

**Compliance**:
- GDPR: Not yet addressed
- CCPA: Not yet addressed
- Data retention: No policy defined

**Recommendations**:
1. Add privacy policy acceptance to survey
2. Implement data deletion on request
3. Encrypt sensitive fields at rest
4. Define data retention policy (suggest 2 years)

### API Security

**Current**:
- No rate limiting
- No input validation (beyond TypeScript types)
- No CSRF protection

**Recommendations**:
1. Implement rate limiting (per IP)
2. Add Zod schema validation
3. Add CSRF tokens for form submissions
4. Implement request signing for API calls

### Resend Security

**Domain Verification**: ✅ Complete
- SPF record: ✅ Configured
- DKIM: ✅ Configured
- DMARC: ✅ Configured

**API Key Security**:
- Stored in environment variables
- Not exposed to client
- ⚠️ No rotation policy

---

## Development Workflow

### Local Development Setup

**1. Prerequisites**:
```bash
# Verify Node.js
node --version  # Should be 20+

# Verify npm
npm --version

# Optional: Install bun (faster than npm)
curl -fsSL https://bun.sh/install | bash
```

**2. Clone and Setup**:
```bash
cd /home/jeremy/projects/hustle/08-Survey/survey-app

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with actual values

# Generate Prisma client
npx prisma generate
```

**3. Database Setup**:
```bash
# Push schema (development)
npx prisma db push

# Or create migration (production)
npx prisma migrate dev --name init

# Open Prisma Studio
npx prisma studio
```

**4. Start Development Server**:
```bash
npm run dev

# Server starts on http://localhost:3000
# API available at http://localhost:3000/api/survey/submit
```

### Development Commands

```bash
# Development server with Turbopack (fast HMR)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name description

# Open database GUI
npx prisma studio

# Test email
npx tsx test-email-real.ts

# Test Resend connectivity
node test-resend.js

# Test Groq AI
node test-groq.js
```

### Code Quality

**Linting**:
- ESLint 9.x
- Config: `eslint.config.mjs`
- Run: `npm run lint`

**Type Checking**:
- TypeScript strict mode
- Run: `npx tsc --noEmit`

**Formatting**: ⚠️ **Not configured**
- Recommendation: Add Prettier

**Pre-commit Hooks**: ⚠️ **Not configured**
- Recommendation: Add Husky + lint-staged

### Git Workflow

**Current**:
- Single main branch
- Direct commits to main
- No pull request process

**Recommended** (for team):
1. Feature branches: `feature/survey-ai-analysis`
2. Pull requests with review
3. Automated checks (lint, type check, tests)
4. Squash merge to main

---

## Dependencies & Supply Chain

### Direct Dependencies

**Production**:
```json
{
  "@hookform/resolvers": "^5.2.2",       // Form validation resolver
  "@prisma/client": "^6.16.3",           // Database ORM client
  "@react-email/render": "^1.3.2",       // Email template rendering
  "bcrypt": "^6.0.0",                    // Password hashing (future)
  "dotenv": "^17.2.3",                   // Environment variables
  "groq-sdk": "^0.33.0",                 // Groq AI SDK (future)
  "next": "15.5.4",                      // Next.js framework
  "next-auth": "^4.24.11",               // Authentication (future)
  "prisma": "^6.16.3",                   // Prisma CLI
  "react": "19.1.0",                     // React library
  "react-dom": "19.1.0",                 // React DOM
  "react-hook-form": "^7.64.0",          // Form management
  "resend": "^6.1.2",                    // Email API client
  "zod": "^4.1.12"                       // Schema validation
}
```

**Development**:
```json
{
  "@eslint/eslintrc": "^3",              // ESLint config
  "@tailwindcss/postcss": "^4",          // Tailwind PostCSS
  "@types/bcrypt": "^6.0.0",             // TypeScript types
  "@types/node": "^20",                  // Node.js types
  "@types/react": "^19",                 // React types
  "@types/react-dom": "^19",             // React DOM types
  "eslint": "^9",                        // Linter
  "eslint-config-next": "15.5.4",        // Next.js ESLint config
  "tailwindcss": "^4",                   // CSS framework
  "tsx": "^4.20.6",                      // TypeScript executor
  "typescript": "^5"                     // TypeScript compiler
}
```

### Security Vulnerabilities

**Check**:
```bash
npm audit

# Fix automatically
npm audit fix
```

**Current Status**: ⚠️ **Not recently audited**

**Recommendation**: Run `npm audit` weekly

### License Compliance

All dependencies use permissive licenses:
- MIT (majority)
- Apache 2.0
- BSD

**Risk**: Low - no GPL or restrictive licenses

### Update Strategy

**Current**: Manual updates when needed

**Recommended**:
1. Dependabot (automated PRs for updates)
2. Weekly dependency review
3. Automated security updates
4. Major version updates quarterly

---

## Troubleshooting Guide

### Common Issues

#### Issue: "Cannot find module '@prisma/client'"

**Cause**: Prisma client not generated

**Solution**:
```bash
npx prisma generate
```

#### Issue: "Database connection failed"

**Cause**: Wrong DATABASE_URL or database not accessible

**Solution**:
1. Check `.env.local` has correct DATABASE_URL
2. Verify database is running: `pg_isready -h 10.240.0.3`
3. Test connection: `psql -h 10.240.0.3 -U hustle_admin -d hustle_mvp`

#### Issue: "Email not sending"

**Causes**:
1. RESEND_API_KEY not set
2. Domain not verified
3. Invalid from address

**Solution**:
```bash
# Test Resend
node test-resend.js

# Check environment
echo $RESEND_API_KEY

# Verify domain in Resend dashboard
https://resend.com/domains
```

#### Issue: "Duplicate email error"

**Cause**: Email already exists in database

**Solution**:
- This is intentional (unique constraint)
- User can only submit once per email
- Delete old entry to resubmit:
  ```sql
  DELETE FROM survey_responses WHERE email = 'user@example.com';
  ```

#### Issue: "Next.js cache issues after Prisma schema change"

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Restart dev server
npm run dev
```

### Logs & Debugging

**Development Logs**:
```bash
# Next.js logs in terminal
npm run dev

# Check for errors in console
```

**Production Logs** (when deployed):
```bash
# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=hustle-survey-api" \
  --limit 50
```

**Database Logs**:
```bash
# PostgreSQL logs (if accessible)
tail -f /var/log/postgresql/postgresql-15-main.log
```

### Performance Issues

**Slow Database Queries**:
```bash
# Check query performance
npx prisma studio
# Use query analyzer
```

**Slow Email Sending**:
- Check Resend dashboard for delivery metrics
- Verify DNS records not causing delays

---

## Current State Assessment

### What's Working Well

**✅ Solid Foundation**:
- Modern Next.js 15 with App Router
- Type-safe Prisma ORM
- Clean separation of concerns
- Good documentation (CLAUDE.md)

**✅ Email Integration**:
- Resend properly configured
- DNS verified
- Professional email templates
- Graceful degradation

**✅ Database Design**:
- Efficient hybrid structure (indexed fields + JSON)
- Proper indexing
- Shared database integration works

**✅ Development Experience**:
- Fast Turbopack builds
- Good local development setup
- Clear environment configuration

### Areas Needing Attention

**❌ Not Deployed**:
- Next.js API backend not in production
- No CI/CD pipeline configured
- No production environment

**❌ Missing Monitoring**:
- No logging infrastructure
- No metrics collection
- No alerting
- No health checks

**❌ No Testing**:
- Zero unit tests
- No integration tests
- smoke-test.sh exists but minimal
- No CI test automation

**❌ Security Gaps**:
- No rate limiting
- No input validation beyond types
- Secrets in git history
- No security headers
- No CORS configuration
- No CSRF protection

**❌ Missing Documentation**:
- No API documentation
- No schema documentation
- No runbook for incidents
- No architecture diagrams

**❌ Technical Debt**:
- Unused Next.js survey pages (replaced by Astro)
- Duplicate email testing scripts
- No dependency update strategy
- No backup strategy

### Immediate Priorities

**Priority 1: Deploy to Production** 🔥
- Set up Cloud Run deployment
- Configure secrets in Secret Manager
- Create GitHub Actions workflow
- Set up custom domain
- **Why**: Can't collect real survey responses without deployed API
- **Effort**: 4-8 hours

**Priority 2: Add Monitoring** 🔥
- Implement health check endpoint
- Set up Cloud Logging
- Create basic dashboard
- Configure critical alerts
- **Why**: Can't operate in production without visibility
- **Effort**: 2-4 hours

**Priority 3: Security Hardening** ⚠️
- Add rate limiting
- Implement Zod validation
- Configure CORS properly
- Rotate exposed secrets
- **Why**: Prevent abuse and data issues
- **Effort**: 4-6 hours

**Priority 4: Testing** ⚠️
- Add unit tests for API routes
- Add integration tests
- Set up CI test automation
- **Why**: Prevent regressions, build confidence
- **Effort**: 6-10 hours

**Priority 5: Cleanup** 📝
- Remove unused survey pages
- Consolidate email test scripts
- Document API endpoints
- Create architecture diagrams
- **Why**: Reduce confusion, improve maintainability
- **Effort**: 2-3 hours

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev                          # Start dev server
npm run build                        # Production build
npm start                            # Start production server

# Database
npx prisma generate                  # Generate Prisma client
npx prisma db push                   # Push schema (dev)
npx prisma migrate dev               # Create migration
npx prisma studio                    # Database GUI

# Testing
npx tsx test-email-real.ts          # Test email with real template
node test-resend.js                  # Test Resend API
node test-groq.js                    # Test Groq AI
./smoke-test.sh                      # Integration tests

# Linting
npm run lint                         # Run ESLint

# Deployment (Netlify - Astro version)
cd /home/jeremy/projects/intent-solutions-landing/astro-site
bun run build
netlify deploy --prod
```

### Critical URLs

**Production**:
- Survey Frontend: https://intentsolutions.io/survey/
- Thank You Page: https://intentsolutions.io/survey/thank-you/
- API Backend: ❌ Not deployed (would be https://hustlesurvey.intentsolutions.io)

**Development**:
- Local API: http://localhost:3000/api/survey/submit
- Prisma Studio: http://localhost:5555

**External Services**:
- Resend Dashboard: https://resend.com/emails
- Google Cloud Console: https://console.cloud.google.com
- Netlify Dashboard: https://app.netlify.com

### Key File Locations

**Configuration**:
- Environment: `.env.local`
- Database Schema: `prisma/schema.prisma`
- Next.js Config: `next.config.ts`
- TypeScript Config: `tsconfig.json`
- ESLint Config: `eslint.config.mjs`

**Source Code**:
- API Endpoint: `app/api/survey/submit/route.ts`
- Email Template: `lib/email-templates.ts`
- Email Service: `lib/email.ts`
- Survey Data: `lib/survey-data.ts`

**Documentation**:
- This Guide: `DEVOPS_GUIDE.md`
- Project README: `README.md`
- AI Assistant Guide: `CLAUDE.md`

### First Day Checklist

**Access**:
- [ ] Repository cloned
- [ ] .env.local configured
- [ ] Database connection tested
- [ ] Resend API key verified

**Setup**:
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Dev server runs (`npm run dev`)
- [ ] Can access Prisma Studio

**Testing**:
- [ ] Email test successful (`npx tsx test-email-real.ts`)
- [ ] API endpoint works (POST to /api/survey/submit)
- [ ] Database queries work

**Documentation**:
- [ ] Read this guide
- [ ] Read CLAUDE.md
- [ ] Understand dual deployment (Astro + Next.js)
- [ ] Review Prisma schema

### Emergency Contacts

**Technical**:
- Jeremy Longshore: jeremy@intentsolutions.io

**Services**:
- Resend Support: https://resend.com/support
- Google Cloud Support: (via console)
- Netlify Support: https://www.netlify.com/support/

---

## Appendices

### A. Glossary

**Terms**:
- **Astro**: Static site generator used for survey frontend
- **Turbopack**: Next.js build tool (faster than Webpack)
- **Prisma**: TypeScript ORM for database access
- **Resend**: Email API service
- **Groq**: Fast LLM inference API
- **Cloud Run**: Google Cloud serverless container platform
- **Netlify**: Static site hosting and deployment
- **VPC Connector**: Private network connection for Cloud Run
- **Secret Manager**: Google Cloud service for storing secrets

### B. Database Schema Reference

**SurveyResponse Model**:

```typescript
interface SurveyResponse {
  // Identity
  id: string;                    // cuid
  email: string;                 // unique
  phone?: string;

  // Demographics (extracted)
  numAthletes?: number;
  grades?: string[];             // JSON array
  sports?: string[];             // JSON array
  hoursPerWeek?: string;
  recruitmentStatus?: string;
  location?: string;

  // Full survey data
  responses: Record<string, any>; // All 68 responses

  // Progress
  currentSection: number;         // 1-15
  completed: boolean;

  // AI Analysis (future)
  aiScore?: number;               // 0-100
  aiSummary?: string;
  aiSegment?: string;
  betaPriority?: 'HIGH' | 'MEDIUM' | 'LOW';
  aiStrengths?: string[];
  aiConcerns?: string[];
  aiRecommendations?: string[];

  // Timestamps
  submittedAt?: Date;
  analyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### C. API Reference

**POST /api/survey/submit**

Request Body:
```json
{
  "email": "user@example.com",
  "phone": "+1234567890",
  "numAthletes": "2",
  "grades": ["9th", "11th"],
  "sports": ["Soccer", "Basketball"],
  "hoursPerWeek": "10-15 hours",
  "recruitmentStatus": "Interested in college recruitment",
  "location": "California",
  "consent": "Yes, I'm in!",
  "q1": "Response to question 1",
  "q2": "Response to question 2",
  // ... all 68 questions
}
```

Response (Success):
```json
{
  "success": true,
  "submissionId": "clxxx123456789",
  "message": "Survey submitted successfully",
  "emailSent": true
}
```

Response (Duplicate Email):
```json
{
  "error": "Duplicate submission",
  "message": "This email has already been used to submit a survey."
}
```

Response (Server Error):
```json
{
  "error": "Failed to submit survey",
  "message": "Error details here"
}
```

### D. Environment Variables Reference

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| DATABASE_URL | ✅ | PostgreSQL connection | postgresql://user:pass@host:5432/db |
| RESEND_API_KEY | ✅ | Email sending | re_xxxxx |
| RESEND_FROM_EMAIL | ✅ | Email from address | HUSTLE <thankyou@intentsolutions.io> |
| GROQ_API_KEY | ❌ | AI analysis (future) | gsk_xxxxx |
| NEXTAUTH_SECRET | ❌ | Auth (future) | random-32-byte-string |
| NEXTAUTH_URL | ❌ | Auth (future) | https://your-domain.com |
| NODE_ENV | ❌ | Environment | development/production |
| NEXT_PUBLIC_SITE_URL | ❌ | Public URL | https://your-domain.com |

### E. Change Management

**Keeping This Document Updated**:

When making system changes, update the relevant sections:

**Code Changes**:
- Update Directory Structure section
- Update API Reference if endpoints change
- Update Dependencies section if adding/removing packages

**Deployment Changes**:
- Update Deployment Workflows section
- Update Environment Configuration
- Update Quick Reference commands

**Infrastructure Changes**:
- Update System Architecture
- Update Deployment Architecture
- Update Security & Access Management

**Version Control**:
```bash
# Update version in this document header
# Commit with meaningful message
git add DEVOPS_GUIDE.md
git commit -m "docs: update DevOps guide - add monitoring section"
```

---

*Last Updated: 2025-10-08*
*Document Version: 1.0.0*
*Maintained By: DevOps Team*
