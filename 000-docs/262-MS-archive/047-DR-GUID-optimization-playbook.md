# Database Optimization Playbook

**Date**: 2025-10-09
**Purpose**: Step-by-step guide for future database optimization
**Status**: Reference Document

---

## Overview

This playbook provides a systematic approach to database optimization for the Hustle MVP. Use this guide when performance issues arise or when monitoring indicates optimization is needed.

---

## When to Optimize

### 🟢 Current Status: NO OPTIMIZATION NEEDED

The Dashboard queries are already well-optimized with proper indexing. Do not apply optimizations prematurely.

### 🔴 Optimization Triggers

Apply optimizations when ANY of these conditions are met:

1. **Query Performance Degradation**
   - Dashboard page load exceeds 200ms consistently
   - Season query takes >100ms (P95 latency)
   - User complaints about slow loading

2. **Data Scale Thresholds**
   - Average games per user exceeds **500 games**
   - Maximum games per user exceeds **1000 games**
   - 10+ power users with >100 games each

3. **Production Monitoring Alerts**
   - APM alerts for slow queries
   - Database CPU usage >70%
   - Query queue buildup

---

## Monitoring Setup

### Monthly Monitoring Checklist

Run the monitoring script to check optimization thresholds:

```bash
# Connect to production database
psql $DATABASE_URL

# Run monitoring queries
\i 05-Scripts/monitor-optimization-thresholds.sql
```

**Review output for**:
- Average games per user (target: <500)
- Power user count (users with >100 games)
- Optimization status indicator (🟢/🟡/🔴)

### Application Performance Monitoring (APM)

**Recommended tools**:
- **Vercel Analytics** (if deployed on Vercel)
- **New Relic** (comprehensive APM)
- **Sentry Performance** (error tracking + performance)
- **Prisma Pulse** (real-time database monitoring)

**Key metrics to track**:
- P50, P95, P99 query latency
- Database connection pool utilization
- Slow query log (queries >100ms)

---

## Optimization Strategies

### Level 1: Index Optimization (First Resort)

**When to use**: Query performance issues, high read latency

#### Add `Game.date` Index

**Threshold**: Avg games/user >500 OR season query >100ms

**Steps**:
1. Test in staging environment first
2. Run EXPLAIN ANALYZE to verify current performance
3. Apply migration (see script below)
4. Re-run EXPLAIN ANALYZE to measure improvement
5. Monitor write performance impact

**Migration script**:
```bash
# Review the migration
cat 05-Scripts/future-optimization-date-index.sql

# Apply to production (with concurrent index creation)
psql $DATABASE_URL -f 05-Scripts/future-optimization-date-index.sql
```

**Prisma schema update**:
```prisma
model Game {
  // ... existing fields ...

  @@index([playerId])
  @@index([verified])
  @@index([date])  // 👈 Add this line
}
```

**Expected results**:
- Season query: 40-60ms → 10-20ms (70% faster)
- Write penalty: +2-5ms per game creation
- Storage overhead: ~50 bytes per game row

**Rollback**:
```sql
DROP INDEX CONCURRENTLY "Game_date_idx";
```

---

### Level 2: Query Optimization (Second Resort)

**When to use**: Level 1 didn't solve the problem, complex query patterns

#### Option A: Combined Aggregation Query

Replace separate COUNT queries with single aggregation:

```typescript
// Current (3 queries)
const totalGames = await prisma.game.count({
  where: { player: { parentId: session.user.id } }
});

const seasonGames = await prisma.game.count({
  where: {
    player: { parentId: session.user.id },
    date: { gte: start, lte: end }
  }
});

// Optimized (1 query)
const [stats] = await prisma.$queryRaw<any[]>`
  SELECT
    COUNT(*) as total_games,
    COUNT(CASE WHEN date >= ${start} AND date <= ${end} THEN 1 END) as season_games
  FROM "Game" g
  JOIN "Player" p ON g."playerId" = p.id
  WHERE p."parentId" = ${session.user.id}
`;

const totalGames = Number(stats.total_games);
const seasonGames = Number(stats.season_games);
```

**Pros**:
- Single database roundtrip (saves network overhead)
- Potentially 20-30% faster

**Cons**:
- Raw SQL (loses type safety)
- Harder to maintain
- Marginal performance gain (<10ms)

**Recommendation**: Only use if Level 1 optimization insufficient

---

### Level 3: Caching Strategy (Third Resort)

**When to use**: High read volume, frequent identical queries

#### Redis Caching for Dashboard Stats

**Threshold**: 10,000+ active users OR 100+ requests/second

**Implementation**:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getDashboardStats(userId: string) {
  const cacheKey = `dashboard:${userId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss: Query database
  const [totalGames, seasonGames, athletes] = await Promise.all([
    prisma.game.count({
      where: { player: { parentId: userId } }
    }),
    prisma.game.count({
      where: {
        player: { parentId: userId },
        date: { gte: start, lte: end }
      }
    }),
    prisma.player.findMany({
      where: { parentId: userId },
      select: { id: true, name: true, position: true }
    })
  ]);

  const stats = { totalGames, seasonGames, athletes };

  // Cache for 5 minutes
  await redis.set(cacheKey, JSON.stringify(stats), 'EX', 300);

  return stats;
}
```

**Cache invalidation**:
```typescript
// Invalidate cache when game is created/updated/deleted
await redis.del(`dashboard:${session.user.id}`);
```

**Pros**:
- 90%+ faster for cached requests
- Reduces database load significantly

**Cons**:
- Additional infrastructure (Redis)
- Cache invalidation complexity
- Stale data risk (5-minute TTL)

**Recommendation**: Only implement when traffic justifies infrastructure cost

---

### Level 4: Database Scaling (Last Resort)

**When to use**: All previous levels insufficient, database is bottleneck

#### Read Replicas

**Threshold**: Database CPU >80%, read-heavy workload

**Steps**:
1. Set up PostgreSQL read replica on GCP Cloud SQL
2. Route dashboard queries to read replica
3. Route writes to primary database

**Prisma configuration**:
```typescript
// lib/prisma.ts
export const prismaRead = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_READ_REPLICA_URL }
  }
});

export const prismaWrite = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
});
```

**Usage**:
```typescript
// Dashboard (read-only)
const totalGames = await prismaRead.game.count({ ... });

// Game creation (write)
await prismaWrite.game.create({ ... });
```

**Pros**:
- Scales read capacity horizontally
- Reduces load on primary database

**Cons**:
- Replication lag (1-5 seconds)
- Increased complexity
- Higher infrastructure cost

**Recommendation**: Only implement at 50,000+ active users

---

## Testing Methodology

### Before Optimization

1. **Establish baseline metrics**:
   ```sql
   EXPLAIN ANALYZE [your query here];
   ```
   Record:
   - Execution time
   - Rows scanned
   - Index usage
   - Memory usage

2. **Load testing**:
   ```bash
   # Use Apache Bench or k6 for load testing
   ab -n 1000 -c 10 https://your-app.com/dashboard
   ```

### After Optimization

1. **Verify improvement**:
   - Re-run EXPLAIN ANALYZE
   - Compare execution times
   - Check index usage changes

2. **Regression testing**:
   - Verify all Dashboard features still work
   - Check write performance hasn't degraded
   - Monitor error rates

3. **Production validation**:
   - Deploy to staging first
   - Monitor for 24 hours
   - Roll out to production with feature flag

---

## Rollback Procedures

### If Optimization Causes Issues

1. **Immediate rollback**:
   ```sql
   -- Remove problematic index
   DROP INDEX CONCURRENTLY "Game_date_idx";
   ```

2. **Revert code changes**:
   ```bash
   git revert [commit-hash]
   git push origin main
   ```

3. **Clear caches** (if using Redis):
   ```bash
   redis-cli FLUSHDB
   ```

4. **Monitor recovery**:
   - Check error rates return to normal
   - Verify query performance stabilizes
   - Review APM dashboards

---

## Decision Matrix

Use this flowchart to choose optimization strategy:

```
Is avg games/user > 500?
├─ NO → Do nothing, monitor monthly
└─ YES → Is query time > 100ms?
    ├─ NO → Do nothing, false alarm
    └─ YES → Apply Level 1 (Add date index)
        └─ Still slow?
            ├─ NO → Success, monitor
            └─ YES → Review query patterns
                ├─ High read volume? → Level 3 (Caching)
                ├─ Complex queries? → Level 2 (Query optimization)
                └─ Database bottleneck? → Level 4 (Scaling)
```

---

## Success Metrics

### Target Metrics Post-Optimization

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| Dashboard page load | 200ms | <100ms | APM |
| Query 1 (Total Games) | 40ms | <20ms | Prisma logs |
| Query 2 (Season Games) | 60ms | <25ms | Prisma logs |
| Query 3 (Athletes) | 10ms | <10ms | Prisma logs |
| Write performance | 15ms | <20ms | Prisma logs |

### Business Impact

- **User satisfaction**: Page feels instant (<100ms)
- **Scalability**: Can handle 10x user growth
- **Cost efficiency**: Lower database CPU usage
- **Developer velocity**: Faster dev environment

---

## Reference Scripts

All optimization scripts located in `05-Scripts/`:

1. **analyze-dashboard-queries.ts** - Performance testing script
2. **future-optimization-date-index.sql** - Date index migration
3. **future-optimization-date-index.prisma** - Prisma schema update
4. **monitor-optimization-thresholds.sql** - Monthly monitoring queries

---

## Historical Performance Data

Track optimization history in this section:

### 2025-10-09: Baseline (Task 45)
- **Total Games Query**: 8ms (projected, typical user)
- **Season Games Query**: 12ms (projected, typical user)
- **Athletes Query**: 4ms (projected, typical user)
- **Total**: 24ms (well under 200ms target)
- **Status**: ✅ No optimization needed

### [Future Date]: [Optimization Applied]
- **Before**: [metrics]
- **After**: [metrics]
- **Improvement**: [percentage]

---

## Contacts & Escalation

**Performance issues escalation**:
1. Check monitoring dashboards
2. Run diagnostic scripts
3. Review this playbook
4. Consult database team if issues persist

**Emergency contacts**:
- Database Admin: [Contact info]
- DevOps Lead: [Contact info]
- On-call Engineer: [PagerDuty/Oncall link]

---

## Changelog

| Date | Change | Reason | Result |
|------|--------|--------|--------|
| 2025-10-09 | Created playbook | Document optimization strategy | Reference guide |
| [Future] | [Change] | [Reason] | [Result] |

---

**Last Updated**: 2025-10-09
**Next Review**: Monthly (first Monday of each month)
**Owner**: Database Team
