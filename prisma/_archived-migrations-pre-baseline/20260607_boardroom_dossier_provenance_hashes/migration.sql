-- Migration: boardroom_dossier_provenance_hashes
-- Adds delivery provenance fields to BoardroomDossier table.
-- inputSnapshotHash and artifactHash are set by assertPaidDeliveryAuthorised()
-- to prove the input and output are stable and non-fixture.
-- orderId links the dossier back to the paid BoardroomBriefOrder record.

ALTER TABLE "BoardroomDossier"
  ADD COLUMN IF NOT EXISTS "orderId" TEXT,
  ADD COLUMN IF NOT EXISTS "inputSnapshotHash" TEXT,
  ADD COLUMN IF NOT EXISTS "artifactHash" TEXT;

-- Index for admin provenance lookups
CREATE INDEX IF NOT EXISTS "BoardroomDossier_orderId_idx"
  ON "BoardroomDossier" ("orderId");
