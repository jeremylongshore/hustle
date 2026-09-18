# HUSTLE MVP - Production Deployment Checklist

**Generated**: 2025-10-12
**Version**: 1.1.0
**Status**: MVP Complete & Production Ready

---

## 📋 Pre-Deployment Checklist

### 1. Environment Setup

#### Local Environment
- [x] `.env.local` configured with development credentials
- [x] Prisma client generated (`npx prisma generate`)
- [x] Database schema synced (`npx prisma db push` or migrations applied)
- [ ] Local build successful (`npm run build`)
- [ ] All tests passing (`npm test`)

#### Google Cloud Project
- [ ] Billing account linked and active
- [ ] Project ID confirmed: `hustle-dev-202510`
- [ ] Region confirmed: `us-central1`
- [ ] Required APIs enabled:
  - [ ] Cloud Run API
  - [ ] Cloud SQL Admin API
  - [ ] Secret Manager API
  - [ ] VPC Access API
  - [ ] Artifact Registry API
  - [ ] Cloud Build API
  - [ ] Identity and Access Management API

### 2. Infrastructure (Terraform)

#### Prerequisites
- [ ] Terraform installed (v1.0+)
- [ ] Google Cloud SDK installed (`gcloud`)
- [ ] Authenticated to GCP (`gcloud auth login`)
- [ ] Service account with required permissions created
- [ ] Service account key downloaded to `.creds/` directory

#### Terraform Validation
- [x] Terraform formatted (`terraform fmt`)
- [x] Terraform validated (`terraform validate`)
- [ ] Terraform plan reviewed (`terraform plan`)
- [ ] No errors in plan output
- [ ] Resource costs estimated and approved

#### Infrastructure Resources
- [ ] VPC network created
- [ ] VPC connector created (for Cloud Run → Cloud SQL)
- [ ] Cloud SQL PostgreSQL instance created
- [ ] Cloud SQL private IP configured
- [ ] GCS bucket for media created
- [ ] Secret Manager secrets created:
  - [ ] DATABASE_URL
  - [ ] NEXTAUTH_SECRET
  - [ ] SENTRY_DSN (optional)
  - [ ] RESEND_API_KEY (optional)

### 3. Database Setup

#### Schema Migration
- [ ] Prisma migrations generated (`npx prisma migrate dev`)
- [ ] Migration files reviewed
- [ ] Migrations applied to production database
- [ ] Database connection tested from Cloud Run

#### Initial Data
- [ ] Admin user created (if applicable)
- [ ] Seed data loaded (if applicable)
- [ ] Database backup verified

### 4. Application Configuration

#### Environment Variables (Production)
Required:
- [ ] `DATABASE_URL` - PostgreSQL connection string with SSL
- [ ] `NEXTAUTH_SECRET` - JWT secret (min 32 chars)
- [ ] `NEXTAUTH_URL` - Production domain (https://hustlestats.io)
- [ ] `NODE_ENV` - Set to "production"

Optional:
- [ ] `SENTRY_DSN` - Error tracking
- [ ] `SENTRY_ENVIRONMENT` - "production"
- [ ] `RESEND_API_KEY` - Email service
- [ ] `EMAIL_FROM` - Email sender address

#### Secret Manager Setup
- [ ] All secrets added to Secret Manager
- [ ] Cloud Run service account has Secret Manager access
- [ ] Secrets referenced in Cloud Run service configuration

### 5. Domain Configuration

#### DNS Setup
- [ ] Domain verified in Google Cloud Console
- [ ] DNS records configured:
  - [ ] A record for `hustlestats.io` pointing to Cloud Run
  - [ ] A record for `www.hustlestats.io` pointing to Cloud Run
  - [ ] AAAA record for IPv6 (optional)
- [ ] SSL certificate auto-provisioned by Google Cloud
- [ ] DNS propagation verified (24-48 hours)

#### Domain Mapping
- [ ] Domain mapping created in Terraform (`domains.tf`)
- [ ] Domain mapping verified in Cloud Console
- [ ] HTTPS redirect enabled
- [ ] SSL certificate active

### 6. CI/CD Pipeline

#### GitHub Actions Setup
- [ ] Repository secrets configured:
  - [ ] `WIF_PROVIDER` - Workload Identity Federation
  - [ ] `WIF_SERVICE_ACCOUNT` - Service account email
- [ ] CI workflow tested (`.github/workflows/ci.yml`)
- [ ] Deploy workflow tested (`.github/workflows/deploy.yml`)
- [ ] Build passes on main branch
- [ ] Deploy succeeds to staging (on PR)
- [ ] Deploy succeeds to production (on merge to main)

#### Deployment Verification
- [ ] Docker image builds successfully
- [ ] Docker image pushed to Artifact Registry
- [ ] Cloud Run service updated with new image
- [ ] Health check endpoint responds (`/api/healthcheck`)

### 7. Security Checklist

#### Authentication & Authorization
- [x] NextAuth v5 configured with JWT strategy
- [x] Passwords hashed with bcrypt (10 rounds)
- [x] Email verification enforced
- [x] Session expiry set (30 days)
- [ ] HTTPS enforced (production)
- [ ] Secure cookies enabled (production)

#### Database Security
- [x] Cloud SQL private IP only (no public IP)
- [x] SSL/TLS required (`sslmode=require`)
- [x] Automated backups enabled
- [x] Point-in-time recovery enabled
- [ ] Database user permissions restricted
- [ ] Connection pooling configured

#### API Security
- [x] All API routes require authentication
- [x] Session-based authorization (user owns data)
- [x] Input validation with Zod schemas
- [ ] Rate limiting configured (optional)
- [ ] CORS configured correctly

#### Infrastructure Security
- [ ] VPC firewall rules configured
- [ ] Cloud Run service account with minimal permissions
- [ ] Secret Manager IAM bindings configured
- [ ] No hardcoded credentials in code
- [ ] `.env` files in `.gitignore`

### 8. Monitoring & Observability

#### Error Tracking (Sentry)
- [ ] Sentry project created
- [ ] `SENTRY_DSN` configured
- [ ] Error boundary components added
- [ ] Source maps uploaded to Sentry
- [ ] Test error sent to verify integration

#### Cloud Monitoring
- [ ] Cloud Monitoring dashboard created
- [ ] Alerting policies configured:
  - [ ] High error rate (5xx responses)
  - [ ] High latency (p95 > 5s)
  - [ ] Database connection failures
  - [ ] Memory usage > 80%
- [ ] Log retention policy set (30 days)
- [ ] Log-based metrics created

#### Uptime Monitoring
- [ ] Uptime check configured for `/api/healthcheck`
- [ ] Alert notification channel configured (email/Slack)
- [ ] Incident response runbook created

### 9. Testing

#### Unit Tests
- [x] Authentication tests passing
- [x] API validation tests passing
- [ ] All unit tests passing (`npm run test:unit`)
- [ ] Test coverage > 70%

#### E2E Tests
- [x] Login/logout flow tested
- [x] Protected route redirects tested
- [x] Health check endpoint tested
- [ ] All E2E tests passing (`npm run test:e2e`)
- [ ] Tests run against staging environment

#### Manual Testing
- [ ] User registration flow tested
- [ ] Email verification tested
- [ ] Password reset tested
- [ ] Player management (add/edit/delete) tested
- [ ] Game logging tested
- [ ] Game verification tested
- [ ] Dashboard displays correctly
- [ ] Mobile responsive design verified

### 10. Performance Optimization

#### Application Performance
- [ ] Next.js standalone output configured
- [ ] Image optimization enabled
- [ ] Static assets cached
- [ ] Database queries optimized
- [ ] API response times < 500ms

#### Cloud Run Configuration
- [ ] CPU and memory limits set appropriately
- [ ] Autoscaling min/max instances configured
- [ ] Cold start optimization (min instances = 1)
- [ ] VPC connector optimized (min instances = 2)

#### Database Performance
- [ ] Database indexes created for common queries
- [ ] Connection pooling enabled
- [ ] Query performance analyzed
- [ ] Slow query logging enabled

---

## 🚀 Deployment Steps

### Step 1: Apply Infrastructure (Terraform)

```bash
cd 06-Infrastructure/terraform

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply infrastructure
terraform apply

# Verify outputs
terraform output
```

### Step 2: Configure Secrets

```bash
# Set DATABASE_URL secret
echo -n "postgresql://user:pass@host:5432/db?sslmode=require" | \
  gcloud secrets create DATABASE_URL --data-file=- --project=hustle-dev-202510

# Set NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
echo -n "your-generated-secret" | \
  gcloud secrets create NEXTAUTH_SECRET --data-file=- --project=hustle-dev-202510

# Set SENTRY_DSN (optional)
echo -n "https://your-key@sentry.io/project-id" | \
  gcloud secrets create SENTRY_DSN --data-file=- --project=hustle-dev-202510

# Set RESEND_API_KEY (optional)
echo -n "re_your_api_key" | \
  gcloud secrets create RESEND_API_KEY --data-file=- --project=hustle-dev-202510
```

### Step 3: Deploy Database Schema

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations to production database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require" \
  npx prisma migrate deploy
```

### Step 4: Deploy Application (Cloud Run)

```bash
# Deploy via gcloud CLI (recommended for first deployment)
gcloud run deploy hustle-app \
  --source . \
  --region us-central1 \
  --project hustle-dev-202510

# OR deploy via CI/CD (push to main branch)
git add .
git commit -m "release: v1.1.0 - MVP Complete"
git push origin main
```

### Step 5: Verify Deployment

```bash
# Check health endpoint
curl https://hustlestats.io/api/healthcheck

# Expected response:
# {"status":"ok","database":"connected"}

# Check Cloud Run service status
gcloud run services describe hustle-app \
  --region us-central1 \
  --project hustle-dev-202510

# Check logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50 \
  --project hustle-dev-202510
```

### Step 6: Configure Domain

```bash
# Verify domain mapping
gcloud run domain-mappings list \
  --region us-central1 \
  --project hustle-dev-202510

# Update DNS records (shown in Terraform outputs)
terraform output dns_configuration
```

### Step 7: Monitor Initial Traffic

```bash
# Watch real-time logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50 \
  --format json \
  --project hustle-dev-202510 | jq .

# Check Cloud Monitoring dashboard
open https://console.cloud.google.com/monitoring/dashboards?project=hustle-dev-202510

# Check Sentry for errors
open https://sentry.io
```

---

## ✅ Post-Deployment Verification

### Smoke Tests
- [ ] Home page loads (https://hustlestats.io)
- [ ] Login page accessible
- [ ] User can register new account
- [ ] User receives verification email
- [ ] User can log in after verification
- [ ] Dashboard loads correctly
- [ ] User can create player profile
- [ ] User can log game stats
- [ ] User can verify game stats
- [ ] User can log out

### Performance Tests
- [ ] Page load time < 2s
- [ ] API response time < 500ms
- [ ] Database query time < 100ms
- [ ] No console errors in browser
- [ ] No server errors in logs

### Security Tests
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Secure cookies set
- [ ] Protected routes redirect to login
- [ ] User can only access their own data
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified

---

## 🔥 Rollback Procedure

If deployment fails or issues are detected:

### Immediate Rollback
```bash
# Rollback Cloud Run to previous revision
gcloud run services update-traffic hustle-app \
  --to-revisions REVISION_NAME=100 \
  --region us-central1 \
  --project hustle-dev-202510
```

### Database Rollback
```bash
# Restore from point-in-time backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=hustle-db \
  --backup-project=hustle-dev-202510
```

### Full Infrastructure Rollback
```bash
# Revert to previous Terraform state
cd 06-Infrastructure/terraform
terraform state pull > backup.tfstate
terraform apply -var-file=previous-version.tfvars
```

---

## 📊 Success Metrics

### Launch Day (Day 1)
- [ ] Zero critical errors in Sentry
- [ ] < 5% error rate (5xx responses)
- [ ] p95 latency < 2s
- [ ] Uptime > 99%

### Week 1
- [ ] All user flows tested by real users
- [ ] User feedback collected
- [ ] Performance baselines established
- [ ] Monitoring dashboards reviewed daily

### Month 1
- [ ] Cost within budget ($20-30/month)
- [ ] Uptime > 99.5%
- [ ] User retention > 50%
- [ ] Zero security incidents

---

## 📚 Additional Resources

### Documentation
- `/CLAUDE.md` - Project overview and tech stack
- `/CHANGELOG.md` - Version history and changes
- `/01-Docs/` - Architecture decisions and PRDs
- `/06-Infrastructure/terraform/README.md` - Infrastructure guide

### Monitoring Dashboards
- [Cloud Console](https://console.cloud.google.com/run?project=hustle-dev-202510)
- [Cloud Monitoring](https://console.cloud.google.com/monitoring?project=hustle-dev-202510)
- [Sentry Dashboard](https://sentry.io)

### Support Contacts
- Infrastructure: Jeremy Longshore
- GCP Billing: Project owner
- Domain Registrar: Check DNS provider

---

**Status**: Ready for production deployment
**Last Updated**: 2025-10-12
**Next Review**: After first production deployment
