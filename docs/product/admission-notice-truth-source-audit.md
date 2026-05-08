# AdmissionNotice Truth Source Audit

**Date:** 2026-05-08
**Rule:** AdmissionNotice must receive truth from server-authoritative sources, not hardcoded values.

---

## Active renders

| Surface | File | Status prop | Evidence tier | Case reference | Truth source |
|---------|------|-------------|--------------|---------------|-------------|
| Strategy Room execution chamber | `pages/strategy-room/index.tsx` | `"ADMITTED"` (user is in execution — admission already passed at API level) | Derived via `deriveEvidenceTierFromStages()` from canonical sections | Real `executionSessionId` | REAL — admission enforced by API, evidence derived from available state |
| Return Brief | `app/briefing/return/[sessionId]/page.tsx` | `"ADMITTED"` (user is viewing brief — access already validated) | Derived from outcome confidence | Real `sessionKey` | REAL — access validated by `assertStrategyRoomAccess()` |
| Decision Centre | `pages/decision-centre.tsx` | From `admission.executiveReporting.status` / `admission.strategyRoom.status` | From `isAdmissibleFor()` via API | Real `caseId` | REAL — server-derived from `deriveLivingCase()` |

## Hardcoded values removed in this pass

| File | Previous value | Replacement |
|------|---------------|-------------|
| `pages/strategy-room/index.tsx` | `evidenceTier="multi_source"` | `deriveEvidenceTierFromStages(sections.length)` |
| `pages/strategy-room/index.tsx` | `level="multi_source"` (EvidenceStrengthMeter) | `deriveEvidenceTierFromStages(sections.length)` |
| `pages/strategy-room/index.tsx` | `stagesCompleted={4}` | `Object.keys(canonical?.sections ?? {}).length` |

## Verdict

All AdmissionNotice renders now use real or derived data. No fake admission status. No hardcoded evidence tier. If data is unavailable, the component is conditionally omitted or shows derived defaults from available enforcement/canonical state.
