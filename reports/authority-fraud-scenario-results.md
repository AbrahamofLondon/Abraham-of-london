# Authority Fraud Scenario Results

Generated: 2026-06-14T08:31:51.224Z

Gate: PASSED_ALL_FRAUDULENT_AUTHORITY_SCENARIOS_BLOCKED

Scenarios tested: 7

All fraudulent authority scenarios blocked: yes

| Scenario | Description | Declared | Effective | Result | Missing Checks |
| --- | --- | --- | --- | --- | --- |
| contract_positive_ledger_missing | contract says diagnostic_product but ledger missing | diagnostic_product | pending_reconciliation | BLOCKED | ledger_entry_exists, scenario_artifact_exists, rendered_output_artifact_exists, scenario_hash_matches, rendered_output_hash_matches, validation_run_hash_exists, quality_tests_exist, boundary_flags_clean, route_proof_exists, surface_propagation_exists, claim_boundary_scan_passes, no_mock_scan_passes |
| ledger_passed_rendered_output_missing | ledger says passed but rendered output missing | externally_proven_gold_product | pending_reconciliation | BLOCKED | rendered_output_artifact_exists, rendered_output_hash_matches |
| rendered_output_hash_mismatch | rendered output exists but hash mismatch | diagnostic_product | pending_reconciliation | BLOCKED | rendered_output_hash_matches |
| report_complete_contract_pending | report says complete but contract still pending | legacy_validated_pending_v2_revalidation | legacy_validated_pending_v2_revalidation | BLOCKED |  |
| surface_proven_effective_pending | surface says proven but effective state pending | externally_proven_gold_product | pending_reconciliation | BLOCKED | surface_propagation_exists, claim_boundary_scan_passes |
| board_guard_fails_estate_passes | board-facing guard fails but estate gate passes | judgement_product | pending_reconciliation | BLOCKED | board_facing_guard_passes |
| no_mock_high_findings_authority_restore | no-mock scan reports high findings but authority tries to restore | diagnostic_product | pending_reconciliation | BLOCKED | no_mock_scan_passes |
