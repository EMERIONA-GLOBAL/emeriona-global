#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="c6-smoke-${GITHUB_RUN_ID}"; C="c6-customer-${GITHUB_RUN_ID}"; O="c6-order-${GITHUB_RUN_ID}"; PAY="c6-payment-${GITHUB_RUN_ID}"
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${T}','C6 Smoke ${GITHUB_RUN_ID}','ACTIVE'); INSERT INTO customers (id,tenant_id,display_name,status) VALUES ('${C}','${T}','C6 Customer','ACTIVE'); INSERT INTO orders (id,tenant_id,customer_id,status,total_amount,currency) VALUES ('${O}','${T}','${C}','FULFILLED',75,'USD'); INSERT INTO payment_intents (id,tenant_id,order_id,status,amount,currency) VALUES ('${PAY}','${T}','${O}','CAPTURED',75,'USD');"
COMMON=(-H "x-tenant-id: ${T}" -H 'x-actor-id: c6-smoke' -H 'x-currency: USD' -H 'content-type: application/json')
curl -fsS "${COMMON[@]}" -H "idempotency-key: c6-return-create-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/returns" -d "{\"orderId\":\"${O}\",\"reason\":\"C6 smoke return\"}" > return.json
RID=$(jq -r '.data.id' return.json); test -n "$RID" && test "$RID" != null
curl -fsS "${COMMON[@]}" -H "idempotency-key: c6-return-approved-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/returns/progress" -d "{\"returnId\":\"${RID}\",\"status\":\"APPROVED\"}" >/dev/null
curl -fsS "${COMMON[@]}" -H "idempotency-key: c6-return-received-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/returns/progress" -d "{\"returnId\":\"${RID}\",\"status\":\"RECEIVED\"}" >/dev/null
curl -fsS "${COMMON[@]}" -H "idempotency-key: c6-return-completed-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/returns/progress" -d "{\"returnId\":\"${RID}\",\"status\":\"COMPLETED\"}" > return-completed.json
jq -e '.data.status == "COMPLETED"' return-completed.json
curl -fsS "${COMMON[@]}" -H "idempotency-key: c6-return-create-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/returns" -d "{\"orderId\":\"${O}\",\"reason\":\"C6 smoke return\"}" | jq -e --arg id "$RID" '.data.id == $id'
curl -fsS "${COMMON[@]}" -H "idempotency-key: c6-refund-create-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/refund-requests" -d "{\"orderId\":\"${O}\",\"paymentId\":\"${PAY}\",\"amount\":{\"amount\":75,\"currency\":\"USD\"},\"reason\":\"C6 smoke refund request\"}" > refund.json
RFID=$(jq -r '.data.id' refund.json); test -n "$RFID" && test "$RFID" != null
curl -fsS "${COMMON[@]}" -H "idempotency-key: c6-refund-approved-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/refund-requests/progress" -d "{\"refundRequestId\":\"${RFID}\",\"status\":\"APPROVED\"}" >/dev/null
curl -fsS "${COMMON[@]}" -H "idempotency-key: c6-refund-processing-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/refund-requests/progress" -d "{\"refundRequestId\":\"${RFID}\",\"status\":\"PROCESSING\"}" > refund-processing.json
jq -e '.data.status == "PROCESSING"' refund-processing.json
test "$(curl -sS -o /tmp/c6-refund-complete.json -w '%{http_code}' "${COMMON[@]}" -H "idempotency-key: c6-refund-completed-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/refund-requests/progress" -d "{\"refundRequestId\":\"${RFID}\",\"status\":\"COMPLETED\"}")" = '400'
npx wrangler d1 execute emeriona-global-db --remote --command="SELECT (SELECT count(*) FROM return_requests WHERE id='${RID}' AND tenant_id='${T}' AND status='COMPLETED') return_ok,(SELECT count(*) FROM return_events WHERE return_request_id='${RID}') return_events_ok,(SELECT count(*) FROM refund_requests WHERE id='${RFID}' AND tenant_id='${T}' AND status='PROCESSING') refund_ok,(SELECT count(*) FROM refund_events WHERE refund_request_id='${RFID}') refund_events_ok,(SELECT count(*) FROM idempotency_records WHERE tenant_id='${T}' AND status='COMPLETED') idempotency_ok,(SELECT count(*) FROM audit_events WHERE tenant_id='${T}' AND outcome='SUCCEEDED') audit_ok;"
test "$(curl -sS -o /tmp/c6-return-get.json -w '%{http_code}' "$BASE/api/v1/returns")" = '405'
