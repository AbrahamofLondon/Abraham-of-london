# Moat Audit — Strategic Position Assessment

**Date:** 2026-07-06
**Audit scope:** Repository-wide assessment of the four claimed moat layers.

---

## The Claimed Moat

The market position rests on the intersection of four things that are genuinely hard to copy:

1. **Accountable, longitudinal judgement record** (GMI: scored call ledger, Decision Integrity Index, falsification register)
2. **Per-customer compounding decision graph** (strategic twin + governed decision memory keyed by caseId)
3. **Fail-closed evidence governance** (resolveCommercialAction, product-moat-adapter, three-layer proof estate)
4. **Interlocking product corridor** (paid instruments → reporting → execution → retainer)

---

## Layer 1: Accountable Longitudinal Judgement Record

### What exists

| Component | File | Status |
|---|---|---|
| Market Call Ledger | `lib/intelligence/market-intelligence-call-ledger.ts` | ✅ **Strong** — 30+ structured calls with outcome statuses, scores, evidence sources, carry-forward justifications, version history |
| GMI Persistent Ledger | `lib/intelligence/gmi-persistent-ledger.ts` | ✅ **Strong** — Database-backed ledger with callId, editionId, confidence bands, scores, evidence, review scheduling |
| GMI Instrument | `lib/intelligence/gmi-instrument.ts` | ✅ **Strong** — Public call ledger, evidence posture index, rubric scoring, blocked claim types |
| Falsification Contract | `lib/falsification/falsification-contract.ts` | ✅ **Strong** — Append-only, audit-locked, cannot delete, calibration tracking |
| GMI Methodology | `lib/intelligence/gmi-methodology.ts` | ✅ **Strong** — Rubric scores, evidence posture, methodology versioning |
| Decision Integrity Index | `lib/intelligence/gmi-monitoring-signals.ts` | ✅ **Present** — Monitoring signals, alert thresholds |
| GMI Release Events | `lib/intelligence/gmi-release-events.ts` | ✅ **Strong** — Full event-sourced release history with actor, action, state transitions |

### What's missing or weak

| Gap | Impact | Priority |
|---|---|---|
| **No cross-edition call comparison** — The ledger tracks calls per edition but there's no automated "did our Q1 call on X hold up in Q2?" comparison engine | Weakens the "longitudinal" claim — without automated comparison, it's a static archive, not a compounding intelligence asset | **High** |
| **Decision Integrity Index is not a published, scored metric** — `gmi-monitoring-signals.ts` defines signals but there's no single `DecisionIntegrityIndex` that aggregates call accuracy, falsification rate, calibration improvement across editions into a published score | The market cannot see the track record. A published DII would be the single most powerful trust signal. | **High** |
| **Falsification register exists but is not surfaced** — The contract is strong (append-only, audit-locked) but there's no public-facing falsification dashboard or summary | Without visibility, the falsification capability is infrastructure, not trust evidence | **Medium** |
| **No automated call outcome scoring** — Call outcomes are manually reviewed. There's no system that automatically checks "did the predicted event occur?" against external data feeds | Manual review limits scalability and introduces latency | **Medium** |

### Assessment

> **STRONG FOUNDATION, INCOMPLETE SURFACING.** The infrastructure for accountable judgement exists and is well-designed. The gap is in surfacing — the longitudinal record exists in code but is not yet a published, verifiable, compounding asset that a buyer or regulator can inspect.

---

## Layer 2: Per-Customer Compounding Decision Graph

### What exists

| Component | File | Status |
|---|---|---|
| Strategic Twin Contract | `lib/strategic-twin/strategic-twin-contract.ts` | ✅ **Strong** — Governed state machine: decision pressure, contradictions, evidence gaps, commitments, intervention readiness |
| Governed Strategic Twin | `lib/product-moat/governed-strategic-twin.ts` | ✅ **Strong** — Governance layer: twin updates flow through readiness/authority checks, cannot modify ProductAuthorityContract |
| Strategic Twin Simulation | `lib/strategic-twin/strategic-twin-simulation-engine.ts` | ✅ **Present** — Simulation engine for what-if analysis |
| Decision Intelligence Kernel | `lib/intelligence/decision-intelligence-kernel.ts` | ✅ **Strong** — 16-step sovereign orchestrator: translate → classify → lens → contradict → challenge → disclose → persist |
| Decision Intelligence Delta | `lib/intelligence/decision-intelligence-delta.ts` | ✅ **Strong** — Before/after comparison when progressive evidence is added |
| Living Decision Case | `lib/intelligence/living-decision-case-contract.ts` | ✅ **Strong** — Persistent case with versioned state |
| Case Sharing | `lib/product/case-sharing.ts` | ✅ **Present** — Client-safe provenance, sharing contracts |
| Decision Centre Memory | `lib/product/decision-centre-retainer-memory.ts` | ✅ **Present** — Retainer memory, decision continuity |

### What's missing or weak

| Gap | Impact | Priority |
|---|---|---|
| **No cross-product decision graph** — Each product has its own memory (strategic twin, decision centre, retainer memory) but there's no unified graph that shows how a decision flows from Fast Diagnostic → Boardroom Brief → Executive Reporting → Strategy Room → Retainer | The "compounding" claim requires showing that decisions compound across products, not just within them | **High** |
| **No customer-visible decision timeline** — A customer cannot see "here is your decision journey across 6 months" with before/after states, delta explanations, and outcome tracking | Without visibility, the compounding is infrastructure, not a selling point | **High** |
| **Strategic Twin is not per-customer in production** — The contract defines per-caseId state but there's no evidence of production usage with real customer data | The twin exists in code but may not be operationalised | **Medium** |
| **No cross-customer pattern detection** — The system can detect patterns within a case but there's no mechanism to learn across customers (anonymised) that "organisations in sector X with pressure pattern Y tend to need intervention Z" | This is where the real compounding value lies — network effects from the decision graph | **Medium** |

### Assessment

> **STRONG ARCHITECTURE, UNCERTAIN OPERATIONALISATION.** The governed strategic twin and decision intelligence kernel are well-designed. The gap is in proving that the compounding actually happens across products and across customers in production, and in making the decision journey visible to the customer.

---

## Layer 3: Fail-Closed Evidence Governance

### What exists

| Component | File | Status |
|---|---|---|
| Commercial Action Resolver | `lib/commercial/commercial-action-resolver.ts` | ✅ **Strong** — Pure function: catalog data ≠ permission. Governance state decides purchasability. 10 explicit action states. |
| Product Moat Adapter | `lib/product-moat/product-moat-adapter.ts` | ✅ **Strong** — Universal access control: activation modes (internal_only, audit_only_blocked, active_memory_write, prewired_pending_evidence, passive_context_read) |
| Fulfilment Contract Registry | `lib/product/product-fulfilment-contract.ts` | ✅ **Strong** — 44 contracts with fulfilment type, delivery model, readiness status |
| Fulfilment Assurance | `lib/product/product-fulfilment-assurance.ts` | ✅ **Strong** — Delivery class, automation level, quality controls, recovery policy |
| Fulfilment Readiness Validator | `lib/product/fulfilment-readiness-validator.ts` | ✅ **Strong** — Validates contracts, computes readiness, detects mismatches |
| Fulfilment Architecture Gate | `scripts/gtm/fulfilment-architecture-gate.ts` | ✅ **Strong** — 10 checks, production-derived |
| Payment Architecture Gate | `scripts/gtm/payment-architecture-gate.ts` | ✅ **Strong** — 8 checks, production-derived |
| Three-Layer Estate Proof | `lib/fulfilment/estate-{observation,evaluation,verdict}-layer.ts` | ✅ **Strong** — Independent observation → evaluation → verdict, no self-asserted fields |
| Payment Event Processor | `lib/commercial/payment-event-processor.ts` | ✅ **Strong** — Canonical processor, two-level idempotency, quarantine taxonomy |
| Fulfilment Execution Authority | `lib/fulfilment/fulfilment-execution-authority.ts` | ✅ **Strong** — Runtime handler resolution, canonical state model, output validation contracts |

### What's missing or weak

| Gap | Impact | Priority |
|---|---|---|
| **No runtime enforcement of claim boundaries** — The claim boundaries are documented in evidence records but there's no runtime check that prevents a product page from making a forbidden claim | A buyer could see a forbidden claim on a product page even though the governance system says it shouldn't be there | **High** |
| **No automated pricing truth enforcement** — The pricing audit finds violations but there's no gate that prevents deployment if active commercial surfaces have hardcoded prices that diverge from catalog | Pricing drift can happen silently between deployments | **High** |
| **No build-time governance gate** — The fulfilment architecture gate and payment gate are standalone scripts, not integrated into the build pipeline | They can be skipped | **Medium** |
| **No customer-visible governance proof** — A regulated buyer cannot see "this product has passed these governance gates" | The governance is infrastructure, not a trust signal visible to buyers | **Medium** |

### Assessment

> **STRONGEST LAYER — GENUINELY HARD TO COPY.** The fail-closed governance architecture is the most complete and defensible layer. The commercial action resolver, product moat adapter, three-layer proof system, and architecture gates form a coherent, years-long build that a competitor cannot replicate quickly. The gaps are in runtime enforcement and buyer-visible trust signals.

---

## Layer 4: Interlocking Product Corridor

### What exists

| Component | File | Status |
|---|---|---|
| Product Ladder | `lib/commercial/ladder.ts` | ✅ **Present** — Upgrade paths, corridor stages |
| Commercial Catalog | `lib/commercial/catalog.ts` | ✅ **Strong** — SSOT for all 46 products with upgrade paths |
| Product Estate Contract | `lib/product/product-estate-contract.ts` | ✅ **Strong** — Families, availability, surfacing rules |
| Corridor Authority | `tests/product-estate/corridor-authority.test.ts` | ✅ **Present** — Tests for corridor stage transitions |
| Paid Corridor Contract | `lib/product/paid-corridor-contract.ts` | ✅ **Present** — Paid corridor stage definitions |
| Product Identity Chain | `lib/commercial/product-identity.ts` | ✅ **Strong** — Resolves any identifier to full chain |

### What's missing or weak

| Gap | Impact | Priority |
|---|---|---|
| **No automated corridor progression** — A user must manually discover and navigate from Fast Diagnostic → Boardroom Brief → Executive Reporting. There's no system that says "based on your diagnostic result, you should consider X next" and creates a seamless progression | The corridor is documented but not operationalised as a guided journey | **High** |
| **No cross-product recommendation engine** — `lib/commercial/recommendation-engine.ts` exists but there's no evidence it's wired to the strategic twin or decision intelligence kernel | Recommendations are static catalog lookups, not dynamic progression suggestions | **High** |
| **No customer-visible corridor map** — A customer cannot see "you are here" in the product corridor with clear next steps and upgrade paths | Without visibility, the corridor is architecture, not a user experience | **Medium** |
| **No corridor progression analytics** — There's no data on how many users progress from free → paid → reporting → retainer, or where they drop off | Cannot optimise the corridor without data | **Medium** |

### Assessment

> **STRUCTURALLY COMPLETE, OPERATIONALLY WEAK.** The product corridor is well-documented in the catalog with upgrade paths, but it's not yet an operationalised, guided journey. A competitor could copy the product list; they would struggle to copy the governance and evidence infrastructure that makes the corridor trustworthy.

---

## Summary: The Four Layers

| Layer | Strength | Gap | Copyability |
|---|---|---|---|
| 1. Accountable judgement record | Strong infrastructure, incomplete surfacing | No published DII, no cross-edition comparison, falsification register not surfaced | **Very hard to copy** — requires years of published calls and willingness to publish misses |
| 2. Compounding decision graph | Strong architecture, uncertain operationalisation | No cross-product graph, no customer-visible timeline, twin not proven in production | **Hard to copy** — requires per-customer data and governed state machine, but a competitor could build it |
| 3. Fail-closed governance | **Strongest layer** | No runtime claim enforcement, no build-time gate integration, no buyer-visible trust signals | **Extremely hard to copy** — years-long build of contracts, resolvers, gates, and three-layer proof system |
| 4. Product corridor | Structurally complete, operationally weak | No automated progression, no recommendation engine wiring, no customer-visible map | **Easy to copy structurally** — a product list is trivial. The moat is in the governance and evidence that makes each corridor step trustworthy. |

## The Real Moat

The intersection is stronger than any single layer:

> **Accountable judgement × governed strategic twin × fail-closed governance × interlocking product corridor**

A competitor could copy:
- A product list (Layer 4 alone) — trivial
- A decision intelligence kernel (Layer 2 alone) — hard but possible
- A call ledger (Layer 1 alone) — possible but requires publishing misses

They **cannot** copy:
- The combination of all four
- The years of governance infrastructure (Layer 3)
- The willingness to publish a scored call ledger with falsification register (Layer 1)
- The compounding effect of per-customer decision history across products (Layer 2 + 4)

## Recommended Priorities

1. **Publish the Decision Integrity Index** — Aggregate call accuracy, falsification rate, and calibration improvement into a single published score per edition. This is the single most powerful trust signal for the market.

2. **Surface the falsification register** — Create a public dashboard showing what the system got wrong, what it learned, and how calibration improved. This turns a liability (being wrong) into a moat (being honest about it).

3. **Build the cross-product decision graph** — Connect Fast Diagnostic → Boardroom Brief → Executive Reporting → Strategy Room → Retainer into a visible, guided journey with dynamic recommendations based on strategic twin state.

4. **Add runtime claim enforcement** — Create a gate that prevents deployment if any product page makes a forbidden claim. This closes the gap between documented claim boundaries and actual customer-facing content.

5. **Make governance buyer-visible** — Show regulated buyers the governance gates each product has passed. This turns compliance infrastructure into a trust signal and purchasing decision factor.
