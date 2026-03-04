-- enterprise_schema_upgrade (idempotent baseline)

-- Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='api_key_status') THEN
    CREATE TYPE api_key_status AS ENUM ('active','revoked','expired');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='mfa_method') THEN
    CREATE TYPE mfa_method AS ENUM ('totp','sms','email','backup_code','push');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='permission') THEN
    CREATE TYPE permission AS ENUM (
      'content_read','content_write','content_publish',
      'downloads_read','downloads_premium',
      'inner_circle_access','inner_circle_issue_keys','inner_circle_revoke_keys',
      'admin_all','billing_read','billing_write','system_config_write',
      'security_read','security_write','security_revoke_sessions'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='security_event') THEN
    CREATE TYPE security_event AS ENUM (
      'login_success','login_failed','logout','session_revoked','session_expired',
      'mfa_challenge_created','mfa_verified','mfa_failed','mfa_max_attempts',
      'key_redeemed','key_revoked','key_expired','admin_action'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='webhook_status') THEN
    CREATE TYPE webhook_status AS ENUM ('active','disabled');
  END IF;
END $$;

-- Tables (idempotent creates)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES inner_circle_members(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  status TEXT NOT NULL DEFAULT 'active',
  permissions permission[] NOT NULL DEFAULT '{}'::permission[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, member_id)
);

CREATE TABLE IF NOT EXISTS organization_invites (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_logs (
  id TEXT PRIMARY KEY,
  event security_event NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  member_id UUID REFERENCES inner_circle_members(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mfa_setups (
  id TEXT PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES inner_circle_members(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  methods mfa_method[] NOT NULL DEFAULT ARRAY['totp']::mfa_method[],
  totp_secret TEXT,
  totp_verified BOOLEAN NOT NULL DEFAULT false,
  backup_codes JSONB DEFAULT '[]'::jsonb,
  phone_number TEXT,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  recovery_email TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  status webhook_status NOT NULL DEFAULT 'active',
  event_types TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INT,
  ok BOOLEAN NOT NULL DEFAULT false,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  queue TEXT NOT NULL DEFAULT 'default',
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  run_after TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Column adds (idempotent)
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS scopes TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS status api_key_status NOT NULL DEFAULT 'active';

ALTER TABLE api_logs
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

ALTER TABLE strategy_inquiries
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

ALTER TABLE system_audit_logs
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

ALTER TABLE inner_circle_members
  ADD COLUMN IF NOT EXISTS permissions permission[] NOT NULL DEFAULT '{}'::permission[];

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS jobs_queue_idx ON jobs(queue);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
CREATE INDEX IF NOT EXISTS jobs_run_after_idx ON jobs(run_after);

CREATE INDEX IF NOT EXISTS mfa_setups_enabled_idx ON mfa_setups(enabled);

CREATE INDEX IF NOT EXISTS organization_invites_email_idx ON organization_invites(email);
CREATE INDEX IF NOT EXISTS organization_invites_expires_at_idx ON organization_invites(expires_at);
CREATE INDEX IF NOT EXISTS organization_invites_org_id_idx ON organization_invites(organization_id);

CREATE INDEX IF NOT EXISTS organization_members_member_id_idx ON organization_members(member_id);
CREATE INDEX IF NOT EXISTS organization_members_org_id_idx ON organization_members(organization_id);

CREATE INDEX IF NOT EXISTS organizations_status_idx ON organizations(status);

CREATE INDEX IF NOT EXISTS security_logs_created_at_idx ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS security_logs_event_idx ON security_logs(event);
CREATE INDEX IF NOT EXISTS security_logs_member_id_idx ON security_logs(member_id);
CREATE INDEX IF NOT EXISTS security_logs_severity_idx ON security_logs(severity);

CREATE INDEX IF NOT EXISTS webhook_deliveries_created_at_idx ON webhook_deliveries(created_at);
CREATE INDEX IF NOT EXISTS webhook_deliveries_endpoint_id_idx ON webhook_deliveries(endpoint_id);
CREATE INDEX IF NOT EXISTS webhook_deliveries_event_type_idx ON webhook_deliveries(event_type);

CREATE INDEX IF NOT EXISTS webhook_endpoints_status_idx ON webhook_endpoints(status);

CREATE INDEX IF NOT EXISTS api_keys_status_idx ON api_keys(status);