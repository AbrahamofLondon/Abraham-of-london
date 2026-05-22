-- CreateEnum
CREATE TYPE "AlignmentBand" AS ENUM ('ALIGNED', 'DRIFTING', 'MISALIGNED', 'DISORDERED');

-- CreateEnum
CREATE TYPE "AlignmentDomain" AS ENUM ('IDENTITY', 'DECISION', 'ENVIRONMENT', 'BEHAVIOUR', 'EMOTIONAL_ORDER', 'LEGACY');

-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('MANDATED', 'IN_PROGRESS', 'LIQUIDATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'STRATEGIST', 'MEMBER', 'CLIENT');

-- CreateEnum
CREATE TYPE "AccessTier" AS ENUM ('public', 'member', 'professional', 'inner_circle', 'restricted', 'client', 'legacy', 'architect', 'owner', 'top_secret');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('active', 'inactive', 'pending', 'paused', 'suspended');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('Briefs', 'Dossier', 'Operational_Framework', 'Landing', 'Leadership', 'Audit', 'Research', 'Sovereign_Intelligence', 'Lexicon', 'Intelligence', 'Prints', 'Strategy');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('DEPENDENCY', 'RELATED', 'PREREQUISITE');

-- CreateEnum
CREATE TYPE "AnnotationPriority" AS ENUM ('ROUTINE', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'REVIEWING', 'CONTACTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "StrategyIntakeStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'ANALYZED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DownloadEventType" AS ENUM ('PREVIEW', 'DOWNLOAD', 'PRINT');

-- CreateEnum
CREATE TYPE "DownloadDeliveryMode" AS ENUM ('DIRECT', 'EMAIL', 'SECURE_LINK');

-- CreateEnum
CREATE TYPE "DownloadContentType" AS ENUM ('PDF', 'EPUB', 'MARKDOWN', 'ASSET');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('VIEW', 'DOWNLOAD', 'METADATA');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('debug', 'info', 'warn', 'error', 'critical');

-- CreateEnum
CREATE TYPE "SecurityEvent" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'MFA_CHALLENGE', 'PASSWORD_CHANGE', 'UNAUTHORIZED_ACCESS');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "KeyStatus" AS ENUM ('active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "MfaMethod" AS ENUM ('totp', 'sms', 'email');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('READ_BRIEFS', 'DOWNLOAD_REPORTS', 'ACCESS_VAULT', 'MANAGE_ORGS', 'ADMIN_ACCESS');

-- CreateEnum
CREATE TYPE "DiagnosticSeverity" AS ENUM ('low', 'moderate', 'high', 'critical');

-- CreateEnum
CREATE TYPE "DiagnosticLifecycleStatus" AS ENUM ('draft', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "DiagnosticReportStatus" AS ENUM ('none', 'pending', 'paid', 'generated', 'failed', 'revoked');

-- CreateEnum
CREATE TYPE "DiagnosticArtifactKind" AS ENUM ('pdf');

-- CreateEnum
CREATE TYPE "DiagnosticStorageProvider" AS ENUM ('local', 's3');

-- CreateEnum
CREATE TYPE "DiagnosticRegenerationStatus" AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "GovernanceSeverity" AS ENUM ('CRITICAL', 'HIGH', 'WARNING', 'INFO', 'DEBUG');

-- CreateEnum
CREATE TYPE "GovernanceStatus" AS ENUM ('ACTIVE', 'PENDING', 'RESOLVED', 'SUPPRESSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "EntitlementType" AS ENUM ('TIER', 'PRODUCT', 'ARTIFACT');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AccessKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED', 'DEPLETED');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'REDEEMED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM', 'ADMIN');

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sector" TEXT,
    "sizeBand" TEXT,
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlignmentCampaign" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "stage" TEXT NOT NULL DEFAULT 'intake',
    "diagnosticType" TEXT NOT NULL DEFAULT 'enterprise',
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "cadenceType" TEXT NOT NULL DEFAULT 'ad_hoc',
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT DEFAULT '{}',

    CONSTRAINT "AlignmentCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlignmentSnapshot" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "cohortSize" INTEGER NOT NULL,
    "aggregatedData" TEXT NOT NULL,
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlignmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_invites" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisation_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationMembership" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "roleTitle" TEXT,
    "teamName" TEXT,
    "functionName" TEXT,
    "seniorityBand" TEXT,
    "isExecutive" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'CONTRIBUTOR',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "target" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "EntitlementType" NOT NULL,
    "key" TEXT NOT NULL,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "issuedBy" TEXT,
    "revokedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessKey" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "codePreview" TEXT NOT NULL,
    "label" TEXT,
    "status" "AccessKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "grants" JSONB NOT NULL,
    "metadata" JSONB,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "issuedBy" TEXT,
    "revokedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessKeyUse" (
    "id" TEXT NOT NULL,
    "accessKeyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AccessKeyUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessAuditLog" (
    "id" TEXT NOT NULL,
    "actorType" "AuditActorType" NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetKey" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_invites" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "grants" JSONB NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "issuedBy" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "redeemedByUserId" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "reason" TEXT,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "emailSentAt" TIMESTAMP(3),
    "emailError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignParticipant" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "membershipId" TEXT,
    "journeyId" TEXT,
    "respondentType" TEXT,
    "email" TEXT NOT NULL,
    "inviteTokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CampaignParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_responses" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "resonance" INTEGER NOT NULL,
    "certainty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseAssessment" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "teamName" TEXT,
    "isExecutive" BOOLEAN NOT NULL DEFAULT false,
    "answersJson" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "possibleScore" INTEGER NOT NULL,
    "percentScore" INTEGER NOT NULL,
    "band" TEXT NOT NULL,
    "weakestDomainsJson" TEXT NOT NULL,
    "strongestDomainsJson" TEXT,
    "domainScoresJson" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnterpriseAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamAssessmentSnapshot" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "respondentCount" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "possibleScore" INTEGER NOT NULL,
    "percentScore" INTEGER NOT NULL,
    "band" TEXT NOT NULL,
    "weakestDomainsJson" TEXT NOT NULL,
    "strongestDomainsJson" TEXT NOT NULL,
    "domainScoresJson" TEXT NOT NULL,
    "varianceScoresJson" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamAssessmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamAssessmentCampaign" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "sponsorUserId" TEXT,
    "slug" TEXT,
    "title" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'leader_estimate',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "closesAt" TIMESTAMP(3),
    "minimumResponseThreshold" INTEGER NOT NULL DEFAULT 3,
    "anonymityMode" TEXT NOT NULL DEFAULT 'anonymous',
    "domainsJson" TEXT NOT NULL,
    "leaderEstimateJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamAssessmentCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamAssessmentInvite" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT,
    "roleLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "TeamAssessmentInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamAssessmentResponse" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "inviteId" TEXT,
    "respondentKey" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamAssessmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamAssessmentAggregate" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "respondentCount" INTEGER NOT NULL,
    "invitedCount" INTEGER NOT NULL,
    "completionRate" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "claimLevel" TEXT NOT NULL,
    "domainsJson" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamAssessmentAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationAssessmentSnapshot" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "respondentCount" INTEGER NOT NULL,
    "invitedCount" INTEGER NOT NULL,
    "completionRate" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "possibleScore" INTEGER NOT NULL,
    "percentScore" INTEGER NOT NULL,
    "band" TEXT NOT NULL,
    "weakestDomainsJson" TEXT NOT NULL,
    "strongestDomainsJson" TEXT NOT NULL,
    "domainScoresJson" TEXT NOT NULL,
    "varianceScoresJson" TEXT NOT NULL,
    "fragilitySignal" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganisationAssessmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadershipGapSnapshot" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "overallGapPercent" INTEGER NOT NULL,
    "domainGapsJson" TEXT NOT NULL,
    "interpretationFlagsJson" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadershipGapSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseReport" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT,
    "reportVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnterpriseReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_records" (
    "id" TEXT NOT NULL,
    "diagnosticType" TEXT NOT NULL,
    "title" TEXT,
    "score" INTEGER NOT NULL,
    "severity" "DiagnosticSeverity" NOT NULL,
    "verdict" TEXT NOT NULL,
    "responsesJson" TEXT NOT NULL,
    "notes" TEXT,
    "userEmail" TEXT,
    "userId" TEXT,
    "status" "DiagnosticLifecycleStatus" NOT NULL DEFAULT 'completed',
    "reportStatus" "DiagnosticReportStatus" NOT NULL DEFAULT 'none',
    "reportTier" TEXT,
    "latestVersion" TEXT,
    "generatedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostic_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_report_orders" (
    "id" TEXT NOT NULL,
    "diagnosticRecordId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "reportTier" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "userEmail" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostic_report_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_artifacts" (
    "id" TEXT NOT NULL,
    "diagnosticRef" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "reportId" TEXT,
    "version" TEXT NOT NULL,
    "kind" "DiagnosticArtifactKind" NOT NULL DEFAULT 'pdf',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteLength" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "storageProvider" "DiagnosticStorageProvider" NOT NULL,
    "objectKey" TEXT NOT NULL,
    "bucket" TEXT,
    "etag" TEXT,
    "publicPath" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "retentionClass" TEXT NOT NULL DEFAULT 'standard',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "diagnostic_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_regeneration_jobs" (
    "id" TEXT NOT NULL,
    "diagnosticRef" TEXT NOT NULL,
    "diagnosticId" TEXT,
    "version" TEXT,
    "status" "DiagnosticRegenerationStatus" NOT NULL DEFAULT 'queued',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostic_regeneration_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_audit_events" (
    "id" TEXT NOT NULL,
    "diagnosticRef" TEXT,
    "diagnosticId" TEXT,
    "action" TEXT NOT NULL,
    "actor" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostic_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_artifact_access_grants" (
    "id" TEXT NOT NULL,
    "diagnosticRef" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "granteeEmail" TEXT NOT NULL,
    "entitlementKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "diagnostic_artifact_access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_lineage_events" (
    "id" TEXT NOT NULL,
    "diagnosticRef" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "artifactId" TEXT,
    "parentArtifactId" TEXT,
    "eventType" TEXT NOT NULL,
    "version" TEXT,
    "actor" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostic_lineage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proof_evidence" (
    "id" TEXT NOT NULL,
    "sourceStage" TEXT NOT NULL,
    "proofType" TEXT NOT NULL,
    "routeResultType" TEXT,
    "accuracyScore" TEXT,
    "usefulnessScore" TEXT,
    "nextStepChanged" BOOLEAN,
    "actionIntent" TEXT,
    "outcomeCategory" TEXT,
    "mostAccuratePart" TEXT,
    "paidSpecificity" TEXT,
    "consequenceClear" BOOLEAN,
    "justifiedAction" BOOLEAN,
    "decisionClarity" TEXT,
    "nextMoveClear" BOOLEAN,
    "freeTextRaw" TEXT,
    "anonymisedSummary" TEXT,
    "displayLabel" TEXT,
    "userType" TEXT,
    "organisationType" TEXT,
    "sourceOrigin" TEXT,
    "isPaidStage" BOOLEAN NOT NULL DEFAULT false,
    "followupAt" TIMESTAMP(3),
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "displayStatus" TEXT NOT NULL DEFAULT 'HIDDEN',
    "sourceKind" TEXT NOT NULL DEFAULT 'SELF_REPORTED',
    "adminNotes" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proof_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientEntitlement" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "externalRef" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCustomer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalIncident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "category" TEXT,
    "summary" TEXT,
    "details" TEXT,
    "source" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtifactManifest" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "subjectEmail" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "version" TEXT,
    "storageDriver" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "checksumSha256" TEXT,
    "mimeType" TEXT,
    "byteSize" INTEGER,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "retentionClass" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtifactManifest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDeadLetter" (
    "id" TEXT NOT NULL,
    "queue" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "payloadJson" TEXT,
    "fingerprint" TEXT,
    "source" TEXT,
    "actor" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "retryable" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'open',
    "replayNote" TEXT,
    "metadataJson" TEXT,
    "replayedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobDeadLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceLevelSnapshot" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "availabilityPct" DOUBLE PRECISION NOT NULL,
    "errorRatePct" DOUBLE PRECISION,
    "p95Ms" DOUBLE PRECISION,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "breachCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceLevelSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunbookEntry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" TEXT,
    "bodyMarkdown" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunbookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_recommendation_sessions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "submissionId" TEXT,
    "anonymousId" TEXT,
    "email" TEXT,
    "company" TEXT,
    "route" TEXT,
    "priority" TEXT,
    "temperature" TEXT,
    "orgState" TEXT,
    "readinessTier" TEXT,
    "authorityType" TEXT,
    "revenueBand" TEXT,
    "sector" TEXT,
    "marketRiskBand" TEXT,
    "fusedScore" DOUBLE PRECISION,
    "routeConfidence" DOUBLE PRECISION,
    "recommendationCount" INTEGER NOT NULL DEFAULT 0,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "conversionType" TEXT,
    "conversionAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "decision_recommendation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_recommendation_impressions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetTitle" TEXT NOT NULL,
    "assetHref" TEXT,
    "assetKind" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "metadataConfidence" DOUBLE PRECISION,
    "reasons" JSONB,
    "contextSnapshot" JSONB,

    CONSTRAINT "decision_recommendation_impressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_recommendation_clicks" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "impressionId" TEXT,
    "assetId" TEXT NOT NULL,
    "assetTitle" TEXT NOT NULL,
    "assetHref" TEXT,
    "assetKind" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,
    "conversionType" TEXT,

    CONSTRAINT "decision_recommendation_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_recommendation_conversions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "clickId" TEXT,
    "conversionType" TEXT NOT NULL,
    "conversionValue" DOUBLE PRECISION,
    "assetId" TEXT,
    "assetTitle" TEXT,
    "assetHref" TEXT,
    "assetKind" TEXT,
    "metadata" JSONB,

    CONSTRAINT "decision_recommendation_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_session_followups" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "routeBefore" TEXT,
    "routeAfter" TEXT,
    "readinessTierBefore" TEXT,
    "readinessTierAfter" TEXT,
    "authorityTypeBefore" TEXT,
    "authorityTypeAfter" TEXT,
    "clarityDelta" DOUBLE PRECISION,
    "authorityDelta" DOUBLE PRECISION,
    "readinessDelta" DOUBLE PRECISION,
    "routeImproved" BOOLEAN NOT NULL DEFAULT false,
    "convertedAfterGuidance" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "decision_session_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_asset_efficacy" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetTitle" TEXT NOT NULL,
    "assetHref" TEXT,
    "assetKind" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "assistedConversions" INTEGER NOT NULL DEFAULT 0,
    "routeImprovements" INTEGER NOT NULL DEFAULT 0,
    "readinessImprovements" INTEGER NOT NULL DEFAULT 0,
    "clarityImprovements" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "authorityImprovements" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "efficacyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "decisionUsefulnessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastEvaluatedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "decision_asset_efficacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_asset_context_performance" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetTitle" TEXT NOT NULL,
    "assetHref" TEXT,
    "assetKind" TEXT NOT NULL,
    "contextType" TEXT NOT NULL,
    "contextValue" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "assistedConversions" INTEGER NOT NULL DEFAULT 0,
    "routeImprovements" INTEGER NOT NULL DEFAULT 0,
    "readinessImprovements" INTEGER NOT NULL DEFAULT 0,
    "clarityGain" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "authorityGain" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contextualWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usefulnessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastEvaluatedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "decisionAssetEfficacyId" TEXT,

    CONSTRAINT "decision_asset_context_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_metric_definitions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "thresholdHi" DOUBLE PRECISION,
    "thresholdLo" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "governance_metric_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_signal_registry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "registryKey" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetTitle" TEXT NOT NULL,
    "assetHref" TEXT,
    "assetKind" TEXT NOT NULL,
    "contextType" TEXT NOT NULL,
    "contextValue" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "highestSeverity" TEXT NOT NULL DEFAULT 'info',
    "healthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driftScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resonanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceScore" DOUBLE PRECISION,
    "resonanceBand" TEXT,
    "alertCount" INTEGER NOT NULL DEFAULT 0,
    "lastEvaluatedAt" TIMESTAMP(3),
    "metricKey" TEXT,
    "assetEfficacyId" TEXT,
    "contextPerformanceId" TEXT,
    "metrics" JSONB,
    "alerts" JSONB,
    "metadata" JSONB,

    CONSTRAINT "decision_signal_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_governance_alerts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetTitle" TEXT NOT NULL,
    "assetHref" TEXT,
    "assetKind" TEXT NOT NULL,
    "contextType" TEXT,
    "contextValue" TEXT,
    "registryKey" TEXT,
    "alertType" TEXT NOT NULL,
    "metricKey" TEXT,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "message" TEXT NOT NULL,
    "previousValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "deltaValue" DOUBLE PRECISION,
    "deltaPercent" DOUBLE PRECISION,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "assetEfficacyId" TEXT,
    "contextPerformanceId" TEXT,
    "signalRegistryId" TEXT,

    CONSTRAINT "decision_governance_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurposeAlignmentAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionKey" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Purpose Alignment Assessment',
    "notes" TEXT,
    "totalScore" INTEGER NOT NULL,
    "possibleScore" INTEGER NOT NULL,
    "percentScore" INTEGER NOT NULL,
    "band" "AlignmentBand" NOT NULL,
    "fragilitySignal" TEXT DEFAULT 'LOW',
    "dissonanceArea" INTEGER DEFAULT 0,
    "varianceScores" TEXT,
    "weakestDomains" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "corrections" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "domainScores" TEXT NOT NULL,
    "canonicalResult" TEXT,
    "responseMode" TEXT NOT NULL DEFAULT 'dual_axis',
    "reportVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "sourceInstrumentId" TEXT NOT NULL DEFAULT 'IA-PAC-001',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurposeAlignmentAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurposeAlignmentReport" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportVersion" TEXT NOT NULL DEFAULT '1.0.0',

    CONSTRAINT "PurposeAlignmentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purpose_alignment_reminder_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionKey" TEXT,
    "email" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cadenceDays" INTEGER NOT NULL DEFAULT 30,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purpose_alignment_reminder_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purpose_alignment_reminder_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionKey" TEXT,
    "email" TEXT,
    "assessmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "payload" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "preferenceId" TEXT,

    CONSTRAINT "purpose_alignment_reminder_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealFlowSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "revenue" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "route" TEXT NOT NULL,
    "aiScore" DOUBLE PRECISION,
    "aiConfidence" DOUBLE PRECISION,
    "aiSummary" TEXT,
    "aiIntent" TEXT,
    "aiDealQuality" TEXT,
    "sessionDepth" INTEGER,
    "timeOnSite" INTEGER,
    "returnVisitor" BOOLEAN,
    "predictedWinProbability" DOUBLE PRECISION,
    "predictedCloseVelocityDays" INTEGER,
    "predictedExpectedRevenue" DOUBLE PRECISION,
    "predictedPriority" TEXT,
    "predictedTemperature" TEXT,
    "predictedNextAction" TEXT,
    "predictiveRationale" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT,
    "userId" TEXT,

    CONSTRAINT "DealFlowSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionAssetPerformance" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetTitle" TEXT NOT NULL,
    "assetHref" TEXT,
    "assetKind" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "clickThroughRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adaptiveWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "lastInteractionAt" TIMESTAMP(3),
    "metadata" TEXT,

    CONSTRAINT "DecisionAssetPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inner_circle_members" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MemberStatus" NOT NULL DEFAULT 'active',
    "tier" "AccessTier" NOT NULL DEFAULT 'member',
    "flags" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "email_hash" TEXT NOT NULL,
    "email_hash_prefix" TEXT,
    "password_hash" TEXT,
    "last_ip" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "permissions" TEXT DEFAULT '[]',

    CONSTRAINT "inner_circle_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_logs" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" "HttpMethod" NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inner_circle_keys" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "status" "KeyStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "keySuffix" TEXT,
    "keyType" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "metadata" TEXT DEFAULT '{}',
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "inner_circle_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mfa_setups" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "methods" TEXT DEFAULT '["totp"]',
    "totpSecret" TEXT,
    "totpVerified" BOOLEAN NOT NULL DEFAULT false,
    "backupCodes" TEXT DEFAULT '[]',
    "phoneNumber" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "recoveryEmail" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "mfa_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "memberId" TEXT,
    "ip_address" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "user_agent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_logs" (
    "id" TEXT NOT NULL,
    "event" "SecurityEvent" NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'info',
    "action" TEXT NOT NULL,
    "details" TEXT DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_logs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "memberId" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT,
    "allowed" BOOLEAN NOT NULL,
    "remaining" INTEGER NOT NULL,
    "limit" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bucket" TEXT,
    "requestId" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "rate_limit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'info',
    "actorId" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorEmail" TEXT,
    "actor_type" TEXT DEFAULT 'system',
    "category" TEXT,
    "duration_ms" INTEGER,
    "error_message" TEXT,
    "request_id" TEXT,
    "resource_name" TEXT,
    "resource_type" TEXT,
    "session_id" TEXT,
    "status" TEXT DEFAULT 'success',
    "sub_category" TEXT,
    "tags" TEXT DEFAULT '[]',

    CONSTRAINT "system_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3) NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSyncAt" TIMESTAMP(3),
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_signal_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisationId" TEXT,
    "accountId" TEXT,
    "source" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "evidencePosture" TEXT,
    "signalKey" TEXT NOT NULL,
    "signalValueJson" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "evidenceWindowStart" TIMESTAMP(3),
    "evidenceWindowEnd" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "integrationConnectedAt" TIMESTAMP(3),
    "rawCountBasisJson" JSONB,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behavioral_signal_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_inquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "memberId" TEXT,

    CONSTRAINT "strategy_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_intakes" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "dependencyLevel" TEXT NOT NULL,
    "volatility" TEXT NOT NULL,
    "readinessScore" INTEGER NOT NULL DEFAULT 5,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailHash" TEXT,
    "memberId" TEXT,
    "analysisNotes" TEXT DEFAULT '{}',
    "analysisVersion" TEXT,
    "analyzedAt" TIMESTAMP(3),
    "analyzedBy" TEXT,
    "score" INTEGER,
    "status" "StrategyIntakeStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "strategy_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstitutionalIntakeReport" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sessionKey" TEXT,
    "respondentKey" TEXT,
    "campaignId" TEXT,
    "email" TEXT,
    "organisation" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "answersJson" TEXT NOT NULL,
    "reportJson" TEXT NOT NULL,
    "constitutionalInputJson" TEXT NOT NULL,
    "decisionJson" TEXT NOT NULL,
    "routeSummaryJson" TEXT NOT NULL,
    "bridgeJson" TEXT,
    "route" TEXT,
    "confidence" DOUBLE PRECISION,
    "posture" TEXT,
    "readinessTier" TEXT,
    "authorityType" TEXT,
    "seriousnessScore" INTEGER,
    "completionPercent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstitutionalIntakeReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveReportingRun" (
    "id" TEXT NOT NULL,
    "runKey" TEXT NOT NULL,
    "campaignId" TEXT,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "organisation" TEXT,
    "role" TEXT,
    "sector" TEXT,
    "source" TEXT NOT NULL DEFAULT 'executive-reporting',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "route" TEXT,
    "readinessTier" TEXT,
    "authorityType" TEXT,
    "canonicalSnapshot" JSONB NOT NULL,
    "viewModelSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveReportingRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveReportingArtifact" (
    "id" TEXT NOT NULL,
    "artifactKey" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'authorized',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveReportingArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticJourney" (
    "id" TEXT NOT NULL,
    "journeyKey" TEXT NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "organisation" TEXT,
    "organisationKey" TEXT,
    "diagnosticType" TEXT NOT NULL DEFAULT 'diagnostic_journey',
    "parentJourneyId" TEXT,
    "monitoringCadence" TEXT NOT NULL DEFAULT 'ad_hoc',
    "status" TEXT NOT NULL DEFAULT 'active',
    "mergedTensionThread" JSONB,
    "escalationHistory" JSONB,
    "routeDecisions" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticEvidenceNode" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT,
    "assessmentId" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "email" TEXT,
    "sourceStage" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "evidenceText" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticEvidenceNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticDecisionObject" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT,
    "decisionKey" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "email" TEXT,
    "sourceStage" TEXT NOT NULL,
    "decisionText" TEXT NOT NULL,
    "constraintText" TEXT,
    "priorAttemptText" TEXT,
    "costOfDelayText" TEXT,
    "stakeholderText" TEXT,
    "affectedDomain" TEXT,
    "normalized" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "aiExposureLevel" TEXT NOT NULL DEFAULT 'MODERATE',
    "aiDisplacementRisk" BOOLEAN NOT NULL DEFAULT false,
    "decisionVelocityScore" INTEGER NOT NULL DEFAULT 50,
    "forwardTerrainState" TEXT NOT NULL DEFAULT 'STABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticDecisionObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionDependency" (
    "id" TEXT NOT NULL,
    "parentDecisionId" TEXT NOT NULL,
    "childDecisionId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionStakeholder" (
    "id" TEXT NOT NULL,
    "decisionObjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "function" TEXT NOT NULL,
    "influenceLevel" TEXT NOT NULL,
    "alignmentState" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionStakeholder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakeholderPosition" (
    "id" TEXT NOT NULL,
    "stakeholderId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "contradictionFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StakeholderPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_share_invites" (
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

-- CreateTable
CREATE TABLE "ProvenanceChainAnchor" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "anchorType" TEXT NOT NULL DEFAULT 'MERKLE_ROOT',
    "leafCount" INTEGER NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "previousRoot" TEXT,
    "chainHash" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromTimestamp" TIMESTAMP(3),
    "toTimestamp" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProvenanceChainAnchor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnforcementPlaybook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerPattern" TEXT NOT NULL,
    "actionSequence" JSONB NOT NULL,
    "expectedOutcome" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnforcementPlaybook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaybookApplication" (
    "id" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "retainedDecisionId" TEXT NOT NULL,
    "appliedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "outcomeDelta" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaybookApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoundationTelemetryEvent" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "contractId" TEXT,
    "decisionObjectId" TEXT,
    "eventType" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoundationTelemetryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetainerContract" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "decisionCapacity" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "billingCycle" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "entitlementSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetainerContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetainedDecision" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "decisionObjectId" TEXT NOT NULL,
    "priorityLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "aiLeverageAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetainedDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnforcementCycle" (
    "id" TEXT NOT NULL,
    "retainedDecisionId" TEXT NOT NULL,
    "cycleDate" TIMESTAMP(3) NOT NULL,
    "actionsTaken" JSONB NOT NULL,
    "contradictionsUpdated" JSONB NOT NULL,
    "outcomeDelta" DOUBLE PRECISION,
    "aiDriftDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiStatusSignal" TEXT NOT NULL DEFAULT 'PARITY HOLD',
    "advantageDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advantageSignal" TEXT NOT NULL DEFAULT 'PARITY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnforcementCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticStageRecord" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticStageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LongitudinalComparisonRecord" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "baselineJourneyId" TEXT,
    "subjectKey" TEXT,
    "email" TEXT,
    "organisationKey" TEXT,
    "diagnosticType" TEXT NOT NULL,
    "cadence" TEXT NOT NULL DEFAULT 'ad_hoc',
    "deltaSummary" JSONB NOT NULL,
    "recurrenceSummary" JSONB,
    "evidenceNodes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LongitudinalComparisonRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultiStakeholderResult" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "organisationId" TEXT,
    "organisationKey" TEXT,
    "diagnosticType" TEXT NOT NULL,
    "respondentCount" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "evidenceNodes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultiStakeholderResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutcomeVerificationRecord" (
    "id" TEXT NOT NULL,
    "baselineJourneyId" TEXT,
    "followUpJourneyId" TEXT,
    "decisionObjectId" TEXT,
    "sessionId" TEXT,
    "organisationKey" TEXT,
    "subjectType" TEXT,
    "subjectId" TEXT,
    "outcomeClassification" TEXT NOT NULL,
    "magnitudeOfChange" DOUBLE PRECISION NOT NULL,
    "effectivenessScore" DOUBLE PRECISION NOT NULL,
    "decisionVelocityDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiCapabilityShift" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "competitivePositionShift" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeToAdvantage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unresolvedContradictions" JSONB,
    "payload" JSONB NOT NULL,
    "evidenceNodes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutcomeVerificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticThreadSnapshot" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticThreadSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringSnapshot" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT,
    "organisationId" TEXT,
    "campaignId" TEXT,
    "cadence" TEXT NOT NULL DEFAULT 'ad_hoc',
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoringSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkFact" (
    "id" TEXT NOT NULL,
    "subjectHash" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkCohortSnapshot" (
    "id" TEXT NOT NULL,
    "cohortKey" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkCohortSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyRoomSession" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT,
    "intake" TEXT,
    "canonicalSnapshot" TEXT,
    "route" TEXT,
    "readinessTier" TEXT,
    "authorityType" TEXT,
    "lastImpressionAt" TIMESTAMP(3),
    "lastFollowupAt" TIMESTAMP(3),
    "lastConversionAt" TIMESTAMP(3),
    "lastConversionType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyRoomSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyRoomRecommendationImpression" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "canonicalSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyRoomRecommendationImpression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyRoomFollowup" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "routeAfter" TEXT NOT NULL,
    "readinessTierAfter" TEXT NOT NULL,
    "authorityTypeAfter" TEXT NOT NULL,
    "clarityDelta" DOUBLE PRECISION NOT NULL,
    "authorityDelta" DOUBLE PRECISION NOT NULL,
    "convertedAfterGuidance" BOOLEAN NOT NULL,
    "metadata" TEXT,
    "canonicalSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyRoomFollowup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyRoomConversion" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "conversionType" TEXT NOT NULL,
    "metadata" TEXT,
    "canonicalSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyRoomConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminDecisionContextualEfficacy" (
    "id" TEXT NOT NULL,
    "joinKey" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "impressionCount" INTEGER NOT NULL,
    "conversionCount" INTEGER NOT NULL,
    "contextualConversionRate" DOUBLE PRECISION NOT NULL,
    "rankedAssets" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminDecisionContextualEfficacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_metadata" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL DEFAULT 'Briefs',
    "summary" TEXT,
    "content" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "totalPrints" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "fileSize" INTEGER,
    "pageCount" INTEGER,
    "pdfPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastDownloadedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "classification" "AccessTier" NOT NULL DEFAULT 'client',

    CONSTRAINT "content_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frameworks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "oneLiner" TEXT,
    "tag" TEXT,
    "accent" TEXT,
    "canonRoot" TEXT,
    "audience" TEXT DEFAULT '[]',
    "tier" "AccessTier" NOT NULL DEFAULT 'member',
    "pdfPath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "pageCount" INTEGER,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "content" TEXT,
    "artifactUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "lastDownloadedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_links" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "linkType" "LinkType" NOT NULL DEFAULT 'DEPENDENCY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategic_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_relations" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_annotations" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" "AnnotationPriority" NOT NULL DEFAULT 'ROUTINE',
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "private_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canon_entries" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contentType" TEXT NOT NULL,
    "readTime" INTEGER,
    "metadataId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tier" "AccessTier" NOT NULL DEFAULT 'member',

    CONSTRAINT "canon_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_frameworks" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "oneLiner" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "canonRoot" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT '[]',
    "content" TEXT,
    "artifactUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tier" "AccessTier" NOT NULL DEFAULT 'member',

    CONSTRAINT "strategic_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicIntervention" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "domain" TEXT NOT NULL,
    "baselineScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deployedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategicIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectionNode" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "campaignId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorrectionNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionAssetGovernanceRule" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assetId" TEXT,
    "assetKind" TEXT,
    "ruleType" TEXT NOT NULL,
    "contextType" TEXT,
    "contextValue" TEXT,
    "minConfidenceScore" DOUBLE PRECISION,
    "minContextualWeight" DOUBLE PRECISION,
    "maxContextualWeight" DOUBLE PRECISION,
    "minImpressions" INTEGER,
    "suppress" BOOLEAN NOT NULL DEFAULT false,
    "priorityPenalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priorityBoost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rationale" TEXT,
    "metadata" TEXT,

    CONSTRAINT "DecisionAssetGovernanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_audit_events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailHash" TEXT,
    "ipHash" TEXT,
    "latencyMs" INTEGER NOT NULL,
    "metadata" TEXT DEFAULT '{}',
    "processedAt" TIMESTAMP(3) NOT NULL,
    "success" BOOLEAN NOT NULL,
    "memberId" TEXT,
    "errorCode" TEXT,
    "errorDetail" TEXT,
    "referrer" TEXT,
    "statusCode" INTEGER,
    "eventType" "DownloadEventType" NOT NULL DEFAULT 'PREVIEW',
    "contentId" TEXT,
    "deliveredChecksum" TEXT,
    "deliveryMode" "DownloadDeliveryMode" NOT NULL DEFAULT 'DIRECT',
    "email" TEXT,
    "fileHash" TEXT,
    "fileName" TEXT,
    "fileSize" BIGINT,
    "frameworkId" TEXT,
    "printAssetId" TEXT,
    "requestId" TEXT,
    "sessionId" TEXT,
    "sourceChecksum" TEXT,
    "title" TEXT,
    "watermarkId" TEXT,
    "contentType" "DownloadContentType" NOT NULL,

    CONSTRAINT "download_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_assets" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileFormat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tier" "AccessTier" NOT NULL DEFAULT 'member',

    CONSTRAINT "print_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premium_download_tokens" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "tier" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxDownloads" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premium_download_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premium_download_attempts" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT,
    "contentId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "method" TEXT,
    "success" BOOLEAN NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "reason" TEXT,
    "watermarkId" TEXT,
    "sourceChecksum" TEXT,
    "deliveredChecksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "downloadDuration" INTEGER,
    "fileSize" INTEGER,
    "pageCount" INTEGER,
    "requiredTier" TEXT,
    "userTier" TEXT,
    "requestFingerprint" TEXT,

    CONSTRAINT "premium_download_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "framework_access_logs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "memberId" TEXT,
    "accessType" "AccessType" NOT NULL DEFAULT 'VIEW',
    "decision" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "requiredTier" "AccessTier",
    "currentTier" "AccessTier",
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentId" TEXT,
    "frameworkId" TEXT,
    "requestId" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "framework_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_journey_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "stage" TEXT NOT NULL,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_journey_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_room_execution_sessions" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "strategyRoomSessionId" TEXT,
    "userId" TEXT,
    "email" TEXT,
    "directive" TEXT,
    "escalationLevel" TEXT,
    "conditionSummary" TEXT,
    "coreProblem" TEXT,
    "decisionQuestion" TEXT,
    "constraints" TEXT,
    "exposureLevel" TEXT,
    "interventionStack" TEXT,
    "constraintMap" TEXT,
    "canonicalSnapshot" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_room_execution_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_decision_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "decisionObjectId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "deadline" TIMESTAMP(3),
    "avoidanceCount" INTEGER NOT NULL DEFAULT 0,
    "executedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_decision_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_failed_entitlement_grants" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_failed_entitlement_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consequence_timeline" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "trend" TEXT NOT NULL,
    "baseRisk" INTEGER NOT NULL DEFAULT 0,
    "timePenalty" INTEGER NOT NULL DEFAULT 0,
    "failurePenalty" INTEGER NOT NULL DEFAULT 0,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consequence_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "decisionId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escalation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_states" (
    "id" TEXT NOT NULL,
    "modelKey" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "calibrationData" JSONB NOT NULL,
    "outcomeCount" INTEGER NOT NULL DEFAULT 0,
    "accuracyScore" DOUBLE PRECISION,
    "biasScore" DOUBLE PRECISION,
    "lastCalibratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calibration_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_events" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "modelKey" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "predictionSnapshot" JSONB NOT NULL,
    "outcomeSnapshot" JSONB NOT NULL,
    "predictionError" DOUBLE PRECISION,
    "adjustmentProposal" JSONB,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibration_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pattern_breaker_contracts" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "ownerName" TEXT,
    "ownerEmail" TEXT,
    "commitment" TEXT NOT NULL,
    "avoidedPattern" TEXT,
    "consequenceOfInaction" TEXT,
    "canonSignals" JSONB,
    "canonDefinitions" JSONB,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "checkpoints" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "breachCount" INTEGER NOT NULL DEFAULT 0,
    "escalationLevel" TEXT NOT NULL DEFAULT 'none',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pattern_breaker_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "id" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "identityKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_memories" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organisationId" TEXT,
    "sessionId" TEXT,
    "source" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "directive" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "publicSignals" JSONB,
    "escalationLabel" TEXT,
    "escalationLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abuse_events" (
    "id" TEXT NOT NULL,
    "identityKey" TEXT NOT NULL,
    "ipAddress" TEXT,
    "sessionId" TEXT,
    "route" TEXT NOT NULL,
    "ruleTriggered" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abuse_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abuse_fingerprints" (
    "id" TEXT NOT NULL,
    "identityKey" TEXT NOT NULL,
    "ipAddresses" JSONB NOT NULL,
    "sessionIds" JSONB NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "distinctInputs" INTEGER NOT NULL DEFAULT 0,
    "variationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abuse_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abuse_decisions" (
    "id" TEXT NOT NULL,
    "identityKey" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abuse_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_identities" (
    "id" TEXT NOT NULL,
    "identityKey" TEXT NOT NULL,
    "ipAddress" TEXT,
    "reason" TEXT NOT NULL,
    "permanent" BOOLEAN NOT NULL DEFAULT false,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "blocked_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canary_tripwires" (
    "id" TEXT NOT NULL,
    "identityKey" TEXT NOT NULL,
    "ipAddress" TEXT,
    "tripwireType" TEXT NOT NULL,
    "tripwireId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canary_tripwires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_vault" (
    "id" TEXT NOT NULL,
    "identityKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 0,
    "snapshot" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "route" TEXT,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_vault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_contact_ledger" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "journeyId" TEXT,
    "state" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "decision_contact_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_session" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "anchors" JSONB,
    "pattern" TEXT,
    "trajectory" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_identity" (
    "id" TEXT NOT NULL,
    "emailEncrypted" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_link" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_webhook_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intelligence_commons_record" (
    "id" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "industryTag" TEXT NOT NULL DEFAULT 'unspecified',
    "revenueBand" TEXT NOT NULL,
    "teamSizeBand" TEXT NOT NULL DEFAULT 'SMALL',
    "founderLed" BOOLEAN NOT NULL DEFAULT false,
    "sessionNumber" INTEGER NOT NULL DEFAULT 1,
    "authorityClarity" DOUBLE PRECISION NOT NULL,
    "narrativeCoherence" DOUBLE PRECISION NOT NULL,
    "interventionReadiness" DOUBLE PRECISION NOT NULL,
    "executionReadiness" DOUBLE PRECISION NOT NULL,
    "overallReadiness" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "overallPosture" TEXT NOT NULL,
    "trajectory" TEXT NOT NULL,
    "failureModeCount" INTEGER NOT NULL DEFAULT 0,
    "activeSignalIds" JSONB NOT NULL DEFAULT '[]',
    "outcomeTag" TEXT,
    "outcomeTimeDays" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intelligence_commons_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutional_memory_snapshot" (
    "id" TEXT NOT NULL,
    "organisationHandle" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "posture" TEXT NOT NULL,
    "trajectory" TEXT NOT NULL,
    "authorityClarity" DOUBLE PRECISION NOT NULL,
    "narrativeCoherence" DOUBLE PRECISION NOT NULL,
    "interventionReadiness" DOUBLE PRECISION NOT NULL,
    "executionReadiness" DOUBLE PRECISION NOT NULL,
    "overallReadiness" DOUBLE PRECISION NOT NULL,
    "failureModeCount" INTEGER NOT NULL DEFAULT 0,
    "activeSignalIds" JSONB NOT NULL DEFAULT '[]',
    "revenueBand" TEXT,
    "orgState" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institutional_memory_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_assignment" (
    "id" TEXT NOT NULL,
    "organisationHandle" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "matchStrength" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohort_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_aggregates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "assessmentKind" TEXT,
    "n" INTEGER NOT NULL DEFAULT 0,
    "improved" INTEGER NOT NULL DEFAULT 0,
    "resolved" INTEGER NOT NULL DEFAULT 0,
    "unchanged" INTEGER NOT NULL DEFAULT 0,
    "worsened" INTEGER NOT NULL DEFAULT 0,
    "abandoned" INTEGER NOT NULL DEFAULT 0,
    "timeImmediate" INTEGER NOT NULL DEFAULT 0,
    "timeShort" INTEGER NOT NULL DEFAULT 0,
    "timeMedium" INTEGER NOT NULL DEFAULT 0,
    "timeLong" INTEGER NOT NULL DEFAULT 0,
    "timeDidNotAct" INTEGER NOT NULL DEFAULT 0,
    "findingAccurateTotal" INTEGER NOT NULL DEFAULT 0,
    "findingAccurateTrue" INTEGER NOT NULL DEFAULT 0,
    "recommendationUsefulTotal" INTEGER NOT NULL DEFAULT 0,
    "recommendationUsefulTrue" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benchmark_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_tokens" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT NOT NULL,
    "connectedBy" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_publishing_connections" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'linkedin',
    "profileKey" TEXT NOT NULL DEFAULT 'legacy',
    "ownerType" TEXT NOT NULL,
    "ownerUrn" TEXT,
    "accountMemberId" TEXT,
    "displayName" TEXT,
    "ownerName" TEXT,
    "isDefaultPublishingTarget" BOOLEAN NOT NULL DEFAULT false,
    "requiredScope" TEXT NOT NULL DEFAULT 'w_member_social',
    "encryptedAccessToken" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastValidationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "linkedin_publishing_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_publish_attempts" (
    "id" TEXT NOT NULL,
    "outboundSlug" TEXT NOT NULL,
    "outboundTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "linkedInPostUrn" TEXT,
    "linkedInUrl" TEXT,
    "errorCode" TEXT,
    "errorMessageSafe" TEXT,
    "actorEmailHash" TEXT,
    "actorId" TEXT,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "linkedin_publish_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "scheduler_locks" (
    "id" TEXT NOT NULL,
    "lockKey" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "holder" TEXT,
    "metadata" TEXT,

    CONSTRAINT "scheduler_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "rate_limit_events" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "identifierHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowSeconds" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "limit" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_acceptances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stale_case_notifications" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "band" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnLinkToken" TEXT,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "extendedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stale_case_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_assurance_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "organisation" TEXT,
    "role" TEXT,
    "requestedMaterial" TEXT NOT NULL,
    "procurementStage" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_assurance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facebook_oauth_connections" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT,
    "encryptedAccessToken" TEXT NOT NULL,
    "encryptedUserToken" TEXT,
    "scopesJson" TEXT NOT NULL DEFAULT '[]',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facebook_oauth_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facebook_publish_attempts" (
    "id" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "assetSlug" TEXT NOT NULL,
    "assetTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "facebookPostId" TEXT,
    "facebookPostUrl" TEXT,
    "errorCode" TEXT,
    "errorMessageSafe" TEXT,
    "actorEmailHash" TEXT,
    "actorId" TEXT,
    "requestId" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "facebook_publish_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "x_oauth_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "username" TEXT,
    "encryptedAccessToken" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT,
    "scopesJson" TEXT NOT NULL DEFAULT '[]',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "x_oauth_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "x_publish_attempts" (
    "id" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "assetSlug" TEXT NOT NULL,
    "assetTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tweetId" TEXT,
    "tweetUrl" TEXT,
    "syncedFromFacebook" BOOLEAN NOT NULL DEFAULT false,
    "errorCode" TEXT,
    "errorMessageSafe" TEXT,
    "actorEmailHash" TEXT,
    "actorId" TEXT,
    "requestId" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "x_publish_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_slug_key" ON "Organisation"("slug");

-- CreateIndex
CREATE INDEX "Organisation_name_idx" ON "Organisation"("name");

-- CreateIndex
CREATE INDEX "Organisation_status_idx" ON "Organisation"("status");

-- CreateIndex
CREATE INDEX "Organisation_slug_idx" ON "Organisation"("slug");

-- CreateIndex
CREATE INDEX "AlignmentCampaign_organisationId_idx" ON "AlignmentCampaign"("organisationId");

-- CreateIndex
CREATE INDEX "AlignmentCampaign_status_idx" ON "AlignmentCampaign"("status");

-- CreateIndex
CREATE INDEX "AlignmentCampaign_diagnosticType_idx" ON "AlignmentCampaign"("diagnosticType");

-- CreateIndex
CREATE INDEX "AlignmentCampaign_stage_idx" ON "AlignmentCampaign"("stage");

-- CreateIndex
CREATE INDEX "AlignmentCampaign_opensAt_idx" ON "AlignmentCampaign"("opensAt");

-- CreateIndex
CREATE INDEX "AlignmentCampaign_closesAt_idx" ON "AlignmentCampaign"("closesAt");

-- CreateIndex
CREATE UNIQUE INDEX "AlignmentSnapshot_campaignId_key" ON "AlignmentSnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "AlignmentSnapshot_campaignId_idx" ON "AlignmentSnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "AlignmentSnapshot_organisationId_idx" ON "AlignmentSnapshot"("organisationId");

-- CreateIndex
CREATE INDEX "AlignmentSnapshot_finalizedAt_idx" ON "AlignmentSnapshot"("finalizedAt");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_invites_tokenHash_key" ON "organisation_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "organisation_invites_organisationId_idx" ON "organisation_invites"("organisationId");

-- CreateIndex
CREATE INDEX "organisation_invites_email_idx" ON "organisation_invites"("email");

-- CreateIndex
CREATE INDEX "organisation_invites_expiresAt_idx" ON "organisation_invites"("expiresAt");

-- CreateIndex
CREATE INDEX "organisation_invites_tokenHash_idx" ON "organisation_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "OrganisationMembership_organisationId_idx" ON "OrganisationMembership"("organisationId");

-- CreateIndex
CREATE INDEX "OrganisationMembership_email_idx" ON "OrganisationMembership"("email");

-- CreateIndex
CREATE INDEX "OrganisationMembership_teamName_idx" ON "OrganisationMembership"("teamName");

-- CreateIndex
CREATE INDEX "OrganisationMembership_status_idx" ON "OrganisationMembership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationMembership_organisationId_email_key" ON "OrganisationMembership"("organisationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "user_accounts_userId_idx" ON "user_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_provider_providerAccountId_key" ON "user_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "Entitlement_userId_type_status_idx" ON "Entitlement"("userId", "type", "status");

-- CreateIndex
CREATE INDEX "Entitlement_key_type_status_idx" ON "Entitlement"("key", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "entitlement_active_uniqueness" ON "Entitlement"("userId", "type", "key", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AccessKey_codeHash_key" ON "AccessKey"("codeHash");

-- CreateIndex
CREATE INDEX "AccessKey_status_idx" ON "AccessKey"("status");

-- CreateIndex
CREATE INDEX "AccessKey_expiresAt_idx" ON "AccessKey"("expiresAt");

-- CreateIndex
CREATE INDEX "AccessKeyUse_accessKeyId_idx" ON "AccessKeyUse"("accessKeyId");

-- CreateIndex
CREATE INDEX "AccessKeyUse_userId_idx" ON "AccessKeyUse"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessKeyUse_accessKeyId_userId_key" ON "AccessKeyUse"("accessKeyId", "userId");

-- CreateIndex
CREATE INDEX "AccessAuditLog_action_createdAt_idx" ON "AccessAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AccessAuditLog_actorUserId_createdAt_idx" ON "AccessAuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AccessAuditLog_targetType_targetKey_idx" ON "AccessAuditLog"("targetType", "targetKey");

-- CreateIndex
CREATE UNIQUE INDEX "access_invites_tokenHash_key" ON "access_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "access_invites_recipientEmail_idx" ON "access_invites"("recipientEmail");

-- CreateIndex
CREATE INDEX "access_invites_status_idx" ON "access_invites"("status");

-- CreateIndex
CREATE INDEX "access_invites_expiresAt_idx" ON "access_invites"("expiresAt");

-- CreateIndex
CREATE INDEX "CampaignParticipant_campaignId_idx" ON "CampaignParticipant"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignParticipant_membershipId_idx" ON "CampaignParticipant"("membershipId");

-- CreateIndex
CREATE INDEX "CampaignParticipant_journeyId_idx" ON "CampaignParticipant"("journeyId");

-- CreateIndex
CREATE INDEX "CampaignParticipant_respondentType_idx" ON "CampaignParticipant"("respondentType");

-- CreateIndex
CREATE INDEX "CampaignParticipant_email_idx" ON "CampaignParticipant"("email");

-- CreateIndex
CREATE INDEX "CampaignParticipant_status_idx" ON "CampaignParticipant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignParticipant_campaignId_email_key" ON "CampaignParticipant"("campaignId", "email");

-- CreateIndex
CREATE INDEX "audit_responses_campaignId_idx" ON "audit_responses"("campaignId");

-- CreateIndex
CREATE INDEX "EnterpriseAssessment_campaignId_idx" ON "EnterpriseAssessment"("campaignId");

-- CreateIndex
CREATE INDEX "EnterpriseAssessment_organisationId_idx" ON "EnterpriseAssessment"("organisationId");

-- CreateIndex
CREATE INDEX "EnterpriseAssessment_participantId_idx" ON "EnterpriseAssessment"("participantId");

-- CreateIndex
CREATE INDEX "EnterpriseAssessment_teamName_idx" ON "EnterpriseAssessment"("teamName");

-- CreateIndex
CREATE INDEX "EnterpriseAssessment_isExecutive_idx" ON "EnterpriseAssessment"("isExecutive");

-- CreateIndex
CREATE INDEX "EnterpriseAssessment_submittedAt_idx" ON "EnterpriseAssessment"("submittedAt");

-- CreateIndex
CREATE INDEX "TeamAssessmentSnapshot_campaignId_idx" ON "TeamAssessmentSnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "TeamAssessmentSnapshot_organisationId_idx" ON "TeamAssessmentSnapshot"("organisationId");

-- CreateIndex
CREATE INDEX "TeamAssessmentSnapshot_teamName_idx" ON "TeamAssessmentSnapshot"("teamName");

-- CreateIndex
CREATE UNIQUE INDEX "TeamAssessmentSnapshot_campaignId_teamName_key" ON "TeamAssessmentSnapshot"("campaignId", "teamName");

-- CreateIndex
CREATE UNIQUE INDEX "TeamAssessmentCampaign_slug_key" ON "TeamAssessmentCampaign"("slug");

-- CreateIndex
CREATE INDEX "TeamAssessmentCampaign_organisationId_idx" ON "TeamAssessmentCampaign"("organisationId");

-- CreateIndex
CREATE INDEX "TeamAssessmentCampaign_sponsorUserId_idx" ON "TeamAssessmentCampaign"("sponsorUserId");

-- CreateIndex
CREATE INDEX "TeamAssessmentCampaign_mode_idx" ON "TeamAssessmentCampaign"("mode");

-- CreateIndex
CREATE INDEX "TeamAssessmentCampaign_status_idx" ON "TeamAssessmentCampaign"("status");

-- CreateIndex
CREATE INDEX "TeamAssessmentCampaign_closesAt_idx" ON "TeamAssessmentCampaign"("closesAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamAssessmentInvite_tokenHash_key" ON "TeamAssessmentInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "TeamAssessmentInvite_campaignId_idx" ON "TeamAssessmentInvite"("campaignId");

-- CreateIndex
CREATE INDEX "TeamAssessmentInvite_email_idx" ON "TeamAssessmentInvite"("email");

-- CreateIndex
CREATE INDEX "TeamAssessmentInvite_status_idx" ON "TeamAssessmentInvite"("status");

-- CreateIndex
CREATE INDEX "TeamAssessmentInvite_expiresAt_idx" ON "TeamAssessmentInvite"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamAssessmentResponse_inviteId_key" ON "TeamAssessmentResponse"("inviteId");

-- CreateIndex
CREATE INDEX "TeamAssessmentResponse_campaignId_idx" ON "TeamAssessmentResponse"("campaignId");

-- CreateIndex
CREATE INDEX "TeamAssessmentResponse_respondentKey_idx" ON "TeamAssessmentResponse"("respondentKey");

-- CreateIndex
CREATE INDEX "TeamAssessmentResponse_submittedAt_idx" ON "TeamAssessmentResponse"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamAssessmentAggregate_campaignId_key" ON "TeamAssessmentAggregate"("campaignId");

-- CreateIndex
CREATE INDEX "TeamAssessmentAggregate_claimLevel_idx" ON "TeamAssessmentAggregate"("claimLevel");

-- CreateIndex
CREATE INDEX "TeamAssessmentAggregate_generatedAt_idx" ON "TeamAssessmentAggregate"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationAssessmentSnapshot_campaignId_key" ON "OrganisationAssessmentSnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "OrganisationAssessmentSnapshot_campaignId_idx" ON "OrganisationAssessmentSnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "OrganisationAssessmentSnapshot_organisationId_idx" ON "OrganisationAssessmentSnapshot"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadershipGapSnapshot_campaignId_key" ON "LeadershipGapSnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "LeadershipGapSnapshot_campaignId_idx" ON "LeadershipGapSnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "LeadershipGapSnapshot_organisationId_idx" ON "LeadershipGapSnapshot"("organisationId");

-- CreateIndex
CREATE INDEX "EnterpriseReport_campaignId_idx" ON "EnterpriseReport"("campaignId");

-- CreateIndex
CREATE INDEX "EnterpriseReport_organisationId_idx" ON "EnterpriseReport"("organisationId");

-- CreateIndex
CREATE INDEX "EnterpriseReport_reportType_idx" ON "EnterpriseReport"("reportType");

-- CreateIndex
CREATE INDEX "diagnostic_records_userEmail_createdAt_idx" ON "diagnostic_records"("userEmail", "createdAt");

-- CreateIndex
CREATE INDEX "diagnostic_records_userId_createdAt_idx" ON "diagnostic_records"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "diagnostic_records_diagnosticType_createdAt_idx" ON "diagnostic_records"("diagnosticType", "createdAt");

-- CreateIndex
CREATE INDEX "diagnostic_records_reportStatus_createdAt_idx" ON "diagnostic_records"("reportStatus", "createdAt");

-- CreateIndex
CREATE INDEX "diagnostic_records_status_createdAt_idx" ON "diagnostic_records"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_report_orders_stripeSessionId_key" ON "diagnostic_report_orders"("stripeSessionId");

-- CreateIndex
CREATE INDEX "diagnostic_report_orders_diagnosticRecordId_idx" ON "diagnostic_report_orders"("diagnosticRecordId");

-- CreateIndex
CREATE INDEX "diagnostic_report_orders_status_createdAt_idx" ON "diagnostic_report_orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "diagnostic_artifacts_diagnosticRef_idx" ON "diagnostic_artifacts"("diagnosticRef");

-- CreateIndex
CREATE INDEX "diagnostic_artifacts_diagnosticId_idx" ON "diagnostic_artifacts"("diagnosticId");

-- CreateIndex
CREATE INDEX "diagnostic_artifacts_version_idx" ON "diagnostic_artifacts"("version");

-- CreateIndex
CREATE INDEX "diagnostic_artifacts_isRevoked_idx" ON "diagnostic_artifacts"("isRevoked");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_artifacts_diagnosticRef_version_kind_key" ON "diagnostic_artifacts"("diagnosticRef", "version", "kind");

-- CreateIndex
CREATE INDEX "diagnostic_regeneration_jobs_diagnosticRef_idx" ON "diagnostic_regeneration_jobs"("diagnosticRef");

-- CreateIndex
CREATE INDEX "diagnostic_regeneration_jobs_diagnosticId_idx" ON "diagnostic_regeneration_jobs"("diagnosticId");

-- CreateIndex
CREATE INDEX "diagnostic_regeneration_jobs_status_createdAt_idx" ON "diagnostic_regeneration_jobs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "diagnostic_audit_events_diagnosticRef_idx" ON "diagnostic_audit_events"("diagnosticRef");

-- CreateIndex
CREATE INDEX "diagnostic_audit_events_diagnosticId_idx" ON "diagnostic_audit_events"("diagnosticId");

-- CreateIndex
CREATE INDEX "diagnostic_audit_events_createdAt_idx" ON "diagnostic_audit_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_artifact_access_grants_entitlementKey_key" ON "diagnostic_artifact_access_grants"("entitlementKey");

-- CreateIndex
CREATE INDEX "diagnostic_artifact_access_grants_diagnosticRef_idx" ON "diagnostic_artifact_access_grants"("diagnosticRef");

-- CreateIndex
CREATE INDEX "diagnostic_artifact_access_grants_diagnosticId_idx" ON "diagnostic_artifact_access_grants"("diagnosticId");

-- CreateIndex
CREATE INDEX "diagnostic_artifact_access_grants_granteeEmail_idx" ON "diagnostic_artifact_access_grants"("granteeEmail");

-- CreateIndex
CREATE INDEX "diagnostic_artifact_access_grants_diagnosticRef_granteeEmai_idx" ON "diagnostic_artifact_access_grants"("diagnosticRef", "granteeEmail");

-- CreateIndex
CREATE INDEX "diagnostic_lineage_events_diagnosticRef_idx" ON "diagnostic_lineage_events"("diagnosticRef");

-- CreateIndex
CREATE INDEX "diagnostic_lineage_events_diagnosticId_idx" ON "diagnostic_lineage_events"("diagnosticId");

-- CreateIndex
CREATE INDEX "diagnostic_lineage_events_createdAt_idx" ON "diagnostic_lineage_events"("createdAt");

-- CreateIndex
CREATE INDEX "proof_evidence_sourceStage_createdAt_idx" ON "proof_evidence"("sourceStage", "createdAt");

-- CreateIndex
CREATE INDEX "proof_evidence_proofType_createdAt_idx" ON "proof_evidence"("proofType", "createdAt");

-- CreateIndex
CREATE INDEX "proof_evidence_approvalStatus_displayStatus_idx" ON "proof_evidence"("approvalStatus", "displayStatus");

-- CreateIndex
CREATE INDEX "proof_evidence_followupAt_idx" ON "proof_evidence"("followupAt");

-- CreateIndex
CREATE INDEX "ClientEntitlement_email_idx" ON "ClientEntitlement"("email");

-- CreateIndex
CREATE INDEX "ClientEntitlement_productCode_idx" ON "ClientEntitlement"("productCode");

-- CreateIndex
CREATE INDEX "ClientEntitlement_email_productCode_status_idx" ON "ClientEntitlement"("email", "productCode", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCustomer_email_key" ON "BillingCustomer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCustomer_stripeCustomerId_key" ON "BillingCustomer"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "OperationalIncident_status_severity_idx" ON "OperationalIncident"("status", "severity");

-- CreateIndex
CREATE INDEX "OperationalIncident_firstSeenAt_idx" ON "OperationalIncident"("firstSeenAt");

-- CreateIndex
CREATE INDEX "ArtifactManifest_subjectEmail_createdAt_idx" ON "ArtifactManifest"("subjectEmail", "createdAt");

-- CreateIndex
CREATE INDEX "ArtifactManifest_artifactId_idx" ON "ArtifactManifest"("artifactId");

-- CreateIndex
CREATE INDEX "ArtifactManifest_isRevoked_expiresAt_idx" ON "ArtifactManifest"("isRevoked", "expiresAt");

-- CreateIndex
CREATE INDEX "JobDeadLetter_queue_status_createdAt_idx" ON "JobDeadLetter"("queue", "status", "createdAt");

-- CreateIndex
CREATE INDEX "JobDeadLetter_jobType_status_createdAt_idx" ON "JobDeadLetter"("jobType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceLevelSnapshot_serviceName_windowStart_windowEnd_idx" ON "ServiceLevelSnapshot"("serviceName", "windowStart", "windowEnd");

-- CreateIndex
CREATE UNIQUE INDEX "RunbookEntry_slug_key" ON "RunbookEntry"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "decision_recommendation_sessions_sessionKey_key" ON "decision_recommendation_sessions"("sessionKey");

-- CreateIndex
CREATE INDEX "decision_recommendation_sessions_sessionKey_idx" ON "decision_recommendation_sessions"("sessionKey");

-- CreateIndex
CREATE INDEX "decision_recommendation_sessions_submissionId_idx" ON "decision_recommendation_sessions"("submissionId");

-- CreateIndex
CREATE INDEX "decision_recommendation_sessions_anonymousId_idx" ON "decision_recommendation_sessions"("anonymousId");

-- CreateIndex
CREATE INDEX "decision_recommendation_sessions_email_idx" ON "decision_recommendation_sessions"("email");

-- CreateIndex
CREATE INDEX "decision_recommendation_sessions_route_idx" ON "decision_recommendation_sessions"("route");

-- CreateIndex
CREATE INDEX "decision_recommendation_sessions_readinessTier_idx" ON "decision_recommendation_sessions"("readinessTier");

-- CreateIndex
CREATE INDEX "decision_recommendation_sessions_authorityType_idx" ON "decision_recommendation_sessions"("authorityType");

-- CreateIndex
CREATE INDEX "decision_recommendation_sessions_converted_idx" ON "decision_recommendation_sessions"("converted");

-- CreateIndex
CREATE INDEX "decision_recommendation_sessions_createdAt_idx" ON "decision_recommendation_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "decision_recommendation_impressions_sessionId_idx" ON "decision_recommendation_impressions"("sessionId");

-- CreateIndex
CREATE INDEX "decision_recommendation_impressions_assetId_idx" ON "decision_recommendation_impressions"("assetId");

-- CreateIndex
CREATE INDEX "decision_recommendation_impressions_assetKind_idx" ON "decision_recommendation_impressions"("assetKind");

-- CreateIndex
CREATE INDEX "decision_recommendation_impressions_createdAt_idx" ON "decision_recommendation_impressions"("createdAt");

-- CreateIndex
CREATE INDEX "decision_recommendation_clicks_sessionId_idx" ON "decision_recommendation_clicks"("sessionId");

-- CreateIndex
CREATE INDEX "decision_recommendation_clicks_impressionId_idx" ON "decision_recommendation_clicks"("impressionId");

-- CreateIndex
CREATE INDEX "decision_recommendation_clicks_assetId_idx" ON "decision_recommendation_clicks"("assetId");

-- CreateIndex
CREATE INDEX "decision_recommendation_clicks_assetKind_idx" ON "decision_recommendation_clicks"("assetKind");

-- CreateIndex
CREATE INDEX "decision_recommendation_clicks_isConverted_idx" ON "decision_recommendation_clicks"("isConverted");

-- CreateIndex
CREATE INDEX "decision_recommendation_clicks_createdAt_idx" ON "decision_recommendation_clicks"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "decision_recommendation_conversions_clickId_key" ON "decision_recommendation_conversions"("clickId");

-- CreateIndex
CREATE INDEX "decision_recommendation_conversions_sessionId_idx" ON "decision_recommendation_conversions"("sessionId");

-- CreateIndex
CREATE INDEX "decision_recommendation_conversions_clickId_idx" ON "decision_recommendation_conversions"("clickId");

-- CreateIndex
CREATE INDEX "decision_recommendation_conversions_assetId_idx" ON "decision_recommendation_conversions"("assetId");

-- CreateIndex
CREATE INDEX "decision_recommendation_conversions_assetKind_idx" ON "decision_recommendation_conversions"("assetKind");

-- CreateIndex
CREATE INDEX "decision_recommendation_conversions_conversionType_idx" ON "decision_recommendation_conversions"("conversionType");

-- CreateIndex
CREATE INDEX "decision_recommendation_conversions_createdAt_idx" ON "decision_recommendation_conversions"("createdAt");

-- CreateIndex
CREATE INDEX "decision_session_followups_sessionId_idx" ON "decision_session_followups"("sessionId");

-- CreateIndex
CREATE INDEX "decision_session_followups_createdAt_idx" ON "decision_session_followups"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "decision_asset_efficacy_assetId_key" ON "decision_asset_efficacy"("assetId");

-- CreateIndex
CREATE INDEX "decision_asset_efficacy_assetKind_idx" ON "decision_asset_efficacy"("assetKind");

-- CreateIndex
CREATE INDEX "decision_asset_efficacy_efficacyScore_idx" ON "decision_asset_efficacy"("efficacyScore");

-- CreateIndex
CREATE INDEX "decision_asset_efficacy_decisionUsefulnessScore_idx" ON "decision_asset_efficacy"("decisionUsefulnessScore");

-- CreateIndex
CREATE INDEX "decision_asset_efficacy_confidenceScore_idx" ON "decision_asset_efficacy"("confidenceScore");

-- CreateIndex
CREATE INDEX "decision_asset_efficacy_lastEvaluatedAt_idx" ON "decision_asset_efficacy"("lastEvaluatedAt");

-- CreateIndex
CREATE INDEX "decision_asset_context_performance_contextType_contextValue_idx" ON "decision_asset_context_performance"("contextType", "contextValue");

-- CreateIndex
CREATE INDEX "decision_asset_context_performance_assetId_idx" ON "decision_asset_context_performance"("assetId");

-- CreateIndex
CREATE INDEX "decision_asset_context_performance_assetKind_idx" ON "decision_asset_context_performance"("assetKind");

-- CreateIndex
CREATE INDEX "decision_asset_context_performance_usefulnessScore_idx" ON "decision_asset_context_performance"("usefulnessScore");

-- CreateIndex
CREATE INDEX "decision_asset_context_performance_confidenceScore_idx" ON "decision_asset_context_performance"("confidenceScore");

-- CreateIndex
CREATE INDEX "decision_asset_context_performance_contextualWeight_idx" ON "decision_asset_context_performance"("contextualWeight");

-- CreateIndex
CREATE INDEX "decision_asset_context_performance_lastEvaluatedAt_idx" ON "decision_asset_context_performance"("lastEvaluatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "decision_asset_context_performance_assetId_contextType_cont_key" ON "decision_asset_context_performance"("assetId", "contextType", "contextValue");

-- CreateIndex
CREATE UNIQUE INDEX "governance_metric_definitions_key_key" ON "governance_metric_definitions"("key");

-- CreateIndex
CREATE INDEX "governance_metric_definitions_category_idx" ON "governance_metric_definitions"("category");

-- CreateIndex
CREATE UNIQUE INDEX "decision_signal_registry_registryKey_key" ON "decision_signal_registry"("registryKey");

-- CreateIndex
CREATE INDEX "decision_signal_registry_assetId_idx" ON "decision_signal_registry"("assetId");

-- CreateIndex
CREATE INDEX "decision_signal_registry_status_idx" ON "decision_signal_registry"("status");

-- CreateIndex
CREATE INDEX "decision_signal_registry_highestSeverity_idx" ON "decision_signal_registry"("highestSeverity");

-- CreateIndex
CREATE UNIQUE INDEX "decision_signal_registry_assetId_contextType_contextValue_key" ON "decision_signal_registry"("assetId", "contextType", "contextValue");

-- CreateIndex
CREATE INDEX "decision_governance_alerts_assetId_idx" ON "decision_governance_alerts"("assetId");

-- CreateIndex
CREATE INDEX "decision_governance_alerts_assetKind_idx" ON "decision_governance_alerts"("assetKind");

-- CreateIndex
CREATE INDEX "decision_governance_alerts_contextType_contextValue_idx" ON "decision_governance_alerts"("contextType", "contextValue");

-- CreateIndex
CREATE INDEX "decision_governance_alerts_registryKey_idx" ON "decision_governance_alerts"("registryKey");

-- CreateIndex
CREATE INDEX "decision_governance_alerts_alertType_idx" ON "decision_governance_alerts"("alertType");

-- CreateIndex
CREATE INDEX "decision_governance_alerts_metricKey_idx" ON "decision_governance_alerts"("metricKey");

-- CreateIndex
CREATE INDEX "decision_governance_alerts_severity_idx" ON "decision_governance_alerts"("severity");

-- CreateIndex
CREATE INDEX "decision_governance_alerts_status_idx" ON "decision_governance_alerts"("status");

-- CreateIndex
CREATE INDEX "decision_governance_alerts_isActive_idx" ON "decision_governance_alerts"("isActive");

-- CreateIndex
CREATE INDEX "decision_governance_alerts_createdAt_idx" ON "decision_governance_alerts"("createdAt");

-- CreateIndex
CREATE INDEX "decision_governance_alerts_lastDetectedAt_idx" ON "decision_governance_alerts"("lastDetectedAt");

-- CreateIndex
CREATE INDEX "PurposeAlignmentAssessment_userId_createdAt_idx" ON "PurposeAlignmentAssessment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PurposeAlignmentAssessment_sessionKey_createdAt_idx" ON "PurposeAlignmentAssessment"("sessionKey", "createdAt");

-- CreateIndex
CREATE INDEX "PurposeAlignmentReport_assessmentId_generatedAt_idx" ON "PurposeAlignmentReport"("assessmentId", "generatedAt");

-- CreateIndex
CREATE INDEX "purpose_alignment_reminder_preferences_userId_idx" ON "purpose_alignment_reminder_preferences"("userId");

-- CreateIndex
CREATE INDEX "purpose_alignment_reminder_preferences_sessionKey_idx" ON "purpose_alignment_reminder_preferences"("sessionKey");

-- CreateIndex
CREATE INDEX "purpose_alignment_reminder_preferences_isEnabled_idx" ON "purpose_alignment_reminder_preferences"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "purpose_alignment_reminder_preferences_userId_sessionKey_key" ON "purpose_alignment_reminder_preferences"("userId", "sessionKey");

-- CreateIndex
CREATE INDEX "purpose_alignment_reminder_logs_userId_idx" ON "purpose_alignment_reminder_logs"("userId");

-- CreateIndex
CREATE INDEX "purpose_alignment_reminder_logs_sessionKey_idx" ON "purpose_alignment_reminder_logs"("sessionKey");

-- CreateIndex
CREATE INDEX "purpose_alignment_reminder_logs_status_idx" ON "purpose_alignment_reminder_logs"("status");

-- CreateIndex
CREATE INDEX "purpose_alignment_reminder_logs_scheduledFor_idx" ON "purpose_alignment_reminder_logs"("scheduledFor");

-- CreateIndex
CREATE INDEX "purpose_alignment_reminder_logs_assessmentId_idx" ON "purpose_alignment_reminder_logs"("assessmentId");

-- CreateIndex
CREATE INDEX "purpose_alignment_reminder_logs_preferenceId_idx" ON "purpose_alignment_reminder_logs"("preferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionAssetPerformance_assetId_key" ON "DecisionAssetPerformance"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "inner_circle_members_email_key" ON "inner_circle_members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "inner_circle_members_email_hash_key" ON "inner_circle_members"("email_hash");

-- CreateIndex
CREATE INDEX "inner_circle_members_status_idx" ON "inner_circle_members"("status");

-- CreateIndex
CREATE INDEX "inner_circle_members_tier_idx" ON "inner_circle_members"("tier");

-- CreateIndex
CREATE INDEX "inner_circle_members_role_idx" ON "inner_circle_members"("role");

-- CreateIndex
CREATE INDEX "inner_circle_members_email_hash_idx" ON "inner_circle_members"("email_hash");

-- CreateIndex
CREATE INDEX "inner_circle_members_last_seen_at_idx" ON "inner_circle_members"("last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_key" ON "admin_sessions"("token");

-- CreateIndex
CREATE INDEX "admin_sessions_memberId_idx" ON "admin_sessions"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_memberId_idx" ON "api_keys"("memberId");

-- CreateIndex
CREATE INDEX "api_logs_createdAt_idx" ON "api_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "inner_circle_keys_keyHash_key" ON "inner_circle_keys"("keyHash");

-- CreateIndex
CREATE INDEX "inner_circle_keys_memberId_idx" ON "inner_circle_keys"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "mfa_setups_userId_key" ON "mfa_setups"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionId_key" ON "sessions"("sessionId");

-- CreateIndex
CREATE INDEX "sessions_memberId_idx" ON "sessions"("memberId");

-- CreateIndex
CREATE INDEX "security_logs_createdAt_idx" ON "security_logs"("createdAt");

-- CreateIndex
CREATE INDEX "page_views_path_idx" ON "page_views"("path");

-- CreateIndex
CREATE INDEX "page_views_memberId_idx" ON "page_views"("memberId");

-- CreateIndex
CREATE INDEX "rate_limit_logs_key_idx" ON "rate_limit_logs"("key");

-- CreateIndex
CREATE INDEX "system_audit_logs_action_idx" ON "system_audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_memberId_key" ON "user_preferences"("memberId");

-- CreateIndex
CREATE INDEX "user_integrations_userId_idx" ON "user_integrations"("userId");

-- CreateIndex
CREATE INDEX "user_integrations_provider_idx" ON "user_integrations"("provider");

-- CreateIndex
CREATE INDEX "user_integrations_status_idx" ON "user_integrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_integrations_userId_provider_key" ON "user_integrations"("userId", "provider");

-- CreateIndex
CREATE INDEX "behavioral_signal_snapshots_userId_generatedAt_idx" ON "behavioral_signal_snapshots"("userId", "generatedAt");

-- CreateIndex
CREATE INDEX "behavioral_signal_snapshots_userId_source_signalKey_idx" ON "behavioral_signal_snapshots"("userId", "source", "signalKey");

-- CreateIndex
CREATE INDEX "behavioral_signal_snapshots_userId_source_signalKey_generat_idx" ON "behavioral_signal_snapshots"("userId", "source", "signalKey", "generatedAt");

-- CreateIndex
CREATE INDEX "behavioral_signal_snapshots_organisationId_generatedAt_idx" ON "behavioral_signal_snapshots"("organisationId", "generatedAt");

-- CreateIndex
CREATE INDEX "behavioral_signal_snapshots_accountId_generatedAt_idx" ON "behavioral_signal_snapshots"("accountId", "generatedAt");

-- CreateIndex
CREATE INDEX "strategy_inquiries_email_idx" ON "strategy_inquiries"("email");

-- CreateIndex
CREATE INDEX "strategy_intakes_organisation_idx" ON "strategy_intakes"("organisation");

-- CreateIndex
CREATE INDEX "ConstitutionalIntakeReport_createdAt_idx" ON "ConstitutionalIntakeReport"("createdAt");

-- CreateIndex
CREATE INDEX "ConstitutionalIntakeReport_campaignId_idx" ON "ConstitutionalIntakeReport"("campaignId");

-- CreateIndex
CREATE INDEX "ConstitutionalIntakeReport_sessionKey_idx" ON "ConstitutionalIntakeReport"("sessionKey");

-- CreateIndex
CREATE INDEX "ConstitutionalIntakeReport_respondentKey_idx" ON "ConstitutionalIntakeReport"("respondentKey");

-- CreateIndex
CREATE INDEX "ConstitutionalIntakeReport_email_idx" ON "ConstitutionalIntakeReport"("email");

-- CreateIndex
CREATE INDEX "ConstitutionalIntakeReport_organisation_idx" ON "ConstitutionalIntakeReport"("organisation");

-- CreateIndex
CREATE INDEX "ConstitutionalIntakeReport_route_idx" ON "ConstitutionalIntakeReport"("route");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveReportingRun_runKey_key" ON "ExecutiveReportingRun"("runKey");

-- CreateIndex
CREATE INDEX "ExecutiveReportingRun_campaignId_idx" ON "ExecutiveReportingRun"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveReportingArtifact_artifactKey_key" ON "ExecutiveReportingArtifact"("artifactKey");

-- CreateIndex
CREATE INDEX "ExecutiveReportingArtifact_runId_idx" ON "ExecutiveReportingArtifact"("runId");

-- CreateIndex
CREATE INDEX "ExecutiveReportingArtifact_kind_idx" ON "ExecutiveReportingArtifact"("kind");

-- CreateIndex
CREATE INDEX "ExecutiveReportingArtifact_runId_kind_idx" ON "ExecutiveReportingArtifact"("runId", "kind");

-- CreateIndex
CREATE INDEX "ExecutiveReportingArtifact_status_idx" ON "ExecutiveReportingArtifact"("status");

-- CreateIndex
CREATE INDEX "ExecutiveReportingArtifact_createdAt_idx" ON "ExecutiveReportingArtifact"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticJourney_journeyKey_key" ON "DiagnosticJourney"("journeyKey");

-- CreateIndex
CREATE INDEX "DiagnosticJourney_subjectKey_idx" ON "DiagnosticJourney"("subjectKey");

-- CreateIndex
CREATE INDEX "DiagnosticJourney_userId_idx" ON "DiagnosticJourney"("userId");

-- CreateIndex
CREATE INDEX "DiagnosticJourney_email_idx" ON "DiagnosticJourney"("email");

-- CreateIndex
CREATE INDEX "DiagnosticJourney_organisationKey_idx" ON "DiagnosticJourney"("organisationKey");

-- CreateIndex
CREATE INDEX "DiagnosticJourney_diagnosticType_idx" ON "DiagnosticJourney"("diagnosticType");

-- CreateIndex
CREATE INDEX "DiagnosticJourney_parentJourneyId_idx" ON "DiagnosticJourney"("parentJourneyId");

-- CreateIndex
CREATE INDEX "DiagnosticJourney_monitoringCadence_idx" ON "DiagnosticJourney"("monitoringCadence");

-- CreateIndex
CREATE INDEX "DiagnosticJourney_status_idx" ON "DiagnosticJourney"("status");

-- CreateIndex
CREATE INDEX "DiagnosticEvidenceNode_journeyId_idx" ON "DiagnosticEvidenceNode"("journeyId");

-- CreateIndex
CREATE INDEX "DiagnosticEvidenceNode_email_idx" ON "DiagnosticEvidenceNode"("email");

-- CreateIndex
CREATE INDEX "DiagnosticEvidenceNode_sourceStage_idx" ON "DiagnosticEvidenceNode"("sourceStage");

-- CreateIndex
CREATE INDEX "DiagnosticEvidenceNode_kind_idx" ON "DiagnosticEvidenceNode"("kind");

-- CreateIndex
CREATE INDEX "DiagnosticEvidenceNode_severity_idx" ON "DiagnosticEvidenceNode"("severity");

-- CreateIndex
CREATE INDEX "DiagnosticEvidenceNode_createdAt_idx" ON "DiagnosticEvidenceNode"("createdAt");

-- CreateIndex
CREATE INDEX "DiagnosticDecisionObject_journeyId_idx" ON "DiagnosticDecisionObject"("journeyId");

-- CreateIndex
CREATE INDEX "DiagnosticDecisionObject_email_idx" ON "DiagnosticDecisionObject"("email");

-- CreateIndex
CREATE INDEX "DiagnosticDecisionObject_decisionKey_idx" ON "DiagnosticDecisionObject"("decisionKey");

-- CreateIndex
CREATE INDEX "DiagnosticDecisionObject_sourceStage_idx" ON "DiagnosticDecisionObject"("sourceStage");

-- CreateIndex
CREATE INDEX "DiagnosticDecisionObject_aiExposureLevel_idx" ON "DiagnosticDecisionObject"("aiExposureLevel");

-- CreateIndex
CREATE INDEX "DiagnosticDecisionObject_decisionVelocityScore_idx" ON "DiagnosticDecisionObject"("decisionVelocityScore");

-- CreateIndex
CREATE INDEX "DiagnosticDecisionObject_createdAt_idx" ON "DiagnosticDecisionObject"("createdAt");

-- CreateIndex
CREATE INDEX "DecisionDependency_parentDecisionId_idx" ON "DecisionDependency"("parentDecisionId");

-- CreateIndex
CREATE INDEX "DecisionDependency_childDecisionId_idx" ON "DecisionDependency"("childDecisionId");

-- CreateIndex
CREATE INDEX "DecisionDependency_relationshipType_idx" ON "DecisionDependency"("relationshipType");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionDependency_parentDecisionId_childDecisionId_relatio_key" ON "DecisionDependency"("parentDecisionId", "childDecisionId", "relationshipType");

-- CreateIndex
CREATE INDEX "DecisionStakeholder_decisionObjectId_idx" ON "DecisionStakeholder"("decisionObjectId");

-- CreateIndex
CREATE INDEX "DecisionStakeholder_influenceLevel_idx" ON "DecisionStakeholder"("influenceLevel");

-- CreateIndex
CREATE INDEX "DecisionStakeholder_alignmentState_idx" ON "DecisionStakeholder"("alignmentState");

-- CreateIndex
CREATE INDEX "StakeholderPosition_stakeholderId_idx" ON "StakeholderPosition"("stakeholderId");

-- CreateIndex
CREATE INDEX "StakeholderPosition_contradictionFlag_idx" ON "StakeholderPosition"("contradictionFlag");

-- CreateIndex
CREATE INDEX "StakeholderPosition_createdAt_idx" ON "StakeholderPosition"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorType_idx" ON "AuditEvent"("actorType");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "AuditEvent_objectType_objectId_idx" ON "AuditEvent"("objectType", "objectId");

-- CreateIndex
CREATE INDEX "AuditEvent_actionType_idx" ON "AuditEvent"("actionType");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "case_share_invites_tokenHash_key" ON "case_share_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "case_share_invites_caseId_idx" ON "case_share_invites"("caseId");

-- CreateIndex
CREATE INDEX "case_share_invites_ownerEmail_idx" ON "case_share_invites"("ownerEmail");

-- CreateIndex
CREATE INDEX "case_share_invites_status_expiresAt_idx" ON "case_share_invites"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "ProvenanceChainAnchor_scope_scopeId_idx" ON "ProvenanceChainAnchor"("scope", "scopeId");

-- CreateIndex
CREATE INDEX "ProvenanceChainAnchor_scope_scopeId_computedAt_idx" ON "ProvenanceChainAnchor"("scope", "scopeId", "computedAt");

-- CreateIndex
CREATE INDEX "ProvenanceChainAnchor_merkleRoot_idx" ON "ProvenanceChainAnchor"("merkleRoot");

-- CreateIndex
CREATE INDEX "ProvenanceChainAnchor_chainHash_idx" ON "ProvenanceChainAnchor"("chainHash");

-- CreateIndex
CREATE INDEX "EnforcementPlaybook_triggerPattern_idx" ON "EnforcementPlaybook"("triggerPattern");

-- CreateIndex
CREATE INDEX "EnforcementPlaybook_status_idx" ON "EnforcementPlaybook"("status");

-- CreateIndex
CREATE INDEX "PlaybookApplication_playbookId_idx" ON "PlaybookApplication"("playbookId");

-- CreateIndex
CREATE INDEX "PlaybookApplication_retainedDecisionId_idx" ON "PlaybookApplication"("retainedDecisionId");

-- CreateIndex
CREATE INDEX "PlaybookApplication_status_idx" ON "PlaybookApplication"("status");

-- CreateIndex
CREATE INDEX "PlaybookApplication_createdAt_idx" ON "PlaybookApplication"("createdAt");

-- CreateIndex
CREATE INDEX "FoundationTelemetryEvent_organisationId_idx" ON "FoundationTelemetryEvent"("organisationId");

-- CreateIndex
CREATE INDEX "FoundationTelemetryEvent_contractId_idx" ON "FoundationTelemetryEvent"("contractId");

-- CreateIndex
CREATE INDEX "FoundationTelemetryEvent_decisionObjectId_idx" ON "FoundationTelemetryEvent"("decisionObjectId");

-- CreateIndex
CREATE INDEX "FoundationTelemetryEvent_eventType_idx" ON "FoundationTelemetryEvent"("eventType");

-- CreateIndex
CREATE INDEX "FoundationTelemetryEvent_createdAt_idx" ON "FoundationTelemetryEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RetainerContract_stripeSubscriptionId_key" ON "RetainerContract"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "RetainerContract_organisationId_idx" ON "RetainerContract"("organisationId");

-- CreateIndex
CREATE INDEX "RetainerContract_organisationId_status_idx" ON "RetainerContract"("organisationId", "status");

-- CreateIndex
CREATE INDEX "RetainerContract_tier_idx" ON "RetainerContract"("tier");

-- CreateIndex
CREATE INDEX "RetainerContract_status_idx" ON "RetainerContract"("status");

-- CreateIndex
CREATE INDEX "RetainerContract_stripeSubscriptionId_idx" ON "RetainerContract"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "RetainedDecision_contractId_idx" ON "RetainedDecision"("contractId");

-- CreateIndex
CREATE INDEX "RetainedDecision_decisionObjectId_idx" ON "RetainedDecision"("decisionObjectId");

-- CreateIndex
CREATE INDEX "RetainedDecision_contractId_status_idx" ON "RetainedDecision"("contractId", "status");

-- CreateIndex
CREATE INDEX "RetainedDecision_priorityLevel_idx" ON "RetainedDecision"("priorityLevel");

-- CreateIndex
CREATE INDEX "RetainedDecision_status_idx" ON "RetainedDecision"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RetainedDecision_contractId_decisionObjectId_key" ON "RetainedDecision"("contractId", "decisionObjectId");

-- CreateIndex
CREATE INDEX "EnforcementCycle_retainedDecisionId_idx" ON "EnforcementCycle"("retainedDecisionId");

-- CreateIndex
CREATE INDEX "EnforcementCycle_cycleDate_idx" ON "EnforcementCycle"("cycleDate");

-- CreateIndex
CREATE INDEX "EnforcementCycle_retainedDecisionId_cycleDate_idx" ON "EnforcementCycle"("retainedDecisionId", "cycleDate");

-- CreateIndex
CREATE INDEX "DiagnosticStageRecord_journeyId_idx" ON "DiagnosticStageRecord"("journeyId");

-- CreateIndex
CREATE INDEX "DiagnosticStageRecord_stage_idx" ON "DiagnosticStageRecord"("stage");

-- CreateIndex
CREATE INDEX "LongitudinalComparisonRecord_journeyId_idx" ON "LongitudinalComparisonRecord"("journeyId");

-- CreateIndex
CREATE INDEX "LongitudinalComparisonRecord_baselineJourneyId_idx" ON "LongitudinalComparisonRecord"("baselineJourneyId");

-- CreateIndex
CREATE INDEX "LongitudinalComparisonRecord_subjectKey_idx" ON "LongitudinalComparisonRecord"("subjectKey");

-- CreateIndex
CREATE INDEX "LongitudinalComparisonRecord_email_idx" ON "LongitudinalComparisonRecord"("email");

-- CreateIndex
CREATE INDEX "LongitudinalComparisonRecord_organisationKey_idx" ON "LongitudinalComparisonRecord"("organisationKey");

-- CreateIndex
CREATE INDEX "LongitudinalComparisonRecord_diagnosticType_idx" ON "LongitudinalComparisonRecord"("diagnosticType");

-- CreateIndex
CREATE INDEX "LongitudinalComparisonRecord_createdAt_idx" ON "LongitudinalComparisonRecord"("createdAt");

-- CreateIndex
CREATE INDEX "MultiStakeholderResult_campaignId_idx" ON "MultiStakeholderResult"("campaignId");

-- CreateIndex
CREATE INDEX "MultiStakeholderResult_organisationId_idx" ON "MultiStakeholderResult"("organisationId");

-- CreateIndex
CREATE INDEX "MultiStakeholderResult_organisationKey_idx" ON "MultiStakeholderResult"("organisationKey");

-- CreateIndex
CREATE INDEX "MultiStakeholderResult_diagnosticType_idx" ON "MultiStakeholderResult"("diagnosticType");

-- CreateIndex
CREATE INDEX "MultiStakeholderResult_createdAt_idx" ON "MultiStakeholderResult"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MultiStakeholderResult_campaignId_diagnosticType_key" ON "MultiStakeholderResult"("campaignId", "diagnosticType");

-- CreateIndex
CREATE INDEX "OutcomeVerificationRecord_baselineJourneyId_idx" ON "OutcomeVerificationRecord"("baselineJourneyId");

-- CreateIndex
CREATE INDEX "OutcomeVerificationRecord_followUpJourneyId_idx" ON "OutcomeVerificationRecord"("followUpJourneyId");

-- CreateIndex
CREATE INDEX "OutcomeVerificationRecord_decisionObjectId_idx" ON "OutcomeVerificationRecord"("decisionObjectId");

-- CreateIndex
CREATE INDEX "OutcomeVerificationRecord_sessionId_idx" ON "OutcomeVerificationRecord"("sessionId");

-- CreateIndex
CREATE INDEX "OutcomeVerificationRecord_organisationKey_idx" ON "OutcomeVerificationRecord"("organisationKey");

-- CreateIndex
CREATE INDEX "OutcomeVerificationRecord_subjectType_idx" ON "OutcomeVerificationRecord"("subjectType");

-- CreateIndex
CREATE INDEX "OutcomeVerificationRecord_subjectId_idx" ON "OutcomeVerificationRecord"("subjectId");

-- CreateIndex
CREATE INDEX "OutcomeVerificationRecord_subjectType_subjectId_idx" ON "OutcomeVerificationRecord"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "OutcomeVerificationRecord_outcomeClassification_idx" ON "OutcomeVerificationRecord"("outcomeClassification");

-- CreateIndex
CREATE INDEX "OutcomeVerificationRecord_createdAt_idx" ON "OutcomeVerificationRecord"("createdAt");

-- CreateIndex
CREATE INDEX "DiagnosticThreadSnapshot_journeyId_idx" ON "DiagnosticThreadSnapshot"("journeyId");

-- CreateIndex
CREATE INDEX "DiagnosticThreadSnapshot_createdAt_idx" ON "DiagnosticThreadSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "MonitoringSnapshot_journeyId_idx" ON "MonitoringSnapshot"("journeyId");

-- CreateIndex
CREATE INDEX "MonitoringSnapshot_organisationId_idx" ON "MonitoringSnapshot"("organisationId");

-- CreateIndex
CREATE INDEX "MonitoringSnapshot_campaignId_idx" ON "MonitoringSnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "MonitoringSnapshot_cadence_idx" ON "MonitoringSnapshot"("cadence");

-- CreateIndex
CREATE INDEX "MonitoringSnapshot_createdAt_idx" ON "MonitoringSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "BenchmarkFact_assessmentType_idx" ON "BenchmarkFact"("assessmentType");

-- CreateIndex
CREATE INDEX "BenchmarkFact_recordedAt_idx" ON "BenchmarkFact"("recordedAt");

-- CreateIndex
CREATE INDEX "BenchmarkCohortSnapshot_cohortKey_idx" ON "BenchmarkCohortSnapshot"("cohortKey");

-- CreateIndex
CREATE INDEX "BenchmarkCohortSnapshot_sampleSize_idx" ON "BenchmarkCohortSnapshot"("sampleSize");

-- CreateIndex
CREATE INDEX "BenchmarkCohortSnapshot_createdAt_idx" ON "BenchmarkCohortSnapshot"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyRoomSession_sessionKey_key" ON "StrategyRoomSession"("sessionKey");

-- CreateIndex
CREATE UNIQUE INDEX "AdminDecisionContextualEfficacy_joinKey_key" ON "AdminDecisionContextualEfficacy"("joinKey");

-- CreateIndex
CREATE UNIQUE INDEX "content_metadata_slug_key" ON "content_metadata"("slug");

-- CreateIndex
CREATE INDEX "content_metadata_slug_idx" ON "content_metadata"("slug");

-- CreateIndex
CREATE INDEX "content_metadata_classification_idx" ON "content_metadata"("classification");

-- CreateIndex
CREATE INDEX "content_metadata_contentType_idx" ON "content_metadata"("contentType");

-- CreateIndex
CREATE UNIQUE INDEX "frameworks_slug_key" ON "frameworks"("slug");

-- CreateIndex
CREATE INDEX "frameworks_slug_idx" ON "frameworks"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_links_sourceId_targetId_key" ON "strategic_links"("sourceId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "content_relations_sourceId_targetId_relationType_key" ON "content_relations"("sourceId", "targetId", "relationType");

-- CreateIndex
CREATE INDEX "private_annotations_memberId_idx" ON "private_annotations"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "canon_entries_slug_key" ON "canon_entries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_frameworks_key_key" ON "strategic_frameworks"("key");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_frameworks_slug_key" ON "strategic_frameworks"("slug");

-- CreateIndex
CREATE INDEX "strategic_frameworks_slug_idx" ON "strategic_frameworks"("slug");

-- CreateIndex
CREATE INDEX "StrategicIntervention_organisationId_idx" ON "StrategicIntervention"("organisationId");

-- CreateIndex
CREATE INDEX "StrategicIntervention_campaignId_idx" ON "StrategicIntervention"("campaignId");

-- CreateIndex
CREATE INDEX "StrategicIntervention_status_idx" ON "StrategicIntervention"("status");

-- CreateIndex
CREATE INDEX "CorrectionNode_interventionId_idx" ON "CorrectionNode"("interventionId");

-- CreateIndex
CREATE INDEX "DecisionAssetGovernanceRule_assetId_idx" ON "DecisionAssetGovernanceRule"("assetId");

-- CreateIndex
CREATE INDEX "DecisionAssetGovernanceRule_assetKind_idx" ON "DecisionAssetGovernanceRule"("assetKind");

-- CreateIndex
CREATE INDEX "DecisionAssetGovernanceRule_contextType_contextValue_idx" ON "DecisionAssetGovernanceRule"("contextType", "contextValue");

-- CreateIndex
CREATE INDEX "DecisionAssetGovernanceRule_ruleType_idx" ON "DecisionAssetGovernanceRule"("ruleType");

-- CreateIndex
CREATE INDEX "download_audit_events_slug_idx" ON "download_audit_events"("slug");

-- CreateIndex
CREATE INDEX "download_audit_events_createdAt_idx" ON "download_audit_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "print_assets_slug_key" ON "print_assets"("slug");

-- CreateIndex
CREATE INDEX "print_assets_slug_idx" ON "print_assets"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "premium_download_tokens_tokenId_key" ON "premium_download_tokens"("tokenId");

-- CreateIndex
CREATE INDEX "premium_download_tokens_tokenId_idx" ON "premium_download_tokens"("tokenId");

-- CreateIndex
CREATE INDEX "premium_download_attempts_createdAt_idx" ON "premium_download_attempts"("createdAt");

-- CreateIndex
CREATE INDEX "framework_access_logs_slug_idx" ON "framework_access_logs"("slug");

-- CreateIndex
CREATE INDEX "decision_journey_events_sessionId_idx" ON "decision_journey_events"("sessionId");

-- CreateIndex
CREATE INDEX "decision_journey_events_stage_idx" ON "decision_journey_events"("stage");

-- CreateIndex
CREATE INDEX "decision_journey_events_createdAt_idx" ON "decision_journey_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "strategy_room_execution_sessions_sessionKey_key" ON "strategy_room_execution_sessions"("sessionKey");

-- CreateIndex
CREATE INDEX "strategy_room_execution_sessions_email_idx" ON "strategy_room_execution_sessions"("email");

-- CreateIndex
CREATE INDEX "strategy_room_execution_sessions_status_idx" ON "strategy_room_execution_sessions"("status");

-- CreateIndex
CREATE INDEX "strategy_decision_logs_sessionId_idx" ON "strategy_decision_logs"("sessionId");

-- CreateIndex
CREATE INDEX "strategy_decision_logs_status_idx" ON "strategy_decision_logs"("status");

-- CreateIndex
CREATE INDEX "strategy_decision_logs_decisionObjectId_idx" ON "strategy_decision_logs"("decisionObjectId");

-- CreateIndex
CREATE INDEX "_failed_entitlement_grants_email_idx" ON "_failed_entitlement_grants"("email");

-- CreateIndex
CREATE INDEX "_failed_entitlement_grants_resolved_idx" ON "_failed_entitlement_grants"("resolved");

-- CreateIndex
CREATE INDEX "consequence_timeline_sessionId_idx" ON "consequence_timeline"("sessionId");

-- CreateIndex
CREATE INDEX "consequence_timeline_createdAt_idx" ON "consequence_timeline"("createdAt");

-- CreateIndex
CREATE INDEX "escalation_events_sessionId_idx" ON "escalation_events"("sessionId");

-- CreateIndex
CREATE INDEX "escalation_events_createdAt_idx" ON "escalation_events"("createdAt");

-- CreateIndex
CREATE INDEX "calibration_states_modelKey_idx" ON "calibration_states"("modelKey");

-- CreateIndex
CREATE INDEX "calibration_states_status_idx" ON "calibration_states"("status");

-- CreateIndex
CREATE UNIQUE INDEX "calibration_states_modelKey_modelVersion_key" ON "calibration_states"("modelKey", "modelVersion");

-- CreateIndex
CREATE INDEX "calibration_events_modelKey_modelVersion_idx" ON "calibration_events"("modelKey", "modelVersion");

-- CreateIndex
CREATE INDEX "calibration_events_sessionKey_idx" ON "calibration_events"("sessionKey");

-- CreateIndex
CREATE INDEX "calibration_events_applied_idx" ON "calibration_events"("applied");

-- CreateIndex
CREATE INDEX "pattern_breaker_contracts_ownerEmail_idx" ON "pattern_breaker_contracts"("ownerEmail");

-- CreateIndex
CREATE INDEX "pattern_breaker_contracts_source_idx" ON "pattern_breaker_contracts"("source");

-- CreateIndex
CREATE INDEX "pattern_breaker_contracts_status_idx" ON "pattern_breaker_contracts"("status");

-- CreateIndex
CREATE INDEX "pattern_breaker_contracts_dueAt_idx" ON "pattern_breaker_contracts"("dueAt");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_routeKey_identityKey_idx" ON "rate_limit_buckets"("routeKey", "identityKey");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_expiresAt_idx" ON "rate_limit_buckets"("expiresAt");

-- CreateIndex
CREATE INDEX "decision_memories_userId_idx" ON "decision_memories"("userId");

-- CreateIndex
CREATE INDEX "decision_memories_organisationId_idx" ON "decision_memories"("organisationId");

-- CreateIndex
CREATE INDEX "decision_memories_sessionId_idx" ON "decision_memories"("sessionId");

-- CreateIndex
CREATE INDEX "decision_memories_createdAt_idx" ON "decision_memories"("createdAt");

-- CreateIndex
CREATE INDEX "abuse_events_identityKey_idx" ON "abuse_events"("identityKey");

-- CreateIndex
CREATE INDEX "abuse_events_ipAddress_idx" ON "abuse_events"("ipAddress");

-- CreateIndex
CREATE INDEX "abuse_events_createdAt_idx" ON "abuse_events"("createdAt");

-- CreateIndex
CREATE INDEX "abuse_events_ruleTriggered_idx" ON "abuse_events"("ruleTriggered");

-- CreateIndex
CREATE UNIQUE INDEX "abuse_fingerprints_identityKey_key" ON "abuse_fingerprints"("identityKey");

-- CreateIndex
CREATE INDEX "abuse_fingerprints_identityKey_idx" ON "abuse_fingerprints"("identityKey");

-- CreateIndex
CREATE INDEX "abuse_fingerprints_variationScore_idx" ON "abuse_fingerprints"("variationScore");

-- CreateIndex
CREATE INDEX "abuse_decisions_identityKey_idx" ON "abuse_decisions"("identityKey");

-- CreateIndex
CREATE INDEX "abuse_decisions_level_idx" ON "abuse_decisions"("level");

-- CreateIndex
CREATE INDEX "abuse_decisions_expiresAt_idx" ON "abuse_decisions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_identities_identityKey_key" ON "blocked_identities"("identityKey");

-- CreateIndex
CREATE INDEX "blocked_identities_identityKey_idx" ON "blocked_identities"("identityKey");

-- CreateIndex
CREATE INDEX "blocked_identities_expiresAt_idx" ON "blocked_identities"("expiresAt");

-- CreateIndex
CREATE INDEX "canary_tripwires_identityKey_idx" ON "canary_tripwires"("identityKey");

-- CreateIndex
CREATE INDEX "canary_tripwires_tripwireType_idx" ON "canary_tripwires"("tripwireType");

-- CreateIndex
CREATE INDEX "canary_tripwires_createdAt_idx" ON "canary_tripwires"("createdAt");

-- CreateIndex
CREATE INDEX "evidence_vault_identityKey_idx" ON "evidence_vault"("identityKey");

-- CreateIndex
CREATE INDEX "evidence_vault_eventType_idx" ON "evidence_vault"("eventType");

-- CreateIndex
CREATE INDEX "evidence_vault_severity_idx" ON "evidence_vault"("severity");

-- CreateIndex
CREATE INDEX "evidence_vault_createdAt_idx" ON "evidence_vault"("createdAt");

-- CreateIndex
CREATE INDEX "decision_contact_ledger_userId_idx" ON "decision_contact_ledger"("userId");

-- CreateIndex
CREATE INDEX "decision_contact_ledger_sessionId_idx" ON "decision_contact_ledger"("sessionId");

-- CreateIndex
CREATE INDEX "decision_contact_ledger_journeyId_idx" ON "decision_contact_ledger"("journeyId");

-- CreateIndex
CREATE INDEX "decision_contact_ledger_state_idx" ON "decision_contact_ledger"("state");

-- CreateIndex
CREATE INDEX "decision_contact_ledger_sentAt_idx" ON "decision_contact_ledger"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "decision_session_sessionId_key" ON "decision_session"("sessionId");

-- CreateIndex
CREATE INDEX "decision_session_sessionId_idx" ON "decision_session"("sessionId");

-- CreateIndex
CREATE INDEX "decision_session_createdAt_idx" ON "decision_session"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_identity_emailHash_key" ON "user_identity"("emailHash");

-- CreateIndex
CREATE INDEX "user_identity_emailHash_idx" ON "user_identity"("emailHash");

-- CreateIndex
CREATE UNIQUE INDEX "session_link_sessionId_key" ON "session_link"("sessionId");

-- CreateIndex
CREATE INDEX "session_link_userId_idx" ON "session_link"("userId");

-- CreateIndex
CREATE INDEX "session_link_sessionId_idx" ON "session_link"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "intelligence_commons_record_sessionHash_key" ON "intelligence_commons_record"("sessionHash");

-- CreateIndex
CREATE INDEX "intelligence_commons_record_revenueBand_idx" ON "intelligence_commons_record"("revenueBand");

-- CreateIndex
CREATE INDEX "intelligence_commons_record_industryTag_idx" ON "intelligence_commons_record"("industryTag");

-- CreateIndex
CREATE INDEX "intelligence_commons_record_overallPosture_idx" ON "intelligence_commons_record"("overallPosture");

-- CreateIndex
CREATE INDEX "intelligence_commons_record_trajectory_idx" ON "intelligence_commons_record"("trajectory");

-- CreateIndex
CREATE INDEX "intelligence_commons_record_recordedAt_idx" ON "intelligence_commons_record"("recordedAt");

-- CreateIndex
CREATE INDEX "institutional_memory_snapshot_organisationHandle_idx" ON "institutional_memory_snapshot"("organisationHandle");

-- CreateIndex
CREATE INDEX "institutional_memory_snapshot_recordedAt_idx" ON "institutional_memory_snapshot"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_assignment_organisationHandle_key" ON "cohort_assignment"("organisationHandle");

-- CreateIndex
CREATE INDEX "cohort_assignment_organisationHandle_idx" ON "cohort_assignment"("organisationHandle");

-- CreateIndex
CREATE INDEX "cohort_assignment_cohortId_idx" ON "cohort_assignment"("cohortId");

-- CreateIndex
CREATE UNIQUE INDEX "benchmark_aggregates_key_key" ON "benchmark_aggregates"("key");

-- CreateIndex
CREATE INDEX "benchmark_aggregates_assessmentKind_idx" ON "benchmark_aggregates"("assessmentKind");

-- CreateIndex
CREATE INDEX "benchmark_aggregates_computedAt_idx" ON "benchmark_aggregates"("computedAt");

-- CreateIndex
CREATE INDEX "integration_tokens_provider_idx" ON "integration_tokens"("provider");

-- CreateIndex
CREATE INDEX "integration_tokens_status_idx" ON "integration_tokens"("status");

-- CreateIndex
CREATE UNIQUE INDEX "integration_tokens_provider_organisationId_key" ON "integration_tokens"("provider", "organisationId");

-- CreateIndex
CREATE INDEX "linkedin_publishing_connections_provider_idx" ON "linkedin_publishing_connections"("provider");

-- CreateIndex
CREATE INDEX "linkedin_publishing_connections_profileKey_idx" ON "linkedin_publishing_connections"("profileKey");

-- CreateIndex
CREATE INDEX "linkedin_publishing_connections_status_idx" ON "linkedin_publishing_connections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "linkedin_publishing_connections_provider_profileKey_ownerTy_key" ON "linkedin_publishing_connections"("provider", "profileKey", "ownerType");

-- CreateIndex
CREATE INDEX "linkedin_publish_attempts_outboundSlug_idx" ON "linkedin_publish_attempts"("outboundSlug");

-- CreateIndex
CREATE INDEX "linkedin_publish_attempts_status_idx" ON "linkedin_publish_attempts"("status");

-- CreateIndex
CREATE INDEX "linkedin_publish_attempts_requestId_idx" ON "linkedin_publish_attempts"("requestId");

-- CreateIndex
CREATE INDEX "outbound_publish_ledger_provider_idx" ON "outbound_publish_ledger"("provider");

-- CreateIndex
CREATE INDEX "outbound_publish_ledger_outboundItemId_idx" ON "outbound_publish_ledger"("outboundItemId");

-- CreateIndex
CREATE INDEX "outbound_publish_ledger_assetSlug_idx" ON "outbound_publish_ledger"("assetSlug");

-- CreateIndex
CREATE INDEX "outbound_publish_ledger_status_idx" ON "outbound_publish_ledger"("status");

-- CreateIndex
CREATE INDEX "outbound_publish_ledger_createdAt_idx" ON "outbound_publish_ledger"("createdAt");

-- CreateIndex
CREATE INDEX "outbound_publish_ledger_idempotencyKey_idx" ON "outbound_publish_ledger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "outbound_publish_ledger_source_idx" ON "outbound_publish_ledger"("source");

-- CreateIndex
CREATE UNIQUE INDEX "outbound_publish_ledger_idempotencyKey_key" ON "outbound_publish_ledger"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "scheduler_locks_lockKey_key" ON "scheduler_locks"("lockKey");

-- CreateIndex
CREATE INDEX "scheduler_locks_lockKey_idx" ON "scheduler_locks"("lockKey");

-- CreateIndex
CREATE INDEX "scheduler_locks_expiresAt_idx" ON "scheduler_locks"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "scheduler_runs_runKey_key" ON "scheduler_runs"("runKey");

-- CreateIndex
CREATE INDEX "scheduler_runs_runKey_idx" ON "scheduler_runs"("runKey");

-- CreateIndex
CREATE INDEX "scheduler_runs_source_idx" ON "scheduler_runs"("source");

-- CreateIndex
CREATE INDEX "scheduler_runs_status_idx" ON "scheduler_runs"("status");

-- CreateIndex
CREATE INDEX "scheduler_runs_startedAt_idx" ON "scheduler_runs"("startedAt");

-- CreateIndex
CREATE INDEX "rate_limit_event_cleanup_idx" ON "rate_limit_events"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_events_scope_identifierHash_windowStart_windowSe_key" ON "rate_limit_events"("scope", "identifierHash", "windowStart", "windowSeconds");

-- CreateIndex
CREATE INDEX "terms_acceptances_userId_idx" ON "terms_acceptances"("userId");

-- CreateIndex
CREATE INDEX "terms_acceptances_email_idx" ON "terms_acceptances"("email");

-- CreateIndex
CREATE INDEX "terms_acceptances_docType_version_idx" ON "terms_acceptances"("docType", "version");

-- CreateIndex
CREATE UNIQUE INDEX "terms_acceptances_userId_docType_key" ON "terms_acceptances"("userId", "docType");

-- CreateIndex
CREATE INDEX "stale_case_notifications_caseId_idx" ON "stale_case_notifications"("caseId");

-- CreateIndex
CREATE INDEX "stale_case_notifications_userEmail_idx" ON "stale_case_notifications"("userEmail");

-- CreateIndex
CREATE INDEX "stale_case_notifications_sentAt_idx" ON "stale_case_notifications"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "stale_case_notifications_caseId_userEmail_band_key" ON "stale_case_notifications"("caseId", "userEmail", "band");

-- CreateIndex
CREATE INDEX "security_assurance_requests_email_idx" ON "security_assurance_requests"("email");

-- CreateIndex
CREATE INDEX "security_assurance_requests_requestedMaterial_idx" ON "security_assurance_requests"("requestedMaterial");

-- CreateIndex
CREATE INDEX "security_assurance_requests_status_idx" ON "security_assurance_requests"("status");

-- CreateIndex
CREATE INDEX "security_assurance_requests_createdAt_idx" ON "security_assurance_requests"("createdAt");

-- CreateIndex
CREATE INDEX "facebook_oauth_connections_pageId_idx" ON "facebook_oauth_connections"("pageId");

-- CreateIndex
CREATE INDEX "facebook_publish_attempts_assetSlug_idx" ON "facebook_publish_attempts"("assetSlug");

-- CreateIndex
CREATE INDEX "facebook_publish_attempts_status_idx" ON "facebook_publish_attempts"("status");

-- CreateIndex
CREATE INDEX "facebook_publish_attempts_requestId_idx" ON "facebook_publish_attempts"("requestId");

-- CreateIndex
CREATE INDEX "x_oauth_connections_userId_idx" ON "x_oauth_connections"("userId");

-- CreateIndex
CREATE INDEX "x_publish_attempts_assetSlug_idx" ON "x_publish_attempts"("assetSlug");

-- CreateIndex
CREATE INDEX "x_publish_attempts_status_idx" ON "x_publish_attempts"("status");

-- CreateIndex
CREATE INDEX "x_publish_attempts_requestId_idx" ON "x_publish_attempts"("requestId");

-- AddForeignKey
ALTER TABLE "AlignmentCampaign" ADD CONSTRAINT "AlignmentCampaign_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlignmentCampaign" ADD CONSTRAINT "AlignmentCampaign_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "OrganisationMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlignmentSnapshot" ADD CONSTRAINT "AlignmentSnapshot_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AlignmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlignmentSnapshot" ADD CONSTRAINT "AlignmentSnapshot_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_invites" ADD CONSTRAINT "organisation_invites_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationMembership" ADD CONSTRAINT "OrganisationMembership_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessKeyUse" ADD CONSTRAINT "AccessKeyUse_accessKeyId_fkey" FOREIGN KEY ("accessKeyId") REFERENCES "AccessKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessKeyUse" ADD CONSTRAINT "AccessKeyUse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignParticipant" ADD CONSTRAINT "CampaignParticipant_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AlignmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignParticipant" ADD CONSTRAINT "CampaignParticipant_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrganisationMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_responses" ADD CONSTRAINT "audit_responses_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AlignmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseAssessment" ADD CONSTRAINT "EnterpriseAssessment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AlignmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseAssessment" ADD CONSTRAINT "EnterpriseAssessment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "CampaignParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAssessmentSnapshot" ADD CONSTRAINT "TeamAssessmentSnapshot_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AlignmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAssessmentInvite" ADD CONSTRAINT "TeamAssessmentInvite_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "TeamAssessmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAssessmentResponse" ADD CONSTRAINT "TeamAssessmentResponse_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "TeamAssessmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAssessmentResponse" ADD CONSTRAINT "TeamAssessmentResponse_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "TeamAssessmentInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAssessmentAggregate" ADD CONSTRAINT "TeamAssessmentAggregate_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "TeamAssessmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationAssessmentSnapshot" ADD CONSTRAINT "OrganisationAssessmentSnapshot_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AlignmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipGapSnapshot" ADD CONSTRAINT "LeadershipGapSnapshot_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AlignmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseReport" ADD CONSTRAINT "EnterpriseReport_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AlignmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_report_orders" ADD CONSTRAINT "diagnostic_report_orders_diagnosticRecordId_fkey" FOREIGN KEY ("diagnosticRecordId") REFERENCES "diagnostic_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_artifacts" ADD CONSTRAINT "diagnostic_artifacts_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "diagnostic_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_regeneration_jobs" ADD CONSTRAINT "diagnostic_regeneration_jobs_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "diagnostic_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_audit_events" ADD CONSTRAINT "diagnostic_audit_events_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "diagnostic_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_artifact_access_grants" ADD CONSTRAINT "diagnostic_artifact_access_grants_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "diagnostic_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_lineage_events" ADD CONSTRAINT "diagnostic_lineage_events_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "diagnostic_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_recommendation_impressions" ADD CONSTRAINT "decision_recommendation_impressions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "decision_recommendation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_recommendation_clicks" ADD CONSTRAINT "decision_recommendation_clicks_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "decision_recommendation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_recommendation_clicks" ADD CONSTRAINT "decision_recommendation_clicks_impressionId_fkey" FOREIGN KEY ("impressionId") REFERENCES "decision_recommendation_impressions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_recommendation_conversions" ADD CONSTRAINT "decision_recommendation_conversions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "decision_recommendation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_recommendation_conversions" ADD CONSTRAINT "decision_recommendation_conversions_clickId_fkey" FOREIGN KEY ("clickId") REFERENCES "decision_recommendation_clicks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_session_followups" ADD CONSTRAINT "decision_session_followups_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "decision_recommendation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_asset_context_performance" ADD CONSTRAINT "decision_asset_context_performance_decisionAssetEfficacyId_fkey" FOREIGN KEY ("decisionAssetEfficacyId") REFERENCES "decision_asset_efficacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_signal_registry" ADD CONSTRAINT "decision_signal_registry_metricKey_fkey" FOREIGN KEY ("metricKey") REFERENCES "governance_metric_definitions"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_signal_registry" ADD CONSTRAINT "decision_signal_registry_assetEfficacyId_fkey" FOREIGN KEY ("assetEfficacyId") REFERENCES "decision_asset_efficacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_signal_registry" ADD CONSTRAINT "decision_signal_registry_contextPerformanceId_fkey" FOREIGN KEY ("contextPerformanceId") REFERENCES "decision_asset_context_performance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_governance_alerts" ADD CONSTRAINT "decision_governance_alerts_assetEfficacyId_fkey" FOREIGN KEY ("assetEfficacyId") REFERENCES "decision_asset_efficacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_governance_alerts" ADD CONSTRAINT "decision_governance_alerts_contextPerformanceId_fkey" FOREIGN KEY ("contextPerformanceId") REFERENCES "decision_asset_context_performance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_governance_alerts" ADD CONSTRAINT "decision_governance_alerts_signalRegistryId_fkey" FOREIGN KEY ("signalRegistryId") REFERENCES "decision_signal_registry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurposeAlignmentReport" ADD CONSTRAINT "PurposeAlignmentReport_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "PurposeAlignmentAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purpose_alignment_reminder_preferences" ADD CONSTRAINT "purpose_alignment_reminder_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purpose_alignment_reminder_logs" ADD CONSTRAINT "purpose_alignment_reminder_logs_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "PurposeAlignmentAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purpose_alignment_reminder_logs" ADD CONSTRAINT "purpose_alignment_reminder_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purpose_alignment_reminder_logs" ADD CONSTRAINT "purpose_alignment_reminder_logs_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "purpose_alignment_reminder_preferences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inner_circle_keys" ADD CONSTRAINT "inner_circle_keys_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_setups" ADD CONSTRAINT "mfa_setups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_limit_logs" ADD CONSTRAINT "rate_limit_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_inquiries" ADD CONSTRAINT "strategy_inquiries_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_intakes" ADD CONSTRAINT "strategy_intakes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstitutionalIntakeReport" ADD CONSTRAINT "ConstitutionalIntakeReport_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AlignmentCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveReportingRun" ADD CONSTRAINT "ExecutiveReportingRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AlignmentCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveReportingArtifact" ADD CONSTRAINT "ExecutiveReportingArtifact_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ExecutiveReportingRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticEvidenceNode" ADD CONSTRAINT "DiagnosticEvidenceNode_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "DiagnosticJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticDecisionObject" ADD CONSTRAINT "DiagnosticDecisionObject_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "DiagnosticJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionDependency" ADD CONSTRAINT "DecisionDependency_parentDecisionId_fkey" FOREIGN KEY ("parentDecisionId") REFERENCES "DiagnosticDecisionObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionDependency" ADD CONSTRAINT "DecisionDependency_childDecisionId_fkey" FOREIGN KEY ("childDecisionId") REFERENCES "DiagnosticDecisionObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionStakeholder" ADD CONSTRAINT "DecisionStakeholder_decisionObjectId_fkey" FOREIGN KEY ("decisionObjectId") REFERENCES "DiagnosticDecisionObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakeholderPosition" ADD CONSTRAINT "StakeholderPosition_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "DecisionStakeholder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybookApplication" ADD CONSTRAINT "PlaybookApplication_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "EnforcementPlaybook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybookApplication" ADD CONSTRAINT "PlaybookApplication_retainedDecisionId_fkey" FOREIGN KEY ("retainedDecisionId") REFERENCES "RetainedDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetainerContract" ADD CONSTRAINT "RetainerContract_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetainedDecision" ADD CONSTRAINT "RetainedDecision_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "RetainerContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetainedDecision" ADD CONSTRAINT "RetainedDecision_decisionObjectId_fkey" FOREIGN KEY ("decisionObjectId") REFERENCES "DiagnosticDecisionObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnforcementCycle" ADD CONSTRAINT "EnforcementCycle_retainedDecisionId_fkey" FOREIGN KEY ("retainedDecisionId") REFERENCES "RetainedDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticStageRecord" ADD CONSTRAINT "DiagnosticStageRecord_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "DiagnosticJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticThreadSnapshot" ADD CONSTRAINT "DiagnosticThreadSnapshot_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "DiagnosticJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringSnapshot" ADD CONSTRAINT "MonitoringSnapshot_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "DiagnosticJourney"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_links" ADD CONSTRAINT "strategic_links_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_links" ADD CONSTRAINT "strategic_links_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_relations" ADD CONSTRAINT "content_relations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_relations" ADD CONSTRAINT "content_relations_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_annotations" ADD CONSTRAINT "private_annotations_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_annotations" ADD CONSTRAINT "private_annotations_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canon_entries" ADD CONSTRAINT "canon_entries_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "content_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategicIntervention" ADD CONSTRAINT "StrategicIntervention_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategicIntervention" ADD CONSTRAINT "StrategicIntervention_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AlignmentCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionNode" ADD CONSTRAINT "CorrectionNode_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "StrategicIntervention"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionNode" ADD CONSTRAINT "CorrectionNode_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AlignmentCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_audit_events" ADD CONSTRAINT "download_audit_events_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_audit_events" ADD CONSTRAINT "download_audit_events_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_audit_events" ADD CONSTRAINT "download_audit_events_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_audit_events" ADD CONSTRAINT "download_audit_events_printAssetId_fkey" FOREIGN KEY ("printAssetId") REFERENCES "print_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium_download_tokens" ADD CONSTRAINT "premium_download_tokens_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_metadata"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium_download_tokens" ADD CONSTRAINT "premium_download_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium_download_attempts" ADD CONSTRAINT "premium_download_attempts_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "premium_download_tokens"("tokenId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "framework_access_logs" ADD CONSTRAINT "framework_access_logs_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "framework_access_logs" ADD CONSTRAINT "framework_access_logs_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "framework_access_logs" ADD CONSTRAINT "framework_access_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "inner_circle_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_decision_logs" ADD CONSTRAINT "strategy_decision_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "strategy_room_execution_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_decision_logs" ADD CONSTRAINT "strategy_decision_logs_decisionObjectId_fkey" FOREIGN KEY ("decisionObjectId") REFERENCES "DiagnosticDecisionObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_link" ADD CONSTRAINT "session_link_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "decision_session"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_link" ADD CONSTRAINT "session_link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

