# Commercial Catalog and Checkout Inventory

Scope owned by Agent B: `lib/commercial/`, `components/commercial/`, `pages/checkout/`, `pages/api/billing/`, `pages/api/checkout/`, `app/api/`.

No product code was edited. This inventory is an audit snapshot of catalog identity, checkout availability, Stripe IDs, public surfaces, and route dependencies.

## Route Dependencies

| Surface | Route/File | Dependency | Status |
|---|---|---|---|
| Canonical catalog checkout | `pages/api/billing/checkout.ts` | `resolveProductIdentity()`, `checkCheckoutEligibility()`, `resolveEntitlementSlugs()`, Stripe Checkout | Active canonical checkout for catalog products. |
| Billing webhook | `pages/api/billing/webhook.ts` | `resolveProductCode()`, `getProductByStripePriceId()`, entitlement grant/sync | Active webhook for catalog checkout metadata. |
| Legacy Stripe webhook | `pages/api/webhooks/stripe.ts` | Catalog-derived Professional price IDs plus metadata slug/productCode | Still present; overlaps billing webhook responsibility. |
| App Stripe webhook | `app/api/stripe/webhook/route.ts` | `resolveProductCode()` from metadata | Present for paid Executive Report generation; overlaps Stripe webhook surface. |
| Checkout button | `components/commercial/CheckoutButton.tsx` | `POST /api/billing/checkout` with `productCode` and `priceCode` equal to catalog code | Active shared UI checkout path. |
| PDF/development checkout | `app/api/checkout/route.ts` | PDF asset identity/pricing; production returns 308 to `/api/billing/checkout` | Not a full catalog checkout route in production. |
| Living Case checkout | `app/api/checkout/living-case/route.ts` | `COMMERCIAL_LADDER`; mock session URL, no Stripe session creation | Active non-catalog architecture for Living Case tiers. |
| Living Case confirmation | `app/api/checkout/living-case-confirm/route.ts` | In-memory entitlement/fulfilment stores | Active non-catalog confirmation route. |
| Decision Failure Brief checkout | `pages/api/checkout/decision-failure-brief.ts` | Retired; points to `/api/checkout/living-case` | Returns 410 Gone. |
| Decision Failure Brief confirm | `pages/api/checkout/decision-failure-brief-confirm.ts` | Retired; points to `/api/checkout/living-case-confirm` | Returns 410 Gone. |
| Personal Decision Audit checkout page | `pages/checkout/personal-decision-audit.tsx` | Calls `POST /api/checkout` with slug only, no email | Stale for production; canonical checkout requires `/api/billing/checkout` with email. |

## Inventory Table

`priceExists` means the catalog row has a displayable commercial price or amount. `stripePriceId?` and `stripeProductId?` are listed independently because some manual/free/contracted products have no Stripe ID. For self-serve catalog checkout, the effective price code is the `productCode`.

| productCode | label | catalogExists | priceExists | stripePriceId? | stripeProductId? | checkoutAvailable | checkoutRoute? | productRoute? | appearsOnPricing | appearsOnProducts | appearsOnHomepage | issue |
|---|---:|:---:|:---:|---|---|:---:|---|---|:---:|:---:|:---:|---|
| fast_diagnostic | Fast Diagnostic | YES | YES |  |  | NO |  | `/diagnostics/fast` | YES | NO | NO | MISSING_PRODUCTS_SURFACE |
| boardroom_brief | Boardroom Brief | YES | YES | `price_1TddfeQFpelVFMXJWuTH7bB2` | `prod_UctSn3zRH48xmw` | YES | `/api/billing/checkout` | `/boardroom-brief` | NO | YES | NO | MISSING_PRICING_SURFACE |
| personal_decision_audit | Personal Decision Audit / Purpose Alignment | YES | YES | `price_1TVbW8QFpelVFMXJzLrIQJu1` | `prod_UUahB8wv21HWQt` | YES | `/api/billing/checkout`; stale page at `/checkout/personal-decision-audit` | `/diagnostics/purpose-alignment` | YES | YES | NO | UNKNOWN |
| decision_exposure_instrument | Decision Exposure Instrument | YES | YES | `price_1TP1XIQFpelVFMXJ35YurntT` | `prod_SRLlGzqV6k3dDH` | YES | `/api/billing/checkout` | `/decision-instruments/decision-exposure-instrument/start` | YES | YES | NO | NONE |
| mandate_clarity_framework | Mandate Clarity Framework | YES | YES | `price_1TP1ZaQFpelVFMXJovfynFoS` | `prod_SRLmhJBFLjXDnp` | YES | `/api/billing/checkout` | `/decision-instruments/mandate-clarity-framework/start` | YES | YES | NO | NONE |
| intervention_path_selector | Intervention Path Selector | YES | YES | `price_1TP1dRQFpelVFMXJvVlFQjWH` | `prod_SRLnPE5yKPOBJH` | YES | `/api/billing/checkout` | `/decision-instruments/intervention-path-selector/start` | YES | YES | NO | NONE |
| escalation_readiness_scorecard | Escalation Readiness Scorecard | YES | YES | `price_1TVaSvQFpelVFMXJbfaw1N6c` | `prod_UUZc4x8b5WlWjF` | YES | `/api/billing/checkout` | `/decision-instruments/escalation-readiness-scorecard/run` | YES | NO | NO | MISSING_PRODUCTS_SURFACE |
| structural_failure_diagnostic_canvas | Structural Failure Diagnostic Canvas | YES | YES | `price_1TVaW0QFpelVFMXJA8uL6uFs` | `prod_UUZfGWTpw4HBtw` | YES | `/api/billing/checkout` | `/decision-instruments/structural-failure-diagnostic-canvas/run` | YES | NO | NO | MISSING_PRODUCTS_SURFACE |
| execution_risk_index | Execution Risk Index | YES | YES | `price_1TVaXlQFpelVFMXJaUp4CcyW` | `prod_UUZhYqsDEf3RU4` | YES | `/api/billing/checkout` | `/decision-instruments/execution-risk-index/run` | YES | YES | NO | NONE |
| team_alignment_gap_map | Decision Alignment Gap Map | YES | YES | `price_1TVabZQFpelVFMXJEWnyrpmL` | `prod_UUZlpV3cJ5mRar` | YES | `/api/billing/checkout` | `/decision-instruments/team-alignment-gap-map/run` | YES | NO | NO | MISSING_PRODUCTS_SURFACE |
| governance_drift_detector | Governance Drift Detector | YES | YES | `price_1TVadIQFpelVFMXJGNLVkoMl` | `prod_UUZmTzvPtjH5Cx` | YES | `/api/billing/checkout` | `/decision-instruments/governance-drift-detector/run` | YES | NO | NO | MISSING_PRODUCTS_SURFACE |
| strategic_priority_stack_builder | Strategic Priority Stack Builder | YES | YES | `price_1TVaevQFpelVFMXJYVpONZTM` | `prod_UUZoZBRllX8jux` | YES | `/api/billing/checkout` | `/decision-instruments/strategic-priority-stack-builder/run` | YES | NO | NO | MISSING_PRODUCTS_SURFACE |
| board_brief_builder | Board Brief Builder | YES | YES | `price_1TVagTQFpelVFMXJ7wqif734` | `prod_UUZqrFkzDl4oCO` | YES | `/api/billing/checkout` | `/decision-instruments/board-brief-builder/run` | YES | NO | NO | MISSING_PRODUCTS_SURFACE |
| execution_integrity_protocol | Execution Integrity Protocol | YES | YES | `price_1TVbcqQFpelVFMXJrDWrVe7X` | `prod_UUao8cfUdkfDUt` | NO | Manual billing | `/playbooks/execution-integrity-protocol/run` | YES | NO | NO | MISSING_PRODUCTS_SURFACE |
| alignment_audit_playbook | The Alignment Audit Playbook | YES | YES | `price_1TVbfLQFpelVFMXJRMwJ3ksk` | `prod_UUarolZ86m0oLG` | NO | Manual billing | `/playbooks/the-alignment-audit-playbook/run` | YES | NO | NO | MISSING_PRODUCTS_SURFACE |
| drift_detection_framework | The Drift Detection Framework | YES | YES | `price_1TVbgpQFpelVFMXJIm9gc8rL` | `prod_UUas0gVjMrIXnw` | NO | Manual billing | `/playbooks/the-drift-detection-framework/run` | YES | NO | NO | MISSING_PRODUCTS_SURFACE |
| operator_decision_pack | Operator Decision Pack | YES | YES | `price_1TP1idQFpelVFMXJG77Vj5bE` | `prod_SRLpFVDmjvVsv3` | YES | `/api/billing/checkout` | `/decision-instruments/operator-decision-pack/start` | YES | YES | NO | UNKNOWN |
| operator_essentials_pack | Operator Essentials | YES | YES | `price_1TVaioQFpelVFMXJe2jvAB0C` | `prod_UUZsFTHRigifxM` | NO |  | `/decision-instruments` | NO | NO | NO | MISSING_ROUTE |
| command_pack | Command Pack | YES | YES | `price_1TVak1QFpelVFMXJekck5w1o` | `prod_UUZttE6rWwtbj9` | NO |  | `/decision-instruments` | NO | NO | NO | MISSING_ROUTE |
| governance_suite | Governance Suite | YES | YES | `price_1TVallQFpelVFMXJZdNH3bOh` | `prod_UUZv4DKEL6PiaB` | NO |  | `/decision-instruments` | NO | NO | NO | MISSING_ROUTE |
| case_dossier_tariff_shock | Case Dossier - Tariff Shock | YES | YES |  |  | NO |  | `/evidence/tariff-shock-growth-break` | NO | NO | NO | MISSING_PRICING_SURFACE |
| case_dossier_team_alignment | Case Dossier - Team Alignment | YES | YES |  |  | NO |  | `/evidence/team-alignment-illusion` | NO | NO | NO | MISSING_PRICING_SURFACE |
| case_dossier_escalation_denied | Case Dossier - Escalation Denied | YES | YES |  |  | NO |  | `/evidence/escalation-denied-case` | NO | NO | NO | MISSING_PRICING_SURFACE |
| gmi_q1_2026 | Global Market Intelligence Report - Q1 2026 | YES | YES | `price_1TP1rRQFpelVFMXJWaFMOpJQ` |  | YES | `/api/billing/checkout`; artifact checkout caller | `/artifacts/global-market-intelligence-report-q1-2026` | NO | NO | NO | MISSING_PRICING_SURFACE |
| executive_reporting | Executive Reporting | YES | YES | `price_1TXtNlQFpelVFMXJtn73BFTl` | `prod_UWxIps4rApNxcx` | YES | `/api/billing/checkout` | `/diagnostics/executive-reporting/run` | YES | YES | NO | NONE |
| diagnostic_report_basic | Diagnostic Report - Basic | YES | YES | `price_1TP1ufQFpelVFMXJ4NqwIXjv` |  | NO |  | `/diagnostics` | NO | NO | NO | MISSING_ROUTE |
| diagnostic_report_pro | Diagnostic Report - Pro | YES | YES | `price_1TP1w5QFpelVFMXJvIQUVqgz` |  | NO |  | `/diagnostics` | NO | NO | NO | MISSING_ROUTE |
| executive_reporting_priority | Executive Reporting - Advanced | YES | YES | `price_1TXtNlQFpelVFMXJtn73BFTl` | `prod_UWxIps4rApNxcx` | NO |  | `/diagnostics/executive-reporting/run` | NO | NO | NO | DUPLICATE_PRODUCT |
| strategy_room | Strategy Room - Entry | YES | YES | `price_1TPODlQFpelVFMXJY3Mo0ayo` | `prod_UOAYVuehd5sSG0` | YES | `/api/billing/checkout` | `/strategy-room` | YES | YES | NO | NONE |
| strategy_room_extended | Strategy Room - Active / Multi-Decision | YES | YES | `price_1TP26NQFpelVFMXJgMpsREew` | `prod_UOAYVuehd5sSG0` | YES | `/api/billing/checkout` | `/strategy-room` | YES | NO | NO | MISSING_PRODUCTS_SURFACE |
| inner_circle | Inner Circle | YES | YES | `price_1TP20xQFpelVFMXJwBO0Kz1h` |  | NO |  | `/inner-circle` | NO | NO | NO | MISSING_ROUTE |
| retainer_core | Decision Authority Retainer - Core | YES | YES |  |  | NO | Contracted | `/retainer` | YES | YES | NO | NONE |
| retainer_operational | Decision Authority Retainer - Operational | YES | YES |  |  | NO | Contracted | `/retainer` | YES | YES | NO | NONE |
| retainer_institutional | Decision Authority Retainer - Institutional | YES | YES |  |  | NO | Contracted | `/retainer` | YES | YES | NO | NONE |
| professional | Professional | YES | YES | `price_1TXsvkQFpelVFMXJ4OSKRCiR` | `prod_UWwpCLnxMuqDff` | YES | `/api/billing/checkout` | `/decision-centre` | YES | YES | NO | NONE |
| professional_annual | Professional Annual | YES | YES | `price_1TXsyXQFpelVFMXJp9Ey5FiB` | `prod_UWwsNbIyuncGmT` | YES | `/api/billing/checkout` | `/decision-centre` | YES | NO | NO | MISSING_PRODUCTS_SURFACE |
| enterprise | Enterprise | YES | YES |  |  | NO | Contracted | `/contact` | YES | YES | NO | NONE |
| additional_collaborator | Additional Collaborator | YES | YES |  | `prod_UWwvGUtEuJn6mx` | NO | Manual billing | `/decision-centre` | NO | NO | NO | MISSING_PRICING_SURFACE |
| decision_failure_brief | Decision Failure Brief | NO | YES |  |  | NO | Retired `/api/checkout/decision-failure-brief`; Living Case ladder has `basic_brief` |  | NO | NO | NO | MISSING_CHECKOUT |
| enterprise_assessment | Enterprise Assessment / Scan | NO | NO |  |  | NO |  | `/enterprise`, `/enterprise-decision-scan`, `/diagnostics/enterprise-assessment`, `/assessment/[token]` | NO | YES | NO | MISSING_PRICING_SURFACE |
| team_assessment | Team Assessment | NO | NO |  |  | NO |  | `/diagnostics/team-assessment`, `/assessment/[token]` | NO | YES | NO | MISSING_PRICING_SURFACE |
| founding_readers_circle | Founding Readers / subscription product | NO | NO |  |  | NO | Newsletter/subscription APIs only | `/subscribe` | NO | NO | NO | MISSING_CHECKOUT |
| retained_oversight | Retained Oversight / pilot / consulting | NO | NO |  |  | NO | Contract/contact/manual only | `/oversight`, `/consulting`, `/contact`, `/retainer` | NO | YES | NO | MISSING_PRICING_SURFACE |

## Critical Contradictions

1. `boardroom_brief` is active, priced, Stripe-backed, checkout-enabled, and has a live product page, but it is absent from `/pricing`.
2. `gmi_q1_2026` is active and checkout-enabled with a Stripe price ID, but it is absent from `/pricing` and `/products`.
3. `/products` marks `Operator Decision Pack` as planned while catalog marks `operator_decision_pack` active, paid, and checkout-enabled.
4. `executive_reporting_priority` duplicates the same Stripe product and price as `executive_reporting` while inactive, creating a stale duplicate identity.
5. Decision Failure Brief checkout endpoints are retired, but the Living Case ladder still exposes conceptually similar `basic_brief`, `full_dossier`, `urgent_operational`, and `executive_board` tiers outside the catalog SSOT.
6. `pages/checkout/personal-decision-audit.tsx` calls `POST /api/checkout` with only a slug; production `app/api/checkout/route.ts` returns a 308 instruction for `/api/billing/checkout`, which requires an email and a catalog price code. The page is stale relative to canonical checkout.
7. Enterprise Assessment, Team Assessment, Founding Readers, consulting, pilots, and retained oversight are publicly routed concepts but are not catalog products and have no self-serve checkout identity.
8. There are three Stripe webhook surfaces (`pages/api/billing/webhook.ts`, `pages/api/webhooks/stripe.ts`, `app/api/stripe/webhook/route.ts`) that resolve overlapping metadata concepts.
