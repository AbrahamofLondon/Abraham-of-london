# Public Route Authority Map

Generated: 2026-05-07T18:53:14.605Z

## Key Findings

- `/pricing` is an admin-only surface on a public-looking path; it is now protected by `app/(dashboard)/layout.tsx` but remains a confusion risk.
- Homepage authority currently resolves from `pages/index.tsx`; `app/page.tsx` is absent.
- Duplicate API paths should be rationalised before launch where both app and pages implementations coexist.

## Route Inventory

| Route | Kind | Source | Classification | Protected | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | page | `pages/index.tsx` | `Buyer-facing` | no | Homepage currently resolves from pages router. |
| `/__pdf/[slug]` | page | `app/__pdf/[slug]/page.tsx` | `Buyer-facing` | no |  |
| `/[slug]` | page | `pages/[slug].tsx` | `Buyer-facing` | no |  |
| `/[type]-sitemap.xml` | page | `pages/[type]-sitemap.xml.ts` | `Buyer-facing` | no |  |
| `/about` | page | `pages/about.tsx` | `Buyer-facing` | no |  |
| `/about/founder` | page | `pages/about/founder.tsx` | `Buyer-facing` | no |  |
| `/access` | page | `pages/access/index.tsx` | `Legacy redirect` | yes |  |
| `/access/accept` | page | `pages/access/accept.tsx` | `Admin-only` | yes |  |
| `/access/redeem` | page | `pages/access/redeem.tsx` | `Admin-only` | yes |  |
| `/accessibility` | page | `pages/accessibility.tsx` | `Buyer-facing` | no |  |
| `/accessibility-statement` | page | `pages/accessibility-statement.tsx` | `Buyer-facing` | no |  |
| `/admin` | page | `pages/admin/index.tsx` | `Admin-only` | yes |  |
| `/admin/access-keys` | page | `pages/admin/access-keys.tsx` | `Admin-only` | yes |  |
| `/admin/access-revoke` | page | `pages/admin/access-revoke.tsx` | `Legacy redirect` | yes |  |
| `/admin/assets` | page | `pages/admin/assets.tsx` | `Admin-only` | yes |  |
| `/admin/audit` | page | `app/admin/audit/page.tsx` | `Admin-only` | yes |  |
| `/admin/authority-center` | page | `pages/admin/authority-center.tsx` | `Admin-only` | yes |  |
| `/admin/calibration` | page | `pages/admin/calibration.tsx` | `Admin-only` | yes |  |
| `/admin/campaigns` | page | `app/admin/campaigns/page.tsx` | `Admin-only` | yes |  |
| `/admin/campaigns/[id]` | page | `app/admin/campaigns/[id]/page.tsx` | `Admin-only` | yes |  |
| `/admin/campaigns/[id]/report` | page | `app/admin/campaigns/[id]/report/page.tsx` | `Admin-only` | yes |  |
| `/admin/campaigns/new` | page | `app/admin/campaigns/new/page.tsx` | `Admin-only` | yes |  |
| `/admin/command-wall` | page | `pages/admin/command-wall.tsx` | `Admin-only` | yes |  |
| `/admin/commercial` | page | `app/admin/commercial/page.tsx` | `Admin-only` | yes |  |
| `/admin/conversion-dashboard` | page | `pages/admin/conversion-dashboard.tsx` | `Admin-only` | yes |  |
| `/admin/decision-intelligence` | page | `app/admin/decision-intelligence/page.tsx` | `Admin-only` | yes |  |
| `/admin/decision/contextual-efficacy` | page | `app/admin/decision/contextual-efficacy/page.tsx` | `Admin-only` | yes |  |
| `/admin/decision/contextual-ranking` | page | `app/admin/decision/contextual-ranking/page.tsx` | `Admin-only` | yes |  |
| `/admin/decision/efficacy` | page | `app/admin/decision/efficacy/page.tsx` | `Admin-only` | yes |  |
| `/admin/decision/governance` | page | `app/admin/decision/governance/page.tsx` | `Admin-only` | yes |  |
| `/admin/decision/metadata-audit` | page | `app/admin/decision/metadata-audit/page.tsx` | `Admin-only` | yes |  |
| `/admin/decision/performance` | page | `app/admin/decision/performance/page.tsx` | `Admin-only` | yes |  |
| `/admin/enterprise-foundation` | page | `pages/admin/enterprise-foundation.tsx` | `Admin-only` | yes |  |
| `/admin/enterprise-pipeline` | page | `pages/admin/enterprise-pipeline.tsx` | `Admin-only` | yes |  |
| `/admin/inner-circle` | page | `pages/admin/inner-circle/index.tsx` | `Admin-only` | yes |  |
| `/admin/intelligence` | page | `pages/admin/intelligence.tsx` | `Admin-only` | yes |  |
| `/admin/login` | page | `pages/admin/login.tsx` | `Admin-only` | yes |  |
| `/admin/organisations` | page | `app/admin/organisations/page.tsx` | `Admin-only` | yes |  |
| `/admin/organisations/[id]` | page | `app/admin/organisations/[id]/page.tsx` | `Admin-only` | yes |  |
| `/admin/organisations/[id]/campaigns/new` | page | `app/admin/organisations/[id]/campaigns/new/page.tsx` | `Admin-only` | yes |  |
| `/admin/organisations/[id]/dashboard` | page | `app/admin/organisations/[id]/dashboard/page.tsx` | `Admin-only` | yes |  |
| `/admin/organisations/[id]/report` | page | `app/admin/organisations/[id]/report/page.tsx` | `Admin-only` | yes |  |
| `/admin/organisations/new` | page | `app/admin/organisations/new/page.tsx` | `Admin-only` | yes |  |
| `/admin/outcome-ledger` | page | `pages/admin/outcome-ledger.tsx` | `Admin-only` | yes |  |
| `/admin/pdf-dashboard` | page | `pages/admin/pdf-dashboard.tsx` | `Admin-only` | yes |  |
| `/admin/pdf-status` | page | `pages/admin/pdf-status.tsx` | `Admin-only` | yes |  |
| `/admin/proof` | page | `pages/admin/proof.tsx` | `Admin-only` | yes |  |
| `/admin/redis` | page | `pages/admin/redis.tsx` | `Admin-only` | yes |  |
| `/admin/reporting/executive/[...slug]` | page | `app/admin/reporting/executive/[...slug]/page.tsx` | `Admin-only` | yes |  |
| `/admin/reporting/executive/[id]` | page | `app/admin/reporting/executive/[id]/page.tsx` | `Admin-only` | yes |  |
| `/admin/reports` | page | `app/admin/reports/page.tsx` | `Admin-only` | yes |  |
| `/admin/snapshot` | page | `app/admin/snapshot/page.tsx` | `Admin-only` | yes |  |
| `/admin/validation` | page | `pages/admin/validation.tsx` | `Admin-only` | yes |  |
| `/api/access/accept-invite` | api | `pages/api/access/accept-invite.ts` | `Internal API` | no |  |
| `/api/access/check` | api | `pages/api/access/check.ts` | `Internal API` | no |  |
| `/api/access/clear` | api | `pages/api/access/clear.ts` | `Internal API` | no |  |
| `/api/access/download` | api | `pages/api/access/download.ts` | `Internal API` | no |  |
| `/api/access/enter` | api | `pages/api/access/enter.ts` | `Internal API` | no |  |
| `/api/access/logout` | api | `pages/api/access/logout.ts` | `Internal API` | yes |  |
| `/api/access/me` | api | `pages/api/access/me.ts` | `Internal API` | no |  |
| `/api/access/redeem` | api | `pages/api/access/redeem.ts` | `Internal API` | no |  |
| `/api/access/revoke` | api | `pages/api/access/revoke.ts` | `Internal API` | no |  |
| `/api/access/serve` | api | `pages/api/access/serve.ts` | `Internal API` | no |  |
| `/api/access/verify` | api | `pages/api/access/verify.ts` | `Internal API` | no |  |
| `/api/admin-client` | api | `pages/api/admin-client.ts` | `Internal API` | yes |  |
| `/api/admin/access-keys` | api | `pages/api/admin/access-keys/index.ts` | `Internal API` | yes |  |
| `/api/admin/access-keys/[id]/revoke` | api | `pages/api/admin/access-keys/[id]/revoke.ts` | `Internal API` | yes |  |
| `/api/admin/access-keys/[id]/uses` | api | `pages/api/admin/access-keys/[id]/uses.ts` | `Internal API` | yes |  |
| `/api/admin/access-keys/create` | api | `pages/api/admin/access-keys/create.ts` | `Internal API` | yes |  |
| `/api/admin/audit-logs` | api | `pages/api/admin/audit-logs.ts` | `Internal API` | yes |  |
| `/api/admin/audit/logs` | api | `pages/api/admin/audit/logs.ts` | `Internal API` | yes |  |
| `/api/admin/auth/send-link` | api | `pages/api/admin/auth/send-link.ts` | `Internal API` | yes |  |
| `/api/admin/auth/verify` | api | `pages/api/admin/auth/verify.ts` | `Internal API` | yes |  |
| `/api/admin/campaigns` | api | `app/api/admin/campaigns/route.ts` | `Internal API` | yes |  |
| `/api/admin/campaigns/[id]` | api | `app/api/admin/campaigns/[id]/route.ts` | `Internal API` | yes |  |
| `/api/admin/campaigns/[id]/report` | api | `app/api/admin/campaigns/[id]/report/route.ts` | `Internal API` | yes |  |
| `/api/admin/campaigns/[id]/report-data` | api | `app/api/admin/campaigns/[id]/report-data/route.ts` | `Internal API` | yes |  |
| `/api/admin/campaigns/[id]/report/export-json` | api | `app/api/admin/campaigns/[id]/report/export-json/route.ts` | `Internal API` | yes |  |
| `/api/admin/campaigns/[id]/report/pdf` | api | `app/api/admin/campaigns/[id]/report/pdf/route.ts` | `Internal API` | yes |  |
| `/api/admin/commercial` | api | `app/api/admin/commercial/route.ts` | `Internal API` | yes |  |
| `/api/admin/deal-flow-stats` | api | `pages/api/admin/deal-flow-stats.ts` | `Internal API` | yes |  |
| `/api/admin/decision-intelligence` | api | `app/api/admin/decision-intelligence/route.ts` | `Internal API` | yes |  |
| `/api/admin/decision/contextual-efficacy` | api | `app/api/admin/decision/contextual-efficacy/route.ts` | `Internal API` | yes |  |
| `/api/admin/decision/contextual-ranking` | api | `app/api/admin/decision/contextual-ranking/route.ts` | `Internal API` | yes |  |
| `/api/admin/decision/efficacy` | api | `app/api/admin/decision/efficacy/route.ts` | `Internal API` | yes |  |
| `/api/admin/decision/governance` | api | `app/api/admin/decision/governance/route.ts` | `Internal API` | yes |  |
| `/api/admin/decision/performance` | api | `app/api/admin/decision/performance/route.ts` | `Internal API` | yes |  |
| `/api/admin/decision/rebuild-contextual-efficacy` | api | `app/api/admin/decision/rebuild-contextual-efficacy/route.ts` | `Internal API` | yes |  |
| `/api/admin/decision/rebuild-efficacy` | api | `app/api/admin/decision/rebuild-efficacy/route.ts` | `Internal API` | yes |  |
| `/api/admin/decision/rebuild-governance-alerts` | api | `app/api/admin/decision/rebuild-governance-alerts/route.ts` | `Internal API` | yes |  |
| `/api/admin/decision/rebuild-performance` | api | `app/api/admin/decision/rebuild-performance/route.ts` | `Internal API` | yes |  |
| `/api/admin/decision/signal-registry` | api | `app/api/admin/decision/signal-registry/route.ts` | `Internal API` | yes |  |
| `/api/admin/dev-login` | api | `app/api/admin/dev-login/route.ts` | `Internal API` | yes |  |
| `/api/admin/diagnostics/artifacts` | api | `pages/api/admin/diagnostics/artifacts.ts` | `Internal API` | yes |  |
| `/api/admin/diagnostics/grants/revoke` | api | `pages/api/admin/diagnostics/grants/revoke.ts` | `Internal API` | yes |  |
| `/api/admin/diagnostics/jobs/process` | api | `pages/api/admin/diagnostics/jobs/process.ts` | `Internal API` | yes |  |
| `/api/admin/diagnostics/records` | api | `pages/api/admin/diagnostics/records.ts` | `Internal API` | yes |  |
| `/api/admin/diagnostics/regenerate` | api | `pages/api/admin/diagnostics/regenerate.ts` | `Internal API` | yes |  |
| `/api/admin/diagnostics/retention/run` | api | `pages/api/admin/diagnostics/retention/run.ts` | `Internal API` | yes |  |
| `/api/admin/diagnostics/revoke` | api | `pages/api/admin/diagnostics/revoke.ts` | `Internal API` | yes |  |
| `/api/admin/diagnostics/summary` | api | `pages/api/admin/diagnostics/summary.ts` | `Internal API` | yes |  |
| `/api/admin/enterprise-foundation` | api | `app/api/admin/enterprise-foundation/route.ts` | `Internal API` | yes |  |
| `/api/admin/export-audit` | api | `pages/api/admin/export-audit.ts` | `Internal API` | yes |  |
| `/api/admin/export-vips` | api | `pages/api/admin/export-vips.ts` | `Internal API` | yes |  |
| `/api/admin/identity-audit` | api | `pages/api/admin/identity-audit.ts` | `Internal API` | yes |  |
| `/api/admin/inner-circle/export` | api | `pages/api/admin/inner-circle/export.ts` | `Internal API` | yes |  |
| `/api/admin/inner-circle/export/route` | api | `pages/api/admin/inner-circle/export/route.ts` | `Internal API` | yes |  |
| `/api/admin/inner-circle/issue` | api | `pages/api/admin/inner-circle/issue.ts` | `Internal API` | yes |  |
| `/api/admin/inner-circle/revoke` | api | `pages/api/admin/inner-circle/revoke.ts` | `Internal API` | yes |  |
| `/api/admin/institutional-analytics` | api | `pages/api/admin/institutional-analytics.ts` | `Internal API` | yes |  |
| `/api/admin/invites` | api | `pages/api/admin/invites/index.ts` | `Internal API` | yes |  |
| `/api/admin/invites/[id]/revoke` | api | `pages/api/admin/invites/[id]/revoke.ts` | `Internal API` | yes |  |
| `/api/admin/invites/create` | api | `pages/api/admin/invites/create.ts` | `Internal API` | yes |  |
| `/api/admin/jobs/dead-letter` | api | `pages/api/admin/jobs/dead-letter/index.ts` | `Internal API` | yes |  |
| `/api/admin/jobs/dead-letter/replay` | api | `pages/api/admin/jobs/dead-letter/replay.ts` | `Internal API` | yes |  |
| `/api/admin/jobs/process` | api | `pages/api/admin/jobs/process.ts` | `Internal API` | yes |  |
| `/api/admin/members/keys` | api | `pages/api/admin/members/keys.ts` | `Internal API` | yes |  |
| `/api/admin/members/list` | api | `pages/api/admin/members/list.ts` | `Internal API` | yes |  |
| `/api/admin/members/revoke` | api | `pages/api/admin/members/revoke.ts` | `Internal API` | yes |  |
| `/api/admin/members/upgrade` | api | `pages/api/admin/members/upgrade.ts` | `Internal API` | yes |  |
| `/api/admin/onboard-principal` | api | `pages/api/admin/onboard-principal.ts` | `Internal API` | yes |  |
| `/api/admin/pdf-analytics` | api | `pages/api/admin/pdf-analytics.ts` | `Internal API` | yes |  |
| `/api/admin/pdf-status` | api | `pages/api/admin/pdf-status.ts` | `Internal API` | yes |  |
| `/api/admin/positioning` | api | `app/api/admin/positioning/route.ts` | `Internal API` | yes |  |
| `/api/admin/pricing` | api | `pages/api/admin/pricing.ts` | `Internal API` | yes |  |
| `/api/admin/proof/evidence` | api | `pages/api/admin/proof/evidence/index.ts` | `Internal API` | yes |  |
| `/api/admin/proof/evidence/[id]` | api | `pages/api/admin/proof/evidence/[id].ts` | `Internal API` | yes |  |
| `/api/admin/reports` | api | `pages/api/admin/reports/index.ts` | `Internal API` | yes |  |
| `/api/admin/reports/[id]` | api | `pages/api/admin/reports/[id].ts` | `Internal API` | yes |  |
| `/api/admin/reports/[id]/deliver` | api | `pages/api/admin/reports/[id]/deliver.ts` | `Internal API` | yes |  |
| `/api/admin/reports/ReportQueueTable` | api | `pages/api/admin/reports/ReportQueueTable.tsx` | `Internal API` | yes |  |
| `/api/admin/security/appeal` | api | `pages/api/admin/security/appeal.ts` | `Internal API` | yes |  |
| `/api/admin/security/deny` | api | `pages/api/admin/security/deny.ts` | `Internal API` | yes |  |
| `/api/admin/security/events` | api | `pages/api/admin/security/events.ts` | `Internal API` | yes |  |
| `/api/admin/security/resolve-appeal` | api | `pages/api/admin/security/resolve-appeal.ts` | `Internal API` | yes |  |
| `/api/admin/security/toggle-lock` | api | `pages/api/admin/security/toggle-lock.ts` | `Internal API` | yes |  |
| `/api/admin/status-report` | api | `pages/api/admin/status-report.ts` | `Internal API` | yes |  |
| `/api/admin/sync-fix` | api | `pages/api/admin/sync-fix.ts` | `Dead/unsafe` | yes |  |
| `/api/admin/system-health` | api | `pages/api/admin/system-health.ts` | `Internal API` | yes |  |
| `/api/admin/users/upgrade` | api | `pages/api/admin/users/upgrade.ts` | `Internal API` | yes |  |
| `/api/admin/validation` | api | `pages/api/admin/validation.ts` | `Internal API` | yes |  |
| `/api/alignment/enterprise` | api | `app/api/alignment/enterprise/route.ts` | `Internal API` | no |  |
| `/api/alignment/enterprise/assessments` | api | `app/api/alignment/enterprise/assessments/route.ts` | `Internal API` | no |  |
| `/api/alignment/enterprise/campaigns` | api | `app/api/alignment/enterprise/campaigns/route.ts` | `Internal API` | no |  |
| `/api/alignment/enterprise/campaigns/[id]` | api | `app/api/alignment/enterprise/campaigns/[id]/route.ts` | `Internal API` | no |  |
| `/api/alignment/enterprise/campaigns/[id]/aggregate` | api | `app/api/alignment/enterprise/campaigns/[id]/aggregate/route.ts` | `Internal API` | no |  |
| `/api/alignment/enterprise/campaigns/[id]/close` | api | `app/api/alignment/enterprise/campaigns/[id]/close/route.ts` | `Internal API` | no |  |
| `/api/alignment/enterprise/campaigns/[id]/invite` | api | `app/api/alignment/enterprise/campaigns/[id]/invite/route.ts` | `Internal API` | no |  |
| `/api/alignment/enterprise/campaigns/[id]/notify` | api | `app/api/alignment/enterprise/campaigns/[id]/notify/route.ts` | `Internal API` | no |  |
| `/api/alignment/enterprise/campaigns/[id]/nudge` | api | `app/api/alignment/enterprise/campaigns/[id]/nudge/route.ts` | `Internal API` | no |  |
| `/api/alignment/enterprise/campaigns/[id]/report` | api | `app/api/alignment/enterprise/campaigns/[id]/report/route.ts` | `Internal API` | no |  |
| `/api/alignment/enterprise/organisations` | api | `app/api/alignment/enterprise/organisations/route.ts` | `Internal API` | no |  |
| `/api/alignment/enterprise/respond/[token]` | api | `app/api/alignment/enterprise/respond/[token]/route.ts` | `Internal API` | no |  |
| `/api/analytics/downloads/summary` | api | `pages/api/analytics/downloads/summary.ts` | `Internal API` | no |  |
| `/api/analytics/event` | api | `pages/api/analytics/event.ts` | `Internal API` | no |  |
| `/api/analytics/executive-report` | api | `app/api/analytics/executive-report/route.ts` | `Internal API` | yes |  |
| `/api/analytics/journey` | api | `app/api/analytics/journey/route.ts` | `Internal API` | no |  |
| `/api/artifacts/global-market-intelligence-q1-2026-boardroom-pdf` | api | `pages/api/artifacts/global-market-intelligence-q1-2026-boardroom-pdf.ts` | `Internal API` | no |  |
| `/api/assessments/enterprise/run` | api | `app/api/assessments/enterprise/run/route.ts` | `Internal API` | no |  |
| `/api/assessments/team/run` | api | `app/api/assessments/team/run/route.ts` | `Internal API` | no |  |
| `/api/assets/retrieve` | api | `pages/api/assets/retrieve.ts` | `Internal API` | yes |  |
| `/api/assets/serve-pdf` | api | `pages/api/assets/serve-pdf.ts` | `Internal API` | yes |  |
| `/api/audit/[id]/submit` | api | `app/api/audit/[id]/submit/route.ts` | `Internal API` | no |  |
| `/api/audit/[id]/success` | api | `app/api/audit/[id]/success/page.tsx` | `Internal API` | no |  |
| `/api/audit/log` | api | `app/api/audit/log/route.ts` | `Internal API` | yes |  |
| `/api/audit/submit` | api | `app/api/audit/submit/route.ts` | `Internal API` | no |  |
| `/api/auth/[...nextauth]` | api | `pages/api/auth/[...nextauth].ts` | `Internal API` | no |  |
| `/api/auth/identity` | api | `pages/api/auth/identity.ts` | `Internal API` | no |  |
| `/api/auth/me` | api | `pages/api/auth/me.ts` | `Internal API` | no |  |
| `/api/auth/mint` | api | `pages/api/auth/mint.ts` | `Internal API` | no |  |
| `/api/auth/session` | api | `pages/api/auth/session.ts` | `Internal API` | yes |  |
| `/api/auth/sovereign` | api | `app/api/auth/sovereign/route.ts` | `Internal API` | no |  |
| `/api/auth/sovereign-login` | api | `pages/api/auth/sovereign-login.ts` | `Internal API` | no |  |
| `/api/billing/checkout` | api | `pages/api/billing/checkout.ts` | `Internal API` | no |  |
| `/api/billing/webhook` | api | `pages/api/billing/webhook.ts` | `Internal API` | no |  |
| `/api/blog/[slug]` | api | `pages/api/blog/[slug].ts` | `Internal API` | no |  |
| `/api/boardroom/dossier` | api | `app/api/boardroom/dossier/route.ts` | `Internal API` | yes |  |
| `/api/boardroom/dossier/pdf` | api | `app/api/boardroom/dossier/pdf/route.ts` | `Internal API` | yes |  |
| `/api/books/[slug]` | api | `pages/api/books/[slug].ts` | `Internal API` | no |  |
| `/api/briefs/[slug]` | api | `pages/api/briefs/[slug].ts` | `Internal API` | yes |  |
| `/api/calibration/ingest` | api | `app/api/calibration/ingest/route.ts` | `Internal API` | no |  |
| `/api/campaigns/[id]/invite` | api | `app/api/campaigns/[id]/invite/route.ts` | `Internal API` | no |  |
| `/api/campaigns/[id]/nudge` | api | `app/api/campaigns/[id]/nudge/route.ts` | `Internal API` | no |  |
| `/api/campaigns/[id]/report` | api | `app/api/campaigns/[id]/report/route.ts` | `Internal API` | no |  |
| `/api/campaigns/[id]/report/json` | api | `app/api/campaigns/[id]/report/json/route.ts` | `Internal API` | no |  |
| `/api/campaigns/[id]/report/pdf` | api | `app/api/campaigns/[id]/report/pdf/route.ts` | `Internal API` | no |  |
| `/api/campaigns/[id]/report/pdf-file` | api | `app/api/campaigns/[id]/report/pdf-file/route.tsx` | `Internal API` | no |  |
| `/api/canon/[slug]` | api | `pages/api/canon/[slug].ts` | `Internal API` | no |  |
| `/api/checkout` | api | `app/api/checkout/route.ts` | `Internal API` | no |  |
| `/api/constitution/assess` | api | `pages/api/constitution/assess.ts` | `Internal API` | no |  |
| `/api/constitution/command-centre` | api | `pages/api/constitution/command-centre.ts` | `Internal API` | no |  |
| `/api/constitution/interventions` | api | `pages/api/constitution/interventions.ts` | `Internal API` | no |  |
| `/api/constitutional/appeal` | api | `app/api/constitutional/appeal/route.ts` | `Internal API` | no |  |
| `/api/constitutional/audit` | api | `app/api/constitutional/audit/route.ts` | `Internal API` | no |  |
| `/api/constitutional/export` | api | `app/api/constitutional/export/route.ts` | `Internal API` | no |  |
| `/api/contact` | api | `pages/api/contact.ts` | `Internal API` | no |  |
| `/api/content/[...slug]` | api | `pages/api/content/[...slug].ts` | `Internal API` | yes |  |
| `/api/content/initialize` | api | `pages/api/content/initialize.ts` | `Internal API` | no |  |
| `/api/contracts/[id]` | api | `pages/api/contracts/[id]/index.ts` | `Internal API` | no |  |
| `/api/contracts/[id]/checkpoint` | api | `pages/api/contracts/[id]/checkpoint.ts` | `Internal API` | no |  |
| `/api/contracts/[id]/verify` | api | `pages/api/contracts/[id]/verify.ts` | `Internal API` | no |  |
| `/api/contracts/create` | api | `pages/api/contracts/create.ts` | `Internal API` | no |  |
| `/api/contracts/verify` | api | `app/api/contracts/verify/route.ts` | `Internal API` | no |  |
| `/api/cron/calibration` | api | `app/api/cron/calibration/route.ts` | `Internal API` | no |  |
| `/api/cron/clean-keys` | api | `pages/api/cron/clean-keys.ts` | `Internal API` | no |  |
| `/api/cron/cleanup-download-security` | api | `pages/api/cron/cleanup-download-security.ts` | `Internal API` | no |  |
| `/api/cron/cleanup-download-token` | api | `pages/api/cron/cleanup-download-token.ts` | `Internal API` | yes |  |
| `/api/cron/decision-state` | api | `app/api/cron/decision-state/route.ts` | `Internal API` | no |  |
| `/api/cron/escalation` | api | `app/api/cron/escalation/route.ts` | `Internal API` | no |  |
| `/api/cron/security-sweep` | api | `pages/api/cron/security-sweep.ts` | `Internal API` | no |  |
| `/api/cron/snapshot` | api | `app/api/cron/snapshot/route.ts` | `Internal API` | no |  |
| `/api/dashboard/my-reports` | api | `pages/api/dashboard/my-reports.ts` | `Internal API` | yes |  |
| `/api/deal-flow/qualify` | api | `pages/api/deal-flow/qualify.ts` | `Internal API` | no |  |
| `/api/debug/contentlayer-exports` | api | `pages/api/debug/contentlayer-exports.ts` | `Internal API` | no |  |
| `/api/debug/contentlayer-registry` | api | `pages/api/debug/contentlayer-registry.ts` | `Internal API` | no |  |
| `/api/debug/ssot-health` | api | `pages/api/debug/ssot-health.ts` | `Internal API` | no |  |
| `/api/decision-instruments/results` | api | `pages/api/decision-instruments/results/index.ts` | `Internal API` | no |  |
| `/api/decision-instruments/send-purchase-email` | api | `pages/api/decision-instruments/send-purchase-email.ts` | `Internal API` | no |  |
| `/api/decision/credit-score` | api | `app/api/decision/credit-score/route.ts` | `Internal API` | yes |  |
| `/api/decision/guidance` | api | `app/api/decision/guidance/route.ts` | `Internal API` | no |  |
| `/api/decision/metadata-audit` | api | `app/api/decision/metadata-audit/route.ts` | `Internal API` | no |  |
| `/api/demo/governed-decision` | api | `app/api/demo/governed-decision/route.ts` | `Buyer-facing` | no | Public-demo API by design. |
| `/api/diagnostics/[ref]` | api | `pages/api/diagnostics/[ref].ts` | `Internal API` | no |  |
| `/api/diagnostics/campaigns/[id]/aggregate` | api | `app/api/diagnostics/campaigns/[id]/aggregate/route.ts` | `Internal API` | no |  |
| `/api/diagnostics/capture` | api | `pages/api/diagnostics/capture.ts` | `Internal API` | no |  |
| `/api/diagnostics/challenge` | api | `pages/api/diagnostics/challenge.ts` | `Internal API` | no |  |
| `/api/diagnostics/constitutional-handoff/[stage]` | api | `pages/api/diagnostics/constitutional-handoff/[stage].ts` | `Internal API` | no |  |
| `/api/diagnostics/constitutional-intake/report` | api | `pages/api/diagnostics/constitutional-intake/report.ts` | `Internal API` | no |  |
| `/api/diagnostics/create-report-checkout` | api | `pages/api/diagnostics/create-report-checkout.ts` | `Internal API` | no |  |
| `/api/diagnostics/directional-integrity` | api | `pages/api/diagnostics/directional-integrity.ts` | `Internal API` | no |  |
| `/api/diagnostics/enterprise` | api | `pages/api/diagnostics/enterprise.ts` | `Internal API` | no |  |
| `/api/diagnostics/evidence` | api | `app/api/diagnostics/evidence/route.ts` | `Internal API` | no |  |
| `/api/diagnostics/executive-reporting` | api | `pages/api/diagnostics/executive-reporting.ts` | `Internal API` | no |  |
| `/api/diagnostics/list` | api | `pages/api/diagnostics/list.ts` | `Internal API` | no |  |
| `/api/diagnostics/longitudinal` | api | `app/api/diagnostics/longitudinal/route.ts` | `Internal API` | no |  |
| `/api/diagnostics/multi-stakeholder` | api | `app/api/diagnostics/multi-stakeholder/route.ts` | `Internal API` | no |  |
| `/api/diagnostics/outcome` | api | `app/api/diagnostics/outcome/route.ts` | `Internal API` | no |  |
| `/api/diagnostics/outcomes/verify` | api | `app/api/diagnostics/outcomes/verify/route.ts` | `Internal API` | no |  |
| `/api/diagnostics/reentry` | api | `app/api/diagnostics/reentry/route.ts` | `Internal API` | no |  |
| `/api/diagnostics/report` | api | `pages/api/diagnostics/report.ts` | `Internal API` | no |  |
| `/api/diagnostics/report/[id]` | api | `pages/api/diagnostics/report/[id].ts` | `Internal API` | no |  |
| `/api/diagnostics/report/generate` | api | `pages/api/diagnostics/report/generate.ts` | `Internal API` | no |  |
| `/api/diagnostics/report/history` | api | `pages/api/diagnostics/report/history.ts` | `Internal API` | no |  |
| `/api/diagnostics/report/pdf` | api | `pages/api/diagnostics/report/pdf.ts` | `Internal API` | no |  |
| `/api/diagnostics/report/signed-url` | api | `pages/api/diagnostics/report/signed-url.ts` | `Internal API` | no |  |
| `/api/diagnostics/report/unlock` | api | `pages/api/diagnostics/report/unlock.ts` | `Internal API` | no |  |
| `/api/diagnostics/reports/download` | api | `pages/api/diagnostics/reports/download.ts` | `Internal API` | no |  |
| `/api/diagnostics/reports/issue` | api | `pages/api/diagnostics/reports/issue.ts` | `Internal API` | yes |  |
| `/api/diagnostics/score` | api | `pages/api/diagnostics/score.ts` | `Internal API` | no |  |
| `/api/diagnostics/spine/load` | api | `pages/api/diagnostics/spine/load.ts` | `Internal API` | no |  |
| `/api/diagnostics/spine/persist` | api | `pages/api/diagnostics/spine/persist.ts` | `Internal API` | no |  |
| `/api/diagnostics/submit` | api | `pages/api/diagnostics/submit.ts` | `Internal API` | no |  |
| `/api/diagnostics/team-alignment` | api | `pages/api/diagnostics/team-alignment.ts` | `Internal API` | no |  |
| `/api/diagnostics/telemetry` | api | `pages/api/diagnostics/telemetry.ts` | `Internal API` | no |  |
| `/api/dispatches/[slug]` | api | `pages/api/dispatches/[slug].ts` | `Internal API` | no |  |
| `/api/dl/[token]` | api | `pages/api/dl/[token].ts` | `Internal API` | no |  |
| `/api/download/[token]` | api | `app/api/download/[token]/route.ts` | `Internal API` | yes |  |
| `/api/downloads/[slug]` | api | `app/api/downloads/[slug]/route.ts` | `Internal API` | no |  |
| `/api/downloads/instrument-pdf` | api | `pages/api/downloads/instrument-pdf.ts` | `Internal API` | no |  |
| `/api/downloads/mdx` | api | `pages/api/downloads/mdx.ts` | `Internal API` | no |  |
| `/api/downloads/resolve/[slug]` | api | `pages/api/downloads/resolve/[slug].ts` | `Internal API` | no |  |
| `/api/downloads/resolve/[slug]/[...rest]` | api | `pages/api/downloads/resolve/[slug]/[...rest].ts` | `Internal API` | no |  |
| `/api/editorials/[slug]` | api | `app/api/editorials/[slug]/route.ts` | `Internal API` | no |  |
| `/api/editorials/citation/[slug]` | api | `pages/api/editorials/citation/[slug].ts` | `Internal API` | no |  |
| `/api/editorials/preview/[slug]` | api | `pages/api/editorials/preview/[slug].ts` | `Internal API` | no |  |
| `/api/endpoint` | api | `pages/api/endpoint.ts` | `Internal API` | no |  |
| `/api/enterprise-foundation/dependencies` | api | `app/api/enterprise-foundation/dependencies/route.ts` | `Internal API` | yes |  |
| `/api/enterprise-foundation/playbooks` | api | `app/api/enterprise-foundation/playbooks/route.ts` | `Internal API` | yes |  |
| `/api/enterprise-foundation/stakeholders` | api | `app/api/enterprise-foundation/stakeholders/route.ts` | `Internal API` | yes |  |
| `/api/entitlements` | api | `app/api/entitlements/route.ts` | `Internal API` | no |  |
| `/api/events/[slug]` | api | `pages/api/events/[slug].ts` | `Internal API` | no |  |
| `/api/events/checkout` | api | `pages/api/events/checkout.ts` | `Internal API` | yes |  |
| `/api/evidence/case-draft` | api | `app/api/evidence/case-draft/route.ts` | `Internal API` | yes |  |
| `/api/evidence/eligibility` | api | `app/api/evidence/eligibility/route.ts` | `Internal API` | yes |  |
| `/api/executive-reporting/entitlements` | api | `app/api/executive-reporting/entitlements/route.ts` | `Internal API` | no |  |
| `/api/executive-reporting/export/boardroom-pdf` | api | `app/api/executive-reporting/export/boardroom-pdf/route.ts` | `Internal API` | no |  |
| `/api/executive-reporting/export/intervention` | api | `app/api/executive-reporting/export/intervention/route.ts` | `Internal API` | no |  |
| `/api/executive-reporting/export/pdf` | api | `app/api/executive-reporting/export/pdf/route.ts` | `Internal API` | no |  |
| `/api/executive-reporting/run` | api | `app/api/executive-reporting/run/route.ts` | `Internal API` | no |  |
| `/api/executive/snapshot` | api | `app/api/executive/snapshot/route.ts` | `Internal API` | yes |  |
| `/api/follow-up/process` | api | `pages/api/follow-up/process.ts` | `Internal API` | no |  |
| `/api/follow-up/register` | api | `pages/api/follow-up/register.ts` | `Internal API` | no |  |
| `/api/frameworks/surrender/[slug]` | api | `pages/api/frameworks/surrender/[slug].ts` | `Internal API` | no |  |
| `/api/frameworks/surrender/[slug]/protected` | api | `pages/api/frameworks/surrender/[slug]/protected.ts` | `Internal API` | no |  |
| `/api/generate-all-pdfs` | api | `pages/api/generate-all-pdfs.ts` | `Internal API` | no |  |
| `/api/generate-pdf` | api | `pages/api/generate-pdf.ts` | `Internal API` | no |  |
| `/api/generate-pdfs/batch` | api | `pages/api/generate-pdfs/batch.ts` | `Internal API` | no |  |
| `/api/health` | api | `pages/api/health.ts` | `Internal API` | no |  |
| `/api/inner-circle/admin/export` | api | `app/api/inner-circle/admin/export/route.ts` | `Internal API` | no |  |
| `/api/inner-circle/generate-link` | api | `pages/api/inner-circle/generate-link.ts` | `Internal API` | no |  |
| `/api/inner-circle/issue` | api | `app/api/inner-circle/issue/route.ts` | `Internal API` | no |  |
| `/api/inner-circle/lexicon` | api | `pages/api/inner-circle/lexicon.ts` | `Internal API` | yes |  |
| `/api/inner-circle/register` | api | `pages/api/inner-circle/register.ts` | `Internal API` | no |  |
| `/api/inner-circle/resend` | api | `pages/api/inner-circle/resend.ts` | `Internal API` | no |  |
| `/api/inner-circle/retrieve/[briefId]` | api | `pages/api/inner-circle/retrieve/[briefId].ts` | `Internal API` | yes |  |
| `/api/inner-circle/self-revoke` | api | `pages/api/inner-circle/self-revoke.ts` | `Internal API` | no |  |
| `/api/inner-circle/unlock` | api | `pages/api/inner-circle/unlock.ts` | `Internal API` | no |  |
| `/api/inner-circle/verify` | api | `app/api/inner-circle/verify/route.ts` | `Internal API` | no |  |
| `/api/integrations/disconnect` | api | `pages/api/integrations/disconnect.ts` | `Internal API` | no |  |
| `/api/integrations/google/callback` | api | `pages/api/integrations/google/callback.ts` | `Internal API` | no |  |
| `/api/integrations/google/connect` | api | `pages/api/integrations/google/connect.ts` | `Internal API` | no |  |
| `/api/integrations/signals` | api | `pages/api/integrations/signals.ts` | `Internal API` | no |  |
| `/api/integrations/slack/callback` | api | `pages/api/integrations/slack/callback.ts` | `Internal API` | no |  |
| `/api/integrations/slack/connect` | api | `pages/api/integrations/slack/connect.ts` | `Internal API` | no |  |
| `/api/integrations/status` | api | `pages/api/integrations/status.ts` | `Internal API` | no |  |
| `/api/interactions/toggle` | api | `app/api/interactions/toggle/route.ts` | `Internal API` | yes |  |
| `/api/interpret` | api | `app/api/interpret/route.ts` | `Internal API` | no |  |
| `/api/keys/verify` | api | `pages/api/keys/verify.ts` | `Internal API` | no |  |
| `/api/leads/fuse` | api | `app/api/leads/fuse/route.ts` | `Internal API` | no |  |
| `/api/library/[slug]` | api | `pages/api/library/[slug].ts` | `Internal API` | no |  |
| `/api/live/constitutional-posture` | api | `app/api/live/constitutional-posture/route.ts` | `Internal API` | no |  |
| `/api/members/strategies` | api | `pages/api/members/strategies.ts` | `Internal API` | no |  |
| `/api/middleware-health` | api | `pages/api/middleware-health.ts` | `Internal API` | no |  |
| `/api/newsletter` | api | `pages/api/newsletter.tsx` | `Internal API` | no |  |
| `/api/og/short` | api | `pages/api/og/short.tsx` | `Internal API` | no |  |
| `/api/ogr/simulate` | api | `pages/api/ogr/simulate.ts` | `Internal API` | yes |  |
| `/api/pdf-data` | api | `pages/api/pdf-data.ts` | `Internal API` | no |  |
| `/api/pdfs/[id]` | api | `pages/api/pdfs/[id].ts` | `Internal API` | yes |  |
| `/api/pdfs/[id]/delete` | api | `pages/api/pdfs/[id]/delete.ts` | `Internal API` | yes |  |
| `/api/pdfs/[id]/duplicate` | api | `pages/api/pdfs/[id]/duplicate.ts` | `Internal API` | no |  |
| `/api/pdfs/[id]/generate` | api | `pages/api/pdfs/[id]/generate.ts` | `Internal API` | no |  |
| `/api/pdfs/[id]/metadata` | api | `pages/api/pdfs/[id]/metadata.ts` | `Internal API` | yes |  |
| `/api/pdfs/[id]/rename` | api | `pages/api/pdfs/[id]/rename.ts` | `Internal API` | yes |  |
| `/api/pdfs/generate` | api | `pages/api/pdfs/generate.ts` | `Internal API` | yes |  |
| `/api/pdfs/generate-all` | api | `pages/api/pdfs/generate-all.ts` | `Internal API` | no |  |
| `/api/pdfs/list` | api | `pages/api/pdfs/list.ts` | `Internal API` | yes |  |
| `/api/predictive/insights/[campaignId]` | api | `app/api/predictive/insights/[campaignId]/route.ts` | `Internal API` | yes |  |
| `/api/premium/admin/cleanup-expired-tokens` | api | `pages/api/premium/admin/cleanup-expired-tokens.ts` | `Internal API` | yes |  |
| `/api/premium/admin/download-anomalies` | api | `pages/api/premium/admin/download-anomalies.ts` | `Internal API` | yes |  |
| `/api/premium/admin/download-ledger` | api | `pages/api/premium/admin/download-ledger.ts` | `Internal API` | yes |  |
| `/api/premium/admin/revoke-by-content` | api | `pages/api/premium/admin/revoke-by-content.ts` | `Internal API` | yes |  |
| `/api/premium/admin/revoke-by-user` | api | `pages/api/premium/admin/revoke-by-user.ts` | `Internal API` | yes |  |
| `/api/premium/admin/revoke-token` | api | `pages/api/premium/admin/revoke-token.ts` | `Internal API` | yes |  |
| `/api/premium/admin/verify-watermark` | api | `pages/api/premium/admin/verify-watermark.ts` | `Internal API` | yes |  |
| `/api/premium/content` | api | `pages/api/premium/content/index.ts` | `Internal API` | no |  |
| `/api/premium/content/download/[id]` | api | `pages/api/premium/content/download/[id].ts` | `Internal API` | no |  |
| `/api/premium/dashboard` | api | `pages/api/premium/dashboard.ts` | `Internal API` | no |  |
| `/api/premium/forensics/attribution` | api | `app/api/premium/forensics/attribution/route.ts` | `Internal API` | no |  |
| `/api/private/frameworks/[slug]` | api | `pages/api/private/frameworks/[slug].ts` | `Internal API` | yes |  |
| `/api/private/vault/[...path]` | api | `pages/api/private/vault/[...path].ts` | `Internal API` | no |  |
| `/api/proof/evidence` | api | `pages/api/proof/evidence.ts` | `Internal API` | no |  |
| `/api/proof/public` | api | `pages/api/proof/public.ts` | `Internal API` | no |  |
| `/api/protected-content` | api | `pages/api/protected-content.ts` | `Internal API` | no |  |
| `/api/public/content` | api | `pages/api/public/content.ts` | `Internal API` | no |  |
| `/api/pulse/submit` | api | `app/api/pulse/submit/route.ts` | `Internal API` | no |  |
| `/api/purpose-alignment/assessments` | api | `app/api/purpose-alignment/assessments/route.ts` | `Internal API` | no |  |
| `/api/purpose-alignment/capture` | api | `app/api/purpose-alignment/capture/route.ts` | `Internal API` | no |  |
| `/api/purpose-alignment/reminders/preferences` | api | `app/api/purpose-alignment/reminders/preferences/route.ts` | `Internal API` | no |  |
| `/api/purpose-alignment/reminders/preferences/run` | api | `app/api/purpose-alignment/reminders/preferences/run/route.ts` | `Internal API` | no |  |
| `/api/purpose-alignment/report` | api | `app/api/purpose-alignment/report/route.ts` | `Legacy redirect` | no |  |
| `/api/purpose-alignment/report/[assessmentId]` | api | `app/api/purpose-alignment/report/[assessmentId]/route.ts` | `Legacy redirect` | no |  |
| `/api/rate-limit/stats` | api | `pages/api/rate-limit/stats.ts` | `Internal API` | no |  |
| `/api/reports/mine` | api | `pages/api/reports/mine.ts` | `Internal API` | no |  |
| `/api/reports/request` | api | `pages/api/reports/request.ts` | `Internal API` | no |  |
| `/api/reports/webhook` | api | `pages/api/reports/webhook.ts` | `Internal API` | no |  |
| `/api/resources/[...slug]` | api | `pages/api/resources/[...slug].ts` | `Internal API` | no |  |
| `/api/resources/mdx` | api | `pages/api/resources/mdx.ts` | `Internal API` | no |  |
| `/api/resources/strategic-frameworks` | api | `pages/api/resources/strategic-frameworks/index.ts` | `Internal API` | no |  |
| `/api/resources/strategic-frameworks/[...slug]` | api | `pages/api/resources/strategic-frameworks/[...slug].ts` | `Internal API` | no |  |
| `/api/retainers/contracts` | api | `app/api/retainers/contracts/route.ts` | `Internal API` | yes |  |
| `/api/retainers/decisions` | api | `app/api/retainers/decisions/route.ts` | `Internal API` | yes |  |
| `/api/retainers/enforcement-cycles` | api | `app/api/retainers/enforcement-cycles/route.ts` | `Internal API` | yes |  |
| `/api/retainers/surface` | api | `app/api/retainers/surface/route.ts` | `Internal API` | yes |  |
| `/api/root` | api | `app/api/root/route.ts` | `Internal API` | no |  |
| `/api/search` | api | `app/api/search/route.ts` | `Internal API` | yes |  |
| `/api/shorts/[slug]` | api | `pages/api/shorts/[slug].ts` | `Internal API` | no |  |
| `/api/shorts/[slug]/interactions` | api | `pages/api/shorts/[slug]/interactions.ts` | `Internal API` | no |  |
| `/api/shorts/[slug]/like` | api | `pages/api/shorts/[slug]/like.ts` | `Internal API` | no |  |
| `/api/shorts/[slug]/save` | api | `pages/api/shorts/[slug]/save.ts` | `Internal API` | no |  |
| `/api/sitemaps/[category]` | api | `pages/api/sitemaps/[category].ts` | `Internal API` | no |  |
| `/api/sovereign/auth` | api | `app/api/sovereign/auth/route.ts` | `Internal API` | no |  |
| `/api/sovereign/history` | api | `app/api/sovereign/history/route.ts` | `Internal API` | no |  |
| `/api/sovereign/logout` | api | `app/api/sovereign/logout/route.ts` | `Internal API` | no |  |
| `/api/sovereign/mandates` | api | `pages/api/sovereign/mandates.ts` | `Internal API` | no |  |
| `/api/sovereign/report` | api | `app/api/sovereign/report/route.ts` | `Internal API` | no |  |
| `/api/stats` | api | `app/api/stats/route.ts` | `Internal API` | no |  |
| `/api/strategy-room/analyze` | api | `pages/api/strategy-room/analyze.ts` | `Internal API` | no |  |
| `/api/strategy-room/analyze/route` | api | `pages/api/strategy-room/analyze/route.ts` | `Internal API` | no |  |
| `/api/strategy-room/briefing/return/[sessionId]` | api | `app/api/strategy-room/briefing/return/[sessionId]/route.ts` | `Internal API` | yes |  |
| `/api/strategy-room/briefing/scan` | api | `app/api/strategy-room/briefing/scan/route.ts` | `Internal API` | no |  |
| `/api/strategy-room/conversion` | api | `app/api/strategy-room/conversion/route.ts` | `Internal API` | yes |  |
| `/api/strategy-room/enrol` | api | `pages/api/strategy-room/enrol.ts` | `Internal API` | no |  |
| `/api/strategy-room/execution` | api | `app/api/strategy-room/execution/route.ts` | `Internal API` | yes |  |
| `/api/strategy-room/execution-record` | api | `app/api/strategy-room/execution-record/route.ts` | `Internal API` | no |  |
| `/api/strategy-room/execution/[id]` | api | `app/api/strategy-room/execution/[id]/route.ts` | `Internal API` | yes |  |
| `/api/strategy-room/execution/[id]/decisions` | api | `app/api/strategy-room/execution/[id]/decisions/route.ts` | `Internal API` | yes |  |
| `/api/strategy-room/execution/[id]/state` | api | `app/api/strategy-room/execution/[id]/state/route.ts` | `Internal API` | yes |  |
| `/api/strategy-room/execution/locked-record` | api | `app/api/strategy-room/execution/locked-record/route.ts` | `Internal API` | no |  |
| `/api/strategy-room/export/[slug]` | api | `pages/api/strategy-room/export/[slug].ts` | `Internal API` | yes |  |
| `/api/strategy-room/intake` | api | `pages/api/strategy-room/intake.ts` | `Internal API` | no |  |
| `/api/strategy-room/results` | api | `app/api/strategy-room/results/route.ts` | `Internal API` | yes |  |
| `/api/strategy-room/session/click` | api | `app/api/strategy-room/session/click/route.ts` | `Internal API` | yes |  |
| `/api/strategy-room/session/conversion` | api | `app/api/strategy-room/session/conversion/route.ts` | `Internal API` | yes |  |
| `/api/strategy-room/session/followup` | api | `app/api/strategy-room/session/followup/route.ts` | `Internal API` | yes |  |
| `/api/strategy-room/session/impression` | api | `app/api/strategy-room/session/impression/route.ts` | `Internal API` | yes |  |
| `/api/strategy-room/session/init` | api | `app/api/strategy-room/session/init/route.ts` | `Internal API` | yes |  |
| `/api/strategy-room/submit` | api | `pages/api/strategy-room/submit.ts` | `Internal API` | no |  |
| `/api/strategy-room/submit/route` | api | `pages/api/strategy-room/submit/route.ts` | `Internal API` | no |  |
| `/api/stripe/diagnostic-report-webhook` | api | `pages/api/stripe/diagnostic-report-webhook.ts` | `Internal API` | no |  |
| `/api/subscribe` | api | `pages/api/subscribe.ts` | `Internal API` | no |  |
| `/api/surrender/download/[id]` | api | `pages/api/surrender/download/[id].ts` | `Internal API` | no |  |
| `/api/system/health` | api | `pages/api/system/health.ts` | `Internal API` | no |  |
| `/api/system/lock-status` | api | `pages/api/system/lock-status.ts` | `Internal API` | no |  |
| `/api/system/maintenance` | api | `pages/api/system/maintenance.ts` | `Internal API` | no |  |
| `/api/team-assessment/campaign/[id]/aggregate` | api | `app/api/team-assessment/campaign/[id]/aggregate/route.ts` | `Internal API` | no |  |
| `/api/team-assessment/campaign/[id]/close` | api | `app/api/team-assessment/campaign/[id]/close/route.ts` | `Internal API` | no |  |
| `/api/team-assessment/campaign/[id]/invites` | api | `app/api/team-assessment/campaign/[id]/invites/route.ts` | `Internal API` | no |  |
| `/api/team-assessment/campaign/[id]/status` | api | `app/api/team-assessment/campaign/[id]/status/route.ts` | `Internal API` | no |  |
| `/api/team-assessment/campaign/create` | api | `app/api/team-assessment/campaign/create/route.ts` | `Internal API` | no |  |
| `/api/team-assessment/respond/[token]` | api | `app/api/team-assessment/respond/[token]/route.ts` | `Internal API` | no |  |
| `/api/team/respondents/[token]` | api | `app/api/team/respondents/[token]/route.ts` | `Internal API` | no |  |
| `/api/teaser` | api | `pages/api/teaser.ts` | `Internal API` | no |  |
| `/api/telemetry/global` | api | `app/api/telemetry/global/route.ts` | `Internal API` | no |  |
| `/api/telemetry/resonance` | api | `app/api/telemetry/resonance/route.ts` | `Internal API` | no |  |
| `/api/user/delete` | api | `app/api/user/delete/route.ts` | `Legacy redirect` | no |  |
| `/api/user/unsubscribe` | api | `app/api/user/unsubscribe/route.ts` | `Legacy redirect` | no |  |
| `/api/users` | api | `pages/api/users/index.ts` | `Internal API` | yes |  |
| `/api/v2/health` | api | `app/api/v2/health/route.ts` | `Internal API` | no |  |
| `/api/v2/users` | api | `app/api/v2/users/route.ts` | `Internal API` | no |  |
| `/api/vault/[...slug]` | api | `app/api/vault/[...slug]/route.ts` | `Internal API` | no |  |
| `/api/vault/status` | api | `app/api/vault/status/route.ts` | `Internal API` | no |  |
| `/api/verify-newsletter` | api | `pages/api/verify-newsletter.ts` | `Internal API` | no |  |
| `/api/webhooks/resend` | api | `pages/api/webhooks/resend.ts` | `Internal API` | no |  |
| `/api/webhooks/stripe` | api | `pages/api/webhooks/stripe.ts` | `Internal API` | no |  |
| `/artifacts` | page | `pages/artifacts.tsx` | `Buyer-facing` | no |  |
| `/artifacts/[id]` | page | `pages/artifacts/[id].tsx` | `Buyer-facing` | no |  |
| `/artifacts/global-market-outlook-q1-2026-public` | page | `pages/artifacts/global-market-outlook-q1-2026-public.tsx` | `Buyer-facing` | no |  |
| `/assessment/[token]` | page | `app/assessment/[token]/page.tsx` | `Buyer-facing` | no |  |
| `/assessment/success` | page | `app/assessment/success/page.tsx` | `Buyer-facing` | no |  |
| `/audit/[id]` | page | `app/audit/[id]/page.tsx` | `Buyer-facing` | no |  |
| `/audit/[id]/success` | page | `app/audit/[id]/success/page.tsx` | `Buyer-facing` | no |  |
| `/auth/signin` | page | `pages/auth/signin.tsx` | `Legacy redirect` | yes |  |
| `/blog` | page | `pages/blog/index.tsx` | `Buyer-facing` | no |  |
| `/blog-sitemap.xml` | page | `pages/blog-sitemap.xml.ts` | `Buyer-facing` | no |  |
| `/blog/[...slug]` | page | `pages/blog/[...slug].tsx` | `Buyer-facing` | no |  |
| `/board/c` | page | `pages/board/c.tsx` | `Dead/unsafe` | no |  |
| `/board/dashboard` | page | `pages/board/dashboard.tsx` | `Legacy redirect` | no |  |
| `/board/intelligence` | page | `pages/board/intelligence.tsx` | `Dead/unsafe` | no |  |
| `/books` | page | `pages/books/index.tsx` | `Buyer-facing` | no |  |
| `/books-sitemap.xml` | page | `pages/books-sitemap.xml.ts` | `Buyer-facing` | no |  |
| `/books/[slug]` | page | `pages/books/[slug].tsx` | `Buyer-facing` | no |  |
| `/books/the-architecture-of-human-purpose-landing` | page | `pages/books/the-architecture-of-human-purpose-landing.tsx` | `Buyer-facing` | no |  |
| `/brands` | page | `pages/brands/index.tsx` | `Buyer-facing` | no |  |
| `/briefing/return/[sessionId]` | page | `app/briefing/return/[sessionId]/page.tsx` | `Buyer-facing` | no |  |
| `/briefs/[slug]` | page | `app/briefs/[slug]/page.tsx` | `Admin-only` | yes |  |
| `/canon` | page | `pages/canon/index.tsx` | `Buyer-facing` | no |  |
| `/canon-campaign` | page | `pages/canon-campaign/index.tsx` | `Buyer-facing` | no |  |
| `/canon/[slug]` | page | `pages/canon/[slug].tsx` | `Buyer-facing` | no |  |
| `/canon/glossary` | page | `pages/canon/glossary.tsx` | `Buyer-facing` | no |  |
| `/canons-sitemap.xml` | page | `pages/canons-sitemap.xml.ts` | `Buyer-facing` | no |  |
| `/chatham-rooms` | page | `pages/chatham-rooms/index.tsx` | `Buyer-facing` | no |  |
| `/client/dashboard` | page | `pages/client/dashboard.tsx` | `Dead/unsafe` | no |  |
| `/constitution/command-centre` | page | `pages/constitution/command-centre.tsx` | `Buyer-facing` | no |  |
| `/consulting` | page | `pages/consulting/index.tsx` | `Paid-product-facing` | no |  |
| `/consulting/interventions` | page | `pages/consulting/interventions.tsx` | `Buyer-facing` | no |  |
| `/consulting/strategy-room` | page | `pages/consulting/strategy-room.tsx` | `Legacy redirect` | no |  |
| `/contact` | page | `pages/contact.tsx` | `Buyer-facing` | no |  |
| `/contact/success` | page | `pages/contact/success.tsx` | `Buyer-facing` | no |  |
| `/content` | page | `pages/content/index.tsx` | `Buyer-facing` | no |  |
| `/content/[...slug]` | page | `pages/content/[...slug].tsx` | `Buyer-facing` | no |  |
| `/content/simple` | page | `pages/content/simple.tsx` | `Buyer-facing` | no |  |
| `/controls` | page | `pages/controls.tsx` | `Buyer-facing` | no |  |
| `/cookie-policy` | page | `pages/cookie-policy.tsx` | `Buyer-facing` | no |  |
| `/cookies` | page | `pages/cookies.tsx` | `Buyer-facing` | no |  |
| `/dashboard` | page | `pages/dashboard.tsx` | `Legacy redirect` | yes |  |
| `/dashboard/diagnostics` | page | `pages/dashboard/diagnostics.tsx` | `Dead/unsafe` | no |  |
| `/dashboard/live` | page | `app/dashboard/live/page.tsx` | `Dead/unsafe` | no |  |
| `/dashboard/pdf-analytics` | page | `app/dashboard/pdf-analytics/page.tsx` | `Dead/unsafe` | no |  |
| `/dashboard/purpose-alignment` | page | `app/dashboard/purpose-alignment/page.tsx` | `Dead/unsafe` | no |  |
| `/debug/content` | page | `pages/debug/content.tsx` | `Dead/unsafe` | no |  |
| `/decision-instruments` | page | `pages/decision-instruments/index.tsx` | `Buyer-facing` | no |  |
| `/decision-instruments/[slug]` | page | `pages/decision-instruments/[slug].tsx` | `Buyer-facing` | no |  |
| `/decision-instruments/decision-exposure-instrument/run` | page | `pages/decision-instruments/decision-exposure-instrument/run.tsx` | `Buyer-facing` | no |  |
| `/decision-instruments/decision-exposure-instrument/start` | page | `pages/decision-instruments/decision-exposure-instrument/start.tsx` | `Buyer-facing` | no |  |
| `/decision-instruments/intervention-path-selector/run` | page | `pages/decision-instruments/intervention-path-selector/run.tsx` | `Buyer-facing` | no |  |
| `/decision-instruments/intervention-path-selector/start` | page | `pages/decision-instruments/intervention-path-selector/start.tsx` | `Buyer-facing` | no |  |
| `/decision-instruments/mandate-clarity-framework/run` | page | `pages/decision-instruments/mandate-clarity-framework/run.tsx` | `Buyer-facing` | no |  |
| `/decision-instruments/mandate-clarity-framework/start` | page | `pages/decision-instruments/mandate-clarity-framework/start.tsx` | `Buyer-facing` | no |  |
| `/decision-instruments/operator-decision-pack/run` | page | `pages/decision-instruments/operator-decision-pack/run.tsx` | `Buyer-facing` | no |  |
| `/decision-instruments/operator-decision-pack/start` | page | `pages/decision-instruments/operator-decision-pack/start.tsx` | `Buyer-facing` | no |  |
| `/decision-paths` | page | `pages/decision-paths/index.tsx` | `Buyer-facing` | no |  |
| `/dev/dashboard` | page | `pages/dev/dashboard.tsx` | `Dead/unsafe` | no |  |
| `/diagnostic` | page | `pages/diagnostic.tsx` | `Buyer-facing` | no |  |
| `/diagnostics` | page | `pages/diagnostics/index.tsx` | `Diagnostic-facing` | no |  |
| `/diagnostics/constitutional-diagnostic` | page | `pages/diagnostics/constitutional-diagnostic.tsx` | `Diagnostic-facing` | no |  |
| `/diagnostics/directional-integrity` | page | `pages/diagnostics/directional-integrity.tsx` | `Dead/unsafe` | no |  |
| `/diagnostics/enterprise` | page | `pages/diagnostics/enterprise.tsx` | `Legacy redirect` | no |  |
| `/diagnostics/enterprise-assessment` | page | `pages/diagnostics/enterprise-assessment.tsx` | `Diagnostic-facing` | no |  |
| `/diagnostics/executive-reporting` | page | `pages/diagnostics/executive-reporting.tsx` | `Legacy redirect` | no |  |
| `/diagnostics/executive-reporting/run` | page | `pages/diagnostics/executive-reporting/run.tsx` | `Legacy redirect` | no |  |
| `/diagnostics/fast` | page | `pages/diagnostics/fast.tsx` | `Diagnostic-facing` | no |  |
| `/diagnostics/purpose-alignment` | page | `pages/diagnostics/purpose-alignment.tsx` | `Diagnostic-facing` | no |  |
| `/diagnostics/team-alignment` | page | `pages/diagnostics/team-alignment.tsx` | `Legacy redirect` | no |  |
| `/diagnostics/team-assessment` | page | `pages/diagnostics/team-assessment.tsx` | `Diagnostic-facing` | no |  |
| `/diagnostics/watch` | page | `pages/diagnostics/watch.tsx` | `Diagnostic-facing` | no |  |
| `/directorate/dossier/[id]` | page | `pages/directorate/dossier/[id].tsx` | `Dead/unsafe` | yes |  |
| `/directorate/oversight` | page | `pages/directorate/oversight.tsx` | `Legacy redirect` | yes |  |
| `/downloads` | page | `pages/downloads/index.tsx` | `Buyer-facing` | no |  |
| `/downloads-sitemap.xml` | page | `pages/downloads-sitemap.xml.ts` | `Buyer-facing` | no |  |
| `/downloads/[...slug]` | page | `pages/downloads/[...slug].tsx` | `Buyer-facing` | no |  |
| `/downloads/vault` | page | `app/downloads/vault/page.tsx` | `Buyer-facing` | no |  |
| `/editorials` | page | `pages/editorials/index.tsx` | `Buyer-facing` | no |  |
| `/editorials/[slug]` | page | `pages/editorials/[slug].tsx` | `Buyer-facing` | no |  |
| `/editorials/catalogue` | page | `pages/editorials/catalogue.tsx` | `Buyer-facing` | no |  |
| `/editorials/discovery` | page | `pages/editorials/discovery.tsx` | `Buyer-facing` | no |  |
| `/education-research` | page | `pages/education-research/index.tsx` | `Buyer-facing` | no |  |
| `/enterprise/alignment/campaigns/[campaignId]` | page | `app/enterprise/alignment/campaigns/[campaignId]/page.tsx` | `Buyer-facing` | no |  |
| `/events` | page | `pages/events/index.tsx` | `Buyer-facing` | no |  |
| `/events-sitemap.xml` | page | `pages/events-sitemap.xml.ts` | `Buyer-facing` | no |  |
| `/events/[slug]` | page | `pages/events/[slug].tsx` | `Buyer-facing` | no |  |
| `/events/success` | page | `pages/events/success.tsx` | `Buyer-facing` | no |  |
| `/evidence` | page | `pages/evidence/index.tsx` | `Buyer-facing` | no |  |
| `/evidence/[slug]` | page | `pages/evidence/[slug].tsx` | `Buyer-facing` | no |  |
| `/fatherhood` | page | `pages/fatherhood/index.tsx` | `Buyer-facing` | no |  |
| `/foundations` | page | `pages/foundations.tsx` | `Buyer-facing` | no |  |
| `/founders` | page | `pages/founders/index.tsx` | `Buyer-facing` | no |  |
| `/inner-circle` | page | `pages/inner-circle/index.tsx` | `Legacy redirect` | yes |  |
| `/inner-circle-portal` | page | `pages/inner-circle-portal.tsx` | `Buyer-facing` | no |  |
| `/inner-circle-sitemap.xml` | page | `pages/inner-circle-sitemap.xml.ts` | `Buyer-facing` | no |  |
| `/inner-circle/account` | page | `pages/inner-circle/account.tsx` | `Legacy redirect` | no |  |
| `/inner-circle/admin` | page | `pages/inner-circle/admin.tsx` | `Admin-only` | yes |  |
| `/inner-circle/admin/artifacts` | page | `pages/inner-circle/admin/artifacts.tsx` | `Legacy redirect` | yes |  |
| `/inner-circle/admin/dashboard` | page | `pages/inner-circle/admin/dashboard.tsx` | `Admin-only` | yes |  |
| `/inner-circle/admin/reports` | page | `pages/inner-circle/admin/reports/index.tsx` | `Legacy redirect` | yes |  |
| `/inner-circle/admin/reports/[id]` | page | `pages/inner-circle/admin/reports/[id].tsx` | `Legacy redirect` | yes |  |
| `/inner-circle/briefs` | page | `pages/inner-circle/briefs/index.tsx` | `Legacy redirect` | no |  |
| `/inner-circle/briefs/[...slug]` | page | `pages/inner-circle/briefs/[...slug].tsx` | `Legacy redirect` | no |  |
| `/inner-circle/dashboard` | page | `pages/inner-circle/dashboard.tsx` | `Legacy redirect` | no |  |
| `/inner-circle/insufficient-clearance` | page | `pages/inner-circle/insufficient-clearance.tsx` | `Buyer-facing` | no |  |
| `/inner-circle/locked` | page | `pages/inner-circle/locked.tsx` | `Buyer-facing` | no |  |
| `/inner-circle/login` | page | `pages/inner-circle/login.tsx` | `Buyer-facing` | no |  |
| `/inner-circle/reports` | page | `pages/inner-circle/reports/index.tsx` | `Legacy redirect` | no |  |
| `/inner-circle/reports/[ref]` | page | `pages/inner-circle/reports/[ref].tsx` | `Legacy redirect` | no |  |
| `/inner-circle/resend` | page | `pages/inner-circle/resend.tsx` | `Buyer-facing` | no |  |
| `/inner-circle/unlock` | page | `pages/inner-circle/unlock.tsx` | `Legacy redirect` | no |  |
| `/institutional` | page | `pages/institutional/index.tsx` | `Buyer-facing` | no |  |
| `/intelligence/global-market-intelligence-q1-2026` | page | `pages/intelligence/global-market-intelligence-q1-2026.tsx` | `Buyer-facing` | no |  |
| `/leadership` | page | `pages/leadership/index.tsx` | `Buyer-facing` | no |  |
| `/lexicon` | page | `pages/lexicon/index.tsx` | `Buyer-facing` | no |  |
| `/lexicon/[slug]` | page | `pages/lexicon/[slug].tsx` | `Buyer-facing` | no |  |
| `/library` | page | `pages/library/index.tsx` | `Buyer-facing` | no |  |
| `/library/[slug]` | page | `pages/library/[slug].tsx` | `Buyer-facing` | no |  |
| `/media` | page | `pages/media/index.tsx` | `Buyer-facing` | no |  |
| `/membership/success` | page | `pages/membership/success.tsx` | `Legacy redirect` | yes |  |
| `/method` | page | `pages/method.tsx` | `Buyer-facing` | no |  |
| `/my-access` | page | `pages/my-access.tsx` | `Buyer-facing` | no |  |
| `/my-instruments` | page | `pages/my-instruments/index.tsx` | `Buyer-facing` | no |  |
| `/newsletter` | page | `pages/newsletter.tsx` | `Buyer-facing` | no |  |
| `/offline` | page | `pages/offline.tsx` | `Buyer-facing` | no |  |
| `/outcome/check` | page | `pages/outcome/check.tsx` | `Buyer-facing` | no |  |
| `/pdf-dashboard` | page | `app/pdf-dashboard/page.tsx` | `Buyer-facing` | no |  |
| `/playbooks` | page | `pages/playbooks/index.tsx` | `Buyer-facing` | no |  |
| `/playbooks/[slug]` | page | `pages/playbooks/[slug].tsx` | `Buyer-facing` | no |  |
| `/portfolio` | page | `app/(dashboard)/portfolio/page.tsx` | `Admin-only` | yes | Protected by app/(dashboard)/layout.tsx. ; Route path can be mistaken for a public surface because the admin intent is hidden behind a route group. |
| `/premium/library` | page | `pages/premium/library.tsx` | `Legacy redirect` | no |  |
| `/pricing` | page | `app/(dashboard)/pricing/page.tsx` | `Admin-only` | yes | Protected by app/(dashboard)/layout.tsx. ; Route path can be mistaken for a public surface because the admin intent is hidden behind a route group. ; Specific concern resolved by protection, but canonical public pricing must remain separate. |
| `/prints` | page | `pages/prints/index.tsx` | `Buyer-facing` | no |  |
| `/prints/[slug]` | page | `pages/prints/[slug].tsx` | `Buyer-facing` | no |  |
| `/privacy` | page | `pages/privacy.tsx` | `Buyer-facing` | no |  |
| `/private-clients` | page | `pages/private-clients/index.tsx` | `Paid-product-facing` | no |  |
| `/private/admin/premium-downloads` | page | `pages/private/admin/premium-downloads.tsx` | `Buyer-facing` | no |  |
| `/private/frameworks/[slug]` | page | `pages/private/frameworks/[slug].tsx` | `Legacy redirect` | no |  |
| `/purpose-alignment` | page | `app/purpose-alignment/page.tsx` | `Diagnostic-facing` | no |  |
| `/refund-policy` | page | `pages/refund-policy.tsx` | `Buyer-facing` | no |  |
| `/registry` | page | `pages/registry/index.tsx` | `Buyer-facing` | no |  |
| `/registry/[...slug]` | page | `app/registry/[...slug]/page.tsx` | `Buyer-facing` | no |  |
| `/registry/[type]/[slug]` | page | `pages/registry/[type]/[slug].tsx` | `Buyer-facing` | no |  |
| `/render/pdf/[id]` | page | `app/render/pdf/[id]/page.tsx` | `Buyer-facing` | no |  |
| `/resources` | page | `pages/resources/index.tsx` | `Buyer-facing` | no |  |
| `/resources-sitemap.xml` | page | `pages/resources-sitemap.xml.ts` | `Buyer-facing` | no |  |
| `/resources/[...slug]` | page | `pages/resources/[...slug].tsx` | `Buyer-facing` | no |  |
| `/resources/board-decision-log-template` | page | `pages/resources/board-decision-log-template.tsx` | `Legacy redirect` | no |  |
| `/resources/strategic-frameworks` | page | `pages/resources/strategic-frameworks/index.tsx` | `Buyer-facing` | no |  |
| `/resources/strategic-frameworks/[slug]` | page | `pages/resources/strategic-frameworks/[slug].tsx` | `Buyer-facing` | no |  |
| `/resources/surrender-framework` | page | `pages/resources/surrender-framework/index.tsx` | `Buyer-facing` | no |  |
| `/resources/surrender-framework/[slug]` | page | `pages/resources/surrender-framework/[slug].tsx` | `Buyer-facing` | no |  |
| `/restricted` | page | `app/restricted/page.tsx` | `Buyer-facing` | no |  |
| `/retainer` | page | `pages/retainer.tsx` | `Legacy redirect` | no |  |
| `/security` | page | `pages/security.tsx` | `Buyer-facing` | no |  |
| `/security-policy` | page | `pages/security-policy.tsx` | `Buyer-facing` | no |  |
| `/settings/integrations` | page | `app/settings/integrations/page.tsx` | `Buyer-facing` | no |  |
| `/shorts` | page | `pages/shorts/index.tsx` | `Buyer-facing` | no |  |
| `/shorts-sitemap.xml` | page | `pages/shorts-sitemap.xml.ts` | `Buyer-facing` | no |  |
| `/shorts/[...slug]` | page | `pages/shorts/[...slug].tsx` | `Buyer-facing` | no |  |
| `/shorts/index.migrated` | page | `pages/shorts/index.migrated.tsx` | `Buyer-facing` | no |  |
| `/sovereign/authorize` | page | `pages/sovereign/authorize.tsx` | `Buyer-facing` | no |  |
| `/speaking` | page | `pages/speaking/index.tsx` | `Buyer-facing` | no |  |
| `/strategies-sitemap.xml` | page | `pages/strategies-sitemap.xml.ts` | `Buyer-facing` | no |  |
| `/strategy` | page | `pages/strategy/index.tsx` | `Buyer-facing` | no |  |
| `/strategy-room` | page | `pages/strategy-room/index.tsx` | `Paid-product-facing` | no |  |
| `/strategy-room/results` | page | `app/strategy-room/results/route.ts` | `Buyer-facing` | no |  |
| `/strategy-room/session/[id]` | page | `pages/strategy-room/session/[id].tsx` | `Buyer-facing` | no |  |
| `/strategy-room/success` | page | `app/strategy-room/success/page.tsx` | `Buyer-facing` | no |  |
| `/strategy/[...slug]` | page | `pages/strategy/[...slug].tsx` | `Buyer-facing` | no |  |
| `/subscribe` | page | `pages/subscribe.tsx` | `Buyer-facing` | no |  |
| `/terms` | page | `pages/terms.tsx` | `Buyer-facing` | no |  |
| `/terms-of-service` | page | `pages/terms-of-service.tsx` | `Buyer-facing` | no |  |
| `/test-readers` | page | `pages/test-readers.tsx` | `Buyer-facing` | no |  |
| `/testing/lab` | page | `app/testing/lab/page.tsx` | `Dead/unsafe` | no |  |
| `/toolkits` | page | `pages/toolkits/index.tsx` | `Buyer-facing` | no |  |
| `/toolkits/[slug]` | page | `pages/toolkits/[slug].tsx` | `Buyer-facing` | no |  |
| `/trust` | page | `pages/trust.tsx` | `Buyer-facing` | no |  |
| `/vault` | page | `pages/vault/index.tsx` | `Buyer-facing` | no |  |
| `/vault-sitemap.xml` | page | `pages/vault-sitemap.xml.ts` | `Buyer-facing` | no |  |
| `/vault/[...slug]` | page | `pages/vault/[...slug].tsx` | `Buyer-facing` | no |  |
| `/vault/briefs` | page | `pages/vault/briefs/index.tsx` | `Buyer-facing` | no |  |
| `/vault/briefs/[slug]` | page | `pages/vault/briefs/[slug].tsx` | `Buyer-facing` | no |  |
| `/ventures` | page | `pages/ventures/index.tsx` | `Buyer-facing` | no |  |
| `/ventures/[slug]` | page | `pages/ventures/[slug].tsx` | `Buyer-facing` | no |  |
| `/verification` | page | `pages/verification.tsx` | `Buyer-facing` | no |  |
| `/why-not-ai` | page | `pages/why-not-ai.tsx` | `Buyer-facing` | no |  |
| `/works-in-progress` | page | `pages/works-in-progress.tsx` | `Buyer-facing` | no |  |

## Priority Risks

- `/api/admin/sync-fix` → `Dead/unsafe` from `pages/api/admin/sync-fix.ts`
- `/board/c` → `Dead/unsafe` from `pages/board/c.tsx`
- `/board/intelligence` → `Dead/unsafe` from `pages/board/intelligence.tsx`
- `/client/dashboard` → `Dead/unsafe` from `pages/client/dashboard.tsx`
- `/dashboard/diagnostics` → `Dead/unsafe` from `pages/dashboard/diagnostics.tsx`
- `/dashboard/live` → `Dead/unsafe` from `app/dashboard/live/page.tsx`
- `/dashboard/pdf-analytics` → `Dead/unsafe` from `app/dashboard/pdf-analytics/page.tsx`
- `/dashboard/purpose-alignment` → `Dead/unsafe` from `app/dashboard/purpose-alignment/page.tsx`
- `/debug/content` → `Dead/unsafe` from `pages/debug/content.tsx`
- `/dev/dashboard` → `Dead/unsafe` from `pages/dev/dashboard.tsx`
- `/diagnostics/directional-integrity` → `Dead/unsafe` from `pages/diagnostics/directional-integrity.tsx`
- `/directorate/dossier/[id]` → `Dead/unsafe` from `pages/directorate/dossier/[id].tsx`
- `/pricing` → `Admin-only` from `app/(dashboard)/pricing/page.tsx` (Protected by app/(dashboard)/layout.tsx.; Route path can be mistaken for a public surface because the admin intent is hidden behind a route group.; Specific concern resolved by protection, but canonical public pricing must remain separate.)
- `/testing/lab` → `Dead/unsafe` from `app/testing/lab/page.tsx`