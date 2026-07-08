-- Canonical diagnostic evidence graph and durable decision object.

CREATE TABLE "DiagnosticEvidenceNode" (
  "id" TEXT NOT NULL,
  "journeyId" TEXT,
  "assessmentId" TEXT,
  "sessionId" TEXT,
  "userId" TEXT,
  "email" TEXT,
  "sourceStage" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "evidenceText" TEXT,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "severity" TEXT NOT NULL DEFAULT 'medium',
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DiagnosticEvidenceNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiagnosticDecisionObject" (
  "id" TEXT NOT NULL,
  "journeyId" TEXT,
  "decisionKey" TEXT,
  "sessionId" TEXT,
  "userId" TEXT,
  "email" TEXT,
  "sourceStage" TEXT NOT NULL,
  "decisionText" TEXT NOT NULL,
  "constraintText" TEXT,
  "priorAttemptText" TEXT,
  "costOfDelayText" TEXT,
  "stakeholderText" TEXT,
  "affectedDomain" TEXT,
  "normalized" JSONB,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DiagnosticDecisionObject_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DiagnosticEvidenceNode_journeyId_idx" ON "DiagnosticEvidenceNode"("journeyId");
CREATE INDEX "DiagnosticEvidenceNode_email_idx" ON "DiagnosticEvidenceNode"("email");
CREATE INDEX "DiagnosticEvidenceNode_sourceStage_idx" ON "DiagnosticEvidenceNode"("sourceStage");
CREATE INDEX "DiagnosticEvidenceNode_kind_idx" ON "DiagnosticEvidenceNode"("kind");
CREATE INDEX "DiagnosticEvidenceNode_severity_idx" ON "DiagnosticEvidenceNode"("severity");
CREATE INDEX "DiagnosticEvidenceNode_createdAt_idx" ON "DiagnosticEvidenceNode"("createdAt");

CREATE INDEX "DiagnosticDecisionObject_journeyId_idx" ON "DiagnosticDecisionObject"("journeyId");
CREATE INDEX "DiagnosticDecisionObject_email_idx" ON "DiagnosticDecisionObject"("email");
CREATE INDEX "DiagnosticDecisionObject_decisionKey_idx" ON "DiagnosticDecisionObject"("decisionKey");
CREATE INDEX "DiagnosticDecisionObject_sourceStage_idx" ON "DiagnosticDecisionObject"("sourceStage");
CREATE INDEX "DiagnosticDecisionObject_createdAt_idx" ON "DiagnosticDecisionObject"("createdAt");

ALTER TABLE "DiagnosticEvidenceNode"
  ADD CONSTRAINT "DiagnosticEvidenceNode_journeyId_fkey"
  FOREIGN KEY ("journeyId") REFERENCES "DiagnosticJourney"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiagnosticDecisionObject"
  ADD CONSTRAINT "DiagnosticDecisionObject_journeyId_fkey"
  FOREIGN KEY ("journeyId") REFERENCES "DiagnosticJourney"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
