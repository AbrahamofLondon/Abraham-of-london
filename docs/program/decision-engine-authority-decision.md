# Decision Engine Authority Decision

Status: PHASE 1.5 TARGET SELECTED, NOT IMPLEMENTED
Date: 2026-07-18

## Selected Option

`LAYERED_CANONICAL_ARCHITECTURE`

Target sequence:

1. Intake transform: public-safe situation translation and aperture control.
2. Evaluation authority: one canonical decision-state evaluator per workflow.
3. Judgement composer: derived judgement referencing the authoritative state version.
4. Workflow orchestrator: route sequencing, access, persistence, response shaping.

## Evidence

- Public Free Signal currently invokes `DecisionIntelligenceKernel.process()`, `runDecisionIntelligence()`, `persistPublicSignalFromDecisionIntelligence()` and `composeCaseDerivedJudgement()` inside `pages/api/public/kernel-signal.ts`.
- Governed App Router paths such as executive reporting and Strategy Room invoke `evaluateDecision()` directly.
- `runConstitutionalOrchestration()` routes constitutional signal packets and returns bridges, but does not persist.
- `composeCaseDerivedJudgement()` produces customer-visible judgement but does not read or write state.
- `SharedMemoryBridge` has no runtime callers and is not authoritative.

## Rejected Options

- `INTELLIGENCE_KERNEL_CANONICAL`: rejected because governed App Router and instrument paths already use `evaluateDecision()` as their evaluator.
- `DECISION_KERNEL_CANONICAL`: rejected as an immediate state because public Free Signal does not currently call `evaluateDecision()` and must not import it directly.
- `RETIRE_AND_REBUILD`: rejected because existing engines have separable roles and can be governed by a single-record contract.

## Migration Consequences

- Public adapter work must wait until the public route has an explicit reconciliation contract or a single evaluation authority.
- Judgement composers must stop being treated as evaluators and must reference a canonical state version once durable state versioning exists.
- Orchestrators may sequence but cannot own canonical decision truth.

## Compatibility Period

Compatibility remains open through Phase 2 until public adapter, persistence durability and version linkage tests prove the layered contract end to end.

## Removal Plan

- Remove direct public use of `DecisionIntelligenceKernel.process()` as an evaluator only after equivalent intake/aperture output exists.
- Keep `evaluateDecision()` out of public routes; expose it through a server-side adapter only after the single-record contract is enforceable.
- Quarantine or retire duplicate fact derivations once authoritative state versioning exists.

## Rollback Plan

Revert the Phase 1.5 contract/report commit. No runtime graph accumulation, Redis, kernel merge, kernel retirement or router migration is introduced by this decision.
