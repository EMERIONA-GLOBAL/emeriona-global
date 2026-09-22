-- EMERIONA GLOBAL — Inquiry → Pricing Request Foundation
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS pricing_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  inquiry_id TEXT NOT NULL REFERENCES commercial_inquiries(id),
  status TEXT NOT NULL CHECK (status IN ('PENDING','PRICED','DECLINED','EXPIRED')) DEFAULT 'PENDING',
  currency TEXT NOT NULL,
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  priced_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_requests_inquiry_pending ON pricing_requests(tenant_id,inquiry_id) WHERE status='PENDING';
CREATE INDEX IF NOT EXISTS idx_pricing_requests_tenant_status ON pricing_requests(tenant_id,status);
CREATE INDEX IF NOT EXISTS idx_pricing_requests_inquiry ON pricing_requests(tenant_id,inquiry_id);
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0012_inquiry_pricing_request_foundation');
