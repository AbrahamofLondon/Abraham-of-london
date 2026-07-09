-- Migration: 20260607_intelligence_spine_outcome_retainer_readiness
-- Adds:
--   1. intelligence_spines — canonical evidence spine for Boardroom Brief and paid products
--   2. BoardroomBriefOrder.spine_id — FK to IntelligenceSpine.spineId
--   3. decision_outcome_records — Return Brief 2.0 outcome loop
--   4. retainer_readiness_evaluations — automated readiness evaluation model

-- ── 1. IntelligenceSpine ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "intelligence_spines" (
  "id"                  TEXT          NOT NULL PRIMARY KEY,
  "spineId"             TEXT          NOT NULL UNIQUE,
  "sourceType"          TEXT          NOT NULL,
  "diagnosticId"        TEXT,
  "erRunId"             TEXT,
  "executiveReportId"   TEXT,
  "organisationId"      TEXT,
  "userId"              TEXT,
  "userEmail"           TEXT,
  "decisionSubject"     TEXT          NOT NULL,
  "decisionContext"     JSONB,
  "evidenceNodes"       JSONB         NOT NULL DEFAULT '[]',
  "authorityLevel"      TEXT          NOT NULL DEFAULT 'CANDIDATE',
  "isSample"            BOOLEAN       NOT NULL DEFAULT false,
  "qualifyingChecks"    JSONB,
  "inputSnapshotHash"   TEXT,
  "createdAt"           TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "retiredAt"           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "intelligence_spines_spineId_idx"         ON "intelligence_spines" ("spineId");
CREATE INDEX IF NOT EXISTS "intelligence_spines_sourceType_idx"       ON "intelligence_spines" ("sourceType");
CREATE INDEX IF NOT EXISTS "intelligence_spines_userId_idx"           ON "intelligence_spines" ("userId");
CREATE INDEX IF NOT EXISTS "intelligence_spines_userEmail_idx"        ON "intelligence_spines" ("userEmail");
CREATE INDEX IF NOT EXISTS "intelligence_spines_organisationId_idx"   ON "intelligence_spines" ("organisationId");
CREATE INDEX IF NOT EXISTS "intelligence_spines_authorityLevel_idx"   ON "intelligence_spines" ("authorityLevel");
CREATE INDEX IF NOT EXISTS "intelligence_spines_isSample_idx"         ON "intelligence_spines" ("isSample");
CREATE INDEX IF NOT EXISTS "intelligence_spines_createdAt_idx"        ON "intelligence_spines" ("createdAt");

-- ── 2. BoardroomBriefOrder.spine_id ─────────────────────────────────────────

ALTER TABLE "boardroom_brief_orders"
  ADD COLUMN IF NOT EXISTS "spine_id" TEXT REFERENCES "intelligence_spines" ("spineId") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "boardroom_brief_orders_spine_id_idx"
  ON "boardroom_brief_orders" ("spine_id");

-- ── 3. DecisionOutcomeRecord ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "decision_outcome_records" (
  "id"                          TEXT          NOT NULL PRIMARY KEY,
  "decisionInstrumentRunId"     TEXT,
  "boardroomDossierId"          TEXT,
  "decisionObjectId"            TEXT,
  "strategySessionId"           TEXT,
  "submittedByEmail"            TEXT,
  "submittedByUserId"           TEXT,
  "outcomeClass"                TEXT          NOT NULL,
  "outcomeDetail"               TEXT,
  "ownerCorrect"                BOOLEAN,
  "evidenceMissing"             BOOLEAN       NOT NULL DEFAULT false,
  "evidenceMissingNote"         TEXT,
  "whatChanged"                 TEXT,
  "carryForward"                TEXT,
  "decisionDeadline"            TIMESTAMPTZ,
  "outcomeDate"                 TIMESTAMPTZ,
  "memorySummary"               TEXT,
  "reviewedByAdmin"             BOOLEAN       NOT NULL DEFAULT false,
  "reviewedAt"                  TIMESTAMPTZ,
  "createdAt"                   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "updatedAt"                   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "decision_outcome_records_runId_idx"
  ON "decision_outcome_records" ("decisionInstrumentRunId");
CREATE INDEX IF NOT EXISTS "decision_outcome_records_dossierId_idx"
  ON "decision_outcome_records" ("boardroomDossierId");
CREATE INDEX IF NOT EXISTS "decision_outcome_records_decisionObjectId_idx"
  ON "decision_outcome_records" ("decisionObjectId");
CREATE INDEX IF NOT EXISTS "decision_outcome_records_outcomeClass_idx"
  ON "decision_outcome_records" ("outcomeClass");
CREATE INDEX IF NOT EXISTS "decision_outcome_records_email_idx"
  ON "decision_outcome_records" ("submittedByEmail");
CREATE INDEX IF NOT EXISTS "decision_outcome_records_createdAt_idx"
  ON "decision_outcome_records" ("createdAt");

-- ── 4. RetainerReadinessEvaluation ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "retainer_readiness_evaluations" (
  "id"                        TEXT          NOT NULL PRIMARY KEY,
  "organisationId"            TEXT,
  "userEmail"                 TEXT,
  "durableMemoryPresent"      BOOLEAN       NOT NULL DEFAULT false,
  "recurringDecisionPattern"  BOOLEAN       NOT NULL DEFAULT false,
  "outcomeHistoryPresent"     BOOLEAN       NOT NULL DEFAULT false,
  "repeatedHighRisk"          BOOLEAN       NOT NULL DEFAULT false,
  "evidenceQualityScore"      FLOAT         NOT NULL DEFAULT 0,
  "organisationSignalScore"   FLOAT         NOT NULL DEFAULT 0,
  "overallReadinessScore"     FLOAT         NOT NULL DEFAULT 0,
  "readinessClass"            TEXT          NOT NULL DEFAULT 'NOT_READY',
  "evaluatorNotes"            TEXT,
  "adminApprovalRequired"     BOOLEAN       NOT NULL DEFAULT true,
  "adminApprovedAt"           TIMESTAMPTZ,
  "adminApprovedBy"           TEXT,
  "evidenceSourceIds"         JSONB         NOT NULL DEFAULT '[]',
  "createdAt"                 TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "updatedAt"                 TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "retainer_readiness_organisationId_idx"
  ON "retainer_readiness_evaluations" ("organisationId");
CREATE INDEX IF NOT EXISTS "retainer_readiness_userEmail_idx"
  ON "retainer_readiness_evaluations" ("userEmail");
CREATE INDEX IF NOT EXISTS "retainer_readiness_class_idx"
  ON "retainer_readiness_evaluations" ("readinessClass");
CREATE INDEX IF NOT EXISTS "retainer_readiness_createdAt_idx"
  ON "retainer_readiness_evaluations" ("createdAt");
