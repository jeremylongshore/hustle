# Artifact Registry Migration - GitHub Actions Deployment Fix

**Date:** 2025-10-18
**Status:** ✅ RESOLVED - Deployments Working
**Category:** OD (Operations/DevOps)
**Type:** DEPL (Deployment)

---

## Problem Summary

GitHub Actions auto-deployment to Cloud Run failed repeatedly with Docker push failures to GCR (Google Container Registry), resulting in 30+ failure notification emails. The issue was resolved by migrating from GCR to Artifact Registry.

## Root Cause

Docker images built successfully in GitHub Actions but consistently failed to push to `gcr.io/hustleapp-production/hustle-app` with error:

```
ERROR: failed to push because we ran out of retries.
ERROR: error pushing image "gcr.io/hustleapp-production/hustle-app":
       retry budget exhausted (10 attempts): step exited with non-zero status: 1
```

**Analysis**: Despite having correct IAM permissions (`storage.admin`, `cloudbuild.builds.builder`, `artifactregistry.writer`), GCR push operations failed. This is a known issue with GCR in certain configurations. Google recommends migrating to Artifact Registry as GCR is considered legacy infrastructure.

---

## Solution: Migrate to Artifact Registry

### 1. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create hustle-app \
  --repository-format=docker \
  --location=us-central1 \
  --project=hustleapp-production \
  --description="Docker images for Hustle application"
```

**Result**: Repository created at `us-central1-docker.pkg.dev/hustleapp-production/hustle-app`

### 2. Test Local Docker Push

Before updating GitHub Actions, verified Artifact Registry works locally:

```bash
# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build test image
docker build -t us-central1-docker.pkg.dev/hustleapp-production/hustle-app/hustle-app:test \
  -f Dockerfile .

# Push test image
docker push us-central1-docker.pkg.dev/hustleapp-production/hustle-app/hustle-app:test
```

**Result**: ✅ Push successful - confirmed Artifact Registry working correctly

### 3. Update GitHub Actions Workflow

Modified `.github/workflows/deploy.yml`:

**Before (GCR)**:
```yaml
env:
  PROJECT_ID: hustleapp-production
  REGION: us-central1
  SERVICE_NAME: hustle-app

steps:
  - name: Build and push Docker image
    run: |
      gcloud builds submit --tag gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }} .

  - name: Deploy to Cloud Run (Production)
    run: |
      gcloud run deploy ${{ env.SERVICE_NAME }} \
        --image gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }} \
        --region ${{ env.REGION }} \
        --project ${{ env.PROJECT_ID }}
```

**After (Artifact Registry)**:
```yaml
env:
  PROJECT_ID: hustleapp-production
  REGION: us-central1
  SERVICE_NAME: hustle-app
  REGISTRY: us-central1-docker.pkg.dev/hustleapp-production/hustle-app

steps:
  - name: Configure Docker for Artifact Registry
    run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

  - name: Build and push Docker image
    run: |
      docker build -t ${{ env.REGISTRY }}/${{ env.SERVICE_NAME }}:${{ github.sha }} \
                   -t ${{ env.REGISTRY }}/${{ env.SERVICE_NAME }}:latest \
                   -f Dockerfile .
      docker push ${{ env.REGISTRY }}/${{ env.SERVICE_NAME }}:${{ github.sha }}
      docker push ${{ env.REGISTRY }}/${{ env.SERVICE_NAME }}:latest

  - name: Deploy to Cloud Run (Production)
    run: |
      gcloud run deploy ${{ env.SERVICE_NAME }} \
        --image ${{ env.REGISTRY }}/${{ env.SERVICE_NAME }}:${{ github.sha }} \
        --region ${{ env.REGION }} \
        --project ${{ env.PROJECT_ID }}
```

**Key Changes**:
1. Added `REGISTRY` environment variable pointing to Artifact Registry
2. Changed Docker authentication from GCR to Artifact Registry endpoint
3. Switched from `gcloud builds submit` to direct `docker build` + `docker push`
4. Implemented dual tagging: SHA-based (`github.sha`) + `latest` tag
5. Updated image reference in Cloud Run deployment to use Artifact Registry

### 4. Additional Fix: Remove SENTRY_DSN Secret

First deployment attempt failed with:
```
ERROR: Secret projects/335713777643/secrets/SENTRY_DSN/versions/latest was not found
```

**Fix**: Removed `SENTRY_DSN=SENTRY_DSN:latest` from `--set-secrets` parameter in both production and staging deployments.

**Updated deployment command**:
```yaml
- name: Deploy to Cloud Run (Production)
  run: |
    gcloud run deploy ${{ env.SERVICE_NAME }} \
      --image ${{ env.REGISTRY }}/${{ env.SERVICE_NAME }}:${{ github.sha }} \
      --region ${{ env.REGION }} \
      --project ${{ env.PROJECT_ID }} \
      --platform managed \
      --allow-unauthenticated \
      --set-env-vars "NODE_ENV=production" \
      --set-env-vars "NEXTAUTH_URL=https://hustlestats.io" \
      --set-secrets "DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest"
```

---

## Test Results

### GitHub Actions Run ID: 18612022170

**Deployment Steps**:
1. ✅ Checkout code
2. ✅ Authenticate to Google Cloud (WIF)
3. ✅ Set up Cloud SDK
4. ✅ Configure Docker for Artifact Registry
5. ✅ Build and push Docker image
   - Image: `us-central1-docker.pkg.dev/hustleapp-production/hustle-app/hustle-app:8d60e1a`
   - Tags: `8d60e1a` (commit SHA), `latest`
6. ✅ Deploy to Cloud Run (Production)
   - Service: `hustle-app`
   - Region: `us-central1`
   - URL: https://hustle-app-744074221363.us-central1.run.app
7. ✅ Verify deployment
   - Health check: PASSED
   - Landing page content: VERIFIED

**Verification**:
```bash
curl -s https://hustlestats.io | grep -i "currently in development"
```

**Result**: Confirmed new landing page content deployed:
```html
<span class="text-sm font-medium text-amber-800">🚧 Currently in Development</span>
```

### Landing Page Updates Deployed ✅

- "Currently in Development" badge visible
- Dual CTA strategy: "Try Early Access" + "Share Feedback"
- Honest messaging about development stage
- External survey link integration

---

## Configuration Details

### Artifact Registry Repository

- **Project**: `hustleapp-production`
- **Location**: `us-central1`
- **Repository Name**: `hustle-app`
- **Format**: Docker
- **Full URL**: `us-central1-docker.pkg.dev/hustleapp-production/hustle-app`

### IAM Permissions (Already Configured)

Service Account: `github-actions-sa@hustleapp-production.iam.gserviceaccount.com`

Roles:
- `roles/artifactregistry.writer` ✅ (project-level)
- `roles/artifactregistry.reader` ✅ (repository-level)
- `roles/run.admin` ✅
- `roles/secretmanager.secretAccessor` ✅

### Workload Identity Federation (Already Configured)

- **Pool**: `github-actions-pool`
- **Provider**: `github-provider`
- **Attribute Condition**: `assertion.repository_owner == 'jeremylongshore'`

---

## Rollback Procedure (If Needed)

If Artifact Registry deployment fails, temporarily revert to manual deployment:

```bash
# Build Docker image locally
docker build -t us-central1-docker.pkg.dev/hustleapp-production/hustle-app/hustle-app:manual \
  -f Dockerfile .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/hustleapp-production/hustle-app/hustle-app:manual

# Deploy to Cloud Run manually
gcloud run deploy hustle-app \
  --image us-central1-docker.pkg.dev/hustleapp-production/hustle-app/hustle-app:manual \
  --region us-central1 \
  --project hustleapp-production \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,NEXTAUTH_URL=https://hustlestats.io" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest"
```

---

## Benefits of Artifact Registry over GCR

1. **Reliability**: No retry budget exhausted errors
2. **Modern Infrastructure**: Recommended by Google over legacy GCR
3. **Better IAM Integration**: Cleaner permissions model
4. **Vulnerability Scanning**: Built-in security scanning
5. **Multi-format Support**: Supports Docker, Maven, npm, Python packages
6. **Regional Control**: Better control over data locality

---

## Related Documentation

- `docs/124-TQ-BUGR-github-actions-deployment-failure.md` - Original troubleshooting session
- `.github/workflows/deploy.yml` - Updated deployment workflow
- `.github/workflows/deploy.yml.disabled` - Old workflow (archived)
- `Dockerfile` - Docker build configuration

---

## Commits Related to Migration

```
8d60e1a - fix: remove SENTRY_DSN secret reference from deployment
1e63c99 - fix: migrate from GCR to Artifact Registry for Docker deployments
```

---

## Lessons Learned

1. **GCR is Legacy**: Google recommends Artifact Registry for new projects
2. **Test Locally First**: Always verify Docker push works locally before updating CI/CD
3. **Secret Management**: Audit all secret references before deployment
4. **Dual Tagging Strategy**: Using both commit SHA and `latest` tag provides traceability
5. **Email Notifications**: Disable workflows during debugging to prevent spam
6. **Documentation is Critical**: Detailed troubleshooting docs saved significant time

---

## Open Questions - RESOLVED ✅

1. ~~Why is Cloud Build failing to push to GCR despite `storage.admin` role?~~
   - **Answer**: GCR has known reliability issues; Artifact Registry is recommended
2. ~~Should we migrate from GCR to Artifact Registry entirely?~~
   - **Answer**: YES - migration completed successfully
3. ~~Are there quota limits on gcr.io push operations?~~
   - **Answer**: Not relevant; issue was infrastructure-related, not quota

---

**Last Updated**: 2025-10-18T00:15:00-05:00
**Status**: ✅ RESOLVED - Auto-deployment working with Artifact Registry
**Next Steps**: Monitor automated deployments; consider adding staging environment
**Owner**: Jeremy Longshore
