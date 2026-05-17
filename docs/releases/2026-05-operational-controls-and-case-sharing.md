# 2026-05 Operational Controls and Case Sharing

## Release boundary

- **Commit:** `305693015` — `Ops: add production operational controls`
- **Release shape:** one mixed production-readiness commit. It intentionally contains both operational hardening and minimum viable case sharing, and should be treated as a single deployed boundary rather than split retroactively.

## Operational controls included

- Postgres-backed operational rate-limit cleanup support.
- Latest-terms enforcement before Professional trial start and governed-case save.
- Feedback privacy posture tightened so free-text comments are explicitly discouraged from carrying confidential or identifying material.
- Supporting operational schema for:
  - rate-limit events
  - terms acceptances
  - stale-case notifications

## Case sharing included

- Professional-gated client-safe case sharing with `VIEWER` and `AUDITOR` roles.
- Hashed share-token storage, expiry handling, revoke support, and safe audit events.
- Public shared-case view with client-safe-only fields and explicit boundary note.
- Auditor-only integrity verification where provenance is supported.
- Optional client-safe export only when enabled by the owner.
- Decision Centre share controls and Professional pricing/entitlement copy updated so the live claim is truthful.

## Database / deployment status

- **Neon migration status:** applied.
- Included migrations:
  - `20260516_add_case_share_invites`
  - `20260516_add_operational_rate_limit_terms_and_stale_notifications`

## Verification status

Verified after the release boundary landed:

- `pnpm typecheck` ✅
- focused case-sharing Vitest suite ✅
- `pnpm doctrine:audit` ✅
- `git diff --check` ✅

## Known caveat

- `pnpm build:netlify` did not complete cleanly in the earlier environment because of a stale / overlapping Next build lock.
- A clean rerun on 2026-05-17 after removing `.next` and `.netlify` no longer reproduced the lock, but the build still did not finish within a 20-minute local window. Deployment confidence therefore still requires one successful clean build in a stable environment.

## Follow-up expectation

Run from a clean local state before the next push or deploy:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .netlify -ErrorAction SilentlyContinue
pnpm build:netlify
pnpm typecheck
pnpm doctrine:audit
pnpm surfaces:audit
pnpm vitest run
git diff --check
```
