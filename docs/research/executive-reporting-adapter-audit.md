# Executive Reporting Adapter — Audit

**Date:** 2026-05-25  
**Current registry status:** PRODUCTION_CALLABLE (no adapter exists — status needs honesty note)  
**Audit decision:** `buildExecutiveReport()` is callable. `executive-report-service.ts` is DB-bound. Adapter for `executive-report-builder.ts` is buildable next pass. Not boardroom-mode-adapter.

---

## 1. The Status Gap

The engine registry currently lists `executive-reporting` as `PRODUCTION_CALLABLE`. However:

- No `lib/research/engines/executive-reporting-adapter.ts` exists.
- The performance range route (`/api/admin/intelligence-foundry/performance/run`) has `executive-reporting` in its ADAPTERS map — but the adapter there is `constitutionalDiagnosticAdapter`, not an executive reporting adapter.
- Without an adapter, the selfTest and getVersion exports do not exist.

**This is a status inflation.** The registry must be updated with a `limitationReason` that discloses no adapter exists yet.

---

## 2. File Classification

| File | Purpose | Callable? | Notes |
|---|---|---|---|
| `lib/admin/reporting/executive-report-builder.ts` | Pure report composition: resonance, HCD, OGR, financial exposure | **YES** | `buildExecutiveReport()` is pure. Takes `BuildExecutiveReportInput`. `server-only` at bottom (mock covers tests). |
| `lib/admin/reporting/executive-report-service.ts` | Campaign-level report build via DB | **NO** | Imports `db` from `@/lib/db`. All DB. |
| `lib/admin/reporting/executive-report-audit.ts` | Audit trail for reports | Partial | Contains pure audit logic but persists via DB helpers. |
| `lib/admin/reporting/executive-report-serializer.ts` | Serialises report to PDF-safe format | **YES** (partial) | Pure serialisation. No DB. No PDF renderer. |
| `lib/admin/reporting/executive-report-recommendations.ts` | Generates recommendations from report | **YES** | Pure function. No DB. |
| `lib/admin/reporting/executive-report-contract.ts` | Type definitions | N/A | Types only. |
| `lib/admin/reporting/executive-report-view-model.ts` | ViewModel builder | **YES** (partial) | `buildExecutiveReportViewModel()` — likely pure. |
| `lib/diagnostics/executive-reporting/admission.ts` | Server-side ER admission gate | **NO** | Calls `getDiagnosticJourney()` (DB). |
| `lib/diagnostics/executive-reporting-enforcement.ts` | Access enforcement | Mixed | Short-circuit paths for direct_sponsored/monitoring are pure. Ladder path requires DB. |
| `app/api/executive-reporting/run/route.ts` | Full ER run endpoint | **NO** | Heavily DB-bound (prisma, journey store, persistence). |
| `app/api/analytics/executive-report/route.ts` | Analytics endpoint | **NO** | DB-bound. |

---

## 3. Callable Path — `lib/admin/reporting/executive-report-builder.ts`

### Primary callable function

```typescript
export function buildExecutiveReport(input: BuildExecutiveReportInput): ExecutiveReport
```

Input type:
```typescript
type BuildExecutiveReportInput = {
  responses: RawExecutiveResponse[];   // resonance survey responses
  hcdMetrics: HCDMetrics[];            // human capital delta metrics
  ogrMetrics: Partial<OGRMetrics>;     // OGR metrics (can be partial)
}
```

Output type — `ExecutiveReport`:
```typescript
{
  state: "ORDERED" | "MISALIGNED" | "DISORDERED"
  narrative: { headline, summary, mandate }
  ogr: OGRComputed
  resonance: { telemetry, metrics }
  hcd: HCDResult[]
  hcdAggregate: HCDAggregate
  financialExposure: { replacementCost, executionLoss, totalExposure }
  priorityStack: string[]
  failureModes: string[]
}
```

**No DB. No AI. Pure composition.** `server-only` guard is present (vitest mock handles it).

### Production functions called inside `buildExecutiveReport()`

1. `deriveResonanceMetricsFromResponses()` — `lib/admin/reporting/derive-resonance-metrics.ts`
2. `calculateHCDelta()` — `lib/alignment/human-capital-delta.ts`
3. `aggregateHCDMetrics()` — `lib/alignment/human-capital-delta.ts`
4. `sanitizeMetrics()`, `calculateDerived()` — `lib/ogr/manifest-engine.ts`
5. `generateHCDBriefingSection()` — `lib/alignment/human-capital-delta.ts`

All of these are pure functions. This is a composition layer — fully wrappable.

---

## 4. What Cannot Be Called

- `executive-report-service.ts` — requires `db`, campaign lookups, team data queries
- `enforceExecutiveReportingAccess()` in ladder mode — requires `getDiagnosticJourney()` (DB)
- `app/api/executive-reporting/run/route.ts` — prisma-heavy, cannot dry-run
- `app/api/executive-reporting/export/pdf/route.ts` — PDF rendering side effect

---

## 5. Does the Enterprise Pipeline implicitly wrap ER?

The `app/api/executive-reporting/run/route.ts` calls:
- `evaluateDecision()` — `lib/decision/kernel.ts`
- `analyzeContagionRisk()`, `simulateInterventionImpact()` — `lib/alignment/governance-logic.ts`
- `generateBoardroomDossier()` — `lib/constitution/boardroom-mode.ts`

These are production functions that could be wrapped independently. However, the ER run route constructs these from DB data (campaign, journey, decisions). The Foundry adapter should **not** try to replicate this pipeline — it should wrap `buildExecutiveReport()` directly.

---

## 6. Recommended Next Pass Decision

**Build `executive-reporting-adapter.ts` AFTER `boardroom-mode-adapter.ts`.**

Rationale:
1. `boardroom-mode-adapter.ts` is simpler (requires only IntelligenceSpine fixture, no campaign data).
2. `executive-reporting-adapter.ts` requires `RawExecutiveResponse[]` + `HCDMetrics[]` + `OGRMetrics` — three independent input sets requiring their own fixtures.
3. `boardroom-mode-adapter.ts` output (a decision-level dossier) is more directly useful as a Foundry simulation — it tests the board qualification gate.
4. Building boardroom-mode first proves the pattern before tackling the more complex executive report builder.

**Sequence:**
1. `boardroom-mode-adapter.ts` — next immediate pass
2. `executive-reporting-adapter.ts` — pass after that

---

## 7. Engine Registry Correction Required

`executive-reporting` is listed as `PRODUCTION_CALLABLE` with no adapter. This must be corrected.

**Proposed update:**
```typescript
{
  id: "executive-reporting",
  name: "Executive Reporting",
  status: "PRODUCTION_CALLABLE",
  description: "...",
  version: "2.0.0",
  limitationReason: "Foundry adapter not yet built. buildExecutiveReport() from executive-report-builder.ts is callable but requires RawExecutiveResponse[], HCDMetrics[], and OGRMetrics fixtures. Adapter is planned for next pass.",
}
```

This keeps the status honest: the underlying function IS callable (the status is not wrong), but the absence of an adapter means the Foundry cannot currently invoke it.

---

## 8. Report Lineage

`lib/reporting/report-lineage.ts` provides append-only chain-of-custody for report events. Uses `SystemAuditLog` as the persistent store.

The lineage functions use dynamic prisma import (`getPrisma()`). They are NOT callable in a Foundry dry-run context.

**Adapter limitation:** Report lineage events are not created during Foundry runs. This is correct — Foundry runs are not customer reports.
