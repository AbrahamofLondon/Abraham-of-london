# Codebase Capability Census

Generated: 2026-06-01

## Executive Summary

This census maps 400+ code assets across lib/, components/, pages/, app/, and tests/ into the product corridor. It identifies active, partially wired, dormant, gated, and legacy capabilities.

### Key Metrics

| Category | Count |
|----------|-------|
| Total modules audited | 400+ |
| ACTIVE (invoked, affects output) | ~80 |
| PARTIALLY_WIRED (1-2 imports) | ~60 |
| GATED (blocked by dependency) | ~30 |
| DORMANT (0 imports, no tests) | ~50 |
| INTERNAL (admin/operator only) | ~20 |

## Layer 1: Intelligence Engines (lib/intelligence, lib/engine)

### Registered Engines (60 total)
All engines in `engine-activation-registry.ts` are classified. No unregistered engine files found in `lib/engine/`.

### Unregistered Intelligence Assets
| File | Key Exports | Status | Recommendation |
|------|-------------|--------|----------------|
| decision-intelligence-kernel.ts | DecisionIntelligenceKernel | ACTIVE (13 imports) | Register as ACTIVE/SYNTHESIS |
| progressive-evidence-capture.ts | ProgressiveEvidenceCaptureResult | ACTIVE (5 imports) | Register as ACTIVE/EVIDENCE_MEMORY |
| team-respondent-aggregation.ts | TeamRespondentAggregation | ACTIVE (3 imports) | Register as ACTIVE/EVIDENCE_MEMORY |
| admin-fulfilment.ts | AdminFulfilmentEngine | ACTIVE (9 imports) | Register as INTERNAL/OUTPUT |
| watermark-delegate.ts | WatermarkPayload | INTERNAL (11 imports) | Register as INTERNAL/OUTPUT |
| forensic-mapping.ts | generateForensicPayload | INTERNAL (6 imports) | Register as INTERNAL/OUTPUT |
| tiered-disclosure.ts | DisclosureTier | ACTIVE (6 imports) | Register as ACTIVE/OUTPUT |
| GMI subsystem (19 files) | Market intelligence | GATED (low imports) | Register as GATED/EVIDENCE_MEMORY |
| Market Intelligence (9 files) | Intelligence sourcing | GATED (low imports) | Register as GATED/EVIDENCE_MEMORY |

## Layer 2: Product Contracts (lib/product)

### High-Integration Assets (6+ imports)
| File | Import Count | Status |
|------|-------------|--------|
| governed-memory-contract.ts | 15 | ACTIVE |
| field-provenance-contract.ts | 14 | ACTIVE |
| evidence-capture-contract.ts | 12 | ACTIVE |
| efficacy-contract.ts | 8 | ACTIVE |
| delivery-audit-contract.ts | 7 | ACTIVE |
| diagnostic-journey-record.ts | 7 | ACTIVE |
| client-safe-oversight-brief.ts | 7 | ACTIVE |
| decision-case-contract.ts | 6 | ACTIVE |

### Dormant Product Assets (0 imports)
| File | Key Exports | Risk If Ignored |
|------|-------------|-----------------|
| boardroom-history-summary.ts | summarizeBoardroomHistory | Medium — boardroom mode cannot show history |
| case-sharing-provenance.ts | SharedCaseVerifyResult | Low — sharing not yet live |
| constitutional-living-adapter.ts | ConstitutionalReport | Medium — constitutional results not living-adapted |
| counsel-review-ledger.ts | CounselReviewLedger | Medium — counsel review has no persistent ledger |
| decision-case-composer.ts | composeDecisionCase | Medium — case composition not automated |
| decision-centre-living-adapter.ts | buildDecisionCentreLivingViewModel | High — DC living view model builder not wired |
| decision-dependency-graph.ts | DecisionDependency | Medium — dependency graph not visualised |
| decision-loss-register.ts | DecisionLossRegister | Low — loss tracking not prioritised |
| evidence-carry-forward-presenter.ts | buildExecutiveEvidenceCarryForward | High — executive carry-forward not presented |
| evidence-memory-safety.ts | assertClientSafeEvidenceMemory | Medium — safety assertions not enforced |
| executive-reporting-public-dto.ts | toExecutiveReportingPublicResult | High — ER public output not wired |
| financial-exposure-memory.ts | convertFinancialExposureToGovernedMemory | Medium — financial memory not in governed panel |
| institutional-case-service.ts | CreateFromERInput | Medium — institutional case creation not automated |
| governed-automation-orchestrator.ts | AutomationSweepResult | Low — automation not prioritised |

### Oversight Subsystem (20+ dormant files)
The entire oversight subsystem has ~20 dormant files with 0 imports each:
- oversight-brief-* (composer, contract, delivery, efficacy)
- oversight-cadence-* (contract, engine)
- oversight-cycle-* (archive, comparison, consequence, ledger)
- oversight-delivery-* (contract, service)
- oversight-review-* (cycle, decision contract, decision engine, ledger)
- oversight-scheduler-* (contract, engine)
- oversight-signal-builder.ts

**Risk:** The retainer oversight corridor claims capabilities that depend on these dormant assets. Until wired, retainer oversight is aspirational.

## Layer 3: Follow-Up Engines (lib/follow-up)

**10 of 15 files are DORMANT (0 imports):**
| File | Key Exports | Status |
|------|-------------|--------|
| breach-escalation.ts | computeBreachEscalation | DORMANT |
| conversion-signals.ts | ConversionSignals | DORMANT |
| decision-credit-score.ts | computeDecisionCreditScore | DORMANT |
| forced-escalation.ts | checkForcedEscalation | DORMANT |
| inbound-filter.ts | qualifyUser | DORMANT |
| integrity-scoring.ts | computeIntegrityScore | DORMANT |
| lie-detection.ts | checkEconomicSanity | DORMANT |
| pressure-index.ts | computePressureIndex | DORMANT |
| register-loop-client.ts | registerPressureLoopFromSpine | DORMANT |
| retargeting-segments.ts | RetargetProfile | DORMANT |

**Partially wired (1-2 imports):**
- escalation-engine.ts (1 import)
- north-star-metrics.ts (2 imports)
- pressure-loop.ts (1 import)
- self-contradiction-audit.ts (0 imports)
- system-integrity-mode.ts (1 import)

## Layer 4: Instruments (lib/instruments)

| File | Status | Note |
|------|--------|------|
| governed-instrument-contract.ts | PARTIALLY_WIRED (1 import) | Instrument registry exists but unused in runtime |
| instrument-pack-contract.ts | DORMANT | Pack system not wired |
| operator-pack.ts | DORMANT | Operator workflow not wired |

## Layer 5: Evidence Pipeline (lib/evidence)

| File | Status | Note |
|------|--------|------|
| case-study-types.ts | PARTIALLY_WIRED (2 imports) | Types defined, generation exists |
| case-study-generator.ts | PARTIALLY_WIRED (1 import) | Generator exists, not in production |
| evidence-integrity-seal.ts | PARTIALLY_WIRED (1 import) | Seal system exists, not enforced |
| case-review-policy.ts | PARTIALLY_WIRED (1 import) | Review policy exists, not wired |
| case-eligibility.ts | PARTIALLY_WIRED (1 import) | Eligibility check exists |
| case-draft-builder.ts | DORMANT | Draft builder not wired |
| case-draft-types.ts | DORMANT | Draft types not used |

## Layer 6: Behavioral Intelligence (lib/behavioral)

| File | Status | Note |
|------|--------|------|
| behavioral-trend-contract.ts | ACTIVE (6 imports) | Core behavioral types |
| behavioral-signal-snapshot-store.ts | ACTIVE (2 imports, tested) | Snapshot persistence |
| behavioral-trend-engine.ts | PARTIALLY_WIRED (1 import, tested) | Trend computation exists |
| behavioral-signal-snapshot-contract.ts | PARTIALLY_WIRED (1 import) | Record types |

## High-Value Dormant Capabilities (Top 10)

| # | Capability | File | Layer | Impact |
|---|-----------|------|-------|--------|
| 1 | Decision Centre Living Adapter | decision-centre-living-adapter.ts | OUTPUT | DC view model not built from living case |
| 2 | Evidence Carry-Forward Presenter | evidence-carry-forward-presenter.ts | REPORTING | Executive evidence not carried forward |
| 3 | Executive Reporting Public DTO | executive-reporting-public-dto.ts | REPORTING | ER public output not structured |
| 4 | Oversight Cadence Engine | oversight-cadence-engine.ts | RETAINER | Retainer cadence not automated |
| 5 | Oversight Cycle Comparison | oversight-cycle-comparison.ts | RETAINER | Cross-cycle learning not wired |
| 6 | Oversight Review Decision Engine | oversight-review-decision-engine.ts | RETAINER | Review decisions not automated |
| 7 | Behavioral Trend Engine (full) | behavioral-trend-engine.ts | EVIDENCE | Only 1 import, needs wider wiring |
| 8 | ScenarioStressTest | scenario-stress-test.ts | SIMULATION | Enterprise scenarios analysed but not by orchestrator |
| 9 | ContradictionForcing | contradiction-forcing.ts | CONTRADICTION | Answer-pattern contradictions not detected |
| 10 | Constitutional Living Adapter | constitutional-living-adapter.ts | OUTPUT | Constitutional results not living-adapted |

## Duplicate/Overlap Risks

| Risk | Files | Recommendation |
|------|-------|----------------|
| Two `convertFinancialExposureToGovernedMemory` exports | financial-exposure-memory.ts + financial-exposure-persistence.ts | Consolidate into one |
| Two `convertPurposeAlignmentToGovernedMemory` exports | alignment/evidence-memory.ts + alignment/evidence-loader.ts | Consolidate into one |
| `session-case-continuity.ts` re-exports from `save-case-continuity.ts` | Both files | Remove legacy shim |

## Next 10 Wiring Priorities

| # | Action | Unblocks |
|---|--------|----------|
| 1 | Wire ScenarioStressTest into orchestrator for enterprise surface | Enterprise scenario analysis |
| 2 | Wire ContradictionForcing into orchestrator for answer-pattern surfaces | Deep contradiction detection |
| 3 | Wire oversight-cadence-engine.ts | Retainer oversight cadence |
| 4 | Wire oversight-cycle-comparison.ts | Cross-cycle learning |
| 5 | Wire decision-centre-living-adapter.ts | DC living view model |
| 6 | Wire evidence-carry-forward-presenter.ts | Executive evidence carry-forward |
| 7 | Wire behavioral-trend-engine.ts fully | Behavioral trend in oversight |
| 8 | Wire boardroom-archive persistence | Boardroom Mode history |
| 9 | Wire constitutional-living-adapter.ts | Constitutional living results |
| 10 | Wire oversight-review-decision-engine.ts | Automated review decisions |
