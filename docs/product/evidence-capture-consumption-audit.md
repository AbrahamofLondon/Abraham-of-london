# Evidence Capture Consumption Audit

## Scope

Audited surfaces:

- `pages/diagnostics/executive-reporting.tsx`
- `pages/diagnostics/executive-reporting/run.tsx`
- `pages/strategy-room/index.tsx`
- `pages/strategy-room/session/[id].tsx`
- `app/briefing/return/[sessionId]/page.tsx`
- `lib/server/strategy-room/return-brief.server.ts`
- `lib/product/oversight-brief-composer.ts`
- `lib/product/oversight-signal-builder.ts`
- `lib/product/control-room-state-loader.ts`
- `components/diagnostics/GovernanceEvidenceBridge.tsx`
- `lib/product/evidence-capture-contract.ts`

## Summary

Before this pass, evidence capture was present in the assessment bridge and session-thread continuity, but downstream use was mostly silent.

- `priorAttempts`: `CAPTURED_AND_USED_IN_LOGIC`
- `failureCause`: `CAPTURED_AND_USED_IN_LOGIC`
- `recurrenceSignal`: `CAPTURED_AND_USED_IN_LOGIC`
- `verificationCriteria`: `CAPTURED_AND_RENDERED`
- `stopSignal`: `CAPTURED_AND_USED_IN_LOGIC`
- `decisionDependency`: `CAPTURED_AND_USED_IN_LOGIC`
- `escalationTrigger`: `CAPTURED_AND_USED_IN_LOGIC`

## Field Audit

### `priorAttempts`

1. Captured:
   `components/diagnostics/GovernanceEvidenceBridge.tsx`
2. Persisted:
   assessment result payload, `lib/diagnostics/session-thread.ts`, `pages/api/diagnostics/submit.ts` journey evidence nodes, executive canonical snapshot, strategy-room canonical snapshot
3. Available:
   Executive Reporting result intake/canonical, Strategy Room entry/session canonical, Return Brief canonical, Oversight account cases, Control Room aggregate loader
4. Rendered:
   Executive Reporting `Evidence carried forward`; Strategy Room `Execution readiness`
5. Should influence logic:
   Strategy Room warning not to repeat failed intervention; Oversight `PATTERN_RECURRED`; Return Brief comparison against earlier correction history
6. Must remain hidden:
   sponsor-safe Control Room text views; any raw respondent exposure path

### `failureCause`

1. Captured:
   `components/diagnostics/GovernanceEvidenceBridge.tsx`
2. Persisted:
   assessment result payload, session thread, journey evidence nodes as `persistent_root_cause`, executive canonical, strategy canonical
3. Available:
   Executive Reporting result, Strategy Room entry/session, Return Brief, Oversight
4. Rendered:
   Executive Reporting `Evidence carried forward`; Strategy Room `Known failure cause`; Return Brief evidence continuity
5. Should influence logic:
   Oversight `INTERVENTION_FAILURE_RISK`; Return Brief comparison against current blockage
6. Must remain hidden:
   raw text should be withheld if unsafe; not shown in Control Room aggregate

### `recurrenceSignal`

1. Captured:
   `components/diagnostics/GovernanceEvidenceBridge.tsx`
2. Persisted:
   assessment result payload, session thread, journey evidence nodes as `pattern_recurrence`, executive canonical, strategy canonical
3. Available:
   Executive Reporting, Strategy Room, Return Brief, Oversight, Control Room aggregate
4. Rendered:
   Executive Reporting recurrence note; Strategy Room recurring pattern warning; Return Brief recurrence continuity
5. Should influence logic:
   Oversight `PATTERN_RECURRED`; Return Brief unresolved recurrence statement; Control Room recurring-pattern count
6. Must remain hidden:
   no raw text in sponsor-safe Control Room view

### `verificationCriteria`

1. Captured:
   `components/diagnostics/GovernanceEvidenceBridge.tsx`
2. Persisted:
   assessment payload, journey evidence node as `evidence`, executive canonical, strategy canonical
3. Available:
   Executive Reporting, Strategy Room, Return Brief, Oversight, Control Room aggregate
4. Rendered:
   Executive Reporting `Success evidence defined`; Strategy Room execution standard; Return Brief verification continuity
5. Should influence logic:
   Return Brief confrontation when outcome evidence does not satisfy prior criteria; Oversight `COMMITMENT_UNVERIFIED`; Control Room missing-verification count
6. Must remain hidden:
   unsafe content withheld from display; no raw text in Control Room aggregate

### `stopSignal`

1. Captured:
   `components/diagnostics/GovernanceEvidenceBridge.tsx`
2. Persisted:
   assessment payload, journey evidence node as `constraint`, strategy canonical
3. Available:
   Strategy Room, Return Brief, Oversight
4. Rendered:
   Strategy Room `Something must stop before execution can hold`
5. Should influence logic:
   Return Brief asks whether the stopping condition has actually stopped; Oversight `EXECUTION_DRIFT`
6. Must remain hidden:
   withheld if unsafe; not aggregated as raw text in Control Room

### `decisionDependency`

1. Captured:
   `components/diagnostics/GovernanceEvidenceBridge.tsx`
2. Persisted:
   assessment payload, journey evidence node as `constraint`, executive canonical, strategy canonical
3. Available:
   Executive Reporting, Strategy Room, Oversight, Control Room aggregate
4. Rendered:
   Executive Reporting dependency line; Strategy Room dependency-to-resolve line
5. Should influence logic:
   Strategy Room execution readiness; Oversight `DEPENDENCY_RISK`; Control Room unresolved-dependency count
6. Must remain hidden:
   no raw text in sponsor-safe Control Room view

### `escalationTrigger`

1. Captured:
   `components/diagnostics/GovernanceEvidenceBridge.tsx`
2. Persisted:
   assessment payload, journey evidence node as `escalation_trigger`, executive canonical, strategy canonical
3. Available:
   Executive Reporting, Strategy Room, Oversight, Control Room aggregate
4. Rendered:
   Executive Reporting escalation condition; Strategy Room escalation threshold
5. Should influence logic:
   Oversight `COUNSEL_OR_BOARDROOM_REVIEW`; Control Room escalation-trigger count
6. Must remain hidden:
   no raw text in sponsor-safe Control Room view

## Surface Classification

### Executive Reporting

- Capture source available from ladder context and intake metadata
- Result surface now renders only non-empty fields
- Unsafe evidence is withheld from display
- Classification: `CAPTURED_AND_RENDERED`

### Strategy Room

- Entry and session views now show execution-readiness constraints
- Evidence is carried in canonical snapshot for session continuity
- Classification: `CAPTURED_AND_USED_IN_LOGIC`

### Return Brief

- Uses prior evidence to compare against current verification, recurrence, and stop conditions
- Language remains cautious and non-fabricated
- Classification: `CAPTURED_AND_USED_IN_LOGIC`

### Oversight Brief

- Evidence now influences signal generation without fabricating institutional proof
- Raw evidence text remains largely hidden behind signal summaries
- Classification: `CAPTURED_AND_USED_IN_LOGIC`

### Control Room

- Uses only safe aggregate counts with small-sample suppression
- Raw field text remains hidden
- Classification: `UNSAFE_TO_RENDER` for raw text, `CAPTURED_AND_USED_IN_LOGIC` for aggregate counts
