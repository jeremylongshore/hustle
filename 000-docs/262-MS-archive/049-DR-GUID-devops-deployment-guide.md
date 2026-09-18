# Hustle™ Deployment Guide

**Document Type:** Reference - DevOps Operations
**Status:** Active
**Last Updated:** 2025-10-08
**Version:** 1.0.0
**Engineer:** Jeremy (DevOps Lead)

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Run Deployment](#cloud-run-deployment)
5. [Database Operations](#database-operations)
6. [Troubleshooting](#troubleshooting)

---

## Quick Reference

### Essential Commands

```bash
# Local Development
npm run dev              # Start dev server (port 3000/3001/3003)
npm run build            # Production build
npm run lint             # Run linter
npm test                 # Run Playwright tests

# Database
npx prisma generate      # Regenerate Prisma client
npx prisma db push       # Push schema changes (dev)
npx prisma migrate dev   # Create migration (prod)
npx prisma studio        # Open database GUI

# Docker
docker-compose up -d postgres          # Start PostgreSQL only
docker-compose up -d --build           # Build and start all services
docker-compose down                    # Stop all services
docker-compose logs -f hustle-app      # View app logs

# Infrastructure (Terraform)
cd 06-Infrastructure/terraform
terraform plan           # Preview changes
terraform apply          # Apply infrastructure changes
terraform destroy        # Destroy infrastructure
```

### Critical Endpoints

**Local Development:**
- App: http://localhost:3003
- Database: localhost:5432
- Prisma Studio: http://localhost:5555 (when running `npx prisma studio`)

**Production (via Cloud Run):**
- Not yet deployed
- Will be: https://hustle-app-<hash>.run.app

**Monitoring:**
- GCP Console: https://console.cloud.google.com
- Resend Dashboard: https://resend.com/emails

---

## Local Development

### Prerequisites

**Required:**
- Node.js 20.x or higher
- npm 10.x or higher
- PostgreSQL 15.x
- Git

**Optional:**
- Docker & Docker Compose (for containerized PostgreSQL)
- Terraform 1.5+ (for infrastructure management)

### Environment Setup

1. **Clone Repository**
   ```bash
   cd /home/jeremy/projects/hustle
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Edit `.env.local`:
   ```bash
   # Database
   DATABASE_URL="postgresql://hustle_admin:PASSWORD@localhost:5432/hustle_mvp"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:4000"

   # Resend Email
   RESEND_API_KEY="re_your_key_here"
   EMAIL_FROM="Hustle <onboarding@resend.dev>"

   # Application
   NODE_ENV=development
   NEXT_PUBLIC_API_DOMAIN=http://localhost:4000
   NEXT_PUBLIC_WEBSITE_DOMAIN=http://localhost:4000
   ```

4. **Database Setup**

   **Option A: Docker PostgreSQL (Recommended)**
   ```bash
   docker-compose up -d postgres
   ```

   **Option B: Local PostgreSQL**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE hustle_mvp;
   CREATE USER hustle_admin WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE hustle_mvp TO hustle_admin;
   \q
   ```

5. **Apply Database Schema**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

   Server will start on first available port (3000, 3001, 3003, etc.)

### Development Workflow

**Making Changes:**

1. **Code Changes** - Edit files in `src/`
2. **Database Schema Changes**:
   ```bash
   # Edit prisma/schema.prisma
   npx prisma db push              # Apply to dev DB
   npx prisma generate             # Regenerate client
   # Restart dev server to clear cache
   ```

3. **Testing**:
   ```bash
   npm run lint                    # Check code quality
   npm test                        # Run Playwright tests
   npm run test:ui                 # Run tests with UI
   ```

4. **Build Verification**:
   ```bash
   npm run build                   # Ensure production build works
   ```

### Hot Reload & Cache

Next.js with Turbopack provides fast hot reload, but sometimes cache issues occur:

**Clear Next.js Cache:**
```bash
rm -rf .next
npm run dev
```

**Clear Prisma Cache:**
```bash
npx prisma generate
# Then restart dev server
```

---

## Docker Deployment

### Docker Compose (Local)

**Start Services:**
```bash
# Start PostgreSQL only
docker-compose up -d postgres

# Start all services (app + database)
docker-compose up -d --build

# View logs
docker-compose logs -f hustle-app
docker-compose logs -f postgres
```

**Stop Services:**
```bash
docker-compose down              # Stop all services
docker-compose down -v           # Stop and remove volumes (deletes data!)
```

### Docker Build (Production Image)

**Build Image:**
```bash
docker build -t hustle-app:latest -f 06-Infrastructure/docker/Dockerfile .
```

**Test Locally:**
```bash
docker run -p 4000:4000 \
  --env-file .env.local \
  hustle-app:latest
```

**Push to Google Container Registry:**
```bash
# Tag image
docker tag hustle-app:latest gcr.io/YOUR-PROJECT-ID/hustle-app:latest

# Authenticate
gcloud auth configure-docker

# Push
docker push gcr.io/YOUR-PROJECT-ID/hustle-app:latest
```

### Dockerfile Details

Location: `06-Infrastructure/docker/Dockerfile`

**Build Stages:**
1. **Dependencies** - Install Node.js packages
2. **Builder** - Build Next.js app with Turbopack
3. **Runner** - Production runtime (standalone output)

**Key Features:**
- Multi-stage build (optimized image size)
- Next.js standalone output
- Non-root user for security
- Healthcheck endpoint

---

## Cloud Run Deployment

### Prerequisites

1. **GCP Project Setup**
   ```bash
   gcloud config set project YOUR-PROJECT-ID
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

2. **Terraform Infrastructure** (if not already deployed)
   ```bash
   cd 06-Infrastructure/terraform
   terraform init
   terraform apply
   ```

   This creates:
   - VPC network
   - Cloud SQL PostgreSQL instance
   - VPC connector
   - Artifact Registry repository

### Deployment Process

**Method 1: Direct Deploy (Simple)**

```bash
# From project root
gcloud run deploy hustle \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --vpc-connector hustle-vpc-connector \
  --set-env-vars "DATABASE_URL=postgresql://...,NEXTAUTH_SECRET=...,RESEND_API_KEY=..." \
  --max-instances 10 \
  --min-instances 0
```

**Method 2: Build & Deploy (Recommended)**

```bash
# 1. Build and push to Artifact Registry
gcloud builds submit \
  --tag gcr.io/YOUR-PROJECT-ID/hustle-app:$(git rev-parse --short HEAD)

# 2. Deploy to Cloud Run
gcloud run deploy hustle \
  --image gcr.io/YOUR-PROJECT-ID/hustle-app:$(git rev-parse --short HEAD) \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --vpc-connector hustle-vpc-connector \
  --set-env-vars-file .env.production \
  --max-instances 10 \
  --min-instances 0
```

### Environment Variables (Production)

Create `.env.production`:
```bash
DATABASE_URL=postgresql://hustle_admin:PASSWORD@/hustle_mvp?host=/cloudsql/PROJECT:REGION:INSTANCE
NEXTAUTH_SECRET=production-secret-here
NEXTAUTH_URL=https://your-domain.com
RESEND_API_KEY=re_production_key_here
EMAIL_FROM=Hustle <noreply@hustle-app.com>
NODE_ENV=production
```

**Set via Cloud Run:**
```bash
gcloud run services update hustle \
  --region us-central1 \
  --update-env-vars DATABASE_URL="...",NEXTAUTH_SECRET="..."
```

### Database Migrations (Production)

**Before deploying new version with schema changes:**

```bash
# 1. Create migration locally
npx prisma migrate dev --name migration_description

# 2. Review migration file in prisma/migrations/

# 3. Apply to production database
DATABASE_URL="postgresql://prod-connection-string" \
  npx prisma migrate deploy

# 4. Then deploy new Cloud Run revision
gcloud run deploy hustle --image ...
```

### Custom Domain Setup

```bash
# 1. Map domain
gcloud run domain-mappings create \
  --service hustle \
  --domain your-domain.com \
  --region us-central1

# 2. Add DNS records (shown in output)
# 3. Wait for SSL certificate provisioning (~15 minutes)
```

### Health Checks

Cloud Run automatically monitors:
- **Endpoint**: `/api/healthcheck`
- **Expected Response**: 200 OK with JSON `{"status": "healthy"}`

**Test Health Endpoint:**
```bash
curl https://your-cloud-run-url.run.app/api/healthcheck
```

---

## Database Operations

### Local Database Management

**Prisma Studio (GUI):**
```bash
npx prisma studio
# Opens at http://localhost:5555
```

**Direct PostgreSQL Access:**
```bash
# Docker PostgreSQL
docker exec -it hustle-postgres psql -U hustle_admin -d hustle_mvp

# Local PostgreSQL
psql -U hustle_admin -d hustle_mvp
```

**Common Queries:**
```sql
-- Check users
SELECT id, email, "emailVerified", "createdAt" FROM users;

-- Check verification tokens
SELECT * FROM email_verification_tokens WHERE expires > NOW();

-- Check password reset tokens
SELECT * FROM password_reset_tokens WHERE expires > NOW();
```

### Schema Changes Workflow

**Development:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Push changes to dev database
npx prisma db push

# 3. Regenerate Prisma client
npx prisma generate

# 4. Restart dev server
```

**Production:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_new_field

# 3. Test migration locally
npx prisma migrate reset  # Reset local DB
npx prisma migrate dev    # Apply all migrations

# 4. When ready, deploy to production
DATABASE_URL="production-url" npx prisma migrate deploy

# 5. Deploy new app version
```

### Backup & Restore

**Local Backup:**
```bash
# Backup
pg_dump -U hustle_admin hustle_mvp > backup-$(date +%Y%m%d).sql

# Restore
psql -U hustle_admin hustle_mvp < backup-20251008.sql
```

**Cloud SQL Backup:**
```bash
# Automated backups are configured via Terraform
# Manual backup:
gcloud sql backups create \
  --instance hustle-postgres-instance

# List backups
gcloud sql backups list --instance hustle-postgres-instance

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance hustle-postgres-instance \
  --backup-instance hustle-postgres-instance
```

### Database Connection Troubleshooting

**Issue: Can't connect to local database**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres
# OR
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql "postgresql://hustle_admin:PASSWORD@localhost:5432/hustle_mvp"
```

**Issue: Prisma client out of sync**

```bash
# Regenerate Prisma client
npx prisma generate

# Restart dev server
# Clear .next cache if needed
rm -rf .next
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

**Error:** `Port 3000 is in use by an unknown process`

**Solution:**
```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use different port
npm run dev -- -p 4000
```

#### Database Connection Failed

**Error:** `Can't reach database server at localhost:5432`

**Solution:**
```bash
# Check if PostgreSQL running
docker ps | grep postgres

# Start PostgreSQL
docker-compose up -d postgres

# Check DATABASE_URL in .env.local
# Should be: postgresql://hustle_admin:PASSWORD@localhost:5432/hustle_mvp
```

#### Prisma Schema Drift

**Error:** `Schema drift detected`

**Solution:**
```bash
# Option 1: Push schema (development)
npx prisma db push --accept-data-loss

# Option 2: Create migration (production)
npx prisma migrate dev --name fix_drift

# Then regenerate client
npx prisma generate
```

#### Email Not Sending

**Error:** `Email service not configured`

**Solution:**
```bash
# Check .env.local has RESEND_API_KEY
cat .env.local | grep RESEND

# Test Resend API key
curl https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY"

# Check Resend dashboard
# https://resend.com/emails
```

#### Build Failures

**Error:** `Build failed with exit code 1`

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npx tsc --noEmit

# Try building again
npm run build
```

### Deployment Issues

#### Cloud Run Deploy Fails

**Check:**
1. Service account permissions
2. VPC connector configured
3. Environment variables set
4. Database accessible from Cloud Run

**Debug:**
```bash
# Check Cloud Run logs
gcloud run services logs read hustle --region us-central1 --limit 50

# Check service status
gcloud run services describe hustle --region us-central1
```

#### Database Migrations Fail on Production

**Safe Recovery:**
```bash
# 1. Mark failed migration as rolled back
DATABASE_URL="production" npx prisma migrate resolve --rolled-back MIGRATION_NAME

# 2. Fix migration file if needed

# 3. Re-apply
DATABASE_URL="production" npx prisma migrate deploy
```

### Performance Issues

**Slow Database Queries:**
```bash
# Check database indexes
npx prisma studio
# Review query performance

# Add indexes to frequently queried fields in schema.prisma
@@index([email])
@@index([createdAt])
```

**High Memory Usage:**
```bash
# Check Node.js memory
docker stats hustle-app

# Increase Cloud Run memory if needed
gcloud run services update hustle \
  --memory 512Mi \
  --region us-central1
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Database migrations tested locally
- [ ] Environment variables configured
- [ ] Secrets rotated if compromised
- [ ] Backups verified

### Deployment

- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] New image built and pushed
- [ ] Cloud Run service updated
- [ ] Health check returns 200 OK
- [ ] Logs show no errors

### Post-Deployment

- [ ] Verify app loads at production URL
- [ ] Test authentication flows
- [ ] Check email sending works
- [ ] Monitor error rates
- [ ] Review performance metrics

---

## Rollback Procedures

### Cloud Run Rollback

```bash
# List revisions
gcloud run revisions list --service hustle --region us-central1

# Rollback to previous revision
gcloud run services update-traffic hustle \
  --to-revisions PREVIOUS_REVISION=100 \
  --region us-central1
```

### Database Rollback

**Option 1: Restore from backup**
```bash
# List backups
gcloud sql backups list --instance hustle-postgres-instance

# Restore
gcloud sql backups restore BACKUP_ID \
  --backup-instance hustle-postgres-instance
```

**Option 2: Reverse migration**
```bash
# Mark migration as rolled back
DATABASE_URL="production" npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

---

## Monitoring & Logging

### View Logs

**Local:**
```bash
# Dev server logs in terminal where npm run dev is running
```

**Docker:**
```bash
docker-compose logs -f hustle-app
```

**Cloud Run:**
```bash
# Recent logs
gcloud run services logs read hustle --region us-central1 --limit 100

# Follow logs in real-time
gcloud run services logs tail hustle --region us-central1
```

### Metrics

**Cloud Run Metrics:**
- Request count
- Request latency
- Container instance count
- CPU/Memory utilization

Access at: https://console.cloud.google.com/run

**Database Metrics:**
- Connection count
- Query performance
- Storage usage

Access at: https://console.cloud.google.com/sql

---

## Security Considerations

### Secrets Management

**Never commit:**
- `.env.local`
- `.env.production`
- `terraform.tfvars`
- Any files with API keys or passwords

**Use:**
- Environment variables in Cloud Run
- Google Secret Manager for sensitive data
- `.gitignore` to exclude secret files

### Database Security

**Production:**
- Use Cloud SQL with private IP
- Connect via Cloud SQL Proxy or VPC connector
- Rotate passwords regularly
- Enable SSL/TLS connections

### API Security

**Implemented:**
- NextAuth JWT authentication
- Email verification required for login
- bcrypt password hashing (10 rounds)
- CSRF protection via NextAuth
- Rate limiting (configure on Cloud Run)

---

## Cost Optimization

### Cloud Run

- **Min instances: 0** - Scales to zero when idle
- **Max instances: 10** - Prevents runaway costs
- **CPU allocation: CPU only allocated during request**

**Estimated costs:** ~$5-20/month for low traffic

### Cloud SQL

- **Instance type:** db-f1-micro or db-g1-small for MVP
- **Automated backups:** 7 days retention
- **High availability:** Disable for dev/staging

**Estimated costs:** ~$10-30/month for small instance

### Total Monthly Estimate

- Cloud Run: $5-20
- Cloud SQL: $10-30
- Networking: $1-5
- **Total: ~$16-55/month**

---

**Document Maintenance:**
- Update when deployment processes change
- Document new troubleshooting scenarios
- Keep commands and examples current

**Last Updated:** 2025-10-08
**Next Review:** 2026-01-08
