-- Migration: Add GMI Benchmark, Scenario, and Alert Rule models
-- Date: 2026-06-07
-- P4: GmiBenchmarkEntry
-- P6: GmiScenarioModel
-- P7: GmiAlertRule
-- Note: PostgreSQL-compatible SQL (TIMESTAMPTZ, not DATETIME)

-- ─── P4: GMI Benchmark Entries ───────────────────────────────────────────────

CREATE TABLE "gmi_benchmark_entries" (
    "id"                  TEXT NOT NULL,
    "edition_id"          TEXT NOT NULL,
    "call_id"             TEXT,
    "benchmark_type"      TEXT NOT NULL,
    "provider_name"       TEXT NOT NULL,
    "benchmark_statement" TEXT NOT NULL,
    "benchmark_value"     TEXT,
    "actual_value"        TEXT,
    "gmi_value"           TEXT,
    "evaluation_window"   TEXT NOT NULL,
    "result_summary"      TEXT,
    "source_reference"    TEXT NOT NULL,
    "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "gmi_benchmark_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gmi_benchmark_entries_edition_id_idx" ON "gmi_benchmark_entries"("edition_id");
CREATE INDEX "gmi_benchmark_entries_call_id_idx" ON "gmi_benchmark_entries"("call_id");

-- ─── P6: GMI Scenario Models ──────────────────────────────────────────────────

CREATE TABLE "gmi_scenario_models" (
    "id"                          TEXT NOT NULL,
    "edition_id"                  TEXT NOT NULL,
    "scenario_id"                 TEXT NOT NULL,
    "title"                       TEXT NOT NULL,
    "description"                 TEXT NOT NULL,
    "variables_json"              TEXT NOT NULL,
    "assumptions_json"            TEXT NOT NULL,
    "decision_implications_json"  TEXT NOT NULL,
    "falsification_rule_ids"      TEXT NOT NULL,
    "method_note"                 TEXT,
    "created_at"                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "gmi_scenario_models_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gmi_scenario_models_edition_scenario_unique" UNIQUE ("edition_id", "scenario_id")
);

CREATE INDEX "gmi_scenario_models_edition_id_idx" ON "gmi_scenario_models"("edition_id");

-- ─── P7: GMI Alert Rules ─────────────────────────────────────────────────────

CREATE TABLE "gmi_alert_rules" (
    "id"                           TEXT NOT NULL,
    "edition_id"                   TEXT NOT NULL,
    "linked_call_id"               TEXT,
    "linked_falsification_rule_id" TEXT,
    "alert_type"                   TEXT NOT NULL,
    "trigger_condition"            TEXT NOT NULL,
    "severity"                     TEXT NOT NULL DEFAULT 'medium',
    "status"                       TEXT NOT NULL DEFAULT 'draft',
    "delivery_mode"                TEXT NOT NULL DEFAULT 'dashboard_only',
    "last_evaluated_at"            TIMESTAMPTZ,
    "created_at"                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "gmi_alert_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gmi_alert_rules_edition_id_idx" ON "gmi_alert_rules"("edition_id");
CREATE INDEX "gmi_alert_rules_linked_call_id_idx" ON "gmi_alert_rules"("linked_call_id");
