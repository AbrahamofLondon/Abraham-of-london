# Operator Console Sanitisation Ledger

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London

---

## Files Deleted (Security Risks)

| File | Reason | Severity | Import status |
|------|--------|----------|--------------|
| `components/admin/vault-status.tsx` | Hardcoded client-side password (`'AbeVault2026'`) | CRITICAL | Orphaned — zero external imports |
| `components/admin/VaultSyncButton.tsx` | Dead code — all logic commented out, button disabled | MEDIUM | Orphaned — zero external imports |

## Files Deleted (Static Data Theatre)

| File | Reason | Severity | Import status |
|------|--------|----------|--------------|
| `components/admin/IntelDashboard.tsx` | Imports static JSON from `public/system/intel-audit-log.json`, presents as live operational data | MEDIUM | Only imported by vault-status.tsx (also deleted) |
| `components/admin/GovernanceLedger.tsx` | Uses `NEXT_PUBLIC_ADMIN_API_KEY` as Bearer token, exposes admin secret client-side | CRITICAL | Orphaned — zero external imports |
| `components/admin/CommandCenter.tsx` | Uses `NEXT_PUBLIC_ADMIN_API_KEY` as Bearer token for multiple admin API endpoints including destructive operations | CRITICAL | Orphaned — zero external imports |

## Files Deleted (Orphaned Charts)

| File | Reason | Import status |
|------|--------|--------------|
| `components/admin/charts/EngagementBarChart.tsx` | Extracted from retired page, zero active imports | Orphaned |
| `components/admin/charts/DistributionPieChart.tsx` | Extracted from retired page, zero active imports | Orphaned |
| `components/admin/charts/HealthMetricCard.tsx` | Extracted from retired page, zero active imports | Orphaned |
| `components/admin/charts/index.ts` | Barrel export for orphaned charts | Orphaned |

## Files Deleted (Prior Passes)

| File | Reason | Pass |
|------|--------|------|
| `components/StrategyRoom/Form.tsx` | PascalCase duplicate, zero imports | Strategy Room Execution Command pass |
| `components/StrategyRoom/IntakeForm.tsx` | PascalCase duplicate, zero imports | Strategy Room Execution Command pass |

---

## Client-Side Admin API Key Risks Resolved

| File | Risk | Resolution |
|------|------|-----------|
| `CommandCenter.tsx` | `NEXT_PUBLIC_ADMIN_API_KEY` sent as Bearer token to `/api/admin/system-health`, `/api/admin/identity-audit`, `/api/admin/sync-fix` | DELETED — component was orphaned |
| `GovernanceLedger.tsx` | `NEXT_PUBLIC_ADMIN_API_KEY` sent as Bearer token to `/api/admin/governance-logs` | DELETED — component was orphaned |

**Remaining NEXT_PUBLIC_ADMIN_API_KEY usage:** Must be audited in remaining codebase. The deleted components were the primary consumers found in `components/admin/`.

---

## Static JSON Masquerading As Live Data

| File | Data Source | Resolution |
|------|-----------|-----------|
| `IntelDashboard.tsx` | `public/system/intel-audit-log.json` | DELETED — was pretending to be live audit stream |

---

## Admin Navigation Duplication

| File | Nav Definition | Status |
|------|---------------|--------|
| `components/admin/AdminLayout.tsx` | 6+ routes (Dashboard, Intelligence, Command Wall, PDF, Access) | CANONICAL — keep as primary |
| `components/admin/AdminSidebar.tsx` | Different routes (Dashboard, Campaigns, Reports, Settings) | DUPLICATE — different structure, should be retired or aligned |

**Recommendation:** AdminLayout navigation is canonical. AdminSidebar should be retired or aligned to match Operator Console section structure. Do not maintain two separate nav definitions.

---

## Duplicate Security Dashboards

| File | Status |
|------|--------|
| `components/admin/SecurityDashboard.tsx` | CANONICAL — imported by intelligence.tsx and command-wall.tsx |
| `components/admin/decision/SecurityDashboard.tsx` | REDUNDANT — 2-line re-export from canonical. Safe to delete in future cleanup. |

---

## Decision Components Status

10 of 11 decision components are actively used in Operator Console pages. 1 is a redundant re-export. All are classified KEEP. See `docs/product/admin-decision-components-audit.md`.

---

## Remaining Admin Risks

| Risk | Severity | Status |
|------|----------|--------|
| AdminSidebar nav conflicts with AdminLayout nav | LOW | Documented — consolidation recommended |
| `decision/SecurityDashboard.tsx` redundant re-export | LOW | Can be deleted in cleanup pass |
| `NEXT_PUBLIC_ADMIN_API_KEY` may exist elsewhere in codebase | MEDIUM | Primary consumers deleted; broader audit recommended |
| `public/system/intel-audit-log.json` still exists on disk | LOW | File is inert without IntelDashboard consuming it |
| 4 orphaned consulting/strategy components remain | LOW | Documented in strategy-room-consulting-component-reclassification.md — await approval to delete |

---

## Multi-User Sanitisation Requirements

These are now required before any sponsor-facing Control Room or enterprise campaign surface is treated as safe.

| Requirement | Why | Current status |
|-------------|-----|----------------|
| Organisation campaign state must be role-scoped | Sponsor and operator views are different products | NOT YET CANONICAL |
| Aggregation safety must be explicit in operator review | Anonymous and small-sample exposure can leak identity | PARTIAL |
| Divergence review must use sponsor-safe summaries | Raw respondent contradictions are not sponsor-safe | NOT YET CANONICAL |
| Respondent identity must stay hidden in anonymous mode | Core privacy rule | INCONSISTENT ACROSS PUBLIC ROUTES |
| Enterprise entitlements must not bypass privacy or admission | Paid upgrade is not a data disclosure override | NOT YET ENFORCED AT ORG SURFACE |
| Public campaign/report routes need containment | Current enterprise/team routes expose too much for premium multi-user use | OPEN RISK |

### Immediate consequence

Do not treat existing public campaign APIs as Control Room backends. They are operationally useful, but not sanitised enough for sponsor-facing multi-user intelligence.
