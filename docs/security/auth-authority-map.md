# Auth Authority Map

> Institutional Stabilization -- Phase B
> Generated: 2026-05-07
> Source of truth: `proxy.ts` (root), `lib/auth/proxy.ts`, `lib/auth/guards.ts`, `lib/auth/gateway.ts`, `lib/auth/requireAdminServer.ts`, `lib/access/require-admin-app.ts`

---

## 1. Edge/Proxy Auth (`proxy.ts` -- root)

The root `proxy.ts` (V5.1 "Constitutional Gateway with Session Tracking") is the **primary perimeter**. It runs as Next.js middleware at the edge and is the first auth checkpoint for every request.

### 1.1 Public Prefixes (no auth required)

Routes matching `PUBLIC_PREFIXES` pass through with security headers only:

| Prefix | Category |
|---|---|
| `/api/auth` | NextAuth callbacks |
| `/api/contact` | Contact form |
| `/api/health` | Health check |
| `/api/middleware-health` | Middleware health |
| `/api/access` | Access token endpoints |
| `/api/check-access` | Access verification |
| `/api/inner-circle` | IC registration/public |
| `/api/pdfs` | PDF metadata (public) |
| `/api/premium/content` | Premium content (public gate) |
| `/api/auth/sovereign/*` | Sovereign auth flow |
| `/api/sovereign/auth` | Sovereign auth |
| `/api/sovereign/logout` | Sovereign logout |
| `/api/constitutional/verify` | Constitutional verification |
| `/api/system/lock-status` | System lock status |
| `/api/purpose-alignment/*` | Purpose alignment (public product) |
| `/_next`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml` | Static assets |
| `/assets`, `/fonts`, `/images` | Static assets |
| `/inner-circle/login` | IC login page |
| `/admin/login` | Admin login page |
| `/restricted`, `/strategy`, `/consulting`, `/speaking` | Public pages |
| `/founders`, `/fatherhood`, `/leadership` | Public pages |
| `/auth/access-denied` | Error page |
| `/inner-circle/insufficient-clearance` | Error page |
| `/diagnostics` | Product entry point |
| `/purpose-alignment` | Public product |

### 1.2 Auth Tier Classification (Tier 0-3)

Additional tier classification runs **after** proxy's own checks:

| Tier | Required Identity | Prefixes/Paths |
|---|---|---|
| **Tier 0 (public)** | None | `AUTH_PUBLIC_EXACT`: `/`, `/favicon.ico`, `/api/inner-circle/register`, `/api/inner-circle/resend`. `AUTH_PUBLIC_PREFIXES`: `/diagnostics`, `/blog`, `/canon`, `/shorts`, `/events`, `/media`, `/education-research`, `/api/auth`, `/_next`, `/assets`. Also: `/inner-circle` (exact), `/inner-circle/unlock`, `/inner-circle/login`. |
| **Tier 1 (member)** | NextAuth session | `/consulting`, `/strategy` |
| **Tier 2 (inner_circle)** | AL token / IC cookie | `/inner-circle/*`, `/private/*`, `/vault/*`, `/board/*` |
| **Tier 3 (architect)** | Admin (isInternal) | `/inner-circle/admin/*`, `/api/admin/*`, `/directorate/*` |

Edge identity resolution: `resolveIdentityEdge()` reads NextAuth JWT + `aol_access` cookie. Tier aliases map roles (e.g., `admin` -> `architect`, `sovereign` -> `owner`).

### 1.3 Admin Path Detection (`isAdminPath`)

Returns true for:
- `/admin/*`
- `/api/vault/*`
- `/api/admin/*`

Admin paths enforce:
1. IP allowlist (`ADMIN_ALLOWED_IPS` env var)
2. NextAuth JWT must exist (redirects to `/admin/login` otherwise)
3. Role hierarchy check: `ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin`

### 1.4 Institutional Session (`needsInstitutionalSession`)

Returns true for:
- `/inner-circle/*`
- `/api/premium/*`
- `/api/dl/*`

Requires either NextAuth token OR `aol_access` cookie. Redirects to `/inner-circle/login` on failure.

### 1.5 Constitutional Authority (`CONSTITUTIONAL_PROTECTED_PATHS`)

These paths require sovereign session authentication with authority level enforcement:

| Path | Min Authority | Signature | Quorum | Audit Level |
|---|---|---|---|---|
| `/pdf-dashboard` | PARTICIPANT | No | No | INFO |
| `/api/campaigns` | PARTICIPANT (GET read-only) | No | No | INFO |
| `/admin/reporting` | AUTHORITY | No | No | WARNING |
| `/api/reports` | AUTHORITY (GET read-only) | No | No | WARNING |
| `/admin/campaigns` | DELEGATE | No | No | INFO |
| `/api/admin/campaigns` | AUTHORITY | **Yes** | No | WARNING |
| `/api/constitutional/export` | PARTICIPANT | No | No | INFO |
| `/api/constitutional/appeal` | PARTICIPANT | **Yes** | No | WARNING |
| `/api/constitutional/audit` | AUTHORITY | **Yes** | No | CRITICAL |
| `/api/constitutional/override` | SOVEREIGN | **Yes** | **Yes** | CRITICAL |
| `/api/interventions` | DELEGATE | **Yes** | No | WARNING |
| `/api/strategy-room-legacy` | PARTICIPANT | No | No | INFO |
| `/api/alignment/assess` | PARTICIPANT | No | No | INFO |

Authority hierarchy: OBSERVER(0) < PARTICIPANT(1) < DELEGATE(2) < AUTHORITY(3) < SOVEREIGN(4).

Sovereign auth sources (checked in order):
1. `sovereign_session` cookie -- format: `userId:campaignId:authorityLevel:signature`
2. `ogr_sovereign_session` cookie -- HMAC-signed payload (verified against `OGR_SESSION_SECRET`)
3. `Authorization: Bearer <SOVEREIGN_ACCESS_TOKEN>` header

### 1.6 Global Lockdown

When system lock is active, non-admin users are blocked from all non-exempt paths. Lockdown-exempt paths:
- `/admin/login`, `/api/auth`, `/api/system/lock-status`, `/restricted`
- `/inner-circle/insufficient-clearance`, `/api/health`
- `/api/purpose-alignment`, `/api/purpose-alignment/assessments`, `/api/purpose-alignment/report`

### 1.7 Bypass Mechanisms

| Bypass | Mechanism | Risk |
|---|---|---|
| Development bypass | `NODE_ENV=development` + `BYPASS_SOVEREIGN=true` | Dev only -- acceptable |
| Internal bypass | `X-Directorate-Bypass` header == `INTERNAL_BYPASS_KEY` env | Secret-gated -- moderate risk if key leaks |
| PDF guard | `/assets/downloads/*.pdf` -> 307 redirect to `/api/downloads/[slug]` | Prevents direct PDF access |

### 1.8 Rate Limiting

| Category | Limit | Window |
|---|---|---|
| Admin (`/admin/`) | 60 req | 60s |
| API General | 200 req | 60s |
| Constitutional (`/constitutional/`) | 30 req | 60s |
| Sovereign (`/sovereign/`) | 20 req | 60s |
| Auth (`/auth/`) | 10 req | 60s |

Rate limiting keyed on `clientIp:pathname`.

---

## 2. Route-Level Auth (API Handlers)

### 2.1 App Router (`app/api/`) Auth Patterns

| Route | Auth Mechanism | Auth Type |
|---|---|---|
| `app/api/admin/campaigns/*` | `requireAdminAppRoute()` | Admin (session + DB) |
| `app/api/admin/commercial` | `requireAdminAppRoute()` | Admin |
| `app/api/admin/decision/*` (all) | `requireAdminAppRoute()` | Admin |
| `app/api/admin/decision-intelligence` | `requireAdminAppRoute()` | Admin |
| `app/api/admin/enterprise-foundation` | `requireAdminAppRoute()` | Admin |
| `app/api/admin/positioning` | `requireAdminAppRoute()` | Admin |
| `app/api/admin/dev-login` | `NODE_ENV !== "development"` hard gate + rate limit | Dev-only |
| `app/api/analytics/executive-report` | `getServerSession()` | Session |
| `app/api/audit/log` | `getServerSession()` | Session |
| `app/api/boardroom/dossier/*` | `getServerSession()` | Session |
| `app/api/cron/snapshot` | `Bearer CRON_SECRET` | Cron token |
| `app/api/cron/escalation` | `x-cron-secret` or `Bearer CRON_SECRET` | Cron token |
| `app/api/cron/decision-state` | `CRON_SECRET` | Cron token |
| `app/api/cron/calibration` | **NONE** | **NO AUTH** |
| `app/api/decision/credit-score` | `getServerSession()` | Session |
| `app/api/download/[token]` | `getServerSession()` | Session |
| `app/api/enterprise-foundation/*` | `requireAdminAppRoute()` | Admin |
| `app/api/evidence/*` | `getServerSession()` | Session |
| `app/api/executive/snapshot` | `requireAdminAppRoute()` | Admin |
| `app/api/interactions/toggle` | `getServerSession()` | Session |
| `app/api/premium/forensics/attribution` | Proxy public prefix; multipart handler | Public + token |
| `app/api/retainers/contracts` | `requireAdminAppRoute()` | Admin |
| `app/api/retainers/decisions` | `requireAdminAppRoute()` | Admin |
| `app/api/retainers/enforcement-cycles` | `requireAdminAppRoute()` | Admin |
| `app/api/retainers/surface` | `getServerSession()` | Session |

### 2.2 Pages Router (`pages/api/`) Auth Patterns

| Route | Auth Mechanism | Auth Type |
|---|---|---|
| `pages/api/admin/access-keys/*` | `requireAdmin()` | Admin |
| `pages/api/admin/audit-logs` | `requireAdminServer()` | Admin |
| `pages/api/admin/deal-flow-stats` | `requireAdmin()` | Admin |
| `pages/api/admin/diagnostics/*` | `requireAdminServer()` | Admin |
| `pages/api/admin/export-audit` | `requireAdminServer()` | Admin |
| `pages/api/admin/export-vips` | `requireAdminServer()` | Admin |
| `pages/api/admin/identity-audit` | `requireAdminServer()` | Admin |
| `pages/api/admin/inner-circle/*` | `requireAdmin()` / `requireAdminServer()` | Admin |
| `pages/api/admin/institutional-analytics` | `requireAdmin()` | Admin |
| `pages/api/admin/invites/*` | `requireAdmin()` | Admin |
| `pages/api/admin/jobs/*` | `requireAdminServer()` | Admin |
| `pages/api/admin/members/*` | `requireAdminServer()` | Admin |
| `pages/api/admin/onboard-principal` | `requireAdminServer()` | Admin |
| `pages/api/admin/pdf-analytics` | `requireAdminServer()` | Admin |
| `pages/api/admin/pdf-status` | `requireAdmin()` | Admin |
| `pages/api/admin/pricing` | `requireAdmin()` | Admin |
| `pages/api/admin/proof/evidence/*` | `requireAdmin()` | Admin |
| `pages/api/admin/reports/*` | Session + tier check | Session/Admin |
| `pages/api/admin/security/*` | `requireAdminServer()` | Admin |
| `pages/api/admin/status-report` | `requireAdminServer()` | Admin |
| `pages/api/admin/users/upgrade` | `requireAdminServer()` | Admin |
| `pages/api/admin/validation` | `requireAdmin()` | Admin |
| `pages/api/analytics/downloads/summary` | `validateAdminAccess()` | Admin |
| `pages/api/assets/retrieve` | `getServerSession()` | Session |
| `pages/api/assets/serve-pdf` | `getServerSession()` | Session |
| `pages/api/auth/[...nextauth]` | NextAuth handler | Public |
| `pages/api/auth/session` | `getServerSession()` | Session |
| `pages/api/briefs/[slug]` | `getServerSession()` | Session |
| `pages/api/content/[...slug]` | `getServerSession()` | Session |
| `pages/api/cron/clean-keys` | `Bearer CRON_SECRET` | Cron token |
| `pages/api/cron/cleanup-download-security` | `CRON_SECRET` | Cron token |
| `pages/api/cron/cleanup-download-token` | **Not verified** | **Verify manually** |
| `pages/api/cron/security-sweep` | `CRON_SECRET` | Cron token |
| `pages/api/dashboard/my-reports` | `getServerSession()` | Session |
| `pages/api/events/checkout` | `getServerSession()` | Session |
| `pages/api/follow-up/process` | `CRON_SECRET` | Cron token |
| `pages/api/frameworks/surrender/[slug]/protected` | `withInnerCircleAccess()` | Inner Circle |
| `pages/api/generate-pdf` | `validateAdminAccess()` | Admin |
| `pages/api/premium/admin/*` | `getServerSession()` + admin check | Admin |
| `pages/api/premium/content/*` | Token forensics | Token |
| `pages/api/premium/dashboard` | `withInnerCircleAccess()` | Inner Circle |
| `pages/api/private/*` | `getServerSession()` | Session |
| `pages/api/protected-content` | `withInnerCircleAccess()` | Inner Circle |
| `pages/api/strategy-room/export/[slug]` | `getServerSession()` | Session |
| `pages/api/system/maintenance` | `CRON_SECRET_KEY` | Cron token |
| `pages/api/users/index` | `getServerSession()` | Session |
| `pages/api/webhooks/stripe` | `stripe.webhooks.constructEvent()` | Webhook sig |
| `pages/api/webhooks/resend` | `verifyWebhookSignature()` | Webhook sig |
| `pages/api/billing/webhook` | `stripe.webhooks.constructEvent()` | Webhook sig |
| `pages/api/reports/webhook` | `stripe.webhooks.constructEvent()` | Webhook sig |
| `pages/api/stripe/diagnostic-report-webhook` | `stripe.webhooks.constructEvent()` | Webhook sig |

---

## 3. Auth Helper Functions

| Helper | Location | What It Checks | Used By |
|---|---|---|---|
| `requireAdminServer()` | `lib/auth/requireAdminServer.ts` | NextAuth session + `isAuthorizedAdminSession()` + persistent rate limit | Pages Router admin APIs |
| `requireAdmin()` | `lib/access/require-admin.ts` | Session + admin permission check | Pages Router admin APIs |
| `requireAdminAppRoute()` | `lib/access/require-admin-app.ts` | `getServerSession()` + `getUserAccess()` from DB + `isAdmin` flag | App Router admin APIs |
| `withApiAuth(tier)` | `lib/auth/guards.ts` | `resolveIdentity()` + canonical tier comparison | Pages Router API wrapper |
| `requirePageAuth(req, tier)` | `lib/auth/guards.ts` | `resolveIdentity()` + tier; returns redirect on failure | `getServerSideProps` |
| `requireAppAuth(req, tier)` | `lib/auth/guards.ts` | `resolveIdentity()` + tier; returns 401/403 Response | App Router route handlers |
| `withAuth(handler)` | `lib/auth/gateway.ts` | `authGateway()` -> parallel admin + IC resolution; 401 on no access | Handler wrapper |
| `authGateway(request)` | `lib/auth/gateway.ts` | `getAdminSession()` + `getInnerCircleAccess()` in parallel | Gateway resolver |
| `checkTierAccess(req, tier)` | `lib/auth/gateway.ts` | `authGateway()` + tier normalization + comparison | Tier-gated routes |
| `withInnerCircleAccess()` | `lib/server/with-inner-circle-access.ts` | Inner circle cookie/session validation | Pages Router IC APIs |
| `validateAdminAccess()` | `lib/server/validation.ts` | Admin session validation | Legacy admin routes |
| `withUnifiedAuth()` | `lib/auth/withUnifiedAuth.ts` | Unified auth (exported from `lib/auth/index.ts`) | Legacy wrapper |
| `isAuthorizedAdminSubject()` | `lib/auth/admin-authority.ts` | Email + role check at edge | `lib/auth/proxy.ts` |

---

## 4. Gap Analysis

### 4.1 Routes with No Auth at Any Layer

| Route | Issue | Severity |
|---|---|---|
| `app/api/cron/calibration` | **No CRON_SECRET check.** No auth header validation. Any HTTP client can trigger daily calibration. | **HIGH** |
| `pages/api/cron/cleanup-download-token` | No CRON_SECRET check found in code search. Needs manual verification. | **MEDIUM** |
| `app/api/search` | Not in admin/IC/constitutional paths. Not in PUBLIC_PREFIXES. Falls through tier check -- may execute without auth if no tier match applies. | **LOW** |
| `app/api/stats` | Same exposure as search. | **LOW** |
| `app/api/root` | Not classified by any prefix. | **LOW** |
| `app/api/interpret` | Not classified by any prefix. | **LOW** |
| `app/api/leads/fuse` | Not classified by any prefix. | **LOW** |
| `app/api/telemetry/*` | Not classified by any prefix. | **LOW** |
| `app/api/pulse/submit` | Not classified by any prefix. | **LOW** |

### 4.2 Public Proxy Prefix Covering Sensitive Sub-Routes

| Prefix | Sensitive Sub-Route | Concern |
|---|---|---|
| `/api/inner-circle` | `/api/inner-circle/admin/export`, `/api/inner-circle/issue` | Proxy passes these as public. Route-level auth exists but proxy provides no defense-in-depth. |
| `/api/premium/content` | `/api/premium/content/download/[id]` | Public at proxy. Relies solely on download token forensics. |
| `/api/access` | `/api/access/revoke`, `/api/access/download`, `/api/access/serve` | Session-mutating endpoints under a public prefix. |
| `/api/pdfs` | `/api/pdfs/[id]/delete`, `/api/pdfs/[id]/generate` | CRUD operations under a public prefix. |

### 4.3 Dual Proxy Files

Two `proxy.ts` files exist:
- **Root `proxy.ts`** (V5.1): Active middleware. Full constitutional gateway.
- **`lib/auth/proxy.ts`**: Earlier version. Still contains spoofable `X-Institutional-Action` header check for admin APIs (line 181). **Verify this file is not imported by any active code path.** If unused, archive it.

### 4.4 Inconsistent Admin Auth Helpers

Pages Router admin routes use **two different** admin check functions:
- `requireAdmin()` from `lib/access/require-admin.ts`
- `requireAdminServer()` from `lib/auth/requireAdminServer.ts`

These should be consolidated to a single canonical helper to reduce audit surface.
