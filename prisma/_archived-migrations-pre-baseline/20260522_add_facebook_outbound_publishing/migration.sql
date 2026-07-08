-- Facebook outbound publishing: OAuth connections and publish attempt audit log.
-- Mirrors the governed LinkedIn outbound pattern with provider-appropriate fields.

CREATE TABLE IF NOT EXISTS "facebook_oauth_connections" (
  "id"                   TEXT NOT NULL,
  "pageId"               TEXT NOT NULL,
  "pageName"             TEXT,
  "encryptedAccessToken" TEXT NOT NULL,
  "encryptedUserToken"   TEXT,
  "scopesJson"           TEXT NOT NULL DEFAULT '[]',
  "connectedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"            TIMESTAMP(3),
  "revokedAt"            TIMESTAMP(3),
  "actorId"              TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "facebook_oauth_connections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "facebook_oauth_connections_pageId_idx"
  ON "facebook_oauth_connections"("pageId");

CREATE TABLE IF NOT EXISTS "facebook_publish_attempts" (
  "id"               TEXT NOT NULL,
  "assetType"        TEXT NOT NULL,
  "assetSlug"        TEXT NOT NULL,
  "assetTitle"       TEXT NOT NULL,
  "status"           TEXT NOT NULL,
  "facebookPostId"   TEXT,
  "facebookPostUrl"  TEXT,
  "errorCode"        TEXT,
  "errorMessageSafe" TEXT,
  "actorEmailHash"   TEXT,
  "actorId"          TEXT,
  "requestId"        TEXT NOT NULL,
  "dryRun"           BOOLEAN NOT NULL DEFAULT false,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"      TIMESTAMP(3),
  CONSTRAINT "facebook_publish_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "facebook_publish_attempts_assetSlug_idx"
  ON "facebook_publish_attempts"("assetSlug");

CREATE INDEX IF NOT EXISTS "facebook_publish_attempts_status_idx"
  ON "facebook_publish_attempts"("status");

CREATE INDEX IF NOT EXISTS "facebook_publish_attempts_requestId_idx"
  ON "facebook_publish_attempts"("requestId");
