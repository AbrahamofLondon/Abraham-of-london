# IP Safety Verification Report

**Date:** 9 May 2026

## Built And Rendered

- Public trust language was hardened in:
  - `components/trust/ArbiterBadge.tsx`
  - `components/trust/GovernanceDisclosure.tsx`
  - `components/trust/DiagnosticStandardPanel.tsx`
- Contradiction preview wording was hardened in:
  - `lib/analytics/contradiction-graph-presenter.ts`
  - `components/Intelligence/ContradictionMapPreview.tsx`
- Cross-assessment wording was hardened in:
  - `lib/analytics/cross-assessment-intelligence.ts`

## Safe To Surface

- `Decision velocity`
- `Checkpoint overdue`
- `Action not yet verified`
- `Evidence carried forward`
- `Based on your recorded inputs`
- `Based on your prior checkpoint history`
- `The record includes`
- `This appears to be becoming harder to reverse`

## Suppress For IP

- Any mention of graph internals
- Any mention of kernel internals
- Any mention of arbitration rules
- Any mention of formulas, weights, or thresholds
- Any phrase claiming the system proved or verified a strategic fact without external verification

## Claim Not Yet Allowed

- “Improved” when only one dated record exists
- “Verified” unless the evidence posture is genuinely outcome-verified
- Any benchmark or cohort superiority claim

## Notes

- The new surfaces show consequence, movement, and evidence posture.
- The new surfaces do not expose mechanism.
- Existing non-core admin or legacy components were not fully rewritten in this pass; the primary public-facing routes above were hardened.
