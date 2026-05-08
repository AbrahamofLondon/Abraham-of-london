# Assessment Evidence Architecture Audit

**Date**: 2026-05-08  
**Scope**: Fast Diagnostic, Purpose Alignment, Constitutional Diagnostic, Team Assessment, Enterprise Assessment, Executive Reporting transition  
**Standard**: A question is only strong if it creates governed evidence that can be reused downstream for interpretation, escalation, correction, recurrence tracking, and outcome verification.

---

## Executive Summary

The product does **not** have a generic question problem.

It has an **evidence architecture consistency problem**.

Across the ladder, many questions are already unusually strong. They force decision, contradiction, authority, cost, pressure, and political reality into view. That is rare. That is valuable. That is part of the product’s commercial edge.

But the ladder still has an uneven pattern:

- some surfaces capture sharp present-state signal
- some surfaces capture real contradiction
- some surfaces capture route-worthy consequence
- very few surfaces consistently capture prior attempts, failure causes, recurrence logic, and verification proof

So the right conclusion is not:

> the questions are fine

And it is not:

> rewrite everything

It is this:

**The questioning system is strategically strong, but it does not yet consistently capture the governed evidence required to support the product’s strongest claims across every assessment layer.**

That is the actual diagnosis.

---

## Main Verdict

### What is strong

The ladder already does four things better than most diagnostic products:

1. It starts with a real decision, not a mood state.
2. It repeatedly forces claim against reality.
3. It uses institutional language that sounds field-tested rather than workshop-generated.
4. It already routes evidence forward into higher-order surfaces.

### What is missing

The ladder does **not yet consistently require** the four evidence anchors that turn a sharp diagnostic into a governed decision institution:

1. **History**
   What has already been tried?

2. **Failure Cause**
   Why did the prior attempt fail in practice?

3. **Recurrence**
   Is this new, repeating, cyclical, or chronic?

4. **Verification**
   What evidence will prove improvement, correction, or execution?

### Strategic implication

The next pass should be a **Ladder-Wide Assessment Evidence Architecture Pass**.

Not more questions.  
Not prettier questions.  
Not a rewrite-all pass.

Sharper evidence capture. Better sequencing. Explicit downstream use.

---

## Method

This report is based on the live source in the repo, not only earlier audit documents.

Important note:

Some earlier product audit docs are now partially outdated relative to the current code. For example, the live Constitutional Diagnostic source uses:

- q5: "When someone raises a serious objection here, the objection is tested against the decision — not against the person."  
  Source: [constitutional-diagnostic-derivation.ts](/abs/path/C:/aol-check-visual/lib/diagnostics/constitutional-diagnostic-derivation.ts:123)
- q9: "The same problems keep resurfacing despite repeated attempts to fix them."  
  Source: [constitutional-diagnostic-derivation.ts](/abs/path/C:/aol-check-visual/lib/diagnostics/constitutional-diagnostic-derivation.ts:145)

That is materially different from some older written audits, so this report follows the current source.

---

## Audit Standard

Each assessment is judged on five questions:

1. Does it produce sharp present-state signal?
2. Does it capture contradiction rather than self-description?
3. Does it create evidence useful for downstream routing and interpretation?
4. Does it capture prior-attempt, failure-cause, recurrence, and verification evidence?
5. Does it strengthen the product’s authority as a category-defining instrument?

---

## Ladder Coverage

| Assessment | Present-State Signal | Contradiction Capture | Downstream Use | History / Failure / Recurrence / Verification | Verdict |
|---|---|---:|---:|---:|---|
| Fast Diagnostic | High | Moderate | High | Low | Strong opener, under-specified evidence memory |
| Purpose Alignment | High | High | Moderate | Low | Strong personal diagnostic, incomplete governed evidence |
| Constitutional Diagnostic | High | High | High | Moderate | Strongest institutional framing, still missing verification |
| Team Assessment | High | High | High | Low | Excellent divergence mapping, weak institutional memory |
| Enterprise Assessment | High | High | High | Low | Premium reading surface, incomplete evidence continuity |
| Executive Reporting transition | N/A | N/A | High | Depends on upstream capture | Strong consequence layer, only as good as prior evidence |

---

## 1. Fast Diagnostic

### What it is doing right

The Fast Diagnostic is the best opening surface in the ladder because it starts with the real unit of value: a decision.

Current prompts:

- "What decision has been sitting unresolved longer than it should?"  
  Source: [fast.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/fast.tsx:51)
- "Who can actually make this decision binding?"  
  Source: [fast.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/fast.tsx:58)
- "What becomes more expensive if this stays unresolved?"  
  Source: [fast.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/fast.tsx:65)

Microcopy strength:

- "`Everyone` is not an answer."  
  Source: [fast.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/fast.tsx:60)
- "If nothing changes, something worsens. Name it."  
  Source: [fast.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/fast.tsx:67)

This is strong because it creates:

- named decision
- authority pressure
- consequence pressure

That is enough to separate this from generic intake.

### Where it is incomplete

The Fast Diagnostic is excellent at **naming the live case**.

It is weak at **capturing case memory**.

It still does not force:

- what was already tried
- why that did not work
- whether this has happened before
- what evidence would prove resolution

That means it is a strong ignition surface, but not yet a governed evidence gate.

### Verdict

Do not rewrite the Fast Diagnostic.

Add two light but high-leverage anchors after the current three questions:

1. **History**
   "What have you already tried that did not change this?"

2. **Verification**
   "What would prove this issue is actually resolved?"

That would make the entry surface materially stronger without turning it into a long form.

---

## 2. Purpose Alignment

### What it is doing right

Purpose Alignment is structurally strong because it combines:

- a live decision context
- contradiction and pressure framing
- signal questions that repeatedly force mandate, behaviour, environment, and internal order against reality

Context prompts:

- "What decision are you currently avoiding or deferring?"  
  Source: [PurposeAlignmentAssessment.tsx](/abs/path/C:/aol-check-visual/lib/alignment/PurposeAlignmentAssessment.tsx:64)
- "What competing obligation or priority is pulling against that decision?"  
  Source: [PurposeAlignmentAssessment.tsx](/abs/path/C:/aol-check-visual/lib/alignment/PurposeAlignmentAssessment.tsx:71)
- "What becomes worse if this remains unresolved?"  
  Source: [PurposeAlignmentAssessment.tsx](/abs/path/C:/aol-check-visual/lib/alignment/PurposeAlignmentAssessment.tsx:78)

The current signal bank is also materially better than older audit notes implied. Several questions have already been improved with temporal and behavioural anchors:

- environment_2: "I have removed or restructured at least one source of recurring confusion in the past 90 days."  
  Source: [checklist.ts](/abs/path/C:/aol-check-visual/lib/alignment/checklist.ts:35)
- behaviour_2: "The last commitment I made to someone else — I kept it without reminder or renegotiation."  
  Source: [checklist.ts](/abs/path/C:/aol-check-visual/lib/alignment/checklist.ts:39)
- behaviour_3: "In the last 30 days, I can name one output that moved the condition I say matters."  
  Source: [checklist.ts](/abs/path/C:/aol-check-visual/lib/alignment/checklist.ts:40)
- emotional_order_3: "After the last major disruption, my direction held — I did not start a new plan to avoid finishing the old one."  
  Source: [checklist.ts](/abs/path/C:/aol-check-visual/lib/alignment/checklist.ts:44)
- legacy_2: "I have made at least one decision this quarter that prioritised long-term structure over short-term comfort."  
  Source: [checklist.ts](/abs/path/C:/aol-check-visual/lib/alignment/checklist.ts:47)

That is important. It means this layer has already moved closer to evidence-bearing language.

### What remains incomplete

Purpose Alignment is now much better at behavioural evidence than before, but it is still missing governed case memory.

It still does not reliably ask:

- what was already tried regarding the avoided decision
- which prior moves failed
- whether the user repeats this same pattern across roles, quarters, or relationships
- what evidence would prove the avoided decision has actually been resolved

That is the difference between:

- a clever personal reading
- a personal decision system with memory

### Verdict

Protect the improved signal bank.

Do not run another wholesale rewrite pass.

Add two context-level anchors:

1. **Prior-attempt / failure**
   "What have you already done about this that did not work, and why did it fail?"

2. **Verification**
   "What specific evidence would prove this decision is no longer being deferred?"

Optional high-value recurrence anchor:

- "Where has this same avoidance pattern shown up before?"

That would turn Purpose Alignment from a sharp reflection tool into a stronger decision-memory layer.

---

## 3. Constitutional Diagnostic

### What it is doing right

This remains the tightest institutional instrument in the ladder.

Current live questions include:

- "The stated strategy and actual resource allocation are meaningfully aligned."  
  Source: [constitutional-diagnostic-derivation.ts](/abs/path/C:/aol-check-visual/lib/diagnostics/constitutional-diagnostic-derivation.ts:102)
- "Decision authority is clear and exercised without chronic diffusion or bottleneck."  
  Source: [constitutional-diagnostic-derivation.ts](/abs/path/C:/aol-check-visual/lib/diagnostics/constitutional-diagnostic-derivation.ts:107)
- "There is a pattern of strategic drift — direction stated but not executed with discipline."  
  Source: [constitutional-diagnostic-derivation.ts](/abs/path/C:/aol-check-visual/lib/diagnostics/constitutional-diagnostic-derivation.ts:118)
- "When someone raises a serious objection here, the objection is tested against the decision — not against the person."  
  Source: [constitutional-diagnostic-derivation.ts](/abs/path/C:/aol-check-visual/lib/diagnostics/constitutional-diagnostic-derivation.ts:123)
- "The organisation carries visible friction: coordination failures, duplicated work, or unresolved conflict."  
  Source: [constitutional-diagnostic-derivation.ts](/abs/path/C:/aol-check-visual/lib/diagnostics/constitutional-diagnostic-derivation.ts:129)
- "The same problems keep resurfacing despite repeated attempts to fix them."  
  Source: [constitutional-diagnostic-derivation.ts](/abs/path/C:/aol-check-visual/lib/diagnostics/constitutional-diagnostic-derivation.ts:145)
- "External market or stakeholder pressure is actively forcing attention to this issue."  
  Source: [constitutional-diagnostic-derivation.ts](/abs/path/C:/aol-check-visual/lib/diagnostics/constitutional-diagnostic-derivation.ts:151)

This layer is strong because it captures:

- coherence
- authority
- friction
- objection culture
- recurrence
- pressure

That is already serious institutional language.

### What remains incomplete

This layer does better than the rest at recurrence and failure pattern.

But it still has a missing verification gap.

It can establish:

- the problem is recurring
- the organisation is drifting
- authority and pressure are misordered

It still does not force:

- what evidence would prove the intervention worked
- what review point would mark the organisation as back inside governed bounds

That matters because the Constitutional Diagnostic is where structural claims start to harden.

If verification is absent here, later layers inherit strong diagnosis but weak proof logic.

### Verdict

This is the strongest assessment layer in the product and should be treated as protected.

Add one downstream verification anchor:

- "What evidence, inside the next operating cycle, would prove this condition has materially improved?"

That is enough. No broader rewrite needed.

---

## 4. Team Assessment

### What it is doing right

The Team Assessment is one of the product’s most commercially valuable instruments because it measures **perception divergence**, not just condition.

The structural architecture is excellent:

- leadership frame: "From my position, the team..."  
  Source: [team-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/team-assessment.tsx:109)
- team-reality frame: "Team members would say they..."  
  Source: [team-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/team-assessment.tsx:110)

Strong prompts include:

- "can state the current priority set with genuine consistency."  
  Source: [team-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/team-assessment.tsx:112)
- "moves work with clear ownership rather than diffusion of accountability."  
  Source: [team-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/team-assessment.tsx:121)
- "surfaces important tensions without avoidance or political calculation."  
  Source: [team-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/team-assessment.tsx:130)
- "escalates at the correct level and correct speed."  
  Source: [team-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/team-assessment.tsx:139)

This is not a morale tracker.

It is an execution divergence instrument.

That is brand-asset territory.

### What remains incomplete

The Team Assessment is excellent at telling you:

- leadership’s reading
- estimated operating-layer reality
- where the biggest gap sits
- whether fragility is rising

It is weaker at telling you:

- what interventions have already been attempted
- whether the same team failure pattern keeps repeating
- whether the root cause is authority, trust, sequencing, or political avoidance
- what evidence would prove the gap is narrowing

There is already a free-text adaptive layer:

- "These questions ground the team reading in your specific case."  
  Source: [team-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/team-assessment.tsx:1290)

That is the correct insertion point.

### Verdict

Do not rewrite the core question set.

Add four required evidence anchors, triggered when:

- gap severity is high
- fragility is volatile or fractured
- trust or authority is the weakest domain

Required anchors:

1. **Prior attempt**
   "What has already been tried to correct this team condition?"

2. **Failure cause**
   "Why did that attempt fail in practice?"

3. **Recurrence**
   "Has this same pattern appeared before under a different project, leader, or operating cycle?"

4. **Verification**
   "What observable evidence would prove this team condition improved within 30-60 days?"

This is the single highest-leverage improvement for the Team layer.

---

## 5. Enterprise Assessment

### What it is doing right

The Enterprise Assessment already feels like an institutional-grade reading surface.

Its four blocks are strong:

- Leadership Coherence
- Governance Reliability
- Execution Variance
- Institutional Risk Posture

Current prompts worth protecting include:

- "Critical leadership disagreements are surfaced rather than buried."  
  Source: [enterprise-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/enterprise-assessment.tsx:124)
- "Decision rights are clear enough to reduce drag and duplication."  
  Source: [enterprise-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/enterprise-assessment.tsx:132)
- "Operational signals are trustworthy enough for leadership to act on them."  
  Source: [enterprise-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/enterprise-assessment.tsx:140)
- "Current delay does not materially increase strategic cost."  
  Source: [enterprise-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/enterprise-assessment.tsx:147)
- "Corrective action can still be taken without disproportionate political resistance."  
  Source: [enterprise-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/enterprise-assessment.tsx:148)

It also includes a concrete grounding field:

- "Most important decision in the last 90 days"  
  Source: [enterprise-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/enterprise-assessment.tsx:1155)

And the result engine is already structurally strong:

- `patternTitle`
- `primaryReading`
- escalation `route`

Source cluster: [enterprise-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/enterprise-assessment.tsx:251)

This is premium-grade positioning material.

### What remains incomplete

The Enterprise layer is excellent at **present institutional condition**.

It is weaker at **institutional memory and proof continuity**.

It still does not consistently force:

- what the institution has already tried
- why those efforts failed
- whether the same pattern is recurring across cycles, leaders, or conditions
- what review-cycle evidence would prove real correction

There is already an adaptive insertion point:

- "These questions test whether the current decision pattern is institutional rather than local."  
  Source: [enterprise-assessment.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/enterprise-assessment.tsx:1294)

That should now be used more aggressively.

### Verdict

Do not soften or rewrite the core Enterprise questions.

Use the adaptive layer to require:

1. **History**
   "What has already been attempted to correct this condition in the last 12 months?"

2. **Failure pattern**
   "Why did those efforts fail: executive disagreement, weak governance, local non-adoption, political resistance, or misread risk?"

3. **Recurrence**
   "Has this same condition appeared before under different market pressure, leadership, or board context?"

4. **Verification**
   "What evidence in the next review cycle would prove the institution is actually moving out of this condition?"

This is the core enterprise evidence-continuity gap.

---

## 6. Executive Reporting Transition

### What it is doing right

Executive Reporting is not primarily a question surface.

It is the ladder’s **consequence interpretation layer**:

- "Executive Reporting is the consequence interpretation layer in the Abraham of London diagnostic ladder."  
  Source: [executive-reporting.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/executive-reporting.tsx:132)
- "The diagnostic ladder accumulates structural evidence. Executive Reporting translates that evidence into consequence: financial exposure, institutional constraint, and the priority decisions that follow."  
  Source: [executive-reporting.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/executive-reporting.tsx:363)
- "The system combined the decision you surfaced, the constraint that has preserved it, and the consequence attached to delay. Executive Reporting exists because that evidence now points to a structural issue rather than a local execution miss."  
  Source: [executive-reporting.tsx](/abs/path/C:/aol-check-visual/pages/diagnostics/executive-reporting.tsx:335)

This is strong product logic.

It means the ladder is already positioned as cumulative, not isolated.

### What remains incomplete

Executive Reporting can only be as good as the evidence inherited from upstream.

If upstream layers do not consistently capture:

- prior attempt
- failure cause
- recurrence
- verification proof

then Executive Reporting has to interpret consequence from incomplete institutional memory.

In other words:

Executive Reporting is not the problem.

It is the place where upstream evidence gaps become most expensive.

### Verdict

No structural rewrite needed here.

The correct move is to strengthen upstream evidence capture so Executive Reporting receives governed input, not only sharp diagnosis.

---

## Strong Questions To Protect

These are category-defining questions or structures. They should be treated as protected assets.

### Fast Diagnostic

- unresolved decision
- actual binding authority
- escalating cost of delay

### Purpose Alignment

- competing obligation
- calendar against long-term claim
- commitment kept without reminder
- decision under pressure on principle, not urgency

### Constitutional Diagnostic

- strategy vs resource allocation
- authority without chronic diffusion
- objection tested against decision, not person
- repeated resurfacing despite repeated fixes

### Team Assessment

- leader reading vs team-reality mirror
- clear ownership vs diffusion
- tensions surfaced without political calculation
- escalation at correct level and speed

### Enterprise Assessment

- surfaced vs buried leadership disagreement
- trustworthy enough to act on
- cost of delay
- political resistance

These are not just good questions.

They are **brand signatures**.

---

## Ladder-Wide Gaps

### 1. Verification is still underbuilt

This is the biggest global gap.

The product has downstream verification concepts, but the ladder still under-asks:

- what evidence proves success
- by when
- at what review point
- by which signal

Without that, the product can sound more governed than its intake actually is.

### 2. History capture is inconsistent

Some layers imply prior attempts. Very few force them.

That creates a risk of generating recommendations that unknowingly repeat failed moves.

### 3. Failure-cause capture is not systematic

The ladder often detects that something is wrong.

It less consistently captures whether prior failure was due to:

- unclear authority
- governance weakness
- poor sequencing
- operating-layer non-adoption
- political avoidance
- low-quality verification

### 4. Recurrence logic is strongest in Constitutional, weaker elsewhere

The ladder needs recurrence as a system property, not a single-layer feature.

Otherwise chronic patterns look like isolated cases.

---

## Recommended Pass

Run a **Ladder-Wide Assessment Evidence Architecture Pass** with six rules:

1. Preserve all high-yield questions and structures.
2. Do not run a rewrite-all-questions pass.
3. Add required evidence anchors for history, failure cause, recurrence, and verification.
4. Trigger those anchors adaptively at severity thresholds rather than everywhere.
5. Ensure every new answer feeds a named downstream surface.
6. Update product language to claim governed evidence continuity, not just diagnostic sharpness.

---

## Required Downstream Surfaces

Every assessment answer should feed one or more of these:

- result narrative
- admission / escalation logic
- Executive Reporting
- Return Brief
- Oversight Brief
- decision credit
- recurrence log
- outcome verification

If a question does not feed a downstream governed surface, it is at risk of becoming ornamental.

That should now be the standard.

---

## Commercial Implication

If this pass is done correctly, the ladder becomes harder to compete with for three reasons.

### 1. It sounds like real authority

Most products ask for sentiment.  
This one asks for contradiction, authority, cost, recurrence, political resistance, and proof.

### 2. It creates institutional memory

Most assessments generate a score and forget the case.  
This ladder can become a system that remembers:

- what was tried
- why it failed
- whether it is recurring
- what proof threshold now governs the next move

### 3. It strengthens premium conversion

Executive Reporting, Return Brief, and Oversight Brief all become more valuable when they inherit not just sharp diagnosis, but structured evidence continuity.

That is where the moat gets built.

---

## Final Strategic Conclusion

The product’s weakness is not mainly poor question wording.

The weakness is that the questioning system does not yet consistently capture verification, prior attempts, failure causes, and recurrence evidence across every assessment layer.

So the next instruction should be:

**Strengthen each assessment only where the audit found missing evidence capture, while preserving all high-yield questions and all authority-bearing language.**

Not more questions.  
Not softer questions.  
Not prettier questions.

Sharper evidence capture. Better sequencing. Clear downstream use. Institutional memory.

That is the pass that turns the assessment ladder from a strong diagnostic product into a category-defining governed decision system.
