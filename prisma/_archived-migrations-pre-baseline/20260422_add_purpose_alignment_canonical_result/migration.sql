-- Add durable canonical Purpose Alignment payload storage.
ALTER TABLE "PurposeAlignmentAssessment"
  ADD COLUMN IF NOT EXISTS "canonicalResult" TEXT,
  ADD COLUMN IF NOT EXISTS "responseMode" TEXT NOT NULL DEFAULT 'dual_axis';
