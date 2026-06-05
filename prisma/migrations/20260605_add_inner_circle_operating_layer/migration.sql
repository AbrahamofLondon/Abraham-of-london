-- Inner Circle Operating Layer
-- Server-side diagnostic memory, tool access, advisory qualification, and safe acquisition events.

CREATE TABLE IF NOT EXISTS inner_circle_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  access_state TEXT NOT NULL DEFAULT 'Reader',
  membership_tier TEXT NOT NULL DEFAULT 'free',
  active_path TEXT NOT NULL DEFAULT 'founder-under-pressure',
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inner_circle_profiles_access_state_idx
  ON inner_circle_profiles(access_state);
CREATE INDEX IF NOT EXISTS inner_circle_profiles_membership_tier_idx
  ON inner_circle_profiles(membership_tier);
CREATE INDEX IF NOT EXISTS inner_circle_profiles_active_path_idx
  ON inner_circle_profiles(active_path);

CREATE TABLE IF NOT EXISTS inner_circle_diagnostic_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool_slug TEXT NOT NULL,
  path_slug TEXT NOT NULL,
  answers_json JSONB NOT NULL,
  score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  weakest_domains_json JSONB NOT NULL,
  recommended_next_action TEXT NOT NULL,
  recommended_product TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inner_circle_diagnostic_results_user_id_idx
  ON inner_circle_diagnostic_results(user_id);
CREATE INDEX IF NOT EXISTS inner_circle_diagnostic_results_tool_slug_idx
  ON inner_circle_diagnostic_results(tool_slug);
CREATE INDEX IF NOT EXISTS inner_circle_diagnostic_results_risk_level_idx
  ON inner_circle_diagnostic_results(risk_level);
CREATE INDEX IF NOT EXISTS inner_circle_diagnostic_results_recommended_product_idx
  ON inner_circle_diagnostic_results(recommended_product);
CREATE INDEX IF NOT EXISTS inner_circle_diagnostic_results_created_at_idx
  ON inner_circle_diagnostic_results(created_at);

CREATE TABLE IF NOT EXISTS inner_circle_tool_access (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool_slug TEXT NOT NULL,
  access_status TEXT NOT NULL DEFAULT 'granted',
  access_reason TEXT,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inner_circle_tool_access_user_tool_unique UNIQUE(user_id, tool_slug)
);

CREATE INDEX IF NOT EXISTS inner_circle_tool_access_access_status_idx
  ON inner_circle_tool_access(access_status);

CREATE TABLE IF NOT EXISTS inner_circle_reading_path_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  path_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_step INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inner_circle_reading_path_progress_user_path_unique UNIQUE(user_id, path_slug)
);

CREATE INDEX IF NOT EXISTS inner_circle_reading_path_progress_status_idx
  ON inner_circle_reading_path_progress(status);

CREATE TABLE IF NOT EXISTS inner_circle_worksheet_actions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  path_slug TEXT NOT NULL,
  task_key TEXT NOT NULL,
  task TEXT NOT NULL,
  response TEXT,
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'not_started',
  note TEXT,
  next_review_date TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inner_circle_worksheet_actions_user_path_task_unique UNIQUE(user_id, path_slug, task_key)
);

CREATE INDEX IF NOT EXISTS inner_circle_worksheet_actions_status_idx
  ON inner_circle_worksheet_actions(status);
CREATE INDEX IF NOT EXISTS inner_circle_worksheet_actions_next_review_date_idx
  ON inner_circle_worksheet_actions(next_review_date);

CREATE TABLE IF NOT EXISTS inner_circle_advisory_qualifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  trigger_result_id TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  risk_level TEXT NOT NULL,
  recommended_product TEXT NOT NULL,
  reason TEXT NOT NULL,
  metadata_json JSONB,
  admin_override BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inner_circle_advisory_qualifications_user_id_idx
  ON inner_circle_advisory_qualifications(user_id);
CREATE INDEX IF NOT EXISTS inner_circle_advisory_qualifications_status_idx
  ON inner_circle_advisory_qualifications(status);
CREATE INDEX IF NOT EXISTS inner_circle_advisory_qualifications_risk_level_idx
  ON inner_circle_advisory_qualifications(risk_level);
CREATE INDEX IF NOT EXISTS inner_circle_advisory_qualifications_recommended_product_idx
  ON inner_circle_advisory_qualifications(recommended_product);

CREATE TABLE IF NOT EXISTS pressure_signal_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  input_hash TEXT NOT NULL,
  pressure_level TEXT NOT NULL,
  recommended_product TEXT NOT NULL,
  safe_metrics_json JSONB NOT NULL,
  result_json JSONB NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pressure_signal_events_user_id_idx
  ON pressure_signal_events(user_id);
CREATE INDEX IF NOT EXISTS pressure_signal_events_pressure_level_idx
  ON pressure_signal_events(pressure_level);
CREATE INDEX IF NOT EXISTS pressure_signal_events_recommended_product_idx
  ON pressure_signal_events(recommended_product);
CREATE INDEX IF NOT EXISTS pressure_signal_events_created_at_idx
  ON pressure_signal_events(created_at);
