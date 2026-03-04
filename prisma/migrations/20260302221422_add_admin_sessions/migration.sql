-- 20260302221422_add_admin_sessions — LEGACY-COMPAT (TEXT member PK)
-- In this DB, InnerCircleMember.id is TEXT. Therefore admin_sessions.userId must be TEXT.

-- 1) Create admin_sessions if missing (userId TEXT)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='admin_sessions'
  ) THEN
    EXECUTE '
      CREATE TABLE public.admin_sessions (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
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

-- 2) Ensure metadata exists
ALTER TABLE public.admin_sessions
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3) If userId exists and is UUID, drop all FKs on admin_sessions and convert userId -> TEXT
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='admin_sessions' AND column_name='userId'
      AND udt_name='uuid'
  ) THEN
    -- Drop all foreign keys on admin_sessions (no loop; single statement via string_agg)
    EXECUTE COALESCE(
      (
        SELECT string_agg(
          'ALTER TABLE public.admin_sessions DROP CONSTRAINT ' || quote_ident(c.conname) || ';',
          ' '
        )
        FROM pg_constraint c
        WHERE c.conrelid = 'public.admin_sessions'::regclass
          AND c.contype = 'f'
      ),
      ''
    );

    -- Convert UUID -> TEXT
    EXECUTE '
      ALTER TABLE public.admin_sessions
      ALTER COLUMN "userId" TYPE TEXT
      USING ("userId"::text)
    ';
  END IF;
END $$;

-- 4) Add FK to InnerCircleMember (TEXT -> TEXT) if member table exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='InnerCircleMember'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='admin_sessions_userid_fkey') THEN
      EXECUTE '
        ALTER TABLE public.admin_sessions
        ADD CONSTRAINT admin_sessions_userid_fkey
        FOREIGN KEY ("userId") REFERENCES public."InnerCircleMember"(id)
        ON DELETE CASCADE
      ';
    END IF;
  END IF;
END $$;

-- 5) Indexes
CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx ON public.admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS admin_sessions_user_id_idx ON public.admin_sessions("userId");