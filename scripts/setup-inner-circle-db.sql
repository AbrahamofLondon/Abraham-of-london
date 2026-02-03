-- Setup script for Inner Circle PostgreSQL tables
-- Run this in your PostgreSQL database before using the postgres store

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- inner_circle_members table
CREATE TABLE IF NOT EXISTS inner_circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash VARCHAR(64) UNIQUE NOT NULL,
  email_hash_prefix VARCHAR(10) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_ip VARCHAR(45),
  CONSTRAINT email_hash_length CHECK (length(email_hash) = 64)
);

-- inner_circle_keys table  
CREATE TABLE IF NOT EXISTS inner_circle_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES inner_circle_members(id) ON DELETE CASCADE,
  key_hash VARCHAR(64) UNIQUE NOT NULL,
  key_suffix VARCHAR(4) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  total_unlocks INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMPTZ,
  last_ip VARCHAR(45),
  CONSTRAINT key_hash_length CHECK (length(key_hash) = 64),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'revoked'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inner_circle_keys_key_hash ON inner_circle_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_inner_circle_keys_member_id ON inner_circle_keys(member_id);
CREATE INDEX IF NOT EXISTS idx_inner_circle_members_email_hash ON inner_circle_members(email_hash);
CREATE INDEX IF NOT EXISTS idx_inner_circle_keys_created_at ON inner_circle_keys(created_at);
CREATE INDEX IF NOT EXISTS idx_inner_circle_members_last_seen ON inner_circle_members(last_seen_at);

-- Create a view for easy stats
CREATE OR REPLACE VIEW inner_circle_stats AS
SELECT 
  (SELECT COUNT(*) FROM inner_circle_members) as total_members,
  (SELECT COUNT(*) FROM inner_circle_keys) as total_keys,
  (SELECT COUNT(DISTINCT member_id) FROM inner_circle_keys WHERE status = 'active') as active_members,
  (SELECT COALESCE(SUM(total_unlocks), 0) FROM inner_circle_keys) as total_unlocks;