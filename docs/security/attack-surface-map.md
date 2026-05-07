# Attack Surface Map

> Institutional Stabilization -- Phase B/G
> Generated: 2026-05-07
> Scope: Every externally reachable endpoint, classified by attack vector category

---

## 1. Auth Surfaces

All login, registration, and verification endpoints. These are the highest-value targets for credential stuffing and brute force.

| Endpoint | Router | Method | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/auth/[...nextauth]` | Pages | ALL | Auth: 10/60s | NextAuth handler -- all OAuth/credential flows |
| `/api/auth/session` | Pages | GET | Auth: 10/60s | Session introspection |
| `/api/auth/identity` | Pages | GET | Auth: 10/60s | Identity resolution |
| `/api/auth/mint` | Pages | POST | Auth: 10/60s | Token minting |
| `/api/auth/me` | Pages | GET | Auth: 10/60s | Current user |
| `/api/auth/sovereign-login` | Pages | POST | Auth: 10/60s | Sovereign login |
| `/api/auth/sovereign` | App | POST | Auth: 10/60s | Sovereign auth |
| `/api/sovereign/auth` | App | POST | Sovereign: 20/60s | Sovereign session create |
| `/api/sovereign/logout` | App | POST | Sovereign: 20/60s | Sovereign session destroy |
| `/api/inner-circle/register` | Pages | POST | API: 200/60s | IC registration (public) |
| `/api/inner-circle/resend` | Pages | POST | API: 200/60s | IC resend verification |
| `/api/inner-circle/unlock` | Pages | POST | API: 200/60s | IC unlock |
| `/api/inner-circle/verify` | App | POST | API: 200/60s | IC email verification |
| `/api/admin/login` | Pages | -- | Auth: 10/60s | Admin login page (public) |
| `/api/admin/auth/send-link` | Pages | POST | Admin: 60/60s | Admin magic link |
| `/api/admin/auth/verify` | Pages | POST | Admin: 60/60s | Admin link verify |
| `/api/admin/dev-login` | App | POST | Dev-only | Hard-gated to `NODE_ENV=development` |
| `/api/constitutional/verify` | App | POST | Constitutional: 30/60s | Constitutional verification (public) |
| `/api/access/enter` | Pages | POST | API: 200/60s | Access key entry |
| `/api/access/verify` | Pages | POST | API: 200/60s | Access verification |
| `/api/keys/verify` | Pages | POST | API: 200/60s | Key verification |

---

## 2. Upload Surfaces

Endpoints accepting file uploads or multipart form data.

| Endpoint | Router | Auth | Upload Type | Notes |
|---|---|---|---|---|
| `/api/premium/forensics/attribution` | App | Public (proxy prefix) | `multipart/form-data` with file field | PDF upload for forensic attribution. Accepts raw file or JSON with `pdfBase64`. No file size limit visible in proxy. |
| `/api/events/checkout` | Pages | Session | JSON with `formData` object | Not a file upload -- form data for Stripe checkout. |

**Assessment**: Single upload surface at `/api/premium/forensics/attribution`. This is under the `/api/premium/content` public prefix at proxy level. Route-level validation required for file type, size, and content inspection.

---

## 3. Download Surfaces

All endpoints that serve files or binary content.

| Endpoint | Router | Auth | Notes |
|---|---|---|---|
| `/api/download/[token]` | App | Session | Token-gated download |
| `/api/downloads/[slug]` | App | Proxy PDF guard redirect target | PDF download via slug |
| `/api/dl/[token]` | Pages | Institutional session (proxy) | Token-based download |
| `/api/access/download` | Pages | Public prefix | Access-key gated download |
| `/api/access/serve` | Pages | Public prefix | Content serving |
| `/api/assets/retrieve` | Pages | Session | Asset retrieval |
| `/api/assets/serve-pdf` | Pages | Session | PDF serving |
| `/api/premium/content/download/[id]` | Pages | Token forensics | Premium content download |
| `/api/premium/content/index` | Pages | Token forensics | Premium content listing/access |
| `/api/downloads/mdx` | Pages | Token forensics | MDX download |
| `/api/downloads/instrument-pdf` | Pages | -- | Instrument PDF |
| `/api/downloads/resolve/[slug]` | Pages | -- | Download resolution |
| `/api/downloads/resolve/[slug]/[...rest]` | Pages | -- | Download resolution (nested) |
| `/api/surrender/download/[id]` | Pages | -- | Surrender framework download |
| `/api/strategy-room/export/[slug]` | Pages | Session | Strategy room export |
| `/api/briefs/[slug]` | Pages | Session | Brief content |
| `/api/diagnostics/reports/download` | Pages | -- | Diagnostic report download |
| `/api/artifacts/global-market-intelligence-q1-2026-boardroom-pdf` | Pages | -- | Specific artifact PDF |
| `/assets/downloads/*.pdf` | Static | **Redirected** | Proxy intercepts and redirects to `/api/downloads/[slug]` |

**PDF guard**: Direct access to `/assets/downloads/*.pdf` is intercepted by `guardedPdfDownloadResponse()` in proxy.ts and redirected (307) to `/api/downloads/[slug]`, enforcing auth at the API layer.

---

## 4. Webhook Handlers

External service callbacks. Must validate signatures to prevent spoofed events.

| Endpoint | Router | Verification | Service | Notes |
|---|---|---|---|---|
| `/api/webhooks/stripe` | Pages | `stripe.webhooks.constructEvent(buf, sig, webhookSecret)` | Stripe | Main payment webhook |
| `/api/webhooks/resend` | Pages | `verifyWebhookSignature(req)` -- custom HMAC | Resend | Email delivery webhook |
| `/api/billing/webhook` | Pages | `stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)` | Stripe | Billing-specific webhook |
| `/api/reports/webhook` | Pages | `stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret)` | Stripe | Report payment webhook |
| `/api/stripe/diagnostic-report-webhook` | Pages | `stripe.webhooks.constructEvent()` | Stripe | Diagnostic report payment |

**Note**: All Stripe webhooks use `constructEvent()` with timing-safe signature verification. The Resend webhook uses a custom `verifyWebhookSignature()` function. All five handlers disable body parsing (`export const config = { api: { bodyParser: false } }`) as required for raw body signature verification.

---

## 5. Cron Routes

Scheduled task endpoints. Must be protected by `CRON_SECRET` to prevent unauthorized execution.

| Endpoint | Router | Auth | Status |
|---|---|---|---|
| `/api/cron/snapshot` | App | `Bearer CRON_SECRET` | Secured |
| `/api/cron/escalation` | App | `x-cron-secret` or `Bearer CRON_SECRET` | Secured |
| `/api/cron/decision-state` | App | `CRON_SECRET` | Secured |
| `/api/cron/calibration` | App | **NONE** | **UNPROTECTED** |
| `/api/cron/clean-keys` | Pages | `Bearer CRON_SECRET` | Secured |
| `/api/cron/cleanup-download-security` | Pages | `CRON_SECRET` via header | Secured |
| `/api/cron/cleanup-download-token` | Pages | **Not verified** | **Verify** |
| `/api/cron/security-sweep` | Pages | `CRON_SECRET` via bearer or `x-cron-secret` | Secured |
| `/api/follow-up/process` | Pages | `CRON_SECRET` | Secured |
| `/api/system/maintenance` | Pages | `CRON_SECRET_KEY` | Secured |

**Gap**: `app/api/cron/calibration/route.ts` has **no auth check**. It directly queries Prisma and modifies calibration state. Any unauthenticated HTTP POST can trigger it.

---

## 6. Dynamic Route Parameters

Routes with dynamic segments that could be vectors for path traversal, injection, or IDOR attacks.

### 6.1 Single Dynamic Params (`[param]`)

| Pattern | Router | Param | Risk |
|---|---|---|---|
| `/api/admin/access-keys/[id]/revoke` | Pages | `id` | IDOR -- key ID |
| `/api/admin/access-keys/[id]/uses` | Pages | `id` | IDOR -- key ID |
| `/api/admin/campaigns/[id]/*` | App | `id` | IDOR -- campaign ID |
| `/api/admin/diagnostics/grants/revoke` | Pages | -- | N/A |
| `/api/admin/invites/[id]/revoke` | Pages | `id` | IDOR -- invite ID |
| `/api/admin/proof/evidence/[id]` | Pages | `id` | IDOR -- evidence ID |
| `/api/admin/reports/[id]` | Pages | `id` | IDOR -- report ID |
| `/api/admin/reports/[id]/deliver` | Pages | `id` | IDOR -- report ID |
| `/api/alignment/enterprise/campaigns/[id]/*` | App | `id` | IDOR -- campaign ID |
| `/api/alignment/enterprise/respond/[token]` | App | `token` | Token validation |
| `/api/audit/[id]/submit` | App | `id` | IDOR -- audit ID |
| `/api/campaigns/[id]/*` | App | `id` | IDOR -- campaign ID |
| `/api/diagnostics/campaigns/[id]/aggregate` | App | `id` | IDOR -- campaign ID |
| `/api/download/[token]` | App | `token` | Token validation |
| `/api/downloads/[slug]` | App | `slug` | Path traversal risk |
| `/api/dl/[token]` | Pages | `token` | Token validation |
| `/api/editorials/[slug]` | App | `slug` | Content injection |
| `/api/pdfs/[id]` | Pages | `id` | IDOR -- PDF ID |
| `/api/pdfs/[id]/delete` | Pages | `id` | IDOR -- destructive |
| `/api/pdfs/[id]/duplicate` | Pages | `id` | IDOR |
| `/api/pdfs/[id]/generate` | Pages | `id` | IDOR |
| `/api/pdfs/[id]/metadata` | Pages | `id` | IDOR |
| `/api/pdfs/[id]/rename` | Pages | `id` | IDOR |
| `/api/predictive/insights/[campaignId]` | App | `campaignId` | IDOR |
| `/api/strategy-room/briefing/return/[sessionId]` | App | `sessionId` | Session ID |
| `/api/strategy-room/execution/[id]/*` | App | `id` | IDOR |
| `/api/team-assessment/campaign/[id]/*` | App | `id` | IDOR |
| `/api/team-assessment/respond/[token]` | App | `token` | Token validation |
| `/api/team/respondents/[token]` | App | `token` | Token validation |
| `pages/[slug].tsx` | Pages | `slug` | Content lookup |
| `pages/[type]-sitemap.xml.ts` | Pages | `type` | Sitemap type |

### 6.2 Catch-All Params (`[...param]`)

| Pattern | Router | Param | Risk |
|---|---|---|---|
| `/api/content/[...slug]` | Pages | `slug` | **Path traversal** -- catch-all slug |
| `/api/private/vault/[...path]` | Pages | `path` | **Path traversal** -- vault path access |
| `/api/resources/[...slug]` | Pages | `slug` | Path traversal risk |
| `/api/resources/strategic-frameworks/[...slug]` | Pages | `slug` | Path traversal risk |
| `/api/vault/[...slug]` | App | `slug` | **Path traversal** -- vault access |
| `app/admin/reporting/executive/[...slug]` | App | `slug` | Admin catch-all |
| `app/registry/[...slug]` | App | `slug` | Registry catch-all |
| `pages/blog/[...slug].tsx` | Pages | `slug` | Content catch-all |
| `pages/content/[...slug].tsx` | Pages | `slug` | Content catch-all |
| `pages/downloads/[...slug].tsx` | Pages | `slug` | Download catch-all |
| `pages/inner-circle/briefs/[...slug].tsx` | Pages | `slug` | IC catch-all |
| `pages/resources/[...slug].tsx` | Pages | `slug` | Resource catch-all |
| `pages/shorts/[...slug].tsx` | Pages | `slug` | Content catch-all |
| `pages/strategy/[...slug].tsx` | Pages | `slug` | Strategy catch-all |
| `pages/vault/[...slug].tsx` | Pages | `slug` | **Vault catch-all** |

**High-risk catch-alls**: `/api/private/vault/[...path]`, `/api/vault/[...slug]`, and `pages/vault/[...slug].tsx` accept arbitrary path segments and access vault content. These must validate path segments to prevent directory traversal (`../`).

---

## 7. Redirects and Rewrites

### 7.1 `next.config.mjs` Redirects

| Source | Destination | Type |
|---|---|---|
| `/terms-of-service` | `/terms` | 301 (permanent) |
| `/security-policy` | `/security` | 301 (permanent) |
| `/diagnostic` | `/strategy-room` | 301 (permanent) |
| `/essays/:slug*` | `/blog/:slug*` | 301 (permanent) |

### 7.2 Proxy-Level Redirects

| Trigger | Destination | Type |
|---|---|---|
| Non-canonical hostname | `www.abrahamoflondon.org` (same path) | 308 (permanent) |
| `/assets/downloads/*.pdf` | `/api/downloads/[slug]` | 307 (temporary) |
| Unauthenticated admin access | `/admin/login?returnTo=...` | 307 |
| Unauthenticated IC access | `/inner-circle/login?returnTo=...` | 307 |
| Insufficient tier (page) | `/auth/access-denied` | 307 |
| System locked (page) | `/restricted?reason=maintenance` | 307 |

### 7.3 `netlify.toml`

No custom redirect rules in `netlify.toml`. All routing handled by `@netlify/plugin-nextjs` adapter.

---

## 8. Admin Surfaces

All administrative endpoints and pages requiring elevated privileges.

### 8.1 Admin API Routes

| Endpoint | Router | Auth Helper |
|---|---|---|
| `/api/admin/campaigns/*` | App | `requireAdminAppRoute()` |
| `/api/admin/commercial` | App | `requireAdminAppRoute()` |
| `/api/admin/decision/*` | App | `requireAdminAppRoute()` |
| `/api/admin/decision-intelligence` | App | `requireAdminAppRoute()` |
| `/api/admin/enterprise-foundation` | App | `requireAdminAppRoute()` |
| `/api/admin/positioning` | App | `requireAdminAppRoute()` |
| `/api/admin/dev-login` | App | Dev-only gate |
| `/api/admin/access-keys/*` | Pages | `requireAdmin()` |
| `/api/admin/audit-logs` | Pages | `requireAdminServer()` |
| `/api/admin/audit/logs` | Pages | `requireAdminServer()` |
| `/api/admin/deal-flow-stats` | Pages | `requireAdmin()` |
| `/api/admin/diagnostics/*` | Pages | `requireAdminServer()` |
| `/api/admin/export-audit` | Pages | `requireAdminServer()` |
| `/api/admin/export-vips` | Pages | `requireAdminServer()` |
| `/api/admin/identity-audit` | Pages | `requireAdminServer()` |
| `/api/admin/inner-circle/*` | Pages | `requireAdmin()`/`requireAdminServer()` |
| `/api/admin/institutional-analytics` | Pages | `requireAdmin()` |
| `/api/admin/invites/*` | Pages | `requireAdmin()` |
| `/api/admin/jobs/*` | Pages | `requireAdminServer()` |
| `/api/admin/members/*` | Pages | `requireAdminServer()` |
| `/api/admin/onboard-principal` | Pages | `requireAdminServer()` |
| `/api/admin/pdf-analytics` | Pages | `requireAdminServer()` |
| `/api/admin/pdf-status` | Pages | `requireAdmin()` |
| `/api/admin/pricing` | Pages | `requireAdmin()` |
| `/api/admin/proof/evidence/*` | Pages | `requireAdmin()` |
| `/api/admin/reports/*` | Pages | Session + tier |
| `/api/admin/security/*` | Pages | `requireAdminServer()` |
| `/api/admin/status-report` | Pages | `requireAdminServer()` |
| `/api/admin/sync-fix` | Pages | -- |
| `/api/admin/system-health` | Pages | -- |
| `/api/admin/users/upgrade` | Pages | `requireAdminServer()` |
| `/api/admin/validation` | Pages | `requireAdmin()` |
| `/api/admin-client` | Pages | -- |

### 8.2 Admin Pages

| Path | Router | Notes |
|---|---|---|
| `app/admin/audit` | App | Canonical |
| `app/admin/campaigns/*` | App | Canonical |
| `app/admin/commercial` | App | Canonical |
| `app/admin/decision/*` | App | Canonical |
| `app/admin/decision-intelligence` | App | Canonical |
| `app/admin/organisations/*` | App | Canonical |
| `app/admin/reporting/*` | App | Canonical |
| `app/admin/reports` | App | Canonical |
| `app/admin/snapshot` | App | Canonical |
| `pages/admin/index` | Pages | Legacy |
| `pages/admin/access-keys` | Pages | Legacy |
| `pages/admin/access-revoke` | Pages | Legacy |
| `pages/admin/assets` | Pages | Legacy |
| `pages/admin/authority-center` | Pages | Legacy |
| `pages/admin/calibration` | Pages | Legacy |
| `pages/admin/command-wall` | Pages | Legacy |
| `pages/admin/conversion-dashboard` | Pages | Legacy |
| `pages/admin/enterprise-foundation` | Pages | Legacy |
| `pages/admin/enterprise-pipeline` | Pages | Legacy |
| `pages/admin/inner-circle` | Pages | Legacy |
| `pages/admin/intelligence` | Pages | Legacy |
| `pages/admin/login` | Pages | Canonical (public) |
| `pages/admin/outcome-ledger` | Pages | Legacy |
| `pages/admin/pdf-dashboard` | Pages | Legacy |
| `pages/admin/pdf-status` | Pages | Legacy |
| `pages/admin/proof` | Pages | Legacy |
| `pages/admin/redis` | Pages | Legacy |
| `pages/admin/validation` | Pages | Legacy |

### 8.3 Admin Protection Layers

All admin surfaces are protected by **three layers**:

1. **Proxy (edge)**: `isAdminPath()` -> IP allowlist + NextAuth JWT + role hierarchy check
2. **Tier enforcement**: Tier 3 (`architect`) required for `/api/admin/*`, `/inner-circle/admin/*`, `/directorate/*`
3. **Route-level**: `requireAdminAppRoute()` or `requireAdminServer()` or `requireAdmin()` (session + DB permission check)

---

## 9. Summary of Findings

### Critical

| Finding | Location | Action Required |
|---|---|---|
| Unprotected cron route | `app/api/cron/calibration/route.ts` | Add `CRON_SECRET` check immediately |

### High

| Finding | Location | Action Required |
|---|---|---|
| Broad public prefix covers sensitive sub-routes | `/api/inner-circle` prefix | Narrow prefix or add proxy-level sub-route checks |
| Catch-all vault paths | `/api/vault/[...slug]`, `/api/private/vault/[...path]` | Verify path traversal sanitization |
| PDF operations under public prefix | `/api/pdfs/*` | CRUD operations (delete, rename, generate) reachable without proxy auth |

### Medium

| Finding | Location | Action Required |
|---|---|---|
| Unverified cron auth | `pages/api/cron/cleanup-download-token.ts` | Verify CRON_SECRET is checked |
| Dual admin auth helpers | `requireAdmin()` vs `requireAdminServer()` | Consolidate |
| `page.tsx` in API directory | `app/api/audit/[id]/success/page.tsx` | Move to `app/audit/[id]/success/` |
| `route.ts` outside API directory | `app/strategy-room/results/route.ts` | Move or document |
| Legacy `lib/auth/proxy.ts` | `lib/auth/proxy.ts` | Contains spoofable header check; verify unused and archive |
| Admin routes without visible auth | `/api/admin/sync-fix`, `/api/admin/system-health`, `/api/admin-client` | Verify route-level auth exists |

### Low

| Finding | Location | Action Required |
|---|---|---|
| Unclassified API routes | `/api/search`, `/api/stats`, `/api/root`, `/api/interpret`, `/api/leads/fuse`, `/api/telemetry/*`, `/api/pulse/submit` | Not in any proxy prefix -- falls through to tier check. Verify intended access level. |
| Test/debug pages in codebase | `pages/debug/content.tsx`, `pages/dev/dashboard.tsx`, `pages/test-readers.tsx`, `app/testing/lab/page.tsx` | Remove before production or gate behind admin auth |
