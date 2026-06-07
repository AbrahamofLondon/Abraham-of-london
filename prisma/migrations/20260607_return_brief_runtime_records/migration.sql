-- Operation 10/10: durable Return Brief request/response and outcome pattern observation records.

CREATE TABLE IF NOT EXISTS "return_brief_requests" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requestKey" TEXT NOT NULL UNIQUE,
  "outcomeHypothesisId" TEXT,
  "productCode" TEXT NOT NULL,
  "sourceEntityType" TEXT NOT NULL,
  "sourceEntityId" TEXT NOT NULL,
  "userEmail" TEXT,
  "userId" TEXT,
  "dueAt" TIMESTAMPTZ NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "sentAt" TIMESTAMPTZ,
  "submittedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "return_brief_requests_outcomeHypothesisId_idx" ON "return_brief_requests" ("outcomeHypothesisId");
CREATE INDEX IF NOT EXISTS "return_brief_requests_productCode_idx" ON "return_brief_requests" ("productCode");
CREATE INDEX IF NOT EXISTS "return_brief_requests_source_idx" ON "return_brief_requests" ("sourceEntityType", "sourceEntityId");
CREATE INDEX IF NOT EXISTS "return_brief_requests_userEmail_idx" ON "return_brief_requests" ("userEmail");
CREATE INDEX IF NOT EXISTS "return_brief_requests_status_idx" ON "return_brief_requests" ("status");
CREATE INDEX IF NOT EXISTS "return_brief_requests_dueAt_idx" ON "return_brief_requests" ("dueAt");

CREATE TABLE IF NOT EXISTS "return_brief_responses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requestId" TEXT,
  "decisionOutcomeRecordId" TEXT,
  "submittedByEmail" TEXT,
  "outcomeClass" TEXT NOT NULL,
  "responsePayload" JSONB NOT NULL DEFAULT '{}',
  "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "return_brief_responses_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "return_brief_requests" ("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "return_brief_responses_requestId_idx" ON "return_brief_responses" ("requestId");
CREATE INDEX IF NOT EXISTS "return_brief_responses_decisionOutcomeRecordId_idx" ON "return_brief_responses" ("decisionOutcomeRecordId");
CREATE INDEX IF NOT EXISTS "return_brief_responses_submittedByEmail_idx" ON "return_brief_responses" ("submittedByEmail");
CREATE INDEX IF NOT EXISTS "return_brief_responses_outcomeClass_idx" ON "return_brief_responses" ("outcomeClass");
CREATE INDEX IF NOT EXISTS "return_brief_responses_createdAt_idx" ON "return_brief_responses" ("createdAt");

CREATE TABLE IF NOT EXISTS "outcome_pattern_observations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "decisionOutcomeRecordId" TEXT,
  "userEmail" TEXT,
  "patternObservationId" TEXT,
  "patternType" TEXT NOT NULL,
  "riskOfRepeat" TEXT,
  "observationSummary" TEXT NOT NULL,
  "sourceRunIds" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "outcome_pattern_observations_decisionOutcomeRecordId_idx" ON "outcome_pattern_observations" ("decisionOutcomeRecordId");
CREATE INDEX IF NOT EXISTS "outcome_pattern_observations_userEmail_idx" ON "outcome_pattern_observations" ("userEmail");
CREATE INDEX IF NOT EXISTS "outcome_pattern_observations_patternObservationId_idx" ON "outcome_pattern_observations" ("patternObservationId");
CREATE INDEX IF NOT EXISTS "outcome_pattern_observations_patternType_idx" ON "outcome_pattern_observations" ("patternType");
CREATE INDEX IF NOT EXISTS "outcome_pattern_observations_riskOfRepeat_idx" ON "outcome_pattern_observations" ("riskOfRepeat");
CREATE INDEX IF NOT EXISTS "outcome_pattern_observations_createdAt_idx" ON "outcome_pattern_observations" ("createdAt");
