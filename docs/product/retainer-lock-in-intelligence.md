# Retainer Lock-In Intelligence

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London
**Doctrine:** The system must help clients see what they would otherwise miss.

---

## Intelligence Primitives

| Primitive | File | Purpose | Data source |
|-----------|------|---------|-------------|
| **Cost-of-Inaction Clock** | `lib/product/cost-of-inaction-clock.ts` | Accumulating cost since last action | Monthly/daily cost estimate from ER/SR |
| **Commitment Verification** | `lib/product/commitment-verification.ts` | Track whether commitments are executed on time | Execution records + time elapsed |
| **Decision Loss Register** | `lib/product/decision-loss-register.ts` | Realised, irreversible losses | Outcome verification, execution failures |
| **Strategic Option Register** | `lib/product/strategic-option-register.ts` | Options available, closing, or already closed | Decision objects, constraints, market signals |
| **Decision Dependency Graph** | `lib/product/decision-dependency-graph.ts` | Decisions that block or require other decisions | Decision objects, constraint text, stakeholder text |
| **Irreversibility Index** | `lib/product/irreversibility-index.ts` | How close the situation is to becoming irreversible | Option decay, execution failures, consequence materialisation |
| **Oversight Brief Contract** | `lib/product/oversight-brief-contract.ts` | Monthly governance brief structure | Aggregation of all primitives above |
| **Pattern Recurrence** | `lib/product/pattern-recurrence.ts` | Patterns that keep repeating | Signal continuity, evidence nodes |
| **Decision Credit Governance** | `lib/product/decision-credit-governance.ts` | Credit score governance interpretation | Decision ledger |

---

## What the client should see

| Signal | What it reveals |
|--------|----------------|
| Cost accumulating | "This has cost £X since you last acted." |
| Commitment drifting | "You committed to Y by Z. That deadline has passed." |
| Option closing | "This option was available 30 days ago. It is now closing." |
| Decision blocked | "Decision A cannot proceed until Decision B is resolved." |
| Pattern recurring | "This authority gap has appeared 3 times in 6 months." |
| Irreversibility rising | "The situation is 72% toward irreversibility." |
| Loss realised | "This opportunity closed. Estimated value lost: £X." |

---

## Where primitives are surfaced

| Surface | Primitives wired |
|---------|-----------------|
| Return Brief | Cost-of-Inaction Clock, Commitment Verification |
| Decision Centre | Retainer readiness (derived from patterns + boardroom threshold) |
| Strategy Room | Dynamic consequence (existing), avoidance pattern (existing) |
| Oversight Brief | All primitives aggregated monthly |

---

## Revenue model

```
Strategy Room (£750-£1,250) — resolves a decision
Retainer Oversight (£25,000+/year) — governs the decision environment

The intelligence primitives make the retainer indispensable because
the client sees what they would otherwise miss:

- cost accumulating between sessions
- commitments unfulfilled
- options decaying
- decisions blocking each other
- patterns repeating
- situations becoming irreversible
```

---

## Rules

- No fake data. Every primitive returns honest output from available evidence.
- No generic subscription language. Retainer readiness is evidence-based.
- No motivational copy. The primitives show consequence, not encouragement.
- No vanity metrics. Every number is derived from the case, not invented.
