# Phase 7 Task 6: Billing Canonical Docs & Safety Guardrails - Mini AAR

**Status**: ✅ Complete
**Date**: 2025-11-17
**Task**: Document billing system + add operational safety guardrails
**Related**: [6767-REF-hustle-billing-and-workspaces-canonical.md](./6767-REF-hustle-billing-and-workspaces-canonical.md), [227-RB-SRVC-hustle-billing-support-runbook.md](./227-RB-SRVC-hustle-billing-support-runbook.md)

---

## 1. What We Built

### Documentation (2 files)

**Canonical Reference (6767)**
- Authoritative source of truth for billing + workspace system
- Complete Firestore schema documentation
- Plan tiers with correct limits: Free (2/10), Starter (5/50), Plus (15/200), Pro (9999/9999)
- Workspace status lifecycle: trial → active → past_due → canceled → suspended → deleted
- Stripe webhook integration mapping
- Hard vs soft enforcement patterns
- User-workspace relationships
- Operational procedures
- Environment configuration guide
- **350+ lines** of comprehensive technical documentation

**Support Runbook (227)**
- Practical operator guide for non-technical support staff
- 4 detailed resolution scenarios:
  1. Customer can't add more players (plan limit reached)
  2. Customer card failed and lost access (payment_failed webhook)
  3. Plan not syncing after upgrade (Stripe vs Firestore discrepancy)
  4. Customer wants refund or credit (admin intervention)
- Tools & access guide (Stripe Dashboard, Firestore Console, Cloud Run logs)
- Customer support scripts (exact phrases to use)
- Do's and Don'ts for support staff
- Escalation guidelines
- **350+ lines** of operational procedures

### Safety Guardrails (3 implementations)

**1. BILLING_ENABLED Feature Switch**
- Added environment-based kill switch for Stripe operations
- Affects: `/api/billing/portal`, `/api/billing/create-checkout-session`, `/api/billing/invoices`
- Returns: 503 status with BILLING_DISABLED error when disabled
- **Scope**: Only Stripe operations - plan limits and enforcement still work
- **Use cases**: Maintenance, Stripe API outages, testing, demo mode
- **Default**: Enabled (only `"false"` disables)

**2. CI Deployment Sanity Check**
- Added pre-deployment validation in `.github/workflows/deploy.yml`
- Checks: If BILLING_ENABLED=true, validates all 5 required Stripe env vars present
- Required vars:
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
  - STRIPE_PRICE_ID_STARTER
  - STRIPE_PRICE_ID_PLUS
  - STRIPE_PRICE_ID_PRO
- **Prevents**: Production deploys with missing billing config
- **Exit code 1**: Deployment fails with clear error message if vars missing

**3. Comprehensive Test Coverage**
- Created `src/lib/billing/feature-switch.test.ts` with 9 unit tests
- Covers:
  - Environment variable handling (undefined, "true", "false", "", "1", "0")
  - API response patterns (503 status, error format)
  - Feature switch scope (documents that plan limits unaffected)
- **All tests passing**

---

## 2. Critical Discovery: Plan Limits Discrepancy

### The Problem
While creating the canonical reference doc, discovered that Phase 7 Task 5's `plan-limits.ts` had **incorrect plan definitions**.

**Used (WRONG)**:
```typescript
free: { players: 1, gamesPerMonth: 5 }
starter: { players: 3, gamesPerMonth: 20 }
pro: { players: 10, gamesPerMonth: 200 }
elite: { players: Infinity, gamesPerMonth: Infinity }
```

**Actual System (CORRECT)**:
```typescript
free: { players: 2, gamesPerMonth: 10 }
starter: { players: 5, gamesPerMonth: 50 }
plus: { players: 15, gamesPerMonth: 200 }
pro: { players: 9999, gamesPerMonth: 9999 }
```

### Issues
1. All limits were **undervalued** (1→2, 5→10, 3→5, 20→50)
2. **Plus tier was completely missing** (15/200 limits)
3. **Elite tier doesn't exist** in actual system
4. Used `Infinity` instead of high finite number (9999)

### The Fix
1. Updated `PLAN_LIMITS` constant in `src/lib/billing/plan-limits.ts`
2. Rewrote all 31 test cases in `plan-limits.test.ts` to match corrected limits
3. Changed test scenarios (e.g., free plan tests from 1/5 to 2/10)
4. Verified: **All 31 tests passing after corrections**

### Impact
- **Task 5 functionality**: Still worked correctly (logic was sound, just wrong constants)
- **User experience**: Would have shown incorrect limits in UI before fix
- **Testing**: Tests were passing but validating wrong behavior
- **Documentation**: Would have perpetuated incorrect limits if not caught

### Lesson
Always validate constants against canonical sources when documenting. The act of creating comprehensive documentation **revealed** the discrepancy.

---

## 3. How BILLING_ENABLED Works

### Implementation Pattern

**Check Location**: Top of POST/GET handlers, before any processing

```typescript
// 0. Check billing feature switch (Phase 7 Task 6)
const billingEnabled = process.env.BILLING_ENABLED !== 'false';

if (!billingEnabled) {
  return NextResponse.json(
    {
      error: 'BILLING_DISABLED',
      message: 'Billing is temporarily disabled. Please try again later.',
    },
    { status: 503 }
  );
}
```

### Behavior

| BILLING_ENABLED Value | Result |
|-----------------------|--------|
| `undefined` (not set) | ✅ Enabled |
| `"true"` | ✅ Enabled |
| `""` (empty string) | ✅ Enabled |
| `"1"` | ✅ Enabled |
| `"0"` | ✅ Enabled |
| `"false"` | ❌ Disabled (503 response) |

**Rationale**: Only explicit `"false"` disables. Default is enabled to prevent accidental downtime.

### Scope Boundaries

**Affected** (returns 503 when disabled):
- POST `/api/billing/portal` - Stripe Customer Portal access
- POST `/api/billing/create-checkout-session` - New subscription checkout
- GET `/api/billing/invoices` - Invoice history retrieval

**NOT Affected** (always works):
- Plan limit enforcement (403 errors for exceeded limits)
- Workspace status checks (suspended/canceled enforcement)
- User authentication
- Dashboard access
- Player/game CRUD operations

**Critical**: Plan limits MUST continue working when billing is disabled. This ensures users can still use the app within their plan, just can't upgrade/manage billing.

### Use Cases

1. **Stripe API Outage**: Disable billing to prevent errors while Stripe is down
2. **Maintenance**: Disable during Stripe webhook configuration changes
3. **Testing**: Test app behavior without triggering real Stripe operations
4. **Demo Mode**: Show app features without billing integration
5. **Development**: Local dev without Stripe API keys

---

## 4. CI Sanity Check Details

### What It Guards Against

**Scenario**: Developer enables billing (`BILLING_ENABLED=true`) but forgets to set Stripe secrets.

**Without Check**:
- Deployment succeeds ✅
- App starts ✅
- User tries to upgrade plan ❌
- Stripe API call fails with "No API key provided" ❌
- Production incident 🚨

**With Check**:
- Deployment **fails at CI stage** ❌
- Clear error message shows missing vars
- Developer fixes secrets **before** production deploy
- Zero customer impact ✅

### Check Logic

```bash
if [ "$BILLING_ENABLED" = "true" ]; then
  # Check all 5 required Stripe variables
  MISSING_VARS=""

  if [ -z "$STRIPE_SECRET_KEY" ]; then
    MISSING_VARS="$MISSING_VARS STRIPE_SECRET_KEY"
  fi
  # ... (checks 4 more vars)

  if [ -n "$MISSING_VARS" ]; then
    echo "❌ ERROR: Billing is enabled but required Stripe env vars are missing:"
    echo "$MISSING_VARS"
    echo ""
    echo "Either:"
    echo "1. Set missing Stripe secrets in GitHub (Settings → Secrets)"
    echo "2. Set BILLING_ENABLED=false to disable billing"
    exit 1
  fi
fi
```

### Error Message Example

```
❌ ERROR: Billing is enabled but required Stripe env vars are missing:
 STRIPE_SECRET_KEY STRIPE_PRICE_ID_PLUS

Either:
1. Set missing Stripe secrets in GitHub (Settings → Secrets)
2. Set BILLING_ENABLED=false to disable billing
```

### When It Runs
- **Job**: `deploy-production` in `.github/workflows/deploy.yml`
- **Trigger**: `git push` to `main` branch
- **Before**: Docker build, Cloud Run deployment
- **Impact**: Saves 5-10 minutes of failed build time if vars are missing

---

## 5. Test Results

### Feature Switch Tests
```bash
npx vitest run src/lib/billing/feature-switch.test.ts

✓ src/lib/billing/feature-switch.test.ts (9 tests) 9ms
  ✓ BILLING_ENABLED Feature Switch
    ✓ Environment Variable Handling
      ✓ should treat undefined as enabled (default)
      ✓ should treat "true" as enabled
      ✓ should treat "false" as disabled
      ✓ should treat empty string as enabled
      ✓ should treat "1" as enabled
      ✓ should treat "0" as enabled (only "false" disables)
    ✓ API Response Patterns
      ✓ should return 503 status when disabled
      ✓ should have clear error message when disabled
    ✓ Feature Switch Scope
      ✓ should only affect Stripe operations (not plan limits)

Test Files  1 passed (1)
     Tests  9 passed (9)
  Duration  2.33s
```

### Plan Limits Tests (After Corrections)
```bash
npx vitest run src/lib/billing/plan-limits.test.ts

✓ src/lib/billing/plan-limits.test.ts (31 tests) 7ms
  ✓ evaluatePlanLimits
    ✓ Free Plan Scenarios (6 tests) - All passing with 2/10 limits
    ✓ Starter Plan Scenarios (6 tests) - All passing with 5/50 limits
    ✓ Plus Plan Scenarios (6 tests) - All passing with 15/200 limits
    ✓ Pro Plan Scenarios (6 tests) - All passing with 9999/9999 limits
    ✓ Edge Cases & Boundary Conditions (7 tests) - All passing

Test Files  1 passed (1)
     Tests  31 passed (31)
```

### Combined Test Suite
All 171 tests in the project still passing after changes.

---

## 6. Key Technical Decisions

### 1. Feature Switch Scope
**Decision**: BILLING_ENABLED only affects Stripe operations, not plan enforcement.

**Rationale**:
- Users should be able to use app within plan limits even if billing is disabled
- Plan enforcement is business logic, not billing infrastructure
- Separates operational concerns (Stripe availability) from app functionality

**Alternative Considered**: Disable all billing logic including enforcement.
**Rejected**: Would make app unusable during maintenance windows.

### 2. Default Enabled Behavior
**Decision**: Only `"false"` disables, everything else enables.

**Rationale**:
- Prevents accidental downtime from typos (`"True"`, `"TRUE"`, etc.)
- Explicit opt-out is safer than explicit opt-in
- Missing env var shouldn't break production

**Alternative Considered**: Require explicit `"true"` to enable.
**Rejected**: Too risky - missing var would disable billing in production.

### 3. 503 Status Code
**Decision**: Return 503 Service Unavailable when billing is disabled.

**Rationale**:
- Accurate semantic meaning (service temporarily unavailable)
- Distinguishes from permanent errors (404, 403)
- Clients know to retry later

**Alternative Considered**: 403 Forbidden or 500 Internal Server Error.
**Rejected**: 403 implies permanent lack of permission, 500 implies bug.

### 4. CI Check Timing
**Decision**: Run billing config check **before** Docker build.

**Rationale**:
- Fails fast (saves 5-10 minutes of build time)
- Clear error message before complex operations
- Prevents wasted CI minutes on doomed deploy

**Alternative Considered**: Check after build, before deployment.
**Rejected**: Wastes time building container that won't deploy.

### 5. Documentation First
**Decision**: Create canonical docs before implementing feature switch.

**Rationale**:
- Documenting forces comprehensive system understanding
- Reveals gaps and inconsistencies (like plan limits discrepancy)
- Reference doc guides implementation decisions

**Alternative Considered**: Implement first, document after.
**Rejected**: Would have perpetuated plan limits errors.

---

## 7. Files Modified/Created

### Created Files (3)
1. **000-docs/6767-REF-hustle-billing-and-workspaces-canonical.md** (350 lines)
   - Canonical billing + workspace reference

2. **000-docs/227-RB-SRVC-hustle-billing-support-runbook.md** (350 lines)
   - Operator support runbook

3. **src/lib/billing/feature-switch.test.ts** (133 lines)
   - Feature switch unit tests

### Modified Files (7)
1. **.env.example** (+7 lines)
   - Added BILLING_ENABLED with documentation

2. **src/app/api/billing/portal/route.ts** (+13 lines)
   - Added feature switch check at line 27-37

3. **src/app/api/billing/create-checkout-session/route.ts** (+13 lines)
   - Added feature switch check at line 27-38

4. **src/app/api/billing/invoices/route.ts** (+13 lines)
   - Added feature switch check at line 26-37

5. **.github/workflows/deploy.yml** (+50 lines)
   - Added billing config sanity check step at line 141-190

6. **src/lib/billing/plan-limits.ts** (corrected constants)
   - Fixed PLAN_LIMITS from 4 wrong tiers to 4 correct tiers

7. **src/lib/billing/plan-limits.test.ts** (rewrote all tests)
   - Updated 31 tests to match corrected plan limits

### Total Changes
- **3 new files**: 600+ lines of documentation + tests
- **7 modified files**: ~100 lines of functional code + 31 rewritten tests
- **2 separate concerns**: Feature switch implementation + plan limits fix

---

## 8. Verification Checklist

- [x] Canonical reference doc (6767) created and comprehensive
- [x] Support runbook (227) created with 4 scenarios
- [x] BILLING_ENABLED added to `.env.example` with clear docs
- [x] Feature switch implemented in 3 API routes (portal, checkout, invoices)
- [x] CI sanity check added to `deploy.yml` production job
- [x] Feature switch tests written and passing (9/9)
- [x] Plan limits discrepancy discovered and corrected
- [x] Plan limits tests updated and passing (31/31)
- [x] Full test suite still passing (171/171)
- [x] Documentation references correct plan limits throughout
- [x] `.env.example` shows BILLING_ENABLED="true" as default
- [x] API routes return 503 + BILLING_DISABLED error when disabled
- [x] CI check validates all 5 Stripe env vars when billing enabled
- [x] Support runbook includes escalation guidelines
- [x] Canonical doc documents workspace status lifecycle

---

## 9. What's Next

### Immediate
1. **Commit plan-limits corrections** (separate commit for critical fix)
2. **Commit Task 6 changes** (all safety guardrails work)

### Future Considerations
1. **Add UI indicator** when BILLING_ENABLED=false (show banner to admins)
2. **Monitoring alert** if billing disabled for >1 hour
3. **Automated runbook** - convert support procedures to scripts
4. **Stripe webhook retry logic** for transient failures
5. **Plan downgrade flow** (currently only upgrade supported)

---

## 10. Success Criteria Met

✅ **Canonical documentation created** - 6767-REF is authoritative source
✅ **Support runbook operational** - 227-RB has 4 detailed scenarios
✅ **Feature switch implemented** - BILLING_ENABLED in 3 API routes
✅ **CI safety check working** - Prevents bad billing config deploys
✅ **Comprehensive tests** - 9 feature switch + 31 plan limits tests passing
✅ **Plan limits corrected** - All 4 tiers match actual system
✅ **No breaking changes** - All 171 tests still passing

**Phase 7 Task 6: Complete** ✅

---

**Document ID**: 228-AA-MAAR-hustle-phase7-task6-billing-canonical-and-guardrails.md
**Created**: 2025-11-17
**Author**: Claude (AI Assistant)
**Related Tasks**: Phase 7 Task 5 (Plan Limit Warnings), Phase 7 Task 6 (This AAR)
