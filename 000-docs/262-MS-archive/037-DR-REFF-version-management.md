# Version Management System

**Current Version:** `v00.00.00`

---

## 📐 Sequential Versioning - Crystal Clear

Hustle uses **sequential increment versioning**. No semantic versioning, no confusion, no exceptions.

### The Rule (Simple)

**Every release increments by exactly `0.00.01`**

```
v00.00.00 → Foundation release
v00.00.01 → First update
v00.00.02 → Second update
v00.00.03 → Third update
...
v00.00.09 → Ninth update
v00.00.10 → Tenth update
v00.00.11 → Eleventh update
...
v00.01.00 → Hundredth update
```

### What This Means

- **NO skipping versions** - We don't jump from v00.00.05 to v00.00.10
- **NO random versions** - We don't create v00.01.00 until we've done 100 releases
- **NO going backwards** - Once we're at v00.00.15, we can't go back to v00.00.14
- **Git tags match releases** - Tag `v00.00.05` = Release `00.00.05`

---

## 🏷️ Tags = Releases (Always)

Every Git tag creates a release. Every release has a Git tag. They're identical.

```bash
# Tag version 00.00.05
git tag -a v00.00.05 -m "Release 00.00.05 - Description"

# Push tag
git push origin main --tags

# Create GitHub release (same version)
gh release create v00.00.05 --title "00.00.05 - Description" --notes "Release notes"
```

**They increment together, always by 0.00.01**

---

## 📋 Version History

| Version | Date | Milestone | Status |
|---------|------|-----------|--------|
| v00.00.00 | 2025-10-05 | Foundation - Gate A Complete | ✅ Current |

---

## 🎯 Why Sequential?

1. **No arguments** - Next version is always current + 0.00.01
2. **Clear history** - Easy to see how many releases we've done
3. **No decisions** - No debating if something is "major" or "minor"
4. **Simple automation** - Scripts know exactly what to do
5. **Honest progress** - Version number shows real iteration count

---

## 🚀 Creating a New Version

See `RELEASES.md` for the complete release process.

Quick version:

```bash
# Get current version
CURRENT=$(git describe --tags --abbrev=0)

# Calculate next version (increment by 0.00.01)
# Current: v00.00.05 → Next: v00.00.06

# Create tag
git tag -a v00.00.06 -m "Release 00.00.06 - Feature name"

# Push
git push origin main --tags

# Create GitHub release
gh release create v00.00.06 --title "00.00.06 - Feature name"
```

---

## ✅ Version Checklist

Before creating any version:

- [ ] Current version is known (check `git describe --tags`)
- [ ] Next version is exactly +0.00.01 from current
- [ ] CHANGELOG.md is updated with new version
- [ ] README.md badge shows new version
- [ ] All tests pass
- [ ] Git tag matches release version exactly

---

**Remember:** Sequential means sequential. No exceptions. No special cases. Just +0.00.01 every time.

---

**Last Updated:** 2025-10-05
