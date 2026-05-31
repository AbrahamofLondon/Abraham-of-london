# Investor Pitch with Unsupported Traction

**Scenario:** `investor_pitch_unsupported_traction`
**Kernel Status:** COMPLETED
**Automatic Failures:** None

---

## 1. Raw User Situation

```
We are raising a Series A. The pitch deck claims 300% year-on-year growth. The actual growth is 40% if you exclude the founder's previous company customers that were migrated. The lead investor has asked for board references. The founder is reluctant to share them. The round closes in 6 weeks.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is a commercial or market positioning decision.

## 4. Kernel Interpretation

The system interprets this situation as a commercial or market decision where positioning, pricing, or partnership terms are at stake.

## 5. Translation Confidence

**HIGH**

## 6. Primary Decision Class

**COMMERCIAL_AND_MARKET**

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
| board | board | HIGH |
| founder | principal | HIGH |
| investor | stakeholder | HIGH |

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
| Evidence Gap: Low documentation | HIGH | 0.8 | evidence |
| Evidence Warning: Unsupported claims | MEDIUM | 0.6 | evidence |
| Market Claim: Partially supported | MEDIUM | 0.7 | market-claim |
| Diligence: Investor interest without committed revenue | MEDIUM | 0.7 | investor-diligence |
| Due diligence risk: Growth rate or trajectory | HIGH | 0.8 | investor-diligence |
| Due diligence risk: Customer or user base | HIGH | 0.8 | investor-diligence |
| Boundary: Financial promotion regulation may apply | MEDIUM | 0.8 | investor-diligence |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| 2 claim(s) in the investor narrative would not survive due diligence: Growth rate or trajectory (growth), Customer or user base (customer) | CRITICAL | ADVERSARIAL_CHALLENGE_PRESERVED |

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

**Hit:** true
**Type:** investment-promotion
**Professional brief:** Generated

## 19. Minimum Viable Path

| # | Action | Urgency |
|---|--------|---------|
| 1 | Address the primary identified risk: 2 claim(s) in the investor narrative would not survive due diligence: Growth rate or trajectory (growth), Customer or user base (customer). This is the failure point most likely to undermine the decision. | IMMEDIATE |
| 2 | Identify and confirm who holds formal decision mandate. | IMMEDIATE |
| 3 | Verify: Board approval required — decision cannot proceed without it | IMMEDIATE |

## 20. Forbidden Actions

- **Make growth or traction claims to investors without disclosing they are based on internal projections rather than verified data** (CRITICAL): Misrepresentation to investors carries both legal and regulatory risk. Projections presented as results is a known grounds for claim.

## 21. What Must Not Be Delayed

- Address the primary identified risk: 2 claim(s) in the investor narrative would not survive due diligence: Growth rate or trajectory (growth), Customer or user base (customer). This is the failure point most likely to undermine the decision.
- Identify and confirm who holds formal decision mandate.
- Verify: Board approval required — decision cannot proceed without it

## 22. Free Signal Output

### Situation Class

COMMERCIAL_AND_MARKET

### What the System Saw

The system interprets this situation as a commercial or market decision where positioning, pricing, or partnership terms are at stake.

### Primary Failure Point

Governance pressure — board-level decision with fiduciary implications

### Governing Tension

The system interprets this situation as a commercial or market decision where positioning, pricing, or partnership terms are at stake

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

Address the primary identified risk: 2 claim(s) in the investor narrative would not survive due diligence: Growth rate or trajectory (growth), Customer or user base (customer). This is the failure point most likely to undermine the decision.

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
    "kind": "market_claim",
    "label": "Market Claim: Partially supported",
    "summary": "Market claim has some supporting evidence but should be verified",
    "severity": "MEDIUM",
    "confidence": 0.7,
    "sourceStage": "kernel",
    "sourceLens": "market-claim"
  },
  {
    "kind": "diligence_warning",
    "label": "Diligence: Investor interest without committed revenue",
    "summary": "Investor interest or discussions are referenced but no committed revenue is cited. Due diligence will probe the gap between interest and commitment.",
    "severity": "MEDIUM",
    "confidence": 0.7,
    "sourceStage": "kernel",
    "sourceLens": "investor-diligence"
  },
  {
    "kind": "diligence_risk",
    "label": "Due diligence risk: Growth rate or trajectory",
    "summary": "Growth rate or trajectory would be challenged in due diligence. Growth rate cited: 300%",
    "severity": "HIGH",
    "confidence": 0.8,
    "sourceStage": "kernel",
    "sourceLens": "investor-diligence"
  },
  {
    "kind": "diligence_risk",
    "label": "Due diligence risk: Customer or user base",
    "summary": "Customer or user base would be challenged in due diligence. Customer count cited: 300",
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
    "id": "investor-claim-vs-evidence",
    "between": [
      "investor-diligence-lens",
      "evidence-lens"
    ],
    "contradiction": "2 claim(s) in the investor narrative would not survive due diligence: Growth rate or trajectory (growth), Customer or user base (customer)",
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
      "assumption": "Board approval required — decision cannot proceed without it",
      "evidenceBasis": "System-inferred from context",
      "ifWrong": "The minimum viable path may change.",
      "verificationPath": "Verify constraint with primary source."
    }
  ],
  "classificationConfidence": {
    "primaryClass": "COMMERCIAL_AND_MARKET",
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
    "description": "Address the primary identified risk: 2 claim(s) in the investor narrative would not survive due diligence: Growth rate or trajectory (growth), Customer or user base (customer). This is the failure point most likely to undermine the decision.",
    "rationale": "The adversarial challenge (investor-claim-vs-evidence) must be resolved or consciously accepted before the decision proceeds.",
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
    "description": "Verify: Board approval required — decision cannot proceed without it",
    "rationale": "Critical constraints change what is feasible.",
    "urgency": "IMMEDIATE"
  }
]
```

### What Must Not Be Delayed

```json
[
  "Address the primary identified risk: 2 claim(s) in the investor narrative would not survive due diligence: Growth rate or trajectory (growth), Customer or user base (customer). This is the failure point most likely to undermine the decision.",
  "Identify and confirm who holds formal decision mandate.",
  "Verify: Board approval required — decision cannot proceed without it"
]
```

### Record Reference

```json
{
  "caseReference": "PROOF-INVESTOR_PITCH_UNSUPPORTED_TRACTION-DOSSIER",
  "kernelVersion": "1.0.0",
  "ontologyVersion": "1.0.0",
  "generatedAt": "2026-05-31T16:19:30.519Z"
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
