# Serverless Database Runtime

Canonical customer-state runtime uses Prisma over PostgreSQL. Local deterministic proof may use SQLite adapters, but production routes must consume composed store authorities that select Prisma/Postgres when `NODE_ENV=production`.

## Store Doctrine

- Production customer state: PostgreSQL through Prisma.
- Local/test deterministic proof: SQLite adapters may remain, guarded by `assertSqliteRuntimeAllowed()`.
- Production fallback: fail closed. A production route must not silently create or write `data/*.sqlite`.
- Route imports: runtime routes import `*.composed.ts`, not direct SQLite store modules.

## Current Production Store Authorities

- Operator Pilot intake/lifecycle: `OperatorPilotIntake` and `OperatorPilotTransition`.
- Signal consent continuation: `SignalConsentContinuation`.
- Corridor recommendation context: `CorridorRecommendationContext`.
- Demo funnel telemetry: `FunnelJourneyEvent`.

## Prisma Client Lifecycle

`lib/prisma.pages.ts` lazily creates a singleton Prisma client. In development/test it is cached on `global.__prisma_pages__` to avoid hot-reload connection multiplication. In production, serverless platforms should use the configured pooled `DATABASE_URL`; `DIRECT_URL` is reserved for migrations and direct administrative operations.

## Connection Guidance

- `DATABASE_URL` should target a pooler or serverless-safe PostgreSQL endpoint for runtime traffic.
- `DIRECT_URL` should target the direct database endpoint for Prisma migrations where required by the provider.
- Runtime routes should keep transactions short and avoid long-lived interactive transactions.
- Unique constraints and optimistic concurrency should be handled as explicit conflict responses, not retried blindly.
- Local `.env` values are non-secret development values and must not be reused as production credentials.

## Permanent Guards

- `tests/demo-journey/sqlite-runtime-guard.test.ts` proves local SQLite stores throw in `NODE_ENV=production`.
- `tests/runtime-hardening/serverless-route-store-boundaries.test.ts` proves production entrypoints do not import direct local SQLite stores for the migrated runtime paths.
- `tests/runtime-hardening/demo-runtime-prisma-stores.test.ts` proves the production Prisma adapters persist and retrieve state against PostgreSQL.