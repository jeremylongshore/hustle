# GitHub Secrets Mapping - Firebase Migration

**Document Type**: Operations Documentation - Secrets
**Phase**: Phase 4 Task 5 - CI/CD Firebase-First
**Created**: 2025-11-16
**Status**: ACTIVE

---

## Overview

This document maps GitHub Actions secrets from legacy systems (NextAuth + Prisma) to Firebase-first configuration. Use this guide to update Google Cloud Secret Manager and GitHub repository secrets.

---

## GitHub Repository Secrets

### **Location**: `Settings` → `Secrets and variables` → `Actions`

---

## Legacy Secrets (DEPRECATED)

These secrets are no longer used and can be removed from GitHub Actions after Firebase deployment is verified:

| Secret Name | Purpose | Status |
|-------------|---------|--------|
| `DATABASE_URL` | PostgreSQL connection string | ❌ DEPRECATED |
| `NEXTAUTH_SECRET` | NextAuth session encryption key | ❌ DEPRECATED |
| `NEXTAUTH_URL` | NextAuth base URL | ❌ DEPRECATED (moved to env var) |

**Action**: Remove these secrets after successful Firebase deployment to staging and production.

---

## Active Secrets (Firebase + Infrastructure)

### **1. Workload Identity Federation**

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `WIF_PROVIDER` | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider` | GitHub Actions → GCP authentication |
| `WIF_SERVICE_ACCOUNT` | `github-actions@hustleapp-production.iam.gserviceaccount.com` | Service account for deployments |

**Status**: ✅ ACTIVE (already configured)
**Used By**: All deployment workflows

---

### **2. Firebase Admin SDK**

These secrets authenticate server-side Firebase operations in Cloud Run and Cloud Functions:

| Secret Name | Value Source | Purpose |
|-------------|--------------|---------|
| `FIREBASE_PRIVATE_KEY` | Firebase Console → Service Accounts → Generate Key | Server-side Firebase Admin SDK authentication |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console → Service Accounts → `firebase-adminsdk-xxxxx@hustleapp-production.iam.gserviceaccount.com` | Firebase Admin SDK service account |

**How to Get**:
1. Go to [Firebase Console](https://console.firebase.google.com/project/hustleapp-production/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Download JSON file
4. Extract `private_key` → Store as `FIREBASE_PRIVATE_KEY`
5. Extract `client_email` → Store as `FIREBASE_CLIENT_EMAIL`

**Format**:
```bash
# FIREBASE_PRIVATE_KEY (multiline - preserve \n)
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...
-----END PRIVATE KEY-----

# FIREBASE_CLIENT_EMAIL (single line)
firebase-adminsdk-xxxxx@hustleapp-production.iam.gserviceaccount.com
```

**Status**: ✅ ACTIVE
**Used By**:
- `.github/workflows/deploy.yml` (Cloud Run deployment)
- Cloud Run service (via Secret Manager)
- Cloud Functions (via Secret Manager)

---

### **3. Firebase Project ID**

**Not a secret** - Public project identifier:

| Environment Variable | Value | Purpose |
|---------------------|-------|---------|
| `FIREBASE_PROJECT_ID` | `hustleapp-production` | Firebase project identifier |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `hustleapp-production` | Client-side Firebase SDK |

**Status**: ✅ ACTIVE (hardcoded in workflows as `env.PROJECT_ID`)
**Used By**: All Firebase operations

---

### **4. Email Service (Resend)**

| Secret Name | Value Source | Purpose |
|-------------|--------------|---------|
| `RESEND_API_KEY` | [Resend Dashboard](https://resend.com/api-keys) | Email sending (transactional emails) |

**Status**: ✅ ACTIVE (unchanged from Phase 3)
**Used By**: Cloud Run service (game verification emails, password reset, etc.)

---

### **5. Sentry Error Tracking (Optional)**

| Secret Name | Value Source | Purpose |
|-------------|--------------|---------|
| `SENTRY_AUTH_TOKEN` | [Sentry Settings](https://sentry.io/settings/) | Error tracking deployment |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Project Settings | Client-side error reporting |

**Status**: ✅ ACTIVE (optional - used for error monitoring)
**Used By**: Next.js app (client + server error tracking)

---

## Google Cloud Secret Manager

### **Legacy Secrets (Mark as DEPRECATED)**

In Google Cloud Console → Security → Secret Manager:

| Secret Name | Status | Action |
|-------------|--------|--------|
| `DATABASE_URL` | ❌ DEPRECATED | Add description: "LEGACY - Use for Prisma utility routes only" |
| `NEXTAUTH_SECRET` | ❌ DEPRECATED | Add description: "LEGACY - Archived in Phase 4 Task 3" |

**DO NOT DELETE** - Some low-priority routes still use these (see Phase 4 Task 4 AAR).

---

### **Active Secrets (Firebase)**

Ensure these secrets exist in Google Cloud Secret Manager:

| Secret Name | Latest Version | Purpose |
|-------------|----------------|---------|
| `FIREBASE_PRIVATE_KEY` | latest | Firebase Admin SDK authentication |
| `FIREBASE_CLIENT_EMAIL` | latest | Firebase Admin SDK service account |
| `RESEND_API_KEY` | latest | Email sending |
| `SENTRY_AUTH_TOKEN` | latest (optional) | Error tracking |
| `NEXT_PUBLIC_SENTRY_DSN` | latest (optional) | Client-side error reporting |

**How to Verify**:
```bash
# List all secrets
gcloud secrets list --project=hustleapp-production

# Check secret value (without exposing)
gcloud secrets versions list FIREBASE_CLIENT_EMAIL --project=hustleapp-production
```

**How to Create/Update**:
```bash
# Create secret (one-time)
echo -n "your-secret-value" | gcloud secrets create SECRET_NAME \
  --data-file=- \
  --project=hustleapp-production \
  --replication-policy="automatic"

# Add new version
echo -n "new-value" | gcloud secrets versions add SECRET_NAME \
  --data-file=- \
  --project=hustleapp-production
```

---

## Workflow-Specific Secrets Usage

### **ci.yml** (CI Pipeline)

**Before** (Legacy):
```yaml
-e DATABASE_URL=postgresql://test:test@localhost:5432/test
-e NEXTAUTH_SECRET=test_secret_32_characters_long
-e NEXTAUTH_URL=http://localhost:8080
```

**After** (Firebase):
```yaml
-e NEXT_PUBLIC_FIREBASE_PROJECT_ID=hustleapp-production
-e FIREBASE_PROJECT_ID=hustleapp-production
```

**Secrets Used**: None (uses public project ID only for Docker test)

---

### **deploy.yml** (Cloud Run Deployment)

**Before** (Legacy Staging):
```yaml
--set-env-vars "NEXTAUTH_URL=https://staging-hustlestats.io"
--set-secrets "DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest"
```

**After** (Firebase Staging):
```yaml
--set-env-vars "NEXT_PUBLIC_FIREBASE_PROJECT_ID=${{ env.PROJECT_ID }}"
--set-secrets "FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest"
```

**Before** (Legacy Production):
```yaml
--set-env-vars "NEXTAUTH_URL=https://hustlestats.io"
--set-secrets "DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,RESEND_API_KEY=RESEND_API_KEY:latest"
```

**After** (Firebase Production):
```yaml
--set-env-vars "NEXT_PUBLIC_FIREBASE_PROJECT_ID=${{ env.PROJECT_ID }}"
--set-secrets "FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,RESEND_API_KEY=RESEND_API_KEY:latest"
```

**Secrets Used**:
- `WIF_PROVIDER` (GitHub → GCP auth)
- `WIF_SERVICE_ACCOUNT` (GitHub → GCP auth)
- `FIREBASE_PRIVATE_KEY` (via Secret Manager)
- `FIREBASE_CLIENT_EMAIL` (via Secret Manager)
- `RESEND_API_KEY` (via Secret Manager)

---

### **deploy-firebase.yml** (Firebase Hosting + Functions)

**Secrets Used**:
- `WIF_PROVIDER` (GitHub → GCP auth)
- `WIF_SERVICE_ACCOUNT` (GitHub → GCP auth)

**Notes**:
- Uses WIF for authentication (no service account keys)
- Firebase secrets injected via Secret Manager in Cloud Functions runtime
- No GitHub secrets needed beyond WIF

---

## Migration Checklist

### **Phase 4 Task 5 (This Task)**

- [x] Update `ci.yml` with Firebase env vars
- [x] Update `deploy.yml` staging with Firebase secrets
- [x] Update `deploy.yml` production with Firebase secrets
- [x] Document secrets mapping

### **Next Steps (Before Production Deploy)**

- [ ] Verify `FIREBASE_PRIVATE_KEY` exists in Google Cloud Secret Manager
- [ ] Verify `FIREBASE_CLIENT_EMAIL` exists in Google Cloud Secret Manager
- [ ] Test staging deployment with new secrets
- [ ] Verify Cloud Run service can authenticate to Firebase Admin SDK
- [ ] Remove legacy secrets after successful production deployment

---

## Troubleshooting

### **Issue: Cloud Run fails to authenticate to Firebase**

**Symptoms**:
```
Error: Failed to initialize Firebase Admin SDK
Error: Credential implementation provided to initializeApp() via the "credential" property failed...
```

**Solution**:
1. Check Secret Manager has correct values:
   ```bash
   gcloud secrets versions access latest --secret=FIREBASE_PRIVATE_KEY
   gcloud secrets versions access latest --secret=FIREBASE_CLIENT_EMAIL
   ```

2. Verify service account permissions:
   ```bash
   # Firebase Admin SDK service account needs these roles:
   - roles/firebase.admin
   - roles/datastore.user (for Firestore)
   ```

3. Check newline escaping in `FIREBASE_PRIVATE_KEY`:
   ```typescript
   // In code, ensure \n is properly replaced
   privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
   ```

---

### **Issue: WIF authentication fails**

**Symptoms**:
```
Error: Failed to authenticate to Google Cloud
```

**Solution**:
1. Verify WIF pool and provider exist:
   ```bash
   gcloud iam workload-identity-pools describe github-pool \
     --location=global --project=hustleapp-production
   ```

2. Check service account has correct roles:
   ```bash
   gcloud projects get-iam-policy hustleapp-production \
     --flatten="bindings[].members" \
     --filter="bindings.members:github-actions@*"
   ```

3. Verify GitHub repository settings:
   - Settings → Actions → General → Workflow permissions
   - Must have "Read and write permissions"

---

## Security Best Practices

1. **Never commit secrets** to Git (use `.env.example` template only)
2. **Rotate Firebase keys** every 90 days
3. **Use WIF** instead of service account keys where possible
4. **Limit secret access** to specific workflows/jobs
5. **Audit secret usage** regularly in Cloud Logging
6. **Enable Secret Manager versioning** for rollback capability

---

## Related Documentation

- **Phase 4 Task 3 AAR**: NextAuth shutdown (removed NEXTAUTH_SECRET)
- **Phase 4 Task 4 AAR**: Prisma cleanup (marked DATABASE_URL as legacy)
- **Firebase Setup**: `000-docs/189-AA-SUMM-hustle-step-1-auth-wiring-complete.md`
- **Deployment Guide**: `000-docs/188-AA-MAAR-hustle-auth-wiring-staging-e2e.md`

---

**Last Updated**: 2025-11-16
**Status**: ACTIVE
**Next Review**: Before production deployment (Phase 5)

---
