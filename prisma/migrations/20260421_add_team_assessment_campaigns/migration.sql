-- First-class multi-respondent Team Assessment mode.
CREATE TABLE "TeamAssessmentCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT,
    "sponsorUserId" TEXT,
    "slug" TEXT,
    "title" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'leader_estimate',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "closesAt" DATETIME,
    "minimumResponseThreshold" INTEGER NOT NULL DEFAULT 3,
    "anonymityMode" TEXT NOT NULL DEFAULT 'anonymous',
    "domainsJson" TEXT NOT NULL,
    "leaderEstimateJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "TeamAssessmentInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT,
    "roleLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" DATETIME,
    "submittedAt" DATETIME,
    "expiresAt" DATETIME,
    CONSTRAINT "TeamAssessmentInvite_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "TeamAssessmentCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "TeamAssessmentResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "inviteId" TEXT,
    "respondentKey" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamAssessmentResponse_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "TeamAssessmentCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamAssessmentResponse_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "TeamAssessmentInvite" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "TeamAssessmentAggregate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "respondentCount" INTEGER NOT NULL,
    "invitedCount" INTEGER NOT NULL,
    "completionRate" REAL NOT NULL,
    "confidence" REAL NOT NULL,
    "claimLevel" TEXT NOT NULL,
    "domainsJson" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamAssessmentAggregate_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "TeamAssessmentCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TeamAssessmentCampaign_slug_key" ON "TeamAssessmentCampaign"("slug");
CREATE INDEX "TeamAssessmentCampaign_organisationId_idx" ON "TeamAssessmentCampaign"("organisationId");
CREATE INDEX "TeamAssessmentCampaign_sponsorUserId_idx" ON "TeamAssessmentCampaign"("sponsorUserId");
CREATE INDEX "TeamAssessmentCampaign_mode_idx" ON "TeamAssessmentCampaign"("mode");
CREATE INDEX "TeamAssessmentCampaign_status_idx" ON "TeamAssessmentCampaign"("status");
CREATE INDEX "TeamAssessmentCampaign_closesAt_idx" ON "TeamAssessmentCampaign"("closesAt");

CREATE UNIQUE INDEX "TeamAssessmentInvite_tokenHash_key" ON "TeamAssessmentInvite"("tokenHash");
CREATE INDEX "TeamAssessmentInvite_campaignId_idx" ON "TeamAssessmentInvite"("campaignId");
CREATE INDEX "TeamAssessmentInvite_email_idx" ON "TeamAssessmentInvite"("email");
CREATE INDEX "TeamAssessmentInvite_status_idx" ON "TeamAssessmentInvite"("status");
CREATE INDEX "TeamAssessmentInvite_expiresAt_idx" ON "TeamAssessmentInvite"("expiresAt");

CREATE UNIQUE INDEX "TeamAssessmentResponse_inviteId_key" ON "TeamAssessmentResponse"("inviteId");
CREATE INDEX "TeamAssessmentResponse_campaignId_idx" ON "TeamAssessmentResponse"("campaignId");
CREATE INDEX "TeamAssessmentResponse_respondentKey_idx" ON "TeamAssessmentResponse"("respondentKey");
CREATE INDEX "TeamAssessmentResponse_submittedAt_idx" ON "TeamAssessmentResponse"("submittedAt");

CREATE UNIQUE INDEX "TeamAssessmentAggregate_campaignId_key" ON "TeamAssessmentAggregate"("campaignId");
CREATE INDEX "TeamAssessmentAggregate_claimLevel_idx" ON "TeamAssessmentAggregate"("claimLevel");
CREATE INDEX "TeamAssessmentAggregate_generatedAt_idx" ON "TeamAssessmentAggregate"("generatedAt");
