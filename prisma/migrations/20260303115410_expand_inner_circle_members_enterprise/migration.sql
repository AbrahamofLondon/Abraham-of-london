-- expand_inner_circle_members_enterprise — SHADOW-SAFE COMPAT MIGRATION
-- Goal: align legacy camelCase columns to snake_case, then add enterprise columns safely.
-- This prevents P3006 in shadow DB where older migrations created "lastSeenAt" etc.

-- 1) Rename legacy camelCase columns → snake_case (only if needed)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='emailHash'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='email_hash'
  ) THEN
    EXECUTE 'ALTER TABLE public.inner_circle_members RENAME COLUMN "emailHash" TO email_hash';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='emailHashPrefix'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='email_hash_prefix'
  ) THEN
    EXECUTE 'ALTER TABLE public.inner_circle_members RENAME COLUMN "emailHashPrefix" TO email_hash_prefix';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='viewCount'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='view_count'
  ) THEN
    EXECUTE 'ALTER TABLE public.inner_circle_members RENAME COLUMN "viewCount" TO view_count';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='created_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.inner_circle_members RENAME COLUMN "createdAt" TO created_at';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.inner_circle_members RENAME COLUMN "updatedAt" TO updated_at';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='lastSeenAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='last_seen_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.inner_circle_members RENAME COLUMN "lastSeenAt" TO last_seen_at';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='lastIp'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='last_ip'
  ) THEN
    EXECUTE 'ALTER TABLE public.inner_circle_members RENAME COLUMN "lastIp" TO last_ip';
  END IF;
END $$;

-- 2) Ensure required snake_case columns exist (add if missing)
ALTER TABLE public.inner_circle_members
  ADD COLUMN IF NOT EXISTS email_hash TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_hash_prefix TEXT,
  ADD COLUMN IF NOT EXISTS last_ip TEXT;

-- 3) Enums (create if missing)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='access_tier') THEN
    CREATE TYPE access_tier AS ENUM ('public','member','inner_circle','client','legacy','architect','owner');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='member_role') THEN
    CREATE TYPE member_role AS ENUM ('ADMIN','PRINCIPAL','DELEGATE','MEMBER');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='member_status') THEN
    CREATE TYPE member_status AS ENUM ('active','paused','disabled');
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

-- 4) Add enterprise columns (additive only; never touch PK)
ALTER TABLE public.inner_circle_members
  ADD COLUMN IF NOT EXISTS flags TEXT,
  ADD COLUMN IF NOT EXISTS email VARCHAR(320),
  ADD COLUMN IF NOT EXISTS role member_role NOT NULL DEFAULT 'MEMBER',
  ADD COLUMN IF NOT EXISTS tier access_tier NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS status member_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS permissions permission[] NOT NULL DEFAULT '{}'::permission[];

-- 5) Constraints + indexes (safe)
-- Unique email_hash (only if not already unique)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inner_circle_members_email_hash_key'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS inner_circle_members_email_hash_key ON public.inner_circle_members(email_hash)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS inner_circle_members_last_seen_at_idx ON public.inner_circle_members(last_seen_at);
CREATE INDEX IF NOT EXISTS inner_circle_members_status_idx ON public.inner_circle_members(status);
CREATE INDEX IF NOT EXISTS inner_circle_members_tier_idx ON public.inner_circle_members(tier);
CREATE INDEX IF NOT EXISTS inner_circle_members_role_idx ON public.inner_circle_members(role);