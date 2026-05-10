# Commercial / Access Server Boundary Audit

Date: 2026-05-09

## Summary

- Explicit client files were moved off `lib/access/tier-policy.ts` onto `lib/access/public.ts` in this pass.
- No explicit client file now imports Prisma, contentlayer server helpers, or the audited commercial server modules.
- Pages Router pages still import some commercial/access modules directly. That is a residual boundary weakness because Pages Router does not provide a hard `server-only` fence.

## Files

| File | Imported by client component? | Imported by page? | Imported by API/server only? | Risk level | Required correction |
| --- | --- | --- | --- | --- | --- |
| `lib/access/tier-policy.ts` | No explicit `use client` importers after this pass | Yes | Yes | Medium | Keep server canonical logic here. Route explicit client code through `lib/access/public.ts`. Review Pages Router page imports over time. |
| `lib/commercial/pricing-engine.ts` | No | No explicit public page importers found; used through server paths and asset helpers | Yes | Low | Keep server-only. Do not import from client-marked files. |
| `lib/commercial/entitlement-authority.ts` | No explicit `use client` importers found | Yes (`pages/strategy-room/index.tsx`, `pages/decision-instruments/[slug].tsx`, `pages/artifacts/[id].tsx`) | Yes | Medium | Prefer moving page-level entitlement resolution behind API/server loaders if these pages evolve toward heavier client execution. |
| `lib/commercial/entitlements.ts` | No | No | Yes | Low | Keep server-only. |
| `lib/commercial/payment-verification.ts` | No explicit `use client` importers found | Yes (`pages/decision-instruments/[slug].tsx`, `pages/artifacts/[id].tsx`) | Yes | Medium | Keep server-only and avoid new page-top-level imports where an API/server action is possible. |
| `lib/product/commercial-classification.ts` | No | No | No active imports found | Low | Leave as audit metadata only. |

## Residual notes

- `tier-policy.ts` remains broadly imported by server code and Pages Router content/access helpers.
- The highest-value guardrail is preventing explicit client files from reaching the server-only modules; that guard now exists in `scripts/infrastructure-boundary-guard.mjs`.
