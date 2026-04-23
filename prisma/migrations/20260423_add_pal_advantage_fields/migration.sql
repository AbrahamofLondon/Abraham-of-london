-- Proactive Advantage Layer — schema extensions

-- Forward terrain state on decision objects
ALTER TABLE "DiagnosticDecisionObject" ADD COLUMN "forwardTerrainState" TEXT NOT NULL DEFAULT 'STABLE';

-- Advantage tracking on enforcement cycles
ALTER TABLE "EnforcementCycle" ADD COLUMN "advantageDelta" REAL NOT NULL DEFAULT 0;
ALTER TABLE "EnforcementCycle" ADD COLUMN "advantageSignal" TEXT NOT NULL DEFAULT 'PARITY';

-- Competitive position tracking on outcome verification
ALTER TABLE "OutcomeVerificationRecord" ADD COLUMN "competitivePositionShift" REAL NOT NULL DEFAULT 0;
ALTER TABLE "OutcomeVerificationRecord" ADD COLUMN "timeToAdvantage" REAL NOT NULL DEFAULT 0;
