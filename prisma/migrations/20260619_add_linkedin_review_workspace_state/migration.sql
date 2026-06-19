CREATE TABLE IF NOT EXISTS "linkedin_review_workspace_states" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "resetAt" TIMESTAMP(3),
  "resetBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "linkedin_review_workspace_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "linkedin_review_workspace_states_workspaceId_key"
  ON "linkedin_review_workspace_states"("workspaceId");

CREATE INDEX IF NOT EXISTS "linkedin_review_workspace_states_deletedAt_idx"
  ON "linkedin_review_workspace_states"("deletedAt");
