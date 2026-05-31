# Cash-Constrained Survival

**Scenario:** `cash_constrained_survival`
**Kernel Status:** QUALITY_FAILED
**Automatic Failures:** None

---

## 1. Raw User Situation

```
We have 6 weeks of cash runway. We have cut all non-essential costs. We are in late-stage discussions with two investors but neither has committed. A major customer has delayed payment by 60 days. The CEO is considering using personal credit cards to meet payroll. The company has no debt facility.
```

## 2. Vocabulary State

**2** — Structure without diagnosis

## 3. Situation Summary

This is a financial or capital commitment decision. Financial constraint present.

## 4. Kernel Interpretation

The system interprets this situation as a financial or capital decision where cash, funding, or balance sheet capacity constrains the feasible set. Dimensions surfaced: constraint.

## 5. Translation Confidence

**HIGH**

## 6. Primary Decision Class

**FINANCIAL_AND_CAPITAL**

## 7. Alternative Decision Classes

- **GOVERNANCE_AND_BOARD** (LOW): Authority ambiguity suggests governance dimension
- **OPERATIONAL_AND_EXECUTION** (LOW): Timing pressure suggests operational execution dimension

## 8. Surfaced Dimensions

- financial

## 9. Preserved Ambiguities

- authority_structure
- timing_pressure

## 10. Clarification Questions

*None required*

## 11. Actor Map

| Actor | Role | Confidence |
|-------|------|------------|
| ceo | executive | HIGH |

## 12. Authority State

*No authority mapped*

## 13. Obligation State

*No obligations mapped*

## 14. Constraint Graph

| Description | Type | Severity | Binding |
|-------------|------|----------|---------|
| Cash position constrains available options | cash | HIGH | No |

## 15. Evidence State

| Label | Severity | Confidence | Source |
|-------|----------|------------|--------|
| Constraint: Cash position constrains available options | HIGH | 0.8 | constraint-reality |
| Failure Mode: Liquidity concern — cash position may constrain options | HIGH | 0.7 | failure-mode |
| Evidence Gap: Low documentation | HIGH | 0.8 | evidence |
| Contradiction: Cash runway is critically short but required funding has not | CRITICAL | 0.8 | adversarial |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Cash runway is critically short but required funding has not been secured or is delayed | CRITICAL | ADVERSARIAL_CHALLENGE_PRESERVED |

## 17. Self-Adversarial Challenge

**Load-bearing assumptions:**
- Cash position constrains available options (if wrong: The minimum viable path may change.)

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
**Type:** investment-advice
**Professional brief:** Generated

## 19. Minimum Viable Path

| # | Action | Urgency |
|---|--------|---------|
| 1 | Establish who holds decision mandate before proceeding | IMMEDIATE |
| 2 | Verify: Cash position constrains available options | IMMEDIATE |

## 20. Forbidden Actions

*None identified*

## 21. What Must Not Be Delayed

- Establish who holds decision mandate before proceeding
- Verify: Cash position constrains available options

## 22. Free Signal Output

*Not generated*

## 23. Basic Brief Output

*Not generated (requires separate run)*

## 24. Full Dossier Output

*Not generated*

## 25. Human Review Trigger

**State:** pending
**Tier:** STANDARD
**Triggers:** 3

## 26. Quality-Standard Verdict

**Status:** QUALITY_FAILED
**Quality Failures:** 1
- GENERIC_ADVICE: Output contains no specific, non-swappable insight

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
