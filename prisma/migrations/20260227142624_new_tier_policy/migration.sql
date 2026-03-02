/*
  Warnings:

  - You are about to drop the `ContentMetadata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DownloadAuditEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InnerCircleKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InnerCircleMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrivateAnnotation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StrategicLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StrategyInquiry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemAuditLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "access_tier" AS ENUM ('public', 'member', 'inner_circle', 'client', 'legacy', 'architect', 'owner');

-- CreateEnum
CREATE TYPE "member_role" AS ENUM ('ADMIN', 'PRINCIPAL', 'DELEGATE', 'MEMBER');

-- CreateEnum
CREATE TYPE "member_status" AS ENUM ('active', 'paused', 'disabled');

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
CREATE TYPE "key_status" AS ENUM ('active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('active', 'revoked', 'expired');

-- DropForeignKey
ALTER TABLE "DownloadAuditEvent" DROP CONSTRAINT "DownloadAuditEvent_memberId_fkey";

-- DropForeignKey
ALTER TABLE "InnerCircleKey" DROP CONSTRAINT "InnerCircleKey_memberId_fkey";

-- DropForeignKey
ALTER TABLE "PrivateAnnotation" DROP CONSTRAINT "PrivateAnnotation_contentId_fkey";

-- DropForeignKey
ALTER TABLE "PrivateAnnotation" DROP CONSTRAINT "PrivateAnnotation_memberId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_memberId_fkey";

-- DropForeignKey
ALTER TABLE "StrategicLink" DROP CONSTRAINT "StrategicLink_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "StrategicLink" DROP CONSTRAINT "StrategicLink_targetId_fkey";

-- DropForeignKey
ALTER TABLE "StrategyInquiry" DROP CONSTRAINT "StrategyInquiry_memberId_fkey";

-- DropTable
DROP TABLE "ContentMetadata";

-- DropTable
DROP TABLE "DownloadAuditEvent";

-- DropTable
DROP TABLE "InnerCircleKey";

-- DropTable
DROP TABLE "InnerCircleMember";

-- DropTable
DROP TABLE "PrivateAnnotation";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "StrategicLink";

-- DropTable
DROP TABLE "StrategyInquiry";

-- DropTable
DROP TABLE "SystemAuditLog";

-- DropEnum
DROP TYPE "AccessTier";

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
    "embedding" vector(1536),
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
CREATE TABLE "private_annotations" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" "annotation_priority" NOT NULL DEFAULT 'ROUTINE',
    "memberId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "embedding" vector(1536),
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
    "metadata" JSONB,
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
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_audit_logs_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "strategy_intakes_memberId_idx" ON "strategy_intakes"("memberId");

-- CreateIndex
CREATE INDEX "strategy_intakes_createdAt_idx" ON "strategy_intakes"("createdAt");

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
CREATE INDEX "inner_circle_keys_status_idx" ON "inner_circle_keys"("status");

-- CreateIndex
CREATE INDEX "download_audit_events_slug_idx" ON "download_audit_events"("slug");

-- CreateIndex
CREATE INDEX "download_audit_events_memberId_idx" ON "download_audit_events"("memberId");

-- CreateIndex
CREATE INDEX "download_audit_events_printAssetId_idx" ON "download_audit_events"("printAssetId");

-- CreateIndex
CREATE INDEX "download_audit_events_createdAt_idx" ON "download_audit_events"("createdAt");

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
CREATE INDEX "api_keys_expiresAt_idx" ON "api_keys"("expiresAt");

-- CreateIndex
CREATE INDEX "page_views_path_idx" ON "page_views"("path");

-- CreateIndex
CREATE INDEX "page_views_memberId_idx" ON "page_views"("memberId");

-- CreateIndex
CREATE INDEX "page_views_viewedAt_idx" ON "page_views"("viewedAt");

-- CreateIndex
CREATE INDEX "content_relations_sourceId_idx" ON "content_relations"("sourceId");

-- CreateIndex
CREATE INDEX "content_relations_targetId_idx" ON "content_relations"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "content_relations_sourceId_targetId_relationType_key" ON "content_relations"("sourceId", "targetId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_memberId_key" ON "user_preferences"("memberId");

-- CreateIndex
CREATE INDEX "system_events_eventType_idx" ON "system_events"("eventType");

-- CreateIndex
CREATE INDEX "system_events_status_idx" ON "system_events"("status");

-- CreateIndex
CREATE INDEX "system_events_createdAt_idx" ON "system_events"("createdAt");

-- AddForeignKey
ALTER TABLE "strategic_links" ADD CONSTRAINT "strategic_links_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_links" ADD CONSTRAINT "strategic_links_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_annotations" ADD CONSTRAINT "private_annotations_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_annotations" ADD CONSTRAINT "private_annotations_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_inquiries" ADD CONSTRAINT "strategy_inquiries_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_intakes" ADD CONSTRAINT "strategy_intakes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inner_circle_keys" ADD CONSTRAINT "inner_circle_keys_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_audit_events" ADD CONSTRAINT "download_audit_events_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_audit_events" ADD CONSTRAINT "download_audit_events_printAssetId_fkey" FOREIGN KEY ("printAssetId") REFERENCES "print_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canon_entries" ADD CONSTRAINT "canon_entries_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "content_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_relations" ADD CONSTRAINT "content_relations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_relations" ADD CONSTRAINT "content_relations_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
