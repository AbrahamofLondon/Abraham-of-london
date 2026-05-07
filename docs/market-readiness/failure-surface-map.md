# Failure Surface Map — Abraham of London

**Audit date:** 2026-05-07
**Source:** API routes, error boundaries, middleware, rate limiters, webhook handlers

---

## 1. Stripe / Payment Failures

### 1a. Stripe not configured

**Route:** `/api/billing/checkout`, `/api/billing/webhook`, `/api/webhooks/stripe`, `/api/events/checkout`
**Trigger:** `STRIPE_SECRET_KEY` env var missing or empty.
**User-visible message:**
- `/api/billing/checkout`: `{ ok: false, reason: "STRIPE_NOT_CONFIGURED" }` (500)
- `/api/billing/webhook`: Empty 500 response (no JSON body)
- `/api/webhooks/stripe`: `{ error: "Stripe is not configured" }` (500)
- CheckoutButton shows: "Pricing could not be resolved. Please try again."
**Recovery path:** None for user. Admin must set environment variable.
**Dead-end risk:** HIGH — user clicked "pay" and got a generic error.

### 1b. Stripe Checkout Session creation fails

**Route:** `/api/billing/checkout`
**Trigger:** Stripe API error (invalid price ID, network timeout, Stripe outage).
**User-visible message:** CheckoutButton shows: "Pricing could not be resolved. Please try again."
**API response:** `{ ok: false, reason: "STRIPE_CHECKOUT_CREATE_FAILED", code: "<stripe_error_code>" }` (502)
**Recovery path:** User can retry. Button resets to non-loading state.
**Dead-end risk:** MEDIUM — user sees a retry-able error but no diagnostic info.

### 1c. Payment declined

**Route:** Stripe-hosted checkout page
**Trigger:** Card declined, insufficient funds, 3DS failure.
**User-visible message:** Stripe shows its own decline message. User can retry with another card or cancel.
**On cancel:** Redirected to `cancelPath` with `?checkout=cancelled`. StrategyRoomConversionBridge shows: "Entry cancelled. No payment was taken. The decision remains unresolved." ExecutiveReportingPaywall shows: "Checkout cancelled. No payment was taken. Your progress has been preserved where possible."
**Recovery path:** Return to product page and retry checkout.
**Dead-end risk:** LOW — Stripe handles this well.

### 1d. Webhook signature verification failure

**Route:** `/api/billing/webhook`, `/api/webhooks/stripe`, `/api/stripe/diagnostic-report-webhook`
**Trigger:** `STRIPE_WEBHOOK_SECRET` wrong or missing, replay attack, corrupted payload.
**User-visible message:** None — webhook is server-to-server. User has paid but entitlement may not be granted.
**API response:**
- `/api/billing/webhook`: `Webhook Error: <message>` (400)
- `/api/webhooks/stripe`: `{ error: "Webhook Error: <message>" }` (400)
**Recovery path:** None automatic. Entitlement must be manually granted by admin.
**Dead-end risk:** CRITICAL — user paid, got success redirect, but has no access to purchased content.

### 1e. Entitlement sync failure after successful payment

**Route:** `/api/billing/webhook` (post-payment entitlement grant)
**Trigger:** Database unavailable, Prisma error during entitlement write.
**User-visible message:** None immediately — user is already on success page. Access to purchased content will fail with 401/403.
**API response:** Webhook returns `{ error: "ENTITLEMENT_SYNC_FAILED" }` (500) — Stripe will retry.
**Self-repair:** `ensureEntitlementAfterPayment()` in `lib/commercial/payment-verification.ts` attempts repair:
1. Verifies payment via Stripe API
2. Grants entitlement via `grantCanonicalEntitlement()`
3. Verifies grant succeeded
**Recovery path:** Stripe retries webhook (up to ~3 days). If repair also fails, admin must manually grant.
**Dead-end risk:** HIGH — most dangerous failure in the system. User paid, sees success page, but cannot access product.

### 1f. Do-Not-Sell gate blocks checkout

**Route:** `/api/billing/checkout`
**Trigger:** Email has no completed diagnostic, stated cost < £100/month, accuracy not confirmed, intent not declared.
**User-visible message:** CheckoutButton shows generic: "Checkout could not be prepared. Please try again."
**API response:** `{ ok: false, reason: "<gate_reason>", message: "You are not ready to purchase. Complete the diagnostic properly or leave." }` (403)
**Recovery path:** User must complete diagnostic first. The gate message is harsh but accurate.
**Dead-end risk:** LOW — intentional block, but the generic CheckoutButton error message does not explain what the user needs to do.

---

## 2. Database (Prisma) Failures

### 2a. Database connection unavailable

**Trigger:** PostgreSQL/Neon down, connection pool exhausted, DNS failure.
**Affected routes:** Every API route that uses `prisma` — nearly all of them.
**User-visible message:** Varies by route:
- Webhook handlers: silent failure, entitlements not granted
- Diagnostic scoring: likely 500 with generic error
- Download routes: 500 or partial failure
- Admin pages: error boundary shows "Administrative system interruption" with retry button
**Recovery path:** Retry. Admin error boundary (`app/admin/error.tsx`) shows: "Administrative system interruption" / "Retry the surface. If the failure persists, inspect the upstream service or database dependency." with a Retry button.
**Dead-end risk:** HIGH — database failure cascades to every paid interaction.

### 2b. Prisma query timeout

**Trigger:** Slow query, table lock, missing index.
**User-visible message:** Same as connection failure — 500 or timeout.
**Recovery path:** Retry button if in admin. Otherwise no recovery UI.
**Dead-end risk:** MEDIUM — transient but repeated occurrence would block all transactions.

### 2c. Idempotency table failure

**Route:** `/api/billing/webhook`
**Trigger:** `processedWebhookEvent` table unreachable or constraint violation race.
**Behavior:** Code catches this gracefully — if `P2002` (unique constraint), returns `{ received: true, replay: true }`. For other DB errors, falls through and processes anyway with a warning.
**User-visible message:** None.
**Dead-end risk:** LOW — degraded but functional.

---

## 3. Email (Resend) Failures

### 3a. Resend API key missing

**Trigger:** `RESEND_API_KEY` env var not set.
**User-visible message:** Email silently fails. `sendEmail()` returns `{ ok: false, error: "RESEND_API_KEY_MISSING" }`.
**Affected flows:**
- Purchase confirmation emails for decision instruments (non-blocking — caught and logged)
- Newsletter signup confirmation
- Contact form acknowledgement
- Inner Circle emails
- Enterprise campaign invitations
**Recovery path:** None for user. They never receive the email.
**Dead-end risk:** MEDIUM — purchase confirmation emails failing means users may not know how to access their purchase. The webhook at `/api/webhooks/stripe` catches email failures as non-blocking: `"[STRIPE_WEBHOOK] Purchase email failed (non-blocking)"`.

### 3b. Resend API error

**Trigger:** Resend service down, rate limit, invalid template.
**User-visible message:** Silent failure. `sendEmail()` catches and returns `{ ok: false, error: "<message>" }`.
**Recovery path:** None. No retry mechanism for failed emails.
**Dead-end risk:** MEDIUM — same as 3a.

### 3c. Email recipient missing

**Trigger:** Empty or invalid email passed to `sendEmail()`.
**User-visible message:** Silent failure. Returns `{ ok: false, error: "EMAIL_RECIPIENT_MISSING" }`.
**Dead-end risk:** LOW — defensive check prevents send attempt.

---

## 4. Authentication Failures

### 4a. Sovereign auth — invalid key

**Route:** `/restricted` page, `/api/auth/sovereign`
**Trigger:** Wrong access key entered.
**User-visible message:** Error shown in red box: `"Invalid authentication key"` or `data.error` from API.
**Recovery path:** User can retry. After multiple failures, rate limiting applies.
**Dead-end risk:** LOW — clean UI with retry.

### 4b. Sovereign auth — service unavailable

**Route:** `/restricted`
**Trigger:** Auth service fetch failure.
**User-visible message:** `"Authentication service unavailable. Please try again."`
**Recovery path:** Retry.
**Dead-end risk:** LOW.

### 4c. Session expired/invalid

**Route:** `/api/reports/request` and any route using `getSessionContext()`
**Trigger:** Access cookie expired or tampered.
**User-visible message:** API returns `{ ok: false, reason: "SESSION_INVALID" }` (401).
**Recovery path:** User must re-authenticate via `/restricted`.
**Dead-end risk:** MEDIUM — if user is mid-flow (e.g., requesting a report), session expiry is disruptive.

### 4d. Download token expired or invalid

**Route:** `/api/download/[token]`
**Trigger:** Token expired, tampered, or already consumed.
**User-visible message:** `{ error: "<reason>" }` (403) — reason from `verifyDownloadToken()`.
**Recovery path:** User must re-request download token.
**Dead-end risk:** MEDIUM — user expects a download and gets a JSON error.

### 4e. Download token binding mismatch

**Route:** `/api/download/[token]`
**Trigger:** Token used from different session/user than it was issued to.
**User-visible message:** `{ error: "Access restricted to original session" }` (403)
**Recovery path:** User must request a new token from the same session.
**Dead-end risk:** MEDIUM — confusing for users who switch browsers or clear cookies.

---

## 5. Rate Limiting

### 5a. Persistent rate limit (Redis-backed)

**Routes:** `/api/download/[token]` (20/60s), `/api/checkout` (12/15min), `/api/diagnostics/score` (20/15min)
**Trigger:** Too many requests from same IP or identity key.
**User-visible message:** `{ error: "RATE_LIMIT_EXCEEDED" }` (429) with `Retry-After` header.
**Recovery path:** Wait for window to reset.
**Dead-end risk:** LOW — standard rate limiting with proper headers.

### 5b. Rate limit store unavailable (Redis down)

**Trigger:** Redis connection fails.
**Behavior:** `consumePersistentRateLimit()` with `failClosed: true` returns `{ allowed: false }` — blocks the request even though no actual rate limit was exceeded.
**User-visible message:** Same 429 as above.
**Dead-end risk:** HIGH when `failClosed: true` — Redis outage blocks all rate-limited routes (checkout, downloads, diagnostics). Legitimate users are denied access.

### 5c. In-memory rate limit (fallback)

**Routes:** `/api/newsletter`, `/api/contact`, Pages Router API routes
**Implementation:** `lib/security/rate-limit-unified.ts` uses `MemoryStore` — resets on server restart, not shared across instances.
**Dead-end risk:** LOW — per-instance limiting, may be inconsistent in multi-instance deployments.

### 5d. Sovereign middleware rate limiting

**Route:** All sovereign-protected routes
**Limits:** DEFAULT: 100/min, ADMIN: 50/min, CONSTITUTIONAL: 20/min
**Dead-end risk:** LOW.

---

## 6. Assessment / Diagnostic Failures

### 6a. Diagnostic scoring disabled

**Route:** `/api/diagnostics/score`
**Trigger:** `SECURITY_LOCKDOWN_MODE=true` or `DISABLE_DIAGNOSTIC_SCORING=true` env vars.
**User-visible message:** `{ ok: false, error: "DIAGNOSTIC_SCORING_DISABLED" }` (503)
**Recovery path:** None — admin must re-enable.
**Dead-end risk:** HIGH — blocks the entire conversion funnel (diagnostic → reporting → strategy room).

### 6b. Diagnostic validation failure

**Route:** `/api/diagnostics/submit`, `/api/diagnostics/score`
**Trigger:** Invalid answers, missing fields, schema validation failure.
**User-visible message:** `{ ok: false, error: "INVALID_REQUEST" }` (400)
**Recovery path:** User must fix inputs and resubmit.
**Dead-end risk:** LOW — client-side validation should catch most issues.

### 6c. AI scoring failure mid-assessment

**Route:** `/api/diagnostics/score`
**Trigger:** Prisma failure during scoring, intelligence spine creation error, decision memory service failure.
**User-visible message:** Likely 500 with generic error — scoring involves many server-side computations.
**Recovery path:** Retry. Answers are not lost if client-side state is preserved.
**Dead-end risk:** MEDIUM — user has invested time in diagnostic and loses progress if retry fails.

---

## 7. Download Failures

### 7a. PDF asset not found in registry

**Route:** `/api/downloads/[slug]`
**Trigger:** Invalid slug, asset removed from registry.
**User-visible message:** `{ ok: false, error: "PDF asset not found" }` (404)
**Recovery path:** None — asset does not exist.
**Dead-end risk:** MEDIUM if user paid for this asset.

### 7b. PDF file missing on disk

**Route:** `/api/downloads/[slug]`
**Trigger:** File not deployed to `private_storage/premium-content/` or `private/assets/paid-instruments/`.
**User-visible message:** `{ ok: false, error: "PDF unavailable", state: "unavailable", htmlFallback: "/downloads/<slug>" }` (404)
**Recovery path:** `htmlFallback` link provided — user can view HTML version.
**Dead-end risk:** MEDIUM — user paid but gets a fallback instead of the PDF.

### 7c. Asset not in vault registry (token download)

**Route:** `/api/download/[token]`
**Trigger:** `getPDFById(contentId)` returns null.
**User-visible message:** `{ error: "Asset missing from vault registry" }` (404)
**Recovery path:** None.
**Dead-end risk:** HIGH if user has a valid token for a deregistered asset.

### 7d. Document generation failure (react-pdf)

**Route:** `/api/download/[token]`
**Trigger:** `@react-pdf/renderer` crash, template error, font registration failure.
**User-visible message:** `{ error: "Document generation failed" }` (500)
**Recovery path:** Retry. Error is logged as `INSTITUTIONAL_STREAM_ERROR`.
**Dead-end risk:** HIGH — user has valid token and entitlement but gets no document.

### 7e. Path traversal blocked

**Route:** `/api/downloads/[slug]`
**Trigger:** Resolved path does not start with allowed root directory.
**User-visible message:** `{ ok: false, error: "Invalid PDF asset path" }` (500)
**Recovery path:** None — configuration error.
**Dead-end risk:** LOW — security guard, not a user-facing scenario.

---

## 8. 404 / 500 / Error Pages

### 8a. Custom 404 page

**File:** `pages/404.tsx`
**Message:** "404 — Page missing" / "The archive exists. This address does not."
**Recovery:** "Return Home" link to `/`.
**Brand-consistent:** Yes — black background, institutional typography.

### 8b. Custom 500 page

**File:** `pages/500.tsx`
**Message:** "500 — Internal error" / "The archive is intact. The interface failed. Try again."
**Recovery:** "Return Home" link to `/`.
**Brand-consistent:** Yes.

### 8c. Generic error page

**File:** `pages/_error.tsx`
**Message:** Dynamic based on status code:
- 404: "Missing Artifact" / "404 — Not found" / "The archive has no record of this route. Verify the address."
- Other: "Server Incident" / "500 — Internal error" / "The archive is intact. The interface failed. Try again."
**Recovery:** "Return Home" link + "About" link.
**Brand-consistent:** Yes.

### 8d. Admin error boundary

**File:** `app/admin/error.tsx`
**Message:** "Administrative system interruption" / `error.message` / "Retry the surface. If the failure persists, inspect the upstream service or database dependency."
**Recovery:** "Retry" button calls `reset()`.
**Brand-consistent:** Yes — admin-oriented language.

### 8e. Brief not found

**File:** `app/briefs/[slug]/not-found.tsx`
**Message:** "Briefing Not Found" / "The requested intelligence brief does not exist or has been withdrawn."
**Recovery:** No link provided.
**Dead-end risk:** MEDIUM — no navigation offered.

### 8f. Campaign not found

**File:** `app/admin/campaigns/[id]/not-found.tsx`
**Message:** "Campaign Not Found" / "The requested campaign could not be found in the Sovereign Alignment Registry."
**Recovery:** "Return to Campaign Registry" link to `/admin/campaigns`.
**Brand-consistent:** Yes.

---

## 9. Checkout-Specific UI Error States

**Component:** `CheckoutButton` (`components/commercial/CheckoutButton.tsx`)

| API Reason | User Sees |
|------------|-----------|
| `EMAIL_REQUIRED` | "A valid email is required." |
| `STRIPE_CHECKOUT_CREATE_FAILED` | "Pricing could not be resolved. Please try again." |
| `PRODUCT_INACTIVE` / `NOT_FOUND` | "This product is not currently available." |
| Network failure (fetch throws) | "Network error. Please try again." |
| Any other error | "Checkout could not be prepared. Please try again." |
| Loading state | Button text changes to "Preparing checkout..." |

Error text styling: `font-family: JetBrains Mono`, `font-size: 8px`, `color: rgba(252,165,165,0.60)` — very small and faded. May be missed by users.

---

## 10. Checkout Lockdown

**Route:** `/api/checkout` (App Router)
**Trigger:** `DISABLE_CHECKOUT` env flag set to "true".
**User-visible message:** `{ ok: false, error: "CHECKOUT_TEMPORARILY_DISABLED" }` via `failClosedForFlag()`.
**Recovery path:** None until admin removes flag.
**Dead-end risk:** HIGH — all App Router checkouts blocked.

---

## 11. Production Redirect (App Router Checkout)

**Route:** `/api/checkout` (App Router)
**Trigger:** `NODE_ENV === "production"`.
**User-visible message:** `{ ok: false, error: "Use canonical checkout", canonicalEndpoint: "/api/billing/checkout" }` (308)
**Impact:** The App Router checkout route is a **development-only** endpoint. In production, it redirects to the Pages Router canonical checkout. Any client calling `/api/checkout` in production gets a 308, not a Stripe URL.
**Dead-end risk:** LOW if clients use `/api/billing/checkout` directly. HIGH if any production component hits `/api/checkout`.

---

## Critical Dead-End Summary

| Failure | Severity | User Impact |
|---------|----------|-------------|
| Webhook signature failure after payment | CRITICAL | User paid, no access, no auto-recovery |
| Entitlement sync failure after payment | HIGH | User paid, success page shown, but access denied on product |
| Redis down with failClosed rate limits | HIGH | All checkout/download/diagnostic routes blocked for everyone |
| Diagnostic scoring disabled | HIGH | Entire conversion funnel broken |
| Database unavailable | HIGH | Cascading failure across all authenticated routes |
| Document generation failure | HIGH | Valid token + entitlement but no PDF delivered |
| Stripe not configured | HIGH | All paid transactions fail with opaque error |
| Brief not-found page has no nav | MEDIUM | User at dead end with no way out except browser back |
| Checkout error text at 8px | MEDIUM | Users may not see error messages |
| Do-Not-Sell gate block shows generic error in UI | MEDIUM | User does not know they need to complete diagnostic first |
