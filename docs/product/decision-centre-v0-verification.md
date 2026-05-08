# Decision Centre v0 Verification

**Date:** 2026-05-07
**Status:** VERIFIED

---

## File existence

| File | Exists | Purpose |
|------|--------|---------|
| `pages/decision-centre.tsx` | YES | Governed case console page |
| `pages/api/decision-centre/cases.ts` | YES | Server-authoritative Living Case API |
| `lib/product/decision-centre-contract.ts` | YES | TypeScript types + cognitive state derivation |

## Compilation

| Check | Result |
|-------|--------|
| TypeScript (`npx tsc --noEmit`) | PASS — zero errors |
| Production build (`npx next build`) | PASS — exit code 0 |

## API verification

| Requirement | Status |
|-------------|--------|
| Requires authentication | YES — `resolveIdentity(req)` → 401 if not authenticated |
| Uses server-authoritative Living Case | YES — `deriveLivingCase({ email })` from Prisma |
| Does not use sessionStorage | YES — no sessionStorage reference in API |
| Returns `DecisionCentreResponse` type | YES — `satisfies DecisionCentreResponse` enforced |
| Returns empty array for no cases | YES — returns `{ ok: true, cases: [] }` |
| Returns 401 for unauthenticated | YES — `{ ok: false, reason: "AUTH_REQUIRED" }` |

## Page state handling

| State | Handled | UI |
|-------|---------|-----|
| Loading | YES | "Loading case state..." |
| Authentication required | YES | "Authentication required" with diagnostic CTA |
| No cases (empty) | YES | "No active cases under governance" with three diagnostic CTAs |
| Cases present | YES | Case cards with full governed state |

## Case card fields rendered

| Field | Rendered | Source |
|-------|----------|--------|
| Case title / decision statement | YES | `primaryDecision.decisionText` |
| Case reference | YES | `caseId` (truncated) |
| Cognitive state | YES | `deriveCognitiveState()` from Living Case |
| Evidence tier | YES | `evidenceTier` from journey |
| Completed stages checklist | YES | `EvidenceStrengthMeter` with bespoke contributions |
| ER admission status | YES | `isAdmissibleFor(case, "executive_reporting")` |
| SR admission status | YES | `isAdmissibleFor(case, "strategy_room")` |
| Repair actions (when restricted) | YES | Inline repair section with deduplicated actions |
| Return Briefs | YES | Listed with trajectory status and link |
| Outcome status | YES | Displayed when available |
| Continuity | YES | `ContinuityStatement` component |
| Next required action | YES | Derived from contradictions / missing stages / admission |
| Commercial (owned products) | YES | From `ClientEntitlement` |
| Decision Credit | YES | From `getCreditProfile()` (best-effort) |

## Commercial language audit

| Banned phrase | Found? |
|--------------|--------|
| Buy | NO |
| Unlock | NO |
| Upgrade | NO |
| Purchase | NO |
| Premium | NO |

**Used instead:** "Commission Executive Reporting", "Eligible — payment required", "Restricted — repair evidence", "Enter Strategy Room", "Return Brief available"

## Gaps fixed in this pass

1. Repair actions now shown inline when any surface is restricted
2. Return Briefs now rendered with trajectory status and link
3. Outcome status now displayed when available
4. "Repair actions not yet recorded" shown when no repair data exists (no invention)
