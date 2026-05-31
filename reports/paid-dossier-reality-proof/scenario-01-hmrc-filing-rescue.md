# HMRC/Company Accounts Filing Rescue with No Funds

**Scenario:** `hmrc_filing_rescue`
**Embarrassment Risk:** LOW

---

## 1. Raw User Situation

```
We have a company accounts filing due at Companies House in 14 days. The accountant has resigned. The director is unwell. There are no funds to pay for an emergency filing. The company is solvent but cash-poor. If we miss the filing, the company will be struck off. The director's other directorates may also be affected.
```

## 2. Free Signal

**Tier:** free_signal
**Sections:** situation_class, what_the_system_saw, primary_failure_point, governing_tension, consequence_class, what_full_analysis_maps, direction_of_minimum_viable_move
**Generic output:** false

## 3. Full Dossier

**Status:** Generated
**Tier:** full_dossier
**Sections:** authority_map, obligation_map, constraint_graph, evidence_graph, adversarial_challenge, self_adversarial_challenge, minimum_viable_path, forbidden_actions, fallback_path, what_must_not_be_delayed, record_reference, regulated_boundary
**Generic output:** false

## 4. Human Review State

**State:** pending
**Tier:** STANDARD

## 5. Regulated Boundary

**Hit:** true
**Type:** audit-opinion
**Professional brief:** Generated

## 6. Self-Adversarial Challenge

**Present:** Yes

## 7. Forbidden Actions

**Count:** 2

## 8. Minimum Viable Path

**Steps:** 2

## 9. What Must Not Be Delayed

- Address: Statutory filing obligation (deadline: 14 days). Separate what is required from Companies House, HMRC, and any other authority — these are distinct obligations with distinct deadlines.
- Contact HMRC Business Payment Support (0300 200 3835) and explore fixed-scope accountant review. Free options: ICAEW Find a Firm, Citizens Advice Business, Business Debtline. A targeted review costs less than a penalty.

## 10. Evidence Graph

**Nodes:** 12

## 11. Authority & Obligation

**Authority entries:** 0
**Obligation entries:** 1

## 12. Constraints

**Constraints:** 3

## 13. Adversarial Challenges

**Challenges:** 2

## 14. Quality Failures

*None*

## 15. Embarrassment Risk

**Risk:** LOW
**Notes:** None
