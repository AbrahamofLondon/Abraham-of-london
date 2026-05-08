# Public Language Control Standard

Public and sponsor-facing surfaces keep leaking implementation mechanics. Stop it.

## Suppress or rewrite

- Internal engine names.
- Kernel language.
- Threshold language when the number is not required for trust.
- Formula talk.
- Trigger-rule talk.
- Sequencing internals.
- Bypass details.
- Evidence classifier internals.

## Preferred pattern

Say what the system checks, not what internal subsystem name does it.

- Bad: "proprietary contradiction engine"
- Better: "the system tests whether the same contradiction is persisting under evidence"

- Bad: "pattern recurrence algorithm"
- Better: "the system checks whether the same decision pattern has appeared before"

- Bad: "irreversibility index"
- Better: "the system assesses whether delay is narrowing the remaining options"
