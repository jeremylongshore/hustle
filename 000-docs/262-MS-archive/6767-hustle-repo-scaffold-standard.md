# Hustle Repository Scaffold Standard

**Document Type:** Authoritative Specification
**Version:** 1.2
**Date:** 2025-11-15 (Phase 2 Complete)
**Status:** Active

---

## Purpose

This document defines the canonical directory structure for the Hustle youth sports platform repository. It establishes clear boundaries for where code, tests, scripts, assets, and infrastructure live to prevent scaffold drift and contributor confusion.

---

## Design Principles

1. **Single Documentation Root** - Only `000-docs/` for ALL documentation
2. **Standard Locations** - Respect Next.js/Firebase conventions (src/, public/, functions/)
3. **Numbered Meta Directories** - Use `0NN-` prefix ONLY for cross-cutting support directories
4. **Feature Isolation** - Large subsystems (vertex-agents, nwsl) live at root for visibility
5. **No Duplication** - One canonical location per concern (tests, scripts, infra, assets)
6. **Archive, Don't Delete** - Move deprecated/legacy items to `99-Archive/`, don't delete

---

## Phase 2 Execution Summary

**Status:** ✅ COMPLETE (2025-11-15)

All directory consolidation moves executed successfully. The table below shows planned vs actual paths:

| Current Path | Actual Target Path | Status | Notes |
|--------------|-------------------|--------|-------|
| `tests/mocks/` | `03-Tests/mocks/` | ✅ | Test fixtures, MSW mocks |
| `tests/scripts/` | `03-Tests/scripts/` | ✅ | Test utility scripts |
| `test-results/` | `03-Tests/results/` | ✅ | Playwright test artifacts |
| `scripts/migrate-to-firestore.ts` | `05-Scripts/migration/migrate-to-firestore.ts` | ✅ | Firebase migration script |
| `scripts/enable-firebase-auth.ts` | `05-Scripts/utilities/enable-firebase-auth.ts` | ✅ | Firebase Auth setup utility |
| `scripts/send-password-reset-emails.ts` | `05-Scripts/utilities/send-password-reset-emails.ts` | ✅ | User utility script |
| `scripts/verify-by-uid.ts` | `05-Scripts/utilities/verify-by-uid.ts` | ✅ | User verification utility |
| `scripts/verify-firebase-user.ts` | `05-Scripts/utilities/verify-firebase-user.ts` | ✅ | User verification utility |
| `setup_github_wif.sh` | `05-Scripts/deployment/setup_github_wif.sh` | ✅ | GitHub WIF setup script |
| `migrate-docs-flat.sh` | `05-Scripts/maintenance/migrate-docs-flat.sh` | ✅ | Doc migration utility |
| `validate-docs.sh` | `05-Scripts/maintenance/validate-docs.sh` | ✅ | Doc validation utility |
| `fix-github-notifications.sh` | `05-Scripts/maintenance/fix-github-notifications.sh` | ✅ | GitHub notification fix |
| `fix_hustlestats_tls.sh` | `05-Scripts/maintenance/fix_hustlestats_tls.sh` | ✅ | TLS fix script |
| `fix_hustlestats_tls_corrected.sh` | `05-Scripts/maintenance/fix_hustlestats_tls_corrected.sh` | ✅ | TLS fix script (corrected) |
| `terraform/` | `06-Infrastructure/terraform/` | ✅ | Root terraform is canonical (344 lines main.tf) |
| `security/credentials/` | `06-Infrastructure/security/credentials/` | ✅ | Service account credentials |
| `templates/14point/` | N/A (deleted) | ✅ | Empty directory, deleted per cleanup rules |
| `github-actions-key.json` | `99-Archive/credentials/github-actions-key.json` | ✅ | Credential file archived |
| `PHASE1-PROMPT.md` | `99-Archive/docs/PHASE1-PROMPT.md` | ✅ | Planning doc archived |
| `06-Infrastructure/terraform/` (old) | `06-Infrastructure/terraform-old/` | ✅ | Old terraform (34 lines) archived locally |

**Post-Move Actions Completed:**
- ✅ Updated `CLAUDE.md` with new script paths (`05-Scripts/migration/migrate-to-firestore.ts`)
- ✅ Updated `PHASE1-PROMPT.md` before archiving
- ✅ `playwright.config.ts` already referenced `03-Tests/` paths (no changes needed)
- ✅ `vitest.config.mts` already excluded `e2e/` generically (no changes needed)
- ✅ Deleted empty `tests/`, `scripts/`, `templates/`, `security/` directories after moves
- ✅ Deleted empty `04-Assets/` after templates/ was found to be empty

---

## Target Directory Structure

```
hustle/
├── 000-docs/                      # ALL documentation (only docs root)
│   └── *.md                       # Flat structure, numbered 001-999
│
├── 03-Tests/                      # ALL automated tests
│   ├── e2e/                       # Playwright E2E tests
│   │   └── auth/                  # Auth flow tests
│   ├── unit/                      # Vitest unit tests
│   ├── mocks/                     # Test fixtures, MSW mocks (from tests/)
│   ├── scripts/                   # Test utilities (from tests/)
│   ├── results/                   # Playwright test artifacts (from test-results/)
│   ├── playwright-report/         # HTML test reports
│   └── test-results.json          # Test results summary
│
├── 04-Assets/                     # DELETED (was empty)
│   # NOTE: templates/14point/ was empty and deleted during Phase 2 cleanup
│   # If non-code assets are needed in future, recreate this directory
│
├── 05-Scripts/                    # ALL automation & utilities
│   ├── deployment/                # Deploy scripts
│   │   ├── deploy.sh              # Cloud Run deployment
│   │   ├── setup-github-actions.sh # GitHub Actions setup
│   │   ├── setup-secrets.sh       # Secrets configuration
│   │   └── setup_github_wif.sh    # GitHub WIF setup (from root)
│   ├── migration/                 # One-time migrations
│   │   └── migrate-to-firestore.ts # PostgreSQL → Firestore migration
│   ├── maintenance/               # Cleanup, optimization, fixes
│   │   ├── fix-github-notifications.sh # GitHub notification fix (from root)
│   │   ├── fix_hustlestats_tls.sh      # TLS fix (from root)
│   │   ├── fix_hustlestats_tls_corrected.sh # TLS fix corrected (from root)
│   │   ├── future-optimization-date-index.prisma # DB optimization
│   │   ├── future-optimization-date-index.sql    # DB optimization SQL
│   │   ├── migrate-docs-flat.sh        # Doc migration (from root)
│   │   ├── monitor-optimization-thresholds.sql # DB monitoring
│   │   └── validate-docs.sh            # Doc validation (from root)
│   └── utilities/                 # General utilities
│       ├── analyze-dashboard-queries.ts # Dashboard analysis
│       ├── enable-firebase-auth.ts      # Firebase Auth setup (from scripts/)
│       ├── send-password-reset-emails.ts # User utility (from scripts/)
│       ├── verify-by-uid.ts             # User verification (from scripts/)
│       └── verify-firebase-user.ts      # User verification (from scripts/)
│
├── 06-Infrastructure/             # ALL infrastructure-as-code
│   ├── terraform/                 # Terraform IaC (from root terraform/)
│   │   ├── agents/                # Vertex AI agent configs
│   │   ├── environments/          # Dev/staging/prod
│   │   │   ├── dev/
│   │   │   └── prod/
│   │   ├── modules/               # Reusable Terraform modules
│   │   │   ├── bigquery/
│   │   │   ├── cloud-run/
│   │   │   ├── cloud-sql/
│   │   │   ├── cloud-storage/
│   │   │   ├── firebase/
│   │   │   ├── firestore/
│   │   │   ├── iam/
│   │   │   ├── projects/
│   │   │   ├── vertex-ai-agent/
│   │   │   ├── vertex-ai-search/
│   │   │   └── vpc/
│   │   ├── schemas/               # BigQuery schemas
│   │   ├── main.tf                # Main terraform config (344 lines)
│   │   ├── variables.tf
│   │   └── terraform.tfvars.example
│   ├── docker/                    # Docker Compose, local dev
│   │   └── docker-compose.yml     # PostgreSQL for local dev
│   ├── security/                  # Service accounts, credentials (from root security/)
│   │   └── credentials/           # .gitignored sensitive files
│   ├── terraform-old/             # Archived old terraform (34 lines, Phase 2)
│   └── terraform-backup-20251013/ # Old terraform backup (from Phase 1)
│
├── 07-Releases/                   # Release artifacts
│   ├── changelogs/                # Release notes
│   └── builds/                    # Tagged release builds (if stored)
│
├── 99-Archive/                    # Deprecated/legacy code
│   ├── credentials/               # Archived credential files (Phase 2)
│   │   └── github-actions-key.json # Archived GitHub Actions key
│   ├── docs/                      # Archived planning documents (Phase 2)
│   │   └── PHASE1-PROMPT.md       # Archived Phase 1 execution prompt
│   ├── app-git-backup/            # Old git backup
│   └── survey-nextjs-unused/      # Unused survey app
│
├── src/                           # Next.js app source code (standard)
│   ├── app/                       # Next.js 15 App Router
│   │   ├── api/                   # API routes (13 routes)
│   │   ├── dashboard/             # Dashboard pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── verify-email/
│   │   └── [other routes]/
│   ├── components/                # React components
│   │   ├── ui/                    # shadcn/ui components
│   │   └── layout/                # Layout components
│   ├── lib/                       # Core utilities, services
│   │   ├── firebase/              # Firebase SDK, Firestore services
│   │   │   ├── config.ts
│   │   │   ├── admin.ts
│   │   │   └── services/          # Firestore CRUD
│   │   └── validations/           # Zod schemas
│   ├── hooks/                     # Custom React hooks
│   ├── types/                     # TypeScript types
│   ├── config/                    # App configuration
│   ├── prompts/                   # AI prompts
│   ├── schema/                    # Additional schemas
│   └── __tests__/                 # Co-located unit tests
│       ├── api/
│       └── lib/
│
├── functions/                     # Firebase Cloud Functions (standard)
│   ├── src/                       # TypeScript source
│   │   ├── index.ts               # Function exports
│   │   ├── a2a-client.ts          # Vertex AI A2A client
│   │   ├── email-service.ts       # Resend email integration
│   │   └── email-templates.ts     # Email templates
│   ├── lib/                       # Compiled JavaScript (gitignored)
│   ├── package.json               # Node.js 20 dependencies
│   └── tsconfig.json              # Functions TypeScript config
│
├── vertex-agents/                 # Vertex AI A2A multi-agent system
│   ├── orchestrator/              # Main coordinator agent
│   │   ├── config/
│   │   │   ├── agent.yaml
│   │   │   └── agent-card.json
│   │   └── src/
│   ├── validation/                # Validation sub-agent
│   │   ├── config/
│   │   └── src/
│   ├── user-creation/             # User creation sub-agent
│   │   ├── config/
│   │   └── src/
│   ├── onboarding/                # Onboarding sub-agent
│   │   ├── config/
│   │   └── src/
│   ├── analytics/                 # Analytics sub-agent
│   │   ├── config/
│   │   └── src/
│   ├── deploy_agent.sh            # Agent deployment script
│   ├── test_a2a.sh                # A2A protocol tests
│   └── README.md                  # A2A system documentation
│
├── nwsl/                          # NWSL video pipeline (CI-only)
│   ├── 0000-docs/                 # Canon specs (8 segments: 004-DR-REFF-veo-seg-*.md)
│   ├── 0000-images/               # Reference images
│   ├── 0000-archive/              # Archived pipeline versions
│   │   └── gate.sh                # Old CI enforcement gate
│   ├── 000-audio/                 # Lyria-generated audio
│   ├── 000-clips/                 # Video clip sources
│   ├── 000-complete/              # Completed videos
│   ├── 000-videos/                # Generated video segments
│   ├── archive_20251107_final/    # Pipeline archive
│   ├── cloud-run-proxy/           # Cloud Run proxy (if used)
│   ├── scripts/                   # Pipeline generation scripts
│   │   ├── build_nwsl90_master.sh
│   │   ├── conform_nwsl90_segments.py
│   │   ├── generate_nwsl90_segments.sh
│   │   └── mix_nwsl90_audio.py
│   └── tmp/                       # Temporary generation files
│
├── prisma/                        # Prisma ORM (legacy, being phased out)
│   ├── schema.prisma              # PostgreSQL schema (8 models)
│   └── migrations/                # Prisma migrations (2 migrations)
│       ├── 20251009100411_add_defensive_stats/
│       └── 20251014193000_rename_verification_pin_hash/
│
├── public/                        # Next.js public assets (standard)
│   ├── file.svg                   # Next.js default icons
│   ├── globe.svg
│   ├── next.svg
│   ├── window.svg
│   ├── vercel.svg
│   └── uploads/                   # User-uploaded files
│       └── players/               # Player photos
│
├── [config files at root]         # Standard tooling configs
│   ├── package.json               # npm dependencies
│   ├── package-lock.json
│   ├── tsconfig.json              # TypeScript config
│   ├── tsconfig.tsbuildinfo       # TypeScript build cache
│   ├── next-env.d.ts              # Next.js types
│   ├── next.config.ts             # Next.js config
│   ├── firebase.json              # Firebase config
│   ├── .firebaserc                # Firebase project selection
│   ├── firestore.rules            # Firestore security rules
│   ├── firestore.indexes.json     # Firestore indexes
│   ├── playwright.config.ts       # Playwright config
│   ├── vitest.config.mts          # Vitest config
│   ├── vitest.setup.ts            # Vitest setup
│   ├── tailwind.config.ts         # Tailwind CSS config
│   ├── postcss.config.js          # PostCSS config
│   ├── eslint.config.mjs          # ESLint config
│   ├── components.json            # shadcn/ui config
│   ├── sentry.client.config.ts    # Sentry client config
│   ├── sentry.server.config.ts    # Sentry server config
│   ├── sentry.edge.config.ts      # Sentry edge config
│   ├── Dockerfile                 # Production Docker image
│   ├── .env.example               # Environment variable template
│   ├── .env                       # Local environment (gitignored)
│   ├── .env.local                 # Local overrides (gitignored)
│   ├── .gitignore                 # Git ignore rules
│   ├── .dockerignore              # Docker ignore rules
│   ├── .gcloudignore              # gcloud ignore rules
│   ├── CLAUDE.md                  # Claude Code context
│   ├── AGENTS.md                  # Coding standards
│   └── LICENSE                    # Project license
│
└── [build artifacts - gitignored]
    ├── node_modules/              # npm dependencies
    ├── .next/                     # Next.js build cache
    └── functions/lib/             # Compiled Cloud Functions
```

---

## Directory Specifications

### 000-docs/ - Documentation Root

**Purpose:** Single source of truth for ALL project documentation
**Format:** Document Filing System v2.0 (`NNN-CC-ABCD-description.md`)
**Structure:** Flat (no subdirectories)
**Sequence:** 001-999, currently at 192

**Document Filing System v2.0:**

Pattern: `NNN-CC-ABCD-short-description.ext`
- `NNN` = Sequence number (001-999, zero-padded)
- `CC` = Category code (2 uppercase letters)
- `ABCD` = Subcategory code (4 uppercase letters)
- `short-description` = Kebab-case human-readable description
- `ext` = File extension (.md, .sql, .ts, etc.)

**Category Codes (Actually Used in This Repo):**

| Code | Category | Count | Examples |
|------|----------|-------|----------|
| `DR` | Documentation Reference | 37 | `DR-GUID`, `DR-REFF`, `DR-SOPS` |
| `OD` | Operational Documentation | 24 | `OD-DEPL`, `OD-CONF`, `OD-INFR` |
| `RA` | Report/Analysis | 23 | `RA-ANLY`, `RA-REPT`, `RA-REVW` |
| `TQ` | Technical Quality | 22 | `TQ-TEST`, `TQ-BUGR`, `TQ-SECU` |
| `AA` | After Action | 19 | `AA-SUMM`, `AA-MAAR`, `AA-AACR` |
| `LS` | Logs/Status | 16 | `LS-STAT`, `LS-LOGS`, `LS-CHKP` |
| `AT` | Architecture/Technical | 15 | `AT-ARCH`, `AT-DSGN`, `AT-ADEC` |
| `PP` | Plan/Product | 10 | `PP-PLAN`, `PP-PROD`, `PP-RMAP` |
| `DC` | Development/Code | 8 | `DC-CODE`, `DC-DEVN` |
| `MC` | Misc/Checklist | 7 | `MC-SUMM`, `MC-ACTN` |
| `UC` | User/Customer | 2 | `UC-SURV` |
| `PM` | Project Management | 2 | `PM-TASK` |
| `MS` | Misc/Status | 1 | `MS-MISC` |
| `BL` | Baseline/Policy | 1 | `BL-POLI` |

For full Document Filing System v2.0 specification, see: `000-docs/120-AT-ADEC-doc-filing-standard.md`

**Rules:**
- ✅ ALL markdown docs, design specs, guides, reports
- ✅ Numbered sequentially with category codes (see table above)
- ❌ NO subdirectories (keep flat for easy search)
- ❌ NO separate "claudes-docs" or other doc directories

**Examples:**
- `190-PP-PLAN-phase1-go-live-track.md` - Phase 1 execution plan
- `189-AA-SUMM-hustle-step-1-auth-wiring-complete.md` - Step completion summary
- `6767-hustle-repo-scaffold-standard.md` - This document (authoritative spec)

---

### 03-Tests/ - Test Suites

**Purpose:** Consolidated location for ALL automated tests and test artifacts
**Current State:** Partially consolidated, needs `tests/`, `test-results/` merged in
**Consolidates:** `tests/mocks/`, `tests/scripts/`, `test-results/`

**Structure:**
- `e2e/` - Playwright E2E tests (auth flows, dashboard)
  - `auth/` - Authentication flow tests
- `unit/` - Vitest unit tests (services, utilities)
- `mocks/` - MSW API mocks, test fixtures (from `tests/mocks/`)
- `scripts/` - Test utilities, setup scripts (from `tests/scripts/`)
- `results/` - Playwright test result artifacts (from `test-results/`, gitignored)
- `playwright-report/` - HTML test reports (gitignored)
- `test-results.json` - Test results summary

**Rules:**
- ✅ Test specs: `*.spec.ts` (E2E), `*.test.ts` (unit)
- ✅ Coverage reports go in `results/coverage/`
- ✅ CI uploads test results here for artifact storage
- ❌ NO test code scattered in root or other directories

**Post-Consolidation:**
- Update `playwright.config.ts` to use `03-Tests/` paths
- Update `vitest.config.mts` if needed
- Delete empty `tests/` and `test-results/` directories

---

### 04-Assets/ - Design & Template Assets

**Purpose:** Non-code assets that are NOT served to users
**Current State:** Empty, needs `templates/` merged in
**Consolidates:** `templates/14point/`

**Structure:**
- `design/` - Figma exports, mockups, wireframes
- `templates/` - Email templates, document templates, Notion exports
  - `14point/` - 14point template content (from root `templates/`)
- `reference/` - Reference images, architecture diagrams, screenshots

**Rules:**
- ✅ Design files, templates, reference materials
- ✅ Content that informs development but isn't served
- ❌ NO user-facing assets (those go in `public/`)
- ❌ NO code or executable scripts

**Distinction from public/:**
- `04-Assets/` = development/design resources (not served)
- `public/` = Next.js public files served to users (SVGs, uploads)

**Post-Consolidation:**
- Delete empty `templates/` directory after move

---

### 05-Scripts/ - Automation & Utilities

**Purpose:** ALL automation scripts, utilities, and one-time migrations
**Current State:** Has deployment/setup scripts, needs root `*.sh` and `scripts/*.ts` merged
**Consolidates:** Root shell scripts (6 files), `scripts/` directory (5 TypeScript files)

**Structure:**
- `deployment/` - Deploy scripts
  - `deploy.sh` - Current deployment automation
- `setup/` - Setup scripts (from root + `scripts/`)
  - `setup-github-actions.sh`
  - `setup-secrets.sh`
  - `setup_github_wif.sh` (from root)
  - `enable-firebase-auth.ts` (from `scripts/`)
- `migration/` - One-time migrations (from `scripts/`)
  - `migrate-to-firestore.ts` (from `scripts/`)
  - `future-optimization-date-index.prisma`
  - `future-optimization-date-index.sql`
  - `monitor-optimization-thresholds.sql`
- `maintenance/` - Cleanup, optimization (from root)
  - `analyze-dashboard-queries.ts`
  - `migrate-docs-flat.sh` (from root)
  - `validate-docs.sh` (from root)
- `utilities/` - General-purpose utilities (from root + `scripts/`)
  - `send-password-reset-emails.ts` (from `scripts/`)
  - `verify-by-uid.ts` (from `scripts/`)
  - `verify-firebase-user.ts` (from `scripts/`)
  - `fix-github-notifications.sh` (from root)
  - `fix_hustlestats_tls.sh` (from root, consider archiving)
  - `fix_hustlestats_tls_corrected.sh` (from root, consider archiving)

**Rules:**
- ✅ Shell scripts (`.sh`), TypeScript utilities (`.ts`), Python scripts (`.py`)
- ✅ Executable (`chmod +x`) for shell scripts
- ✅ TypeScript scripts run via `npx tsx 05-Scripts/path/to/script.ts`
- ❌ NO root-level `.sh` files (move to appropriate subdirectory)

**Post-Consolidation:**
- Update `package.json` scripts if they reference old paths
- Grep `.github/workflows/*.yml` for script references, update paths
- Delete empty `scripts/` directory after moves
- Evaluate if `fix_hustlestats_tls*.sh` should archive to `99-Archive/`

---

### 06-Infrastructure/ - Infrastructure as Code

**Purpose:** ALL infrastructure, deployment configs, security credentials
**Current State:** Has `docker/` and old `terraform/` backup, needs root `terraform/` and `security/` merged
**Consolidates:** Root `terraform/` (344 lines, canonical), root `security/`

**Structure:**
- `terraform/` - Main Terraform IaC (from root `terraform/`)
  - `agents/` - Vertex AI agent configs
  - `environments/` - Dev/staging/prod environment configs
    - `dev/`
    - `prod/`
  - `modules/` - Reusable Terraform modules (11 modules)
    - `bigquery/`, `cloud-run/`, `cloud-sql/`, `cloud-storage/`
    - `firebase/`, `firestore/`, `iam/`, `projects/`
    - `vertex-ai-agent/`, `vertex-ai-search/`, `vpc/`
  - `schemas/` - BigQuery schemas
    - `bigquery/`
  - `main.tf` - Main terraform config (344 lines, CANONICAL)
  - `variables.tf`
  - `terraform.tfvars.example`
- `docker/` - Docker Compose for local dev
  - `docker-compose.yml` - PostgreSQL local database
- `security/` - Service accounts, credentials (from root `security/`)
  - `credentials/` - `.json` service account keys (gitignored)
    - `github-actions-key.json` (from root)
    - Other service account keys

**Rules:**
- ✅ Root `terraform/` directory (344 lines) is CANONICAL, moves to `06-Infrastructure/terraform/`
- ✅ Root `security/` directory moves to `06-Infrastructure/security/`
- ✅ Root `Dockerfile` stays at root (Docker convention)
- ✅ All `.json` keys in `security/credentials/` must be gitignored
- ❌ NO duplicate terraform directories

**Post-Consolidation:**
- Archive `06-Infrastructure/terraform-backup-20251013/` to `99-Archive/` (34 lines, old backup)
- Update `.gitignore` to ensure `06-Infrastructure/security/credentials/*.json` is covered
- Update any Terraform CI/CD workflows to use new path

---

### 07-Releases/ - Release Artifacts

**Purpose:** Release notes, changelogs, tagged builds
**Status:** Currently exists, minimal content

**Structure:**
- `changelogs/` - Release notes by version
- `builds/` - Tagged release builds (if stored locally)

**Rules:**
- ✅ Automated changelog generation via GitHub Actions
- ✅ Manual release notes for major versions
- ❌ NO build artifacts if deployed to Cloud Run/Firebase (use Git tags instead)

---

### 99-Archive/ - Deprecated Code

**Purpose:** Storage for legacy/deprecated code that's no longer active
**Current Contents:** `app-git-backup/`, `survey-nextjs-unused/`
**Will Receive:** `terraform-backup-20251013/` (Phase 2)

**Structure:**
- Dated subdirectories: `YYYYMMDD-description/`
- Named by migration phase: `prisma-legacy-20251115/`
- Current archives:
  - `app-git-backup/` - Old git backup
  - `survey-nextjs-unused/` - Unused survey Next.js app

**Rules:**
- ✅ Move here, don't delete (preserve history)
- ✅ Include README.md in each archive explaining why archived
- ✅ Git commit archive moves separately from active changes
- ❌ NO active development in 99-Archive/

**Candidates for Archiving (Phase 2):**
- `06-Infrastructure/terraform-backup-20251013/` - Old terraform backup (34 lines main.tf)
- `fix_hustlestats_tls*.sh` - Old one-time TLS fix scripts (if no longer needed)

**Future Candidates (Post-Migration):**
- `prisma/` - After Firestore migration completes (Phase 2+)

---

### src/ - Next.js Application Code

**Purpose:** Main Next.js 15 application source code
**Convention:** Standard Next.js App Router structure
**Status:** Follows Next.js conventions correctly

**Structure:**
- `app/` - App Router pages, layouts, API routes
  - `api/` - 13 API route handlers
  - `dashboard/` - Dashboard pages
  - `login/`, `register/`, `forgot-password/`, `verify-email/` - Auth pages
  - `privacy/`, `terms/` - Legal pages
- `components/` - React components
  - `ui/` - shadcn/ui components
  - `layout/` - Layout components
- `lib/` - Core utilities, services
  - `firebase/` - Firebase SDK, Firestore services
    - `config.ts` - Client SDK config
    - `admin.ts` - Admin SDK config
    - `services/` - Firestore CRUD operations
  - `validations/` - Zod schemas
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `config/` - Application configuration
- `prompts/` - AI prompts (if used)
- `schema/` - Additional schemas
- `__tests__/` - Co-located unit tests
  - `api/` - API route tests
  - `lib/` - Library tests

**Rules:**
- ✅ Follows Next.js conventions strictly
- ✅ TypeScript strict mode enforced
- ✅ Firebase services in `lib/firebase/services/`
- ❌ NO test files in `src/` (use `03-Tests/` instead, unless co-located in `__tests__/`)

---

### functions/ - Firebase Cloud Functions

**Purpose:** Firebase Cloud Functions backend (Node.js 20)
**Convention:** Standard Firebase Functions structure
**Status:** Follows Firebase conventions correctly

**Structure:**
- `src/` - TypeScript source code
  - `index.ts` - Function exports
  - `a2a-client.ts` - Vertex AI A2A protocol client
  - `email-service.ts` - Resend email integration
  - `email-templates.ts` - Email template builder
- `lib/` - Compiled JavaScript (gitignored, generated by `npm run build`)
- `package.json` - Node.js 20 dependencies
- `tsconfig.json` - Functions TypeScript config

**Rules:**
- ✅ TypeScript compiled to `lib/` before deployment
- ✅ Deploy via `firebase deploy --only functions`
- ✅ A2A protocol integration for Vertex AI agents
- ❌ NO manual edits to `lib/` (auto-generated)

---

### vertex-agents/ - Vertex AI A2A System

**Purpose:** Multi-agent system using Vertex AI Agent Engine (A2A protocol)
**Status:** Production-deployed subsystem (5 agents: orchestrator + 4 sub-agents)
**Justification for root:** Independent deployment lifecycle, production-critical infrastructure

**Structure:**
- `orchestrator/` - Main coordinator agent (hustle-operations-manager)
  - `config/` - Agent YAML config, AgentCard JSON
  - `src/` - Agent source code (if any)
- `validation/` - Validation sub-agent
  - `config/` - Agent config
  - `src/` - Agent source
- `user-creation/` - User creation sub-agent
  - `config/` - Agent config
  - `src/` - Agent source
- `onboarding/` - Onboarding sub-agent
  - `config/` - Agent config
  - `src/` - Agent source
- `analytics/` - Analytics sub-agent
  - `config/` - Agent config
  - `src/` - Agent source
- `deploy_agent.sh` - Agent deployment automation
- `test_a2a.sh` - A2A protocol testing script
- `README.md` - A2A system documentation

**Rules:**
- ✅ Significant subsystem, stays at root for visibility
- ✅ Each agent has `config/agent.yaml` and `config/agent-card.json`
- ✅ Deploy manually via Vertex AI Console (preferred) or script
- ✅ Integrates with `functions/src/a2a-client.ts`
- ❌ NO deletion (production-critical)

**Agent Architecture:**
- **Orchestrator**: Receives requests from Cloud Functions, routes to sub-agents
- **Validation**: Input validation, duplicate checking
- **User Creation**: Creates users/players/games in Firestore
- **Onboarding**: Sends emails, generates tokens
- **Analytics**: Tracks metrics, logs events

---

### nwsl/ - NWSL Video Pipeline

**Purpose:** CI-only video generation pipeline (Vertex AI Veo 3.0)
**Status:** GitHub Actions-only execution (gate.sh archived in `0000-archive/`)
**Justification for root:** Independent CI/CD workflow, no integration with main app

**Actual Structure (Verified):**
- `0000-docs/` - 8 segment canon specs
  - `004-DR-REFF-veo-seg-01.md` through `011-DR-REFF-veo-seg-08.md`
  - Additional design docs, continuity bible
- `0000-images/` - Reference images for video generation
- `0000-archive/` - Archived pipeline versions
  - `gate.sh` - Old CI enforcement gate (archived)
  - `000-docs/`, `004-scripts/`, etc. (old structure)
- `000-audio/` - Lyria-generated audio files
- `000-clips/` - Video clip sources
- `000-complete/` - Completed video outputs
- `000-videos/` - Generated video segments
- `archive_20251107_final/` - Final pipeline archive from Nov 7
- `cloud-run-proxy/` - Cloud Run proxy configuration (if used)
- `scripts/` - Active pipeline generation scripts
  - `build_nwsl90_master.sh` - Master build script
  - `conform_nwsl90_segments.py` - Segment conformance
  - `generate_nwsl90_segments.sh` - Main generation script
  - `mix_nwsl90_audio.py` - Audio mixing
- `tmp/` - Temporary generation files
  - `nwsl90/`, `voiceover/`, `voiceover_wav/`

**Rules:**
- ✅ CI-only execution via GitHub Actions (Workload Identity Federation)
- ✅ 8×8s segments + 4s end card = 68s documentary
- ✅ Veo 3.0 requires explicit soccer context in prompts
- ⚠️ gate.sh is ARCHIVED in `0000-archive/`, not actively enforcing
- ❌ NO local execution (archived gate.sh previously enforced this)

**Note:** The original spec claimed `gate.sh` was at `nwsl/gate.sh`, but reality check shows it's archived in `nwsl/0000-archive/gate.sh`. CI enforcement now handled by GitHub Actions workflow restrictions.

---

### prisma/ - Prisma ORM (Legacy)

**Purpose:** PostgreSQL database schema and migrations
**Status:** LEGACY - Being migrated to Firestore (Phase 1 in progress)

**Structure:**
- `schema.prisma` - 8 models (users, Player, Game, accounts, sessions, password_reset_tokens, email_verification_tokens, verification_tokens)
- `migrations/` - Prisma migration history (2 migrations)
  - `20251009100411_add_defensive_stats/`
  - `20251014193000_rename_verification_pin_hash/`

**Rules:**
- ✅ Keep during migration period (dual-database support)
- ✅ NO new features on Prisma models
- ✅ NO breaking schema changes during migration
- ⏳ Archive to `99-Archive/prisma-legacy-YYYYMMDD/` after migration completes

**Migration Timeline:**
- Phase 1: Firestore wiring + registration/login migration (IN PROGRESS)
- Phase 2: Dashboard migration + full cutover
- Phase 3: Archive Prisma, remove PostgreSQL

---

### public/ - Next.js Public Assets

**Purpose:** Static files served to users via Next.js
**Convention:** Standard Next.js public directory

**Structure:**
- `file.svg`, `globe.svg`, `next.svg`, `window.svg`, `vercel.svg` - Next.js default icons
- `uploads/` - User-uploaded files
  - `players/` - Player photos

**Rules:**
- ✅ Accessible at `/filename.ext` in browser
- ✅ Optimized for web delivery (minified SVGs, compressed images)
- ❌ NO design assets or templates (those go in `04-Assets/`)

---

## Configuration Files (Root Level)

**Purpose:** Standard tooling configurations at repo root
**Convention:** Industry-standard locations for package managers, build tools

**Files (Verified Present):**
- `package.json`, `package-lock.json` - npm dependencies
- `tsconfig.json`, `tsconfig.tsbuildinfo` - TypeScript compiler config
- `next-env.d.ts` - Next.js TypeScript definitions
- `next.config.ts` - Next.js configuration
- `firebase.json` - Firebase project config
- `.firebaserc` - Firebase project selection
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore composite indexes
- `playwright.config.ts` - Playwright E2E test config
- `vitest.config.mts`, `vitest.setup.ts` - Vitest unit test config
- `tailwind.config.ts` - Tailwind CSS config
- `postcss.config.js` - PostCSS config
- `eslint.config.mjs` - ESLint linter config
- `components.json` - shadcn/ui config
- `sentry.client.config.ts` - Sentry client-side error tracking
- `sentry.server.config.ts` - Sentry server-side error tracking
- `sentry.edge.config.ts` - Sentry edge function error tracking
- `Dockerfile` - Production Docker image
- `.env.example` - Environment variable template
- `.env`, `.env.local` - Local environment (gitignored)
- `.gitignore` - Git ignore rules
- `.dockerignore` - Docker ignore rules
- `.gcloudignore` - gcloud deployment ignore rules
- `CLAUDE.md` - Claude Code project context
- `AGENTS.md` - Coding standards and conventions
- `LICENSE` - Project license

**Files to Move (Phase 2):**
- `PHASE1-PROMPT.md` → `000-docs/193-PP-PLAN-phase1-execution-prompt.md`

**Rules:**
- ✅ Standard locations respected (don't move config files)
- ✅ `.env`, `.env.local` are gitignored (use `.env.example` as template)
- ✅ AI context files (CLAUDE.md, AGENTS.md) stay at root
- ✅ Sentry configs stay at root (Next.js convention)
- ❌ NO custom config directories at root

---

## New File Placement Rules

### "Where do I put...?"

**Documentation (reports, guides, specs):**
→ `000-docs/NNN-CC-ABCD-description.md`

**E2E tests:**
→ `03-Tests/e2e/feature-name.spec.ts`

**Unit tests:**
→ `03-Tests/unit/service-name.test.ts` or `src/lib/__tests__/service.test.ts`

**Test fixtures/mocks:**
→ `03-Tests/mocks/`

**Test utility scripts:**
→ `03-Tests/scripts/`

**Deployment scripts:**
→ `05-Scripts/deployment/script-name.sh`

**Setup/configuration scripts:**
→ `05-Scripts/setup/script-name.sh`

**One-time migrations:**
→ `05-Scripts/migration/migrate-description.ts`

**Maintenance/monitoring scripts:**
→ `05-Scripts/maintenance/script-name.ts`

**General utility scripts:**
→ `05-Scripts/utilities/script-name.ts`

**Design mockups:**
→ `04-Assets/design/mockup-name.png`

**Email templates:**
→ `04-Assets/templates/email-template.html`

**Reference images:**
→ `04-Assets/reference/image-name.png`

**Terraform modules:**
→ `06-Infrastructure/terraform/modules/module-name/`

**Terraform environments:**
→ `06-Infrastructure/terraform/environments/env-name/`

**Service account keys:**
→ `06-Infrastructure/security/credentials/key-name.json` (gitignored)

**Docker Compose files:**
→ `06-Infrastructure/docker/docker-compose.yml`

**User-facing images/icons:**
→ `public/image-name.svg`

**User uploads:**
→ `public/uploads/category/`

**React components:**
→ `src/components/ComponentName.tsx` (or `src/components/ui/` for shadcn)

**API routes:**
→ `src/app/api/route-name/route.ts`

**Firebase Cloud Function:**
→ `functions/src/function-name.ts`

**Vertex AI agent config:**
→ `vertex-agents/agent-name/config/agent.yaml`

**Deprecated code:**
→ `99-Archive/YYYYMMDD-description/`

---

## Enforcement & Maintenance

### Pre-Commit Checks

**Pseudocode checks for pre-commit hook:**

```bash
# Prevent new root-level shell scripts (except archived ones)
# Note: Scripts in active use should be in 05-Scripts/
test $(find . -maxdepth 1 -name "*.sh" -type f | wc -l) -eq 0

# Prevent new doc directories (only 000-docs/ allowed)
test $(find . -maxdepth 1 -type d -name "*docs*" ! -name "000-docs" | wc -l) -eq 0

# Prevent test files outside 03-Tests/ or src/__tests__/
# (This is a pattern check, not a literal command)
# Files matching *.test.ts or *.spec.ts should only be in:
#   - 03-Tests/
#   - src/__tests__/
#   - nwsl/ (exception for nwsl pipeline)
```

**Note:** These are enforcement patterns, not copy-paste shell commands. Implement in pre-commit hook with proper error handling.

### Regular Audits

**Monthly:**
- Check for root-level clutter (new `.sh` files, loose scripts)
- Verify `04-Assets/` has templates after consolidation
- Confirm no duplicate test directories (`tests/`, `test-results/` should be empty or gone)
- Verify `scripts/` directory is empty after Phase 2 consolidation

**Per Migration Phase:**
- Archive deprecated directories to `99-Archive/` with descriptive READMEs
- Update this spec document (bump version, add notes)
- Commit scaffold changes separately from feature work
- Update "Current → Target Move Plan" table with completion status

**After Phase 2 Consolidation:**
- Verify all paths in move plan table are completed
- Delete empty source directories (`tests/`, `scripts/`, `templates/`)
- Update config files (`playwright.config.ts`, `vitest.config.mts`, CI workflows)
- Archive `06-Infrastructure/terraform-backup-20251013/` to `99-Archive/`

### Contributor Onboarding

**Required Reading:**
1. This document (`000-docs/6767-hustle-repo-scaffold-standard.md`)
2. `CLAUDE.md` (project architecture and development guide)
3. `AGENTS.md` (coding standards and conventions)
4. `000-docs/120-AT-ADEC-doc-filing-standard.md` (Document Filing System v2.0)

**First PR Checklist:**
- [ ] Files placed in correct directories per this spec
- [ ] No new root-level scripts or docs directories
- [ ] Tests in `03-Tests/` (not scattered)
- [ ] Documentation in `000-docs/` (numbered with category codes)
- [ ] Scripts in `05-Scripts/` subdirectories (not root)
- [ ] Infrastructure in `06-Infrastructure/` (not root)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-15 | Initial authoritative specification |
| 1.1 | 2025-11-15 | Reality check update: Added Current→Target move plan table, documented actual category codes, fixed nwsl/gate.sh path (archived), added missing config files, verified directory structures |

---

## Related Documents

- `000-docs/192-AA-MAAR-hustle-scaffold-phase-1-inventory-and-plan.md` - Phase 1 Mini AAR
- `000-docs/120-AT-ADEC-doc-filing-standard.md` - Document Filing System v2.0 specification
- `CLAUDE.md` - Project architecture and development guide
- `AGENTS.md` - Coding standards and conventions

---

**Document ID:** 6767-hustle-repo-scaffold-standard
**Authoritative Status:** This is the canonical scaffold specification
**Next Review:** After Phase 2 consolidation (directory moves)
**Reality Check Date:** 2025-11-15 (All paths, files, and structures verified against actual repo)
