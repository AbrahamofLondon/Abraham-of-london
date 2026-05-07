# Error Recovery and Trust-Under-Failure Audit

**Standard**: When something breaks, does the system feel governed, stable, and premium? Or does it feel amateur?

**Platform**: Abraham of London advisory platform (services at GBP 750-1,250+)

**Date**: 2026-05-07

---

## 1. Global Error Pages

### pages/404.tsx
- **Branded**: Yes. Black background, `Abraham of London` title, monospaced "Not Found" label.
- **Copy**: "The archive exists. This address does not." -- premium, concise, confident.
- **Navigation**: "Return Home" button with branded styling (rounded, border, subtle hover).
- **Assessment**: Excellent. Fully branded, no framework defaults, no stack traces. Preserves premium feel.

### pages/_error.tsx
- **Branded**: Yes. Same black/white aesthetic. Differentiates 404 from 500.
- **404 copy**: "The archive has no record of this route. Verify the address."
- **500 copy**: "The archive is intact. The interface failed. Try again."
- **Navigation**: Two options -- "Return Home" and "About". Error code shown in faint monospace.
- **Assessment**: Excellent. The 500 message ("The archive is intact. The interface failed.") reassures without revealing internals. Two navigation paths prevent dead ends.

### app/admin/error.tsx
- **Branded**: Yes. Uses `AdminErrorState` component with amber warning styling.
- **Copy**: "Administrative system interruption" with contextual `error.message`.
- **Recovery**: "Retry" button calls React `reset()`.
- **Concern**: `error.message` is passed directly to the UI. If an unhandled Prisma or system error propagates, the admin could see raw technical messages like `PrismaClientKnownRequestError`. This is admin-only, but still a polish gap.

### app/briefs/[slug]/not-found.tsx
- **Branded**: Yes. Dark background, serif heading, monospaced breadcrumb.
- **Copy**: "The requested intelligence brief does not exist or has been withdrawn."
- **Navigation**: NONE. No link home, no link to briefs index. **Dead end.**
- **Concern**: A user arriving at a stale brief link hits a wall with no way out except the browser back button.

### app/admin/campaigns/[id]/not-found.tsx
- **Branded**: Yes. Light admin theme, ShieldCheck icon, "Sovereign Alignment Registry" language.
- **Navigation**: "Return to Campaign Registry" link.
- **Assessment**: Good. Admin-only, branded, has recovery path.

---

## 2. API Error Responses

### Error Format Consistency
API routes use **two different patterns**:

**Pattern A** (billing, access, diagnostics): `{ ok: false, reason: "CODE" }` or `{ ok: false, error: "CODE" }`
**Pattern B** (events, legacy): `{ error: "human readable string" }`

There is no unified error envelope. Some routes return `reason`, others `error`, others `message`. Client code must handle all variants.

### Raw Error Exposure
- `pages/api/billing/webhook.ts` line 82: Returns `Webhook Error: ${err.message}` directly from Stripe SDK errors. This could expose Stripe-internal error details.
- `pages/api/events/checkout.ts` line 139: In production, returns "Failed to create checkout session. Please try again." -- safe. In development, leaks `err.message`.
- `pages/api/contact.ts` line 268: Returns generic "Internal Server Error" on catch -- safe but unhelpful.
- `pages/api/billing/checkout.ts` line 131: Returns sanitized `STRIPE_CHECKOUT_CREATE_FAILED` with optional Stripe error code -- good.

### Unguarded Prisma Calls
Searching the codebase, Prisma calls in API routes (e.g., `prisma.accessAuditLog.create`, `prisma.processedWebhookEvent.findUnique`, `prisma.retainerContract.updateMany`) are generally wrapped in try/catch at the route level, but individual Prisma calls within webhook handlers (lines 91-101, 179 of billing/webhook.ts) could throw and propagate up. The outer handler does NOT have a global try/catch -- a Prisma failure during entitlement grant could produce an unformatted 500.

---

## 3. Payment Failure States

### Stripe Down During Checkout
- `pages/api/billing/checkout.ts`: The `stripe.checkout.sessions.create` call is wrapped in try/catch (lines 99-137). Returns `{ ok: false, reason: "STRIPE_CHECKOUT_CREATE_FAILED" }` with a 502 status. The error is sanitized -- no Stripe internals leak.
- **User experience**: Depends entirely on the calling UI component. The API returns a clean error, but what does the checkout button show? The front-end must interpret `ok: false` and display something. There is no standardized client-side error toast for checkout failure.

### Payment Succeeds, Webhook Fails
- `pages/api/billing/webhook.ts` lines 162-175: If `ensureEntitlementAfterPayment` returns `!verified.ok`, the webhook returns `500` with `{ error: "ENTITLEMENT_SYNC_FAILED" }`.
- **Critical risk**: The user has paid but may not receive their entitlement. Stripe will retry the webhook (idempotency is implemented with `processedWebhookEvent` table), so eventual consistency is likely. However, between payment and successful retry, the user sees no product access.
- `ensureEntitlementAfterPayment` (referenced from `lib/commercial/payment-verification.ts`) acts as a repair mechanism -- this is a strong safety net.

### Stripe Not Configured
- `pages/api/billing/checkout.ts` line 45: Returns `{ ok: false, reason: "STRIPE_NOT_CONFIGURED" }` with 500. Safe, but a complete block with no user-facing explanation.

---

## 4. Database Unavailable

### Prisma Error Handling
- There is **no global Prisma error boundary** wrapping API routes. Individual routes use try/catch at varying levels of granularity.
- `pages/api/billing/webhook.ts`: The idempotency lock (lines 90-110) has a specific Prisma `P2002` (unique constraint) handler -- good. But the `grantEntitlement` and `recordCheckoutCompletion` calls use try/catch only at the audit level (line 64: "Failed to persist checkout audit record" is a `console.warn`, not a route failure).
- `pages/api/diagnostics/score.ts`: Uses `prisma` for spine persistence wrapped in a bare `catch {}` (line 176-178) -- labelled "Best-effort DB persistence." The scoring result still returns successfully. This is the correct pattern: degrade gracefully.
- `pages/api/diagnostics/reports/download.ts`: All Prisma queries are unguarded -- a DB failure would produce an unhandled rejection and a raw 500.

### Verdict
Mixed. Some routes degrade gracefully, others would produce raw 500 errors if the database is unreachable. The diagnostic scoring route is well-designed (best-effort persistence, core result always returns). The webhook and download routes are vulnerable.

---

## 5. Redis Unavailable

### failClosed Configuration
The codebase uses `failClosed: true` on 17+ routes including:
- `/api/checkout` (line 55)
- `/api/download/[token]` (line 146)
- `/api/strategy-room/session/init` (line 184)
- `/api/strategy-room/session/followup` (line 138)
- `/api/diagnostics/evidence` (line 234)
- `/api/auth/sovereign` (line 117)
- `/api/strategy-room/execution` (line 65)
- Admin authentication (`requireAdminServer.ts` line 44)

### What the User Sees
When rate limiting fails closed (Redis unavailable), `enforceAppRouteRateLimit` returns a rejection response. The user receives a JSON error -- likely `{ ok: false, error: "RATE_LIMITED" }` or similar -- with no HTML page, no branded experience, no explanation that the system is temporarily unavailable.

### Risk Assessment
**CRITICAL**: If Redis goes down, every `failClosed: true` route becomes completely inaccessible. This includes checkout, downloads, strategy room sessions, and authentication. The user sees raw JSON errors. There is no "Redis down" fallback page or maintenance mode.

### Fallback Pattern
`lib/rate-limit.ts` (lines 84-107) has a client-side fallback: if the server rate limiter import fails, it falls back to an in-memory implementation. But the `failClosed` pattern in app-route-guards does not use this fallback -- it blocks outright.

---

## 6. Token/Session Expired

### Session Architecture
`lib/auth/sessions.ts` implements a robust session system with:
- TTLs: Admin 30 days, Inner Circle 7 days, Public 1 day, API 1 day.
- Status tracking: active, expired, revoked, compromised.
- Redis-backed with InMemStore fallback.
- Refresh token support for admin/inner-circle/api session types.

### Expiration Behavior
- `verifySession()` (line 314): Returns `{ valid: false, error: 'Session expired', statusCode: 401 }`.
- There is no client-side session refresh mechanism visible. When a session expires, the API returns 401, and the client must handle it.
- **No automatic redirect to login**: The session layer returns JSON errors. If a user is mid-journey (e.g., in strategy room) and their session expires, the next API call fails with 401. What happens in the UI depends on each component's error handling -- there is no global 401 interceptor.

### Download Token Expiry
- `pages/api/access/serve.ts`: Expired download signatures return `{ error: "INVALID_SIGNATURE" }` with 403. No message explaining the token expired or how to get a new one.
- `pages/api/diagnostics/reports/download.ts`: Returns `{ ok: false, reason: "INVALID_OR_EXPIRED_TOKEN" }` with 403. Clear code but no user-facing recovery path.

---

## 7. Assessment Interruption (Mid-Diagnostic Refresh)

### State Preservation
`lib/client/assessment-state.ts` implements **versioned localStorage persistence**:
- Uses `window.localStorage` with versioned snapshots (`version: "2026-04-standardized"`).
- Saves answers, step index, and timestamp.
- `pages/diagnostics/fast.tsx` (lines 77-100): On mount, loads saved state and shows a "Resume" prompt.

### What Happens on Refresh
1. User refreshes mid-diagnostic.
2. Page loads, checks localStorage for saved state.
3. If found and version matches, shows resume option.
4. User can resume from last step or start fresh.

### Assessment
**Good**. State is preserved client-side with version gating. The fast diagnostic explicitly handles resume with `showResume` state. However, if the user clears browser data or switches devices, progress is lost. There is no server-side state persistence for in-progress assessments (spine persistence only happens after scoring).

---

## 8. Rate Limited (429 Response)

### User-Facing 429 Messages

| Route | 429 Message | Retry Guidance |
|-------|------------|----------------|
| `/api/diagnostics/score` | `"RATE_LIMIT_EXCEEDED"` (raw code) | None |
| `/api/subscribe` | `"Too many subscription attempts. Please try again later."` | Yes |
| `/api/contact` | `"Rate limit exceeded."` | None |
| `/api/diagnostics/reports/download` | `"RATE_LIMITED"` (raw code) | None |

### Rate Limit Headers
Routes that use `createRateLimitHeaders` send standard `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers. This is good for programmatic consumers but invisible to browser users.

### Fast Diagnostic Rate Limit
`pages/diagnostics/fast.tsx` line 253: On submission error, displays the error message directly. If rate limited, user sees "RATE_LIMIT_EXCEEDED" as raw text in a red-tinted paragraph. No retry timer, no explanation.

### Verdict
Mixed. Subscribe route is well-handled. Diagnostic scoring surfaces raw error codes to the user. No route provides a retry countdown.

---

## 9. Email Failure (Resend Down)

### Contact Form
`pages/api/contact.ts` (lines 242-251): Uses `Promise.allSettled` for all email tasks, then checks for failures. If any email task fails, returns `{ ok: false, message: "Email delivery failed. Please try again shortly." }` with 502.

**User sees**: A clear failure message. The contact form submission is effectively lost -- the data was not persisted to a database, only attempted via email. Discord notification may have succeeded (it runs in parallel), providing a partial safety net.

### Email Capture (Diagnostics)
`components/diagnostics/ResultEmailCapture.tsx` (line 49): On capture failure, sets status to `"error"`. The component shows an error state, though the specific UI for the error state was not fully visible in the read. The capture is fire-and-forget -- the diagnostic result is already shown.

### Subscribe Endpoint
`pages/api/subscribe.ts` (lines 278-285): Returns "An unexpected error occurred. Please try again later." on any unhandled error. The subscribe function itself may handle Resend failures internally.

### Verdict
Contact form handles email failure well (clear message, 502 status). The user knows their message was not sent. The diagnostic email capture degrades gracefully since the result is already visible.

---

## 10. Download Denied (Insufficient Entitlement)

### API Response
`pages/api/access/download.ts` (lines 62-67): Returns:
```json
{
  "error": "INSUFFICIENT_ENTITLEMENT",
  "required": "artifact-key",
  "userTier": "current-tier"
}
```
Status 403. No upgrade URL, no pricing information, no human-readable message.

### Report Download Denied
`pages/api/diagnostics/reports/download.ts`: Returns `{ ok: false, reason: "ACCESS_NOT_GRANTED" }` or `{ ok: false, reason: "ARTIFACT_NOT_AVAILABLE" }`. No explanation, no recovery path.

### What the User Sees
The front-end must interpret these JSON responses and render something. There is no standardized "access denied" UI component for download flows. The user likely sees either a raw JSON response (if navigating directly) or whatever error handling the calling component implements.

### Upgrade Path
There is no `upgradeUrl` or `pricingUrl` included in denial responses. The user hits a wall with no visible path to gaining access.

---

## Failure State Scoring Matrix

| # | State | User Message | Recovery Path | Brand Preserved | Dead End? | Score /10 |
|---|-------|-------------|---------------|-----------------|-----------|-----------|
| 1 | 404 page | "The archive exists. This address does not." | Return Home button | Yes | No | **9** |
| 2 | 500 page | "The archive is intact. The interface failed." | Home + About links | Yes | No | **9** |
| 3 | Brief not found | "The requested intelligence brief does not exist" | None | Yes | **YES** | **5** |
| 4 | Checkout - Stripe down | `STRIPE_CHECKOUT_CREATE_FAILED` (JSON) | None in API; depends on UI | Partial | Depends | **5** |
| 5 | Payment OK, webhook fail | User paid, no product yet | Stripe retries webhook | No visible state | Limbo | **4** |
| 6 | Database unavailable | Raw 500 on unguarded routes | None | No | YES | **3** |
| 7 | Redis unavailable | JSON error on all failClosed routes | None | No | YES | **2** |
| 8 | Session expired mid-journey | 401 JSON from API | No auto-refresh, no redirect | No | YES | **3** |
| 9 | Download token expired | `INVALID_SIGNATURE` or `INVALID_OR_EXPIRED_TOKEN` | None | No | YES | **3** |
| 10 | Rate limited (diagnostic) | "RATE_LIMIT_EXCEEDED" raw code | No retry timer | No | YES | **3** |
| 11 | Rate limited (subscribe) | "Too many attempts. Try again later." | Implicit retry | Yes | No | **7** |
| 12 | Email failure (contact) | "Email delivery failed. Please try again shortly." | Retry suggested | Yes | No | **7** |
| 13 | Email capture failure | Error state shown, result preserved | Result already visible | Partial | No | **7** |
| 14 | Assessment interrupted | Resume prompt from localStorage | Resume or restart | Yes | No | **8** |
| 15 | Download denied | `INSUFFICIENT_ENTITLEMENT` JSON | No upgrade path | No | YES | **2** |
| 16 | Admin error boundary | "Administrative system interruption" + Retry | Retry button | Yes | No | **8** |

---

## Top 5 Most Dangerous Failure States for Premium Trust

### 1. CRITICAL: Redis Unavailable -- Total System Lockout (Score: 2/10)
`failClosed: true` on 17+ routes means a Redis outage blocks checkout, downloads, strategy room, authentication, and diagnostics simultaneously. The user sees raw JSON errors with no branded page, no maintenance message, and no estimated recovery. For a platform charging GBP 750-1,250, a Redis blip should not produce a complete, unexplained lockout. **Recommendation**: Add a `failOpen` fallback for read-only routes, and a branded 503 maintenance page for write routes.

### 2. CRITICAL: Download Denied with No Upgrade Path (Score: 2/10)
When a user lacks entitlement, they receive `INSUFFICIENT_ENTITLEMENT` as raw JSON with no human message, no pricing, and no link to purchase. This is the single worst moment to lose trust -- the user wanted something, was told "no," and given no way forward. **Recommendation**: Include `upgradeUrl`, `pricingGBP`, and `displayMessage` in every 403 download response. Build a branded "Unlock this resource" interstitial.

### 3. HIGH: Session Expired Mid-Journey -- Silent 401 (Score: 3/10)
A user in the Strategy Room or mid-diagnostic who hits a session expiry gets a silent 401 JSON response. No redirect to re-authenticate, no "your session expired" modal, no state preservation. Their in-progress work may be lost if the client does not handle 401 gracefully. **Recommendation**: Add a global 401 interceptor that shows a branded re-authentication modal preserving current page state.

### 4. HIGH: Database Unavailable -- Unguarded 500s (Score: 3/10)
Multiple API routes (webhook handler, download routes) have Prisma calls without comprehensive error boundaries. A database outage during webhook processing could leave a user who paid without their entitlement and with no clear error. **Recommendation**: Wrap all Prisma calls in try/catch with classified error responses. Add a dead-letter queue for failed webhook processing.

### 5. HIGH: Payment Succeeded but Entitlement Not Granted -- Limbo State (Score: 4/10)
The webhook has idempotency and `ensureEntitlementAfterPayment` as a repair mechanism, which is good engineering. But if both fail, the user has paid and sees nothing. There is no user-facing "we're processing your order" state, no "contact support" with a transaction reference, and no self-service entitlement check. The user's only signal is a Stripe receipt email and an empty dashboard. **Recommendation**: Add a `/check-purchase?session_id=X` route that the success page polls, with a branded "verifying your access" loading state and a fallback support contact after timeout.

---

## Summary Verdict

**Global error pages** (404, 500) are **premium-grade** -- branded, navigable, confident tone.

**API error handling** is **inconsistent** -- a mix of excellent (billing checkout sanitization, diagnostic graceful degradation) and poor (raw error codes surfaced to users, no upgrade paths on denials).

**Infrastructure failure** (Redis, DB) handling is **the weakest surface** -- failClosed blocks everything with no branded fallback, and unguarded Prisma calls produce raw 500s.

**The gap**: The system handles *expected* errors well (404, validation, rate limits on subscribe) but handles *unexpected infrastructure failures* poorly. For a premium advisory platform, the infrastructure failure path is where trust dies -- these are the moments that make a GBP 1,250 client question whether the platform is professional enough to handle their business.

**Overall Error Recovery Score: 5.8/10**

The branded error pages and diagnostic state preservation show the right instincts. The infrastructure failure paths and download denial flows need the same level of attention.
