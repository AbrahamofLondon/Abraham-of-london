# Product Authority Validation Source Map

**Date:** 2026-06-18
**Status:** Evidence-source wiring phase — classifications hardened

## Validation Check Status Summary

| Check | Classification | Source File | Source Exists | Product-Specific Evidence Exists | Can Pass Today | Authority-Clearing Eligible | Next Action |
|---|---|---|---|---|---|---|---|
| evidence_ledger_v2 | fully_data_fed | `lib/product/derived-evidence-state.ts` + `reports/product-value-evidence-ledger-v2.json` | ✅ | ✅ team_assessment only | ✅ team_assessment only | ✅ | Add ledger entries for more products |
| release_firewall | fully_data_fed | `lib/product/resolve-product-authority.ts` reads `reports/product-release-governance-matrix.json` | ✅ | ✅ All 43 products | ✅ All non-blocked products | ✅ | None — fully wired |
| no_mock_authority | fully_data_fed | `lib/product/resolve-product-authority.ts` checks `boundary.mockAuthorityUsed` | ✅ | ✅ All products | ✅ All products | ✅ | None — fully wired |
| validation_constitution | evidence_dependent_proxy | `resolveProductAuthority()` checks `derivedEvidence.ledgerEntryExists` | ✅ (ledger) | ✅ team_assessment only | ✅ team_assessment only | ❌ (proxy) | Add ledger entries for more products |
| anti_gaming | evidence_dependent_proxy | `resolveProductAuthority()` checks `derivedEvidence.ledgerEntryExists` | ✅ (ledger) | ✅ team_assessment only | ✅ team_assessment only | ❌ (proxy) | Add ledger entries for more products |
| adversarial_validation | evidence_dependent_proxy | `resolveProductAuthority()` checks `derivedEvidence.ledgerEntryExists` | ✅ (ledger) | ✅ team_assessment only | ✅ team_assessment only | ❌ (proxy) | Add ledger entries for more products |
| anti_toy_validation | evidence_dependent_proxy | `lib/product/anti-toy-validation-adapter.ts` — reads ledger `testsRun.antiToy` or anti-toy review report | ✅ (ledger + report) | ✅ team_assessment (ledger); 6 products (report) | ✅ team_assessment (ledger); 3 products (report: fast_diagnostic, team_assessment, enterprise_assessment) | ❌ (proxy) | Add ledger entries for more products; run anti-toy tests on more products |
| red_team_validation | evidence_dependent_proxy | `lib/product/red-team-validation-adapter.ts` — reads ledger `testsRun.redTeam` or red-team review report | ✅ (ledger + report) | ✅ team_assessment (ledger); 6 products (report) | ✅ team_assessment (ledger); 3 products (report: fast_diagnostic, team_assessment, enterprise_assessment) | ❌ (proxy) | Add ledger entries for more products; run red-team panels on more products |
| generic_ai_comparison | contract_stub_missing_source | `lib/product/generic-ai-comparison-contract.ts` (contract stub only) | ❌ (no standalone module) | ✅ team_assessment only (via ledger) | ❌ Cannot pass — no real comparison source | ❌ | Do not fabricate. Requires real comparison run against generic AI alternative. |
| market_comparison | contract_stub_missing_source | `lib/product/market-comparison-contract.ts` (contract stub only) | ❌ (no standalone module) | ✅ team_assessment only (via ledger) | ❌ Cannot pass — no real comparison source | ❌ | Do not fabricate. Requires real comparison run against market alternatives. |

---

## Detailed Check Analysis

### 1. evidence_ledger_v2

**Classification:** fully_data_fed
**Source file:** `lib/product/derived-evidence-state.ts` + `reports/product-value-evidence-ledger-v2.json`
**Source exists:** ✅
**Product-specific evidence:** ✅ team_assessment only
**Can pass today:** ✅ team_assessment only
**Authority-clearing eligible:** ✅
**Next action:** Add ledger entries for more products.

### 2. anti_toy_validation

**Classification:** evidence_dependent_proxy
**Source file:** `lib/product/anti-toy-validation-adapter.ts`
**Source exists:** ✅ — Evidence ledger (`reports/product-value-evidence-ledger-v2.json`) has `testsRun.antiToy` for team_assessment. Anti-toy review report (`reports/product-anti-toy-review.md`) exists with data for 6 products.
**Product-specific evidence:** ✅ team_assessment (ledger); fast_diagnostic, team_assessment, enterprise_assessment, case_dossier_tariff_shock, case_dossier_team_alignment, case_dossier_escalation_denied (report)
**Can pass today:** ✅ team_assessment (ledger — passed: true, score: 9.2/10). ✅ fast_diagnostic, team_assessment, enterprise_assessment (report — score 0/100, passes). ❌ case_dossier_tariff_shock (report — score 23/100, fails). ❌ case_dossier_team_alignment (report — score 23/100, fails). ❌ case_dossier_escalation_denied (report — score 15/100, fails). ❌ All other 37 products (no evidence).
**Authority-clearing eligible:** ❌ (proxy — depends on evidence ledger presence)
**Next action:** Add ledger entries for more products; run anti-toy tests on more products.

### 3. red_team_validation

**Classification:** evidence_dependent_proxy
**Source file:** `lib/product/red-team-validation-adapter.ts`
**Source exists:** ✅ — Evidence ledger (`reports/product-value-evidence-ledger-v2.json`) has `testsRun.redTeam` for team_assessment. Red-team review report (`reports/product-red-team-review.md`) exists with data for 6 products.
**Product-specific evidence:** ✅ team_assessment (ledger); fast_diagnostic, team_assessment, enterprise_assessment, case_dossier_tariff_shock, case_dossier_team_alignment, case_dossier_escalation_denied (report)
**Can pass today:** ✅ team_assessment (ledger — passed: true, score: 8.5/10). ✅ fast_diagnostic, team_assessment, enterprise_assessment (report — survives: yes). ❌ case_dossier_tariff_shock, case_dossier_team_alignment, case_dossier_escalation_denied (report — survives: no). ❌ All other 37 products (no evidence).
**Authority-clearing eligible:** ❌ (proxy — depends on evidence ledger presence)
**Next action:** Add ledger entries for more products; run red-team panels on more products.

### 4. generic_ai_comparison

**Classification:** contract_stub_missing_source
**Source file:** `lib/product/generic-ai-comparison-contract.ts` (contract stub only)
**Source exists:** ❌ — No standalone comparison module exists. The evidence ledger has `genericAiComparison` test data for team_assessment (passed: true, score: 8.9/10), but this is a recorded test result, not a reusable comparison framework.
**Product-specific evidence:** ✅ team_assessment only (via ledger record)
**Can pass today:** ❌ Cannot pass for any product without a real comparison source. The contract stub returns `missing_source` / `blocked_until_comparison_source_exists` for all products without ledger data.
**Authority-clearing eligible:** ❌
**Next action:** Do not fabricate. Requires a real implementation that runs the product against a generic AI (e.g., ChatGPT, Claude) and compares outputs.

### 5. market_comparison

**Classification:** contract_stub_missing_source
**Source file:** `lib/product/market-comparison-contract.ts` (contract stub only)
**Source exists:** ❌ — No standalone comparison module exists. The evidence ledger has `marketComparison` test data for team_assessment (passed: true, score: 8.3/10), but this is a recorded test result, not a reusable comparison framework.
**Product-specific evidence:** ✅ team_assessment only (via ledger record)
**Can pass today:** ❌ Cannot pass for any product without a real comparison source. The contract stub returns `missing_source` / `blocked_until_market_comparison_source_exists` for all products without ledger data.
**Authority-clearing eligible:** ❌
**Next action:** Do not fabricate. Requires a real implementation that compares the product against market alternatives.

### 6. release_firewall

**Classification:** fully_data_fed
**Source file:** `lib/product/resolve-product-authority.ts` calls `checkReleaseFirewall()` which reads `reports/product-release-governance-matrix.json`
**Source exists:** ✅
**Product-specific evidence:** ✅ All 43 products have entries in the governance matrix.
**Can pass today:** ✅ Products with non-blocked lanes/modes pass. boardroom_brief and executive_reporting are blocked.
**Authority-clearing eligible:** ✅
**Next action:** None — fully wired.

### 7. validation_constitution

**Classification:** evidence_dependent_proxy
**Source file:** `resolveProductAuthority()` checks `derivedEvidence.ledgerEntryExists`
**Source exists:** ✅ (evidence ledger)
**Product-specific evidence:** ✅ team_assessment only
**Can pass today:** ✅ team_assessment only
**Authority-clearing eligible:** ❌ (proxy)
**Next action:** Add ledger entries for more products.

### 8. no_mock_authority

**Classification:** fully_data_fed
**Source file:** `resolveProductAuthority()` checks `input.boundary?.mockAuthorityUsed !== true`
**Source exists:** ✅
**Product-specific evidence:** ✅ All products
**Can pass today:** ✅ All products with `mockAuthorityUsed !== true`
**Authority-clearing eligible:** ✅
**Next action:** None — fully wired.

### 9. anti_gaming

**Classification:** evidence_dependent_proxy
**Source file:** `resolveProductAuthority()` checks `derivedEvidence.ledgerEntryExists`
**Source exists:** ✅ (evidence ledger). Also `lib/product/anti-gaming-validation-authority.ts` exists but is not directly called by resolver.
**Product-specific evidence:** ✅ team_assessment only
**Can pass today:** ✅ team_assessment only
**Authority-clearing eligible:** ❌ (proxy)
**Next action:** Add ledger entries for more products.

### 10. adversarial_validation

**Classification:** evidence_dependent_proxy
**Source file:** `resolveProductAuthority()` checks `derivedEvidence.ledgerEntryExists`
**Source exists:** ✅ (evidence ledger). Also `lib/decision-spine/adversarial-evidence-shield.ts` exists but is not directly called by resolver.
**Product-specific evidence:** ✅ team_assessment only
**Can pass today:** ✅ team_assessment only
**Authority-clearing eligible:** ❌ (proxy)
**Next action:** Add ledger entries for more products.

---

## Classification Model

| Category | Definition | Count | Checks |
|---|---|---|---|
| fully_data_fed | Reads a real source and can pass/fail from data | 3 | evidence_ledger_v2, release_firewall, no_mock_authority |
| evidence_dependent_proxy | Reads a real evidence source but not a check-specific source | 5 | validation_constitution, anti_gaming, adversarial_validation, anti_toy_validation, red_team_validation |
| contract_stub_missing_source | Contract exists, source absent, cannot pass | 2 | generic_ai_comparison, market_comparison |
| contract_only | Design/contract exists but no runtime evidence adapter | 0 | — |
| missing | No contract and no implementation | 0 | — |

## Source Reality Verification

### anti_toy_validation adapter
- **Reads from:** Evidence ledger (`testsRun.antiToy`) OR anti-toy review report (`reports/product-anti-toy-review.md`)
- **Source files exist:** ✅ Both files exist
- **Product-specific evidence:** ✅ team_assessment (ledger); 6 products (report)
- **Can pass today:** ✅ 3 products pass (fast_diagnostic, team_assessment, enterprise_assessment)
- **Boardroom can pass:** ❌ No ledger entry, no report entry → fails closed
- **Verdict:** Honest evidence_dependent_proxy. Real sources are read. Products without evidence correctly fail.

### red_team_validation adapter
- **Reads from:** Evidence ledger (`testsRun.redTeam`) OR red-team review report (`reports/product-red-team-review.md`)
- **Source files exist:** ✅ Both files exist
- **Product-specific evidence:** ✅ team_assessment (ledger); 6 products (report)
- **Can pass today:** ✅ 3 products pass (fast_diagnostic, team_assessment, enterprise_assessment)
- **Boardroom can pass:** ❌ No ledger entry, no report entry → fails closed
- **Verdict:** Honest evidence_dependent_proxy. Real sources are read. Products without evidence correctly fail.

### generic_ai_comparison contract stub
- **Reads from:** Evidence ledger (`testsRun.genericAiComparison`) — only for team_assessment
- **Standalone source module:** ❌ Does not exist
- **Can pass today:** ❌ Cannot pass — no real comparison source
- **Boardroom can pass:** ❌ Contract stub returns `missing_source`
- **Verdict:** Honest `contract_stub_missing_source`. Not overstated as evidence proxy.

### market_comparison contract stub
- **Reads from:** Evidence ledger (`testsRun.marketComparison`) — only for team_assessment
- **Standalone source module:** ❌ Does not exist
- **Can pass today:** ❌ Cannot pass — no real comparison source
- **Boardroom can pass:** ❌ Contract stub returns `missing_source`
- **Verdict:** Honest `contract_stub_missing_source`. Not overstated as evidence proxy.

## New Files Created

| File | Purpose |
|---|---|
| `lib/product/anti-toy-validation-adapter.ts` | Resolves anti-toy validation from evidence ledger or anti-toy review report |
| `lib/product/red-team-validation-adapter.ts` | Resolves red-team validation from evidence ledger or red-team review report |
| `lib/product/generic-ai-comparison-contract.ts` | Contract stub for generic AI comparison — documents gap, prevents fake passes |
| `lib/product/market-comparison-contract.ts` | Contract stub for market comparison — documents gap, prevents fake passes |
| `reports/boardroom-fulfilment-lifecycle.md` | Documents fulfilment vs authority separation for Boardroom Brief |
| `reports/v2-revalidation-path.md` | Documents the path from blocked → evidence review → authority eligible |

---

## Phase 8 Carry-Forward Debt Ledger

The following debts remain after this closure pass and must be addressed before Phase 8 can begin:

### 🔴 Critical (blocks authority for all products)

| # | Debt | Impact | Owner |
|---|---|---|---|
| 1 | **generic_ai_comparison** — No standalone comparison module exists. Contract stub returns `missing_source`. Requires building a framework that runs products against generic AI alternatives (ChatGPT, Claude, Gemini) and compares outputs. | Blocks all 43 products from passing this check. | Unassigned |
| 2 | **market_comparison** — No standalone comparison module exists. Contract stub returns `missing_source`. Requires building a framework that evaluates products against market alternatives. | Blocks all 43 products from passing this check. | Unassigned |

### 🟡 High (blocks specific products)

| # | Debt | Impact | Owner |
|---|---|---|---|
| 3 | **Boardroom Brief v2 revalidation not started** — No evidence ledger entry exists. No frozen scenarios. No rendered output captured. | Boardroom remains `blocked_until_v2_revalidation`. Cannot progress to authority review. | Unassigned |
| 4 | **Executive Reporting v2 revalidation not started** — Same as Boardroom. | Executive reporting remains `blocked_until_v2_revalidation`. | Unassigned |
| 5 | **Boardroom Mode v2 revalidation not started** — Same as Boardroom. | Boardroom mode remains `blocked_until_v2_revalidation`. | Unassigned |
| 6 | **Only 3 products have anti-toy evidence** — fast_diagnostic, team_assessment, enterprise_assessment have report data. 37 products have no anti-toy evidence. | 37 products cannot pass anti_toy_validation. | Unassigned |
| 7 | **Only 3 products have red-team evidence** — Same 3 products. 37 products have no red-team evidence. | 37 products cannot pass red_team_validation. | Unassigned |

### 🟢 Medium (improves system completeness)

| # | Debt | Impact | Owner |
|---|---|---|---|
| 8 | **14 public instruments blocked_until_claim_evidenced** — No evidence ledger entries exist for any decision instrument. | Instruments cannot be sold or publicly claimed as validated. | Unassigned |
| 9 | **Anti-gaming adapter not directly called** — `lib/product/anti-gaming-validation-authority.ts` exists but resolver uses ledger proxy. | Anti-gaming check is evidence_dependent_proxy, not fully_data_fed. | Unassigned |
| 10 | **Adversarial validation adapter not directly called** — `lib/decision-spine/adversarial-evidence-shield.ts` exists but resolver uses ledger proxy. | Adversarial check is evidence_dependent_proxy, not fully_data_fed. | Unassigned |
| 11 | **Validation constitution not independently verified** — Check depends on `ledgerEntryExists` rather than a constitution-specific source. | Constitution check is evidence_dependent_proxy, not fully_data_fed. | Unassigned |

### Summary

| Severity | Count | Description |
|---|---|---|
| 🔴 Critical | 2 | No comparison sources exist (generic AI, market) |
| 🟡 High | 5 | v2 revalidation not started for key products; evidence gaps for 37 products |
| 🟢 Medium | 4 | Proxy checks could be upgraded to fully_data_fed with direct adapter wiring |
| **Total** | **11** | Debts to resolve before Phase 8 |
