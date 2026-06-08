# Team Assessment & Enterprise Assessment — Commercial Access Decision Record

**Date:** 2026-06-08
**Status:** DECIDED
**Decision by:** Commercial Truth Audit — P1 (48-Surface Zero-Fail Closure Pass)

---

## Background

Team Assessment and Enterprise Assessment appeared in the product surface registry with `[FAIL] commercial: paid/free status unclear` and no Stripe references. In a prior audit pass, they were assigned `commercialStatus: "evidence_gated"` — but this was an agent assumption, not a deliberate strategic decision.

This record makes the strategic decision explicit.

---

## Decision: Both are `manual_billing` (Option C)

### Team Assessment

| Field | Value |
|---|---|
| `commercialStatus` | `manual_billing` |
| `requiresCheckout` | `false` |
| Stripe IDs required | No |
| CTA label | "Request Team Assessment" |
| Route | `/diagnostics/team-assessment` |
| Access mode | `manual_billing` → routes to `/contact` |

**Rationale:** Team Assessment is an early corridor stage — it IS the evidence-gathering activity. It does not require prior evidence to START; it generates the evidence. Classification as `evidence_gated` was incorrect. No Stripe checkout is available or appropriate. Access is by enquiry only. The route `/diagnostics/team-assessment` exists and explains what the assessment produces.

**What the user receives:** A structured divergence reading across respondents — decision framing, ownership, evidence position, and readiness. Not a digital product with a payment path.

**Next admissible move:** Team Assessment → Enterprise Assessment → Executive Reporting.

---

### Enterprise Assessment

| Field | Value |
|---|---|
| `commercialStatus` | `manual_billing` |
| `requiresCheckout` | `false` |
| Stripe IDs required | No |
| CTA label | "Request Enterprise Assessment" |
| Route | `/diagnostics/enterprise-assessment` |
| Access mode | `manual_billing` → routes to `/contact` |

**Rationale:** Enterprise Assessment is an enterprise-pathway corridor stage. It has API routes (`/api/diagnostics/enterprise`, `/api/enterprise/campaigns/[id]`) and admin visibility (`/admin/enterprise-foundation`, `/admin/enterprise-pipeline`). It does not have a Stripe checkout path. Access is by enterprise enquiry only. It is not a free public tool — it is a structured enterprise scan run by or with Abraham of London operators.

**What the user receives:** A structural organisational reading — authority, evidence, dependency, and escalation exposure. Produces an enterprise scan record that gates access to Executive Reporting.

**Next admissible move:** Enterprise Assessment → Executive Reporting → Strategy Room.

---

## What was ruled out

### Option A — `evidence_gated`

Rejected. `evidence_gated` means the user needs a prior case/diagnostic record before they can access this stage. Team Assessment and Enterprise Assessment are the first stages — there is no "prior record" prerequisite. They are the prerequisite for later stages, not a gated outcome of earlier stages.

### Option B — `paid_checkout`

Rejected. Neither product has Stripe product IDs or price IDs. Neither has an entitlement model, a checkout success route, or a payment-to-access fulfillment path. Adding checkout would require Stripe product creation, entitlement wiring, and fulfilment logic — none of which exist. If a future owner decides to make these self-serve paid products, that requires:

1. Creating Stripe products and prices
2. Adding `stripeProductId` and `stripePriceId` to the catalog
3. Building a checkout flow (success/cancel routes)
4. Adding entitlement grant on payment
5. Adding admin visibility of purchased assessment state
6. Adding tests covering the payment path

Until those steps are done, `paid_checkout` is false and misleading.

### Option D — `free_public`

Rejected. These are not free tools. They are operator-led engagements with structured output. Labelling them free would misrepresent the commercial relationship.

---

## UI implications

- Label: `"By enquiry"` on product directory
- Status badge: `"By enquiry"` (amber)
- CTA: `"Request Team Assessment"` / `"Request Enterprise Assessment"`
- No checkout button
- No price shown beyond `"By enquiry"`
- Routes to `/contact` via the resolver

---

## If the decision changes

To move either assessment to `paid_checkout` in future:

1. Update `commercialStatus: "paid"` and `requiresCheckout: true` in catalog
2. Add `stripeProductId` and `stripePriceId`
3. Update `hiddenFromPricing: false` and remove `hiddenReason`
4. Build checkout + entitlement flow
5. Update this record with the date and owner

---

## Boardroom Mode — supplemental decision (P3)

**Decision:** Option A — Add to catalog as `evidence_gated`.

| Field | Value |
|---|---|
| `commercialStatus` | `evidence_gated` |
| `requiresCheckout` | `false` |
| Stripe IDs required | No |
| CTA label | "View Boardroom Mode" |
| Route | `/boardroom-mode` |
| Prerequisite | Executive Reporting or governed case record |

**Rationale:** Boardroom Mode is a distinct corridor stage (Stage 4) that requires a prior governed record. Adding it to the catalog as `evidence_gated` makes the commercial intent explicit, closes the `NEEDS_DECISION` gap in the prior audit, and allows the resolver and audit to handle it correctly. It is not a self-serve paid product — access opens when a qualifying governed record is confirmed.
