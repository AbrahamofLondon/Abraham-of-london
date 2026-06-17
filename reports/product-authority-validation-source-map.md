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
| release_firewall | contract-only | `lib/product/product-release-governance.ts` | ❌ Not wired to resolver |
| validation_constitution | contract-only | `lib/product/frozen-validation-scenarios.ts` | ❌ Not wired to resolver |
| no_mock_authority | contract-only | `lib/product/authority-grant-firewall.ts` | ❌ Not wired to resolver |
| anti_gaming | contract-only | `lib/product/anti-gaming-validation-authority.ts` | ❌ Not wired to resolver |
| adversarial_validation | contract-only | `lib/decision-spine/adversarial-evidence-shield.ts` | ❌ Not wired to resolver |

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

**Current status:** contract-only
**Existing files:** `lib/product/product-release-governance.ts`
**Data source candidate:** Release governance matrix per product.
**Resolver integration required:** Query release governance state for product.
**Boardroom implication:** boardroom_brief is blocked in release governance → blocked.
**All-product implication:** Each product needs release firewall approval.
**Next action:** Wire release governance query into resolver.

### 7. validation_constitution

**Current status:** contract-only
**Existing files:** `lib/product/frozen-validation-scenarios.ts`
**Data source candidate:** Frozen validation scenarios per product.
**Resolver integration required:** Query frozen scenarios for product.
**Boardroom implication:** No frozen scenarios for boardroom_brief → blocked.
**All-product implication:** Each product needs frozen validation scenarios.
**Next action:** Wire frozen scenarios query into resolver.

### 8. no_mock_authority

**Current status:** contract-only
**Existing files:** `lib/product/authority-grant-firewall.ts`
**Data source candidate:** Authority grant firewall enforces this automatically.
**Resolver integration required:** Check boundary.mockAuthorityUsed in the resolver.
**Boardroom implication:** boardroom_brief config has mockAuthorityUsed=false → passes.
**All-product implication:** All products with mockAuthorityUsed=false pass.
**Next action:** Already enforced by firewall. Resolver checks boundary.

### 9. anti_gaming

**Current status:** contract-only
**Existing files:** `lib/product/anti-gaming-validation-authority.ts`
**Data source candidate:** Anti-gaming validation authority.
**Resolver integration required:** Call anti-gaming check in resolver.
**Boardroom implication:** No anti-gaming result for boardroom_brief → blocked.
**All-product implication:** Each product needs anti-gaming validation.
**Next action:** Wire anti-gaming check into resolver.

### 10. adversarial_validation

**Current status:** contract-only
**Existing files:** `lib/decision-spine/adversarial-evidence-shield.ts`
**Data source candidate:** Adversarial evidence shield results.
**Resolver integration required:** Query adversarial shield for product.
**Boardroom implication:** No adversarial validation for boardroom_brief → blocked.
**All-product implication:** Each product needs adversarial validation.
**Next action:** Wire adversarial shield into resolver.

---

## Wiring Priority

1. **evidence_ledger_v2** — Wire `deriveEvidenceState()` into `resolveProductAuthority()` (highest priority, already has data)
2. **no_mock_authority** — Already enforced by firewall, just needs resolver to check boundary
3. **release_firewall** — Wire release governance query into resolver
4. **validation_constitution** — Wire frozen scenarios query into resolver
5. **anti_gaming** — Wire anti-gaming check into resolver
6. **anti_toy_validation** — Wire anti-toy check into resolver
7. **adversarial_validation** — Wire adversarial shield into resolver
8. **red_team_validation** — Wire red-team query into resolver
9. **generic_ai_comparison** — Keep missing/unknown
10. **market_comparison** — Keep missing/unknown
