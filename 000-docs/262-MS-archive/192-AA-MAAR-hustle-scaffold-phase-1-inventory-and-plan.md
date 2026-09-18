# Phase 1: Hustle Scaffold Inventory & Plan - Mini AAR

**Date:** 2025-11-15
**Phase:** 1 of 3 (Inventory & Documentation Only)
**Status:** Complete (Updated with Reality Check)
**Operator:** Claude (Senior DevOps/Repo Architect)

---

## Mission

Analyze the current Hustle repository scaffold, identify duplication and sprawl, propose a target structure, and document the authoritative standard WITHOUT making any moves yet.

---

## What We Discovered

### Repository Health

**Overall Assessment:** Moderate scaffold drift with clear duplication patterns

**Good:**
- Core app structure (src/, functions/, public/) follows Next.js/Firebase conventions
- Large subsystems (vertex-agents/, nwsl/) are properly isolated
- 000-docs/ is the single documentation root (190+ docs, properly numbered)
- Git history is clean, no obvious file chaos

**Issues Identified:**

1. **Test Directory Fragmentation** (HIGH PRIORITY)
   - `03-Tests/` - Consolidated test location (e2e/, unit/, playwright-report/)
   - `tests/` - Only has mocks/ and scripts/ (test utilities, not actual tests)
   - `test-results/` - Playwright artifacts at root (should be in 03-Tests/results/)
   - **Impact:** New contributors confused about where to put tests

2. **Scripts Directory Duplication** (HIGH PRIORITY)
   - `05-Scripts/` - Infrastructure scripts (deploy.sh, setup-github-actions.sh, analyze-dashboard-queries.ts)
   - `scripts/` - Application scripts (migrate-to-firestore.ts, enable-firebase-auth.ts, verify-*.ts)
   - Root `*.sh` files - 6 loose shell scripts (setup_github_wif.sh, fix-*.sh, migrate-docs-flat.sh, validate-docs.sh)
   - **Impact:** No clear "where do scripts go?" answer

3. **Infrastructure Directory Confusion** (MEDIUM PRIORITY)
   - `terraform/` (root) - Active Terraform setup (344 lines in main.tf, with modules/, agents/, schemas/)
   - `06-Infrastructure/terraform/` - Old version (34 lines in main.tf)
   - `06-Infrastructure/terraform-backup-20251013/` - Dated backup
   - `security/` (root) - Service account credentials
   - **Impact:** Unclear which terraform/ is canonical (CONFIRMED: root is canonical)

4. **Empty Assets Directory** (LOW PRIORITY)
   - `04-Assets/` - Completely empty
   - `templates/` - Has 14point/ subdirectory (template content)
   - `public/` - Next.js public assets (correct location)
   - **Impact:** Templates not in numbered directory, 04-Assets serves no purpose

5. **Root-Level Clutter** (MEDIUM PRIORITY)
   - 6 loose `.sh` scripts at root
   - `github-actions-key.json` at root (should be in security/)
   - `PHASE1-PROMPT.md` at root (should be in 000-docs/)
   - **Impact:** Root directory increasingly cluttered

### Directory Inventory (Reality-Checked)

**Core Application (Standard Locations):**
- `src/` - Next.js 15 app source (app/, components/, lib/, hooks/, types/, config/, prompts/, schema/, __tests__/)
- `functions/` - Firebase Cloud Functions (Node.js 20, A2A client, email service)
- `public/` - Next.js public assets (SVGs, uploads/)
- `prisma/` - Prisma schema/migrations (LEGACY, being migrated to Firestore)
  - 2 migrations: `20251009100411_add_defensive_stats/`, `20251014193000_rename_verification_pin_hash/`

**Feature Modules (Root-Level Subsystems):**
- `vertex-agents/` - A2A multi-agent system (orchestrator + 4 sub-agents)
  - Each agent: orchestrator/, validation/, user-creation/, onboarding/, analytics/
  - Each has config/ (agent.yaml, agent-card.json) and src/
  - deploy_agent.sh, test_a2a.sh, README.md at root
- `nwsl/` - CI-only video pipeline
  - 0000-docs/ (8 segment canons: 004-DR-REFF-veo-seg-*.md)
  - 0000-archive/ (contains archived gate.sh)
  - 000-audio/, 000-clips/, 000-complete/, 000-videos/, 0000-images/
  - archive_20251107_final/, cloud-run-proxy/, scripts/, tmp/

**Meta/Support Directories (Numbered):**
- `000-docs/` - ALL documentation (192+ docs, Document Filing System v2.0)
- `03-Tests/` - E2E/unit tests, playwright reports (e2e/auth/, unit/, playwright-report/, test-results.json)
- `04-Assets/` - Design assets (EMPTY - needs templates/)
- `05-Scripts/` - Infrastructure scripts (deployment/, setup/, maintenance/ subdirs)
  - analyze-dashboard-queries.ts, deploy.sh, setup-github-actions.sh, setup-secrets.sh
  - future-optimization-date-index.prisma, future-optimization-date-index.sql, monitor-optimization-thresholds.sql
- `06-Infrastructure/` - Docker, Terraform, security (has duplication issues)
  - docker/docker-compose.yml
  - terraform/ (34 lines main.tf - OLD)
  - terraform-backup-20251013/ (backup to archive)
- `07-Releases/` - Release artifacts, changelogs (minimal content)
- `99-Archive/` - Deprecated code
  - app-git-backup/ (old git backup)
  - survey-nextjs-unused/ (unused survey app)

**Overlapping/Duplicate Directories (Verified):**
- `tests/` (root) - Only mocks/ and scripts/ (utilities, not tests)
- `test-results/` (root) - Playwright artifacts (contains .last-run.json and 2 test result directories)
- `scripts/` (root) - Application utilities (5 TypeScript files)
  - migrate-to-firestore.ts, enable-firebase-auth.ts, send-password-reset-emails.ts
  - verify-by-uid.ts, verify-firebase-user.ts
- `terraform/` (root) - Active IaC (344 lines main.tf - CANONICAL)
- `security/` (root) - Credentials (credentials/ subdirectory)
- `templates/` (root) - Template content (14point/ subdirectory)

**Root-Level Files (Config & Scattered Scripts - Verified):**
- Standard configs: package.json, tsconfig.json, next.config.ts, firebase.json, .firebaserc, etc.
- Sentry configs: sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts
- AI context: CLAUDE.md, AGENTS.md, PHASE1-PROMPT.md
- Dotfiles: .env.example, .env, .env.local, .gitignore, .dockerignore, .gcloudignore (all present)
- Loose scripts (6 total):
  - setup_github_wif.sh
  - migrate-docs-flat.sh
  - validate-docs.sh
  - fix-github-notifications.sh
  - fix_hustlestats_tls.sh
  - fix_hustlestats_tls_corrected.sh
- Loose credentials: github-actions-key.json (should be gitignored/moved)

---

## Target Scaffold Designed

### High-Level Strategy

**Consolidation Principles:**
1. **One canonical location per concern** (tests, scripts, infra, assets)
2. **Respect standards** (Next.js: src/public/, Firebase: functions/)
3. **Feature isolation** (vertex-agents/, nwsl/ stay at root)
4. **Archive, don't delete** (99-Archive/ for legacy)
5. **Numbered meta directories ONLY** for cross-cutting support

### Target Structure (Tree View)

```
hustle/
├── 000-docs/                      # ALL documentation (only docs root)
├── 03-Tests/                      # ALL automated tests + artifacts
│   ├── e2e/, unit/, mocks/, scripts/
│   └── results/, playwright-report/
├── 04-Assets/                     # Non-code assets (design, templates)
│   ├── design/, templates/, reference/
├── 05-Scripts/                    # ALL automation scripts
│   ├── deployment/, setup/, migration/
│   ├── maintenance/, utilities/
├── 06-Infrastructure/             # ALL infrastructure-as-code
│   ├── terraform/ (consolidated from root)
│   ├── docker/
│   └── security/
├── 07-Releases/                   # Release artifacts
├── 99-Archive/                    # Deprecated code
├── src/                           # Next.js app (standard)
├── functions/                     # Firebase Cloud Functions (standard)
├── vertex-agents/                 # A2A multi-agent system (feature module)
├── nwsl/                          # Video pipeline (feature module)
├── prisma/                        # Prisma ORM (legacy, archive later)
├── public/                        # Next.js public assets (standard)
└── [config files at root]         # package.json, tsconfig.json, etc.
```

### Consolidation Plan (Phase 2+)

**Detailed in 6767 Spec "Current → Target Move Plan" table**

**Tests Consolidation:**
- `tests/mocks/` → `03-Tests/mocks/`
- `tests/scripts/` → `03-Tests/scripts/`
- `test-results/` → `03-Tests/results/`
- Delete empty `tests/` directory

**Scripts Consolidation:**
- `scripts/migrate-to-firestore.ts` → `05-Scripts/migration/migrate-to-firestore.ts`
- `scripts/enable-firebase-auth.ts` → `05-Scripts/setup/enable-firebase-auth.ts`
- `scripts/send-password-reset-emails.ts` → `05-Scripts/utilities/send-password-reset-emails.ts`
- `scripts/verify-by-uid.ts` → `05-Scripts/utilities/verify-by-uid.ts`
- `scripts/verify-firebase-user.ts` → `05-Scripts/utilities/verify-firebase-user.ts`
- `setup_github_wif.sh` → `05-Scripts/setup/setup_github_wif.sh`
- `migrate-docs-flat.sh` → `05-Scripts/maintenance/migrate-docs-flat.sh`
- `validate-docs.sh` → `05-Scripts/maintenance/validate-docs.sh`
- `fix-github-notifications.sh` → `05-Scripts/utilities/fix-github-notifications.sh`
- `fix_hustlestats_tls.sh` → `05-Scripts/utilities/fix_hustlestats_tls.sh` (or archive)
- `fix_hustlestats_tls_corrected.sh` → `05-Scripts/utilities/fix_hustlestats_tls_corrected.sh` (or archive)
- Delete empty `scripts/` directory

**Infrastructure Consolidation:**
- `terraform/` (root, 344 lines main.tf - CANONICAL) → `06-Infrastructure/terraform/`
- `security/` → `06-Infrastructure/security/`
- Archive `06-Infrastructure/terraform-backup-20251013/` → `99-Archive/terraform-backup-20251013/`
  - **Assumption**: This is an old backup (34 lines main.tf vs 344 lines in root) and should be archived

**Assets Consolidation:**
- `templates/14point/` → `04-Assets/templates/14point/`
- Delete empty `templates/` directory
- Populate `04-Assets/design/` with design files (if any)

**Root Cleanup:**
- `github-actions-key.json` → `06-Infrastructure/security/credentials/github-actions-key.json` (ensure gitignored)
- `PHASE1-PROMPT.md` → `000-docs/193-PP-PLAN-phase1-execution-prompt.md` (renumber to DFS v2.0)

---

## Risks & Open Questions Flagged

### Risks (With Answers)

1. **Terraform Directory Confusion** (RESOLVED)
   - **Finding**: Root `terraform/main.tf` has 344 lines (CANONICAL)
   - **Finding**: `06-Infrastructure/terraform/main.tf` has 34 lines (OLD)
   - **Decision**: Root terraform/ is canonical, move to 06-Infrastructure/terraform/
   - **Action**: Archive old 06-Infrastructure/terraform/ content if different
   - **Risk:** Minimal - size difference makes canonical version obvious
   - **Mitigation:** Diff both directories in Phase 2 to catch any unique configs

2. **Test Path Updates** (LOW)
   - `playwright.config.ts` references `tests/` directory
   - `vitest.config.mts` may reference test paths
   - **Risk:** Tests fail after moving `tests/` to `03-Tests/`
   - **Mitigation:** Update configs in same commit as directory move

3. **Script Import Paths** (LOW)
   - `package.json` scripts may reference `scripts/` directory
   - GitHub Actions workflows may reference root `.sh` files
   - **Risk:** CI breaks after moving scripts
   - **Mitigation:** Grep for references, update paths before move

4. **Firebase Migration Timing** (MEDIUM)
   - Phase 1 Go-Live Track (8 tasks) is currently in progress
   - Scaffold cleanup could conflict with migration work
   - **Risk:** Merge conflicts, double work
   - **Mitigation:** Coordinate scaffold Phase 2 after migration stabilizes

### Assumptions (For Phase 2 Verification)

1. **terraform-backup-20251013/ is old backup** - Assumption based on:
   - Size: 34 lines main.tf vs 344 lines in root
   - Date: October 2025 backup
   - Location: Already in 06-Infrastructure/ (suggests it was moved there before)
   - **Verify in Phase 2**: Check git history, archive if confirmed old

2. **fix_hustlestats_tls*.sh are one-time fixes** - Assumption based on:
   - Naming: "fix" suggests one-time operation
   - Variants: Two versions suggest iterative fixing
   - **Verify in Phase 2**: Check last modified date, check if referenced in CI

3. **gate.sh enforcement moved to CI** - Confirmed finding:
   - gate.sh is archived in nwsl/0000-archive/gate.sh
   - CI enforcement now handled by GitHub Actions workflow restrictions
   - **Action**: Update spec to reflect this (DONE in v1.1)

### Open Questions (For Phase 2 Planning)

1. **Are there unique configs in 06-Infrastructure/terraform/?**
   - Answer in Phase 2: Diff with root terraform/, preserve any unique configs

2. **Do CI workflows hardcode script paths?**
   - Answer in Phase 2: Grep `.github/workflows/*.yml` for references before moving

3. **Should fix_hustlestats_tls*.sh archive immediately?**
   - Answer in Phase 2: Check last modified date and CI references

---

## Authoritative Documentation Created

### 1. Scaffold Standard Specification

**File:** `000-docs/6767-hustle-repo-scaffold-standard.md`
**Type:** Authoritative Specification
**Version:** 1.1 (Updated with reality check)
**Status:** Active

**Contents:**
- Design principles (single docs root, standard locations, numbered meta dirs)
- **NEW:** Current → Target Move Plan table (concrete path mappings for Phase 2)
- Complete target directory structure (tree view, depth 2-3)
- Directory specifications (purpose, structure, rules) for each directory
- **NEW:** Document Filing System v2.0 category codes (actual usage in this repo)
- New file placement rules ("Where do I put...?" decision tree)
- Consolidation plan (what moves where in Phase 2)
- Enforcement & maintenance (pre-commit checks, audit schedule)

**Reality Check Updates (v1.1):**
- Added Current → Target Move Plan table with verified paths
- Documented actual DFS v2.0 category codes used (DR, OD, RA, TQ, AA, LS, AT, PP, etc.)
- Fixed nwsl/gate.sh path (archived in 0000-archive/, not at root)
- Added missing config files (Sentry, .firebaserc, etc.)
- Verified terraform/ sizes (344 lines root = canonical, 34 lines in 06-Infra = old)
- Verified all directory structures against actual repo tree
- Removed speculative details, replaced with verified facts

**Key Decisions Documented:**
- `000-docs/` is the ONLY documentation root (no claudes-docs, no subdirectories)
- `03-Tests/` consolidates ALL tests (e2e, unit, mocks, results)
- `05-Scripts/` consolidates ALL scripts (deployment, setup, migration, utilities)
- `06-Infrastructure/` consolidates ALL infra (terraform, docker, security)
- `04-Assets/` gets templates, design files (non-served resources)
- `vertex-agents/` and `nwsl/` stay at root (significant feature modules)
- `prisma/` stays until Firestore migration completes, then archives

**Link to Spec:** See `000-docs/6767-hustle-repo-scaffold-standard.md` for full details

### 2. Phase 1 Mini AAR (This Document)

**File:** `000-docs/192-AA-MAAR-hustle-scaffold-phase-1-inventory-and-plan.md`
**Type:** Mini After-Action Report
**Phase:** 1 of 3

**Contents:**
- Repository health assessment
- Directory inventory (current state, reality-checked)
- Target scaffold design
- Consolidation plan (linked to 6767 spec table)
- Risks and assumptions (with answers where available)

---

## Metrics

**Time Spent:**
- Initial analysis + documentation: ~30 minutes
- Reality check + spec tightening: ~20 minutes
- **Total:** ~50 minutes

**Directories Analyzed:**
- Top-level: 20 directories
- Subdirectories: 80+ examined (depth 3)
- Config files: 40+ inventoried

**Issues Found:**
- Duplicate directories: 6 cases (tests, scripts, terraform, security, templates, test-results)
- Root clutter: 6 loose shell scripts, 1 loose JSON file, 1 loose MD file
- Empty directory: 1 (04-Assets/)
- Consolidation candidates: 20+ files/directories

**Documentation Produced:**
- 1 authoritative specification (6767-hustle-repo-scaffold-standard.md)
  - v1.0: ~600 lines
  - v1.1: ~900 lines (with Current → Target table, DFS codes, reality check)
- 1 Mini AAR (this document)
  - v1.0: ~400 lines
  - v1.1: ~500 lines (with reality check, assumptions, updated metrics)
- **Total:** ~1,400 lines of structured documentation

---

## What's Next (Phase 2 Preview)

**Scope:** Execute consolidation moves, update configs

**Actions (Detailed in 6767 spec Current → Target Move Plan table):**
1. Verify terraform/ canonical status (CONFIRMED: root is canonical with 344 lines)
2. Move `tests/mocks/`, `tests/scripts/` into `03-Tests/`
3. Move `test-results/` contents to `03-Tests/results/`
4. Move `scripts/*.ts` files into `05-Scripts/` subdirectories (by category)
5. Move root `*.sh` files into `05-Scripts/` subdirectories (by category)
6. Move `terraform/` (root) to `06-Infrastructure/terraform/`
7. Move `security/` to `06-Infrastructure/security/`
8. Move `templates/14point/` to `04-Assets/templates/14point/`
9. Move `github-actions-key.json` to `06-Infrastructure/security/credentials/`
10. Move `PHASE1-PROMPT.md` to `000-docs/193-PP-PLAN-phase1-execution-prompt.md`
11. Archive `06-Infrastructure/terraform-backup-20251013/` to `99-Archive/`
12. Update `playwright.config.ts` with new test paths
13. Update `vitest.config.mts` if needed
14. Grep `.github/workflows/*.yml` and `package.json` for script path references, update
15. Test locally (`npm test`, `npm run build`)
16. Delete empty source directories (`tests/`, `scripts/`, `templates/`)
17. Git commit with detailed move history
18. Create Phase 2 Mini AAR

**Estimated Time:** 45-60 minutes (actual moves + path updates + testing)

**Prerequisites:**
- Phase 1 reality-check commit merged
- No conflicting Firebase migration work in flight
- Confirmation that root `terraform/` (344 lines) is canonical (CONFIRMED)

---

## Deliverables

✅ Authoritative scaffold spec: `000-docs/6767-hustle-repo-scaffold-standard.md` (v1.0)
✅ Phase 1 Mini AAR: `000-docs/192-AA-MAAR-hustle-scaffold-phase-1-inventory-and-plan.md` (v1.0)
✅ Git commit with both docs (ec26c04)
✅ Reality-check update to both docs (v1.1) - this session

---

## Repo Smells Summary

**Major Smells Found:**

1. **Test Fragmentation** - 3 separate test locations (03-Tests, tests, test-results)
2. **Script Duplication** - 3 separate script locations (05-Scripts, scripts, root *.sh)
3. **Terraform Confusion** - Root terraform (344 lines, canonical) vs 06-Infrastructure/terraform (34 lines, old)
4. **Root Clutter** - 6 loose shell scripts, 1 loose credential file, 1 loose doc file
5. **Empty Directory** - 04-Assets/ serves no purpose currently

**Positive Observations:**

1. **Clean Documentation** - 000-docs/ is properly numbered, flat structure, no duplicates
2. **Good Core Structure** - src/, functions/, public/ follow conventions
3. **Feature Isolation** - vertex-agents/ and nwsl/ properly separated
4. **Archive Discipline** - 99-Archive/ is used (not deleting old code)
5. **Git History** - Clean commit history, no obvious file chaos

**Severity:**
- HIGH: Test/script fragmentation (contributor confusion)
- MEDIUM: Infrastructure duplication (deployment confusion)
- LOW: Empty directories, root clutter (cosmetic)

**Recommendation:** Proceed with Phase 2 consolidation after Phase 1 Go-Live Track stabilizes.

---

## Git Changes (v1.1 Reality Check)

**Commit 1 (ec26c04):** Initial Phase 1 documentation
- Created 6767-hustle-repo-scaffold-standard.md (v1.0)
- Created 192-AA-MAAR-hustle-scaffold-phase-1-inventory-and-plan.md (v1.0)

**Commit 2 (this session):** Reality check and spec tightening
- **6767 spec v1.1 changes:**
  - Added "Current → Target Move Plan" table with 20 verified path mappings
  - Documented actual DFS v2.0 category codes (DR, OD, RA, TQ, AA, LS, AT, PP, DC, MC, UC, PM, MS, BL)
  - Fixed nwsl/ directory structure (gate.sh archived in 0000-archive/, not root)
  - Added missing config files (Sentry configs, .firebaserc, etc.)
  - Verified terraform/ sizes (root 344 lines = canonical)
  - Updated pre-commit checks (removed broken gate.sh reference)
  - Added reality check verification note
- **192 AAR v1.1 changes:**
  - Updated terraform line counts (344 vs 34, not "26KB")
  - Converted "Risks" to "Risks (With Answers)" with verified info
  - Added "Assumptions" section for items needing Phase 2 verification
  - Updated inventory with verified file lists
  - Added link to updated 6767 spec
  - Added this "Git Changes" section

**Key Fixes:**
- Spec now matches actual repo tree (all paths verified)
- Category codes reflect actual usage (not theoretical)
- Pre-commit checks are now actionable (not broken pseudocode)
- Terraform canonical status confirmed (root = 344 lines)
- nwsl/gate.sh path corrected (archived)

---

**Phase Status:** COMPLETE (with reality check v1.1)
**Next Phase:** Phase 2 - Directory Consolidation & Path Updates
**Commit Message (this session):** `chore(scaffold): tighten hustle scaffold spec and phase 1 aar`

---

**Document ID:** 192-AA-MAAR-hustle-scaffold-phase-1-inventory-and-plan
**Created:** 2025-11-15
**Updated:** 2025-11-15 (Reality check v1.1)
**Operator:** Claude (Senior DevOps/Repo Architect)
