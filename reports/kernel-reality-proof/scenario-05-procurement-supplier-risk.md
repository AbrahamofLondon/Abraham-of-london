# Procurement Supplier Risk

**Scenario:** `procurement_supplier_risk`
**Kernel Status:** QUALITY_FAILED
**Automatic Failures:** None

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

*No constraints mapped*

## 15. Evidence State

| Label | Severity | Confidence | Source |
|-------|----------|------------|--------|
| Evidence Gap: Low documentation | HIGH | 0.8 | evidence |

## 16. Adversarial Challenges

*No adversarial challenges generated*

## 17. Self-Adversarial Challenge

**Load-bearing assumptions:**
- The situation has been interpreted correctly based on the information provided (if wrong: The entire analysis may be misdirected)

**Information gaps:**
- Authority structure is unclear: Cannot determine who holds decision mandate
- Obligation structure is unclear: Cannot determine what must be performed
- Constraint landscape is unmapped: Minimum viable path may be invalid

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
| 1 | Establish who holds decision mandate before proceeding | IMMEDIATE |

## 20. Forbidden Actions

*None identified*

## 21. What Must Not Be Delayed

- Establish who holds decision mandate before proceeding

## 22. Free Signal Output

*Not generated*

## 23. Basic Brief Output

*Not generated (requires separate run)*

## 24. Full Dossier Output

*Not generated*

## 25. Human Review Trigger

**State:** not_required
**Tier:** N/A
**Triggers:** 0

## 26. Quality-Standard Verdict

**Status:** QUALITY_FAILED
**Quality Failures:** 3
- GENERIC_ADVICE: Output contains no specific, non-swappable insight
- MISSING_CONSTRAINT_GRAPH: Constraint landscape is required for paid tiers
- MISSING_ADVERSARIAL_CHALLENGE: Adversarial challenge is required for paid tiers

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
