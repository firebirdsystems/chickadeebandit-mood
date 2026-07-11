CREATE INDEX IF NOT EXISTS app_mood__entries_retention_idx
  ON app_mood__entries (entry_date, id);

CREATE INDEX IF NOT EXISTS app_mood__trend_shares_retention_idx
  ON app_mood__trend_shares (entry_date, id);
