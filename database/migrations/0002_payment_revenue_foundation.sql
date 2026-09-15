-- EMERIONA GLOBAL — Payment & Revenue Foundation
-- Migration 0002
-- Provider-neutral ledger boundaries; no real money movement is activated by this migration.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  payment_intent_id TEXT NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL CHECK (to_status IN ('CREATED','AUTHORIZED','CAPTURED','REFUNDED','FAILED')),
  provider TEXT,
  provider_reference TEXT,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payment_events_intent_time ON payment_events(payment_intent_id,created_at);
CREATE INDEX IF NOT EXISTS idx_payment_events_tenant_time ON payment_events(tenant_id,created_at);

CREATE TABLE IF NOT EXISTS revenue_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  payment_intent_id TEXT NOT NULL REFERENCES payment_intents(id),
  amount REAL NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING','RECOGNIZED','REVERSED')) DEFAULT 'PENDING',
  recognized_at TEXT,
  reversed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (payment_intent_id)
);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_order ON revenue_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_tenant_status ON revenue_entries(tenant_id,status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_intents_order_created
  ON payment_intents(order_id)
  WHERE status = 'CREATED';

INSERT OR IGNORE INTO schema_migrations (version)
VALUES ('0002_payment_revenue_foundation');
