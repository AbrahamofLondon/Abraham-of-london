# Strategic Option & Loss Register Standard

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London

---

## Strategic Option Register

### Purpose

Tracks strategic options that are available now but will not be available forever. Options decay through inaction. The register makes option decay visible before it becomes irreversible.

### Option states

| State | Meaning |
|-------|---------|
| OPEN | Option is available and exercisable |
| CLOSING | Option is approaching expiry or conditions are deteriorating |
| CLOSED | Option is no longer available |
| EXERCISED | Option was taken — recorded as executed |
| EXPIRED | Option was not taken before its window closed |

### What clients see

- "You have 3 open strategic options. 1 is closing."
- "This option expires in 14 days."
- "This option was available 30 days ago. It has now closed."
- "Total value at risk across open/closing options: £X."

### Data sources

- Decision objects (constraint text identifies dependencies and windows)
- Cost-of-delay projections (identify time-sensitive value)
- Execution records (identify which options were exercised)
- Outcome verification (confirm whether exercise produced expected result)

---

## Decision Loss Register

### Purpose

Tracks value that has been permanently lost due to delayed or failed decision execution. Unlike cost-of-inaction (which projects accumulating cost), the loss register records realised, irreversible losses.

### Loss categories

| Category | Meaning |
|----------|---------|
| OPPORTUNITY_CLOSED | A specific opportunity is no longer available |
| POSITION_DETERIORATED | Competitive or strategic position has worsened beyond recovery |
| CONSEQUENCE_MATERIALISED | A projected consequence has actually occurred |
| AUTHORITY_LOST | Decision authority has been taken by someone else or by events |
| TRUST_ERODED | Stakeholder trust has deteriorated to a non-recoverable level |
| OPTION_EXPIRED | A strategic option expired without being exercised |

### What clients see

- "1 decision loss recorded this period. Estimated value: £X."
- "This loss is irreversible."
- "Evidence basis: outcome verification confirmed deterioration at 30-day checkpoint."

### Data sources

- Outcome verification records (confirmed deterioration)
- Execution failure events (blocked actions that led to loss)
- Cost-of-delay projections that passed their window
- Strategic options that expired without exercise

---

## Relationship between registers

```
Strategic Option Register tracks what is available.
↓ When an option expires without exercise:
Decision Loss Register records the realised loss.
↓ Both feed:
Irreversibility Index — how close the situation is to unrecoverable.
Oversight Brief — monthly governance report.
```

---

## Rules

- Losses must be evidence-based. Do not record speculative losses.
- Options must have a real basis. Do not invent hypothetical options.
- Irreversibility must be computed from actual signals, not assumed.
- The registers are governance instruments, not marketing tools.
