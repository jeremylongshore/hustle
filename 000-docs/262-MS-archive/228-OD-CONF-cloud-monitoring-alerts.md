# Cloud Monitoring & Alerting Configuration

**Phase**: Phase 6 - Customer Success & Growth
**Task**: Task 4 - Monitoring & Alerting
**Created**: 2025-11-16

---

## Overview

This document provides step-by-step instructions for configuring Google Cloud Monitoring uptime checks and alerts for the Hustle application.

---

## Prerequisites

- Google Cloud project: `hustleapp-production`
- Deployed application with `/api/health` endpoint
- Email addresses for alert notifications
- Cloud Monitoring API enabled

---

## Health Check Endpoint

**URL**: `https://hustleapp-production.web.app/api/health`

**Response Format**:
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "service": "hustle-api",
  "checks": {
    "firestore": {
      "status": "pass" | "fail" | "skipped",
      "responseTime": 150
    },
    "environment": {
      "status": "pass" | "fail",
      "missing": []
    }
  },
  "latencyMs": 200
}
```

**Status Codes**:
- `200 OK` - Healthy or degraded
- `503 Service Unavailable` - Unhealthy

---

## 1. Uptime Check Configuration

### Create Uptime Check

**Steps**:

1. **Navigate to Cloud Monitoring**
   ```
   Google Cloud Console → Monitoring → Uptime checks
   ```

2. **Create Uptime Check**
   - Click "Create Uptime Check"

3. **Configure Check Details**
   - **Title**: `Hustle API Health Check`
   - **Check Type**: `HTTPS`
   - **Resource Type**: `URL`
   - **Hostname**: `hustleapp-production.web.app`
   - **Path**: `/api/health`
   - **Port**: `443`

4. **Configure Response Validation**
   - **Response Content Matching**: `Enabled`
   - **Content Matcher Type**: `Contains`
   - **Content**: `"status":"healthy"`
   - **Why**: Ensures response body indicates healthy status, not just 200 OK

5. **Configure Check Frequency**
   - **Check Frequency**: `1 minute`
   - **Regions**: Select multiple regions for redundancy:
     - `USA, Iowa (us-central1)`
     - `USA, South Carolina (us-east1)`
     - `USA, Oregon (us-west1)`

6. **Alert & Notification (Optional - or configure separately)**
   - Can configure alert policy here or in next section
   - Recommendation: Configure separately for more control

7. **Create Check**
   - Click "Create"

### Verify Uptime Check

**Steps**:
1. Wait 1-2 minutes for first check
2. Go to: `Monitoring → Uptime checks → Hustle API Health Check`
3. Verify: "Uptime" should be 100%, "Current Status" should be "Up"

---

## 2. Alert Policy Configuration

### Alert Policy 1: Unhealthy Status

**Purpose**: Alert when health check fails or returns unhealthy status

**Steps**:

1. **Navigate to Alerting**
   ```
   Google Cloud Console → Monitoring → Alerting
   ```

2. **Create Policy**
   - Click "Create Policy"

3. **Add Condition**
   - **Target**: Select "Uptime check"
   - **Uptime Check**: `Hustle API Health Check`
   - **Condition Type**: `Uptime check failed`
   - **Configuration**:
     - **Fails in at least**: `2 locations`
     - **For duration**: `2 minutes`
   - **Why**: Prevents false positives from single region failures

4. **Configure Notifications**
   - Click "Add Notification Channel"
   - **Channel Type**: `Email`
   - **Email Address**: Your team email (e.g., `alerts@hustleapp.com`)
   - **Display Name**: `Hustle Alerts`

5. **Configure Documentation**
   - **Alert Name**: `Hustle API Unhealthy`
   - **Documentation**: Add incident response steps:
     ```markdown
     ## Incident Response Steps

     1. Check health endpoint: https://hustleapp-production.web.app/api/health
     2. View Cloud Logging: Console → Logging → query: "api/health"
     3. Check Firestore status: Console → Firestore
     4. Check environment variables: Console → Cloud Run → Edit & Deploy → Variables
     5. If Firestore down: Contact Google Cloud Support
     6. If env vars missing: Restore from Secret Manager

     ## Escalation
     - If unresolved in 15 minutes, escalate to on-call engineer
     - If unresolved in 30 minutes, create P0 incident ticket
     ```

6. **Save Policy**

### Alert Policy 2: Slow Response Time

**Purpose**: Alert when health check response is consistently slow

**Steps**:

1. **Create Policy** (same as above)

2. **Add Condition**
   - **Target**: Select "Uptime check"
   - **Uptime Check**: `Hustle API Health Check`
   - **Condition Type**: `Response latency`
   - **Configuration**:
     - **Latency exceeds**: `5000 ms` (5 seconds)
     - **For duration**: `5 minutes`
     - **In at least**: `2 locations`

3. **Configure Notifications** (same email as above)

4. **Configure Documentation**
   - **Alert Name**: `Hustle API Slow Response`
   - **Documentation**:
     ```markdown
     ## Incident Response Steps

     1. Check Cloud Run metrics: Console → Cloud Run → hustle-api → Metrics
     2. Check Firestore performance: Console → Firestore → Usage
     3. Check for high traffic: Monitoring → Metrics Explorer → Cloud Run request count
     4. Check for slow queries: Logging → query: "performance_slow_query"
     5. Scale Cloud Run instances if needed: Edit & Deploy → Max instances

     ## Investigation
     - Review recent deploys for performance regressions
     - Check for database query optimization opportunities
     - Consider enabling Cloud Run autoscaling
     ```

5. **Save Policy**

### Alert Policy 3: High Error Rate

**Purpose**: Alert when API error rate exceeds threshold

**Steps**:

1. **Create Policy**

2. **Add Condition**
   - **Target**: Select "Metric"
   - **Resource Type**: `Cloud Run Revision`
   - **Metric**: `Request count`
   - **Filter**:
     - `service_name = hustle-api`
     - `response_code >= 500`
   - **Condition Type**: `Threshold`
   - **Configuration**:
     - **Threshold**: `10 errors`
     - **Time window**: `5 minutes`
     - **Aggregation**: `Sum`

3. **Configure Notifications** (same email as above)

4. **Configure Documentation**
   - **Alert Name**: `Hustle API High Error Rate`
   - **Documentation**:
     ```markdown
     ## Incident Response Steps

     1. Check error logs: Console → Logging → query: "severity=ERROR"
     2. Identify error pattern: Group by error message
     3. Check recent deploys: Console → Cloud Run → Revisions
     4. If deployment-related: Rollback to previous revision
     5. If data-related: Check Firestore for data integrity issues

     ## Common Causes
     - Database connection failures
     - Missing environment variables after deploy
     - Stripe webhook signature mismatches
     - Firebase Admin SDK initialization failures
     ```

5. **Save Policy**

---

## 3. Log-Based Metrics & Alerts

### Metric 1: Plan Limit Hits

**Purpose**: Track when users hit plan limits

**Steps**:

1. **Create Log-Based Metric**
   ```
   Console → Logging → Logs-based metrics → Create Metric
   ```

2. **Configure Metric**
   - **Metric Type**: `Counter`
   - **Name**: `hustle_plan_limit_hits`
   - **Description**: `Count of plan limit exceeded events`
   - **Filter**:
     ```
     jsonPayload.event="plan_limit_hit"
     ```
   - **Labels**: Extract from log:
     - `plan`: `jsonPayload.plan`
     - `limitType`: `jsonPayload.limitType`

3. **Create Alert Policy**
   - **Condition**: `hustle_plan_limit_hits > 10` in 1 hour
   - **Notification**: Email to product team
   - **Documentation**: "High plan limit hits may indicate need for pricing adjustment or feature limits review"

### Metric 2: Payment Failures

**Purpose**: Track payment failure rate

**Steps**:

1. **Create Log-Based Metric**
   - **Name**: `hustle_payment_failures`
   - **Filter**:
     ```
     jsonPayload.event="billing_payment_failed"
     ```
   - **Labels**: Extract `plan`, `reason`

2. **Create Alert Policy**
   - **Condition**: `hustle_payment_failures > 5` in 1 hour
   - **Notification**: Email to finance team
   - **Documentation**: "High payment failure rate may indicate Stripe integration issue or user billing problems"

### Metric 3: Workspace Status Changes

**Purpose**: Track workspace status transitions

**Steps**:

1. **Create Log-Based Metric**
   - **Name**: `hustle_workspace_status_changes`
   - **Filter**:
     ```
     jsonPayload.event="workspace_status_changed"
     ```
   - **Labels**: Extract `oldStatus`, `newStatus`

2. **No Alert** (informational metric only)
   - Use in dashboards to track churn (active → canceled)

---

## 4. Custom Dashboards

### Create Monitoring Dashboard

**Steps**:

1. **Navigate to Dashboards**
   ```
   Console → Monitoring → Dashboards → Create Dashboard
   ```

2. **Dashboard Name**: `Hustle Production Metrics`

3. **Add Charts**:

   **Chart 1: Health Check Status**
   - **Chart Type**: Line
   - **Metric**: `Uptime check - Status`
   - **Resource**: `Hustle API Health Check`
   - **Aggregation**: `Mean`

   **Chart 2: API Response Time**
   - **Chart Type**: Line
   - **Metric**: `Uptime check - Latency`
   - **Resource**: `Hustle API Health Check`
   - **Aggregation**: `95th percentile`

   **Chart 3: API Request Count**
   - **Chart Type**: Stacked Area
   - **Metric**: `Cloud Run - Request count`
   - **Filter**: `service_name = hustle-api`
   - **Group By**: `response_code`

   **Chart 4: Plan Limit Hits**
   - **Chart Type**: Line
   - **Metric**: `hustle_plan_limit_hits`
   - **Group By**: `limitType`

   **Chart 5: Payment Failures**
   - **Chart Type**: Bar
   - **Metric**: `hustle_payment_failures`
   - **Group By**: `reason`

   **Chart 6: Firestore Response Time**
   - **Chart Type**: Line
   - **Metric**: `Firestore - API Request Latency`
   - **Aggregation**: `95th percentile`

4. **Save Dashboard**

---

## 5. Testing Alerts

### Test Health Check Failure

**Method 1: Simulate Firestore Failure**

1. Temporarily break Firestore connection:
   ```typescript
   // In /api/health/route.ts (DO NOT COMMIT)
   throw new Error('Simulated failure');
   ```

2. Deploy to staging
3. Wait 2 minutes
4. Verify alert fired
5. Revert change

**Method 2: Return Unhealthy Status**

1. Temporarily modify health check:
   ```typescript
   // In /api/health/route.ts (DO NOT COMMIT)
   result.status = 'unhealthy';
   ```

2. Deploy to staging
3. Wait 2 minutes
4. Verify alert fired
5. Revert change

### Test Log-Based Alert

**Trigger Plan Limit Event**:

```typescript
// In any API route
import { planLimitEvents } from '@/lib/monitoring/events';

planLimitEvents.exceeded('test-user', 'test-workspace', 'maxPlayers', 10, 10, 'free');
```

**Verify**:
1. Check Logging: Search for `event="plan_limit_hit"`
2. Wait for metric aggregation (5-10 minutes)
3. Check alert policy status

---

## 6. Notification Channels

### Email Configuration

1. **Primary Alert Email**: `alerts@hustleapp.com`
   - Configure in: `Monitoring → Alerting → Notification channels`
   - Add all team members

2. **Backup Email**: Individual team member emails
   - Add as secondary notification channel

### SMS Configuration (Optional)

1. **Set up SMS channel**:
   - Go to: `Monitoring → Alerting → Notification channels`
   - Add channel type: `SMS`
   - Add on-call engineer phone numbers

2. **Configure for Critical Alerts Only**:
   - Use SMS for: Health check failures, high error rate
   - Don't use SMS for: Slow response, log-based metrics

### Slack Integration (Optional)

1. **Create Slack Webhook**:
   - Go to Slack → Apps → Incoming Webhooks
   - Create webhook for #alerts channel

2. **Add Slack Channel in Cloud Monitoring**:
   - Go to: `Monitoring → Alerting → Notification channels`
   - Add channel type: `Slack`
   - Paste webhook URL

3. **Configure for All Alerts**:
   - Add Slack channel to all alert policies
   - Provides real-time visibility for entire team

---

## 7. On-Call Rotation

### PagerDuty Integration (Future)

**When to Set Up**:
- Team size > 5 engineers
- 24/7 uptime requirement
- Multiple critical services

**Steps**:
1. Create PagerDuty account
2. Configure integration with Cloud Monitoring
3. Set up escalation policies
4. Create on-call schedules

---

## 8. Maintenance

### Weekly Tasks

- [ ] Review alert history for false positives
- [ ] Update alert thresholds based on traffic patterns
- [ ] Check notification channel health

### Monthly Tasks

- [ ] Review dashboard metrics for trends
- [ ] Update incident response documentation
- [ ] Test alert policies (simulate failures)
- [ ] Review and update on-call rotation

### Quarterly Tasks

- [ ] Full incident response drill
- [ ] Review SLO targets and adjust thresholds
- [ ] Update escalation procedures
- [ ] Audit notification channels and remove inactive members

---

## 9. Incident Response Workflow

### Step 1: Alert Received

1. Acknowledge alert
2. Check health endpoint status
3. Determine severity:
   - **P0 (Critical)**: Service down, multiple regions failing
   - **P1 (High)**: Degraded performance, single region failing
   - **P2 (Medium)**: Slow response, elevated error rate
   - **P3 (Low)**: Informational, monitoring metrics

### Step 2: Investigation

1. Check Cloud Logging for recent errors
2. Review recent deployments
3. Check Firestore status
4. Check external service status (Stripe, Resend)

### Step 3: Mitigation

1. If deployment-related: Rollback to previous version
2. If Firestore-related: Contact Google Cloud Support
3. If configuration-related: Restore from backup
4. If traffic spike: Scale Cloud Run instances

### Step 4: Resolution

1. Verify health endpoint returns healthy
2. Monitor for 15 minutes
3. Close alert
4. Document incident

### Step 5: Post-Mortem (P0/P1 only)

1. Write incident report within 24 hours
2. Identify root cause
3. Create action items to prevent recurrence
4. Update runbooks

---

## 10. SLO Targets

### Availability

- **Target**: 99.9% uptime (43 minutes downtime per month)
- **Measurement**: Uptime check success rate
- **Error Budget**: 0.1% (43 minutes)

### Latency

- **Target**: 95th percentile < 500ms
- **Measurement**: Health check response time
- **Alert Threshold**: 95th percentile > 1000ms

### Error Rate

- **Target**: < 0.1% error rate
- **Measurement**: 5xx responses / total requests
- **Alert Threshold**: > 1% error rate

---

## 11. Cost Optimization

### Monitoring Costs

**Current Estimated Cost**:
- Uptime checks: ~$1/month
- Log-based metrics: ~$5/month
- Alert policies: Free
- **Total**: ~$6/month

**Cost Control**:
- Limit uptime check frequency to 1 minute
- Use log-based metrics sparingly
- Set log retention to 30 days (default)

---

## Summary

**Setup Checklist**:
- [x] Health check endpoint deployed
- [ ] Uptime check configured (3 regions)
- [ ] Alert policy: Unhealthy status
- [ ] Alert policy: Slow response
- [ ] Alert policy: High error rate
- [ ] Log-based metric: Plan limit hits
- [ ] Log-based metric: Payment failures
- [ ] Monitoring dashboard created
- [ ] Notification channels configured
- [ ] Incident response documented
- [ ] Test alerts verified

**Next Steps**:
1. Configure all alert policies in Google Cloud Console
2. Test alerts with simulated failures
3. Create monitoring dashboard
4. Document incident response procedures
5. Set up on-call rotation (if applicable)

---

**Created**: 2025-11-16
**Last Updated**: 2025-11-16
**Owner**: DevOps Team
