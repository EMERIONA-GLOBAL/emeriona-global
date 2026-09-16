#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="c8-smoke-${GITHUB_RUN_ID}"; T2="c8-isolation-${GITHUB_RUN_ID}"; P="c8-partner-${GITHUB_RUN_ID}"
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${T}','C8 Smoke ${GITHUB_RUN_ID}','ACTIVE'),('${T2}','C8 Isolation ${GITHUB_RUN_ID}','ACTIVE'); INSERT INTO partners (id,tenant_id,legal_name,status) VALUES ('${P}','${T}','C8 Partner','PENDING');"
COMMON=(-H "x-tenant-id: ${T}" -H 'x-actor-id: c8-smoke' -H 'x-currency: USD' -H 'content-type: application/json')
curl -fsS "${COMMON[@]}" -H "idempotency-key: c8-verify-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/verify" -d "{\"partnerId\":\"${P}\"}" > verify.json
jq -e '.data.status == "VERIFIED" and .data.id != null' verify.json
curl -fsS "${COMMON[@]}" -H "idempotency-key: c8-verify-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/verify" -d "{\"partnerId\":\"${P}\"}" | jq -e --slurpfile v verify.json '.data.id == $v[0].data.id and .data.status == "VERIFIED"'
curl -fsS "${COMMON[@]}" -H "idempotency-key: c8-product-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/products" -d "{\"partnerId\":\"${P}\",\"ownerId\":\"${P}\",\"name\":\"C8 Partner Product\"}" > product.json
jq -e --arg p "$P" '.data.id != null and .data.partnerId == $p and .data.status == "DRAFT"' product.json
curl -fsS "${COMMON[@]}" -H "idempotency-key: c8-service-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/services" -d "{\"partnerId\":\"${P}\",\"ownerId\":\"${P}\",\"name\":\"C8 Partner Service\"}" > service.json
jq -e --arg p "$P" '.data.id != null and .data.partnerId == $p and .data.status == "DRAFT"' service.json
COMMON2=(-H "x-tenant-id: ${T2}" -H 'x-actor-id: c8-isolation' -H 'x-currency: USD' -H 'content-type: application/json')
CROSS_STATUS="$(curl -sS "${COMMON2[@]}" -H "idempotency-key: c8-cross-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/products" -d "{\"partnerId\":\"${P}\",\"ownerId\":\"${P}\",\"name\":\"Should Fail\"}" -o /tmp/c8-cross.json -w '%{http_code}')"
test "$CROSS_STATUS" = '400'
QUERY="SELECT (SELECT count(*) FROM partners WHERE tenant_id='${T}' AND id='${P}' AND status='VERIFIED') AS partner_ok,(SELECT count(*) FROM products WHERE tenant_id='${T}' AND partner_id='${P}') AS product_ok,(SELECT count(*) FROM services WHERE tenant_id='${T}' AND partner_id='${P}') AS service_ok,(SELECT count(*) FROM idempotency_records WHERE tenant_id='${T}' AND status='COMPLETED') AS idempotency_ok,(SELECT count(*) FROM audit_events WHERE tenant_id='${T}' AND outcome='SUCCEEDED') AS audit_ok;"
npx wrangler d1 execute emeriona-global-db --remote --json --command="$QUERY" > evidence.json
jq -e '.[0].results[0].partner_ok == 1 and .[0].results[0].product_ok == 1 and .[0].results[0].service_ok == 1 and .[0].results[0].idempotency_ok >= 3 and .[0].results[0].audit_ok >= 3' evidence.json
test "$(curl -sS -o /tmp/c8-verify-get.json -w '%{http_code}' "$BASE/api/v1/partners/verify")" = '405'
test "$(curl -sS -o /tmp/c8-product-get.json -w '%{http_code}' "$BASE/api/v1/partners/products")" = '405'
test "$(curl -sS -o /tmp/c8-service-get.json -w '%{http_code}' "$BASE/api/v1/partners/services")" = '405'
