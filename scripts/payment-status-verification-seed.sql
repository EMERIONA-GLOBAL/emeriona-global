PRAGMA foreign_keys = ON;
INSERT OR IGNORE INTO tenants (id,name,status) VALUES ('status-verification-tenant','Status Verification','ACTIVE'),('status-verification-other','Status Verification Other','ACTIVE');
INSERT OR IGNORE INTO customers (id,tenant_id,display_name,status) VALUES ('status-verification-customer','status-verification-tenant','Status Verification Customer','ACTIVE');
INSERT OR IGNORE INTO orders (id,tenant_id,customer_id,status,total_amount,currency) VALUES ('status-verification-order','status-verification-tenant','status-verification-customer','FULFILLED',125,'USD');
INSERT OR IGNORE INTO payment_intents (id,tenant_id,order_id,status,amount,currency) VALUES ('status-verification-payment','status-verification-tenant','status-verification-order','CAPTURED',125,'USD');