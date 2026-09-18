# Hustle MVP - Terraform Infrastructure

**Cost-Optimized GCP Infrastructure for Youth Soccer Tracking App**

## 📋 What This Creates

This Terraform configuration provisions a complete, cost-optimized infrastructure for the Hustle MVP:

### Resources Provisioned:
- **VPC Network** - Custom network with single subnet
- **Compute Instance** - Single e2-micro VM (web server)
- **Cloud SQL** - PostgreSQL db-g1-small (no HA, private IP only)
- **Cloud Storage** - GCS bucket for media uploads
- **Firewall Rules** - HTTP/HTTPS, SSH (via IAP), PostgreSQL
- **Service Accounts** - For app authentication

### Cost Estimate: **~$15-20/month** (development environment)

---

## 🚀 Prerequisites

### 1. Install Required Tools
```bash
# Terraform (>= 1.0)
brew install terraform  # macOS
# OR
sudo apt-get install terraform  # Debian/Ubuntu

# Google Cloud SDK
brew install google-cloud-sdk  # macOS
# OR follow: https://cloud.google.com/sdk/docs/install
```

### 2. GCP Project Setup

**⚠️ IMPORTANT: You need billing enabled!**

Current status: Project `hustle-dev-202510` created but billing quota exceeded.

**Option A: Request Quota Increase** (Recommended)
- See: `/home/jeremy/projects/hustle/BILLING_QUOTA_FIX.md`
- Follow steps to request increase from 3 → 10 projects
- Wait 1-48 hours for approval

**Option B: Unlink Unused Project**
```bash
gcloud billing projects unlink [UNUSED_PROJECT_ID]
gcloud billing projects link hustle-dev-202510 --billing-account=01B257-163362-FC016A
```

### 3. Enable APIs (After Billing is Active)
```bash
gcloud config set project hustle-dev-202510

gcloud services enable \
  compute.googleapis.com \
  servicenetworking.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com
```

### 4. Create Terraform Service Account
```bash
# Create service account
gcloud iam service-accounts create terraform-sa \
  --display-name="Terraform Service Account"

# Get project ID
PROJECT_ID=$(gcloud config get-value project)

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:terraform-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/compute.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:terraform-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:terraform-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:terraform-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:terraform-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/servicenetworking.networksAdmin"

# Generate key
gcloud iam service-accounts keys create .creds/terraform-sa-key.json \
  --iam-account=terraform-sa@${PROJECT_ID}.iam.gserviceaccount.com
```

---

## 📁 Directory Structure

```
terraform/
├── .creds/                    # Credentials (gitignored)
│   └── terraform-sa-key.json  # Terraform service account key
├── .gitignore                 # Protect credentials
├── main.tf                    # Provider configuration
├── variables.tf               # Variable definitions
├── outputs.tf                 # Output values
├── network.tf                 # VPC, subnets, firewall
├── compute.tf                 # VM instance
├── database.tf                # Cloud SQL PostgreSQL
├── storage.tf                 # GCS bucket
├── terraform.tfvars.example   # Example variables (copy this!)
└── README.md                  # This file
```

---

## 🛠️ Deployment Steps

### 1. Configure Variables
```bash
# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values (if needed)
vim terraform.tfvars
```

### 2. Initialize Terraform
```bash
terraform init
```

### 3. Review Plan
```bash
terraform plan
```

**Expected resources to create: ~20**

### 4. Apply Configuration
```bash
terraform apply

# Review the plan, type 'yes' to confirm
```

**Deployment time: ~10-15 minutes** (Cloud SQL takes the longest)

### 5. View Outputs
```bash
terraform output

# See specific output
terraform output web_server_public_ip
terraform output db_connection_string  # sensitive
```

---

## 🔑 Important Files Created

After `terraform apply`, check `.creds/` directory:

```bash
ls -la .creds/
```

Files created:
- `terraform-sa-key.json` - Terraform service account (manual)
- `db_password.txt` - PostgreSQL password (auto-generated)
- `app-service-account-key.json` - App service account key (auto-generated)

**⚠️ These files are gitignored - DO NOT commit them!**

---

## 📊 Infrastructure Details

### Network (network.tf)
- **VPC:** `hustle-vpc` (custom mode)
- **Subnet:** `hustle-public-subnet` (10.10.1.0/24)
- **Firewall:** HTTP/HTTPS (80,443), SSH via IAP, PostgreSQL (5432)

### Compute (compute.tf)
- **Instance:** `hustle-web-server`
- **Type:** e2-micro (2 vCPU, 1GB RAM)
- **OS:** Debian 12
- **Disk:** 10GB standard persistent disk
- **IP:** Ephemeral public IP
- **Startup:** Docker, Node.js 20, PostgreSQL client installed

### Database (database.tf)
- **Instance:** `hustle-db`
- **Type:** PostgreSQL 15
- **Tier:** db-g1-small (1.7GB RAM)
- **HA:** Disabled (cost savings)
- **IP:** Private only (no public IP)
- **Backups:** Disabled (dev environment)

### Storage (storage.tf)
- **Bucket:** `hustle-mvp-media-XXXX` (unique suffix)
- **Location:** US multi-region
- **Class:** Standard
- **Versioning:** Enabled
- **Lifecycle:** Move to Nearline after 90 days

---

## 🔗 Connect to Resources

### SSH to Web Server
```bash
# Get public IP
VM_IP=$(terraform output -raw web_server_public_ip)

# SSH via IAP (no need for SSH keys!)
gcloud compute ssh hustle-web-server \
  --zone=us-central1-a \
  --project=hustle-dev-202510
```

### Connect to Database
```bash
# From the VM or Cloud Shell
DB_CONNECTION=$(terraform output -raw db_connection_name)
DB_IP=$(terraform output -raw db_private_ip)
DB_PASS=$(cat .creds/db_password.txt)

# Using cloud_sql_proxy (recommended)
cloud_sql_proxy $DB_CONNECTION &

# Or direct connection from VM (private IP)
psql "postgresql://hustle_admin:$DB_PASS@$DB_IP:5432/hustle_mvp"
```

### Access Storage Bucket
```bash
# Get bucket name
BUCKET=$(terraform output -raw media_bucket_name)

# List objects
gsutil ls gs://$BUCKET/

# Upload file
gsutil cp local-file.jpg gs://$BUCKET/uploads/
```

---

## 💰 Cost Optimization

### Current Monthly Costs (~$15-20):
- **e2-micro VM:** ~$7/month (730 hours)
- **db-g1-small:** ~$8/month
- **Storage (10GB):** ~$0.20/month
- **Network egress:** ~$1-3/month

### Further Optimization:
1. **Use Preemptible VM** - 80% cheaper (but can be terminated)
2. **Use Cloud Run** instead of VM - pay per request only
3. **Use Firestore** instead of Cloud SQL - free tier generous
4. **Committed Use Discounts** - 57% off for 1-year commitment

---

## 🧹 Cleanup

### Destroy All Resources
```bash
terraform destroy

# Review resources to delete, type 'yes' to confirm
```

**WARNING:** This deletes everything, including:
- Database (data loss!)
- Storage bucket (files lost!)
- VM (app destroyed!)

---

## 🚨 Troubleshooting

### Issue: "Billing account not found"
**Solution:** See `/home/jeremy/projects/hustle/BILLING_QUOTA_FIX.md`

### Issue: "API not enabled"
```bash
# Enable all required APIs
gcloud services enable compute.googleapis.com \
  servicenetworking.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com
```

### Issue: "Credentials not found"
```bash
# Ensure service account key exists
ls -la .creds/terraform-sa-key.json

# If missing, recreate it (see Prerequisites)
```

### Issue: "Cloud SQL creation timeout"
- Cloud SQL takes 10-15 minutes to create
- If timeout occurs, run `terraform apply` again

---

## 📝 Next Steps

1. **Deploy Application:**
   - SSH to VM: `gcloud compute ssh hustle-web-server`
   - Clone app repo
   - Set environment variables (DB connection, bucket name)
   - Run app in Docker

2. **Configure DNS:**
   - Point domain to `web_server_public_ip`
   - Set up SSL with Let's Encrypt

3. **Enable Monitoring:**
   - Cloud Monitoring for VM metrics
   - Cloud Logging for application logs

4. **Production Readiness:**
   - Enable Cloud SQL backups
   - Use static IP instead of ephemeral
   - Add Cloud CDN for media bucket
   - Implement Cloud Armor for DDoS protection

---

## 📚 Resources

- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GCP Free Tier](https://cloud.google.com/free)
- [Cloud SQL Best Practices](https://cloud.google.com/sql/docs/postgres/best-practices)
- [GCS Pricing](https://cloud.google.com/storage/pricing)

---

**Last Updated:** 2025-10-03
**Status:** ✅ Ready to deploy (pending billing approval)
