# Hustle Monitoring & Alerting Reference

**Document Type**: Reference (REF)
**Phase**: Phase 6 - Customer Success & Growth
**Task**: Task 4 - Monitoring & Alerting
**Created**: 2025-11-16
**Last Updated**: 2025-11-16
**Owner**: DevOps / SRE

---

## Overview

This is the canonical reference document for all monitoring and alerting infrastructure for the Hustle application. It serves as the single source of truth for uptime checks, alert policies, log-based metrics, and notification channels.

**GCP Project**: `hustleapp-production`
**Region**: `us-central1`
**Notification Email**: `alerts@hustleapp.com`

---

## Uptime Checks

### 1. Hustle Production Health Check

**Full Name**: `projects/hustleapp-production/uptimeCheckConfigs/hustle-production-health-check-IwgCcP1iyBI`

**Configuration**:
- **Display Name**: `Hustle Production Health Check`
- **Type**: HTTPS uptime check
- **Resource Type**: `uptime-url`
- **Target**: `https://hustleapp-production.web.app/api/health`
- **Port**: 443
- **Path**: `/api/health`
- **Check Interval**: 60 seconds (1 minute)
- **Timeout**: 10 seconds
- **Regions**: usa-iowa, usa-virginia, usa-oregon (3 regions)
- **Content Matcher**: Contains `"status":"healthy"`
- **Checker Type**: STATIC_IP_CHECKERS

**Expected Responses**:
- **200 OK** with `"status":"healthy"` → Check passes
- **200 OK** with `"status":"degraded"` → Check passes (but may indicate issues)
- **503 Service Unavailable** or `"status":"unhealthy"` → Check fails
- **Any other status** → Check fails

**View in Console**:
```
https://console.cloud.google.com/monitoring/uptime?project=hustleapp-production
```

**gcloud Command**:
```bash
gcloud monitoring uptime describe hustle-production-health-check-IwgCcP1iyBI
```

---

### 2. Hustle Cloud Run Health Check

**Full Name**: `projects/hustleapp-production/uptimeCheckConfigs/hustle-cloud-run-health-check-8Rdkf7uUI94`

**Configuration**:
- **Display Name**: `Hustle Cloud Run Health Check`
- **Type**: HTTPS uptime check
- **Resource Type**: `uptime-url`
- **Target**: `https://hustle-app-d4f2hb75nq-uc.a.run.app/api/health`
- **Port**: 443
- **Path**: `/api/health`
- **Check Interval**: 60 seconds (1 minute)
- **Timeout**: 10 seconds
- **Regions**: usa-iowa, usa-virginia, usa-oregon (3 regions)
- **Content Matcher**: Contains `"status":"healthy"`
- **Checker Type**: STATIC_IP_CHECKERS

**Purpose**: Backup health check for Cloud Run service (Firebase Hosting is primary)

**View in Console**:
```
https://console.cloud.google.com/monitoring/uptime?project=hustleapp-production
```

**gcloud Command**:
```bash
gcloud monitoring uptime describe hustle-cloud-run-health-check-8Rdkf7uUI94
```

---

## Alert Policies

### 1. Hustle Production Health Check Failed

**Full Name**: `projects/hustleapp-production/alertPolicies/324916832590577917`

**Configuration**:
- **Display Name**: `Hustle Production Health Check Failed`
- **Condition**: Uptime check `check_passed` < 1.0 for 2 minutes
- **Filter**: `resource.type = "uptime_url" AND metric.type = "monitoring.googleapis.com/uptime_check/check_passed"`
- **Aggregation**:
  - Period: 120 seconds
  - Aligner: ALIGN_FRACTION_TRUE
- **Threshold**: < 1.0 (i.e., not all checks passing)
- **Duration**: 120 seconds (2 minutes)
- **Combiner**: OR
- **Enabled**: Yes
- **Notification Channel**: Hustle Alerts Email

**Incident Response**:
1. Check health endpoint: `https://hustleapp-production.web.app/api/health`
2. View Cloud Logging: `resource.type="cloud_run_revision" AND textPayload:"api/health"`
3. Check Firestore status in Console
4. Verify environment variables in Cloud Run
5. Escalate if unresolved in 15 minutes

**View in Console**:
```
https://console.cloud.google.com/monitoring/alerting/policies/324916832590577917?project=hustleapp-production
```

**gcloud Command**:
```bash
gcloud alpha monitoring policies describe 324916832590577917
```

---

### 2. Hustle High 5xx Error Rate

**Full Name**: `projects/hustleapp-production/alertPolicies/16232945283659933844`

**Configuration**:
- **Display Name**: `Hustle High 5xx Error Rate`
- **Condition**: 5xx response rate > 10 per 5 minutes
- **Filter**: `resource.type = "cloud_run_revision" AND metric.type = "run.googleapis.com/request_count" AND metric.labels.response_code_class = "5xx"`
- **Aggregation**:
  - Period: 300 seconds (5 minutes)
  - Aligner: ALIGN_RATE
- **Threshold**: > 10.0 requests per second
- **Duration**: 300 seconds (5 minutes)
- **Combiner**: OR
- **Enabled**: Yes
- **Notification Channel**: Hustle Alerts Email

**Incident Response**:
1. Check error logs: `severity=ERROR`
2. Identify error pattern by grouping messages
3. Review recent deployments in Cloud Run Revisions
4. If deployment-related: Rollback to previous revision
5. If data-related: Check Firestore integrity

**Common Causes**:
- Database connection failures
- Missing environment variables after deploy
- Stripe webhook signature mismatches
- Firebase Admin SDK initialization failures

**View in Console**:
```
https://console.cloud.google.com/monitoring/alerting/policies/16232945283659933844?project=hustleapp-production
```

**gcloud Command**:
```bash
gcloud alpha monitoring policies describe 16232945283659933844
```

---

### 3. Hustle Billing Webhook Failures

**Full Name**: `projects/hustleapp-production/alertPolicies/2568253373435680050`

**Configuration**:
- **Display Name**: `Hustle Billing Webhook Failures`
- **Condition**: Webhook error count > 5 in 1 hour
- **Filter**: `resource.type = "cloud_run_revision" AND metric.type = "logging.googleapis.com/user/hustle_webhook_errors"`
- **Aggregation**:
  - Period: 3600 seconds (1 hour)
  - Aligner: ALIGN_SUM
- **Threshold**: > 5.0 errors
- **Duration**: 0 seconds (immediate)
- **Combiner**: OR
- **Enabled**: Yes
- **Notification Channel**: Hustle Alerts Email

**Incident Response**:
1. Check webhook logs: `resource.type="cloud_run_revision" AND jsonPayload.path="/api/billing/webhook"`
2. Verify `STRIPE_WEBHOOK_SECRET` environment variable
3. Check Stripe dashboard: https://dashboard.stripe.com/webhooks
4. Verify webhook endpoint URL in Stripe settings
5. Check for Stripe API version changes

**Common Causes**:
- Invalid webhook signature (secret mismatch)
- Webhook endpoint URL misconfigured in Stripe
- Stripe API version incompatibility
- Firestore write failures

**View in Console**:
```
https://console.cloud.google.com/monitoring/alerting/policies/2568253373435680050?project=hustleapp-production
```

**gcloud Command**:
```bash
gcloud alpha monitoring policies describe 2568253373435680050
```

---

## Log-Based Metrics

### 1. hustle_webhook_errors

**Full Name**: `projects/hustleapp-production/metrics/hustle_webhook_errors`

**Configuration**:
- **Name**: `hustle_webhook_errors`
- **Type**: `logging.googleapis.com/user/hustle_webhook_errors`
- **Description**: Count of errors in billing webhook endpoint
- **Metric Kind**: DELTA
- **Value Type**: INT64
- **Unit**: 1 (count)
- **Filter**:
  ```
  resource.type="cloud_run_revision"
  severity >= "ERROR"
  (textPayload:"/api/billing/webhook" OR jsonPayload.path="/api/billing/webhook")
  ```

**Purpose**: Tracks errors specific to the Stripe billing webhook endpoint

**View in Console**:
```
https://console.cloud.google.com/logs/metrics?project=hustleapp-production
```

**gcloud Command**:
```bash
gcloud logging metrics describe hustle_webhook_errors
```

**Query Logs Directly**:
```bash
gcloud logging read 'resource.type="cloud_run_revision"
severity >= "ERROR"
(textPayload:"/api/billing/webhook" OR jsonPayload.path="/api/billing/webhook")' \
  --limit 50 \
  --format json
```

---

## Notification Channels

### 1. Hustle Alerts Email

**Full Name**: `projects/hustleapp-production/notificationChannels/10069311867038828599`

**Configuration**:
- **Display Name**: `Hustle Alerts Email`
- **Type**: email
- **Description**: Primary notification channel for Hustle app monitoring alerts
- **Email Address**: `alerts@hustleapp.com`
- **Enabled**: Yes

**View in Console**:
```
https://console.cloud.google.com/monitoring/alerting/notifications?project=hustleapp-production
```

**gcloud Command**:
```bash
gcloud alpha monitoring channels describe 10069311867038828599
```

**Update Email Address**:
```bash
# First, export current config
gcloud alpha monitoring channels describe 10069311867038828599 --format=yaml > /tmp/channel.yaml

# Edit /tmp/channel.yaml to change email_address

# Update channel
gcloud alpha monitoring channels update 10069311867038828599 --channel-content-from-file=/tmp/channel.yaml
```

---

## Temporarily Muting Alerts

### Mute All Alerts (Maintenance Window)

```bash
# Disable all alert policies
gcloud alpha monitoring policies update 324916832590577917 --no-enabled  # Health check
gcloud alpha monitoring policies update 16232945283659933844 --no-enabled  # 5xx errors
gcloud alpha monitoring policies update 2568253373435680050 --no-enabled  # Webhook errors
```

### Re-Enable Alerts After Maintenance

```bash
# Re-enable all alert policies
gcloud alpha monitoring policies update 324916832590577917 --enabled  # Health check
gcloud alpha monitoring policies update 16232945283659933844 --enabled  # 5xx errors
gcloud alpha monitoring policies update 2568253373435680050 --enabled  # Webhook errors
```

### Mute Single Alert Policy

```bash
# Example: Mute health check alerts for deployment
gcloud alpha monitoring policies update 324916832590577917 --no-enabled

# After deployment, re-enable
gcloud alpha monitoring policies update 324916832590577917 --enabled
```

### Alternative: Snooze Alerts in Console

1. Go to: https://console.cloud.google.com/monitoring/alerting/policies?project=hustleapp-production
2. Click on the policy name
3. Click "SNOOZE" button
4. Select duration (1 hour, 4 hours, 8 hours, 1 day)
5. Click "SAVE"

---

## Adding a New Service/Check

### Add New Uptime Check

**Example: Add staging environment health check**

```bash
gcloud monitoring uptime create "Hustle Staging Health Check" \
  --resource-type=uptime-url \
  --resource-labels=host=hustle-staging.web.app,project_id=hustleapp-production \
  --protocol=https \
  --path="/api/health" \
  --port=443 \
  --period=1 \
  --timeout=10 \
  --regions=usa-iowa,usa-virginia,usa-oregon \
  --matcher-content='"status":"healthy"' \
  --matcher-type=contains-string
```

### Add New Alert Policy

**Example: Add alert for staging health check**

1. Create YAML file: `/tmp/staging-alert.yaml`

```yaml
displayName: "Hustle Staging Health Check Failed"
documentation:
  content: |
    ## Alert: Staging health check failed
    Check staging environment: https://hustle-staging.web.app/api/health
  mimeType: text/markdown
conditions:
  - displayName: "Staging uptime check failed"
    conditionThreshold:
      filter: 'resource.type = "uptime_url" AND metric.type = "monitoring.googleapis.com/uptime_check/check_passed" AND metric.labels.check_id = "hustle-staging-health-check-XXXXX"'
      aggregations:
        - alignmentPeriod: 120s
          perSeriesAligner: ALIGN_FRACTION_TRUE
      comparison: COMPARISON_LT
      thresholdValue: 1.0
      duration: 120s
combiner: OR
enabled: true
notificationChannels:
  - "projects/hustleapp-production/notificationChannels/10069311867038828599"
```

2. Deploy policy:

```bash
gcloud alpha monitoring policies create --policy-from-file=/tmp/staging-alert.yaml
```

### Add New Log-Based Metric

**Example: Track authentication failures**

```bash
gcloud logging metrics create hustle_auth_failures \
  --description="Count of authentication failures" \
  --log-filter='resource.type="cloud_run_revision"
severity >= "WARNING"
jsonPayload.event="auth_login_failed"'
```

### Add New Notification Channel

**Example: Add SMS notification**

```bash
gcloud alpha monitoring channels create \
  --display-name="Hustle Alerts SMS" \
  --description="SMS notification for critical alerts" \
  --type=sms \
  --channel-labels=number=+1-555-123-4567
```

---

## Maintenance Tasks

### Weekly

- [ ] Review alert history for false positives
- [ ] Check uptime check status (should be 100%)
- [ ] Verify notification channel emails are being received

### Monthly

- [ ] Review alert thresholds based on actual traffic patterns
- [ ] Check for new services that need monitoring
- [ ] Update this reference document if changes made

### Quarterly

- [ ] Full incident response drill (simulate outage)
- [ ] Review and update incident response procedures
- [ ] Audit notification channels (remove inactive members)

---

## Useful Links

- **Cloud Monitoring Console**: https://console.cloud.google.com/monitoring?project=hustleapp-production
- **Uptime Checks**: https://console.cloud.google.com/monitoring/uptime?project=hustleapp-production
- **Alert Policies**: https://console.cloud.google.com/monitoring/alerting/policies?project=hustleapp-production
- **Notification Channels**: https://console.cloud.google.com/monitoring/alerting/notifications?project=hustleapp-production
- **Logs Explorer**: https://console.cloud.google.com/logs/query?project=hustleapp-production
- **Log-Based Metrics**: https://console.cloud.google.com/logs/metrics?project=hustleapp-production

---

## Quick Reference Commands

```bash
# List all uptime checks
gcloud monitoring uptime list-configs

# List all alert policies
gcloud alpha monitoring policies list

# List all notification channels
gcloud alpha monitoring channels list

# List all log-based metrics
gcloud logging metrics list

# View recent alerts
gcloud alpha monitoring incidents list --limit=10

# Test notification channel
gcloud alpha monitoring channels verify 10069311867038828599
```

---

**Document Version**: 1.0
**Last Reviewed**: 2025-11-16
**Next Review**: 2025-12-16
**Owner**: DevOps Team
