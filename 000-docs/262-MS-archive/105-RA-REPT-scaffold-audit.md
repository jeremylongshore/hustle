# Repository Scaffold Audit Report

**Project:** Hustle (Youth Sports Statistics Tracking)
**Repository:** /home/jeremy/000-projects/hustle
**Audit Date:** 2025-10-17
**Auditor:** Claude Code (Automated Analysis)

---

## Executive Summary

This audit analyzed the Hustle repository structure to identify documentation sprawl, security file organization, and CI/CD normalization opportunities. The repository currently contains **119 markdown files** scattered across multiple directories, creating maintenance challenges and inconsistent documentation discovery.

**Key Findings:**
- ✅ **No duplicate files detected** (verified via MD5 hash comparison)
- ⚠️ **5 separate documentation locations** requiring consolidation
- ⚠️ **Security credentials in non-standard location** (.credentials/)
- ⚠️ **Potential CI/CD workflow duplication** (2 deploy workflows)
- ⚠️ **Deleted documentation directory** (01-Docs/) in git history

**Recommended Actions:**
1. Migrate all documentation to flat `/docs/` structure
2. Consolidate security files into `/security/`
3. Normalize CI/CD workflows to single authoritative source
4. Archive legacy `01-Docs/` from git history
5. Adopt DOCUMENT-FILING-SYSTEM-STANDARD-v2.0 naming convention

---

## 1. Documentation Inventory

### 1.1 Current Documentation Locations

| Location | File Count | File Types | Status |
|----------|-----------|------------|--------|
| `001-claude-docs/` | 91 | Markdown | ✅ Active |
| `001-claude-docs/survey-remediation/` | 2 | Markdown | ✅ Active |
| Root directory | 6 | Markdown | ✅ Active |
| `.github/` | 3 | Markdown | ✅ Active |
| `.github/releases/v00.00.01/` | 2 | Markdown | ✅ Active |
| `01-Docs/` | Unknown | Markdown | ⚠️ Deleted (in git history) |
| Test directories | ~15 | Markdown | ✅ Active |
| **TOTAL** | **119** | **Markdown** | - |

### 1.2 Documentation in `001-claude-docs/` (91 files)

**Document Type Breakdown:**
- **Product Requirements (PRD):** 2 files (001, 002)
- **Plans (PLN):** 3 files (003, 037, 070)
- **Logs (LOG):** 11 files (004-012, others)
- **References (REF):** 35+ files
- **Architecture Decision Records (ADR):** 3 files (015, 038)
- **Bug Reports (BUG):** 3 files (021, 030, 031)
- **Fixes (FIX):** 3 files (022, 023, 026)
- **After Action Reports (AAR):** 2 files (024, 028)
- **Security (SEC):** 2 files (027, 071)
- **Summaries (SUM):** 8 files
- **Reviews (REV):** 2 files
- **Checks (CHK):** 4 files
- **Analysis (ANA):** 2 files
- **Standard Operating Procedures (SOP):** 3 files
- **Services (SRV):** 1 file
- **Policies (POL):** 1 file
- **Deployments (DEP):** 1 file
- **Design (DES):** 1 file
- **Verification (VER):** 1 file
- **Status (STA):** 1 file

**Additional File Types in 001-claude-docs/:**
- SQL files: 1 (051-migration-composite-index.sql)
- TSX files: 1 (051-optimized-query-example.tsx)
- YAML files: 1 (043-ref-jekyll-config.yml)
- Prisma files: 1 (051-schema-update-recommendation.prisma)
- Patch files: 1 (032-bug-landing-page-fix.patch)

### 1.3 Root-Level Documentation (6 files)

```
README.md                    - Project overview
CLAUDE.md                    - AI assistant instructions
CHANGELOG.md                 - Version history
AGENTS.md                    - Agent configuration
PATCH_NOTES.md              - Patch notes
.directory-standards.md     - Directory standards
```

### 1.4 GitHub-Specific Documentation (5 files)

```
.github/PULL_REQUEST_TEMPLATE.md
.github/RELEASE_NOTES_v00.00.01.md
.github/releases/v00.00.01/changelog.md
.github/releases/v00.00.01/release-notes.md
.github/releases/v00.00.01/VERSION
.github/releases/v00.00.01/package.json
```

### 1.5 Survey Remediation Subdirectory (2 files)

```
001-claude-docs/survey-remediation/FINAL-SURVEY-REMEDIATION-REPORT.md
001-claude-docs/survey-remediation/issue-001-root-cause-analysis.md
```

---

## 2. Duplication and Drift Analysis

### 2.1 File Duplication Check

**Method:** MD5 hash comparison across all files
**Result:** ✅ **No exact duplicates detected**

All 98 files in `001-claude-docs/` have unique content.

### 2.2 Potential Content Overlap

**Identified Overlaps:**

1. **Deployment Documentation:**
   - `044-dep-hustle-gcp-deployment.md`
   - `047-ref-devops-deployment-guide.md`
   - `064-ref-jeremy-devops-guide.md`
   - **Recommendation:** Merge into single canonical deployment guide

2. **DevOps Architecture:**
   - `017-ref-devops-system-analysis.md`
   - `018-ref-devops-guide.md`
   - `048-ref-devops-architecture.md`
   - `049-ref-devops-operations.md`
   - **Recommendation:** Consolidate into architecture + operations guides

3. **Query Optimization:**
   - `045-query-optimization-summary.md`
   - `045-query-performance-analysis.md`
   - `051-db-athlete-detail-query-optimization.md`
   - `073-ana-task-41-athletes-query-performance.md`
   - **Recommendation:** Create single performance optimization reference

4. **Task 41 Documentation (5 files):**
   - `073-ana-task-41-athletes-query-performance.md`
   - `074-chk-task-41-deployment.md`
   - `075-ref-task-41-migration-instructions.md`
   - `076-sum-task-41-optimization.md`
   - `077-ref-task-41-readme.md`
   - `078-ref-task-41-visual-summary.md`
   - **Recommendation:** Consolidate into single task documentation

5. **GitHub Actions Documentation:**
   - `045-sop-github-actions-deployment.md`
   - `046-note-github-actions-limitation.md`
   - **Recommendation:** Merge into single SOP

6. **DNS/Domain Documentation:**
   - `081-chk-domain-verification-steps.md`
   - `081-ref-hustlestats-domain-settings.md`
   - `082-chk-dns-records-update.md`
   - `082-ref-hustlestats-CORRECTED-dns-records.md`
   - `083-ref-www-subdomain-dns.md`
   - **Recommendation:** Create single domain management reference

### 2.3 Naming Inconsistencies

**Multiple Files with Same Sequence Number:**

Files sharing sequence numbers indicate rushed documentation or lack of coordination:

- `040-*` (2 files)
- `045-*` (4 files)
- `046-*` (3 files)
- `050-*` (2 files)
- `051-*` (5 files)
- `058-*` (3 files)
- `081-*` (2 files)
- `082-*` (2 files)

**Recommendation:** Re-sequence all files using strict sequential numbering.

---

## 3. Security Folder Audit

### 3.1 Current Security File Locations

| Location | File | Type | Sensitivity |
|----------|------|------|-------------|
| `.credentials/` | `hustle-monitoring-key.json` | GCP Service Account Key | 🔴 HIGH |

### 3.2 Security Concerns

1. **Non-Standard Location:** `.credentials/` is not a standard security directory
2. **No .gitignore Coverage:** Verify the file is properly excluded from version control
3. **No Centralized Security Management:** Security files should be in `/security/`

### 3.3 Recommendations

1. Create `/security/` directory
2. Move `hustle-monitoring-key.json` to `/security/credentials/`
3. Add comprehensive `/security/.gitignore`
4. Document security file management in `/security/README.md`

---

## 4. CI/CD Normalization Analysis

### 4.1 Current CI/CD Configuration

**GitHub Actions Workflows (.github/workflows/):**

| Workflow | Lines | Purpose | Status |
|----------|-------|---------|--------|
| `ci.yml` | 1614 bytes | Continuous Integration | ✅ Active |
| `deploy.yml` | 3515 bytes | Cloud Run Deployment | ✅ Active |
| `deploy-to-cloud-run.yml` | 3491 bytes | Cloud Run Deployment | ⚠️ Duplicate? |
| `pages.yml` | 1165 bytes | GitHub Pages | ✅ Active |
| `release.yml` | 6392 bytes | Release Management | ✅ Active |

### 4.2 Potential Duplication

**Deploy Workflows:**
- `deploy.yml` (3515 bytes)
- `deploy-to-cloud-run.yml` (3491 bytes)

**Analysis Required:**
- Determine if both are necessary
- Check for differences in deployment targets or strategies
- Consolidate to single authoritative deployment workflow if redundant

### 4.3 Recommendations

1. **Audit:** Compare `deploy.yml` vs `deploy-to-cloud-run.yml` line-by-line
2. **Consolidate:** Merge into single deployment workflow if redundant
3. **Document:** Create `/docs/NNN-RF-CICD-ci-cd-architecture.md` explaining workflow structure
4. **Archive:** Move deprecated workflow to `99-Archive/workflows/`

---

## 5. Directory Structure Analysis

### 5.1 Current Top-Level Structure

```
hustle/
├── .credentials/              ⚠️ Non-standard security location
├── .gcloud-config/            ℹ️ GCP configuration (local)
├── .git/                      ✅ Version control
├── .github/                   ✅ GitHub-specific files
│   ├── releases/              ⚠️ Release artifacts mixed with source
│   └── workflows/             ✅ CI/CD workflows
├── .vscode/                   ✅ Editor configuration
├── 001-claude-docs/           ⚠️ Non-standard docs location
├── 03-Tests/                  ✅ Test suites
├── 04-Assets/                 ✅ Assets and config backups
├── 05-Scripts/                ✅ Automation scripts
├── 06-Infrastructure/         ✅ Docker, K8s, Terraform
├── 07-Releases/               ⚠️ Duplicate release location?
├── 08-Survey/                 ℹ️ Survey app (subdomain?)
├── 99-Archive/                ✅ Archived code
├── prisma/                    ✅ Database schema
├── public/                    ✅ Public assets
├── src/                       ✅ Application source code
├── templates/                 ℹ️ Template files
├── tests/                     ⚠️ Duplicate test location?
└── [config files]             ✅ Root config files
```

### 5.2 Issues Identified

1. **No `/docs/` directory** - Documentation scattered across multiple locations
2. **No `/security/` directory** - Security files in non-standard location
3. **No `/adr/` directory** - ADRs mixed with other documentation
4. **Duplicate test locations** - `03-Tests/` and `tests/`
5. **Duplicate release locations** - `.github/releases/` and `07-Releases/`
6. **Non-descriptive naming** - `001-claude-docs/` unclear purpose

---

## 6. Canonical Repository Layout Proposal

### 6.1 Recommended Structure

```
hustle/
├── docs/                      # 📁 SINGLE flat documentation directory
│   ├── 001-PR-MVPV-hustle-mvp-v1.md
│   ├── 002-PR-MVPV-hustle-mvp-v2-lean.md
│   ├── 003-PL-SALE-sales-strategy.md
│   ├── [... all docs with v2.0 naming ...]
│   └── README.md              # Documentation index
├── adr/                       # 📁 Architecture Decision Records ONLY
│   ├── ADR-001-canonical-repo-layout.md
│   ├── ADR-002-doc-filing-standard.md
│   └── README.md
├── security/                  # 📁 Security files and credentials
│   ├── credentials/
│   │   └── hustle-monitoring-key.json
│   ├── .gitignore
│   └── README.md
├── reports/                   # 📁 Audit and analysis reports
│   ├── Scaffold-Audit.md
│   ├── Docs-Migration.md
│   └── README.md
├── 02-src/                    # Application source code
├── 03-tests/                  # All test suites (consolidated)
├── 04-ci/                     # CI/CD configuration (normalized)
├── 05-infrastructure/         # Docker, K8s, Terraform
├── 06-releases/               # Release artifacts (consolidated)
├── 99-legacy/                 # Archived/deprecated code
└── [standard config files]
```

### 6.2 Migration Strategy

**Phase 1: Documentation Consolidation**
1. Create `/docs/` directory
2. Migrate all markdown files from `001-claude-docs/` using v2.0 naming
3. Migrate root-level docs (except README.md, CLAUDE.md, CHANGELOG.md)
4. Migrate `.github/` documentation
5. Update all internal references

**Phase 2: Security Consolidation**
1. Create `/security/` directory structure
2. Move `.credentials/` contents to `/security/credentials/`
3. Add comprehensive `.gitignore`
4. Document security file management

**Phase 3: CI/CD Normalization**
1. Audit and compare deployment workflows
2. Consolidate redundant workflows
3. Move workflows to `/04-ci/` (optional) or keep in `.github/workflows/`
4. Document workflow architecture

**Phase 4: Directory Cleanup**
1. Remove empty `001-claude-docs/` directory
2. Consolidate test directories (`03-Tests/` ← `tests/`)
3. Consolidate release directories
4. Archive old `01-Docs/` git history

---

## 7. DOCUMENT-FILING-SYSTEM-STANDARD-v2.0 Compliance

### 7.1 Current Naming Pattern Analysis

**Existing Pattern (001-claude-docs/):**
```
NNN-abc-short-description.ext
```

**Examples:**
- ✅ `001-prd-hustle-mvp-v1.md` (compliant)
- ✅ `015-adr-nextauth-migration.md` (compliant)
- ⚠️ `051-db-athlete-detail-query-optimization.md` (missing category code)

### 7.2 Proposed v2.0 Pattern

```
NNN-CC-ABCD-short-description.ext
```

**Where:**
- `NNN` = Sequence number (001-999)
- `CC` = Category code (2 letters)
- `ABCD` = Subcategory code (4 letters)
- `short-description` = Kebab-case description
- `ext` = File extension

**Category Codes:**

| Code | Category | Subcategories |
|------|----------|---------------|
| `PR` | Product | `MVPV` (MVP), `FEAT` (Feature), `SPEC` (Specification) |
| `AD` | Architecture | `DCSN` (Decision), `DIAG` (Diagram), `ARCH` (Architecture) |
| `LG` | Logs | `DEPL` (Deployment), `INCR` (Infrastructure), `BILL` (Billing) |
| `RF` | Reference | `DEVP` (DevOps), `AUTH` (Authentication), `MIGR` (Migration) |
| `BG` | Bug | `ANAL` (Analysis), `ROOT` (Root Cause), `FIXD` (Fixed) |
| `FX` | Fix | `LAND` (Landing Page), `REGI` (Registration), `AUTH` (Auth) |
| `AA` | After Action | `REVI` (Review), `POST` (Postmortem) |
| `SC` | Security | `MIGR` (Migration), `REVI` (Review), `ACTI` (Action) |
| `SM` | Summary | `PROJ` (Project), `TASK` (Task), `EXEC` (Executive) |
| `RV` | Review | `CODE` (Code), `TASK` (Task), `SECU` (Security) |
| `CK` | Check | `DEPL` (Deployment), `DOMA` (Domain), `DNSR` (DNS) |
| `AN` | Analysis | `PERF` (Performance), `USER` (User Journey) |
| `SO` | SOP | `DEPL` (Deployment), `SETP` (Setup), `PROC` (Process) |
| `PL` | Plan | `SALE` (Sales), `ROAD` (Roadmap), `ACTI` (Action) |
| `SV` | Service | `SURV` (Survey), `CUST` (Customer) |
| `PO` | Policy | `CONT` (Contribution), `CODE` (Code of Conduct) |
| `DP` | Deployment | `GCPR` (GCP Run), `K8S-` (Kubernetes) |
| `DS` | Design | `UX--` (User Experience), `UI--` (User Interface) |
| `VR` | Verification | `TEST` (Testing), `MONI` (Monitoring) |
| `ST` | Status | `PROJ` (Project), `PHAS` (Phase) |
| `TS` | Task | `TYPE` (TypeScript), `PERF` (Performance) |

### 7.3 Regex Validation Pattern

```regex
^[0-9]{3}-[A-Z]{2}-[A-Z]{4}-[a-z0-9]+(-[a-z0-9]+)*\.(md|sql|tsx|yml|prisma|patch|json)$
```

**Examples:**
- ✅ `001-PR-MVPV-hustle-mvp-v1.md`
- ✅ `015-AD-DCSN-nextauth-migration.md`
- ✅ `051-RF-PERF-athlete-detail-query-optimization.md`
- ❌ `001-prd-hustle-mvp-v1.md` (missing category code)
- ❌ `015-adr-migration.md` (wrong format)

---

## 8. Findings Summary

### 8.1 Critical Issues

1. **Documentation Fragmentation:** 119 files across 5+ locations
2. **Security File Placement:** Credentials in non-standard location
3. **CI/CD Duplication:** Potential redundant deployment workflows
4. **Naming Inconsistencies:** Multiple files sharing sequence numbers

### 8.2 Recommendations Priority

**HIGH PRIORITY:**
1. ✅ Migrate all docs to flat `/docs/` structure
2. ✅ Adopt DOCUMENT-FILING-SYSTEM-STANDARD-v2.0 naming
3. ✅ Consolidate security files to `/security/`
4. ✅ Create ADRs documenting decisions

**MEDIUM PRIORITY:**
1. Normalize CI/CD workflows
2. Merge overlapping documentation
3. Re-sequence duplicate file numbers
4. Update internal references

**LOW PRIORITY:**
1. Archive `01-Docs/` git history
2. Consolidate test directories
3. Consolidate release directories

---

## 9. Next Steps

### 9.1 Immediate Actions

1. **Create Migration Plan** (`reports/Docs-Migration.md`)
   - Map each file from old location → new `/docs/` filename
   - Apply v2.0 naming standard
   - Identify merge candidates

2. **Create ADRs**
   - `adr/ADR-001-canonical-repo-layout.md`
   - `adr/ADR-002-doc-filing-standard.md`

3. **Execute Migration**
   - Create `/docs/`, `/security/`, `/adr/`, `/reports/` directories
   - Copy files with new names
   - Update references
   - Test documentation links

4. **Validate**
   - Run regex validation on all `/docs/` filenames
   - Verify no broken links
   - Confirm security files properly gitignored

### 9.2 Pull Request Strategy

**PR 1: Scaffold Audit and Planning**
- `reports/Scaffold-Audit.md` (this file)
- `reports/Docs-Migration.md`
- `adr/ADR-001-canonical-repo-layout.md`
- `adr/ADR-002-doc-filing-standard.md`

**PR 2: Documentation Migration**
- Create `/docs/` with all migrated files
- Update internal references
- Add `/docs/README.md` index

**PR 3: Security Consolidation**
- Create `/security/` structure
- Move credentials
- Add security documentation

**PR 4: CI/CD Normalization**
- Audit workflows
- Consolidate if needed
- Document architecture

**PR 5: Cleanup**
- Remove old directories
- Update CLAUDE.md
- Update README.md

---

## 10. Appendices

### Appendix A: File Count by Document Type

```
Reference (REF): 35+
Logs (LOG): 11
Summaries (SUM): 8
Checks (CHK): 4
Fixes (FIX): 3
Plans (PLN): 3
Architecture Decision Records (ADR): 3
Bug Reports (BUG): 3
Standard Operating Procedures (SOP): 3
Product Requirements (PRD): 2
After Action Reports (AAR): 2
Security (SEC): 2
Reviews (REV): 2
Analysis (ANA): 2
Services (SRV): 1
Policies (POL): 1
Deployments (DEP): 1
Design (DES): 1
Verification (VER): 1
Status (STA): 1
```

### Appendix B: Sequence Number Collisions

Files sharing the same sequence number:

- **040:** 2 files
- **045:** 4 files
- **046:** 3 files
- **050:** 2 files
- **051:** 5 files
- **058:** 3 files
- **081:** 2 files
- **082:** 2 files

**Total Collisions:** 24 files affected

---

**Report Status:** ✅ Complete
**Next Document:** `reports/Docs-Migration.md`
**Estimated Migration Time:** 4-6 hours
**Risk Level:** Low (no data loss, reversible via git)
