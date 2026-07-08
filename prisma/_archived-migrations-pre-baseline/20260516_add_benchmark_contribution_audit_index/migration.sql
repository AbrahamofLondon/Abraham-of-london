-- Partial index to accelerate public benchmark aggregation over anonymised outcome contributions.
-- Only indexes the specific subset of AuditEvent rows that are contribution records.
-- This makes the GROUP BY aggregate query on AuditEvent substantially cheaper.
--
-- Table: "AuditEvent" (Prisma default, no @@map override)
-- Columns: "objectType", "actionType", "createdAt" (camelCase — Prisma default)

CREATE INDEX IF NOT EXISTS "idx_audit_event_outcome_contribution_benchmark"
ON "AuditEvent" ("objectType", "actionType", "createdAt" DESC)
WHERE "objectType" = 'OUTCOME_CONTRIBUTION'
  AND "actionType" = 'CONTRIBUTED';
