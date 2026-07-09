-- Migration: add_performance_baselines
-- Adds PerformanceBaseline table for server-side durable engine baselines.
-- One baseline per engineId (@unique); complements localStorage local baselines.

CREATE TABLE "performance_baselines" (
    "id"          TEXT NOT NULL,
    "engineId"    TEXT NOT NULL,
    "baselineMs"  DOUBLE PRECISION NOT NULL,
    "p95Ms"       DOUBLE PRECISION NOT NULL,
    "sampleSize"  INTEGER NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "notes"       TEXT,
    "updatedBy"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_baselines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "performance_baselines_engineId_key" ON "performance_baselines"("engineId");
CREATE INDEX "performance_baselines_engineId_idx" ON "performance_baselines"("engineId");
