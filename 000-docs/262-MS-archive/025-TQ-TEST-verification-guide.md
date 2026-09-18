# Testing & Verification Guide

**Date**: 2025-10-05 22:20 UTC  
**Server**: Running on http://localhost:4000

## Quick Verification Checklist

### ✅ Step 1: Landing Page Links
**URL**: http://localhost:4000

Test all CTAs:
- [ ] Header "Sign In" → Should go to `/login`
- [ ] Hero "Begin Tracking" → Should go to `/register`
- [ ] Footer "Sign In" → Should go to `/login`
- [ ] Footer "Get Started" → Should go to `/register`

**Expected**: All buttons navigate to correct pages (NO 404 errors)

---

### ✅ Step 2: User Registration
**URL**: http://localhost:4000/register

**Test User Data**:
```
First Name: Test
Last Name: User
Email: test@example.com
Phone: 5551234567
Password: TestPass123!
Confirm Password: TestPass123!
```

**Steps**:
1. Fill out registration form
2. Click "Create Account"
3. **Expected**: Success redirect to `/login?registered=true`
4. **Verify**: Check database for hashed password (NOT plaintext)

---

### ✅ Step 3: User Login
**URL**: http://localhost:4000/login

**Credentials**:
```
Email: test@example.com
Password: TestPass123!
```

**Steps**:
1. Enter credentials
2. Click "Sign In"
3. **Expected**: Redirect to `/dashboard`
4. **Expected**: See personalized dashboard

---

### ✅ Step 4: Dashboard Access
**URL**: http://localhost:4000/dashboard

**Without Login**: Should redirect to `/login`  
**With Login**: Should show dashboard with:
- Welcome message
- Stats cards (0 games initially)
- Quick Actions: "Log a Game", "Complete Your Profile"

---

## Database Verification

### Check User Was Created

```bash
# Using Prisma Studio (GUI)
npx prisma studio

# Then check Users table for:
# - Email: test@example.com
# - Password: Should be bcrypt hash (starts with $2b$)
# - NOT plaintext "TestPass123!"
```

### Verify Password Hashing

**Correct**: Password looks like: `$2b$10$abcd1234...` (60 chars)  
**WRONG**: Password is `TestPass123!` (plaintext - SECURITY ISSUE)

---

## Testing Duplicate Email

**Steps**:
1. Try to register same email again: `test@example.com`
2. **Expected**: Error message "An account with this email already exists"
3. **HTTP Status**: 409 Conflict

---

## Authentication Flow Summary

```
Landing Page (/)
    ↓ Click "Begin Tracking"
Register (/register)
    ↓ Submit form → POST /api/auth/register
    ↓ Success
Login (/login?registered=true)
    ↓ Enter credentials → POST /api/auth/[...nextauth]
    ↓ NextAuth validates with bcrypt.compare()
Dashboard (/dashboard)
    ✓ Authenticated session
```

---

## Current Server Status

**Dev Server**: ✅ Running on http://localhost:4000  
**Database**: PostgreSQL via Docker (port 5432)  
**NextAuth**: JWT strategy, 30-day sessions

---

## Manual Test Script

```bash
# 1. Open browser to landing page
open http://localhost:4000

# 2. Click "Begin Tracking" → Should reach /register
# 3. Fill form and submit → Should create user
# 4. Login with credentials → Should reach /dashboard
# 5. Check database to verify password is hashed

# Verify in Prisma Studio
npx prisma studio
# Navigate to User table
# Check password field starts with $2b$10$
```

---

## Success Criteria

✅ All landing page links work (no 404)  
✅ Registration creates user in database  
✅ Password is bcrypt hashed (not plaintext)  
✅ Login works with new account  
✅ Dashboard loads for authenticated users  
✅ Dashboard redirects to /login when not authenticated  
✅ Duplicate email rejected with 409 error

---

## Next Steps After Verification

Once manual testing confirms all works:
1. ✅ Commit changes to git
2. ✅ Deploy to production
3. ✅ Add E2E tests (Playwright/Cypress)
4. ✅ Add monitoring for 404 errors

