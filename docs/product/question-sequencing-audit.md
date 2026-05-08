# Question Sequencing Audit — Ladder Progression

> Audit date: 2026-05-08
> Method: Each product stage assessed for emotional trajectory, evidence extraction timing, and strategic sense.

---

## STAGE 1: FAST DIAGNOSTIC

### Sequence Analysis
1. **What should the user feel:** Seriousness. "This is not a quiz."
2. **Truth to extract:** The real decision, the real authority, the real cost.
3. **Minimum evidence before progress:** Decision named, authority named, consequence named.
4. **Opening question:** "What decision has been sitting unresolved longer than it should?"
5. **Does it create seriousness immediately:** Yes. "Longer than it should" implies the user already knows they're late.
6. **Safe → uncomfortable → precise → accountable:** Yes.
   - Q1 (decision) = safe entry, permission to name
   - Q2 (authority) = uncomfortable — must name one person
   - Q3 (consequence) = precise — prices the delay
   - Q4 (commitment) = accountable — "will you act?"
7. **Commitment timing:** Perfect — asked before results, not after.
8. **Contradiction surfaced:** Yes — live hints detect outcome-vs-decision and shared-vs-single authority.
9. **Consequence priced:** Yes — Q3 explicitly.
10. **Emotional safety:** Good — hints guide rather than reject.

**Classification: STRATEGICALLY_STRONG**

---

## STAGE 2: PURPOSE ALIGNMENT

### Sequence Analysis
1. **What should the user feel:** Recognition. "This system sees the trade-off I am living."
2. **Truth to extract:** What they're avoiding, what's pulling against it, what deteriorates.
3. **Minimum evidence:** All 3 context answers + challenge passed.
4. **Opening question:** "What decision are you currently avoiding or deferring?"
5. **Seriousness:** Yes — "avoiding" is permission to confess, not perform.
6. **Sequence:** Safe → uncomfortable → precise → accountable:
   - Context Q1 (avoiding) = safe confession
   - Context Q2 (competing obligation) = uncomfortable trade-off
   - Context Q3 (what worsens) = precise consequence
   - Signal phase = 18 statements creating evidence base
   - No commitment question at end — **gap**
7. **Commitment timing:** Missing. After 18 statements, the system should ask what the user will do about the weakest domain.
8. **Contradiction surfaced:** Yes — dual-axis gap detection. Also challenge API fires for vague-decision, weak-consequence, avoidance-language.
9. **Consequence priced:** Yes — context Q3.
10. **Emotional safety:** Good. Stage introductions provide framing ("Answer for the reality of the past 90 days — not your aspirations").

**But:** The signal phase (18 statements) risks fatigue. Three statements per domain at 6 domains = 18 × 2 axes = 36 slider interactions. This is the longest continuous input sequence in the product.

**Sequencing issue:** behaviour_2 is a weaker version of behaviour_1 and appears immediately after it. The user feels repetition. environment_3 (media consumption) breaks the emotional momentum built by environment_1 (five people making me sharper).

**Classification: MOSTLY_SOUND**
- Context phase: STRATEGICALLY_STRONG
- Signal phase: FUNCTIONAL_BUT_FLAT in middle domains (behaviour, legacy)

---

## STAGE 3: CONSTITUTIONAL DIAGNOSTIC

### Sequence Analysis
1. **What should the user feel:** Gravity. "This system is evaluating my organisation's structural condition."
2. **Truth to extract:** Whether authority exists, coherence holds, friction is systemic, stakes are real.
3. **Minimum evidence:** All 10 statements answered.
4. **Opening question:** q1 "The stated strategy and actual resource allocation are meaningfully aligned."
5. **Seriousness:** Yes — opens with the most fundamental test (do you do what you say?).
6. **Sequence:**
   - q1 (coherence) = institutional mirror
   - q2 (authority) = structural test
   - q3 (environment change) = external pressure
   - q4 (drift) = internal failure
   - q5 (trust) = relationship test
   - q6 (friction) = visible dysfunction
   - q7 (decision-maker exists) = authority confirmation
   - q8 (stakes) = consequence pricing
   - q9 (past attempts) = history of failure
   - q10 (external pressure) = urgency confirmation
7. **Commitment timing:** No commitment question — appropriate here as this is diagnostic, not actionable.
8. **Contradiction:** Yes — reverse-scored questions (q3, q4, q6, q9) create analytical contradiction against forward-scored ones.
9. **Consequence:** q8 explicitly.
10. **Emotional safety:** Moderate. The statements are clinical. This is appropriate for institutional assessment.

**Sequencing strength:** The sequence moves from internal coherence (q1) → authority (q2) → external change (q3) → internal failure (q4) → trust (q5) → friction (q6) → authority again (q7) → stakes (q8) → history (q9) → urgency (q10). This is a well-constructed spiral from structure → dysfunction → consequence.

**Classification: STRATEGICALLY_STRONG**

---

## STAGE 4: TEAM ASSESSMENT (Leader View)

### Sequence Analysis
1. **What should the user feel:** Exposure. "Do I see my team accurately?"
2. **Truth to extract:** Perception gap between leader belief and estimated team reality.
3. **Minimum evidence:** 4–5 answers per group minimum.
4. **Opening domain:** Direction & Priority — "can state the current priority set with genuine consistency."
5. **Seriousness:** Yes — "genuine consistency" is a high bar.
6. **Sequence:**
   - Phase 1: Leader rates team (12 statements) — relatively safe
   - Phase 2: Leader estimates how team would rate themselves (same 12) — uncomfortable
   - The gap between phases IS the diagnostic
7. **Commitment timing:** Post-reflections include "What would you want your team to see as the priority correcting move?" — but this is too soft. Should be: "Name the action you will take this week."
8. **Contradiction:** The dual-phase structure IS the contradiction engine. Brilliant design.
9. **Consequence:** Not explicitly priced. **Gap** — should include: "If this gap is real, what does your team lose by the end of the quarter?"
10. **Emotional safety:** Good — the leader is rating themselves, not being rated. The discomfort comes from the gap, not from the questions.

**Sequencing issue:** The four domains are well-ordered (Direction → Execution → Trust → Authority). But "produces visible progress, not just activity" is the third statement in Execution and feels like a let-down after "converts meetings and decisions into measurable action."

**Classification: MOSTLY_SOUND**

---

## STAGE 5: TEAM ASSESSMENT (Respondent View)

### Sequence Analysis
1. **What should the user feel:** Honesty. "I can say what I see."
2. **Truth to extract:** Team-level perception of direction, execution, trust, authority.
3. **Minimum evidence:** All 4 answers.
4. **Opening question:** "Direction and priority are clear in day-to-day work."
5. **Seriousness:** Low. This reads like a survey, not a diagnostic.
6. **Sequence:** Four statements on a 5-point scale. Too compressed, too fast.
7. **Commitment timing:** None — appropriate.
8. **Contradiction:** Only produced when aggregated against leader view. Individual respondent experience has no contradiction mechanism.
9. **Consequence:** None.
10. **Emotional safety:** Adequate.

**Critical sequencing flaw:** The respondent completes the assessment in under 2 minutes. This is too short to produce genuine reflection. The leader spends 20+ minutes. The respondent spends 90 seconds. The asymmetry weakens the gap analysis.

**Classification: TOO_GENERIC**

---

## STAGE 6: ENTERPRISE ASSESSMENT — LEADER VIEW (Boolean)

### Sequence Analysis
1. **What should the user feel:** Accountability. "Am I honest about my institution?"
2. **Truth to extract:** Institutional health across 6 structural domains.
3. **Minimum evidence:** Schema-validated responses.
4. **Opening question:** mc_1 "We can clearly say what this organisation is here to do — and there is no confusion about it."
5. **Seriousness:** Yes — this is a binary test. True or false. No hiding in the middle.
6. **Sequence:** 6 domains × 3 statements. Well-ordered:
   - Mandate → Decision → Environment → Operations → Culture → Legacy
   - Moves from "what we say" to "what we do" to "what persists"
7. **Commitment timing:** None — appropriate for diagnostic.
8. **Contradiction:** Boolean format limits contradiction detection within the assessment (no nuance). But contradictions emerge when cross-referenced with Constitutional and Team data.
9. **Consequence:** lco_3 "holds together even if the current leaders leave" — powerful closing.
10. **Emotional safety:** Good.

**Sequencing issue:** od_2 and od_3 are redundant and slow the momentum between the strong od_1 and the strong eco_1.

**Classification: MOSTLY_SOUND**

---

## STAGE 7: ENTERPRISE ASSESSMENT — RESPONDENT VIEW (Boolean)

### Sequence Analysis
1. **What should the user feel:** Honesty.
2. **Truth to extract:** Respondent-level institutional perception.
3. **Minimum evidence:** 5 of 5.
4. **Opening question:** "Operational transparency is maintained across all levels."
5. **Seriousness:** No. This sounds like a corporate HR survey.
6. **Sequence:** 5 questions that do not build momentum, do not create discomfort, do not surface contradiction.
7. **Commitment:** None.
8. **Contradiction:** None.
9. **Consequence:** None.
10. **Emotional safety:** Excessive — so safe that it produces no truth.

**Classification: NEEDS_REBUILD**

---

## STAGE 8: ENTERPRISE ASSESSMENT — LIKERT VIEW (12)

### Sequence Analysis
1. **What should the user feel:** Gravity. "This institution may have structural problems."
2. **Truth to extract:** Leadership coherence, governance reliability, execution variance, institutional risk.
3. **Opening question:** "Senior leadership reads the condition of the institution with enough consistency."
4. **Seriousness:** Moderate — "enough consistency" is clinical but specific.
5. **Sequence:**
   - Block 1 (Leadership Coherence) → Block 2 (Governance) → Block 3 (Execution) → Block 4 (Risk)
   - This moves from perception → structure → reality → consequence. Good progression.
6. **Commitment timing:** None — appropriate.
7. **Contradiction:** "Trust in the institution is not quietly weakening" is reverse-implication and creates useful tension.
8. **Consequence:** "Current delay does not materially increase strategic cost" — excellent reverse-framed consequence question.
9. **Emotional safety:** Good.

**Classification: MOSTLY_SOUND**

---

## STAGE 9: EXECUTIVE REPORTING

### Sequence Analysis
1. **What should the user feel:** Precision. "This report will be exactly as good as my input."
2. **Truth to extract:** The exact decision, its cost, its constraint, and what has failed before.
3. **Minimum evidence:** 3 of 4 core questions answered.
4. **Opening:** "Four questions. Each one changes the report. No fluff — write what is real."
5. **Seriousness:** Yes — the framing is excellent.
6. **Sequence:**
   - Identity (name, email, org, role) — necessary but low-stakes
   - Decision scope selects — authority, board, revenue, window — contextual
   - Core Q1 (decision on table) → Q2 (cost of delay) → Q3 (real constraint) → Q4 (prior attempts)
7. **Commitment timing:** No commitment question. **Gap** — after providing this much input, the user should be asked: "Will you implement the first action this report recommends?"
8. **Contradiction:** The scope selects can contradict the core answers (e.g., "I am exploring" + "30 day window" = contradiction).
9. **Consequence:** Q2 explicitly.
10. **Emotional safety:** Good — optional Q4 allows the user to skip if nothing has been tried.

**Sequencing issue:** The identity fields and decision scope selects come BEFORE the core questions. This means the user completes ~10 low-stakes form fields before hitting the real questions. The sequence should open with the core questions to establish seriousness, then collect context.

**Classification: MOSTLY_SOUND** (but identity-first ordering weakens the opening)

---

## STAGE 10: STRATEGY ROOM

### Sequence Analysis
1. **What should the user feel:** Weight. "This is the most serious thing I have done in this product."
2. **Truth to extract:** Problem structure, authority, consequence dimensions, readiness to absorb intervention.
3. **Minimum evidence:** Problem statement ≥ 40 chars, authority scope selected, required identity fields.
4. **Opening question:** "State the actual structural problem requiring strategic intervention. Not symptoms — the condition."
5. **Seriousness:** Yes — "structural" and "not symptoms" immediately set the bar.
6. **Sequence:**
   - Stage 0: Situation Gravity (problem, prior failures, cost of inaction)
   - Stage 1: Authority & Mandate (identity, scope, board)
   - Stage 2: Consequence Mapping (4 sliders)
   - Stage 3: Intervention Readiness (assets, blockers, capacity)
7. **Commitment timing:** Pre-admission gates: "readyForUnpleasantDecision" and "willingAccountability" are hard gates. These are commitment questions disguised as qualification. Excellent.
8. **Contradiction:** Text quality scoring detects substance vs. fluff. But no explicit contradiction detection between stages.
9. **Consequence:** Stage 2 explicitly. But sliders are too easy (see quality audit).
10. **Emotional safety:** Stage 0 is confrontational. Stage 1 is procedural. Stage 2 is too safe (sliders). Stage 3 is honest. The sequence dips in Stage 2.

**Sequencing issue:** Stage 2 (consequence sliders) is the weakest point. Four sliders with defaults of 5 create a valley of low engagement between the intense Stage 0 and the honest Stage 3.

**Classification: MOSTLY_SOUND** (Stage 2 weakness noted)

---

## STAGE 11: RETURN BRIEF

### Sequence Analysis
1. **What should the user feel:** Confrontation. "The system remembers what I said I would do."
2. **Truth to extract:** Whether committed actions were executed.
3. **Opening:** Varies by trigger — "You committed to act. No action has been recorded."
4. **Seriousness:** Maximum. The strongest emotional moment in the product.
5. **Sequence:** Challenge prompt → commitment verification checkpoints → trajectory display → outcome classification.
6. **Commitment timing:** The entire surface IS a commitment verification.
7. **Contradiction:** The system's memory vs. the user's inaction IS the contradiction.
8. **Consequence:** Explicitly shown (deteriorating trajectory, worsening condition).
9. **Emotional safety:** Low — by design. This is where accountability lives.

**Classification: STRATEGICALLY_STRONG**

---

## STAGE 12: OUTCOME VERIFICATION

### Sequence Analysis
1. **What should the user feel:** Truth. "Did it work?"
2. **Truth to extract:** Whether the intervention resolved, improved, stabilised, or worsened the condition.
3. **Opening:** Classification verdict (HELD / PARTIAL / INEFFECTIVE / WORSENED).
4. **Seriousness:** Maximum — the system delivers a verdict, not a suggestion.
5. **Sequence:** Verdict → contradiction persistence → root cause → before/after → response/non-response → execution hold.
6. **Commitment timing:** Link to Strategy Room re-entry if failed.
7. **Contradiction:** Persisting contradictions are shown explicitly.
8. **Consequence:** Failure classification is itself a consequence statement.
9. **Emotional safety:** Low — appropriate.

**Classification: STRATEGICALLY_STRONG**

---

## OVERALL LADDER SEQUENCING VERDICT

| Stage | Classification | Key Issue |
|-------|---------------|-----------|
| Fast Diagnostic | STRATEGICALLY_STRONG | None |
| Purpose Alignment | MOSTLY_SOUND | Signal phase fatigue, behaviour_2 redundancy |
| Constitutional | STRATEGICALLY_STRONG | None |
| Team Assessment (Leader) | MOSTLY_SOUND | Missing consequence pricing |
| Team Assessment (Respondent) | TOO_GENERIC | 90-second assessment is too shallow |
| Enterprise (Leader Boolean) | MOSTLY_SOUND | od_2, od_3 redundancy |
| Enterprise (Respondent Boolean) | NEEDS_REBUILD | Corporate boilerplate |
| Enterprise (Likert) | MOSTLY_SOUND | None significant |
| Executive Reporting | MOSTLY_SOUND | Identity-first ordering weakens opening |
| Strategy Room | MOSTLY_SOUND | Stage 2 slider valley |
| Return Brief | STRATEGICALLY_STRONG | None |
| Outcome Verification | STRATEGICALLY_STRONG | None |

**Critical ladder gap:** No COMMITMENT question exists between the Fast Diagnostic (Q4) and the Strategy Room admission gates. The Purpose Alignment, Constitutional, Team, and Enterprise stages all extract evidence but never ask: "What will you do with this?" This creates a commitment desert in the middle of the ladder.
