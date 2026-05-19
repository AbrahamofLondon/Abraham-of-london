# Market Intelligence Lifecycle Policy

Quarterly Global Market Intelligence reports are governed by `lib/intelligence/market-intelligence-lifecycle.ts`.

1. Reports cannot be retired by page copy.
2. Retirement must be performed by changing `lifecycleState` in the registry.
3. `ACTIVE_UNTIL_SUPERSEDED` reports remain purchasable until replaced.
4. `SUPERSEDED` reports may remain available as archive/reference products only if explicitly configured.
5. `DRAFT` reports must not be purchasable.
6. Copy must render lifecycle labels from the registry where possible.
7. No agent should use "archived", "retired", "expired", or "not a live paid unlock" unless the lifecycle registry says so.
