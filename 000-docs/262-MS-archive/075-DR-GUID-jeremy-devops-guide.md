# HUSTLE - Complete DevOps System Analysis & Onboarding Guide

**Version:** 1.0.0
**Date:** 2025-10-07
**Purpose:** Comprehensive DevOps reference for system architecture, infrastructure, deployment workflows, and operational procedures
**Audience:** DevOps engineers, system administrators, technical leads
**Live Production URL:** https://hustle-app-158864638007.us-central1.run.app
**Project Status:** Gate A Milestone Complete (Authentication, Landing Page, Dashboard, Cloud Run Deployment)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Cloud Services & Infrastructure](#3-cloud-services--infrastructure)
4. [Directory Structure Deep-Dive](#4-directory-structure-deep-dive)
5. [Operational Reference](#5-operational-reference)
6. [Security & Access Management](#6-security--access-management)
7. [Cost & Performance Metrics](#7-cost--performance-metrics)
8. [Development Workflow](#8-development-workflow)
9. [Dependencies & Integrations](#9-dependencies--integrations)
10. [Current State Assessment](#10-current-state-assessment)
11. [Quick Reference](#11-quick-reference)

---

## 1. Executive Summary

### 1.1 What is Hustle?

**Hustle** is a Next.js-based web application for tracking soccer player statistics for high school athletes (grades 8-12). Parents create accounts, manage player profiles, log game statistics, and track performance over time with verification capabilities.

**Core Value Proposition:**
- Parents log their child's game statistics (goals, assists, saves, minutes played)
- Verification workflow ensures data accuracy
- Performance tracking over time
- Recruitment-ready statistics export (future)

### 1.2 System Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                             │
│                  https://hustle-app-*.run.app                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD RUN                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         Next.js 15 App (Docker Container)                  │ │
│  │  - App Router architecture                                 │ │
│  │  - NextAuth v5 session management                          │ │
│  │  - Server-side rendering + API routes                      │ │
│  │  - Port: 8080 (internal)                                   │ │
│  └────────────────────┬──────────────────────────────────────┘ │
└───────────────────────┼────────────────────────────────────────┘
                        │
                        │ VPC Connector (10.8.0.0/28)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CLOUD SQL POSTGRESQL                        │
│  - Version: PostgreSQL 15                                       │
│  - Tier: db-g1-small (1.7GB RAM)                               │
│  - Private IP: 10.240.0.3:5432                                 │
│  - Database: hustle_mvp                                         │
│  - User: hustle_admin                                           │
│  - Models: User, Player, Game, Account, Session                │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Deployment Model

**Infrastructure:** Google Cloud Platform (GCP)
**Deployment Target:** Cloud Run (serverless containers)
**Database:** Cloud SQL PostgreSQL with private VPC connectivity
**IaC Tool:** Terraform (infrastructure definitions in `/06-Infrastructure/terraform/`)
**Container Registry:** Google Artifact Registry
**Build Tool:** Docker multi-stage builds with Node.js 22 Alpine

### 1.4 Current Production Status

| Milestone | Status | Completion Date |
|-----------|--------|-----------------|
| Gate A: Authentication & Landing | ✅ Complete | 2025-10-05 |
| Database Schema | ✅ Complete | 2025-10-05 |
| Cloud Run Deployment | ✅ Complete | 2025-10-05 |
| NextAuth v5 Integration | ✅ Complete | 2025-10-05 |
| Dashboard UI | ✅ Complete | 2025-10-05 |
| Player Management | 🚧 In Progress | TBD |
| Game Logging | 🚧 In Progress | TBD |
| Verification Workflow | ⏸️ Planned | TBD |

**Live Production URL:** https://hustle-app-158864638007.us-central1.run.app

---

## 2. Technology Stack

### 2.1 Complete Technology Matrix

| Layer | Technology | Version | Purpose | Configuration |
|-------|-----------|---------|---------|---------------|
| **Frontend Framework** | Next.js | 15.5.4 | React framework with App Router | `next.config.ts` |
| **Frontend Language** | TypeScript | 5.7.3 | Type-safe development | `tsconfig.json` (strict mode) |
| **React Version** | React | 19.1.0 | UI library | Latest stable |
| **Authentication** | NextAuth | 5.0.0-beta.29 | Session management | JWT strategy, Prisma adapter |
| **Database ORM** | Prisma | 6.2.2 | Type-safe database client | `prisma/schema.prisma` |
| **Database** | PostgreSQL | 15 | Primary data store | Cloud SQL managed service |
| **UI Framework** | Tailwind CSS | 3.4.17 | Utility-first styling | `tailwind.config.ts` |
| **UI Components** | shadcn/ui | Latest | Radix UI primitives | `/src/components/ui/` |
| **State Management** | Zustand | 5.0.3 | Client state | Minimal usage currently |
| **Password Hashing** | bcrypt | 5.1.1 | Secure password storage | 10 rounds salt |
| **Containerization** | Docker | 20+ | Application packaging | Multi-stage builds |
| **Cloud Platform** | Google Cloud | N/A | Infrastructure | GCP project: hustle-dev-202510 |
| **Serverless Runtime** | Cloud Run | Gen 2 | Container hosting | Auto-scaling 0-10 instances |
| **IaC Tool** | Terraform | 1.0+ | Infrastructure management | `/06-Infrastructure/terraform/` |
| **Node.js Runtime** | Node.js | 22 Alpine | Application server | Production container |

### 2.2 Key Dependencies

**Production Dependencies:**
```json
{
  "@auth/prisma-adapter": "^2.7.4",
  "@prisma/client": "^6.2.2",
  "@radix-ui/*": "^1.x.x",
  "bcrypt": "^5.1.1",
  "lucide-react": "^0.468.0",
  "next": "15.5.4",
  "next-auth": "5.0.0-beta.29",
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "zustand": "^5.0.3"
}
```

**Development Dependencies:**
```json
{
  "@types/node": "^22",
  "@types/react": "^19",
  "eslint": "^9",
  "eslint-config-next": "15.5.4",
  "postcss": "^8",
  "tailwindcss": "^3.4.17",
  "typescript": "^5"
}
```

### 2.3 Build & Development Tools

**Package Manager:** npm (lockfile: package-lock.json)
**TypeScript Compiler:** tsc 5.7.3 (ES2017 target)
**Next.js Build:** Turbopack (default in Next.js 15)
**Linter:** ESLint 9 with Next.js config
**Docker Base Image:** node:22-alpine (multi-stage build)

---

## 3. Cloud Services & Infrastructure

### 3.1 Google Cloud Platform Architecture

**GCP Project ID:** `hustle-dev-202510`
**Default Region:** `us-central1`
**Default Zone:** `us-central1-a`

### 3.2 Core GCP Services in Use

#### 3.2.1 Cloud Run (Application Hosting)

**Service Name:** `hustle-app`
**Revision:** Auto-generated (timestamp-based)
**Region:** us-central1
**Platform:** Managed (fully serverless)

**Configuration:**
- **Concurrency:** 80 requests per instance (default)
- **Max Instances:** 10 (cost control)
- **Min Instances:** 0 (scale to zero when idle)
- **Memory:** 512 MiB (default)
- **CPU:** 1 vCPU (default)
- **Request Timeout:** 300 seconds
- **Port:** 8080 (container listens on this port)
- **Authentication:** Allow unauthenticated (public access)

**Environment Variables:**
```bash
DATABASE_URL=postgresql://hustle_admin:PASSWORD@10.240.0.3:5432/hustle_mvp
NEXTAUTH_SECRET=<JWT_SECRET>
NEXTAUTH_URL=https://hustle-app-158864638007.us-central1.run.app
NODE_ENV=production
```

**VPC Connectivity:**
- **VPC Connector:** `hustle-vpc-connector`
- **Connector IP Range:** 10.8.0.0/28
- **Purpose:** Private access to Cloud SQL database

**IAM Service Account:**
- **Email:** `hustle-cloudrun-sa@hustle-dev-202510.iam.gserviceaccount.com`
- **Roles:**
  - `roles/cloudsql.client` (database access)
  - `roles/storage.objectAdmin` (future GCS access)

#### 3.2.2 Cloud SQL (Database)

**Instance Name:** `hustle-db`
**Database Version:** PostgreSQL 15
**Tier:** db-g1-small (1.7GB RAM, shared CPU)
**Availability:** ZONAL (single zone, no HA)
**Disk Type:** PD-HDD (standard spinning disk)
**Disk Size:** 10 GB (minimum)

**Network Configuration:**
- **Private IP:** 10.240.0.3 (VPC-internal only)
- **Public IP:** Disabled (security best practice)
- **VPC Network:** `hustle-vpc`
- **Private Service Connection:** Enabled

**Database Details:**
- **Database Name:** `hustle_mvp`
- **User:** `hustle_admin`
- **Password:** Stored in `/06-Infrastructure/terraform/.creds/db_password.txt`

**Backup Configuration:**
- **Automated Backups:** DISABLED (dev environment cost optimization)
- **Point-in-Time Recovery:** DISABLED

**Connection String:**
```
postgresql://hustle_admin:PASSWORD@10.240.0.3:5432/hustle_mvp
```

#### 3.2.3 VPC Network

**VPC Name:** `hustle-vpc`
**Subnet Name:** `hustle-public-subnet`
**Subnet CIDR:** 10.10.1.0/24
**Region:** us-central1

**Private Service Connection:**
- **Peering Name:** `servicenetworking-googleapis-com`
- **Address Range:** 10.240.0.0/16 (reserved for Cloud SQL)

**VPC Connector for Cloud Run:**
- **Name:** `hustle-vpc-connector`
- **IP Range:** 10.8.0.0/28 (16 IPs)
- **Machine Type:** e2-micro (cost optimized)

#### 3.2.4 Artifact Registry (Container Images)

**Repository:** Default Artifact Registry
**Format:** Docker
**Location:** us-central1
**Image:** `gcr.io/hustle-dev-202510/hustle-app:latest`

**Image Build Process:**
```bash
# Cloud Run builds from source automatically
gcloud run deploy hustle-app --source . --region us-central1
```

#### 3.2.5 IAM & Service Accounts

**Cloud Run Service Account:**
- **Name:** `hustle-cloudrun-sa`
- **Email:** `hustle-cloudrun-sa@hustle-dev-202510.iam.gserviceaccount.com`
- **Purpose:** Workload Identity for Cloud Run services
- **Permissions:**
  - Cloud SQL Client (database connectivity)
  - Storage Object Admin (future GCS media uploads)

**Terraform Service Account:**
- **Name:** `terraform-sa`
- **Purpose:** Infrastructure provisioning
- **Permissions:**
  - Compute Admin
  - Cloud SQL Admin
  - Storage Admin
  - Service Networking Admin
  - IAM Service Account User

### 3.3 Cost Optimization Strategy

**Current Monthly Cost Estimate: ~$15-20**

| Service | Configuration | Est. Cost/Month |
|---------|---------------|-----------------|
| Cloud Run | 0 min instances, scale to zero | $0-2 (minimal traffic) |
| Cloud SQL db-g1-small | ZONAL, HDD disk, no backups | $8-10 |
| VPC Connector | e2-micro machine type | $5-7 |
| Network Egress | Minimal traffic | $1-3 |
| **Total** | | **$14-22** |

**Cost Control Measures:**
- No high availability (ZONAL only)
- Scale to zero on Cloud Run (no idle charges)
- Standard HDD disk (not SSD)
- Backups disabled (dev environment)
- Small machine types (db-g1-small, e2-micro)

---

## 4. Directory Structure Deep-Dive

### 4.1 Root Directory Layout

```
/home/jeremy/projects/hustle/
├── .directory-standards.md          # Master directory standards
├── .dockerignore                    # Docker build exclusions
├── .env.example                     # Environment variable template
├── .gitignore                       # Git exclusions
├── .next/                          # Next.js build output (gitignored)
├── 01-Docs/                        # DOCUMENTATION (NNN-abv-description.ext)
├── 03-Tests/                       # Test suites (future)
├── 04-Assets/                      # Static assets and configs
├── 05-Scripts/                     # Automation scripts
├── 06-Infrastructure/              # Docker, Kubernetes, Terraform
├── 07-Releases/                    # Release artifacts (future)
├── 08-Survey/                      # Parent survey application (separate)
├── 99-Archive/                     # Archived code
├── CHANGELOG.md                    # Version history
├── CLAUDE.md                       # AI assistant context
├── claudes-docs/                   # AI-generated docs (gitignored)
├── LICENSE                         # Software license
├── next.config.ts                  # Next.js configuration
├── node_modules/                   # Dependencies (gitignored)
├── package.json                    # NPM dependencies
├── package-lock.json               # Dependency lock file
├── postcss.config.mjs              # PostCSS configuration
├── prisma/                         # Database schema and migrations
├── public/                         # Static files served at /
├── README.md                       # Project overview
├── src/                           # APPLICATION SOURCE CODE
├── tailwind.config.ts             # Tailwind CSS configuration
└── tsconfig.json                  # TypeScript configuration
```

### 4.2 Source Code Structure (`/src/`)

```
src/
├── app/                           # Next.js App Router (routing + pages)
│   ├── api/                       # API routes (server-side endpoints)
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts    # NextAuth handler
│   │   │   └── register/route.ts         # User registration
│   │   ├── db-setup/route.ts             # Database initialization
│   │   ├── games/route.ts                # Game logging API
│   │   ├── healthcheck/route.ts          # Health check endpoint
│   │   ├── hello/route.ts                # Test endpoint
│   │   ├── migrate/route.ts              # Database migration endpoint
│   │   ├── players/
│   │   │   ├── create/route.ts           # Create player
│   │   │   ├── route.ts                  # List players
│   │   │   └── upload-photo/route.ts     # Player photo upload
│   │   └── verify/route.ts               # Game verification
│   ├── dashboard/                 # Protected dashboard pages
│   │   ├── add-athlete/page.tsx          # Add new player form
│   │   ├── analytics/page.tsx            # Analytics (future)
│   │   ├── athletes/page.tsx             # Player list (future)
│   │   ├── layout.tsx                    # Dashboard layout with sidebar
│   │   ├── page.tsx                      # Main dashboard (stats cards)
│   │   └── settings/page.tsx             # Settings (future)
│   ├── games/                     # Game logging pages (future)
│   ├── login/page.tsx             # Login page
│   ├── register/page.tsx          # Registration page
│   ├── verify/page.tsx            # Email verification (future)
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout (metadata, fonts)
│   └── page.tsx                   # Landing page
├── components/                    # React components
│   ├── layout/                    # Layout components (Kiranism dashboard)
│   │   ├── app-sidebar-simple.tsx        # Sidebar navigation
│   │   ├── footer.tsx                    # Footer component
│   │   ├── header.tsx                    # Header component
│   │   └── user-nav.tsx                  # User menu dropdown
│   └── ui/                        # shadcn/ui primitives
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── separator.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       └── tooltip.tsx
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client singleton
│   └── utils.ts                  # Utility functions (cn, etc.)
└── types/                        # TypeScript type definitions
    └── next-auth.d.ts            # NextAuth session extensions
```

### 4.3 Infrastructure Directory (`/06-Infrastructure/`)

```
06-Infrastructure/
├── docker/
│   ├── .dockerignore             # Build exclusions
│   ├── docker-compose.yml        # Local development compose
│   └── Dockerfile                # Multi-stage production build
├── kubernetes/                   # Kubernetes manifests (future)
└── terraform/                    # Infrastructure as Code
    ├── .creds/                   # Credentials (gitignored)
    │   ├── terraform-sa-key.json         # Terraform service account
    │   ├── db_password.txt               # Generated DB password
    │   └── app-service-account-key.json  # App service account
    ├── .gitignore                # Protect secrets
    ├── .terraform/               # Terraform state (gitignored)
    ├── CLAUDE.md                 # Terraform-specific AI context
    ├── README.md                 # Terraform deployment guide
    ├── compute.tf                # Cloud Run configuration
    ├── database.tf               # Cloud SQL PostgreSQL
    ├── main.tf                   # Provider configuration
    ├── network.tf                # VPC, subnets, firewall
    ├── outputs.tf                # Output values
    ├── storage.tf                # GCS bucket (future)
    ├── terraform.tfstate         # Current state (gitignored)
    ├── terraform.tfvars.example  # Variable template
    └── variables.tf              # Variable definitions
```

### 4.4 Documentation Directory (`/01-Docs/`)

**Naming Convention:** `NNN-abv-description.ext`
- **NNN:** Chronological sequence (001, 002, 003...)
- **abv:** Document type abbreviation
  - `prd`: Product Requirements Document
  - `adr`: Architecture Decision Record
  - `log`: Status/Progress Log
  - `ref`: Reference Document
  - `pln`: Plan
  - `bug`: Bug Report
  - `fix`: Fix Documentation
  - `aar`: After Action Review
  - `sec`: Security Documentation
  - `srv`: Service/Feature Documentation
  - `pol`: Policy
  - `sop`: Standard Operating Procedure
  - `dep`: Deployment Documentation

**Key Documents:**
```
01-Docs/
├── 001-prd-hustle-mvp-v1.md              # Original full MVP PRD
├── 002-prd-hustle-mvp-v2-lean.md         # Lean MVP PRD (current)
├── 003-pln-sales-strategy.md             # Sales plan
├── 004-log-infrastructure-setup.md       # Infrastructure setup log
├── 005-log-infrastructure-complete.md    # Infrastructure completion
├── 006-log-billing-quota-fix.md          # Billing quota resolution
├── 007-log-initial-setup-status.md       # Initial setup status
├── 008-log-pre-deployment-status.md      # Pre-deployment status
├── 009-log-nextjs-init.md                # Next.js initialization
├── 010-log-cloud-run-deployment.md       # Cloud Run deployment
├── 011-log-gate-a-milestone.md           # Gate A completion
├── 012-log-game-logging-verification.md  # Game logging feature
├── 013-ref-claudes-docs-archive.md       # AI docs archive
├── 014-ref-deployment-index.md           # Deployment index
├── 015-adr-nextauth-migration.md         # NextAuth v5 migration
├── 016-ref-dashboard-template-diagram.md # Dashboard design
├── 017-ref-devops-system-analysis.md     # DevOps analysis template
├── 018-ref-devops-guide.md               # DevOps guide (previous)
├── 019-ref-app-readme.md                 # App README reference
├── 020-ref-directory-standards.md        # Directory standards
├── 021-bug-auth-404-analysis.md          # Auth 404 bug analysis
├── 022-fix-landing-page-links.md         # Landing page fix
├── 023-fix-registration-api.md           # Registration fix
├── 024-aar-auth-404-fix.md               # Auth fix review
├── 025-test-verification-guide.md        # Testing guide
├── 026-fix-add-athlete-flow.md           # Add athlete fix
├── 027-sec-nextauth-migration-complete.md # NextAuth security
├── 028-aar-complete-nextauth-security-fix.md # Security review
├── 029-srv-parent-survey.md              # Parent survey service
├── 030-bug-auth-404-root-cause.md        # Auth bug root cause
├── 031-bug-auth-404-fix-details.md       # Auth bug fix details
├── 037-pln-product-roadmap.md            # Product roadmap
├── 038-adr-system-architecture.md        # Architecture decisions
├── 039-pol-contribution-guide.md         # Contribution policy
├── 040-ref-version-management.md         # Version management
├── 041-sop-release-process.md            # Release SOP
├── 042-ref-github-pages-index.md         # GitHub Pages index
├── 044-dep-hustle-gcp-deployment.md      # GCP deployment guide
├── JEREMY_DEVOPS_GUIDE.md                # This document
└── survey-remediation/                   # Survey project docs
    ├── issue-001-root-cause-analysis.md
    └── FINAL-SURVEY-REMEDIATION-REPORT.md
```

### 4.5 Database Schema (`/prisma/schema.prisma`)

**Models:**

```prisma
// User Model (Parents)
model User {
  id            String    @id @default(cuid())
  firstName     String
  lastName      String
  email         String    @unique
  emailVerified DateTime?
  phone         String?
  password      String    // bcrypt hashed (10 rounds)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // NextAuth relations
  accounts      Account[]
  sessions      Session[]

  // App relations
  players       Player[]
}

// Player Model (Athletes)
model Player {
  id          String   @id @default(cuid())
  name        String
  birthday    DateTime
  position    String
  teamClub    String
  photoUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  parentId    String
  parent      User     @relation(fields: [parentId], references: [id], onDelete: Cascade)
  games       Game[]
}

// Game Model (Game Logs)
model Game {
  id            String   @id @default(cuid())
  date          DateTime
  opponent      String
  result        String   // "Win", "Loss", "Draw"
  finalScore    String   // "3-2", "1-1", etc.
  minutesPlayed Int
  goals         Int      @default(0)
  assists       Int      @default(0)

  // Goalkeeper stats (nullable)
  saves         Int?
  goalsAgainst  Int?
  cleanSheet    Boolean?

  // Verification
  verified      Boolean  @default(false)
  verifiedAt    DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  playerId      String
  player        Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)
}

// NextAuth Models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Database Commands:**
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database (dev)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name description

# Deploy migrations
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

## 5. Operational Reference

### 5.1 Local Development Workflow

**Prerequisites:**
- Node.js 20.x or higher
- npm 10.x or higher
- Docker Desktop (for local database)
- Git

**Setup Process:**

```bash
# 1. Clone repository
git clone https://github.com/YOUR_ORG/hustle.git
cd hustle

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with database credentials

# 4. Start local PostgreSQL (via Docker Compose)
cd 06-Infrastructure/docker
docker-compose up -d postgres

# 5. Generate Prisma client
npx prisma generate

# 6. Push schema to database
npx prisma db push

# 7. Start development server
npm run dev

# 8. Open browser
# Navigate to http://localhost:3000
```

**Development Environment Variables (`.env.local`):**
```bash
# Database
DATABASE_URL="postgresql://hustle_admin:password@localhost:5432/hustle_mvp"

# NextAuth
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV=development
```

**Development Commands:**
```bash
# Start dev server (port 3000)
npm run dev

# Start dev server on specific port
npm run dev -- -p 4000

# Build for production
npm run build

# Start production server (after build)
npm start

# Run linter
npm run lint

# Format code
npm run format

# Open Prisma Studio
npx prisma studio
```

### 5.2 Production Deployment Workflow

**Deployment Method:** Google Cloud Run (source-based deployment)

**Step-by-Step Deployment:**

```bash
# 1. Authenticate with GCP
gcloud auth login
gcloud config set project hustle-dev-202510

# 2. Ensure environment variables are set in Cloud Run
# (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, NODE_ENV)

# 3. Deploy from source
gcloud run deploy hustle-app \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --vpc-connector hustle-vpc-connector \
  --set-env-vars "DATABASE_URL=postgresql://hustle_admin:PASSWORD@10.240.0.3:5432/hustle_mvp" \
  --set-env-vars "NEXTAUTH_SECRET=YOUR_SECRET" \
  --set-env-vars "NEXTAUTH_URL=https://hustle-app-158864638007.us-central1.run.app" \
  --set-env-vars "NODE_ENV=production"

# 4. Verify deployment
curl https://hustle-app-158864638007.us-central1.run.app/api/healthcheck

# 5. Run database migrations (if needed)
# SSH to Cloud Run instance or use Cloud Run Jobs
gcloud run jobs create migrate-db \
  --image gcr.io/hustle-dev-202510/hustle-app:latest \
  --region us-central1 \
  --vpc-connector hustle-vpc-connector \
  --set-env-vars "DATABASE_URL=..." \
  --command "npx" \
  --args "prisma,migrate,deploy"
```

**Alternative: Docker-Based Deployment**

```bash
# 1. Build Docker image
docker build -t gcr.io/hustle-dev-202510/hustle-app:latest \
  -f 06-Infrastructure/docker/Dockerfile .

# 2. Push to Artifact Registry
docker push gcr.io/hustle-dev-202510/hustle-app:latest

# 3. Deploy from image
gcloud run deploy hustle-app \
  --image gcr.io/hustle-dev-202510/hustle-app:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --vpc-connector hustle-vpc-connector \
  --set-env-vars "..."
```

### 5.3 Database Operations

**Connect to Production Database:**

```bash
# Option 1: Cloud SQL Proxy
cloud_sql_proxy -instances=hustle-dev-202510:us-central1:hustle-db=tcp:5432

# Option 2: VPC-internal connection (requires VPN or Bastion)
psql "postgresql://hustle_admin:PASSWORD@10.240.0.3:5432/hustle_mvp"
```

**Common Database Tasks:**

```bash
# View all migrations
npx prisma migrate status

# Create new migration
npx prisma migrate dev --name add_player_notes

# Deploy pending migrations
npx prisma migrate deploy

# Rollback migration (manual)
# 1. Drop tables or revert schema manually
# 2. Update migration history in _prisma_migrations table

# Backup database
pg_dump -h 10.240.0.3 -U hustle_admin -d hustle_mvp > backup-$(date +%F).sql

# Restore database
psql -h 10.240.0.3 -U hustle_admin -d hustle_mvp < backup-2025-10-07.sql
```

### 5.4 Infrastructure Management (Terraform)

**Terraform Workflow:**

```bash
# Navigate to Terraform directory
cd 06-Infrastructure/terraform

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply

# Show current state
terraform show

# List all resources
terraform state list

# Show specific resource
terraform state show google_sql_database_instance.postgres

# Destroy all resources (DANGEROUS)
terraform destroy

# Format Terraform files
terraform fmt

# Validate configuration
terraform validate
```

**Terraform Outputs:**

```bash
# View all outputs
terraform output

# View specific output (e.g., database connection string)
terraform output db_connection_string

# View Cloud Run deployment command
terraform output cloud_run_deployment_command
```

### 5.5 Monitoring & Logging

**Cloud Run Logs:**

```bash
# View all logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=hustle-app" \
  --limit 50 \
  --format json

# Tail logs in real-time
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=hustle-app"

# Filter by severity
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 20

# View specific timestamp range
gcloud logging read "resource.type=cloud_run_revision" \
  --since "2025-10-07T00:00:00Z"
```

**Cloud SQL Logs:**

```bash
# View database logs
gcloud logging read "resource.type=cloudsql_database" \
  --limit 50

# View slow query log (if enabled)
gcloud sql operations list --instance=hustle-db
```

**Application Health Checks:**

```bash
# Health check endpoint
curl https://hustle-app-158864638007.us-central1.run.app/api/healthcheck

# Expected response:
# {"status":"ok","timestamp":"2025-10-07T12:00:00.000Z"}

# Test authentication flow
curl -X POST https://hustle-app-158864638007.us-central1.run.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"password123"}'
```

### 5.6 Incident Response Procedures

**Critical Production Issue:**

1. **Assess Impact:**
   - Check https://hustle-app-158864638007.us-central1.run.app
   - View Cloud Run metrics (requests, errors, latency)
   - Check Cloud SQL instance health

2. **Immediate Actions:**
   ```bash
   # View recent errors
   gcloud logging read "severity>=ERROR" --limit 50

   # Check Cloud Run status
   gcloud run services describe hustle-app --region us-central1

   # Rollback to previous revision if needed
   gcloud run services update-traffic hustle-app \
     --to-revisions PREVIOUS_REVISION=100 \
     --region us-central1
   ```

3. **Database Issues:**
   ```bash
   # Check database connections
   gcloud sql operations list --instance=hustle-db

   # Restart database (if unresponsive)
   gcloud sql instances restart hustle-db

   # Check disk space
   gcloud sql instances describe hustle-db | grep dataDiskSizeGb
   ```

4. **Communication:**
   - Post incident status to team Slack channel
   - Update status page (if configured)
   - Document incident in `/01-Docs/XXX-inc-<description>.md`

5. **Post-Incident:**
   - Create After Action Review (AAR) document
   - Update runbooks based on lessons learned
   - Implement preventive measures

### 5.7 Backup & Disaster Recovery

**Database Backups:**

```bash
# Manual backup
gcloud sql backups create --instance=hustle-db

# List existing backups
gcloud sql backups list --instance=hustle-db

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=hustle-db \
  --backup-id=BACKUP_ID
```

**Application Code Backup:**
- **Primary:** Git repository (GitHub)
- **Secondary:** Local clones on development machines
- **Disaster Recovery:** Can redeploy from any commit

**Infrastructure Backup:**
- **Terraform State:** Stored locally (should migrate to GCS backend)
- **Recovery:** Re-run `terraform apply` to recreate infrastructure

---

## 6. Security & Access Management

### 6.1 Authentication & Authorization

**Authentication Provider:** NextAuth v5 (JWT strategy)

**Session Management:**
- **Strategy:** JWT (JSON Web Tokens)
- **Session Duration:** 30 days
- **Token Storage:** HTTP-only cookies (client-side)
- **Secret:** Stored in `NEXTAUTH_SECRET` environment variable

**Password Security:**
- **Hashing Algorithm:** bcrypt
- **Salt Rounds:** 10
- **Storage:** Encrypted hash in `User.password` field

**Authorization Patterns:**

```typescript
// Server-side session check
import { auth } from '@/lib/auth';

export default async function ProtectedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Page content
}

// API route protection
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // API logic
}

// Data isolation (always filter by user ID)
const players = await prisma.player.findMany({
  where: { parentId: session.user.id }
});
```

### 6.2 API Security

**Endpoint Protection:**
- All `/api/players/*` routes require authentication
- All `/api/games/*` routes require authentication
- Public endpoints: `/api/healthcheck`, `/api/hello`

**CORS Policy:**
- Same-origin only (no CORS headers configured)
- Production domain: `https://hustle-app-158864638007.us-central1.run.app`

**Rate Limiting:**
- **Status:** Not implemented (future enhancement)
- **Recommendation:** Implement Cloud Armor rate limiting

**Input Validation:**
- Type checking via TypeScript
- Prisma schema validation
- Manual validation in API routes (e.g., required fields)

### 6.3 Database Security

**Network Security:**
- **Public IP:** Disabled
- **Private IP Only:** 10.240.0.3 (VPC-internal)
- **Firewall:** Only accessible via VPC connector

**Authentication:**
- **User:** `hustle_admin`
- **Password:** Stored securely in Terraform credentials
- **SSL/TLS:** Disabled (dev environment) - **MUST enable in production**

**Access Control:**
- **Cloud Run Service Account:** `roles/cloudsql.client`
- **Developer Access:** Via Cloud SQL Proxy or VPC VPN

**Data Protection:**
- **Encryption at Rest:** Enabled by default (Cloud SQL)
- **Encryption in Transit:** Disabled (dev) - **MUST enable in production**
- **Backups:** Disabled (dev) - **MUST enable in production**

### 6.4 Secrets Management

**Current Approach (Development):**
- Environment variables in Cloud Run
- Terraform credentials in `/06-Infrastructure/terraform/.creds/` (gitignored)

**Production Recommendation:**
- Migrate to Google Secret Manager
- Use Workload Identity for secret access
- Rotate secrets regularly (90-day cycle)

**Critical Secrets:**
1. `DATABASE_URL` - Database connection string
2. `NEXTAUTH_SECRET` - JWT signing secret
3. `db_password.txt` - Database password

**Secret Rotation Procedure:**

```bash
# 1. Generate new secret
openssl rand -base64 32

# 2. Update Secret Manager
gcloud secrets versions add NEXTAUTH_SECRET --data-file=- <<< "NEW_SECRET"

# 3. Update Cloud Run
gcloud run services update hustle-app \
  --update-secrets NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest \
  --region us-central1

# 4. Verify deployment
curl https://hustle-app-158864638007.us-central1.run.app/api/healthcheck
```

### 6.5 Compliance & Data Privacy

**Data Storage:**
- **User Data:** First name, last name, email, phone (optional), hashed password
- **Player Data:** Name, birthday, position, team/club, photo (optional)
- **Game Data:** Statistics, opponent, date, verification status

**COPPA Compliance (Children Online Privacy Protection Act):**
- **Status:** Partially compliant (parent consent required)
- **Age Restriction:** High school athletes (grades 8-12, typically 13-18 years)
- **Parent Verification:** Email verification required (future)
- **Data Deletion:** Cascade delete on User deletion

**GDPR Considerations (if EU users):**
- **Right to Access:** API endpoint for user data export (future)
- **Right to Deletion:** User account deletion with cascade (implemented)
- **Data Portability:** JSON export of all user data (future)
- **Consent:** Terms of Service acceptance during registration (future)

### 6.6 Security Checklist for Production

**Pre-Production Security Hardening:**

- [ ] Enable Cloud SQL SSL/TLS (`require_ssl = true`)
- [ ] Migrate secrets to Google Secret Manager
- [ ] Enable Cloud SQL automated backups (daily)
- [ ] Implement API rate limiting (Cloud Armor)
- [ ] Add CSRF protection to forms
- [ ] Enable Cloud Audit Logs
- [ ] Set up VPC Service Controls
- [ ] Implement content security policy (CSP headers)
- [ ] Add helmet.js security headers
- [ ] Enable Cloud SQL point-in-time recovery
- [ ] Implement database connection pooling
- [ ] Add email verification flow
- [ ] Implement password reset flow
- [ ] Add account lockout after failed login attempts
- [ ] Set up security monitoring alerts
- [ ] Conduct penetration testing
- [ ] Complete security audit
- [ ] Document security incident response plan

---

## 7. Cost & Performance Metrics

### 7.1 Current Cost Analysis

**Monthly Cost Breakdown (Estimated):**

| Service | Configuration | Usage | Cost/Month |
|---------|---------------|-------|------------|
| Cloud Run | 0 min instances, 80 concurrency | ~1000 requests/day | $0-2 |
| Cloud SQL | db-g1-small, ZONAL, HDD | 100% uptime | $8-10 |
| VPC Connector | e2-micro | 100% uptime | $5-7 |
| Network Egress | us-central1 | ~10GB/month | $1-2 |
| Cloud Storage | Standard class (future) | 5GB | $0.10 |
| **Total** | | | **$14-21** |

**Cost Optimization Opportunities:**

1. **Cloud Run:**
   - Already optimized (scale to zero)
   - No min instances = no idle charges
   - Concurrency 80 maximizes instance utilization

2. **Cloud SQL:**
   - Current: db-g1-small ($8-10/month)
   - Alternative: Migrate to Firestore (free tier up to 1GB)
   - Alternative: Use preemptible Cloud SQL (if available)
   - **Recommendation:** Keep current for MVP, evaluate after user growth

3. **VPC Connector:**
   - Current: e2-micro ($5-7/month)
   - Alternative: Serverless VPC Access (same cost)
   - **Recommendation:** Keep current

4. **Future Cost Increases (at scale):**
   - 10,000 users: ~$30-40/month
   - 100,000 users: ~$200-300/month (need to enable HA, increase DB tier)

### 7.2 Performance Metrics

**Target Performance SLAs:**

| Metric | Target | Current Status | Measurement |
|--------|--------|----------------|-------------|
| Page Load Time | < 2 seconds | TBD | Lighthouse |
| API Response Time | < 500ms | TBD | Cloud Monitoring |
| Database Query Time | < 100ms | TBD | Prisma query logs |
| Authentication Time | < 1 second | TBD | NextAuth logs |
| Cold Start Time | < 5 seconds | TBD | Cloud Run metrics |
| Uptime | > 99.5% | TBD | Cloud Monitoring |

**Performance Optimization Implemented:**

1. **Next.js Optimizations:**
   - Standalone output mode (smaller Docker image)
   - Turbopack build (faster builds)
   - Server-side rendering for landing page

2. **Database Optimizations:**
   - Prisma connection pooling (default)
   - Indexed fields: `email` (unique), `parentId`, `playerId`

3. **Container Optimizations:**
   - Multi-stage Docker build (smaller image size)
   - Alpine Linux base (minimal footprint)
   - Non-root user (security + performance)

**Performance Monitoring Commands:**

```bash
# View Cloud Run metrics
gcloud run services describe hustle-app \
  --region us-central1 \
  --format="value(status.traffic)"

# View request latency
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_latencies"' \
  --format=json

# View instance count
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/container/instance_count"' \
  --format=json
```

### 7.3 Scaling Strategy

**Current Limits:**
- **Max Instances:** 10 (Cloud Run)
- **Concurrency:** 80 requests per instance
- **Max Throughput:** ~800 concurrent requests (10 instances × 80 concurrency)

**Scaling Triggers:**

| User Count | Expected Load | Scaling Action |
|------------|---------------|----------------|
| 0-100 | < 100 req/day | No action (current config) |
| 100-1,000 | < 1,000 req/day | No action (scale to zero handles) |
| 1,000-10,000 | < 10,000 req/day | Increase max instances to 50 |
| 10,000-100,000 | < 100,000 req/day | Enable high availability, increase DB tier |
| 100,000+ | > 100,000 req/day | Multi-region deployment, read replicas |

**Database Scaling Path:**

1. **Current:** db-g1-small (1.7GB RAM, shared CPU)
2. **1,000 users:** db-g1-small (no change)
3. **10,000 users:** db-custom-2-7680 (2 vCPU, 7.5GB RAM)
4. **100,000 users:** db-custom-4-15360 + read replicas + connection pooling

---

## 8. Development Workflow

### 8.1 Git Branching Strategy

**Branch Model:** GitHub Flow (simplified)

**Branch Types:**
- `main` - Production-ready code (protected)
- `feature/description` - Feature development
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical production fixes

**Workflow:**

```bash
# 1. Create feature branch
git checkout -b feature/add-player-notes main

# 2. Make changes and commit
git add .
git commit -m "feat: add notes field to player model"

# 3. Push to remote
git push origin feature/add-player-notes

# 4. Create Pull Request on GitHub
# 5. Code review
# 6. Merge to main
# 7. Deploy to production

# 8. Delete feature branch
git branch -d feature/add-player-notes
git push origin --delete feature/add-player-notes
```

**Commit Message Convention:**

```
type(scope): description

Examples:
feat(auth): add password reset flow
fix(dashboard): correct player count display
docs(readme): update deployment instructions
chore(deps): update Next.js to 15.5.5
refactor(api): simplify player query logic
test(auth): add unit tests for registration
```

### 8.2 Code Review Process

**PR Checklist:**
- [ ] Code follows TypeScript strict mode
- [ ] All new routes have authentication checks
- [ ] Database queries filter by `session.user.id`
- [ ] API responses return proper HTTP status codes
- [ ] Error handling implemented
- [ ] No secrets committed
- [ ] Documentation updated (if needed)
- [ ] Tested locally
- [ ] Prisma schema changes include migration

**Review Approval:**
- 1 approval required before merge
- No self-merging

### 8.3 Testing Strategy

**Current Testing Status:** Minimal (to be improved)

**Testing Pyramid:**

```
        /\
       /  \         E2E Tests (Playwright)
      /────\        - Full user flows
     /      \       - Authentication
    /────────\      - Game logging workflow
   /          \
  /────────────\    Integration Tests
 /              \   - API endpoint tests
/────────────────\  - Database operations

Unit Tests
- Utility functions
- Component logic
- Validation functions
```

**Testing Framework Recommendations:**

1. **Unit Tests:** Vitest (compatible with Vite/Next.js)
2. **Integration Tests:** Vitest + Prisma mock
3. **E2E Tests:** Playwright
4. **Component Tests:** React Testing Library

**Test Commands (future):**

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### 8.4 CI/CD Pipeline

**Current Status:** Manual deployment via `gcloud run deploy`

**Recommended CI/CD Pipeline (GitHub Actions):**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/auth@v1
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'
      - uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: hustle-app
          region: us-central1
          source: .
          env_vars: |
            DATABASE_URL=${{ secrets.DATABASE_URL }}
            NEXTAUTH_SECRET=${{ secrets.NEXTAUTH_SECRET }}
            NEXTAUTH_URL=${{ secrets.NEXTAUTH_URL }}
            NODE_ENV=production
```

### 8.5 Release Management

**Versioning:** Semantic Versioning (SemVer)

**Version Format:** `MAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

**Current Version:** 1.0.0 (Gate A complete)

**Release Process:**

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
4. Push tag: `git push origin v1.0.0`
5. Deploy to production
6. Create GitHub Release with notes

---

## 9. Dependencies & Integrations

### 9.1 External Services

**Currently Used:**
1. **Google Cloud Platform**
   - Cloud Run (application hosting)
   - Cloud SQL (database)
   - VPC Networking (private connectivity)
   - Cloud Logging (logs)
   - Cloud Monitoring (metrics)

**Planned Integrations:**
1. **SendGrid/Mailgun** - Email notifications (verification, password reset)
2. **Stripe** - Payment processing (future subscription model)
3. **Google Cloud Storage** - Player photo uploads
4. **Google Analytics** - User behavior tracking
5. **Sentry** - Error tracking and monitoring

### 9.2 Third-Party Libraries

**Authentication:**
- `next-auth` (v5.0.0-beta.29) - Authentication framework
- `@auth/prisma-adapter` (v2.7.4) - Prisma adapter for NextAuth
- `bcrypt` (v5.1.1) - Password hashing

**Database:**
- `@prisma/client` (v6.2.2) - Prisma ORM client
- `prisma` (v6.2.2) - Prisma CLI

**UI Framework:**
- `react` (v19.1.0) - UI library
- `react-dom` (v19.1.0) - React DOM renderer
- `next` (v15.5.4) - Next.js framework
- `tailwindcss` (v3.4.17) - CSS framework
- `@radix-ui/*` (v1.x) - Headless UI primitives
- `lucide-react` (v0.468.0) - Icon library

**State Management:**
- `zustand` (v5.0.3) - Lightweight state management

**Utilities:**
- `clsx` (v2.1.1) - Class name utility
- `tailwind-merge` (v2.6.0) - Tailwind class merging

### 9.3 API Endpoints

**Public Endpoints:**
- `GET /` - Landing page
- `GET /login` - Login page
- `POST /api/auth/[...nextauth]` - NextAuth handler
- `POST /api/auth/register` - User registration
- `GET /api/healthcheck` - Health check

**Protected Endpoints (require authentication):**
- `GET /dashboard` - Main dashboard
- `GET /dashboard/add-athlete` - Add player form
- `GET /api/players` - List all players for authenticated user
- `POST /api/players/create` - Create new player
- `POST /api/players/upload-photo` - Upload player photo
- `GET /api/games?playerId=xxx` - List games for player
- `POST /api/games` - Create new game log
- `POST /api/verify` - Verify game log

**Future Endpoints:**
- `GET /api/stats/:playerId` - Player statistics summary
- `GET /api/export/:playerId` - Export player data (PDF/CSV)
- `POST /api/password-reset` - Password reset request
- `GET /api/verify-email/:token` - Email verification

### 9.4 Webhook Integrations (Future)

**Stripe Webhooks (payment processing):**
- `POST /api/webhooks/stripe` - Handle subscription events

**SendGrid Webhooks (email events):**
- `POST /api/webhooks/sendgrid` - Handle email delivery events

---

## 10. Current State Assessment

### 10.1 What's Working Well ✅

**Infrastructure:**
- Cloud Run deployment successfully running
- Private VPC connectivity to Cloud SQL functioning
- Terraform infrastructure provisioned and stable
- Docker build pipeline working

**Application:**
- Next.js 15 App Router architecture solid
- NextAuth v5 authentication implemented and secure
- Prisma ORM providing type-safe database access
- shadcn/ui components providing professional UI
- Dashboard layout (Kiranism) working well

**Development Workflow:**
- Local development environment stable
- Docker Compose for local database working
- Git repository organized with master directory standards
- Documentation comprehensive and up-to-date

### 10.2 Known Gaps & Issues ⚠️

**Critical (P0 - Blocking Production):**
1. **No Email Verification Flow**
   - Users can register without email verification
   - Security risk: fake accounts
   - **Impact:** Medium
   - **Effort:** 2-3 days

2. **No Password Reset Flow**
   - Users cannot reset forgotten passwords
   - **Impact:** High (user support burden)
   - **Effort:** 1-2 days

3. **No Automated Backups**
   - Database backups disabled (dev cost optimization)
   - **Impact:** Critical (data loss risk)
   - **Effort:** 1 hour (enable in Terraform)

4. **SSL/TLS Not Enforced on Database**
   - Database connections not encrypted
   - **Impact:** High (data security)
   - **Effort:** 1 hour (enable in Terraform)

**Important (P1 - Needed for Launch):**
1. **No Player Management UI**
   - "Add Athlete" page exists but non-functional
   - Cannot view/edit/delete players from dashboard
   - **Impact:** High (core feature)
   - **Effort:** 3-5 days

2. **No Game Logging UI**
   - API endpoints exist but no UI
   - Cannot log games from dashboard
   - **Impact:** High (core feature)
   - **Effort:** 5-7 days

3. **No Verification Workflow**
   - Game verification logic not implemented
   - **Impact:** Medium (MVP feature)
   - **Effort:** 2-3 days

4. **No Testing Infrastructure**
   - No unit tests, integration tests, or E2E tests
   - **Impact:** Medium (code quality)
   - **Effort:** 5-7 days

5. **No Error Monitoring**
   - No Sentry or error tracking integration
   - **Impact:** Medium (debugging)
   - **Effort:** 2 hours

**Nice to Have (P2 - Post-MVP):**
1. **CI/CD Pipeline**
   - Manual deployment only
   - **Impact:** Low (developer experience)
   - **Effort:** 1-2 days

2. **Performance Monitoring**
   - No custom dashboards or alerts
   - **Impact:** Low (optimization)
   - **Effort:** 1 day

3. **Rate Limiting**
   - No API rate limiting
   - **Impact:** Low (security at scale)
   - **Effort:** 1 day

4. **Image Upload to GCS**
   - Player photos API exists but no GCS integration
   - **Impact:** Low (future feature)
   - **Effort:** 1-2 days

### 10.3 Technical Debt

**Code Quality:**
- Dashboard page has hardcoded stats (needs dynamic data)
- Some API routes lack comprehensive error handling
- No logging framework (console.log only)

**Security:**
- Secrets stored in environment variables (should use Secret Manager)
- No content security policy headers
- No rate limiting on API endpoints

**Infrastructure:**
- Terraform state stored locally (should migrate to GCS backend)
- No staging environment (only production)
- No automated disaster recovery testing

**Documentation:**
- API documentation needs OpenAPI/Swagger spec
- Missing architecture diagrams (cloud infrastructure)
- No developer onboarding checklist

### 10.4 Immediate Priorities (Next 30 Days)

**Week 1:**
1. Enable Cloud SQL automated backups
2. Enable SSL/TLS on database connections
3. Implement email verification flow
4. Implement password reset flow

**Week 2:**
5. Build Player Management UI (list/view/edit/delete)
6. Build Game Logging UI (create game form)
7. Implement game verification workflow

**Week 3:**
8. Add unit tests for critical functions
9. Add integration tests for API endpoints
10. Set up Sentry error monitoring

**Week 4:**
11. Create staging environment
12. Set up CI/CD pipeline (GitHub Actions)
13. Migrate Terraform state to GCS backend
14. Production readiness review

### 10.5 Success Metrics

**MVP Launch Criteria:**
- [ ] Email verification working
- [ ] Password reset working
- [ ] Players can be added/edited/deleted
- [ ] Games can be logged
- [ ] Game verification workflow functional
- [ ] Automated backups enabled
- [ ] SSL/TLS enabled on database
- [ ] Error monitoring active
- [ ] 10 beta users successfully using the app
- [ ] < 5% error rate on API endpoints
- [ ] < 2 second page load time

---

## 11. Quick Reference

### 11.1 Essential Commands

**Local Development:**
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npx prisma generate       # Generate Prisma client
npx prisma db push        # Push schema to DB
npx prisma studio         # Open DB GUI
npx prisma migrate dev    # Create migration
```

**Deployment:**
```bash
# Deploy to Cloud Run
gcloud run deploy hustle-app --source . --region us-central1

# View logs
gcloud logging tail "resource.type=cloud_run_revision"

# View service details
gcloud run services describe hustle-app --region us-central1
```

**Database:**
```bash
# Connect via Cloud SQL Proxy
cloud_sql_proxy -instances=hustle-dev-202510:us-central1:hustle-db=tcp:5432

# Connect directly
psql "postgresql://hustle_admin:PASSWORD@10.240.0.3:5432/hustle_mvp"
```

**Infrastructure:**
```bash
# Terraform commands
cd 06-Infrastructure/terraform
terraform init
terraform plan
terraform apply
terraform destroy
```

### 11.2 Key URLs

**Production:**
- Application: https://hustle-app-158864638007.us-central1.run.app
- Health Check: https://hustle-app-158864638007.us-central1.run.app/api/healthcheck

**GCP Console:**
- Project: https://console.cloud.google.com/home/dashboard?project=hustle-dev-202510
- Cloud Run: https://console.cloud.google.com/run?project=hustle-dev-202510
- Cloud SQL: https://console.cloud.google.com/sql/instances?project=hustle-dev-202510
- Logs: https://console.cloud.google.com/logs?project=hustle-dev-202510

### 11.3 Environment Variables

**Local (.env.local):**
```bash
DATABASE_URL="postgresql://hustle_admin:password@localhost:5432/hustle_mvp"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV=development
```

**Production (Cloud Run):**
```bash
DATABASE_URL="postgresql://hustle_admin:PASSWORD@10.240.0.3:5432/hustle_mvp"
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://hustle-app-158864638007.us-central1.run.app"
NODE_ENV=production
```

### 11.4 Key File Locations

**Configuration:**
- Next.js: `/next.config.ts`
- TypeScript: `/tsconfig.json`
- Tailwind: `/tailwind.config.ts`
- Prisma: `/prisma/schema.prisma`
- Docker: `/06-Infrastructure/docker/Dockerfile`
- Terraform: `/06-Infrastructure/terraform/*.tf`

**Application:**
- Auth: `/src/lib/auth.ts`
- Prisma: `/src/lib/prisma.ts`
- API Routes: `/src/app/api/*/route.ts`
- Pages: `/src/app/*/page.tsx`

**Documentation:**
- Main README: `/README.md`
- CLAUDE.md: `/CLAUDE.md`
- Docs: `/01-Docs/*.md`

### 11.5 Support Contacts

**Technical Lead:** Jeremy Longshore
**Repository:** https://github.com/YOUR_ORG/hustle
**Documentation:** /01-Docs/
**AI Assistant Context:** /CLAUDE.md

---

## Appendix A: Glossary

**App Router:** Next.js 13+ routing system using file-based routing in `/app/` directory
**bcrypt:** Password hashing algorithm with built-in salt
**Cloud Run:** Google Cloud serverless container hosting service
**Cloud SQL:** Google Cloud managed database service (PostgreSQL, MySQL, SQL Server)
**CUID:** Collision-resistant unique identifier (used by Prisma)
**JWT:** JSON Web Token - stateless authentication token
**NextAuth:** Authentication library for Next.js applications
**Prisma:** Type-safe ORM (Object-Relational Mapping) for Node.js
**shadcn/ui:** Component library built on Radix UI primitives
**Tailwind CSS:** Utility-first CSS framework
**Terraform:** Infrastructure as Code tool for cloud provisioning
**Turbopack:** Next.js bundler (successor to webpack)
**VPC:** Virtual Private Cloud - isolated network in GCP
**Workload Identity:** GCP service account authentication for Cloud Run
**Zustand:** Lightweight state management library for React

---

## Appendix B: Troubleshooting

**Issue: Database connection refused**

```bash
# Check Cloud SQL instance is running
gcloud sql instances describe hustle-db

# Verify VPC connector
gcloud compute networks vpc-access connectors describe hustle-vpc-connector \
  --region us-central1

# Test connectivity from Cloud Run
gcloud run services update hustle-app \
  --set-env-vars "TEST_DB=true" \
  --region us-central1
```

**Issue: Cloud Run deployment fails**

```bash
# Check build logs
gcloud builds list --limit=5

# View specific build
gcloud builds log BUILD_ID

# Common fixes:
# 1. Ensure package.json has "build" script
# 2. Verify Dockerfile syntax
# 3. Check environment variables set correctly
```

**Issue: NextAuth session not persisting**

```bash
# Verify NEXTAUTH_SECRET is set
gcloud run services describe hustle-app \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env)"

# Check NEXTAUTH_URL matches production URL
# Ensure cookies are allowed in browser
```

**Issue: Prisma client not found**

```bash
# Regenerate Prisma client
npx prisma generate

# Ensure Prisma client copied to Docker image
# Check Dockerfile includes:
# COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
```

---

## Document Metadata

**Document Version:** 1.0.0
**Last Updated:** 2025-10-07
**Next Review:** 2025-11-07
**Maintained By:** Jeremy Longshore
**Document Status:** Living Document (update as system evolves)
**AI-Friendly:** Optimized for Claude Code agent assistance
**Word Count:** ~15,000 words

---

**END OF DOCUMENT**
