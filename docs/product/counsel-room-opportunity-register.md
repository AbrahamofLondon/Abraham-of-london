# Counsel Room Opportunity Register

> Date: 2026-05-09
> Purpose: Identify every opportunity to make Counsel Room a proprietary escalation system.

---

## Opportunities

### P0.1 — Counsel Case Timeline
- **Current state:** Status record only (ASSIGNED / REVIEWING / RESPONSE_RECORDED)
- **Why it matters:** Without a timeline, counsel review is a one-shot event, not a governed process
- **Files:** pages/admin/counsel-review.tsx, lib/product/counsel-case-service.ts
- **User-visible:** Operator sees timeline of counsel interactions
- **Memory effect:** Counsel history becomes traceable evidence
- **Moat effect:** HIGH — competitors cannot replicate governed counsel timeline
- **Implementation:** Medium — requires timeline data model or audit event chain
- **Priority:** P1

### P0.2 — Counsel Evidence Package
- **Current state:** Free-text evidence basis field
- **Why it matters:** Counsel needs structured evidence, not prose
- **Files:** pages/admin/counsel-review.tsx, lib/product/oversight-signal-builder.ts
- **User-visible:** Operator sees structured evidence attached to case
- **Memory effect:** Evidence nodes created from counsel input
- **Moat effect:** HIGH — evidence-backed counsel is rare
- **Implementation:** Medium — extend counsel submit to create evidence nodes
- **Priority:** P1

### P0.3 — Counsel Decision Question
- **Current state:** "What must counsel review?" textarea
- **Why it matters:** Counsel must know what the SYSTEM cannot decide, not just "please advise"
- **Files:** pages/admin/counsel-review.tsx
- **User-visible:** Operator sees structured question
- **Memory effect:** Decision question becomes part of case memory
- **Moat effect:** MEDIUM — forces specificity
- **Implementation:** Low — copy/framing change
- **Priority:** P0 (already partially done)

### P0.4 — Counsel Outcome Memory
- **Current state:** Counsel response stored, not consumed by downstream surfaces
- **Why it matters:** If counsel reviews a case and nothing changes downstream, counsel is theatre
- **Files:** lib/product/oversight-brief-composer.ts, lib/server/strategy-room/return-brief.server.ts
- **User-visible:** Return Brief shows "Counsel reviewed this case and recommended..."
- **Memory effect:** Counsel conclusion enters decision memory
- **Moat effect:** VERY HIGH — counsel memory feeding governance is institutional
- **Implementation:** Medium — wire counsel history into return brief and oversight brief
- **Priority:** P1

### P0.5 — Counsel Refusal Standard
- **Current state:** No refusal logic — counsel can review anything
- **Why it matters:** If counsel never refuses, the escalation has no teeth
- **Files:** New — counsel qualification logic
- **User-visible:** "Counsel cannot review this case because evidence is insufficient"
- **Memory effect:** Refusal itself becomes evidence
- **Moat effect:** HIGH — institutional refusal is premium
- **Implementation:** Medium
- **Priority:** P2

### P0.6 — Counsel-to-Return-Brief Handoff
- **Current state:** Counsel review exists, Return Brief does not reference it
- **Why it matters:** The user should see that counsel reviewed their case
- **Files:** lib/server/strategy-room/return-brief.server.ts
- **User-visible:** "Counsel reviewed this case and found..."
- **Memory effect:** Counsel conclusion persists into return confrontation
- **Moat effect:** VERY HIGH
- **Implementation:** Medium — load counsel history for session/case
- **Priority:** P1

### P0.7 — Counsel Archive
- **Current state:** Counsel reviews stored in workflow records
- **Why it matters:** Historical counsel decisions should be searchable and referenceable
- **Files:** New admin surface or extension of oversight archive
- **User-visible:** Operator can review prior counsel decisions
- **Memory effect:** Institutional learning from counsel patterns
- **Moat effect:** HIGH
- **Implementation:** Medium
- **Priority:** P2

---

## Key Question

**What changes after counsel reviews a case?**

Current answer: Operator updates status. That's it.

Required answer:
1. Evidence nodes created from counsel findings
2. Return Brief references counsel conclusion
3. Oversight Brief includes counsel signal
4. Decision Centre shows counsel status
5. Future routing considers counsel history
6. Retainer review references prior counsel
7. The system remembers what counsel decided and whether the client acted on it

---

## Summary

| Priority | Count | Examples |
|----------|-------|---------|
| P0 | 1 | Counsel decision question (already partially done) |
| P1 | 4 | Timeline, evidence package, outcome memory, Return Brief handoff |
| P2 | 2 | Refusal standard, archive |
| Total | 7 | |
