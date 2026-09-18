# Fix: Landing Page Link Updates

**Date**: 2025-10-05 22:16 UTC
**File**: `src/app/page.tsx`

## Changes Made

| Line | Old | New | Purpose |
|------|-----|-----|---------|
| 17 | `href="/auth"` | `href="/login"` | Header Sign In |
| 51 | `href="/auth"` | `href="/register"` | Primary CTA |
| 105 | `href="/auth"` | `href="/login"` | Footer Sign In |
| 106 | `href="/auth"` | `href="/register"` | Footer Get Started |

## Verification

```bash
$ grep 'href="/auth"' src/app/page.tsx
(no results - all fixed)
```
