-- Longitudinal diagnostic lineage and monitoring cadence
ALTER TABLE "DiagnosticJourney" ADD COLUMN "userId" TEXT;
ALTER TABLE "DiagnosticJourney" ADD COLUMN "organisationKey" TEXT;
ALTER TABLE "DiagnosticJourney" ADD COLUMN "diagnosticType" TEXT NOT NULL DEFAULT 'diagnostic_journey';
ALTER TABLE "DiagnosticJourney" ADD COLUMN "parentJourneyId" TEXT;
ALTER TABLE "DiagnosticJourney" ADD COLUMN "monitoringCadence" TEXT NOT NULL DEFAULT 'ad_hoc';
ALTER TABLE "DiagnosticJourney" ADD COLUMN "startedAt" DATETIME;
UPDATE "DiagnosticJourney" SET "startedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) WHERE "startedAt" IS NULL;
ALTER TABLE "DiagnosticJourney" ADD COLUMN "completedAt" DATETIME;

CREATE INDEX "DiagnosticJourney_userId_idx" ON "DiagnosticJourney"("userId");
CREATE INDEX "DiagnosticJourney_organisationKey_idx" ON "DiagnosticJourney"("organisationKey");
CREATE INDEX "DiagnosticJourney_diagnosticType_idx" ON "DiagnosticJourney"("diagnosticType");
CREATE INDEX "DiagnosticJourney_parentJourneyId_idx" ON "DiagnosticJourney"("parentJourneyId");
CREATE INDEX "DiagnosticJourney_monitoringCadence_idx" ON "DiagnosticJourney"("monitoringCadence");

-- Campaign respondent attribution and diagnostic-stage governance
ALTER TABLE "AlignmentCampaign" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'intake';
ALTER TABLE "AlignmentCampaign" ADD COLUMN "diagnosticType" TEXT NOT NULL DEFAULT 'enterprise';
CREATE INDEX "AlignmentCampaign_diagnosticType_idx" ON "AlignmentCampaign"("diagnosticType");
CREATE INDEX "AlignmentCampaign_stage_idx" ON "AlignmentCampaign"("stage");

ALTER TABLE "CampaignParticipant" ADD COLUMN "journeyId" TEXT;
ALTER TABLE "CampaignParticipant" ADD COLUMN "respondentType" TEXT;
CREATE INDEX "CampaignParticipant_journeyId_idx" ON "CampaignParticipant"("journeyId");
CREATE INDEX "CampaignParticipant_respondentType_idx" ON "CampaignParticipant"("respondentType");

-- Persisted longitudinal comparisons
CREATE TABLE "LongitudinalComparisonRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "journeyId" TEXT NOT NULL,
  "baselineJourneyId" TEXT,
  "subjectKey" TEXT,
  "email" TEXT,
  "organisationKey" TEXT,
  "diagnosticType" TEXT NOT NULL,
  "cadence" TEXT NOT NULL DEFAULT 'ad_hoc',
  "deltaSummary" JSONB NOT NULL,
  "recurrenceSummary" JSONB,
  "evidenceNodes" JSONB,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "LongitudinalComparisonRecord_journeyId_idx" ON "LongitudinalComparisonRecord"("journeyId");
CREATE INDEX "LongitudinalComparisonRecord_baselineJourneyId_idx" ON "LongitudinalComparisonRecord"("baselineJourneyId");
CREATE INDEX "LongitudinalComparisonRecord_subjectKey_idx" ON "LongitudinalComparisonRecord"("subjectKey");
CREATE INDEX "LongitudinalComparisonRecord_email_idx" ON "LongitudinalComparisonRecord"("email");
CREATE INDEX "LongitudinalComparisonRecord_organisationKey_idx" ON "LongitudinalComparisonRecord"("organisationKey");
CREATE INDEX "LongitudinalComparisonRecord_diagnosticType_idx" ON "LongitudinalComparisonRecord"("diagnosticType");
CREATE INDEX "LongitudinalComparisonRecord_createdAt_idx" ON "LongitudinalComparisonRecord"("createdAt");

-- Persisted multi-stakeholder aggregate payload
CREATE TABLE "MultiStakeholderResult" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "campaignId" TEXT NOT NULL,
  "organisationId" TEXT,
  "organisationKey" TEXT,
  "diagnosticType" TEXT NOT NULL,
  "respondentCount" INTEGER NOT NULL,
  "payload" JSONB NOT NULL,
  "evidenceNodes" JSONB,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "MultiStakeholderResult_campaignId_diagnosticType_key" ON "MultiStakeholderResult"("campaignId", "diagnosticType");
CREATE INDEX "MultiStakeholderResult_campaignId_idx" ON "MultiStakeholderResult"("campaignId");
CREATE INDEX "MultiStakeholderResult_organisationId_idx" ON "MultiStakeholderResult"("organisationId");
CREATE INDEX "MultiStakeholderResult_organisationKey_idx" ON "MultiStakeholderResult"("organisationKey");
CREATE INDEX "MultiStakeholderResult_diagnosticType_idx" ON "MultiStakeholderResult"("diagnosticType");
CREATE INDEX "MultiStakeholderResult_createdAt_idx" ON "MultiStakeholderResult"("createdAt");

-- Persisted intervention outcome verification
CREATE TABLE "OutcomeVerificationRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "baselineJourneyId" TEXT,
  "followUpJourneyId" TEXT,
  "decisionObjectId" TEXT,
  "sessionId" TEXT,
  "organisationKey" TEXT,
  "outcomeClassification" TEXT NOT NULL,
  "magnitudeOfChange" REAL NOT NULL,
  "effectivenessScore" REAL NOT NULL,
  "unresolvedContradictions" JSONB,
  "payload" JSONB NOT NULL,
  "evidenceNodes" JSONB,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "OutcomeVerificationRecord_baselineJourneyId_idx" ON "OutcomeVerificationRecord"("baselineJourneyId");
CREATE INDEX "OutcomeVerificationRecord_followUpJourneyId_idx" ON "OutcomeVerificationRecord"("followUpJourneyId");
CREATE INDEX "OutcomeVerificationRecord_decisionObjectId_idx" ON "OutcomeVerificationRecord"("decisionObjectId");
CREATE INDEX "OutcomeVerificationRecord_sessionId_idx" ON "OutcomeVerificationRecord"("sessionId");
CREATE INDEX "OutcomeVerificationRecord_organisationKey_idx" ON "OutcomeVerificationRecord"("organisationKey");
CREATE INDEX "OutcomeVerificationRecord_outcomeClassification_idx" ON "OutcomeVerificationRecord"("outcomeClassification");
CREATE INDEX "OutcomeVerificationRecord_createdAt_idx" ON "OutcomeVerificationRecord"("createdAt");
