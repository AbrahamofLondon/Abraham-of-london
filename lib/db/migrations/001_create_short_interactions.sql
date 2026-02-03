-- lib/db/migrations/001_create_short_interactions.sql
-- SQLite-compatible migration

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS short_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_slug TEXT NOT NULL,
  session_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'save')),
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  deleted_at TEXT,

  -- One active 'like' or 'save' per (short_slug, session_id, action)
  UNIQUE (short_slug, session_id, action)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_interactions_slug_active
ON short_interactions(short_slug)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_session
ON short_interactions(session_id, short_slug);

-- Automated updated_at (SQLite trigger; no functions)
DROP TRIGGER IF EXISTS trg_short_interactions_updated_at;

CREATE TRIGGER trg_short_interactions_updated_at
AFTER UPDATE ON short_interactions
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE short_interactions
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;