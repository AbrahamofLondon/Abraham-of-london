# Strategy Room Consulting Component Reclassification

**Date:** 2026-05-08

---

## Audited Components

### 1. `components/consulting/StrategyRoomIntake.tsx`
**Current purpose:** Consulting-focused intake form with constitutional decision routing
**Active imports:** ZERO — orphaned
**Overlap with canonical SR:** High — the canonical SR page (`pages/strategy-room/index.tsx`) already handles intake via its gate → entry brief → execution chamber flow
**Useful logic:** Constitutional route evaluation (`evaluateConstitutionalRoute`)
**Recommendation:** LEGACY — logic already exists in canonical flow. Safe to retire.

### 2. `components/consulting/StrategyRoomEntryRouter.tsx`
**Current purpose:** Entry router displaying pathway options (diagnostics, ER, SR)
**Active imports:** ZERO — orphaned
**Overlap with canonical SR:** Moderate — the diagnostics hub already routes users to appropriate surfaces
**Useful logic:** Pathway display pattern
**Recommendation:** LEGACY — pathway routing handled by diagnostics hub and admission modules. Safe to retire.

### 3. `components/consulting/StrategyRoomIntegration.tsx`
**Current purpose:** Integration component consolidating signals for consulting pathway
**Active imports:** ZERO — orphaned
**Overlap with canonical SR:** High — signal consolidation handled by Living Case derivation and room state contract
**Useful logic:** Signal aggregation patterns
**Recommendation:** LEGACY — signal consolidation now handled by `deriveLivingCase()` and room state. Safe to retire.

### 4. `components/strategy/StrategyRoomUnifiedIntake.tsx`
**Current purpose:** Unified intake form (fullName, email, organisation, role, jurisdiction, problemStatement)
**Active imports:** ZERO — orphaned
**Overlap with canonical SR:** High — enrollment handled by `enrol-core.ts` + canonical SR page gate
**Useful logic:** Form field structure
**Recommendation:** LEGACY — enrollment pipeline is canonical in `enrol-core.ts`. Safe to retire.

### 5. `components/StrategyRoom/Form.tsx` (PascalCase)
**Status:** DELETED in this pass. Zero imports confirmed.

### 6. `components/StrategyRoom/IntakeForm.tsx` (PascalCase)
**Status:** DELETED in this pass. Zero imports confirmed.

---

## Summary

| Component | Status | Recommendation |
|-----------|--------|---------------|
| consulting/StrategyRoomIntake.tsx | Orphaned | LEGACY — retire when confirmed |
| consulting/StrategyRoomEntryRouter.tsx | Orphaned | LEGACY — retire when confirmed |
| consulting/StrategyRoomIntegration.tsx | Orphaned | LEGACY — retire when confirmed |
| strategy/StrategyRoomUnifiedIntake.tsx | Orphaned | LEGACY — retire when confirmed |
| StrategyRoom/Form.tsx | DELETED | Was orphaned |
| StrategyRoom/IntakeForm.tsx | DELETED | Was orphaned |

All four remaining orphaned components are safe to delete but await explicit approval. Their logic has been superseded by:
- `lib/strategy-room/enrol-core.ts` (enrollment)
- `lib/strategy-room/admission.ts` (admission)
- `lib/product/living-case-store.ts` (signal consolidation)
- `pages/strategy-room/index.tsx` (execution chamber)

---

## Should any become part of Counsel Review?

No. Counsel Review is not a UI component — it is a governance state. The `CounselStatusPanel` component handles display. The `counsel-trigger.ts` module handles evaluation. The consulting components were intake forms, not governance engines.
