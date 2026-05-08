# Admin Security Dashboard Consolidation

**Date:** 2026-05-08

---

## Files

| File | Purpose | Imports | Status |
|------|---------|---------|--------|
| `components/admin/SecurityDashboard.tsx` | Full security dashboard component with props | ACTIVE — imported by `pages/admin/intelligence.tsx`, `pages/admin/command-wall.tsx` | **CANONICAL** |
| `components/admin/decision/SecurityDashboard.tsx` | Re-export: `export { SecurityDashboard } from "@/components/admin/SecurityDashboard"` | Not directly imported anywhere (the canonical is imported directly) | **REDUNDANT** |

## Consolidation

The canonical component is `components/admin/SecurityDashboard.tsx`. The decision/ version is a 2-line re-export that adds no value. It can be deleted without impact since both consuming pages import from the canonical path directly.

**Recommendation:** Delete `components/admin/decision/SecurityDashboard.tsx` in a future cleanup pass after confirming no App Router page imports from the decision/ path.
