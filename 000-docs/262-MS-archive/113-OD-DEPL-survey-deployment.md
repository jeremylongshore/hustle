# Hustle Survey - Deployment Guide

**Version:** 2.0.0
**Date:** 2025-10-07
**Status:** ✅ Production Ready

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Local Development](#local-development)
3. [Testing](#testing)
4. [Netlify Deployment](#netlify-deployment)
5. [Environment Variables](#environment-variables)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
7. [Rollback Procedures](#rollback-procedures)

---

## Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git
- Netlify account (for production deployment)

### Installation

```bash
cd /home/jeremy/projects/hustle/08-Survey/survey-app
npm install
```

---

## Local Development

### Start Development Server

```bash
cd survey-app
npm run dev
```

The application will be available at `http://localhost:3000`

### Environment Configuration

Create `.env.local` file in `survey-app/` directory:

```bash
# Database (optional - currently using file system)
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth (if implementing authentication)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Directory Structure

```
survey-app/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── survey/
│   │   ├── [section]/
│   │   │   └── page.tsx            # Dynamic survey sections (1-15)
│   │   └── complete/
│   │       └── page.tsx            # Thank you page
│   └── api/
│       └── survey/
│           └── submit/
│               └── route.ts        # POST endpoint for submissions
├── lib/
│   └── survey-data-complete.ts     # Complete 68-question survey data
├── public/
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── smoke-test.sh                   # Automated testing script
```

---

## Testing

### Manual Testing Checklist

1. **Landing Page**
   - [ ] Page loads without errors
   - [ ] "Start Survey" button is visible
   - [ ] All content displays correctly
   - [ ] Mobile responsive design works

2. **Survey Flow**
   - [ ] Section 1 (consent) loads
   - [ ] Can navigate to Section 2
   - [ ] All 15 sections are accessible
   - [ ] Progress bar updates correctly
   - [ ] Back button works
   - [ ] All question types render correctly:
     - [ ] Radio buttons
     - [ ] Checkboxes
     - [ ] Text inputs
     - [ ] Email inputs
     - [ ] Phone inputs
     - [ ] Textarea
     - [ ] Rating scales
     - [ ] Ranking inputs
     - [ ] Select dropdowns

3. **Data Persistence**
   - [ ] Responses save to localStorage automatically
   - [ ] Refreshing page retains answers
   - [ ] Navigation between sections preserves data

4. **Validation**
   - [ ] Required fields show errors when empty
   - [ ] Email validation works
   - [ ] Phone validation works
   - [ ] Checkbox max selections enforced
   - [ ] Ranking completeness validated

5. **Submission**
   - [ ] Final section shows "Submit Survey" button
   - [ ] API receives survey data
   - [ ] Submission creates file in `data/survey-submissions/`
   - [ ] localStorage clears after successful submission
   - [ ] Redirects to completion page

6. **Completion Page**
   - [ ] Thank you message displays
   - [ ] Beta tester information shows
   - [ ] Contact information visible
   - [ ] "Return to Home" button works

### Automated Smoke Test

Run the smoke test script to validate all critical functionality:

```bash
cd survey-app

# Test local development server
npm run dev &  # Start server in background
sleep 5         # Wait for server to start
./smoke-test.sh http://localhost:3000

# Test production deployment
./smoke-test.sh https://hustlesurvey.intentsolutions.io
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════
Test Results Summary
═══════════════════════════════════════════════════════════

Total Tests Run: 30
Tests Passed:    30
Tests Failed:    0
Pass Rate:       100%

╔═══════════════════════════════════════════════════╗
║                                                   ║
║  ✅  ALL SMOKE TESTS PASSED  ✅                  ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

### Cross-Browser Testing

Test in the following browsers (minimum versions):
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Chrome Mobile (Android)
- ✅ Safari Mobile (iOS 14+)

### Mobile Testing

Test on actual devices:
- iPhone (iOS 14+)
- Android phone (Android 10+)
- iPad
- Android tablet

---

## Netlify Deployment

### First-Time Deployment

1. **Push to GitHub**

   ```bash
   cd /home/jeremy/projects/hustle/08-Survey
   git add .
   git commit -m "feat: complete survey remediation with all fixes"
   git push origin main
   ```

2. **Connect to Netlify**

   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub and select the `hustle` repository
   - Configure build settings:
     - **Base directory:** `08-Survey`
     - **Build command:** `cd survey-app && npm run build`
     - **Publish directory:** `survey-app/.next`
   - Click "Deploy site"

3. **Configure Custom Domain**

   - In Netlify dashboard, go to "Domain settings"
   - Add custom domain: `hustlesurvey.intentsolutions.io`
   - Configure DNS with your domain provider:
     - Add CNAME record: `hustlesurvey` → `[your-netlify-domain].netlify.app`
   - Enable HTTPS (automatic with Netlify)

### Continuous Deployment

Netlify automatically deploys on every push to `main` branch.

**Deployment Workflow:**
```bash
# Make changes
git add .
git commit -m "fix: update survey question"
git push origin main

# Netlify automatically:
# 1. Detects push
# 2. Runs build command
# 3. Deploys to production
# 4. Invalidates CDN cache
# 5. Sends notification (if configured)
```

### Manual Deployment

To deploy without pushing to GitHub:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
cd survey-app
netlify deploy --prod
```

### Deployment Checklist

Before deploying to production:

- [ ] All code changes committed
- [ ] Smoke tests passing locally
- [ ] Manual testing completed
- [ ] Environment variables configured in Netlify
- [ ] DNS records configured
- [ ] SSL certificate active
- [ ] Error monitoring configured

---

## Environment Variables

### Required Environment Variables

Configure in Netlify dashboard under "Site settings" > "Environment variables":

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_VERSION` | Node.js version | `20` | Yes |
| `NPM_VERSION` | npm version | `10` | No |

### Optional Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` | No (using file system) |
| `NEXTAUTH_SECRET` | NextAuth secret key | `generated-secret` | No (not using auth) |
| `NEXTAUTH_URL` | NextAuth callback URL | `https://hustlesurvey...` | No (not using auth) |

---

## Monitoring & Troubleshooting

### Health Checks

**API Health Check:**
```bash
curl https://hustlesurvey.intentsolutions.io/api/survey/submit
```

**Expected Response:**
```json
{
  "status": "ok",
  "endpoint": "/api/survey/submit",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

### Common Issues

#### Issue: Survey doesn't load sections beyond Section 1

**Symptoms:** "Section not found" error when clicking Next

**Root Cause:** Not importing complete survey data

**Fix:** Verify `/app/survey/[section]/page.tsx` imports from `@/lib/survey-data-complete`

#### Issue: Responses not persisting

**Symptoms:** Data lost on page refresh

**Root Cause:** localStorage disabled or quota exceeded

**Fix:**
- Enable localStorage in browser settings
- Clear browser storage
- Use different browser

#### Issue: API submission fails

**Symptoms:** Error alert on final submission

**Root Cause:**
- Server error
- Network timeout
- CORS issue

**Fix:**
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check Netlify function logs
4. Ensure proper CORS headers

### Logs & Debugging

**View Netlify Deploy Logs:**
```bash
netlify logs
```

**View Function Logs (API):**
```bash
netlify functions:log survey-submit
```

**Browser Console Logging:**
- All survey actions log to console with `[Survey]` prefix
- API calls log with `[API]` prefix

**Example Console Output:**
```
[Survey] Loaded saved responses: 25 fields
[Survey] Auto-saved responses
[Survey] Submitting survey data... 68 fields
[Survey] Submission successful: survey-1696689600000-abc123
```

---

## Rollback Procedures

### Quick Rollback

If production deployment has critical issues:

1. **Via Netlify Dashboard:**
   - Go to "Deploys" tab
   - Find last working deployment
   - Click "Publish deploy"
   - Deployment rolls back in <30 seconds

2. **Via CLI:**
   ```bash
   netlify rollback
   ```

### Full Rollback with Code Revert

```bash
# Find last working commit
git log --oneline

# Revert to specific commit
git revert <commit-hash>
git push origin main

# Netlify automatically deploys reverted code
```

### Emergency Procedures

If site is completely down:

1. **Immediately:** Disable site in Netlify
2. **Diagnose:** Check error logs
3. **Fix:** Apply hotfix or rollback
4. **Test:** Run smoke tests on staging
5. **Deploy:** Push fix to production
6. **Verify:** Confirm all functionality restored
7. **Document:** Update incident log

---

## Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Landing Page Load | < 2s | TBD | 🟡 Pending |
| Section Navigation | < 500ms | TBD | 🟡 Pending |
| API Response Time | < 1s | TBD | 🟡 Pending |
| Lighthouse Score | > 90 | TBD | 🟡 Pending |
| Survey Completion Rate | > 80% | TBD | 🟡 Pending |

---

## Post-Deployment Validation

After deploying to production:

1. **Immediate (0-15 minutes):**
   - [ ] Run smoke tests
   - [ ] Complete full survey manually
   - [ ] Verify submission saved
   - [ ] Check error logs (should be empty)
   - [ ] Test on mobile device

2. **Short-term (1-24 hours):**
   - [ ] Monitor error rate (< 1%)
   - [ ] Check completion rate (> 80%)
   - [ ] Review user feedback
   - [ ] Verify email notifications working
   - [ ] Check submission data quality

3. **Long-term (1-7 days):**
   - [ ] Analyze completion funnel
   - [ ] Review drop-off points
   - [ ] Gather user testimonials
   - [ ] Plan optimizations
   - [ ] Scale resources if needed

---

## Support & Contact

**Technical Issues:**
- Email: support@hustlesurvey.intentsolutions.io
- GitHub Issues: [Repository Link]

**Deployment Issues:**
- Check Netlify status: status.netlify.com
- Netlify support: support.netlify.com

---

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Maintained By:** Claude Code (AI Agent) + Development Team
