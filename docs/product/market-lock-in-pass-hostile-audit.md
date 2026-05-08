# Market Lock-In Pass — Hostile Audit

**Date:** 2026-05-08

---

## 1. Is the £5k retainer now sellable?

**YES.** The system can compose a monthly oversight brief, score its efficacy, render a client-safe version, deliver notification via email, and provide a secure portal link. The brief surfaces cost accumulation, commitment breaches, pattern recurrence, boardroom thresholds, irreversibility, and "what you would have missed."

## 2. Can the client receive a brief without operator leakage?

**YES.** Client-safe brief suppresses raw respondent data, anonymous identities, small-sample detail, operator notes, and internal warnings. Delivery notification contains only a secure link — no brief content in email.

## 3. Does the client feel what would be lost by leaving?

**YES.** Decision Centre shows `valueAtRisk` — "If you stopped here, the following visibility would be lost." Oversight Brief shows `valueProtected` — "What this cycle surfaced that would likely have remained hidden." `ValueProtectedSummary` component is reusable across surfaces.

## 4. Is pattern recurrence visible across the journey?

**YES.** Wired into: Return Brief (line 316), Decision Centre API (line 286) + UI (line 162), Oversight Brief (composer), oversight account loader. Shows only POSSIBLE_RECURRENCE or VERIFIED_RECURRENCE.

## 5. Is cost clock visible across the journey?

**YES.** Wired into: Return Brief (line 268), Decision Centre API + UI (cost-of-inaction section with £ amount, days, basis), Oversight Brief (costOfInaction section), oversight account loader.

## 6. Are required actions case-specific?

**YES.** Oversight Brief composer generates `structuredActions` with case-specific evidence basis, action type, consequence if ignored. Each action names the case and the issue, not generic "verify commitments."

## 7. Is counsel now governed evidence?

**YES.** `counsel-review-ledger.ts` tracks: trigger reason, state (8 states from TRIGGERED to CLOSED), recommendation, whether evidence was created, outcome (ACCEPTED/REJECTED/DEFERRED). `counsel-review-workflow.ts` exists. Counsel action API exists.

## 8. Is boardroom history archived?

**YES.** `boardroom-archive.ts` tracks: qualification, dossier generation, export status, repeated triggers per case. Unresolved boardroom issues surfaced. Repeated trigger count tracked.

## 9. Is forward projection evidence-bound?

**YES.** `oversight-cycle-consequence-projection.ts` projects across 6 dimensions (cost, commitment, recurrence, option decay, irreversibility, loss). Returns unavailable when insufficient signals. Does not fabricate forecasts.

## 10. What remains ordinary?

- Admin review page is functional but not yet a polished operator bench
- Brief delivery is email-link-based, not a full portal
- Cycle comparison exists in contract but needs brief persistence for real trend tracking
- No automated scheduling — operator-triggered delivery

## 11. What still blocks £15k?

- Control Room UI for sponsors
- Operator review bench v1 (current is functional but basic)
- Brief persistence for cycle-to-cycle comparison
- Counsel review workflow with operator assignment
- Recurring delivery cadence automation

## 12. What still blocks £50k?

- Enterprise Control Room with privacy enforcement
- Portfolio-level pattern detection
- Cross-organisation memory
- Board export automation (PDF renderer)
- Role-based operator console
- Institutional memory archive

## 13. What would a hostile buyer still reject?

- "Show me a real client who received a brief" — no delivered brief history yet
- "Show me cycle-to-cycle improvement" — needs brief persistence
- "How do I know the counsel recommendation was followed?" — needs outcome tracking loop
- "Can I see this on my phone?" — no mobile-optimised brief view

---

## Verdict

```
£5k retainer:                SELLABLE — brief is deliverable, memory is felt
£15k retainer:               CLOSE — needs Control Room + review bench + persistence
£50k retainer:               NOT YET — needs enterprise infrastructure
Biggest win this pass:        Brief delivery mechanism + ValueProtectedSummary
Biggest remaining risk:       No brief persistence = no cycle comparison
Highest-leverage next fix:    Brief persistence + cycle comparison
Market lock-in status:        ACTIVE — cost clock, recurrence, and value-protected are visible
```
