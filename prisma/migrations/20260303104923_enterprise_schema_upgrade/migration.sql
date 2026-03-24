-- enterprise_schema_upgrade — REPLAY-SAFE / SHADOW-DB SAFE

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Tables (base create)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.inner_circle_members(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  status TEXT NOT NULL DEFAULT 'active',
  permissions permission[] NOT NULL DEFAULT '{}'::permission[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, member_id)
);

CREATE TABLE IF NOT EXISTS public.organization_invites (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_logs (
  id TEXT PRIMARY KEY,
  event security_event NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  member_id UUID REFERENCES public.inner_circle_members(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mfa_setups (
  id TEXT PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES public.inner_circle_members(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  status webhook_status NOT NULL DEFAULT 'active',
  event_types TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INT,
  ok BOOLEAN NOT NULL DEFAULT false,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.jobs (
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

-- ---------------------------------------------------------------------------
-- Column adds for partially existing tables (REPLAY-SAFE)
-- ---------------------------------------------------------------------------
ALTER TABLE public.admin_sessions
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT '{}'::text[];

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'api_keys'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.api_keys
      ADD COLUMN status api_key_status NOT NULL DEFAULT 'active';
  END IF;
END $$;

ALTER TABLE public.inner_circle_members
  ADD COLUMN IF NOT EXISTS permissions permission[] DEFAULT '{}'::permission[];

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS queue TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS run_after TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by TEXT,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ✅ FIXED: organization_invites now includes ALL core columns
ALTER TABLE public.organization_invites
  ADD COLUMN IF NOT EXISTS organization_id TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS token_hash TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'MEMBER',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS permissions permission[] DEFAULT '{}'::permission[],
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.security_logs
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.mfa_setups
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS methods mfa_method[] DEFAULT ARRAY['totp']::mfa_method[],
  ADD COLUMN IF NOT EXISTS totp_secret TEXT,
  ADD COLUMN IF NOT EXISTS totp_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS backup_codes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recovery_email TEXT,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.webhook_endpoints
  ADD COLUMN IF NOT EXISTS secret TEXT,
  ADD COLUMN IF NOT EXISTS status webhook_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS event_types TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.webhook_deliveries
  ADD COLUMN IF NOT EXISTS status_code INT,
  ADD COLUMN IF NOT EXISTS ok BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- Backfills before NOT NULL expectations / indexing
-- ---------------------------------------------------------------------------
UPDATE public.jobs
SET run_after = now()
WHERE run_after IS NULL;

UPDATE public.jobs
SET queue = 'default'
WHERE queue IS NULL;

UPDATE public.jobs
SET status = 'queued'
WHERE status IS NULL;

UPDATE public.jobs
SET attempts = 0
WHERE attempts IS NULL;

UPDATE public.jobs
SET max_attempts = 5
WHERE max_attempts IS NULL;

UPDATE public.jobs
SET payload = '{}'::jsonb
WHERE payload IS NULL;

UPDATE public.organization_invites
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

-- ✅ ADDED: Backfill for expires_at to ensure no NULLs before indexing
UPDATE public.organization_invites
SET expires_at = now() + interval '7 days'
WHERE expires_at IS NULL;

UPDATE public.security_logs
SET details = '{}'::jsonb
WHERE details IS NULL;

UPDATE public.mfa_setups
SET backup_codes = '[]'::jsonb
WHERE backup_codes IS NULL;

UPDATE public.inner_circle_members
SET permissions = '{}'::permission[]
WHERE permissions IS NULL;

UPDATE public.api_keys
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

UPDATE public.api_keys
SET scopes = '{}'::text[]
WHERE scopes IS NULL;

-- ---------------------------------------------------------------------------
-- Defaults
-- ---------------------------------------------------------------------------
ALTER TABLE public.api_logs
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

ALTER TABLE public.strategy_inquiries
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

ALTER TABLE public.system_audit_logs
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS jobs_queue_idx ON public.jobs(queue);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.jobs(status);
CREATE INDEX IF NOT EXISTS jobs_run_after_idx ON public.jobs(run_after);

CREATE INDEX IF NOT EXISTS mfa_setups_enabled_idx ON public.mfa_setups(enabled);

CREATE INDEX IF NOT EXISTS organization_invites_email_idx ON public.organization_invites(email);
CREATE INDEX IF NOT EXISTS organization_invites_expires_at_idx ON public.organization_invites(expires_at);
CREATE INDEX IF NOT EXISTS organization_invites_org_id_idx ON public.organization_invites(organization_id);

CREATE INDEX IF NOT EXISTS organization_members_member_id_idx ON public.organization_members(member_id);
CREATE INDEX IF NOT EXISTS organization_members_org_id_idx ON public.organization_members(organization_id);

CREATE INDEX IF NOT EXISTS organizations_status_idx ON public.organizations(status);

CREATE INDEX IF NOT EXISTS security_logs_created_at_idx ON public.security_logs(created_at);
CREATE INDEX IF NOT EXISTS security_logs_event_idx ON public.security_logs(event);
CREATE INDEX IF NOT EXISTS security_logs_member_id_idx ON public.security_logs(member_id);
CREATE INDEX IF NOT EXISTS security_logs_severity_idx ON public.security_logs(severity);

CREATE INDEX IF NOT EXISTS webhook_deliveries_created_at_idx ON public.webhook_deliveries(created_at);
CREATE INDEX IF NOT EXISTS webhook_deliveries_endpoint_id_idx ON public.webhook_deliveries(endpoint_id);
CREATE INDEX IF NOT EXISTS webhook_deliveries_event_type_idx ON public.webhook_deliveries(event_type);

CREATE INDEX IF NOT EXISTS webhook_endpoints_status_idx ON public.webhook_endpoints(status);

CREATE INDEX IF NOT EXISTS api_keys_status_idx ON public.api_keys(status);