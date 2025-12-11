-- migrations/001_create_short_interactions.sql
CREATE TABLE IF NOT EXISTS short_interactions (
  id SERIAL PRIMARY KEY,
  short_slug VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  action VARCHAR(50) NOT NULL CHECK (action IN ('like', 'save')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Ensure unique active interaction per user per short per action
  CONSTRAINT unique_active_interaction 
    UNIQUE NULLS NOT DISTINCT (short_slug, user_id, action) 
    WHERE (deleted_at IS NULL)
);

-- Create indexes for performance
CREATE INDEX idx_short_interactions_slug ON short_interactions(short_slug);
CREATE INDEX idx_short_interactions_user ON short_interactions(user_id);
CREATE INDEX idx_short_interactions_action ON short_interactions(action);
CREATE INDEX idx_short_interactions_created ON short_interactions(created_at);
CREATE INDEX idx_short_interactions_active ON short_interactions(short_slug) 
  WHERE (deleted_at IS NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_short_interactions_updated_at
  BEFORE UPDATE ON short_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();