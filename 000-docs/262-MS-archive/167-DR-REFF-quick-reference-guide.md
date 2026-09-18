# Hustle Quick Reference Guide

**Last Updated:** 2025-11-08  
**For:** Developers working on Hustle

---

## Project Essentials (30 seconds)

**What:** Youth soccer stats tracking app with NWSL documentary pipeline  
**Where:** `/home/jeremy/000-projects/hustle/`  
**Stack:** Next.js 15 + React 19 + PostgreSQL + Google Cloud Run  
**Docs:** Check `000-docs/` and `claudes-docs/` directories

---

## Getting Started (5 minutes)

```bash
# 1. Navigate to project
cd /home/jeremy/000-projects/hustle

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with:
# - DATABASE_URL (PostgreSQL)
# - NEXTAUTH_SECRET (min 32 chars)
# - NEXTAUTH_URL (http://localhost:4000)
# - RESEND_API_KEY (email service)

# 4. Run database migrations
npx prisma migrate dev

# 5. Start dev server
npm run dev
# Opens on http://localhost:3000 or http://localhost:4000 (configured)
```

---

## Common Tasks

### Develop a Feature
```bash
# 1. Start dev server
npm run dev

# 2. Watch tests
npm run test:watch

# 3. Type checking
npx tsc --noEmit

# 4. Check for lint issues
npm run lint
```

### Add a New API Endpoint
**Location:** `src/app/api/[feature]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Your logic here
  return NextResponse.json({ data: {} });
}
```

### Create a Database Migration
```bash
# Make changes to prisma/schema.prisma
# Then run:
npx prisma migrate dev --name descriptive_name

# Check migration status
npx prisma migrate status

# View database schema interactively
npx prisma studio
```

### Write Tests
**Unit Tests:** `src/lib/*.test.ts`
```bash
npm run test:unit        # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

**E2E Tests:** `03-Tests/e2e/*.spec.ts`
```bash
npm run test:e2e         # Run headless
npm run test:e2e:headed  # See browser
npm run test:e2e:ui      # Interactive mode
```

### Deploy to Production
```bash
# 1. Commit and push to main branch
git add .
git commit -m "feat: description"
git push origin main

# 2. GitHub Actions will:
#    - Run CI (lint, tests, build)
#    - Build Docker image
#    - Push to Artifact Registry
#    - Deploy to Cloud Run
#    - Run health check

# 3. Monitor deployment at:
# https://console.cloud.google.com/run
# Project: hustleapp-production
# Service: hustle-app
```

### Investigate a Production Error
```bash
# 1. Check Sentry
# https://sentry.io -> Your organization

# 2. Check Google Cloud Logging
gcloud logging read --format json | head -20

# 3. Check Cloud Run service
gcloud run describe hustle-app --region us-central1
gcloud run logs read hustle-app --region us-central1 --limit 50
```

---

## Key Files to Know

| File | Purpose | Edit When |
|------|---------|-----------|
| `src/app/page.tsx` | Home page | Updating landing page |
| `src/app/api/` | API endpoints | Adding features |
| `src/lib/auth.ts` | Authentication config | Changing auth logic |
| `src/lib/email.ts` | Email service | Fixing email issues |
| `prisma/schema.prisma` | Database schema | Adding/changing models |
| `.github/workflows/ci.yml` | CI pipeline | Changing tests |
| `.github/workflows/deploy.yml` | Deployment | Changing deployment config |
| `nwsl/050-scripts/` | Documentary pipeline | NWSL video generation |
| `.env.example` | Environment template | Adding new env vars |
| `Dockerfile` | Container config | Changing runtime |

---

## Database Schema Quick View

```
User (parent/guardian)
├── id, firstName, lastName, email, password
├── emailVerified, verificationPinHash
├── agreedToTerms, agreedToPrivacy, isParentGuardian
└── Relations: players[], accounts[], sessions[]

Player (child athlete)
├── id, name, birthday, position, teamClub, photoUrl
├── parentId (FK -> User)
└── Relations: games[]

Game (match statistics)
├── id, playerId (FK -> Player)
├── date, opponent, result, finalScore, minutesPlayed
├── goals, assists (universal)
├── tackles, interceptions, clearances, blocks, aerialDuelsWon (defensive)
├── saves, goalsAgainst, cleanSheet (goalkeeper)
├── verified, verifiedAt
└── Index: (playerId, date DESC)

NextAuth Models:
├── Account (OAuth credentials)
├── Session (active sessions)
├── VerificationToken, PasswordResetToken, EmailVerificationToken
└── Waitlist (early signups)
```

---

## API Endpoints Quick Reference

### Auth
```
POST   /api/auth/register              Create account
POST   /api/auth/verify-email          Verify email
POST   /api/auth/forgot-password       Request reset
POST   /api/auth/reset-password        Complete reset
GET    /api/auth/[...nextauth]         NextAuth provider
```

### Players
```
GET    /api/players/list               List all (paginated)
POST   /api/players                    Create player
GET    /api/players/[id]               Get details
PUT    /api/players/[id]               Update
DELETE /api/players/[id]               Delete
```

### Games
```
GET    /api/games                      List for player
POST   /api/games                      Log game
GET    /api/games/[id]                 Get details
PUT    /api/games/[id]                 Update stats
DELETE /api/games/[id]                 Delete
```

### Other
```
GET    /api/healthcheck                Service health
POST   /api/waitlist                   Add to waitlist
POST   /api/account/pin                Set verification PIN
```

---

## Troubleshooting

### "DATABASE_URL not found"
```bash
# Solution: Check .env.local exists and has DATABASE_URL
cat .env.local | grep DATABASE_URL
# Should output: DATABASE_URL=postgresql://...
```

### "NEXTAUTH_SECRET is not a valid value"
```bash
# Solution: NEXTAUTH_SECRET must be minimum 32 characters
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to .env.local
```

### Tests fail with "Cannot find module"
```bash
# Solution: Regenerate Prisma client
npx prisma generate
npm run test:unit
```

### Docker build fails
```bash
# Solution: Clear build cache
docker build --no-cache -t hustle:latest .

# Or rebuild dependencies
rm -rf node_modules
npm ci
npm run build
```

### E2E tests timeout
```bash
# Solution: Increase timeout in playwright.config.ts
timeout: 60 * 1000  // Increase from 30s to 60s

# Or run single test
npx playwright test --grep "test name"
```

### Production deployment fails
```bash
# 1. Check CI passed
# Navigate to: GitHub Actions -> Latest run

# 2. Check secrets configured
gcloud secrets list

# 3. Check Cloud Run quotas
gcloud compute project-info describe --project=$(gcloud config get-value project)

# 4. Check service account
gcloud iam service-accounts list

# 5. Verify WIF setup
gcloud iam workload-identity-pools describe "gh-actions-pool" \
  --location=global \
  --project=$(gcloud config get-value project)
```

---

## Environment Variables Checklist

### Development
- [x] DATABASE_URL - Local PostgreSQL
- [x] NEXTAUTH_SECRET - Min 32 chars
- [x] NEXTAUTH_URL - http://localhost:4000
- [x] RESEND_API_KEY (optional for testing)
- [x] NODE_ENV - development

### Production
- [x] DATABASE_URL - Cloud SQL connection
- [x] NEXTAUTH_SECRET - Secure random string
- [x] NEXTAUTH_URL - https://hustlestats.io
- [x] RESEND_API_KEY - Valid API key
- [x] SENTRY_DSN - Error tracking
- [x] NODE_ENV - production
- [x] GCP_PROJECT - GCP project ID

---

## Performance Metrics

**Target Response Times:**
- API endpoints: < 200ms
- Page loads: < 2s
- Database queries: < 100ms
- Email delivery: < 5s

**Monitoring:**
- Sentry: https://sentry.io
- Google Cloud Logging: GCP Console
- Cloud Run Metrics: GCP Run service dashboard

---

## Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "type(scope): description"
# Types: feat, fix, docs, style, refactor, test, chore

# 3. Push to remote
git push origin feature/your-feature-name

# 4. Create PR on GitHub
# - CI checks run automatically
# - Staging deployment created (linked in PR)
# - Get review, then merge to main

# 5. Production deployment triggers automatically
```

---

## NWSL Documentary Pipeline

### Quick Start
```bash
cd nwsl
# Workflow: https://github.com/[org]/hustle/actions
# Navigate to "Assemble NWSL Documentary"
# Click "Run workflow"
# Set dry_run: false for production
# Artifacts available in GCS after completion
```

### Key Scripts
- `veo_render.sh` - AI video generation
- `lyria_render.sh` - Audio composition
- `ffmpeg_assembly_9seg.sh` - Video assembly
- `overlay_build.sh` - Overlay generation

### Output Structure
```
060-renders/
├── final/
│   ├── master_16x9.mp4        Main output
│   ├── social_9x16.mp4        Mobile format
│   └── social_1x1.mp4         Square format
└── qc/                         Quality checks
```

---

## Documentation Structure

```
000-docs/               Main project docs (33+ files)
├── 001-PP-PROD-*      Product requirements
├── 002-AT-ADEC-*      Architecture decisions
├── 003-LS-LOGS-*      Work logs
├── 010-OD-DEPL-*      Deployment guides
└── ...

nwsl/000-docs/         Documentary specs (73+ files)
├── *-PP-PROD-*        Product briefs
├── *-AT-DSGN-*        Design docs
├── *-DR-REFF-*        Reference specs
└── *-OD-DEPL-*        Deployment docs

claudes-docs/          Claude's analysis docs
├── HUSTLE_CODEBASE_ARCHITECTURE.md
├── HUSTLE_CODE_PATTERNS_AND_EXAMPLES.md
└── QUICK_REFERENCE_GUIDE.md
```

---

## Contact & Resources

**Repository:** GitHub  
**CI/CD:** GitHub Actions  
**Hosting:** Google Cloud Run (us-central1)  
**Database:** Cloud SQL (PostgreSQL)  
**Error Tracking:** Sentry  
**Email:** Resend  
**Documentation:** `000-docs/` directory

---

## Next Steps

1. **Start developing:** Run `npm run dev`
2. **Read full docs:** Check `HUSTLE_CODEBASE_ARCHITECTURE.md`
3. **Code examples:** See `HUSTLE_CODE_PATTERNS_AND_EXAMPLES.md`
4. **Ask questions:** Check existing documentation first

---

Generated: 2025-11-08  
Quick Reference: Ready to use
