-- Governed LinkedIn publishing connection / attempt storage.
-- Tokens are encrypted by the application before storage.

CREATE TABLE IF NOT EXISTS "linkedin_publishing_connections" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'linkedin',
  "ownerType" TEXT NOT NULL,
  "ownerUrn" TEXT,
  "displayName" TEXT,
  "ownerName" TEXT,
  "isDefaultPublishingTarget" BOOLEAN NOT NULL DEFAULT false,
  "requiredScope" TEXT NOT NULL DEFAULT 'w_member_social',
  "encryptedAccessToken" TEXT NOT NULL,
  "encryptedRefreshToken" TEXT,
  "expiresAt" TIMESTAMP(3),
  "scope" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastVerifiedAt" TIMESTAMP(3),
  CONSTRAINT "linkedin_publishing_connections_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "linkedin_publishing_connections"
  ADD COLUMN IF NOT EXISTS "ownerName" TEXT;

ALTER TABLE "linkedin_publishing_connections"
  ADD COLUMN IF NOT EXISTS "isDefaultPublishingTarget" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "linkedin_publishing_connections"
  ADD COLUMN IF NOT EXISTS "requiredScope" TEXT NOT NULL DEFAULT 'w_member_social';

CREATE UNIQUE INDEX IF NOT EXISTS "linkedin_publishing_connection_provider_owner_type"
  ON "linkedin_publishing_connections"("provider", "ownerType");

CREATE INDEX IF NOT EXISTS "linkedin_publishing_connections_provider_idx"
  ON "linkedin_publishing_connections"("provider");

CREATE INDEX IF NOT EXISTS "linkedin_publishing_connections_status_idx"
  ON "linkedin_publishing_connections"("status");

CREATE TABLE IF NOT EXISTS "linkedin_publish_attempts" (
  "id" TEXT NOT NULL,
  "outboundSlug" TEXT NOT NULL,
  "outboundTitle" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "linkedInPostUrn" TEXT,
  "linkedInUrl" TEXT,
  "errorCode" TEXT,
  "errorMessageSafe" TEXT,
  "actorEmailHash" TEXT,
  "actorId" TEXT,
  "requestId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "linkedin_publish_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "linkedin_publish_attempts_outboundSlug_idx"
  ON "linkedin_publish_attempts"("outboundSlug");

CREATE INDEX IF NOT EXISTS "linkedin_publish_attempts_status_idx"
  ON "linkedin_publish_attempts"("status");

CREATE INDEX IF NOT EXISTS "linkedin_publish_attempts_requestId_idx"
  ON "linkedin_publish_attempts"("requestId");
