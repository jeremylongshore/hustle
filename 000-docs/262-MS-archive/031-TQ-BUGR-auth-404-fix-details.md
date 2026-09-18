# Fix Implementation Details

**Date**: 2025-10-05 22:15 UTC

## Fix 1: Landing Page Links

**File**: `src/app/page.tsx`

**Changes**:
- Line 17: `/auth` → `/login` (header Sign In)
- Line 51: `/auth` → `/register` (primary CTA Begin Tracking)  
- Line 105: `/auth` → `/login` (footer Sign In)
- Line 106: `/auth` → `/register` (footer Get Started)

**Diff**: See `001-bug-landing-page-fix.patch`

## Fix 2: Registration API Endpoint

**File**: `src/app/api/auth/register/route.ts` (CREATED)

**Implementation**:
- Validates all required fields (firstName, lastName, email, password)
- Email format validation with regex
- Password minimum 8 characters
- Checks for duplicate email (409 Conflict)
- Bcrypt password hashing (10 rounds per security standards)
- Prisma database user creation
- Returns 201 Created on success
- Generic error messages (no data leakage)

**Security Compliance**:
✅ Bcrypt 10 rounds (per CLAUDE.md)
✅ Never stores plaintext passwords
✅ Validates all inputs
✅ Returns generic errors (doesn't leak "email exists" details)
