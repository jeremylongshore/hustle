# Hustle App - Structured Logging Standard

**Document ID**: 239-OD-GUID-logging-standard
**Status**: ACTIVE
**Created**: 2025-11-18
**Phase**: Phase 3 - Monitoring + Agent Deploy Automation
**Owner**: DevOps/SRE

---

## Purpose

This document defines the standard for structured logging across all Hustle application components. All logs must be compatible with Google Cloud Logging best practices to enable efficient querying, correlation, and monitoring.

**Related Documents**:
- Observability Baseline: `000-docs/238-MON-SPEC-hustle-gcp-firebase-observability-baseline.md`

---

## 1. Structured Logging Overview

### 1.1 Why Structured Logging?

**Benefits**:
- **Queryable**: JSON fields enable precise filtering in Cloud Logging
- **Correlation**: Trace context links logs across services
- **Aggregation**: Severity levels and labels enable grouping
- **Automation**: Error Reporting automatically groups structured errors
- **Performance**: Indexed fields improve query speed

**Example Query** (Cloud Logging):
```
severity>=ERROR
labels.component="cloud-function"
labels.userId="user_123"
timestamp>"2025-11-18T00:00:00Z"
```

### 1.2 JSON Log Format

All logs MUST be emitted as JSON objects with the following structure:

```json
{
  "severity": "INFO|WARNING|ERROR|CRITICAL",
  "message": "Human-readable message",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "trace": "projects/hustleapp-production/traces/abc123",
  "spanId": "def456",
  "labels": {
    "component": "cloud-function",
    "environment": "production",
    "userId": "user_abc123",
    "requestId": "req_xyz789"
  },
  "data": {
    "intent": "user_registration",
    "durationMs": 234
  },
  "httpRequest": {
    "requestMethod": "POST",
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

---

## 2. Severity Levels

### 2.1 Severity Hierarchy

Use Cloud Logging severity levels (aligned with syslog):

| Severity | Level | Use Case | Example |
|----------|-------|----------|---------|
| **DEBUG** | 100 | Detailed debugging info | Variable values, state transitions |
| **INFO** | 200 | Normal operations | Request received, task completed |
| **NOTICE** | 300 | Significant events | User login, config change |
| **WARNING** | 400 | Potential issues | Retry attempt, degraded performance |
| **ERROR** | 500 | Operation failed | API call failed, validation error |
| **CRITICAL** | 600 | Service degraded | Database unreachable, quota exhausted |
| **ALERT** | 700 | Immediate action | Service down, data corruption |
| **EMERGENCY** | 800 | System unusable | Multiple service failures |

### 2.2 Severity Selection Guide

**Use INFO for**:
- Successful requests/operations
- Normal application flow
- Performance metrics within SLOs

**Use WARNING for**:
- Retry attempts before failure
- Deprecated feature usage
- Performance degradation (still functional)

**Use ERROR for**:
- Failed operations (request continues)
- Validation failures
- External service errors
- Non-critical resource unavailable

**Use CRITICAL for**:
- Service-wide failures
- Data integrity issues
- Security violations
- Resource exhaustion (quota, memory)

### 2.3 Severity Best Practices

```typescript
// ✅ Good: INFO for successful operations
logger.info('User created successfully', { userId, email });

// ❌ Bad: WARNING for normal operations
logger.warn('User created successfully', { userId, email });

// ✅ Good: ERROR for failed operation
logger.error('Failed to create user', error, { email });

// ❌ Bad: CRITICAL for single failed operation
logger.critical('Failed to create user', error, { email });

// ✅ Good: CRITICAL for service-wide failure
logger.critical('Firestore connection lost', error, { retryAttempts: 3 });
```

---

## 3. Required Fields

### 3.1 Mandatory Fields

**Every log entry MUST include**:
1. **severity**: One of the defined severity levels
2. **message**: Human-readable description (no sensitive data)
3. **timestamp**: ISO 8601 format (UTC)

**Example**:
```typescript
{
  "severity": "INFO",
  "message": "Player stats calculated",
  "timestamp": "2025-11-18T10:30:15.234Z"
}
```

### 3.2 Standard Labels

**All logs SHOULD include**:
- **component**: Which system generated the log
  - Values: `web-app`, `cloud-function`, `agent`, `pipeline`
- **environment**: Deployment environment
  - Values: `production`, `staging`, `development`

**User-scoped logs SHOULD include**:
- **userId**: User identifier for correlation
- **requestId**: Unique request identifier

**Agent logs SHOULD include**:
- **agentId**: Vertex AI agent identifier
- **sessionId**: A2A protocol session ID

**Example**:
```typescript
logger.info('Task completed', {
  userId: 'user_abc123',
  requestId: 'req_xyz789',
  agentId: 'hustle-operations-manager',
  durationMs: 1250,
});
```

### 3.3 Trace Context

For distributed tracing correlation, include:
- **trace**: Full trace path (`projects/PROJECT_ID/traces/TRACE_ID`)
- **spanId**: Current span identifier
- **traceSampled**: Whether trace is sampled (boolean)

Cloud Logging automatically links logs with matching trace IDs in Cloud Trace.

---

## 4. Using the Structured Logger

### 4.1 Import and Initialize

**Cloud Functions** (`functions/src/`):
```typescript
import { createLogger, logger } from './logger';

// Use default logger
logger.info('Simple message');

// Create logger with default labels
const functionLogger = createLogger({
  component: 'cloud-function',
  userId: context.auth?.uid,
  requestId: context.instanceIdToken,
});
```

**Firebase Functions v2** (alternative):
```typescript
import * as logger from 'firebase-functions/logger';

// Firebase Functions logger already emits structured JSON
logger.info('Task completed', { userId, durationMs });
logger.error('Task failed', { error: error.message, userId });
```

### 4.2 Basic Logging

```typescript
// INFO level (normal operations)
logger.info('User login successful', { userId: 'user_123', email: 'user@example.com' });

// WARNING level (potential issues)
logger.warn('High latency detected', { latencyMs: 3500, endpoint: '/api/players' });

// ERROR level (operation failed)
logger.error('Failed to fetch player data', error, { playerId: 'player_456' });

// CRITICAL level (service degraded)
logger.critical('Firestore quota exhausted', error, { quotaLimit: 10000 });
```

### 4.3 Child Loggers

Create child loggers with additional context:

```typescript
const requestLogger = logger.child({
  requestId: 'req_abc123',
  userId: 'user_xyz789',
});

// All logs from this logger will include requestId and userId
requestLogger.info('Request started');
requestLogger.info('Validation passed');
requestLogger.info('Request completed', { durationMs: 450 });
```

### 4.4 HTTP Request Logging

Log HTTP requests with automatic metadata extraction:

```typescript
logger.httpRequest('API request completed', {
  method: 'POST',
  url: '/api/players',
  status: 201,
  latency: 234, // milliseconds
  userAgent: req.headers['user-agent'],
  remoteIp: req.ip,
  traceHeader: req.headers['x-cloud-trace-context'],
});

// Emits:
// {
//   "severity": "INFO",
//   "message": "API request completed",
//   "httpRequest": {
//     "requestMethod": "POST",
//     "requestUrl": "/api/players",
//     "status": 201,
//     "latency": "0.234s"
//   },
//   "trace": "projects/PROJECT_ID/traces/abc123",
//   "spanId": "def456"
// }
```

### 4.5 Agent Logging

Log Vertex AI agent interactions:

```typescript
// Agent request
logger.agentRequest(
  'hustle-operations-manager',
  'user_registration',
  { email: 'user@example.com' },
  { userId: 'user_123' }
);

// Agent response
logger.agentResponse(
  'hustle-operations-manager',
  'user_registration',
  true, // success
  1250, // durationMs
  { userId: 'user_123' }
);
```

### 4.6 Function Lifecycle Logging

Track Cloud Function execution:

```typescript
export const myFunction = functions.https.onCall(async (data, context) => {
  const startTime = Date.now();
  const functionLogger = createLogger({
    component: 'cloud-function',
    userId: context.auth?.uid,
  });

  functionLogger.functionStart('myFunction');

  try {
    // ... function logic
    functionLogger.functionEnd('myFunction', startTime);
  } catch (error) {
    const duration = Date.now() - startTime;
    functionLogger.error('Function failed', error, { durationMs: duration });
    throw error;
  }
});
```

---

## 5. Error Logging Best Practices

### 5.1 Logging Exceptions

**Always include**:
- Error message
- Stack trace (automatically included)
- Context labels (userId, requestId, etc.)

```typescript
try {
  await createPlayer(playerData);
} catch (error) {
  logger.error('Failed to create player', error, {
    userId: context.auth?.uid,
    playerData: { name: playerData.name, position: playerData.position },
    // ❌ Don't log sensitive data (passwords, tokens, etc.)
  });
  throw error;
}
```

### 5.2 Error Context

Provide sufficient context for debugging:

```typescript
// ✅ Good: Includes relevant context
logger.error('Firestore write failed', error, {
  collection: 'players',
  documentId: playerId,
  operation: 'update',
  retryAttempt: 2,
});

// ❌ Bad: Missing context
logger.error('Write failed', error);
```

### 5.3 Sensitive Data Protection

**NEVER log**:
- Passwords or hashes
- Authentication tokens
- API keys
- Credit card numbers
- Personal identification numbers (SSN, etc.)

```typescript
// ✅ Good: Logs email, not password
logger.info('User registration attempt', { email: user.email });

// ❌ Bad: Logs sensitive data
logger.info('User registration', { email: user.email, password: user.password });
```

---

## 6. Performance Metrics

### 6.1 Duration Tracking

Always log operation duration for SLO monitoring:

```typescript
const startTime = Date.now();

try {
  const result = await expensiveOperation();
  const duration = Date.now() - startTime;

  logger.info('Operation completed', {
    operation: 'player_stats_calculation',
    durationMs: duration,
    playerCount: result.count,
  });
} catch (error) {
  const duration = Date.now() - startTime;
  logger.error('Operation failed', error, { durationMs: duration });
}
```

### 6.2 Resource Usage

Log resource consumption for optimization:

```typescript
logger.info('Batch operation completed', {
  operation: 'bulk_player_import',
  recordsProcessed: 1500,
  durationMs: 4500,
  averageMs: 3, // 4500 / 1500
  memoryUsedMB: process.memoryUsage().heapUsed / 1024 / 1024,
});
```

---

## 7. Querying Logs

### 7.1 Cloud Logging Queries

**Find all errors for a specific user**:
```
severity>=ERROR
labels.userId="user_abc123"
timestamp>"2025-11-18T00:00:00Z"
```

**Find slow requests (> 2 seconds)**:
```
data.durationMs>2000
labels.component="cloud-function"
```

**Find agent failures**:
```
severity=ERROR
labels.component="agent"
labels.agentId="hustle-operations-manager"
```

**Find failed API calls**:
```
httpRequest.status>=400
timestamp>"2025-11-18T00:00:00Z"
```

### 7.2 Log Correlation with Traces

**Find all logs for a specific trace**:
```
trace="projects/hustleapp-production/traces/abc123def456"
```

This shows all logs across all services for a single request, enabling end-to-end debugging.

### 7.3 Advanced Queries

**Error rate calculation**:
```
severity=ERROR
labels.component="cloud-function"
| rate(1m)
```

**P95 latency by endpoint**:
```
data.durationMs>0
| percentile(data.durationMs, 95)
  BY httpRequest.requestUrl
```

---

## 8. Log Routing and Retention

### 8.1 Log Sinks

Logs are automatically routed to destinations based on filters:

**Firestore audit logs** → BigQuery (90-day retention):
```yaml
filter: 'resource.type="firestore_database"'
destination: bigquery.googleapis.com/projects/PROJECT/datasets/audit_logs
```

**Agent logs** → Dedicated bucket (60-day retention):
```yaml
filter: 'resource.type="aiplatform.googleapis.com/Agent"'
destination: logging.googleapis.com/projects/PROJECT/locations/us-central1/buckets/agent-logs
```

**Critical errors** → Pub/Sub (real-time alerting):
```yaml
filter: 'severity>=ERROR'
destination: pubsub.googleapis.com/projects/PROJECT/topics/critical-errors
```

### 8.2 Retention Policies

| Log Type | Retention | Storage |
|----------|-----------|---------|
| Default logs | 30 days | Cloud Logging |
| Audit logs | 90 days | BigQuery |
| Agent logs | 60 days | Cloud Logging bucket |
| Error logs | 180 days | Cloud Logging bucket |

---

## 9. Testing Structured Logs

### 9.1 Local Testing

**View structured logs locally**:
```bash
cd functions
npm run serve

# In another terminal, trigger function
# View JSON logs in emulator output
```

**Validate JSON format**:
```typescript
// Test logger output
const testLogger = createLogger({ component: 'cloud-function' });
testLogger.info('Test message', { testData: 'value' });

// Expected output (single line JSON):
// {"severity":"INFO","message":"Test message","timestamp":"...","labels":{...},"data":{...}}
```

### 9.2 Production Verification

**Check logs in Cloud Console**:
1. Navigate to Cloud Logging
2. Select "Cloud Functions" resource
3. Verify JSON structure in log entries
4. Confirm trace context present
5. Test log filtering by labels

**CLI verification**:
```bash
# View recent function logs
gcloud functions logs read myFunction --limit=10 --format=json

# Filter by severity
gcloud logging read "severity>=ERROR AND resource.type=cloud_function" --limit=10
```

---

## 10. Migration from Console Logging

### 10.1 Before (Console Logging)

```typescript
// ❌ Old: Unstructured console logging
console.log(`User ${userId} created player ${playerId}`);
console.error('Error creating player:', error);
```

### 10.2 After (Structured Logging)

```typescript
// ✅ New: Structured JSON logging
logger.info('Player created successfully', { userId, playerId });
logger.error('Failed to create player', error, { userId });
```

### 10.3 Migration Checklist

- [ ] Replace all `console.log()` with `logger.info()`
- [ ] Replace all `console.warn()` with `logger.warn()`
- [ ] Replace all `console.error()` with `logger.error()`
- [ ] Add context labels (userId, requestId, component)
- [ ] Include duration tracking for operations
- [ ] Remove sensitive data from log messages
- [ ] Test JSON format in Cloud Logging
- [ ] Verify trace context propagation

---

## 11. Examples by Component

### 11.1 Cloud Functions (Orchestrator)

```typescript
import { createLogger } from './logger';

export const orchestrator = functions.https.onCall(async (data, context) => {
  const startTime = Date.now();
  const requestLogger = createLogger({
    component: 'cloud-function',
    userId: context.auth?.uid,
    requestId: String(context.instanceIdToken || Date.now()),
  });

  try {
    const { intent, data: requestData } = data;

    requestLogger.info('Orchestrator received intent', { intent });

    // Call agent
    const response = await a2aClient.sendTask({
      intent,
      data: requestData,
      auth: context.auth,
    });

    const duration = Date.now() - startTime;
    requestLogger.info('Orchestrator request completed', {
      intent,
      durationMs: duration,
      success: response.success,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    requestLogger.error('Orchestrator error', error, { durationMs: duration });
    throw new functions.https.HttpsError('internal', 'Request failed');
  }
});
```

### 11.2 Email Service

```typescript
import { createLogger } from './logger';

const emailLogger = createLogger({ component: 'cloud-function' });

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject } = options;

  try {
    const result = await resend.emails.send(options);

    if (result.error) {
      emailLogger.error('Resend API error', new Error(result.error.message), {
        to,
        subject,
      });
      return { success: false, error: result.error.message };
    }

    emailLogger.info('Email sent successfully', {
      to,
      subject,
      emailId: result.data?.id,
    });
    return { success: true, data: result.data };
  } catch (error) {
    emailLogger.error('Failed to send email', error, { to, subject });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### 11.3 Scheduled Functions

```typescript
import { createLogger } from './logger';

export const sendTrialReminders = functions.pubsub
  .schedule('0 9 * * *')
  .onRun(async (context) => {
    const startTime = Date.now();
    const reminderLogger = createLogger({
      component: 'cloud-function',
      requestId: context.eventId,
    });

    try {
      reminderLogger.info('Starting daily trial reminder check');

      const workspaces = await db.collection('workspaces')
        .where('status', '==', 'trial')
        .get();

      reminderLogger.info('Found workspaces with expiring trials', {
        count: workspaces.size,
      });

      // ... process workspaces

      const duration = Date.now() - startTime;
      reminderLogger.info('Trial reminder check complete', {
        workspacesChecked: workspaces.size,
        emailsSent,
        emailsFailed,
        durationMs: duration,
      });

      return { success: true };
    } catch (error) {
      const duration = Date.now() - startTime;
      reminderLogger.critical('Trial reminder check fatal error', error, {
        durationMs: duration,
      });
      throw error;
    }
  });
```

---

## 12. Common Anti-Patterns

### 12.1 Don't Log Too Much

```typescript
// ❌ Bad: Excessive debug logging in production
for (const player of players) {
  logger.debug('Processing player', {
    player: JSON.stringify(player), // Large object
    index: i,
    total: players.length,
  });
}

// ✅ Good: Aggregate logging
logger.info('Batch player processing complete', {
  count: players.length,
  durationMs: Date.now() - startTime,
});
```

### 12.2 Don't Log at Wrong Severity

```typescript
// ❌ Bad: Using ERROR for expected failures
if (!user) {
  logger.error('User not found', { userId });
  return null;
}

// ✅ Good: Using WARNING for expected cases
if (!user) {
  logger.warn('User not found', { userId });
  return null;
}
```

### 12.3 Don't Log Without Context

```typescript
// ❌ Bad: No context
logger.error('Failed to save');

// ✅ Good: Includes context
logger.error('Failed to save player to Firestore', error, {
  playerId,
  userId,
  operation: 'create',
});
```

---

## 13. Monitoring and Alerting

### 13.1 Error Rate Alerts

Alerts trigger when error rate exceeds thresholds (defined in `238-MON-SPEC`):

**Cloud Monitoring Alert Policy**:
```yaml
conditionThreshold:
  filter: |
    resource.type="cloud_function"
    severity>=ERROR
  aggregation:
    alignmentPeriod: 300s
    perSeriesAligner: ALIGN_RATE
  comparison: COMPARISON_GT
  thresholdValue: 0.05  # 5% error rate
  duration: 300s
```

### 13.2 Log-Based Metrics

Custom metrics derived from logs:

**Player creation success rate**:
```
resource.type="cloud_function"
jsonPayload.message="Player created successfully"
```

**Agent response time (p95)**:
```
resource.type="cloud_function"
jsonPayload.data.durationMs>0
jsonPayload.labels.agentId!=""
| percentile(jsonPayload.data.durationMs, 95)
```

---

## 14. References

### 14.1 Internal Documentation
- Observability Baseline: `000-docs/238-MON-SPEC-hustle-gcp-firebase-observability-baseline.md`
- Phase 3 Prompt: Monitoring + Agent Deploy Automation
- Logger Implementation: `functions/src/logger.ts`

### 14.2 Google Cloud Documentation
- Cloud Logging: https://cloud.google.com/logging/docs
- Structured Logging: https://cloud.google.com/logging/docs/structured-logging
- Log Severity Levels: https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity
- Cloud Trace: https://cloud.google.com/trace/docs
- W3C Trace Context: https://www.w3.org/TR/trace-context/

---

## 15. Appendix: Logger API Reference

### 15.1 Logger Class

```typescript
class Logger {
  constructor(defaultLabels: Partial<LogLabels>);

  // Basic logging
  debug(message: string, data?: Record<string, any>, labels?: Partial<LogLabels>): void;
  info(message: string, data?: Record<string, any>, labels?: Partial<LogLabels>): void;
  warn(message: string, data?: Record<string, any>, labels?: Partial<LogLabels>): void;
  error(message: string, error?: Error | unknown, labels?: Partial<LogLabels>): void;
  critical(message: string, error?: Error | unknown, labels?: Partial<LogLabels>): void;

  // HTTP request logging
  httpRequest(message: string, request: HttpRequestMetadata, labels?: Partial<LogLabels>): void;

  // Cloud Functions lifecycle
  functionStart(functionName: string, labels?: Partial<LogLabels>): void;
  functionEnd(functionName: string, startTime: number, labels?: Partial<LogLabels>): void;

  // Vertex AI agents
  agentRequest(agentId: string, taskType: string, data?: Record<string, any>, labels?: Partial<LogLabels>): void;
  agentResponse(agentId: string, taskType: string, success: boolean, durationMs: number, labels?: Partial<LogLabels>): void;

  // Child logger
  child(additionalLabels: Partial<LogLabels>): Logger;
}
```

### 15.2 Usage Examples

```typescript
// Create logger
import { createLogger, logger } from './logger';

// Default logger
logger.info('Message');

// Custom logger
const myLogger = createLogger({ component: 'cloud-function', userId: 'user_123' });
myLogger.info('User action', { action: 'login' });

// Child logger
const requestLogger = myLogger.child({ requestId: 'req_abc' });
requestLogger.info('Request started');
requestLogger.info('Request completed', { durationMs: 450 });
```

---

**Document Status**: ACTIVE
**Next Review Date**: 2025-12-18 (30 days)
**Version**: 1.0.0
**Last Updated**: 2025-11-18
