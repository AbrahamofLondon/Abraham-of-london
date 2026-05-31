# HMRC/Company Accounts Filing Rescue with No Funds

**Scenario:** `hmrc_filing_rescue`
**Kernel Status:** COMPLETED
**Automatic Failures:** None

---

## 1. Raw User Situation

```
We have a company accounts filing due at Companies House in 14 days. The accountant has resigned. The director is unwell. There are no funds to pay for an emergency filing. The company is solvent but cash-poor. If we miss the filing, the company will be struck off. The director's other directorates may also be affected.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is a statutory or regulatory filing situation. Financial constraint present. A deadline is referenced.

## 4. Kernel Interpretation

The system interprets this situation as a compliance or filing obligation with a defined deadline and consequence for missing it. The primary institutional question is not whether to comply — the obligation is legal. The question is what is the minimum viable rescue path given the resource constraint.

## 5. Translation Confidence

**HIGH**

## 6. Primary Decision Class

**COMPLIANCE_AND_FILING**

## 7. Alternative Decision Classes

- **GOVERNANCE_AND_BOARD** (LOW): Authority ambiguity suggests governance dimension
- **OPERATIONAL_AND_EXECUTION** (LOW): Timing pressure suggests operational execution dimension

## 8. Surfaced Dimensions

- financial
- timing
- obligation

## 9. Preserved Ambiguities

- authority_structure
- timing_pressure

## 10. Clarification Questions

*None required*

## 11. Actor Map

| Actor | Role | Confidence |
|-------|------|------------|
| board | board | HIGH |
| companies house | regulator | HIGH |
| accountant | advisor | HIGH |

## 12. Authority State

*No authority mapped*

## 13. Obligation State

| Description | Type | Deadline | Consequence |
|-------------|------|----------|-------------|
| Statutory filing obligation | statutory | 14 days | Company struck off, director disqualification |

## 14. Constraint Graph

| Description | Type | Severity | Binding |
|-------------|------|----------|---------|
| Insufficient funds to execute the required action | cash | CRITICAL | Yes |
| Cash position constrains available options | cash | HIGH | No |
| 14-day deadline imposes severe time constraint | time | CRITICAL | Yes |

## 15. Evidence State

| Label | Severity | Confidence | Source |
|-------|----------|------------|--------|
| Failure Mode: Cash constraint — insufficient resources to execute | CRITICAL | 0.7 | failure-mode |
| Failure Mode: Liquidity concern — cash position may constrain options | HIGH | 0.7 | failure-mode |
| Failure Mode: Key person dependency — critical role is vacant or departing | HIGH | 0.7 | failure-mode |
| Failure Mode: Key person dependency — decision-maker capacity is compromised | HIGH | 0.7 | failure-mode |
| Failure Mode: Existential threat — entity dissolution risk | CRITICAL | 0.7 | failure-mode |
| Constraint: Insufficient funds to execute the required action | CRITICAL | 0.8 | constraint-reality |
| Constraint: Cash position constrains available options | HIGH | 0.8 | constraint-reality |
| Constraint: 14-day deadline imposes severe time constraint | CRITICAL | 0.8 | constraint-reality |
| Obligation: Statutory filing obligation | HIGH | 0.7 | obligation |
| Evidence Gap: Low documentation | HIGH | 0.8 | evidence |
| Contradiction: Obligation to meet deadline exists but resources to meet it  | CRITICAL | 0.8 | adversarial |
| Contradiction: Existential threat detected but resources to address it are  | CRITICAL | 0.8 | adversarial |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Obligation to meet deadline exists but resources to meet it do not | CRITICAL | ADVERSARIAL_CHALLENGE_PRESERVED |
| Existential threat detected but resources to address it are constrained | CRITICAL | ADVERSARIAL_CHALLENGE_PRESERVED |

## 17. Self-Adversarial Challenge

**Load-bearing assumptions:**
- Insufficient funds to execute the required action (if wrong: The minimum viable path may change.)
- Cash position constrains available options (if wrong: The minimum viable path may change.)

**Information gaps:**
- Authority structure is unclear: Cannot determine who holds decision mandate

**Kernel limitations:**
- This analysis is based on the information provided and available evidence.
- The system cannot verify independently reported facts.
- Human review is recommended for high-consequence decisions.
- This does not constitute legal, tax, or regulated professional advice.

## 18. Regulated Boundary State

**Hit:** true
**Type:** audit-opinion
**Professional brief:** Generated

## 19. Minimum Viable Path

| # | Action | Urgency |
|---|--------|---------|
| 1 | Address: Statutory filing obligation (deadline: 14 days). Separate what is required from Companies House, HMRC, and any other authority — these are distinct obligations with distinct deadlines. | IMMEDIATE |
| 2 | Contact HMRC Business Payment Support (0300 200 3835) and explore fixed-scope accountant review. Free options: ICAEW Find a Firm, Citizens Advice Business, Business Debtline. A targeted review costs less than a penalty. | IMMEDIATE |

## 20. Forbidden Actions

- **Proceed as if the filing obligation will resolve itself, or that delay is neutral** (CRITICAL): Statutory obligations compound with delay. Inaction is not a safe default — it is the highest-risk option.
- **Ignore the filing deadline or treat a placeholder submission as a completed obligation** (CRITICAL): Missing the deadline triggers penalties, strike-off, or director disqualification. A provisional submission does not discharge the duty.

## 21. What Must Not Be Delayed

- Address: Statutory filing obligation (deadline: 14 days). Separate what is required from Companies House, HMRC, and any other authority — these are distinct obligations with distinct deadlines.
- Contact HMRC Business Payment Support (0300 200 3835) and explore fixed-scope accountant review. Free options: ICAEW Find a Firm, Citizens Advice Business, Business Debtline. A targeted review costs less than a penalty.

## 22. Free Signal Output

### Situation Class

COMPLIANCE_AND_FILING

### What the System Saw

The system interprets this situation as a compliance or filing obligation with a defined deadline and consequence for missing it. The primary institutional question is not whether to comply — the obligation is legal. The question is what is the minimum viable rescue path given the resource constraint.

### Primary Failure Point

Cash constraint — insufficient resources to execute

### Governing Tension

The system interprets this situation as a compliance or filing obligation with a defined deadline and consequence for missing it

### Consequence Class

CRITICAL

### What the Full Analysis Maps

```json
[
  "Obligation landscape",
  "Constraint graph",
  "Evidence graph",
  "Adversarial challenge"
]
```

### Direction of Minimum Viable Move

Address: Statutory filing obligation (deadline: 14 days). Separate what is required from Companies House, HMRC, and any other authority — these are distinct obligations with distinct deadlines.

## 23. Basic Brief Output

*Not generated (requires separate run)*

## 24. Full Dossier Output

### Authority Map

```json
[]
```

### Obligation Map

```json
[
  {
    "description": "Statutory filing obligation",
    "type": "statutory",
    "deadline": "14 days",
    "consequence": "Company struck off, director disqualification",
    "evidenceBasis": "User-reported",
    "confidence": "MEDIUM"
  }
]
```

### Constraint Graph

```json
[
  {
    "type": "cash",
    "description": "Insufficient funds to execute the required action",
    "severity": "CRITICAL",
    "isBinding": true
  },
  {
    "type": "cash",
    "description": "Cash position constrains available options",
    "severity": "HIGH",
    "isBinding": false
  },
  {
    "type": "time",
    "description": "14-day deadline imposes severe time constraint",
    "severity": "CRITICAL",
    "isBinding": true
  }
]
```

### Evidence Graph

```json
[
  {
    "kind": "failure_mode",
    "label": "Failure Mode: Cash constraint — insufficient resources to execute",
    "summary": "Cash constraint — insufficient resources to execute",
    "severity": "CRITICAL",
    "confidence": 0.7,
    "sourceStage": "kernel",
    "sourceLens": "failure-mode"
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
    "kind": "failure_mode",
    "label": "Failure Mode: Key person dependency — critical role is vacant or departing",
    "summary": "Key person dependency — critical role is vacant or departing",
    "severity": "HIGH",
    "confidence": 0.7,
    "sourceStage": "kernel",
    "sourceLens": "failure-mode"
  },
  {
    "kind": "failure_mode",
    "label": "Failure Mode: Key person dependency — decision-maker capacity is compromised",
    "summary": "Key person dependency — decision-maker capacity is compromised",
    "severity": "HIGH",
    "confidence": 0.7,
    "sourceStage": "kernel",
    "sourceLens": "failure-mode"
  },
  {
    "kind": "failure_mode",
    "label": "Failure Mode: Existential threat — entity dissolution risk",
    "summary": "Existential threat — entity dissolution risk",
    "severity": "CRITICAL",
    "confidence": 0.7,
    "sourceStage": "kernel",
    "sourceLens": "failure-mode"
  },
  {
    "kind": "constraint",
    "label": "Constraint: Insufficient funds to execute the required action",
    "summary": "Insufficient funds to execute the required action",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  },
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
    "kind": "constraint",
    "label": "Constraint: 14-day deadline imposes severe time constraint",
    "summary": "14-day deadline imposes severe time constraint",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  },
  {
    "kind": "obligation",
    "label": "Obligation: Statutory filing obligation",
    "summary": "Statutory filing obligation",
    "severity": "HIGH",
    "confidence": 0.7,
    "sourceStage": "kernel",
    "sourceLens": "obligation"
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
    "label": "Contradiction: Obligation to meet deadline exists but resources to meet it ",
    "summary": "Obligation to meet deadline exists but resources to meet it do not",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "adversarial"
  },
  {
    "kind": "contradiction",
    "label": "Contradiction: Existential threat detected but resources to address it are ",
    "summary": "Existential threat detected but resources to address it are constrained",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "adversarial"
  }
]
```

### Adversarial Challenge

```json
[
  {
    "id": "obligation-vs-resources",
    "between": [
      "obligation-lens",
      "constraint-reality-lens"
    ],
    "contradiction": "Obligation to meet deadline exists but resources to meet it do not",
    "severity": "CRITICAL",
    "resolutionRule": "ADVERSARIAL_CHALLENGE_PRESERVED",
    "outputEffect": "Output blocked until contradiction is resolved by human review."
  },
  {
    "id": "existential-threat-vs-resources",
    "between": [
      "failure-mode-lens",
      "constraint-reality-lens"
    ],
    "contradiction": "Existential threat detected but resources to address it are constrained",
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
      "assumption": "Insufficient funds to execute the required action",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    },
    {
      "assumption": "Cash position constrains available options",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    }
  ],
  "classificationConfidence": {
    "primaryClass": "COMPLIANCE_AND_FILING",
    "confidence": "HIGH",
    "alternativeClass": "GOVERNANCE_AND_BOARD",
    "implication": "If classification is wrong, the entire lens selection and output structure changes."
  },
  "informationGaps": [
    {
      "gap": "Authority structure is unclear",
      "impact": "Cannot determine who holds decision mandate",
      "acquisitionPath": "Ask: Who has the formal authority to make this decision?"
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
    "action": "IDENTIFY_SPECIFIC_FILING_REQUIRED",
    "description": "Address: Statutory filing obligation (deadline: 14 days). Separate what is required from Companies House, HMRC, and any other authority — these are distinct obligations with distinct deadlines.",
    "rationale": "Treating multiple obligations as one increases error risk. Separate and sequence them.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 2,
    "action": "IDENTIFY_LOW_COST_PROFESSIONAL_PATH",
    "description": "Contact HMRC Business Payment Support (0300 200 3835) and explore fixed-scope accountant review. Free options: ICAEW Find a Firm, Citizens Advice Business, Business Debtline. A targeted review costs less than a penalty.",
    "rationale": "Cash constraint does not remove the legal obligation. Fixed-scope professional review is typically far cheaper than the cost of error or penalty.",
    "urgency": "IMMEDIATE"
  }
]
```

### Forbidden Actions

```json
[
  {
    "action": "Proceed as if the filing obligation will resolve itself, or that delay is neutral",
    "reason": "Statutory obligations compound with delay. Inaction is not a safe default — it is the highest-risk option.",
    "severity": "CRITICAL"
  },
  {
    "action": "Ignore the filing deadline or treat a placeholder submission as a completed obligation",
    "reason": "Missing the deadline triggers penalties, strike-off, or director disqualification. A provisional submission does not discharge the duty.",
    "severity": "CRITICAL"
  }
]
```

### Fallback Path

```json
[
  {
    "order": 2,
    "action": "IDENTIFY_LOW_COST_PROFESSIONAL_PATH",
    "description": "Contact HMRC Business Payment Support (0300 200 3835) and explore fixed-scope accountant review. Free options: ICAEW Find a Firm, Citizens Advice Business, Business Debtline. A targeted review costs less than a penalty.",
    "rationale": "Cash constraint does not remove the legal obligation. Fixed-scope professional review is typically far cheaper than the cost of error or penalty.",
    "urgency": "IMMEDIATE"
  }
]
```

### What Must Not Be Delayed

```json
[
  "Address: Statutory filing obligation (deadline: 14 days). Separate what is required from Companies House, HMRC, and any other authority — these are distinct obligations with distinct deadlines.",
  "Contact HMRC Business Payment Support (0300 200 3835) and explore fixed-scope accountant review. Free options: ICAEW Find a Firm, Citizens Advice Business, Business Debtline. A targeted review costs less than a penalty."
]
```

### Record Reference

```json
{
  "caseReference": "PROOF-HMRC_FILING_RESCUE-DOSSIER",
  "kernelVersion": "1.0.0",
  "ontologyVersion": "1.0.0",
  "generatedAt": "2026-05-31T16:10:45.701Z"
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
    "suggestedProfession": "a qualified auditor",
    "whatToBring": [
      "This Living Decision Case reference and output",
      "Relevant contracts, filings, or regulatory correspondence",
      "Evidence of constraints (financial statements, timelines, capacity data)",
      "Any documentation referenced in the evidence graph"
    ],
    "questionsToAsk": [
      "What are the key legal, regulatory, or professional obligations in this situation?"
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
**Triggers:** 2

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
