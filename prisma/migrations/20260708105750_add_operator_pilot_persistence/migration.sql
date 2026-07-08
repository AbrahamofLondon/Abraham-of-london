-- CreateTable
CREATE TABLE "operator_pilot_intakes" (
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "intakeJson" JSONB NOT NULL,
    "qualificationJson" JSONB NOT NULL,
    "qualificationStatus" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL,
    "owner" TEXT,
    "operatorNote" TEXT,
    "requestedInformation" TEXT,
    "finalDecision" TEXT,
    "intakeFingerprint" TEXT NOT NULL,

    CONSTRAINT "operator_pilot_intakes_pkey" PRIMARY KEY ("reference")
);

-- CreateTable
CREATE TABLE "operator_pilot_transitions" (
    "id" TEXT NOT NULL,
    "intakeRef" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "actorEmail" TEXT,
    "humanAuthority" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_pilot_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operator_pilot_intakes_reviewStatus_idx" ON "operator_pilot_intakes"("reviewStatus");

-- CreateIndex
CREATE INDEX "operator_pilot_intakes_intakeFingerprint_idx" ON "operator_pilot_intakes"("intakeFingerprint");

-- CreateIndex
CREATE INDEX "operator_pilot_transitions_intakeRef_idx" ON "operator_pilot_transitions"("intakeRef");

-- AddForeignKey
ALTER TABLE "operator_pilot_transitions" ADD CONSTRAINT "operator_pilot_transitions_intakeRef_fkey" FOREIGN KEY ("intakeRef") REFERENCES "operator_pilot_intakes"("reference") ON DELETE CASCADE ON UPDATE CASCADE;
