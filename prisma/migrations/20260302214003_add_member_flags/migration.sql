-- 20260302214003_add_member_flags — COMPAT + FK TYPE FIX
-- Goal:
-- 1) Ensure member "flags" column exists (legacy + new naming)
-- 2) Ensure api_logs.memberId is UUID if api_logs exists
-- 3) Add FK only if types are compatible

-- 1) Add flags to legacy PascalCase table if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='InnerCircleMember'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='InnerCircleMember' AND column_name='flags'
    ) THEN
      EXECUTE 'ALTER TABLE public."InnerCircleMember" ADD COLUMN flags TEXT';
    END IF;
  END IF;
END $$;

-- 1b) Add flags to snake_case table if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='inner_circle_members'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='inner_circle_members' AND column_name='flags'
    ) THEN
      EXECUTE 'ALTER TABLE public.inner_circle_members ADD COLUMN flags TEXT';
    END IF;
  END IF;
END $$;

-- 2) Fix api_logs.memberId type (TEXT -> UUID) if api_logs exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='api_logs'
  ) THEN
    -- Ensure memberId column exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='api_logs' AND column_name='memberId'
    ) THEN
      EXECUTE 'ALTER TABLE public.api_logs ADD COLUMN "memberId" UUID';
    ELSE
      -- If memberId exists and is TEXT, attempt safe conversion to UUID
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='api_logs' AND column_name='memberId'
          AND data_type IN ('text','character varying')
      ) THEN
        -- Drop any FK that references api_logs.memberId (regardless of name)
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT c.conname INTO fk_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE c.contype = 'f'
    AND t.relname = 'api_logs'
    AND c.conname ILIKE 'api_logs_%member%_fkey'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.api_logs DROP CONSTRAINT IF EXISTS %I', fk_name);
  END IF;
END $$;

-- 3) Add FK only if member table exists and types are UUID compatible
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='api_logs') THEN

    -- Prefer legacy PascalCase member table (current DB)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='InnerCircleMember') THEN
      -- Add FK only if memberId is uuid
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='api_logs' AND column_name='memberId'
          AND udt_name='uuid'
      ) THEN
        -- Ensure FK exists
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='api_logs_memberId_fkey') THEN
          EXECUTE 'ALTER TABLE public.api_logs
                   ADD CONSTRAINT api_logs_memberId_fkey
                   FOREIGN KEY ("memberId") REFERENCES public."InnerCircleMember"(id)
                   ON DELETE SET NULL';
        END IF;
      END IF;
    END IF;

    -- If instead you are on snake_case member table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='inner_circle_members') THEN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='api_logs' AND column_name='memberId'
          AND udt_name='uuid'
      ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='api_logs_memberId_fkey') THEN
          EXECUTE 'ALTER TABLE public.api_logs
                   ADD CONSTRAINT api_logs_memberId_fkey
                   FOREIGN KEY ("memberId") REFERENCES public.inner_circle_members(id)
                   ON DELETE SET NULL';
        END IF;
      END IF;
    END IF;

  END IF;
END $$;