# Executive Reporting Intelligence Cleanup Audit

Date: 2026-05-09

## Before

Problems:

- shared intelligence stack was unscoped
- contradiction appeared in multiple lanes
- unsupported `AI baseline` language appeared in the board snapshot
- irreversibility was shown without explicit provenance/date

## After

Changes made:

- shared `ClientIntelligenceStack` now receives explicit scope for Executive Reporting
- report API now returns `caseId`, `executiveRunId`, and `intelligenceScope`
- direct `AI baseline` board-snapshot copy was removed
- duplicate contradiction block was removed from the result surface
- irreversibility now shows source/date/evidence-posture context
- comparative benchmark copy was rewritten into a governed comparison-set framing

## Current Intelligence Hierarchy

Active runtime hierarchy:

1. Governed priority / board snapshot
2. Evidence carried forward
3. Case intelligence summary
   - arbiter badge
   - cross-assessment intelligence
   - contradiction preview
4. Boardroom dossier
5. remaining report sections

## Remaining Risk

Still partial:

- Executive Reporting still contains a governed comparison-set block when claim governance permits it.
- The page is cleaner, but still one of the densest runtime surfaces in the product.
- `What changed` is not yet part of the ER intelligence lane because dated comparable history is still not robust enough to trust broadly.

## Verdict

Before: `FAIL`

- unscoped
- duplicated
- overclaim-prone

After: `PARTIAL`

- scope hardened
- contradiction duplication removed
- unsupported AI-baseline phrasing removed

Remaining blocker to full pass:

- broader ER page simplification and stronger dated-history support for additional case intelligence blocks

