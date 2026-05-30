-- Migration: 20260530_add_foundry_interest
-- Adds the FoundryInterest table for capturing public proof layer review intent.

CREATE TABLE IF NOT EXISTS "foundry_interest" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "organisation" TEXT,
  "role"         TEXT,
  "context"      TEXT,
  "urgency"      TEXT NOT NULL DEFAULT 'Medium',
  "sourceTest"   TEXT,
  "ipHash"       TEXT,
  "consentGiven" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "foundry_interest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "foundry_interest_email_idx"      ON "foundry_interest"("email");
CREATE INDEX IF NOT EXISTS "foundry_interest_createdAt_idx"  ON "foundry_interest"("createdAt");
CREATE INDEX IF NOT EXISTS "foundry_interest_sourceTest_idx" ON "foundry_interest"("sourceTest");
