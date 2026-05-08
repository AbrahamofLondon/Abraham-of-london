# Purpose Alignment Question Cleanup Audit

> Date: 2026-05-08
> File: `lib/alignment/checklist.ts`
> Scope: All 18 dual-axis signal questions + 3 context questions

---

## Context Questions (Unchanged)

| ID | Question | Classification | Reason |
|----|----------|---------------|--------|
| avoidedDecision | "What decision are you currently avoiding or deferring?" | PROTECT | Anchors entire assessment to a real decision |
| competingObligation | "What competing obligation or priority is pulling against that decision?" | PROTECT | Surfaces the hidden trade-off |
| consequence | "What becomes worse if this remains unresolved?" | PROTECT | Prices inaction at the personal level |

---

## Signal Questions — Final Status

### Domain: Identity & Mandate (3 questions — all PROTECTED)

| ID | Wording | Classification | Evidence | Emotional Pressure | Generic Risk |
|----|---------|---------------|----------|-------------------|-------------|
| identity_1 | "If someone asked me right now what my actual job is — not my title, but my real function — I could answer in under ten seconds." | PROTECT | Identity clarity vs confusion | High — 10-second test is visceral | None |
| identity_2 | "When I look at how I actually spent this week, I can see my mandate in it — not just my reactions." | PROTECT | Calendar-mandate alignment | High — evidence-anchored | None |
| identity_3 | "I am not following someone else's direction because I lack my own." | PROTECT | Authority dependency signal | High — names the specific failure | None |

### Domain: Decision Integrity (3 questions — 1 rewritten)

| ID | Wording | Classification | Evidence | Emotional Pressure | Generic Risk |
|----|---------|---------------|----------|-------------------|-------------|
| decision_1 | "The last decision I made under pressure — I can still explain why it was right, on principle, not just urgency." | PROTECT | Principled vs reactive decision-making | High | None |
| decision_2 | ~~"I am not making reactive choices under pressure."~~ → "The last time I acted under pressure, I chose deliberately — not because the situation cornered me." | REWRITE | Agency under pressure with temporal anchor | Medium → High | Was generic → Now specific |
| decision_3 | "I can explain why I am doing what I am doing — and the people closest to me would agree with that explanation." | PROTECT | External witness, narrative coherence | High | None |

**Scoring impact:** None. ID `decision_2` preserved. Domain `decision` unchanged. Polarity unchanged.

### Domain: Environmental Alignment (3 questions — 2 rewritten)

| ID | Wording | Classification | Evidence | Emotional Pressure | Generic Risk |
|----|---------|---------------|----------|-------------------|-------------|
| environment_1 | "The five people I spend the most time with are making me sharper, not softer." | PROTECT | Environmental quality signal | High — specific, memorable | None |
| environment_2 | ~~"I am not tolerating environments that produce confusion."~~ → "I have removed or restructured at least one source of recurring confusion in the past 90 days." | REWRITE | Action evidence with temporal anchor | Medium → High | Was vague → Now demands evidence of action |
| environment_3 | ~~"What I read, watch, and listen to is chosen deliberately — not just whatever shows up."~~ → "The environments I operate in were chosen — not inherited and never questioned." | REPLACE | Environmental agency signal | Was low → Medium | Was self-help → Now structural |

**Scoring impact:** None. IDs preserved. Domain unchanged.
**Why environment_3 was replaced rather than removed:** Removing would leave the domain with only 2 questions, weakening the signal. The replacement keeps 3 questions per domain while shifting from media consumption (low structural value) to environmental agency (high structural value).

### Domain: Operational Behaviour (3 questions — 2 rewritten)

| ID | Wording | Classification | Evidence | Emotional Pressure | Generic Risk |
|----|---------|---------------|----------|-------------------|-------------|
| behaviour_1 | "If I opened my calendar from the last two weeks, more than half the time served what I say matters long-term." | PROTECT | Calendar-as-evidence, strongest question in product | Maximum | None |
| behaviour_2 | ~~"My calendar reflects what I claim matters."~~ → "The last commitment I made to someone else — I kept it without reminder or renegotiation." | REPLACE | Commitment reliability signal | Was redundant → Now distinct | Was duplicate → Now unique angle |
| behaviour_3 | ~~"I am producing measurable outputs, not just activity."~~ → "In the last 30 days, I can name one output that moved the condition I say matters." | REWRITE | Execution evidence with temporal anchor | Medium → High | Was productivity cliche → Now specific |

**Scoring impact:** None. IDs preserved.
**Why behaviour_2 was replaced rather than removed:** The old question was a weaker duplicate of behaviour_1 (both about calendar/priorities). The replacement tests commitment reliability — a distinct behavioural signal that no other question covers.

### Domain: Emotional & Internal Order (3 questions — 1 rewritten)

| ID | Wording | Classification | Evidence | Emotional Pressure | Generic Risk |
|----|---------|---------------|----------|-------------------|-------------|
| emotional_order_1 | "When the pressure is real, I still think clearly — I do not collapse or numb out." | PROTECT | Cognitive function under pressure | High — names specific failure modes | None |
| emotional_order_2 | "I am not driven by fear, comparison, or validation." | PROTECT | Hidden driver detection | High — names the three drivers | None |
| emotional_order_3 | ~~"I recover quickly from disruption without losing direction."~~ → "After the last major disruption, my direction held — I did not start a new plan to avoid finishing the old one." | REWRITE | Disruption response pattern | Was generic → High | Was resilience truism → Now names avoidance pattern |

**Scoring impact:** None. ID preserved.

### Domain: Legacy Orientation (3 questions — 2 rewritten)

| ID | Wording | Classification | Evidence | Emotional Pressure | Generic Risk |
|----|---------|---------------|----------|-------------------|-------------|
| legacy_1 | ~~"I am building something that outlasts immediate comfort."~~ → "Something I have built in the past year would still matter if I stepped away from it." | REWRITE | Durable contribution evidence | Was aspirational → High | Was platitude → Now evidence-anchored |
| legacy_2 | ~~"My current actions contribute to a long-term structure."~~ → "I have made at least one decision this quarter that prioritised long-term structure over short-term comfort." | REWRITE | Trade-off evidence with temporal anchor | Was vague → High | Was vague → Now demands specificity |
| legacy_3 | "I am actively taking on harder things — not finding reasons to stay comfortable." | PROTECT | Comfort-seeking detection | High | None |

**Scoring impact:** None. IDs preserved.

---

## Summary

| Action | Count | Question IDs |
|--------|-------|-------------|
| PROTECT | 10 | identity_1, identity_2, identity_3, decision_1, decision_3, environment_1, behaviour_1, emotional_order_1, emotional_order_2, legacy_3 |
| REWRITE | 6 | decision_2, environment_2, behaviour_3, emotional_order_3, legacy_1, legacy_2 |
| REPLACE | 2 | environment_3, behaviour_2 |
| REMOVE | 0 | — |

**Total questions:** 18 (unchanged)
**Total IDs:** 18 (unchanged)
**Domains:** 6 × 3 = 18 (balanced, unchanged)
**Scoring contract:** Fully compatible — no IDs changed, no domains changed, no array structure changed
