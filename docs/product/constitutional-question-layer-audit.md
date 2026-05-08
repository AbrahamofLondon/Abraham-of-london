# Constitutional Question Layer Audit — Current State + Deep Dive

> Date: 2026-05-08
> Status: AUDIT ONLY — no implementation without explicit authorisation
> Scope: Every Constitutional question, its scoring pipeline, downstream consumers, missing signals, and breakage risk

---

## PART 1 — CURRENT STATE

### The 10 Questions (as implemented)

**File:** `lib/diagnostics/constitutional-diagnostic-derivation.ts` (lines 99-154)
**Input:** Dual-axis (resonance 0-10 + certainty 0-10) per question
**Rendering:** `components/diagnostics/ConstitutionalDiagnostic.tsx` — renders dynamically from `DEFAULT_DIAGNOSTIC_QUESTIONS`

| ID | Wording | Domain | Reverse | Status |
|----|---------|--------|---------|--------|
| q1 | "The stated strategy and actual resource allocation are meaningfully aligned." | coherence | No | PROTECT |
| q2 | "Decision authority is clear and exercised without chronic diffusion or bottleneck." | authority | No | PROTECT |
| q3 | "The operating environment has changed faster than the organisation's ability to adapt." | environment | Yes | PROTECT |
| q4 | "There is a pattern of strategic drift — direction stated but not executed with discipline." | execution | Yes | PROTECT |
| q5 | "When someone raises a serious objection here, the objection is tested against the decision — not against the person." | trust | No | PROTECT (rewritten) |
| q6 | "The organisation carries visible friction: coordination failures, duplicated work, or unresolved conflict." | friction | Yes | PROTECT |
| q7 | "There is a clear decision-maker who can authorise strategic intervention." | authority | No | PROTECT |
| q8 | "The cost of getting this wrong would be material — financial, reputational, or structural." | stakes | No | PROTECT |
| q9 | "The same problems keep resurfacing despite repeated attempts to fix them." | pattern | Yes | PROTECT (rewritten) |
| q10 | "External market or stakeholder pressure is actively forcing attention to this issue." | pressure | No | PROTECT |

### Scoring Pipeline

**Per-question:** `base = reverse ? 10 - resonance : resonance`, then `base * (0.45 + certainty/18)`

**Domain aggregation:**
- `authorityScore` = percentFromLikert(average(q2, q7))
- `coherenceScore` = percentFromLikert(average(q1)) — **SOLE QUESTION**
- `trustScore` = percentFromLikert(average(q5)) — **SOLE QUESTION**
- `pressureScore` = percentFromLikert(average(q3, q8, q10))
- `frictionScore` = percentFromLikert(average(q4, q6, q9))

**Composite scores:**
- `seriousnessScore` = 0.9 * average(authority, pressure, friction)
- `governanceDiscipline` = average(authority, coherence, trust)
- `narrativeCoherence` = average(coherence, trust, authority)
- `interventionReadiness` = average(authority, coherence, trust, 100-friction)
- `failureModeCount` = count of thresholds breached
- `failureModeSeverity` = clamped failure margin average (0-10)

**Classifications:**
- Authority Type: DIRECT (>=70) / PROXY (>=45) / UNCLEAR
- Posture: ORDERED / DRIFTING / MISALIGNED / DISORDERED
- Readiness Tier: FRAGILE / EMERGING / STABILIZING / EXECUTION_READY / SOVEREIGN

**Routing:** REJECT / DIAGNOSTIC / STRATEGY — hard gates on clarity, authority, failure modes, posture

### Critical Structural Observations

**1. Single-question domains are a concentration risk.**
- `coherenceScore` depends entirely on q1. If a user misunderstands q1, the entire coherence reading is wrong. There is no second signal to stabilise it.
- `trustScore` depends entirely on q5. Same risk.
- `authorityScore`, `pressureScore`, and `frictionScore` each aggregate 2-3 questions — more stable.

**2. q8 tests cost of error, not cost of inaction.**
"The cost of getting this wrong would be material" asks about the consequence of acting badly, not the consequence of doing nothing. These are different signals. The system has `costOfDelayText` infrastructure in the evidence graph but Constitutional routing is blind to it.

**3. The bridge is score-based, not evidence-based.**
`constitutional-bridge.ts` transmits numeric scores to team/executive/strategy seeds. It does not transmit what the user actually said, what they revealed about authority, or what specific friction they described. Downstream stages receive numbers, not context.

**4. Routing is permissive about content, restrictive about structure.**
The routing engine will escalate a well-scored but vacuous assessment to Strategy if authority and coherence scores are high. It does not verify that the user has identified a specific decision, named a real constraint, or acknowledged what has been tried.

---

## PART 2 — DOWNSTREAM CONSUMER MAP

### Who uses Constitutional output?

| Consumer | File | What It Uses | What Would Break |
|----------|------|-------------|-----------------|
| Constitutional Diagnostic UI | `components/diagnostics/ConstitutionalDiagnostic.tsx` | Question text, scores, route, posture, readiness, findings | Question text via `.text` property (auto-reflects changes) |
| Constitutional Narrative Block | `components/decision/ConstitutionalNarrativeBlock.tsx` | Route, posture, readiness, authority, scores | Score variable names, route enum values |
| Strategy Room Result Surface | `components/strategy-room/ConstitutionalResultSurface.tsx` | authorityScore, coherenceScore, pressureScore, seriousnessScore, readiness | Score variable names |
| Strategy Room Followup Panel | `components/strategy-room/ConstitutionalFollowupPanel.tsx` | Route decision, AuthorityType, ReadinessTier | Route enum, tier enum |
| Constitutional Bridge | `lib/diagnostics/constitutional-bridge.ts` | All scores, posture, readiness, authority | Score thresholds (trustScore < 50, frictionScore >= 60, etc.) |
| Routing Rules | `lib/constitution/rules.ts` | clarityScore (=coherence), authorityType, readinessTier, seriousnessScore, governanceDiscipline, failureModeCount | All thresholds and gates |
| Orchestrator | `lib/engine/orchestrator.ts` | Micro report, hidden signals, weighted scores | Score variable names |
| Weighting Service | `lib/engine/weighting.service.ts` | trustScore, narrativeCoherence, interventionReadiness, seriousnessScore | Score variable names |
| Signal Service | `lib/engine/signal.service.ts` | authorityScore, coherenceScore, trustScore | Score variable names |
| Narrative Engine | `lib/diagnostics/narrative-engine.ts` | Tension signals with domain labels | Domain name strings |
| Narrative Variants | `lib/engine/narrative-variants.ts` | Route (STRATEGY/DIAGNOSTIC/REJECT), posture | Route enum, posture enum |
| Authority Enforcement | `lib/diagnostics/authority-enforcement.ts` | Tension thread escalation level | Thread escalation enum |
| Tension Thread | `lib/diagnostics/tension-thread.ts` | Domain names, severity levels | Domain name strings |
| Thread Engine | `lib/diagnostics/thread-engine.ts` | Signal dedup, escalation determination | Signal name pattern |
| API Persistence | `pages/api/diagnostics/constitutional-intake/report.ts` | Full report, decision, route, posture, readiness, authority, seriousness | DB column names |
| AI Prompt | `lib/ai/prompts.ts` | References "9 domains" by name | Domain name strings |

### Breakage Risk Matrix

| Change Type | Risk | Files Affected | Notes |
|------------|------|----------------|-------|
| Reword a question (keep ID + domain) | **LOW** | 0 code files | Text auto-reflects. Scoring unchanged. |
| Remove a question | **HIGH** | 5+ files | Completion %, domain score calculation, answer count gates |
| Add a question | **MEDIUM** | 3-5 files | Completion % recalc, minimum answer gate may need adjustment |
| Move question to different domain | **CRITICAL** | 8-12 files | All derivation cascades. Single-question domains would break. |
| Rename a domain | **HIGH** | 10+ files | buildDomainMap, bridge prompts, narrative labels, AI prompts |
| Change route enum | **CRITICAL** | 10-15 files | Every switch statement on route |
| Change score threshold | **MEDIUM** | 1-2 files | Routing gates shift but logic intact |

---

## PART 3 — MISSING SIGNAL ANALYSIS

### Signal Coverage Assessment

| # | Signal | Captured in Constitutional? | Captured in Prior Stage? | Bridged Forward? | Verdict |
|---|--------|----------------------------|-------------------------|------------------|---------|
| 1 | What has already been tried? | No | Yes (CanonicalDecisionObject.priorAttemptText) | No | GAP — exists but not bridged |
| 2 | Why did prior correction fail? | No | Partial (recursive_failure tension signal) | No | GAP — detected but not explained |
| 3 | Has this pattern happened before? | Yes (q9) | Yes (pattern_recurrence engine) | Yes (via frictionScore) | CAPTURED but incomplete — asks IF, not HOW MANY or WHY |
| 4 | Who has authority to change it? | Yes (q2 + q7) | Yes | Yes (via authorityScore) | STRONGLY CAPTURED — hard gate in routing |
| 5 | What evidence would prove improvement? | No | No | No | MISSING ENTIRELY |
| 6 | What happens if nothing changes? | No (q8 tests cost of error, not inaction) | Yes (costOfDelayText in evidence graph) | No | GAP — infrastructure exists, not bridged |
| 7 | What is being avoided? | No | Yes (Purpose Alignment avoidedDecision) | No | GAP — captured upstream, not surfaced |
| 8 | What must stop? | No | No | No | MISSING ENTIRELY |
| 9 | What must be decided now? | No | Partial (CanonicalDecisionObject) | No | MISSING — Constitutional never asks for a specific decision |

### Summary
- **Directly captured:** 3 signals (authority, pattern recurrence, cost-of-error)
- **Exists upstream but not bridged:** 3 signals (prior attempts, avoidance, cost of inaction)
- **Missing entirely:** 3 signals (success evidence, what must stop, immediate decision)

---

## PART 4 — QUESTION-BY-QUESTION QUALITY ASSESSMENT

### Scoring Rubric (each dimension 1-10)
1. Specificity — can the user answer concretely?
2. Evidence yield — does the answer produce usable diagnostic signal?
3. Emotional pressure — does it create useful discomfort?
4. Authority signal — does it test decision authority?
5. Contradiction signal — can it expose conflicting truths?
6. Recurrence signal — does it test whether this has happened before?
7. Governance value — does it feed posture/readiness/discipline?
8. Route-decision value — does it affect REJECT/DIAGNOSTIC/STRATEGY?
9. Downstream usefulness — does it improve Strategy Room, ER, Return Brief?
10. Resistance to generic interpretation — would a competitor ask this?

| ID | Spec | Evid | Emot | Auth | Contr | Recur | Gov | Route | Down | NonGen | **Total** |
|----|:----:|:----:|:----:|:----:|:-----:|:-----:|:---:|:-----:|:----:|:------:|:---------:|
| q1 | 9 | 10 | 9 | 8 | 10 | 6 | 10 | 10 | 10 | 9 | **91** |
| q2 | 9 | 10 | 9 | 10 | 8 | 6 | 10 | 10 | 10 | 10 | **92** |
| q3 | 8 | 9 | 8 | 6 | 8 | 7 | 9 | 9 | 8 | 8 | **80** |
| q4 | 9 | 10 | 9 | 7 | 10 | 8 | 10 | 9 | 9 | 10 | **91** |
| q5 | 10 | 9 | 10 | 7 | 9 | 6 | 10 | 9 | 9 | 10 | **89** |
| q6 | 9 | 9 | 8 | 6 | 8 | 7 | 9 | 9 | 8 | 8 | **81** |
| q7 | 10 | 9 | 9 | 10 | 7 | 6 | 10 | 10 | 10 | 9 | **90** |
| q8 | 9 | 8 | 9 | 6 | 7 | 6 | 8 | 9 | 9 | 8 | **79** |
| q9 | 9 | 9 | 8 | 6 | 8 | 10 | 9 | 9 | 9 | 8 | **85** |
| q10 | 8 | 8 | 7 | 5 | 7 | 6 | 8 | 8 | 7 | 7 | **71** |

**Average: 84.9/100**

### Tier Classification

| Tier | Questions | Assessment |
|------|-----------|------------|
| Elite (90+) | q1, q2, q4, q7 | Category-defining. Do not touch. |
| Strong (85-89) | q5, q9 | Rewrites are sound. Earned their place. |
| Adequate (80-84) | q3, q6 | Functional but not distinctive. Could be sharper. |
| Weakest (< 80) | q8, q10 | Not weak enough to rebuild, but underperform relative to the rest. |

---

## PART 5 — DETAILED FINDINGS

### q8 underperformance analysis (score 79)

**Current:** "The cost of getting this wrong would be material — financial, reputational, or structural."

**Problem:** Tests cost of error, not cost of inaction. These are distinct:
- Cost of error = "if we intervene badly, what do we lose?"
- Cost of inaction = "if we do nothing, what deteriorates?"

Constitutional routing treats these as equivalent via `pressureScore`, but they produce different decision signals. A user may rate q8 high ("yes, getting this wrong is costly") while simultaneously believing the cost of doing nothing is low ("it's not urgent"). The system cannot distinguish these states.

**Not recommended for rewrite in this pass:** The question is not wrong — it does produce a valid stakes signal. But the gap it leaves (cost of inaction) should be addressed through bridging, not by overloading q8.

### q10 underperformance analysis (score 71)

**Current:** "External market or stakeholder pressure is actively forcing attention to this issue."

**Problem:** This is the least confrontational question in the set. It tests external urgency but:
- Authority signal: 5/10 — does not test who holds authority, only that pressure exists
- Contradiction signal: 7/10 — limited contradiction potential
- Emotional pressure: 7/10 — factual, not confrontational
- Resistance to generic: 7/10 — any strategy survey asks about external pressure

**Why it stays despite lowest score:** It is the only question testing external pressure, which feeds `pressureScore` alongside q3 and q8. Without q10, `pressureScore` loses its external dimension entirely.

**Recommended improvement (future pass, not this one):**
Replace with: "External pressure is now more expensive to ignore than to address."
- Same domain (pressure), same polarity (forward-scored)
- Forces the user to price the cost of ignoring pressure, not just acknowledge its existence
- Increases emotional pressure and consequence signal

### Single-question domain risk

**q1 (sole coherence question):** If a user misunderstands q1, the entire coherence reading is wrong. `coherenceScore` feeds `clarityScore` in routing — Gate 2 rejects if clarity < 20, Gate 6 requires clarity >= 65 for Strategy. A single confused response can block or enable Strategy incorrectly.

**Mitigation options (ranked):**
1. Add a second coherence question (e.g., "The decisions being made this month are consistent with the direction stated six months ago")
2. Apply a floor/ceiling clamp to single-question domains to reduce outlier impact
3. Accept the risk — q1 is well-worded and produces reliable responses

**Recommendation:** Option 1 is safest but adds to assessment length. Option 3 is acceptable given q1's quality (91/100). This is a known risk, not an urgent fix.

**q5 (sole trust question):** Same structural risk. Mitigated by the quality of the rewrite (89/100) — the question is specific and answerable, reducing misinterpretation probability.

---

## PART 6 — BRIDGE GAP ANALYSIS

### What the bridge transmits (scores only)

The bridge (`lib/diagnostics/constitutional-bridge.ts`) sends to downstream stages:
- Numeric scores: authorityScore, coherenceScore, pressureScore, frictionScore, trustScore
- Classifications: posture, readinessTier, authorityType, seriousnessScore
- Conditional prompts: e.g., "Where has trust between leadership and execution weakened?" (triggered by trustScore < 50)
- Hypotheses: authority divergence, strategic misalignment, operational drag, trust erosion

### What the bridge does NOT transmit

- What the user actually said about their situation
- Whether they acknowledged prior failed corrections
- What specific friction they described
- Whether external pressure is market-driven, regulatory, or stakeholder-driven
- Their avoided decision (captured in Purpose Alignment, never surfaced)
- Their cost of delay (captured in Fast Diagnostic/ER, never bridged)
- Whether they have a specific decision to make or are exploring

### Consequence

Downstream stages (Team Assessment, Executive Reporting, Strategy Room) receive: "authority is 72%, trust is 45%, friction is 65%." They do not receive: "This person's organisation has a clear CEO who can decide, but trust has broken because objections are punished, and the same coordination failures keep returning despite two reorganisations."

The bridge transmits the diagnosis. It does not transmit the evidence.

---

## PART 7 — REPLACEMENT BLUEPRINT (Audit Only — Not For Implementation)

### Questions to protect (implement nothing)
q1, q2, q3, q4, q5, q6, q7, q9 — all earn their place

### Questions that could be strengthened (future pass)

| ID | Current Issue | Possible Direction | Risk | Priority |
|----|-------------|-------------------|------|----------|
| q8 | Tests cost of error, not cost of inaction | Add cost-of-inaction bridge from prior stages OR add q8b | Medium — adds question count | P2 |
| q10 | Least confrontational, weakest differentiation | "External pressure is now more expensive to ignore than to address" | Low — same domain/polarity | P3 |

### Missing signals that could be addressed without new questions

| Signal | Solution | Implementation |
|--------|----------|---------------|
| Prior attempts | Bridge `priorAttemptText` from CanonicalDecisionObject to Constitutional output | Bridge code change, no question change |
| Cost of inaction | Bridge `costOfDelayText` from evidence graph to Constitutional routing | Bridge code change, no question change |
| Avoidance | Bridge `avoidedDecision` from Purpose Alignment to Constitutional output | Bridge code change, no question change |

### Missing signals that would require new questions

| Signal | Candidate Question | Domain | Reverse | Impact |
|--------|-------------------|--------|---------|--------|
| Success evidence | "How would you know — in observable terms — if this was fixed?" | verification (new) | No | Adds 11th question. Completion % recalculates. |
| What must stop | "What is currently happening that must stop for this to resolve?" | cessation (new) | No | Adds 12th question. New domain. HIGH architectural risk. |
| Immediate decision | "What specific decision must be made in the next 30 days?" | decision (new) | No | Adds 13th question. New domain. HIGH architectural risk. |

**Recommendation:** Adding new questions carries medium-to-high risk due to completion %, domain map, and downstream assumptions. The safer path is bridging existing upstream data (3 signals) and accepting the 3 truly missing signals as a known gap to address in a future architectural pass.

---

## PART 8 — RISK ASSESSMENT

### Current risks (no changes needed)

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Single-question coherence domain (q1) | Medium | q1 is high quality (91/100). Accept risk. |
| Single-question trust domain (q5) | Medium | q5 rewrite is specific and answerable (89/100). Accept risk. |
| q8 tests wrong cost type | Low | Cost-of-inaction exists upstream. Bridge fix, not question fix. |
| q10 is least differentiated | Low | Only external pressure signal. Functional. |
| Bridge transmits scores, not evidence | Medium | Known architectural gap. Not a question-layer issue. |

### Risks if changes are made without care

| Change | Risk | Why |
|--------|------|-----|
| Adding questions | Breaks completion %, answer count gates, downstream assumptions of 10q | Test thoroughly |
| Adding domains | Breaks `buildDomainMap()` type, `Record<DiagnosticQuestionDomain, number[]>` | Type change required |
| Removing questions | Domain score depends on fewer signals, single-question domains become zero-question domains | Never remove q1 or q5 |
| Re-domaining questions | Cascading score recalculation through all composites, classifications, and routing | Do not attempt |

---

## VERDICT

### Current State
The Constitutional Diagnostic is structurally sound. All 10 questions produce valid signals. The q5 and q9 rewrites improved clarity without breaking scoring. The scoring pipeline, routing logic, and downstream bridges are all compatible.

### Deep Dive Findings
The assessment has three structural characteristics to be aware of:

1. **Two single-question domains (coherence, trust)** create concentration risk but are mitigated by question quality.
2. **Three upstream signals are not bridged** (prior attempts, avoidance, cost of inaction) — these exist in the system but Constitutional routing is blind to them. This is a bridge architecture issue, not a question issue.
3. **Three signals are genuinely missing** (success evidence, what must stop, immediate decision) — these would require new questions or new architecture to capture. This is a known gap, not an urgent fix.

### Recommendation
**Do not change any Constitutional questions in the next pass.** The 10-question set scores 84.9/100 average with no question below 71. The two weakest (q8 at 79, q10 at 71) are functional and serve necessary roles. The highest-leverage improvement is not question rewording — it is bridging upstream evidence (prior attempts, avoidance, cost of delay) into the Constitutional output so downstream stages receive context, not just scores. That is an architecture pass, not a question pass.

**The Constitutional Diagnostic matches the seriousness of the system's authority and governance claims. The questions are precise, confrontational, evidence-producing, and structurally useful. The two rewrites (q5, q9) improved the weakest links without introducing risk. The remaining gaps are in the bridge layer, not the question layer. The instrument is sound. Leave it alone.**
