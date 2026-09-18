# Auth.js migration gaps exposed by the blocked credential repair

## Evidence and history

The September 7 credential scrub remained in PR49 because its required pre-merge
checks failed. Correcting the two mode-dependent unit tests exposed an undeclared
Playwright dependency. Restoring that dependency exposed obsolete Firebase test
fixtures and actual application migration failures, rather than just test drift.
Historical entries remain unchanged; this report records the corrective work.

At 20:31:56 UTC on September 13, an actual isolated registration, token verification
and browser sign-in reached the player-creation API, which returned a missing
workspace error. The SQLite registration path created only the user and token,
whereas the documented Phase5/6 contract requires an owner workspace, membership
and default pointer. Before correcting the request guard, the same successful
credentials login redirected back to login because `src/proxy.ts` still required
the former Firebase cookie.

The old request guard rejected a real encrypted Auth.js cookie (307 instead of
200) and accepted an arbitrary Firebase cookie (200 instead of307). Both behaviors
are reproduced from exact source `2eb532e3`; route-level database authorization
remained separate, so this evidence does not establish unauthorized data access.
Thirteen cryptographic proxy tests cover HTTP/HTTPS, chunking, expired/forged
cookies, return paths, public routes and unavailable configuration.

A separate fake-clock regression reproduces a login form left disabled indefinitely
when the credentials request never returns. The former browser test intercepted
an unused Firebase endpoint and therefore did not exercise that failure. The
corrected test intercepts the real Auth.js credentials callback and verifies the
15-second user-facing timeout. Network errors clear loading state without exposing
internal diagnostics. External callback destinations are refused.

The first full production-built replay then proved another independent login defect.
Successful sign-in called `router.push()` and immediately queued a redundant
`router.refresh()`, behavior introduced by the May 24 Phase 4-7 migration merge
(`757d32fe`). That refresh could finish after the user had already navigated farther
into the dashboard, remount the current page and discard game-form input. Three
sequential cases failed with the athlete or position reset. Removing the redundant
refresh and waiting for the route animation boundary makes all three pass against a
fresh production build.

## Corrective design

The request guard decrypts Auth.js cookies without a database lookup; protected
handlers still authorize against the authenticated user and persisted data.
Registration commits the user, verification token, workspace, owner membership
and pointer atomically. Verified sign-in reconciles unambiguous migrated orphan
accounts idempotently, preserving existing subscriptions and original trial dates.
Ambiguous tenant ownership fails visibly rather than choosing another account.

Browser tests use a fresh private SQLite database in a guarded
`$TMPDIR/hustle-e2e-db-*` directory, outside Next/Turbopack's watched source tree;
reports and browser artifacts remain below `03-Tests/e2e/.runtime/run-*`. Drizzle
migrations finish before parallel Next build workers start. Fixture registration
uses the real API, retrieves the real token only from that isolated database and
exercises the actual verification API. Email credentials inherited from a developer
shell are cleared in the test child; no customer database or external mail transport
participates. Global teardown refuses paths outside the guarded prefix before removing
the fixture database. A failed build stops the test server. Source-built production
server, migrations and static assets are required, and a preexisting server cannot
satisfy fixture readiness.

The fixture database, session state, traces and screenshots are excluded from Docker
images. Browser diagnostics no longer print Set-Cookie headers or API bodies. Existing
player/game scenarios are adapted to the current form while retaining persistence,
validation and positional-stat requirements. The game fixture waits for client-route
transition trees to settle before entering uncontrolled form values; this reproduces
and fixes the prior position, athlete and score reset between sequential actions.

The build also exposed two independent source-discovery defects. Tailwind v4 scanned a
repository-root symlink outside the project and Turbopack panicked; the stylesheet now
scopes automatic discovery to `src/`. Runtime upload paths are marked as external to
Turbopack tracing, and Next's framework-controlled dynamic-render exceptions are
re-thrown before application error handling. These changes prevent whole-project file
tracing and false authentication-error logs during a production build.

The declared integration command previously selected zero tests, and CI explicitly
ignored its failure. The transactional SQLite registration/workspace suite now owns the
integration lane, the retired Firebase-emulator setup is removed, and CI treats that
lane as blocking. Type checking, unit tests and the Chromium replay are blocking CI
gates as well; their former `continue-on-error` exceptions are removed. Deprecated
Vitest pool configuration and the obsolete path-scanning plugin were removed.

## Replay and validation

Run from the repository root with its pinned dependencies installed:

```bash
npm ci
npx playwright install --with-deps chromium
npm run test:unit -- --maxWorkers=2
CI=true npm run test:e2e -- --project=chromium
npm run lint
npx tsc --noEmit
bash scripts/test-docker-context.sh
```

Private incident logs retain every failing attempt and subsequent result. The final
classification passes 858 unit tests and 16 SQLite integration tests. Fifteen focused
proxy/login tests pass, with two old-proxy failures and the old login-timeout failure
reproduced. Seven sequential game/auth browser cases pass after the route-settlement
repair. The first complete production-built Chromium replay passed 82 of 87 cases and
exposed the three refresh races plus two assertions for the former Auth.js error text.
After correcting the control flow and privacy-preserving generic error assertions, the
14-case game/login production-built replay passes. The final production-built Chromium
replay then passes all 87 cases sequentially in 6.5 minutes with retries disabled. Final
source commit, hosted CI and deployed verification remain pending until recorded in the
incident closure evidence.

The September 13 dependency census still reports 35 advisories: 4 critical, 13 high,
15 moderate and 3 low. This branch does not claim those are resolved; remediation and
production reachability analysis are tracked separately in Intent OS bead
`spine-ah3.13` so the auth recovery is not hidden behind an unreviewed dependency jump.

## Deployment and rollback

Use the existing VPS deployment workflow after required CI passes. Preserve the
online SQLite backup and exact environment, Compose and image captured before
cutover. No destructive schema migration is needed. Reverting application code
must retain existing account/workspace records and must never restore exposed
credential literals. Runtime mail recovery is independently covered by the SMTP
runbook and requires functional TLS/authentication verification in addition to
liveness. The public production check is distinct from this isolated replay.
