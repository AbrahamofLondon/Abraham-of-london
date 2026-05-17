# Professional Runtime Tier Finalisation

**Date:** 2026-05-17  
**Status:** Implemented  
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

---

## What Was Not Changed

- Legacy Inner Circle routes (`/inner-circle/*`) — not removed; require explicit confirmation
- `InnerCircleMember` model name — unchanged (data model name, not user-facing)
- Entitlement slug `"tier.professional"` — already canonical, no change
- `CATALOG.inner_circle` record — preserved as `inactive`, not deleted
