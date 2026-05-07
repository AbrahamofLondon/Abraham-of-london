# Router Governance

> Institutional Stabilization -- Phase G
> Generated: 2026-05-07
> Covers: App Router (`app/`), Pages Router (`pages/`), mixed boundaries, `server-only` compliance

---

## 1. App Router Routes (`app/`)

### 1.1 App Router Pages (`page.tsx`)

| Path | Classification | Notes |
|---|---|---|
| `app/(dashboard)/portfolio/page.tsx` | Canonical | Dashboard group route |
| `app/(dashboard)/pricing/page.tsx` | Canonical | Dashboard group route |
| `app/__pdf/[slug]/page.tsx` | Canonical | Internal PDF render surface |
| `app/admin/audit/page.tsx` | Canonical | Admin audit dashboard |
| `app/admin/campaigns/[id]/page.tsx` | Canonical | Campaign detail |
| `app/admin/campaigns/[id]/report/page.tsx` | Canonical | Campaign report |
| `app/admin/campaigns/new/page.tsx` | Canonical | New campaign form |
| `app/admin/campaigns/page.tsx` | Canonical | Campaign list |
| `app/admin/commercial/page.tsx` | Canonical | Commercial dashboard |
| `app/admin/decision-intelligence/page.tsx` | Canonical | Decision intelligence |
| `app/admin/decision/contextual-efficacy/page.tsx` | Canonical | Decision sub-view |
| `app/admin/decision/contextual-ranking/page.tsx` | Canonical | Decision sub-view |
| `app/admin/decision/efficacy/page.tsx` | Canonical | Decision sub-view |
| `app/admin/decision/governance/page.tsx` | Canonical | Decision sub-view |
| `app/admin/decision/metadata-audit/page.tsx` | Canonical | Decision sub-view |
| `app/admin/decision/performance/page.tsx` | Canonical | Decision sub-view |
| `app/admin/organisations/[id]/page.tsx` | Canonical | Org detail |
| `app/admin/organisations/[id]/campaigns/new/page.tsx` | Canonical | Org campaign create |
| `app/admin/organisations/[id]/dashboard/page.tsx` | Canonical | Org dashboard |
| `app/admin/organisations/[id]/report/page.tsx` | Canonical | Org report |
| `app/admin/organisations/new/page.tsx` | Canonical | New org |
| `app/admin/organisations/page.tsx` | Canonical | Org list |
| `app/admin/reporting/executive/[...slug]/page.tsx` | Canonical | Executive reporting |
| `app/admin/reporting/executive/[id]/page.tsx` | Canonical | Executive report detail |
| `app/admin/reports/page.tsx` | Canonical | Reports list |
| `app/admin/snapshot/page.tsx` | Canonical | Snapshot view |
| `app/api/audit/[id]/success/page.tsx` | **Anomaly** | `page.tsx` inside `app/api/` -- should be a page route, not API |
| `app/assessment/[token]/page.tsx` | Canonical | Token-based assessment |
| `app/assessment/success/page.tsx` | Canonical | Assessment success |
| `app/audit/[id]/page.tsx` | Canonical | Audit detail |
| `app/audit/[id]/success/page.tsx` | Canonical | Audit success |
| `app/briefing/return/[sessionId]/page.tsx` | Canonical | Briefing return |
| `app/briefs/[slug]/page.tsx` | Canonical | Brief detail |
| `app/dashboard/live/page.tsx` | Canonical | Live dashboard |
| `app/dashboard/pdf-analytics/page.tsx` | Canonical | PDF analytics |
| `app/dashboard/purpose-alignment/page.tsx` | Canonical | Purpose alignment dashboard |
| `app/downloads/vault/page.tsx` | Canonical | Download vault |
| `app/enterprise/alignment/campaigns/[campaignId]/page.tsx` | Canonical | Enterprise alignment |
| `app/pdf-dashboard/page.tsx` | Canonical | PDF dashboard (constitutional) |
| `app/purpose-alignment/page.tsx` | Canonical | Public product |
| `app/registry/[...slug]/page.tsx` | Canonical | Registry catch-all |
| `app/render/pdf/[id]/page.tsx` | Canonical | PDF render |
| `app/restricted/page.tsx` | Canonical | Restricted/lockdown landing |
| `app/settings/integrations/page.tsx` | Canonical | User settings |
| `app/strategy-room/success/page.tsx` | Canonical | Strategy room success |
| `app/testing/lab/page.tsx` | Transitional | Testing page -- remove before production |

### 1.2 App Router API Routes (`route.ts`)

| Path | Classification | Notes |
|---|---|---|
| `app/api/admin/campaigns/*` (7 routes) | Canonical | All use `requireAdminAppRoute()` |
| `app/api/admin/commercial` | Canonical | Admin |
| `app/api/admin/decision/*` (10 routes) | Canonical | Admin decision intelligence |
| `app/api/admin/dev-login` | Transitional | Dev-only; returns 404 in production |
| `app/api/admin/enterprise-foundation` | Canonical | Admin |
| `app/api/admin/positioning` | Canonical | Admin |
| `app/api/alignment/enterprise/*` (10 routes) | Canonical | Enterprise alignment suite |
| `app/api/analytics/*` (2 routes) | Canonical | Analytics |
| `app/api/assessments/*` (2 routes) | Canonical | Assessment runners |
| `app/api/audit/*` (3 routes) | Canonical | Audit system |
| `app/api/auth/sovereign` | Canonical | Sovereign auth |
| `app/api/boardroom/dossier/*` (2 routes) | Canonical | Boardroom |
| `app/api/calibration/ingest` | Canonical | Calibration ingest |
| `app/api/campaigns/[id]/*` (5 routes) | Canonical | Campaign management |
| `app/api/checkout` | Canonical | Stripe checkout |
| `app/api/constitutional/*` (3 routes) | Canonical | Constitutional system |
| `app/api/contracts/verify` | Canonical | Contract verification |
| `app/api/cron/*` (4 routes) | Canonical | Scheduled tasks |
| `app/api/decision/*` (3 routes) | Canonical | Decision engine |
| `app/api/diagnostics/*` (6 routes) | Canonical | Diagnostic tools |
| `app/api/download/[token]` | Canonical | Token-gated download |
| `app/api/downloads/[slug]` | Canonical | Slug-based download |
| `app/api/editorials/[slug]` | Canonical | Editorial content |
| `app/api/enterprise-foundation/*` (3 routes) | Canonical | Enterprise foundation |
| `app/api/entitlements` | Canonical | Entitlement check |
| `app/api/evidence/*` (2 routes) | Canonical | Evidence system |
| `app/api/executive-reporting/*` (5 routes) | Canonical | Executive reporting suite |
| `app/api/executive/snapshot` | Canonical | Executive snapshot |
| `app/api/inner-circle/*` (3 routes) | Canonical | Inner circle |
| `app/api/interactions/toggle` | Canonical | User interactions |
| `app/api/interpret` | Canonical | Interpretation engine |
| `app/api/leads/fuse` | Canonical | Lead fusion |
| `app/api/live/constitutional-posture` | Canonical | Live posture |
| `app/api/predictive/insights/[campaignId]` | Canonical | Predictive analytics |
| `app/api/premium/forensics/attribution` | Canonical | PDF forensics (upload) |
| `app/api/pulse/submit` | Canonical | Pulse data |
| `app/api/purpose-alignment/*` (5 routes) | Canonical | Purpose alignment |
| `app/api/retainers/*` (4 routes) | Canonical | Retainer management |
| `app/api/root` | Canonical | Root endpoint |
| `app/api/search` | Canonical | Search |
| `app/api/sovereign/*` (4 routes) | Canonical | Sovereign system |
| `app/api/stats` | Canonical | Stats |
| `app/api/strategy-room/*` (11 routes) | Canonical | Strategy room |
| `app/api/team-assessment/*` (6 routes) | Canonical | Team assessment |
| `app/api/team/respondents/[token]` | Canonical | Token respondent |
| `app/api/telemetry/*` (2 routes) | Canonical | Telemetry |
| `app/api/user/*` (2 routes) | Canonical | User management |
| `app/api/v2/health` | Canonical | V2 health check |
| `app/api/v2/users` | Canonical | V2 users |
| `app/api/vault/*` (2 routes) | Canonical | Vault system |
| `app/strategy-room/results/route.ts` | **Anomaly** | `route.ts` outside `app/api/` -- page route acting as API |

---

## 2. Pages Router Routes (`pages/`)

### 2.1 Pages Router Pages (`*.tsx`)

| Path | Classification | Notes |
|---|---|---|
| `pages/index.tsx` | Canonical | Homepage |
| `pages/404.tsx`, `pages/500.tsx`, `pages/_error.tsx` | Canonical | Error pages |
| `pages/[slug].tsx` | Canonical | Dynamic content catch-all |
| `pages/about.tsx`, `pages/about/founder.tsx` | Canonical | About pages |
| `pages/access/accept.tsx`, `pages/access/index.tsx`, `pages/access/redeem.tsx` | Canonical | Access flow |
| `pages/accessibility.tsx`, `pages/accessibility-statement.tsx` | Canonical | Legal |
| `pages/admin/index.tsx` | Legacy | Duplicate -- admin pages exist in App Router too |
| `pages/admin/login.tsx` | Canonical | Admin login (public) |
| `pages/admin/access-keys.tsx` | Legacy | Admin sub-page |
| `pages/admin/access-revoke.tsx` | Legacy | Admin sub-page |
| `pages/admin/assets.tsx` | Legacy | Admin sub-page |
| `pages/admin/authority-center.tsx` | Legacy | Admin sub-page |
| `pages/admin/calibration.tsx` | Legacy | Admin sub-page |
| `pages/admin/command-wall.tsx` | Legacy | Admin sub-page |
| `pages/admin/conversion-dashboard.tsx` | Legacy | Admin sub-page |
| `pages/admin/enterprise-foundation.tsx` | Legacy | Duplicated in App Router |
| `pages/admin/enterprise-pipeline.tsx` | Legacy | Admin sub-page |
| `pages/admin/inner-circle/index.tsx` | Legacy | Admin IC management |
| `pages/admin/intelligence.tsx` | Legacy | Admin sub-page |
| `pages/admin/outcome-ledger.tsx` | Legacy | Admin sub-page |
| `pages/admin/pdf-dashboard.tsx` | Legacy | Duplicated -- `app/pdf-dashboard` exists |
| `pages/admin/pdf-status.tsx` | Legacy | Admin sub-page |
| `pages/admin/proof.tsx` | Legacy | Admin sub-page |
| `pages/admin/redis.tsx` | Legacy | Admin sub-page |
| `pages/admin/validation.tsx` | Legacy | Admin sub-page |
| `pages/artifacts.tsx`, `pages/artifacts/[id].tsx` | Canonical | Artifact pages |
| `pages/artifacts/global-market-outlook-q1-2026-public.tsx` | Canonical | Specific artifact |
| `pages/auth/signin.tsx` | Canonical | Sign-in page |
| `pages/blog/[...slug].tsx`, `pages/blog/index.tsx` | Canonical | Blog |
| `pages/board/c.tsx`, `pages/board/dashboard.tsx`, `pages/board/intelligence.tsx` | Canonical | Board pages (Tier 2 gated) |
| `pages/books/[slug].tsx`, `pages/books/index.tsx` | Canonical | Books |
| `pages/books/the-architecture-of-human-purpose-landing.tsx` | Canonical | Book landing |
| `pages/brands/index.tsx` | Canonical | Brands |
| `pages/canon/[slug].tsx`, `pages/canon/glossary.tsx`, `pages/canon/index.tsx` | Canonical | Canon |
| `pages/canon-campaign/index.tsx` | Canonical | Campaign |
| `pages/chatham-rooms/index.tsx` | Canonical | Chatham rooms |
| `pages/client/dashboard.tsx` | Canonical | Client dashboard |
| `pages/constitution/command-centre.tsx` | Canonical | Constitutional |
| `pages/consulting/index.tsx`, `pages/consulting/interventions.tsx`, `pages/consulting/strategy-room.tsx` | Canonical | Consulting (Tier 1) |
| `pages/contact.tsx`, `pages/contact/success.tsx` | Canonical | Contact |
| `pages/content/[...slug].tsx`, `pages/content/index.tsx`, `pages/content/simple.tsx` | Canonical | Content |
| `pages/controls.tsx` | Canonical | Controls |
| `pages/cookie-policy.tsx`, `pages/cookies.tsx` | Canonical | Legal |
| `pages/dashboard.tsx`, `pages/dashboard/diagnostics.tsx` | Legacy | Dashboard (redirects via GSSP) |
| `pages/debug/content.tsx` | Transitional | Debug page -- remove before production |
| `pages/decision-instruments/*` (8 pages) | Canonical | Decision instruments |
| `pages/decision-paths/index.tsx` | Canonical | Decision paths |
| `pages/dev/dashboard.tsx` | Transitional | Dev dashboard -- remove before production |
| `pages/diagnostic.tsx` | Deprecated | Redirects to `/strategy-room` via next.config.mjs |
| `pages/diagnostics/*` (10 pages) | Canonical | Diagnostics (public product) |
| `pages/directorate/dossier/[id].tsx`, `pages/directorate/oversight.tsx` | Canonical | Directorate (Tier 3) |
| `pages/downloads/[...slug].tsx`, `pages/downloads/index.tsx` | Canonical | Downloads |
| `pages/editorials/*` (4 pages) | Canonical | Editorials |
| `pages/education-research/index.tsx` | Canonical | Education |
| `pages/events/[slug].tsx`, `pages/events/index.tsx`, `pages/events/success.tsx` | Canonical | Events |
| `pages/evidence/[slug].tsx`, `pages/evidence/index.tsx` | Canonical | Evidence |
| `pages/fatherhood/index.tsx` | Canonical | Public |
| `pages/foundations.tsx` | Canonical | Public |
| `pages/founders/index.tsx` | Canonical | Public |
| `pages/inner-circle/*` (14 pages) | Canonical | Inner circle (Tier 2) |
| `pages/inner-circle/admin.tsx`, `pages/inner-circle/admin/*` | Canonical | IC admin (Tier 3) |
| `pages/institutional/index.tsx` | Canonical | Institutional |
| `pages/intelligence/global-market-intelligence-q1-2026.tsx` | Canonical | Intelligence |
| `pages/leadership/index.tsx` | Canonical | Public |
| `pages/lexicon/[slug].tsx`, `pages/lexicon/index.tsx` | Canonical | Lexicon |
| `pages/library/[slug].tsx`, `pages/library/index.tsx` | Canonical | Library |
| `pages/media/index.tsx` | Canonical | Public |
| `pages/membership/success.tsx` | Canonical | Membership |
| `pages/method.tsx` | Canonical | Public |
| `pages/my-access.tsx`, `pages/my-instruments/index.tsx` | Canonical | User pages |
| `pages/newsletter.tsx` | Canonical | Newsletter |
| `pages/offline.tsx` | Canonical | Offline fallback |
| `pages/playbooks/[slug].tsx`, `pages/playbooks/index.tsx` | Canonical | Playbooks |
| `pages/premium/library.tsx` | Canonical | Premium (IC gated) |
| `pages/prints/[slug].tsx`, `pages/prints/index.tsx` | Canonical | Prints |
| `pages/privacy.tsx` | Canonical | Legal |
| `pages/private-clients/index.tsx` | Canonical | Private clients |
| `pages/private/admin/premium-downloads.tsx` | Legacy | Admin premium |
| `pages/private/frameworks/[slug].tsx` | Canonical | Private frameworks |
| `pages/registry/[type]/[slug].tsx`, `pages/registry/index.tsx` | Canonical | Registry |
| `pages/resources/*` (6 pages) | Canonical | Resources |
| `pages/retainer.tsx` | Canonical | Retainer |
| `pages/security.tsx`, `pages/security-policy.tsx` | Canonical | Legal |
| `pages/shorts/[...slug].tsx`, `pages/shorts/index.tsx` | Canonical | Shorts (public) |
| `pages/shorts/index.migrated.tsx` | Deprecated | Migration artifact |
| `pages/sovereign/authorize.tsx` | Canonical | Sovereign auth |
| `pages/speaking/index.tsx` | Canonical | Public |
| `pages/strategy-room/index.tsx`, `pages/strategy-room/session/[id].tsx` | Canonical | Strategy room |
| `pages/strategy/[...slug].tsx`, `pages/strategy/index.tsx` | Canonical | Strategy (Tier 1) |
| `pages/subscribe.tsx` | Canonical | Public |
| `pages/terms.tsx`, `pages/terms-of-service.tsx` | Canonical | Legal |
| `pages/test-readers.tsx` | Transitional | Test page -- remove before production |
| `pages/toolkits/[slug].tsx`, `pages/toolkits/index.tsx` | Canonical | Toolkits |
| `pages/trust.tsx` | Canonical | Public |
| `pages/vault/*` (5 pages) | Canonical | Vault (Tier 2) |
| `pages/ventures/[slug].tsx`, `pages/ventures/index.tsx` | Canonical | Ventures |
| `pages/verification.tsx` | Canonical | Verification |
| `pages/why-not-ai.tsx` | Canonical | Public |
| `pages/works-in-progress.tsx` | Canonical | Public |

### 2.2 Pages Router API Routes

See Section 2 of `auth-authority-map.md` for the complete auth-classified list. Total: ~130 API routes across Pages Router.

---

## 3. Mixed Boundaries

### 3.1 `page.tsx` Inside `app/api/`

| File | Issue |
|---|---|
| `app/api/audit/[id]/success/page.tsx` | A page component lives inside the API directory. This is a routing anomaly -- it will render as a page at `/api/audit/[id]/success` but sits in the API namespace. Should be moved to `app/audit/[id]/success/page.tsx`. |

### 3.2 `route.ts` Outside `app/api/`

| File | Issue |
|---|---|
| `app/strategy-room/results/route.ts` | A route handler lives outside `app/api/`. This creates an API endpoint at `/strategy-room/results`. Should be migrated to `app/api/strategy-room/results/route.ts` or documented as intentional. |

### 3.3 Pages Router Files Importing from `lib/server/`

The following Pages Router files import server-only modules. This is **safe in API routes** (they always run server-side) and in `getServerSideProps` but risks build errors if any of these modules use `import "server-only"`:

| File | Import |
|---|---|
| `pages/admin/pdf-dashboard.tsx` | `@/lib/server/institutional-analytics` |
| `pages/api/analytics/downloads/summary.ts` | `@/lib/server/rate-limit-unified`, `@/lib/server/validation`, `@/lib/server/cache` |
| `pages/api/cron/cleanup-download-token.ts` | `@/lib/server/current-access-binding` |
| `pages/api/frameworks/surrender/[slug].ts` | `@/lib/server/auth/tokenStore.postgres`, `@/lib/server/auth/cookies` |
| `pages/api/admin/users/upgrade.ts` | `@/lib/server/db/audit` |
| `pages/api/admin/system-health.ts` | `@/lib/server/rate-limit-unified` |
| `pages/api/frameworks/surrender/[slug]/protected.ts` | `@/lib/server/with-inner-circle-access` |
| `pages/api/admin/institutional-analytics.ts` | `@/lib/server/institutional-analytics` |
| `pages/api/admin/security/toggle-lock.ts` | `@/lib/server/db/audit` |
| `pages/api/admin/security/deny.ts` | `@/lib/server/db/audit` |
| `pages/api/users/index.ts` | `@/lib/server/rate-limit-unified` |
| `pages/api/admin/security/appeal.ts` | `@/lib/server/db/audit` |
| `pages/api/admin/inner-circle/revoke.ts` | `@/lib/server/inner-circle/keys` |
| `pages/api/contact.ts` | `@/lib/server/rateLimit` |
| `pages/api/events/[slug].ts` | `@/lib/server/auth/cookies`, `@/lib/server/auth/tokenStore.postgres` |
| `pages/api/teaser.ts` | `@/lib/server/rate-limit-unified`, `@/lib/server/ip` |
| `pages/api/admin/inner-circle/export.ts` | `@/lib/server/db/audit` |
| `pages/api/endpoint.ts` | `@/lib/server/rate-limit-unified` |
| `pages/downloads/[...slug].tsx` | `@/lib/server/mdx-collections` |
| `pages/api/admin/export-audit.ts` | `@/lib/server/http` |
| `pages/api/system/maintenance.ts` | `@/lib/server/db/audit` |
| `pages/api/canon/[slug].ts` | `@/lib/server/auth/tokenStore.postgres`, `@/lib/server/auth/cookies` |
| `pages/api/admin/reports/[id].ts` | `@/lib/server/auth/cookies`, `@/lib/server/auth/tokenStore.postgres` |

**Critical risk**: `pages/admin/pdf-dashboard.tsx` and `pages/downloads/[...slug].tsx` are **page components** (not API routes) that import from `lib/server/`. If those server modules use `import "server-only"`, these pages will fail at build time. The API routes are safe.

---

## 4. `server-only` Compliance

### 4.1 Files Using `import "server-only"`

30 files declare `import "server-only"`. Key categories:

| Category | Files |
|---|---|
| **Security** | `lib/server/security/signed-action-token.ts`, `lib/server/security/app-route-guards.ts`, `lib/server/security/ip-abuse-watchdog.server.ts`, `lib/server/security/evidence-vault.server.ts`, `lib/server/security/shield-middleware.ts`, `lib/server/security/adaptive-response.server.ts`, `lib/server/security/canary-diagnostics.server.ts` |
| **Decision engines** | `lib/server/decision/challenge-engine.server.ts`, `lib/server/decision/narrative-engine.server.ts`, `lib/server/decision/contradiction-engine.server.ts`, `lib/server/decision/anchor-extractor.server.ts`, `lib/server/decision/anchor-types.server.ts`, `lib/server/decision/public-pattern-proof.server.ts`, `lib/server/decision/cost-of-inaction.server.ts` |
| **Strategy room** | `lib/server/strategy-room/access.server.ts`, `lib/server/strategy-room/return-brief-trigger-engine.server.ts`, `lib/server/strategy-room/return-brief.server.ts` |
| **Follow-up** | `lib/server/follow-up/decision-state-orchestrator.server.ts`, `lib/server/follow-up/decision-state-engine.server.ts` |
| **Observability** | `lib/server/observability/request-context.server.ts`, `lib/server/observability/metrics.server.ts`, `lib/server/observability/event-log.server.ts` |
| **Other** | `lib/server/privacy/identity-service.server.ts`, `lib/server/social-proof/aggregate-patterns.server.ts`, `lib/decision/synthesis-engine.ts`, `lib/security-monitor.ts`, `lib/email/decision-email-builder.ts`, `app/api/inner-circle/verify/route.ts` |

### 4.2 Pages Router Risk Assessment

None of the `lib/server/*.server.ts` files (which use `import "server-only"`) are directly imported by Pages Router files based on the grep results above. The Pages Router imports target `lib/server/` modules that do **not** have the `.server.ts` suffix and do **not** include the `server-only` import guard.

**Status**: No current build breakage risk from `server-only` boundary violations. However, if any `lib/server/` module (without `.server.ts` suffix) is refactored to add `server-only`, the Pages Router imports listed in Section 3.3 would break.

---

## 5. Duplicate/Overlapping Routes

| App Router | Pages Router | Recommendation |
|---|---|---|
| `app/admin/*` (campaigns, reporting, etc.) | `pages/admin/*` (access-keys, calibration, etc.) | Different sub-pages -- no conflict. Pages Router admin pages are legacy and should migrate. |
| `app/pdf-dashboard/page.tsx` | `pages/admin/pdf-dashboard.tsx` | **Potential conflict.** Verify which one serves `/pdf-dashboard`. |
| `app/strategy-room/results/route.ts` | `pages/api/strategy-room/*.ts` | Route handler outside api/ overlaps with Pages Router strategy room APIs. |
| `app/api/inner-circle/*` | `pages/api/inner-circle/*` | Both exist. App Router takes precedence for matching paths. |
