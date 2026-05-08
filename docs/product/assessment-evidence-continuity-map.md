# Assessment Evidence Continuity Map

> Date: 2026-05-08
> Purpose: Trace every evidence field from capture to consumption. Identify broken chains.

---

## Evidence Field Status

| Field | Captured Where | Stored Where | Consumed Where | Classification |
|-------|---------------|-------------|----------------|---------------|
| **decision** (Fast Diagnostic Q1) | `pages/diagnostics/fast.tsx` | sessionStorage, case object, evidence graph | Synthesis engine, spine renderer, return brief | CAPTURED_AND_USED |
| **blocker / claimedOwner** (Fast Diagnostic Q2) | `pages/diagnostics/fast.tsx` | sessionStorage, case object | Synthesis engine, authority classification | CAPTURED_AND_USED |
| **consequence** (Fast Diagnostic Q3) | `pages/diagnostics/fast.tsx` | sessionStorage, case object | Synthesis engine, cost clock | CAPTURED_AND_USED |
| **committed** (Fast Diagnostic Q4) | `pages/diagnostics/fast.tsx` | **NOT PERSISTED to DB** | Return Brief uses decision status as proxy | **MISSING** |
| **avoidedDecision** (PA context) | `lib/alignment/PurposeAlignmentAssessment.tsx` | API request, decision memory | UI display, decision memory, evidence graph | CAPTURED_AND_USED (but not by Return Brief) |
| **competingObligation** (PA context) | `lib/alignment/PurposeAlignmentAssessment.tsx` | **Request body only** | **UI display only** | **CAPTURED_NOT_USED** |
| **consequence** (PA context Q3) | `lib/alignment/PurposeAlignmentAssessment.tsx` | API request as `lastSevenDays` | Pattern scoring, authority packet | PARTIALLY_USED |
| **priorAttemptOutcome** (ER intake) | `pages/diagnostics/executive-reporting/run.tsx` | DiagnosticDecisionObject (DB) | ER narrative, evidence graph, return brief (failureComparison) | CAPTURED_AND_USED |
| **costOfDelayText** (ER intake) | `pages/diagnostics/executive-reporting/run.tsx` | DiagnosticDecisionObject (DB) | ER narrative, return brief (cost clock), AI risk | CAPTURED_AND_USED |
| **verificationCriteria** (ER intake) | `pages/diagnostics/executive-reporting/run.tsx` | Intake payload `decisionNeed.verificationCriteria` | Return Brief checks `carryForwardSource.verificationCriteria` | **PARTIALLY_USED** — persisted in payload but path to carryForwardSource not verified |
| **constitutional route** | `lib/diagnostics/constitutional-diagnostic-derivation.ts` | Journey routeDecisions (DB) | Strategy Room admission (hard gate) | CAPTURED_AND_USED |
| **contradictions** (PA + Constitutional) | `lib/server/decision/contradiction-engine.server.ts` | Evidence graph nodes (DB) | Return Brief (contradiction re-exposure), retainer trigger (count >= 3) | CAPTURED_AND_USED |
| **teamAnswers** (respondent) | `app/assessment/[token]/page.tsx` | Campaign response aggregate (DB) | **Aggregate only — NOT linked to ER, SR, or Return Brief** | **CAPTURED_NOT_USED** (downstream) |
| **decision dependency** | Not directly captured | — | — | **MISSING** |
| **stop condition** | Not captured anywhere | — | — | **MISSING** |
| **escalation trigger** | Computed from tensions | Tension thread (sessionStorage) | Authority enforcement | USED_IN_ROUTING |
| **authority owner** (specific person) | Fast Diagnostic Q2 (`claimedOwner`) | Case object | Synthesis, authority classification | CAPTURED_AND_USED |
| **team divergence** | Team assessment aggregation | Campaign aggregate (DB) | Team tension evidence extraction | USED_IN_ROUTING |
| **enterprise strain** | Enterprise Likert scoring | Not bridged downstream | — | **CAPTURED_NOT_USED** |
| **political resistance** | Enterprise q12 ("Corrective action can still be taken...") | Likert score | Not surfaced downstream explicitly | USED_ONLY_IN_COPY |
| **counsel trigger** | Computed from tension escalation | Authority enforcement | Strategy Room access gating | USED_IN_ROUTING |
| **boardroom threshold** | Computed from oversight cycle analysis | Oversight cycle composer | Oversight brief, dossier builder | USED_IN_OVERSIGHT |
| **outcome evidence** | Outcome verification flow | Evidence graph (outcome_delta) | Return Brief, retainer qualification | CAPTURED_AND_USED |

---

## Broken Chains (P1 Fixes Required)

### 1. committed flag — MISSING
**Capture:** Fast Diagnostic stores `committed: true/false` in component state
**Persistence:** NOT persisted to database. No Prisma field.
**Consumption:** Return Brief checks decision status as proxy but never sees the explicit commitment
**Impact:** The product's most differentiating moment (commitment before results) leaves no durable trace
**Fix:** Persist `committed` flag to case object or diagnostic stage record

### 2. competingObligation — CAPTURED_NOT_USED
**Capture:** Purpose Alignment form field, mapped to `dissenter` in reflections
**Persistence:** Request body only — not stored in canonical evidence
**Consumption:** UI display during result only
**Impact:** "What you are protecting at the expense of the decision" — one of the most valuable signals — vanishes
**Fix:** Persist to evidence graph as `competing_obligation` node. Surface in Return Brief.

### 3. teamAnswers — CAPTURED_NOT_USED downstream
**Capture:** Respondent form, aggregated per campaign
**Persistence:** DB aggregate
**Consumption:** Internal team analysis only. NOT linked to Executive Reporting, Strategy Room, or Return Brief.
**Impact:** Executive Reporting operates blind to team-level evidence even when it exists
**Fix:** Bridge team aggregate into ER inherited signals. Display gap analysis in Control Room.

### 4. verificationCriteria — PARTIALLY_USED
**Capture:** ER intake form field (added this pass)
**Persistence:** In `decisionNeed` payload
**Consumption:** Return Brief checks `carryForwardSource.verificationCriteria` but the field must be extracted from the intake payload into the carryForwardSource. Path not verified end-to-end.
**Impact:** Verification anchor may be captured but silently dropped before Return Brief
**Fix:** Verify extraction path from ER intake → diagnostic stage → carryForwardSource

### 5. enterprise strain — CAPTURED_NOT_USED
**Capture:** Enterprise Likert scoring (12 questions, 4 blocks)
**Persistence:** Score computed but not bridged
**Consumption:** Not surfaced in ER, SR, or Oversight
**Impact:** Enterprise Assessment exists as a standalone island — its evidence does not feed the governance ladder
**Fix:** Create enterprise evidence bridge parallel to constitutional bridge

---

## Strong Chains (Protect)

| Chain | Path | Status |
|-------|------|--------|
| Decision → Synthesis → Spine → Return Brief | Fast Diagnostic → case object → spine → return brief server | FULLY WIRED |
| Authority → Constitutional → Routing → Admission | Constitutional q2/q7 → authorityScore → classifyAuthorityType → evaluateConstitutionalRoute → Strategy Room admission | FULLY WIRED |
| Contradiction → Evidence Graph → Recurrence → Retainer | PA/Constitutional → contradiction engine → evidence nodes → longitudinal route → retainer trigger | FULLY WIRED |
| Cost of Delay → ER → Return Brief cost clock | ER intake → DiagnosticDecisionObject → return brief costOfInaction calc | FULLY WIRED |
| Prior Attempt → ER → Return Brief failure comparison | ER intake → DiagnosticDecisionObject → return brief failureComparison | FULLY WIRED |
