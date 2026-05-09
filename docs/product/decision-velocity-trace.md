# Decision Velocity Trace

**Date:** 9 May 2026

## Built And Rendered

- Analytics contract: `lib/analytics/decision-velocity.ts`
- API persistence and response wiring: `pages/api/decision-centre/cases.ts`
- Shared UI: `components/Intelligence/DecisionVelocityCard.tsx`
- Surfaces:
  - `pages/decision-centre.tsx`
  - `pages/diagnostics/fast.tsx`
  - `app/briefing/return/[sessionId]/page.tsx`

## Safe To Surface

- Average time to first response
- Open checkpoint count
- Overdue checkpoint count
- Completed checkpoint count
- Blocked checkpoint count
- Velocity band
- Source label and evidence posture

## Suppress For IP

- Any velocity formula
- Any hidden weighting across checkpoint states
- Any threshold disclosure beyond the public band labels

## Built Not Rendered

- The snapshot-level detail remains internal and is not directly rendered on the public card.

## Persisted Not Used

- Hours between diagnosis and completion remain available for server-side memory but are not directly exposed in the UI.

## Claim Not Yet Allowed

- No benchmark comparison
- No improvement claim across periods unless a second comparable period exists
