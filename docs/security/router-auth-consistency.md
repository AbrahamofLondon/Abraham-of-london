# Router Auth Consistency

Updated: 2026-05-07

This document records the active split between Pages Router and App Router protected surfaces so divergence can be reduced deliberately rather than accidentally.

| Route family | Router | Primary auth helper | Ownership check | Rate limit | Status |
|---|---|---|---|---|---|
| `/app/api/downloads/[slug]` | App | `resolveIdentity` + canonical entitlement authority | asset entitlement, not object ownership | route-local | canonical |
| `/pages/api/downloads/resolve/*` | Pages | `getInnerCircleAccess` | no object ownership, access-tier resolution only | legacy/local | legacy |
| `/pages/inner-circle/reports/[ref]` | Pages | session context + diagnostics report access assertion | yes | page-level only | legacy but hardened |
| `/app/api/user/delete` | App | signed action token or owner identity | yes | `enforceAppRouteRateLimit` | canonical |
| `/app/api/user/unsubscribe` | App | signed action token or owner identity | yes | `enforceAppRouteRateLimit` | canonical |
| `/api/admin/*` | mixed | proxy + server helpers + some header/key-based legacy flows | varies | mixed | split |
| `/api/strategy-room/*` | mixed | mixed session/token helpers | some surfaces | mixed | split |

## Current exploitable divergence under review

- legacy admin/header key paths
- download token families with different secret loaders
- legacy pages download resolvers vs canonical app download delivery
- bypass-capable perimeter logic in non-root proxy helpers

## Freeze rule

Until the auth model is fully unified, any new protected route should declare:

1. router type
2. auth helper
3. ownership rule
4. entitlement rule
5. rate-limit rule
6. legacy/canonical status
