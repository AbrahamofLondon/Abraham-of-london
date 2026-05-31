# Executive Reputational Exposure

**Scenario:** `executive_reputational_exposure`
**Kernel Status:** QUALITY_FAILED
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

**LOW**

## 6. Primary Decision Class

**REPUTATIONAL_AND_EXPOSURE**

## 7. Alternative Decision Classes

- **GOVERNANCE_AND_BOARD** (HIGH): Score 10 vs primary 13

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
| Failure Mode: Legal exposure — potential liability or dispute | HIGH | 0.7 | failure-mode |
| Evidence Gap: Low documentation | HIGH | 0.8 | evidence |
| Evidence Warning: Unsupported claims | MEDIUM | 0.6 | evidence |
| Contradiction: Reputational threat is active but no reviewed, legally-clear | HIGH | 0.8 | adversarial |
| Contradiction: PR team and legal team have conflicting recommendations — re | HIGH | 0.8 | adversarial |
| Constraint: Board approval required — decision cannot proceed without it | HIGH | 0.8 | constraint-reality |
| Legal advice boundary | HIGH | 0.9 | regulated-boundary |

## 16. Adversarial Challenges

| Contradiction | Severity | Resolution |
|---------------|----------|------------|
| Reputational threat is active but no reviewed, legally-cleared response plan exists | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |
| PR team and legal team have conflicting recommendations — response strategy is unresolved | HIGH | ADVERSARIAL_CHALLENGE_PRESERVED |

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

**Hit:** false
**Type:** N/A
**Professional brief:** Not generated

## 19. Minimum Viable Path

| # | Action | Urgency |
|---|--------|---------|
| 1 | Establish who holds decision mandate before proceeding | IMMEDIATE |
| 2 | Verify: Board approval required — decision cannot proceed without it | IMMEDIATE |

## 20. Forbidden Actions

*None identified*

## 21. What Must Not Be Delayed

- Establish who holds decision mandate before proceeding
- Verify: Board approval required — decision cannot proceed without it

## 22. Free Signal Output

*Not generated*

## 23. Basic Brief Output

*Not generated (requires separate run)*

## 24. Full Dossier Output

*Not generated*

## 25. Human Review Trigger

**State:** pending
**Tier:** URGENT
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
