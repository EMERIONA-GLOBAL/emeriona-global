-- EMERIONA GLOBAL — Solution Entity Foundation
-- Migration 0010
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS solutions (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), owner_id TEXT NOT NULL,
  name TEXT NOT NULL, description TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','ACTIVE','PAUSED','ARCHIVED')) DEFAULT 'DRAFT',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_solutions_tenant_status ON solutions(tenant_id,status);
CREATE TABLE IF NOT EXISTS solution_product_links (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id),
  solution_id TEXT NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(tenant_id,solution_id,product_id)
);
CREATE INDEX IF NOT EXISTS idx_solution_product_links_product ON solution_product_links(tenant_id,product_id);
CREATE INDEX IF NOT EXISTS idx_solution_product_links_solution ON solution_product_links(tenant_id,solution_id);
CREATE TABLE IF NOT EXISTS solution_service_links (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id),
  solution_id TEXT NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(tenant_id,solution_id,service_id)
);
CREATE INDEX IF NOT EXISTS idx_solution_service_links_service ON solution_service_links(tenant_id,service_id);
CREATE INDEX IF NOT EXISTS idx_solution_service_links_solution ON solution_service_links(tenant_id,solution_id);
CREATE TABLE IF NOT EXISTS solution_offer_links (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id),
  solution_id TEXT NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(tenant_id,solution_id,offer_id)
);
CREATE INDEX IF NOT EXISTS idx_solution_offer_links_offer ON solution_offer_links(tenant_id,offer_id);
CREATE INDEX IF NOT EXISTS idx_solution_offer_links_solution ON solution_offer_links(tenant_id,solution_id);
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0010_solution_entity_foundation');
