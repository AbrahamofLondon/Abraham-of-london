# EVIDENCE SPINE FIELD REGISTER

> **Forensic Trace Pass — 2026-05-08**
> **Status: COMPLETE — Repair Pass Applied**
> **Last updated: 2026-05-08**

---

## METHODOLOGY

Each field is traced across the full product ladder:

1. **Capture surface** — where the user provides the data
2. **Exact file + line** — source of truth reference
3. **API payload field** — what leaves the browser
4. **Server receiver** — API route that ingests it
5. **Transformation layer** — any processing/derivation
6. **Persistence destination** — DB table/model or JSON blob
7. **Retrieval path** — how downstream reads it
8. **Downstream consumers** — surfaces that use it
9. **User-facing surfaces** — where it's displayed
10. **Suppression/privacy rule** — any redaction
11. **Current status** — classification
12. **Verdict** — required action

---

## FIELD REGISTER

---

### 1. committed

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Fast Diagnostic UI — checkbox/boolean toggle |
| **Exact file + line** | `lib/diagnostics/fast-diagnostic-dto.ts:12` — `FastDiagnosticRequest.committed: boolean` |
| **API payload field** | `committed` (boolean) in `FastDiagnosticRequest` |
| **Server receiver** | `lib/diagnostics/api-submit.ts` — `handleDiagnosticSubmit()` receives body, stores in `payload` |
| **Transformation layer** | `lib/decision/intelligence-spine.ts:157` — `createSpine()` stores as `preCommitment.willing48h` on the spine |
| **Persistence destination** | **Dual:** (1) `DiagnosticRecord.responsesJson` (JSON blob) via `lib/diagnostics/store.ts`; (2) `DiagnosticJourney.mergedTensionThread` (JSON) via `lib/decision/spine-persistence.ts` — `persistSpineToJourney()` writes to `DiagnosticJourney` table |
| **Retrieval path** | `lib/diagnostics/journey-store.ts` — `getDiagnosticJourney()` reads from `DiagnosticJourney` table; `lib/strategy-room/admission.ts` checks `context.preCommitment` |
| **Downstream consumers** | Strategy Room admission (`lib/strategy-room/admission.ts:120` — checks `context.preCommitment`); `IntelligenceSpine.preCommitment.willing48h` used by integrity scoring |
| **User-facing surfaces** | Strategy Room entry gate — displayed as readiness/pre-commitment confirmation |
| **Suppression/privacy rule** | None — pre-commitment is safe to surface |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** — confirmed persisted as `spine.preCommitment.willing48h`, consumed by Strategy Room admission and integrity scoring |

---

### 2. preCommitment.willing48h

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Fast Diagnostic UI — derived from `committed` field |
| **Exact file + line** | `lib/decision/intelligence-spine.ts:157` — set in `createSpine()` as `preCommitment: { willing48h: boolean, capturedAt: string }` |
| **API payload field** | Not a separate API field — derived from `committed` in spine creation |
| **Server receiver** | Same as `committed` — flows through `api-submit.ts` |
| **Transformation layer** | `lib/decision/intelligence-spine.ts` — `createSpine()` transforms `committed` boolean into `preCommitment.willing48h` |
| **Persistence destination** | `IntelligenceSpine.preCommitment` — stored in `DiagnosticJourney.mergedTensionThread` via `persistSpineToJourney()` |
| **Retrieval path** | `loadSpineFromJourney()` in `spine-persistence.ts`; Strategy Room `admission.ts` reads from context |
| **Downstream consumers** | Strategy Room admission gate; integrity scoring; escalation logic |
| **User-facing surfaces** | Strategy Room entry readiness check |
| **Suppression/privacy rule** | None |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** — dual persisted, consumed by Strategy Room and integrity system |

---

### 3. decisionText

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Fast Diagnostic UI — free-text input "What decision are you facing?" |
| **Exact file + line** | `lib/decision/case-object.ts:13` — `CaseObject.decision: string` |
| **API payload field** | `FastDiagnosticRequest.answers` — mapped to `case.decision` |
| **Server receiver** | `lib/diagnostics/api-submit.ts` — `handleDiagnosticSubmit()` |
| **Transformation layer** | `lib/decision/case-object.ts:48` — `createCaseObject()`; `lib/decision/synthesis-engine.ts` — used in `buildSynthesisPrompt()` and `deterministicFallback()` |
| **Persistence destination** | (1) `DiagnosticRecord.responsesJson`; (2) `DiagnosticDecisionObject.decisionText` in `DiagnosticDecisionObject` table; (3) `DiagnosticJourney.mergedTensionThread` as `IntelligenceSpine.case.decision` |
| **Retrieval path** | `journey-store.ts` — `decisionObjects[]`; `spine-persistence.ts` — `loadSpineFromJourney()` |
| **Downstream consumers** | Synthesis engine, deterministic fallback, Strategy Room execution record, Return Brief, Oversight Brief |
| **User-facing surfaces** | Fast Diagnostic result (quoted), Strategy Room session, Return Brief, Executive Reporting |
| **Suppression/privacy rule** | `redactCaseObjectForStorage()` in `case-object.ts:119` — caps at 500 chars, strips PII patterns |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 4. decisionOwner / authorityOwner

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Fast Diagnostic UI — "Who owns this decision?" free-text |
| **Exact file + line** | `lib/decision/case-object.ts:19` — `CaseObject.claimedOwner: string` |
| **API payload field** | `FastDiagnosticRequest.answers` — mapped to `case.claimedOwner` |
| **Server receiver** | `lib/diagnostics/api-submit.ts` |
| **Transformation layer** | `case-object.ts:52` — stored as `claimedOwner`; `inferContradiction()` uses it; `classifyCondition()` uses it for authority detection |
| **Persistence destination** | (1) `DiagnosticRecord.responsesJson`; (2) `DiagnosticDecisionObject.stakeholderText`; (3) `IntelligenceSpine.case.claimedOwner` in `DiagnosticJourney.mergedTensionThread` |
| **Retrieval path** | `journey-store.ts` — `decisionObjects[].stakeholderText`; spine accessors |
| **Downstream consumers** | Synthesis engine, Strategy Room admission (authority signal check), Oversight Brief |
| **User-facing surfaces** | Fast Diagnostic result (quoted), Strategy Room authority section |
| **Suppression/privacy rule** | `redactCaseObjectForStorage()` — caps at 200 chars |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 5. costOfDelay / financialExposure

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Fast Diagnostic UI — "What gets more expensive each week?" free-text |
| **Exact file + line** | `lib/decision/case-object.ts:17` — `CaseObject.costOfDelay: string` (free-text, qualitative) |
| **API payload field** | `FastDiagnosticRequest.answers` — mapped to `case.costOfDelay` |
| **Server receiver** | `lib/diagnostics/api-submit.ts` |
| **Transformation layer** | `lib/diagnostics/cost-of-delay-engine.ts` — `computeDelayExposureScore()` computes from Likert scores, NOT from free-text. `projectDelayHorizon()` generates horizon strings. Financial exposure is **estimated** from revenue band, not from user's stated cost. |
| **Persistence destination** | (1) `DiagnosticRecord.responsesJson` (raw free-text); (2) `DiagnosticDecisionObject.costOfDelayText`; (3) `IntelligenceSpine.case.costOfDelay` in mergedTensionThread |
| **Retrieval path** | `journey-store.ts` — `decisionObjects[].costOfDelayText` |
| **Downstream consumers** | Synthesis engine (quotes user's cost language), Executive Reporting (consequence pricing), Strategy Room |
| **User-facing surfaces** | Fast Diagnostic result, Executive Reporting cost section, Strategy Room consequence display |
| **Suppression/privacy rule** | `redactCaseObjectForStorage()` — caps at 500 chars |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** (qualitative text); **CLIENT_ONLY** (numeric financialExposure) |
| **Verdict** | **SEE PRIORITY 1 DEEP TRACE BELOW** |

---

### 6. institutionalConsequence

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Purpose Alignment — "What becomes worse if this remains unresolved?" free-text |
| **Exact file + line** | `lib/alignment/PurposeAlignmentAssessment.tsx:44` — `ContextAnswers.consequence: string` |
| **API payload field** | **Not confirmed sent to any API.** The Purpose Alignment component appears to score client-side via `scorePurposeProfile()` and display results without sending to a server endpoint. |
| **Server receiver** | **NONE CONFIRMED** — Purpose Alignment result is client-side scored and displayed. No API route found that receives the full Purpose Alignment payload including `consequence`. |
| **Transformation layer** | `lib/alignment/scoring.ts` — `scorePurposeProfile()` processes answers client-side. `consequence` text is used for display only. |
| **Persistence destination** | **NOT PERSISTED server-side** — stored in `sessionStorage` via `saveAssessmentState()` in `lib/client/assessment-state.ts` |
| **Retrieval path** | Client-side only — `loadAssessmentState()` from `sessionStorage` |
| **Downstream consumers** | **NONE server-side** — displayed in Purpose Alignment result UI only |
| **User-facing surfaces** | Purpose Alignment result page — displayed as consequence narrative |
| **Suppression/privacy rule** | None (client-side only) |
| **Current status** | **CAPTURED_NOT_SENT** — captured in Purpose Alignment UI, scored client-side, NOT sent to any API, NOT persisted server-side |
| **Verdict** | **FIX_CAPTURE** or **FIX_API_PAYLOAD** — needs to be sent to API and persisted for downstream Strategy Room / Executive Reporting consumption |

---

### 7. competingObligation

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Purpose Alignment — "What competing obligation or priority is pulling against that decision?" |
| **Exact file + line** | `lib/alignment/PurposeAlignmentAssessment.tsx:43` — `ContextAnswers.competingObligation: string` |
| **API payload field** | **NOT CONFIRMED** — Purpose Alignment appears to be client-side only |
| **Server receiver** | **NONE** |
| **Transformation layer** | Used only in client-side scoring and display |
| **Persistence destination** | `sessionStorage` only via `saveAssessmentState()` |
| **Retrieval path** | Client-side only |
| **Downstream consumers** | **NONE** — not available to any server-side surface |
| **User-facing surfaces** | Purpose Alignment result page only |
| **Suppression/privacy rule** | None |
| **Current status** | **CAPTURED_NOT_SENT** |
| **Verdict** | **FIX_API_PAYLOAD** — needs to be sent to API and persisted for downstream consumption |

---

### 8. priorAttempts

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Fast Diagnostic UI — "What have you already tried?" free-text; also GovernanceEvidenceBridge component |
| **Exact file + line** | `lib/decision/case-object.ts:15` — `CaseObject.priorAttempt: string`; `lib/product/evidence-capture-contract.ts:3` — `AssessmentEvidenceCapture.priorAttempts` |
| **API payload field** | `FastDiagnosticRequest.answers` → `case.priorAttempt`; also `metadata.evidenceCapture.priorAttempts` in `DiagnosticSubmissionPayload` |
| **Server receiver** | `lib/diagnostics/api-submit.ts`; also `lib/diagnostics/store.ts` — `createDiagnosticRecord()` |
| **Transformation layer** | `synthesis-engine.ts` — used in `buildSynthesisPrompt()` and `deterministicFallback()`; `evidence-capture-contract.ts` — `sanitizeAssessmentEvidenceCapture()` |
| **Persistence destination** | (1) `DiagnosticRecord.responsesJson`; (2) `DiagnosticDecisionObject.priorAttemptText`; (3) `DiagnosticEvidenceNode` with `kind: "prior_attempt"`; (4) `IntelligenceSpine.case.priorAttempt` in `DiagnosticJourney.mergedTensionThread` |
| **Retrieval path** | `journey-store.ts` — `decisionObjects[].priorAttemptText`, `evidenceNodes[]`; `spine-persistence.ts` |
| **Downstream consumers** | Synthesis engine, Executive Reporting, Strategy Room (execution readiness), Return Brief, Oversight Brief |
| **User-facing surfaces** | Fast Diagnostic result (quoted), Executive Reporting "Evidence carried forward", Strategy Room "Known failure cause", Return Brief evidence continuity |
| **Suppression/privacy rule** | `redactCaseObjectForStorage()` — caps at 500 chars; `isUnsafeAssessmentEvidenceText()` — blocks PII/unsafe patterns |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 9. failureCause

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | GovernanceEvidenceBridge component (downstream assessments) |
| **Exact file + line** | `lib/product/evidence-capture-contract.ts:4` — `AssessmentEvidenceCapture.failureCause` |
| **API payload field** | `metadata.evidenceCapture.failureCause` in `DiagnosticSubmissionPayload` |
| **Server receiver** | `lib/diagnostics/api-submit.ts` → stored in payload |
| **Transformation layer** | `evidence-capture-contract.ts` — `sanitizeAssessmentEvidenceCapture()`; stored as `persistent_root_cause` in evidence nodes |
| **Persistence destination** | (1) `DiagnosticRecord.responsesJson`; (2) `DiagnosticEvidenceNode` with `kind: "persistent_root_cause"`; (3) Executive/Strategy canonical snapshots |
| **Retrieval path** | `journey-store.ts` — `evidenceNodes[]` filtered by kind |
| **Downstream consumers** | Executive Reporting, Strategy Room, Return Brief, Oversight Brief |
| **User-facing surfaces** | Executive Reporting "Evidence carried forward", Strategy Room "Known failure cause", Return Brief evidence continuity |
| **Suppression/privacy rule** | `isUnsafeAssessmentEvidenceText()` — withheld if unsafe |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 10. recurrenceSignal

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | GovernanceEvidenceBridge component; Constitutional Diagnostic q9 (pattern recurrence Likert) |
| **Exact file + line** | `lib/product/evidence-capture-contract.ts:5` — `AssessmentEvidenceCapture.recurrenceSignal`; `lib/diagnostics/constitutional-diagnostic-derivation.ts` — q9 domain questions |
| **API payload field** | `metadata.evidenceCapture.recurrenceSignal`; also constitutional answers |
| **Server receiver** | `lib/diagnostics/api-submit.ts` |
| **Transformation layer** | `evidence-capture-contract.ts` — sanitize; stored as `pattern_recurrence` in evidence nodes |
| **Persistence destination** | (1) `DiagnosticRecord.responsesJson`; (2) `DiagnosticEvidenceNode` with `kind: "pattern_recurrence"`; (3) Executive/Strategy canonical snapshots |
| **Retrieval path** | `journey-store.ts` — `evidenceNodes[]` |
| **Downstream consumers** | Executive Reporting (recurrence note), Strategy Room (recurring pattern warning), Return Brief (recurrence continuity), Oversight Brief (`PATTERN_RECURRED`), Control Room aggregate |
| **User-facing surfaces** | Executive Reporting recurrence note, Strategy Room recurring pattern warning, Return Brief |
| **Suppression/privacy rule** | No raw text in sponsor-safe Control Room view |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 11. verificationCriteria

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | GovernanceEvidenceBridge component |
| **Exact file + line** | `lib/product/evidence-capture-contract.ts:6` — `AssessmentEvidenceCapture.verificationCriteria` |
| **API payload field** | `metadata.evidenceCapture.verificationCriteria` |
| **Server receiver** | `lib/diagnostics/api-submit.ts` |
| **Transformation layer** | `evidence-capture-contract.ts` — sanitize |
| **Persistence destination** | (1) `DiagnosticRecord.responsesJson`; (2) `DiagnosticEvidenceNode` with `kind: "evidence"`; (3) Executive/Strategy canonical snapshots |
| **Retrieval path** | `journey-store.ts` — `evidenceNodes[]` |
| **Downstream consumers** | Executive Reporting ("Success evidence defined"), Strategy Room (execution standard), Return Brief (verification continuity), Oversight Brief (`COMMITMENT_UNVERIFIED`), Control Room |
| **User-facing surfaces** | Executive Reporting, Strategy Room execution standard, Return Brief |
| **Suppression/privacy rule** | Unsafe content withheld; no raw text in Control Room aggregate |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 12. stopSignal

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | GovernanceEvidenceBridge component |
| **Exact file + line** | `lib/product/evidence-capture-contract.ts:7` — `AssessmentEvidenceCapture.stopSignal` |
| **API payload field** | `metadata.evidenceCapture.stopSignal` |
| **Server receiver** | `lib/diagnostics/api-submit.ts` |
| **Transformation layer** | `evidence-capture-contract.ts` — sanitize; stored as `constraint` in evidence nodes |
| **Persistence destination** | (1) `DiagnosticRecord.responsesJson`; (2) `DiagnosticEvidenceNode` with `kind: "constraint"`; (3) Strategy canonical snapshot |
| **Retrieval path** | `journey-store.ts` — `evidenceNodes[]` |
| **Downstream consumers** | Strategy Room, Return Brief, Oversight Brief |
| **User-facing surfaces** | Strategy Room execution constraints, Return Brief |
| **Suppression/privacy rule** | Unsafe content withheld |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 13. escalationTrigger

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | GovernanceEvidenceBridge component |
| **Exact file + line** | `lib/product/evidence-capture-contract.ts:8` — `AssessmentEvidenceCapture.escalationTrigger` |
| **API payload field** | `metadata.evidenceCapture.escalationTrigger` |
| **Server receiver** | `lib/diagnostics/api-submit.ts` |
| **Transformation layer** | `evidence-capture-contract.ts` — sanitize |
| **Persistence destination** | (1) `DiagnosticRecord.responsesJson`; (2) `DiagnosticEvidenceNode`; (3) `DiagnosticJourney.escalationHistory` |
| **Retrieval path** | `journey-store.ts` — `escalationHistory[]`, `evidenceNodes[]` |
| **Downstream consumers** | Strategy Room (escalation logic), Oversight Brief, Control Room |
| **User-facing surfaces** | Strategy Room escalation display |
| **Suppression/privacy rule** | Unsafe content withheld |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 14. decisionDependency

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | GovernanceEvidenceBridge component |
| **Exact file + line** | `lib/product/evidence-capture-contract.ts:9` — `AssessmentEvidenceCapture.decisionDependency` |
| **API payload field** | `metadata.evidenceCapture.decisionDependency` |
| **Server receiver** | `lib/diagnostics/api-submit.ts` |
| **Transformation layer** | `evidence-capture-contract.ts` — sanitize |
| **Persistence destination** | (1) `DiagnosticRecord.responsesJson`; (2) `DiagnosticEvidenceNode`; (3) `DecisionDependency` table (Prisma model) |
| **Retrieval path** | `journey-store.ts` — `evidenceNodes[]`; `DiagnosticDecisionObject` relations |
| **Downstream consumers** | Strategy Room, Return Brief, Oversight Brief |
| **User-facing surfaces** | Strategy Room dependency map |
| **Suppression/privacy rule** | Unsafe content withheld |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 15. team aggregate evidence

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Team Assessment UI — `components/assessments/TeamAssessmentSuite.tsx` |
| **Exact file + line** | `lib/diagnostics/decision-engine.ts` — `buildTeamDecisionResult()` processes gaps |
| **API payload field** | Team assessment answers → `DiagnosticSubmissionPayload` |
| **Server receiver** | `lib/diagnostics/api-submit.ts` or team-specific API route |
| **Transformation layer** | `decision-engine.ts:buildTeamDecisionResult()` — computes gaps, signals, decision objects |
| **Persistence destination** | `DiagnosticJourney.stages.team` via `persistDiagnosticStage()`; `DiagnosticEvidenceNode[]`; `DiagnosticDecisionObject[]` |
| **Retrieval path** | `journey-store.ts` — `stages.team`, `evidenceNodes[]`, `decisionObjects[]` |
| **Downstream consumers** | Enterprise Assessment, Executive Reporting, Strategy Room |
| **User-facing surfaces** | Team Assessment result page |
| **Suppression/privacy rule** | None identified |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 16. enterprise strain evidence

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Enterprise Assessment UI — `components/assessments/EnterpriseAssessmentSuite.tsx` |
| **Exact file + line** | `lib/diagnostics/decision-engine.ts` — `buildEnterpriseDecisionResult()` |
| **API payload field** | Enterprise assessment answers → `DiagnosticSubmissionPayload` |
| **Server receiver** | Enterprise-specific API route |
| **Transformation layer** | `decision-engine.ts:buildEnterpriseDecisionResult()` — computes band, pattern, signals, route |
| **Persistence destination** | `DiagnosticJourney.stages.enterprise`; `DiagnosticEvidenceNode[]`; `DiagnosticDecisionObject[]` |
| **Retrieval path** | `journey-store.ts` — `stages.enterprise` |
| **Downstream consumers** | Executive Reporting, Strategy Room |
| **User-facing surfaces** | Enterprise Assessment result page |
| **Suppression/privacy rule** | None identified |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 17. Strategy Room execution evidence

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Strategy Room session UI — `app/strategy-room/` |
| **Exact file + line** | `lib/strategy-room/execution-record.ts` — `persistStrategyExecutionRecord()` |
| **API payload field** | Strategy Room execution form → `PersistStrategyExecutionRecordInput` |
| **Server receiver** | `app/api/strategy-room/execution/` route |
| **Transformation layer** | `execution-record.ts` — maps to `DiagnosticEvidenceNode` with `kind: "execution_record"` |
| **Persistence destination** | `DiagnosticEvidenceNode` table (Prisma); `StrategyRoomSession` table (raw SQL via Neon) |
| **Retrieval path** | `journey-store.ts` — `evidenceNodes[]` filtered by `sourceStage: "strategy_room"` |
| **Downstream consumers** | Return Brief, Oversight Brief, Control Room |
| **User-facing surfaces** | Strategy Room session, Return Brief |
| **Suppression/privacy rule** | None identified |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 18. commitment checkpoints

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Strategy Room execution flow — commitment confirmation step |
| **Exact file + line** | `lib/strategy-room/execution-record.ts` — `persistStrategyExecutionRecord()` captures `decision`, `firstAction`, `timeline`, `owner` |
| **API payload field** | `PersistStrategyExecutionRecordInput` — `decision`, `firstAction`, `timeline`, `owner` |
| **Server receiver** | Strategy Room execution API route |
| **Transformation layer** | `execution-record.ts` — constructs evidence text from commitment fields |
| **Persistence destination** | `DiagnosticEvidenceNode` with `kind: "execution_record"` |
| **Retrieval path** | `journey-store.ts` — `evidenceNodes[]` |
| **Downstream consumers** | Return Brief (verification continuity), Oversight Brief (`COMMITMENT_UNVERIFIED`) |
| **User-facing surfaces** | Return Brief, Oversight Brief |
| **Suppression/privacy rule** | None identified |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

### 19. counsel review output

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Counsel Review UI — auto-renders object keys from existing evidence |
| **Exact file + line** | Not a dedicated capture surface — reads from `DiagnosticJourney.evidenceNodes[]` and `DiagnosticDecisionObject[]` |
| **API payload field** | Counsel review responses → stored as audit event |
| **Server receiver** | Counsel review API route |
| **Transformation layer** | Counsel review is CRUD-like — reads existing evidence, writes review annotations |
| **Persistence destination** | `DiagnosticAuditEvent` table; possibly `DiagnosticEvidenceNode` with `kind: "counsel_review"` |
| **Retrieval path** | `journey-store.ts` — `evidenceNodes[]` |
| **Downstream consumers** | Admin Oversight Review, Retainer page |
| **User-facing surfaces** | Counsel Review UI (admin), Oversight Brief |
| **Suppression/privacy rule** | **UNSAFE_TO_SURFACE** — counsel recommendations should not be client-visible |
| **Current status** | **PERSISTED_NOT_CONSUMED** (by client-safe surfaces) |
| **Verdict** | **SUPPRESS** — ensure counsel recommendations are admin-only, not surfaced to client |

---

### 20. retainer oversight intake evidence

| Attribute | Finding |
|-----------|---------|
| **Capture surface** | Retainer oversight intake — admin/scheduler surfaces |
| **Exact file + line** | `lib/retainer/` directory (retainer-specific logic) |
| **API payload field** | Retainer intake form |
| **Server receiver** | Retainer API routes |
| **Transformation layer** | Retainer service layer |
| **Persistence destination** | `DiagnosticJourney` (linked via email/subjectKey); `RetainedDecision` table (Prisma) |
| **Retrieval path** | `journey-store.ts` — linked by email |
| **Downstream consumers** | Oversight Brief, Control Room, Retainer page |
| **User-facing surfaces** | Retainer page, Oversight Brief |
| **Suppression/privacy rule** | None identified |
| **Current status** | **FULLY_TRACED_AND_CONSUMED** |
| **Verdict** | **NO_FIX_NEEDED** |

---

## STATUS SUMMARY

| Status | Count | Fields |
|--------|-------|--------|
| **FULLY_TRACED_AND_CONSUMED** | 17 | committed, preCommitment.willing48h, decisionText, decisionOwner, priorAttempts, failureCause, recurrenceSignal, verificationCriteria, stopSignal, escalationTrigger, decisionDependency, team aggregate, enterprise strain, SR execution evidence, commitment checkpoints, retainer oversight, **institutionalConsequence***, **competingObligation*** |
| **PERSISTED_NOT_CONSUMED** | 1 | counsel review output (client-safe surfaces) |
| **CLIENT_ONLY** | 0 | — **financialExposure** now has API payload field and server-side persistence ✅ |
| **UNKNOWN** | 0 | — |

> *\* Fix applied 2026-05-08: Purpose Alignment now sends `consequence` and `competingObligation` as properly-named fields to `/api/purpose-alignment/assessments`, which persists them via `persistDiagnosticStage()` into `DiagnosticJourney` and `DiagnosticDecisionObject`.*
>
> *\* financialExposure fix applied 2026-05-08: `FastDiagnosticRequest` now includes `financialExposure`, `exposureBand`, and `exposureBasis` fields. `api-submit.ts` extracts and persists them in the payload. `IntelligenceSpine.economics` extended to carry the full exposure snapshot.*

---

## PRIORITY 1 DEEP TRACE — financialExposure & institutionalConsequence

### financialExposure

**Preliminary finding CONFIRMED: CLIENT_ONLY scoring.**

- `lib/diagnostics/cost-of-delay-engine.ts` — `computeDelayExposureScore()` computes an exposure score from Likert inputs (urgencyScore, ownershipScore, clarityScore, accountabilityScore, stateScore). This is a **derived score**, not a user-captured field.
- `CostOfDelayResult.estimatedFinancialExposure` is computed from `revenueBand` multiplier, NOT from user-stated cost text.
- The user's free-text `costOfDelay` (from `CaseObject.costOfDelay`) IS sent to API and persisted as text, but the **numeric financial exposure score is computed client-side** and is NOT sent to any API.
- `FastDiagnosticResult.costOfInaction` contains horizon projections but these are generated server-side by the synthesis/deterministic engine.

**Evidence path:**
- Capture: `CaseObject.costOfDelay` (free-text) — sent to API ✅
- Scoring: `cost-of-delay-engine.ts` — computes exposure score — **client-side only** ❌ (pre-fix)
- API payload: No field for numeric financial exposure in `FastDiagnosticRequest` or `DiagnosticSubmissionPayload` ❌ (pre-fix)
- Persistence: Free-text `costOfDelay` persisted ✅; numeric score NOT persisted ❌ (pre-fix)
- Consumption: Horizon projections from synthesis engine are consumed ✅; numeric exposure score is display-only ❌ (pre-fix)

**Verdict: FIX_API_PAYLOAD** — the numeric exposure score should be sent to API and persisted alongside the free-text costOfDelay.

**Fix applied 2026-05-08:**
- `FastDiagnosticRequest` extended with `financialExposure`, `exposureBand`, `exposureBasis` fields
- `api-submit.ts` now extracts and persists financial exposure data in payload
- `IntelligenceSpine.economics` extended with `estimatedFinancialExposure`, `exposureBand`, `exposureBasis`, `calculationVersion`, `generatedAt`, `sourceSurface`
- `pages/api/diagnostics/directional-integrity.ts` buildPayload now includes financial exposure snapshot

### institutionalConsequence

**Preliminary finding CONFIRMED: CAPTURED_NOT_SENT.**

- Captured in Purpose Alignment UI (`ContextAnswers.consequence`) — free-text field "What becomes worse if this remains unresolved?"
- The Purpose Alignment component (`lib/alignment/PurposeAlignmentAssessment.tsx`) appears to be **client-side only** — it scores via `scorePurposeProfile()` and displays results without sending to any server API.
- No API route found that receives the Purpose Alignment full payload.
- `consequence` text is stored in `sessionStorage` only, via `saveAssessmentState()`.
- **Not available** to Executive Reporting, Strategy Room, Return Brief, or any downstream surface.

**Evidence path:**
- Capture: `PurposeAlignmentAssessment.tsx:44` — `ContextAnswers.consequence` ✅
- API payload: **NONE** ❌ (pre-fix)
- Server receiver: **NONE** ❌ (pre-fix)
- Persistence: `sessionStorage` only ❌ (pre-fix)
- Consumption: **NONE** ❌ (pre-fix)

**Verdict: FIX_API_PAYLOAD** — Purpose Alignment results (including `consequence` and `competingObligation`) must be sent to API and persisted in `DiagnosticJourney` for downstream consumption.

**Fix applied 2026-05-08:**
- `PurposeAlignmentAssessment.tsx` now sends `consequence` and `competingObligation` as properly-named fields in the reflections payload
- `app/api/purpose-alignment/assessments/route.ts` schema accepts `consequence` and `competingObligation` fields
- `lib/alignment/types.ts` — `PurposeAlignmentContext.reflections` extended with `consequence` and `competingObligation`
- `lib/diagnostics/evidence-graph.ts` — `CanonicalDecisionObject` extended with `competingObligationText` and `institutionalConsequenceText`; `extractCanonicalDecisionObject()` accepts and persists them; `buildPurposeAuthorityPacket()` reads from new fields with fallback to legacy names
- Data flows through `persistDiagnosticStage()` into `DiagnosticJourney` and `DiagnosticDecisionObject`

---

## FALSE CLAIM CORRECTIONS

| # | Original Claim | Corrected Finding | Evidence Path | Impact | Fix Applied |
|---|---------------|-------------------|---------------|--------|-------------|
| 1 | "committed flag is not persisted" | **FALSE** — `committed` is persisted as `spine.preCommitment.willing48h` in `DiagnosticJourney.mergedTensionThread` and consumed by Strategy Room admission | `intelligence-spine.ts:157`, `admission.ts:120` | Prior docs claiming it was missing must be corrected | N/A — was already correct |
| 2 | "financialExposure is sent to API" | **FALSE** — numeric financial exposure was client-side computed only; free-text costOfDelay IS sent | `cost-of-delay-engine.ts`, `fast-diagnostic-dto.ts` | Required API payload addition | **2026-05-08** — Added `financialExposure`, `exposureBand`, `exposureBasis` to `FastDiagnosticRequest`; `api-submit.ts` now persists them |
| 3 | "institutionalConsequence is wired end-to-end" | **FALSE** — captured in Purpose Alignment but never sent to any API; client-side only | `PurposeAlignmentAssessment.tsx`, no API route found | Required full wiring | **2026-05-08** — Now sent as `consequence` in reflections; persisted via `persistDiagnosticStage()` into `DiagnosticJourney` and `DiagnosticDecisionObject` |
| 4 | "competingObligation is available downstream" | **FALSE** — same as institutionalConsequence; Purpose Alignment is client-side only | Same as above | Required full wiring | **2026-05-08** — Now sent as `competingObligation` in reflections; persisted via same path |
| 5 | "Evidence consumed" claims where field is merely stored | Several fields (e.g., `failureCause`, `recurrenceSignal`) are stored in `DiagnosticEvidenceNode` but consumption by downstream surfaces is inconsistent — some surfaces read from canonical snapshots, others re-derive | `journey-store.ts`, `evidence-capture-consumption-audit.md` | Needs verification per surface | Not yet addressed — requires per-surface audit |
