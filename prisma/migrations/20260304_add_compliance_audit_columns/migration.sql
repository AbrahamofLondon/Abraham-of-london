-- 20260304_add_compliance_audit_columns
-- Additive migration: adds compliance-grade audit columns to system_audit_logs

ALTER TABLE public.system_audit_logs
  ADD COLUMN IF NOT EXISTS actor_type     varchar(32)  DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS status         varchar(16)  DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS resource_type  varchar(64),
  ADD COLUMN IF NOT EXISTS resource_name  varchar(256),
  ADD COLUMN IF NOT EXISTS request_id     varchar(128),
  ADD COLUMN IF NOT EXISTS session_id     varchar(128),
  ADD COLUMN IF NOT EXISTS duration_ms    integer,
  ADD COLUMN IF NOT EXISTS error_message  text,
  ADD COLUMN IF NOT EXISTS category       varchar(64),
  ADD COLUMN IF NOT EXISTS sub_category   varchar(128),
  ADD COLUMN IF NOT EXISTS tags           jsonb DEFAULT '[]'::jsonb;

-- Indexes (IF NOT EXISTS supported by Postgres)
CREATE INDEX IF NOT EXISTS system_audit_logs_actor_type_idx  ON public.system_audit_logs(actor_type);
CREATE INDEX IF NOT EXISTS system_audit_logs_status_idx      ON public.system_audit_logs(status);
CREATE INDEX IF NOT EXISTS system_audit_logs_category_idx    ON public.system_audit_logs(category);
CREATE INDEX IF NOT EXISTS system_audit_logs_request_id_idx  ON public.system_audit_logs(request_id);
CREATE INDEX IF NOT EXISTS system_audit_logs_session_id_idx  ON public.system_audit_logs(session_id);