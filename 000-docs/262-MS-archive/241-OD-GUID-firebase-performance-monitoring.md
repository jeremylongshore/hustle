# Firebase Performance Monitoring Guide

**Document ID**: 241-OD-GUID-firebase-performance-monitoring
**Status**: ACTIVE
**Created**: 2025-11-18
**Phase**: Phase 3 - Monitoring + Agent Deploy Automation (STEP 4)
**Owner**: Frontend/Full-Stack Engineers

---

## Purpose

This guide explains how to use Firebase Performance Monitoring to instrument the Hustle web application for performance tracking and optimization.

**Related Documents**:
- Observability Baseline: `000-docs/238-MON-SPEC-hustle-gcp-firebase-observability-baseline.md`
- Firebase Config: `src/lib/firebase/config.ts`
- Performance Utils: `src/lib/firebase/performance.ts`

---

## Overview

Firebase Performance Monitoring automatically collects:
- **Page load time** (FCP, LCP, TTI, FID, CLS)
- **Network requests** (HTTP response times, payload sizes)
- **User sessions** (engagement duration)

Custom traces allow you to measure:
- **Critical user flows** (login, player creation, game logging)
- **Complex operations** (stats calculation, data exports)
- **Component rendering** (React component mount times)

---

## Automatic Traces

Firebase Performance Monitoring automatically collects the following metrics **without any code changes**:

### Page Load Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **FCP** | First Contentful Paint | < 1.5s |
| **TTI** | Time to Interactive | < 3.5s |
| **LCP** | Largest Contentful Paint | < 2.5s |
| **FID** | First Input Delay | < 100ms |
| **CLS** | Cumulative Layout Shift | < 0.1 |

### Network Request Traces

- Automatically tracked for all `fetch()` and `XMLHttpRequest` calls
- Metrics collected:
  - Request duration
  - Response payload size
  - HTTP status code
  - Request method (GET, POST, PUT, DELETE)

---

## Custom Traces

### Basic Usage

```typescript
import { startTrace, stopTrace } from '@/lib/firebase/performance';

// Start trace
const trace = startTrace('my-operation');

// ... perform operation

// Stop trace
stopTrace(trace);
```

### Async Operations

Use `traceAsync()` for automatic trace management:

```typescript
import { traceAsync } from '@/lib/firebase/performance';

const playerData = await traceAsync('fetch-player-details', async () => {
  return await getPlayer(playerId);
});
```

### Synchronous Operations

Use `traceSync()` for sync operations:

```typescript
import { traceSync } from '@/lib/firebase/performance';

const stats = traceSync('calculate-stats', () => {
  return computeStatistics(data);
});
```

---

## Adding Trace Attributes

Attributes provide context for traces (e.g., user ID, player ID):

```typescript
import {
  startTrace,
  stopTrace,
  addTraceAttribute,
} from '@/lib/firebase/performance';

const trace = startTrace('create-player');
addTraceAttribute(trace, 'userId', userId);
addTraceAttribute(trace, 'position', playerPosition);

// ... create player logic

stopTrace(trace);
```

**With `traceAsync()`:**

```typescript
const result = await traceAsync(
  'create-player',
  async () => {
    return await createPlayer(playerData);
  },
  {
    userId,
    position: playerData.position,
  }
);
```

---

## Adding Trace Metrics

Metrics provide quantitative data (e.g., record count, bytes processed):

```typescript
import {
  startTrace,
  stopTrace,
  addTraceMetric,
  incrementTraceMetric,
} from '@/lib/firebase/performance';

const trace = startTrace('batch-import');

let recordsProcessed = 0;
let errors = 0;

for (const record of records) {
  try {
    await processRecord(record);
    recordsProcessed++;
    incrementTraceMetric(trace, 'successCount');
  } catch (error) {
    errors++;
    incrementTraceMetric(trace, 'errorCount');
  }
}

addTraceMetric(trace, 'totalRecords', records.length);
stopTrace(trace);
```

---

## Pre-Defined Trace Names

Use constants from `TRACE_NAMES` for consistency:

```typescript
import { traceAsync, TRACE_NAMES } from '@/lib/firebase/performance';

// User authentication
await traceAsync(TRACE_NAMES.USER_LOGIN, async () => {
  return await signIn(email, password);
});

// Player management
await traceAsync(TRACE_NAMES.CREATE_PLAYER, async () => {
  return await createPlayer(playerData);
});

// Game logging
await traceAsync(TRACE_NAMES.CREATE_GAME, async () => {
  return await createGame(gameData);
});
```

**Available trace names**:
- **Authentication**: `USER_LOGIN`, `USER_REGISTER`, `USER_LOGOUT`, `EMAIL_VERIFICATION`, `PASSWORD_RESET`
- **Player Management**: `CREATE_PLAYER`, `UPDATE_PLAYER`, `DELETE_PLAYER`, `FETCH_PLAYER_LIST`, `FETCH_PLAYER_DETAILS`
- **Game Logging**: `CREATE_GAME`, `UPDATE_GAME`, `DELETE_GAME`, `FETCH_GAMES`, `VERIFY_GAME`
- **Statistics**: `CALCULATE_PLAYER_STATS`, `CALCULATE_TEAM_STATS`, `GENERATE_REPORT`
- **Dashboard**: `LOAD_DASHBOARD`, `LOAD_ATHLETE_DETAIL`
- **API**: `API_PLAYERS`, `API_GAMES`, `API_STATS`

---

## React Component Tracing

Measure React component rendering time:

```typescript
import { useEffect } from 'react';
import { traceComponent } from '@/lib/firebase/performance';

export function PlayerDashboard() {
  useEffect(() => {
    // Start trace on component mount, stop on unmount
    return traceComponent('PlayerDashboard');
  }, []);

  return <div>Dashboard content...</div>;
}
```

---

## Performance Budgets

Performance budgets are defined in `PERFORMANCE_BUDGETS` constant:

```typescript
import {
  checkPerformanceBudget,
  PERFORMANCE_BUDGETS,
} from '@/lib/firebase/performance';

// Check if operation exceeded budget
const duration = Date.now() - startTime;
const exceeds = checkPerformanceBudget('API_RESPONSE_TIME', duration);

if (exceeds) {
  console.warn('API response time exceeded budget');
}
```

**Defined budgets**:
- `FIRST_CONTENTFUL_PAINT`: 1500ms
- `TIME_TO_INTERACTIVE`: 3500ms
- `LARGEST_CONTENTFUL_PAINT`: 2500ms
- `FIRST_INPUT_DELAY`: 100ms
- `CUMULATIVE_LAYOUT_SHIFT`: 0.1
- `API_RESPONSE_TIME`: 2000ms

---

## Examples by Use Case

### Example 1: User Login Flow

```typescript
import { traceAsync, TRACE_NAMES } from '@/lib/firebase/performance';

async function handleLogin(email: string, password: string) {
  const user = await traceAsync(
    TRACE_NAMES.USER_LOGIN,
    async () => {
      return await signInWithEmailAndPassword(auth, email, password);
    },
    { email }
  );

  return user;
}
```

### Example 2: Player Stats Calculation

```typescript
import {
  startTrace,
  stopTrace,
  addTraceAttribute,
  addTraceMetric,
  TRACE_NAMES,
} from '@/lib/firebase/performance';

async function calculatePlayerStats(playerId: string) {
  const trace = startTrace(TRACE_NAMES.CALCULATE_PLAYER_STATS);
  addTraceAttribute(trace, 'playerId', playerId);

  try {
    const games = await getGames(playerId);
    addTraceMetric(trace, 'gamesAnalyzed', games.length);

    const stats = computeStatistics(games);
    stopTrace(trace);

    return stats;
  } catch (error) {
    addTraceAttribute(trace, 'error', 'true');
    stopTrace(trace);
    throw error;
  }
}
```

### Example 3: API Route Handler

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { traceAsync, TRACE_NAMES } from '@/lib/firebase/performance';

export async function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get('playerId');

  const data = await traceAsync(
    TRACE_NAMES.API_PLAYERS,
    async () => {
      return await fetchPlayerData(playerId);
    },
    { playerId: playerId || 'unknown' }
  );

  return NextResponse.json(data);
}
```

### Example 4: Batch Operation with Metrics

```typescript
import {
  startTrace,
  stopTrace,
  incrementTraceMetric,
  addTraceMetric,
} from '@/lib/firebase/performance';

async function importPlayers(players: Player[]) {
  const trace = startTrace('batch-player-import');
  addTraceMetric(trace, 'totalPlayers', players.length);

  for (const player of players) {
    try {
      await createPlayer(player);
      incrementTraceMetric(trace, 'successCount');
    } catch (error) {
      incrementTraceMetric(trace, 'errorCount');
      console.error('Failed to import player:', player.name, error);
    }
  }

  stopTrace(trace);
}
```

---

## Viewing Performance Data

### Firebase Console

1. Navigate to **Firebase Console** → **Performance**
2. View automatic traces:
   - **Page load**: FCP, LCP, TTI, FID, CLS by page
   - **Network requests**: Response times, payload sizes, error rates
3. View custom traces:
   - **Dashboard**: List of all custom traces with aggregated metrics
   - **Detail view**: P50, P90, P95, P99 percentiles, attribute filters

### Cloud Monitoring

Custom traces are also available in Cloud Monitoring:

```bash
# Query custom traces
gcloud monitoring time-series list \
  --filter='metric.type="firebaseperf.googleapis.com/custom_trace/duration"'

# Create alert on slow trace
gcloud alpha monitoring policies create \
  --display-name="Slow Player Stats Calculation" \
  --condition-display-name="Stats Calculation > 5s" \
  --condition-threshold-value=5000 \
  --condition-filter='metric.type="firebaseperf.googleapis.com/custom_trace/duration" AND metric.labels.trace_name="calculate-player-stats"' \
  --condition-aggregation-per-series-aligner=ALIGN_PERCENTILE_95
```

---

## Performance Optimization Workflow

### 1. Identify Slow Operations

**Firebase Console** → **Performance** → **Custom traces**:
- Sort by **P95 duration** (descending)
- Look for traces > 2 seconds

### 2. Analyze Attributes

Click on slow trace → **Attributes** tab:
- Group by `userId` - Is it user-specific?
- Group by `position` - Is it position-specific?
- Group by `error` - Are errors contributing?

### 3. Drill Down with Metrics

Review custom metrics:
- `recordsProcessed` - How much data?
- `errorCount` - How many failures?
- `cacheHitRate` - Cache effectiveness?

### 4. Optimize and Re-Measure

Make code changes, deploy, and compare:
- **Before**: P95 = 3500ms
- **After**: P95 = 1200ms
- **Improvement**: 66% faster

### 5. Set Alerts

Create alerts for performance regressions:

```typescript
import { checkPerformanceBudget } from '@/lib/firebase/performance';

const duration = Date.now() - startTime;
const exceeds = checkPerformanceBudget('API_RESPONSE_TIME', duration);

if (exceeds) {
  // Log warning, trigger alert, etc.
  console.warn('Performance regression detected');
}
```

---

## Best Practices

### DO:
- ✅ Use pre-defined `TRACE_NAMES` constants
- ✅ Add attributes for context (userId, playerId, etc.)
- ✅ Add metrics for quantitative data (recordCount, byteSize)
- ✅ Use `traceAsync()` for async operations (automatic cleanup)
- ✅ Trace critical user flows (login, player creation, game logging)
- ✅ Set performance budgets and check violations

### DON'T:
- ❌ Create too many traces (stick to critical flows)
- ❌ Add PII as attributes (no emails, passwords, tokens)
- ❌ Forget to stop traces (causes memory leaks)
- ❌ Trace every function (adds overhead)
- ❌ Use dynamic trace names (hard to aggregate)

---

## Troubleshooting

### Issue: Traces not appearing in Firebase Console

**Check**:
1. Firebase Performance Monitoring enabled in Firebase Console
2. `performance` initialized in `src/lib/firebase/config.ts`
3. Trace started and stopped correctly
4. Data may take 1-2 hours to appear initially

### Issue: High trace overhead

**Solution**:
- Limit traces to critical paths (< 50 unique trace names)
- Avoid tracing in tight loops
- Use conditional tracing (e.g., sample 10% of requests)

### Issue: Missing attributes/metrics

**Check**:
- Attributes must be strings (use `String(value)` if needed)
- Metrics must be numbers
- Trace must be started before adding attributes/metrics

---

## References

### Internal Documentation
- Observability Baseline: `000-docs/238-MON-SPEC-hustle-gcp-firebase-observability-baseline.md`
- Logging Standard: `000-docs/239-OD-GUID-logging-standard.md`
- GCP Monitoring Setup: `000-docs/240-OD-RUNB-gcp-monitoring-setup.md`

### Firebase Documentation
- Firebase Performance Monitoring: https://firebase.google.com/docs/perf-mon
- Custom Traces: https://firebase.google.com/docs/perf-mon/custom-code-traces
- Performance Metrics: https://firebase.google.com/docs/perf-mon/get-started-web

### Web Performance
- Web Vitals: https://web.dev/vitals/
- Lighthouse: https://developers.google.com/web/tools/lighthouse

---

**Document Status**: ACTIVE
**Last Updated**: 2025-11-18
**Version**: 1.0.0
**Next Review**: 2025-12-18
