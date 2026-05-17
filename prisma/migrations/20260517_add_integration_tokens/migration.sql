CREATE TABLE IF NOT EXISTS "integration_tokens" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "accessTokenEncrypted" TEXT NOT NULL,
  "refreshTokenEncrypted" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "scopes" TEXT NOT NULL,
  "connectedBy" TEXT,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "integration_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "integration_token_provider_org" ON "integration_tokens"("provider", "organisationId");
CREATE INDEX IF NOT EXISTS "integration_tokens_provider_idx" ON "integration_tokens"("provider");
CREATE INDEX IF NOT EXISTS "integration_tokens_status_idx" ON "integration_tokens"("status");
