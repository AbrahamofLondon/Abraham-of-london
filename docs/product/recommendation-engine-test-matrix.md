# Recommendation Engine Test Matrix

> Date: 2026-05-09
> Engine: lib/commercial/recommendation-engine.ts

---

## Test Scenarios

| # | User State | Input Evidence | Expected Recommendation | Suppressed | CTA | Risk |
|---|-----------|---------------|------------------------|-----------|-----|------|
| 1 | Vague decision, unclear owner, low consequence | authorityGap: false, ownershipGap: true, consequenceHigh: false | mandate_clarity_framework | PDA, ER | "Mandate Clarity Framework" | Low — appropriate for vague cases |
| 2 | Clear decision, no owner | authorityGap: true, ownershipGap: true | mandate_clarity_framework | — | "Mandate Clarity Framework" | Low |
| 3 | Clear owner, high consequence | authorityGap: false, consequenceHigh: true | decision_exposure_instrument | mandate_clarity | "Decision Exposure Instrument" | Low — prices the consequence |
| 4 | High competing obligation | competingObligationDominant: true | personal_decision_audit | — | "Start Personal Decision Audit" | MEDIUM — PDA is inactive, card shows "Preparing for release" |
| 5 | Weak decision integrity | weakestDomain: "decision" | personal_decision_audit | — | "Start Personal Decision Audit" | Same as #4 |
| 6 | Execution blocker | executionBlocked: true, authorityGap: false | intervention_path_selector (if available) or fall through | — | varies | Low |
| 7 | Repeated contradiction | authorityGap: true, interventionUnclear: true | operator_decision_pack (bundle) | singles | "Operator Decision Pack" | Low — bundle appropriate |
| 8 | High financial exposure | consequenceHigh: true, institutionalStakes: true | decision_exposure_instrument or executive_reporting | — | varies | Low |
| 9 | Already entitled to recommended product | any | Same recommendation but card shows "Open instrument" | — | "Open instrument" | MUST verify entitlement check |
| 10 | Recommended inactive product (PDA) | competingObligationDominant: true | personal_decision_audit | — | "Preparing for release" | Card must show inactive state, NOT checkout |
| 11 | Recommended contracted product | executionReady: true, then escalate to retainer | retainer not recommended by engine | — | — | N/A — engine doesn't recommend retainers |
| 12 | No evidence at all | all false/null | personal_decision_audit (evidenceInsufficient fallback) | — | "Start Personal Decision Audit" | Appropriate — deepen evidence |

---

## Suppression Rules

| Product | Suppressed When | Reason |
|---------|----------------|--------|
| Any inactive product | `product.active === false` | Card shows "Preparing for release" |
| Any contracted product | `isContractedProduct()` | Card shows "Request retained oversight" |
| Products without Stripe ID | `!product.stripePriceId` | No checkout button shown |
| Retainer products | Never recommended by engine | Only reached through oversight pathway |

---

## Card State Matrix

| Product State | CTA Shown | Checkout Available |
|--------------|-----------|-------------------|
| active + paid + Stripe | "CTA — £price" | Yes |
| active + free | "Start now" link | N/A |
| inactive + paid | "Preparing for release — £price" | No |
| contracted | "Request retained oversight" | No |
| missing Stripe | "CTA" link (no price) | No |
