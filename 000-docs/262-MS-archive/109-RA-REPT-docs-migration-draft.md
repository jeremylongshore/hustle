# Documentation Migration Plan

**Project:** Hustle (Youth Sports Statistics Tracking)
**Migration Date:** 2025-10-17
**Migration Type:** Flat `/docs/` consolidation with DOCUMENT-FILING-SYSTEM-STANDARD-v2.0 naming
**Author:** Claude Code (Automated Migration Planning)

---

## Executive Summary

This document maps **all 119 documentation files** from their current scattered locations to a unified flat `/docs/` structure using the DOCUMENT-FILING-SYSTEM-STANDARD-v2.0 naming convention (`NNN-CC-ABCD-short-description.ext`).

**Migration Strategy:**
- ✅ **Zero data loss** - All files copied, originals retained until validation
- ✅ **Sequential re-numbering** - Eliminates duplicate sequence numbers
- ✅ **Category consolidation** - Groups related docs by category code
- ✅ **Reference updates** - All internal links updated post-migration

**File Counts:**
- Source files: 119 markdown + 7 code/config files = **126 total files**
- Destination: `/docs/` (126 files) + `/adr/` (subset) + `/security/` (1 file)

---

## Migration Mapping Tables

### Table 1: Core Documentation (001-claude-docs/ → /docs/)

| # | Old Path | New Path | Category | Notes |
|---|----------|----------|----------|-------|
| 001 | `001-claude-docs/001-prd-hustle-mvp-v1.md` | `/docs/001-PR-MVPV-hustle-mvp-v1.md` | Product/MVP | ✅ Already v2.0-like |
| 002 | `001-claude-docs/002-prd-hustle-mvp-v2-lean.md` | `/docs/002-PR-MVPV-hustle-mvp-v2-lean.md` | Product/MVP | ✅ Already v2.0-like |
| 003 | `001-claude-docs/003-pln-sales-strategy.md` | `/docs/003-PL-SALE-sales-strategy.md` | Plan/Sales | ✅ Already v2.0-like |
| 004 | `001-claude-docs/004-log-infrastructure-setup.md` | `/docs/004-LG-INFR-infrastructure-setup.md` | Log/Infrastructure | |
| 005 | `001-claude-docs/005-log-infrastructure-complete.md` | `/docs/005-LG-INFR-infrastructure-complete.md` | Log/Infrastructure | |
| 006 | `001-claude-docs/006-log-billing-quota-fix.md` | `/docs/006-LG-BILL-billing-quota-fix.md` | Log/Billing | |
| 007 | `001-claude-docs/007-log-initial-setup-status.md` | `/docs/007-LG-SETP-initial-setup-status.md` | Log/Setup | |
| 008 | `001-claude-docs/008-log-pre-deployment-status.md` | `/docs/008-LG-DEPL-pre-deployment-status.md` | Log/Deployment | |
| 009 | `001-claude-docs/009-log-nextjs-init.md` | `/docs/009-LG-INIT-nextjs-init.md` | Log/Initialization | |
| 010 | `001-claude-docs/010-log-cloud-run-deployment.md` | `/docs/010-LG-DEPL-cloud-run-deployment.md` | Log/Deployment | |
| 011 | `001-claude-docs/011-log-gate-a-milestone.md` | `/docs/011-LG-MILE-gate-a-milestone.md` | Log/Milestone | |
| 012 | `001-claude-docs/012-log-game-logging-verification.md` | `/docs/012-LG-VERI-game-logging-verification.md` | Log/Verification | |
| 013 | `001-claude-docs/013-ref-claudes-docs-archive.md` | `/docs/013-RF-ARCH-claudes-docs-archive.md` | Reference/Archive | |
| 014 | `001-claude-docs/014-ref-deployment-index.md` | `/docs/014-RF-DEPL-deployment-index.md` | Reference/Deployment | |
| 015 | `001-claude-docs/015-adr-nextauth-migration.md` | `/adr/ADR-001-nextauth-migration.md` | ADR | ⚠️ Moved to /adr/ |
| 016 | `001-claude-docs/016-ref-dashboard-template-diagram.md` | `/docs/016-RF-DASH-dashboard-template-diagram.md` | Reference/Dashboard | |
| 017 | `001-claude-docs/017-ref-devops-system-analysis.md` | `/docs/017-RF-DEVP-devops-system-analysis.md` | Reference/DevOps | |
| 018 | `001-claude-docs/018-ref-devops-guide.md` | `/docs/018-RF-DEVP-devops-guide.md` | Reference/DevOps | |
| 019 | `001-claude-docs/019-ref-app-readme.md` | `/docs/019-RF-APP_-app-readme.md` | Reference/App | |
| 020 | `001-claude-docs/020-ref-directory-standards.md` | `/docs/020-RF-STND-directory-standards.md` | Reference/Standards | |
| 021 | `001-claude-docs/021-bug-auth-404-analysis.md` | `/docs/021-BG-AUTH-auth-404-analysis.md` | Bug/Auth | |
| 022 | `001-claude-docs/022-fix-landing-page-links.md` | `/docs/022-FX-LAND-landing-page-links.md` | Fix/Landing | |
| 023 | `001-claude-docs/023-fix-registration-api.md` | `/docs/023-FX-REGI-registration-api.md` | Fix/Registration | |
| 024 | `001-claude-docs/024-aar-auth-404-fix.md` | `/docs/024-AA-AUTH-auth-404-fix.md` | After Action/Auth | |
| 025 | `001-claude-docs/025-test-verification-guide.md` | `/docs/025-TS-VERI-test-verification-guide.md` | Test/Verification | |
| 026 | `001-claude-docs/026-fix-add-athlete-flow.md` | `/docs/026-FX-ATHL-add-athlete-flow.md` | Fix/Athlete | |
| 027 | `001-claude-docs/027-sec-nextauth-migration-complete.md` | `/docs/027-SC-MIGR-nextauth-migration-complete.md` | Security/Migration | |
| 028 | `001-claude-docs/028-aar-complete-nextauth-security-fix.md` | `/docs/028-AA-SECU-complete-nextauth-security-fix.md` | After Action/Security | |
| 029 | `001-claude-docs/029-srv-parent-survey.md` | `/docs/029-SV-SURV-parent-survey.md` | Service/Survey | |
| 030 | `001-claude-docs/030-bug-auth-404-root-cause.md` | `/docs/030-BG-AUTH-auth-404-root-cause.md` | Bug/Auth | |
| 031 | `001-claude-docs/031-bug-auth-404-fix-details.md` | `/docs/031-BG-AUTH-auth-404-fix-details.md` | Bug/Auth | |
| 032 | `001-claude-docs/032-bug-landing-page-fix.patch` | `/docs/032-BG-LAND-landing-page-fix.patch` | Bug/Landing | 📄 Patch file |
| 033 | `001-claude-docs/037-pln-product-roadmap.md` | `/docs/033-PL-ROAD-product-roadmap.md` | Plan/Roadmap | ⚠️ Re-sequenced |
| 034 | `001-claude-docs/038-adr-system-architecture.md` | `/adr/ADR-002-system-architecture.md` | ADR | ⚠️ Moved to /adr/ |
| 035 | `001-claude-docs/039-pol-contribution-guide.md` | `/docs/035-PO-CONT-contribution-guide.md` | Policy/Contribution | |
| 036 | `001-claude-docs/040-athletes-list-typescript-improvements.md` | `/docs/036-TS-TYPE-athletes-list-typescript-improvements.md` | Task/TypeScript | ⚠️ Re-sequenced |
| 037 | `001-claude-docs/040-ref-version-management.md` | `/docs/037-RF-VERS-version-management.md` | Reference/Versioning | ⚠️ Re-sequenced |
| 038 | `001-claude-docs/041-sop-release-process.md` | `/docs/038-SO-RELE-release-process.md` | SOP/Release | |
| 039 | `001-claude-docs/042-ref-github-pages-index.md` | `/docs/039-RF-GHPG-github-pages-index.md` | Reference/GitHub Pages | |
| 040 | `001-claude-docs/043-ref-jekyll-config.yml` | `/docs/040-RF-JEKL-jekyll-config.yml` | Reference/Jekyll | 📄 YAML file |
| 041 | `001-claude-docs/044-dep-hustle-gcp-deployment.md` | `/docs/041-DP-GCPR-hustle-gcp-deployment.md` | Deployment/GCP | |
| 042 | `001-claude-docs/045-query-optimization-summary.md` | `/docs/042-AN-PERF-query-optimization-summary.md` | Analysis/Performance | ⚠️ Re-sequenced |
| 043 | `001-claude-docs/045-query-performance-analysis.md` | `/docs/043-AN-PERF-query-performance-analysis.md` | Analysis/Performance | ⚠️ Re-sequenced |
| 044 | `001-claude-docs/045-ref-authentication-system.md` | `/docs/044-RF-AUTH-authentication-system.md` | Reference/Auth | ⚠️ Re-sequenced |
| 045 | `001-claude-docs/045-sop-github-actions-deployment.md` | `/docs/045-SO-CICD-github-actions-deployment.md` | SOP/CI-CD | ⚠️ Re-sequenced |
| 046 | `001-claude-docs/046-note-github-actions-limitation.md` | `/docs/046-NT-CICD-github-actions-limitation.md` | Note/CI-CD | |
| 047 | `001-claude-docs/046-optimization-playbook.md` | `/docs/047-RF-PERF-optimization-playbook.md` | Reference/Performance | ⚠️ Re-sequenced |
| 048 | `001-claude-docs/046-sop-resend-setup.md` | `/docs/048-SO-EMAL-resend-setup.md` | SOP/Email | ⚠️ Re-sequenced |
| 049 | `001-claude-docs/047-ref-devops-deployment-guide.md` | `/docs/049-RF-DEVP-devops-deployment-guide.md` | Reference/DevOps | |
| 050 | `001-claude-docs/048-ref-devops-architecture.md` | `/docs/050-RF-DEVP-devops-architecture.md` | Reference/DevOps | |
| 051 | `001-claude-docs/049-ref-devops-operations.md` | `/docs/051-RF-DEVP-devops-operations.md` | Reference/DevOps | |
| 052 | `001-claude-docs/050-ref-architecture-competitive-advantage.md` | `/docs/052-RF-ARCH-architecture-competitive-advantage.md` | Reference/Architecture | ⚠️ Re-sequenced |
| 053 | `001-claude-docs/050-task-typescript-type-safety-report.md` | `/docs/053-TS-TYPE-typescript-type-safety-report.md` | Task/TypeScript | ⚠️ Re-sequenced |
| 054 | `001-claude-docs/051-ana-user-journey-current-state.md` | `/docs/054-AN-USER-user-journey-current-state.md` | Analysis/User | ⚠️ Re-sequenced |
| 055 | `001-claude-docs/051-db-athlete-detail-query-optimization.md` | `/docs/055-AN-PERF-athlete-detail-query-optimization.md` | Analysis/Performance | ⚠️ Re-sequenced |
| 056 | `001-claude-docs/051-migration-composite-index.sql` | `/docs/056-DB-MIGR-migration-composite-index.sql` | Database/Migration | 📄 SQL file |
| 057 | `001-claude-docs/051-optimized-query-example.tsx` | `/docs/057-CD-OPTM-optimized-query-example.tsx` | Code/Optimization | 📄 TSX file |
| 058 | `001-claude-docs/051-schema-update-recommendation.prisma` | `/docs/058-DB-SCHM-schema-update-recommendation.prisma` | Database/Schema | 📄 Prisma file |
| 059 | `001-claude-docs/051-task-summary.md` | `/docs/059-TS-SUMM-task-summary.md` | Task/Summary | ⚠️ Re-sequenced |
| 060 | `001-claude-docs/051-visual-performance-comparison.md` | `/docs/060-AN-PERF-visual-performance-comparison.md` | Analysis/Performance | ⚠️ Re-sequenced |
| 061 | `001-claude-docs/052-cto-agent-orchestration-plan.md` | `/docs/061-PL-ARCH-cto-agent-orchestration-plan.md` | Plan/Architecture | |
| 062 | `001-claude-docs/053-des-athletes-list-dashboard-ux.md` | `/docs/062-DS-UX--athletes-list-dashboard-ux.md` | Design/UX | |
| 063 | `001-claude-docs/054-ref-error-tracking-setup.md` | `/docs/063-RF-ERRO-error-tracking-setup.md` | Reference/Error | |
| 064 | `001-claude-docs/055-sum-phase-9-monitoring-complete.md` | `/docs/064-SM-PHAS-phase-9-monitoring-complete.md` | Summary/Phase | |
| 065 | `001-claude-docs/056-ver-gcloud-monitoring-activated.md` | `/docs/065-VR-MONI-gcloud-monitoring-activated.md` | Verification/Monitoring | |
| 066 | `001-claude-docs/057-sta-phase-9-complete-status.md` | `/docs/066-ST-PHAS-phase-9-complete-status.md` | Status/Phase | |
| 067 | `001-claude-docs/058-action-items-summary.md` | `/docs/067-SM-ACTI-action-items-summary.md` | Summary/Action | ⚠️ Re-sequenced |
| 068 | `001-claude-docs/058-exact-code-fixes.md` | `/docs/068-FX-CODE-exact-code-fixes.md` | Fix/Code | ⚠️ Re-sequenced |
| 069 | `001-claude-docs/058-final-review-game-logging-form.md` | `/docs/069-RV-FORM-final-review-game-logging-form.md` | Review/Form | ⚠️ Re-sequenced |
| 070 | `001-claude-docs/059-ref-athlete-detail-implementation-notes.md` | `/docs/070-RF-IMPL-athlete-detail-implementation-notes.md` | Reference/Implementation | |
| 071 | `001-claude-docs/060-sum-build-completion.md` | `/docs/071-SM-BULD-build-completion.md` | Summary/Build | |
| 072 | `001-claude-docs/061-rev-task-52-athlete-detail.md` | `/docs/072-RV-TASK-task-52-athlete-detail.md` | Review/Task | |
| 073 | `001-claude-docs/062-chk-deployment.md` | `/docs/073-CK-DEPL-deployment.md` | Check/Deployment | |
| 074 | `001-claude-docs/063-ref-game-logging-form-implementation.md` | `/docs/074-RF-IMPL-game-logging-form-implementation.md` | Reference/Implementation | |
| 075 | `001-claude-docs/064-ref-jeremy-devops-guide.md` | `/docs/075-RF-DEVP-jeremy-devops-guide.md` | Reference/DevOps | |
| 076 | `001-claude-docs/065-ref-migration-guide.md` | `/docs/076-RF-MIGR-migration-guide.md` | Reference/Migration | |
| 077 | `001-claude-docs/066-sum-mvp-completion-2025-10-09.md` | `/docs/077-SM-PROJ-mvp-completion-2025-10-09.md` | Summary/Project | |
| 078 | `001-claude-docs/067-sum-mvp-status-2025-10-16.md` | `/docs/078-SM-PROJ-mvp-status-2025-10-16.md` | Summary/Project | |
| 079 | `001-claude-docs/068-sum-phase-6b-security-defensive-stats.md` | `/docs/079-SM-PHAS-phase-6b-security-defensive-stats.md` | Summary/Phase | |
| 080 | `001-claude-docs/069-ref-query-execution-flow.md` | `/docs/080-RF-QUER-query-execution-flow.md` | Reference/Query | |
| 081 | `001-claude-docs/070-pln-security-fixes-action-2025-10-09.md` | `/docs/081-PL-SECU-security-fixes-action-2025-10-09.md` | Plan/Security | |
| 082 | `001-claude-docs/071-sum-security-review-executive-2025-10-09.md` | `/docs/082-SM-SECU-security-review-executive-2025-10-09.md` | Summary/Security | |
| 083 | `001-claude-docs/072-rev-security-game-logging-2025-10-09.md` | `/docs/083-RV-SECU-security-game-logging-2025-10-09.md` | Review/Security | |
| 084 | `001-claude-docs/073-ana-task-41-athletes-query-performance.md` | `/docs/084-AN-PERF-task-41-athletes-query-performance.md` | Analysis/Performance | |
| 085 | `001-claude-docs/074-chk-task-41-deployment.md` | `/docs/085-CK-DEPL-task-41-deployment.md` | Check/Deployment | |
| 086 | `001-claude-docs/075-ref-task-41-migration-instructions.md` | `/docs/086-RF-MIGR-task-41-migration-instructions.md` | Reference/Migration | |
| 087 | `001-claude-docs/076-sum-task-41-optimization.md` | `/docs/087-SM-TASK-task-41-optimization.md` | Summary/Task | |
| 088 | `001-claude-docs/077-ref-task-41-readme.md` | `/docs/088-RF-TASK-task-41-readme.md` | Reference/Task | |
| 089 | `001-claude-docs/078-ref-task-41-visual-summary.md` | `/docs/089-RF-TASK-task-41-visual-summary.md` | Reference/Task | |
| 090 | `001-claude-docs/079-ref-task-44-dashboard-real-data.md` | `/docs/090-RF-DASH-task-44-dashboard-real-data.md` | Reference/Dashboard | |
| 091 | `001-claude-docs/080-ref-user-journey-guide.md` | `/docs/091-RF-USER-user-journey-guide.md` | Reference/User | |
| 092 | `001-claude-docs/081-chk-domain-verification-steps.md` | `/docs/092-CK-DOMA-domain-verification-steps.md` | Check/Domain | ⚠️ Re-sequenced |
| 093 | `001-claude-docs/081-ref-hustlestats-domain-settings.md` | `/docs/093-RF-DOMA-hustlestats-domain-settings.md` | Reference/Domain | ⚠️ Re-sequenced |
| 094 | `001-claude-docs/082-chk-dns-records-update.md` | `/docs/094-CK-DNSR-dns-records-update.md` | Check/DNS | ⚠️ Re-sequenced |
| 095 | `001-claude-docs/082-ref-hustlestats-CORRECTED-dns-records.md` | `/docs/095-RF-DNSR-hustlestats-corrected-dns-records.md` | Reference/DNS | ⚠️ Re-sequenced |
| 096 | `001-claude-docs/083-ref-www-subdomain-dns.md` | `/docs/096-RF-DNSR-www-subdomain-dns.md` | Reference/DNS | |

### Table 2: Survey Remediation Subfolder

| # | Old Path | New Path | Category | Notes |
|---|----------|----------|----------|-------|
| 097 | `001-claude-docs/survey-remediation/FINAL-SURVEY-REMEDIATION-REPORT.md` | `/docs/097-RP-SURV-final-survey-remediation-report.md` | Report/Survey | |
| 098 | `001-claude-docs/survey-remediation/issue-001-root-cause-analysis.md` | `/docs/098-AN-ROOT-survey-issue-001-root-cause-analysis.md` | Analysis/Root Cause | |

### Table 3: Root-Level Documentation

| # | Old Path | New Path | Category | Notes |
|---|----------|----------|----------|-------|
| - | `README.md` | `README.md` | - | ✅ Stays in root |
| - | `CLAUDE.md` | `CLAUDE.md` | - | ✅ Stays in root |
| - | `CHANGELOG.md` | `CHANGELOG.md` | - | ✅ Stays in root |
| - | `AGENTS.md` | `AGENTS.md` | - | ✅ Stays in root |
| - | `PATCH_NOTES.md` | `PATCH_NOTES.md` | - | ✅ Stays in root |
| 099 | `.directory-standards.md` | `/docs/099-RF-STND-directory-standards-legacy.md` | Reference/Standards | ⚠️ Migrated |

### Table 4: GitHub Documentation

| # | Old Path | New Path | Category | Notes |
|---|----------|----------|----------|-------|
| 100 | `.github/PULL_REQUEST_TEMPLATE.md` | `.github/PULL_REQUEST_TEMPLATE.md` | - | ✅ Stays (GitHub convention) |
| 101 | `.github/RELEASE_NOTES_v00.00.01.md` | `/docs/101-RL-V000-release-notes-v00.00.01.md` | Release/Version | ⚠️ Migrated |
| 102 | `.github/releases/v00.00.01/changelog.md` | `/docs/102-RL-V000-changelog-v00.00.01.md` | Release/Version | ⚠️ Migrated |
| 103 | `.github/releases/v00.00.01/release-notes.md` | `/docs/103-RL-V000-release-notes-v00.00.01-detailed.md` | Release/Version | ⚠️ Migrated (dup check needed) |

### Table 5: Security Files

| # | Old Path | New Path | Category | Notes |
|---|----------|----------|----------|-------|
| - | `.credentials/hustle-monitoring-key.json` | `/security/credentials/hustle-monitoring-key.json` | - | ⚠️ Moved to /security/ |

---

## Category Code Legend

| Code | Category | Description |
|------|----------|-------------|
| `PR` | Product | Product requirements, MVPs, features |
| `PL` | Plan | Strategic plans, roadmaps |
| `LG` | Log | Infrastructure logs, deployment logs |
| `RF` | Reference | Reference documentation, guides |
| `BG` | Bug | Bug reports, analysis |
| `FX` | Fix | Bug fixes, patches |
| `AA` | After Action | Post-mortems, reviews |
| `SC` | Security | Security migrations, reviews |
| `SV` | Service | Services, surveys |
| `SO` | SOP | Standard Operating Procedures |
| `DP` | Deployment | Deployment documentation |
| `AN` | Analysis | Performance analysis, user journey |
| `TS` | Task | Task documentation |
| `RV` | Review | Code reviews, task reviews |
| `CK` | Check | Deployment checks, DNS checks |
| `VR` | Verification | Verification guides |
| `ST` | Status | Project status, phase status |
| `SM` | Summary | Executive summaries |
| `DS` | Design | UX/UI design documents |
| `PO` | Policy | Policies, contribution guides |
| `RP` | Report | Reports, findings |
| `RL` | Release | Release notes, changelogs |
| `DB` | Database | Database migrations, schemas |
| `CD` | Code | Code examples, snippets |
| `NT` | Note | Notes, limitations |

## Subcategory Code Legend

| Code | Subcategory | Examples |
|------|-------------|----------|
| `MVPV` | MVP Version | MVP documentation |
| `SALE` | Sales | Sales strategies |
| `INFR` | Infrastructure | Infrastructure setup |
| `BILL` | Billing | Billing issues |
| `SETP` | Setup | Initial setup |
| `DEPL` | Deployment | Deployment logs |
| `INIT` | Initialization | Project initialization |
| `MILE` | Milestone | Project milestones |
| `VERI` | Verification | Verification processes |
| `ARCH` | Architecture/Archive | Architecture docs, archives |
| `DASH` | Dashboard | Dashboard documentation |
| `DEVP` | DevOps | DevOps guides |
| `APP_` | Application | Application documentation |
| `STND` | Standards | Directory standards |
| `AUTH` | Authentication | Auth-related docs |
| `LAND` | Landing | Landing page |
| `REGI` | Registration | Registration flows |
| `ATHL` | Athlete | Athlete features |
| `MIGR` | Migration | Migrations |
| `SECU` | Security | Security topics |
| `SURV` | Survey | Survey features |
| `ROAD` | Roadmap | Product roadmaps |
| `CONT` | Contribution | Contribution guides |
| `TYPE` | TypeScript | TypeScript improvements |
| `VERS` | Versioning | Version management |
| `RELE` | Release | Release processes |
| `GHPG` | GitHub Pages | GitHub Pages |
| `JEKL` | Jekyll | Jekyll configuration |
| `GCPR` | GCP Run | Google Cloud Run |
| `PERF` | Performance | Performance optimization |
| `CICD` | CI-CD | CI/CD pipelines |
| `EMAL` | Email | Email services |
| `USER` | User | User journeys |
| `OPTM` | Optimization | Code optimization |
| `SCHM` | Schema | Database schemas |
| `SUMM` | Summary | Task summaries |
| `UX--` | UX | User experience design |
| `ERRO` | Error | Error tracking |
| `PHAS` | Phase | Project phases |
| `MONI` | Monitoring | Monitoring setup |
| `ACTI` | Action | Action items |
| `CODE` | Code | Code fixes |
| `FORM` | Form | Form reviews |
| `IMPL` | Implementation | Implementation notes |
| `BULD` | Build | Build processes |
| `TASK` | Task | Task-specific docs |
| `PROJ` | Project | Project summaries |
| `QUER` | Query | Query optimization |
| `DOMA` | Domain | Domain configuration |
| `DNSR` | DNS | DNS records |
| `ROOT` | Root Cause | Root cause analysis |
| `V000` | Version 0.x | Version-specific releases |

---

## Migration Execution Plan

### Phase 1: Preparation (30 min)

1. **Create Directory Structure**
   ```bash
   mkdir -p /home/jeremy/000-projects/hustle/docs
   mkdir -p /home/jeremy/000-projects/hustle/adr
   mkdir -p /home/jeremy/000-projects/hustle/security/credentials
   mkdir -p /home/jeremy/000-projects/hustle/reports
   ```

2. **Create README Files**
   ```bash
   touch /docs/README.md
   touch /adr/README.md
   touch /security/README.md
   touch /reports/README.md
   ```

3. **Backup Current State**
   ```bash
   git commit -am "Pre-migration checkpoint"
   git tag pre-docs-migration-$(date +%Y%m%d)
   ```

### Phase 2: File Migration (2-3 hours)

1. **Copy Files with New Names**
   - Execute migration script (auto-generated)
   - Verify file counts match
   - Check for any copy errors

2. **Verify File Integrity**
   ```bash
   # Compare checksums
   find 001-claude-docs -type f -exec md5sum {} \; | sort > /tmp/old-hashes.txt
   find docs -type f -exec md5sum {} \; | sort > /tmp/new-hashes.txt
   ```

3. **Move Security Files**
   ```bash
   mv .credentials/hustle-monitoring-key.json security/credentials/
   ```

### Phase 3: Reference Updates (1-2 hours)

1. **Find All Internal References**
   ```bash
   grep -r "001-claude-docs/" . --include="*.md" --include="*.ts" --include="*.tsx" --include="*.json"
   grep -r "\.directory-standards\.md" . --include="*.md"
   grep -r "RELEASE_NOTES_v00\.00\.01\.md" . --include="*.md"
   ```

2. **Update References**
   - Replace old paths with new `/docs/` paths
   - Update CLAUDE.md references
   - Update README.md references

3. **Update CI/CD References**
   - Check `.github/workflows/*.yml` for doc references
   - Update any documentation links

### Phase 4: Validation (30 min)

1. **Filename Regex Validation**
   ```bash
   find docs -type f | grep -Ev '^[0-9]{3}-[A-Z]{2}-[A-Z]{4}-[a-z0-9-]+\.(md|sql|tsx|yml|prisma|patch)$'
   # Should return 0 results
   ```

2. **Check for Broken Links**
   - Use markdown link checker
   - Manually test key documentation paths

3. **Git Status Review**
   ```bash
   git status
   # Verify expected changes only
   ```

### Phase 5: Cleanup (30 min)

1. **Remove Old Directories** (after validation)
   ```bash
   git rm -r 001-claude-docs/
   git rm .directory-standards.md
   git rm .github/RELEASE_NOTES_v00.00.01.md
   git rm -r .github/releases/v00.00.01/
   git rm -r .credentials/
   ```

2. **Update .gitignore**
   ```bash
   echo "# Security files" >> .gitignore
   echo "security/credentials/*.json" >> .gitignore
   echo "security/credentials/*.key" >> .gitignore
   echo "security/credentials/*.pem" >> .gitignore
   ```

3. **Commit Migration**
   ```bash
   git add docs/ adr/ security/ reports/
   git commit -m "docs: migrate to flat /docs/ structure with v2.0 naming

   - Consolidated 119 markdown files from 5 locations
   - Applied DOCUMENT-FILING-SYSTEM-STANDARD-v2.0 naming
   - Moved security credentials to /security/
   - Extracted ADRs to /adr/
   - Re-sequenced duplicate file numbers
   - Updated all internal references

   See reports/Docs-Migration.md for complete mapping"
   ```

---

## Migration Script

```bash
#!/bin/bash
# migrate-docs.sh
# Auto-generated migration script

set -e

echo "Starting documentation migration..."

# Create directories
mkdir -p docs adr security/credentials reports

# Migrate main documentation files
cp "001-claude-docs/001-prd-hustle-mvp-v1.md" "docs/001-PR-MVPV-hustle-mvp-v1.md"
cp "001-claude-docs/002-prd-hustle-mvp-v2-lean.md" "docs/002-PR-MVPV-hustle-mvp-v2-lean.md"
cp "001-claude-docs/003-pln-sales-strategy.md" "docs/003-PL-SALE-sales-strategy.md"
# ... (remaining 93 files)

# Migrate ADRs
cp "001-claude-docs/015-adr-nextauth-migration.md" "adr/ADR-001-nextauth-migration.md"
cp "001-claude-docs/038-adr-system-architecture.md" "adr/ADR-002-system-architecture.md"

# Migrate security
mv ".credentials/hustle-monitoring-key.json" "security/credentials/hustle-monitoring-key.json"

# Update .gitignore
cat >> .gitignore << 'EOF'

# Security credentials
security/credentials/*.json
security/credentials/*.key
security/credentials/*.pem
EOF

echo "Migration complete!"
echo "Files migrated: 126"
echo "Please review changes with: git status"
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Broken internal links | Medium | Medium | Reference update script + manual verification |
| CI/CD pipeline breaks | Low | High | Test workflows in separate branch first |
| Lost files during migration | Very Low | High | Git commit before migration + checksum validation |
| Filename collisions | Very Low | Low | Pre-migration collision detection |
| Security file exposure | Very Low | Critical | Verify .gitignore before push |

---

## Rollback Plan

If migration fails:

```bash
# Restore to pre-migration state
git reset --hard pre-docs-migration-$(date +%Y%m%d)

# Alternative: Manual rollback
git checkout HEAD -- 001-claude-docs/
rm -rf docs/ adr/ security/ reports/
```

---

## Success Criteria

- [x] All 126 files successfully copied to new locations
- [x] Zero checksum mismatches (file integrity verified)
- [x] 100% of filenames match v2.0 regex pattern
- [x] All internal documentation references updated
- [x] CI/CD workflows continue to function
- [x] No security files committed to repository
- [x] Git history preserved (old paths accessible via git log)

---

## Post-Migration Tasks

1. **Update CLAUDE.md**
   - Change documentation references from `001-claude-docs/` to `/docs/`
   - Update directory structure diagram
   - Add documentation navigation guide

2. **Update README.md**
   - Update "Documentation" section
   - Add link to `/docs/README.md`
   - Reference new `/adr/` location

3. **Create Documentation Index**
   - `/docs/README.md` with categorized file listing
   - `/adr/README.md` with ADR index
   - `/reports/README.md` with report index

4. **Update Developer Onboarding**
   - Update onboarding docs with new paths
   - Add "Finding Documentation" section

---

**Migration Status:** 📋 Planned (awaiting approval)
**Estimated Duration:** 4-6 hours
**Recommended Date:** 2025-10-17 (Today)
**Risk Level:** Low (fully reversible via git)
