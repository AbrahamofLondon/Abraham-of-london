# GMI Q2 2026 — Monitoring Register

**Report:** GMI-Q2-2026
**Status:** Active research workspace — DRAFT
**Coverage period:** Q2 2026 (April–June 2026)
**Decision window:** Q3 2026
**Register opened:** May 2026

This register tracks the evidence signals required to confirm, revise, or challenge material claims in the Q2 2026 Global Market Intelligence Report. Each section corresponds to a monitoring ID defined in `lib/intelligence/gmi-monitoring-signals.ts`.

The report does not merely assert a view. It monitors the evidence required to earn that view.

---

## 1. Trade-War Monitor

**Monitor ID:** GMI-MONITOR-USCN-TARIFF
**Linked calls:** CALL-007 (China-US impairment), CALL-006 (Managed Fragmentation base case)
**Severity:** ELEVATED
**Status:** ACTIVE

### What we are watching

- US effective tariff rate on China — maintained at 145%, modified, or reduced
- China retaliatory tariff rate — maintained at 125%, modified, or reduced
- US 90-day tariff pause: expired, extended, or materially modified (see Section 2)
- Third-country transshipment enforcement: Vietnam, India, Mexico origin-compliance scrutiny

### Evidence required

| Source | Evidence type | Status |
|---|---|---|
| US Federal Register tariff schedule Q2 | PRIMARY_DATA | Awaiting Q2 close |
| USTR press releases | INSTITUTIONAL_SOURCE | Awaiting Q2 close |
| Chinese Ministry of Commerce announcements | INSTITUTIONAL_SOURCE | Awaiting Q2 close |
| Trade flow data US-China Q2 | PRIMARY_DATA | Awaiting Q2 close |

### Thesis implications

If tariff rate maintained at ~145%: structural impairment thesis holds; Managed Fragmentation probability sustained.
If reduced materially below ~50%: base case shifts toward de-escalation; Partial Policy Reset probability increases significantly.

---

## 2. Tariff Escalation Watch

**Monitor ID:** GMI-MONITOR-PAUSE-STATUS
**Linked calls:** CALL-006 (scenario probability)
**Severity:** ELEVATED
**Status:** ACTIVE

### What we are watching

- US 90-day tariff pause: expiry date, extension announcement, or material modification
- New tariff measures beyond the existing schedule
- EU-US trade framework status
- UK-US deal terms: confirmed or unresolved

### Evidence required

| Source | Evidence type | Status |
|---|---|---|
| US Executive Order or USTR announcement | PRIMARY_DATA | Source pending |
| Confirmation of pause status at Q2 close | INSTITUTIONAL_SOURCE | Awaiting Q2 close |
| UK-US deal announcement | INSTITUTIONAL_SOURCE | Awaiting Q2 close |

### Thesis implications

Pause expired without extension: confirms escalation trajectory; Escalation Continuation probability increases.
Pause extended or modified: shifts base-case timeline; affects Managed Fragmentation probability band.

---

## 3. Treasury Yield Spike Watch

**Monitor ID:** GMI-MONITOR-US10Y
**Linked calls:** CALL-005 (dollar weakness / financial conditions)
**Severity:** WATCH
**Status:** MONITORING

### What we are watching

- US 10-year yield Q2 range and volatility
- Sustained moves above configured thresholds (see `lib/intelligence/gmi-alert-thresholds.ts`)
- Yield curve shape: inversion, steepening, or normalisation

| Threshold | Level | Meaning |
|---|---|---|
| WATCH | 4.5% | Financial conditions tightening signal |
| ELEVATED | 4.75% | Structural tightening beyond policy rates |
| CRITICAL | 5.0% | Credit and equity repricing trigger |

### Evidence required

| Source | Evidence type | Status |
|---|---|---|
| US Treasury market data — Q2 range | PRIMARY_DATA | Awaiting Q2 close |
| Fed commentary on yield behaviour | INSTITUTIONAL_SOURCE | Awaiting Q2 close |

### Thesis implications

Sustained yield above 4.75%: confirms financial-condition tightening claim; strengthens Escalation Continuation scenario.
Yield stabilises below 4.5%: monetary constraint narrative softens; positive for Managed Fragmentation base case.

---

## 4. USD Stress Watch

**Monitor ID:** GMI-MONITOR-USD-STRESS
**Linked calls:** CALL-005 (dollar weakness under risk-off conditions)
**Severity:** WATCH
**Status:** MONITORING

### What we are watching

- Dollar behaviour during equity market stress episodes in Q2
- DXY Q2 range and risk-off episode pattern
- Institutional selling of US Treasuries — any observable signal in market pricing

### Current claim boundary

Dollar behaviour under stress remains a **monitoring variable**. Episodic weakness or instability may indicate shifting reserve-demand behaviour, but it is **not yet treated as a confirmed reserve-regime break**.

Evidence required to upgrade:
- Multiple documented risk-off episodes where dollar weakened rather than strengthened
- Institutional commentary citing reserve-demand concerns
- Observable market pricing of reserve-status questions

### Evidence required

| Source | Evidence type | Status |
|---|---|---|
| DXY Q2 risk-off episode data | MARKET_IMPLIED_SIGNAL | Awaiting Q2 close |
| Bloomberg / Refinitiv FX data | MARKET_IMPLIED_SIGNAL | Awaiting Q2 close |
| Institutional commentary on reserve demand | INSTITUTIONAL_SOURCE | Source pending |

---

## 5. Credit Stress Watch

**Monitor ID:** GMI-MONITOR-CREDIT
**Linked calls:** None (independent signal)
**Severity:** WATCH
**Status:** MONITORING

### What we are watching

- IG and HY credit spread Q2 movement relative to Q1 levels
- Covenant tightening signals in corporate credit markets
- Any systemic credit event or liquidity stress episode

### Current claim boundary

Credit conditions tightening claim is **presented as monitoring only**. Do not assert broad credit regime tightening without Q2 IG/HY spread data showing sustained widening beyond Q1 levels.

### Evidence required

| Source | Evidence type | Status |
|---|---|---|
| ICE BofA IG spread Q2 range | MARKET_IMPLIED_SIGNAL | Awaiting Q2 close |
| ICE BofA HY spread Q2 range | MARKET_IMPLIED_SIGNAL | Awaiting Q2 close |
| Credit market commentary | INSTITUTIONAL_SOURCE | Source pending |

---

## 6. AI Productivity Offset Watch

**Monitor ID:** GMI-MONITOR-AI-OFFSET
**Linked calls:** None (independent signal)
**Severity:** INFO
**Status:** MONITORING

### What we are watching

- AI capex commitments from major technology companies Q2
- Productivity estimates or framing from IMF, Fed, or institutional research
- JPMorgan and other institutional framing of AI as a resilience offset to trade headwinds

### Current claim boundary

AI productivity offset is currently **qualitative framing only** (JPMorgan). No confirmed GDP point estimate or structural growth contribution. Present as an offset signal being monitored, not a quantified growth factor.

Evidence required to strengthen:
- IMF or institutional GDP estimate incorporating AI productivity
- Confirmed AI capex volume with plausible growth contribution estimate
- Source reference in paid edition Source Appendix

---

## 7. Institutional Forecast Comparison

**Governed in:** `lib/intelligence/gmi-growth-scenario-model.ts`

| Source | Estimate | Evidence class | Confirmation status |
|---|---|---|---|
| IMF January 2026 WEO | 3.3% | INSTITUTIONAL_SOURCE | Confirmed — Q2 revision pending July WEO |
| Goldman Sachs | ~2.8% | INSTITUTIONAL_SOURCE | Source confirmation required |
| Morgan Stanley | ~3.2% | INSTITUTIONAL_SOURCE | Source confirmation required |
| JPMorgan | Qualitative | OPERATOR_JUDGEMENT | No GDP estimate; qualitative offset only |
| AoL Q2 Scenario | ~2.7% | SCENARIO_ASSUMPTION | Below consensus; must be labelled as scenario assumption |

**Model interpretation:** Institutional forecasts support a constrained low-3% global growth environment rather than a confirmed sub-3% base case. The AoL downside case sits below institutional consensus and must be labelled as scenario assumption unless supported by confirmed Q2 evidence.

**Required before Q2 release:** IMF July 2026 WEO revision. Goldman Sachs and Morgan Stanley estimates require confirmed source references with publication dates.

---

## 8. Evidence Still Required Before Q2 Release

The following evidence gaps must be closed before GMI-Q2-2026 can be published as the paid institutional edition:

| Claim | Evidence required | Monitor ID | Priority |
|---|---|---|---|
| US tariff regime Q2 status | US Federal Register / USTR Q2 data | GMI-MONITOR-USCN-TARIFF | Critical |
| 90-day pause resolution | USTR announcement | GMI-MONITOR-PAUSE-STATUS | Critical |
| IMF July 2026 WEO revision | IMF publication | — | Critical |
| US 10-year yield Q2 range | Treasury market data | GMI-MONITOR-US10Y | High |
| USD risk-off behaviour Q2 | DXY and FX market data | GMI-MONITOR-USD-STRESS | High |
| IG / HY credit spread Q2 | ICE BofA spread data | GMI-MONITOR-CREDIT | High |
| Goldman Sachs / Morgan Stanley GDP | Confirmed publication reference | — | Medium |
| India / ASEAN Q2 investment flows | UNCTAD / World Bank data | GMI-MONITOR-INDIA-ASEAN | Medium |
| Africa infrastructure signals Q2 | World Bank / ADB reports | GMI-MONITOR-AFRICA | Low (Q3 window) |
| Q1 call review complete | All 7 calls scored | — | Critical (release gate) |

No hard macro band, FX regime claim, credit-tightening claim, or regional capital-flow claim may be presented as settled until the corresponding row above is filled with a confirmed source reference.
