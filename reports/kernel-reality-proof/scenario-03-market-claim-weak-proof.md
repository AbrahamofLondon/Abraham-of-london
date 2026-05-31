# Market Claim with Strong Copy but Weak Proof

**Scenario:** `market_claim_strong_copy_weak_proof`
**Kernel Status:** COMPLETED
**Automatic Failures:** Generic paid output detected

---

## 1. Raw User Situation

```
We are launching a new product and the marketing team has prepared claims about market leadership and customer adoption. The actual customer data shows only 12 beta users, none of whom have completed the onboarding. The CEO wants to launch with the strong claims anyway. The product is not generating revenue yet.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is an operational or release decision.

## 4. Kernel Interpretation

The system interprets this situation as an operational or execution decision where delivery, capacity, or process reliability is the primary concern. Dimensions surfaced: evidence.

## 5. Translation Confidence

**HIGH**

## 6. Primary Decision Class

**OPERATIONAL_AND_EXECUTION**

## 7. Alternative Decision Classes

- **COMMERCIAL_AND_MARKET** (LOW): Score 4 vs primary 10

## 8. Surfaced Dimensions

- evidence

## 9. Preserved Ambiguities

- authority_structure
- constraint_landscape
- timing_pressure

## 10. Clarification Questions

*None required*

## 11. Actor Map

| Actor | Role | Confidence |
|-------|------|------------|
| ceo | executive | HIGH |

## 12. Authority State

*No authority mapped*

## 13. Obligation State

*No obligations mapped*

## 14. Constraint Graph

| Description | Type | Severity | Binding |
|-------------|------|----------|---------|
| Board approval required — decision cannot proceed without it | authority | HIGH | No |

## 15. Evidence State

| Label | Severity | Confidence | Source |
|-------|----------|------------|--------|
| Failure Mode: Governance pressure — board-level decision with fiduciary implications | HIGH | 0.7 | failure-mode |
| Constraint: Board approval required — decision cannot proceed without it | HIGH | 0.8 | constraint-reality |
| Evidence Warning: Unsupported claims | MEDIUM | 0.6 | evidence |
| Contradiction: Claim is being made but evidence to support it is absent or  | HIGH | 0.8 | adversarial |
| Condition: Rollback plan required | HIGH | 0.8 | launch-readiness |
| Condition: Launch approval required | MEDIUM | 0.7 | launch-readiness |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Claim is being made but evidence to support it is absent or weak | HIGH | EVIDENCE_OVERRIDES_INFERENCE |

## 17. Self-Adversarial Challenge

**Load-bearing assumptions:**
- Board approval required — decision cannot proceed without it (if wrong: The minimum viable path may change.)

**Information gaps:**
- Authority structure is unclear: Cannot determine who holds decision mandate
- Obligation structure is unclear: Cannot determine what must be performed

**Kernel limitations:**
- This analysis is based on the information provided and available evidence.
- The system cannot verify independently reported facts.
- Human review is recommended for high-consequence decisions.
- This does not constitute legal, tax, or regulated professional advice.

## 18. Regulated Boundary State

**Hit:** false
**Type:** N/A
**Professional brief:** Not generated

## 19. Minimum Viable Path

| # | Action | Urgency |
|---|--------|---------|
| 1 | Address the primary identified risk: Claim is being made but evidence to support it is absent or weak. This is the failure point most likely to undermine the decision. | IMMEDIATE |
| 2 | Identify and confirm who holds formal decision mandate. | IMMEDIATE |
| 3 | Verify: Board approval required — decision cannot proceed without it | IMMEDIATE |

## 20. Forbidden Actions

- **Publish or present claims about market position, growth, or customer adoption without documented supporting evidence** (HIGH): Claims made without supporting evidence create legal, regulatory, and reputational exposure. A claim that cannot be substantiated is a liability.

## 21. What Must Not Be Delayed

- Address the primary identified risk: Claim is being made but evidence to support it is absent or weak. This is the failure point most likely to undermine the decision.
- Identify and confirm who holds formal decision mandate.
- Verify: Board approval required — decision cannot proceed without it

## 22. Free Signal Output

### Situation Class

OPERATIONAL_AND_EXECUTION

### What the System Saw

The system interprets this situation as an operational or execution decision where delivery, capacity, or process reliability is the primary concern. Dimensions surfaced: evidence.

### Primary Failure Point

Governance pressure — board-level decision with fiduciary implications

### Governing Tension

The system interprets this situation as an operational or execution decision where delivery, capacity, or process reliability is the primary concern

### Consequence Class

HIGH

### What the Full Analysis Maps

```json
[
  "Constraint graph",
  "Evidence graph",
  "Adversarial challenge"
]
```

### Direction of Minimum Viable Move

Address the primary identified risk: Claim is being made but evidence to support it is absent or weak. This is the failure point most likely to undermine the decision.

## 23. Basic Brief Output

*Not generated (requires separate run)*

## 24. Full Dossier Output

### Authority Map

```json
[]
```

### Obligation Map

```json
[]
```

### Constraint Graph

```json
[
  {
    "type": "authority",
    "description": "Board approval required — decision cannot proceed without it",
    "severity": "HIGH",
    "isBinding": false
  }
]
```

### Evidence Graph

```json
[
  {
    "kind": "failure_mode",
    "label": "Failure Mode: Governance pressure — board-level decision with fiduciary implications",
    "summary": "Governance pressure — board-level decision with fiduciary implications",
    "severity": "HIGH",
    "confidence": 0.7,
    "sourceStage": "kernel",
    "sourceLens": "failure-mode"
  },
  {
    "kind": "constraint",
    "label": "Constraint: Board approval required — decision cannot proceed without it",
    "summary": "Board approval required — decision cannot proceed without it",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  },
  {
    "kind": "evidence_warning",
    "label": "Evidence Warning: Unsupported claims",
    "summary": "Situation contains claims or allegations that may not be independently verifiable",
    "severity": "MEDIUM",
    "confidence": 0.6,
    "sourceStage": "kernel",
    "sourceLens": "evidence"
  },
  {
    "kind": "contradiction",
    "label": "Contradiction: Claim is being made but evidence to support it is absent or ",
    "summary": "Claim is being made but evidence to support it is absent or weak",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "adversarial"
  },
  {
    "kind": "readiness_condition",
    "label": "Condition: Rollback plan required",
    "summary": "No rollback or fallback plan is referenced. For any customer-facing launch, a tested rollback plan must exist before proceeding.",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "launch-readiness"
  },
  {
    "kind": "readiness_condition",
    "label": "Condition: Launch approval required",
    "summary": "No launch approval or sign-off is referenced. Launching without authorisation creates accountability exposure.",
    "severity": "MEDIUM",
    "confidence": 0.7,
    "sourceStage": "kernel",
    "sourceLens": "launch-readiness"
  }
]
```

### Adversarial Challenge

```json
[
  {
    "id": "claim-vs-evidence",
    "between": [
      "market-claim-lens",
      "evidence-lens"
    ],
    "contradiction": "Claim is being made but evidence to support it is absent or weak",
    "severity": "HIGH",
    "resolutionRule": "EVIDENCE_OVERRIDES_INFERENCE",
    "outputEffect": "Output confidence downgraded. Human review recommended."
  }
]
```

### Self-Adversarial Challenge

```json
{
  "loadBearingAssumptions": [
    {
      "assumption": "Board approval required — decision cannot proceed without it",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    }
  ],
  "classificationConfidence": {
    "primaryClass": "OPERATIONAL_AND_EXECUTION",
    "confidence": "HIGH",
    "alternativeClass": "COMMERCIAL_AND_MARKET",
    "implication": "If classification is wrong, the entire lens selection and output structure changes."
  },
  "informationGaps": [
    {
      "gap": "Authority structure is unclear",
      "impact": "Cannot determine who holds decision mandate",
      "acquisitionPath": "Ask: Who has the formal authority to make this decision?"
    },
    {
      "gap": "Obligation structure is unclear",
      "impact": "Cannot determine what must be performed",
      "acquisitionPath": "Ask: What contractual, regulatory, or fiduciary obligations apply?"
    }
  ],
  "kernelLimitations": [
    "This analysis is based on the information provided and available evidence.",
    "The system cannot verify independently reported facts.",
    "Human review is recommended for high-consequence decisions.",
    "This does not constitute legal, tax, or regulated professional advice."
  ]
}
```

### Minimum Viable Path

```json
[
  {
    "order": 1,
    "action": "RESOLVE_PRIMARY_ADVERSARIAL_RISK",
    "description": "Address the primary identified risk: Claim is being made but evidence to support it is absent or weak. This is the failure point most likely to undermine the decision.",
    "rationale": "The adversarial challenge (claim-vs-evidence) must be resolved or consciously accepted before the decision proceeds.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 2,
    "action": "CLARIFY_AUTHORITY",
    "description": "Identify and confirm who holds formal decision mandate.",
    "rationale": "Without confirmed authority, the decision is vulnerable to challenge.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 3,
    "action": "VALIDATE_CRITICAL_CONSTRAINTS",
    "description": "Verify: Board approval required — decision cannot proceed without it",
    "rationale": "Critical constraints change what is feasible.",
    "urgency": "IMMEDIATE"
  }
]
```

### Forbidden Actions

```json
[
  {
    "action": "Publish or present claims about market position, growth, or customer adoption without documented supporting evidence",
    "reason": "Claims made without supporting evidence create legal, regulatory, and reputational exposure. A claim that cannot be substantiated is a liability.",
    "severity": "HIGH"
  }
]
```

### Fallback Path

```json
[
  {
    "order": 2,
    "action": "CLARIFY_AUTHORITY",
    "description": "Identify and confirm who holds formal decision mandate.",
    "rationale": "Without confirmed authority, the decision is vulnerable to challenge.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 3,
    "action": "VALIDATE_CRITICAL_CONSTRAINTS",
    "description": "Verify: Board approval required — decision cannot proceed without it",
    "rationale": "Critical constraints change what is feasible.",
    "urgency": "IMMEDIATE"
  }
]
```

### What Must Not Be Delayed

```json
[
  "Address the primary identified risk: Claim is being made but evidence to support it is absent or weak. This is the failure point most likely to undermine the decision.",
  "Identify and confirm who holds formal decision mandate.",
  "Verify: Board approval required — decision cannot proceed without it"
]
```

### Record Reference

```json
{
  "caseReference": "PROOF-MARKET_CLAIM_STRONG_COPY_WEAK_PROOF-DOSSIER",
  "kernelVersion": "1.0.0",
  "ontologyVersion": "1.0.0",
  "generatedAt": "2026-05-31T16:10:45.857Z"
}
```

## 25. Human Review Trigger

**State:** pending
**Tier:** STANDARD
**Triggers:** 1

## 26. Quality-Standard Verdict

**Status:** COMPLETED
**Quality Failures:** 0


---

## Quality Rubric

| Criterion | Verdict |
|-----------|---------|
| Situation seen accurately | REVIEW |
| Specificity (1–5) | 3 |
| Non-generic insight (1–5) | 3 |
| Ambiguity preserved | PASS |
| False precision avoided | PASS |
| Minimum viable path useful (1–5) | 3 |
| Impossible advice avoided | N/A |
| Regulated boundary handled | N/A |
| Human review correctly triggered | N/A |
| Would buyer pay after Free Signal? | MAYBE |
| Would Full Dossier embarrass brand? | MAYBE |

## Automatic Failures

- ✗ Generic paid output detected

## Notes

Auto-generated. Rubric requires human review.
