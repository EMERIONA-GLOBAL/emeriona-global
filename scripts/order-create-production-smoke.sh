#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
RUN_ID="${GITHUB_RUN_ID:-manual}"
TENANT_ID="order-create-verify-${RUN_ID}"
OTHER_TENANT_ID="order-create-other-${RUN_ID}"
COMMON=(-H "x-tenant-id: ${TENANT_ID}" -H "x-actor-id: order-create-verify-actor" -H 'x-currency: USD' -H 'content-type: application/json')
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${TENANT_ID}','Order Create Verification ${RUN_ID}','ACTIVE'),('${OTHER_TENANT_ID}','Order Create Other ${RUN_ID}','ACTIVE');" >/dev/null
curl -fsS "${COMMON[@]}" -H "idempotency-key: order-customer-${RUN_ID}" -X POST "$BASE/api/v1/customers" -d '{"displayName":"Order Create Verification Customer"}' | tee /tmp/order-customer.json
CUSTOMER_ID=$(jq -r '.data.id' /tmp/order-customer.json)
curl -fsS "${COMMON[@]}" -H "idempotency-key: order-create-${RUN_ID}" -X POST "$BASE/api/v1/orders" -d "{\"customerId\":\"${CUSTOMER_ID}\",\"total\":{\"amount\":75,\"currency\":\"USD\"}}" | tee /tmp/order-create.json
ORDER_ID=$(jq -r '.data.id' /tmp/order-create.json)
test "$(jq -r '.meta.useCaseId' /tmp/order-create.json)" = 'order.create'
test "$(jq -r '.data.customerId' /tmp/order-create.json)" = "$CUSTOMER_ID"
test "$(jq -r '.data.total.amount' /tmp/order-create.json)" = '75'
test "$(jq -r '.data.status' /tmp/order-create.json)" = 'PENDING'
curl -fsS "${COMMON[@]}" -H "idempotency-key: order-create-${RUN_ID}" -X POST "$BASE/api/v1/orders" -d "{\"customerId\":\"${CUSTOMER_ID}\",\"total\":{\"amount\":75,\"currency\":\"USD\"}}" | tee /tmp/order-replay.json
test "$(jq -r '.data.id' /tmp/order-replay.json)" = "$ORDER_ID"
STATUS=$(curl -sS -o /tmp/order-cross-tenant.json -w '%{http_code}' -H "x-tenant-id: ${OTHER_TENANT_ID}" -H 'x-actor-id: order-create-verify-actor' -H 'x-currency: USD' -H 'content-type: application/json' -H "idempotency-key: order-cross-${RUN_ID}" -X POST "$BASE/api/v1/orders" -d "{\"customerId\":\"${CUSTOMER_ID}\",\"total\":{\"amount\":75,\"currency\":\"USD\"}}")
test "$STATUS" = '400'
STATUS=$(curl -sS -o /tmp/order-negative.json -w '%{http_code}' "${COMMON[@]}" -H "idempotency-key: order-negative-${RUN_ID}" -X POST "$BASE/api/v1/orders" -d "{\"customerId\":\"${CUSTOMER_ID}\",\"total\":{\"amount\":-1,\"currency\":\"USD\"}}")
test "$STATUS" = '400'
SQL="SELECT (SELECT count(*) FROM orders WHERE id='${ORDER_ID}' AND tenant_id='${TENANT_ID}' AND customer_id='${CUSTOMER_ID}' AND total_amount=75 AND currency='USD' AND status='PENDING') AS order_ok, (SELECT count(*) FROM orders WHERE customer_id='${CUSTOMER_ID}' AND tenant_id='${OTHER_TENANT_ID}') AS cross_tenant_rows, (SELECT count(*) FROM idempotency_records WHERE tenant_id='${TENANT_ID}' AND use_case_id='order.create' AND idempotency_key='order-create-${RUN_ID}' AND status='COMPLETED') AS idempotency_ok, (SELECT count(*) FROM audit_events WHERE tenant_id='${TENANT_ID}' AND use_case_id='order.create' AND outcome='SUCCEEDED') AS audit_ok;"
npx wrangler d1 execute emeriona-global-db --remote --command="$SQL" | tee /tmp/order-create-persistence.txt
grep -q 'order_ok.*1' /tmp/order-create-persistence.txt
grep -q 'cross_tenant_rows.*0' /tmp/order-create-persistence.txt
grep -q 'idempotency_ok.*1' /tmp/order-create-persistence.txt
grep -q 'audit_ok.*1' /tmp/order-create-persistence.txt
echo "order.create production smoke: PASS"
