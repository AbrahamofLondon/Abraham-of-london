# ER → Boardroom Bridge

## Purpose

The ER → Boardroom Bridge proves the governed escalation path from Executive Reporting output to Boardroom Mode qualification. It demonstrates that Executive Reporting outputs can be deterministically mapped into an IntelligenceSpine and then evaluated by the Boardroom Mode adapter without manual interpretation.

This bridge is a **dry-run only** — it uses synthetic fixtures, does not render PDF, does not persist artefacts, and does not call any DB-bound services.

## Architecture

```
ExecutiveReport
    │
    ▼
mapExecutiveReportToIntelligenceSpine()
    │
    ▼
IntelligenceSpine (mapped)
    │
    ▼
boardroomModeAdapter.run()
    │
    ├── qualifiesForBoardroom() → gate result
    └── generateBoardroomDossier() → dossier preview
    │
    ▼
BridgeDecision: QUALIFIES | BORDERLINE | DOES_NOT_QUALIFY | MAPPING_INSUFFICIENT
```

## Mapping Rules

| Source (ExecutiveReport) | Target (IntelligenceSpine) | Kind | Confidence |
|---|---|---|---|
| `financialExposure.totalExposure` | `economics.estimatedMonthlyCost` | direct | high |
| `state` | `deterministic.conditionClass` (DISORDERED→instability, MISALIGNED→execution, ORDERED→execution) | derived | high |
| `narrative.summary` | `synthesis.verdict` | derived | medium |
| `failureModes` | `deterministic.contradictionSet` | derived | high |
| `priorityStack[0]` | `synthesis.concreteMove` | derived | medium |
| `narrative.headline` | `case.decision` | derived | medium |
| `narrative.mandate` | `case.forcedAction` | derived | medium |
| `resonance.telemetry.averageDissonance` | `c3.specificityScore` (inverted) | derived | low |

## Known Mapping Gaps

| Missing Source | Target Field | Impact | Recommendation |
|---|---|---|---|
| `hcdAggregate` | `spine.humanCapital` (no equivalent field) | medium | Extend IntelligenceSpine with humanCapital field |
| `ogr` (sovereignCertainty, integrationTax) | `spine.governance` (no equivalent field) | medium | Extend IntelligenceSpine with governance field |
| `financialExposure.replacementCost` | `spine.economics` (only totalExposure mapped) | low | Add separate economics fields for breakdown |
| `resonance.telemetry` domain details | `spine.c3.missing` | low | Add domain resonance data to spine context |

## Limitations

1. Uses synthetic ExecutiveReport fixtures — not real campaign data.
2. Mapped IntelligenceSpine is synthetic — not a real user spine from production DB.
3. Does not render PDF. PDF export route is not called.
4. Does not call executive-report-service.ts or fetch real Executive Reporting run state.
5. Does not persist bridge artefacts — no DB writes, no archive events.
6. Does not issue client-facing board papers or BOARD_RESTRICTED documents.
7. Does not validate payment or entitlement gate (DB-bound, not callable).
8. HCD and OGR data is lost in mapping — IntelligenceSpine has no equivalent fields.
9. Domain-level resonance telemetry is not preserved in mapped spine.

## Promotion Requirements

1. Wire real ExecutiveReport from production pipeline instead of synthetic fixtures.
2. Extend IntelligenceSpine with humanCapital/humanDynamics field to preserve HCD data.
3. Extend IntelligenceSpine with governance/manifest field to preserve OGR data.
4. Add PDF render dry-run adapter (section list returned, no binary output).
5. Add lineage event simulation for BRIDGE_EXECUTED.
6. Validate bridge decision against manual review of mapped spine.

## Why PDF/Export is Excluded

The bridge adapter is a **dry-run simulation** that proves the escalation path. PDF rendering and client-facing export are production concerns that require:
- Binary output handling (not suitable for Foundry dry-runs)
- DB-bound service calls for report state
- Lineage event emission for audit trails
- Payment/entitlement gate validation

These are explicitly excluded from the bridge adapter scope and listed in `pipelineStagesNotCalled`.

## How This Supports Report Lineage Simulation

The bridge proves that:
1. ExecutiveReport can be deterministically mapped to IntelligenceSpine
2. The mapped spine can be evaluated by Boardroom Mode
3. The bridge decision (QUALIFIES/BORDERLINE/DOES_NOT_QUALIFY/MAPPING_INSUFFICIENT) provides a clear escalation outcome

This creates the foundation for report lineage simulation where:
- Each report generation event can be traced through the bridge
- Mapping traces provide audit trail for field-level transformations
- Bridge decisions provide the qualification gate outcome
- Mapping gaps highlight where data is lost in transformation

## Bridge Decision Rules

| Decision | Condition |
|---|---|
| QUALIFIES | Boardroom adapter qualifies=true AND no high-impact mapping gaps |
| BORDERLINE | Boardroom adapter qualifies=false but threshold/reasons indicate close qualification OR medium-impact gaps affect confidence |
| DOES_NOT_QUALIFY | Boardroom adapter qualifies=false AND mapping is sufficient |
| MAPPING_INSUFFICIENT | Any high-impact mapping gap affects required boardroom fields |

## Semantic Fix Standard

This bridge follows the [Foundry Fix Standard](../foundry-fix-standard.md). All semantic mappings are named, source-traced, limited, tested, and documented.

### Named Rules Used

| Rule ID | Description |
|---|---|
| `bridge:financial_exposure_monthly_normalisation_v1` | ER totalExposure / 12 → estimatedMonthlyCost |
| `bridge:er_state_to_spine_condition_class_v1` | ER state → spine condition class |
| `bridge:failure_modes_to_contradiction_set_v1` | ER failure modes → spine contradiction set |
| `bridge:narrative_to_synthesis_v1` | ER narrative → spine synthesis |
| `bridge:priority_stack_to_concrete_move_v1` | ER priority stack → spine concrete move |
| `bridge:resonance_to_c3_specificity_v1` | ER average dissonance → C3 specificity score |
| `bridge:hcd_ogr_data_loss_v1` | HCD/OGR data lost in mapping |

### Why Direct Mappings Are Dangerous

Directly mapping `totalExposure` to `estimatedMonthlyCost` would be wrong because:
- `totalExposure` combines annualised execution loss and one-off replacement cost
- Boardroom Mode expects a monthly cost figure
- Without normalisation, every ER fixture would qualify for boardroom regardless of state

### Why sourceRule Is Mandatory

Every `mappingTrace.sourceRule` must resolve to an entry in `lib/research/foundry-rule-registry.ts`. This ensures:
- No derived mapping is untraced
- Every approximation is documented with its limitation
- Future audits can trace why a mapping exists

### Why Approximations Must Be Labelled

The `confidence` field on each trace indicates how reliable the mapping is:
- `high`: direct, lossless mapping
- `medium`: derived with reasonable approximation
- `low`: heuristic with significant information loss

### Why Passing Tests Is Not Enough

Tests verify behaviour at a point in time. Named rules, limitations, and documentation ensure that future maintainers understand:
- Why a mapping exists
- What it approximates
- What would replace it
