-- Migration: add_promotion_rollback_by
-- Adds rollbackBy column to foundry_promotions for actor attribution.

ALTER TABLE "foundry_promotions"
    ADD COLUMN "rollbackBy" TEXT;
