# Governed Instruments Inventory

Audit date: 2026-06-02

Scope audited:

- `lib/instruments/`
- `lib/instruments/*/`
- `lib/instruments/governed-instrument-contract.ts`
- `lib/instruments/instrument-pack-contract.ts`
- `lib/instruments/operator-pack.ts`
- `components/instruments/`
- `pages/instruments/` (absent)
- `app/instruments/` (absent)
- `pages/decision-instruments/`
- `pages/products.tsx`
- `pages/pricing.tsx`
- `lib/commercial/catalog.ts`

## Summary

All ten governed instruments have engine folders under `lib/instruments/`, registry membership in `lib/instruments/governed-instrument-contract.ts`, runner/component coverage, and actual runnable routes under `pages/decision-instruments/`.

The public `/instruments` route does not exist. The active public instrument route is `/decision-instruments`. Because `/instruments` is absent, the recommended action is to either create `/instruments` as an alias/landing route or fold the governed instruments cleanly into `/products`. Given `/decision-instruments` already exists and is complete, the lower-risk recommendation is to keep `/decision-instruments` as the execution surface and repair `/products` so every live governed instrument is visible as live, not planned or omitted.

## Inventory

| instrumentId | label | folderExists | governedContractExists | packMembership? | productSurfaceExists | route? | catalogProductExists | pricingSurfaceExists | checkoutAvailable | recommendedSurface | status |
|---|---|---:|---:|---|---:|---|---:|---:|---:|---|---|
| board-brief-template | Board Brief Builder | true | true | governance_suite, executive_intelligence | true | `/decision-instruments/board-brief-builder/run`; legacy `/decision-instruments/board-brief-template/run` redirects | true, via `board_brief_builder` alias | true | true | `/products` | LIVE_GOVERNED_BUT_BURIED |
| decision-exposure | Decision Exposure Instrument | true | true, as `decision-exposure-instrument` | operator_essentials, command_pack, governance_suite, executive_intelligence | true | `/decision-instruments/decision-exposure-instrument/start`, `/decision-instruments/decision-exposure-instrument/run` | true | true | true | `/products` | LIVE_GOVERNED |
| escalation-readiness-scorecard | Escalation Readiness Scorecard | true | true | operator_essentials, command_pack, governance_suite, executive_intelligence | true | `/decision-instruments/escalation-readiness-scorecard/run` | true | true | true | `/products` | LIVE_GOVERNED_BUT_BURIED |
| execution-risk-index | Execution Risk Index | true | true | command_pack, governance_suite, executive_intelligence | true | `/decision-instruments/execution-risk-index/run` | true | true | true | `/products` | LIVE_GOVERNED |
| governance-drift-detector | Governance Drift Detector | true | true | governance_suite, executive_intelligence | true | `/decision-instruments/governance-drift-detector/run` | true | true | true | `/products` | LIVE_GOVERNED_BUT_BURIED |
| intervention-path | Intervention Path Selector | true | true, as `intervention-path-selector` | governance_suite, executive_intelligence | true | `/decision-instruments/intervention-path-selector/start`, `/decision-instruments/intervention-path-selector/run` | true | true | true | `/products` | LIVE_GOVERNED_BUT_BURIED |
| mandate-clarity | Mandate Clarity Framework | true | true, as `mandate-clarity-framework` | command_pack, governance_suite, executive_intelligence | true | `/decision-instruments/mandate-clarity-framework/start`, `/decision-instruments/mandate-clarity-framework/run` | true | true | true | `/products` | LIVE_GOVERNED |
| strategic-priority-stack-builder | Strategic Priority Stack Builder | true | true | governance_suite, executive_intelligence | true | `/decision-instruments/strategic-priority-stack-builder/run` | true | true | true | `/products` | LIVE_GOVERNED_BUT_BURIED |
| structural-failure-diagnostic-canvas | Structural Failure Diagnostic Canvas | true | true | operator_essentials, command_pack, governance_suite, executive_intelligence | true | `/decision-instruments/structural-failure-diagnostic-canvas/run` | true | true | true | `/products` | LIVE_GOVERNED_BUT_BURIED |
| team-alignment-gap-map | Decision Alignment Gap Map | true | true | command_pack, governance_suite, executive_intelligence | true | `/decision-instruments/team-alignment-gap-map/run` | true | true | true | `/products` | LIVE_GOVERNED_BUT_BURIED |

## Hidden Live Instruments

The rule is: live governed instruments must not be hidden. These instruments are live in governed contract, catalog, pricing, checkout, and route surfaces, but are buried or misrepresented on `/products`:

- `board-brief-template`: live governed ID, but public/catalog/product language uses `board-brief-builder`; `/products` marks Board Brief Builder as `Planned` even though checkout and `/decision-instruments/board-brief-builder/run` exist.
- `escalation-readiness-scorecard`: live route, catalog, pricing, and checkout exist; not surfaced in `/products` instrument list.
- `governance-drift-detector`: live route, catalog, pricing, and checkout exist; `/products` marks it as `Planned`.
- `intervention-path`: live governed engine and route exist under public slug `intervention-path-selector`; not surfaced in `/products` instrument list.
- `strategic-priority-stack-builder`: live route, catalog, pricing, and checkout exist; not surfaced in `/products` instrument list.
- `structural-failure-diagnostic-canvas`: live route, catalog, pricing, and checkout exist; not surfaced in `/products` instrument list.
- `team-alignment-gap-map`: live route, catalog, pricing, and checkout exist; `/products` marks it as `Planned`.

## Route And Surface Findings

- `/instruments` does not exist in `pages/` or `app/`.
- `/decision-instruments` exists and lists ten governed instrument cards.
- `/pricing` includes all active one-time governed instrument catalog products, including `board_brief_builder`.
- `/products` has a secondary "Specialised Decision Instruments" section, but it lists only three governed instruments as active and marks several live instruments as planned or omits them.
- Board Brief has an ID mismatch:
  - Governed contract and engine folder: `board-brief-template`.
  - Catalog, checkout, dynamic product page, and primary route: `board-brief-builder`.
  - Legacy route `/decision-instruments/board-brief-template/run` permanently redirects to `/decision-instruments/board-brief-builder/run`.

## Recommendation

Use `/decision-instruments` as the execution surface, `/pricing` as the checkout surface, and repair `/products` as the catalog/discovery surface.

Do not leave live governed instruments marked as planned or omitted on `/products`. If a short `/instruments` route is desired, create it as a redirect or alias to `/decision-instruments` rather than introducing a second independent inventory.
