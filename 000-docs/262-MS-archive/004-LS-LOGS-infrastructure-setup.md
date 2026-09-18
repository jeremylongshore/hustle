# 0001-DEBUG-INFRASTRUCTURE-SETUP

## Summary
Initial infrastructure setup for Hustle MVP - migrated from VM-based to Cloud Run-based deployment due to organizational policy constraints.

## Tasks Completed
- ✅ Created GCP project: hustle-dev-202510
- ✅ Fixed billing quota issue (unlinked creatives-diag-pro, linked hustle-dev-202510)
- ✅ Enabled all required GCP APIs
- ✅ Created Terraform service account with IAM roles
- ✅ Configured Application Default Credentials (ADC)
- ✅ Installed Terraform v1.13.3
- ✅ Created complete Terraform infrastructure (9 files)
- ✅ Deployed base infrastructure (VPC, Cloud SQL, GCS bucket)
- ✅ Migrated from VM to Cloud Run architecture
- ✅ Deployed Cloud Run infrastructure

## Infrastructure Deployed

### Cloud Run Resources
- VPC Connector: `hustle-vpc-connector` (10.8.0.0/28)
- Service Account: `hustle-cloudrun-sa@hustle-dev-202510.iam.gserviceaccount.com`
- IAM Roles: Cloud SQL Client + Storage Object Admin

### Existing Resources
- Cloud SQL PostgreSQL 15 (private IP: 10.240.0.3)
- GCS Bucket: `hustle-mvp-media-b422fbe8` (signed URL access)
- VPC Network: `hustle-vpc` (10.10.1.0/24)
- Firewall rules: HTTP/HTTPS, SSH (IAP), PostgreSQL

## Organizational Policy Issues Resolved

### Issue 1: VM External IP Blocked
- **Error**: `constraints/compute.vmExternalIpAccess`
- **Solution**: Migrated to Cloud Run (serverless, no VM needed)

### Issue 2: Bucket Public Access Blocked
- **Error**: Public access prevention enforced
- **Solution**: Removed public IAM binding, using signed URLs instead

### Issue 3: Service Account Keys Blocked
- **Error**: `constraints/iam.disableServiceAccountKeyCreation`
- **Solution**: Using Workload Identity for Cloud Run (no keys needed)

## Cost Impact
- **Before (VM)**: ~$15-20/month
- **After (Cloud Run)**: ~$5-10/month (potentially free tier)
- **Savings**: ~50-75% reduction

## Next Steps
1. Create Next.js application for Hustle MVP
2. Deploy to Cloud Run using provided command
3. Implement signed URL generation for media access
4. Configure Prisma/PostgreSQL connection

## Deployment Command
```bash
gcloud run deploy hustle-app \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --vpc-connector hustle-vpc-connector \
  --service-account hustle-cloudrun-sa@hustle-dev-202510.iam.gserviceaccount.com \
  --set-env-vars "DATABASE_URL=postgresql://hustle_admin:PASSWORD@10.240.0.3:5432/hustle_mvp" \
  --set-env-vars "GCS_BUCKET=hustle-mvp-media-b422fbe8" \
  --set-env-vars "PROJECT_ID=hustle-dev-202510"
```

## Files Modified
- `/home/jeremy/projects/hustle/terraform/main.tf` - Updated to use ADC
- `/home/jeremy/projects/hustle/terraform/compute.tf` - Converted to Cloud Run
- `/home/jeremy/projects/hustle/terraform/storage.tf` - Removed public access
- `/home/jeremy/projects/hustle/terraform/outputs.tf` - Updated for Cloud Run

## References
- Lean MVP PRD: `/home/jeremy/projects/hustle/hustle-prd-mvp-v2-lean.md`
- Full MVP PRD: `/home/jeremy/projects/hustle/hustle-prd-mvp-v1.md`
- Terraform config: `/home/jeremy/projects/hustle/terraform/`
