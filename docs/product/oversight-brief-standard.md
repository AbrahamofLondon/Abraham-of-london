# Oversight Brief Standard

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London

---

## Purpose

The Oversight Brief is a monthly governance document for retainer clients. It aggregates all intelligence primitives into a single accountable report that answers:

1. What is unresolved.
2. What is decaying.
3. What is becoming irreversible.
4. What has already cost them.
5. What they keep repeating.
6. What must happen next.

---

## Brief structure (from `lib/product/oversight-brief-contract.ts`)

| Section | Source primitive |
|---------|----------------|
| Executive Summary | Aggregated from all sections below |
| Active Cases | Living Case store — cases under governance |
| Cost of Inaction | Cost-of-Inaction Clock — accumulated cost this period |
| Commitment Verification | Commitment Verification — executed, blocked, overdue |
| Decision Losses | Decision Loss Register — realised, irreversible losses |
| Strategic Options | Strategic Option Register — open, closing, closed |
| Decision Dependencies | Decision Dependency Graph — active blockers, critical chains |
| Irreversibility | Irreversibility Index — how close to irreversible |
| Pattern Recurrence | Pattern Recurrence — recurring signals |
| Decision Credit | Decision Credit Governance — trust score trend |
| Counsel Status | Counsel trigger — whether human governance is required |
| Boardroom Readiness | Boardroom qualification — whether board-grade treatment is warranted |
| Required Actions | Derived from all sections — prioritised, specific, accountable |

---

## Quality standard

| Rule | Enforcement |
|------|-------------|
| Every section must cite evidence | Primitives produce evidence-basis strings |
| No section may fabricate data | Functions return honest "no data" states |
| No motivational language | Oversight briefs report consequence, not encouragement |
| Actions must be specific and owned | Required actions include owner and deadline where available |
| Brief must be reproducible | Same inputs → same brief (deterministic) |
| Brief must reference prior brief | Trend comparison where prior data exists |

## Review cycle standard

Oversight delivery follows:

- Generate
- Review
- Suppress or redact
- Approve or withhold
- Prepare delivery state
- Record
- Record next-cycle intent

Client-safe and internal briefs may differ. Suppressions must be explicit and logged.

A brief is not retainer-grade unless it is reviewed, scored, client-safe, and tied to the next governed cycle.

Generation is mechanical.
Review is institutional.
Delivery is earned.

A client-safe brief is not a watered-down internal brief.
It is the version that preserves consequence, action, and accountability while suppressing what the client is not entitled or safe to see.

## Readiness standard

- First retainer readiness:
  possible only once the live Oversight Brief Composer can assemble a brief from real journeys, execution records, outcomes, recurrence, credit data, and retained enforcement cycles.
- Client-safe retainer delivery:
  requires a working suppression layer, a recorded review decision, and client delivery state prepared without fabricated delivery.
- £15k+ readiness:
  requires Control Room UI, organisation access enforcement, recurring verification cadence, and counsel review workflow.
- £50k readiness:
  requires enterprise Control Room, operator role model, boardroom history, counsel oversight pipeline, retained enforcement-cycle history, and recurring oversight brief delivery.

## Operating Rhythm Addendum

A retainer-grade brief should now carry:

- cadence status
- counsel history where real
- boardroom archive memory where real
- sponsor-safe organisation divergence where real
- cancellation-loss clarity
- indispensability summary
- delivery readiness

---

## Delivery cadence

| Tier | Cadence | Content |
|------|---------|---------|
| Governed Continuity (£15k) | Monthly | Full oversight brief |
| Executive Oversight (£30k) | Monthly + ad hoc escalation | Full brief + counsel review on triggers |
| Institutional Command (£50k) | Monthly + weekly pulse + board export | Full brief + pulse signals + board-ready export |
