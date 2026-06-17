# Unified Product Authority System — Audit Report

**Date:** 2026-06-17
**Branch:** fix/shorts-daily-retention
**Status:** Existing system is comprehensive. No new files needed.

## Phase 1 — Existing Authority/Governance Pieces Found

### Core Authority Contract
- `lib/product/product-authority-contract.ts` — Canonical contract with `ProductAuthorityState`, `ValidationResults`, `EvidenceSource`, `MeasurementBoundary`. States include: `externally_proven_gold_product`, `diagnostic_product`, `judgement_product`, `legacy_validated_pending_v2_revalidation`, `blocked_until_claim_evidenced`, `blocked_until_v2_revalidation`, `measurement_inconclusive`, `pending_reconciliation`, `static_reference`, `internal_only`, `authority_contract_missing`.
- `lib/product/resolve-product-authority.ts` — Resolver (482 lines). Takes product code + evidence state + validation results. Returns full authority contract with blocking reasons.

### Authority Gates
- `lib/product/product-authority-gate.ts` — Gate that checks authority before allowing actions.
- `lib/product/authority-gate-hierarchy.ts` — Hierarchy of authority gates.
- `lib/product/authority-grant-firewall.ts` — Firewall preventing unauthorized authority grants.
- `lib/product/authority-critical-paths.ts` — Critical paths for authority resolution.
- `lib/product/authority-evidence-source-policy.ts` — Policy for evidence sources.
- `lib/product/capability-status-authority.ts` — Capability status authority.
- `lib/product/estate-authority-integrity-lock.ts` — Integrity lock for estate authority.
- `lib/product/instrument-signal-authority.ts` — Signal authority for instruments.
- `lib/product/product-surface-authority.ts` — Surface-level authority.
- `lib/product/signal-authority-composer.ts` — Composes signal authority.
- `lib/product/universal-claim-authority.ts` — Universal claim authority.

### Validation
- `lib/product/anti-gaming-validation-authority.ts` — Anti-gaming validation.
- `lib/product/frozen-validation-scenarios.ts` — Frozen validation scenarios.
- `lib/product/evidence-package-registry.ts` — Evidence package registry (2 valid packages found).
- `lib/product/product-release-governance.ts` — Release governance.
- `lib/product/decision-credit-governance.ts` — Decision credit governance.

### Registries
- `lib/product/product-surface-registry.ts` — Product surface registry.
- `lib/product/product-catalogue-registry.ts` — Product catalogue registry.
- `lib/product/product-artefact-value-registry.ts` — Artifact value registry.
- `lib/product/public-decision-registry.ts` — Public decision registry.

### Commercial
- `lib/commercial/catalog.ts` — Commercial catalog SSOT (43 products).
- `lib/commercial/product-code-map.ts` — Product code mapping.
- `lib/commercial/product-identity.ts` — Product identity.
- `lib/commercial/checkout-governance.ts` — Checkout governance.

### Check Scripts (17 found)
- `scripts/check-commercial-checkout-governance.mjs`
- `scripts/check-commercial-delivery-e2e.mjs`
- `scripts/check-product-artefact-value.mjs`
- `scripts/check-product-authority-contract.mjs`
- `scripts/check-product-catalogue-integrity.mjs`
- `scripts/check-product-claim-recovery.mjs`
- `scripts/check-product-fulfilment-assurance.mjs`
- `scripts/check-product-fulfilment-readiness.mjs`
- `scripts/check-product-gold-release-readiness.mjs`
- `scripts/check-product-gold-upgrade-roadmap.mjs`
- `scripts/check-product-ladder-e2e.mjs`
- `scripts/check-product-moat-integrity.mjs`
- `scripts/check-product-proof-runs.mjs`
- `scripts/check-product-release-governance.mjs`
- `scripts/check-product-release-readiness.mjs`
- `scripts/check-product-storefront-coverage.mjs`
- `scripts/check-product-system-integrity.mjs`

## Phase 2 — Product Authority Matrix

### 43 Products Found
All 43 products are in the commercial catalog (`CATALOG` record in `lib/commercial/catalog.ts`).

### Authority State Distribution (from check-product-system-integrity.mjs)
- **Release Ready Now:** 5 (gmi_quarterly, reporting_monthly, reporting_custom, fast_diagnostic, enterprise_assessment)
- **Blocked:** 2 (boardroom_brief, executive_reporting)
- **Future Ready (Evidence Path):** 36
- **Positive Authority (can grant authority):** 0

### Commercial Status Distribution (from check-commercial-checkout-governance.mjs)
- **Stripe complete:** 25
- **Missing ProductId:** 17
- **Missing PriceId:** 15
- **Stripe present but governance blocked:** 5
- **Manual fulfilment only:** 6
- **Contracted:** 4
- **Free access:** 6

## Phase 3 — Boardroom Brief Orders Status

**Current state:** BLOCKED
- `boardroom_brief` is correctly blocked by the resolver
- Has Stripe price ID but `action=blocked`
- Blocking reasons: claim unsafe, v2 revalidation required, evidence state unknown
- 0/10 validation checks passed
- Fulfilment queue exists
- Orders exist
- Proof state exists
- Commercial/payment state exists

## Phase 4 — Key Findings

### What's Working
1. Product Authority Contract exists and is comprehensive
2. Resolver exists and is wired
3. 43 products tracked across 3 matrices (contract, governance, readiness)
4. Checkout governance is resolver-aware
5. Blocked products are correctly non-purchasable
6. All checkers pass (27/27 tests in system integrity)
7. No products granted positive authority without evidence

### Gaps / Missing Links
1. **Validation checks not wired to real data** — The 10 validation checks (evidence_ledger_v2, anti_toy, red_team, generic_ai_comparison, market_comparison, release_firewall, validation_constitution, no_mock_authority, anti_gaming, adversarial_validation) exist in the contract but report unknown/blocked because no real data sources feed them.
2. **Evidence Ledger v2** — Not yet implemented. Evidence Package Registry has only 2 valid packages.
3. **Boardroom page** — Does not yet display the unified authority status, blocking reasons, or validation checklist from the resolver.
4. **No single authority checker script** — The 17 check scripts cover different aspects but there's no single `check-product-authority-system.mjs` that reports the unified view.
5. **Prisma migration history broken** — Cannot add new models (like ShortInteraction) without repairing the migration chain.

### What's Already Unified
- All 43 products are in one catalog
- All 43 products are in the authority contract matrix
- All 43 products are in the release governance matrix
- All 43 products are in the release readiness matrix
- Checkout governance is resolver-aware
- Storefront coverage is resolver-aware

## Phase 5 — Recommendations

1. **Create `scripts/check-product-authority-system.mjs`** — Single checker that reports unified authority state for all 43 products.
2. **Wire Boardroom page to resolver** — Show authority status, blocking reasons, validation checklist from the unified resolver.
3. **Feed real validation data** — Connect evidence ledger, anti-toy, red-team, etc. to real data sources instead of defaulting to unknown.
4. **Fix Prisma migration chain** — Before adding any new models.
5. **No new files needed** — The contract and resolver already exist. The work is integration and data wiring.
