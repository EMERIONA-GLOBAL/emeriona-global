#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="c7-smoke-${GITHUB_RUN_ID}"; C="c7-customer-${GITHUB_RUN_ID}"; CART="c7-cart-${GITHUB_RUN_ID}"; PROD="c7-product-${GITHUB_RUN_ID}"; ITEM="c7-item-${GITHUB_RUN_ID}"; DIS="c7-discount-${GITHUB_RUN_ID}"
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${T}','C7 Smoke ${GITHUB_RUN_ID}','ACTIVE'); INSERT INTO customers (id,tenant_id,display_name,status) VALUES ('${C}','${T}','C7 Customer','ACTIVE'); INSERT INTO products (id,tenant_id,owner_id,name,status) VALUES ('${PROD}','${T}','${C}','C7 Product','PUBLISHED'); INSERT INTO carts (id,tenant_id,customer_id,status,currency) VALUES ('${CART}','${T}','${C}','OPEN','USD'); INSERT INTO cart_items (id,cart_id,product_id,quantity,unit_amount,currency) VALUES ('${ITEM}','${CART}','${PROD}',2,50,'USD'); INSERT INTO discounts (id,tenant_id,owner_id,status,type,value,currency) VALUES ('${DIS}','${T}','${C}','ACTIVE','PERCENTAGE',10,'USD');"
COMMON=(-H "x-tenant-id: ${T}" -H 'x-actor-id: c7-smoke' -H 'x-currency: USD' -H 'content-type: application/json')
curl -fsS "${COMMON[@]}" -H "idempotency-key: c7-quote-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/pricing/quote" -d "{\"cartId\":\"${CART}\"}" > quote.json
jq -e '.data.subtotal == 100 and .data.discount == 0 and .data.total == 100 and .data.currency == "USD"' quote.json
curl -fsS "${COMMON[@]}" -H "idempotency-key: c7-quote-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/pricing/quote" -d "{\"cartId\":\"${CART}\"}" | jq -e --slurpfile q quote.json '.data.quoteId == $q[0].data.quoteId'
curl -fsS "${COMMON[@]}" -H "idempotency-key: c7-promo-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/promotions/discounts/validate" -d "{\"cartId\":\"${CART}\",\"discountId\":\"${DIS}\"}" > promo.json
jq -e '.data.valid == true and .data.discountId != null and .data.cartId != null' promo.json
npx wrangler d1 execute emeriona-global-db --remote --command="SELECT (SELECT count(*) FROM price_quotes WHERE tenant_id='${T}' AND cart_id='${CART}' AND subtotal_amount=100 AND total_amount=100) quote_ok,(SELECT count(*) FROM promotion_events WHERE tenant_id='${T}' AND cart_id='${CART}' AND discount_id='${DIS}' AND outcome='VALID' AND discount_amount=10) promotion_ok,(SELECT count(*) FROM idempotency_records WHERE tenant_id='${T}' AND status='COMPLETED') idempotency_ok,(SELECT count(*) FROM audit_events WHERE tenant_id='${T}' AND outcome='SUCCEEDED') audit_ok;"
test "$(curl -sS -o /tmp/c7-quote-get.json -w '%{http_code}' "$BASE/api/v1/pricing/quote")" = '405'
test "$(curl -sS -o /tmp/c7-promo-get.json -w '%{http_code}' "$BASE/api/v1/promotions/discounts/validate")" = '405'
