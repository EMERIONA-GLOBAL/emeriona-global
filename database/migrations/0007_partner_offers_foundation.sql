PRAGMA foreign_keys = ON;
CREATE INDEX IF NOT EXISTS idx_offers_tenant_partner_status ON offers(tenant_id,partner_id,status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_offers_tenant_id ON offers(tenant_id,id);
INSERT OR IGNORE INTO schema_migrations (name) VALUES ('0007_partner_offers_foundation');
