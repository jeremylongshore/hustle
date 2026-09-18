# Hustle Login/Auth Verification Runbook

## Quick Verification Steps

### 1. Basic Login Test

1. Go to https://hustlestats.io/login
2. Enter test credentials (see below)
3. Click "Sign In"
4. **Expected**: Redirect to /dashboard within 5-10 seconds
5. **Failure indicators**:
   - Button stays in "Signing In..." state for >30 seconds = HANG
   - No error message appears = HANG
   - Error message appears = Auth issue (see troubleshooting)

### 2. Test Credentials

For smoke testing, use:
- Email: `SMOKE_TEST_EMAIL` (from CI secrets)
- Password: `SMOKE_TEST_PASSWORD` (from CI secrets)

For production debugging:
- Create a test account via https://hustlestats.io/register
- Verify email before testing login

### 3. Health Check

```bash
curl https://hustlestats.io/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "firestore": { "status": "pass" },
    "environment": { "status": "pass" }
  }
}
```

---

## Common Issues and Fixes

### Issue: UI Freezes / Hangs on Login

**Symptoms:**
- Button shows "Signing In..." indefinitely
- No error message appears
- No redirect happens

**Diagnosis Steps:**

1. **Check browser console** (F12 → Console tab):
   - Look for `[Firebase]` messages
   - Look for `[Login]` messages
   - Look for `[signIn]` messages

2. **Identify which step failed:**
   - `[Login] Step 1 FAILED` → Firebase Auth issue
   - `[Login] Step 2 FAILED` → Token issue
   - `[Login] Step 3 FAILED` → Server session issue
   - `TIMEOUT` in any message → Network/server slowness

**Common Causes:**

| Console Message | Likely Cause | Fix |
|-----------------|--------------|-----|
| `auth/invalid-api-key` | Firebase config wrong | Check env vars in deployment |
| `auth/network-request-failed` | Network issue | Check user's connection |
| `auth/user-not-found` | User doesn't exist | User needs to register |
| `auth/wrong-password` | Wrong password | User needs to reset password |
| `Step 3 FAILED` with 500 | Server-side issue | Check Cloud Run logs |
| `UNAUTHENTICATED` in server logs | Firebase Admin creds bad | Check FIREBASE_SERVICE_ACCOUNT_JSON |

### Issue: Email Verification Required

**Symptoms:**
- Error: "Please verify your email before logging in"

**Fix:**
1. User needs to check email for verification link
2. Or use: https://hustlestats.io/resend-verification

### Issue: Redirect Loop (login → dashboard → login)

**Symptoms:**
- Page keeps redirecting between /login and /dashboard

**Cause:** Session cookie not being set or not being sent

**Diagnosis:**
1. Check browser DevTools → Application → Cookies
2. Look for `__session` cookie
3. If missing: Cookie not being set (server issue)
4. If present but not working: Cookie domain/secure settings wrong

**Fix:**
- Check Cloud Run env: `NODE_ENV=production`
- Ensure HTTPS is working properly
- Check `NEXT_PUBLIC_E2E_TEST_MODE` is NOT set to true in prod

---

## Firebase Console Checks

### 1. Authorized Domains

**Location:** Firebase Console → Authentication → Settings → Authorized domains

**Required domains:**
- `hustlestats.io` ← CRITICAL
- `www.hustlestats.io` (if used)
- `hustleapp-production.firebaseapp.com`
- `localhost` (for local dev)

**If missing:** Add `hustlestats.io` to the list

### 2. Sign-in Methods

**Location:** Firebase Console → Authentication → Sign-in method

**Required:**
- Email/Password: **Enabled**
- Email link (passwordless): Can be disabled

### 3. User Accounts

**Location:** Firebase Console → Authentication → Users

**To verify user exists:**
1. Search by email
2. Check if `emailVerified` is true
3. Check `createdAt` timestamp

---

## Cloud Run / Server-Side Checks

### 1. Check Logs

```bash
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=hustle-app" \
  --limit=50 --project=hustleapp-production
```

**Look for:**
- `[set-session]` messages for login attempts
- `UNAUTHENTICATED` errors (Firebase Admin SDK issue)
- `Token verification failed` (expired or invalid token)

### 2. Check Environment Variables

```bash
gcloud run services describe hustle-app \
  --region us-central1 --project hustleapp-production \
  --format="yaml(spec.template.spec.containers[0].env)"
```

**Required env vars:**
- `FIREBASE_PROJECT_ID` = `hustleapp-production`
- `FIREBASE_SERVICE_ACCOUNT_JSON` = (secret reference)
- `NODE_ENV` = `production`

### 3. Check Health

```bash
curl https://hustle-app-335713777643.us-central1.run.app/api/health
```

---

## Emergency Fixes

### If Firebase Admin SDK Fails

1. Rotate the service account key:
   ```bash
   gcloud iam service-accounts keys create /tmp/new-key.json \
     --iam-account firebase-adminsdk-fbsvc@hustleapp-production.iam.gserviceaccount.com
   ```

2. Update the secret:
   ```bash
   gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT_JSON \
     --data-file=/tmp/new-key.json --project=hustleapp-production
   ```

3. Redeploy Cloud Run:
   ```bash
   gcloud run services update hustle-app --region us-central1 \
     --update-env-vars "DEPLOYMENT_TIMESTAMP=$(date +%s)"
   ```

### If Cookie Issues

Check the set-session API is setting correct cookie flags:
- `secure: true` (production)
- `sameSite: 'lax'`
- `path: '/'`
- `httpOnly: true`

---

## Monitoring

### Alerts to Set Up

1. **Login Error Rate**: Alert if >10% of login attempts fail
2. **Health Check**: Alert if /api/health returns non-200
3. **Session API Errors**: Alert if set-session returns 500s

### Key Metrics

- Login success rate
- Average login time (should be <5s)
- Session cookie set success rate

---

## Testing After Fixes

After making any fix:

1. **Manual test:**
   - Go to https://hustlestats.io/login
   - Log in with test account
   - Verify redirect to dashboard
   - Refresh page - should stay on dashboard

2. **E2E test:**
   ```bash
   SMOKE_TEST_EMAIL=... SMOKE_TEST_PASSWORD=... npm run test:e2e -- 07-login-behavior.spec.ts
   ```

3. **Smoke test:**
   ```bash
   SMOKE_TEST_EMAIL=... SMOKE_TEST_PASSWORD=... npm run qa:e2e:smoke
   ```
