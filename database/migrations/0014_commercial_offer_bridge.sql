PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS commercial_offers (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id),
 pricing_decision_id TEXT NOT NULL REFERENCES pricing_decisions(id),
 inquiry_id TEXT NOT NULL REFERENCES commercial_inquiries(id),
 status TEXT NOT NULL CHECK (status IN ('DRAFT','PRESENTED','ACCEPTED','DECLINED','EXPIRED')) DEFAULT 'DRAFT',
 amount REAL NOT NULL CHECK (amount >= 0), currency TEXT NOT NULL, title TEXT NOT NULL,
 valid_until TEXT, presented_at TEXT, responded_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_offers_decision_active ON commercial_offers(tenant_id,pricing_decision_id) WHERE status IN ('DRAFT','PRESENTED');
CREATE INDEX IF NOT EXISTS idx_commercial_offers_tenant_status ON commercial_offers(tenant_id,status);
CREATE INDEX IF NOT EXISTS idx_commercial_offers_inquiry ON commercial_offers(tenant_id,inquiry_id);
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0014_commercial_offer_bridge');