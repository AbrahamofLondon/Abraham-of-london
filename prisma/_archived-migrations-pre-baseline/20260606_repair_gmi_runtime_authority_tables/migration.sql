-- Repair migration for environments that marked the original GMI migration
-- applied before the full runtime-authority table set existed.

CREATE TABLE IF NOT EXISTS "gmi_source_appendix_rows" (
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
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gmi_source_appendix_rows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "gmi_source_appendix_rows_source_row_id_key"
  ON "gmi_source_appendix_rows"("source_row_id");
CREATE INDEX IF NOT EXISTS "gmi_source_appendix_rows_edition_id_idx"
  ON "gmi_source_appendix_rows"("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_source_appendix_rows_status_idx"
  ON "gmi_source_appendix_rows"("status");
CREATE INDEX IF NOT EXISTS "gmi_source_appendix_rows_release_blocker_idx"
  ON "gmi_source_appendix_rows"("release_blocker");

CREATE TABLE IF NOT EXISTS "gmi_falsification_rules" (
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
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gmi_falsification_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "gmi_falsification_rules_edition_id_thesis_id_key"
  ON "gmi_falsification_rules"("edition_id", "thesis_id");
CREATE INDEX IF NOT EXISTS "gmi_falsification_rules_edition_id_idx"
  ON "gmi_falsification_rules"("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_falsification_rules_thesis_id_idx"
  ON "gmi_falsification_rules"("thesis_id");
CREATE INDEX IF NOT EXISTS "gmi_falsification_rules_current_status_idx"
  ON "gmi_falsification_rules"("current_status");
CREATE INDEX IF NOT EXISTS "gmi_falsification_rules_next_review_due_idx"
  ON "gmi_falsification_rules"("next_review_due");

CREATE TABLE IF NOT EXISTS "gmi_edition_governance_state" (
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
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gmi_edition_governance_state_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "gmi_edition_governance_state_edition_id_key"
  ON "gmi_edition_governance_state"("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_edition_governance_state_edition_id_idx"
  ON "gmi_edition_governance_state"("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_edition_governance_state_publication_status_idx"
  ON "gmi_edition_governance_state"("publication_status");

CREATE TABLE IF NOT EXISTS "gmi_release_snapshots" (
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
  "created_by" TEXT,
  "published_by" TEXT,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gmi_release_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "gmi_release_snapshots_edition_id_idx"
  ON "gmi_release_snapshots"("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_release_snapshots_created_at_idx"
  ON "gmi_release_snapshots"("created_at");

CREATE TABLE IF NOT EXISTS "gmi_amendments" (
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

CREATE INDEX IF NOT EXISTS "gmi_amendments_edition_id_idx"
  ON "gmi_amendments"("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_amendments_entity_type_entity_id_idx"
  ON "gmi_amendments"("entity_type", "entity_id");
