# Executive Reputational Exposure

**Scenario:** `executive_reputational_exposure`
**Kernel Status:** COMPLETED
**Automatic Failures:** None

---

## 1. Raw User Situation

```
A newspaper has contacted us about allegations regarding the CEO's conduct at a previous company. The allegations are unproven but damaging. The CEO says they are false. The PR firm recommends a full denial. The legal team says any public statement could prejudice potential proceedings. The board meets tomorrow.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is a reputational or exposure situation.

## 4. Kernel Interpretation

The system interprets this situation as a reputational or exposure decision where public perception, trust, or brand integrity is at risk.

## 5. Translation Confidence

**HIGH**

## 6. Primary Decision Class

**REPUTATIONAL_AND_EXPOSURE**

## 7. Alternative Decision Classes

- **GOVERNANCE_AND_BOARD** (LOW): Authority ambiguity suggests governance dimension
- **FINANCIAL_AND_CAPITAL** (LOW): Constraint ambiguity suggests financial feasibility question

## 8. Surfaced Dimensions

*None surfaced*

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
| board | board | HIGH |
| legal advisor | advisor | HIGH |

## 12. Authority State

*No authority mapped*

## 13. Obligation State

*No obligations mapped*

## 14. Constraint Graph

| Description | Type | Severity | Binding |
|-------------|------|----------|---------|
| Board approval required — decision cannot proceed without it | authority | HIGH | No |
| Potential legal proceedings — any public communication requires legal clearance | legal | CRITICAL | Yes |
| Legal proceedings risk — public statements may prejudice the case | legal | HIGH | No |

## 15. Evidence State

| Label | Severity | Confidence | Source |
|-------|----------|------------|--------|
| Failure Mode: Governance pressure — board-level decision with fiduciary implications | HIGH | 0.7 | failure-mode |
| Failure Mode: Legal exposure — potential liability or dispute | HIGH | 0.7 | failure-mode |
| Evidence Gap: Low documentation | HIGH | 0.8 | evidence |
| Evidence Warning: Unsupported claims | MEDIUM | 0.6 | evidence |
| Contradiction: Reputational threat is active but no reviewed, legally-clear | HIGH | 0.8 | adversarial |
| Contradiction: PR team and legal team have conflicting recommendations — re | HIGH | 0.8 | adversarial |
| Constraint: Board approval required — decision cannot proceed without it | HIGH | 0.8 | constraint-reality |
| Constraint: Potential legal proceedings — any public communication requires legal clearance | CRITICAL | 0.8 | constraint-reality |
| Constraint: Legal proceedings risk — public statements may prejudice the case | HIGH | 0.8 | constraint-reality |
| Legal advice boundary | HIGH | 0.9 | regulated-boundary |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Reputational threat is active but no reviewed, legally-cleared response plan exists | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |
| PR team and legal team have conflicting recommendations — response strategy is unresolved | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |

## 17. Self-Adversarial Challenge

**Load-bearing assumptions:**
- Board approval required — decision cannot proceed without it (if wrong: The minimum viable path may change.)
- Potential legal proceedings — any public communication requires legal clearance (if wrong: The minimum viable path may change.)

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
**Type:** legal-advice
**Professional brief:** Generated

## 19. Minimum Viable Path

| # | Action | Urgency |
|---|--------|---------|
| 1 | Do not issue any public statement until legal counsel has assessed whether it would prejudice potential proceedings. This applies regardless of PR pressure tonight. | IMMEDIATE |
| 2 | Brief the board before it meets tomorrow. Provide both the PR recommendation and the legal position. Do not pre-decide the response. | IMMEDIATE |
| 3 | Ensure all internal communications regarding the allegations are preserved. Document what was known, when, and by whom. | IMMEDIATE |

## 20. Forbidden Actions

- **Issue a public response before facts, decision authority, and legal exposure have been assessed and the response has been cleared** (CRITICAL): A premature or unauthorised public statement may worsen the reputational position and create legal liability that cannot be retracted.
- **Issue any public statement tonight or before the board has met and legal counsel has confirmed no proceedings risk** (CRITICAL): Any public statement made while proceedings are possible may prejudice the organisation's legal position. Legal clearance is not a procedural step — it is protection.

## 21. What Must Not Be Delayed

- Do not issue any public statement until legal counsel has assessed whether it would prejudice potential proceedings. This applies regardless of PR pressure tonight.
- Brief the board before it meets tomorrow. Provide both the PR recommendation and the legal position. Do not pre-decide the response.
- Ensure all internal communications regarding the allegations are preserved. Document what was known, when, and by whom.

## 22. Free Signal Output

### Situation Class

REPUTATIONAL_AND_EXPOSURE

### What the System Saw

The system interprets this situation as a reputational or exposure decision where public perception, trust, or brand integrity is at risk.

### Primary Failure Point

Governance pressure — board-level decision with fiduciary implications

### Governing Tension

The system interprets this situation as a reputational or exposure decision where public perception, trust, or brand integrity is at risk

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

Do not issue any public statement until legal counsel has assessed whether it would prejudice potential proceedings. This applies regardless of PR pressure tonight.

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
  },
  {
    "type": "legal",
    "description": "Potential legal proceedings — any public communication requires legal clearance",
    "severity": "CRITICAL",
    "isBinding": true
  },
  {
    "type": "legal",
    "description": "Legal proceedings risk — public statements may prejudice the case",
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
    "kind": "failure_mode",
    "label": "Failure Mode: Legal exposure — potential liability or dispute",
    "summary": "Legal exposure — potential liability or dispute",
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
    "label": "Contradiction: Reputational threat is active but no reviewed, legally-clear",
    "summary": "Reputational threat is active but no reviewed, legally-cleared response plan exists",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "adversarial"
  },
  {
    "kind": "contradiction",
    "label": "Contradiction: PR team and legal team have conflicting recommendations — re",
    "summary": "PR team and legal team have conflicting recommendations — response strategy is unresolved",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "adversarial"
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
    "kind": "constraint",
    "label": "Constraint: Potential legal proceedings — any public communication requires legal clearance",
    "summary": "Potential legal proceedings — any public communication requires legal clearance",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  },
  {
    "kind": "constraint",
    "label": "Constraint: Legal proceedings risk — public statements may prejudice the case",
    "summary": "Legal proceedings risk — public statements may prejudice the case",
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
    "id": "reputational-threat-vs-response-gap",
    "between": [
      "failure-mode-lens",
      "evidence-lens"
    ],
    "contradiction": "Reputational threat is active but no reviewed, legally-cleared response plan exists",
    "severity": "HIGH",
    "resolutionRule": "ADVERSARIAL_CHALLENGE_PRESERVED",
    "outputEffect": "Output confidence downgraded. Human review recommended."
  },
  {
    "id": "pr-vs-legal-conflict",
    "between": [
      "authority-lens",
      "obligation-lens"
    ],
    "contradiction": "PR team and legal team have conflicting recommendations — response strategy is unresolved",
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
      "assumption": "Board approval required — decision cannot proceed without it",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    },
    {
      "assumption": "Potential legal proceedings — any public communication requires legal clearance",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    }
  ],
  "classificationConfidence": {
    "primaryClass": "REPUTATIONAL_AND_EXPOSURE",
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
    "action": "HOLD_PUBLIC_COMMUNICATIONS",
    "description": "Do not issue any public statement until legal counsel has assessed whether it would prejudice potential proceedings. This applies regardless of PR pressure tonight.",
    "rationale": "A premature statement cannot be withdrawn. Legal exposure and reputational damage from a wrong statement exceeds the cost of delay.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 2,
    "action": "BRIEF_DECISION_AUTHORITY",
    "description": "Brief the board before it meets tomorrow. Provide both the PR recommendation and the legal position. Do not pre-decide the response.",
    "rationale": "The board meeting tomorrow is the legitimate decision gate. Both positions must be heard before a response is authorised.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 3,
    "action": "PRESERVE_EVIDENCE_RECORD",
    "description": "Ensure all internal communications regarding the allegations are preserved. Document what was known, when, and by whom.",
    "rationale": "Record integrity is required for any defence — legal, regulatory, or reputational.",
    "urgency": "IMMEDIATE"
  }
]
```

### Forbidden Actions

```json
[
  {
    "action": "Issue a public response before facts, decision authority, and legal exposure have been assessed and the response has been cleared",
    "reason": "A premature or unauthorised public statement may worsen the reputational position and create legal liability that cannot be retracted.",
    "severity": "CRITICAL"
  },
  {
    "action": "Issue any public statement tonight or before the board has met and legal counsel has confirmed no proceedings risk",
    "reason": "Any public statement made while proceedings are possible may prejudice the organisation's legal position. Legal clearance is not a procedural step — it is protection.",
    "severity": "CRITICAL"
  }
]
```

### Fallback Path

```json
[
  {
    "order": 2,
    "action": "BRIEF_DECISION_AUTHORITY",
    "description": "Brief the board before it meets tomorrow. Provide both the PR recommendation and the legal position. Do not pre-decide the response.",
    "rationale": "The board meeting tomorrow is the legitimate decision gate. Both positions must be heard before a response is authorised.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 3,
    "action": "PRESERVE_EVIDENCE_RECORD",
    "description": "Ensure all internal communications regarding the allegations are preserved. Document what was known, when, and by whom.",
    "rationale": "Record integrity is required for any defence — legal, regulatory, or reputational.",
    "urgency": "IMMEDIATE"
  }
]
```

### What Must Not Be Delayed

```json
[
  "Do not issue any public statement until legal counsel has assessed whether it would prejudice potential proceedings. This applies regardless of PR pressure tonight.",
  "Brief the board before it meets tomorrow. Provide both the PR recommendation and the legal position. Do not pre-decide the response.",
  "Ensure all internal communications regarding the allegations are preserved. Document what was known, when, and by whom."
]
```

### Record Reference

```json
{
  "caseReference": "PROOF-EXECUTIVE_REPUTATIONAL_EXPOSURE-DOSSIER",
  "kernelVersion": "1.0.0",
  "ontologyVersion": "1.0.0",
  "generatedAt": "2026-05-31T16:19:30.669Z"
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
**Tier:** URGENT
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
