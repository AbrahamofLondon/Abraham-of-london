# Product Spine Map

## Surface → Record → Admin → Foundry → Events

| Product Surface | Canonical Record | Admin Owner | Foundry Module | Key Events |
|---|---|---|---|---|
| Editorials | ContentAsset | `/admin/content` | editorial-style-checker | CONTENT_PUBLISHED, CONTENT_UPDATED |
| Blog / Essays | ContentAsset | `/admin/content` | editorial-style-checker | CONTENT_PUBLISHED, CONTENT_UPDATED |
| Shorts | ContentAsset | `/admin/content` | editorial-style-checker | CONTENT_PUBLISHED |
| Briefs | ContentAsset | `/admin/content` | content-red-team | CONTENT_PUBLISHED |
| Canon | ContentAsset | `/admin/content` | — | CONTENT_PUBLISHED |
| Fast Diagnostic | DiagnosticRun | `/admin/intelligence-foundry/simulation/fast-diagnostic` | fast-diagnostic | DIAGNOSTIC_STARTED, DIAGNOSTIC_COMPLETED |
| Purpose Alignment | DiagnosticRun | `/admin/intelligence-foundry/simulation/fast-diagnostic` | purpose-alignment | PURPOSE_ALIGNMENT_STARTED, PURPOSE_ALIGNMENT_COMPLETED |
| Constitutional Diagnostic | DiagnosticRun | `/admin/intelligence-foundry/simulation/constitutional-diagnostic` | constitutional-diagnostic | CONSTITUTIONAL_STARTED, CONSTITUTIONAL_COMPLETED |
| Executive Reporting | ExecutiveReport | `/admin/reporting/executive` | executive-reporting | EXECUTIVE_REPORT_GENERATED, EXECUTIVE_REPORT_EXPORTED |
| Strategy Room | StrategyRoomCase | `/admin/strategy-room` | strategy-room | STRATEGY_ROOM_CASE_OPENED, DIRECTIVE_DERIVED |
| Boardroom Mode | BoardroomDossier | `/admin/intelligence-foundry/simulation/boardroom-mode` | boardroom-dossier | BOARDROOM_DOSSIER_GENERATED, BOARDROOM_DOSSIER_EXPORTED |
| Enterprise Decision Authority | EnterpriseCampaign | `/admin/enterprise` | enterprise-decision-authority | ENTERPRISE_CAMPAIGN_CREATED, ENTERPRISE_CAMPAIGN_EXECUTED |
| GMI | GmiRelease | `/admin/intelligence/gmi-release-console` | gmi | GMI_RELEASE_REVIEWED, GMI_RELEASE_PUBLISHED |
| LinkedIn Publishing | OutboundPost | `/admin/outbound/linkedin` | outbound-content-validator | OUTBOUND_PUBLISHED, OUTBOUND_FAILED |
| Facebook Publishing | OutboundPost | `/admin/outbound/facebook` | outbound-content-validator | OUTBOUND_PUBLISHED, OUTBOUND_FAILED |
| X Publishing | OutboundPost | `/admin/outbound/x` | outbound-content-validator | OUTBOUND_PUBLISHED, OUTBOUND_FAILED |

## Record → Privacy → Retention

| Record | Privacy | Retention |
|---|---|---|
| ContentAsset | PUBLIC | Indefinite |
| DiagnosticRun | SENSITIVE | 2 years |
| ExecutiveReport | RESTRICTED | 5 years |
| StrategyRoomCase | RESTRICTED | 5 years |
| BoardroomDossier | RESTRICTED | 5 years |
| EnterpriseCampaign | RESTRICTED | 5 years |
| GmiRelease | SENSITIVE | 3 years |
| OutboundPost | PUBLIC | 2 years |
| ResearchRun | INTERNAL | Indefinite |
| FoundryFinding | INTERNAL | Indefinite |
| ActionBrief | INTERNAL | Indefinite |
| AccessGrant | SENSITIVE | 5 years |
| Entitlement | SENSITIVE | 5 years |
| AuditEvent | INTERNAL | 7 years |
| LineageEvent | INTERNAL | 7 years |

## Admin Domain → Routes

| Domain | Routes |
|---|---|
| Command Centre | `/admin`, `/admin/operator`, `/admin/command-wall`, `/admin/command`, `/admin/authority-center`, `/admin/product-surfaces` |
| Product Operations | `/admin/reporting/executive`, `/admin/reports`, `/admin/reporting/lineage`, `/admin/strategy-room`, `/admin/enterprise`, `/admin/campaign`, `/admin/calibration`, `/admin/institutional-analytics`, `/admin/retained-cadence`, `/admin/retainer-readiness`, `/admin/oversight-review`, `/admin/outcome-ledger`, `/admin/suppression-ledger` |
| Intelligence Foundry | `/admin/intelligence-foundry`, `/admin/intelligence-foundry/runs`, `/admin/intelligence-foundry/scenario`, `/admin/intelligence-foundry/simulation/*`, `/admin/intelligence-foundry/engines`, `/admin/intelligence-foundry/performance`, `/admin/intelligence-foundry/chaos`, `/admin/intelligence-foundry/data-poisoning`, `/admin/intelligence-foundry/health`, `/admin/intelligence-foundry/trash-day`, `/admin/intelligence-foundry/red-team/*`, `/admin/intelligence-foundry/outbound`, `/admin/intelligence-foundry/product-health` |
| Content & Editorial | `/admin/content`, `/admin/content-vault` |
| Outbound Publishing | `/admin/outbound/linkedin`, `/admin/outbound/facebook`, `/admin/outbound/x` |
| Access & Entitlements | `/admin/access`, `/admin/users` |
| Audit & Lineage | `/admin/audit`, `/admin/reporting/lineage` |
| Intelligence | `/admin/decision-intelligence`, `/admin/intelligence`, `/admin/intelligence/gmi-release-console`, `/admin/intelligence/gmi-signal-monitor`, `/admin/intelligence/gmi-event-log`, `/admin/decision/efficacy`, `/admin/decision/governance`, `/admin/decision/performance`, `/admin/decision/metadata-audit` |
