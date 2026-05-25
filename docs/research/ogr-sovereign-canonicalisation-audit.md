# OGR Sovereign Flow — Canonicalisation Audit
**Date:** 2026-05-25
**Agent:** 2A Closure Pass — Workstream 1
**Decision:** Option A — OGR remains a separate experiment

---

## Decision Rationale

The OGR Sovereign Flow is a separate product experiment (Organisational Governance Rating) that pre-dates the Intelligence Foundry. It has:
- 13+ active consumers across auth, dashboard, navigation, and report components
- Its own state management (`useOGRStore`), auth (`lib/ogr/server-auth`), and config (`lib/ogr/client-config`)
- No overlap with Foundry ResearchRun persistence or engine adapters

**Option A was chosen:** OGR files remain in their current locations with explicit LEGACY/EXPERIMENTAL headers. Absorption into Foundry Reference Models (Option B) would require a dedicated OGR→Foundry migration pass that is out of scope here.

---

## File Classification

### Routes

| File | Classification | Action |
|------|---------------|--------|
| `app/testing/lab/page.tsx` | REDIRECTED | Redirects to `/admin/intelligence-foundry` |
| `app/testing/layout.tsx` | KEPT | Auth guard retained for redirect path |
| `app/admin/research/page.tsx` | REDIRECTED | Redirects to `/admin/intelligence-foundry` |
| `app/api/sovereign/report/route.ts` | ACTIVE_OGR_FLOW | OGR header added |
| `app/api/sovereign/auth/route.ts` | ACTIVE_OGR_FLOW | OGR header added |
| `app/api/sovereign/logout/route.ts` | ACTIVE_OGR_FLOW | OGR header added |

### Components

| File | Classification | Action |
|------|---------------|--------|
| `components/analysis/StrategicStressWorkbench.tsx` | DEPRECATE | DEPRECATED header added; cannot delete — imported by OGR sovereign flow |
| `components/analysis/ComparisonDelta.tsx` | DEPRECATE | DEPRECATED header added; superseded by `components/research/ComparisonDelta.tsx` |
| `components/debug/FormulaInspector.tsx` | DEPRECATE | DEPRECATED header added; superseded by `components/research/FormulaInspector.tsx` |
| `components/analysis/_archive/OGRStressTest.legacy.tsx` | DELETED | No active imports — removed |
| `components/analysis/_archive/HistorySidebar.legacy.tsx` | DELETED | No active imports — removed |

### Store

| File | Classification | Action |
|------|---------------|--------|
| `store/useOGRStore.ts` | ACTIVE_OGR_FLOW | DEPRECATED header added; 10 active consumers in sovereign flow — cannot delete |

### Libraries

| File | Classification | Action |
|------|---------------|--------|
| `lib/ogr/manifest-engine.ts` | REFERENCE_MODEL | DEPRECATED header added |
| `lib/ogr/manifest-engine.test.ts` | REFERENCE_MODEL | Tests for reference engine |
| `lib/ogr/simulation-engine.ts` | REFERENCE_MODEL | DEPRECATED header added |
| `lib/ogr/server-auth.ts` | ACTIVE_OGR_FLOW | DEPRECATED header added; imported by sovereign report route |
| `lib/ogr/client-config.ts` | ACTIVE_OGR_FLOW | DEPRECATED header added; imported by sovereign auth pages |

---

## Boundary Enforcement

### Rule
No Foundry file imports OGR/lab code. OGR files may not import canonical Foundry components unless explicitly migrated.

### Grep Audit Results
*(See boundary audit output below — run: `Select-String -Path **/*.ts,**/*.tsx -Pattern "StrategicStressWorkbench|useOGRStore|components/debug/FormulaInspector|lib/ogr/server-auth" | Where-Object { $_.Path -match "components/research|lib/research|app/admin/intelligence-foundry" }`)*

**Result: CLEAN — No Foundry files import OGR/lab code.**

All OGR imports are confined to:
- `app/api/sovereign/*` (OGR sovereign flow)
- `components/auth/*` (OGR auth components)
- `components/navigation/*` (OGR navigation)
- `components/reports/*` (OGR reporting)
- `components/alignment/*` (OGR alignment)
- `hooks/useOGRTelemetry.ts` (OGR telemetry)
- `pages/sovereign/*` (OGR sovereign pages)
- `app/dashboard/controls.tsx` (dashboard — references OGR store)
- `tests/ogr-core.test.ts` (OGR test suite)

---

## OGR Sovereign Flow — Required Headers

All OGR sovereign flow files must carry:
```
/**
 * OGR SOVEREIGN FLOW — LEGACY/EXPERIMENTAL
 * Not part of canonical Intelligence Foundry.
 * Do not import from Foundry modules.
 */
```

**Status:** Added to `app/api/sovereign/report/route.ts`, `app/api/sovereign/auth/route.ts`, `app/api/sovereign/logout/route.ts`.

---

## What Remains for a Full OGR Deprecation Pass

This audit closes the Foundry canonicalisation boundary. A complete OGR deprecation would additionally require:

1. Migrate `useOGRStore` consumers to a non-OGR state approach
2. Retire `app/api/sovereign/*` behind a deprecation notice
3. Remove `lib/ogr/server-auth.ts` and `lib/ogr/client-config.ts` after consumer migration
4. Archive `components/analysis/StrategicStressWorkbench.tsx` and `components/debug/FormulaInspector.tsx`

That work is **out of scope for the Foundry** and should be tracked as a separate OGR deprecation issue.
