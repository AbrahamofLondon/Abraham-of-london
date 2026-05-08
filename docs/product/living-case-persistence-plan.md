# Living Case Persistence Plan

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London
**Rule:** Server-side persisted/journey-derived Living Case is authoritative. sessionStorage is a cache only. Any paid/deep route must use server-derived state.

---

## Architecture

The Living Case is derived from existing Prisma models. No schema migration required.

### Source models (existing)

| Model | Role in Living Case |
|-------|-------------------|
| `DiagnosticJourney` | Case container — journeyKey, stages, tensions, route decisions, escalation history |
| `DiagnosticDecisionObject` | Canonical decisions — decisionText, constraints, cost of delay, authority, confidence |
| `DiagnosticEvidenceNode` | Evidence units — contradictions, patterns, signals, consequences, exposure estimates |
| `DiagnosticStageRecord` | Stage payloads — per-stage diagnostic output |
| `DiagnosticThreadSnapshot` | Historical snapshots — tensions, route decisions, evidence state at each stage |
| `StrategyRoomExecutionSession` | Execution state — active interventions, decision surfaces |
| `StrategyRoomExecutionRecord` | Execution records — decisions taken, authority, conflict resolution |
| `OutcomeVerificationRecord` | Outcomes — 14/30-day verification, classification |
| `PatternBreakerContract` | Behavioural contracts — fulfilled, breached, disputed |
| `CalibrationRecord` | System accuracy — prediction vs. observed outcome |
| `SystemAuditLog` | Governance events — all admission/restriction/refusal events |

### Derive layer (`lib/product/living-case-store.ts`)

```
deriveLivingCase(query) → LivingCase | null
getLatestLivingCaseForActor(email) → LivingCase | null
isAdmissibleFor(livingCase, surface) → { admissible, reason }
```

The derive layer assembles a `LivingCase` view from the journey record. It does not write new data — it reads from existing persistence and computes derived fields (evidence tier, case status, latest directive).

### Authority model

```
Server-side (authoritative):
  DiagnosticJourney → deriveLivingCase() → LivingCase
  ↓
  Used by: admission modules, checkout gates, API routes
  
Client-side (cache only):
  sessionStorage → living-intelligence-spine
  ↓
  Used by: UI rendering, progressive disclosure, UX continuity
```

If server and client disagree, server wins. Admission modules always query `getDiagnosticJourney()` from the database, never from client-supplied state.

---

## Integration points

### Already integrated

1. **Strategy Room execution** (`app/api/strategy-room/execution/route.ts`) — calls `evaluateStrategyRoomAdmission()` which queries server-side journey
2. **Strategy Room enrollment** (`lib/strategy-room/enrol-core.ts`) — calls `evaluateStrategyRoomAdmission()` and attaches result to inquiry metadata
3. **Executive Reporting checkout** (`pages/api/billing/checkout.ts`) — calls `evaluateERAdmission()` which cross-validates client claims against server journey
4. **Executive Reporting entry** (`pages/diagnostics/executive-reporting.tsx`) — calls `enforceExecutiveReportingAccess()` which queries server journey in `getServerSideProps`

### Future integration

5. **Strategy Room session init** — already has `enforceStrategyRoomAccess()` with durable thread. Can additionally call `isAdmissibleFor()`.
6. **Return Brief** — already queries execution state from DB. Can use `deriveLivingCase()` for enriched context.
7. **Any new deep surface** — must call `deriveLivingCase()` or `evaluateStrategyRoomAdmission()` / `evaluateERAdmission()` before granting access.

---

## What this does NOT require

- No Prisma schema migration
- No new database tables
- No data duplication
- No breaking changes to existing flows
- No removal of sessionStorage (it remains as UX cache)

The Living Case is a **read view** over existing data, not a new storage layer.
