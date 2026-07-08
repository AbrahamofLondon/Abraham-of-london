-- Add outbound publish ledger, scheduler lock, and scheduler run tables
-- Migration: 20260522_add_outbound_publish_ledger_and_scheduler
--
-- Creates:
--   outbound_publish_ledger  — Durable, idempotent publish record for all providers
--   scheduler_locks         — Distributed lock for the outbound scheduler
--   scheduler_runs          — Records of scheduler runs for operator visibility

-- CreateTable: outbound_publish_ledger
CREATE TABLE "outbound_publish_ledger" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "outboundItemId" TEXT NOT NULL,
    "campaign" TEXT,
    "assetSlug" TEXT NOT NULL,
    "sourcePath" TEXT,
    "scheduledFor" TEXT,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorEmailHash" TEXT,
    "status" TEXT NOT NULL,
    "providerPostId" TEXT,
    "providerPostUrl" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "syncTargetsJson" TEXT,
    "errorCode" TEXT,
    "safeMessage" TEXT,
    "forceRepublish" BOOLEAN NOT NULL DEFAULT false,
    "forceRepublishActorId" TEXT,
    "forceRepublishNote" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "outbound_publish_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: outbound_publish_ledger indexes
CREATE INDEX "outbound_publish_ledger_provider_idx" ON "outbound_publish_ledger"("provider");
CREATE INDEX "outbound_publish_ledger_outboundItemId_idx" ON "outbound_publish_ledger"("outboundItemId");
CREATE INDEX "outbound_publish_ledger_assetSlug_idx" ON "outbound_publish_ledger"("assetSlug");
CREATE INDEX "outbound_publish_ledger_status_idx" ON "outbound_publish_ledger"("status");
CREATE INDEX "outbound_publish_ledger_createdAt_idx" ON "outbound_publish_ledger"("createdAt");
CREATE INDEX "outbound_publish_ledger_idempotencyKey_idx" ON "outbound_publish_ledger"("idempotencyKey");
CREATE INDEX "outbound_publish_ledger_source_idx" ON "outbound_publish_ledger"("source");

-- Unique constraint on idempotencyKey ensures exclusive slot claiming
CREATE UNIQUE INDEX "outbound_publish_ledger_idempotencyKey_key" ON "outbound_publish_ledger"("idempotencyKey");

-- CreateTable: scheduler_locks
CREATE TABLE "scheduler_locks" (
    "id" TEXT NOT NULL,
    "lockKey" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "holder" TEXT,
    "metadata" TEXT,

    CONSTRAINT "scheduler_locks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: scheduler_locks indexes
CREATE UNIQUE INDEX "scheduler_locks_lockKey_key" ON "scheduler_locks"("lockKey");
CREATE INDEX "scheduler_locks_lockKey_idx" ON "scheduler_locks"("lockKey");
CREATE INDEX "scheduler_locks_expiresAt_idx" ON "scheduler_locks"("expiresAt");

-- CreateTable: scheduler_runs
CREATE TABLE "scheduler_runs" (
    "id" TEXT NOT NULL,
    "runKey" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT,
    "campaign" TEXT,
    "status" TEXT NOT NULL,
    "scannedCount" INTEGER NOT NULL DEFAULT 0,
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "publishedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduler_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: scheduler_runs indexes
CREATE UNIQUE INDEX "scheduler_runs_runKey_key" ON "scheduler_runs"("runKey");
CREATE INDEX "scheduler_runs_runKey_idx" ON "scheduler_runs"("runKey");
CREATE INDEX "scheduler_runs_source_idx" ON "scheduler_runs"("source");
CREATE INDEX "scheduler_runs_status_idx" ON "scheduler_runs"("status");
CREATE INDEX "scheduler_runs_startedAt_idx" ON "scheduler_runs"("startedAt");