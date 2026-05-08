# Question Quality Audit

**Date**: 2026-05-08  
**Method**: Source code extraction and classification of every user-facing question  

---

## Classification Key

| Code | Meaning |
|------|---------|
| KEEP_AS_IS | Strategically sound, well-framed, produces useful evidence |
| KEEP_BUT_REPOSITION | Good question, wrong stage or context |
| REWRITE | Weak framing, vague, or produces low-quality evidence |
| SPLIT_INTO_MULTIPLE | Tries to ask too many things at once |
| MERGE_WITH_OTHER | Redundant with another question |
| REMOVE | Adds no value, causes drop-off |
| REPLACE_WITH_BETTER_QUESTION | Concept is right but execution is wrong |
| MOVE_EARLIER / MOVE_LATER | Wrong position in sequence |
| REQUIRE_EVIDENCE_ANCHOR | Needs concrete example before answering |
| REQUIRE_CONTEXTUAL_FOLLOWUP | Answer needs probing before it's useful |

---

## 1. Fast Diagnostic

### Q1: "What decision has been sitting unresolved longer than it should?"

**Classification**: KEEP_AS_IS  
**Why**: This is the strongest opening question in the entire product ladder. It names the core unit of value (a specific decision), creates immediate pressure ("longer than it should"), and produces directly usable evidence for synthesis.  
**Extracts real intelligence?** Yes — names the decision, reveals avoidance pattern.  
**Produces useful downstream evidence?** Yes — quoted in synthesis, anchor narrative, forecast.  
**Can user answer honestly?** Yes — low barrier, high specificity.  
**Bespoke or generic?** Bespoke.  
**Creates useful discomfort?** Yes — "sitting unresolved" implies accountability.  
**Risks?** None significant. May produce vague answers if user is unwilling to name the decision.  
**Improves premium feel?** Yes — immediately signals this is not a generic survey.  

### Q2: "Who can actually make this decision binding?"

**Classification**: KEEP_AS_IS  
**Why**: Forces ownership clarity. The microcopy ("'Everyone' is not an answer") is excellent.  
**Extracts real intelligence?** Yes — reveals authority structure.  
**Produces useful downstream evidence?** Yes — feeds authority index, execution failure prediction.  
**Can user answer honestly?** Mostly — some users may not know. That itself is a signal.  
**Bespoke or generic?** Bespoke.  
**Creates useful discomfort?** Yes — many people cannot name the actual decision-maker.  
**Risks?** Users may name themselves when they shouldn't, or name someone who doesn't know. The system handles this via the challenge engine.  

### Q3: "What becomes more expensive if this stays unresolved?"

**Classification**: KEEP_AS_IS  
**Why**: Forces consequence articulation. The framing ("more expensive") is broad enough to capture financial, relational, or structural cost.  
**Extracts real intelligence?** Yes — reveals what the user actually values.  
**Produces useful downstream evidence?** Yes — feeds cost-of-inaction, forecast.  
**Can user answer honestly?** Yes.  
**Bespoke or generic?** Bespoke.  
**Creates useful discomfort?** Yes — forces the user to articulate what they're losing.  
**Risks?** May produce vague answers. The microcopy ("If nothing changes, something worsens. Name it.") mitigates this.  

**Fast Diagnostic Verdict**: All 3 questions are KEEP_AS_IS. This is the strongest questioning surface in the product.  

---

## 2. Purpose Alignment

### Context Questions

#### C1: "What decision are you currently avoiding or deferring?"

**Classification**: KEEP_AS_IS  
**Note**: Nearly identical to Fast Diagnostic Q1. This is intentional — Purpose Alignment is a separate entry point. The repetition is acceptable because users who enter here may not have taken the Fast Diagnostic.  

#### C2: "What competing obligation or priority is pulling against that decision?"

**Classification**: KEEP_AS_IS  
**Why**: This is the question that surfaces the real constraint. Most diagnostic tools never ask this. It reveals the trade-off the user is protecting.  
**Extracts real intelligence?** Yes — reveals the hidden commitment that blocks action.  
**Produces useful downstream evidence?** Yes — feeds contradiction detection, anchor narrative.  
**Can user answer honestly?** Yes — but requires self-awareness.  
**Bespoke or generic?** Bespoke. This is a rare and valuable question.  

#### C3: "What becomes worse if this remains unresolved?"

**Classification**: KEEP_AS_IS  
**Note**: Nearly identical to Fast Diagnostic Q3. Same reasoning applies.  

### Dual-Axis Likert Questions

#### identity_1: "If someone asked me right now what my actual job is — not my title, but my real function — I could answer in under ten seconds."

**Classification**: KEEP_AS_IS  
**Why**: Excellent framing. The "not my title, but my real function" qualifier is precise. The "under ten seconds" creates a concrete test.  
**Extracts real intelligence?** Yes — reveals role clarity vs role confusion.  

#### identity_2: "When I look at how I actually spent this week, I can see my mandate in it — not just my reactions."

**Classification**: KEEP_AS_IS  
**Why**: Forces calendar-to-mandate comparison. The "not just my reactions" qualifier is sharp.  

#### identity_3: "I am not following someone else's direction because I lack my own."

**Classification**: KEEP_AS_IS  
**Why**: This is a reversed/negative framing that creates useful discomfort. It forces the user to admit (or deny) dependency.  

#### decision_1: "The last decision I made under pressure — I can still explain why it was right, on principle, not just urgency."

**Classification**: KEEP_AS_IS  
**Why**: The "on principle, not just urgency" distinction is excellent. This separates principled decision-makers from reactive ones.  

#### decision_2: "I am not making reactive choices under pressure."

**Classification**: KEEP_AS_IS  
**Why**: Negative framing creates useful discomfort.  

#### decision_3: "I can explain why I am doing what I am doing — and the people closest to me would agree with that explanation."

**Classification**: KEEP_AS_IS  
**Why**: The second clause ("the people closest to me would agree") adds a reality-check dimension that most self-assessments lack.  

#### environment_1: "The five people I spend the most time with are making me sharper, not softer."

**Classification**: KEEP_AS_IS  
**Why**: Specific, concrete, memorable. The "five people" constraint prevents vague answers.  

#### environment_2: "I am not tolerating environments that produce confusion."

**Classification**: KEEP_BUT_REPOSITION  
**Why**: This is a compound question. "Not tolerating" implies both awareness and action. A user may be aware of confusing environments but unable to leave them. **Recommendation**: Split into awareness vs action.  

#### environment_3: "What I read, watch, and listen to is chosen deliberately — not just whatever shows up."

**Classification**: KEEP_AS_IS  
**Why**: Specific, concrete, actionable.  

#### behaviour_1: "If I opened my calendar from the last two weeks, more than half the time served what I say matters long-term."

**Classification**: KEEP_AS_IS  
**Why**: This is the best question in the entire product. It creates an immediate, verifiable test. The user can literally check. No other diagnostic tool asks this.  

#### behaviour_2: "My calendar reflects what I claim matters."

**Classification**: MERGE_WITH_OTHER  
**Why**: This is a weaker restatement of behaviour_1. "My calendar reflects what I claim matters" is the same concept but without the concrete "last two weeks" / "more than half" test. **Recommendation**: Remove or replace with a different behavioural angle (e.g., energy allocation, not just time).  

#### behaviour_3: "I am producing measurable outputs, not just activity."

**Classification**: KEEP_AS_IS  
**Why**: Distinguishes output from activity — a crucial distinction most tools miss.  

#### emotional_order_1: "When the pressure is real, I still think clearly — I do not collapse or numb out."

**Classification**: KEEP_AS_IS  
**Why**: The "collapse or numb out" language is precise and memorable. Creates useful discomfort.  

#### emotional_order_2: "I am not driven by fear, comparison, or validation."

**Classification**: KEEP_AS_IS  
**Why**: Negative framing. Forces honest self-assessment. Most people will score this lower than they'd like.  

#### emotional_order_3: "I recover quickly from disruption without losing direction."

**Classification**: KEEP_AS_IS  
**Why**: Measures resilience, not just presence of disruption.  

#### legacy_1: "I am building something that outlasts immediate comfort."

**Classification**: KEEP_AS_IS  
**Why**: The "immediate comfort" qualifier prevents self-deception.  

#### legacy_2: "My current actions contribute to a long-term structure."

**Classification**: MERGE_WITH_OTHER  
**Why**: This is a weaker restatement of legacy_1. Both ask about long-term orientation. **Recommendation**: Remove and replace with a question about sacrifice or trade-off (e.g., "I have declined short-term gain for long-term position in the last month").  

#### legacy_3: "I am actively taking on harder things — not finding reasons to stay comfortable."

**Classification**: KEEP_AS_IS  
**Why**: The "not finding reasons to stay comfortable" qualifier is sharp. Creates useful discomfort.  

**Purpose Alignment Verdict**: 15 of 18 Likert questions are KEEP_AS_IS. 2 should be merged (behaviour_2 → behaviour_1, legacy_2 → legacy_1). 1 should be repositioned (environment_2). This is a strong instrument.  

---

## 3. Constitutional Diagnostic

### q1: "The stated strategy and actual resource allocation are meaningfully aligned."

**Classification**: KEEP_AS_IS  
**Why**: This is the core coherence question. It forces the user to compare words vs money/time.  

### q2: "Decision authority is clear and exercised without chronic diffusion or bottleneck."

**Classification**: KEEP_AS_IS  
**Why**: "Chronic diffusion or bottleneck" is precise organisation-level language.  

### q3: "The operating environment has changed faster than the organisation's ability to adapt." (REVERSED)

**Classification**: KEEP_AS_IS  
**Why**: The reversal is well-executed. High scores here (agreeing) indicate danger — the system correctly reverses the score.  

### q4: "There is a pattern of strategic drift — direction stated but not executed with discipline." (REVERSED)

**Classification**: KEEP_AS_IS  
**Why**: "Strategic drift" is the right concept. The reversal is correct.  

### q5: "Trust between leadership and execution layers is materially intact."

**Classification**: KEEP_AS_IS  
**Why**: "Materially intact" is the right qualifier — not perfect, but sufficient.  

### q6: "The organisation carries visible friction: coordination failures, duplicated work, or unresolved conflict." (REVERSED)

**Classification**: KEEP_AS_IS  
**Why**: The concrete examples (coordination failures, duplicated work, unresolved conflict) make this measurable.  

### q7: "There is a clear decision-maker who can authorise strategic intervention."

**Classification**: KEEP_AS_IS  
**Why**: This is the authority anchor. It overlaps with q2 but at a different level — q2 is about process, q7 is about person.  

### q8: "The cost of getting this wrong would be material — financial, reputational, or structural."

**Classification**: KEEP_AS_IS  
**Why**: The three categories (financial, reputational, structural) give the user a framework.  

### q9: "Past attempts to correct the issue have failed due to structural, not motivational, causes." (REVERSED)

**Classification**: KEEP_AS_IS  
**Why**: This is the most important question in the diagnostic. It distinguishes between "people aren't trying" and "the system won't let them." The structural vs motivational distinction is rare and valuable.  

### q10: "External market or stakeholder pressure is actively forcing attention to this issue."

**Classification**: KEEP_AS_IS  
**Why**: Measures external forcing function.  

**Constitutional Diagnostic Verdict**: All 10 questions are KEEP_AS_IS. This is a tight, well-constructed instrument. No weak questions.  

---

## 4. Enterprise Assessment

### Block 1: Leadership Coherence

#### L1: "Senior leadership reads the condition of the institution with enough consistency."

**Classification**: KEEP_AS_IS  
**Why**: "Reads the condition" is precise organisation-level language. "Enough consistency" is the right qualifier.  

#### L2: "Critical leadership disagreements are surfaced rather than buried."

**Classification**: KEEP_AS_IS  
**Why**: The surfaced vs buried distinction is sharp. This is a rare and valuable question.  

#### L3: "Strategic messaging remains coherent as it moves through the enterprise."

**Classification**: KEEP_AS_IS  
**Why**: Measures message fidelity — a crucial organisation health signal.  

### Block 2: Governance Reliability

#### G1: "Decision rights are clear enough to reduce drag and duplication."

**Classification**: KEEP_AS_IS  
**Why**: "Clear enough to reduce drag" is the right framing — not perfect, but functional.  

#### G2: "Escalation and accountability are operating at the correct level."

**Classification**: KEEP_BUT_REPOSITION  
**Why**: This question asks about two things (escalation AND accountability) that may operate at different levels. **Recommendation**: Split into two questions or rephrase to focus on one.  

#### G3: "Governance structures are supporting execution rather than slowing it."

**Classification**: KEEP_AS_IS  
**Why**: The supporting vs slowing distinction is sharp and measurable.  

### Block 3: Execution Variance

#### E1: "Performance varies within acceptable bounds rather than by dangerous extremes."

**Classification**: KEEP_AS_IS  
**Why**: "Acceptable bounds" vs "dangerous extremes" is the right framing.  

#### E2: "Teams are not operating with materially different interpretations of priority."

**Classification**: KEEP_AS_IS  
**Why**: Measures strategic alignment at the team level.  

#### E3: "Operational signals are trustworthy enough for leadership to act on them."

**Classification**: KEEP_AS_IS  
**Why**: "Trustworthy enough to act on" is the right threshold. This is a rare and valuable question.  

### Block 4: Institutional Risk Posture

#### R1: "Current delay does not materially increase strategic cost."

**Classification**: KEEP_AS_IS  
**Why**: The delay→cost link is the core of cost-of-inaction thinking.  

#### R2: "Trust in the institution is not quietly weakening."

**Classification**: KEEP_AS_IS  
**Why**: "Quietly weakening" captures the hidden erosion that most metrics miss.  

#### R3: "Corrective action can still be taken without disproportionate political resistance."

**Classification**: KEEP_AS_IS  
**Why**: Measures feasibility of intervention — a crucial but rarely asked question.  

**Enterprise Assessment Verdict**: 11 of 12 questions are KEEP_AS_IS. 1 should be split (G2). Strong instrument.  

---

## 5. Strategy Room Intake

### Fields 1-4: Identity (fullName, email, organisation, sector)

**Classification**: KEEP_AS_IS  
**Why**: Standard identity capture. Necessary for the institutional context.  

### Field 5: Revenue Band

**Classification**: KEEP_AS_IS  
**Why**: The 5-band scale (MICRO→WHALE) is appropriate for institutional qualification.  

### Field 6: Authority Role

**Classification**: KEEP_AS_IS  
**Why**: Free-text "Founder, CEO, Chief of Staff, Director, Board Chair..." — appropriate for this stage.  

### Field 7: Authority Scope

**Classification**: KEEP_AS_IS  
**Why**: The three options (DIRECT/PROXY/UNCLEAR) are well-chosen. "I decide directly" / "I influence and sponsor" / "I am exploring only" — these map directly to the authority classification system.  

### Field 8: Urgency Window

**Classification**: KEEP_AS_IS  
**Why**: Four options from "Immediate/30 days" to "Long horizon/strategic" — appropriate range.  

### Field 9: Problem Statement

**Classification**: KEEP_AS_IS  
**Why**: The placeholder ("State the actual problem in structural terms, not just symptoms or frustration") is excellent guidance. The help text ("The stronger the articulation, the stronger the diagnosis") sets appropriate expectations.  

### Field 10: Symptoms

**Classification**: KEEP_AS_IS  
**Why**: The placeholder provides concrete examples ("drift, delays, confusion, politics, trust loss, weak execution, revenue pressure") that help users articulate.  

### Field 11: Desired Outcome

**Classification**: KEEP_AS_IS  
**Why**: "What decision-quality outcome are you trying to reach?" — precise, decision-focused.  

### Field 12: Current Constraint

**Classification**: KEEP_AS_IS  
**Why**: The placeholder ("clarity, authority, money, timing, politics, governance, trust...") provides a useful framework.  

### Field 13: Market Exposure

**Classification**: KEEP_AS_IS  
**Why**: Four options from "Stable" to "Severe instability" — appropriate range.  

### Field 14: Board Involvement

**Classification**: KEEP_AS_IS  
**Why**: Three options (YES/NO/UNCERTAIN) — the UNCERTAIN option is important for honesty.  

**Strategy Room Intake Verdict**: All 14 fields are KEEP_AS_IS. Well-designed intake.  

---

## Summary of Required Changes

| Surface | KEEP_AS_IS | KEEP_BUT_REPOSITION | MERGE_WITH_OTHER | SPLIT_INTO_MULTIPLE |
|---------|-----------|---------------------|------------------|---------------------|
| Fast Diagnostic | 3 | 0 | 0 | 0 |
| Purpose Alignment (context) | 3 | 0 | 0 | 0 |
| Purpose Alignment (Likert) | 15 | 1 (env_2) | 2 (beh_2, leg_2) | 0 |
| Constitutional Diagnostic | 10 | 0 | 0 | 0 |
| Enterprise Assessment | 11 | 0 | 0 | 1 (G2) |
| Strategy Room Intake | 14 | 0 | 0 | 0 |
| **Total** | **56** | **1** | **2** | **1** |

### Questions to change (4 total):

1. **environment_2** (Purpose Alignment): Reposition — split awareness vs action
2. **behaviour_2** (Purpose Alignment): Merge into behaviour_1 — replace with energy allocation question
3. **legacy_2** (Purpose Alignment): Merge into legacy_1 — replace with sacrifice/trade-off question
4. **G2** (Enterprise Assessment): Split escalation vs accountability into two questions

### Verdict

**56 of 60 static questions are KEEP_AS_IS.** This is an unusually strong questioning system. The four recommended changes are refinements, not overhauls. The product's questioning layer is not a weakness — it is a genuine competitive advantage.

The questions that exist are:
- **Bespoke, not generic** — no recycled survey instruments
- **Strategically necessary** — every question produces downstream evidence
- **Creates useful discomfort** — the best questions (behaviour_1, q9, L2) force honest self-assessment
- **Produces verifiable evidence** — calendar checks, structural vs motivational causes, surfaced vs buried disagreements

**The central question — "Are we asking the right questions, in the right order, with the right emotional pressure, evidence discipline, and strategic usefulness?" — the answer is yes, with minor refinements.**

---

*End of question quality audit.*