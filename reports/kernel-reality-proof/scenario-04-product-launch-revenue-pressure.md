# Product Launch Under Revenue Pressure

**Scenario:** `product_launch_revenue_pressure`
**Kernel Status:** COMPLETED
**Automatic Failures:** Generic paid output detected

---

## 1. Raw User Situation

```
We need to launch this product in Q2 or we miss our revenue target. The engineering team says it is not ready — there are three known critical bugs and the security review is incomplete. Sales has already pre-sold £500k based on the Q2 launch date. The board does not know about the security issue.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is an operational or release decision.

## 4. Kernel Interpretation

The system interprets this situation as an operational or execution decision where delivery, capacity, or process reliability is the primary concern. Dimensions surfaced: consequence.

## 5. Translation Confidence

**HIGH**

## 6. Primary Decision Class

**OPERATIONAL_AND_EXECUTION**

## 7. Alternative Decision Classes

- **GOVERNANCE_AND_BOARD** (LOW): Authority ambiguity suggests governance dimension
- **FINANCIAL_AND_CAPITAL** (LOW): Constraint ambiguity suggests financial feasibility question

## 8. Surfaced Dimensions

- consequence

## 9. Preserved Ambiguities

- authority_structure
- constraint_landscape
- timing_pressure

## 10. Clarification Questions

*None required*

## 11. Actor Map

| Actor | Role | Confidence |
|-------|------|------------|
| board | board | HIGH |

## 12. Authority State

*No authority mapped*

## 13. Obligation State

*No obligations mapped*

## 14. Constraint Graph

| Description | Type | Severity | Binding |
|-------------|------|----------|---------|
| Board approval required — decision cannot proceed without it | authority | HIGH | No |
| No clear owner for operational failure resolution — ownership is disputed between teams | ownership | CRITICAL | Yes |

## 15. Evidence State

| Label | Severity | Confidence | Source |
|-------|----------|------------|--------|
| Failure Mode: Governance pressure — board-level decision with fiduciary implications | HIGH | 0.7 | failure-mode |
| Constraint: Board approval required — decision cannot proceed without it | HIGH | 0.8 | constraint-reality |
| Evidence Gap: Low documentation | HIGH | 0.8 | evidence |
| Contradiction: Pressure to launch conflicts with unresolved readiness issue | CRITICAL | 0.8 | adversarial |
| Contradiction: Responsibility exists but authority to act is unclear or dis | HIGH | 0.8 | adversarial |
| Contradiction: Revenue or contract pressure exists but readiness or approva | HIGH | 0.8 | adversarial |
| Release Risk: Known unresolved defects | HIGH | 0.8 | release-risk |
| Release Risk: Security review incomplete | CRITICAL | 0.8 | release-risk |
| Release Risk: Product or service not ready for release | CRITICAL | 0.8 | release-risk |
| Release Risk: Revenue pre-sold against unproven delivery | HIGH | 0.8 | release-risk |
| Blocker: Known unresolved defects | CRITICAL | 0.8 | launch-readiness |
| Blocker: Security or compliance concern | CRITICAL | 0.9 | launch-readiness |
| Condition: Launch approval required | MEDIUM | 0.7 | launch-readiness |
| Incentive distortion: Revenue pressure vs readiness | HIGH | 0.8 | launch-readiness |
| Forbidden: Launch with unresolved blockers | CRITICAL | 0.9 | launch-readiness |
| Ownership gap: Disputed accountability | CRITICAL | 0.9 | operational-ownership |
| Must not delay: Assign clear ownership | CRITICAL | 0.9 | operational-ownership |
| Unsupported claim: Revenue or pricing position | HIGH | 0.8 | commercial-proof |
| Forbidden: Publish unsupported commercial claim | CRITICAL | 0.9 | commercial-proof |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Pressure to launch conflicts with unresolved readiness issues | CRITICAL | ADVERSARIAL_CHALLENGE_PRESERVED |
| Responsibility exists but authority to act is unclear or disputed | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |
| Revenue or contract pressure exists but readiness or approval has not been confirmed | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |
| Revenue or deadline pressure to launch conflicts with known unresolved readiness issues. The incentive to launch early may be distorting the risk assessment. | CRITICAL | ADVERSARIAL_CHALLENGE_PRESERVED |
| Operational ownership is disputed — each party attributes responsibility elsewhere. Without clear ownership, no recovery action can be assigned and the failure will recur. | CRITICAL | ADVERSARIAL_CHALLENGE_PRESERVED |
| 1 of 1 commercial claim(s) lack supporting evidence and would not survive buyer, regulator, or competitor challenge | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |

## 17. Self-Adversarial Challenge

**Load-bearing assumptions:**
- Board approval required — decision cannot proceed without it (if wrong: The minimum viable path may change.)
- No clear owner for operational failure resolution — ownership is disputed between teams (if wrong: The minimum viable path may change.)

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
| 1 | Address the primary identified risk: Pressure to launch conflicts with unresolved readiness issues. This is the failure point most likely to undermine the decision. | IMMEDIATE |
| 2 | Identify and confirm who holds formal decision mandate. | IMMEDIATE |
| 3 | Verify: Board approval required — decision cannot proceed without it | IMMEDIATE |

## 20. Forbidden Actions

- **Launch or proceed while unresolved readiness issues exist and revenue pressure is distorting the risk assessment** (CRITICAL): Revenue pressure creates a known decision bias. The incentive to proceed may be overriding legitimate readiness concerns. Separate the revenue decision from the readiness decision.
- **Proceed with operational recovery while ownership of the failure remains disputed between teams** (CRITICAL): Without clear ownership, no recovery action can be assigned and the failure will recur. Ownership must be resolved before technical recovery can be effective.
- **Publish or present commercial claims without supporting evidence that would survive buyer, regulator, or competitor challenge** (CRITICAL): Unsupported commercial claims create legal, regulatory, and reputational exposure. Each claim must have a documented evidence basis before publication.
- **Do not launch while the following blocker(s) remain unresolved: Known unresolved defects, Unresolved security or compliance concern** (CRITICAL): Forbidden: Launch with unresolved blockers
- **Do not publish or present the following claim(s) without supporting evidence: Revenue or pricing position** (CRITICAL): Forbidden: Publish unsupported commercial claim

## 21. What Must Not Be Delayed

- Address the primary identified risk: Pressure to launch conflicts with unresolved readiness issues. This is the failure point most likely to undermine the decision.
- Identify and confirm who holds formal decision mandate.
- Verify: Board approval required — decision cannot proceed without it

## 22. Free Signal Output

### Situation Class

OPERATIONAL_AND_EXECUTION

### What the System Saw

The system interprets this situation as an operational or execution decision where delivery, capacity, or process reliability is the primary concern. Dimensions surfaced: consequence.

### Primary Failure Point

Governance pressure — board-level decision with fiduciary implications

### Governing Tension

The system interprets this situation as an operational or execution decision where delivery, capacity, or process reliability is the primary concern

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

Address the primary identified risk: Pressure to launch conflicts with unresolved readiness issues. This is the failure point most likely to undermine the decision.

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
    "type": "ownership",
    "description": "No clear owner for operational failure resolution — ownership is disputed between teams",
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
    "label": "Contradiction: Pressure to launch conflicts with unresolved readiness issue",
    "summary": "Pressure to launch conflicts with unresolved readiness issues",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "adversarial"
  },
  {
    "kind": "contradiction",
    "label": "Contradiction: Responsibility exists but authority to act is unclear or dis",
    "summary": "Responsibility exists but authority to act is unclear or disputed",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "adversarial"
  },
  {
    "kind": "contradiction",
    "label": "Contradiction: Revenue or contract pressure exists but readiness or approva",
    "summary": "Revenue or contract pressure exists but readiness or approval has not been confirmed",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "adversarial"
  },
  {
    "kind": "release_risk",
    "label": "Release Risk: Known unresolved defects",
    "summary": "Known unresolved defects",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "release-risk"
  },
  {
    "kind": "release_risk",
    "label": "Release Risk: Security review incomplete",
    "summary": "Security review incomplete",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "release-risk"
  },
  {
    "kind": "release_risk",
    "label": "Release Risk: Product or service not ready for release",
    "summary": "Product or service not ready for release",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "release-risk"
  },
  {
    "kind": "release_risk",
    "label": "Release Risk: Revenue pre-sold against unproven delivery",
    "summary": "Revenue pre-sold against unproven delivery",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "release-risk"
  },
  {
    "kind": "readiness_blocker",
    "label": "Blocker: Known unresolved defects",
    "summary": "The product or service has known defects that have not been resolved. Launching with unresolved defects creates customer impact and support burden.",
    "severity": "CRITICAL",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "launch-readiness"
  },
  {
    "kind": "readiness_blocker",
    "label": "Blocker: Security or compliance concern",
    "summary": "A security or compliance concern has been raised and is unresolved. Launching before resolution creates regulatory and reputational risk.",
    "severity": "CRITICAL",
    "confidence": 0.9,
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
  },
  {
    "kind": "incentive_distortion",
    "label": "Incentive distortion: Revenue pressure vs readiness",
    "summary": "Revenue or deadline pressure is present alongside unresolved readiness issues. This creates a known decision bias — the incentive to launch may be overriding the risk assessment.",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "launch-readiness"
  },
  {
    "kind": "forbidden_action",
    "label": "Forbidden: Launch with unresolved blockers",
    "summary": "Do not launch while the following blocker(s) remain unresolved: Known unresolved defects, Unresolved security or compliance concern",
    "severity": "CRITICAL",
    "confidence": 0.9,
    "sourceStage": "kernel",
    "sourceLens": "launch-readiness"
  },
  {
    "kind": "ownership_gap",
    "label": "Ownership gap: Disputed accountability",
    "summary": "Multiple parties are attributing responsibility elsewhere. No one has accepted ownership. This is the primary failure mode — without clear ownership, no recovery action can be assigned.",
    "severity": "CRITICAL",
    "confidence": 0.9,
    "sourceStage": "kernel",
    "sourceLens": "operational-ownership"
  },
  {
    "kind": "must_not_delay",
    "label": "Must not delay: Assign clear ownership",
    "summary": "Every hour without clear ownership is compounding the operational failure. Ownership must be assigned immediately by the authority that oversees all involved parties.",
    "severity": "CRITICAL",
    "confidence": 0.9,
    "sourceStage": "kernel",
    "sourceLens": "operational-ownership"
  },
  {
    "kind": "unsupported_claim",
    "label": "Unsupported claim: Revenue or pricing position",
    "summary": "Revenue or pricing position is asserted without supporting evidence. Revenue referenced but not confirmed as generated",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "commercial-proof"
  },
  {
    "kind": "forbidden_action",
    "label": "Forbidden: Publish unsupported commercial claim",
    "summary": "Do not publish or present the following claim(s) without supporting evidence: Revenue or pricing position",
    "severity": "CRITICAL",
    "confidence": 0.9,
    "sourceStage": "kernel",
    "sourceLens": "commercial-proof"
  }
]
```

### Adversarial Challenge

```json
[
  {
    "id": "launch-vs-readiness",
    "between": [
      "release-risk-lens",
      "evidence-lens"
    ],
    "contradiction": "Pressure to launch conflicts with unresolved readiness issues",
    "severity": "CRITICAL",
    "resolutionRule": "ADVERSARIAL_CHALLENGE_PRESERVED",
    "outputEffect": "Output blocked until contradiction is resolved by human review."
  },
  {
    "id": "authority-vs-responsibility",
    "between": [
      "authority-lens",
      "obligation-lens"
    ],
    "contradiction": "Responsibility exists but authority to act is unclear or disputed",
    "severity": "HIGH",
    "resolutionRule": "ADVERSARIAL_CHALLENGE_PRESERVED",
    "outputEffect": "Output confidence downgraded. Human review recommended."
  },
  {
    "id": "revenue-vs-readiness",
    "between": [
      "constraint-reality-lens",
      "evidence-lens"
    ],
    "contradiction": "Revenue or contract pressure exists but readiness or approval has not been confirmed",
    "severity": "HIGH",
    "resolutionRule": "ADVERSARIAL_CHALLENGE_PRESERVED",
    "outputEffect": "Output confidence downgraded. Human review recommended."
  },
  {
    "id": "revenue-vs-readiness",
    "between": [
      "launch-readiness-lens",
      "constraint-reality-lens"
    ],
    "contradiction": "Revenue or deadline pressure to launch conflicts with known unresolved readiness issues. The incentive to launch early may be distorting the risk assessment.",
    "severity": "CRITICAL",
    "resolutionRule": "ADVERSARIAL_CHALLENGE_PRESERVED",
    "outputEffect": "Output blocked until contradiction is resolved by human review."
  },
  {
    "id": "ownership-vs-accountability",
    "between": [
      "operational-ownership-lens",
      "authority-lens"
    ],
    "contradiction": "Operational ownership is disputed — each party attributes responsibility elsewhere. Without clear ownership, no recovery action can be assigned and the failure will recur.",
    "severity": "CRITICAL",
    "resolutionRule": "ADVERSARIAL_CHALLENGE_PRESERVED",
    "outputEffect": "Output blocked until contradiction is resolved by human review."
  },
  {
    "id": "commercial-claim-vs-evidence-gap",
    "between": [
      "commercial-proof-lens",
      "evidence-lens"
    ],
    "contradiction": "1 of 1 commercial claim(s) lack supporting evidence and would not survive buyer, regulator, or competitor challenge",
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
      "assumption": "No clear owner for operational failure resolution — ownership is disputed between teams",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    }
  ],
  "classificationConfidence": {
    "primaryClass": "OPERATIONAL_AND_EXECUTION",
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
    "description": "Address the primary identified risk: Pressure to launch conflicts with unresolved readiness issues. This is the failure point most likely to undermine the decision.",
    "rationale": "The adversarial challenge (launch-vs-readiness) must be resolved or consciously accepted before the decision proceeds.",
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
    "action": "Launch or proceed while unresolved readiness issues exist and revenue pressure is distorting the risk assessment",
    "reason": "Revenue pressure creates a known decision bias. The incentive to proceed may be overriding legitimate readiness concerns. Separate the revenue decision from the readiness decision.",
    "severity": "CRITICAL"
  },
  {
    "action": "Proceed with operational recovery while ownership of the failure remains disputed between teams",
    "reason": "Without clear ownership, no recovery action can be assigned and the failure will recur. Ownership must be resolved before technical recovery can be effective.",
    "severity": "CRITICAL"
  },
  {
    "action": "Publish or present commercial claims without supporting evidence that would survive buyer, regulator, or competitor challenge",
    "reason": "Unsupported commercial claims create legal, regulatory, and reputational exposure. Each claim must have a documented evidence basis before publication.",
    "severity": "CRITICAL"
  },
  {
    "action": "Do not launch while the following blocker(s) remain unresolved: Known unresolved defects, Unresolved security or compliance concern",
    "reason": "Forbidden: Launch with unresolved blockers",
    "severity": "CRITICAL"
  },
  {
    "action": "Do not publish or present the following claim(s) without supporting evidence: Revenue or pricing position",
    "reason": "Forbidden: Publish unsupported commercial claim",
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
    "description": "Verify: Board approval required — decision cannot proceed without it",
    "rationale": "Critical constraints change what is feasible.",
    "urgency": "IMMEDIATE"
  }
]
```

### What Must Not Be Delayed

```json
[
  "Address the primary identified risk: Pressure to launch conflicts with unresolved readiness issues. This is the failure point most likely to undermine the decision.",
  "Identify and confirm who holds formal decision mandate.",
  "Verify: Board approval required — decision cannot proceed without it"
]
```

### Record Reference

```json
{
  "caseReference": "PROOF-PRODUCT_LAUNCH_REVENUE_PRESSURE-DOSSIER",
  "kernelVersion": "1.0.0",
  "ontologyVersion": "1.0.0",
  "generatedAt": "2026-05-31T21:58:17.106Z"
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
