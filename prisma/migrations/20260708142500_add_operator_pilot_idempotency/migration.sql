CREATE TABLE IF NOT EXISTS "operator_pilot_submission_idempotency" (
    "id" TEXT NOT NULL,
    "idempotencyHash" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "intakeRef" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_pilot_submission_idempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "operator_pilot_submission_idempotency_idempotencyHash_key" ON "operator_pilot_submission_idempotency"("idempotencyHash");
CREATE INDEX IF NOT EXISTS "operator_pilot_submission_idempotency_intakeRef_idx" ON "operator_pilot_submission_idempotency"("intakeRef");
CREATE INDEX IF NOT EXISTS "operator_pilot_submission_idempotency_expiresAt_idx" ON "operator_pilot_submission_idempotency"("expiresAt");

ALTER TABLE "operator_pilot_submission_idempotency"
  ADD CONSTRAINT "operator_pilot_submission_idempotency_intakeRef_fkey"
  FOREIGN KEY ("intakeRef") REFERENCES "operator_pilot_intakes"("reference") ON DELETE CASCADE ON UPDATE CASCADE;