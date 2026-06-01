# Paid Corridor Authority Map

Generated: 2026-06-01

## Purpose

This document defines the authority boundary for every paid product surface. Each corridor stage has a distinct role, distinct evidence requirements, and explicit non-overlap constraints.

## Corridor Overview

```
Team Assessment → Enterprise Assessment → Executive Reporting
                                             ↓          ↓
                                      Boardroom Mode   Strategy Room
                                                        ↓
                                               Retainer Oversight
```

Purpose Alignment is separate from this corridor. It may contribute optional, typed, auditable behavioural evidence (`avoided_decision`, `personal_pattern`, `recurrence`) through the product-line bridge, but it is not a prerequisite, not a paid corridor stage, and not a corporate diagnosis.

## Corridor Readiness Table

| Stage | Current readiness | Risk of overclaiming | Next wiring action |
|-------|-------------------|----------------------|--------------------|
| Team Assessment | ACTIVE | LOW | Keep expanding shared-reference invite mechanics while preserving aggregate-only output. |
| Enterprise Assessment | ACTIVE | LOW | Produce contradictionGraph before activating DomainInterdependency. |
| Executive Reporting | ACTIVE | LOW | Extend durable recommendation/outcome history inputs without duplicating Enterprise stress-test UI. |
| Boardroom Mode | PARTIALLY_WIRED | MEDIUM | Connect boardroom archive persistence to production boardroom sessions. |
| Strategy Room | PARTIALLY_WIRED | MEDIUM | Close checkpoint/outcome loop and feed durable memory into retained oversight. |
| Retainer Oversight | GATED | HIGH | Connect durable recommendation/outcome/recurrence cadence before describing retained oversight as active. |

## Stage 1: Team Assessment

**Role:** Detects perception divergence across team members on a single decision.

**User perception shift:** From "I think the team agrees" → "Here is exactly where the team diverges and why it matters."

**Core question:** Does this team share a common understanding of the decision, its owner, its blocker, and its consequences?

**Required evidence:** Multi-respondent answers (minimum 2), perceived decision/owner/blocker per respondent, authority/evidence/execution scales.

**Cannot claim:** Enterprise exposure analysis, domain interdependency, board-grade recommendation, single-respondent divergence.

**Current readiness:** ACTIVE. The active Team Assessment form captures respondent role, perceived decision, perceived owner, perceived blocker, authority/evidence/execution/consequence scales, and leadership avoidance signal. Submissions persist respondentData as aggregate-only journey evidence. Cross-respondent analysis is used only at two or more respondent records.

**Payment justification:** Multi-respondent intelligence that cannot be derived from a single diagnostic.

---

## Stage 2: Enterprise Assessment

**Role:** Tests organisational decision dependencies, scenarios, exposure, and board challenge readiness.

**User perception shift:** From "We have some issues" → "Here are the structural dependencies, exposure levels, and failure scenarios across your decision architecture."

**Core question:** Where do your organisational decisions depend on each other, and what breaks under pressure?

**Required evidence:** Domain scores, dependency map, scenario stress responses (3 minimum), financial/client/regulatory exposure, board challenge readiness.

**Cannot claim:** Final board recommendation, governed execution, adversarial scrutiny, retained oversight.

**Current readiness:** ACTIVE. The result surface now distinguishes enterprise stress summary, dependency map, scenario stress findings, exposure map, board challenge readiness, first failure point, enterprise consequence state, escalation path, and the Executive Reporting boundary. DomainInterdependency remains GATED because contradictionGraph is not produced.

**Payment justification:** Organisational-level intelligence across domains, scenarios, and exposure.

---

## Stage 3: Executive Reporting

**Role:** Converts accumulated intelligence into board-grade decision material with constitutional guidance.

**User perception shift:** From "We have analysis" → "Here is a board-ready brief with constitutional guidance, governed memory, and degradation projections."

**Core question:** What should the board know, what evidence supports it, and what is the governed recommendation?

**Required evidence:** Prior case state, constitutional assessment, governed memory items, evidence tier at multi_source+.

**Cannot claim:** Enterprise stress-test execution, governed execution, adversarial scrutiny, retained oversight.

**Current readiness:** ACTIVE. The production Executive Reporting run calls the public DTO, which builds a board-grade judgement block from carried-forward ladder/evidence-graph evidence and current intake. Boardroom dossier content remains gated by Boardroom qualification.

**Payment justification:** Board-grade intelligence synthesis requiring multi-stage evidence accumulation.

---

## Stage 4: Boardroom Mode

**Role:** Adversarial scrutiny of decision quality — objections, trade-offs, decision paths under pressure.

**User perception shift:** From "We have a recommendation" → "We have tested this recommendation against the hardest objections and it holds/fails."

**Core question:** If challenged by the most hostile stakeholder, does this recommendation survive?

**Required evidence:** Executive report, constitutional assessment, adversarial challenge vectors, evidence tier at multi_source+.

**Cannot claim:** Governed execution (Strategy Room), checkpoint management (Strategy Room), retained oversight (Retainer).

**Current readiness:** PARTIALLY_WIRED. Adversarial challenge capability exists; durable boardroom archive/session history is not fully established.

**Payment justification:** Adversarial quality assurance that cannot be safely self-administered.

---

## Stage 5: Strategy Room

**Role:** Governed decision execution — intervention stacks, checkpoints, owner pressure, outcome accountability.

**User perception shift:** From "We know what to do" → "We are executing under governed conditions with checkpoints, accountability, and course correction."

**Core question:** Is this decision being executed with structural accountability, and what happens if it drifts?

**Required evidence:** Prior case state with constitutional assessment, recommendation outcome ledger, evidence tier at multi_source+, governed memory, intervention stack.

**Cannot claim:** Retained oversight without memory threshold, enterprise structural analysis, board-grade material.

**Current readiness:** PARTIALLY_WIRED. Checkpoint/outcome assets exist, but durable memory threshold for Retainer Oversight is not yet complete.

**Payment justification:** Governed execution management with structural accountability that prevents informal drift.

---

## Stage 6: Retainer Oversight

**Role:** Institutional intelligence — recurrence detection, drift monitoring, outcome learning, oversight cadence.

**User perception shift:** From "We handled that decision" → "We now have institutional memory that prevents the same failure pattern from recurring."

**Core question:** Is this organisation learning from its decisions, or is it repeating the same structural failures?

**Required evidence:** Durable recommendation outcome ledger with OUTCOME_REPORTED entries, multiple resolved cases, governed memory across cycles, behavioral trend data.

**Cannot claim:** New diagnostic analysis, new assessments, execution management, board-grade material.

**Current readiness:** GATED. Requires durable recommendation/outcome memory, recurrence, drift, and oversight cadence.

**Payment justification:** Institutional intelligence that compounds over time — requires durable memory, outcome verification, and pattern learning.

---

## Corridor Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| DomainInterdependency not activated | Enterprise has domain scores and dependency/exposure summaries, but the DomainInterdependency engine still requires contradictionGraph | HIGH |
| ContradictionForcing not invoked | Answer-pattern contradictions not detected | HIGH |
| Retainer/Oversight memory threshold incomplete | Retainer corridor must not claim institutional learning until durable recommendation/outcome/recurrence cadence is connected | CRITICAL |
| Boardroom archive not persisted | Boardroom Mode has no history | MEDIUM |
| Durable recommendation history partial | Executive Reporting supports recommendation ledger input, but durable outcome history is not yet consistently present for every run | MEDIUM |
| Behavioral trend engine partially wired | Oversight lacks behavioral analysis | MEDIUM |

## Remaining Risks

1. **Retainer Oversight remains gated.** Oversight assets exist, but durable recommendation/outcome/recurrence cadence is not yet the production path.
2. **DomainInterdependency remains gated.** Enterprise now surfaces dependency/exposure/stress architecture, but the dedicated interdependency engine still requires contradictionGraph before activation.
3. **Boardroom Mode has no durable archive.** Sessions exist in memory but history is not persisted.
4. **Executive Reporting durable history remains partial.** The production result carries evidence forward into board-grade judgement, but retained recurrence and institutional memory claims still require durable outcome history.
5. **Strategy Room outcome tracking is new.** RecommendationOutcomeLedger was recently created but outcome verification loop is not yet closed.
