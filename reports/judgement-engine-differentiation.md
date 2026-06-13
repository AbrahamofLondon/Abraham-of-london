# Judgement Engine Differentiation Review

## Gate Result

PASSED

## Scenarios Tested

12 golden scenarios: Pricing ownership ambiguity; Hiring freeze prioritisation; Board disagreement over expansion; Market entry uncertainty; Delivery deadline slippage; Founder delegation failure; Team misalignment after reorganisation; Evidence conflict between models; Budget cut response paralysis; Product launch risk blindness; Customer churn retention drift; Compliance control breakdown.

## Patterns Detected

### fast_diagnostic

- pricing-ownership: expected ownership_ambiguity, detected ownership_ambiguity; evidence "unclear who owns" matched in decisionDescription, "unclear who owns" matched in evidenceAvailable, "ownership" matched in evidenceAvailable, "ownership" matched in priorAttempts, "no single owner" matched in decisionDescription, "no single owner" matched in evidenceAvailable, "sits between" matched in decisionDescription, "sits between" matched in evidenceAvailable, "nobody accountable" matched in decisionDescription, "nobody accountable" matched in constraint, "unclear authority" matched in decisionDescription, "unclear authority" matched in constraint, "unclear authority" matched in evidenceAvailable
- hiring-freeze: expected resource_constraint, detected resource_constraint; evidence "hiring freeze" matched in decisionDescription, "hiring freeze" matched in evidenceAvailable, "headcount" matched in decisionDescription, "headcount" matched in evidenceAvailable, "capacity" matched in decisionDescription, "capacity" matched in constraint, "capacity" matched in evidenceAvailable, "stretched" matched in decisionDescription, "stretched" matched in evidenceAvailable
- board-disagreement: expected authority_conflict, detected authority_conflict; evidence "board disagrees" matched in decisionDescription, "board disagrees" matched in evidenceAvailable, "intervened" matched in decisionDescription, "intervened" matched in constraint, "chair and ceo" matched in decisionDescription, "chair and ceo" matched in evidenceAvailable
- market-entry: expected market_uncertainty, detected market_uncertainty; evidence "market entry" matched in decisionDescription, "market entry" matched in evidenceAvailable, "uncertain demand" matched in decisionDescription, "uncertain demand" matched in evidenceAvailable, "unproven market" matched in decisionDescription, "unproven market" matched in evidenceAvailable
- deadline-slippage: expected timing_pressure, detected timing_pressure; evidence "deadline" matched in decisionDescription, "deadline" matched in evidenceAvailable, "slipping" matched in decisionDescription, "slipping" matched in evidenceAvailable, "launch date" matched in decisionDescription, "launch date" matched in evidenceAvailable
- founder-delegation: expected operational_bottleneck, detected operational_bottleneck; evidence "everything goes through" matched in decisionDescription, "everything goes through" matched in evidenceAvailable, "founder approves" matched in decisionDescription, "founder approves" matched in evidenceAvailable, "bottleneck" matched in evidenceAvailable, "delegation" matched in decisionDescription, "delegation" matched in constraint, "delegation" matched in evidenceAvailable, "delegation" matched in priorAttempts
- team-misalignment: expected stakeholder_misalignment, detected stakeholder_misalignment; evidence "conflicting answers" matched in decisionDescription, "conflicting answers" matched in evidenceAvailable, "different priorities" matched in decisionDescription, "different priorities" matched in constraint, "pulling in different directions" matched in decisionDescription, "pulling in different directions" matched in evidenceAvailable
- evidence-conflict: expected evidence_gap, detected evidence_gap; evidence "contradict" matched in decisionDescription, "contradict" matched in evidenceAvailable, "models disagree" matched in decisionDescription, "models disagree" matched in evidenceAvailable, "two models" matched in decisionDescription, "two models" matched in evidenceAvailable
- budget-cut: expected decision_paralysis, detected decision_paralysis; evidence "can't decide" matched in decisionDescription, "can't decide" matched in evidenceAvailable, "six weeks" matched in decisionDescription, "six weeks" matched in evidenceAvailable, "deliberating" matched in decisionDescription, "deliberating" matched in evidenceAvailable, "another review" matched in decisionDescription, "another review" matched in constraint, "another review" matched in evidenceAvailable, "deferred again" matched in evidenceAvailable, "deferred again" matched in priorAttempts
- launch-risk: expected risk_blindness, detected risk_blindness; evidence "ignoring warning" matched in decisionDescription, "ignoring warning" matched in evidenceAvailable, "red flag" matched in decisionDescription, "red flag" matched in evidenceAvailable, "red flag" matched in priorAttempts, "dismissed concern" matched in decisionDescription, "dismissed concern" matched in evidenceAvailable, "confidence stayed" matched in decisionDescription, "confidence stayed" matched in constraint, "warning signs" matched in decisionDescription, "warning signs" matched in evidenceAvailable, "failure signals" matched in desiredOutcome
- churn-drift: expected execution_drift, detected execution_drift; evidence "promised but not" matched in decisionDescription, "promised but not" matched in evidenceAvailable, "keeps slipping" matched in decisionDescription, "keeps slipping" matched in constraint, "committed work" matched in decisionDescription, "committed work" matched in evidenceAvailable, "still not done" matched in decisionDescription, "still not done" matched in evidenceAvailable, "quietly dropped" matched in evidenceAvailable
- compliance-breakdown: expected governance_failure, detected governance_failure; evidence "compliance" matched in decisionDescription, "compliance" matched in stakeholders, "compliance" matched in evidenceAvailable, "breach" matched in decisionDescription, "breach" matched in evidenceAvailable, "audit finding" matched in decisionDescription, "audit finding" matched in evidenceAvailable, "control failed" matched in decisionDescription, "control failed" matched in evidenceAvailable, "regulator" matched in deadline, "regulator" matched in desiredOutcome

### free_signal

- pricing-ownership: expected ownership_ambiguity, detected ownership_ambiguity; evidence "unclear who owns" matched in decisionDescription, "unclear who owns" matched in evidenceAvailable, "no single owner" matched in decisionDescription, "no single owner" matched in evidenceAvailable, "sits between" matched in decisionDescription, "sits between" matched in evidenceAvailable, "nobody accountable" matched in constraint, "unclear authority" matched in decisionDescription, "unclear authority" matched in constraint, "unclear authority" matched in evidenceAvailable
- hiring-freeze: expected resource_constraint, detected resource_constraint; evidence "hiring freeze" matched in decisionDescription, "hiring freeze" matched in evidenceAvailable, "headcount" matched in decisionDescription, "headcount" matched in evidenceAvailable, "capacity" matched in decisionDescription, "capacity" matched in constraint, "capacity" matched in evidenceAvailable, "stretched" matched in decisionDescription, "stretched" matched in evidenceAvailable
- board-disagreement: expected authority_conflict, detected authority_conflict; evidence "board disagrees" matched in decisionDescription, "board disagrees" matched in evidenceAvailable, "intervened" matched in constraint, "chair and ceo" matched in decisionDescription, "chair and ceo" matched in evidenceAvailable
- market-entry: expected market_uncertainty, detected market_uncertainty; evidence "market entry" matched in decisionDescription, "market entry" matched in evidenceAvailable, "uncertain demand" matched in decisionDescription, "uncertain demand" matched in evidenceAvailable, "unproven market" matched in decisionDescription, "unproven market" matched in evidenceAvailable
- deadline-slippage: expected timing_pressure, detected timing_pressure; evidence "deadline" matched in decisionDescription, "deadline" matched in evidenceAvailable, "slipping" matched in decisionDescription, "slipping" matched in evidenceAvailable, "launch date" matched in decisionDescription, "launch date" matched in evidenceAvailable
- founder-delegation: expected operational_bottleneck, detected operational_bottleneck; evidence "everything goes through" matched in decisionDescription, "everything goes through" matched in evidenceAvailable, "founder approves" matched in decisionDescription, "founder approves" matched in evidenceAvailable, "bottleneck" matched in decisionDescription, "bottleneck" matched in evidenceAvailable, "delegation" matched in decisionDescription, "delegation" matched in constraint, "delegation" matched in evidenceAvailable
- team-misalignment: expected stakeholder_misalignment, detected stakeholder_misalignment; evidence "conflicting answers" matched in decisionDescription, "conflicting answers" matched in evidenceAvailable, "different priorities" matched in constraint, "pulling in different directions" matched in decisionDescription, "pulling in different directions" matched in evidenceAvailable
- evidence-conflict: expected evidence_gap, detected evidence_gap; evidence "contradict" matched in decisionDescription, "contradict" matched in evidenceAvailable, "models disagree" matched in decisionDescription, "models disagree" matched in evidenceAvailable, "two models" matched in decisionDescription, "two models" matched in evidenceAvailable
- budget-cut: expected decision_paralysis, detected decision_paralysis; evidence "can't decide" matched in decisionDescription, "can't decide" matched in evidenceAvailable, "six weeks" matched in decisionDescription, "six weeks" matched in evidenceAvailable, "deliberating" matched in decisionDescription, "deliberating" matched in evidenceAvailable, "another review" matched in decisionDescription, "another review" matched in constraint, "another review" matched in evidenceAvailable
- launch-risk: expected risk_blindness, detected risk_blindness; evidence "ignoring warning" matched in decisionDescription, "ignoring warning" matched in evidenceAvailable, "red flag" matched in decisionDescription, "red flag" matched in evidenceAvailable, "dismissed concern" matched in decisionDescription, "dismissed concern" matched in evidenceAvailable, "confidence stayed" matched in constraint, "warning signs" matched in decisionDescription, "warning signs" matched in evidenceAvailable, "failure signals" matched in desiredOutcome
- churn-drift: expected execution_drift, detected execution_drift; evidence "promised but not" matched in decisionDescription, "promised but not" matched in evidenceAvailable, "keeps slipping" matched in constraint, "committed work" matched in decisionDescription, "committed work" matched in evidenceAvailable, "still not done" matched in decisionDescription, "still not done" matched in evidenceAvailable, "quietly dropped" matched in decisionDescription, "quietly dropped" matched in evidenceAvailable
- compliance-breakdown: expected governance_failure, detected governance_failure; evidence "compliance" matched in decisionDescription, "compliance" matched in stakeholders, "compliance" matched in evidenceAvailable, "breach" matched in decisionDescription, "breach" matched in evidenceAvailable, "audit finding" matched in decisionDescription, "audit finding" matched in evidenceAvailable, "control failed" matched in decisionDescription, "control failed" matched in evidenceAvailable, "regulator" matched in deadline, "regulator" matched in desiredOutcome

### decision_instrument

- pricing-ownership: expected ownership_ambiguity, detected ownership_ambiguity; evidence "unclear who owns" matched in decisionDescription, "ownership" matched in priorAttempts, "no single owner" matched in decisionDescription, "no single owner" matched in evidenceAvailable, "sits between" matched in decisionDescription, "nobody accountable" matched in constraint, "unclear authority" matched in constraint, "unclear authority" matched in evidenceAvailable
- hiring-freeze: expected resource_constraint, detected resource_constraint; evidence "hiring freeze" matched in decisionDescription, "headcount" matched in decisionDescription, "capacity" matched in constraint, "capacity" matched in evidenceAvailable, "stretched" matched in decisionDescription
- board-disagreement: expected authority_conflict, detected authority_conflict; evidence "board disagrees" matched in decisionDescription, "intervened" matched in constraint, "chair and ceo" matched in decisionDescription
- market-entry: expected market_uncertainty, detected market_uncertainty; evidence "market entry" matched in decisionDescription, "uncertain demand" matched in decisionDescription, "unproven market" matched in decisionDescription
- deadline-slippage: expected timing_pressure, detected timing_pressure; evidence "deadline" matched in decisionDescription, "slipping" matched in decisionDescription, "launch date" matched in decisionDescription
- founder-delegation: expected operational_bottleneck, detected operational_bottleneck; evidence "everything goes through" matched in decisionDescription, "founder approves" matched in decisionDescription, "bottleneck" matched in evidenceAvailable, "delegation" matched in decisionDescription, "delegation" matched in constraint, "delegation" matched in priorAttempts
- team-misalignment: expected stakeholder_misalignment, detected stakeholder_misalignment; evidence "conflicting answers" matched in decisionDescription, "different priorities" matched in constraint, "pulling in different directions" matched in decisionDescription
- evidence-conflict: expected evidence_gap, detected evidence_gap; evidence "contradict" matched in decisionDescription, "models disagree" matched in decisionDescription, "two models" matched in decisionDescription
- budget-cut: expected decision_paralysis, detected decision_paralysis; evidence "can't decide" matched in decisionDescription, "six weeks" matched in decisionDescription, "deliberating" matched in decisionDescription, "another review" matched in decisionDescription, "another review" matched in constraint, "deferred again" matched in priorAttempts
- launch-risk: expected risk_blindness, detected risk_blindness; evidence "ignoring warning" matched in decisionDescription, "red flag" matched in decisionDescription, "red flag" matched in priorAttempts, "dismissed concern" matched in decisionDescription, "confidence stayed" matched in constraint, "warning signs" matched in decisionDescription, "failure signals" matched in desiredOutcome
- churn-drift: expected execution_drift, detected execution_drift; evidence "promised but not" matched in decisionDescription, "keeps slipping" matched in constraint, "committed work" matched in decisionDescription, "still not done" matched in decisionDescription, "quietly dropped" matched in evidenceAvailable
- compliance-breakdown: expected governance_failure, detected governance_failure; evidence "compliance" matched in decisionDescription, "breach" matched in decisionDescription, "audit finding" matched in decisionDescription, "audit finding" matched in evidenceAvailable, "control failed" matched in decisionDescription, "regulator" matched in deadline, "regulator" matched in desiredOutcome

### strategy_room_session

- pricing-ownership: expected ownership_ambiguity, detected ownership_ambiguity; evidence "unclear who owns" matched in decisionDescription, "no single owner" matched in decisionDescription, "no single owner" matched in evidenceAvailable, "sits between" matched in decisionDescription, "nobody accountable" matched in constraint, "unclear authority" matched in constraint, "unclear authority" matched in evidenceAvailable
- hiring-freeze: expected resource_constraint, detected resource_constraint; evidence "hiring freeze" matched in decisionDescription, "headcount" matched in decisionDescription, "capacity" matched in constraint, "capacity" matched in evidenceAvailable, "stretched" matched in decisionDescription
- board-disagreement: expected authority_conflict, detected authority_conflict; evidence "board disagrees" matched in decisionDescription, "intervened" matched in constraint, "chair and ceo" matched in decisionDescription
- market-entry: expected market_uncertainty, detected market_uncertainty; evidence "market entry" matched in decisionDescription, "uncertain demand" matched in decisionDescription, "unproven market" matched in decisionDescription
- deadline-slippage: expected timing_pressure, detected timing_pressure; evidence "deadline" matched in decisionDescription, "slipping" matched in decisionDescription, "launch date" matched in decisionDescription
- founder-delegation: expected operational_bottleneck, detected operational_bottleneck; evidence "everything goes through" matched in decisionDescription, "founder approves" matched in decisionDescription, "bottleneck" matched in evidenceAvailable, "delegation" matched in decisionDescription, "delegation" matched in constraint
- team-misalignment: expected stakeholder_misalignment, detected stakeholder_misalignment; evidence "conflicting answers" matched in decisionDescription, "different priorities" matched in constraint, "pulling in different directions" matched in decisionDescription
- evidence-conflict: expected evidence_gap, detected evidence_gap; evidence "contradict" matched in decisionDescription, "models disagree" matched in decisionDescription, "two models" matched in decisionDescription
- budget-cut: expected decision_paralysis, detected decision_paralysis; evidence "can't decide" matched in decisionDescription, "six weeks" matched in decisionDescription, "deliberating" matched in decisionDescription, "another review" matched in decisionDescription, "another review" matched in constraint
- launch-risk: expected risk_blindness, detected risk_blindness; evidence "ignoring warning" matched in decisionDescription, "red flag" matched in decisionDescription, "dismissed concern" matched in decisionDescription, "confidence stayed" matched in constraint, "warning signs" matched in decisionDescription, "failure signals" matched in desiredOutcome
- churn-drift: expected execution_drift, detected execution_drift; evidence "promised but not" matched in decisionDescription, "keeps slipping" matched in constraint, "committed work" matched in decisionDescription, "still not done" matched in decisionDescription, "quietly dropped" matched in evidenceAvailable
- compliance-breakdown: expected governance_failure, detected governance_failure; evidence "compliance" matched in decisionDescription, "compliance" matched in stakeholders, "breach" matched in decisionDescription, "audit finding" matched in decisionDescription, "audit finding" matched in evidenceAvailable, "control failed" matched in decisionDescription, "regulator" matched in deadline, "regulator" matched in desiredOutcome

## Composers Tested

| Composer | Classification Passes | Max Overall Similarity | Max Diagnosis Similarity | Max Next-Move Similarity |
|---|---:|---:|---:|---:|
| fast_diagnostic | 12/12 | 10% | 7% | 18% |
| free_signal | 12/12 | 11% | 9% | 18% |
| decision_instrument | 12/12 | 13% | 15% | 20% |
| strategy_room_session | 12/12 | 12% | 7% | 24% |

## Similarity Results

- Similarity failures: 0
- Old 84% pair: 6% overall; eliminated: yes

## Generic Judgement Failures

None.

## Before / After Example

Before: The old fast_diagnostic output produced 84% identical judgement for a pricing-ownership case and a hiring-freeze case.

After: The same pair now scores 6% overall, 0% diagnosis, and 15% next-move similarity.

## Remaining Risks

- This gate tests composer-level rendered output, not every live route integration.
- Similarity is lexical; it is strong enough to catch template convergence, but it does not prove strategic correctness by itself.
- Gold remains blocked unless the external product value benchmark proves actual rendered output and route evidence.

## Recommendation

Judgement differentiation is GREEN at composer level; proceed to external product value benchmark without restoring gold by declaration.
