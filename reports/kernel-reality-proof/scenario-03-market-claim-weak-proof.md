# Market Claim with Strong Copy but Weak Proof

**Scenario:** `market_claim_strong_copy_weak_proof`
**Kernel Status:** COMPLETED
**Automatic Failures:** None

---

## 1. Raw User Situation

```
We are launching a new product and the marketing team has prepared claims about market leadership and customer adoption. The actual customer data shows only 12 beta users, none of whom have completed the onboarding. The CEO wants to launch with the strong claims anyway. The product is not generating revenue yet.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is a board-level governance decision.

## 4. Kernel Interpretation

The system interprets this situation as a governance or board-level decision requiring proper process, documentation, and fiduciary consideration. Dimensions surfaced: authority, evidence.

## 5. Translation Confidence

**LOW**

## 6. Primary Decision Class

**GOVERNANCE_AND_BOARD**

## 7. Alternative Decision Classes

- **OPERATIONAL_AND_EXECUTION** (HIGH): Score 10 vs primary 10
- **COMMERCIAL_AND_MARKET** (LOW): Score 4 vs primary 10

## 8. Surfaced Dimensions

- authority
- evidence

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

## 12. Authority State

| Holder | Scope | Limitation |
|--------|-------|------------|
| Board of Directors | Strategic and governance decisions | None |
| Chief Executive Officer | Executive operational decisions | May require board ratification for major decisions |

## 13. Obligation State

| Description | Type | Deadline | Consequence |
|-------------|------|----------|-------------|
| Fiduciary duty to board and shareholders | fiduciary | Unknown | Director liability |

## 14. Constraint Graph

*No constraints mapped*

## 15. Evidence State

| Label | Severity | Confidence | Source |
|-------|----------|------------|--------|
| Authority: Board of Directors | MEDIUM | 0.6 | authority |
| Authority: Chief Executive Officer | MEDIUM | 0.6 | authority |
| Obligation: Fiduciary duty to board and shareholders | MEDIUM | 0.7 | obligation |
| Evidence Warning: Unsupported claims | MEDIUM | 0.6 | evidence |
| Contradiction: Claim is being made but evidence to support it is absent or  | HIGH | 0.8 | adversarial |
| Failure Mode: Governance pressure — board-level decision with fiduciary implications | HIGH | 0.7 | failure-mode |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Claim is being made but evidence to support it is absent or weak | HIGH | EVIDENCE_OVERRIDES_INFERENCE |

## 17. Self-Adversarial Challenge

**Load-bearing assumptions:**
- Authority is held by Board of Directors (if wrong: The decision may not be valid, or escalation may be misdirected.)

**Information gaps:**
- Constraint landscape is unmapped: Minimum viable path may be invalid

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
| 1 | Map available options against constraints and obligations | HIGH |

## 20. Forbidden Actions

*None identified*

## 21. What Must Not Be Delayed

*None identified*

## 22. Free Signal Output

### Situation Class

GOVERNANCE_AND_BOARD

### What the System Saw

The system interprets this situation as a governance or board-level decision requiring proper process, documentation, and fiduciary consideration. Dimensions surfaced: authority, evidence.

### Primary Failure Point

Claim is being made but evidence to support it is absent or weak

### Governing Tension

The system interprets this situation as a governance or board-level decision requiring proper process, documentation, and fiduciary consideration

### Consequence Class

HIGH

### What the Full Analysis Maps

```json
[
  "Authority structure",
  "Obligation landscape",
  "Evidence graph",
  "Adversarial challenge"
]
```

### Direction of Minimum Viable Move

Map available options against constraints and obligations

## 23. Basic Brief Output

*Not generated (requires separate run)*

## 24. Full Dossier Output

*Not generated*

## 25. Human Review Trigger

**State:** pending
**Tier:** STANDARD
**Triggers:** 4

## 26. Quality-Standard Verdict

**Status:** COMPLETED
**Quality Failures:** 1
- MISSING_CONSTRAINT_GRAPH: Constraint landscape is required for paid tiers

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
