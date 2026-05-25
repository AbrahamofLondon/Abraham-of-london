# Boardroom Dossier Adapter — Readiness Audit

**Date:** 2026-05-25  
**Status:** PRODUCTION_NEEDS_WRAP  
**Audit decision:** Two distinct "boardroom dossier" paths exist. The decision-level path is callable. The org-level path is DB-bound.

---

## 1. File Classification

| File | Purpose | Callable? | Notes |
|---|---|---|---|
| `lib/constitution/boardroom-mode.ts` | Decision-level dossier from IntelligenceSpine | **YES** | `qualifiesForBoardroom()` and `generateBoardroomDossier()` are pure. Takes `IntelligenceSpine`. No DB. No AI. |
| `lib/boardroom/dossier-builder.ts` | Org-level aggregated dossier from DB | **NO** | All queries via `prisma.organisation.findUnique()`, `prisma.diagnosticJourney.findMany()`, etc. |
| `lib/boardroom/dossier-types.ts` | Type definitions | N/A | Types only. |
| `lib/product/boardroom-archive.ts` | Boardroom archive CRUD | **NO** | DB-bound. |
| `lib/product/boardroom-dossier-archive.ts` | Archive with history | **NO** | DB-bound. |
| `app/api/boardroom/dossier/route.ts` | REST endpoint | **NO** | Calls `buildBoardroomDossier()` (DB). |
| `app/api/executive-reporting/export/boardroom-pdf/route.ts` | PDF export | **NO** | PDF rendering side effect. |

---

## 2. Callable Path — `lib/constitution/boardroom-mode.ts`

### Functions

```typescript
// Pure — takes IntelligenceSpine, returns { qualified: boolean; reason: string }
export function qualifiesForBoardroom(spine: IntelligenceSpine): { qualified: boolean; reason: string }

// Pure — takes IntelligenceSpine + optional CohortMetrics[], returns structured JSON dossier
export function generateBoardroomDossier(
  spine: IntelligenceSpine,
  cohortData?: CohortMetrics[],
): BoardroomDossier
```

### What `generateBoardroomDossier()` produces

Returns a `BoardroomDossier` with:
- `sections: BoardroomSection[]` — structured sections (decision statement, contradiction, cost of delay, failure pattern, owner, required action, consequence)
- `objectionHandling: Array<{ objection: string; response: string }>` — 3 standard objection responses
- `decisionPath: Array<{ option, consequence, recommended }>` — 3 decision options
- `qualifiedForBoard: boolean` — qualification gate
- `gateMessage: string | null` — gate failure reason
- `classification: "BOARD_RESTRICTED"`
- `generatedAt: string`

**No PDF rendering.** No AI. No DB. Produces structured JSON only.

### Qualification gate

```
Qualifies when:
  spine.economics.estimatedMonthlyCost >= 5000 AND accuracy IN ["yes", "partial"]
  OR
  spine.economics.estimatedMonthlyCost >= 20000 (board-level by default)

Gate failure: "This is not a board-level issue. Resolve operationally."
```

### Blocker — IntelligenceSpine construction

`IntelligenceSpine` is the cross-stage intelligence accumulator. It normally builds through:
`fast_diagnostic → constitutional → team → enterprise → executive_reporting → strategy_room`

For a Foundry adapter, a minimal synthetic `IntelligenceSpine` fixture is needed with:
- `case: CaseObject` (blocker, forcedAction, claimedOwner, conditionClass)
- `deterministic.conditionClass` ("authority" | "execution" | "definition" | "instability")
- `deterministic.contradictionSet: string[]`
- `economics.estimatedMonthlyCost: number`
- `forecast.optionDecayRate: number`
- `flags.falseAuthority: boolean | undefined`
- `synthesis.primaryContradiction: string | undefined`
- `synthesis.concreteMove: string | undefined`

This is constructible synthetically. The fixture does not require DB data.

---

## 3. DB-Bound Path — `lib/boardroom/dossier-builder.ts`

`buildBoardroomDossier(organisationId, period?)` requires:

1. `prisma.organisation.findUnique()` — cannot call without real org ID
2. `prisma.diagnosticJourney.findMany()` — requires DB
3. `prisma.diagnosticDecisionObject.findMany()` — requires DB
4. `detectIntelligenceSignals()` — called after DB queries

**This path cannot run without a real database. No dry-run is possible without mocking Prisma.**

---

## 4. Adapter Recommendation

### Build: `lib/research/engines/boardroom-mode-adapter.ts`

**NOT** `boardroom-dossier-adapter.ts` (which implies the DB-builder path).

Target functions:
- `qualifiesForBoardroom()` — admission gate check
- `generateBoardroomDossier()` — structured JSON dossier generation

Fixtures needed:
```typescript
// Minimal qualifying spine
const QUALIFYING_SPINE: Partial<IntelligenceSpine> = {
  id: "foundry-test",
  case: { blocker: "Board approval not obtained", forcedAction: "Proceeding without authority", claimedOwner: "CEO", conditionClass: "authority" },
  deterministic: { conditionClass: "authority", contradictionSet: ["Authority claimed but not held"], signal: ..., blockerClass: "authority" },
  economics: { estimatedMonthlyCost: 25000 },
  forecast: { optionDecayRate: 0.35, structuralRiskShift: "accelerating" },
  synthesis: { primaryContradiction: "Stated owner lacks mandate", concreteMove: "Formalise board resolution within 7 days" },
}

// Non-qualifying spine (cost < 5k)
const NON_QUALIFYING_SPINE: Partial<IntelligenceSpine> = {
  ...QUALIFYING_SPINE,
  economics: { estimatedMonthlyCost: 3000 },
}
```

### Status target

`boardroom-dossier` engine registry entry:
- Remains `PRODUCTION_NEEDS_WRAP` until `boardroom-mode-adapter.ts` selfTest passes
- On selfTest pass → upgrade to `PRODUCTION_CALLABLE` with explicit limitation that org-level aggregated dossier (DB path) is not wrapped

---

## 5. What Must NOT Be Done

- Do not call `buildBoardroomDossier()` from `lib/boardroom/dossier-builder.ts` in the adapter — DB-bound
- Do not generate PDF output — `app/api/executive-reporting/export/boardroom-pdf/route.ts` is out of scope
- Do not create customer session or journey records
- Do not call `boardroom-archive.ts` persistence functions

---

## 6. Next Pass Sequence

1. Build `lib/research/engines/boardroom-mode-adapter.ts`
2. Construct minimal `IntelligenceSpine` fixture with all required fields
3. Call `qualifiesForBoardroom()` → gate finding
4. Call `generateBoardroomDossier()` → section findings
5. selfTest passes → update engine registry to `PRODUCTION_CALLABLE`
6. Create `tests/research/engines/boardroom-mode-adapter.test.ts`
7. Create `app/api/admin/intelligence-foundry/engines/boardroom-mode/run/route.ts`
