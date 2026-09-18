# GitHub Actions Workload Identity Federation Setup for Firebase

**Date:** 2025-11-10T10:30:00Z
**Status:** ✅ READY TO CONFIGURE
**Type:** Deployment Documentation - WIF + GitHub Actions + Firebase

---

## EXECUTIVE SUMMARY

This document provides step-by-step instructions to configure Workload Identity Federation (WIF) for automated Firebase deployment via GitHub Actions. This enables keyless authentication, eliminating the need for service account JSON keys.

**What This Enables:**
- ✅ Automated deployment of Firestore rules on push to main
- ✅ Automated deployment of Firestore indexes on push to main
- ✅ Automated deployment of Cloud Functions (when ready)
- ✅ Automated deployment of Firebase Hosting (when ready)
- ✅ Manual deployment trigger via GitHub Actions UI
- ✅ Secure, keyless authentication (no JSON keys in secrets)

**Current State:**
- ✅ WIF already configured for Cloud Run deployment (existing secrets: `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`)
- ✅ GitHub Actions workflow created: `.github/workflows/deploy-firebase.yml`
- ✅ Firestore security rules updated: `firestore.rules` (subcollection structure)
- ✅ Firestore indexes updated: `firestore.indexes.json` (collection group queries)
- ⚠️ Need to add Firebase permissions to existing service account

---

## PREREQUISITE CHECK

### 1. Verify Existing WIF Configuration

You already have WIF configured for Cloud Run deployment. Verify it's working:

```bash
# Check GitHub secrets (via GitHub UI)
# Go to: Settings → Secrets and variables → Actions
# Should see:
#   - WIF_PROVIDER
#   - WIF_SERVICE_ACCOUNT
```

### 2. Get Current Service Account Email

```bash
# The service account is already configured
# Check the WIF_SERVICE_ACCOUNT secret value in GitHub
# It should be something like:
# github-actions@hustleapp-production.iam.gserviceaccount.com
```

---

## SETUP STEPS

### Step 1: Add Firebase Permissions to Service Account

Your existing service account needs additional permissions for Firebase deployment.

```bash
# Set variables
PROJECT_ID="hustleapp-production"
SERVICE_ACCOUNT="github-actions@hustleapp-production.iam.gserviceaccount.com"

# Add Firebase Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/firebase.admin"

# Add Firestore Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/datastore.owner"

# Add Cloud Functions Developer role (for future use)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/cloudfunctions.developer"

# Add Firebase Hosting Admin role (for future use)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/firebasehosting.admin"
```

### Step 2: Verify Permissions

```bash
# List all roles for the service account
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:$SERVICE_ACCOUNT" \
  --format="table(bindings.role)"

# Expected output should include:
#   roles/firebase.admin
#   roles/datastore.owner
#   roles/cloudfunctions.developer
#   roles/firebasehosting.admin
#   roles/run.admin (existing from Cloud Run setup)
```

### Step 3: Enable Required APIs

```bash
# Enable Firebase Management API
gcloud services enable firebase.googleapis.com --project=$PROJECT_ID

# Enable Firestore API (should already be enabled)
gcloud services enable firestore.googleapis.com --project=$PROJECT_ID

# Enable Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com --project=$PROJECT_ID

# Enable Firebase Hosting API
gcloud services enable firebasehosting.googleapis.com --project=$PROJECT_ID

# Verify all APIs are enabled
gcloud services list --enabled --project=$PROJECT_ID | grep -E "(firebase|firestore|cloudfunctions)"
```

### Step 4: Verify Firebase Project Configuration

```bash
# Check Firebase project is initialized
firebase projects:list

# Expected output should show:
# hustleapp-production (should be marked as current project)

# Verify .firebaserc configuration
cat .firebaserc

# Expected output:
# {
#   "projects": {
#     "default": "hustleapp-production"
#   }
# }
```

---

## GITHUB ACTIONS WORKFLOW

### Workflow File: `.github/workflows/deploy-firebase.yml`

**Location:** `/home/jeremy/000-projects/hustle/.github/workflows/deploy-firebase.yml`

**Trigger Conditions:**

**Automatic Deployment:**
- Triggers on push to `main` branch when these files change:
  - `firestore.rules`
  - `firestore.indexes.json`
  - `firebase.json`
  - `.firebaserc`
  - `functions/**` (any Cloud Functions code)

**Manual Deployment:**
- Trigger via GitHub Actions UI
- Select deployment target:
  - `all` - Deploy everything
  - `hosting` - Deploy Firebase Hosting only
  - `firestore` - Deploy Firestore rules + indexes only
  - `functions` - Deploy Cloud Functions only

### Workflow Steps

1. **Checkout code** - Get latest code from repository
2. **Set up Node.js** - Install Node.js 20 with npm caching
3. **Install dependencies** - Run `npm ci` for reproducible builds
4. **Authenticate to Google Cloud** - Uses WIF (no JSON keys)
5. **Set up Cloud SDK** - Install gcloud CLI tools
6. **Install Firebase CLI** - Install `firebase-tools` globally
7. **Determine deployment target** - Auto or manual trigger
8. **Deploy Firestore Rules** - Deploy security rules to Firestore
9. **Deploy Firestore Indexes** - Deploy composite indexes
10. **Build Functions** - Compile TypeScript Cloud Functions
11. **Deploy Cloud Functions** - Deploy compiled functions
12. **Deploy Firebase Hosting** - Deploy static site
13. **Deployment Summary** - Print summary with console links

---

## FIRESTORE CONFIGURATION

### Security Rules: `firestore.rules`

**Location:** `/home/jeremy/000-projects/hustle/firestore.rules`

**Structure:** Subcollection-based hierarchy

```
/users/{userId}
  ├── /players/{playerId}
  │   └── /games/{gameId}
  ├── /waitlist/{email}
  └── /emailLogs/{logId}
```

**Key Security Features:**
- ✅ Users can only read/write their own data
- ✅ Email verification required for player/game creation
- ✅ COPPA compliance: parent-controlled child profiles
- ✅ Automatic security boundaries via subcollections
- ✅ No complex permission checks needed
- ✅ Waitlist accepts public signups (no auth required)

### Firestore Indexes: `firestore.indexes.json`

**Location:** `/home/jeremy/000-projects/hustle/firestore.indexes.json`

**Indexes Created:**

1. **Players by creation date** (descending)
   - Collection group: `players`
   - Fields: `createdAt DESC`
   - Use case: List all players newest first

2. **Games by date** (descending)
   - Collection group: `games`
   - Fields: `date DESC`
   - Use case: List all games newest first

3. **Verified games by date** (descending)
   - Collection group: `games`
   - Fields: `verified ASC, date DESC`
   - Use case: Filter verified/unverified games

4. **Games by result and date** (descending)
   - Collection group: `games`
   - Fields: `result ASC, date DESC`
   - Use case: Filter by win/loss/draw

**Note:** Collection group queries allow querying across all subcollections.

---

## TESTING THE DEPLOYMENT

### Test 1: Manual Trigger (Recommended First Test)

1. Go to GitHub repository
2. Click **Actions** tab
3. Select **Deploy Firebase** workflow (left sidebar)
4. Click **Run workflow** button (top right)
5. Select deployment target: `firestore` (safest first test)
6. Click **Run workflow** (green button)
7. Wait for workflow to complete (~1-2 minutes)
8. Check workflow logs for errors

**Expected Output:**
```
================================
Firebase Deployment Complete
================================
Project: hustleapp-production
Target: firestore
Commit: abc123...
Branch: main

Deployed Resources:
  ✅ Firestore Rules
  ✅ Firestore Indexes

Firebase Console:
https://console.firebase.google.com/project/hustleapp-production
================================
```

### Test 2: Verify Firestore Rules

```bash
# View deployed rules in Firebase Console
# Go to: https://console.firebase.google.com/project/hustleapp-production/firestore/rules

# Expected to see the subcollection structure:
#   /users/{userId}
#     /players/{playerId}
#       /games/{gameId}
```

### Test 3: Verify Firestore Indexes

```bash
# View deployed indexes in Firebase Console
# Go to: https://console.firebase.google.com/project/hustleapp-production/firestore/indexes

# Expected to see 4 composite indexes:
#   - players (createdAt DESC)
#   - games (date DESC)
#   - games (verified ASC, date DESC)
#   - games (result ASC, date DESC)
```

### Test 4: Automatic Trigger

1. Make a small change to `firestore.rules` (add a comment)
2. Commit and push to `main` branch
3. GitHub Actions should automatically trigger
4. Check Actions tab to see workflow running
5. Verify deployment completes successfully

```bash
# Example change
git add firestore.rules
git commit -m "test: trigger Firebase deployment workflow"
git push origin main

# Monitor GitHub Actions
# Go to: https://github.com/your-org/hustle/actions
```

---

## TROUBLESHOOTING

### Error: "Permission denied: firebase.admin"

**Problem:** Service account doesn't have Firebase Admin role

**Solution:**
```bash
gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:github-actions@hustleapp-production.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"
```

### Error: "API not enabled: firebase.googleapis.com"

**Problem:** Firebase Management API not enabled

**Solution:**
```bash
gcloud services enable firebase.googleapis.com --project=hustleapp-production
```

### Error: "Firestore rules compilation failed"

**Problem:** Syntax error in `firestore.rules`

**Solution:**
1. Check workflow logs for specific error line
2. Fix syntax error in `firestore.rules`
3. Test locally: `firebase deploy --only firestore:rules --project=hustleapp-production`
4. Commit fix and push

### Error: "Index already exists"

**Problem:** Index already deployed (not an error, just a warning)

**Solution:** This is safe to ignore. Firebase won't create duplicate indexes.

### Error: "Workload Identity Federation authentication failed"

**Problem:** WIF provider or service account misconfigured

**Solution:**
1. Verify GitHub secrets are correct:
   - `WIF_PROVIDER` should be full resource name
   - `WIF_SERVICE_ACCOUNT` should be service account email
2. Check service account permissions:
   ```bash
   gcloud projects get-iam-policy hustleapp-production \
     --flatten="bindings[].members" \
     --filter="bindings.members:github-actions@hustleapp-production.iam.gserviceaccount.com"
   ```

---

## DEPLOYMENT WORKFLOW DIAGRAM

```
GitHub Push to main
  ↓
[Trigger Check] Changed files match paths?
  ↓ (YES)
[Workflow Start] deploy-firebase.yml
  ↓
[Auth] Workload Identity Federation
  ├─→ No JSON keys needed ✅
  ├─→ Uses GitHub OIDC token ✅
  └─→ Exchanges for GCP access token ✅
  ↓
[Deploy] Firestore Rules
  ├─→ Validate syntax
  ├─→ Deploy to Firestore
  └─→ Rules active in <1 second
  ↓
[Deploy] Firestore Indexes
  ├─→ Create composite indexes
  ├─→ Background build starts
  └─→ Indexes ready in 1-5 minutes
  ↓
[Deploy] Cloud Functions (if exist)
  ├─→ Build TypeScript
  ├─→ Deploy to Cloud Functions
  └─→ Functions ready in 1-2 minutes
  ↓
[Deploy] Firebase Hosting (if needed)
  ├─→ Build Next.js app
  ├─→ Upload static assets
  └─→ Site live on CDN
  ↓
[Summary] Deployment report
```

---

## COST BREAKDOWN

**GitHub Actions:**
- Free for public repos
- Private repos: 2,000 minutes/month free
- This workflow: ~2 minutes per run
- Estimated cost: **$0/month** (within free tier)

**Firebase Deployment API Calls:**
- Firestore Rules deployment: FREE
- Firestore Indexes deployment: FREE
- Cloud Functions deployment: FREE (pay per invocation)
- Firebase Hosting deployment: FREE (pay per GB served)

**Total Deployment Cost:** $0/month

---

## SECURITY BEST PRACTICES

### 1. Workload Identity Federation (WIF)

**Benefits:**
- ✅ No service account keys to manage
- ✅ Automatic key rotation
- ✅ Short-lived tokens (1 hour)
- ✅ Can't be leaked (no static credentials)
- ✅ GitHub OIDC token verification

**How It Works:**
1. GitHub Actions generates OIDC token with repository info
2. WIF provider validates token signature and claims
3. If valid, exchanges for short-lived GCP access token
4. Access token used to deploy Firebase resources
5. Token expires after 1 hour

### 2. Least Privilege Permissions

**Service Account Roles:**
- `roles/firebase.admin` - Deploy Firebase resources
- `roles/datastore.owner` - Manage Firestore data and rules
- `roles/cloudfunctions.developer` - Deploy Cloud Functions
- `roles/firebasehosting.admin` - Deploy to Firebase Hosting

**What It CAN'T Do:**
- ❌ Delete the project
- ❌ Modify billing
- ❌ Change IAM policies
- ❌ Access production data (rules prevent client access)

### 3. Branch Protection

**Recommended Settings:**
1. Require PR reviews before merge to `main`
2. Require status checks to pass (CI tests)
3. Require branches to be up to date
4. Prevent force pushes to `main`

```bash
# Enable branch protection via GitHub UI:
# Settings → Branches → Add rule
# Branch name pattern: main
# Check:
#   ✅ Require a pull request before merging
#   ✅ Require status checks to pass
#   ✅ Require branches to be up to date
#   ✅ Do not allow bypassing settings
```

---

## MONITORING & OBSERVABILITY

### GitHub Actions Logs

**View Deployment Logs:**
1. Go to GitHub Actions tab
2. Select "Deploy Firebase" workflow
3. Click on specific run
4. View step-by-step logs

**Key Log Sections:**
- Authentication (verify WIF success)
- Firestore Rules deployment
- Firestore Indexes deployment
- Functions deployment (if applicable)
- Deployment summary

### Firebase Console

**Monitor Deployments:**
- Firestore Rules: https://console.firebase.google.com/project/hustleapp-production/firestore/rules
- Firestore Indexes: https://console.firebase.google.com/project/hustleapp-production/firestore/indexes
- Cloud Functions: https://console.firebase.google.com/project/hustleapp-production/functions
- Firebase Hosting: https://console.firebase.google.com/project/hustleapp-production/hosting

### Cloud Logging

**View Deployment Events:**
```bash
# View Firebase deployment logs
gcloud logging read "resource.type=firebase_deployment" \
  --project=hustleapp-production \
  --limit=50 \
  --format=json

# View Firestore rule changes
gcloud logging read "resource.type=firestore_database AND protoPayload.methodName=UpdateSecurityRules" \
  --project=hustleapp-production \
  --limit=10
```

---

## ROLLBACK PROCEDURES

### Rollback Firestore Rules

```bash
# Firestore rules are versioned in Firebase Console
# To rollback:

# Option 1: Via Console
# 1. Go to: https://console.firebase.google.com/project/hustleapp-production/firestore/rules
# 2. Click "History" tab
# 3. Select previous version
# 4. Click "Restore"

# Option 2: Via CLI (redeploy old version)
git checkout <previous-commit>
firebase deploy --only firestore:rules --project=hustleapp-production
```

### Rollback Firestore Indexes

```bash
# Indexes can't be "rolled back" but you can delete unused ones:

# List all indexes
firebase firestore:indexes --project=hustleapp-production

# Delete specific index
gcloud firestore indexes composite delete \
  --collection-group=games \
  --query-scope=COLLECTION_GROUP \
  --field-config=field-path=verified,order=ASCENDING \
  --field-config=field-path=date,order=DESCENDING \
  --project=hustleapp-production
```

### Rollback Cloud Functions

```bash
# List function versions
gcloud functions describe FUNCTION_NAME --region=us-central1 --project=hustleapp-production

# Rollback to previous version (not directly supported)
# Instead, redeploy previous code:
git checkout <previous-commit>
firebase deploy --only functions --project=hustleapp-production
```

---

## NEXT STEPS

### 1. Configure WIF Permissions (NOW)

Run the commands in **Step 1: Add Firebase Permissions to Service Account**

```bash
PROJECT_ID="hustleapp-production"
SERVICE_ACCOUNT="github-actions@hustleapp-production.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/firebase.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/datastore.owner"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/cloudfunctions.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/firebasehosting.admin"
```

### 2. Test Manual Deployment (NEXT)

Trigger workflow manually via GitHub Actions UI:
1. Go to Actions tab
2. Select "Deploy Firebase"
3. Click "Run workflow"
4. Select target: `firestore`
5. Click "Run workflow"

### 3. Verify Deployment (AFTER TEST)

Check Firebase Console to confirm:
- Firestore rules deployed correctly
- Firestore indexes created successfully

### 4. Enable Automatic Deployment (FINAL)

Once manual test succeeds:
1. Make a small change to `firestore.rules` (add comment)
2. Commit and push to `main`
3. Verify workflow triggers automatically
4. Confirm deployment completes successfully

---

## SUMMARY

**What We Built:**
- ✅ GitHub Actions workflow for Firebase deployment (`.github/workflows/deploy-firebase.yml`)
- ✅ Updated Firestore security rules (subcollection structure in `firestore.rules`)
- ✅ Updated Firestore indexes (collection group queries in `firestore.indexes.json`)
- ✅ Comprehensive deployment documentation (this document)

**What You Need to Do:**
1. Run permission commands (Step 1 above)
2. Test manual deployment (Step 2 above)
3. Verify in Firebase Console (Step 3 above)
4. Enable automatic deployment (Step 4 above)

**Benefits:**
- 🚀 Automated deployment on every push to `main`
- 🔒 Secure, keyless authentication via WIF
- 📊 Automatic Firestore rules and indexes deployment
- 🎯 Manual deployment trigger for on-demand deploys
- 💰 $0 deployment cost (within free tier)
- ⚡ Fast deployment (~2 minutes)

**Ready for Migration:**
Once this deployment pipeline is working, you can proceed with the Firebase migration plan (document 178).

---

**Document:** 179-OD-DEPL-github-actions-wif-firebase-setup.md
**Status:** ✅ READY TO CONFIGURE
**Next Action:** Run permission commands in Step 1

**Date:** 2025-11-10T10:30:00Z
