# Product Ladder Dominance — Surface Verification

**Date:** 8 May 2026  
**Method:** File-level audit of every surface in the product ladder.

---

## 1. Fast Diagnostic (`pages/diagnostics/fast.tsx`)

**Classification: `OVERDENSE`**

Result page has ~20 distinct visual blocks competing for attention. The required move is buried below email capture, condition, mirror line, why it exists, and pattern. A cold user cannot find "what to do next" within 10 seconds.

**Blocks in order (result stage):**
1. Opening statement
2. Condition
3. Personal mirror line
4. Email capture (above fold!)
5. Why it exists
6. Pattern
7. Cost of inaction (30/60/90)
8. External view
9. Required move
10. Executive Decision Authority Block
11. System integrity note
12. Governed analysis line
13. IntelligenceGainPanel
14. EvidenceStrengthMeter
15. DecisionAdvantageSummary
16. NextLayerUnlockedPanel
17. GovernedActionPanel
18. OutcomeMemoryPreview
19. Pattern evidence
20. HumanReviewPrompt
21. GovernanceDisclosure
22. DiagnosticStandardPanel
23. Earned escalation (Fast → Purpose)
24. How this was determined (details)
25. Re-evaluation note
26. CTA footer (Executive Reporting + Start again)

**Verdict:** Compress to 7 primary sections. Demote blocks 10-26 below the fold or into collapsible sections.

---

## 2. Purpose Alignment (`pages/diagnostics/purpose-alignment.tsx`)

**Classification: `MISFRAMED`**

The page renders `PurposeAlignmentAssessment` component from `lib/alignment/PurposeAlignmentAssessment.tsx`. The component itself is well-architected with context phase, signal phase, and result phase. However:

- The page title/metadata says "Purpose Alignment" — sounds like HR/coaching
- The hero text: "Where is your direction breaking down?" — better but still abstract
- The result labels: "Coherence band", "Pattern" — internal language
- The entry point from diagnostics index: "The direction is unclear, or the pressure is personal" — vague

**Verdict:** Reframe as Internal Constraint Diagnostic. Change entry copy, hero text, and result labels. Do not change the engine.

---

## 3. Constitutional Diagnostic (`pages/diagnostics/constitutional-diagnostic.tsx`)

**Classification: `MISFRAMED`**

The word "Constitutional" is the wrong market frame. Users don't think "I need a constitutional diagnostic." The page itself is well-built (10 questions, dual-axis, route output) but the naming and entry copy make it feel legal/political rather than practical.

**Verdict:** Consider renaming to "Governance Diagnostic" or "Structural Diagnostic" in market-facing copy. Keep internal naming as-is.

---

## 4. Team Assessment (`pages/diagnostics/team-assessment.tsx`)

**Classification: `MISSING_ACTION`**

The assessment flow works. The invite mechanism exists. But the page doesn't clearly tell the user what to do after completing their own assessment — specifically how to invite their team and what the team will see.

**Verdict:** Add clear "next action" after solo completion: invite flow with preview of what team members experience.

---

## 5. Enterprise Assessment (`pages/diagnostics/enterprise-assessment.tsx`)

**Classification: `INTERNAL_ONLY_CORRECT`**

Enterprise assessment is a niche product for organisational clients. The current implementation is appropriate for its audience. No changes needed.

---

## 6. Executive Reporting (`pages/diagnostics/executive-reporting/run.tsx`)

**Classification: `OVERDENSE` + `MISSING_ACTION`**

**Intake:** The form is thorough but long (12+ minutes). No preview mechanism exists — users must pay before seeing any output.

**Result:** Similar density problem to Fast Diagnostic. The result page has ~30+ distinct blocks. The canonical report contract is comprehensive but the user-facing rendering is overwhelming.

**Boardroom Mode:** `SERVER_READY_NOT_RENDERED` — the dossier generation works and is rendered in the ER result page, but there's no standalone boardroom page or PDF download flow that a board member would use.

**Verdict:**
- Add a free summary/preview to the intake flow
- Compress result page to primary sections
- Boardroom Mode needs a standalone delivery mechanism

---

## 7. Boardroom Mode

**Classification: `SERVER_READY_NOT_RENDERED`**

The API returns boardroom dossiers. The ER result page renders them in an expandable section. But there's no:
- Standalone boardroom page (`/boardroom/[sessionId]`)
- Clean PDF export that a board member would receive
- Slide deck format

**Verdict:** Build a standalone boardroom page with PDF export as the primary delivery mechanism.

---

## 8. Strategy Room Entry (`pages/strategy-room/index.tsx`)

**Classification: `OVERDENSE`**

The entry page has: access enforcement, execution memory, FirstActionPrompt, ExecutionDecisionFrame, DynamicConsequencePanel, InterventionStack, ConstraintMap, AvoidancePatternNotice, DecisionStateBanner, GovernanceEvidenceCarryForward. The user arrives from Executive Reporting and is immediately in a dense operating console.

**FirstActionPrompt:** Exists but is a small 2-column block that says "Start with the first intervention. Do not optimise. Execute." — this should be the PRIMARY element, not a small panel.

**Verdict:** Promote FirstActionPrompt to the hero position. Demote secondary intelligence below the fold.

---

## 9. Strategy Room Session (`pages/strategy-room/session/[id].tsx`)

**Classification: `MISSING_ACTION`**

The session page shows evidence, decisions, contradictions, and execution memory — but there's no single clear "what do I do now?" button or section. The user sees their state but not their next action.

**Verdict:** Add a prominent "Next action" section at the top of the session page.

---

## 10. Return Brief (`app/briefing/return/[sessionId]/page.tsx`)

**Classification: `CURRENTLY_RENDERED` — gold standard**

The Return Brief is the best-presented surface in the product. Document styling, clear hierarchy, evidence carry-forward, cost clock, direct challenge. The "no brief warranted" state is a dead end but acceptable for a triggered surface.

**Minor issue:** The "no brief warranted" state says "No return brief is warranted at this time" without explaining what would trigger one.

**Verdict:** Add trigger condition explanation to the no-brief state.

---

## 11. Decision Centre (`pages/decision-centre.tsx`)

**Classification: `MISSING_ACTION`**

The Decision Centre shows cases with evidence, cost clocks, and admission status. Each case has a "Next required action" field. But there's no cross-case prioritisation — the user doesn't know which case to act on first.

**Verdict:** Add case prioritisation (by severity, cost, or urgency) and a "most urgent case" callout.

---

## 12. Oversight Brief (`pages/oversight/brief/[cycleId].tsx`)

**Classification: `CURRENTLY_RENDERED` — appropriate for audience**

The Oversight Brief is a retainer-client-only surface. The current implementation is appropriate for its niche audience. No changes needed.

---

## 13. Control Room

**Classification: `INTERNAL_ONLY_CORRECT`**

No visible user-facing surface. Admin/internal tool. Appropriate.

---

## 14. Retainer Intake (`pages/retainer/intake.tsx`)

**Classification: `CURRENTLY_RENDERED`**

The retainer intake page exists with form validation and submission. It's gated behind authentication. The flow works. No changes needed for this pass.

---

## 15. Counsel Review

**Classification: `INTERNAL_ONLY_CORRECT`**

No dedicated UI surface. Counsel review is triggered as a signal type in the Oversight Brief. Appropriate for current product stage.

---

## 16. Admin Oversight Review

**Classification: `INTERNAL_ONLY_CORRECT`**

No dedicated UI surface. Admin/internal tool. Appropriate.

---

## Priority Action List

| Priority | Surface | Action | Effort |
|----------|---------|--------|--------|
| **P0** | Fast Diagnostic result | Compress to 7 primary sections, demote 19 blocks | High |
| **P1** | Purpose Alignment | Reframe entry/result copy, change hero text | Medium |
| **P1** | Executive Reporting intake | Add free preview/summary before paywall | High |
| **P2** | Strategy Room Entry | Promote FirstActionPrompt to hero position | Low |
| **P2** | Strategy Room Session | Add prominent "Next action" section | Low |
| **P2** | Decision Centre | Add case prioritisation | Medium |
| **P3** | Return Brief no-brief state | Add trigger condition explanation | Low |
| **P3** | Boardroom Mode | Build standalone delivery page | High |
| **P3** | Constitutional Diagnostic | Consider market-facing rename | Low |
