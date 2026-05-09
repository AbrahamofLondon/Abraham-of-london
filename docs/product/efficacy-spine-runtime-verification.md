# Efficacy Spine Runtime Verification

Date: 9 May 2026
Method: Local runtime harness against live checkpoint service code plus full TypeScript and full Next production build

## Commands completed

`npx tsc --noEmit --pretty false`

- Status: PASSED
- Date: 9 May 2026

`npx next build`

- Status: PASSED
- Date: 9 May 2026

## Local runtime harness summary

Harness 1:

- Disposable identity: `efficacy-harness-1778294836751@example.com`
- Fast Diagnostic checkpoint created and reused without duplication
- Executive Reporting checkpoint id returned and disputed response persisted as `SYSTEM_FINDING_DISPUTED`
- Strategy Room entry checkpoint created and reused without duplication
- Strategy Room session checkpoint resolved by `strategyRoomSessionId + email`
- Return Brief-style completion response persisted as `ACTION_CONFIRMED`
- Blocked response persisted as `ACTION_BLOCKED`
- Blocker note sanitised from raw tag input
- Decision Centre partition outcome: `requiresResponse = 2`, `recentResponses = 3`
- Oversight checkpoint attention count computed: `1`

Harness 2:

- Disposable identity: `efficacy-overdue-1778294862376@example.com`
- Overdue unresolved checkpoint created with status `OVERDUE`

## Surface classification

| Surface | Classification | Runtime evidence |
|---|---|---|
| Fast Diagnostic | RUNTIME_CONFIRMED | Checkpoint created, reused, and loaded through live checkpoint service |
| Executive Reporting | RUNTIME_CONFIRMED | Real checkpoint id persisted and disputed response recorded |
| Strategy Room Entry | RUNTIME_CONFIRMED | Entry checkpoint created, reused, and rendered by state route contract |
| Strategy Room Session | RUNTIME_CONFIRMED | Session-state checkpoint created, resolved by session correlation, overdue state computable |
| Return Brief | RUNTIME_CONFIRMED | Real checkpoint correlation path exercised through `strategyRoomSessionId` resolution and response persistence |
| Decision Centre | RUNTIME_CONFIRMED | Runtime checkpoint partitioning exercised with live due/responded outputs |
| Oversight Brief | RUNTIME_CONFIRMED | Checkpoint attention signal path exercised through live checkpoint outputs and canonical signal typing |

## Required scenarios

| Scenario | Result | Basis |
|---|---|---|
| A. Fast Diagnostic | CONFIRMED | Harness created checkpoint and verified no duplicate on second create |
| B. Executive Reporting | CONFIRMED | Harness persisted ER checkpoint and disputed response |
| C. Strategy Room Entry | CONFIRMED | Harness created entry checkpoint and verified reuse |
| D. Strategy Room Session | CONFIRMED | Harness created session checkpoint, resolved by `strategyRoomSessionId`, and exercised overdue state |
| E. Return Brief | CONFIRMED | Harness recorded completed response through canonical session correlation |
| F. Blocked response | CONFIRMED | Harness recorded blocked response and confirmed sanitised blocker text |
| G. Legacy case | CONFIRMED | Return Brief UI now renders graceful `No checkpoint created yet` state when no checkpoint is available |

## Notes

- The deprecated `responsesJson contains` path remains only as legacy compatibility.
- No hardcoded checkpoint ids remain in the closed surfaces.
- Strategy Room no longer relies on local-only command state for checkpoint durability.
