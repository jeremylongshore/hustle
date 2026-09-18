# Hustle - Soccer Player Game Logging Platform

![Status](https://img.shields.io/badge/status-active-success)
![Version](https://img.shields.io/badge/version-00.00.00-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)
![Auth](https://img.shields.io/badge/Auth-NextAuth%20v5-purple)

**Live:** https://hustle-app-158864638007.us-central1.run.app
**Last Updated:** 2025-10-05

---

## 🎯 Overview

Hustle is a complete soccer player statistics tracking platform built for parents of high school athletes (grades 8-12). Track your athlete's journey from local competition to college recruitment with comprehensive game logging, performance analytics, and verified statistics.

### 🏆 Gate A Milestone - COMPLETE ✅

We've successfully reached our foundational milestone:
- ✅ **Landing Page** - Professional, responsive landing with clear CTAs
- ✅ **NextAuth v5** - Secure authentication with JWT and bcrypt (migrated from SuperTokens)
- ✅ **Dashboard** - Clean Kiranism-based interface for parents
- ✅ **Cloud Run Deployment** - Production-ready infrastructure on GCP
- ✅ **PostgreSQL Database** - Fully operational with Prisma ORM

**This marks our foundation.** Auth works, users can log in, infrastructure is solid. Ready to build features on this base.

---

## Directory Standards

This project follows the **MASTER DIRECTORY STANDARDS**.

See `.directory-standards.md` for complete standards documentation.

### Directory Structure

- **`01-Docs/`** - All project documentation (PRDs, planning, strategy)
- **`app/`** - Next.js application (see `app/README.md`)
- **`06-Infrastructure/`** - Terraform IaC for GCP deployment
- **`claudes-docs/`** - AI-generated documentation (gitignored)
- **`03-Tests/`** - Integration and E2E tests
- **`04-Assets/`** - Project assets and configs
- **`05-Scripts/`** - Automation scripts
- **`07-Releases/`** - Release artifacts
- **`99-Archive/`** - Archived materials

---

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev -- -p 4000

# Visit http://localhost:4000
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

### Infrastructure

```bash
# Navigate to infrastructure
cd 06-Infrastructure/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply infrastructure
terraform apply
```

---

## Project Components

### Next.js Application

- **Framework:** Next.js 15.5.4 with App Router
- **Authentication:** NextAuth v5 with JWT
- **Database:** PostgreSQL 15 with Prisma ORM
- **UI:** shadcn/ui + Tailwind CSS + Kiranism dashboard
- **Deployment:** Docker + Google Cloud Run

See `CLAUDE.md` for detailed application documentation.

### Infrastructure (`06-Infrastructure/terraform/`)

- **Cloud Provider:** Google Cloud Platform
- **Database:** Cloud SQL PostgreSQL 15
- **Compute:** Cloud Run (containerized)
- **Networking:** VPC with connector
- **Storage:** Google Artifact Registry

---

## Documentation

### Key Documents

| File | Description |
|------|-------------|
| `01-Docs/001-prd-hustle-mvp-v1.md` | Original product requirements |
| `01-Docs/002-prd-hustle-mvp-v2-lean.md` | Lean MVP iteration |
| `01-Docs/003-pln-sales-strategy.md` | Go-to-market strategy |
| `app/01-Docs/001-adr-nextauth-migration.md` | NextAuth migration decision record |

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15.5.4 with App Router & Turbopack
- **UI:** React 19.1.0 + TypeScript (strict mode)
- **Components:** shadcn/ui + Tailwind CSS + Radix UI primitives
- **Dashboard:** Kiranism next-shadcn-dashboard-starter

### Backend
- **API:** Next.js API Routes with NextAuth v5
- **Authentication:** JWT strategy with bcrypt (10 rounds)
- **Database:** PostgreSQL 15 with Prisma ORM
- **Session:** Server-side session protection

### Infrastructure
- **Cloud:** Google Cloud Platform
- **Compute:** Cloud Run (containerized, serverless)
- **Database:** Cloud SQL PostgreSQL
- **Networking:** VPC with private connector
- **IaC:** Terraform for all infrastructure
- **CI/CD:** Docker multi-stage builds

---

## Current Status

### Completed ✅
- [x] NextAuth v5 authentication migration
- [x] Kiranism dashboard UI integration
- [x] Database schema with Prisma
- [x] Docker containerization
- [x] GCP Cloud Run deployment
- [x] Directory standards compliance

### In Progress 🚧
- [ ] Complete athlete management UI
- [ ] Game logging interface
- [ ] Verification workflow
- [ ] Analytics dashboard

### Planned 📋
- [ ] Email verification
- [ ] Password reset flow
- [ ] OAuth providers (Google, GitHub)
- [ ] Mobile responsiveness improvements
- [ ] Performance optimization

---

## Development Workflow

### Local Development
1. Work in `app/` directory
2. Run `npm run dev -- -p 4000`
3. Database at `localhost:5432`

### Documentation
1. All docs go in `01-Docs/`
2. Use `NNN-abv-description.ext` naming
3. Maintain chronological order

### Infrastructure Changes
1. Update Terraform in `06-Infrastructure/terraform/`
2. Plan before applying
3. Document changes in `01-Docs/`

---

## Contact

**Project:** Hustle MVP
**Repository:** /home/jeremy/projects/hustle
**Application:** /home/jeremy/projects/hustle/app
**Infrastructure:** /home/jeremy/projects/hustle/06-Infrastructure

---

**Last Updated:** 2025-10-05
**Maintained By:** Jeremy Longshore
**License:** See LICENSE file

---

## 🚀 Auto-Deployment Status

✅ GitHub Actions configured for automatic deployment
✅ Secrets stored in Google Secret Manager
✅ Every push to `main` automatically deploys to Cloud Run

**Live URL:** https://hustle-app-158864638007.us-central1.run.app

