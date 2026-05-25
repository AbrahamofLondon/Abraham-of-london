# Callable Engine Adapter Closure

**Status:** Pass 2 closure — 2026-05-25  
**Rule:** No callable engine may remain without an explicit adapter decision.

---

## Adapter Status by Engine

| Engine ID | Status | Adapter File | Decision |
|-----------|--------|-------------|----------|
| `fast-diagnostic` | PRODUCTION_CALLABLE | `fast-diagnostic-adapter.ts` | ✅ BUILT — wraps `percentageScore()`, `severityFromScore()`, `verdictFromScore()` |
| `constitutional-diagnostic` | PRODUCTION_CALLABLE | `constitutional-diagnostic-adapter.ts` | ✅ BUILT — wraps `constitutionalDiagnosticEngine.run()` |
| `strategy-room` | PRODUCTION_CALLABLE | `strategy-room-adapter.ts` | ✅ BUILT — wraps 8-component intake scoring |
| `boardroom-dossier` | PRODUCTION_CALLABLE | `boardroom-mode-adapter.ts` | ✅ BUILT — wraps `qualifiesForBoardroom()` + `generateBoardroomDossier()` |
| `executive-reporting` | PRODUCTION_CALLABLE | `executive-reporting-adapter.ts` | ✅ BUILT — wraps `buildExecutiveReport()` |
| `executive-report-boardroom-bridge` | PRODUCTION_CALLABLE | `executive-report-boardroom-bridge-adapter.ts` | ✅ BUILT — wraps full ER→Spine→Boardroom chain |
| `pattern-recurrence` | PRODUCTION_CALLABLE | `pattern-recurrence-adapter.ts` | ✅ BUILT — wraps `detectPatternRecurrence()` |
| `report-lineage` | PRODUCTION_CALLABLE | `report-lineage-adapter.ts` | ✅ BUILT (Pass 2) — wraps `simulateLineageChain()` + `simulateAllLineageChains()` |
| `outbound-policy-gate` | PRODUCTION_CALLABLE | `outbound-policy-gate-adapter.ts` | ✅ BUILT (Pass 2) — wraps `applySharedOutboundPolicy()` |
| `cohort-privacy` | PRODUCTION_CALLABLE | `cohort-privacy-adapter.ts` | ✅ BUILT (Pass 2) — wraps `cohortMeetsPublicationThreshold()` + `determineLanguageLevel()` |
| `editorial-style-checker` | PRODUCTION_CALLABLE | `editorial-style-checker-adapter.ts` | ✅ BUILT (Pass 2) — implements deterministic UK style, overclaim, guarantee, compliance, AI-prediction, evidence posture, IP leakage, authority claim checks |
| `enforcement-gates` | PRODUCTION_CALLABLE | `enforcement-gates-adapter.ts` | ✅ BUILT (Pass 2) — wraps `runAllRules()` + `aggregateStatus()` from product-health-rules.ts |
| `cost-of-delay` | PRODUCTION_CALLABLE (↑ from DOCUMENTATION_ONLY) | `cost-of-delay-adapter.ts` | ✅ BUILT (Pass 2) — wraps deterministic WSJF arithmetic + financial exposure calculation |

---

## Engines Without Adapter (Deferred)

| Engine ID | Status | Adapter Decision |
|-----------|--------|-----------------|
| `purpose-alignment` | PRODUCTION_CALLABLE | ⏳ DEFERRED — requires real DiagnosticJourney data integration; stub would be fixture-only |
| `enterprise-decision-authority` | PRODUCTION_CALLABLE | ⏳ DEFERRED — wraps enterprise pipeline; requires full organisational data context |
| `gmi` | PRODUCTION_CALLABLE | ⏳ DEFERRED — GMI report generation requires content pipeline; not suitable for dry-run adapter without fixture complexity |
| `outbound-content-validator` | PRODUCTION_CALLABLE | ⏳ DEFERRED — full outbound validation chain across providers; covered by `outbound-policy-gate-adapter.ts` for shared policy gate |
| `retainer-readiness` | PRODUCTION_CALLABLE | ⏳ DEFERRED — requires active retainer data from DiagnosticJourney; fixture-only adapter adds no value |

---

## Engines Confirmed Non-Callable

| Engine ID | Status | Reason |
|-----------|--------|--------|
| `contradiction-detection` | DOCUMENTATION_ONLY | Architecture documented. No callable logic. No adapter to build. |
| `decision-credit` | DOCUMENTATION_ONLY | Concept only. No production function. |
| `consequence-engine` | DOCUMENTATION_ONLY | Concept only. No production function. |
| `reference-ogr-engine` | DOCUMENTATION_ONLY | Reference model. Not a production decision engine. |

---

## Rules Applied

1. **No adapter may be promoted to PRODUCTION_CALLABLE unless it calls real production logic and returns source-backed traces.**  
2. **Fixture-only adapters are not permitted unless the underlying engine is deterministic and verifiable (e.g., arithmetic, threshold checks).**  
3. **Deferred engines must have an explicit written reason — "no adapter" is not acceptable without a documented decision.**  
4. **All adapters must implement `selfTest()`, `getVersion()`, and return a valid `EngineRunOutput` contract.**  
5. **Sample/dry-run outputs must be clearly marked in `limitations[]`.**

---

## Adapter Closure Pass History

| Pass | Date | Adapters Built | Notes |
|------|------|---------------|-------|
| Pass 1 | Before 2026-05-25 | fast-diagnostic, constitutional-diagnostic, strategy-room, boardroom-dossier, executive-reporting, executive-report-boardroom-bridge, pattern-recurrence | Initial Foundry chain |
| Pass 2 | 2026-05-25 | report-lineage, outbound-policy-gate, cohort-privacy, editorial-style-checker, enforcement-gates, cost-of-delay (+ engine) | Gap closure pass; cost-of-delay promoted from DOCUMENTATION_ONLY |
