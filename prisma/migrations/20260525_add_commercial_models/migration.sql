-- Migration: add_commercial_models
-- Adds DecisionActionLog and StripeWebhookEvent models for the commercial revenue path.

-- Create DecisionActionLog table
CREATE TABLE "DecisionActionLog" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "recommendedAction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "owner" TEXT,
    "dueDate" TIMESTAMP(3),
    "outcomeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionActionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DecisionActionLog_clientEmail_idx" ON "DecisionActionLog"("clientEmail");
CREATE INDEX "DecisionActionLog_reportId_idx" ON "DecisionActionLog"("reportId");
CREATE INDEX "DecisionActionLog_status_idx" ON "DecisionActionLog"("status");
CREATE INDEX "DecisionActionLog_severity_idx" ON "DecisionActionLog"("severity");

-- Create StripeWebhookEvent table
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sessionId" TEXT,
    "reportId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StripeWebhookEvent_type_sessionId_key" ON "StripeWebhookEvent"("type", "sessionId");
CREATE INDEX "StripeWebhookEvent_createdAt_idx" ON "StripeWebhookEvent"("createdAt");
