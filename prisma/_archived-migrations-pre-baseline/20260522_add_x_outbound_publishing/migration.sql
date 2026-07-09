-- Add X (Twitter) outbound publishing tables
-- Migration: 20260522_add_x_outbound_publishing

CREATE TABLE IF NOT EXISTS "x_oauth_connections" (
    "id"                    TEXT NOT NULL,
    "userId"                TEXT,
    "username"              TEXT,
    "encryptedAccessToken"  TEXT NOT NULL,
    "encryptedRefreshToken" TEXT,
    "scopesJson"            TEXT NOT NULL DEFAULT '[]',
    "connectedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"             TIMESTAMP(3),
    "revokedAt"             TIMESTAMP(3),
    "actorId"               TEXT,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "x_oauth_connections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "x_oauth_connections_userId_idx"
    ON "x_oauth_connections"("userId");

CREATE TABLE IF NOT EXISTS "x_publish_attempts" (
    "id"                 TEXT NOT NULL,
    "assetType"          TEXT NOT NULL,
    "assetSlug"          TEXT NOT NULL,
    "assetTitle"         TEXT NOT NULL,
    "status"             TEXT NOT NULL,
    "tweetId"            TEXT,
    "tweetUrl"           TEXT,
    "syncedFromFacebook" BOOLEAN NOT NULL DEFAULT false,
    "errorCode"          TEXT,
    "errorMessageSafe"   TEXT,
    "actorEmailHash"     TEXT,
    "actorId"            TEXT,
    "requestId"          TEXT NOT NULL,
    "dryRun"             BOOLEAN NOT NULL DEFAULT false,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"        TIMESTAMP(3),
    CONSTRAINT "x_publish_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "x_publish_attempts_assetSlug_idx"
    ON "x_publish_attempts"("assetSlug");
CREATE INDEX IF NOT EXISTS "x_publish_attempts_status_idx"
    ON "x_publish_attempts"("status");
CREATE INDEX IF NOT EXISTS "x_publish_attempts_requestId_idx"
    ON "x_publish_attempts"("requestId");
