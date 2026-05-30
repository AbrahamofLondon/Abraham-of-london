-- Migration: 20260530_add_foundry_interest_structured_fields
-- Adds structured triage fields to foundry_interest table.
-- Run after 20260530_add_foundry_interest has been applied.

ALTER TABLE "foundry_interest"
  ADD COLUMN IF NOT EXISTS "decisionType"           TEXT,
  ADD COLUMN IF NOT EXISTS "deadline"               TEXT,
  ADD COLUMN IF NOT EXISTS "professionalHelpStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "hasFinancialConstraint" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "alreadyTried"           TEXT,
  ADD COLUMN IF NOT EXISTS "minimumOutcome"         TEXT;

CREATE INDEX IF NOT EXISTS "foundry_interest_decisionType_idx"
  ON "foundry_interest"("decisionType");

CREATE INDEX IF NOT EXISTS "foundry_interest_professionalHelpStatus_idx"
  ON "foundry_interest"("professionalHelpStatus");
