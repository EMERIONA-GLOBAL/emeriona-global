-- EMERIONA GLOBAL — C11 Partner Intelligence
-- Read-only intelligence is computed from durable commercial D1 records.
PRAGMA foreign_keys = ON;
CREATE INDEX IF NOT EXISTS idx_order_items_partner_order ON order_items(partner_id,order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_tenant_status_order ON fulfillments(tenant_id,status,order_id);
CREATE INDEX IF NOT EXISTS idx_settlements_tenant_partner_status ON settlements(tenant_id,partner_id,status);
CREATE INDEX IF NOT EXISTS idx_return_requests_tenant_order ON return_requests(tenant_id,order_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_tenant_order ON refund_requests(tenant_id,order_id);
CREATE INDEX IF NOT EXISTS idx_catalogs_tenant_partner_status ON catalogs(tenant_id,partner_id,status);
CREATE INDEX IF NOT EXISTS idx_products_tenant_partner_status ON products(tenant_id,partner_id,status);
CREATE INDEX IF NOT EXISTS idx_services_tenant_partner_status ON services(tenant_id,partner_id,status);
CREATE INDEX IF NOT EXISTS idx_offers_tenant_partner_status ON offers(tenant_id,partner_id,status);
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0009_partner_intelligence_foundation');
