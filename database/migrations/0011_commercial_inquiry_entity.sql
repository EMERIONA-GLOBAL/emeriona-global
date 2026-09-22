-- EMERIONA GLOBAL — Commercial Inquiry Entity
-- Migration 0011
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS commercial_inquiries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  partner_id TEXT REFERENCES partners(id),
  product_id TEXT REFERENCES products(id),
  service_id TEXT REFERENCES services(id),
  offer_id TEXT REFERENCES offers(id),
  solution_id TEXT REFERENCES solutions(id),
  subject TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL CHECK (status IN ('NEW','QUALIFYING','QUOTED','NEGOTIATING','CONVERTED','CLOSED','CANCELLED')) DEFAULT 'NEW',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (product_id IS NOT NULL OR service_id IS NOT NULL OR offer_id IS NOT NULL OR solution_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_commercial_inquiries_tenant_status ON commercial_inquiries(tenant_id,status);
CREATE INDEX IF NOT EXISTS idx_commercial_inquiries_customer ON commercial_inquiries(tenant_id,customer_id);
CREATE INDEX IF NOT EXISTS idx_commercial_inquiries_partner ON commercial_inquiries(tenant_id,partner_id);
CREATE INDEX IF NOT EXISTS idx_commercial_inquiries_solution ON commercial_inquiries(tenant_id,solution_id);
CREATE INDEX IF NOT EXISTS idx_commercial_inquiries_product ON commercial_inquiries(tenant_id,product_id);
CREATE INDEX IF NOT EXISTS idx_commercial_inquiries_service ON commercial_inquiries(tenant_id,service_id);
CREATE INDEX IF NOT EXISTS idx_commercial_inquiries_offer ON commercial_inquiries(tenant_id,offer_id);
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0011_commercial_inquiry_entity');
