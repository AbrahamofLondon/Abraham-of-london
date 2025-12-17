-- 1. Create the Members Table (Privacy-Safe)
CREATE TABLE IF NOT EXISTS inner_circle_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash of the email
    email_hash_prefix VARCHAR(10) NOT NULL, -- For admin identification without exposure
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_ip TEXT
);

-- 2. Create the Keys Table
CREATE TABLE IF NOT EXISTS inner_circle_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES inner_circle_members(id) ON DELETE CASCADE,
    key_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash of the access key
    key_suffix VARCHAR(4) NOT NULL, -- Last 4 chars for user reference
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'revoked')),
    total_unlocks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    last_ip TEXT
);

-- 3. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_members_email_hash ON inner_circle_members(email_hash);
CREATE INDEX IF NOT EXISTS idx_keys_key_hash ON inner_circle_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_keys_member_id ON inner_circle_keys(member_id);

-- 4. Security Policy: Prevent double-counting of engagement
-- (Optional: ensures only one active key per member if desired)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_key_per_member 
-- ON inner_circle_keys(member_id) WHERE status = 'active';