# ADR-002: DOCUMENT-FILING-SYSTEM-STANDARD-v2.0 Adoption

**Status:** Proposed
**Date:** 2025-10-17
**Decision Makers:** Claude Code (Automated), Jeremy Longshore (Owner)
**Supersedes:** Previous ad-hoc numbering system (`NNN-abc-description.ext`)
**Tags:** #documentation #naming #standards #filesystem

---

## Context and Problem Statement

Following ADR-001's decision to consolidate documentation into flat `/docs/` structure, we need a **systematic naming convention** that:

1. **Prevents sequence number collisions** (currently 24 files share duplicate numbers)
2. **Enables category-based filtering** (`ls docs/*-PR-*` for all Product docs)
3. **Maintains human readability** (not cryptic codes)
4. **Supports validation automation** (regex-checkable)
5. **Scales to 1000+ files** without reorganization
6. **Works across file types** (markdown, SQL, code examples)

**Current Naming Problems:**

| Problem | Example | Impact |
|---------|---------|--------|
| Duplicate sequence numbers | `051-*.md` (5 files) | Sorting confusion, collision risk |
| Missing category codes | `051-db-athlete-...` | No systematic filtering |
| Inconsistent abbreviations | `prd` vs `PRD` | Search ambiguity |
| No subcategory granularity | `ref-devops-*` (4 files) | Can't distinguish DevOps subtypes |

**Current Pattern (Inconsistent):**
```
NNN-abc-short-description.ext
```

Examples:
- ✅ `001-prd-hustle-mvp-v1.md` (Product Requirement)
- ⚠️ `051-db-athlete-detail-query-optimization.md` (Missing category)
- ❌ `045-query-optimization-summary.md` (No category at all)

**Desired Pattern (DOCUMENT-FILING-SYSTEM-STANDARD-v2.0):**
```
NNN-CC-ABCD-short-description.ext
```

Examples:
- ✅ `001-PR-MVPV-hustle-mvp-v1.md` (Product → MVP Version)
- ✅ `051-AN-PERF-athlete-detail-query-optimization.md` (Analysis → Performance)
- ✅ `045-AN-PERF-query-optimization-summary.md` (Analysis → Performance)

This ADR addresses: **What naming convention should we standardize on for maximum utility and maintainability?**

---

## Decision Drivers

### Technical Drivers
1. **Collision Prevention:** Unique sequence numbers prevent sorting ambiguity
2. **Regex Validation:** Machine-readable pattern enables automated enforcement
3. **Glob Filtering:** Category codes enable `find docs -name "*-PR-*"`
4. **Sorting Stability:** Numeric prefix ensures chronological order preserved
5. **Cross-Platform:** Works on Windows, macOS, Linux filesystems

### Developer Experience Drivers
1. **Quick Recognition:** Category codes instantly identify document type
2. **Mental Model:** `PR` = Product, `AD` = Architecture Decision, etc.
3. **Autocomplete Friendly:** Predictable structure aids IDE autocomplete
4. **Search Optimization:** Category + subcategory enable precise searches
5. **Onboarding:** New developers learn system quickly (2-letter codes)

### Operational Drivers
1. **Audit Compliance:** Category codes enable compliance reporting
2. **Metrics:** Count PRDs, ADRs, security docs separately
3. **Lifecycle Management:** Identify stale documentation by category
4. **Migration Tracking:** v2.0 pattern clearly distinguishes migrated files
5. **Tooling Integration:** Static site generators can parse categories

### Scalability Drivers
1. **1000+ File Support:** Sequence supports 001-999 (expandable to 0001-9999)
2. **Category Expansion:** New 2-letter codes added without renaming existing files
3. **Subcategory Granularity:** 4-letter codes allow fine-grained classification
4. **Future-Proof:** Pattern accommodates evolving documentation types

---

## Considered Options

### Option 1: Maintain Ad-Hoc Numbering ❌
**Pattern:** `NNN-abc-short-description.ext` (current state)

**Pros:**
- ✅ No migration required
- ✅ Developers already familiar

**Cons:**
- ❌ No systematic category codes
- ❌ Continued sequence number collisions
- ❌ Cannot filter by document type
- ❌ Case inconsistency (prd vs PRD)

**Verdict:** ❌ **REJECTED** - Perpetuates existing problems

---

### Option 2: UUID-Based Naming ❌
**Pattern:** `a7b3c4d5-short-description.md`

**Pros:**
- ✅ Guaranteed uniqueness
- ✅ No collision risk

**Cons:**
- ❌ Not human-readable
- ❌ No chronological ordering
- ❌ No category filtering
- ❌ Difficult to remember/reference

**Verdict:** ❌ **REJECTED** - Sacrifices usability for marginal uniqueness benefit

---

### Option 3: Date-Based Prefixes ❌
**Pattern:** `YYYY-MM-DD-category-description.md`

**Pros:**
- ✅ Chronological ordering
- ✅ Uniqueness (per day)

**Cons:**
- ❌ Date irrelevant for timeless docs (e.g., architecture)
- ❌ Renaming required if doc created later but logically earlier
- ❌ Longer prefixes (10 chars vs 3)
- ❌ Date vs. created vs. updated ambiguity

**Verdict:** ❌ **REJECTED** - Date not always meaningful for documentation

---

### Option 4: Semantic Versioning Style ❌
**Pattern:** `category/subcategory/v1.2.3-description.md`

**Pros:**
- ✅ Clear category hierarchy
- ✅ Version tracking

**Cons:**
- ❌ Requires nested directories (violates ADR-001 flat structure)
- ❌ Versioning overhead for docs that don't version
- ❌ Longer paths

**Verdict:** ❌ **REJECTED** - Incompatible with flat structure

---

### Option 5: DOCUMENT-FILING-SYSTEM-STANDARD-v2.0 ✅ **SELECTED**
**Pattern:** `NNN-CC-ABCD-short-description.ext`

**Components:**
- `NNN` = Sequence number (001-999, zero-padded)
- `CC` = Category code (2 uppercase letters)
- `ABCD` = Subcategory code (4 uppercase letters)
- `short-description` = Kebab-case human-readable description
- `ext` = File extension

**Pros:**
- ✅ Human-readable: `001-PR-MVPV-hustle-mvp-v1.md` clearly a Product Requirement
- ✅ Machine-parseable: Regex validation enforces consistency
- ✅ Filterable: `ls docs/*-PR-*` lists all Product docs
- ✅ Sortable: Numeric prefix maintains chronological order
- ✅ Scalable: Supports 999 files (expandable to 9999)
- ✅ Consistent: Fixed-width codes (NNN-CC-ABCD)
- ✅ Memorable: 2-letter category codes easy to learn

**Cons:**
- ⚠️ Migration required (~4-6 hours)
- ⚠️ Developer education needed
- ⚠️ Category boundary debates ("Is this RF or AN?")

**Verdict:** ✅ **SELECTED** - Best balance of usability and structure

---

## Decision Outcome

**Chosen Option:** **DOCUMENT-FILING-SYSTEM-STANDARD-v2.0**

All documentation files will follow the pattern:
```
NNN-CC-ABCD-short-description.ext
```

### Pattern Specification

#### 1. Sequence Number (NNN)

**Format:** 3-digit zero-padded number (001-999)

**Rules:**
- ✅ Must be unique across all files in `/docs/`
- ✅ Assigned sequentially in chronological order
- ✅ Gaps allowed (e.g., 001, 002, 005 if 003-004 deleted)
- ❌ No leading zeros beyond 3 digits (use 001 not 0001)

**Examples:**
- ✅ `001`, `042`, `153`
- ❌ `1`, `42`, `0153`

#### 2. Category Code (CC)

**Format:** 2 uppercase letters

**Defined Categories:**

| Code | Category | Description | Examples |
|------|----------|-------------|----------|
| `PR` | Product | Product requirements, MVPs, features | `PR-MVPV`, `PR-FEAT` |
| `AD` | Architecture | Architecture decisions, diagrams | `AD-DCSN`, `AD-DIAG` |
| `LG` | Log | Infrastructure logs, deployment logs | `LG-DEPL`, `LG-INFR` |
| `RF` | Reference | Reference docs, guides, manuals | `RF-DEVP`, `RF-AUTH` |
| `BG` | Bug | Bug reports, root cause analysis | `BG-AUTH`, `BG-ROOT` |
| `FX` | Fix | Bug fixes, patches, workarounds | `FX-LAND`, `FX-REGI` |
| `AA` | After Action | Post-mortems, retrospectives | `AA-AUTH`, `AA-SECU` |
| `SC` | Security | Security migrations, reviews, audits | `SC-MIGR`, `SC-REVI` |
| `SV` | Service | Services, surveys, features | `SV-SURV`, `SV-CUST` |
| `SO` | SOP | Standard Operating Procedures | `SO-DEPL`, `SO-SETP` |
| `DP` | Deployment | Deployment documentation | `DP-GCPR`, `DP-K8S-` |
| `AN` | Analysis | Performance, user journey analysis | `AN-PERF`, `AN-USER` |
| `TS` | Task | Task documentation, summaries | `TS-TYPE`, `TS-PERF` |
| `RV` | Review | Code reviews, task reviews | `RV-CODE`, `RV-TASK` |
| `CK` | Check | Deployment checks, DNS checks | `CK-DEPL`, `CK-DOMA` |
| `VR` | Verification | Verification guides, tests | `VR-TEST`, `VR-MONI` |
| `ST` | Status | Project status, phase status | `ST-PROJ`, `ST-PHAS` |
| `SM` | Summary | Executive summaries, overviews | `SM-PROJ`, `SM-TASK` |
| `DS` | Design | UX/UI design documents | `DS-UX--`, `DS-UI--` |
| `PO` | Policy | Policies, contribution guides | `PO-CONT`, `PO-CODE` |
| `RP` | Report | Reports, findings, audits | `RP-SURV`, `RP-SECU` |
| `RL` | Release | Release notes, changelogs | `RL-V000`, `RL-V001` |
| `DB` | Database | Database migrations, schemas | `DB-MIGR`, `DB-SCHM` |
| `CD` | Code | Code examples, snippets | `CD-OPTM`, `CD-EXAM` |
| `NT` | Note | Notes, limitations, caveats | `NT-CICD`, `NT-SECU` |
| `PL` | Plan | Strategic plans, roadmaps | `PL-ROAD`, `PL-SALE` |

**Extensibility:** New categories added as `XY` (2 uppercase letters)

#### 3. Subcategory Code (ABCD)

**Format:** 4 uppercase letters (or 3 letters + dash/underscore for padding)

**Purpose:** Provides granular classification within category

**Common Subcategories:**

| Code | Subcategory | Used With | Examples |
|------|-------------|-----------|----------|
| `MVPV` | MVP Version | PR | `001-PR-MVPV-hustle-mvp-v1.md` |
| `FEAT` | Feature | PR | `002-PR-FEAT-game-logging.md` |
| `DCSN` | Decision | AD | `015-AD-DCSN-nextauth-migration.md` |
| `DIAG` | Diagram | AD | `016-AD-DIAG-system-architecture.md` |
| `DEPL` | Deployment | LG, DP, CK | `010-LG-DEPL-cloud-run.md` |
| `INFR` | Infrastructure | LG | `004-LG-INFR-setup.md` |
| `AUTH` | Authentication | RF, BG, FX | `044-RF-AUTH-system.md` |
| `DEVP` | DevOps | RF | `018-RF-DEVP-guide.md` |
| `PERF` | Performance | AN | `051-AN-PERF-query-optimization.md` |
| `USER` | User Journey | AN | `054-AN-USER-current-state.md` |
| `MIGR` | Migration | SC, RF | `027-SC-MIGR-nextauth.md` |
| `REVI` | Review | SC, RV | `071-SC-REVI-security-review.md` |
| `SECU` | Security | AA, SM | `028-AA-SECU-security-fix.md` |
| `TASK` | Task | TS, SM, RV | `076-SM-TASK-task-41.md` |
| `PROJ` | Project | SM, ST | `077-SM-PROJ-mvp-completion.md` |
| `PHAS` | Phase | SM, ST | `079-SM-PHAS-phase-6b.md` |
| `CICD` | CI/CD | SO, NT | `045-SO-CICD-github-actions.md` |
| `DOMA` | Domain | CK, RF | `092-CK-DOMA-verification.md` |
| `DNSR` | DNS Records | CK, RF | `094-CK-DNSR-update.md` |
| `ROOT` | Root Cause | BG, AN | `098-AN-ROOT-survey-issue.md` |
| `V000` | Version 0.x | RL | `101-RL-V000-release-notes.md` |
| `UX--` | User Experience | DS | `062-DS-UX--athletes-list.md` |

**Padding Rules:**
- Use dashes or underscores if subcategory is <4 chars: `UX--`, `K8S-`
- Avoid ambiguous codes: `UI--` vs `UI__`

#### 4. Short Description

**Format:** Kebab-case lowercase words

**Rules:**
- ✅ Descriptive and concise (3-8 words ideal)
- ✅ Only lowercase letters, numbers, hyphens
- ❌ No spaces, underscores, or special characters
- ❌ No redundant category/subcategory info

**Examples:**
- ✅ `hustle-mvp-v1` (concise, descriptive)
- ✅ `query-optimization-summary` (clear)
- ❌ `Hustle-MVP-V1` (uppercase forbidden)
- ❌ `query_optimization_summary` (underscores forbidden)
- ❌ `product-requirement-hustle-mvp-v1` (redundant "product-requirement")

#### 5. File Extension

**Format:** Standard file extension

**Supported Extensions:**
- `.md` - Markdown documentation (primary)
- `.sql` - Database migrations, queries
- `.tsx` - TypeScript React examples
- `.ts` - TypeScript code examples
- `.js` - JavaScript code examples
- `.yml`, `.yaml` - Configuration examples
- `.json` - Data examples, configs
- `.prisma` - Prisma schema examples
- `.patch` - Git patches

**Naming Consistency:**
```
✅ 001-PR-MVPV-hustle-mvp-v1.md
✅ 056-DB-MIGR-migration-composite-index.sql
✅ 057-CD-OPTM-optimized-query-example.tsx
```

---

## Regex Validation

### Filename Pattern

```regex
^[0-9]{3}-[A-Z]{2}-[A-Z]{4}-[a-z0-9]+(-[a-z0-9]+)*\.(md|sql|tsx|ts|js|yml|yaml|json|prisma|patch|pdf|txt)$
```

**Explanation:**
- `^[0-9]{3}` - Exactly 3 digits
- `-[A-Z]{2}` - Dash + exactly 2 uppercase letters
- `-[A-Z]{4}` - Dash + exactly 4 uppercase letters (may include `-` or `_` padding)
- `-[a-z0-9]+(-[a-z0-9]+)*` - Dash + kebab-case description (lowercase + hyphens)
- `\.(md|sql|...)` - Dot + allowed extension
- `$` - End of string

**Test Cases:**

| Filename | Valid? | Reason |
|----------|--------|--------|
| `001-PR-MVPV-hustle-mvp-v1.md` | ✅ | Perfect match |
| `051-AN-PERF-query-optimization.md` | ✅ | Perfect match |
| `1-PR-MVPV-test.md` | ❌ | Only 1 digit (needs 001) |
| `001-pr-MVPV-test.md` | ❌ | Lowercase category code |
| `001-PR-mvpv-test.md` | ❌ | Lowercase subcategory |
| `001-PR-MVPV-Test.md` | ❌ | Uppercase in description |
| `001-PR-MVPV-test_file.md` | ❌ | Underscore in description |
| `001-PR-MVP-test.md` | ❌ | Only 3 chars in subcategory (needs 4) |

---

## Implementation Strategy

### Phase 1: Migration Script Generation (1 hour)

**Auto-generate migration mapping:**
```bash
# Map old → new filenames
001-prd-hustle-mvp-v1.md → 001-PR-MVPV-hustle-mvp-v1.md
015-adr-nextauth-migration.md → adr/ADR-001-nextauth-migration.md
051-db-athlete-detail-query-optimization.md → 051-AN-PERF-athlete-detail-query-optimization.md
```

### Phase 2: Automated Enforcement (30 min)

**Pre-commit hook:**
```bash
#!/bin/bash
# .git/hooks/pre-commit

REGEX='^[0-9]{3}-[A-Z]{2}-[A-Z]{4}-[a-z0-9]+(-[a-z0-9]+)*\.(md|sql|tsx|yml|prisma|patch|json)$'

for file in $(git diff --cached --name-only --diff-filter=A docs/); do
  basename=$(basename "$file")
  if [[ ! $basename =~ $REGEX ]]; then
    echo "ERROR: $basename does not match v2.0 naming pattern"
    echo "Expected: NNN-CC-ABCD-short-description.ext"
    echo "Example: 001-PR-MVPV-hustle-mvp-v1.md"
    exit 1
  fi
done
```

**CI/CD validation:**
```yaml
# .github/workflows/validate-docs.yml
name: Validate Documentation
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate filenames
        run: |
          shopt -s nullglob
          for file in docs/*.{md,sql,tsx}; do
            basename=$(basename "$file")
            if [[ ! $basename =~ ^[0-9]{3}-[A-Z]{2}-[A-Z]{4}-[a-z0-9]+(-[a-z0-9]+)*\.(md|sql|tsx|yml|prisma|patch|json)$ ]]; then
              echo "❌ Invalid: $basename"
              exit 1
            fi
          done
          echo "✅ All filenames valid"
```

### Phase 3: Developer Tooling (1 hour)

**File creation helper script:**
```bash
#!/bin/bash
# create-doc.sh - Helper to create properly named docs

CATEGORY=$1
SUBCATEGORY=$2
DESCRIPTION=$3

if [ -z "$CATEGORY" ] || [ -z "$SUBCATEGORY" ] || [ -z "$DESCRIPTION" ]; then
  echo "Usage: ./create-doc.sh CC ABCD short-description"
  echo "Example: ./create-doc.sh PR FEAT user-profile-feature"
  exit 1
fi

# Find next sequence number
NEXT_NUM=$(printf "%03d" $(($(ls docs/*.md | tail -1 | cut -d- -f1) + 1)))

FILENAME="docs/${NEXT_NUM}-${CATEGORY}-${SUBCATEGORY}-${DESCRIPTION}.md"

cat > "$FILENAME" <<EOF
# ${DESCRIPTION}

**Date:** $(date +%Y-%m-%d)
**Category:** ${CATEGORY} (${SUBCATEGORY})
**Status:** Draft

---

## Overview

[Your content here]

EOF

echo "✅ Created: $FILENAME"
```

### Phase 4: Documentation (30 min)

**Update `/docs/README.md`:**
```markdown
# Documentation Index

## Naming Convention

All files follow DOCUMENT-FILING-SYSTEM-STANDARD-v2.0:

**Pattern:** `NNN-CC-ABCD-short-description.ext`

- `NNN` = Sequence (001-999)
- `CC` = Category (PR, AD, LG, etc.)
- `ABCD` = Subcategory (MVPV, PERF, etc.)
- `short-description` = Kebab-case description
- `ext` = File extension (.md, .sql, etc.)

**Examples:**
- `001-PR-MVPV-hustle-mvp-v1.md` - Product Requirement, MVP Version
- `051-AN-PERF-query-optimization.md` - Analysis, Performance

## Categories

| Code | Category | Files |
|------|----------|-------|
| PR   | Product  | [List] |
| AD   | Architecture | [List] |
...
```

---

## Consequences

### Positive Consequences ✅

1. **Collision Prevention**
   - Re-sequencing eliminates 24 duplicate numbers
   - Uniqueness enforced by pre-commit hook

2. **Category Filtering**
   - `ls docs/*-PR-*` lists all Product docs
   - `ls docs/*-*-PERF-*` lists all Performance docs
   - Enables batch operations by category

3. **Automated Validation**
   - Regex enforcement prevents naming drift
   - CI/CD catches non-compliant files

4. **Improved Searchability**
   - Category codes aid mental filtering
   - Subcategories enable precise searches

5. **Scalability**
   - Supports 999 files (001-999)
   - Expandable to 9999 if needed

6. **Consistency**
   - Fixed-width codes (NNN-CC-ABCD) align in ls output
   - Predictable structure across file types

### Negative Consequences ⚠️

1. **Developer Education**
   - Team must learn 25+ category codes
   - Subcategory codes harder to remember

   **Mitigation:** Reference table in `/docs/README.md`, autocomplete helper

2. **Category Boundary Ambiguity**
   - "Is this RF (Reference) or AN (Analysis)?"
   - Subjective categorization debates

   **Mitigation:** Document examples, allow flexibility, focus on consistency over perfection

3. **Migration Effort**
   - ~4-6 hours to rename 126 files
   - Internal reference updates required

   **Mitigation:** Automated script, checksum validation

4. **Longer Filenames**
   - v2.0: `051-AN-PERF-query-optimization.md` (34 chars)
   - Old: `051-query-optimization.md` (27 chars)
   - +7 characters average

   **Mitigation:** Acceptable tradeoff for clarity

### Neutral Consequences ℹ️

1. **Git History**
   - `git log --follow` tracks file renames
   - No data loss

2. **Tooling Compatibility**
   - Most tools handle `NNN-CC-ABCD-` pattern fine
   - Static site generators parse correctly

---

## Validation and Compliance

### Pre-Commit Validation

**Install hook:**
```bash
cp scripts/validate-docs-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**Hook validates:**
- ✅ Filename matches regex
- ✅ Sequence number is unique
- ✅ Category code is defined
- ✅ No uppercase in description

### CI/CD Pipeline Checks

**GitHub Actions workflow:**
- Runs on every PR
- Validates all `/docs/` filenames
- Fails CI if non-compliant files detected

### Manual Validation

```bash
# List all non-compliant files
find docs -type f | while read file; do
  basename=$(basename "$file")
  if [[ ! $basename =~ ^[0-9]{3}-[A-Z]{2}-[A-Z]{4}-[a-z0-9]+(-[a-z0-9]+)*\.(md|sql|tsx|yml|prisma|patch|json)$ ]]; then
    echo "❌ Invalid: $basename"
  fi
done
```

---

## Monitoring and Review

### Success Metrics (30 Days Post-Adoption)

1. **Compliance Rate:**
   - Target: >95% of new docs follow v2.0 standard
   - Measured: `find docs -name "*.md" | grep -v regex-pattern | wc -l`

2. **Developer Satisfaction:**
   - Survey: "Is the naming convention helpful?" (Target: >80% "Yes")

3. **Collision Rate:**
   - Target: 0 duplicate sequence numbers
   - Measured: Automated sequence check

4. **Category Clarity:**
   - Survey: "Can you determine document type from filename?" (Target: >90% "Yes")

### Review Cadence

- **Week 1:** Daily monitoring of new file creations
- **Week 2-4:** Weekly category usage analysis
- **Month 3:** Retrospective on category boundaries
- **Month 6:** Evaluate need for new categories or refinements

---

## Migration Checklist

### Preparation
- [x] Create ADR-002 (this document)
- [x] Generate migration script
- [x] Create category code reference table
- [ ] Update CLAUDE.md with naming standard

### Execution
- [ ] Run migration script (rename 126 files)
- [ ] Verify checksum integrity
- [ ] Update internal references
- [ ] Install pre-commit hook
- [ ] Add CI/CD validation workflow

### Validation
- [ ] Run regex validation on all files (expect 100% pass)
- [ ] Check for duplicate sequence numbers (expect 0)
- [ ] Test pre-commit hook with invalid filename
- [ ] Verify CI/CD workflow catches violations

### Documentation
- [ ] Update `/docs/README.md` with naming guide
- [ ] Create `/docs/000-RF-STND-naming-convention.md` reference
- [ ] Add examples to CONTRIBUTING.md
- [ ] Update CLAUDE.md instructions

---

## Alternatives Rejected (Summary)

| Option | Why Rejected |
|--------|--------------|
| Ad-hoc numbering | No category filtering, continued collisions |
| UUID-based naming | Not human-readable, no ordering |
| Date-based prefixes | Date irrelevant for timeless docs, longer prefixes |
| Semantic versioning | Requires nested dirs, incompatible with flat structure |

---

## References

- [ADR-001: Canonical Repository Layout](./ADR-001-canonical-repo-layout.md)
- [Scaffold-Audit.md](../reports/Scaffold-Audit.md)
- [Docs-Migration.md](../reports/Docs-Migration.md)
- [DOCUMENT-FILING-SYSTEM-STANDARD-v2.0 (User-Provided)](../../CLAUDE.md) (reference in user's global CLAUDE.md)
- [File Naming Best Practices - Wikipedia](https://en.wikipedia.org/wiki/Filename)

---

## Change History

| Date | Author | Change |
|------|--------|--------|
| 2025-10-17 | Claude Code | Initial draft |
| - | - | - |

---

**Decision Status:** ✅ **PROPOSED** (Awaiting approval)
**Related ADR:** ADR-001 (Canonical Repo Layout)
**Estimated Impact:** Medium-High (standardizes naming, enables automation)
**Risk Level:** Low (fully reversible via git, validation prevents regressions)
