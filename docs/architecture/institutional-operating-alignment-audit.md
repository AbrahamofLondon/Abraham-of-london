# Institutional Operating Alignment Audit

## Executive summary

This is a report-only static institutional control audit. It verifies route existence, source-level auth evidence, registry parity, product ladder wiring, Foundry linkage, outbound controls, governance event durability indicators, commercial delivery indicators, and status-label truthfulness. It does not modify product code or content publication status.

Registry presence alone was not counted as integration. Surfaces are treated as aligned only when route, access policy, registry owner, canonical record, implementation evidence, governance event, durable audit/failure path, and truthful status language are visible in source.

## Counts

- Total surfaces audited: 1421
- Total routes audited: 917
- Total admin surfaces audited: 181
- Total product surfaces audited: 236
- Total Foundry engines/adapters audited: 116
- Total outbound flows audited: 100
- Total governance events referenced: 16
- Registry route references scanned: 141

## RED findings

- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/ci-gate has no explicit owner in scanned registries (/api/admin/intelligence-foundry/ci-gate) - app/api/admin/intelligence-foundry/ci-gate/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/data-poisoning/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/data-poisoning/run) - app/api/admin/intelligence-foundry/data-poisoning/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/boardroom-mode/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/boardroom-mode/run) - app/api/admin/intelligence-foundry/engines/boardroom-mode/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run) - app/api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/executive-reporting/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/executive-reporting/run) - app/api/admin/intelligence-foundry/engines/executive-reporting/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/fast-diagnostic/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/fast-diagnostic/run) - app/api/admin/intelligence-foundry/engines/fast-diagnostic/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/request-adapter has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/request-adapter) - app/api/admin/intelligence-foundry/engines/request-adapter/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines) - app/api/admin/intelligence-foundry/engines/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/strategy-room/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/strategy-room/run) - app/api/admin/intelligence-foundry/engines/strategy-room/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/health has no explicit owner in scanned registries (/api/admin/intelligence-foundry/health) - app/api/admin/intelligence-foundry/health/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/lineage/simulate has no explicit owner in scanned registries (/api/admin/intelligence-foundry/lineage/simulate) - app/api/admin/intelligence-foundry/lineage/simulate/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/modules has no explicit owner in scanned registries (/api/admin/intelligence-foundry/modules) - app/api/admin/intelligence-foundry/modules/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/performance/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/performance/run) - app/api/admin/intelligence-foundry/performance/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/product-health has no explicit owner in scanned registries (/api/admin/intelligence-foundry/product-health) - app/api/admin/intelligence-foundry/product-health/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/archive has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/archive) - app/api/admin/intelligence-foundry/runs/[id]/archive/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/defer has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/defer) - app/api/admin/intelligence-foundry/runs/[id]/defer/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/export-brief has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/export-brief) - app/api/admin/intelligence-foundry/runs/[id]/export-brief/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/implement has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/implement) - app/api/admin/intelligence-foundry/runs/[id]/implement/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/replay has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/replay) - app/api/admin/intelligence-foundry/runs/[id]/replay/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/resurrect has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/resurrect) - app/api/admin/intelligence-foundry/runs/[id]/resurrect/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id] has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]) - app/api/admin/intelligence-foundry/runs/[id]/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs) - app/api/admin/intelligence-foundry/runs/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /admin/login has no explicit owner in scanned registries (/admin/login) - pages/admin/login.tsx
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /admin/security-assurance-requests has no explicit owner in scanned registries (/admin/security-assurance-requests) - pages/admin/security-assurance-requests.tsx
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /briefing/return/[sessionKey] has no explicit owner in scanned registries (/briefing/return/[sessionKey]) - pages/briefing/return/[sessionKey].tsx
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /case/shared/[token] has no explicit owner in scanned registries (/case/shared/[token]) - pages/case/shared/[token].tsx
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /downloads-sitemap.xml has no explicit owner in scanned registries (/downloads-sitemap.xml) - pages/downloads-sitemap.xml.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /downloads/[...slug] has no explicit owner in scanned registries (/downloads/[...slug]) - pages/downloads/[...slug].tsx
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /downloads has no explicit owner in scanned registries (/downloads) - pages/downloads/index.tsx
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /private/admin/premium-downloads has no explicit owner in scanned registries (/private/admin/premium-downloads) - pages/private/admin/premium-downloads.tsx
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /vault-sitemap.xml has no explicit owner in scanned registries (/vault-sitemap.xml) - pages/vault-sitemap.xml.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /vault/[...slug] has no explicit owner in scanned registries (/vault/[...slug]) - pages/vault/[...slug].tsx
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /vault/briefs/[slug] has no explicit owner in scanned registries (/vault/briefs/[slug]) - pages/vault/briefs/[slug].tsx
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /vault/briefs has no explicit owner in scanned registries (/vault/briefs) - pages/vault/briefs/index.tsx
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /vault has no explicit owner in scanned registries (/vault) - pages/vault/index.tsx
- [RED] DELIVERY_ROUTE_NO_TOKEN_OR_ENTITLEMENT: /downloads/vault appears delivery-gated but lacks visible token/entitlement check (/downloads/vault) - app/downloads/vault/page.tsx
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/audit/logs lacks visible admin auth guard (/api/admin/audit/logs) - pages/api/admin/audit/logs.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/auth/reset-rate-limit lacks visible admin auth guard (/api/admin/auth/reset-rate-limit) - pages/api/admin/auth/reset-rate-limit.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/auth/send-link lacks visible admin auth guard (/api/admin/auth/send-link) - pages/api/admin/auth/send-link.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/constitutional-health lacks visible admin auth guard (/api/admin/constitutional-health) - pages/api/admin/constitutional-health.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/diagnostics/artifacts lacks visible admin auth guard (/api/admin/diagnostics/artifacts) - pages/api/admin/diagnostics/artifacts.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/diagnostics/records lacks visible admin auth guard (/api/admin/diagnostics/records) - pages/api/admin/diagnostics/records.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/diagnostics/regenerate lacks visible admin auth guard (/api/admin/diagnostics/regenerate) - pages/api/admin/diagnostics/regenerate.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/diagnostics/retention/run lacks visible admin auth guard (/api/admin/diagnostics/retention/run) - pages/api/admin/diagnostics/retention/run.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/diagnostics/summary lacks visible admin auth guard (/api/admin/diagnostics/summary) - pages/api/admin/diagnostics/summary.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/governed-cases/stale lacks visible admin auth guard (/api/admin/governed-cases/stale) - pages/api/admin/governed-cases/stale.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/inner-circle/export lacks visible admin auth guard (/api/admin/inner-circle/export) - pages/api/admin/inner-circle/export.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/inner-circle/export/route lacks visible admin auth guard (/api/admin/inner-circle/export/route) - pages/api/admin/inner-circle/export/route.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/outbound/linkedin/callback lacks visible admin auth guard (/api/admin/outbound/linkedin/callback) - pages/api/admin/outbound/linkedin/callback.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/outbound/linkedin/connect lacks visible admin auth guard (/api/admin/outbound/linkedin/connect) - pages/api/admin/outbound/linkedin/connect.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/outcome-verification lacks visible admin auth guard (/api/admin/outcome-verification) - pages/api/admin/outcome-verification.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/pricing lacks visible admin auth guard (/api/admin/pricing) - pages/api/admin/pricing.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/reports/ReportQueueTable lacks visible admin auth guard (/api/admin/reports/ReportQueueTable) - pages/api/admin/reports/ReportQueueTable.tsx
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/reports/[id] lacks visible admin auth guard (/api/admin/reports/[id]) - pages/api/admin/reports/[id].ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/reports/[id]/deliver lacks visible admin auth guard (/api/admin/reports/[id]/deliver) - pages/api/admin/reports/[id]/deliver.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/reports lacks visible admin auth guard (/api/admin/reports) - pages/api/admin/reports/index.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/security/deny lacks visible admin auth guard (/api/admin/security/deny) - pages/api/admin/security/deny.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/sync-fix lacks visible admin auth guard (/api/admin/sync-fix) - pages/api/admin/sync-fix.ts
- [RED] DEBUG_SURFACE_PUBLIC: /api/debug/contentlayer-exports appears debug/internal without auth (/api/debug/contentlayer-exports) - pages/api/debug/contentlayer-exports.ts
- [RED] DEBUG_SURFACE_PUBLIC: /api/debug/contentlayer-registry appears debug/internal without auth (/api/debug/contentlayer-registry) - pages/api/debug/contentlayer-registry.ts
- [RED] DEBUG_SURFACE_PUBLIC: /api/debug/ssot-health appears debug/internal without auth (/api/debug/ssot-health) - pages/api/debug/ssot-health.ts
- [RED] DEBUG_SURFACE_PUBLIC: /debug/content appears debug/internal without auth (/debug/content) - pages/debug/content.tsx
- [RED] PRODUCT_NO_LADDER_REGISTRY: Enterprise Assessment has route/API surface but no registry declaration
- [RED] PRODUCT_NO_LADDER_REGISTRY: Paid Executive Report has route/API surface but no registry declaration
- [RED] PRODUCT_NO_LADDER_REGISTRY: Decision Centre has route/API surface but no registry declaration
- [RED] PRODUCT_NO_LADDER_REGISTRY: GMI Reports has route/API surface but no registry declaration
- [RED] FOUNDRY_ADAPTER_NO_ADMIN_SURFACE: lib/research/adapter-base-contract.ts has no obvious admin Foundry surface - lib/research/adapter-base-contract.ts
- [RED] FOUNDRY_ADAPTER_NO_ADMIN_SURFACE: lib/research/adapter-registry.ts has no obvious admin Foundry surface - lib/research/adapter-registry.ts
- [RED] FOUNDRY_PAGE_NO_ENGINE: /admin/intelligence-foundry/content exists but no engine/adapter linkage is visible (/admin/intelligence-foundry/content) - app/admin/intelligence-foundry/content/page.tsx
- [RED] FOUNDRY_PAGE_NO_ENGINE:  exists but no engine/adapter linkage is visible - app/admin/intelligence-foundry/layout.tsx
- [RED] FOUNDRY_PAGE_NO_ENGINE: /admin/intelligence-foundry/market exists but no engine/adapter linkage is visible (/admin/intelligence-foundry/market) - app/admin/intelligence-foundry/market/page.tsx
- [RED] FOUNDRY_PAGE_NO_ENGINE: /admin/intelligence-foundry/outbound exists but no engine/adapter linkage is visible (/admin/intelligence-foundry/outbound) - app/admin/intelligence-foundry/outbound/page.tsx
- [RED] FOUNDRY_PAGE_NO_ENGINE: /admin/intelligence-foundry/red-team/security exists but no engine/adapter linkage is visible (/admin/intelligence-foundry/red-team/security) - app/admin/intelligence-foundry/red-team/security/page.tsx
- [RED] FOUNDRY_PAGE_NO_ENGINE: /admin/intelligence-foundry/reference exists but no engine/adapter linkage is visible (/admin/intelligence-foundry/reference) - app/admin/intelligence-foundry/reference/page.tsx
- [RED] EVENT_EMITTED_NOT_REGISTERED: TRANSACTIONAL is emitted/referenced but not registered in governance event types
- [RED] EVENT_EMITTED_NOT_REGISTERED: ENTERPRISE is emitted/referenced but not registered in governance event types
- [RED] EVENT_EMITTED_NOT_REGISTERED: SYSTEM is emitted/referenced but not registered in governance event types
- [RED] EVENT_EMITTED_NOT_REGISTERED: ARTIFACT is emitted/referenced but not registered in governance event types
- [RED] EVENT_EMITTED_NOT_REGISTERED: EXECUTIVE_REPORT is emitted/referenced but not registered in governance event types
- [RED] EVENT_EMITTED_NOT_REGISTERED: DIAGNOSTIC_RUN is emitted/referenced but not registered in governance event types
- ... 128 additional finding(s) in JSON reports.

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
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/debug has no explicit owner in scanned registries (/api/admin/intelligence-foundry/debug) - app/api/admin/intelligence-foundry/debug/route.ts
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
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/sovereign/cohort has no explicit owner in scanned registries (/api/sovereign/cohort) - app/api/sovereign/cohort/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/sovereign/commons/benchmark has no explicit owner in scanned registries (/api/sovereign/commons/benchmark) - app/api/sovereign/commons/benchmark/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/sovereign/commons/record has no explicit owner in scanned registries (/api/sovereign/commons/record) - app/api/sovereign/commons/record/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/sovereign/forensics has no explicit owner in scanned registries (/api/sovereign/forensics) - app/api/sovereign/forensics/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/sovereign/history has no explicit owner in scanned registries (/api/sovereign/history) - app/api/sovereign/history/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/sovereign/logout has no explicit owner in scanned registries (/api/sovereign/logout) - app/api/sovereign/logout/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/sovereign/memory has no explicit owner in scanned registries (/api/sovereign/memory) - app/api/sovereign/memory/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/sovereign/report has no explicit owner in scanned registries (/api/sovereign/report) - app/api/sovereign/report/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/sovereign/signals has no explicit owner in scanned registries (/api/sovereign/signals) - app/api/sovereign/signals/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/strategy-room/briefing/scan has no explicit owner in scanned registries (/api/strategy-room/briefing/scan) - app/api/strategy-room/briefing/scan/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/strategy-room/conversion has no explicit owner in scanned registries (/api/strategy-room/conversion) - app/api/strategy-room/conversion/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/strategy-room/execution-record has no explicit owner in scanned registries (/api/strategy-room/execution-record) - app/api/strategy-room/execution-record/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/strategy-room/execution/[id]/decisions has no explicit owner in scanned registries (/api/strategy-room/execution/[id]/decisions) - app/api/strategy-room/execution/[id]/decisions/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/strategy-room/execution/[id] has no explicit owner in scanned registries (/api/strategy-room/execution/[id]) - app/api/strategy-room/execution/[id]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/strategy-room/execution/[id]/state has no explicit owner in scanned registries (/api/strategy-room/execution/[id]/state) - app/api/strategy-room/execution/[id]/state/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/strategy-room/execution/locked-record has no explicit owner in scanned registries (/api/strategy-room/execution/locked-record) - app/api/strategy-room/execution/locked-record/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/strategy-room/execution has no explicit owner in scanned registries (/api/strategy-room/execution) - app/api/strategy-room/execution/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/strategy-room/results has no explicit owner in scanned registries (/api/strategy-room/results) - app/api/strategy-room/results/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/strategy-room/session/click has no explicit owner in scanned registries (/api/strategy-room/session/click) - app/api/strategy-room/session/click/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/strategy-room/session/conversion has no explicit owner in scanned registries (/api/strategy-room/session/conversion) - app/api/strategy-room/session/conversion/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/strategy-room/session/impression has no explicit owner in scanned registries (/api/strategy-room/session/impression) - app/api/strategy-room/session/impression/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/stripe/webhook has no explicit owner in scanned registries (/api/stripe/webhook) - app/api/stripe/webhook/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/team/respondents/[token] has no explicit owner in scanned registries (/api/team/respondents/[token]) - app/api/team/respondents/[token]/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/telemetry/global has no explicit owner in scanned registries (/api/telemetry/global) - app/api/telemetry/global/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/telemetry/resonance has no explicit owner in scanned registries (/api/telemetry/resonance) - app/api/telemetry/resonance/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/user/delete has no explicit owner in scanned registries (/api/user/delete) - app/api/user/delete/route.ts
- ... 428 additional finding(s) in JSON reports.

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
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/ci-gate has no explicit owner in scanned registries (/api/admin/intelligence-foundry/ci-gate) - app/api/admin/intelligence-foundry/ci-gate/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/data-poisoning/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/data-poisoning/run) - app/api/admin/intelligence-foundry/data-poisoning/run/route.ts
- [AMBER] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/debug has no explicit owner in scanned registries (/api/admin/intelligence-foundry/debug) - app/api/admin/intelligence-foundry/debug/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/boardroom-mode/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/boardroom-mode/run) - app/api/admin/intelligence-foundry/engines/boardroom-mode/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run) - app/api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/executive-reporting/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/executive-reporting/run) - app/api/admin/intelligence-foundry/engines/executive-reporting/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/fast-diagnostic/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/fast-diagnostic/run) - app/api/admin/intelligence-foundry/engines/fast-diagnostic/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/request-adapter has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/request-adapter) - app/api/admin/intelligence-foundry/engines/request-adapter/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines) - app/api/admin/intelligence-foundry/engines/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/engines/strategy-room/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/engines/strategy-room/run) - app/api/admin/intelligence-foundry/engines/strategy-room/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/health has no explicit owner in scanned registries (/api/admin/intelligence-foundry/health) - app/api/admin/intelligence-foundry/health/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/lineage/simulate has no explicit owner in scanned registries (/api/admin/intelligence-foundry/lineage/simulate) - app/api/admin/intelligence-foundry/lineage/simulate/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/modules has no explicit owner in scanned registries (/api/admin/intelligence-foundry/modules) - app/api/admin/intelligence-foundry/modules/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/performance/run has no explicit owner in scanned registries (/api/admin/intelligence-foundry/performance/run) - app/api/admin/intelligence-foundry/performance/run/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/product-health has no explicit owner in scanned registries (/api/admin/intelligence-foundry/product-health) - app/api/admin/intelligence-foundry/product-health/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/archive has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/archive) - app/api/admin/intelligence-foundry/runs/[id]/archive/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/defer has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/defer) - app/api/admin/intelligence-foundry/runs/[id]/defer/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/export-brief has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/export-brief) - app/api/admin/intelligence-foundry/runs/[id]/export-brief/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/implement has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/implement) - app/api/admin/intelligence-foundry/runs/[id]/implement/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/replay has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/replay) - app/api/admin/intelligence-foundry/runs/[id]/replay/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id]/resurrect has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]/resurrect) - app/api/admin/intelligence-foundry/runs/[id]/resurrect/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs/[id] has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs/[id]) - app/api/admin/intelligence-foundry/runs/[id]/route.ts
- [RED] ROUTE_WITHOUT_REGISTRY_OWNER: /api/admin/intelligence-foundry/runs has no explicit owner in scanned registries (/api/admin/intelligence-foundry/runs) - app/api/admin/intelligence-foundry/runs/route.ts
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
- ... 394 additional finding(s) in JSON reports.

## False-green surfaces

- [RED] SIMULATION_LABELLED_LIVE: app/admin/boardroom-delivery/page.tsx uses DELIVERED, APPROVED near simulation/dry-run language (/admin/boardroom-delivery) - app/admin/boardroom-delivery/page.tsx
- [RED] SIMULATION_LABELLED_LIVE: app/admin/intelligence-foundry/performance/page.tsx uses COMPLETE near simulation/dry-run language (/admin/intelligence-foundry/performance) - app/admin/intelligence-foundry/performance/page.tsx
- [RED] SIMULATION_LABELLED_LIVE: app/admin/intelligence-foundry/simulation/fast-diagnostic/page.tsx uses COMPLETE near simulation/dry-run language (/admin/intelligence-foundry/simulation/fast-diagnostic) - app/admin/intelligence-foundry/simulation/fast-diagnostic/page.tsx
- [RED] SIMULATION_LABELLED_LIVE: app/admin/intelligence-foundry/simulation/report-lineage/page.tsx uses COMPLETE near simulation/dry-run language (/admin/intelligence-foundry/simulation/report-lineage) - app/admin/intelligence-foundry/simulation/report-lineage/page.tsx
- [RED] SIMULATION_LABELLED_LIVE: app/admin/intelligence-foundry/simulation/strategy-room/page.tsx uses COMPLETE near simulation/dry-run language (/admin/intelligence-foundry/simulation/strategy-room) - app/admin/intelligence-foundry/simulation/strategy-room/page.tsx
- [RED] SIMULATION_LABELLED_LIVE: app/api/client-portal/deliverables/route.ts uses DELIVERED near simulation/dry-run language (/api/client-portal/deliverables) - app/api/client-portal/deliverables/route.ts
- [RED] SIMULATION_LABELLED_LIVE: app/api/client-portal/dossier-redirect/route.ts uses DELIVERED near simulation/dry-run language (/api/client-portal/dossier-redirect) - app/api/client-portal/dossier-redirect/route.ts
- [AMBER] STATUS_LABEL_WITHOUT_PROOF: app/dashboard/pdf-analytics/PdfAnalyticsClient.tsx uses LIVE without obvious proof chain - app/dashboard/pdf-analytics/PdfAnalyticsClient.tsx
- [AMBER] STATUS_LABEL_WITHOUT_PROOF: components/admin/AdminStatusBadge.test.ts uses LIVE without obvious proof chain - components/admin/AdminStatusBadge.test.ts
- [RED] SIMULATION_LABELLED_LIVE: components/admin/outbound/OutboundLedgerTable.tsx uses PUBLISHED near simulation/dry-run language - components/admin/outbound/OutboundLedgerTable.tsx
- [RED] SIMULATION_LABELLED_LIVE: lib/boardroom/boardroom-delivery-pipeline.ts uses DELIVERED, APPROVED near simulation/dry-run language - lib/boardroom/boardroom-delivery-pipeline.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/boardroom/boardroom-dossier-service.ts uses DELIVERED, APPROVED near simulation/dry-run language - lib/boardroom/boardroom-dossier-service.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/outbound/core/outbound-publish-ledger.test.ts uses PUBLISHED near simulation/dry-run language - lib/outbound/core/outbound-publish-ledger.test.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/outbound/core/outbound-publish-ledger.ts uses PUBLISHED near simulation/dry-run language - lib/outbound/core/outbound-publish-ledger.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/outbound/core/outbound-scheduler-runner.ts uses READY, PUBLISHED near simulation/dry-run language - lib/outbound/core/outbound-scheduler-runner.ts
- [AMBER] STATUS_LABEL_WITHOUT_PROOF: lib/outbound/facebook-types.ts uses READY without obvious proof chain - lib/outbound/facebook-types.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/outbound/linkedin-publishing-client.test.ts uses PUBLISHED near simulation/dry-run language - lib/outbound/linkedin-publishing-client.test.ts
- [AMBER] STATUS_LABEL_WITHOUT_PROOF: lib/outbound/x-publish-gate.test.ts uses READY without obvious proof chain - lib/outbound/x-publish-gate.test.ts
- [AMBER] STATUS_LABEL_WITHOUT_PROOF: lib/outbound/x-types.ts uses READY without obvious proof chain - lib/outbound/x-types.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/engines/enforcement-gates-adapter.ts uses GREEN, COMPLETE near simulation/dry-run language - lib/research/engines/enforcement-gates-adapter.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/engines/report-lineage-adapter.ts uses COMPLETE near simulation/dry-run language - lib/research/engines/report-lineage-adapter.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/foundry-contract.ts uses COMPLETE near simulation/dry-run language - lib/research/foundry-contract.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/lineage/lineage-simulation-contract.ts uses COMPLETE near simulation/dry-run language - lib/research/lineage/lineage-simulation-contract.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/lineage/report-lineage-simulation.ts uses COMPLETE, APPROVED near simulation/dry-run language - lib/research/lineage/report-lineage-simulation.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/product-health/product-health-rules.ts uses GREEN, COMPLETE near simulation/dry-run language - lib/research/product-health/product-health-rules.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/product-health/product-health-service.ts uses GREEN near simulation/dry-run language - lib/research/product-health/product-health-service.ts
- [RED] SIMULATION_LABELLED_LIVE: pages/admin/oversight-review.tsx uses DELIVERED, COMPLETE near simulation/dry-run language (/admin/oversight-review) - pages/admin/oversight-review.tsx
- [RED] SIMULATION_LABELLED_LIVE: pages/api/admin/outbound/linkedin/publish.ts uses PUBLISHED near simulation/dry-run language (/api/admin/outbound/linkedin/publish) - pages/api/admin/outbound/linkedin/publish.ts
- [RED] SIMULATION_LABELLED_LIVE: pages/api/internal/oversight/delivery-action.ts uses DELIVERED near simulation/dry-run language (/api/internal/oversight/delivery-action) - pages/api/internal/oversight/delivery-action.ts
- [RED] SIMULATION_LABELLED_LIVE: pages/editorials/index.tsx uses PUBLISHED near simulation/dry-run language (/editorials) - pages/editorials/index.tsx
- [RED] SIMULATION_LABELLED_LIVE: pages/provenance/sample-export.tsx uses LIVE near simulation/dry-run language (/provenance/sample-export) - pages/provenance/sample-export.tsx

## Simulated-but-labelled-live surfaces

- [RED] SIMULATION_LABELLED_LIVE: app/admin/boardroom-delivery/page.tsx uses DELIVERED, APPROVED near simulation/dry-run language (/admin/boardroom-delivery) - app/admin/boardroom-delivery/page.tsx
- [RED] SIMULATION_LABELLED_LIVE: app/admin/intelligence-foundry/performance/page.tsx uses COMPLETE near simulation/dry-run language (/admin/intelligence-foundry/performance) - app/admin/intelligence-foundry/performance/page.tsx
- [RED] SIMULATION_LABELLED_LIVE: app/admin/intelligence-foundry/simulation/fast-diagnostic/page.tsx uses COMPLETE near simulation/dry-run language (/admin/intelligence-foundry/simulation/fast-diagnostic) - app/admin/intelligence-foundry/simulation/fast-diagnostic/page.tsx
- [RED] SIMULATION_LABELLED_LIVE: app/admin/intelligence-foundry/simulation/report-lineage/page.tsx uses COMPLETE near simulation/dry-run language (/admin/intelligence-foundry/simulation/report-lineage) - app/admin/intelligence-foundry/simulation/report-lineage/page.tsx
- [RED] SIMULATION_LABELLED_LIVE: app/admin/intelligence-foundry/simulation/strategy-room/page.tsx uses COMPLETE near simulation/dry-run language (/admin/intelligence-foundry/simulation/strategy-room) - app/admin/intelligence-foundry/simulation/strategy-room/page.tsx
- [RED] SIMULATION_LABELLED_LIVE: app/api/client-portal/deliverables/route.ts uses DELIVERED near simulation/dry-run language (/api/client-portal/deliverables) - app/api/client-portal/deliverables/route.ts
- [RED] SIMULATION_LABELLED_LIVE: app/api/client-portal/dossier-redirect/route.ts uses DELIVERED near simulation/dry-run language (/api/client-portal/dossier-redirect) - app/api/client-portal/dossier-redirect/route.ts
- [RED] SIMULATION_LABELLED_LIVE: components/admin/outbound/OutboundLedgerTable.tsx uses PUBLISHED near simulation/dry-run language - components/admin/outbound/OutboundLedgerTable.tsx
- [RED] SIMULATION_LABELLED_LIVE: lib/boardroom/boardroom-delivery-pipeline.ts uses DELIVERED, APPROVED near simulation/dry-run language - lib/boardroom/boardroom-delivery-pipeline.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/boardroom/boardroom-dossier-service.ts uses DELIVERED, APPROVED near simulation/dry-run language - lib/boardroom/boardroom-dossier-service.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/outbound/core/outbound-publish-ledger.test.ts uses PUBLISHED near simulation/dry-run language - lib/outbound/core/outbound-publish-ledger.test.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/outbound/core/outbound-publish-ledger.ts uses PUBLISHED near simulation/dry-run language - lib/outbound/core/outbound-publish-ledger.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/outbound/core/outbound-scheduler-runner.ts uses READY, PUBLISHED near simulation/dry-run language - lib/outbound/core/outbound-scheduler-runner.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/outbound/linkedin-publishing-client.test.ts uses PUBLISHED near simulation/dry-run language - lib/outbound/linkedin-publishing-client.test.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/engines/enforcement-gates-adapter.ts uses GREEN, COMPLETE near simulation/dry-run language - lib/research/engines/enforcement-gates-adapter.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/engines/report-lineage-adapter.ts uses COMPLETE near simulation/dry-run language - lib/research/engines/report-lineage-adapter.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/foundry-contract.ts uses COMPLETE near simulation/dry-run language - lib/research/foundry-contract.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/lineage/lineage-simulation-contract.ts uses COMPLETE near simulation/dry-run language - lib/research/lineage/lineage-simulation-contract.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/lineage/report-lineage-simulation.ts uses COMPLETE, APPROVED near simulation/dry-run language - lib/research/lineage/report-lineage-simulation.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/product-health/product-health-rules.ts uses GREEN, COMPLETE near simulation/dry-run language - lib/research/product-health/product-health-rules.ts
- [RED] SIMULATION_LABELLED_LIVE: lib/research/product-health/product-health-service.ts uses GREEN near simulation/dry-run language - lib/research/product-health/product-health-service.ts
- [RED] SIMULATION_LABELLED_LIVE: pages/admin/oversight-review.tsx uses DELIVERED, COMPLETE near simulation/dry-run language (/admin/oversight-review) - pages/admin/oversight-review.tsx
- [RED] SIMULATION_LABELLED_LIVE: pages/api/admin/outbound/linkedin/publish.ts uses PUBLISHED near simulation/dry-run language (/api/admin/outbound/linkedin/publish) - pages/api/admin/outbound/linkedin/publish.ts
- [RED] SIMULATION_LABELLED_LIVE: pages/api/internal/oversight/delivery-action.ts uses DELIVERED near simulation/dry-run language (/api/internal/oversight/delivery-action) - pages/api/internal/oversight/delivery-action.ts
- [RED] SIMULATION_LABELLED_LIVE: pages/editorials/index.tsx uses PUBLISHED near simulation/dry-run language (/editorials) - pages/editorials/index.tsx
- [RED] SIMULATION_LABELLED_LIVE: pages/provenance/sample-export.tsx uses LIVE near simulation/dry-run language (/provenance/sample-export) - pages/provenance/sample-export.tsx

## Auth/access mismatches

- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /api/enterprise-foundation/dependencies is public-classified but imports admin auth/client (/api/enterprise-foundation/dependencies) - app/api/enterprise-foundation/dependencies/route.ts
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /api/enterprise-foundation/playbooks is public-classified but imports admin auth/client (/api/enterprise-foundation/playbooks) - app/api/enterprise-foundation/playbooks/route.ts
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /api/enterprise-foundation/stakeholders is public-classified but imports admin auth/client (/api/enterprise-foundation/stakeholders) - app/api/enterprise-foundation/stakeholders/route.ts
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /dashboard/pdf-analytics is public-classified but imports admin auth/client (/dashboard/pdf-analytics) - app/dashboard/pdf-analytics/page.tsx
- [RED] DELIVERY_ROUTE_NO_TOKEN_OR_ENTITLEMENT: /downloads/vault appears delivery-gated but lacks visible token/entitlement check (/downloads/vault) - app/downloads/vault/page.tsx
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /pdf-dashboard is public-classified but imports admin auth/client (/pdf-dashboard) - app/pdf-dashboard/page.tsx
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/audit/logs lacks visible admin auth guard (/api/admin/audit/logs) - pages/api/admin/audit/logs.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/auth/reset-rate-limit lacks visible admin auth guard (/api/admin/auth/reset-rate-limit) - pages/api/admin/auth/reset-rate-limit.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/auth/send-link lacks visible admin auth guard (/api/admin/auth/send-link) - pages/api/admin/auth/send-link.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/constitutional-health lacks visible admin auth guard (/api/admin/constitutional-health) - pages/api/admin/constitutional-health.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/diagnostics/artifacts lacks visible admin auth guard (/api/admin/diagnostics/artifacts) - pages/api/admin/diagnostics/artifacts.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/diagnostics/records lacks visible admin auth guard (/api/admin/diagnostics/records) - pages/api/admin/diagnostics/records.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/diagnostics/regenerate lacks visible admin auth guard (/api/admin/diagnostics/regenerate) - pages/api/admin/diagnostics/regenerate.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/diagnostics/retention/run lacks visible admin auth guard (/api/admin/diagnostics/retention/run) - pages/api/admin/diagnostics/retention/run.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/diagnostics/summary lacks visible admin auth guard (/api/admin/diagnostics/summary) - pages/api/admin/diagnostics/summary.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/governed-cases/stale lacks visible admin auth guard (/api/admin/governed-cases/stale) - pages/api/admin/governed-cases/stale.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/inner-circle/export lacks visible admin auth guard (/api/admin/inner-circle/export) - pages/api/admin/inner-circle/export.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/inner-circle/export/route lacks visible admin auth guard (/api/admin/inner-circle/export/route) - pages/api/admin/inner-circle/export/route.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/outbound/linkedin/callback lacks visible admin auth guard (/api/admin/outbound/linkedin/callback) - pages/api/admin/outbound/linkedin/callback.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/outbound/linkedin/connect lacks visible admin auth guard (/api/admin/outbound/linkedin/connect) - pages/api/admin/outbound/linkedin/connect.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/outcome-verification lacks visible admin auth guard (/api/admin/outcome-verification) - pages/api/admin/outcome-verification.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/pricing lacks visible admin auth guard (/api/admin/pricing) - pages/api/admin/pricing.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/reports/ReportQueueTable lacks visible admin auth guard (/api/admin/reports/ReportQueueTable) - pages/api/admin/reports/ReportQueueTable.tsx
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/reports/[id] lacks visible admin auth guard (/api/admin/reports/[id]) - pages/api/admin/reports/[id].ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/reports/[id]/deliver lacks visible admin auth guard (/api/admin/reports/[id]/deliver) - pages/api/admin/reports/[id]/deliver.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/reports lacks visible admin auth guard (/api/admin/reports) - pages/api/admin/reports/index.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/security/deny lacks visible admin auth guard (/api/admin/security/deny) - pages/api/admin/security/deny.ts
- [RED] ADMIN_API_NO_VISIBLE_AUTH: /api/admin/sync-fix lacks visible admin auth guard (/api/admin/sync-fix) - pages/api/admin/sync-fix.ts
- [RED] DEBUG_SURFACE_PUBLIC: /api/debug/contentlayer-exports appears debug/internal without auth (/api/debug/contentlayer-exports) - pages/api/debug/contentlayer-exports.ts
- [RED] DEBUG_SURFACE_PUBLIC: /api/debug/contentlayer-registry appears debug/internal without auth (/api/debug/contentlayer-registry) - pages/api/debug/contentlayer-registry.ts
- [RED] DEBUG_SURFACE_PUBLIC: /api/debug/ssot-health appears debug/internal without auth (/api/debug/ssot-health) - pages/api/debug/ssot-health.ts
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /api/enterprise/campaigns/[id] is public-classified but imports admin auth/client (/api/enterprise/campaigns/[id]) - pages/api/enterprise/campaigns/[id].ts
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /api/enterprise/report/[campaignId] is public-classified but imports admin auth/client (/api/enterprise/report/[campaignId]) - pages/api/enterprise/report/[campaignId].ts
- [RED] DEBUG_SURFACE_PUBLIC: /debug/content appears debug/internal without auth (/debug/content) - pages/debug/content.tsx
- [AMBER] PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH: /inner-circle/admin/dashboard is public-classified but imports admin auth/client (/inner-circle/admin/dashboard) - pages/inner-circle/admin/dashboard.tsx

## Product ladder gaps

- [AMBER] PRODUCT_NO_ADMIN_VISIBILITY: Fast Diagnostic has no obvious admin visibility route
- [AMBER] PRODUCT_NO_ADMIN_VISIBILITY: Purpose Alignment has no obvious admin visibility route
- [AMBER] PRODUCT_NO_ADMIN_VISIBILITY: Team Assessment has no obvious admin visibility route
- [RED] PRODUCT_NO_LADDER_REGISTRY: Enterprise Assessment has route/API surface but no registry declaration
- [RED] PRODUCT_NO_LADDER_REGISTRY: Paid Executive Report has route/API surface but no registry declaration
- [AMBER] PRODUCT_NO_ADMIN_VISIBILITY: Paid Executive Report has no obvious admin visibility route
- [RED] PRODUCT_NO_LADDER_REGISTRY: Decision Centre has route/API surface but no registry declaration
- [AMBER] PRODUCT_NO_ADMIN_VISIBILITY: Decision Centre has no obvious admin visibility route
- [RED] PRODUCT_NO_LADDER_REGISTRY: GMI Reports has route/API surface but no registry declaration

## Recommended fix order

1. RED security/access findings: admin APIs, debug surfaces, token/entitlement delivery routes.
2. RED paid/delivery path findings: checkout, Stripe webhook idempotency/signature, paid report delivery.
3. RED false-publication/outbound findings: approval gates, dry-run vs publish state, provider evidence.
4. Foundry false-green and simulation/live ambiguity: require proof beyond registry declarations.
5. AMBER ownership/navigation gaps: registry owners, admin nav truth, dashboard visibility.
6. Governance durability gaps: durable writes, registered-vs-emitted event parity, explicit failure states.

## No fixes applied

No product, content, auth, commercial, outbound, Foundry, or platform implementation files were changed by this audit pass.

