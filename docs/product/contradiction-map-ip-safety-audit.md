# Contradiction Map IP Safety Audit

**Date:** 9 May 2026

## Built And Rendered

- Presenter: `lib/analytics/contradiction-graph-presenter.ts`
- Shared UI: `components/Intelligence/ContradictionMapPreview.tsx`
- Surfaces:
  - `pages/decision-centre.tsx`
  - `pages/diagnostics/executive-reporting/run.tsx`
  - `pages/intelligence/contradictions.tsx`

## Safe To Surface

- Plain-English contradiction title
- Severity band
- Age / first-seen proxy
- Trend label
- Related decision signals
- Source surfaces

## Suppress For IP

- Node ids
- Edge types
- Decay mechanics
- Amplification logic
- Resolution logic
- Raw graph terminology

## Built Not Rendered

- No interactive visual graph was added in this pass by design.

## Persisted Not Used

- The underlying contradiction graph can hold richer temporal detail than the preview currently exposes.

## Claim Not Yet Allowed

- Any claim that the contradiction is externally verified unless a separate verified outcome exists

## Hostile Verification

- Can a user see unresolved contradiction status quickly: `YES`
- Can a competitor copy the visual without the accumulated data: `YES`
- Does the visible UI help a competitor rebuild the machinery: `NO`
