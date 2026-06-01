# Legal/Admin/Family Deadline

**Scenario:** `legal_admin_family_deadline`
**Kernel Status:** COMPLETED
**Automatic Failures:** None

---

## 1. Raw User Situation

```
I need to respond to a letter before claim from a former business partner. The deadline is 21 days. I cannot afford a solicitor. The claim is about an oral agreement from 2019. I do not have any documentation. The other party has a solicitor. I am considering representing myself.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is a legal or contractual matter. Financial constraint present. A deadline is referenced.

## 4. Kernel Interpretation

The system interprets this situation as a legal or contractual decision where rights, obligations, or liabilities are being determined or disputed. Resource constraint meets external deadline. The system maps the minimum viable path rather than the ideal path.

## 5. Translation Confidence

**HIGH**

## 6. Primary Decision Class

**LEGAL_AND_CONTRACTUAL**

## 7. Alternative Decision Classes

- **GOVERNANCE_AND_BOARD** (LOW): Authority ambiguity suggests governance dimension
- **COMPLIANCE_AND_FILING** (LOW): Obligation ambiguity may include filing requirements

## 8. Surfaced Dimensions

- financial
- timing

## 9. Preserved Ambiguities

- authority_structure
- obligation_landscape

## 10. Clarification Questions

*None required*

## 11. Actor Map

| Actor | Role | Confidence |
|-------|------|------------|
| legal advisor | advisor | HIGH |

## 12. Authority State

| Holder | Scope | Limitation |
|--------|-------|------------|
| Solicitor / Legal Counsel | Legal advice and representation | Subject to professional regulation and client instructions |

## 13. Obligation State

| Description | Type | Deadline | Consequence |
|-------------|------|----------|-------------|
| Time-sensitive obligation with defined deadline | contractual | Unknown | Penalty or default |

## 14. Constraint Graph

| Description | Type | Severity | Binding |
|-------------|------|----------|---------|
| Fixed deadline constrains response time | time | HIGH | No |

## 15. Evidence State

| Label | Severity | Confidence | Source |
|-------|----------|------------|--------|
| Obligation: Time-sensitive obligation with defined deadline | HIGH | 0.7 | obligation |
| Authority: Solicitor / Legal Counsel | MEDIUM | 0.6 | authority |
| Evidence Warning: Unsupported claims | MEDIUM | 0.6 | evidence |
| Contradiction: Obligation to meet deadline exists but resources to meet it  | CRITICAL | 0.8 | adversarial |
| Constraint: Fixed deadline constrains response time | HIGH | 0.8 | constraint-reality |
| Legal advice boundary | HIGH | 0.9 | regulated-boundary |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Obligation to meet deadline exists but resources to meet it do not | CRITICAL | ADVERSARIAL_CHALLENGE_PRESERVED |

## 17. Self-Adversarial Challenge

**Load-bearing assumptions:**
- Authority is held by Solicitor / Legal Counsel (if wrong: The decision may not be valid, or escalation may be misdirected.)
- Fixed deadline constrains response time (if wrong: The minimum viable path may change.)

**Information gaps:**


**Kernel limitations:**
- This analysis is based on the information provided and available evidence.
- The system cannot verify independently reported facts.
- Human review is recommended for high-consequence decisions.
- This does not constitute legal, tax, or regulated professional advice.

## 18. Regulated Boundary State

**Hit:** true
**Type:** legal-advice
**Professional brief:** Generated

## 19. Minimum Viable Path

| # | Action | Urgency |
|---|--------|---------|
| 1 | Address the primary identified risk: Obligation to meet deadline exists but resources to meet it do not. This is the failure point most likely to undermine the decision. | IMMEDIATE |
| 2 | Verify: Fixed deadline constrains response time | IMMEDIATE |
| 3 | Address: Time-sensitive obligation with defined deadline (deadline: Unknown) | IMMEDIATE |

## 20. Forbidden Actions

- **Proceed as if the filing obligation will resolve itself, or that delay is neutral** (CRITICAL): Statutory obligations compound with delay. Inaction is not a safe default — it is the highest-risk option.

## 21. What Must Not Be Delayed

- Address the primary identified risk: Obligation to meet deadline exists but resources to meet it do not. This is the failure point most likely to undermine the decision.
- Verify: Fixed deadline constrains response time
- Address: Time-sensitive obligation with defined deadline (deadline: Unknown)

## 22. Free Signal Output

### Situation Class

LEGAL_AND_CONTRACTUAL

### What the System Saw

The system interprets this situation as a legal or contractual decision where rights, obligations, or liabilities are being determined or disputed. Resource constraint meets external deadline. The system maps the minimum viable path rather than the ideal path.

### Primary Failure Point

Time-sensitive obligation with defined deadline

### Governing Tension

The system interprets this situation as a legal or contractual decision where rights, obligations, or liabilities are being determined or disputed

### Consequence Class

CRITICAL

### What the Full Analysis Maps

```json
[
  "Authority structure",
  "Obligation landscape",
  "Constraint graph",
  "Evidence graph",
  "Adversarial challenge"
]
```

### Direction of Minimum Viable Move

Address the primary identified risk: Obligation to meet deadline exists but resources to meet it do not. This is the failure point most likely to undermine the decision.

## 23. Basic Brief Output

*Not generated (requires separate run)*

## 24. Full Dossier Output

### Authority Map

```json
[
  {
    "holder": "Solicitor / Legal Counsel",
    "scope": "Legal advice and representation",
    "limitation": "Subject to professional regulation and client instructions",
    "evidenceBasis": "User-reported",
    "confidence": "MEDIUM",
    "source": "user_reported"
  }
]
```

### Obligation Map

```json
[
  {
    "description": "Time-sensitive obligation with defined deadline",
    "type": "contractual",
    "deadline": "Unknown",
    "consequence": "Penalty or default",
    "evidenceBasis": "User-reported",
    "confidence": "MEDIUM"
  }
]
```

### Constraint Graph

```json
[
  {
    "type": "time",
    "description": "Fixed deadline constrains response time",
    "severity": "HIGH",
    "isBinding": false
  }
]
```

### Evidence Graph

```json
[
  {
    "kind": "obligation",
    "label": "Obligation: Time-sensitive obligation with defined deadline",
    "summary": "Time-sensitive obligation with defined deadline",
    "severity": "HIGH",
    "confidence": 0.7,
    "sourceStage": "kernel",
    "sourceLens": "obligation"
  },
  {
    "kind": "authority",
    "label": "Authority: Solicitor / Legal Counsel",
    "summary": "Solicitor / Legal Counsel holds authority over Legal advice and representation",
    "severity": "MEDIUM",
    "confidence": 0.6,
    "sourceStage": "kernel",
    "sourceLens": "authority"
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
    "label": "Contradiction: Obligation to meet deadline exists but resources to meet it ",
    "summary": "Obligation to meet deadline exists but resources to meet it do not",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "adversarial"
  },
  {
    "kind": "constraint",
    "label": "Constraint: Fixed deadline constrains response time",
    "summary": "Fixed deadline constrains response time",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  },
  {
    "kind": "regulated_boundary",
    "label": "Legal advice boundary",
    "summary": "Regulated boundary detected: Legal advice boundary. System must not overclaim professional advice.",
    "severity": "HIGH",
    "confidence": 0.9,
    "sourceStage": "kernel",
    "sourceLens": "regulated-boundary"
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
  }
]
```

### Self-Adversarial Challenge

```json
{
  "loadBearingAssumptions": [
    {
      "assumption": "Authority is held by Solicitor / Legal Counsel",
      "evidenceBasis": "User-reported",
      "ifWrong": "The decision may not be valid, or escalation may be misdirected.",
      "verificationPath": "Verify authority documentation or delegation record."
    },
    {
      "assumption": "Fixed deadline constrains response time",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    }
  ],
  "classificationConfidence": {
    "primaryClass": "LEGAL_AND_CONTRACTUAL",
    "confidence": "HIGH",
    "alternativeClass": "GOVERNANCE_AND_BOARD",
    "implication": "If classification is wrong, the entire lens selection and output structure changes."
  },
  "informationGaps": [],
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
    "description": "Address the primary identified risk: Obligation to meet deadline exists but resources to meet it do not. This is the failure point most likely to undermine the decision.",
    "rationale": "The adversarial challenge (obligation-vs-resources) must be resolved or consciously accepted before the decision proceeds.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 2,
    "action": "VALIDATE_CRITICAL_CONSTRAINTS",
    "description": "Verify: Fixed deadline constrains response time",
    "rationale": "Critical constraints change what is feasible.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 3,
    "action": "ADDRESS_URGENT_OBLIGATIONS",
    "description": "Address: Time-sensitive obligation with defined deadline (deadline: Unknown)",
    "rationale": "Time-sensitive obligations cannot be safely deferred.",
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
  }
]
```

### Fallback Path

```json
[
  {
    "order": 2,
    "action": "VALIDATE_CRITICAL_CONSTRAINTS",
    "description": "Verify: Fixed deadline constrains response time",
    "rationale": "Critical constraints change what is feasible.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 3,
    "action": "ADDRESS_URGENT_OBLIGATIONS",
    "description": "Address: Time-sensitive obligation with defined deadline (deadline: Unknown)",
    "rationale": "Time-sensitive obligations cannot be safely deferred.",
    "urgency": "IMMEDIATE"
  }
]
```

### What Must Not Be Delayed

```json
[
  "Address the primary identified risk: Obligation to meet deadline exists but resources to meet it do not. This is the failure point most likely to undermine the decision.",
  "Verify: Fixed deadline constrains response time",
  "Address: Time-sensitive obligation with defined deadline (deadline: Unknown)"
]
```

### Record Reference

```json
{
  "caseReference": "PROOF-LEGAL_ADMIN_FAMILY_DEADLINE-DOSSIER",
  "kernelVersion": "1.0.0",
  "ontologyVersion": "1.0.0",
  "generatedAt": "2026-05-31T21:58:17.265Z"
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
    "suggestedProfession": "a qualified solicitor",
    "whatToBring": [
      "This Living Decision Case reference and output",
      "Authority documentation and delegation records",
      "Relevant contracts, filings, or regulatory correspondence",
      "Evidence of constraints (financial statements, timelines, capacity data)",
      "Any documentation referenced in the evidence graph"
    ],
    "questionsToAsk": [
      "What is the strength of the legal position and what are the limitation periods?"
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
**Triggers:** 4

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
