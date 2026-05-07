# ZTHVF Phase 1 -- Trust Boundary Inventory

> Generated: 2026-05-07
> Scope: Cookies, JWT/tokens, sessions, entitlements, roles, rate limiting

---

## 1. Cookie Inventory

The application uses multiple cookie-based identity channels. Trust derivation varies.

### 1.1 NextAuth Session Cookies
- **Cookie names:** `next-auth.session-token`, `__Secure-next-auth.session-token`
- **Set by:** NextAuth framework (automatic)
- **Contains:** Encrypted JWT (JWE) -- strategy is `"jwt"` (see `lib/auth/config.ts:124`)
- **Max age:** 30 days (`maxAge: 30 * 24 * 60 * 60`)
- **Used in:** `app/api/download/[token]/route.ts`, `middleware/session-tracker.ts`, `lib/server/security/app-route-guards.ts`
- **Trust level:** SERVER-SIDE -- token is signed with `NEXTAUTH_SECRET`, decoded server-side via `next-auth/jwt` `getToken()`

### 1.2 Constitutional Session Cookie
- **Cookie name:** `constitutional_session_id`
- **Set by:** `proxy.ts:1535`, `middleware/session-tracker.ts:117`
- **Contains:** UUID session identifier
- **Properties:** `httpOnly: true`, `secure: true`, `sameSite: "lax"`, `path: "/"`
- **Max age:** 30 days
- **Used in:** `proxy.ts:777,1289`, `middleware/session-tracker.ts:39`
- **Trust level:** SERVER-SIDE -- opaque ID, state is server-managed

### 1.3 Sovereign Session Cookie
- **Cookie name:** `sovereign_session`, `ogr_sovereign_session`
- **Set by:** `app/api/auth/sovereign/route.ts:170-179`
- **Used in:** `proxy.ts:871-872`, `middleware/sovereign.ts:90`
- **Trust level:** SERVER-SIDE -- validated by `SovereignAuthService` and `validateAuthority()`

### 1.4 Inner Circle Access Cookies
- **Cookie names:** `aol_access`, `innerCircleAccess`, `inner_circle_access`
- **Checked in:** `lib/inner-circle/access.server.ts:48` (ACCESS_COOKIE_KEYS), `proxy.ts:1465`, `lib/server/security/app-route-guards.ts:27`
- **Contains:** Session ID / access token
- **Trust level:** SERVER-SIDE -- cookie value is used as a key to look up session in Postgres via `verifySession()` in `lib/server/auth/tokenStore.postgres.ts`

### 1.5 Admin Session Cookies
- **Cookie name:** `admin_token`, `admin_session`
- **Set by:** `app/api/admin/dev-login/route.ts:72`
- **Properties:** `httpOnly: true`, `secure: true` (on admin_token)
- **Used in:** `app/api/inner-circle/admin/export/route.ts:16`
- **Trust level:** SERVER-SIDE -- JWT verified by `verifyAdminSession()` with `jsonwebtoken.verify()`

### 1.6 Client-Side Cookies (CONCERN)
- **Cookie names:** `innerCircleAccess`, `innerCircleToken`
- **Set/cleared by:** `components/inner-circle/DashboardHeader.tsx:41-42` (client-side `document.cookie`)
- **Trust level:** CLIENT-INFLUENCED -- these are set and cleared client-side. Server-side code must not trust their values without verification.
- **Mitigation:** `lib/inner-circle/access.server.ts` validates by looking up the session ID server-side.

---

## 2. JWT / Token Verification

### 2.1 NextAuth JWT
- **Library:** `next-auth/jwt` (JWE-based, not standard JWS)
- **Secret:** `process.env.NEXTAUTH_SECRET`
- **Strategy:** `"jwt"` (stateless, no database session table)
- **Token contents:** `sub` (user ID from DB), `role` (from DB), `email`
- **Verification:** `getToken()` from `next-auth/jwt` -- used in `middleware/vault-security.ts`, `lib/auth/resolve-identity.ts`, `lib/auth/proxy.ts`, `lib/access/SecurityMiddleware.ts`, `lib/server/auth/tokenStore.postgres.ts`
- **Grants:** User identity, role for session callback enrichment

### 2.2 Admin JWT
- **Library:** `jsonwebtoken` (standard JWS)
- **Secret:** `process.env.ADMIN_JWT_SECRET`
- **Expiry:** 8 hours
- **Payload:** `{ sub, username, role, permissions, typ: "admin" }`
- **Issued by:** `issueAdminSessionToken()` in `lib/server/auth/admin-utils.ts:264`
- **Verified by:** `verifyAdminSession()` in `lib/server/auth/admin-utils.ts:278` -- checks `typ === "admin"`, validates member is still active in DB, re-checks tier
- **Grants:** Admin panel access, admin API access

### 2.3 Inner Circle JWT / Security Config
- **Library:** Custom config in `lib/security/config.ts`
- **Secret:** `process.env.INNER_CIRCLE_JWT_SECRET`
- **Configuration:** `lib/security/index.ts:18-81` -- defines JWT algorithm, issuer, audience, expiry
- **Validation:** Secret length >= 32 characters enforced at startup

### 2.4 API Key Validation
- **Mechanism:** `lib/server/validation.ts:24` -- three auth methods: `api_key`, `dev_mode`, `jwt`
- **Used for:** Admin API routes (Pages Router)
- **Edge-aware:** Separate code paths for Node runtime (`getJwtTokenNode`) and Edge runtime (`getJwtTokenEdge`)

---

## 3. Session Handling

### 3.1 NextAuth Sessions (`getServerSession`)
- **Import:** `getServerSession` from `next-auth` or `next-auth/next`
- **Config:** `authOptions` from `lib/auth/config.ts` or `lib/auth/options.ts`
- **Used in (Pages Router):**
  - `pages/membership/success.tsx`
  - `pages/auth/signin.tsx`
  - `pages/dashboard.tsx`
  - `pages/inner-circle/index.tsx`
  - `pages/api/users/index.ts`
  - `pages/api/strategy-room/export/[slug].ts`
  - `pages/api/private/frameworks/[slug].ts`
  - `pages/directorate/dossier/[id].tsx`
  - `pages/api/premium/admin/verify-watermark.ts`
- **Used in (App Router):**
  - `lib/auth/requireAdminServer.ts`
  - `lib/access/require-admin-app.ts`
- **Contains:** `user.id`, `user.role`, `user.email`, `entitlements` (from `EffectiveAccess`)
- **Trust level:** SERVER-SIDE -- derived from cryptographic JWT, enriched from database

### 3.2 Inner Circle Sessions (`getSessionContext`)
- **Import:** `getSessionContext` from `lib/server/auth/tokenStore.postgres.ts`
- **Used in:**
  - `pages/inner-circle/reports/[ref].tsx`
  - `pages/inner-circle/reports/index.tsx`
  - `pages/inner-circle/dashboard.tsx`
  - `pages/inner-circle/briefs/[...slug].tsx`
  - `pages/inner-circle/briefs/index.tsx`
  - `pages/inner-circle/admin.tsx`
  - `pages/inner-circle/admin/reports/*`
  - `pages/inner-circle/admin/artifacts.tsx`
  - `pages/api/resources/mdx.ts`
  - `pages/api/reports/request.ts`
  - `pages/api/reports/mine.ts`
- **Paired with:** `tierAtLeast` helper for tier-gated access
- **Trust level:** SERVER-SIDE -- session ID from cookie is verified against Postgres

### 3.3 Sovereign Sessions
- **Service:** `SovereignAuthService` (singleton) in `lib/auth/sovereign/service.ts`
- **Validation:** `validateSovereignSession()` in `middleware/sovereign.ts:89`
- **Source:** `ogr_sovereign_session` cookie
- **Dev bypass:** `BYPASS_SOVEREIGN=true` in development only (`process.env.NODE_ENV === 'development'`)
- **Trust level:** SERVER-SIDE -- validated through constitutional authority framework

---

## 4. Entitlement Derivation

### 4.1 Effective Access (Primary Entitlement System)
- **Resolved by:** `getUserAccess()` in `lib/access/get-user-access.ts`
- **Source:** Prisma database query based on `userId`
- **Returns:** `EffectiveAccess` object with `permissions.isAuthenticated`, `permissions.isAdmin`, `entitlements`
- **Used in:** NextAuth session callback (`lib/auth/config.ts:195`), admin guards
- **Trust level:** SERVER-SIDE -- database-derived

### 4.2 Inner Circle Tier Access
- **Resolved by:** `getInnerCircleAccess()` in `lib/inner-circle/access.server.ts`
- **Flow:** Cookie -> extract session ID -> `verifySession()` in Postgres -> resolve tier
- **Tier check:** `tiers.hasAccess(userTier, requiredTier)` from `lib/access/tiers.ts`
- **Trust level:** SERVER-SIDE -- all verification happens against database

### 4.3 Executive Reporting Entitlements
- **Resolved by:** `getExecutiveReportingEntitlements()` in `lib/server/billing/executive-reporting-entitlements.ts`
- **Delegates to:** `getAssessmentSuiteEntitlements(email)` -- billing/subscription system
- **Grants:** `canDownloadSample`, `canViewFullReport`, `canExportBoardroomPdf`, `canExportIntervention`, `canAccessStrategyRoomArtefacts`
- **Used in:** Netlify function `executive-report-pdf.tsx`
- **Trust level:** SERVER-SIDE -- email-based billing lookup

### 4.4 Commercial Catalog Entitlements
- **Resolved by:** `lib/commercial/catalog.ts:478` -- returns `cookieName` for product-based gating
- **Trust level:** MIXED -- cookie presence can be client-set, but server validates product access

### 4.5 hasAccess Pattern
- **Primary:** `lib/auth/tiers.ts:29` -- `hasAccess(subjectTier, requiredTier)` compares tier ordinals
- **Also in:** `lib/auth/gateway.ts:166`, `lib/auth/withUnifiedAuth.tsx:112`, `lib/auth/withInnerCircleAuth.tsx:188`
- **Client-side concern:** `withUnifiedAuth` and `withInnerCircleAuth` are React HOCs that check access client-side. The client-side check is for UI gating only; actual data protection must be enforced server-side in API routes.

---

## 5. Role Derivation

### 5.1 NextAuth Roles
- **Defined in:** `types/next-auth.d.ts:12` -- `"USER" | "ADMIN" | "OWNER"`
- **Bootstrap:** `lib/auth/config.ts:11-15` -- `info@abrahamoflondon.org` -> `"OWNER"`, `BOOTSTRAP_ADMIN_EMAILS` set -> `"ADMIN"`, all others -> `"USER"`
- **Stored in:** Prisma `User.role` column
- **Propagated via:** JWT callback (`lib/auth/config.ts:153`) reads from DB, session callback exposes to client
- **Trust level:** SERVER-SIDE -- role is written to DB on sign-in, read from DB on every JWT refresh

### 5.2 Admin Roles (Inner Circle)
- **Defined in:** `lib/server/auth/admin-utils.ts:14` -- `"admin" | "superadmin" | "editor"`
- **Derived from:** `InnerCircleMember.role` in Prisma DB
- **Tier gate:** Must be at least `"architect"` tier (`ADMIN_MIN_TIER`)
- **MFA support:** TOTP-based MFA via `@otplib/preset-default`, with encrypted secret storage (`aes-256-gcm`)
- **Trust level:** SERVER-SIDE -- DB-backed with MFA enforcement

### 5.3 Enterprise Roles
- **Defined in:** `lib/alignment/enterprise-permissions.ts:3-8`
- **Values:** `"organisation_owner"`, `"campaign_admin"`, `"executive_viewer"`, `"team_lead_viewer"`, `"participant"`
- **Grants:**
  - `canViewExecutiveDashboard`: organisation_owner, campaign_admin, executive_viewer
  - `canManageCampaign`: organisation_owner, campaign_admin
  - `canRespond`: all roles
- **Trust level:** SERVER-SIDE -- role stored in DB, checked server-side

### 5.4 Constitutional Authority Levels
- **Defined in:** `lib/constitution/constitutional-authority.ts`
- **Values:** `"PARTICIPANT"`, `"DELEGATE"`, `"AUTHORITY"`, `"SOVEREIGN"`
- **Used in:** `middleware/sovereign.ts` route protection config
- **Grants:** Granular route access with optional signature and quorum requirements
- **Trust level:** SERVER-SIDE -- validated by sovereign session system

### 5.5 Admin Guard Functions
- **`requireAdminServer()`** -- `lib/auth/requireAdminServer.ts`
  - Pages Router: checks `getServerSession` + `isAuthorizedAdminSession` + rate limit
  - App Router (no req/res): checks session + redirects on failure
  - Used by: 20+ Pages Router admin API routes
- **`requireAdminAppRoute()`** -- `lib/access/require-admin-app.ts`
  - App Router: checks `getServerSession` + `getUserAccess` + `permissions.isAdmin`
  - Used by: 16+ App Router admin API routes

---

## 6. Rate Limiting

### 6.1 Middleware-Level Rate Limiting

#### Proxy Gateway (`proxy.ts`)
- **Mechanism:** In-memory `Map<string, { count, resetAt }>`
- **Configs:**
  - ADMIN: 60 req/min
  - API_GENERAL: 200 req/min
  - CONSTITUTIONAL: 30 req/min
  - SOVEREIGN: 20 req/min
  - AUTH: 10 req/min
- **Key:** `${clientIp}:${pathname}`
- **CONCERN:** In-memory store -- resets on deploy/restart, not shared across instances

#### Sovereign Middleware (`middleware/sovereign.ts`)
- **Mechanism:** In-memory object store
- **Configs:**
  - DEFAULT: 100 req/min
  - ADMIN: 50 req/min
  - CONSTITUTIONAL: 20 req/min
- **Key:** `${userId || 'anonymous'}:${pathname}`
- **CONCERN:** Same in-memory limitation as proxy.ts

#### Auth Proxy (`lib/auth/proxy.ts`)
- **Mechanism:** In-memory `Map`
- **Applied to:** IP-based limiting on proxy routes

### 6.2 Persistent Rate Limiting (App Route Guards)

#### `enforceAppRouteRateLimit` (`lib/server/security/app-route-guards.ts:154`)
- **Mechanism:** `consumePersistentRateLimit` from `lib/server/security/persistent-rate-limit.ts`
- **Key composition:** `${routeKey}:ip:${ip}:sid:${sha256(sessionId)}:email:${sha256(email)}`
- **Fail-closed:** Yes (default `failClosed: true`)
- **Audit:** Writes to security audit log on block
- **Trust level:** HIGH -- persistent store (likely Redis/DB), survives restarts

#### Routes with persistent rate limiting:
| Route | Limit | Window |
|---|---|---|
| `api/user/unsubscribe` | per-config | per-config |
| `api/user/delete` | per-config | per-config |
| `api/strategy-room/session/init` | per-config | per-config |
| `api/strategy-room/session/followup` | per-config | per-config |
| `api/strategy-room/execution` | per-config | per-config |
| `api/diagnostics/evidence` | per-config | per-config |
| `api/purpose-alignment/capture` | per-config | per-config |
| `api/purpose-alignment/assessments` | per-config | per-config |
| `api/checkout` | per-config | per-config |

### 6.3 Admin Rate Limiting
- **`enforceAdminApiRateLimit`** in `lib/auth/requireAdminServer.ts:31`
- **Mechanism:** Persistent (`consumePersistentRateLimit`)
- **Default:** 60 requests per 15 minutes per admin email+IP combination
- **Applied to:** All Pages Router admin API routes via `requireAdminServer()`

### 6.4 Subscription Rate Limiting
- **Location:** `lib/server/subscription.ts:180`
- **Mechanism:** Custom `RateLimiter` class
- **Key:** email-based

---

## 7. Additional Trust Boundary Mechanisms

### 7.1 CSRF Protection
- **`requireSameOrigin()`** in `lib/server/security/app-route-guards.ts:81`
- Checks `Origin` and `Referer` headers against request URL origin
- Writes to security audit log on failure
- Used in individual route handlers (opt-in, not global)

### 7.2 Security Lockdown Mode
- **Flag:** `SECURITY_LOCKDOWN_MODE` env var
- **Effect:** `failClosedForFlag()` in `lib/server/security/app-route-guards.ts:211` returns 503 for flagged routes
- Can also use per-route flags

### 7.3 Security Audit Logging
- **`writeSecurityAudit()`** from `lib/security/audit-log.ts`
- Events: `auth_failure`, `forbidden_object_access`, `rate_limit_block`, `csrf_failure`
- Redaction: `lib/server/log.ts:8` redacts sensitive keys (email, ip, token, authorization, cookie, secret, password, bearer, session, jwt)

### 7.4 Password Security
- **Hashing:** Argon2 (primary) with bcrypt fallback
- **Location:** `lib/auth/password.ts:22` -- `argon2.verify(hash, plain)`
- Admin password: bcrypt via `bcryptjs` in `lib/server/auth/admin-utils.ts:154`

### 7.5 MFA (Multi-Factor Authentication)
- **Method:** TOTP via `@otplib/preset-default`
- **Secret storage:** AES-256-GCM encrypted in database (`lib/server/auth/admin-utils.ts:55`)
- **Encryption key:** `process.env.MFA_ENCRYPTION_KEY`
- **Flow:** Phase 1 (credentials) -> Phase 2 (TOTP) -> Issue admin JWT
- **Applied to:** Admin login only

---

## 8. Trust Boundary Summary Matrix

| Boundary | Mechanism | Server-Side? | Client-Influenceable? | Coverage |
|---|---|---|---|---|
| NextAuth session | JWE cookie + DB enrichment | Yes | No | All authenticated pages/APIs |
| Admin auth (Pages) | `requireAdminServer()` | Yes | No | 20+ admin API routes |
| Admin auth (App) | `requireAdminAppRoute()` | Yes | No | 16+ admin API routes |
| Inner Circle access | Cookie -> Postgres session lookup | Yes | Cookie value is client-set, but server validates | IC-gated content |
| Sovereign auth | Sovereign session cookie + authority validation | Yes | No | Constitutional operations |
| Tier gating | `hasAccess(subjectTier, requiredTier)` | Yes (server) / Yes (client HOCs) | Client HOCs are UI-only | Content tiering |
| Enterprise roles | DB-stored role checked server-side | Yes | No | Campaign management |
| Rate limiting (middleware) | In-memory store | Partial | IP can be spoofed via X-Forwarded-For | All API routes |
| Rate limiting (persistent) | Persistent store (failClosed) | Yes | IP component spoofable | Critical mutation routes |
| CSRF protection | Origin/Referer check | Yes | No (opt-in per route) | Select routes |
| MFA | TOTP with encrypted DB secret | Yes | No | Admin login |

---

## 9. Identified Risks and Gaps

1. **In-memory rate limiting** in `proxy.ts` and `middleware/sovereign.ts` does not survive restarts and is not shared across serverless function instances. An attacker could rotate across instances to bypass limits.

2. **Client-side HOC auth checks** (`withUnifiedAuth`, `withInnerCircleAuth`) provide UI gating but not data protection. Any route relying solely on these without server-side enforcement is vulnerable.

3. **Inner Circle cookie names** (`aol_access`, `innerCircleAccess`, `inner_circle_access`) can be set by client-side JavaScript. While the server validates the session ID contained in these cookies, the presence of multiple cookie names increases the attack surface for cookie confusion.

4. **X-Forwarded-For trust** in rate limiting (`getClientIp` in multiple files) trusts the first value of the header. Behind a CDN/proxy this is standard, but without proper proxy trust configuration, clients can spoof their IP.

5. **Dev bypass** in sovereign middleware (`BYPASS_SOVEREIGN=true` in development) -- must be verified this cannot leak to production through misconfiguration.

6. **Admin JWT secret separation** -- `ADMIN_JWT_SECRET` must remain independent from all user/session secrets.

7. **CSRF protection is opt-in** (`requireSameOrigin` called per-route) rather than enforced globally via middleware. Routes that forget to call it are unprotected.
