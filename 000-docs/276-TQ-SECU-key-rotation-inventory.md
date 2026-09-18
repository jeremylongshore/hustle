# Committed-key rotation inventory (2026-07-18)

Keys found in git-tracked files and redacted at HEAD (branch `security/scrub-committed-keys`). Values are MASKED here. **History still holds the originals** until a separate purge; treat every key below as compromised and rotate it.

| Type | Prefix | sha256[:8] | Files |
|---|---|---|---|
| google-firebase | `AIzaSyDv...` | `8ade0316` | .env.example, 000-docs/187-AA-MAAR-hustle-auth-wiring-local-e2e.md, 000-docs/188-AA-MAAR-hustle-auth-wiring-staging-e2e.md, 000-docs/189-AA-SUMM-hustle-step-1-auth-wiring-complete.md, 000-docs/190-AA-MAAR-hustle-env-firebase-local-unblock.md, 000-docs/217-AA-COMP-hustle-complete-journey-phase1-to-phase5.md, 000-docs/257-DR-GUID-mobile-app-setup-guide.md, Dockerfile |

## Rotation status

- The key GitHub secret-scanning flagged was already auto-revoked by the provider.
- Firebase/Google `AIza…` *web* keys are public by design (client identifiers); restrict them by referrer/app in the Google/Firebase console rather than rotating.
- All `sk-…` (OpenAI/Anthropic) keys are real secrets: rotate in the provider dashboard and update the runtime config (SOPS/`.env`, never committed).
