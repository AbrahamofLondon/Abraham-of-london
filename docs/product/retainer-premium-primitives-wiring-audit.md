# Retainer Premium Primitives Wiring Audit

**Date:** 2026-05-08
**Method:** Direct code inspection — grep for actual imports, function calls, and brief field population.

---

## Primitive Status

| Primitive | Source function | Called by | Brief field | Client-safe | Status |
|-----------|---------------|----------|-------------|-------------|--------|
| Cost-of-Inaction Clock | `calculateCostOfInactionClock()` | Return Brief server, Oversight Account Loader | `costOfInaction` | YES | DELIVERY_READY |
| Commitment Verification | `buildCommitmentVerificationStates()` | Return Brief server, Oversight Account Loader | `verification` | YES | DELIVERY_READY |
| Pattern Recurrence | `detectPatternRecurrenceV0()` | Return Brief server, Decision Centre API, Oversight Account Loader | `patternRecurrence` | YES | DELIVERY_READY |
| Decision Credit | `deriveDecisionCreditGovernanceEffect()` | Decision Centre API, Oversight Brief Composer | `decisionCredit` | YES | DELIVERY_READY |
| Cycle Consequence Projection | `projectOversightCycleConsequence()` | Oversight Brief Composer (line 337) | `cycleConsequenceProjection` | YES | COMPOSER_WIRED |
| Decision Loss Register | `assembleDecisionLossRegister()` | NOT CALLED | `decisionLosses` (populated by inline signal heuristic) | YES | COMPOSER_WIRED (inline) |
| Strategic Option Register | `assembleStrategicOptionRegister()` | NOT CALLED | `strategicOptions` (populated by inline heuristic) | YES | COMPOSER_WIRED (inline) |
| Irreversibility Index | `computeIrreversibilityIndex()` | NOT CALLED | `irreversibility` (populated by inline heuristic) | YES | COMPOSER_WIRED (inline) |
| Decision Dependency Graph | `assembleDecisionDependencyGraph()` | NOT CALLED | `decisionDependencies` (contract exists, not populated yet) | N/A | CONTRACT_ONLY |
| Value Protected | Built inline in composer | Oversight Brief Composer | `valueProtected` | YES | COMPOSER_WIRED |
| Structured Actions | Built inline in composer | Oversight Brief Composer | `structuredActions` | YES | COMPOSER_WIRED |

---

## Explanation

The 3 "inline heuristic" primitives (losses, options, irreversibility) are populated by the composer using available oversight signals rather than calling the canonical register/index functions. This is correct for v0:

- The canonical functions (`assembleDecisionLossRegister`, etc.) require pre-computed input data that doesn't yet exist as a first-class data source.
- The inline heuristics derive the same information from available signals (deterioration, breaches, cost accumulation).
- When richer data sources exist (e.g., explicit loss records, explicit option tracking), the composer can switch to calling the canonical functions.

## Remaining gap

`decisionDependencies` — requires multi-case data with explicit blocking relationships. No inline heuristic is appropriate without real dependency evidence. The brief field exists but is not populated. This is correct — the system should not infer dependency without evidence.
