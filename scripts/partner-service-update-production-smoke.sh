#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="partner-service-update-smoke-${GITHUB_RUN_ID}"; T2="partner-service-update-isolation-${GITHUB_RUN_ID}"; S="partner-service-${GITHUB_RUN_ID}"; PTR="partner-service-owner-${GITHUB_RUN_ID}"; PTR2="partner-service-other-${GITHUB_RUN_ID}"; OWNER="partner-service-owner-${GITHUB_RUN_ID}"
cleanup() { npx wrangler d1 execute emeriona-global-db --remote --command="DELETE FROM services WHERE id='${S}'; DELETE FROM partners WHERE id IN ('${PTR}','${PTR2}'); DELETE FROM tenants WHERE id IN ('${T}','${T2}');" >/dev/null 2>&1 || true; }
trap cleanup EXIT
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${T}','Partner Service Update Smoke ${GITHUB_RUN_ID}','ACTIVE'),('${T2}','Partner Service Update Isolation ${GITHUB_RUN_ID}','ACTIVE'); INSERT INTO partners (id,tenant_id,legal_name,status) VALUES ('${PTR}','${T}','Partner Service Update Smoke','VERIFIED'),('${PTR2}','${T}','Partner Service Update Other Partner','VERIFIED'); INSERT INTO services (id,tenant_id,owner_id,partner_id,name,status) VALUES ('${S}','${T}','${OWNER}','${PTR}','Original Partner Service','DRAFT');"
COMMON=(-H "x-tenant-id: ${T}" -H 'x-actor-id: partner-service-update-smoke' -H 'x-currency: USD' -H 'content-type: application/json')
UPDATE_KEY="partner-service-update-${GITHUB_RUN_ID}"
curl -fsS "${COMMON[@]}" -H "idempotency-key: ${UPDATE_KEY}" -X POST "$BASE/api/v1/partners/services/update" -d "{\"serviceId\":\"${S}\",\"partnerId\":\"${PTR}\",\"ownerId\":\"${OWNER}-updated\",\"name\":\"Updated Partner Service\",\"status\":\"PUBLISHED\"}" > update.json
jq -e --arg id "$S" --arg partner "$PTR" '.data.id == $id and .data.partnerId == $partner and .data.ownerId == "'"${OWNER}-updated"'" and .data.name == "Updated Partner Service" and .data.status == "PUBLISHED"' update.json
npx wrangler d1 execute emeriona-global-db --remote --json --command="SELECT id,tenant_id,owner_id,partner_id,name,status FROM services WHERE id='${S}';" > persistence.json
jq -e --arg id "$S" --arg tenant "$T" --arg partner "$PTR" '.[0].results[0].id == $id and .[0].results[0].tenant_id == $tenant and .[0].results[0].partner_id == $partner and .[0].results[0].name == "Updated Partner Service" and .[0].results[0].status == "PUBLISHED"' persistence.json
REPLAY_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: ${UPDATE_KEY}" -X POST "$BASE/api/v1/partners/services/update" -d "{\"serviceId\":\"${S}\",\"partnerId\":\"${PTR}\",\"ownerId\":\"${OWNER}-updated\",\"name\":\"Updated Partner Service\",\"status\":\"PUBLISHED\"}" -o replay.json -w '%{http_code}')"
test "$REPLAY_STATUS" = '200'; jq -e --arg id "$S" '.data.id == $id and .data.name == "Updated Partner Service"' replay.json
PARTNER_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: partner-service-partner-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/services/update" -d "{\"serviceId\":\"${S}\",\"partnerId\":\"${PTR2}\",\"name\":\"Cross Partner Mutation\"}" -o partner.json -w '%{http_code}')"
test "$PARTNER_STATUS" = '400'
COMMON2=(-H "x-tenant-id: ${T2}" -H 'x-actor-id: partner-service-update-isolation' -H 'x-currency: USD' -H 'content-type: application/json')
CROSS_STATUS="$(curl -sS "${COMMON2[@]}" -H "idempotency-key: partner-service-cross-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/services/update" -d "{\"serviceId\":\"${S}\",\"partnerId\":\"${PTR}\",\"name\":\"Cross Tenant Mutation\"}" -o cross.json -w '%{http_code}')"
test "$CROSS_STATUS" = '400'
EMPTY_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: partner-service-empty-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/services/update" -d "{\"serviceId\":\"${S}\",\"partnerId\":\"${PTR}\"}" -o empty.json -w '%{http_code}')"
test "$EMPTY_STATUS" = '400'
test "$(curl -sS -o /tmp/partner-service-update-get.json -w '%{http_code}' "$BASE/api/v1/partners/services/update")" = '405'
EVIDENCE="SELECT (SELECT count(*) FROM services WHERE tenant_id='${T}' AND id='${S}' AND partner_id='${PTR}' AND name='Updated Partner Service' AND status='PUBLISHED') AS service_ok,(SELECT count(*) FROM services WHERE tenant_id='${T2}' AND id='${S}') AS cross_tenant_rows,(SELECT count(*) FROM idempotency_records WHERE tenant_id='${T}' AND idempotency_key='${UPDATE_KEY}' AND status='COMPLETED') AS idempotency_ok;"
npx wrangler d1 execute emeriona-global-db --remote --json --command="$EVIDENCE" > evidence.json
jq -e '.[0].results[0].service_ok == 1 and .[0].results[0].cross_tenant_rows == 0 and .[0].results[0].idempotency_ok == 1' evidence.json
