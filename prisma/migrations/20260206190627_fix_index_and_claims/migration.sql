-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "InnerCircleMember" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'active',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InnerCircleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentMetadata" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "classification" TEXT NOT NULL DEFAULT 'RESTRICTED',
    "summary" TEXT,
    "content" TEXT,
    "embedding" vector(1536),
    "totalPrints" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicLink" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "linkType" TEXT NOT NULL DEFAULT 'DEPENDENCY',

    CONSTRAINT "StrategicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateAnnotation" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'ROUTINE',
    "memberId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "actorId" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "memberId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InnerCircleKey" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "InnerCircleKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DownloadAuditEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DownloadAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InnerCircleMember_emailHash_key" ON "InnerCircleMember"("emailHash");

-- CreateIndex
CREATE UNIQUE INDEX "InnerCircleMember_email_key" ON "InnerCircleMember"("email");

-- CreateIndex
CREATE INDEX "InnerCircleMember_status_idx" ON "InnerCircleMember"("status");

-- CreateIndex
CREATE INDEX "InnerCircleMember_tier_idx" ON "InnerCircleMember"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "ContentMetadata_slug_key" ON "ContentMetadata"("slug");

-- CreateIndex
CREATE INDEX "ContentMetadata_slug_idx" ON "ContentMetadata"("slug");

-- CreateIndex
CREATE INDEX "ContentMetadata_classification_idx" ON "ContentMetadata"("classification");

-- CreateIndex
CREATE UNIQUE INDEX "StrategicLink_sourceId_targetId_key" ON "StrategicLink"("sourceId", "targetId");

-- CreateIndex
CREATE INDEX "PrivateAnnotation_memberId_idx" ON "PrivateAnnotation"("memberId");

-- CreateIndex
CREATE INDEX "PrivateAnnotation_contentId_idx" ON "PrivateAnnotation"("contentId");

-- CreateIndex
CREATE INDEX "StrategyInquiry_email_idx" ON "StrategyInquiry"("email");

-- CreateIndex
CREATE INDEX "StrategyInquiry_status_idx" ON "StrategyInquiry"("status");

-- CreateIndex
CREATE INDEX "SystemAuditLog_action_idx" ON "SystemAuditLog"("action");

-- CreateIndex
CREATE INDEX "SystemAuditLog_severity_idx" ON "SystemAuditLog"("severity");

-- CreateIndex
CREATE INDEX "SystemAuditLog_actorId_idx" ON "SystemAuditLog"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionId_key" ON "Session"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "InnerCircleKey_keyHash_key" ON "InnerCircleKey"("keyHash");

-- AddForeignKey
ALTER TABLE "StrategicLink" ADD CONSTRAINT "StrategicLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContentMetadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategicLink" ADD CONSTRAINT "StrategicLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "ContentMetadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateAnnotation" ADD CONSTRAINT "PrivateAnnotation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "InnerCircleMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateAnnotation" ADD CONSTRAINT "PrivateAnnotation_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyInquiry" ADD CONSTRAINT "StrategyInquiry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "InnerCircleMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "InnerCircleMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InnerCircleKey" ADD CONSTRAINT "InnerCircleKey_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "InnerCircleMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadAuditEvent" ADD CONSTRAINT "DownloadAuditEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "InnerCircleMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
