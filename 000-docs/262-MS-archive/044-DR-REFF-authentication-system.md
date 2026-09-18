# Authentication System Documentation

**Document Type:** Reference
**Status:** Complete
**Last Updated:** 2025-10-07
**Version:** 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Flows](#user-flows)
4. [API Endpoints](#api-endpoints)
5. [Email Templates](#email-templates)
6. [Security Features](#security-features)
7. [Configuration](#configuration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Hustle authentication system provides complete user authentication with email verification and password reset capabilities. Built on NextAuth v5 with JWT sessions and Prisma ORM.

### Key Features

- ✅ Email/Password registration
- ✅ Email verification (24-hour token expiration)
- ✅ Password reset (1-hour token expiration)
- ✅ Secure password hashing (bcrypt, 10 rounds)
- ✅ Professional email templates
- ✅ Email verification enforcement on login
- ✅ Resend verification email functionality
- ✅ Security best practices (no email enumeration)

### Technology Stack

- **NextAuth v5** (beta.29) - JWT-based authentication
- **Prisma ORM** - Database client
- **PostgreSQL** - Database
- **Resend** - Email delivery (3,000 emails/month free tier)
- **bcrypt** - Password hashing
- **crypto** - Token generation

---

## Architecture

### Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  firstName     String
  lastName      String
  email         String    @unique
  emailVerified DateTime?
  phone         String?
  password      String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  passwordResetTokens      PasswordResetToken[]
  emailVerificationTokens  EmailVerificationToken[]
}

model EmailVerificationToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expires   DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expires   DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Directory Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── register/route.ts           # User registration + send verification email
│   │       ├── verify-email/route.ts       # Verify email token
│   │       ├── resend-verification/route.ts # Resend verification email
│   │       ├── forgot-password/route.ts    # Request password reset
│   │       └── reset-password/route.ts     # Reset password with token
│   ├── login/page.tsx                      # Login page
│   ├── register/page.tsx                   # Registration page (existing)
│   ├── verify-email/page.tsx               # Email verification page
│   ├── forgot-password/page.tsx            # Forgot password page
│   ├── reset-password/page.tsx             # Reset password page
│   └── resend-verification/page.tsx        # Resend verification page
├── lib/
│   ├── auth.ts                             # NextAuth configuration
│   ├── email.ts                            # SendGrid email service
│   ├── email-templates.ts                  # Professional email templates
│   └── tokens.ts                           # Token generation/validation utilities
```

---

## User Flows

### 1. Registration Flow

```
User submits registration form
    ↓
API validates input (email format, password length)
    ↓
API checks if email already exists
    ↓
API hashes password with bcrypt (10 rounds)
    ↓
API creates user in database (emailVerified = null)
    ↓
API generates email verification token (24-hour expiration)
    ↓
API sends verification email via SendGrid
    ↓
User receives "Check your email" message
```

**API Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "password": "SecurePass123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email to verify your account.",
  "emailSent": true
}
```

### 2. Email Verification Flow

```
User clicks verification link in email
    ↓
Browser navigates to /verify-email?token=abc123
    ↓
Page calls GET /api/auth/verify-email?token=abc123
    ↓
API validates token (checks expiration, existence)
    ↓
API updates user.emailVerified = current timestamp
    ↓
API deletes used token
    ↓
API sends welcome email
    ↓
Page shows success message
    ↓
Auto-redirect to /login after 3 seconds
```

**Verification Link Format:**
```
https://your-domain.com/verify-email?token=<64-char-hex-token>
```

**API Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in.",
  "welcomeEmailSent": true
}
```

### 3. Login Flow

```
User submits login credentials
    ↓
NextAuth calls authorize() function
    ↓
API finds user by email
    ↓
API validates password with bcrypt.compare()
    ↓
API checks if emailVerified is set
    ↓ (if not verified)
Login rejected with error message
    ↓ (if verified)
JWT token created and session established
    ↓
User redirected to /dashboard
```

**Error Message for Unverified Email:**
```
"Please verify your email before logging in. Check your inbox for the verification link."
```

### 4. Forgot Password Flow

```
User navigates to /forgot-password
    ↓
User enters email address
    ↓
API finds user by email (or silently succeeds for security)
    ↓
API generates password reset token (1-hour expiration)
    ↓
API sends reset email via SendGrid
    ↓
User receives "Check your email" message
```

**API Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (Always Success):**
```json
{
  "success": true,
  "message": "If an account with that email exists, we sent a password reset link."
}
```

### 5. Password Reset Flow

```
User clicks reset link in email
    ↓
Browser navigates to /reset-password?token=xyz789
    ↓
User enters new password (twice for confirmation)
    ↓
Page calls POST /api/auth/reset-password
    ↓
API validates token (checks expiration, existence)
    ↓
API hashes new password with bcrypt (10 rounds)
    ↓
API updates user.password
    ↓
API deletes used token
    ↓
API sends password changed confirmation email
    ↓
Page shows success message
    ↓
Auto-redirect to /login after 3 seconds
```

**API Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "xyz789...",
  "password": "NewSecurePass456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password.",
  "confirmationEmailSent": true
}
```

### 6. Resend Verification Email Flow

```
User navigates to /resend-verification
    ↓
User enters email address
    ↓
API finds user by email (or silently succeeds for security)
    ↓
API checks if already verified
    ↓ (if already verified)
API returns success with "already verified" message
    ↓ (if not verified)
API generates new verification token
    ↓
API sends verification email
    ↓
User receives "Check your email" message
```

**API Endpoint:** `POST /api/auth/resend-verification`

---

## API Endpoints

### POST /api/auth/register

Creates a new user account and sends verification email.

**Authentication:** None (public)

**Request Body:**
```typescript
{
  firstName: string;    // Required, min 1 char
  lastName: string;     // Required, min 1 char
  email: string;        // Required, valid email format
  phone?: string;       // Optional
  password: string;     // Required, min 8 chars
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email to verify your account.",
  "emailSent": true
}
```

**Error Responses:**
- **400:** Missing required fields, invalid email, password too short
- **409:** Email already exists
- **500:** Server error

---

### GET /api/auth/verify-email?token=<token>

Verifies user's email address using the token from verification email.

**Authentication:** None (public)

**Query Parameters:**
- `token` (required): 64-character hex token

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in.",
  "welcomeEmailSent": true
}
```

**Error Responses:**
- **400:** Missing token, invalid token, expired token
- **500:** Server error

---

### POST /api/auth/forgot-password

Initiates password reset process by sending reset email.

**Authentication:** None (public)

**Request Body:**
```typescript
{
  email: string;  // Required, valid email format
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, we sent a password reset link."
}
```

**Notes:**
- Always returns success to prevent email enumeration
- If email doesn't exist, silently succeeds without sending email

**Error Responses:**
- **400:** Missing email, invalid email format
- **500:** Server error (only if email sending fails)

---

### POST /api/auth/reset-password

Resets user's password using the token from reset email.

**Authentication:** None (public)

**Request Body:**
```typescript
{
  token: string;    // Required, 64-character hex token
  password: string; // Required, min 8 chars
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password.",
  "confirmationEmailSent": true
}
```

**Error Responses:**
- **400:** Missing fields, password too short, invalid/expired token
- **500:** Server error

---

### POST /api/auth/resend-verification

Resends email verification link to user.

**Authentication:** None (public)

**Request Body:**
```typescript
{
  email: string;  // Required, valid email format
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent successfully. Please check your inbox."
}
```

**Notes:**
- If email already verified: Returns success with "already verified" message
- If email doesn't exist: Silently succeeds (prevents enumeration)

**Error Responses:**
- **400:** Missing email, invalid email format
- **500:** Server error (only if email sending fails)

---

## Email Templates

All emails use professional HTML templates with Hustle branding.

### 1. Email Verification

**Subject:** "Verify your Hustle account"

**Expiration:** 24 hours

**Content:**
- Welcome message with user's first name
- Clear CTA button: "Verify Email Address"
- Fallback link (copy/paste)
- Expiration warning (highlighted in red)
- Benefits of verification (bulleted list)
- Footer with "didn't create account" message

**Template Function:** `emailTemplates.emailVerification(name, verificationUrl)`

---

### 2. Password Reset

**Subject:** "Reset your Hustle password"

**Expiration:** 1 hour

**Content:**
- Password reset request confirmation
- User's email address displayed
- Clear CTA button: "Reset Password"
- Fallback link (copy/paste)
- Expiration warning (highlighted in red, 1 hour)
- Security reminder (bullet points)
- Footer with "didn't request this" message

**Template Function:** `emailTemplates.passwordReset(email, resetUrl)`

---

### 3. Welcome Email

**Subject:** "Welcome to Hustle - Let's Get Started!"

**Sent:** After successful email verification

**Content:**
- Celebration message with emoji
- Confirmation that email is verified
- Getting started guide (numbered steps)
- Clear CTA button: "Go to Dashboard"
- Help center link

**Template Function:** `emailTemplates.welcome(name)`

---

### 4. Password Changed Confirmation

**Subject:** "Your Hustle password was changed"

**Sent:** After successful password reset

**Content:**
- Confirmation of password change
- Timestamp of change
- Warning box for unauthorized changes
- Security best practices
- Support contact information

**Template Function:** `emailTemplates.passwordChanged(email)`

---

## Security Features

### 1. Password Security

- **Hashing:** bcrypt with 10 rounds (per CLAUDE.md standards)
- **Minimum Length:** 8 characters
- **Never Stored Plain:** Always hashed before database storage

```typescript
const hashedPassword = await bcrypt.hash(password, 10);
```

### 2. Token Security

- **Generation:** `crypto.randomBytes(32).toString('hex')` (64-char hex)
- **Uniqueness:** Database unique constraint
- **One-Time Use:** Deleted after successful verification/reset
- **Expiration:**
  - Email verification: 24 hours
  - Password reset: 1 hour

```typescript
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
```

### 3. Email Enumeration Prevention

Never reveal if email exists in system:

```typescript
// Forgot password - always returns success
if (!user) {
  return NextResponse.json({
    success: true,
    message: "If an account with that email exists, we sent a password reset link."
  });
}
```

### 4. Email Verification Enforcement

Users cannot log in until email is verified:

```typescript
// In NextAuth authorize() function
if (!user.emailVerified) {
  throw new Error("Please verify your email before logging in...");
}
```

### 5. Token Cleanup

Expired tokens automatically deleted on verification attempt:

```typescript
if (verificationToken.expires < new Date()) {
  await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
  return null;
}
```

### 6. Database Cascading Deletes

If user is deleted, all tokens are automatically deleted:

```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

---

## Configuration

### Environment Variables

Required in `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://hustle_admin:password@localhost:5432/hustle_mvp"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:4000"

# Resend Email (Free tier: 3,000 emails/month)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxx"
EMAIL_FROM="Hustle <onboarding@resend.dev>"
```

### Resend Setup

1. **Create Resend account** at https://resend.com (no credit card required)
2. **Generate API key**:
   - Go to API Keys in dashboard
   - Click "Create API Key"
   - Name it (e.g., "Hustle Development")
   - Copy the key (shown only once)
3. **Add key to `.env.local`** as `RESEND_API_KEY`
4. **Set EMAIL_FROM**:
   - For development: Use `"Hustle <onboarding@resend.dev>"` (Resend's test domain)
   - For production: Use your verified domain `"Hustle <noreply@yourdomain.com>"`
5. **Verify your domain** (for production):
   - Go to Domains in Resend dashboard
   - Add your domain
   - Add DNS records provided by Resend
   - Wait for verification (usually 5-10 minutes)

**Free Tier Limits:**
- 3,000 emails/month
- 100 emails/day
- Perfect for development and small production apps

### Database Setup

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio
```

---

## Testing

### Manual Testing Checklist

#### Registration Flow
- [ ] Submit registration form with valid data
- [ ] Verify user created in database (emailVerified = null)
- [ ] Check verification email received in inbox
- [ ] Verify email has clickable button and fallback link
- [ ] Check expiration time displayed (24 hours)

#### Email Verification Flow
- [ ] Click verification link in email
- [ ] Verify redirected to verification page
- [ ] Check success message displayed
- [ ] Verify user.emailVerified updated in database
- [ ] Check welcome email received
- [ ] Verify token deleted from database

#### Login Flow (Unverified)
- [ ] Try to log in without verifying email
- [ ] Verify error message displayed
- [ ] Check "Resend verification email" link shown
- [ ] Verify cannot access dashboard

#### Login Flow (Verified)
- [ ] Log in with verified email
- [ ] Verify redirected to dashboard
- [ ] Check session created
- [ ] Verify can access protected pages

#### Forgot Password Flow
- [ ] Navigate to forgot password page
- [ ] Submit email address
- [ ] Check reset email received
- [ ] Verify email has clickable button
- [ ] Check expiration time displayed (1 hour)
- [ ] Submit non-existent email (should still show success)

#### Password Reset Flow
- [ ] Click reset link in email
- [ ] Enter new password (matching confirmation)
- [ ] Submit reset form
- [ ] Check success message
- [ ] Verify password updated in database
- [ ] Check confirmation email received
- [ ] Try logging in with old password (should fail)
- [ ] Log in with new password (should succeed)

#### Resend Verification Flow
- [ ] Navigate to resend verification page
- [ ] Submit unverified email
- [ ] Check new verification email received
- [ ] Verify old token deleted from database
- [ ] Submit already-verified email (should show "already verified")

### Automated Testing

Create Playwright tests at `/03-Tests/e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication System', () => {
  test('complete registration and verification flow', async ({ page }) => {
    // Registration
    await page.goto('/register');
    await page.fill('[name="firstName"]', 'Test');
    await page.fill('[name="lastName"]', 'User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestPass123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/check your email/i')).toBeVisible();

    // TODO: Get verification token from test email service
    // TODO: Visit verification page
    // TODO: Assert success
  });

  test('blocks login for unverified users', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'unverified@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/verify your email/i')).toBeVisible();
  });
});
```

---

## Troubleshooting

### Problem: Verification email not received

**Possible Causes:**
1. Resend API key not configured
2. Email in spam folder
3. Daily/monthly limit reached (100/day, 3,000/month on free tier)
4. Invalid EMAIL_FROM format

**Solutions:**
1. Check `.env.local` has valid `RESEND_API_KEY`
2. Check spam/junk folder
3. Check Resend dashboard for usage limits
4. Ensure EMAIL_FROM follows format: `"Name <email@domain.com>"`
5. For development, use Resend's test domain: `"Hustle <onboarding@resend.dev>"`

**Check Logs:**
```bash
# Look for email sending errors in dev server output
# Or check server logs
grep -i "\[email\]" .next/server/app/*.log
```

**Resend Dashboard:**
- View sent emails at https://resend.com/emails
- Check API usage and limits
- View error logs for failed sends

---

### Problem: "Invalid or expired verification token"

**Possible Causes:**
1. Token expired (24 hours passed)
2. Token already used
3. Token manually deleted from database

**Solutions:**
1. Use "Resend verification email" feature
2. Register a new account if necessary

**Database Check:**
```sql
SELECT * FROM email_verification_tokens WHERE token = 'your-token-here';
```

---

### Problem: Password reset link doesn't work

**Possible Causes:**
1. Token expired (1 hour passed)
2. Token already used
3. URL encoding issue

**Solutions:**
1. Request new password reset
2. Ensure entire URL is copied (check for line breaks)

**Database Check:**
```sql
SELECT * FROM password_reset_tokens
WHERE expires > NOW()
ORDER BY "createdAt" DESC;
```

---

### Problem: Database migration issues

**Error:** `ERROR: syntax error at or near ","`

**Solution:**
```bash
# Manually create tables if migration fails
DATABASE_URL="postgresql://hustle_admin:password@localhost:5432/hustle_mvp" npx prisma db push --accept-data-loss

# Or manually run SQL:
psql -U hustle_admin -d hustle_mvp < prisma/migrations/create_token_tables.sql
```

---

### Problem: Port conflict (3000 in use)

**Solution:**
```bash
# Specify different port
npm run dev -- -p 4000

# Or update package.json:
"dev": "next dev --turbopack -p 4000"
```

---

## Appendices

### A. Token Table Indexes

For optimal performance, ensure these indexes exist:

```sql
CREATE INDEX IF NOT EXISTS "email_verification_tokens_token_idx"
  ON "email_verification_tokens"("token");

CREATE INDEX IF NOT EXISTS "email_verification_tokens_userId_idx"
  ON "email_verification_tokens"("userId");

CREATE INDEX IF NOT EXISTS "email_verification_tokens_expires_idx"
  ON "email_verification_tokens"("expires");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx"
  ON "password_reset_tokens"("token");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_userId_idx"
  ON "password_reset_tokens"("userId");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_idx"
  ON "password_reset_tokens"("expires");
```

### B. Cleanup Cron Job

To automatically delete expired tokens, add this cron job:

```typescript
// /src/app/api/cron/cleanup-tokens/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const now = new Date();

  const deletedVerification = await prisma.emailVerificationToken.deleteMany({
    where: { expires: { lt: now } }
  });

  const deletedReset = await prisma.passwordResetToken.deleteMany({
    where: { expires: { lt: now } }
  });

  return NextResponse.json({
    success: true,
    deleted: {
      verificationTokens: deletedVerification.count,
      resetTokens: deletedReset.count
    }
  });
}
```

Run daily:
```bash
# Crontab entry
0 2 * * * curl http://localhost:4000/api/cron/cleanup-tokens
```

---

**Document Maintenance:**
- Review quarterly
- Update on major changes
- Test all flows before releases

**Last Review:** 2025-10-07
**Next Review:** 2026-01-07
