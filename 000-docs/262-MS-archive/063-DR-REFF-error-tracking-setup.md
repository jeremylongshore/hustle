# Error Tracking & Monitoring Setup Guide

**Date**: 2025-10-09
**Status**: ✅ Implementation Complete
**Owner**: Infrastructure Team

---

## 📋 Overview

This document provides complete setup instructions for enabling comprehensive error tracking and monitoring across the HUSTLE application stack.

## 🎯 Monitoring Stack

- **Sentry**: Client & server-side error tracking with session replay
- **Google Cloud Logging**: Structured logging with automatic retention
- **Google Cloud Error Reporting**: Automatic error aggregation & alerting
- **Google Cloud Monitoring**: Custom metrics & dashboards
- **Google Cloud Trace**: Performance & latency tracking

---

## 🚀 Quick Start

### 1. Sentry Setup

#### A. Create Sentry Account
1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project and select "Next.js"
3. Copy your DSN (Data Source Name)

#### B. Configure Environment Variables
Add to `.env.local`:
```bash
# Client-side (public - safe to expose)
NEXT_PUBLIC_SENTRY_DSN="https://your-key@o123456.ingest.sentry.io/123456"
NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Server-side (private - keep secret)
SENTRY_DSN="https://your-key@o123456.ingest.sentry.io/123456"
SENTRY_ENVIRONMENT="production"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="hustle-app"
SENTRY_AUTH_TOKEN="your-auth-token"
APP_VERSION="1.0.0"
```

#### C. Get Sentry Auth Token (for source map uploads)
1. Go to Sentry → Settings → Account → API → Auth Tokens
2. Create new token with `project:releases` and `project:write` scopes
3. Copy token to `SENTRY_AUTH_TOKEN`

### 2. Google Cloud Setup

#### A. Enable Required APIs
```bash
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable cloudtrace.googleapis.com
gcloud services enable clouderrorreporting.googleapis.com
```

#### B. Create Service Account
```bash
# Create service account
gcloud iam service-accounts create hustle-monitoring \
  --display-name="Hustle Monitoring Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:hustle-monitoring@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:hustle-monitoring@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudtrace.agent"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:hustle-monitoring@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/monitoring.metricWriter"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:hustle-monitoring@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/errorreporting.writer"
```

#### C. Download Service Account Key
```bash
gcloud iam service-accounts keys create ./hustle-monitoring-key.json \
  --iam-account=hustle-monitoring@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### D. Configure Environment Variables
Add to `.env.local`:
```bash
GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
GCP_PROJECT="your-gcp-project-id"
GOOGLE_APPLICATION_CREDENTIALS="./hustle-monitoring-key.json"
```

---

## 🔧 Configuration Details

### Sentry Configuration Files

**Client-side**: `sentry.client.config.ts`
- Captures browser errors
- Session replay (10% sample rate)
- Performance monitoring
- User context tracking

**Server-side**: `sentry.server.config.ts`
- API route errors
- Server component errors
- Prisma query tracking
- Sensitive data filtering

**Edge runtime**: `sentry.edge.config.ts`
- Middleware errors
- Edge function errors

### Google Cloud Logging

**Logger utility**: `src/lib/logger.ts`

Usage example:
```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/players');

// Info logging
logger.info('Player created', {
  userId: session.user.id,
  playerId: newPlayer.id,
});

// Error logging (auto-reports to Error Reporting)
logger.error('Failed to create player', error, {
  userId: session.user.id,
  requestBody: body,
});

// Warning logging
logger.warn('Rate limit approaching', {
  userId: session.user.id,
  requestCount: 95,
});
```

### Error Boundaries

**Component**: `src/components/error-boundary.tsx`

Usage example:
```typescript
import { ErrorBoundary } from '@/components/error-boundary';

export default function DashboardLayout({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
```

---

## 📊 Monitoring Dashboards

### Sentry Dashboard

Access at: `https://sentry.io/organizations/YOUR_ORG/issues/`

**Key Metrics:**
- Error frequency
- Affected users
- Error distribution by browser/OS
- Performance metrics (LCP, FID, CLS)
- Session replays

### Google Cloud Console

Access at: `https://console.cloud.google.com`

**Logging**: Navigation → Logging → Logs Explorer
```
Query examples:
- All errors: severity >= ERROR
- Specific service: resource.labels.service_name="hustle-app"
- User-specific: jsonPayload.userId="user-123"
- Time range: timestamp >= "2025-10-09T00:00:00Z"
```

**Error Reporting**: Navigation → Error Reporting
- Automatic error grouping
- Error frequency trends
- Stack traces
- Affected versions

**Monitoring**: Navigation → Monitoring → Dashboards
- Custom metrics
- CPU/memory usage
- Request latency
- Database query performance

**Trace**: Navigation → Trace → Trace List
- Request flow visualization
- Latency analysis
- Bottleneck identification

---

## 🚨 Alerting Setup

### Sentry Alerts

1. Go to Sentry → Alerts → Create Alert
2. Configure alert conditions:
   - **New error**: Alert when new error first occurs
   - **Error frequency**: Alert when error occurs > N times in M minutes
   - **User impact**: Alert when error affects > N users
3. Configure notification channels:
   - Email
   - Slack
   - PagerDuty

### Google Cloud Alerting

```bash
# Create alert policy for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 10/min" \
  --condition-threshold-value=10 \
  --condition-threshold-duration=60s \
  --condition-threshold-comparison=COMPARISON_GT \
  --condition-threshold-filter='resource.type="cloud_run_revision" AND severity>=ERROR'
```

---

## 🧪 Testing Error Tracking

### 1. Test Client-Side Errors

Create test page: `src/app/test-error/page.tsx`
```typescript
'use client';

export default function TestErrorPage() {
  const triggerError = () => {
    throw new Error('Test client-side error');
  };

  return (
    <div className="p-8">
      <button onClick={triggerError} className="px-4 py-2 bg-red-600 text-white rounded">
        Trigger Client Error
      </button>
    </div>
  );
}
```

### 2. Test Server-Side Errors

Create test API route: `src/app/api/test-error/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/test-error');

export async function GET() {
  logger.error('Test server-side error', new Error('Test error'));
  throw new Error('Test API error');
}
```

### 3. Verify Tracking

1. Navigate to `/test-error` and click button
2. Call `/api/test-error`
3. Check Sentry dashboard (errors should appear within 30 seconds)
4. Check Cloud Logging (logs should appear immediately)
5. Check Cloud Error Reporting (errors grouped automatically)

---

## 📈 Performance Monitoring

### Sentry Performance Monitoring

Automatically tracks:
- Page load times (LCP, FID, CLS)
- API response times
- Database query duration
- Custom transactions

### Google Cloud Trace

Enable automatic tracing:
```typescript
// In production, Cloud Run automatically captures traces
// No additional code needed!
```

View traces:
1. Go to Cloud Console → Trace → Trace List
2. Filter by service: `hustle-app`
3. Analyze slow requests
4. Identify bottlenecks

---

## 🔒 Security & Privacy

### Sensitive Data Filtering

**Sentry** (configured in `sentry.server.config.ts`):
- Removes `authorization` headers
- Redacts `password` query parameters
- Filters `api_key` values
- Masks user session tokens

**Google Cloud Logging** (configured in `src/lib/logger.ts`):
- Never logs passwords
- Redacts email addresses (optional)
- Sanitizes request bodies

### GDPR Compliance

**User data deletion**:
```typescript
// When user requests deletion
import { createLogger } from '@/lib/logger';

const logger = createLogger('gdpr');
logger.info('User data deletion requested', { userId: 'user-123' });

// Delete from Sentry
// Sentry -> Project Settings -> Data Scrubbing -> Delete User Data
```

---

## 💰 Cost Optimization

### Sentry Free Tier Limits
- 5,000 errors/month
- 10,000 performance transactions/month
- 50 replays/month

**Optimization tips**:
- Set sample rates appropriately (already configured)
- Use `ignoreErrors` to filter noise
- Monitor quota usage in dashboard

### Google Cloud Logging Costs

**Pricing** (as of 2025):
- First 50 GB/month: Free
- Additional: $0.50/GB

**Optimization tips**:
- Set log retention to 30 days (configured)
- Use log exclusion filters for verbose logs
- Export to BigQuery for long-term analysis (cheaper)

---

## 📚 Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Google Cloud Logging Guide](https://cloud.google.com/logging/docs)
- [Cloud Error Reporting](https://cloud.google.com/error-reporting/docs)
- [Cloud Monitoring](https://cloud.google.com/monitoring/docs)
- [Cloud Trace](https://cloud.google.com/trace/docs)

---

## ✅ Verification Checklist

- [ ] Sentry project created
- [ ] Sentry DSN configured in environment variables
- [ ] Sentry auth token created for source maps
- [ ] Google Cloud APIs enabled
- [ ] Service account created with proper permissions
- [ ] Service account key downloaded
- [ ] Environment variables configured
- [ ] Test client-side error tracking
- [ ] Test server-side error tracking
- [ ] Verify errors appear in Sentry
- [ ] Verify logs appear in Cloud Logging
- [ ] Verify errors appear in Cloud Error Reporting
- [ ] Set up alerting policies
- [ ] Configure notification channels
- [ ] Review privacy/security settings
- [ ] Document team access procedures

---

**Last Updated**: 2025-10-09
**Next Review**: 2025-11-09
