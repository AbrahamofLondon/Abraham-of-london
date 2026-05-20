# Market Intelligence Source Appendix Standard

**Version:** 1.0.0
**Effective from:** Q2 2026
**Governed by:** `lib/intelligence/market-intelligence-evidence-standard.ts`

Every paid quarterly report must include a Source and Confidence Appendix as a named section before the Institutional Record. This standard defines what that appendix must contain and how each entry must be structured.

---

## Evidence classes

Every claim, number, or signal in a paid report must be assigned one of the following evidence classes. These classes are defined canonically in `lib/intelligence/market-intelligence-evidence-standard.ts`.

| Class | What it covers | Source requirement |
|---|---|---|
| `PRIMARY_DATA` | Published datasets, official statistics, exchange data | Full source citation required |
| `INSTITUTIONAL_SOURCE` | IMF, World Bank, BIS, central bank publications, institutional research | Full source citation required |
| `MARKET_IMPLIED_SIGNAL` | Market pricing, yield curve signals, option-implied metrics | Date/window reference required |
| `MODELLED_ESTIMATE` | Quantitative model outputs, scenario-weighted projections | Method note required; must be labelled as estimate |
| `SCENARIO_ASSUMPTION` | Forward-looking probabilities, scenario parameters | Method basis required; must be labelled as assumption, not forecast |
| `OPERATOR_JUDGEMENT` | Synthesised analytical interpretation without a single source | Confidence band required; must be distinguishable from sourced evidence |

---

## Rules that apply to every paid report

1. **Hard numbers require a source, method note, or estimate label.** A percentage, absolute value, index level, or range that appears in the report without a source or method label is a quality gate failure (`HARD_NUMBERS_NO_SOURCE`).

2. **Market movements require a date or window reference.** "Markets fell" is not sufficient. "S&P 500 declined ~10–12% from recent highs, early April 2026" is the standard.

3. **Scenario probabilities require a method basis.** The four-scenario model requires a note explaining the basis for probability assignment — not a precise quantitative model (which does not exist), but an honest description of the structured judgement process (institutional median comparison, policy signal analysis, market-implied stress indicators).

4. **Forecasts must be labelled as scenario assumptions, not facts.** Language such as "inflation will rise by 2pp" is not acceptable. "Scenario assumption: under Managed Fragmentation, inflation transmission is estimated at 1–2pp over 2–4 quarters" is the standard.

5. **Operator judgements must be distinguishable from sourced evidence.** A paragraph that synthesises several sources into an analytical view is `OPERATOR_JUDGEMENT` and must carry a confidence band (HIGH / MEDIUM / LOW / MONITORING).

6. **Investment advice language is not permitted.** Claims that imply specific buy/sell recommendations, price targets, or regulated investment advice are a critical failure (`INVESTMENT_ADVICE_LANGUAGE`) regardless of how they are phrased.

---

## Required source appendix entry format

Every material claim in the paid report should have a corresponding entry in the Source and Confidence Appendix. The entry format is:

```
Signal / Claim:    [Brief description of the claim or signal]
Evidence class:    [PRIMARY_DATA | INSTITUTIONAL_SOURCE | MARKET_IMPLIED_SIGNAL |
                    MODELLED_ESTIMATE | SCENARIO_ASSUMPTION | OPERATOR_JUDGEMENT]
Source / basis:    [Citation, institution, model description, or judgement note]
Observation window: [Date, quarter, or "Q1 2026 data"]
Confidence:        [HIGH | MEDIUM | LOW | MONITORING]
Used in section:   [Section name]
Notes:             [Caveats, limitations, method basis summary]
Release blocker?:  [yes/no]
```

---

## Q1 2026 source appendix — exemplar entries

The following entries illustrate the standard. Future reports must match this level of source discipline.

---

**Signal / Claim:** US effective tariff rate on Chinese imports 145%
**Evidence class:** PRIMARY_DATA
**Source / basis:** US Federal Register; press releases from the Office of the United States Trade Representative, April 2026
**Observation window:** Effective April 2026
**Confidence:** HIGH
**Used in section:** Global Macro Snapshot; Risk Warning (CALL-007)
**Notes:** Rate reflects cumulative tariffs across multiple rounds. Effective rate, not statutory rate.

---

**Signal / Claim:** China retaliatory tariff rate on US goods 125%
**Evidence class:** PRIMARY_DATA
**Source / basis:** Chinese Ministry of Commerce announcements, April 2026
**Observation window:** Effective April 2026
**Confidence:** HIGH
**Used in section:** Global Macro Snapshot; Major Economy Readings
**Notes:** Retaliatory rate announced in response to US escalation.

---

**Signal / Claim:** S&P 500 correction ~10–12% from recent highs
**Evidence class:** PRIMARY_DATA
**Source / basis:** Exchange data; Bloomberg/Refinitiv market data, early April 2026
**Observation window:** From Q1 highs to early April 2026
**Confidence:** HIGH
**Used in section:** Cross-Market Signals; Macro Signals Strip
**Notes:** Approximate range. Point-in-time snapshot; intra-quarter volatility was significant.

---

**Signal / Claim:** US 10-year yield ~4.5% intraday peak
**Evidence class:** PRIMARY_DATA
**Source / basis:** US Treasury market data, April 2026
**Observation window:** Intraday peak, April 2026
**Confidence:** HIGH
**Used in section:** Cross-Market Signals; Rates/FX
**Notes:** Intraday peak; not a closing or average figure.

---

**Signal / Claim:** IMF global growth revision ~2.5–2.8%
**Evidence class:** INSTITUTIONAL_SOURCE
**Source / basis:** IMF World Economic Outlook, Q1 2026 update
**Observation window:** Q1 2026
**Confidence:** HIGH
**Used in section:** Global Macro Snapshot
**Notes:** Range reflects stated revision. Full WEO text is primary authority.

---

**Signal / Claim:** US recession probability 40–60%
**Evidence class:** MODELLED_ESTIMATE
**Source / basis:** Institutional median across major bank research, Fed surveys, and futures-implied recession probability models, Q1 2026
**Observation window:** 12-month window from Q1 2026
**Confidence:** MEDIUM
**Used in section:** Scenario Framework; Macro Signals Strip
**Notes:** Clustering of institutional estimates, not a single-model output. Range reflects meaningful dispersion in institutional views.

---

**Signal / Claim:** Inflation pass-through 1–2pp over 2–4 quarters
**Evidence class:** MODELLED_ESTIMATE
**Source / basis:** Historical tariff episode analysis; academic literature on pass-through rates (e.g., Fajgelbaum et al.); structural model estimate
**Observation window:** Projection from April 2026
**Confidence:** MEDIUM
**Used in section:** Sector Opportunity Map; Scenario Framework
**Notes:** Modelled estimate. Sensitive to retailer margin behaviour and demand elasticity. Range reflects scenario variation.

---

**Signal / Claim:** Managed Fragmentation base case probability 43%
**Evidence class:** SCENARIO_ASSUMPTION
**Source / basis:** Structured four-scenario model; operator judgement synthesis across institutional scenario distributions, market-implied stress metrics, and policy signal analysis
**Observation window:** Q1 2026 evidence base; Q2 decision window
**Confidence:** MEDIUM
**Used in section:** Scenario Framework
**Notes:** Scenario assumption, not an empirical forecast. Method: structured judgement, not quantitative model. Probabilities sum to 100% across four scenarios.

---

**Signal / Claim:** Dollar weakness under risk-off as credibility signal — monitoring
**Evidence class:** MARKET_IMPLIED_SIGNAL
**Source / basis:** DXY trajectory and correlation with VIX and gold, Q1 2026 intraday and closing data
**Observation window:** Q1 2026, specifically April 2026 risk-off episodes
**Confidence:** MONITORING
**Used in section:** Cross-Market Signals; Watch Signals
**Notes:** Anomalous relative to historical safe-haven pattern. Not classified as structural — monitoring classification requires further evidence.

---

## Enforcement

Entries missing from the source appendix that correspond to claims in the body of the report constitute a `SOURCE_TRACEABILITY` dimension failure in the quality gate. Hard numbers without entries constitute a critical failure `HARD_NUMBERS_NO_SOURCE`. Major macro, regional, FX, credit, growth, or scenario claims without evidence posture classification constitute `UNCLASSIFIED_MAJOR_CLAIM`. Hard quantitative or market-condition claims without source appendix rows constitute `HARD_CLAIM_WITHOUT_SOURCE_ROW`.

Draft reports may retain rows marked "Source pending", "Evidence to collect", "Method note required", or "Awaiting Q2 close" only when the report remains non-public and non-purchasable. Active paid releases must resolve release-blocking pending rows before publication.

The source appendix is a paid-edition-only section. It must not appear in the public surface edition.
