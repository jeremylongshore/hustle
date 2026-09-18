# CLAUDE.md - Hustle MVP Terraform Infrastructure

This file provides guidance to Claude Code when working with the Hustle MVP infrastructure code.

---

## Project Overview

**Hustle MVP** is a youth soccer development tracking application. This Terraform configuration provisions the cost-optimized GCP infrastructure for the lean MVP (game logging + parent verification only).

### Related Documentation
- **Lean MVP PRD:** `/home/jeremy/projects/hustle/hustle-prd-mvp-v2-lean.md`
- **Full MVP PRD:** `/home/jeremy/projects/hustle/hustle-prd-mvp-v1.md`
- **Setup Status:** `/home/jeremy/projects/hustle/INFRASTRUCTURE_SETUP_COMPLETE.md`
- **Billing Fix:** `/home/jeremy/projects/hustle/BILLING_QUOTA_FIX.md`

---

## Infrastructure Architecture

### Design Philosophy: Cost-Optimized MVP
- **Primary Goal:** Minimize monthly cost (<$20/month)
- **Secondary Goal:** Validate lean MVP (game logging + verification)
- **NOT optimized for:** High availability, auto-scaling, multi-region

### Resources Provisioned

**Compute:**
- Single `e2-micro` VM (2 vCPU, 1GB RAM)
- No managed instance group, no load balancer
- Ephemeral public IP (no cost)
- Startup script installs: Docker, Node.js 20, PostgreSQL client

**Database:**
- Cloud SQL PostgreSQL 15
- `db-g1-small` tier (1.7GB RAM)
- **NO high availability** (ZONAL only)
- **Private IP only** (no public IP)
- **Backups disabled** (dev environment)

**Storage:**
- Single GCS bucket for media uploads
- Standard storage class
- Lifecycle policy: Move to Nearline after 90 days
- Versioning enabled

**Networking:**
- Custom VPC with single subnet (10.10.1.0/24)
- Firewall rules: HTTP/HTTPS (80,443), SSH via IAP, PostgreSQL (5432)
- Private VPC peering for Cloud SQL

---

## File Structure

```
terraform/
├── .creds/                    # Credentials (gitignored)
│   ├── terraform-sa-key.json       # Terraform service account
│   ├── db_password.txt             # Auto-generated DB password
│   └── app-service-account-key.json # App authentication
├── .gitignore                 # Protect secrets
├── main.tf                    # Provider configuration
├── variables.tf               # All configurable values
├── outputs.tf                 # Export connection details
├── network.tf                 # VPC, subnets, firewall rules
├── compute.tf                 # Web server VM
├── database.tf                # Cloud SQL PostgreSQL
├── storage.tf                 # GCS bucket + IAM
├── terraform.tfvars.example   # Template for custom values
├── README.md                  # User-facing deployment guide
└── CLAUDE.md                  # This file
```

---

## Critical Rules for AI Agents

### 1. NEVER Commit Credentials
- `.creds/` directory is gitignored
- Never suggest removing `.creds/` from `.gitignore`
- All credential files must stay local only
- In production, use Secret Manager instead

### 2. Cost Optimization is PRIMARY
- Always prefer cheaper resources (e2-micro over e2-small)
- Disable HA/multi-zone features for dev environment
- Use standard disks, not SSD (unless explicitly needed)
- Suggest preemptible VMs if asked about further cost reduction

### 3. Terraform State Management
- **Currently:** Local state only (terraform.tfstate)
- **Production:** Must migrate to GCS backend with state locking
- Never commit `terraform.tfstate` or `terraform.tfstate.backup`

### 4. Variable Configuration
- All non-default values → `variables.tf`
- User-specific values → `terraform.tfvars` (gitignored)
- Example values → `terraform.tfvars.example` (committed)
- Hard-coded values → NEVER (always use variables)

### 5. Dependencies Matter
- Cloud SQL requires VPC peering (depends_on)
- Firewall rules must exist before VM creation
- Service accounts must be created before IAM bindings

---

## Common Development Commands

### Initial Setup
```bash
# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your project ID if needed
vim terraform.tfvars

# Initialize Terraform
terraform init
```

### Planning & Deployment
```bash
# Preview changes
terraform plan

# Apply changes (create infrastructure)
terraform apply

# Apply with auto-approve (use cautiously)
terraform apply -auto-approve

# Destroy all resources
terraform destroy
```

### State Management
```bash
# View current state
terraform show

# List all resources in state
terraform state list

# Show specific resource
terraform state show google_compute_instance.web_server

# Remove resource from state (dangerous!)
terraform state rm google_compute_instance.web_server
```

### Outputs
```bash
# Show all outputs
terraform output

# Show specific output
terraform output web_server_public_ip

# Show sensitive outputs
terraform output db_connection_string
```

### Validation & Formatting
```bash
# Validate configuration
terraform validate

# Format all .tf files
terraform fmt

# Format and check
terraform fmt -check
```

---

## Debugging Infrastructure Issues

### Issue: "API not enabled"
```bash
# Enable required APIs
gcloud services enable compute.googleapis.com \
  servicenetworking.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  iam.googleapis.com
```

### Issue: "Insufficient permissions"
```bash
# Check service account has required roles:
# - roles/compute.admin
# - roles/cloudsql.admin
# - roles/storage.admin
# - roles/iam.serviceAccountUser
# - roles/servicenetworking.networksAdmin

# Verify with:
gcloud projects get-iam-policy hustle-dev-202510 \
  --flatten="bindings[].members" \
  --filter="bindings.members:terraform-sa@*"
```

### Issue: "Cloud SQL creation timeout"
- Cloud SQL takes 10-15 minutes to provision
- If timeout occurs, run `terraform apply` again (idempotent)
- Check Cloud Console for actual status

### Issue: "Private IP address range already in use"
```bash
# List existing peered networks
gcloud compute networks peerings list

# If stale peering exists, delete it
gcloud compute networks peerings delete [PEERING_NAME] \
  --network=hustle-vpc
```

---

## Cost Monitoring

### Expected Monthly Costs (~$15-20)
- **e2-micro VM:** ~$7/month (730 hours)
- **db-g1-small SQL:** ~$8/month
- **Storage (10GB):** ~$0.20/month
- **Network egress:** ~$1-3/month (depends on traffic)

### Check Current Costs
```bash
# View billing for project
gcloud billing projects describe hustle-dev-202510

# Export billing data to BigQuery (if configured)
# Or use Cloud Console Billing dashboard
```

### Further Cost Optimization Ideas
1. **Preemptible VM:** 80% cheaper (can be terminated)
2. **Cloud Run instead of VM:** Pay only for requests
3. **Firestore instead of Cloud SQL:** Generous free tier
4. **Committed Use Discounts:** 57% off for 1-year commitment

---

## Production Migration Checklist

When moving from dev to production:

### Security
- [ ] Enable Cloud SQL backups (automated daily)
- [ ] Enable Cloud SQL SSL/TLS (require_ssl = true)
- [ ] Use Secret Manager for database password
- [ ] Restrict GCS bucket CORS origins
- [ ] Remove public read access from bucket
- [ ] Enable Cloud Armor for DDoS protection
- [ ] Set up VPC Service Controls

### Reliability
- [ ] Enable Cloud SQL high availability (REGIONAL)
- [ ] Use SSD disks instead of HDD
- [ ] Add Cloud SQL read replicas
- [ ] Use managed instance group for VM
- [ ] Add Cloud Load Balancer (global HTTP(S))
- [ ] Reserve static external IP

### Monitoring
- [ ] Set up Cloud Monitoring dashboards
- [ ] Configure alerting policies (CPU, memory, disk)
- [ ] Enable Cloud Logging
- [ ] Set up uptime checks
- [ ] Create SLOs/SLIs

### State Management
- [ ] Migrate to GCS backend for state
- [ ] Enable state locking with Cloud Storage
- [ ] Set up separate workspaces (dev, staging, prod)

### Compliance
- [ ] Enable audit logging
- [ ] Set up data retention policies
- [ ] Implement GDPR/COPPA data deletion
- [ ] Document disaster recovery plan

---

## Terraform Best Practices

### Module Organization
- Keep related resources together (network.tf, compute.tf)
- Separate concerns (don't mix compute and storage in one file)
- Use descriptive resource names (web_server, not vm1)

### Variable Naming
- Use lowercase with underscores: `db_tier`
- Be descriptive: `vm_machine_type` not `type`
- Provide descriptions for all variables
- Set sensible defaults where appropriate

### Resource Naming
- Include project prefix: `hustle-vpc`, `hustle-web-server`
- Use hyphens for GCP resources (not underscores)
- Be consistent across resources

### Tagging/Labeling
- Always add labels: environment, project, managed_by
- Use labels for cost allocation
- Include creation date if useful

### Dependencies
- Explicit > implicit (use depends_on when needed)
- Don't create circular dependencies
- Terraform usually handles order correctly

---

## Integration with Hustle Application

### Environment Variables for App
```bash
# Database connection (from Terraform outputs)
DB_HOST=$(terraform output -raw db_private_ip)
DB_NAME="hustle_mvp"
DB_USER="hustle_admin"
DB_PASSWORD=$(cat .creds/db_password.txt)
DB_CONNECTION="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/$DB_NAME"

# Storage
GCS_BUCKET=$(terraform output -raw media_bucket_name)
GOOGLE_APPLICATION_CREDENTIALS="/path/to/.creds/app-service-account-key.json"

# Application
PORT=3000
NODE_ENV=production
```

### Connect from VM
```bash
# SSH to VM
gcloud compute ssh hustle-web-server \
  --zone=us-central1-a \
  --project=hustle-dev-202510

# Inside VM, test database connection
psql "$(terraform output -raw db_connection_string)"

# Test bucket access
gsutil ls gs://$(terraform output -raw media_bucket_name)/
```

---

## TaskWarrior Integration

This infrastructure is tracked in TaskWarrior:

```bash
# View all infrastructure tasks
task project:hustle.mvp

# View next task
task project:hustle.mvp next

# Start a task
task [ID] start

# Complete a task
task [ID] done

# Add annotation
task [ID] annotate "Deployed to production"
```

Current task dependencies:
1. Link billing account (BLOCKED - quota issue)
2. Enable APIs (depends on billing)
3. Create service accounts (depends on APIs)
4. Deploy infrastructure (depends on service accounts)

---

## Quick Reference

### GCP Project Details
- **Project ID:** hustle-dev-202510
- **Region:** us-central1
- **Zone:** us-central1-a
- **Billing Account:** 01B257-163362-FC016A (quota issue pending)

### Key Resources
- **VPC:** hustle-vpc (10.10.1.0/24)
- **VM:** hustle-web-server (e2-micro)
- **Database:** hustle-db (PostgreSQL 15, db-g1-small)
- **Bucket:** hustle-mvp-media-XXXX (random suffix)

### Important URLs
- GCP Console: https://console.cloud.google.com/home/dashboard?project=hustle-dev-202510
- Quotas: https://console.cloud.google.com/iam-admin/quotas?project=hustle-dev-202510
- Billing: https://console.cloud.google.com/billing

---

## Support & Troubleshooting

### Getting Help
1. Check `README.md` for deployment instructions
2. Review Terraform error messages carefully
3. Check GCP Cloud Console for resource status
4. View logs: `gcloud logging read "resource.type=gce_instance"`

### Common Errors
- **403 Forbidden:** Check service account permissions
- **Already exists:** Resource name conflict (rename or import)
- **Timeout:** Resource taking longer than expected (retry)
- **Quota exceeded:** Request quota increase via Cloud Console

### Documentation Links
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Cloud SQL Best Practices](https://cloud.google.com/sql/docs/postgres/best-practices)
- [GCS Lifecycle Management](https://cloud.google.com/storage/docs/lifecycle)
- [VPC Networking](https://cloud.google.com/vpc/docs)

---

**Last Updated:** 2025-10-03
**Status:** Ready to deploy (pending billing approval)
**Maintained By:** Jeremy Longshore
**AI-Friendly:** Optimized for Claude Code agent assistance
