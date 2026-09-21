-- EMERIONA GLOBAL — Tenant Foundation
-- Migration 0001
-- Establishes the canonical tenant boundary for the EMERIONA GLOBAL ecosystem.
-- Idempotent bootstrap: safe to apply more than once.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO tenants (
  id,
  slug,
  name,
  status
) VALUES (
  'emeriona-global',
  'emeriona-global',
  'EMERIONA GLOBAL',
  'ACTIVE'
);

INSERT OR IGNORE INTO schema_migrations (version)
VALUES ('0001_tenant_foundation');
