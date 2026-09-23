PRAGMA foreign_keys = ON;
ALTER TABLE cart_items ADD COLUMN commercial_offer_id TEXT REFERENCES commercial_offers(id);
ALTER TABLE order_items ADD COLUMN commercial_offer_id TEXT REFERENCES commercial_offers(id);
CREATE INDEX IF NOT EXISTS idx_cart_items_commercial_offer ON cart_items(commercial_offer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_commercial_offer ON order_items(commercial_offer_id);
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0015_commercial_offer_order_provenance');
