# Four-Pillar Moat Activation — Status Assessment

**Date:** 2026-07-07
**Branch (construction):** `construction/estate-restoration` at `8cb171358`
**Branch (workspace):** `work/estate-market-restoration` at `257dd9553`

---

## Overview

The compounding intelligence work has been built on `construction/estate-restoration` in `C:\Dev\aol-estate-construction`. This workspace (`C:\aol-check-visual`) contains the estate restoration and three-layer proof system. The two branches need to be reconciled.

---

## Pillar 1: Accountable Judgement — STATUS: SUBSTANTIAL FOUNDATION, KEY GAPS REMAIN

### Built (on construction branch)

| Component | File | Status |
|---|---|---|
| Market Call Ledger | `lib/intelligence/market-intelligence-call-ledger.ts` | ✅ 30+ structured calls with outcomes, scores, evidence, version history |
| GMI Methodology | `lib/intelligence/gmi-methodology.ts` | ✅ Rubric scores (0-5), evidence posture, methodology versioning |
| GMI Instrument | `lib/intelligence/gmi-instrument.ts` | ✅ Public call ledger, evidence posture index, blocked claim types |
| GMI Persistent Ledger | `lib/intelligence/gmi-persistent-ledger.ts` | ✅ Database-backed with callId, editionId, confidence bands, review scheduling |
| Falsification Contract | `lib/falsification/falsification-contract.ts` | ✅ Append-only, audit-locked, calibration tracking |
| Release Events | `lib/intelligence/gmi-release-events.ts` | ✅ Event-sourced release history |
| Claim-Boundary Authority | `lib/governance/claim-boundary-authority.ts` | ✅ §16 — canonical authority + build gate + mutation tests |

### Remaining to build

| Component | Section | Priority |
|---|---|---|
| **Public Market Decision Integrity Index** | §9 | **HIGH** — Aggregate call accuracy, falsification discipline, calibration quality, revision discipline into published score |
| **Public Decision Learning Log / Falsification Register** | §11 | **HIGH** — Surface falsification record publicly with chronological view, filtering, call-detail pages |
| **Automated Cross-Edition Call Review** | §12 | **HIGH** — Q1 call → Q2 evidence → Q3 follow-up automated comparison |
| DII methodology page | §9 | Medium — Methodology, scoring formula, exclusions, change history |
| Edition trend visualization | §9 | Medium — Show change across eligible editions |

---

## Pillar 2: Compounding Customer Intelligence — STATUS: STRONG, MOSTLY BUILT

### Built (on construction branch)

| Component | File | Status |
|---|---|---|
| Interaction Spine | `lib/intelligence/interaction-spine/product-interaction-spine.ts` | ✅ Canonical interaction record/propagation path |
| Durable SQLite Store | `lib/intelligence/interaction-spine/sqlite-interaction-store.ts` | ✅ Real DB round-trip proven |
| Durable Outbox | `lib/intelligence/interaction-spine/interaction-outbox.ts` | ✅ Propagation, failure isolation, retry, dead-letter |
| Product→Interaction Mappers | `lib/intelligence/interaction-spine/product-interaction-mappers.ts` | ✅ Typed mapping, unmapped fails closed |
| Runtime Binding | `lib/intelligence/interaction-spine/runtime-binding.ts` | ✅ Live playbook + instrument paths bound to spine |
| Pre-Run Context (Read-Before-Run) | `lib/intelligence/interaction-spine/pre-run-context.ts` | ✅ Bounded relevance context, compounding made visible |
| Compounding Intelligence | `lib/intelligence/compounding/compounding-intelligence.ts` | ✅ Cross-moat, next-move, outcome, integrity loops |
| Decision Centre Intelligence | `lib/intelligence/compounding/decision-centre-intelligence.ts` | ✅ Customer-visible read model |
| Decision Centre Twin Panel | `components/decision-centre/TwinSnapshotPanel.tsx` | ✅ UI component with jsdom render proof |
| Outcome Learning | `lib/intelligence/outcome-learning/` | ✅ Assumption drift, failure pattern calibration, version tracking |
| Decision Provenance Certificate | `lib/intelligence/provenance/decision-provenance-certificate.ts` | ✅ Exportable, tamper-evident, verification function |
| Architecture Guards | `tests/product-estate/interaction-architecture-guards.test.ts` | ✅ No-new-use of deprecated stores |

### Remaining to build

| Component | Section | Priority |
|---|---|---|
| **Canonical Decision Graph** | §5 | **HIGH** — Converge strategic twin, decision memory, product knowledge graph, interaction history, outcome history into one canonical read model |
| **Customer Falsification Watchdog** | §14 | **HIGH** — Monitor customer-stated triggers against authoritative evidence |
| **Customer Decision-Integrity Trend operationalisation** | §15 | **HIGH** — Bind into actual runtime interactions, outcomes, checkpoints |
| Monthly reporting binding | §3.4 | Medium — Bind at authoritative lifecycle boundary |
| Custom reporting binding | §3.5 | Medium — Bind at approval/delivery boundary |
| Strategy Room/Boardroom binding | §3.6 | Medium — Bind at authoritative output boundaries |

---

## Pillar 3: Fail-Closed Governance — STATUS: STRONGEST, MOSTLY COMPLETE

### Built

| Component | File | Status |
|---|---|---|
| Commercial Action Resolver | `lib/commercial/commercial-action-resolver.ts` | ✅ Pure function, 10 states, catalog ≠ permission |
| Product Moat Adapter | `lib/product-moat/product-moat-adapter.ts` | ✅ 5 activation modes, universal access control |
| Fulfilment Contract Registry | `lib/product/product-fulfilment-contract.ts` | ✅ 44 contracts |
| Fulfilment Assurance | `lib/product/product-fulfilment-assurance.ts` | ✅ Delivery class, automation level, quality controls |
| Fulfilment Readiness Validator | `lib/product/fulfilment-readiness-validator.ts` | ✅ Validates contracts, computes readiness |
| Fulfilment Architecture Gate | `scripts/gtm/fulfilment-architecture-gate.ts` | ✅ 10 checks |
| Payment Architecture Gate | `scripts/gtm/payment-architecture-gate.ts` | ✅ 8 checks |
| Three-Layer Estate Proof | `lib/fulfilment/estate-{observation,evaluation,verdict}-layer.ts` | ✅ Independent A→B→C, no self-asserted fields |
| Payment Event Processor | `lib/commercial/payment-event-processor.ts` | ✅ Canonical processor, two-level idempotency |
| Claim-Boundary Authority | `lib/governance/claim-boundary-authority.ts` | ✅ §16 — canonical authority + build gate + mutation tests |
| Build-Time Claim Gate | `scripts/check-claim-boundary.ts` | ✅ Scans product pages, MDX, metadata at build time |

### Remaining to build

| Component | Section | Priority |
|---|---|---|
| **Buyer-Visible Governance Trust Centre** | §17 | **HIGH** — Public/customer-safe governance display with product-specific cards |
| **Governance Receipt Per Product** | §18 | **HIGH** — Compact buyer-facing proof object for each active product |
| Governance-as-a-Service feasibility | §19 | Medium — Bounded feasibility assessment |
| Runtime claim enforcement on generated outputs | §16.2 | Medium — Claim extraction/classification on AI outputs |
| Publication authority gate | §16.3 | Medium — Publication state, human review, data lock, artifact hash |

---

## Pillar 4: Governed Product Corridor — STATUS: STRUCTURALLY COMPLETE, OPERATIONALLY WEAK

### Built

| Component | File | Status |
|---|---|---|
| Product Ladder | `lib/commercial/ladder.ts` | ✅ Upgrade paths, corridor stages |
| Commercial Catalog | `lib/commercial/catalog.ts` | ✅ SSOT for 46 products with upgrade paths |
| Product Estate Contract | `lib/product/product-estate-contract.ts` | ✅ Families, availability, surfacing rules |
| Governed Next-Admissible-Move | `lib/intelligence/compounding/compounding-intelligence.ts` | ✅ State-derived, evidence-driven, controlled/retired handled |
| Product Knowledge Graph | `lib/product/product-knowledge-graph.ts` | ✅ Product relationships |
| Strategic Twin | `lib/strategic-twin/strategic-twin-contract.ts` | ✅ Decision pressure, contradictions, evidence gaps |

### Remaining to build

| Component | Section | Priority |
|---|---|---|
| **Customer-Visible Corridor Map** | §7 | **HIGH** — Visible guided journey showing position, completed interactions, eligible next moves |
| **Corridor Progression Analytics** | §8 | **HIGH** — Instrument entry product, recommended next move, acceptance, completion, stall |
| **Dynamic Corridor (state-driven progression)** | §6 | **HIGH** — Full chain: customer state → twin → evidence sufficiency → product graph → commercial governance → next move |
| Proactive Corridor Intervention | §22 | Medium — Stalled evidence gathering, missed checkpoint, repeated drift |

---

## Cross-Pillar — STATUS: KEY COMPONENTS BUILT, INTEGRATION REMAINS

### Built

| Component | File | Status |
|---|---|---|
| Decision Provenance Certificate | `lib/intelligence/provenance/decision-provenance-certificate.ts` | ✅ Exportable, tamper-evident, verification function |
| Cross-Moat Brief (GMI × twin) | `lib/intelligence/compounding/compounding-intelligence.ts` | ✅ Exposure-only, DRAFT-Q2 refused, hash-bound stale detection |
| Customer Decision-Integrity Trend | `lib/intelligence/compounding/compounding-intelligence.ts` | ✅ Process-only, evidence-backed, null-not-fake |
| Outcome + Checkpoint Loop | `lib/intelligence/compounding/compounding-intelligence.ts` | ✅ Evidence classes, high-stakes cannot close on weak proxy |
| Enterprise Portfolio Intelligence | `lib/intelligence/compounding/decision-centre-intelligence.ts` | ✅ RBAC, no-cross-client, aggregation threshold |
| Data Export/Correction/Deletion | `lib/intelligence/interaction-spine/sqlite-interaction-store.ts` | ✅ Tenant-scoped export, correction=versioning, deletion+tombstone |

### Remaining to build

| Component | Section | Priority |
|---|---|---|
| **Cross-Pillar Acceptance Test** | §27 | **HIGH** — Full deterministic scenario proving all four pillars together |
| **46-Identity Activation Sweep** | §30 | **HIGH** — Every product's runtime binding, twin read/write, corridor visibility, claim boundary |
| Opportunity Ledger Expansion | §29 | Medium — Add every newly identified opportunity |
| Category Positioning & Surface Language | §24 | Medium — Audit public product language, reduce commodity AI positioning |
| Homepage Trust Architecture | §25 | Medium — Component architecture for trust-signal homepage |
| Duplication Convergence | §23 | Medium — Delete or quarantine deprecated modules |
| Context Graph Convergence | §20 | Medium — Assess whether existing graphs fulfil requirement |

---

## Immediate Next Steps (Priority Order)

1. **Build Public Market DII** (§9) — The single most impactful missing piece. Derive from existing call ledger.
2. **Build Public Decision Learning Log** (§11) — Surface falsification record publicly.
3. **Build Cross-Edition Call Review** (§12) — Automated Q1→Q2→Q3 comparison.
4. **Build Customer Falsification Watchdog** (§14) — Monitor customer-stated triggers.
5. **Build Buyer-Visible Trust Centre** (§17) — Public governance display.
6. **Build Governance Receipt** (§18) — Per-product buyer-facing proof object.
7. **Build Customer-Visible Corridor Map** (§7) — Guided journey with state-driven progression.
8. **Build Corridor Progression Analytics** (§8) — Instrument the corridor.
9. **Build Cross-Pillar Acceptance Test** (§27) — Full deterministic scenario.
10. **Build 46-Identity Activation Sweep** (§30) — Every product accounted for.

---

## Branch Strategy

The compounding intelligence work is on `construction/estate-restoration` in `C:\Dev\aol-estate-construction`.
The estate restoration work is on `work/estate-market-restoration` in `C:\aol-check-visual`.

**Recommended approach:** Continue working on `construction/estate-restoration` for the compounding intelligence and moat activation work. The two branches should be merged when both are complete, with the estate restoration providing the governance foundation and the construction branch providing the compounding intelligence runtime.
