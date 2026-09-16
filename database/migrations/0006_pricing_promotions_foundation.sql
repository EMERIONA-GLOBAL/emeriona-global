-- EMERIONA GLOBAL — Pricing & Promotions Foundation
-- Migration 0006
-- Provider-neutral pricing quotes and promotion validation evidence.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS price_quotes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  cart_id TEXT NOT NULL REFERENCES carts(id),
  subtotal_amount REAL NOT NULL CHECK (subtotal_amount >= 0),
  discount_amount REAL NOT NULL CHECK (discount_amount >= 0),
  total_amount REAL NOT NULL CHECK (total_amount >= 0),
  currency TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_price_quotes_tenant_cart ON price_quotes(tenant_id,cart_id);

CREATE TABLE IF NOT EXISTS promotion_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  cart_id TEXT NOT NULL REFERENCES carts(id),
  discount_id TEXT REFERENCES discounts(id),
  outcome TEXT NOT NULL CHECK (outcome IN ('VALID','INVALID')),
  discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  currency TEXT NOT NULL,
  reason TEXT,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_promotion_events_tenant_cart ON promotion_events(tenant_id,cart_id);

INSERT OR IGNORE INTO schema_migrations (version)
VALUES ('0006_pricing_promotions_foundation');
