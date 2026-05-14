# Admin Surface Inventory — 2026-05-14

**Pass 1** (original): Read-first audit. Nav metadata corrections applied to `lib/admin/admin-navigation.ts`.

**Pass 2** (2026-05-14 hardening): Navigation Reality Hardening pass. Files changed:
- `lib/admin/admin-navigation.ts` — status type extended to include `"broken"`, visibility type extended to include `"owner"`, `snapshot` corrected to `rough`, descriptions added to all items, `outcome-verification` added (operator/active), `reporting-executive` now active (page created), `getNavItemsForRole` roleOrder map includes `owner`
- `app/admin/reporting/executive/page.tsx` — CREATED. Fixes the broken nav href. No longer a 404.
- `pages/admin/redis.tsx` — admin guard added to `getServerSideProps` via `requireAdminPage` from `@/lib/auth/require-admin-page`
- `app/api/decision/metadata-audit/route.ts` — auth rationale comment added (public-safe content metadata; no admin guard needed)
- `components/admin/AdminLayout.tsx` — `broken` and `deprecated` status badges added to nav item rendering; broken/deprecated items now visually dimmed
- `lib/admin/admin-navigation.test.ts` — CREATED. Nav reality tests added (vitest).
- `docs/admin/admin-surface-inventory-2026-05-14.md` — this file updated.

---

## Surface Inventory

| Route | Router | Status | Role Visibility | In Nav? | Notes | Recommendation |
|-------|--------|--------|----------------|---------|-------|----------------|
| `/admin` | pages | ACTIVE | admin | Yes | Full command-centre index with live API fetches (deal-flow-stats, proof/evidence), stat cards, module links. Meaningful and complete. | No action needed. |
| `/admin/command-wall` | pages | ACTIVE | admin | Yes | Full Directorate_OS surface: topology view, decision intelligence, security overlay, dossier library. Fetches contextual-efficacy and audit logs. LIBRARY tab uses placeholder cards — minor roughness. | Considered ACTIVE overall. Library tab could be flagged as a future task. |
| `/admin/command` | app | ACTIVE | admin | Yes | Institutional Command — queries active decisions, enforcement, escalations, patterns, cost exposure, cadence breaches. Full server component with Prisma. | No action needed. |
| `/admin/authority-center` | pages | ACTIVE | admin | Yes | Authority Center — live Prisma queries: leadCount, ER completions, SR entries, retainers, top contradictions, blocking stakeholders, audit events, enforcement cycles. | No action needed. |
| `/admin/decision-intelligence` | app | ACTIVE | admin | Yes | Funnel analytics dashboard — funnel stages, drop-off, flagship conversion, evidence completion, escalation, buyer efficiency, revenue by path, strategy qualification. Client component with API fetch. | No action needed. |
| `/admin/intelligence` | pages | ACTIVE | admin | Yes | Real-time audit stream — audit logs, deal flow engine with per-submission sovereign intelligence, knowledge graph, security dashboard, canonical efficacy. Very detailed. | No action needed. |
| `/admin/decision/efficacy` | app | ACTIVE | admin | Yes | Decision efficacy panel + rebuild button + contextual ranking. Fetches `/api/admin/decision/efficacy` and `/api/admin/decision/contextual-ranking`. | No action needed. |
| `/admin/decision/governance` | app | ACTIVE | admin | Yes | Governance alerts panel. Fetches `/api/admin/decision/governance`. | No action needed. |
| `/admin/decision/performance` | app | ACTIVE | admin | Yes | Decision performance table + rebuild button. Fetches `/api/admin/decision/performance`. | No action needed. |
| `/admin/decision/contextual-efficacy` | app | ACTIVE | admin | Yes | Contextual efficacy client component — fetches rows, allows per-row drill-down with ranked asset table and context card. | No action needed. |
| `/admin/decision/contextual-ranking` | app | ACTIVE | admin | Yes | Contextual ranking for a live session key. Fetches `/api/admin/decision/contextual-ranking`. | No action needed. |
| `/admin/decision/metadata-audit` | app | ACTIVE | admin | Yes | Metadata audit — fetches `/api/decision/metadata-audit` (non-admin route). Renders total assets, coverage, gap list. Endpoint has an auth rationale comment and returns public-safe content metadata only. | Accepted namespace exception for this endpoint. Broader admin API namespace/guard review remains open. |
| `/admin/calibration` | pages | ROUGH | admin | Yes (status: rough) | Calibration state viewer — real Prisma queries (calibrationState, calibrationEvent). Renders data when available but shows empty-state "No calibration states yet" if unpopulated. Nav already marks `rough`. | Correct. Keep rough until calibration model has populated data. |
| `/admin/institutional-analytics` | pages | ACTIVE | admin | Yes | Renders `AnalyticsDashboard` component (dynamically imported, ssr:false). Admin guard present. Depends on external analytics component. | No action needed. |
| `/admin/retained-cadence` | pages | ACTIVE | operator | Yes | Full cadence queue manager — overdue, in-progress, due, broken, skipped, escalated, not-configured sections. Create cycle form, run-now button. Proper operator-level access. | No action needed. |
| `/admin/retainer-readiness` | pages | ACTIVE | operator | Yes | Rich readiness scorecard — classifyRetainerReadiness, classifyGeneral50KRuntime, area scorecard table, blockers list, verification queue posture, runtime inputs, summary view. Very complete. | No action needed. |
| `/admin/oversight-review` | pages | ACTIVE | operator | Yes | Governed review bench — preview/decision workflow, suppression controls, delivery intent, counsel workflows. Full Prisma-backed types. | No action needed. |
| `/admin/outcome-ledger` | pages | ACTIVE | operator | Yes | Decision → Contradiction → Enforcement → Outcome → Delta ledger. Prisma-backed. Uses canonical `@/components/admin/AdminLayout`. | No action needed. |
| `/admin/suppression-ledger` | pages | ACTIVE | operator | Yes | Suppression events with filter, summary, override status. Loads from `suppression-ledger` service. | No action needed. |
| `/admin/counsel-review` | pages | ACTIVE | admin | Yes | Counsel brief assignment and submission form. Admin guard via requireAdminPage. Real form with fetch to counsel APIs. | No action needed. |
| `/admin/boardroom-archive` | pages | ACTIVE | admin | Yes | Boardroom dossier archive — requires `?organisationId=` param. Shows empty state without param. Full Prisma-backed via `loadBoardroomDossierArchiveSummary`. | Nav label accurate. Could note param requirement in description. |
| `/admin/delivery-queue` | pages | ACTIVE | operator | Yes | Delivery item approve/fail queue — `listAllDeliveries` service, typed `DeliveryRecord`. | No action needed. |
| `/admin/outcome-verification` | pages | ACTIVE | operator | Yes | Operator review queue for DISPUTED/BLOCKED/INSUFFICIENT_EVIDENCE verification records. Full meaningful implementation with SLA bands, queue posture, approve/dispute/escalate actions. Registered in Delivery & Proof nav. | No action needed. |
| `/admin/proof` | pages | ACTIVE | admin | Yes | Evidence review queue — listProofEvidence, approve/reject/display controls, track analytics call. | No action needed. |
| `/admin/pdf-dashboard` | pages | ACTIVE | admin | Yes | Guarded via `requireAdminPage` and wrapped in canonical `@/components/admin/AdminLayout`. Full dashboard UI with hooks (usePDFDashboard, useToast). | No action needed. Auth import path divergence is deferred as cosmetic because it reuses the same admin authority check. |
| `/admin/pdf-status` | pages | ACTIVE | admin | Yes | Guarded via `requireAdminPage`, wrapped in canonical `@/components/admin/AdminLayout`, and renders filesystem-scan state with explicit unavailable handling. | No action needed. |
| `/admin/campaigns` | app | ACTIVE | admin | Yes | Campaign registry list — Prisma `alignmentCampaign`, org links, status badges, activity counts. Full server component. | No action needed. |
| `/admin/campaigns/new` | app | ACTIVE | admin | Yes | Exists as `app/admin/campaigns/new/page.tsx`. Not read in full but file exists. | Verify implementation depth on next pass. |
| `/admin/campaigns/[id]` | app | ACTIVE | admin | No (dynamic) | Campaign detail with participant table, nudge button, campaign actions. Sub-route. | No action needed. |
| `/admin/campaigns/[id]/report` | app | ACTIVE | admin | No (dynamic) | Campaign report with print button. Sub-route. | No action needed. |
| `/admin/organisations` | app | ACTIVE | admin | Yes | Organisation registry — Prisma `alignmentOrganisation`, campaign counts, sector/size/region data. Full server component. | No action needed. |
| `/admin/organisations/new` | app | ACTIVE | admin | Yes | Exists as `app/admin/organisations/new/page.tsx`. | Verify on next pass. |
| `/admin/organisations/[id]` | app | ACTIVE | admin | No (dynamic) | Org detail page. Sub-route. | No action needed. |
| `/admin/organisations/[id]/dashboard` | app | ACTIVE | admin | No (dynamic) | OGR interactive view, intervention modal. Sub-route. | No action needed. |
| `/admin/organisations/[id]/report` | app | ACTIVE | admin | No (dynamic) | Org report. Sub-route. | No action needed. |
| `/admin/enterprise-pipeline` | pages | ACTIVE | admin | Yes | Lead pipeline — Prisma dealFlowSubmission with predictedWinProbability, temperature, journey progress. Real data. Uses canonical `AdminLayout`. | No action needed. |
| `/admin/enterprise-foundation` | pages | ACTIVE | admin | Yes | Executive risk snapshot + foundation telemetry summary. Uses `getExecutiveRiskSnapshot`, `getFoundationTelemetrySummary`. Uses canonical `AdminLayout`. | No action needed. |
| `/admin/assets` | pages | ROUGH | admin | Yes (status: rough) | PdfSyncDashboard wrapped in canonical `AdminLayout`. Nav correctly marks `rough`. Header says "Security Level: Top Secret" — labels may overstate sensitivity. | Keep rough until wording/sensitivity labels are calibrated. |
| `/admin/inner-circle` | pages | ACTIVE | admin | Yes | Inner circle member management — fetch-based member list, key management, status updates. SSR guard present. Dead conditional public Layout code removed. | No action needed. |
| `/admin/snapshot` | app | ROUGH | admin | Yes (status corrected: rough) | Hardcoded mock data: GLOBAL_DATA (respondentCount: 72, band: FRAGMENTED), TEAM_SNAPSHOTS (fixed teams). No live API wiring. Nav status corrected from `active` to `rough`. | Wire to live data before operator use. |
| `/admin/commercial` | app | ACTIVE | admin | Yes | Commercial entitlements — fetches `/api/admin/commercial`, email lookup, catalog product list, failed grants. Client component. | No action needed. |
| `/admin/validation` | pages | ACTIVE | admin | Yes | Product readiness and commercial integrity dashboard — `getCommercialValidationDashboard`, `PRODUCT_CLASSES`, `VALIDATION_CHECKS`. Full validation matrix render. | No action needed. |
| `/admin/conversion-dashboard` | pages | ACTIVE | admin | Yes | Conversion intelligence metrics — `getConversionIntelligenceMetrics`, A1-A5 funnel stats. Uses canonical `AdminLayout`. | No action needed. |
| `/admin/launch-dashboard` | pages | ACTIVE | admin | Yes | Launch funnel drop-off — FUNNELS + SINGLES event tracking, time window selector, GA4 event reference. Full implementation. | No action needed. |
| `/admin/redis` | pages | ACTIVE | admin | Yes | Fetches `/api/vault/status` and renders Redis diagnostics. Guarded via `requireAdminPage` in `getServerSideProps` and wrapped in canonical `AdminLayout`. Endpoint failures render explicit unavailable state rather than a fake zero. | No action needed. |
| `/admin/access-keys` | pages | ACTIVE | admin | Yes | Full key management — access keys, invites, key use history. Prisma-backed. Issue/revoke actions. | No action needed. |
| `/admin/access-revoke` | pages | STUB | admin | No (redirect) | Returns null + redirect to `/admin/access-keys`. Not in nav — correct. | No action needed. |
| `/admin/audit` | app | ACTIVE | admin | Yes | System forensic ledger — Prisma systemAuditLog, graceful handling when Prisma unavailable. | No action needed. |
| `/admin/reporting/executive` | app | ACTIVE | admin | Yes | Governance hub page exists at `app/admin/reporting/executive/page.tsx`. Links distinguish client preview/run surfaces from admin monitoring surfaces. | No action needed. |
| `/admin/reporting/executive/[id]` | app | STUB | admin | No | Returns null. Comment says "should never render in normal operation." Legacy redirect handling in `next.config.mjs`. | No action needed. |
| `/admin/reporting/executive/[...slug]` | app | STUB | admin | No | Returns null. Same as above. | No action needed. |
| `/admin/reports` | app | ACTIVE | admin | Yes | Executive Intelligence Briefs — queries `alignmentCampaign` (completed), renders campaign list with org links. | No action needed. |
| `/admin/login` | pages | ACTIVE | internal | No | Login page. Auth-adjacent — not touched per constraints. Not in nav — correct. | No action needed. |

---

## Pages Discovered But NOT in Nav

| Route | Status | Notes |
|-------|--------|-------|
| `/admin/access-revoke` | STUB | Redirect to `/admin/access-keys`. Correct to omit from nav. |
| `/admin/login` | ACTIVE | Auth surface — correctly omitted from nav. |
| `/admin/campaigns/[id]` | ACTIVE | Dynamic sub-route — not expected in top-level nav. |
| `/admin/campaigns/[id]/report` | ACTIVE | Dynamic sub-route. |
| `/admin/organisations/[id]` | ACTIVE | Dynamic sub-route. |
| `/admin/organisations/[id]/dashboard` | ACTIVE | Dynamic sub-route. |
| `/admin/organisations/[id]/report` | ACTIVE | Dynamic sub-route. |
| `/admin/organisations/[id]/campaigns/new` | ACTIVE | Dynamic sub-route. |
| `/admin/reporting/executive/[id]` | STUB | Legacy null-returning page. |
| `/admin/reporting/executive/[...slug]` | STUB | Legacy null-returning page. |

---

## Reconciled Findings

### Resolved

| Item | Resolution |
|------|------------|
| Admin auth SSOT | Resolved by `136a36c61`. `lib/access/admin-emails.ts` is the single admin email source. `lib/auth/admin-authority.ts` re-exports from it; `lib/product/organisation-access.ts` no longer maintains a second admin list. |
| `/admin/reporting/executive` broken nav href | Resolved by creating `app/admin/reporting/executive/page.tsx`. Nav item is active. |
| `/admin/outcome-verification` absent from nav | Resolved. Registered as `operator`/`active` under Delivery & Proof. |
| `/admin/redis` unguarded/no admin shell | Resolved by `127d637ee`. Page uses `requireAdminPage`, canonical `AdminLayout`, and honest unavailable state for endpoint failures. |
| `/admin/pdf-dashboard` no admin shell | Resolved by `127d637ee`. Page uses canonical `AdminLayout` and remains guarded. |
| `/admin/pdf-status` stale layout import | Resolved. Page imports `@/components/admin/AdminLayout` and is guarded through `@/lib/access/server`. |
| Pages-router admin public Layout usage | Resolved for the audited pages-router admin set. Pages now use canonical `AdminLayout`. |
| App-router admin visual shell | Resolved by `a330df07f`. `app/admin/layout.tsx` guards with `requireAdminServer()` and wraps children in `AppAdminShell`. |
| Product Surface Registry | Resolved by `7b349e4b9`. `/admin/product-surfaces` is active and registered in nav. |
| Report State Dashboard | Resolved by `7b349e4b9`. `/admin/report-state` is active and registered in nav. |
| Retainer Readiness remediation | Resolved by `d47453204`. `/admin/retainer-readiness` includes remediation guidance and operational links. |
| Retained Cadence timeline | Resolved by `ad4b753d0`. `/admin/retained-cadence` has real cadence timeline/queue handling. |
| Campaign/organisation dark-shell visual sweeps | Resolved where covered by `69792c782`, `f18753d46`, and `dd0c89fb8`. Remaining visual concerns are no longer tracked as full-page light-shell blockers. |

### Open P0/P1

No open P0/P1 admin surface inventory issues are currently tracked in this document.

### Open P2/P3

| Priority | Item | Current status |
|----------|------|----------------|
| P2 | `/admin/snapshot` live-data wiring | Still rough/mock. `GLOBAL_DATA` and `TEAM_SNAPSHOTS` remain hardcoded in `app/admin/snapshot/page.tsx`. Keep status `rough` until wired to live data. |
| P2 | Admin API namespace/guard review | Still open. `/admin/decision/metadata-audit` intentionally consumes `/api/decision/metadata-audit`; that endpoint is documented as public-safe content metadata, but broader admin-facing APIs outside `/api/admin` still need periodic review. |
| P3 | `/admin/boardroom-archive` discoverability | Still requires `?organisationId=` for useful output. Empty state is honest, but a picker or stronger linking from organisation surfaces would improve operator use. |
| P3 | Dense operator-page usability | Still open as UX debt, not a blocker: outcome verification, delivery queue, oversight review, and retained cadence are powerful but dense for older operators. |

### Deferred / Intentionally Accepted

| Item | Rationale |
|------|-----------|
| `/admin/pdf-dashboard` imports `requireAdminPage` from `@/lib/auth/require-admin-page` | Accepted as cosmetic divergence. It uses the same admin authority path and is functionally guarded. |
| `/admin/decision/metadata-audit` endpoint outside `/api/admin` | Accepted for this route only because the endpoint returns public-safe content metadata and the admin page itself is guarded. |
| Legacy null executive report sub-routes | `/admin/reporting/executive/[id]` and `[...slug]` remain stub/legacy handling. They are not active nav targets. |
| `/admin/assets` rough sensitivity wording | Kept rough. Wording calibration is product polish, not an access or routing blocker. |

---

## Status Count Summary

| Status | Count |
|--------|-------|
| ACTIVE | 38 |
| ROUGH | 3 |
| STUB | 3 |
| BROKEN | 0 |
| DEPRECATED | 0 |

**Total surfaces audited: 44**

---

## Changes Applied — Pass 1

| Change | Detail |
|--------|--------|
| `reporting-executive` status: `active` → `broken` (Pass 1 planned, Pass 2 fixed) | Page.tsx created at `app/admin/reporting/executive/page.tsx`. Nav restored to `active`. |
| `snapshot` status: `active` → `rough` | Page renders hardcoded mock data. Description added. |
| `metadata-audit` description added | Notes that API call is to non-admin route `/api/decision/metadata-audit`. |
| `outcome-verification` added to nav | Registered as `operator`/`active` in "Delivery & Proof" section. |

## Changes Applied — Pass 2 (Hardening)

| File | Change |
|------|--------|
| `lib/admin/admin-navigation.ts` | Status type: added `"broken"`. Visibility type: added `"owner"`. `snapshot` → `rough`. All items now have descriptions. `outcome-verification` added as operator/active. `reporting-executive` → active (page created). `getNavItemsForRole` roleOrder includes `owner`. |
| `app/admin/reporting/executive/page.tsx` | CREATED — governance hub page. Fixes broken nav href. No longer 404s. |
| `pages/admin/redis.tsx` | Admin guard added: `requireAdminPage(ctx)` from `@/lib/auth/require-admin-page` in `getServerSideProps`. |
| `app/api/decision/metadata-audit/route.ts` | Auth rationale comment added. Confirmed public-safe: only content asset metadata (no user/session/decision data). |
| `components/admin/AdminLayout.tsx` | Added `broken` badge (red-tinted) and `deprecated` badge to nav item rendering. Broken/deprecated items now visually dimmed. |
| `lib/admin/admin-navigation.test.ts` | CREATED — 9 vitest tests for nav reality invariants. |

---

## Guard Status — Confirmed

| Route | Guard | Source | Status |
|-------|-------|--------|--------|
| All `app/admin/*` | `requireAdminServer()` in `app/admin/layout.tsx` | `@/lib/auth/requireAdminServer` | CONFIRMED |
| `/admin/redis` | `requireAdminPage(ctx)` in `getServerSideProps` | `@/lib/auth/require-admin-page` | ADDED (Pass 2) |
| `/admin/outcome-verification` | `requireAdminPage(ctx)` in `getServerSideProps` | `@/lib/access/server` | CONFIRMED |
| `/api/decision/metadata-audit` | None — public-safe content metadata only | — | DOCUMENTED |

## Changes Applied — Pass 3 (Layout Shell Hygiene)

### Pages-Router Layout Normalisation

All pages-router admin pages now use `@/components/admin/AdminLayout` instead of the public `@/components/Layout`. This eliminates the public site header/footer from admin surfaces.

| File | Change |
|------|--------|
| `pages/admin/access-keys.tsx` | Layout → AdminLayout |
| `pages/admin/assets.tsx` | Layout → AdminLayout |
| `pages/admin/conversion-dashboard.tsx` | Layout → AdminLayout |
| `pages/admin/enterprise-foundation.tsx` | Layout → AdminLayout |
| `pages/admin/enterprise-pipeline.tsx` | Layout → AdminLayout |
| `pages/admin/intelligence.tsx` | Layout → AdminLayout |
| `pages/admin/outcome-ledger.tsx` | Layout → AdminLayout |
| `pages/admin/outcome-verification.tsx` | Layout → AdminLayout |
| `pages/admin/proof.tsx` | Layout → AdminLayout (×2 — error + main render path) |
| `pages/admin/pdf-status.tsx` | Fixed import `@/components/AdminLayout` → `@/components/admin/AdminLayout` |
| `pages/admin/inner-circle/index.tsx` | Removed dead `USE_LAYOUT = false` Layout block. Added `requireAdminPage` guard to `getServerSideProps` (was entirely unguarded). |

All touched pages were already guarded via `requireAdminPage` in `getServerSideProps`, except `inner-circle` which had no guard — that gap is now closed.

### App-Router Admin Shell

**Before:** `app/admin/layout.tsx` called `requireAdminServer()` but rendered `<>{children}</>` — no visual shell, no sidebar, no header. App-router admin pages were visually naked and inconsistent (some dark, some light, some with their own custom UI headers).

**After:** `app/admin/layout.tsx` now wraps all app-router admin pages in `AppAdminShell`.

| File | Change |
|------|--------|
| `components/admin/AppAdminShell.tsx` | CREATED — App Router compatible admin shell. Mirrors `AdminLayout.tsx` visually but uses `usePathname`/`useRouter` from `next/navigation` instead of `next/router`. Provides the institutional dark sidebar + header for all app-router admin surfaces. |
| `app/admin/layout.tsx` | Updated to import and render `<AppAdminShell>` around children. Guard unchanged. |

### Admin Layout Consistency — Final State

| Router | Shell | Guard | Status |
|--------|-------|-------|--------|
| Pages Router | `@/components/admin/AdminLayout` | `requireAdminPage` in `getServerSideProps` | Normalised |
| App Router | `AppAdminShell` via `app/admin/layout.tsx` | `requireAdminServer()` in layout | Normalised |

### Note on Auth SSOT Closure

Pass 2 notes referenced "Dual admin email lists remain unresolved." This is resolved. Commit `136a36c61` ("Auth: consolidate admin authority source") consolidated the admin email SSOT. `lib/access/admin-emails.ts` is now the single source. `lib/auth/admin-authority.ts` re-exports from it. `lib/product/organisation-access.ts` no longer maintains its own email list.

---

## Current Open / Deferred Rollup

The authoritative current finding buckets are in **Reconciled Findings** above.

### Still Open

1. **P2** — Wire `/admin/snapshot` to live data. It remains rough/mock and should not be treated as operational truth.
2. **P2** — Continue admin API namespace/guard review for admin-facing endpoints outside `/api/admin`. The metadata-audit exception is documented and accepted, but the broader concern remains open.
3. **P3** — Improve `/admin/boardroom-archive` discoverability when no `organisationId` is present.
4. **P3** — Continue operator UX density cleanup on outcome verification, delivery queue, oversight review, and retained cadence.

### Deferred / Accepted

1. `/admin/pdf-dashboard` auth import path divergence is cosmetic and accepted for now.
2. `/admin/decision/metadata-audit` uses a non-admin API route by design for public-safe content metadata.
3. Legacy null executive report sub-routes remain stubs and are not active nav targets.
4. `/admin/assets` sensitivity wording remains a rough-surface polish issue.
