# Product Authority Truth Reconciliation

Generated: 2026-06-14T08:52:25.907Z

Gate: PASSED_AS_RECONCILIATION_WITH_HOLDS

## Summary

- validatedAndSupported: 0
- pendingReconciliation: 4
- contractOnly: 0
- ledgerOnly: 0
- runtimeOutputMissing: 0
- authorityOverstated: 0
- blockedCorrectly: 15

| Product | Contract State | Ledger State | Ledger Artifacts | Rendered Output | Runtime Wiring | Surface Propagation | Claim Boundary | Truth State | Required Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fast_diagnostic | pending_reconciliation | no_ledger_entry | ledger_missing | rendered_output_missing | defined_only | surface_authority_visible | bounded | pending_reconciliation | Reconcile contract, ledger, rendered output, route proof, and surface propagation. |
| enterprise_assessment | legacy_validated_pending_v2_revalidation | no_ledger_entry | ledger_missing | rendered_output_missing | contract_only | surface_authority_visible | bounded | pending_reconciliation | Reconcile contract, ledger, rendered output, route proof, and surface propagation. |
| team_assessment | legacy_validated_pending_v2_revalidation | legacy_validated_pending_v2_revalidation | ledger_artifacts_present | rendered_output_hash_artifact_found | defined_only | surface_authority_visible | bounded | blocked_correctly | Validation artifacts exist (ledger trusted, rendered output substantive). Authority remains non-restored because ProductAuthorityContract has not granted restored authority and reconciliation has not been updated. |
| executive_reporting | blocked_until_v2_revalidation | no_ledger_entry | ledger_missing | rendered_output_missing | blocked_correctly | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| board_brief_builder | blocked_until_claim_evidenced | no_ledger_entry | ledger_missing | rendered_output_missing | infrastructure_only | surface_authority_visible | bounded | pending_reconciliation | Wire board evidence-governance into runtime engine and expand board-facing guard before validation. |
| boardroom_brief | blocked_until_v2_revalidation | no_ledger_entry | ledger_missing | rendered_output_missing | infrastructure_only | surface_authority_visible | bounded | pending_reconciliation | Wire board evidence-governance into runtime engine and expand board-facing guard before validation. |
| boardroom_mode | blocked_until_v2_revalidation | no_ledger_entry | ledger_missing | rendered_output_missing | defined_only | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| personal_decision_audit | blocked_until_claim_evidenced | no_ledger_entry | ledger_missing | rendered_output_missing | blocked_correctly | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| decision_exposure_instrument | blocked_until_claim_evidenced | no_ledger_entry | ledger_missing | rendered_output_missing | blocked_correctly | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| mandate_clarity_framework | blocked_until_claim_evidenced | no_ledger_entry | ledger_missing | rendered_output_missing | blocked_correctly | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| intervention_path_selector | blocked_until_claim_evidenced | no_ledger_entry | ledger_missing | rendered_output_missing | blocked_correctly | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| escalation_readiness_scorecard | blocked_until_claim_evidenced | no_ledger_entry | ledger_missing | rendered_output_missing | blocked_correctly | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| execution_risk_index | blocked_until_claim_evidenced | no_ledger_entry | ledger_missing | rendered_output_missing | blocked_correctly | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| governance_drift_detector | blocked_until_claim_evidenced | no_ledger_entry | ledger_missing | rendered_output_missing | blocked_correctly | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| decision_centre | no_contract | no_ledger_entry | ledger_missing | rendered_output_missing | runtime_wired_but_not_validated | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| control_room | no_contract | no_ledger_entry | ledger_missing | rendered_output_missing | runtime_wired_but_not_validated | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| operator_console | no_contract | no_ledger_entry | ledger_missing | rendered_output_missing | runtime_wired_but_not_validated | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| oversight_brief | no_contract | no_ledger_entry | ledger_missing | rendered_output_missing | defined_only | surface_authority_visible | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
| return_brief | no_contract | no_ledger_entry | ledger_missing | rendered_output_missing | defined_only | surface_propagation_missing | bounded | blocked_correctly | Maintain blocked state until validation artifacts exist. |
