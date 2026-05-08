# Decision Centre Case Memory Hardening Plan

## Current Verdict

Decision Centre case memory is **not yet reliable enough to support the strongest premium memory claims**.

It is useful, safe, and directionally correct, but still vulnerable to:

- weak case-specific lineage
- missing source label
- missing timestamp
- ambiguous current vs superseded state

## Why It Is Not Fully Reliable Yet

### 1. Trace scope is too broad

The current API rebuilds case memory by merging journey stage payload evidence using email/journey context. That is not the same as showing a dated, case-scoped memory ledger.

### 2. No visible source label

The UI says `Case memory`, but does not tell the user whether the memory is:

- earlier self-reported
- inherited from prior assessment
- later operator-reviewed
- verified by outcome follow-up

### 3. No visible date

Without `captured on` or `inherited from`, the user cannot judge freshness.

### 4. No supersession model

The system does not yet visibly distinguish:

- still active
- later contradicted
- later verified
- stale but unresolved

## Required Hardening Before Stronger Market Use

### Source hardening

- Add visible source phrases:
  - `Inherited from prior assessment`
  - `Declared earlier`
  - `Verified later`

### Date hardening

- Add earliest practical timestamp to the memory block
- If exact field timestamp is unavailable, use stage completion date

### Case lineage hardening

- Tie memory rows to case-specific stage lineage rather than broad journey merge where possible

### Status hardening

- Mark each row as one of:
  - `reported`
  - `declared`
  - `tracked`
  - `verified`

## What Can Ship Before That

Decision Centre can still ship in controlled market entry if:

- copy stays restrained
- `Case memory` is treated as inherited context, not as proof
- no claims are made that the memory is fully verified or fully current

## Recommended Low-Risk Fixes

- Add source label under `Case memory`
- Add `captured earlier` date if available
- Prefer one case-specific unresolved item over broad merged context
- Add visible distinction between `what was reported` and `what would count as proof`

## Go / No-Go Judgement

### For controlled market entry

- `GO`, with restrained language

### For strong £15k positioning

- `PARTIAL GO`, but only if sales language frames this as inherited governance continuity rather than comprehensive governed memory

### For strong £50k positioning

- `NO` without further hardening

The feature is promising, but still too easy to overread.
