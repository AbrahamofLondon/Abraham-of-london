# Procurement Supplier Risk

**Scenario:** `procurement_supplier_risk`
**Kernel Status:** COMPLETED
**Automatic Failures:** Generic paid output detected

---

## 1. Raw User Situation

```
Our sole supplier for a critical component has issued a force majeure notice. They cannot guarantee delivery for 12 weeks. We have 4 weeks of inventory. Our customers have firm orders. Switching supplier requires 8 weeks of qualification. The CFO says we cannot absorb the penalty for late delivery.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is a technology or dependency situation.

## 4. Kernel Interpretation

The system interprets this situation as a technology or dependency decision where system reliability, migration, or technical debt is the binding constraint. Dimensions surfaced: consequence.

## 5. Translation Confidence

**HIGH**

## 6. Primary Decision Class

**TECHNOLOGY_AND_DEPENDENCY**

## 7. Alternative Decision Classes

- **GOVERNANCE_AND_BOARD** (LOW): Authority ambiguity suggests governance dimension
- **OPERATIONAL_AND_EXECUTION** (LOW): Timing pressure suggests operational execution dimension

## 8. Surfaced Dimensions

- consequence

## 9. Preserved Ambiguities

- authority_structure
- timing_pressure

## 10. Clarification Questions

*None required*

## 11. Actor Map

| Actor | Role | Confidence |
|-------|------|------------|
| cfo | executive | HIGH |

## 12. Authority State

*No authority mapped*

## 13. Obligation State

*No obligations mapped*

## 14. Constraint Graph

| Description | Type | Severity | Binding |
|-------------|------|----------|---------|
| Sole supplier dependency — no alternative source for critical component or service | dependency | CRITICAL | Yes |
| Supplier has issued force majeure or cannot guarantee delivery — supply is interrupted | delivery | CRITICAL | Yes |
| Switching to alternative supplier requires significant lead time | time | HIGH | Yes |

## 15. Evidence State

| Label | Severity | Confidence | Source |
|-------|----------|------------|--------|
| Evidence Gap: Low documentation | HIGH | 0.8 | evidence |
| Constraint: Sole supplier dependency | CRITICAL | 0.9 | supplier-dependency |
| Constraint: Supply interruption | CRITICAL | 0.9 | supplier-dependency |
| Constraint: Switching lead time | HIGH | 0.8 | supplier-dependency |
| Forbidden: Assume supply will resume without confirmed commitment | CRITICAL | 0.9 | supplier-dependency |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Supply interruption creates inability to meet customer obligations, with penalty exposure | CRITICAL | ADVERSARIAL_CHALLENGE_PRESERVED |

## 17. Self-Adversarial Challenge

**Load-bearing assumptions:**
- Sole supplier dependency — no alternative source for critical component or service (if wrong: The minimum viable path may change.)
- Supplier has issued force majeure or cannot guarantee delivery — supply is interrupted (if wrong: The minimum viable path may change.)

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
| 1 | Address the primary identified risk: Supply interruption creates inability to meet customer obligations, with penalty exposure. This is the failure point most likely to undermine the decision. | IMMEDIATE |
| 2 | Identify and confirm who holds formal decision mandate. | IMMEDIATE |
| 3 | Verify: Sole supplier dependency — no alternative source for critical component or service | IMMEDIATE |

## 20. Forbidden Actions

- **Assume customer obligations can be met without a confirmed supply recovery timeline or alternative sourcing plan** (CRITICAL): Supply interruption combined with customer penalty exposure creates compound risk. A confirmed recovery plan must be in place before customer commitments are reaffirmed.
- **Do not assume the supplier will resume delivery without a confirmed written commitment and recovery timeline.** (CRITICAL): Forbidden: Assume supply will resume without confirmed commitment

## 21. What Must Not Be Delayed

- Address the primary identified risk: Supply interruption creates inability to meet customer obligations, with penalty exposure. This is the failure point most likely to undermine the decision.
- Identify and confirm who holds formal decision mandate.
- Verify: Sole supplier dependency — no alternative source for critical component or service

## 22. Free Signal Output

### Situation Class

TECHNOLOGY_AND_DEPENDENCY

### What the System Saw

The system interprets this situation as a technology or dependency decision where system reliability, migration, or technical debt is the binding constraint. Dimensions surfaced: consequence.

### Primary Failure Point

Situation relies primarily on user-reported information without independent documentation

### Governing Tension

The system interprets this situation as a technology or dependency decision where system reliability, migration, or technical debt is the binding constraint

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

Address the primary identified risk: Supply interruption creates inability to meet customer obligations, with penalty exposure. This is the failure point most likely to undermine the decision.

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
    "type": "dependency",
    "description": "Sole supplier dependency — no alternative source for critical component or service",
    "severity": "CRITICAL",
    "isBinding": true
  },
  {
    "type": "delivery",
    "description": "Supplier has issued force majeure or cannot guarantee delivery — supply is interrupted",
    "severity": "CRITICAL",
    "isBinding": true
  },
  {
    "type": "time",
    "description": "Switching to alternative supplier requires significant lead time",
    "severity": "HIGH",
    "isBinding": true
  }
]
```

### Evidence Graph

```json
[
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
    "kind": "dependency_constraint",
    "label": "Constraint: Sole supplier dependency",
    "summary": "The organisation depends on a single supplier with no qualified alternative. This creates critical vulnerability.",
    "severity": "CRITICAL",
    "confidence": 0.9,
    "sourceStage": "kernel",
    "sourceLens": "supplier-dependency"
  },
  {
    "kind": "supply_interruption",
    "label": "Constraint: Supply interruption",
    "summary": "Supplier cannot guarantee delivery. Supply is interrupted with no confirmed resolution timeline.",
    "severity": "CRITICAL",
    "confidence": 0.9,
    "sourceStage": "kernel",
    "sourceLens": "supplier-dependency"
  },
  {
    "kind": "switching_constraint",
    "label": "Constraint: Switching lead time",
    "summary": "Qualifying and switching to an alternative supplier requires significant time that may exceed available inventory.",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "supplier-dependency"
  },
  {
    "kind": "forbidden_action",
    "label": "Forbidden: Assume supply will resume without confirmed commitment",
    "summary": "Do not assume the supplier will resume delivery without a confirmed written commitment and recovery timeline.",
    "severity": "CRITICAL",
    "confidence": 0.9,
    "sourceStage": "kernel",
    "sourceLens": "supplier-dependency"
  }
]
```

### Adversarial Challenge

```json
[
  {
    "id": "supply-failure-vs-customer-obligation",
    "between": [
      "supplier-dependency-lens",
      "obligation-lens"
    ],
    "contradiction": "Supply interruption creates inability to meet customer obligations, with penalty exposure",
    "severity": "CRITICAL",
    "resolutionRule": "ADVERSARIAL_CHALLENGE_PRESERVED",
    "outputEffect": "Output blocked until contradiction is resolved by human review."
  }
]
```

### Self-Adversarial Challenge

```json
{
  "loadBearingAssumptions": [
    {
      "assumption": "Sole supplier dependency — no alternative source for critical component or service",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    },
    {
      "assumption": "Supplier has issued force majeure or cannot guarantee delivery — supply is interrupted",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    }
  ],
  "classificationConfidence": {
    "primaryClass": "TECHNOLOGY_AND_DEPENDENCY",
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
    "description": "Address the primary identified risk: Supply interruption creates inability to meet customer obligations, with penalty exposure. This is the failure point most likely to undermine the decision.",
    "rationale": "The adversarial challenge (supply-failure-vs-customer-obligation) must be resolved or consciously accepted before the decision proceeds.",
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
    "description": "Verify: Sole supplier dependency — no alternative source for critical component or service",
    "rationale": "Critical constraints change what is feasible.",
    "urgency": "IMMEDIATE"
  }
]
```

### Forbidden Actions

```json
[
  {
    "action": "Assume customer obligations can be met without a confirmed supply recovery timeline or alternative sourcing plan",
    "reason": "Supply interruption combined with customer penalty exposure creates compound risk. A confirmed recovery plan must be in place before customer commitments are reaffirmed.",
    "severity": "CRITICAL"
  },
  {
    "action": "Do not assume the supplier will resume delivery without a confirmed written commitment and recovery timeline.",
    "reason": "Forbidden: Assume supply will resume without confirmed commitment",
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
    "description": "Verify: Sole supplier dependency — no alternative source for critical component or service",
    "rationale": "Critical constraints change what is feasible.",
    "urgency": "IMMEDIATE"
  }
]
```

### What Must Not Be Delayed

```json
[
  "Address the primary identified risk: Supply interruption creates inability to meet customer obligations, with penalty exposure. This is the failure point most likely to undermine the decision.",
  "Identify and confirm who holds formal decision mandate.",
  "Verify: Sole supplier dependency — no alternative source for critical component or service"
]
```

### Record Reference

```json
{
  "caseReference": "PROOF-PROCUREMENT_SUPPLIER_RISK-DOSSIER",
  "kernelVersion": "1.0.0",
  "ontologyVersion": "1.0.0",
  "generatedAt": "2026-05-31T21:58:17.161Z"
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
