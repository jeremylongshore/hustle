# Release v3.3.0

**Release Date**: 2026-09-24

## Changes since v3.2.2

- chore: release v3.3.0 [skip ci] (975bb6ab)
- feat(marketing): add AI-search About page (#75) (10992aff)

---

# Release v3.2.2

**Release Date**: 2026-09-24

## Changes since v3.2.1

- chore: release v3.2.2 [skip ci] (715c7a0f)
- fix(analytics): measure public Hustle landing visits (#74) (571836b1)

---

# Release v3.2.1

**Release Date**: 2026-09-20

## Changes since v3.2.0

- chore: release v3.2.1 [skip ci] (adf9a55f)
- Merge pull request #72 from jeremylongshore/fix/p1-settings-real-profile (0297a678)
- fix(settings): show the real parent profile and make Save actually save (c221a064)

---

# Release v3.2.0

**Release Date**: 2026-09-20

## Changes since v3.1.1

- chore: release v3.2.0 [skip ci] (b7ccc248)
- Merge pull request #70 from jeremylongshore/feat/p1-cosign-verifications (f555ef60)
- fix(db): set a SQLite busy timeout so parallel build workers stop colliding on migrations (39856f66)
- feat(verified-stats): record named parent co-signatures on games (co-sign slice 1) (c9475211)

---

# Release v3.1.1

**Release Date**: 2026-09-20

## Changes since v3.1.0

- chore: release v3.1.1 [skip ci] (5e5bd614)
- fix(deploy): pass HUSTLE_INTERNAL_TOKEN into the container so trial reminders stop returning 401 (#71) (15625502)

---

# Release v3.1.0

**Release Date**: 2026-09-19

## Changes since v3.0.0

- chore: release v3.1.0 [skip ci] (3837e303)
- Merge pull request #69 from jeremylongshore/feat/p1-delete-export (2a85b4ed)
- feat(privacy): parents can delete their account and export all their data (d2d98d5a)

---

# Release v3.0.0

**Release Date**: 2026-09-19

## Changes since v2.3.0

- chore: release v3.0.0 [skip ci] (8c8372f0)
- ci(deps): move GitHub actions off the node20 runtime before its removal (#68) (a50ae08c)

---

# Release v2.3.0

**Release Date**: 2026-09-19

## Changes since v2.2.3

- chore: release v2.3.0 [skip ci] (97f8bad1)
- Merge pull request #66 from jeremylongshore/feat/p1-query-ownership (b010e574)
- feat(security): enforce athlete ownership in the query layer, not just in routes (bfacede7)

---

# Release v2.2.3

**Release Date**: 2026-09-18

## Changes since v2.2.2

- chore: release v2.2.3 [skip ci] (3b604c0e)
- Merge pull request #65 from jeremylongshore/docs/audit-286-refresh (ca93010b)
- docs(audit): mark the access-control fix as deployed in the 286 summary (62da056d)
- docs(audit): refresh 286 status lines after #59-#64 merged and fix list spacing (2c884611)

---

# Release v2.2.2

**Release Date**: 2026-09-18

## Changes since v2.2.1

- chore: release v2.2.2 [skip ci] (db8bfae6)
- Merge pull request #64 from jeremylongshore/docs/appaudit-ravi-onboarding (84bcb6af)
- docs(audit): update 286 for the merged P0 and security PRs and the release-tag fix (88d67d3b)
- docs(audit): record the local E2E result (87/87 passed) in 286 (75720706)
- docs(audit): close the 286 gaps with coverage, measured latency, and a full route inventory (28a3d972)
- docs: add operator-grade audit and onboarding playbook (286) for new contributors (d2d07099)

---

# Release v2.2.1

**Release Date**: 2026-09-18

## Changes since v2.2.0

- chore: release v2.2.1 [skip ci] (3da2831f)
- Merge pull request #63 from jeremylongshore/fix/auth-url-public-origin (66bb4c09)
- fix(auth): set AUTH_URL to the public origin so Auth.js stops emitting https://0.0.0.0:8084 URLs (7bb9af91)

---

# Release v2.2.0

**Release Date**: 2026-09-18

## Changes since v2.1.1

- chore: release v2.2.0 [skip ci] (7ed6907c)
- Merge pull request #60 from jeremylongshore/feat/sqlite-rate-limits (8173bc2a)
- fix(security): restrict the E2E rate-limit scale to per-IP rules only (acaaca95)
- feat(security): add SQLite-backed rate limits to login, signup, password reset, and PIN (73c7f6e3)

---

# Release v2.1.1

**Release Date**: 2026-09-18

## Changes since v2.1.0

- chore: release v2.1.1 [skip ci] (bfe9b182)
- Merge pull request #61 from jeremylongshore/chore/npm-audit-fixes (dbda0972)
- fix(deps): patch every critical and high npm audit finding (Next 16.3.5, Auth.js) (17e8177d)

---

# Release v1.0.0

**Release Date**: 2026-09-18

## Changes since v0.0.0

- chore: release v1.0.0 [skip ci] (877893e6)
- Merge pull request #59 from jeremylongshore/chore/p0-repo-reset (2520dd1b)
- Merge pull request #62 from jeremylongshore/fix/admin-fail-closed (c587a4eb)
- fix(security): remove debug, hello, and test-post API routes from production (760a51f1)
- docs(security): update admin route headers to describe the fail-closed check (ce5399f3)
- fix(security): make the admin allow-list fail closed and read it from ADMIN_USER_IDS (bb4d06eb)
- chore(beads): record restore-proof bead close (3f516c8d)
- refactor(billing): derive UI plan limits from the enforced plan-mapping table (105ce5cd)
- fix(ci): find the previous release tag reliably so Release stops failing on main (fa91f1cb)
- chore(repo): remove dead side projects, orphaned routes, and Firebase-era naming (fc72c64d)
- bd init: initialize beads issue tracking (e5e81a05)
- Merge pull request #51 from jeremylongshore/docs/reboot-archive-and-vision (ed4be827)
- docs: re-center reboot plan on the one-stop athlete app; add competitive and safety research (0cfc6b52)
- docs: archive pre-reboot docs and add reboot vision, roadmap, monetization, store pathway (878481ee)
- Merge pull request #50 from jeremylongshore/fix/mxroute-application-mail (5da182ed)
- merge main into SMTP readiness remediation (9b0699a1)
- Merge pull request #49 from jeremylongshore/fix/purge-leaked-credentials-from-tracked-docs (72237b40)
- test(games): await animated validation feedback (8718d53e)
- fix(auth): finish the Auth.js workspace migration (2aeab987)
- fix(email): restore approved SMTP delivery and functional readiness (3bbc2ade)
- security: prevent repeated credential exposure and complete scrub validation (2eb532e3)
- fix(security): redact the live NextAuth, Resend and Groq credentials from tracked files (922b66e7)
- chore(funding): add Ko-fi alongside the existing funding sources (1f2630b8)
- docs(readme): add the Ko-fi support badge (ce560193)
- security: scrub committed Firebase web key from tracked files + rotation inventory (#48) (4bce0ee5)
- chore(mobile): archive the dormant, Firebase-dependent mobile app (#47) (a44efee3)
- chore(ci): bump pinned jeremylongshore/.github vps-deploy SHA → 53d6be3 (#46) (da4bdca9)
- fix(proxy): allow /api/internal/* through cookie-redirect guard (#45) (7a7303c8)
- P7 Stage C — finish Hustle migration (Phases 4+4.5+5+6+7) (#44) (757d32fe)
- chore(ci): remove gemini-code-review workflow (cloud-via-Vertex) (#43) (b46fe393)
- chore(beads): gitignore credential key + dolt runtime files (4a6b0b20)
- feat(vps): Phase 2 — Docker skeleton + VPS deploy workflow (#40) (9ffc28c8)
- feat: add Fuel Station meal logging module to Dream Gym (36dc7d3a)
- fix: resolve ESLint error - move ref assignment out of render (471eb1ed)
- feat: wire Dream Gym schedule + cardio to real Firestore data (06e89bdf)
- feat: wire all pages to real Firestore data + animated breathing guide (255c76b1)
- fix: correct result casing in log-game to match API schema (483a8047)
- fix: wire add-athlete to real API + fix schedule event button (b085a808)
- feat: season schedule + wire workout/practice logs to real API (578ae366)
- fix: clear Firebase Auth photoURL with null instead of empty string on delete (f7e28cfc)
- feat: add user profile photo upload + fix iOS Safari rendering and Google auth (03bd3f2a)
- feat: remove all mock data and wire dashboard to real Firestore (2b65d742)
- fix: remove old v1 homepage so v2 landing page renders (ef767303)
- fix(hosting): update Firebase public dir to trigger hosting redeploy (e75dfa3b)
- fix(build): lazy-init Resend client to avoid build-time crash (e76aa7eb)
- fix(deploy): add standalone output and unblock CI/CD pipeline (2ec2ee90)
- fix(ci): add missing test scripts and unblock E2E step (08990bd7)
- fix(build): resolve all merge conflicts blocking CI/CD pipeline (650af5ff)
- fix(ci): downgrade pre-existing lint violations to warnings so CI passes (6f2b1465)
- Merge branch 'main' of github.com-work:intent-solutions-io/hustle (9e5c9f82)
- Hustle v2.0 - Complete rebuild (98d20c23)
- chore: update FUNDING.yml with GitHub Sponsors + Buy Me a Coffee (69d6500e)
- chore: add GitHub Sponsors funding button (dea07d42)
- feat: initial commit (c8ae8074)
- Fix/remove otel deadlock (#39) (486b823b)
- Fix sign-in hang and athlete positions (#36) (43f0674a)
- feat(ci): upgrade Gemini code review to official CLI with inline comments (#38) (17339996)
- fix(auth): remove OTel deadlock causing login hang (#37) (6e518dc0)
- fix(ci): add Playwright install to pre-merge validation workflow (653885d3)
- fix(auth): clear firebase-auth-token fallback cookie on logout (34a9c5c6)
- fix(auth): remove OTel deadlock causing login POST to hang permanently (b88f9511)
- fix(auth): merge resilient login with fallback cookie + fix tsc (660048dc)
- fix(ui): collapse secondary positions on add-athlete for mobile usability (7cf6a67b)
- debug(auth): add diagnostic console.log to set-session to find hang point (532fb8af)
- fix(auth): disable OTel entirely — auto-instrumentations still deadlocking (9524a319)
- fix(auth): disable undici+gRPC OTel instrumentations causing login deadlock (087c2569)
- fix(auth): add timeout safety nets to prevent server hang during login (1bfee781)
- fix(auth): disable OTel HTTP instrumentation causing login deadlock (5e279372)
- fix(auth): resolve login 504 timeout caused by OTel instrumentation (34ad286a)
- fix(ci): resolve 3 CI/CD failures from integration test merge (4fbdf33b)
- test: add Firebase emulator-backed integration test suite (#35) (3c276c2c)
- feat(observability): add OpenTelemetry tracing and structured logging (#34) (c74e2e5b)
- test: add comprehensive unit test suite (1,104 tests across 53 files) (f60a4ce5)
- refactor(auth): consolidate to single cookie, single module, eliminate XSS-vulnerable fallback (d305e1bb)
- fix(auth): add 15s timeout to set-session POST to prevent indefinite hang (171dba87)
- chore: ignore beads last-touched file (d22cb8da)
- fix(auth): prevent AbortController from aborting session cookie POST during navigation (#31) (73811e65)
- docs(CLAUDE.md): improve architecture coverage and add build gotchas (#32) (ef7988b2)
- fix(auth): permanent login fix - set fallback cookie before awaiting session POST (bba60e4b)
- fix(ci): repair YAML syntax errors in 3 workflow files (#30) (19e5a924)
- fix(auth): make verify-email a universal Firebase action handler (a544b5ef)
- fix(auth): redirect trailing-space URLs from Firebase Console config (b93ad116)
- fix(auth): redirect password reset from verify-email page (cee13c32)
- fix(auth): client-side email verification & auth cleanup (#29) (8e5ab2e9)
- fix(auth): add continueUrl to password reset and timeout to session (04814b06)
- fix(auth): use client-side Firebase SDK for password reset (ef40bf66)
- fix(ci): use correct Dockerfile in CI build step (af5ce1f6)
- fix(auth): resolve forgot-password 504 timeout and add registration UX (d83b63da)
- fix(e2e): resolve all remaining test failures and flaky tests (848ef50d)
- feat: add Open Graph and Twitter Card meta tags for link previews (0d0d6bb0)
- fix: remove invalid gcloud flags from deploy (5ecb54c8)
- feat(landing): animated features section + new CTA background image (058876b9)
- fix(e2e): fix URL matching and false positive error detection in user journey tests (8cfa01ac)
- fix(e2e): resolve strict mode violation in dashboard heading locator (597c6fd0)
- fix(e2e): add longer timeout for dashboard heading visibility (579ffb34)
- fix(auth): simplify ProtectedRoute to trust middleware (d6e2945e)
- fix(auth): use ref for auth check complete flag to fix lint error (c4fb5d4c)
- fix(auth): trust session cookie in ProtectedRoute to fix E2E tests (efce3020)
- fix(auth): simplify to client-side auth like Perception (14bcfff8)
- fix: add startup CPU boost, session affinity, and health probes (906611dc)
- fix: increase Cloud Run resources to prevent container death (0b1e0606)
- ci: force fresh Cloud Run deployment (e89bfac9)
- fix: add POST verification to deployment pipeline (ff380ef3)
- ci: retry deployment after checkout failure (84cdec93)
- debug: add test-post to public routes and add logging (ec8d82a0)
- debug: add minimal POST endpoint to diagnose Cloud Run timeouts (669c647e)
- chore: force redeploy to fix POST request hanging (21dad517)
- fix(auth): add earlier debug check and body parsing timeout (e91835fe)
- fix(e2e): improve test robustness and fix league codes (b1449463)
- fix(auth): use Firebase session cookies instead of raw ID tokens (6095ad28)
- fix(auth): add debug endpoints to diagnose forgot-password hanging (18be2c80)
- fix(auth): fix password reset page to read oobCode + add tracks.jpg background (aa225471)
- fix(auth): use dynamic imports to prevent module-level hanging (f691834b)
- fix(auth): add timeout to password reset to prevent hanging (31e93470)
- chore: add GitHub issue templates (945977fb)
- fix(verify): add detailed error message for debugging (9d040b4d)
- fix(verify): use Admin SDK instead of client SDK to fix 504 timeout (6bd24d2e)
- fix(verify): add missing playerId to API request and fix background (cacacfa3)
- fix(verify): improve verify page UX with background and navigation (986bf8ec)
- fix(ai): add GOOGLE_CLOUD_PROJECT env var for Vertex AI strategy (e5ac1418)
- feat(ui): add media assets for homepage and auth pages (d28dc4b1)
- feat(dream-gym): fix Firestore subcollection queries and enhance mental page UI (436ef578)
- fix(ci): add E2E test credentials to CI workflows (8420e7fe)
- fix(dream-gym): remove duplicate closing braces in cardio and practice pages (e47f7635)
- Merge pull request #27 from intent-solutions-io/feature/dream-gym-cardio-practice-logs (291cebe7)
- Update src/app/api/players/[id]/cardio-logs/[logId]/route.ts (32cdff2b)
- Update src/app/dashboard/dream-gym/practices/page.tsx (0266b95a)
- Update src/app/dashboard/dream-gym/cardio/page.tsx (c5e9a077)
- feat(dream-gym): add cardio log, practice log, and fix AI strategy (7810554b)
- fix(auth): always return success for password reset (security) (#26) (fca3b618)
- fix(auth): improve EMAIL_NOT_FOUND detection in password reset (#25) (d2612437)
- fix(auth): handle EMAIL_NOT_FOUND error in password reset (#24) (333982a3)
- fix(auth): use correct origin for password reset URL (#23) (b1154b08)
- fix(api): use Admin SDK for waitlist, improve forgot-password logging (#22) (59453b4a)
- docs: add OSS readiness files (#21) (c01d3dcb)
- docs: update README Firestore collections to match actual schema (810a35f6)
- test(e2e): improve error capture and XSS test robustness (#20) (06d25226)
- fix(api): use Admin SDK for games route, standardize error responses (8a3dfd02)
- fix(e2e): fix player dropdown selector in complete-user-journey tests (c1f73753)
- fix(api): use Admin SDK for /api/players endpoint (cb436cac)
- fix(lint): remove unused variables from smoke test (45a2a5f6)
- fix(e2e): set NEXT_PUBLIC_E2E_TEST_MODE at server runtime, not just build (9e86601d)
- fix(ci): make email env vars optional in health check, skip auth tests in smoke test (3ca0d056)
- docs(claude): expand architecture docs with Dream Gym, middleware, and env vars (f400feb9)
- fix(e2e): use data-sidebar selector for navigation sidebar test (7a8c115f)
- fix(e2e): use JavaScript click for sidebar elements and fix league code (df888f10)
- fix(e2e): correct form selectors and add helper for player management tests (a992228f)
- chore: add test results to gitignore and remove from repo (57dc8d2d)
- fix(players): use conditional spreading for optional fields in Firestore document (c75da8ca)
- chore: trigger fresh CI build to verify no caching issues (55c205d9)
- fix(e2e): show detailed API error including status and response body (bf0d283b)
- fix(e2e): display actual error message in add-athlete form (d815ffc1)
- fix(e2e): show actual API error in add-athlete form (b3159e95)
- fix(e2e): improve error detection in complete-user-journey test (efd6dc5b)
- fix(e2e): add fallback provisioning and better error handling (af3d6368)
- fix(e2e): prevent storage state conflicts in tests that create own users (2f9a10c3)
- fix(players): populate legacy position field for E2E test compatibility (cb33d6ee)
- fix(test): update Stripe mock to use createPreview instead of retrieveUpcoming (0c87de34)
- fix(types): resolve remaining TypeScript errors for build pass (0684840d)
- fix: resolve TypeScript errors for Stripe SDK and Zod 4.x compatibility (ddb24d96)
- fix(e2e): use force click for sidebar logout button in headless mode (76e8f707)
- fix(e2e): improve auth tests robustness and skip email verification tests (8d917fb9)
- fix(e2e): position detection and auto-verify for E2E tests (e9634b33)
- fix(e2e): copy static files to standalone directory for production build (f3ffced2)
- fix(e2e): use standalone server for production build (output: standalone) (cee6303c)
- fix(e2e): use production build in CI to avoid Turbopack body consumption bug (1f193888)
- fix(middleware): exclude API routes from matcher to fix body consumption (ad21e936)
- fix(api): read request body BEFORE calling cookies() (53665460)
- fix(api): use request.text() for better JSON parsing debug (eb65c8dd)
- fix: improve error handling and skip visual regression in CI (d8c74e66)
- ci: add FIREBASE_SERVICE_ACCOUNT_JSON for reliable Admin SDK init (6236b96d)
- fix(e2e): clear storage state for unauthenticated route protection test (7284f0d8)
- Merge remote-tracking branch 'origin/main' into fix/e2e-secure-cookie (cf936ff8)
- fix(middleware): unify middleware to src/ and add comprehensive logging (3d7d68ec)
- fix(next15): await params before accessing properties in athlete page (a02168ab)
- fix(ssr): add force-dynamic to athlete pages for fresh data (c6946bd6)
- fix(e2e): improve athlete list navigation selectors (e3d894bc)
- fix(e2e): correct game form selectors to match actual UI (4297a2d3)
- fix(admin): include defaultWorkspaceId in getUserProfileAdmin (985cd03d)
- fix(test): fix Stripe/billing test mocks to work without env vars (#17) (2babe323)
- fix(e2e): improve E2E test reliability with shared auth state (#16) (6b65d17a)
- Merge pull request #15 from intent-solutions-io/feat/dream-gym-sprint7-tests (b5a53d3e)
- refactor(e2e): address Gemini Code Assist feedback on PR #15 (d9bf479e)
- test(e2e): add Dream Gym E2E tests (Sprint 7) (c65df280)
- Merge pull request #14 from intent-solutions-io/feat/dream-gym-sprint6-integration (04666461)
- refactor: address Gemini Code Assist feedback on PR #14 (ed54bcf0)
- feat(dream-gym): add AI Strategy integration to dashboard and athlete pages (9013dc39)
- feat(dream-gym): Sprint 5 - AI Workout Strategy Generation (#13) (1deda17e)
- feat(dream-gym): Sprint 4 - Biometrics & Fitness Assessments (#12) (eb45ae01)
- bd sync: 2025-12-30 12:53:39 (146300fb)
- fix(auth): add missing methods to adminAuth proxy (2c2e1d3b)
- fix(deploy): use FIREBASE_SERVICE_ACCOUNT_JSON for auth (eff69a85)
- fix(auth): increase session timeout and add Cloud Run min-instances (4b472ad8)
- fix(deploy): add FIREBASE_PROJECT_ID env var for server-side auth (6e273fe2)
- Merge pull request #8 from intent-solutions-io/feat/dream-gym-sprint3-analytics (db630dfe)
- Merge pull request #7 from intent-solutions-io/feat/dream-gym-sprint2-ui (7734288b)
- fix(dream-gym): address Gemini review feedback for progress analytics (5f1cf60b)
- Merge main into feat/dream-gym-sprint3-analytics (0a7a8e33)
- Merge main into feat/dream-gym-sprint2-ui (c6930ec0)
- fix(auth): add timeout handling to prevent login UI freeze (8cf29cd1)
- Merge pull request #6 from intent-solutions-io/feat/dream-gym-sprint1-foundation (81c4a5d4)
- chore: merge main to resolve conflicts (97267876)
- feat(dream-gym): Sprint 3 Analytics - Progress Charts & Stats Visualization (00341a50)
- fix(dream-gym): address Gemini Code Assist review feedback (eb0abeaa)
- feat(dream-gym): add Sprint 2 UI components for workout logging and journal (25dbbc4d)
- feat(dream-gym): add workout logging and journal foundation (Sprint 1) (ad8c964e)
- bd sync: 2025-12-29 02:17:52 (b62f5f99)
- bd sync: 2025-12-28 20:47:16 (a7ce8493)
- bd sync: 2025-12-28 20:29:26 (46a0e042)
- ci: default BILLING_ENABLED to false to unblock deploys (25ac098a)
- fix(auth): add Firebase config to Docker build for production signup (c75bab8a)
- docs: document E2E auth fix in synthetic QA plan (f02da488)
- ci: remove continue-on-error from E2E (now passing), make Docker non-blocking (f6bffc82)
- fix(auth): bypass email verification server-side in E2E test mode (6792a3e9)
- chore: add bounded CI checker script (2d088881)
- ci: make E2E tests non-blocking (known session issue in CI) (88c04006)
- fix(ci): move E2E test mode to job-level for build-time embedding (189be6b5)
- fix(auth): disable secure cookie in E2E tests (localhost HTTP) (788aa058)
- feat(qa): Synthetic QA harness improvements (#5) (28dd4cbc)
- bd sync: 2025-12-26 23:41:46 (be8a0520)
- Merge pull request #4 from intent-solutions-io/feature/dream-gym-mvp (5d5a7ea5)
- chore: merge main, resolve conflicts keeping Gemini type fixes (140c1c70)
- fix: address additional Gemini Code Assist review findings (54fbf06f)
- fix(auth): improve session cookie handling for E2E tests (856c32d1)
- feat(dream-gym): Complete Dream Gym MVP Feature (#3) (e41baaf7)
- chore: merge main and resolve conflicts (db716a90)
- fix: address Gemini code review findings (986ff9d5)
- ci: add Gemini Code Assist for PR reviews (ce3a7609)
- feat(dream-gym): complete Dream Gym MVP feature (f0aac91f)
- bd sync: 2025-12-25 21:42:15 (c3e0413c)
- feat(mobile): React Native mobile app for iOS & Android (#2) (548ad7fa)
- fix(auth): fix registration and build issues (9fcd7b9e)
- bd sync: 2025-12-25 19:56:33 (4aa3783e)
- docs: add Beads upgrade note (whats-new + hooks) (91b96626)
- chore: add Beads (bd) workflow + ignore beads source clone (d76b29fe)
- docs(mobile): comprehensive documentation suite (efa51bbb)
- feat(mobile): add branded app icons and CI/CD workflows (7ce15881)
- feat(mobile): complete React Native mobile app implementation (96f7c914)
- feat(mobile): React Native architecture and planning docs (6576168c)
- docs(ops): create comprehensive DevOps playbook with corrections (5c98fda5)
- docs: update README and CHANGELOG for ADK crawler infrastructure (d32523b5)
- feat(hustle): create comprehensive go-live roadmap (d42d603f)
- feat(scout): ADK crawler execution complete - 2,568 chunks ready for RAG (55e3c017)
- feat(tools): production ADK docs crawler pipeline for RAG grounding (eb76e2ac)
- feat(scout): ✅ Scout agent WORKING on Agent Engine - correct API usage (565ff9eb)
- docs(scout): document Agent Engine session serialization issue and testing block (07f676e5)
- docs: complete Agent Engine deployment resolution (a8beda35)
- feat(agents): deploy Scout team to Agent Engine via ADK CLI - SUCCESS (86f21d1b)
- docs: add CTO agent architecture plan using Bob's Brain pattern (252d1b63)
- docs: add Agent Engine deployment failure blocking issue (c885dfd6)
- fix(agents): switch Scout team to stable gemini-2.0-flash model (9168b822)
- docs: add Scout team local validation test results (dedee0a9)
- fix(agents): add session creation to Scout team local tests (ae44423f)
- feat(agents): add Scout multi-agent team following ADK agent team tutorial (fae50019)
- feat(agents): add Scout conversational agent following Google ADK standards (d49cc8e5)
- feat(agents): add ADK-based orchestrator (parallel implementation) (6033e683)
- chore(deps): add google-adk and a2a-sdk dependencies (499e5150)
- feat(qa): implement synthetic QA harness (Layer 1 - autonomous) (5adcedae)
- feat(qa): add comprehensive synthetic QA harness implementation plan (5d8ded92)
- fix(docs): correct CTO audit - migration phases 1-3 complete (2334756b)
- feat(qa): add agentic QA automation infrastructure (8984ad3a)
- fix(ci): lower safety filter to block_only_high (92c381f7)
- fix(ci): switch to Imagen 3 (imagegeneration@006) API (d41b864f)
- fix(nwsl): use existing fade clips for final 18s + fix voiceover timing (51c44863)
- feat(nwsl): add voiceover timing + missing segments generation (92e3110f)
- fix(ci): switch to Vertex AI API endpoint for Imagen 4 (b9844c5b)
- fix(ci): revert to 3 samples per variant (12 total logos) (f670ef44)
- fix(ci): generate 1 logo per variant instead of 3 samples (cd17062d)
- feat(ci): add Imagen 4 logo generation workflow (afbfb28c)
- docs(meta): update CLAUDE.md and AGENTS.md post-GitHub release (7dce4d3d)
- fix(lint): resolve all ESLint errors and warnings (ec79fda7)
- docs: highlight Vertex AI Agent Engine telemetry and monitoring (31200ebf)
- brand: add subtle Intent Solutions IO branding throughout repo (d180b65e)
- fix(docs): remove HTML from Mermaid diagram for GitHub compatibility (8913397a)
- fix(docs): repair Mermaid diagram syntax for GitHub compatibility (bb0b3134)
- docs: remove NWSL pipeline references from public documentation (7605ea2a)
- docs: remove public links to internal 000-docs directory (fd76c0ec)
- docs(release): prepare v1.0.0 initial public release (eb798e52)
- feat(deploy): add minimal production deploy workflow for human testing (23aa42f1)
- feat(players): enrich player profiles with positions, gender, and comprehensive league taxonomy (78b43b09)
- feat(agents): add comprehensive smoke tests with Vertex AI telemetry validation (ceecbc12)
- feat(performance): enable Firebase Performance Monitoring with custom traces (294ad22f)
- feat(monitoring): add GCP monitoring setup runbook (154ce840)
- feat(logging): add structured JSON logging for Cloud Logging integration (b9d3207d)
- docs(aar): add phase 2 after action report - postgresql decommissioned (b306e4bc)
- docs(phase-2): update all documentation for firestore-only architecture (aa730e46)
- refactor(api): simplify healthcheck, remove postgresql dependency (d44e19a0)
- chore(archive): move prisma files and legacy api routes to archive (d551d0d7)
- chore(deps): remove prisma and postgresql dependencies (2a32be6b)
- refactor(schema): make workspace fields optional for phase 2 compatibility (c7c64b5c)
- docs: add phase 1 aar for auth migration and observability cleanup (a1fd9884)
- chore: remove sentry and normalize observability to firebase/gcp (39a6bb62)
- feat(billing): add unified plan enforcement engine + ledger integration (ec8431f0)
- feat(billing): add subscription lifecycle ledger + admin reader (1a7bca74)
- chore(billing): add billing event replay and consistency auditor (9cfb996d)
- chore(billing): add canonical docs, support runbook, and safety switch (b27e7a8b)
- fix(billing): correct plan limits to match actual system (f9dd9c7b)
- feat(billing): add plan-limit warnings and usage indicators (90515ae3)
- feat(billing): add customer portal access and invoice history (d09e3f8c)
- feat(billing): add self-service plan change flow (947ec6c8)
- feat(dashboard): add workspace health section (4570b7d3)
- feat(billing): add Stripe Customer Portal integration (e5baa8bc)
- docs(phase6): complete production readiness validation and Phase 6 summary (33d97ff0)
- feat(workspaces): enforce workspace status globally (44486bfe)
- ci(mon): add monitoring and alerting for hustle (851fb1f7)
- feat(phase6): workspace collaboration and role-based access control (6f2dc04d)
- feat(phase6): firebase storage integration for player photo uploads (6f9f5fff)
- feat(phase6): monitoring and alerting infrastructure (fd7d8720)
- feat(phase6): automated email notifications for billing events (3e5a087d)
- feat(phase6): billing settings page with self-service portal (786829df)
- feat(phase6): workspace status guards and billing CTAs (0150e76c)
- docs(aa): summarize phase 7 access enforcement and billing compliance (1f7fabbf)
- feat(billing): add stripe customer portal access (72d738f8)
- feat(access): enforce hard subscription blocks on all write routes (c028da10)
- feat(paywall): add PaywallNotice component and integrate into gated features (b48396df)
- feat(access): enforce client-side access control with useWorkspaceAccess hook (0b2a8544)
- feat(access): add global subscription enforcement middleware (229cdf9a)
- docs(aa): summarize phase 5 customer workspace and billing readiness (a45c95c7)
- feat(ci): add go-live smoke tests and health endpoint (de511f5a)
- feat(limits): enforce plan limits for players and games creation (fc73d589)
- feat(billing): add stripe checkout and webhook integration for workspaces (0e6989d8)
- docs(pp): define hustle stripe pricing and workspace mapping (4ecb1b9c)
- feat(workspace): add workspace model and firestore services (62d37edd)
- docs(aa): summarize phase 4 data and legacy cleanup (0e23da2a)
- chore(scaffold): remove obsolete and empty directories (e8c36db6)
- chore(ci): align deploy workflows with firebase-only runtime (7017da73)
- chore(data): mark prisma and postgres as legacy only (b2d066e2)
- chore(auth): archive nextauth and remove from active runtime (de7f98a4)
- feat(data): remove prisma from active app code paths (c9dbf427)
- feat(migration): add prisma to firestore data migration script (dd6e7d16)
- docs(auth): phase 3 tasks 1-5 complete summary (83e87521)
- feat(auth): add edge middleware protection for dashboard routes (cab6ba9d)
- feat(auth): migrate client components from nextauth to firebase signout (9142402a)
- feat(auth): migrate 6 remaining dashboard pages to firestore admin reads (6c95547f)
- feat(auth): migrate dashboard overview to firestore admin reads (5eb73ced)
- feat(auth): cut dashboard layout over to firebase admin (200c00f9)
- chore(auth): confirm firebase e2e flow before dashboard cutover (86a7cba9)
- chore(scaffold): consolidate hustle repo directories and paths (eff8afa2)
- chore(scaffold): tighten hustle scaffold spec and phase 1 aar (4784f217)
- chore(scaffold): document hustle repo layout and target structure (f9e2f1a3)
- chore(env): wire local firebase auth + firestore for hustle (bc175b17)
- docs: add Phase 1 execution prompt for Claude (fa3df392)
- docs(000-docs): Phase 1 Go-Live Track execution plan (a53e1577)
- docs(000-docs): Step 1 complete - Firebase Auth wiring verified (dd3066f9)
- docs(000-docs): task 3 staging deployment analysis complete (7426013f)
- docs(000-docs): task 2 blocked by missing firebase env vars (38ed8b22)
- docs(000-docs): mini aar on hustle auth paths (d2985106)
- feat(firebase): Days 5-7 - Complete migration infrastructure ready (ea3247a3)
- feat(firebase): Day 4 - Data migration script ready (blocked by Console action) (c018dca3)
- feat(firebase): Day 3 - Replace NextAuth with Firebase Auth (65576e0b)
- feat(firebase): Day 2 - Firestore schema design and service layer (16213cf0)
- feat(firebase): Day 1 - Firebase project setup and SDK installation (560a690b)
- fix: remove single-field indexes (automatic in Firestore) (5a47fba1)
- feat: add Firebase deployment workflow with WIF authentication (405530fe)
- feat: add Firebase, Vertex AI A2A agents, and CI/CD automation (22e4d01e)
- feat: implement 9-segment video assembly with end card (37424c32)
- fix: resolve bash syntax error in veo_render.sh - malformed here-strings (f7130ec6)
- fix: resolve octal interpretation error in workflow (a323a117)
- fix: add canon verification step to workflow (cecac2a2)
- feat(nwsl): implement Phase 2 - bind code to canon for video generation (b9d11191)
- fix: create docs dir before writing reports in lyria/veo render scripts (da352c46)
- fix(lyria): correct HTTP_CODE variable reference in logging (9a840da9)
- docs: add scaffold map for canon-locked production (RUN NOW step 1) (38b451f3)
- fix(lyria): use TWO separate API calls for 60s audio (de4d6939)
- fix(ci): Lyria uses :predict sync; decode base64; Veo durationSeconds; error capture (ec0c8269)
- fix(ci): bound LRO polling, add timeouts, install ffmpeg always, call GA models (4e9abb19)
- fix(ci): use GA model IDs (lyria-002, veo-3.0-generate-001), implement 2x30s Lyria crossfade and predictLongRunning for Veo (5b88bc57)
- fix(ci): refactor script logic to enable Vertex AI API calls in production (8b5825a7)
- fix(ci): correct file paths for nwsl subdirectory in workflow (57ef9791)
- feat(ci): implement Vertex AI Lyria and Veo API integration for production renders (0b4b1d26)
- fix(ci): avoid octal number error in bash loop (use 1..8 instead of 01..08) (ffa47ee2)
- fix(ci): install ffmpeg for placeholder generation (17286041)
- fix(ci): fix all boolean dry_run comparisons in workflow (3bcdb5e9)
- fix(ci): nwsl is subdirectory not separate repo (b3cfe470)
- fix(ci): move gate verification after NWSL checkout (c011a9c9)
- fix(ci): upgrade upload-artifact from v3 to v4 (165a31a1)
- fix(ci): move assemble workflow to repository root (3ff21fd8)
- feat(ci): add GitHub Actions workflow with WIF and CI-only enforcement (17685b3a)
- fix: resolve profile 404, athletes server error, and mobile sidebar UX issues (5fb72e49)
- fix: add defensive stats columns to Game table migration (0761f486)
- fix: add email configuration to deployment workflow (a3d6537a)
- fix: improve sidebar contrast with background and borders (02bbdf28)
- fix: add Analytics page and birthday column migration (cc0a068e)
- CRITICAL FIX: Add trustHost to NextAuth config (ec895f6a)
- chore: disable dependabot completely (eb3acf7b)
- feat: add admin endpoint to manually verify user emails (fbf1a8de)
- fix: remove PrismaAdapter and explicit secret from NextAuth config (6ba4b709)
- fix: replace single quotes with double quotes in CSS font-family (0d80008a)
- fix: update vite to fix moderate severity vulnerability (GHSA-93m4-6634-74q7) (b2dae490)
- chore: configure dependabot to group all updates into single weekly PR (95f47a92)
- fix: replace special characters with HTML entities in email templates (65b109d1)
- debug: add detailed logging to registration endpoint to identify exact failure point (971955ad)
- fix: replace trademark symbol with HTML entity to fix JSON encoding error in email templates (e62aa212)
- fix: split migration SQL statements to avoid PostgreSQL prepared statement error (c5043016)
- fix: update migration endpoint with complete current schema for database initialization (7cfefabe)
- fix: remove SENTRY_DSN secret reference from deployment (ea70bef5)
- feat: migrate from GCR to Artifact Registry for deployments (8a78785b)
- docs: add comprehensive troubleshooting report for deployment failures (b2f9dda5)
- fix: exclude docs and GitHub workflows from Cloud Run builds (130ddff4)
- chore: temporarily disable auto-deploy workflow (e65598a7)
- chore: test deployment with Cloud Build permissions (525af7d2)
- fix: simplify Docker build with root Dockerfile (48106efc)
- feat: switch to Docker-based Cloud Run deployment (cc2de50a)
- chore: trigger deployment with full Artifact Registry access (9cfbe2fc)
- chore: trigger deployment after Artifact Registry permissions (1f8a04fc)
- chore: trigger deployment after WIF fix (fab3ed0b)
- fix: remove special characters from deploy workflow (396d3be2)
- fix: correct branch-protection workflow trigger syntax (48709466)
- fix: correct malformed emoji in deploy workflow (1429b09b)
- feat: add auto-fix and branch protection workflows (2156d315)
- fix: resolve ESLint errors blocking deployment (40f4c4bc)
- fix: remove old deploy workflow using deprecated service account keys (93b30775)
- feat: major platform updates - docs migration, GitHub Actions, landing page improvements (eb910983)
- fix: lazy-initialize Resend client to avoid build-time errors (940bf1c7)
- build: disable linting/type-checking during builds to unblock deployment (cb28bd79)
- fix: wrap dashboard return in fragment to fix JSX syntax error (826632a9)
- chore: archive v00.00.01 release artifacts (e8da4c4a)
- release: v00.00.01 - Legal Compliance & Documentation Release (35b50bca)
- chore: enable automatic releases on every push (db8042a6)
- chore: add global release workflow (b5408c3e)
- feat: convert email and thank you page to gray monochrome (Option 7) (2d2c6ea3)
- feat: use Jeremy's complete HUSTLE email with survey colors (ffef3234)
- feat: replace email and thank you page with HUSTLE vision (bcbb5cef)
- fix: bulletproof thank you page redirect with multiple fallbacks (24887d84)
- feat: add personalized thank you emails with Resend integration (26009d29)
- fix: resolve ESLint and TypeScript errors for production deployment (d43a9676)
- debug: add secret existence check (a81ecbc8)
- test: verify GitHub Actions auto-deployment (ff58d1b3)
- fix: add quotes around GCP_SA_KEY secret reference (a05877c9)
- ci: add GitHub Actions auto-deployment to Cloud Run (42c16e86)
- feat: initial repository setup - v00.00.00 Foundation (22cb22af)

---

# Changelog

All notable changes to the Hustle project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed — application email transport, 2026-09-13

- Route verification, password reset and notification mail through the existing
  approved MXroute SMTP sender. Remove the empty Resend dependency and the
  hardcoded onboarding sender; preserve application return shapes and tokens.
- Require validated TLS and bounded transport timeouts, expose sanitized
  failures, and avoid retrying ambiguous SMTP submissions automatically.
- Add a no-send authentication readiness endpoint with a sixty-second bounded
  cache, separate from process liveness. Deployment smoke verifies this signal;
  missing email configuration now produces an honest degraded health response.
- Add unit, fake-clock, SQLite route and real local TLS SMTP fixture regressions.
  Document deployment, protected backups, limits of no-send verification and
  rollback in [the email runbook](000-docs/278-OD-OPNS-smtp-email-operations.md).
- Make production billing mode explicit and pass the complete Stripe variable
  set through Compose. This prevents `/api/healthz` liveness from concealing an
  implicitly enabled but unconfigured billing subsystem; billing remains
  deliberately disabled until its private credentials are provisioned.

### Reliability — 2026-09-13

- Complete the Auth.js request-guard migration, accepting verified encrypted
  sessions and rejecting forged/expired cookies. Preserve in-app return paths.
- Recover the login form after a 15-second deadline or network error; the old
  fake-clock test fails and the repaired behavior passes. Remove the redundant
  post-login refresh that could later remount a dashboard form and discard input.
- Restore transactional account/workspace provisioning and preserve original
  trial and billing state when reconciling migrated orphan accounts.
- Restore the declared Playwright dependency and real local Auth.js/SQLite
  browser fixtures, with token verification, isolated state, fail-closed builds
  and private artifacts excluded from container images. Retain existing user
  journey assertions while correcting obsolete form selectors.
- Keep E2E SQLite writes outside the watched Next.js source tree, wait for client
  route transitions before entering game data, and remove guarded temp databases
  during global teardown. The final production-built Chromium replay passes all
  87 scenarios sequentially with retries disabled.
- Restore the previously empty integration lane with 16 transactional SQLite
  provisioning cases and make it blocking in CI. Type checking, unit tests and
  Chromium E2E are blocking again; the separately classified unit lane passes
  858 tests.
- Scope Tailwind v4 source discovery to `src/`, exclude runtime upload paths from
  Turbopack file tracing, and preserve Next's framework-controlled dynamic-render
  exceptions through application authentication catches.
- Record demonstrated migration failures, regression evidence and verification
  boundaries in [the browser incident report](000-docs/279-OD-INCD-auth-browser-regressions.md).

### Security — 2026-09-13

- Complete the September 7 credential-scrub repair from PR #49: remove the
  remaining Resend literals from three historical documents, preserving the
  prior repair's adjacent NextAuth and archived Groq redactions.
- Add a blocking, secret-safe Resend scan to CI, pre-merge validation and the
  deployment build gate. The scan includes tracked documentation and archives;
  13 hermetic regressions cover detection, staged-content integrity and errors.
- Exclude private dotenv files from Docker build contexts, including nested
  archives; preserve public `.env.example` templates. A real scratch-image
  regression proves the old context included private files and the repair excludes them.
- Isolate game-query unit tests from the CI job-wide E2E flag and explicitly
  cover enabled-mode verification. The old two failures reproduce; all 822
  application unit tests pass after the correction.
- Record why the earlier repair did not reach main, independently verified
  rejection of both reported keys, and the separate empty production email
  configuration in [the incident report](000-docs/277-OD-INCD-resend-secret-exposure.md).
  Historical Git objects remain; credential rejection does not prove past misuse
  did not occur. Application email delivery is not claimed restored by this scrub.


### Added
- **ADK Documentation Crawler Pipeline**: Production-grade infrastructure for crawling Google ADK docs
  - Complete Python package in `tools/adk_docs_crawler/` with 8 modules
  - Respects robots.txt, rate limiting (500ms between requests)
  - Generates RAG-ready chunks (1500 tokens max, 150 token overlap)
  - GCS upload with structured paths for Vertex AI consumption
  - Makefile targets: `crawl-adk-docs`, `crawl-adk-docs-local`, `setup-crawler`
  - GitHub Actions workflow for automated weekly crawls
  - Successfully crawled 118 pages, generated 2,568 chunks
  - Documentation: `000-docs/262-MS-archive/6781-AT-ARCH-adk-docs-crawl-pipeline.md`
- **Strategic Planning Documentation**:
  - `249-AA-STRT-cto-critical-path-scout-agent-rag.md` - CTO strategy with CoT reasoning
  - `250-LS-STAT-adk-crawler-execution-complete.md` - Crawler execution summary
  - `251-PP-PLAN-hustle-go-live-roadmap.md` - Production launch roadmap
- **QA Automation Infrastructure**: 5 GitHub issue templates for structured bug reporting and feedback
  - QA Bug Report template with severity levels and structured fields
  - QA UX Feedback template for usability improvements
  - QA Question template for onboarding gaps
  - QA Data/Stats Issue template for data integrity problems
  - QA Feature Idea template for enhancement requests
- **Synthetic QA Harness Implementation**: **COMPLETE** - Browser-based E2E testing harness for fake human validation
  - `252-PP-PLAN-synthetic-qa-harness-implementation.md` - Implementation plan and execution log
  - **Staging Seed Script**: `05-Scripts/seed-staging.ts` creates stable test data in Firebase
    - Demo parent account with 2 players (Attacking Midfielder + Goalkeeper)
    - 2 demo games with position-specific stats
    - Idempotent (deletes/rebuilds accounts)
  - **GitHub Actions Workflow**: `.github/workflows/synthetic-qa.yml` runs smoke tests on PRs
    - Triggers on `workflow_dispatch`, `pull_request`, `push` to main
    - Seeds staging, runs smoke suite, uploads artifacts
    - Comments on PR with pass/fail status
  - **Smoke Subset**: `npm run qa:e2e:smoke` for fast feedback (2 test files)
  - **Human QA Test Guide**: `253-OD-GUID-human-qa-test-guide.md` with 5 critical user journeys
  - **npm Scripts Added**:
    - `qa:e2e` - Run all E2E tests (Chromium only)
    - `qa:e2e:smoke` - Run smoke subset (fastest feedback)
    - `qa:seed:staging` - Seed Firebase with stable test data
  - **Blockers Documented**: Missing Firebase secrets for CI (9 secrets required)
- **Appauditmini**: Quick reference slash command (`/appauditmini`) generating 1-2 page architecture cheat sheets
- **Documentation**:
  - `249-RM-REFC-appauditmini-quick-reference.md` - MVP customer journey and architecture quick reference
  - `250-PP-PLAN-agentic-qa-automation-workflow.md` - Comprehensive plan for Vertex AI agent-driven QA automation
  - `251-AA-AUDT-cto-critical-issues.md` - CTO-level critical issues audit (corrected: migration Phases 1-3 complete)
- **Intent Solutions IO Branding**:
  - Downloaded 3 generated logos (Category Creator Emblem variants) to `000-docs/262-MS-archive/` (272–275)
  - Imagen 3 generation with `block_only_high` safety filter
  - `BLOCKED_PROMPTS.md` documenting why 3 logo prompts failed safety filter

### Changed
- Updated NWSL logo generation script to use Imagen 3 (`imagegeneration@006`) instead of Imagen 4
- Lowered safety filter from `block_some` to `block_only_high` for logo generation

---

## [1.0.0] - 2025-11-18

### 🎉 Initial Public Release

First public release of Hustle - Youth Soccer Statistics Tracking Platform. This release marks the completion of the Firebase migration, production infrastructure setup, and comprehensive feature enrichment.

### 🎯 Project Focus

Hustle demonstrates production-grade cloud infrastructure and AI agent orchestration:
- **Firebase Full Stack**: Authentication, Firestore, Cloud Functions, Hosting
- **Vertex AI A2A Protocol**: Multi-agent system with 5 specialized agents
- **Modern DevOps**: GitHub Actions with WIF, Terraform IaC, comprehensive CI/CD
- **Production Ready**: Monitoring, observability, security rules, COPPA compliance

### ✨ Major Features

#### Player Profile Enrichment
- **13 Specialized Soccer Positions**: GK, CB, RB, LB, RWB, LWB, DM, CM, AM, RW, LW, ST, CF
- **Gender Selection**: Required male/female field with validation
- **56 U.S. Youth Soccer Leagues**: ECNL Girls/Boys, MLS Next, USYS, NPL, USSSA, Rush Soccer, Surf Soccer, and more
- **Custom League Support**: "Other" option with free-text input for regional leagues
- **Position Intelligence**: Primary position selection + up to 3 secondary positions
- **Backward Compatibility**: Legacy `position` field preserved during migration

#### Firebase Migration Complete (Phases 1-3)
- **Phase 1: Authentication & Observability**
  - Migrated from NextAuth v5 to Firebase Authentication
  - Removed Sentry, normalized to Firebase/GCP observability
  - Google Cloud Logging with structured JSON logs
  - Firebase Performance Monitoring with custom traces

- **Phase 2: Database Migration**
  - Completely decommissioned PostgreSQL and Prisma
  - Migrated to Firestore with hierarchical collections
  - Security rules enforcing parent-child ownership
  - Composite indexes for query optimization

- **Phase 3: Monitoring & Observability**
  - GCP Cloud Monitoring setup with custom dashboards
  - Error reporting and alerting infrastructure
  - Cloud Logging integration with log-based metrics
  - Firebase Performance SDK enabled

#### Vertex AI Agent System (A2A Protocol)
- **5 Specialized Agents**:
  - Operations Manager (root orchestrator)
  - Validation Agent (data quality)
  - User Creation Agent (provisioning workflows)
  - Onboarding Agent (new user experience)
  - Analytics Agent (performance metrics)
- Agent-to-Agent communication via Cloud Functions
- Vertex AI Memory Bank for session persistence
- Comprehensive smoke tests with telemetry validation

#### Billing & Workspace Management (Phases 5-6)
- **Stripe Integration**: Checkout, webhooks, Customer Portal
- **Plan Enforcement**: Free, Pro, Team tiers with usage limits
- **Subscription Lifecycle**: Ledger system with event replay
- **Plan Limit Warnings**: Usage indicators and soft warnings
- **Workspace Status Enforcement**: Active, suspended, canceled states
- **Collaboration**: Role-based access control for teams

#### Storage & Media
- Firebase Storage integration for player photo uploads
- Secure upload with Firebase Admin SDK
- Storage quotas per workspace plan

### 🛠️ Infrastructure & DevOps

#### CI/CD Pipelines
- GitHub Actions with Workload Identity Federation (WIF)
- Firebase Hosting + Cloud Functions deployment
- Vertex AI agent deployment automation
- Cloud Run staging environment
- Manual production deployment workflow with "DEPLOY" confirmation

#### Testing
- Vitest unit tests with coverage reporting
- Playwright E2E tests (auth, dashboard, player flows)
- Vertex AI smoke tests with telemetry validation
- Test results archival in `03-Tests/`

#### Documentation
- **244+ Documentation Files** in `000-docs/`
- Document Filing System v2.0 (NNN-CC-ABCD-description.ext)
- Comprehensive `CLAUDE.md` for AI assistant guidance
- `AGENTS.md` with repository coding standards
- Production deployment runbook
- After Action Reports (AARs) for all major phases

### 🎨 User Experience

#### Dashboard Improvements
- Mobile-responsive design with Tailwind CSS
- Real-time Firestore synchronization
- Position-specific statistics tracking
- Workspace health monitoring
- Billing portal access

#### Forms & Validation
- Zod schema validation for all user inputs
- Conditional league input (shows text field when "Other" selected)
- Position validation (prevents primary position in secondary list)
- Client-side and server-side validation layers

### 🔒 Security & Compliance

- **COPPA Compliance**: Parent/guardian verification required
- **Firestore Security Rules**: Enforced data ownership
- **Firebase Auth**: Email/password with verification required
- **Secrets Management**: GitHub Secrets + Google Secret Manager
- **No Service Account Keys**: WIF for all GitHub Actions

### 📊 Technology Stack

**Frontend:**
- Next.js 15.5 with App Router and React Server Components
- React 19.1 with TypeScript 5.x
- Tailwind CSS with shadcn/ui components
- Turbopack bundling

**Backend:**
- Firebase Cloud Functions (Node.js 20)
- Firestore NoSQL database with hierarchical collections
- Firebase Authentication
- Firebase Storage

**AI/ML:**
- Vertex AI Agent Engine
- Google Agent-to-Agent (A2A) Protocol
- Google ADK (Agent Development Kit)
- Vertex AI Memory Bank

**DevOps:**
- GitHub Actions CI/CD
- Workload Identity Federation (WIF)
- Terraform infrastructure (modules for multi-project)
- Firebase Hosting + Cloud Run

**Monitoring:**
- Google Cloud Logging
- Firebase Performance Monitoring
- Cloud Monitoring with custom dashboards
- Error Reporting

### 📝 Repository Enhancements

#### Professional GitHub Presence
- **README.md**: Comprehensive overview with 9+ sections, 3 Mermaid diagrams
- **GitHub Pages**: Custom HTML site with responsive design
- **Badges**: 6 shields.io badges (Next.js, Firebase, Vertex AI, TypeScript, Firestore, License)
- **Topics**: 10 repository tags (youth-soccer, firebase, vertex-ai, nextjs, typescript, etc.)
- **Description**: Professional tagline
- **Homepage**: https://jeremylongshore.github.io/hustle/

#### Documentation Architecture
- Flat numbered filing system (000-docs/)
- Mermaid diagrams for system architecture, data models, CI/CD
- Deployment runbooks and troubleshooting guides
- Phase-by-phase migration After Action Reports (AARs)

### 🗓️ Deprecated

- ❌ NextAuth v5 (replaced with Firebase Auth)
- ❌ PostgreSQL database (replaced with Firestore)
- ❌ Prisma ORM (replaced with Firebase Admin SDK)
- ❌ Sentry error tracking (replaced with GCP Error Reporting)
- ❌ Cloud SQL (replaced with Firestore)

### 🔧 Migration Notes

For users upgrading from legacy PostgreSQL version:
1. Run migration script: `npx tsx 05-Scripts/migration/migrate-to-firestore.ts`
2. Verify data in Firestore Console
3. Test authentication flows (registration, login, email verification)
4. Archive legacy Prisma schema and migrations

### 📦 Release Assets

- Source code: `hustle-v1.0.0.tar.gz`
- Documentation: 244+ files in `000-docs/`
- Firebase configuration: `firebase.json`, `firestore.rules`, `firestore.indexes.json`
- CI/CD workflows: 9 GitHub Actions workflows
- Terraform modules: Multi-project GCP infrastructure

### 🙏 Acknowledgments

Built with:
- **Firebase**: Hosting, Authentication, Firestore, Cloud Functions, Performance Monitoring
- **Vertex AI**: Agent Engine, A2A Protocol, Memory Bank
- **Google Cloud Platform**: Logging, Monitoring, Error Reporting, Secret Manager
- **Next.js**: React framework with App Router and Server Components
- **shadcn/ui**: Beautiful, accessible component library

### 🔗 Links

- **Live Dashboard**: https://hustlestats.io
- **GitHub Pages**: https://jeremylongshore.github.io/hustle/
- **Repository**: https://github.com/jeremylongshore/hustle
- **Architecture Guide**: [CLAUDE.md](./CLAUDE.md)
- **Developer Docs**: [AGENTS.md](./AGENTS.md)

---

## [Unreleased]

### Planned Features
- Additional soccer positions (futsal, beach soccer variants)
- Advanced analytics and trend visualization
- Team-level statistics aggregation
- Coach dashboard with multi-player views
- Export to PDF reports
- Mobile app (React Native)

---

**Full Changelog**: https://github.com/jeremylongshore/hustle/commits/v1.0.0
