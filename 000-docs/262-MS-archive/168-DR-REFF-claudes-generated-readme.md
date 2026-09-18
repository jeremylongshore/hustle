# Hustle Codebase Analysis & Documentation

**Date:** November 8, 2025  
**Analyst:** Claude Code (Haiku 4.5)  
**Status:** Complete - Ready for Development

---

## What's in This Directory

This directory contains comprehensive analysis documents for the Hustle project. Start here if you're new to the codebase.

### 1. **QUICK_REFERENCE_GUIDE.md** (START HERE!)
**Best for:** Getting oriented quickly (5-10 minutes)
- 30-second project summary
- Getting started in 5 minutes
- Common development tasks
- Troubleshooting section
- Quick command reference

**Perfect for:** "I need to get started NOW"

### 2. **HUSTLE_CODEBASE_ARCHITECTURE.md** (COMPREHENSIVE)
**Best for:** Understanding how everything fits together (30-45 minutes)
- Complete architecture overview
- Project structure & directories
- Technology stack details
- Database schema documentation
- API endpoint reference
- CI/CD pipeline explanation
- Testing strategy
- NWSL documentary pipeline

**Perfect for:** "I need to understand the big picture"

### 3. **HUSTLE_CODE_PATTERNS_AND_EXAMPLES.md** (PRACTICAL)
**Best for:** Learning by example (30-45 minutes)
- Real code patterns with full examples
- API route structure
- Authentication implementation
- Database query patterns
- React component patterns
- Testing examples
- Email service integration
- Error handling patterns

**Perfect for:** "Show me how to build something"

---

## Reading Path by Use Case

### I'm new to the project
1. Read: QUICK_REFERENCE_GUIDE.md (10 min)
2. Run: `npm install && npm run dev` (5 min)
3. Read: HUSTLE_CODEBASE_ARCHITECTURE.md (30 min)
4. Explore: Look at the example patterns in HUSTLE_CODE_PATTERNS_AND_EXAMPLES.md (30 min)

### I need to fix a bug
1. Check: QUICK_REFERENCE_GUIDE.md troubleshooting section (5 min)
2. Find: Related code in HUSTLE_CODE_PATTERNS_AND_EXAMPLES.md (10 min)
3. Test: Use patterns from the test examples (10 min)

### I need to build a new feature
1. Review: HUSTLE_CODEBASE_ARCHITECTURE.md API routes section (10 min)
2. Copy: Pattern from HUSTLE_CODE_PATTERNS_AND_EXAMPLES.md (5 min)
3. Develop: Follow git workflow in QUICK_REFERENCE_GUIDE.md (ongoing)
4. Test: Use test patterns from HUSTLE_CODE_PATTERNS_AND_EXAMPLES.md (15 min)

### I'm deploying to production
1. Check: QUICK_REFERENCE_GUIDE.md deployment section (5 min)
2. Review: HUSTLE_CODEBASE_ARCHITECTURE.md CI/CD section (15 min)
3. Verify: Deployment checklist in HUSTLE_CODEBASE_ARCHITECTURE.md (10 min)

---

## Quick Facts About Hustle

**What:** Youth soccer statistics tracking app with embedded NWSL documentary pipeline

**Stack:**
- Frontend: Next.js 15 + React 19 + TypeScript
- Backend: Next.js API Routes + Prisma ORM
- Database: PostgreSQL
- Hosting: Google Cloud Run
- Testing: Vitest + Playwright
- CI/CD: GitHub Actions

**Key Features:**
- User authentication with email verification
- Player management (athletes)
- Game statistics logging (match performance)
- Admin verification system
- NWSL documentary video generation pipeline

**Deployment:**
- Production: hustleapp-production (GCP)
- Staging: Automatic on PR
- Production: Automatic on main push

---

## Key Directory Structure

```
hustle/
├── src/                    Source code
│   ├── app/               Next.js App Router
│   │   ├── api/           API routes
│   │   ├── dashboard/     Main features
│   │   ├── login/         Auth pages
│   │   └── ...
│   ├── lib/               Utilities (auth, email, db)
│   ├── components/        React components
│   ├── types/             TypeScript definitions
│   └── schema/            Validation schemas
├── prisma/                Database schema
├── .github/workflows/     CI/CD pipelines
├── nwsl/                  Documentary pipeline
│   ├── 000-docs/          Specifications
│   ├── 050-scripts/       Render scripts
│   └── .github/workflows/ Documentary CI
├── 000-docs/              Project documentation
└── claudes-docs/          Analysis documents (YOU ARE HERE)
```

---

## Database Schema Quick View

```
User
├── email, password, firstName, lastName
├── emailVerified, verificationPinHash
└── Relations: players[], accounts[], sessions[]

Player
├── name, birthday, position, teamClub
├── parentId (FK -> User)
└── Relations: games[]

Game
├── date, opponent, result, finalScore
├── goals, assists (universal)
├── tackles, interceptions, ... (defensive)
├── saves, goalsAgainst, cleanSheet (goalkeeper)
├── verified, verifiedAt
└── Relations: player

NextAuth Models:
├── Account, Session, VerificationToken
├── PasswordResetToken, EmailVerificationToken
└── Waitlist
```

---

## API Routes Summary

### Authentication
```
POST /api/auth/register              Create account
POST /api/auth/verify-email          Verify email
POST /api/auth/forgot-password       Request password reset
POST /api/auth/reset-password        Complete password reset
GET  /api/auth/[...nextauth]         NextAuth provider
```

### Players (CRUD)
```
GET  /api/players/list               List all players
POST /api/players                    Create player
GET  /api/players/[id]               Get player details
PUT  /api/players/[id]               Update player
DELETE /api/players/[id]             Delete player
```

### Games (CRUD)
```
GET  /api/games                      List games
POST /api/games                      Log game
GET  /api/games/[id]                 Get game details
PUT  /api/games/[id]                 Update game stats
DELETE /api/games/[id]               Delete game
```

### Other
```
GET  /api/healthcheck                Service health
POST /api/waitlist                   Add to waitlist
POST /api/account/pin                Set verification PIN
POST /api/admin/verify-user          Admin verification
```

---

## Common Commands

### Development
```bash
npm install                # Install dependencies
npm run dev               # Start dev server (http://localhost:4000)
npm run build             # Production build
npm run lint              # Run ESLint
```

### Testing
```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:watch        # Watch mode
npm run test:e2e          # E2E tests
npm run test:coverage     # Coverage report
```

### Database
```bash
npx prisma studio        # View database in UI
npx prisma migrate dev   # Create & run migration
npx prisma generate      # Generate Prisma client
```

### Docker
```bash
docker build -t hustle:latest .
docker run -p 8080:8080 -e DATABASE_URL=... hustle:latest
```

---

## Technology Versions

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15.5.4 | Framework |
| React | 19.1.0 | UI library |
| TypeScript | 5 | Type safety |
| Prisma | 6.16.3 | ORM |
| PostgreSQL | 15+ | Database |
| NextAuth | 5.0.0-beta | Authentication |
| Vitest | 3.2.4 | Unit testing |
| Playwright | 1.56.0 | E2E testing |
| Tailwind CSS | 3.4.18 | Styling |
| Node | 22 | Runtime |

---

## Getting Help

### Can't find something?
1. Check the table of contents in each document
2. Search within the document (Ctrl+F / Cmd+F)
3. Check the troubleshooting section in QUICK_REFERENCE_GUIDE.md

### Documentation Organization
- **Architecture questions:** HUSTLE_CODEBASE_ARCHITECTURE.md
- **Code examples:** HUSTLE_CODE_PATTERNS_AND_EXAMPLES.md
- **Quick lookups:** QUICK_REFERENCE_GUIDE.md

### Project Documentation
- **Project docs:** `/home/jeremy/000-projects/hustle/000-docs/`
- **Documentary specs:** `/home/jeremy/000-projects/hustle/nwsl/000-docs/`

---

## External Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **NextAuth Docs:** https://authjs.dev
- **Playwright Docs:** https://playwright.dev
- **Tailwind Docs:** https://tailwindcss.com/docs
- **TypeScript Docs:** https://www.typescriptlang.org/docs

---

## About This Analysis

These documents were created through comprehensive codebase exploration:
- All file paths verified against actual repository
- Code examples extracted from real source files
- Architecture patterns identified from implementation
- Configuration verified from actual config files
- Technology versions from package.json

The analysis covers:
- All major directories and components
- Complete API route mapping
- Database schema (10 models)
- Authentication & security patterns
- Testing strategy
- Deployment pipeline
- NWSL documentary pipeline
- Performance optimizations
- Monitoring & observability

---

## Next Steps

1. **Start here:** Read QUICK_REFERENCE_GUIDE.md (10 min)
2. **Get running:** Run `npm install && npm run dev` (5 min)
3. **Understand design:** Read HUSTLE_CODEBASE_ARCHITECTURE.md (30 min)
4. **Learn patterns:** Read HUSTLE_CODE_PATTERNS_AND_EXAMPLES.md (30 min)
5. **Start developing:** Create a feature branch and code!

---

**Analysis Date:** November 8, 2025  
**Status:** Complete and Ready for Development  
**Confidence:** High (verified against actual codebase)

Happy coding!
