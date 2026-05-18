-- Security assurance request intake / review queue

CREATE TABLE IF NOT EXISTS "security_assurance_requests" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "organisation" TEXT,
  "role" TEXT,
  "requestedMaterial" TEXT NOT NULL,
  "procurementStage" TEXT,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "decisionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "security_assurance_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "security_assurance_requests_email_idx"
  ON "security_assurance_requests"("email");

CREATE INDEX IF NOT EXISTS "security_assurance_requests_requestedMaterial_idx"
  ON "security_assurance_requests"("requestedMaterial");

CREATE INDEX IF NOT EXISTS "security_assurance_requests_status_idx"
  ON "security_assurance_requests"("status");

CREATE INDEX IF NOT EXISTS "security_assurance_requests_createdAt_idx"
  ON "security_assurance_requests"("createdAt");
