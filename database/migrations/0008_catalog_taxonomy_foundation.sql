-- EMERIONA GLOBAL — Product & Service Taxonomy Foundation
-- Migration 0008
-- Taxonomy only: no product/service inventory is inserted.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS catalog_categories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  kind TEXT NOT NULL CHECK (kind IN ('PRODUCT','SERVICE')),
  parent_id TEXT REFERENCES catalog_categories(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','INACTIVE')) DEFAULT 'ACTIVE',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, kind, slug)
);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_tenant_kind ON catalog_categories(tenant_id,kind,status,sort_order);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_parent ON catalog_categories(tenant_id,parent_id);

CREATE TABLE IF NOT EXISTS product_category_links (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES catalog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (tenant_id,product_id,category_id)
);
CREATE INDEX IF NOT EXISTS idx_product_category_links_category ON product_category_links(tenant_id,category_id);

CREATE TABLE IF NOT EXISTS service_category_links (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES catalog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (tenant_id,service_id,category_id)
);
CREATE INDEX IF NOT EXISTS idx_service_category_links_category ON service_category_links(tenant_id,category_id);

-- Governed taxonomy: categories are structure, not fabricated commercial inventory.
INSERT OR IGNORE INTO catalog_categories (id,tenant_id,kind,slug,name,description,sort_order) VALUES
('cat-product-digital-products','emeriona-global','PRODUCT','digital-products','Digital Products','Digital products and downloadable commercial assets.',10),
('cat-product-software-platforms','emeriona-global','PRODUCT','software-platforms','Software & Platforms','Software products, platforms and enterprise systems.',20),
('cat-product-saas','emeriona-global','PRODUCT','saas','SaaS','Subscription-based software products and cloud applications.',30),
('cat-product-ai','emeriona-global','PRODUCT','ai-products','AI Products','AI-powered products, assistants, agents and intelligent tools.',40),
('cat-product-web-mobile','emeriona-global','PRODUCT','web-mobile-apps','Web & Mobile Applications','Web applications, mobile applications and connected digital experiences.',50),
('cat-product-tools','emeriona-global','PRODUCT','digital-tools','Digital Tools','Practical tools, utilities and productivity products.',60),
('cat-product-knowledge','emeriona-global','PRODUCT','knowledge-products','Knowledge Products','Courses, guides, reports and structured digital knowledge products.',70),
('cat-product-assets','emeriona-global','PRODUCT','digital-assets','Digital Assets','Templates, media, design assets and other digital resources.',80),
('cat-product-enterprise','emeriona-global','PRODUCT','enterprise-products','Business & Enterprise Products','Products designed for organizational and enterprise use.',90),
('cat-product-integrated','emeriona-global','PRODUCT','integrated-solutions','Integrated Digital Products','Composable products designed to connect with wider digital ecosystems.',100),
('cat-service-technology','emeriona-global','SERVICE','technology','Technology Services','Technology delivery, engineering and technical enablement services.',10),
('cat-service-transformation','emeriona-global','SERVICE','digital-transformation','Digital Transformation','Assessment, strategy and execution for digital transformation.',20),
('cat-service-ai','emeriona-global','SERVICE','ai-automation','AI & Automation','AI, intelligent workflows, automation and agent-enabled services.',30),
('cat-service-strategy','emeriona-global','SERVICE','business-strategy','Business & Strategy','Business strategy, operating models and growth-oriented advisory.',40),
('cat-service-consulting','emeriona-global','SERVICE','consulting','Consulting & Advisory','Specialized consulting and professional advisory services.',50),
('cat-service-creative','emeriona-global','SERVICE','creative-digital','Creative & Digital Services','Design, content, brand and digital creative services.',60),
('cat-service-integration','emeriona-global','SERVICE','integration-implementation','Integration & Implementation','Implementation, integration, migration and deployment services.',70),
('cat-service-research','emeriona-global','SERVICE','research-innovation','Research & Innovation','Research, experimentation, R&D and innovation support services.',80),
('cat-service-professional','emeriona-global','SERVICE','professional-services','Professional Services','Structured professional services delivered through defined engagements.',90),
('cat-service-partner','emeriona-global','SERVICE','partner-enabled','Partner-Enabled Services','Services delivered or extended through verified ecosystem partners.',100);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0008_catalog_taxonomy_foundation');
