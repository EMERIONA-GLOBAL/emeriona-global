#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="c8-smoke-${GITHUB_RUN_ID}"; T2="c8-isolation-${GITHUB_RUN_ID}"; P="c8-partner-${GITHUB_RUN_ID}"; PROD="c8-product-${GITHUB_RUN_ID}"; SRV="c8-service-${GITHUB_RUN_ID}"
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${T}','C8 Smoke ${GITHUB_RUN_ID}','ACTIVE'),('${T2}','C8 Isolation ${GITHUB_RUN_ID}','ACTIVE'); INSERT INTO partners (id,tenant_id,legal_name,status) VALUES ('${P}','${T}','C8 Partner','PENDING');"
COMMON=(-H "x-tenant-id: ${T}" -H 'x-actor-id: c8-smoke' -H 'x-currency: USD' -H 'content-type: application/json')
curl -fsS "${COMMON[@]}" -H "idempotency-key: c8-verify-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/verify" -d "{\"partnerId\":\"${P}\"}" > verify.json
jq -e '.data.status == "VERIFIED" and .data.id != null' verify.json
curl -fsS "${COMMON[@]}" -H "idempotency-key: c8-verify-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/verify" -d "{\"partnerId\":\"${P}\"}" | jq -e --slurpfile v verify.json '.data.id == $v[0].data.id and .data.status == "VERIFIED"'
curl -fsS "${COMMON[@]}" -H "idempotency-key: c8-product-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/products" -d "{\"partnerId\":\"${P}\",\"ownerId\":\"${P}\",\"name\":\"C8 Partner Product\"}" > product.json
jq -e '.data.id != null and .data.partnerId == "'"${P}"'" and .data.status == "DRAFT"' product.json
curl -fsS "${COMMON[@]}" -H "idempotency-key: c8-service-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/services" -d "{\"partnerId\":\"${P}\",\"ownerId\":\"${P}\",\"name\":\"C8 Partner Service\"}" > service.json
jq -e '.data.id != null and .data.partnerId == "'"${P}"'" and .data.status == "DRAFT"' service.json
if curl -sS "${COMMON[@]}" -H "idempotency-key: c8-cross-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/products" -d "{\"partnerId\":\"${P}\",\"ownerId\":\"${P}\",\"name\":\"Should Fail\"}" -o /tmp/c8-cross.json; then
  echo 'cross-tenant request unexpectedly succeeded'; exit 1
fi
npx wrangler d1 execute emeriona-global-db --remote --command="SELECT (SELECT count(*) FROM partners WHERE tenant_id='${T}' AND id='${P}' AND status='VERIFIED') partner_ok,(SELECT count(*) FROM products WHERE tenant_id='${T}' AND partner_id='${P}' AND id=json_extract(readfile('/dev/null'),'$.id')) product_placeholder; SELECT count(*) FROM products WHERE tenant_id='${T}' AND partner_id='${P}'; SELECT count(*) FROM services WHERE tenant_id='${T}' AND partner_id='${P}'; SELECT count(*) FROM idempotency_records WHERE tenant_id='${T}' AND status='COMPLETED'; SELECT count(*) FROM audit_events WHERE tenant_id='${T}' AND outcome='SUCCEEDED';"
test "$(curl -sS -o /tmp/c8-verify-get.json -w '%{http_code}' "$BASE/api/v1/partners/verify")" = '405'
test "$(curl -sS -o /tmp/c8-product-get.json -w '%{http_code}' "$BASE/api/v1/partners/products")" = '405'
test "$(curl -sS -o /tmp/c8-service-get.json -w '%{http_code}' "$BASE/api/v1/partners/services")" = '405'
