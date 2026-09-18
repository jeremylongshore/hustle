# Production Deployment Quick Start

**Document ID**: 244-RUNBOOK-production-deploy-quick-start
**Status**: ACTIVE
**Created**: 2025-11-18
**Purpose**: Minimal production deploy workflow for human testing
**Owner**: DevOps

---

## Quick Deploy to Production

This is a **minimal production deploy workflow** created to enable rapid testing in production. Full Phase 4 hardening (comprehensive tests, performance optimization, secrets migration) will follow based on production feedback.

### Prerequisites

1. **GitHub Secrets** configured:
   - `WIF_PROVIDER` - Workload Identity Federation provider
   - `WIF_SERVICE_ACCOUNT` - Service account for WIF

2. **Firebase Project** ready:
   - Project ID: `hustleapp-production`
   - Hosting enabled
   - Firestore database created
   - Cloud Functions enabled

3. **Local checks passed**:
   ```bash
   npm run build  # Must succeed
   npm run lint   # Must succeed
   ```

---

## Deploy Steps

### 1. Push to Main

```bash
git checkout main
git pull
git status  # Ensure clean state
git push
```

### 2. Trigger Deploy Workflow

1. Go to GitHub Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. **Type "DEPLOY"** in the confirmation field
5. Click "Run workflow" button

### 3. Monitor Deployment

Watch the workflow run:
- ✅ Build application
- ✅ Deploy Firestore rules & indexes
- ✅ Deploy Cloud Functions
- ✅ Deploy Firebase Hosting
- ✅ Basic health check

**Expected Duration**: 5-8 minutes

### 4. Verify Production

**URL**: https://hustleapp-production.web.app

**Quick Smoke Test**:
```bash
# Test home page
curl -I https://hustleapp-production.web.app

# Should return HTTP 200, 301, or 302
```

---

## Human Testing Checklist

After deployment, perform manual testing:

### Core Flows

- [ ] **Auth Flow**
  - Sign up with new email
  - Verify email
  - Login
  - Logout

- [ ] **Player Profile**
  - Create player with new enriched fields:
    - Gender (male/female)
    - Primary position (e.g., "CB" - Center Back)
    - Secondary positions (e.g., "DM", "CM")
    - League (select from dropdown, including "Rush Soccer")
    - Try "Other" league + custom name
  - Edit player profile
  - Verify all fields save and load correctly

- [ ] **Game Logging**
  - Create game
  - Add stats
  - View on dashboard

- [ ] **Billing** (if enabled)
  - View plan info
  - Check usage limits
  - Test Stripe portal link

### Cross-Device

- [ ] Desktop browser (Chrome, Safari, Firefox)
- [ ] Mobile browser (iOS Safari, Android Chrome)
- [ ] Tablet

### Performance

- [ ] Page load < 3s
- [ ] No console errors
- [ ] Form submissions work

---

## Rollback Procedure

If critical issue found:

### Option A: Firebase Hosting Rollback

```bash
firebase hosting:channel:list --project=hustleapp-production
firebase hosting:rollback --project=hustleapp-production
```

### Option B: Redeploy Previous Version

```bash
git checkout [PREVIOUS_GOOD_COMMIT]
# Re-run GitHub Actions workflow
```

---

## Log a Bug

If you find issues during testing:

```bash
# Create GitHub issue with label
gh issue create --label "env:prod" --title "Bug: [description]" --body "[details]"
```

**Critical info to include**:
- URL where bug occurred
- Steps to reproduce
- Expected vs actual behavior
- Browser/device
- Screenshots if applicable

---

## Fix & Redeploy Loop

1. **Create fix branch**:
   ```bash
   git checkout -b fix/short-bug-name
   ```

2. **Fix locally**:
   ```bash
   # Make changes
   npm run build  # Test
   npm run lint   # Test
   ```

3. **Commit & push**:
   ```bash
   git commit -am "fix: description"
   git push origin fix/short-bug-name
   ```

4. **PR → Merge → Redeploy**:
   - Open PR
   - Wait for CI checks
   - Merge to main
   - Re-run "Deploy to Production" workflow

---

## Known Limitations (Pre-Phase 4)

This is a **minimal deploy workflow**. Missing from Phase 4:

- ❌ Comprehensive test coverage (< 20% currently)
- ❌ Performance budgets enforced
- ❌ Secrets in Google Secret Manager (using GitHub Secrets)
- ❌ Automated smoke tests beyond basic health check
- ❌ Firestore rules validation in CI
- ❌ Production monitoring alerts configured

**These will be added in Phase 4 after initial production feedback.**

---

## Monitoring

### Firebase Console

**URL**: https://console.firebase.google.com/project/hustleapp-production

**Check**:
- **Hosting**: Traffic, errors
- **Firestore**: Database reads/writes, errors
- **Functions**: Invocations, errors, duration
- **Performance**: Page load metrics (if SDK active)

### Google Cloud Console

**URL**: https://console.cloud.google.com/home/dashboard?project=hustleapp-production

**Check**:
- **Cloud Logging**: Application logs, errors
- **Error Reporting**: Aggregated errors
- **Cloud Monitoring**: Dashboards (if configured)

---

## Next Steps After Initial Deploy

1. **72-Hour Observation**:
   - Monitor Firebase Console every 4-6 hours
   - Check Error Reporting daily
   - Log all bugs/feedback

2. **Execute Phase 4** (after production feedback):
   - Expand test coverage based on real bugs found
   - Optimize performance based on real user metrics
   - Migrate secrets to Secret Manager
   - Complete billing UX based on real usage patterns

3. **Execute Phase 5** (full production hardening):
   - Comprehensive smoke tests
   - Production readiness checklist
   - 72-hour stabilization plan

---

## Support

- **Logs**: Firebase Console → Cloud Logging
- **Errors**: Firebase Console → Crashlytics / Error Reporting
- **Issues**: GitHub Issues with `env:prod` label
- **Rollback**: See Rollback Procedure above

---

**Document Status**: ACTIVE
**Last Updated**: 2025-11-18
**Version**: 1.0.0 (Minimal Deploy)
**Next Review**: After first production deployment
