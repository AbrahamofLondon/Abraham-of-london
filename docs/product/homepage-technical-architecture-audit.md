# Homepage Technical Architecture Audit

Date: 2026-05-09
Method: static architecture audit of the homepage route and imported surfaces. No production bundle trace or Lighthouse run was executed in this pass.

## Current Render Path

- `pages/index.tsx`
- `components/Layout.tsx`
- `components/Header.tsx`
- `components/homepage/CategoryFrontDoor.tsx`
- `pages/index.tsx` local sections:
  - `HomeEvidenceSection`
  - `HomeDecisionSection`
  - `WhoThisIsFor`
  - engagement lanes strip
  - trust strip
- `components/EnhancedFooter.tsx`

## Architecture Verdict

The homepage is conceptually split but technically untidy.

## Findings

### 1. Monolithic route file

`pages/index.tsx` is large and still contains many retired homepage section definitions that are no longer in the render path.

Impact:

- raises maintenance cost
- makes future homepage edits error-prone
- obscures what is actually live

### 2. Dead homepage code retained in live route

Inactive section definitions still present in `pages/index.tsx` include:

- `HomeHero`
- `WhatThisPlatformIs`
- `HowItWorksLadder`
- `ConsequenceEscalation`
- `ProductClarity`
- `ProofLayer`
- `HomeDecisionLayer`
- `HomeFinalCta`

Impact:

- increases cognitive load
- risks future accidental reuse of stale messaging

### 3. Client-heavy front door

`components/homepage/CategoryFrontDoor.tsx` is marked `use client`, even though most of its content is static. Client logic is used for:

- `IntersectionObserver` reveal
- demo visibility state
- launch event tracking

Impact:

- more client JS than necessary for the highest-value route
- slower time-to-settle risk on low-end mobile devices

### 4. Proof surfaces load after render

`components/proof/PublicProofBlocks.tsx` fetches `/api/proof/public` on the client.

Impact:

- trust/proof content may be absent on first paint
- proof experience depends on client fetch success
- late-loading proof is structurally weaker than server-rendered proof

### 5. Fonts are loaded redundantly

Google fonts are loaded in:

- `pages/_document.tsx`
- `styles/fonts.css`

Impact:

- duplicate requests / duplicate configuration risk
- harder font loading governance

### 6. Footer is expensive in route complexity

`components/EnhancedFooter.tsx` adds:

- two gateway card grids
- five directory columns
- social blocks
- more conversion CTAs

Impact:

- not necessarily a performance failure, but high navigational entropy on the homepage

### 7. Header message drift

`components/Header.tsx` subtitle says `Diagnostics · Intelligence · Advisory`.

Impact:

- product identity inconsistency
- legacy advisory language leaks into the front door

### 8. Earned progression doctrine is disconnected from homepage routing

`lib/commercial/recommendation-engine.ts` clearly encodes:

- no paid step when evidence is insufficient
- earned access logic
- escalation only when warranted

Homepage issue:

- live homepage CTAs bypass that posture by linking directly to later-stage routes

Impact:

- message / architecture inconsistency
- trust degradation

### 9. No strong product artifact on homepage despite available component ecosystem

The repo contains public intelligence and trust components that could support harder proof, but the homepage currently relies mostly on text blocks.

Impact:

- underuse of existing product-surface assets
- missed opportunity to show memory, contradiction, and change over time

## Performance Risk Register

| Risk | Severity | Note |
| --- | --- | --- |
| Client-side front-door rendering | Medium | Avoidable JS on the main route |
| Client-fetched proof blocks | Medium | Proof may appear late or not at all |
| Large `pages/index.tsx` with dead sections | Medium | Maintenance and accidental-regression risk |
| Redundant font loading | Medium | Avoidable network overhead |
| Dense footer and header structures | Low | More UX cost than raw perf cost |
| Lack of image-heavy content | Low-positive | Homepage is mostly text; image weight is not the issue |

## IP Leakage Audit

Good:

- internal scoring / routing is not directly exposed
- standards page explicitly withholds internals

Risks:

- capability language names internal concepts like `Contradiction Memory` and `Cross-Assessment Review` without enough visible proof
- naming surfaces can leak the existence of proprietary modules without proving why they matter

## Recommended Technical Actions

### P0

- Remove dead homepage section definitions from `pages/index.tsx` or move them to archived modules.
- Remove the premature front-door final CTA from the live render path.
- Align homepage CTA routing with `lib/commercial/recommendation-engine.ts` doctrine.

### P1

- Convert static portions of `CategoryFrontDoor` back to server-renderable markup and isolate only the demo reveal/tracking as client logic.
- Server-render proof summaries where possible.
- Consolidate font loading to one method.

### P2

- Replace one or two text grids with real product proof components.
- Simplify footer route density specifically for the homepage context.

## Bottom Line

The homepage does not have a raw frontend-weight problem so much as a structure problem: too much dead logic, too much client responsibility for a threshold route, and too much conceptual duplication between doctrine and conversion.
