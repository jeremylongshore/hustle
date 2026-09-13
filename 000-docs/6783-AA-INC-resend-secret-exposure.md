# Resend exposure and incomplete remediation — 2026-09-13

## Executive summary

Two September 7 Resend notices report automatic deletion of exposed credentials.
GitHub secret-scanning alerts 4 and 5 independently corroborate the reported
repository locations. On September 13, both exact values were rejected by a
read-only Resend API request with HTTP 400, `validation_error`, and the message
`API key is invalid`. No credential value, prefix or hash is reproduced here.

The repair in PR #49 existed but was never merged. Four copies of the first
reported key therefore remained in three documents on main. This change
completes that scrub and adds a blocking recurrence check. It does not rewrite
Git history or claim that historical exposure has been erased.

Production had a separate failure: `hustle-app` had an empty `RESEND_API_KEY`.
It was not using either revoked value. Registration and reset helpers still
called Resend, while the generic notification helper also required `EMAIL_FROM`,
which the deployed Compose service did not pass. A source scrub alone cannot
restore email delivery. The established estate sender is MXroute; restoring
application mail through that path is a separate runtime verification task.

## UTC evidence and repair history

| Time / revision | Evidence or attempted repair | Outcome |
| --- | --- | --- |
| October 2025, provider-linked `7eacc09c` | Onboarding key pasted into survey configuration and a test script | Later relocation into docs/archive retained historical objects |
| October 2025, provider-linked `c6b63b02` | Operational fix summary pasted an application key into an environment example | Same value propagated into RCA and local-auth documents |
| November 8 2025, `0b4b1d26` | Survey configuration moved from `docs/` to `000-docs/` without changing content | Current Onboarding copies are already redacted, but provider-linked historical objects remain reachable; the available rename record does not establish when redaction occurred |
| July 18 2026, PR #48 | Firebase key scrub | Adjacent Resend and NextAuth literals in the same environment example remained |
| July 18 2026 14:26:34 | GitHub alert #4 created | Open at September 13 baseline, validity reported unknown |
| September 7 2026 15:02:59 | GitHub alert #5 created | Publicly leaked, validity reported unknown |
| September 7 2026 15:03:06 / 15:03:08 | Two provider notices report automatic deletion | Their reported paths match GitHub alerts; exported mail has no Authentication-Results header, so header authentication alone is unavailable |
| September 7 2026 15:09:23, `922b66e7` / PR #49 | Four-file source scrub, including adjacent NextAuth and Groq values | Unmerged; no prevention gate or completed rollout |
| September 7 2026 15:16:56 | Required pre-merge unit command failed | 819 passed, 2 failed in game verification fixtures; the separate general CI job tolerated unit failures |
| September 13 2026 19:37:10 | Read-only production container inspection | Running since August 25, zero restarts, no OOM; email key present but empty |
| September 13 2026 19:37–19:40 | GitHub value comparison and bounded provider GET | Four exact main copies; both reported keys rejected as invalid |

The source history contains both original provider-linked commits and later
relocated documents. No force push, historical-object deletion or unrelated
credential rotation is part of this repair.

## Root causes and contributing factors

Operational documentation copied literal credentials instead of variable names
or secret-store references. Directory moves and narrow provider-specific scrubs
did not remove other values. A completed local repair was treated as a stopping
point despite its unmerged PR and failed pre-merge gate.

The production email failure is independent: Compose supplied an empty optional
Resend variable, auth mail used a second helper with a hardcoded test sender, and
the dependency-free health endpoint could still return success. No evidence
connects the September 7 revocation to a production credential change.

## Corrective changes and validation

PR #49's original four-file redaction is preserved. The new scan reads Git blobs
from the staged index, so an unstaged edit cannot conceal what will be committed.
`--ref` checks a named revision. Tracked documentation, hidden files, binaries
and archives are included. Output contains only paths, line numbers and a rule
name. Git/read errors fail closed. The high-confidence rule detects long Resend
credential-shaped tokens; it is not a substitute for GitHub's broader provider
and full-history scanning.

Before committing, stage the intended files, then run:

```bash
python3 -m unittest discover -s scripts -p test_check_resend_secrets.py -v
python3 scripts/check-resend-secrets.py
python3 scripts/check-resend-secrets.py --ref origin/main
```

The 13 hermetic tests passed. Against the baseline main revision `1f2630b8`, the
last command exits 1 and reports the four real historical-document locations.
Against the repaired index, it exits 0. These checks do not print values.
The Docker context also included private dotenv files because its ignore rules
had no such exclusion. The new `scripts/test-docker-context.sh` builds a tiny
scratch fixture using the real Docker ignore rules: the old configuration exits
1 because `.env` is copied, while the repaired configuration excludes four
private dotenv fixtures and retains three public inputs, including root and
nested `.env.example` templates. It sends no mail and uses no real credentials.
The Docker CI job runs this regression before the application build.

CI, strict pre-merge validation and the deployment build gate invoke the
scanner before application installation or deployment. Legitimate failing
application tests must be repaired; this change does not disable them.

The game-query tests now explicitly isolate normal mode from the job-wide E2E
flag and test the enabled mode separately. The old test reproduces both original
failures with the flag enabled; all four repaired tests pass with the surrounding
flag either enabled or unset. The full suite then passes 822 tests across 58
files. Lint passes with 158 existing warnings and zero errors; TypeScript passes.
The local npm 12 install initially withheld the native SQLite lifecycle script.
Only the reviewed, pinned `better-sqlite3@12.10.0` script is explicitly approved
in the manifest; no other dependency scripts or tests were bypassed.

## Operations, verification and rollback

For a new provider notice, independently inspect GitHub alert metadata and
locations through authenticated API access. Never paste the alert's `secret`
field into terminal output, issue text, a command argument or a document. Compare
values only in memory. Validate provider rejection with a bounded read-only
request and record only status/category. Revocation and source cleanup are
separate facts; preserve both in the incident record.

The original alerts can be resolved as revoked after verification, with a
reference to this repair. Resolution does not disable future scanning. No new
Resend key should be provisioned for this deployment: the estate's July 28
sender decision and IntentMail runtime instructions designate MXroute SMTP.
Use the approved private credential source and verify TLS/authentication before
changing the application environment. Such a probe does not prove delivery.

Rollback of the prevention gate can revert only its new scanner/workflow
changes if a demonstrated defect prevents safe delivery. Never restore a
credential literal to undo a documentation change. No database migration or
persistent-data mutation is required by the scrub. Production deployment uses
the existing VPS workflow and must retain its normal smoke checks and rollback
receipts.

Private sanitized receipts are in the operator's alert-review bundle under
`20260913T193100Z/hustle-resend/`. Mail bodies and private configuration remain
outside Git. No test email was sent during baseline verification. Account-level
audit history and recipient delivery are not established by credential rejection.

## References

- [GitHub PR #49](https://github.com/jeremylongshore/hustle/pull/49)
- [Resend automatic secret-scanning response](https://resend.com/changelog/github-secret-scanner)
- [Resend error reference](https://resend.com/docs/api-reference/errors)
- [GitHub leaked-secret remediation](https://docs.github.com/en/code-security/tutorials/remediate-leaked-secrets/remediating-a-leaked-secret)
- Work tracking: `spine-ah3.4`, under the operational-alert epic `spine-ah3`.
