# Intelligence IP Containment Register

Date: 2026-05-09

| Component | Classification | Current imports | Allowed surfaces | Action taken |
|---|---|---|---|---|
| `DecisionTracePanel` | `INTERNAL_ONLY` | none | none | Added `INTERNAL_ONLY` warning comment. No public/admin runtime use. |
| `DeterminismProof` | `INTERNAL_ONLY` | none | none | Added `INTERNAL_ONLY` warning comment. No public/admin runtime use. |
| `SpineRenderer` | `INTERNAL_ONLY` | none | none | Added `INTERNAL_ONLY` warning comment. No public/admin runtime use. |
| `KnowledgeGraph` | `ADMIN_ONLY` | `pages/admin/intelligence.tsx`, `pages/admin/command-wall.tsx`, `components/admin/decision/KnowledgeGraph.tsx` re-export | admin-only | Added `ADMIN_ONLY` warning comment. Existing route gating already limits exposure. |
| `DiscoveryOverlay` | `ADMIN_ONLY` | `pages/admin/command-wall.tsx` | admin-only | Added `ADMIN_ONLY` warning comment. Existing route gating already limits exposure. |

## Current Import Boundary

Runtime audit result:

- No public route currently imports `DecisionTracePanel`, `DeterminismProof`, or `SpineRenderer`.
- `KnowledgeGraph` and `DiscoveryOverlay` are reachable only from admin routes already guarded by:
  - `requireAdminPage(...)`
  - proxy-level `/admin` / `/api/admin` admin checks

## Why This Still Needed Hardening

The route boundary was already safe.
The import boundary was not explicit enough because these files still lived under `components/Intelligence/*`, which makes them look reusable and product-safe.

## Residual Risk

Still partial:

- The files remain under `components/Intelligence/*`.
- A future developer could still import them into a user route by mistake.

## Recommended Next Step

P1:

- Move admin/internal intelligence components into an explicitly private namespace such as:
  - `components/admin/intelligence/*`
  - `components/internal/intelligence/*`

P1:

- Add lint/import restrictions so non-admin code cannot import:
  - `DecisionTracePanel`
  - `DeterminismProof`
  - `SpineRenderer`
  - `KnowledgeGraph`
  - `DiscoveryOverlay`

