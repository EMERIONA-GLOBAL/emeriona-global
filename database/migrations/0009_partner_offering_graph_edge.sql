-- EMERIONA GLOBAL — Partner Offering Graph Edge
-- Migration 0009
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS offer_product_links (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, offer_id, product_id)
);

CREATE TABLE IF NOT EXISTS offer_service_links (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, offer_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_offer_product_links_tenant_product ON offer_product_links(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_offer_product_links_tenant_offer ON offer_product_links(tenant_id, offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_service_links_tenant_service ON offer_service_links(tenant_id, service_id);
CREATE INDEX IF NOT EXISTS idx_offer_service_links_tenant_offer ON offer_service_links(tenant_id, offer_id);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0009_partner_offering_graph_edge');
