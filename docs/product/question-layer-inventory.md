# Question Layer Inventory — Full Question Audit

**Date**: 2026-05-08  
**Scope**: Every user-facing question across the product ladder  
**Method**: Source code extraction, file-by-file verification  

---

## 1. Fast Diagnostic

**File**: `pages/diagnostics/fast.tsx`  
**Stage**: Free public entry point — 3 text questions  

| # | Question Text | Field | Type | Required | File Location |
|---|--------------|-------|------|----------|--------------|
| 1 | "What decision has been sitting unresolved longer than it should?" | `decision` | textarea | Yes | `fast.tsx:STEP[0]` |
| 2 | "Who can actually make this decision binding?" | `claimedOwner` | textarea | Yes | `fast.tsx:STEP[1]` |
| 3 | "What becomes more expensive if this stays unresolved?" | `consequence` | textarea | Yes | `fast.tsx:STEP[2]` |

**Microcopy**:  
- Q1: "If you can't name it clearly, that's already a signal."  
- Q2: "'Everyone' is not an answer."  
- Q3: "If nothing changes, something worsens. Name it."

**Input type**: Free-text textarea  
**Validation**: None (text length not enforced)  
**Scoring dependency**: Answers fed to `/api/diagnostics/score` → AI synthesis  
**Evidence produced**: Decision named, owner identified, consequence articulated  
**Downstream surfaces**: Fast Diagnostic result page, Executive Reporting intake (via sessionStorage)  
**Persisted**: Yes — sessionStorage + localStorage for resume  
**Appears in outputs**: Yes — quoted in synthesis, anchor narrative, forecast  
**Question quality**: Bespoke, strategically necessary  

---

## 2. Purpose Alignment

**File**: `lib/alignment/PurposeAlignmentAssessment.tsx` (component), `lib/alignment/checklist.ts` (questions)  
**Stage**: Free public — 3 context questions + 18 dual-axis Likert questions  

### Context Questions (Phase 1)

| # | Question Text | Field | Type | Required |
|---|--------------|-------|------|----------|
| C1 | "What decision are you currently avoiding or deferring?" | `avoidedDecision` | textarea | Yes |
| C2 | "What competing obligation or priority is pulling against that decision?" | `competingObligation` | textarea | Yes |
| C3 | "What becomes worse if this remains unresolved?" | `consequence` | textarea | Yes |

**Microcopy**:  
- C1: "Name the specific choice, not the general direction."  
- C2: "This is usually the thing you are protecting while the decision waits."  
- C3: "Be specific. Vague consequences produce vague analysis."

### Dual-Axis Likert Questions (Phase 2) — 18 questions across 6 domains

Each answered on two 0-10 scales: **Resonance** (Completely false → Completely true) and **Certainty** (No certainty → Absolute).

**Domain: Identity & Mandate**  
| ID | Statement |
|----|-----------|
| identity_1 | "If someone asked me right now what my actual job is — not my title, but my real function — I could answer in under ten seconds." |
| identity_2 | "When I look at how I actually spent this week, I can see my mandate in it — not just my reactions." |
| identity_3 | "I am not following someone else's direction because I lack my own." |

**Domain: Decision Integrity**  
| ID | Statement |
|----|-----------|
| decision_1 | "The last decision I made under pressure — I can still explain why it was right, on principle, not just urgency." |
| decision_2 | "I am not making reactive choices under pressure." |
| decision_3 | "I can explain why I am doing what I am doing — and the people closest to me would agree with that explanation." |

**Domain: Environmental Alignment**  
| ID | Statement |
|----|-----------|
| environment_1 | "The five people I spend the most time with are making me sharper, not softer." |
| environment_2 | "I am not tolerating environments that produce confusion." |
| environment_3 | "What I read, watch, and listen to is chosen deliberately — not just whatever shows up." |

**Domain: Operational Behaviour**  
| ID | Statement |
|----|-----------|
| behaviour_1 | "If I opened my calendar from the last two weeks, more than half the time served what I say matters long-term." |
| behaviour_2 | "My calendar reflects what I claim matters." |
| behaviour_3 | "I am producing measurable outputs, not just activity." |

**Domain: Emotional & Internal Order**  
| ID | Statement |
|----|-----------|
| emotional_order_1 | "When the pressure is real, I still think clearly — I do not collapse or numb out." |
| emotional_order_2 | "I am not driven by fear, comparison, or validation." |
| emotional_order_3 | "I recover quickly from disruption without losing direction." |

**Domain: Legacy Orientation**  
| ID | Statement |
|----|-----------|
| legacy_1 | "I am building something that outlasts immediate comfort." |
| legacy_2 | "My current actions contribute to a long-term structure." |
| legacy_3 | "I am actively taking on harder things — not finding reasons to stay comfortable." |

**Input type**: Dual-axis Likert (0-10 resonance + 0-10 certainty)  
**Validation**: None (default 5/5 if unanswered)  
**Scoring dependency**: `lib/alignment/scoring.ts` → domain scores → profile result  
**Evidence produced**: 6 domain scores, primary pattern, anchor narrative  
**Downstream surfaces**: Purpose Alignment result page  
**Persisted**: Yes — localStorage for resume, sessionStorage for result  
**Appears in outputs**: Yes — domain scores, pattern label, anchor narrative  
**Question quality**: Bespoke, strategically necessary, creates useful discomfort  

---

## 3. Constitutional Diagnostic

**File**: `components/diagnostics/ConstitutionalDiagnostic.tsx`, `lib/diagnostics/constitutional-diagnostic-derivation.ts`  
**Stage**: Free public — 10 dual-axis Likert questions across 9 domains  

| ID | Question Text | Domain | Reversed |
|----|--------------|--------|----------|
| q1 | "The stated strategy and actual resource allocation are meaningfully aligned." | coherence | No |
| q2 | "Decision authority is clear and exercised without chronic diffusion or bottleneck." | authority | No |
| q3 | "The operating environment has changed faster than the organisation's ability to adapt." | environment | Yes |
| q4 | "There is a pattern of strategic drift — direction stated but not executed with discipline." | execution | Yes |
| q5 | "Trust between leadership and execution layers is materially intact." | trust | No |
| q6 | "The organisation carries visible friction: coordination failures, duplicated work, or unresolved conflict." | friction | Yes |
| q7 | "There is a clear decision-maker who can authorise strategic intervention." | authority | No |
| q8 | "The cost of getting this wrong would be material — financial, reputational, or structural." | stakes | No |
| q9 | "Past attempts to correct the issue have failed due to structural, not motivational, causes." | pattern | Yes |
| q10 | "External market or stakeholder pressure is actively forcing attention to this issue." | pressure | No |

**Input type**: Dual-axis Likert (0-10 resonance + 0-10 certainty)  
**Validation**: None (default 5/5 if unanswered)  
**Scoring dependency**: `constitutional-diagnostic-derivation.ts` → domain scores → micro-report → route decision  
**Evidence produced**: 9 domain scores, authority type, posture, readiness tier, route summary  
**Downstream surfaces**: Constitutional Diagnostic result, Strategy Room enrolment  
**Persisted**: Yes — localStorage for resume  
**Appears in outputs**: Yes — micro-report, key findings, route decision  
**Question quality**: Bespoke, strategically necessary, organisation-level framing  

---

## 4. Team Assessment

**File**: `pages/diagnostics/team-assessment.tsx`  
**Stage**: Paid/gated — multi-section Likert  

*(Questions not fully extracted — file uses dynamic section loading. Structure: multi-block Likert similar to Enterprise Assessment but team-focused.)*

---

## 5. Enterprise Assessment

**File**: `pages/diagnostics/enterprise-assessment.tsx`  
**Stage**: Paid/gated — 4 blocks × 3 Likert questions = 12 questions  

### Block 1: Leadership Coherence
| ID | Question Text |
|----|--------------|
| L1 | "Senior leadership reads the condition of the institution with enough consistency." |
| L2 | "Critical leadership disagreements are surfaced rather than buried." |
| L3 | "Strategic messaging remains coherent as it moves through the enterprise." |

### Block 2: Governance Reliability
| ID | Question Text |
|----|--------------|
| G1 | "Decision rights are clear enough to reduce drag and duplication." |
| G2 | "Escalation and accountability are operating at the correct level." |
| G3 | "Governance structures are supporting execution rather than slowing it." |

### Block 3: Execution Variance
| ID | Question Text |
|----|--------------|
| E1 | "Performance varies within acceptable bounds rather than by dangerous extremes." |
| E2 | "Teams are not operating with materially different interpretations of priority." |
| E3 | "Operational signals are trustworthy enough for leadership to act on them." |

### Block 4: Institutional Risk Posture
| ID | Question Text |
|----|--------------|
| R1 | "Current delay does not materially increase strategic cost." |
| R2 | "Trust in the institution is not quietly weakening." |
| R3 | "Corrective action can still be taken without disproportionate political resistance." |

**Input type**: 5-point Likert (Strongly no → Strongly yes)  
**Validation**: None  
**Scoring dependency**: `lib/diagnostics/client.ts` → section scores → band → route  
**Evidence produced**: 4 section scores, band (STABLE/WATCH/FRAGILE/ESCALATE), dominant failure mode  
**Downstream surfaces**: Enterprise Assessment result, Executive Reporting, Strategy Room  
**Persisted**: Yes — localStorage for resume  
**Appears in outputs**: Yes — band, section breakdown, escalation route  
**Question quality**: Bespoke, strategically necessary, organisation-level  

---

## 6. Executive Reporting Intake

**File**: `pages/diagnostics/executive-reporting.tsx`  
**Stage**: Paid — evidence aggregation from prior assessments + free-text  

**Questions**: None directly. This page **aggregates evidence** from prior assessments (Fast Diagnostic, Purpose Alignment, Enterprise Assessment) via sessionStorage. It presents a summary of what the system already knows and asks the user to confirm/complete.

**Input type**: Evidence review + confirmation  
**Validation**: Requires at least one prior assessment  
**Scoring dependency**: Aggregates prior scores  
**Evidence produced**: Consolidated decision narrative  
**Downstream surfaces**: Executive Report  
**Question quality**: Aggregation layer — not a questioning surface  

---

## 7. Strategy Room Enrolment / Intake

**File**: `lib/decision/system-constitution.ts` (form spec), `pages/strategy-room/index.tsx` (page)  
**Stage**: Paid/gated — 14 fields  

| # | Field | Label | Type | Required |
|---|-------|-------|------|----------|
| 1 | `fullName` | "Full Name" | text | Yes |
| 2 | `email` | "Email Address" | email | Yes |
| 3 | `organisation` | "Organisation / Institution" | text | Yes |
| 4 | `sector` | "Sector" | text | Yes |
| 5 | `revenueBand` | "Revenue Band" | select (5 options) | Yes |
| 6 | `authorityRole` | "Authority Role" | text | Yes |
| 7 | `authorityScope` | "Authority Scope" | select (DIRECT/PROXY/UNCLEAR) | Yes |
| 8 | `urgencyWindow` | "Urgency Window" | select (4 options) | Yes |
| 9 | `problemStatement` | "Problem Statement" | textarea | Yes |
| 10 | `symptoms` | "Observed Symptoms" | textarea | Yes |
| 11 | `desiredOutcome` | "Desired Outcome" | textarea | Yes |
| 12 | `currentConstraint` | "Current Constraint" | textarea | Yes |
| 13 | `marketExposure` | "Market Exposure" | select (4 options) | Yes |
| 14 | `boardInvolved` | "Board / Senior Stakeholder Involvement" | select (YES/NO/UNCERTAIN) | Yes |

**Revenue Band options**: Under £50k / £50k–£250k / £250k–£1m / £1m–£10m / Above £10m  
**Authority Scope options**: "I decide directly" / "I influence and sponsor" / "I am exploring only"  
**Urgency Window options**: Immediate/30 days / Quarter/90 days / 6–12 months / Long horizon/strategic  
**Market Exposure options**: Stable / Some volatility / Meaningful pressure / Severe instability  
**Board Involvement options**: Yes / No / Not yet/uncertain  

**Input type**: Mix of text, textarea, select  
**Validation**: Required fields enforced client-side  
**Scoring dependency**: `system-constitution.ts` → constitutional assessment → route, priority, temperature  
**Evidence produced**: Full constitutional intake, route decision, asset recommendations  
**Downstream surfaces**: Strategy Room execution, Return Brief, Oversight Brief  
**Persisted**: Yes — database  
**Appears in outputs**: Yes — problem statement, symptoms, constraint quoted in briefs  
**Question quality**: Bespoke, strategically necessary, institution-level  

---

## 8. Strategy Room Execution Flow

**File**: `pages/strategy-room/session/[id].tsx`, `components/strategy-room/ExecutionFlow.tsx`  
**Stage**: Paid/active — dynamic decision execution  

Questions are dynamically generated based on the constitutional intake and prior assessment data. The execution flow presents:
- Decision challenges (from `challenge-engine.server.ts`)
- Consequence projections (from `consequence-timeline.ts`)
- Intervention suggestions (from `ai-interventions.ts`)
- Escalation triggers (from `counsel-trigger.ts`)

**Input type**: Dynamic — varies per session  
**Validation**: Session-based  
**Scoring dependency**: Multiple engines  
**Evidence produced**: Decision logs, enforcement cycles, escalation events  
**Question quality**: Adaptive, context-dependent  

---

## 9. Return Brief Prompts

**File**: Generated server-side via oversight brief composer  
**Stage**: Paid/retainer  

Return Brief prompts are generated from the accumulated decision history, enforcement cycles, and escalation events. They ask:
- What was decided since last cycle
- What was executed vs deferred
- What patterns repeated
- What cost exposure changed

**Input type**: Structured review  
**Validation**: Cycle-based  
**Scoring dependency**: Prior enforcement data  
**Evidence produced**: Return Brief artifact  
**Question quality**: Context-dependent, strategically necessary  

---

## 10. Outcome Verification Prompts

**File**: `lib/diagnostics/executive-reporting-enforcement.ts`  
**Stage**: Paid/retainer  

Prompts verify whether previously mandated actions were executed:
- Was the decision acted upon?
- What prevented execution (if not)?
- What changed as a result?

**Input type**: Structured verification  
**Validation**: Links to prior decision  
**Scoring dependency**: Calibration engine  
**Evidence produced**: Outcome delta, calibration event  
**Question quality**: Strategically necessary, verification-focused  

---

## 11. Oversight Brief / Retainer Prompts

**File**: `lib/product/oversight-brief-composer.ts`, `lib/product/oversight-review-cycle-composer.ts`  
**Stage**: Paid/retainer  

Generated prompts during oversight cycle review:
- Cycle comparison: what changed since last review
- Suppression review: what should be withheld from client-safe output
- Counsel escalation: does this warrant counsel involvement
- Boardroom archive: should this be recorded for board

**Input type**: Structured review decisions  
**Validation**: Operator authentication  
**Scoring dependency**: Oversight cycle engine  
**Evidence produced**: Oversight brief, cycle archive record  
**Question quality**: Context-dependent, operator-level  

---

## 12. Counsel Escalation Prompts

**File**: `lib/strategy-room/counsel-trigger.ts`  
**Stage**: Paid/retainer  

Triggered when certain conditions are met during execution:
- Repeated avoidance patterns
- Deadline breaches
- Escalation threshold exceeded

**Input type**: Automated trigger + operator confirmation  
**Validation**: Threshold-based  
**Scoring dependency**: Counsel trigger engine  
**Evidence produced**: Counsel event, escalation record  
**Question quality**: Automated, threshold-driven  

---

## 13. Access / Onboarding Questions

**File**: `pages/api/inner-circle/register.ts`, `pages/strategy-room/index.tsx`  
**Stage**: Free → gated  

**Inner Circle registration**: Name, email (POST to `/api/inner-circle/register`)  
**Strategy Room enrolment**: Full 14-field intake (see section 7)  

**Question quality**: Standard identity capture — not decision-intelligence questions  

---

## Summary Statistics

| Surface | Total Questions | Free/Paid | Input Types |
|---------|----------------|-----------|-------------|
| Fast Diagnostic | 3 | Free | Free-text |
| Purpose Alignment | 3 context + 18 Likert | Free | Text + dual-axis Likert |
| Constitutional Diagnostic | 10 Likert | Free | Dual-axis Likert |
| Team Assessment | ~12 Likert | Paid | Likert |
| Enterprise Assessment | 12 Likert | Paid | Likert |
| Executive Reporting | 0 (aggregation) | Paid | Review |
| Strategy Room Intake | 14 fields | Paid | Text + select |
| Strategy Room Execution | Dynamic | Paid | Dynamic |
| Return Brief | Dynamic | Retainer | Structured |
| Outcome Verification | Dynamic | Retainer | Structured |
| Oversight Brief | Dynamic | Retainer | Structured |
| Counsel Escalation | Automated | Retainer | Threshold |

**Total static questions**: 60+  
**Total dynamic/adaptive**: Varies per session  

---

*End of question inventory.*