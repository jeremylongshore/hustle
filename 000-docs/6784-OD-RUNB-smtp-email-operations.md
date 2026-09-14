# Application email through MXroute

Hustle sends verification, password reset and notification mail through the
existing approved MXroute SMTP account. The estate sender decision predates
this repair; no new account or Resend credential is required. The incident
history is in [the exposure RCA](6783-AA-INC-resend-secret-exposure.md).

## Configuration and ownership

Production is the `app` Compose service, container `hustle-app`, under
`/srv/hustle` on the approved `intentsolutions` SSH alias. Private SMTP values
come from the existing IntentMail configuration. Keep those values outside
Git, build contexts, command arguments, logs and issue descriptions.

| Variable | Meaning |
| --- | --- |
| `SMTP_HOST` | Approved MXroute server |
| `SMTP_PORT` | 465 for implicit TLS; 587 for mandatory STARTTLS |
| `SMTP_SECURE` | `true` with 465, `false` with 587; certificate validation remains enabled |
| `SMTP_USER`, `SMTP_PASS` | Existing account authentication |
| `EMAIL_FROM` | Authorized sender, configured once for every application mail path |
| `APP_ORIGIN` | Public origin used in verification and password reset links |

`src/lib/smtp.ts` owns transport creation, strict TLS, bounded connection
timeouts, safe errors and the no-send verification operation. The maintained
Nodemailer package is installed as `smtp-mailer` so the unused, incompatible
Auth.js optional email-provider peer does not pull in an older transport.
`src/lib/resend.ts` retains its filename for existing imports but delegates to
SMTP; the application no longer requires the Resend package or key.

One SMTP submission is attempted per application request. An ambiguous DATA
acknowledgement must not be retried automatically and create duplicate mail.
Registration and password reset retain their existing token and enumeration
semantics. An operator must not resend arbitrary user messages as a health test.

## Detection and diagnosis

`GET /api/healthz` remains process liveness. `GET /api/health` reports missing
mail configuration as degraded with HTTP 503. Other checks, including existing
billing configuration, keep their own meaning.

Production billing mode must be explicit. Set `BILLING_ENABLED=false` when
Stripe is not configured; core plan limits continue to operate and billing
routes return their documented unavailable response. Set it to `true` only
when the Stripe secret, webhook secret and all three price IDs are present in
the private VPS environment. Compose passes those names into the container,
but the repository must never contain their values. Monitor both `/api/healthz`
and `/api/health`; liveness cannot clear a deeper readiness failure.

`GET /api/health/email` verifies DNS, TCP, TLS and SMTP authentication without
MAIL, RCPT or DATA submission. It returns HTTP 200 only for `status=pass`,
`transport=smtp`, `check=tls-authentication`, with `checkedAt` and `validUntil`.
Failures return HTTP 503 and an allowlisted category. No credentials, addresses
or provider transcript are included. Responses require `Cache-Control: no-store`.

The application coalesces concurrent probes and caches either result for sixty
seconds per process, preventing repeated public requests from flooding the
provider. The probe has a twenty-second absolute deadline and closes its
transport. Deployment's public smoke now checks this functional endpoint.
Passing authentication proves the sender connection works; it does not prove
recipient acceptance, inbox delivery or absence of spam filtering.

For a failure, record UTC time, HTTP status, category and timestamps. Check only
environment variable names/presence, service status and sanitized application
errors. Configuration errors need the approved private configuration path;
authentication errors need the existing account owner/provider state; timeout
or transport errors need DNS/TLS/network investigation. Do not create a new
Resend key or disable TLS verification to clear the symptom.

## Deployment and rollback

Use the established main-branch Actions deployment. Before rollout, capture
the current immutable image ID, exact Compose and private environment files,
and an online SQLite backup with `PRAGMA integrity_check`. Validate candidate
Compose resolution privately, including every unchanged environment value.
Transfer credentials through stdin into a private file and replace `.env`
atomically. Do not print `docker compose config` or a full container inspection.

The September 13 backup is
`/var/backups/hustle-email/20260913T201715Z`, mode 0700, with files mode 0600.
It includes the original environment, Compose, installed deploy helper and an
integrity-checked SQLite backup. The exact old image is in its safe receipt.
The original `hustle_hustle-data` volume must survive deployment and rollback.

The installed legacy helper currently fetches main, builds/recreates the app
and waits for liveness. It does not implement automatic rollback; the historical
estate drill is not proof that this installed helper does. On a failed rollout,
stop additional deployments, restore the captured environment and Compose,
pin the captured image in a temporary Compose override, and recreate only
`app` using `docker compose up -d --no-build --pull never app` with that override.
Verify liveness and the expected version. Returning to the original image also
returns to its known missing-mail behavior; do not label that mail recovery.

This change has no database migration. Do not replace the active database with
the backup merely to roll back code, since that would discard new application
data. A demonstrated data repair requires a separately established target.

## Reproducible verification

```bash
NEXT_PUBLIC_E2E_TEST_MODE=true npm run test:unit -- --maxWorkers=2
npm run lint
npx tsc --noEmit
python3 -m unittest discover -s scripts -p test_check_resend_secrets.py -v
python3 scripts/check-resend-secrets.py
```

`smtp.test.ts` verifies configuration, TLS policy, sanitized failures, bounded
no-send verification and return contracts. `smtp-wire.test.ts` runs the real
transport against a temporary local TLS SMTP fixture with synthetic credentials:
authentication submits zero messages, both auth templates and notifications
reach the fixture, refusal fails, and an untrusted certificate is rejected.
`email-health.test.ts` uses a fake clock to prove coalescing, expiration,
failure visibility and recovery. Route tests exercise missing configuration and
verification-token persistence with SMTP configured and no Resend key.

Production receipts must separately record the deployed commit/image, HTTP
liveness and functional email result. A fixture delivery or authenticated
no-send probe must never be described as a real recipient receiving mail.
