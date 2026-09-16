#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="c10-smoke-${GITHUB_RUN_ID}"; T2="c10-isolation-${GITHUB_RUN_ID}"; P="c10-partner-${GITHUB_RUN_ID}"
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${T}','C10 Smoke ${GITHUB_RUN_ID}','ACTIVE'),('${T2}','C10 Isolation ${GITHUB_RUN_ID}','ACTIVE'); INSERT INTO partners (id,tenant_id,legal_name,status) VALUES ('${P}','${T}','C10 Partner','VERIFIED');"
COMMON=(-H "x-tenant-id: ${T}" -H 'x-actor-id: c10-smoke' -H 'x-currency: USD' -H 'content-type: application/json')
curl -fsS "${COMMON[@]}" -H "idempotency-key: c10-offer-create-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/offers" -d "{\"partnerId\":\"${P}\",\"name\":\"C10 Partner Offer\"}" > offer.json
jq -e --arg p "$P" '.data.id != null and .data.partnerId == $p and .data.name == "C10 Partner Offer" and .data.status == "DRAFT"' offer.json
OFFER_ID="$(jq -r '.data.id' offer.json)"
UPDATE_KEY="c10-offer-update-${GITHUB_RUN_ID}"
UPDATE_BODY="{\"offerId\":\"${OFFER_ID}\",\"name\":\"C10 Active Offer\",\"status\":\"ACTIVE\"}"
curl -fsS "${COMMON[@]}" -H "idempotency-key: ${UPDATE_KEY}" -X POST "$BASE/api/v1/partners/offers/update" -d "$UPDATE_BODY" > update.json
jq -e --arg id "$OFFER_ID" '.data.id == $id and .data.name == "C10 Active Offer" and .data.status == "ACTIVE"' update.json
npx wrangler d1 execute emeriona-global-db --remote --json --command="SELECT tenant_id,idempotency_key,status,response_json FROM idempotency_records WHERE tenant_id='${T}' AND idempotency_key='${UPDATE_KEY}';" > replay-before.json
jq -e --arg key "$UPDATE_KEY" '.[0].results[0].idempotency_key == $key and .[0].results[0].status == "COMPLETED" and .[0].results[0].response_json != null' replay-before.json
REPLAY_STATUS="$(curl -sS "${COMMON[@]}" -H "idempotency-key: ${UPDATE_KEY}" -X POST "$BASE/api/v1/partners/offers/update" -d "$UPDATE_BODY" -o replay.json -w '%{http_code}')"
cat replay.json
printf 'Replay HTTP status: %s\n' "$REPLAY_STATUS"
test "$REPLAY_STATUS" = '200'
jq -e --arg id "$OFFER_ID" '.data.id == $id and .data.name == "C10 Active Offer" and .data.status == "ACTIVE"' replay.json
COMMON2=(-H "x-tenant-id: ${T2}" -H 'x-actor-id: c10-isolation' -H 'x-currency: USD' -H 'content-type: application/json')
CROSS_STATUS="$(curl -sS "${COMMON2[@]}" -H "idempotency-key: c10-cross-${GITHUB_RUN_ID}" -X POST "$BASE/api/v1/partners/offers/update" -d "{\"offerId\":\"${OFFER_ID}\",\"status\":\"PAUSED\"}" -o /tmp/c10-cross.json -w '%{http_code}')"
test "$CROSS_STATUS" = '400'
QUERY="SELECT (SELECT count(*) FROM offers WHERE tenant_id='${T}' AND id='${OFFER_ID}' AND partner_id='${P}' AND status='ACTIVE') AS offer_ok,(SELECT count(*) FROM idempotency_records WHERE tenant_id='${T}' AND status='COMPLETED') AS idempotency_ok,(SELECT count(*) FROM audit_events WHERE tenant_id='${T}' AND outcome='SUCCEEDED') AS audit_ok;"
npx wrangler d1 execute emeriona-global-db --remote --json --command="$QUERY" > evidence.json
jq -e '.[0].results[0].offer_ok == 1 and .[0].results[0].idempotency_ok >= 2 and .[0].results[0].audit_ok >= 2' evidence.json
test "$(curl -sS -o /tmp/c10-create-get.json -w '%{http_code}' "$BASE/api/v1/partners/offers")" = '405'
test "$(curl -sS -o /tmp/c10-update-get.json -w '%{http_code}' "$BASE/api/v1/partners/offers/update")" = '405'
