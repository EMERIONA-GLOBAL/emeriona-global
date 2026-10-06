#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/production-auth-fixture.sh"
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="catalog-service-update-${GITHUB_RUN_ID:-manual}"
T2="catalog-service-update-isolation-${GITHUB_RUN_ID:-manual}"
UPDATED="Updated Service ${GITHUB_RUN_ID:-manual}"
provision_verification_auth "${T}" "${GITHUB_RUN_ID:-manual}" "catalog-service-update-smoke"
COMMON=(-H "x-tenant-id: ${T}" -H "Authorization: Bearer ${AUTH_TOKEN}" -H 'x-actor-id: catalog-service-update-smoke' -H 'x-currency: USD' -H 'content-type: application/json')
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT OR IGNORE INTO tenants (id,name,status) VALUES ('${T}','Catalog Service Update Smoke','ACTIVE'),('${T2}','Catalog Service Update Isolation','ACTIVE');"

curl -fsS "${COMMON[@]}" -H "idempotency-key: catalog-service-create-${GITHUB_RUN_ID:-manual}" -X POST "$BASE/api/v1/services" -d "{\"ownerId\":\"catalog-service-owner\",\"name\":\"Original Service ${GITHUB_RUN_ID:-manual}\"}" > service-create.json
S="$(jq -r '.data.id // .data.service.id' service-create.json)"
test -n "$S" && test "$S" != 'null'
curl -fsS "${COMMON[@]}" -H "idempotency-key: catalog-service-update-${GITHUB_RUN_ID:-manual}" -X POST "$BASE/api/v1/services/update" -d "{\"serviceId\":\"${S}\",\"name\":\"${UPDATED}\"}" > service-update.json
jq -e --arg s "$S" --arg n "$UPDATED" '.data.id == $s and .data.name == $n and .meta.useCaseId == "catalog.service.update"' service-update.json
STATUS="$(curl -sS -o /tmp/catalog-service-update-get.json -w '%{http_code}' "$BASE/api/v1/services/update")"
test "$STATUS" = '405'
COMMON2=(-H "x-tenant-id: ${T2}" -H 'x-actor-id: catalog-service-update-isolation' -H 'x-currency: USD' -H 'content-type: application/json')
CROSS_STATUS="$(curl -sS "${COMMON2[@]}" -H "idempotency-key: catalog-service-update-cross-${GITHUB_RUN_ID:-manual}" -X POST "$BASE/api/v1/services/update" -d "{\"serviceId\":\"${S}\",\"name\":\"Cross Tenant Attempt\"}" -o /tmp/catalog-service-update-cross.json -w '%{http_code}')"
test "$CROSS_STATUS" = '401'
QUERY="SELECT count(*) AS service_ok FROM services WHERE id='${S}' AND tenant_id='${T}' AND name='${UPDATED}';"
npx wrangler d1 execute emeriona-global-db --remote --json --command="$QUERY" > evidence.json
jq -e '.[0].results[0].service_ok == 1' evidence.json
