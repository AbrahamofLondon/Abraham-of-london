# Global Market Intelligence Inventory

**Scope searched:** `lib/`, `content/`, `data/`, `pages/`, `app/`, `components/`, `docs/`, `lib/commercial/`

**Search terms:** global market intelligence, GMI, gmi, market intelligence, quarterly report, q1, q2, market calls, getCallsPendingReview

## Inventory Fields

| Field | Finding |
| --- | --- |
| productName | Global Market Intelligence |
| reportsFound | `GMI-Q1-2026` active report; `GMI-Q2-2026` governed draft; Q1 public surface; Q1 institutional report artifact; Q1 board deck artifact; Q2 draft artifact/content workspace |
| productCodesFound | `gmi_q1_2026`; `global-market-intelligence-report-q1-2026`; `global-market-outlook-q1-2026-public`; `global-market-intelligence-board-deck-q1-2026`; lifecycle IDs `GMI-Q1-2026`, `GMI-Q2-2026` |
| catalogExists | Yes. `lib/commercial/catalog.ts` defines `gmi_q1_2026` as active, paid, one-time, premium-report, category `intelligence`. |
| pricingExists | Partially. Catalog has GBP 59 and `hiddenFromPricing: false`, but `/pricing` uses a manual `ONE_TIME_PRODUCTS` list that does not include `CATALOG.gmi_q1_2026`. |
| checkoutExists | Yes. `gmi_q1_2026` has Stripe price `price_1TP1rRQFpelVFMXJWaFMOpJQ`, `requiresCheckout: true`, and the artifact route posts to `/api/billing/checkout` after resolving the content slug to the product code. |
| publicRouteExists | Yes. Public surfaces include `/intelligence/market`, `/intelligence/global-market-intelligence-q1-2026`, `/artifacts/global-market-outlook-q1-2026-public`, and dynamic artifact route `/artifacts/global-market-intelligence-report-q1-2026`. |
| archiveRouteExists | Yes. `GMI-Q1-2026` has `archiveVisible: true`; artifact detail pages are presented under the Intelligence Archives surface. |
| sampleExists | Yes. The public brief/public surface acts as the open sample layer: `/artifacts/global-market-outlook-q1-2026-public` and `/intelligence/global-market-intelligence-q1-2026`. No separate file explicitly named "sample" was found for GMI. |
| appearsOnProducts | No. `/products` imports `CATALOG`, but the visible product map is manually curated and does not include Global Market Intelligence or `gmi_q1_2026`. |
| appearsOnPricing | No live page listing found. The catalog allows pricing visibility, but `/pricing` does not include `CATALOG.gmi_q1_2026` in its rendered product arrays. |
| appearsOnHomepage | Component-only. `components/homepage/MarketIntelligenceFeature.tsx` exists and links the public brief, institutional edition, and board deck, but no import/render usage was found in `pages/index.tsx`, `components/homepage/index.ts`, or homepage section files. |
| governanceWorkflowExists | Yes. Release standard, lifecycle registry, quality gate, source appendix registry, release state resolver, release event ledger, release console, event log, and source coverage components exist. |
| priorQuarterReviewWorkflowExists | Yes. `lib/intelligence/market-intelligence-call-ledger.ts` records Q1 material calls and exposes `getCallsPendingReview("Q2 2026")`; Q2 release docs and UI require Q1 call review before publication. |
| status | LIVE_GOVERNED_BUT_NOT_SURFACED |

## Evidence Summary

Commercial wiring exists for `gmi_q1_2026`: active paid product, GBP 59, Stripe price ID, checkout eligibility, artifact slug to product-code resolution, and success/cancel paths to `/artifacts/global-market-intelligence-report-q1-2026`.

Content and route wiring exists for the report line: Q1 is active until superseded, public visible, purchasable, and archive visible. Q2 exists as a governed draft, explicitly not public, not purchasable, and not active until release prerequisites are met.

Governance is stronger than surfacing. The line has lifecycle state, source appendix standards, source coverage scoring, a quality gate, release candidate checklist, release state resolver, admin release console, event log, event ledger, and buyer assurance pack. The missing part is commercial discovery on the main public selling surfaces.

## Doctrine Verification

Doctrine verified: every quarterly report reviews material calls from the previous quarter before issuing the next one.

Key implementation points:

- Q1 has 8 material calls in `GMI_Q1_2026_CALLS`.
- 7 Q1 calls have `expectedReviewWindow: "Q2 2026"`.
- 1 Q1 call is carried to `Q3 2026`.
- `getCallsPendingReview(currentWindow)` returns calls due for review that are pending or too early to assess.
- The Q2 preparation dossier, Q2 draft artifact, release standard, release console, and event log all state that Q2 cannot publish until Q1 calls due in Q2 are reviewed, scored, or explicitly carried forward with justification.

Doctrine verified: intelligence compounds through verification, not prediction theatre.

Key implementation points:

- The release standard defines GMI as decision-support intelligence, not investment advice, forecast service, or research product.
- Quality gates block release for unreviewed prior-quarter calls, missing source appendix rows, unresolved source blockers, and public/paid edition collapse.
- Q2 remains draft/non-purchasable until call review, source appendix completion, confidence posture finalisation, and quality gate pass.

## Forbidden Claim Scan

No live GMI surface was found claiming:

- AI predicts markets
- guaranteed calls
- forecast certainty

Flagged non-live/test/governance occurrences:

- Test fixtures and outbound gate examples intentionally contain forbidden phrases such as "AI predicts" and "guaranteed" to verify blockers.
- Governance docs explicitly prohibit phrases including "Our system predicts markets" and "Guaranteed return / outcome".
- `content/artifacts/global-market-intelligence-report-q2-2026.mdx` contains "not structurally guaranteed", which is a negated risk statement, not a guarantee claim.

## Surfacing Requirements

To make Global Market Intelligence fully surfaced, without changing the doctrine:

1. Add `CATALOG.gmi_q1_2026` to the rendered `/pricing` product array or create a dedicated Intelligence Reports section using catalog data.
2. Add a visible Global Market Intelligence entry on `/products` that routes to `/intelligence/market` or `/intelligence/global-market-intelligence-q1-2026`, with purchase access through the institutional artifact route.
3. Wire `components/homepage/MarketIntelligenceFeature.tsx` into the live homepage, or replace it with an equivalent homepage section that links the public brief, institutional report, and board deck.
4. Keep Q2 hidden from pricing and checkout until lifecycle state changes from `DRAFT` and the quality gate passes.
5. Preserve the doctrine language: quarterly reports review prior-quarter material calls; intelligence improves through verification and source discipline, not certainty claims.
