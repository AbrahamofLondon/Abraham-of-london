# Checkpoint Correlation Standard

Date: 9 May 2026
Status: Active runtime standard

## Purpose

Checkpoint response correlation is now explicit. The system no longer treats arbitrary `responsesJson contains` matching as the primary architecture.

## Required persisted fields

Every efficacy checkpoint payload must persist:

- `checkpointId`
- `commandId`
- `commandFingerprint`
- `userEmail`
- `userId` when available
- `sourceSurface`
- `sourceLabel`
- `evidencePosture`
- `caseId` when available
- `journeyId` when available
- `strategyRoomSessionId` when available
- `executiveRunId` when available
- `dueAt`
- `status`
- `response`
- `responses`

`responses` is the canonical response history array.
`response` is retained as the latest-response compatibility mirror.

## Canonical resolver

Runtime resolver: `resolveCheckpointForResponse(input)` in `lib/product/checkpoint-service.ts`

Lookup order is fixed:

1. Direct checkpoint id
2. `strategyRoomSessionId` + user identity
3. `caseId` + user identity
4. `executiveRunId` + user identity
5. `journeyId` + user identity
6. Deprecated legacy fallback only

User identity means authenticated `email` and/or `userId`.

## Legacy fallback

The legacy `responsesJson contains` lookup remains only for backward compatibility.

Constraints:

- It is last resort only.
- It is not the first path.
- It is not the canonical architecture.
- It exists to avoid breaking older records that were written before explicit correlation fields were persisted.

## Command identity and duplicate prevention

Durable checkpoint reuse is keyed by `commandFingerprint`.

Current fingerprint inputs:

- `sourceSurface`
- `actionType`
- `caseId`
- `strategyRoomSessionId`
- `executiveRunId`
- `journeyId`
- `checkpoint.type`
- `dueAt` day bucket

This prevents duplicate Strategy Room checkpoints on re-entry or refresh while still allowing a new checkpoint when the required move materially changes.

## Surface rules

### Return Brief

- Must pass real `checkpointId` when resolved.
- If no direct checkpoint id is resolved, it may pass `strategyRoomSessionId` with explicit `lookupMode: "STRATEGY_ROOM_SESSION"`.
- It must not pretend a session id is a checkpoint id.
- If no checkpoint currently exists, the UI must show `No checkpoint created yet` and must not fabricate a success state.

### Executive Reporting

- Must persist `executiveRunId`.
- Must return the actual checkpoint id from the API response.
- Challenge submissions must use that exact id.

### Strategy Room

- Entry and session state must create or reuse checkpoints through the same checkpoint service.
- Strategy Room correlation must use `strategyRoomSessionId`, not an invented local id.
