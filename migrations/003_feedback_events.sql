-- Governed product feedback event store.
-- Separate from finding_feedback (admin Foundry disposition) and proof_evidence.

CREATE TABLE IF NOT EXISTS feedback_events (
    id TEXT PRIMARY KEY,
    "feedbackId" TEXT UNIQUE NOT NULL,
    surface TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT,
    rating TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence INTEGER NOT NULL DEFAULT 3,
    comment TEXT,
    "followupRequested" BOOLEAN NOT NULL DEFAULT false,
    "evidenceHash" TEXT,
    "artifactVersion" TEXT,
    "productCode" TEXT,
    "userId" TEXT,
    email TEXT,
    "sessionId" TEXT,
    "sourceUrl" TEXT,
    referrer TEXT,
    environment TEXT NOT NULL DEFAULT 'unknown',
    "deployCommit" TEXT,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "actionStatus" TEXT NOT NULL DEFAULT 'logged',
    severity TEXT NOT NULL DEFAULT 'low',
    "triageStatus" TEXT NOT NULL DEFAULT 'unreviewed',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "linkedOrderId" TEXT,
    "linkedArtifactId" TEXT,
    "linkedFalsificationEntryId" TEXT,
    "linkedOutcomeHypothesisId" TEXT,
    "linkedCaseStudyId" TEXT,
    "linkedRetainerCycleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS feedback_events_surface_created_idx ON feedback_events(surface, "createdAt");
CREATE INDEX IF NOT EXISTS feedback_events_rating_created_idx ON feedback_events(rating, "createdAt");
CREATE INDEX IF NOT EXISTS feedback_events_category_created_idx ON feedback_events(category, "createdAt");
CREATE INDEX IF NOT EXISTS feedback_events_action_status_idx ON feedback_events("actionStatus");
CREATE INDEX IF NOT EXISTS feedback_events_severity_idx ON feedback_events(severity);
CREATE INDEX IF NOT EXISTS feedback_events_triage_status_idx ON feedback_events("triageStatus");
CREATE INDEX IF NOT EXISTS feedback_events_review_required_idx ON feedback_events("reviewRequired");
CREATE INDEX IF NOT EXISTS feedback_events_product_code_idx ON feedback_events("productCode");
CREATE INDEX IF NOT EXISTS feedback_events_linked_order_idx ON feedback_events("linkedOrderId");
CREATE INDEX IF NOT EXISTS feedback_events_linked_artifact_idx ON feedback_events("linkedArtifactId");
CREATE INDEX IF NOT EXISTS feedback_events_linked_outcome_idx ON feedback_events("linkedOutcomeHypothesisId");
CREATE INDEX IF NOT EXISTS feedback_events_linked_retainer_idx ON feedback_events("linkedRetainerCycleId");
