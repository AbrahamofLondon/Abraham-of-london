# Prisma Client Canonicalisation Audit

Date: 2026-05-09

## Recommendation

- Actual singleton implementation: `lib/prisma.pages.ts`
- Stable import surfaces to keep for now:
  - `@/lib/prisma` for Pages Router and legacy shared server code
  - `@/lib/prisma.server` for App Router server routes/actions
- Avoid direct imports of `@/lib/prisma.pages` and `@/lib/server/prisma` in new code.
- None of the current Prisma entrypoints are safe for Edge.

## Files

| File | Runtime target | Importers | Safe for Pages Router | Safe for App Router | Safe for Edge | Server-only protection exists | Canonical recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `lib/prisma.pages.ts` | Node server only; lazy singleton | 4 direct importers plus re-exported by every public Prisma entrypoint | Yes | Yes, if route/page is Node runtime and dynamic | No | No | `CANONICAL_IMPLEMENTATION_KEEP` |
| `lib/prisma.ts` | Pages/legacy compat alias to `prisma.pages` | Heavily used across `pages/api/*`, `lib/*`, selected `app/*` | Yes | Works, but naming is misleading for App Router | No | No | `CANONICAL_IMPORT_SURFACE_KEEP` |
| `lib/prisma.server.ts` | App/server compat alias to `prisma.pages` | Heavily used across `app/api/*`, admin pages, server utilities | Yes, but misleading | Yes | No | No | `CANONICAL_IMPORT_SURFACE_KEEP` |
| `lib/server/prisma.ts` | Legacy re-export to `prisma.pages` | 6 direct importers | Yes | Yes | No | No | `LEGACY_COMPAT_MIGRATE_AWAY` |

## Findings

- The repo does not currently maintain multiple live Prisma client instances. All audited entrypoints converge on `lib/prisma.pages.ts`.
- The main risk is import-surface ambiguity, not runtime duplication.
- `lib/prisma.server.ts` does not use `server-only`, because Pages Router compatibility was prioritized. That means there is no hard build-time guard against accidental client import.
- Existing repo policy already treats Prisma as server-only, but enforcement is partly convention-based.

## Residual risk

- Pages Router pages can top-level import Prisma aliases without a hard server-only boundary.
- App Router code imports both `@/lib/prisma` and `@/lib/prisma.server`; that inconsistency is maintainability debt, not evidence of multiple clients.

## Import surface notes

- `@/lib/prisma` remains the most widespread legacy surface.
- `@/lib/prisma.server` is the main App Router-facing surface.
- `@/lib/prisma.pages` and `@/lib/server/prisma` should be reduced to zero direct imports over time.
