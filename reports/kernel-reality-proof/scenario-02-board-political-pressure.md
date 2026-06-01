# Board Decision Under Political Pressure

**Scenario:** `board_decision_political_pressure`
**Kernel Status:** COMPLETED
**Automatic Failures:** None

---

## 1. Raw User Situation

```
The board is being asked to approve a major acquisition. Two non-executive directors have expressed serious reservations about the strategic fit. The CEO is pushing for approval before the year-end. One NED has threatened to resign if the acquisition proceeds without a full due diligence period. The AGM is in three months.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is a board-level governance decision.

## 4. Kernel Interpretation

The system interprets this situation as a governance or board-level decision requiring proper process, documentation, and fiduciary consideration. Dimensions surfaced: authority.

## 5. Translation Confidence

**LOW**

## 6. Primary Decision Class

**GOVERNANCE_AND_BOARD**

## 7. Alternative Decision Classes

- **STRATEGIC_AND_POSITIONING** (MEDIUM): Score 5 vs primary 10

## 8. Surfaced Dimensions

- authority

## 9. Preserved Ambiguities

- decision_class_uncertain
- authority_structure
- obligation_landscape
- constraint_landscape
- timing_pressure

## 10. Clarification Questions

*None required*

## 11. Actor Map

| Actor | Role | Confidence |
|-------|------|------------|
| ceo | executive | HIGH |
| board | board | HIGH |

## 12. Authority State

| Holder | Scope | Limitation |
|--------|-------|------------|
| Board of Directors | Strategic and governance decisions | None |
| Chief Executive Officer | Executive operational decisions | May require board ratification for major decisions |
| Board of Directors | Fiduciary and governance decisions | Subject to shareholder oversight |

## 13. Obligation State

| Description | Type | Deadline | Consequence |
|-------------|------|----------|-------------|
| Fiduciary duty to board and shareholders | fiduciary | Unknown | Director liability |

## 14. Constraint Graph

| Description | Type | Severity | Binding |
|-------------|------|----------|---------|
| Board approval required — decision cannot proceed without it | authority | HIGH | No |
| External approval required before proceeding | authority | HIGH | No |

## 15. Evidence State

| Label | Severity | Confidence | Source |
|-------|----------|------------|--------|
| Authority: Board of Directors | MEDIUM | 0.6 | authority |
| Authority: Chief Executive Officer | MEDIUM | 0.6 | authority |
| Authority: Board of Directors | MEDIUM | 0.6 | authority |
| Obligation: Fiduciary duty to board and shareholders | MEDIUM | 0.7 | obligation |
| Evidence Gap: Low documentation | HIGH | 0.8 | evidence |
| Contradiction: Board action is proposed but internal reservations or disagr | HIGH | 0.8 | adversarial |
| Failure Mode: Governance pressure — board-level decision with fiduciary implications | HIGH | 0.7 | failure-mode |
| Constraint: Board approval required — decision cannot proceed without it | HIGH | 0.8 | constraint-reality |
| Constraint: External approval required before proceeding | HIGH | 0.8 | constraint-reality |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Board action is proposed but internal reservations or disagreement have not been resolved | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |

## 17. Self-Adversarial Challenge

**Load-bearing assumptions:**
- Authority is held by Board of Directors (if wrong: The decision may not be valid, or escalation may be misdirected.)
- Board approval required — decision cannot proceed without it (if wrong: The minimum viable path may change.)
- External approval required before proceeding (if wrong: The minimum viable path may change.)

**Information gaps:**


**Kernel limitations:**
- This analysis is based on the information provided and available evidence.
- The system cannot verify independently reported facts.
- Human review is recommended for high-consequence decisions.
- This does not constitute legal, tax, or regulated professional advice.

## 18. Regulated Boundary State

**Hit:** true
**Type:** director-duty-advice
**Professional brief:** Generated

## 19. Minimum Viable Path

| # | Action | Urgency |
|---|--------|---------|
| 1 | Do not bring the decision to a vote until all material reservations are formally documented and due diligence is confirmed as complete or consciously waived. A vote taken before objections are recorded is vulnerable to challenge. | IMMEDIATE |
| 2 | Ensure any NED reservation or objection is formally minuted before any vote is called. This protects the directors who object and documents the governance record. | IMMEDIATE |
| 3 | Establish whether the CEO's year-end deadline is a legal or contractual obligation or an internal preference. If it is a preference, it does not override governance process. | HIGH |

## 20. Forbidden Actions

- **Put the decision to a vote while material reservations or resignation threats from directors remain undocumented** (HIGH): A vote taken before formal objections are recorded creates reversal risk and may constitute a governance failure. The record must show objections were heard.

## 21. What Must Not Be Delayed

- Do not bring the decision to a vote until all material reservations are formally documented and due diligence is confirmed as complete or consciously waived. A vote taken before objections are recorded is vulnerable to challenge.
- Ensure any NED reservation or objection is formally minuted before any vote is called. This protects the directors who object and documents the governance record.

## 22. Free Signal Output

### Situation Class

GOVERNANCE_AND_BOARD

### What the System Saw

The system interprets this situation as a governance or board-level decision requiring proper process, documentation, and fiduciary consideration. Dimensions surfaced: authority.

### Primary Failure Point

Situation relies primarily on user-reported information without independent documentation

### Governing Tension

The system interprets this situation as a governance or board-level decision requiring proper process, documentation, and fiduciary consideration

### Consequence Class

HIGH

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

Do not bring the decision to a vote until all material reservations are formally documented and due diligence is confirmed as complete or consciously waived. A vote taken before objections are recorded is vulnerable to challenge.

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
  },
  {
    "holder": "Board of Directors",
    "scope": "Fiduciary and governance decisions",
    "limitation": "Subject to shareholder oversight",
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
    "description": "Fiduciary duty to board and shareholders",
    "type": "fiduciary",
    "deadline": null,
    "consequence": "Director liability",
    "evidenceBasis": "User-reported",
    "confidence": "MEDIUM"
  }
]
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
    "type": "authority",
    "description": "External approval required before proceeding",
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
    "kind": "authority",
    "label": "Authority: Board of Directors",
    "summary": "Board of Directors holds authority over Fiduciary and governance decisions",
    "severity": "MEDIUM",
    "confidence": 0.6,
    "sourceStage": "kernel",
    "sourceLens": "authority"
  },
  {
    "kind": "obligation",
    "label": "Obligation: Fiduciary duty to board and shareholders",
    "summary": "Fiduciary duty to board and shareholders",
    "severity": "MEDIUM",
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
    "label": "Contradiction: Board action is proposed but internal reservations or disagr",
    "summary": "Board action is proposed but internal reservations or disagreement have not been resolved",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "adversarial"
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
    "label": "Constraint: External approval required before proceeding",
    "summary": "External approval required before proceeding",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "constraint-reality"
  }
]
```

### Adversarial Challenge

```json
[
  {
    "id": "board-pressure-vs-reservations",
    "between": [
      "authority-lens",
      "evidence-lens"
    ],
    "contradiction": "Board action is proposed but internal reservations or disagreement have not been resolved",
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
      "assumption": "External approval required before proceeding",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    }
  ],
  "classificationConfidence": {
    "primaryClass": "GOVERNANCE_AND_BOARD",
    "confidence": "LOW",
    "alternativeClass": "STRATEGIC_AND_POSITIONING",
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
    "action": "DELAY_OR_CONDITION_THE_VOTE",
    "description": "Do not bring the decision to a vote until all material reservations are formally documented and due diligence is confirmed as complete or consciously waived. A vote taken before objections are recorded is vulnerable to challenge.",
    "rationale": "A NED resignation threat is a governance signal, not a negotiating tactic. The process protects the board as much as the decision.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 2,
    "action": "RECORD_FORMAL_OBJECTIONS",
    "description": "Ensure any NED reservation or objection is formally minuted before any vote is called. This protects the directors who object and documents the governance record.",
    "rationale": "Undocumented objections cannot be relied upon later. The record must show the objections were heard.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 3,
    "action": "CLARIFY_CEO_DEADLINE",
    "description": "Establish whether the CEO's year-end deadline is a legal or contractual obligation or an internal preference. If it is a preference, it does not override governance process.",
    "rationale": "Manufactured urgency is a known governance pressure vector. Distinguish it from genuine obligation before it determines the timeline.",
    "urgency": "HIGH"
  }
]
```

### Forbidden Actions

```json
[
  {
    "action": "Put the decision to a vote while material reservations or resignation threats from directors remain undocumented",
    "reason": "A vote taken before formal objections are recorded creates reversal risk and may constitute a governance failure. The record must show objections were heard.",
    "severity": "HIGH"
  }
]
```

### Fallback Path

```json
[
  {
    "order": 2,
    "action": "RECORD_FORMAL_OBJECTIONS",
    "description": "Ensure any NED reservation or objection is formally minuted before any vote is called. This protects the directors who object and documents the governance record.",
    "rationale": "Undocumented objections cannot be relied upon later. The record must show the objections were heard.",
    "urgency": "IMMEDIATE"
  },
  {
    "order": 3,
    "action": "CLARIFY_CEO_DEADLINE",
    "description": "Establish whether the CEO's year-end deadline is a legal or contractual obligation or an internal preference. If it is a preference, it does not override governance process.",
    "rationale": "Manufactured urgency is a known governance pressure vector. Distinguish it from genuine obligation before it determines the timeline.",
    "urgency": "HIGH"
  }
]
```

### What Must Not Be Delayed

```json
[
  "Do not bring the decision to a vote until all material reservations are formally documented and due diligence is confirmed as complete or consciously waived. A vote taken before objections are recorded is vulnerable to challenge.",
  "Ensure any NED reservation or objection is formally minuted before any vote is called. This protects the directors who object and documents the governance record."
]
```

### Record Reference

```json
{
  "caseReference": "PROOF-BOARD_DECISION_POLITICAL_PRESSURE-DOSSIER",
  "kernelVersion": "1.0.0",
  "ontologyVersion": "1.0.0",
  "generatedAt": "2026-05-31T21:58:16.964Z"
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
      "What is the strength of the legal position and what are the limitation periods?",
      "What are the director duties and potential liabilities in this situation?"
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
