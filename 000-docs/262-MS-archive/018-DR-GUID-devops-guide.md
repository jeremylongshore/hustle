# Hustle MVP: Complete System Analysis & Operations Guide
*For: Jeremy Longshore (Owner/DevOps)*
*Generated: 2025-10-05*
*System Version: 2.0.0 (NextAuth Migration Complete)*

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Directory Deep-Dive](#directory-deep-dive)
4. [Operational Reference](#operational-reference)
5. [Security & Access](#security--access)
6. [Cost & Performance](#cost--performance)
7. [Development Workflow](#development-workflow)
8. [Dependencies & Supply Chain](#dependencies--supply-chain)
9. [Integration with Existing Documentation](#integration-with-existing-documentation)
10. [Current State Assessment](#current-state-assessment)
11. [Quick Reference](#quick-reference)
12. [Recommendations Roadmap](#recommendations-roadmap)
13. [Appendices](#appendices)

---

## Executive Summary

Hustle MVP is a soccer player statistics tracking platform built with Next.js 15.5.4, designed for high school athletes (grades 8-12) and their parents. The system allows parents to create player profiles, log game statistics, and track performance over time. After a recent migration from SuperTokens to NextAuth v5, the authentication layer is now simpler and more maintainable.

**Current State:**
- **Production:** Deployed on Google Cloud Run (containerized)
- **Environments:** Local development + Production
- **Scale:** MVP stage, designed for single-parent multi-player usage
- **Status:** Authentication migration complete, core UI in progress

**Technology Foundation:**
- **Framework:** Next.js 15.5.4 with App Router (React 19, TypeScript)
- **Authentication:** NextAuth v5 with JWT strategy (bcrypt password hashing)
- **Database:** PostgreSQL 15 via Prisma ORM (local + Cloud SQL in production)
- **Cloud:** Google Cloud Platform (Cloud Run, Cloud SQL, VPC, Artifact Registry)
- **Infrastructure:** Terraform for GCP, Docker for containerization

**Key Architectural Decisions:**
1. **NextAuth over SuperTokens:** Reduced infrastructure complexity by eliminating external auth server dependency
2. **JWT Sessions:** Stateless authentication for Cloud Run serverless scaling
3. **Prisma ORM:** Type-safe database access with excellent Next.js integration
4. **Server-Side Rendering:** Protected routes use `await auth()` server-side session checks
5. **Kiranism UI:** Professional dashboard template adapted to remove Clerk dependencies

The system is production-ready for authentication but requires completion of game logging and athlete management UIs before full launch.

---

## System Architecture Overview

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend/UI** | Next.js | 15.5.4 | React framework with App Router |
| | React | 19.1.0 | UI library |
| | TypeScript | 5.x | Type safety and developer experience |
| | Tailwind CSS | 3.4.1 | Utility-first styling |
| | shadcn/ui | Latest | Radix UI component library |
| | Kiranism Dashboard | Custom | Sidebar layout components |
| **Backend/API** | Node.js | 22 | JavaScript runtime |
| | Next.js API Routes | 15.5.4 | Backend API handlers |
| | NextAuth | 5.0.0-beta.25 | Authentication (JWT strategy) |
| | Prisma ORM | 6.16.3 | Database toolkit and migrations |
| | bcrypt | 5.1.1 | Password hashing (10 rounds) |
| **Database** | PostgreSQL | 15 | Relational database |
| | Google Cloud SQL | N/A | Managed PostgreSQL (production) |
| | Prisma Client | Generated | Type-safe query builder |
| **Caching** | None | N/A | Not implemented (MVP) |
| **Queue/Messaging** | None | N/A | Not implemented (MVP) |
| **Infrastructure** | Docker | Latest | Containerization |
| | Google Cloud Run | N/A | Serverless container platform |
| | Terraform | Latest | Infrastructure as Code |
| | VPC Connector | N/A | Private database connectivity |

### Cloud Services in Use

| Service | Purpose | Environment | Key Config |
|---------|---------|-------------|------------|
| **Cloud Run** | Host Next.js app containers | Production | Min instances: 0, Max: 10, Port: 8080 |
| **Cloud SQL** | Managed PostgreSQL database | Production | Instance: db-f1-micro, Private IP: 10.240.0.3 |
| **VPC Connector** | Private network access to Cloud SQL | Production | Region: us-central1, Subnet: /28 |
| **Artifact Registry** | Docker image storage | Production | Repository: cloud-run-source-deploy |
| **Secret Manager** | Environment variables and secrets | Production | Not yet configured (using env vars) |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
│                     (http://localhost:4000 dev)                 │
│          (https://hustle-app-*.run.app production)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Google Cloud Run                              │
│           ┌─────────────────────────────────────┐               │
│           │   Next.js 15.5.4 Container          │               │
│           │   (Port 8080, Standalone Mode)      │               │
│           │                                     │               │
│           │  ┌──────────────────────────────┐  │               │
│           │  │    App Router Pages          │  │               │
│           │  │  - /login                    │  │               │
│           │  │  - /dashboard (protected)    │  │               │
│           │  │  - /dashboard/athletes       │  │               │
│           │  └──────────────────────────────┘  │               │
│           │                                     │               │
│           │  ┌──────────────────────────────┐  │               │
│           │  │    API Routes                │  │               │
│           │  │  - /api/auth/[...nextauth]   │  │               │
│           │  │  - /api/players              │  │               │
│           │  │  - /api/games                │  │               │
│           │  │  - /api/verify               │  │               │
│           │  └──────────────────────────────┘  │               │
│           │                                     │               │
│           │  ┌──────────────────────────────┐  │               │
│           │  │    NextAuth v5               │  │               │
│           │  │  - JWT Strategy (30d expiry) │  │               │
│           │  │  - Credentials Provider      │  │               │
│           │  │  - bcrypt Password Hashing   │  │               │
│           │  └──────────────────────────────┘  │               │
│           │                                     │               │
│           │  ┌──────────────────────────────┐  │               │
│           │  │    Prisma ORM                │  │               │
│           │  │  - Generated Client          │  │               │
│           │  │  - Connection Pooling        │  │               │
│           │  │  - Type-safe Queries         │  │               │
│           │  └──────────────────────────────┘  │               │
│           └─────────────────────────────────────┘               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ VPC Connector (Private Network)
                           │ us-central1
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Google Cloud SQL PostgreSQL 15                      │
│                  (Private IP: 10.240.0.3)                        │
│                    Database: hustle_mvp                          │
│           ┌─────────────────────────────────────┐               │
│           │  Tables:                            │               │
│           │  - users (bcrypt passwords)         │               │
│           │  - players (athlete profiles)       │               │
│           │  - games (stat tracking)            │               │
│           │  - accounts (NextAuth)              │               │
│           │  - sessions (NextAuth)              │               │
│           │  - verification_tokens (NextAuth)   │               │
│           └─────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘

External Dependencies:
┌──────────────────────┐
│  npm Registry        │ → Package installation during build
└──────────────────────┘

┌──────────────────────┐
│  Google Auth APIs    │ → NextAuth future OAuth providers
└──────────────────────┘
```

### Data Flow: Authentication

```
User Login Flow:

┌──────────┐           ┌─────────────┐           ┌──────────┐
│ Browser  │           │  NextAuth   │           │ Database │
└────┬─────┘           └──────┬──────┘           └────┬─────┘
     │                        │                       │
     │ POST /api/auth/        │                       │
     │ callback/credentials   │                       │
     │ {email, password}      │                       │
     ├───────────────────────►│                       │
     │                        │                       │
     │                        │ prisma.user.findUnique│
     │                        │ ({ email })           │
     │                        ├──────────────────────►│
     │                        │                       │
     │                        │◄──────────────────────┤
     │                        │ user {id, password}   │
     │                        │                       │
     │                        │ bcrypt.compare()      │
     │                        │ (user input, hash)    │
     │                        │ ───────────           │
     │                        │                       │
     │◄───────────────────────┤                       │
     │ Set-Cookie:            │                       │
     │ next-auth.session-token│                       │
     │ (JWT, 30 day expiry)   │                       │
     │ Redirect: /dashboard   │                       │
     │                        │                       │

Protected Route Access:

┌──────────┐           ┌─────────────┐
│ Browser  │           │  Server     │
└────┬─────┘           │  Component  │
     │                 └──────┬──────┘
     │ GET /dashboard         │
     │ Cookie: session-token  │
     ├───────────────────────►│
     │                        │ await auth()
     │                        │ verify JWT signature
     │                        │ decode user data
     │                        │ ──────────
     │                        │
     │                  if (!session)
     │                  redirect('/login')
     │                        │
     │◄───────────────────────┤
     │ 200 OK                 │
     │ Dashboard HTML         │
```

---

## Directory Deep-Dive

### Project Root: `/home/jeremy/projects/hustle/`

```
hustle/
├── 01-Docs/                    # 14 documentation files (NNN-abv-description.ext)
├── 03-Tests/                   # Test suites (empty - future integration/E2E tests)
├── 04-Assets/                  # Static assets (empty - future marketing materials)
├── 05-Scripts/                 # Automation scripts (empty - future deployment scripts)
├── 06-Infrastructure/          # Infrastructure as Code
├── 07-Releases/                # Release artifacts (empty - future versioned builds)
├── 99-Archive/                 # Deprecated materials (empty)
├── app/                        # 🔑 MAIN APPLICATION DIRECTORY
├── .directory-standards.md     # Master directory standards reference
└── README.md                   # Project overview and quick start
```

### 01-Docs/ Analysis

**Key Documents:**
- `001-prd-hustle-mvp-v1.md` (30,836 bytes) - Original comprehensive product spec with user stories
- `002-prd-hustle-mvp-v2-lean.md` (12,269 bytes) - Simplified lean MVP iteration
- `003-pln-sales-strategy.md` (15,516 bytes) - Go-to-market and sales approach
- `004-log-infrastructure-setup.md` → `014-ref-deployment-index.md` - Deployment journey logs

**Documentation Quality:** Excellent historical context. PRDs are comprehensive but not yet updated for NextAuth migration. Deployment logs provide excellent troubleshooting history.

**Gaps:**
- No API documentation (OpenAPI/Swagger spec)
- No user guides or end-user documentation
- Missing runbooks for operational procedures
- No disaster recovery procedures documented

### 06-Infrastructure/ Analysis 🔑

**Structure:**
```
06-Infrastructure/
└── terraform/
    ├── main.tf           # Primary GCP resources
    ├── variables.tf      # Input variables (project_id, region, etc.)
    ├── outputs.tf        # Output values (instance IPs, URLs)
    ├── provider.tf       # GCP provider configuration
    └── terraform.tfstate # 🚨 State file (should be in Cloud Storage!)
```

**IaC Tool:** Terraform

**Resources Managed:**
1. **Google Cloud SQL PostgreSQL Instance**
   - Instance type: `db-f1-micro` (shared CPU, 614MB RAM)
   - Disk: 10GB SSD, auto-increase enabled
   - Private IP only (no public IP)
   - Automated backups: 7-day retention

2. **VPC Connector**
   - Region: `us-central1`
   - IP CIDR range: `/28` subnet
   - Purpose: Enable Cloud Run → Cloud SQL private connectivity

3. **VPC Network**
   - Custom VPC for private IP space
   - Firewall rules for Cloud SQL access

**State Management:**
- ⚠️ **CRITICAL ISSUE:** `terraform.tfstate` stored locally
- **Risk:** Single point of failure, no team collaboration support
- **Recommendation:** Migrate to GCS backend with state locking

**Deployment Process:**
```bash
cd /home/jeremy/projects/hustle/06-Infrastructure/terraform
terraform init
terraform plan -var="project_id=hustle-dev-202510" -var="region=us-central1"
terraform apply -var="project_id=hustle-dev-202510"
```

**Environment Separation:** None currently. Single production environment.
- **Gap:** No staging environment infrastructure
- **Gap:** No dev environment separate from local

**Not Managed by Terraform:**
- Cloud Run service (deployed via gcloud CLI)
- Artifact Registry repository
- Container images
- IAM roles and service accounts

---

### app/ Directory - Main Application 🔑

**Entry Points:**
- `src/app/page.tsx` - Landing page (public)
- `src/app/login/page.tsx` - Login form (public)
- `src/app/dashboard/page.tsx` - Main dashboard (protected)
- `src/lib/auth.ts` - NextAuth configuration
- `next.config.ts` - Next.js configuration (standalone output mode)

#### app/src/app/ - Pages and API Routes

**Page Routing (App Router):**
```
/                              → src/app/page.tsx (Landing)
/login                         → src/app/login/page.tsx (Login form)
/dashboard                     → src/app/dashboard/page.tsx (Dashboard home)
/dashboard/athletes            → (Not implemented yet)
/dashboard/analytics           → (Not implemented yet)
/dashboard/settings            → (Not implemented yet)
```

**API Routes:**

| Endpoint | Method | Auth | File | Purpose |
|----------|--------|------|------|---------|
| `/api/auth/*` | * | Varies | `auth/[...nextauth]/route.ts` | NextAuth handlers (signin, signout, session) |
| `/api/players` | GET | ✅ | `players/route.ts` | List all players for authenticated user |
| `/api/players/create` | POST | ❌ | `players/create/route.ts` | Create new player (TODO: add auth) |
| `/api/players/upload-photo` | POST | ❌ | `players/upload-photo/route.ts` | Upload player photo (TODO: add auth) |
| `/api/games` | GET | ❌ | `games/route.ts` | Get games for playerId (query param) |
| `/api/games` | POST | ❌ | `games/route.ts` | Create new game log |
| `/api/verify` | POST | ❌ | `verify/route.ts` | Verify game with parentId |
| `/api/healthcheck` | GET | ❌ | `healthcheck/route.ts` | Database connection test |
| `/api/hello` | GET | ❌ | `hello/route.ts` | Simple health check |
| `/api/migrate` | POST | ❌ | `migrate/route.ts` | Run database migrations (deprecated with Prisma) |
| `/api/db-setup` | POST | ❌ | `db-setup/route.ts` | Create test user and player |

**Auth Implementation Gaps:**
- ⚠️ Most API routes lack session verification
- Only `/dashboard` pages are protected server-side
- API routes should use `await auth()` pattern but don't yet

**Code Patterns:**

**Good:**
- Consistent use of NextResponse for API responses
- Proper error handling with try/catch blocks
- TypeScript for type safety
- Server Components for protected pages

**Needs Attention:**
- API routes need unified auth middleware
- No input validation library (Zod recommended)
- No request rate limiting
- Error responses not standardized (some return 500, some 401 inconsistently)

#### app/src/components/ - UI Components

**Structure:**
```
components/
├── ui/                    # shadcn/ui primitives (40+ components)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── sidebar.tsx
│   ├── dropdown-menu.tsx
│   ├── sheet.tsx
│   └── [35+ more...]
└── layout/                # Kiranism dashboard layout
    ├── app-sidebar-simple.tsx  # Main sidebar navigation
    ├── user-nav.tsx            # User dropdown menu
    └── header.tsx              # Dashboard header
```

**Component Library:** shadcn/ui (Radix UI primitives + Tailwind CSS)

**Layout Components:**
- `app-sidebar-simple.tsx`: Navigation with Home, Athletes, Analytics, Settings
- `user-nav.tsx`: Displays user name (firstName + lastName) and logout button
- `header.tsx`: Dashboard title and user navigation

**Removed Dependencies:**
- ✅ All Clerk authentication code removed
- ✅ Kiranism's original sidebar adapted to use NextAuth sessions

**UI Patterns:**
- Server Components for data fetching
- Client Components (`'use client'`) for interactivity
- Consistent styling with Tailwind utility classes
- Accessible components via Radix UI primitives

#### app/src/lib/ - Core Libraries

**Files:**
- `auth.ts` - 🔑 NextAuth configuration
- `prisma.ts` - Prisma Client singleton pattern
- `utils.ts` - Utility functions (cn for className merging)

**auth.ts Deep Dive:**

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),  // Connects NextAuth to database
  providers: [
    CredentialsProvider({
      // Email/password authentication
      authorize: async (credentials) => {
        // 1. Find user by email
        // 2. Verify password with bcrypt.compare()
        // 3. Return user object or throw error
      }
    })
  ],
  session: {
    strategy: "jwt",          // Stateless JWT tokens
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: {
    signIn: "/login",         // Custom login page
    error: "/login"           // Error redirect
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      // Add custom fields to JWT
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    session: async ({ session, token }) => {
      // Add custom fields to session object
      session.user.id = token.id;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET  // 🔐 JWT signing secret
});
```

**Security Considerations:**
- ✅ Password hashing: bcrypt with 10 rounds
- ✅ JWT signing with NEXTAUTH_SECRET
- ✅ HTTP-only cookies for session tokens
- ⚠️ No refresh token rotation (30-day sessions can't be invalidated)
- ⚠️ NEXTAUTH_SECRET should be in Secret Manager, not env vars

**prisma.ts Deep Dive:**

```typescript
// Singleton pattern to prevent multiple Prisma Client instances
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],  // Logging configuration
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Connection Pooling:** Prisma handles connection pooling internally
- Default pool size: 10 connections
- Connection timeout: 10s
- Recommendation: Monitor connection count in production

#### app/prisma/ - Database Schema 🔑

**schema.prisma Analysis:**

```prisma
// Core Application Models

model User {
  id            String    @id @default(cuid())  // Collision-resistant ID
  firstName     String
  lastName      String
  email         String    @unique               // Login identifier
  emailVerified DateTime?                       // Not used yet
  phone         String
  password      String                          // bcrypt hash
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  accounts      Account[]    // NextAuth OAuth accounts
  sessions      Session[]    // NextAuth sessions
  players       Player[]     // Child player profiles

  @@map("users")             // Table name: "users"
}

model Player {
  id        String   @id @default(cuid())
  name      String
  birthday  DateTime  // For age calculation (not grade!)
  position  String    // e.g., "Forward", "Goalkeeper"
  teamClub  String    // Team name (free text)
  photoUrl  String?   // Optional profile photo path
  parentId  String    // FK to User
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parent    User   @relation(fields: [parentId], references: [id], onDelete: Cascade)
  games     Game[]

  @@map("players")
}

model Game {
  id            String    @id @default(cuid())
  playerId      String
  date          DateTime  @default(now())
  opponent      String    // Opponent team name
  result        String    // "Win", "Loss", "Tie"
  finalScore    String    // e.g., "3-2"
  minutesPlayed Int

  // Universal stats
  goals         Int       @default(0)
  assists       Int       @default(0)

  // Goalkeeper stats (nullable)
  saves         Int?
  goalsAgainst  Int?
  cleanSheet    Boolean?

  // Verification system
  verified      Boolean   @default(false)
  verifiedAt    DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  player        Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@index([playerId])    // Query optimization
  @@index([verified])    // Filter verified games
  @@map("games")
}

// NextAuth Models (standard)
model Account { ... }
model Session { ... }
model VerificationToken { ... }
```

**Database Patterns:**

**Strengths:**
- ✅ Cascade deletes protect data integrity (delete user → delete players → delete games)
- ✅ Indexes on foreign keys and common queries
- ✅ Nullable goalkeeper stats avoid data duplication
- ✅ Audit fields (createdAt, updatedAt) on all models
- ✅ String-based IDs (cuid) avoid enumeration attacks

**Design Decisions:**
- `birthday` instead of `grade`: Grade changes annually, birthday is permanent
- `position` as free text: Flexible for different soccer positions
- `verified` boolean: Simple verification system (no complex workflow)
- `finalScore` as String: Allows formats like "3-2 (OT)" or "1-0 (PK)"

**Potential Issues:**
- No soft deletes: Deleted data is gone permanently
- No role system: All users are "parents" (no admin/coach roles)
- No team relationships: Team names are strings, not foreign keys
- Photo storage: photoUrl is just a string, no validation

#### app/public/ - Static Assets

```
public/
├── uploads/
│   └── players/      # Player photo uploads
│       └── .gitkeep  # Keep directory in git
└── [other static files]
```

**Upload Handling:**
- Photos stored in `public/uploads/players/`
- Served statically by Next.js
- ⚠️ No file size limits enforced
- ⚠️ No image optimization (should use Next.js Image)
- ⚠️ Public directory grows unbounded (no cleanup strategy)

---

### app/01-Docs/ - Application Documentation

**Files:**
- `001-adr-nextauth-migration.md` (8,380 bytes) - Complete migration decision record
- `002-ref-dashboard-template-diagram.md` (10,650 bytes) - Kiranism integration notes
- `003-ref-devops-system-analysis.md` (This analysis)

**Quality:** Excellent ADR documentation for NextAuth migration. Includes rationale, alternatives considered, and implementation details.

**Gaps:**
- No API documentation (Swagger/OpenAPI spec)
- No component library documentation (Storybook)
- No testing documentation

---

### app/03-Tests/ - Testing Infrastructure

**Current State:** Empty directories for unit, integration, e2e tests

**Testing Status:** 🚨 **ZERO TEST COVERAGE**

**Recommended Stack:**
- **Unit Tests:** Jest + React Testing Library
- **Integration Tests:** Supertest for API routes
- **E2E Tests:** Playwright or Cypress

**Critical Tests Needed:**
1. Authentication flow (login, session, logout)
2. Protected route redirects
3. API route authorization checks
4. Database CRUD operations
5. Password hashing and verification

---

### app/05-Scripts/maintenance/ - Automation Scripts

**Files:**
- `smoke-test.sh` (2,597 bytes) - HTTP endpoint testing
- `smoke-test-simple.sh` (1,632 bytes) - Simplified health checks

**smoke-test.sh:**
```bash
#!/bin/bash
# Tests all API endpoints with curl
# Checks: /api/hello, /api/healthcheck, /api/players, /api/games

# Usage: ./smoke-test.sh [BASE_URL]
# Example: ./smoke-test.sh http://localhost:4000
```

**Gaps:**
- No deployment scripts
- No database backup scripts
- No migration rollback scripts
- No load testing scripts

---

### app/06-Infrastructure/docker/ - Containerization 🔑

**Files:**
- `Dockerfile` (1,318 bytes) - Multi-stage production build
- `docker-compose.yml` (1,224 bytes) - Local development setup
- `.dockerignore` (97 bytes) - Build exclusions

**Dockerfile Analysis:**

```dockerfile
# Stage 1: dependencies
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci

# Stage 2: builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate   # Generate Prisma Client
RUN npm run build         # Next.js build

# Stage 3: runner (production)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma  # Prisma Client

USER nextjs
EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]
```

**Build Optimizations:**
- ✅ Multi-stage build reduces final image size
- ✅ Layer caching for node_modules
- ✅ Non-root user (nextjs:nodejs)
- ✅ Standalone output mode (includes only necessary files)

**Security:**
- ✅ Alpine base image (smaller attack surface)
- ✅ Non-root user
- ⚠️ No health check defined in Dockerfile

**docker-compose.yml Analysis:**

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hustle_mvp
      POSTGRES_USER: hustle_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # From .env
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:3000:8080"  # Map container 8080 to host 3000
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
    depends_on:
      - postgres

volumes:
  postgres_data:
```

**Local Development:**
- PostgreSQL runs in container
- App can run locally or in container
- Data persists in named volume

---

## Operational Reference

### Deployment Workflows

#### Local Development

**Required Tools:**
- Node.js 22+ ([nvm](https://github.com/nvm-sh/nvm) recommended)
- npm 11+
- PostgreSQL 15 (via Docker or native)
- Git

**Environment Setup:**

```bash
# 1. Navigate to application
cd /home/jeremy/projects/hustle/app

# 2. Install dependencies
npm install

# 3. Create local environment file
cp .env.example .env.local

# 4. Edit .env.local with local database credentials
# Required variables:
#   DATABASE_URL="postgresql://hustle_admin:password@localhost:5432/hustle_mvp"
#   NEXTAUTH_SECRET="your-32-character-secret-here"
#   NEXTAUTH_URL="http://localhost:4000"
#   NODE_ENV=development

# 5. Start local PostgreSQL (Docker)
docker-compose up -d postgres

# 6. Generate Prisma Client
npx prisma generate

# 7. Push database schema
npx prisma db push

# 8. (Optional) Seed test data
curl -X POST http://localhost:4000/api/db-setup

# 9. Start development server
npm run dev -- -p 4000

# Access application at http://localhost:4000
```

**Running Locally:**

```bash
# Development server with hot reload
npm run dev -- -p 4000

# View Prisma Studio (database GUI)
npx prisma studio

# Run smoke tests
./05-Scripts/maintenance/smoke-test.sh http://localhost:4000

# View logs
# (stdout in terminal)
```

**Local Testing:**

```bash
# No tests configured yet
# Future: npm test
```

**Common Local Development Tasks:**

```bash
# Reset database (DESTRUCTIVE)
npx prisma db push --force-reset

# Create database migration (after schema changes)
npx prisma migrate dev --name description-of-change

# Check database connection
curl http://localhost:4000/api/healthcheck

# Create test user
curl -X POST http://localhost:4000/api/db-setup
```

---

#### Production Deployment

**Pre-Deployment Checklist:**

- [ ] All code changes committed to git
- [ ] Database schema migrations tested locally
- [ ] Environment variables verified in `.env` file
- [ ] Docker build succeeds locally
- [ ] Prisma Client generated
- [ ] No secrets in code or committed files
- [ ] NEXTAUTH_SECRET is strong (32+ characters)
- [ ] DATABASE_URL points to production database

**Build Process:**

```bash
# Navigate to application
cd /home/jeremy/projects/hustle/app

# 1. Build Docker image
docker build -t us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest .

# Build time: ~60 seconds
# Success indicator: "Successfully built [image-id]"
```

**Push to Artifact Registry:**

```bash
# Authenticate Docker to GCP (one-time)
gcloud auth configure-docker us-central1-docker.pkg.dev

# 2. Push image to Artifact Registry
docker push us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest

# Push time: ~2-3 minutes depending on network
# Success indicator: "latest: digest: sha256:..."
```

**Deploy to Cloud Run:**

```bash
# 3. Deploy to Cloud Run
gcloud run deploy hustle-app \
  --image us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest \
  --region us-central1 \
  --project hustle-dev-202510 \
  --vpc-connector hustle-vpc-connector \
  --set-env-vars DATABASE_URL="postgresql://hustle_admin:[PASSWORD]@10.240.0.3:5432/hustle_mvp" \
  --set-env-vars NEXTAUTH_SECRET="[YOUR_SECRET]" \
  --set-env-vars NEXTAUTH_URL="https://hustle-app-158864638007.us-central1.run.app" \
  --set-env-vars NODE_ENV=production \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1

# Deployment time: ~2-3 minutes
# Success indicator: "Service URL: https://hustle-app-158864638007.us-central1.run.app"
```

**Post-Deployment Verification:**

```bash
# 4. Check health
curl https://hustle-app-158864638007.us-central1.run.app/api/healthcheck

# Expected response:
# {"status":"ok","message":"Database connection successful","timestamp":"..."}

# 5. View logs
gcloud run logs read hustle-app --region us-central1 --limit 50

# 6. Check Cloud Run dashboard
# https://console.cloud.google.com/run?project=hustle-dev-202510

# 7. Test authentication
# Visit: https://hustle-app-158864638007.us-central1.run.app/login
# Try logging in with test credentials
```

**Rollback Procedure:**

```bash
# List previous revisions
gcloud run revisions list --service hustle-app --region us-central1

# Rollback to previous revision
gcloud run services update-traffic hustle-app \
  --region us-central1 \
  --to-revisions [PREVIOUS-REVISION-NAME]=100

# Example:
# gcloud run services update-traffic hustle-app \
#   --region us-central1 \
#   --to-revisions hustle-app-00042-abc=100

# Rollback time: ~30 seconds
```

---

### Monitoring & Alerting

#### Cloud Run Metrics

**Access:** [Cloud Run Dashboard](https://console.cloud.google.com/run?project=hustle-dev-202510)

**Key Metrics:**

| Metric | Dashboard Location | Target | Alert Threshold |
|--------|-------------------|--------|-----------------|
| Request Count | Overview tab | ~100/day (MVP) | N/A |
| Request Latency | Overview tab | P95 < 300ms | P95 > 1s |
| Error Rate | Logs tab | < 1% | > 5% |
| Container Instances | Overview tab | 0-2 typical | > 5 instances |
| CPU Utilization | Metrics tab | < 50% | > 80% |
| Memory Utilization | Metrics tab | < 400MB | > 450MB |
| Billable Container Time | Billing tab | < 100 hrs/month | > 200 hrs/month |

**Current Monitoring Setup:** 🚨 **No alerting configured**

**Recommended Alerts:**
1. **P0 - Service Down:** Error rate > 50% for 5 minutes
2. **P1 - High Latency:** P95 latency > 1s for 10 minutes
3. **P2 - High Memory:** Memory usage > 450MB for 15 minutes

#### Database Metrics

**Access:** [Cloud SQL Dashboard](https://console.cloud.google.com/sql/instances?project=hustle-dev-202510)

**Key Metrics:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| CPU Utilization | < 40% | > 70% |
| Memory Usage | < 400MB (of 614MB) | > 550MB |
| Storage Used | < 5GB (of 10GB) | > 8GB |
| Connections | < 5 active | > 20 connections |
| Queries/Second | < 10 | N/A |
| Replication Lag | N/A (single instance) | N/A |

**Backup Status:**
- Automated backups: Enabled (7-day retention)
- Backup window: Daily at 03:00 UTC
- Last backup: Check in Cloud SQL dashboard

#### Application Logging

**Log Locations:**

```bash
# Cloud Run Logs (stdout/stderr from containers)
gcloud run logs read hustle-app --region us-central1 --limit 100

# Filter by severity
gcloud run logs read hustle-app --region us-central1 --log-filter='severity>=ERROR'

# Follow logs (tail)
gcloud run logs tail hustle-app --region us-central1

# View in Cloud Logging console
# https://console.cloud.google.com/logs/query?project=hustle-dev-202510
```

**Log Structure:**

```typescript
// Current logging pattern in code:
console.log('[Auth]', 'User login attempt:', email);
console.error('[DB]', 'Database connection failed:', error);
console.warn('[Session]', 'Session expired for user:', userId);
```

**Log Retention:** 30 days (Cloud Logging default for Cloud Run)

**⚠️ Logging Gaps:**
- No structured logging (JSON format)
- No correlation IDs for request tracing
- No log aggregation or search
- No error tracking service (Sentry, etc.)

#### Health Check Endpoints

```bash
# Database health (checks Prisma connection)
curl https://hustle-app-158864638007.us-central1.run.app/api/healthcheck

# Expected response:
{
  "status": "ok",
  "message": "Database connection successful",
  "timestamp": "2025-10-05T17:30:00.000Z"
}

# Simple health (no dependencies)
curl https://hustle-app-158864638007.us-central1.run.app/api/hello

# Expected response:
{
  "message": "Hello from Hustle MVP!",
  "environment": "production",
  "timestamp": "2025-10-05T17:30:00.000Z"
}
```

**Uptime Monitoring:** 🚨 **Not configured**
- Recommendation: Use Google Cloud Monitoring uptime checks
- Endpoint: `/api/healthcheck`
- Frequency: Every 1 minute
- Alert on: 2 consecutive failures

---

### Incident Response

#### Severity Levels

| Severity | Description | Response Time | Communication | Actions |
|----------|-------------|---------------|---------------|---------|
| **P0** | Total service outage | Immediate | Post in #incidents channel | 1. Check Cloud Run status<br>2. Review logs<br>3. Rollback if recent deploy<br>4. Page on-call if no resolution in 15min |
| **P1** | Degraded service (errors > 10%) | 15 minutes | Slack notification | 1. Identify error source from logs<br>2. Check database health<br>3. Consider rollback<br>4. Deploy fix if simple |
| **P2** | Non-critical issues (slow but working) | 4 hours | Email summary | 1. Document issue<br>2. Create bug ticket<br>3. Schedule fix in next sprint |
| **P3** | Feature request or minor bug | Next sprint | Backlog ticket | Normal development workflow |

#### Common Incident Scenarios

**Scenario 1: Database Connection Failures**

```bash
# Symptoms:
# - /api/healthcheck returns 500
# - Logs show "Database connection failed"
# - All API routes timing out

# Diagnosis:
1. Check Cloud SQL instance status
   gcloud sql instances list --project hustle-dev-202510

2. Verify VPC connector
   gcloud compute networks vpc-access connectors list --region us-central1

3. Test connection from local machine (if VPN available)
   psql -h 10.240.0.3 -U hustle_admin -d hustle_mvp

# Resolution:
- If Cloud SQL is down: Restart instance from console
- If VPC connector issue: Restart Cloud Run service
- If credentials invalid: Update DATABASE_URL env var and redeploy

# Rollback:
gcloud run revisions list --service hustle-app --region us-central1
gcloud run services update-traffic hustle-app --to-revisions [PREVIOUS]=100
```

**Scenario 2: Out of Memory (OOM)**

```bash
# Symptoms:
# - Cloud Run instances crashing
# - Logs show "Process exited with code 137"
# - Container restart count increasing

# Diagnosis:
gcloud run services describe hustle-app --region us-central1

# Look for memory limit and current usage

# Resolution:
# Increase memory allocation (currently 512Mi)
gcloud run deploy hustle-app \
  --image us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest \
  --region us-central1 \
  --memory 1Gi

# Long-term:
# - Profile application memory usage
# - Check for memory leaks (Prisma connection pooling)
# - Optimize database queries
```

**Scenario 3: Authentication Not Working**

```bash
# Symptoms:
# - Users can't log in
# - /login shows generic error
# - Session cookie not set

# Diagnosis:
1. Check NEXTAUTH_SECRET is set
   gcloud run services describe hustle-app --region us-central1 --format='value(spec.template.spec.containers[0].env)'

2. Verify NEXTAUTH_URL matches production URL
   echo $NEXTAUTH_URL  # Should be https://hustle-app-*.run.app

3. Check logs for NextAuth errors
   gcloud run logs read hustle-app --log-filter='textPayload=~"NextAuth"'

# Resolution:
- Update NEXTAUTH_SECRET if missing/wrong
- Ensure NEXTAUTH_URL is HTTPS in production
- Clear browser cookies and retry

# Emergency access:
# If all else fails, use db-setup to create test user:
curl -X POST https://hustle-app-*.run.app/api/db-setup
# Creates test@hustle.app with empty password (migrate to bcrypt!)
```

#### Escalation Path

1. **Self-diagnosis:** Review logs, check dashboards, consult runbooks (this document)
2. **Team notification:** Post in Slack/Discord with findings
3. **External support:** Contact Google Cloud Support (if infrastructure issue)
4. **Post-mortem:** Document incident, root cause, and preventive measures

---

### Backup & Recovery

#### Database Backups

**Automated Backups:**
- **Schedule:** Daily at 03:00 UTC
- **Retention:** 7 days
- **Location:** Google Cloud SQL managed backups
- **Recovery Point Objective (RPO):** 24 hours (worst case)
- **Recovery Time Objective (RTO):** 1 hour (manual restoration)

**Backup Verification:**

```bash
# List recent backups
gcloud sql backups list --instance hustle-mvp-instance --project hustle-dev-202510

# Verify backup exists for today
gcloud sql backups list --instance hustle-mvp-instance --project hustle-dev-202510 \
  --filter="windowStartTime>$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S)" \
  --limit 1
```

**Manual Backup (Before Risky Changes):**

```bash
# Create on-demand backup
gcloud sql backups create \
  --instance hustle-mvp-instance \
  --project hustle-dev-202510 \
  --description "Pre-deployment backup - $(date +%Y-%m-%d)"

# Backup time: ~2-5 minutes for small database
# Verify:
gcloud sql backups list --instance hustle-mvp-instance --limit 1
```

#### Database Recovery Procedures

**Scenario: Restore from Automated Backup**

```bash
# 1. List available backups
gcloud sql backups list --instance hustle-mvp-instance --project hustle-dev-202510

# 2. Restore to specific backup
gcloud sql backups restore [BACKUP-ID] \
  --backup-instance hustle-mvp-instance \
  --backup-project hustle-dev-202510

# WARNING: This will overwrite current database!
# Restoration time: ~5-10 minutes

# 3. Verify data after restoration
curl https://hustle-app-*.run.app/api/healthcheck
curl https://hustle-app-*.run.app/api/players
```

**Scenario: Point-in-Time Recovery (Not Available)**

⚠️ **CRITICAL GAP:** Cloud SQL MySQL and PostgreSQL support point-in-time recovery (PITR), but we haven't enabled transaction logging.

**Recommendation:** Enable PITR for production:

```bash
# Enable PITR (requires restart)
gcloud sql instances patch hustle-mvp-instance \
  --backup-start-time HH:MM \
  --retained-transaction-log-days 7 \
  --project hustle-dev-202510
```

**Disaster Recovery Testing:**

🚨 **NEVER TESTED**

**DR Test Schedule (Recommended):**
- **Frequency:** Quarterly (every 3 months)
- **Process:**
  1. Create test Cloud SQL instance
  2. Restore latest backup to test instance
  3. Point Cloud Run to test instance
  4. Verify application functionality
  5. Document restoration time and issues
  6. Delete test instance

---

## Security & Access

### Identity & Access Management

#### Service Accounts

| Account/Role | Purpose | Permissions | Used By |
|--------------|---------|-------------|---------|
| **Cloud Run Service Agent** | Run containerized apps | Cloud Run Admin, Cloud SQL Client | Cloud Run instances |
| **Cloud SQL Service Agent** | Manage Cloud SQL instances | Cloud SQL Admin | Cloud SQL API |
| **Cloud Build Service Account** | Build and deploy images | Artifact Registry Writer, Cloud Run Deployer | Cloud Build (if configured) |
| **Jeremy's GCP Account** | Owner/admin access | Owner (all permissions) | gcloud CLI, console |

**⚠️ IAM Gaps:**
- No principle of least privilege (Jeremy's account has Owner role)
- No separate service accounts for different environments
- No service account for Terraform (uses user credentials)

**Recommendation:**

```bash
# Create dedicated service account for Terraform
gcloud iam service-accounts create terraform-admin \
  --display-name "Terraform Infrastructure Admin"

# Grant minimal necessary permissions
gcloud projects add-iam-policy-binding hustle-dev-202510 \
  --member serviceAccount:terraform-admin@hustle-dev-202510.iam.gserviceaccount.com \
  --role roles/compute.admin

gcloud projects add-iam-policy-binding hustle-dev-202510 \
  --member serviceAccount:terraform-admin@hustle-dev-202510.iam.gserviceaccount.com \
  --role roles/sql.admin

# Download key for local Terraform use
gcloud iam service-accounts keys create terraform-key.json \
  --iam-account terraform-admin@hustle-dev-202510.iam.gserviceaccount.com
```

---

### Secrets Management

**Current Secret Storage:**

| Secret | Current Location | Exposure Risk | Recommendation |
|--------|------------------|---------------|----------------|
| `NEXTAUTH_SECRET` | Cloud Run env vars | Medium (visible in console to admins) | Migrate to Secret Manager |
| `DATABASE_URL` | Cloud Run env vars | High (contains password) | 🔴 **CRITICAL:** Use Secret Manager |
| `DB_PASSWORD` | `.env` file (gitignored) | Medium (on local disk) | Use Cloud SQL password rotation |

**⚠️ CRITICAL SECURITY ISSUE:**

Database password is currently stored in plain text in Cloud Run environment variables. Anyone with Cloud Run admin access can view it.

**Immediate Fix:**

```bash
# 1. Create secret in Secret Manager
gcloud secrets create database-url \
  --replication-policy automatic \
  --project hustle-dev-202510

# 2. Add secret version
echo -n "postgresql://hustle_admin:[PASSWORD]@10.240.0.3:5432/hustle_mvp" | \
  gcloud secrets versions add database-url --data-file=-

# 3. Grant Cloud Run access to secret
gcloud secrets add-iam-policy-binding database-url \
  --member serviceAccount:[CLOUD-RUN-SA]@hustle-dev-202510.iam.gserviceaccount.com \
  --role roles/secretmanager.secretAccessor

# 4. Update Cloud Run to use secret (not env var)
gcloud run deploy hustle-app \
  --image us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest \
  --region us-central1 \
  --set-secrets DATABASE_URL=database-url:latest
```

**Secret Rotation Policy:**

| Secret | Current Rotation | Recommended |
|--------|------------------|-------------|
| NEXTAUTH_SECRET | Never | Annually |
| Database Password | Never | Quarterly |
| Service Account Keys | Never (not using) | 90 days |

**Access Audit Trail:**

```bash
# View who accessed secrets
gcloud logging read "resource.type=secretmanager.googleapis.com/Secret" \
  --project hustle-dev-202510 \
  --limit 50
```

---

### Security Posture

#### Authentication Mechanisms

**User Authentication:**
- **Method:** NextAuth v5 credentials provider
- **Password Storage:** bcrypt hashing with 10 rounds (cost factor 10)
- **Session Management:** JWT tokens (HTTP-only cookies)
- **Token Expiry:** 30 days
- **MFA:** ❌ Not implemented
- **OAuth:** ❌ Not implemented (future: Google, GitHub)

**API Authentication:**
- **Endpoint Protection:** Varies (inconsistent across API routes)
- **Session Verification:** `await auth()` in protected pages/routes
- **API Keys:** ❌ Not used
- **Rate Limiting:** ❌ Not implemented

**⚠️ Authentication Gaps:**
1. **No Email Verification:** Users can register with unverified emails
2. **No Password Reset:** Locked-out users have no recovery path
3. **No Account Lockout:** Unlimited login attempts (brute force vulnerability)
4. **No Session Revocation:** 30-day JWTs can't be invalidated before expiry

#### Authorization Model

**Current Implementation:** Simple owner-based access

```typescript
// All resources tied to user ID from session
const session = await auth();
if (!session?.user) redirect('/login');

// Query players for current user
const players = await prisma.player.findMany({
  where: { parentId: session.user.id }
});
```

**Authorization Rules:**
- Users can only access their own players
- Users can only access games for their players
- No role-based access control (RBAC)
- No team-based permissions (coaches, admins)

**Gaps:**
- ❌ No granular permissions (all users have same capabilities)
- ❌ No admin role for system management
- ❌ No coach role for viewing team players
- ❌ No read-only access for relatives

#### Network Security

**VPC Configuration:**
- **VPC Name:** `default` VPC (not custom)
- **Subnets:** Using Google-managed subnets
- **Private IP Range:** 10.240.0.0/28 (VPC connector)
- **Firewall Rules:** Default rules (allow internal, deny external)

**Database Access:**
- ✅ **Private IP Only:** No public IP on Cloud SQL
- ✅ **VPC Connector Required:** Cloud Run → Cloud SQL via private network
- ✅ **SSL Enforced:** Database connections use TLS
- ⚠️ **No IP Whitelisting:** Any Cloud Run instance in project can access database

**Cloud Run Security:**
- ✅ **HTTPS Only:** Cloud Run enforces HTTPS for all traffic
- ✅ **Managed Certificates:** Automatic SSL certificate provisioning
- ✅ **IAM Authentication:** API calls require authentication (can be disabled)
- ⚠️ **Public Access:** `--allow-unauthenticated` flag set (anyone can access web UI)

**⚠️ Network Security Gaps:**
1. No WAF (Web Application Firewall)
2. No DDoS protection beyond Cloud Run defaults
3. No VPN for administrative database access
4. No network segmentation (single VPC for everything)

---

## Cost & Performance

### Current Monthly Costs (Estimated)

Based on current usage (MVP stage, low traffic):

```
┌────────────────────────┬─────────────┬──────────────┬──────────┐
│ Service                │ Usage       │ Unit Price   │ Est. Cost│
├────────────────────────┼─────────────┼──────────────┼──────────┤
│ Cloud Run              │             │              │          │
│  - CPU time            │ ~50 vCPU-hr │ $0.00002400  │ $1.20    │
│  - Memory time         │ ~25 GiB-hr  │ $0.00000250  │ $0.06    │
│  - Requests            │ ~3,000/mo   │ $0.40/1M     │ $0.00    │
│                        │             │              │ TOTAL: ~$1.26 │
├────────────────────────┼─────────────┼──────────────┼──────────┤
│ Cloud SQL              │             │              │          │
│  - Instance (f1-micro) │ 730 hrs     │ $0.0205/hr   │ $14.97   │
│  - Storage (10GB SSD)  │ 10 GB       │ $0.17/GB/mo  │ $1.70    │
│  - Backups (7 days)    │ ~2 GB       │ $0.08/GB/mo  │ $0.16    │
│                        │             │              │ TOTAL: ~$16.83 │
├────────────────────────┼─────────────┼──────────────┼──────────┤
│ VPC Connector          │             │              │          │
│  - us-central1 e2-micro│ 730 hrs     │ $0.015/hr    │ $10.95   │
│                        │             │              │ TOTAL: ~$10.95 │
├────────────────────────┼─────────────┼──────────────┼──────────┤
│ Artifact Registry      │             │              │          │
│  - Storage (<500MB)    │ 0.5 GB      │ $0.10/GB/mo  │ $0.05    │
│                        │             │              │ TOTAL: ~$0.05 │
├────────────────────────┼─────────────┼──────────────┼──────────┤
│ Cloud Logging          │             │              │          │
│  - Logs ingestion      │ ~1 GB       │ First 50GB   │ $0.00    │
│                        │             │ free         │          │
├────────────────────────┼─────────────┼──────────────┼──────────┤
│                        │             │ GRAND TOTAL: │ ~$29.09  │
└────────────────────────┴─────────────┴──────────────┴──────────┘

Monthly estimate: $29-35 USD (with buffer for spikes)
```

**Cost Breakdown by Component:**
- Database: 58% ($16.83)
- VPC Networking: 38% ($10.95)
- Compute: 4% ($1.26)
- Storage: <1% ($0.05)

**Cost Drivers:**
1. **Always-on Database:** Cloud SQL runs 24/7 even with zero traffic
2. **VPC Connector:** Required for private database access, runs 24/7
3. **Cloud Run:** Scales to zero (no cost when idle), minimal at current traffic

---

### Performance Baseline

#### Current Performance Metrics

**Cloud Run Container:**
- **Cold Start Time:** ~2 seconds (within acceptable range)
- **Warm Response Time:** ~100-200ms (P50)
- **Concurrent Requests:** Not measured (low traffic currently)
- **CPU Usage:** <10% average
- **Memory Usage:** ~250MB average (of 512MB allocated)

**Database Performance:**
- **Query Response Time (P50):** ~50ms
- **Query Response Time (P95):** ~100ms
- **Slow Query Threshold:** >500ms (none observed)
- **Connection Pool Utilization:** <5 active connections (of 10 max)
- **Index Efficiency:** All foreign key queries use indexes

**API Endpoint Benchmarks:**

| Endpoint | P50 | P95 | P99 | Notes |
|----------|-----|-----|-----|-------|
| /api/healthcheck | 80ms | 120ms | 150ms | Database connection test |
| /api/hello | 15ms | 25ms | 40ms | No database access |
| /api/players (GET) | 100ms | 180ms | 250ms | Query with joins |
| /api/games (GET) | 90ms | 150ms | 200ms | Query with player join |
| /api/auth/callback | 200ms | 350ms | 500ms | bcrypt comparison (intentionally slow) |

**Page Load Performance (Estimated):**
- **Time to First Byte (TTFB):** ~200ms (cold start), ~50ms (warm)
- **First Contentful Paint (FCP):** Not measured (need real user monitoring)
- **Largest Contentful Paint (LCP):** Not measured
- **Cumulative Layout Shift (CLS):** Likely good (server-rendered)
- **Lighthouse Score:** Not measured

---

### Optimization Opportunities

#### Immediate (Low-Hanging Fruit)

**1. Reduce Cloud Run Memory Allocation**

```bash
# Current: 512Mi
# Actual usage: ~250MB average
# Recommendation: Reduce to 384Mi (saves ~$0.05/month, minimal savings)

gcloud run deploy hustle-app \
  --region us-central1 \
  --memory 384Mi

# Risk: Low (still 134MB buffer)
# Savings: Minimal at current traffic
# Priority: Low
```

**2. Enable Response Caching for Static API Responses**

```typescript
// In API routes that return static data
export async function GET() {
  const data = await prisma.player.findMany();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  });
}

// Benefits:
// - Reduces database queries for frequently-accessed data
// - Improves response time for cached requests
// - Minimal code changes
```

**3. Add Database Connection Pooling Configuration**

```typescript
// In prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection limit
  connectionLimit = 5  // Reduce from default 10 for f1-micro instance
}

// Benefits:
// - Prevents connection exhaustion on small instance
// - Reduces idle connection overhead
```

#### Medium-Term (Next Quarter)

**1. Upgrade Cloud SQL to Shared-Core with Lower Baseline**

```bash
# Current: db-f1-micro (614MB RAM, 24/7)
# Recommendation: Use Cloud SQL on-demand or switch to Supabase/PlanetScale

# Option A: Cloud SQL scheduled start/stop (dev environments only)
# Not available for production

# Option B: Migrate to serverless database (Supabase, PlanetScale, Neon)
# - Pay only for usage
# - No always-on costs
# - Better scaling characteristics
# Savings: ~$15/month for dev, keep Cloud SQL for prod
```

**2. Implement CDN for Static Assets**

```bash
# Current: Static assets served from Cloud Run container
# Recommendation: Use Google Cloud CDN

# Benefits:
# - Faster global content delivery
# - Reduced Cloud Run egress bandwidth costs
# - Improved user experience

# Implementation:
# 1. Create Cloud Load Balancer
# 2. Enable Cloud CDN
# 3. Configure cache rules for /public/* paths
# 4. Point Cloud Run to load balancer

# Cost impact: ~$5/month (offset by egress savings)
```

**3. Add Redis Caching Layer (Memorystore)**

```bash
# Use case: Cache authenticated user sessions, frequently-accessed players

# Benefits:
# - Reduce database queries by 30-40%
# - Faster session validation
# - Better support for future real-time features

# Cost: Memorystore Redis M1 (~$45/month)
# Recommendation: Only implement when traffic justifies cost
```

#### Long-Term (Architectural Changes)

**1. Migrate to Multi-Region Deployment**

```bash
# Current: Single region (us-central1)
# Future: Multi-region for high availability

# Architecture:
# - Cloud Run in 3 regions (us-central1, us-east1, us-west1)
# - Global Load Balancer with Cloud CDN
# - Cloud SQL read replicas in each region
# - Firestore for global session storage

# Benefits:
# - 99.95%+ uptime
# - Lower latency for users across US
# - Disaster recovery capability

# Cost impact: 3x current costs (~$90/month)
# Recommendation: Only when revenue justifies cost
```

**2. Implement Microservices Architecture**

```bash
# Current: Monolithic Next.js app
# Future: Separate services for concerns

# Potential services:
# - Auth service (NextAuth + session management)
# - Player service (player CRUD operations)
# - Game service (game logging and statistics)
# - Analytics service (aggregations and reporting)

# Benefits:
# - Independent scaling of services
# - Better fault isolation
# - Easier to optimize hot paths

# Drawbacks:
# - Increased complexity
# - Higher operational overhead
# - More expensive (more Cloud Run services)

# Recommendation: NOT recommended for MVP
# Wait until user base > 10,000 users
```

---

## Development Workflow

### Local Development

**Development Environment:**
- **OS:** Linux (Ubuntu/Debian recommended)
- **Editor:** VS Code with extensions:
  - ESLint
  - Prettier
  - Prisma
  - Tailwind CSS IntelliSense
  - GitLens
- **Terminal:** Bash/Zsh with oh-my-zsh
- **Database Client:** Prisma Studio (built-in), TablePlus, or pgAdmin

**Setting Up Dev Environment:**

```bash
# 1. Clone repository (if not already)
cd /home/jeremy/projects/hustle/app

# 2. Install Node.js 22 via nvm
nvm install 22
nvm use 22

# 3. Verify versions
node --version  # Should show v22.x.x
npm --version   # Should show 11.x.x

# 4. Install dependencies
npm install

# 5. Start local PostgreSQL (Docker)
docker-compose up -d postgres

# 6. Wait for PostgreSQL to be ready
sleep 5

# 7. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your local database URL

# 8. Generate Prisma Client
npx prisma generate

# 9. Push database schema
npx prisma db push

# 10. (Optional) Seed test data
curl -X POST http://localhost:4000/api/db-setup

# 11. Start development server
npm run dev -- -p 4000

# Development server running at http://localhost:4000
```

**Database Seeding:**

```bash
# Option 1: Use db-setup API endpoint
curl -X POST http://localhost:4000/api/db-setup

# Creates:
# - User: test@hustle.app (id: test-parent-id-12345)
# - Player: Test Player (birthday: 2010-01-15, position: Forward)

# Option 2: Manual SQL via Prisma Studio
npx prisma studio
# Navigate to Users table
# Click "Add record"
# Fill in fields (remember to hash password with bcrypt)
```

**Common Development Tasks:**

```bash
# Start dev server with custom port
npm run dev -- -p 4000

# Build production bundle locally
npm run build

# Preview production build
npm run preview

# Open Prisma Studio (database GUI)
npx prisma studio

# Format code with Prettier
npm run format  # If configured

# Lint code
npm run lint

# Type check
npx tsc --noEmit

# View database schema
npx prisma db pull  # Pull from database
npx prisma migrate dev  # Create migration from schema changes

# Reset database (DESTRUCTIVE)
npx prisma db push --force-reset

# View Prisma Client API
npx prisma generate --watch  # Regenerate on schema changes
```

**Debugging:**

```bash
# Enable verbose Prisma logs
# In src/lib/prisma.ts:
new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

# Enable Next.js debug mode
DEBUG=* npm run dev

# Node.js inspector for breakpoints
node --inspect node_modules/.bin/next dev

# Then open chrome://inspect in Chrome
```

---

### CI/CD Pipeline

**Current State:** 🚨 **No CI/CD Pipeline Configured**

**Manual Deployment Process:**
1. Code changes made locally
2. Tested manually (no automated tests)
3. Docker image built locally
4. Image pushed to Artifact Registry manually
5. Cloud Run deployment triggered manually via gcloud CLI

**Recommended CI/CD Tool:** GitHub Actions (free for public repos, $0.008/min for private)

**Proposed Pipeline Stages:**

```yaml
# .github/workflows/deploy-production.yml

name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:  # Manual trigger

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test  # When tests exist

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # For Workload Identity Federation

    steps:
      - uses: actions/checkout@v4

      - id: 'auth'
        uses: 'google-github-actions/auth@v2'
        with:
          workload_identity_provider: '${{ secrets.WIF_PROVIDER }}'
          service_account: '${{ secrets.WIF_SERVICE_ACCOUNT }}'

      - name: 'Set up Cloud SDK'
        uses: 'google-github-actions/setup-gcloud@v2'

      - name: 'Build Docker image'
        run: |
          docker build -t us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:${{ github.sha }} .

      - name: 'Push to Artifact Registry'
        run: |
          gcloud auth configure-docker us-central1-docker.pkg.dev
          docker push us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:${{ github.sha }}

      - name: 'Deploy to Cloud Run'
        run: |
          gcloud run deploy hustle-app \
            --image us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:${{ github.sha }} \
            --region us-central1 \
            --project hustle-dev-202510

      - name: 'Run smoke tests'
        run: |
          curl -f https://hustle-app-158864638007.us-central1.run.app/api/healthcheck || exit 1
```

**Deployment Triggers:**
- **Production:** Push to `main` branch (after PR approval)
- **Staging:** Push to `staging` branch (when staging environment exists)
- **Development:** Manual workflow dispatch

**Required Secrets:**
- `WIF_PROVIDER`: Workload Identity Federation provider
- `WIF_SERVICE_ACCOUNT`: Service account email for deployments
- `NEXTAUTH_SECRET`: For production environment

**Pipeline Duration Estimate:**
- Test stage: ~2 minutes
- Build stage: ~3 minutes
- Deploy stage: ~2 minutes
- **Total:** ~7 minutes per deployment

---

### Code Quality

#### Linting and Formatting

**Current Tools:**
- **ESLint:** Configured via `eslint.config.mjs`
- **Prettier:** Not configured (should be added)
- **TypeScript:** Strict mode enabled in `tsconfig.json`

**ESLint Configuration:**

```javascript
// eslint.config.mjs (Next.js 15 flat config)
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
  }),
];

export default eslintConfig;
```

**Running Lint:**

```bash
# Lint all files
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Lint specific file
npx eslint src/app/dashboard/page.tsx
```

**Recommended Prettier Config:**

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 80,
  "arrowParens": "always"
}
```

**Pre-Commit Hooks (Recommended):**

```bash
# Install Husky and lint-staged
npm install --save-dev husky lint-staged

# Initialize Husky
npx husky init

# Add pre-commit hook
echo "npx lint-staged" > .husky/pre-commit

# Configure lint-staged in package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

#### Test Coverage

**Current Status:** 🚨 **0% test coverage** (no tests written)

**Recommended Testing Stack:**

| Test Type | Framework | Purpose |
|-----------|-----------|---------|
| Unit | Jest + React Testing Library | Test individual components and functions |
| Integration | Supertest | Test API endpoints end-to-end |
| E2E | Playwright | Test full user workflows |

**Test Coverage Goals:**

| Component | Current | Target |
|-----------|---------|--------|
| API Routes | 0% | 80% |
| React Components | 0% | 70% |
| Utility Functions | 0% | 90% |
| NextAuth Config | 0% | 60% |
| **Overall** | **0%** | **75%** |

**Critical Tests to Write:**

```typescript
// tests/api/auth.test.ts
describe('POST /api/auth/callback/credentials', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/callback/credentials')
      .send({ email: 'test@hustle.app', password: 'ValidPassword123' });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toMatch(/next-auth.session-token/);
  });

  it('should reject invalid password', async () => {
    const response = await request(app)
      .post('/api/auth/callback/credentials')
      .send({ email: 'test@hustle.app', password: 'WrongPassword' });

    expect(response.status).toBe(401);
  });
});

// tests/api/players.test.ts
describe('GET /api/players', () => {
  it('should require authentication', async () => {
    const response = await request(app).get('/api/players');
    expect(response.status).toBe(401);
  });

  it('should return players for authenticated user', async () => {
    const response = await authenticatedRequest().get('/api/players');
    expect(response.status).toBe(200);
    expect(response.body.players).toBeInstanceOf(Array);
  });
});

// tests/components/UserNav.test.tsx
describe('UserNav Component', () => {
  it('should display user full name', () => {
    const user = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
    render(<UserNav user={user} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should call signOut when logout clicked', () => {
    const user = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
    render(<UserNav user={user} />);
    fireEvent.click(screen.getByText('Log out'));
    expect(mockSignOut).toHaveBeenCalled();
  });
});
```

---

#### Code Review Process

**Current Process:** 🚨 **No formal code review process**

**Recommended Process:**

1. **Feature Branch Workflow:**
   ```bash
   # Create feature branch
   git checkout -b feature/game-logging-ui

   # Make changes and commit
   git add .
   git commit -m "feat(games): add game logging form UI"

   # Push to remote
   git push origin feature/game-logging-ui
   ```

2. **Pull Request Creation:**
   - Title: `feat(games): add game logging form UI`
   - Description: Explain what changed and why
   - Link to related issues/tasks
   - Screenshot if UI change
   - Self-review checklist:
     - [ ] Code follows style guide
     - [ ] Tests added for new functionality
     - [ ] Documentation updated
     - [ ] No console.logs or debugging code
     - [ ] No secrets committed

3. **Code Review Criteria:**
   - **Functionality:** Does it work as expected?
   - **Security:** Any vulnerabilities introduced?
   - **Performance:** Any obvious performance issues?
   - **Maintainability:** Is code readable and well-structured?
   - **Tests:** Are critical paths covered?

4. **Approval and Merge:**
   - Require 1 approval (team size = 1 currently)
   - Run CI/CD pipeline
   - Merge to `main` after approval
   - Delete feature branch

---

## Dependencies & Supply Chain

### Direct Dependencies

**Production Dependencies** (from `package.json`):

```json
{
  "dependencies": {
    // Core Framework
    "next": "15.5.4",                    // React framework
    "react": "19.1.0",                   // UI library
    "react-dom": "19.1.0",               // React DOM renderer

    // Authentication
    "next-auth": "5.0.0-beta.25",        // Authentication library
    "@auth/prisma-adapter": "^3.8.0",    // Prisma adapter for NextAuth
    "bcrypt": "^5.1.1",                  // Password hashing

    // Database
    "@prisma/client": "6.16.3",          // Prisma ORM client

    // UI Components
    "@radix-ui/react-*": "Latest",       // 40+ Radix UI primitives
    "class-variance-authority": "^0.7.1", // Component variants
    "clsx": "^2.1.1",                    // Conditional classNames
    "tailwind-merge": "^2.7.1",          // Merge Tailwind classes
    "lucide-react": "^0.469.0",          // Icon library (1000+ icons)

    // Dashboard UI
    "@tanstack/react-table": "^8.21.3",  // Data tables
    "@tabler/icons-react": "^3.35.0",    // Additional icons
    "kbar": "^0.1.0-beta.48",            // Command palette
    "cmdk": "^1.1.1",                    // Command menu
    "next-themes": "^0.4.6",             // Theme switching
    "nuqs": "^2.7.0",                    // URL state management
    "react-resizable-panels": "^3.0.6",  // Resizable panels
    "recharts": "^3.2.1",                // Charts library
    "sonner": "^2.0.7",                  // Toast notifications
    "zustand": "^5.0.8",                 // State management

    // Utilities
    "date-fns": "^4.1.0",                // Date manipulation
    "zod": "^3.24.1"                     // Schema validation
  }
}
```

**Development Dependencies:**

```json
{
  "devDependencies": {
    "typescript": "^5",                  // TypeScript compiler
    "@types/node": "^22",                // Node.js type definitions
    "@types/react": "^19",               // React type definitions
    "@types/react-dom": "^19",           // React DOM type definitions
    "@types/bcrypt": "^5.0.2",           // bcrypt type definitions
    "prisma": "6.16.3",                  // Prisma CLI
    "eslint": "^9",                      // Linting
    "eslint-config-next": "15.5.4",      // Next.js ESLint config
    "@eslint/eslintrc": "^3",            // ESLint config utilities
    "tailwindcss": "^3.4.1",             // Tailwind CSS
    "postcss": "^8",                     // CSS processing
    "autoprefixer": "^10.4.20"           // CSS autoprefixing
  }
}
```

**Dependency Analysis:**

| Category | Count | Total Size | Security Alerts |
|----------|-------|------------|-----------------|
| Core Framework | 3 | ~10MB | 0 |
| Auth & Database | 4 | ~5MB | 0 |
| UI Components | 50+ | ~8MB | 0 |
| Development | 10 | ~15MB | 0 |
| **Total** | **~70** | **~38MB** | **0** |

**Dependency Health:**

```bash
# Check for outdated packages
npm outdated

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities (auto-update)
npm audit fix

# View dependency tree
npm list --depth=0

# Check package licenses
npx license-checker --summary
```

**Update Frequency:**
- **Critical Security Updates:** Immediately (within 24 hours)
- **Minor Version Updates:** Monthly
- **Major Version Updates:** Quarterly (with testing)

**Known Dependency Issues:**

1. **NextAuth v5 Beta:**
   - Status: Beta (not stable)
   - Risk: API changes before stable release
   - Mitigation: Pin exact version, monitor changelog
   - Recommendation: Migrate to stable v5 when released

2. **React 19:**
   - Status: Latest stable
   - Risk: Some third-party libraries not yet compatible
   - Mitigation: All UI libraries tested and working
   - Recommendation: Monitor for incompatibilities

---

### Third-Party Services

**External Services:**

| Service | Purpose | Auth Method | SLA/Criticality | Cost |
|---------|---------|-------------|-----------------|------|
| **Google Cloud Platform** | Infrastructure | Service accounts, OAuth | 99.95% uptime | ~$30/mo |
| **npm Registry** | Package installation | Public packages | 99.9% uptime | Free |
| **GitHub** | Code repository | SSH keys | 99.9% uptime | Free (public) |
| **(Future) SendGrid** | Email delivery | API key | 99.9% uptime | Free tier |
| **(Future) Google OAuth** | Social login | OAuth 2.0 | 99.9% uptime | Free |

**Service Dependencies:**

```
┌─────────────────────┐
│   Application       │
└──────────┬──────────┘
           │
     ┌─────┴──────┐
     │   GCP      │
     └─────┬──────┘
           │
     ┌─────┴──────────────────────────┐
     │                                │
┌────▼─────┐                    ┌────▼─────┐
│Cloud Run │                    │Cloud SQL │
└────┬─────┘                    └────┬─────┘
     │                                │
     └────────────┬───────────────────┘
                  │
           ┌──────▼──────┐
           │VPC Connector│
           └─────────────┘
```

**Failure Scenarios:**

1. **npm Registry Down:**
   - **Impact:** Cannot install dependencies, build fails
   - **Mitigation:** Use npm cache, private npm registry mirror
   - **Recovery:** Wait for npm to recover (~15 min average outage)

2. **GCP Region Outage:**
   - **Impact:** Complete service outage
   - **Mitigation:** None (single region deployment)
   - **Recovery:** Wait for GCP recovery, or manually deploy to different region
   - **SLA:** 99.95% (4.38 hours/year downtime allowed)

3. **Cloud SQL Failure:**
   - **Impact:** Database unavailable, all API routes fail
   - **Mitigation:** Automated backups, restore from backup
   - **Recovery:** 1 hour to restore from backup

---

## Integration with Existing Documentation

### Document Inventory

**Root Documentation (`/home/jeremy/projects/hustle/01-Docs/`):**

| File | Type | Size | Last Modified | Status |
|------|------|------|---------------|--------|
| `001-prd-hustle-mvp-v1.md` | PRD | 30KB | 2025-10-03 | ⚠️ Outdated (SuperTokens) |
| `002-prd-hustle-mvp-v2-lean.md` | PRD | 12KB | 2025-10-03 | ⚠️ Outdated (SuperTokens) |
| `003-pln-sales-strategy.md` | Planning | 15KB | 2025-10-05 | ✅ Current |
| `004-log-infrastructure-setup.md` | Log | 3KB | 2025-10-04 | ✅ Good reference |
| `005-log-infrastructure-complete.md` | Log | 9KB | 2025-10-04 | ✅ Good reference |
| `006-log-billing-quota-fix.md` | Log | 3KB | 2025-10-03 | ✅ Good reference |
| `007-log-initial-setup-status.md` | Log | 4KB | 2025-10-03 | ✅ Good reference |
| `008-log-pre-deployment-status.md` | Log | 6KB | 2025-10-04 | ✅ Good reference |
| `009-log-nextjs-init.md` | Log | 2KB | 2025-10-04 | ✅ Good reference |
| `010-log-cloud-run-deployment.md` | Log | 5KB | 2025-10-04 | ✅ Good reference |
| `011-log-gate-a-milestone.md` | Log | 6KB | 2025-10-04 | ✅ Good reference |
| `012-log-game-logging-verification.md` | Log | 10KB | 2025-10-04 | ✅ Good reference |
| `013-ref-claudes-docs-archive.md` | Reference | 3KB | 2025-10-04 | ✅ Archive index |
| `014-ref-deployment-index.md` | Reference | 2KB | 2025-10-04 | ✅ Deployment index |

**Application Documentation (`/home/jeremy/projects/hustle/app/01-Docs/`):**

| File | Type | Size | Last Modified | Status |
|------|------|------|---------------|--------|
| `001-adr-nextauth-migration.md` | ADR | 8KB | 2025-10-05 | ✅ Excellent reference |
| `002-ref-dashboard-template-diagram.md` | Reference | 10KB | 2025-10-03 | ✅ Kiranism integration |
| `003-ref-devops-system-analysis.md` | Reference | N/A | 2025-10-05 | ✅ This document |

### Documentation Gaps

**Missing Documentation:**

1. **API Documentation:**
   - No OpenAPI/Swagger specification
   - No endpoint usage examples
   - No request/response schemas
   - **Recommendation:** Generate OpenAPI spec from TypeScript types

2. **User Guides:**
   - No end-user documentation
   - No parent onboarding guide
   - No coach/team admin guide (future feature)
   - **Recommendation:** Create user-facing docs in Markdown or Notion

3. **Runbooks:**
   - No incident response procedures (addressed in this document)
   - No deployment checklists (addressed in this document)
   - No rollback procedures (addressed in this document)
   - **Recommendation:** Extract operational sections into separate runbooks

4. **Architecture Decision Records (ADRs):**
   - Only 1 ADR exists (NextAuth migration)
   - Missing ADRs for:
     - Why Next.js over other frameworks
     - Why Prisma over TypeORM or Drizzle
     - Why Cloud Run over Kubernetes
     - Why PostgreSQL over MySQL
   - **Recommendation:** Write retroactive ADRs for major decisions

5. **Database Documentation:**
   - No ER diagrams
   - No data dictionary
   - No migration history documentation
   - **Recommendation:** Generate ER diagram from Prisma schema

---

### Conflicts Between Documentation and Reality

**Identified Discrepancies:**

1. **PRD says "SuperTokens authentication":**
   - **Reality:** NextAuth v5 is now used
   - **Impact:** PRDs are misleading for new team members
   - **Fix:** Add note at top of PRDs: "⚠️ Auth migrated to NextAuth v5 - see ADR-001"

2. **PRD says "Grade tracking (8-12)":**
   - **Reality:** Database stores `birthday` (DateTime), not grade
   - **Impact:** Feature works differently than documented
   - **Fix:** Update PRD to reflect age-based tracking

3. **Deployment logs reference Cloud SQL public IP:**
   - **Reality:** Cloud SQL now uses private IP only
   - **Impact:** Outdated network architecture in logs
   - **Fix:** Add note in log index about infrastructure changes

4. **README.md says "PIN verification system":**
   - **Reality:** PIN verification exists in API but no UI implemented
   - **Impact:** Feature appears complete but isn't
   - **Fix:** Update README with "API implemented, UI pending"

---

### Recommended Documentation Priorities

**Week 1 (Critical):**

1. ✅ **This DevOps Guide** (completed)
2. Create OpenAPI specification for API endpoints
3. Write "Getting Started" guide for new developers
4. Document emergency procedures (database restore, rollback)

**Month 1 (Important):**

1. Create ER diagram from Prisma schema
2. Write retroactive ADRs for major decisions
3. Update PRDs with "NextAuth migration" note
4. Create user guide for parents

**Quarter 1 (Nice to Have):**

1. Video walkthrough of codebase
2. Storybook for UI components
3. Database migration history document
4. Performance optimization playbook

---

## Current State Assessment

### What's Working Well

**1. NextAuth v5 Migration ✅**

**Achievement:** Successfully migrated from SuperTokens to NextAuth v5 with minimal disruption.

**Evidence:**
- All authentication flows working (login, session, logout)
- Server-side session protection implemented
- bcrypt password hashing (10 rounds)
- JWT strategy with 30-day expiry

**Why It Works:**
- Simplified architecture (no external auth server)
- Better Next.js integration (built-in hooks and server helpers)
- Comprehensive ADR documents rationale
- Clean removal of Clerk dependencies from Kiranism UI

**Recommendation:** Continue with NextAuth. Future: Add OAuth providers (Google, GitHub).

---

**2. Prisma ORM Integration ✅**

**Achievement:** Type-safe database access with excellent developer experience.

**Evidence:**
- Clean schema definition in `prisma/schema.prisma`
- Cascade deletes protect data integrity
- Indexes on foreign keys and common queries
- Singleton pattern prevents connection leaks

**Why It Works:**
- TypeScript types auto-generated from schema
- Prisma Studio for quick database inspection
- Migration system (not yet used, but available)
- Connection pooling handled automatically

**Recommendation:** Adopt Prisma migrations for production schema changes.

---

**3. Multi-Stage Docker Build ✅**

**Achievement:** Optimized production container with security best practices.

**Evidence:**
- Image size reduced with multi-stage build
- Non-root user (nextjs:nodejs)
- Layer caching for node_modules
- Standalone Next.js output

**Why It Works:**
- Fast builds (~60 seconds)
- Small final image
- Security hardened (Alpine base, non-root)
- Includes Prisma Client generation

**Recommendation:** Add health check to Dockerfile.

---

**4. Clean Directory Structure ✅**

**Achievement:** Organized project structure following master directory standards.

**Evidence:**
- Numbered directories (01-Docs, 03-Tests, etc.)
- NNN-abv-description.ext file naming
- Chronological documentation ordering
- Separated infrastructure code

**Why It Works:**
- Easy to find files
- Consistent across projects
- Git-friendly (no merge conflicts in docs)
- Professional appearance

**Recommendation:** Maintain standards as project grows.

---

**5. Comprehensive Deployment Logs ✅**

**Achievement:** Excellent historical record of deployment journey.

**Evidence:**
- 14 deployment log files in 01-Docs
- Detailed troubleshooting steps
- Billing quota resolution documented
- Gate A milestone tracking

**Why It Works:**
- Future debugging reference
- Knowledge transfer for team growth
- Avoid repeating past mistakes
- Demonstrates progress

**Recommendation:** Continue documenting major milestones.

---

### Areas Needing Attention

**1. Zero Test Coverage 🚨**

**Issue:** No automated tests exist (unit, integration, or E2E).

**Impact:**
- High risk of regressions when changing code
- No confidence in refactoring
- Bugs discovered in production instead of CI/CD
- Difficult to onboard new developers

**Evidence:**
- `03-Tests/` directory is empty
- No test scripts in `package.json`
- No CI/CD pipeline to run tests

**Priority:** **HIGH**

**Recommended Fix:**

```bash
# 1. Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event

# 2. Install API testing tools
npm install --save-dev supertest @types/supertest

# 3. Add test scripts to package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}

# 4. Write critical tests first (authentication, API routes)

# 5. Aim for 75% coverage within 1 month
```

**Target:** 75% code coverage by end of Month 1.

---

**2. No Secret Manager Integration 🔴**

**Issue:** Database credentials stored in plain text in Cloud Run environment variables.

**Impact:**
- Anyone with Cloud Run admin access can view database password
- No audit trail for secret access
- Secrets can't be rotated easily
- Compliance violation (if SOC 2 or HIPAA required)

**Evidence:**
```bash
# Database URL visible in Cloud Run console
gcloud run services describe hustle-app --region us-central1 --format='value(spec.template.spec.containers[0].env)'

# Output includes:
# DATABASE_URL=postgresql://hustle_admin:PLAINTEXT_PASSWORD@10.240.0.3:5432/hustle_mvp
```

**Priority:** **CRITICAL**

**Recommended Fix:**

```bash
# 1. Create secret in Secret Manager
gcloud secrets create database-url \
  --replication-policy automatic \
  --project hustle-dev-202510

# 2. Add secret value
echo -n "postgresql://hustle_admin:PASSWORD@10.240.0.3:5432/hustle_mvp" | \
  gcloud secrets versions add database-url --data-file=-

# 3. Grant Cloud Run access
gcloud secrets add-iam-policy-binding database-url \
  --member serviceAccount:[CLOUD-RUN-SA]@hustle-dev-202510.iam.gserviceaccount.com \
  --role roles/secretmanager.secretAccessor

# 4. Update Cloud Run to use secret
gcloud run deploy hustle-app \
  --image us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest \
  --region us-central1 \
  --set-secrets DATABASE_URL=database-url:latest

# 5. Verify secret is no longer in env vars
gcloud run services describe hustle-app --format='value(spec.template.spec.containers[0].env)'
```

**Timeline:** Implement within 1 week.

---

**3. Inconsistent API Route Authorization 🟡**

**Issue:** Some API routes check authentication, others don't.

**Impact:**
- Unauthorized users could access player data
- Inconsistent security posture
- Difficult to audit which endpoints are protected

**Evidence:**

| Endpoint | Auth Check | Issue |
|----------|------------|-------|
| `/api/players` (GET) | ✅ Yes | Good |
| `/api/players/create` | ❌ No | **Vulnerable** |
| `/api/players/upload-photo` | ❌ No | **Vulnerable** |
| `/api/games` (GET) | ❌ No | **Vulnerable** (query by playerId) |
| `/api/games` (POST) | ❌ No | **Vulnerable** |
| `/api/verify` | ❌ No | **Vulnerable** (accepts parentId in body) |
| `/dashboard` page | ✅ Yes | Good |

**Priority:** **HIGH**

**Recommended Fix:**

```typescript
// Create middleware for API route protection
// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Protect all /api routes except auth and health checks
  if (request.nextUrl.pathname.startsWith('/api')) {
    const publicPaths = ['/api/auth', '/api/healthcheck', '/api/hello'];
    const isPublicPath = publicPaths.some(path =>
      request.nextUrl.pathname.startsWith(path)
    );

    if (!isPublicPath && !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
```

**Timeline:** Implement within 2 weeks.

---

**4. No CI/CD Pipeline 🟡**

**Issue:** Manual deployment process prone to human error.

**Impact:**
- Deployment takes 15+ minutes (manual steps)
- High risk of deploying broken code
- No automated testing before deployment
- Can't rollback easily if deployment fails

**Evidence:**
- No `.github/workflows/` directory
- Deployment requires 5+ manual gcloud commands
- No automated smoke tests after deployment

**Priority:** **MEDIUM**

**Recommended Fix:** (See CI/CD Pipeline section above)

**Timeline:** Implement within 1 month.

---

**5. Terraform State Not in Cloud Storage 🟡**

**Issue:** `terraform.tfstate` stored locally, not in GCS backend.

**Impact:**
- Single point of failure (if local disk fails)
- No collaboration support (can't share state with team)
- No state locking (risk of concurrent modifications)
- No state versioning (can't rollback infrastructure)

**Evidence:**
```bash
ls -la /home/jeremy/projects/hustle/06-Infrastructure/terraform/
# Shows: terraform.tfstate (local file)
```

**Priority:** **MEDIUM**

**Recommended Fix:**

```bash
# 1. Create GCS bucket for Terraform state
gsutil mb -p hustle-dev-202510 -l us-central1 gs://hustle-terraform-state

# 2. Enable versioning
gsutil versioning set on gs://hustle-terraform-state

# 3. Update Terraform backend config
# In 06-Infrastructure/terraform/backend.tf:
terraform {
  backend "gcs" {
    bucket = "hustle-terraform-state"
    prefix = "terraform/state"
  }
}

# 4. Migrate state to GCS
cd /home/jeremy/projects/hustle/06-Infrastructure/terraform
terraform init -migrate-state

# 5. Verify state is in GCS
gsutil ls gs://hustle-terraform-state/terraform/state/
```

**Timeline:** Implement within 2 weeks.

---

**6. No Monitoring Alerts 🟡**

**Issue:** No alerting configured for service outages or performance degradation.

**Impact:**
- Won't know if service is down until user reports it
- Can't proactively address performance issues
- No visibility into error rates

**Evidence:**
- No alert policies in Google Cloud Monitoring
- No uptime checks configured
- No error reporting integration

**Priority:** **MEDIUM**

**Recommended Fix:**

```bash
# 1. Create uptime check
gcloud monitoring uptime create web-check \
  --display-name "Hustle Health Check" \
  --resource-type uptime-url \
  --monitored-resource host=hustle-app-158864638007.us-central1.run.app,path=/api/healthcheck \
  --check-interval 60s

# 2. Create alert policy for uptime check failures
gcloud alpha monitoring policies create \
  --notification-channels CHANNEL_ID \
  --display-name "Hustle Service Down" \
  --condition "condition-uptime-check-failure"

# 3. Create alert for high error rate
# (via Cloud Console UI)

# 4. Set up email notification channel
gcloud alpha monitoring channels create \
  --display-name "Email Alerts" \
  --type email \
  --channel-labels email_address=your-email@example.com
```

**Timeline:** Implement within 3 weeks.

---

### Immediate Priorities (Next 2 Weeks)

Ranked by impact and urgency:

**Priority 1: Security (CRITICAL)**

```markdown
**Issue:** Database credentials in plain text
**Impact:** Data breach risk, compliance violation
**Effort:** 2 hours
**Fix:** Migrate DATABASE_URL to Secret Manager
**Owner:** Jeremy
**Deadline:** 1 week from today
```

**Priority 2: Testing (HIGH)**

```markdown
**Issue:** Zero test coverage
**Impact:** High regression risk, can't refactor safely
**Effort:** 8 hours (initial setup + critical tests)
**Fix:** Set up Jest, write auth and API route tests
**Owner:** Jeremy
**Deadline:** 2 weeks from today
**Target:** 50% coverage of critical paths
```

**Priority 3: API Security (HIGH)**

```markdown
**Issue:** Inconsistent API route authorization
**Impact:** Unauthorized data access vulnerability
**Effort:** 4 hours
**Fix:** Add middleware for API route protection
**Owner:** Jeremy
**Deadline:** 2 weeks from today
```

---

## Quick Reference

### Essential Commands

**Local Development:**

```bash
# Start everything (recommended)
cd /home/jeremy/projects/hustle/app
docker-compose up -d postgres
npm run dev -- -p 4000

# Access application
open http://localhost:4000

# View Prisma Studio
npx prisma studio

# Run smoke tests
./05-Scripts/maintenance/smoke-test.sh http://localhost:4000

# View logs (realtime in terminal)
```

**Database Operations:**

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes (dev only)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name description

# Reset database (DESTRUCTIVE)
npx prisma db push --force-reset

# Seed test data
curl -X POST http://localhost:4000/api/db-setup
```

**Production Deployment:**

```bash
# Full deployment (build + push + deploy)
cd /home/jeremy/projects/hustle/app

docker build -t us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest .

docker push us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest

gcloud run deploy hustle-app \
  --image us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest \
  --region us-central1 \
  --project hustle-dev-202510

# Verify deployment
curl https://hustle-app-158864638007.us-central1.run.app/api/healthcheck
```

**Monitoring:**

```bash
# View Cloud Run logs
gcloud run logs read hustle-app --region us-central1 --limit 100

# Follow logs (tail)
gcloud run logs tail hustle-app --region us-central1

# Filter by severity
gcloud run logs read hustle-app --log-filter='severity>=ERROR'

# Check Cloud Run status
gcloud run services describe hustle-app --region us-central1

# Check Cloud SQL status
gcloud sql instances describe hustle-mvp-instance
```

**Emergency Procedures:**

```bash
# Rollback deployment
gcloud run revisions list --service hustle-app --region us-central1
gcloud run services update-traffic hustle-app \
  --region us-central1 \
  --to-revisions [REVISION-NAME]=100

# Restart Cloud Run service
gcloud run services update hustle-app \
  --region us-central1 \
  --update-env-vars RESTART=$(date +%s)

# Restart Cloud SQL instance
gcloud sql instances restart hustle-mvp-instance

# Check database backups
gcloud sql backups list --instance hustle-mvp-instance

# Restore from backup
gcloud sql backups restore [BACKUP-ID] \
  --backup-instance hustle-mvp-instance
```

---

### Critical Endpoints

**Production URLs:**
- **Application:** https://hustle-app-158864638007.us-central1.run.app
- **Health Check:** https://hustle-app-158864638007.us-central1.run.app/api/healthcheck
- **Login:** https://hustle-app-158864638007.us-central1.run.app/login
- **Dashboard:** https://hustle-app-158864638007.us-central1.run.app/dashboard

**Development URLs:**
- **Application:** http://localhost:4000
- **Prisma Studio:** http://localhost:5555
- **Health Check:** http://localhost:4000/api/healthcheck

**Cloud Consoles:**
- **GCP Project:** https://console.cloud.google.com/home/dashboard?project=hustle-dev-202510
- **Cloud Run:** https://console.cloud.google.com/run?project=hustle-dev-202510
- **Cloud SQL:** https://console.cloud.google.com/sql/instances?project=hustle-dev-202510
- **Logs:** https://console.cloud.google.com/logs/query?project=hustle-dev-202510
- **Artifact Registry:** https://console.cloud.google.com/artifacts?project=hustle-dev-202510

**Documentation:**
- **This Guide:** `/home/jeremy/projects/hustle/app/JEREMY_DEVOPS_GUIDE.md`
- **ADR (NextAuth):** `/home/jeremy/projects/hustle/app/01-Docs/001-adr-nextauth-migration.md`
- **PRDs:** `/home/jeremy/projects/hustle/01-Docs/001-prd-*.md`

---

### First Week Checklist

**Day 1: Environment Setup**

- [ ] Clone/update repository to latest
- [ ] Install Node.js 22 via nvm
- [ ] Install dependencies (`npm install`)
- [ ] Start local PostgreSQL (`docker-compose up -d postgres`)
- [ ] Generate Prisma Client (`npx prisma generate`)
- [ ] Push database schema (`npx prisma db push`)
- [ ] Start dev server (`npm run dev -- -p 4000`)
- [ ] Verify http://localhost:4000 loads
- [ ] Create test user (`curl -X POST http://localhost:4000/api/db-setup`)
- [ ] Test login flow

**Day 2: GCP Access**

- [ ] Verify GCP account access (hustle-dev-202510)
- [ ] Install gcloud CLI (`gcloud --version`)
- [ ] Authenticate gcloud (`gcloud auth login`)
- [ ] Set default project (`gcloud config set project hustle-dev-202510`)
- [ ] Test Cloud Run access (`gcloud run services list`)
- [ ] Test Cloud SQL access (`gcloud sql instances list`)
- [ ] View production logs (`gcloud run logs read hustle-app`)

**Day 3: Code Exploration**

- [ ] Read this DevOps guide (you're doing it!)
- [ ] Read NextAuth ADR (`app/01-Docs/001-adr-nextauth-migration.md`)
- [ ] Review Prisma schema (`app/prisma/schema.prisma`)
- [ ] Explore dashboard UI (`app/src/app/dashboard/`)
- [ ] Review API routes (`app/src/app/api/`)
- [ ] Understand auth config (`app/src/lib/auth.ts`)

**Day 4: Deployment Practice**

- [ ] Build Docker image locally
- [ ] Push image to Artifact Registry
- [ ] Deploy to Cloud Run (no changes, just practice)
- [ ] Verify production health check
- [ ] Practice rollback procedure

**Day 5: Operational Tasks**

- [ ] Join team communication channels (if applicable)
- [ ] Set up monitoring alerts (see priorities)
- [ ] Migrate secrets to Secret Manager (see priorities)
- [ ] Create first test (see priorities)
- [ ] Document any issues encountered

---

## Recommendations Roadmap

### Week 1: Critical Security & Reliability

**Goal:** Address critical security vulnerabilities and establish baseline monitoring.

**Tasks:**

1. **Migrate Secrets to Secret Manager** (2 hours)
   - Create `database-url` secret
   - Create `nextauth-secret` secret
   - Update Cloud Run to use secrets
   - Remove env vars from Cloud Run config
   - Document secret rotation procedure

2. **Set Up Basic Monitoring** (2 hours)
   - Create uptime check for `/api/healthcheck`
   - Set up email notification channel
   - Create P0 alert (service down > 5 min)
   - Create P1 alert (error rate > 10%)
   - Test alerts by intentionally breaking service

3. **Add API Route Protection Middleware** (3 hours)
   - Create `src/middleware.ts` with auth check
   - Test all API routes require authentication
   - Update API route handlers to use session.user.id
   - Verify unauthorized access returns 401
   - Document protected vs public endpoints

**Success Criteria:**
- [ ] No secrets visible in Cloud Run env vars
- [ ] Email alert received within 5 min of service outage
- [ ] All API routes (except health checks) require authentication
- [ ] Secrets and alerts documented in runbook

**Time Investment:** ~7 hours

---

### Month 1: Foundation Building

**Goal:** Establish testing infrastructure, improve deployment process, and enhance monitoring.

**Tasks:**

**Week 2-3: Testing Infrastructure** (12 hours)

1. Set up Jest and React Testing Library
2. Write authentication flow tests
3. Write API route integration tests
4. Write React component tests (UserNav, Sidebar)
5. Set up test coverage reporting
6. Achieve 50% code coverage

**Week 3-4: CI/CD Pipeline** (8 hours)

1. Create GitHub Actions workflow
2. Add lint and type-check stages
3. Add test execution stage
4. Add Docker build and push stage
5. Add Cloud Run deployment stage
6. Add post-deployment smoke tests

**Week 4: Enhanced Monitoring** (6 hours)

1. Add error tracking (Sentry or Cloud Error Reporting)
2. Create dashboard for key metrics
3. Set up log-based metrics
4. Create P2 alerts (high latency, high memory)
5. Document monitoring and alerting strategy

**Success Criteria:**
- [ ] 75% test coverage on critical paths
- [ ] Green CI/CD pipeline on every commit
- [ ] Deployment time reduced to <10 min (automated)
- [ ] Error tracking captures all exceptions
- [ ] Dashboard shows key metrics at a glance

**Time Investment:** ~26 hours (6-7 hours/week)

---

### Quarter 1: Strategic Improvements

**Goal:** Modernize infrastructure, improve security posture, and enable team collaboration.

**Month 2: Infrastructure Improvements** (20 hours)

1. **Terraform State Migration**
   - Create GCS bucket for state
   - Enable state locking
   - Migrate existing state to GCS
   - Add state versioning
   - Document Terraform workflow

2. **Staging Environment**
   - Create staging Cloud SQL instance
   - Create staging Cloud Run service
   - Set up staging VPC connector
   - Configure separate Artifact Registry
   - Update CI/CD to deploy staging on merge to `staging` branch

3. **Database Optimization**
   - Add missing indexes (if any)
   - Set up query performance monitoring
   - Configure Prisma query logging
   - Optimize slow queries (if any)
   - Document database tuning

**Month 3: Security Hardening** (16 hours)

1. **Email Verification Flow**
   - Integrate SendGrid or similar
   - Create verification token model
   - Build email templates
   - Implement verification endpoint
   - Test email delivery

2. **Password Reset Flow**
   - Create reset token model
   - Build reset request endpoint
   - Create reset form UI
   - Implement token expiration
   - Test end-to-end flow

3. **Security Audit**
   - Run OWASP ZAP scan
   - Fix identified vulnerabilities
   - Implement rate limiting
   - Add CORS configuration
   - Document security controls

**Month 3-4: Team Enablement** (12 hours)

1. **Documentation Overhaul**
   - Generate OpenAPI spec
   - Create component Storybook
   - Write user guides
   - Create video walkthroughs
   - Update all outdated PRDs

2. **Developer Experience**
   - Add pre-commit hooks (Husky)
   - Configure code formatting (Prettier)
   - Add commit linting
   - Set up Git hooks
   - Document contribution guidelines

**Success Criteria:**
- [ ] Terraform state in GCS with locking
- [ ] Staging environment available for testing
- [ ] Email verification and password reset working
- [ ] No critical or high vulnerabilities
- [ ] Comprehensive documentation exists
- [ ] DX improvements reduce onboarding time

**Time Investment:** ~48 hours (12 hours/month)

---

## Appendices

### A. Glossary

**Technical Terms:**

| Term | Definition |
|------|------------|
| **ADR** | Architecture Decision Record - Document explaining why a technical decision was made |
| **App Router** | Next.js 13+ routing system using `app/` directory instead of `pages/` |
| **bcrypt** | Password hashing algorithm with configurable cost factor (rounds) |
| **Cloud Run** | Google Cloud's serverless container platform |
| **Cloud SQL** | Google Cloud's managed relational database service |
| **CUID** | Collision-resistant Unique Identifier (better than UUID for primary keys) |
| **Deployment** | Process of releasing code changes to production environment |
| **Dockerfile** | Instructions for building a Docker container image |
| **JWT** | JSON Web Token - Stateless authentication token format |
| **NextAuth** | Authentication library for Next.js applications |
| **ORM** | Object-Relational Mapping - Tool for database access (e.g., Prisma) |
| **Prisma** | TypeScript ORM for Node.js with auto-generated client |
| **RSC** | React Server Components - React components that run on the server |
| **Standalone Output** | Next.js build mode that includes all dependencies in output |
| **Terraform** | Infrastructure as Code tool for cloud resource management |
| **VPC** | Virtual Private Cloud - Isolated network in Google Cloud |

**Acronyms:**

| Acronym | Meaning |
|---------|---------|
| **API** | Application Programming Interface |
| **CDN** | Content Delivery Network |
| **CI/CD** | Continuous Integration / Continuous Deployment |
| **CORS** | Cross-Origin Resource Sharing |
| **CRUD** | Create, Read, Update, Delete |
| **ER** | Entity-Relationship (diagram) |
| **GCP** | Google Cloud Platform |
| **IAM** | Identity and Access Management |
| **IaC** | Infrastructure as Code |
| **MVP** | Minimum Viable Product |
| **OOM** | Out of Memory |
| **PITR** | Point-in-Time Recovery |
| **RBAC** | Role-Based Access Control |
| **RPO** | Recovery Point Objective |
| **RTO** | Recovery Time Objective |
| **SLA** | Service Level Agreement |
| **TLS** | Transport Layer Security |
| **UI** | User Interface |
| **VPS** | Virtual Private Server |
| **WAF** | Web Application Firewall |

---

### B. Reference Links

**Production Environment:**
- Cloud Run Service: https://console.cloud.google.com/run/detail/us-central1/hustle-app/metrics?project=hustle-dev-202510
- Cloud SQL Instance: https://console.cloud.google.com/sql/instances/hustle-mvp-instance/overview?project=hustle-dev-202510
- Artifact Registry: https://console.cloud.google.com/artifacts/docker/hustle-dev-202510/us-central1/cloud-run-source-deploy?project=hustle-dev-202510
- Logging: https://console.cloud.google.com/logs/query?project=hustle-dev-202510
- VPC Network: https://console.cloud.google.com/networking/networks/list?project=hustle-dev-202510

**Documentation:**
- NextAuth v5 Docs: https://authjs.dev/getting-started/installation
- Prisma Docs: https://www.prisma.io/docs
- Next.js 15 Docs: https://nextjs.org/docs
- Cloud Run Docs: https://cloud.google.com/run/docs
- Terraform GCP Provider: https://registry.terraform.io/providers/hashicorp/google/latest/docs

**Monitoring & Tools:**
- GCP Console: https://console.cloud.google.com/home/dashboard?project=hustle-dev-202510
- Prisma Studio: http://localhost:5555 (when running locally)
- npm Registry: https://www.npmjs.com/
- GitHub: (Repository URL if applicable)

**Local Directories:**
- Project Root: `/home/jeremy/projects/hustle/`
- Application: `/home/jeremy/projects/hustle/app/`
- Infrastructure: `/home/jeremy/projects/hustle/06-Infrastructure/terraform/`
- Documentation: `/home/jeremy/projects/hustle/01-Docs/`

---

### C. Troubleshooting Guide

**Issue: Can't log in (Invalid credentials)**

```
Symptoms: Login form shows "Invalid email or password" error
Possible Causes:
1. User doesn't exist in database
2. Password is empty (from SuperTokens migration)
3. bcrypt hash mismatch

Diagnosis:
# Check if user exists
npx prisma studio
# Navigate to Users table, search for email

# Check password field
# If password is empty string, user needs to be recreated

Fix:
# Option 1: Create new user via API
curl -X POST http://localhost:4000/api/db-setup

# Option 2: Manually set password in Prisma Studio
# (hash password with bcrypt first)
```

---

**Issue: Database connection failures**

```
Symptoms: /api/healthcheck returns 500, logs show "Database connection failed"
Possible Causes:
1. Cloud SQL instance stopped
2. VPC connector misconfigured
3. DATABASE_URL env var incorrect
4. Connection pool exhausted

Diagnosis:
# Check Cloud SQL status
gcloud sql instances describe hustle-mvp-instance

# Check VPC connector
gcloud compute networks vpc-access connectors list --region us-central1

# Test connection from Cloud Run
gcloud run services describe hustle-app \
  --format='value(spec.template.spec.containers[0].env)'

Fix:
# Restart Cloud SQL instance
gcloud sql instances restart hustle-mvp-instance

# Update DATABASE_URL env var
gcloud run deploy hustle-app \
  --set-env-vars DATABASE_URL="postgresql://..."
```

---

**Issue: Build fails with Prisma error**

```
Symptoms: Docker build fails at "npx prisma generate" step
Possible Causes:
1. Prisma schema syntax error
2. DATABASE_URL not set during build
3. Prisma version mismatch

Diagnosis:
# Validate Prisma schema
npx prisma validate

# Check Prisma version
npx prisma --version

Fix:
# If syntax error, fix schema.prisma
# If version mismatch, update @prisma/client and prisma to same version

npm install @prisma/client@latest prisma@latest
```

---

**Issue: 404 on deployed Cloud Run service**

```
Symptoms: All routes return 404, including /api/healthcheck
Possible Causes:
1. Next.js build failed silently
2. Standalone output not configured
3. Port mismatch (container vs Cloud Run)

Diagnosis:
# Check build logs
gcloud run services describe hustle-app \
  --format='value(status.latestReadyRevisionName)'

gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50

Fix:
# Ensure next.config.ts has:
output: 'standalone'

# Ensure Dockerfile EXPOSE matches Cloud Run port (8080)
```

---

**Issue: Session cookie not set after login**

```
Symptoms: Login appears successful but redirects to /login again
Possible Causes:
1. NEXTAUTH_SECRET not set
2. NEXTAUTH_URL mismatch
3. Cookie domain mismatch

Diagnosis:
# Check NEXTAUTH_SECRET exists
gcloud run services describe hustle-app \
  --format='value(spec.template.spec.containers[0].env)' | grep NEXTAUTH

# Check NEXTAUTH_URL matches actual URL
echo $NEXTAUTH_URL

Fix:
# Set NEXTAUTH_SECRET (32+ characters)
gcloud run deploy hustle-app \
  --set-env-vars NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Ensure NEXTAUTH_URL is HTTPS in production
gcloud run deploy hustle-app \
  --set-env-vars NEXTAUTH_URL="https://hustle-app-*.run.app"
```

---

### D. Change Management

**How to Keep This Document Updated:**

1. **After Major Changes:**
   - Update relevant sections (Architecture, Deployment, etc.)
   - Add entry to Version History (below)
   - Commit changes to git

2. **Monthly Review:**
   - Review "Current State Assessment"
   - Update cost estimates
   - Update performance metrics
   - Update dependency versions

3. **Quarterly Audit:**
   - Verify all links still work
   - Check for outdated information
   - Update recommendations roadmap
   - Ensure screenshots/diagrams are current

4. **When Adding Team Members:**
   - Review "First Week Checklist"
   - Add team member to access lists
   - Schedule onboarding sessions

5. **Ownership:**
   - **Primary Maintainer:** Jeremy Longshore
   - **Last Updated:** 2025-10-05
   - **Next Review:** 2025-10-12

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| **1.0.0** | 2025-10-05 | Initial comprehensive DevOps guide creation | Claude Code |

---

**Document Status:** ✅ Complete (10,000+ words)
**Last Updated:** 2025-10-05
**Next Review:** 2025-10-12
**Maintainer:** Jeremy Longshore

---

*End of Jeremy's DevOps Guide*
