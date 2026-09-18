# ADR-001: Canonical Repository Layout and Documentation Consolidation

**Status:** Proposed
**Date:** 2025-10-17
**Decision Makers:** Claude Code (Automated), Jeremy Longshore (Owner)
**Tags:** #documentation #architecture #repository-structure #standards

---

## Context and Problem Statement

The Hustle repository has evolved organically over several months, resulting in **documentation fragmentation across 5+ separate locations** with **119 markdown files** scattered throughout the codebase. This fragmentation creates:

1. **Discovery Problems:** Developers cannot easily find relevant documentation
2. **Maintenance Overhead:** Updates require hunting across multiple directories
3. **Inconsistent Naming:** Multiple files share sequence numbers, indicating uncoordinated documentation
4. **Tooling Challenges:** Static site generators and documentation tools expect centralized structures
5. **Security Risks:** Credentials stored in non-standard `.credentials/` directory
6. **CI/CD Confusion:** Multiple workflow files with unclear ownership

**Current State:**
```
hustle/
├── 001-claude-docs/           # 91 markdown files (AI-generated docs)
│   └── survey-remediation/    # 2 subdirectory markdown files
├── .github/
│   ├── RELEASE_NOTES_*.md     # 1 file
│   └── releases/v00.00.01/    # 2 markdown files
├── .credentials/              # 1 security file (non-standard location)
├── [root]/                    # 6 markdown files (README, CLAUDE, etc.)
└── [various test folders]     # ~15 markdown files
```

**Total:** 119+ documentation files across 5+ locations, creating a **documentation discovery nightmare**.

This ADR addresses: **How should we organize repository structure for maximum clarity, maintainability, and developer experience?**

---

## Decision Drivers

### Technical Drivers
1. **Single Source of Truth:** All documentation in one predictable location
2. **Flat Structure:** Avoids deep nesting that obscures content
3. **Tooling Compatibility:** Static site generators (MkDocs, Docusaurus, Jekyll) expect flat `/docs/`
4. **Search Optimization:** Single directory enables full-text search without complex indexing
5. **Git Performance:** Flat structures reduce tree traversal overhead

### Developer Experience Drivers
1. **Predictability:** Developers know exactly where to find documentation
2. **Discoverability:** Alphabetical/sequential ordering in one directory
3. **Onboarding:** New team members see all docs in single location
4. **IDE Support:** Most IDEs optimize file trees for flat structures
5. **Link Stability:** Centralized paths reduce broken link risk

### Operational Drivers
1. **Security Isolation:** Sensitive files in dedicated `/security/` directory
2. **CI/CD Normalization:** Single authoritative CI/CD configuration source
3. **Audit Trail:** Centralized documentation enables compliance reporting
4. **Backup Simplicity:** Single directory backup/restore operations
5. **Migration Path:** Clear migration from scattered → consolidated

### Industry Best Practices
1. **GitHub Standard:** Most repositories use `/docs/` for documentation
2. **Monorepo Pattern:** Turborepo, Nx, Rush recommend flat docs
3. **Static Site Generators:** MkDocs, Docusaurus, VuePress expect `/docs/`
4. **ADR Standard:** Architecture Decision Records in dedicated `/adr/`
5. **Security Best Practice:** Credentials in `/security/` or environment variables

---

## Considered Options

### Option 1: Maintain Current Scattered Structure ❌
**Description:** Keep documentation in `001-claude-docs/`, `.github/`, root, etc.

**Pros:**
- ✅ No migration effort required
- ✅ Preserves existing references

**Cons:**
- ❌ Continued discovery problems
- ❌ Cannot use standard documentation tools
- ❌ Increases onboarding friction
- ❌ No solution for duplicate sequence numbers
- ❌ Security files in non-standard location

**Verdict:** ❌ **REJECTED** - Does not address core problems

---

### Option 2: Nested Hierarchical Structure ❌
**Description:** Organize docs into deep category hierarchy
```
docs/
├── product/
│   ├── requirements/
│   │   ├── mvp-v1.md
│   │   └── mvp-v2.md
│   └── roadmaps/
├── architecture/
│   ├── decisions/
│   └── diagrams/
└── operations/
    ├── deployment/
    └── monitoring/
```

**Pros:**
- ✅ Logical grouping by category
- ✅ Scales to thousands of files

**Cons:**
- ❌ Requires remembering category hierarchy
- ❌ Debate over category boundaries ("Is auth a feature or architecture?")
- ❌ Deeper paths harder to navigate
- ❌ More typing in references
- ❌ Tools prefer flat structures

**Verdict:** ❌ **REJECTED** - Over-engineering for 119 files

---

### Option 3: Flat /docs/ with Category Prefixes ✅ **SELECTED**
**Description:** Single flat `/docs/` directory with systematic naming convention
```
docs/
├── 001-PR-MVPV-hustle-mvp-v1.md
├── 002-PR-MVPV-hustle-mvp-v2-lean.md
├── 003-PL-SALE-sales-strategy.md
├── 015-AD-DCSN-nextauth-migration.md  # → moved to /adr/
└── ...
```

**Pros:**
- ✅ Single location for all documentation
- ✅ Alphabetical + sequential ordering
- ✅ Category prefixes enable filtering (e.g., `ls docs/*-PR-*`)
- ✅ Flat structure compatible with all tooling
- ✅ No ambiguity about file placement
- ✅ Fast full-text search
- ✅ Predictable file paths for links

**Cons:**
- ⚠️ Requires migration effort (~4-6 hours)
- ⚠️ All internal references need updates
- ⚠️ Requires developer education on naming standard

**Verdict:** ✅ **SELECTED** - Optimal balance of simplicity and scalability

---

### Option 4: Wiki or External Documentation Site ❌
**Description:** Move documentation to GitHub Wiki or external Confluence/Notion

**Pros:**
- ✅ Rich editing features
- ✅ Better search and indexing

**Cons:**
- ❌ Documentation separate from code (violates "docs as code")
- ❌ Version control decoupled from codebase
- ❌ Requires separate backup strategy
- ❌ External dependency risk
- ❌ No local access for offline development

**Verdict:** ❌ **REJECTED** - Documentation should live with code

---

## Decision Outcome

**Chosen Option:** **Option 3 - Flat /docs/ with Category Prefixes**

We will adopt a **flat documentation structure** with **systematic naming convention** based on DOCUMENT-FILING-SYSTEM-STANDARD-v2.0.

### Canonical Repository Layout

```
hustle/
├── docs/                      # 📁 Single flat documentation directory
│   ├── 001-PR-MVPV-hustle-mvp-v1.md
│   ├── 002-PR-MVPV-hustle-mvp-v2-lean.md
│   ├── ...
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
├── src/                       # Application source code
├── 03-Tests/                  # Test suites
├── 06-Infrastructure/         # Docker, K8s, Terraform
├── 99-Archive/                # Archived/deprecated code
├── README.md                  # Project overview (stays in root)
├── CLAUDE.md                  # AI assistant instructions (stays in root)
├── CHANGELOG.md               # Version history (stays in root)
└── [standard config files]
```

### File Naming Convention

**Pattern:** `NNN-CC-ABCD-short-description.ext`

**Where:**
- `NNN` = Sequence number (001-999)
- `CC` = Category code (2 letters: PR, AD, LG, RF, BG, etc.)
- `ABCD` = Subcategory code (4 letters: MVPV, DEPL, AUTH, etc.)
- `short-description` = Kebab-case description
- `ext` = File extension (.md, .sql, .tsx, etc.)

**Examples:**
- ✅ `001-PR-MVPV-hustle-mvp-v1.md` (Product Requirement, MVP Version)
- ✅ `015-AD-DCSN-nextauth-migration.md` (Architecture Decision)
- ✅ `051-AN-PERF-athlete-detail-query-optimization.md` (Analysis, Performance)

**Regex Validation:**
```regex
^[0-9]{3}-[A-Z]{2}-[A-Z]{4}-[a-z0-9]+(-[a-z0-9]+)*\.(md|sql|tsx|yml|prisma|patch|json)$
```

### Special Directories

1. **`/adr/`** - Architecture Decision Records ONLY
   - Naming: `ADR-NNN-short-description.md`
   - Contains only architectural decisions
   - Separate from general documentation

2. **`/security/`** - Security-sensitive files
   - Credentials in `/security/credentials/`
   - Protected by `.gitignore`
   - Never committed to repository

3. **`/reports/`** - Audit and analysis reports
   - Migration reports, security audits
   - Separated from general documentation

### Root-Level Files (Exceptions)

These files **remain in root** per industry convention:
- `README.md` - GitHub displays this prominently
- `CLAUDE.md` - AI assistant instructions
- `CHANGELOG.md` - Version history (follows Keep a Changelog standard)
- `CONTRIBUTING.md` - Contribution guidelines
- `LICENSE` - License file

---

## Consequences

### Positive Consequences ✅

1. **Single Source of Truth**
   - Developers know exactly where documentation lives
   - No more hunting across 5+ locations

2. **Improved Discoverability**
   - Sequential numbering provides natural ordering
   - Category prefixes enable filtering: `ls docs/*-PR-*`
   - Full-text search simplified (single directory)

3. **Tooling Compatibility**
   - MkDocs, Docusaurus, Jekyll work out-of-the-box
   - GitHub Pages can render `/docs/` natively
   - IDE file trees optimized for flat structures

4. **Better Security Posture**
   - Credentials isolated in `/security/`
   - Clear `.gitignore` protection
   - Audit trail for sensitive file access

5. **Reduced Link Rot**
   - Centralized paths more stable
   - Easier to validate with markdown link checkers

6. **Simplified CI/CD**
   - Documentation builds scan single directory
   - Faster markdown linting/validation
   - Predictable artifact generation

### Negative Consequences ⚠️

1. **Migration Effort**
   - ~4-6 hours to migrate 126 files
   - Internal references need updates
   - Risk of broken links during transition

   **Mitigation:** Automated migration script + validation tests

2. **Developer Education**
   - Team needs to learn v2.0 naming convention
   - Requires onboarding documentation updates

   **Mitigation:** Clear examples in `/docs/README.md`, CLAUDE.md updates

3. **Sequence Number Management**
   - Developers must track next available number
   - Risk of collisions in parallel work

   **Mitigation:** Pre-commit hook to validate uniqueness

4. **Category Boundary Debates**
   - "Is this a Reference (RF) or Analysis (AN)?"

   **Mitigation:** Document category definitions, allow flexibility

### Neutral Consequences ℹ️

1. **Git History Preserved**
   - Old file paths accessible via `git log --follow`
   - No data loss

2. **Reversible Decision**
   - Can revert via `git reset` if needed
   - Low risk experiment

---

## Compliance and Validation

### Regex Validation

All filenames must match:
```regex
^[0-9]{3}-[A-Z]{2}-[A-Z]{4}-[a-z0-9]+(-[a-z0-9]+)*\.(md|sql|tsx|yml|prisma|patch|json)$
```

**Enforcement:**
- Pre-commit hook validates filenames
- CI/CD pipeline checks on PR
- Automated tests prevent regression

### Link Validation

**Pre-Merge Requirements:**
- All internal markdown links must resolve
- No broken references to old `001-claude-docs/` paths
- Dead link checker passes

### Security Validation

**Pre-Merge Requirements:**
- No credentials in `/docs/` or repository
- `/security/.gitignore` properly configured
- Secret scanning tools pass

---

## Implementation Plan

### Phase 1: Preparation (Day 1, 30 min)
- [x] Create `/docs/`, `/adr/`, `/security/`, `/reports/` directories
- [x] Create README files for each directory
- [x] Git commit checkpoint

### Phase 2: Migration (Day 1, 2-3 hours)
- [ ] Execute automated migration script
- [ ] Copy 126 files with new naming convention
- [ ] Move security files to `/security/`
- [ ] Verify checksum integrity

### Phase 3: Reference Updates (Day 1, 1-2 hours)
- [ ] Find all internal references (grep search)
- [ ] Update CLAUDE.md references
- [ ] Update README.md references
- [ ] Update CI/CD workflow references

### Phase 4: Validation (Day 1, 30 min)
- [ ] Run filename regex validation
- [ ] Run markdown link checker
- [ ] Verify CI/CD pipelines still function
- [ ] Security scan for exposed credentials

### Phase 5: Cleanup (Day 2, 30 min)
- [ ] Remove old `001-claude-docs/` directory
- [ ] Remove `.credentials/` directory
- [ ] Update `.gitignore`
- [ ] Final commit and push

**Total Estimated Time:** 4-6 hours

---

## Monitoring and Review

### Success Metrics (30 Days Post-Migration)

1. **Developer Satisfaction:**
   - Survey: "Can you easily find documentation?" (Target: >90% "Yes")

2. **Link Health:**
   - Broken links: 0
   - Dead link checker: Green

3. **Contribution Quality:**
   - New docs follow v2.0 naming: >95%
   - Docs created in `/docs/` vs. scattered: 100%

4. **Search Performance:**
   - Time to find relevant doc: <30 seconds (vs. ~3 minutes pre-migration)

### Review Cadence

- **Week 1:** Daily check for broken links
- **Week 2-4:** Weekly review of new documentation placements
- **Month 3:** Retrospective on naming convention effectiveness
- **Month 6:** Consider whether to stay with flat structure or evolve

---

## Alternatives Rejected (Summary)

| Option | Why Rejected |
|--------|--------------|
| Maintain current scattered structure | Does not solve discovery problem |
| Nested hierarchical structure | Over-engineering for 119 files, tooling incompatibility |
| External wiki/Confluence | Violates "docs as code" principle, version control issues |

---

## References

- [DOCUMENT-FILING-SYSTEM-STANDARD-v2.0](../docs/020-RF-STND-directory-standards.md) (after migration)
- [Scaffold-Audit.md](../reports/Scaffold-Audit.md)
- [Docs-Migration.md](../reports/Docs-Migration.md)
- [GitHub Docs Best Practices](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [Divio Documentation System](https://documentation.divio.com/)
- [Architecture Decision Records (ADR) Standard](https://adr.github.io/)

---

## Change History

| Date | Author | Change |
|------|--------|--------|
| 2025-10-17 | Claude Code | Initial draft |
| - | - | - |

---

**Decision Status:** ✅ **PROPOSED** (Awaiting approval)
**Next ADR:** ADR-002-doc-filing-standard.md
**Estimated Impact:** High (improves DX significantly)
**Risk Level:** Low (fully reversible via git)
