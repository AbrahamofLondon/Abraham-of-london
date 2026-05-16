-- Materialised benchmark aggregate table.
--
-- This table is a write-through cache updated by the benchmark-context API route
-- when the cached aggregate is stale (older than 1 hour). It is NOT the source of
-- truth — the source of truth is AuditEvent (objectType=OUTCOME_CONTRIBUTION).
--
-- One row per assessmentKind, plus one row with key='__ALL__' for the global aggregate.
-- The key column uses '__ALL__' instead of NULL to avoid UNIQUE constraint issues
-- with null equality in PostgreSQL.

CREATE TABLE IF NOT EXISTS "benchmark_aggregates" (
    "id"                       TEXT NOT NULL,
    "key"                      TEXT NOT NULL,
    "assessmentKind"           TEXT,
    "n"                        INTEGER NOT NULL DEFAULT 0,
    "improved"                 INTEGER NOT NULL DEFAULT 0,
    "resolved"                 INTEGER NOT NULL DEFAULT 0,
    "unchanged"                INTEGER NOT NULL DEFAULT 0,
    "worsened"                 INTEGER NOT NULL DEFAULT 0,
    "abandoned"                INTEGER NOT NULL DEFAULT 0,
    "timeImmediate"            INTEGER NOT NULL DEFAULT 0,
    "timeShort"                INTEGER NOT NULL DEFAULT 0,
    "timeMedium"               INTEGER NOT NULL DEFAULT 0,
    "timeLong"                 INTEGER NOT NULL DEFAULT 0,
    "timeDidNotAct"            INTEGER NOT NULL DEFAULT 0,
    "findingAccurateTotal"     INTEGER NOT NULL DEFAULT 0,
    "findingAccurateTrue"      INTEGER NOT NULL DEFAULT 0,
    "recommendationUsefulTotal" INTEGER NOT NULL DEFAULT 0,
    "recommendationUsefulTrue"  INTEGER NOT NULL DEFAULT 0,
    "computedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benchmark_aggregates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "benchmark_aggregates_key_key"
    ON "benchmark_aggregates" ("key");

CREATE INDEX IF NOT EXISTS "benchmark_aggregates_assessmentKind_idx"
    ON "benchmark_aggregates" ("assessmentKind");

CREATE INDEX IF NOT EXISTS "benchmark_aggregates_computedAt_idx"
    ON "benchmark_aggregates" ("computedAt");
