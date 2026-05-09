# Advantage Activation Implementation Report

**Date:** 9 May 2026
**Status:** `BUILT_AND_RENDERED`

## Outcome

The pass now surfaces the first user-safe intelligence layer across the live product without exposing formulas, thresholds, graph mechanics, prompt structure, or arbitration rules.

## Built And Rendered

- `Decision velocity`
  - Shared analytics: `lib/analytics/decision-velocity.ts`
  - Shared surface: `components/Intelligence/DecisionVelocityCard.tsx`
  - Rendered in:
    - `pages/decision-centre.tsx`
    - `pages/diagnostics/fast.tsx`
    - `app/briefing/return/[sessionId]/page.tsx`

- `What changed`
  - Shared analytics: `lib/analytics/what-changed.ts`
  - Shared surface: `components/Intelligence/WhatChangedPanel.tsx`
  - Rendered in:
    - `pages/decision-centre.tsx`
    - `pages/intelligence/memory.tsx`

- `Arbiter trust badge`
  - Shared surface: `components/trust/ArbiterBadge.tsx`
  - Rendered in:
    - `pages/diagnostics/fast.tsx`
    - `pages/diagnostics/executive-reporting/run.tsx`

- `Irreversibility outside Oversight Brief`
  - Existing engine: `lib/product/irreversibility-index.ts`
  - Rendered in:
    - `pages/decision-centre.tsx`
    - `pages/diagnostics/executive-reporting/run.tsx`
    - `pages/strategy-room/session/[id].tsx`

- `Cross-assessment intelligence`
  - Shared analytics: `lib/analytics/cross-assessment-intelligence.ts`
  - Shared surface: `components/Intelligence/CrossAssessmentInsight.tsx`
  - Rendered in:
    - `pages/decision-centre.tsx`
    - `pages/diagnostics/executive-reporting/run.tsx`
    - `pages/strategy-room/index.tsx`
    - `pages/intelligence/memory.tsx`

- `User-safe contradiction map preview`
  - Shared presenter: `lib/analytics/contradiction-graph-presenter.ts`
  - Shared surface: `components/Intelligence/ContradictionMapPreview.tsx`
  - Rendered in:
    - `pages/decision-centre.tsx`
    - `pages/diagnostics/executive-reporting/run.tsx`
    - `pages/intelligence/contradictions.tsx`

## Built Not Rendered

- No dedicated contradiction preview was added to `pages/strategy-room/index.tsx`; only cross-assessment intelligence is surfaced there.
- No dedicated what-changed rendering was added to Return Brief because the available delta payload is not yet a valid two-record comparison.

## Persisted Not Used

- `DecisionVelocitySnapshot` still exists for memory and case-level recordkeeping, but the user-facing surface now relies on the aggregate summary.
- Existing living component `components/living/WhatChangedPanel.tsx` remains in the repo for older surfaces but is not the canonical advantage-activation surface.

## Safe To Surface

- Decision velocity band and counts
- Source labels
- Evidence posture
- Cross-surface memory language
- Contradiction severity and plain-English descriptions
- Irreversibility band and cautionary estimate language

## Suppress For IP

- Contradiction graph node or edge mechanics
- Arbiter rule list or rule outcomes
- Weighting or threshold logic
- Irreversibility factor breakdown
- Kernel or graph wording in user-facing copy

## Claim Not Yet Allowed

- Cohort or benchmark comparisons
- Improvement claims from single-record deltas
- Outcome-verification claims where confidence remains directional

## Verification

- `npx tsc --noEmit --pretty false` passed on 9 May 2026
- `npx next build` passed on 9 May 2026
