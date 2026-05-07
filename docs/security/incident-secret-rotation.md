# Incident Secret Rotation

Updated: 2026-05-07
Status: active containment

This incident response assumes prior local `.env` and `.env.local` material may have been exposed. No secret values are recorded here.

## Containment facts

- `.env` is not tracked in git.
- `.env.local` is not tracked in git.
- `.gitignore` blocks `.env` and `.env.*`, while preserving `.env.example` and `.env.schema`.

## Rotation ledger

| Secret category | Rotated by user | Old secret invalidated | Production env updated | Local env updated | Status |
|---|---|---:|---:|---:|---|
| NextAuth / session signing | pending | no | no | no | pending |
| JWT signing | pending | no | no | no | pending |
| Download token signing | pending | no | no | no | pending |
| Action token signing | pending | no | no | no | pending |
| Encryption at rest | pending | no | no | no | pending |
| Stripe webhook signing | pending | no | no | no | pending |
| Resend webhook signing | pending | no | no | no | pending |
| Admin / bypass credentials | pending | no | no | no | pending |
| Sovereign / OGR session secrets | pending | no | no | no | pending |

## Required operator actions

1. Rotate every production secret currently listed as pending.
2. Invalidate previous credentials in upstream providers where possible.
3. Update local developer env values only after production rotation is complete.
4. Re-run `node scripts/security/env-integrity-check.mjs --ci`.
5. Re-run `node scripts/security/secret-scan.mjs`.
