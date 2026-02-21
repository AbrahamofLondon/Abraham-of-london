/* lib/server/inner-circle-schema.sql */
-- Complete schema for Inner Circle system

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS key_unlock_logs CASCADE;
DROP TABLE IF EXISTS key_audit_logs CASCADE;
DROP TABLE IF EXISTS member_flags CASCADE;
DROP TABLE IF EXISTS inner_circle_keys CASCADE;
DROP TABLE IF EXISTS inner_circle_members CASCADE;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Members table (privacy-focused: stores hashed emails)
CREATE TABLE inner_circle_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Privacy: store only hash and prefix of email
  email_hash TEXT NOT NULL UNIQUE,
  email_hash_prefix TEXT NOT NULL,
  
  -- Member details
  name TEXT,
  tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'vip')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  
  -- Tracking
  last_ip INET,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Indexes
  CONSTRAINT valid_email_hash CHECK (email_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT valid_email_hash_prefix CHECK (email_hash_prefix ~ '^[a-f0-9]{1,12}$')
);

CREATE INDEX idx_members_email_hash ON inner_circle_members(email_hash);
CREATE INDEX idx_members_status ON inner_circle_members(status);
CREATE INDEX idx_members_tier ON inner_circle_members(tier);
CREATE INDEX idx_members_last_seen ON inner_circle_members(last_seen_at DESC);

-- Keys table
CREATE TABLE inner_circle_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  member_id TEXT NOT NULL REFERENCES inner_circle_members(id) ON DELETE CASCADE,
  
  -- Security: store hash of the actual key
  key_hash TEXT NOT NULL UNIQUE,
  key_suffix TEXT NOT NULL,
  
  -- Key properties
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'revoked', 'expired', 'suspended')),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Tracking
  total_unlocks INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_ip INET,
  created_by_ip INET,
  
  -- Revocation info
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  revoked_reason TEXT,
  
  -- Flags and metadata
  flags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT valid_key_suffix CHECK (key_suffix ~ '^[A-Za-z0-9_-]{4,}$')
);

CREATE INDEX idx_keys_member_id ON inner_circle_keys(member_id);
CREATE INDEX idx_keys_status ON inner_circle_keys(status);
CREATE INDEX idx_keys_expires_at ON inner_circle_keys(expires_at);
CREATE INDEX idx_keys_key_hash ON inner_circle_keys(key_hash);
CREATE INDEX idx_keys_last_used ON inner_circle_keys(last_used_at DESC);

-- =============================================================================
-- ENHANCED TABLES
-- =============================================================================

-- Key unlock logs for detailed analytics
CREATE TABLE key_unlock_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key_id TEXT NOT NULL REFERENCES inner_circle_keys(id) ON DELETE CASCADE,
  
  -- Unlock details
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  country_code CHAR(2),
  success BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Context
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for analytics
  CONSTRAINT valid_country_code CHECK (country_code ~ '^[A-Z]{2}$' OR country_code IS NULL)
);

CREATE INDEX idx_unlock_logs_key_id ON key_unlock_logs(key_id, unlocked_at DESC);
-- CREATE INDEX idx_unlock_logs_date ON key_unlock_logs(DATE(unlocked_at));
CREATE INDEX idx_unlock_logs_ip ON key_unlock_logs(ip_address);

-- Member flags for custom classifications
CREATE TABLE member_flags (
  member_id TEXT NOT NULL REFERENCES inner_circle_members(id) ON DELETE CASCADE,
  flag TEXT NOT NULL,
  
  -- Flag details
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Composite primary key
  PRIMARY KEY (member_id, flag),
  
  -- Indexes
  CONSTRAINT valid_flag CHECK (flag ~ '^[a-z_]+$')
);

CREATE INDEX idx_member_flags_flag ON member_flags(flag);
CREATE INDEX idx_member_flags_expires ON member_flags(expires_at);

-- Key audit logs for complete audit trail
CREATE TABLE key_audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key_id TEXT NOT NULL REFERENCES inner_circle_keys(id) ON DELETE CASCADE,
  
  -- Audit details
  action TEXT NOT NULL CHECK (action IN ('create', 'revoke', 'renew', 'suspend', 'unlock', 'update')),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('admin', 'member', 'system', 'api')),
  actor_id TEXT,
  
  -- Changes
  old_value JSONB,
  new_value JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT valid_action CHECK (action ~ '^[a-z]+$')
);

CREATE INDEX idx_audit_logs_key_id ON key_audit_logs(key_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON key_audit_logs(action);
CREATE INDEX idx_audit_logs_actor ON key_audit_logs(actor_type, actor_id);

-- =============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =============================================================================

-- Daily unlock statistics
CREATE MATERIALIZED VIEW daily_unlock_stats AS
SELECT
  DATE(unlocked_at) as date,
  COUNT(*) as total_unlocks,
  COUNT(DISTINCT key_id) as unique_keys,
  COUNT(DISTINCT ip_address) as unique_ips,
  ARRAY_AGG(DISTINCT SUBSTRING(user_agent FROM '^[^/]+/[^ ]+')) as top_user_agents
FROM key_unlock_logs
WHERE unlocked_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(unlocked_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX idx_daily_unlock_stats_date ON daily_unlock_stats(date);

-- Member activity summary
CREATE MATERIALIZED VIEW member_activity_summary AS
SELECT
  m.id as member_id,
  m.email_hash_prefix,
  m.tier,
  m.status,
  COUNT(DISTINCT k.id) as total_keys,
  SUM(k.total_unlocks) as total_unlocks,
  MAX(k.last_used_at) as last_activity,
  ARRAY_AGG(DISTINCT f.flag) FILTER (WHERE f.flag IS NOT NULL) as flags
FROM inner_circle_members m
LEFT JOIN inner_circle_keys k ON m.id = k.member_id
LEFT JOIN member_flags f ON m.id = f.member_id
GROUP BY m.id, m.email_hash_prefix, m.tier, m.status;

CREATE UNIQUE INDEX idx_member_activity_summary_member_id ON member_activity_summary(member_id);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_inner_circle_keys_updated_at
  BEFORE UPDATE ON inner_circle_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log key changes automatically
CREATE OR REPLACE FUNCTION log_key_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO key_audit_logs (
      key_id, 
      action, 
      actor_type, 
      actor_id,
      old_value, 
      new_value
    ) VALUES (
      NEW.id,
      'update',
      'system',
      NULL,
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic key change logging
CREATE TRIGGER log_key_changes_trigger
  AFTER UPDATE ON inner_circle_keys
  FOR EACH ROW
  EXECUTE FUNCTION log_key_changes();

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_unlock_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY member_activity_summary;
END;
$$ language 'plpgsql';

-- Function for automatic key expiration
CREATE OR REPLACE FUNCTION expire_old_keys()
RETURNS void AS $$
BEGIN
  UPDATE inner_circle_keys
  SET status = 'expired'
  WHERE expires_at < NOW()
    AND status = 'active';
END;
$$ language 'plpgsql';

-- =============================================================================
-- CONSTRAINTS AND VALIDATIONS
-- =============================================================================

-- Ensure key doesn't expire before creation
ALTER TABLE inner_circle_keys
ADD CONSTRAINT key_expiry_after_creation 
CHECK (expires_at > created_at);

-- Ensure revocation timestamp is after creation
ALTER TABLE inner_circle_keys
ADD CONSTRAINT revocation_after_creation 
CHECK (revoked_at IS NULL OR revoked_at > created_at);

-- Ensure member has valid status
ALTER TABLE inner_circle_members
ADD CONSTRAINT valid_member_status 
CHECK (status IN ('active', 'suspended', 'banned'));

-- =============================================================================
-- COMMENT DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE inner_circle_members IS 'Privacy-focused member storage with hashed emails';
COMMENT ON TABLE inner_circle_keys IS 'Access keys for inner circle members';
COMMENT ON TABLE key_unlock_logs IS 'Detailed logs of key unlock events';
COMMENT ON TABLE member_flags IS 'Custom flags for member classification';
COMMENT ON TABLE key_audit_logs IS 'Complete audit trail for key operations';
COMMENT ON MATERIALIZED VIEW daily_unlock_stats IS 'Daily unlock statistics for analytics';
COMMENT ON MATERIALIZED VIEW member_activity_summary IS 'Member activity summary view';

COMMENT ON COLUMN inner_circle_members.email_hash IS 'SHA256 hash of email for privacy';
COMMENT ON COLUMN inner_circle_members.email_hash_prefix IS 'First 12 chars of hash for display';
COMMENT ON COLUMN inner_circle_keys.key_hash IS 'SHA256 hash of actual key for security';
COMMENT ON COLUMN inner_circle_keys.key_suffix IS 'Last 8 chars of key for display purposes';

-- =============================================================================
-- GRANTS (Adjust based on your security requirements)
-- =============================================================================

-- Example: Grant select to analytics user
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;
-- GRANT SELECT ON ALL MATERIALIZED VIEWS IN SCHEMA public TO analytics_user;

-- =============================================================================
-- INITIAL DATA (Optional - for testing)
-- =============================================================================

-- INSERT INTO inner_circle_members (email_hash, email_hash_prefix, name, tier) 
-- VALUES (
--   'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- hash of empty string
--   'e3b0c44298fc',
--   'Test Admin',
--   'vip'
-- );
