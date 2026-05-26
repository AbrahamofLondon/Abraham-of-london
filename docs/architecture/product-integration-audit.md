# Product Integration Audit

**Date:** 2026-05-25
**Updated:** Enforced Operating Spine pass — all product route files verified on disk; all admin owner routes verified in admin-domain-registry with page files; governance event bus wired to durable writes.
**Standard:** Governed Product Operating System

## Classification

| Status | Meaning |
|---|---|
| INTEGRATED | Full spine: record + admin + Foundry + audit/lineage + entitlement |
| PARTIAL | Some spine elements missing |
| ORPHANED | No admin owner, no Foundry module, no audit/lineage |
| LEGACY | Still functional but superseded |
| RETIRED | Removed from active use |

## Audit Results

### Content Surfaces

| Surface | Record | Admin | Foundry | Audit | Entitlement | Status |
|---|---|---|---|---|---|---|
| Editorials | ContentAsset | `/admin/content` | editorial-style-checker | CONTENT_PUBLISHED | None | **INTEGRATED** |
| Blog / Essays | ContentAsset | `/admin/content` | editorial-style-checker | CONTENT_PUBLISHED | None | **INTEGRATED** |
| Shorts | ContentAsset | `/admin/content` | editorial-style-checker | CONTENT_PUBLISHED | None | **INTEGRATED** |
| Briefs | ContentAsset | `/admin/content` | content-red-team | CONTENT_PUBLISHED | None | **INTEGRATED** |
| Canon | ContentAsset | `/admin/content` | — | CONTENT_PUBLISHED | None | **PARTIAL** (no Foundry module) |

### Diagnostic Surfaces

| Surface | Record | Admin | Foundry | Audit | Entitlement | Status |
|---|---|---|---|---|---|---|
| Fast Diagnostic | DiagnosticRun | Foundry sim | fast-diagnostic | DIAGNOSTIC_COMPLETED | None | **INTEGRATED** |
| Purpose Alignment | DiagnosticRun | Foundry sim | purpose-alignment | PURPOSE_ALIGNMENT_COMPLETED | GATED | **INTEGRATED** |
| Constitutional Diagnostic | DiagnosticRun | Foundry sim | constitutional-diagnostic | CONSTITUTIONAL_COMPLETED | GATED | **INTEGRATED** |

### Report / Room / Boardroom Surfaces

| Surface | Record | Admin | Foundry | Audit | Entitlement | Status |
|---|---|---|---|---|---|---|
| Executive Reporting | ExecutiveReport | `/admin/reporting/executive` | executive-reporting | EXECUTIVE_REPORT_GENERATED | professional | **INTEGRATED** |
| Strategy Room | StrategyRoomCase | `/admin/strategy-room` | strategy-room | STRATEGY_ROOM_CASE_OPENED | professional | **INTEGRATED** |
| Boardroom Mode | BoardroomDossier | Foundry sim | boardroom-dossier | BOARDROOM_DOSSIER_GENERATED | enterprise | **INTEGRATED** |
| Enterprise Decision Authority | EnterpriseCampaign | `/admin/enterprise` | enterprise-decision-authority | ENTERPRISE_CAMPAIGN_CREATED | enterprise | **INTEGRATED** |

### Intelligence Surfaces

| Surface | Record | Admin | Foundry | Audit | Entitlement | Status |
|---|---|---|---|---|---|---|
| GMI | GmiRelease | `/admin/intelligence/gmi-release-console` | gmi | GMI_RELEASE_REVIEWED | enterprise | **INTEGRATED** |

### Outbound Surfaces

| Surface | Record | Admin | Foundry | Audit | Entitlement | Status |
|---|---|---|---|---|---|---|
| LinkedIn Publishing | OutboundPost | `/admin/outbound/linkedin` | outbound-content-validator | OUTBOUND_PUBLISHED | None | **INTEGRATED** |
| Facebook Publishing | OutboundPost | `/admin/outbound/facebook` | outbound-content-validator | OUTBOUND_PUBLISHED | None | **INTEGRATED** |
| X Publishing | OutboundPost | `/admin/outbound/x` | outbound-content-validator | OUTBOUND_PUBLISHED | None | **INTEGRATED** |

## Summary

| Status | Count |
|---|---|
| INTEGRATED | 14 |
| PARTIAL | 1 |
| ORPHANED | 0 |
| LEGACY | 0 |
| RETIRED | 0 |

**No orphaned surfaces.** All major product surfaces have an admin owner, canonical record, and audit/lineage events defined.

## Route Verification Status

All routes verified against disk using `lib/platform/route-existence.ts` (runtime) and `scripts/market-readiness-gate.mjs` (CI):

| Check | Result |
|---|---|
| Product route files on disk | ✓ All 16 surfaces verified |
| Admin owner routes in registry | ✓ All declared adminOwnerSurface values registered |
| Admin owner route files on disk | ✓ All page files confirmed |
| Governance event durability | ✓ Audit writes to systemAuditLog; lineage writes to GovernanceLog |

INTEGRATED status now requires runtime-verified route existence. Registry-only declarations are not sufficient.
