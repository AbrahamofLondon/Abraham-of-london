-- Global Market Intelligence persistent call ledger and red-team queue.

CREATE TABLE IF NOT EXISTS "gmi_call_ledger_entries" (
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
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "gmi_call_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "gmi_call_ledger_entries_call_id_key"
  ON "gmi_call_ledger_entries"("call_id");
CREATE INDEX IF NOT EXISTS "gmi_call_ledger_entries_edition_id_idx"
  ON "gmi_call_ledger_entries"("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_call_ledger_entries_edition_slug_idx"
  ON "gmi_call_ledger_entries"("edition_slug");
CREATE INDEX IF NOT EXISTS "gmi_call_ledger_entries_current_status_idx"
  ON "gmi_call_ledger_entries"("current_status");
CREATE INDEX IF NOT EXISTS "gmi_call_ledger_entries_current_score_idx"
  ON "gmi_call_ledger_entries"("current_score");
CREATE INDEX IF NOT EXISTS "gmi_call_ledger_entries_next_review_due_idx"
  ON "gmi_call_ledger_entries"("next_review_due");

CREATE TABLE IF NOT EXISTS "gmi_call_ledger_status_history" (
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

CREATE INDEX IF NOT EXISTS "gmi_call_ledger_status_history_ledger_entry_id_idx"
  ON "gmi_call_ledger_status_history"("ledger_entry_id");
CREATE INDEX IF NOT EXISTS "gmi_call_ledger_status_history_call_id_idx"
  ON "gmi_call_ledger_status_history"("call_id");
CREATE INDEX IF NOT EXISTS "gmi_call_ledger_status_history_created_at_idx"
  ON "gmi_call_ledger_status_history"("created_at");

ALTER TABLE "gmi_call_ledger_status_history"
  ADD CONSTRAINT "gmi_call_ledger_status_history_ledger_entry_id_fkey"
  FOREIGN KEY ("ledger_entry_id") REFERENCES "gmi_call_ledger_entries"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "gmi_red_team_submissions" (
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

CREATE INDEX IF NOT EXISTS "gmi_red_team_submissions_edition_id_idx"
  ON "gmi_red_team_submissions"("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_red_team_submissions_call_id_idx"
  ON "gmi_red_team_submissions"("call_id");
CREATE INDEX IF NOT EXISTS "gmi_red_team_submissions_status_idx"
  ON "gmi_red_team_submissions"("status");
CREATE INDEX IF NOT EXISTS "gmi_red_team_submissions_created_at_idx"
  ON "gmi_red_team_submissions"("created_at");

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

CREATE TABLE IF NOT EXISTS "gmi_post_mortems" (
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
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "gmi_post_mortems_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "gmi_post_mortems_edition_id_key"
  ON "gmi_post_mortems"("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_post_mortems_edition_id_idx"
  ON "gmi_post_mortems"("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_post_mortems_published_at_idx"
  ON "gmi_post_mortems"("published_at");

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
