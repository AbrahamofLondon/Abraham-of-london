# Efficacy Spine Defect Register

Date: 9 May 2026
Status: Permanent closure pass

## Closed defects

### D2-HARDEN

Status: CLOSED

Problem:

- Return Brief correlation was relying on a brittle `responsesJson contains` fallback because session ids were being treated as checkpoint ids.

Closure:

- Added explicit checkpoint correlation fields to persisted payloads
- Added canonical `resolveCheckpointForResponse(input)`
- Moved primary resolution order to explicit identity fields
- Kept `responsesJson contains` as deprecated last resort only
- Return Brief now passes real `checkpointId` when resolved, otherwise explicit `strategyRoomSessionId` lookup mode

### D3

Status: CLOSED

Problem:

- Strategy Room entry and session surfaces displayed required moves without creating durable checkpoints.

Closure:

- `buildStrategyRoomCommand()` now handles the zero-decision entry state
- `app/api/strategy-room/execution/route.ts` creates or reuses entry checkpoints
- `app/api/strategy-room/execution/[id]/decisions/route.ts` refreshes checkpoints when execution state changes
- `app/api/strategy-room/execution/[id]/route.ts` refreshes checkpoints on session PATCH
- Strategy Room state route now returns real checkpoint state for rendering

### D4

Status: CLOSED

Problem:

- Decision Centre mixed due and responded checkpoints under `Requires your response`.

Closure:

- API now returns:
- `checkpoints.requiresResponse`
- `checkpoints.recentResponses`
- UI renders the two sections separately

### D5

Status: CLOSED

Problem:

- Oversight checkpoint attention signal used `CHECKPOINT_OVERDUE as any`.

Closure:

- Removed `as any`
- Oversight composer now emits the canonical signal type directly
- Wording now avoids overclaiming verification

### BUILD

Status: CLOSED

Problem:

- Full Next build had not been completed.

Closure:

- `npx tsc --noEmit --pretty false` passed on 9 May 2026
- `npx next build` passed on 9 May 2026

## Residual compatibility item

### Legacy fallback

Status: TEMPORARY_COMPATIBILITY_ONLY

Description:

- `responsesJson contains` remains in `resolveCheckpointForResponse()` as a deprecated last resort for older checkpoint rows.

Exit condition:

- Remove after legacy checkpoint rows without explicit correlation fields are no longer in circulation.

Constraint:

- It must never become the primary lookup path again.
