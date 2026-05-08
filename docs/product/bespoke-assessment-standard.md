# Bespoke Assessment Standard

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London
**Rule:** Every assessment result must include at least five user-specific anchors. No generic output on primary surfaces.

---

## Minimum Bespoke Standard

Each assessment result must include at least **five** of these where available:

1. User-stated decision or context
2. Primary contradiction derived from their answers
3. Evidence tier
4. Confidence / evidence limitation
5. Consequence or risk implication
6. Specific next action
7. Repair path if restricted
8. Completed stages / missing stages
9. Continuity status
10. Case reference / preservation note

---

## Surface Compliance

### Fast Diagnostic

| Anchor | Source | Present? |
|--------|--------|---------|
| User-stated decision | `answers.decision` → `CaseObject.decision` | YES — quoted in narrative opening |
| Primary contradiction | `GovernedSynthesis.primaryContradiction` | YES — derived from blocker vs. forced action |
| Evidence tier | C3 fidelity score | YES — displayed as signal strength |
| Confidence limitation | `GovernedSynthesis.certaintyBoundary` | YES — "Single-source reading — your perspective only" |
| Consequence | `AnchorNarrative.costOfInaction` (30/60/90 days) | YES — bespoke to user's stated consequence |
| Specific next action | `GovernedSynthesis.concreteMove` | YES — binary choice from user's answers |
| Continuity status | Via earned escalation panel | PARTIAL — "What is not yet clear is whether this is personal or systemic" |
| Quoted user language | `GovernedSynthesis.quotedUserLanguage[]` | YES — direct quotes from input |

**Score: BESPOKE** (8/10 anchors present, all derived from user input)

### Purpose Alignment

| Anchor | Source | Present? |
|--------|--------|---------|
| User-stated context | 3 context questions (decision avoiding, competing obligation, consequence) | YES |
| Primary contradiction | `PurposeProfileResult.contradictions[]` with evidence | YES |
| Evidence tier | Dual-axis scoring (resonance × certainty) | YES |
| Pattern classification | `PurposeProfileResult.primaryPattern` with reasons | YES — specific to user's domain scores |
| Consequence | Cost of inaction (30/60/90 days) | YES |
| Specific next action | `PurposeProfileResult.corrections[]` | YES |
| Continuity | 14-day re-evaluation framing | YES |

**Score: BESPOKE** (7/10 anchors)

### Constitutional Diagnostic

| Anchor | Source | Present? |
|--------|--------|---------|
| Route decision | STRATEGY/DIAGNOSTIC/REJECT from user's scores | YES |
| Authority type | Derived from user's answers | YES |
| Posture/readiness | Scored from dual-axis input | YES |
| Failure modes | Derived from domain weaknesses | YES |
| Confidence score | Constitutional confidence level | YES |
| Evidence tier | Via inherited spine | YES |
| Route explanation | REJECT explanation with repair path | YES |

**Score: BESPOKE** (7/10 anchors)

### Team Assessment

| Anchor | Source | Present? |
|--------|--------|---------|
| Perception gaps | Leader vs. team scores per domain | YES — specific gaps named |
| Fragility classification | Bessel-corrected standard deviation | YES |
| Domain-level severity | Per-domain gap analysis | YES |
| Escalation trigger | "Gap too wide — enterprise assessment needed" | YES |
| Evidence limitation | "Leader view only" vs. respondent mode | YES |

**Score: MOSTLY BESPOKE** (5/10 anchors)

### Enterprise Assessment

| Anchor | Source | Present? |
|--------|--------|---------|
| Domain scoring | Per-domain axis analysis | YES |
| Risk formula result | `(100 - pct) + decision_structural_risk × 0.35` | YES |
| Decision signal | Clarity, authority, consequence from recent decision | YES |
| Escalation routing | ER or WATCH based on user's scores | YES |
| Compound severity | Combined with team assessment if available | YES |

**Score: MOSTLY BESPOKE** (5/10 anchors)

### Executive Reporting

| Anchor | Source | Present? |
|--------|--------|---------|
| Accumulated evidence | From all prior stages | YES |
| Financial exposure | Derived from user's diagnostic data | YES |
| Governed priority stack | From user's specific evidence | YES |
| Admission validation | Server-side evidence cross-validation | YES |
| Evidence tier | From journey record | YES |

**Score: BESPOKE** (5/10 anchors, all evidence-derived)

### Strategy Room

| Anchor | Source | Present? |
|--------|--------|---------|
| Admission result | `evaluateStrategyRoomAdmission()` with case-specific data | YES |
| Decision object | From canonical decision | YES |
| Contradiction graph | From evidence nodes | YES |
| Authority enforcement | Durable thread with user-specific signals | YES |
| Evidence tier | From journey | YES |

**Score: BESPOKE** (5/10 anchors)

### Return Brief

| Anchor | Source | Present? |
|--------|--------|---------|
| Prior commitment | Contradiction section: "You previously committed to…" | YES — quotes user's decision |
| Trajectory | DETERIORATING/FRAGILE/STABLE with reason | YES |
| Contradiction re-exposed | Decision vs. constraint from prior session | YES — bespoke |
| Outcome evidence | Cases processed, improvement % | YES |
| Personal delta | Clarity/Authority/Readiness change | YES |
| Continuity statement | ContinuityStatement component with bespoke reason | YES |
| Admission status | AdmissionNotice with evidence tier and case reference | YES |
| Stage checklist | Bespoke stage contributions | YES |

**Score: BESPOKE** (8/10 anchors)
