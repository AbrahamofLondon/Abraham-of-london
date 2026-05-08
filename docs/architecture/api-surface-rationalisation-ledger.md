# API Surface Rationalisation Ledger

Generated: 2026-05-07

This ledger covers overlapping or duplicated API authority, including exact compatibility shims and near-duplicate surfaces that serve the same business function. No routes are removed in this pass.

| Surface | File | Classification | Recommended Canonical | Notes |
| --- | --- | --- | --- | --- |
| `/api/strategy-room/execution-record` | `app/api/strategy-room/execution-record/route.ts` | `canonical` | `/api/strategy-room/execution-record` | Canonical persistence endpoint for execution records. |
| `/api/strategy-room/execution/locked-record` | `app/api/strategy-room/execution/locked-record/route.ts` | `compatibility wrapper` | `/api/strategy-room/execution-record` | Legacy payload shape persists into the canonical execution-record store. Keep until all callers are confirmed migrated. |
| `/api/auth/sovereign` | `app/api/auth/sovereign/route.ts` | `canonical` | `/api/auth/sovereign` | Main sovereign auth endpoint. |
| `/api/auth/sovereign-login` | `pages/api/auth/sovereign-login.ts` | `legacy safe redirect` | `/api/auth/sovereign` | Explicit forward-only shim. `POST` returns 307 with migrated payload; other methods return 410. |
| `/api/sovereign/auth` | `app/api/sovereign/auth/route.ts` | `compatibility wrapper` | `/api/auth/sovereign` | Pure re-export alias to the canonical sovereign auth route. |
| `/api/billing/checkout` | `pages/api/billing/checkout.ts` | `canonical` | `/api/billing/checkout` | Current production checkout authority used by live commercial clients. |
| `/api/checkout` | `app/api/checkout/route.ts` | `compatibility wrapper` | `/api/billing/checkout` | In production it returns a 308-style canonical handoff response pointing clients at `/api/billing/checkout`. Keep until checkout callers are unified. |
| `/api/admin/inner-circle/export` | `pages/api/admin/inner-circle/export.ts` | `canonical` | `/api/admin/inner-circle/export` | Real protected export surface with admin header gate and audit path. |
| `/api/admin/inner-circle/export/route` | `pages/api/admin/inner-circle/export/route.ts` | `deletion candidate` | `/api/admin/inner-circle/export` | Structurally odd pages-router path that only returns 404. Keep flagged until references are confirmed absent. |
| `/api/v2/health` | `app/api/v2/health/route.ts` | `canonical` | `/api/v2/health` | Canonical public/system health surface. |
| `/api/admin/system-health` | `pages/api/admin/system-health.ts` | `unresolved` | `/api/v2/health` for public status, `/api/admin/system-health` for privileged diagnostics | Not a literal duplicate path, but an overlapping health authority. Retain both only if the admin surface exposes materially richer protected diagnostics. |

## Summary

- Exact route-path duplication is currently low.
- The main rationalisation need is legacy compatibility and overlapping authority, not collisions in the router.
- The highest-confidence cleanup candidates are shim retirement paths after reference confirmation:
  - `/api/strategy-room/execution/locked-record`
  - `/api/auth/sovereign-login`
  - `/api/sovereign/auth`
- The highest-risk unresolved surface is the split checkout authority between `/api/billing/checkout` and `/api/checkout`.
