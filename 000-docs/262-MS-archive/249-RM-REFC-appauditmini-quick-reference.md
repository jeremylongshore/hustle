# Hustle: Quick Reference Card

**Document**: 249-RM-REFC-appauditmini-quick-reference.md
**Created**: 2025-11-19
**Purpose**: Quick architecture reference for rapid onboarding and troubleshooting
**Status**: Active
**Version**: aa0bc53

## 🎯 Purpose
Youth soccer statistics tracking platform - parents track player performance, coaches analyze team data, recruiters discover talent.

## 🎮 MVP Customer Experience Flow
```
1. PARENT SIGNS UP
   ↓ Email verification required
   ↓ COPPA compliance (confirms parent/guardian)

2. ADDS PLAYER PROFILES
   ↓ Child's name, position, team
   ↓ Multiple players per parent account

3. LOGS GAME STATS
   ↓ Quick entry: goals, assists, saves
   ↓ Position-specific metrics (GK vs Forward)
   ↓ Date, opponent, score

4. VIEWS INSIGHTS
   ↓ Season totals, averages
   ↓ Performance trends
   ↓ Position rankings

5. SHARES WITH RECRUITERS (Future)
   ↓ Public player profiles
   ↓ Highlight reels
   ↓ Contact requests
```

**Core Value Props:**
- 📊 **Parents**: Track child's progress, prove development
- ⚽ **Players**: Build stats portfolio for college recruitment
- 🎯 **Coaches**: Identify team strengths/weaknesses
- 🔍 **Recruiters**: Discover talent with verified stats

**Key Differentiator**: Position-specific metrics (not just goals/assists)

## 🏗️ Architecture At-a-Glance
```
[Next.js 15] → [API Routes] → [Firestore/PostgreSQL]
      ↓             ↓                ↓
[Firebase Auth] [Vertex AI]    [Cloud Storage]
      ↓             ↓                ↓
[React 19]    [A2A Agents]    [GitHub Actions]
```

## 🛠️ Tech Stack
| Component | Technology | Version | Local Port | Prod URL |
|-----------|------------|---------|------------|----------|
| Frontend  | Next.js + React | 15.5.4 / 19.1.0 | 3000 | hustlestats.io |
| Backend   | Next.js API Routes | 15.5.4 | 3000 | /api/* |
| Database  | Firestore (primary) | - | emulator:8080 | Firebase Console |
| Database  | PostgreSQL (legacy) | 15 | 5432 | Cloud SQL |
| Auth      | Firebase Auth | - | - | Console |
| AI/ML     | Vertex AI Agents | - | - | A2A protocol |

## 📁 Key Directories
```
hustle/
├── src/              # Next.js app (entry: app/layout.tsx)
├── functions/        # Firebase Cloud Functions
├── vertex-agents/    # A2A agent definitions
├── nwsl/            # Video pipeline (CI-only)
├── prisma/          # PostgreSQL schema (legacy)
├── tests/           # Vitest + Playwright
└── .github/         # 9 CI/CD workflows
```

## 🚀 Quick Commands
```bash
# Development
npm install              # Setup dependencies
npm run dev             # Start dev server (port 3000)
npm test                # Run all tests
npm run build           # Build for production

# Database (Prisma - Legacy)
npx prisma generate     # Generate client after schema changes
npx prisma migrate dev  # Create and apply migration
npx prisma studio       # Visual DB browser

# Firebase
firebase emulators:start        # Local Firebase
firebase deploy --only firestore # Deploy rules
firebase deploy --only functions # Deploy functions
firebase deploy --only hosting   # Deploy app

# Migration
npx tsx scripts/migrate-to-firestore.ts  # PostgreSQL → Firestore
```

## 🔑 Environment Variables
```bash
# Required (.env.example → .env)
DATABASE_URL=postgresql://user:pass@localhost:5432/hustle_mvp

# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hustleapp-production.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hustleapp-production

# Firebase (Server)
FIREBASE_PROJECT_ID=hustleapp-production
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Services
RESEND_API_KEY=re_YOUR_KEY_HERE  # Email
NEXTAUTH_SECRET=                 # Legacy auth
```

## 🌍 Environments
| Env | URL | Deploy Method | Database | Branch |
|-----|-----|---------------|----------|--------|
| Local | localhost:3000 | npm run dev | Emulators/Docker | any |
| Staging | hustle-staging-*.run.app | GitHub Actions | Cloud SQL | main |
| Prod | hustlestats.io | firebase deploy | Firestore | main/tags |

## 🔐 Access & Auth
- **Auth Provider**: Firebase Auth (migrating from NextAuth v5)
- **Admin Panel**: /dashboard (authenticated)
- **API Keys**: Google Secret Manager + .env
- **Service Account**: WIF for GitHub Actions (no keys!)

## 📊 Key APIs/Routes
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| /api/auth/* | POST | NextAuth endpoints (legacy) | No |
| /api/players/* | CRUD | Player management | Yes |
| /api/games/* | CRUD | Game statistics | Yes |
| /api/admin/* | ALL | Admin operations | Yes + Role |
| /api/migrate/* | POST | Data migration utils | Yes + Admin |

## 🚨 Troubleshooting
| Issue | Check | Fix |
|-------|-------|-----|
| Won't start | Port 3000 busy? | `lsof -i:3000` → kill process |
| DB error | Migrations? | `npx prisma migrate dev` |
| Prisma out of sync | Schema changed? | `npx prisma generate` |
| Firebase error | Private key format? | Ensure `\n` in FIREBASE_PRIVATE_KEY |
| Auth fails | Provider enabled? | Check Firebase Console |
| Build fails | Node version? | Use Node 20+ |

## 📈 Monitoring
- **Logs**: Google Cloud Logging / `gcloud logs`
- **Errors**: Sentry (NEXT_PUBLIC_SENTRY_DSN)
- **Firebase**: Console → Project Overview
- **GitHub Actions**: [Actions tab](https://github.com/jeremylongshore/hustle/actions)
- **Uptime**: Cloud Run metrics

## 👥 Team Contacts
| Role | Contact | Area |
|------|---------|------|
| Founder | Jeremy Longshore | Architecture, Product |
| DevOps | @jeremylongshore | Infrastructure, CI/CD |
| AI/ML | Intent Solutions | Vertex AI, Agents |

## 🔗 Essential Links
- **Repo**: https://github.com/jeremylongshore/hustle
- **Production**: https://hustlestats.io
- **Firebase Console**: https://console.firebase.google.com/project/hustleapp-production
- **CI/CD**: https://github.com/jeremylongshore/hustle/actions
- **Docs**: `000-docs/` (248+ documents)

## ⚡ First Day Checklist
- [ ] Clone repo: `git clone https://github.com/jeremylongshore/hustle.git`
- [ ] Install deps: `npm install`
- [ ] Copy env: `cp .env.example .env` (fill in values)
- [ ] Start Docker: `cd 06-Infrastructure/docker && docker-compose up -d`
- [ ] Generate Prisma: `npx prisma generate`
- [ ] Start dev: `npm run dev` → http://localhost:3000
- [ ] Run tests: `npm test`
- [ ] Check staging: https://hustle-staging-*.run.app

## 🎬 Next Steps
1. **Phase 1 Migration**: Tasks 2-8 in `000-docs/190-PP-PLAN-phase1-go-live-track.md`
2. **Full audit**: Run `/appaudit` for comprehensive analysis
3. **A2A Agents**: Check `vertex-agents/README.md`
4. **Recent work**: See `000-docs/189-AA-SUMM-hustle-step-1-auth-wiring-complete.md`

## 🚀 Current Priority
**Firebase Migration Phase 1** - Migrating from NextAuth + PostgreSQL to Firebase Auth + Firestore
- Step 1: ✅ Complete (local wiring)
- Step 2-8: 🔄 In Progress (see doc 190)
- Target: Full Firebase by end of November 2025