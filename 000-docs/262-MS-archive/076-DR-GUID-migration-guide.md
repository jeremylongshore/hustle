# HUSTLE Migration Guide - Clean Project Structure

**Date**: 2025-10-13
**Goal**: Move to clean, properly-named projects

## Target Structure

```
hustle-database (1017888118069)
  └── Cloud SQL: hustle-db

hustleapp-production (335713777643)
  └── Cloud Run: hustle-app

DELETE:
  - hustle-devops (744074221363)
  - hustle-dev-202510 (158864638007)
```

---

## Step 1: Set Up Database Project

### 1.1 Enable Required APIs

```bash
gcloud services enable compute.googleapis.com \
  sqladmin.googleapis.com \
  servicenetworking.googleapis.com \
  --project=hustle-database
```

### 1.2 Create VPC Network

```bash
gcloud compute networks create hustle-vpc \
  --subnet-mode=custom \
  --project=hustle-database

gcloud compute networks subnets create hustle-subnet \
  --network=hustle-vpc \
  --region=us-central1 \
  --range=10.10.0.0/24 \
  --project=hustle-database
```

### 1.3 Allocate Private IP Range

```bash
gcloud compute addresses create hustle-db-ip-range \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --network=hustle-vpc \
  --project=hustle-database
```

### 1.4 Create Service Networking Connection

```bash
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=hustle-db-ip-range \
  --network=hustle-vpc \
  --project=hustle-database
```

### 1.5 Create Cloud SQL Instance

```bash
gcloud sql instances create hustle-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --network=projects/hustle-database/global/networks/hustle-vpc \
  --no-assign-ip \
  --backup-start-time=03:00 \
  --project=hustle-database
```

**Time**: 10-15 minutes

### 1.6 Create Database User

```bash
gcloud sql users create hustle_admin \
  --instance=hustle-db \
  --password="GENERATE_SECURE_PASSWORD" \
  --project=hustle-database
```

### 1.7 Create Database

```bash
gcloud sql databases create hustle_mvp \
  --instance=hustle-db \
  --project=hustle-database
```

---

## Step 2: Set Up App Project

### 2.1 Enable Required APIs

```bash
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  vpcaccess.googleapis.com \
  --project=hustleapp-production
```

### 2.2 Grant Cloud Build Service Account Permissions

```bash
PROJECT_NUMBER=$(gcloud projects describe hustleapp-production --format='value(projectNumber)')

gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

### 2.3 Grant Cloud SQL Access (Cross-Project)

Since the database is in a different project, we use Cloud SQL Proxy:

```bash
# Grant Cloud Run service account Cloud SQL Client role
gcloud sql instances add-iam-policy-binding hustle-db \
  --member="serviceAccount:335713777643-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client" \
  --project=hustle-database
```

### 2.4 Deploy App to Cloud Run

```bash
cd /home/jeremy/projects/hustle

gcloud run deploy hustle-app \
  --source . \
  --region us-central1 \
  --project hustleapp-production \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=5 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60 \
  --add-cloudsql-instances="hustle-database:us-central1:hustle-db" \
  --set-env-vars="NODE_ENV=production,PORT=8080,NEXTAUTH_URL=https://hustlestats.io" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest"
```

**Note**: DATABASE_URL must use Unix socket format for Cloud SQL Proxy:
```
postgresql://hustle_admin:PASSWORD@/hustle_mvp?host=/cloudsql/hustle-database:us-central1:hustle-db
```

---

## Step 3: Migrate Data

### 3.1 Export from Old Database

**From hustle-devops:**

```bash
gcloud sql export sql hustle-db-dev \
  gs://hustle-migration-temp/backup.sql \
  --database=hustle_mvp \
  --project=hustle-devops
```

### 3.2 Import to New Database

```bash
gcloud sql import sql hustle-db \
  gs://hustle-migration-temp/backup.sql \
  --database=hustle_mvp \
  --project=hustle-database
```

---

## Step 4: Update Connection String

### 4.1 Get New Database Connection String

```bash
# Get private IP
DB_IP=$(gcloud sql instances describe hustle-db \
  --project=hustle-database \
  --format='value(ipAddresses[0].ipAddress)')

echo "DATABASE_URL=postgresql://hustle_admin:PASSWORD@${DB_IP}:5432/hustle_mvp"
```

### 4.2 Update Secret in hustleapp-production

```bash
# Create secret
echo -n "postgresql://hustle_admin:PASSWORD@${DB_IP}:5432/hustle_mvp" | \
  gcloud secrets create DATABASE_URL \
  --data-file=- \
  --project=hustleapp-production

# Or update existing
echo -n "postgresql://hustle_admin:PASSWORD@${DB_IP}:5432/hustle_mvp" | \
  gcloud secrets versions add DATABASE_URL \
  --data-file=- \
  --project=hustleapp-production
```

---

## Step 5: Test New Setup

### 5.1 Get New App URL

```bash
gcloud run services describe hustle-app \
  --region us-central1 \
  --project hustleapp-production \
  --format='value(status.url)'
```

### 5.2 Test Health Check

```bash
curl https://CLOUD_RUN_URL/api/healthcheck
```

**Expected**: `{"status":"ok","message":"Database connection successful"}`

### 5.3 Test Full App

1. Visit the URL in browser
2. Sign up for new account
3. Create player
4. Log game
5. Verify all features work

---

## Step 6: Map Domain

```bash
gcloud run domain-mappings create \
  --service=hustle-app \
  --domain=hustlestats.io \
  --region=us-central1 \
  --project=hustleapp-production
```

Update DNS:
- Get records: `gcloud run domain-mappings describe hustlestats.io --region=us-central1 --project=hustleapp-production`
- Add A and AAAA records to your DNS provider

---

## Step 7: Delete Old Projects (ONLY AFTER VERIFIED)

### ⚠️ CRITICAL: Verify Everything Works First!

```bash
# Delete hustle-dev-202510
gcloud projects delete hustle-dev-202510

# Delete hustle-devops
gcloud projects delete hustle-devops
```

---

## Final Cost

- **hustle-database**: Cloud SQL db-f1-micro ($7-15/month)
- **hustleapp-production**: Cloud Run ($0-5/month)
- **Total**: $7-20/month ✅

---

## Rollback Plan

If anything goes wrong:

1. App still works in hustle-devops
2. Database still accessible
3. Can rollback by:
   - Point domain back to old URL
   - Keep old projects running
   - Delete new projects

---

**Status**: Ready to execute
**Estimated Time**: 45-60 minutes total
**Risk**: Low (old setup remains until verified)
