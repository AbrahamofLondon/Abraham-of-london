# Assessment Rehabilitation Master Plan

> Date: 2026-05-08
> Status: AUDIT ONLY — no code changes without explicit authorisation
> Principle: Coherence without sameness. Memory across the ladder. Every surface earns its cost.

---

## P0 — Must Fix Before Next Market Test

These defects would damage buyer trust if observed during a demonstration, pilot, or first enterprise engagement.

### P0-1. Counsel Review Workflow — Full Redesign
**File:** `pages/admin/counsel-review.tsx`
**Issue:** Auto-generated CRUD form. Bare field names as prompts. No validation, guidance, or evidence structure. Score: 19/100.
**Proposed change:** Replace with structured counsel intake: (1) Why system governance is insufficient (2) What specific question counsel must answer (3) What evidence basis exists (4) What risk exists if recommendation is ignored (5) Structured recommendation with action, deadline, and escalation path. Each field with placeholder guidance and format expectations.
**Protected elements:** Field names that match API schema
**Scoring risk:** None — operator-facing
**Privacy risk:** None — internal
**Downstream impact:** Counsel evidence becomes structured, usable by oversight brief
**Validation:** TypeScript check, form renders correctly

### P0-2. Retainer/Oversight Intake — New Question Set
**File:** New file required (e.g., `components/product/RetainerIntakeQuestions.tsx`)
**Issue:** The highest-value product has no intake questioning. Retainer qualification is computed, not experiential. Score: 10/100.
**Proposed change:** Create 3-5 retainer intake questions: (1) "What would you miss if oversight stopped tomorrow?" (2) "What pattern has recurred that you could not have detected alone?" (3) "What is the single most valuable thing the system has prevented from going unnoticed?" (4) "If oversight stopped for 90 days, what would deteriorate first?" (5) Optional: "What has the system been wrong about?"
**Protected elements:** Retainer qualification logic, retainer billing, admission gates
**Scoring risk:** None — additive
**Privacy risk:** Low — retainer client context
**Downstream impact:** Retainer justification becomes evidence-based, feeds oversight brief
**Validation:** TypeScript check, build passes

### P0-3. Commitment Verification Recording
**File:** `app/briefing/return/[sessionId]/page.tsx`, new API endpoint
**Issue:** Verification prompts say "record whether the action was executed or blocked" but no recording mechanism exists. Score: 58/100 — broken UX promise.
**Proposed change:** Add verification recording input (executed/blocked/stalled + optional note) alongside the display prompt. Create API endpoint to persist verification status.
**Protected elements:** Existing checkpoint prompts, verification schedule
**Scoring risk:** None — additive
**Privacy risk:** Low
**Downstream impact:** Commitment verification becomes real, not display-only. Oversight brief can reference actual verification records.
**Validation:** TypeScript check, build passes, endpoint responds

### P0-4. Strategy Room Stage 2 — Text Evidence Required
**File:** `components/strategy-room/Form.tsx` (lines 715-718)
**Issue:** Four consequence sliders default to 5. User can pass through in 10 seconds without engaging. Emotional dead zone.
**Proposed change:** Add a required single-sentence text field below each slider: "Name the specific [financial/reputational/institutional/timeline] consequence." Text must be >= 10 chars to advance.
**Protected elements:** Slider scoring, composite weights, route thresholds
**Scoring risk:** None — text fields are additive evidence, not scoring inputs
**Privacy risk:** Low
**Downstream impact:** Strategy Room intake produces richer consequence evidence
**Validation:** TypeScript check, build passes, form validation works

### P0-5. Persist committed Flag
**File:** `pages/diagnostics/fast.tsx`, `pages/api/diagnostics/score.ts`
**Issue:** The product's most differentiating moment (commitment before results) leaves no durable trace. Return Brief uses decision status as proxy.
**Proposed change:** Include `committed: boolean` in the diagnostic score API payload. Persist to case object or diagnostic stage.
**Protected elements:** Fast Diagnostic questions, challenge engine, synthesis
**Scoring risk:** None — additive field
**Privacy risk:** None
**Downstream impact:** Return Brief can reference explicit commitment. "You committed to act" becomes verifiable.
**Validation:** TypeScript check, build passes

---

## P1 — Must Fix Before Paid Ladder Expansion

### P1-1. Wire Constitutional Evidence Bridge Upstream Context
**File:** `pages/api/diagnostics/constitutional-intake/report.ts`, callers of `runConstitutionalOrchestration`
**Issue:** Evidence bridge created but `upstream` parameter not populated. All upstream signals return `present: false`.
**Proposed change:** Extract upstream context from journey store (PA reflections, Fast Diagnostic case object, pattern recurrence data) and pass to orchestrator.
**Scoring risk:** None — bridge is additive
**Downstream impact:** Constitutional evidence bridge becomes functional

### P1-2. Persist competingObligation
**File:** `app/api/purpose-alignment/assessments/route.ts`
**Issue:** "What you are protecting at the expense of the decision" vanishes after the session.
**Proposed change:** Persist `competingObligation` to evidence graph as node. Include in journey store.
**Scoring risk:** None
**Downstream impact:** Return Brief, Oversight Brief can reference what the user was protecting

### P1-3. Bridge Team Aggregate to Executive Reporting
**File:** Bridge layer between team campaign aggregation and ER session
**Issue:** Team assessment results are invisible to Executive Reporting even when both exist.
**Proposed change:** Create team-to-ER bridge that surfaces gap analysis, dominant divergence, trust condition.
**Scoring risk:** None — additive
**Downstream impact:** ER reports include team-level evidence when available

### P1-4. Verify verificationCriteria Extraction Path
**File:** ER intake → diagnostic stage → Return Brief carryForwardSource
**Issue:** Field added to ER form but end-to-end path to Return Brief not verified.
**Proposed change:** Trace and fix the extraction path so Return Brief's `carryForwardSource.verificationCriteria` is populated.
**Scoring risk:** None
**Downstream impact:** Return Brief can confront user with their own success criteria

### P1-5. Outcome Verification — Consume Verification Criteria
**File:** `components/diagnostics/results/OutcomeVerification.tsx`
**Issue:** Display shows classification but does not compare against user-defined success criteria.
**Proposed change:** If verificationCriteria exists, show: "You said success would look like: [criteria]. Here is what happened."
**Scoring risk:** None
**Downstream impact:** Outcome becomes personally anchored

---

## P2 — Must Fix Before Retainer Sale

### P2-1. Enterprise Leader Boolean — Remove Redundancy, Rewrite Weak
Remove od_2, od_3, lco_1. Rewrite mc_3, di_1, eco_2. (Per existing blueprint.)

### P2-2. Enterprise Likert — Audit and Bridge
Audit 12 Likert questions against quality bar. Create evidence bridge to downstream surfaces.

### P2-3. Executive Reporting Sequence Reorder
Move core questions before identity/admin fields.

### P2-4. Strategy Room Execution — Add Status Guidance
Add copy explaining "completed" vs "monitoring" vs "escalated" status transitions.

### P2-5. Oversight Review Bench — Add Decision Guidance
Add guidance copy for each review decision option. Require reasoning for WITHHOLD and ESCALATE.

### P2-6. Fast Diagnostic Downstream Bridge
Persist Fast Diagnostic answers to durable journey store (not just sessionStorage).

### P2-7. Purpose Alignment Downstream Bridge
Create PA-to-downstream bridge that carries avoidedDecision, competingObligation, consequence to Return Brief.

---

## P3 — Must Fix Before Enterprise/Control Room

### P3-1. Team Leader — Rewrite Weak Statement
Replace "produces visible progress, not just activity."

### P3-2. Organisation Setup — Sector Guidance
Add sector classification guidance and examples.

### P3-3. Campaign Creation — Field Help Text
Add help text for cadence (what it affects) and close-date (what it closes).

---

## P4 — Long-Term Refinement

### P4-1. Enterprise Assessment Bridge Architecture
Create enterprise evidence bridge parallel to constitutional evidence bridge.

### P4-2. Cross-Ladder Memory Layer
Architectural pass: ensure every evidence field captured in any stage is accessible to every downstream stage via a unified journey evidence API.

### P4-3. Adaptive Question Deployment
Deploy adaptive question bank templates to Purpose Alignment (post-signal, weakest-domain probing) and Team Assessment (post-gap, targeted follow-up).

---

## No-Code-Change Confirmation

**This document is audit-only. No code was changed during this pass.**

All recommended changes require explicit authorisation before implementation.
