# Free Product Stripe Policy

> Date: 2026-05-09

---

## Policy

| Product Type | Stripe Price ID | Requires Checkout |
|-------------|:--------------:|:-----------------:|
| Free public product | null | No |
| Free gated product | null (use entitlement/access gate) | No |
| Zero-price Stripe checkout | Only if explicitly justified and documented | Documented exception |

---

## Changes Made

| Product | Before | After | Reason |
|---------|--------|-------|--------|
| case_dossier_tariff_shock | `stripePriceId: "price_1TP1lhQFpelVFMXJN4xf1yxW"` | `stripePriceId: null` | Free products do not require Stripe checkout |
| case_dossier_team_alignment | `stripePriceId: "price_1TP1nMQFpelVFMXJukt9E22Z"` | `stripePriceId: null` | Same |
| case_dossier_escalation_denied | `stripePriceId: "price_1TP1omQFpelVFMXJtUTNXdkc"` | `stripePriceId: null` | Same |

All three remain `active: true`, `amount: 0`, `accessType: "free"`. Access is through entitlement/content gates, not Stripe checkout.
