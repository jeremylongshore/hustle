# Release Process

How to create a new Hustle release following our sequential versioning system.

**Current Version:** `v00.00.00`

---

## 🎯 Release Philosophy

Every release represents **real progress**. We don't inflate version numbers. We don't skip versions. We increment by `0.00.01` every single time.

### What Constitutes a Release?

A release happens when:
- A meaningful feature is complete and tested
- A critical bug fix is deployed
- Security updates are applied
- Documentation improvements are significant
- Infrastructure changes go live

**Not every commit is a release. But every release is meaningful.**

---

## 📋 Pre-Release Checklist

Before creating any release:

### 1. Code Quality
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in development
- [ ] TypeScript compiles without errors

### 2. Documentation
- [ ] CHANGELOG.md updated with new version
- [ ] README.md version badge updated
- [ ] Any new features documented in `01-Docs/`
- [ ] CLAUDE.md updated if architecture changed

### 3. Testing
- [ ] Manual testing of new features complete
- [ ] Regression testing of existing features
- [ ] Database migrations tested
- [ ] Authentication flow verified
- [ ] Production deployment tested

### 4. Version Verification
- [ ] Current version identified: `git describe --tags --abbrev=0`
- [ ] Next version calculated: current + 0.00.01
- [ ] No version conflicts or duplicates

---

## 🚀 Release Steps

### Step 1: Determine Next Version

```bash
# Get current version
CURRENT=$(git describe --tags --abbrev=0)
echo "Current version: $CURRENT"

# Calculate next version (manually for now)
# v00.00.00 → v00.00.01
# v00.00.09 → v00.00.10
# v00.00.99 → v00.01.00
```

### Step 2: Update Documentation

```bash
# Update CHANGELOG.md
# Add new section at top:
## [00.00.01] - YYYY-MM-DD - Feature Name

### Added
- Feature description

### Changed
- Change description

### Fixed
- Bug fix description
```

```bash
# Update README.md version badge
# Change: version-00.00.00-blue
# To: version-00.00.01-blue
```

### Step 3: Commit Documentation Updates

```bash
git add CHANGELOG.md README.md
git commit -m "docs: prepare release 00.00.01"
git push origin main
```

### Step 4: Create Git Tag

```bash
# Create annotated tag
git tag -a v00.00.01 -m "Release 00.00.01 - Feature Name

- Feature 1 description
- Feature 2 description
- Bug fix description
"

# Verify tag created
git tag -l -n9 v00.00.01
```

### Step 5: Push Tag

```bash
# Push tag to remote
git push origin v00.00.01

# Or push all tags
git push origin --tags
```

### Step 6: Create GitHub Release

```bash
# Using GitHub CLI
gh release create v00.00.01 \
  --title "00.00.01 - Feature Name" \
  --notes "## What's New

### Added
- Feature 1 description
- Feature 2 description

### Fixed
- Bug fix description

### Documentation
- Updated deployment guide
- Added API documentation

**Full Changelog:** [CHANGELOG.md](CHANGELOG.md)
"
```

Or create manually on GitHub:
1. Go to: https://github.com/your-org/hustle/releases/new
2. Tag: `v00.00.01`
3. Title: `00.00.01 - Feature Name`
4. Description: Copy from CHANGELOG.md
5. Click "Publish release"

### Step 7: Verify Release

```bash
# Check tag exists
git tag -l v00.00.01

# Check GitHub release
gh release view v00.00.01

# Verify version in README matches
grep "version-" README.md
```

### Step 8: Announce (Optional)

For significant releases:
- Update project status in team chat
- Post to social media if public
- Email stakeholders if applicable
- Update project boards/roadmap

---

## 🔄 Release Automation (Future)

Eventually we'll automate this with scripts:

```bash
# Future automation
./scripts/release.sh 00.00.01 "Feature Name"
```

This script would:
1. Validate version is current + 0.00.01
2. Update CHANGELOG.md template
3. Update README.md badge
4. Commit changes
5. Create and push tag
6. Create GitHub release
7. Post notifications

---

## 📊 Release Types & Cadence

### Feature Releases
- New functionality complete
- User-facing improvements
- Typically: v00.00.XX

### Bug Fix Releases
- Critical bug fixes
- Security patches
- Typically: v00.00.XX (same increment)

### Documentation Releases
- Major documentation overhauls
- New guides or tutorials
- Typically: v00.00.XX (same increment)

**All releases use the same increment: +0.00.01**

---

## 🎯 Release Naming Convention

Format: `[Version] - [Short Description]`

**Good Examples:**
- `00.00.01 - NextAuth Migration Complete`
- `00.00.02 - Game Logging UI`
- `00.00.03 - Photo Upload Feature`
- `00.00.04 - Critical Auth Fix`

**Bad Examples:**
- `00.00.01 - Updates` (too vague)
- `00.00.01 - Fixed stuff` (unprofessional)
- `00.00.01 - Complete rewrite of entire application` (too long)

---

## 🔍 Release Verification Script

```bash
#!/bin/bash
# verify-release.sh

# Check current version
CURRENT=$(git describe --tags --abbrev=0)
echo "Current version: $CURRENT"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo "❌ Uncommitted changes detected"
  exit 1
fi

# Check CHANGELOG updated
if ! grep -q "$CURRENT" CHANGELOG.md; then
  echo "❌ CHANGELOG.md not updated for $CURRENT"
  exit 1
fi

# Check README badge
if ! grep -q "version-${CURRENT#v}" README.md; then
  echo "❌ README.md badge not updated"
  exit 1
fi

echo "✅ Release verification passed"
```

---

## 📝 Release Template

Copy this template for release notes:

```markdown
## [00.00.XX] - YYYY-MM-DD - Feature Name

### 🎯 Highlights
- Main feature or change

### ✅ Added
- New feature 1
- New feature 2

### 🔄 Changed
- Changed behavior 1
- Updated component 2

### 🐛 Fixed
- Bug fix 1
- Bug fix 2

### 🔒 Security
- Security improvement 1

### 📝 Documentation
- New doc 1
- Updated doc 2

### 🧪 Known Issues
- Known issue 1 (workaround: ...)
```

---

## 🚫 Common Mistakes to Avoid

1. **Skipping versions** - Don't go v00.00.05 → v00.00.07
2. **Forgetting to update CHANGELOG** - Always update before tagging
3. **Mismatched version numbers** - Tag, release, and docs must match
4. **Creating tag before commit** - Commit docs first, then tag
5. **Not testing before release** - Always test the release candidate

---

## 🆘 Troubleshooting

### Wrong Tag Created

```bash
# Delete local tag
git tag -d v00.00.XX

# Delete remote tag
git push origin :refs/tags/v00.00.XX

# Recreate correctly
git tag -a v00.00.XX -m "Correct message"
git push origin v00.00.XX
```

### Need to Patch a Release

**Don't modify existing releases.** Create a new release:
- Current broken release: v00.00.10
- Create fix: v00.00.11
- Document in CHANGELOG as hotfix

---

**Remember:** Sequential versioning means no confusion, no debates, no special cases. Just +0.00.01 every time.

---

**Last Updated:** 2025-10-05
