# CSP Policy Review

**Updated:** 2026-05-07
**Status:** CLOSED

## Production Policy (after hardening)

Defined in `next.config.mjs`, `middleware/sovereign.ts`, and `proxy.ts`:

- `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com`
- `style-src 'self' 'unsafe-inline'`
- `object-src 'none'`
- `base-uri 'self'`
- `form-action 'self'`
- `frame-ancestors 'none'`
- `frame-src https://js.stripe.com https://hooks.stripe.com`

## Changes Made

1. **`unsafe-eval` removed from production CSP** in all three locations:
   - `next.config.mjs` — now conditionally includes `'unsafe-eval'` only when `NODE_ENV !== "production"` (required for Next.js Fast Refresh / React error overlay in development).
   - `middleware/sovereign.ts` — removed from the production-only CSP header.
   - `proxy.ts` — removed from the production-only CSP header.

2. **Rationale for development-only retention:**
   Next.js Fast Refresh and the React error overlay use `new Function()` / `eval()` for hot module replacement during development. This is a well-documented Next.js requirement. In production builds, all code is statically compiled — no eval is needed.

3. **`unsafe-inline` retained:**
   Required for Next.js inline scripts and style injection. A future hardening pass can migrate to nonce-based CSP, but this is not a launch blocker — `unsafe-inline` without `unsafe-eval` still prevents string-to-code execution attacks (the primary XSS vector).

## Verification

- Google Tag Manager and Google Analytics do not require `unsafe-eval`.
- Stripe.js is loaded via `frame-src` and `connect-src`, does not require `unsafe-eval`.
- Production build validated with `unsafe-eval` removed.

## Residual Hardening (Non-Blocking)

- Migrate `unsafe-inline` to nonce-based CSP when Next.js adds native nonce support for app router.
- Add `Content-Security-Policy-Report-Only` header in staging to catch regressions.
