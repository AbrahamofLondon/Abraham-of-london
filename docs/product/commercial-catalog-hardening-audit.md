# Commercial Catalog Hardening Audit

> Date: 2026-05-09
> Source of truth: lib/commercial/catalog.ts

---

## Product Registry

| Code | Display Name | Market Name | Price | Stripe | Active | Commercial Status | Checkout Safe |
|------|-------------|-------------|-------|--------|--------|-------------------|---------------|
| fast_diagnostic | Fast Diagnostic | Fast Diagnostic | Free | No | Yes | free_controlled | N/A (free) |
| personal_decision_audit | Personal Decision Audit | Personal Decision Audit | £49 | No | **No** | paid | NO — needs Stripe IDs |
| decision_exposure_instrument | Decision Exposure Instrument | — | £29 | Yes | Yes | paid | Yes |
| mandate_clarity_framework | Mandate Clarity Framework | — | £49 | Yes | Yes | paid | Yes |
| intervention_path_selector | Intervention Path Selector | — | £79 | Yes | Yes | paid | Yes |
| operator_decision_pack | Operator Decision Pack | — | £129 | Yes | Yes | paid | Yes |
| case_dossier_tariff_shock | Case Dossier: Tariff Shock | — | Free | Questionable | Yes | free_controlled | N/A |
| case_dossier_team_alignment | Case Dossier: Team Alignment | — | Free | Questionable | Yes | free_controlled | N/A |
| case_dossier_escalation_denied | Case Dossier: Escalation Denied | — | Free | Questionable | Yes | free_controlled | N/A |
| gmi_q1_2026 | GMI Q1 2026 | — | £59 | Yes | Yes | paid | Yes |
| executive_reporting | Executive Reporting | Executive Reporting | £295 | Yes | Yes | paid | Yes |
| diagnostic_report_basic | Diagnostic Report Basic | — | £250 | Yes | **No** | inactive | No |
| diagnostic_report_pro | Diagnostic Report Pro | — | £750 | Yes | **No** | inactive | No |
| executive_reporting_priority | ER Priority | — | £295 | Yes | Yes | paid | Yes — but duplicate |
| strategy_room | Strategy Room | Strategy Room | £750 | Yes | Yes | paid | Yes |
| strategy_room_extended | Strategy Room Extended | — | £1,250 | Yes | Yes | paid | Yes |
| inner_circle | Inner Circle | — | £30/mo | Yes | **No** | inactive | No |
| retainer_core | Retainer Core | — | Contracted | No | **No** | contracted | No |
| retainer_operational | Retainer Operational | — | Contracted | No | **No** | contracted | No |
| retainer_institutional | Retainer Institutional | — | Contracted | No | **No** | contracted | No |

---

## Key Findings

### 1. Fast Diagnostic now has canonical identity
Added to catalog as `fast_diagnostic` with `commercialStatus: "free_controlled"`, `futurePaidCandidate: true`.

### 2. Personal Decision Audit added but inactive
Added as `personal_decision_audit` with `active: false`. Cannot enter checkout until Stripe product/price IDs are created. Legacy names: "Purpose Alignment", "Purpose Alignment Assessment".

### 3. Executive Reporting has duplicate active identity
Both `executive_reporting` and `executive_reporting_priority` are active at £295 with the same Stripe price ID. Recommendation: make `executive_reporting` canonical, treat `executive_reporting_priority` as legacy alias.

### 4. Free products with Stripe IDs
Three case dossiers have `amount: 0` but carry Stripe price IDs. These should be reviewed — if truly free, Stripe checkout is unnecessary friction.

### 5. Retainers correctly inactive
All three retainer products are `active: false` with no Stripe IDs. Cannot accidentally enter checkout.

### 6. pricing-policy.ts is now a thin wrapper
No longer a competing registry. Imports from catalog.ts. Provides formatting and policy queries.

---

## Products Safe to Sell Now

| Code | Price | Stripe Ready |
|------|-------|:------------:|
| decision_exposure_instrument | £29 | Yes |
| mandate_clarity_framework | £49 | Yes |
| intervention_path_selector | £79 | Yes |
| operator_decision_pack | £129 | Yes |
| gmi_q1_2026 | £59 | Yes |
| executive_reporting | £295 | Yes |
| strategy_room | £750 | Yes |
| strategy_room_extended | £1,250 | Yes |

## Products NOT Safe to Sell

| Code | Reason |
|------|--------|
| personal_decision_audit | No Stripe IDs. active: false. |
| diagnostic_report_basic | Inactive. |
| diagnostic_report_pro | Inactive. |
| inner_circle | Inactive. |
| retainer_core | Contracted. No Stripe. |
| retainer_operational | Contracted. No Stripe. |
| retainer_institutional | Contracted. No Stripe. |

---

## Legacy Alias Resolution

| Input | Resolves To |
|-------|------------|
| purpose-alignment | personal_decision_audit |
| purpose_alignment | personal_decision_audit |
| Purpose Alignment | personal_decision_audit |
| fast-diagnostic | fast_diagnostic |
| executive-reporting | executive_reporting |
| strategy-room | strategy_room |
| personal-decision-audit | personal_decision_audit |
