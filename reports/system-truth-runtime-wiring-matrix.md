# System Truth Runtime Wiring Matrix

Generated: 2026-06-13T19:59:56.760Z

Products audited: 19

## Summary

- Runtime wired: 11
- Rendered: 14
- Guarded: 16
- Tested: 19
- Infrastructure-only: 2
- Contract-only: 1
- Blocked correctly: 8

| Product | Authority State | Primitive | Defined | Imported | Runtime Wired | Rendered | Guarded | Tested | Actual Status | Blocking Reasons |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| fast_diagnostic | pending_reconciliation | ProductAuthorityContract | yes | no | no | no | yes | yes | defined_only | Governance primitive is not imported by mapped runtime files.; Governance primitive is not wired into product generation/runtime path.; Authority/evidence boundary is not visibly rendered on mapped UI surface. |
| enterprise_assessment | legacy_validated_pending_v2_revalidation | ProductAuthorityContract | yes | no | no | no | yes | yes | contract_only | Governance primitive is not imported by mapped runtime files.; Governance primitive is not wired into product generation/runtime path.; Authority/evidence boundary is not visibly rendered on mapped UI surface. |
| team_assessment | legacy_validated_pending_v2_revalidation | ProductAuthorityContract | yes | no | no | no | yes | yes | defined_only | Governance primitive is not imported by mapped runtime files.; Governance primitive is not wired into product generation/runtime path.; Authority/evidence boundary is not visibly rendered on mapped UI surface. |
| executive_reporting | blocked_until_v2_revalidation | ProductAuthorityContract | yes | yes | yes | yes | yes | yes | blocked_correctly |  |
| board_brief_builder | blocked_until_claim_evidenced | board_evidence_governance | yes | no | no | yes | yes | yes | infrastructure_only | Governance primitive is not imported by mapped runtime files.; Governance primitive is not wired into product generation/runtime path.; Current engine can emit BOARD_READY from user slider scores. |
| boardroom_brief | blocked_until_v2_revalidation | board_evidence_governance | yes | no | no | yes | yes | yes | infrastructure_only | Governance primitive is not imported by mapped runtime files.; Governance primitive is not wired into product generation/runtime path.; Current dossier generator quantifies user-derived cost without claim-level evidence classification. |
| boardroom_mode | blocked_until_v2_revalidation | ProductAuthorityContract | yes | no | no | no | yes | yes | defined_only | Governance primitive is not imported by mapped runtime files.; Governance primitive is not wired into product generation/runtime path.; Authority/evidence boundary is not visibly rendered on mapped UI surface. |
| personal_decision_audit | blocked_until_claim_evidenced | ProductAuthorityContract | yes | yes | yes | yes | yes | yes | blocked_correctly |  |
| decision_exposure_instrument | blocked_until_claim_evidenced | ProductAuthorityContract | yes | yes | yes | yes | yes | yes | blocked_correctly |  |
| mandate_clarity_framework | blocked_until_claim_evidenced | ProductAuthorityContract | yes | yes | yes | yes | yes | yes | blocked_correctly |  |
| intervention_path_selector | blocked_until_claim_evidenced | ProductAuthorityContract | yes | yes | yes | yes | yes | yes | blocked_correctly |  |
| escalation_readiness_scorecard | blocked_until_claim_evidenced | ProductAuthorityContract | yes | yes | yes | yes | yes | yes | blocked_correctly |  |
| execution_risk_index | blocked_until_claim_evidenced | ProductAuthorityContract | yes | yes | yes | yes | yes | yes | blocked_correctly |  |
| governance_drift_detector | blocked_until_claim_evidenced | ProductAuthorityContract | yes | yes | yes | yes | yes | yes | blocked_correctly |  |
| decision_centre | authority_unknown | ProductAuthorityContract | yes | yes | yes | yes | yes | yes | runtime_wired_but_not_validated |  |
| control_room | authority_unknown | ProductAuthorityContract | yes | yes | yes | yes | yes | yes | runtime_wired_but_not_validated |  |
| operator_console | authority_unknown | ProductAuthorityContract | yes | yes | yes | yes | no | yes | runtime_wired_but_not_validated | No meaningful guard coverage found for this product. |
| oversight_brief | authority_unknown | ProductAuthorityContract | yes | no | no | yes | no | yes | defined_only | Governance primitive is not imported by mapped runtime files.; Governance primitive is not wired into product generation/runtime path.; No meaningful guard coverage found for this product. |
| return_brief | authority_unknown | ProductAuthorityContract | yes | no | no | no | no | yes | defined_only | Governance primitive is not imported by mapped runtime files.; Governance primitive is not wired into product generation/runtime path.; Authority/evidence boundary is not visibly rendered on mapped UI surface.; No meaningful guard coverage found for this product. |
