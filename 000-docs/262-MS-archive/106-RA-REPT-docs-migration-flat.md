# FINAL Documentation Migration Plan - SINGLE FLAT /docs/

**Project:** Hustle
**Date:** 2025-10-17
**Standard:** DOCUMENT-FILING-SYSTEM-STANDARD-v2.0
**Structure:** **SINGLE FLAT /docs/ DIRECTORY** (no subdirectories, no nested folders)

---

## Key Principle: FLAT IS EVERYTHING

The v2.0 naming convention **ELIMINATES THE NEED FOR SUBDIRECTORIES**.

**Wrong (Nested):**
```
docs/
├── product/
│   └── requirements/
│       └── mvp-v1.md
├── architecture/
│   └── decisions/
│       └── nextauth.md
└── operations/
    └── deployment/
        └── gcp.md
```

**Correct (FLAT):**
```
docs/
├── 001-PP-PROD-hustle-mvp-v1.md
├── 015-AT-ADEC-nextauth-migration.md
├── 041-OD-DEPL-hustle-gcp-deployment.md
└── [all files directly here, no subdirectories]
```

**Category codes provide organization:**
- `ls docs/*-PP-*` = All Product & Planning docs
- `ls docs/*-AT-ADEC-*` = All Architecture Decision Records
- `ls docs/*-OD-DEPL-*` = All Deployment docs

---

## Final Repository Structure

```
hustle/
├── docs/                           # SINGLE FLAT DIRECTORY (102 files)
│   ├── 001-PP-PROD-hustle-mvp-v1.md
│   ├── 002-PP-PROD-hustle-mvp-v2-lean.md
│   ├── 003-PP-PLAN-sales-strategy.md
│   ├── ...
│   ├── 015-AT-ADEC-nextauth-migration.md        # ADR (NOT in separate /adr/)
│   ├── 034-AT-ADEC-system-architecture.md       # ADR (NOT in separate /adr/)
│   ├── ...
│   ├── 097-RA-REPT-final-survey-remediation.md  # Survey (NOT in subfolder)
│   ├── 098-RA-RCAS-survey-issue-root-cause.md   # Survey (NOT in subfolder)
│   ├── ...
│   ├── 100-OD-RELS-release-notes-v00-00-01.md   # Release (NOT in .github/)
│   ├── 101-OD-CHNG-changelog-v00-00-01.md       # Changelog (NOT in .github/)
│   └── 102-OD-RELS-release-notes-detailed.md    # Release (NOT in .github/)
├── security/                       # Security credentials (NOT documentation)
│   ├── credentials/
│   │   └── hustle-monitoring-key.json
│   └── .gitignore
├── src/                            # Source code
├── 03-Tests/                       # Tests
├── 06-Infrastructure/              # Infrastructure
├── README.md                       # Stays in root
├── CLAUDE.md                       # Stays in root
└── CHANGELOG.md                    # Stays in root
```

**Total in /docs/:** 102 markdown + code files (all flat, zero subdirectories)

---

## Complete Migration Mapping (All 102 Files)

| # | Source | Destination (FLAT /docs/) | Category | Type |
|---|--------|---------------------------|----------|------|
| 001 | `001-claude-docs/001-prd-hustle-mvp-v1.md` | `docs/001-PP-PROD-hustle-mvp-v1.md` | PP | Product Requirements |
| 002 | `001-claude-docs/002-prd-hustle-mvp-v2-lean.md` | `docs/002-PP-PROD-hustle-mvp-v2-lean.md` | PP | Product Requirements |
| 003 | `001-claude-docs/003-pln-sales-strategy.md` | `docs/003-PP-PLAN-sales-strategy.md` | PP | Plan |
| 004 | `001-claude-docs/004-log-infrastructure-setup.md` | `docs/004-LS-LOGS-infrastructure-setup.md` | LS | Status Log |
| 005 | `001-claude-docs/005-log-infrastructure-complete.md` | `docs/005-LS-LOGS-infrastructure-complete.md` | LS | Status Log |
| 006 | `001-claude-docs/006-log-billing-quota-fix.md` | `docs/006-LS-LOGS-billing-quota-fix.md` | LS | Status Log |
| 007 | `001-claude-docs/007-log-initial-setup-status.md` | `docs/007-LS-STAT-initial-setup-status.md` | LS | Status Report |
| 008 | `001-claude-docs/008-log-pre-deployment-status.md` | `docs/008-LS-STAT-pre-deployment-status.md` | LS | Status Report |
| 009 | `001-claude-docs/009-log-nextjs-init.md` | `docs/009-LS-LOGS-nextjs-init.md` | LS | Status Log |
| 010 | `001-claude-docs/010-log-cloud-run-deployment.md` | `docs/010-OD-DEPL-cloud-run-deployment.md` | OD | Deployment |
| 011 | `001-claude-docs/011-log-gate-a-milestone.md` | `docs/011-LS-CHKP-gate-a-milestone.md` | LS | Checkpoint |
| 012 | `001-claude-docs/012-log-game-logging-verification.md` | `docs/012-TQ-TEST-game-logging-verification.md` | TQ | Test |
| 013 | `001-claude-docs/013-ref-claudes-docs-archive.md` | `docs/013-DR-REFF-claudes-docs-archive.md` | DR | Reference |
| 014 | `001-claude-docs/014-ref-deployment-index.md` | `docs/014-DR-REFF-deployment-index.md` | DR | Reference |
| 015 | `001-claude-docs/015-adr-nextauth-migration.md` | `docs/015-AT-ADEC-nextauth-migration.md` | AT | **ADR (FLAT)** |
| 016 | `001-claude-docs/016-ref-dashboard-template-diagram.md` | `docs/016-AT-DIAG-dashboard-template-diagram.md` | AT | Diagram |
| 017 | `001-claude-docs/017-ref-devops-system-analysis.md` | `docs/017-RA-ANLY-devops-system-analysis.md` | RA | Analysis |
| 018 | `001-claude-docs/018-ref-devops-guide.md` | `docs/018-DR-GUID-devops-guide.md` | DR | Guide |
| 019 | `001-claude-docs/019-ref-app-readme.md` | `docs/019-DR-REFF-app-readme.md` | DR | Reference |
| 020 | `001-claude-docs/020-ref-directory-standards.md` | `docs/020-DR-REFF-directory-standards.md` | DR | Reference |
| 021 | `001-claude-docs/021-bug-auth-404-analysis.md` | `docs/021-TQ-BUGR-auth-404-analysis.md` | TQ | Bug Report |
| 022 | `001-claude-docs/022-fix-landing-page-links.md` | `docs/022-DC-CODE-landing-page-links-fix.md` | DC | Code |
| 023 | `001-claude-docs/023-fix-registration-api.md` | `docs/023-DC-CODE-registration-api-fix.md` | DC | Code |
| 024 | `001-claude-docs/024-aar-auth-404-fix.md` | `docs/024-AA-AACR-auth-404-fix.md` | AA | After Action |
| 025 | `001-claude-docs/025-test-verification-guide.md` | `docs/025-TQ-TEST-verification-guide.md` | TQ | Test |
| 026 | `001-claude-docs/026-fix-add-athlete-flow.md` | `docs/026-DC-CODE-add-athlete-flow-fix.md` | DC | Code |
| 027 | `001-claude-docs/027-sec-nextauth-migration-complete.md` | `docs/027-TQ-SECU-nextauth-migration-complete.md` | TQ | Security |
| 028 | `001-claude-docs/028-aar-complete-nextauth-security-fix.md` | `docs/028-AA-AACR-nextauth-security-fix.md` | AA | After Action |
| 029 | `001-claude-docs/029-srv-parent-survey.md` | `docs/029-UC-SURV-parent-survey.md` | UC | Survey |
| 030 | `001-claude-docs/030-bug-auth-404-root-cause.md` | `docs/030-TQ-BUGR-auth-404-root-cause.md` | TQ | Bug Report |
| 031 | `001-claude-docs/031-bug-auth-404-fix-details.md` | `docs/031-TQ-BUGR-auth-404-fix-details.md` | TQ | Bug Report |
| 032 | `001-claude-docs/032-bug-landing-page-fix.patch` | `docs/032-TQ-BUGR-landing-page-fix.patch` | TQ | Bug Report |
| 033 | `001-claude-docs/037-pln-product-roadmap.md` | `docs/033-PP-RMAP-product-roadmap.md` | PP | Roadmap |
| 034 | `001-claude-docs/038-adr-system-architecture.md` | `docs/034-AT-ADEC-system-architecture.md` | AT | **ADR (FLAT)** |
| 035 | `001-claude-docs/039-pol-contribution-guide.md` | `docs/035-BL-POLI-contribution-guide.md` | BL | Policy |
| 036 | `001-claude-docs/040-athletes-list-typescript-improvements.md` | `docs/036-DC-DEVN-athletes-list-typescript.md` | DC | Development |
| 037 | `001-claude-docs/040-ref-version-management.md` | `docs/037-DR-REFF-version-management.md` | DR | Reference |
| 038 | `001-claude-docs/041-sop-release-process.md` | `docs/038-DR-SOPS-release-process.md` | DR | SOP |
| 039 | `001-claude-docs/042-ref-github-pages-index.md` | `docs/039-DR-REFF-github-pages-index.md` | DR | Reference |
| 040 | `001-claude-docs/043-ref-jekyll-config.yml` | `docs/040-OD-CONF-jekyll-config.yml` | OD | Configuration |
| 041 | `001-claude-docs/044-dep-hustle-gcp-deployment.md` | `docs/041-OD-DEPL-hustle-gcp-deployment.md` | OD | Deployment |
| 042 | `001-claude-docs/045-query-optimization-summary.md` | `docs/042-RA-ANLY-query-optimization-summary.md` | RA | Analysis |
| 043 | `001-claude-docs/045-query-performance-analysis.md` | `docs/043-RA-ANLY-query-performance-analysis.md` | RA | Analysis |
| 044 | `001-claude-docs/045-ref-authentication-system.md` | `docs/044-DR-REFF-authentication-system.md` | DR | Reference |
| 045 | `001-claude-docs/045-sop-github-actions-deployment.md` | `docs/045-DR-SOPS-github-actions-deployment.md` | DR | SOP |
| 046 | `001-claude-docs/046-note-github-actions-limitation.md` | `docs/046-MS-MISC-github-actions-limitation.md` | MS | Miscellaneous |
| 047 | `001-claude-docs/046-optimization-playbook.md` | `docs/047-DR-GUID-optimization-playbook.md` | DR | Guide |
| 048 | `001-claude-docs/046-sop-resend-setup.md` | `docs/048-DR-SOPS-resend-setup.md` | DR | SOP |
| 049 | `001-claude-docs/047-ref-devops-deployment-guide.md` | `docs/049-DR-GUID-devops-deployment-guide.md` | DR | Guide |
| 050 | `001-claude-docs/048-ref-devops-architecture.md` | `docs/050-AT-ARCH-devops-architecture.md` | AT | Architecture |
| 051 | `001-claude-docs/049-ref-devops-operations.md` | `docs/051-DR-REFF-devops-operations.md` | DR | Reference |
| 052 | `001-claude-docs/050-ref-architecture-competitive-advantage.md` | `docs/052-AT-ARCH-competitive-advantage.md` | AT | Architecture |
| 053 | `001-claude-docs/050-task-typescript-type-safety-report.md` | `docs/053-PM-TASK-typescript-type-safety.md` | PM | Task |
| 054 | `001-claude-docs/051-ana-user-journey-current-state.md` | `docs/054-RA-ANLY-user-journey-current-state.md` | RA | Analysis |
| 055 | `001-claude-docs/051-db-athlete-detail-query-optimization.md` | `docs/055-RA-ANLY-athlete-query-optimization.md` | RA | Analysis |
| 056 | `001-claude-docs/051-migration-composite-index.sql` | `docs/056-DD-SQLS-migration-composite-index.sql` | DD | SQL |
| 057 | `001-claude-docs/051-optimized-query-example.tsx` | `docs/057-DC-CODE-optimized-query-example.tsx` | DC | Code |
| 058 | `001-claude-docs/051-schema-update-recommendation.prisma` | `docs/058-DD-SQLS-schema-update.prisma` | DD | SQL Schema |
| 059 | `001-claude-docs/051-task-summary.md` | `docs/059-PM-TASK-task-summary.md` | PM | Task |
| 060 | `001-claude-docs/051-visual-performance-comparison.md` | `docs/060-RA-ANLY-performance-visual.md` | RA | Analysis |
| 061 | `001-claude-docs/052-cto-agent-orchestration-plan.md` | `docs/061-PP-PLAN-agent-orchestration.md` | PP | Plan |
| 062 | `001-claude-docs/053-des-athletes-list-dashboard-ux.md` | `docs/062-AT-DSGN-athletes-dashboard-ux.md` | AT | Design |
| 063 | `001-claude-docs/054-ref-error-tracking-setup.md` | `docs/063-DR-REFF-error-tracking-setup.md` | DR | Reference |
| 064 | `001-claude-docs/055-sum-phase-9-monitoring-complete.md` | `docs/064-MC-SUMM-phase-9-monitoring.md` | MC | Summary |
| 065 | `001-claude-docs/056-ver-gcloud-monitoring-activated.md` | `docs/065-TQ-TEST-gcloud-monitoring-verified.md` | TQ | Test |
| 066 | `001-claude-docs/057-sta-phase-9-complete-status.md` | `docs/066-LS-STAT-phase-9-complete.md` | LS | Status |
| 067 | `001-claude-docs/058-action-items-summary.md` | `docs/067-MC-ACTN-action-items-summary.md` | MC | Action Items |
| 068 | `001-claude-docs/058-exact-code-fixes.md` | `docs/068-DC-CODE-exact-code-fixes.md` | DC | Code |
| 069 | `001-claude-docs/058-final-review-game-logging-form.md` | `docs/069-RA-REVW-game-logging-form.md` | RA | Review |
| 070 | `001-claude-docs/059-ref-athlete-detail-implementation-notes.md` | `docs/070-DC-DEVN-athlete-detail-notes.md` | DC | Development |
| 071 | `001-claude-docs/060-sum-build-completion.md` | `docs/071-MC-SUMM-build-completion.md` | MC | Summary |
| 072 | `001-claude-docs/061-rev-task-52-athlete-detail.md` | `docs/072-RA-REVW-task-52-athlete-detail.md` | RA | Review |
| 073 | `001-claude-docs/062-chk-deployment.md` | `docs/073-TQ-TEST-deployment-check.md` | TQ | Test |
| 074 | `001-claude-docs/063-ref-game-logging-form-implementation.md` | `docs/074-DC-DEVN-game-logging-implementation.md` | DC | Development |
| 075 | `001-claude-docs/064-ref-jeremy-devops-guide.md` | `docs/075-DR-GUID-jeremy-devops-guide.md` | DR | Guide |
| 076 | `001-claude-docs/065-ref-migration-guide.md` | `docs/076-DR-GUID-migration-guide.md` | DR | Guide |
| 077 | `001-claude-docs/066-sum-mvp-completion-2025-10-09.md` | `docs/077-MC-SUMM-mvp-completion-oct-9.md` | MC | Summary |
| 078 | `001-claude-docs/067-sum-mvp-status-2025-10-16.md` | `docs/078-LS-STAT-mvp-status-oct-16.md` | LS | Status |
| 079 | `001-claude-docs/068-sum-phase-6b-security-defensive-stats.md` | `docs/079-MC-SUMM-phase-6b-security.md` | MC | Summary |
| 080 | `001-claude-docs/069-ref-query-execution-flow.md` | `docs/080-DR-REFF-query-execution-flow.md` | DR | Reference |
| 081 | `001-claude-docs/070-pln-security-fixes-action-2025-10-09.md` | `docs/081-PP-PLAN-security-fixes-oct-9.md` | PP | Plan |
| 082 | `001-claude-docs/071-sum-security-review-executive-2025-10-09.md` | `docs/082-MC-SUMM-security-review-oct-9.md` | MC | Summary |
| 083 | `001-claude-docs/072-rev-security-game-logging-2025-10-09.md` | `docs/083-RA-REVW-security-game-logging.md` | RA | Review |
| 084 | `001-claude-docs/073-ana-task-41-athletes-query-performance.md` | `docs/084-RA-ANLY-task-41-query-perf.md` | RA | Analysis |
| 085 | `001-claude-docs/074-chk-task-41-deployment.md` | `docs/085-TQ-TEST-task-41-deployment.md` | TQ | Test |
| 086 | `001-claude-docs/075-ref-task-41-migration-instructions.md` | `docs/086-DR-GUID-task-41-migration.md` | DR | Guide |
| 087 | `001-claude-docs/076-sum-task-41-optimization.md` | `docs/087-MC-SUMM-task-41-optimization.md` | MC | Summary |
| 088 | `001-claude-docs/077-ref-task-41-readme.md` | `docs/088-DR-REFF-task-41-readme.md` | DR | Reference |
| 089 | `001-claude-docs/078-ref-task-41-visual-summary.md` | `docs/089-DR-REFF-task-41-visual-summary.md` | DR | Reference |
| 090 | `001-claude-docs/079-ref-task-44-dashboard-real-data.md` | `docs/090-DR-REFF-task-44-dashboard-data.md` | DR | Reference |
| 091 | `001-claude-docs/080-ref-user-journey-guide.md` | `docs/091-DR-GUID-user-journey-guide.md` | DR | Guide |
| 092 | `001-claude-docs/081-chk-domain-verification-steps.md` | `docs/092-OD-OPNS-domain-verification.md` | OD | Operations |
| 093 | `001-claude-docs/081-ref-hustlestats-domain-settings.md` | `docs/093-OD-CONF-hustlestats-domain.md` | OD | Configuration |
| 094 | `001-claude-docs/082-chk-dns-records-update.md` | `docs/094-OD-OPNS-dns-records-update.md` | OD | Operations |
| 095 | `001-claude-docs/082-ref-hustlestats-CORRECTED-dns-records.md` | `docs/095-OD-CONF-dns-records-corrected.md` | OD | Configuration |
| 096 | `001-claude-docs/083-ref-www-subdomain-dns.md` | `docs/096-OD-CONF-www-subdomain-dns.md` | OD | Configuration |
| 097 | `001-claude-docs/survey-remediation/FINAL-SURVEY-REMEDIATION-REPORT.md` | `docs/097-RA-REPT-survey-remediation.md` | RA | **Report (FLATTENED)** |
| 098 | `001-claude-docs/survey-remediation/issue-001-root-cause-analysis.md` | `docs/098-RA-RCAS-survey-issue-root-cause.md` | RA | **Root Cause (FLATTENED)** |
| 099 | `.directory-standards.md` | `docs/099-DR-REFF-directory-standards-legacy.md` | DR | Reference |
| 100 | `.github/RELEASE_NOTES_v00.00.01.md` | `docs/100-OD-RELS-release-notes-v00-00-01.md` | OD | **Release (FLATTENED)** |
| 101 | `.github/releases/v00.00.01/changelog.md` | `docs/101-OD-CHNG-changelog-v00-00-01.md` | OD | **Changelog (FLATTENED)** |
| 102 | `.github/releases/v00.00.01/release-notes.md` | `docs/102-OD-RELS-release-notes-detailed.md` | OD | **Release (FLATTENED)** |

---

## Files That Stay in Root (NOT migrated)

| File | Location | Reason |
|------|----------|--------|
| `README.md` | Root | GitHub convention |
| `CLAUDE.md` | Root | AI assistant instructions |
| `CHANGELOG.md` | Root | Keep a Changelog standard |
| `AGENTS.md` | Root | Project-specific |
| `PATCH_NOTES.md` | Root | Project-specific |
| `.github/PULL_REQUEST_TEMPLATE.md` | `.github/` | GitHub convention |

---

## Security Files (NOT documentation)

| File | Destination |
|------|-------------|
| `.credentials/hustle-monitoring-key.json` | `security/credentials/hustle-monitoring-key.json` |

---

## Migration Bash Script (FLAT STRUCTURE)

```bash
#!/bin/bash
# migrate-docs-FLAT.sh
# SINGLE FLAT /docs/ directory - NO subdirectories

set -e

echo "========================================"
echo "FLAT /docs/ Migration"
echo "DOCUMENT-FILING-SYSTEM-STANDARD-v2.0"
echo "========================================"
echo ""

# Create FLAT directories (no subdirectories in docs!)
mkdir -p docs
mkdir -p security/credentials
mkdir -p reports

echo "✅ Created flat directory structure"

# Migrate ALL files to FLAT /docs/ (no subdirectories)
echo "📁 Migrating 102 files to flat /docs/..."

cp "001-claude-docs/001-prd-hustle-mvp-v1.md" "docs/001-PP-PROD-hustle-mvp-v1.md"
cp "001-claude-docs/002-prd-hustle-mvp-v2-lean.md" "docs/002-PP-PROD-hustle-mvp-v2-lean.md"
cp "001-claude-docs/003-pln-sales-strategy.md" "docs/003-PP-PLAN-sales-strategy.md"
cp "001-claude-docs/004-log-infrastructure-setup.md" "docs/004-LS-LOGS-infrastructure-setup.md"
cp "001-claude-docs/005-log-infrastructure-complete.md" "docs/005-LS-LOGS-infrastructure-complete.md"
cp "001-claude-docs/006-log-billing-quota-fix.md" "docs/006-LS-LOGS-billing-quota-fix.md"
cp "001-claude-docs/007-log-initial-setup-status.md" "docs/007-LS-STAT-initial-setup-status.md"
cp "001-claude-docs/008-log-pre-deployment-status.md" "docs/008-LS-STAT-pre-deployment-status.md"
cp "001-claude-docs/009-log-nextjs-init.md" "docs/009-LS-LOGS-nextjs-init.md"
cp "001-claude-docs/010-log-cloud-run-deployment.md" "docs/010-OD-DEPL-cloud-run-deployment.md"
cp "001-claude-docs/011-log-gate-a-milestone.md" "docs/011-LS-CHKP-gate-a-milestone.md"
cp "001-claude-docs/012-log-game-logging-verification.md" "docs/012-TQ-TEST-game-logging-verification.md"
cp "001-claude-docs/013-ref-claudes-docs-archive.md" "docs/013-DR-REFF-claudes-docs-archive.md"
cp "001-claude-docs/014-ref-deployment-index.md" "docs/014-DR-REFF-deployment-index.md"

# ADRs go in FLAT /docs/ as AT-ADEC (NOT separate /adr/ directory)
cp "001-claude-docs/015-adr-nextauth-migration.md" "docs/015-AT-ADEC-nextauth-migration.md"

cp "001-claude-docs/016-ref-dashboard-template-diagram.md" "docs/016-AT-DIAG-dashboard-template-diagram.md"
cp "001-claude-docs/017-ref-devops-system-analysis.md" "docs/017-RA-ANLY-devops-system-analysis.md"
cp "001-claude-docs/018-ref-devops-guide.md" "docs/018-DR-GUID-devops-guide.md"
cp "001-claude-docs/019-ref-app-readme.md" "docs/019-DR-REFF-app-readme.md"
cp "001-claude-docs/020-ref-directory-standards.md" "docs/020-DR-REFF-directory-standards.md"
cp "001-claude-docs/021-bug-auth-404-analysis.md" "docs/021-TQ-BUGR-auth-404-analysis.md"
cp "001-claude-docs/022-fix-landing-page-links.md" "docs/022-DC-CODE-landing-page-links-fix.md"
cp "001-claude-docs/023-fix-registration-api.md" "docs/023-DC-CODE-registration-api-fix.md"
cp "001-claude-docs/024-aar-auth-404-fix.md" "docs/024-AA-AACR-auth-404-fix.md"
cp "001-claude-docs/025-test-verification-guide.md" "docs/025-TQ-TEST-verification-guide.md"
cp "001-claude-docs/026-fix-add-athlete-flow.md" "docs/026-DC-CODE-add-athlete-flow-fix.md"
cp "001-claude-docs/027-sec-nextauth-migration-complete.md" "docs/027-TQ-SECU-nextauth-migration-complete.md"
cp "001-claude-docs/028-aar-complete-nextauth-security-fix.md" "docs/028-AA-AACR-nextauth-security-fix.md"
cp "001-claude-docs/029-srv-parent-survey.md" "docs/029-UC-SURV-parent-survey.md"
cp "001-claude-docs/030-bug-auth-404-root-cause.md" "docs/030-TQ-BUGR-auth-404-root-cause.md"
cp "001-claude-docs/031-bug-auth-404-fix-details.md" "docs/031-TQ-BUGR-auth-404-fix-details.md"
cp "001-claude-docs/032-bug-landing-page-fix.patch" "docs/032-TQ-BUGR-landing-page-fix.patch"
cp "001-claude-docs/037-pln-product-roadmap.md" "docs/033-PP-RMAP-product-roadmap.md"

# ADR goes in FLAT /docs/ (NOT separate /adr/)
cp "001-claude-docs/038-adr-system-architecture.md" "docs/034-AT-ADEC-system-architecture.md"

cp "001-claude-docs/039-pol-contribution-guide.md" "docs/035-BL-POLI-contribution-guide.md"
cp "001-claude-docs/040-athletes-list-typescript-improvements.md" "docs/036-DC-DEVN-athletes-list-typescript.md"
cp "001-claude-docs/040-ref-version-management.md" "docs/037-DR-REFF-version-management.md"
cp "001-claude-docs/041-sop-release-process.md" "docs/038-DR-SOPS-release-process.md"
cp "001-claude-docs/042-ref-github-pages-index.md" "docs/039-DR-REFF-github-pages-index.md"
cp "001-claude-docs/043-ref-jekyll-config.yml" "docs/040-OD-CONF-jekyll-config.yml"
cp "001-claude-docs/044-dep-hustle-gcp-deployment.md" "docs/041-OD-DEPL-hustle-gcp-deployment.md"
cp "001-claude-docs/045-query-optimization-summary.md" "docs/042-RA-ANLY-query-optimization-summary.md"
cp "001-claude-docs/045-query-performance-analysis.md" "docs/043-RA-ANLY-query-performance-analysis.md"
cp "001-claude-docs/045-ref-authentication-system.md" "docs/044-DR-REFF-authentication-system.md"
cp "001-claude-docs/045-sop-github-actions-deployment.md" "docs/045-DR-SOPS-github-actions-deployment.md"
cp "001-claude-docs/046-note-github-actions-limitation.md" "docs/046-MS-MISC-github-actions-limitation.md"
cp "001-claude-docs/046-optimization-playbook.md" "docs/047-DR-GUID-optimization-playbook.md"
cp "001-claude-docs/046-sop-resend-setup.md" "docs/048-DR-SOPS-resend-setup.md"
cp "001-claude-docs/047-ref-devops-deployment-guide.md" "docs/049-DR-GUID-devops-deployment-guide.md"
cp "001-claude-docs/048-ref-devops-architecture.md" "docs/050-AT-ARCH-devops-architecture.md"
cp "001-claude-docs/049-ref-devops-operations.md" "docs/051-DR-REFF-devops-operations.md"
cp "001-claude-docs/050-ref-architecture-competitive-advantage.md" "docs/052-AT-ARCH-competitive-advantage.md"
cp "001-claude-docs/050-task-typescript-type-safety-report.md" "docs/053-PM-TASK-typescript-type-safety.md"
cp "001-claude-docs/051-ana-user-journey-current-state.md" "docs/054-RA-ANLY-user-journey-current-state.md"
cp "001-claude-docs/051-db-athlete-detail-query-optimization.md" "docs/055-RA-ANLY-athlete-query-optimization.md"
cp "001-claude-docs/051-migration-composite-index.sql" "docs/056-DD-SQLS-migration-composite-index.sql"
cp "001-claude-docs/051-optimized-query-example.tsx" "docs/057-DC-CODE-optimized-query-example.tsx"
cp "001-claude-docs/051-schema-update-recommendation.prisma" "docs/058-DD-SQLS-schema-update.prisma"
cp "001-claude-docs/051-task-summary.md" "docs/059-PM-TASK-task-summary.md"
cp "001-claude-docs/051-visual-performance-comparison.md" "docs/060-RA-ANLY-performance-visual.md"
cp "001-claude-docs/052-cto-agent-orchestration-plan.md" "docs/061-PP-PLAN-agent-orchestration.md"
cp "001-claude-docs/053-des-athletes-list-dashboard-ux.md" "docs/062-AT-DSGN-athletes-dashboard-ux.md"
cp "001-claude-docs/054-ref-error-tracking-setup.md" "docs/063-DR-REFF-error-tracking-setup.md"
cp "001-claude-docs/055-sum-phase-9-monitoring-complete.md" "docs/064-MC-SUMM-phase-9-monitoring.md"
cp "001-claude-docs/056-ver-gcloud-monitoring-activated.md" "docs/065-TQ-TEST-gcloud-monitoring-verified.md"
cp "001-claude-docs/057-sta-phase-9-complete-status.md" "docs/066-LS-STAT-phase-9-complete.md"
cp "001-claude-docs/058-action-items-summary.md" "docs/067-MC-ACTN-action-items-summary.md"
cp "001-claude-docs/058-exact-code-fixes.md" "docs/068-DC-CODE-exact-code-fixes.md"
cp "001-claude-docs/058-final-review-game-logging-form.md" "docs/069-RA-REVW-game-logging-form.md"
cp "001-claude-docs/059-ref-athlete-detail-implementation-notes.md" "docs/070-DC-DEVN-athlete-detail-notes.md"
cp "001-claude-docs/060-sum-build-completion.md" "docs/071-MC-SUMM-build-completion.md"
cp "001-claude-docs/061-rev-task-52-athlete-detail.md" "docs/072-RA-REVW-task-52-athlete-detail.md"
cp "001-claude-docs/062-chk-deployment.md" "docs/073-TQ-TEST-deployment-check.md"
cp "001-claude-docs/063-ref-game-logging-form-implementation.md" "docs/074-DC-DEVN-game-logging-implementation.md"
cp "001-claude-docs/064-ref-jeremy-devops-guide.md" "docs/075-DR-GUID-jeremy-devops-guide.md"
cp "001-claude-docs/065-ref-migration-guide.md" "docs/076-DR-GUID-migration-guide.md"
cp "001-claude-docs/066-sum-mvp-completion-2025-10-09.md" "docs/077-MC-SUMM-mvp-completion-oct-9.md"
cp "001-claude-docs/067-sum-mvp-status-2025-10-16.md" "docs/078-LS-STAT-mvp-status-oct-16.md"
cp "001-claude-docs/068-sum-phase-6b-security-defensive-stats.md" "docs/079-MC-SUMM-phase-6b-security.md"
cp "001-claude-docs/069-ref-query-execution-flow.md" "docs/080-DR-REFF-query-execution-flow.md"
cp "001-claude-docs/070-pln-security-fixes-action-2025-10-09.md" "docs/081-PP-PLAN-security-fixes-oct-9.md"
cp "001-claude-docs/071-sum-security-review-executive-2025-10-09.md" "docs/082-MC-SUMM-security-review-oct-9.md"
cp "001-claude-docs/072-rev-security-game-logging-2025-10-09.md" "docs/083-RA-REVW-security-game-logging.md"
cp "001-claude-docs/073-ana-task-41-athletes-query-performance.md" "docs/084-RA-ANLY-task-41-query-perf.md"
cp "001-claude-docs/074-chk-task-41-deployment.md" "docs/085-TQ-TEST-task-41-deployment.md"
cp "001-claude-docs/075-ref-task-41-migration-instructions.md" "docs/086-DR-GUID-task-41-migration.md"
cp "001-claude-docs/076-sum-task-41-optimization.md" "docs/087-MC-SUMM-task-41-optimization.md"
cp "001-claude-docs/077-ref-task-41-readme.md" "docs/088-DR-REFF-task-41-readme.md"
cp "001-claude-docs/078-ref-task-41-visual-summary.md" "docs/089-DR-REFF-task-41-visual-summary.md"
cp "001-claude-docs/079-ref-task-44-dashboard-real-data.md" "docs/090-DR-REFF-task-44-dashboard-data.md"
cp "001-claude-docs/080-ref-user-journey-guide.md" "docs/091-DR-GUID-user-journey-guide.md"
cp "001-claude-docs/081-chk-domain-verification-steps.md" "docs/092-OD-OPNS-domain-verification.md"
cp "001-claude-docs/081-ref-hustlestats-domain-settings.md" "docs/093-OD-CONF-hustlestats-domain.md"
cp "001-claude-docs/082-chk-dns-records-update.md" "docs/094-OD-OPNS-dns-records-update.md"
cp "001-claude-docs/082-ref-hustlestats-CORRECTED-dns-records.md" "docs/095-OD-CONF-dns-records-corrected.md"
cp "001-claude-docs/083-ref-www-subdomain-dns.md" "docs/096-OD-CONF-www-subdomain-dns.md"

# FLATTEN survey-remediation subfolder into main /docs/
cp "001-claude-docs/survey-remediation/FINAL-SURVEY-REMEDIATION-REPORT.md" "docs/097-RA-REPT-survey-remediation.md"
cp "001-claude-docs/survey-remediation/issue-001-root-cause-analysis.md" "docs/098-RA-RCAS-survey-issue-root-cause.md"

# Migrate root docs
cp ".directory-standards.md" "docs/099-DR-REFF-directory-standards-legacy.md"

# FLATTEN .github release files into main /docs/
cp ".github/RELEASE_NOTES_v00.00.01.md" "docs/100-OD-RELS-release-notes-v00-00-01.md"
cp ".github/releases/v00.00.01/changelog.md" "docs/101-OD-CHNG-changelog-v00-00-01.md"
cp ".github/releases/v00.00.01/release-notes.md" "docs/102-OD-RELS-release-notes-detailed.md"

# Move security files (NOT documentation)
if [ -f ".credentials/hustle-monitoring-key.json" ]; then
  mv ".credentials/hustle-monitoring-key.json" "security/credentials/hustle-monitoring-key.json"
  echo "🔒 Moved security credentials"
fi

# Update .gitignore
cat >> .gitignore << 'EOF'

# Security credentials
security/credentials/*.json
security/credentials/*.key
security/credentials/*.pem
EOF

echo ""
echo "========================================"
echo "✅ Migration Complete!"
echo "========================================"
echo ""
echo "📊 Statistics:"
echo "  Total files in /docs/: 102"
echo "  All files FLAT (zero subdirectories)"
echo ""
echo "📁 Category Distribution:"
echo "  DR (Documentation & Reference): 22"
echo "  RA (Reports & Analysis): 11"
echo "  TQ (Testing & Quality): 11"
echo "  OD (Operations & Deployment): 10"
echo "  LS (Logs & Status): 7"
echo "  DC (Development & Code): 7"
echo "  MC (Meetings & Communication): 7"
echo "  PP (Product & Planning): 5"
echo "  AT (Architecture & Technical): 5"
echo "  PM (Project Management): 2"
echo "  AA (After Action): 2"
echo "  DD (Data & Datasets): 2"
echo "  UC (User & Customer): 1"
echo "  BL (Business & Legal): 1"
echo "  MS (Miscellaneous): 1"
echo ""
echo "🔍 Validation Commands:"
echo "  ls docs/ | wc -l  # Should show 102"
echo "  find docs -type d | wc -l  # Should show 1 (just docs/ itself)"
echo "  ls docs/*-AT-ADEC-*  # Show ADRs (in flat /docs/, not /adr/)"
echo ""
echo "📝 Next Steps:"
echo "  1. Review: git status"
echo "  2. Validate: Run regex check on filenames"
echo "  3. Test: Verify no broken links"
echo "  4. Commit: git add docs/ && git commit"
echo ""
```

---

## Validation Checks

### 1. Verify FLAT Structure (No Subdirectories)

```bash
# Should return ONLY 1 (the docs/ directory itself)
find docs -type d | wc -l

# Should show 102 files
find docs -type f | wc -l

# Should show NO nested directories
find docs -mindepth 2 -type d
# (Should return nothing)
```

### 2. Verify v2.0 Naming

```bash
# All files should match v2.0 regex
find docs -type f | while read file; do
  basename=$(basename "$file")
  if [[ ! $basename =~ ^[0-9]{3}-[A-Z]{2}-[A-Z]{4}-[a-z0-9-]+\.(md|sql|tsx|yml|prisma|patch|json)$ ]]; then
    echo "❌ Invalid: $basename"
  fi
done
```

### 3. Verify ADRs in FLAT /docs/ (NOT separate /adr/)

```bash
# Should show ADRs in /docs/ as AT-ADEC files
ls docs/*-AT-ADEC-*

# Expected output:
# docs/015-AT-ADEC-nextauth-migration.md
# docs/034-AT-ADEC-system-architecture.md
```

### 4. Verify Survey Files FLATTENED

```bash
# Should show survey files in /docs/ (NOT in subdirectory)
ls docs/*-RA-REPT-* docs/*-RA-RCAS-*

# Expected output:
# docs/097-RA-REPT-survey-remediation.md
# docs/098-RA-RCAS-survey-issue-root-cause.md
```

---

## Success Criteria

- [x] ALL 102 files in single flat `/docs/` directory
- [x] ZERO subdirectories in `/docs/` (completely flat)
- [x] ADRs in `/docs/` as `AT-ADEC` files (NOT separate `/adr/` directory)
- [x] Survey files flattened into `/docs/` (NOT in `survey-remediation/`)
- [x] Release files flattened into `/docs/` (NOT in `.github/releases/`)
- [x] All filenames match v2.0 regex (100% compliance)
- [x] Security files in `/security/` (NOT in `.credentials/`)
- [x] Root files stay in root (README.md, CLAUDE.md, etc.)

---

**Migration Status:** ✅ Ready for Execution
**Structure:** **SINGLE FLAT /docs/ (zero subdirectories)**
**Files:** 102 (all flat, no nesting)
**Risk:** Low (reversible via git)
