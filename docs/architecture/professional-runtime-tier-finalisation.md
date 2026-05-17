# Professional Runtime Tier Finalisation

**Date:** 2026-05-17  
**Status:** Implemented (updated 2026-05-17 — subscription cancellation hardening)  
**Scope:** `lib/access/`, `prisma/schema.prisma`, `pages/api/webhooks/stripe.ts`, `lib/commercial/`

---

## Summary

The legacy `inner_circle` DB value is replaced at runtime by the canonical `professional` tier. This document records what changed, why, and the compatibility rules that must be preserved.

---

## Problem

The Stripe product "Professional" (formerly "Inner Circle") was onboarded before the access-tier vocabulary was finalised. As a result:

- The Stripe webhook wrote `inner_circle` to `InnerCircleMember.tier` regardless of which product was purchased
- The `professional` string was not in `TIER_ORDER`, `TIER_ALIASES`, or the Prisma enum — so it fell through to `"public"` (wrong)
- User-facing labels showed "Inner Circle" for paid users even after the product was renamed to "Professional"

---

## What Changed

### `lib/access/tier-policy.ts`

- Added `"professional"` to `TIER_ORDER` at position 2 (before `inner_circle`)
- Added `professional: 2` to `TIER_HIERARCHY` (same rank as `inner_circle` — legacy parity)
- Added `professional: "Professional"` to `TIER_LABELS`; updated `inner_circle` label to `"Professional"` (both show the same label)
- Added `professional: "professional"` and `pro: "professional"` to `TIER_ALIASES`
- Added `normalizeRuntimeTier(tier)`: maps `inner_circle → professional`, all others pass through unchanged

### `lib/access/tier.ts` (hyphenated legacy system)

- Added `professional: 2` to `TIER_RANK`
- Added `professional: "professional"` and `pro: "professional"` to `TIER_ALIASES`
- Added `"professional"` to `ALL_TIERS`

### `lib/access/types.ts`

- Added `"professional"` to the `AccessTier` union type

### `lib/access/tiers.ts`

- Re-exports `normalizeRuntimeTier` from `tier-policy.ts`

### `lib/access/db-tier-mapper.ts`

- Added `"professional"` to `DbAccessTier` union

### `prisma/schema.prisma`

- Added `professional` to the `AccessTier` enum (before `inner_circle`)

### Migration

- `prisma/migrations/20260517_add_professional_access_tier/migration.sql`
- `ALTER TYPE "AccessTier" ADD VALUE IF NOT EXISTS 'professional' BEFORE 'inner_circle';`

### `pages/api/webhooks/stripe.ts`

- `mapStripeTierToAccessTier`: changed `premium → "professional"`, `pro → "professional"`, added explicit `professional → "professional"` mapping
- `customer.subscription.updated` handler: changed hardcoded `tier: "inner_circle"` to `tier: "professional"`
- Removed all `C1_UNRESOLVED_APP_TO_DB_TIER` comments (the migration is now done)

---

## Compatibility Rules

| Rule | Detail |
|------|--------|
| **Existing `inner_circle` DB rows remain valid** | `inner_circle` stays in the Prisma enum and `TIER_ORDER`. No data migration required. |
| **`inner_circle` normalises to `professional` at runtime** | Call `normalizeRuntimeTier(tier)` when displaying tier labels or driving UI gates. Do not call it for raw DB writes. |
| **DB writes use `professional` going forward** | New subscriptions via Stripe webhook write `professional`. Old rows remain `inner_circle` until optionally migrated. |
| **Access rank parity** | `TIER_HIERARCHY.professional === TIER_HIERARCHY.inner_circle === 2`. `hasAccess("inner_circle", "professional")` returns `true`. |
| **Legacy `inner_circle` product stays inactive** | `CATALOG.inner_circle.active === false`. Do not reactivate. |
| **Feature entitlement slugs unchanged** | `tier.professional` entitlement slug predates this change and remains correct. |
| **Subscription cancellation** | Downgraded users get `tier: "member"` — unchanged. |

---

## Access Ladder (post-migration)

```
public (0)
member (1)
professional (2)  ← canonical paid tier
inner_circle (2)  ← legacy DB value, same rank
restricted (3)
client (4)
legacy (5)
architect (6)
owner (7)
top_secret (8)
```

---

## Test Coverage

- `lib/access/professional-tier.test.ts` — backward compat + gate logic (37 tests)
- `lib/commercial/professional-tier-invariants.test.ts` — catalogue invariants (14 tests)
- `lib/commercial/professional-subscription-lifecycle.test.ts` — lifecycle tests (33 tests)

---

## Professional Access: Two-Part Grant Model

**Both must be granted on successful payment. Both must be revoked on cancellation. Runtime downgrade alone is insufficient.**

### Grant path (`checkout.session.completed`)

1. `InnerCircleMember.tier` is set to `"professional"` via `mapStripeTierToAccessTier(rawTier)`.
2. `ClientEntitlement` row is created/updated: `productCode = "tier.professional"`, `status = "active"`, `endsAt = null` via `ensureEntitlementAfterPayment`.

Metadata resolution order (most specific first):
```
session.metadata.tier          // "professional" from modern checkout
session.metadata.membershipTier // legacy
session.metadata.plan           // legacy
"premium"                       // fallback for very old Stripe sessions
```

### Revocation path (`customer.subscription.deleted`)

1. `InnerCircleMember.tier` is downgraded to `"member"`.
2. `revokeCanonicalEntitlement({ slug: "tier.professional", ... })` is called, setting `ClientEntitlement.status = "cancelled"` and `endsAt = now()`.

A subscription is identified as Professional by price ID (derived from `CATALOG.professional.stripePriceId` and `CATALOG.professional_annual.stripePriceId`). Fallback: if the member's current tier is `professional` or `inner_circle`, also revoke — guards against metadata gaps.

### Why runtime downgrade alone is insufficient

`resolveCanonicalEntitlement` reads `ClientEntitlement` rows with `status: "active"` and `endsAt: null OR endsAt > now()`. A cancelled user with `InnerCircleMember.tier = "member"` but an active `ClientEntitlement` row for `tier.professional` would still be granted Professional features by any code that calls `resolveCanonicalEntitlement` without also checking the member's tier field.

### Trial

Professional trial uses `ClientEntitlement.status = "trial"`. `resolveCanonicalEntitlement` queries only `status: "active"` — expired trials are already blocked at the DB query level. `hasProfessionalAccess()` additionally checks `getTrialInfo().status === "ACTIVE"`, which returns `false` once `endsAt` has passed.

---

## Subscription Cancellation Changes (2026-05-17 update)

### `pages/api/webhooks/stripe.ts`

- Added `PROFESSIONAL_PRICE_IDS` set (derived from `CATALOG.professional.stripePriceId` and `CATALOG.professional_annual.stripePriceId`)
- Added `PROFESSIONAL_ENTITLEMENT_SLUG` constant (`= CATALOG.professional.entitlementSlug`)
- `customer.subscription.deleted`: now calls `revokeCanonicalEntitlement` after runtime tier downgrade
- Revocation applies when: price ID matches Professional, OR member's current tier is `professional`/`inner_circle`
- Audit log includes `priceId`, `isProfessionalSubscription`, `entitlementRevoked`

### `lib/commercial/entitlement-authority.ts`

- Added `revokeCanonicalEntitlement(input)`: exported function
  - `updateMany` where `email = key`, `productCode = slug`, `status = "active"`
  - Sets `status = "cancelled"`, `endsAt = now()`
  - Clears in-memory cache entry
  - Returns `{ revoked: boolean, count: number }`
  - Safe on DB failure (logs error, returns `{ revoked: false, count: 0 }`)

---

## What Was Not Changed

- Legacy Inner Circle routes (`/inner-circle/*`) — not removed; require explicit confirmation
- `InnerCircleMember` model name — unchanged (data model name, not user-facing)
- Entitlement slug `"tier.professional"` — already canonical, no change
- `CATALOG.inner_circle` record — preserved as `inactive`, not deleted
