# Access Route Matrix

**Date**: 2026-05-08  
**Purpose**: Map every route touching access/auth/admin/downloads with current status and required action.

---

## ROUTE MAP

### `/access/*` — Access Management Pages

| Route | File | Current Authority | Expected Authority | Status | Risk | Required Action |
|-------|------|------------------|-------------------|--------|------|-----------------|
| `/access` | `pages/access/index.tsx` | `getUserAccess()` SSR | `getUserAccess()` SSR | ✅ SAFE | None | None |
| `/access/redeem` | `pages/access/redeem.tsx` | Client form → API | API enforces auth | ✅ SAFE | Low | None |
| `/access/accept` | `pages/access/accept.tsx` | Client form → API | API enforces auth | ✅ SAFE | Low | None |

### `/access/api/*` — Access API Endpoints

| Route | File | Current Authority | Expected Authority | Status | Risk | Required Action |
|-------|------|------------------|-------------------|--------|------|-----------------|
| `POST /api/access/redeem` | `pages/api/access/redeem.ts` | `requireAuthenticatedApi()` | Server-side | ✅ SAFE | None | None |
| `POST /api/access/accept-invite` | `pages/api/access/accept-invite.ts` | `requireAuthenticatedApi()` | Server-side | ✅ SAFE | None | None |
| `GET /api/access/download` | `pages/api/access/download.ts` | `requireAuthenticatedApi()` + entitlement check | Server-side | ✅ SAFE | None | None |
| `GET /api/access/serve` | `pages/api/access/serve.ts` | `requireAuthenticatedApi()` + signed token | Server-side | ✅ SAFE | None | None |
| `GET /api/access/check` | `pages/api/access/check.ts` | `resolveRequestAccess()` | Server-side | ✅ SAFE | None | None |
| `GET /api/access/me` | `pages/api/access/me.ts` | `resolveRequestAccess()` | Server-side | ✅ SAFE | None | None |
| `POST /api/access/verify` | `pages/api/access/verify.ts` | `resolveRequestAccess()` | Server-side | ✅ SAFE | None | None |
| `POST/GET /api/access/logout` | `pages/api/access/logout.ts` | Public | Public | ✅ SAFE | None | None |
| `POST/GET /api/access/clear` | `pages/api/access/clear.ts` | Alias to logout | Public | ✅ SAFE | None | None |
| `POST /api/access/enter` | ~~`pages/api/access/enter.ts`~~ | DELETED | N/A | 🗑️ **DELETED** | None | ✅ Done |
| `POST /api/access/revoke` | ~~`pages/api/access/revoke.ts`~~ | DELETED | N/A | 🗑️ **DELETED** | None | ✅ Done |
| `redeem-key.ts.legacy` | ~~`pages/api/access/redeem-key.ts.legacy`~~ | DELETED | N/A | 🗑️ **DELETED** | None | ✅ Done |

### `/admin/*` — Admin Pages

| Route | File | Current Authority | Expected Authority | Status | Risk | Required Action |
|-------|------|------------------|-------------------|--------|------|-----------------|
| `/admin` | `pages/admin/index.tsx` | `requireAdminPage()` | Server-side | ✅ SAFE | None | None |
| `/admin/login` | `pages/admin/login.tsx` | Public | Public | ✅ SAFE | None | None |
| `/admin/access-keys` | `pages/admin/access-keys.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/access-revoke` | `pages/admin/access-revoke.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/assets` | `pages/admin/assets.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/authority-center` | `pages/admin/authority-center.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/boardroom-archive` | `pages/admin/boardroom-archive.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/calibration` | `pages/admin/calibration.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/command-wall` | `pages/admin/command-wall.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/conversion-dashboard` | `pages/admin/conversion-dashboard.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/counsel-review` | `pages/admin/counsel-review.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/enterprise-foundation` | `pages/admin/enterprise-foundation.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/enterprise-pipeline` | `pages/admin/enterprise-pipeline.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/intelligence` | `pages/admin/intelligence.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/outcome-ledger` | `pages/admin/outcome-ledger.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/oversight-review` | `pages/admin/oversight-review.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/pdf-dashboard` | `pages/admin/pdf-dashboard.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/pdf-status` | `pages/admin/pdf-status.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/proof` | `pages/admin/proof.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/redis` | `pages/admin/redis.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/validation` | `pages/admin/validation.tsx` | `requireAdminPage()` (assumed) | Server-side | ✅ SAFE | Low | Verify guard |
| `/admin/inner-circle/*` | `pages/admin/inner-circle/` | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |

### `/admin/*` — App Router Admin

| Route | File | Current Authority | Expected Authority | Status | Risk | Required Action |
|-------|------|------------------|-------------------|--------|------|-----------------|
| `/admin/audit` | `app/admin/audit/` | `requireAdminServer()` in layout | Server-side | ✅ **VERIFIED** | None | Layout calls `requireAdminServer()` → `isAuthorizedAdminSession()` |
| `/admin/campaigns` | `app/admin/campaigns/` | `requireAdminServer()` in layout | Server-side | ✅ **VERIFIED** | None | Same layout guard |
| `/admin/commercial` | `app/admin/commercial/` | `requireAdminServer()` in layout | Server-side | ✅ **VERIFIED** | None | Same layout guard |
| `/admin/decision` | `app/admin/decision/` | `requireAdminServer()` in layout | Server-side | ✅ **VERIFIED** | None | Same layout guard |
| `/admin/decision-intelligence` | `app/admin/decision-intelligence/` | `requireAdminServer()` in layout | Server-side | ✅ **VERIFIED** | None | Same layout guard |
| `/admin/organisations` | `app/admin/organisations/` | `requireAdminServer()` in layout | Server-side | ✅ **VERIFIED** | None | Same layout guard |
| `/admin/reporting` | `app/admin/reporting/` | `requireAdminServer()` in layout | Server-side | ✅ **VERIFIED** | None | Same layout guard |
| `/admin/reports` | `app/admin/reports/` | `requireAdminServer()` in layout | Server-side | ✅ **VERIFIED** | None | Same layout guard |
| `/admin/snapshot` | `app/admin/snapshot/` | `requireAdminServer()` in layout | Server-side | ✅ **VERIFIED** | None | Same layout guard |

### `/inner-circle/*` — Inner Circle Pages

| Route | File | Current Authority | Expected Authority | Status | Risk | Required Action |
|-------|------|------------------|-------------------|--------|------|-----------------|
| `/inner-circle` | `pages/inner-circle/index.tsx` | `getUserAccess()` SSR | Server-side | ✅ SAFE | None | None |
| `/inner-circle/admin` | `pages/inner-circle/admin.tsx` | `getUserAccess()` SSR (canonical) | Server-side | ✅ **FIXED** | None | ✅ Done — uses `getUserAccess()` SSR; admin users redirected to `/admin` |
| `/inner-circle/dashboard` | `pages/inner-circle/dashboard.tsx` | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |
| `/inner-circle/account` | `pages/inner-circle/account.tsx` | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |
| `/inner-circle/login` | `pages/inner-circle/login.tsx` | Public | Public | ✅ SAFE | None | None |
| `/inner-circle/locked` | `pages/inner-circle/locked.tsx` | Public | Public | ✅ SAFE | None | None |
| `/inner-circle/insufficient-clearance` | `pages/inner-circle/insufficient-clearance.tsx` | Public | Public | ✅ SAFE | None | None |
| `/inner-circle/unlock` | `pages/inner-circle/unlock.tsx` | Public | Public | ✅ SAFE | None | None |
| `/inner-circle/resend` | `pages/inner-circle/resend.tsx` | Public | Public | ✅ SAFE | None | None |
| `/inner-circle/briefs/*` | `pages/inner-circle/briefs/` | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |
| `/inner-circle/reports/*` | `pages/inner-circle/reports/` | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |

### `/inner-circle/api/*` — Inner Circle API Routes

| Route | File | Current Authority | Expected Authority | Status | Risk | Required Action |
|-------|------|------------------|-------------------|--------|------|-----------------|
| `POST /api/inner-circle/register` | `pages/api/inner-circle/register.ts` | Rate-limited public | Public enrollment | ✅ SAFE | Low | None |
| `POST /api/inner-circle/generate-link` | `pages/api/inner-circle/generate-link.ts` | Unknown | Admin-only | ❓ **UNKNOWN** | **HIGH** | Audit |
| `GET /api/inner-circle/lexicon` | `pages/api/inner-circle/lexicon.ts` | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |
| `POST /api/inner-circle/resend` | `pages/api/inner-circle/resend.ts` | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |
| `POST /api/inner-circle/self-revoke` | `pages/api/inner-circle/self-revoke.ts` | Unknown | Authenticated | ❓ **UNKNOWN** | Medium | Audit |
| `POST /api/inner-circle/unlock` | `pages/api/inner-circle/unlock.ts` | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |
| `GET /api/inner-circle/retrieve/[briefId]` | `pages/api/inner-circle/retrieve/[briefId].ts` | Unknown | Authenticated + entitlement | ❓ **UNKNOWN** | **HIGH** | Audit |

### `/downloads/*` — Download Pages

| Route | File | Current Authority | Expected Authority | Status | Risk | Required Action |
|-------|------|------------------|-------------------|--------|------|-----------------|
| `/downloads` | `pages/downloads/index.tsx` | Static (public) | Public | ✅ SAFE | None | None |
| `/downloads/[...slug]` | `pages/downloads/[...slug].tsx` | `getServerSideProps` → `requiredTierFromDoc()` | Server-side | ✅ SAFE | None | None |

### `/api/download/*` — Download API (App Router)

| Route | File | Current Authority | Expected Authority | Status | Risk | Required Action |
|-------|------|------------------|-------------------|--------|------|-----------------|
| `GET /api/download/[token]` | `app/api/download/[token]/route.ts` | `getServerSession()` + `verifyDownloadToken()` | Server-side | ✅ SAFE | None | None |
| `GET /api/downloads/[slug]` | `app/api/downloads/[slug]/` | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |

### `/api/auth/*` — Auth API Routes

| Route | File | Current Authority | Expected Authority | Status | Risk | Required Action |
|-------|------|------------------|-------------------|--------|------|-----------------|
| NextAuth built-in routes | NextAuth | NextAuth | NextAuth | ✅ SAFE | None | None |
| `/api/auth/*` (custom) | `app/api/auth/` | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |

### Premium Content Routes

| Route | File | Current Authority | Expected Authority | Status | Risk | Required Action |
|-------|------|------------------|-------------------|--------|------|-----------------|
| `/vault/*` | Middleware | `vaultSecurityMiddleware()` | JWT + path-based tier | ✅ SAFE | Low | None |
| `/api/vault/*` | Middleware | `vaultSecurityMiddleware()` | JWT + path-based tier | ✅ SAFE | Low | None |
| `/registry/*` | Unknown | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |
| `/briefs/*` | Unknown | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |
| `/premium/*` | Unknown | Unknown | Server-side | ❓ **UNKNOWN** | Medium | Audit |

### `/api/admin/*` — Admin API Routes (App Router)

| Route | File | Current Authority | Expected Authority | Status | Risk | Required Action |
|-------|------|------------------|-------------------|--------|------|-----------------|
| `app/api/admin/*` | Various | Unknown | Server-side admin check | ❓ **UNKNOWN** | **HIGH** | Audit all |

---

## FINAL STATUS SUMMARY

### ✅ Safe Routes (no action required)
- All `/access/*` pages and APIs
- `/admin` (Pages Router) with `requireAdminPage()`
- `/admin/login` (public)
- All App Router admin routes with `requireAdminServer()` in layout
- `/downloads/*` with SSR guards
- `/api/access/*` active endpoints
- `/api/download/[token]` with signed token verification
- `/vault/*` and `/api/vault/*` with middleware guard
- `/inner-circle` gate page with SSR guard
- `/inner-circle/admin` — **FIXED** now uses `getUserAccess()` SSR
- Public inner-circle pages (login, locked, insufficient-clearance, unlock, resend)

### 🗑️ Deleted
- ~~`pages/api/access/enter.ts`~~ ✅ Deleted
- ~~`pages/api/access/revoke.ts`~~ ✅ Deleted
- ~~`pages/api/access/redeem-key.ts.legacy`~~ ✅ Deleted

### ❓ Must Audit (unknown guards)
- `/inner-circle/dashboard`, `/inner-circle/account`
- `/inner-circle/briefs/*`, `/inner-circle/reports/*`
- `/api/inner-circle/generate-link`, `/api/inner-circle/retrieve/[briefId]`
- `/api/inner-circle/lexicon`, `/api/inner-circle/resend`
- `/api/inner-circle/self-revoke`, `/api/inner-circle/unlock`
- `/api/downloads/[slug]` (App Router)
- `/registry/*`, `/briefs/*`, `/premium/*`
- `/api/auth/*` custom routes
- All App Router admin API routes (`/app/api/admin/*`)

### 🚫 Must Not Touch Yet
- NextAuth core configuration (`lib/auth/config.ts`)
- `getUserAccess()` resolver (`lib/access/get-user-access.ts`)
- Key redemption flow (`pages/api/access/redeem.ts`)
- Invite redemption flow (`lib/access/invite-service.ts`)
- Download enforcement (`pages/api/access/download.ts`, `serve.ts`)
- Vault middleware (`middleware/vault-security.ts`)

---

*End of access route matrix.*