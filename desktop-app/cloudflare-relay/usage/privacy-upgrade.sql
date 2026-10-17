-- One-time upgrade for the already deployed initial database. Do not rerun ALTER.
ALTER TABLE installs ADD COLUMN consent_version INTEGER NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS withdrawals (id TEXT PRIMARY KEY, expires_day TEXT NOT NULL);
