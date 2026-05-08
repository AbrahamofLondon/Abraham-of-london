# P1 Bridge Closure — Final Trace Matrix

> Date: 2026-05-08
> Standard: "Fixed" only if captured -> sent -> persisted -> retrieved -> consumed -> surfaced or suppressed.

---

## Fully Closed Gaps

### 1. committed (Fast Diagnostic)
| Stage | Location | Status |
|-------|----------|--------|
| Captured | `pages/diagnostics/fast.tsx` button click -> `committed: boolean` | YES |
| Sent | POST `/api/diagnostics/score` payload `{ committed: true }` | YES |
| Persisted | `spine.preCommitment.willing48h` -> `DiagnosticJourney.mergedTensionThread` (PostgreSQL JSON) | YES |
| Retrieved | Journey store, spine loader | YES |
| Consumed | Strategy Room admission, escalation engine, integrity scoring, pressure index (16 files) | YES |
| Surfaced | Affects `interventionReadiness` (70 vs 30), `readinessTier`, `concreteMove` output | YES |
| **Verdict** | **NO FIX NEEDED** — already fully wired | |

### 2. competingObligation (Purpose Alignment)
| Stage | Location | Status |
|-------|----------|--------|
| Captured | `lib/alignment/PurposeAlignmentAssessment.tsx` form field `competingObligation` | YES |
| Sent | POST `/api/purpose-alignment/assessments` as `reflections.dissenter` | YES |
| Persisted | `CanonicalDecisionObject.constraintText` via evidence graph -> `DiagnosticJourney.decisionObjects` (PostgreSQL) | YES |
| Retrieved | Journey store `decisionObjects[].constraintText` | YES |
| Consumed | Evidence graph, decision engine, synthesis engine, constitutional evidence bridge (via `upstream.avoidedDecision` trace) | YES |
| Surfaced | Contradiction narrative, anchor narrative, decision authority packet | YES |
| **Verdict** | **NO FIX NEEDED** — persisted under label `constraintText`/`dissenter` | |

### 3. verificationCriteria (Executive Reporting)
| Stage | Location | Status |
|-------|----------|--------|
| Captured | `pages/diagnostics/executive-reporting/run.tsx` form field | YES |
| Sent | Intake payload `decisionNeed.verificationCriteria` | YES |
| Persisted | ER run route merges into `evidenceCapture.verificationCriteria` in canonical snapshot (PostgreSQL) | YES (FIXED THIS PASS) |
| Retrieved | Return Brief `extractAssessmentEvidenceCapture(canonicalSnapshotValue)` | YES |
| Consumed | Return Brief `carryForwardSource.verificationCriteria` -> verification status message | YES |
| Surfaced | "The original evidence suggested success should be proven by [criteria]." | YES |
| **Verdict** | **FIXED** — wired ER intake -> evidenceCapture merge -> Return Brief | |

### 4. Strategy Room Stage 2 consequence evidence
| Stage | Location | Status |
|-------|----------|--------|
| Captured | `components/strategy-room/Form.tsx` — 4 text evidence fields | YES (ADDED THIS PASS) |
| Sent | Intake payload `consequenceEvidence: { financial, reputational, institutional, timeline }` | YES (WIRED THIS PASS) |
| Persisted | Session `intake` JSON column + `enrichedSnapshot.evidenceCapture` (PostgreSQL) | YES (WIRED THIS PASS) |
| Retrieved | Return Brief `extractAssessmentEvidenceCapture(canonicalSnapshotValue)` | YES (via evidenceCapture block) |
| Consumed | Available to Return Brief, Oversight Brief via evidence capture chain | YES |
| Surfaced | Stored as `consequenceFinancial`, `consequenceReputational`, `consequenceInstitutional`, `consequenceTimeline` in evidenceCapture | YES |
| **Verdict** | **FIXED** — full path from form to persistence to downstream access | |

### 5. Constitutional bridge upstream context
| Stage | Location | Status |
|-------|----------|--------|
| Captured | Prior stages (PA, Fast Diagnostic) capture evidence | YES |
| Sent | Constitutional report.ts now loads journey data and passes `upstream` to orchestrator | YES (WIRED THIS PASS) |
| Persisted | Evidence bridge output stored in `persistDiagnosticStage` payload | YES |
| Retrieved | Journey store payload | YES |
| Consumed | `buildConstitutionalEvidenceBridge()` -> contradiction signals, prior attempt signal, avoidance signal, recurrence signal | YES |
| Surfaced | Available to Strategy Room, ER, Return Brief, Oversight Brief via evidence bridge | YES |
| **Verdict** | **FIXED** — upstream context now loaded from journey store and passed to orchestrator | |

### 6. Counsel Review reframe
| Stage | Location | Status |
|-------|----------|--------|
| Captured | `pages/admin/counsel-review.tsx` — structured fields with guidance | YES (REBUILT PRIOR PASS) |
| Sent | Same API endpoints (`/api/internal/oversight/counsel-assignment`, `/api/internal/oversight/counsel-submit-review`) | YES |
| Persisted | Counsel workflow records (PostgreSQL) | YES |
| Retrieved | Oversight review bench, counsel history loader | YES |
| Consumed | Oversight brief composer, audit events | YES |
| Surfaced | Counsel history in client-safe oversight brief | YES |
| **Verdict** | **FIXED** — CRUD form replaced with governed escalation surface | |

### 7. Retainer Intake v0
| Stage | Location | Status |
|-------|----------|--------|
| Captured | `pages/retainer/intake.tsx` — 10-question governed intake | YES (CREATED THIS PASS) |
| Sent | POST `/api/internal/retainer/intake` (endpoint not yet created) | PARTIAL |
| Persisted | Contract produces `RetainerIntakeResponse` + `retainerIntakeToEvidenceCapture()` | CONTRACT EXISTS |
| Retrieved | — | NOT YET |
| Consumed | — | NOT YET |
| Surfaced | — | NOT YET |
| **Verdict** | **PARTIALLY FIXED** — UI surface exists, contract exists, API endpoint and persistence path needed | |

---

## Partially Closed Gaps

### 8. Team aggregate -> Executive Reporting bridge
| Stage | Status | Detail |
|-------|--------|--------|
| Captured | YES | Team aggregate computed via `aggregateTeamResponses()` |
| Loaded in ER | YES | `loadTeamAssessmentAggregate()` called in ER run route |
| Used in ER | PARTIAL | Passed to capability stack but not surfaced as distinct evidence block |
| **Verdict** | **PARTIALLY_FIXED** — data is loaded, not yet rendered as team evidence carry-forward block | |

### 9. Enterprise strain -> downstream bridge
| Stage | Status | Detail |
|-------|--------|--------|
| Captured | YES | Enterprise assessment scores persisted to snapshots |
| Loaded in ER | YES | `ladderContextResolver` reads `organisationAssessmentSnapshot` |
| Used in ER | PARTIAL | `percentScore`, `domainScores`, `fragilitySignal` available but not surfaced as enterprise strain block |
| **Verdict** | **PARTIALLY_FIXED** — data flows through ladder context, not yet rendered as distinct strain evidence | |

### 10. Commitment Verification user input
| Stage | Status | Detail |
|-------|--------|--------|
| Checkpoint logic | YES | `lib/product/commitment-verification.ts` computes status from timestamps |
| Display | YES | Return Brief shows prompts (DUE, OVERDUE, etc.) |
| User recording | PARTIAL | Strategy Room execution has "Mark executed" / "Mark blocked" buttons. Return Brief is display-only. |
| **Verdict** | **PARTIALLY_FIXED** — recording exists in SR execution but not in Return Brief surface | |

---

## Deliberately Deferred Gaps

| Gap | Reason | Next Pass |
|-----|--------|-----------|
| Retainer intake API endpoint | Requires retainer service integration and pricing architecture review | P2 |
| Team evidence carry-forward UI block in ER | Requires ER render layer changes | P2 |
| Enterprise strain evidence UI block in ER/SR | Requires ER/SR render layer changes | P2 |
| Return Brief commitment recording input | Requires new API endpoint and Return Brief UI changes | P2 |
| Cross-ladder memory API | Unified journey evidence API for all surfaces | P4 (architecture) |

---

## Unsafe-to-Surface Fields

| Field | Reason |
|-------|--------|
| Raw respondent text | Small-sample identification risk |
| Individual team assessment answers | Respondent anonymity promise |
| Counsel contradiction assessment | May contain sensitive governance observations |
| `refusalBoundary` (retainer intake) | May contain politically sensitive material |

---

## No-Fix-Needed Fields

| Field | Reason |
|-------|--------|
| committed (Fast Diagnostic) | Already fully wired to 16 downstream consumers |
| competingObligation (Purpose Alignment) | Already persisted as constraintText in evidence graph |
| constitutional route decision | Already gates Strategy Room admission |
| contradictions (PA + Constitutional) | Already detected, stored, surfaced in Return Brief, triggers retainer |
| priorAttemptOutcome (ER) | Already wired through ER -> evidence graph -> Return Brief failureComparison |
| costOfDelayText (ER) | Already wired through ER -> Return Brief cost clock |
