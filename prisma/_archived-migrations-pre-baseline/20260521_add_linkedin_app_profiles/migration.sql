-- Split governed LinkedIn publishing credentials by developer app profile.
-- Existing production rows remain attached to the legacy app profile.

ALTER TABLE "linkedin_publishing_connections"
  ADD COLUMN IF NOT EXISTS "profileKey" TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE "linkedin_publishing_connections"
  ADD COLUMN IF NOT EXISTS "accountMemberId" TEXT;

ALTER TABLE "linkedin_publishing_connections"
  ADD COLUMN IF NOT EXISTS "lastValidationStatus" TEXT NOT NULL DEFAULT 'unverified';

DROP INDEX IF EXISTS "linkedin_publishing_connection_provider_owner_type";

CREATE UNIQUE INDEX IF NOT EXISTS "linkedin_publishing_connection_provider_profile_owner_type"
  ON "linkedin_publishing_connections"("provider", "profileKey", "ownerType");

CREATE INDEX IF NOT EXISTS "linkedin_publishing_connections_profileKey_idx"
  ON "linkedin_publishing_connections"("profileKey");
