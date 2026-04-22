# Assessment Redesign — From Scoring to Intelligence

## Current State (Honest)

| Assessment | Questions | Free Text | Bespoke Output? | Time | Justifies Cost? |
|---|---|---|---|---|---|
| Purpose Alignment | 18 dual-axis Likert | 0 | No — same template for everyone above threshold | 8 min | Free — but feels disposable |
| Constitutional | 10 dual-axis Likert | 0 | No — route decision feels mechanical | 10 min | Free — but underwhelming |
| Team | 12 × 2 modes (sliders) | 0 | Partially — gap numbers are unique | 12–15 min | Free — gap data is useful but thin |
| Enterprise | 12 sliders (6 metrics × N) | 0 | No — same posture matrix for everyone | 10–15 min | Free — but generic |
| Executive Reporting | 23 structured fields | 9 free text fields | Partially — narrative is template-based | 15–20 min | £95 — should feel like a paid advisory brief, currently feels like a generated report |
| Strategy Room | 14 structured fields | 8 free text fields | No — intake is collected but not meaningfully interpreted | 8–10 min | £395 — intake quality varies wildly, no coherence validation |

**Core problem**: The free assessments feel like forms. The paid ones feel like better forms. None of them feel like someone understood your situation.

---

## Design Principles

### 1. Every question must earn its place

If a question doesn't change the output, remove it. If it doesn't change the interpretation, make it optional. Users should feel each question sharpening the system's understanding.

### 2. Structured questions create the scaffold. Free text creates the specificity.

Likert scores produce comparable data. Free text produces bespoke interpretation. Both are required. Neither works alone.

### 3. The output must reference what the user said

If the user wrote "our CTO left and the board is in crisis" and the output says "authority structures require clarification" — the system failed. The output must name the CTO, the board, the crisis.

### 4. Cross-stage memory must be visible

When a user completes Stage 2 and sees their Stage 1 patterns confirmed or contradicted — that's when the system becomes irreplaceable. The tension thread must surface, not just accumulate.

### 5. Time must feel invested, not spent

8 minutes for a diagnostic that produces "DRIFTING" is a waste of time. 8 minutes for a diagnostic that says "Your mandate clarity is high but your execution domain reveals a 43-point gap between what you believe and what your team measures — and that gap has persisted across two stages" — that's intelligence.

---

## Redesigned Assessment Architecture

### STAGE 1: PURPOSE ALIGNMENT (Free, 6–8 min)

**Role**: Personal calibration. Reveals the operator's own contradictions before they assess anyone else.

**Redesign**:

Keep the 18 dual-axis Likert questions — they produce good comparative data. But add:

**3 forced free-text fields** (after scoring, not before):

1. "What is the one decision you are currently avoiding?" — This is the most diagnostic single question in the entire system. It reveals more than 18 Likert scales combined.

2. "Describe your last 7 days in one sentence." — Forces temporal grounding. Reveals gap between stated alignment and actual behaviour.

3. "Who would disagree with your self-assessment above, and why?" — Forces perspective-taking. The answer itself is diagnostic — people who can't name a dissenter have blind spots.

**Output upgrade**: LLM interprets the gap between Likert scores and free-text answers. If someone scores 85% on Decision Integrity but writes "I've been avoiding the restructuring decision for 3 months" — that contradiction IS the finding.

**Talk trigger**: "The system identified that you scored highly on decision integrity but described avoiding a specific decision. That gap is the condition."

---

### STAGE 2: CONSTITUTIONAL DIAGNOSTIC (Free, 8–10 min)

**Role**: Structural health reading of the organisation. Not personal — institutional.

**Redesign**:

Keep the 10 dual-axis Likert questions. But fix the double-negative reverse scoring — rephrase questions so "high resonance = good" for all questions. Then add:

**2 forced free-text fields** (contextual, after Likert):

1. "What is the single biggest structural problem in this organisation right now?" — Not symptoms. Structure. This anchors the entire constitutional reading.

2. "What has been tried before, and what happened?" — Prior correction history. If the answer is "nothing" — that's diagnostic. If the answer is "we tried restructuring and it failed" — that feeds the pattern engine directly.

**1 conditional field** (appears only if Authority domain scores < 50):

3. "Who actually makes this decision in practice, even if they shouldn't?" — Only asked when authority confusion is measured. This single answer can reclassify the entire authority domain from "unclear" to "shadow authority from [named person]".

**Output upgrade**: LLM interpretation bound to the structural problem statement. Instead of "DRIFTING — governance score 48%" → produce "Authority confusion around [user's named problem] is producing execution drag. The prior attempt at [user's described fix] failed because [LLM interpretation of why, based on scores]."

---

### STAGE 3: TEAM ASSESSMENT (Free, 10–12 min)

**Role**: Measure the gap between what leadership believes and what the team experiences.

**Redesign**:

Keep the dual-mode (leader perception vs leader's estimate of team). But add:

**1 pre-assessment calibration question**:

"On a scale of 0–100, how confident are you that your team would agree with your assessment?" — This becomes the baseline against which the actual gap is measured. If leader says 90% confidence but the gap is 40+ points — the contradiction is the headline finding.

**2 post-scoring free-text fields**:

1. "What is the one thing your team would say you don't understand about their experience?" — Forces empathy. Most leaders can't answer this, and that inability IS the diagnostic.

2. "What would happen if you showed your team these scores?" — Reveals political sensitivity. If the answer is "they'd be relieved someone finally measured this" — that's structural. If "they'd be angry" — that's trust.

**Team respondent mode upgrade**: When actual team members respond (not just leader estimating), add one free-text field per respondent:

"What is one thing leadership assumes about this team that isn't true?"

This single question produces the highest-value data in the entire system. Aggregated across 10+ respondents, it produces a contradiction map that no Likert scale can match.

**Output upgrade**: The gap analysis becomes a named contradiction: "Leadership estimates authority clarity at 82%. Team respondents average 44%. The specific failure point: [aggregated from free-text responses]."

---

### STAGE 4: ENTERPRISE ASSESSMENT (Free, 10–15 min)

**Role**: Institutional stress test. Scales up from team to entire organisation.

**Redesign**:

Replace user-defined domain labels with **5 fixed institutional domains** (eliminates naming noise):

1. **Governance Reliability** — decision rights, policy clarity, audit trail
2. **Execution Capacity** — delivery consistency, resource allocation, milestone discipline
3. **Leadership Coherence** — strategic alignment at senior level, communication consistency
4. **Organisational Resilience** — ability to absorb shock, succession depth, knowledge retention
5. **Market Responsiveness** — speed of adaptation, external signal reading, competitive positioning

For each domain: 3 Likert questions (0–100) + 1 free-text:

"What is the most expensive failure in this domain in the last 12 months?"

This anchors abstract domain scores in concrete cost. 5 domain-specific failure stories produce a richer reading than 30 generic sliders.

**Output upgrade**: The cascade risk analysis references the user's named failures: "Governance Reliability scored 38%. Your reported failure — [user's text] — confirms that decision-rights confusion has material cost. Cascade risk: Execution Capacity depends on Governance Reliability, and your execution score (52%) shows the dependency."

---

### STAGE 5: EXECUTIVE REPORTING (£95, 15–20 min)

**Role**: The governed brief. Must feel like a £95 advisory output.

**Redesign**:

Reduce from 23 fields to 12. The current form has redundancy (problemStatement vs symptoms vs currentConstraint often repeat). Restructure:

**Structured fields** (8):
1. Organisation + Role + Sector (3 fields, identity)
2. Revenue band (select)
3. Headcount affected (select, banded: <20, 20–100, 100–500, 500+)
4. Decision window (select: 30d, 90d, 6–12m, strategic)
5. Authority scope (select: I decide / I influence / I'm exploring)
6. Board involvement (select: Yes / No / Pending)

**Free-text fields** (4, each with purpose):
1. "State the decision that must be made." — Not the problem. The decision. One sentence. This forces clarity.
2. "What happens if this decision is delayed by 90 days?" — Forces consequence thinking. The answer IS the financial exposure framing.
3. "What is preventing this decision from being made right now?" — The real constraint. Not symptoms.
4. "What was tried before, and what specifically went wrong?" — Prior correction history with root cause.

**Removed**: symptoms (redundant with constraint), desiredOutcome (derivable from decision), evidenceNotes (replaced by prior diagnostics), sponsorNameOrSeat (captured in authority scope), estimatedExposureGBP (derived from decision + delay answer), evidenceQuality (derived from prior diagnostic thread).

**Output upgrade**: Every section of the report references the user's four free-text answers:
- Position statement references the stated decision
- Financial exposure references the 90-day delay answer
- Priority stack references the constraint
- Historical pattern references the prior attempt

The LLM interpretation layer binds all four answers to the canonical scores. The result reads like a senior advisor who has reviewed THIS situation, not a template.

---

### STAGE 6: STRATEGY ROOM (£395, 8–10 min intake)

**Role**: Execution environment. Not exploration.

**Redesign**:

The Strategy Room intake should feel like entering a controlled environment, not filling a form. Reduce to 8 fields:

**Structured** (4):
1. Authority scope (already known from prior stages — pre-fill)
2. Decision window (pre-fill from ER if available)
3. Revenue band (pre-fill)
4. Escalation level (select: Operational / Strategic / Existential)

**Free-text** (4, tight):
1. "What is the intervention?" — One sentence. What must change.
2. "What breaks if this intervention fails?" — Consequence of wrong action.
3. "Who must be moved?" — Names the stakeholders. Not generic.
4. "What authority do you lack?" — The gap between what you need to do and what you're allowed to do.

**Pre-fill everything possible from prior stages**. If the user completed ER, half the intake should be auto-populated. The remaining 4 free-text questions should take 4–5 minutes.

**Output upgrade**: The execution surface immediately references the user's intervention, the stakeholders, and the authority gap. The intervention stack is built around THEIR constraints, not generic governance steps.

---

## Cross-Stage Intelligence Design

### What Changes at Each Stage

| Stage | What the User Gives | What the System Learns | What the Output Shows |
|---|---|---|---|
| 1. Purpose | Likert + avoided decision + last 7 days + dissenter | Personal contradictions, blind spots, actual vs stated | "You score X but your behaviour reveals Y" |
| 2. Constitutional | Likert + structural problem + prior attempts + shadow authority | Institutional pattern, correction history, real authority map | "The structural problem you named is [confirmed/contradicted] by the scores" |
| 3. Team | Likert + confidence baseline + empathy question + team free text | Perception gap, political sensitivity, team-named contradictions | "Leadership confidence was 90% but the gap is 40 points. Team says [specific thing]" |
| 4. Enterprise | Likert + domain-specific failure stories | Cascade dependencies, concrete cost evidence, resilience gaps | "Your governance failure cost [£X]. It cascaded into execution because [dependency]" |
| 5. Executive Report | Decision + delay consequence + constraint + prior attempt | Financial exposure, constraint-aware priority, pattern recognition | "This decision about [their topic] carries [£X] exposure. The constraint is [their constraint]. Priority: [specific to their situation]" |
| 6. Strategy Room | Intervention + consequence + stakeholders + authority gap | Execution path, resistance map, authority resolution | "Intervention: [their words]. First move: [specific]. Resistance from [their named stakeholder]. Authority gap: [their gap]" |

### Tension Thread Surfaces

After Stage 2+, every output includes a "System Memory" block:

> "The authority confusion you identified in Stage 2 was confirmed by the team perception gap in Stage 3. The prior attempt at restructuring (Stage 2) failed because the authority confusion was not resolved first. This pattern has now persisted across 2 stages."

This is what makes the system non-replicable. A user with ChatGPT gets each stage independently. This system accumulates.

---

## Anti-Generic Enforcement

### Every output must pass 3 checks:

1. **User Input Reference**: Does the output reference specific words/entities from the user's free-text answers? If not → regenerate.

2. **Cross-Stage Continuity**: If Stage 2+ → does the output reference patterns from prior stages? If not → inject thread context.

3. **Contradiction Surfacing**: Does the output identify at least one gap between what the user claims and what the scores reveal? If not → the interpretation failed.

---

## Cost Justification Per Stage

| Stage | Price | Time | What User Gets That They Can't Get Elsewhere |
|---|---|---|---|
| Purpose Alignment | Free | 8 min | Personal contradiction map. "I didn't realise I was avoiding that decision." |
| Constitutional | Free | 10 min | Structural reading with their specific problem named. Not generic governance. |
| Team | Free | 12 min | The gap between what they believe and what the team measures — with the team's own words. |
| Enterprise | Free | 12 min | Domain-specific failure cost connected to cascade dependencies. Real money, not abstract risk. |
| Executive Reporting | £95 | 15 min | A brief that reads like a senior advisor reviewed THEIR situation. Financial exposure tied to THEIR delay scenario. Priority stack tied to THEIR constraint. |
| Strategy Room | £395 | 5 min (intake) + execution | An execution surface that references THEIR intervention, THEIR stakeholders, THEIR authority gap. Not generic governance steps. |

---

## Implementation Priority

### Phase 1: Add free-text fields to existing assessments
- Purpose Alignment: 3 fields
- Constitutional: 2–3 fields
- Team: 2 fields + respondent field
- Enterprise: 5 domain-specific failure questions
- Executive Reporting: Reduce to 12 fields (4 structured, 4 free-text)
- Strategy Room: Reduce to 8 fields (4 structured, 4 free-text)

### Phase 2: Wire LLM interpretation to every stage output
- Use existing `interpret()` engine
- Each stage gets bespoke interpretation bound to its free-text answers
- Show canonical output immediately, enrich with interpretation async

### Phase 3: Surface cross-stage intelligence
- Show tension thread "System Memory" block after Stage 2+
- LLM synthesises cross-stage patterns into a continuity narrative
- Each subsequent stage output explicitly references prior stage findings

### Phase 4: Anti-generic enforcement
- Implement specificity checks at output level
- Reject and regenerate outputs that don't reference user inputs
- A/B test interpreted vs template outputs for conversion impact

---

## Success Test

Give two users the same Likert scores but different free-text answers.

- User A: "Our CTO left and the board is in crisis"
- User B: "We're considering expanding into a new market"

If the outputs are identical → system failed.
If the outputs reference their specific situations → system works.
If the outputs reference their prior stage patterns → system is irreplaceable.
