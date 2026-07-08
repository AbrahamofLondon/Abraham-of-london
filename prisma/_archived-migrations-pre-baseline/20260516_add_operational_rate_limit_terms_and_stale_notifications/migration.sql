-- Migration: add_operational_rate_limit_terms_and_stale_notifications
-- Creates three operational tables:
--   rate_limit_events        — Postgres-backed rate limiting with HMAC-hashed identifiers
--   terms_acceptances        — versioned ToS / Privacy acceptance tracking
--   stale_case_notifications — stale governed-case email notification dedup + mute/extend

-- CreateTable
CREATE TABLE IF NOT EXISTS "rate_limit_events" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "identifierHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowSeconds" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "limit" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rate_limit_event_cleanup_idx" ON "rate_limit_events"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "rate_limit_events_scope_identifierHash_windowStart_windowSe_key"
    ON "rate_limit_events"("scope", "identifierHash", "windowStart", "windowSeconds");

-- CreateTable
CREATE TABLE IF NOT EXISTS "terms_acceptances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "terms_acceptances_userId_idx" ON "terms_acceptances"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "terms_acceptances_email_idx" ON "terms_acceptances"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "terms_acceptances_docType_version_idx" ON "terms_acceptances"("docType", "version");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "terms_acceptances_userId_docType_key" ON "terms_acceptances"("userId", "docType");

-- CreateTable
CREATE TABLE IF NOT EXISTS "stale_case_notifications" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "band" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnLinkToken" TEXT,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "extendedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stale_case_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stale_case_notifications_caseId_idx" ON "stale_case_notifications"("caseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stale_case_notifications_userEmail_idx" ON "stale_case_notifications"("userEmail");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stale_case_notifications_sentAt_idx" ON "stale_case_notifications"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "stale_case_notifications_caseId_userEmail_band_key"
    ON "stale_case_notifications"("caseId", "userEmail", "band");
