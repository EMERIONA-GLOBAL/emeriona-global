#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
RUN_ID="${GITHUB_RUN_ID:-manual}"
TENANT_ID="payment-verify-${RUN_ID}"
OTHER_TENANT_ID="payment-other-${RUN_ID}"
COMMON=(-H "x-tenant-id: ${TENANT_ID}" -H "x-actor-id: payment-verify-actor" -H 'x-currency: USD' -H 'content-type: application/json')
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${TENANT_ID}','Payment Verification ${RUN_ID}','ACTIVE'),('${OTHER_TENANT_ID}','Payment Other ${RUN_ID}','ACTIVE');" >/dev/null
curl -fsS "${COMMON[@]}" -H "idempotency-key: payment-customer-${RUN_ID}" -X POST "$BASE/api/v1/customers" -d '{"displayName":"Payment Verification Customer"}' | tee /tmp/payment-customer.json
CUSTOMER_ID=$(jq -r '.data.id' /tmp/payment-customer.json)
curl -fsS "${COMMON[@]}" -H "idempotency-key: payment-order-${RUN_ID}" -X POST "$BASE/api/v1/orders" -d "{\"customerId\":\"${CUSTOMER_ID}\",\"total\":{\"amount\":120,\"currency\":\"USD\"}}" | tee /tmp/payment-order.json
ORDER_ID=$(jq -r '.data.id' /tmp/payment-order.json)
curl -fsS "${COMMON[@]}" -H "idempotency-key: payment-create-${RUN_ID}" -X POST "$BASE/api/v1/payments" -d "{\"orderId\":\"${ORDER_ID}\",\"amount\":{\"amount\":120,\"currency\":\"USD\"}}" | tee /tmp/payment-result.json
PAYMENT_ID=$(jq -r '.data.id' /tmp/payment-result.json)
test "$(jq -r '.meta.useCaseId' /tmp/payment-result.json)" = 'payment.create'
test "$(jq -r '.data.orderId' /tmp/payment-result.json)" = "$ORDER_ID"
test "$(jq -r '.data.status' /tmp/payment-result.json)" = 'CREATED'
curl -fsS "${COMMON[@]}" -H "idempotency-key: payment-create-${RUN_ID}" -X POST "$BASE/api/v1/payments" -d "{\"orderId\":\"${ORDER_ID}\",\"amount\":{\"amount\":120,\"currency\":\"USD\"}}" | tee /tmp/payment-replay.json
test "$(jq -r '.data.id' /tmp/payment-replay.json)" = "$PAYMENT_ID"
STATUS=$(curl -sS -o /tmp/payment-mismatch.json -w '%{http_code}' "${COMMON[@]}" -H "idempotency-key: payment-mismatch-${RUN_ID}" -X POST "$BASE/api/v1/payments" -d "{\"orderId\":\"${ORDER_ID}\",\"amount\":{\"amount\":119,\"currency\":\"USD\"}}")
test "$STATUS" = '400'
STATUS=$(curl -sS -o /tmp/payment-cross.json -w '%{http_code}' -H "x-tenant-id: ${OTHER_TENANT_ID}" -H 'x-actor-id: payment-verify-actor' -H 'x-currency: USD' -H 'content-type: application/json' -H "idempotency-key: payment-cross-${RUN_ID}" -X POST "$BASE/api/v1/payments" -d "{\"orderId\":\"${ORDER_ID}\",\"amount\":{\"amount\":120,\"currency\":\"USD\"}}")
test "$STATUS" = '400'
SQL="SELECT (SELECT count(*) FROM payment_intents WHERE id='${PAYMENT_ID}' AND tenant_id='${TENANT_ID}' AND order_id='${ORDER_ID}' AND status='CREATED' AND amount=120 AND currency='USD') AS payment_ok, (SELECT count(*) FROM payment_intents WHERE order_id='${ORDER_ID}' AND tenant_id='${OTHER_TENANT_ID}') AS cross_tenant_rows, (SELECT count(*) FROM payment_events WHERE tenant_id='${TENANT_ID}' AND payment_intent_id='${PAYMENT_ID}' AND to_status='CREATED') AS event_ok, (SELECT count(*) FROM revenue_entries WHERE tenant_id='${TENANT_ID}' AND payment_intent_id='${PAYMENT_ID}' AND status='PENDING') AS revenue_ok, (SELECT count(*) FROM idempotency_records WHERE tenant_id='${TENANT_ID}' AND use_case_id='payment.create' AND idempotency_key='payment-create-${RUN_ID}' AND status='COMPLETED') AS idempotency_ok, (SELECT count(*) FROM audit_events WHERE tenant_id='${TENANT_ID}' AND use_case_id='payment.create' AND outcome='SUCCEEDED') AS audit_ok;"
npx wrangler d1 execute emeriona-global-db --remote --command="$SQL" | tee /tmp/payment-persistence.txt
grep -q 'payment_ok.*1' /tmp/payment-persistence.txt
grep -q 'cross_tenant_rows.*0' /tmp/payment-persistence.txt
grep -q 'event_ok.*1' /tmp/payment-persistence.txt
grep -q 'revenue_ok.*1' /tmp/payment-persistence.txt
grep -q 'idempotency_ok.*1' /tmp/payment-persistence.txt
grep -q 'audit_ok.*1' /tmp/payment-persistence.txt
echo "payment.create production smoke: PASS"
echo "Starting payment.authorize diagnostic..."
AUTH_STATUS=$(curl -sS -o /tmp/payment-authorize.json -w '%{http_code}' -X POST "https://emeriona-global.emerionaglobal.workers.dev/api/v1/payments/authorize" -H "x-tenant-id: ${TENANT_ID}" -H "x-actor-id: payment-verify-actor" -H "x-currency: USD" -H "content-type: application/json" -H "idempotency-key: payment-authorize-${RUN_ID}" -d "{\"paymentId\":\"${PAYMENT_ID}\"}")
cat /tmp/payment-authorize.json
echo "payment.authorize HTTP status: $AUTH_STATUS"
test "$AUTH_STATUS" = "200"
test "$(jq -r '.meta.useCaseId' /tmp/payment-authorize.json)" = "payment.authorize"
test "$(jq -r '.data.status' /tmp/payment-authorize.json)" = "AUTHORIZED"
echo "payment.authorize production smoke: PASS"
