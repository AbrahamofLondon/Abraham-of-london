# ContentType Enum Migration Drift

**Date:** 2026-05-25
**Status:** Documented drift — no migration action taken

## 1. When was ContentType introduced in schema?

The `ContentType` enum exists in `prisma/schema.prisma` at line 67:

```prisma
enum ContentType {
  Briefs
  Dossier
  Operational_Framework
  Landing
  Leadership
  Audit
  Research
  Sovereign_Intelligence
  Lexicon
  Intelligence
  Prints
  Strategy
}
```

It is used by the `ContentMetadata` model at line 2687:
```prisma
model ContentMetadata {
  contentType ContentType @default(Briefs)
  ...
}
```

The enum was added to `schema.prisma` at some point before the earliest migration (`20260413_manual_expand_access_tier_and_memberstatus_paused`). It was likely part of the initial schema that was never captured in a migration.

## 2. Which migration should have created it?

**None.** The 31 existing migrations were all created after the initial schema was set up. The `ContentType` enum was part of the initial schema that was applied directly to the database (likely via `prisma db push` or direct SQL) rather than through a migration.

The enum was never captured in a `CREATE TYPE "ContentType" ...` statement in any `migration.sql` file. A search of all 31 migration files confirms:
- No migration contains `CREATE TYPE "ContentType"`
- No migration contains `ALTER TABLE ... ALTER COLUMN "contentType"`

## 3. Does production DB have ContentType?

**Unknown.** We cannot inspect the production database from this environment. However:

- The `ContentMetadata` model and `ContentType` enum have been in the schema for a long time (predating all 31 migrations).
- If production has been running with this schema, the enum must exist in production (either created by an initial `db push` or by direct SQL).
- The error `type "public.ContentType" does not exist` only occurs in the local development database, which was set up from migrations only (not from `db push`).

## 4. Does local DB only lack it, or is migration history actually incomplete?

**Both.** The migration history is incomplete because:
- The initial schema (including `ContentType`) was never captured in a migration.
- The 31 existing migrations were all additive changes on top of the initial schema.
- The local database was provisioned from migrations only, so it lacks the initial schema types.

This is a classic "initial schema drift" problem where the schema was bootstrapped outside the migration system.

## 5. What is the safest repair path?

### Decision: **Option D — Document and contain, do not migrate**

We choose **not** to create a migration for the following reasons:

1. **Shadow database is broken.** `pnpm prisma migrate dev --create-only` failed because the shadow database has a pre-existing issue (`table inner_circle_members does not exist`). Fixing the shadow database would require destructive operations or significant debugging of unrelated schema state.

2. **Production is likely unaffected.** If production has been running with this schema, the `ContentType` enum already exists there. Creating a migration now would attempt to create an enum that already exists in production, which would fail.

3. **The drift is contained.** The vault-master script now:
   - Detects the missing enum via `SELECT 1 FROM pg_type WHERE typname = 'ContentType'`
   - Emits one clear warning with resolution instructions
   - Skips DB sync gracefully
   - Does not flood logs with repeated errors

4. **The fix is well-documented.** Any developer encountering this can resolve it by:
   - `pnpm prisma db push` (applies schema directly to local DB)
   - Or creating a migration after fixing the shadow database

### Resolution for local development

To resolve the drift in a local development environment:

```bash
# Option 1: Apply schema directly (safe for disposable local DB)
pnpm prisma db push

# Option 2: Fix shadow database first, then create migration
# (Requires investigating the inner_circle_members table issue)
pnpm prisma migrate dev --name add_contenttype_enum --create-only
```

### Long-term fix

When the shadow database issue is resolved, create an additive migration:

```sql
CREATE TYPE "ContentType" AS ENUM (
  'Briefs', 'Dossier', 'Operational_Framework', 'Landing',
  'Leadership', 'Audit', 'Research', 'Sovereign_Intelligence',
  'Lexicon', 'Intelligence', 'Prints', 'Strategy'
);
```

This migration should use `CREATE TYPE ... AS ENUM (...)` with exactly the values from `prisma/schema.prisma`. It must be additive only — no destructive changes, no column alterations.
