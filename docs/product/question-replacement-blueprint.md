# Question Replacement Blueprint

> Audit date: 2026-05-08
> Scope: Every question marked REWRITE, REPLACE, SPLIT, MERGE, MOVE, or REMOVE with implementation plan.

---

## Priority Levels

| Level | Criteria |
|-------|---------|
| P0 | Weak question damages product trust or evidence quality |
| P1 | Question materially weakens output quality |
| P2 | Question reduces premium feel |
| P3 | Question is acceptable but can be sharper |

---

## P0 — CRITICAL (Must Change Before Scale)

### 1. Enterprise Respondent Q1
- **Current:** "Operational transparency is maintained across all levels."
- **Problem:** Corporate compliance language. Zero evidence yield. Damages enterprise tier perception.
- **Proposed:** "I know what the organisation's top priority is without having to ask."
- **Evidence yield:** Mandate clarity signal, contradiction detection (do they actually know?)
- **Emotional effect:** CONFRONTS — forces specificity vs. assumed knowledge.
- **Downstream use:** Aggregated against leader mc_1 for gap analysis.
- **Risk if not changed:** Enterprise buyers see this question and question the product's sophistication.
- **File:** `app/assessment/[token]/page.tsx` line 211
- **Migration priority:** P0

### 2. Enterprise Respondent Q2
- **Current:** "Strategic objectives are synchronized with team execution."
- **Problem:** Consultant-speak. No one knows what "synchronized" means practically.
- **Proposed:** "What leadership says matters and what actually gets resourced are the same thing."
- **Evidence yield:** Strategy-execution contradiction, resource alignment signal.
- **Emotional effect:** EXPOSES_CONTRADICTION
- **Downstream use:** Cross-reference with Constitutional q1 (coherence).
- **Risk if not changed:** Same as Q1.
- **File:** `app/assessment/[token]/page.tsx` line 212
- **Migration priority:** P0

### 3. Enterprise Respondent Q3
- **Current:** "Resource allocation is prioritized by institutional impact."
- **Problem:** Bureaucratic. Produces no truth signal.
- **Proposed:** "When a decision gets stuck, I know who can unstick it."
- **Evidence yield:** Authority clarity signal, escalation readiness.
- **Emotional effect:** CLARIFIES — tests practical knowledge of authority.
- **Downstream use:** Authority domain scoring.
- **Risk if not changed:** Same as Q1.
- **File:** `app/assessment/[token]/page.tsx` line 213
- **Migration priority:** P0

### 4. Enterprise Respondent Q4
- **Current:** "Decision-making follows established governance processes."
- **Problem:** Compliance language. Measures process adherence, not decision quality.
- **Proposed:** "I would say something uncomfortable to my manager if I thought it mattered."
- **Evidence yield:** Trust signal, escalation safety, psychological safety with teeth.
- **Emotional effect:** CONFRONTS — names the specific test of trust.
- **Downstream use:** Trust domain scoring, escalation readiness.
- **Risk if not changed:** Same as Q1.
- **File:** `app/assessment/[token]/page.tsx` line 214
- **Migration priority:** P0

### 5. Enterprise Respondent Q5
- **Current:** "Data integrity is verified before strategic commitments."
- **Problem:** IT audit language. Wrong register entirely.
- **Proposed:** "The last major change here improved things — it did not just rearrange them."
- **Evidence yield:** Execution effectiveness signal, pattern recurrence.
- **Emotional effect:** CONFRONTS — challenges change theatre.
- **Downstream use:** Execution and pattern domains.
- **Risk if not changed:** Same as Q1.
- **File:** `app/assessment/[token]/page.tsx` line 215
- **Migration priority:** P0

---

## P1 — HIGH (Materially Weakens Output Quality)

### 6. Purpose Alignment: decision_2
- **Current:** "I am not making reactive choices under pressure."
- **Problem:** Too broad. No specificity, no evidence anchor. Weaker version of decision_1.
- **Proposed:** "The last time I acted under pressure, I chose to — not because I had to."
- **Evidence yield:** Decision quality signal with temporal evidence anchor.
- **Emotional effect:** CONFRONTS — demands a specific memory.
- **Downstream use:** Decision domain score.
- **File:** `lib/alignment/checklist.ts` line 31
- **Migration priority:** P1

### 7. Purpose Alignment: environment_2
- **Current:** "I am not tolerating environments that produce confusion."
- **Problem:** Vague. "Confusion" is too soft.
- **Proposed:** "I have removed or restructured at least one relationship, role, or environment that was diluting my clarity in the past 90 days."
- **Evidence yield:** Action evidence, environmental control signal.
- **Emotional effect:** CONFRONTS — demands evidence of action taken.
- **File:** `lib/alignment/checklist.ts` line 35
- **Migration priority:** P1

### 8. Purpose Alignment: environment_3
- **Current:** "What I read, watch, and listen to is chosen deliberately — not just whatever shows up."
- **Problem:** Self-help register. Zero decision intelligence yield (score: 11/55).
- **Proposed:** REMOVE entirely. Reduce domain to 2 statements.
- **Risk if not changed:** Breaks premium feel. Sounds like a personal development quiz.
- **File:** `lib/alignment/checklist.ts` line 36
- **Migration priority:** P1

### 9. Purpose Alignment: behaviour_2
- **Current:** "My calendar reflects what I claim matters."
- **Problem:** Redundant with behaviour_1. Weaker version.
- **Proposed:** REMOVE. Merge signal into behaviour_1 scoring.
- **File:** `lib/alignment/checklist.ts` line 39
- **Migration priority:** P1

### 10. Purpose Alignment: behaviour_3
- **Current:** "I am producing measurable outputs, not just activity."
- **Problem:** Productivity language. Could be from any OKR tool.
- **Proposed:** "In the last 30 days, I can name one output that moved the structural condition I care about."
- **Evidence yield:** Execution evidence with temporal anchor.
- **File:** `lib/alignment/checklist.ts` line 40
- **Migration priority:** P1

### 11. Purpose Alignment: legacy_1
- **Current:** "I am building something that outlasts immediate comfort."
- **Problem:** Aspirational platitude. Evidence yield: 12/55.
- **Proposed:** "Something I have built in the past year will matter after I leave the room."
- **Evidence yield:** Legacy evidence with temporal anchor.
- **File:** `lib/alignment/checklist.ts` line 46
- **Migration priority:** P1

### 12. Purpose Alignment: legacy_2
- **Current:** "My current actions contribute to a long-term structure."
- **Problem:** Vague. Evidence yield: 12/55.
- **Proposed:** REMOVE. Merge into legacy_3 scoring.
- **File:** `lib/alignment/checklist.ts` line 47
- **Migration priority:** P1

### 13. Team Assessment (Respondent): direction_priority
- **Current:** "Direction and priority are clear in day-to-day work."
- **Problem:** Too compressed. No confrontational quality.
- **Proposed:** "I can name the top priority right now without checking."
- **Evidence yield:** Mandate clarity signal, tests actual knowledge vs. assumed.
- **File:** `app/assessment/[token]/page.tsx` line 22
- **Migration priority:** P1

### 14. Constitutional: q5
- **Current:** "Trust between leadership and execution layers is materially intact."
- **Problem:** "Materially intact" is too clinical. Users don't know where to place themselves.
- **Proposed:** "If an execution-layer employee raised a concern to the CEO today, it would be heard — not filtered, delayed, or punished."
- **Evidence yield:** Same trust signal, more answerable.
- **File:** `lib/diagnostics/constitutional-diagnostic-derivation.ts` line 124
- **Migration priority:** P1

### 15. Constitutional: q9
- **Current:** "Past attempts to correct the issue have failed due to structural, not motivational, causes."
- **Problem:** Requires expert-level causal reasoning from the respondent.
- **Proposed:** "We have tried to fix this before, and the fix did not hold. The same pattern returned."
- **Evidence yield:** Same recurrence signal, easier to answer honestly.
- **File:** `lib/diagnostics/constitutional-diagnostic-derivation.ts` line 145
- **Migration priority:** P1

### 16. Strategy Room Stage 2: Consequence Sliders
- **Current:** 4 sliders (financial, reputational, institutional, timeline) with default=5.
- **Problem:** Default evasion. No text evidence required. Emotional dead zone.
- **Proposed:** Keep sliders but add a required single-sentence evidence field below each: "Name the specific [financial/reputational/institutional/timeline] consequence."
- **Evidence yield:** Transforms numeric signal into evidence-anchored assessment.
- **File:** `components/strategy-room/Form.tsx` lines 715–718
- **Migration priority:** P1

---

## P2 — MODERATE (Reduces Premium Feel)

### 17. Purpose Alignment: emotional_order_3
- **Current:** "I recover quickly from disruption without losing direction."
- **Problem:** Resilience truism. Generic.
- **Proposed:** "After the last major disruption, my direction held — I did not start a new plan to avoid finishing the old one."
- **File:** `lib/alignment/checklist.ts` line 44
- **Migration priority:** P2

### 18. Enterprise Leader: mc_3
- **Current:** "Teams broadly understand what matters most right now."
- **Problem:** "Broadly" is soft.
- **Proposed:** "If you asked five team leads separately what matters most right now, they would give the same answer."
- **File:** `lib/alignment/enterprise-checklist.ts`
- **Migration priority:** P2

### 19. Enterprise Leader: di_1
- **Current:** "Major decisions are consistent with stated values and direction."
- **Problem:** Values alignment cliche.
- **Proposed:** "Our last three major decisions are defensible against our stated direction — not just politically convenient."
- **File:** `lib/alignment/enterprise-checklist.ts`
- **Migration priority:** P2

### 20. Enterprise Leader: eco_2
- **Current:** "People can disagree openly without it damaging the team."
- **Problem:** Psychological safety cliche.
- **Proposed:** "The last serious disagreement in leadership produced a better decision, not a political wound."
- **File:** `lib/alignment/enterprise-checklist.ts`
- **Migration priority:** P2

### 21. Enterprise Leader: od_2
- **Current:** "Calendars and meetings reflect actual priorities."
- **Problem:** Triple redundancy (behaviour_2, od_2 in two places).
- **Proposed:** REMOVE.
- **File:** `lib/alignment/enterprise-checklist.ts`
- **Migration priority:** P2

### 22. Enterprise Leader: od_3
- **Current:** "Outputs matter more than visible busyness."
- **Problem:** Productivity truism. Covered by od_1.
- **Proposed:** REMOVE.
- **File:** `lib/alignment/enterprise-checklist.ts`
- **Migration priority:** P2

### 23. Enterprise Leader: lco_1
- **Current:** "We are building beyond short-term comfort and pressure."
- **Problem:** Aspirational platitude. Same issue as personal legacy_1.
- **Proposed:** REMOVE or merge into lco_3.
- **File:** `lib/alignment/enterprise-checklist.ts`
- **Migration priority:** P2

### 24. Team Leader: "produces visible progress"
- **Current:** "produces visible progress, not just activity."
- **Problem:** Productivity truism.
- **Proposed:** "has delivered at least one outcome this cycle that leadership can point to as evidence of movement."
- **File:** `pages/diagnostics/team-assessment.tsx` line 123
- **Migration priority:** P2

### 25. Executive Reporting: Headcount affected
- **Current:** "Under 20 / 20–100 / 100–500 / 500+"
- **Problem:** Generic headcount bands.
- **Proposed:** "How many people's daily work changes if this decision is made?"
- **File:** `pages/diagnostics/executive-reporting/run.tsx` line 1879
- **Migration priority:** P2

### 26. Team Post-Reflection: Confidence baseline
- **Current:** Slider
- **Problem:** Self-reported confidence produces no evidence.
- **Proposed:** REMOVE.
- **File:** `pages/diagnostics/team-assessment.tsx`
- **Migration priority:** P2

---

## P3 — LOW (Acceptable But Can Be Sharper)

### 27. Enterprise Leader: ec_3
- **Current:** "Information flow supports clarity more than noise."
- **Problem:** Standard org health language.
- **Proposed:** "The information people receive helps them decide. The information they lack is what blocks them."
- **File:** `lib/alignment/enterprise-checklist.ts`
- **Migration priority:** P3

### 28. Strategy Room: Prior Corrections placeholder
- **Current:** "What has already been tried and why it failed. Be specific about what was attempted."
- **Problem:** Good intent but help text does the heavy lifting.
- **Proposed:** "Name what was tried, when, and why it failed. 'We tried coaching' is not specific enough."
- **File:** `components/strategy-room/Form.tsx` line 658
- **Migration priority:** P3

### 29. Strategy Room: Capacity Note placeholder
- **Current:** "What is the organisation's actual capacity to absorb and implement a structured intervention right now?"
- **Problem:** Too consultative.
- **Proposed:** "If we started tomorrow, what would break or slow down? Who would resist?"
- **File:** `components/strategy-room/Form.tsx` line 738
- **Migration priority:** P3

### 30. Team Post-Reflection: priority correcting move
- **Current:** "What would you want your team to see as the priority correcting move?"
- **Problem:** Allows aspirational answer.
- **Proposed:** "Name the one action that, if your team saw it from you in the next 7 days, would change their perception."
- **File:** `pages/diagnostics/team-assessment.tsx`
- **Migration priority:** P3

---

## Migration Summary

| Priority | Count | Action |
|----------|-------|--------|
| P0 | 5 | Enterprise respondent full rebuild |
| P1 | 11 | Rewrite, remove, or augment |
| P2 | 10 | Rewrite, remove, or reorder |
| P3 | 4 | Sharpen placeholder text |
| **Total** | **30** | |

### Questions to REMOVE (7)
environment_3, behaviour_2, legacy_2, od_2, od_3, lco_1, confidence baseline slider

### Questions to REWRITE (18)
5 enterprise respondent, decision_2, environment_2, behaviour_3, legacy_1, emotional_order_3, q5, q9, mc_3, di_1, eco_2, direction_priority (respondent), "produces visible progress", headcount affected

### Questions to AUGMENT (1)
Strategy Room Stage 2 sliders (add text evidence fields)

### Questions to REORDER (1)
Executive Reporting (core questions before identity)

### Net Question Count Change
Current: ~118 user-facing input questions
After removals: ~111
After augments: ~115 (4 evidence text fields added to sliders)
**Net: -3 questions, dramatically higher evidence yield**
