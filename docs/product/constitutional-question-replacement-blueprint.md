# Constitutional Question Replacement Blueprint

> Date: 2026-05-08
> Status: AUDIT ONLY — no implementation without explicit authorisation
> Position: The Constitutional Diagnostic does not need question replacement. It needs bridge improvement.

---

## Surgical Implementation Plan

### Tier 1: Questions to PROTECT (do nothing)

| ID | Wording | Score | Reason |
|----|---------|:-----:|--------|
| q1 | "The stated strategy and actual resource allocation are meaningfully aligned." | 91 | Sole coherence signal. Foundation of routing. |
| q2 | "Decision authority is clear and exercised without chronic diffusion or bottleneck." | 92 | Authority hard gate. Category-defining. |
| q3 | "The operating environment has changed faster than the organisation's ability to adapt." | 80 | Only external-change signal. Reverse scoring creates analytical tension. |
| q4 | "There is a pattern of strategic drift — direction stated but not executed with discipline." | 91 | Execution failure detection. Strongest friction contributor. |
| q5 | "When someone raises a serious objection here, the objection is tested against the decision — not against the person." | 89 | Sole trust signal. Rewrite is strong. |
| q6 | "The organisation carries visible friction: coordination failures, duplicated work, or unresolved conflict." | 81 | Evidence-forcing (gives examples). Friction anchor. |
| q7 | "There is a clear decision-maker who can authorise strategic intervention." | 90 | Authority confirmation. Strategy gate dependency. |
| q8 | "The cost of getting this wrong would be material — financial, reputational, or structural." | 79 | Stakes pricing. Pressure contributor. |
| q9 | "The same problems keep resurfacing despite repeated attempts to fix them." | 85 | Recurrence detection. Pattern signal. Rewrite is clear. |
| q10 | "External market or stakeholder pressure is actively forcing attention to this issue." | 71 | Only external pressure signal. Functional. |

**Verdict: All 10 questions remain. No replacements recommended.**

---

### Tier 2: Possible Sharpening (P3 priority, future pass only)

| ID | Current Issue | Possible Improvement | Same Domain/Polarity | Risk |
|----|-------------|---------------------|---------------------|------|
| q10 | Least confrontational, weakest differentiation | "External pressure is now more expensive to ignore than to address." | Yes (pressure, forward) | Low — same scoring pathway |
| q8 | Tests cost of error, not cost of inaction | No rewrite — address via bridge (surface costOfDelayText from upstream) | N/A | Zero — bridge addition |

**Neither change is urgent. Both are P3.**

---

### Tier 3: Bridge Improvements (highest leverage, no question changes)

These produce more downstream value than any question rewrite:

| Improvement | What It Does | Implementation | Risk | Priority |
|-------------|-------------|---------------|------|----------|
| Bridge `priorAttemptText` | Surfaces "what has been tried" from Fast Diagnostic/ER to Constitutional output | Add field to bridge seed types. Extract from CanonicalDecisionObject. | Zero — additive | P1 |
| Bridge `costOfDelayText` | Surfaces cost-of-inaction evidence to routing context | Add field to bridge seed types. Extract from evidence graph. | Zero — additive | P1 |
| Bridge `avoidedDecision` | Surfaces what the user is avoiding from Purpose Alignment | Add field to bridge seed types. Extract from PA context. | Zero — additive | P2 |
| Bridge tension history | Surfaces cross-stage tension signals as structured evidence | Extend bridge output to include tension thread summary | Low — additive | P2 |

---

### Tier 4: New Questions (NOT recommended for next pass)

If the product ever extends from 10 to 12 questions, these are the strongest candidates:

| Candidate | Domain | Reverse | Signal Produced | Why Defer |
|-----------|--------|---------|----------------|-----------|
| "How would you know — in observable terms — if this was resolved?" | verification (new) | No | Success criteria for outcome verification | Adds domain. Requires type change. Medium risk. |
| "What is currently happening that must stop for this to resolve?" | cessation (new) | No | Cessation signal, avoidance detection | Adds domain. Requires type change. Medium risk. |

**Why defer:** Adding questions changes completion %, introduces new domains, requires `DiagnosticQuestionDomain` type extension, `buildDomainMap()` Record type update, and may shift the scoring balance. The 10-question instrument is calibrated. These additions need a dedicated architectural pass.

---

## Impact Assessment

### Scoring impact of recommended changes
**Zero.** All Tier 1-3 recommendations involve no question changes. Bridge improvements add data to output without affecting score computation.

### Route-decision impact
**Zero.** Routing logic (`rules.ts`) remains unchanged. Bridge improvements add context alongside existing score inputs.

### Downstream impact
**Positive.** Team Assessment, Executive Reporting, and Strategy Room would receive richer context (what has been tried, what is avoided, what inaction costs) alongside the existing numeric scores.

### Privacy impact
**Minimal.** Bridged text (priorAttemptText, avoidedDecision, costOfDelayText) is already captured and stored. The bridge merely surfaces it to downstream stages that already have access to the user's case data.

### Build risk
**Zero for bridge changes.** Additive field additions to TypeScript types. No existing fields removed or renamed.

---

## Summary Position

The Constitutional Diagnostic is the product's structural backbone. Its 10 questions determine routing for every user who progresses past the diagnostic layer. The instrument is:

- **Calibrated** — thresholds, gates, and classifications are tuned to 10 questions
- **Tested** — q5 and q9 rewrites addressed the two weakest points
- **Tightly coupled** — 15+ files depend on its output shape
- **Adequate in question quality** — average 84.9/100, no question below 71

The highest-leverage improvement is not question surgery. It is bridge surgery — transmitting the evidence the system already captures alongside the scores it already computes. A user who tells Purpose Alignment they are "avoiding firing a co-founder" and tells Fast Diagnostic "it becomes more expensive every month" should not arrive at Constitutional routing with those signals erased. The bridge should carry them.

That is the next pass. Not this one.
