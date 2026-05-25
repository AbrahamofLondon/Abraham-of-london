# Foundry Fix Audit

**Date:** 2026-05-25
**Standard:** `docs/research/foundry-fix-standard.md`
**Registry:** `lib/research/foundry-rule-registry.ts`

## Audit Method

For each adapter/bridge/service, the following are checked:
- Fix or assumption found
- Is it semantic? (per Foundry Fix Standard definition)
- Rule ID assigned?
- Source trace present?
- Limitation present?
- Promotion requirement present?
- Test present?
- Documentation present?

## Results

### 1. Fast Diagnostic Adapter

| Check | Status |
|---|---|
| File | `lib/research/engines/fast-diagnostic-adapter.ts` |
| Semantic fix | Real scoring only; AI synthesis not wrapped |
| Rule ID | `adapter:fast_diagnostic_validation_scoring_only_v1` |
| Source trace | Formula steps present with sourceRule |
| Limitation | Present in header and output |
| Promotion requirement | Present in output |
| Test | `tests/research/engines/fast-diagnostic-adapter.test.ts` |
| Documentation | Engine registry entry |
| **Status** | **COMPLIANT** |

### 2. Pattern Recurrence Adapter

| Check | Status |
|---|---|
| File | `lib/research/engines/pattern-recurrence-adapter.ts` |
| Semantic fix | Recurrence detection with synthetic baseline/current |
| Rule ID | `adapter:pattern_recurrence_detection_v1` |
| Source trace | Formula steps present with sourceRule |
| Limitation | Present in header and output |
| Promotion requirement | Present in output |
| Test | `tests/research/engines/pattern-recurrence-adapter.test.ts` |
| Documentation | Engine registry entry |
| **Status** | **COMPLIANT** |

### 3. Constitutional Diagnostic Adapter

| Check | Status |
|---|---|
| File | `lib/research/engines/constitutional-diagnostic-adapter.ts` |
| Semantic fix | Deterministic bundle only; no AI claim |
| Rule ID | `adapter:constitutional_diagnostic_deterministic_bundle_v1` |
| Source trace | Formula steps present with sourceRule |
| Limitation | Present in header and output |
| Promotion requirement | Present in output |
| Test | `tests/research/engines/constitutional-diagnostic-adapter.test.ts` |
| Documentation | Engine registry entry |
| **Status** | **COMPLIANT** |

### 4. Strategy Room Adapter

| Check | Status |
|---|---|
| File | `lib/research/engines/strategy-room-adapter.ts` |
| Semantic fix 1 | Directive derivation from synthetic TensionThread |
| Rule ID 1 | `adapter:strategy_room_directive_derivation_v1` |
| Semantic fix 2 | Authority gate overrides score threshold |
| Rule ID 2 | `adapter:strategy_room_authority_override_v1` |
| Source trace | Formula steps present with sourceRule |
| Limitation | Present in header and output |
| Promotion requirement | Present in output |
| Test | `tests/research/engines/strategy-room-adapter.test.ts` |
| Documentation | Engine registry entry |
| **Status** | **COMPLIANT** |

### 5. Boardroom Mode Adapter

| Check | Status |
|---|---|
| File | `lib/research/engines/boardroom-mode-adapter.ts` |
| Semantic fix 1 | Synthetic IntelligenceSpine limitation |
| Rule ID 1 | `adapter:boardroom_synthetic_spine_dossier_v1` |
| Semantic fix 2 | Qualification gate: cost + accuracy threshold |
| Rule ID 2 | `adapter:boardroom_qualification_gate_v1` |
| Source trace | Formula steps present with sourceRule |
| Limitation | Present in header and output |
| Promotion requirement | Present in output |
| Test | `tests/research/engines/boardroom-mode-adapter.test.ts` |
| Documentation | Engine registry + readiness doc |
| **Status** | **COMPLIANT** |

### 6. Executive Reporting Adapter

| Check | Status |
|---|---|
| File | `lib/research/engines/executive-reporting-adapter.ts` |
| Semantic fix 1 | Synthetic fixture limitation |
| Rule ID 1 | `adapter:executive_reporting_builder_fixture_v1` |
| Semantic fix 2 | State classification thresholds |
| Rule ID 2 | `adapter:executive_reporting_state_thresholds_v1` |
| Semantic fix 3 | Financial exposure calculation |
| Rule ID 3 | `adapter:executive_reporting_financial_exposure_v1` |
| Source trace | Formula steps present with sourceRule |
| Limitation | Present in header and output |
| Promotion requirement | Present in output |
| Test | `tests/research/engines/executive-reporting-adapter.test.ts` |
| Documentation | Engine registry + audit doc |
| **Status** | **COMPLIANT** |

### 7. ER → Boardroom Bridge

| Check | Status |
|---|---|
| File | `lib/research/engines/executive-report-boardroom-bridge-adapter.ts` |
| Semantic fix 1 | Financial exposure monthly normalisation |
| Rule ID 1 | `bridge:financial_exposure_monthly_normalisation_v1` |
| Semantic fix 2 | ER state to spine condition class |
| Rule ID 2 | `bridge:er_state_to_spine_condition_class_v1` |
| Semantic fix 3 | Failure modes to contradiction set |
| Rule ID 3 | `bridge:failure_modes_to_contradiction_set_v1` |
| Semantic fix 4 | Narrative to synthesis |
| Rule ID 4 | `bridge:narrative_to_synthesis_v1` |
| Semantic fix 5 | Priority stack to concrete move |
| Rule ID 5 | `bridge:priority_stack_to_concrete_move_v1` |
| Semantic fix 6 | Resonance to C3 specificity |
| Rule ID 6 | `bridge:resonance_to_c3_specificity_v1` |
| Semantic fix 7 | HCD/OGR data loss |
| Rule ID 7 | `bridge:hcd_ogr_data_loss_v1` |
| Source trace | Present with rationale (updated in this pass) |
| Limitation | Present in mapper and adapter |
| Promotion requirement | Present in mapper and adapter |
| Test | `tests/research/bridges/*.test.ts`, `tests/research/engines/executive-report-boardroom-bridge-adapter.test.ts` |
| Documentation | `docs/research/executive-report-boardroom-bridge.md` |
| **Status** | **COMPLIANT** (updated in this pass) |

### 8. Performance Range

| Check | Status |
|---|---|
| File | `lib/research/performance-range-service.ts` |
| Semantic fix | Bounded to 25 iterations, 10s total |
| Rule ID | `performance:bounded_internal_benchmark_v1` |
| Source trace | N/A (pure service, not an adapter) |
| Limitation | Present in header and output |
| Promotion requirement | Present in header |
| Test | `tests/research/performance-range.test.ts` |
| Documentation | Engine registry |
| **Status** | **COMPLIANT** |

## Summary

| Adapter/Service | Status |
|---|---|
| Fast Diagnostic | COMPLIANT |
| Pattern Recurrence | COMPLIANT |
| Constitutional Diagnostic | COMPLIANT |
| Strategy Room | COMPLIANT |
| Boardroom Mode | COMPLIANT |
| Executive Reporting | COMPLIANT |
| ER → Boardroom Bridge | COMPLIANT (updated) |
| Performance Range | COMPLIANT |

**All adapters and services are COMPLIANT with the Foundry Fix Standard.**

## Notes

- The ER → Boardroom Bridge mapper was updated in this pass to use named rule IDs and add rationale to all mapping traces.
- The `MappingTrace` type was extended with an optional `rationale` field.
- The `foundry-rule-registry.ts` contains 18 named rules covering all semantic fixes.
- The canary test `tests/research/canary/foundry-fix-standard.test.ts` enforces the standard going forward.
