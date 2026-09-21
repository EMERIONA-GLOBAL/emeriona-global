-- EMERIONA GLOBAL — Tenant Foundation
-- Migration 0001
-- Establishes the canonical tenant boundary using the live D1 tenant schema.
-- Safe against an already-existing tenants table and preserves all existing records.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','SUSPENDED','CLOSED')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO tenants (
  id,
  name,
  status
) VALUES (
  'emeriona-global',
  'EMERIONA GLOBAL',
  'ACTIVE'
);

INSERT OR IGNORE INTO schema_migrations (version)
VALUES ('0001_tenant_foundation');
