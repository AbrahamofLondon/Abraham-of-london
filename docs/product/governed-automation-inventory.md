# Governed Automation Inventory

Generated: 2026-05-10

## Domain Classification

| Domain | Current State | Automation Level | Human Boundary |
|---|---|---|---|
| Retained Cadence | Scheduler built, endpoint guarded, no cron configured | SCHEDULER_READY_NOT_RUNNING | Release of cycle results |
| Checkpoint Review | Auto-created on commands, overdue detection built | AUTOMATED_NOW (partial) | User response, failure judgment |
| Return Brief | Delivery service built, email transport available | OPERATOR_TRIGGERED | External email release |
| Oversight Brief | Composer + delivery service built | OPERATOR_TRIGGERED | Client-facing release |
| Delivery Preparation | Queue + approve + send built | OPERATOR_TRIGGERED | All external sends |
| Suppression Logging | 15+ callers, fully automatic | AUTOMATED_NOW | Override/release decisions |
| Outcome Follow-up | Verification records exist, service built | SCHEDULER_READY_NOT_RUNNING | Outcome interpretation |
| Counsel Escalation | Auto-flagging on triggers built | AUTOMATED_NOW (flagging only) | Actual counsel opinion |
| Boardroom Readiness | Qualification gating built | AUTOMATED_NOW (flagging only) | Board submission |
| Portfolio Memory | Auto-refreshes on page load | AUTOMATED_NOW | Sector claims, role review |
| Role Boundary | Permission system enforced at runtime | AUTOMATED_NOW | Access expansion |
| Evidence Integrity | Guards enforce at build/runtime | AUTOMATED_NOW | Override decisions |

## Automation Endpoint

```
POST /api/internal/governed-automation/tick
```

- Requires `x-automation-secret` header OR admin session
- Supports `dryRun=true`
- Runs full sweep: cadence, checkpoints, delivery prep, suppression, counsel, portfolio, boardroom
