# Team Assessment & Enterprise Assessment — Commercial Access Decision Record

**Date:** 2026-06-08  
**Status:** REVISED — 2026-06-08 (adoption-first revision)  
**Decision by:** Commercial Truth Audit — Team/Enterprise Access Revision Pass

---

## Decision: Both are `free_controlled` (revised from `manual_billing`)

### Strategic rationale

The immediate market priority is adoption, qualifying data, external validation, and efficacy proof. These assessments should reduce friction and generate evidence, not act as early payment gates.

Reclassifying both from `manual_billing` to `free_controlled` removes the enquiry barrier entirely. Access is open. The tool generates the evidence. Paid routes (Executive Reporting, Strategy Room, Retainer Review) are the correct conversion points — not the assessment intake.

---

### Team Assessment

| Field | Value |
|---|---|
| `commercialStatus` | `free_controlled` |
| `requiresCheckout` | `false` |
| `displayPrice` | `"Free"` |
| Stripe IDs required | No |
| CTA label | `"Start Team Assessment"` |
| Route | `/diagnostics/team-assessment` |
| Access mode | `free_public` |
| Purpose | Collect team alignment evidence |

**Next paid routes:** Executive Reporting → Strategy Room → Enterprise Assessment

**What the user receives:** A structured divergence reading across respondents — decision framing, ownership, evidence position, and readiness.

---

### Enterprise Assessment

| Field | Value |
|---|---|
| `commercialStatus` | `free_controlled` |
| `requiresCheckout` | `false` |
| `displayPrice` | `"Free"` |
| Stripe IDs required | No |
| CTA label | `"Start Enterprise Assessment"` |
| Route | `/diagnostics/enterprise-assessment` |
| Access mode | `free_public` |
| Purpose | Qualify organisational readiness, authority gaps, dependencies, and oversight potential |

**Next paid routes:** Executive Reporting → Strategy Room → Retainer Review

**What the user receives:** A structural organisational reading — authority, evidence, dependency, and escalation exposure.

---

## What was ruled out

### `evidence_gated`

Rejected. These are the first corridor stages — there is no prior record prerequisite. They generate the evidence; they cannot require it.

### `paid_checkout`

Rejected. No Stripe product IDs or price IDs exist. No checkout flow, entitlement model, or fulfilment path. If a future decision is made to gate these behind payment, requires:

1. Creating Stripe products and prices
2. Adding `stripeProductId` and `stripePriceId` to the catalog
3. Building checkout flow (success/cancel routes)
4. Entitlement grant on payment
5. Admin visibility of purchased assessment state
6. Tests covering the payment path

### `manual_billing` (prior decision — now revised)

Was assigned 2026-06-08. Revised same day. Rationale: `manual_billing` implies an operator review step before access is granted ("By enquiry"). The strategic goal at this stage is adoption and evidence collection — not a manual gating step that adds friction before any assessment data exists.

**Do not display:** "By enquiry", "Paid £0", or any price-implying label for these products.

---

## UI implications

- Label: `"Free controlled assessment"` / `"Free organisational assessment"`
- Status badge: `"Free"` (no amber, no paid styling)
- CTA: `"Start Team Assessment"` / `"Start Enterprise Assessment"`
- No checkout button
- No Stripe flow
- Routes directly to `/diagnostics/team-assessment` and `/diagnostics/enterprise-assessment`

---

## If the decision changes

To move either assessment to `paid_checkout` in future:

1. Update `commercialStatus: "paid"` and `requiresCheckout: true` in catalog
2. Add `stripeProductId` and `stripePriceId`
3. Update `hiddenFromPricing: false` and remove `hiddenReason`
4. Build checkout + entitlement flow
5. Update this record with the date and owner

To move either assessment to `manual_billing` in future (operator review gate):

1. Update `commercialStatus: "manual_billing"` in catalog
2. Update `displayPrice: "By enquiry"`
3. Update CTA copy to `"Request..."` pattern
4. Update this record with the date, owner, and rationale for reintroducing the friction

---

## Boardroom Mode — supplemental decision (P3)

**Decision:** Option A — Add to catalog as `evidence_gated`. (Unchanged.)

| Field | Value |
|---|---|
| `commercialStatus` | `evidence_gated` |
| `requiresCheckout` | `false` |
| Stripe IDs required | No |
| CTA label | `"View Boardroom Mode"` |
| Route | `/boardroom-mode` |
| Prerequisite | Executive Reporting or governed case record |

**Rationale:** Boardroom Mode is Stage 4 and does require a prior governed record. `evidence_gated` is correct and unchanged.
