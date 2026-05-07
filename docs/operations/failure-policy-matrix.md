# Failure Policy Matrix

> Operational reference for fail-open / fail-closed behavior across all external dependencies.
> Generated from codebase audit 2026-05-07.

---

## D1 -- Failover Classification

### System-by-System Analysis

#### Redis (ioredis)

**Source**: `lib/redis.ts`, `lib/server/security/persistent-rate-limit.ts`

- Singleton ioredis client with `enableOfflineQueue: true`, `lazyConnect: true`, `connectTimeout: 5000`.
- Retries up to 10 times with exponential backoff (100ms increments, max 3s), then stops.
- `isRedisAvailable()` races a PING against a 3s timeout.

**Rate limiting path** (`persistent-rate-limit.ts`):
- When Redis fails, falls back to Postgres (`rate-limit-store.postgres.ts`).
- When both Redis AND Postgres fail:
  - If `failClosed: true` (default) -- returns `allowed: false`. Request is **blocked**.
  - If `failClosed: false` -- returns `allowed: true`. Request **passes through**.
- Almost every call site sets `failClosed: true` explicitly (see D2 below).

**MFA challenge store** (`lib/auth/mfa.ts`):
- Production: throws if Redis unavailable -- **fail-closed**.
- Development: falls back to in-memory store -- **fail-open**.
- Individual Redis operations in production throw on failure -- no silent degradation.

#### Database (Prisma / Neon PostgreSQL)

**Source**: `lib/prisma.pages.ts`, `lib/prisma.server.ts`

- Lazy singleton via Proxy -- PrismaClient created on first use, not at import time.
- `safePrismaQuery()` catches errors, logs them, re-throws unless a fallback value is explicitly passed.
- No automatic retry or circuit breaker at the Prisma layer.

**API route behavior when DB is down**:
- Webhook (`pages/api/billing/webhook.ts`): idempotency check failure logs a warning and **continues processing** (fail-open for idempotency, but entitlement grant will fail with 500).
- Campaigns route (`app/api/admin/campaigns/route.ts`): returns **503**.
- Executive report (`app/api/analytics/executive-report/route.ts`): returns **503** with code `DB_503`.
- Predictive insights (`app/api/predictive/insights/`): returns **503**.
- Most other routes: unhandled Prisma error surfaces as **500** (Next.js default).
- `checkDatabaseConnection()` exists for health checks but is not called as middleware.

#### Stripe

**Source**: `pages/api/billing/checkout.ts`, `pages/api/billing/webhook.ts`, `app/api/checkout/route.ts`

- Stripe client is `null` if `STRIPE_SECRET_KEY` is missing -- routes return **500** immediately.
- Checkout session creation failure: returns **502** with `STRIPE_CHECKOUT_CREATE_FAILED`.
- Webhook signature verification failure: returns **400**.
- Entitlement sync failure after payment: returns **500** (`ENTITLEMENT_SYNC_FAILED`).
- HubSpot sync after payment: fire-and-forget (`.catch(() => {})`).
- `failClosedForFlag` on `DISABLE_CHECKOUT` returns **503** `CHECKOUT_TEMPORARILY_DISABLED`.

#### Email (Resend)

**Source**: `lib/email/core/sendEmail.ts`, `lib/server/email.ts`

- `sendEmail()` returns `{ ok: false, error: "..." }` on failure -- **never throws**.
- Missing API key: returns `{ ok: false, error: "RESEND_API_KEY_MISSING" }`.
- Resend API error: caught, logged to `[EMAIL_SEND_AUDIT]`, returns `{ ok: false }`.
- Network error: caught, returns `{ ok: false, error: "EMAIL_SEND_FAILED" }`.
- `lib/server/email.ts` (`sendAppEmail`): separate legacy path with console-mode fallback; returns `{ success: false }` on failure.
- **Caller behavior varies**: contact form (`pages/api/contact.ts`) uses email result but the user-facing impact depends on how the caller handles `ok: false`.

#### Auth (NextAuth / JWT)

**Source**: `lib/auth/config.ts`, `lib/auth/token.ts`, `lib/auth/resolve-identity.ts`

- NextAuth JWT strategy -- `NEXTAUTH_SECRET` is required for JWT signing/verification.
- If `NEXTAUTH_SECRET` is wrong or missing: JWT verification fails silently, session returns `null`, user is treated as unauthenticated.
- Client-side token storage was **neutralized** (`lib/auth/token.ts`) -- all functions are no-ops. Server session is sole authority.
- Session expiry: `lib/auth/sessions.ts` sets `status: 'expired'` when `expiresAt <= now`.
- `lib/access/bridge.ts` maps `"session-expired"` to `"public"` tier.
- Admin auth (`lib/auth/requireAdminServer.ts`): `failClosed: true` on rate limiting.
- Build phase: returns `{ ok: false, status: 503 }`.

#### Analytics (GA4)

**Source**: `lib/gtag.ts`, `lib/analytics/track.ts`

- `lib/gtag.ts`: guards on `typeof window` and `window.gtag` -- no-ops on server or if GA4 not loaded. **Fail-open by design**.
- `lib/analytics/track.ts`: wrapped in try/catch, entire function body swallowed on error. Comment: "analytics must never break the app". **Fail-open**.
- `lib/build-safe.ts`: `enableAnalytics` only true when `isClient() && !isTest()`.
- Server-side audit (`lib/audit.ts`): explicitly "fail-open" -- `logAuditEvent` catches all errors, never throws.
- Edge audit (`lib/server/audit-edge.ts`): header comment: "never throws (fail-open)".

#### Contentlayer

**Source**: `lib/contentlayer.ts`, `lib/content-fallback.ts`, `contentlayer.config.ts`

- `lib/contentlayer.ts` wraps every per-kind loader in `safeCall()` which catches exceptions and returns `[]`.
- If content build fails: pages receive empty arrays rather than crashing.
- `lib/content-fallback.ts`: imports from `@/lib/content` with destructuring defaults (`= []`).
- No runtime content fetching -- all content is resolved at build time or from generated JSON files.
- If `.contentlayer/generated/` is stale, the app serves stale content; if missing, pages render with empty collections.

---

### Failover Classification Table

| System | Current Behavior | Correct Policy | Gap | Risk |
|---|---|---|---|---|
| **Redis (rate limiting)** | Fail-closed on all routes (falls back to Postgres first, then blocks) | Fail-closed for auth/payments/downloads; fail-open for marketing/content/analytics | All routes fail-closed identically; no differentiation between critical and non-critical paths | **HIGH** -- Redis + Postgres outage blocks homepage, search, marketing diagnostics, and all public-facing routes |
| **Redis (MFA)** | Fail-closed in production; fail-open in dev | Fail-closed in production | None | Low |
| **Database (Prisma)** | Mixed: some routes return 503, most crash with unhandled 500 | All routes should return structured 503 with retry headers | Inconsistent error responses; no circuit breaker; no connection pool health gating | **MEDIUM** -- User sees raw 500 errors on most DB-dependent routes |
| **Stripe (checkout)** | Returns 502 on creation failure; 500 on entitlement sync failure | 502/503 with clear user message | Gap is minor -- error codes are structured but entitlement sync failure is 500 not 503 | **MEDIUM** -- Entitlement sync failure after successful payment is critical data loss risk |
| **Stripe (webhooks)** | Idempotency check fails open; entitlement failure returns 500 | Webhook should always return 200 to Stripe (ack), queue retry internally | Returning 500 causes Stripe to retry, but entitlement may fail repeatedly | **HIGH** -- Payment received but entitlement not granted; no dead-letter queue |
| **Email (Resend)** | Returns `{ ok: false }` -- never throws | Fail-open for notifications; fail-closed for transactional (invite links, access tokens) | All email failures treated identically; no distinction between marketing vs. critical transactional email | **MEDIUM** -- Invite/access emails fail silently; user has no recovery path |
| **Auth (NextAuth)** | Missing/wrong secret: session is null, user treated as unauthenticated | Correct -- fail-closed to public | None | Low |
| **Analytics (GA4)** | Fail-open; all errors swallowed | Fail-open | None | None |
| **Audit logging** | Fail-open; never throws | Fail-open | None | Low (audit gaps during outage, acceptable) |
| **Contentlayer** | Returns empty arrays on failure | Fail-open with stale content preferred | No mechanism to serve previously-cached content if regeneration fails during deploy | **LOW** -- Build failure means empty pages deployed; detected at build, not runtime |

---

## D2 -- Redis Degradation Policy

### Current State

Every rate-limiting call in the codebase passes `failClosed: true` (explicitly or by default). The persistent rate limiter (`lib/server/security/persistent-rate-limit.ts`) defaults `failClosed` to `true` at line 51: `const failClosed = options.failClosed !== false;`

### Routes That MUST Fail Closed

These routes handle authentication, payments, or sensitive asset delivery. If rate limiting is unavailable, requests must be blocked.

| Route | File | Reason |
|---|---|---|
| `/api/auth/sovereign` | `app/api/auth/sovereign/route.ts` | Authentication endpoint |
| `/api/admin/auth/verify` | `pages/api/admin/auth/verify.ts` | Admin auth verification |
| `/api/admin/auth/send-link` | `pages/api/admin/auth/send-link.ts` | Admin magic link (brute-force target) |
| `/api/admin/dev-login` | `app/api/admin/dev-login/route.ts` | Dev login (must block in prod) |
| `/api/checkout` | `app/api/checkout/route.ts` | Payment initiation |
| `/api/billing/checkout` | `pages/api/billing/checkout.ts` | Legacy payment initiation |
| `/api/download/[token]` | `app/api/download/[token]/route.ts` | Paid asset delivery |
| `/api/inner-circle/verify` | `app/api/inner-circle/verify/route.ts` | Premium access verification |
| `/api/inner-circle/issue` | `app/api/inner-circle/issue/route.ts` | Token issuance |
| `/api/user/delete` | `app/api/user/delete/route.ts` | Account deletion |
| `/api/user/unsubscribe` | `app/api/user/unsubscribe/route.ts` | Subscription modification |
| `/api/diagnostics/score` | `pages/api/diagnostics/score.ts` | Paid diagnostic scoring |
| `/api/diagnostics/challenge` | `pages/api/diagnostics/challenge.ts` | Diagnostic anti-abuse |
| `/api/diagnostics/capture` | `pages/api/diagnostics/capture.ts` | Diagnostic data capture |
| `/api/diagnostics/constitutional-intake/report` | `pages/api/diagnostics/constitutional-intake/report.ts` | Report generation |
| `/api/diagnostics/evidence` | `app/api/diagnostics/evidence/route.ts` | Evidence submission |
| `/api/strategy-room/session/*` | `app/api/strategy-room/session/init/route.ts`, `followup/route.ts` | Paid strategy sessions |
| `/api/strategy-room/execution` | `app/api/strategy-room/execution/route.ts` | Paid execution |
| `/api/purpose-alignment/*` | `app/api/purpose-alignment/capture/route.ts`, `assessments/route.ts` | Assessment data |

### Routes That SHOULD Fail Open

These routes serve public content, marketing pages, or non-critical features. Blocking them during an infrastructure outage creates unnecessary user impact.

| Route | File | Current `failClosed` | Change Required |
|---|---|---|---|
| `/api/search` | `app/api/search/route.ts` | `true` | Change to `false` -- search is non-destructive; blocking it on Redis outage harms UX with no security benefit |
| `/api/interactions/toggle` | `app/api/interactions/toggle/route.ts` | `true` | Change to `false` -- interaction toggles (likes, bookmarks) are non-critical |
| `/api/cron/decision-state` | `app/api/cron/decision-state/route.ts` | Uses `failClosedForFlag` | Acceptable (cron, not user-facing) |
| `/api/strategy-room/briefing/return/[sessionId]` | `app/api/strategy-room/briefing/return/[sessionId]/route.ts` | Uses `failClosedForFlag` | Evaluate -- may be viewing existing results (read-only) |

### Config Change Required

In `lib/server/security/persistent-rate-limit.ts`, the default at line 51 is correct (fail-closed by default). The change must be made at the **call sites** listed above by passing `failClosed: false` explicitly.

In `lib/security/rateLimit.ts`, all three `consumePersistentRateLimit` calls at lines 49, 76, and 95 hardcode `failClosed: true`. The `limitIp`, `limitEmail`, and `consumeRateLimit` functions should accept an optional `failClosed` parameter to allow callers to override.

---

## D3 -- Recovery UX Inventory

### What the User Currently Sees

| Failure State | Current User Experience | Source | Severity |
|---|---|---|---|
| **Checkout failure (Stripe down)** | Inline error: "Pricing could not be resolved. Please try again." (for `STRIPE_CHECKOUT_CREATE_FAILED`) or "Checkout could not be prepared. Please try again." (generic). Button re-enables. | `components/commercial/CheckoutButton.tsx` lines 68-71 | Adequate -- user can retry |
| **Checkout failure (network)** | Inline error: "Network error. Please try again." | `components/commercial/CheckoutButton.tsx` line 75 | Adequate |
| **Checkout disabled (lockdown)** | API returns 503 `CHECKOUT_TEMPORARILY_DISABLED`. Client shows generic checkout failure message. No dedicated maintenance UX. | `app/api/checkout/route.ts` line 40 | **Gap** -- user sees generic error, not a maintenance message |
| **Report generation failure** | API returns `SESSION_INVALID` (401) or `INSUFFICIENT_CLEARANCE` (403) or 500. No specific UI for generation failure. Report request returns structured JSON but the client-side handling of generation errors is not specialized. | `pages/api/reports/request.ts` | **Gap** -- no user-facing progress indicator or retry mechanism for report generation |
| **Session expiry** | Session mapped to `"public"` tier via `lib/access/bridge.ts`. User silently loses access to premium content. No toast, modal, or redirect to login. | `lib/access/bridge.ts` line 58 | **Gap** -- user discovers expired session only when they try to access gated content and get a generic access-denied response |
| **Rate limit hit** | API returns 429 with `{ error: "RATE_LIMIT_EXCEEDED" }` and `Retry-After` header. No client-side rate-limit UX component. | `lib/server/security/app-route-guards.ts` lines 199-208 | **Gap** -- user sees raw JSON error or a failed fetch; no friendly "slow down" message |
| **Download denial** | API returns 403 with specific reason: `"Unauthorized"`, `"Access restricted to original session"`, `"Binding mismatch"`, or rate-limit 429. No custom error page for download failures. | `app/api/download/[token]/route.ts` | **Gap** -- user sees JSON error; no "re-authenticate" or "request new link" flow |
| **Database unavailable** | Varies: some routes return 503 with structured JSON, most return raw 500. `ErrorBoundary` component catches React render errors with "Something went wrong" + retry button, but does not catch API failures. | `components/ErrorBoundary.tsx`, various API routes | **Gap** -- no unified "service temporarily unavailable" page |
| **Email send failure** | `sendEmail()` returns `{ ok: false }` to the caller. Contact form behavior depends on how the API route handles the result. No user-visible notification that their email was not delivered. | `lib/email/core/sendEmail.ts` | **Gap** -- user may see "message sent" even if delivery failed, depending on route implementation |
| **Redis + Postgres both down** | All rate-limited routes return 429 (treated as rate-limited, not as service unavailable). User cannot distinguish between "you are rate limited" and "our infrastructure is down." | `lib/server/security/persistent-rate-limit.ts` line 125 | **Gap** -- misleading error code; should return 503 when infrastructure is unavailable, not 429 |
| **Maintenance mode** | `pages/api/system/maintenance.ts` handles log cleanup, not user-facing maintenance. No maintenance page or middleware exists. `SECURITY_LOCKDOWN_MODE` env flag blocks routes with 503 but no user-facing maintenance template. | `lib/server/security/app-route-guards.ts` line 217 | **Gap** -- no `/maintenance` page or middleware to serve a branded downtime page |

### ErrorBoundary Coverage

The `components/ErrorBoundary.tsx` provides four visual variants (`pdf`, `api`, `system`, default) with a retry button. However:

- It only catches **React render errors**, not API fetch failures.
- No global error handler intercepts 429, 500, 502, or 503 API responses.
- No toast/notification system for transient failures.
- No automatic retry with backoff for failed API calls.

---

## Priority Actions

1. **CRITICAL**: Change `failClosed` to `false` for `/api/search` and `/api/interactions/toggle` rate limiters to prevent Redis outage from blocking public features.
2. **CRITICAL**: Fix infrastructure-unavailable response: when both Redis and Postgres are down, return 503 (not 429) in `persistent-rate-limit.ts` `unavailableResult`.
3. **HIGH**: Add a dead-letter queue or webhook retry buffer for Stripe webhook entitlement failures to prevent payment-without-access scenarios.
4. **HIGH**: Add session-expiry detection on the client with a redirect or modal prompting re-authentication.
5. **MEDIUM**: Create a unified 503 error page (`app/error.tsx` or middleware) for infrastructure outages.
6. **MEDIUM**: Add a maintenance mode middleware that serves a branded page when `SECURITY_LOCKDOWN_MODE` is active.
7. **MEDIUM**: Surface email delivery failures to the user on the contact form and invite flows.
8. **LOW**: Standardize all DB-failure API responses to return 503 with `Retry-After` headers instead of raw 500.
