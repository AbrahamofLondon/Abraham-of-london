# Advantage Intelligence Runtime Verification

Date: 2026-05-09
Status: Runtime verification completed
Scope: Hostile verification of shared intelligence components, analytics contracts, and live integrations

## Runtime Verdict

| Component | Source data | Minimum threshold | Output | Consumer surfaces | Empty state | Overclaim risk | IP risk | Verdict |
|---|---|---|---|---|---|---|---|---|
| `DecisionVelocityCard` | `DecisionVelocitySummary` from checkpoint history | At least one checkpoint for baseline; one responded checkpoint for measured history | Velocity band, average response time, open/overdue/completed/blocked counts | Decision Centre, Fast Diagnostic, Return Brief | Caller suppression; card itself expects summary | Medium: summary says "last recorded checkpoint cycle averaged" but metric is aggregate average | Low | `USEFUL_WITH_COPY_FIX` |
| `WhatChangedPanel` | `WhatChangedSummary` from current vs previous comparable state | Two dated comparable records for true before/after; otherwise baseline only | Headline plus field-by-field movement | Decision Centre, Intelligence Memory | Partial: wrapper can still render thinly if upstream passes sparse summary | High: no comparison dates in contract; many prior fields are null-backed | Low | `PARTIAL_REALITY_ONLY` |
| `CrossAssessmentInsight` | `CrossAssessmentIntelligence` from journey stages, purpose alignment, strategy state, checkpoint status | At least two relevant surfaces or one conflict pair | Conflict/reinforcement cards with involved surfaces and caution | Decision Centre, Executive Reporting, Strategy Room entry, Intelligence Memory | Safe suppression via `null` | Low | Low | `SAFE_AND_USEFUL` |
| `ContradictionMapPreview` | `ContradictionMapView` from living case or contradiction graph presenter | At least one active contradiction | Plain-language contradiction cards | Decision Centre, Executive Reporting, Intelligence Contradictions | Safe suppression via `null` | Medium: hard-coded evidence posture; missing last seen/action | Low on mechanics, medium on confidence wording | `SAFE_BUT_THIN` |
| `ClientIntelligenceStack` | `/api/decision-centre/cases` response | Authenticated API response; matching `caseId` for case-safe usage | Orchestrates shared intelligence cards | Fast Diagnostic, Return Brief, Executive Reporting, Strategy Room entry, Intelligence Memory, Intelligence Contradictions | Returns `null` when no card loads | High: defaults to `json.cases[0]` when `caseId` absent | Low | `MUST_SCOPE_BY_CASE` |
| `ArbiterBadge` | Static props plus optional status | None | Passed / corrected / incomplete quality badge | Fast Diagnostic, Executive Reporting | Caller-managed | Low | Low | `SAFE_AND_USEFUL` |
| `GovernanceDisclosure` | Static copy plus optional live session storage data | None for static mode; live block requires thread data | Governance/trust disclosure | Fast Diagnostic | Safe fallback to static copy | Medium: exposed confidence percentage lacks anchor | Medium | `SAFE_WITH_PRECISION_RISK` |
| `DiagnosticStandardPanel` | Static copy | None | Boundary-setting trust panel | Fast Diagnostic | Always safe | Low | Low | `SAFE` |
| `DecisionTracePanel` | Internal `IntelligenceSpine` | Rich internal spine data | Signals, rejected alternatives, stage history | Not part of current public rollout | No safe public suppression model | High | High | `OPERATOR_ONLY` |
| `DeterminismProof` | Internal `spine` | Full spine required | Determinism/verification framing | Not part of current public rollout | No safe public suppression model | High | High | `OPERATOR_ONLY` |
| `SpineRenderer` | Full internal spine | Rich internal state | Forecast, decay/control/risk mechanics | Not part of current public rollout | Partial | High | High | `OPERATOR_ONLY` |
| `KnowledgeGraph` | Internal graph/efficacy data | Full graph data | Ranked graph/recommendation mechanics | Not part of current public rollout | Safe empty state, unsafe strong state | High | High | `OPERATOR_ONLY` |
| `DiscoveryOverlay` | Internal discovery/admin datasets | Internal search state | Admin discovery console | Not part of current public rollout | Safe | Low product overclaim, high exposure | Medium | `OPERATOR_ONLY` |

## Analytics And Contract Trace

| Analytic | Source fields | Transformation logic | Minimum evidence threshold | Insufficiency state | Output shape | UI consumer | Source label / date / persistence | Verdict |
|---|---|---|---|---|---|---|---|---|
| `buildDecisionVelocitySummary` | `createdAt`, `dueAt`, `respondedAt`, `responseStatus` | Computes average response latency and checkpoint counts; bands off blocked/overdue/average days | One checkpoint for baseline, one responded checkpoint for measured history | `INSUFFICIENT_DATA`, baseline caution | `DecisionVelocitySummary` | `DecisionVelocityCard` | Source label present; no visible capture date; API-recomputed so survives refresh | `DATA_BACKED_NEEDS_DATE_AND_COPY_FIX` |
| `buildWhatChangedSummary` | Current/prior comparable case state | Compares bands/counts/labels field by field | Two comparable states required for true movement | Baseline headline when no previous state | `WhatChangedSummary` | `WhatChangedPanel` | Source label present; no compared dates in contract; API-recomputed | `THIN_HISTORY_NOT_YET_ROBUST` |
| `buildCrossAssessmentIntelligence` | Purpose Alignment carry-forward, constitutional payload, executive payload, strategy payload, checkpoint status, contradiction count | Emits conflict/reinforcement signals from explicit cross-surface conditions | At least one true cross-surface conflict or reinforcement | `null` plus caution when stage count low | `CrossAssessmentIntelligence` | `CrossAssessmentInsight` | No explicit source label field, but surfaces involved are visible; refresh-stable via API | `MOSTLY_SOUND` |
| `buildContradictionMapView` | Living case contradictions or contradiction graph | Converts conflict objects into user-safe contradiction cards | At least one active contradiction | `null` | `ContradictionMapView` | `ContradictionMapPreview` | No first/last seen date, no explicit source label field, refresh-stable via API | `MECHANICS_SAFE_BUT_NOT_COMPLETE` |
| `decision-centre-contract` additions | Summary fields attached to `DecisionCentreCase` | Carries API-derived intelligence into shared/public surfaces | N/A | N/A | Shared case contract | All shared surfaces | Contract lacks explicit date fields for change/contradiction/irreversibility provenance | `NEEDS_PROVENANCE_FIELDS` |
| `/api/decision-centre/cases` | Auth identity, living case, journey, checkpoints, strategy record, purpose alignment | Rebuilds user-visible intelligence from persisted records | Authenticated case data | 401 auth guard; per-card null suppression | `DecisionCentreResponse` | Decision Centre and `ClientIntelligenceStack` | Refresh-stable; source labels present in some outputs; incorrect case fallback occurs in consumer stack | `AUTHORITATIVE_BUT_CONSUMER_SCOPING_WEAK` |

## Hostile Matrix Assessment

### No data

- `DecisionVelocityCard`: safe only when caller suppresses or provides insufficiency summary.
- `WhatChangedPanel`: safe only if upstream emits baseline; wrapper alone is not enough.
- `CrossAssessmentInsight`: safe suppression.
- `ContradictionMapPreview`: safe suppression.
- `ClientIntelligenceStack`: unsafe at page level because wrapper pages can become silent shells.

### One data point

- Decision velocity behaves correctly as baseline/insufficient.
- What changed cannot produce real trend and mostly falls back to baseline or one-sided signals.
- Cross-assessment generally suppresses unless another surface exists.
- Contradiction preview can show a single contradiction safely, but still lacks temporal depth.

### Two data points

- Decision velocity can show early measured movement.
- What changed remains only partially valid because many prior fields are not persisted.
- Cross-assessment becomes meaningful where two surfaces disagree.

### Multiple data points

- Decision velocity is genuinely useful.
- Cross-assessment becomes one of the strongest moat surfaces.
- Contradiction preview remains useful but under-specified.
- What changed still underperforms because history capture is incomplete.

### Contradictory data

- Cross-assessment handles this best and stays within safe wording.
- Contradiction preview describes conflict but does not yet show first/last seen or next action.

### Stale data

- Decision Centre case memory and checkpoints show dates.
- Shared intelligence cards do not consistently show explicit dates.
- Irreversibility surfaces lack provenance/date context.

### Sensitive/raw respondent data

- Shared advantage cards do not expose raw respondent text.
- Team evidence on Return Brief is aggregated and labelled.
- Older operator-grade intelligence components remain unsafe for public exposure.

### Estimated financial or irreversibility data

- Irreversibility copy is cautious.
- Executive Reporting and Strategy Room session clearly call the result an estimate.
- Decision Centre does not show a source label/date for irreversibility.

## Surface Verdict

| Surface | Verdict | Reason | Required action |
|---------|---------|--------|-----------------|
| Decision Centre | `PARTIAL` | Strongest integrated runtime surface, but `What changed` lacks dated comparison and irreversibility lacks provenance. | Add comparison dates and irreversibility source/date. |
| Fast Diagnostic | `PARTIAL` | Arbiter badge is safe; decision velocity is useful but initially synthetic. | Label baseline vs measured more explicitly. |
| Return Brief | `FAIL` | Shared velocity stack is unscoped and can resolve to the wrong case. | Pass actual case id/session-linked case id. |
| Executive Reporting | `FAIL` | Unscoped stack, duplicate contradiction surfacing, unsupported AI baseline benchmark copy. | Scope by case, remove duplicate contradiction block, remove unsupported benchmark wording. |
| Strategy Room Entry | `FAIL` | Cross-assessment can attach to the first case instead of the active execution case. | Pass active case id. |
| Strategy Room Session | `PARTIAL` | Irreversibility is restrained but light on provenance. | Add source/date context. |
| Intelligence Memory | `FAIL` | Wrapper page can render as a thin shell and is not scoped to a chosen case. | Add case scoping and explicit empty/history-thin state. |
| Intelligence Contradictions | `FAIL` | Wrapper page is unscoped; contradiction cards lack dates/action completeness and overstate posture. | Add case scoping, temporal fields, next action, and real evidence posture. |

## Suppressions

Suppress from broad user-facing runtime until hardened:

- `DecisionTracePanel`
- `DeterminismProof`
- `SpineRenderer`
- `KnowledgeGraph`
- `DiscoveryOverlay`

Reason:

- These surfaces expose mechanism, ranking logic, graph structure, internal reasoning scaffolding, or administrative discovery context.

## Detailed Component Trace

### `DecisionVelocityCard`

- Required data:
  - `averageTimeToFirstResponseDays`
  - `openCheckpointCount`
  - `overdueCheckpointCount`
  - `completedCheckpointCount`
  - `blockedCheckpointCount`
  - `decisionVelocityBand`
  - `sourceLabel`
  - `evidencePosture`
  - `summary`
  - optional `caution`
- Strong-state behavior:
  - Renders a clear movement band and operational counts.
  - Gives the user an immediate action implication if checkpoints are open or overdue.
- Thin-data behavior:
  - Safe when upstream provides an insufficiency summary.
  - Fast Diagnostic uses a synthetic fallback baseline before measured history exists.
- Absent-data behavior:
  - Card has no internal absent-data branch; caller must suppress or provide fallback.
- Runtime concern:
  - Summary wording implies a single recent cycle even though the metric is an aggregate average across responded checkpoints.
- IP posture:
  - Safe. No formulas, thresholds, or computation method are exposed.

### `WhatChangedPanel`

- Required data:
  - `headline`
  - `hasPriorState`
  - `changes[]`
  - optional `caution`
- Strong-state behavior:
  - Works if the summary truly represents two comparable records.
  - Gives retention value by showing movement without reopening prior diagnostics.
- Thin-data behavior:
  - Often becomes a shallow wrapper around `NEW_SIGNAL` or `INSUFFICIENT_HISTORY`.
  - It does not explain which two dates are being compared.
- Absent-data behavior:
  - Only safe if upstream emits the baseline-created summary.
  - If the wrapper is rendered with sparse changes, it still looks like a real comparison surface.
- Runtime concern:
  - The contract and API do not yet carry enough prior-state fields for the product promise.
- IP posture:
  - Safe on mechanism, weak on truthfulness.

### `CrossAssessmentInsight`

- Required data:
  - `conflicts[]`
  - `reinforcingSignals[]`
  - optional `caution`
- Strong-state behavior:
  - Clearly names the surfaces involved.
  - Uses appropriately cautious language such as "suggests" and "may mean".
- Thin-data behavior:
  - Safe because it suppresses when no real signal exists.
- Absent-data behavior:
  - Safe suppression.
- Runtime concern:
  - No explicit source label field, but the surfaces involved are visible and meaningful.
- IP posture:
  - Strong. It surfaces consequence, not internal matching logic.

### `ContradictionMapPreview`

- Required data:
  - `activeContradictions[]`
  - `headline`
  - optional `warning`
- Strong-state behavior:
  - Shows contradiction label, severity, source surfaces, related signals, and plain-English description.
  - Distinctive enough to feel like product intelligence rather than generic UI decoration.
- Thin-data behavior:
  - Remains understandable with a single contradiction.
- Absent-data behavior:
  - Safe suppression.
- Runtime concern:
  - Missing `first detected`, `last seen`, `current status`, and `suggested next action`.
  - Hard-coded evidence posture is not acceptable for a truth-critical surface.
- IP posture:
  - Mechanically safe; truth/provenance incomplete.

### `ClientIntelligenceStack`

- Required data:
  - Successful `/api/decision-centre/cases` response
  - Correct `caseId` if the caller needs case-accurate rendering
- Strong-state behavior:
  - Good orchestration: renders only the cards requested and only when data exists.
- Thin-data behavior:
  - Tends to suppress entirely, which is safer than fabrication but weak for standalone pages.
- Absent-data behavior:
  - Returns `null`.
- Runtime concern:
  - `json.cases[0]` fallback makes multiple surfaces truth-risky because refresh-stable does not equal case-stable.
- IP posture:
  - Safe. Main problem is scope correctness.

### Trust Surfaces

#### `ArbiterBadge`

- Useful public trust signal.
- No rule leakage.
- Works cleanly across `passed`, `corrected`, and `incomplete`.

#### `GovernanceDisclosure`

- Static mode is safe.
- Live mode exposes a confidence number and failure modes without enough explanatory anchor.
- This is a precision/trust problem more than a mechanism leak.

#### `DiagnosticStandardPanel`

- Safe and disciplined.
- No runtime risk beyond occupying space.

## Detailed Surface Integration

### Decision Centre

- Data path:
  - Server-authenticated `/api/decision-centre/cases`
  - Case-local fields attached directly to `DecisionCentreCase`
- Intelligence shown:
  - decision velocity
  - what changed
  - irreversibility
  - cross-assessment intelligence
  - contradiction preview
- Strength:
  - Best-integrated surface because the cards are attached to the actual case card, not fetched loosely by the client wrapper.
- Weakness:
  - `What changed` is only partially real.
  - Irreversibility lacks explicit provenance/date display.

### Fast Diagnostic

- Data path:
  - local result plus optional fallback velocity summary
  - later hydrated through `ClientIntelligenceStack`
- Intelligence shown:
  - arbiter badge
  - decision velocity
- Strength:
  - Safe baseline behavior before full history exists.
- Weakness:
  - Users may not immediately distinguish synthetic baseline from server-measured history unless copy is tightened.

### Return Brief

- Data path:
  - return brief session payload for core document
  - shared `ClientIntelligenceStack` for velocity
- Intelligence shown:
  - decision velocity
- Strength:
  - Conceptually right surface for this signal.
- Weakness:
  - Currently unscoped; can show another case’s velocity summary.

### Executive Reporting

- Data path:
  - canonical executive report payload
  - shared `ClientIntelligenceStack`
  - local irreversibility estimate
- Intelligence shown:
  - arbiter badge
  - irreversibility
  - cross-assessment intelligence
  - contradiction preview
- Strength:
  - Real data sources exist.
- Weakness:
  - Wrong-case risk from unscoped stack.
  - Duplicate contradiction presentation.
  - Unsupported AI-baseline benchmark language.
  - This is currently the most bloated of the audited surfaces.

### Strategy Room Entry

- Data path:
  - local execution context
  - shared `ClientIntelligenceStack` for cross-assessment
- Intelligence shown:
  - cross-assessment intelligence
- Strength:
  - Sensible placement because this is where diagnostic memory should turn into execution context.
- Weakness:
  - Wrong-case risk from unscoped stack.

### Strategy Room Session

- Data path:
  - session payload
  - execution state API
  - local irreversibility estimate
- Intelligence shown:
  - irreversibility
- Strength:
  - Estimate uses real session/decision/financial/checkpoint state.
- Weakness:
  - Provenance/date context should be explicit.

### Intelligence Memory

- Data path:
  - shared `ClientIntelligenceStack`
- Intelligence shown:
  - decision velocity
  - what changed
  - cross-assessment
- Strength:
  - Good conceptual aggregation.
- Weakness:
  - In practice it is a shell page with no explicit empty state and no case scoping.

### Intelligence Contradictions

- Data path:
  - shared `ClientIntelligenceStack`
- Intelligence shown:
  - contradiction preview
- Strength:
  - Safe on graph mechanics.
- Weakness:
  - Incomplete contradiction truth surface and wrong-case risk.

## Hostile Verification Questions

### Can a user see why the system is different within 60 seconds?

Partial.

- Yes on Decision Centre because decision velocity, contradiction preview, and cross-assessment all imply memory and governed continuity.
- Weak on the standalone intelligence pages because they can render as thin wrappers or resolve to the wrong case.

### Can a user see what changed since last time?

Partial.

- The surface exists.
- The underlying history is not yet strong enough to support the full claim consistently.
- Compared dates are not shown.

### Can a user see whether they are acting faster or slower?

Yes, with qualification.

- Decision velocity is real once checkpoint history exists.
- Fast Diagnostic still needs a clearer distinction between baseline and measured history.

### Can a user see which contradiction is still unresolved?

Partial.

- They can see contradiction label and severity.
- They cannot yet see first seen, last seen, current status, or suggested next action in the shared contradiction preview.

### Can a user see which evidence produced the intelligence?

Partial.

- Some surfaces show source labels or source surfaces.
- Irreversibility and `What changed` need better visible provenance/date context.

### Can a competitor copy the visible UI without getting the underlying accumulated data?

Yes.

- The visible cards are simple.
- The actual defensibility sits in stored checkpoints, prior stages, contradictions, route memory, and cross-surface carry-forward.

### Did we expose anything that helps a competitor build the machinery?

Not in the new shared cards.

- The main exposure risk comes from older internal intelligence components that still sit in the same folder and remain product-shaped.

### Did we create any claim that requires verified outcomes before we have them?

Yes, in limited areas.

- Executive Reporting benchmark wording is not yet defensible.
- Contradiction evidence posture is overstated.
- Some trust/determinism-style internal components would overclaim if ever exposed publicly.

## Final Judgment

The advantage layer is real, not decorative, but it is not yet uniformly trustworthy across every runtime surface. The moat is strongest where the product uses persisted governed history to change what the user sees next. The current failures are mostly execution discipline failures:

- wrong-case binding
- thin comparative history
- incomplete provenance
- lingering legacy or operator-grade copy in public-adjacent surfaces

That is fixable. The underlying product advantage is present.
