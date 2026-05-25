# Product Health Dashboard

**Date:** 2026-05-25
**Pass:** 4 — Product Health Dashboard

## Purpose

The Product Health Dashboard is the live integration map for the governed product operating system. It answers:

- Which product surfaces are fully governed?
- Which are partial?
- Which are exposed?
- Which are missing admin ownership, lineage, audit, Foundry coverage, entitlement, or outbound rules?
- Which issues are blocking release?

This is not a decorative status page. It is the operator's map of the whole platform.

## Health Status Rules

| Status | Meaning |
|---|---|
| **GREEN** | All required registry relationships exist and runtime/test coverage exists where applicable |
| **AMBER** | Declared but partial, simulated only, or missing live wiring |
| **RED** | Required relationship missing or critical open finding exists |
| **GREY** | Not applicable, retired, planned, or intentionally reference-only |

### What GREEN Means

- Product surface exists in product-ladder-registry
- Canonical record exists in canonical-record-registry
- Admin owner route exists in admin-domain-registry
- Foundry module is PRODUCTION_CALLABLE (if declared)
- Lineage simulation chain is COMPLETE (if applicable)
- All declared governance events are registered in governance-event-types
- Entitlement is declared for gated products
- Outbound governance events exist for outbound-eligible products
- No simulation-only events are treated as real export coverage

### What AMBER Means

- Lineage chain is PARTIAL (some events not yet registered)
- Foundry module exists but is not PRODUCTION_CALLABLE
- Some declared governance events are not yet registered
- Simulation-only events present (supports Foundry/lineage readiness, not production export)
- Admin route declared but not found in admin-domain-registry

### What RED Means

- Product surface not found in product-ladder-registry
- Canonical record not found in canonical-record-registry
- No admin owner surface declared
- Foundry module declared but not found in engine-registry
- Lineage chain is BROKEN
- None of the declared governance events are registered
- Gated product without entitlement declaration
- Unresolved CRITICAL/HIGH Foundry finding

### Why Registry Presence Alone Is Insufficient

A surface cannot be GREEN merely because it appears in a registry. The health rules check:

1. That the registry entry exists
2. That the referenced relationships (canonical record, admin route, Foundry module, governance events) also exist
3. That lineage simulation is COMPLETE
4. That simulation-only events are not mistaken for real export coverage

### How Simulation-Only Coverage Is Treated

Simulation-only Boardroom events (`BOARDROOM_DOSSIER_PREVIEWED`, `BOARDROOM_DOSSIER_EXPORTED_SIMULATED`) support Foundry/lineage readiness but not production export readiness. Surfaces with only simulation events receive AMBER status for the relevant dimension.

### How ResearchRun Findings Affect Product Health

- CRITICAL unresolved finding → product status RED
- HIGH unresolved finding → product status RED or AMBER depending on asset risk
- MEDIUM unresolved finding → AMBER
- Implemented/resolved finding → no blocker
- Deferred finding → AMBER unless owner-approved

## Health Rules

| # | Rule | Source |
|---|---|---|
| 1 | Product surface exists in product-ladder-registry | `product-health-rules.ts` |
| 2 | Canonical record exists in canonical-record-registry | `product-health-rules.ts` |
| 3 | Admin owner route exists in admin-domain-registry | `product-health-rules.ts` |
| 4 | Foundry module/engine exists where required | `product-health-rules.ts` |
| 5 | Lineage simulation chain is COMPLETE where applicable | `product-health-rules.ts` |
| 6 | Governance event vocabulary covers declared events | `product-health-rules.ts` |
| 7 | Live governance event wiring exists for relevant domains | `product-health-rules.ts` |
| 8 | Entitlement requirement is declared for gated products | `product-health-rules.ts` |
| 9 | Outbound eligibility is declared where relevant | `product-health-rules.ts` |
| 10 | Open HIGH/CRITICAL ResearchRun findings affect status | `product-health-rules.ts` |

## API

```
GET /api/admin/intelligence-foundry/product-health
  → { ok, summary: { green, amber, red, grey, total, releaseBlockers }, surfaces: [...] }

GET /api/admin/intelligence-foundry/product-health?surfaceId=executive-reporting
  → { ok, surface: { ... } }
```

## Page

```
/app/admin/intelligence-foundry/product-health
```

## Files

| File | Purpose |
|---|---|
| `lib/research/product-health/product-health-service.ts` | Health service: overview, per-surface, summary |
| `lib/research/product-health/product-health-rules.ts` | Health rule engine: 10 rules with aggregate status |
| `app/api/admin/intelligence-foundry/product-health/route.ts` | Admin-only API |
| `app/admin/intelligence-foundry/product-health/page.tsx` | Dashboard page |
| `tests/research/product-health/product-health-rules.test.ts` | Rule engine tests |
| `tests/research/product-health/product-health-service.test.ts` | Service tests |
| `tests/research/canary/product-health-registry-consistency.test.ts` | Registry consistency canary |
