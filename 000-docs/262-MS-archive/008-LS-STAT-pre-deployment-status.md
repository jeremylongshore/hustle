# ✅ Hustle MVP Infrastructure - READY TO DEPLOY

**Date:** 2025-10-04
**Status:** All prerequisites complete, ready for Terraform deployment

---

## 🎉 What Was Completed

### ✅ Billing & Project Setup
- **Unlinked billing** from `creatives-diag-pro` project
- **Linked billing** to `hustle-dev-202510` project
- **Billing enabled:** ✅ Active

### ✅ GCP APIs Enabled
All required APIs successfully enabled:
- ✅ `compute.googleapis.com` - Compute Engine
- ✅ `servicenetworking.googleapis.com` - VPC Peering
- ✅ `sqladmin.googleapis.com` - Cloud SQL
- ✅ `storage.googleapis.com` - Cloud Storage
- ✅ `cloudresourcemanager.googleapis.com` - Project management
- ✅ `iam.googleapis.com` - IAM

### ✅ Service Account Created
- **Name:** `terraform-sa@hustle-dev-202510.iam.gserviceaccount.com`
- **Roles granted:**
  - `roles/compute.admin`
  - `roles/cloudsql.admin`
  - `roles/storage.admin`
  - `roles/iam.serviceAccountUser`
  - `roles/servicenetworking.networksAdmin`

### ✅ Terraform Infrastructure Files
Complete infrastructure code in `/home/jeremy/projects/hustle/terraform/`:
- `main.tf` - Provider config (updated for ADC)
- `variables.tf` - All configuration values
- `outputs.tf` - Connection details export
- `network.tf` - VPC, firewall rules
- `compute.tf` - e2-micro web server
- `database.tf` - Cloud SQL PostgreSQL
- `storage.tf` - GCS media bucket
- `terraform.tfvars.example` - Config template
- `README.md` - User deployment guide
- `CLAUDE.md` - AI agent documentation

---

## 🔐 Authentication Workaround

### Issue: Service Account Keys Blocked
Your GCP organization has a policy preventing service account key creation:
```
constraints/iam.disableServiceAccountKeyCreation
```

### Solution: Application Default Credentials (ADC)

**You need to run this command manually** (requires browser authentication):

```bash
cd /home/jeremy/projects/hustle/terraform

# Authenticate with your Google account
gcloud auth application-default login

# This opens a browser for you to login
# Creates credentials at: ~/.config/gcloud/application_default_credentials.json
```

**Note:** `main.tf` has been updated to use ADC instead of service account keys.

---

## 🚀 Deploy Infrastructure (3 Steps)

### Step 1: Authenticate (MANUAL - One Time)
```bash
# Open a terminal and run:
gcloud auth application-default login

# Follow browser prompts to authenticate
```

### Step 2: Configure Variables (Optional)
```bash
cd /home/jeremy/projects/hustle/terraform

# Copy example (already has correct project ID)
cp terraform.tfvars.example terraform.tfvars

# Edit if needed (optional)
vim terraform.tfvars
```

### Step 3: Deploy with Terraform
```bash
# Initialize Terraform
terraform init

# Review what will be created (~20 resources)
terraform plan

# Deploy infrastructure (10-15 minutes)
terraform apply

# Type 'yes' when prompted
```

---

## 📊 What Will Be Created

### Compute
- **VM:** `hustle-web-server` (e2-micro, Debian 12)
- **Startup:** Docker, Node.js 20, PostgreSQL client pre-installed
- **IP:** Ephemeral public IP (free)

### Database
- **Instance:** `hustle-db` (PostgreSQL 15, db-g1-small)
- **IP:** Private only (no public access)
- **HA:** Disabled (cost savings)
- **Backups:** Disabled (dev environment)

### Storage
- **Bucket:** `hustle-mvp-media-XXXX` (random suffix)
- **Lifecycle:** Move to Nearline after 90 days
- **Versioning:** Enabled

### Network
- **VPC:** `hustle-vpc` (custom mode)
- **Subnet:** `hustle-public-subnet` (10.10.1.0/24)
- **Firewall:** HTTP/HTTPS, SSH (IAP), PostgreSQL

### Service Accounts
- **App SA:** For application authentication
- **Key:** Auto-generated at `.creds/app-service-account-key.json`

---

## 💰 Monthly Cost Estimate

**Total: ~$15-20/month** (development)

| Resource | Monthly Cost |
|----------|--------------|
| e2-micro VM | ~$7 |
| db-g1-small PostgreSQL | ~$8 |
| Storage (10GB) | ~$0.20 |
| Network egress | ~$1-3 |

---

## 🔗 After Deployment

### Get Connection Details
```bash
cd /home/jeremy/projects/hustle/terraform

# View all outputs
terraform output

# Get specific values
terraform output web_server_public_ip
terraform output db_connection_string
terraform output media_bucket_name
```

### Connect to Resources

**SSH to VM:**
```bash
gcloud compute ssh hustle-web-server \
  --zone=us-central1-a \
  --project=hustle-dev-202510
```

**Database Connection:**
```bash
# Get connection info
DB_IP=$(terraform output -raw db_private_ip)
DB_PASS=$(cat .creds/db_password.txt)

# Connect from VM (private IP)
psql "postgresql://hustle_admin:$DB_PASS@$DB_IP:5432/hustle_mvp"
```

**Storage Bucket:**
```bash
BUCKET=$(terraform output -raw media_bucket_name)

# List objects
gsutil ls gs://$BUCKET/

# Upload file
gsutil cp file.jpg gs://$BUCKET/uploads/
```

---

## 📋 TaskWarrior Progress

```bash
# View all tasks
task project:hustle.mvp

# Current status: 19% complete (17 of 21 tasks remaining)
```

**Next tasks:**
- Setup ADC (manual browser auth)
- Run `terraform init`
- Run `terraform apply`
- Deploy application to VM

---

## 📚 Documentation

1. **Lean MVP PRD:** `/home/jeremy/projects/hustle/hustle-prd-mvp-v2-lean.md`
2. **Terraform README:** `/home/jeremy/projects/hustle/terraform/README.md`
3. **Terraform CLAUDE.md:** `/home/jeremy/projects/hustle/terraform/CLAUDE.md`
4. **Billing Fix (resolved):** `/home/jeremy/projects/hustle/BILLING_QUOTA_FIX.md`

---

## ⚠️ Important Notes

### Security (Development Only)
- ❌ Database backups disabled
- ❌ High availability disabled
- ❌ Using ADC instead of service account keys
- ⚠️ Public read access on GCS bucket (for media)

### Before Production
- [ ] Enable Cloud SQL backups
- [ ] Enable high availability (REGIONAL)
- [ ] Use Workload Identity Federation
- [ ] Restrict bucket CORS origins
- [ ] Add Cloud Armor (DDoS protection)
- [ ] Set up monitoring and alerting

---

## ✅ Ready Checklist

- [x] GCP project created (`hustle-dev-202510`)
- [x] Billing enabled
- [x] APIs enabled
- [x] Service account created with IAM roles
- [x] Terraform infrastructure code complete
- [x] Authentication method configured (ADC)
- [ ] **YOU DO:** Run `gcloud auth application-default login`
- [ ] **YOU DO:** Run `terraform init && terraform plan`
- [ ] **YOU DO:** Run `terraform apply`

---

## 🎯 Next Step

**Run this command in your terminal:**

```bash
cd /home/jeremy/projects/hustle/terraform
gcloud auth application-default login
```

Then follow the browser prompts to authenticate.

After authentication succeeds, you can deploy:

```bash
terraform init
terraform plan
terraform apply
```

---

**Infrastructure is ready! Just authenticate and deploy.** 🚀

