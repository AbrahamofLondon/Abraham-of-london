ALTER TABLE inner_circle_keys 
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revoked_by TEXT,
ADD COLUMN IF NOT EXISTS revoked_reason TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days');

ALTER TABLE inner_circle_keys 
DROP CONSTRAINT IF EXISTS inner_circle_keys_status_check;

ALTER TABLE inner_circle_keys 
ADD CONSTRAINT inner_circle_keys_status_check 
CHECK (status IN ('pending', 'active', 'revoked', 'expired'));