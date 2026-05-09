# Homepage Rebuild Implementation Report

Date: 2026-05-09
Status: Rebuild pass completed

## What Changed

The homepage was rebuilt from a mixed route-menu / trust-doctrine / product-ladder page into a controlled eight-section evidence-entry surface.

Implemented section order:

1. Hero
2. Market Defect
3. Refusal Demo
4. Output Preview
5. Decision Memory
6. Earned Progression
7. Trust Architecture
8. Final CTA

## Code Changes

Primary route changes:

- `pages/index.tsx`
  - removed large inline homepage implementation
  - reduced to a thin route wrapper around `CategoryFrontDoor`

- `components/homepage/CategoryFrontDoor.tsx`
  - reduced from whole-homepage logic to orchestration only

New focused homepage components:

- `components/homepage/homepagePrimitives.tsx`
- `components/homepage/HomepageHero.tsx`
- `components/homepage/MarketDefectBlock.tsx`
- `components/homepage/RefusalDemo.tsx`
- `components/homepage/OutputArtifactPreview.tsx`
- `components/homepage/MemoryContinuityPreview.tsx`
- `components/homepage/EarnedProgressionBlock.tsx`
- `components/homepage/TrustArchitectureBlock.tsx`
- `components/homepage/HomepageFinalCTA.tsx`

Outer-frame adjustments:

- `components/Header.tsx`
  - changed cold-visitor navigation vocabulary
  - kept `Test a Decision` as the dominant action
  - removed later-stage products from primary navigation

- `components/Navbar.tsx`
  - aligned legacy nav labels to the same cold-visitor vocabulary

- `components/EnhancedFooter.tsx`
  - added a restrained homepage footer mode on `/`
  - reduced homepage route noise while preserving deeper navigation off-home

## Strategic Outcomes

- The homepage now makes one clear market claim: the system can refuse to proceed.
- Refusal is shown as product behavior, not just category rhetoric.
- Output is now visible before trust doctrine.
- Memory and continuity are now visible before trust doctrine.
- Later-stage products are framed as earned, conditional, or locked.
- The homepage body no longer exposes product-selection behavior as the primary interaction model.

## Verification

Passed:

- `pnpm typecheck`
- `node scripts/public-copy-guard.mjs`
- `node scripts/evidence-posture-guard.mjs`
- `node scripts/earned-progression-guard.mjs`

Build status:

- `npx next build --webpack` was started and compiled far into the route graph, but it did not complete within the constrained runtime window used in this pass.
- No homepage-specific type or guard regressions were found.

## Remaining Checks

- Complete a full production build in an unconstrained run window.
- Browser QA for desktop and mobile rhythm.
- Confirm final visual hierarchy and footer restraint on the live route.
