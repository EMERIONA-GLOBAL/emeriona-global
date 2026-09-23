#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
RUN_ID="${GITHUB_RUN_ID:-manual}"
TENANT_ID="fulfillment-verify-${RUN_ID}"
OTHER_TENANT_ID="fulfillment-other-${RUN_ID}"
COMMON=(-H "x-tenant-id: ${TENANT_ID}" -H "x-actor-id: fulfillment-verify-actor" -H 'x-currency: USD' -H 'content-type: application/json')
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${TENANT_ID}','Fulfillment Verification ${RUN_ID}','ACTIVE'),('${OTHER_TENANT_ID}','Fulfillment Other ${RUN_ID}','ACTIVE');" >/dev/null
curl -fsS "${COMMON[@]}" -H "idempotency-key: fulfillment-customer-${RUN_ID}" -X POST "$BASE/api/v1/customers" -d '{"displayName":"Fulfillment Verification Customer"}' | tee /tmp/fulfillment-customer.json
CUSTOMER_ID=$(jq -r '.data.id' /tmp/fulfillment-customer.json)
curl -fsS "${COMMON[@]}" -H "idempotency-key: fulfillment-order-${RUN_ID}" -X POST "$BASE/api/v1/orders" -d "{\"customerId\":\"${CUSTOMER_ID}\",\"total\":{\"amount\":90,\"currency\":\"USD\"}}" | tee /tmp/fulfillment-order.json
ORDER_ID=$(jq -r '.data.id' /tmp/fulfillment-order.json)
curl -fsS "${COMMON[@]}" -H "idempotency-key: fulfillment-payment-${RUN_ID}" -X POST "$BASE/api/v1/payments" -d "{\"orderId\":\"${ORDER_ID}\",\"amount\":{\"amount\":90,\"currency\":\"USD\"}}" | tee /tmp/fulfillment-payment.json
PAYMENT_ID=$(jq -r '.data.id' /tmp/fulfillment-payment.json)
curl -fsS "${COMMON[@]}" -H "idempotency-key: fulfillment-authorize-${RUN_ID}" -X POST "$BASE/api/v1/payments/authorize" -d "{\"paymentId\":\"${PAYMENT_ID}\"}" >/tmp/fulfillment-authorize.json
curl -fsS "${COMMON[@]}" -H "idempotency-key: fulfillment-capture-${RUN_ID}" -X POST "$BASE/api/v1/payments/capture" -d "{\"paymentId\":\"${PAYMENT_ID}\"}" >/tmp/fulfillment-capture.json
curl -fsS "${COMMON[@]}" -H "idempotency-key: fulfillment-execute-${RUN_ID}" -X POST "$BASE/api/v1/fulfillments" -d "{\"orderId\":\"${ORDER_ID}\"}" | tee /tmp/fulfillment-result.json
FULFILLMENT_ID=$(jq -r '.data.id' /tmp/fulfillment-result.json)
test "$(jq -r '.meta.useCaseId' /tmp/fulfillment-result.json)" = 'fulfillment.execute'
test "$(jq -r '.data.orderId' /tmp/fulfillment-result.json)" = "$ORDER_ID"
test "$(jq -r '.data.status' /tmp/fulfillment-result.json)" = 'PENDING'
curl -fsS "${COMMON[@]}" -H "idempotency-key: fulfillment-execute-${RUN_ID}" -X POST "$BASE/api/v1/fulfillments" -d "{\"orderId\":\"${ORDER_ID}\"}" | tee /tmp/fulfillment-replay.json
test "$(jq -r '.data.id' /tmp/fulfillment-replay.json)" = "$FULFILLMENT_ID"
curl -fsS "${COMMON[@]}" -H "idempotency-key: fulfillment-progress-start-${RUN_ID}" -X POST "$BASE/api/v1/fulfillments/progress" -d "{\"fulfillmentId\":\"${FULFILLMENT_ID}\",\"status\":\"IN_PROGRESS\"}" | tee /tmp/fulfillment-progress-start.json
test "$(jq -r '.data.status' /tmp/fulfillment-progress-start.json)" = 'IN_PROGRESS'
curl -fsS "${COMMON[@]}" -H "idempotency-key: fulfillment-progress-complete-${RUN_ID}" -X POST "$BASE/api/v1/fulfillments/progress" -d "{\"fulfillmentId\":\"${FULFILLMENT_ID}\",\"status\":\"FULFILLED\"}" | tee /tmp/fulfillment-progress-complete.json
test "$(jq -r '.data.status' /tmp/fulfillment-progress-complete.json)" = 'FULFILLED'
STATUS=$(curl -sS -o /tmp/fulfillment-cross.json -w '%{http_code}' -H "x-tenant-id: ${OTHER_TENANT_ID}" -H 'x-actor-id: fulfillment-verify-actor' -H 'x-currency: USD' -H 'content-type: application/json' -H "idempotency-key: fulfillment-cross-${RUN_ID}" -X POST "$BASE/api/v1/fulfillments" -d "{\"orderId\":\"${ORDER_ID}\"}")
test "$STATUS" = '400'
SQL="SELECT (SELECT count(*) FROM fulfillments WHERE id='${FULFILLMENT_ID}' AND tenant_id='${TENANT_ID}' AND order_id='${ORDER_ID}' AND status='FULFILLED') AS fulfillment_ok, (SELECT count(*) FROM fulfillments WHERE order_id='${ORDER_ID}' AND tenant_id='${OTHER_TENANT_ID}') AS cross_tenant_rows, (SELECT count(*) FROM fulfillment_events WHERE tenant_id='${TENANT_ID}' AND fulfillment_id='${FULFILLMENT_ID}' AND to_status='FULFILLED') AS event_ok, (SELECT count(*) FROM idempotency_records WHERE tenant_id='${TENANT_ID}' AND use_case_id='fulfillment.execute' AND idempotency_key='fulfillment-execute-${RUN_ID}' AND status='COMPLETED') AS idempotency_ok, (SELECT count(*) FROM audit_events WHERE tenant_id='${TENANT_ID}' AND use_case_id='fulfillment.execute' AND outcome='SUCCEEDED') AS audit_ok;"
npx wrangler d1 execute emeriona-global-db --remote --command="$SQL" | tee /tmp/fulfillment-persistence.txt
grep -q 'fulfillment_ok.*1' /tmp/fulfillment-persistence.txt
grep -q 'cross_tenant_rows.*0' /tmp/fulfillment-persistence.txt
grep -q 'event_ok.*1' /tmp/fulfillment-persistence.txt
grep -q 'idempotency_ok.*1' /tmp/fulfillment-persistence.txt
grep -q 'audit_ok.*1' /tmp/fulfillment-persistence.txt
echo "fulfillment.execute production smoke: PASS"
