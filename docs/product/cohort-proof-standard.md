# Cohort Proof Standard

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London

---

## Rules

1. **Minimum N enforced.** No public aggregate claim below N=15.
2. **Sample size always shown.** Every aggregate statement includes N.
3. **Cohort definition always shown.** Who is in this cohort (role, cost band, condition class).
4. **Timeframe shown where relevant.** "Within the review window" or "across Q1-Q2 2026".
5. **No causal language below N=50.** Use "observed in" or "associated with" instead of "led to" or "caused".
6. **Prefer "observed in" over "caused by."** Unless the design supports causality.
7. **Prefer "associated with" over "led to" unless verified.**

## Acceptable Example

"Across anonymised cases meeting the publication threshold, decisions with verified accountable ownership showed stronger follow-through within the review window. N=32."

## Not Acceptable

"Our system improves execution by 73%."

## Insufficient Data Handling

If no cohort data exists, the engine returns `INSUFFICIENT_SAMPLE`, not filler.
If the sample is below threshold, surfaces show: "Aggregate metrics are not yet available. Minimum evidence thresholds have not been met."

## Language Levels

| N | Language |
|---|---------|
| N < 5 | No statement |
| 5 <= N < 15 | Internal only: "Observed in N cases (internal calibration)" |
| 15 <= N < 50 | Public: "Associated with" / "Observed in N cases" |
| N >= 50 | Public: May use "led to" if design supports causality |

## Implementation

- Contract: `lib/proof/cohort-proof-contract.ts`
- Engine: `lib/proof/social-proof-engine.ts`
- Thresholds defined in `COHORT_PROOF_THRESHOLDS`
