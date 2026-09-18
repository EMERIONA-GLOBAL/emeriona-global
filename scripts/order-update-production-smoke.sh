#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
RUN_ID="${GITHUB_RUN_ID:-manual}"
TENANT_ID="order-update-verify-${RUN_ID}"
OTHER_TENANT_ID="order-update-other-${RUN_ID}"
COMMON=(-H "x-tenant-id: ${TENANT_ID}" -H "x-actor-id: order-update-verify-actor" -H 'x-currency: USD' -H 'content-type: application/json')
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${TENANT_ID}','Order Update Verification ${RUN_ID}','ACTIVE'),('${OTHER_TENANT_ID}','Order Update Other ${RUN_ID}','ACTIVE');" >/dev/null
curl -fsS "${COMMON[@]}" -H "idempotency-key: order-update-customer-${RUN_ID}" -X POST "$BASE/api/v1/customers" -d '{"displayName":"Order Update Verification Customer"}' | tee /tmp/order-update-customer.json
CUSTOMER_ID=$(jq -r '.data.id' /tmp/order-update-customer.json)
curl -fsS "${COMMON[@]}" -H "idempotency-key: order-update-order-${RUN_ID}" -X POST "$BASE/api/v1/orders" -d "{\"customerId\":\"${CUSTOMER_ID}\",\"total\":{\"amount\":80,\"currency\":\"USD\"}}" | tee /tmp/order-update-order.json
ORDER_ID=$(jq -r '.data.id' /tmp/order-update-order.json)
curl -fsS "${COMMON[@]}" -H "idempotency-key: order-update-confirm-${RUN_ID}" -X POST "$BASE/api/v1/orders/update" -d "{\"orderId\":\"${ORDER_ID}\",\"status\":\"CONFIRMED\"}" | tee /tmp/order-update-result.json
test "$(jq -r '.meta.useCaseId' /tmp/order-update-result.json)" = 'order.update'
test "$(jq -r '.data.id' /tmp/order-update-result.json)" = "$ORDER_ID"
test "$(jq -r '.data.status' /tmp/order-update-result.json)" = 'CONFIRMED'
curl -fsS "${COMMON[@]}" -H "idempotency-key: order-update-confirm-${RUN_ID}" -X POST "$BASE/api/v1/orders/update" -d "{\"orderId\":\"${ORDER_ID}\",\"status\":\"CONFIRMED\"}" | tee /tmp/order-update-replay.json
test "$(jq -r '.data.id' /tmp/order-update-replay.json)" = "$ORDER_ID"
test "$(jq -r '.data.status' /tmp/order-update-replay.json)" = 'CONFIRMED'
STATUS=$(curl -sS -o /tmp/order-update-invalid.json -w '%{http_code}' "${COMMON[@]}" -H "idempotency-key: order-update-invalid-${RUN_ID}" -X POST "$BASE/api/v1/orders/update" -d "{\"orderId\":\"${ORDER_ID}\",\"status\":\"PENDING\"}")
test "$STATUS" = '400'
STATUS=$(curl -sS -o /tmp/order-update-cross.json -w '%{http_code}' -H "x-tenant-id: ${OTHER_TENANT_ID}" -H 'x-actor-id: order-update-verify-actor' -H 'x-currency: USD' -H 'content-type: application/json' -H "idempotency-key: order-update-cross-${RUN_ID}" -X POST "$BASE/api/v1/orders/update" -d "{\"orderId\":\"${ORDER_ID}\",\"status\":\"FULFILLING\"}")
test "$STATUS" = '400'
SQL="SELECT (SELECT count(*) FROM orders WHERE id='${ORDER_ID}' AND tenant_id='${TENANT_ID}' AND status='CONFIRMED') AS order_ok, (SELECT count(*) FROM orders WHERE id='${ORDER_ID}' AND tenant_id='${OTHER_TENANT_ID}') AS cross_tenant_rows, (SELECT count(*) FROM order_events WHERE tenant_id='${TENANT_ID}' AND order_id='${ORDER_ID}' AND from_status='PENDING' AND to_status='CONFIRMED') AS event_ok, (SELECT count(*) FROM idempotency_records WHERE tenant_id='${TENANT_ID}' AND use_case_id='order.update' AND idempotency_key='order-update-confirm-${RUN_ID}' AND status='COMPLETED') AS idempotency_ok, (SELECT count(*) FROM audit_events WHERE tenant_id='${TENANT_ID}' AND use_case_id='order.update' AND outcome='SUCCEEDED') AS audit_ok;"
npx wrangler d1 execute emeriona-global-db --remote --command="$SQL" | tee /tmp/order-update-persistence.txt
grep -q 'order_ok.*1' /tmp/order-update-persistence.txt
grep -q 'cross_tenant_rows.*0' /tmp/order-update-persistence.txt
grep -q 'event_ok.*1' /tmp/order-update-persistence.txt
grep -q 'idempotency_ok.*1' /tmp/order-update-persistence.txt
grep -q 'audit_ok.*1' /tmp/order-update-persistence.txt
echo "order.update production smoke: PASS"
