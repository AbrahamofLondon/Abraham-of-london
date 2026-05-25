# Foundry Fix Standard

## Purpose

Every semantic fix in the Intelligence Foundry must be named, source-traced, limited, tested, and documented. No hidden fix. No silent normalisation. No untraced fallback. No test-only adjustment that is not represented in code, trace, limitations, documentation, and tests.

## Definition: Semantic Fix

A fix is **semantic** if it changes or introduces any of the following:

1. **Mapping** between product outputs and another engine's inputs
2. **Financial interpretation** (e.g., total exposure → monthly cost)
3. **Threshold interpretation** (e.g., qualification gate, severity boundary)
4. **Qualification logic** (e.g., boardroom eligibility, strategy room admission)
5. **Status promotion or downgrade** (e.g., PRODUCTION_NEEDS_WRAP → PRODUCTION_CALLABLE)
6. **Adapter callable status** (e.g., selfTest pass criteria)
7. **Formula or score interpretation** (e.g., component weighting, confidence derivation)
8. **Fixture assumptions** (e.g., synthetic data representing real patterns)
9. **Safety limitation** (e.g., what the adapter does NOT do)
10. **Fallback behaviour** (e.g., default value when source is missing)
11. **Derived field calculation** (e.g., averageDissonance → specificityScore)
12. **Data shape transformation** (e.g., flattening nested telemetry)
13. **ResearchRun severity/action logic** (e.g., CRITICAL vs HIGH classification)
14. **Performance threshold** (e.g., iteration cap, timeout limit)
15. **Boardroom/Strategy/ER eligibility decision** (e.g., qualifies vs does not qualify)

## Requirements

Every semantic fix must include:

### A. Named Rule ID

Format: `domain:short_description_v{major}`

Examples:
- `bridge:financial_exposure_monthly_normalisation_v1`
- `bridge:er_state_to_spine_condition_class_v1`
- `adapter:fast_diagnostic_validation_scoring_only_v1`

### B. Source Trace

Every derived output must expose:
- `from` — source field path
- `to` — target field path
- `valueKind` — `"direct" | "derived" | "fallback" | "omitted"`
- `sourceRule` — the named rule ID
- `rationale` — why this derivation exists
- `confidence` — `"high" | "medium" | "low"`

### C. Limitation

What the fix does not yet fully solve. Must be explicit.

### D. Promotion Requirement

What would make the approximation stronger or production-complete.

### E. Dedicated Test

At least:
- One **positive test** (correct behaviour when source is valid)
- One **negative test** (correct behaviour when source is missing/invalid)
- One **regression test** (previous incorrect behaviour does not recur)

### F. Documentation

Docs must explain why the fix exists, what it approximates, and what would replace it.

### G. No Silent Fallback

If fallback is used, it must appear as `valueKind: "fallback"` and carry confidence. No default value may be assigned without a trace entry.

## Enforcement

- Canary tests in `tests/research/canary/foundry-fix-standard.test.ts` enforce these rules.
- Every `mappingTrace.sourceRule` must exist in `foundry-rule-registry.ts`.
- Every `valueKind: "derived"` mapping must include `rationale`.
- Every `valueKind: "fallback"` mapping must have confidence not equal to `"high"`.
- Every adapter promoted to `PRODUCTION_CALLABLE` must expose `limitations` and `promotionRequirements`.
- Every bridge output with `mappingGaps` must convert high-impact gaps into findings.
