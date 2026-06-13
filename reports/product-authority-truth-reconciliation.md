# Product Authority Truth Reconciliation

Generated: 2026-06-13T19:47:57.923Z

Gate: PASSED_AS_RECONCILIATION_WITH_HOLDS

## Summary

- validatedAndSupported: 0
- pendingReconciliation: 5
- contractOnly: 0
- ledgerOnly: 0
- runtimeOutputMissing: 0
- authorityOverstated: 0
- blockedCorrectly: 14

| Product | Contract State | Ledger State | Ledger Artifacts | Rendered Output | Runtime Wiring | Surface Propagation | Claim Boundary | Truth State | Required Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fast_diagnostic | pending_reconciliation | no_ledger_entry | ledger_missing | rendered_output_missing | defined_only | surface_authority_visible | bounded | pending_reconciliation | Reconcile contract, ledger, rendered output, route proof, and surface propagation. |
| enterprise_assessment | legacy_validated_pending_v2_revalidation | no_ledger_entry | ledger_missing | rendered_output_missing | contract_only | surface_authority_visible | bounded | pending_reconciliation | Reconcile contract, ledger, rendered output, route proof, and surface propagation. |
| team_assessment | legacy_validated_pending_v2_revalidation | externally_proven_gold_product | authority_reconciliation_required | rendered_output_hash_artifact_found | defined_only | surface_authority_visible | bounded | pending_reconciliation | Reconcile contract, ledger, rendered output, route proof, and surface propagation. |
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
