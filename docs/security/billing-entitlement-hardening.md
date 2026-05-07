# Billing Entitlement Hardening

**Updated:** 2026-05-07
**Status:** CLOSED — launch-safe

## Scope

- `app/api/checkout/route.ts`
- `pages/api/billing/checkout.ts`
- `pages/api/billing/webhook.ts`
- `lib/commercial/payment-verification.ts`
- `lib/commercial/entitlement-authority.ts`
- `lib/commercial/catalog.ts`
- `app/api/downloads/[slug]/route.ts`
- `lib/assets/pdf-access.ts`
- `lib/assets/pdf-delivery.ts`

---

## Controls Verified

### 1. Stripe signature verified

**Status: PASS**

- `pages/api/billing/webhook.ts` line 80: `stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)` — Stripe cryptographic signature verification BEFORE any processing.
- Raw body via `micro.buffer()` with `bodyParser: false` — ensures signature matches exact payload.
- Missing/invalid signature returns 400 immediately.

### 2. Idempotency enforced (replayed webhook does not duplicate grant)

**Status: PASS**

- `grantCanonicalEntitlement()` (entitlement-authority.ts:284) checks for existing active entitlement BEFORE creating.
- If entitlement already exists with same email + productCode + status="active", it updates (idempotent) rather than creating a duplicate.
- `ensureEntitlementAfterPayment()` performs the same idempotent check as a repair mechanism.
- Stripe `session.id` is stored as `externalRef` for audit trail.

### 3. Client cannot set price

**Status: PASS**

- `pages/api/billing/checkout.ts`: Product resolved server-side from catalog SSOT via `resolveProductIdentity()`.
- Stripe Checkout Session created with `price` from `product.stripe.priceId` — hardcoded in `lib/commercial/catalog.ts`.
- Client supplies only a product identifier (slug/code/contentId) — never an amount or price ID.
- `app/api/checkout/route.ts` redirects to canonical checkout in production.

### 4. Client cannot set entitlement

**Status: PASS**

- Entitlements are granted ONLY via:
  - `grantCanonicalEntitlement()` called from webhook handler after verified Stripe event.
  - `ensureEntitlementAfterPayment()` which first verifies Stripe session payment_status === "paid".
- No public API accepts entitlement grants from client.
- Product code from webhook comes from `session.metadata.productCode` which was set server-side during checkout creation.

### 5. Payment required before entitlement

**Status: PASS**

- Webhook handler processes `checkout.session.completed` — Stripe only fires this after successful payment.
- `ensureEntitlementAfterPayment()` explicitly checks `payment_status === "paid"` and rejects non-production simulated sessions.
- Do-Not-Sell gate (`checkDoNotSellGate()`) blocks checkout if diagnostic prerequisites are not met.

### 6. Replayed webhook does not duplicate grant

**Status: PASS** (same as #2)

- Entitlement authority uses find-first + update-or-create pattern.
- Same email + productCode + active status → update (no duplication).
- `accessAuditLog` records each completion for forensics even on replay.

### 7. Downloads require entitlement

**Status: PASS**

- `app/api/downloads/[slug]/route.ts`: 
  - Resolves user identity via `resolveIdentity(req)`.
  - Checks entitlement via `resolveCanonicalEntitlement()`.
  - Calls `resolvePdfDelivery(user, asset)` which enforces access control.
  - If `!delivery.allowed` → returns 401 (unauthenticated) or 403 (no entitlement).
  - Path traversal prevented: `!absolutePath.startsWith(allowedRoot + path.sep)` check.
- `lib/assets/pdf-access.ts`: `canAccessPdfAsset()` enforces tier/entitlement requirements by asset access level.

---

## Smoke Test Coverage

The red-team smoke test (`scripts/security/red-team-smoke.mjs`) now covers:

| Test | What it proves |
|---|---|
| `checkout-product-tamper` | Invalid product code returns 400 |
| `download-without-entitlement` | Unauthenticated download returns 401/403 |

Additional integration tests in `lib/commercial/monetisation.test.ts`:
- Paid asset purchase flow → entitlement → delivery
- Payment entitlement repair flow
- Tier-aware pricing verification
- Canonical entitlement winner selection

---

## Residual Notes

- Stripe webhook does not use a dedicated "processed events" table for deduplication. Instead, it relies on the entitlement authority's idempotent find-or-update pattern. This is functionally equivalent for preventing duplicate grants, though not as explicit as a processed-events ledger.
- This is acceptable for controlled launch. A dedicated processed-events table can be added as a hardening enhancement post-launch if webhook volume warrants it.
