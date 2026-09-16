-- EMERIONA GLOBAL — Billing, Invoicing & Settlement Foundation
-- Migration 0003
-- Extends the existing invoice/settlement records without duplicating them.
PRAGMA foreign_keys = ON;

ALTER TABLE invoices ADD COLUMN invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN payment_intent_id TEXT REFERENCES payment_intents(id);
ALTER TABLE invoices ADD COLUMN subtotal_amount REAL NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0);
ALTER TABLE invoices ADD COLUMN discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0);
ALTER TABLE invoices ADD COLUMN tax_amount REAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0);
ALTER TABLE invoices ADD COLUMN issued_at TEXT;
ALTER TABLE invoices ADD COLUMN voided_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_tenant_number
  ON invoices(tenant_id,invoice_number)
  WHERE invoice_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_order
  ON invoices(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_payment_intent
  ON invoices(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id,status);

ALTER TABLE settlements ADD COLUMN revenue_entry_id TEXT REFERENCES revenue_entries(id);
ALTER TABLE settlements ADD COLUMN settlement_reference TEXT;
ALTER TABLE settlements ADD COLUMN settled_at TEXT;
ALTER TABLE settlements ADD COLUMN reversed_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_settlements_tenant_reference
  ON settlements(tenant_id,settlement_reference)
  WHERE settlement_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_settlements_partner_order
  ON settlements(partner_id,order_id);
CREATE INDEX IF NOT EXISTS idx_settlements_tenant_status ON settlements(tenant_id,status);
CREATE INDEX IF NOT EXISTS idx_settlements_revenue ON settlements(revenue_entry_id);

CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL CHECK (to_status IN ('ISSUED','VOID')),
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_billing_events_invoice_time ON billing_events(invoice_id,created_at);

CREATE TABLE IF NOT EXISTS settlement_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  settlement_id TEXT NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL CHECK (to_status IN ('PENDING','SETTLED','REVERSED')),
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_settlement_events_settlement_time ON settlement_events(settlement_id,created_at);

INSERT OR IGNORE INTO schema_migrations (version)
VALUES ('0003_billing_settlement_foundation');
