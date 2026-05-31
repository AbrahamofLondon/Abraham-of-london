# Cash-Constrained Survival

**Scenario:** `cash_constrained_survival`
**Kernel Status:** COMPLETED
**Automatic Failures:** None

---

## 1. Raw User Situation

```
We have 6 weeks of cash runway. We have cut all non-essential costs. We are in late-stage discussions with two investors but neither has committed. A major customer has delayed payment by 60 days. The CEO is considering using personal credit cards to meet payroll. The company has no debt facility.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is a financial or capital commitment decision. Financial constraint present.

## 4. Kernel Interpretation

The system interprets this situation as a financial or capital decision where cash, funding, or balance sheet capacity constrains the feasible set. Dimensions surfaced: constraint.

## 5. Translation Confidence

**HIGH**

## 6. Primary Decision Class

**FINANCIAL_AND_CAPITAL**

## 7. Alternative Decision Classes

- **GOVERNANCE_AND_BOARD** (LOW): Authority ambiguity suggests governance dimension
- **OPERATIONAL_AND_EXECUTION** (LOW): Timing pressure suggests operational execution dimension

## 8. Surfaced Dimensions

- financial

## 9. Preserved Ambiguities

- authority_structure
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
| Cash position constrains available options | cash | HIGH | No |

## 15. Evidence State

| Label | Severity | Confidence | Source |
|-------|----------|------------|--------|
| Constraint: Cash position constrains available options | HIGH | 0.8 | constraint-reality |
| Failure Mode: Liquidity concern — cash position may constrain options | HIGH | 0.7 | failure-mode |
| Evidence Gap: Low documentation | HIGH | 0.8 | evidence |
| Contradiction: Cash runway is critically short but required funding has not | CRITICAL | 0.8 | adversarial |
| Due diligence risk: Customer or user base | HIGH | 0.8 | investor-diligence |
| Boundary: Financial promotion regulation may apply | MEDIUM | 0.8 | investor-diligence |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Cash runway is critically short but required funding has not been secured or is delayed | CRITICAL | ADVERSARIAL_CHALLENGE_PRESERVED |
| 1 claim(s) in the investor narrative would not survive due diligence: Customer or user base (customer) | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |

## 17. Self-Adversarial Challenge

**Load-bearing assumptions:**
- Cash position constrains available options (if wrong: The minimum viable path may change.)

**Information gaps:**
- Authority structure is unclear: Cannot determine who holds decision mandate
- Obligation structure is unclear: Cannot determine what must be performed

**Kernel limitations:**
- This analysis is based on the information provided and available evidence.
- The system cannot verify independently reported facts.
- Human review is recommended for high-consequence decisions.
- This does not constitute legal, tax, or regulated professional advice.

## 18. Regulated Boundary State

**Hit:** true
**Type:** investment-advice
**Professional brief:** Generated

## 19. Minimum Viable Path

| # | Action | Urgency |
|---|--------|---------|
| 1 | Address the primary identified risk: Cash runway is critically short but required funding has not been secured or is delayed. This is the failure point most likely to undermine the decision. | IMMEDIATE |
| 2 | Identify and confirm who holds formal decision mandate. | IMMEDIATE |
| 3 | Verify: Cash position constrains available options | IMMEDIATE |

## 20. Forbidden Actions

- **Make commitments — payroll guarantees, supplier agreements, or operational promises — that assume funding or payment that has not been confirmed in writing** (HIGH): Unconfirmed funding is not a resource. Commitments made against it create personal and institutional liability if funding does not arrive.
- **Make growth or traction claims to investors without disclosing they are based on internal projections rather than verified data** (CRITICAL): Misrepresentation to investors carries both legal and regulatory risk. Projections presented as results is a known grounds for claim.

## 21. What Must Not Be Delayed

- Address the primary identified risk: Cash runway is critically short but required funding has not been secured or is delayed. This is the failure point most likely to undermine the decision.
- Identify and confirm who holds formal decision mandate.
- Verify: Cash position constrains available options

## 22. Free Signal Output

### Situation Class

FINANCIAL_AND_CAPITAL

### What the System Saw

The system interprets this situation as a financial or capital decision where cash, funding, or balance sheet capacity constrains the feasible set. Dimensions surfaced: constraint.

### Primary Failure Point

Cash position constrains available options

### Governing Tension

The system interprets this situation as a financial or capital decision where cash, funding, or balance sheet capacity constrains the feasible set

### Consequence Class

CRITICAL

### What the Full Analysis Maps

```json
[
  "Constraint graph",
  "Evidence graph",
  "Adversarial challenge"
]
```

### Direction of Minimum Viable Move

Address the primary identified risk: Cash runway is critically short but required funding has not been secured or is delayed. This is the failure point most likely to undermine the decision.

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
    "type": "cash",
    "description": "Cash position constrains available options",
    "severity": "HIGH",
    "isBinding": false
  }
]
```

### Evidence Graph

```json
[
  {
    "kind": "constraint",
    "label": "Constraint: Cash position constrains available options",
    "summary": "Cash position constrains available options",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  },
  {
    "kind": "failure_mode",
    "label": "Failure Mode: Liquidity concern — cash position may constrain options",
    "summary": "Liquidity concern — cash position may constrain options",
    "severity": "HIGH",
    "confidence": 0.7,
    "sourceStage": "kernel",
    "sourceLens": "failure-mode"
  },
  {
    "kind": "evidence_gap",
    "label": "Evidence Gap: Low documentation",
    "summary": "Situation relies primarily on user-reported information without independent documentation",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "evidence"
  },
  {
    "kind": "contradiction",
    "label": "Contradiction: Cash runway is critically short but required funding has not",
    "summary": "Cash runway is critically short but required funding has not been secured or is delayed",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "adversarial"
  },
  {
    "kind": "diligence_risk",
    "label": "Due diligence risk: Customer or user base",
    "summary": "Customer or user base would be challenged in due diligence. Customer count cited: 6",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "investor-diligence"
  },
  {
    "kind": "financial_promotion_boundary",
    "label": "Boundary: Financial promotion regulation may apply",
    "summary": "If this pitch is being made to UK investors, financial promotion regulations may apply. Claims about growth, revenue, or market position must be clear, fair, and not misleading. The system cannot provide regulated financial promotion advice.",
    "severity": "MEDIUM",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "investor-diligence"
  }
]
```

### Adversarial Challenge

```json
[
  {
    "id": "runway-vs-funding-delay",
    "between": [
      "constraint-reality-lens",
      "obligation-lens"
    ],
    "contradiction": "Cash runway is critically short but required funding has not been secured or is delayed",
    "severity": "CRITICAL",
    "resolutionRule": "ADVERSARIAL_CHALLENGE_PRESERVED",
    "outputEffect": "Output blocked until contradiction is resolved by human review."
  },
  {
    "id": "investor-claim-vs-evidence",
    "between": [
      "investor-diligence-lens",
      "evidence-lens"
    ],
    "contradiction": "1 claim(s) in the investor narrative would not survive due diligence: Customer or user base (customer)",
    "severity": "HIGH",
    "resolutionRule": "ADVERSARIAL_CHALLENGE_PRESERVED",
    "outputEffect": "Output confidence downgraded. Human review recommended."
  }
]
```

### Self-Adversarial Challenge

```json
{
  "loadBearingAssumptions": [
    {
      "assumption": "Cash position constrains available options",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    }
  ],
  "classificationConfidence": {
    "primaryClass": "FINANCIAL_AND_CAPITAL",
    "confidence": "HIGH",
    "alternativeClass": "GOVERNANCE_AND_BOARD",
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
    "description": "Address the primary identified risk: Cash runway is critically short but required funding has not been secured or is delayed. This is the failure point most likely to undermine the decision.",
    "rationale": "The adversarial challenge (runway-vs-funding-delay) must be resolved or consciously accepted before the decision proceeds.",
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
    "description": "Verify: Cash position constrains available options",
    "rationale": "Critical constraints change what is feasible.",
    "urgency": "IMMEDIATE"
  }
]
```

### Forbidden Actions

```json
[
  {
    "action": "Make commitments — payroll guarantees, supplier agreements, or operational promises — that assume funding or payment that has not been confirmed in writing",
    "reason": "Unconfirmed funding is not a resource. Commitments made against it create personal and institutional liability if funding does not arrive.",
    "severity": "HIGH"
  },
  {
    "action": "Make growth or traction claims to investors without disclosing they are based on internal projections rather than verified data",
    "reason": "Misrepresentation to investors carries both legal and regulatory risk. Projections presented as results is a known grounds for claim.",
    "severity": "CRITICAL"
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
    "description": "Verify: Cash position constrains available options",
    "rationale": "Critical constraints change what is feasible.",
    "urgency": "IMMEDIATE"
  }
]
```

### What Must Not Be Delayed

```json
[
  "Address the primary identified risk: Cash runway is critically short but required funding has not been secured or is delayed. This is the failure point most likely to undermine the decision.",
  "Identify and confirm who holds formal decision mandate.",
  "Verify: Cash position constrains available options"
]
```

### Record Reference

```json
{
  "caseReference": "PROOF-CASH_CONSTRAINED_SURVIVAL-DOSSIER",
  "kernelVersion": "1.0.0",
  "ontologyVersion": "1.0.0",
  "generatedAt": "2026-05-31T16:10:46.044Z"
}
```

### Regulated Boundary

```json
{
  "regulatedBoundaryIdentified": true,
  "whatThisMeans": "The system has identified that this situation touches on regulated professional advice boundaries. The system cannot provide regulated professional advice, but it can help you prepare to engage the right professional.",
  "whatWeCanStillMap": [
    "Authority structure and decision mandate",
    "Obligation landscape and constraints",
    "Evidence quality and gaps",
    "Consequence exposure and timing",
    "Adversarial challenge and minimum viable path"
  ],
  "professionalBrief": {
    "purpose": "This brief is designed to help you approach a regulated professional with structure.",
    "suggestedProfession": "a regulated financial adviser",
    "whatToBring": [
      "This Living Decision Case reference and output",
      "Evidence of constraints (financial statements, timelines, capacity data)",
      "Any documentation referenced in the evidence graph"
    ],
    "questionsToAsk": [
      "What are the regulatory requirements for any financial promotion or investment solicitation?"
    ]
  },
  "whatToDoNext": [
    "Review the mapped elements above.",
    "Prepare the documentation listed in the professional brief.",
    "Engage a qualified professional for the regulated element.",
    "Return to the system with the professional's input to update the case."
  ]
}
```

## 25. Human Review Trigger

**State:** pending
**Tier:** STANDARD
**Triggers:** 3

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

- ✓ None

## Notes

Auto-generated. Rubric requires human review.
