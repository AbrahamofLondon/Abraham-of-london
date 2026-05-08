# Oversight Review Bench UX Standard

**Date:** 2026-05-08
**Rule:** This is an operator bench, not a dashboard.

---

## Purpose

The Review Bench is where an operator reviews, scores, approves, revises, or withholds an oversight brief before client delivery.

It is not:
- a normal admin dashboard
- analytics cards
- vanity metrics
- a generic report list
- a CRM-style task board

---

## Sections

### 1. Review Queue
- Briefs awaiting operator decision
- Sorted by urgency: WITHHELD → OPERATOR_REVIEW_REQUIRED → PREVIEW_READY
- Each entry shows: account, period, efficacy grade, signal count, action count

### 2. Brief Quality Grade
- FORMIDABLE / STRONG / ADEQUATE / WEAK / WITHHOLD
- Dimension breakdown visible on expand
- WITHHOLD reasons highlighted

### 3. Suppression Warnings
- List of suppressions applied to client-safe version
- Sensitive/raw/identity suppressions flagged CRITICAL
- Operator can review each suppression

### 4. Operator Decision Options
- APPROVE — brief is ready for client delivery
- REVISE — brief needs improvement before delivery
- WITHHOLD — brief must not be sent
- ESCALATE_TO_COUNSEL — brief contains counsel-level triggers
- ESCALATE_TO_BOARDROOM — brief warrants board-grade treatment
- WAIT_FOR_MORE_EVIDENCE — brief is too thin, delay this cycle

### 5. Client-Safe Preview
- Full rendering of what the client would receive
- All suppressions applied
- Privacy boundary enforced

### 6. Internal Brief Preview
- Full rendering including operator-only data
- Warnings visible
- Structured actions with owner roles

### 7. Required Actions
- Structured actions from the brief
- Each with: case reference, action type, evidence basis, deadline, owner, consequence if ignored
- Operator can approve, revise, or suppress individual actions

### 8. Delivery Readiness
- WITHHELD / OPERATOR_REVIEW_REQUIRED / CLIENT_SAFE_PREVIEW_READY / APPROVED_FOR_DELIVERY / NOT_DELIVERABLE
- Clear reason for current status

### 9. Next Cycle Intent
- When is the next brief expected?
- What evidence should be gathered before next cycle?
- Any recurring monitoring to schedule?

### 10. Audit Log
- All operator decisions recorded
- Brief versions tracked
- Delivery events logged

### 11. Counsel Escalation
- Counsel triggers from the brief
- Operator can escalate to counsel review

### 12. Boardroom Escalation
- Boardroom qualifications from the brief
- Operator can trigger dossier generation

### 13. Retained Enforcement History
- Prior cycles for this account
- Trend comparison where available
- Improvement/deterioration signals across cycles

---

## Implementation status

| Section | Status |
|---------|--------|
| Review Queue | NOT_BUILT — requires brief persistence first |
| Brief Quality Grade | AVAILABLE — efficacy scorer exists |
| Suppression Warnings | AVAILABLE — client-safe brief returns suppressions |
| Operator Decisions | NOT_BUILT — requires persistence + audit log |
| Client-Safe Preview | AVAILABLE — `/api/internal/oversight/client-safe-preview` |
| Internal Brief Preview | AVAILABLE — `/api/internal/oversight/brief-preview` |
| Required Actions | AVAILABLE — structured actions in brief |
| Delivery Readiness | AVAILABLE — derived in client-safe preview |
| Next Cycle Intent | NOT_BUILT |
| Audit Log | NOT_BUILT — requires brief persistence |
| Counsel Escalation | AVAILABLE — counsel trigger data in brief |
| Boardroom Escalation | AVAILABLE — boardroom data in brief |
| Enforcement History | PARTIAL — retained enforcement in brief when available |
