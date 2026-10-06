#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/production-auth-fixture.sh"
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="c9-smoke-${GITHUB_RUN_ID}"; T2="c9-isolation-${GITHUB_RUN_ID}"; P="c9-partner-${GITHUB_RUN_ID}"; C="c9-catalog-${GITHUB_RUN_ID}"; PC="c9-partner-catalog-${GITHUB_RUN_ID}"
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT OR IGNORE INTO tenants (id,name,status) VALUES ('${T}','C9 Smoke ${GITHUB_RUN_ID}','ACTIVE'),('${T2}','C9 Isolation ${GITHUB_RUN_ID}','ACTIVE'); INSERT INTO partners (id,tenant_id,legal_name,status) VALUES ('${P}','${T}','C9 Partner','VERIFIED'); INSERT INTO catalogs (id,tenant_id,owner_id,partner_id,name,status) VALUES ('${C}','${T}','c9-owner',NULL,'C9 Catalog','DRAFT'),('${PC}','${T}','${P}','${P}','C9 Partner Catalog','DRAFT');"
provision_verification_auth "${T}" "${GITHUB_RUN_ID:-manual}" "c9-smoke"
COMMON=(-H "x-tenant-id: ${T}" -H "Authorization: Bearer ${AUTH_TOKEN}" -H "x-actor-id: ${AUTH_ACTOR_ID}" -H 'x-currency: USD' -H 'content-type: application/json')
curl -fsS "${COMMON[@]}" -H "idempotency-key: c9-catalog-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/catalogs/publish" -d "{\"catalogId\":\"${C}\"}" > catalog.json
jq -e --arg c "$C" '.data.catalog.id == $c and .data.catalog.status == "PUBLISHED" and .data.publishedAt != null' catalog.json
curl -fsS "${COMMON[@]}" -H "idempotency-key: c9-catalog-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/catalogs/publish" -d "{\"catalogId\":\"${C}\"}" | jq -e --arg c "$C" '.data.catalog.id == $c and .data.catalog.status == "PUBLISHED"'
curl -fsS "${COMMON[@]}" -H "idempotency-key: c9-partner-catalog-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/catalogs/publish" -d "{\"catalogId\":\"${PC}\",\"partnerId\":\"${P}\"}" > partner-catalog.json
jq -e --arg c "$PC" '.data.catalog.id == $c and .data.catalog.status == "PUBLISHED" and .data.publishedAt != null' partner-catalog.json
COMMON2=(-H "x-tenant-id: ${T2}" -H "x-actor-id: ${AUTH_ACTOR_ID}" -H 'x-currency: USD' -H 'content-type: application/json')
CROSS_STATUS="$(curl -sS "${COMMON2[@]}" -H "idempotency-key: c9-cross-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/catalogs/publish" -d "{\"catalogId\":\"${C}\"}" -o /tmp/c9-cross.json -w '%{http_code}')"
test "$CROSS_STATUS" = '401'
CROSS_PARTNER_STATUS="$(curl -sS "${COMMON2[@]}" -H "idempotency-key: c9-cross-partner-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/catalogs/publish" -d "{\"catalogId\":\"${PC}\",\"partnerId\":\"${P}\"}" -o /tmp/c9-cross-partner.json -w '%{http_code}')"
test "$CROSS_PARTNER_STATUS" = '401'
QUERY="SELECT (SELECT count(*) FROM catalogs WHERE tenant_id='${T}' AND id='${C}' AND status='PUBLISHED') AS catalog_ok,(SELECT count(*) FROM catalogs WHERE tenant_id='${T}' AND id='${PC}' AND partner_id='${P}' AND status='PUBLISHED') AS partner_catalog_ok,(SELECT count(*) FROM idempotency_records WHERE tenant_id='${T}' AND status='COMPLETED') AS idempotency_ok,(SELECT count(*) FROM audit_events WHERE tenant_id='${T}' AND outcome='SUCCEEDED') AS audit_ok;"
npx wrangler d1 execute emeriona-global-db --remote --json --command="$QUERY" > evidence.json
jq -e '.[0].results[0].catalog_ok == 1 and .[0].results[0].partner_catalog_ok == 1 and .[0].results[0].idempotency_ok >= 2 and .[0].results[0].audit_ok >= 2' evidence.json
test "$(curl -sS -o /tmp/c9-catalog-get.json -w '%{http_code}' "$BASE/api/v1/catalogs/publish")" = '405'
test "$(curl -sS -o /tmp/c9-partner-catalog-get.json -w '%{http_code}' "$BASE/api/v1/partners/catalogs/publish")" = '405'
