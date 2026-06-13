# Wave 2E: Judgement Quality Autopsy — Completion Report

**Date**: 2026-06-13  
**Objective**: Perform precise autopsy on actual failed outputs to identify exact missing components.  
**Result**: **Specific engine-layer failures identified. Decision force blueprint for Wave 2F created.**

---

## Autopsy Findings

### Decision Force Scores

All three scenarios scored **below diagnostic threshold (8.5)**:

| Scenario | Score | Status | Critical Failures |
|----------|-------|--------|---|
| Career move under financial pressure | 6.7 | BELOW | 1 |
| Business partnership with trust uncertainty | 6.9 | BELOW | 1 |
| Family/legal/admin pressure | 7.2 | BELOW | 1 |
| **Average** | **6.9** | **BELOW** | **3 total** |

### Most Common Failing Engine Layers

Ranked by frequency of failure:

1. **Trade-off Modelling** (3/3 scenarios) — 100% failure rate
   - What's being traded is not sharp enough
   - Output says "financial vs. growth" but doesn't model what that actually means
   - Not quantifying the trade-off

2. **Falsification Pressure** (3/3 scenarios) — 100% failure rate
   - The test that would prove judgment wrong is too vague
   - "What if X happens?" but not concrete enough for decision-maker to test
   - Missing measurable, observable conditions

3. **Consequence Modelling** (3/3 scenarios) — 100% failure rate
   - Consequence is generic ("bad outcome") not case-specific
   - Not quantifying the risk ($ impact, time horizon, reversibility)
   - Not grounded in THIS case facts

4. **Assumption Extraction** (2/3 scenarios) — 67% failure rate
   - Hidden assumptions are not named specifically enough
   - "You're assuming trust works" but not WHY that assumption is risky here
   - Missing testability

---

## Diagnostic Interpretation

**Decision force score of 6.9 means:**
- Output is **structured correctly** (we know that from Waves 2C-2D)
- Output **identifies the problem** (case-derivation works)
- Output **fails to create decision force** (the specific, measurable pressure needed to decide)

The three failing layers are NOT independent; they're linked:

1. **Weak trade-off** → unclear what's actually at stake
2. **Weak falsification** → unclear what evidence would matter
3. **Weak consequence** → unclear what risk is real

**Together they fail to create pressure to decide.**

---

## Generic AI Comparison

For career-move scenario:
- **Generic AI** would say: "Consider the trade-off between financial security and career growth. Weigh your options carefully."
- **Our product** says: "The actual decision is whether immediate income protection outweighs strategic cost of accepting a lower-ceiling role before testing your runway."
- **Difference**: We name the specific trade-off but don't model it. Generic AI doesn't pretend to model it either.

**Conclusion**: We're barely outperforming generic AI because our output lacks the **specificity and measurability** that would prove we understand the decision better.

---

## Wave 2F: Targeted Fixes Required

Do NOT rebuild. Do NOT change thresholds. Upgrade ONLY these layers:

### Layer 1: Trade-off Modelling
Create `lib/judgement/decision-tradeoff-model.ts`

Must model WHAT is actually being traded:
- Career move: "Accept 25% upside potential vs. guaranteed $2,200/month mortgage coverage"
- Partnership: "Gain investor relationships + growth speed vs. lose product direction control + equity dilution"
- Family care: "Honor autonomy preference vs. eliminate hospitalization risk"

Not generic "security vs. growth" — quantified, specific to this case.

### Layer 2: Consequence Specificity
Enhance `lib/judgement/decision-output-distiller.ts`

Must quantify consequences with case facts:
- "If you wait beyond 14 days, offer expires; this removes the option permanently" (not "bad outcome")
- "If you delay 12 months on elder care, you risk hospitalization which is irreversible" (not "increases risk")
- "If equity cliff is year 2 and you leave year 3, you forfeit ~$X thousand upside" (not "lose equity value")

### Layer 3: Falsification Specificity
Create or enhance falsification extraction

Must make test observable:
- Career: "This judgment changes if your spouse confirms runway can cover $2.2k/month for 12 months on her income alone"
- Partnership: "This judgment changes if written terms limit your equity dilution to 40% and assign product decisions to you"
- Family care: "This judgment changes if the facility waitlist extends past 6 months, making immediate enrollment impossible"

Not "What if assumptions are wrong?" — "If X happens, re-decide."

---

## Files Created

1. **lib/judgement/decision-force-score.ts** (250 lines)
   - Measures decision force across 9 dimensions
   - Critical dimensions: decision named, falsification strength, accountability, non-genericity
   - Threshold: 8.5 overall, no critical dimension below 7.0

2. **scripts/autopsy-decision-force.ts** (200 lines)
   - Inspects actual outputs from diagnostic composer
   - Scores each scenario
   - Maps failures to engine layers

3. **reports/wave-2e-judgement-quality-autopsy.json**
   - Autopsy findings: scores, failures, recommendations

---

## Acceptance Criteria Met

| Criterion | Status |
|-----------|--------|
| Full outputs inspected | ✓ YES |
| Decision force score created | ✓ YES |
| Generic AI comparison performed | ✓ YES |
| Failures mapped to engine layers | ✓ YES |
| Specific upgrades identified | ✓ YES |
| No downgrade applied | ✓ YES (remains blocked) |
| Gold products protected | ✓ YES |
| Gates honest | ✓ YES |

---

## Next Step: Wave 2F

**Do not attempt further architectural changes.**

Upgrade ONLY these three engine layers:
1. Trade-off Modelling — make specific, quantified
2. Consequence Modelling — ground in case facts
3. Falsification Extraction — make observable/testable

Expected outcome: Decision force score improves from 6.9 → 8.5+

If it does NOT: The problem is not the engine layers but something structural (test calibration, input sufficiency, or claim feasibility).

---

## Commitment

personal_decision_audit remains `blocked_until_claim_evidenced`.

Target: `diagnostic_product` (not downgraded).

This autopsy proves exactly what's missing and provides a surgical fix path for Wave 2F.

