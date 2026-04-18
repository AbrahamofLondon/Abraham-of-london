# Strategy Room Link Cleanup Pack

Status: PLANNED
Live surface truth: This is a grouped cleanup plan for remaining `/consulting/strategy-room` references. It is not approval to run a mass replacement across live surfaces.

## Objective

Prepare the remaining non-critical cleanup work for Strategy Room links so later execution can be done in controlled batches.

## Current Reality

There are still many references to `/consulting/strategy-room` across the repo.

Some are harmless documentation or comments.
Some are live UI surfaces.
Some sit close to diagnostics or advisory flows and should not be changed casually while live-lane stabilization is still active.

## Grouped Reference Audit

### Group 1: Documentation and comments

Low risk. Safe to update in a docs-only pass.

- `CLAUDE_SESSION_LOG.md`
- `docs/program/phase-6-14-canonical-naming-matrix.md`
- `docs/program/phase-6-revenue-architecture-pack.md`
- `lib/auth/server.ts` comment block
- `pages/strategy-room/index.tsx` file header comment

Recommended action:

- update comments/docs to `/strategy-room`

### Group 2: Homepage and presentation-layer components

Likely safe later, but should be done in a contained presentation pass.

- `components/homepage/StrategicFunnelStrip.tsx`
- `components/homepage/HeroSection.tsx`
- `components/homepage/CinematicHero.tsx`
- `components/consulting/StrategyRoomIntegration.tsx`
- `components/navigation/SurfaceAwareNav.tsx`
- `components/inner-circle/WorkspaceNav.tsx`

Recommended action:

- batch-test these as a presentation-only route cleanup after live lane sign-off

### Group 3: Diagnostics-adjacent components

Potentially higher risk because these shape escalation paths and buyer routing.

- `components/diagnostics/SeriousBuyerGate.tsx`
- `components/diagnostics/InheritedSignalBanner.tsx`
- `components/diagnostics/ExecutiveOfferLadder.tsx`
- `components/diagnostics/ExecutiveBuyerFitSection.tsx`
- `components/diagnostics/ConstitutionalDiagnostic.tsx`
- `components/diagnostics/BuyerCTACluster.tsx`
- `components/alignment/EnterpriseAdvisoryCTA.tsx`
- `lib/diagnostics/executive-reporting-market-proof.ts`
- `lib/diagnostics/constitutional-diagnostic-derivation.ts`
- `lib/diagnostics/client.ts`

Recommended action:

- do not touch until the owner of live funnel truth confirms route equivalence and redirect behavior

### Group 4: Consulting and advisory pages

Medium risk because they are live pages but not the deepest core logic.

- `pages/consulting/index.tsx`
- `pages/consulting/interventions.tsx`
- `pages/strategy/index.tsx`
- `pages/playbooks/[slug].tsx`
- `pages/playbooks/index.tsx`
- `pages/editorials/[slug].tsx`
- `pages/artifacts/global-market-outlook-q1-2026-public.tsx`
- `pages/dashboard.tsx`
- `pages/dev/dashboard.tsx`
- `pages/constitution/command-centre.tsx`

Recommended action:

- execute as a scoped content/UI route cleanup pass after Milestone A

### Group 5: Sitemap and generated/static artifacts

Needs careful regeneration rather than ad hoc edits.

- `public/sitemap-0.xml`
- `homepage.html`

Recommended action:

- regenerate rather than hand-edit

## Ready-to-Run Later Sequence

1. docs and comments
2. homepage/presentation components
3. consulting and non-critical page copy
4. diagnostics-adjacent components only after live-lane sign-off
5. sitemap/regenerated output

## Tiny Safe Subset

The safe subset already applied in this planning layer is:

- strategic docs now prefer `/strategy-room`

No live mass replacement is included in this pack.
