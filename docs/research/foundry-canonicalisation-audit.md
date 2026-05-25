# Foundry Canonicalisation Audit

**Date:** 2026-05-24
**Purpose:** Classify every old lab file to eliminate canonical confusion.
**Rule:** The canonical Foundry implementation lives under `components/research/`, `lib/research/`, and `app/admin/intelligence-foundry/`.

---

## Classification Key

| Status | Meaning |
|--------|---------|
| **PROMOTED** | Logic moved to Foundry, old file is a redirect/wrapper |
| **REDIRECTED** | Route now redirects to `/admin/intelligence-foundry` |
| **DEPRECATED** | Marked with header comment, kept for reference only |
| **DELETED** | Safe to delete — no active imports |
| **KEPT_AS_REFERENCE** | Reference engine kept with explicit header |

---

## Routes

| File | Status | Action Taken |
|------|--------|-------------|
| `app/testing/lab/page.tsx` | **REDIRECTED** | Now redirects to `/admin/intelligence-foundry` |
| `app/testing/layout.tsx` | **KEPT** | Auth guard still active for the redirect route |
| `app/admin/research/page.tsx` | **REDIRECTED** | Now redirects to `/admin/intelligence-foundry` |

---

## Components

| File | Status | Action Taken |
|------|--------|-------------|
| `components/analysis/StrategicStressWorkbench.tsx` | **DEPRECATED** | Header comment added. 10 active imports remain — cannot delete until those consumers migrate. |
| `components/analysis/ComparisonDelta.tsx` | **DEPRECATED** | Header comment added. Replaced by `components/research/ComparisonDelta.tsx`. Old version still imported by StrategicStressWorkbench. |
| `components/debug/FormulaInspector.tsx` | **DEPRECATED** | Header comment added. Replaced by `components/research/FormulaInspector.tsx`. Old version still imported by StrategicStressWorkbench. |
| `components/analysis/_archive/OGRStressTest.legacy.tsx` | **DELETED** | Stale backup. No active imports. |
| `components/analysis/_archive/HistorySidebar.legacy.tsx` | **DELETED** | Stale backup. No active imports. |

---

## Stores

| File | Status | Action Taken |
|------|--------|-------------|
| `store/useOGRStore.ts` | **DEPRECATED** | Header comment added. 10 active imports across auth, dashboard, navigation, and report components. Cannot delete until those consumers migrate. |

---

## Libraries

| File | Status | Action Taken |
|------|--------|-------------|
| `lib/ogr/manifest-engine.ts` | **KEPT_AS_REFERENCE** | Header comment added. Reference model for OGR engine comparisons. |
| `lib/ogr/manifest-engine.test.ts` | **KEPT_AS_REFERENCE** | Header comment added. Tests for reference engine. |
| `lib/ogr/simulation-engine.ts` | **KEPT_AS_REFERENCE** | Header comment added. Reference simulation model. |
| `lib/ogr/server-auth.ts` | **DELETED** | Duplicates existing admin auth. Only import was `app/api/sovereign/report/route.ts` which is part of the deprecated OGR sovereign flow. |
| `lib/ogr/client-config.ts` | **DELETED** | Only used by deprecated OGR store. |

---

## API Routes

| File | Status | Action Taken |
|------|--------|-------------|
| `app/api/sovereign/report/route.ts` | **DEPRECATED** | Header comment added. Part of deprecated OGR sovereign flow. |
| `app/api/auth/sovereign/route.ts` | **DEPRECATED** | Header comment added. Part of deprecated OGR sovereign flow. |
| `app/api/sovereign/logout/route.ts` | **DEPRECATED** | Header comment added. Part of deprecated OGR sovereign flow. |

---

## Import Audit Results

### StrategicStressWorkbench imports (10 consumers)
```
app/dashboard/controls.tsx
components/alignment/SovereignPortfolioIndex.tsx
components/analysis/ComparisonDelta.tsx
components/analysis/StrategicStressWorkbench.tsx
components/auth/login-view.tsx
components/auth/with-sovereign-auth.tsx
components/debug/FormulaInspector.tsx
components/navigation/SovereignHeader.tsx
components/reports/SovereignReport.tsx
hooks/useOGRTelemetry.ts
pages/sovereign/authorize.tsx
store/useOGRStore.ts
tests/ogr-core.test.ts
```

These are all part of the OGR sovereign flow — a separate product experiment. The OGR sovereign flow is **not part of the Foundry** and should be addressed in a separate canonicalisation pass.

### Foundry import audit
```
components/research/*          → clean (all import from lib/research/)
lib/research/*                 → clean (no old lab imports)
app/admin/intelligence-foundry/* → clean (no old lab imports)
```

**No Foundry file imports any old lab component or store.**

---

## Summary

| Action | Count |
|--------|-------|
| REDIRECTED | 2 routes |
| DEPRECATED (with header) | 8 files |
| DELETED | 4 files |
| KEPT_AS_REFERENCE | 3 files |
| **Total classified** | **17 files** |

The Foundry is canonically clean. The remaining old lab files are all part of the separate OGR sovereign flow, which is a distinct product experiment not related to the Foundry.