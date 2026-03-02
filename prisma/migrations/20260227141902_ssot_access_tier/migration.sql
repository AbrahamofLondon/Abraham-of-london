-- prisma/migrations/20260227141902_ssot_access_tier/migration.sql
BEGIN;

-- ============================================================================
-- SAFE SSOT ACCESS TIER MIGRATION
-- ============================================================================

-- 1) Create SSOT enum type (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccessTier') THEN
    CREATE TYPE "AccessTier" AS ENUM (
      'public',
      'member',
      'inner-circle',
      'client',
      'legacy',
      'architect',
      'owner'
    );
  END IF;
END$$;

-- 2) Add shadow columns (new enum)
-- InnerCircleMember.tier -> tier_new
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='InnerCircleMember' AND column_name='tier_new'
  ) THEN
    ALTER TABLE "InnerCircleMember" ADD COLUMN "tier_new" "AccessTier";
  END IF;
END$$;

-- ContentMetadata.classification -> classification_new
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='ContentMetadata' AND column_name='classification_new'
  ) THEN
    ALTER TABLE "ContentMetadata" ADD COLUMN "classification_new" "AccessTier";
  END IF;
END$$;

-- 3) Count records to migrate (for verification)
DO $$
DECLARE
  member_count INTEGER;
  content_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_count FROM "InnerCircleMember" WHERE "tier_new" IS NULL;
  SELECT COUNT(*) INTO content_count FROM "ContentMetadata" WHERE "classification_new" IS NULL;
  
  RAISE NOTICE 'Migrating % members and % content items', member_count, content_count;
END$$;

-- 4) Backfill tier_new from old MemberTier
-- Mapping: standard->member, elite->legacy, private->client
UPDATE "InnerCircleMember"
SET "tier_new" = CASE
  WHEN "tier"::text = 'standard' THEN 'member'::"AccessTier"
  WHEN "tier"::text = 'elite'    THEN 'legacy'::"AccessTier"
  WHEN "tier"::text = 'private'  THEN 'client'::"AccessTier"
  ELSE 'member'::"AccessTier"
END
WHERE "tier_new" IS NULL;

-- 5) Verify no nulls remain
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "InnerCircleMember" WHERE "tier_new" IS NULL) THEN
    RAISE EXCEPTION 'CRITICAL: Some InnerCircleMember records still have NULL tier_new after migration';
  END IF;
END$$;

-- 6) Backfill classification_new from old Classification
-- Mapping: PUBLIC->public, PRIVATE->client, RESTRICTED->client
UPDATE "ContentMetadata"
SET "classification_new" = CASE
  WHEN "classification"::text = 'PUBLIC'     THEN 'public'::"AccessTier"
  WHEN "classification"::text = 'PRIVATE'    THEN 'client'::"AccessTier"
  WHEN "classification"::text = 'RESTRICTED' THEN 'client'::"AccessTier"
  ELSE 'client'::"AccessTier"
END
WHERE "classification_new" IS NULL;

-- 7) Verify no nulls remain
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "ContentMetadata" WHERE "classification_new" IS NULL) THEN
    RAISE EXCEPTION 'CRITICAL: Some ContentMetadata records still have NULL classification_new after migration';
  END IF;
END$$;

-- 8) Enforce NOT NULL + defaults on new columns
ALTER TABLE "InnerCircleMember"
  ALTER COLUMN "tier_new" SET NOT NULL;

ALTER TABLE "ContentMetadata"
  ALTER COLUMN "classification_new" SET NOT NULL;

-- Set defaults (match schema.prisma)
ALTER TABLE "InnerCircleMember"
  ALTER COLUMN "tier_new" SET DEFAULT 'member';

ALTER TABLE "ContentMetadata"
  ALTER COLUMN "classification_new" SET DEFAULT 'client';

-- 9) Drop old indexes (if they exist)
DROP INDEX IF EXISTS "InnerCircleMember_tier_idx";
DROP INDEX IF EXISTS "ContentMetadata_classification_idx";

-- 10) Swap columns: drop old, rename new -> canonical names
-- InnerCircleMember
ALTER TABLE "InnerCircleMember" DROP COLUMN "tier" CASCADE;
ALTER TABLE "InnerCircleMember" RENAME COLUMN "tier_new" TO "tier";

-- ContentMetadata
ALTER TABLE "ContentMetadata" DROP COLUMN "classification" CASCADE;
ALTER TABLE "ContentMetadata" RENAME COLUMN "classification_new" TO "classification";

COMMIT;

-- ============================================================================
-- CREATE INDEXES OUTSIDE TRANSACTION (can't use CONCURRENTLY inside transaction)
-- ============================================================================

-- Create indexes on new columns
CREATE INDEX IF NOT EXISTS "InnerCircleMember_tier_idx" ON "InnerCircleMember"("tier");
CREATE INDEX IF NOT EXISTS "ContentMetadata_classification_idx" ON "ContentMetadata"("classification");

-- Analyze tables for query planner
ANALYZE "InnerCircleMember";
ANALYZE "ContentMetadata";