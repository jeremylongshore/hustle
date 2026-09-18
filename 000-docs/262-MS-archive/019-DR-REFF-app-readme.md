# Hustle MVP - Soccer Player Game Logging Application

**Status:** ✅ Deployed to Production
**Version:** 1.0.0
**Service URL:** https://hustle-app-158864638007.us-central1.run.app

---

## Overview

Hustle MVP is a Next.js application that enables high school soccer players (grades 8-12) to log their game statistics and have parents verify the data using a secure PIN system.

### Key Features

- **Game Logging Form** - Players can log game statistics including:
  - Opponent, result, final score, minutes played
  - Goals, assists
  - Goalkeeper-specific stats (saves, goals against, clean sheet)
- **Parent Verification** - Parents verify game logs using a secure 4-6 digit PIN
- **Verified Status Tracking** - Games show pending/verified status with timestamps
- **Player Management** - Support for multiple players per parent account

---

## Directory Standards

This project follows the MASTER DIRECTORY STANDARDS.
See `.directory-standards.md` for details.
All documentation is stored in `01-Docs/` using the `NNN-abv-description.ext` format.

---

## Tech Stack

- **Framework:** Next.js 15.5.4 with App Router
- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js 22
- **Authentication:** NextAuth v5 (next-auth@5.0.0-beta.25) with JWT
- **Database:** PostgreSQL 15 (Local + Cloud SQL)
- **ORM:** Prisma 6.16.3
- **UI:** shadcn/ui + Tailwind CSS + Kiranism dashboard
- **Deployment:** Google Cloud Run (containerized) + Local Docker
- **Build Tool:** Turbopack

---

## Architecture

```
Next.js App (Cloud Run)
    ↓ (VPC Connector)
Cloud SQL PostgreSQL (Private IP: 10.240.0.3)
```

### Database Schema

**User (Parent)**
- id, firstName, lastName, email, emailVerified, phone, password (bcrypt)
- NextAuth relations: accounts, sessions
- App relations: players

**Player**
- id, name, birthday (DateTime for age calc), position, teamClub, photoUrl, parentId
- One-to-many relationship with Game

**Game**
- id, playerId, date, opponent, result, finalScore, minutesPlayed
- goals, assists
- saves, goalsAgainst, cleanSheet (nullable, for goalkeepers)
- verified (boolean), verifiedAt (timestamp)

**NextAuth Tables**
- Account, Session, VerificationToken (standard NextAuth schema)

---

## Local Development

### Prerequisites

- Node.js 22+
- npm 11+
- PostgreSQL database access
- `.env` file with `DATABASE_URL`

### Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Visit http://localhost:3000

### Environment Variables

Create `.env` file:

```bash
DATABASE_URL="postgresql://username:password@host:5432/database"
```

---

## API Endpoints

### Game Management

**GET /api/games?playerId=xxx**
- Returns all games for a specific player
- Ordered by date (descending)
- Includes player name and position

**POST /api/games**
- Creates a new game log
- Required: `playerId`, `opponent`, `result`, `finalScore`, `minutesPlayed`
- Optional: `goals`, `assists`, `saves`, `goalsAgainst`, `cleanSheet`
- Returns: Created game with `verified=false`

### Verification

**POST /api/verify**
- Verifies a game log with parent PIN
- Required: `gameId`, `pin`
- Validates PIN against parent record
- Sets `verified=true` and `verifiedAt` timestamp
- Returns error if already verified or invalid PIN

### Player Management

**GET /api/players**
- Returns all players with parent email
- Ordered by name

### Health & Migration

**GET /api/healthcheck**
- Database connection health check

**POST /api/migrate**
- Runs database migrations (CREATE TABLE IF NOT EXISTS)

**GET /api/hello**
- Simple health check with environment info

---

## Deployment

### Build Artifact

**Docker Image:** `us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest`

**Latest Digest:** `sha256:75d313a96aac2b9cfa6a577a9756b4d696ff0e619917c3fd62b4b4779dec8a01`

### Deployment Steps

#### 1. Build Docker Image

```bash
docker build -t us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest .
```

#### 2. Push to Artifact Registry

```bash
docker push us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest
```

#### 3. Deploy to Cloud Run

```bash
gcloud run deploy hustle-app \
  --image us-central1-docker.pkg.dev/hustle-dev-202510/cloud-run-source-deploy/hustle-app:latest \
  --region us-central1 \
  --project hustle-dev-202510 \
  --vpc-connector hustle-vpc-connector \
  --set-env-vars DATABASE_URL="postgresql://hustle_admin:[PASSWORD]@10.240.0.3:5432/hustle_mvp"
```

### Infrastructure Requirements

- **VPC Connector:** `hustle-vpc-connector` (us-central1)
- **Cloud SQL Instance:** Private IP 10.240.0.3
- **Artifact Registry:** `cloud-run-source-deploy` repository
- **IAM:** Service requires authentication (no allUsers)

---

## Testing

### Local Build

```bash
npm run build
npm run preview
```

### API Testing (Production)

All endpoints require authentication:

```bash
# Get auth token
TOKEN=$(gcloud auth print-identity-token)

# Test players endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://hustle-app-158864638007.us-central1.run.app/api/players

# Create game log
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"xxx","opponent":"Test High","result":"Win","finalScore":"2-1","minutesPlayed":90,"goals":1,"assists":0}' \
  https://hustle-app-158864638007.us-central1.run.app/api/games

# Verify game
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gameId":"xxx","pin":"1234"}' \
  https://hustle-app-158864638007.us-central1.run.app/api/verify
```

---

## UI Pages

### /games/new
- Game logging form
- Player selection dropdown
- Conditional goalkeeper fields
- Form validation

### /games?playerId=xxx
- List all games for a player
- Color-coded result badges (Win=green, Loss=red, Tie=gray)
- Verified status indicators
- Stats display (goals, assists, saves, clean sheets)

### /verify?playerId=xxx
- List unverified games
- PIN entry for verification
- Success/error feedback
- Removes verified games from list

---

## Database Operations

### Run Migrations

```bash
# Via API (post-deployment)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://hustle-app-158864638007.us-central1.run.app/api/migrate
```

### Initialize Test Data

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://hustle-app-158864638007.us-central1.run.app/api/db-setup
```

Creates:
- Parent: test@hustle.app (PIN: 1234)
- Player: Test Player, Grade 10, Forward

---

## Project Structure

```
app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── games/route.ts          # Game CRUD
│   │   │   ├── players/route.ts        # Player list
│   │   │   ├── verify/route.ts         # PIN verification
│   │   │   ├── healthcheck/route.ts    # DB health
│   │   │   ├── migrate/route.ts        # Schema migrations
│   │   │   └── db-setup/route.ts       # Test data
│   │   ├── games/
│   │   │   ├── page.tsx                # Games list view
│   │   │   └── new/page.tsx            # Game logging form
│   │   ├── verify/page.tsx             # Verification UI
│   │   └── page.tsx                    # Home
│   └── lib/
│       └── prisma.ts                   # Prisma client singleton
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── migrations/                     # SQL migrations
├── Dockerfile                          # Multi-stage build
├── .dockerignore
├── next.config.ts                      # Standalone output
├── tsconfig.json                       # TypeScript config
├── package.json
└── README.md
```

---

## Configuration Files

### Dockerfile

Multi-stage build:
1. **deps** - Install dependencies with libc6-compat
2. **builder** - Generate Prisma client, run Next.js build
3. **runner** - Production image with non-root user (nextjs:nodejs)

Key settings:
- Node 22 Alpine base
- Port 8080 (Cloud Run standard)
- Standalone output mode
- Prisma client copied to runner

### next.config.ts

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',  // Required for Docker
};
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Performance Metrics

- **Build time:** ~50-60 seconds (Docker)
- **Image size:** Optimized with multi-stage build
- **Cold start:** < 2 seconds
- **API response:** < 200ms average
- **Database queries:** < 100ms with indexes

---

## Security

- **Database:** Private IP, VPC connector only
- **Authentication:** Cloud Run IAM (no public access)
- **PIN Verification:** Server-side validation
- **Secrets:** Environment variables (not in code)
- **Input Validation:** All API endpoints validate required fields

---

## Known Limitations (MVP)

- ✅ ~~No user authentication~~ - NextAuth v5 implemented
- Player selection requires manual navigation
- Image uploads partially implemented (players only)
- No analytics/statistics dashboard yet
- Email verification not implemented
- Password reset flow not implemented

---

## Future Enhancements

- [ ] Parent registration and login
- [ ] Session-based authentication
- [ ] Game photo uploads
- [ ] Statistics dashboard
- [ ] Export game logs to PDF
- [ ] Email notifications for verification requests
- [ ] Team/coach portal

---

## Support

**Project:** Hustle MVP
**GCP Project ID:** hustle-dev-202510
**Region:** us-central1
**Documentation:** /home/jeremy/projects/hustle/claudes-docs/

---

**Last Updated:** 2025-10-04
**Status:** ✅ Production Ready
