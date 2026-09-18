# GitHub Actions Deployment Failure - Troubleshooting Session

**Date:** 2025-10-17
**Status:** ⚠️ UNRESOLVED - Deployments Disabled
**Category:** TQ (Technical/Quality)
**Type:** BUGR (Bug Report)

---

## Problem Summary

GitHub Actions auto-deployment to Cloud Run failed repeatedly, resulting in 30+ failure notification emails. Auto-deploy workflow has been temporarily disabled to prevent email spam.

## Timeline

1. **Initial Issue**: Multiple failed deployment emails from GitHub Actions
2. **Root Causes Identified**:
   - Malformed characters in workflow YAML files
   - WIF (Workload Identity Federation) attribute condition mismatch
   - Missing IAM permissions for Artifact Registry and Cloud Build
   - GCR (Google Container Registry) push failures

3. **Fixes Applied**:
   - Fixed YAML syntax errors (malformed emojis, invalid `branches-ignore`)
   - Updated WIF provider attribute condition to match repository owner
   - Granted IAM roles: `artifactregistry.writer`, `cloudbuild.builds.builder`, `storage.admin`
   - Added `.github/` and `docs/` to `.gcloudignore`

4. **Final State**: Deployments still failing on container push to GCR

---

## Technical Details

### WIF Configuration Fix

```bash
gcloud iam workload-identity-pools providers update-oidc github-provider \
  --project=hustleapp-production \
  --location=global \
  --workload-identity-pool=github-actions-pool \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'jeremylongshore'"
```

### IAM Permissions Granted

Service Account: `github-actions-sa@hustleapp-production.iam.gserviceaccount.com`

Roles added:
- `roles/artifactregistry.writer` (project-level)
- `roles/artifactregistry.reader` (repository-level on `cloud-run-source-deploy`)
- `roles/cloudbuild.builds.builder`
- `roles/storage.admin`
- `roles/run.admin` (already existed)
- `roles/secretmanager.secretAccessor` (already existed)

### Workflow File Issues Fixed

**`.github/workflows/deploy.yml`**:
- Removed malformed emoji characters (`=�` → proper UTF-8)
- Switched from `--source .` to Docker-based deployment
- Moved `Dockerfile` to project root for simpler builds

**`.github/workflows/branch-protection.yml`**:
- Removed invalid `branches-ignore` syntax
- Changed to trigger only on `pull_request` events

### Build Errors Encountered

**Latest build ID**: `61b05616-2c5d-45ec-9d0e-925a6a2a7774`

```
ERROR: failed to push because we ran out of retries.
ERROR: error pushing image "gcr.io/hustleapp-production/hustle-app":
       retry budget exhausted (10 attempts): step exited with non-zero status: 1
```

**Analysis**: Docker image builds successfully but fails to push to Container Registry. This indicates:
1. Possible GCR bucket permissions issue
2. Network/connectivity problems between Cloud Build and GCR
3. Potential quota limits or rate limiting

---

## Current State

### What Works ✅
- WIF authentication (GitHub Actions can authenticate to GCP)
- Cloud Build can start build jobs
- Docker image builds complete successfully
- All required IAM permissions granted

### What's Broken ❌
- Container push to `gcr.io/hustleapp-production/hustle-app` fails
- Auto-deployment workflow disabled (`.github/workflows/deploy.yml.disabled`)
- Website landing page changes NOT deployed (still on old version)

### Code Changes Ready (Not Deployed)
- "Currently in Development" badge
- Dual CTA: "Try Early Access" + "Share Feedback"
- Honest development messaging
- External survey link integration

---

## Workaround

**Auto-deploy disabled to stop email spam:**
```bash
mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled
```

**Manual deployment command** (also fails with same error):
```bash
gcloud run deploy hustle-app \
  --source . \
  --region us-central1 \
  --project hustleapp-production \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,NEXTAUTH_URL=https://hustlestats.io" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,SENTRY_DSN=SENTRY_DSN:latest"
```

---

## Next Steps (To Resolve)

1. **Investigate GCR bucket permissions in GCP Console**
   - Navigate to: Cloud Storage → Buckets → `artifacts.hustleapp-production.appspot.com`
   - Verify Cloud Build service account has `storage.objectCreator` permission
   - Check for any bucket-level IAM policy conflicts

2. **Check Cloud Build service account**
   - Service account: `335713777643@cloudbuild.gserviceaccount.com`
   - Verify it has `storage.admin` on the GCR bucket specifically
   - Check if service account is enabled and not disabled

3. **Review Cloud Build logs in GCP Console**
   - Navigate to: Cloud Build → History
   - Find build `61b05616-2c5d-45ec-9d0e-925a6a2a7774`
   - Look for detailed error messages beyond "retry budget exhausted"

4. **Alternative: Switch to Artifact Registry**
   - Instead of GCR (`gcr.io`), use Artifact Registry (`us-central1-docker.pkg.dev`)
   - Create Docker repository in Artifact Registry
   - Update workflow to use Artifact Registry URLs

5. **Test minimal Docker build**
   ```bash
   # Build locally and push manually to isolate issue
   docker build -t gcr.io/hustleapp-production/hustle-app .
   docker push gcr.io/hustleapp-production/hustle-app
   ```

6. **Re-enable auto-deploy after fix**
   ```bash
   mv .github/workflows/deploy.yml.disabled .github/workflows/deploy.yml
   git add .github/workflows/deploy.yml
   git commit -m "chore: re-enable auto-deploy after GCR fix"
   git push origin main
   ```

---

## Related Files

- `.github/workflows/deploy.yml.disabled` - Disabled auto-deploy workflow
- `.github/workflows/branch-protection.yml` - PR validation workflow
- `.github/workflows/auto-fix.yml` - Auto-fix ESLint on PRs
- `.gcloudignore` - Updated to exclude docs/ and .github/
- `Dockerfile` - Copied to project root
- `docs/104-OD-DEPL-github-actions-setup-complete.md` - WIF setup documentation

---

## Commits During Troubleshooting

```
f76350e - chore: temporarily disable auto-deploy workflow
5600662 - fix: exclude docs and GitHub workflows from Cloud Run builds
2b99007 - chore: test deployment with Cloud Build permissions
77f38b0 - fix: simplify Docker build with root Dockerfile
11c5d6b - feat: switch to Docker-based Cloud Run deployment
25e87a8 - chore: trigger deployment with full Artifact Registry access
f15c180 - chore: trigger deployment after Artifact Registry permissions
36177d3 - chore: trigger deployment after WIF fix
219820c - fix: remove special characters from deploy workflow
7a9780b - fix: correct branch-protection workflow trigger syntax
7322528 - fix: correct malformed emoji in deploy workflow
6520d4d - feat: add auto-fix and branch protection workflows
aa81d70 - fix: resolve ESLint errors blocking deployment
f3516d5 - fix: remove old deploy workflow using deprecated service account keys
```

---

## Lessons Learned

1. **Test IAM permissions early** - WIF and service account permissions should be validated before committing workflows
2. **YAML validation matters** - Malformed characters break GitHub Actions silently
3. **Incremental testing** - Should have tested simple deployment before complex CI/CD
4. **Email notifications** - Consider disabling workflow failure emails during debugging
5. **GCR vs Artifact Registry** - GCR may have legacy permission issues; Artifact Registry is recommended
6. **Build logs are critical** - Always check Cloud Build logs for detailed error messages

---

## Open Questions

1. Why is Cloud Build failing to push to GCR despite `storage.admin` role?
2. Is there a GCR bucket lifecycle policy blocking pushes?
3. Should we migrate from GCR to Artifact Registry entirely?
4. Are there quota limits on gcr.io push operations?

---

**Last Updated**: 2025-10-17T23:15:00-05:00
**Next Review**: After GCP Console investigation
**Owner**: Jeremy Longshore
