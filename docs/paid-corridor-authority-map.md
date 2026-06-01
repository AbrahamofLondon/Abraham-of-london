# Paid Corridor Authority Map

Generated: 2026-06-01

## Purpose

This document defines the authority boundary for every paid product surface. Each corridor stage has a distinct role, distinct evidence requirements, and explicit non-overlap constraints.

## Corridor Overview

```
Free Signal → Fast Diagnostic → Purpose Alignment → Constitutional
                                                         ↓
                               Team Assessment → Enterprise Assessment
                                                         ↓
                                              Executive Reporting
                                                    ↓         ↓
                                           Boardroom Mode   Strategy Room
                                                              ↓
                                                    Retainer Oversight
```

## Stage 1: Team Assessment

**Role:** Detects perception divergence across team members on a single decision.

**User perception shift:** From "I think the team agrees" → "Here is exactly where the team diverges and why it matters."

**Core question:** Does this team share a common understanding of the decision, its owner, its blocker, and its consequences?

**Required evidence:** Multi-respondent answers (minimum 2), perceived decision/owner/blocker per respondent, authority/evidence/execution scales.

**Cannot claim:** Enterprise exposure analysis, domain interdependency, board-grade recommendation, single-respondent divergence.

**Payment justification:** Multi-respondent intelligence that cannot be derived from a single diagnostic.

---

## Stage 2: Enterprise Assessment

**Role:** Tests organisational decision dependencies, scenarios, exposure, and board challenge readiness.

**User perception shift:** From "We have some issues" → "Here are the structural dependencies, exposure levels, and failure scenarios across your decision architecture."

**Core question:** Where do your organisational decisions depend on each other, and what breaks under pressure?

**Required evidence:** Domain scores, dependency map, scenario stress responses (3 minimum), financial/client/regulatory exposure, board challenge readiness.

**Cannot claim:** Final board recommendation, governed execution, adversarial scrutiny, retained oversight.

**Payment justification:** Organisational-level intelligence across domains, scenarios, and exposure.

---

## Stage 3: Executive Reporting

**Role:** Converts accumulated intelligence into board-grade decision material with constitutional guidance.

**User perception shift:** From "We have analysis" → "Here is a board-ready brief with constitutional guidance, governed memory, and degradation projections."

**Core question:** What should the board know, what evidence supports it, and what is the governed recommendation?

**Required evidence:** Prior case state, constitutional assessment, governed memory items, evidence tier at multi_source+.

**Cannot claim:** Enterprise stress-test execution, governed execution, adversarial scrutiny, retained oversight.

**Payment justification:** Board-grade intelligence synthesis requiring multi-stage evidence accumulation.

---

## Stage 4: Boardroom Mode

**Role:** Adversarial scrutiny of decision quality — objections, trade-offs, decision paths under pressure.

**User perception shift:** From "We have a recommendation" → "We have tested this recommendation against the hardest objections and it holds/fails."

**Core question:** If challenged by the most hostile stakeholder, does this recommendation survive?

**Required evidence:** Executive report, constitutional assessment, adversarial challenge vectors, evidence tier at multi_source+.

**Cannot claim:** Governed execution (Strategy Room), checkpoint management (Strategy Room), retained oversight (Retainer).

**Payment justification:** Adversarial quality assurance that cannot be safely self-administered.

---

## Stage 5: Strategy Room

**Role:** Governed decision execution — intervention stacks, checkpoints, owner pressure, outcome accountability.

**User perception shift:** From "We know what to do" → "We are executing under governed conditions with checkpoints, accountability, and course correction."

**Core question:** Is this decision being executed with structural accountability, and what happens if it drifts?

**Required evidence:** Prior case state with constitutional assessment, recommendation outcome ledger, evidence tier at multi_source+, governed memory, intervention stack.

**Cannot claim:** Retained oversight without memory threshold, enterprise structural analysis, board-grade material.

**Payment justification:** Governed execution management with structural accountability that prevents informal drift.

---

## Stage 6: Retainer Oversight

**Role:** Institutional intelligence — recurrence detection, drift monitoring, outcome learning, oversight cadence.

**User perception shift:** From "We handled that decision" → "We now have institutional memory that prevents the same failure pattern from recurring."

**Core question:** Is this organisation learning from its decisions, or is it repeating the same structural failures?

**Required evidence:** Durable recommendation outcome ledger with OUTCOME_REPORTED entries, multiple resolved cases, governed memory across cycles, behavioral trend data.

**Cannot claim:** New diagnostic analysis, new assessments, execution management, board-grade material.

**Payment justification:** Institutional intelligence that compounds over time — requires durable memory, outcome verification, and pattern learning.

---

## Corridor Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| ScenarioStressTest not invoked | Enterprise scenarios analysed but not by orchestrator | HIGH |
| ContradictionForcing not invoked | Answer-pattern contradictions not detected | HIGH |
| Oversight subsystem dormant (20+ files) | Retainer corridor is aspirational | CRITICAL |
| Boardroom archive not persisted | Boardroom Mode has no history | MEDIUM |
| Evidence carry-forward not wired | Executive reports lack evidence lineage | HIGH |
| Behavioral trend engine partially wired | Oversight lacks behavioral analysis | MEDIUM |

## Remaining Risks

1. **Retainer Oversight is aspirational.** 20+ oversight files exist with 0 imports. Until wired, this corridor stage cannot deliver institutional intelligence.
2. **Enterprise Assessment ScenarioStressTest gap.** Scenarios are captured but not analysed by the engine — the orchestrator never calls `analyseScenarioResponse()`.
3. **Boardroom Mode has no durable archive.** Sessions exist in memory but history is not persisted.
4. **Executive Reporting evidence carry-forward is dormant.** `buildExecutiveEvidenceCarryForward()` exists but is never called.
5. **Strategy Room outcome tracking is new.** RecommendationOutcomeLedger was recently created but outcome verification loop is not yet closed.
