# AUDIT CORRECTION LOG

> **Forensic Trace Pass — 2026-05-08**
> **Last updated: 2026-05-08 (Repair Pass applied)**
> **Purpose: Track where prior audits or implementation reports were wrong, incomplete, or overstated.**

---

## ENTRY 1: committed flag persistence

| Field | Detail |
|-------|--------|
| **Original claim** | "The committed flag is not persisted" / "committed is lost between Fast Diagnostic and downstream" |
| **Source of claim** | Prior audit passes, verbal reports during implementation reviews |
| **Corrected finding** | **FALSE CLAIM.** `committed` IS persisted as `spine.preCommitment.willing48h` in `IntelligenceSpine`, which is written to both `sessionStorage` (encrypted) and `DiagnosticJourney.mergedTensionThread` (PostgreSQL) via `persistSpineToJourney()`. It is consumed by Strategy Room admission (`admission.ts:120` — checks `context.preCommitment`) and by integrity scoring. |
| **Evidence path** | `lib/decision/intelligence-spine.ts:157` — `createSpine()` stores `preCommitment: { willing48h: boolean }`; `lib/decision/spine-persistence.ts:115` — `persistSpineToJourney()` writes to `DiagnosticJourney.mergedTensionThread`; `lib/strategy-room/admission.ts:120` — `if (!context.preCommitment)` check |
| **Impact** | Low — the claim was incorrect but did not cause code changes. However, it may have influenced trust in the evidence system. |
| **Required correction** | All prior docs that claimed `committed` is missing must be updated. The field is FULLY_TRACED_AND_CONSUMED. |

---

## ENTRY 2: financialExposure API wiring

| Field | Detail |
|-------|--------|
| **Original claim** | "financialExposure is wired end-to-end" / "cost of delay is captured and persisted" |
| **Source of claim** | Implementation reports, system map docs |
| **Corrected finding** | **PARTIALLY FALSE.** The free-text `costOfDelay` IS captured and persisted. However, the **numeric financial exposure score** computed by `cost-of-delay-engine.ts` is **client-side only** — it is computed from Likert inputs and displayed in the Fast Diagnostic result but is NOT sent to any API or persisted server-side. The `FastDiagnosticRequest` type has no field for numeric financial exposure. |
| **Evidence path** | `lib/diagnostics/cost-of-delay-engine.ts` — `computeDelayExposureScore()` is client-side; `lib/diagnostics/fast-diagnostic-dto.ts` — `FastDiagnosticRequest` has no numeric exposure field; `lib/diagnostics/api-submit.ts` — `handleDiagnosticSubmit()` receives `body` but no numeric exposure field is extracted |
| **Impact** | Medium — downstream surfaces (Executive Reporting, Strategy Room) cannot reference the numeric exposure score. They only have the qualitative `costOfDelay` text and the server-generated horizon projections from the synthesis engine. |
| **Required correction** | Add numeric `financialExposure` to API payload and persist alongside free-text `costOfDelay`. |

---

## ENTRY 3: institutionalConsequence end-to-end wiring

| Field | Detail |
|-------|--------|
| **Original claim** | "Consequence evidence is captured and available downstream" / "Purpose Alignment feeds into Executive Reporting" |
| **Source of claim** | System architecture docs, bridge documentation |
| **Corrected finding** | **FALSE.** `institutionalConsequence` is captured in Purpose Alignment UI (`ContextAnswers.consequence`) but the Purpose Alignment component is **client-side only**. It scores via `scorePurposeProfile()` and displays results without sending to any server API. The `consequence` text is stored in `sessionStorage` only. It is NOT available to Executive Reporting, Strategy Room, or any downstream surface. |
| **Evidence path** | `lib/alignment/PurposeAlignmentAssessment.tsx:44` — `ContextAnswers.consequence` captured; no API call found in component; `lib/client/assessment-state.ts` — `saveAssessmentState()` writes to `sessionStorage` only; no API route found that receives Purpose Alignment payload |
| **Impact** | **HIGH** — a critical evidence field (`consequence`) is invisible to every downstream surface. Executive Reporting consequence pricing, Strategy Room consequence display, and Oversight Brief all lack this context. |
| **Required correction** | Purpose Alignment must send results to API and persist in `DiagnosticJourney`. This is the single largest evidence gap in the system. |

---

## ENTRY 4: competingObligation end-to-end wiring

| Field | Detail |
|-------|--------|
| **Original claim** | "Competing obligations are captured and factored into downstream analysis" |
| **Source of claim** | Purpose Alignment documentation |
| **Corrected finding** | **FALSE.** Same as `institutionalConsequence` — captured in Purpose Alignment UI but never sent to API. `competingObligation` is client-side only, stored in `sessionStorage`, invisible to all downstream surfaces. |
| **Evidence path** | Same as Entry 3 — `PurposeAlignmentAssessment.tsx:43` |
| **Impact** | **HIGH** — `competingObligation` is critical context for understanding why commitments may not hold. Strategy Room, Return Brief, and Oversight Brief all lack this context. |
| **Required correction** | Same as Entry 3 — wire Purpose Alignment to API. |

---

## ENTRY 5: "Retainer ready" claims

| Field | Detail |
|-------|--------|
| **Original claim** | "The system is retainer-ready — all evidence flows into retainer oversight" |
| **Source of claim** | Retainer readiness audits, product docs |
| **Corrected finding** | **PARTIALLY FALSE.** The retainer surface reads from `DiagnosticJourney` (linked by email) and `RetainedDecision` table. However, Purpose Alignment data (`competingObligation`, `consequence`) is NOT available to retainer surfaces because it was never persisted server-side. The retainer surface has partial memory — it has constitutional, team, enterprise, executive reporting, and Strategy Room evidence, but not Purpose Alignment. |
| **Evidence path** | `lib/retainer/` directory — retainer logic reads from journey store; `DiagnosticJourney` does not contain Purpose Alignment data because it was never persisted |
| **Impact** | Medium — retainer oversight is missing the "why" context from Purpose Alignment. The retainer can see what decisions were made but not what competing obligations were at play. |
| **Required correction** | Wire Purpose Alignment to API. Update retainer readiness claims to reflect the gap. |

---

## ENTRY 6: "Evidence consumed" claims where field is merely stored

| Field | Detail |
|-------|--------|
| **Original claim** | Various claims across audit docs that evidence fields are "consumed" by downstream surfaces |
| **Source of claim** | `docs/product/evidence-capture-consumption-audit.md`, various surface audits |
| **Corrected finding** | **PARTIALLY OVERSTATED.** Several fields (`failureCause`, `recurrenceSignal`, `verificationCriteria`, `stopSignal`, `escalationTrigger`, `decisionDependency`) are stored in `DiagnosticEvidenceNode` table but consumption patterns are inconsistent. Some surfaces read from canonical snapshots, others re-derive from scratch. The `evidence-capture-consumption-audit.md` correctly identifies capture and persistence but the claim of "consumed" often means "stored and available" rather than "actively read and displayed." |
| **Evidence path** | `lib/product/evidence-capture-contract.ts` — defines capture fields; `lib/diagnostics/journey-store.ts` — `evidenceNodes[]` stores them; downstream surface code must be checked per field |
| **Impact** | Low-Medium — the distinction between "stored" and "consumed" matters for trust in the evidence system. A field that is stored but never read is dead weight. |
| **Required correction** | Audit each downstream surface to confirm actual read/display of each evidence field. Update claims to distinguish "stored" from "consumed" from "surfaced." |

---

## ENTRY 7: Constitutional Diagnostic bridge carries full case context

| Field | Detail |
|-------|--------|
| **Original claim** | "The Constitutional Bridge carries forward all upstream evidence to downstream stages" |
| **Source of claim** | Bridge documentation, `constitutional-bridge-downstream-map.md` |
| **Corrected finding** | **PARTIALLY FALSE.** The Constitutional Bridge carries domain scores, route decisions, prompts, hypotheses, risks, and interventions. It does NOT carry the Fast Diagnostic raw case text (`decision`, `priorAttempt`, `costOfDelay`, `claimedOwner`, `blocker`, `forcedAction`). These are available separately via `DiagnosticDecisionObject` table but are NOT in the bridge payload that downstream surfaces receive as their primary handoff. |
| **Evidence path** | `lib/diagnostics/constitutional-bridge.ts` — `ConstitutionalBridgeBundle` type does not include `CaseObject` fields; `TeamAssessmentSeed`, `ExecutiveReportingSeed`, `StrategyRoomSeed` contain domain scores and prompts but not raw case text |
| **Impact** | Medium — downstream surfaces that rely on the bridge (Team, Enterprise, Executive Reporting) do not receive the user's original decision text, prior attempts, or cost of delay as part of their primary handoff. They must fetch these separately from `DiagnosticDecisionObject`. |
| **Required correction** | Either (a) add key case fields to the bridge, or (b) ensure all downstream surfaces know to read from `DiagnosticDecisionObject` directly. Document the gap. |

---

## ENTRY 8: Strategy Room admission pre-commitment check

| Field | Detail |
|-------|--------|
| **Original claim** | "Strategy Room admission does not verify pre-commitment" |
| **Source of claim** | Prior admission audits |
| **Corrected finding** | **FALSE.** Strategy Room admission (`lib/strategy-room/admission.ts:120`) explicitly checks `context.preCommitment` and returns `missingEvidence.push("Pre-commitment not acknowledged.")` if absent. The pre-commitment is also verified server-side via `enforceStrategyRoomAccess()`. |
| **Evidence path** | `lib/strategy-room/admission.ts:117-122` — `if (!context.preCommitment)` check with repair action |
| **Impact** | Low — the claim was incorrect. Admission enforcement is working as designed. |
| **Required correction** | Update prior admission audit docs that claimed pre-commitment was not checked. |

---

## ENTRY 9: Counsel review output client-safety

| Field | Detail |
|-------|--------|
| **Original claim** | "Counsel review output is client-safe" / "Counsel recommendations are surfaced to users" |
| **Source of claim** | Counsel workflow documentation |
| **Corrected finding** | **PARTIALLY TRUE — RISK IDENTIFIED.** Counsel review reads from `DiagnosticJourney.evidenceNodes[]` and `DiagnosticDecisionObject[]` and auto-renders object keys. The output includes counsel recommendations and annotations. It is currently admin-only (`INTERNAL_ONLY`) but there is a risk that counsel recommendations could leak to client surfaces if surface access controls are not maintained. |
| **Evidence path** | Counsel review UI reads from journey store; no client-facing surface was found that displays counsel recommendations, but no explicit suppression rule was found either |
| **Impact** | Medium — if a future surface change exposes counsel recommendations to clients, it would breach the admin-only boundary. |
| **Required correction** | Add explicit suppression rule for counsel recommendations on all client-facing surfaces. Document the admin-only boundary. |

---

## ENTRY 10: Commitment verification checkpoint status

| Field | Detail |
|-------|--------|
| **Original claim** | "Commitment checkpoints are user-confirmed" / "Users mark commitments as completed/blocked" |
| **Source of claim** | Strategy Room execution documentation |
| **Corrected finding** | **PARTIALLY FALSE.** Checkpoint status is **timestamp-derived**, not user-confirmed. The `IntelligenceSpine.execution` fields (`breach`, `breachAt`, `breachCount`, `actionTaken`, `actionTakenAt`, `blockerReported`) are set by the system based on timing, not by explicit user confirmation. The Return Brief captures `accuracyFeedback` (yes/partial/no) which is the closest thing to user confirmation, but this is post-hoc feedback, not a checkpoint status. |
| **Evidence path** | `lib/decision/intelligence-spine.ts` — `execution` fields are system-set; `accuracyFeedback` is user-provided but is feedback on accuracy, not commitment status |
| **Impact** | Medium — the system infers commitment status from timestamps rather than asking the user. This creates an evasion risk: a user who does not engage with Return Brief will not have their commitment status updated. |
| **Required correction** | Add explicit user confirmation step for commitment checkpoints. Distinguish "inferred" from "confirmed" status in all downstream surfaces. |
