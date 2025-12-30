-- migrations/001_create_short_interactions.sql

-- 1. Create the base table
CREATE TABLE IF NOT EXISTS short_interactions (
    id SERIAL PRIMARY KEY,
    short_slug VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    action VARCHAR(50) NOT NULL CHECK (action IN ('like', 'save')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- 2. Ensure unique active interaction per user per short per action
-- We use a UNIQUE INDEX with a WHERE clause to handle the conditional logic.
-- NULLS NOT DISTINCT ensures that if user_id is NULL (guest user), 
-- PostgreSQL treats all NULL user_ids as the same value for uniqueness checks.
CREATE UNIQUE INDEX idx_unique_active_interaction 
    ON short_interactions (short_slug, user_id, action) 
    NULLS NOT DISTINCT
    WHERE (deleted_at IS NULL);

-- 3. Create indexes for performance
CREATE INDEX idx_short_interactions_slug ON short_interactions(short_slug);
CREATE INDEX idx_short_interactions_user ON short_interactions(user_id);
CREATE INDEX idx_short_interactions_action ON short_interactions(action);
CREATE INDEX idx_short_interactions_created ON short_interactions(created_at);

-- 4. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_short_interactions_updated_at ON short_interactions;
CREATE TRIGGER update_short_interactions_updated_at
    BEFORE UPDATE ON short_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();