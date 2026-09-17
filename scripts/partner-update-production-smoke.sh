#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="partner-update-smoke-${GITHUB_RUN_ID}"; T2="partner-update-isolation-${GITHUB_RUN_ID}"; P="partner-update-${GITHUB_RUN_ID}"
cleanup() {
  npx wrangler d1 execute emeriona-global-db --remote --command="DELETE FROM partners WHERE id='${P}'; DELETE FROM tenants WHERE id IN ('${T}','${T2}');" >/dev/null 2>&1 || true
}
trap cleanup EXIT
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${T}','Partner Update Smoke ${GITHUB_RUN_ID}','ACTIVE'),('${T2}','Partner Update Isolation ${GITHUB_RUN_ID}','ACTIVE'); INSERT INTO partners (id,tenant_id,legal_name,status) VALUES ('${P}','${T}','Original Partner','PENDING');"
COMMON=(-H "x-tenant-id: ${T}" -H 'x-actor-id: partner-update-smoke' -H 'content-type: application/json')
UPDATE_KEY="partner-update-${GITHUB_RUN_ID}"
curl -fsS "${COMMON[@]}" -H "idempotency-key: ${UPDATE_KEY}" -X POST "$BASE/api/v1/partners/update" -d "{\"partnerId\":\"${P}\",\"legalName\":\"Updated Partner\",\"status\":\"VERIFIED\"}" > update.json
jq -e --arg id "$P" '.data.id == $id and .data.tenantId == "'"$T"'" and .data.legalName == "Updated Partner" and .data.status == "VERIFIED"' update.json
npx wrangler d1 execute emeriona-global-db --remote --json --command="SELECT id,tenant_id,legal_name,status FROM partners WHERE id='${P}';" > persistence.json
jq -e --arg id "$P" --arg tenant "$T" '.[0].results[0].id == $id and .[0].results[0].tenant_id == $tenant and .[0].results[0].legal_name == "Updated Partner" and .[0].results[0].status == "VERIFIED"' persistence.json
REPLAY_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: ${UPDATE_KEY}" -X POST "$BASE/api/v1/partners/update" -d "{\"partnerId\":\"${P}\",\"legalName\":\"Updated Partner\",\"status\":\"VERIFIED\"}" -o replay.json -w '%{http_code}')"
test "$REPLAY_STATUS" = '200'
jq -e --arg id "$P" '.data.id == $id and .data.legalName == "Updated Partner" and .data.status == "VERIFIED"' replay.json
COMMON2=(-H "x-tenant-id: ${T2}" -H 'x-actor-id: partner-update-isolation' -H 'content-type: application/json')
CROSS_STATUS="$(curl -sS "${COMMON2[@]}" -H "idempotency-key: partner-update-cross-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/update" -d "{\"partnerId\":\"${P}\",\"legalName\":\"Cross Tenant Mutation\"}" -o cross.json -w '%{http_code}')"
test "$CROSS_STATUS" = '400'
EMPTY_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: partner-update-empty-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/update" -d "{\"partnerId\":\"${P}\"}" -o empty.json -w '%{http_code}')"
test "$EMPTY_STATUS" = '400'
test "$(curl -sS -o /tmp/partner-update-get.json -w '%{http_code}' "$BASE/api/v1/partners/update")" = '405'
EVIDENCE="SELECT (SELECT count(*) FROM partners WHERE tenant_id='${T}' AND id='${P}' AND legal_name='Updated Partner' AND status='VERIFIED') AS partner_ok,(SELECT count(*) FROM partners WHERE tenant_id='${T2}' AND id='${P}') AS cross_tenant_rows,(SELECT count(*) FROM idempotency_records WHERE tenant_id='${T}' AND idempotency_key='${UPDATE_KEY}' AND status='COMPLETED') AS idempotency_ok;"
npx wrangler d1 execute emeriona-global-db --remote --json --command="$EVIDENCE" > evidence.json
jq -e '.[0].results[0].partner_ok == 1 and .[0].results[0].cross_tenant_rows == 0 and .[0].results[0].idempotency_ok == 1' evidence.json
