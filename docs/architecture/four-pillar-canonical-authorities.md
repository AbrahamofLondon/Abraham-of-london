# Four-Pillar Canonical Authorities

**Date:** 2026-07-07
**Status:** Adopted
**Branch:** construction/estate-restoration

## Purpose

Name exactly one canonical authority for each domain in the four-pillar architecture. No runtime module may import a deprecated competing authority.

## Authorities

| Domain | Canonical Authority | Location | Deprecated/Competing Authorities |
|---|---|---|---|
| Product identity | Canonical commercial catalogue/resolver | `lib/commercial/catalog.ts` | None |
| Product lifecycle | Estate lifecycle authority | `lib/product/product-estate-contract.ts` | None |
| Commercial action | Commercial action resolver | `lib/commercial/commercial-action-resolver.ts` | None |
| Product governance | Product moat/control authority | `lib/product-moat/product-moat-adapter.ts` | None |
| Interaction persistence | Canonical durable interaction store | `lib/intelligence/interaction-spine/sqlite-interaction-store.ts` | In-memory stores, file-based stores |
| Outbox | Canonical durable outbox | `lib/intelligence/interaction-spine/sqlite-outbox-store.ts` | In-memory queues |
| Memory | Canonical tenant-aware governed memory | `lib/intelligence/interaction-spine/product-interaction-spine.ts` | Deprecated file store (guard enforced) |
| Strategic twin | Canonical durable tenant-aware twin store | `lib/intelligence/interaction-spine/product-interaction-spine.ts` (twin versioning built into spine) | None |
| Decision graph | Canonical durable graph authority | `lib/intelligence/canonical-decision-graph.ts` (with SQLite persistence) | In-memory graph |
| Call ledger | Canonical GMI call ledger | `lib/intelligence/market-intelligence-call-ledger.ts` | GMI seed modules (guard enforced) |
| Falsification | Canonical falsification register/contract | `lib/falsification/falsification-contract.ts` | None |
| Market DII | One versioned methodology authority | `lib/intelligence/accountability/market-decision-integrity-index.ts` | None |
| Customer integrity trend | Separate customer methodology authority | `lib/intelligence/compounding/compounding-intelligence.ts` (computeDecisionIntegrity) | None |
| Claim boundary | Canonical claim-boundary authority | `lib/governance/claim-boundary-authority.ts` | truth-claim-firewall (composed, not competing) |
| Estate proof | Observation → Evaluation → Verdict | `lib/fulfilment/estate-{observation,evaluation,verdict}-layer.ts` | Self-asserted evidence records |
| Corridor next move | One governed next-admissible-move engine | `lib/intelligence/compounding/compounding-intelligence.ts` (deriveNextAdmissibleMove) | None |
| Trust Centre status | Derived from canonical proof/governance state | `lib/governance/trust-centre/governance-trust-centre.ts` | Self-attested verification |
| Governance Receipt | Derived from canonical evidence, never self-attested | `lib/governance/trust-centre/governance-trust-centre.ts` | None |
| Analytics | Canonical durable progression-event store | `lib/intelligence/corridor/corridor-progression-analytics.ts` (with SQLite persistence) | In-memory events |
| Watchdog trigger state | Canonical durable monitor store | `lib/intelligence/accountability/customer-falsification-watchdog.ts` (with SQLite persistence) | In-memory triggers |

## Architecture Test

No runtime module may import a deprecated competing authority. This is enforced by:

- `tests/product-estate/interaction-architecture-guards.test.ts` (guards against deprecated store)
- `tests/product-estate/census-ledger-coverage.test.ts` (guards against unmapped products)
- Build-time import guards where applicable

## Change Process

To add a new canonical authority:
1. Update this ADR
2. Add architecture guard test
3. Migrate callers from deprecated authority
4. Remove or quarantine deprecated module
