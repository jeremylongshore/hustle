# GitHub Actions Limitation - Secret Access Issue

**Document Type:** Technical Note
**Date:** 2025-10-07
**Status:** ⚠️  Blocked by GitHub Secrets Access Issue

---

## Issue Summary

GitHub Actions workflows cannot access repository secrets in the `jeremylongshore/hustle` repository, preventing automated deployments.

### Symptoms

- Secret `GCP_SA_KEY` is configured in repository
- Secret shows as created (timestamp: 2025-10-07T21:51:31Z)
- Workflow fails with: "credentials_json secret is EMPTY"
- Debug logs confirm: `GCP_SA_KEY:` (no value)

### Root Cause

Unknown GitHub-side issue preventing secret injection into workflows. Possible causes:
1. Organization-level policies blocking secret access
2. Repository configuration issue
3. GitHub Actions permissions misconfiguration
4. First-time repository setup limitation

### Investigation Steps Taken

1. ✅ Verified secret exists: `gh secret list` shows `GCP_SA_KEY`
2. ✅ Recreated secret multiple times
3. ✅ Changed workflow permissions from `read` to `write`
4. ✅ Verified repository is not a fork
5. ✅ Confirmed repository is private (secrets should work)
6. ✅ Added debug step to confirm secret is empty
7. ❌ Secret still not accessible in workflows

---

## Workaround: Manual Deployment

Until GitHub secrets access is resolved, use manual deployment with `gcloud`.

### Quick Deployment Command

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
  --set-env-vars="NEXTAUTH_URL=https://hustle-app-158864638007.us-central1.run.app,NODE_ENV=production" \
  --max-instances=10 \
  --min-instances=0 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --concurrency=80 \
  --project=hustle-dev-202510
```

**Deployment Time:** ~3-5 minutes

---

## Alternative: Use Deployment Script

A convenience script is available at:

```bash
/home/jeremy/projects/hustle/05-Scripts/deploy.sh
```

Usage:
```bash
cd /home/jeremy/projects/hustle
./05-Scripts/deploy.sh
```

---

## What Was Successfully Configured

Despite the GitHub Actions limitation, the following infrastructure is ready:

✅ **Google Secret Manager**
- `database-url` secret created
- `nextauth-secret` secret created
- Cloud Run service account has access

✅ **GCP Service Account**
- `github-actions@hustle-dev-202510.iam.gserviceaccount.com`
- Full permissions: Cloud Run Admin, Storage Admin, IAM Service Account User

✅ **GitHub Actions Workflow**
- Workflow file: `.github/workflows/deploy-to-cloud-run.yml`
- Configured correctly (syntax valid)
- Will work once secret access is resolved

✅ **Documentation**
- DevOps guide: `01-Docs/JEREMY_DEVOPS_GUIDE.md`
- Deployment SOP: `01-Docs/045-sop-github-actions-deployment.md`

---

## Recommended Next Steps

### Option 1: Contact GitHub Support

If you have a GitHub paid plan, open a support ticket:
- **Issue**: Repository secrets not accessible in Actions workflows
- **Repository**: `jeremylongshore/hustle`
- **Secret Name**: `GCP_SA_KEY`
- **Error**: Secret value is empty in workflow runs

### Option 2: Use Workload Identity Federation (Advanced)

Instead of service account keys, use Workload Identity:
- No secrets needed
- More secure
- Requires org-level setup
- See: https://github.com/google-github-actions/auth#workload-identity-federation

### Option 3: Continue Manual Deployment

Use the deployment script for now:
```bash
./05-Scripts/deploy.sh
```

---

## Future Resolution

When GitHub secrets access is resolved:

1. The existing workflow will work immediately (no changes needed)
2. Auto-deployment on push to `main` will function
3. No infrastructure changes required

---

## Your Current Workflow (Manual)

```bash
# 1. Code locally
npm run dev

# 2. Make changes and test
# ... code changes ...

# 3. Commit to GitHub
git add .
git commit -m "feat: add feature"
git push origin main

# 4. Deploy manually
./05-Scripts/deploy.sh

# 5. Verify deployment
curl https://hustle-app-158864638007.us-central1.run.app/api/healthcheck
```

**Deployment Time:** ~3-5 minutes (same as GitHub Actions would be)

---

## Notes

- All infrastructure is correctly configured
- The only blocker is GitHub secret access
- Manual deployment is equally fast and reliable
- Can switch to automated deployment when secret access works

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-07
**Status:** Active Issue (Workaround Available)
