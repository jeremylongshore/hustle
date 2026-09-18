# PHASE 1: Go-Live Track - Unblock Auth & Complete Migration

**Document ID:** 190-PP-PLAN-phase1-go-live-track
**Type:** Project Plan
**Created:** 2025-11-15
**Status:** READY FOR EXECUTION

---

## Executive Summary

**Objective:** Convert Hustle from "partially migrated, not accepting users" → "fully migrated, Firebase-ready, deployable to production for real customers."

**Estimated Effort:** 6–8 hours total development time
**Blocking Dependencies:** User must enable Firebase Auth Email/Password provider (1-minute action)
**Outcome:** Production-capable application with Firebase Auth, Firestore, and Firebase Hosting

---

## Success Criteria

After Phase 1 completion, the application will:
- ✅ Use Firebase Auth (Email/Password enabled)
- ✅ Use Firestore for all data (no PostgreSQL)
- ✅ Use Firebase Cloud Functions for backend logic
- ✅ Be deployed to Firebase Hosting
- ✅ Have 58 migrated users with password reset emails sent
- ✅ Pass CI/CD gates
- ✅ Be production-capable for customer onboarding
- ✅ Have zero dependencies on NextAuth or Prisma

---

## Phase 1 Steps

### STEP 1: Enable Firebase Auth Provider (The 1-Minute Blocker)

**Duration:** 30 minutes (development) + 1 minute (user action)
**Blocking:** All subsequent steps
**Criticality:** 🔴 CRITICAL - Nothing works until this is done

#### What Claude Must Do

1. **Generate Firebase Auth Enablement Verification Script**
   ```bash
   # Create: scripts/verify-firebase-auth-enabled.ts
   # Purpose: Confirm Email/Password provider is active
   # Test: Attempt to create test user via Admin SDK
   # Expected: Success if provider enabled, specific error if not
   ```

2. **Generate Targeted Test Suite**
   ```bash
   # Create: tests/firebase-auth/01-provider-enabled.test.ts
   # Tests:
   # - New user creation works
   # - Login works
   # - Firestore writes are permitted
   # - Email verification sends
   ```

3. **Update Migration Scripts**
   ```bash
   # Modify: scripts/migrate-to-firestore.ts
   # Add: Pre-flight check for Firebase Auth provider
   # Fail fast: If provider not enabled, exit with clear message
   ```

#### What User Must Do

**ONLY ACTION REQUIRED BY USER:**

1. Go to: https://console.firebase.google.com/project/hustleapp-production/authentication/providers
2. Click "Email/Password" provider
3. Click "Enable"
4. Click "Save"

**That's it. One button click.**

#### Mini-AAR Requirements

**Document:** `000-docs/191-AA-MAAR-phase1-step1-auth-provider-enabled.md`

**Required Contents:**
```markdown
# Phase 1 Step 1: Firebase Auth Provider Enablement - Mini AAR

## Verification Performed
- [ ] Firebase Auth Email/Password provider confirmed enabled
- [ ] Test user creation successful
- [ ] Test user login successful
- [ ] Firestore write permissions working
- [ ] Email verification flow operational

## Script Output
[Paste output from verify-firebase-auth-enabled.ts]

## Migration Readiness State
- Current state: [Before enablement]
- Post-enablement state: [After enablement]
- Blockers removed: [List]

## Risks Discovered
[Any mismatches, warnings, or issues found]

## Evidence
- Commit ID: [hash]
- Firebase Console screenshot: [if applicable]
- Test execution logs: [paste]

## Go/No-Go for Step 2
[✅ GO / 🔴 NO-GO with reasoning]
```

#### GitHub Commit Requirements

**Commit Message Format:**
```
chore(auth): verify Firebase Auth provider + add enablement checks

Step 1 of Phase 1 Go-Live Track.

Created:
- scripts/verify-firebase-auth-enabled.ts
- tests/firebase-auth/01-provider-enabled.test.ts
- Updated scripts/migrate-to-firestore.ts with pre-flight checks

Verification:
- ✅ Firebase Auth Email/Password provider enabled
- ✅ Test user creation successful
- ✅ Firestore permissions validated

Blocking: All Phase 1 steps depend on this
Next: Step 2 - Dashboard migration

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Acceptance Criteria

- [ ] Script `verify-firebase-auth-enabled.ts` executes without errors
- [ ] Test suite passes (01-provider-enabled.test.ts)
- [ ] User confirms Firebase Auth provider enabled in Console
- [ ] Mini-AAR 191 created with all required sections
- [ ] Git commit made with proper message
- [ ] No blockers identified for Step 2

---

### STEP 2: Complete Dashboard Migration to Firebase (11 Pages)

**Duration:** 3–4 hours
**Dependencies:** Step 1 complete
**Criticality:** 🔴 CRITICAL - Users cannot access dashboard until done

#### What Claude Must Do

**Scope:** Migrate 11 dashboard pages identified in Step 1 analysis:
1. `src/app/dashboard/layout.tsx` - Main layout with session guard
2. `src/app/dashboard/page.tsx` - Dashboard home
3. `src/app/dashboard/athletes/page.tsx` - Athletes list
4. `src/app/dashboard/athletes/[id]/page.tsx` - Athlete detail
5. `src/app/dashboard/profile/page.tsx` - User profile
6. `src/app/dashboard/analytics/page.tsx` - Analytics view
7. `src/app/dashboard/settings/page.tsx` - Settings page
8. `src/app/dashboard/games/page.tsx` - Games list
9. Additional pages discovered during migration

**Migration Pattern for Each Page:**

1. **Replace NextAuth Session Check**
   ```typescript
   // OLD (NextAuth)
   import { auth } from '@/lib/auth';
   const session = await auth();
   if (!session?.user) redirect('/login');

   // NEW (Firebase)
   import { adminAuth } from '@/lib/firebase/admin';
   import { cookies } from 'next/headers';

   const token = cookies().get('__session')?.value;
   if (!token) redirect('/login');

   const decodedToken = await adminAuth.verifyIdToken(token);
   const userId = decodedToken.uid;
   ```

2. **Replace Prisma Data Queries**
   ```typescript
   // OLD (Prisma)
   const games = await prisma.game.findMany({
     where: { player: { parentId: session.user.id } }
   });

   // NEW (Firestore)
   import { getUserGames } from '@/lib/firebase/services/games';
   const games = await getUserGames(userId);
   ```

3. **Update Client Components**
   ```typescript
   // OLD (NextAuth)
   'use client';
   import { useSession } from 'next-auth/react';
   const { data: session } = useSession();

   // NEW (Firebase)
   'use client';
   import { useAuth } from '@/hooks/useAuth';
   const { user, loading } = useAuth();
   ```

4. **Validate Firestore Security Rules**
   - Ensure all queries respect security rules
   - No direct admin SDK usage in client components
   - All user data scoped to authenticated user's UID

#### Migration Checklist (Per Page)

- [ ] Remove `import { auth } from '@/lib/auth'`
- [ ] Add Firebase Admin SDK imports
- [ ] Replace session check with ID token verification
- [ ] Replace Prisma queries with Firestore services
- [ ] Update TypeScript types (NextAuth User → Firebase User)
- [ ] Test page loads without errors
- [ ] Test data displays correctly
- [ ] Test CRUD operations work
- [ ] Verify security rules enforced
- [ ] No console errors in browser

#### Mini-AAR Requirements

**Document:** `000-docs/192-AA-MAAR-phase1-step2-dashboard-migration.md`

**Required Contents:**
```markdown
# Phase 1 Step 2: Dashboard Migration to Firebase - Mini AAR

## Pages Migrated (11 total)

### 1. src/app/dashboard/layout.tsx
**Status:** ✅ Complete
**Changes:**
- Removed NextAuth session check
- Added Firebase Admin SDK token verification
- Updated user context provider

**Diff Summary:**
```diff
- import { auth } from '@/lib/auth';
+ import { adminAuth } from '@/lib/firebase/admin';
- const session = await auth();
+ const token = cookies().get('__session')?.value;
+ const decodedToken = await adminAuth.verifyIdToken(token);
```

**Testing:**
- ✅ Page loads for authenticated users
- ✅ Redirects to /login for unauthenticated users
- ✅ User data displayed in header

[Repeat for all 11 pages]

## Testing Performed

### Manual Tests
- [ ] User can access dashboard after Firebase login
- [ ] All 11 pages load without errors
- [ ] Data displays correctly on each page
- [ ] CRUD operations work (create/read/update/delete)
- [ ] Firestore security rules enforced
- [ ] No NextAuth references remain

### Automated Tests
- [ ] Dashboard layout test passes
- [ ] All page component tests pass
- [ ] Integration tests pass

## Pages Requiring Backend Adjustment

[List any pages that need additional work]

## Discovered Issues

[Any bugs, edge cases, or technical debt discovered]

## Commit IDs

1. Dashboard layout: [hash]
2. Dashboard home: [hash]
3. Athletes list: [hash]
[Continue for all pages]

## Go/No-Go for Step 3
[✅ GO / 🔴 NO-GO with reasoning]
```

#### GitHub Commit Requirements

**Commit Strategy:** One commit per page (11 commits total)

**Commit Message Format (Example):**
```
feat(dashboard): migrate layout to Firebase Auth + Firestore

Step 2.1 of Phase 1 Go-Live Track.

Changes:
- Removed NextAuth session check
- Added Firebase Admin SDK token verification
- Replaced getServerSession with verifyIdToken
- Updated user context to use Firebase User type

Testing:
- ✅ Page loads for authenticated users
- ✅ Redirects unauthenticated to /login
- ✅ User data displays correctly

Related: Phase 1 Step 2 - Dashboard Migration
Next: Migrate dashboard/page.tsx

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Acceptance Criteria

- [ ] All 11 dashboard pages migrated
- [ ] Zero NextAuth imports remain in dashboard
- [ ] Zero Prisma queries remain in dashboard
- [ ] All pages load without errors (manual test)
- [ ] All CRUD operations work (manual test)
- [ ] Firestore security rules enforced
- [ ] Mini-AAR 192 created with all pages documented
- [ ] 11 git commits made (one per page)
- [ ] No blockers identified for Step 3

---

### STEP 3: Run Full User Migration (58 Accounts)

**Duration:** 1–2 hours
**Dependencies:** Steps 1 & 2 complete
**Criticality:** 🟡 HIGH - Required for production launch

#### What Claude Must Do

1. **Pre-Migration Audit**
   ```bash
   # Script: scripts/audit-users-pre-migration.ts
   # Purpose: Document current state
   # Output:
   # - Count of users in PostgreSQL (expected: 58)
   # - List of users with emails
   # - Any users with missing data
   # - Verification that all users have valid emails
   ```

2. **Run Migration Script**
   ```bash
   # Script: scripts/migrate-to-firestore.ts (already exists)
   # Execution:
   npm run migrate:users

   # Expected behavior:
   # - Read all 58 users from PostgreSQL
   # - Create Firebase Auth accounts (with temp passwords)
   # - Create Firestore user documents (/users/{uid})
   # - Send password reset emails via Resend
   # - Log success/failure for each user
   ```

3. **Post-Migration Verification**
   ```bash
   # Script: scripts/verify-user-migration.ts
   # Purpose: Confirm migration success
   # Checks:
   # - All 58 users exist in Firebase Auth
   # - All 58 user documents exist in Firestore
   # - Firestore data matches PostgreSQL data
   # - All UIDs are valid format
   # - All timestamps are set
   # - No data corruption
   ```

4. **Send Password Reset Emails**
   ```bash
   # Script: scripts/send-migration-password-resets.ts
   # Purpose: Enable users to set new passwords
   # Process:
   # - For each migrated user
   # - Generate Firebase password reset link
   # - Send email via Resend with custom template
   # - Log email send status
   ```

#### Migration Data Mapping

**PostgreSQL User → Firebase Auth + Firestore**

```typescript
// PostgreSQL (Prisma User model)
{
  id: "uuid-from-postgres",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  password: "bcrypt-hash",  // Not migrated
  emailVerified: true,
  createdAt: "2024-10-01T00:00:00Z"
}

// Firebase Auth
{
  uid: "firebase-generated-uid",  // NEW
  email: "user@example.com",
  emailVerified: true,
  displayName: "John Doe",
  disabled: false
}

// Firestore (/users/{uid})
{
  firstName: "John",
  lastName: "Doe",
  email: "user@example.com",
  phone: null,
  emailVerified: true,
  agreedToTerms: true,
  agreedToPrivacy: true,
  isParentGuardian: true,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  // PostgreSQL ID stored for reference
  legacyPostgresId: "uuid-from-postgres"
}
```

#### Error Handling

**Expected Errors:**
1. Duplicate email (user already exists in Firebase Auth)
   - **Action:** Skip creation, verify Firestore document exists
2. Invalid email format
   - **Action:** Log error, skip user, flag for manual review
3. Firestore write failure
   - **Action:** Rollback Firebase Auth user creation, log error
4. Email send failure
   - **Action:** Log error, continue migration, retry emails later

#### Mini-AAR Requirements

**Document:** `000-docs/193-AA-MAAR-phase1-step3-user-migration.md`

**Required Contents:**
```markdown
# Phase 1 Step 3: Full User Migration - Mini AAR

## Migration Summary

### Before Migration
- PostgreSQL Users: 58
- Firebase Auth Users: 0
- Firestore User Documents: 0

### After Migration
- PostgreSQL Users: 58 (unchanged)
- Firebase Auth Users: [count]
- Firestore User Documents: [count]
- Password Reset Emails Sent: [count]

## User-Level Errors

[Table of any users that failed migration]
| Email | Error | Resolved |
|-------|-------|----------|
| user@example.com | Duplicate email | ✅ Verified existing |

## Firebase Auth Confirmation

### Sample Users Verified
1. [email] - UID: [uid] - ✅ Exists in Auth
2. [email] - UID: [uid] - ✅ Exists in Auth
3. [email] - UID: [uid] - ✅ Exists in Auth

### Auth Provider Status
- Email/Password: ✅ Enabled
- Total users: [count]
- Verified emails: [count]

## Firestore Hierarchy Verification

### Users Collection
```
/users
  /{uid1}
    - firstName: "John"
    - lastName: "Doe"
    - email: "user@example.com"
    - createdAt: Timestamp
  /{uid2}
    ...
```

**Schema Validation:**
- ✅ All required fields present
- ✅ All timestamps valid
- ✅ All UIDs valid format
- ✅ No data corruption detected

## Password Reset Emails

### Email Template Used
[Show email template]

### Send Status
- Total sent: [count]
- Successful: [count]
- Failed: [count]
- Retry queue: [count]

## Data Integrity Checks

- [ ] User count matches (PostgreSQL = Firebase Auth)
- [ ] No duplicate emails
- [ ] All Firestore documents have corresponding Auth users
- [ ] All legacy IDs preserved in legacyPostgresId field
- [ ] Sample data spot-check passed (5 random users)

## Commit ID
[hash]

## Go/No-Go for Step 4
[✅ GO / 🔴 NO-GO with reasoning]
```

#### GitHub Commit Requirements

**Commit Message Format:**
```
feat(migration): run full Postgres → Firestore migration + send reset emails

Step 3 of Phase 1 Go-Live Track.

Migration Summary:
- Migrated 58 users from PostgreSQL to Firebase Auth
- Created 58 Firestore user documents
- Sent 58 password reset emails

Scripts executed:
- scripts/audit-users-pre-migration.ts
- scripts/migrate-to-firestore.ts
- scripts/verify-user-migration.ts
- scripts/send-migration-password-resets.ts

Verification:
- ✅ All users exist in Firebase Auth
- ✅ All user documents in Firestore
- ✅ Data integrity validated
- ✅ Password reset emails sent

Related: Phase 1 Step 3 - User Migration
Next: Step 4 - Remove legacy NextAuth + PostgreSQL

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Acceptance Criteria

- [ ] 58 users migrated to Firebase Auth
- [ ] 58 Firestore user documents created
- [ ] 58 password reset emails sent successfully
- [ ] Zero migration errors (or all errors resolved)
- [ ] Data integrity verified (spot-check 5 random users)
- [ ] Mini-AAR 193 created with migration evidence
- [ ] Git commit made with migration summary
- [ ] No blockers identified for Step 4

---

### STEP 4: Remove Legacy NextAuth + PostgreSQL Code

**Duration:** 1–2 hours
**Dependencies:** Steps 1, 2, 3 complete
**Criticality:** 🟡 MEDIUM - Cleanup for production readiness

#### What Claude Must Do

1. **Delete NextAuth Files**
   ```bash
   # Files to delete:
   rm src/lib/auth.ts
   rm src/app/api/auth/[...nextauth]/route.ts

   # Verify no imports remain:
   grep -r "from '@/lib/auth'" src/
   grep -r "next-auth" src/
   ```

2. **Remove Prisma Dependencies**
   ```bash
   # Files to delete:
   rm -rf prisma/
   rm src/lib/prisma.ts

   # Remove from package.json:
   npm uninstall prisma @prisma/client

   # Verify no imports remain:
   grep -r "@prisma/client" src/
   grep -r "from '@/lib/prisma'" src/
   ```

3. **Remove PostgreSQL Environment Variables**
   ```bash
   # Update .env.example:
   # - Remove DATABASE_URL
   # - Remove NEXTAUTH_SECRET
   # - Remove NEXTAUTH_URL

   # Update README/docs to remove PostgreSQL setup instructions
   ```

4. **Comment Out Cloud SQL Infrastructure**
   ```bash
   # Update .github/workflows/deploy.yml:
   # - Remove DATABASE_URL secret injection
   # - Remove NEXTAUTH_SECRET secret injection

   # Note: Keep Cloud SQL instance for now (can delete manually later)
   # Add comment: "# Cloud SQL deprecated - migrate to Firestore complete"
   ```

5. **Archive Migration Scripts**
   ```bash
   # DO NOT DELETE migration scripts (audit trail)
   # Move to archive:
   mkdir -p scripts/archive/migration
   mv scripts/migrate-to-firestore.ts scripts/archive/migration/
   mv scripts/audit-users-pre-migration.ts scripts/archive/migration/

   # Add README:
   echo "Migration scripts archived for audit purposes" > scripts/archive/migration/README.md
   ```

6. **Remove Deprecated API Routes**
   ```bash
   # Files to delete:
   rm src/app/api/auth/forgot-password/route.ts  # If using NextAuth
   rm src/app/api/auth/reset-password/route.ts   # If using NextAuth

   # Keep Firebase Auth routes:
   # - src/app/api/auth/register/route.ts (uses Firebase)
   ```

#### Cleanup Checklist

**File Deletions:**
- [ ] `src/lib/auth.ts` (NextAuth config)
- [ ] `src/app/api/auth/[...nextauth]/route.ts`
- [ ] `src/lib/prisma.ts`
- [ ] `prisma/` directory (entire folder)
- [ ] Any other NextAuth-specific routes

**Package Removals:**
- [ ] `next-auth` uninstalled
- [ ] `@prisma/client` uninstalled
- [ ] `prisma` (dev dependency) uninstalled
- [ ] `bcrypt` uninstalled (only used by NextAuth)

**Environment Variable Cleanup:**
- [ ] `DATABASE_URL` removed from .env.example
- [ ] `NEXTAUTH_SECRET` removed from .env.example
- [ ] `NEXTAUTH_URL` removed from .env.example
- [ ] Deployment workflow updated (no DB secrets)

**Code Verification:**
- [ ] Zero imports of `next-auth`
- [ ] Zero imports of `@prisma/client`
- [ ] Zero imports from `@/lib/auth`
- [ ] Zero imports from `@/lib/prisma`
- [ ] No references to `getServerSession`
- [ ] No references to `useSession` (NextAuth)

#### Mini-AAR Requirements

**Document:** `000-docs/194-AA-MAAR-phase1-step4-legacy-removal.md`

**Required Contents:**
```markdown
# Phase 1 Step 4: Legacy NextAuth + PostgreSQL Removal - Mini AAR

## Files Deleted

### NextAuth
- src/lib/auth.ts (97 lines)
- src/app/api/auth/[...nextauth]/route.ts (4 lines)
- [List any other NextAuth files]

### Prisma
- src/lib/prisma.ts (XX lines)
- prisma/ (entire directory, XX files)
- [List all Prisma-related deletions]

## Packages Uninstalled

```bash
npm uninstall next-auth @prisma/client prisma bcrypt
```

**Removed from package.json:**
- next-auth@5.0.0-beta.29
- @prisma/client@6.16.3
- prisma@6.16.3
- bcrypt@5.x.x

## Import Replacements

### Files Modified
[Table of files that had imports replaced]
| File | Old Import | New Import |
|------|-----------|-----------|
| src/app/dashboard/layout.tsx | `import { auth } from '@/lib/auth'` | `import { adminAuth } from '@/lib/firebase/admin'` |

### Verification
```bash
# No NextAuth references
$ grep -r "next-auth" src/
[No results]

# No Prisma references
$ grep -r "@prisma/client" src/
[No results]
```

## Environment Variable Cleanup

**Removed from .env.example:**
```diff
- DATABASE_URL="postgresql://..."
- NEXTAUTH_SECRET="..."
- NEXTAUTH_URL="http://localhost:3000"
```

**Deployment Workflow Updated:**
```diff
- --set-secrets "DATABASE_URL=DATABASE_URL:latest"
- --set-secrets "NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest"
```

## Migration Scripts Archived

**Location:** `scripts/archive/migration/`

**Files Preserved:**
- migrate-to-firestore.ts
- audit-users-pre-migration.ts
- verify-user-migration.ts
- send-migration-password-resets.ts
- README.md (audit trail documentation)

**Reason:** Regulatory compliance, audit trail, historical reference

## TODOs for Future Cleanup

- [ ] Delete Cloud SQL instance manually (after 30-day grace period)
- [ ] Remove PostgreSQL credentials from GCP Secret Manager
- [ ] Archive PostgreSQL backups to cold storage

## Commit ID
[hash]

## Go/No-Go for Step 5
[✅ GO / 🔴 NO-GO with reasoning]
```

#### GitHub Commit Requirements

**Commit Message Format:**
```
chore(cleanup): remove NextAuth + Prisma and finalize Firebase-only stack

Step 4 of Phase 1 Go-Live Track.

Deleted:
- NextAuth configuration (src/lib/auth.ts)
- NextAuth API routes
- Prisma ORM files
- PostgreSQL connection code

Uninstalled:
- next-auth@5.0.0-beta.29
- @prisma/client@6.16.3
- prisma@6.16.3
- bcrypt@5.x.x

Archived:
- Migration scripts moved to scripts/archive/migration/
- Audit trail preserved for compliance

Verification:
- ✅ Zero NextAuth imports remain
- ✅ Zero Prisma imports remain
- ✅ All dashboard pages use Firebase
- ✅ Environment variables cleaned

Related: Phase 1 Step 4 - Legacy Removal
Next: Step 5 - Deploy to Firebase Hosting

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Acceptance Criteria

- [ ] All NextAuth files deleted
- [ ] All Prisma files deleted
- [ ] All packages uninstalled
- [ ] Zero NextAuth/Prisma imports remain (verified)
- [ ] Migration scripts archived (not deleted)
- [ ] Environment variables cleaned
- [ ] Deployment workflow updated
- [ ] Mini-AAR 194 created
- [ ] Git commit made with cleanup summary
- [ ] No blockers identified for Step 5

---

### STEP 5: Deploy to Firebase Hosting (First True Production Deploy)

**Duration:** 1–2 hours
**Dependencies:** Steps 1, 2, 3, 4 complete
**Criticality:** 🔴 CRITICAL - Go-live moment

#### What Claude Must Do

1. **Optimize Next.js Build for Firebase Hosting**
   ```bash
   # Update next.config.js:
   # - Ensure output: 'export' for static pages
   # - Configure Firebase rewrites for dynamic routes
   # - Optimize images for Cloud Storage
   # - Enable compression

   # Verify firebase.json configuration:
   # - Hosting rewrites to Cloud Run (if hybrid)
   # - Custom headers (security, caching)
   # - Redirects (HTTP → HTTPS)
   ```

2. **Build Production Bundle**
   ```bash
   # Clean build:
   rm -rf .next out

   # Production build:
   npm run build

   # Verify build output:
   ls -la out/  # or .next/ if SSR

   # Check bundle size:
   npx next-bundle-analyzer
   ```

3. **Deploy Firebase Hosting**
   ```bash
   # Deploy hosting:
   firebase deploy --only hosting --project hustleapp-production

   # Expected output:
   # ✔ hosting[hustleapp-production]: deployed
   # Hosting URL: https://hustleapp-production.web.app
   ```

4. **Deploy Firebase Functions**
   ```bash
   # Build functions:
   cd functions
   npm run build

   # Deploy functions:
   firebase deploy --only functions --project hustleapp-production

   # Expected output:
   # ✔ functions[sendWelcomeEmail]: deployed
   ```

5. **Smoke Test Production Deployment**

   **Test 1: Registration Flow**
   ```bash
   # Manual test:
   1. Go to https://hustleapp-production.web.app/register
   2. Fill form with test data
   3. Submit
   4. Expected: Success message, email sent
   5. Check Firebase Console for new user
   6. Check email inbox for welcome email
   ```

   **Test 2: Login Flow**
   ```bash
   # Manual test:
   1. Go to https://hustleapp-production.web.app/login
   2. Enter test credentials
   3. Submit
   4. Expected: Redirect to /dashboard
   5. Verify dashboard loads
   ```

   **Test 3: Player CRUD**
   ```bash
   # Manual test:
   1. In dashboard, create new player
   2. Expected: Player appears in list
   3. Edit player details
   4. Expected: Changes saved
   5. Delete player
   6. Expected: Player removed
   7. Check Firestore Console to verify data
   ```

   **Test 4: Game CRUD**
   ```bash
   # Manual test:
   1. In dashboard, log new game
   2. Expected: Game appears in list
   3. Edit game stats
   4. Expected: Changes saved
   5. Delete game
   6. Expected: Game removed
   7. Check Firestore Console to verify data
   ```

   **Test 5: Firestore Security Rules**
   ```bash
   # Attempt unauthorized access:
   # - Try to read another user's data (should fail)
   # - Try to write without auth (should fail)
   # - Try to delete another user's player (should fail)

   # Expected: All unauthorized actions blocked by rules
   ```

6. **Monitor Cloud Logging**
   ```bash
   # Check function logs:
   gcloud functions logs read sendWelcomeEmail \
     --region us-central1 \
     --project hustleapp-production \
     --limit 50

   # Check for errors:
   gcloud logging read "severity>=ERROR" \
     --project hustleapp-production \
     --limit 50
   ```

7. **Verify Sentry Integration**
   ```bash
   # Check Sentry dashboard:
   # - Verify events being captured
   # - Confirm no critical errors
   # - Check performance monitoring
   ```

#### Deployment Checklist

**Pre-Deployment:**
- [ ] All Step 1-4 acceptance criteria met
- [ ] Build completes without errors
- [ ] Bundle size optimized (< 500KB initial load)
- [ ] Firebase Hosting config verified
- [ ] Cloud Functions built successfully

**Deployment:**
- [ ] Firebase Hosting deployed
- [ ] Cloud Functions deployed
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] CDN cache warmed

**Post-Deployment:**
- [ ] Smoke tests passed (all 5 tests)
- [ ] No critical errors in Cloud Logging
- [ ] Sentry capturing events correctly
- [ ] Performance metrics acceptable (< 2s load time)

#### Mini-AAR Requirements

**Document:** `000-docs/195-AA-MAAR-phase1-step5-production-deploy.md`

**Required Contents:**
```markdown
# Phase 1 Step 5: First Firebase Production Deployment - Mini AAR

## Deployment Summary

### Build Information
- Build Time: [duration]
- Bundle Size: [size]
- Build Warnings: [count]
- Build Errors: 0

### Deployment Logs

**Firebase Hosting:**
```
[Paste firebase deploy --only hosting output]
```

**Cloud Functions:**
```
[Paste firebase deploy --only functions output]
```

### URL Verification

**Production URLs:**
- Hosting: https://hustleapp-production.web.app
- Custom Domain: [if configured]
- Cloud Run: [if hybrid]

**URL Checks:**
- [ ] HTTPS enforced
- [ ] SSL certificate valid
- [ ] CDN headers present
- [ ] No mixed content warnings

## Smoke Test Results

### Test 1: Registration Flow
**Status:** [✅ PASS / ❌ FAIL]
**Details:**
- Navigated to /register
- Filled form with test@example.com
- Submitted form
- Result: [Success message / Error]
- Firebase Console: User created with UID [uid]
- Email received: [Yes/No]

### Test 2: Login Flow
**Status:** [✅ PASS / ❌ FAIL]
**Details:**
- Navigated to /login
- Entered test credentials
- Submitted form
- Result: [Redirected to /dashboard / Error]
- Dashboard loaded: [Yes/No]

### Test 3: Player CRUD
**Status:** [✅ PASS / ❌ FAIL]
**Details:**
- Created player: [Player name]
- Player appeared in list: [Yes/No]
- Edited player: [Changes made]
- Changes saved: [Yes/No]
- Deleted player: [Yes/No]
- Firestore verified: [Yes/No]

### Test 4: Game CRUD
**Status:** [✅ PASS / ❌ FAIL]
**Details:**
- Logged game: [Game details]
- Game appeared in list: [Yes/No]
- Edited game stats: [Changes made]
- Changes saved: [Yes/No]
- Deleted game: [Yes/No]
- Firestore verified: [Yes/No]

### Test 5: Firestore Security Rules
**Status:** [✅ PASS / ❌ FAIL]
**Details:**
- Attempted unauthorized read: [Blocked/Allowed]
- Attempted unauthenticated write: [Blocked/Allowed]
- Attempted cross-user delete: [Blocked/Allowed]
- All unauthorized actions blocked: [Yes/No]

## Cloud Logging Snapshots

### Function Execution Logs
```
[Paste sendWelcomeEmail logs]
```

### Error Logs
```
[Paste any ERROR severity logs]
[If none: "No errors detected"]
```

### Performance Metrics
- Average response time: [ms]
- 95th percentile: [ms]
- Error rate: [%]

## Sentry Verification

**Dashboard:** [Sentry project URL]

**Metrics:**
- Events captured: [count]
- Error rate: [%]
- Performance score: [score]
- Critical issues: [count]

**Status:** [✅ All systems normal / ⚠️ Issues detected]

## Deployment Fingerprint

**Commit ID:** [hash]
**Deploy Timestamp:** [ISO timestamp]
**Firebase Hosting Version:** [version]
**Cloud Functions Version:** [version]

## Production Readiness Assessment

### Technical Readiness
- [ ] All smoke tests passed
- [ ] No critical errors in logs
- [ ] Performance within targets
- [ ] Security rules enforced
- [ ] Monitoring active

### Business Readiness
- [ ] 58 users migrated and can reset passwords
- [ ] Dashboard fully functional
- [ ] CRUD operations working
- [ ] Email notifications sending
- [ ] No data loss incidents

## Go-Live Decision

**Status:** [✅ READY FOR CUSTOMERS / 🔴 NOT READY]

**Reasoning:**
[Explanation of go-live decision]

**Next Actions:**
[What happens next - customer onboarding, marketing, etc.]
```

#### GitHub Commit Requirements

**Commit Message Format:**
```
chore(deploy): first Firebase production deployment + smoke tests

Step 5 of Phase 1 Go-Live Track - PRODUCTION GO-LIVE

Deployment Summary:
- ✅ Firebase Hosting deployed to hustleapp-production.web.app
- ✅ Cloud Functions deployed (sendWelcomeEmail)
- ✅ All smoke tests passed (5/5)
- ✅ Zero critical errors in Cloud Logging
- ✅ Sentry monitoring active

Smoke Tests:
- ✅ Registration flow working
- ✅ Login flow working
- ✅ Player CRUD operational
- ✅ Game CRUD operational
- ✅ Firestore security rules enforced

Performance:
- Initial load time: [X]s
- Bundle size: [X]KB
- No console errors

Production Readiness: ✅ READY FOR CUSTOMER ONBOARDING

Related: Phase 1 Complete - Go-Live Track
Status: 🚀 PRODUCTION LIVE

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Acceptance Criteria

- [ ] Firebase Hosting deployed successfully
- [ ] Cloud Functions deployed successfully
- [ ] All 5 smoke tests passed
- [ ] Zero critical errors in Cloud Logging
- [ ] Sentry integration verified
- [ ] Performance within targets (< 2s load time)
- [ ] Security rules enforced
- [ ] Mini-AAR 195 created
- [ ] Git commit made with deployment evidence
- [ ] **PRODUCTION READY FOR CUSTOMER ONBOARDING**

---

## Phase 1 Completion Criteria

### All Steps Complete
- [x] Step 1: Firebase Auth provider enabled
- [x] Step 2: Dashboard migrated (11 pages)
- [x] Step 3: Users migrated (58 accounts)
- [x] Step 4: Legacy code removed
- [x] Step 5: Production deployed

### Documentation Complete
- [x] Mini-AAR 191 (Step 1)
- [x] Mini-AAR 192 (Step 2)
- [x] Mini-AAR 193 (Step 3)
- [x] Mini-AAR 194 (Step 4)
- [x] Mini-AAR 195 (Step 5)

### Production Verification
- [x] Application live at https://hustleapp-production.web.app
- [x] All auth flows working
- [x] All CRUD operations working
- [x] 58 users can reset passwords and log in
- [x] No critical errors
- [x] Monitoring active

### Technical Debt Cleared
- [x] Zero NextAuth dependencies
- [x] Zero Prisma dependencies
- [x] Zero PostgreSQL connections
- [x] All dashboard pages on Firebase
- [x] All data in Firestore

---

## Success Metrics

| Metric | Target | Phase 1 Result |
|--------|--------|----------------|
| Dashboard pages migrated | 11 | [Count] |
| Users migrated | 58 | [Count] |
| Password reset emails sent | 58 | [Count] |
| Smoke tests passed | 5/5 | [Count/5] |
| Critical errors | 0 | [Count] |
| Production deployment | Success | [Status] |
| Customer onboarding ready | Yes | [Yes/No] |

---

## Post-Phase 1 Status

**The Hustle application is now:**
- ✅ Using Firebase Auth for authentication
- ✅ Using Firestore for all data storage
- ✅ Using Firebase Cloud Functions for backend logic
- ✅ Deployed to Firebase Hosting
- ✅ Free of NextAuth dependencies
- ✅ Free of Prisma/PostgreSQL dependencies
- ✅ Passing CI/CD gates
- ✅ Production-capable for customer onboarding
- ✅ Monitored via Sentry and Cloud Logging
- ✅ Secured with Firestore security rules

**Ready for:**
- Customer onboarding
- Marketing campaigns
- Production traffic
- Revenue generation

---

**Timestamp:** 2025-11-15T23:30:00Z
**Status:** READY FOR EXECUTION
**Next Phase:** Phase 2 - Customer Onboarding & Growth (separate plan)
