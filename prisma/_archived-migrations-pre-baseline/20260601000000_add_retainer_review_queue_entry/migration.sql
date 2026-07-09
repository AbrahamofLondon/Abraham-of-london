-- Migration: add_retainer_review_queue_entry
-- Generated manually because shadow DB has a pre-existing broken migration
-- (20260413_manual_expand_access_tier_and_memberstatus_paused / P1014).
-- Deploy command: pnpm exec prisma migrate deploy

CREATE TABLE "RetainerReviewQueueEntry" (
    "id"                  TEXT         NOT NULL,
    "caseId"              TEXT         NOT NULL,
    "accountId"           TEXT,
    "orgId"               TEXT,
    "readinessStatus"     TEXT         NOT NULL,
    "reasons"             JSONB        NOT NULL DEFAULT '[]',
    "availableSignals"    JSONB        NOT NULL DEFAULT '[]',
    "missingRequirements" JSONB        NOT NULL DEFAULT '[]',
    "status"              TEXT         NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt"          TIMESTAMP(3),
    "reviewedBy"          TEXT,
    "reviewNote"          TEXT,

    CONSTRAINT "RetainerReviewQueueEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RetainerReviewQueueEntry_caseId_idx"           ON "RetainerReviewQueueEntry"("caseId");
CREATE INDEX "RetainerReviewQueueEntry_accountId_idx"        ON "RetainerReviewQueueEntry"("accountId");
CREATE INDEX "RetainerReviewQueueEntry_orgId_idx"            ON "RetainerReviewQueueEntry"("orgId");
CREATE INDEX "RetainerReviewQueueEntry_status_idx"           ON "RetainerReviewQueueEntry"("status");
CREATE INDEX "RetainerReviewQueueEntry_readinessStatus_idx"  ON "RetainerReviewQueueEntry"("readinessStatus");
