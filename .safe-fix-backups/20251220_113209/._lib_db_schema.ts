-- lib/db/migrations/001_create_short_interactions.sql

-- Enable uuid-ossp if unique identifiers are needed beyond session_id
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS short_interactions (
    id SERIAL PRIMARY KEY,
    short_slug TEXT NOT NULL,
    session_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('like', 'save')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensures a builder can only have one active 'like' or 'save' per short
    CONSTRAINT unique_session_action_per_short 
    UNIQUE (short_slug, session_id, action)
);

-- Performance Indices for the Interaction Engine
CREATE INDEX IF NOT EXISTS idx_interactions_slug_active 
ON short_interactions(short_slug) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_session 
ON short_interactions(session_id, short_slug);

-- Automated Timestamp Update Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_short_interactions_modtime
    BEFORE UPDATE ON short_interactions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
