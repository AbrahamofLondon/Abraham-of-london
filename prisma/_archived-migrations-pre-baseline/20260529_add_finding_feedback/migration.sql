-- Migration: add_finding_feedback
-- Adds FindingFeedback table for durable per-finding reviewer dispositions.
-- Upserted per (runId, findingId) pair; authority over outputJson snapshot.

CREATE TABLE "finding_feedback" (
    "id"          TEXT NOT NULL,
    "runId"       TEXT NOT NULL,
    "findingId"   TEXT NOT NULL,
    "engineId"    TEXT,
    "moduleId"    TEXT,
    "disposition" TEXT NOT NULL,
    "note"        TEXT,
    "updatedBy"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finding_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "finding_feedback_runId_findingId_key" ON "finding_feedback"("runId", "findingId");
CREATE INDEX "finding_feedback_runId_idx"      ON "finding_feedback"("runId");
CREATE INDEX "finding_feedback_disposition_idx" ON "finding_feedback"("disposition");
CREATE INDEX "finding_feedback_moduleId_idx"   ON "finding_feedback"("moduleId");
CREATE INDEX "finding_feedback_engineId_idx"   ON "finding_feedback"("engineId");

ALTER TABLE "finding_feedback"
    ADD CONSTRAINT "finding_feedback_runId_fkey"
    FOREIGN KEY ("runId") REFERENCES "research_runs"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
