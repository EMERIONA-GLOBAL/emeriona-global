#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="cart-item-add-smoke-${GITHUB_RUN_ID:-manual}"
T2="cart-item-add-isolation-${GITHUB_RUN_ID:-manual}"
C="cart-item-add-cart-${GITHUB_RUN_ID:-manual}"
C2="cart-item-add-cross-cart-${GITHUB_RUN_ID:-manual}"
CUS="cart-item-add-customer-${GITHUB_RUN_ID:-manual}"
P="cart-item-add-product-${GITHUB_RUN_ID:-manual}"
trap 'npx wrangler d1 execute emeriona-global-db --remote --command="DELETE FROM cart_items WHERE cart_id IN ('\''${C}'\'', '\''${C2}'\''); DELETE FROM carts WHERE id IN ('\''${C}'\'', '\''${C2}'\''); DELETE FROM products WHERE id='\''${P}'\''; DELETE FROM customers WHERE id='\''${CUS}'\''; DELETE FROM tenants WHERE id IN ('\''${T}'\'', '\''${T2}'\'');" >/dev/null 2>&1 || true' EXIT
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${T}','Cart Item Smoke','ACTIVE'),('${T2}','Cart Item Isolation','ACTIVE'); INSERT INTO customers (id,tenant_id,display_name,status,locale,timezone) VALUES ('${CUS}','${T}','Cart Item Customer','ACTIVE','en','UTC'); INSERT INTO carts (id,tenant_id,customer_id,status,currency) VALUES ('${C}','${T}','${CUS}','OPEN','USD'),('${C2}','${T2}','${CUS}','OPEN','USD'); INSERT INTO products (id,tenant_id,owner_id,name,status) VALUES ('${P}','${T}','${CUS}','Cart Item Product','PUBLISHED');"
COMMON=(-H "x-tenant-id: ${T}" -H 'x-actor-id: cart-item-add-smoke' -H 'x-currency: USD' -H 'content-type: application/json')
KEY="cart-item-add-${GITHUB_RUN_ID:-manual}"
PAYLOAD="{\"cartId\":\"${C}\",\"productId\":\"${P}\",\"quantity\":2,\"unitAmount\":{\"amount\":25,\"currency\":\"USD\"}}"
curl -fsS "${COMMON[@]}" -H "idempotency-key: ${KEY}" -X POST "$BASE/api/v1/cart-items" -d "$PAYLOAD" > add.json
jq -e --arg cart "${C}" --arg product "${P}" '.data.cartId == $cart and .data.productId == $product and .data.quantity == 2 and .data.unitAmount.amount == 25 and .meta.useCaseId == "cart.item.add"' add.json
npx wrangler d1 execute emeriona-global-db --remote --json --command="SELECT id,cart_id,product_id,quantity,unit_amount,currency FROM cart_items WHERE cart_id='${C}' AND product_id='${P}';" > persistence.json
jq -e --arg cart "${C}" --arg product "${P}" '.[0].results[0].cart_id == $cart and .[0].results[0].product_id == $product and .[0].results[0].quantity == 2 and .[0].results[0].unit_amount == 25 and .[0].results[0].currency == "USD"' persistence.json
REPLAY_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: ${KEY}" -X POST "$BASE/api/v1/cart-items" -d "$PAYLOAD" -o replay.json -w '%{http_code}')"
test "$REPLAY_STATUS" = '200'
jq -e --arg cart "${C}" --arg product "${P}" '.data.cartId == $cart and .data.productId == $product' replay.json
COMMON2=(-H "x-tenant-id: ${T2}" -H 'x-actor-id: cart-item-add-isolation' -H 'x-currency: USD' -H 'content-type: application/json')
CROSS="{\"cartId\":\"${C}\",\"productId\":\"${P}\",\"quantity\":1,\"unitAmount\":{\"amount\":25,\"currency\":\"USD\"}}"
CROSS_STATUS="$(curl -sS "${COMMON2[@]}" -H "idempotency-key: cart-item-cross-${GITHUB_RUN_ID:-manual}" -X POST "$BASE/api/v1/cart-items" -d "$CROSS" -o cross.json -w '%{http_code}')"
test "$CROSS_STATUS" = '400'
BAD="{\"cartId\":\"${C}\",\"productId\":\"${P}\",\"quantity\":1,\"unitAmount\":{\"amount\":25,\"currency\":\"EUR\"}}"
BAD_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: cart-item-currency-${GITHUB_RUN_ID:-manual}" -X POST "$BASE/api/v1/cart-items" -d "$BAD" -o bad.json -w '%{http_code}')"
test "$BAD_STATUS" = '400'
EMPTY="{\"cartId\":\"${C}\",\"quantity\":1,\"unitAmount\":{\"amount\":25,\"currency\":\"USD\"}}"
EMPTY_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: cart-item-empty-${GITHUB_RUN_ID:-manual}" -X POST "$BASE/api/v1/cart-items" -d "$EMPTY" -o empty.json -w '%{http_code}')"
test "$EMPTY_STATUS" = '400'
test "$(curl -sS -o /tmp/cart-item-get.json -w '%{http_code}' "$BASE/api/v1/cart-items")" = '405'
EVIDENCE="SELECT (SELECT count(*) FROM cart_items WHERE cart_id='${C}' AND product_id='${P}' AND quantity=2 AND unit_amount=25 AND currency='USD') AS item_ok,(SELECT count(*) FROM cart_items WHERE cart_id='${C}' AND id LIKE 'cart-item-add-%') AS item_count,(SELECT count(*) FROM idempotency_records WHERE tenant_id='${T}' AND idempotency_key='${KEY}' AND status='COMPLETED') AS idempotency_ok;"
npx wrangler d1 execute emeriona-global-db --remote --json --command="$EVIDENCE" > evidence.json
jq -e '.[0].results[0].item_ok == 1 and .[0].results[0].item_count == 1 and .[0].results[0].idempotency_ok == 1' evidence.json
