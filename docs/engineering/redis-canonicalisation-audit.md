# Redis Canonicalisation Audit

Date: 2026-05-09

## Recommendation

- `lib/redis.ts` is the canonical Node/server Redis entrypoint.
- `lib/redis-edge.ts` is the edge-compatible entrypoint.
- Do not add new imports to `lib/redis-safe.ts`, `lib/redis/index.ts`, `lib/redis/client.ts`, `lib/server/redis.ts`, or `lib/server/redis-unified.ts`.

## Classification

| File | Classification | Active usage | Notes |
| --- | --- | --- | --- |
| `lib/redis.ts` | `CANONICAL_KEEP` | Active via `app/api/v2/health/route.ts`, `lib/vault-engine.ts`, `lib/server/security/persistent-rate-limit.ts`, `lib/auth/*`, `lib/server/cache.ts`, `pages/api/health.ts` | Primary `ioredis` singleton used by current runtime code. |
| `lib/redis-edge.ts` | `EDGE_KEEP` | Active via `lib/resilience/kv-store.ts` | Edge-safe Upstash/memory adapter. |
| `lib/redis-safe.ts` | `LEGACY_IMPORT_STILL_ACTIVE` | Active via `pages/api/admin/system-health.ts` | Memory-only shim. Useful for diagnostics, not a production canonical client. |
| `lib/server/redis.ts` | `UNKNOWN_REQUIRES_REVIEW` | No active imports found | Clean Node-only lazy client, but currently unused and redundant with `lib/redis.ts`. |
| `lib/server/redis-unified.ts` | `UNKNOWN_REQUIRES_REVIEW` | No active imports found | Wrapper over `lib/redis.ts`; unused. |
| `lib/server/rate-limit-unified-redis.ts` | `UNKNOWN_REQUIRES_REVIEW` | No active imports found | Placeholder-only file; see rate-limit audit for bypass risk. |
| `lib/redis/index.ts` | `LEGACY_IMPORT_STILL_ACTIVE` | Active indirectly via `@/lib/redis/health-check` | Alternate Redis stack under `lib/redis/*`; should not become the main path. |
| `lib/redis/client.ts` | `LEGACY_IMPORT_STILL_ACTIVE` | Active via `lib/redis/index.ts` and `lib/redis/health-check.ts` | Separate singleton/config path. Duplicates `lib/redis.ts`. |
| `lib/redis/health-check.ts` | `LEGACY_IMPORT_STILL_ACTIVE` | Active via `app/api/vault/status/route.ts` | Diagnostics wrapper over `lib/redis/client.ts`. |
| `lib/redis-enhanced.DEPRECATED.ts` | `DEPRECATED_SAFE_TO_DELETE` | No active imports found | Thin forwarder to `./redis`. |
| `lib/redis-enhanced.edge.DEPRECATED.ts` | `DEPRECATED_SAFE_TO_DELETE` | No active imports found | Thin forwarder to `./redis`. |
| `lib/redis-enhanced.node.DEPRECATED.ts` | `DEPRECATED_SAFE_TO_DELETE` | No active imports found | Thin forwarder to `./redis`. |
| `lib/redis-fallback.DEPRECATED.ts` | `DEPRECATED_SAFE_TO_DELETE` | No active imports found | Thin forwarder to `./redis`. |
| `lib/redis-wrapper.DEPRECATED.ts` | `DEPRECATED_SAFE_TO_DELETE` | No active imports found | Thin forwarder to `./redis`. |
| `lib/server/redis.DEPRECATED.ts` | `DEPRECATED_SAFE_TO_DELETE` | No active imports found | Older Upstash/memory helper. |

## Action

- Keep `lib/redis.ts` and `lib/redis-edge.ts`.
- Treat `lib/redis-safe.ts` and `lib/redis/*` as transitional diagnostics/compat layers.
- Review whether `app/api/vault/status/route.ts` and `pages/api/admin/system-health.ts` should be migrated onto `lib/redis.ts`-based health helpers before deleting the alternate stack.

## Safe deletion commands after final confirmation

```powershell
git rm lib/redis-enhanced.DEPRECATED.ts
git rm lib/redis-enhanced.edge.DEPRECATED.ts
git rm lib/redis-enhanced.node.DEPRECATED.ts
git rm lib/redis-fallback.DEPRECATED.ts
git rm lib/redis-wrapper.DEPRECATED.ts
git rm lib/server/redis.DEPRECATED.ts
```
