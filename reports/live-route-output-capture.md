# Live Route Output Capture

## Gate Result

PASSED

## Doctrine

Live route output must be captured before any product can be externally proven gold.

## Routes Discovered

| Product | Required Route | Discovered Route | Exists | Notes |
|---|---|---|---|---|
| fast_diagnostic | /diagnostics/fast | /diagnostics/fast -> /foundry/decision-test | yes | next.config.mjs redirects /diagnostics/fast to the public kernel decision test route. |
| team_assessment | /team-assessment or equivalent | /diagnostics/team-assessment | yes | Customer-facing team assessment route exists as a diagnostics route. |
| enterprise_assessment | /enterprise-assessment or equivalent | /diagnostics/enterprise-assessment | yes | Customer-facing enterprise assessment route exists as a diagnostics route. |
| case_dossier_tariff_shock | /evidence/tariff-shock or equivalent | /evidence/tariff-shock-growth-break | yes | Catalog successPath points to this evidence dossier route. |
| case_dossier_team_alignment | /evidence/team-alignment or equivalent | /evidence/team-alignment-illusion | yes | Catalog successPath points to this evidence dossier route. |
| case_dossier_escalation_denied | /evidence/escalation-denied or equivalent | /evidence/escalation-denied-case | yes | Catalog successPath points to this evidence dossier route. |
| personal_decision_audit | /test-your-decision or decision instrument route | /test-your-decision | yes | The route is currently a routing layer, not a completed paid decision-instrument output route. |
| strategy_room | /consulting/strategy-room or strategy-room session route | /strategy-room | yes | /consulting/strategy-room redirects to /diagnostics; /strategy-room is the active customer-facing strategy room surface. |

## Captures

| Product | Route | Scenario | Method | Uses Judgement Engine | Fields Present |
|---|---|---|---|---|---|
| fast_diagnostic | /diagnostics/fast -> /foundry/decision-test | pricing-ownership | api_response | yes | diagnosis, consequence, nextMove, falsification, escalation, executionSequence |
| team_assessment | /diagnostics/team-assessment | team-misalignment | component_render | yes | diagnosis, consequence, nextMove, falsification, escalation, executionSequence |
| enterprise_assessment | /diagnostics/enterprise-assessment | board-disagreement | component_render | yes | diagnosis, consequence, nextMove, falsification, escalation, executionSequence |
| case_dossier_tariff_shock | /evidence/tariff-shock-growth-break | tariff-route-proof | component_render | no | diagnosis, consequence, nextMove, falsification, escalation, executionSequence |
| case_dossier_team_alignment | /evidence/team-alignment-illusion | team-alignment-route-proof | component_render | no | diagnosis, consequence, nextMove, falsification, escalation, executionSequence |
| case_dossier_escalation_denied | /evidence/escalation-denied-case | escalation-route-proof | component_render | no | diagnosis, consequence, nextMove, falsification, escalation, executionSequence |
| personal_decision_audit | /test-your-decision | budget-cut | component_render | yes | diagnosis, consequence, nextMove, falsification, escalation, executionSequence |
| strategy_room | /strategy-room | board-disagreement | component_render | yes | diagnosis, consequence, nextMove, falsification, escalation, executionSequence |

## Counts

- Routes discovered: 8
- Products tested: 8
- Rendered output captured: 8
- Captures with all judgement fields: 8
- Judgement-engine captures: 5

## Gaps

None at route-discovery level. Product gold remains governed by the external product value benchmark.
