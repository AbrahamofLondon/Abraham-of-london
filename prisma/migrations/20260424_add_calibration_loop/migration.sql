-- Calibration Loop: Prediction → Outcome → Calibration

CREATE TABLE IF NOT EXISTS "calibration_states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelKey" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "calibrationData" JSONB NOT NULL DEFAULT '{}',
    "outcomeCount" INTEGER NOT NULL DEFAULT 0,
    "accuracyScore" DOUBLE PRECISION,
    "biasScore" DOUBLE PRECISION,
    "lastCalibratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "calibration_states_modelKey_modelVersion_key" ON "calibration_states"("modelKey", "modelVersion");
CREATE INDEX IF NOT EXISTS "calibration_states_modelKey_idx" ON "calibration_states"("modelKey");
CREATE INDEX IF NOT EXISTS "calibration_states_status_idx" ON "calibration_states"("status");

CREATE TABLE IF NOT EXISTS "calibration_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionKey" TEXT NOT NULL,
    "modelKey" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "predictionSnapshot" JSONB NOT NULL DEFAULT '{}',
    "outcomeSnapshot" JSONB NOT NULL DEFAULT '{}',
    "predictionError" DOUBLE PRECISION,
    "adjustmentProposal" JSONB,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "calibration_events_modelKey_modelVersion_idx" ON "calibration_events"("modelKey", "modelVersion");
CREATE INDEX IF NOT EXISTS "calibration_events_sessionKey_idx" ON "calibration_events"("sessionKey");
CREATE INDEX IF NOT EXISTS "calibration_events_applied_idx" ON "calibration_events"("applied");
