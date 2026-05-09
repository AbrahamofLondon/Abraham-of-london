# What Changed Surface Audit

**Date:** 9 May 2026

## Built And Rendered

- Analytics contract: `lib/analytics/what-changed.ts`
- Shared UI: `components/Intelligence/WhatChangedPanel.tsx`
- Surfaces:
  - `pages/decision-centre.tsx`
  - `pages/intelligence/memory.tsx`

## Safe To Surface

- Coherence band movement
- Weakest-domain movement
- Contradiction-count movement
- Checkpoint-status movement
- Decision-velocity movement
- Financial-exposure-band movement
- Irreversibility-band movement
- Route-decision movement
- Strategy-room-status and counsel-status changes when present

## Suppress For IP

- Any explanation of internal comparison weighting
- Any hidden comparison threshold

## Built Not Rendered

- Return Brief does not render what-changed because its current delta payload is not a compliant two-record comparison surface.

## Persisted Not Used

- Some comparison inputs will remain sparse until more users accumulate second and third governed records.

## Claim Not Yet Allowed

- Any trend language when `hasPriorState` is false
- Any improvement claim without at least two dated records
