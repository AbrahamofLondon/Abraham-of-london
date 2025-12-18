-- SQLite compatible schema update
ALTER TABLE inner_circle_keys ADD COLUMN revoked_at TEXT;
ALTER TABLE inner_circle_keys ADD COLUMN revoked_by TEXT;
ALTER TABLE inner_circle_keys ADD COLUMN revoked_reason TEXT;
ALTER TABLE inner_circle_keys ADD COLUMN expires_at TEXT;

-- Note: SQLite does not support ALTER TABLE DROP CONSTRAINT. 
-- For a local dev environment, adding the columns is sufficient to stop the code from crashing.