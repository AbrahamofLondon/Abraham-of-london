# Product Launch Under Revenue Pressure

**Scenario:** `product_launch_revenue_pressure`
**Kernel Status:** COMPLETED
**Automatic Failures:** None

---

## 1. Raw User Situation

```
We need to launch this product in Q2 or we miss our revenue target. The engineering team says it is not ready — there are three known critical bugs and the security review is incomplete. Sales has already pre-sold £500k based on the Q2 launch date. The board does not know about the security issue.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is a board-level governance decision.

## 4. Kernel Interpretation

The system interprets this situation as a governance or board-level decision requiring proper process, documentation, and fiduciary consideration. Dimensions surfaced: consequence, authority.

## 5. Translation Confidence

**LOW**

## 6. Primary Decision Class

**GOVERNANCE_AND_BOARD**

## 7. Alternative Decision Classes

- **OPERATIONAL_AND_EXECUTION** (HIGH): Score 10 vs primary 10

## 8. Surfaced Dimensions

- consequence
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
| board | board | HIGH |

## 12. Authority State

| Holder | Scope | Limitation |
|--------|-------|------------|
| Board of Directors | Strategic and governance decisions | None |

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
| Obligation: Fiduciary duty to board and shareholders | MEDIUM | 0.7 | obligation |
| Evidence Gap: Low documentation | HIGH | 0.8 | evidence |
| Contradiction: Pressure to launch conflicts with unresolved readiness issue | CRITICAL | 0.8 | adversarial |
| Contradiction: Responsibility exists but authority to act is unclear or dis | HIGH | 0.8 | adversarial |
| Contradiction: Revenue or contract pressure exists but readiness or approva | HIGH | 0.8 | adversarial |
| Failure Mode: Governance pressure — board-level decision with fiduciary implications | HIGH | 0.7 | failure-mode |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Pressure to launch conflicts with unresolved readiness issues | CRITICAL | ADVERSARIAL_CHALLENGE_PRESERVED |
| Responsibility exists but authority to act is unclear or disputed | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |
| Revenue or contract pressure exists but readiness or approval has not been confirmed | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |

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

The system interprets this situation as a governance or board-level decision requiring proper process, documentation, and fiduciary consideration. Dimensions surfaced: consequence, authority.

### Primary Failure Point

Situation relies primarily on user-reported information without independent documentation

### Governing Tension

The system interprets this situation as a governance or board-level decision requiring proper process, documentation, and fiduciary consideration

### Consequence Class

CRITICAL

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
