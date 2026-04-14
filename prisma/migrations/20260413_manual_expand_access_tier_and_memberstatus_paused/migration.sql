BEGIN TRANSACTION;

-- =========================================================
-- PR 1 — expand AccessTier to canonical 9 + add paused status
-- SQLite stores Prisma enums as TEXT in this repo snapshot.
-- Therefore the DB-side migration is a data remap, not a full
-- schema rebuild.
--
-- Approved remaps:
--   partner   -> architect
--   executive -> architect
--   sovereign -> owner
--
-- This migration is intentionally surgical.
-- No table recreation.
-- No unrelated schema drift.
-- =========================================================

-- InnerCircleMember.tier
UPDATE "inner_circle_members"
SET "tier" = 'architect'
WHERE "tier" IN ('partner', 'executive');

UPDATE "inner_circle_members"
SET "tier" = 'owner'
WHERE "tier" = 'sovereign';

-- ContentMetadata.classification
UPDATE "content_metadata"
SET "classification" = 'architect'
WHERE "classification" IN ('partner', 'executive');

UPDATE "content_metadata"
SET "classification" = 'owner'
WHERE "classification" = 'sovereign';

-- frameworks.tier
UPDATE "frameworks"
SET "tier" = 'architect'
WHERE "tier" IN ('partner', 'executive');

UPDATE "frameworks"
SET "tier" = 'owner'
WHERE "tier" = 'sovereign';

-- strategic_frameworks.tier
UPDATE "strategic_frameworks"
SET "tier" = 'architect'
WHERE "tier" IN ('partner', 'executive');

UPDATE "strategic_frameworks"
SET "tier" = 'owner'
WHERE "tier" = 'sovereign';

-- canon_entries.tier
UPDATE "canon_entries"
SET "tier" = 'architect'
WHERE "tier" IN ('partner', 'executive');

UPDATE "canon_entries"
SET "tier" = 'owner'
WHERE "tier" = 'sovereign';

-- print_assets.tier
UPDATE "print_assets"
SET "tier" = 'architect'
WHERE "tier" IN ('partner', 'executive');

UPDATE "print_assets"
SET "tier" = 'owner'
WHERE "tier" = 'sovereign';

-- AccessAuditLog equivalent in this repo snapshot:
-- framework_access_logs.requiredTier / currentTier
UPDATE "framework_access_logs"
SET "requiredTier" = 'architect'
WHERE "requiredTier" IN ('partner', 'executive');

UPDATE "framework_access_logs"
SET "requiredTier" = 'owner'
WHERE "requiredTier" = 'sovereign';

UPDATE "framework_access_logs"
SET "currentTier" = 'architect'
WHERE "currentTier" IN ('partner', 'executive');

UPDATE "framework_access_logs"
SET "currentTier" = 'owner'
WHERE "currentTier" = 'sovereign';

COMMIT;