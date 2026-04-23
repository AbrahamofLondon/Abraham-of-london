-- Enterprise-capable foundation: dependency graph, stakeholders, audit, playbooks, telemetry
CREATE TABLE IF NOT EXISTS "DecisionDependency" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "parentDecisionId" TEXT NOT NULL,
  "childDecisionId" TEXT NOT NULL,
  "relationshipType" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DecisionDependency_parentDecisionId_fkey"
    FOREIGN KEY ("parentDecisionId") REFERENCES "DiagnosticDecisionObject"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DecisionDependency_childDecisionId_fkey"
    FOREIGN KEY ("childDecisionId") REFERENCES "DiagnosticDecisionObject"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DecisionDependency_parentDecisionId_childDecisionId_relationshipType_key" ON "DecisionDependency"("parentDecisionId", "childDecisionId", "relationshipType");
CREATE INDEX IF NOT EXISTS "DecisionDependency_parentDecisionId_idx" ON "DecisionDependency"("parentDecisionId");
CREATE INDEX IF NOT EXISTS "DecisionDependency_childDecisionId_idx" ON "DecisionDependency"("childDecisionId");
CREATE INDEX IF NOT EXISTS "DecisionDependency_relationshipType_idx" ON "DecisionDependency"("relationshipType");

CREATE TABLE IF NOT EXISTS "DecisionStakeholder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "decisionObjectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "function" TEXT NOT NULL,
  "influenceLevel" TEXT NOT NULL,
  "alignmentState" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DecisionStakeholder_decisionObjectId_fkey"
    FOREIGN KEY ("decisionObjectId") REFERENCES "DiagnosticDecisionObject"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "DecisionStakeholder_decisionObjectId_idx" ON "DecisionStakeholder"("decisionObjectId");
CREATE INDEX IF NOT EXISTS "DecisionStakeholder_influenceLevel_idx" ON "DecisionStakeholder"("influenceLevel");
CREATE INDEX IF NOT EXISTS "DecisionStakeholder_alignmentState_idx" ON "DecisionStakeholder"("alignmentState");

CREATE TABLE IF NOT EXISTS "StakeholderPosition" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "stakeholderId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "confidence" REAL NOT NULL DEFAULT 0.5,
  "contradictionFlag" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StakeholderPosition_stakeholderId_fkey"
    FOREIGN KEY ("stakeholderId") REFERENCES "DecisionStakeholder"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "StakeholderPosition_stakeholderId_idx" ON "StakeholderPosition"("stakeholderId");
CREATE INDEX IF NOT EXISTS "StakeholderPosition_contradictionFlag_idx" ON "StakeholderPosition"("contradictionFlag");
CREATE INDEX IF NOT EXISTS "StakeholderPosition_createdAt_idx" ON "StakeholderPosition"("createdAt");

CREATE TABLE IF NOT EXISTS "AuditEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorType" TEXT NOT NULL,
  "actorId" TEXT,
  "objectType" TEXT NOT NULL,
  "objectId" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AuditEvent_actorType_idx" ON "AuditEvent"("actorType");
CREATE INDEX IF NOT EXISTS "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");
CREATE INDEX IF NOT EXISTS "AuditEvent_objectType_objectId_idx" ON "AuditEvent"("objectType", "objectId");
CREATE INDEX IF NOT EXISTS "AuditEvent_actionType_idx" ON "AuditEvent"("actionType");
CREATE INDEX IF NOT EXISTS "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

CREATE TABLE IF NOT EXISTS "EnforcementPlaybook" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "triggerPattern" TEXT NOT NULL,
  "actionSequence" JSONB NOT NULL,
  "expectedOutcome" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "EnforcementPlaybook_triggerPattern_idx" ON "EnforcementPlaybook"("triggerPattern");
CREATE INDEX IF NOT EXISTS "EnforcementPlaybook_status_idx" ON "EnforcementPlaybook"("status");

CREATE TABLE IF NOT EXISTS "PlaybookApplication" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "playbookId" TEXT NOT NULL,
  "retainedDecisionId" TEXT NOT NULL,
  "appliedBy" TEXT,
  "status" TEXT NOT NULL DEFAULT 'APPLIED',
  "outcomeDelta" REAL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlaybookApplication_playbookId_fkey"
    FOREIGN KEY ("playbookId") REFERENCES "EnforcementPlaybook"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PlaybookApplication_retainedDecisionId_fkey"
    FOREIGN KEY ("retainedDecisionId") REFERENCES "RetainedDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PlaybookApplication_playbookId_idx" ON "PlaybookApplication"("playbookId");
CREATE INDEX IF NOT EXISTS "PlaybookApplication_retainedDecisionId_idx" ON "PlaybookApplication"("retainedDecisionId");
CREATE INDEX IF NOT EXISTS "PlaybookApplication_status_idx" ON "PlaybookApplication"("status");
CREATE INDEX IF NOT EXISTS "PlaybookApplication_createdAt_idx" ON "PlaybookApplication"("createdAt");

CREATE TABLE IF NOT EXISTS "FoundationTelemetryEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organisationId" TEXT,
  "contractId" TEXT,
  "decisionObjectId" TEXT,
  "eventType" TEXT NOT NULL,
  "value" REAL,
  "metadata" JSONB,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "FoundationTelemetryEvent_organisationId_idx" ON "FoundationTelemetryEvent"("organisationId");
CREATE INDEX IF NOT EXISTS "FoundationTelemetryEvent_contractId_idx" ON "FoundationTelemetryEvent"("contractId");
CREATE INDEX IF NOT EXISTS "FoundationTelemetryEvent_decisionObjectId_idx" ON "FoundationTelemetryEvent"("decisionObjectId");
CREATE INDEX IF NOT EXISTS "FoundationTelemetryEvent_eventType_idx" ON "FoundationTelemetryEvent"("eventType");
CREATE INDEX IF NOT EXISTS "FoundationTelemetryEvent_createdAt_idx" ON "FoundationTelemetryEvent"("createdAt");
