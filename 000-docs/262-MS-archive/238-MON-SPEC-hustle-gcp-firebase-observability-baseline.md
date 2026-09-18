# Hustle App - Google Cloud & Firebase Observability Baseline Specification

**Document ID**: 238-MON-SPEC-hustle-gcp-firebase-observability-baseline
**Status**: ACTIVE
**Created**: 2025-11-18
**Phase**: Phase 3 - Monitoring + Agent Deploy Automation
**Owner**: DevOps/SRE

---

## Executive Summary

This document defines the comprehensive monitoring and observability strategy for the Hustle youth sports statistics application. The system consists of three integrated components: Next.js web application, Vertex AI Agent Engine (A2A protocol), and NWSL video pipeline.

**Critical Policy**: No third-party monitoring or observability providers (e.g., Sentry, Datadog, New Relic) are used. Only Firebase and Google Cloud Platform services are allowed.

---

## 1. Scope of Monitoring

### 1.1 Components Under Monitoring

#### A. Next.js Web Application
- **Frontend**: React 19 + Next.js 15 deployed to Firebase Hosting
- **Backend**: Cloud Functions (Node.js 20) for server-side rendering
- **API Routes**: Next.js API handlers (`/api/*`)
- **Authentication**: Firebase Auth (Email/Password)
- **Database**: Firestore (users, players, games subcollections)

#### B. Vertex AI Agent Engine (A2A System)
- **Orchestrator**: `hustle-operations-manager` (main coordinator)
- **Sub-Agents**:
  - Validation Agent
  - User Creation Agent
  - Onboarding Agent
  - Analytics Agent
- **Communication**: Cloud Functions → A2A Protocol → Agents
- **Memory**: Vertex AI Memory Bank (persistent session state)
- **Code Execution**: Sandbox with 14-day TTL

#### C. NWSL Video Pipeline (CI-Only)
- **Generation**: Vertex AI Veo 3.0 (video) + Lyria (audio)
- **Assembly**: GitHub Actions workflow (WIF authentication)
- **Storage**: Cloud Storage for segments and final output
- **Status**: Monitoring via GitHub Actions logs + Cloud Logging

### 1.2 Monitoring Pillars

1. **Metrics**: Quantitative measurements (error rate, latency, throughput)
2. **Logs**: Structured event data (Cloud Logging JSON format)
3. **Traces**: Distributed request tracking (OpenTelemetry)
4. **Alerts**: Proactive notifications (Cloud Monitoring alert policies)
5. **Dashboards**: Visual aggregation (Cloud Monitoring + Firebase Console)

---

## 2. Target SLOs (Service Level Objectives)

### 2.1 Web Application SLOs

| Metric | Target | Measurement Window | Alerting Threshold |
|--------|--------|-------------------|-------------------|
| **Availability** | 99.5% uptime | 30-day rolling | < 99.0% |
| **Latency (p95)** | < 2 seconds | 24-hour rolling | > 3 seconds |
| **Latency (p99)** | < 5 seconds | 24-hour rolling | > 7 seconds |
| **Error Rate** | < 1% | 1-hour rolling | > 5% |
| **API Success Rate** | > 99% | 1-hour rolling | < 95% |
| **First Contentful Paint** | < 1.5s | 7-day rolling | > 2.5s |
| **Time to Interactive** | < 3.5s | 7-day rolling | > 5.0s |

### 2.2 Vertex AI Agent Engine SLOs

| Metric | Target | Measurement Window | Alerting Threshold |
|--------|--------|-------------------|-------------------|
| **Agent Availability** | 99.9% uptime | 30-day rolling | < 99.5% |
| **Task Success Rate** | > 99% | 24-hour rolling | < 95% |
| **Latency (p95)** | < 2 seconds | 24-hour rolling | > 3 seconds |
| **A2A Protocol Health** | 100% compliance | Real-time | Any failure |
| **Memory Bank Query** | < 500ms (p95) | 1-hour rolling | > 1000ms |
| **Code Execution Timeout** | < 30 seconds | Per execution | > 60 seconds |
| **Error Rate** | < 5% | 1-hour rolling | > 10% |

**Health Status Definitions** (from Vertex AI Agent Engine):
- 🟢 **HEALTHY**: Error rate < 5%, latency < 3s (p95)
- 🟡 **DEGRADED**: Error rate 5-10% or latency 3-5s
- 🔴 **UNHEALTHY**: Error rate > 10% or latency > 5s

### 2.3 NWSL Video Pipeline SLOs

| Metric | Target | Measurement Window | Alerting Threshold |
|--------|--------|-------------------|-------------------|
| **Generation Success Rate** | > 90% | Per workflow run | < 75% |
| **Segment Generation Time** | < 120 seconds | Per segment | > 180 seconds |
| **Workflow Completion** | < 15 minutes | End-to-end | > 25 minutes |
| **Storage Upload Success** | 100% | Per file | Any failure |

---

## 3. Signals & Metrics per Component

### 3.1 Next.js Web Application

#### Frontend Metrics (Firebase Performance Monitoring)

**Automatic Traces**:
- Page load time
- First Contentful Paint (FCP)
- First Input Delay (FID)
- Time to Interactive (TTI)
- Network requests (API calls)

**Custom Traces**:
```typescript
// Example: Track player stats calculation
const trace = performance.trace('calculate_player_stats');
trace.start();
// ... calculation logic
trace.stop();
```

**Network Request Monitoring**:
- HTTP response codes (200, 4xx, 5xx)
- Response payload size
- Request duration

#### Backend Metrics (Cloud Functions)

**Function Execution Metrics**:
```
cloudfunctions.googleapis.com/function/execution_count
cloudfunctions.googleapis.com/function/execution_times
cloudfunctions.googleapis.com/function/active_instances
cloudfunctions.googleapis.com/function/network_egress
```

**Custom Metrics**:
- Firebase Auth login success/failure rate
- Firestore read/write operation counts
- API endpoint response times by route
- User action completion rates

**Structured Logging Format**:
```json
{
  "severity": "INFO|WARNING|ERROR|CRITICAL",
  "message": "Human-readable message",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "trace": "projects/PROJECT/traces/TRACE_ID",
  "spanId": "SPAN_ID",
  "labels": {
    "component": "web-app|cloud-function|agent",
    "environment": "production|staging|development",
    "userId": "user_abc123",
    "requestId": "req_xyz789"
  },
  "httpRequest": {
    "requestMethod": "GET|POST|PUT|DELETE",
    "requestUrl": "/api/players",
    "status": 200,
    "latency": "0.234s"
  },
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "User not authorized",
    "stack": "Error stack trace..."
  }
}
```

#### Firestore Metrics

**Built-in Metrics**:
```
firestore.googleapis.com/document/read_count
firestore.googleapis.com/document/write_count
firestore.googleapis.com/document/delete_count
firestore.googleapis.com/api/request_count
```

**Query Performance**:
- Composite index usage
- Query latency percentiles
- Read/write operation errors

### 3.2 Vertex AI Agent Engine

#### Agent Runtime Metrics

**Core Metrics** (from Cloud Monitoring):
```
aiplatform.googleapis.com/agent/request_count
aiplatform.googleapis.com/agent/error_count
aiplatform.googleapis.com/agent/latency
aiplatform.googleapis.com/agent/token_count
```

**Custom Agent Metrics**:
- Task submission rate (tasks/minute)
- Task success/failure rate
- Average task completion time
- Agent invocation count by sub-agent

#### Code Execution Sandbox Metrics

**Performance Metrics**:
- Execution time (per code run)
- Concurrent executions (current/max)
- State persistence TTL violations
- Timeout occurrences

**Security Metrics**:
- Sandbox isolation failures (should be 0)
- IAM permission denials
- External network access attempts (blocked)

#### Memory Bank Metrics

**Storage Metrics**:
- Total memories stored (per agent)
- Memory retention adherence (90-day policy)
- Query latency (p50, p95, p99)
- Index hit rate

**Quota Metrics**:
- Memory count vs. limit (max 100+)
- Auto-cleanup trigger rate
- Storage size (encrypted Firestore)

#### A2A Protocol Health Checks

**Compliance Checks** (Real-time):
```
✅ AgentCard accessible at /.well-known/agent-card
✅ Task API (POST /v1/tasks:send) responding
✅ Status API (GET /v1/tasks/{task_id}) responding
✅ Protocol version 1.0 compliance
✅ Required AgentCard fields present
```

**Protocol Metrics**:
- AgentCard fetch latency
- Task submission success rate
- Status polling response time
- Protocol version mismatches (should be 0)

#### Production Readiness Scoring

**Weighted Categories**:
- Security: 30% (IAM, VPC-SC, encryption, Model Armor)
- Performance: 25% (scaling, limits, SLOs, latency)
- Monitoring: 20% (dashboards, alerts, logs, traces)
- Compliance: 15% (audit logs, DR, privacy)
- Reliability: 10% (multi-region, failover)

**Overall Score Thresholds**:
- 🟢 **PRODUCTION READY**: 85-100%
- 🟡 **NEEDS IMPROVEMENT**: 70-84%
- 🔴 **NOT READY**: < 70%

**Automated Scoring**:
- Run via `jeremy-vertex-engine:vertex-engine-inspector` plugin
- Execute pre-deployment validation
- Generate actionable recommendations

### 3.3 NWSL Video Pipeline

#### GitHub Actions Metrics

**Workflow Metrics**:
- Workflow run duration
- Step-level execution times
- Success/failure rate
- WIF authentication success rate

**Vertex AI Generation Metrics**:
- Veo 3.0 video generation time (per segment)
- Lyria audio generation time
- Operation polling duration
- Generation retry count

#### Cloud Storage Metrics

**Storage Operations**:
```
storage.googleapis.com/api/request_count
storage.googleapis.com/network/sent_bytes_count
storage.googleapis.com/network/received_bytes_count
```

**Pipeline-Specific Metrics**:
- Segment upload success rate
- Final assembly success rate
- Storage bucket utilization

---

## 4. Tools (Explicit - Google-Native Only)

### 4.1 Core Observability Tools

| Tool | Purpose | Components Monitored | Access |
|------|---------|---------------------|--------|
| **Firebase Performance Monitoring** | Frontend performance | Next.js app, user sessions | Firebase Console |
| **Cloud Logging** | Centralized logs | All components | GCP Console, gcloud CLI |
| **Cloud Monitoring** | Metrics & dashboards | All GCP services | GCP Console |
| **Cloud Error Reporting** | Error tracking | Cloud Functions, agents | GCP Console |
| **Cloud Trace** | Distributed tracing | API requests, function calls | GCP Console |
| **Firebase Crashlytics** | App crash reporting | (Future: mobile apps) | Firebase Console |

### 4.2 Vertex AI Agent Engine Telemetry

| Feature | Capability | Integration |
|---------|-----------|-------------|
| **Agent Metrics API** | Request count, latency, errors | Cloud Monitoring |
| **Code Execution Logs** | Sandbox execution traces | Cloud Logging |
| **Memory Bank Telemetry** | Query performance, retention | Cloud Monitoring |
| **A2A Protocol Health** | AgentCard, Task API status | Custom health checks |
| **Production Readiness** | Automated scoring (28 checks) | CI/CD pipeline |
| **OpenTelemetry** | Distributed tracing | Cloud Trace integration |

### 4.3 Log Aggregation & Routing

**Log Router Configuration**:
```yaml
# Cloud Logging log router sinks
sinks:
  - name: firestore-audit-logs
    filter: 'resource.type="firestore_database"'
    destination: bigquery.googleapis.com/projects/PROJECT/datasets/audit_logs

  - name: agent-engine-logs
    filter: 'resource.type="aiplatform.googleapis.com/Agent"'
    destination: logging.googleapis.com/projects/PROJECT/locations/us-central1/buckets/agent-logs

  - name: critical-errors
    filter: 'severity>=ERROR'
    destination: pubsub.googleapis.com/projects/PROJECT/topics/critical-errors
```

**Log Retention**:
- Default: 30 days (Cloud Logging)
- Audit logs: 90 days (compliance requirement)
- Agent logs: 60 days (debugging/analysis)
- Error logs: 180 days (trend analysis)

### 4.4 Alerting Channels

**Notification Channels**:
1. Email: DevOps team distribution list
2. Slack: `#hustle-alerts` channel (via Cloud Functions webhook)
3. PagerDuty: Critical production incidents (future integration)

**Alert Routing Rules**:
- **CRITICAL**: Immediate notification (all channels)
- **WARNING**: Batched notification (5-minute window)
- **INFO**: Dashboard only (no notifications)

---

## 5. Alert Policies

### 5.1 Web Application Alerts

#### Critical Alerts (Immediate Notification)

```yaml
# Alert: High error rate
- name: web-app-high-error-rate
  condition: error_rate > 5% for 5 minutes
  severity: CRITICAL
  notification_channels: [email, slack]
  documentation: |
    Investigate Cloud Functions logs for error patterns.
    Check Firestore connection status.
    Verify Firebase Auth service health.

# Alert: API endpoint down
- name: api-endpoint-unavailable
  condition: healthcheck_failures > 3 consecutive
  severity: CRITICAL
  notification_channels: [email, slack]
  documentation: |
    Check Cloud Functions deployment status.
    Verify Firebase Hosting configuration.
    Review recent deployments for regressions.

# Alert: Database connection failures
- name: firestore-connection-errors
  condition: firestore_errors > 10/minute
  severity: CRITICAL
  notification_channels: [email, slack]
  documentation: |
    Check Firestore service status dashboard.
    Review security rules for permission denials.
    Verify service account credentials.
```

#### Warning Alerts (Batched Notification)

```yaml
# Alert: Elevated latency
- name: web-app-high-latency
  condition: p95_latency > 3 seconds for 10 minutes
  severity: WARNING
  notification_channels: [slack]
  documentation: |
    Review Cloud Functions execution times.
    Check Firestore query performance.
    Analyze frontend bundle size.

# Alert: Increased memory usage
- name: cloud-function-high-memory
  condition: memory_usage > 80% for 15 minutes
  severity: WARNING
  notification_channels: [slack]
  documentation: |
    Review function memory allocation.
    Check for memory leaks in code.
    Consider increasing memory limit.
```

### 5.2 Vertex AI Agent Engine Alerts

#### Critical Alerts

```yaml
# Alert: Agent unavailable
- name: agent-engine-down
  condition: agent_availability < 99.5% for 5 minutes
  severity: CRITICAL
  notification_channels: [email, slack]
  documentation: |
    Check Agent Engine deployment status.
    Verify IAM permissions for service account.
    Review agent runtime logs in Cloud Logging.

# Alert: High agent error rate
- name: agent-high-error-rate
  condition: agent_error_rate > 10% for 5 minutes
  severity: CRITICAL
  notification_channels: [email, slack]
  documentation: |
    Review agent execution logs.
    Check A2A protocol compliance status.
    Verify Code Execution sandbox configuration.

# Alert: A2A protocol failure
- name: a2a-protocol-failure
  condition: agentcard_fetch_failures > 0 OR task_api_failures > 0
  severity: CRITICAL
  notification_channels: [email, slack]
  documentation: |
    Validate AgentCard at /.well-known/agent-card
    Test Task API endpoint (POST /v1/tasks:send)
    Check VPC configuration allows traffic.

# Alert: Memory Bank quota exhaustion
- name: memory-bank-quota-exhausted
  condition: memory_count >= max_memories * 0.95
  severity: CRITICAL
  notification_channels: [email, slack]
  documentation: |
    Enable auto-cleanup if not configured.
    Review memory retention policy (90 days).
    Consider increasing max memory limit.
```

#### Warning Alerts

```yaml
# Alert: Agent performance degradation
- name: agent-degraded-performance
  condition: p95_latency > 3 seconds for 10 minutes
  severity: WARNING
  notification_channels: [slack]
  documentation: |
    Review agent request volume.
    Check auto-scaling configuration.
    Analyze Code Execution timeout occurrences.

# Alert: Code Execution sandbox timeout
- name: code-execution-timeout
  condition: execution_timeout_count > 5/hour
  severity: WARNING
  notification_channels: [slack]
  documentation: |
    Review code complexity in sandbox.
    Check resource allocation limits.
    Consider optimizing code execution logic.

# Alert: Production readiness score drop
- name: agent-readiness-score-drop
  condition: readiness_score < 85%
  severity: WARNING
  notification_channels: [slack]
  documentation: |
    Run vertex-engine-inspector plugin.
    Review failed checks in scoring report.
    Address critical issues before production.
```

### 5.3 NWSL Video Pipeline Alerts

#### Critical Alerts

```yaml
# Alert: Workflow failure
- name: nwsl-workflow-failure
  condition: workflow_status == "failure"
  severity: CRITICAL
  notification_channels: [email, slack]
  documentation: |
    Review GitHub Actions workflow logs.
    Check WIF authentication status.
    Verify Vertex AI Veo 3.0 API quota.

# Alert: Segment generation failure
- name: segment-generation-failure
  condition: failed_segments > 2 in single workflow
  severity: CRITICAL
  notification_channels: [email, slack]
  documentation: |
    Check Vertex AI operation logs.
    Verify canon file specifications.
    Review prompt quality and context.
```

---

## 6. Dashboards

### 6.1 Web Application Dashboard

**Firebase Console Dashboard** (Primary):
- Performance tab: FCP, FID, TTI trends
- Network requests: Success rates, latency distributions
- User sessions: Active users, session duration

**Cloud Monitoring Dashboard** (Secondary):
```yaml
dashboard_name: Hustle Web App Overview
panels:
  - title: API Request Rate
    metric: cloudfunctions.googleapis.com/function/execution_count
    aggregation: rate(1m)

  - title: API Latency (p95)
    metric: cloudfunctions.googleapis.com/function/execution_times
    percentile: 95

  - title: Error Rate by Endpoint
    metric: logging.googleapis.com/user/api_errors
    group_by: endpoint

  - title: Firestore Operations
    metric: firestore.googleapis.com/document/read_count
    stacked: true
```

### 6.2 Vertex AI Agent Engine Dashboard

**Cloud Monitoring Dashboard**:
```yaml
dashboard_name: Vertex AI Agent Engine Health
panels:
  - title: Agent Request Rate
    metric: aiplatform.googleapis.com/agent/request_count
    group_by: agent_id

  - title: Task Success Rate
    metric: custom.googleapis.com/agent/task_success_rate
    chart_type: gauge
    target: 99%

  - title: Agent Latency Distribution
    metric: aiplatform.googleapis.com/agent/latency
    percentiles: [50, 95, 99]

  - title: Memory Bank Query Performance
    metric: custom.googleapis.com/memory_bank/query_latency
    percentile: 95

  - title: Code Execution Timeouts
    metric: custom.googleapis.com/code_execution/timeout_count
    chart_type: timeseries

  - title: A2A Protocol Health
    metric: custom.googleapis.com/a2a/health_check_status
    chart_type: status_indicator

  - title: Production Readiness Score
    metric: custom.googleapis.com/agent/readiness_score
    chart_type: scorecard
    thresholds:
      green: 85
      yellow: 70
      red: 0
```

### 6.3 NWSL Pipeline Dashboard

**GitHub Actions Dashboard** (Primary):
- Workflow run history (success/failure)
- Step-level duration breakdown
- Segment generation status grid

**Cloud Monitoring Dashboard** (Secondary):
```yaml
dashboard_name: NWSL Video Pipeline
panels:
  - title: Workflow Success Rate
    metric: custom.googleapis.com/nwsl/workflow_success_rate
    chart_type: gauge

  - title: Segment Generation Time
    metric: custom.googleapis.com/nwsl/segment_duration
    percentile: 95

  - title: Storage Upload Success
    metric: storage.googleapis.com/api/request_count
    filter: method="INSERT" AND status=200
```

---

## 7. OpenTelemetry Integration

### 7.1 Distributed Tracing

**Cloud Functions Tracing**:
```typescript
import { Tracer } from '@google-cloud/opentelemetry-cloud-trace-exporter';

// Initialize tracer
const tracer = Tracer.getTracer('hustle-app');

// Example: Trace API request
const span = tracer.startSpan('api.players.create');
span.setAttribute('userId', userId);
span.setAttribute('playerId', playerId);

try {
  // ... API logic
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  span.recordException(error);
} finally {
  span.end();
}
```

**Trace Context Propagation**:
- W3C Trace Context standard
- Propagate `traceparent` header across service boundaries
- Link frontend traces → Cloud Functions → Vertex AI agents

### 7.2 Custom Spans

**Critical Operations to Trace**:
1. User authentication flow (Firebase Auth → Firestore)
2. Player stats calculation (game data aggregation)
3. Agent orchestration (Cloud Function → A2A protocol)
4. Memory Bank queries (retrieval latency)
5. Firestore batch writes (player/game creation)

---

## 8. Incident Response Runbook

### 8.1 Response Workflow

```
1. Alert received (email/Slack)
   ↓
2. Acknowledge alert (update status)
   ↓
3. Assess severity (CRITICAL vs WARNING)
   ↓
4. Query relevant dashboards
   ↓
5. Review structured logs (Cloud Logging)
   ↓
6. Identify root cause
   ↓
7. Implement fix (hotfix deployment if needed)
   ↓
8. Verify resolution (metrics return to normal)
   ↓
9. Post-incident review (AAR document)
```

### 8.2 Escalation Matrix

| Severity | Response Time | Initial Responder | Escalation Path |
|----------|--------------|-------------------|-----------------|
| CRITICAL | 15 minutes | On-call engineer | → Tech Lead → CTO |
| WARNING | 1 hour | DevOps team | → Tech Lead |
| INFO | Next business day | DevOps team | N/A |

### 8.3 Common Incident Playbooks

**Playbook: High Error Rate**
```
1. Check Cloud Error Reporting for error clusters
2. Query Cloud Logging: severity>=ERROR AND timestamp>now-1h
3. Identify affected service (web-app, agent, pipeline)
4. Review recent deployments (last 24 hours)
5. Rollback if regression identified
6. Document root cause in AAR
```

**Playbook: Agent Unavailable**
```
1. Check Vertex AI Agent Engine status dashboard
2. Verify IAM permissions: gcloud iam service-accounts describe ...
3. Test A2A protocol endpoints manually
4. Review agent runtime logs in Cloud Logging
5. Redeploy agent if configuration drift detected
6. Run vertex-engine-inspector post-deployment
```

**Playbook: Database Connection Failures**
```
1. Check Firestore service status: https://status.cloud.google.com
2. Review security rules for permission denials
3. Verify service account credentials in Secret Manager
4. Check network connectivity from Cloud Functions
5. Review Firestore quota limits
```

---

## 9. Cost Management

### 9.1 Cost Monitoring

**Budget Alerts**:
- Monthly budget: $500 (production), $200 (staging)
- Alert thresholds: 50%, 75%, 90%, 100%
- Notification: Email to finance team

**Cost Attribution**:
- Labels: `component=web-app|agent|pipeline`, `environment=prod|staging`
- Cost breakdown by service (Cloud Functions, Firestore, Agent Engine)
- Token usage tracking for Vertex AI (daily aggregation)

### 9.2 Cost Optimization Strategies

1. **Cloud Functions**: Right-size memory allocation based on metrics
2. **Firestore**: Optimize query patterns to reduce read operations
3. **Vertex AI**: Use Gemini 2.5 Flash (cost-effective) for agents
4. **Cloud Logging**: Implement log sampling for high-volume traces
5. **Cloud Storage**: Lifecycle policies for NWSL segments (delete after 30 days)

---

## 10. Non-Goals

### 10.1 Explicitly Out of Scope

❌ **Third-party observability platforms**:
- No Sentry, Datadog, New Relic, Dynatrace, Splunk, etc.
- Removed Sentry in Phase 1 (completed 2025-11-18)

❌ **Custom metrics backend**:
- No Prometheus, Graphite, InfluxDB
- Use Cloud Monitoring exclusively

❌ **Self-hosted logging**:
- No ELK stack (Elasticsearch, Logstash, Kibana)
- No Fluentd/Fluent Bit custom configurations
- Use Cloud Logging exclusively

❌ **APM tools**:
- No AppDynamics, Instana, Elastic APM
- Use Cloud Trace + Firebase Performance Monitoring

❌ **Synthetic monitoring**:
- No Pingdom, Uptime Robot, StatusCake (Phase 3 scope)
- May be added in Phase 4 if needed

### 10.2 Future Considerations (Post-Phase 3)

- **Mobile App Monitoring**: Firebase Crashlytics (when iOS/Android apps launch)
- **Synthetic Monitoring**: Cloud Monitoring Uptime Checks (external probes)
- **Business Intelligence**: BigQuery exports for long-term trend analysis
- **User Analytics**: Google Analytics 4 integration (privacy-compliant)

---

## 11. Implementation Checklist

### Phase 3 - Step 2: Standardize Logging

- [ ] Update Cloud Functions to use structured JSON logging
- [ ] Add trace context to all log entries
- [ ] Implement log severity levels (INFO, WARNING, ERROR, CRITICAL)
- [ ] Add custom labels (userId, requestId, component)
- [ ] Configure log routing sinks (BigQuery, Pub/Sub)

### Phase 3 - Step 3: Configure GCP Monitoring

- [ ] Create Cloud Monitoring dashboards (3 dashboards defined above)
- [ ] Deploy alert policies (15 policies defined above)
- [ ] Configure notification channels (email, Slack webhook)
- [ ] Set up budget alerts ($500/month production)
- [ ] Enable cost attribution labels

### Phase 3 - Step 4: Enable Firebase Performance Monitoring

- [ ] Verify Firebase Performance Monitoring SDK installed
- [ ] Configure automatic traces (page load, network requests)
- [ ] Add custom traces for critical user flows
- [ ] Set performance budgets (FCP < 1.5s, TTI < 3.5s)
- [ ] Create Firebase Console dashboards

### Phase 3 - Step 5: Vertex AI Agent Telemetry

- [ ] Enable OpenTelemetry in agent runtime
- [ ] Configure Cloud Monitoring integration for agents
- [ ] Set up Memory Bank query metrics
- [ ] Implement A2A protocol health checks
- [ ] Deploy production readiness scoring automation
- [ ] Add Code Execution sandbox monitoring

### Phase 3 - Step 6: Agent Smoke Tests

- [ ] Create post-deployment health check script
- [ ] Test AgentCard endpoint availability
- [ ] Validate Task API functionality
- [ ] Check Memory Bank connectivity
- [ ] Verify Code Execution sandbox
- [ ] Integrate smoke tests into CI/CD

---

## 12. Validation Criteria

### 12.1 Phase 3 Completion Gates

✅ **Gate 1: Logging Standardized**
- All Cloud Functions emit structured JSON logs
- Trace context present in 100% of logs
- Log router sinks operational (verified via test queries)

✅ **Gate 2: Monitoring Configured**
- 3 dashboards created and populated with data
- 15 alert policies deployed and triggered successfully
- Notification channels tested (received test alerts)

✅ **Gate 3: Firebase Performance Enabled**
- Performance Monitoring SDK active (verified in Firebase Console)
- Automatic traces collecting data (> 100 sessions)
- Custom traces implemented (≥ 5 critical flows)

✅ **Gate 4: Agent Telemetry Operational**
- Agent metrics flowing to Cloud Monitoring
- Production readiness score ≥ 85% (GREEN status)
- A2A protocol health checks passing
- OpenTelemetry traces visible in Cloud Trace

✅ **Gate 5: Smoke Tests Passing**
- Post-deployment health checks succeed (100% pass rate)
- Automated in CI/CD pipeline (GitHub Actions)
- Test results logged to Cloud Logging

---

## 13. References

### Google Cloud Documentation
- Cloud Monitoring: https://cloud.google.com/monitoring/docs
- Cloud Logging: https://cloud.google.com/logging/docs
- Cloud Trace: https://cloud.google.com/trace/docs
- Firebase Performance Monitoring: https://firebase.google.com/docs/perf-mon
- Vertex AI Agent Engine: https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview
- OpenTelemetry: https://cloud.google.com/trace/docs/setup/opentelemetry

### Internal Documentation
- Phase 1 AAR: `000-docs/186-AA-REPT-hustle-phase-1-auth-observability-cleanup.md`
- Phase 2 AAR: `000-docs/237-AA-REPT-hustle-phase-2-postgresql-decommission.md`
- Vertex AI A2A Deployment: `000-docs/173-OD-DEPL-vertex-ai-a2a-deployment-guide.md`
- Firebase A2A Deployment Status: `000-docs/174-LS-STAT-firebase-a2a-deployment-complete.md`

### Plugin Documentation
- Vertex Engine Inspector: `jeremy-vertex-engine:vertex-engine-inspector`
- A2A Protocol Manager: `jeremy-adk-orchestrator:a2a-protocol-manager`

---

## 14. Appendix: Vertex AI Agent Engine Production Readiness Checks

### Automated Validation (28 Checks)

#### Security (30% weight)
1. ✅ IAM roles follow least privilege principle
2. ✅ VPC Service Controls enabled
3. ✅ Model Armor enabled (prompt injection protection)
4. ✅ Encryption at-rest and in-transit
5. ✅ Service account properly configured
6. ✅ No hardcoded credentials in code

#### Performance (25% weight)
1. ✅ Auto-scaling configured (min/max instances)
2. ✅ Resource limits appropriate (CPU, memory)
3. ✅ Latency p95 < 3 seconds
4. ✅ Throughput meets demand (requests/second)
5. ✅ Token usage tracked and optimized
6. ✅ Error rate < 5%

#### Monitoring (20% weight)
1. ✅ Cloud Monitoring dashboards configured
2. ✅ Alert policies for errors deployed
3. ✅ Alert policies for latency deployed
4. ✅ Structured logs aggregated in Cloud Logging
5. ✅ OpenTelemetry tracing enabled
6. ✅ Cloud Error Reporting integrated

#### Compliance (15% weight)
1. ✅ Audit logs enabled (365-day retention)
2. ✅ Disaster recovery plan documented
3. ✅ Privacy policies enforced
4. ✅ Data residency requirements met
5. ✅ COPPA compliance for youth data

#### Reliability (10% weight)
1. ✅ Multi-region deployment (future)
2. ✅ Failover mechanisms in place
3. ✅ Backup and restore procedures tested
4. ✅ Circuit breaker pattern implemented
5. ✅ Graceful degradation handling

**Scoring Example**:
```
Security:     6/6 checks = 100% × 30% = 30 points
Performance:  5/6 checks = 83%  × 25% = 21 points
Monitoring:   6/6 checks = 100% × 20% = 20 points
Compliance:   4/5 checks = 80%  × 15% = 12 points
Reliability:  3/5 checks = 60%  × 10% = 6 points
----------------------------------------
Overall Score: 89% → 🟢 PRODUCTION READY
```

---

**Document Status**: ACTIVE
**Next Review Date**: 2025-12-18 (30 days)
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---
