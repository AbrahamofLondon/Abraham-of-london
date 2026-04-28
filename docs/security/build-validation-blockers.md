# Build Validation Blockers

## Current Status (2026-04-28)

### TypeScript
- **Result:** 0 errors in production code
- **Known issues:** 7 errors in `lib/engine/` (Codex-owned, untracked files — not compiled by Next.js)
- **Pre-existing:** 0 after ExecutiveReportingPaywall fix

### Build (`pnpm build`)
- **Result:** PASS (exit 0)
- **All pages compile** including post-migration fast.tsx with server-side scoring

### PDF Governance
- **Status:** Not addressed in this pass
- **Recommendation:** Separate PDF governance pass required
- **Files potentially affected:** `app/__pdf/[slug]/page.tsx`, PDF generation pipeline
- **Confirmation:** PDF governance failures are unrelated to auth/security runtime changes

### Codex `lib/engine/` Files
- **Status:** 7 TypeScript errors in untracked files
- **Files:** classifier.service.ts, narrative.service.ts, types.ts
- **Cause:** Missing exports from constitutional-diagnostic-derivation (resolved by shim, but Codex files import names that don't exist on the canonical version)
- **Impact:** None — these files are not imported by any compiled page or API route
- **Resolution:** Codex must align with canonical exports from `lib/diagnostics/constitutional-diagnostic-derivation.ts`

## Security Architecture Validation

### Rate Limiting
- PostgreSQL: authoritative (via RateLimitBucket model)
- Redis: optional fast cache (via persistent-rate-limit.ts)
- In-memory: edge proxy only (per-isolate, not cross-request authority)
- Fail chain: Redis → Postgres → fail-closed (for critical routes)

### Auth Authority
- NextAuth/JWT: primary identity authority
- aol_access cookie: session presence indicator only (does not upgrade tier)
- Prisma member record: secondary tier source (lifecycle-gated)
- Edge: minimum "member" tier for cookie-only requests (server upgrades via Prisma)

### Dev Login
- Returns 404 outside development environment
- Does not create independent admin authority in production
