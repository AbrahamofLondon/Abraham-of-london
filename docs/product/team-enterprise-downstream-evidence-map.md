# Team + Enterprise Downstream Evidence Map

## Purpose

This map defines how the new `evidenceCapture` layer from Team Assessment and Enterprise Assessment should travel into downstream governed surfaces.

Shared contract:

- `lib/product/evidence-capture-contract.ts`

Persistence carriers prepared in this pass:

- `DiagnosticSubmissionPayload.metadata.evidenceCapture`
- `sessionStorage["team-assessment-result"].evidenceCapture`
- `sessionStorage["enterprise-assessment-result"].evidenceCapture`
- `ConstitutionalThread.teamFindings.evidenceCapture`
- `ConstitutionalThread.enterpriseFindings.evidenceCapture`

## Field Map

| Evidence field | Meaning | Team prompt | Enterprise prompt | Downstream surfaces | Immediate use | Carrier |
| --- | --- | --- | --- | --- | --- | --- |
| `priorAttempts` | What correction has already been attempted | `What has already been tried to correct this team condition?` | `What institutional correction has already been attempted?` | Executive Reporting, Strategy Room, Oversight Brief | Prevents repeat recommendations that ignore prior correction history | Payload metadata, session result, constitutional thread |
| `failureCause` | Why correction failed, stalled, or failed to hold | `Why did the previous correction fail or fail to hold?` | `Why did that correction fail, stall, or fail to hold?` | Executive Reporting contradiction analysis, recurrence detection, Oversight Brief | Distinguishes wrong diagnosis from weak execution from political failure | Payload metadata, session result, constitutional thread |
| `recurrenceSignal` | Whether the pattern has appeared before | `Has this same pattern appeared before in this team, even under a different label?` | `Where has this pattern appeared before in the organisation?` | Pattern Recurrence, Decision Centre, Boardroom Mode, Control Room | Allows downstream surfaces to treat the condition as repeated rather than novel | Payload metadata, session result, constitutional thread |
| `verificationCriteria` | What proof would show improvement | `What observable evidence would prove this team condition has materially improved?` | `What observable evidence would prove this institution has materially improved?` | Return Brief, Outcome Verification, Executive Reporting | Converts recommendation into verifiable governed outcome | Payload metadata, session result, constitutional thread |
| `stopSignal` | What must stop immediately | `What must stop immediately for the team condition to improve?` | Not used in current enterprise bridge | Governed Action, Counsel Escalation, Return Brief | Makes immediate intervention explicit instead of implied | Payload metadata, team session result, team constitutional thread |
| `decisionDependency` | Which blocked dependency is slowing correction | Not used in current team bridge | `What decision dependency is currently making this condition harder to resolve?` | Dependency Graph, Boardroom Mode, Oversight Brief, Executive Reporting | Lets downstream logic distinguish condition from blocked authority path | Payload metadata, enterprise session result, enterprise constitutional thread |
| `escalationTrigger` | What must now be escalated because delay worsens the condition | Not used in current team bridge | `What must now be escalated because further delay would worsen the cost, politics, or irreversibility?` | Strategy Room, Retainer Oversight, Executive Reporting | Converts risk posture into explicit escalation readiness | Payload metadata, enterprise session result, enterprise constitutional thread |

## Surface-by-Surface Use

### Executive Reporting

- Consume `priorAttempts` to avoid recommending already-failed corrective moves.
- Consume `failureCause` to distinguish diagnosis failure from execution failure.
- Consume `verificationCriteria` to define outcome proof and reporting checkpoints.
- Consume `decisionDependency` when enterprise condition is being blocked by authority sequencing rather than lack of awareness.

### Strategy Room

- Consume `priorAttempts` and `failureCause` to shape intervention sequencing.
- Consume `recurrenceSignal` to distinguish a local event from a hardened pattern.
- Consume `escalationTrigger` to determine whether to hold, intervene, or escalate immediately.

### Return Brief

- Consume `verificationCriteria` as the proof standard for “materially improved”.
- Consume `stopSignal` when a harmful team behaviour must cease before any positive move matters.

### Oversight Brief

- Consume `priorAttempts`, `failureCause`, and `decisionDependency` to show where authority or correction repeatedly stalls.
- Consume `recurrenceSignal` to mark repeated institutional conditions rather than isolated incidents.

### Retainer Oversight

- Consume `escalationTrigger` as the clearest statement of why watch-state is no longer sufficient.
- Consume `failureCause` to separate political blockage from implementation weakness.

### Control Room

- Consume `recurrenceSignal` to track whether the same condition is reappearing across periods.
- Consume `verificationCriteria` to define the monitored proof state.

### Boardroom Mode

- Consume `decisionDependency` to show which unresolved decision path is holding institutional correction in place.
- Consume `recurrenceSignal` to differentiate structural repeat failure from temporary strain.

## Implementation Notes

1. The evidence bridge is deliberately post-score. The reading completes first, then the user adds governed memory.
2. No scoring formula or question ID changed in this pass.
3. The bridge must remain organisation-safe:
   - no names
   - no allegations
   - no protected characteristics
   - no respondent-identifying prompts
4. Downstream surfaces should treat missing `evidenceCapture` as lower evidence maturity, not as a null diagnosis.
