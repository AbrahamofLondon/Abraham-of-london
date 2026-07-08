-- Migration: add_gmi_source_appendix_and_amendment
-- Adds GmiSourceAppendixRow and GmiAmendment tables for persisted data provenance.

BEGIN TRANSACTION;

-- GMI Source Appendix Rows
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
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gmi_source_appendix_rows_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gmi_source_appendix_rows_source_row_id_key" UNIQUE ("source_row_id")
);

CREATE INDEX IF NOT EXISTS "gmi_source_appendix_rows_edition_id_idx" ON "gmi_source_appendix_rows" ("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_source_appendix_rows_status_idx" ON "gmi_source_appendix_rows" ("status");
CREATE INDEX IF NOT EXISTS "gmi_source_appendix_rows_release_blocker_idx" ON "gmi_source_appendix_rows" ("release_blocker");

-- GMI Amendments (post-publication correction records)
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
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gmi_amendments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "gmi_amendments_edition_id_idx" ON "gmi_amendments" ("edition_id");
CREATE INDEX IF NOT EXISTS "gmi_amendments_entity_type_entity_id_idx" ON "gmi_amendments" ("entity_type", "entity_id");

COMMIT;
