# ADR — Prisma migration-history reconciliation (IMPLEMENTED)

**Status:** Implemented and proven on real PostgreSQL 15.18 (fresh-install + existing-DB
paths, both exit 0).

## Observed problem (reproduced)
On a genuinely empty PostgreSQL database, `prisma migrate deploy` failed at
`20260422_add_diagnostic_evidence_graph` with **P3018 / 42P01
`relation "DiagnosticJourney" does not exist`**.

## Root cause
The tracked history was **not a complete from-empty history**. `schema.prisma` defines
**221 models**, but the 54 tracked migrations only `CREATE` ~90 tables; **131 tables**
entered via an untracked `prisma db push` baseline that was applied incrementally
alongside migrations (the pre-first-migration schema had only 80 models, so the untracked
baseline was itself spread across many `db push` points — there was no single clean
historical baseline to reconstruct). P3018 exposed only the 3 later-FK-referenced baseline
tables; a static validator also found a `RetainedDecision` ordering defect.

Because the baseline was scattered and 131 tables deep, per-table "bridge" migrations were
not a safe or tractable reconstruction. The Prisma-canonical remedy for a `db push`-drifted
history was used instead.

## Implemented strategy — squashed baseline
1. Generated the full canonical schema DDL: `prisma migrate diff --from-empty
   --to-schema-datamodel prisma/schema.prisma --script` — verified to apply cleanly to an
   empty database (221 tables, exit 0).
2. Wrote it as a single first migration `prisma/migrations/00000000000000_baseline/migration.sql`.
   It creates every table first, then adds every foreign key — so it is internally
   coherent (0 referenced-before-created).
3. **Archived** (did not delete) the 54 incremental migrations to
   `prisma/_archived-migrations-pre-baseline/` — fully reversible via git; retained as the
   historical record and for any environment that needs the old chain.
4. `migration_lock.toml` retained (provider = postgresql).

## Proven — fresh install (§6)
Empty DB → `prisma migrate deploy` → **exit 0**; `_prisma_migrations` records
`00000000000000_baseline` as applied; `prisma migrate status` → "Database schema is up to
date!"; 221 tables present. No `prisma db push` used.

## Proven — existing database (§7)
A database already containing the schema (representing a db-pushed/previously-migrated
environment) → `prisma migrate resolve --applied 00000000000000_baseline` → `prisma migrate
deploy` → **"No pending migrations to apply"** (clean no-op, exit 0). No data touched.

## Production boundary
Both paths proven on **local disposable** PostgreSQL only. Production reconciliation
(running `migrate resolve --applied 00000000000000_baseline` against the production DB,
which already contains the schema) remains **owner-authorised** and was NOT executed. No
production DB mutation performed.

## Going-forward rule
Every schema change ships as a tracked migration from `prisma migrate dev`. No object may
become a migration dependency without an earlier tracked creation. Enforced permanently by
`tests/database/migration-history.test.ts` (fails on any referenced-before-created table;
now asserts **0**).

## Reversibility
To restore the incremental history: `git mv prisma/_archived-migrations-pre-baseline/2026*
prisma/migrations/` and delete `00000000000000_baseline`. Nothing was destroyed.
