-- AlterTable
ALTER TABLE "operator_pilot_intakes" ADD COLUMN "statusSecretHash" TEXT;
ALTER TABLE "operator_pilot_intakes" ADD COLUMN "statusSecretExpiresAt" TIMESTAMP(3);
ALTER TABLE "operator_pilot_intakes" ADD COLUMN "statusSecretRevokedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "operator_pilot_status_access_audits" (
    "id" TEXT NOT NULL,
    "intakeRef" TEXT,
    "attemptedHash" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_pilot_status_access_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operator_pilot_intakes_statusSecretHash_key" ON "operator_pilot_intakes"("statusSecretHash");
CREATE INDEX "operator_pilot_status_access_audits_intakeRef_idx" ON "operator_pilot_status_access_audits"("intakeRef");
CREATE INDEX "operator_pilot_status_access_audits_attemptedHash_idx" ON "operator_pilot_status_access_audits"("attemptedHash");
CREATE INDEX "operator_pilot_status_access_audits_createdAt_idx" ON "operator_pilot_status_access_audits"("createdAt");

-- AddForeignKey
ALTER TABLE "operator_pilot_status_access_audits" ADD CONSTRAINT "operator_pilot_status_access_audits_intakeRef_fkey" FOREIGN KEY ("intakeRef") REFERENCES "operator_pilot_intakes"("reference") ON DELETE SET NULL ON UPDATE CASCADE;