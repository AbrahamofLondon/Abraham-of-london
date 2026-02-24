-- 1. Create Extensions (for UUID support)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Inner Circle Members Table
-- Stores the identity shell without exposing the raw email
CREATE TABLE IF NOT EXISTS inner_circle_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash
    email_hash_prefix VARCHAR(10) NOT NULL, -- For admin identification
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_ip VARCHAR(45),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Inner Circle Keys Table
-- Hashed keys ensure that even with DB access, keys cannot be stolen
CREATE TABLE IF NOT EXISTS inner_circle_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES inner_circle_members(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 of the raw key
    key_suffix VARCHAR(4) NOT NULL,      -- Last 4 digits for display (e.g., IC-****-A1B2)
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'pending')),
    total_unlocks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_ip VARCHAR(45),
    
    CONSTRAINT fk_member FOREIGN KEY (member_id) REFERENCES inner_circle_members(id)
);

-- 4. Performance & Security Indexes
CREATE INDEX IF NOT EXISTS idx_members_email_hash ON inner_circle_members(email_hash);
CREATE INDEX IF NOT EXISTS idx_keys_key_hash ON inner_circle_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_keys_member_id ON inner_circle_keys(member_id);

-- 5. Auto-Update Timestamp Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_member_modtime
    BEFORE UPDATE ON inner_circle_members
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();