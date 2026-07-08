-- =========================================================
-- PR 1 — expand AccessTier to canonical 9 + add paused status
--
-- This migration originated as a surgical legacy-data remap. In a clean
-- PostgreSQL database these legacy tables may not exist yet, so every remap is
-- guarded. Existing databases still receive the intended remap; clean-room
-- databases can proceed from tracked migrations alone.
-- =========================================================

DO $$
BEGIN
  IF to_regclass('public.inner_circle_members') IS NOT NULL THEN
    UPDATE "inner_circle_members" SET "tier" = 'architect' WHERE "tier" IN ('partner', 'executive');
    UPDATE "inner_circle_members" SET "tier" = 'owner' WHERE "tier" = 'sovereign';
  END IF;

  IF to_regclass('public.content_metadata') IS NOT NULL THEN
    UPDATE "content_metadata" SET "classification" = 'architect' WHERE "classification" IN ('partner', 'executive');
    UPDATE "content_metadata" SET "classification" = 'owner' WHERE "classification" = 'sovereign';
  END IF;

  IF to_regclass('public.frameworks') IS NOT NULL THEN
    UPDATE "frameworks" SET "tier" = 'architect' WHERE "tier" IN ('partner', 'executive');
    UPDATE "frameworks" SET "tier" = 'owner' WHERE "tier" = 'sovereign';
  END IF;

  IF to_regclass('public.strategic_frameworks') IS NOT NULL THEN
    UPDATE "strategic_frameworks" SET "tier" = 'architect' WHERE "tier" IN ('partner', 'executive');
    UPDATE "strategic_frameworks" SET "tier" = 'owner' WHERE "tier" = 'sovereign';
  END IF;

  IF to_regclass('public.canon_entries') IS NOT NULL THEN
    UPDATE "canon_entries" SET "tier" = 'architect' WHERE "tier" IN ('partner', 'executive');
    UPDATE "canon_entries" SET "tier" = 'owner' WHERE "tier" = 'sovereign';
  END IF;

  IF to_regclass('public.print_assets') IS NOT NULL THEN
    UPDATE "print_assets" SET "tier" = 'architect' WHERE "tier" IN ('partner', 'executive');
    UPDATE "print_assets" SET "tier" = 'owner' WHERE "tier" = 'sovereign';
  END IF;

  IF to_regclass('public.framework_access_logs') IS NOT NULL THEN
    UPDATE "framework_access_logs" SET "requiredTier" = 'architect' WHERE "requiredTier" IN ('partner', 'executive');
    UPDATE "framework_access_logs" SET "requiredTier" = 'owner' WHERE "requiredTier" = 'sovereign';
    UPDATE "framework_access_logs" SET "currentTier" = 'architect' WHERE "currentTier" IN ('partner', 'executive');
    UPDATE "framework_access_logs" SET "currentTier" = 'owner' WHERE "currentTier" = 'sovereign';
  END IF;
END $$;
