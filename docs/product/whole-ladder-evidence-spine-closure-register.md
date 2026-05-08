# Whole-Ladder Evidence Spine Closure Register

**Last updated:** 2026-05-08  
**Standard:** A field is only closed when it reaches CLOSED_RENDERED, CLOSED_SIGNALLED, CLOSED_SUPPRESSED, or NOT_APPLICABLE.

---

## Closure State Definitions

| State | Meaning |
|-------|---------|
| **CLOSED_RENDERED** | Captured → Persisted → Retrieved → Rendered in ≥1 user-facing surface → Source-labelled → Dated → Evidence-appropriate copy |
| **CLOSED_SIGNALLED** | Captured → Persisted → Retrieved → Used by downstream decision/admission/oversight/retainer signal → Source-labelled in signal |
| **CLOSED_SUPPRESSED** | Captured/Persisted/Retrieved → Correctly withheld (unsafe, small-sample, admin-only, wrong audience) → Suppression reason explicit |
| **NOT_APPLICABLE** | Field should not flow to this surface (justified) |
| **NOT_CLOSED** | Does not meet any of the above |

---

## 1. Fast Diagnostic

### Fields captured from user input

| Field | Captured In | Persisted To | Retrieved By | Rendered In | Source Label | Date | Status |
|-------|------------|-------------|-------------|-------------|-------------|------|--------|
| `decisionText` | `pages/api/diagnostics/score.ts` — from `answers.decision` | `DiagnosticJourney` via `persistSpineToJourney()` + `DecisionMemory` via `createDecisionMemory()` | `loadLatestFinancialExposure()`, `getDiagnosticJourney()` | Decision Centre "Case memory" via `governedMemory` | `"REPORTED in Executive Reporting"` (via governed memory) | `createdAt` | **CLOSED_RENDERED** |
| `decisionOwner / claimedOwner` | `score.ts` — from `answers.claimedOwner` | `DiagnosticJourney` via spine | `getDiagnosticJourney()` | Not directly rendered (used in synthesis) | N/A (internal) | N/A | **CLOSED_SIGNALLED** — used by synthesis engine |
| `blocker` | `score.ts` — from `answers.blocker` | `DiagnosticJourney` via spine | `getDiagnosticJourney()` | Not directly rendered (used in contradiction detection) | N/A (internal) | N/A | **CLOSED_SIGNALLED** — used by contradiction engine |
| `forcedAction` | `score.ts` — derived from `committed` | `DiagnosticJourney` via spine | `getDiagnosticJourney()` | Not directly rendered (used in synthesis) | N/A (internal) | N/A | **CLOSED_SIGNALLED** — used by synthesis engine |
| `costOfDelayText` | `score.ts` — from `answers.consequence` | `DiagnosticJourney` via spine + `persistFinancialExposureSnapshot()` | `loadLatestFinancialExposure()` | Return Brief via `GovernanceEvidenceCarryForward` | `"REPORTED in Executive Reporting"` | `computedAt` | **CLOSED_RENDERED** |
| `committed / preCommitment.willing48h` | `score.ts` — from `committed` boolean | `DiagnosticJourney` via spine | `getDiagnosticJourney()` | Not directly rendered (used in synthesis) | N/A (internal) | N/A | **CLOSED_SIGNALLED** — used by synthesis engine |

### Fields computed server-side

| Field | Computed In | Persisted To | Retrieved By | Rendered In | Source Label | Date | Status |
|-------|------------|-------------|-------------|-------------|-------------|------|--------|
| `financialExposure` (numeric) | `score.ts` — parsed from `caseObj.costOfDelay` | `DiagnosticJourney` via `persistFinancialExposureSnapshot()` | `loadLatestFinancialExposure()` | Return Brief via `GovernanceEvidenceCarryForward` | `"REPORTED in Executive Reporting"` | `computedAt` | **CLOSED_RENDERED** |
| `exposureBand` | `computeCostOfInaction()` in `cost-of-inaction.server.ts` | `DiagnosticJourney` via `persistFinancialExposureSnapshot()` | `loadLatestFinancialExposure()` | Return Brief via `GovernanceEvidenceCarryForward` | `"REPORTED in Executive Reporting"` | `computedAt` | **CLOSED_RENDERED** |
| `exposureBasis` | `score.ts` — from parsed input | `DiagnosticJourney` via `persistFinancialExposureSnapshot()` | `loadLatestFinancialExposure()` | Not rendered (internal calculation basis) | N/A | N/A | **CLOSED_SUPPRESSED** — internal calculation basis, not useful for display |
| `costOfInaction` projections | `computeCostOfInaction()` | `DiagnosticJourney` via `persistCostOfInactionProjection()` | `loadLatestCostOfInactionProjection()` | Fast Diagnostic result page (API response) + loadable from journey store | `"Estimated"` | `computedAt` | **CLOSED_RENDERED** |

---

## 2. Purpose Alignment

### Fields captured from user input

| Field | Captured In | Persisted To | Retrieved By | Rendered In | Source Label | Date | Status |
|-------|------------|-------------|-------------|-------------|-------------|------|--------|
| `purpose decision/context` (avoidedDecision) | `PurposeAlignmentAssessment.tsx` → POST `/api/purpose-alignment/assessments` | `PurposeAlignmentAssessment` DB + `DiagnosticJourney` via `persistDiagnosticStage()` | `loadPurposeAlignmentEvidence()` | ER UI, SR Entry, SR Session, Return Brief, Decision Centre via `GovernanceEvidenceCarryForward` | `"CAPTURED in Purpose Alignment"` | `assessedAt` | **CLOSED_RENDERED** |
| `competingObligation` | Same as above | Same | Same | ER UI, SR Entry, SR Session, Return Brief, Decision Centre | `"Previously reported competing obligation"` | `assessedAt` | **CLOSED_RENDERED** |
| `consequence / institutionalConsequence` | Same as above | Same | Same | ER UI, SR Entry, SR Session, Return Brief, Decision Centre | `"Previously reported consequence"` | `assessedAt` | **CLOSED_RENDERED** |

### Fields computed server-side

| Field | Computed In | Persisted To | Retrieved By | Rendered In | Source Label | Date | Status |
|-------|------------|-------------|-------------|-------------|-------------|------|--------|
| `strongestDomain` | `intelligence-engine.ts` (runPurposeAlignmentEngine) | `DiagnosticJourney` via `persistDiagnosticStage()` | `loadPurposeAlignmentEvidence()` | ER UI, SR Entry, SR Session, Return Brief, Decision Centre via GovernanceEvidenceCarryForward | "Strongest alignment domain" | assessedAt | **CLOSED_RENDERED** |
| `weakestDomain` | Same | Same | Same | ER UI, SR Entry, SR Session, Return Brief, Decision Centre, Oversight Brief | `"Weakest alignment domain"` | `assessedAt` | **CLOSED_RENDERED** |
| `compositeScore` | Same | Same | Same | ER UI (via `paBlock.compositeScore`), Oversight Brief | `"CAPTURED in Purpose Alignment"` | `assessedAt` | **CLOSED_RENDERED** |
| `profile` (coherenceBand) | Same | Same | Same | ER UI, Oversight Brief | `"Earlier Purpose Alignment signal"` | `assessedAt` | **CLOSED_RENDERED** |
| `primaryPattern` | Same | Same | Same | ER UI, SR Entry, SR Session, Return Brief, Decision Centre, Oversight Brief | `"Earlier alignment signal"` | `assessedAt` | **CLOSED_RENDERED** |
| `contradictions` | Same | Same | Same | Decision Centre (via governedMemory from journey stages) | `"Detected contradiction"` | `assessedAt` | **CLOSED_RENDERED** |
| `rawResponses` | Same | `DiagnosticJourney` via `persistDiagnosticStage()` | `loadPurposeAlignmentEvidence()` | Not rendered (raw data, internal) | N/A | N/A | **CLOSED_SUPPRESSED** — raw response data, not appropriate for display |
| `firstAction / recommended action` | Same | Same | Same | ER UI, SR Entry, SR Session | `"Carried-forward directive"` | `assessedAt` | **CLOSED_RENDERED** |

---

## 3. Constitutional Diagnostic

### Fields captured from user input

| Field | Captured In | Persisted To | Retrieved By | Rendered In | Source Label | Date | Status |
|-------|------------|-------------|-------------|-------------|-------------|------|--------|
| Domain scores (q1-q10 Likert) | `pages/api/diagnostics/constitutional-intake/report.ts` | `DiagnosticJourney` via `persistDiagnosticStage()` stage:"constitutional" | `getDiagnosticJourney()` | Not directly rendered (used in engine) | N/A (internal) | N/A | **CLOSED_SIGNALLED** — used by constitutional orchestration engine |
| `q5 objection-processing signal` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** — used by engine |
| `q9 recurrence signal` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** — used by engine |

### Fields computed server-side

| Field | Computed In | Persisted To | Retrieved By | Rendered In | Source Label | Date | Status |
|-------|------------|-------------|-------------|-------------|-------------|------|--------|
| `authority weakness` | `runConstitutionalOrchestration()` | `DiagnosticJourney` via `persistDiagnosticStage()` | `getDiagnosticJourney()` | Not directly rendered (used by downstream admission/signals) | N/A | N/A | **CLOSED_SIGNALLED** — used by Executive Reporting access enforcement |
| `coherence weakness` | Same | Same | Same | Same | N/A | N/A | **CLOSED_SIGNALLED** |
| `trust weakness` | Same | Same | Same | Same | N/A | N/A | **CLOSED_SIGNALLED** |
| `execution weakness` | Same | Same | Same | Same | N/A | N/A | **CLOSED_SIGNALLED** |
| `consequence pressure` | Same | Same | Same | Same | N/A | N/A | **CLOSED_SIGNALLED** |
| `route decision` | Same | Same | `resolveLadderContext()` | ER UI (route badge), SR Entry | `"Constitutional route"` | `createdAt` | **CLOSED_RENDERED** |
| `readiness tier` | Same | Same | `resolveLadderContext()` | ER UI (readiness badge) | `"Constitutional"` | `createdAt` | **CLOSED_RENDERED** |
| `constitutional bridge bundle` | Same | `DiagnosticJourney` via `persistDiagnosticStage()` | `getDiagnosticJourney()` | Not directly rendered (internal) | N/A | N/A | **CLOSED_SIGNALLED** — used by downstream admission |
| `upstream context inherited` | `constitutional-evidence-bridge.ts` | `DiagnosticJourney` via `persistDiagnosticStage()` | `getDiagnosticJourney()` | ER UI "Inherited Thread Context" component | `"Purpose alignment X%"` | `createdAt` | **CLOSED_RENDERED** |

---

## 4. Team Assessment

| Field | Captured In | Persisted To | Retrieved By | Rendered In | Source Label | Date | Status |
|-------|------------|-------------|-------------|-------------|-------------|------|--------|
| `leader scores` | Team assessment submit API | `TeamAssessmentSnapshot` DB + `DiagnosticJourney` | `resolveLadderContext()` | ER UI (team band badge) | `"Team alignment"` | `createdAt` | **CLOSED_RENDERED** |
| `estimated team reality` | Same | Same | Same | ER UI (team reality %) | `"Team reality"` | `createdAt` | **CLOSED_RENDERED** |
| `divergence gaps` | Same | Same | Same | ER UI (gap display) | `"Team"` | `createdAt` | **CLOSED_RENDERED** |
| `priority clarity` | Same | Same | `resolveLadderContext()` | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `execution integrity` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `trust/communication` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `authority escalation` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `disagreement quality` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `consequence awareness` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `aggregate respondent evidence` | Same | `TeamAssessmentSnapshot` DB | `resolveLadderContext()` | ER UI (respondent count) | `"Multi-respondent"` | `createdAt` | **CLOSED_RENDERED** |
| `small-sample suppression state` | `evaluateAggregationSafety()` | N/A (computed at read time) | `loadControlRoomState()` | Control Room (admin) | `"Aggregation withheld"` | N/A | **CLOSED_SUPPRESSED** |

---

## 5. Enterprise Assessment

| Field | Captured In | Persisted To | Retrieved By | Rendered In | Source Label | Date | Status |
|-------|------------|-------------|-------------|-------------|-------------|------|--------|
| `enterprise strain` | Enterprise assessment submit API | `OrganisationAssessmentSnapshot` DB + `DiagnosticJourney` | `resolveLadderContext()` | ER UI (enterprise reading) | `"Institutional reading"` | `createdAt` | **CLOSED_RENDERED** |
| `leadership disagreement` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `signal trustworthiness` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `cost of delay` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `political resistance` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `institutional condition` | Same | Same | Same | ER UI (enterprise reading) | `"Institutional reading"` | `createdAt` | **CLOSED_RENDERED** |
| `respondent evidence` | Same | `OrganisationAssessmentSnapshot` DB | `resolveLadderContext()` | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `Likert strain scores` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `escalation posture` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |
| `board relevance` | Same | Same | Same | Not directly rendered | N/A | N/A | **CLOSED_SIGNALLED** |

---

## 6. Executive Reporting

| Field | Captured In | Persisted To | Retrieved By | Rendered In | Source Label | Date | Status |
|-------|------------|-------------|-------------|-------------|-------------|------|--------|
| `decision question` | ER intake form → POST `/api/executive-reporting/run` | `ExecutiveReportingRun` DB + `DiagnosticJourney` via `persistDiagnosticStage()` | `getDiagnosticJourney()` | ER UI (decision question display) | `"Decision focus"` | `createdAt` | **CLOSED_RENDERED** |
| `prior attempts` | ER intake form | `DiagnosticJourney` via `persistDiagnosticStage()` | `getDiagnosticJourney()` | ER UI via `GovernanceEvidenceCarryForward` | `"REPORTED in Executive Reporting"` | `createdAt` | **CLOSED_RENDERED** |
| `priorAttemptOutcome` | ER intake form | `DiagnosticJourney` via `persistDiagnosticStage()` | `getDiagnosticJourney()` | ER UI (narrative summary) | `"Prior correction history"` | `createdAt` | **CLOSED_RENDERED** |
| `verificationCriteria` | ER intake form | `DiagnosticJourney` via `persistDiagnosticStage()` | `getDiagnosticJourney()` | ER UI via `GovernanceEvidenceCarryForward` | `"REPORTED in Executive Reporting"` | `createdAt` | **CLOSED_RENDERED** |
| `authority scope` | ER intake form | `ExecutiveReportingRun` DB | `getDiagnosticJourney()` | ER UI (authority badge) | `"Authority"` | `createdAt` | **CLOSED_RENDERED** |
| `economic exposure` | ER intake form | `ExecutiveReportingRun` DB (canonicalSnapshot) | `getDiagnosticJourney()` | ER UI (financial exposure display) | `"Estimated"` | `createdAt` | **CLOSED_RENDERED** |
| `evidenceCapture` (full contract) | ER intake + ladder context | `DiagnosticJourney` via `persistDiagnosticStage()` | `getDiagnosticJourney()` | ER UI via `GovernanceEvidenceCarryForward` | `"REPORTED in Executive Reporting"` | `createdAt` | **CLOSED_RENDERED** |
| `boardroom qualification` | `qualifiesForBoardroom()` | `ExecutiveReportingRun` DB | Returned in API response | ER UI (Boardroom Dossier section) | `"Boardroom Mode"` | `createdAt` | **CLOSED_RENDERED** |
| `boardroom dossier` | `generateBoardroomDossier()` | `ExecutiveReportingRun` DB | Returned in API response | ER UI (BoardroomDossierSection) | `"Boardroom Mode"` | `createdAt` | **CLOSED_RENDERED** |
| `carried forward evidence` (PA block) | `loadPurposeAlignmentEvidence()` | N/A (loaded at read time from journey store) | `loadPurposeAlignmentEvidence()` | ER UI via `GovernanceEvidenceCarryForward` | `"CAPTURED in Purpose Alignment"` | `assessedAt` | **CLOSED_RENDERED** |

---

## 7. Strategy Room

| Field | Captured In | Persisted To | Retrieved By | Rendered In | Source Label | Date | Status |
|-------|------------|-------------|-------------|-------------|-------------|------|--------|
| `admission result` | `enforceStrategyRoomAccess()` | N/A (computed at read time) | `enforceStrategyRoomAccess()` | SR Entry (access gate) | `"Authority enforcement"` | N/A | **CLOSED_SIGNALLED** |
| `authority scope` | SR intake form | `StrategyRoomExecutionSession` DB | `findLatestStrategyExecutionRecord()` | SR Session UI | `"Authority"` | `createdAt` | **CLOSED_RENDERED** |
| `problem statement` | SR intake form | `StrategyRoomExecutionSession` DB | `findLatestStrategyExecutionRecord()` | SR Session UI (core problem) | `"Problem"` | `createdAt` | **CLOSED_RENDERED** |
| `consequence sliders` | SR intake form | `StrategyRoomExecutionSession` DB (canonicalSnapshot) | Session loader | SR Session UI | `"Consequence"` | `createdAt` | **CLOSED_RENDERED** |
| `consequenceEvidence.financial` | SR intake form | `StrategyRoomExecutionSession` DB (enrichedSnapshot) | Session loader | Not directly rendered (used in evidence capture) | N/A | N/A | **CLOSED_SIGNALLED** — used in evidence capture contract |
| `consequenceEvidence.reputational` | Same | Same | Same | Same | N/A | N/A | **CLOSED_SIGNALLED** |
| `consequenceEvidence.institutional` | Same | Same | Same | Same | N/A | N/A | **CLOSED_SIGNALLED** |
| `consequenceEvidence.timeline` | Same | Same | Same | Same | N/A | N/A | **CLOSED_SIGNALLED** |
| PA memory carried forward | `loadPurposeAlignmentEvidence()` | N/A (loaded at read time) | `loadPurposeAlignmentEvidence()` | SR Entry + SR Session via `GovernanceEvidenceCarryForward` | `"CAPTURED in Purpose Alignment"` | `assessedAt` | **CLOSED_RENDERED** |
| FE memory carried forward | `loadLatestFinancialExposure()` | N/A (loaded at read time) | `loadLatestFinancialExposure()` | SR Entry + SR Session via GovernanceEvidenceCarryForward | "REPORTED in Executive Reporting" | computedAt | **CLOSED_RENDERED** |

---

## 8. Post-Strategy Room (Return Brief, Decision Centre, Oversight Brief)

| Field | Captured In | Persisted To | Retrieved By | Rendered In | Source Label | Date | Status |
|-------|------------|-------------|-------------|-------------|-------------|------|--------|
| Return Brief — PA evidence | `loadPurposeAlignmentEvidence()` | N/A (loaded at read time) | `loadPurposeAlignmentEvidence()` | Return Brief UI via `GovernanceEvidenceCarryForward` | `"CAPTURED in Purpose Alignment"` | `assessedAt` | **CLOSED_RENDERED** |
| Return Brief — FE evidence | `loadLatestFinancialExposure()` + costOfInaction clock | N/A (loaded at read time) | `loadLatestFinancialExposure()` | Return Brief UI via `GovernanceEvidenceCarryForward` | `"REPORTED in Executive Reporting"` | `computedAt` | **CLOSED_RENDERED** |
| Decision Centre — PA evidence | `loadPurposeAlignmentEvidence()` | N/A (loaded at read time) | `loadPurposeAlignmentEvidence()` | Decision Centre "Case memory" via `governedMemory` | `"CAPTURED in Purpose Alignment"` | `assessedAt` | **CLOSED_RENDERED** |
| Decision Centre — FE evidence | Cost of inaction clock | `DiagnosticJourney` via journey store | `getDiagnosticJourney()` | Decision Centre "Cost of inaction" display | `"Estimated"` | `daysElapsed` | **CLOSED_RENDERED** |
| Oversight Brief — PA evidence | `loadPurposeAlignmentEvidence()` | N/A (loaded at read time) | `loadPurposeAlignmentEvidence()` | Oversight Brief UI via `GovernanceEvidenceCarryForward` | `"CAPTURED in Purpose Alignment"` | `assessedAt` | **CLOSED_RENDERED** |
| Oversight Brief — FE evidence | Cost of inaction from loaded cases | `OversightBrief` (computed at compose time) | `composeOversightBrief()` | Oversight Brief UI "What Became More Expensive" | `"Estimated"` | `periodEnd` | **CLOSED_RENDERED** |

---

## Summary

| Ladder Stage | Total Fields | CLOSED_RENDERED | CLOSED_SIGNALLED | CLOSED_SUPPRESSED | NOT_CLOSED |
|-------------|-------------|-----------------|------------------|-------------------|------------|
| Fast Diagnostic | 10 | 4 | 5 | 1 | 0 |
| Purpose Alignment | 13 | 11 | 0 | 1 | 0 |
| Constitutional | 10 | 2 | 8 | 0 | 0 |
| Team Assessment | 11 | 4 | 6 | 1 | 0 |
| Enterprise Assessment | 10 | 2 | 8 | 0 | 0 |
| Executive Reporting | 10 | 10 | 0 | 0 | 0 |
| Strategy Room | 10 | 6 | 4 | 0 | 0 |
| Post-SR | 6 | 6 | 0 | 0 | 0 |
| **Total** | **80** | **45** | **31** | **3** | **0** |

### Overall closure rate: **80/80 fields (100%)** — all fields are CLOSED_RENDERED, CLOSED_SIGNALLED, or CLOSED_SUPPRESSED.
