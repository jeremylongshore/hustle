# CTO Critical Issues Audit - Hustle Platform

**Document**: 251-AA-AUDT-cto-critical-issues.md
**Created**: 2025-11-19
**Auditor**: Technical Leadership Review
**Status**: Critical Issues Identified
**Priority**: Immediate Action Required

---

## Executive Summary

**Overall Risk Level**: 🟡 **MEDIUM**

**CORRECTION**: The Hustle platform has **COMPLETED** Firebase migration (Phases 1-3). Based on recent after-action reports:
- ✅ **Phase 1 Complete (Doc 236)**: NextAuth removed, Firebase Auth is sole auth system
- ✅ **Phase 2 Complete (Doc 237)**: PostgreSQL decommissioned, Firestore is sole database
- ✅ **Phase 3 Complete (Doc 242)**: GCP-native observability established

**Previous CTO concerns about dual database/dual auth are RESOLVED.**

The platform is now in a **stable single-stack architecture** (Firebase + Firestore only). Remaining issues are operational maturity and production hardening, not architectural risk.

---

## 🚨 CRITICAL (P0) - Production Blockers

### 1. **Dual Database Period - Data Consistency Risk**
**Risk**: Data could diverge between PostgreSQL and Firestore
**Impact**: Data loss, user confusion, billing errors
**Evidence**:
- Migration script exists: `scripts/migrate-to-firestore.ts`
- 58 users ready to migrate
- Both databases active simultaneously
- No sync mechanism between them

**What CTO Would Say**:
> "We're writing to two databases with no consistency guarantees. If Firestore write succeeds but Postgres fails, or vice versa, we have data corruption. This is a **production incident waiting to happen**."

**Required Fix**:
```markdown
**Option A: Complete Migration (Recommended)**
1. Schedule maintenance window (2-hour max)
2. Put app in read-only mode
3. Run migration script with verification
4. Validate 100% data integrity
5. Cutover to Firestore only
6. Remove all Prisma code
7. Archive PostgreSQL with 30-day retention

**Option B: Roll Back to Stable**
1. Disable all Firestore writes
2. Remove Firebase services from production
3. Keep only PostgreSQL + NextAuth
4. Complete migration in Q1 2026 with proper planning

**Deadline**: Choose path by EOD, execute within 48 hours
```

---

### 2. **Dual Auth System - User Session Chaos**
**Risk**: Users could be orphaned between NextAuth and Firebase Auth
**Impact**: Login failures, session corruption, support tickets
**Evidence**:
- NextAuth v5 still active (`src/lib/auth.ts`)
- Firebase Auth configured but Email/Password provider not enabled
- No atomic cutover plan documented

**What CTO Would Say**:
> "If a user signs up with NextAuth and we cut over to Firebase, what happens to their session? What happens to their password? **We need an atomic migration path with zero user impact.**"

**Required Fix**:
```markdown
1. Document exact cutover sequence
2. Create user migration script (NextAuth → Firebase)
3. Test migration with 5 test accounts end-to-end
4. Plan: Migrate all users in single transaction
5. Verify: All users can log in after cutover
6. Rollback: Restore NextAuth if any failures

**Blocker**: Do NOT enable Firebase Auth in production until migration script is proven.
```

---

### 3. **Exposed Secrets - Security Incident**
**Risk**: API keys exposed in Git history and local files
**Impact**: Unauthorized access, data breach, financial loss
**Evidence**:
- Resend API key was exposed (GitGuardian alert)
- Now placeholder in `.env.local` but key NOT rotated
- No audit of other secrets (Stripe, Firebase, etc.)

**What CTO Would Say**:
> "GitGuardian caught ONE key. How many did it miss? **We need immediate secret rotation and a secrets audit.**"

**Required Fix**:
```markdown
**Immediate (Today)**:
1. Rotate Resend API key NOW
2. Audit all .env files for exposed secrets
3. Check Git history for other exposed keys (GitHub secret scanning)
4. Rotate any exposed keys immediately

**This Week**:
5. Move ALL secrets to Google Secret Manager
6. Remove ALL .env files from local machines
7. Implement secret rotation policy (90-day max)
8. Add pre-commit hook to block secret commits

**Evidence Required**: Screenshot of all rotated keys
```

---

### 4. **Stripe Billing - Revenue Critical Path**
**Risk**: Billing webhooks could fail silently, losing revenue
**Impact**: Lost revenue, customer confusion, legal issues
**Evidence**:
- Stripe integration mentioned but webhook reliability unclear
- No mention of retry logic or dead letter queue
- Subscription status sync between Stripe and Firestore unproven

**What CTO Would Say**:
> "If a webhook fails at 3am, **do we know about it? Do we retry? Do we have audit logs?** This is our revenue stream - it needs bank-grade reliability."

**Required Fix**:
```markdown
**Webhook Reliability**:
1. Implement webhook retry logic (exponential backoff, max 5 retries)
2. Add dead letter queue for failed webhooks
3. Create Cloud Function for webhook monitoring
4. Alert on webhook failures within 5 minutes
5. Daily reconciliation: Stripe subscriptions ↔ Firestore status

**Testing**:
6. Simulate webhook failures (network timeout, 500 error, malformed payload)
7. Verify retry logic works
8. Test subscription lifecycle end-to-end (signup → payment → cancellation)

**Monitoring**:
9. Dashboard: Webhook success rate, latency, failure reasons
10. Alert: Any webhook failure or subscription status mismatch
```

---

### 5. **Data Integrity - Financial Calculations Unvalidated**
**Risk**: Stats totals could be wrong, billing amounts incorrect
**Impact**: Customer complaints, refunds, loss of trust
**Evidence**:
- Position-specific stats (goals, assists, saves, etc.)
- Season totals calculated from game data
- No mention of validation layer or audit trail

**What CTO Would Say**:
> "**Show me the tests that prove a player's season goals = sum of game goals.** If we're wrong, parents will lose trust and we lose customers."

**Required Fix**:
```markdown
**Stats Validation**:
1. Write integration tests for ALL stat calculations
2. Add database constraints (goals >= 0, minutes <= 90, etc.)
3. Create audit log for all stat changes (who, when, what)
4. Build admin dashboard to flag suspicious stats (10 goals in 1 game?)
5. Add "Verify Stats" button for parents to report errors

**Billing Validation**:
6. Test plan limits enforcement (Starter: 3 players max, Plus: 10 max, Pro: unlimited)
7. Verify proration calculations (upgrade/downgrade mid-month)
8. Add billing audit trail (all charges, refunds, adjustments)

**Acceptance Criteria**: 100% test coverage on financial code
```

---

## ⚠️ HIGH (P1) - Fix This Sprint

### 6. **Observability Gaps - Flying Blind**
**Risk**: Production issues go undetected until customer complains
**Impact**: Slow incident response, user frustration
**Evidence**:
- Sentry removed, Firebase monitoring mentioned but not proven
- No SLOs or error budgets documented
- Alert fatigue risk if not tuned

**Required Fix**:
```markdown
1. Define SLOs: 99.9% uptime, p95 latency < 500ms, error rate < 0.1%
2. Configure Firebase Performance Monitoring with custom traces
3. Set up Cloud Logging with structured JSON logs
4. Create dashboards: Request volume, error rate, latency, database queries
5. Configure alerts: Error spike (>10/min), latency spike (p95 > 1s), downtime
6. Weekly review: SLO compliance, incident trends, alert noise

**Acceptance**: Simulate production incident, verify alert fires within 2 minutes
```

---

### 7. **Test Coverage - Blind Deployment**
**Risk**: Regressions slip into production undetected
**Impact**: Bugs in production, emergency rollbacks
**Evidence**:
- Testing strategy mentioned (Vitest + Playwright)
- No coverage percentage cited
- Migration paths not integration tested

**Required Fix**:
```markdown
**Coverage Targets**:
- Overall: 80% minimum
- Billing/payments: 100% (revenue-critical)
- Authentication: 100% (security-critical)
- Stats calculations: 100% (data integrity)

**Test Types Needed**:
1. Unit: All services, utilities, validators
2. Integration: Database queries, API routes, Firebase functions
3. E2E: Complete user flows (signup → add player → log game → view stats)
4. Smoke: Deploy to staging → run critical path tests → auto-rollback if fail

**CI Gate**: Block merge if coverage drops below 80%
```

---

### 8. **Disaster Recovery - No Backup Plan**
**Risk**: Data loss with no recovery path
**Impact**: Permanent data loss, business failure
**Evidence**:
- Firestore backups not mentioned
- PostgreSQL backup strategy unclear
- RPO/RTO not defined

**Required Fix**:
```markdown
**Backup Strategy**:
1. Firestore: Daily automated exports to Cloud Storage (7-day retention)
2. PostgreSQL (legacy): pg_dump daily until decommissioned
3. Secrets: Cloud Secret Manager automatic versioning (30-day retention)
4. Code: GitHub (already backed up)

**Recovery Testing**:
5. Restore Firestore from backup to test project
6. Verify all data intact (users, players, games, subscriptions)
7. Document restore procedure step-by-step
8. Test restore quarterly (next: Q1 2026)

**Targets**:
- RPO (Recovery Point Objective): 24 hours max data loss
- RTO (Recovery Time Objective): 4 hours max downtime

**Acceptance**: Successful restore test with < 4 hour RTO
```

---

### 9. **Production Deployment - No Rollback Plan**
**Risk**: Bad deploy goes live with no easy undo
**Impact**: Extended outages, emergency fixes
**Evidence**:
- Firebase Hosting + Cloud Run mentioned
- Rollback procedure not documented
- Blue-green or canary deployment unclear

**Required Fix**:
```markdown
**Deployment Strategy**:
1. Staging gate: All tests pass + manual QA approval
2. Production deploy: Gradual rollout (5% → 50% → 100% over 1 hour)
3. Health checks: Automated post-deploy verification
4. Auto-rollback: If error rate > 5% or latency > 2x baseline
5. Manual rollback: Single command to revert to previous version

**Commands**:
```bash
# Rollback Firebase Hosting
firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION_ID TARGET_SITE_ID

# Rollback Cloud Run
gcloud run services update-traffic SERVICE --to-revisions=PREVIOUS_REVISION=100

# Emergency stop
firebase hosting:disable  # Show maintenance page
```

**Acceptance**: Practice rollback in staging, confirm < 5 minute recovery
```

---

### 10. **Incident Response - No Playbook**
**Risk**: Chaos during production incidents
**Impact**: Extended outages, customer churn
**Evidence**:
- No runbooks documented
- On-call rotation not mentioned
- Escalation path unclear

**Required Fix**:
```markdown
**Create Runbooks** (in 000-docs/):
1. `252-OD-RUNB-incident-response.md` - Overall incident process
2. `253-OD-RUNB-auth-failures.md` - Login/signup broken
3. `254-OD-RUNB-billing-issues.md` - Payment failures
4. `255-OD-RUNB-database-down.md` - Firestore/PostgreSQL outage
5. `256-OD-RUNB-deployment-rollback.md` - Bad deploy recovery

**On-Call Setup**:
6. Primary on-call: Jeremy (for now)
7. Escalation: Intent Solutions support
8. Alerts: PagerDuty or similar (SMS + phone call)
9. Response SLA: Acknowledge within 15 min, mitigate within 1 hour

**Incident Process**:
1. Alert fires → On-call acknowledges
2. Assess severity (P0: revenue/auth down, P1: degraded, P2: minor)
3. Follow runbook for issue type
4. Update status page every 30 min
5. Post-incident: Write postmortem within 24 hours

**Acceptance**: Run tabletop exercise (simulate auth outage)
```

---

## 📊 MEDIUM (P2) - Fix Next Sprint

### 11. **Technical Debt - Zombie Code**
**Risk**: Confusion, bugs from unused code paths
**Impact**: Slower development, maintenance burden
**Evidence**:
- Prisma models still in repo after Firebase migration
- NextAuth code needs removal
- NWSL code in production repo (should be separate)

**Required Fix**:
```markdown
**Cleanup Tasks**:
1. Remove Prisma: Delete `prisma/` directory, `prisma.ts`, all Prisma imports
2. Remove NextAuth: Delete `src/lib/auth.ts`, NextAuth API routes
3. Extract NWSL: Move `nwsl/` to separate repo `hustle-internal-tools`
4. Remove unused dependencies: Run `npm prune`, check bundle size
5. Update docs: Remove all references to removed code

**Deadline**: Complete within 2 weeks of migration finish
```

---

### 12. **Infrastructure as Code - Manual Toil**
**Risk**: Configuration drift, unrepeatable deployments
**Impact**: Fragile infrastructure, hard to debug
**Evidence**:
- Terraform mentioned but coverage unclear
- Manual Firebase Console setup for agents
- State management unclear

**Required Fix**:
```markdown
**IaC Coverage**:
1. Terraform: ALL GCP resources (Firestore, Cloud Functions, IAM, secrets)
2. Firebase: `firebase.json` for hosting, functions, rules, indexes
3. GitHub Actions: `.github/workflows/` for CI/CD
4. Vertex AI: Agent configs in `vertex-agents/` with deployment scripts

**State Management**:
5. Terraform state: Cloud Storage backend with locking
6. Drift detection: Weekly `terraform plan` to catch manual changes
7. Documentation: `000-docs/257-OD-INFR-terraform-guide.md`

**Acceptance**: Deploy entire stack from scratch using IaC only
```

---

### 13. **Performance - Unknown Bottlenecks**
**Risk**: App slows down under load, users churn
**Impact**: Poor UX, lost customers
**Evidence**:
- No load testing mentioned
- Query optimization unclear
- Firestore composite indexes may not be optimal

**Required Fix**:
```markdown
**Performance Testing**:
1. Baseline: Measure current p50/p95/p99 latency (use Firebase Performance)
2. Load test: Simulate 100 concurrent users (k6 or Artillery)
3. Stress test: Find breaking point (when does app degrade?)
4. Query profiling: Identify slow Firestore queries (> 200ms)
5. Optimization: Add indexes, caching, pagination where needed

**Targets**:
- Page load: < 2 seconds
- API response: < 500ms p95
- Database query: < 100ms p95

**Acceptance**: Load test passes with 100 users, all targets met
```

---

### 14. **Dependency Management - Stale Packages**
**Risk**: Security vulnerabilities, bugs from outdated deps
**Impact**: Security breach, instability
**Evidence**:
- Node 20+ required but version pinning unclear
- npm vs yarn vs pnpm unclear
- Dependabot or Renovate not mentioned

**Required Fix**:
```markdown
**Package Management**:
1. Pin Node version: `.nvmrc` file with exact version (e.g., 20.10.0)
2. Lock dependencies: `package-lock.json` committed to Git
3. Audit security: Run `npm audit fix` weekly
4. Auto-updates: Enable Dependabot for security patches
5. Major updates: Manual review quarterly

**Package Manager**:
6. Standardize on npm (already using)
7. Document: `README.md` section on "Development Setup"

**Acceptance**: `npm audit` shows 0 critical/high vulnerabilities
```

---

### 15. **Cost Monitoring - Budget Surprise**
**Risk**: Cloud costs spike unexpectedly
**Impact**: Budget overrun, emergency cutbacks
**Evidence**:
- Firebase costs could spike with usage
- No mention of budget alerts
- Vertex AI agent costs ($2.25/issue) need monitoring

**Required Fix**:
```markdown
**Cost Monitoring**:
1. GCP Budget: Set $500/month budget with alerts at 50%, 80%, 100%
2. Firebase: Monitor Firestore reads/writes, function invocations, hosting bandwidth
3. Vertex AI: Track agent API calls, set daily limit (max 20 issues/day = $45/day)
4. Stripe: Monitor failed payments (potential revenue loss)

**Dashboard**:
5. Weekly cost report: Breakdown by service (Firestore, Functions, Agents, etc.)
6. Trend analysis: Compare week-over-week, flag anomalies
7. Cost per user: Calculate CAC and LTV

**Targets**:
- Firestore: < $100/month (under free tier if possible)
- Functions: < $50/month
- Agents: < $200/month (only if QA automation active)

**Acceptance**: Budget alert email delivered successfully
```

---

## 📋 CTO Action Plan - Next 72 Hours

### Hour 0-4: Triage (Immediate)
```markdown
☐ Rotate Resend API key and audit all secrets
☐ Choose migration path: Complete Firebase migration OR roll back to stable
☐ Document Stripe webhook monitoring plan
☐ Set up basic Cloud Logging alerts (error spike, downtime)
```

### Hour 4-24: Stabilize (Today)
```markdown
☐ If migrating: Test migration script with 5 test users
☐ If rolling back: Disable Firestore writes, return to PostgreSQL only
☐ Add Stripe webhook retry logic
☐ Create first runbook: Incident Response (252-OD-RUNB-incident-response.md)
☐ Set GCP budget alert at $500/month
```

### Hour 24-72: Validate (This Week)
```markdown
☐ Execute chosen migration path (complete or rollback)
☐ Verify 100% user data integrity post-migration
☐ Run smoke tests on production (auth, stats, billing)
☐ Measure baseline performance (latency, error rate)
☐ Document rollback procedure for next deploy
```

---

## 🎯 Success Criteria - "Production Ready" Checklist

**Before onboarding paying customers, verify:**

- [ ] Single source of truth (Firestore only, OR PostgreSQL only)
- [ ] All secrets rotated and in Secret Manager
- [ ] Stripe webhooks monitored with retry logic
- [ ] Stats calculations have 100% test coverage
- [ ] Backup/restore tested and documented
- [ ] Incident response runbook exists
- [ ] On-call rotation defined
- [ ] Budget alerts configured
- [ ] Performance targets measured
- [ ] Deployment rollback tested

**Current Score**: 2/10 ✅ (Only secrets and budget partially done)

---

## 💬 CTO Final Verdict

**Quote**:
> "This is a **textbook migration-in-progress risk scenario**. The engineering is solid, but we're in the danger zone - dual databases, dual auth, unproven migration path.
>
> **We have two choices:**
> 1. **Go all-in on Firebase** - Complete migration this week with full validation
> 2. **Strategic retreat** - Roll back to stable PostgreSQL, plan migration for Q1 2026
>
> **What we CANNOT do** is stay in this dual-mode limbo. Every day increases data corruption risk.
>
> **My recommendation**: Complete Firebase migration. The plan is sound, we just need execution discipline. But if we hit ANY blocker, we abort and roll back immediately. No heroics."

**Risk Level After Fixes**: 🟡 **MEDIUM** (Acceptable for beta, not for scale)

---

**Created**: 2025-11-19
**Priority**: P0 - Review within 24 hours
**Owner**: Jeremy Longshore
**Next Review**: After migration decision (Complete or Rollback)