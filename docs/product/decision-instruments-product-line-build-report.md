# Decision Instruments Product Line — Build Report

Generated: 2026-05-10

## Routes Created

| Route | Type | Status |
|---|---|---|
| `/decision-instruments/signal` | Free Decision Signal | **LIVE** |
| `/decision-instruments/escalation-readiness-scorecard/run` | Tier 1A instrument | **LIVE** |
| `/decision-instruments/structural-failure-diagnostic-canvas/run` | Tier 1A instrument | **LIVE** |
| `/decision-instruments/execution-risk-index/run` | Tier 1A instrument | **LIVE** |
| `/decision-instruments/team-alignment-gap-map/run` | Tier 1A instrument | **LIVE** |
| `/decision-instruments/history` | User result timeline | **LIVE** |
| `/api/pdf/decision-instrument-dossier` | Dossier export API | **LIVE** |

## Engines Created

| Engine | Dimensions | Output |
|---|---|---|
| `lib/instruments/escalation-readiness-scorecard/engine.ts` | 5 | Readiness band, escalation path, blockers |
| `lib/instruments/structural-failure-diagnostic-canvas/engine.ts` | 6 | Failure pattern, root cause, repair path |
| `lib/instruments/execution-risk-index/engine.ts` | 8 | Risk index, decay projection, authority gap |
| `lib/instruments/team-alignment-gap-map/engine.ts` | 6×2 | Alignment score, gap map, divergence signal |

## Runners Created

| Component | Input Type |
|---|---|
| `EscalationReadinessRunner.tsx` | 5 sliders |
| `StructuralFailureCanvasRunner.tsx` | 6 sliders |
| `ExecutionRiskIndexRunner.tsx` | 8 sliders |
| `TeamAlignmentGapMapRunner.tsx` | 6×2 dual sliders |

## PDF Export Status

- Dossier API route exists at `/api/pdf/decision-instrument-dossier`
- Returns structured JSON dossier from stored result
- Full PDF rendering available through existing PDF pipeline

## Result Persistence

- All instruments POST to `/api/decision-instruments/results`
- Results stored in DiagnosticJourney with `diagnosticType: "instrument_result"`
- History page fetches and displays all past results

## Decision Centre Integration

- Results write to diagnostic journey (same system as Fast Diagnostic)
- Decision Centre can display instrument results alongside case records
- Earned progression logic respects instrument completion state

## Pricing / Catalog Status

| Product | Price | Catalog Status |
|---|---|---|
| Decision Signal | Free | No checkout — free route |
| Decision Exposure | £29 | Existing catalog entry |
| Mandate Clarity | £49 | Existing catalog entry |
| Intervention Path | £79 | Existing catalog entry |
| Escalation Readiness Scorecard | £19 | Needs catalog entry (run page exists) |
| Structural Failure Canvas | £19 | Needs catalog entry (run page exists) |
| Execution Risk Index | £29 | Needs catalog entry (run page exists) |
| Team Alignment Gap Map | £29 | Needs catalog entry (run page exists) |
| Operator Decision Pack | £129 | Existing catalog entry |
| Governance Suite | £495 | Future — not in catalog |
| Board Decision Pack | £129+ | Future — not in catalog |

## Claim Safety

- No instrument exposes formula weights
- No instrument claims "verified" outcomes
- All results include evidence posture caveat
- All scores are labelled as "estimate based on your inputs"
- No inactive product goes to checkout

## Remaining Suspended Instruments

| Instrument | Status | Sequence |
|---|---|---|
| Governance Drift Detector | Engine not built | Phase 2 batch |
| Strategic Priority Stack Builder | Engine not built | Phase 2 batch |
| Board Brief Template (Structured) | Engine not built | Phase 2 batch |
| 3 Playbooks (interactive) | Not built | Phase 4 |
| 7 Strategic Frameworks (interactive) | Not built | Phase 5 |

## Guard Results

All 9 guards pass.

## Build Result

`next build`: PASS
