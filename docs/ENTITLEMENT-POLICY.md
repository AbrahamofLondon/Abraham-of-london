# Entitlement Policy — Single Source of Truth

Last updated: 2026-04-22 (catalog-normalised)

## Commercial Catalog SSOT

All product identity lives in `lib/commercial/catalog.ts`.
Checkout, webhook, admin, and access resolution all read from the catalog.
No inline price definitions. No env var price IDs for product routing.

---

## Authority Model

```
ClientEntitlement (DB, email-based) = ONLY durable authority
Commercial cookie = short-term convenience (24h)
In-memory cache = session-only fallback (NOT counted as success)
```

---

## Per-Product Entitlement Policy

| Product | Price | Duration | Entitlement Key (productCode) | Access Tier | Cookie |
|---------|-------|----------|-------------------------------|-------------|--------|
| Decision Exposure Instrument | £29 | Lifetime | `decision-exposure-instrument` | Email entitlement | None |
| Mandate Clarity Framework | £49 | Lifetime | `mandate-clarity-framework` | Email entitlement | None |
| Intervention Path Selector | £79 | Lifetime | `intervention-path-selector` | Email entitlement | None |
| Operator Decision Pack | £129 | Lifetime (3 instruments) | All 3 instrument slugs | Email entitlement | None |
| Executive Reporting | £95 | Lifetime | `assessment.executive_reporting` | Email entitlement | `aol_paid_executive_reporting` (24h) |
| Strategy Room | £395 | Lifetime | `strategy-room.entry` | Email entitlement | `aol_paid_strategy_room` (24h) |
| GMI Report Q1 2026 | £59 | Lifetime | `global-market-intelligence-report-q1-2026` | Email entitlement | None |

**All one-time purchases grant lifetime access.** No expiration (`endsAt: null`).

---

## Inline Tier Labels (Checkout Metadata)

These tiers appear in Stripe checkout metadata. They are **routing labels**, not access tier enum values:

| Tier Label | Meaning | Maps To |
|-----------|---------|---------|
| `one-time-executive-reporting` | Executive Reporting purchase | Email entitlement for `assessment.executive_reporting` |
| `one-time-strategy-room` | Strategy Room purchase | Email entitlement for `strategy-room.entry` |
| `decision-instrument` | Any instrument purchase | Email entitlement for specific slug |
| `premium-report` | GMI or similar report | Email entitlement for specific slug |
| `report-basic` | Diagnostic report basic | Email entitlement for `diagnostic_report_basic` |
| `report-pro` | Diagnostic report pro | Email entitlement for `diagnostic_report_pro` |

**These are NOT access tier enum values.** The `AccessTier` enum (`public < member < inner_circle < client < ...`) governs tier-based automatic access. Product purchases resolve through email-based `ClientEntitlement`, not tier.

---

## Grant Flow

```
1. User pays via Stripe
2. Stripe fires checkout.session.completed webhook
3. Webhook handler creates/updates ClientEntitlement (email, productCode, source="stripe")
4. On checkout return, getServerSideProps verifies with Stripe + grants entitlement (repair path)
5. Commercial cookie set for immediate re-entry (24h, ER + SR only)
6. All subsequent access resolves via resolveCanonicalEntitlement(email, slug)
```

---

## Recovery

| Scenario | Handling |
|----------|---------|
| Webhook fails | Checkout return calls `ensureEntitlementAfterPayment()` as repair |
| DB write fails on grant | Logged to `FailedEntitlementGrant` table. Admin can resolve manually. |
| Cookie expires | DB entitlement is durable fallback |
| Memory-only grant | Marked `verified: false`. Not treated as success. |

---

## Access Resolution Order

1. **Cookie** (ER + SR only, 24h, HMAC-signed) — fast path
2. **DB ClientEntitlement** (email-based, permanent) — durable truth
3. **DB Entitlement** (userId-based, legacy) — backward compat
4. **Tier** (user tier >= required tier) — automatic access for inner circle members
5. **Memory cache** — session-only, `verified: false`

---

## Security

- Simulated/test session IDs blocked in production
- Cookie signature: HMAC-SHA256 with `COMMERCIAL_COOKIE_SECRET`
- Stripe webhook signature verified before processing
- No entitlement grant without verifiable payment source
