# ZTHVF Phase 1 -- Complete Route Inventory

**Generated:** 2026-05-07
**Project:** Abraham of London (aol-check-visual)
**Framework:** Next.js (App Router + Pages Router, hybrid)

---

## 1. App Router API Routes (`app/api/**`)

### 1.1 Admin Routes (all require `requireAdminAppRoute()` unless noted)

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/admin/campaigns` | GET | admin | no | List campaigns |
| `/api/admin/campaigns/[id]` | GET | admin | no | Single campaign |
| `/api/admin/campaigns/[id]/report` | GET | admin | no | Campaign report |
| `/api/admin/campaigns/[id]/report/export-json` | GET | admin | no | JSON export |
| `/api/admin/campaigns/[id]/report/pdf` | GET | admin | no | PDF export |
| `/api/admin/campaigns/[id]/report-data` | GET | admin | no | Report data |
| `/api/admin/commercial` | GET | admin | no | Commercial dashboard |
| `/api/admin/decision-intelligence` | GET | **none** | **yes** | **WARNING: No auth guard found** |
| `/api/admin/decision/contextual-efficacy` | GET | admin | no | |
| `/api/admin/decision/contextual-ranking` | GET | admin | no | |
| `/api/admin/decision/efficacy` | GET | admin | no | |
| `/api/admin/decision/governance` | GET | admin | no | |
| `/api/admin/decision/performance` | GET | admin | no | |
| `/api/admin/decision/rebuild-contextual-efficacy` | POST | admin | no | |
| `/api/admin/decision/rebuild-efficacy` | POST | admin | no | |
| `/api/admin/decision/rebuild-governance-alerts` | POST | admin | no | |
| `/api/admin/decision/rebuild-performance` | POST | admin | no | |
| `/api/admin/decision/signal-registry` | GET | admin | no | |
| `/api/admin/dev-login` | POST | **none** | **yes** | Dev-only login; rate-limited. **Verify disabled in production** |
| `/api/admin/enterprise-foundation` | GET | admin | no | |
| `/api/admin/positioning` | GET | **none** | **yes** | **WARNING: No auth guard found** |

### 1.2 Alignment / Enterprise Routes

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/alignment/enterprise` | POST | none | yes | Create campaign (enterprise) |
| `/api/alignment/enterprise/assessments` | GET | token | no | Token-verified via query param |
| `/api/alignment/enterprise/campaigns` | POST | none | yes | Create campaign |
| `/api/alignment/enterprise/campaigns/[id]` | GET | none | yes | Public campaign view |
| `/api/alignment/enterprise/campaigns/[id]/aggregate` | POST | none | yes | Aggregate computation |
| `/api/alignment/enterprise/campaigns/[id]/close` | POST | none | yes | Close campaign |
| `/api/alignment/enterprise/campaigns/[id]/invite` | POST | none | yes | Send invites |
| `/api/alignment/enterprise/campaigns/[id]/notify` | POST | none | yes | Notification dispatch |
| `/api/alignment/enterprise/campaigns/[id]/nudge` | POST | none | yes | Reminder nudge |
| `/api/alignment/enterprise/campaigns/[id]/report` | GET | none | yes | Campaign report |
| `/api/alignment/enterprise/organisations` | POST | none | yes | Create org |
| `/api/alignment/enterprise/respond/[token]` | GET, POST | token | no | Token-verified invite response |

### 1.3 Analytics / Telemetry

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/analytics/executive-report` | GET | session | no | getServerSession + authOptions |
| `/api/analytics/journey` | POST | none | yes | Journey event capture |

### 1.4 Assessment Routes

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/assessments/enterprise/run` | POST | none | yes | Run enterprise assessment |
| `/api/assessments/team/run` | POST | none | yes | Run team assessment |

### 1.5 Audit Routes

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/audit/log` | POST | session | no | getServerSession; auditor role check |
| `/api/audit/submit` | POST | none | yes | Submit audit responses |
| `/api/audit/[id]/submit` | POST | none | yes | Submit audit by ID |

### 1.6 Auth Routes

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/auth/sovereign` | POST | none | yes | Sovereign key login; key-hash verified |
| `/api/sovereign/auth` | POST | none | yes | Re-export of auth/sovereign |
| `/api/sovereign/history` | GET | none | yes | Public history |
| `/api/sovereign/logout` | POST | none | yes | Clears sovereign cookie |
| `/api/sovereign/report` | POST | session | no | hasValidOgrSession() gate |

### 1.7 Boardroom / Executive

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/boardroom/dossier` | GET | session | no | getServerSession required |
| `/api/boardroom/dossier/pdf` | GET | session | no | getServerSession required |
| `/api/executive/snapshot` | GET | admin | no | requireAdminAppRoute |
| `/api/executive-reporting/entitlements` | POST | none | yes | Email-based entitlement lookup |
| `/api/executive-reporting/export/boardroom-pdf` | POST | none | yes | Email-based entitlement check |
| `/api/executive-reporting/export/intervention` | POST | none | yes | Email-based entitlement check |
| `/api/executive-reporting/export/pdf` | POST | none | yes | Proxy to Netlify function |
| `/api/executive-reporting/run` | POST | none | yes | Email-based entitlement check |

### 1.8 Calibration / Cron

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/calibration/ingest` | POST | none | yes | Session-key referenced |
| `/api/cron/calibration` | POST | none | yes | **WARNING: No CRON_SECRET check found** |
| `/api/cron/decision-state` | POST | cron | no | CRON_SECRET Bearer token |
| `/api/cron/escalation` | GET | cron | no | CRON_SECRET Bearer or x-cron-secret |
| `/api/cron/snapshot` | GET | cron | no | CRON_SECRET Bearer token |

### 1.9 Campaign Reports (non-admin)

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/campaigns/[id]/invite` | POST | none | yes | Send invites |
| `/api/campaigns/[id]/nudge` | POST | none | yes | Nudge dispatch |
| `/api/campaigns/[id]/report` | GET | none | yes | Campaign report |
| `/api/campaigns/[id]/report/json` | GET | none | yes | JSON export |
| `/api/campaigns/[id]/report/pdf` | GET | none | yes | PDF export |

### 1.10 Checkout / Commercial

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/checkout` | POST | none | yes | Stripe checkout session creation |
| `/api/contracts/verify` | POST | none | yes | Contract verification |
| `/api/entitlements` | GET | none | yes | Public entitlement lookup |

### 1.11 Constitutional

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/constitutional/appeal` | POST | none | yes | X-User-Id header (client-set) |
| `/api/constitutional/audit` | GET | none | yes | X-User-Id header (client-set) |
| `/api/constitutional/export` | GET | none | yes | X-User-Id header (client-set) |

### 1.12 Decision Engine

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/decision/credit-score` | GET | session | no | getServerSession required |
| `/api/decision/guidance` | POST | none | yes | Public diagnostic |
| `/api/decision/metadata-audit` | GET | none | yes | Content metadata inspection |

### 1.13 Diagnostics

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/diagnostics/campaigns/[id]/aggregate` | GET, POST | none | yes | Public aggregate |
| `/api/diagnostics/evidence` | POST | none | yes | Signed-action-token verified internally |
| `/api/diagnostics/longitudinal` | GET | none | yes | Email-based lookup |
| `/api/diagnostics/multi-stakeholder` | GET | none | yes | Campaign-based lookup |
| `/api/diagnostics/outcome` | GET | none | yes | Email/session lookup |
| `/api/diagnostics/outcomes/verify` | POST | none | yes | |
| `/api/diagnostics/reentry` | POST | none | yes | |

### 1.14 Downloads / Entitlements

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/download/[token]` | GET | token | no | verifyDownloadToken + session binding |
| `/api/downloads/[slug]` | GET | none | yes | Identity resolution + entitlement check |

### 1.15 Editorials / Content

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/editorials/[slug]` | GET | none | yes | Public catalogue lookup |

### 1.16 Enterprise Foundation (admin-gated)

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/enterprise-foundation/dependencies` | GET, POST | admin | no | requireAdminAppRoute |
| `/api/enterprise-foundation/playbooks` | GET, POST | admin | no | requireAdminAppRoute |
| `/api/enterprise-foundation/stakeholders` | GET, POST | admin | no | requireAdminAppRoute |
| `/api/admin/enterprise-foundation` | GET | admin | no | requireAdminAppRoute |

### 1.17 Evidence

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/evidence/case-draft` | POST | session | no | getServerSession required |
| `/api/evidence/eligibility` | GET | session | no | getServerSession required |

### 1.18 Inner Circle

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/inner-circle/admin/export` | GET | session | no | admin_session cookie (weak -- TODO noted in code) |
| `/api/inner-circle/issue` | POST | none | yes | Rate-limited key issuance |
| `/api/inner-circle/verify` | POST | none | yes | Rate-limited verification |

### 1.19 Interactions / Interpret

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/interactions/toggle` | POST | session | no | getServerSession (optional email) |
| `/api/interpret` | POST | none | yes | LLM interpretation endpoint |

### 1.20 Leads / Live

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/leads/fuse` | POST | none | yes | Deal scoring -- size limited |
| `/api/live/constitutional-posture` | GET | none | yes | Public telemetry |

### 1.21 Predictive / Premium

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/predictive/insights/[campaignId]` | GET | session | no | getServerSession + authOptions |
| `/api/premium/forensics/attribution` | POST | none | yes | Forensic watermark analysis |

### 1.22 Pulse / Purpose-Alignment

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/pulse/submit` | POST | none | yes | Public pulse submission |
| `/api/purpose-alignment/assessments` | POST | none | yes | Session-key based |
| `/api/purpose-alignment/capture` | POST | none | yes | Session-key based |
| `/api/purpose-alignment/reminders/preferences` | POST | none | yes | Session-key based |
| `/api/purpose-alignment/reminders/preferences/run` | POST | none | yes | |
| `/api/purpose-alignment/report` | GET | none | yes | Public report |
| `/api/purpose-alignment/report/[assessmentId]` | GET | none | yes | Public report by ID |

### 1.23 Retainers (admin-gated)

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/retainers/contracts` | GET, POST | admin | no | requireAdminAppRoute |
| `/api/retainers/decisions` | POST | admin | no | requireAdminAppRoute |
| `/api/retainers/enforcement-cycles` | POST | admin | no | requireAdminAppRoute |
| `/api/retainers/surface` | GET | session | no | getServerSession + getUserAccess |

### 1.24 Search

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/search` | POST | session | no | getServerSession; tier-escalated results |

### 1.25 Stats / Root / Health

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/root` | GET | none | yes | Returns `{ ok: true }` |
| `/api/stats` | GET | none | yes | Public registry stats |
| `/api/v2/health` | GET | none | yes | Public health check |
| `/api/v2/users` | GET, POST, PUT, DELETE | none | yes | Proxy to v1 users endpoint |

### 1.26 Strategy Room

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/strategy-room/briefing/return/[sessionId]` | GET | token | no | Session-ref access check |
| `/api/strategy-room/briefing/scan` | POST | cron | no | CRON_SECRET Bearer token |
| `/api/strategy-room/conversion` | POST | none | yes | Session-key based |
| `/api/strategy-room/execution` | POST | none | yes | |
| `/api/strategy-room/execution/[id]` | GET, PATCH | token | no | Session-ref access check |
| `/api/strategy-room/execution/[id]/decisions` | POST, PATCH | none | yes | |
| `/api/strategy-room/execution/[id]/state` | GET | token | no | Session-ref access check |
| `/api/strategy-room/results` | GET | token | no | Session-ref access check |
| `/api/strategy-room/session/click` | POST | none | yes | Session-key based |
| `/api/strategy-room/session/conversion` | POST | none | yes | Session-ref access check |
| `/api/strategy-room/session/followup` | POST | none | yes | |
| `/api/strategy-room/session/impression` | POST | none | yes | Session-ref access check |
| `/api/strategy-room/session/init` | POST | none | yes | Creates new session |

### 1.27 Team Assessment

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/team-assessment/campaign/create` | POST | none | yes | |
| `/api/team-assessment/campaign/[id]/aggregate` | GET, POST | none | yes | |
| `/api/team-assessment/campaign/[id]/close` | POST | none | yes | |
| `/api/team-assessment/campaign/[id]/invites` | GET, POST | none | yes | |
| `/api/team-assessment/campaign/[id]/status` | GET | none | yes | |
| `/api/team-assessment/respond/[token]` | GET, POST | token | no | Token-verified respondent |
| `/api/team/respondents/[token]` | GET, POST | token | no | Token-verified via enterprise invite |

### 1.28 Telemetry

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/telemetry/global` | GET | none | yes | Public telemetry |
| `/api/telemetry/resonance` | GET | none | yes | Public telemetry |

### 1.29 User Privacy

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/user/delete` | POST, GET | token | no | Signed-action-token (privacy_delete) |
| `/api/user/unsubscribe` | POST, GET | token | no | Signed-action-token |

### 1.30 Vault

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/vault/status` | GET | none | yes | Public vault stats |
| `/api/vault/[...slug]` | GET | session | no | Cookie-forwarded to inner API |

---

## 2. Pages Router API Routes (`pages/api/**`)

### 2.1 Access / Auth

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/access/accept-invite` | GET, POST | none | yes | Token-based invite acceptance |
| `/api/access/check` | GET | none | yes | Returns access state |
| `/api/access/clear` | POST | none | yes | Alias for logout |
| `/api/access/download` | GET | session | no | Resolved session access |
| `/api/access/enter` | POST | none | yes | Stub -- directs to /access/redeem |
| `/api/access/logout` | POST, GET | session | no | getServerSession; clears cookies |
| `/api/access/me` | GET | none | yes | Returns resolved access |
| `/api/access/redeem` | POST | session | no | Resolved session + key redemption |
| `/api/access/revoke` | POST | none | yes | Stub |
| `/api/access/serve` | GET | token | no | Signed download token verification |
| `/api/access/verify` | GET, POST | session | no | Active session check |
| `/api/auth/[...nextauth]` | * | none | yes | NextAuth handler |
| `/api/auth/identity` | GET | none | yes | Returns merged identity |
| `/api/auth/me` | GET | none | yes | Returns resolved access |
| `/api/auth/mint` | POST | none | yes | Stub -- redirects to NextAuth |
| `/api/auth/session` | GET | none | yes | Returns session or {} |
| `/api/auth/sovereign-login` | POST | none | yes | Sovereign key login |

### 2.2 Admin Routes (Pages Router)

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/admin-client` | * | none | yes | Admin fetch helper (not a real handler) |
| `/api/admin/access-keys/[id]/revoke` | POST | admin | no | requireAdmin |
| `/api/admin/access-keys/[id]/uses` | GET | admin | no | requireAdmin |
| `/api/admin/access-keys/create` | POST | admin | no | requireAdmin |
| `/api/admin/access-keys/index` | GET | admin | no | requireAdmin |
| `/api/admin/audit-logs` | GET | admin | no | requireAdminServer |
| `/api/admin/audit/logs` | GET | admin | no | Re-export of audit-logs |
| `/api/admin/auth/send-link` | POST | none | yes | Magic-link send (rate-limited) |
| `/api/admin/auth/verify` | GET | token | no | JWT magic-link verification |
| `/api/admin/deal-flow-stats` | GET | admin | no | requireAdmin |
| `/api/admin/diagnostics/artifacts` | GET | session | no | Access cookie + tier check |
| `/api/admin/diagnostics/grants/revoke` | POST | **none** | **yes** | **WARNING: No auth guard** |
| `/api/admin/diagnostics/jobs/process` | POST | admin | no | requireAdminServer |
| `/api/admin/diagnostics/records` | GET | session | no | Access cookie + tier check |
| `/api/admin/diagnostics/regenerate` | POST | **none** | **yes** | **WARNING: No auth guard** |
| `/api/admin/diagnostics/retention/run` | POST | **none** | **yes** | **WARNING: No auth guard (runs deletion)** |
| `/api/admin/diagnostics/revoke` | POST | **none** | **yes** | **WARNING: No auth guard** |
| `/api/admin/diagnostics/summary` | GET | session | no | Access cookie + tier check |
| `/api/admin/export-audit` | GET | admin | no | requireAdminServer |
| `/api/admin/export-vips` | GET | admin | no | requireAdminServer |
| `/api/admin/identity-audit` | GET | admin | no | requireAdmin |
| `/api/admin/inner-circle/export` | GET | token | no | x-inner-circle-admin-key header |
| `/api/admin/inner-circle/export/route` | POST | none | yes | Dev password check (cookie-based) |
| `/api/admin/inner-circle/issue` | POST | admin | no | requireAdmin |
| `/api/admin/inner-circle/revoke` | POST | token | no | Bearer admin-key |
| `/api/admin/institutional-analytics` | GET | admin | no | requireAdmin |
| `/api/admin/invites/[id]/revoke` | POST | admin | no | requireAdmin |
| `/api/admin/invites/create` | POST | admin | no | requireAdmin |
| `/api/admin/invites/index` | GET | admin | no | requireAdmin |
| `/api/admin/jobs/dead-letter/index` | GET, POST | admin | no | requireAdminServer |
| `/api/admin/jobs/dead-letter/replay` | POST | admin | no | requireAdminServer |
| `/api/admin/jobs/process` | POST | admin | no | requireAdminServer |
| `/api/admin/members/keys` | GET | admin | no | requireAdminServer |
| `/api/admin/members/list` | GET | admin | no | requireAdminServer |
| `/api/admin/members/revoke` | POST | admin | no | requireAdminServer |
| `/api/admin/members/upgrade` | POST | admin | no | requireAdminServer |
| `/api/admin/onboard-principal` | POST | admin | no | requireAdminServer |
| `/api/admin/pdf-analytics` | GET | admin | no | requireAdminServer |
| `/api/admin/pdf-status` | GET | admin | no | requireAdmin |
| `/api/admin/pricing` | * | **none** | **yes** | **NOTE: File is actually lib/pricing/event-pricing.ts content -- misplaced or module** |
| `/api/admin/proof/evidence/[id]` | PATCH | admin | no | requireAdmin |
| `/api/admin/proof/evidence/index` | GET, POST | admin | no | requireAdmin |
| `/api/admin/reports/[id]` | GET, PATCH | session | no | Access cookie + tier check |
| `/api/admin/reports/[id]/deliver` | POST | session | no | Access cookie + tier check |
| `/api/admin/reports/index` | GET | session | no | Access cookie + tier check |
| `/api/admin/security/appeal` | POST | admin | no | requireAdminServer |
| `/api/admin/security/deny` | POST | token | no | x-inner-circle-admin-key |
| `/api/admin/security/events` | GET | admin | no | requireAdminServer |
| `/api/admin/security/resolve-appeal` | POST | admin | no | requireAdminServer |
| `/api/admin/security/toggle-lock` | POST | token | no | x-inner-circle-admin-key |
| `/api/admin/status-report` | GET | admin | no | requireAdminServer |
| `/api/admin/sync-fix` | * | none | yes | Retired (410) |
| `/api/admin/system-health` | GET | token | no | Bearer ADMIN_API_KEY |
| `/api/admin/users/upgrade` | POST | admin | no | requireAdminServer |
| `/api/admin/validation` | GET, POST | admin | no | requireAdmin |

### 2.3 Analytics

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/analytics/downloads/summary` | GET | none | yes | Cached public stats |
| `/api/analytics/event` | POST | none | yes | Event tracking |

### 2.4 Content / Editorial

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/artifacts/global-market-intelligence-q1-2026-boardroom-pdf` | GET | none | yes | Static artifact |
| `/api/blog/[slug]` | GET | none | yes | Public blog content (tier-gated fields) |
| `/api/books/[slug]` | GET | session | no | verifySession |
| `/api/briefs/[slug]` | GET | session | no | getServerSession |
| `/api/canon/[slug]` | GET | session | no | verifySession |
| `/api/content/[...slug]` | GET | session | no | getServerSession; tier check |
| `/api/content/initialize` | GET | none | yes | Content initialization |
| `/api/dispatches/[slug]` | GET | session | no | getInnerCircleAccess |
| `/api/editorials/citation/[slug]` | GET | none | yes | Public citation |
| `/api/editorials/preview/[slug]` | GET | none | yes | Public preview |
| `/api/events/[slug]` | GET | session | no | verifySession |
| `/api/frameworks/surrender/[slug]` | GET | session | no | verifySession |
| `/api/frameworks/surrender/[slug]/protected` | GET | session | no | Session check |
| `/api/library/[slug]` | GET | session | no | verifySession |
| `/api/public/content` | GET | none | yes | Public content handler |
| `/api/resources/[...slug]` | GET | session | no | verifySession |
| `/api/resources/mdx` | GET | session | no | getSessionContext |
| `/api/resources/strategic-frameworks/[...slug]` | GET | session | no | verifySession |
| `/api/resources/strategic-frameworks/index` | GET | none | yes | |
| `/api/shorts/[slug]` | GET | session | no | getInnerCircleAccess |
| `/api/shorts/[slug]/interactions` | GET | none | yes | Rate-limited; session-id based |
| `/api/shorts/[slug]/like` | POST, DELETE | none | yes | Rate-limited; session-id based |
| `/api/shorts/[slug]/save` | POST, DELETE | none | yes | Rate-limited; session-id based |
| `/api/sitemaps/[category]` | GET | none | yes | Public sitemap |

### 2.5 Billing / Checkout

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/billing/checkout` | POST | none | yes | Stripe checkout creation |
| `/api/billing/webhook` | POST | webhook-sig | no | Stripe signature verification |
| `/api/events/checkout` | POST | session | no | getServerSession + Stripe |

### 2.6 Constitution

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/constitution/assess` | POST | none | yes | Public assessment |
| `/api/constitution/command-centre` | GET | none | yes | Public |
| `/api/constitution/interventions` | GET, PATCH | none | yes | Public |

### 2.7 Contact / Subscribe

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/contact` | POST | none | yes | reCAPTCHA verified; rate-limited |
| `/api/newsletter` | POST | none | yes | Rate-limited |
| `/api/subscribe` | POST | none | yes | Rate-limited; reCAPTCHA |
| `/api/teaser` | POST | none | yes | Rate-limited; reCAPTCHA |
| `/api/verify-newsletter` | GET | token | no | Token + email verification |

### 2.8 Contracts

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/contracts/create` | POST | none | yes | |
| `/api/contracts/[id]` | GET | none | yes | |
| `/api/contracts/[id]/checkpoint` | POST | none | yes | |
| `/api/contracts/[id]/verify` | POST | none | yes | |

### 2.9 Cron Routes (Pages Router)

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/cron/clean-keys` | POST | cron | no | CRON_SECRET Bearer |
| `/api/cron/cleanup-download-security` | POST | cron | no | CRON_SECRET Bearer or x-cron-secret |
| `/api/cron/cleanup-download-token` | POST | session | no | getServerSession; tier check |
| `/api/cron/security-sweep` | POST | cron | no | CRON_SECRET with timing-safe compare |

### 2.10 Dashboard

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/dashboard/my-reports` | GET | session | no | getServerSession |

### 2.11 Deal Flow

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/deal-flow/qualify` | POST | none | yes | Rate-limited |

### 2.12 Debug (Dev Only)

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/debug/contentlayer-exports` | GET | none | yes | **Dev-only (NODE_ENV guard)** |
| `/api/debug/contentlayer-registry` | GET | none | yes | |
| `/api/debug/ssot-health` | GET | none | yes | |

### 2.13 Decision Instruments

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/decision-instruments/results` | GET, POST | none | yes | |
| `/api/decision-instruments/send-purchase-email` | POST | none | yes | |

### 2.14 Diagnostics (Pages Router)

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/diagnostics/[ref]` | GET | session | no | Access cookie + token check |
| `/api/diagnostics/capture` | POST | none | yes | Rate-limited |
| `/api/diagnostics/challenge` | POST | none | yes | |
| `/api/diagnostics/constitutional-handoff/[stage]` | GET | token | no | Encrypted state token |
| `/api/diagnostics/constitutional-intake/report` | POST | none | yes | |
| `/api/diagnostics/create-report-checkout` | POST | none | yes | |
| `/api/diagnostics/directional-integrity` | POST | none | yes | |
| `/api/diagnostics/enterprise` | POST | none | yes | |
| `/api/diagnostics/executive-reporting` | POST | none | yes | |
| `/api/diagnostics/list` | GET | session | no | Access cookie + tier check |
| `/api/diagnostics/report` | POST | none | yes | Redirect to Netlify function |
| `/api/diagnostics/report/[id]` | GET | none | yes | Redirect to Netlify function |
| `/api/diagnostics/report/generate` | POST | session | no | Access cookie + tier check |
| `/api/diagnostics/report/history` | GET | session | no | Access cookie + token check |
| `/api/diagnostics/report/pdf` | GET | session | no | Access cookie + token check |
| `/api/diagnostics/report/signed-url` | GET | session | no | Access cookie + token check |
| `/api/diagnostics/report/unlock` | POST | session | no | Access cookie + tier check |
| `/api/diagnostics/reports/download` | GET | token | no | Signed download token |
| `/api/diagnostics/reports/issue` | POST | session | no | getServerSession |
| `/api/diagnostics/score` | POST | none | yes | Public diagnostic scoring |
| `/api/diagnostics/spine/load` | GET | none | yes | Email-based lookup |
| `/api/diagnostics/spine/persist` | POST | none | yes | |
| `/api/diagnostics/submit` | POST | none | yes | Rate-limited; session context |
| `/api/diagnostics/team-alignment` | POST | none | yes | |
| `/api/diagnostics/telemetry` | GET | **none** | **yes** | **WARNING: No auth; exposes DB counts** |

### 2.15 Downloads

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/dl/[token]` | GET | none | yes | Legacy -- returns 410 GONE |
| `/api/downloads/instrument-pdf` | GET | none | yes | Public instrument PDF |
| `/api/downloads/mdx` | GET | session | no | Tier-gated |
| `/api/downloads/resolve/[slug]` | GET | session | no | Inner circle access check |
| `/api/downloads/resolve/[slug]/[...rest]` | GET | session | no | Inner circle access check |

### 2.16 Follow-Up

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/follow-up/process` | POST | cron | no | CRON_SECRET Bearer |
| `/api/follow-up/register` | POST | none | yes | |

### 2.17 Generate PDFs

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/generate-all-pdfs` | GET | none | yes | Lists PDFs for generation |
| `/api/generate-pdf` | POST | none | yes | Rate-limited |
| `/api/generate-pdfs/batch` | POST | none | yes | |

### 2.18 Health / System

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/health` | GET | none | yes | Public health check |
| `/api/system/health` | GET | none | yes | Public system health |
| `/api/system/lock-status` | GET | none | yes | Public lock status |
| `/api/system/maintenance` | GET, POST | token | no | CRON_SECRET_KEY Bearer |
| `/api/middleware-health` | GET | none | yes | Middleware metrics |
| `/api/endpoint` | GET | none | yes | Rate-limited health endpoint |

### 2.19 Inner Circle (Pages)

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/inner-circle/generate-link` | POST | session | no | Access cookie + session context |
| `/api/inner-circle/lexicon` | GET, POST, PUT | admin | no | getServerSession + admin role check |
| `/api/inner-circle/register` | POST | none | yes | Rate-limited |
| `/api/inner-circle/resend` | POST | none | yes | reCAPTCHA + rate-limited |
| `/api/inner-circle/retrieve/[briefId]` | GET | session | no | getServerSession + INNER_CIRCLE role |
| `/api/inner-circle/self-revoke` | POST | session | no | Session context check |
| `/api/inner-circle/unlock` | POST | none | yes | Stub |

### 2.20 Integrations

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/integrations/disconnect` | POST | session | no | getAuthSession |
| `/api/integrations/google/callback` | GET | session | no | getAuthSession |
| `/api/integrations/google/connect` | GET | none | yes | Initiates OAuth |
| `/api/integrations/signals` | GET | session | no | getAuthSession + admin for cross-user |
| `/api/integrations/slack/callback` | GET | session | no | getAuthSession |
| `/api/integrations/slack/connect` | GET | none | yes | Initiates OAuth |
| `/api/integrations/status` | GET | session | no | getAuthSession |

### 2.21 Keys

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/keys/verify` | GET, POST | token | no | CRON_SECRET_KEY Bearer |

### 2.22 Members

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/members/strategies` | GET | session | no | createStrictApiHandler |

### 2.23 OGR

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/ogr/simulate` | POST | session | no | getServerSession |

### 2.24 PDFs

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/pdf-data` | POST | none | yes | |
| `/api/pdfs/[id]` | GET | session | no | getServerSession |
| `/api/pdfs/[id]/delete` | DELETE | session | no | getServerSession |
| `/api/pdfs/[id]/duplicate` | POST | none | yes | |
| `/api/pdfs/[id]/generate` | POST | none | yes | Stubbed |
| `/api/pdfs/[id]/metadata` | PATCH | session | no | getServerSession |
| `/api/pdfs/[id]/rename` | PATCH | session | no | getServerSession |
| `/api/pdfs/generate` | POST | session | no | getServerSession |
| `/api/pdfs/generate-all` | GET | none | yes | |
| `/api/pdfs/list` | GET | session | no | getServerSession |

### 2.25 Premium Admin

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/premium/admin/cleanup-expired-tokens` | POST | session | no | getServerSession |
| `/api/premium/admin/download-anomalies` | GET | session | no | getServerSession + tier check |
| `/api/premium/admin/download-ledger` | GET | session | no | getServerSession + tier check |
| `/api/premium/admin/revoke-by-content` | POST | session | no | getServerSession + tier check |
| `/api/premium/admin/revoke-by-user` | POST | session | no | getServerSession + tier check |
| `/api/premium/admin/revoke-token` | POST | session | no | getServerSession + tier check |
| `/api/premium/admin/verify-watermark` | POST | session | no | getServerSession + tier check |
| `/api/premium/content` | GET | none | yes | Cookie-based session |
| `/api/premium/content/download/[id]` | GET | token | no | Download token verification |
| `/api/premium/dashboard` | GET | session | no | withInnerCircleAccess (client tier) |

### 2.26 Private

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/private/frameworks/[slug]` | GET | session | no | getServerSession |
| `/api/private/vault/[...path]` | GET | session | no | getInnerCircleAccess |

### 2.27 Proof

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/proof/evidence` | POST | none | yes | |
| `/api/proof/public` | GET | none | yes | Public proof evidence |

### 2.28 Protected Content

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/protected-content` | GET | session | no | Session-based access |

### 2.29 Rate Limit

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/rate-limit/stats` | GET, POST | **none** | **yes** | **WARNING: TODO in code says "Add admin auth"** |

### 2.30 Reports

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/reports/mine` | GET | session | no | Access cookie + tier check |
| `/api/reports/request` | POST | session | no | Access cookie + tier check |
| `/api/reports/webhook` | POST | webhook-sig | no | Stripe signature verification |

### 2.31 Sovereign

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/sovereign/mandates` | GET, POST, PATCH | none | yes | |

### 2.32 Strategy Room (Pages)

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/strategy-room/analyze` | POST | none | yes | Rate-limited |
| `/api/strategy-room/analyze/route` | POST | none | yes | Rate-limited |
| `/api/strategy-room/enrol` | POST | none | yes | Rate-limited |
| `/api/strategy-room/export/[slug]` | GET | session | no | getServerSession + innerCircleAccess |
| `/api/strategy-room/intake` | POST | none | yes | Rate-limited |
| `/api/strategy-room/submit` | POST | none | yes | Rate-limited |
| `/api/strategy-room/submit/route` | POST | none | yes | |

### 2.33 Stripe Webhooks

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/stripe/diagnostic-report-webhook` | POST | webhook-sig | no | Stripe signature verification |
| `/api/webhooks/stripe` | POST | webhook-sig | no | Stripe signature verification |
| `/api/webhooks/resend` | POST | webhook-sig | no | Resend HMAC signature |

### 2.34 Surrender / Assets

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/assets/retrieve` | POST | session | no | getServerSession |
| `/api/assets/serve-pdf` | GET | session | no | getServerSession |
| `/api/surrender/download/[id]` | GET | session | no | getInnerCircleAccess |

### 2.35 Users

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/users` | GET | session | no | getServerSession |

### 2.36 OG / Misc

| Route | Methods | AUTH | PUBLIC | Notes |
|---|---|---|---|---|
| `/api/og/short` | GET | none | yes | OG image generation |

---

## 3. Middleware

**File:** `lib/inner-circle/middleware.ts` (not a Next.js root middleware)

This project has **no root `middleware.ts`** in the project directory. The `lib/inner-circle/middleware.ts` is a utility module providing:

| Export | Purpose |
|---|---|
| `requireTier(req, requiredTier)` | Reads access cookie, resolves session from Postgres, checks tier |
| `withTierAccess(handler, options)` | Wraps Pages Router handlers with tier enforcement |

**Matchers:** None (no root middleware.ts exists). Route protection is handled per-route via:
- `requireAdminAppRoute()` for App Router admin routes
- `requireAdmin()` / `requireAdminServer()` for Pages Router admin routes
- `getServerSession()` for session-gated routes
- `readAccessCookie()` + `getSessionContext()` for SSOT session routes
- `CRON_SECRET` header checks for cron routes

---

## 4. Cron Routes

| Route | Schedule (netlify.toml) | AUTH | Notes |
|---|---|---|---|
| `/api/cron/snapshot` | Not scheduled | cron | CRON_SECRET Bearer |
| `/api/cron/calibration` | Not scheduled | **none** | **WARNING: No CRON_SECRET check** |
| `/api/cron/decision-state` | `0 */12 * * *` | cron | CRON_SECRET Bearer |
| `/api/cron/escalation` | `0 */6 * * *` | cron | CRON_SECRET Bearer or x-cron-secret |
| `/api/cron/clean-keys` | Not scheduled | cron | CRON_SECRET Bearer |
| `/api/cron/cleanup-download-security` | Not scheduled | cron | CRON_SECRET Bearer or x-cron-secret |
| `/api/cron/cleanup-download-token` | Not scheduled | session | getServerSession (unusual for cron) |
| `/api/cron/security-sweep` | Not scheduled | cron | CRON_SECRET + timing-safe compare |
| `/api/cleanup-download-tokens` | `0 2 * * *` | -- | Scheduled in netlify.toml but no matching route file found |
| `/api/follow-up/process` | Not scheduled | cron | CRON_SECRET Bearer |
| `/api/strategy-room/briefing/scan` | Not scheduled | cron | CRON_SECRET Bearer |
| `/api/system/maintenance` | Not scheduled | token | CRON_SECRET_KEY Bearer (different env var) |
| `/api/keys/verify` | Not scheduled | token | CRON_SECRET_KEY Bearer (different env var) |

---

## 5. Webhook Routes

| Route | Provider | AUTH | Signature Verification |
|---|---|---|---|
| `/api/billing/webhook` | Stripe | webhook-sig | `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET` |
| `/api/reports/webhook` | Stripe | webhook-sig | `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET` |
| `/api/stripe/diagnostic-report-webhook` | Stripe | webhook-sig | `stripe.webhooks.constructEvent()` with `STRIPE_DIAGNOSTIC_REPORT_WEBHOOK_SECRET` |
| `/api/webhooks/stripe` | Stripe | webhook-sig | `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET` |
| `/api/webhooks/resend` | Resend | webhook-sig | HMAC SHA-256 with `RESEND_WEBHOOK_SECRET` |

---

## 6. Admin Routes Summary

### App Router Admin (all use `requireAdminAppRoute()`)
- `/api/admin/campaigns/**`
- `/api/admin/commercial`
- `/api/admin/decision/contextual-efficacy`
- `/api/admin/decision/contextual-ranking`
- `/api/admin/decision/efficacy`
- `/api/admin/decision/governance`
- `/api/admin/decision/performance`
- `/api/admin/decision/rebuild-*`
- `/api/admin/decision/signal-registry`
- `/api/admin/enterprise-foundation`
- `/api/enterprise-foundation/**`
- `/api/executive/snapshot`
- `/api/retainers/contracts`
- `/api/retainers/decisions`
- `/api/retainers/enforcement-cycles`

### App Router Admin -- MISSING AUTH
- `/api/admin/decision-intelligence` -- **NO AUTH GUARD**
- `/api/admin/positioning` -- **NO AUTH GUARD**

### Pages Router Admin (use `requireAdmin()` or `requireAdminServer()`)
- `/api/admin/access-keys/**`
- `/api/admin/audit-logs`
- `/api/admin/deal-flow-stats`
- `/api/admin/export-audit`
- `/api/admin/export-vips`
- `/api/admin/identity-audit`
- `/api/admin/inner-circle/issue`
- `/api/admin/institutional-analytics`
- `/api/admin/invites/**`
- `/api/admin/jobs/**`
- `/api/admin/members/**`
- `/api/admin/onboard-principal`
- `/api/admin/pdf-analytics`
- `/api/admin/pdf-status`
- `/api/admin/proof/evidence/**`
- `/api/admin/security/appeal`
- `/api/admin/security/events`
- `/api/admin/security/resolve-appeal`
- `/api/admin/status-report`
- `/api/admin/users/upgrade`
- `/api/admin/validation`
- `/api/inner-circle/lexicon`

### Pages Router Admin -- MISSING AUTH
- `/api/admin/diagnostics/grants/revoke` -- **NO AUTH GUARD**
- `/api/admin/diagnostics/regenerate` -- **NO AUTH GUARD**
- `/api/admin/diagnostics/retention/run` -- **NO AUTH GUARD (runs data deletion)**
- `/api/admin/diagnostics/revoke` -- **NO AUTH GUARD**
- `/api/rate-limit/stats` -- **NO AUTH (TODO in code)**
- `/api/diagnostics/telemetry` -- **NO AUTH (exposes DB stats)**

---

## 7. Download / Entitlement Routes

| Route | AUTH | Delivery |
|---|---|---|
| `/api/download/[token]` | token (download token + session binding) | Generates and streams PDF with forensic watermark |
| `/api/downloads/[slug]` | none (identity resolution + entitlement) | Resolves asset, checks entitlement, serves file |
| `/api/downloads/resolve/[slug]` | session (inner circle) | Creates signed download grant |
| `/api/downloads/resolve/[slug]/[...rest]` | session (inner circle) | Creates signed download grant |
| `/api/downloads/mdx` | session (tier-gated) | MDX content delivery |
| `/api/downloads/instrument-pdf` | none | Public instrument PDF |
| `/api/access/download` | session | Creates signed download token |
| `/api/access/serve` | token (signed download token) | Redirects to file URL with token |
| `/api/premium/content/download/[id]` | token (download token) | Premium content delivery with forensics |
| `/api/surrender/download/[id]` | session (inner circle) | Inner circle gated download |
| `/api/diagnostics/reports/download` | token (signed download) | Rate-limited signed download |
| `/api/dl/[token]` | none | **DISABLED** -- returns 410 GONE |

---

## 8. Redirects and Rewrites

### next.config.mjs Redirects

| Source | Destination | Status |
|---|---|---|
| `/terms-of-service` | `/terms` | 301 |
| `/security-policy` | `/security` | 301 |
| `/diagnostic` | `/strategy-room` | 301 |
| `/essays/:slug*` | `/blog/:slug*` | 301 |

### netlify.toml Redirects

| Source | Destination | Status | Notes |
|---|---|---|---|
| `/assets/downloads/*` | `/404` | 404 | **Blocks direct file access** |
| `https://abrahamoflondon.org/*` | `https://www.abrahamoflondon.org/:splat` | 301 | Bare domain redirect |
| `/index.html` | `/` | 301 | |
| `/essays/*` | `/blog/:splat` | 301 | |
| `/downloads/vault/*` | `/vault/:splat` | 301 | |
| `/insights/:slug` | `/blog/:slug` | 301 | |
| `/contact-us` | `/contact` | 301 | |
| `/vault/lexicon/:slug` | `/lexicon/:slug` | 301 | |
| `/lexicon/*.pdf` | `/api/downloads/*` | 301 | 17 PDF aliases |
| `/prints/*.pdf` | `/api/downloads/*` | 301 | 6 PDF aliases |
| `/resources/*.pdf` | `/api/downloads/*` | 301 | ~70 PDF aliases |
| `/vault/briefs/*.pdf` | `/api/downloads/*` | 301 | 12 PDF aliases |
| `/vault/CB-*.pdf` | `/api/downloads/*` | 301 | ~75 PDF aliases |
| `/vault/general/*.pdf` | `/api/downloads/*` | 301 | 3 PDF aliases |

### netlify.toml Schedules

| Path | Schedule |
|---|---|
| `/api/cleanup-download-tokens` | `0 2 * * *` (daily 02:00 UTC) |
| `/api/cron/escalation` | `0 */6 * * *` (every 6 hours) |
| `/api/cron/decision-state` | `0 */12 * * *` (every 12 hours) |

---

## CRITICAL FINDINGS

### Routes with Missing Authentication (Security Gaps)

| Route | Risk | Impact |
|---|---|---|
| `/api/admin/decision-intelligence` | HIGH | Exposes analytics/funnel data without auth |
| `/api/admin/positioning` | MEDIUM | Exposes positioning infrastructure without auth |
| `/api/admin/diagnostics/grants/revoke` | **CRITICAL** | Allows unauthenticated revocation of diagnostic grants |
| `/api/admin/diagnostics/regenerate` | **CRITICAL** | Allows unauthenticated report regeneration |
| `/api/admin/diagnostics/retention/run` | **CRITICAL** | Allows unauthenticated data deletion (retention sweep) |
| `/api/admin/diagnostics/revoke` | **CRITICAL** | Allows unauthenticated artifact revocation |
| `/api/cron/calibration` | HIGH | Cron endpoint without CRON_SECRET verification |
| `/api/diagnostics/telemetry` | MEDIUM | Exposes database counts without auth |
| `/api/rate-limit/stats` | MEDIUM | Exposes rate-limit internals; TODO in code for auth |
| `/api/debug/contentlayer-registry` | LOW | No NODE_ENV guard (unlike contentlayer-exports) |
| `/api/debug/ssot-health` | LOW | No NODE_ENV guard |

### Scheduled Route Mismatch
- netlify.toml schedules `/api/cleanup-download-tokens` but no file at that path exists. The actual cleanup routes are `/api/cron/cleanup-download-token` and `/api/cron/cleanup-download-security`.

### Weak Auth Patterns
- `/api/inner-circle/admin/export` uses `admin_session` cookie with a TODO noting "verify token properly".
- `/api/admin/inner-circle/export/route` (Pages Router) uses a dev password for admin session creation.
- `/api/constitutional/*` routes use `X-User-Id` header which is client-settable.

---

**Total routes inventoried:** 131 App Router + 163 Pages Router = **294 API routes**
