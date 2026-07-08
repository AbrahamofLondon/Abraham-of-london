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
CREATE TABLE "inner_circle_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "access_state" TEXT NOT NULL DEFAULT 'Reader',
    "membership_tier" TEXT NOT NULL DEFAULT 'free',
    "active_path" TEXT NOT NULL DEFAULT 'founder-under-pressure',
    "subscription_status" TEXT NOT NULL DEFAULT 'free_trial',
    "trial_ends_at" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "subscription_product_code" TEXT,
    "subscription_started_at" TIMESTAMP(3),
    "subscription_cancelled_at" TIMESTAMP(3),
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inner_circle_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inner_circle_diagnostic_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tool_slug" TEXT NOT NULL,
    "path_slug" TEXT NOT NULL,
    "answers_json" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "risk_level" TEXT NOT NULL,
    "weakest_domains_json" JSONB NOT NULL,
    "recommended_next_action" TEXT NOT NULL,
    "recommended_product" TEXT NOT NULL,
    "lifecycle_status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inner_circle_diagnostic_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inner_circle_tool_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tool_slug" TEXT NOT NULL,
    "access_status" TEXT NOT NULL DEFAULT 'granted',
    "access_reason" TEXT,
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inner_circle_tool_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inner_circle_reading_path_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "path_slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inner_circle_reading_path_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inner_circle_worksheet_actions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "path_slug" TEXT NOT NULL,
    "task_key" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "response" TEXT,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "note" TEXT,
    "next_review_date" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "reminder_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inner_circle_worksheet_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inner_circle_advisory_qualifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trigger_result_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "risk_level" TEXT NOT NULL,
    "recommended_product" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata_json" JSONB,
    "admin_override" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inner_circle_advisory_qualifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pressure_signal_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "input_hash" TEXT NOT NULL,
    "pressure_level" TEXT NOT NULL,
    "recommended_product" TEXT NOT NULL,
    "safe_metrics_json" JSONB NOT NULL,
    "result_json" JSONB NOT NULL,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pressure_signal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_call_ledger_entries" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "edition_slug" TEXT NOT NULL,
    "call_statement" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT,
    "asset_class" TEXT,
    "theme" TEXT,
    "original_confidence_band" TEXT NOT NULL,
    "current_status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "current_score" INTEGER,
    "review_window_start" TIMESTAMP(3),
    "review_window_end" TIMESTAMP(3),
    "evidence_summary" TEXT NOT NULL DEFAULT '',
    "evidence_source_rows_json" JSONB NOT NULL DEFAULT '[]',
    "justification" TEXT NOT NULL DEFAULT '',
    "carry_forward_justification" TEXT,
    "last_reviewed_at" TIMESTAMP(3),
    "next_review_due" TIMESTAMP(3),
    "methodology_version" TEXT NOT NULL,
    "rubric_version" TEXT NOT NULL,
    "immutable_original_call_snapshot_json" JSONB,
    "reviewed_by" TEXT,
    "source_appendix_refs_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmi_call_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_call_ledger_status_history" (
    "id" TEXT NOT NULL,
    "ledger_entry_id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "previous_status" TEXT,
    "new_status" TEXT NOT NULL,
    "previous_score" INTEGER,
    "new_score" INTEGER,
    "evidence_summary" TEXT NOT NULL DEFAULT '',
    "evidence_source_rows_json" JSONB NOT NULL DEFAULT '[]',
    "justification" TEXT NOT NULL DEFAULT '',
    "actor" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gmi_call_ledger_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_red_team_submissions" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT,
    "call_id" TEXT,
    "submitter_name" TEXT NOT NULL,
    "submitter_email" TEXT NOT NULL,
    "organisation" TEXT,
    "counter_argument" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "source_links_json" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "admin_notes" TEXT,
    "public_response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,

    CONSTRAINT "gmi_red_team_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_falsification_rules" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "thesis_id" TEXT NOT NULL,
    "thesis_statement" TEXT NOT NULL,
    "falsification_condition" TEXT NOT NULL,
    "observable_indicator" TEXT NOT NULL,
    "threshold_type" TEXT NOT NULL,
    "threshold_value" TEXT NOT NULL,
    "current_status" TEXT NOT NULL DEFAULT 'monitoring',
    "evidence_source_rows_json" JSONB NOT NULL DEFAULT '[]',
    "next_review_due" TIMESTAMP(3),
    "last_reviewed_at" TIMESTAMP(3),
    "public_explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmi_falsification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_post_mortems" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "what_we_got_right_json" JSONB NOT NULL DEFAULT '[]',
    "what_we_got_wrong_json" JSONB NOT NULL DEFAULT '[]',
    "what_was_too_early_json" JSONB NOT NULL DEFAULT '[]',
    "what_we_underweighted_json" JSONB NOT NULL DEFAULT '[]',
    "what_changed_our_view_json" JSONB NOT NULL DEFAULT '[]',
    "lessons_for_next_quarter_json" JSONB NOT NULL DEFAULT '[]',
    "linked_calls_json" JSONB NOT NULL DEFAULT '[]',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmi_post_mortems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_edition_governance_state" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "publication_status" TEXT NOT NULL DEFAULT 'draft',
    "operator_consequence_index_json" JSONB NOT NULL DEFAULT '{}',
    "decisions_to_make_in_30_days_json" JSONB NOT NULL DEFAULT '[]',
    "decisions_to_prepare_in_90_days_json" JSONB NOT NULL DEFAULT '[]',
    "decisions_to_defer_json" JSONB NOT NULL DEFAULT '[]',
    "board_pulse_published_at" TIMESTAMP(3),
    "operator_brief_published_at" TIMESTAMP(3),
    "board_pack_generated_at" TIMESTAMP(3),
    "full_edition_gated" BOOLEAN NOT NULL DEFAULT true,
    "architect_edition_gated" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmi_edition_governance_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_release_snapshots" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "edition_slug" TEXT NOT NULL,
    "release_status" TEXT NOT NULL,
    "primary_next_action" TEXT,
    "methodology_version" TEXT NOT NULL,
    "rubric_version" TEXT NOT NULL,
    "call_ledger_hash" TEXT NOT NULL,
    "source_appendix_hash" TEXT NOT NULL,
    "falsification_hash" TEXT NOT NULL,
    "board_pulse_hash" TEXT NOT NULL,
    "performance_metrics_json" JSONB NOT NULL,
    "blockers_json" JSONB NOT NULL,
    "warnings_json" JSONB NOT NULL,
    "blocker_categories_json" JSONB NOT NULL,
    "state_json" JSONB,
    "created_by" TEXT,
    "published_by" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gmi_release_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_board_pack_artifacts" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "snapshot_id" TEXT,
    "artifact_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT,
    "public_url" TEXT,
    "content_hash" TEXT NOT NULL,
    "generated_from_state_hash" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "generated_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmi_board_pack_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_source_appendix_rows" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "source_row_id" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "evidence_class" TEXT NOT NULL,
    "confidence_basis" TEXT,
    "source_title" TEXT,
    "source_url" TEXT,
    "publisher" TEXT,
    "publication_date" TEXT,
    "access_date" TEXT,
    "observation_window" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "report_section" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SOURCE_PENDING',
    "release_blocker" BOOLEAN NOT NULL DEFAULT false,
    "method_note" TEXT,
    "admin_justification" TEXT,
    "source_visibility" TEXT NOT NULL DEFAULT 'public',
    "linked_call_ids_json" JSONB NOT NULL DEFAULT '[]',
    "linked_thesis_ids_json" JSONB NOT NULL DEFAULT '[]',
    "imported_from" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmi_source_appendix_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_amendments" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "previous_value_json" JSONB NOT NULL,
    "new_value_json" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,
    "public_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gmi_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_benchmark_entries" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "call_id" TEXT,
    "benchmark_type" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "benchmark_statement" TEXT NOT NULL,
    "benchmark_value" TEXT,
    "actual_value" TEXT,
    "gmi_value" TEXT,
    "evaluation_window" TEXT NOT NULL,
    "result_summary" TEXT,
    "source_reference" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmi_benchmark_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_scenario_models" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "variables_json" TEXT NOT NULL,
    "assumptions_json" TEXT NOT NULL,
    "decision_implications_json" TEXT NOT NULL,
    "falsification_rule_ids" TEXT NOT NULL,
    "method_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmi_scenario_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmi_alert_rules" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "linked_call_id" TEXT,
    "linked_falsification_rule_id" TEXT,
    "alert_type" TEXT NOT NULL,
    "trigger_condition" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "delivery_mode" TEXT NOT NULL DEFAULT 'dashboard_only',
    "last_evaluated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmi_alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inner_circle_email_event_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "trigger_event" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inner_circle_email_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boardroom_brief_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "diagnostic_id" TEXT,
    "handoff_id" TEXT,
    "spine_id" TEXT,
    "stripe_session_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "delivery_status" TEXT NOT NULL DEFAULT 'requested',
    "source" TEXT NOT NULL DEFAULT 'inner_circle',
    "risk_level" TEXT,
    "score" INTEGER,
    "metadata_json" JSONB,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boardroom_brief_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boardroom_bridge_handoffs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "diagnostic_id" TEXT,
    "risk_level" TEXT,
    "recommended_route" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boardroom_bridge_handoffs_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "feedback_events" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT,
    "rating" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 3,
    "comment" TEXT,
    "followupRequested" BOOLEAN NOT NULL DEFAULT false,
    "evidenceHash" TEXT,
    "artifactVersion" TEXT,
    "productCode" TEXT,
    "userId" TEXT,
    "email" TEXT,
    "sessionId" TEXT,
    "sourceUrl" TEXT,
    "referrer" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'unknown',
    "deployCommit" TEXT,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "actionStatus" TEXT NOT NULL DEFAULT 'logged',
    "severity" TEXT NOT NULL DEFAULT 'low',
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_events_pkey" PRIMARY KEY ("id")
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
    "methods" TEXT DEFAULT 'totp',
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
CREATE TABLE "BoardroomDossier" (
    "id" TEXT NOT NULL,
    "spineId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "classification" TEXT NOT NULL DEFAULT 'BOARD_RESTRICTED',
    "qualifiedForBoard" BOOLEAN NOT NULL DEFAULT false,
    "gateMessage" TEXT,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "objectionHandling" JSONB NOT NULL DEFAULT '[]',
    "decisionPath" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generatedById" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientName" TEXT,
    "accessGrantedAt" TIMESTAMP(3),
    "accessRevokedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL_SYNTHETIC_SAMPLE',
    "sourceId" TEXT,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "inputSnapshotHash" TEXT,
    "artifactHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardroomDossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionActionLog" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "recommendedAction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "owner" TEXT,
    "dueDate" TIMESTAMP(3),
    "outcomeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sessionId" TEXT,
    "reportId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardroomDossierAccessToken" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardroomDossierAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardroomDeliveryEvent" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "clientEmail" TEXT,
    "performedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardroomDeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPortalSession" (
    "id" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPortalSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDecisionAction" (
    "id" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "dossierId" TEXT,
    "findingRef" TEXT,
    "findingTitle" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "actionedAt" TIMESTAMP(3),
    "outcomeNote" TEXT,
    "followUpDate" TIMESTAMP(3),
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDecisionAction_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "research_runs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "runType" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "moduleVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "actorId" TEXT,
    "actorEmail" TEXT,
    "inputJson" TEXT,
    "outputJson" TEXT,
    "baselineJson" TEXT,
    "findingsJson" TEXT,
    "blockingIssuesJson" TEXT,
    "dependenciesUnmetJson" TEXT,
    "recommendation" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "estimatedEffort" TEXT,
    "requiresOwnerDecision" BOOLEAN NOT NULL DEFAULT false,
    "decisionMadeAt" TIMESTAMP(3),
    "decisionOutcome" TEXT,
    "deferredReason" TEXT,
    "baselineId" TEXT,
    "driftDetected" BOOLEAN NOT NULL DEFAULT false,
    "driftSummary" TEXT,
    "exploitabilityScore" DOUBLE PRECISION,
    "detectionLikelihood" DOUBLE PRECISION,
    "assetAtRisk" TEXT,
    "attackVector" TEXT,
    "claimRisk" TEXT,
    "overclaims" TEXT,
    "forbiddenPhrases" TEXT,
    "humanReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "engineVersionJson" TEXT,
    "referenceVersionJson" TEXT,
    "schemaVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "contentFileHash" TEXT,
    "linkedRoute" TEXT,
    "linkedRouteExists" BOOLEAN,
    "linkedProductId" TEXT,
    "linkedFileHash" TEXT,
    "runCostEstimate" DOUBLE PRECISION,
    "durationMs" INTEGER,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "resurrectionCount" INTEGER NOT NULL DEFAULT 0,
    "resurrectedFromId" TEXT,
    "maturityStage" TEXT,
    "promotionDecision" TEXT,
    "promotionBlockersJson" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "implementedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundry_findings" (
    "id" TEXT NOT NULL,
    "researchRunId" TEXT NOT NULL,
    "findingType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "recommendation" TEXT,
    "evidence" TEXT,
    "moduleId" TEXT,
    "isActioned" BOOLEAN NOT NULL DEFAULT false,
    "actionedAt" TIMESTAMP(3),
    "actionedBy" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foundry_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundry_audit_events" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "reason" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foundry_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_briefs" (
    "id" TEXT NOT NULL,
    "researchRunId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "contentHash" TEXT NOT NULL,
    "briefJson" TEXT NOT NULL,
    "exportedById" TEXT,
    "exportedByEmail" TEXT,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ci_gate_blocks" (
    "id" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "blockingRunIds" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ci_gate_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundry_patterns" (
    "id" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "moduleId" TEXT,
    "findingType" TEXT,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "researchRunIds" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foundry_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundry_promotions" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStage" TEXT NOT NULL,
    "toStage" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL,
    "promotionReason" TEXT NOT NULL,
    "criteriaMetJson" TEXT,
    "blockersJson" TEXT,
    "researchRunId" TEXT,
    "rollbackAt" TIMESTAMP(3),
    "rollbackReason" TEXT,
    "rollbackBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foundry_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finding_feedback" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "engineId" TEXT,
    "moduleId" TEXT,
    "disposition" TEXT NOT NULL,
    "note" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finding_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_baselines" (
    "id" TEXT NOT NULL,
    "engineId" TEXT NOT NULL,
    "baselineMs" DOUBLE PRECISION NOT NULL,
    "p95Ms" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "notes" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_baselines_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "outbound_control_state" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "schedulerPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedReason" TEXT,
    "pausedById" TEXT,
    "pausedByEmail" TEXT,
    "pausedAt" TIMESTAMP(3),
    "resumedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbound_control_state_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "foundry_interest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organisation" TEXT,
    "role" TEXT,
    "decisionType" TEXT,
    "deadline" TEXT,
    "professionalHelpStatus" TEXT,
    "hasFinancialConstraint" BOOLEAN NOT NULL DEFAULT false,
    "alreadyTried" TEXT,
    "minimumOutcome" TEXT,
    "context" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'Medium',
    "sourceTest" TEXT,
    "ipHash" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foundry_interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_brief_orders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decisionSummary" TEXT,
    "decisionType" TEXT,
    "primaryFailurePoint" TEXT,
    "directive" TEXT,
    "sourceTest" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "verificationToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "decision_brief_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_outcome_ledger" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "evidenceBasisJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'RECOMMENDED',
    "sourceEngineId" TEXT,
    "journeyEventId" TEXT,
    "outcomeSummary" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_outcome_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetainerReviewQueueEntry" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "accountId" TEXT,
    "orgId" TEXT,
    "readinessStatus" TEXT NOT NULL,
    "reasons" JSONB NOT NULL,
    "availableSignals" JSONB NOT NULL,
    "missingRequirements" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNote" TEXT,

    CONSTRAINT "RetainerReviewQueueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_instrument_runs" (
    "id" TEXT NOT NULL,
    "instrumentSlug" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "entitlementSlug" TEXT NOT NULL,
    "entitlementVerified" BOOLEAN NOT NULL DEFAULT false,
    "inputSnapshotHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'STARTED',
    "scoreJson" JSONB,
    "artifactState" TEXT NOT NULL DEFAULT 'NONE',
    "artifactUrl" TEXT,
    "artifactHash" TEXT,
    "nextRouteSlug" TEXT,
    "runDurationMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "decision_instrument_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oversight_review_cycles" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "driftScore" DOUBLE PRECISION,
    "driftCategory" TEXT,
    "clientHealthStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "interventionCount" INTEGER NOT NULL DEFAULT 0,
    "interventionLog" JSONB NOT NULL DEFAULT '[]',
    "outcomeSummary" TEXT,
    "clientNotes" TEXT,
    "internalNotes" TEXT,
    "nextCycleDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oversight_review_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intelligence_spines" (
    "id" TEXT NOT NULL,
    "spineId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "diagnosticId" TEXT,
    "erRunId" TEXT,
    "executiveReportId" TEXT,
    "organisationId" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "decisionSubject" TEXT NOT NULL,
    "decisionContext" JSONB,
    "evidenceNodes" JSONB NOT NULL DEFAULT '[]',
    "authorityLevel" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "qualifyingChecks" JSONB,
    "inputSnapshotHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "retiredAt" TIMESTAMP(3),

    CONSTRAINT "intelligence_spines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_outcome_records" (
    "id" TEXT NOT NULL,
    "decisionInstrumentRunId" TEXT,
    "boardroomDossierId" TEXT,
    "decisionObjectId" TEXT,
    "strategySessionId" TEXT,
    "submittedByEmail" TEXT,
    "submittedByUserId" TEXT,
    "outcomeClass" TEXT NOT NULL,
    "outcomeDetail" TEXT,
    "ownerCorrect" BOOLEAN,
    "evidenceMissing" BOOLEAN NOT NULL DEFAULT false,
    "evidenceMissingNote" TEXT,
    "whatChanged" TEXT,
    "carryForward" TEXT,
    "decisionDeadline" TIMESTAMP(3),
    "outcomeDate" TIMESTAMP(3),
    "memorySummary" TEXT,
    "reviewedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_outcome_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_brief_requests" (
    "id" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "outcomeHypothesisId" TEXT,
    "productCode" TEXT NOT NULL,
    "sourceEntityType" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "userEmail" TEXT,
    "userId" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_brief_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_brief_responses" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "decisionOutcomeRecordId" TEXT,
    "submittedByEmail" TEXT,
    "outcomeClass" TEXT NOT NULL,
    "responsePayload" JSONB NOT NULL DEFAULT '{}',
    "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_brief_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outcome_pattern_observations" (
    "id" TEXT NOT NULL,
    "decisionOutcomeRecordId" TEXT,
    "userEmail" TEXT,
    "patternObservationId" TEXT,
    "patternType" TEXT NOT NULL,
    "riskOfRepeat" TEXT,
    "observationSummary" TEXT NOT NULL,
    "sourceRunIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outcome_pattern_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retainer_readiness_evaluations" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "userEmail" TEXT,
    "durableMemoryPresent" BOOLEAN NOT NULL DEFAULT false,
    "recurringDecisionPattern" BOOLEAN NOT NULL DEFAULT false,
    "outcomeHistoryPresent" BOOLEAN NOT NULL DEFAULT false,
    "repeatedHighRisk" BOOLEAN NOT NULL DEFAULT false,
    "evidenceQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "organisationSignalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallReadinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "readinessClass" TEXT NOT NULL DEFAULT 'NOT_READY',
    "evaluatorNotes" TEXT,
    "adminApprovalRequired" BOOLEAN NOT NULL DEFAULT true,
    "adminApprovedAt" TIMESTAMP(3),
    "adminApprovedBy" TEXT,
    "evidenceSourceIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retainer_readiness_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_artifacts" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
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
    "deliveredAt" TIMESTAMP(3),
    "publicSafeSummary" TEXT,
    "privateNotes" TEXT,
    "generatedBy" TEXT,
    "downloadUrl" TEXT,
    "admin_preview_url" TEXT,
    "customer_access_url" TEXT,
    "manifestId" TEXT,
    "parentArtifactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supersededAt" TIMESTAMP(3),

    CONSTRAINT "product_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_artifact_amendments" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "amendedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amendedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_artifact_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outcome_hypotheses" (
    "id" TEXT NOT NULL,
    "hypothesisId" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "sourceRunId" TEXT,
    "productArtifactId" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "predictedDecisionMove" TEXT NOT NULL,
    "expectedObservableChange" TEXT NOT NULL,
    "observationWindowDays" INTEGER NOT NULL DEFAULT 90,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "successIndicators" JSONB NOT NULL DEFAULT '[]',
    "failureIndicators" JSONB NOT NULL DEFAULT '[]',
    "ownerRole" TEXT,
    "returnBriefDueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "outcomeRecordId" TEXT,
    "exemptionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outcome_hypotheses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falsification_entries" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "artifactId" TEXT,
    "sourceEntityType" TEXT,
    "sourceEntityId" TEXT,
    "claimOrRecommendation" TEXT NOT NULL,
    "confidenceLevel" TEXT NOT NULL,
    "whatWouldChangeThisView" TEXT NOT NULL,
    "observableIndicator" TEXT NOT NULL,
    "threshold" TEXT,
    "reviewDate" TIMESTAMP(3),
    "evidenceCurrentlyMissing" TEXT,
    "strongestCounterargument" TEXT,
    "responseToCounterargument" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MONITORING',
    "overturnedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "falsification_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pattern_observations" (
    "id" TEXT NOT NULL,
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
    "acknowledgedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pattern_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_studies" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
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
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_study_evidence" (
    "id" TEXT NOT NULL,
    "caseStudyId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "evidenceHash" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_study_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_study_consents" (
    "id" TEXT NOT NULL,
    "caseStudyId" TEXT NOT NULL,
    "consentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "grantedByEmail" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'ANONYMISED_PUBLICATION',
    "anonymisedAllowed" BOOLEAN NOT NULL DEFAULT true,
    "publicUseAllowed" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_study_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_study_outcomes" (
    "id" TEXT NOT NULL,
    "caseStudyId" TEXT NOT NULL,
    "decisionOutcomeRecordId" TEXT,
    "outcomeClass" TEXT NOT NULL,
    "outcomeSummary" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_study_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_decision_registry_entries" (
    "id" TEXT NOT NULL,
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
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_decision_registry_entries_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "inner_circle_profiles_user_id_key" ON "inner_circle_profiles"("user_id");

-- CreateIndex
CREATE INDEX "inner_circle_profiles_access_state_idx" ON "inner_circle_profiles"("access_state");

-- CreateIndex
CREATE INDEX "inner_circle_profiles_membership_tier_idx" ON "inner_circle_profiles"("membership_tier");

-- CreateIndex
CREATE INDEX "inner_circle_profiles_subscription_status_idx" ON "inner_circle_profiles"("subscription_status");

-- CreateIndex
CREATE INDEX "inner_circle_profiles_active_path_idx" ON "inner_circle_profiles"("active_path");

-- CreateIndex
CREATE INDEX "inner_circle_diagnostic_results_user_id_idx" ON "inner_circle_diagnostic_results"("user_id");

-- CreateIndex
CREATE INDEX "inner_circle_diagnostic_results_tool_slug_idx" ON "inner_circle_diagnostic_results"("tool_slug");

-- CreateIndex
CREATE INDEX "inner_circle_diagnostic_results_risk_level_idx" ON "inner_circle_diagnostic_results"("risk_level");

-- CreateIndex
CREATE INDEX "inner_circle_diagnostic_results_recommended_product_idx" ON "inner_circle_diagnostic_results"("recommended_product");

-- CreateIndex
CREATE INDEX "inner_circle_diagnostic_results_created_at_idx" ON "inner_circle_diagnostic_results"("created_at");

-- CreateIndex
CREATE INDEX "inner_circle_tool_access_access_status_idx" ON "inner_circle_tool_access"("access_status");

-- CreateIndex
CREATE UNIQUE INDEX "inner_circle_tool_access_user_id_tool_slug_key" ON "inner_circle_tool_access"("user_id", "tool_slug");

-- CreateIndex
CREATE INDEX "inner_circle_reading_path_progress_status_idx" ON "inner_circle_reading_path_progress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "inner_circle_reading_path_progress_user_id_path_slug_key" ON "inner_circle_reading_path_progress"("user_id", "path_slug");

-- CreateIndex
CREATE INDEX "inner_circle_worksheet_actions_status_idx" ON "inner_circle_worksheet_actions"("status");

-- CreateIndex
CREATE INDEX "inner_circle_worksheet_actions_next_review_date_idx" ON "inner_circle_worksheet_actions"("next_review_date");

-- CreateIndex
CREATE INDEX "inner_circle_worksheet_actions_deadline_idx" ON "inner_circle_worksheet_actions"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "inner_circle_worksheet_actions_user_id_path_slug_task_key_key" ON "inner_circle_worksheet_actions"("user_id", "path_slug", "task_key");

-- CreateIndex
CREATE INDEX "inner_circle_advisory_qualifications_user_id_idx" ON "inner_circle_advisory_qualifications"("user_id");

-- CreateIndex
CREATE INDEX "inner_circle_advisory_qualifications_status_idx" ON "inner_circle_advisory_qualifications"("status");

-- CreateIndex
CREATE INDEX "inner_circle_advisory_qualifications_risk_level_idx" ON "inner_circle_advisory_qualifications"("risk_level");

-- CreateIndex
CREATE INDEX "inner_circle_advisory_qualifications_recommended_product_idx" ON "inner_circle_advisory_qualifications"("recommended_product");

-- CreateIndex
CREATE INDEX "pressure_signal_events_user_id_idx" ON "pressure_signal_events"("user_id");

-- CreateIndex
CREATE INDEX "pressure_signal_events_pressure_level_idx" ON "pressure_signal_events"("pressure_level");

-- CreateIndex
CREATE INDEX "pressure_signal_events_recommended_product_idx" ON "pressure_signal_events"("recommended_product");

-- CreateIndex
CREATE INDEX "pressure_signal_events_created_at_idx" ON "pressure_signal_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "gmi_call_ledger_entries_call_id_key" ON "gmi_call_ledger_entries"("call_id");

-- CreateIndex
CREATE INDEX "gmi_call_ledger_entries_edition_id_idx" ON "gmi_call_ledger_entries"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_call_ledger_entries_edition_slug_idx" ON "gmi_call_ledger_entries"("edition_slug");

-- CreateIndex
CREATE INDEX "gmi_call_ledger_entries_current_status_idx" ON "gmi_call_ledger_entries"("current_status");

-- CreateIndex
CREATE INDEX "gmi_call_ledger_entries_current_score_idx" ON "gmi_call_ledger_entries"("current_score");

-- CreateIndex
CREATE INDEX "gmi_call_ledger_entries_next_review_due_idx" ON "gmi_call_ledger_entries"("next_review_due");

-- CreateIndex
CREATE INDEX "gmi_call_ledger_status_history_ledger_entry_id_idx" ON "gmi_call_ledger_status_history"("ledger_entry_id");

-- CreateIndex
CREATE INDEX "gmi_call_ledger_status_history_call_id_idx" ON "gmi_call_ledger_status_history"("call_id");

-- CreateIndex
CREATE INDEX "gmi_call_ledger_status_history_created_at_idx" ON "gmi_call_ledger_status_history"("created_at");

-- CreateIndex
CREATE INDEX "gmi_red_team_submissions_edition_id_idx" ON "gmi_red_team_submissions"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_red_team_submissions_call_id_idx" ON "gmi_red_team_submissions"("call_id");

-- CreateIndex
CREATE INDEX "gmi_red_team_submissions_status_idx" ON "gmi_red_team_submissions"("status");

-- CreateIndex
CREATE INDEX "gmi_red_team_submissions_created_at_idx" ON "gmi_red_team_submissions"("created_at");

-- CreateIndex
CREATE INDEX "gmi_falsification_rules_edition_id_idx" ON "gmi_falsification_rules"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_falsification_rules_thesis_id_idx" ON "gmi_falsification_rules"("thesis_id");

-- CreateIndex
CREATE INDEX "gmi_falsification_rules_current_status_idx" ON "gmi_falsification_rules"("current_status");

-- CreateIndex
CREATE INDEX "gmi_falsification_rules_next_review_due_idx" ON "gmi_falsification_rules"("next_review_due");

-- CreateIndex
CREATE UNIQUE INDEX "gmi_falsification_rules_edition_id_thesis_id_key" ON "gmi_falsification_rules"("edition_id", "thesis_id");

-- CreateIndex
CREATE UNIQUE INDEX "gmi_post_mortems_edition_id_key" ON "gmi_post_mortems"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_post_mortems_edition_id_idx" ON "gmi_post_mortems"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_post_mortems_published_at_idx" ON "gmi_post_mortems"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "gmi_edition_governance_state_edition_id_key" ON "gmi_edition_governance_state"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_edition_governance_state_edition_id_idx" ON "gmi_edition_governance_state"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_edition_governance_state_publication_status_idx" ON "gmi_edition_governance_state"("publication_status");

-- CreateIndex
CREATE INDEX "gmi_release_snapshots_edition_id_idx" ON "gmi_release_snapshots"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_release_snapshots_created_at_idx" ON "gmi_release_snapshots"("created_at");

-- CreateIndex
CREATE INDEX "gmi_board_pack_artifacts_edition_id_idx" ON "gmi_board_pack_artifacts"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_board_pack_artifacts_snapshot_id_idx" ON "gmi_board_pack_artifacts"("snapshot_id");

-- CreateIndex
CREATE INDEX "gmi_board_pack_artifacts_artifact_type_idx" ON "gmi_board_pack_artifacts"("artifact_type");

-- CreateIndex
CREATE INDEX "gmi_board_pack_artifacts_status_idx" ON "gmi_board_pack_artifacts"("status");

-- CreateIndex
CREATE INDEX "gmi_board_pack_artifacts_generated_at_idx" ON "gmi_board_pack_artifacts"("generated_at");

-- CreateIndex
CREATE UNIQUE INDEX "gmi_source_appendix_rows_source_row_id_key" ON "gmi_source_appendix_rows"("source_row_id");

-- CreateIndex
CREATE INDEX "gmi_source_appendix_rows_edition_id_idx" ON "gmi_source_appendix_rows"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_source_appendix_rows_source_row_id_idx" ON "gmi_source_appendix_rows"("source_row_id");

-- CreateIndex
CREATE INDEX "gmi_source_appendix_rows_status_idx" ON "gmi_source_appendix_rows"("status");

-- CreateIndex
CREATE INDEX "gmi_source_appendix_rows_release_blocker_idx" ON "gmi_source_appendix_rows"("release_blocker");

-- CreateIndex
CREATE INDEX "gmi_amendments_edition_id_idx" ON "gmi_amendments"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_amendments_entity_type_entity_id_idx" ON "gmi_amendments"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "gmi_benchmark_entries_edition_id_idx" ON "gmi_benchmark_entries"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_benchmark_entries_call_id_idx" ON "gmi_benchmark_entries"("call_id");

-- CreateIndex
CREATE INDEX "gmi_scenario_models_edition_id_idx" ON "gmi_scenario_models"("edition_id");

-- CreateIndex
CREATE UNIQUE INDEX "gmi_scenario_models_edition_id_scenario_id_key" ON "gmi_scenario_models"("edition_id", "scenario_id");

-- CreateIndex
CREATE INDEX "gmi_alert_rules_edition_id_idx" ON "gmi_alert_rules"("edition_id");

-- CreateIndex
CREATE INDEX "gmi_alert_rules_linked_call_id_idx" ON "gmi_alert_rules"("linked_call_id");

-- CreateIndex
CREATE INDEX "inner_circle_email_event_logs_user_id_idx" ON "inner_circle_email_event_logs"("user_id");

-- CreateIndex
CREATE INDEX "inner_circle_email_event_logs_trigger_event_idx" ON "inner_circle_email_event_logs"("trigger_event");

-- CreateIndex
CREATE INDEX "inner_circle_email_event_logs_status_idx" ON "inner_circle_email_event_logs"("status");

-- CreateIndex
CREATE INDEX "inner_circle_email_event_logs_sent_at_idx" ON "inner_circle_email_event_logs"("sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "boardroom_brief_orders_stripe_session_id_key" ON "boardroom_brief_orders"("stripe_session_id");

-- CreateIndex
CREATE INDEX "boardroom_brief_orders_user_id_idx" ON "boardroom_brief_orders"("user_id");

-- CreateIndex
CREATE INDEX "boardroom_brief_orders_payment_status_idx" ON "boardroom_brief_orders"("payment_status");

-- CreateIndex
CREATE INDEX "boardroom_brief_orders_delivery_status_idx" ON "boardroom_brief_orders"("delivery_status");

-- CreateIndex
CREATE INDEX "boardroom_brief_orders_stripe_session_id_idx" ON "boardroom_brief_orders"("stripe_session_id");

-- CreateIndex
CREATE INDEX "boardroom_brief_orders_spine_id_idx" ON "boardroom_brief_orders"("spine_id");

-- CreateIndex
CREATE INDEX "boardroom_bridge_handoffs_user_id_idx" ON "boardroom_bridge_handoffs"("user_id");

-- CreateIndex
CREATE INDEX "boardroom_bridge_handoffs_expires_at_idx" ON "boardroom_bridge_handoffs"("expires_at");

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
CREATE UNIQUE INDEX "feedback_events_feedbackId_key" ON "feedback_events"("feedbackId");

-- CreateIndex
CREATE INDEX "feedback_events_surface_createdAt_idx" ON "feedback_events"("surface", "createdAt");

-- CreateIndex
CREATE INDEX "feedback_events_rating_createdAt_idx" ON "feedback_events"("rating", "createdAt");

-- CreateIndex
CREATE INDEX "feedback_events_category_createdAt_idx" ON "feedback_events"("category", "createdAt");

-- CreateIndex
CREATE INDEX "feedback_events_actionStatus_idx" ON "feedback_events"("actionStatus");

-- CreateIndex
CREATE INDEX "feedback_events_severity_idx" ON "feedback_events"("severity");

-- CreateIndex
CREATE INDEX "feedback_events_triageStatus_idx" ON "feedback_events"("triageStatus");

-- CreateIndex
CREATE INDEX "feedback_events_reviewRequired_idx" ON "feedback_events"("reviewRequired");

-- CreateIndex
CREATE INDEX "feedback_events_productCode_idx" ON "feedback_events"("productCode");

-- CreateIndex
CREATE INDEX "feedback_events_linkedOrderId_idx" ON "feedback_events"("linkedOrderId");

-- CreateIndex
CREATE INDEX "feedback_events_linkedArtifactId_idx" ON "feedback_events"("linkedArtifactId");

-- CreateIndex
CREATE INDEX "feedback_events_linkedOutcomeHypothesisId_idx" ON "feedback_events"("linkedOutcomeHypothesisId");

-- CreateIndex
CREATE INDEX "feedback_events_linkedRetainerCycleId_idx" ON "feedback_events"("linkedRetainerCycleId");

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
CREATE INDEX "BoardroomDossier_status_idx" ON "BoardroomDossier"("status");

-- CreateIndex
CREATE INDEX "BoardroomDossier_clientEmail_idx" ON "BoardroomDossier"("clientEmail");

-- CreateIndex
CREATE INDEX "BoardroomDossier_sourceType_idx" ON "BoardroomDossier"("sourceType");

-- CreateIndex
CREATE INDEX "BoardroomDossier_createdAt_idx" ON "BoardroomDossier"("createdAt");

-- CreateIndex
CREATE INDEX "DecisionActionLog_clientEmail_idx" ON "DecisionActionLog"("clientEmail");

-- CreateIndex
CREATE INDEX "DecisionActionLog_reportId_idx" ON "DecisionActionLog"("reportId");

-- CreateIndex
CREATE INDEX "DecisionActionLog_status_idx" ON "DecisionActionLog"("status");

-- CreateIndex
CREATE INDEX "DecisionActionLog_severity_idx" ON "DecisionActionLog"("severity");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_createdAt_idx" ON "StripeWebhookEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookEvent_type_sessionId_key" ON "StripeWebhookEvent"("type", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardroomDossierAccessToken_tokenHash_key" ON "BoardroomDossierAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "BoardroomDossierAccessToken_dossierId_idx" ON "BoardroomDossierAccessToken"("dossierId");

-- CreateIndex
CREATE INDEX "BoardroomDossierAccessToken_tokenHash_idx" ON "BoardroomDossierAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "BoardroomDossierAccessToken_expiresAt_idx" ON "BoardroomDossierAccessToken"("expiresAt");

-- CreateIndex
CREATE INDEX "BoardroomDeliveryEvent_tokenId_idx" ON "BoardroomDeliveryEvent"("tokenId");

-- CreateIndex
CREATE INDEX "BoardroomDeliveryEvent_dossierId_idx" ON "BoardroomDeliveryEvent"("dossierId");

-- CreateIndex
CREATE INDEX "BoardroomDeliveryEvent_eventType_idx" ON "BoardroomDeliveryEvent"("eventType");

-- CreateIndex
CREATE INDEX "BoardroomDeliveryEvent_createdAt_idx" ON "BoardroomDeliveryEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPortalSession_tokenHash_key" ON "ClientPortalSession"("tokenHash");

-- CreateIndex
CREATE INDEX "ClientPortalSession_clientEmail_idx" ON "ClientPortalSession"("clientEmail");

-- CreateIndex
CREATE INDEX "ClientPortalSession_tokenHash_idx" ON "ClientPortalSession"("tokenHash");

-- CreateIndex
CREATE INDEX "ClientPortalSession_expiresAt_idx" ON "ClientPortalSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ClientDecisionAction_clientEmail_idx" ON "ClientDecisionAction"("clientEmail");

-- CreateIndex
CREATE INDEX "ClientDecisionAction_dossierId_idx" ON "ClientDecisionAction"("dossierId");

-- CreateIndex
CREATE INDEX "ClientDecisionAction_status_idx" ON "ClientDecisionAction"("status");

-- CreateIndex
CREATE INDEX "ClientDecisionAction_dueDate_idx" ON "ClientDecisionAction"("dueDate");

-- CreateIndex
CREATE INDEX "ClientDecisionAction_createdAt_idx" ON "ClientDecisionAction"("createdAt");

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
CREATE UNIQUE INDEX "research_runs_slug_key" ON "research_runs"("slug");

-- CreateIndex
CREATE INDEX "research_runs_module_idx" ON "research_runs"("module");

-- CreateIndex
CREATE INDEX "research_runs_status_idx" ON "research_runs"("status");

-- CreateIndex
CREATE INDEX "research_runs_severity_idx" ON "research_runs"("severity");

-- CreateIndex
CREATE INDEX "research_runs_actorId_idx" ON "research_runs"("actorId");

-- CreateIndex
CREATE INDEX "research_runs_createdAt_idx" ON "research_runs"("createdAt");

-- CreateIndex
CREATE INDEX "research_runs_archivedAt_idx" ON "research_runs"("archivedAt");

-- CreateIndex
CREATE INDEX "research_runs_maturityStage_idx" ON "research_runs"("maturityStage");

-- CreateIndex
CREATE INDEX "foundry_findings_researchRunId_idx" ON "foundry_findings"("researchRunId");

-- CreateIndex
CREATE INDEX "foundry_findings_severity_idx" ON "foundry_findings"("severity");

-- CreateIndex
CREATE INDEX "foundry_findings_moduleId_idx" ON "foundry_findings"("moduleId");

-- CreateIndex
CREATE INDEX "foundry_findings_findingType_idx" ON "foundry_findings"("findingType");

-- CreateIndex
CREATE INDEX "foundry_findings_isActioned_idx" ON "foundry_findings"("isActioned");

-- CreateIndex
CREATE INDEX "foundry_audit_events_runId_idx" ON "foundry_audit_events"("runId");

-- CreateIndex
CREATE INDEX "foundry_audit_events_event_idx" ON "foundry_audit_events"("event");

-- CreateIndex
CREATE INDEX "foundry_audit_events_createdAt_idx" ON "foundry_audit_events"("createdAt");

-- CreateIndex
CREATE INDEX "action_briefs_researchRunId_idx" ON "action_briefs"("researchRunId");

-- CreateIndex
CREATE INDEX "action_briefs_contentHash_idx" ON "action_briefs"("contentHash");

-- CreateIndex
CREATE INDEX "ci_gate_blocks_createdAt_idx" ON "ci_gate_blocks"("createdAt");

-- CreateIndex
CREATE INDEX "ci_gate_blocks_resolvedAt_idx" ON "ci_gate_blocks"("resolvedAt");

-- CreateIndex
CREATE INDEX "foundry_patterns_patternType_idx" ON "foundry_patterns"("patternType");

-- CreateIndex
CREATE INDEX "foundry_patterns_moduleId_idx" ON "foundry_patterns"("moduleId");

-- CreateIndex
CREATE INDEX "foundry_patterns_findingType_idx" ON "foundry_patterns"("findingType");

-- CreateIndex
CREATE INDEX "foundry_patterns_status_idx" ON "foundry_patterns"("status");

-- CreateIndex
CREATE INDEX "foundry_patterns_lastSeenAt_idx" ON "foundry_patterns"("lastSeenAt");

-- CreateIndex
CREATE INDEX "foundry_promotions_eventType_idx" ON "foundry_promotions"("eventType");

-- CreateIndex
CREATE INDEX "foundry_promotions_fromStage_toStage_idx" ON "foundry_promotions"("fromStage", "toStage");

-- CreateIndex
CREATE INDEX "foundry_promotions_researchRunId_idx" ON "foundry_promotions"("researchRunId");

-- CreateIndex
CREATE INDEX "foundry_promotions_approvedAt_idx" ON "foundry_promotions"("approvedAt");

-- CreateIndex
CREATE INDEX "finding_feedback_runId_idx" ON "finding_feedback"("runId");

-- CreateIndex
CREATE INDEX "finding_feedback_disposition_idx" ON "finding_feedback"("disposition");

-- CreateIndex
CREATE INDEX "finding_feedback_moduleId_idx" ON "finding_feedback"("moduleId");

-- CreateIndex
CREATE INDEX "finding_feedback_engineId_idx" ON "finding_feedback"("engineId");

-- CreateIndex
CREATE UNIQUE INDEX "finding_feedback_runId_findingId_key" ON "finding_feedback"("runId", "findingId");

-- CreateIndex
CREATE UNIQUE INDEX "performance_baselines_engineId_key" ON "performance_baselines"("engineId");

-- CreateIndex
CREATE INDEX "performance_baselines_engineId_idx" ON "performance_baselines"("engineId");

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

-- CreateIndex
CREATE INDEX "foundry_interest_email_idx" ON "foundry_interest"("email");

-- CreateIndex
CREATE INDEX "foundry_interest_createdAt_idx" ON "foundry_interest"("createdAt");

-- CreateIndex
CREATE INDEX "foundry_interest_sourceTest_idx" ON "foundry_interest"("sourceTest");

-- CreateIndex
CREATE INDEX "foundry_interest_decisionType_idx" ON "foundry_interest"("decisionType");

-- CreateIndex
CREATE INDEX "foundry_interest_professionalHelpStatus_idx" ON "foundry_interest"("professionalHelpStatus");

-- CreateIndex
CREATE UNIQUE INDEX "decision_brief_orders_stripeCheckoutSessionId_key" ON "decision_brief_orders"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "decision_brief_orders_stripePaymentIntentId_key" ON "decision_brief_orders"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "decision_brief_orders_verificationToken_key" ON "decision_brief_orders"("verificationToken");

-- CreateIndex
CREATE INDEX "decision_brief_orders_email_idx" ON "decision_brief_orders"("email");

-- CreateIndex
CREATE INDEX "decision_brief_orders_status_idx" ON "decision_brief_orders"("status");

-- CreateIndex
CREATE INDEX "decision_brief_orders_tier_idx" ON "decision_brief_orders"("tier");

-- CreateIndex
CREATE INDEX "decision_brief_orders_createdAt_idx" ON "decision_brief_orders"("createdAt");

-- CreateIndex
CREATE INDEX "recommendation_outcome_ledger_caseId_idx" ON "recommendation_outcome_ledger"("caseId");

-- CreateIndex
CREATE INDEX "recommendation_outcome_ledger_recommendationId_idx" ON "recommendation_outcome_ledger"("recommendationId");

-- CreateIndex
CREATE INDEX "recommendation_outcome_ledger_caseId_status_idx" ON "recommendation_outcome_ledger"("caseId", "status");

-- CreateIndex
CREATE INDEX "recommendation_outcome_ledger_caseId_surface_idx" ON "recommendation_outcome_ledger"("caseId", "surface");

-- CreateIndex
CREATE INDEX "recommendation_outcome_ledger_createdAt_idx" ON "recommendation_outcome_ledger"("createdAt");

-- CreateIndex
CREATE INDEX "RetainerReviewQueueEntry_caseId_idx" ON "RetainerReviewQueueEntry"("caseId");

-- CreateIndex
CREATE INDEX "RetainerReviewQueueEntry_accountId_idx" ON "RetainerReviewQueueEntry"("accountId");

-- CreateIndex
CREATE INDEX "RetainerReviewQueueEntry_orgId_idx" ON "RetainerReviewQueueEntry"("orgId");

-- CreateIndex
CREATE INDEX "RetainerReviewQueueEntry_status_idx" ON "RetainerReviewQueueEntry"("status");

-- CreateIndex
CREATE INDEX "RetainerReviewQueueEntry_readinessStatus_idx" ON "RetainerReviewQueueEntry"("readinessStatus");

-- CreateIndex
CREATE INDEX "decision_instrument_runs_instrumentSlug_idx" ON "decision_instrument_runs"("instrumentSlug");

-- CreateIndex
CREATE INDEX "decision_instrument_runs_userId_idx" ON "decision_instrument_runs"("userId");

-- CreateIndex
CREATE INDEX "decision_instrument_runs_userEmail_idx" ON "decision_instrument_runs"("userEmail");

-- CreateIndex
CREATE INDEX "decision_instrument_runs_status_idx" ON "decision_instrument_runs"("status");

-- CreateIndex
CREATE INDEX "decision_instrument_runs_entitlementSlug_idx" ON "decision_instrument_runs"("entitlementSlug");

-- CreateIndex
CREATE INDEX "decision_instrument_runs_createdAt_idx" ON "decision_instrument_runs"("createdAt");

-- CreateIndex
CREATE INDEX "oversight_review_cycles_contractId_idx" ON "oversight_review_cycles"("contractId");

-- CreateIndex
CREATE INDEX "oversight_review_cycles_status_idx" ON "oversight_review_cycles"("status");

-- CreateIndex
CREATE INDEX "oversight_review_cycles_periodStart_idx" ON "oversight_review_cycles"("periodStart");

-- CreateIndex
CREATE INDEX "oversight_review_cycles_clientHealthStatus_idx" ON "oversight_review_cycles"("clientHealthStatus");

-- CreateIndex
CREATE UNIQUE INDEX "oversight_review_cycles_contractId_cycleNumber_key" ON "oversight_review_cycles"("contractId", "cycleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "intelligence_spines_spineId_key" ON "intelligence_spines"("spineId");

-- CreateIndex
CREATE INDEX "intelligence_spines_spineId_idx" ON "intelligence_spines"("spineId");

-- CreateIndex
CREATE INDEX "intelligence_spines_sourceType_idx" ON "intelligence_spines"("sourceType");

-- CreateIndex
CREATE INDEX "intelligence_spines_userId_idx" ON "intelligence_spines"("userId");

-- CreateIndex
CREATE INDEX "intelligence_spines_userEmail_idx" ON "intelligence_spines"("userEmail");

-- CreateIndex
CREATE INDEX "intelligence_spines_organisationId_idx" ON "intelligence_spines"("organisationId");

-- CreateIndex
CREATE INDEX "intelligence_spines_authorityLevel_idx" ON "intelligence_spines"("authorityLevel");

-- CreateIndex
CREATE INDEX "intelligence_spines_isSample_idx" ON "intelligence_spines"("isSample");

-- CreateIndex
CREATE INDEX "intelligence_spines_createdAt_idx" ON "intelligence_spines"("createdAt");

-- CreateIndex
CREATE INDEX "decision_outcome_records_decisionInstrumentRunId_idx" ON "decision_outcome_records"("decisionInstrumentRunId");

-- CreateIndex
CREATE INDEX "decision_outcome_records_boardroomDossierId_idx" ON "decision_outcome_records"("boardroomDossierId");

-- CreateIndex
CREATE INDEX "decision_outcome_records_decisionObjectId_idx" ON "decision_outcome_records"("decisionObjectId");

-- CreateIndex
CREATE INDEX "decision_outcome_records_outcomeClass_idx" ON "decision_outcome_records"("outcomeClass");

-- CreateIndex
CREATE INDEX "decision_outcome_records_submittedByEmail_idx" ON "decision_outcome_records"("submittedByEmail");

-- CreateIndex
CREATE INDEX "decision_outcome_records_createdAt_idx" ON "decision_outcome_records"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "return_brief_requests_requestKey_key" ON "return_brief_requests"("requestKey");

-- CreateIndex
CREATE INDEX "return_brief_requests_outcomeHypothesisId_idx" ON "return_brief_requests"("outcomeHypothesisId");

-- CreateIndex
CREATE INDEX "return_brief_requests_productCode_idx" ON "return_brief_requests"("productCode");

-- CreateIndex
CREATE INDEX "return_brief_requests_sourceEntityType_sourceEntityId_idx" ON "return_brief_requests"("sourceEntityType", "sourceEntityId");

-- CreateIndex
CREATE INDEX "return_brief_requests_userEmail_idx" ON "return_brief_requests"("userEmail");

-- CreateIndex
CREATE INDEX "return_brief_requests_status_idx" ON "return_brief_requests"("status");

-- CreateIndex
CREATE INDEX "return_brief_requests_dueAt_idx" ON "return_brief_requests"("dueAt");

-- CreateIndex
CREATE INDEX "return_brief_responses_requestId_idx" ON "return_brief_responses"("requestId");

-- CreateIndex
CREATE INDEX "return_brief_responses_decisionOutcomeRecordId_idx" ON "return_brief_responses"("decisionOutcomeRecordId");

-- CreateIndex
CREATE INDEX "return_brief_responses_submittedByEmail_idx" ON "return_brief_responses"("submittedByEmail");

-- CreateIndex
CREATE INDEX "return_brief_responses_outcomeClass_idx" ON "return_brief_responses"("outcomeClass");

-- CreateIndex
CREATE INDEX "return_brief_responses_createdAt_idx" ON "return_brief_responses"("createdAt");

-- CreateIndex
CREATE INDEX "outcome_pattern_observations_decisionOutcomeRecordId_idx" ON "outcome_pattern_observations"("decisionOutcomeRecordId");

-- CreateIndex
CREATE INDEX "outcome_pattern_observations_userEmail_idx" ON "outcome_pattern_observations"("userEmail");

-- CreateIndex
CREATE INDEX "outcome_pattern_observations_patternObservationId_idx" ON "outcome_pattern_observations"("patternObservationId");

-- CreateIndex
CREATE INDEX "outcome_pattern_observations_patternType_idx" ON "outcome_pattern_observations"("patternType");

-- CreateIndex
CREATE INDEX "outcome_pattern_observations_riskOfRepeat_idx" ON "outcome_pattern_observations"("riskOfRepeat");

-- CreateIndex
CREATE INDEX "outcome_pattern_observations_createdAt_idx" ON "outcome_pattern_observations"("createdAt");

-- CreateIndex
CREATE INDEX "retainer_readiness_evaluations_organisationId_idx" ON "retainer_readiness_evaluations"("organisationId");

-- CreateIndex
CREATE INDEX "retainer_readiness_evaluations_userEmail_idx" ON "retainer_readiness_evaluations"("userEmail");

-- CreateIndex
CREATE INDEX "retainer_readiness_evaluations_readinessClass_idx" ON "retainer_readiness_evaluations"("readinessClass");

-- CreateIndex
CREATE INDEX "retainer_readiness_evaluations_createdAt_idx" ON "retainer_readiness_evaluations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_artifacts_artifactId_key" ON "product_artifacts"("artifactId");

-- CreateIndex
CREATE INDEX "product_artifacts_artifactId_idx" ON "product_artifacts"("artifactId");

-- CreateIndex
CREATE INDEX "product_artifacts_productCode_idx" ON "product_artifacts"("productCode");

-- CreateIndex
CREATE INDEX "product_artifacts_sourceEntityType_sourceEntityId_idx" ON "product_artifacts"("sourceEntityType", "sourceEntityId");

-- CreateIndex
CREATE INDEX "product_artifacts_userId_idx" ON "product_artifacts"("userId");

-- CreateIndex
CREATE INDEX "product_artifacts_userEmail_idx" ON "product_artifacts"("userEmail");

-- CreateIndex
CREATE INDEX "product_artifacts_organisationId_idx" ON "product_artifacts"("organisationId");

-- CreateIndex
CREATE INDEX "product_artifacts_status_idx" ON "product_artifacts"("status");

-- CreateIndex
CREATE INDEX "product_artifacts_deliveryStatus_idx" ON "product_artifacts"("deliveryStatus");

-- CreateIndex
CREATE INDEX "product_artifacts_createdAt_idx" ON "product_artifacts"("createdAt");

-- CreateIndex
CREATE INDEX "product_artifact_amendments_artifactId_idx" ON "product_artifact_amendments"("artifactId");

-- CreateIndex
CREATE INDEX "product_artifact_amendments_createdAt_idx" ON "product_artifact_amendments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "outcome_hypotheses_hypothesisId_key" ON "outcome_hypotheses"("hypothesisId");

-- CreateIndex
CREATE INDEX "outcome_hypotheses_hypothesisId_idx" ON "outcome_hypotheses"("hypothesisId");

-- CreateIndex
CREATE INDEX "outcome_hypotheses_productCode_idx" ON "outcome_hypotheses"("productCode");

-- CreateIndex
CREATE INDEX "outcome_hypotheses_sourceRunId_idx" ON "outcome_hypotheses"("sourceRunId");

-- CreateIndex
CREATE INDEX "outcome_hypotheses_userId_idx" ON "outcome_hypotheses"("userId");

-- CreateIndex
CREATE INDEX "outcome_hypotheses_userEmail_idx" ON "outcome_hypotheses"("userEmail");

-- CreateIndex
CREATE INDEX "outcome_hypotheses_status_idx" ON "outcome_hypotheses"("status");

-- CreateIndex
CREATE INDEX "outcome_hypotheses_reviewDate_idx" ON "outcome_hypotheses"("reviewDate");

-- CreateIndex
CREATE INDEX "falsification_entries_productCode_idx" ON "falsification_entries"("productCode");

-- CreateIndex
CREATE INDEX "falsification_entries_artifactId_idx" ON "falsification_entries"("artifactId");

-- CreateIndex
CREATE INDEX "falsification_entries_status_idx" ON "falsification_entries"("status");

-- CreateIndex
CREATE INDEX "falsification_entries_reviewDate_idx" ON "falsification_entries"("reviewDate");

-- CreateIndex
CREATE INDEX "pattern_observations_userId_idx" ON "pattern_observations"("userId");

-- CreateIndex
CREATE INDEX "pattern_observations_userEmail_idx" ON "pattern_observations"("userEmail");

-- CreateIndex
CREATE INDEX "pattern_observations_organisationId_idx" ON "pattern_observations"("organisationId");

-- CreateIndex
CREATE INDEX "pattern_observations_patternType_idx" ON "pattern_observations"("patternType");

-- CreateIndex
CREATE INDEX "pattern_observations_status_idx" ON "pattern_observations"("status");

-- CreateIndex
CREATE INDEX "pattern_observations_createdAt_idx" ON "pattern_observations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "case_studies_slug_key" ON "case_studies"("slug");

-- CreateIndex
CREATE INDEX "case_studies_status_idx" ON "case_studies"("status");

-- CreateIndex
CREATE INDEX "case_studies_publicationAllowed_idx" ON "case_studies"("publicationAllowed");

-- CreateIndex
CREATE INDEX "case_studies_verificationStatus_idx" ON "case_studies"("verificationStatus");

-- CreateIndex
CREATE INDEX "case_studies_consentStatus_idx" ON "case_studies"("consentStatus");

-- CreateIndex
CREATE INDEX "case_studies_sourceOutcomeRecordId_idx" ON "case_studies"("sourceOutcomeRecordId");

-- CreateIndex
CREATE INDEX "case_studies_returnBriefId_idx" ON "case_studies"("returnBriefId");

-- CreateIndex
CREATE INDEX "case_studies_sector_idx" ON "case_studies"("sector");

-- CreateIndex
CREATE INDEX "case_studies_companySizeBand_idx" ON "case_studies"("companySizeBand");

-- CreateIndex
CREATE INDEX "case_study_evidence_caseStudyId_idx" ON "case_study_evidence"("caseStudyId");

-- CreateIndex
CREATE INDEX "case_study_evidence_sourceType_sourceId_idx" ON "case_study_evidence"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "case_study_evidence_verificationStatus_idx" ON "case_study_evidence"("verificationStatus");

-- CreateIndex
CREATE INDEX "case_study_consents_caseStudyId_idx" ON "case_study_consents"("caseStudyId");

-- CreateIndex
CREATE INDEX "case_study_consents_consentStatus_idx" ON "case_study_consents"("consentStatus");

-- CreateIndex
CREATE INDEX "case_study_consents_grantedByEmail_idx" ON "case_study_consents"("grantedByEmail");

-- CreateIndex
CREATE INDEX "case_study_outcomes_caseStudyId_idx" ON "case_study_outcomes"("caseStudyId");

-- CreateIndex
CREATE INDEX "case_study_outcomes_decisionOutcomeRecordId_idx" ON "case_study_outcomes"("decisionOutcomeRecordId");

-- CreateIndex
CREATE INDEX "case_study_outcomes_outcomeClass_idx" ON "case_study_outcomes"("outcomeClass");

-- CreateIndex
CREATE INDEX "public_decision_registry_entries_productCode_idx" ON "public_decision_registry_entries"("productCode");

-- CreateIndex
CREATE INDEX "public_decision_registry_entries_optInStatus_idx" ON "public_decision_registry_entries"("optInStatus");

-- CreateIndex
CREATE INDEX "public_decision_registry_entries_anonymisationStatus_idx" ON "public_decision_registry_entries"("anonymisationStatus");

-- CreateIndex
CREATE INDEX "public_decision_registry_entries_adminReviewStatus_idx" ON "public_decision_registry_entries"("adminReviewStatus");

-- CreateIndex
CREATE INDEX "public_decision_registry_entries_sectorTaxonomy_idx" ON "public_decision_registry_entries"("sectorTaxonomy");

-- CreateIndex
CREATE INDEX "public_decision_registry_entries_companySizeBand_idx" ON "public_decision_registry_entries"("companySizeBand");

-- CreateIndex
CREATE INDEX "public_decision_registry_entries_aggregationBucket_idx" ON "public_decision_registry_entries"("aggregationBucket");

-- CreateIndex
CREATE INDEX "public_decision_registry_entries_publishable_idx" ON "public_decision_registry_entries"("publishable");

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
ALTER TABLE "gmi_call_ledger_status_history" ADD CONSTRAINT "gmi_call_ledger_status_history_ledger_entry_id_fkey" FOREIGN KEY ("ledger_entry_id") REFERENCES "gmi_call_ledger_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boardroom_brief_orders" ADD CONSTRAINT "boardroom_brief_orders_spine_id_fkey" FOREIGN KEY ("spine_id") REFERENCES "intelligence_spines"("spineId") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "BoardroomDossierAccessToken" ADD CONSTRAINT "BoardroomDossierAccessToken_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "BoardroomDossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardroomDeliveryEvent" ADD CONSTRAINT "BoardroomDeliveryEvent_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "BoardroomDossierAccessToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "foundry_findings" ADD CONSTRAINT "foundry_findings_researchRunId_fkey" FOREIGN KEY ("researchRunId") REFERENCES "research_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundry_audit_events" ADD CONSTRAINT "foundry_audit_events_runId_fkey" FOREIGN KEY ("runId") REFERENCES "research_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_briefs" ADD CONSTRAINT "action_briefs_researchRunId_fkey" FOREIGN KEY ("researchRunId") REFERENCES "research_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundry_promotions" ADD CONSTRAINT "foundry_promotions_researchRunId_fkey" FOREIGN KEY ("researchRunId") REFERENCES "research_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_feedback" ADD CONSTRAINT "finding_feedback_runId_fkey" FOREIGN KEY ("runId") REFERENCES "research_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_link" ADD CONSTRAINT "session_link_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "decision_session"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_link" ADD CONSTRAINT "session_link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_brief_responses" ADD CONSTRAINT "return_brief_responses_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "return_brief_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_artifact_amendments" ADD CONSTRAINT "product_artifact_amendments_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "product_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_study_evidence" ADD CONSTRAINT "case_study_evidence_caseStudyId_fkey" FOREIGN KEY ("caseStudyId") REFERENCES "case_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_study_consents" ADD CONSTRAINT "case_study_consents_caseStudyId_fkey" FOREIGN KEY ("caseStudyId") REFERENCES "case_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_study_outcomes" ADD CONSTRAINT "case_study_outcomes_caseStudyId_fkey" FOREIGN KEY ("caseStudyId") REFERENCES "case_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

