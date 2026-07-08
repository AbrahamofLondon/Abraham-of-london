-- Migration: 20260607_add_instrument_run_oversight_cycle
-- Adds DecisionInstrumentRun and OversightReviewCycle models.
--
-- PostgreSQL (Neon) — uses TIMESTAMPTZ, TEXT, BOOLEAN, INTEGER.
-- Do NOT use TIMESTAMPTZ, TINYINT, or SQLite-specific types.

-- ─── DecisionInstrumentRun ────────────────────────────────────────────────────

CREATE TABLE "decision_instrument_runs" (
    "id"                  TEXT NOT NULL,
    "instrumentSlug"      TEXT NOT NULL,
    "userId"              TEXT,
    "userEmail"           TEXT,
    "entitlementSlug"     TEXT NOT NULL,
    "entitlementVerified" BOOLEAN NOT NULL DEFAULT false,
    "inputSnapshotHash"   TEXT,
    "status"              TEXT NOT NULL DEFAULT 'STARTED',
    "scoreJson"           JSONB,
    "artifactState"       TEXT NOT NULL DEFAULT 'NONE',
    "artifactUrl"         TEXT,
    "artifactHash"        TEXT,
    "nextRouteSlug"       TEXT,
    "runDurationMs"       INTEGER,
    "errorMessage"        TEXT,
    "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "completedAt"         TIMESTAMPTZ,

    CONSTRAINT "decision_instrument_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "decision_instrument_runs_instrumentSlug_idx" ON "decision_instrument_runs"("instrumentSlug");
CREATE INDEX "decision_instrument_runs_userId_idx" ON "decision_instrument_runs"("userId");
CREATE INDEX "decision_instrument_runs_userEmail_idx" ON "decision_instrument_runs"("userEmail");
CREATE INDEX "decision_instrument_runs_status_idx" ON "decision_instrument_runs"("status");
CREATE INDEX "decision_instrument_runs_entitlementSlug_idx" ON "decision_instrument_runs"("entitlementSlug");
CREATE INDEX "decision_instrument_runs_createdAt_idx" ON "decision_instrument_runs"("createdAt");

-- ─── OversightReviewCycle ─────────────────────────────────────────────────────

CREATE TABLE "oversight_review_cycles" (
    "id"                  TEXT NOT NULL,
    "contractId"          TEXT NOT NULL,
    "cycleNumber"         INTEGER NOT NULL,
    "periodStart"         TIMESTAMPTZ NOT NULL,
    "periodEnd"           TIMESTAMPTZ NOT NULL,
    "status"              TEXT NOT NULL DEFAULT 'OPEN',
    "reviewedBy"          TEXT,
    "reviewedAt"          TIMESTAMPTZ,
    "driftScore"          DOUBLE PRECISION,
    "driftCategory"       TEXT,
    "clientHealthStatus"  TEXT NOT NULL DEFAULT 'UNKNOWN',
    "interventionCount"   INTEGER NOT NULL DEFAULT 0,
    "interventionLog"     JSONB NOT NULL DEFAULT '[]',
    "outcomeSummary"      TEXT,
    "clientNotes"         TEXT,
    "internalNotes"       TEXT,
    "nextCycleDate"       TIMESTAMPTZ,
    "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "oversight_review_cycles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "oversight_review_cycles_contractId_cycleNumber_key" UNIQUE ("contractId", "cycleNumber")
);

CREATE INDEX "oversight_review_cycles_contractId_idx" ON "oversight_review_cycles"("contractId");
CREATE INDEX "oversight_review_cycles_status_idx" ON "oversight_review_cycles"("status");
CREATE INDEX "oversight_review_cycles_periodStart_idx" ON "oversight_review_cycles"("periodStart");
CREATE INDEX "oversight_review_cycles_clientHealthStatus_idx" ON "oversight_review_cycles"("clientHealthStatus");
