# Firebase Console: Enable Email/Password Authentication
**Date:** 2025-11-18
**For:** Hustle Project (`hustleapp-production`)
**Owner:** Jeremy (Operator)
**Status:** ⚠️ Action Required

---

## Overview

This document provides step-by-step instructions for enabling and configuring Email/Password authentication in the Firebase Console for the Hustle application. This is a **manual operator task** that must be completed before the application can authenticate users in production.

---

## Prerequisites

- Access to Firebase Console: https://console.firebase.google.com
- Project: `hustleapp-production`
- Owner or Editor role on the Firebase project

---

## Step 1: Enable Email/Password Provider

1. **Navigate to Authentication**:
   - Go to: https://console.firebase.google.com/project/hustleapp-production/authentication
   - Click on "Get Started" if this is the first time setting up Authentication

2. **Access Sign-in Method Tab**:
   - Click on the "Sign-in method" tab
   - You should see a list of authentication providers

3. **Enable Email/Password**:
   - Find "Email/Password" in the list of providers
   - Click on it to open the configuration modal
   - Toggle the "Enable" switch to ON
   - **Email link (passwordless sign-in)**: Leave this DISABLED (we use password-based auth)
   - Click "Save"

**Verification**:
- The "Email/Password" provider should now show as "Enabled" with a green status indicator

---

## Step 2: Configure Email Verification Settings

1. **Access Templates**:
   - In the Authentication section, click on "Templates" tab
   - This controls the email templates sent to users

2. **Customize Email Verification Template** (Optional but Recommended):
   - Click on "Email address verification"
   - Customize the email template:
     - **From name**: "Hustle"
     - **Reply-to email**: noreply@hustleapp-production.firebaseapp.com (or your custom domain)
     - **Subject**: "Verify your Hustle account"
     - **Body**: Customize with your branding
   - Click "Save"

3. **Configure Action URL** (Important):
   - Set the action URL to your production domain
   - For production: `https://your-domain.com/__/auth/action`
   - For staging: Use your staging URL
   - This URL is where users land after clicking email verification links

**Verification**:
- Send a test verification email using the Firebase Console test feature
- Confirm the email arrives and links work correctly

---

## Step 3: Configure Password Reset Settings

1. **Access Password Reset Template**:
   - In "Templates" tab, click on "Password reset"

2. **Customize Reset Email**:
   - **From name**: "Hustle"
   - **Subject**: "Reset your Hustle password"
   - **Body**: Customize with clear instructions
   - **Action URL**: Same as email verification (handles both flows)
   - Click "Save"

3. **Set Password Policy** (Optional):
   - Go to "Settings" tab in Authentication
   - Scroll to "Password policy"
   - Configure minimum requirements:
     - **Minimum length**: 8 characters (default)
     - **Require uppercase**: Optional
     - **Require lowercase**: Optional
     - **Require numbers**: Optional
     - **Require special characters**: Optional
   - Click "Save"

**Verification**:
- Test password reset flow using the Console test feature
- Confirm reset emails arrive and work correctly

---

## Step 4: Configure Security Settings

1. **Set Email Enumeration Protection**:
   - Go to "Settings" tab
   - Find "Email enumeration protection"
   - **Recommended**: Enable this to prevent attackers from discovering registered emails
   - Click "Save"

2. **Configure Authorized Domains**:
   - Go to "Settings" tab
   - Scroll to "Authorized domains"
   - Ensure these domains are listed:
     - `localhost` (for local development)
     - `hustleapp-production.web.app` (Firebase hosting)
     - `hustleapp-production.firebaseapp.com` (Firebase hosting)
     - Your custom domain (if configured)
   - Add any missing domains
   - Click "Add domain" and enter the domain name

**Verification**:
- Test authentication from each authorized domain
- Confirm unauthorized domains are blocked

---

## Step 5: Set Up User Management

1. **Enable User Deletion**:
   - Go to "Users" tab
   - Firebase automatically tracks all registered users here
   - Confirm you can see the user management interface

2. **Configure User Import** (If Migrating from PostgreSQL):
   - Go to "Users" tab
   - Click "Import users"
   - Upload CSV or JSON with user data
   - **Required fields**: `localId` (uid), `email`, `passwordHash`
   - **Note**: Our migration script in `05-Scripts/migration/migrate-to-firestore.ts` handles this

3. **Set Up Admin SDK Service Account**:
   - Go to Project Settings (gear icon) → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely
   - **CRITICAL**: This file contains sensitive credentials
   - Add to `.env` as `FIREBASE_PRIVATE_KEY` and related vars
   - **Never commit this file to Git**

---

## Step 6: Configure Rate Limiting (Security)

1. **Review Rate Limits**:
   - Firebase applies default rate limits:
     - Sign-up: 100 per hour per IP
     - Sign-in: 100 per hour per IP
     - Password reset: 5 per hour per IP

2. **Enable reCAPTCHA** (Recommended for Production):
   - Go to "Settings" tab
   - Scroll to "App verification"
   - Enable "Phone sign-in" verification (this also protects Email/Password)
   - **Optional**: Add reCAPTCHA v3 for additional protection
   - Click "Save"

---

## Step 7: Test Authentication Flows

### Local Development Test

1. **Start Firebase Emulators**:
   ```bash
   cd ~/000-projects/hustle
   firebase emulators:start
   ```

2. **Access Emulator UI**:
   - Open: http://localhost:4000
   - Go to Authentication tab
   - Confirm Email/Password provider is enabled in emulator

3. **Test Registration**:
   - Start dev server: `npm run dev`
   - Navigate to: http://localhost:3000/register
   - Create a test account
   - Confirm user appears in emulator UI

4. **Test Login**:
   - Navigate to: http://localhost:3000/login
   - Log in with test account
   - Confirm redirect to dashboard works

### Production Test (After Deployment)

1. **Create Test User**:
   - In Firebase Console → Authentication → Users
   - Click "Add user"
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Confirm user is created

2. **Test Login Flow**:
   - Navigate to your production URL
   - Log in with test credentials
   - Confirm authentication works
   - Check dashboard access

3. **Test Email Verification**:
   - Create new account via `/register`
   - Check email inbox for verification email
   - Click verification link
   - Confirm account is verified in Console

4. **Test Password Reset**:
   - Go to `/forgot-password`
   - Enter test email
   - Check inbox for reset email
   - Complete password reset
   - Confirm new password works

---

## Verification Checklist

Complete these checks to confirm proper setup:

- [ ] Email/Password provider enabled in Firebase Console
- [ ] Email verification template configured
- [ ] Password reset template configured
- [ ] Authorized domains added (localhost + production domains)
- [ ] Email enumeration protection enabled
- [ ] Admin SDK service account generated and configured in `.env`
- [ ] Rate limiting reviewed and acceptable
- [ ] Local emulator test passed (register + login)
- [ ] Production test user created and works
- [ ] Email verification flow tested end-to-end
- [ ] Password reset flow tested end-to-end

---

## Troubleshooting

### Issue: "Email/Password provider not found"

**Cause**: Provider not enabled in Console
**Solution**: Follow Step 1 to enable the provider

### Issue: "Invalid action URL"

**Cause**: Action URL not configured or incorrect
**Solution**:
- Check Templates → Email verification → Action URL
- Must match your deployed domain
- Format: `https://your-domain.com/__/auth/action`

### Issue: "User not receiving verification emails"

**Cause**: Email delivery issues or template misconfiguration
**Solution**:
- Check spam folder
- Verify "From" email is not blocked
- Check Firebase Console → Authentication → Templates
- Review email delivery logs in Cloud Logging

### Issue: "Authentication works in emulator but not production"

**Cause**: Environment variable mismatch or missing credentials
**Solution**:
- Verify all `NEXT_PUBLIC_FIREBASE_*` vars are set in production
- Confirm Admin SDK credentials (`FIREBASE_PRIVATE_KEY`, etc.) are correct
- Check authorized domains include your production domain

### Issue: "Invalid API key"

**Cause**: Wrong API key in `NEXT_PUBLIC_FIREBASE_API_KEY`
**Solution**:
- Go to Project Settings → General
- Copy Web API Key
- Update environment variable
- Redeploy

---

## Related Documents

- `CLAUDE.md` - Project documentation with Firebase Auth architecture
- `000-docs/234-AA-SUMM-auth-monitoring-cleanup-complete.md` - Phase 1 cleanup summary
- `src/lib/auth.ts` - Server-side Firebase Auth implementation
- `src/lib/firebase/config.ts` - Client-side Firebase SDK configuration
- `.env.example` - Environment variable template

---

## Next Steps After Setup

Once Email/Password authentication is enabled:

1. **Deploy to Production**:
   ```bash
   firebase deploy --only hosting,functions
   ```

2. **Monitor Authentication**:
   - Firebase Console → Authentication → Users
   - Watch for new user registrations
   - Monitor sign-in activity

3. **Set Up Monitoring Alerts** (Phase 3):
   - Failed authentication rate
   - Unusual sign-in patterns
   - Password reset abuse

4. **Enable Custom Domain** (Optional):
   - Firebase Hosting → Custom domain
   - Configure DNS
   - SSL automatically provisioned

---

**Status**: ⚠️ **AWAITING OPERATOR ACTION**
**Estimated Time**: 15 minutes
**Blocking**: Production deployment

Once completed, update this document with:
- [ ] Date completed
- [ ] Operator name
- [ ] Any issues encountered
- [ ] Change status to ✅ **COMPLETE**
