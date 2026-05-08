# Oversight Scheduler Standard

Cadence is not real if it exists only as copy.

## v0 operating rule

- Manual trigger only.
- Admin/operator protected only.
- No public route.
- No automatic delivery.
- No fake cron language.

## Required event records

- `CYCLE_DUE`
- `CYCLE_GENERATED`
- `CYCLE_REVIEW_REQUIRED`
- `CYCLE_OVERDUE`
- `CLIENT_EVIDENCE_REQUIRED`
- `OPERATOR_REVIEW_OVERDUE`
- `COUNSEL_REVIEW_OVERDUE`
- `BOARDROOM_ESCALATION_OVERDUE`
- `DELIVERY_PENDING`
- `DELIVERY_COMPLETED`

## Hostile truth

This is still manual enforcement with audit records. That is better than fiction, but it is not unattended automation.
