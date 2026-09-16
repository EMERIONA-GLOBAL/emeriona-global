-- EMERIONA GLOBAL — Partner Offers Foundation
-- Migration 0007
-- Tenant-safe partner offer indexes and migration evidence.
PRAGMA foreign_keys = ON;
CREATE INDEX IF NOT EXISTS idx_offers_tenant_partner_status ON offers(tenant_id,partner_id,status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_offers_tenant_id ON offers(tenant_id,id);
INSERT OR IGNORE INTO schema_migrations (version)
VALUES ('0007_partner_offers_foundation');
