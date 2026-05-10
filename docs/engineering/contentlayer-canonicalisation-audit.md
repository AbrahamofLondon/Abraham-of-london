# Contentlayer Canonicalisation Audit

Date: 2026-05-09

## Recommendation

- Server canonical: `lib/contentlayer-helper.ts`
- Client-safe canonical: `lib/contentlayer-client.ts`
- Compatibility barrel `lib/contentlayer.ts` remains active and should stay until controlled migrations complete.

## Classification

| File | Classification | Active usage | Notes |
| --- | --- | --- | --- |
| `lib/contentlayer-helper.ts` | `SERVER_CANONICAL` | Active across Pages sitemap routes, content server helpers, health checks | Narrow per-kind loader with build-stability logic. |
| `lib/contentlayer-client.ts` | `CLIENT_SAFE` | Active via `lib/content/pages.ts` | Browser-safe fallback reader. |
| `lib/contentlayer-compat.ts` | `COMPAT_TEMPORARY` | Active via `lib/content/real.ts`, `lib/imports.ts` | Transitional wrapper over `lib/contentlayer.ts`. |
| `lib/contentlayer-compat.server.ts` | `COMPAT_TEMPORARY` | No active imports found | Thin alias retained for script/codemod compatibility. |
| `lib/contentlayer-helper.server.ts` | `COMPAT_TEMPORARY` | No active runtime imports found | Empty stub kept because scripts still reference the path. |
| `lib/contentlayer.ts` | `COMPAT_TEMPORARY` | Active in pages, lib/content, sitemaps, tests | Build-safe barrel still used widely. |
| `lib/contentlayer-generated.ts` | `RISKY_IMPORT` | Active in `lib/contentlayer/data.ts` and `lib/contentlayer/status.ts` | Re-exports the barrel; avoid new imports. |
| `lib/contentlayer-assert.ts` | `SERVER_CANONICAL` | Active in `pages/debug/content.tsx` | Server assertion helper via `@/lib/content/server`. |
| `lib/contentlayer-guards.ts` | `CLIENT_SAFE` | No direct imports found | Small runtime stub; safe in browser. |
| `lib/contentlayer-client-safe.js` | `CLIENT_SAFE` | No direct imports found | Browser-safe empty fallback. |

## Backbone route safety

- No changes were made to `/canon`, `/library`, `/books`, `/vault`, `/frameworks`, `/intelligence`, `/intelligence/market`, `/intelligence/reports`, `/evidence`, `/evidence/standards`, or `/evidence/seals`.
- This pass only documented and guarded the import boundaries around the existing loaders.
