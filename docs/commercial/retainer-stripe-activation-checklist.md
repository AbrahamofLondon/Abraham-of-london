# Retainer Stripe Activation Checklist

**Status:** Retainer products are infrastructure-ready but **commercially inactive — pending Stripe product and price IDs**.
**Owner gate:** Activation is an owner-approved commercial decision. Do not activate without explicit owner confirmation of intent and mode.
**Source of truth:** `lib/commercial/catalog.ts` (entries `retainer_core`, `retainer_operational`, `retainer_institutional`).

---

## Why they are inactive

As of this pass, the three retainer tiers carry `stripeProductId: null` and `stripePriceId: null`, `active: false`, and `commercialStatus: "contracted"`. No live checkout or subscription can resolve without real Stripe identifiers. Per platform rule, **no Stripe IDs are invented** to make a product appear live.

The environment's `STRIPE_SECRET_KEY` resolves to **live mode** (`sk_live…`). Creating products against a live account, or flipping `active: true`, is a real commercial action and must not happen without owner confirmation. The Stripe CLI is not installed in this environment; product creation must be done via an authorised operator's Stripe dashboard or SDK.

---

## Products to create in Stripe

Create one **Product** and one **recurring monthly Price** per tier. Suggested naming mirrors the catalog `displayName`.

| Tier code | Stripe product name | Billing interval | Price (amount) | Currency |
|-----------|---------------------|------------------|----------------|----------|
| `retainer_core` | Decision Authority Retainer — Core | monthly (recurring) | _owner-set_ (placeholder) | GBP |
| `retainer_operational` | Decision Authority Retainer — Operational | monthly (recurring) | _owner-set_ (placeholder) | GBP |
| `retainer_institutional` | Decision Authority Retainer — Institutional | monthly (recurring) | _owner-set_ (placeholder) | GBP |

> Amounts are intentionally left as placeholders. The retainer pricing intent in the Institutional Manual (Chapter 21 / Appendix B) is strategic guidance; the actual live monthly price must be confirmed by the owner before the Stripe price is created. `amount` in the catalog is in **pence** (e.g. £5,000/month → `500000`).

---

## Catalog fields to fill per tier

For each activated tier in `lib/commercial/catalog.ts`, set:

- [ ] `stripeProductId` — the real `prod_…` ID from Stripe (currently `null`)
- [ ] `stripePriceId` — the real `price_…` recurring monthly ID from Stripe (currently `null`)
- [ ] `amount` — monthly price in pence (currently `0`)
- [ ] `displayPrice` — human-readable (e.g. `"£5,000/month"`) (currently `"Contracted monthly"`)
- [ ] `active` — set to `true` **only** once `stripeProductId` and `stripePriceId` are both populated and verified
- [ ] Confirm `duration: "monthly"` and `accessType: "subscription"` remain correct
- [ ] Decide `commercialStatus`: keep `"contracted"` if onboarding stays contract-only (no public self-serve checkout), or switch to `"paid"` + `requiresCheckout: true` only if self-serve subscription checkout is intended

**Guardrail:** `checkCheckoutEligibility()` and `isCheckoutAvailable()` in `catalog.ts` already refuse to sell a product whose `active` is false or whose status is `contracted`/`inactive`. Do not weaken those guards to force activation.

---

## Verification after activation

- [ ] `pnpm typecheck` — catalog still type-checks
- [ ] Catalog integrity assertions pass (`assertActiveProductsHavePriceIds`, `assertNoDeadCheckoutProducts`, `assertNoDuplicateProductCodes`)
- [ ] `pnpm doctrine:audit` and `pnpm surfaces:audit` pass
- [ ] Stripe test event / webhook resolves the new `price_…` to the correct catalog entry via `getProductByStripePriceId()`
- [ ] Owner sign-off recorded before the change is merged and deployed (Netlify/main)

---

## Inner Circle (separate, not in scope here)

`inner_circle` remains `active: false` / `commercialStatus: "inactive"`. Reactivation is a distinct commercial decision and is **not** covered by this checklist. Do not reactivate it as a side effect of retainer activation.
