# Product Authority Validation Source Map

**Date:** 2026-06-17
**Status:** Evidence wiring phase

## Validation Check Status Summary

| Check | Status | Source File | Data Fed? |
|---|---|---|---|
| evidence_ledger_v2 | data-fed (1 product) | `lib/product/derived-evidence-state.ts` + `reports/product-value-evidence-ledger-v2.json` | ✅ team_assessment only |
| anti_toy_validation | contract-only | `lib/product/anti-gaming-validation-authority.ts` | ❌ Not wired to resolver |
| red_team_validation | contract-only | Foundry red-team runs exist | ❌ Not wired to resolver |
| generic_ai_comparison | missing | No implementation found | ❌ |
| market_comparison | missing | No implementation found | ❌ |
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

**Current status:** contract-only
**Existing files:** `lib/product/anti-gaming-validation-authority.ts`
**Data source candidate:** Anti-gaming validation authority can be called per-product.
**Resolver integration required:** Call anti-toy check in resolver and pass result to validationResults.
**Boardroom implication:** boardroom_brief has no anti-toy result → blocked.
**All-product implication:** Each product needs anti-toy validation run.
**Next action:** Wire anti-toy check into resolver's validation results.

### 3. red_team_validation

**Current status:** contract-only
**Existing files:** Foundry red-team runs (`lib/research/engines/content-red-team-adapter.ts`)
**Data source candidate:** Foundry red-team results per product.
**Resolver integration required:** Query latest red-team run for product code.
**Boardroom implication:** No red-team run for boardroom_brief → blocked.
**All-product implication:** Each product needs red-team validation.
**Next action:** Wire red-team query into resolver.

### 4. generic_ai_comparison

**Current status:** missing
**Existing files:** None
**Data source candidate:** Would need AI comparison framework.
**Resolver integration required:** Would need new implementation.
**Boardroom implication:** Unknown/blocked until implemented.
**All-product implication:** All products blocked on this check.
**Next action:** Keep as missing/unknown. Do not fabricate.

### 5. market_comparison

**Current status:** missing
**Existing files:** None
**Data source candidate:** Would need market comparison framework.
**Resolver integration required:** Would need new implementation.
**Boardroom implication:** Unknown/blocked until implemented.
**All-product implication:** All products blocked on this check.
**Next action:** Keep as missing/unknown. Do not fabricate.

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

### Remaining for future passes
7. **anti_toy_validation** — Contract-only. `lib/product/anti-gaming-validation-authority.ts` exists but not wired to resolver.
8. **red_team_validation** — Contract-only. Foundry red-team runs exist but not wired to resolver.
9. **generic_ai_comparison** — Missing. No implementation exists.
10. **market_comparison** — Missing. No implementation exists.
