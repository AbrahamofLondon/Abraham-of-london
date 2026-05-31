# Strategic Asymmetric Partnership

**Scenario:** `strategic_asymmetric_partnership`
**Kernel Status:** COMPLETED
**Automatic Failures:** None

---

## 1. Raw User Situation

```
A much larger company has offered a strategic partnership. They want exclusive access to our technology in exchange for distribution. Our board is excited. The legal team says the contract has no exit clause and grants them IP rights to derivative works. The CEO wants to sign quickly before they change their mind.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is a strategic positioning decision.

## 4. Kernel Interpretation

The system interprets this situation as a strategic or positioning decision where direction, structure, or competitive posture is being set.

## 5. Translation Confidence

**LOW**

## 6. Primary Decision Class

**STRATEGIC_AND_POSITIONING**

## 7. Alternative Decision Classes

- **GOVERNANCE_AND_BOARD** (HIGH): Score 10 vs primary 11
- **OPERATIONAL_AND_EXECUTION** (HIGH): Score 10 vs primary 11
- **LEGAL_AND_CONTRACTUAL** (LOW): Score 4 vs primary 11

## 8. Surfaced Dimensions

*None surfaced*

## 9. Preserved Ambiguities

- decision_class_uncertain
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

| Holder | Scope | Limitation |
|--------|-------|------------|
| Board of Directors | Strategic and governance decisions | None |
| Chief Executive Officer | Executive operational decisions | May require board ratification for major decisions |

## 13. Obligation State

*No obligations mapped*

## 14. Constraint Graph

| Description | Type | Severity | Binding |
|-------------|------|----------|---------|
| Board approval required — decision cannot proceed without it | authority | HIGH | No |
| No exit clause — commitment cannot be unwound once signed | legal | CRITICAL | Yes |
| IP rights transfer — permanent loss of intellectual property control | legal | CRITICAL | Yes |
| Derivative works clause — potential loss of control over future IP development | legal | CRITICAL | Yes |
| Exclusivity clause — restriction on ability to work with other partners | legal | HIGH | No |
| External urgency pressure — timeline driven by partner preference, not obligation | time | HIGH | No |
| Manufactured urgency — threat of withdrawal used to bypass proper review | time | HIGH | No |

## 15. Evidence State

| Label | Severity | Confidence | Source |
|-------|----------|------------|--------|
| Authority: Board of Directors | MEDIUM | 0.6 | authority |
| Authority: Chief Executive Officer | MEDIUM | 0.6 | authority |
| Failure Mode: Governance pressure — board-level decision with fiduciary implications | HIGH | 0.7 | failure-mode |
| Failure Mode: Legal exposure — potential liability or dispute | HIGH | 0.7 | failure-mode |
| Constraint: Board approval required — decision cannot proceed without it | HIGH | 0.8 | constraint-reality |
| Constraint: No exit clause — commitment cannot be unwound once signed | CRITICAL | 0.8 | constraint-reality |
| Constraint: IP rights transfer — permanent loss of intellectual property control | CRITICAL | 0.8 | constraint-reality |
| Constraint: Derivative works clause — potential loss of control over future IP development | CRITICAL | 0.8 | constraint-reality |
| Constraint: Exclusivity clause — restriction on ability to work with other partners | HIGH | 0.8 | constraint-reality |
| Constraint: External urgency pressure — timeline driven by partner preference, not obligation | HIGH | 0.8 | constraint-reality |
| Constraint: Manufactured urgency — threat of withdrawal used to bypass proper review | HIGH | 0.8 | constraint-reality |
| Contradiction: Proposed commitment would permanently restrict or eliminate  | HIGH | 0.8 | adversarial |
| Contradiction: Executive urgency to commit conflicts with unresolved legal  | HIGH | 0.8 | adversarial |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Proposed commitment would permanently restrict or eliminate a current capability or creates irrevocable IP/capability transfer | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |
| Executive urgency to commit conflicts with unresolved legal concerns | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |

## 17. Self-Adversarial Challenge

**Load-bearing assumptions:**
- Authority is held by Board of Directors (if wrong: The decision may not be valid, or escalation may be misdirected.)
- Board approval required — decision cannot proceed without it (if wrong: The minimum viable path may change.)
- No exit clause — commitment cannot be unwound once signed (if wrong: The minimum viable path may change.)

**Information gaps:**
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
| 1 | Do not sign this agreement before the following are resolved as separate documented decisions: (1) IP rights and derivative works scope; (2) exit rights or absence of exit clause; (3) dependency on partner for distribution. The current urgency is external pressure, not an obligation. | IMMEDIATE |
| 2 | List the specific terms that create permanent constraint (IP transfer, no exit, exclusivity scope, derivative works definition). Each must be understood and accepted separately, not as a package. | HIGH |
| 3 | Map what the organisation loses the ability to do if this agreement is signed: sell direct, pivot technology, partner with competitors, change pricing. Make these visible before the board decision. | HIGH |

## 20. Forbidden Actions

- **Transfer IP rights, exclusivity, or exit options without documenting the irreversibility and the capability loss it creates** (CRITICAL): Irrevocable capability loss cannot be undone. It must be a conscious, documented decision — not an oversight obscured in contract language.
- **Sign or commit before legal concerns are recorded and consciously resolved or accepted by the proper authority** (CRITICAL): Proceeding while legal concerns are explicitly unresolved creates liability that cannot be retrospectively managed.

## 21. What Must Not Be Delayed

- Do not sign this agreement before the following are resolved as separate documented decisions: (1) IP rights and derivative works scope; (2) exit rights or absence of exit clause; (3) dependency on partner for distribution. The current urgency is external pressure, not an obligation.

## 22. Free Signal Output

### Situation Class

STRATEGIC_AND_POSITIONING

### What the System Saw

The system interprets this situation as a strategic or positioning decision where direction, structure, or competitive posture is being set.

### Primary Failure Point

Governance pressure — board-level decision with fiduciary implications

### Governing Tension

The system interprets this situation as a strategic or positioning decision where direction, structure, or competitive posture is being set

### Consequence Class

CRITICAL

### What the Full Analysis Maps

```json
[
  "Authority structure",
  "Constraint graph",
  "Evidence graph",
  "Adversarial challenge"
]
```

### Direction of Minimum Viable Move

Do not sign this agreement before the following are resolved as separate documented decisions: (1) IP rights and derivative works scope; (2) exit rights or absence of exit clause; (3) dependency on partner for distribution. The current urgency is external pressure, not an obligation.

## 23. Basic Brief Output

*Not generated (requires separate run)*

## 24. Full Dossier Output

### Authority Map

```json
[
  {
    "holder": "Board of Directors",
    "scope": "Strategic and governance decisions",
    "limitation": null,
    "evidenceBasis": "User-reported",
    "confidence": "MEDIUM",
    "source": "user_reported"
  },
  {
    "holder": "Chief Executive Officer",
    "scope": "Executive operational decisions",
    "limitation": "May require board ratification for major decisions",
    "evidenceBasis": "User-reported",
    "confidence": "MEDIUM",
    "source": "user_reported"
  }
]
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
    "description": "No exit clause — commitment cannot be unwound once signed",
    "severity": "CRITICAL",
    "isBinding": true
  },
  {
    "type": "legal",
    "description": "IP rights transfer — permanent loss of intellectual property control",
    "severity": "CRITICAL",
    "isBinding": true
  },
  {
    "type": "legal",
    "description": "Derivative works clause — potential loss of control over future IP development",
    "severity": "CRITICAL",
    "isBinding": true
  },
  {
    "type": "legal",
    "description": "Exclusivity clause — restriction on ability to work with other partners",
    "severity": "HIGH",
    "isBinding": false
  },
  {
    "type": "time",
    "description": "External urgency pressure — timeline driven by partner preference, not obligation",
    "severity": "HIGH",
    "isBinding": false
  },
  {
    "type": "time",
    "description": "Manufactured urgency — threat of withdrawal used to bypass proper review",
    "severity": "HIGH",
    "isBinding": false
  }
]
```

### Evidence Graph

```json
[
  {
    "kind": "authority",
    "label": "Authority: Board of Directors",
    "summary": "Board of Directors holds authority over Strategic and governance decisions",
    "severity": "MEDIUM",
    "confidence": 0.6,
    "sourceStage": "kernel",
    "sourceLens": "authority"
  },
  {
    "kind": "authority",
    "label": "Authority: Chief Executive Officer",
    "summary": "Chief Executive Officer holds authority over Executive operational decisions",
    "severity": "MEDIUM",
    "confidence": 0.6,
    "sourceStage": "kernel",
    "sourceLens": "authority"
  },
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
    "label": "Constraint: No exit clause — commitment cannot be unwound once signed",
    "summary": "No exit clause — commitment cannot be unwound once signed",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  },
  {
    "kind": "constraint",
    "label": "Constraint: IP rights transfer — permanent loss of intellectual property control",
    "summary": "IP rights transfer — permanent loss of intellectual property control",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  },
  {
    "kind": "constraint",
    "label": "Constraint: Derivative works clause — potential loss of control over future IP development",
    "summary": "Derivative works clause — potential loss of control over future IP development",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  },
  {
    "kind": "constraint",
    "label": "Constraint: Exclusivity clause — restriction on ability to work with other partners",
    "summary": "Exclusivity clause — restriction on ability to work with other partners",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  },
  {
    "kind": "constraint",
    "label": "Constraint: External urgency pressure — timeline driven by partner preference, not obligation",
    "summary": "External urgency pressure — timeline driven by partner preference, not obligation",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  },
  {
    "kind": "constraint",
    "label": "Constraint: Manufactured urgency — threat of withdrawal used to bypass proper review",
    "summary": "Manufactured urgency — threat of withdrawal used to bypass proper review",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  },
  {
    "kind": "contradiction",
    "label": "Contradiction: Proposed commitment would permanently restrict or eliminate ",
    "summary": "Proposed commitment would permanently restrict or eliminate a current capability or creates irrevocable IP/capability transfer",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "adversarial"
  },
  {
    "kind": "contradiction",
    "label": "Contradiction: Executive urgency to commit conflicts with unresolved legal ",
    "summary": "Executive urgency to commit conflicts with unresolved legal concerns",
    "severity": "HIGH",
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
    "id": "strategic-commitment-vs-capability",
    "between": [
      "obligation-lens",
      "failure-mode-lens"
    ],
    "contradiction": "Proposed commitment would permanently restrict or eliminate a current capability or creates irrevocable IP/capability transfer",
    "severity": "HIGH",
    "resolutionRule": "ADVERSARIAL_CHALLENGE_PRESERVED",
    "outputEffect": "Output confidence downgraded. Human review recommended."
  },
  {
    "id": "urgency-vs-legal-concern",
    "between": [
      "authority-lens",
      "obligation-lens"
    ],
    "contradiction": "Executive urgency to commit conflicts with unresolved legal concerns",
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
      "assumption": "Authority is held by Board of Directors",
      "evidenceBasis": "User-reported",
      "ifWrong": "The decision may not be valid, or escalation may be misdirected.",
      "verificationPath": "Verify authority documentation or delegation record."
    },
    {
      "assumption": "Board approval required — decision cannot proceed without it",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    },
    {
      "assumption": "No exit clause — commitment cannot be unwound once signed",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    }
  ],
  "classificationConfidence": {
    "primaryClass": "STRATEGIC_AND_POSITIONING",
    "confidence": "LOW",
    "alternativeClass": "GOVERNANCE_AND_BOARD",
    "implication": "If classification is wrong, the entire lens selection and output structure changes."
  },
  "informationGaps": [
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
    "action": "PAUSE_SIGNATURE",
    "description": "Do not sign this agreement before the following are resolved as separate documented decisions: (1) IP rights and derivative works scope; (2) exit rights or absence of exit clause; (3) dependency on partner for distribution. The current urgency is external pressure, not an obligation.",
    "rationale": "The partner's impatience is not an obligation. The decision to accept irrevocable terms must be made consciously, not under time pressure.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 2,
    "action": "SEPARATE_TERMS_FOR_DECISION",
    "description": "List the specific terms that create permanent constraint (IP transfer, no exit, exclusivity scope, derivative works definition). Each must be understood and accepted separately, not as a package.",
    "rationale": "Package agreements obscure irrevocable terms. Each term that restricts future optionality must be a deliberate, documented decision.",
    "urgency": "HIGH"
  },
  {
    "order": 3,
    "action": "ASSESS_OPTIONALITY_DESTRUCTION",
    "description": "Map what the organisation loses the ability to do if this agreement is signed: sell direct, pivot technology, partner with competitors, change pricing. Make these visible before the board decision.",
    "rationale": "The board is excited about distribution access. The question is what optionality they are selling. That must be visible to them, not implicit.",
    "urgency": "HIGH"
  }
]
```

### Forbidden Actions

```json
[
  {
    "action": "Transfer IP rights, exclusivity, or exit options without documenting the irreversibility and the capability loss it creates",
    "reason": "Irrevocable capability loss cannot be undone. It must be a conscious, documented decision — not an oversight obscured in contract language.",
    "severity": "CRITICAL"
  },
  {
    "action": "Sign or commit before legal concerns are recorded and consciously resolved or accepted by the proper authority",
    "reason": "Proceeding while legal concerns are explicitly unresolved creates liability that cannot be retrospectively managed.",
    "severity": "CRITICAL"
  }
]
```

### Fallback Path

```json
[
  {
    "order": 2,
    "action": "SEPARATE_TERMS_FOR_DECISION",
    "description": "List the specific terms that create permanent constraint (IP transfer, no exit, exclusivity scope, derivative works definition). Each must be understood and accepted separately, not as a package.",
    "rationale": "Package agreements obscure irrevocable terms. Each term that restricts future optionality must be a deliberate, documented decision.",
    "urgency": "HIGH"
  },
  {
    "order": 3,
    "action": "ASSESS_OPTIONALITY_DESTRUCTION",
    "description": "Map what the organisation loses the ability to do if this agreement is signed: sell direct, pivot technology, partner with competitors, change pricing. Make these visible before the board decision.",
    "rationale": "The board is excited about distribution access. The question is what optionality they are selling. That must be visible to them, not implicit.",
    "urgency": "HIGH"
  }
]
```

### What Must Not Be Delayed

```json
[
  "Do not sign this agreement before the following are resolved as separate documented decisions: (1) IP rights and derivative works scope; (2) exit rights or absence of exit clause; (3) dependency on partner for distribution. The current urgency is external pressure, not an obligation."
]
```

### Record Reference

```json
{
  "caseReference": "PROOF-STRATEGIC_ASYMMETRIC_PARTNERSHIP-DOSSIER",
  "kernelVersion": "1.0.0",
  "ontologyVersion": "1.0.0",
  "generatedAt": "2026-05-31T16:10:46.051Z"
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
