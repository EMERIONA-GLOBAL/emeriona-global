-- EMERIONA GLOBAL — Order Lifecycle Foundation
-- Migration 0010: durable order status transition evidence.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL CHECK (from_status IN ('PENDING','CONFIRMED','FULFILLING','FULFILLED','CANCELLED')),
  to_status TEXT NOT NULL CHECK (to_status IN ('PENDING','CONFIRMED','FULFILLING','FULFILLED','CANCELLED')),
  correlation_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_time ON order_events(tenant_id, order_id, created_at);

INSERT OR IGNORE INTO schema_migrations (version)
VALUES ('0010_order_lifecycle_foundation');
