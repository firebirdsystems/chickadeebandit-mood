-- Denormalized aggregate view of entries for sharing.
-- Only mood/energy/date are stored here — notes and symptoms never leave app_mood__entries.
-- Written by the owner (on save and on share-enable back-fill), read by the designated viewer.
-- No row policy is applied: data is non-sensitive (mood numbers only) and the policy system
-- cannot express "readable by viewer_id column, writable by owner_id column".
CREATE TABLE IF NOT EXISTS app_mood__trend_shares (
  id          TEXT    NOT NULL,
  owner_id    TEXT    NOT NULL,
  viewer_id   TEXT    NOT NULL,
  entry_date  TEXT    NOT NULL,  -- YYYY-MM-DD, plaintext (required for unique index + ORDER BY)
  mood        INTEGER NOT NULL,
  energy      INTEGER NOT NULL,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS trend_shares_unique
  ON app_mood__trend_shares (owner_id, viewer_id, entry_date);

CREATE INDEX IF NOT EXISTS trend_shares_viewer_idx
  ON app_mood__trend_shares (viewer_id);
