CREATE TABLE IF NOT EXISTS installs (
  id TEXT PRIMARY KEY, first_day TEXT NOT NULL, first_version TEXT NOT NULL, setup_day TEXT, consent_version INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS active_days (
  id TEXT NOT NULL, day TEXT NOT NULL, version TEXT NOT NULL, PRIMARY KEY (id, day)
);
CREATE INDEX IF NOT EXISTS active_day_idx ON active_days(day);
CREATE INDEX IF NOT EXISTS first_day_idx ON installs(first_day);
CREATE TABLE IF NOT EXISTS withdrawals (id TEXT PRIMARY KEY, expires_day TEXT NOT NULL);
