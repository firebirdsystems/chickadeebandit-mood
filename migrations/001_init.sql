-- Daily check-ins: one entry per member per day (upsert on member_id + entry_date)
CREATE TABLE IF NOT EXISTS entries (
  household_id UUID    NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT    NOT NULL,
  member_id    TEXT    NOT NULL,
  entry_date   TEXT    NOT NULL,           -- YYYY-MM-DD local date
  mood         INTEGER NOT NULL,           -- 1 (rough) – 5 (great)
  energy       INTEGER NOT NULL,           -- 1 (drained) – 5 (energized)
  symptoms     TEXT    NOT NULL DEFAULT '[]', -- JSON array of tag strings
  note         TEXT    NOT NULL DEFAULT '',
  prompt       TEXT    NOT NULL DEFAULT '',   -- the gentle prompt shown when this entry was written
  created_at   TEXT    NOT NULL,
  updated_at   TEXT    NOT NULL,
  PRIMARY KEY (household_id, id)
);

-- One check-in per member per day
CREATE UNIQUE INDEX IF NOT EXISTS entries_unique_day
  ON entries (household_id, member_id, entry_date);

-- Sharing: an explicit opt-in row means the owner has agreed to let the viewer
-- see aggregate mood/energy trends (never notes or symptoms — see app logic).
-- No row between two members = fully private.
CREATE TABLE IF NOT EXISTS shares (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT NOT NULL,
  owner_id     TEXT NOT NULL,
  viewer_id    TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS shares_unique_pair
  ON shares (household_id, owner_id, viewer_id);

CREATE INDEX IF NOT EXISTS shares_viewer_idx
  ON shares (household_id, viewer_id);
