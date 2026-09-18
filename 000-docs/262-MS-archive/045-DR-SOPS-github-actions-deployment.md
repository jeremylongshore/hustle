# GitHub Actions Auto-Deployment Setup

**Document Type:** Standard Operating Procedure (SOP)
**Version:** 1.0.0
**Date:** 2025-10-07
**Status:** ✅ Ready to Execute

---

## Overview

This guide sets up automatic deployment from GitHub to Cloud Run. After setup, every push to `main` branch automatically deploys to production.

**Workflow:**
```
Local Dev → Git Commit → Git Push → GitHub Actions → Cloud Run Deploy → Live
```

---

## Prerequisites

✅ You must have:
- GCP project `hustle-dev-202510` with billing enabled
- Terraform infrastructure deployed (Cloud Run, Cloud SQL, VPC)
- GitHub repository for Hustle
- `gcloud` CLI authenticated (`gcloud auth login`)

---

## Setup Process (One-Time)

### Step 1: Set Up GCP Service Account

Run the automated setup script:

```bash
cd /home/jeremy/projects/hustle
./05-Scripts/setup-github-actions.sh
```

**What this does:**
- Creates service account: `github-actions@hustle-dev-202510.iam.gserviceaccount.com`
- Grants permissions: Cloud Run Admin, Storage Admin, IAM Service Account User
- Creates service account key: `github-actions-key.json`

**Expected Output:**
```
════════════════════════════════════════════════════════════
✅ SETUP COMPLETE
════════════════════════════════════════════════════════════

📋 Next Steps:
1. Copy the service account key:
   cat github-actions-key.json
...
```

### Step 2: Store Secrets in Google Secret Manager

Run the secrets setup script:

```bash
cd /home/jeremy/projects/hustle
./05-Scripts/setup-secrets.sh
```

**What this does:**
- Creates `database-url` secret (from Terraform output)
- Creates `nextauth-secret` secret (auto-generated)
- Grants Cloud Run service account access to secrets

**Expected Output:**
```
════════════════════════════════════════════════════════════
✅ SECRET MANAGER SETUP COMPLETE
════════════════════════════════════════════════════════════

📝 Your NEXTAUTH_SECRET (save this for local development):
[RANDOM_SECRET_HERE]

💡 Add to your .env.local:
NEXTAUTH_SECRET="[RANDOM_SECRET_HERE]"
```

**IMPORTANT:** Copy the `NEXTAUTH_SECRET` output and add it to your `.env.local` file for local development.

### Step 3: Add GitHub Secret

1. **Copy the service account key:**
   ```bash
   cat github-actions-key.json
   ```

2. **Go to GitHub:**
   - Navigate to your repository
   - Click **Settings** → **Secrets and variables** → **Actions**

3. **Create new secret:**
   - Click **New repository secret**
   - Name: `GCP_SA_KEY`
   - Value: Paste the entire JSON content from step 1
   - Click **Add secret**

### Step 4: Commit GitHub Actions Workflow

The workflow file already exists at `.github/workflows/deploy-to-cloud-run.yml`.

Commit it to your repository:

```bash
cd /home/jeremy/projects/hustle

# Add the workflow file
git add .github/workflows/deploy-to-cloud-run.yml

# Add setup scripts
git add 05-Scripts/setup-github-actions.sh
git add 05-Scripts/setup-secrets.sh

# Add this documentation
git add 01-Docs/045-sop-github-actions-deployment.md

# Commit
git commit -m "ci: add GitHub Actions auto-deployment workflow"

# Push to GitHub
git push origin main
```

**✅ GitHub Actions will automatically deploy to Cloud Run!**

---

## Verify Deployment

### Check GitHub Actions

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see a workflow run for your commit
4. Click on the workflow to see deployment progress

**Successful deployment shows:**
```
✅ Deployment successful!
🚀 Live at: https://hustle-app-158864638007.us-central1.run.app
```

### Check Live Application

```bash
# Health check
curl https://hustle-app-158864638007.us-central1.run.app/api/healthcheck

# Expected response:
# {"status":"ok","timestamp":"2025-10-07T12:00:00.000Z"}
```

### Check Cloud Run

```bash
# View service details
gcloud run services describe hustle-app --region us-central1

# View recent revisions
gcloud run revisions list --service hustle-app --region us-central1
```

---

## Daily Development Workflow

Once setup is complete, your workflow is simple:

```bash
# 1. Work locally
cd /home/jeremy/projects/hustle
npm run dev

# 2. Make changes, test locally
# ... code changes ...

# 3. Commit when ready
git add .
git commit -m "feat: add email verification"

# 4. Push to GitHub (triggers auto-deployment)
git push origin main

# 5. GitHub Actions automatically:
#    - Builds your app
#    - Deploys to Cloud Run
#    - Runs health checks
#    - Reports success/failure

# 6. Test on production
curl https://hustle-app-158864638007.us-central1.run.app/api/healthcheck

# 7. Visit live site
# https://hustle-app-158864638007.us-central1.run.app
```

---

## Troubleshooting

### Issue: "Permission denied" during deployment

**Solution:** Verify service account permissions:

```bash
# Check service account exists
gcloud iam service-accounts describe github-actions@hustle-dev-202510.iam.gserviceaccount.com

# Re-grant permissions
./05-Scripts/setup-github-actions.sh
```

### Issue: "Secret not found: database-url"

**Solution:** Re-create secrets:

```bash
./05-Scripts/setup-secrets.sh
```

### Issue: GitHub Actions fails with "Invalid credentials"

**Solution:** Re-create service account key and update GitHub secret:

```bash
# Delete old key (if exists)
rm github-actions-key.json

# Create new key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@hustle-dev-202510.iam.gserviceaccount.com

# Copy new key
cat github-actions-key.json

# Update GitHub secret:
# Settings → Secrets → GCP_SA_KEY → Update
```

### Issue: Deployment succeeds but app doesn't work

**Solution:** Check Cloud Run logs:

```bash
# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=hustle-app" \
  --limit 50 \
  --format json

# Tail logs in real-time
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=hustle-app"
```

---

## Rollback Procedure

If a deployment breaks production:

### Option 1: Revert via GitHub

```bash
# Revert the commit
git revert HEAD

# Push (triggers auto-deployment of previous version)
git push origin main
```

### Option 2: Rollback via Cloud Run Console

1. Go to [Cloud Run Console](https://console.cloud.google.com/run/detail/us-central1/hustle-app?project=hustle-dev-202510)
2. Click **Revisions** tab
3. Find the last working revision
4. Click **...** → **Manage traffic**
5. Set 100% traffic to the working revision
6. Click **Save**

### Option 3: Rollback via CLI

```bash
# List recent revisions
gcloud run revisions list --service hustle-app --region us-central1

# Route traffic to specific revision
gcloud run services update-traffic hustle-app \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

---

## Manual Deployment (Bypass GitHub Actions)

If you need to deploy manually:

```bash
cd /home/jeremy/projects/hustle

gcloud run deploy hustle-app \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --vpc-connector hustle-vpc-connector \
  --service-account hustle-cloudrun-sa@hustle-dev-202510.iam.gserviceaccount.com \
  --update-secrets="DATABASE_URL=database-url:latest,NEXTAUTH_SECRET=nextauth-secret:latest" \
  --set-env-vars="NEXTAUTH_URL=https://hustle-app-158864638007.us-central1.run.app,NODE_ENV=production"
```

---

## Security Best Practices

✅ **DO:**
- Keep `github-actions-key.json` secure (already in `.gitignore`)
- Rotate service account keys every 90 days
- Use Secret Manager for all sensitive data
- Review GitHub Actions logs for security issues

❌ **DON'T:**
- Commit service account keys to Git
- Share service account keys in chat/email
- Store secrets in environment variables (use Secret Manager)
- Give service account more permissions than needed

---

## Monitoring Deployment Success

### GitHub Actions Badge

Add to your `README.md`:

```markdown
![Deploy to Cloud Run](https://github.com/YOUR_USERNAME/hustle/actions/workflows/deploy-to-cloud-run.yml/badge.svg)
```

### Email Notifications

GitHub sends email notifications for:
- ✅ Successful deployments
- ❌ Failed deployments

Configure in: **Settings** → **Notifications**

---

## Cost Impact

**GitHub Actions:** Free for public repositories, 2000 minutes/month for private

**GCP Costs:** No additional cost (deployment happens on GitHub Actions runners)

---

## Summary

**✅ Setup Complete When:**
- [x] Service account created
- [x] Secrets stored in Secret Manager
- [x] GitHub secret `GCP_SA_KEY` configured
- [x] GitHub Actions workflow committed
- [x] First deployment successful
- [x] Health check passes

**🚀 Your Workflow:**
```
Code → Commit → Push → Auto-Deploy → Live in ~3 minutes
```

**📊 Success Metrics:**
- Deployment time: ~2-3 minutes
- Downtime: ~5 seconds (rolling deployment)
- Rollback time: <1 minute

---

**Next Steps:**
1. Run setup scripts
2. Configure GitHub secret
3. Push to trigger first deployment
4. Celebrate automatic deployments! 🎉

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-07
**Maintained By:** Jeremy Longshore
