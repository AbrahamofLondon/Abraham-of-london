# Market Intelligence Q2 — Methodology Boundary

**Document ID:** MARKET_INTELLIGENCE_Q2_METHODOLOGY  
**Effective Date:** 2026-06-14  
**Status:** Evidence Package Component  

---

## What This Intelligence Is

**Evidence-limited quarterly market analysis** that reviews material calls from the prior quarter before issuing forward-looking market intelligence.

The Q2 2026 report:
- Reviews Q1 2026 material calls against actual market outcomes
- Calibrates working thesis against evidence
- Identifies forward scenarios consistent with evidence
- Maintains falsification register for accountability
- Compounds understanding through quarterly verification

---

## What This Intelligence Is NOT

❌ Investment advice  
❌ Financial prediction  
❌ Guaranteed forecast  
❌ Certified market analysis  
❌ Real-time market feed  
❌ Automated signal generation  
❌ Proprietary algorithmic prediction  
❌ Insider intelligence  

---

## Evidence Sources Allowed

### Institutional Sources
- IMF World Economic Outlook (published)
- Federal Reserve FOMC statements and minutes
- European Central Bank policy decisions
- Bank of England monetary policy reports
- People's Bank of China public statements
- Published government economic data

### Primary Data
- US Treasury yield curves (published)
- Currency exchange rates (public markets)
- Equity index performance (public markets)
- Commodity prices (public markets)
- Trade statistics (government published)

### Market-Implied Signals
- Credit spread widening/tightening (observable)
- Equity volatility indices (public)
- Currency volatility (public)
- Bond yield implied inflation expectations (market-derived)

### Published Research
- Academic research (peer-reviewed)
- Published investment bank research
- Think tank analysis
- Published government analysis

### Policy Documents
- Tariff schedules (government published)
- Regulatory changes (official gazette)
- Central bank policy frameworks (published)
- Trade negotiation outcomes (announced)

---

## Evidence Sources Forbidden

❌ Proprietary hedge fund data  
❌ Confidential client portfolios  
❌ Insider trading signals  
❌ Purchased private data without attribution  
❌ Unpublished government intelligence  
❌ Confidential corporate earnings previews  
❌ Proprietary algorithmic scoring (without verification)  
❌ Unverified rumors or commentary  

---

## Prior-Quarter Review Requirement

**Non-negotiable:** Every quarterly report reviews material calls from the prior quarter.

This requirement:
- **Prevents moving-goalpost language** (changing thesis without explaining why)
- **Maintains accountability** (false calls documented in falsification register)
- **Compounds understanding** (each quarter builds on verified evidence)
- **Blocks prediction drift** (cannot claim accuracy on future calls, only on past verification)

**Mechanism:** `getCallsPendingReview()` function in `lib/intelligence/generate-gmi-digest.ts` retrieves prior calls and their outcomes.

**Public Accountability:** Falsification register is published with each report, showing:
- What we called for the prior quarter
- What actually happened
- How the thesis adapted to evidence

---

## Confidence Language Boundaries

### Approved Language
- "may indicate"
- "suggests"
- "consistent with"
- "observed pattern"
- "implied by evidence"
- "scenario calibration"
- "risk to thesis"
- "likely scenario given evidence"

### Forbidden Language
- "will happen"
- "is guaranteed to"
- "markets will move"
- "predicts"
- "indicates with certainty"
- "proven"
- "validated market signal"
- "investment-grade confidence"

---

## Falsification Standards

Every material claim in the report must be falsifiable.

Falsifiable claims:
✓ "If tariff rates exceed 60%, emerging market capital flows will tighten within 90 days"  
✓ "Should Fed policy remain unchanged, 10-year Treasury yields will drift toward 4.5% range"  
✓ "A credit event requiring coordinated G7 response would force non-linear scenario reassessment"  

Non-falsifiable claims (rejected):
❌ "Markets always price some risk"  
❌ "Evidence suggests potential implications"  
❌ "Market conditions reflect multiple perspectives"  

---

## Human Review Gate

**All material claims pass human review before publication.**

Review checklist:
- [ ] Claim is falsifiable (not vague)
- [ ] Evidence cited is published/public
- [ ] Confidence language is bounded (no certainty claims)
- [ ] No investment-advice language
- [ ] Thesis tested against contradicting evidence
- [ ] Prior-quarter calls reviewed and documented
- [ ] Falsification register updated
- [ ] No proprietary data claimed

---

## Authority Boundary

This is **evidence-limited commercial intelligence**, not authority-granting work.

Authority implications:
- ❌ Cannot claim external validation
- ❌ Cannot claim market proof
- ❌ Cannot claim investment authority
- ❌ Cannot claim prediction certainty
- ✓ Can claim structured decision-support
- ✓ Can claim evidence-based scenario analysis
- ✓ Can claim prior-quarter verification
- ✓ Can claim falsification accountability

---

## Deliverable Governance

Every Q2 report deliverable must include:

1. **Evidence Boundary Statement** (first section, visible)
2. **Falsification Register** (prior-quarter calls vs. outcomes)
3. **Working Thesis** (with evidence contradictions noted)
4. **Forward Scenarios** (calibrated to evidence, not prediction)
5. **Human Review Attestation** (date, reviewer)
6. **Methodology Boundary** (this document, referenced)
7. **No Investment-Advice Disclaimer** (explicit)

---

## Enforcement

The governance guard (`check-product-release-governance.mjs`) verifies:
- No investment-advice language
- No prediction certainty
- No proprietary-data claims
- Falsification register present
- Prior-quarter review documented
- Authority boundary respected

Violation = commercial release blocked.

---

**Methodology Boundary Status:** ✓ DEFINED  
**Prior-Quarter Review:** ✓ REQUIRED  
**Human Review Gate:** ✓ REQUIRED  
**Authority Claim:** NONE (evidence-limited only)
