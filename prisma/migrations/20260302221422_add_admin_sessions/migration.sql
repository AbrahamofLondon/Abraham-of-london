-- 20260302221422_add_admin_sessions — REPLAY-SAFE / SHADOW-DB SAFE
-- Purpose:
-- 1) Create admin_sessions if missing
-- 2) Ensure ALL required columns exist even if table already exists
-- 3) Backfill expires_at before NOT NULL/index usage
-- 4) Align userId type with actual InnerCircleMember.id type
-- 5) Recreate FK safely
-- 6) Create indexes only after columns are guaranteed to exist

-- -----------------------------------------------------------------------------
-- 1. Create table if missing
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'admin_sessions'
  ) THEN
    EXECUTE '
      CREATE TABLE public.admin_sessions (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        ip_address TEXT,
        user_agent TEXT,
        metadata JSONB DEFAULT ''{}''::jsonb
      )
    ';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Ensure all required columns exist for legacy / partial states
-- -----------------------------------------------------------------------------
ALTER TABLE public.admin_sessions
  ADD COLUMN IF NOT EXISTS id TEXT,
  ADD COLUMN IF NOT EXISTS token TEXT,
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- -----------------------------------------------------------------------------
-- 3. Backfill critical columns before constraints/indexes
-- -----------------------------------------------------------------------------
UPDATE public.admin_sessions
SET expires_at = now() + interval '30 days'
WHERE expires_at IS NULL;

UPDATE public.admin_sessions
SET created_at = now()
WHERE created_at IS NULL;

UPDATE public.admin_sessions
SET updated_at = now()
WHERE updated_at IS NULL;

UPDATE public.admin_sessions
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

-- -----------------------------------------------------------------------------
-- 4. Ensure PK and NOT NULL constraints exist where possible
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_sessions'
      AND column_name = 'id'
  ) THEN
    BEGIN
      ALTER TABLE public.admin_sessions
        ALTER COLUMN id SET NOT NULL;
    EXCEPTION
      WHEN others THEN
        NULL;
    END;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_sessions'
      AND column_name = 'token'
  ) THEN
    BEGIN
      ALTER TABLE public.admin_sessions
        ALTER COLUMN token SET NOT NULL;
    EXCEPTION
      WHEN others THEN
        NULL;
    END;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_sessions'
      AND column_name = 'userId'
  ) THEN
    BEGIN
      ALTER TABLE public.admin_sessions
        ALTER COLUMN "userId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN
        NULL;
    END;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_sessions'
      AND column_name = 'expires_at'
  ) THEN
    BEGIN
      ALTER TABLE public.admin_sessions
        ALTER COLUMN expires_at SET NOT NULL;
    EXCEPTION
      WHEN others THEN
        NULL;
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_sessions_pkey'
  ) THEN
    BEGIN
      ALTER TABLE public.admin_sessions
        ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);
    EXCEPTION
      WHEN others THEN
        NULL;
    END;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Drop any existing FK on admin_sessions before type alignment
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  drop_sql TEXT;
BEGIN
  SELECT string_agg(
           'ALTER TABLE public.admin_sessions DROP CONSTRAINT ' || quote_ident(c.conname),
           '; '
         )
  INTO drop_sql
  FROM pg_constraint c
  WHERE c.conrelid = 'public.admin_sessions'::regclass
    AND c.contype = 'f';

  IF drop_sql IS NOT NULL AND drop_sql <> '' THEN
    EXECUTE drop_sql;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 6. Align admin_sessions.userId type to actual referenced member ID type
-- Supports either:
--   public."InnerCircleMember"
--   public.inner_circle_members
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  member_table_name TEXT;
  member_id_udt TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'InnerCircleMember'
  ) THEN
    member_table_name := 'InnerCircleMember';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'inner_circle_members'
  ) THEN
    member_table_name := 'inner_circle_members';
  ELSE
    member_table_name := NULL;
  END IF;

  IF member_table_name IS NOT NULL THEN
    SELECT c.udt_name
    INTO member_id_udt
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = member_table_name
      AND c.column_name = 'id';

    IF member_id_udt = 'uuid' THEN
      BEGIN
        EXECUTE '
          ALTER TABLE public.admin_sessions
          ALTER COLUMN "userId" TYPE UUID
          USING NULLIF("userId", '''')::uuid
        ';
      EXCEPTION
        WHEN others THEN
          -- leave as-is if unsafe cast exists in legacy rows
          NULL;
      END;
    ELSE
      BEGIN
        EXECUTE '
          ALTER TABLE public.admin_sessions
          ALTER COLUMN "userId" TYPE TEXT
          USING "userId"::text
        ';
      EXCEPTION
        WHEN others THEN
          NULL;
      END;
    END IF;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7. Recreate FK safely
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'InnerCircleMember'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'admin_sessions_userid_fkey'
    ) THEN
      BEGIN
        ALTER TABLE public.admin_sessions
          ADD CONSTRAINT admin_sessions_userid_fkey
          FOREIGN KEY ("userId")
          REFERENCES public."InnerCircleMember"(id)
          ON DELETE CASCADE;
      EXCEPTION
        WHEN others THEN
          NULL;
      END;
    END IF;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'inner_circle_members'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'admin_sessions_userid_fkey'
    ) THEN
      BEGIN
        ALTER TABLE public.admin_sessions
          ADD CONSTRAINT admin_sessions_userid_fkey
          FOREIGN KEY ("userId")
          REFERENCES public.inner_circle_members(id)
          ON DELETE CASCADE;
      EXCEPTION
        WHEN others THEN
          NULL;
      END;
    END IF;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 8. Unique constraint / indexes after columns are guaranteed to exist
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'admin_sessions_token_key'
  ) THEN
    BEGIN
      CREATE UNIQUE INDEX admin_sessions_token_key
        ON public.admin_sessions(token);
    EXCEPTION
      WHEN others THEN
        NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx
  ON public.admin_sessions(expires_at);

CREATE INDEX IF NOT EXISTS admin_sessions_user_id_idx
  ON public.admin_sessions("userId");