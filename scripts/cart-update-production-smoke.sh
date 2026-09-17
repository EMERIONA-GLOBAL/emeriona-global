#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="cart-update-smoke-${GITHUB_RUN_ID:-manual}"
T2="cart-update-isolation-${GITHUB_RUN_ID:-manual}"
C="cart-update-cart-${GITHUB_RUN_ID:-manual}"
C1="cart-update-customer1-${GITHUB_RUN_ID:-manual}"
C2="cart-update-customer2-${GITHUB_RUN_ID:-manual}"
C3="cart-update-isolation-customer-${GITHUB_RUN_ID:-manual}"
cleanup() {
  npx wrangler d1 execute emeriona-global-db --remote --command="DELETE FROM carts WHERE id='${C}'; DELETE FROM customers WHERE id IN ('${C1}','${C2}','${C3}'); DELETE FROM tenants WHERE id IN ('${T}','${T2}');" >/dev/null 2>&1 || true
}
trap cleanup EXIT
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${T}','Cart Update Smoke','ACTIVE'),('${T2}','Cart Update Isolation','ACTIVE'); INSERT INTO customers (id,tenant_id,display_name,status,locale,timezone) VALUES ('${C1}','${T}','Cart Update Customer 1','ACTIVE','en','UTC'),('${C2}','${T}','Cart Update Customer 2','ACTIVE','en','UTC'),('${C3}','${T2}','Isolation Customer','ACTIVE','en','UTC'); INSERT INTO carts (id,tenant_id,customer_id,status,currency) VALUES ('${C}','${T}','${C1}','OPEN','USD');"
COMMON=(-H "x-tenant-id: ${T}" -H 'x-actor-id: cart-update-smoke' -H 'x-currency: USD' -H 'content-type: application/json')
UPDATE_KEY="cart-update-${GITHUB_RUN_ID:-manual}"
PAYLOAD="{\"cartId\":\"${C}\",\"customerId\":\"${C2}\"}"
curl -fsS "${COMMON[@]}" -H "idempotency-key: ${UPDATE_KEY}" -X POST "$BASE/api/v1/carts/update" -d "$PAYLOAD" > update.json
jq -e --arg id "${C}" --arg customer "${C2}" '.data.id == $id and .data.customerId == $customer and .meta.useCaseId == "cart.update"' update.json
npx wrangler d1 execute emeriona-global-db --remote --json --command="SELECT id,tenant_id,customer_id,status FROM carts WHERE id='${C}';" > persistence.json
jq -e --arg id "${C}" --arg tenant "${T}" --arg customer "${C2}" '.[0].results[0].id == $id and .[0].results[0].tenant_id == $tenant and .[0].results[0].customer_id == $customer and .[0].results[0].status == "OPEN"' persistence.json
REPLAY_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: ${UPDATE_KEY}" -X POST "$BASE/api/v1/carts/update" -d "$PAYLOAD" -o replay.json -w '%{http_code}')"
test "$REPLAY_STATUS" = '200'
jq -e --arg id "${C}" --arg customer "${C2}" '.data.id == $id and .data.customerId == $customer' replay.json
COMMON2=(-H "x-tenant-id: ${T2}" -H 'x-actor-id: cart-update-isolation' -H 'x-currency: USD' -H 'content-type: application/json')
CROSS_PAYLOAD="{\"cartId\":\"${C}\",\"customerId\":\"${C3}\"}"
CROSS_STATUS="$(curl -sS "${COMMON2[@]}" -H "idempotency-key: cart-update-cross-${GITHUB_RUN_ID:-manual}" -X POST "$BASE/api/v1/carts/update" -d "$CROSS_PAYLOAD" -o cross.json -w '%{http_code}')"
test "$CROSS_STATUS" = '400'
EMPTY_PAYLOAD="{\"cartId\":\"${C}\"}"
EMPTY_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: cart-update-empty-${GITHUB_RUN_ID:-manual}" -X POST "$BASE/api/v1/carts/update" -d "$EMPTY_PAYLOAD" -o empty.json -w '%{http_code}')"
test "$EMPTY_STATUS" = '400'
test "$(curl -sS -o /tmp/cart-update-get.json -w '%{http_code}' "$BASE/api/v1/carts/update")" = '405'
EVIDENCE="SELECT (SELECT count(*) FROM carts WHERE tenant_id='${T}' AND id='${C}' AND customer_id='${C2}' AND status='OPEN') AS cart_ok,(SELECT count(*) FROM carts WHERE tenant_id='${T2}' AND id='${C}') AS cross_tenant_rows,(SELECT count(*) FROM idempotency_records WHERE tenant_id='${T}' AND idempotency_key='${UPDATE_KEY}' AND status='COMPLETED') AS idempotency_ok;"
npx wrangler d1 execute emeriona-global-db --remote --json --command="$EVIDENCE" > evidence.json
jq -e '.[0].results[0].cart_ok == 1 and .[0].results[0].cross_tenant_rows == 0 and .[0].results[0].idempotency_ok == 1' evidence.json
