# ZTHVF Phase 1 — Proxy/Middleware Coverage Map

**Generated:** 2026-05-07
**Auditor:** ZTHVF automated sweep (Claude Opus 4.6)
**Project:** aol-check-visual (Next.js on Netlify)

---

## Architecture: proxy.ts (Root)

The project uses `proxy.ts` at the project root as its **Institutional Perimeter (V5.1)**. This file exports:

- `proxy(req: NextRequest)` — the main handler
- `config.matcher` — matches all routes except `_next/static`, `_next/image`, `favicon.ico`, `robots.txt`, `sitemap.xml`

This functions identically to Next.js middleware — every request (except static assets) passes through the proxy before reaching route handlers.

---

## Proxy Execution Order

| Step | Check | Action on Failure |
|------|-------|-------------------|
| 0 | **PDF download guard** | Redirects `/assets/downloads/*.pdf` → `/api/downloads/{slug}` (307) |
| 1 | **Dev bypass** | `BYPASS_SOVEREIGN=true` in development only — passes through |
| 2 | **Internal bypass** | `X-Directorate-Bypass` header matches `INTERNAL_BYPASS_KEY` env |
| 3 | **Canonical host redirect** | Non-canonical hostname → 308 to `www.abrahamoflondon.org` |
| 4 | **Global lockdown** | Checks `/api/system/lock-status` — non-admin users get 503/redirect |
| 5 | **Public path bypass** | Matches `PUBLIC_PREFIXES` — passes through with security headers |
| 6 | **Rate limiting** | Per-IP + pathname, in-memory store. 429 on limit exceeded |
| 7 | **Constitutional authority** | For constitutional paths — requires sovereign session + authority level |
| 8 | **Admin IP restriction** | `ADMIN_ALLOWED_IPS` check for admin paths |
| 9 | **Session & role validation** | NextAuth JWT + access cookie check. Admin requires role hierarchy |
| 10 | **Auth tier enforcement** | Edge-safe tier classification: Tier 0 (public) → Tier 3 (architect) |
| 11 | **Security headers** | X-Frame-Options, CSP, HSTS, COOP, CORP, Permissions-Policy on all responses |

---

## Public Prefixes (bypass auth)

These paths skip authentication in the proxy:

| Prefix | Rationale |
|--------|-----------|
| `/api/auth` | NextAuth callback/signout endpoints |
| `/api/contact` | Contact form (public) |
| `/api/health` | Health check |
| `/api/middleware-health` | Middleware health |
| `/api/access` | Access check |
| `/api/check-access` | Access check |
| `/api/inner-circle` | Registration/login flow |
| `/api/pdfs` | PDF metadata (public) |
| `/api/premium/content` | Content listing |
| `/api/auth/sovereign/*` | Sovereign auth endpoints |
| `/api/sovereign/*` | Sovereign auth |
| `/api/constitutional/verify` | Constitutional verification |
| `/api/system/lock-status` | Lock status (needed by proxy itself) |
| `/api/purpose-alignment/*` | Purpose alignment assessment |
| `/_next` | Next.js assets |
| `/favicon.ico`, `/robots.txt`, `/sitemap.xml` | Standard static |
| `/assets`, `/fonts`, `/images` | Static assets |
| `/inner-circle/login`, `/admin/login` | Login pages |
| `/restricted` | Restricted page |
| `/strategy`, `/consulting`, `/speaking`, `/founders`, `/fatherhood`, `/leadership` | Marketing pages |
| `/auth/access-denied` | Access denied page |
| `/inner-circle/insufficient-clearance` | Clearance page |
| `/diagnostics` | Diagnostic entry point (product) |
| `/purpose-alignment` | Assessment entry |

---

## Auth Tier Classification

| Tier | Required Level | Route Prefixes |
|------|---------------|----------------|
| Tier 3 (architect) | Admin/internal | `/inner-circle/admin`, `/api/admin`, `/directorate` |
| Tier 2 (inner_circle) | Inner Circle member | `/inner-circle`, `/private`, `/vault`, `/board` |
| Tier 1 (member) | Authenticated user | `/consulting`, `/strategy` |
| Tier 0 (public) | None | Everything in `AUTH_PUBLIC_PREFIXES` |

---

## Constitutional Protection Map

| Path | Min Authority | Requires Signature | Requires Quorum | Audit Level |
|------|--------------|-------------------|-----------------|-------------|
| `/pdf-dashboard` | PARTICIPANT | No | No | INFO |
| `/api/campaigns` | PARTICIPANT (read) | No | No | INFO |
| `/admin/reporting` | AUTHORITY | No | No | WARNING |
| `/api/reports` | AUTHORITY (read) | No | No | WARNING |
| `/admin/campaigns` | DELEGATE | No | No | INFO |
| `/api/admin/campaigns` | AUTHORITY | Yes | No | WARNING |
| `/api/constitutional/export` | PARTICIPANT | No | No | INFO |
| `/api/constitutional/appeal` | PARTICIPANT | Yes | No | WARNING |
| `/api/constitutional/audit` | AUTHORITY | Yes | No | CRITICAL |
| `/api/constitutional/override` | SOVEREIGN | Yes | Yes | CRITICAL |
| `/api/interventions` | DELEGATE | Yes | No | WARNING |
| `/api/alignment/assess` | PARTICIPANT | No | No | INFO |

---

## Rate Limit Configuration

| Route Type | Limit | Window |
|------------|-------|--------|
| Admin (`/admin/`) | 60 req | 60s |
| API General | 200 req | 60s |
| Constitutional (`/constitutional/`) | 30 req | 60s |
| Sovereign (`/sovereign/`) | 20 req | 60s |
| Auth (`/auth/`) | 10 req | 60s |

**Note:** In-memory store. Does not persist across serverless cold starts or share across instances. Rate limiting is best-effort on Netlify edge.

---

## Security Headers (Applied to ALL responses)

| Header | Value |
|--------|-------|
| X-Request-ID | Unique per request |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=() |
| Cross-Origin-Opener-Policy | same-origin |
| Cross-Origin-Resource-Policy | same-origin |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |
| Content-Security-Policy | (production only) default-src 'self'; ... |

---

## Gap Analysis

### Routes NOT covered by proxy tier enforcement

The proxy only tier-enforces routes matching `TIER1_PREFIXES`, `TIER2_PREFIXES`, `TIER3_PREFIXES`. Any API route NOT matching these prefixes AND not in `PUBLIC_PREFIXES` will:

1. Pass rate limiting ✓
2. Get security headers ✓
3. **NOT get auth tier enforcement** — relies entirely on per-route auth guards

Routes in this gap:
- `/api/diagnostics/*` (except telemetry paths)
- `/api/strategy-room/*`
- `/api/billing/*`
- `/api/cron/*`
- `/api/downloads/*`
- `/api/user/*`
- `/api/dl/*` (covered by `needsInstitutionalSession`)

These routes must implement their own auth checks. The proxy provides security headers and rate limiting but NOT auth gating for them.

### Known risks

1. **In-memory rate limiting** — resets on cold start, not shared across instances
2. **X-Forwarded-For trust** — first IP from header accepted without proxy trust validation
3. **BYPASS_SOVEREIGN dev flag** — must never reach production
4. **INTERNAL_BYPASS_KEY header** — full auth bypass if key leaks
5. **Compatibility sovereign_session cookie** — accepts `userId:campaignId:authorityLevel:signature` format without HMAC verification on the compat path
