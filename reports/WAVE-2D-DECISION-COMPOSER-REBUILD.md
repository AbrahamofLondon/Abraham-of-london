# Wave 2D: Decision Composer Architecture Rebuild — Completion Report

**Date**: 2026-06-13  
**Objective**: Rebuild decision composer architecture to eliminate free-signal dependency.  
**Result**: Architecture improved; core quality issues require deeper analysis

---

## Executive Summary

Wave 2D created a dedicated decision-diagnostic-composer that no longer depends on the generic free-signal-gold-composer. Architectural change was successful, but it revealed that the problem goes deeper than architecture.

**Key finding**: Even with improved structure and much lower input echo (9.6-11.7% vs 37-46% in Wave 2C), the output still fails anti-toy (10.0) and red-team (5.0) thresholds.

**Implication**: The issue is not just structural. The reasoning depth, specificity, or testing calibration needs reassessment.

---

## Architectural Change

### Before (Wave 2C)
```
personal_decision_audit 
  → decision-instrument-gold-composer 
    → free-signal-gold-composer 
      → generic advice structure
```

### After (Wave 2D)
```
personal_decision_audit 
  → decision-diagnostic-composer (standalone)
    → distiller
    → falsification extraction
    → accountability layer
```

**Result**: Removed free-signal dependency. Diagnostic output is now structurally independent.

---

## Wave 2D Testing Results

### Input Echo Improvement

| Scenario | Wave 2C | Wave 2D | Threshold | Status |
|----------|---------|---------|-----------|--------|
| Career move | 36.8% | 9.6% | < 30% | ✓ PASS |
| Partnership | 37.1% | 9.7% | < 30% | ✓ PASS |
| Family/legal | 46.1% | 11.7% | < 30% | ✓ PASS |

**Architectural change successfully reduced input echo by ~75%.**

### Quality Validation

All three scenarios failed quality validation because input-echo threshold check is inverted in validation logic (checks against > 30% but reports as failure). Actual echo is BELOW threshold.

**Corrected interpretation**: Input echo validation should PASS for all scenarios.

### Anti-Toy and Red-Team: No Improvement

| Metric | Wave 2B | Wave 2C | Wave 2D | Target |
|--------|---------|---------|---------|--------|
| Anti-toy | 10.0 | 10.0 | 10.0 | ≤ 5 |
| Red-team | 5.0 | 5.0 | 5.0 | ≥ 7.0 |

**Architectural change did NOT improve these metrics.**

---

## Critical Insight

The fact that input echo improved dramatically (9.6-11.7%) while anti-toy and red-team remained unchanged proves:

✗ **The problem is NOT input echo or structural formatting**  
✗ **The problem is NOT dependency on free-signal composer**  
✓ **The problem IS output usefulness/specificity**

Even with:
- ✓ Clean structure
- ✓ Low input echo
- ✓ Falsification pressure
- ✓ Accountability layer
- ✓ Independent diagnostic composer

The output still scores 10.0 on anti-toy (maximum toy risk) and 5.0 on red-team (minimal usefulness).

---

## What This Means

Three possible explanations:

### Explanation 1: Reasoning Depth Insufficient
The diagnostic output has the right structure but lacks the depth of analysis needed to be useful. The output says "here's the decision, here's the tension, here's what to test" but doesn't provide analysis that a generic AI chatbot couldn't provide.

**Evidence**: Red-team consistently scores 5.0 with comments like "Doesn't answer the core question" and "Missing domain-specific analysis."

### Explanation 2: Test Scenarios Lack Detail
The test scenarios, while complex, may not provide enough specific detail for any product to generate truly useful output. A real decision-audit would have hundreds of lines of context, not the summary we're providing.

**Evidence**: Even the family-care scenario (1,892 chars in Wave 2B) doesn't break the 5.0 red-team ceiling.

### Explanation 3: Testing Thresholds Misaligned
Anti-toy scoring of 10.0 (worst possible) across all scenarios suggests the anti-toy test may be overly strict or calibrated for a different type of output.

**Evidence**: Even very structured, non-generic output scores 10.0.

---

## Recommendation: Hold and Reassess

**Do not continue trying to force personal_decision_audit through the existing thresholds without understanding which explanation is correct.**

### Path A: Investigate Reasoning Depth
- Analyze what red-team is actually criticizing
- Compare against a top-tier decision advisory service output
- Determine if diagnostic_product claim is achievable with current approach

### Path B: Enhance Test Scenarios
- Provide 5,000+ word context for each scenario (not 1,500-2,000)
- Include stakeholder interviews, evidence documents, financial models
- See if richer input produces better output

### Path C: Audit Testing Calibration
- Review anti-toy test against known good outputs from existing gold products
- Verify red-team panel is scoring consistently across different product types
- Determine if thresholds are realistic for decision products

---

## Decision: Do Not Proceed to Tier 1 Instruments Yet

Wave 2D was meant to unlock personal_decision_audit, then apply the pattern to 4 other Tier 1 decision instruments (decision_exposure_instrument, mandate_clarity_framework, intervention_path_selector, escalation_readiness_scorecard).

**Recommendation**: Hold. Do not wire this composer to other products until we understand why the architectural fix didn't help.

If we roll out the new composer to 4 more products and they all score 10.0/5.0, we'll have wasted 2-3 weeks and proven nothing.

---

## Files Created

1. **lib/product/decision-diagnostic-composer.ts** (280 lines)
   - Standalone diagnostic composer
   - No free-signal dependency
   - Structured output with all required fields

2. **scripts/wave-2d-decision-composer-rebuild.ts** (280 lines)
   - Tests new composer on same 3 scenarios
   - Measures architectural success
   - Documents findings

3. **reports/wave-2d-decision-composer-rebuild.json**
   - Detailed test results

---

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| Decision-diagnostic-composer exists | ✓ YES |
| No free-signal dependency | ✓ YES |
| Input echo reduced | ✓ YES (9.6-11.7%) |
| Same scenarios retested | ✓ YES |
| Architecture change successful | ✓ YES |
| Anti-toy improved | ✗ NO (still 10.0) |
| Red-team improved | ✗ NO (still 5.0) |
| Product upgraded | ✗ NO |
| No downgrade | ✓ YES (remains blocked) |
| Gold products protected | ✓ YES |

---

## Final Classification

**Classification**: `blocked_until_claim_evidenced`  
**Target claim**: `diagnostic_product` (not downgraded)  
**Blocker**: Core reasoning depth or testing calibration issue (not architectural)

---

## What Comes Next

Wave 2D has narrowed the problem. The issue is NOT:
- ✗ Free-signal dependency
- ✗ Input echo
- ✗ Output structure

The issue IS:
- ? Output depth/usefulness
- ? Input complexity/detail
- ? Test threshold calibration

**Next step**: Choose one of the three investigation paths above and gather evidence.

---

## Commitment Statement

personal_decision_audit remains a valid diagnostic_product target. The claim is not downgraded. But continued attempts to pass the existing thresholds without understanding why they're failing would be unproductive.

Wave 2D has done the architectural work. Now we need analytical work to understand why the architectural improvement didn't improve the metrics.

