# Checkpoint Lifecycle Trace

Date: 9 May 2026
Status: Runtime trace after permanent closure pass

## Lifecycle

`CREATED -> DUE -> OVERDUE -> RESPONDED -> CONSUMED`

## 1. Created

Runtime writer: `createCheckpointForCommand()` in `lib/product/checkpoint-service.ts`

Persistence target:

- `DiagnosticRecord.diagnosticType = "efficacy_checkpoint"`
- `DiagnosticRecord.status = "draft"`
- `DiagnosticRecord.responsesJson = CheckpointPayload`

Creation behaviour:

- Computes `commandFingerprint`
- Reuses an existing checkpoint when the same fingerprint already exists for the same user identity
- Creates a new checkpoint only when the required move materially changes

## 2. Due

Runtime reader: `loadDueCheckpointsForUser()` in `lib/product/checkpoint-service.ts`

Due logic:

- Unresponded checkpoint
- `dueAt <= now + 3 days`
- `dueAt >= now` yields `DUE`

Consumer surfaces:

- Decision Centre `Requires response`
- Strategy Room checkpoint state
- Return Brief checkpoint state

## 3. Overdue

Runtime reader: `loadDueCheckpointsForUser()`

Overdue logic:

- Unresponded checkpoint
- `dueAt < now`

Consumer surfaces:

- Decision Centre `Requires response`
- Strategy Room checkpoint state
- Oversight checkpoint attention signal

## 4. Responded

Runtime writer: `recordCheckpointResponse()` in `lib/product/checkpoint-service.ts`

Response behaviour:

- Resolves checkpoint through canonical lookup order
- Sanitises response text
- Appends to `responses`
- Mirrors the latest response into `response`
- Updates payload `status` to `RESPONDED`
- Updates `DiagnosticRecord.status` to `completed`

Outcome classifications:

- `COMPLETED -> ACTION_CONFIRMED`
- `PARTIALLY_COMPLETED -> OUTCOME_IMPROVED`
- `BLOCKED -> ACTION_BLOCKED`
- `ABANDONED -> ACTION_ABANDONED`
- `NO_LONGER_RELEVANT -> OUTCOME_UNCHANGED`
- `DISPUTED_FINDING -> SYSTEM_FINDING_DISPUTED`
- `NOT_RESPONDED -> INSUFFICIENT_EVIDENCE`

## 5. Consumed

### Decision Centre

API: `pages/api/decision-centre/cases.ts`

- Splits runtime output into:
- `checkpoints.requiresResponse`
- `checkpoints.recentResponses`

UI: `pages/decision-centre.tsx`

- Shows source surface
- Shows due or responded date
- Shows response status
- Shows evidence note when safe
- Shows source label
- Shows evidence posture

### Return Brief

Server: `lib/server/strategy-room/return-brief.server.ts`

- Resolves the Strategy Room checkpoint by `strategyRoomSessionId + email`
- Returns explicit checkpoint reference metadata

UI: `app/briefing/return/[sessionId]/page.tsx`

- Uses real checkpoint id when present
- Falls back to `strategyRoomSessionId` with explicit lookup mode
- Shows graceful `No checkpoint created yet` state when no checkpoint exists

### Oversight Brief

Composer: `lib/product/oversight-brief-composer.ts`

- Loads checkpoint outcomes through `loadDueCheckpointsForUser()`
- Injects `CHECKPOINT_OVERDUE` without `as any`
- Uses disciplined language:
- `checkpoint overdue`
- `user-reported blocker`
- `response not yet received`

## Local runtime evidence captured on 9 May 2026

Harness results:

- Fast Diagnostic checkpoint reuse: confirmed
- Executive Reporting real checkpoint id and disputed response persistence: confirmed
- Strategy Room entry checkpoint reuse: confirmed
- Strategy Room session checkpoint resolution via `strategyRoomSessionId`: confirmed
- Return Brief-style response correlation via `strategyRoomSessionId`: confirmed
- Decision Centre partition counts: `requiresResponse = 2`, `recentResponses = 3`
- Overdue computation: confirmed with a locally created overdue unresolved checkpoint
- Blocker sanitisation: confirmed
