# Security Implementation Confirmation

**Date:** 2026-05-07
**Auditor:** Automated code-level verification
**Scope:** 10 specific security claims checked against source code

---

## 1. No public protected PDFs

**CONFIRMED**

`public/assets/downloads/` contains only `.pdf.fingerprint` stub files (84 files). Zero actual PDF binaries.

```
ls public/assets/downloads/*.pdf 2>/dev/null | wc -l  →  0
```

Additionally, `proxy.ts:185-194` implements `guardedPdfDownloadResponse()` which intercepts any request matching `/assets/downloads/*.pdf` and 307-redirects it to `/api/downloads/{slug}`, preventing direct static serving even if a PDF were accidentally committed.

**Evidence:** `proxy.ts:185-194`, `public/assets/downloads/` directory listing

---

## 2. No raw decision text in emails

**CONFIRMED**

All email templates reviewed:

- `lib/email/decision-email-builder.ts` — Four email types (session_continuation, decision_drift, return_brief, critical_pattern). None include diagnostic scores, raw decision text, or internal classifications. Emails contain only behavioural nudge copy ("Your decision record remains open", "There has been no recorded action") and a `secureLink` URL. The actual report data is behind the authenticated link, never inline.

- `lib/email/templates/InnerCircleEmail.tsx` — Registration/resend template. Contains only access key and unlock URL. No diagnostic data.

- `lib/email/dispatcher.ts` — Deleted/orphaned (contains only a comment). All email sending goes through `lib/email/core/sendEmail.ts`.

**Evidence:** `lib/email/decision-email-builder.ts:96-256`, `lib/email/templates/InnerCircleEmail.tsx:23-91`

---

## 3. No arbitrary delete/unsubscribe

**CONFIRMED**

Both `app/api/user/delete/route.ts` and `app/api/user/unsubscribe/route.ts` implement a three-gate protection:

1. **Signed proof token required** — `verifySignedActionToken()` validates a cryptographically signed token with purpose-scoped subject (`privacy_delete` / `privacy_unsubscribe`). The token subject is `sha256Hex(email)`, binding the token to a specific email address.

2. **Authenticated owner check** — If no proof token, `resolveIdentity(req)` checks the session and only proceeds if `identity.email === normalizedEmail` (the requester owns the email).

3. **If neither**: a confirmation email is sent to the address (never executing the action). An attacker submitting an arbitrary email gets a generic 202 response and the actual email owner receives a confirmation link. The action is never executed without proof.

Rate limiting is also applied: 5 requests per 15 minutes (delete), 8 per 15 minutes (unsubscribe).

**Evidence:** `app/api/user/delete/route.ts:117-165`, `app/api/user/unsubscribe/route.ts:113-161`

---

## 4. No tier-cookie trust

**CONFIRMED — with caveat**

`proxy.ts:323-343` `resolveIdentityEdge()`:

- If a NextAuth JWT exists, tier is read from the signed JWT claims (`aol.tier || token.tier || token.role`). This is server-validated since NextAuth JWTs are signed with `NEXTAUTH_SECRET`.

- If only the `aol_access` cookie is present (no NextAuth JWT), the function hardcodes `tier: "inner_circle"`. This is a fixed ceiling, not a user-controlled value. The cookie itself is HMAC-signed (see `readAccessCookie` in `lib/server/auth/cookies`), so its presence confirms server-issued authentication. The tier is not derived from cookie content.

The tier is never read from user-supplied cookie values. The edge resolver reads from server-signed tokens only.

**Evidence:** `proxy.ts:323-343`, `proxy.ts:1461-1469`

---

## 5. No report access by tier alone

**CONFIRMED**

`pages/inner-circle/reports/[ref].tsx:187-272` (`getServerSideProps`):

1. Requires valid session cookie via `readAccessCookie` (line 205).
2. Validates the session server-side via `getSessionContext(sessionId)` (line 218). Rejects if `!ctx.ok || !ctx.valid`.
3. Calls `assertDiagnosticReportAccess()` (line 234) which enforces **ownership**: the requesting user's `memberId` must match the record's `actor.userId` (see `lib/server/diagnostics/report-engine.ts:285-298`). If no userId match, it falls back to requiring a cryptographically signed action token with matching subject.

Tier alone is insufficient. A user with `inner_circle` tier cannot view another user's report. The `assertDiagnosticReportAccess` function performs identity-based authorization, not tier-based.

**Evidence:** `lib/server/diagnostics/report-engine.ts:277-312`, `pages/inner-circle/reports/[ref].tsx:234-239`

---

## 6. No stale /api/dl bypass

**CONFIRMED**

Two layers of protection:

1. **Proxy-level gate** — `proxy.ts:639-645` `needsInstitutionalSession()` returns `true` for any path starting with `/api/dl/`, requiring an authenticated institutional session before the request reaches the handler.

2. **Route handler tombstone** — `pages/api/dl/[token].ts` returns HTTP 410 Gone with `LEGACY_DOWNLOAD_PATH_DISABLED` for all requests. Even if proxy auth is bypassed, the handler refuses to serve any content.

**Evidence:** `proxy.ts:643`, `pages/api/dl/[token].ts:1-17`

---

## 7. No client bundle IP leakage

**CONFIRMED**

```
node scripts/security/audit-client-bundle-secrets.mjs  →  "Client bundle secret audit passed."
```

The audit script completed successfully with no findings.

**Evidence:** Script output (exit code 0, "passed")

---

## 8. No direct entitlement bypass

**CONFIRMED**

- `app/api/checkout/route.ts` — Accepts `slug`, `email`, and `simulateSuccess` via strict Zod schema (line 23-27, `.strict()`). No `tier` or `entitlement` field is accepted in the request body. In production, returns 308 redirecting to `/api/billing/checkout` (line 88-98). Entitlements are granted server-side via `ensureEntitlementAfterPayment()`, not from user input.

- `pages/api/billing/checkout.ts` (canonical checkout) — Accepts `email`, `priceCode`, `productCode`, etc. Resolves product from server-side catalog SSOT via `resolveProductIdentity()` (line 53). Creates a Stripe checkout session. Entitlements are only granted in the Stripe webhook handler after `constructEvent` verification, not from request body fields.

- `app/api/entitlements/route.ts` — GET-only (read), no POST/PUT. Returns entitlement state based on server-resolved identity. No write endpoint.

- `app/api/executive-reporting/entitlements/route.ts` — Accepts only `email` in the body. Calls `getExecutiveReportingEntitlements(email)` which reads from the database. No entitlement-setting capability via request body.

**Evidence:** `app/api/checkout/route.ts:23-27`, `pages/api/billing/checkout.ts:47-96`, `app/api/entitlements/route.ts:14` (GET only)

---

## 9. CSP headers present

**CONFIRMED**

`proxy.ts:593-609` `setSecurityHeaders()` sets the following headers on every proxied response:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

In production (`process.env.NODE_ENV === "production"`, line 603), a full `Content-Security-Policy` header is set:
```
default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://*.neon.tech https://api.stripe.com https://*.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
```

CSP is production-only (not set in development), which is standard practice.

**Evidence:** `proxy.ts:593-609`

---

## 10. Webhook signature verification

**CONFIRMED**

`pages/api/webhooks/stripe.ts:61-88`:

1. Body parsing is disabled (`config.api.bodyParser: false`, line 23-26).
2. Raw body is read with `buffer(req)` (line 78).
3. `stripe-signature` header is validated for presence (line 73-76).
4. `stripe.webhooks.constructEvent(buf, sig, webhookSecret)` is called at line 83 **before any business logic**.
5. If signature verification fails, the handler returns 400 immediately (line 86-87).
6. All event processing (checkout.session.completed, subscription.deleted, subscription.updated) happens only inside the `try` block after `constructEvent` succeeds (lines 90-270).

**Evidence:** `pages/api/webhooks/stripe.ts:23-88`

---

## Summary

| # | Claim | Status |
|---|-------|--------|
| 1 | No public protected PDFs | CONFIRMED |
| 2 | No raw decision text in emails | CONFIRMED |
| 3 | No arbitrary delete/unsubscribe | CONFIRMED |
| 4 | No tier-cookie trust | CONFIRMED |
| 5 | No report access by tier alone | CONFIRMED |
| 6 | No stale /api/dl bypass | CONFIRMED |
| 7 | No client bundle IP leakage | CONFIRMED |
| 8 | No direct entitlement bypass | CONFIRMED |
| 9 | CSP headers present | CONFIRMED |
| 10 | Webhook signature verification | CONFIRMED |

**Result: 10/10 claims confirmed against source code.**
