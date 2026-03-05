-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "access_tier" AS ENUM ('public', 'member', 'inner_circle', 'client', 'legacy', 'architect', 'owner');

-- CreateEnum
CREATE TYPE "member_role" AS ENUM ('ADMIN', 'PRINCIPAL', 'DELEGATE', 'MEMBER');

-- CreateEnum
CREATE TYPE "member_status" AS ENUM ('active', 'paused', 'disabled');

-- CreateEnum
CREATE TYPE "permission" AS ENUM ('content_read', 'content_write', 'content_publish', 'downloads_read', 'downloads_premium', 'inner_circle_access', 'inner_circle_issue_keys', 'inner_circle_revoke_keys', 'admin_all', 'billing_read', 'billing_write', 'system_config_write', 'security_read', 'security_write', 'security_revoke_sessions');

-- CreateEnum
CREATE TYPE "content_type" AS ENUM ('Dossier', 'Briefing', 'Operational_Framework', 'Lexicon', 'Landing');

-- CreateEnum
CREATE TYPE "link_type" AS ENUM ('PREREQUISITE', 'COMPLEMENTARY', 'DEPENDENCY');

-- CreateEnum
CREATE TYPE "annotation_priority" AS ENUM ('ROUTINE', 'URGENT', 'MANDATE');

-- CreateEnum
CREATE TYPE "inquiry_status" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "audit_severity" AS ENUM ('info', 'warning', 'high', 'critical');

-- CreateEnum
CREATE TYPE "security_event" AS ENUM ('login_success', 'login_failed', 'logout', 'session_revoked', 'session_expired', 'mfa_challenge_created', 'mfa_verified', 'mfa_failed', 'mfa_max_attempts', 'key_redeemed', 'key_revoked', 'key_expired', 'admin_action');

-- CreateEnum
CREATE TYPE "http_method" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD');

-- CreateEnum
CREATE TYPE "key_status" AS ENUM ('active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "mfa_method" AS ENUM ('totp', 'sms', 'email', 'backup_code', 'push');

-- CreateEnum
CREATE TYPE "api_key_status" AS ENUM ('active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "webhook_status" AS ENUM ('active', 'disabled');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" "member_role" NOT NULL DEFAULT 'MEMBER',
    "status" "member_status" NOT NULL DEFAULT 'active',
    "permissions" "permission"[] DEFAULT ARRAY[]::"permission"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_invites" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inner_circle_members" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" "member_role" NOT NULL DEFAULT 'MEMBER',
    "tier" "access_tier" NOT NULL DEFAULT 'member',
    "status" "member_status" NOT NULL DEFAULT 'active',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "flags" TEXT,
    "permissions" "permission"[] DEFAULT ARRAY[]::"permission"[],

    CONSTRAINT "inner_circle_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_metadata" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentType" "content_type" NOT NULL DEFAULT 'Briefing',
    "classification" "access_tier" NOT NULL DEFAULT 'client',
    "summary" TEXT,
    "content" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "embedding" vector,
    "totalPrints" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_links" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "linkType" "link_type" NOT NULL DEFAULT 'DEPENDENCY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategic_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_relations" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_annotations" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" "annotation_priority" NOT NULL DEFAULT 'ROUTINE',
    "memberId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "embedding" vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "private_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_inquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "status" "inquiry_status" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB DEFAULT '{}',
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_intakes" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "dependencyLevel" TEXT NOT NULL,
    "volatility" TEXT NOT NULL,
    "readinessScore" INTEGER NOT NULL DEFAULT 5,
    "payload" JSONB NOT NULL,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "severity" "audit_severity" NOT NULL DEFAULT 'info',
    "actorId" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorEmail" TEXT,

    CONSTRAINT "system_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_logs" (
    "id" TEXT NOT NULL,
    "event" "security_event" NOT NULL,
    "severity" "audit_severity" NOT NULL DEFAULT 'info',
    "memberId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_logs" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" "http_method" NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "memberId" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "memberId" TEXT,
    "status" "session_status" NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inner_circle_keys" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "status" "key_status" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "keySuffix" VARCHAR(8),
    "keyType" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "inner_circle_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_audit_events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "printAssetId" TEXT,
    "memberId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mfa_setups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "methods" "mfa_method"[] DEFAULT ARRAY['totp']::"mfa_method"[],
    "totpSecret" TEXT,
    "totpVerified" BOOLEAN NOT NULL DEFAULT false,
    "backupCodes" JSONB DEFAULT '[]',
    "phoneNumber" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "recoveryEmail" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mfa_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_frameworks" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "oneLiner" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "canonRoot" TEXT NOT NULL,
    "audience" TEXT[],
    "tier" "access_tier" NOT NULL DEFAULT 'member',
    "content" TEXT,
    "artifactUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_assets" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tier" "access_tier" NOT NULL DEFAULT 'member',
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileFormat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canon_entries" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tier" "access_tier" NOT NULL DEFAULT 'member',
    "contentType" TEXT NOT NULL,
    "readTime" INTEGER,
    "metadataId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canon_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "tier" "access_tier" NOT NULL DEFAULT 'member',
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "memberId" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "api_key_status" NOT NULL DEFAULT 'active',

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "slug" TEXT,
    "memberId" TEXT,
    "requiredTier" "access_tier",
    "userTier" "access_tier",
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "theme" TEXT DEFAULT 'dark',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" TEXT,
    "bookmarks" JSONB DEFAULT '[]',
    "lastReadAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "status" "webhook_status" NOT NULL DEFAULT 'active',
    "eventTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "ok" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "queue" TEXT NOT NULL DEFAULT 'default',
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "organization_members_organizationId_idx" ON "organization_members"("organizationId");

-- CreateIndex
CREATE INDEX "organization_members_memberId_idx" ON "organization_members"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_memberId_key" ON "organization_members"("organizationId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invites_tokenHash_key" ON "organization_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "organization_invites_organizationId_idx" ON "organization_invites"("organizationId");

-- CreateIndex
CREATE INDEX "organization_invites_email_idx" ON "organization_invites"("email");

-- CreateIndex
CREATE INDEX "organization_invites_expiresAt_idx" ON "organization_invites"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "inner_circle_members_emailHash_key" ON "inner_circle_members"("emailHash");

-- CreateIndex
CREATE UNIQUE INDEX "inner_circle_members_email_key" ON "inner_circle_members"("email");

-- CreateIndex
CREATE INDEX "inner_circle_members_status_idx" ON "inner_circle_members"("status");

-- CreateIndex
CREATE INDEX "inner_circle_members_tier_idx" ON "inner_circle_members"("tier");

-- CreateIndex
CREATE INDEX "inner_circle_members_role_idx" ON "inner_circle_members"("role");

-- CreateIndex
CREATE INDEX "inner_circle_members_lastSeenAt_idx" ON "inner_circle_members"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "content_metadata_slug_key" ON "content_metadata"("slug");

-- CreateIndex
CREATE INDEX "content_metadata_slug_idx" ON "content_metadata"("slug");

-- CreateIndex
CREATE INDEX "content_metadata_classification_idx" ON "content_metadata"("classification");

-- CreateIndex
CREATE INDEX "content_metadata_contentType_idx" ON "content_metadata"("contentType");

-- CreateIndex
CREATE INDEX "strategic_links_sourceId_idx" ON "strategic_links"("sourceId");

-- CreateIndex
CREATE INDEX "strategic_links_targetId_idx" ON "strategic_links"("targetId");

-- CreateIndex
CREATE INDEX "strategic_links_linkType_idx" ON "strategic_links"("linkType");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_links_sourceId_targetId_key" ON "strategic_links"("sourceId", "targetId");

-- CreateIndex
CREATE INDEX "content_relations_sourceId_idx" ON "content_relations"("sourceId");

-- CreateIndex
CREATE INDEX "content_relations_targetId_idx" ON "content_relations"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "content_relations_sourceId_targetId_relationType_key" ON "content_relations"("sourceId", "targetId", "relationType");

-- CreateIndex
CREATE INDEX "private_annotations_memberId_idx" ON "private_annotations"("memberId");

-- CreateIndex
CREATE INDEX "private_annotations_contentId_idx" ON "private_annotations"("contentId");

-- CreateIndex
CREATE INDEX "private_annotations_priority_idx" ON "private_annotations"("priority");

-- CreateIndex
CREATE INDEX "strategy_inquiries_email_idx" ON "strategy_inquiries"("email");

-- CreateIndex
CREATE INDEX "strategy_inquiries_status_idx" ON "strategy_inquiries"("status");

-- CreateIndex
CREATE INDEX "strategy_inquiries_createdAt_idx" ON "strategy_inquiries"("createdAt");

-- CreateIndex
CREATE INDEX "strategy_inquiries_memberId_idx" ON "strategy_inquiries"("memberId");

-- CreateIndex
CREATE INDEX "strategy_intakes_organisation_idx" ON "strategy_intakes"("organisation");

-- CreateIndex
CREATE INDEX "strategy_intakes_createdAt_idx" ON "strategy_intakes"("createdAt");

-- CreateIndex
CREATE INDEX "strategy_intakes_memberId_idx" ON "strategy_intakes"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_key_idx" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_audit_logs_action_idx" ON "system_audit_logs"("action");

-- CreateIndex
CREATE INDEX "system_audit_logs_severity_idx" ON "system_audit_logs"("severity");

-- CreateIndex
CREATE INDEX "system_audit_logs_actorId_idx" ON "system_audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "system_audit_logs_resourceId_idx" ON "system_audit_logs"("resourceId");

-- CreateIndex
CREATE INDEX "system_audit_logs_createdAt_idx" ON "system_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "security_logs_event_idx" ON "security_logs"("event");

-- CreateIndex
CREATE INDEX "security_logs_severity_idx" ON "security_logs"("severity");

-- CreateIndex
CREATE INDEX "security_logs_memberId_idx" ON "security_logs"("memberId");

-- CreateIndex
CREATE INDEX "security_logs_createdAt_idx" ON "security_logs"("createdAt");

-- CreateIndex
CREATE INDEX "api_logs_endpoint_idx" ON "api_logs"("endpoint");

-- CreateIndex
CREATE INDEX "api_logs_method_idx" ON "api_logs"("method");

-- CreateIndex
CREATE INDEX "api_logs_statusCode_idx" ON "api_logs"("statusCode");

-- CreateIndex
CREATE INDEX "api_logs_createdAt_idx" ON "api_logs"("createdAt");

-- CreateIndex
CREATE INDEX "api_logs_memberId_idx" ON "api_logs"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionId_key" ON "sessions"("sessionId");

-- CreateIndex
CREATE INDEX "sessions_memberId_idx" ON "sessions"("memberId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "inner_circle_keys_keyHash_key" ON "inner_circle_keys"("keyHash");

-- CreateIndex
CREATE INDEX "inner_circle_keys_memberId_idx" ON "inner_circle_keys"("memberId");

-- CreateIndex
CREATE INDEX "inner_circle_keys_keyHash_idx" ON "inner_circle_keys"("keyHash");

-- CreateIndex
CREATE INDEX "inner_circle_keys_status_idx" ON "inner_circle_keys"("status");

-- CreateIndex
CREATE INDEX "inner_circle_keys_expiresAt_idx" ON "inner_circle_keys"("expiresAt");

-- CreateIndex
CREATE INDEX "download_audit_events_slug_idx" ON "download_audit_events"("slug");

-- CreateIndex
CREATE INDEX "download_audit_events_memberId_idx" ON "download_audit_events"("memberId");

-- CreateIndex
CREATE INDEX "download_audit_events_printAssetId_idx" ON "download_audit_events"("printAssetId");

-- CreateIndex
CREATE INDEX "download_audit_events_createdAt_idx" ON "download_audit_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "mfa_setups_userId_key" ON "mfa_setups"("userId");

-- CreateIndex
CREATE INDEX "mfa_setups_enabled_idx" ON "mfa_setups"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_frameworks_key_key" ON "strategic_frameworks"("key");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_frameworks_slug_key" ON "strategic_frameworks"("slug");

-- CreateIndex
CREATE INDEX "strategic_frameworks_tier_idx" ON "strategic_frameworks"("tier");

-- CreateIndex
CREATE INDEX "strategic_frameworks_slug_idx" ON "strategic_frameworks"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "print_assets_slug_key" ON "print_assets"("slug");

-- CreateIndex
CREATE INDEX "print_assets_tier_idx" ON "print_assets"("tier");

-- CreateIndex
CREATE INDEX "print_assets_slug_idx" ON "print_assets"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "canon_entries_slug_key" ON "canon_entries"("slug");

-- CreateIndex
CREATE INDEX "canon_entries_tier_idx" ON "canon_entries"("tier");

-- CreateIndex
CREATE INDEX "canon_entries_contentType_idx" ON "canon_entries"("contentType");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_tier_idx" ON "api_keys"("tier");

-- CreateIndex
CREATE INDEX "api_keys_status_idx" ON "api_keys"("status");

-- CreateIndex
CREATE INDEX "api_keys_expiresAt_idx" ON "api_keys"("expiresAt");

-- CreateIndex
CREATE INDEX "page_views_path_idx" ON "page_views"("path");

-- CreateIndex
CREATE INDEX "page_views_memberId_idx" ON "page_views"("memberId");

-- CreateIndex
CREATE INDEX "page_views_viewedAt_idx" ON "page_views"("viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_memberId_key" ON "user_preferences"("memberId");

-- CreateIndex
CREATE INDEX "webhook_endpoints_status_idx" ON "webhook_endpoints"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_endpointId_idx" ON "webhook_deliveries"("endpointId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_eventType_idx" ON "webhook_deliveries"("eventType");

-- CreateIndex
CREATE INDEX "webhook_deliveries_createdAt_idx" ON "webhook_deliveries"("createdAt");

-- CreateIndex
CREATE INDEX "system_events_eventType_idx" ON "system_events"("eventType");

-- CreateIndex
CREATE INDEX "system_events_status_idx" ON "system_events"("status");

-- CreateIndex
CREATE INDEX "system_events_createdAt_idx" ON "system_events"("createdAt");

-- CreateIndex
CREATE INDEX "jobs_queue_idx" ON "jobs"("queue");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_runAfter_idx" ON "jobs"("runAfter");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_key" ON "admin_sessions"("token");

-- CreateIndex
CREATE INDEX "admin_sessions_token_idx" ON "admin_sessions"("token");

-- CreateIndex
CREATE INDEX "admin_sessions_expiresAt_idx" ON "admin_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "admin_sessions_userId_idx" ON "admin_sessions"("userId");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_links" ADD CONSTRAINT "strategic_links_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_links" ADD CONSTRAINT "strategic_links_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_relations" ADD CONSTRAINT "content_relations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_relations" ADD CONSTRAINT "content_relations_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_annotations" ADD CONSTRAINT "private_annotations_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_annotations" ADD CONSTRAINT "private_annotations_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_inquiries" ADD CONSTRAINT "strategy_inquiries_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_intakes" ADD CONSTRAINT "strategy_intakes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inner_circle_keys" ADD CONSTRAINT "inner_circle_keys_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_audit_events" ADD CONSTRAINT "download_audit_events_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_audit_events" ADD CONSTRAINT "download_audit_events_printAssetId_fkey" FOREIGN KEY ("printAssetId") REFERENCES "print_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_setups" ADD CONSTRAINT "mfa_setups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canon_entries" ADD CONSTRAINT "canon_entries_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "content_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

