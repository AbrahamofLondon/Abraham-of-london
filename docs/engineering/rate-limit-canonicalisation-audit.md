# Rate-Limit Canonicalisation Audit

Date: 2026-05-09

## Recommendation

- Canonical server implementation: `lib/server/rate-limit-unified.ts`
- Canonical edge implementation: `lib/server/rate-limit-edge.ts`
- Keep `lib/server/rateLimit.ts` and `lib/server/rate-limit.ts` only as compatibility bridges while Pages API imports are migrated deliberately.

## Classification

| File | Classification | Active usage | Notes |
| --- | --- | --- | --- |
| `lib/server/rate-limit-unified.ts` | `CANONICAL_SERVER` | Active across Pages API routes and `lib/server/*` | Current authoritative path with persistent Redis/Postgres-backed checks. |
| `lib/server/rate-limit-edge.ts` | `CANONICAL_EDGE` | Re-exported by `lib/rate-limit/edge.ts` and `lib/server/rateLimit-edge.ts` | Edge-safe Upstash implementation. |
| `lib/server/rateLimit.ts` | `LEGACY_COMPAT` | Active in `pages/api/contact.ts`, `pages/api/newsletter.tsx`, `pages/api/shorts/*`, `lib/inner-circle/rate-limit.ts` | Memory-only Pages-era API limiter. Keep until those routes are migrated. |
| `lib/server/rate-limit.ts` | `LEGACY_COMPAT` | Re-export only | Alias to `lib/server/rateLimit.ts`. |
| `lib/server/rateLimit-edge.ts` | `LEGACY_COMPAT` | Re-export only | Bridge to `lib/server/rate-limit-edge.ts`. |
| `lib/server/rateLimit.d.ts` | `LEGACY_COMPAT` | Type-only compat | Retain while `@/lib/server/rateLimit` import surface remains. |
| `lib/rate-limit.ts` | `LEGACY_COMPAT` | Active in `components/ui/InteractionPanel.tsx` | Client-safe UX wrapper; not appropriate for API/server enforcement. |
| `lib/rate-limit/index.ts` | `LEGACY_COMPAT` | Re-export surface | Mirrors client-safe wrapper. |
| `lib/rate-limit/edge.ts` | `LEGACY_COMPAT` | Re-export surface | Mirrors canonical edge implementation. |
| `lib/rate-limit-unified.ts` | `DEPRECATED_SAFE_TO_DELETE` | No runtime imports; lint config string only | Throws immediately and exists only as a sentinel. |
| `lib/rate-limit-redis.ts` | `DANGEROUS_BYPASS` | No active imports found | Mock implementation always allows. Do not route production traffic through it. |
| `lib/server/rate-limit-unified-redis.ts` | `DANGEROUS_BYPASS` | No active imports found | Placeholder `check()` always allows. Remove or replace before any usage. |
| `lib/security/rate-limit-unified.ts` | `DEPRECATED_SAFE_TO_DELETE` | No active imports found | Older in-memory implementation, superseded by `lib/server/rate-limit-unified.ts`. |

## Guardrail result

- No public API route lost rate limiting in this pass.
- Existing public route imports still resolve to either `lib/server/rate-limit-unified.ts` or `lib/server/rateLimit.ts`.

## Follow-up migration targets

- Migrate remaining `@/lib/server/rateLimit` imports onto `@/lib/server/rate-limit-unified`.
- Delete `lib/rate-limit-redis.ts`, `lib/server/rate-limit-unified-redis.ts`, and `lib/security/rate-limit-unified.ts` only after confirming zero runtime imports in CI.
