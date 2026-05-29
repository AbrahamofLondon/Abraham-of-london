# Institutional Operating Alignment Audit

## Executive summary

This is a report-only static institutional control audit. It verifies route existence, source-level auth evidence, registry parity, product ladder wiring, Foundry linkage, outbound controls, governance event durability indicators, commercial delivery indicators, and status-label truthfulness. It does not modify product code or content publication status.

Registry presence alone was not counted as integration. Surfaces are treated as aligned only when route, access policy, registry owner, canonical record, implementation evidence, governance event, durable audit/failure path, and truthful status language are visible in source.

## Counts

- Total surfaces audited: 1426
- Total routes audited: 919
- Total admin surfaces audited: 163
- Total product surfaces audited: 236
- Total Foundry engines/adapters audited: 125
- Total outbound flows audited: 100
- Total governance events referenced: 78
- Registry route references scanned: 153

## RED findings

- None detected by this static pass.

## AMBER findings

- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/delivery-log has no explicit owner in scanned registries (/api/admin/boardroom-delivery/delivery-log) - app/api/admin/boardroom-delivery/delivery-log/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/generate-link has no explicit owner in scanned registries (/api/admin/boardroom-delivery/generate-link) - app/api/admin/boardroom-delivery/generate-link/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/generate has no explicit owner in scanned registries (/api/admin/boardroom-delivery/generate) - app/api/admin/boardroom-delivery/generate/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/grant-access has no explicit owner in scanned registries (/api/admin/boardroom-delivery/grant-access) - app/api/admin/boardroom-delivery/grant-access/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/resend-link has no explicit owner in scanned registries (/api/admin/boardroom-delivery/resend-link) - app/api/admin/boardroom-delivery/resend-link/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/revoke-access has no explicit owner in scanned registries (/api/admin/boardroom-delivery/revoke-access) - app/api/admin/boardroom-delivery/revoke-access/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/revoke-link has no explicit owner in scanned registries (/api/admin/boardroom-delivery/revoke-link) - app/api/admin/boardroom-delivery/revoke-link/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery has no explicit owner in scanned registries (/api/admin/boardroom-delivery) - app/api/admin/boardroom-delivery/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/tokens/[dossierId] has no explicit owner in scanned registries (/api/admin/boardroom-delivery/tokens/[dossierId]) - app/api/admin/boardroom-delivery/tokens/[dossierId]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/campaigns/[id]/report-data has no explicit owner in scanned registries (/api/admin/campaigns/[id]/report-data) - app/api/admin/campaigns/[id]/report-data/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/campaigns/[id]/report/export-json has no explicit owner in scanned registries (/api/admin/campaigns/[id]/report/export-json) - app/api/admin/campaigns/[id]/report/export-json/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/campaigns/[id]/report/pdf has no explicit owner in scanned registries (/api/admin/campaigns/[id]/report/pdf) - app/api/admin/campaigns/[id]/report/pdf/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/campaigns/[id]/report has no explicit owner in scanned registries (/api/admin/campaigns/[id]/report) - app/api/admin/campaigns/[id]/report/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/campaigns/[id] has no explicit owner in scanned registries (/api/admin/campaigns/[id]) - app/api/admin/campaigns/[id]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/campaigns has no explicit owner in scanned registries (/api/admin/campaigns) - app/api/admin/campaigns/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/commercial has no explicit owner in scanned registries (/api/admin/commercial) - app/api/admin/commercial/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision-intelligence has no explicit owner in scanned registries (/api/admin/decision-intelligence) - app/api/admin/decision-intelligence/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/contextual-efficacy has no explicit owner in scanned registries (/api/admin/decision/contextual-efficacy) - app/api/admin/decision/contextual-efficacy/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/contextual-ranking has no explicit owner in scanned registries (/api/admin/decision/contextual-ranking) - app/api/admin/decision/contextual-ranking/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/efficacy has no explicit owner in scanned registries (/api/admin/decision/efficacy) - app/api/admin/decision/efficacy/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/governance has no explicit owner in scanned registries (/api/admin/decision/governance) - app/api/admin/decision/governance/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/performance has no explicit owner in scanned registries (/api/admin/decision/performance) - app/api/admin/decision/performance/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/rebuild-contextual-efficacy has no explicit owner in scanned registries (/api/admin/decision/rebuild-contextual-efficacy) - app/api/admin/decision/rebuild-contextual-efficacy/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/rebuild-efficacy has no explicit owner in scanned registries (/api/admin/decision/rebuild-efficacy) - app/api/admin/decision/rebuild-efficacy/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/rebuild-governance-alerts has no explicit owner in scanned registries (/api/admin/decision/rebuild-governance-alerts) - app/api/admin/decision/rebuild-governance-alerts/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/rebuild-performance has no explicit owner in scanned registries (/api/admin/decision/rebuild-performance) - app/api/admin/decision/rebuild-performance/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/signal-registry has no explicit owner in scanned registries (/api/admin/decision/signal-registry) - app/api/admin/decision/signal-registry/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/dev-login has no explicit owner in scanned registries (/api/admin/dev-login) - app/api/admin/dev-login/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/enterprise-foundation has no explicit owner in scanned registries (/api/admin/enterprise-foundation) - app/api/admin/enterprise-foundation/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/executive-report-delivery/resend-link has no explicit owner in scanned registries (/api/admin/executive-report-delivery/resend-link) - app/api/admin/executive-report-delivery/resend-link/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/executive-report-delivery/revoke-link has no explicit owner in scanned registries (/api/admin/executive-report-delivery/revoke-link) - app/api/admin/executive-report-delivery/revoke-link/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/chaos/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/chaos/run) - app/api/admin/intelligence-foundry/chaos/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/ci-gate has no explicit owner in scanned registries (/api/admin/intelligence-foundry/ci-gate) - app/api/admin/intelligence-foundry/ci-gate/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/data-poisoning/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/data-poisoning/run) - app/api/admin/intelligence-foundry/data-poisoning/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/debug has no explicit owner in scanned registries (/api/admin/intelligence-foundry/debug) - app/api/admin/intelligence-foundry/debug/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/boardroom-mode/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/boardroom-mode/run) - app/api/admin/intelligence-foundry/engines/boardroom-mode/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run) - app/api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/executive-reporting/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/executive-reporting/run) - app/api/admin/intelligence-foundry/engines/executive-reporting/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/fast-diagnostic/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/fast-diagnostic/run) - app/api/admin/intelligence-foundry/engines/fast-diagnostic/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/request-adapter has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/request-adapter) - app/api/admin/intelligence-foundry/engines/request-adapter/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines) - app/api/admin/intelligence-foundry/engines/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/strategy-room/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/strategy-room/run) - app/api/admin/intelligence-foundry/engines/strategy-room/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/health has no explicit owner in scanned registries (/api/admin/intelligence-foundry/health) - app/api/admin/intelligence-foundry/health/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/lineage/simulate has no explicit owner in scanned registries (/api/admin/intelligence-foundry/lineage/simulate) - app/api/admin/intelligence-foundry/lineage/simulate/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/market/analyze has no explicit owner in scanned registries (/api/admin/intelligence-foundry/market/analyze) - app/api/admin/intelligence-foundry/market/analyze/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/modules has no explicit owner in scanned registries (/api/admin/intelligence-foundry/modules) - app/api/admin/intelligence-foundry/modules/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/performance/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/performance/run) - app/api/admin/intelligence-foundry/performance/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/product-health has no explicit owner in scanned registries (/api/admin/intelligence-foundry/product-health) - app/api/admin/intelligence-foundry/product-health/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/promotion has no explicit owner in scanned registries (/api/admin/intelligence-foundry/promotion) - app/api/admin/intelligence-foundry/promotion/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/red-team/content/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/red-team/content/run) - app/api/admin/intelligence-foundry/red-team/content/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/red-team/security/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/red-team/security/run) - app/api/admin/intelligence-foundry/red-team/security/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/archive has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/archive) - app/api/admin/intelligence-foundry/runs/[id]/archive/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/defer has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/defer) - app/api/admin/intelligence-foundry/runs/[id]/defer/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/export-brief has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/export-brief) - app/api/admin/intelligence-foundry/runs/[id]/export-brief/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/implement has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/implement) - app/api/admin/intelligence-foundry/runs/[id]/implement/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/replay has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/replay) - app/api/admin/intelligence-foundry/runs/[id]/replay/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/resurrect has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/resurrect) - app/api/admin/intelligence-foundry/runs/[id]/resurrect/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id] has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]) - app/api/admin/intelligence-foundry/runs/[id]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs) - app/api/admin/intelligence-foundry/runs/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/trash-day has no explicit owner in scanned registries (/api/admin/intelligence-foundry/trash-day) - app/api/admin/intelligence-foundry/trash-day/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/positioning has no explicit owner in scanned registries (/api/admin/positioning) - app/api/admin/positioning/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/analytics/executive-report has no explicit owner in scanned registries (/api/analytics/executive-report) - app/api/analytics/executive-report/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/analytics/journey has no explicit owner in scanned registries (/api/analytics/journey) - app/api/analytics/journey/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/audit/[id]/submit has no explicit owner in scanned registries (/api/audit/[id]/submit) - app/api/audit/[id]/submit/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/audit/log has no explicit owner in scanned registries (/api/audit/log) - app/api/audit/log/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/audit/submit has no explicit owner in scanned registries (/api/audit/submit) - app/api/audit/submit/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/auth/sovereign has no explicit owner in scanned registries (/api/auth/sovereign) - app/api/auth/sovereign/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/boardroom/dossier/[dossierId] has no explicit owner in scanned registries (/api/boardroom/dossier/[dossierId]) - app/api/boardroom/dossier/[dossierId]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/boardroom/dossier/pdf has no explicit owner in scanned registries (/api/boardroom/dossier/pdf) - app/api/boardroom/dossier/pdf/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/boardroom/dossier has no explicit owner in scanned registries (/api/boardroom/dossier) - app/api/boardroom/dossier/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/calibration/ingest has no explicit owner in scanned registries (/api/calibration/ingest) - app/api/calibration/ingest/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/campaigns/[id]/invite has no explicit owner in scanned registries (/api/campaigns/[id]/invite) - app/api/campaigns/[id]/invite/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/campaigns/[id]/nudge has no explicit owner in scanned registries (/api/campaigns/[id]/nudge) - app/api/campaigns/[id]/nudge/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/campaigns/[id]/report/json has no explicit owner in scanned registries (/api/campaigns/[id]/report/json) - app/api/campaigns/[id]/report/json/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/campaigns/[id]/report/pdf-file has no explicit owner in scanned registries (/api/campaigns/[id]/report/pdf-file) - app/api/campaigns/[id]/report/pdf-file/route.tsx
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/campaigns/[id]/report/pdf has no explicit owner in scanned registries (/api/campaigns/[id]/report/pdf) - app/api/campaigns/[id]/report/pdf/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/campaigns/[id]/report has no explicit owner in scanned registries (/api/campaigns/[id]/report) - app/api/campaigns/[id]/report/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/client-portal/actions has no explicit owner in scanned registries (/api/client-portal/actions) - app/api/client-portal/actions/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/client-portal/deliverables has no explicit owner in scanned registries (/api/client-portal/deliverables) - app/api/client-portal/deliverables/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/client-portal/dossier-redirect has no explicit owner in scanned registries (/api/client-portal/dossier-redirect) - app/api/client-portal/dossier-redirect/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/client-portal/send-link has no explicit owner in scanned registries (/api/client-portal/send-link) - app/api/client-portal/send-link/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/client-portal/verify has no explicit owner in scanned registries (/api/client-portal/verify) - app/api/client-portal/verify/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/client/actions/[actionId] has no explicit owner in scanned registries (/api/client/actions/[actionId]) - app/api/client/actions/[actionId]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/client/portal has no explicit owner in scanned registries (/api/client/portal) - app/api/client/portal/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/client/reports/[reportId] has no explicit owner in scanned registries (/api/client/reports/[reportId]) - app/api/client/reports/[reportId]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/contracts/verify has no explicit owner in scanned registries (/api/contracts/verify) - app/api/contracts/verify/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/cron/calibration has no explicit owner in scanned registries (/api/cron/calibration) - app/api/cron/calibration/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/cron/escalation has no explicit owner in scanned registries (/api/cron/escalation) - app/api/cron/escalation/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/cron/snapshot has no explicit owner in scanned registries (/api/cron/snapshot) - app/api/cron/snapshot/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/decision/credit-score has no explicit owner in scanned registries (/api/decision/credit-score) - app/api/decision/credit-score/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/decision/guidance has no explicit owner in scanned registries (/api/decision/guidance) - app/api/decision/guidance/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/decision/metadata-audit has no explicit owner in scanned registries (/api/decision/metadata-audit) - app/api/decision/metadata-audit/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/demo/governed-decision has no explicit owner in scanned registries (/api/demo/governed-decision) - app/api/demo/governed-decision/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/download/[token] has no explicit owner in scanned registries (/api/download/[token]) - app/api/download/[token]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/downloads/[slug] has no explicit owner in scanned registries (/api/downloads/[slug]) - app/api/downloads/[slug]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/editorials/[slug] has no explicit owner in scanned registries (/api/editorials/[slug]) - app/api/editorials/[slug]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/entitlements has no explicit owner in scanned registries (/api/entitlements) - app/api/entitlements/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/evidence/case-draft has no explicit owner in scanned registries (/api/evidence/case-draft) - app/api/evidence/case-draft/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/evidence/eligibility has no explicit owner in scanned registries (/api/evidence/eligibility) - app/api/evidence/eligibility/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/executive-reporting/entitlements has no explicit owner in scanned registries (/api/executive-reporting/entitlements) - app/api/executive-reporting/entitlements/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/executive-reporting/export/boardroom-pdf has no explicit owner in scanned registries (/api/executive-reporting/export/boardroom-pdf) - app/api/executive-reporting/export/boardroom-pdf/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/executive-reporting/export/intervention has no explicit owner in scanned registries (/api/executive-reporting/export/intervention) - app/api/executive-reporting/export/intervention/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/executive-reporting/export/pdf has no explicit owner in scanned registries (/api/executive-reporting/export/pdf) - app/api/executive-reporting/export/pdf/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/executive-reporting/run has no explicit owner in scanned registries (/api/executive-reporting/run) - app/api/executive-reporting/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/executive/snapshot has no explicit owner in scanned registries (/api/executive/snapshot) - app/api/executive/snapshot/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/inner-circle/admin/export has no explicit owner in scanned registries (/api/inner-circle/admin/export) - app/api/inner-circle/admin/export/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/inner-circle/issue has no explicit owner in scanned registries (/api/inner-circle/issue) - app/api/inner-circle/issue/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/inner-circle/verify has no explicit owner in scanned registries (/api/inner-circle/verify) - app/api/inner-circle/verify/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/interactions/toggle has no explicit owner in scanned registries (/api/interactions/toggle) - app/api/interactions/toggle/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/interpret has no explicit owner in scanned registries (/api/interpret) - app/api/interpret/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/leads/fuse has no explicit owner in scanned registries (/api/leads/fuse) - app/api/leads/fuse/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/library/download has no explicit owner in scanned registries (/api/library/download) - app/api/library/download/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/predictive/insights/[campaignId] has no explicit owner in scanned registries (/api/predictive/insights/[campaignId]) - app/api/predictive/insights/[campaignId]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/premium/forensics/attribution has no explicit owner in scanned registries (/api/premium/forensics/attribution) - app/api/premium/forensics/attribution/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/pulse/submit has no explicit owner in scanned registries (/api/pulse/submit) - app/api/pulse/submit/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/retainers/contracts has no explicit owner in scanned registries (/api/retainers/contracts) - app/api/retainers/contracts/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/retainers/decisions has no explicit owner in scanned registries (/api/retainers/decisions) - app/api/retainers/decisions/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/retainers/enforcement-cycles has no explicit owner in scanned registries (/api/retainers/enforcement-cycles) - app/api/retainers/enforcement-cycles/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/retainers/surface has no explicit owner in scanned registries (/api/retainers/surface) - app/api/retainers/surface/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/sovereign/auth has no explicit owner in scanned registries (/api/sovereign/auth) - app/api/sovereign/auth/route.ts
- ... 418 additional finding(s) in JSON reports.

## GREEN confirmations

- Route inventory was generated from app/** and pages/** rather than registry declarations.
- Vercel route integrity remains a separate build-output proof and is not treated as product integration proof.
- Private vault delivery is manifest-scoped in the currently merged rollback branch.

## Orphaned surfaces

- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/delivery-log has no explicit owner in scanned registries (/api/admin/boardroom-delivery/delivery-log) - app/api/admin/boardroom-delivery/delivery-log/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/generate-link has no explicit owner in scanned registries (/api/admin/boardroom-delivery/generate-link) - app/api/admin/boardroom-delivery/generate-link/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/generate has no explicit owner in scanned registries (/api/admin/boardroom-delivery/generate) - app/api/admin/boardroom-delivery/generate/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/grant-access has no explicit owner in scanned registries (/api/admin/boardroom-delivery/grant-access) - app/api/admin/boardroom-delivery/grant-access/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/resend-link has no explicit owner in scanned registries (/api/admin/boardroom-delivery/resend-link) - app/api/admin/boardroom-delivery/resend-link/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/revoke-access has no explicit owner in scanned registries (/api/admin/boardroom-delivery/revoke-access) - app/api/admin/boardroom-delivery/revoke-access/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/revoke-link has no explicit owner in scanned registries (/api/admin/boardroom-delivery/revoke-link) - app/api/admin/boardroom-delivery/revoke-link/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery has no explicit owner in scanned registries (/api/admin/boardroom-delivery) - app/api/admin/boardroom-delivery/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/boardroom-delivery/tokens/[dossierId] has no explicit owner in scanned registries (/api/admin/boardroom-delivery/tokens/[dossierId]) - app/api/admin/boardroom-delivery/tokens/[dossierId]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/campaigns/[id]/report-data has no explicit owner in scanned registries (/api/admin/campaigns/[id]/report-data) - app/api/admin/campaigns/[id]/report-data/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/campaigns/[id]/report/export-json has no explicit owner in scanned registries (/api/admin/campaigns/[id]/report/export-json) - app/api/admin/campaigns/[id]/report/export-json/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/campaigns/[id]/report/pdf has no explicit owner in scanned registries (/api/admin/campaigns/[id]/report/pdf) - app/api/admin/campaigns/[id]/report/pdf/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/campaigns/[id]/report has no explicit owner in scanned registries (/api/admin/campaigns/[id]/report) - app/api/admin/campaigns/[id]/report/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/campaigns/[id] has no explicit owner in scanned registries (/api/admin/campaigns/[id]) - app/api/admin/campaigns/[id]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/campaigns has no explicit owner in scanned registries (/api/admin/campaigns) - app/api/admin/campaigns/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/commercial has no explicit owner in scanned registries (/api/admin/commercial) - app/api/admin/commercial/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision-intelligence has no explicit owner in scanned registries (/api/admin/decision-intelligence) - app/api/admin/decision-intelligence/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/contextual-efficacy has no explicit owner in scanned registries (/api/admin/decision/contextual-efficacy) - app/api/admin/decision/contextual-efficacy/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/contextual-ranking has no explicit owner in scanned registries (/api/admin/decision/contextual-ranking) - app/api/admin/decision/contextual-ranking/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/efficacy has no explicit owner in scanned registries (/api/admin/decision/efficacy) - app/api/admin/decision/efficacy/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/governance has no explicit owner in scanned registries (/api/admin/decision/governance) - app/api/admin/decision/governance/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/performance has no explicit owner in scanned registries (/api/admin/decision/performance) - app/api/admin/decision/performance/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/rebuild-contextual-efficacy has no explicit owner in scanned registries (/api/admin/decision/rebuild-contextual-efficacy) - app/api/admin/decision/rebuild-contextual-efficacy/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/rebuild-efficacy has no explicit owner in scanned registries (/api/admin/decision/rebuild-efficacy) - app/api/admin/decision/rebuild-efficacy/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/rebuild-governance-alerts has no explicit owner in scanned registries (/api/admin/decision/rebuild-governance-alerts) - app/api/admin/decision/rebuild-governance-alerts/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/rebuild-performance has no explicit owner in scanned registries (/api/admin/decision/rebuild-performance) - app/api/admin/decision/rebuild-performance/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/decision/signal-registry has no explicit owner in scanned registries (/api/admin/decision/signal-registry) - app/api/admin/decision/signal-registry/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/dev-login has no explicit owner in scanned registries (/api/admin/dev-login) - app/api/admin/dev-login/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/enterprise-foundation has no explicit owner in scanned registries (/api/admin/enterprise-foundation) - app/api/admin/enterprise-foundation/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/executive-report-delivery/resend-link has no explicit owner in scanned registries (/api/admin/executive-report-delivery/resend-link) - app/api/admin/executive-report-delivery/resend-link/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/executive-report-delivery/revoke-link has no explicit owner in scanned registries (/api/admin/executive-report-delivery/revoke-link) - app/api/admin/executive-report-delivery/revoke-link/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/chaos/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/chaos/run) - app/api/admin/intelligence-foundry/chaos/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/ci-gate has no explicit owner in scanned registries (/api/admin/intelligence-foundry/ci-gate) - app/api/admin/intelligence-foundry/ci-gate/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/data-poisoning/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/data-poisoning/run) - app/api/admin/intelligence-foundry/data-poisoning/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/debug has no explicit owner in scanned registries (/api/admin/intelligence-foundry/debug) - app/api/admin/intelligence-foundry/debug/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/boardroom-mode/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/boardroom-mode/run) - app/api/admin/intelligence-foundry/engines/boardroom-mode/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run) - app/api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/executive-reporting/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/executive-reporting/run) - app/api/admin/intelligence-foundry/engines/executive-reporting/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/fast-diagnostic/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/fast-diagnostic/run) - app/api/admin/intelligence-foundry/engines/fast-diagnostic/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/request-adapter has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/request-adapter) - app/api/admin/intelligence-foundry/engines/request-adapter/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines) - app/api/admin/intelligence-foundry/engines/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/strategy-room/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/strategy-room/run) - app/api/admin/intelligence-foundry/engines/strategy-room/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/health has no explicit owner in scanned registries (/api/admin/intelligence-foundry/health) - app/api/admin/intelligence-foundry/health/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/lineage/simulate has no explicit owner in scanned registries (/api/admin/intelligence-foundry/lineage/simulate) - app/api/admin/intelligence-foundry/lineage/simulate/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/market/analyze has no explicit owner in scanned registries (/api/admin/intelligence-foundry/market/analyze) - app/api/admin/intelligence-foundry/market/analyze/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/modules has no explicit owner in scanned registries (/api/admin/intelligence-foundry/modules) - app/api/admin/intelligence-foundry/modules/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/performance/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/performance/run) - app/api/admin/intelligence-foundry/performance/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/product-health has no explicit owner in scanned registries (/api/admin/intelligence-foundry/product-health) - app/api/admin/intelligence-foundry/product-health/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/promotion has no explicit owner in scanned registries (/api/admin/intelligence-foundry/promotion) - app/api/admin/intelligence-foundry/promotion/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/red-team/content/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/red-team/content/run) - app/api/admin/intelligence-foundry/red-team/content/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/red-team/security/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/red-team/security/run) - app/api/admin/intelligence-foundry/red-team/security/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/archive has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/archive) - app/api/admin/intelligence-foundry/runs/[id]/archive/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/defer has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/defer) - app/api/admin/intelligence-foundry/runs/[id]/defer/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/export-brief has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/export-brief) - app/api/admin/intelligence-foundry/runs/[id]/export-brief/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/implement has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/implement) - app/api/admin/intelligence-foundry/runs/[id]/implement/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/replay has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/replay) - app/api/admin/intelligence-foundry/runs/[id]/replay/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/resurrect has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/resurrect) - app/api/admin/intelligence-foundry/runs/[id]/resurrect/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id] has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]) - app/api/admin/intelligence-foundry/runs/[id]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs) - app/api/admin/intelligence-foundry/runs/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/trash-day has no explicit owner in scanned registries (/api/admin/intelligence-foundry/trash-day) - app/api/admin/intelligence-foundry/trash-day/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/positioning has no explicit owner in scanned registries (/api/admin/positioning) - app/api/admin/positioning/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/analytics/executive-report has no explicit owner in scanned registries (/api/analytics/executive-report) - app/api/analytics/executive-report/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/analytics/journey has no explicit owner in scanned registries (/api/analytics/journey) - app/api/analytics/journey/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/audit/[id]/submit has no explicit owner in scanned registries (/api/audit/[id]/submit) - app/api/audit/[id]/submit/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/audit/log has no explicit owner in scanned registries (/api/audit/log) - app/api/audit/log/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/audit/submit has no explicit owner in scanned registries (/api/audit/submit) - app/api/audit/submit/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/auth/sovereign has no explicit owner in scanned registries (/api/auth/sovereign) - app/api/auth/sovereign/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/boardroom/dossier/[dossierId] has no explicit owner in scanned registries (/api/boardroom/dossier/[dossierId]) - app/api/boardroom/dossier/[dossierId]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/boardroom/dossier/pdf has no explicit owner in scanned registries (/api/boardroom/dossier/pdf) - app/api/boardroom/dossier/pdf/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/boardroom/dossier has no explicit owner in scanned registries (/api/boardroom/dossier) - app/api/boardroom/dossier/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/calibration/ingest has no explicit owner in scanned registries (/api/calibration/ingest) - app/api/calibration/ingest/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/campaigns/[id]/invite has no explicit owner in scanned registries (/api/campaigns/[id]/invite) - app/api/campaigns/[id]/invite/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/campaigns/[id]/nudge has no explicit owner in scanned registries (/api/campaigns/[id]/nudge) - app/api/campaigns/[id]/nudge/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/campaigns/[id]/report/json has no explicit owner in scanned registries (/api/campaigns/[id]/report/json) - app/api/campaigns/[id]/report/json/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/campaigns/[id]/report/pdf-file has no explicit owner in scanned registries (/api/campaigns/[id]/report/pdf-file) - app/api/campaigns/[id]/report/pdf-file/route.tsx
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/campaigns/[id]/report/pdf has no explicit owner in scanned registries (/api/campaigns/[id]/report/pdf) - app/api/campaigns/[id]/report/pdf/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/campaigns/[id]/report has no explicit owner in scanned registries (/api/campaigns/[id]/report) - app/api/campaigns/[id]/report/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/client-portal/actions has no explicit owner in scanned registries (/api/client-portal/actions) - app/api/client-portal/actions/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/client-portal/deliverables has no explicit owner in scanned registries (/api/client-portal/deliverables) - app/api/client-portal/deliverables/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/client-portal/dossier-redirect has no explicit owner in scanned registries (/api/client-portal/dossier-redirect) - app/api/client-portal/dossier-redirect/route.ts
- ... 381 additional finding(s) in JSON reports.

## False-green surfaces

- [AMBER] STATUS_LABEL_WITHOUT_PROOF: app/dashboard/pdf-analytics/PdfAnalyticsClient.tsx uses LIVE without obvious proof chain - app/dashboard/pdf-analytics/PdfAnalyticsClient.tsx
- [AMBER] STATUS_LABEL_WITHOUT_PROOF: components/admin/AdminStatusBadge.test.ts uses LIVE without obvious proof chain - components/admin/AdminStatusBadge.test.ts
- [AMBER] STATUS_LABEL_WITHOUT_PROOF: lib/outbound/facebook-types.ts uses READY without obvious proof chain - lib/outbound/facebook-types.ts
- [AMBER] STATUS_LABEL_WITHOUT_PROOF: lib/outbound/x-publish-gate.test.ts uses READY without obvious proof chain - lib/outbound/x-publish-gate.test.ts
- [AMBER] STATUS_LABEL_WITHOUT_PROOF: lib/outbound/x-types.ts uses READY without obvious proof chain - lib/outbound/x-types.ts

## Simulated-but-labelled-live surfaces

- None detected by this static pass.

## Auth/access mismatches

- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /api/enterprise-foundation/dependencies is public-classified but imports admin auth/client (/api/enterprise-foundation/dependencies) - app/api/enterprise-foundation/dependencies/route.ts
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /api/enterprise-foundation/playbooks is public-classified but imports admin auth/client (/api/enterprise-foundation/playbooks) - app/api/enterprise-foundation/playbooks/route.ts
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /api/enterprise-foundation/stakeholders is public-classified but imports admin auth/client (/api/enterprise-foundation/stakeholders) - app/api/enterprise-foundation/stakeholders/route.ts
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /dashboard/pdf-analytics is public-classified but imports admin auth/client (/dashboard/pdf-analytics) - app/dashboard/pdf-analytics/page.tsx
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /pdf-dashboard is public-classified but imports admin auth/client (/pdf-dashboard) - app/pdf-dashboard/page.tsx
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /api/enterprise/campaigns/[id] is public-classified but imports admin auth/client (/api/enterprise/campaigns/[id]) - pages/api/enterprise/campaigns/[id].ts
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /api/enterprise/report/[campaignId] is public-classified but imports admin auth/client (/api/enterprise/report/[campaignId]) - pages/api/enterprise/report/[campaignId].ts
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /inner-circle/admin/dashboard is public-classified but imports admin auth/client (/inner-circle/admin/dashboard) - pages/inner-circle/admin/dashboard.tsx

## Product ladder gaps

- [AMBER] PRODUCT_NO_ADMIN_VISIBILITY: Fast Diagnostic has no obvious admin visibility route
- [AMBER] PRODUCT_NO_ADMIN_VISIBILITY: Purpose Alignment has no obvious admin visibility route
- [AMBER] PRODUCT_NO_ADMIN_VISIBILITY: Team Assessment has no obvious admin visibility route
- [AMBER] PRODUCT_NO_ADMIN_VISIBILITY: Enterprise Decision Authority has no obvious admin visibility route
- [AMBER] PRODUCT_NO_ADMIN_VISIBILITY: Decision Centre has no obvious admin visibility route

## Recommended fix order

1. RED security/access findings: admin APIs, debug surfaces, token/entitlement delivery routes.
2. RED paid/delivery path findings: checkout, Stripe webhook idempotency/signature, paid report delivery.
3. RED false-publication/outbound findings: approval gates, dry-run vs publish state, provider evidence.
4. Foundry false-green and simulation/live ambiguity: require proof beyond registry declarations.
5. AMBER ownership/navigation gaps: registry owners, admin nav truth, dashboard visibility.
6. Governance durability gaps: durable writes, registered-vs-emitted event parity, explicit failure states.

## No fixes applied

No product, content, auth, commercial, outbound, Foundry, or platform implementation files were changed by this audit pass.

