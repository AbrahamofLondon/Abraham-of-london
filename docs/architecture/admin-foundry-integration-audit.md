# Admin ↔ Foundry Integration Audit

**Date:** 2026-05-25

## Classification

| Status | Meaning |
|---|---|
| INTEGRATED | Foundry module links to admin route and product surface |
| PARTIAL | Foundry module exists but admin/product linkage is incomplete |
| ORPHANED | Foundry module has no admin or product surface |
| LEGACY | Foundry module superseded but still present |
| RETIRED | Removed from active use |

## Audit Results

### Foundry Engines

| Engine | Product Surface | Admin Route | Status |
|---|---|---|---|
| fast-diagnostic | Fast Diagnostic | `/admin/intelligence-foundry/simulation/fast-diagnostic` | **INTEGRATED** |
| purpose-alignment | Purpose Alignment | `/admin/intelligence-foundry/simulation/fast-diagnostic` | **INTEGRATED** |
| constitutional-diagnostic | Constitutional Diagnostic | `/admin/intelligence-foundry/simulation/constitutional-diagnostic` | **INTEGRATED** |
| executive-reporting | Executive Reporting | `/admin/reporting/executive` | **INTEGRATED** |
| strategy-room | Strategy Room | `/admin/strategy-room` | **INTEGRATED** |
| boardroom-dossier | Boardroom Mode | `/admin/intelligence-foundry/simulation/boardroom-mode` | **INTEGRATED** |
| enterprise-decision-authority | Enterprise Decision Authority | `/admin/enterprise` | **INTEGRATED** |
| gmi | GMI | `/admin/intelligence/gmi-release-console` | **INTEGRATED** |
| editorial-style-checker | Editorials, Blog, Shorts | `/admin/content` | **INTEGRATED** |
| content-red-team | Briefs | `/admin/content` | **INTEGRATED** |
| outbound-content-validator | LinkedIn, Facebook, X | `/admin/outbound/*` | **INTEGRATED** |
| outbound-policy-gate | LinkedIn, Facebook, X | `/admin/outbound/*` | **INTEGRATED** |
| executive-report-boardroom-bridge | ER → Boardroom | `/admin/intelligence-foundry/simulation/executive-report-boardroom-bridge` | **INTEGRATED** |
| pattern-recurrence | Diagnostics | `/admin/intelligence-foundry/simulation/fast-diagnostic` | **INTEGRATED** |
| enforcement-gates | CI/CD | `/admin/intelligence-foundry/engines` | **PARTIAL** (no direct product surface) |
| retainer-readiness | Retainer Oversight | `/admin/retainer-readiness` | **INTEGRATED** |
| report-lineage | Report Lineage | `/admin/reporting/lineage` | **INTEGRATED** |
| cohort-privacy | Internal | — | **ORPHANED** (no product surface, reference only) |
| reference-ogr-engine | Reference | — | **ORPHANED** (reference model, no product surface) |
| contradiction-detection | — | — | **ORPHANED** (documentation only, no implementation) |
| cost-of-delay | — | — | **ORPHANED** (documentation only, no implementation) |
| decision-credit | — | — | **ORPHANED** (documentation only, no implementation) |
| consequence-engine | — | — | **ORPHANED** (documentation only, no implementation) |

### Foundry Modules

| Module | Engine | Admin Route | Status |
|---|---|---|---|
| scenario-workbench | Multiple | `/admin/intelligence-foundry/scenario` | **INTEGRATED** |
| research-run-vault | — | `/admin/intelligence-foundry/runs` | **INTEGRATED** |
| content-red-team | editorial-style-checker | `/admin/intelligence-foundry/red-team/content` | **INTEGRATED** |
| security-red-team | — | `/admin/intelligence-foundry/red-team/security` | **INTEGRATED** |
| outbound-narrative-range | outbound-content-validator | `/admin/intelligence-foundry/outbound` | **INTEGRATED** |
| content-category-lab | editorial-style-checker | `/admin/intelligence-foundry/content` | **INTEGRATED** |
| market-response-lab | — | `/admin/intelligence-foundry/market` | **INTEGRATED** |
| engine-testing-range | — | `/admin/intelligence-foundry/engines` | **INTEGRATED** |
| performance-range | Multiple | `/admin/intelligence-foundry/performance` | **INTEGRATED** |
| chaos-range | — | `/admin/intelligence-foundry/chaos` | **INTEGRATED** |
| data-poisoning-lab | — | `/admin/intelligence-foundry/data-poisoning` | **INTEGRATED** |
| foundry-health | — | `/admin/intelligence-foundry/health` | **INTEGRATED** |
| trash-day | — | `/admin/intelligence-foundry/trash-day` | **INTEGRATED** |
| fast-diagnostic-sim | fast-diagnostic | `/admin/intelligence-foundry/simulation/fast-diagnostic` | **INTEGRATED** |
| strategy-room-sim | strategy-room | `/admin/intelligence-foundry/simulation/strategy-room` | **INTEGRATED** |
| boardroom-mode-sim | boardroom-dossier | `/admin/intelligence-foundry/simulation/boardroom-mode` | **INTEGRATED** |
| executive-reporting-sim | executive-reporting | `/admin/intelligence-foundry/simulation/executive-reporting` | **INTEGRATED** |
| er-boardroom-bridge-sim | executive-report-boardroom-bridge | `/admin/intelligence-foundry/simulation/executive-report-boardroom-bridge` | **INTEGRATED** |

## Summary

| Status | Engines | Modules |
|---|---|---|
| INTEGRATED | 14 | 18 |
| PARTIAL | 1 | 0 |
| ORPHANED | 7 | 0 |

**Orphaned engines** are all DOCUMENTATION_ONLY or reference models — they have no implementation, no product surface, and no admin route. This is expected for planned/retired items.
