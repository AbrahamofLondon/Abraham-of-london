# Strategy Room Execution Command Architecture

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London

The Strategy Room is not a form, coaching session, or payment success page. It is a governed execution room — a live case command surface where admission, evidence, authority, consequence, avoidance, escalation, execution, feedback, and outcome memory converge.

---

## Execution Command Sections

### 1. Admission Summary
**What it shows:** Why this case was admitted. Evidence tier, authority signal, decision specificity.
**Component:** `AdmissionNotice` (`components/product/AdmissionNotice.tsx`)
**Server module:** `evaluateStrategyRoomAdmission()` (`lib/strategy-room/admission.ts`)
**Active today:** YES — admission module is route-enforced. Component exists but not rendered in SR page.
**Must wire:** Import AdmissionNotice into `pages/strategy-room/index.tsx`, pass admission data from session.

### 2. Decision Under Governance
**What it shows:** The canonical decision statement, locked and under enforcement.
**Component:** `DecisionStateBanner` (`components/strategy-room/DecisionStateBanner.tsx`)
**Server module:** `StrategyRoomExecutionSession.decisionQuestion` from Prisma
**Active today:** YES — rendered in execution chamber.
**Must wire:** Already wired.

### 3. Evidence Basis
**What it shows:** What evidence supports this case. Stage checklist with bespoke contributions.
**Component:** `EvidenceStrengthMeter` (`components/living/EvidenceStrengthMeter.tsx`)
**Server module:** `deriveLivingCase()` → completedStages, evidenceNodes
**Active today:** NO — not rendered in SR page.
**Must wire:** Add EvidenceStrengthMeter with stage checklist to execution chamber.

### 4. Authority / Mandate
**What it shows:** Who owns the decision. Authority type from constitutional assessment.
**Component:** `ConstitutionalFollowupPanel` (partial), inline render in execution chamber
**Server module:** Constitutional handoff data, `authorityType` from intake
**Active today:** YES — available via canonical snapshot.
**Must wire:** Already available in execution state.

### 5. Contradiction Graph
**What it shows:** Active contradictions from evidence nodes.
**Component:** Inline render in `ExecutionDecisionFrame`
**Server module:** `evidenceJourney.evidenceNodes.filter(kind === "contradiction")`
**Active today:** YES — contradictions passed to decision surface payload.
**Must wire:** Already available.

### 6. Dynamic Consequence
**What it shows:** Live consequence exposure with deltas and penalties.
**Component:** `DynamicConsequencePanel` (`components/strategy-room/DynamicConsequencePanel.tsx`)
**Server module:** Computed from execution state + decision velocity
**Active today:** YES — rendered in execution chamber.
**Must wire:** Already wired.

### 7. Avoidance Pattern
**What it shows:** Repeated avoidance patterns from decision history.
**Component:** `AvoidancePatternNotice` (`components/strategy-room/AvoidancePatternNotice.tsx`)
**Server module:** Derived from tension thread + prior decision objects
**Active today:** YES — rendered in execution chamber.
**Must wire:** Already wired.

### 8. Escalation Triggers
**What it shows:** Active escalation triggers with type, message, date.
**Component:** `EscalationTriggerPanel` (`components/strategy-room/EscalationTriggerPanel.tsx`)
**Server module:** Derived from enforcement + escalation events
**Active today:** YES — rendered in execution chamber.
**Must wire:** Already wired.

### 9. Execution Flow
**What it shows:** 8-stage escalation flow with micro-tension validation.
**Component:** `ExecutionFlow` (`components/strategy-room/ExecutionFlow.tsx`)
**Server module:** Challenge engine at `/api/diagnostics/challenge`
**Active today:** YES — imported. Used via `FirstActionPrompt` and `DecisionLog` sections.
**Must wire:** Already wired.

### 10. Required Commitments
**What it shows:** Locked decisions, owner, first actions, deadlines.
**Component:** `DecisionLog` inline section in execution chamber
**Server module:** `persistStrategyExecutionRecord()` + `StrategyDecisionLog`
**Active today:** YES — rendered in execution chamber with add/statusChange/blockReasonChange handlers.
**Must wire:** Already wired.

### 11. Feedback / Verification
**What it shows:** Execution feedback status, outcome verification path.
**Component:** Not yet a standalone component. Data available via `propagateDecisionChange()`.
**Server module:** `lib/strategy-room/execution-feedback.ts`
**Active today:** YES (backend) — propagation fires on decision changes.
**Must wire:** Surface verification status in execution chamber.

### 12. Return Brief
**What it shows:** Return Brief availability with trajectory status.
**Component:** `ReturnBriefInterruptionBar` (`components/strategy-room/ReturnBriefInterruptionBar.tsx`)
**Server module:** `/api/strategy-room/briefing/return/[sessionId]`
**Active today:** YES — rendered in `pages/strategy-room/session/[id].tsx`.
**Must wire:** Also render in main execution chamber if session has brief available.

### 13. Retainer / Continuous Oversight Path
**What it shows:** Retainer eligibility, qualification, entry path.
**Component:** `RetainerEntryGate` (`components/strategy-room/RetainerEntryGate.tsx`)
**Server module:** `evaluateRetainerQualification()` from retainer module
**Active today:** YES — rendered in execution chamber when qualified.
**Must wire:** Already wired.

---

## Summary: What is already wired vs what needs wiring

| Section | Wired | Needs wiring |
|---------|-------|-------------|
| Admission Summary | NO | Import AdmissionNotice, pass admission data |
| Decision Under Governance | YES | — |
| Evidence Basis | NO | Import EvidenceStrengthMeter with stage checklist |
| Authority / Mandate | YES | — |
| Contradiction Graph | YES | — |
| Dynamic Consequence | YES | — |
| Avoidance Pattern | YES | — |
| Escalation Triggers | YES | — |
| Execution Flow | YES | — |
| Required Commitments | YES | — |
| Feedback / Verification | PARTIAL | Surface verification status |
| Return Brief | PARTIAL | Add to main execution chamber |
| Retainer Path | YES | — |

**10 of 13 sections are already active.** Three need additional wiring: AdmissionNotice, EvidenceStrengthMeter, and Return Brief link in main chamber.
