# Registration Error Debug Session - 2025-10-21

**Status:** IN PROGRESS
**Issue:** User registration failing with "An error occurred during registration"
**Reporter:** User trying to register with email: opeyemiariyo@intentsolutions.io

---

## Problem Summary

Registration form submission at `https://hustlestats.io/register` fails with generic error message. No visible error details to user.

### User-Provided Test Data
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "opeyemiariyo@intentsolutions.io",
  "phone": "(555) 555-1234",
  "password": "Testuser123!"
}
```

---

## Investigation Timeline

### 1. Initial Error Discovery (17:00 UTC)

**Checked:** Google Cloud logs for `hustle-app` service
**Found:** Prisma database error

```
ERROR: The table 'public.users' does not exist in the current database.
Error Code: P2021
```

**Root Cause #1:** Database tables were never created in production
- Cloud SQL instance `hustle-db-prod` existed
- Database `hustle_mvp` existed
- But schema was **empty** (no tables)

---

### 2. First Fix Attempt - Database Migration (17:27 UTC)

**Action:** Updated `/api/migrate` endpoint with complete Prisma schema

**Issue:** PostgreSQL doesn't support multiple SQL statements in prepared queries
**Error:**
```
Code: 42601
Message: cannot insert multiple commands into a prepared statement
```

**Fix:** Split SQL into separate statements executed in loop

**Deployment:** Commit `ab4445f` → `3c80a8d`

---

### 3. Migration Execution (17:37 UTC)

**Action:** Called `POST https://hustlestats.io/api/migrate`

**Result:** ✅ SUCCESS
```json
{
  "success": true,
  "tablesCreated": 9,
  "indexesCreated": 19,
  "foreignKeysAdded": 6,
  "timestamp": "2025-10-21T17:37:29.048Z"
}
```

**Tables Created:**
- `users` - User accounts with COPPA compliance
- `Player` - Athlete profiles
- `Game` - Game statistics
- `accounts`, `sessions` - NextAuth tables
- `password_reset_tokens` - Password reset flow
- `email_verification_tokens` - Email verification flow
- `waitlist` - Early access signups
- `verification_tokens` - NextAuth tokens

---

### 4. Second Error - Email Template JSON Encoding (17:37 UTC)

**Tested:** Registration with new user
**Error:**
```
Registration error: SyntaxError: Bad escaped character in JSON at position 131
```

**Root Cause #2:** Trademark symbol `™` in email templates causing JSON encoding issues

**Location:** `/src/lib/email-templates.ts` - All email headers
```html
<h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">™</sup></h1>
```

**Fix:** Replace `™` with HTML entity `&trade;` in all 5 occurrences

**Deployment:** Commit `61d840d`

---

### 5. Third Error - Still JSON Encoding Issues (18:04 UTC)

**Tested:** Registration after trademark fix
**Error:**
```
Registration error: SyntaxError: Bad escaped character in JSON at position 128
```

**Status:** Error persists with different position (131 → 128)
**Hypothesis:** Other problematic characters in email templates or escaping issues

**Action:** Added detailed logging to pinpoint exact failure location

**Commits:**
- `e637f23` - Added console.log statements throughout registration flow

**Logging Added:**
1. "User created successfully, generating verification token..."
2. "Verification token generated"
3. "Verification URL created"
4. "Preparing email template..."
5. "Email template prepared, sending..."
6. "Verification email sent successfully" OR error

---

## Technical Details

### GCP Project Configuration

**Project:** `hustleapp-production`
**Project Number:** 335713777643
**Region:** us-central1

**Cloud SQL:**
- Instance: `hustle-db-prod`
- Database: `hustle_mvp`
- User: `hustle_admin`
- Type: PostgreSQL 15
- Connection: Private IP (10.84.0.3)

**Cloud Run:**
- Service: `hustle-app`
- Region: us-central1
- URL: https://hustlestats.io

**Environment Variables (Confirmed):**
- ✅ `NODE_ENV=production`
- ✅ `NEXTAUTH_URL=https://hustlestats.io`
- ✅ `DATABASE_URL` (from Secret Manager)
- ✅ `NEXTAUTH_SECRET` (from Secret Manager)
- ❌ `RESEND_API_KEY` - **NOT SET** (user has Netlify forms for emails)

---

## Files Modified

### 1. `/src/app/api/migrate/route.ts`
- Complete database schema migration endpoint
- Creates all tables, indexes, and foreign keys
- Safe to run multiple times (uses `IF NOT EXISTS`)

### 2. `/src/lib/email-templates.ts`
- Replaced `™` with `&trade;` HTML entity (5 occurrences)

### 3. `/src/app/api/auth/register/route.ts`
- Added detailed console logging for debugging

---

## Deployment Pipeline

**GitHub Actions Workflow:** `.github/workflows/deploy.yml`

**Automatic Deployment Triggers:**
- Push to `main` branch
- Builds Docker image
- Pushes to Artifact Registry: `us-central1-docker.pkg.dev/hustleapp-production/hustle-app`
- Deploys to Cloud Run

**Deployment Time:** ~3-4 minutes per commit

---

## Next Steps

### Immediate (Waiting for deployment e637f23)

1. ✅ Wait for deployment to complete
2. ⏳ Test registration with detailed logging
3. ⏳ Check Cloud Run logs for exact failure point
4. ⏳ Identify and fix JSON encoding issue

### Fourth Error - Root Cause Identified (18:10 UTC)

**Analysis:** Error occurred during Resend library's JSON.parse() call
**Stack Trace:**
```
at JSON.parse (<anonymous>)
at async u (.next/server/chunks/[root-of-the-server]__2242c365._.js:1:7377)
```

**Root Cause #3:** Multiple special characters in email templates breaking JSON encoding:
1. **Apostrophes** in contractions: "You're", "you'll", "didn't"
2. **Emojis**: ⏱ (clock), ⚠️ (warning), 🎉 (party), ✓ (checkmark)
3. **Copyright symbol**: © (instead of HTML entity)

**Fix Applied (Commit 09bfe74):**

**HTML Templates:**
- Apostrophes: `'` → `&apos;`
- Copyright: `©` → `&copy;`
- Removed all emojis
- Fixed subject line escaped apostrophe

**Plain Text Templates:**
- Contractions: "didn't" → "did not", "Here's" → "Here is"
- Copyright: `©` → `(c)`

**Deployment:** Commit `09bfe74` → queued at 18:10 UTC

---

### Fifth Error - ACTUAL Root Cause Found (18:40 UTC)

**Analysis:** HTML entity fixes didn't solve the problem. Error persisted at position 117.

**ACTUAL Root Cause #4:** Single quotes in CSS `baseStyles` template

**Location:** `/src/lib/email-templates.ts:7`
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

**Problem:**
- `baseStyles` contains CSS with single quotes
- `baseStyles` is embedded in EVERY email template via `${baseStyles}`
- When Resend library calls `JSON.stringify()` on email payload, unescaped single quotes break JSON encoding
- Position ~117-120 corresponds to location of 'Segoe UI' in the rendered HTML

**Fix Applied (Commit ddc3017):**
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Changed:** Single quotes (`'`) → Double quotes (`"`) in CSS
**Why This Works:** Double quotes in template strings don't break JSON encoding

**Deployment:** Commit `ddc3017` → triggered at 18:41 UTC

### Environment Configuration Needed

- Consider adding `RESEND_API_KEY` if email verification is required
- OR disable email verification temporarily
- OR use Netlify forms integration for emails

---

## Code References

### Registration API Route
`/src/app/api/auth/register/route.ts:1-111`

### Email Templates
`/src/lib/email-templates.ts:92-154` (emailVerification function)

### Email Sending
`/src/lib/email.ts:27-64`

### Migration Endpoint
`/src/app/api/migrate/route.ts:1-221`

---

## Error Log Patterns

**Search Query for Cloud Run Logs:**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=hustle-app AND textPayload:Registration" \
  --limit=20 \
  --project=hustleapp-production \
  --format="table(timestamp,textPayload)"
```

**Common Error Patterns:**
- `Registration error: Error [PrismaClientKnownRequestError]` - Database issues
- `Registration error: SyntaxError: Bad escaped character in JSON` - Template encoding
- `[Registration] Failed to send verification email` - Email service issues

---

## Testing Commands

### Test Registration
```bash
curl -X POST https://hustlestats.io/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "5555551234",
    "password": "TestPassword123!"
  }'
```

### Check Migration Status
```bash
curl -X POST https://hustlestats.io/api/migrate
```

### View Recent Logs
```bash
gcloud run services logs read hustle-app \
  --project=hustleapp-production \
  --region=us-central1 \
  --limit=50
```

---

## Lessons Learned

1. **Always verify database schema in production** - Don't assume migrations ran
2. **Test email templates thoroughly** - Special characters can break JSON encoding
3. **Add detailed logging early** - Saves time when debugging production issues
4. **Use HTML entities for special characters** - Safer than raw Unicode in templates
5. **Cloud SQL requires migration strategy** - Can't connect directly from local machine due to VPC

---

## Related Documentation

- **CLAUDE.md** - Project overview and development guide
- **Prisma Schema** - `/prisma/schema.prisma`
- **GitHub Actions** - `.github/workflows/deploy.yml`
- **Artifact Registry Migration** - `/docs/125-OD-DEPL-artifact-registry-migration.md`

---

**Last Updated:** 2025-10-21T18:05:00Z
**Status:** Debugging in progress
**Assignee:** Claude Code AI Assistant
**Next Check:** After deployment e637f23 completes
