# Investor Pitch with Unsupported Traction

**Scenario:** `investor_pitch_unsupported_traction`
**Kernel Status:** QUALITY_FAILED
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

**LOW**

## 6. Primary Decision Class

**COMMERCIAL_AND_MARKET**

## 7. Alternative Decision Classes

- **GOVERNANCE_AND_BOARD** (HIGH): Score 10 vs primary 14

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

## 16. Adversarial Challenges

*No adversarial challenges generated*

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
**Tier:** STANDARD
**Triggers:** 2

## 26. Quality-Standard Verdict

**Status:** QUALITY_FAILED
**Quality Failures:** 2
- GENERIC_ADVICE: Output contains no specific, non-swappable insight
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
