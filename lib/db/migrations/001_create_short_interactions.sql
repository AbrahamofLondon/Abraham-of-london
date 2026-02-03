-- lib/db/migrations/001_create_short_interactions.sql
-- Postgres-compatible migration for Neon

-- 1. Create the function for automated updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create the table
CREATE TABLE IF NOT EXISTS short_interactions (
  id SERIAL PRIMARY KEY,
  short_slug TEXT NOT NULL,
  session_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'save')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ,

  -- Institutional Constraint: One active 'like' or 'save' per session
  CONSTRAINT unique_interaction UNIQUE (short_slug, session_id, action)
);

-- 3. Performance indexes (Postgres Partial Index syntax)
CREATE INDEX IF NOT EXISTS idx_interactions_slug_active
ON short_interactions(short_slug)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_session
ON short_interactions(session_id, short_slug);

-- 4. Apply Trigger
DROP TRIGGER IF EXISTS trg_short_interactions_updated_at ON short_interactions;
CREATE TRIGGER trg_short_interactions_updated_at
BEFORE UPDATE ON short_interactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();