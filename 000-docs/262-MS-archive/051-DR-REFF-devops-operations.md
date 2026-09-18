# Hustle™ Operations Guide

**Document Type:** Reference - Day-to-Day Operations
**Status:** Active
**Last Updated:** 2025-10-08
**Version:** 1.0.0
**Engineer:** Jeremy (DevOps Lead)

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Monitoring & Alerts](#monitoring--alerts)
3. [Incident Response](#incident-response)
4. [Maintenance Tasks](#maintenance-tasks)
5. [User Support](#user-support)
6. [Performance Tuning](#performance-tuning)

---

## Daily Operations

### Morning Checklist

```bash
# 1. Check server status
curl http://localhost:3001/api/healthcheck
# Expected: {"status": "healthy"}

# 2. Check database connection
npx prisma studio
# Should open without errors

# 3. Check email service
# Go to https://resend.com/emails
# Verify no bounces or failures

# 4. Check dev server logs
# Look for any errors in terminal
```

### Key Metrics to Monitor

| Metric | Tool | Threshold | Action if Exceeded |
|--------|------|-----------|-------------------|
| **Response Time** | Browser DevTools | >2s | Check database queries |
| **Error Rate** | Server logs | >1% | Investigate errors |
| **Email Delivery** | Resend dashboard | <95% | Check API key, spam |
| **Database Size** | Prisma Studio | >80% capacity | Archive old data |
| **Failed Logins** | Database query | >10/hour | Check for attack |

---

## Monitoring & Alerts

### Application Health

**Healthcheck Endpoint:** `GET /api/healthcheck`

```bash
# Check health
curl http://localhost:3001/api/healthcheck

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-08T21:11:27.990Z",
  "database": "connected"
}
```

**What it checks:**
- Server is responding
- Database connection is active
- No critical errors

### Database Monitoring

**Check User Growth:**
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_users
FROM users
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Check Game Activity:**
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as games_logged
FROM games
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Check Verification Status:**
```sql
SELECT
  COUNT(CASE WHEN email_verified IS NOT NULL THEN 1 END) as verified,
  COUNT(CASE WHEN email_verified IS NULL THEN 1 END) as unverified,
  COUNT(*) as total
FROM users;
```

### Email Monitoring

**Resend Dashboard:** https://resend.com/emails

**Check daily:**
- Delivery rate (should be >95%)
- Bounce rate (should be <5%)
- Complaint rate (should be <0.1%)
- Daily usage vs limit (100/day on free tier)

**Query Failed Verifications:**
```sql
SELECT
  u.email,
  evt.created_at,
  evt.expires
FROM email_verification_tokens evt
JOIN users u ON u.id = evt.user_id
WHERE evt.expires < NOW()
ORDER BY evt.created_at DESC
LIMIT 10;
```

### Log Monitoring

**Local Development:**
```bash
# Server logs are in terminal where npm run dev is running
# Look for patterns like:
grep -i "error" # Errors
grep -i "\[email\]" # Email sending
grep -i "\[auth\]" # Authentication events
```

**Production (Cloud Run):**
```bash
# Recent errors
gcloud run services logs read hustle \
  --region us-central1 \
  --filter="severity>=ERROR" \
  --limit 50

# Follow logs in real-time
gcloud run services logs tail hustle \
  --region us-central1
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Notification |
|-------|-------------|---------------|--------------|
| **P0** | Complete outage | Immediate | Page on-call |
| **P1** | Major degradation | 15 minutes | Alert team |
| **P2** | Minor issues | 4 hours | Email team |
| **P3** | Cosmetic/low impact | Next business day | Create ticket |

### P0: Complete Outage

**Symptoms:**
- App returns 500 errors
- Database unreachable
- Authentication broken for all users

**Response Steps:**

1. **Assess Impact**
   ```bash
   # Check if server responds
   curl -I http://localhost:3001

   # Check health endpoint
   curl http://localhost:3001/api/healthcheck

   # Check database
   psql -U hustle_admin -d hustle_mvp -c "SELECT 1;"
   ```

2. **Immediate Mitigation**
   ```bash
   # Restart dev server
   pkill -f "next dev"
   npm run dev

   # Restart PostgreSQL (if using Docker)
   docker-compose restart postgres

   # Check for disk space
   df -h
   ```

3. **Root Cause Analysis**
   - Check server logs for errors
   - Check database logs
   - Check recent code changes
   - Check environment variables

4. **Communication**
   - Update status page (if public)
   - Notify affected users
   - Document incident

5. **Recovery Verification**
   ```bash
   # Test critical flows
   curl http://localhost:3001/api/healthcheck
   # Attempt login
   # Attempt registration
   # Check database queries
   ```

### P1: Major Degradation

**Symptoms:**
- Slow response times (>5s)
- High error rate (>5%)
- Email sending failing

**Response Steps:**

1. **Identify Bottleneck**
   ```bash
   # Check database connections
   SELECT count(*) FROM pg_stat_activity;

   # Check slow queries
   SELECT query, query_start, state
   FROM pg_stat_activity
   WHERE state != 'idle'
   ORDER BY query_start;
   ```

2. **Quick Fixes**
   - Kill long-running queries
   - Restart connection pools
   - Clear caches if applicable

3. **Monitor Recovery**
   - Watch response times
   - Check error rates
   - Verify user impact

### Common Issues & Fixes

#### Issue: Database Connection Pool Exhausted

**Symptoms:** `Too many clients` error

**Fix:**
```bash
# Check current connections
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < NOW() - INTERVAL '1 hour';

# Restart app to reset pool
```

#### Issue: Email Sending Failing

**Symptoms:** `Email service not configured` error

**Fix:**
```bash
# Check API key is set
echo $RESEND_API_KEY

# Test Resend API
curl https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY"

# Check Resend dashboard for blocks
# https://resend.com/emails

# Check daily limit not exceeded (100/day free tier)
```

#### Issue: Authentication Not Working

**Symptoms:** Users can't log in

**Fix:**
```bash
# Check NEXTAUTH_SECRET is set
grep NEXTAUTH_SECRET .env.local

# Check user exists and email is verified
psql -U hustle_admin -d hustle_mvp
SELECT email, email_verified FROM users WHERE email = 'user@example.com';

# Check session cookies
# Open browser DevTools → Application → Cookies
# Should see next-auth.session-token cookie
```

---

## Maintenance Tasks

### Daily

- [ ] Check health endpoint
- [ ] Review error logs
- [ ] Monitor email delivery (Resend dashboard)
- [ ] Check failed authentications

### Weekly

- [ ] Review database growth
- [ ] Check slow queries
- [ ] Clean up expired tokens
- [ ] Review user feedback/support tickets
- [ ] Check for security updates (`npm audit`)

### Monthly

- [ ] Database backup verification
- [ ] Security review (dependencies, access)
- [ ] Performance review (response times)
- [ ] Cost review (if deployed to Cloud Run)
- [ ] Update documentation if needed

### Quarterly

- [ ] Major dependency updates
- [ ] Infrastructure review
- [ ] Disaster recovery testing
- [ ] Security penetration testing
- [ ] Performance load testing

### Token Cleanup

Expired tokens should be cleaned up automatically, but you can manually clean:

```sql
-- Delete expired email verification tokens
DELETE FROM email_verification_tokens
WHERE expires < NOW();

-- Delete expired password reset tokens
DELETE FROM password_reset_tokens
WHERE expires < NOW();

-- Check how many were deleted
SELECT 'Cleanup complete' as status;
```

**Automated Cleanup (Future):**
```typescript
// Create /src/app/api/cron/cleanup-tokens/route.ts
import { prisma } from '@/lib/prisma';

export async function GET() {
  const now = new Date();

  const [emailTokens, resetTokens] = await Promise.all([
    prisma.emailVerificationToken.deleteMany({
      where: { expires: { lt: now } }
    }),
    prisma.passwordResetToken.deleteMany({
      where: { expires: { lt: now } }
    })
  ]);

  return Response.json({
    deleted: {
      emailTokens: emailTokens.count,
      resetTokens: resetTokens.count
    }
  });
}
```

---

## User Support

### Common User Issues

#### "I didn't receive verification email"

**Troubleshooting:**

1. **Check Resend dashboard**
   - Go to https://resend.com/emails
   - Search for user's email
   - Check delivery status

2. **Check spam folder**
   - Ask user to check spam/junk
   - Add sender to contacts

3. **Resend verification email**
   - Direct user to http://localhost:3001/resend-verification
   - Enter email address
   - New email should arrive

4. **Manually verify (as admin)**
   ```sql
   UPDATE users
   SET email_verified = NOW()
   WHERE email = 'user@example.com';

   -- Delete old token
   DELETE FROM email_verification_tokens
   WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');
   ```

#### "I forgot my password"

**Process:**

1. **User clicks "Forgot password?"** on login page
2. **Enters email** at /forgot-password
3. **Receives reset email** (check Resend dashboard)
4. **Clicks reset link** in email
5. **Sets new password** at /reset-password

**If email not arriving:**
- Check Resend dashboard
- Check spam folder
- Check user email is correct in database
- Manually create reset link (temporary):
  ```sql
  -- Generate token in application, then:
  INSERT INTO password_reset_tokens (id, token, user_id, expires, created_at)
  VALUES (
    gen_random_uuid(),
    'manual-reset-token-' || gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'user@example.com'),
    NOW() + INTERVAL '1 hour',
    NOW()
  )
  RETURNING token;

  -- Provide reset URL to user:
  -- http://localhost:3001/reset-password?token=GENERATED_TOKEN
  ```

#### "I can't log in"

**Checklist:**

1. **Email verified?**
   ```sql
   SELECT email, email_verified FROM users WHERE email = 'user@example.com';
   ```
   If NULL, user needs to verify email first

2. **Password correct?**
   - Ask user to try password reset
   - Check for typos (copy/paste issue)

3. **Account exists?**
   ```sql
   SELECT * FROM users WHERE email = 'user@example.com';
   ```
   If no results, user needs to register

4. **Server errors?**
   - Check server logs for authentication errors
   - Check database connection

---

## Performance Tuning

### Database Query Optimization

**Find Slow Queries:**
```sql
SELECT
  query,
  calls,
  total_time / 1000 as total_seconds,
  mean_time / 1000 as mean_seconds
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**Add Indexes:**
```prisma
// In schema.prisma
model Game {
  // ... fields ...

  @@index([playerId])      // Already exists
  @@index([verified])      // Already exists
  @@index([date])          // Add if filtering by date frequently
}
```

### Application Performance

**Enable Production Mode:**
```bash
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

**Monitor Response Times:**
```bash
# Add timing to API routes
console.time('api-execution');
// ... your code ...
console.timeEnd('api-execution');
```

**Optimize Images:**
- Use Next.js Image component
- Convert to WebP format
- Implement lazy loading

### Cloud Run Optimization (Production)

**Reduce Cold Starts:**
```bash
# Set minimum instances
gcloud run services update hustle \
  --min-instances 1 \
  --region us-central1
```

**Optimize Memory:**
```bash
# Increase memory if needed
gcloud run services update hustle \
  --memory 1Gi \
  --region us-central1
```

**Enable HTTP/2:**
```bash
# Already enabled by default on Cloud Run
# Verify in response headers
curl -I https://your-app.run.app
```

---

## Security Operations

### Access Auditing

**Review User Activity:**
```sql
-- Recent registrations
SELECT email, created_at
FROM users
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Failed login attempts (if logging implemented)
-- TODO: Add failed login tracking
```

**Review Admin Actions:**
```sql
-- Manual email verifications
SELECT email, email_verified
FROM users
WHERE email_verified IS NOT NULL
AND email_verified != created_at;
```

### Security Monitoring

**Check for SQL Injection Attempts:**
```bash
# Look for suspicious queries in logs
grep -i "SELECT.*FROM.*WHERE" server.log | grep -i "OR 1=1"
```

**Check for Brute Force Attacks:**
```sql
-- Failed logins per IP (if tracking implemented)
-- TODO: Implement IP tracking and rate limiting
```

**Rotate Secrets:**
```bash
# Every 90 days, rotate:
# 1. NEXTAUTH_SECRET
# 2. Database passwords
# 3. API keys (Resend)

# Update .env.local
# Restart services
# Update Cloud Run environment variables
```

---

## Backup & Recovery

### Backup Strategy

**Database Backups:**

**Local (Manual):**
```bash
# Create backup
pg_dump -U hustle_admin hustle_mvp \
  > backup-$(date +%Y%m%d-%H%M%S).sql

# Compress
gzip backup-*.sql

# Store securely
mv backup-*.sql.gz /path/to/secure/storage/
```

**Production (Automated via Terraform):**
- Daily automatic backups
- 7-day retention
- Point-in-time recovery enabled

**Verify Backups:**
```bash
# List backups
gcloud sql backups list \
  --instance hustle-postgres-instance

# Test restore to temporary instance
gcloud sql instances create hustle-test \
  --backup BACKUP_ID
```

### Recovery Procedures

**Restore from Backup:**

**Local:**
```bash
# Drop existing database
psql -U postgres -c "DROP DATABASE hustle_mvp;"

# Create new database
psql -U postgres -c "CREATE DATABASE hustle_mvp;"

# Restore from backup
psql -U hustle_admin hustle_mvp < backup-file.sql
```

**Production:**
```bash
# Restore to new instance
gcloud sql backups restore BACKUP_ID \
  --backup-instance hustle-postgres-instance \
  --backup-instance hustle-postgres-new

# Switch connection string
# Update Cloud Run DATABASE_URL
```

---

## Cost Management

### Current Costs (Local Dev)

**Free:**
- Development environment
- PostgreSQL (Docker or local)
- Resend (under 100 emails/day)

### Production Costs (Estimated)

| Service | Cost/Month | Notes |
|---------|-----------|--------|
| Cloud Run | $5-20 | Scales to zero, pay per use |
| Cloud SQL | $10-30 | db-f1-micro instance |
| VPC Connector | $8 | Required for Cloud Run ↔ Cloud SQL |
| Networking | $1-5 | Egress traffic |
| **Total** | **$24-63** | MVP stage estimate |

### Cost Optimization

**Monitor Usage:**
```bash
# Check Cloud Run requests
gcloud run services describe hustle --region us-central1

# Check Cloud SQL CPU usage
gcloud sql instances describe hustle-postgres-instance
```

**Optimize Costs:**
- Keep min instances at 0 (scale to zero)
- Use db-f1-micro for MVP stage
- Review and delete unused resources
- Monitor egress traffic

**Set Budget Alerts:**
```bash
# In GCP Console
# Billing → Budgets & alerts
# Set budget: $100/month
# Alert at: 50%, 90%, 100%
```

---

## Operational Runbooks

### Deploy New Version

1. **Run Tests**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

2. **Create Migration (if schema changed)**
   ```bash
   npx prisma migrate dev --name description
   ```

3. **Deploy Database Migration**
   ```bash
   DATABASE_URL="production" npx prisma migrate deploy
   ```

4. **Deploy Application**
   ```bash
   gcloud run deploy hustle \
     --source . \
     --region us-central1
   ```

5. **Verify Deployment**
   ```bash
   curl https://your-app.run.app/api/healthcheck
   ```

### Rollback Deployment

```bash
# List revisions
gcloud run revisions list --service hustle --region us-central1

# Rollback to previous
gcloud run services update-traffic hustle \
  --to-revisions PREVIOUS_REVISION=100 \
  --region us-central1
```

### Emergency Maintenance Mode

**Enable Maintenance Page:**
```typescript
// Add to middleware.ts
export function middleware(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return new Response('System under maintenance', { status: 503 });
  }
}
```

**Activate:**
```bash
# Local
MAINTENANCE_MODE=true npm run dev

# Production
gcloud run services update hustle \
  --set-env-vars MAINTENANCE_MODE=true \
  --region us-central1
```

---

**Document Maintenance:**
- Update procedures when processes change
- Document new issues and solutions
- Keep runbooks current

**Last Updated:** 2025-10-08
**Next Review:** 2026-01-08
