# Abraham of London Product Estate Reality Audit

**Date:** 2026-06-07  
**Scope:** product catalog, runtime routes, APIs, admin surfaces, database authority, commercial routing, user-facing CTAs, tests, and positioning.

## Executive Result

The estate is not uniformly production-authoritative yet. GMI is now the strongest governed runtime layer. Strategy Room, Executive Reporting, Professional Subscription, and Briefs/Vault/Editorial are the strongest non-GMI surfaces by available source evidence. Boardroom Brief and Decision Instruments are commercially active but still have authority gaps that prevent a 10/10 claim.

The canonical product ladder is:

1. Pressure Signal: acquisition.
2. Boardroom Brief: diagnosis.
3. Strategy Room: conversion/execution.
4. Executive Reporting: reporting.
5. Retainer / Oversight: enterprise/retainer.
6. Professional Subscription: continuity.
7. GMI: supporting intelligence.
8. Briefs / Vault / Editorial: supporting evidence and doctrine.
9. Decision Instruments: supporting tools.

Quarterly intelligence must stay edition-parametric. Q2 is a published/current edition, not the permanent shape of GMI.

## Reality Grades

| Product | Grade | Classification | Runtime Truth | Primary Gap |
|---|---:|---|---|---|
| Pressure Signal | 6/10 | DUPLICATES_OR_COMPETES_WITH_ANOTHER_PRODUCT | DB-derived on `/pressure` | Estate previously pointed to `/decision-pressure`, which competes with the DB-backed route. |
| Boardroom Brief | 7/10 | ACTIVE_BUT_UNVERIFIED | Mixed persisted order/dossier plus generated preview | Admin delivery can persist dossier state from a fixture spine. |
| Strategy Room | 8/10 | VERIFIED_ACTIVE | DB-derived session/execution state | API route ownership needs consolidation. |
| Executive Reporting | 8/10 | VERIFIED_ACTIVE | DB-derived run/artifact state | Stripe webhook ownership is duplicated. |
| Decision Instruments | 6/10 | ACTIVE_BUT_UNVERIFIED | Partly DB-derived through `DiagnosticJourney` | No dedicated run authority model; PDF route lacks entitlement check. |
| Professional Subscription | 8/10 | VERIFIED_ACTIVE | DB-derived entitlement state | Trial handling is separate from active entitlement resolution. |
| Retainer / Oversight | 7/10 | ADMIN_ONLY / RETAINER_GATED | DB-derived where active | Not self-serve active; must stay selective/gated. |
| Inner Circle | 6/10 | DORMANT | DB-derived operating layer | Route surface exists, but subscription is inactive and must not be sold as membership. |
| GMI | 8/10 | VERIFIED_ACTIVE | DB/snapshot-derived | Legacy support/admin views still import static registries; keep future-edition tests. |
| Briefs / Vault / Editorial | 8/10 | VERIFIED_ACTIVE | Content-derived | Editorial static curation is acceptable only as labelled editorial content. |

## Broken Or Missing Features Found

- `decision_pressure_signal` in `PRODUCT_ESTATE` pointed to `/decision-pressure`; the DB-backed implementation is `/pressure`. This has been corrected.
- Boardroom delivery generation imports `lib/boardroom/boardroom-dev-spine.ts`, a production-stub fixture, and can persist `BoardroomDossier` records from it.
- Living Case Fulfilment admin uses in-memory order/entitlement stores and returns success for actions that comments say should update Prisma.
- Decision Instrument start/download/run paths have weak entitlement and identity guarantees.
- Admin PDF “Live Data Dashboard” renders synthetic interval data under a live-data label.
- Legacy GMI market/support/admin surfaces still import static GMI registries outside the hardened DB-first path.

## Briefs And Report Status

Briefs, Vault, and Editorial are verified as content-derived rather than DB-derived operational state. That is acceptable because they are editorial/content surfaces, not live operational intelligence. The audit now records them as `briefs_vault_editorial`, with routes:

- `/briefs`
- `/briefs/[slug]`
- `/vault/briefs`
- `/vault/briefs/[slug]`
- `/editorials`
- `/editorials/[slug]`

The editorial series static list is labelled in source as editorial curation. It must not be reused as proof of live operational product state.

## Routes Fixed

- `lib/product/product-estate-contract.ts`: `decision_pressure_signal.route` now points to `/pressure`.

## Runtime Provenance Issues

High:

- Boardroom fixture dossier generation.
- Living Case Fulfilment in-memory admin queue.

Medium:

- Fake-live admin dashboard.
- Legacy/static GMI support surfaces.
- Decision Instrument duplicated catalog/runtime state.

## Commercial Conflicts

- Pressure Signal had two competing public entry routes.
- Decision Instruments can compete with Strategy Room unless clearly positioned as support tools.
- GMI should feed Boardroom Brief and Executive Reporting, not compete as a parallel headline product.
- Inner Circle must remain dormant/controlled and distinct from Professional Subscription.
- Retainer/Oversight is credible internally but not active self-serve.

## Tests Added

- `tests/product-estate/product-inventory.test.ts`
- `tests/product-estate/product-route-smoke.test.ts`
- `tests/product-estate/commercial-catalog-coherence.test.ts`
- `tests/product-estate/product-ladder-routing.test.ts`
- `tests/product-estate/runtime-provenance.test.ts`
- `tests/product-estate/paid-product-authority.test.ts`
- `tests/product-estate/cta-coherence.test.ts`

## New Operational Surfaces

- `scripts/audit-product-estate.mjs`
- `scripts/smoke-product-estate.mjs`
- `/admin/product-estate`
- `lib/product/product-estate-reality-audit.json`

## Next Upgrade Priority

1. Replace boardroom fixture dossier generation with persisted order/input state and artifact hashes.
2. Move Living Case Fulfilment queue/actions out of in-memory stores and into Prisma/audit records.
3. Add dedicated Decision Instrument run/entitlement/artifact authority.
4. Retire or redirect `/decision-pressure` after confirming no active campaigns depend on it.
5. Remove static GMI imports from secondary market/admin/support views.
6. Run production smoke with `pnpm smoke:product-estate -- --base-url https://www.abrahamoflondon.org`.
