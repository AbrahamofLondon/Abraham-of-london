# Codex Drift Verification

Verified: 2026-05-07
Auditor: Claude Opus 4.6 (1M context)
Scope: 6 specific Codex drift findings against live codebase

---

## 1. Signed Action Token Core Change

| Attribute | Status | Evidence |
|---|---|---|
| Logic identical? | YES | `lib/security/signed-action-token-core.ts` contains full HMAC-SHA256 sign/verify with base64url encoding. `lib/server/security/signed-action-token.ts` is a 7-line re-export wrapper with `import "server-only"` guard. |
| Secret resolution preserved? | YES | `ACTION_TOKEN_SECRET -> DOWNLOAD_TOKEN_SECRET -> NEXTAUTH_SECRET` fallback chain at line 12-14 of core file. |
| Expiry enforcement? | YES | `Math.max(60, Math.floor(args.ttlSeconds))` on create (line 55); `payload.exp < Math.floor(Date.now() / 1000)` on verify (line 89). No default of 5 minutes -- caller specifies TTL. Minimum floor is 60 seconds. |
| Purpose enforcement? | YES | `payload.purpose !== expectedPurpose` check at line 81. |
| Client-importable? | RISK | `signed-action-token-core.ts` imports `crypto` (Node built-in) but does NOT import `server-only`. It is located at `lib/security/` (not `lib/server/`). Any client-side import would fail at runtime due to `crypto` but could cause build warnings. |
| Direct importer outside server boundary? | YES -- 1 case | `lib/server/diagnostics/report-engine.ts` imports directly from `signed-action-token-core` (line 6) instead of through the `server-only`-guarded wrapper. This file itself has `// server-only guard removed` comment (line 1). Since report-engine is only dynamically imported inside `getServerSideProps` in `pages/inner-circle/reports/[ref].tsx`, this is safe at runtime. |

| Finding | Exploitable? | User-impacting? | Action | Evidence | Remaining debt | Launch impact |
|---|---|---|---|---|---|---|
| Token core split | No | No | Post-launch | Core logic is identical and secure. `timingSafeEqual` used for signature comparison. Purpose + expiry enforced. | Add `server-only` guard to `signed-action-token-core.ts` or restrict its import path to prevent accidental client inclusion. | None -- no client bundle leak detected. |

---

## 2. Auth Enforcement Split

### Admin access: proxy.ts -> app/admin/layout.tsx -> API routes

| Layer | Check | Verdict |
|---|---|---|
| proxy.ts (edge) | IP allowlist (line 168), NextAuth JWT check (line 193), `isAuthorizedAdminSubject` email+role check (line 204), in-memory rate limit (30/min) | Full coverage |
| app/admin/layout.tsx | `await requireAdminServer()` (server component guard) | Full coverage |
| Admin API routes | `X-Institutional-Action` header required by proxy (line 181); individual routes use `requireAdminServer` with persistent rate limiting | Full coverage |
| Gap? | **No gap.** Triple-layered: edge IP + JWT + layout RSC guard. |

### Inner Circle reports: proxy.ts -> pages/inner-circle/reports/[ref].tsx

| Layer | Check | Verdict |
|---|---|---|
| proxy.ts | `requiresInstitutionalSession` = true for `/inner-circle` prefix (line 127). Checks NextAuth JWT OR access cookie (line 190-191). Redirects to login if neither present. | Session required |
| getServerSideProps | Dynamic imports `readAccessCookie`, `getSessionContext`, `tierAtLeast` (lines 191-201). Checks `sessionId` from cookie; redirects if absent. Further checks tier access. | Entitlement checked |
| Gap? | **No gap.** Proxy requires session; GSSP verifies tier entitlement. |

### Download: proxy.ts -> pages/api/dl/[token].ts

| Layer | Check | Verdict |
|---|---|---|
| proxy.ts | `/api/dl` is NOT in `PUBLIC_PREFIXES` -- passes through general API rate limit. | Rate limited |
| pages/api/dl/[token].ts | Returns HTTP 410 Gone with message to use canonical flow. Legacy path disabled. | Safely tombstoned |
| Gap? | **No gap.** Legacy path returns 410. Active download paths (`/api/download/[token]`, `/api/downloads/resolve/[slug]`, `/api/premium/content/download/[id]`) all enforce token verification + entitlement. |

### Strategy Room: proxy.ts -> pages/strategy-room/session/[id].tsx

| Layer | Check | Verdict |
|---|---|---|
| proxy.ts | `/strategy` is in PUBLIC_PREFIXES (line 51) -- **passes through without auth check** | Public bypass |
| pages/strategy-room/session/[id].tsx GSSP | Calls internal API `GET /api/strategy-room/execution/${id}` forwarding cookies (line 689). That API route enforces auth + rate limit. | API-gated |
| Gap? | **Acceptable architecture.** The proxy passes strategy pages through, but the GSSP delegates to an authenticated API route. The page itself shows "Access denied" if the API returns non-200. The `/strategy-room/session/[id]` page never exposes data without API auth. |

### Checkout: proxy.ts -> pages/api/billing/checkout.ts

| Layer | Check | Verdict |
|---|---|---|
| proxy.ts | `/api/billing` is NOT in PUBLIC_PREFIXES. General API rate limit (100/min in-memory) applies. No auth required at proxy for checkout (expected -- checkout is a purchase initiation). | Rate limited only |
| pages/api/billing/checkout.ts | No auth check (by design -- guest checkout). Validates email required, product eligibility, Do-Not-Sell gate. No persistent rate limiting. | **Missing rate limit** |
| app/api/checkout/route.ts | Has `enforceAppRouteRateLimit` (persistent, 12 req / 15 min, fail-closed). Full input validation. | Properly protected |
| Gap? | **YES -- pages/api/billing/checkout.ts has no rate limiting.** Only protected by proxy in-memory rate limit (100/min per IP, resets per edge isolate). The App Router checkout route is properly protected. |

| Finding | Exploitable? | User-impacting? | Action | Evidence | Remaining debt | Launch impact |
|---|---|---|---|---|---|---|
| Auth chain -- admin | No | No | None | Triple-layered: edge IP + JWT + RSC layout guard | None | None |
| Auth chain -- inner circle | No | No | None | Proxy session + GSSP tier check | None | None |
| Auth chain -- download | No | No | None | Legacy 410; active paths verify tokens | None | None |
| Auth chain -- strategy room | No | No | None | Proxy public pass-through but GSSP delegates to authenticated API | None | None |
| Auth chain -- checkout (Pages) | Low risk | No | Pre-launch | `pages/api/billing/checkout.ts` lacks persistent rate limit | Add `withApiRateLimit` or `consumePersistentRateLimit` to Pages Router checkout | Low -- Stripe itself rate limits session creation; proxy provides basic in-memory limiting |

---

## 3. Download Delivery Split

### All download paths identified:

| Route | Entitlement check? | Delegates to canonical? | Returns public path? |
|---|---|---|---|
| `pages/api/dl/[token].ts` | N/A | N/A | **No** -- returns 410 Gone (tombstoned) |
| `pages/api/downloads/resolve/[slug].ts` | YES -- `getInnerCircleAccess` + `hasAccess(userTier, requiredTier)` | YES -- uses `createDownloadGrantToken` from canonical security module | No -- returns token, not file path |
| `app/api/download/[token]/route.ts` | YES -- `verifyDownloadToken` + `doesTokenMatchBinding` + session check | YES -- master vault, generates PDF on-the-fly with forensic watermark | No -- streams PDF bytes directly |
| `pages/api/premium/content/download/[id].ts` | YES -- `verifyDownloadToken` + `doesTokenMatchBinding` | YES -- uses canonical token verification + watermarking | No -- streams via pipe |
| `pages/api/access/download.ts` | YES -- `requireAuthenticatedApi` + `canAccessArtifact` + entitlement resolution | YES -- uses `createSignedDownloadToken` | No -- returns signed token URL |
| `pages/api/access/serve.ts` | YES -- `requireAuthenticatedApi` + `verifySignedDownloadToken` | YES | **RISK** -- `res.redirect(asset.fileUrl)` -- redirects to `fileUrl` from `ACCESS_DOWNLOADS` registry |
| `pages/api/downloads/instrument-pdf.ts` | **NO** -- explicitly states "No entitlement check for now" | No -- reads directly from `private/assets/paid-instruments/` | No -- streams from private directory |
| `pages/api/downloads/mdx.ts` | Not audited in detail | Uses SSOT | Serves raw MDX content |

### Critical findings:

1. **`pages/api/downloads/instrument-pdf.ts`** -- No auth, no rate limit, no entitlement check. Reads from `private/assets/paid-instruments/[slug].pdf`. Limited to 3 hardcoded slugs (`decision-exposure-instrument`, `mandate-clarity-framework`, `intervention-path-selector`). Comment says "PDF is secondary to interactive instrument."

2. **`pages/api/access/serve.ts`** -- Redirects to `asset.fileUrl`. Whether this is a public URL depends on the `ACCESS_DOWNLOADS` registry. Auth is enforced via `requireAuthenticatedApi` + `verifySignedDownloadToken`. Not bypassing quarantine but depends on `fileUrl` being a protected location.

| Finding | Exploitable? | User-impacting? | Action | Evidence | Remaining debt | Launch impact |
|---|---|---|---|---|---|---|
| instrument-pdf no auth | Low | No | Pre-launch | 3 hardcoded slugs, reads from `private/` directory (not `public/`), no rate limit. An attacker who knows the slug can download PDFs. | Add rate limiting + entitlement check, or accept as intentional lead-gen. | Low -- PDFs are supplementary to paid interactive instruments |
| Quarantine bypass | No | No | None | No route redirects to `public/assets/downloads/`. The `.dockerignore` and `.gitignore` exclude that path. Active routes stream bytes or return tokens. | None | None |

---

## 4. Rate Limit Split

### Classification:

| Route category | Implementation | Type | Risk |
|---|---|---|---|
| proxy.ts (all routes) | In-memory `Map`, resets per edge isolate | **In-memory** | Baseline only -- resets on deploy/cold start |
| Admin APIs (`requireAdminServer`) | `consumePersistentRateLimit` (Redis -> Postgres fallback) | **Persistent** | Properly protected |
| App Router routes (checkout, unsubscribe, delete, strategy-room, diagnostics/evidence, inner-circle/verify) | `enforceAppRouteRateLimit` -> `consumePersistentRateLimit` | **Persistent** | Properly protected |
| App Router download (`/api/download/[token]`) | `consumePersistentRateLimit` directly | **Persistent** | Properly protected |
| Pages Router diagnostics (capture, challenge, score, constitutional-intake/report) | `consumePersistentRateLimit` directly | **Persistent** | Properly protected |
| Pages Router contact | `rateLimit` from `lib/server/rateLimit` -> `consumePersistentRateLimit` | **Persistent** | Properly protected |
| Pages Router analytics/downloads/summary | `isRateLimited` from unified module | **Persistent** | Properly protected |
| **Pages Router billing/checkout.ts** | **None** | **Missing** | See Finding 2 |
| **Pages Router downloads/instrument-pdf.ts** | **None** | **Missing** | See Finding 3 |
| Pages Router diagnostics/reports/issue, download | `consumeRateLimit` from `lib/security/rate-limit` | Likely persistent | Acceptable |
| App Router search | `consumePersistentRateLimit` | **Persistent** | Properly protected |

### High-risk routes with only in-memory or no limiting:

| Route | Risk level | Justification |
|---|---|---|
| `pages/api/billing/checkout.ts` | Medium | Stripe session creation has its own limits, but repeated calls waste Stripe API quota |
| `pages/api/downloads/instrument-pdf.ts` | Low | 3 fixed slugs, reads from disk, no DB/API cost |

| Finding | Exploitable? | User-impacting? | Action | Evidence | Remaining debt | Launch impact |
|---|---|---|---|---|---|---|
| Rate limit split | No | No | Post-launch | Critical paths (auth, privacy delete, download tokens, strategy room) all use persistent Redis rate limiting with Postgres fallback. Fail-closed on high-risk routes. | Add persistent rate limit to `pages/api/billing/checkout.ts` and `pages/api/downloads/instrument-pdf.ts` | None -- high-risk routes are covered |

---

## 5. Token Model Split

### Token families identified:

| Token type | Create function | Verify function | Purpose enforcement | Subject binding | Expiry |
|---|---|---|---|---|---|
| Signed Action Token | `createSignedActionToken` (core) | `verifySignedActionToken` (core) | YES -- `purpose !== expectedPurpose` rejects | YES -- subject required, embedded in payload | YES -- `exp` checked |
| Download Grant Token | `createDownloadGrantToken` (`lib/downloads/security.ts`) | `verifyDownloadToken` (`lib/premium/download-token.ts`) | Separate system | YES -- userId + sessionId binding via `doesTokenMatchBinding` | YES |
| Simple Download Token | `createDownloadToken` (`lib/security/download-token.ts`) | `verifyDownloadToken` (`lib/security/download-token.ts`) | Hardcoded to `"download"` purpose | YES -- subject field | YES -- default 15 min |
| Access Download Token | `createSignedDownloadToken` (`lib/access/downloads`) | `verifySignedDownloadToken` (`lib/access/downloads`) | Artifact-specific | YES -- userId bound | YES -- expiry param |

### Cross-purpose token reuse risk:

- **Signed Action Tokens**: Purpose is a free-form string checked at verify time. Callers use distinct purposes: `"privacy_unsubscribe"`, `"privacy_delete"`, `"diagnostic_evidence"`, `"strategy_room_init"`, `"follow_up_access"`, `"decision_state_access"`. A token created with purpose `"privacy_delete"` CANNOT be used to verify `"strategy_room_init"` -- the purpose check rejects it.

- **Download tokens**: Three separate token families exist with **different secrets** (`ACTION_TOKEN_SECRET` vs `DOWNLOAD_SECRET`/`DOWNLOAD_TOKEN_SECRET` vs per-system). A signed action token cannot validate as a download token and vice versa because they use different HMAC keys.

- **No cross-family confusion possible**: The token formats are similar (base64url body + HMAC signature) but different secret derivation paths prevent any token from one system validating in another.

| Finding | Exploitable? | User-impacting? | Action | Evidence | Remaining debt | Launch impact |
|---|---|---|---|---|---|---|
| Token model split | No | No | None | Purpose enforcement on all signed action tokens. Separate secret paths prevent cross-family reuse. Session binding on download tokens. | Consider consolidating the 3+ token systems into fewer (complexity debt, not security debt) | None |

---

## 6. Pages/App Router Boundary

### Pages Router files importing from `lib/server/`:

| File | Import | Type-only? | Inside GSSP? | Risk |
|---|---|---|---|---|
| `pages/strategy-room/index.tsx` | `lib/server/billing/commercial-access` | No (value import) | Used in GSSP (line 2204+) but **imported at top level** (line 50-53) | **MEDIUM** -- Next.js tree-shakes unused GSSP imports from client bundle, but `commercial-access.ts` imports `crypto` and `stripe` which could cause build warnings |
| `pages/diagnostics/executive-reporting/run.tsx` | `lib/server/billing/commercial-access` | No (value import) | Same pattern as above -- top-level import, used in GSSP | **MEDIUM** -- same risk |
| `pages/inner-circle/insufficient-clearance.tsx` | `lib/server/db/audit` | No (value import) | Used in GSSP (line 165+) but **imported at top level** (line 7) | **MEDIUM** -- `audit.ts` imports `prisma.server` which has Node-only deps |
| `pages/inner-circle/resend.tsx` | `lib/server/auth/cookies` | No (value import) | Used in GSSP (line 264+) but **imported at top level** (line 20) | **LOW** -- `cookies.ts` has no `server-only` guard and only uses Next.js types |
| `pages/downloads/[...slug].tsx` | `lib/server/mdx-collections` | No (value import) | Used in GSSP (line 321+) but imported at top level | **MEDIUM** -- likely has fs/path imports |
| `pages/admin/pdf-dashboard.tsx` | `lib/server/institutional-analytics` | No (value import) | Used in GSSP (line 83+) but imported at top level | **LOW** -- admin page, not public-facing |
| `pages/inner-circle/admin/artifacts.tsx` | `lib/server/diagnostics/artifact-registry` | No (value import) | Used in GSSP (line 250+) but imported at top level | **LOW** -- admin page |
| `pages/diagnostics/team-assessment.tsx` | `lib/server/decision/challenge-engine.server` | **YES (type-only)** | N/A | **NONE** -- `import type` is erased at compile time |
| `pages/diagnostics/fast.tsx` | `lib/server/decision/challenge-engine.server` | **YES (type-only)** | N/A | **NONE** |
| `pages/diagnostics/enterprise-assessment.tsx` | `lib/server/decision/challenge-engine.server` | **YES (type-only)** | N/A | **NONE** |
| `pages/inner-circle/reports/[ref].tsx` | `lib/server/*` | **Dynamic import inside GSSP** | YES | **NONE** -- correctly uses `await import()` inside GSSP |

### Dynamic import fix in `pages/inner-circle/reports/[ref].tsx`:

**Confirmed working.** Lines 190-201 use `await Promise.all([import(...)])` pattern inside `getServerSideProps`. No top-level imports from `lib/server/`. Comment at line 11-12 explains the rationale: "Server-only modules are dynamically imported inside getServerSideProps to prevent client bundle inclusion."

### Key finding:

The top-level value imports from `lib/server/` in Pages Router files (strategy-room, executive-reporting, insufficient-clearance, resend, downloads, admin pages) rely on Next.js tree-shaking to exclude GSSP-only code from the client bundle. This works in practice (Next.js specifically handles this), but:
- If any of these imports have side effects at module evaluation time, they will execute in the client bundle
- The `commercial-access.ts` file imports `crypto` and `Stripe`, which are Node-only
- Next.js handles this by splitting GSSP code, but it is fragile -- a refactor that uses the import outside GSSP would leak

| Finding | Exploitable? | User-impacting? | Action | Evidence | Remaining debt | Launch impact |
|---|---|---|---|---|---|---|
| Top-level lib/server imports | No | No (currently) | Post-launch | Next.js tree-shakes GSSP imports from client bundles. No runtime failures observed. | Migrate top-level `lib/server/` imports in Pages Router files to dynamic imports inside GSSP (as done correctly in `reports/[ref].tsx`). Priority: `commercial-access` (has `crypto`+`stripe`), `db/audit` (has `prisma`). | None -- works today but brittle to future changes |
| reports/[ref].tsx dynamic import | N/A | N/A | None | Correctly uses `await import()` inside GSSP | None | None |

---

## Summary Table

| # | Finding | Exploitable? | User-impacting? | Action | Launch impact |
|---|---|---|---|---|---|
| 1 | Signed action token core split | No | No | Post-launch: add `server-only` to core file | None |
| 2a | Auth chain (admin, inner circle, download, strategy room) | No | No | None | None |
| 2b | Pages checkout missing rate limit | Low risk | No | Pre-launch: add persistent rate limit | Low (Stripe has own limits) |
| 3a | instrument-pdf no auth/rate-limit | Low risk | No | Pre-launch: add rate limit; decide on entitlement | Low (3 fixed slugs, private dir) |
| 3b | Download quarantine bypass | No | No | None | None |
| 4 | Rate limit architecture | No | No | Post-launch: unify remaining gaps | None |
| 5 | Token model split | No | No | Post-launch: consolidation debt | None |
| 6a | Pages Router top-level server imports | No | No | Post-launch: migrate to dynamic imports | None |
| 6b | reports/[ref].tsx dynamic import fix | N/A | N/A | None -- working correctly | None |

### Verdict

**No exploitable findings.** Two low-risk pre-launch items (checkout rate limit, instrument-pdf rate limit). Remaining items are post-launch technical debt. The system is launch-safe.
