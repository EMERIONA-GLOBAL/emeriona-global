-- EMERIONA GLOBAL — Data Layer Foundation
-- Migration 0000
-- Foundation only: no production/business records are inserted.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO schema_migrations (version)
VALUES ('0000_data_layer_foundation');
