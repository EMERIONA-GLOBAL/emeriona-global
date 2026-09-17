#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="catalog-update-${GITHUB_RUN_ID:-manual}"
T2="catalog-update-isolation-${GITHUB_RUN_ID:-manual}"
C="catalog-update-catalog-${GITHUB_RUN_ID:-manual}"
P="catalog-update-product-${GITHUB_RUN_ID:-manual}"
UPDATED="Updated Product ${GITHUB_RUN_ID:-manual}"
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${T}','Catalog Update Smoke','ACTIVE'),('${T2}','Catalog Update Isolation','ACTIVE'); INSERT INTO catalogs (id,tenant_id,owner_id,partner_id,name,status) VALUES ('${C}','${T}','catalog-update-owner',NULL,'Catalog Update Smoke','DRAFT');"
COMMON=(-H "x-tenant-id: ${T}" -H 'x-actor-id: catalog-update-smoke' -H 'x-currency: USD' -H 'content-type: application/json')
curl -fsS "${COMMON[@]}" -H "idempotency-key: catalog-product-create-${GITHUB_RUN_ID:-manual}" -X POST "$BASE/api/v1/products" -d "{\"ownerId\":\"catalog-update-owner\",\"catalogId\":\"${C}\",\"name\":\"Original Product ${GITHUB_RUN_ID:-manual}\"}" > product-create.json
P="$(jq -r '.data.id // .data.product.id' product-create.json)"
test -n "$P" && test "$P" != 'null'
curl -fsS "${COMMON[@]}" -H "idempotency-key: catalog-product-update-${GITHUB_RUN_ID:-manual}" -X POST "$BASE/api/v1/products/update" -d "{\"productId\":\"${P}\",\"name\":\"${UPDATED}\"}" > product-update.json
jq -e --arg p "$P" --arg n "$UPDATED" '.data.id == $p and .data.name == $n and .meta.useCaseId == "catalog.product.update"' product-update.json
STATUS="$(curl -sS -o /tmp/catalog-product-update-get.json -w '%{http_code}' "$BASE/api/v1/products/update")"
test "$STATUS" = '405'
COMMON2=(-H "x-tenant-id: ${T2}" -H 'x-actor-id: catalog-update-isolation' -H 'x-currency: USD' -H 'content-type: application/json')
CROSS_STATUS="$(curl -sS "${COMMON2[@]}" -H "idempotency-key: catalog-product-update-cross-${GITHUB_RUN_ID:-manual}" -X POST "$BASE/api/v1/products/update" -d "{\"productId\":\"${P}\",\"name\":\"Cross Tenant Attempt\"}" -o /tmp/catalog-product-update-cross.json -w '%{http_code}')"
test "$CROSS_STATUS" = '400'
QUERY="SELECT count(*) AS product_ok FROM products WHERE id='${P}' AND tenant_id='${T}' AND name='${UPDATED}';"
npx wrangler d1 execute emeriona-global-db --remote --json --command="$QUERY" > evidence.json
jq -e '.[0].results[0].product_ok == 1' evidence.json
