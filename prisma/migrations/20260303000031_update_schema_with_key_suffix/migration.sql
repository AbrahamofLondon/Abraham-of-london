-- 20260303000031_update_schema_with_key_suffix — COMPAT (legacy PascalCase table)
-- Goal:
-- - Ensure key_suffix column exists
-- - Ensure indexes target the real key hash column name (keyHash or key_hash)

-- 1) Add keySuffix (camel) or key_suffix (snake) depending on existing conventions
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='InnerCircleKey'
  ) THEN
    -- Prefer snake_case storage if present; otherwise add camelCase
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='InnerCircleKey' AND column_name='key_hash'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='InnerCircleKey' AND column_name='key_suffix'
      ) THEN
        EXECUTE 'ALTER TABLE public."InnerCircleKey" ADD COLUMN key_suffix TEXT';
      END IF;

      -- Index on key_hash
      EXECUTE 'CREATE INDEX IF NOT EXISTS inner_circle_key_key_hash_idx ON public."InnerCircleKey"(key_hash)';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='InnerCircleKey' AND column_name='keyHash'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='InnerCircleKey' AND column_name='keySuffix'
      ) THEN
        EXECUTE 'ALTER TABLE public."InnerCircleKey" ADD COLUMN "keySuffix" TEXT';
      END IF;

      -- Index on "keyHash"
      EXECUTE 'CREATE INDEX IF NOT EXISTS inner_circle_key_keyHash_idx ON public."InnerCircleKey"("keyHash")';
    ELSE
      -- If neither exists, do nothing; schema not ready for this migration in this DB.
      -- Keep no-op to avoid failure.
      EXECUTE 'SELECT 1';
    END IF;
  END IF;
END $$;