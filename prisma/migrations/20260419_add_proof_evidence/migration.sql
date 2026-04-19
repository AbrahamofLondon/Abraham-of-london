CREATE TABLE IF NOT EXISTS "proof_evidence" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceStage" TEXT NOT NULL,
  "proofType" TEXT NOT NULL,
  "routeResultType" TEXT,
  "accuracyScore" TEXT,
  "usefulnessScore" TEXT,
  "nextStepChanged" BOOLEAN,
  "actionIntent" TEXT,
  "outcomeCategory" TEXT,
  "mostAccuratePart" TEXT,
  "paidSpecificity" TEXT,
  "consequenceClear" BOOLEAN,
  "justifiedAction" BOOLEAN,
  "decisionClarity" TEXT,
  "nextMoveClear" BOOLEAN,
  "freeTextRaw" TEXT,
  "anonymisedSummary" TEXT,
  "displayLabel" TEXT,
  "userType" TEXT,
  "organisationType" TEXT,
  "sourceOrigin" TEXT,
  "isPaidStage" BOOLEAN NOT NULL DEFAULT false,
  "followupAt" DATETIME,
  "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "displayStatus" TEXT NOT NULL DEFAULT 'HIDDEN',
  "sourceKind" TEXT NOT NULL DEFAULT 'SELF_REPORTED',
  "adminNotes" TEXT,
  "metadataJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "proof_evidence_sourceStage_createdAt_idx" ON "proof_evidence"("sourceStage", "createdAt");
CREATE INDEX IF NOT EXISTS "proof_evidence_proofType_createdAt_idx" ON "proof_evidence"("proofType", "createdAt");
CREATE INDEX IF NOT EXISTS "proof_evidence_approvalStatus_displayStatus_idx" ON "proof_evidence"("approvalStatus", "displayStatus");
CREATE INDEX IF NOT EXISTS "proof_evidence_followupAt_idx" ON "proof_evidence"("followupAt");
