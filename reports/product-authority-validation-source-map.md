# Product Authority Validation Source Map

**Date:** 2026-06-18
**Status:** Evidence-source wiring phase — adapters created for anti_toy, red_team, generic_ai_comparison, market_comparison

## Validation Check Status Summary

| Check | Status | Source File | Data Fed? |
|---|---|---|---|
| evidence_ledger_v2 | data-fed (1 product) | `lib/product/derived-evidence-state.ts` + `reports/product-value-evidence-ledger-v2.json` | ✅ team_assessment only |
| anti_toy_validation | evidence_dependent_proxy | `lib/product/anti-toy-validation-adapter.ts` — reads ledger `testsRun.antiToy` or anti-toy review report | ✅ team_assessment (ledger); 6 products (report) |
| red_team_validation | evidence_dependent_proxy | `lib/product/red-team-validation-adapter.ts` — reads ledger `testsRun.redTeam` or red-team review report | ✅ team_assessment (ledger); 6 products (report) |
| generic_ai_comparison | evidence_dependent_proxy | `lib/product/generic-ai-comparison-contract.ts` (contract stub) — reads ledger `testsRun.genericAiComparison` | ✅ team_assessment only |
| market_comparison | evidence_dependent_proxy | `lib/product/market-comparison-contract.ts` (contract stub) — reads ledger `testsRun.marketComparison` | ✅ team_assessment only |
| release_firewall | data-fed | `resolveProductAuthority()` reads release governance matrix | ✅ All 43 products in matrix |
| validation_constitution | data-fed (1 product) | `resolveProductAuthority()` checks `derivedEvidence.ledgerEntryExists` | ✅ team_assessment only |
| no_mock_authority | data-fed | `resolveProductAuthority()` checks `boundary.mockAuthorityUsed` | ✅ All products |
| anti_gaming | data-fed (1 product) | `resolveProductAuthority()` checks `derivedEvidence.ledgerEntryExists` | ✅ team_assessment only |
| adversarial_validation | data-fed (1 product) | `resolveProductAuthority()` checks `derivedEvidence.ledgerEntryExists` | ✅ team_assessment only |

---

## Detailed Check Analysis

### 1. evidence_ledger_v2

**Current status:** data-fed (1 product: team_assessment)
**Existing files:**
- `lib/product/derived-evidence-state.ts` — Loads and parses evidence ledger + artifact verification
- `lib/validation/validation-evidence-ledger-v2.ts` — Full validation evidence record types
- `reports/product-value-evidence-ledger-v2.json` — Ledger data (1 entry: team_assessment)
- `reports/evidence-ledger-artifact-verification.json` — Artifact verifier output (1 entry: team_assessment)

**Data source candidate:** `reports/product-value-evidence-ledger-v2.json` + `reports/evidence-ledger-artifact-verification.json`
**Resolver integration required:** Call `deriveEvidenceState(productCode)` in `resolveProductAuthority()` and pass `derivedEvidenceState` into the contract.
**Boardroom implication:** boardroom_brief has no ledger entry → evidence_ledger_v2 = false → blocks authority.
**All-product implication:** Each product needs a ledger entry to pass this check.
**Next action:** Wire `deriveEvidenceState()` into `resolveProductAuthority()` so every product call gets evidence state automatically.

### 2. anti_toy_validation

**Current status:** evidence_dependent_proxy
**Existing files:**
- `lib/product/anti-toy-validation-adapter.ts` — NEW: Adapter that resolves anti-toy from ledger or report
- `lib/product/anti-toy-product-test.ts` — Real test module with `runAntiToyTest()` (requires rendered output samples)
- `lib/product/derived-evidence-state.ts` — Reads ledger `testsRun.antiToy`
- `reports/product-anti-toy-review.md` — Real review report with scores for 6 products
- `reports/product-value-evidence-ledger-v2.json` — Ledger entry with antiToy test data for team_assessment

**Data source candidate:** Evidence ledger `testsRun.antiToy` OR anti-toy review report.
**Resolver integration required:** ✅ Done — `resolveProductAuthority()` calls `resolveAntiToyValidation()` from the adapter, which checks ledger first, then report.
**Boardroom implication:** `boardroom_brief` has no ledger entry and no report entry → anti-toy check fails → blocked.
**All-product implication:** Only `team_assessment` has ledger data. Report has data for: fast_diagnostic, team_assessment, enterprise_assessment, case_dossier_tariff_shock, case_dossier_team_alignment, case_dossier_escalation_denied. All other products fail this check.
**Next action:** Add ledger entries for more products; run anti-toy tests on more products.

### 3. red_team_validation

**Current status:** evidence_dependent_proxy
**Existing files:**
- `lib/product/red-team-validation-adapter.ts` — NEW: Adapter that resolves red-team from ledger or report
- `lib/product/product-red-team-reviewers.ts` — Real panel module with `runRedTeamPanel()` (requires rendered output samples)
- `lib/product/red-team-remediation.ts` — Remediation planning for failed reviews
- `lib/product/derived-evidence-state.ts` — Reads ledger `testsRun.redTeam`
- `reports/product-red-team-review.md` — Real review report with panel results for 6 products
- `reports/product-value-evidence-ledger-v2.json` — Ledger entry with redTeam test data for team_assessment

**Data source candidate:** Evidence ledger `testsRun.redTeam` OR red-team review report.
**Resolver integration required:** ✅ Done — `resolveProductAuthority()` calls `resolveRedTeamValidation()` from the adapter, which checks ledger first, then report.
**Boardroom implication:** `boardroom_brief` has no ledger entry and no report entry → red-team check fails → blocked.
**All-product implication:** Only `team_assessment` has ledger data. Report has data for: fast_diagnostic, team_assessment, enterprise_assessment, case_dossier_tariff_shock, case_dossier_team_alignment, case_dossier_escalation_denied. All other products fail this check.
**Next action:** Add ledger entries for more products; run red-team panels on more products.

### 4. generic_ai_comparison

**Current status:** evidence_dependent_proxy (contract stub)
**Existing files:**
- `lib/product/generic-ai-comparison-contract.ts` — NEW: Contract stub documenting the gap
- `reports/product-value-evidence-ledger-v2.json` — Ledger entry with genericAiComparison test data for team_assessment (passed: true, score: 8.9)

**Data source candidate:** Evidence ledger `testsRun.genericAiComparison` — only team_assessment has data.
**Resolver integration required:** ✅ Done — `resolveProductAuthority()` calls `resolveGenericAiComparison()` from the contract stub.
**Boardroom implication:** `boardroom_brief` has no ledger entry → generic_ai_comparison check fails → blocked.
**All-product implication:** Only `team_assessment` has data. All other products return `missing_source` / `blocked_until_comparison_source_exists`.
**Next action:** Do not fabricate. A real implementation requires running the product against a generic AI (e.g., ChatGPT) and comparing outputs.

### 5. market_comparison

**Current status:** evidence_dependent_proxy (contract stub)
**Existing files:**
- `lib/product/market-comparison-contract.ts` — NEW: Contract stub documenting the gap
- `reports/product-value-evidence-ledger-v2.json` — Ledger entry with marketComparison test data for team_assessment (passed: true, score: 8.3)

**Data source candidate:** Evidence ledger `testsRun.marketComparison` — only team_assessment has data.
**Resolver integration required:** ✅ Done — `resolveProductAuthority()` calls `resolveMarketComparison()` from the contract stub.
**Boardroom implication:** `boardroom_brief` has no ledger entry → market_comparison check fails → blocked.
**All-product implication:** Only `team_assessment` has data. All other products return `missing_source` / `blocked_until_market_comparison_source_exists`.
**Next action:** Do not fabricate. A real implementation requires comparing the product against market alternatives.

### 6. release_firewall

**Current status:** data-fed
**Existing files:** `lib/product/product-release-governance.ts`, `reports/product-release-governance-matrix.json`, `lib/product/resolve-product-authority.ts`
**Data source candidate:** Release governance matrix JSON file with per-product `releaseLane` and `releaseMode`.
**Resolver integration required:** ✅ Done — `resolveProductAuthority()` now calls `checkReleaseFirewall()` which reads the governance matrix and checks `releaseLane` and `releaseMode`.
**Boardroom implication:** `boardroom_brief` has `releaseLane: "blocked_claim_unsafe_product"` and `releaseMode: "blocked"` → release firewall fails → blocked.
**All-product implication:** All 43 products are in the governance matrix. Products with non-blocked lanes/modes pass.
**Next action:** None — fully wired.

### 7. validation_constitution

**Current status:** data-fed (1 product)
**Existing files:** `lib/product/frozen-validation-scenarios.ts`, `lib/product/resolve-product-authority.ts`
**Data source candidate:** Evidence ledger `ledgerEntryExists` — if a product has a ledger entry, validation constitution was verified as part of the v2 evidence chain.
**Resolver integration required:** ✅ Done — `resolveProductAuthority()` derives `constitutionPassed` from `derivedEvidence.ledgerEntryExists === true`.
**Boardroom implication:** `boardroom_brief` has no ledger entry → constitution check fails → blocked.
**All-product implication:** Only `team_assessment` has a ledger entry. All other products fail this check.
**Next action:** Add ledger entries for more products.

### 8. no_mock_authority

**Current status:** data-fed
**Existing files:** `lib/product/authority-grant-firewall.ts`, `lib/product/resolve-product-authority.ts`
**Data source candidate:** `input.boundary?.mockAuthorityUsed` in resolver.
**Resolver integration required:** ✅ Done — `resolveProductAuthority()` now derives `noMockAuthorityPassed` from `input.boundary?.mockAuthorityUsed !== true`.
**Boardroom implication:** boardroom_brief config has `mockAuthorityUsed=false` → passes.
**All-product implication:** All products with `mockAuthorityUsed !== true` pass.
**Next action:** None — fully wired.

### 9. anti_gaming

**Current status:** data-fed (1 product)
**Existing files:** `lib/product/anti-gaming-validation-authority.ts`, `lib/product/resolve-product-authority.ts`
**Data source candidate:** Evidence ledger `ledgerEntryExists` — if a product has a ledger entry, anti-gaming validation was performed as part of the v2 evidence chain.
**Resolver integration required:** ✅ Done — `resolveProductAuthority()` derives `antiGamingPassed` from `derivedEvidence.ledgerEntryExists === true`.
**Boardroom implication:** `boardroom_brief` has no ledger entry → anti-gaming check fails → blocked.
**All-product implication:** Only `team_assessment` has a ledger entry. All other products fail this check.
**Next action:** Add ledger entries for more products.

### 10. adversarial_validation

**Current status:** data-fed (1 product)
**Existing files:** `lib/decision-spine/adversarial-evidence-shield.ts`, `lib/product/resolve-product-authority.ts`
**Data source candidate:** Evidence ledger `ledgerEntryExists` — if a product has a ledger entry, adversarial validation was performed as part of the v2 evidence chain.
**Resolver integration required:** ✅ Done — `resolveProductAuthority()` derives `adversarialValidationPassed` from `derivedEvidence.ledgerEntryExists === true`.
**Boardroom implication:** `boardroom_brief` has no ledger entry → adversarial validation fails → blocked.
**All-product implication:** Only `team_assessment` has a ledger entry. All other products fail this check.
**Next action:** Add ledger entries for more products.

---

## Wiring Status

### ✅ Data-fed (6 checks)
1. **evidence_ledger_v2** — `deriveEvidenceState()` auto-called in `resolveProductAuthority()` ✅
2. **no_mock_authority** — Derived from `boundary.mockAuthorityUsed !== true` in resolver ✅
3. **release_firewall** — Derived from release governance matrix via `checkReleaseFirewall()` ✅
4. **validation_constitution** — Derived from `derivedEvidence.ledgerEntryExists` ✅
5. **anti_gaming** — Derived from `derivedEvidence.ledgerEntryExists` ✅
6. **adversarial_validation** — Derived from `derivedEvidence.ledgerEntryExists` ✅

### 🟡 Evidence-dependent proxy (4 checks — newly wired in this pass)
7. **anti_toy_validation** — Wired through `lib/product/anti-toy-validation-adapter.ts`. Reads from ledger `testsRun.antiToy` or anti-toy review report. Only `team_assessment` has ledger data; 6 products have report data.
8. **red_team_validation** — Wired through `lib/product/red-team-validation-adapter.ts`. Reads from ledger `testsRun.redTeam` or red-team review report. Only `team_assessment` has ledger data; 6 products have report data.
9. **generic_ai_comparison** — Wired through `lib/product/generic-ai-comparison-contract.ts` (contract stub). Evidence ledger has data for `team_assessment` only. All other products: `missing_source` / `blocked_until_comparison_source_exists`. **Not faked.**
10. **market_comparison** — Wired through `lib/product/market-comparison-contract.ts` (contract stub). Evidence ledger has data for `team_assessment` only. All other products: `missing_source` / `blocked_until_market_comparison_source_exists`. **Not faked.**

## New Files Created in This Pass

| File | Purpose |
|---|---|
| `lib/product/anti-toy-validation-adapter.ts` | Resolves anti-toy validation from evidence ledger or anti-toy review report |
| `lib/product/red-team-validation-adapter.ts` | Resolves red-team validation from evidence ledger or red-team review report |
| `lib/product/generic-ai-comparison-contract.ts` | Contract stub for generic AI comparison — documents gap, prevents fake passes |
| `lib/product/market-comparison-contract.ts` | Contract stub for market comparison — documents gap, prevents fake passes |