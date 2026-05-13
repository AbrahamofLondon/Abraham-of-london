CREATE TABLE "behavioral_signal_snapshots" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organisationId" TEXT,
  "accountId" TEXT,
  "source" TEXT NOT NULL,
  "sourceLabel" TEXT,
  "evidencePosture" TEXT,
  "signalKey" TEXT NOT NULL,
  "signalValueJson" JSONB NOT NULL,
  "confidence" DOUBLE PRECISION,
  "evidenceWindowStart" TIMESTAMP(3),
  "evidenceWindowEnd" TIMESTAMP(3),
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "integrationConnectedAt" TIMESTAMP(3),
  "rawCountBasisJson" JSONB,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "behavioral_signal_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "behavioral_signal_snapshots_userId_generatedAt_idx"
  ON "behavioral_signal_snapshots"("userId", "generatedAt");

CREATE INDEX "behavioral_signal_snapshots_userId_source_signalKey_idx"
  ON "behavioral_signal_snapshots"("userId", "source", "signalKey");

CREATE INDEX "behavioral_signal_snapshots_userId_source_signalKey_generatedAt_idx"
  ON "behavioral_signal_snapshots"("userId", "source", "signalKey", "generatedAt");

CREATE INDEX "behavioral_signal_snapshots_organisationId_generatedAt_idx"
  ON "behavioral_signal_snapshots"("organisationId", "generatedAt");

CREATE INDEX "behavioral_signal_snapshots_accountId_generatedAt_idx"
  ON "behavioral_signal_snapshots"("accountId", "generatedAt");
