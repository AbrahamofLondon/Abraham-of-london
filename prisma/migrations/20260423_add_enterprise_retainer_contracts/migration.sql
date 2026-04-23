-- Enterprise retainer contracts: first-class recurring decision authority model
CREATE TABLE IF NOT EXISTS "RetainerContract" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "decisionCapacity" INTEGER NOT NULL,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME,
  "billingCycle" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT,
  "entitlementSlug" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RetainerContract_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RetainerContract_stripeSubscriptionId_key" ON "RetainerContract"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "RetainerContract_organisationId_idx" ON "RetainerContract"("organisationId");
CREATE INDEX IF NOT EXISTS "RetainerContract_organisationId_status_idx" ON "RetainerContract"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "RetainerContract_tier_idx" ON "RetainerContract"("tier");
CREATE INDEX IF NOT EXISTS "RetainerContract_status_idx" ON "RetainerContract"("status");
CREATE INDEX IF NOT EXISTS "RetainerContract_stripeSubscriptionId_idx" ON "RetainerContract"("stripeSubscriptionId");

CREATE TABLE IF NOT EXISTS "RetainedDecision" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  "decisionObjectId" TEXT NOT NULL,
  "priorityLevel" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RetainedDecision_contractId_fkey"
    FOREIGN KEY ("contractId") REFERENCES "RetainerContract"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RetainedDecision_decisionObjectId_fkey"
    FOREIGN KEY ("decisionObjectId") REFERENCES "DiagnosticDecisionObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RetainedDecision_contractId_decisionObjectId_key" ON "RetainedDecision"("contractId", "decisionObjectId");
CREATE INDEX IF NOT EXISTS "RetainedDecision_contractId_idx" ON "RetainedDecision"("contractId");
CREATE INDEX IF NOT EXISTS "RetainedDecision_decisionObjectId_idx" ON "RetainedDecision"("decisionObjectId");
CREATE INDEX IF NOT EXISTS "RetainedDecision_contractId_status_idx" ON "RetainedDecision"("contractId", "status");
CREATE INDEX IF NOT EXISTS "RetainedDecision_priorityLevel_idx" ON "RetainedDecision"("priorityLevel");
CREATE INDEX IF NOT EXISTS "RetainedDecision_status_idx" ON "RetainedDecision"("status");

CREATE TABLE IF NOT EXISTS "EnforcementCycle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "retainedDecisionId" TEXT NOT NULL,
  "cycleDate" DATETIME NOT NULL,
  "actionsTaken" JSONB NOT NULL,
  "contradictionsUpdated" JSONB NOT NULL,
  "outcomeDelta" REAL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EnforcementCycle_retainedDecisionId_fkey"
    FOREIGN KEY ("retainedDecisionId") REFERENCES "RetainedDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EnforcementCycle_retainedDecisionId_idx" ON "EnforcementCycle"("retainedDecisionId");
CREATE INDEX IF NOT EXISTS "EnforcementCycle_cycleDate_idx" ON "EnforcementCycle"("cycleDate");
CREATE INDEX IF NOT EXISTS "EnforcementCycle_retainedDecisionId_cycleDate_idx" ON "EnforcementCycle"("retainedDecisionId", "cycleDate");
