# GMI Buyer Assurance Pack

**Applies to:** Global Market Intelligence institutional edition
**Governed by:** `docs/intelligence/market-intelligence-release-standard.md`
**Quality gate:** `lib/intelligence/market-intelligence-quality-gate.ts`
**Release checklist:** `lib/intelligence/gmi-release-candidate-checklist.ts`
**Source standard:** `docs/intelligence/market-intelligence-source-appendix-standard.md`
**Call ledger:** `lib/intelligence/market-intelligence-call-ledger.ts`

---

This document explains what a buyer of the institutional edition is actually purchasing, what governs it, how to interpret its structure, and what the discipline behind it means in practice. It is not a marketing document. It is an accountability brief.

---

## 1. What this intelligence line is

The Global Market Intelligence (GMI) report is a quarterly decision-support brief for institutional operators, boards, and senior leadership. It is not a research product, a forecast service, or a financial advisory product.

Each report is structured to support a specific kind of decision: what to prioritise, what to monitor, where to hedge, and what would change those conclusions. It is written to survive scrutiny from a skeptical institutional reader who distinguishes intelligence discipline from conviction theatre.

**It is not investment advice.** It does not contain recommendations to buy or sell securities, price targets, or regulated financial guidance. See Section 13 for the compliance boundary.

---

## 2. How the evidence standard works

Every major analytical claim in the institutional edition is assigned an **evidence class** drawn from a canonical set:

| Class | What it means |
|---|---|
| `PRIMARY_DATA` | Raw data from a primary source (official statistics, registry data, trade data) |
| `INSTITUTIONAL_SOURCE` | Published analysis from a named institutional source (IMF, World Bank, central bank) |
| `MARKET_IMPLIED_SIGNAL` | Derived from observable market pricing (yield levels, spread movements, FX rates) |
| `MODELLED_ESTIMATE` | Output from an analytical model — labelled as estimate, not confirmed figure |
| `SCENARIO_ASSUMPTION` | Used as an input to a scenario framework — labelled as assumption, not forecast |
| `OPERATOR_JUDGEMENT` | Assessment based on structured analytical judgment — confidence band required |

Every claim in the Source and Confidence Appendix carries one of these labels. The appendix is a paid-edition-only section; it does not appear in the public surface edition.

---

## 3. How confidence bands are assigned

Every major analytical claim is assigned one of four confidence bands:

| Band | When applied |
|---|---|
| **HIGH** | Structural thesis, observed market movements, documented policy changes |
| **MEDIUM** | Inflation pass-through ranges, recession probability ranges, capital-flow interpretation |
| **LOW** | Early-stage scenario assumptions, non-linear event modelling, contested macro interpretations |
| **MONITORING** | FX anomaly signals, political de-escalation pathways, systemic fracture risk |

These bands are visible to the reader in the Confidence Posture section of the institutional report. Monitoring-band claims are included because they are important, not because they are settled. They should not be treated as conclusions until upgraded through evidence.

---

## 4. How the scenario framework is structured

Every institutional report includes a four-scenario framework:

1. **De-escalation / Recovery** — conditions, probability, basis
2. **Base case (managed)** — conditions, probability, basis
3. **Escalation / Deterioration** — conditions, probability, basis
4. **Confidence fracture / Non-linear event** — conditions, probability, basis

Probabilities sum to 100%. Each probability is accompanied by a method note explaining the basis. Scenarios are explicitly labelled as **assumptions**, not forecasts. A reader who treats scenario probabilities as predictions has misread the framework.

---

## 5. How calls are recorded and reviewed

Every material call, board instruction, scenario assumption, risk warning, and opportunity signal made in a quarterly report is recorded in the **call verification ledger** (`lib/intelligence/market-intelligence-call-ledger.ts`). Each call carries:

- A unique call ID
- A call type (STRUCTURAL_THESIS, BOARD_INSTRUCTION, PREDICTION, etc.)
- The original confidence band
- The expected review window (which quarter the call is reviewed in)
- An outcome status (TOO_EARLY_TO_ASSESS until reviewed)

The **following quarterly report** reviews all calls due in that window — scoring each 0–5, recording an outcome summary, and noting the learning. A call carrying `TOO_EARLY_TO_ASSESS` past its expected window requires a written justification. The `PRIOR_QUARTER_CALLS_UNREVIEWED` critical failure blocks release until this is resolved.

This is the mechanism by which the intelligence line compounds through verification rather than resetting each quarter.

---

## 6. What the source appendix shows

The Source and Confidence Appendix is a section of the paid institutional edition that maps every material claim to its evidence record. Each row includes:

- Claim description
- Evidence class
- Source or basis (named, not generic)
- Observation window
- Confidence band
- Report section it supports
- Status: VERIFIED / EVIDENCE_COLLECTED / SOURCE_PENDING / METHOD_NOTE_REQUIRED / CARRIED_FORWARD / REJECTED
- Release-blocker flag

**A draft report may contain source-pending rows.** These are disclosed explicitly. **An active release may not.** Source rows flagged as `releaseBlocker: true` must be VERIFIED or CARRIED_FORWARD before the report can be published. This is enforced mechanically via the quality gate.

---

## 7. How the quality gate works

Before a report is moved from DRAFT to ACTIVE or ACTIVE_UNTIL_SUPERSEDED, it must pass a quality gate (`lib/intelligence/market-intelligence-quality-gate.ts`). The gate scores 10 dimensions:

| Dimension | What it measures |
|---|---|
| LIFECYCLE_CORRECTNESS | State consistency, purchasability, copy accuracy |
| SOURCE_TRACEABILITY | Source appendix, hard-number sourcing |
| DECISION_USEFULNESS | Decision implications, board summary |
| SCENARIO_DISCIPLINE | Scenario framework, confidence posture |
| PAID_PUBLIC_SEPARATION | Material difference between editions |
| COMPLIANCE_BOUNDARY | Disclaimer presence, investment advice language |
| BOARD_USABILITY | Board summary structure |
| COMMERCIAL_READINESS | Purchasability, delivery route |
| FRESHNESS_METADATA | Coverage period, decision window, version |
| DELIVERY_READINESS | Download gating, lifecycle classification |

Release requires an overall score ≥ 9.0, no dimension below 8.0, and zero critical failures.

**Critical failures block release regardless of score.** These include: PURCHASABLE_DRAFT, HARD_NUMBERS_NO_SOURCE, INVESTMENT_ADVICE_LANGUAGE, PAID_SAME_AS_PUBLIC, and PRIOR_QUARTER_CALLS_UNREVIEWED.

---

## 8. How lifecycle states work

Every report has a lifecycle state managed in `lib/intelligence/market-intelligence-lifecycle.ts`:

| State | Meaning |
|---|---|
| DRAFT | In preparation. Not purchasable, not public. |
| SCHEDULED | Approved for future release. |
| ACTIVE | Current active report. |
| ACTIVE_UNTIL_SUPERSEDED | Active and remains so until the next report is published. |
| SUPERSEDED | Replaced by a newer report. |
| ARCHIVED | Available as archive reference. |
| RETIRED | No longer available. |

The lifecycle state is the single source of truth for a report's status. It is never set by page copy, content fields, or manual surface edits. It is only changed via the lifecycle registry.

---

## 9. What happens between quarters

Between the close of one report's coverage period and the publication of the next:

1. **Q-next preparation opens** — the draft report is registered in the lifecycle registry with DRAFT state and `purchasable: false`, `publicVisible: false`.
2. **Evidence collection** — source appendix rows are populated as evidence becomes available.
3. **Call review** — prior-quarter calls are reviewed and scored after the quarter closes.
4. **Confidence posture finalisation** — confidence bands are reviewed and updated for the new evidence picture.
5. **Scenario framework update** — probabilities and method notes are revised against current signals.
6. **Quality gate run** — `scoreReport()` must return `releaseReady: true`.
7. **Lifecycle promotion** — only then does the lifecycle state change to ACTIVE or ACTIVE_UNTIL_SUPERSEDED.
8. **Q-next-next seeded** — the following quarter's draft entry is created before the current report is published.

The current active report remains decision-relevant until explicitly superseded. It does not expire on a calendar date.

---

## 10. What the paid/public separation means

The public surface edition contains:
- The core thesis
- A high-level quarter summary
- Selected scenario framing (without full probability model)
- An invitation to the institutional edition

The institutional edition additionally contains:
- Fuller regional analysis with case evidence
- Operator translations (how conditions apply to specific operating contexts)
- Board-level actions
- Institutional record
- Source and Confidence Appendix with full evidence class assignments

The separation is not cosmetic. If a reader of the public edition has no reason to purchase the institutional edition, the separation has failed. The quality gate enforces this with the PAID_SAME_AS_PUBLIC critical failure.

---

## 11. What the compliance boundary is

This intelligence line is **not a regulated financial product**. It does not constitute investment advice. No part of the report may be interpreted as a recommendation to buy, sell, or hold any security. No price targets are included.

The compliance disclaimer appears:
- On the report cover metadata
- In the institutional record
- On the public page surface

Operator-facing language is used deliberately: "capital allocation posture", "sector exposure decision", "structural hedge consideration". This is not a stylistic preference; it is a regulatory boundary.

---

## 12. How to read the evidence posture labels

Within the institutional report body, major claims carry one of the following posture labels:

| Label | What it means |
|---|---|
| **Confirmed** | Supported by source evidence or observed market data. Treat as a verified input. |
| **Directional** | Evidence supports the direction, but the claim is not settled. Treat as informed, not final. |
| **Monitoring** | The signal is present and worth tracking, but insufficient for a firm conclusion. |
| **Scenario assumption** | Used for planning and scenario modelling — explicitly not a forecast. |
| **Operator judgement** | Analytical assessment with a declared confidence band — not a neutral data point. |

A reader who treats Monitoring-labelled claims as confirmed conclusions has misread the report. A reader who dismisses Scenario assumption items as irrelevant has also misread it.

---

## 13. What "governance standard" means for this line

The governance standard (`docs/intelligence/market-intelligence-release-standard.md`) defines:

- The required structure of every paid report (17 sections from Q2 2026)
- The evidence class requirements
- The confidence posture requirements
- The scenario framework requirements
- The board summary requirements
- The quality gate thresholds and critical failures
- The lifecycle management protocol
- The paid/public separation standard
- The compliance boundary
- The call verification cadence

It is a binding operational standard, not a style guide. Departure from it constitutes a quality gate failure.

---

## 14. How to engage with a future report cycle

If you are a buyer of the institutional edition:

- The current active report remains valid for operating decisions until superseded.
- Q2 2026 is in preparation. It will not be published until quality gate, call review, and source appendix conditions are met.
- You will not receive a report that has not passed the release standard.
- The call verification record is publicly visible in the summary form on the market intelligence landing page. Full detail is in the institutional record.
- Questions about methodology, evidence classes, or specific claims should be directed through the access route on the intelligence landing page.

If you are evaluating the line before purchasing:
- The public edition is available at `/intelligence/global-market-intelligence-q1-2026`.
- The methodology section of the landing page (`/intelligence/market`) describes the discipline.
- The governance standard document is available to institutional enquirers.
- This brief is provided as part of the buyer assurance package.

---

*This is decision-support intelligence. It is not investment advice.*
