# Decision Centre System-of-Record Audit

**Date:** 2026-05-15  
**Agent:** Agent 2 — Product Surface Registry, Commercial Clarity, Doctrine Consistency  
**Scope:** Decision Centre data persistence classification

---

## Persistence Classification Table

| Data Category | Classification | Source | Survives Browser Close? | Survives Device Change? | Notes |
|---|---|---|---|---|---|
| **Active cases** | `SERVER_PERSISTED` | Prisma `DiagnosticJourney` | ✅ Yes | ✅ Yes | Server-authoritative Living Case derived from journey store |
| **caseRef** | `SERVER_PERSISTED` | Prisma `DiagnosticJourney.journeyKey` | ✅ Yes | ✅ Yes | Unique journey key stored in DB |
| **Diagnostic result** | `SERVER_PERSISTED` | Prisma `DiagnosticJourney.stages` + `DiagnosticEvidenceNode` | ✅ Yes | ✅ Yes | Stage payloads and evidence nodes persisted |
| **Checkpoint commitments** | `SERVER_PERSISTED` | Prisma `DiagnosticStageRecord` via checkpoint service | ✅ Yes | ✅ Yes | `loadDueCheckpointsForUser` loads from DB |
| **Return Brief rows** | `SERVER_PERSISTED` | Prisma `StrategyRoomExecutionSession` + `ReturnBriefReference` | ✅ Yes | ✅ Yes | Derived from execution records |
| **Cost of inaction** | `DERIVED_FROM_ACCOUNT` | Calculated from `LivingCase.primaryDecision.costOfDelayText` + elapsed time | ✅ Yes | ✅ Yes | Recalculated server-side on each request |
| **Decision credit** | `SERVER_PERSISTED` | Prisma `DecisionMemory` via ledger service | ✅ Yes | ✅ Yes | `getCreditProfile` reads from DB |
| **Retainer memory preview** | `DERIVED_FROM_ARCHIVE` | Prisma `RetainerContract` + archived oversight cycles | ✅ Yes | ✅ Yes | Loaded from archived cycle data |
| **Strategy Room admission** | `SERVER_PERSISTED` | Prisma `StrategyRoomExecutionSession` | ✅ Yes | ✅ Yes | Execution session records persisted |
| **Executive Reporting admission** | `SERVER_PERSISTED` | Prisma `ExecutiveReportingRun` | ✅ Yes | ✅ Yes | Run records persisted |
| **Provenance summary/hash** | `DERIVED_FROM_ACCOUNT` | Built from evidence nodes + stage data | ✅ Yes | ✅ Yes | Hash computed server-side from persisted data |
| **Boardroom eligibility** | `DERIVED_FROM_ACCOUNT` | Calculated from `monthlyCost` + evidence tier | ✅ Yes | ✅ Yes | Recalculated on each request |
| **Fast Diagnostic draft** | `LOCAL_STORAGE_ONLY` | `localStorage` via `assessment-state.ts` | ✅ Yes | ❌ No | Draft recovery only; server has final result |
| **Board Summary preview** | `SESSION_ONLY` | `sessionStorage` via `buildBoardSummaryFromSessionStorage` | ❌ No | ❌ No | Ephemeral preview, not a governed record |
| **Decision Delay Calculator** | `SESSION_ONLY` | `sessionStorage` via `aol_decision_delay_exposure` | ❌ No | ❌ No | Scenario calculator, no governed record |

---

## Key Finding: Decision Centre IS a True System of Record

**Verdict:** The Decision Centre is **server-authoritative and account-bound**. All core data categories are either `SERVER_PERSISTED` or `DERIVED_FROM_ACCOUNT`. If a user logs in from another device, all Decision Centre data survives.

### What is truly persisted (server-side):
- **DiagnosticJourney** — the case container with stages, tensions, route decisions
- **DiagnosticEvidenceNode** — all evidence, contradictions, patterns, consequences
- **DiagnosticDecisionObject** — canonical decision objects
- **DiagnosticStageRecord** — checkpoint commitments and responses
- **StrategyRoomExecutionSession** — execution records
- **ExecutiveReportingRun** — report runs
- **DecisionMemory** — decision credit/trust score
- **OutcomeVerificationRecord** — outcome tracking
- **RetainerContract** + archived cycles — retainer memory

### What is NOT persisted:
1. **Board Summary preview** — session-only, ephemeral. This is correct — it's a preview.
2. **Decision Delay Calculator** — sessionStorage only. This is correct — it's a scenario tool.
3. **Fast Diagnostic draft** — localStorage only. This is a convenience for draft recovery; the final result IS server-persisted.

### The API endpoint (`pages/api/decision-centre/cases.ts`):
- Authenticates via `resolveIdentity`
- Derives Living Case from Prisma-backed journey store
- Never trusts `sessionStorage` for authoritative data
- Response includes `dataQuality`, `evidencePosture`, `provenance` fields
- Cache-Control: `private, no-cache` — ensures fresh data on each request

---

## Code Invariant Added

Created `lib/product/record-persistence-contract.ts` with:

```typescript
export type RecordPersistenceLevel =
  | "NONE"
  | "SESSION_PREVIEW"
  | "LOCAL_PREVIEW"
  | "ACCOUNT_RECORD"
  | "GOVERNED_CASE"
  | "PROVENANCE_BACKED"
  | "ANCHORED"
  | "PUBLIC_ROOT_PUBLISHED";
```

With helpers:
- `assertLiveRecordClaimAllowed(surface, persistenceLevel)` — throws if a surface claims a persistence level it doesn't have
- `getSurfacePersistenceLevel(surfaceId)` — returns the expected persistence level from the registry
- `describePersistenceLevel(level)` — human-readable description
- `isLiveRecord(level)` — returns true for ACCOUNT_RECORD and above
- `requiresBoundaryCopy(level)` — returns true for NONE/SESSION_PREVIEW/LOCAL_PREVIEW/PUBLIC_ROOT_PUBLISHED
- `getRecordBoundaryLabel(level)` — human-readable label for UI display
- `SurfaceRecordBoundary` type — full boundary specification for a surface

### Subsequent enhancements (Agent 1):
- Added `LOCAL_PREVIEW` and `PUBLIC_ROOT_PUBLISHED` levels
- Added `SurfaceRecordBoundary` type with `createsRecord`, `systemOfRecord`, `boundaryCopy` fields
- Added `isLiveRecord()`, `requiresBoundaryCopy()`, `getRecordBoundaryLabel()` helpers
- `public-anchor-log` updated from `NONE` to `PUBLIC_ROOT_PUBLISHED`
- `StrategyRoomSessionRef` type added to `decision-centre-contract.ts` with `provenanceStatus: "not_available"`
- `strategyRoomRecord` populated in API response and rendered in Decision Centre case cards
- `save-case-continuity.ts` created; `session-case-continuity.ts` refactored as compatibility shim

---

## UI Boundary Copy

Added to **Decision Centre page** (`pages/decision-centre.tsx`) — a footer note visible when cases are loaded:

> Authenticated Decision Centre records are reconstructed from available account and diagnostic evidence. Session-only previews must be saved before they become account-bound governed cases.

Also added to **Strategy Room session page** (`pages/strategy-room/session/[id].tsx`) by Agent 1:

> This session is persisted and retrievable at this URL. Decision Centre shows this record as active for your case.
> Provenance status: case-specific provenance is not yet available for Strategy Room records.

---

## Tests Added

Added to `lib/admin/product-surface-registry.test.ts`:

1. **Decision Centre is not described as system of record unless backed by account/server data** — verifies the registry description does not overclaim
2. **Sample/preview pages are marked SESSION_PREVIEW, NONE, or PUBLIC_ROOT_PUBLISHED** — verifies Board Summary, Calculator, Provenance Sample, Anchor Log have correct persistence levels
3. **Provenance Sample is NONE, not live record** — explicit check
4. **Public Anchor Log is PUBLIC_ROOT_PUBLISHED, not a live governed record** — explicit check
5. **Return Brief explainer is GOVERNED_CASE (route exists)** — the page has a live route
6. **Strategy Room is not labelled PROVENANCE_BACKED unless provenance exists** — checks the registry entry
7. **Oversight Brief is PROVENANCE_BACKED** — has chain-of-custody provenance
8. **Proof Pack is PROVENANCE_BACKED** — has chain-of-custody provenance
9. **Every registry surface has a persistence level defined** — all 22 surfaces mapped

---

## Known Gaps

| Gap | Severity | Notes |
|---|---|---|
| **Board Summary has no server persistence** | Low by design | It's explicitly a preview. The live case continues in Decision Centre. |
| **Decision Delay Calculator has no server persistence** | Low by design | It's a scenario tool. SessionStorage carry-forward was added in Agent 3. |
| **Fast Diagnostic draft uses localStorage** | Low | Draft recovery only. Final result is server-persisted. |
| **No external anchoring for provenance** | Medium | Both provenance pages note "not yet configured". This is transparent but may concern evaluators. |
| **Decision Centre requires authentication** | Medium | AuthRequired state has no sign-up flow. Users who aren't authenticated see an empty state. |
| **Strategy Room provenance not yet available** | Low | `provenanceStatus: "not_available"` until DECISION_CASE provenance composition is supported. |
| **session-case-continuity.test.ts out of date** | Low | Test references old API after `save-case-continuity.ts` refactor. Not in Agent 2 scope. |

---

## Verification

| Check | Result |
|---|---|
| `pnpm typecheck` | ⚠️ 2 errors in `session-case-continuity.test.ts` (out of Agent 2 scope — test references old API after Agent 1's `save-case-continuity.ts` refactor) |
| `pnpm vitest run lib/admin/product-surface-registry.test.ts` | ✅ 35/35 pass |
| `git diff --check` | ✅ Clean |
