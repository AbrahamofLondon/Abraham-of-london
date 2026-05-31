# Procurement Supplier Risk

**Scenario:** `procurement_supplier_risk`
**Embarrassment Risk:** LOW

---

## 1. Raw User Situation

```
Our sole supplier for a critical component has issued a force majeure notice. They cannot guarantee delivery for 12 weeks. We have 4 weeks of inventory. Our customers have firm orders. Switching supplier requires 8 weeks of qualification. The CFO says we cannot absorb the penalty for late delivery.
```

## 2. Free Signal

**Tier:** free_signal
**Sections:** situation_class, what_the_system_saw, primary_failure_point, governing_tension, consequence_class, what_full_analysis_maps, direction_of_minimum_viable_move
**Generic output:** false

## 3. Full Dossier

**Status:** Generated
**Tier:** full_dossier
**Sections:** authority_map, obligation_map, constraint_graph, evidence_graph, adversarial_challenge, self_adversarial_challenge, minimum_viable_path, forbidden_actions, fallback_path, what_must_not_be_delayed, record_reference
**Generic output:** true

## 4. Human Review State

**State:** pending
**Tier:** STANDARD

## 5. Regulated Boundary

**Hit:** false
**Type:** N/A
**Professional brief:** Not generated

## 6. Self-Adversarial Challenge

**Present:** Yes

## 7. Forbidden Actions

**Count:** 2

## 8. Minimum Viable Path

**Steps:** 3

## 9. What Must Not Be Delayed

- Address the primary identified risk: Supply interruption creates inability to meet customer obligations, with penalty exposure. This is the failure point most likely to undermine the decision.
- Identify and confirm who holds formal decision mandate.
- Verify: Sole supplier dependency — no alternative source for critical component or service

## 10. Evidence Graph

**Nodes:** 5

## 11. Authority & Obligation

**Authority entries:** 0
**Obligation entries:** 0

## 12. Constraints

**Constraints:** 3

## 13. Adversarial Challenges

**Challenges:** 1

## 14. Quality Failures

*None*

## 15. Embarrassment Risk

**Risk:** LOW
**Notes:** None
