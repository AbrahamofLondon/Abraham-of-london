# Engine Route Contracts

## Canonical spine

| Engine | File | Input | Output | Current caller | New caller | Persistence | User-visible surface | Admin-visible surface |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Assessment engine | `lib/constitution/assessment-engine.ts` | `AssessmentInput` | `ConstitutionalAssessment` | Constitutional intake flows | `lib/product/living-intelligence-spine.ts`, `app/api/executive-reporting/run/route.ts` | Journey snapshots | Constitutional diagnostics, Executive Reporting | Reporting and audit views |
| Decision kernel | `lib/decision/kernel.ts` | `KernelInput` | `DecisionKernelOutput` | Dormant/partial | Executive Reporting, Strategy Room state, Return Brief, intervention/exposure instruments, living spine | Via caller snapshots and evidence nodes | Strategy Room, Return Brief, Executive Reporting | Diagnostics and reporting audit |
| Intelligence spine | `lib/decision/intelligence-spine.ts` | Case + stage events | `IntelligenceSpine` | Diagnostic ladder | Living spine, decision credit route | Journey merged thread | Ladder continuity | Admin intelligence views |
| Synthesis engine | `lib/decision/synthesis-engine.ts` | `CaseObject` | `GovernedSynthesis` | Fast diagnostic | Living spine | Journey merged thread | Fast diagnostic / downstream narratives | Diagnostics audit |
| C3 fidelity scorer | `lib/decision/c3-fidelity-scorer.ts` | `CaseObject` | `C3Score` | Fast diagnostic | Living spine, simulation confidence context | Journey merged thread | Fidelity/confidence cues | Diagnostics audit |
| Decision state engine | `lib/execution/decision-state-engine.ts` | `SessionExecutionState` | state transition + dynamic consequence | Strategy Room execution routes | Living spine, Return Brief, Strategy Room state | `StrategyDecisionLog`, `ConsequenceTimeline`, `EscalationEvent` | Strategy Room | Enforcement audit |
| Economic model | `lib/constitution/economic.ts` | Constitutional/economic inputs | `EconomicExposure` | Diagnostic and reporting flows | Living spine, Executive Reporting | Journey/report snapshot | Executive Reporting | Reporting audit |
| Consequence model | `lib/constitution/consequence.ts` | `ConsequenceInput` | `ConsequenceNode[]` | Diagnostic flows | Living spine | Caller snapshot | Reporting / consequence panels | Reporting audit |
| Cost-of-delay engine | `lib/diagnostics/cost-of-delay-engine.ts` | Delay inputs | `CostOfDelayResult` | Diagnostics | Living spine | Caller snapshot | Reporting and pricing surfaces | Reporting audit |
| Cross-respondent engine | `lib/diagnostics/cross-respondent-engine.ts` | Respondent score sets | `CrossRespondentResult` | Team / enterprise aggregation | Living spine | `MultiStakeholderResult`, evidence nodes | Team evidence surfaces | Enterprise / admin reporting |
| Outcome evidence | `lib/outcomes/evidence.ts` | Session/org filter | `OutcomeEvidenceSummary` | Executive Reporting, Return Brief | Living spine, outcome verification | `OutcomeVerificationRecord` | Executive Reporting, Return Brief | Outcome ledger |
| Calibration confidence | `lib/calibration/calibration-engine.ts` | Prediction vs outcome events | `CalibrationAdjustment` | Calibration cron | Living spine | Calibration state/events | Indirect confidence signals | Calibration admin routes |
| Decision credit score | `lib/follow-up/decision-credit-score.ts`, `lib/decision-ledger/ledger-service.ts` | Spine history + ledger | score/trend/profile | Decision credit API | Living spine, API-ready credit route | contracts, outcomes, journeys, evidence nodes | Decision credit API | Ledger/admin views |
| Governance impact simulation | `lib/alignment/governance-logic.ts` | telemetry domains + proposed action | contagion map + `ImpactSimulation` | Alignment flows | Executive Reporting, Strategy Room state, living spine | Caller snapshot | Executive Reporting, Strategy Room | Governance audit |
| Action simulation | `lib/decision/simulation-engine.ts` | action + spine | `SimulationResult` | Dormant/partial | Strategy Room state, living spine | Caller snapshot | Strategy Room | Admin diagnostics |
| Execution record | `lib/strategy-room/execution-record.ts` | locked execution record payload | canonical execution record | Legacy locked-record route | `POST /api/strategy-room/execution-record`, session create, Return Brief, outcome verification | `DiagnosticEvidenceNode(kind=execution_record)` | Strategy Room qualification / execution continuity | Audit trail |
| Google Calendar behavioral evidence contract | `lib/integrations/behavioral-evidence-contract.ts` | user/session/commitment context | provider-neutral behavioral evidence contract | Existing Google Calendar sync only | Strategy Room verification, Pattern-Breaker compatibility, future outcome verification | provider sync storage + caller persistence | Settings / future verification surfaces | Integration audit |

## Route wiring

| Route / surface | Engine contract now enforced |
| --- | --- |
| `POST /api/executive-reporting/run` | decision kernel, governance impact simulation, DB-backed outcome evidence |
| `GET /api/strategy-room/execution/[id]/state` | decision kernel, governance impact simulation, action simulations |
| `POST /api/strategy-room/execution-record` | canonical execution-record persistence |
| `POST /api/strategy-room/execution/locked-record` | legacy compatibility wrapper to canonical execution-record persistence |
| `GET /api/strategy-room/briefing/return/[sessionId]` | decision kernel via return-brief generator, DB-backed outcome evidence, execution-record read-through |
| `GET /api/diagnostics/outcome` | outcome verification + execution-record read-through |
| `GET /api/decision/credit-score` | API-ready reliability, follow-through, delay pattern, improvement trend |

## Decorative component classification

| Component | Classification | Reason | Action |
| --- | --- | --- | --- |
| `components/alignment/SovereignPortfolioIndex.tsx` | `keep roadmap` | No production route wiring found | Keep dormant until fed by real market data |
| `components/alignment/MarketCaptureDashboard.tsx` | `keep roadmap` | No active caller found | Do not surface until real market feed exists |
| `components/alignment/VelocityVectorSimulation.tsx` | `label as projection` | Simulation framing but not wired to live engine outputs | If surfaced, label as projected model until real inputs are attached |
| `components/alignment/SovereignDecisionEngine.tsx` | `label as projection` | Name implies live authority engine but no live caller found | Do not present as live unless wired to kernel/living spine |
| `components/alignment/OGRFutureHorizon.tsx` | `keep roadmap` | No active caller found | Roadmap only |
| `components/alignment/AsymmetricScaleForecast.tsx` | `keep roadmap` | No active caller found | Roadmap only |
| `components/alignment/ExecutiveSynthesisDashboard.tsx` | `wire now` | Closest conceptual fit to canonical synthesis / reporting stack | Wire only through live executive-reporting canonical snapshot, otherwise label as projection |

## Notes

- Outcome evidence must be read from `OutcomeVerificationRecord` through `buildObservedOutcomeEvidenceFromDB()` when a persisted view is needed.
- The execution record is now canonicalised under `execution_record`; legacy `locked_decision_record` should not be expanded further.
- Any future production-facing surface that uses synthetic-only telemetry must state that it is a projection until live data is attached.
