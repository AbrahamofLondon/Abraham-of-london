# SURFACE MEMORY MAP

> **Forensic Trace Pass — 2026-05-08**
> **Status: COMPLETE**

---

## METHODOLOGY

For each surface, we answer:

1. What prior evidence does this surface receive?
2. What prior evidence does it ignore?
3. What new evidence does it capture?
4. What does it persist?
5. What does it hand forward?
6. What does it display to the user?
7. What should it know but currently does not?
8. What should it not expose?
9. Does it feel like memory or restart?

**Verdict per surface:** MEMORY_STRONG | MEMORY_PARTIAL | MEMORY_WEAK | RESTARTS_CONTEXT | INTERNAL_ONLY | UNSAFE_TO_EXPAND

---

## SURFACE REGISTER

---

### 1. Fast Diagnostic Result

| Question | Answer |
|----------|--------|
| **Prior evidence received** | None — this is the entry point. Receives only the user's own answers from the current session. |
| **Prior evidence ignored** | N/A — first surface |
| **New evidence captured** | `decision`, `priorAttempt`, `costOfDelay`, `claimedOwner`, `blocker`, `forcedAction`, `committed` (boolean) |
| **What it persists** | Sends to API: `DiagnosticRecord.responsesJson`, `DiagnosticJourney.mergedTensionThread` (via spine), `DiagnosticDecisionObject` |
| **What it hands forward** | `IntelligenceSpine` — contains `case`, `deterministic`, `synthesis`, `forecast`, `c3`, `preCommitment`. Handed via `ConstitutionalHandoff` (secure token reference) and `sessionStorage` encrypted spine. |
| **What it displays** | Condition class, signal strength, synthesis (verdict, contradiction, avoided decision, concrete move, forecast), cost of inaction, authority index, memory trend |
| **What it should know but doesn't** | Nothing material — this is the entry point |
| **What it should not expose** | Raw C3 scores, specificity scores, internal classification thresholds |
| **Memory feel** | Fresh start (expected — entry point) |

**Verdict: MEMORY_STRONG** (as entry point — correctly creates and persists the spine)

---

### 2. Purpose Alignment Result

| Question | Answer |
|----------|--------|
| **Prior evidence received** | **NONE from server** — this surface appears to operate independently. It does not receive the `IntelligenceSpine` from Fast Diagnostic. It starts fresh with its own context questions. |
| **Prior evidence ignored** | **ALL** — ignores Fast Diagnostic `decision`, `priorAttempt`, `costOfDelay`, `claimedOwner`, `blocker`, `forcedAction`. The user re-answers context questions (`avoidedDecision`, `competingObligation`, `consequence`) that partially overlap with Fast Diagnostic. |
| **New evidence captured** | `avoidedDecision`, `competingObligation`, `consequence` (free-text); Likert-scale answers across alignment domains (identity, decision, environment, behaviour, emotional order, legacy) |
| **What it persists** | **sessionStorage only** — `saveAssessmentState()` writes to `sessionStorage`. **NOT sent to any API.** |
| **What it hands forward** | **NOTHING** — no server-side handoff. The `ConstitutionalHandoff` system is used by Constitutional Diagnostic but NOT by Purpose Alignment. |
| **What it displays** | Purpose profile result (coherence band, contradictions, weak signals, primary pattern, first action) |
| **What it should know but doesn't** | Fast Diagnostic `decision`, `priorAttempt`, `costOfDelay`, `claimedOwner` — these are re-asked or ignored |
| **What it should not expose** | Raw scoring breakdown |
| **Memory feel** | **RESTARTS_CONTEXT** — ignores all prior evidence, re-asks overlapping questions, persists nothing server-side |

**Verdict: RESTARTS_CONTEXT** — this is the most significant memory gap in the ladder. Purpose Alignment operates as a standalone surface with no server-side persistence or handoff.

---

### 3. Constitutional Diagnostic Result

| Question | Answer |
|----------|--------|
| **Prior evidence received** | **NONE from Fast Diagnostic** — the Constitutional Diagnostic does NOT receive the `IntelligenceSpine` from Fast Diagnostic. It has its own independent question set (10 dual-axis questions across 9 domains). |
| **Prior evidence ignored** | **ALL from Fast Diagnostic** — ignores `decision`, `priorAttempt`, `costOfDelay`, `claimedOwner`, `blocker`, `forcedAction`, `committed` |
| **New evidence captured** | 10 dual-axis questions (resonance + certainty) across coherence, authority, environment, execution, trust, friction, stakes, pattern, pressure domains |
| **What it persists** | Sends to API: `DiagnosticRecord.responsesJson`; writes `ConstitutionalHandoff` (token reference) to `sessionStorage`; writes backward-compatible `ConstitutionalThread` to `sessionStorage` |
| **What it hands forward** | `ConstitutionalBridgeBundle` (teamAssessment seed, executiveReporting seed, strategyRoom seed) — via secure token reference. Contains domain scores, route decision, prompts, hypotheses, risks, interventions. |
| **What it displays** | Domain scores (authority, coherence, trust, pressure, friction, seriousness, governance), micro-report, route summary, decision (REJECT/DIAGNOSTIC/STRATEGY), key findings |
| **What it should know but doesn't** | Fast Diagnostic `decision` text, `priorAttempt`, `costOfDelay`, `claimedOwner` — these are not carried forward into the Constitutional bridge |
| **What it should not expose** | Raw scoring formulas, C3 tier, specificity scores |
| **Memory feel** | **RESTARTS_CONTEXT** — despite being the canonical Stage 1 entry, it ignores Fast Diagnostic output and re-assesses from scratch |

**Verdict: RESTARTS_CONTEXT** — the Constitutional Diagnostic is the canonical Stage 1 but does not inherit Fast Diagnostic evidence. This is a design choice (different assessment modality) but creates a memory gap.

---

### 4. Team Assessment Result

| Question | Answer |
|----------|--------|
| **Prior evidence received** | `ConstitutionalBridgeBundle.teamAssessment` — inherited signal (authorityScore, coherenceScore, pressureScore, frictionScore, trustScore, posture, readinessTier, authorityType, seriousnessScore), prompts, hypotheses |
| **Prior evidence ignored** | Fast Diagnostic `decision`, `priorAttempt`, `costOfDelay`, `claimedOwner` — NOT in the bridge. Constitutional bridge carries domain scores only, not raw case text. |
| **New evidence captured** | Leadership self-score + estimated team reality score across domains; false assumption text; show-scores reaction text; purpose alignment pct |
| **What it persists** | `DiagnosticJourney.stages.team` via `persistDiagnosticStage()`; `DiagnosticEvidenceNode[]`; `DiagnosticDecisionObject[]` |
| **What it hands forward** | Team decision result (title, pattern, urgentDomain, firstAction, escalationNote, route, decisionObject) — stored in journey, available to Enterprise and downstream |
| **What it displays** | Gap analysis, critical gaps, pattern title, first action, escalation note, route recommendation |
| **What it should know but doesn't** | Fast Diagnostic `priorAttempt`, `costOfDelay` — these would enrich gap interpretation |
| **What it should not expose** | Individual respondent identities |
| **Memory feel** | **MEMORY_PARTIAL** — inherits constitutional bridge (domain scores) but not raw Fast Diagnostic evidence |

**Verdict: MEMORY_PARTIAL**

---

### 5. Enterprise Assessment Result

| Question | Answer |
|----------|--------|
| **Prior evidence received** | Team Assessment result (via journey store — `stages.team`, `decisionObjects[]`); Constitutional bridge domain scores |
| **Prior evidence ignored** | Fast Diagnostic raw text (`decision`, `priorAttempt`, `costOfDelay`, `claimedOwner`) |
| **New evidence captured** | Enterprise section scores (leadership, governance, execution, risk); recent decision text; team alignment pct |
| **What it persists** | `DiagnosticJourney.stages.enterprise`; `DiagnosticEvidenceNode[]`; `DiagnosticDecisionObject[]` |
| **What it hands forward** | Enterprise decision result (band, patternTitle, primaryReading, dominantFailure, firstAction, escalationNote, route, decisionSignal, decisionObject) |
| **What it displays** | Enterprise band (STABLE/WATCH/FRAGILE/ESCALATE), pattern title, primary reading, dominant failure, first action, escalation note |
| **What it should know but doesn't** | Fast Diagnostic `costOfDelay` (financial context), `committed` (pre-commitment signal) |
| **What it should not expose** | Individual scores without context |
| **Memory feel** | **MEMORY_PARTIAL** — inherits team and constitutional evidence, but not raw Fast Diagnostic inputs |

**Verdict: MEMORY_PARTIAL**

---

### 6. Executive Reporting Intake

| Question | Answer |
|----------|--------|
| **Prior evidence received** | Enterprise decision result (via journey store); Constitutional bridge executiveReporting seed; `DiagnosticJourney.evidenceNodes[]`; `DiagnosticDecisionObject[]` |
| **Prior evidence ignored** | Fast Diagnostic raw text (unless explicitly carried in evidence nodes) |
| **New evidence captured** | Executive reporting answers; board-level questions; intervention priorities |
| **What it persists** | `DiagnosticJourney.stages.executive_reporting`; `DiagnosticEvidenceNode[]` |
| **What it hands forward** | Executive reporting result (headline, principal risks, priority interventions, board-level question) — stored in journey, available to Strategy Room |
| **What it displays** | Executive summary, headline, principal risks, priority interventions, board-level question |
| **What it should know but doesn't** | Purpose Alignment `consequence` and `competingObligation` — these are not available server-side |
| **What it should not expose** | Raw diagnostic scores, individual respondent data |
| **Memory feel** | **MEMORY_PARTIAL** — inherits enterprise and constitutional evidence, but missing Purpose Alignment context |

**Verdict: MEMORY_PARTIAL**

---

### 7. Executive Reporting Result

| Question | Answer |
|----------|--------|
| **Prior evidence received** | Same as Executive Reporting Intake |
| **Prior evidence ignored** | Same |
| **New evidence captured** | N/A — result display only |
| **What it persists** | N/A — reads from persisted journey |
| **What it hands forward** | Executive report data (via journey store) |
| **What it displays** | Full executive report with findings, risks, interventions |
| **What it should know but doesn't** | Purpose Alignment consequence context |
| **What it should not expose** | Raw scoring, individual identities |
| **Memory feel** | **MEMORY_PARTIAL** |

**Verdict: MEMORY_PARTIAL**

---

### 8. Strategy Room Entry

| Question | Answer |
|----------|--------|
| **Prior evidence received** | `DiagnosticJourney` — stages (constitutional, team, enterprise, executive_reporting), `evidenceNodes[]`, `decisionObjects[]`, `routeDecisions[]`; `IntelligenceSpine` from sessionStorage/DB |
| **Prior evidence ignored** | Purpose Alignment data (not available server-side) |
| **New evidence captured** | Pre-commitment confirmation; decision statement; admission context |
| **What it persists** | `StrategyRoomSession` table (Neon); `DiagnosticJourney` updated |
| **What it hands forward** | Session key, canonical snapshot, admission directive |
| **What it displays** | Admission status (ADMITTED/RESTRICTED), missing evidence, repair actions, evidence tier |
| **What it should know but doesn't** | Purpose Alignment `consequence`, `competingObligation` |
| **What it should not expose** | Internal route decisions, raw scores |
| **Memory feel** | **MEMORY_STRONG** — reads from `DiagnosticJourney` which aggregates all prior stages |

**Verdict: MEMORY_STRONG**

---

### 9. Strategy Room Session

| Question | Answer |
|----------|--------|
| **Prior evidence received** | `StrategyRoomSession` (canonical snapshot, intake); `DiagnosticJourney` evidence nodes and decision objects |
| **Prior evidence ignored** | Purpose Alignment data |
| **New evidence captured** | Execution record (decision, authority, conflictResolved, firstAction, timeline, owner) |
| **What it persists** | `DiagnosticEvidenceNode` with `kind: "execution_record"`; `StrategyRoomSession` updated |
| **What it hands forward** | Execution record to Return Brief, Oversight Brief |
| **What it displays** | Execution chamber, recommendations, follow-up |
| **What it should know but doesn't** | Purpose Alignment consequence context; Fast Diagnostic `committed` flag (pre-commitment) — though this IS checked at admission |
| **What it should not expose** | Counsel review output (admin-only) |
| **Memory feel** | **MEMORY_STRONG** — reads from journey store which has full ladder history |

**Verdict: MEMORY_STRONG**

---

### 10. Return Brief

| Question | Answer |
|----------|--------|
| **Prior evidence received** | `DiagnosticJourney` — `evidenceNodes[]`, `decisionObjects[]`, all stages; Strategy Room execution records |
| **Prior evidence ignored** | Purpose Alignment data (not available) |
| **New evidence captured** | User verification response (accuracy feedback: yes/partial/no); outcome evidence |
| **What it persists** | `IntelligenceSpine.accuracyFeedback`; `DiagnosticEvidenceNode` with outcome data |
| **What it hands forward** | Verified outcome evidence to Oversight Brief, Control Room |
| **What it displays** | Prior decisions, execution records, verification criteria, recurrence signals, comparison against earlier correction history |
| **What it should know but doesn't** | Purpose Alignment `competingObligation` (context for why commitments may not have been kept) |
| **What it should not expose** | Counsel review notes, raw internal scores |
| **Memory feel** | **MEMORY_STRONG** — full journey history available |

**Verdict: MEMORY_STRONG**

---

### 11. Decision Centre

| Question | Answer |
|----------|--------|
| **Prior evidence received** | `DiagnosticJourney` — `decisionObjects[]`, `evidenceNodes[]` |
| **Prior evidence ignored** | Purpose Alignment data |
| **New evidence captured** | Decision dependency mapping; stakeholder mapping |
| **What it persists** | `DecisionDependency` table; `DecisionStakeholder` table |
| **What it hands forward** | Dependency graph to Control Room |
| **What it displays** | Decision objects, dependencies, stakeholders |
| **What it should know but doesn't** | Purpose Alignment consequence context |
| **What it should not expose** | Counsel review notes |
| **Memory feel** | **MEMORY_STRONG** — reads from journey store |

**Verdict: MEMORY_STRONG**

---

### 12. Oversight Brief

| Question | Answer |
|----------|--------|
| **Prior evidence received** | `DiagnosticJourney` — all stages, evidence nodes, decision objects; Strategy Room execution records; Return Brief verification data |
| **Prior evidence ignored** | Purpose Alignment data |
| **New evidence captured** | Oversight review annotations; commitment verification status |
| **What it persists** | Oversight annotations on journey |
| **What it hands forward** | Oversight status to Control Room |
| **What it displays** | Full evidence continuity, commitment status, pattern recurrence, intervention failure risk |
| **What it should know but doesn't** | Purpose Alignment `competingObligation` — critical context for understanding why commitments may not have held |
| **What it should not expose** | Counsel review raw output (admin-only) |
| **Memory feel** | **MEMORY_STRONG** — full journey history available |

**Verdict: MEMORY_STRONG**

---

### 13. Retainer Page

| Question | Answer |
|----------|--------|
| **Prior evidence received** | `DiagnosticJourney` linked by email; `RetainedDecision` table |
| **Prior evidence ignored** | Purpose Alignment data |
| **New evidence captured** | Retainer-specific intake; scheduling |
| **What it persists** | `RetainedDecision` table; retainer records |
| **What it hands forward** | Retainer status to Oversight Brief |
| **What it displays** | Retainer status, retained decisions, oversight cadence |
| **What it should know but doesn't** | Purpose Alignment consequence context |
| **What it should not expose** | Counsel review notes |
| **Memory feel** | **MEMORY_PARTIAL** — linked by email but Purpose Alignment data missing |

**Verdict: MEMORY_PARTIAL**

---

### 14. Counsel Review

| Question | Answer |
|----------|--------|
| **Prior evidence received** | `DiagnosticJourney.evidenceNodes[]`, `DiagnosticDecisionObject[]` — auto-renders object keys |
| **Prior evidence ignored** | None — reads all available evidence |
| **New evidence captured** | Counsel review annotations; recommendations |
| **What it persists** | `DiagnosticAuditEvent`; possibly `DiagnosticEvidenceNode` with `kind: "counsel_review"` |
| **What it hands forward** | Counsel recommendations to admin surfaces |
| **What it displays** | Evidence objects with counsel annotations |
| **What it should know but doesn't** | Nothing material — has full journey access |
| **What it should not expose** | **Client-safe surfaces** — counsel recommendations should be admin-only |
| **Memory feel** | **MEMORY_STRONG** (admin surface with full access) |

**Verdict: INTERNAL_ONLY** — this is an admin surface, not client-facing. Recommendations must not leak to client surfaces.

---

### 15. Admin Oversight Review

| Question | Answer |
|----------|--------|
| **Prior evidence received** | Full `DiagnosticJourney` — all stages, evidence nodes, decision objects, escalation history |
| **Prior evidence ignored** | None |
| **New evidence captured** | Admin annotations; override decisions |
| **What it persists** | Admin audit events on journey |
| **What it hands forward** | Admin decisions to enforcement |
| **What it displays** | Full evidence continuity, counsel recommendations, oversight status |
| **What it should know but doesn't** | Nothing — full access |
| **What it should not expose** | Raw client data without redaction |
| **Memory feel** | **MEMORY_STRONG** |

**Verdict: INTERNAL_ONLY**

---

### 16. Control Room

| Question | Answer |
|----------|--------|
| **Prior evidence received** | `DiagnosticJourney` — aggregate view across multiple subjects |
| **Prior evidence ignored** | Purpose Alignment data (not available) |
| **New evidence captured** | Aggregate metrics; monitoring snapshots |
| **What it persists** | `MonitoringSnapshot` table |
| **What it hands forward** | Aggregate intelligence |
| **What it displays** | Aggregate evidence strength, missing verification counts, recurring pattern counts |
| **What it should know but doesn't** | Purpose Alignment aggregate context |
| **What it should not expose** | Raw respondent text in sponsor-safe views |
| **Memory feel** | **MEMORY_PARTIAL** — aggregate view but missing Purpose Alignment dimension |

**Verdict: MEMORY_PARTIAL**

---

## SURFACE MEMORY SCORECARD

| Surface | Verdict | Key Gap |
|---------|---------|---------|
| Fast Diagnostic Result | **MEMORY_STRONG** | Entry point — no gap |
| Purpose Alignment Result | **RESTARTS_CONTEXT** | Ignores all prior evidence; no server-side persistence |
| Constitutional Diagnostic Result | **RESTARTS_CONTEXT** | Ignores Fast Diagnostic; independent question set |
| Team Assessment Result | **MEMORY_PARTIAL** | Inherits constitutional scores but not Fast Diagnostic raw text |
| Enterprise Assessment Result | **MEMORY_PARTIAL** | Inherits team + constitutional but not Fast Diagnostic raw text |
| Executive Reporting Intake | **MEMORY_PARTIAL** | Missing Purpose Alignment context |
| Executive Reporting Result | **MEMORY_PARTIAL** | Missing Purpose Alignment context |
| Strategy Room Entry | **MEMORY_STRONG** | Full journey access |
| Strategy Room Session | **MEMORY_STRONG** | Full journey access |
| Return Brief | **MEMORY_STRONG** | Full journey access |
| Decision Centre | **MEMORY_STRONG** | Full journey access |
| Oversight Brief | **MEMORY_STRONG** | Full journey access |
| Retainer Page | **MEMORY_PARTIAL** | Missing Purpose Alignment data |
| Counsel Review | **INTERNAL_ONLY** | Admin surface |
| Admin Oversight Review | **INTERNAL_ONLY** | Admin surface |
| Control Room | **MEMORY_PARTIAL** | Missing Purpose Alignment dimension |

---

## KEY FINDINGS

1. **Purpose Alignment is the most isolated surface** — it captures `competingObligation` and `consequence` but persists nothing server-side. These fields are invisible to every downstream surface.

2. **Constitutional Diagnostic restarts context** — despite being the canonical Stage 1 entry, it does not inherit Fast Diagnostic output. This is by design (different assessment modality) but means Fast Diagnostic `decision`, `priorAttempt`, `costOfDelay`, and `claimedOwner` are not carried forward into the bridge.

3. **Fast Diagnostic raw text is available via `DiagnosticDecisionObject`** — the `decisionText`, `priorAttemptText`, `costOfDelayText`, and `stakeholderText` fields are persisted in the `DiagnosticDecisionObject` table and available to any surface that reads from `journey-store.ts`.

4. **Strategy Room and downstream surfaces have strong memory** — because they read from `DiagnosticJourney` which aggregates all prior stages, evidence nodes, and decision objects.

5. **The memory gap is at the Purpose Alignment → Constitutional boundary**, not at the downstream end. Fixing Purpose Alignment persistence would close the largest memory gap.
