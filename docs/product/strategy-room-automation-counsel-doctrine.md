# Strategy Room Automation & Counsel Doctrine

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London

---

## Governing Principle

The Strategy Room is Execution Command — a mostly automated governed execution environment. Human counsel is an escalation layer, not a default service. The system governs by default. Counsel enters only when governance thresholds are exceeded.

---

## What the system governs automatically

| Function | Engine | Status |
|----------|--------|--------|
| Admission | `evaluateStrategyRoomAdmission()` | ACTIVE |
| Evidence review | `deriveLivingCase()` + evidence nodes | ACTIVE |
| Decision verification | ExecutionFlow 8-stage micro-tension validation | ACTIVE |
| Contradiction surfacing | Decision surface payload + contradiction graph | ACTIVE |
| Authority checking | `enforceStrategyRoomAccess()` + durable thread | ACTIVE |
| Consequence modelling | `DynamicConsequencePanel` with exposure/penalties | ACTIVE |
| Avoidance detection | `AvoidancePatternNotice` with pattern counting | ACTIVE |
| Escalation triggers | `EscalationTriggerPanel` with typed triggers | ACTIVE |
| Execution sequencing | DecisionLog with add/status/block handlers | ACTIVE |
| Commitment capture | ExecutionFlow forced commitment stage | ACTIVE |
| Return Brief | `generateReturnBrief()` at 14/30 days | ACTIVE |
| Outcome verification | `OutcomeVerificationRecord` classification | ACTIVE |

## What requires human counsel

| Trigger | Reason | System action |
|---------|--------|--------------|
| HIGH_FINANCIAL_EXPOSURE + CONTESTED_AUTHORITY | Combined risk exceeds automated governance | REQUIRE_COUNSEL_REVIEW |
| LEGAL_OR_REGULATORY_SENSITIVITY | Cannot be resolved programmatically | PAUSE_EXECUTION |
| BOARD_CONFLICT | Governance-level disagreement | REQUIRE_COUNSEL_REVIEW |
| MULTI_STAKEHOLDER_DEADLOCK | No unilateral execution path | REQUIRE_COUNSEL_REVIEW |
| REPEATED_EXECUTION_FAILURE (3+ blocked) | Structural resistance pattern | ESCALATE_TO_RETAINER_REVIEW |
| AMBIGUOUS_EVIDENCE (single_source) | Advisory only — continue automated | WARN_AND_CONTINUE |

## What must never be sold as generic consulting

- "Book a consultation"
- "Speak to an adviser"
- "Upgrade to consulting"
- "Schedule a strategy call"
- Any language that positions human involvement as the primary value proposition
- Any CTA that frames counsel as a product to purchase rather than an escalation to earn

## Preferred language

| Context | Language |
|---------|---------|
| Counsel not needed | "Automated governance active" |
| Counsel recommended | "Counsel review recommended — advisory" |
| Counsel required | "Counsel review required — execution paused" |
| Retainer escalation | "This case exceeds automated governance threshold. Retainer-level oversight recommended." |
| Explaining the model | "Human counsel enters only when the case exceeds the automated governance boundary." |

---

## Revenue model

```
1. Strategy Room Entry (£750 / £1,250)
   → Mostly automated, scalable, governed intervention.

2. Counsel Review (triggered by governance threshold)
   → Human involvement when the case demands it.
   → Priced by governance state, not by the hour.

3. Retainer Oversight (£25,000+/year contracted)
   → Continuous governance for serious clients.
   → Where enterprise value compounds.
```

Counsel is scarce because it is triggered, not sold. That scarcity is the premium.
