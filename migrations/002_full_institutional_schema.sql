-- ==========================================
-- 1. EXTENSIONS & SHARED UTILITIES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 2. INNER CIRCLE (MEMBERSHIP & ACCESS)
-- ==========================================
CREATE TABLE IF NOT EXISTS inner_circle_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_hash VARCHAR(64) UNIQUE NOT NULL,
    email_hash_prefix VARCHAR(10) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_ip VARCHAR(45)
);

CREATE TABLE IF NOT EXISTS inner_circle_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES inner_circle_members(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    key_suffix VARCHAR(4) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'pending')),
    total_unlocks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_ip VARCHAR(45)
);

-- ==========================================
-- 3. SHORT INTERACTIONS (SOCIAL ENGAGEMENT)
-- ==========================================
CREATE TABLE IF NOT EXISTS short_interactions (
    id SERIAL PRIMARY KEY,
    short_slug VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    action VARCHAR(50) NOT NULL CHECK (action IN ('like', 'save')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- ==========================================
-- 4. INDEXES & PERFORMANCE
-- ==========================================

-- Inner Circle Indexes
CREATE INDEX IF NOT EXISTS idx_members_email_hash ON inner_circle_members(email_hash);
CREATE INDEX IF NOT EXISTS idx_keys_key_hash ON inner_circle_keys(key_hash);

-- Short Interactions Unique Logic (Soft Delete Support)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_interaction 
    ON short_interactions (short_slug, user_id, action) 
    NULLS NOT DISTINCT
    WHERE (deleted_at IS NULL);

-- Short Interactions Performance Indexes
CREATE INDEX IF NOT EXISTS idx_short_interactions_slug ON short_interactions(short_slug);
CREATE INDEX IF NOT EXISTS idx_short_interactions_user ON short_interactions(user_id);

-- ==========================================
-- 5. TRIGGERS (AUTOMATED MAINTENANCE)
-- ==========================================

-- Trigger for Inner Circle Members
CREATE TRIGGER trg_update_inner_circle_members_timestamp
    BEFORE UPDATE ON inner_circle_members
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- Trigger for Short Interactions
CREATE TRIGGER trg_update_short_interactions_timestamp
    BEFORE UPDATE ON short_interactions
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();