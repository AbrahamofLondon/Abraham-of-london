# Market Intelligence Release Standard

**Version:** 1.1.0
**Effective from:** Q2 2026
**Governed by:** `lib/intelligence/market-intelligence-lifecycle.ts`
**Quality gate:** `lib/intelligence/market-intelligence-quality-gate.ts`
**Call ledger:** `lib/intelligence/market-intelligence-call-ledger.ts`

---

## 1. Purpose of the intelligence line

The Global Market Intelligence (GMI) report line exists to give institutional operators a quarterly decision-support intelligence brief. It is not a research product. It is not investment advice. It is a structured reading of macro, geopolitical, capital, and sector conditions designed to surface non-optional operating decisions for boards and senior leadership.

Every report in this line must earn its authority through evidence discipline, consequence framing, scenario rigour, and clear distinction between the public and paid editions.

---

## 2. Quarterly cadence

| Window | Function |
|---|---|
| Quarter just ended | Evidence base — reviewed for structure, policy, capital flow, consequence |
| Current quarter | Decision window — live operating choices, scenario posture, leadership timing |
| Next quarter | Preparation — research opens before current report is retired |

A report's lifecycle state is set in the central registry. It must not be changed by page copy, content fields, or manual edits to surface files. Retirement requires a lifecycle state change in `lib/intelligence/market-intelligence-lifecycle.ts`.

---

## 2a. Call verification cadence

Every new quarterly report must include a review of material calls from the prior report before issuing new calls. This is not optional and is part of the release standard from Q2 2026 onward.

The call ledger is the governed record. It is defined in `lib/intelligence/market-intelligence-call-ledger.ts`.

**Call verification flow:**

```
Prior report issues calls → calls seeded into MARKET_CALL_LEDGER with TOO_EARLY_TO_ASSESS
     ↓
Q-next preparation opens → getCallsPendingReview(currentWindow) identifies which calls are due
     ↓
Evidence gathered → outcomes, scores, and learnings recorded against each call
     ↓
New report opens with "Prior Quarter Call Review" section — all material calls reviewed
     ↓
New report issues new calls → seeded into ledger as TOO_EARLY_TO_ASSESS
```

For Q2 2026, this means all GMI-Q1-2026 calls with `expectedReviewWindow: "Q2 2026"` must be reviewed and scored before the Q2 report is published.

**Required section in every paid report from Q2 onward:**

> **Prior Quarter Call Review**
> A structured review of every material call, board instruction, scenario probability, and risk warning made in the preceding report. Each call is scored 0–5, the outcome is summarised, and the learning is recorded. This review precedes the new quarter's calls.

Omitting this section in Q2+ reports is a release blocker.

---

## 3. Required report structure

Every paid report must contain all of the following sections in order:

1. **Cover metadata** — Report ID, Version, Coverage period, Current decision window, Updated date, Lifecycle state, Classification, Not-investment-advice disclaimer
2. **Board Summary** — Core thesis, 5 non-optional operating decisions, 3 major risks, 3 watch signals, Base-case scenario, What would change the view
3. **Executive Summary**
4. **Prior Quarter Call Review** *(Q2 2026 onward — required)* — Scored review of all material calls from the preceding report; learning notes; effect on the new quarter's thesis
5. **Immediate Decision Implications**
6. **Core Quarter Thesis**
7. **Global Macro Snapshot**
8. **Major Economy Readings**
9. **Cross-Market Signals**
10. **Capital Flows and Political Risk**
11. **Sector Opportunity Map**
12. **Scenario Framework**
13. **If You Do Nothing / Cost of Inaction**
14. **Board-Level Actions**
15. **Methodology**
16. **Source and Confidence Appendix**
17. **Institutional Record**

Omitting any of these sections causes the Board Usability and Decision Usefulness dimensions to score below the release threshold.

---

## 4. Evidence and source standards

Evidence classes are defined in `lib/intelligence/market-intelligence-evidence-standard.ts`:

| Class | Requirement |
|---|---|
| `PRIMARY_DATA` | Source reference required |
| `INSTITUTIONAL_SOURCE` | Source reference required |
| `MARKET_IMPLIED_SIGNAL` | Date and window reference required |
| `MODELLED_ESTIMATE` | Method label required; must not be presented as a confirmed figure |
| `SCENARIO_ASSUMPTION` | Method note required; must be labelled as assumption, not forecast |
| `OPERATOR_JUDGEMENT` | Confidence band (HIGH / MEDIUM / LOW / MONITORING) required |

Rules that apply to every report:

- Hard numbers (percentages, absolute values, index levels) require a source reference or clear model/estimate label.
- Scenario probabilities require a method note explaining the basis.
- Claims about market moves require a date or window reference.
- Forecasts must be labelled as scenario assumptions, not facts.
- No report may imply regulated investment advice, even by omission.

---

## 5. Confidence posture standard

Every paid report must assign confidence bands to its analytical claims using the framework from `lib/intelligence/market-intelligence-evidence-standard.ts`:

**High confidence:**
- Structural thesis
- Observed market movements
- Documented policy changes

**Medium confidence:**
- Inflation pass-through ranges
- Recession probability ranges
- Capital-flow interpretation

**Low confidence:**
- Early-stage scenario assumptions
- Non-linear event modelling
- Contested macro interpretations

**Monitoring:**
- FX anomaly signals
- Political de-escalation pathways
- Systemic fracture risk

The Source and Confidence Appendix must map every major analytical claim to its evidence class and confidence band.

---

## 6. Scenario framework standard

Every paid report must include a four-scenario framework:

| Scenario | Contents |
|---|---|
| De-escalation / Recovery | Conditions, probability, basis |
| Base case (managed) | Conditions, probability, basis |
| Escalation / Deterioration | Conditions, probability, basis |
| Confidence fracture / Non-linear event | Conditions, probability, basis |

Probabilities must sum to 100%. Each probability must include a method note. Scenarios are labelled as assumptions, not forecasts.

---

## 7. Board-summary standard

The Board Summary section must be self-contained and must include:

- **Core thesis** — one paragraph, no hedging
- **5 non-optional operating decisions** — numbered, action-oriented
- **3 major risks** — with watch conditions
- **3 watch signals** — specific, observable, time-bound
- **Base-case scenario** — which scenario is operative and why
- **What would change the view** — specific triggers that would shift the thesis

The Board Summary must be usable standalone as a briefing extract for a board pack.

---

## 8. Paid vs public edition separation

**The public edition may contain:**
- The core thesis
- A high-level summary of the quarter
- Selected scenario framing (without full probability model)
- A visible invitation to the paid institutional edition

**The paid edition must additionally contain:**
- Fuller regional analysis
- Case evidence
- Operator translations (how conditions apply to specific operating contexts)
- Board-level actions
- Institutional record
- Source and confidence appendix with full evidence class assignments

The public edition must not collapse the paid edition's commercial value. If someone reads the public edition and has no reason to purchase the institutional edition, the separation has failed.

This separation is a quality gate critical failure: `PAID_SAME_AS_PUBLIC`.

---

## 9. Compliance and claim boundary

Every report must include a visible "not investment advice" disclaimer. It must appear:

- On the cover metadata
- In the institutional record
- On the public page surface (not just in the PDF)

The report may not contain language that implies:
- A specific recommendation to buy or sell a security
- A specific price target
- Regulated investment advice of any kind

Operator-facing language is acceptable: "capital allocation posture", "sector exposure decision", "structural hedge consideration". Regulated advice language is not acceptable: "we recommend buying", "our target price is", "investors should hold".

---

## 10. Release checklist

Before a report is moved from `DRAFT` or `SCHEDULED` to `ACTIVE` or `ACTIVE_UNTIL_SUPERSEDED`:

- [ ] All required sections present (17 from Q2 2026 onward, including Prior Quarter Call Review)
- [ ] Prior Quarter Call Review section includes scored outcome for every call from prior report with `expectedReviewWindow` matching current quarter
- [ ] Every reviewed call has a score (0–5), outcomeSummary, and learning note
- [ ] New quarter's calls seeded into MARKET_CALL_LEDGER as TOO_EARLY_TO_ASSESS
- [ ] Evidence classes assigned to all major analytical claims
- [ ] Confidence bands assigned
- [ ] Scenario probabilities sum to 100%
- [ ] Method notes present for all scenario probabilities
- [ ] Hard numbers have source references
- [ ] No investment advice language
- [ ] Compliance disclaimer visible on public page
- [ ] Board Summary is self-contained
- [ ] Paid edition materially differs from public edition
- [ ] Coverage period and decision window confirmed in registry
- [ ] Version number set in registry
- [ ] Updated date set in registry
- [ ] Lifecycle state set to `ACTIVE` or `ACTIVE_UNTIL_SUPERSEDED` in registry
- [ ] Q-next entry created in registry (as `DRAFT`)
- [ ] Catalog `active: true` for institutional product
- [ ] Entitlement slug resolves in `lib/commercial/product-identity.ts`
- [ ] Checkout path resolves
- [ ] Download route gated (no direct PDF links)
- [ ] Quality gate passes: `scoreReport()` returns `releaseReady: true`

---

## 11. Retirement/supersession checklist

Before a report is moved to `SUPERSEDED` or `ARCHIVED`:

- [ ] Q-next report is `ACTIVE` or `ACTIVE_UNTIL_SUPERSEDED` in registry
- [ ] `supersededBy` field set in registry
- [ ] Public page updated to reference superseding report
- [ ] Catalog `active` field reviewed (archive products may remain purchasable as archive reference)
- [ ] Lifecycle state changed in registry (not by page copy)
- [ ] Q-next-next entry created in registry (as `DRAFT`)
- [ ] Freshness note updated to indicate supersession

---

## 12. Quality scoring rubric

Defined in `lib/intelligence/market-intelligence-quality-gate.ts`. Each dimension scores 0–10.

| Dimension | What it measures |
|---|---|
| LIFECYCLE_CORRECTNESS | State consistency, purchasability, copy accuracy, metadata completeness |
| SOURCE_TRACEABILITY | Source appendix, hard-number sourcing |
| DECISION_USEFULNESS | Decision implications, board summary |
| SCENARIO_DISCIPLINE | Scenario framework, confidence posture |
| PAID_PUBLIC_SEPARATION | Material difference between editions |
| COMPLIANCE_BOUNDARY | Disclaimer presence, investment advice language |
| BOARD_USABILITY | Board summary structure and completeness |
| COMMERCIAL_READINESS | Purchasability, delivery route |
| FRESHNESS_METADATA | Coverage period, decision window, version, updated date |
| DELIVERY_READINESS | Download gating, lifecycle classification |

**Release threshold:**
- Overall score ≥ 9.0
- No dimension below 8.0
- No critical failures

**Critical failures (block release regardless of score):**

| Code | Condition |
|---|---|
| `PURCHASABLE_DRAFT` | Draft report is purchasable |
| `ACTIVE_ARCHIVED_BY_COPY` | Active report described as archived/unavailable in page copy |
| `HARD_NUMBERS_NO_SOURCE` | Hard numbers without source reference or method label |
| `INVESTMENT_ADVICE_LANGUAGE` | Report contains investment advice language |
| `PAID_SAME_AS_PUBLIC` | Paid edition not materially different from public edition |
| `MISSING_LIFECYCLE_METADATA` | Missing coverage period, decision window, or version |
| `MISSING_SUPERSESSION_PLAN` | No Q-next entry in lifecycle registry |
