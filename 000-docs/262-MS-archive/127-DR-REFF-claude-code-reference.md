# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hustle** is a Next.js application for tracking soccer player statistics for high school athletes (grades 8-12). Parents manage player profiles, log game stats, and track performance over time with verification capabilities.

### Tech Stack
- **Framework**: Next.js 15.5.4 with App Router and **Turbopack**
- **Language**: TypeScript (strict mode)
- **Authentication**: NextAuth v5 (beta.29) with JWT strategy and Prisma adapter
- **Database**: PostgreSQL 15 with Prisma ORM
- **UI**: Tailwind CSS, shadcn/ui components, Radix UI primitives
- **Email**: Resend for transactional emails (verification, password reset)
- **Error Tracking**: Sentry for production monitoring
- **Validation**: Zod schemas for runtime validation
- **Testing**: Vitest (unit) + Playwright (E2E) + React Testing Library
- **Deployment**: Docker multi-stage builds on Google Cloud Run
- **Infrastructure**: Terraform-managed GCP resources

### Key Path Aliases

- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Example: `import { auth } from '@/lib/auth'`

## Common Commands

### Development

```bash
# Start dev server with Turbopack (default port 3000)
npm run dev

# Start on specific port (e.g., 4000)
npm run dev -- -p 4000

# Build for production (uses Turbopack)
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Database Operations

```bash
# Generate Prisma client (run after schema changes)
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Create and apply migrations (production)
npx prisma migrate dev --name description
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Testing

```bash
# Run all tests (unit + E2E)
npm test

# Run unit tests with Vitest
npm run test:unit

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests with Playwright
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:report

# Run security audit
npm run test:security
```

### Infrastructure

```bash
# Navigate to Terraform directory
cd 06-Infrastructure/terraform

# Initialize Terraform
terraform init

# Preview infrastructure changes
terraform plan

# Apply infrastructure changes
terraform apply

# Destroy infrastructure
terraform destroy
```

### GCP Deployment

**🚨 CRITICAL: Correct Project ID**

**Production:**
- **Project ID:** `hustleapp-production`
- **Display Name:** Hustle Production
- **Project Number:** 335713777643
- **Region:** us-central1
- **Services:**
  - Cloud Run: `hustle-frontend` (service name)
  - Database: `hustle-db` (PostgreSQL 15)
  - Domain: `hustlestats.io`

**Development:**
- **Status:** Not configured yet

**Note:** This is the ONLY Hustle project in GCP. Verified with `gcloud projects list` on 2025-10-17.

```bash
# Deploy to production
cd ~/000-projects/hustle
gcloud run deploy hustle-frontend \
  --source . \
  --project hustleapp-production \
  --region us-central1

# View production logs
gcloud run services logs read hustle-frontend \
  --project hustleapp-production \
  --region us-central1

# Connect to production database
gcloud sql connect hustle-db --project=hustleapp-production
```

## Architecture

### Database Schema (Prisma)

**User**
- id, firstName, lastName, email, emailVerified, phone, password (bcrypt)
- Legal compliance: agreedToTerms, agreedToPrivacy, isParentGuardian (COPPA)
- Verification PIN: verificationPinHash (bcrypt, 4-6 digit PIN for game stats verification)
- NextAuth relations: accounts[], sessions[]
- App relations: players[]

**Player**
- id, name, birthday (DateTime), position, teamClub, photoUrl (optional)
- parentId (foreign key to User)
- One-to-many with Game
- Indexed on [parentId, createdAt] for efficient athlete list queries

**Game**
- id, playerId, date, opponent, result, finalScore
- minutesPlayed, goals, assists
- Defensive stats: tackles, interceptions, clearances, blocks, aerialDuelsWon (nullable)
- Goalkeeper stats: saves, goalsAgainst, cleanSheet (nullable)
- verified (boolean), verifiedAt (timestamp)
- Indexed on playerId and verified for efficient filtering

**Auth-Related Models**
- Account, Session, VerificationToken (standard NextAuth v5 schema)
- PasswordResetToken (custom model for password reset flow)
- EmailVerificationToken (custom model for email verification flow)

**Other Models**
- Waitlist (early access signup tracking with email, name, source)

### Directory Structure

```
/
├── src/                            # Next.js source (framework requirement)
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/               # Authentication routes
│   │   │   │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │   │   │   ├── register/route.ts       # User registration
│   │   │   │   ├── verify-email/route.ts   # Email verification
│   │   │   │   ├── forgot-password/route.ts
│   │   │   │   ├── reset-password/route.ts
│   │   │   │   └── resend-verification/route.ts
│   │   │   ├── players/
│   │   │   │   ├── route.ts        # GET players (protected)
│   │   │   │   ├── create/route.ts # POST create player
│   │   │   │   └── upload-photo/route.ts
│   │   │   ├── games/route.ts
│   │   │   ├── verify/route.ts
│   │   │   ├── waitlist/route.ts
│   │   │   ├── admin/
│   │   │   │   └── verify-user/route.ts
│   │   │   ├── healthcheck/route.ts
│   │   │   ├── migrate/route.ts
│   │   │   └── db-setup/route.ts
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Server-protected layout with sidebar
│   │   │   ├── page.tsx            # Main dashboard
│   │   │   ├── athletes/page.tsx   # Athlete management
│   │   │   ├── analytics/page.tsx  # Performance analytics
│   │   │   └── settings/page.tsx   # User settings
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── resend-verification/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── privacy/page.tsx
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── layout/                 # Kiranism layout components
│   │   │   ├── app-sidebar-simple.tsx
│   │   │   ├── user-nav.tsx        # NextAuth session dropdown
│   │   │   ├── header.tsx
│   │   │   └── page-container.tsx
│   │   └── waitlist-form.tsx
│   ├── lib/
│   │   ├── auth.ts                 # NextAuth configuration (CRITICAL)
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── email.ts                # Resend email client
│   │   ├── email-templates.ts      # React Email templates
│   │   ├── tokens.ts               # Token generation utilities
│   │   ├── logger.ts               # Structured logging utility
│   │   ├── utils.ts                # General utilities (cn, etc.)
│   │   ├── player-utils.ts         # Player-specific business logic
│   │   ├── game-utils.ts           # Game statistics calculations
│   │   └── validations/
│   │       └── game-schema.ts      # Zod schemas for game validation
│   └── types/
│       └── next-auth.d.ts          # NextAuth TypeScript declarations
├── prisma/
│   └── schema.prisma               # Database schema (User, Player, Game, etc.)
├── public/                         # Static assets
├── 01-Docs/                        # Documentation (NNN-abv-description.ext)
├── 03-Tests/                       # Test suites
│   └── e2e/
│       ├── auth/
│       │   ├── 01-registration.spec.ts
│       │   └── 02-login.spec.ts
│       ├── 01-authentication.spec.ts
│       ├── 02-dashboard.spec.ts
│       ├── 03-player-management.spec.ts
│       ├── 04-complete-user-journey.spec.ts
│       └── 05-login-healthcheck.spec.ts
├── 04-Assets/                      # Assets and config backups
├── 05-Scripts/                     # Automation scripts
├── 06-Infrastructure/              # Docker, K8s, Terraform
│   ├── docker/
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   └── .dockerignore
│   └── terraform/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── .creds/                 # Service account keys
├── 07-Releases/                    # Release artifacts
├── 99-Archive/                     # Archived code
├── claudes-docs/                   # AI-generated docs (gitignored)
├── Dockerfile                      # Production Dockerfile (root level)
├── docker-compose.yml              # Local development
├── .directory-standards.md
├── .gitignore
├── README.md
├── CLAUDE.md (this file)
├── CHANGELOG.md
├── LICENSE
└── package.json
```

## Development Workflow

### Local Development

```bash
# Start dev server (port 4000)
npm run dev -- -p 4000

# Database operations
npx prisma generate     # Regenerate Prisma client
npx prisma db push      # Push schema changes to DB
npx prisma studio       # Open Prisma Studio

# Build for production
npm run build
npm run preview
```

### Docker Development

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Stop all services
docker-compose down

# Full rebuild
docker-compose down
docker-compose up -d --build
```

### Environment Variables

**Local (.env.local)**
```
DATABASE_URL="postgresql://hustle_admin:password@localhost:5432/hustle_mvp"
NEXT_PUBLIC_API_DOMAIN=http://194.113.67.242:4000
NEXT_PUBLIC_WEBSITE_DOMAIN=http://194.113.67.242:4000
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://194.113.67.242:4000"
NODE_ENV=development
```

**Production (.env.production)**
```
# GCP Project
GCP_PROJECT_ID=hustleapp-production
GCP_PROJECT_NUMBER=335713777643

# Database
DATABASE_URL="postgresql://..." # Connection from Cloud Run to Cloud SQL
DATABASE_INSTANCE=hustle-db

# Domain
DOMAIN=hustlestats.io
```

## Key Implementation Details

### Core Libraries

**Utility Libraries**:
- `/src/lib/utils.ts` - General utilities including `cn()` for className merging
- `/src/lib/player-utils.ts` - Player business logic (age calculation, profile validation)
- `/src/lib/game-utils.ts` - Game statistics calculations and aggregations
- `/src/lib/logger.ts` - Structured logging for production debugging
- `/src/lib/tokens.ts` - Secure token generation for email verification and password reset

**Email System** (`/src/lib/email.ts` and `/src/lib/email-templates.ts`):
- Resend API integration for transactional emails
- Email verification on signup
- Password reset flow with secure tokens
- React Email templates for consistent branding

**Validation** (`/src/lib/validations/`):
- Zod schemas for runtime type validation
- Game statistics validation with position-specific rules
- Input sanitization and error messages

### NextAuth v5 Authentication

**Configuration**: `/src/lib/auth.ts`

**Critical Settings**:
- `trustHost: true` - **REQUIRED** for NextAuth v5 with custom domains and Cloud Run
- Email verification enforced - users cannot log in until `emailVerified` is set (line 56-58)
- bcrypt for password hashing (not bcryptjs, despite both being installed)

```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // REQUIRED for custom domains and Cloud Run
  providers: [
    CredentialsProvider({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Email verification check (ENFORCED)
        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
  },
});
```

**Server-Side Session Protection**:
```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <div>{children}</div>;
}
```

**Client-Side Sign In**:
```typescript
'use client';
import { signIn } from 'next-auth/react';

const handleSubmit = async (e) => {
  e.preventDefault();
  const result = await signIn('credentials', {
    email: formData.email,
    password: formData.password,
    redirect: false,
  });

  if (result?.ok) {
    router.push('/dashboard');
  }
};
```

**Server Action Logout**:
```typescript
'use server';
import { signOut } from '@/lib/auth';

export async function handleSignOut() {
  await signOut({ redirectTo: '/' });
}
```

## Key Patterns & Best Practices

### Session-Based Data Access

All user data MUST be filtered by the authenticated user's ID:

```typescript
const session = await auth();
const players = await prisma.player.findMany({
  where: { parentId: session.user.id }
});
```

### Age Calculation

Birthday is stored as `DateTime` in database; age is calculated dynamically in UI to stay current.

### Verification Flow

Games are created with `verified: false`. Parents verify later, updating `verified: true` and setting `verifiedAt` timestamp.

### Password Security

- Always hash passwords with bcrypt (10 rounds)
- Never store plaintext passwords
- Use `bcrypt.compare()` for validation

### File Naming Conventions

- **Components**: PascalCase (`UserNav.tsx`)
- **API routes**: kebab-case directories (`upload-photo/route.ts`)
- **Config files**: camelCase (`backendConfig.ts`)
- **Documentation**: `NNN-abv-description.ext` (`001-adr-nextauth-migration.md`)

## Common Tasks

### Add New API Route
1. Create `src/app/api/[route-name]/route.ts`
2. Use `await auth()` for session verification
3. Validate input, handle errors
4. Return NextResponse.json()

**Example Protected Route**:
```typescript
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your logic here
  return NextResponse.json({ data: 'protected' });
}
```

### Add New Page
1. Create `src/app/[page-name]/page.tsx`
2. Use `'use client'` for interactive components
3. Import from `@/components` and `@/lib`
4. For protected pages, add session check in layout

### Update Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` (dev) or create migration (prod)
3. Run `npx prisma generate` to update Prisma client
4. Restart dev server to clear Next.js cache

### Deploy to Production
1. Build Docker image: `docker build -t hustle-app .`
2. Push to Google Artifact Registry
3. Deploy to Cloud Run with VPC connector
4. Set environment variables (DATABASE_URL, NEXTAUTH_SECRET, RESEND_API_KEY, SENTRY_DSN)

### Add Email Templates
1. Create template in `/src/lib/email-templates.ts` using React Email components
2. Import and use in API routes via `/src/lib/email.ts`
3. Test locally with Resend test mode
4. Verify in production with real email delivery

### Add Validation Schema
1. Create Zod schema in `/src/lib/validations/[name]-schema.ts`
2. Import and use in API routes with `.parse()` or `.safeParse()`
3. Write unit tests alongside schema file
4. Handle validation errors with appropriate HTTP status codes

## Important Notes

- **Turbopack**: Build and dev use `--turbopack` flag (faster than webpack)
- **Standalone Output**: Next.js configured with `output: 'standalone'` for Docker deployment
- **trustHost Required**: NextAuth v5 requires `trustHost: true` for custom domains (in `/src/lib/auth.ts:25`)
- **NextAuth Session**: Use server-side `await auth()`, not client-side `useSession()` in layouts
- **Prisma Client**: Always regenerate after schema changes (`npx prisma generate`)
- **Cache Issues**: Clear `.next` directory if Prisma client seems outdated after schema changes
- **Development Port**: Runs on port 4000 by default (avoiding conflicts with other services)
- **Production Port**: Docker container exposes port 8080 for Cloud Run
- **Password Security**: Use bcrypt (10 rounds), not bcryptjs (both installed but bcrypt preferred)
- **Email Verification Required**: Users cannot log in until email is verified (enforced in auth.ts:56-58)
- **Token Expiration**: Email verification and password reset tokens expire after 24 hours
- **Sentry**: Configured for production error tracking, disabled in development
- **Testing Philosophy**: Unit tests for utilities/validation, E2E tests for critical user flows
- **Build Warnings Suppressed**: `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` set to true in `next.config.ts`

## Troubleshooting Common Issues

### Prisma Client Not Found
```bash
# Clear Next.js cache and regenerate Prisma client
rm -rf .next
npx prisma generate
npm run dev
```

### Database Connection Issues
```bash
# Check database is running
docker ps | grep postgres

# Test connection directly
psql $DATABASE_URL

# Verify DATABASE_URL format
# postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### NextAuth Session Issues
- Ensure `trustHost: true` is set in `/src/lib/auth.ts:25`
- Verify `NEXTAUTH_SECRET` is set in environment variables
- Check `NEXTAUTH_URL` matches your domain/port
- Use server-side `await auth()` in layouts, not `useSession()`

### Email Not Sending
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for send logs
- Ensure email templates are properly imported
- Test mode uses `onboarding@resend.dev` in development

### Docker Build Failures
```bash
# Check Dockerfile exists at project root (not in 06-Infrastructure/docker/)
ls -la Dockerfile

# Verify Prisma schema before building
npx prisma validate

# Build with verbose output
docker build --progress=plain -t hustle-app .
```

### TypeScript Errors on Build
- Project has `typescript.ignoreBuildErrors: true` in `next.config.ts`
- Fix TypeScript errors in development, but builds won't fail
- Run `npm run build` locally to catch issues before deploying

### Port Already in Use
```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

## Testing

Before deployment, verify:
- [ ] User can sign up with email/password (password is hashed)
- [ ] User can sign in with valid credentials
- [ ] Invalid credentials show error message
- [ ] Dashboard redirects to /login when unauthenticated
- [ ] Session persists across page refreshes
- [ ] User can logout successfully
- [ ] Protected API routes return 401 when unauthenticated
- [ ] Birthday field correctly stores DateTime
- [ ] Age is calculated dynamically in UI

## Deployment

### Docker Architecture

Multi-stage Dockerfile (located in project root: `Dockerfile`):
1. **base**: Node.js 22 Alpine base image
2. **deps**: Install dependencies only (`npm ci`)
3. **builder**: Generate Prisma client, build Next.js app with Turbopack
4. **runner**: Production image with standalone output
   - Non-root user (nextjs:nodejs, UID 1001)
   - Only necessary files copied (standalone build, static assets, Prisma client)
   - Exposes port 8080 for Cloud Run
   - Environment: `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`

```bash
# Build image
docker build -t hustle-app .

# Run locally
docker run -p 8080:8080 --env-file .env.local hustle-app

# Test production build locally
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="http://localhost:8080" \
  hustle-app
```

### Google Cloud Run

Deployment is managed via Terraform in `06-Infrastructure/terraform/`:
- Cloud SQL PostgreSQL instance with private IP
- VPC connector for secure database access
- Artifact Registry for Docker images
- Cloud Run service with auto-scaling (0-10 instances)
- Environment variables managed via Secret Manager

**Auto-Deployment**: GitHub Actions workflow deploys on every push to `main` branch

## Documentation Standards

This project follows **MASTER DIRECTORY STANDARDS**:
- All docs in `01-Docs/` with `NNN-abv-description.ext` naming
- Chronological numbering (001, 002, 003...)
- Key document types: PRDs, ADRs, logs, references
- AI-generated docs in `claudes-docs/` (gitignored)

## Migration Notes

**NextAuth v5 Migration (2025-10-05)**

Migrated from SuperTokens to NextAuth v5. See `01-Docs/001-adr-nextauth-migration.md` for details.

Key changes:
- Removed SuperTokens core server dependency
- Switched to JWT strategy with Prisma adapter
- Integrated Kiranism dashboard components
- Server-side session protection with `await auth()`
- bcrypt password hashing (10 rounds)

## Testing Architecture

### Unit Tests (Vitest)
- Located alongside source files with `.test.ts` suffix
- Test utilities, validation schemas, and business logic
- Run with `npm run test:unit` or `npm run test:watch` for development
- Coverage reports with `npm run test:coverage`

**Examples**:
- `/src/lib/game-utils.test.ts` - Game statistics calculations
- `/src/lib/auth-security.test.ts` - Authentication security
- `/src/lib/validations/game-schema.test.ts` - Zod schema validation

### E2E Tests (Playwright)
- Located in `/03-Tests/e2e/` directory
- Test complete user journeys and critical flows
- Run with `npm run test:e2e`
- View UI with `npm run test:e2e:ui` for debugging
- Watch tests run in browser with `npm run test:e2e:headed`

**Test Structure**:
```
03-Tests/e2e/
├── auth/
│   ├── 01-registration.spec.ts      # User registration flow
│   └── 02-login.spec.ts             # Login flow
├── 01-authentication.spec.ts        # Auth integration
├── 02-dashboard.spec.ts             # Dashboard access
├── 03-player-management.spec.ts     # Player CRUD operations
├── 04-complete-user-journey.spec.ts # End-to-end user flow
└── 05-login-healthcheck.spec.ts     # Quick smoke test
```

### Integration Tests
- Coming soon: API integration tests with MSW (Mock Service Worker)
- Will test API routes in isolation with mocked database

## Authentication Flow

This app uses NextAuth v5 with JWT strategy and requires email verification:

1. **Sign Up**: User registers at `/register` with email/password
2. **Email Verification**: User receives verification email and must click link
3. **Sign In**: User can only log in after email is verified
4. **Session**: JWT session valid for 30 days
5. **Protected Routes**: Dashboard and all `/api` routes require authentication

Email verification is enforced in `/src/lib/auth.ts:56-59` - users cannot log in until `emailVerified` is set.

## API Routes

All API routes follow RESTful conventions:

- **Authentication**: `/api/auth/*`
  - `[...nextauth]` - NextAuth handler
  - `register` - User registration
  - `verify-email` - Email verification
  - `forgot-password` - Request password reset
  - `reset-password` - Reset password with token
  - `resend-verification` - Resend verification email

- **Players**: `/api/players/*`
  - `GET /api/players` - List authenticated user's players
  - `POST /api/players/create` - Create new player
  - `POST /api/players/upload-photo` - Upload player photo

- **Games**: `/api/games/*`
  - `GET /api/games` - List games (filtered by player/user)
  - `POST /api/games` - Create new game entry

- **Verification**: `/api/verify`
  - Verify game statistics

- **System**:
  - `GET /api/healthcheck` - Health check endpoint
  - `GET /api/hello` - Test endpoint

- **Waitlist**: `/api/waitlist`
  - `POST /api/waitlist` - Add email to early access waitlist

- **Admin**: `/api/admin/*`
  - `POST /api/admin/verify-user` - Manually verify user email (admin only)

All protected routes must use `await auth()` at the start to verify session.

## Environment Variables Reference

### Required for All Environments
```bash
DATABASE_URL="postgresql://user:pass@host:5432/database"
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:4000"  # or production URL
```

### Optional (Email)
```bash
RESEND_API_KEY="re_..."  # For email verification and password reset
```

### Optional (Monitoring)
```bash
SENTRY_DSN="https://..."  # For error tracking
SENTRY_ORG="organization-name"
SENTRY_PROJECT="project-name"
SENTRY_AUTH_TOKEN="..."  # For source map uploads
```

### Public Variables
```bash
NEXT_PUBLIC_API_DOMAIN="http://localhost:4000"  # API endpoint
NEXT_PUBLIC_WEBSITE_DOMAIN="http://localhost:4000"  # Website URL
```

## Performance Optimizations

### Database Indexes
- **Player**: Composite index on `[parentId, createdAt]` for Athletes List dashboard
- **Game**: Index on `playerId` for game lookups, index on `verified` for filtering

### Next.js Optimizations
- Turbopack for faster builds and HMR
- Standalone output for minimal Docker images
- Prisma client generated at build time

### Prisma Best Practices
- Connection pooling handled by Prisma
- Singleton pattern prevents multiple instances
- Relations use cascade delete for data integrity

---

**Last Updated**: 2025-11-07
**Version**: 2.3.0
**Status**: Active Development