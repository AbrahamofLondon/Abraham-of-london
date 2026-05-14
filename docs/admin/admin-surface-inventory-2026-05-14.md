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
| `/admin/decision/metadata-audit` | app | ACTIVE | admin | Yes | Metadata audit — fetches `/api/decision/metadata-audit` (non-admin route). Renders total assets, coverage, gap list. | API route bypasses `/api/admin/` prefix — verify auth guards on that endpoint. Description updated in nav. |
| `/admin/calibration` | pages | ROUGH | admin | Yes (status: rough) | Calibration state viewer — real Prisma queries (calibrationState, calibrationEvent). Renders data when available but shows empty-state "No calibration states yet" if unpopulated. Nav already marks `rough`. | Correct. Keep rough until calibration model has populated data. |
| `/admin/institutional-analytics` | pages | ACTIVE | admin | Yes | Renders `AnalyticsDashboard` component (dynamically imported, ssr:false). Admin guard present. Depends on external analytics component. | No action needed. |
| `/admin/retained-cadence` | pages | ACTIVE | operator | Yes | Full cadence queue manager — overdue, in-progress, due, broken, skipped, escalated, not-configured sections. Create cycle form, run-now button. Proper operator-level access. | No action needed. |
| `/admin/retainer-readiness` | pages | ACTIVE | operator | Yes | Rich readiness scorecard — classifyRetainerReadiness, classifyGeneral50KRuntime, area scorecard table, blockers list, verification queue posture, runtime inputs, summary view. Very complete. | No action needed. |
| `/admin/oversight-review` | pages | ACTIVE | operator | Yes | Governed review bench — preview/decision workflow, suppression controls, delivery intent, counsel workflows. Full Prisma-backed types. | No action needed. |
| `/admin/outcome-ledger` | pages | ACTIVE | operator | Yes | Decision → Contradiction → Enforcement → Outcome → Delta ledger. Prisma-backed. Uses `@/components/Layout` (not AdminLayout) — acceptable for this surface. | Consider migrating to AdminLayout for visual consistency. |
| `/admin/suppression-ledger` | pages | ACTIVE | operator | Yes | Suppression events with filter, summary, override status. Loads from `suppression-ledger` service. | No action needed. |
| `/admin/counsel-review` | pages | ACTIVE | admin | Yes | Counsel brief assignment and submission form. Admin guard via requireAdminPage. Real form with fetch to counsel APIs. | No action needed. |
| `/admin/boardroom-archive` | pages | ACTIVE | admin | Yes | Boardroom dossier archive — requires `?organisationId=` param. Shows empty state without param. Full Prisma-backed via `loadBoardroomDossierArchiveSummary`. | Nav label accurate. Could note param requirement in description. |
| `/admin/delivery-queue` | pages | ACTIVE | operator | Yes | Delivery item approve/fail queue — `listAllDeliveries` service, typed `DeliveryRecord`. | No action needed. |
| `/admin/outcome-verification` | pages | ACTIVE | internal | NO (now registered as internal) | Operator review queue for DISPUTED/BLOCKED/INSUFFICIENT_EVIDENCE verification records. Full meaningful implementation with SLA bands, queue posture, approve/dispute/escalate actions. Was completely absent from nav. | Registered in nav as `internal` visibility. Recommend promoting to `operator` visibility once UX placement is decided. |
| `/admin/proof` | pages | ACTIVE | admin | Yes | Evidence review queue — listProofEvidence, approve/reject/display controls, track analytics call. | No action needed. |
| `/admin/pdf-dashboard` | pages | ROUGH | admin | Yes | Imports `@/lib/auth/require-admin-page` (different path from other pages which use `@/lib/access/server`). Full dashboard UI with hooks (usePDFDashboard, useToast). May have import divergence from auth refactor. | Verify `@/lib/auth/require-admin-page` export is valid. Auth parallel agent should confirm. |
| `/admin/pdf-status` | pages | ROUGH | admin | Yes | Imports `@/components/AdminLayout` (not `@/components/admin/AdminLayout`). Filesystem-scan of PDF assets. Functional logic but layout import path differs from all other pages — likely stale. | Fix import path: `@/components/AdminLayout` → `@/components/admin/AdminLayout`. |
| `/admin/campaigns` | app | ACTIVE | admin | Yes | Campaign registry list — Prisma `alignmentCampaign`, org links, status badges, activity counts. Full server component. | No action needed. |
| `/admin/campaigns/new` | app | ACTIVE | admin | Yes | Exists as `app/admin/campaigns/new/page.tsx`. Not read in full but file exists. | Verify implementation depth on next pass. |
| `/admin/campaigns/[id]` | app | ACTIVE | admin | No (dynamic) | Campaign detail with participant table, nudge button, campaign actions. Sub-route. | No action needed. |
| `/admin/campaigns/[id]/report` | app | ACTIVE | admin | No (dynamic) | Campaign report with print button. Sub-route. | No action needed. |
| `/admin/organisations` | app | ACTIVE | admin | Yes | Organisation registry — Prisma `alignmentOrganisation`, campaign counts, sector/size/region data. Full server component. | No action needed. |
| `/admin/organisations/new` | app | ACTIVE | admin | Yes | Exists as `app/admin/organisations/new/page.tsx`. | Verify on next pass. |
| `/admin/organisations/[id]` | app | ACTIVE | admin | No (dynamic) | Org detail page. Sub-route. | No action needed. |
| `/admin/organisations/[id]/dashboard` | app | ACTIVE | admin | No (dynamic) | OGR interactive view, intervention modal. Sub-route. | No action needed. |
| `/admin/organisations/[id]/report` | app | ACTIVE | admin | No (dynamic) | Org report. Sub-route. | No action needed. |
| `/admin/enterprise-pipeline` | pages | ACTIVE | admin | Yes | Lead pipeline — Prisma dealFlowSubmission with predictedWinProbability, temperature, journey progress. Real data. Uses `@/components/Layout` not AdminLayout. | Consider AdminLayout migration for consistency. |
| `/admin/enterprise-foundation` | pages | ACTIVE | admin | Yes | Executive risk snapshot + foundation telemetry summary. Uses `getExecutiveRiskSnapshot`, `getFoundationTelemetrySummary`. Uses `@/components/Layout`. | Consider AdminLayout migration. |
| `/admin/assets` | pages | ROUGH | admin | Yes (status: rough) | PdfSyncDashboard wrapped in Layout. Nav correctly marks `rough`. Header says "Security Level: Top Secret" — labels may overstate sensitivity. | No nav change needed. Keep rough. |
| `/admin/inner-circle` | pages | ACTIVE | admin | Yes | Inner circle member management — fetch-based member list, key management, status updates. SSR guard. Note: uses `USE_LAYOUT = false` guard and conditional Layout require. Functional but layout handling is non-standard. | Consider cleanup of Layout conditional guard. |
| `/admin/snapshot` | app | ROUGH | admin | Yes (status corrected: rough) | Hardcoded mock data: GLOBAL_DATA (respondentCount: 72, band: FRAGMENTED), TEAM_SNAPSHOTS (fixed teams). No live API wiring. Nav status corrected from `active` to `rough`. | Wire to live data before operator use. |
| `/admin/commercial` | app | ACTIVE | admin | Yes | Commercial entitlements — fetches `/api/admin/commercial`, email lookup, catalog product list, failed grants. Client component. | No action needed. |
| `/admin/validation` | pages | ACTIVE | admin | Yes | Product readiness and commercial integrity dashboard — `getCommercialValidationDashboard`, `PRODUCT_CLASSES`, `VALIDATION_CHECKS`. Full validation matrix render. | No action needed. |
| `/admin/conversion-dashboard` | pages | ACTIVE | admin | Yes | Conversion intelligence metrics — `getConversionIntelligenceMetrics`, A1-A5 funnel stats. Uses `@/components/Layout`. | No action needed. |
| `/admin/launch-dashboard` | pages | ACTIVE | admin | Yes | Launch funnel drop-off — FUNNELS + SINGLES event tracking, time window selector, GA4 event reference. Full implementation. | No action needed. |
| `/admin/redis` | pages | ROUGH | admin | Yes | Fetches `/api/vault/status` and renders Redis diagnostics. No AdminLayout (raw div). No admin auth guard in the component (relies on getServerSideProps returning props: {}). Functional but minimal. | Add admin auth guard to getServerSideProps. |
| `/admin/access-keys` | pages | ACTIVE | admin | Yes | Full key management — access keys, invites, key use history. Prisma-backed. Issue/revoke actions. | No action needed. |
| `/admin/access-revoke` | pages | STUB | admin | No (redirect) | Returns null + redirect to `/admin/access-keys`. Not in nav — correct. | No action needed. |
| `/admin/audit` | app | ACTIVE | admin | Yes | System forensic ledger — Prisma systemAuditLog, graceful handling when Prisma unavailable. | No action needed. |
| `/admin/reporting/executive` | app | BROKEN | admin | Yes (status corrected: broken) | No `page.tsx` at root `/app/admin/reporting/executive/`. Only `[id]/page.tsx` (returns null, legacy) and `[...slug]/page.tsx` (returns null, legacy). Nav href is unreachable. | Either create an index page or redirect nav href to `/admin/reports`. Status updated in nav. |
| `/admin/reporting/executive/[id]` | app | STUB | admin | No | Returns null. Comment says "should never render in normal operation." Legacy redirect handling in `next.config.mjs`. | No action needed. |
| `/admin/reporting/executive/[...slug]` | app | STUB | admin | No | Returns null. Same as above. | No action needed. |
| `/admin/reports` | app | ACTIVE | admin | Yes | Executive Intelligence Briefs — queries `alignmentCampaign` (completed), renders campaign list with org links. | No action needed. |
| `/admin/login` | pages | ACTIVE | internal | No | Login page. Auth-adjacent — not touched per constraints. Not in nav — correct. | No action needed. |

---

## Pages Discovered But NOT in Nav

| Route | Status | Notes |
|-------|--------|-------|
| `/admin/outcome-verification` | ACTIVE | Fully implemented operator review queue. Now registered as `internal` in nav. |
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

## Mismatches Found

| # | Mismatch Type | Details |
|---|--------------|---------|
| 1 | Nav points to missing page | `/admin/reporting/executive` — no `page.tsx` at app-router root. Only sub-routes exist and both return null. Nav item is BROKEN. |
| 2 | Page exists, not in nav | `/admin/outcome-verification` — meaningful ACTIVE implementation (operator review queue with SLA posture, approve/dispute/escalate). Completely absent from nav. Registered as `internal` now. |
| 3 | Nav status overstates readiness | `/admin/snapshot` — marked `active` but renders 100% hardcoded mock data. Corrected to `rough`. |
| 4 | API path mismatch | `/admin/decision/metadata-audit` calls `/api/decision/metadata-audit` (not `/api/admin/...`). Route exists but bypasses admin API namespace. Auth may not be enforced. |
| 5 | Layout import divergence | `/admin/pdf-status` imports `@/components/AdminLayout` vs the canonical `@/components/admin/AdminLayout` used by all other pages. |
| 6 | Auth import divergence | `/admin/pdf-dashboard` uses `@/lib/auth/require-admin-page` while most other pages use `@/lib/access/server#requireAdminPage`. |
| 7 | No auth guard in getServerSideProps | `/admin/redis` — `getServerSideProps` returns `{ props: {} }` with no auth check. Page is only protected if middleware catches it. |
| 8 | Pages using non-admin Layout | `/admin/outcome-ledger`, `/admin/enterprise-pipeline`, `/admin/enterprise-foundation`, `/admin/conversion-dashboard` all use `@/components/Layout` instead of `AdminLayout`. Visual inconsistency. |

---

## Status Count Summary

| Status | Count |
|--------|-------|
| ACTIVE | 33 |
| ROUGH | 6 |
| STUB | 3 |
| BROKEN | 1 |
| DEPRECATED | 0 |
| INTERNAL_ONLY | 1 |

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

---

## Remaining Recommendations

1. **DONE** — `/admin/reporting/executive` page.tsx created. Nav no longer a dead link.

2. **DONE** — `/admin/outcome-verification` added as `operator`/`active` in nav.

3. **Fix `/admin/pdf-status` layout import**: Change `@/components/AdminLayout` to `@/components/admin/AdminLayout` to match the rest of the admin surface.

4. **DONE** — `/admin/redis` guard added via `requireAdminPage`.

5. **DONE** — `/api/decision/metadata-audit` confirmed public-safe; auth rationale documented in source.

6. **Normalise Layout usage**: `/admin/outcome-ledger`, `/admin/enterprise-pipeline`, `/admin/enterprise-foundation`, `/admin/conversion-dashboard` use `@/components/Layout` instead of `AdminLayout`. This causes visual inconsistency — these pages lack the admin sidebar.

7. **Verify `/admin/pdf-dashboard` auth path**: It uses `@/lib/auth/require-admin-page` while many other pages use `@/lib/access/server#requireAdminPage`. Both modules call `canAccessAdmin` from the same checks module — they are functionally equivalent but the import paths differ. Low risk; normalisation is cosmetic.

8. **Wire `/admin/snapshot` to live data**: Currently all data is hardcoded (GLOBAL_DATA, TEAM_SNAPSHOTS). Status corrected to `rough`. Not usable operationally.

9. **`/admin/boardroom-archive` parameter requirement**: The page requires `?organisationId=` query param and shows empty state without it. Consider adding a picker UI or adjusting the nav to surface-link from org dashboards only.

10. **`/admin/inner-circle` Layout guard cleanup**: The `USE_LAYOUT = false` conditional require pattern is non-standard and may cause issues with static analysis tooling.
