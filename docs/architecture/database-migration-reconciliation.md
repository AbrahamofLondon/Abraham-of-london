# ADR — Prisma migration-history reconciliation

**Status:** Root cause proven on a real empty Postgres; **the corrected strategy is a full
baseline, not a narrow bridge**. Baseline migration NOT yet authored (large, iterative —
next task).

## Observed problem (reproduced)
On a genuinely **empty** PostgreSQL 15.18 database (`aol_migcheck1`), `prisma migrate deploy`
fails at `20260422_add_diagnostic_evidence_graph` with **P3018 / 42P01
`relation "DiagnosticJourney" does not exist`**.

## Root cause — bigger than P3018
The migration history is **not a complete from-empty history**. `schema.prisma` defines
**221 models**, but the 54 tracked migrations only `CREATE` **~90 tables**. **131 schema
tables are created by no tracked migration** — they entered via an untracked
`prisma db push` baseline. P3018 exposes only the **3 of those 131 that a later migration
FK-references** (`DiagnosticJourney`, `Organisation`, `research_runs`). There is also **1
ordering defect** (`RetainedDecision` — created by a migration but FK-referenced by an
earlier one).

**Consequence:** fixing only the 3 FK-exposed tables makes `migrate deploy` exit 0 but
produces a fresh database **missing ~128 tables**. A "narrow 3-table bridge" is therefore
**incorrect**. Evidence: `artifacts/validation/database/migration-history-audit.json`,
`untracked-baseline-tables.txt` (131), and the static validator
`tests/database/migration-history.test.ts`.

## Correct fresh-install strategy — full baseline
Author ONE baseline migration, timestamped **before** the earliest tracked migration
(`20260413…`), that creates the **entire pre-migration state** (the 131 untracked tables),
then let the 54 existing migrations evolve from there. Two hard complications must be
handled — this is why it is iterative, not a one-shot diff:

1. **Historical shape, not current shape.** Baseline tables that later migrations `ALTER`
   must be created in their PRE-alter shape. Example: `DiagnosticJourney` — `20260423`
   adds `userId, organisationKey, diagnosticType, parentJourneyId, monitoringCadence,
   startedAt, completedAt`; the baseline must create it WITHOUT those 7 columns or the
   `ALTER … ADD COLUMN` collides. A blanket `migrate diff --from-empty
   --to-schema-datamodel` uses CURRENT shape and WILL collide — hence forbidden.
   The correct source is the **git-historical `schema.prisma` as of just before
   `20260413`**.
2. **FK ordering.** Baseline tables have FKs among themselves and to the 90
   migration-created tables. A baseline placed first cannot FK to a table a later
   migration creates; FK creation must be deferred (create all tables, then add FKs that
   are satisfiable, deferring the rest to where their targets exist).
3. **Ordering defect.** `RetainedDecision` must be created before the migration that
   references it (fix by a corrective migration or by including it correctly in the
   baseline).

## Existing-database reconciliation (local-tested only)
Existing/production DBs already have all 131 tables (from `db push`) + the 54 migrations
applied. The baseline migration must therefore be a **no-op** there:
```
prisma migrate resolve --applied <baseline>   # mark baseline applied, do not run its SQL
prisma migrate deploy                          # remaining tracked migrations
```
Test only against local representative DBs. **No production DB mutation is authorised.**

## Production boundary
No production reconciliation executed. Fresh-install and existing-DB paths must BOTH be
proven (§6/§7) before any production action, which remains owner-authorised.

## Going-forward rule
No schema object may become a tracked-migration dependency without an earlier tracked
creation migration or an explicit accepted baseline. Enforced by
`tests/database/migration-history.test.ts` (fails on any NEW referenced-before-created
table beyond the documented known set).

## Validation commands
```
createdb aol_freshcheck
DATABASE_URL=postgres://…/aol_freshcheck prisma migrate deploy   # must exit 0 after baseline
DATABASE_URL=postgres://…/aol_freshcheck prisma migrate status   # all applied, no drift
# then: fixtures/seeds → tsc → full tests → production build
```

## Status
Root cause proven; strategy corrected to a full baseline with documented complications.
Authoring + proving the baseline (fresh + upgrade sim) is the next task — it requires
iterative testing against the disposable Postgres and the git-historical schema.
