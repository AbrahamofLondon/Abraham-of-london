# Public Intelligence DTO Closure Report

## Routes updated with shared intelligence envelope

- [pages/api/decision-centre/cases.ts](/C:/aol-check-visual/pages/api/decision-centre/cases.ts)
- [app/api/strategy-room/session/init/route.ts](/C:/aol-check-visual/app/api/strategy-room/session/init/route.ts)
- [app/api/executive-reporting/run/route.ts](/C:/aol-check-visual/app/api/executive-reporting/run/route.ts)
- [app/api/decision/guidance/route.ts](/C:/aol-check-visual/app/api/decision/guidance/route.ts)
- [pages/api/checkpoints/respond.ts](/C:/aol-check-visual/pages/api/checkpoints/respond.ts)
- [pages/api/outcomes/verify.ts](/C:/aol-check-visual/pages/api/outcomes/verify.ts)
- [pages/api/counsel/intake.ts](/C:/aol-check-visual/pages/api/counsel/intake.ts)

## Added envelope fields

- `scope`
- `provenance`
- `dataQuality`
- `evidencePosture`
- `emptyState` where thin/empty applies

## Closure status

- `decision-centre/cases`: PASS for shared intelligence envelope and case-level scope.
- `strategy-room/session/init`: PASS for envelope; canonical session payload still includes legacy content blocks outside this pass.
- `decision/guidance`: PASS for envelope.
- `checkpoints/respond`: PASS for response provenance.
- `outcomes/verify`: PASS for response provenance.
- `counsel/intake`: PASS for response provenance.
- `executive-reporting/run`: PASS. Public return has been reduced to `ok`, `runKey`, `checkpointId`, and `result: ExecutiveReportingPublicResult`. Broad legacy `canonical`, `viewModel`, `diagnostics`, `entitlements`, and raw intake payloads no longer cross the public boundary.

## Executive Reporting closure evidence

- Audit: [docs/product/executive-reporting-public-payload-audit.md](/C:/aol-check-visual/docs/product/executive-reporting-public-payload-audit.md)
- DTO module: [lib/product/executive-reporting-public-dto.ts](/C:/aol-check-visual/lib/product/executive-reporting-public-dto.ts)
- Route: [app/api/executive-reporting/run/route.ts](/C:/aol-check-visual/app/api/executive-reporting/run/route.ts)
- UI consumer: [pages/diagnostics/executive-reporting/run.tsx](/C:/aol-check-visual/pages/diagnostics/executive-reporting/run.tsx)
- Guard: [scripts/public-dto-guard.mjs](/C:/aol-check-visual/scripts/public-dto-guard.mjs)

## Exclusions

- This pass did not redesign report-generation payload contracts.
- No new internal graph/kernel detail was added to the touched DTOs.
