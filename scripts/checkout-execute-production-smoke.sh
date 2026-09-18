#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
RUN_ID="${GITHUB_RUN_ID:-manual}"
TENANT_ID="checkout-verify-${RUN_ID}"
COMMON=(-H "x-tenant-id: ${TENANT_ID}" -H "x-actor-id: checkout-verify-actor" -H 'x-currency: USD' -H 'content-type: application/json')
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${TENANT_ID}','Checkout Verification ${RUN_ID}','ACTIVE');" >/dev/null
curl -fsS "${COMMON[@]}" -H "idempotency-key: checkout-customer-${RUN_ID}" -X POST "$BASE/api/v1/customers" -d '{"displayName":"Checkout Verification Customer"}' | tee /tmp/checkout-customer.json
CUSTOMER_ID=$(jq -r '.data.id' /tmp/checkout-customer.json)
curl -fsS "${COMMON[@]}" -H "idempotency-key: checkout-product-${RUN_ID}" -X POST "$BASE/api/v1/products" -d '{"ownerId":"checkout-owner","name":"Checkout Verification Product"}' | tee /tmp/checkout-product.json
PRODUCT_ID=$(jq -r '.data.id' /tmp/checkout-product.json)
curl -fsS "${COMMON[@]}" -H "idempotency-key: checkout-cart-${RUN_ID}" -X POST "$BASE/api/v1/carts" -d "{\"customerId\":\"${CUSTOMER_ID}\"}" | tee /tmp/checkout-cart.json
CART_ID=$(jq -r '.data.id' /tmp/checkout-cart.json)
curl -fsS "${COMMON[@]}" -H "idempotency-key: checkout-item-${RUN_ID}" -X POST "$BASE/api/v1/cart-items" -d "{\"cartId\":\"${CART_ID}\",\"productId\":\"${PRODUCT_ID}\",\"quantity\":2,\"unitAmount\":{\"amount\":25,\"currency\":\"USD\"}}" | tee /tmp/checkout-item.json
curl -fsS "${COMMON[@]}" -H "idempotency-key: checkout-execute-${RUN_ID}" -X POST "$BASE/api/v1/checkout" -d "{\"cartId\":\"${CART_ID}\"}" | tee /tmp/checkout-result.json
ORDER_ID=$(jq -r '.data.orderId' /tmp/checkout-result.json)
test "$(jq -r '.meta.useCaseId' /tmp/checkout-result.json)" = 'checkout.execute'
test "$(jq -r '.data.total.amount' /tmp/checkout-result.json)" = '50'
test "$(jq -r '.data.itemCount' /tmp/checkout-result.json)" = '1'
curl -fsS "${COMMON[@]}" -H "idempotency-key: checkout-execute-${RUN_ID}" -X POST "$BASE/api/v1/checkout" -d "{"cartId":"${CART_ID}"}" | tee /tmp/checkout-replay.json
test "$(jq -r '.data.orderId' /tmp/checkout-replay.json)" = "$ORDER_ID"
STATUS=$(curl -sS -o /tmp/cross-tenant.json -w '%{http_code}' -H "x-tenant-id: checkout-other-${RUN_ID}" -H 'x-actor-id: checkout-verify-actor' -H 'x-currency: USD' -H 'content-type: application/json' -H "idempotency-key: checkout-cross-${RUN_ID}" -X POST "$BASE/api/v1/checkout" -d "{"cartId":"${CART_ID}"}")
test "$STATUS" = '400'
SQL="SELECT (SELECT count(*) FROM orders WHERE id='${ORDER_ID}' AND tenant_id='${TENANT_ID}' AND total_amount=50 AND status='PENDING') AS order_ok, (SELECT count(*) FROM order_items WHERE order_id='${ORDER_ID}') AS items_ok, (SELECT count(*) FROM carts WHERE id='${CART_ID}' AND tenant_id='${TENANT_ID}' AND status='CHECKED_OUT') AS cart_ok, (SELECT count(*) FROM idempotency_records WHERE tenant_id='${TENANT_ID}' AND status='COMPLETED') AS idempotency_ok, (SELECT count(*) FROM audit_events WHERE tenant_id='${TENANT_ID}' AND outcome='SUCCEEDED') AS audit_ok;"
npx wrangler d1 execute emeriona-global-db --remote --command="$SQL" | tee /tmp/checkout-persistence.txt
grep -q 'order_ok.*1' /tmp/checkout-persistence.txt
grep -q 'items_ok.*1' /tmp/checkout-persistence.txt
grep -q 'cart_ok.*1' /tmp/checkout-persistence.txt
grep -q 'idempotency_ok.*5' /tmp/checkout-persistence.txt
grep -q 'audit_ok.*5' /tmp/checkout-persistence.txt
echo "checkout.execute production smoke: PASS"
