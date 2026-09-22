-- EMERIONA GLOBAL — Governed Pricing Foundation
-- Migration 0013
-- Stores governed pricing decisions and their auditable authoritative inputs.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pricing_decisions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  pricing_request_id TEXT NOT NULL REFERENCES pricing_requests(id),
  status TEXT NOT NULL CHECK (status IN ('PENDING','APPROVED','DECLINED','EXPIRED')) DEFAULT 'PENDING',
  amount REAL CHECK (amount IS NULL OR amount >= 0),
  currency TEXT NOT NULL,
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_decisions_request_pending
  ON pricing_decisions(tenant_id,pricing_request_id) WHERE status='PENDING';
CREATE INDEX IF NOT EXISTS idx_pricing_decisions_tenant_status
  ON pricing_decisions(tenant_id,status);
CREATE INDEX IF NOT EXISTS idx_pricing_decisions_request
  ON pricing_decisions(tenant_id,pricing_request_id);

CREATE TABLE IF NOT EXISTS pricing_decision_inputs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  pricing_decision_id TEXT NOT NULL REFERENCES pricing_decisions(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('ADD','SUBTRACT')),
  amount REAL NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_reference TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pricing_decision_inputs_decision
  ON pricing_decision_inputs(tenant_id,pricing_decision_id,sequence);

INSERT OR IGNORE INTO schema_migrations (version)
VALUES ('0013_governed_pricing_foundation');
