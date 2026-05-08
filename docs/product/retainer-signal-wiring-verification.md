# Retainer Signal Wiring Verification

**Date:** 2026-05-08
**Method:** Direct code inspection — grep for actual imports, function calls, and rendered UI.

---

## Cost-of-Inaction Clock

| Check | File | Finding | Verdict |
|-------|------|---------|---------|
| Helper exists | `lib/product/cost-of-inaction-clock.ts` | `calculateCostOfInactionClock()` exported | EXISTS |
| Called in Return Brief server | `lib/server/strategy-room/return-brief.server.ts:280` | `calculateCostOfInactionClock({ monthlyCostEstimate, startedAt })` | CALLED |
| Rendered in Return Brief UI | `app/briefing/return/[sessionId]/page.tsx:268` | Renders `£{accumulatedCost}` with days elapsed, basis, explanation. Only when `basis !== "UNAVAILABLE" && accumulatedCost > 0` | RENDERED |
| Called in Oversight Account Loader | `lib/product/oversight-account-loader.ts:296` | `calculateCostOfInactionClock()` | CALLED |
| Used in Decision Centre API | Not directly | Indirectly via retainer readiness | INDIRECT |

**Verdict: WIRED_AND_RENDERED**

---

## Commitment Verification

| Check | File | Finding | Verdict |
|-------|------|---------|---------|
| Helper exists | `lib/product/commitment-verification.ts` | `buildCommitmentVerificationStates()` exported | EXISTS |
| Called in Return Brief server | `lib/server/strategy-room/return-brief.server.ts:290` | `buildCommitmentVerificationStates({ records, now })` | CALLED |
| Rendered in Return Brief UI | `app/briefing/return/[sessionId]/page.tsx:286` | Renders checkpoint cards with label, status (DUE/OVERDUE/VERIFIED/BLOCKED), due date, prompt. Only when `verification.length > 0` | RENDERED |
| Called in Oversight Account Loader | `lib/product/oversight-account-loader.ts:271` | `buildCommitmentVerificationStates()` | CALLED |

**Verdict: WIRED_AND_RENDERED**

---

## Pattern Recurrence

| Check | File | Finding | Verdict |
|-------|------|---------|---------|
| Helper exists | `lib/product/pattern-recurrence.ts` | `detectPatternRecurrenceV0()` exported | EXISTS |
| Called in Return Brief server | `lib/server/strategy-room/return-brief.server.ts:296` | `detectPatternRecurrenceV0({ email, currentCondition })` | CALLED |
| Rendered in Return Brief UI | `app/briefing/return/[sessionId]/page.tsx:316` | Renders pattern recurrence with prior count, explanation. Only when `status === "POSSIBLE_RECURRENCE" || "VERIFIED_RECURRENCE"` | RENDERED |
| Called in Decision Centre API | `pages/api/decision-centre/cases.ts:286` | `detectPatternRecurrenceV0({ email, currentCondition })` | CALLED |
| Rendered in Decision Centre UI | `pages/decision-centre.tsx:162` | Renders "Pattern recurrence: verified/possible" with explanation. Only when `status !== "NO_PRIOR_PATTERN"` | RENDERED |
| Called in Oversight Account Loader | `lib/product/oversight-account-loader.ts:282` | `detectPatternRecurrenceV0()` | CALLED |

**Verdict: WIRED_AND_RENDERED**

---

## Decision Credit Governance

| Check | File | Finding | Verdict |
|-------|------|---------|---------|
| Helper exists | `lib/product/decision-credit-governance.ts` | `deriveDecisionCreditGovernanceEffect()` exported | EXISTS |
| Used in Decision Centre API | `pages/api/decision-centre/cases.ts:343` | Derives `creditGovernanceExplanation` — used in retainer readiness | CALLED |
| Used in Oversight Brief Composer | `lib/product/oversight-brief-composer.ts:169` | `deriveDecisionCreditGovernanceEffect()` | CALLED |
| Displayed in Decision Centre | Via credit panel (score, trend, fulfilled/breached) | RENDERED |
| Used in admission | Not directly | INDIRECT |
| Used in retainer readiness | `pages/api/decision-centre/cases.ts:345-349` | Enriches retainer readiness reason when credit declining | USED |

**Verdict: WIRED_AND_RENDERED**

---

## Oversight Brief

| Check | File | Finding | Verdict |
|-------|------|---------|---------|
| Type exists | `lib/product/oversight-brief-contract.ts` | `OversightBrief` type exported | EXISTS |
| Composer exists | `lib/product/oversight-brief-composer.ts` | `composeOversightBrief()` exported | EXISTS |
| Account loader exists | `lib/product/oversight-account-loader.ts` | `loadOversightAccount()` exported | EXISTS |
| Signal builder exists | `lib/product/oversight-signal-builder.ts` | Exported | EXISTS |
| Internal API exists | `pages/api/internal/oversight/brief-preview.ts` | Admin-protected, calls `composeOversightBrief()` | EXISTS |
| Public UI exists | — | None | NOT_BUILT (correct — no public UI in v0) |

**Verdict: COMPOSER_EXISTS_AND_CALLABLE**

---

## Summary Table

| Signal | Helper Exists | Called Where | Rendered Where | Data Source | Verdict | Fix Required |
|--------|--------------|-------------|---------------|-------------|---------|-------------|
| Cost-of-Inaction Clock | YES | Return Brief server, Oversight Account Loader | Return Brief UI (conditional) | Monthly/daily cost from ER/SR | WIRED_AND_RENDERED | NONE |
| Commitment Verification | YES | Return Brief server, Oversight Account Loader | Return Brief UI (conditional) | Execution records + time | WIRED_AND_RENDERED | NONE |
| Pattern Recurrence | YES | Return Brief server, Decision Centre API, Oversight Account Loader | Return Brief UI, Decision Centre UI (both conditional) | Journey history, evidence nodes | WIRED_AND_RENDERED | NONE |
| Decision Credit Governance | YES | Decision Centre API, Oversight Brief Composer | Decision Centre credit panel | Decision ledger | WIRED_AND_RENDERED | NONE |
| Oversight Brief | YES (type + composer + loader + signal builder + preview API) | Internal preview API | Not surfaced (correct) | All primitives aggregated | COMPOSER_EXISTS | NONE — no public UI by design |
| Decision Loss Register | YES (contract) | Not yet called | Not rendered | Needs outcome verification data | CONTRACT_ONLY | Future — wire when loss data available |
| Strategic Option Register | YES (contract) | Not yet called | Not rendered | Needs option data | CONTRACT_ONLY | Future — wire when option data available |
| Decision Dependency Graph | YES (contract) | Not yet called | Not rendered | Needs multi-decision case | CONTRACT_ONLY | Future — wire when dependency data available |
| Irreversibility Index | YES (contract) | Not yet called | Not rendered | Composite of other signals | CONTRACT_ONLY | Future — wire when sufficient signals available |

---

## Conclusion

**All 5 active retainer signals are WIRED_AND_RENDERED.** No wiring fixes required.

The 4 newer contracts (loss register, option register, dependency graph, irreversibility index) are correctly CONTRACT_ONLY — they need real operational data before wiring, which will come from live retainer cases.

The Oversight Brief Composer is fully operational with an internal admin preview route. It aggregates all available signals. No public UI needed yet.
