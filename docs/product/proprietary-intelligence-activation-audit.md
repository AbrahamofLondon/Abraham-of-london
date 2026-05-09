# Proprietary Intelligence Activation Audit

Date: 2026-05-09
Scope owner: Agent 1
Mission: surface product-safe intelligence without exposing formulas, graph internals, or prompt logic.

## Classification Register

### `lib/engine/contradiction-graph.ts`
Classification: `LIVE_BUT_HIDDEN`
Reason:
- The graph model, active conflict detection, dependency mapping, and graph health logic are implemented.
- It is used by the decision kernel and downstream engines.
- Users do not receive a safe contradiction-map view from this module directly.
- Raw graph internals remain unsafe to expose as-is.

### `lib/decision/kernel.ts`
Classification: `LIVE_BUT_HIDDEN`
Reason:
- The kernel computes cross-assessment interference, decay-aware severity, simulation, and graph metrics.
- It is active in server decision flows.
- Most of its differentiating output is not surfaced in Decision Centre as product language.
- Raw kernel mechanics and formulas are not safe to expose directly.

### `lib/decision/arbiter-tournament.ts`
Classification: `LIVE_BUT_HIDDEN`
Reason:
- The arbiter is active and materially governs whether synthesis is accepted.
- It protects quality and market defensibility.
- Its enforcement effect exists, but the user-facing product does not surface it as a distinct governed intelligence layer.

### `lib/product/irreversibility-index.ts`
Classification: `READY_TO_SURFACE`
Reason:
- The contract and computation exist and are already safe enough for guarded product copy.
- It is no longer purely oversight-only infrastructure.
- It still depends on case-level signal sufficiency before any strong claim should be shown.

### `lib/product/pattern-recurrence.ts`
Classification: `LIVE_AND_USED`
Reason:
- Recurrence detection is implemented against persisted journeys.
- Decision Centre already consumes its result.
- The current matching is useful, but it remains lexical rather than institution-grade identity resolution.

### `lib/product/portfolio-pattern-memory.ts`
Classification: `READY_TO_SURFACE`
Reason:
- The output is already privacy-aware and portfolio-safe.
- It is suitable for controlled portfolio or retainer contexts.
- It is not currently surfaced in the individual Decision Centre experience.

### `lib/product/organisation-divergence-summary.ts`
Classification: `READY_TO_SURFACE`
Reason:
- The aggregation and suppression logic are strong enough for sponsor-safe use.
- It is already governed by sample safety.
- It needs the right route and audience gate, not new doctrine.

### `lib/product/checkpoint-service.ts`
Classification: `LIVE_AND_USED`
Reason:
- Durable checkpoint creation, correlation, response persistence, and lookup are active.
- This is now a real behavioural spine, not just storage.
- It provides the timestamp evidence needed for decision-velocity computation.

### `lib/diagnostics/journey-store.ts`
Classification: `LIVE_AND_USED`
Reason:
- It is the canonical persistence and retrieval path for diagnostic journey state, stages, evidence, decisions, and snapshots.
- Agent 1 analytics depend on it as the authoritative case-history substrate.

### `lib/alignment/evidence-loader.ts`
Classification: `PARTIALLY_USED`
Reason:
- Purpose Alignment evidence is reliably loaded and converted into governed memory.
- The loader is useful and safe, but its carried-forward intelligence had not been used to produce cross-assessment product summaries.

### `lib/product/evidence-memory-lifecycle-contract.ts`
Classification: `CONTRACT_ONLY`
Reason:
- The taxonomy is strong and important.
- It governs how closure should be judged.
- It is not itself a surfaced intelligence asset.

### `pages/api/decision-centre/cases.ts`
Classification before this pass: `PARTIALLY_USED`
Classification after this pass: `LIVE_AND_USED`
Reason:
- Before this pass it assembled living case state, checkpoints, and memory, but left core proprietary intelligence hidden.
- After this pass it carries decision velocity, what changed, cross-assessment intelligence, and a safe contradiction map in the API object.

### `pages/decision-centre.tsx`
Classification: `PARTIALLY_USED`
Reason:
- The page already renders governed case state and memory.
- The new proprietary intelligence objects are now present in the API contract, but UI surfacing remains Agent 2 scope.

## Hidden Asset Summary

### Live and already defensible
- Checkpoint persistence and response history
- Journey store and longitudinal case memory
- Pattern recurrence
- Arbiter enforcement

### Live but hidden before this pass
- Cross-assessment interference
- Contradiction graph state
- Decision kernel graph metrics
- Timestamp-backed behavioural velocity

### Safe to surface with product adapters
- Irreversibility estimate
- Portfolio pattern memory
- Organisation divergence summary
- Purpose Alignment carried-forward evidence

### Unsafe to expose raw
- Kernel formulas
- Contradiction graph nodes/edges/weights
- Arbiter enforcement internals
- Prompt logic or synthesis mechanics

## Agent 1 Activation Output

Implemented in this pass:
- `lib/analytics/decision-velocity.ts`
- `lib/analytics/what-changed.ts`
- `lib/analytics/cross-assessment-intelligence.ts`
- `lib/analytics/contradiction-graph-presenter.ts`
- Decision Centre contract/API wiring for those objects

Still intentionally not done in Agent 1 scope:
- Rendering these objects in Decision Centre UI
- Executive Reporting compression
- Strategy Room hero and timeline
- Delivery, verification, and proof-pack infrastructure

## Governing Notes

- A stored signal is not surfaced intelligence until the user or operator receives a safe, useful implication.
- No formulas, thresholds, graph weights, or prompt mechanics should be rendered directly.
- Cross-assessment intelligence should remain explanatory, not theatrical.
- Any field with missing prior state must stay conservative and say so.
