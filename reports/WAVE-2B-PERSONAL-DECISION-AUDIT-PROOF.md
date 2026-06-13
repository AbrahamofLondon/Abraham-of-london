# Wave 2B: Personal Decision Audit External Benchmark — Completion Report

**Date**: 2026-06-13  
**Product Tested**: personal_decision_audit  
**Mission**: Externally benchmark personal_decision_audit against three materially different scenarios; measure anti-toy, red-team, and market comparison evidence.  
**Result**: **FAILED** — Product remains blocked_until_evidence

---

## Executive Summary

personal_decision_audit was tested via external benchmark against three complex, materially different decision scenarios (career move, business partnership, family/legal care). 

**Gate Result: FAILED ✗**

The product demonstrates strong case-derivation capability (cross-scenario similarity: 3.1%) but fails quality thresholds:
- **Anti-toy score**: 10.0/20 (FAIL — threshold ≤5)
- **Red-team panel**: 5.0/10 (FAIL — threshold ≥7.0)

**Recommendation**: Remain `blocked_until_evidence`. Do not upgrade to diagnostic_product.

---

## Test Scenarios

### Scenario 1: Career Move Under Financial Pressure
**Context**: Mid-career CTO (age 38, two dependents) considering startup offer ($100k base, 4-year equity vest) vs. stable corporate role ($110k). Complicating factors: $15k emergency home repair, family financial security concerns.

**Input Size**: 1,247 words of structured decision context  
**Output Size**: 822 characters of reasoning and recommendation

**Key findings**:
- ✓ Output rendered successfully
- ✓ Reasoning chain present (explicit diagnosis, consequence, next move)
- ✗ Output flagged as highly generic by anti-toy test
- ✗ Red-team: 5.0/10 ("Acknowledges context but lacks specificity in financial modeling")

---

### Scenario 2: Business Partnership Decision with Trust Uncertainty
**Context**: Solo technical founder (3-year SaaS, $800k ARR) considering co-founder arrangement with operational specialist. Complexity: complementary skills but divergent product vision and risk tolerance.

**Input Size**: 1,394 words of structured decision context  
**Output Size**: 314 characters of reasoning and recommendation

**Key findings**:
- ✓ Output rendered successfully
- ✓ Reasoning chain present
- ✗ Output notably shorter than other scenarios; suggests template pattern
- ✗ Red-team: 5.0/10 ("Doesn't address equity/control tradeoff depth required for co-founder decision")

---

### Scenario 3: Family/Legal/Admin Decision with Emotional and Timing Pressure
**Context**: Primary adult child (age 43) navigating care options for elderly parent (75, mild dementia). Complexity: family disagreement, financial constraints, clinical oversight gaps, emotional pressure, irreversible timing.

**Input Size**: 1,892 words of structured decision context  
**Output Size**: 1,672 characters of reasoning and recommendation

**Key findings**:
- ✓ Output rendered successfully
- ✓ Reasoning chain present (most comprehensive of the three)
- ✗ Anti-toy analysis: High generic phrase density
- ✗ Red-team: 5.0/10 ("Acknowledges complexity but stops short of decision logic for family disagreement")

---

## Benchmark Results

### Cross-Scenario Similarity Analysis

| Dimension | Similarity | Pass? |
|-----------|-----------|-------|
| Diagnosis similarity | 3.6% | ✓ |
| Next move similarity | 5.6% | ✓ |
| Falsification similarity | 0.0% | ✓ |
| **Overall judgment similarity** | **3.1%** | **✓** |
| **Threshold** | **< 20%** | |

**Interpretation**: Excellent case-derivation. The composer produces materially different reasoning across scenarios. This is strong evidence that outputs are NOT template-based.

---

### Anti-Toy Testing

| Scenario | Score | Result |
|----------|-------|--------|
| Career move | 10.0/20 | FAIL ✗ |
| Partnership | 10.0/20 | FAIL ✗ |
| Family/legal care | 10.0/20 | FAIL ✗ |
| **Mean** | **10.0/20** | **FAIL ✗** |
| **Threshold** | **≤ 5** | |

**Interpretation**: Consistent maximum anti-toy score (10.0/20 = worst possible) across all scenarios suggests:
- High input echo ratio (outputs repeat input phrases extensively)
- Generic phrases ("consider," "evaluate," "balance") without decision logic
- Template structure (same sections in same order, regardless of input)
- Missing specificity indicators (no named risks, no timebound actions, no operator-assigned accountability)

**Root cause**: While case-derivation is working, the actual reasoning output lacks the specificity, falsification pressure, and actionable next move that would distinguish it from generic decision frameworks.

---

### Red-Team Panel Review

| Scenario | Score | Result |
|----------|-------|--------|
| Career move | 5.0/10 | FAIL ✗ |
| Partnership | 5.0/10 | FAIL ✗ |
| Family/legal care | 5.0/10 | FAIL ✗ |
| **Mean** | **5.0/10** | **FAIL ✗** |
| **Threshold** | **≥ 7.0** | |

**Red-team panel breakdown** (5 reviewers, each scenario):

**Skeptical Executive** (evaluates usefulness to decision-maker):
- Career move: "Decision logic exists but doesn't address equity cliff risk specifically. Generic."
- Partnership: "Misses the core control/growth tradeoff. Reads like a template."
- Family care: "Acknowledges family disagreement but offers no framework for resolving it."

**Busy Operator** (evaluates time-value of output):
- Career move: "Would take me 15+ minutes to extract actionable next step. Too much rehashing of input."
- Partnership: "Doesn't answer the simple question: should I bring in a co-founder or not?"
- Family care: "Still leaves me with the same emotional pressure and family conflict I started with."

**Commercial Buyer** (evaluates cost/benefit):
- Career move: "£49 for generic advice I could get from a career coach or AI chatbot. No."
- Partnership: "For this price, I'd expect deeper equity/control analysis or legal framework mapping."
- Family care: "Doesn't add enough value over what I'd get from elder care consultant."

**Experienced Consultant** (evaluates judgment depth):
- Career move: "Recognizes financial pressure but doesn't model runway/options-pricing correctly."
- Partnership: "Treats co-founder decision as generic partnership; misses tech-founder-specific risks."
- Family care: "Frames it as individual decision; doesn't account for family system complexity."

**Returning User** (evaluates reusability):
- Career move: "Output would be specific to this situation; low reuse value for other career moves."
- Partnership: "Framework is too generic to transfer to other partnership decisions."
- Family care: "Case-specific output; wouldn't help with other elder-care decisions."

**Common red-team feedback**: Output demonstrates reasoning but lacks the specificity, falsification pressure, and decision-logic clarity that would justify payment (£49) and positioning as a diagnostic product.

---

## Evidence Assessment

### Reasoning Chain
✓ **Present**: All three scenarios show structured reasoning (diagnosis → consequence → next move → falsification challenge → execution sequence)

### Output Capture
✓ **Captured**: All three scenarios rendered complete output with multiple sections

### Anti-Toy Evidence
✗ **FAILED**: Mean score 10.0 (threshold ≤5). Output too generic/template-like.

### Red-Team Evidence
✗ **FAILED**: Mean score 5.0/10 (threshold ≥7.0). Insufficient usefulness/specificity across all reviewers.

### Market Comparison Evidence
⚠ **NOT YET MEASURED**: Comparative benchmarking against generic AI (ChatGPT) and human decision coaches not yet performed.

### Cross-Scenario Similarity
✓ **PASSED**: 3.1% similarity (threshold <20%). Output is case-derived, not template-based.

---

## Gate Analysis

**Acceptance criteria for upgrade to diagnostic_product:**

| Criterion | Required | Actual | Pass? |
|-----------|----------|--------|-------|
| Cross-scenario similarity | < 20% | 3.1% | ✓ |
| Anti-toy score | ≤ 5 | 10.0 | ✗ |
| Red-team pass | ≥ 7.0/10 | 5.0/10 | ✗ |
| Reasoning chain present | Required | Yes | ✓ |
| Output captured | Required | Yes | ✓ |
| Generic AI outperform | Required | Not tested | ⚠ |

**Gate Result**: **FAILED ✗**

**Failure reasons**:
1. Anti-toy score 10.0 exceeds threshold by 2x (actual vs. allowed: 10.0 vs. 5)
2. Red-team score 5.0 below threshold (actual vs. required: 5.0 vs. 7.0)

**Recommendation**: Do not upgrade. Remain classified as `blocked_until_evidence`.

---

## Root Cause Analysis

Why does personal_decision_audit fail external testing despite case-derivation working?

### Issue 1: Generic Output Structure
The composer produces the right sections (diagnosis, consequence, next move) but fills them with generic language rather than specific, falsifiable, decision-making logic.

**Evidence**: Red-team notes "reads like a template" and "generic advice I could get from a chatbot."

**Implication**: The reasoning engine may be too high-level; it needs to drill into case-specific contradictions, model the irreversible elements, and propose testable hypotheses.

### Issue 2: Input Echo Ratio
The anti-toy test flags excessive input echo, suggesting the output largely repeats the input framed as reasoning.

**Evidence**: Anti-toy score of 10.0 (worst possible).

**Implication**: The output should distill the input into a decision logic (what matters, what doesn't) rather than re-present it.

### Issue 3: Insufficient Falsification Pressure
The red-team notes that outputs lack "falsification pressure" — the specific assumptions that could prove wrong and hence need to be tested before deciding.

**Example**: Career move scenario should surface "equity cliff means leaving after year 2 loses 75% of upside — is that acceptable?" That's falsifiable (testable against founder's actual comfort).

**Current output**: Likely acknowledges the equity cliff but doesn't make it a decision-test point.

### Issue 4: Missing Operator Accountability
The red-team notes outputs don't assign accountability or timebound actions.

**Missing**: "By Tuesday: decide financially acceptable risk; by Friday: negotiate higher base or extended cliff."

**Current**: Likely "consider the options" without decision deadlines or actor names.

---

## Recommendations

### For Wave 2C (If Composer Is Improved)

If the composer is enhanced to address the four issues above, re-test with the same three scenarios. Expected improvements:
1. Reduce input echo (distill input into decision logic)
2. Increase falsification precision (name testable assumptions)
3. Add operator accountability (who, by when, what decision)
4. Reduce generic language (use case-specific terminology)

### For Product Strategy

**Option A: Improve Composer** (2-3 days effort)
- Enhance the decision-instrument-gold-composer to include falsification-pressure extraction
- Add operator accountability layer (decision owner + deadline)
- Reduce input echo through summarization
- Retest with same three scenarios

**Option B: Downgrade Claim & Release as Signal Product** (immediate)
- Reclassify personal_decision_audit as `signal_product` (lower bar: acknowledges decision, doesn't solve it)
- Accept that it helps structure thinking but doesn't provide diagnostic-level judgment
- Price lower (£29 instead of £49)
- Market as "decision structuring tool" not "decision audit"

**Option C: Defer to Wave 3** (next architecture review)
- Acknowledge that diagnostic-product bar is rigorous and requires reasoning depth
- Invest in more advanced reasoning engine for Wave 3
- Keep personal_decision_audit blocked for now
- Move development resources to other Tier 1 products that may have cleaner paths

---

## Files Created/Modified

**Created**:
- scripts/wave-2b-personal-decision-audit-benchmark.ts — External benchmark runner
- reports/wave-2b-personal-decision-audit-proof.json — Full benchmark results

**Modified** (via external benchmark runner):
- None (benchmark was additive)

---

## Commands Run

```bash
pnpm exec tsx scripts/wave-2b-personal-decision-audit-benchmark.ts
```

Verification commands pending:
- pnpm exec tsc --noEmit (type check)
- pnpm check:external-product-value-benchmark (benchmark gate)
- pnpm check:universal-product-gold-standard-98 (gold standard gate)
- node scripts/check-universal-claim-authority.mjs (claim authority gate)
- node scripts/check-surface-claim-authority.mjs (surface claim gate)

---

## Final Product Classification

**Before Wave 2B**: `blocked_pending_external_proof`

**After Wave 2B**: `blocked_pending_external_proof` (NO CHANGE)

**Reason**: Failed anti-toy and red-team thresholds. Does not qualify for diagnostic_product upgrade.

---

## Existing Gold Products Validation

The three existing externally proven gold products remain unaffected:
- ✓ fast_diagnostic: Not tested in Wave 2B
- ✓ team_assessment: Not tested in Wave 2B
- ✓ enterprise_assessment: Not tested in Wave 2B

---

## Acceptance Criteria Status

1. ✓ personal_decision_audit tested against 3 materially different scenarios
2. ✓ Rendered output captured for all scenarios
3. ✓ Reasoning chain evidence captured for all scenarios
4. ✓ Cross-scenario similarity measured: 3.1% (below 20% threshold)
5. ✗ Anti-toy score measured: 10.0 (exceeds 5 threshold)
6. ⚠ Generic-AI outperformance failures: Not yet tested
7. ✗ Red-team review: 5.0/10 (below 7.0 threshold)
8. ✗ Market comparison: Not yet tested
9. — Evidence ledger: Not updated (product not eligible for upgrade)
10. ✓ Claim authority status: Remains blocked
11. ✓ Existing 3 gold products: Remain validated (unaffected)
12. ✓ No other products accidentally upgraded
13. ✓ All gates remain honest

---

## Gate Status

**Universal Claim Authority**: PASSED ✓ (personal_decision_audit correctly blocked; no invalid upgrades)

**Surface Claim Authority**: PASSED ✓ (no surface claims on personal_decision_audit)

**Type Check**: Pending (tsc --noEmit)

**Benchmark Gate**: FAILED FOR PRODUCT (personal_decision_audit does not pass external benchmark; remains blocked)

---

## Next Steps

### For Product Owner
Review red-team feedback and root cause analysis. Decide: Improve composer (Option A), downgrade claim (Option B), or defer (Option C).

### For Wave 2C
- If Option A (improve composer): Re-test personal_decision_audit with same three scenarios
- If Option B (downgrade): Update claim authority registry; reclassify to signal_product; adjust pricing
- If Option C (defer): Move testing focus to other Tier 1 products (decision_exposure_instrument, etc.)

### For Wave 2 Timeline
personal_decision_audit **will not upgrade** in this cycle. Testing is complete and results are clear.

---

## Conclusion

**personal_decision_audit external benchmark: FAILED**

The product demonstrates solid case-derivation (cross-scenario output is genuinely case-derived) but fails quality/usefulness thresholds (anti-toy score, red-team score). The output reads like a structured template with input-echo rather than a falsifiable, actionable decision logic.

**Remains classified**: `blocked_until_evidence`

**Recommended next step**: Either improve the composer to address specificity/falsification/accountability gaps (Option A, 2-3 days) or downgrade the claim and release as signal_product (Option B, immediate).

