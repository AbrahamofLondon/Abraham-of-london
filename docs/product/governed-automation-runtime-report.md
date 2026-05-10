# Governed Automation Runtime Report

Generated: 2026-05-10

## What is now automated

| Action | Mode | Trigger | Boundary |
|---|---|---|---|
| Review cycle creation | SCHEDULED | Time-based cadence tick | No external delivery |
| Overdue marking | SCHEDULED | Past-due date detection | No destructive action |
| Cadence escalation | SCHEDULED | 7+ days overdue | Escalates to operator |
| Checkpoint overdue detection | AUTOMATED | Due date passed | No failure judgment |
| Suppression logging | AUTOMATED | Rule match on output | No content storage |
| Counsel eligibility flagging | AUTOMATED | Trigger threshold met | No professional opinion |
| Boardroom readiness flagging | AUTOMATED | Qualification state | No board submission |
| Portfolio memory refresh | AUTOMATED | Page load / sweep | Sample threshold enforced |
| Role boundary enforcement | AUTOMATED | Every request | No access expansion |
| Evidence integrity guards | AUTOMATED | Build time + runtime | No override without admin |

## What requires human review

| Action | Why | Who |
|---|---|---|
| Oversight brief release to client | Client-sensitive material | Operator |
| Delivery email sending | External communication | Operator/Admin |
| Counsel opinion/response | Professional judgment | Counsel reviewer |
| Boardroom dossier submission | Board-level material | Operator |
| Suppression override | Privacy decision | Operator with SUPPRESSION_REVIEW |
| Outcome interpretation | Causal judgment | Operator |
| Access expansion | Security decision | Admin |

## Posture claim (truthful)

The system automates retained governance cadence, overdue detection, evidence preservation, suppression logging, delivery preparation, and escalation routing. Human review is required where judgment, professional interpretation, or client-sensitive release decisions are involved.

## Classification

**`GOVERNED_AUTOMATION_READY_WITH_HUMAN_BOUNDARIES`**
