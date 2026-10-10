#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/production-auth-fixture.sh"
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="partner-product-update-smoke-${GITHUB_RUN_ID:-manual}"
T2="partner-product-update-isolation-${GITHUB_RUN_ID:-manual}"
P="partner-product-${GITHUB_RUN_ID:-manual}"
PTR="partner-product-owner-${GITHUB_RUN_ID:-manual}"
OWNER="partner-owner-${GITHUB_RUN_ID:-manual}"
RUN_ID="${GITHUB_RUN_ID:-manual}"

cleanup() {
  npx wrangler d1 execute emeriona-global-db --remote --command="
    DELETE FROM idempotency_records WHERE tenant_id IN ('${T}','${T2}');
    DELETE FROM auth_role_permissions WHERE tenant_id IN ('${T}','${T2}');
    DELETE FROM auth_principal_roles WHERE tenant_id IN ('${T}','${T2}');
    DELETE FROM auth_sessions WHERE tenant_id IN ('${T}','${T2}');
    DELETE FROM auth_identities WHERE tenant_id IN ('${T}','${T2}');
    DELETE FROM auth_principals WHERE tenant_id IN ('${T}','${T2}');
    DELETE FROM auth_roles WHERE tenant_id IN ('${T}','${T2}');
    DELETE FROM auth_permissions WHERE tenant_id IN ('${T}','${T2}');
    DELETE FROM products WHERE id='${P}' AND tenant_id='${T}';
    DELETE FROM partners WHERE id='${PTR}' AND tenant_id='${T}';
    DELETE FROM tenants WHERE id IN ('${T}','${T2}');
  " >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Provision the temporary identity before constructing authenticated requests.
provision_verification_auth "${T}" "${RUN_ID}" "partner-product-update-smoke"
COMMON=(-H "x-tenant-id: ${T}" -H "Authorization: Bearer ${AUTH_TOKEN}" -H "x-actor-id: ${AUTH_ACTOR_ID}" -H 'x-currency: USD' -H 'content-type: application/json')

npx wrangler d1 execute emeriona-global-db --remote --command="INSERT OR IGNORE INTO tenants (id,name,status) VALUES ('${T}','Partner Product Update Smoke ${RUN_ID}','ACTIVE'),('${T2}','Partner Product Update Isolation ${RUN_ID}','ACTIVE'); INSERT INTO partners (id,tenant_id,legal_name,status) VALUES ('${PTR}','${T}','Partner Product Update Smoke','VERIFIED'); INSERT INTO products (id,tenant_id,owner_id,partner_id,name,status) VALUES ('${P}','${T}','${OWNER}','${PTR}','Original Partner Product','DRAFT');"

UPDATE_KEY="partner-product-update-${RUN_ID}"
UPDATE_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: ${UPDATE_KEY}" -X POST "$BASE/api/v1/partners/products/update" -d "{\"productId\":\"${P}\",\"partnerId\":\"${PTR}\",\"ownerId\":\"${OWNER}-updated\",\"name\":\"Updated Partner Product\",\"status\":\"PUBLISHED\"}" -o update.json -w "%{http_code}")"
test "$UPDATE_STATUS" = "200"
jq -e --arg id "$P" --arg partner "$PTR" --arg owner "${OWNER}-updated" '.data.id == $id and .data.partnerId == $partner and .data.ownerId == $owner and .data.name == "Updated Partner Product" and .data.status == "PUBLISHED"' update.json
npx wrangler d1 execute emeriona-global-db --remote --json --command="SELECT id,tenant_id,owner_id,partner_id,name,status FROM products WHERE id='${P}';" > persistence.json
jq -e --arg id "$P" --arg tenant "$T" --arg partner "$PTR" --arg owner "${OWNER}-updated" '.[0].results[0].id == $id and .[0].results[0].tenant_id == $tenant and .[0].results[0].partner_id == $partner and .[0].results[0].owner_id == $owner and .[0].results[0].name == "Updated Partner Product" and .[0].results[0].status == "PUBLISHED"' persistence.json
REPLAY_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: ${UPDATE_KEY}" -X POST "$BASE/api/v1/partners/products/update" -d "{\"productId\":\"${P}\",\"partnerId\":\"${PTR}\",\"ownerId\":\"${OWNER}-updated\",\"name\":\"Updated Partner Product\",\"status\":\"PUBLISHED\"}" -o replay.json -w '%{http_code}')"
test "$REPLAY_STATUS" = '200'
jq -e --arg id "$P" '.data.id == $id and .data.name == "Updated Partner Product"' replay.json
COMMON2=(-H "x-tenant-id: ${T2}" -H "Authorization: Bearer ${AUTH_TOKEN}" -H "x-actor-id: ${AUTH_ACTOR_ID}" -H 'x-currency: USD' -H 'content-type: application/json')
CROSS_STATUS="$(curl -sS "${COMMON2[@]}" -H "idempotency-key: partner-product-cross-${RUN_ID}" -X POST "$BASE/api/v1/partners/products/update" -d "{\"productId\":\"${P}\",\"partnerId\":\"${PTR}\",\"name\":\"Cross Tenant Mutation\"}" -o cross.json -w '%{http_code}')"
test "$CROSS_STATUS" = '401'
EMPTY_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: partner-product-empty-${RUN_ID}" -X POST "$BASE/api/v1/partners/products/update" -d "{\"productId\":\"${P}\",\"partnerId\":\"${PTR}\"}" -o empty.json -w '%{http_code}')"
test "$EMPTY_STATUS" = '400'
test "$(curl -sS -o /tmp/partner-product-update-get.json -w '%{http_code}' "$BASE/api/v1/partners/products/update")" = '405'
EVIDENCE="SELECT (SELECT count(*) FROM products WHERE tenant_id='${T}' AND id='${P}' AND partner_id='${PTR}' AND name='Updated Partner Product' AND status='PUBLISHED') AS product_ok,(SELECT count(*) FROM products WHERE tenant_id='${T2}' AND id='${P}') AS cross_tenant_rows,(SELECT count(*) FROM idempotency_records WHERE tenant_id='${T}' AND idempotency_key='${UPDATE_KEY}' AND status='COMPLETED') AS idempotency_ok;"
npx wrangler d1 execute emeriona-global-db --remote --json --command="$EVIDENCE" > evidence.json
jq -e '.[0].results[0].product_ok == 1 and .[0].results[0].cross_tenant_rows == 0 and .[0].results[0].idempotency_ok == 1' evidence.json
