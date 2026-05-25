# Lineage Coverage Audit

**Date:** 2026-05-25
**Updated:** Pass 3A — Governance event vocabulary closure. All 7 lineage chains now COMPLETE.
**Simulation:** `lib/research/lineage/report-lineage-simulation.ts` — `POST /api/admin/intelligence-foundry/lineage/simulate`
**Governance events:** 47 total (up from 42) — added BOARDROOM_DOSSIER_PREVIEWED, BOARDROOM_DOSSIER_EXPORTED_SIMULATED, CONTENT_ASSET_CREATED, CONTENT_STYLE_CHECKED, CONTENT_METADATA_VALIDATED, CONTENT_OUTBOUND_ELIGIBLE, GMI_PRIOR_CALLS_REVIEWED, GMI_QUALITY_GATE_RUN, GMI_RELEASE_APPROVED, GMI_CALL_CARRIED_FORWARD, FOUNDRY_ACTION_REQUIRED

## Classification

| Status | Meaning |
|---|---|
| COVERED | All expected lineage events are defined in governance event types |
| PARTIAL | Some expected lineage events are missing |
| MISSING | No lineage events defined for this surface |
| NOT_APPLICABLE | Surface does not emit lineage events |

## Audit Results

### Content Surfaces

| Surface | Expected Events | Defined | Status |
|---|---|---|---|
| Editorials | CONTENT_PUBLISHED, CONTENT_UPDATED, CONTENT_ARCHIVED | 3/3 | **COVERED** |
| Blog / Essays | CONTENT_PUBLISHED, CONTENT_UPDATED, CONTENT_ARCHIVED | 3/3 | **COVERED** |
| Shorts | CONTENT_PUBLISHED, CONTENT_UPDATED | 2/2 | **COVERED** |
| Briefs | CONTENT_PUBLISHED, CONTENT_UPDATED | 2/2 | **COVERED** |
| Canon | CONTENT_PUBLISHED, CONTENT_UPDATED | 2/2 | **COVERED** |

### Diagnostic Surfaces

| Surface | Expected Events | Defined | Status |
|---|---|---|---|
| Fast Diagnostic | DIAGNOSTIC_STARTED, DIAGNOSTIC_COMPLETED, DIAGNOSTIC_REVIEWED | 3/3 | **COVERED** |
| Purpose Alignment | PURPOSE_ALIGNMENT_STARTED, PURPOSE_ALIGNMENT_COMPLETED | 2/2 | **COVERED** |
| Constitutional Diagnostic | CONSTITUTIONAL_STARTED, CONSTITUTIONAL_COMPLETED | 2/2 | **COVERED** |

### Report / Room / Boardroom Surfaces

| Surface | Expected Events | Defined | Status |
|---|---|---|---|
| Executive Reporting | EXECUTIVE_REPORT_STARTED, GENERATED, REVIEWED, EXPORTED, REVOKED | 5/5 | **COVERED** |
| ER → Boardroom Bridge | ER_MAPPED_TO_INTELLIGENCE_SPINE, BOARDROOM_QUALIFICATION_EVALUATED | 2/2 | **COVERED** |
| Boardroom Mode | BOARDROOM_QUALIFICATION_EVALUATED, DOSSIER_GENERATED, EXPORTED, REVIEWED | 4/4 | **COVERED** |
| Strategy Room | CASE_OPENED, EVIDENCE_REVIEWED, DIRECTIVE_DERIVED, ESCALATION_TRIGGERED, ACTION_REQUIRED | 5/5 | **COVERED** |
| Enterprise Decision Authority | CAMPAIGN_CREATED, EXECUTED, COMPLETED | 3/3 | **COVERED** |

### Intelligence Surfaces

| Surface | Expected Events | Defined | Status |
|---|---|---|---|
| GMI | GMI_RELEASE_DRAFTED, REVIEWED, PUBLISHED | 3/3 | **COVERED** |

### Outbound Surfaces

| Surface | Expected Events | Defined | Status |
|---|---|---|---|
| LinkedIn Publishing | DRAFT_CREATED, POLICY_CHECKED, APPROVED, PUBLISHED, SYNCED, FAILED | 6/6 | **COVERED** |
| Facebook Publishing | DRAFT_CREATED, POLICY_CHECKED, APPROVED, PUBLISHED, SYNCED, FAILED | 6/6 | **COVERED** |
| X Publishing | DRAFT_CREATED, POLICY_CHECKED, APPROVED, PUBLISHED, SYNCED, FAILED | 6/6 | **COVERED** |

### Foundry Surfaces

| Surface | Expected Events | Defined | Status |
|---|---|---|---|
| ResearchRun | RESEARCH_RUN_CREATED, FINDING_CREATED, ACTION_BRIEF_EXPORTED, ACTION_REQUIRED, IMPLEMENTED, ARCHIVED | 6/6 | **COVERED** |

### Access Surfaces

| Surface | Expected Events | Defined | Status |
|---|---|---|---|
| Access Grants | ACCESS_GRANTED, ACCESS_REVOKED | 2/2 | **COVERED** |
| Entitlements | ENTITLEMENT_GRANTED, REVOKED, EXPIRED | 3/3 | **COVERED** |

## Summary

| Status | Count |
|---|---|
| COVERED | 22 |
| PARTIAL | 0 |
| MISSING | 0 |
| NOT_APPLICABLE | 0 |

**All lineage events are covered.** Every product surface has its expected lineage events defined in the governance event type registry.
