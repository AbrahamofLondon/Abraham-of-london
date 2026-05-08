# Oversight Brief Red-Team Evaluation

**Date:** 2026-05-08
**Purpose:** Evaluate representative brief scenarios against the efficacy standard.

All scenarios below are synthetic test cases, clearly labelled. No fabricated client claims.

---

## Scenario 1: Thin Data Brief

**Context:** New user, single Fast Diagnostic completed, no ER/SR, no execution records, no outcome verification.

**Expected brief contents:**
- 1 active case (from diagnostic)
- No cost-of-inaction (no cost basis)
- No commitment verification (no execution records)
- No pattern recurrence (insufficient history)
- No boardroom/counsel signals
- 0-1 required actions (generic "strengthen evidence")

**Expected efficacy score:**
- Signal Density: ~15 (1 signal)
- Evidence Strength: ~20 (single case, no verification)
- Decision Specificity: ~15 (case named but thin)
- Actionability: 0-60 (may have weak action)
- Consequence Clarity: ~0 (no cost, no breaches)
- Continuity Value: 0 (first cycle)
- Executive Relevance: 0 (no boardroom/counsel)
- Suppression Safety: 100 (no suppressions needed)
- Retainer Value Proof: 0 (nothing the client would have missed)

**Total: ~17-25**

**Verdict: WEAK**

**Decision: WOULD NOT SEND.** Brief does not contain enough governed intelligence to justify delivery. The system correctly prevents institutional embarrassment.

---

## Scenario 2: Strong Individual Case Brief

**Context:** User completed ER + Strategy Room. Execution records exist. Cost-of-delay available. One commitment overdue. Pattern recurrence detected from prior diagnostic. Decision credit declining.

**Expected brief contents:**
- 1 active case with decision statement, state, primary risk
- Cost-of-inaction: £X accumulated over Y days
- Commitment verification: 1 overdue checkpoint
- Pattern recurrence: POSSIBLE_RECURRENCE (1 prior case)
- Counsel: not triggered (below threshold)
- Boardroom: qualified (cost > £5k/month)
- Decision credit: declining trend
- 2-3 required actions (resolve commitment, address recurrence, commission next cycle)

**Expected efficacy score:**
- Signal Density: ~75 (5 signals)
- Evidence Strength: ~60 (1 case, partial verification)
- Decision Specificity: ~65 (named case, specific actions)
- Actionability: 100 (3 required actions)
- Consequence Clarity: ~75 (cost + breach + risk)
- Continuity Value: ~30 (credit trend, first cycle)
- Executive Relevance: ~60 (boardroom qualified)
- Suppression Safety: 100
- Retainer Value Proof: ~75 (cost, breach, boardroom, credit)

**Total: ~71**

**Verdict: STRONG (near FORMIDABLE)**

**Decision: WOULD SEND.** Brief exposes real consequence. Client would have missed the cost accumulation, commitment breach, and boardroom threshold. Useful discomfort achieved.

---

## Scenario 3: Organisation Brief with Suppressions

**Context:** Organisation sponsor with 2 team campaigns (1 anonymous, 1 named). 8 respondents in anonymous campaign. Small-sample risk in named campaign (2 respondents). One raw response mention flagged by suppression system.

**Expected brief contents:**
- 2 active cases (team + enterprise)
- Aggregated divergence signal
- Cost-of-inaction from sponsor's ER
- Commitment: 2 due
- Suppression: raw response mention removed, small-sample domain suppressed

**Expected efficacy score:**
- Signal Density: ~60 (4 signals)
- Evidence Strength: ~50 (2 cases, partial)
- Decision Specificity: ~50 (org-level, less specific)
- Actionability: 60 (2 actions)
- Consequence Clarity: ~50
- Continuity Value: ~20 (first org cycle)
- Executive Relevance: ~40
- Suppression Safety: 0 if raw data detected → **WITHHOLD**
- Retainer Value Proof: ~50

**Without suppression issue: Total ~42, ADEQUATE**
**With suppression issue: WITHHOLD**

**Decision: WOULD WITHHOLD until operator confirms suppressions are complete.** Cannot send a brief that may contain identity-compromising data from an anonymous campaign.

---

## Summary

| Scenario | Grade | Decision |
|----------|-------|---------|
| Thin data | WEAK | Would not send |
| Strong individual | STRONG | Would send |
| Organisation with suppression | WITHHOLD → ADEQUATE after fix | Would send after operator review |
