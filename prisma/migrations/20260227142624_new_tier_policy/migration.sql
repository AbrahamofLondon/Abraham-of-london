-- 20260227142624_new_tier_policy — SAFE (non-destructive)
-- Purpose: ensure AccessTier policy exists + add tier fields without dropping tables.

-- Create enum if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_tier') THEN
    CREATE TYPE access_tier AS ENUM ('public','member','inner_circle','client','legacy','architect','owner');
  END IF;
END $$;

-- Check if the table exists before trying to alter it
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inner_circle_members') THEN
    ALTER TABLE public.inner_circle_members
      ADD COLUMN IF NOT EXISTS tier access_tier NOT NULL DEFAULT 'member';
    
    CREATE INDEX IF NOT EXISTS inner_circle_members_tier_idx ON public.inner_circle_members(tier);
  END IF;
END $$;