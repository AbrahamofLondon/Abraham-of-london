# Wave 2A Tier 1 Product Proof Map

**Generated**: 2026-06-13  
**Mission**: Wire and externally validate 8 Tier 1 products for upgrade eligibility.  
**Gate Target**: All gates PASSED (surface claim authority, universal claim authority, external benchmark).

---

## Tier 1 Products: Baseline Status

All 8 products currently: `blocked_pending_external_proof`

### 1. personal_decision_audit

| Field | Value |
|-------|-------|
| Code | `personal_decision_audit` |
| Route | `/diagnostics/purpose-alignment` |
| Commercial Status | `paid` |
| Price | $49 |
| Composer Status | Has free-signal-based composer (checks purpose clarity) |
| Route Verified | Yes (exists in codebase) |
| Current Claim | None (blocked) |
| Expected Max State | `diagnostic_product` or `signal_product` |
| Proof Method | Live route → captured output → anti-toy test → red-team review |
| Scenarios for Testing | (1) Founder lacking strategic clarity, (2) Operator unsure about mandate alignment |
| Wiring Needed | Route already exists; needs output capture integration |
| High Consequence | No (low price, diagnostic entry point) |

### 2. boardroom_brief

| Field | Value |
|-------|-------|
| Code | `boardroom_brief` |
| Route | `/boardroom-brief` |
| Commercial Status | `paid` |
| Price | $99 |
| Composer Status | Has board-brief-specific composer (board-grade reasoning) |
| Route Verified | Yes |
| Current Claim | None (but candidate for board-grade) |
| Expected Max State | `board_grade_product` or `diagnostic_product` |
| Proof Method | Live route → captured brief artefact → reasoning chain → red-team review |
| Scenarios for Testing | (1) Executive decision facing hidden dependencies, (2) Board brief for contentious decision |
| Wiring Needed | Route needs board-brief artefact capture (evidence ledger) |
| High Consequence | **YES** — Cannot be upgraded to board-grade without rigorous external proof |

### 3. decision_exposure_instrument

| Field | Value |
|-------|-------|
| Code | `decision_exposure_instrument` |
| Route | `/decision-instruments/decision-exposure-instrument/start` |
| Commercial Status | `paid` |
| Price | $29 |
| Composer Status | Has decision-exposure composer (risk/dependency mapping) |
| Route Verified | Yes |
| Current Claim | None (blocked) |
| Expected Max State | `diagnostic_product` or `signal_product` |
| Proof Method | Live route → captured exposure map → anti-toy test → red-team review |
| Scenarios for Testing | (1) Strategic decision with multiple dependencies, (2) Tactical execution with hidden exposure |
| Wiring Needed | Route exists; needs output capture + evidence ledger |
| High Consequence | No |

### 4. mandate_clarity_framework

| Field | Value |
|-------|-------|
| Code | `mandate_clarity_framework` |
| Route | `/decision-instruments/mandate-clarity-framework/start` |
| Commercial Status | `paid` |
| Price | $49 |
| Composer Status | Has mandate-clarity composer (clarifies role/authority boundaries) |
| Route Verified | Yes |
| Current Claim | None (blocked) |
| Expected Max State | `diagnostic_product` or `signal_product` |
| Proof Method | Live route → captured mandate map → anti-toy test → red-team review |
| Scenarios for Testing | (1) Executive with overlapping mandates, (2) Role clarity ambiguity after restructure |
| Wiring Needed | Route exists; needs output capture |
| High Consequence | No |

### 5. intervention_path_selector

| Field | Value |
|-------|-------|
| Code | `intervention_path_selector` |
| Route | `/decision-instruments/intervention-path-selector/start` |
| Commercial Status | `paid` |
| Price | $79 |
| Composer Status | Has intervention-path composer (selects escalation/action pathway) |
| Route Verified | Yes |
| Current Claim | None (blocked) |
| Expected Max State | `diagnostic_product` or `signal_product` |
| Proof Method | Live route → captured pathway → anti-toy test → red-team review |
| Scenarios for Testing | (1) Escalation decision path selection, (2) Intervention urgency assessment |
| Wiring Needed | Route exists; needs output capture |
| High Consequence | No |

### 6. escalation_readiness_scorecard

| Field | Value |
|-------|-------|
| Code | `escalation_readiness_scorecard` |
| Route | `/decision-instruments/escalation-readiness-scorecard/run` |
| Commercial Status | `paid` |
| Price | $29 |
| Composer Status | Has escalation-readiness composer (readiness scoring framework) |
| Route Verified | Yes |
| Current Claim | None (blocked) |
| Expected Max State | `signal_product` or `diagnostic_product` |
| Proof Method | Live route → captured scorecard → anti-toy test → red-team review |
| Scenarios for Testing | (1) Escalation readiness assessment, (2) Boundary decision on urgency |
| Wiring Needed | Route exists; needs output capture |
| High Consequence | No |

### 7. boardroom_mode

| Field | Value |
|-------|-------|
| Code | `boardroom_mode` |
| Route | `/boardroom-mode` |
| Commercial Status | `evidence_gated` (free, requires prior case record) |
| Price | Free (gated) |
| Composer Status | Has boardroom-adversarial composer (challenge format) |
| Route Verified | Yes |
| Current Claim | None (blocked, but has "challenge" claim in language) |
| Expected Max State | `diagnostic_product` (not board-grade) |
| Proof Method | Live route → captured challenge output → red-team review (no anti-toy; format-driven) |
| Scenarios for Testing | (1) Executive decision from fast_diagnostic challenged, (2) Strategic choice facing hidden assumptions |
| Wiring Needed | Route exists; needs output capture for evidence ledger |
| High Consequence | **YES** — Controls access to high-stakes decision testing; requires gating logic |

### 8. diagnostic_report_basic

| Field | Value |
|-------|-------|
| Code | `diagnostic_report_basic` |
| Route | `/diagnostics` |
| Commercial Status | `inactive` |
| Price | $250 (unused) |
| Composer Status | Has report-basic composer (template-driven report) |
| Route Verified | No (generic diagnostic route) |
| Current Claim | None (blocked) |
| Expected Max State | `signal_product` (template-based, no personalization) |
| Proof Method | Route wiring → template render → anti-toy test |
| Scenarios for Testing | (1) Basic diagnostic template, (2) Standard decision taxonomy report |
| Wiring Needed | **Major**: Needs dedicated route + input handler; currently points to generic /diagnostics |
| Blocker | Inactive status + no dedicated route; may be deferred to Tier 3 if wiring is complex |

---

## Testing Strategy

### Scenario Selection

Each product will be tested with **2 materially different scenarios** that vary by:
- **Founder vs. Operator perspective** (different decision urgency, scope, context)
- **Strategic vs. Tactical** (different input patterns drive different outputs)
- **High stakes vs. Low stakes** (different consequence weight)

### Output Capture

For each test:
1. Execute live route with scenario input
2. Capture rendered output (JSON structure)
3. Measure anti-toy score (generic phrase density, input echo ratio, cross-scenario similarity)
4. Extract reasoning chain (if present)
5. Document evidence ledger entry

### Thresholds

| Metric | Pass Threshold | Product Impact |
|--------|---|---|
| Anti-toy score | ≤ 5 | Blocks gold; diagnostic viable if < 10 |
| Cross-scenario similarity | < 20% | High similarity indicates template/toy risk |
| Red-team pass | ≥ 4/5 mean score | Blocks gold if < 7.0 per reviewer |
| Generic AI outperform | Required | Product must add value vs. ChatGPT baseline |
| Reasoning chain | Present & specific | Required for diagnostic/board-grade claims |

---

## Proof Map: Summary Table

| Product | Code | Route | Status | Wiring | Scenarios | Expected Max State | Risk Level |
|---------|------|-------|--------|--------|-----------|---|---|
| Personal Decision Audit | personal_decision_audit | /diagnostics/purpose-alignment | blocked_pending | Capture only | 2 | diagnostic_product | Low |
| Boardroom Brief | boardroom_brief | /boardroom-brief | blocked_pending | Capture + ledger | 2 | board_grade_candidate* | **HIGH** |
| Decision Exposure | decision_exposure_instrument | /decision-instruments/decision-exposure-instrument/start | blocked_pending | Capture only | 2 | diagnostic_product | Low |
| Mandate Clarity | mandate_clarity_framework | /decision-instruments/mandate-clarity-framework/start | blocked_pending | Capture only | 2 | diagnostic_product | Low |
| Intervention Path | intervention_path_selector | /decision-instruments/intervention-path-selector/start | blocked_pending | Capture only | 2 | diagnostic_product | Low |
| Escalation Readiness | escalation_readiness_scorecard | /decision-instruments/escalation-readiness-scorecard/run | blocked_pending | Capture only | 2 | signal_product | Low |
| Boardroom Mode | boardroom_mode | /boardroom-mode | blocked_pending | Capture + gate | 2 | diagnostic_product | **HIGH** |
| Diagnostic Report Basic | diagnostic_report_basic | /diagnostics (needs new route) | inactive | Route + capture | 2 | signal_product | **MEDIUM** (redesign risk) |

*Boardroom Brief: Retain "board-grade" language ONLY if external proof shows board-grade-quality reasoning. Otherwise downgrade to diagnostic_product.

---

## Execution Order

1. **Phase 1**: Wire output capture for 6 low-wiring products (personal_decision_audit, decision_exposure_instrument, mandate_clarity_framework, intervention_path_selector, escalation_readiness_scorecard, boardroom_mode).
2. **Phase 2**: Run live-route external benchmark on all 6.
3. **Phase 3**: Evaluate boardroom_brief separately (high consequence).
4. **Phase 4**: Decide on diagnostic_report_basic (route design vs. defer).
5. **Phase 5**: Aggregate results, upgrade products, create evidence ledgers.
6. **Phase 6**: Verify all gates PASS.

---

## Next Steps

1. Create `scripts/wave-2a-tier-1-route-wiring.ts` to wire output capture.
2. Update `scripts/run-external-product-value-benchmark.ts` to test all 8 products.
3. Create `scripts/capture-wave-2a-tier-1-evidence.ts` to generate evidence ledgers.
4. Run benchmark and capture evidence.
5. Create final proof result report.
