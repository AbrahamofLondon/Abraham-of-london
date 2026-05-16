CREATE TABLE IF NOT EXISTS "case_share_invites" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "ownerEmail" TEXT NOT NULL,
  "recipientEmail" TEXT,
  "role" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "allowExport" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),

  CONSTRAINT "case_share_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "case_share_invites_tokenHash_key"
  ON "case_share_invites" ("tokenHash");

CREATE INDEX IF NOT EXISTS "case_share_invites_caseId_idx"
  ON "case_share_invites" ("caseId");

CREATE INDEX IF NOT EXISTS "case_share_invites_ownerEmail_idx"
  ON "case_share_invites" ("ownerEmail");

CREATE INDEX IF NOT EXISTS "case_share_invites_status_expiresAt_idx"
  ON "case_share_invites" ("status", "expiresAt");
