# Hustle Auth Wiring Staging E2E - Mini AAR

**Document ID:** 188-AA-MAAR-hustle-auth-wiring-staging-e2e
**Type:** After-Action Report (Mini)
**Created:** 2025-11-15
**Status:** Analysis Complete - No Direct Testing Possible

---

## Executive Summary

**Mission:** Test Firebase Auth end-to-end flow on staging/production deployment via CI/CD pipeline.

**Outcome:** ⚠️ PARTIAL SUCCESS - Infrastructure verified, but cannot manually test auth flows without triggering new deployment.

**Risk Level:** 🟡 MEDIUM - Deployment infrastructure working, but no staging environment for safe testing.

---

## Deployment Infrastructure Analysis

### Current Deployment State

#### Production Cloud Run Service
**Status:** ✅ DEPLOYED AND RUNNING
**Service Name:** `hustle-app`
**URL:** https://hustle-app-d4f2hb75nq-uc.a.run.app
**Region:** us-central1
**Project:** hustleapp-production
**Health Check:** HTTP/2 200 (verified via curl)

**Evidence:**
```bash
$ curl -I https://hustle-app-d4f2hb75nq-uc.a.run.app
HTTP/2 200
x-powered-by: Next.js
x-nextjs-cache: HIT
content-type: text/html; charset=utf-8
server: Google Frontend
```

**Observations:**
- Next.js SSR working (x-powered-by header)
- Caching enabled (x-nextjs-cache: HIT)
- Landing page pre-rendered (x-nextjs-prerender: 1)
- Content served from Cloud Run successfully

---

#### Firebase Hosting
**Status:** ❌ NOT SERVING CONTENT (404)
**URL:** https://hustleapp-production.web.app
**Last Deploy:** 2025-11-15 14:17:47
**Channel:** live

**Evidence:**
```bash
$ curl -I https://hustleapp-production.web.app
HTTP/2 404
content-type: text/html; charset=utf-8
cache-control: max-age=0
```

**Issue:** Firebase Hosting returns 404 despite "live" channel showing recent deployment.

**Possible Causes:**
1. No build artifacts deployed to Hosting (only using Cloud Run for SSR)
2. Hosting rewrite rules may be routing to Cloud Run (hybrid setup)
3. DNS/CDN caching issue (x-cache: MISS)

**Investigation Required:** Check `firebase.json` rewrite rules to confirm if Hosting is configured to proxy to Cloud Run.

---

#### Firebase Web App
**Status:** ✅ REGISTERED
**App ID:** `1:335713777643:web:209e728afd5aee07c80bae`
**Display Name:** Hustle Web App
**Platform:** WEB

**Firebase SDK Configuration:**
```typescript
// From .env.example (production values)
NEXT_PUBLIC_FIREBASE_API_KEY="REDACTED_ROTATED_GOOGLE_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="hustleapp-production.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="hustleapp-production"
NEXT_PUBLIC_FIREBASE_APP_ID="1:335713777643:web:209e728afd5aee07c80bae"
```

**Verified:** App ID in `.env.example` matches Firebase Console registration.

---

### CI/CD Pipeline Analysis

#### GitHub Actions Workflows

**1. deploy.yml** (Cloud Run Deployment)
**Triggers:**
- Push to `main` branch → Production deployment
- Pull Request → Staging deployment

**Last 5 Runs:**
| Date | Status | Commit | Duration |
|------|--------|--------|----------|
| Nov 11 08:11 | ❌ FAILURE | Days 5-7 Complete | 2m53s |
| Nov 11 07:46 | ❌ FAILURE | Day 4 Migration Script | 2m38s |
| Nov 11 07:34 | ❌ FAILURE | Day 3 NextAuth→Firebase | 2m42s |
| Nov 11 07:31 | ✅ SUCCESS | Day 2 Firestore Schema | 3m21s |
| Nov 11 05:35 | ✅ SUCCESS | Day 1 Firebase Setup | 3m48s |

**Pattern:** Last 3 deployments failed after Firebase Auth implementation (Days 3-7).

**Failure Hypothesis:**
- Missing environment variables in GitHub Secrets (Firebase credentials)
- Build failures due to dependency issues
- TypeScript compilation errors
- Docker image push failures (seen in previous session: "retry budget exhausted")

---

**2. deploy-firebase.yml** (Firebase Resources Deployment)
**Triggers:**
- Push to `main` with changes to: `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `.firebaserc`, `functions/**`
- Manual workflow_dispatch

**Last 4 Runs:**
| Date | Status | Target | Duration |
|------|--------|--------|----------|
| Nov 11 05:27 | ✅ SUCCESS | Manual (all) | 2m20s |
| Nov 11 05:25 | ❌ FAILURE | Firestore indexes | 2m5s |
| Nov 11 05:22 | ❌ FAILURE | Manual | 1m59s |
| Nov 11 05:22 | ❌ FAILURE | WIF auth | 1m51s |

**Last Successful Deploy:** Nov 11 05:27 (manual workflow_dispatch for "all" resources)

**Deployment Targets:**
- `firestore:rules` - Security rules for Firestore
- `firestore:indexes` - Database indexes
- `functions` - Cloud Functions (including sendWelcomeEmail)

**Note:** This workflow does NOT deploy Hosting or Next.js app - only Firebase backend resources.

---

#### Deployment Architecture

**Current Setup (Hybrid):**
```
GitHub Push (main)
  ↓
deploy.yml
  ↓
Build Docker Image → Artifact Registry
  ↓
Deploy to Cloud Run (hustle-app)
  ↓
Service URL: https://hustle-app-[hash].a.run.app

(Separate workflow)
deploy-firebase.yml
  ↓
Deploy Firestore Rules/Indexes/Functions
  ↓
Firebase Backend Resources Updated
```

**Missing Piece:** No Firebase Hosting deployment in current workflows.

**Expected Hybrid Architecture:**
```
Firebase Hosting (CDN)
  ↓
Static Assets Served from Hosting
Dynamic Routes → Rewrite to Cloud Run
```

**Current Reality:** Only Cloud Run is serving traffic. Firebase Hosting is deployed but returns 404.

---

### Environment Variables in CI/CD

#### GitHub Secrets Required
**From deploy.yml line 33-34:**
```yaml
workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
```

**From deploy.yml line 60 (Cloud Run secrets):**
```yaml
--set-secrets "DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest"
```

**Analysis:**
- ✅ WIF authentication configured (Workload Identity Federation)
- ✅ PostgreSQL DATABASE_URL in Secret Manager
- ✅ NEXTAUTH_SECRET in Secret Manager
- ❌ NO Firebase environment variables configured for Cloud Run deployment

**Missing in deploy.yml:**
```yaml
# SHOULD HAVE (but doesn't):
--set-env-vars "NEXT_PUBLIC_FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }}" \
--set-env-vars "NEXT_PUBLIC_FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }}" \
# ... all 9 Firebase variables
```

**Critical Finding:** Cloud Run deployments do NOT inject Firebase environment variables. The deployed Next.js app cannot initialize Firebase SDK.

---

## Testing Limitations

### Cannot Execute Manual Auth Testing

**Reason 1: No Staging Environment**
- `deploy.yml` line 20: `if: github.event_name == 'pull_request'`
- Staging deployment ONLY triggers on PRs, not on main branch
- Current state: On main branch, no PR open
- **Impact:** Cannot test in isolated staging environment

**Reason 2: Production Deployment Uses Legacy Env Vars**
- Cloud Run deployment sets `NEXTAUTH_URL` (line 59)
- Uses NextAuth secrets (DATABASE_URL, NEXTAUTH_SECRET)
- Does NOT set any Firebase environment variables
- **Impact:** Production deployment cannot use Firebase Auth

**Reason 3: Recent Deployments Failed**
- Last 3 deployments (Days 3-7) all failed
- Failures occurred AFTER Firebase Auth code was added
- **Hypothesis:** Build failures due to missing Firebase env vars causing TypeScript errors or runtime crashes

---

### What We CAN Verify (Infrastructure Only)

#### ✅ Verified Working
1. **Cloud Run Service Deployed**
   - Service `hustle-app` responding on https://hustle-app-d4f2hb75nq-uc.a.run.app
   - Next.js SSR working (200 OK, HTML served)
   - Last successful deployment: Day 2 (before Firebase Auth code)

2. **Firebase Project Active**
   - Web app registered (`1:335713777643:web:209e728afd5aee07c80bae`)
   - Firebase Hosting channel "live" exists
   - Last hosting deploy: 2025-11-15 14:17:47

3. **Firestore Resources Deployed**
   - Last successful deploy-firebase.yml: Nov 11 05:27
   - Security rules deployed
   - Indexes deployed
   - Cloud Functions deployed (including sendWelcomeEmail)

4. **CI/CD Authentication Working**
   - Workload Identity Federation (WIF) configured
   - GitHub Actions can authenticate to GCP
   - Can deploy to Cloud Run and Firebase

#### ❌ Cannot Verify
1. **Firebase Auth E2E Flow**
   - Cannot test registration (no Firebase env vars in production)
   - Cannot test login (same reason)
   - Cannot test email verification (Cloud Functions may work, but frontend won't)

2. **Dashboard Session Handling**
   - Cannot verify NextAuth vs Firebase session mismatch
   - Cannot test if Firebase-authenticated users can access dashboard
   - Cannot verify Prisma vs Firestore data queries

3. **Welcome Email Cloud Function**
   - Function deployed, but trigger won't fire (no users can register)
   - Cannot verify Resend integration working
   - Cannot test email template rendering

---

## Deployment Workflow Analysis

### How to Trigger Staging Deployment

**Method 1: Create Pull Request**
```bash
# Create feature branch
git checkout -b test/firebase-auth-staging

# Push to trigger PR-based staging deploy
git push origin test/firebase-auth-staging

# Create PR via GitHub CLI
gh pr create --title "Test: Firebase Auth Staging" --body "Testing Firebase Auth in staging environment"
```

**Expected Behavior:**
- CI workflow `deploy.yml` runs
- `deploy-staging` job executes (line 17-80)
- Builds Docker image with current code
- Deploys to `hustle-app-staging` Cloud Run service
- Comments PR with staging URL

**Blocker:** Still won't work without Firebase env vars added to deploy.yml

---

### How to Fix Deployment (Add Firebase Env Vars)

**Required Changes to .github/workflows/deploy.yml:**

**Step 1: Add secrets to GitHub Secrets** (User action required)
```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_PROJECT_ID_SERVER
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

**Step 2: Update deploy.yml** (Code change required)
```yaml
# Line 58-60 (staging deployment)
--set-env-vars "NODE_ENV=staging" \
--set-env-vars "NEXTAUTH_URL=https://staging-hustlestats.io" \
--set-env-vars "NEXT_PUBLIC_FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }}" \
--set-env-vars "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${{ secrets.FIREBASE_AUTH_DOMAIN }}" \
--set-env-vars "NEXT_PUBLIC_FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }}" \
--set-env-vars "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${{ secrets.FIREBASE_STORAGE_BUCKET }}" \
--set-env-vars "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}" \
--set-env-vars "NEXT_PUBLIC_FIREBASE_APP_ID=${{ secrets.FIREBASE_APP_ID }}" \
--set-secrets "DATABASE_URL=DATABASE_URL:latest" \
--set-secrets "NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest" \
--set-secrets "FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID_SERVER:latest" \
--set-secrets "FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest" \
--set-secrets "FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest"
```

**Step 3: Test deployment**
```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add Firebase environment variables to Cloud Run deployment"
git push origin main
```

---

## Key Findings

### 🟢 Working Infrastructure

1. **Cloud Run Deployment Pipeline**
   - Workload Identity Federation (WIF) authentication successful
   - Docker image build and push to Artifact Registry working
   - Cloud Run service deployment working (when env vars are correct)

2. **Firebase Backend**
   - Firestore deployed and accessible
   - Cloud Functions deployed (sendWelcomeEmail exists)
   - Security rules and indexes deployed

3. **Next.js Application**
   - Builds successfully (when Firebase code doesn't break build)
   - SSR working on Cloud Run
   - Can serve static landing page

### 🔴 Critical Issues

1. **No Firebase Environment Variables in Deployment**
   - Cloud Run deployments do NOT inject Firebase client SDK variables
   - Missing all 6 NEXT_PUBLIC_FIREBASE_* variables
   - Missing all 3 server-side Firebase Admin SDK variables
   - **Impact:** Deployed app cannot use Firebase Auth at all

2. **Recent Deployment Failures**
   - Days 3-7 deployments all failed
   - Failures started when Firebase Auth code was added
   - **Hypothesis:** TypeScript compilation errors or runtime crashes due to missing env vars

3. **No Staging Environment Active**
   - Staging only deploys on Pull Requests
   - Currently on main branch with no PR
   - Cannot test safely without creating PR

4. **Firebase Hosting Not Serving Content**
   - Returns 404 despite successful deployment
   - May be intentional (using Cloud Run for all SSR)
   - Or misconfiguration in firebase.json rewrite rules

### 🟡 Observations

1. **Hybrid Architecture Intended**
   - `firebase.json` exists (hybrid Hosting + Cloud Run setup)
   - Two separate deployment workflows (Cloud Run + Firebase)
   - But only Cloud Run is actively serving traffic

2. **Legacy NextAuth Still in Deployment**
   - deploy.yml sets `NEXTAUTH_URL` environment variable
   - Uses `NEXTAUTH_SECRET` from Secret Manager
   - Uses PostgreSQL `DATABASE_URL`
   - **Confirms:** Production deployment still on NextAuth, not Firebase Auth

3. **Deployment Frequency**
   - Multiple deployments on Nov 11 (Days 1-7 of migration)
   - No deployments since Nov 11 (4 days ago)
   - Current production code is from Day 2 (last successful deploy)

---

## Testing Strategy (Post-Fix)

### Once Firebase Env Vars Added to deploy.yml

#### Test 1: Create PR for Staging Deployment
**Steps:**
1. Update `.github/workflows/deploy.yml` with Firebase env vars
2. Create feature branch: `test/firebase-auth-e2e`
3. Push branch and create PR
4. Wait for staging deployment to complete
5. Get staging URL from PR comment
6. Test registration flow on staging URL
7. Test login flow
8. Test dashboard access (expect failure due to NextAuth session)
9. Test logout

**Expected Results:**
- Registration: ✅ Success (Firebase Auth + Firestore user creation)
- Email verification: ✅ Email sent via Cloud Function
- Login (unverified): ❌ Blocked by email verification check
- Login (verified): ✅ Success, Firebase session created
- Dashboard access: ❌ FAIL (NextAuth session mismatch - expected!)
- Logout: ✅ Success

---

#### Test 2: Verify Cloud Function Execution
**Steps:**
1. After successful registration in Test 1
2. Check Cloud Functions logs
3. Verify `sendWelcomeEmail` function triggered
4. Check for errors in function execution
5. Verify email delivered to inbox

**Log Command:**
```bash
gcloud functions logs read sendWelcomeEmail \
  --region us-central1 \
  --project hustleapp-production \
  --limit=10 \
  --format=json
```

**Expected Output:**
```json
{
  "textPayload": "[WelcomeEmail] Triggered for new user: test@example.com",
  "severity": "INFO"
}
{
  "textPayload": "[WelcomeEmail] Successfully sent welcome email to: test@example.com",
  "severity": "INFO"
}
```

---

#### Test 3: Verify Firestore User Creation
**Steps:**
1. After successful registration
2. Open Firebase Console
3. Navigate to Firestore Database
4. Check `users` collection
5. Verify new user document created
6. Check fields: firstName, lastName, email, emailVerified, createdAt

**Firebase Console URL:**
```
https://console.firebase.google.com/project/hustleapp-production/firestore/databases/-default-/data/~2Fusers
```

---

#### Test 4: Production Deployment Test (Risky)
**Steps:**
1. Merge PR from Test 1 to main
2. Triggers production deployment via deploy.yml
3. Monitor deployment logs
4. If successful, test same flows on production URL
5. **WARNING:** This affects live production service

**Recommendation:** Skip this test until dashboard conversion is complete. Testing in staging is sufficient.

---

## Recommendations

### Immediate Actions (Unblock Staging Testing)

1. **Add Firebase Secrets to GitHub Repository**
   ```bash
   # User must run these commands with appropriate values
   gh secret set FIREBASE_API_KEY --body "REDACTED_ROTATED_GOOGLE_KEY"
   gh secret set FIREBASE_AUTH_DOMAIN --body "hustleapp-production.firebaseapp.com"
   gh secret set FIREBASE_PROJECT_ID --body "hustleapp-production"
   gh secret set FIREBASE_STORAGE_BUCKET --body "hustleapp-production.firebasestorage.app"
   gh secret set FIREBASE_MESSAGING_SENDER_ID --body "335713777643"
   gh secret set FIREBASE_APP_ID --body "1:335713777643:web:209e728afd5aee07c80bae"
   ```

   **Server-side secrets (use Secret Manager, not GitHub Secrets):**
   ```bash
   # These should already exist in GCP Secret Manager from Firebase setup
   # Verify with:
   gcloud secrets list --project hustleapp-production | grep FIREBASE
   ```

2. **Update deploy.yml Workflow**
   - Add --set-env-vars for all 6 client-side Firebase variables
   - Add --set-secrets for all 3 server-side Firebase Admin variables
   - Test on staging first (via PR)

3. **Create Test PR**
   - Branch: `test/firebase-auth-staging-e2e`
   - Changes: Updated deploy.yml with Firebase env vars
   - Purpose: Trigger staging deployment for auth testing

### Short-Term Actions (Post-Deployment)

1. **Execute Staging E2E Tests**
   - Run all tests from Test 1 (registration → login → dashboard → logout)
   - Document results with screenshots
   - Verify Cloud Function execution
   - Check Firestore user creation

2. **Investigate Firebase Hosting 404**
   - Check `firebase.json` rewrite rules
   - Verify build artifacts deployed to Hosting
   - Test if Hosting is proxying to Cloud Run

3. **Analyze Recent Deployment Failures**
   - Review GitHub Actions logs for Days 3-7 failures
   - Identify exact error messages
   - Fix root cause before production deployment

### Long-Term Actions (Dashboard Conversion Required)

1. **Convert Dashboard to Firebase Auth**
   - As documented in 186-AA-MAAR (Task 1)
   - Replace NextAuth session checks with Firebase Admin SDK
   - Convert Prisma queries to Firestore services

2. **Remove NextAuth from Deployment**
   - Delete NEXTAUTH_URL env var from deploy.yml
   - Remove DATABASE_URL and NEXTAUTH_SECRET secrets
   - Verify no code references NextAuth

3. **Migrate Database to Firestore**
   - Run migration script: `scripts/migrate-to-firestore.ts`
   - Verify data integrity
   - Update all data access patterns

---

## Conclusion

**Task 3 Status:** ⚠️ INCOMPLETE - Cannot execute manual E2E testing on staging/production without first adding Firebase environment variables to deployment workflow.

**Root Cause:** `.github/workflows/deploy.yml` does not inject Firebase environment variables into Cloud Run deployments, making Firebase SDK initialization impossible.

**Current Production State:**
- ✅ Infrastructure: Cloud Run service deployed and running
- ✅ Backend: Firebase resources (Firestore, Functions) deployed
- ❌ Frontend: Cannot use Firebase Auth (missing env vars)
- ❌ Auth Flow: Still on NextAuth (legacy)

**Verified Infrastructure:**
- Cloud Run: ✅ Deployed, serving Next.js app
- Firebase Hosting: ❌ Returns 404 (investigation needed)
- Firestore: ✅ Deployed with rules and indexes
- Cloud Functions: ✅ Deployed (sendWelcomeEmail exists)
- CI/CD: ✅ WIF authentication working

**Blocking Issues:**
1. 🔴 CRITICAL: No Firebase environment variables in Cloud Run deployment
2. 🔴 CRITICAL: Recent deployments (Days 3-7) failing
3. 🟡 MEDIUM: No active staging environment (requires PR)

**Next Step:** User must decide:
- **Option A:** Add Firebase env vars to deploy.yml, create PR, test in staging
- **Option B:** Skip staging testing, proceed to Step 1 summary with findings so far
- **Option C:** Fix local .env.local (Task 2 blocker), test locally instead

**Go/No-Go:** 🔴 NO-GO for staging E2E testing until Firebase env vars added to deploy.yml

---

**Timestamp:** 2025-11-15T22:45:00Z
**Blocked By:** Missing Firebase environment variables in deploy.yml
**Blocking:** Full E2E auth flow verification on staging/production
**Next Document:** 189-AA-SUMM-hustle-step-1-auth-wiring-complete.md
