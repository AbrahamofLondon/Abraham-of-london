# Advantage Activation Next Actions

Date: 2026-05-09

## P0 — Must Fix Before Market Exposure

1. Scope every `ClientIntelligenceStack` instance to the active case.
   Reason: Return Brief, Executive Reporting, Strategy Room entry, Intelligence Memory, and Intelligence Contradictions can currently attach to `json.cases[0]`.

2. Remove unsupported benchmark language from Executive Reporting.
   Reason: `behind AI baseline` is not yet a defensible public claim.

3. Remove duplicate contradiction surfacing from Executive Reporting.
   Reason: The page currently carries both legacy contradiction rendering and the new shared contradiction stack.

4. Stop hard-coding contradiction evidence posture.
   Reason: `system inferred` overstates confidence and weakens trust.

5. Add explicit empty/thin states to `/intelligence/memory` and `/intelligence/contradictions`.
   Reason: Silent shell pages are weak product proof.

## P1 — Improve Usefulness

1. Add compared dates to `WhatChangedSummary`.
   Reason: Users need to know what two records are being compared.

2. Persist fuller prior comparable state.
   Reason: Current previous-state capture is null for many promised fields, making `What changed` only partially real.

3. Add provenance/date to visible irreversibility outputs.
   Reason: Estimated consequence needs source/date context to avoid feeling theatrical.

4. Add first detected, last seen, current status, and suggested next action to contradiction cards.
   Reason: This is required for the contradiction view to become a true operating surface.

5. Tighten decision velocity summary wording.
   Reason: Current aggregate metric is described as though it were the last cycle.

## P2 — Deepen Moat

1. Turn `What changed` into a true dated comparison surface with record pairs.
2. Add case selection / active-case context controls for Intelligence Memory and Contradictions.
3. Add evidence provenance chips consistently across all shared intelligence cards.
4. Expand cross-assessment intelligence with more safely phrased reinforcement patterns once persisted history improves.

## P3 — Later

1. Consider richer contradiction timelines only after temporal metadata is complete.
2. Consider operator-only audit consoles being formally relocated out of `components/Intelligence/*`.
3. Build a stronger memory landing page only after case scoping and dated comparisons exist.

## Release Gate

Do not treat this layer as finished market-proof until:

- all shared intelligence consumers are case-scoped
- Executive Reporting benchmark/duplication issues are removed
- `What changed` gains dated comparison integrity
- contradiction and irreversibility provenance is visible
- standalone intelligence pages stop collapsing into thin shells

