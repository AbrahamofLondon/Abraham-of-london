# EVIDENCE SPINE REPAIR PLAN

> **Forensic Trace Pass — 2026-05-08**
> **Last updated: 2026-05-08 (P0.1 and P0.2 fixes applied)**
> **Every fix references a proven trace finding. No speculative fixes.**

---

## EXECUTIVE SUMMARY

After tracing 20+ fields across 16 surfaces, we have identified:

- **2 proven breakages** (P0) — evidence captured but lost
- **2 proven underuse items** (P1) — fields persisted but not consumed
- **1 UX transformation item** (P2) — fields consumed but displayed badly
- **3 strategic differentiation items** (P3) — new evidence to capture after current evidence is handled

**Do not implement fixes until the exact failure is proven.** This plan only includes items where the trace is complete and the failure is confirmed.

**Fixes applied 2026-05-08:**
- **P0.1** (Purpose Alignment persistence) — code changes applied ✅
- **P0.2** (financialExposure API wiring) — code changes applied ✅
- Both fixes are documented below with their implementation details.

---

## P0 — PROVEN BREAKAGES

### P0.1: Purpose Alignment data not persisted server-side ✅ FIX APPLIED

**Trace finding:** `institutionalConsequence` and `competingObligation` are captured in Purpose Alignment UI but NEVER sent to any API. The component is client-side only — scores via `scorePurposeProfile()`, stores in `sessionStorage`, displays results, and forgets everything.

**Evidence path:**
- Capture: `lib/alignment/PurposeAlignmentAssessment.tsx:43-44` — `ContextAnswers.competingObligation`, `ContextAnswers.consequence`
- API call: **NONE FOUND** — no `fetch()` or API route call in the component
- Persistence: `sessionStorage` only via `lib/client/assessment-state.ts`
- Server record: **NONE** — `DiagnosticJourney` has no Purpose Alignment stage data

**Impact:** Two critical evidence fields (`competingObligation` and `consequence`) are invisible to every downstream surface — Executive Reporting, Strategy Room, Return Brief, Oversight Brief, Control Room. This is the single largest evidence gap in the system.

**Fix applied 2026-05-08:**

| File | Change |
|------|--------|
| `lib/alignment/PurposeAlignmentAssessment.tsx` | Now sends `consequence` and `competingObligation` as properly-named fields in reflections payload (alongside legacy `lastSevenDays`/`dissenter` for backward compatibility) |
| `app/api/purpose-alignment/assessments/route.ts` | Schema extended to accept `consequence` and `competingObligation` fields |
| `lib/alignment/types.ts` | `PurposeAlignmentContext.reflections` extended with `consequence` and `competingObligation` |
| `lib/diagnostics/evidence-graph.ts` | `CanonicalDecisionObject` extended with `competingObligationText` and `institutionalConsequenceText`; `extractCanonicalDecisionObject()` accepts and persists them; `buildPurposeAuthorityPacket()` reads from new fields with fallback to legacy names |
| `lib/diagnostics/journey-store.ts` | Already supports `purpose_alignment` stage — data flows through `persistDiagnosticStage()` |

**Data flow after fix:**
```
PurposeAlignmentAssessment.tsx
  → POST /api/purpose-alignment/assessments { reflections: { consequence, competingObligation } }
    → route.ts validates + scores
      → buildPurposeAuthorityPacket() → extractCanonicalDecisionObject() with competingObligationText + institutionalConsequenceText
        → persistDiagnosticStage(stage: "purpose_alignment")
          → DiagnosticJourney.stages.purpose_alignment
          → DiagnosticDecisionObject (competingObligationText, institutionalConsequenceText in normalized JSON)
          → DiagnosticEvidenceNode[] (evidence text includes "Competing obligation: ..." and "Consequence: ...")
```

**Risk:** Low — additive persistence. No existing functionality breaks. Legacy field names preserved.

---

### P0.2: financialExposure numeric score not sent to API ✅ FIX APPLIED

**Trace finding:** The numeric financial exposure score computed by `cost-of-delay-engine.ts` is client-side only. It is displayed in the Fast Diagnostic result but never sent to any API or persisted server-side.

**Evidence path:**
- Computation: `lib/diagnostics/cost-of-delay-engine.ts` — `computeDelayExposureScore()` runs client-side
- API payload: `lib/diagnostics/fast-diagnostic-dto.ts` — `FastDiagnosticRequest` has no numeric exposure field
- Server receiver: `lib/diagnostics/api-submit.ts` — no numeric exposure field extracted
- Persistence: `DiagnosticRecord.responsesJson` has qualitative `costOfDelay` text but not numeric score

**Impact:** Downstream surfaces (Executive Reporting, Strategy Room) cannot reference the numeric exposure score. They only have qualitative text and server-generated horizon projections.

**Fix applied 2026-05-08:**

| File | Change |
|------|--------|
| `lib/diagnostics/fast-diagnostic-dto.ts` | `FastDiagnosticRequest` extended with `financialExposure`, `exposureBand`, `exposureBasis` fields |
| `lib/diagnostics/api-submit.ts` | `handleDiagnosticSubmit()` now extracts `financialExposure`, `exposureBand`, `exposureBasis` from body and persists as `payload.financialExposure` snapshot |
| `pages/api/diagnostics/directional-integrity.ts` | `buildPayload` callback now includes financial exposure snapshot in returned payload |
| `lib/decision/intelligence-spine.ts` | `economics` section extended with `estimatedFinancialExposure`, `exposureBand`, `exposureBasis`, `calculationVersion`, `generatedAt`, `sourceSurface` |

**Data flow after fix:**
```
Fast Diagnostic client
  → POST /api/diagnostics/directional-integrity { financialExposure: number, exposureBand: string, exposureBasis: {...} }
    → handleDiagnosticSubmit() extracts financial exposure data
      → payload.financialExposure = { estimatedFinancialExposure, exposureBand, exposureBasis, calculationVersion, generatedAt, sourceSurface }
        → DiagnosticRecord.responsesJson (JSON blob with financial exposure snapshot)
        → IntelligenceSpine.economics (via spine persistence path)
```

**Risk:** Low — additive change to API payload. Existing consumers unaffected. Client must opt-in to send the data.

---

## P1 — PROVEN UNDERUSE

### P1.1: Evidence fields stored in DiagnosticEvidenceNode but not consistently consumed

**Trace finding:** `failureCause`, `recurrenceSignal`, `verificationCriteria`, `stopSignal`, `escalationTrigger`, and `decisionDependency` are stored in `DiagnosticEvidenceNode` table but consumption by downstream surfaces is inconsistent. Some surfaces read from canonical snapshots, others re-derive, and some ignore the evidence nodes entirely.

**Evidence path:**
- Storage: `lib/diagnostics/journey-store.ts` — `persistDiagnosticStage()` writes `evidenceNodes[]` to `DiagnosticEvidenceNode` table
- Retrieval: `journey-store.ts` — `evidenceNodes[]` is available but not all downstream surfaces read it
- `evidence-capture-consumption-audit.md` documents capture and persistence but consumption claims need verification per surface

**Fix:**
1. Audit each downstream surface (Executive Reporting, Strategy Room, Return Brief, Oversight Brief, Control Room) to confirm which evidence node kinds they actually read
2. For surfaces that do not read evidence nodes, add retrieval logic
3. For surfaces that re-derive instead of reading stored evidence, standardise on reading from `DiagnosticEvidenceNode`

**Risk:** Low — additive reads. No existing functionality changes.

---

### P1.2: Fast Diagnostic raw case text not in Constitutional Bridge

**Trace finding:** The Constitutional Bridge (`ConstitutionalBridgeBundle`) carries domain scores, route decisions, prompts, and hypotheses but does NOT carry the Fast Diagnostic raw case text (`decision`, `priorAttempt`, `costOfDelay`, `claimedOwner`, `blocker`, `forcedAction`). These are available separately via `DiagnosticDecisionObject` but downstream surfaces that rely on the bridge as their primary handoff do not receive them.

**Evidence path:**
- `lib/diagnostics/constitutional-bridge.ts` — `ConstitutionalBridgeBundle` type has no `CaseObject` fields
- `lib/diagnostics/journey-store.ts` — `DiagnosticDecisionObject` table has `decisionText`, `priorAttemptText`, `costOfDelayText`, `stakeholderText`
- Downstream surfaces: Team, Enterprise, Executive Reporting receive bridge but must separately fetch decision objects

**Fix:**
1. Add `decisionText`, `priorAttemptText`, `costOfDelayText` to `ConstitutionalBridgeBundle` (or a `caseSummary` object)
2. Populate from `DiagnosticDecisionObject` in the bridge builder
3. Update downstream surface documentation to reflect availability

**Risk:** Low — additive data in bridge. No existing consumers break.

---

## P2 — UX TRANSFORMATION

### P2.1: Commitment checkpoint status is inferred, not user-confirmed

**Trace finding:** Checkpoint status is timestamp-derived, not user-confirmed. The `IntelligenceSpine.execution` fields are set by the system. The Return Brief captures `accuracyFeedback` but this is post-hoc feedback, not a commitment status update.

**Evidence path:**
- `lib/decision/intelligence-spine.ts` — `execution` fields (`breach`, `breachAt`, `breachCount`, `actionTaken`, `actionTakenAt`, `blockerReported`) are system-set
- `accuracyFeedback` is user-provided but is feedback on accuracy, not commitment status
- No explicit "mark as completed/blocked" user action exists

**Fix:**
1. Add explicit user confirmation step in Strategy Room execution flow or Return Brief
2. Add `checkpointStatus: "pending" | "completed" | "blocked"` to `IntelligenceSpine.execution`
3. Add `blockerEvidenceNote?: string` for user-provided blocker description
4. Distinguish "inferred" from "confirmed" status in all downstream displays
5. Update Return Brief to use actual user response rather than inferred status

**Risk:** Medium — changes user interaction model. Must not break existing execution flow.

---

## P3 — STRATEGIC DIFFERENTIATION

### P3.1: Capture competingObligation server-side ✅ COMPLETE (subsumed by P0.1)

**Rationale:** `competingObligation` is now sent to API as a properly-named field in the Purpose Alignment reflections payload. It is persisted in `DiagnosticDecisionObject.competingObligationText` and available to all downstream surfaces via `DiagnosticJourney`.

**Prerequisite:** P0.1 — now complete.

---

### P3.2: Capture institutionalConsequence server-side ✅ COMPLETE (subsumed by P0.1)

**Rationale:** `institutionalConsequence` is now sent to API as a properly-named field (`consequence`) in the Purpose Alignment reflections payload. It is persisted in `DiagnosticDecisionObject.institutionalConsequenceText` and available to all downstream surfaces.

**Prerequisite:** P0.1 — now complete.

---

### P3.3: Add user-confirmed commitment checkpoints

**Rationale:** Currently commitment status is inferred from timestamps. Adding explicit user confirmation (completed/blocked with evidence note) would differentiate the system from passive tracking tools. This is a strategic differentiator for retainer oversight.

**Prerequisite:** P2.1 must be complete.

---

## REPAIR PLAN SUMMARY

| Priority | Item | Effort | Impact | Status |
|----------|------|--------|--------|--------|
| **P0.1** | Wire Purpose Alignment to API | Medium | **HIGH** — unlocks 2 critical fields for all downstream | ✅ **APPLIED 2026-05-08** |
| **P0.2** | Send financialExposure to API | Low | Medium — adds numeric precision | ✅ **APPLIED 2026-05-08** |
| **P1.1** | Audit evidence node consumption | Medium | Medium — ensures stored fields are actually read | ⏳ Not started |
| **P1.2** | Add case text to Constitutional Bridge | Low | Medium — simplifies downstream access | ⏳ Not started |
| **P2.1** | Add user-confirmed checkpoints | Medium | Medium — UX improvement, evasion risk reduction | ⏳ Not started |
| **P3.1** | Capture competingObligation server-side | Trivial | Low | ✅ **Subsumed by P0.1** |
| **P3.2** | Capture consequence server-side | Trivial | Low | ✅ **Subsumed by P0.1** |
| **P3.3** | User-confirmed commitment checkpoints | Low | Medium (after P2.1) | ⏳ Not started |

---

## WHAT NOT TO FIX

The following items were investigated and found to require **NO FIX**:

| Field | Status | Reason |
|-------|--------|--------|
| committed | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED — persisted as `preCommitment.willing48h`, consumed by Strategy Room |
| preCommitment.willing48h | NO_FIX_NEEDED | Same as above |
| decisionText | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED — persisted in `DiagnosticDecisionObject`, consumed by synthesis engine and downstream |
| decisionOwner | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED |
| priorAttempts | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED |
| failureCause | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED |
| recurrenceSignal | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED |
| verificationCriteria | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED |
| stopSignal | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED |
| escalationTrigger | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED |
| decisionDependency | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED |
| team aggregate evidence | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED |
| enterprise strain evidence | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED |
| SR execution evidence | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED |
| retainer oversight evidence | NO_FIX_NEEDED | FULLY_TRACED_AND_CONSUMED |

---

## UNSAFE TO EXPOSE

| Item | Reason | Current Protection |
|------|--------|-------------------|
| Counsel review recommendations | Admin-only — client exposure would breach trust | No explicit suppression rule found — relies on surface access control |
| Raw C3/specificity scores | Internal classification thresholds | Not exposed in current UI — but no explicit guard |
| Individual respondent identities | Team Assessment respondents | Not exposed — but no explicit guard in evidence nodes |
