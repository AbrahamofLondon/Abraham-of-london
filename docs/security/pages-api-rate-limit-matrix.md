# Pages API Rate-Limit Matrix

**Updated:** 2026-05-07
**Status:** COMPLETE — all `pages/api/**` routes classified

## Classification Legend

| Classification | Meaning |
|---|---|
| `protected` | Active, production-safe, enforced access control |
| `public` | Intentionally public, rate-limited |
| `public-static` | Static content / read-only, minimal risk |
| `system` | Internal cron/system use, secret-gated |
| `webhook` | Provider-signed webhook, exempt from user rate limiting |
| `auth` | Authentication flow endpoint |
| `legacy` | Retained for backward compat, rate-limited |
| `disabled` | Returns error or redirect, not live |

---

## Admin Routes (all enforce `requireAdminServer()` → persistent 60/15min)

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/admin/access-keys` | `GET` | `protected` | persistent | admin session |
| `/api/admin/access-keys/create` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/access-keys/[id]/revoke` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/access-keys/[id]/uses` | `GET` | `protected` | persistent | admin session |
| `/api/admin/auth/send-link` | `POST` | `auth` | persistent (5/60s/IP) | no admin auth (IS login) |
| `/api/admin/auth/verify` | `GET` | `auth` | token-gated | no admin auth (IS login) |
| `/api/admin/audit-logs` | `GET` | `protected` | persistent | admin session |
| `/api/admin/audit/logs` | `GET` | `protected` | persistent | admin session |
| `/api/admin/deal-flow-stats` | `GET` | `protected` | persistent | admin session |
| `/api/admin/diagnostics/summary` | `GET` | `protected` | persistent | admin session |
| `/api/admin/diagnostics/records` | `GET` | `protected` | persistent | admin session |
| `/api/admin/diagnostics/artifacts` | `GET` | `protected` | persistent | admin session |
| `/api/admin/diagnostics/regenerate` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/diagnostics/grants/revoke` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/diagnostics/jobs/process` | `POST` | `protected` | persistent | admin session |
| `/api/admin/diagnostics/retention/run` | `POST` | `protected` | persistent | admin session |
| `/api/admin/diagnostics/revoke` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/export-audit` | `GET` | `protected` | persistent | admin + export audit |
| `/api/admin/export-vips` | `GET` | `protected` | persistent | admin + export audit |
| `/api/admin/identity-audit` | `GET` | `protected` | persistent | admin session |
| `/api/admin/inner-circle/issue` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/inner-circle/revoke` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/inner-circle/export` | `GET` | `protected` | persistent | admin + export audit |
| `/api/admin/institutional-analytics` | `GET` | `protected` | persistent | admin session |
| `/api/admin/invites/index` | `GET` | `protected` | persistent | admin session |
| `/api/admin/invites/create` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/invites/[id]/revoke` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/jobs/dead-letter/index` | `GET` | `protected` | persistent | admin session |
| `/api/admin/jobs/dead-letter/replay` | `POST` | `protected` | persistent | admin session |
| `/api/admin/jobs/process` | `POST` | `protected` | persistent | admin session |
| `/api/admin/members/keys` | `GET` | `protected` | persistent | admin session |
| `/api/admin/members/list` | `GET` | `protected` | persistent | admin session |
| `/api/admin/members/revoke` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/members/upgrade` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/onboard-principal` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/pdf-analytics` | `GET` | `protected` | persistent | admin session |
| `/api/admin/pdf-status` | `GET` | `protected` | persistent | admin session |
| `/api/admin/pricing` | `GET` | `protected` | persistent | admin session |
| `/api/admin/proof/evidence/index` | `GET` | `protected` | persistent | admin session |
| `/api/admin/proof/evidence/[id]` | `GET` | `protected` | persistent | admin session |
| `/api/admin/reports/index` | `GET` | `protected` | persistent | admin session |
| `/api/admin/reports/[id]` | `GET` | `protected` | persistent | admin session |
| `/api/admin/reports/[id]/deliver` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/security/events` | `GET` | `protected` | persistent | admin session + security audit |
| `/api/admin/security/appeal` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/security/deny` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/security/resolve-appeal` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/security/toggle-lock` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/status-report` | `GET` | `protected` | persistent | admin session |
| `/api/admin/sync-fix` | `POST` | `protected` | persistent | admin session |
| `/api/admin/system-health` | `GET` | `protected` | persistent | admin session |
| `/api/admin/users/upgrade` | `POST` | `protected` | persistent | admin session + audit |
| `/api/admin/validation` | `GET` | `protected` | persistent | admin session |

---

## Billing & Webhooks

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/billing/checkout` | `POST` | `protected` | IP-based | Stripe session creation, catalog SSOT |
| `/api/billing/webhook` | `POST` | `webhook` | exempt | Stripe signature verification |
| `/api/webhooks/stripe` | `POST` | `webhook` | exempt | Stripe signature verification |
| `/api/webhooks/resend` | `POST` | `webhook` | exempt | provider-signed |
| `/api/stripe/diagnostic-report-webhook` | `POST` | `webhook` | exempt | Stripe signature |

---

## Diagnostics (Public-Facing, High-Risk)

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/diagnostics/score` | `POST` | `public` | persistent (IP+payload hash) | Zod schema, abuse shield |
| `/api/diagnostics/challenge` | `POST` | `public` | persistent (IP+abuse) | Zod schema |
| `/api/diagnostics/capture` | `POST` | `public` | persistent (IP+email hash) | Zod schema |
| `/api/diagnostics/submit` | `POST` | `public` | persistent (IP) | Zod schema |
| `/api/diagnostics/constitutional-intake/report` | `POST` | `public` | persistent (IP+session) | Zod schema |
| `/api/diagnostics/constitutional-handoff/[stage]` | `POST` | `public` | persistent (IP) | Zod schema |
| `/api/diagnostics/directional-integrity` | `POST` | `public` | persistent (IP) | Zod schema |
| `/api/diagnostics/enterprise` | `POST` | `public` | persistent (IP) | Zod schema |
| `/api/diagnostics/executive-reporting` | `POST` | `public` | persistent (IP) | Zod schema |
| `/api/diagnostics/team-alignment` | `POST` | `public` | persistent (IP) | Zod schema |
| `/api/diagnostics/telemetry` | `POST` | `public` | persistent (IP) | Zod schema |
| `/api/diagnostics/spine/load` | `GET` | `public` | persistent (IP) | session-scoped |
| `/api/diagnostics/spine/persist` | `POST` | `public` | persistent (IP) | session-scoped |
| `/api/diagnostics/[ref]` | `GET` | `public` | persistent (IP) | read-only |
| `/api/diagnostics/list` | `GET` | `protected` | persistent (auth) | identity-scoped |
| `/api/diagnostics/report` | `GET` | `protected` | persistent (auth) | identity-scoped |
| `/api/diagnostics/report/[id]` | `GET` | `protected` | persistent (auth) | ownership check |
| `/api/diagnostics/report/generate` | `POST` | `protected` | persistent (auth) | entitlement-gated |
| `/api/diagnostics/report/history` | `GET` | `protected` | persistent (auth) | identity-scoped |
| `/api/diagnostics/report/pdf` | `GET` | `protected` | persistent (auth) | entitlement-gated |
| `/api/diagnostics/report/signed-url` | `GET` | `protected` | persistent (auth) | entitlement-gated |
| `/api/diagnostics/report/unlock` | `POST` | `protected` | persistent (auth) | payment-gated |
| `/api/diagnostics/reports/download` | `GET` | `protected` | persistent (auth) | entitlement-gated |
| `/api/diagnostics/reports/issue` | `POST` | `protected` | persistent (admin) | admin only |
| `/api/diagnostics/create-report-checkout` | `POST` | `public` | persistent (IP) | Stripe session |

---

## Strategy Room (Pages Router Legacy Adapters)

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/strategy-room/intake` | `POST` | `public` | persistent (API_STRICT/IP) | legacy adapter |
| `/api/strategy-room/enrol` | `POST` | `public` | persistent (API_STRICT/IP) | canonical enrolment |
| `/api/strategy-room/submit` | `POST` | `public` | persistent (API_STRICT/IP) | form adapter |
| `/api/strategy-room/analyze` | `POST` | `public` | persistent (API_STRICT/IP) | scoring |
| `/api/strategy-room/export/[slug]` | `GET` | `protected` | persistent (auth) | entitlement-gated |

---

## Auth & Access

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/auth/[...nextauth]` | `*` | `auth` | NextAuth default | framework |
| `/api/auth/identity` | `GET` | `auth` | persistent (IP) | session lookup |
| `/api/auth/me` | `GET` | `auth` | persistent (IP) | session info |
| `/api/auth/mint` | `POST` | `auth` | persistent (IP) | token minting |
| `/api/auth/session` | `GET` | `auth` | persistent (IP) | session info |
| `/api/auth/sovereign-login` | `POST` | `auth` | persistent (IP, strict) | key verification |
| `/api/access/enter` | `POST` | `public` | persistent (IP) | key redemption |
| `/api/access/check` | `GET` | `public` | persistent (IP) | status check |
| `/api/access/clear` | `POST` | `auth` | persistent (session) | session clear |
| `/api/access/download` | `GET` | `protected` | persistent (auth) | entitlement check |
| `/api/access/logout` | `POST` | `auth` | persistent (session) | session end |
| `/api/access/me` | `GET` | `auth` | persistent (IP) | identity |
| `/api/access/redeem` | `POST` | `public` | persistent (IP, strict) | key redeem |
| `/api/access/revoke` | `POST` | `protected` | persistent (auth) | self-revoke |
| `/api/access/serve` | `GET` | `protected` | persistent (auth) | content serve |
| `/api/access/verify` | `POST` | `public` | persistent (IP) | token verify |
| `/api/keys/verify` | `POST` | `public` | persistent (IP) | access key verify |

---

## Cron / System

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/cron/decision-state` | `POST` | `system` | secret-gated | CRON_SECRET bearer |
| `/api/cron/clean-keys` | `POST` | `system` | secret-gated | CRON_SECRET bearer |
| `/api/cron/cleanup-download-security` | `POST` | `system` | secret-gated | CRON_SECRET bearer |
| `/api/cron/cleanup-download-token` | `POST` | `system` | secret-gated | CRON_SECRET bearer |
| `/api/cron/security-sweep` | `POST` | `system` | secret-gated | CRON_SECRET bearer |
| `/api/follow-up/process` | `POST` | `system` | secret-gated | CRON_SECRET bearer |
| `/api/follow-up/register` | `POST` | `protected` | persistent (auth) | session-scoped |

---

## Public Content / Read-Only

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/blog/[slug]` | `GET` | `public-static` | none (static content) | MDX metadata |
| `/api/books/[slug]` | `GET` | `public-static` | none | content metadata |
| `/api/briefs/[slug]` | `GET` | `public-static` | none | content metadata |
| `/api/canon/[slug]` | `GET` | `public-static` | none | content metadata |
| `/api/content/[...slug]` | `GET` | `public-static` | none | content serve |
| `/api/content/initialize` | `GET` | `public-static` | none | content init |
| `/api/dispatches/[slug]` | `GET` | `public-static` | none | content metadata |
| `/api/editorials/citation/[slug]` | `GET` | `public-static` | none | citation data |
| `/api/editorials/preview/[slug]` | `GET` | `public-static` | none | preview data |
| `/api/events/[slug]` | `GET` | `public-static` | none | event metadata |
| `/api/frameworks/surrender/[slug]` | `GET` | `public-static` | none | content |
| `/api/library/[slug]` | `GET` | `public-static` | none | content metadata |
| `/api/resources/[...slug]` | `GET` | `public-static` | none | content metadata |
| `/api/resources/mdx` | `GET` | `public-static` | none | registry |
| `/api/resources/strategic-frameworks/[...slug]` | `GET` | `public-static` | none | content |
| `/api/resources/strategic-frameworks/index` | `GET` | `public-static` | none | index |
| `/api/shorts/[slug]` | `GET` | `public-static` | none | content |
| `/api/sitemaps/[category]` | `GET` | `public-static` | none | sitemap XML |
| `/api/health` | `GET` | `public-static` | none | health check |
| `/api/system/health` | `GET` | `public-static` | none | health check |
| `/api/system/lock-status` | `GET` | `public-static` | none | status |
| `/api/system/maintenance` | `GET` | `public-static` | none | status |
| `/api/middleware-health` | `GET` | `public-static` | none | health check |
| `/api/og/short` | `GET` | `public-static` | none | OG image |
| `/api/public/content` | `GET` | `public-static` | none | public content |
| `/api/proof/public` | `GET` | `public-static` | none | public proof |

---

## Commercial / Downloads

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/downloads/instrument-pdf` | `GET` | `protected` | persistent (auth) | entitlement-gated |
| `/api/downloads/mdx` | `GET` | `public-static` | none | metadata |
| `/api/downloads/resolve/[slug]` | `GET` | `public` | persistent (IP) | resolution |
| `/api/dl/[token]` | `GET` | `protected` | token-gated | signed expiring token |
| `/api/events/checkout` | `POST` | `protected` | persistent (IP) | Stripe session |
| `/api/premium/content/download/[id]` | `GET` | `protected` | persistent (auth) | entitlement-gated |
| `/api/premium/content/index` | `GET` | `protected` | persistent (auth) | catalog |
| `/api/premium/dashboard` | `GET` | `protected` | persistent (auth) | user dashboard |
| `/api/premium/admin/*` | `*` | `protected` | persistent (admin) | admin subset |
| `/api/decision-instruments/results/index` | `GET` | `protected` | persistent (auth) | user-scoped |
| `/api/decision-instruments/send-purchase-email` | `POST` | `protected` | persistent (auth) | transactional |

---

## Inner Circle

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/inner-circle/generate-link` | `POST` | `protected` | persistent (auth) | member-only |
| `/api/inner-circle/lexicon` | `GET` | `protected` | persistent (auth) | member-only |
| `/api/inner-circle/register` | `POST` | `public` | persistent (IP, strict) | Zod schema |
| `/api/inner-circle/resend` | `POST` | `protected` | persistent (auth) | member-only |
| `/api/inner-circle/retrieve/[briefId]` | `GET` | `protected` | persistent (auth) | member-only |
| `/api/inner-circle/self-revoke` | `POST` | `protected` | persistent (auth) | self-action |
| `/api/inner-circle/unlock` | `POST` | `public` | persistent (IP) | key verification |

---

## Other Public/Low-Risk

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/contact` | `POST` | `public` | persistent (IP, strict) | form submission |
| `/api/subscribe` | `POST` | `public` | persistent (IP) | newsletter |
| `/api/newsletter` | `POST` | `public` | persistent (IP) | newsletter |
| `/api/verify-newsletter` | `GET` | `public` | token-gated | double-opt-in |
| `/api/analytics/event` | `POST` | `public` | persistent (IP) | client analytics |
| `/api/analytics/downloads/summary` | `GET` | `protected` | persistent (auth) | user-scoped |
| `/api/shorts/[slug]/interactions` | `POST` | `public` | persistent (IP) | engagement |
| `/api/shorts/[slug]/like` | `POST` | `public` | persistent (IP) | engagement |
| `/api/shorts/[slug]/save` | `POST` | `public` | persistent (IP) | engagement |
| `/api/deal-flow/qualify` | `POST` | `public` | persistent (IP) | lead qualification |
| `/api/ogr/simulate` | `POST` | `public` | persistent (IP) | simulation |
| `/api/teaser` | `GET` | `public-static` | none | content |
| `/api/endpoint` | `GET` | `public-static` | none | discovery |
| `/api/pdf-data` | `GET` | `public-static` | none | catalog metadata |

---

## Contracts

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/contracts/create` | `POST` | `protected` | persistent (auth) | authenticated |
| `/api/contracts/[id]/index` | `GET` | `protected` | persistent (auth) | ownership |
| `/api/contracts/[id]/checkpoint` | `POST` | `protected` | persistent (auth) | ownership |
| `/api/contracts/[id]/verify` | `GET` | `protected` | persistent (auth) | ownership |

---

## Integrations

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/integrations/google/connect` | `GET` | `protected` | persistent (auth) | OAuth flow |
| `/api/integrations/google/callback` | `GET` | `auth` | OAuth-gated | callback |
| `/api/integrations/slack/connect` | `GET` | `protected` | persistent (auth) | OAuth flow |
| `/api/integrations/slack/callback` | `GET` | `auth` | OAuth-gated | callback |
| `/api/integrations/disconnect` | `POST` | `protected` | persistent (auth) | authenticated |
| `/api/integrations/signals` | `GET` | `protected` | persistent (auth) | user-scoped |
| `/api/integrations/status` | `GET` | `protected` | persistent (auth) | user-scoped |

---

## Private/Protected Content

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/private/frameworks/[slug]` | `GET` | `protected` | persistent (auth) | tier-gated |
| `/api/private/vault/[...path]` | `GET` | `protected` | persistent (auth) | tier-gated |
| `/api/protected-content` | `GET` | `protected` | persistent (auth) | tier-gated |
| `/api/frameworks/surrender/[slug]/protected` | `GET` | `protected` | persistent (auth) | tier-gated |
| `/api/assets/retrieve` | `GET` | `protected` | persistent (auth) | entitlement |
| `/api/assets/serve-pdf` | `GET` | `protected` | persistent (auth) | entitlement |
| `/api/surrender/download/[id]` | `GET` | `protected` | persistent (auth) | entitlement |

---

## PDFs (Admin/Generation)

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/pdfs/list` | `GET` | `protected` | persistent (admin) | admin |
| `/api/pdfs/generate` | `POST` | `protected` | persistent (admin) | admin |
| `/api/pdfs/generate-all` | `POST` | `protected` | persistent (admin) | admin |
| `/api/pdfs/[id]` | `GET` | `protected` | persistent (admin) | admin |
| `/api/pdfs/[id]/delete` | `DELETE` | `protected` | persistent (admin) | admin + audit |
| `/api/pdfs/[id]/duplicate` | `POST` | `protected` | persistent (admin) | admin |
| `/api/pdfs/[id]/generate` | `POST` | `protected` | persistent (admin) | admin |
| `/api/pdfs/[id]/metadata` | `GET` | `protected` | persistent (admin) | admin |
| `/api/pdfs/[id]/rename` | `PATCH` | `protected` | persistent (admin) | admin |
| `/api/generate-pdf` | `POST` | `protected` | persistent (admin) | admin |
| `/api/generate-all-pdfs` | `POST` | `protected` | persistent (admin) | admin |
| `/api/generate-pdfs/batch` | `POST` | `protected` | persistent (admin) | admin |

---

## Remaining / Misc

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/constitution/assess` | `POST` | `public` | persistent (IP) | Zod schema |
| `/api/constitution/command-centre` | `GET` | `protected` | persistent (auth) | dashboard |
| `/api/constitution/interventions` | `GET` | `protected` | persistent (auth) | user-scoped |
| `/api/dashboard/my-reports` | `GET` | `protected` | persistent (auth) | user-scoped |
| `/api/reports/mine` | `GET` | `protected` | persistent (auth) | user-scoped |
| `/api/reports/request` | `POST` | `protected` | persistent (auth) | authenticated |
| `/api/reports/webhook` | `POST` | `webhook` | exempt | provider-signed |
| `/api/sovereign/mandates` | `GET` | `protected` | persistent (auth) | sovereign key |
| `/api/members/strategies` | `GET` | `protected` | persistent (auth) | member-only |
| `/api/users/index` | `GET` | `protected` | persistent (admin) | admin |
| `/api/admin-client` | `GET` | `protected` | persistent (auth) | client lookup |
| `/api/rate-limit/stats` | `GET` | `protected` | persistent (admin) | admin |
| `/api/proof/evidence` | `POST` | `protected` | persistent (auth) | identity-scoped |
| `/api/artifacts/*` | `GET` | `protected` | persistent (auth) | entitlement |

---

## Debug Routes

| Route | Method | Classification | Rate Limit | Notes |
|---|---|---|---|---|
| `/api/debug/contentlayer-exports` | `GET` | `disabled` | n/a | dev-only, 404 in prod |
| `/api/debug/contentlayer-registry` | `GET` | `disabled` | n/a | dev-only, 404 in prod |
| `/api/debug/ssot-health` | `GET` | `disabled` | n/a | dev-only, 404 in prod |

---

## Summary

- **Total routes classified:** 282
- **No `pages/api/**` route remains "unknown".**
- All production routes have either authentication, rate limiting, or are intentionally public static content.
- `protected` = fails closed when limiter unavailable.
- `webhook` = provider signature verification is primary control.
- `public-static` = read-only content with no write capability and no sensitive data.
