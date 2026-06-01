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
| team-respondent-aggregation.ts | TeamRespondentAggregation | ACTIVE | Active Team Assessment form and submit route capture respondentData, persist aggregate-only journey evidence, and gate divergence claims until at least 2 respondent records exist |
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

### Product Assets Requiring Status Authority
| File | Key Exports | Risk If Ignored |
|------|-------------|-----------------|
| boardroom-history-summary.ts | summarizeBoardroomHistory | Medium — boardroom mode cannot show history |
| case-sharing-provenance.ts | SharedCaseVerifyResult | Low — sharing not yet live |
| constitutional-living-adapter.ts | ConstitutionalReport | ACTIVE — `components/diagnostics/ConstitutionalDiagnostic.tsx` passes `constitutionalStructural` into `buildConstitutionalLivingViewModel`; latest structuralFacts take priority |
| counsel-review-ledger.ts | CounselReviewLedger | Medium — counsel review has no persistent ledger |
| decision-case-composer.ts | composeDecisionCase | Medium — case composition not automated |
| decision-centre-living-adapter.ts | buildDecisionCentreLivingViewModel | ACTIVE — `pages/decision-centre.tsx` imports and renders `buildDecisionCentreLivingViewModel` |
| decision-dependency-graph.ts | DecisionDependency | Medium — dependency graph not visualised |
| decision-loss-register.ts | DecisionLossRegister | Low — loss tracking not prioritised |
| evidence-carry-forward-presenter.ts | buildExecutiveEvidenceCarryForward, buildExecutiveCaseEvidenceCarryForward | ACTIVE — production Executive Reporting public DTO consumes safe carry-forward evidence and result UI renders board-grade judgement |
| evidence-memory-safety.ts | assertClientSafeEvidenceMemory | Medium — safety assertions not enforced |
| executive-reporting-public-dto.ts | toExecutiveReportingPublicResult | ACTIVE — App Router Executive Reporting run returns the public DTO with executiveJudgement and carry-forward evidence |
| financial-exposure-memory.ts | convertFinancialExposureToGovernedMemory | Medium — financial memory not in governed panel |
| institutional-case-service.ts | CreateFromERInput | Medium — institutional case creation not automated |
| governed-automation-orchestrator.ts | AutomationSweepResult | Low — automation not prioritised |

### Oversight / Retainer Subsystem
Oversight and retainer assets are mostly `GATED` or `PARTIALLY_WIRED`, not production-active retained oversight:
- oversight-brief-* (composer, contract, delivery, efficacy)
- oversight-cadence-* (contract, engine)
- oversight-cycle-* (archive, comparison, consequence, ledger)
- oversight-delivery-* (contract, service)
- oversight-review-* (cycle, decision contract, decision engine, ledger)
- oversight-scheduler-* (contract, engine)
- oversight-signal-builder.ts

**Risk:** Many oversight assets exist and some are tested or callable, but the retainer oversight production path is not yet connected to durable recommendation/outcome memory, recurrence, drift, and oversight cadence. Retainer Oversight remains gated as a corridor claim until that memory threshold is met.

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
| 1 | Evidence Carry-Forward Presenter | evidence-carry-forward-presenter.ts | REPORTING | ACTIVE — production Executive Reporting DTO/result path consumes public-safe carry-forward evidence |
| 2 | Executive Reporting Public DTO | executive-reporting-public-dto.ts | REPORTING | ACTIVE — public output contract includes executiveJudgement, evidence gaps, gated recommendation, and Boardroom dossier boundary |
| 3 | DomainInterdependency | domain-interdependency.ts | INTELLIGENCE | GATED — requires contradictionGraph + domainScores; domainScores exist but contradictionGraph is not produced |
| 4 | Oversight Cadence Engine | oversight-cadence-engine.ts | RETAINER | GATED — requires durable retained cadence data |
| 5 | Oversight Cycle Comparison | oversight-cycle-comparison.ts | RETAINER | GATED — requires multiple completed oversight cycles |
| 6 | Oversight Review Decision Engine | oversight-review-decision-engine.ts | RETAINER | GATED — requires recommendation/outcome memory |
| 7 | Behavioral Trend Engine (full) | behavioral-trend-engine.ts | EVIDENCE | PARTIALLY_WIRED — computation exists, retained oversight consumption incomplete |
| 8 | ScenarioStressTest | scenario-stress-test.ts | SIMULATION | PARTIALLY_WIRED — enterprise orchestrator invokes `analyseScenarioResponse` for valid scenario-bank IDs and affects findings/engine trace; not full downstream executive/reporting simulation yet |
| 9 | ContradictionForcing | contradiction-forcing.ts | CONTRADICTION | GATED — answer-pattern contradictions not invoked by production path |
| 10 | Team Respondent Aggregation | team-respondent-aggregation.ts | CAPTURE | ACTIVE — explicit respondent capture persists aggregate-only evidence and drives orchestrator evidenceBasis/unresolvedItems when respondent count >= 2 |

### Corrected Stale Findings

| Capability | Corrected Status | Authority Note |
|------------|------------------|----------------|
| ScenarioStressTest | PARTIALLY_WIRED | Enterprise scenario responses are captured with `ENTERPRISE_SCENARIO_IDS`, the orchestrator invokes `analyseScenarioResponse` for valid `SCENARIOS` IDs, and scenario findings affect output/engine trace. Scenario-bank constants now prevent form/bank ID drift. This is still not full enterprise simulation until downstream executive/reporting surfaces consume the findings. |
| Decision Centre Living Adapter | ACTIVE | `pages/decision-centre.tsx` imports and uses `buildDecisionCentreLivingViewModel`. |
| Constitutional Living Adapter | ACTIVE | `components/diagnostics/ConstitutionalDiagnostic.tsx` passes `constitutionalStructural` into `buildConstitutionalLivingViewModel`; latest structuralFacts take priority over legacy derivation. |
| DomainInterdependency | GATED | Requires contradictionGraph + domainScores; domainScores exist but contradictionGraph is not produced. |
| Team Respondent Aggregation | ACTIVE | Active Team Assessment captures explicit respondent fields, persists respondentData as aggregate-only journey evidence, retrieves prior respondents by shared caseId/reference, and gates divergence claims until respondentCount >= 2. |
| Retainer/Oversight | Mostly GATED/PARTIALLY_WIRED | Many oversight assets exist, but retained oversight production is not connected to durable recommendation/outcome/recurrence cadence. |
| Evidence Carry-Forward Presenter | ACTIVE | Production Executive Reporting public DTO uses carry-forward evidence to build board-grade judgement, evidence gaps, decision options, and gated recommendations without exposing raw payloads. |

## Duplicate/Overlap Risks

| Risk | Files | Recommendation |
|------|-------|----------------|
| Two `convertFinancialExposureToGovernedMemory` exports | financial-exposure-memory.ts + financial-exposure-persistence.ts | Consolidate into one |
| Two `convertPurposeAlignmentToGovernedMemory` exports | alignment/evidence-memory.ts + alignment/evidence-loader.ts | Consolidate into one |
| `session-case-continuity.ts` re-exports from `save-case-continuity.ts` | Both files | Remove legacy shim |

## Next 10 Wiring Priorities

| # | Action | Unblocks |
|---|--------|----------|
| 1 | Carry ScenarioStressTest output into Executive Reporting / downstream reporting | Full enterprise scenario carry-forward |
| 2 | Wire ContradictionForcing into orchestrator for answer-pattern surfaces | Deep contradiction detection |
| 3 | Wire oversight-cadence-engine.ts | Retainer oversight cadence |
| 4 | Wire oversight-cycle-comparison.ts | Cross-cycle learning |
| 5 | Keep Decision Centre Living Adapter active and monitor production output | DC living view model |
| 6 | Extend durable recommendation/outcome carry-forward coverage | Executive evidence carry-forward history |
| 7 | Wire behavioral-trend-engine.ts fully | Behavioral trend in oversight |
| 8 | Wire boardroom-archive persistence | Boardroom Mode history |
| 9 | Keep Constitutional Living Adapter active and monitor structuralFacts priority | Constitutional living results |
| 10 | Wire oversight-review-decision-engine.ts | Automated review decisions |
