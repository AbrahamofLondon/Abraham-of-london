-- AI-adaptive decision authority fields
ALTER TABLE "DiagnosticDecisionObject" ADD COLUMN "aiExposureLevel" TEXT NOT NULL DEFAULT 'MODERATE';
ALTER TABLE "DiagnosticDecisionObject" ADD COLUMN "aiDisplacementRisk" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DiagnosticDecisionObject" ADD COLUMN "decisionVelocityScore" INTEGER NOT NULL DEFAULT 50;
CREATE INDEX IF NOT EXISTS "DiagnosticDecisionObject_aiExposureLevel_idx" ON "DiagnosticDecisionObject"("aiExposureLevel");
CREATE INDEX IF NOT EXISTS "DiagnosticDecisionObject_decisionVelocityScore_idx" ON "DiagnosticDecisionObject"("decisionVelocityScore");

ALTER TABLE "RetainedDecision" ADD COLUMN "aiLeverageAction" TEXT;

ALTER TABLE "EnforcementCycle" ADD COLUMN "aiDriftDelta" REAL NOT NULL DEFAULT 0;
ALTER TABLE "EnforcementCycle" ADD COLUMN "aiStatusSignal" TEXT NOT NULL DEFAULT 'PARITY HOLD';

ALTER TABLE "OutcomeVerificationRecord" ADD COLUMN "decisionVelocityDelta" REAL NOT NULL DEFAULT 0;
ALTER TABLE "OutcomeVerificationRecord" ADD COLUMN "aiCapabilityShift" REAL NOT NULL DEFAULT 0;
