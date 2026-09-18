# Hustle: Operator-Grade System Analysis

*Generated: 2026-09-18*
*Version: `main` after PRs #59–#62 merged and deployed (release **v2.2.0**, 2026-09-18). PR #63 (`AUTH_URL`) was in CI at the time of writing.*
*Audience: Ravi (new collaborator) and anyone else joining the build.*
*Companion docs: 280 vision · 281 roadmap · 282 monetization · 283 app-store pathway · 284 competitive landscape · 285 minor-safety compliance*

---

## 1. This System in 5 Minutes

Hustle (hustlestats.io) is a web app for **youth soccer athletes aged 13–18 and their parents**. Today a parent creates an account, adds one or more athletes, and then logs:
- games with stats
- practices
- workouts, cardio, meals, biometrics, and journal entries (the "Dream Gym" suite)
- a schedule

Claude generates training recommendations. A Stripe subscription system (Free / Starter / Plus / Pro) is fully built but **switched off**. The reboot plan (docs 280–285, merged 2026-09-18) turns this into a one-stop athlete app with five pillars:
- verified stats
- AI gym plans
- a unified calendar
- safe competition
- a recruiting and highlight hub for college coaches

Mobile apps come last.

Technically it is **one Next.js 16 application**, covering both the UI and every API route, running as **one Docker container** on the Intent Solutions VPS (`intentsolutions`, Contabo, 167.86.106.29). Data lives in **one SQLite file** (`/data/hustle.db`) on a Docker volume, accessed through Drizzle ORM. Authentication is Auth.js (NextAuth v5 beta) with email and password, JWT sessions, and mandatory email verification. Caddy terminates TLS and reverse-proxies to the container on `127.0.0.1:8084`. There is no Kubernetes, no managed database, no Redis, and no cloud provider. GCP and Firebase were removed in May–July 2026.

Deploys are **fully automatic**:
1. You merge to `main`.
2. GitHub Actions builds the app.
3. Actions SSHes into the VPS over Tailscale with a key that can only run one command.
4. That command does `git reset --hard origin/main` and `docker compose up -d --build`.
5. CI then smoke-tests `https://hustlestats.io/api/health/email`.

There is **no automatic rollback**. If the smoke test fails, a human fixes forward or reverts.

**The code is far ahead of the usage.** Production has **3 user accounts, 0 athletes, 0 games, 0 workspaces**, per a row-count check against both the live DB and last night's backup on 2026-09-18. The codebase holds roughly 49,000 lines of TypeScript across 66 API routes and 40 pages, with ~900 unit tests and 87 E2E tests (all passing locally and in CI). In practice we are building a product for its first real users. We are not maintaining a live system with customers, and that is the right mental model for risk. Breaking prod is cheap today; it won't be once families are on it.

**The three biggest risks right now:**
1. **Access control had two holes.** The admin tools failed open, and two debug routes let any signed-in user read another family's athlete biometrics and workouts. Both are fixed in PR #62, which merges first (§8.1, §9). The underlying weakness remains: most queries trust the route to have checked ownership (`hustle-4dc.2`).
2. **AI features are dead in production.** `ANTHROPIC_API_KEY` is not in the prod environment, so every AI route throws (§8.2).
3. **The product handles minors' data**, and the safety and consent foundation (doc 285) is not built yet. Nothing public-facing (recruiting profiles, video, leaderboards) ships until it is.

---

## 2. Executive Summary

### What It Does

Hustle is a parent-owned tracking app for youth soccer players. A **workspace** is the tenant, owned by a parent **user**, and it contains **players** (athletes). Each player accumulates:
- **games**, with position-specific stats (goals, assists, saves, clean sheets) and a `verified` flag set by a PIN check
- **practice logs**
- **Dream Gym** data: workout logs with sets and reps, cardio logs, meal logs ("Fuel Station"), biometrics, assessments, journal entries, schedule events, and a Dream Gym profile/strategy record

An analytics page aggregates game stats. `/api/ai/recommend` and `/api/players/[id]/dream-gym/ai-strategy` call Claude for tips and workout strategies.

Billing is real code:
- Stripe Checkout and the Customer Portal
- two webhook endpoints (plan and status convergence in one, notification email in the other)
- an idempotency table (`webhookEvent`) and a billing ledger (`billingLedger`)
- an admin replay tool
- plan limits enforced at write time
- a trial-reminder email job run by a systemd timer on the VPS

It is all gated behind `BILLING_ENABLED`, which is **`false` in production**. Stripe keys and price IDs are not provisioned.

The implementation is **mature on the web for a single-user logging tool**. It is **absent** for everything the reboot plan adds: verified co-signing, AI adaptive plans, calendar sync, recruiting profiles, video, competition, and mobile. The archived Firebase-era Expo app (`99-Archive/mobile`) cannot run, because Firebase is gone.

### Operational Status

| Environment | Status | Uptime Target | Release Cadence | Last Deploy |
|---|---|---|---|---|
| Production (hustlestats.io, VPS container `hustle-app`) | ✅ Up; `/api/health` = `healthy` (DB pass, env pass, SMTP configured) | Not defined | Every merge to `main` (continuous) | 2026-09-18 13:49 UTC (the PR #50 SMTP fix; image started 13:49:43Z) |
| Staging | ❌ Does not exist | — | — | — |
| Local dev | ✅ `npm run dev` plus a local SQLite file | — | — | — |
| CI (GitHub Actions) | ✅ Lint → typecheck → build → unit → integration → Chromium E2E → Docker build/smoke | — | Every PR and every push to main | — |

### Technology Stack

| Category | Technology | Version (main) | Purpose |
|---|---|---|---|
| Framework | Next.js (App Router, standalone output) | 16.3.5 (upgraded from 16.2.1 in #61) | UI and API in one process |
| UI | React | 19.2.4 | Components |
| Styling | Tailwind CSS | 4.x | Utility CSS |
| Auth | Auth.js / `next-auth` | 5.0.0-beta.32 (from beta.31 in #61) | Credentials sign-in, JWT sessions |
| ORM | Drizzle ORM | ^0.45.2 | Typed SQL, schema, migrations |
| Database | SQLite via `better-sqlite3` | ^12.10.0 | Single-file DB, WAL mode |
| Validation | Zod | ^4.3.6 | Request/form validation |
| Payments | Stripe SDK | ^21.0.1 | Subscriptions (disabled in prod) |
| AI | `@anthropic-ai/sdk` | ^0.98.0; default model `claude-sonnet-4-6` (`src/lib/ai/claude.ts:28`) | Recommendations, workout strategy |
| Email | nodemailer, aliased as `smtp-mailer` (`package.json:51`) → MXroute SMTP | ^10.0.9 | Verification, password reset, billing email |
| Unit/integration tests | Vitest | ^4.1.7 | 70 unit files, 1 integration file |
| E2E | Playwright | 1.63.0 | 9 specs (~87 tests), Chromium in CI |
| Runtime | Node.js | 22 (Docker, deploy gate); **20 in CI** (see §8.6) | — |
| Container | Docker (multi-stage, `node:22-bookworm-slim`) | — | Production image |
| Ingress | Caddy | VPS-managed | TLS, reverse proxy to `127.0.0.1:8084` |
| Host | Contabo VDS `intentsolutions` | 24 GiB RAM | Shared with ~35 other containers |

---

## 3. Architecture

### Stack (Detailed)

| Layer | Technology | Purpose | Why This |
|---|---|---|---|
| Edge | Caddy on the VPS | TLS (auto HTTPS), `reverse_proxy 127.0.0.1:8084`, security headers, gzip, access log at `/var/log/caddy/hustle-access.log` | One ingress for the whole estate. No CDN, so the client IP is trustworthy (matters for rate limiting, §8.9) |
| App server | Next.js standalone `server.js` in Docker | Serves pages, server components, and all `/api/*` routes | One deployable unit. No separate API service to keep in sync |
| Request gate | `src/proxy.ts` (Next 16's replacement for `middleware.ts`) | Redirects unauthenticated requests to `/login`. Lets public routes, `/api/internal/*` (token-auth), and health endpoints through | Centralized auth redirect. Each API route still checks the session itself |
| Auth | `src/auth.ts` (Auth.js config) + `src/lib/auth.ts` (server helpers) | Credentials provider, bcrypt password check, email-verified gate, JWT session | Self-hosted and free. The Firebase Auth replacement (2026-05). JWT means no DB read per request for sessions |
| Domain logic | `src/lib/**` | Queries (`src/lib/db/queries/*`), workspace access/enforcement (`src/lib/workspaces/*`), billing (`src/lib/stripe/*`, `src/lib/billing/*`), AI (`src/lib/ai/*`), email (`src/lib/email*.ts`, `src/lib/smtp.ts`), storage (`src/lib/storage/local.ts`) | Plain TypeScript modules. Easy to unit-test with an in-memory SQLite (`src/test-utils/db.ts`) |
| Persistence | SQLite file `/data/hustle.db`, WAL mode, foreign keys on (`src/lib/db/index.ts:26-28`) | All tenant data | See Decision 1 (§4) |
| Files | `/data/uploads` on the same volume, served by `/api/storage/serve/[...path]` | Player and user photos | Keeps everything on one volume and one backup |
| Migrations | Drizzle SQL files in `drizzle/`, **applied automatically at process start** (`src/lib/db/index.ts:53-60`) | Schema evolution | Zero-ops migrations. See §8.4 for the sharp edge |
| Jobs | systemd timer `hustle-trial-reminders.timer` on the VPS (daily 09:00 UTC) → `POST /api/internal/trial-reminders` with bearer `HUSTLE_INTERNAL_TOKEN` | Trial-ending emails | No job queue needed at this scale |

### System Diagram

```
                          ┌───────────────────────── GitHub ─────────────────────────┐
  developer ── PR ──────▶ │ ci.yml: lint · tsc · build · vitest · playwright · docker │
                          │ merge to main ─▶ deploy.yml ─▶ vps-deploy.yml (shared,     │
                          │                  SHA-pinned) ─▶ Tailscale OIDC + SSH      │
                          │ release.yml: tag + GitHub release on main (see §8.10)     │
                          └──────────────────────────────┬───────────────────────────┘
                                                         │ ssh (force-command)
                                                         ▼
 Internet ──HTTPS──▶ ┌─────────────── VPS intentsolutions (167.86.106.29) ───────────────┐
  (parents,          │  Caddy :443 ──reverse_proxy──▶ 127.0.0.1:8084                     │
   browsers)         │                                   │                                │
                     │                     ┌─────────────▼─────────────┐                  │
                     │                     │ container hustle-app      │                  │
                     │                     │ Next.js standalone server │── SMTP 465 ──▶ MXroute
                     │                     │  pages + /api/*           │── HTTPS ─────▶ Anthropic API (key NOT set, §8.2)
                     │                     │  migrations on boot       │── HTTPS ─────▶ Stripe (disabled)
                     │                     └─────────────┬─────────────┘                  │
                     │                       volume hustle_hustle-data → /data            │
                     │                         hustle.db (+ -wal/-shm), uploads/          │
                     │  systemd timer 09:00 UTC ─▶ POST /api/internal/trial-reminders     │
                     │  /usr/local/sbin/deploy-hustle (git reset + compose up --build)    │
                     │  borg nightly: sqlite .backup() → /var/backups/db-dumps/hustle.sqlite
                     └──────────────┬────────────────────────────────────────────────────┘
                                    │ 03:30 pull                     04:00 push
                                    ▼                                    ▼
                     dev box replica ~/backups/vps-borg-replica ─▶ Backblaze B2 (Object Lock 30d)
```

**Failure domains:** everything customer-facing shares one VPS, one Caddy, one container, and one SQLite file. A VPS outage takes Hustle down along with the rest of the estate. The database is the single writer, and all data sits on one volume.

### The Critical Path: a parent logs a game

1. **Browser → Caddy.** `POST https://hustlestats.io/api/games` with a JSON body and the Auth.js session cookie. *Fails if:* DNS, the VPS, or Caddy is down. Everything is down at that point.
2. **Caddy → container** on `127.0.0.1:8084`. *Fails if:* the container is restarting mid-deploy. Deploys rebuild in place, so expect seconds of 502s.
3. **`src/proxy.ts`** checks for a session token (`AUTH_SECRET || NEXTAUTH_SECRET`, `src/proxy.ts:45`). With no token, an API route gets a 307 redirect to `/login`. *Fails if:* the secret changes, which invalidates every session.
4. **Route handler** `src/app/api/games/route.ts`:
   - `auth(request)` resolves the session. No user means 401.
   - **Rate limit:** 10 per minute per user, SQLite-backed (#60). Over the limit returns 429 `RATE_LIMIT_EXCEEDED`.
   - `getUserProfileAdmin()` loads the user. A missing `defaultWorkspaceId` returns 500 `WORKSPACE_NOT_FOUND`.
   - The workspace is loaded, then `assertWorkspaceActive` (`src/lib/workspaces/enforce.ts`). A `past_due`, `canceled`, `suspended`, or expired-trial workspace returns 403.
   - `getPlanLimits(workspace.plan)` (`src/lib/stripe/plan-mapping.ts`) caps games per month. Over the cap returns 403 with a plan-limit error.
   - The body is validated (Zod) and the player's ownership checked.
   - The insert goes through `src/lib/db/queries/games.ts`, and the workspace usage counter is incremented.
5. **SQLite write** under WAL, which allows a single writer. *Fails if:* the disk is full (SQLITE_FULL) or the volume is corrupt. Writes are microseconds at this scale.
6. **Response** 201 with the game JSON.

Verifying a game (`POST /api/verify`) follows the same path. It adds a bcrypt comparison of the account's verification PIN (`src/app/api/verify/route.ts:102`) and a 14-day age cutoff.

### Dependency Graph

| Component | Depends on | If that dependency is unavailable |
|---|---|---|
| Whole app | VPS, Docker daemon, Caddy | Site down |
| Every data route | SQLite file on the `hustle_hustle-data` volume | 500s. The container healthcheck (`/api/healthz`) still passes, because it doesn't touch the DB. `/api/health` reports DB fail |
| Sign-in | `AUTH_SECRET`/`SESSION_SECRET` env, DB | Nobody can sign in. Changing the secret logs everyone out |
| Registration, password reset | SMTP (MXroute) | The account is created but the verification email isn't sent. The user can't sign in, because verification is mandatory |
| AI recommend / strategy | `ANTHROPIC_API_KEY` | **Currently unset in prod.** Routes throw "ANTHROPIC_API_KEY is not set" (`src/lib/ai/claude.ts:72-76`) |
| Billing routes | `BILLING_ENABLED=true` + Stripe keys + price IDs | Returns a disabled response. Plan limits still enforce, because they're independent of the flag |
| Trial reminders | systemd timer on the VPS + `HUSTLE_INTERNAL_TOKEN` + SMTP | Reminders silently stop. The service has an `OnFailure=` drop-in (`10-onfailure.conf`) |
| Deploy | GitHub → Tailscale OIDC → SSH force-command `/usr/local/sbin/deploy-hustle`; shared workflow `jeremylongshore/.github` pinned at SHA `53d6be37` | No deploys. Prod keeps running the last image |
| Backups | Nightly borg on the VPS → dev-box replica → B2 | Loses recoverability, not uptime |

**Build order:** `npm ci` → `next build` (compiles pages and routes, collects static pages; ~70 static pages) → Docker copies `.next/standalone`, `.next/static`, `public/`, `drizzle/` into the runner image.

---

## 4. Design Decisions & Tradeoffs

### Decision Log

#### 1. SQLite (single file) over PostgreSQL
- **Chosen:** SQLite through `better-sqlite3` and Drizzle, one file at `/data/hustle.db`, WAL mode.
- **Over:**
  - Postgres + Prisma, which *was* the original stack and was decommissioned (`.env.example`: "Legacy: PostgreSQL + Prisma (DECOMMISSIONED)")
  - Firestore, used 2025-11 to 2026-05 and removed in the P7 migration (#44)
- **Because:** the app is one container on one VPS. SQLite means no database server to run, patch, back up separately, or pay for. Queries are in-process with microsecond latency. The whole tenant dataset is one file that borg can snapshot consistently via `sqlite3 .backup()`.
- **Cost:**
  - One writer at a time.
  - No horizontal scaling of the app (two containers can't safely share the file over a network volume).
  - No per-tenant row-level security. Isolation is enforced in application code.
  - Migrations are less forgiving than Postgres: `ALTER TABLE` is limited, and some changes need table rebuilds.
- **Revisit when:**
  - sustained write contention (`SQLITE_BUSY` in logs), or more than ~200 writes/sec
  - a need for more than one app instance (zero-downtime deploys, HA)
  - analytics queries start blocking writes
  
  At 5,000 families none of these are close.

#### 2. One Next.js app for UI and API, over a separate backend service
- **Chosen:** App Router pages plus `src/app/api/**/route.ts` handlers in the same deployable.
- **Over:** a separate API service (Express/Fastify/FastAPI), or the Firebase Cloud Functions it used to have (the `functions/` residue was removed in PR #59).
- **Because:** one codebase, one type system, one deploy, one set of env vars. Server components can call query modules directly.
- **Cost:**
  - The API shape is tied to Next's conventions, and Next 16 has breaking changes (`AGENTS.md`: "This is NOT the Next.js you know").
  - The native mobile app (doc 283, P6) needs bearer-token auth added to routes that assume cookies today.
- **Revisit when:** the native app lands (P6). Even then, the plan is to add bearer support to the same routes (283 §1), not to split services.

#### 3. Auth.js Credentials + JWT sessions, over Firebase Auth or a hosted identity provider
- **Chosen:** `next-auth` v5 beta with the Credentials provider, bcrypt hashes in the `user` table, `session: { strategy: "jwt" }` (`src/auth.ts:17`), and the Drizzle adapter for account/verification tables.
- **Over:**
  - Firebase Auth (removed with GCP)
  - Clerk, Auth0, Supabase Auth (per-user cost, third-party custody of minors' account data)
  - Lucia (mentioned in the stale Dockerfile comment; never adopted)
- **Because:** no vendor, no per-MAU cost, and data stays on our server. That matters for the parent-owns-the-data promise (280 §8).
- **Cost:**
  - We own password security, verification, reset, and brute-force protection. The brute-force part was **missing** until PR #60.
  - `next-auth` v5 is still **beta**, and a September migration caused browser regressions (`000-docs/279-OD-INCD-auth-browser-regressions.md`).
  - JWT sessions can't be revoked server-side without extra work.
- **Revisit when:**
  - we need social login (Apple requires Sign in with Apple once any third-party login exists, 283 §3)
  - we need instant session revocation for safety incidents (P1/P4)

#### 4. Push-to-main continuous deploy onto the VPS, over staged environments
- **Chosen:** every merge to `main` deploys to prod. The shared `vps-deploy.yml` connects over Tailscale OIDC to an SSH key restricted by `command="/usr/local/sbin/deploy-hustle"`, which runs `git fetch && git reset --hard origin/main && docker compose up -d --build --pull always`, then polls `/api/healthz`. CI smoke-tests `/api/health/email` with a `jq` filter.
- **Over:**
  - Vercel (the create-next-app default; the README still says so)
  - GCP Cloud Run (the previous deploy, removed)
  - a staging environment plus manual promotion
- **Because:** the estate standard (VPS-as-the-home program) is "`git push` → CI deploys → smokes". One pattern across ~7 apps. The force-command key can't do anything except deploy.
- **Cost:**
  - **No staging.** PR CI is the only pre-prod gate.
  - **No automatic rollback.** The shared workflow says so (`vps-deploy.yml` smoke step: the "previous tag" wrapper "is not yet deployed").
  - The **image is built on the prod VPS**, competing for CPU and disk with live services.
  - The container is replaced in place, so there's a few seconds of downtime per deploy.
- **Revisit when:** real families depend on it (after P2). At minimum add build-in-CI → push image → pull on the VPS → keep the previous image tag for one-command rollback.

#### 5. Migrations run automatically at process start
- **Chosen:** `migrate(db, { migrationsFolder })` runs when `src/lib/db/index.ts` is first imported (lines 53-60). Errors are **logged and swallowed** (`console.error("[db] migration error:", err)`).
- **Over:** a separate migration step in the deploy script, or a manual `drizzle-kit migrate`.
- **Because:** zero-ops. The image ships `drizzle/` and applies whatever is pending.
- **Cost:** a failed migration **doesn't stop the app**. It boots against a half-migrated schema and fails at request time. There is no down-migration, so the rollback is restore-from-backup. See §8.4.
- **Revisit when:** the first migration that alters or drops a column. Before then, add a "migrations applied" check to `/api/health`.

#### 6. Parent owns the account; athletes are records, not logins
- **Chosen:** one `user` (the parent) owns a `workspace`. Athletes are `player` rows. Email verification is mandatory before sign-in and is labelled a "COPPA gate" (`src/auth.ts` authorize).
- **Over:** athlete self-signup.
- **Because:** the athletes are minors. A parent as account holder and payer is the cleanest consent model (285 §1) and matches how families actually pay.
- **Cost:** the reboot vision wants **athletes as daily users** (280 §3). That needs athlete sub-logins with parent consent, which is P1 work that doesn't exist yet.
- **Revisit when:** P1 (safety foundation) designs athlete accounts.

#### 7. Plan limits enforced in the API, not only in the UI
- **Chosen:** write routes (`/api/games`, `/api/players/create`) call `getPlanLimits()` and refuse over-cap writes. The UI warning module reads the same table after PR #59 (`src/lib/billing/plan-limits.ts`).
- **Over:** UI-only gating.
- **Because:** UI gating is bypassable with curl.
- **Cost:** the tier shape (athlete-count caps) is baked into routes. The Free/Family change in doc 282 means editing `plan-mapping.ts` and its callers.
- **Revisit when:** P2 re-prices.

#### 8. Hand-rolled SMTP (nodemailer → MXroute) over a transactional email API
- **Chosen:** nodemailer, aliased as `smtp-mailer`, with strict TLS to MXroute. `src/lib/email-health.ts` does a cached, no-send TLS and auth probe that `/api/health/email` exposes and the deploy smoke test checks.
- **Over:** Resend. It was the prior provider; its key was exposed and it was retired (`000-docs/277-OD-INCD-resend-secret-exposure.md`, PR #50).
- **Because:** the estate already pays for MXroute, and there's no extra vendor holding parents' emails.
- **Cost:** no delivery analytics, bounce webhooks, or suppression lists. Deliverability rests on MXroute's reputation plus our SPF/DKIM/DMARC.
- **Revisit when:** email volume or deliverability problems appear (marketing email, digests).

### What Was Deliberately Not Built

| Omission | Why | Source |
|---|---|---|
| Social feed, athlete-to-athlete DMs, public national leaderboards | Child-safety cost | 280 §6 |
| Multi-sport | Soccer-first focus. The data model can generalize later | 280 §6 |
| Own camera or sensor hardware | Integrate with Trace, Veo, Hudl, and PlayerMaker exports instead | 280 §6, 284 |
| Paid recruiting advisors | The NCSA model we position against | 282 §4 |
| Embedding openGym code | AGPL-3.0 would force Hustle open-source. We rebuild its patterns instead | 280 §5 |
| OpenTelemetry / APM | Auto-instrumentation deadlocked Firebase-era outbound calls, so it was removed (`src/instrumentation.ts`) | code comment |
| Staging environment | Cost/benefit at zero users | §4 decision 4 |
| Redis | A single SQLite node makes it unnecessary | PR #60 |

### Assumptions the Architecture Rests On

| Assumption | Threshold where it breaks |
|---|---|
| One app instance is enough | Needs >1 instance for HA or zero-downtime deploys, or CPU saturation (the container uses ~92 MiB RAM and ~0% CPU idle today) |
| SQLite single-writer is enough | Sustained >~200 writes/sec or long write transactions. Video metadata and chat would change the write profile |
| Video will live outside SQLite | P4 must put media in object storage. Putting video on the same volume would blow up backup size and the VPS disk |
| Caddy is the only proxy in front | Adding a CDN (Cloudflare) changes client-IP semantics for rate limiting (`src/lib/rate-limit.ts`) |
| Parents are the account holders | P1 athlete logins change auth, consent, and data-access rules everywhere |
| Nobody depends on prod yet | 3 users today. The deploy model (no staging, no auto-rollback) must harden before P2 charges money |

---

## 5. Directory Structure

### Layout (after PR #59 merges)

```
hustle/
├── src/
│   ├── app/                 # Next.js App Router: pages + API routes
│   │   ├── (public)/        # landing, login, register, reset-password, verify-email
│   │   ├── dashboard/       # authenticated UI: athletes, games, dream-gym/*, analytics, billing, schedule, settings, profile, admin
│   │   ├── api/             # 66 route handlers on main (61 after #62 removes debug/hello/test-post). See Appendix E
│   │   ├── privacy/ terms/  # legal pages
│   │   └── layout.tsx, providers.tsx, error.tsx, not-found.tsx
│   ├── auth.ts              # Auth.js config (Credentials provider, JWT, email-verified gate)
│   ├── proxy.ts             # Next 16 request gate (auth redirect, public/internal allow-list)
│   ├── lib/
│   │   ├── db/              # index.ts (connection + auto-migrate), schema/*.ts (tables), queries/*.ts (data access)
│   │   ├── workspaces/      # access control, status enforcement (assertWorkspaceActive), guards
│   │   ├── stripe/          # plan-mapping (limits, prices), plan-enforcement, ledger, auditor, portal
│   │   ├── billing/         # plan-limits (UI view), plan-change
│   │   ├── ai/              # claude.ts (client), workout-strategy.ts, prompts
│   │   ├── storage/         # local.ts (uploads on /data/uploads), upload-validation.ts
│   │   ├── email*.ts smtp.ts email-health.ts   # outbound mail + readiness probe
│   │   ├── auth.ts          # server helpers (auth(), authWithProfile, requireAuth)
│   │   └── logger.ts monitoring/events.ts
│   ├── components/          # UI components (dashboard, dream-gym, billing, journal, ui/ = shadcn-style primitives)
│   ├── types/               # domain.ts (was firestore.ts before PR #59), game.ts, league.ts, player.ts
│   ├── hooks/ prompts/ schema/ test-utils/ __tests__/
│   └── env.mjs              # ⚠ dead: stale Postgres-era env schema, imported nowhere
├── drizzle/                 # SQL migrations 0000–0004 (0004 = rate limits) + meta/ journal
├── 03-Tests/e2e/            # Playwright specs 00–08 + fixtures (private temp DB per run)
├── tests/                   # a few extra vitest suites (dashboard health)
├── scripts/                 # check-resend-secrets.py (+tests), test-docker-context.sh, misc
├── 05-Scripts/ 06-Infrastructure/  # older operational scripts / infra notes (legacy numbering)
├── 000-docs/                # current docs at root (276–286), everything older in 262-MS-archive/
├── 99-Archive/              # archived code: the Firebase-era Expo mobile app, the old survey app
├── public/                  # static assets (images, animations)
├── .github/workflows/       # ci.yml, deploy.yml, release.yml, auto-fix.yml, branch-protection.yml, synthetic-qa.yml
├── .beads/                  # task tracker (beads/Dolt); issues.jsonl export
├── Dockerfile docker-compose.yml next.config.ts drizzle.config.ts playwright.config.ts vitest*.mts
└── AGENTS.md CLAUDE.md      # agent instructions ("This is NOT the Next.js you know" + beads workflow)
```

On `main` today, `nwsl/`, `tmp/`, `tools/`, `docs/`, the `google-adk-reference` symlink, and `src/app/games/` still exist. PR #59 removes them.

### Load-Bearing Files

| File | Role | Why it breaks everything |
|---|---|---|
| `src/lib/db/index.ts` | Opens SQLite, sets WAL and foreign keys, registers every schema, **runs migrations on import** | Every data path imports it. A bad path or migration puts every route on a broken DB |
| `src/auth.ts` | Auth.js config; the `authorize()` credential check | Sign-in for every user. The only place the email-verified gate lives |
| `src/proxy.ts` | Request gate for all non-static paths (`matcher` at line 66) | A wrong allow-list either locks everyone out or exposes private pages. Incident #45 was a proxy bug |
| `src/lib/workspaces/enforce.ts` | `assertWorkspaceActive`, which blocks writes for bad billing states | A bug here either blocks all writes or lets canceled accounts write |
| `src/lib/stripe/plan-mapping.ts` | Plan limits, price-ID mapping, Stripe status mapping | Enforced by write routes; will be the core of P2 pricing |
| `src/lib/db/schema/*.ts` + `drizzle/` | Table definitions and their migrations | Schema/migration drift equals runtime errors |
| `docker-compose.yml` | Prod env wiring, volume, port binding, healthcheck | A missing env passthrough here silently disables features. That's why `ANTHROPIC_API_KEY` doesn't reach the container (§8.2) |
| `.github/workflows/deploy.yml` | Prod deploy definition | Controls what reaches prod and how it's smoke-tested |
| `playwright.config.ts` | E2E harness: private fixture DB, env scrubbing, web server | The only end-to-end gate before prod |

---

## 6. Getting Started

### Prerequisites

| Tool | Version | Install | Verify |
|---|---|---|---|
| Node.js | 22.x (matches Docker and deploy) | nvm / nodesource | `node -v` → `v22.*` |
| npm | 10+ (ships with Node 22) | — | `npm -v` |
| Git + GitHub CLI | recent | — | `gh auth status` |
| C/C++ toolchain | for `better-sqlite3` and `bcrypt` native builds if prebuilt binaries don't match | `sudo apt install build-essential python3` | — |
| sqlite3 CLI | any | `sudo apt install sqlite3` | `sqlite3 --version` |
| Docker (optional) | 24+ | — | `docker compose version` |
| beads `bd` (optional, for task tracking) | 1.1.x | see `~/000-projects/BEADS-SETUP-PROMPT.md` | `bd --version` |

### Zero to Running

1. `git clone https://github.com/jeremylongshore/hustle.git && cd hustle`
2. `npm ci`. Expect ~1 minute. npm may print `install-scripts ... blocked` warnings; the app still builds and tests pass with them.
3. Create `.env.local` with the minimum a local run needs:
   ```bash
   AUTH_SECRET=<any 32+ random chars>            # openssl rand -base64 32
   NEXTAUTH_URL=http://localhost:3000
   APP_ORIGIN=http://localhost:3000
   BILLING_ENABLED=false
   # optional: ANTHROPIC_API_KEY=...   (AI routes throw without it)
   # optional: SMTP_HOST/SMTP_PORT/SMTP_SECURE/SMTP_USER/SMTP_PASS/EMAIL_FROM (verification email)
   ```
   Don't copy `.env.example` wholesale. It still lists dead Firebase variables (§8.7).
4. `npm run dev`, then open http://localhost:3000. On first request the app creates `data/hustle.db` and applies every migration automatically.
5. **Register an account**, then mark it verified by hand. Without SMTP the verification email can't send, and sign-in requires a verified email:
   ```bash
   sqlite3 data/hustle.db "UPDATE user SET emailVerified = CAST(strftime('%s','now') AS INTEGER)*1000 WHERE email='you@example.com';"
   ```
6. Sign in at `/login`. You land on `/dashboard`. Add an athlete, log a game, open Dream Gym.
7. Run the gates the same way CI does:
   ```bash
   npm run lint                 # ESLint (≈157 existing warnings; errors must be 0)
   npx tsc --noEmit             # typecheck
   npm run test:unit            # Vitest unit (~900 tests)
   npm run test:integration     # Vitest integration (16 tests)
   npx playwright install chromium && npm run test:e2e -- --project=chromium   # E2E (starts its own server + private DB)
   npm run build                # production build
   ```

### Common Setup Problems

| Symptom | Cause | Fix |
|---|---|---|
| `Invalid email or password` for an account you just registered | Email not verified. The sign-in gate throws `EMAIL_NOT_VERIFIED`, and older builds show it as a generic error | Run the step-5 SQL, or configure SMTP |
| `Error: ANTHROPIC_API_KEY is not set` on the AI pages | No key | Add the key to `.env.local`, or skip AI features |
| Build fails compiling `better-sqlite3` or `bcrypt` | No native toolchain, or a Node ABI mismatch | Install `build-essential python3`, then `npm rebuild better-sqlite3 bcrypt` |
| `npx tsc` prints "This is not the tsc command you are looking for" | Dependencies not installed yet | `npm ci` first |
| E2E fails on a machine where dev is running | The Playwright config refuses to reuse an existing server (`reuseExistingServer: false`) because it owns a private fixture DB | Stop `npm run dev`. Port 4000 must be free |
| Lint reports an error in `99-Archive/**/next-env.d.ts` | A generated file exists locally in the archive | Ignore it. It's untracked, and CI doesn't see it |
| Sessions break after changing `.env.local` | `AUTH_SECRET` changed, so existing JWTs are invalid | Sign in again |

---

## 7. Operations

### Command Map

| Task | Command | Notes |
|---|---|---|
| Run locally | `npm run dev` | http://localhost:3000 |
| Unit tests | `npm run test:unit` | `vitest.config.mts` |
| Integration tests | `npm run test:integration` | `vitest.integration.config.mts`, serial, forked |
| E2E | `npm run test:e2e -- --project=chromium` | Builds and starts its own server on :4000 in CI mode |
| Lint | `npm run lint` | ESLint 9 flat config |
| Typecheck | `npx tsc --noEmit` | — |
| Build | `npm run build` | Next standalone output |
| New migration | edit `src/lib/db/schema/*.ts`, then `npx drizzle-kit generate --name <slug>` | Commit both the SQL and `drizzle/meta/*`. Also add the schema to `src/lib/db/index.ts` and `src/test-utils/db.ts` |
| Deploy production | merge to `main` | `deploy.yml` runs automatically |
| Re-deploy without a code change | `gh workflow run deploy.yml --repo jeremylongshore/hustle` | `workflow_dispatch` is enabled |
| Deploy status | `gh run list --workflow deploy.yml --limit 5` | — |
| Prod health | `curl -s https://hustlestats.io/api/health \| jq` | Deep check (DB, env, email config) |
| Prod SMTP probe | `curl -s https://hustlestats.io/api/health/email \| jq` | No-send TLS/auth probe, cached ~60s |
| Liveness | `curl -s https://hustlestats.io/api/healthz` | `{ok:true}`; doesn't touch the DB |
| App logs | `ssh intentsolutions 'docker logs --tail 200 -f hustle-app'` | Tailnet access required |
| Access logs | `ssh intentsolutions 'sudo tail -f /var/log/caddy/hustle-access.log'` | JSON lines |
| DB shell (read-only) | `ssh intentsolutions "docker exec hustle-app node -e \"const D=require('better-sqlite3');const d=new D('/data/hustle.db',{readonly:true});console.log(d.prepare('select count(*) c from user').get())\""` | There's no sqlite3 binary in the image. Use node |
| Rollback | see below | Manual |

### Deployment

**Pre-flight (on the PR):**
- CI must be green: **Lint, Type Check, and Test** (lint, tsc, build, unit, integration, Chromium E2E), **Build Docker Image** (Docker build plus container smoke on `/api/healthz`), **Pre-merge Validation**, and **Auto-Fix Linting Issues**.
- There is **no AI reviewer** on this repo. CI is the gate.

**What happens on merge:**
1. `deploy.yml` → `build-gate` job: the secret scanner (`scripts/check-resend-secrets.py`), then `npm ci` and `npm run build` on Node 22.
2. `deploy` job → the shared `jeremylongshore/.github/.github/workflows/vps-deploy.yml@53d6be37…`:
   - Tailscale OIDC join
   - SSH as `intentsolutions@intentsolutions`. The key is force-commanded to `/usr/local/sbin/deploy-hustle`.
3. On the VPS, `deploy-hustle`:
   - `cd /srv/hustle && git fetch origin main && git reset --hard origin/main`
   - `docker compose up -d --build --pull always`
   - polls `http://127.0.0.1:8084/api/healthz` 10 × 3s
4. CI smoke: `curl --resolve hustlestats.io:443:167.86.106.29 https://hustlestats.io/api/health/email` must satisfy `.status == "pass" and .transport == "smtp" and .check == "tls-authentication"`. It gets 5 attempts, 10s apart.

Also on every push to `main`: `release.yml` computes a semver bump from commit messages, updates the version and CHANGELOG, tags, and creates a GitHub release. On `main` today it **fails every time** (§8.10). PR #59 fixes it.

**Verification after a deploy:**
```bash
gh run list --workflow deploy.yml --limit 1          # conclusion: success
curl -s https://hustlestats.io/api/health | jq .status   # "healthy"
ssh intentsolutions 'docker inspect hustle-app --format "{{.State.StartedAt}}"'   # new start time
```

**Rollback protocol (manual; there is no automatic rollback):**
1. **Preferred, revert on GitHub:** `gh pr revert <PR#>` or `git revert <sha> && git push` through a PR. Merging it redeploys the previous code.
2. **Emergency** (CI is broken, or the site must come back now):
   ```bash
   ssh intentsolutions            # needs an interactive account with sudo; the deploy key can't do this
   cd /srv/hustle && git log --oneline -5
   git reset --hard <last-good-sha> && docker compose up -d --build
   curl -fsS http://127.0.0.1:8084/api/healthz
   ```
   Then revert on GitHub, or the next deploy re-applies the bad commit.
3. **If a migration corrupted data:** stop the container, then restore `/data/hustle.db` from the nightly dump. The procedure is in `~/000-projects/intent-os/ops/backup/RUNBOOK-vps-recovery.md`. The dump path in the archive is `var/backups/db-dumps/hustle.sqlite`. A restore was proven on 2026-09-18 (bead `hustle-pk7.7`).

### Monitoring & Alerting

- **Container healthcheck:** compose runs `curl -fsS http://127.0.0.1:8084/api/healthz` every 30s. It's liveness only and doesn't touch the DB.
- **Outside-in check:** `hustlestats.io` is one of the estate's revenue-critical public endpoints in the intent-os observability registry, fed by `outside-in-collector.sh` (`~/000-projects/intent-os/ops/observability/README.md:26`). Alerts go to Slack `#prod-incidents` via the estate `notify.sh` (Slack-only since 2026-06-13).
- **Host metrics:** Netdata on the VPS, tailnet-only: `http://intentsolutions:19999`.
- **Application errors:** **no error tracker**. No Sentry (`SENTRY_DSN` exists only in the dead `src/env.mjs`), and OpenTelemetry was removed (`src/instrumentation.ts`). Errors reach `docker logs` through `src/lib/logger.ts` and `console.error`, and nobody is alerted.
- **Trial-reminder job:** the systemd unit has an `OnFailure=` drop-in that routes to estate notifications.
- **SLIs/SLOs:** not defined.
- **On-call:** Jeremy only. No rotation.

### Incident Response

| Severity | Definition (for Hustle) | Response Time | Playbook |
|---|---|---|---|
| P0 | Site down, data loss, or **any child-safety event** (exposed minor data, unwanted adult contact, abusive content) | Immediate | Site down: check `docker ps`/logs on the VPS, then roll back (§7). Child-safety: disable the feature, preserve evidence, notify Jeremy; the CSAM reporting duty is in 285 §4. **The child-safety runbook doesn't exist yet (P1/P4 work)** |
| P1 | Sign-in, registration, or email broken; billing state wrong once billing is on | 15 min | `/api/health`, `/api/health/email`, `docker logs`. Incident examples: `000-docs/279` (auth), `000-docs/277` (email secret) |
| P2 | A single feature broken (AI, analytics, uploads) | 1 hour | Fix forward through a PR |

Write every incident up as `000-docs/NNN-OD-INCD-<slug>.md` (see 277 and 279 for the format).

---

## 8. Things That Will Bite You

Ordered by likelihood × impact.

### 8.1 Admin authorization failed open (fixed in PR #62)
- **What it was:** the two admin surfaces (billing-event replay and the per-workspace billing ledger) each kept a hardcoded allow-list. Both treated an empty list as "dev mode". The lists were empty.
- **Fix:** PR #62 moves the check into `src/lib/admin.ts`. `isAdmin()` reads `ADMIN_USER_IDS` (comma-separated), and **an empty value means no admins**. Tests are in `src/lib/admin.test.ts`. Bead `hustle-4dc.1`.
- **After deploy:** put the owner's user ID in `/srv/hustle/.env` as `ADMIN_USER_IDS=<id>` to use the admin tools again.
- **Prevention:** never write authorization code that treats "not configured" as "allow". Review every new role check for fail-open defaults.

### 8.2 AI features are dead in production
- **Symptom:** the AI recommendation and Dream Gym "AI strategy" features error in prod but work locally with a key.
- **Cause:** `ANTHROPIC_API_KEY` is **not in `/srv/hustle/.env`** and is **not passed through in `docker-compose.yml`** (the compose `environment:` block has no Anthropic entry). `src/lib/ai/claude.ts:72-76` throws when it's missing.
- **Fix:** add `ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}` to compose, put the key in the VPS `.env`, and redeploy. Also review `DEFAULT_MODEL = 'claude-sonnet-4-6'` (`claude.ts:28`) against the current model lineup, and add AI cost caps before P3 (282 §2).
- **Prevention:** make `/api/health` report "AI configured: yes/no" the way it does for email.

### 8.3 This is not the Next.js in your training data or tutorials
- **Symptom:** code copied from docs or blog posts fails, or behaves differently.
- **Cause:** Next 16 (App Router, `proxy.ts` instead of `middleware.ts`, async request APIs). `AGENTS.md` warns: "Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."
- **Fix/Prevention:** check `node_modules/next/dist/docs/` for the installed version before using an API. Keep Next exact-pinned (`"next": "16.2.1"`; 16.3.5 in #61).

### 8.4 Migrations run on boot and swallow their own failure
- **Symptom:** after a deploy, the healthchecks pass (`/api/healthz` doesn't touch the DB) but data routes 500 with "no such column" or "no such table".
- **Cause:** `src/lib/db/index.ts:53-60` runs `migrate()` on import and only `console.error`s on failure. The app keeps serving on a partially migrated schema, and there are no down-migrations.
- **Fix:** read `docker logs hustle-app | grep "\[db\] migration error"`, fix the migration forward, and restore from the nightly dump if data was damaged.
- **Prevention:**
  - Write additive-only migrations.
  - Run `drizzle-kit generate` and read the SQL.
  - Test the migration against a copy of prod (`sqlite3 .backup` from the nightly dump).
  - Add a migrations-applied check to `/api/health`.
  - Consider making a migration failure crash the process so the deploy smoke test fails.

### 8.5 Deploys build on the prod VPS and replace the container in place
- **Symptom:** a few seconds of 502s during every deploy. A deploy can fail with "no space left on device". Other estate services slow down during builds.
- **Cause:** `deploy-hustle` runs `docker compose up -d --build --pull always` on the VPS, which shares CPU and disk with ~35 containers. There's a single container with no blue/green, and no previous image kept for rollback.
- **Fix:** today, retry the deploy, or `docker system prune` on the VPS (coordinate with Jeremy, since it's shared). Longer term, build the image in CI, push it to a registry, pull on the VPS, and keep `:previous` for one-command rollback.
- **Prevention:** don't merge several PRs back-to-back without waiting for each deploy to finish (`concurrency: deploy-vps-…` queues them, but each one rebuilds).

### 8.6 Node version drift between CI and prod
- **Symptom:** something passes CI but fails in prod, or the reverse, for native modules or new Node APIs.
- **Cause:** `ci.yml` sets up **Node 20**. `deploy.yml`'s build gate and the Docker image use **Node 22**.
- **Fix/Prevention:** set CI to `node-version: '22'` and add `"engines": { "node": ">=22 <23" }` plus an `.nvmrc`. Small P0 follow-up.

### 8.7 Stale Firebase and Postgres leftovers that look live
- **Symptom:** confusing config. Someone sets a Firebase variable, expecting it to matter.
- **Cause:**
  - `Dockerfile` still sets six `NEXT_PUBLIC_FIREBASE_*` build args (the "Phase 2" comment; the key is already redacted).
  - `.env.example` lists `FIREBASE_*` and a `NEXT_PUBLIC_API_DOMAIN`.
  - `src/env.mjs` validates `DATABASE_URL` as a *PostgreSQL* URL but is imported nowhere.
  - `/srv/hustle/.credentials/hustle-monitoring-key.json` on the VPS is a 0-byte leftover.
  - The `README.md` is the create-next-app boilerplate ("Deploy on Vercel").
- **Fix:** delete the Firebase `ARG`/`ENV` lines from the Dockerfile, rewrite `.env.example` to the real variable set (§9), delete `src/env.mjs`, and replace the README with a short pointer to this doc. A good first PR for a new contributor.

### 8.8 Email verification is mandatory, so no SMTP means no users
- **Symptom:** people register but can never sign in.
- **Cause:** `src/auth.ts` authorize throws `EMAIL_NOT_VERIFIED` until `user.emailVerified` is set. It's set only through the emailed link.
- **Fix:** watch `/api/health/email` (the deploy smoke test already requires it to pass). Locally, use the SQL in §6 step 5.
- **Prevention:** keep the SMTP readiness probe in the deploy gate. Don't weaken the gate, because it's the COPPA-relevant parent verification.

### 8.9 Rate limiting assumes Caddy is the only proxy (PR #60)
- **Symptom (if the topology changes):** every user shares one rate-limit bucket and logins start failing with 429.
- **Cause:** `clientIp()` takes the right-most `X-Forwarded-For` entry, which is correct only while Caddy talks directly to clients with no `trusted_proxies`. `dig +short hustlestats.io` = `167.86.106.29` (no CDN).
- **Fix/Prevention:** if Cloudflare or any other proxy is ever put in front, configure Caddy `trusted_proxies` and revisit `src/lib/rate-limit.ts`. `RATE_LIMIT_SCALE` exists only for E2E, and it only loosens the per-IP rules.

### 8.10 Release tags vs. history (fixed 2026-09-18)
- **What happened:** `release.yml` failed on every push. After the #59 fix, it then fell back to "all history" because the old `v1.0.0` and `v2.0.0` tags point to commits **outside `main`'s current history** (history was replaced at some point). That fallback pushed a 440-line CHANGELOG entry to `main` (`ab5a7a36`).
- **Fix:** an annotated tag **`v2.1.0`** was seeded on `main` (`ab5a7a36`) as the reboot baseline. Releases now compute from it; the next merge produced **v2.2.0**.
- **Know this:** `release.yml` **pushes commits straight to `main`** (version bump plus CHANGELOG, marked `[skip ci]`) and creates tags and GitHub releases on every push. After any merge, `git pull` before starting new work. The GitHub release list still shows the orphan `v2.0.0` release (Feb 2026); leave it or delete it, it no longer affects anything.

### 8.11 Beads (task tracker) state is local
- **Symptom:** you run `bd ready` and see nothing, or different issues than Jeremy.
- **Cause:** the beads Dolt database (`.beads/embeddeddolt/`) is gitignored and lives only on the machine where it was created. The repo carries only an export (`.beads/issues.jsonl`) and the GitHub/Plane mirrors. The DB was re-initialized on 2026-09-18 with prefix `hustle`, and the pre-reboot 213-issue store is preserved in `.beads/backup/`.
- **Fix:** follow the work through **GitHub issues #52–#58** (one per roadmap phase) and Plane project **HST**. Coordinate with Jeremy before running `bd init` in your clone.

### 8.12 Stripe webhooks can't reach the app (billing will silently break)
- **Symptom (the day billing turns on):** checkout succeeds in Stripe, but the workspace plan never changes, and cancellations and failed payments are never recorded.
- **Cause:** `src/proxy.ts` exempts only `/api/auth/`, `/api/health*`, and `/api/internal/` from the session redirect (lines 15-28). Stripe sends no cookie, so `POST /api/billing/webhook` and `POST /api/webhooks/stripe` both get a 307 to `/login` before the handler runs. Separately, the two handlers overlap: both process `customer.subscription.updated/deleted` and `invoice.payment_failed`, and both use the same `webhookEvent` idempotency key. Whichever runs first marks the event done, and the other skips it.
- **Fix:** allow-list **one** webhook path in the proxy, merge the handlers, and add a test that a signed event reaches the handler. Bead `hustle-rs5.1`. **This blocks P2.**
- **Prevention:** any route authenticated by something other than the cookie (webhooks, internal jobs, future mobile bearer tokens) must be added to `publicPrefixes` *and* do its own auth.

### 8.13 About a third of the API is dead or duplicated
- **Symptom:** you fix a bug in one route and the UI doesn't change.
- **Cause:** migration leftovers. Examples: `/api/practice-logs` (used) vs `/api/players/[id]/practice-logs` (unused); `/api/workout-logs` (used) vs `/api/players/[id]/dream-gym/workout-logs` (only called from unused components); `billing/create-portal-session` (used; the *weaker* one) vs `billing/portal` (unused). `error-boundary.tsx:22` posts to `/api/error`, which doesn't exist. The full list is in Appendix E.
- **Fix:** before editing a route, grep for its caller: `rg "api/<path>" src/app src/components`. Cleanup is tracked in bead `hustle-pk7.9`.

---

## 9. Security & Access

### Access Control

| Role | Purpose | Permissions | MFA |
|---|---|---|---|
| GitHub repo admin | Jeremy | Merge, settings, secrets | Per GitHub account |
| GitHub collaborator (Ravi, once added) | Build | Branch, PR; merge only if granted | Enable GitHub 2FA |
| CI deploy identity | Automated deploy | Tailscale OIDC → an SSH key **force-commanded** to `/usr/local/sbin/deploy-hustle` (`~intentsolutions/.ssh/authorized_keys`, `no-pty`, no forwarding) | N/A (OIDC) |
| VPS interactive access | Ops | `ssh intentsolutions` over Tailscale only; sudo as `intentsolutions` | Tailscale identity |
| App: parent user | Owns a workspace | Their workspace and players only, enforced in query modules and `src/lib/workspaces/*` | None (email + password) |
| App: "admin" | Billing replay, ledger view | User IDs listed in `ADMIN_USER_IDS` (fail closed; PR #62) | — |
| App: internal jobs | Trial reminders | Bearer `HUSTLE_INTERNAL_TOKEN`, constant-time compare (`src/app/api/internal/trial-reminders/route.ts:11,32`) | — |

### Secrets

- **Where (prod):** `/srv/hustle/.env` on the VPS, **plaintext, mode 600**. It holds `SESSION_SECRET`, `NODE_ENV`, `TZ`, `HUSTLE_INTERNAL_TOKEN`, `EMAIL_FROM`, `SMTP_HOST/PORT/SECURE/USER/PASS`, `BILLING_ENABLED`. It does *not* hold `ANTHROPIC_API_KEY`, Stripe keys, or `APP_ORIGIN` (compose defaults it to `https://hustlestats.io`). Compose maps `AUTH_SECRET` from `SESSION_SECRET` when it's unset.
- **Estate standard not yet applied:** Intent Solutions repos are migrating to SOPS + age (encrypted `.env.sops` committed, decrypted in memory). Hustle hasn't been migrated (`sops-init --check` would fail). This is a P0/P1 follow-up.
- **GitHub Actions secrets:** `TS_OIDC_CLIENT_ID`, `TS_AUDIENCE`, `VPS_DEPLOY_KEY`, `VPS_HOST_KEY` (deploy), `STRIPE_SECRET_KEY` (unit tests), `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`.
- **Committed-secret guard:** `scripts/check-resend-secrets.py` runs in CI and in the deploy gate, and scanned 1,490 files clean on 2026-09-18. History scrub: `000-docs/276-TQ-SECU-key-rotation-inventory.md`. **Git history still contains an old Firebase web key**, which is low risk since Firebase is deleted; a history rewrite is owner-gated.
- **Rotation:** no policy. **Emergency access:** Jeremy only.

### Honest Security Assessment

**Implemented:**
- bcrypt password hashes
- mandatory email verification
- JWT sessions with a server secret
- per-route session checks, plus the proxy redirect
- workspace-scoped queries
- write-time plan enforcement
- Stripe webhook signature verification and idempotency
- constant-time internal-token comparison
- upload validation (`src/lib/storage/upload-validation.ts`)
- security headers via Caddy
- the committed-secret scanner
- a force-command deploy key
- a tailnet-only VPS SSH
- nightly consistent backups with an off-site immutable copy, restore proven 2026-09-18

**In flight (open PRs):**
- #60: brute-force rate limits on sign-in, registration, password reset, verification mail, PIN, and game creation (**none existed before**)
- #61: every critical and high npm advisory patched (Auth.js and Next.js criticals among them)

**Not implemented / weak:**
- The admin fail-open, fixed in PR #62 (§8.1).
- No MFA for parents.
- No account lockout notifications.
- No audit log of data access.
- No error tracking or alerting on app exceptions.
- Plaintext prod `.env`.
- **Cross-family data read through debug routes, fixed in PR #62.** `debug/biometrics/[playerId]` and `debug/workout-logs/[playerId]` looked up the player but never stopped when it wasn't the caller's, then returned logs by `playerId` alone. PR #62 deletes all debug routes, plus `/api/hello` and `/api/test-post`.
- **Ownership is only as strong as each route's check.** Most query functions ignore their `userId` argument and filter by `playerId` alone (e.g. `src/lib/db/queries/biometrics.ts:90`, `workout-logs.ts:102`). Every `players/[id]/**` route is safe today only because it calls `getPlayerAdmin` first, and the debug routes show what one missed check does. Bead `hustle-4dc.2` moves ownership into the query layer.
- **Internal error text reaches clients** in about 12 routes (AI, checkout, webhook, verify, storage, and the public `/api/health`, which also lists missing env var names). Bead `hustle-4dc.3`.
- **Workspace status is enforced on only 4 write routes.** Canceled or past-due workspaces can still write most log types (`hustle-4dc.4`).
- **Weak input validation** on `players/create`, the Dream Gym JSON fields, and uploads (client-supplied MIME type; no `nosniff`). Bead `hustle-4dc.5`.
- The minors' safety foundation (consent flows, parent controls, moderation, NCMEC runbook, no adult-to-minor messaging) is **all still to build**. See 285 for what's legally required versus best practice, **pending counsel review**.

---

## 10. Cost & Performance

### Monthly Costs

| Resource | Cost | Notes |
|---|---|---|
| VPS (Contabo VDS, shared by the whole estate) | Hustle's marginal share ≈ $0 | Hustle uses ~92 MiB RAM and ~0% CPU idle (`docker stats`, 2026-09-18) |
| Domain hustlestats.io | Registrar annual fee | Auto-renew confirmed on (cross-session log 2026-09-07) |
| MXroute SMTP | Estate plan, $0 marginal | — |
| Backups (borg → dev box → B2) | Estate-level | Hustle's DB is tiny |
| Anthropic API | $0 today (no key in prod) | Budget per 282 §6 once enabled: ~$0.10–$0.50 per paying family per month with caps |
| Stripe | $0 until billing is on | 2.9% + 30¢ per charge |
| GitHub Actions | Free tier / plan | A CI run is ~8–10 min including E2E |

### Performance

- **Latency** was measured 2026-09-18: 50 sequential requests per URL from the dev box, each a fresh TLS connection, so the numbers include the network and TLS handshake.

  | URL | p50 | p95 | p99 | Status |
  |---|---|---|---|---|
  | `/` (landing) | 507 ms | 606 ms | 644 ms | 200 |
  | `/login` | 474 ms | 561 ms | 603 ms | 200 |
  | `/api/health` (DB + env check) | 382 ms | 512 ms | 540 ms | 200 |
  | `/api/healthz` (no DB) | 372 ms | 530 ms | 557 ms | 200 |

  Server time is small: `/api/health` reports `latencyMs` of 3–8. So ~370 ms of every request is network and TLS between the dev box and the VPS. Real users see their own round trip plus roughly 0–130 ms of rendering. There is no APM, so authenticated pages and write routes are unmeasured.
- **Data size:** the production DB file is 4 KB, plus the WAL. The whole data volume is 344 KB, with 3 users.
- **Throughput:** not load-tested. At this data size a load test would measure Node and Next, not the database. Re-run it once real data exists.
- **Error budget:** not defined.

### Scaling Limits

| Limit | Where it bites | Mitigation |
|---|---|---|
| One container | Downtime every deploy; no HA | Image-based deploys with a kept previous tag; eventually two instances, which requires moving off shared SQLite |
| SQLite single writer | Heavy concurrent writes (video metadata, chat, real-time challenges) | Keep writes short. Postgres if contention appears |
| Uploads on the same volume as the DB | Video (P4) would swamp the disk and backups | Object storage for media (P4 requirement) |
| Build on the VPS | Disk and CPU contention with the estate | Build in CI |
| Anthropic calls are synchronous in request handlers | Slow AI replies tie up requests; no retry/backoff budget | Queue longer generations (weekly plans) in P3 |

---

## 11. Current State

### What's Working
- **The production site is up and healthy.** `/api/health` → `healthy` with DB, env, and email checks passing. `/api/health/email` → `pass` (SMTP TLS/auth) as of 2026-09-18, after PR #50.
- **Auth end-to-end:** registration → verification → sign-in → session, covered by E2E specs `00`, `01`, `05`, `06`, `07`.
- **Core logging:** athletes, games, stats, verification PIN, and the full Dream Gym suite, wired to Drizzle/SQLite (`src/lib/db/queries/*`). E2E spec `08-dream-gym`.
- **Billing code:** Checkout, portal, webhooks, idempotency, ledger, enforcement. Built and unit-tested, but not live.
- **CI:** a full gate on every PR, including Chromium E2E and a Docker image smoke.
- **Backups:** nightly consistent SQLite dump, off-site immutable copy, and a restore proven on 2026-09-18 (integrity `ok`, all tables, counts match prod).

### What Needs Attention

- **High:**
  - Admin fail-open and cross-family debug reads → fixed in PR #62; merge it first (`hustle-4dc.1`).
  - Ownership lives only in route handlers, not queries → one missed check leaks data → `hustle-4dc.2`.
  - Stripe webhooks unreachable, with duplicate handlers → billing would silently break → `hustle-rs5.1` (blocks P2).
  - Minors' safety foundation absent → can't ship public or social features → P1 (285, counsel review).
  - No error tracking → failures are silent → add an error tracker, or at least log-based alerting to Slack.
- **Medium:**
  - `ANTHROPIC_API_KEY` missing in prod → AI features broken → add it to compose and `.env`.
  - No rollback → a bad deploy needs manual recovery → build in CI with a kept previous image.
  - Migrations swallow errors → silent half-migrated schema → fail loudly and add a health check.
  - Plaintext prod secrets → not on the estate SOPS standard → `sops-init`.
  - Internal error text returned to clients; health data logged → `hustle-4dc.3`.
  - Workspace status enforced on only 4 write routes → `hustle-4dc.4`.
  - Unit coverage 23.9% with no CI gate; auth, games, verify, and webhooks at 0% unit (E2E covers some) → §11.
- **Low:**
  - Node 20/22 drift.
  - Stale Firebase config and README.
  - Dead `src/env.mjs`.
  - About a third of API routes are dead or duplicated (`hustle-pk7.9`).
  - Orphan v2.0.0 GitHub release.
  - 157 ESLint warnings.

### Test Coverage (measured 2026-09-18)

`npx vitest run --config vitest.config.mts --coverage` (unit suite, v8), on the pre-merge `main` code (the numbers barely move with #59–#62):

| Scope | Lines covered |
|---|---|
| **Whole `src/`** | **23.9%** (1,845 / 7,731); statements 23.4%, branches 21.5%, functions 19.5% |
| `src/lib/workspaces` (status enforcement, access) | 96.3% |
| `src/lib/billing` | 96.2% |
| `src/lib/validations` (Zod schemas) | 92.4% |
| `src/lib/db` (queries, schema) | 57.9% |
| `src/lib/stripe` | 52.9% |
| `src/app/api` (route handlers) | 24.7% |
| `src/lib/ai` | 15.0% |
| `src/app` pages | 3.7% |
| `src/components`, `src/hooks` | 0% |

Critical files:

| File | Coverage |
|---|---|
| `src/proxy.ts` | 100% |
| `src/lib/workspaces/enforce.ts` | 97% |
| `src/lib/stripe/plan-mapping.ts` | 95% |
| `src/lib/storage/local.ts` | 89% |
| `src/lib/stripe/plan-enforcement.ts` | 83% |
| `src/app/api/billing/webhook` | 31% |
| `src/auth.ts` | **0%** |
| `src/lib/auth.ts` | **0%** |
| `src/lib/db/index.ts` | **0%** |
| `src/app/api/games` | **0%** |
| `src/app/api/verify` | **0%** |
| `src/app/api/webhooks/stripe` | **0%** |

**How to read this.** Unit coverage is strong on the pure domain rules (enforcement, limits, validation) and weak on route handlers and UI.
- The **E2E suite** (9 specs) covers much of what unit tests miss: sign-in, registration, games, athletes, Dream Gym. It **passed 87/87 locally on 2026-09-18** (`CI=1 npx playwright test --project=chromium`, 4.7 min) and passes in CI. It isn't counted in these numbers.
- Real gaps with no automated test at any layer:
  - both Stripe webhooks (and they're unreachable anyway, §8.12)
  - the PIN verify brute-force path (limiter in #60)
  - cross-family access, i.e. tests that a foreign `playerId` is refused (`hustle-4dc.2`)
- There is **no coverage gate in CI**. Add one *after* P1 raises the floor, so it doesn't just block PRs.

### Implementation Status

| Component | Status | Evidence |
|---|---|---|
| Web app, auth | ✅ Implemented | `src/auth.ts`, E2E 01/06/07 |
| Athletes, games, stats | ✅ Implemented | `src/app/api/players/*`, `src/app/api/games/route.ts` |
| Game verification | ⚠️ Partial: a single self-PIN and a boolean; no coach co-sign | `src/app/api/verify/route.ts`, `games.verified` |
| Dream Gym (workouts, cardio, meals, biometrics, journal, assessments, schedule) | ✅ Implemented | `src/app/dashboard/dream-gym/*`, E2E 08 |
| AI recommendations/strategy | ⚠️ Code works; **prod has no key** | `src/lib/ai/claude.ts:72` |
| Billing (Stripe) | ⚠️ Implemented, **disabled** | `BILLING_ENABLED=false` in the VPS `.env` |
| Plan limits | ✅ Enforced at write time; single source (#59) | `src/lib/stripe/plan-mapping.ts` |
| Rate limiting | ✅ SQLite limiter on sign-in, registration, reset, verification mail, PIN, and games (#60; prod-verified) | `src/lib/rate-limit.ts` |
| Dependency advisories | ✅ 0 critical / 0 high (7 moderate, dev-only, waived) | #61 |
| Photo uploads | ✅ Local volume storage | `src/lib/storage/local.ts` |
| Calendar sync | ❌ Not built | — (P3) |
| AI adaptive gym plans (openGym patterns) | ❌ Not built | — (P3) |
| Recruiting profile / video | ❌ Not built | — (P4) |
| Safe competition | ❌ Not built | — (P5) |
| Native mobile | ❌ Archived (Firebase-bound) | `99-Archive/mobile/ARCHIVE-NOTE.md` (P6) |
| Parent consent / athlete accounts | ❌ Not built | — (P1) |
| Staging environment | ❌ None | — |
| Error tracking / APM | ❌ None | `src/instrumentation.ts` is empty |

**Merged and deployed on 2026-09-18** (each verified with `/api/health` = healthy after its deploy):
- **#59** (P0 part 1): dead code removal, Release fix, and plan-limit single source. Also carries the `bd init` beads wiring commit.
- **#60:** the SQLite rate limiter (new migration `0004_rate_limits.sql`).
- **#61:** Next 16.3.5 and the Auth.js security bumps.
- **#62:** the admin allow-list fails closed (`ADMIN_USER_IDS`), and the debug/hello/test-post routes are removed. Confirmed absent from the prod build.
- **Production proof for #60:** the same email failed sign-in 10 times with `CredentialsSignin`, and the 11th attempt got `RATE_LIMITED`.
- **Open: #63** sets `AUTH_URL` from `APP_ORIGIN`. Without it Auth.js builds URLs from the container bind address (`https://0.0.0.0:8084/...`, seen in `/api/auth/providers`). Sign-in still works because the login page ignores those URLs, but Auth.js-driven redirects would break.

---

## 12. Roadmap

This mirrors `000-docs/281-PP-RMAP-finish-roadmap.md`. Each phase has an **exit gate**. Tracking: GitHub issues **#52 (P0) through #58 (P6)**, Plane **HST-2 through HST-8**, beads epics `hustle-pk7`, `-4dc`, `-rs5`, `-ebv`, `-9vd`, `-5ng`, `-oyd`.

### Week 1 — Stabilization (finish P0, start P1)
- Merge #59, #61, then #60. Each deploy shows `/api/health` = healthy.
- Merge PR #62 (admin fail-closed), then set `ADMIN_USER_IDS` on the VPS.
- Add `ANTHROPIC_API_KEY` to compose and the VPS `.env`. `/api/ai/recommend` works in prod.
- Node 22 in CI; `engines` and `.nvmrc` added.
- Remove the Dockerfile Firebase args and the dead `src/env.mjs`. Rewrite `.env.example` and the README. (The debug and test routes are already gone in #62.)
- Move ownership into the query layer (`hustle-4dc.2`), with a test per route family that a foreign `playerId` is refused.

### Month 1 — Foundation (P1 safety + verified stats)
- The parent consent flow and athlete sub-accounts are designed and **reviewed by counsel** (285).
- Coach/parent co-sign replaces the boolean `games.verified` (signer, role, timestamp).
- Account deletion and data export available in the UI.
- An error tracker (or log-based Slack alerting) is live, so exceptions page someone.
- Prod secrets migrated to SOPS.
- Deploys build the image in CI and keep a rollback tag.

### Quarter 1 — Strategic (P2 → P3)
- Free/Family pricing live on Stripe (282), with `BILLING_ENABLED=true`, and the first paid family processed cleanly.
- AI gym plans built on openGym patterns (progression rules, muscle map, approve/undo coach), with cost caps.
- Unified calendar with ICS/Google sync, and an installable PWA with an offline stat queue.
- Exit gate for P3: 60% of active athletes follow a generated plan for 3+ weeks.

---

## 13. Quick Reference

### URLs

| Resource | URL |
|---|---|
| Production | https://hustlestats.io |
| Health (deep) | https://hustlestats.io/api/health |
| Health (SMTP) | https://hustlestats.io/api/health/email |
| Repo | https://github.com/jeremylongshore/hustle |
| Roadmap issues | https://github.com/jeremylongshore/hustle/issues?q=label%3Aepic (#52–#58) |
| Actions | https://github.com/jeremylongshore/hustle/actions |
| Plane project | https://projects.intentsolutions.io (workspace `internal`, project **HST**) |
| Netdata (tailnet only) | http://intentsolutions:19999 |
| Estate ops docs | `~/000-projects/intent-os/ops/README.md` (deploy, backup, observability, incident) |
| Shared deploy workflow | https://github.com/jeremylongshore/.github/blob/53d6be37d6c046818157b954acb33667ac095dd8/.github/workflows/vps-deploy.yml |

### First-Week Checklist (Ravi)
- [ ] GitHub collaborator access to `jeremylongshore/hustle`, with 2FA on
- [ ] Clone, `npm ci`, `.env.local` per §6, `npm run dev`, register, verify via SQL, sign in
- [ ] `npm run lint && npx tsc --noEmit && npm run test:unit && npm run test:integration` all green locally
- [ ] Run the E2E suite once locally (`npm run test:e2e -- --project=chromium`)
- [ ] Read 280 (vision), 281 (roadmap), 285 (safety) and this doc; skim 282–284
- [ ] Read `AGENTS.md` and check `node_modules/next/dist/docs/` before touching Next APIs
- [ ] First PR: one of the Week-1 cleanups (§12), e.g. adding the Anthropic key passthrough, or Node 22 in CI
- [ ] Watch one deploy end-to-end after a merge (Actions → deploy → `/api/health`)
- [ ] Agree with Jeremy on merge rights, branch naming, and the commit/PR standard (below)
- [ ] (Optional) Tailscale access to the VPS for logs, if Jeremy grants it

**Working conventions:**
- Branch from `origin/main`, never commit to `main`.
- Commits are `type(scope): imperative subject`, with a body covering what, why, and how it was verified.
- PRs state: what, why, layers touched, verification evidence, risk, rollback, and what remains.
- Keep `000-docs/` filed as `NNN-CC-ABCD-slug.md` (next number: 287).

---

## Appendices

### A. Glossary

| Term | Meaning |
|---|---|
| Workspace | The tenant: one per parent account, holding players and billing state |
| Player / athlete | A youth athlete record inside a workspace (not a login today) |
| Dream Gym | The training suite: workouts, cardio, Fuel Station meals, mental/breathing and journal, biometrics, assessments, schedule, strategy |
| Verified game | A game confirmed with the account's verification PIN (`games.verified`) |
| Co-sign | Planned (P1): a coach or parent verifies stats with signer, role, and timestamp |
| P0–P6 | Roadmap phases in doc 281 |
| Estate | All Intent Solutions services on the VPS |
| Force-command key | An SSH key restricted to running one command (the deploy script) |
| Bead | A task in the `bd` tracker; mirrored to GitHub issues and Plane |
| openGym | `DuarteSantos8/openGym`, an AGPL self-hosted gym tracker used as a design blueprint, never as code (280 §5) |

### B. Reference Links
- Vision/roadmap/money/stores/competition/safety: `000-docs/280`–`285`
- Incidents: `000-docs/277` (Resend secret), `000-docs/279` (auth browser regressions)
- SMTP runbook: `000-docs/278-OD-OPNS-smtp-email-operations.md`
- Key rotation inventory: `000-docs/276-TQ-SECU-key-rotation-inventory.md`
- Pre-reboot history (frozen, don't trust as current): `000-docs/262-MS-archive/`
- Estate backup authority: `~/000-projects/intent-os/ops/backup/README.md`
- Next.js docs for the installed version: `node_modules/next/dist/docs/`

### C. Troubleshooting Playbooks

**Site returns 502**
1. `ssh intentsolutions 'docker ps --filter name=hustle-app'`. Is it up, and is it restarting?
2. `docker logs --tail 200 hustle-app`. Look for boot errors or `[db] migration error`.
3. `curl -fsS http://127.0.0.1:8084/api/healthz` on the VPS.
4. If a deploy is mid-flight, wait for `gh run watch`.
5. If the last deploy broke it, roll back (§7).

**Health says `unhealthy`**
`/api/health` lists the failing check:
- `database`: volume or file problem.
- `environment.missing[]`: a required env var is absent. For example, `STRIPE_SECRET_KEY` shows up whenever billing is considered enabled, which is why `BILLING_ENABLED=false` is set explicitly.
- `email`: see the SMTP runbook (278).

**Nobody can sign in**
1. Check `/api/health/email`. If users can't verify, they can't sign in.
2. Check whether `SESSION_SECRET`/`AUTH_SECRET` changed. That invalidates every session and would break new sessions if it were removed.
3. After PR #60, a 429 or the "Too many sign-in attempts" message means the rate limiter tripped. The window is 15 minutes; per-IP limits reset on their own.

**AI feature errors**
Check that the key is present: `ssh intentsolutions 'grep -c ANTHROPIC /srv/hustle/.env'`. It's currently 0 (§8.2).

### D. Open Questions (for Jeremy)
1. **Merge rights for Ravi:** can he merge to `main` (which deploys to prod), or only open PRs?
2. **VPS access for Ravi:** tailnet and log access, or GitHub-only?
3. **The orphan v2.0.0 GitHub release:** delete it, or seed a matching `v2.0.0` tag, before the next auto-release creates `v1.x`?
4. **Error tracking:** self-hosted (GlitchTip/Sentry OSS on the VPS) or log-based Slack alerts?
5. **Counsel for doc 285:** who, and when? P1 can't close without it.
6. **D-U-N-S / app-store org accounts:** started?
7. **AI budget and model:** the monthly Claude spend cap and default model for P3.

### E. API Route Inventory (all 66 routes, reviewed 2026-09-18)

**Gate:** `src/proxy.ts` redirects any `/api/*` request without a session to `/login` (307). The only exceptions are `/api/auth/*`, `/api/health*`, and `/api/internal/*`. Handlers then check the session themselves.

**Ownership pattern:** `getPlayerAdmin(userId, playerId)` (`src/lib/db/queries/players.ts:55-57`), then a query by `playerId`. A route is safe only if it **stops** when `getPlayerAdmin` returns null (§9).

| Area | Routes | Auth | Ownership | Status | Notes |
|---|---|---|---|---|---|
| Auth (public) | `auth/[...nextauth]`, `register`, `verify-email`, `forgot-password`, `reset-password`, `resend-verification`, `logout`; **unused:** `send-password-reset`, `send-verification` | Public by design | Token-based where relevant | Live | Rate limits arrive in #60 |
| Players | `players` GET, `players/create` POST, `players/[id]` GET/PUT/DELETE | Session | Scoped by userId / `getPlayerAdmin` | Live | `create` has presence-only validation (`hustle-4dc.5`) |
| Games and verify | `games` GET/POST, `verify` POST | Session | `getPlayerAdmin` | Live | Games enforces status and plan. Verify doesn't check status |
| Dream Gym (per player) | `players/[id]/{assessments,biometrics,cardio-logs,journal,meal-logs,dream-gym,dream-gym/check-in}` + item routes | Session | `getPlayerAdmin` | Mostly live; the item `[logId]`/`[entryId]`/`[assessmentId]` routes and `dream-gym/events` are unused | No status enforcement (`hustle-4dc.4`); unvalidated JSON fields |
| Flat logs | `workout-logs`, `practice-logs` | Session | `getPlayerAdmin` | **Live** (used by the dashboard) | Nested twins are unused |
| Schedule | `schedule`, `schedule/[eventId]` | Session | Scoped by userId | Live | `playerIds` not ownership-checked |
| Analytics | `analytics` | Session | Scoped by userId | Live | — |
| AI | `ai/recommend`, `players/[id]/dream-gym/ai-strategy`; **unused:** `ai/feedback` | Session (proxy); ai-strategy also `getPlayerAdmin` | — | **Broken in prod** (no key, §8.2) | No per-user limits (`hustle-ebv.1`) |
| Billing | `billing/create-portal-session` (live); **unused:** `create-checkout-session`, `change-plan`, `portal`, `invoices` | Session | Default workspace | Off (`BILLING_ENABLED=false`) | Price-ID and return-URL validation (`hustle-rs5.2`) |
| Webhooks | `billing/webhook`, `webhooks/stripe` | Stripe signature | Stripe customer ID | **Unreachable** (§8.12) | Duplicate handlers (`hustle-rs5.1`) |
| Admin | `admin/billing/replay-events` (+ page `dashboard/admin/billing-logs`) | Session + `isAdmin` | — | Fail-closed after #62 | — |
| Storage | `storage/serve/[...path]`, `upload-user-photo`, `delete-user-photo`; **unused:** `upload-player-photo`, `delete-player-photo` | Session | Owner or a member of the owner's default workspace | Live | Traversal-safe (`local.ts:145-154`); no `nosniff` |
| Account/workspace | `account/pin`, `workspace/current`, `waitlist` | Session | Self | Live; **`waitlist` needs a session, so the public form can't work** | — |
| Internal | `internal/trial-reminders` | Bearer `HUSTLE_INTERNAL_TOKEN` (timing-safe) | — | Live (systemd timer) | — |
| Health | `healthz` (compose, CI), `health`, `health/email` (deploy smoke); **unused:** `healthcheck` (says "Firestore") | Public | — | Live | `/api/health` leaks env var names and DB error text (`hustle-4dc.3`) |
| Removed in #62 | `debug/auth-state`, `debug/biometrics/[playerId]`, `debug/workout-logs/[playerId]`, `hello`, `test-post` | — | — | Deleted | The two data debug routes allowed cross-family reads |
