-- Operation 10/10 authority runtime, case-study system, and internal registry foundation.

CREATE TABLE IF NOT EXISTS "product_artifacts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "artifactId" TEXT NOT NULL UNIQUE,
  "productCode" TEXT NOT NULL,
  "sourceEntityType" TEXT NOT NULL,
  "sourceEntityId" TEXT NOT NULL,
  "userId" TEXT,
  "userEmail" TEXT,
  "organisationId" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'GENERATING',
  "inputSnapshotHash" TEXT,
  "artifactHash" TEXT,
  "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
  "falsificationRefs" JSONB NOT NULL DEFAULT '[]',
  "outcomeHypothesisId" TEXT,
  "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "deliveredAt" TIMESTAMPTZ,
  "publicSafeSummary" TEXT,
  "privateNotes" TEXT,
  "generatedBy" TEXT,
  "downloadUrl" TEXT,
  "manifestId" TEXT,
  "parentArtifactId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "supersededAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "product_artifacts_artifactId_idx" ON "product_artifacts" ("artifactId");
CREATE INDEX IF NOT EXISTS "product_artifacts_productCode_idx" ON "product_artifacts" ("productCode");
CREATE INDEX IF NOT EXISTS "product_artifacts_source_idx" ON "product_artifacts" ("sourceEntityType", "sourceEntityId");
CREATE INDEX IF NOT EXISTS "product_artifacts_userId_idx" ON "product_artifacts" ("userId");
CREATE INDEX IF NOT EXISTS "product_artifacts_userEmail_idx" ON "product_artifacts" ("userEmail");
CREATE INDEX IF NOT EXISTS "product_artifacts_organisationId_idx" ON "product_artifacts" ("organisationId");
CREATE INDEX IF NOT EXISTS "product_artifacts_status_idx" ON "product_artifacts" ("status");
CREATE INDEX IF NOT EXISTS "product_artifacts_deliveryStatus_idx" ON "product_artifacts" ("deliveryStatus");
CREATE INDEX IF NOT EXISTS "product_artifacts_createdAt_idx" ON "product_artifacts" ("createdAt");

CREATE TABLE IF NOT EXISTS "product_artifact_amendments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "artifactId" TEXT NOT NULL,
  "amendedById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "amendedBy" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "product_artifact_amendments_artifactId_fkey"
    FOREIGN KEY ("artifactId") REFERENCES "product_artifacts" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "product_artifact_amendments_artifactId_idx" ON "product_artifact_amendments" ("artifactId");
CREATE INDEX IF NOT EXISTS "product_artifact_amendments_createdAt_idx" ON "product_artifact_amendments" ("createdAt");

CREATE TABLE IF NOT EXISTS "outcome_hypotheses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "hypothesisId" TEXT NOT NULL UNIQUE,
  "productCode" TEXT NOT NULL,
  "sourceRunId" TEXT,
  "productArtifactId" TEXT,
  "userId" TEXT,
  "userEmail" TEXT,
  "predictedDecisionMove" TEXT NOT NULL,
  "expectedObservableChange" TEXT NOT NULL,
  "observationWindowDays" INTEGER NOT NULL DEFAULT 90,
  "reviewDate" TIMESTAMPTZ NOT NULL,
  "successIndicators" JSONB NOT NULL DEFAULT '[]',
  "failureIndicators" JSONB NOT NULL DEFAULT '[]',
  "ownerRole" TEXT,
  "returnBriefDueAt" TIMESTAMPTZ,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "outcomeRecordId" TEXT,
  "exemptionReason" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "outcome_hypotheses_hypothesisId_idx" ON "outcome_hypotheses" ("hypothesisId");
CREATE INDEX IF NOT EXISTS "outcome_hypotheses_productCode_idx" ON "outcome_hypotheses" ("productCode");
CREATE INDEX IF NOT EXISTS "outcome_hypotheses_sourceRunId_idx" ON "outcome_hypotheses" ("sourceRunId");
CREATE INDEX IF NOT EXISTS "outcome_hypotheses_userId_idx" ON "outcome_hypotheses" ("userId");
CREATE INDEX IF NOT EXISTS "outcome_hypotheses_userEmail_idx" ON "outcome_hypotheses" ("userEmail");
CREATE INDEX IF NOT EXISTS "outcome_hypotheses_status_idx" ON "outcome_hypotheses" ("status");
CREATE INDEX IF NOT EXISTS "outcome_hypotheses_reviewDate_idx" ON "outcome_hypotheses" ("reviewDate");

CREATE TABLE IF NOT EXISTS "falsification_entries" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productCode" TEXT NOT NULL,
  "artifactId" TEXT,
  "sourceEntityType" TEXT,
  "sourceEntityId" TEXT,
  "claimOrRecommendation" TEXT NOT NULL,
  "confidenceLevel" TEXT NOT NULL,
  "whatWouldChangeThisView" TEXT NOT NULL,
  "observableIndicator" TEXT NOT NULL,
  "threshold" TEXT,
  "reviewDate" TIMESTAMPTZ,
  "evidenceCurrentlyMissing" TEXT,
  "strongestCounterargument" TEXT,
  "responseToCounterargument" TEXT,
  "status" TEXT NOT NULL DEFAULT 'MONITORING',
  "overturnedAt" TIMESTAMPTZ,
  "confirmedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "falsification_entries_productCode_idx" ON "falsification_entries" ("productCode");
CREATE INDEX IF NOT EXISTS "falsification_entries_artifactId_idx" ON "falsification_entries" ("artifactId");
CREATE INDEX IF NOT EXISTS "falsification_entries_status_idx" ON "falsification_entries" ("status");
CREATE INDEX IF NOT EXISTS "falsification_entries_reviewDate_idx" ON "falsification_entries" ("reviewDate");

CREATE TABLE IF NOT EXISTS "pattern_observations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "userEmail" TEXT,
  "organisationId" TEXT,
  "patternType" TEXT NOT NULL,
  "patternLabel" TEXT NOT NULL,
  "patternDetail" TEXT,
  "observationCount" INTEGER NOT NULL DEFAULT 1,
  "sourceRunIds" JSONB NOT NULL DEFAULT '[]',
  "recommendedAction" TEXT,
  "riskOfRepeat" TEXT,
  "surfaceIn" JSONB NOT NULL DEFAULT '[]',
  "acknowledgedAt" TIMESTAMPTZ,
  "dismissedAt" TIMESTAMPTZ,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "pattern_observations_userId_idx" ON "pattern_observations" ("userId");
CREATE INDEX IF NOT EXISTS "pattern_observations_userEmail_idx" ON "pattern_observations" ("userEmail");
CREATE INDEX IF NOT EXISTS "pattern_observations_organisationId_idx" ON "pattern_observations" ("organisationId");
CREATE INDEX IF NOT EXISTS "pattern_observations_patternType_idx" ON "pattern_observations" ("patternType");
CREATE INDEX IF NOT EXISTS "pattern_observations_status_idx" ON "pattern_observations" ("status");
CREATE INDEX IF NOT EXISTS "pattern_observations_createdAt_idx" ON "pattern_observations" ("createdAt");

CREATE TABLE IF NOT EXISTS "case_studies" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT UNIQUE,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "publicationAllowed" BOOLEAN NOT NULL DEFAULT false,
  "anonymised" BOOLEAN NOT NULL DEFAULT true,
  "anonymisationNotes" TEXT,
  "sector" TEXT,
  "companySizeBand" TEXT,
  "region" TEXT,
  "sourceOutcomeRecordId" TEXT,
  "returnBriefId" TEXT,
  "adminVerifiedRecordId" TEXT,
  "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
  "consentStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "narrative" JSONB NOT NULL DEFAULT '{}',
  "publicPayload" JSONB,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMPTZ,
  "publishedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "case_studies_status_idx" ON "case_studies" ("status");
CREATE INDEX IF NOT EXISTS "case_studies_publicationAllowed_idx" ON "case_studies" ("publicationAllowed");
CREATE INDEX IF NOT EXISTS "case_studies_verificationStatus_idx" ON "case_studies" ("verificationStatus");
CREATE INDEX IF NOT EXISTS "case_studies_consentStatus_idx" ON "case_studies" ("consentStatus");
CREATE INDEX IF NOT EXISTS "case_studies_sourceOutcomeRecordId_idx" ON "case_studies" ("sourceOutcomeRecordId");
CREATE INDEX IF NOT EXISTS "case_studies_returnBriefId_idx" ON "case_studies" ("returnBriefId");
CREATE INDEX IF NOT EXISTS "case_studies_sector_idx" ON "case_studies" ("sector");
CREATE INDEX IF NOT EXISTS "case_studies_companySizeBand_idx" ON "case_studies" ("companySizeBand");

CREATE TABLE IF NOT EXISTS "case_study_evidence" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "caseStudyId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "evidenceHash" TEXT,
  "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "case_study_evidence_caseStudyId_fkey"
    FOREIGN KEY ("caseStudyId") REFERENCES "case_studies" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "case_study_evidence_caseStudyId_idx" ON "case_study_evidence" ("caseStudyId");
CREATE INDEX IF NOT EXISTS "case_study_evidence_source_idx" ON "case_study_evidence" ("sourceType", "sourceId");
CREATE INDEX IF NOT EXISTS "case_study_evidence_verificationStatus_idx" ON "case_study_evidence" ("verificationStatus");

CREATE TABLE IF NOT EXISTS "case_study_consents" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "caseStudyId" TEXT NOT NULL,
  "consentStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "grantedByEmail" TEXT,
  "scope" TEXT NOT NULL DEFAULT 'ANONYMISED_PUBLICATION',
  "anonymisedAllowed" BOOLEAN NOT NULL DEFAULT true,
  "publicUseAllowed" BOOLEAN NOT NULL DEFAULT false,
  "grantedAt" TIMESTAMPTZ,
  "revokedAt" TIMESTAMPTZ,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "case_study_consents_caseStudyId_fkey"
    FOREIGN KEY ("caseStudyId") REFERENCES "case_studies" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "case_study_consents_caseStudyId_idx" ON "case_study_consents" ("caseStudyId");
CREATE INDEX IF NOT EXISTS "case_study_consents_consentStatus_idx" ON "case_study_consents" ("consentStatus");
CREATE INDEX IF NOT EXISTS "case_study_consents_grantedByEmail_idx" ON "case_study_consents" ("grantedByEmail");

CREATE TABLE IF NOT EXISTS "case_study_outcomes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "caseStudyId" TEXT NOT NULL,
  "decisionOutcomeRecordId" TEXT,
  "outcomeClass" TEXT NOT NULL,
  "outcomeSummary" TEXT NOT NULL,
  "verifiedBy" TEXT,
  "verifiedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "case_study_outcomes_caseStudyId_fkey"
    FOREIGN KEY ("caseStudyId") REFERENCES "case_studies" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "case_study_outcomes_caseStudyId_idx" ON "case_study_outcomes" ("caseStudyId");
CREATE INDEX IF NOT EXISTS "case_study_outcomes_decisionOutcomeRecordId_idx" ON "case_study_outcomes" ("decisionOutcomeRecordId");
CREATE INDEX IF NOT EXISTS "case_study_outcomes_outcomeClass_idx" ON "case_study_outcomes" ("outcomeClass");

CREATE TABLE IF NOT EXISTS "public_decision_registry_entries" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceOutcomeRecordId" TEXT,
  "sourceArtifactId" TEXT,
  "productCode" TEXT NOT NULL,
  "optInStatus" TEXT NOT NULL DEFAULT 'NOT_OPTED_IN',
  "anonymisationStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "adminReviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "userEmailHash" TEXT,
  "sectorTaxonomy" TEXT,
  "companySizeBand" TEXT,
  "regionTaxonomy" TEXT,
  "outcomeClass" TEXT,
  "costOfDelayMethodology" TEXT,
  "costOfDelayBand" TEXT,
  "aggregationBucket" TEXT,
  "minimumAggregationThreshold" INTEGER NOT NULL DEFAULT 5,
  "currentAggregationCount" INTEGER NOT NULL DEFAULT 0,
  "publishable" BOOLEAN NOT NULL DEFAULT false,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "public_decision_registry_entries_productCode_idx" ON "public_decision_registry_entries" ("productCode");
CREATE INDEX IF NOT EXISTS "public_decision_registry_entries_optInStatus_idx" ON "public_decision_registry_entries" ("optInStatus");
CREATE INDEX IF NOT EXISTS "public_decision_registry_entries_anonymisationStatus_idx" ON "public_decision_registry_entries" ("anonymisationStatus");
CREATE INDEX IF NOT EXISTS "public_decision_registry_entries_adminReviewStatus_idx" ON "public_decision_registry_entries" ("adminReviewStatus");
CREATE INDEX IF NOT EXISTS "public_decision_registry_entries_sectorTaxonomy_idx" ON "public_decision_registry_entries" ("sectorTaxonomy");
CREATE INDEX IF NOT EXISTS "public_decision_registry_entries_companySizeBand_idx" ON "public_decision_registry_entries" ("companySizeBand");
CREATE INDEX IF NOT EXISTS "public_decision_registry_entries_aggregationBucket_idx" ON "public_decision_registry_entries" ("aggregationBucket");
CREATE INDEX IF NOT EXISTS "public_decision_registry_entries_publishable_idx" ON "public_decision_registry_entries" ("publishable");
