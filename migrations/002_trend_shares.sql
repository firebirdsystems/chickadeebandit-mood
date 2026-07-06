-- Denormalized aggregate view of entries for sharing.
-- Only mood/energy/date are stored here — notes and symptoms never leave app_mood__entries.
-- Written by the owner (on save and on share-enable back-fill), read by the designated viewer.
-- Governed by the `party_scoped` row policy (member_columns owner_id + viewer_id,
-- self_column owner_id): a row is visible/writable only to those two members, and INSERTs
-- are forced to owner_id = caller, so no member can grant themselves a view of another
-- person's trends. Note the platform cannot express "read by viewer, write by owner ONLY",
-- so party_scoped also lets the viewer UPDATE/DELETE these rows — acceptable here because
-- the data is non-sensitive aggregate numbers (the confidential notes/symptoms stay in
-- app_mood__entries, which is owner_only with adults_bypass:false).
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
