#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="c5-smoke-${GITHUB_RUN_ID}"; C="c5-customer-${GITHUB_RUN_ID}"; P="c5-partner-${GITHUB_RUN_ID}"; R="c5-product-${GITHUB_RUN_ID}"; O="c5-order-${GITHUB_RUN_ID}"; I="c5-item-${GITHUB_RUN_ID}"
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${T}','C5 Smoke ${GITHUB_RUN_ID}','ACTIVE'); INSERT INTO customers (id,tenant_id,display_name,status) VALUES ('${C}','${T}','C5 Customer','ACTIVE'); INSERT INTO partners (id,tenant_id,legal_name,status) VALUES ('${P}','${T}','C5 Partner','VERIFIED'); INSERT INTO products (id,tenant_id,owner_id,name,status) VALUES ('${R}','${T}','${C}','C5 Product','PUBLISHED'); INSERT INTO orders (id,tenant_id,customer_id,status,total_amount,currency) VALUES ('${O}','${T}','${C}','CONFIRMED',50,'USD'); INSERT INTO order_items (id,order_id,product_id,partner_id,quantity,unit_amount,currency) VALUES ('${I}','${O}','${R}','${P}',1,50,'USD');"
COMMON=(-H "x-tenant-id: ${T}" -H 'x-actor-id: c5-smoke' -H 'x-currency: USD' -H 'content-type: application/json')
curl -fsS "${COMMON[@]}" -H "idempotency-key: c5-create-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/fulfillments" -d "{\"orderId\":\"${O}\"}" > fulfillment.json
FID=$(jq -r '.data.id' fulfillment.json); test -n "$FID" && test "$FID" != null
curl -fsS "${COMMON[@]}" -H "idempotency-key: c5-progress-1-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/fulfillments/progress" -d "{\"fulfillmentId\":\"${FID}\",\"status\":\"IN_PROGRESS\"}" > progress1.json
curl -fsS "${COMMON[@]}" -H "idempotency-key: c5-progress-2-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/fulfillments/progress" -d "{\"fulfillmentId\":\"${FID}\",\"status\":\"FULFILLED\"}" > progress2.json
jq -e '.data.status == "FULFILLED"' progress2.json
curl -fsS "${COMMON[@]}" -H "idempotency-key: c5-create-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/fulfillments" -d "{\"orderId\":\"${O}\"}" | jq -e --arg id "$FID" '.data.id == $id'
npx wrangler d1 execute emeriona-global-db --remote --command="SELECT (SELECT count(*) FROM fulfillments WHERE id='${FID}' AND tenant_id='${T}' AND status='FULFILLED') fulfillment_ok,(SELECT count(*) FROM fulfillment_events WHERE fulfillment_id='${FID}') event_ok,(SELECT count(*) FROM orders WHERE id='${O}' AND status='FULFILLED') order_ok,(SELECT count(*) FROM idempotency_records WHERE tenant_id='${T}' AND status='COMPLETED') idempotency_ok,(SELECT count(*) FROM audit_events WHERE tenant_id='${T}' AND outcome='SUCCEEDED') audit_ok;"
test "$(curl -sS -o /tmp/fulfillment-get.json -w '%{http_code}' "$BASE/api/v1/fulfillments")" = '405'
