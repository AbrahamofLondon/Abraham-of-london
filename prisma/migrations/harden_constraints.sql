-- prisma/migrations/harden_constraints.sql

-- 1. Ensure unique active interaction per session per short per action
-- This handles the logic Prisma cannot represent in the schema file.
ALTER TABLE short_interactions DROP CONSTRAINT IF EXISTS unique_session_interaction;
CREATE UNIQUE INDEX unique_session_interaction 
ON short_interactions (short_slug, session_id, action) 
WHERE (deleted_at IS NULL AND session_id IS NOT NULL);

-- 2. Ensure unique active interaction per user per short per action
ALTER TABLE short_interactions DROP CONSTRAINT IF EXISTS unique_user_interaction;
CREATE UNIQUE INDEX unique_user_interaction 
ON short_interactions (short_slug, user_id, action) 
WHERE (deleted_at IS NULL AND user_id IS NOT NULL);

-- 3. Optimization Index for engagement stats
CREATE INDEX IF NOT EXISTS idx_short_interactions_active_lookup 
ON short_interactions(short_slug) 
WHERE (deleted_at IS NULL);