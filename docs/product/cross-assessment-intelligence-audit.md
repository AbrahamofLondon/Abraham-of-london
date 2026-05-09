# Cross-Assessment Intelligence Audit

**Date:** 9 May 2026

## Built And Rendered

- Analytics contract: `lib/analytics/cross-assessment-intelligence.ts`
- Shared UI: `components/Intelligence/CrossAssessmentInsight.tsx`
- Surfaces:
  - `pages/decision-centre.tsx`
  - `pages/diagnostics/executive-reporting/run.tsx`
  - `pages/strategy-room/index.tsx`
  - `pages/intelligence/memory.tsx`

## Safe To Surface

- Surface pairs involved
- Evidence posture
- Severity band
- User-safe interpretation language:
  - `may mean`
  - `may now be`
  - `the record includes`
  - `this suggests`

## Suppress For IP

- Signal-matching logic
- Inference chain detail
- Graph or kernel terminology
- Thresholds for conflict creation

## Built Not Rendered

- No contradiction-explainer is added to Return Brief in this pass.

## Persisted Not Used

- Reinforcing signals are currently rendered lightly compared with conflicts; the conflict path remains the primary user-facing surface.

## Claim Not Yet Allowed

- Any certainty claim stronger than the underlying evidence posture
