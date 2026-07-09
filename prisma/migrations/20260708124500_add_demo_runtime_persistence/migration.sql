-- CreateTable
CREATE TABLE "signal_consent_continuations" (
    "token" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,
    "subjectId" TEXT,
    "consentCapturedAt" TIMESTAMP(3),
    "caseId" TEXT,
    "interactionId" TEXT,
    "twinVersion" INTEGER,
    "stateHash" TEXT NOT NULL,
    CONSTRAINT "signal_consent_continuations_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "corridor_recommendation_contexts" (
    "recommendationId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "pressureBand" TEXT NOT NULL,
    "targetProductCode" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "targetRoute" TEXT NOT NULL,
    "accessMode" TEXT NOT NULL,
    "whyAdmissible" TEXT NOT NULL,
    "evidenceBasisJson" JSONB NOT NULL,
    "establishedJson" JSONB NOT NULL,
    "unresolvedJson" JSONB NOT NULL,
    "notYetAppropriate" TEXT,
    "carryForwardJson" JSONB NOT NULL,
    "stateHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "corridor_recommendation_contexts_pkey" PRIMARY KEY ("recommendationId")
);

-- CreateTable
CREATE TABLE "funnel_journey_events" (
    "eventId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "journeyVersion" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sourceRoute" TEXT NOT NULL,
    "tenantId" TEXT,
    "caseId" TEXT,
    "productCode" TEXT,
    "recommendationId" TEXT,
    CONSTRAINT "funnel_journey_events_pkey" PRIMARY KEY ("eventId")
);

-- CreateIndex
CREATE INDEX "signal_consent_continuations_recommendationId_idx" ON "signal_consent_continuations"("recommendationId");
CREATE INDEX "signal_consent_continuations_sessionId_idx" ON "signal_consent_continuations"("sessionId");
CREATE INDEX "signal_consent_continuations_tenantId_subjectId_idx" ON "signal_consent_continuations"("tenantId", "subjectId");
CREATE INDEX "signal_consent_continuations_expiresAt_idx" ON "signal_consent_continuations"("expiresAt");
CREATE INDEX "corridor_recommendation_contexts_contextId_idx" ON "corridor_recommendation_contexts"("contextId");
CREATE INDEX "corridor_recommendation_contexts_sessionId_idx" ON "corridor_recommendation_contexts"("sessionId");
CREATE INDEX "corridor_recommendation_contexts_targetProductCode_idx" ON "corridor_recommendation_contexts"("targetProductCode");
CREATE INDEX "corridor_recommendation_contexts_updatedAt_idx" ON "corridor_recommendation_contexts"("updatedAt");
CREATE INDEX "funnel_journey_events_eventType_idx" ON "funnel_journey_events"("eventType");
CREATE INDEX "funnel_journey_events_journeyVersion_idx" ON "funnel_journey_events"("journeyVersion");
CREATE INDEX "funnel_journey_events_sessionId_idx" ON "funnel_journey_events"("sessionId");
CREATE INDEX "funnel_journey_events_occurredAt_idx" ON "funnel_journey_events"("occurredAt");
CREATE INDEX "funnel_journey_events_tenantId_caseId_idx" ON "funnel_journey_events"("tenantId", "caseId");
