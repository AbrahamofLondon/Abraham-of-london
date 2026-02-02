-- migrations/2024_short_interactions.sql

CREATE TABLE IF NOT EXISTS short_interactions (
  id           BIGSERIAL PRIMARY KEY,
  slug         TEXT NOT NULL,
  session_id   TEXT NOT NULL,
  liked        BOOLEAN NOT NULL DEFAULT FALSE,
  saved        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS short_interactions_slug_session_id_idx
  ON short_interactions (slug, session_id);

-- Optional: keep updated_at fresh on change (Postgres trigger)
-- If you already use a generic updated_at trigger, reuse that instead.
