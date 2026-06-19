CREATE TABLE IF NOT EXISTS "linkedin_review_connections" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT,
  "userEmail" TEXT,
  "linkedinMemberUrn" TEXT,
  "linkedinMemberDisplayName" TEXT,
  "linkedinOrganizationUrn" TEXT,
  "organizationName" TEXT,
  "encryptedAccessToken" TEXT,
  "encryptedRefreshToken" TEXT,
  "grantedScopes" TEXT NOT NULL DEFAULT '',
  "tokenExpiresAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'review_demo',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "linkedin_review_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "linkedin_review_connections_workspaceId_userEmail_key"
  ON "linkedin_review_connections"("workspaceId", "userEmail");

CREATE INDEX IF NOT EXISTS "linkedin_review_connections_workspaceId_idx"
  ON "linkedin_review_connections"("workspaceId");

CREATE INDEX IF NOT EXISTS "linkedin_review_connections_status_idx"
  ON "linkedin_review_connections"("status");

CREATE TABLE IF NOT EXISTS "linkedin_review_post_drafts" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "authorId" TEXT,
  "authorEmail" TEXT,
  "sourceType" TEXT NOT NULL DEFAULT 'review_workspace',
  "sourceId" TEXT NOT NULL DEFAULT 'cost-of-slow-decisions',
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "approvalStatus" TEXT NOT NULL DEFAULT 'not_approved',
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "linkedinOrganizationUrn" TEXT,
  "linkedinPostUrn" TEXT,
  "publishedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "linkedin_review_post_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "linkedin_review_post_drafts_workspaceId_idx"
  ON "linkedin_review_post_drafts"("workspaceId");

CREATE INDEX IF NOT EXISTS "linkedin_review_post_drafts_status_idx"
  ON "linkedin_review_post_drafts"("status");

CREATE INDEX IF NOT EXISTS "linkedin_review_post_drafts_sourceId_idx"
  ON "linkedin_review_post_drafts"("sourceId");

CREATE TABLE IF NOT EXISTS "linkedin_review_analytics_snapshots" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "linkedinOrganizationUrn" TEXT,
  "linkedinPostUrn" TEXT,
  "metricsJson" JSONB NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'pending_standard_tier',
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "linkedin_review_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "linkedin_review_analytics_snapshots_workspaceId_idx"
  ON "linkedin_review_analytics_snapshots"("workspaceId");

CREATE INDEX IF NOT EXISTS "linkedin_review_analytics_snapshots_capturedAt_idx"
  ON "linkedin_review_analytics_snapshots"("capturedAt");

CREATE TABLE IF NOT EXISTS "linkedin_review_audit_events" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "actorId" TEXT,
  "actorEmail" TEXT,
  "eventType" TEXT NOT NULL,
  "safeMetadataJson" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "linkedin_review_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "linkedin_review_audit_events_workspaceId_idx"
  ON "linkedin_review_audit_events"("workspaceId");

CREATE INDEX IF NOT EXISTS "linkedin_review_audit_events_eventType_idx"
  ON "linkedin_review_audit_events"("eventType");

CREATE INDEX IF NOT EXISTS "linkedin_review_audit_events_createdAt_idx"
  ON "linkedin_review_audit_events"("createdAt");
